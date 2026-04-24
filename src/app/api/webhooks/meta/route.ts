import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import {
  verifyWebhookSignature,
  handleVerificationChallenge,
} from "@/lib/meta/webhooks";
import { processIncomingMessage } from "@/lib/ai/processor";
import { createAdminClient } from "@/lib/supabase/server";
import type {
  MetaWebhookPayload,
  MetaFeedChangeValue,
  MetaInstagramCommentValue,
  Platform,
} from "@/types";

/**
 * GET — Meta webhook verification challenge.
 * Meta sends this when you first set up the webhook subscription.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN!;
  const result = handleVerificationChallenge(mode, token, challenge, verifyToken);

  return new NextResponse(result.body, { status: result.status });
}

/**
 * POST — Receive incoming messages and comments from Meta.
 *
 * DMs are processed inline (fast — Claude API + auto-send).
 * Comments are processed in the background via after() because they
 * include a 15-45s delay to look natural before replying.
 *
 * Meta requires a 200 response within 20 seconds.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.META_APP_SECRET!;

  console.log("[webhook] POST received, body length:", rawBody.length);

  // Verify the request came from Meta
  if (!verifyWebhookSignature(rawBody, signature, appSecret)) {
    console.log("[webhook] Signature verification FAILED");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  console.log("[webhook] Signature verified OK");

  const payload: MetaWebhookPayload = JSON.parse(rawBody);
  console.log("[webhook] Object:", payload.object, "Entries:", payload.entry.length);

  // Log webhook event for pages_manage_metadata compliance
  try {
    const admin = createAdminClient();
    for (const entry of payload.entry) {
      const eventType = entry.messaging?.length
        ? "message"
        : entry.changes?.[0]?.field || "unknown";

      await admin.from("webhook_events").insert({
        platform: payload.object === "instagram" ? "instagram" : "facebook",
        event_type: eventType,
        page_id: entry.id,
        payload: entry as unknown as Record<string, never>,
        processed: false,
      });
    }
  } catch (err) {
    console.error("[webhook] Failed to log webhook event:", err);
  }

  // Determine platform from payload
  const platform: Platform =
    payload.object === "instagram" ? "instagram_dm" : "facebook_messenger";

  // DM tasks run inline (fast enough to complete within Meta's timeout)
  const dmTasks: Promise<void>[] = [];

  // Comment tasks run in background after returning 200
  // (they include a 15-45s delay before replying)
  const commentTasks: (() => Promise<void>)[] = [];

  for (const entry of payload.entry) {
    console.log(
      "[webhook] Entry id:", entry.id,
      "messaging:", entry.messaging?.length || 0,
      "changes:", entry.changes?.length || 0
    );

    // --- Handle DMs (entry.messaging) ---
    const messagingEvents = entry.messaging || [];

    for (const event of messagingEvents) {
      console.log("[webhook] DM event from:", event.sender.id, "text:", event.message?.text?.slice(0, 50), "is_echo:", event.message?.is_echo);
      if (!event.message?.text) continue;

      // Skip echo messages (our own outbound replies echoed back by Meta)
      if (event.message.is_echo) {
        console.log("[webhook] Skipping echo message from:", event.sender.id);
        continue;
      }

      dmTasks.push(
        processIncomingMessage({
          platform,
          senderId: event.sender.id,
          recipientId: event.recipient.id,
          messageId: event.message.mid,
          text: event.message.text,
          timestamp: event.timestamp,
          sourceType: "dm",
        }).catch((err) => {
          console.error("Error processing DM:", err);
        })
      );
    }

    // --- Handle comments (entry.changes) ---
    const changeEvents = entry.changes || [];

    for (const change of changeEvents) {
      if (payload.object === "page" && change.field === "feed") {
        const value = change.value as MetaFeedChangeValue;

        if (value.verb !== "add" || value.item !== "comment") continue;
        if (!value.message) continue;

        // Skip comments from our own page
        if (value.from.id === entry.id) continue;

        // Queue comment processing for background execution
        commentTasks.push(() =>
          processIncomingMessage({
            platform: "facebook_messenger",
            senderId: value.from.id,
            recipientId: entry.id,
            messageId: value.comment_id,
            text: value.message!,
            timestamp: value.created_time * 1000,
            sourceType: "comment",
            sourcePostId: value.post_id,
            commentId: value.comment_id,
            senderName: value.from.name || null,
          }).catch((err) => {
            console.error("Error processing FB comment:", err);
          })
        );
      } else if (payload.object === "instagram" && change.field === "comments") {
        const value = change.value as MetaInstagramCommentValue;

        if (!value.text) continue;

        commentTasks.push(() =>
          processIncomingMessage({
            platform: "instagram_dm",
            senderId: value.from.id,
            recipientId: entry.id,
            messageId: value.id,
            text: value.text,
            timestamp: entry.time * 1000,
            sourceType: "comment",
            sourcePostId: value.media.id,
            commentId: value.id,
            senderName: value.from.username || null,
          }).catch((err) => {
            console.error("Error processing IG comment:", err);
          })
        );
      }
    }
  }

  // Await DM processing (completes within a few seconds)
  if (dmTasks.length > 0) {
    await Promise.allSettled(dmTasks);
    console.log("[webhook] DM tasks complete:", dmTasks.length);
  }

  // Schedule comment processing in the background after response is sent.
  // Comments include a 15-45s delay before replying so they must not block.
  if (commentTasks.length > 0) {
    console.log("[webhook] Scheduling", commentTasks.length, "comment tasks in background");
    after(async () => {
      // Process comments sequentially to avoid rate limits
      for (const task of commentTasks) {
        await task();
      }
      console.log("[webhook:after] All comment tasks complete");
    });
  }

  console.log("[webhook] Returning 200");
  return NextResponse.json({ status: "ok" });
}
