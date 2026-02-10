import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  handleVerificationChallenge,
} from "@/lib/meta/webhooks";
import { processIncomingMessage } from "@/lib/ai/processor";
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
 * Returns 200 immediately, then processes async.
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

  // Determine platform from payload
  const platform: Platform =
    payload.object === "instagram" ? "instagram_dm" : "facebook_messenger";

  for (const entry of payload.entry) {
    console.log("[webhook] Entry id:", entry.id, "messaging:", entry.messaging?.length || 0, "changes:", entry.changes?.length || 0);

    // --- Handle DMs (entry.messaging) ---
    const messagingEvents = entry.messaging || [];

    for (const event of messagingEvents) {
      console.log("[webhook] DM event from:", event.sender.id, "text:", event.message?.text?.slice(0, 50));
      if (!event.message?.text) continue; // skip non-text messages for now

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
      });
    }

    // --- Handle comments (entry.changes) ---
    const changeEvents = entry.changes || [];

    for (const change of changeEvents) {
      if (payload.object === "page" && change.field === "feed") {
        // Facebook Page comment
        const value = change.value as MetaFeedChangeValue;

        // Only process new comments (not edits/removals), only comment items
        if (value.verb !== "add" || value.item !== "comment") continue;
        if (!value.message) continue;

        // Skip comments from our own page (don't process our own replies)
        if (value.from.id === entry.id) continue;

        processIncomingMessage({
          platform: "facebook_messenger",
          senderId: value.from.id,
          recipientId: entry.id, // page ID
          messageId: value.comment_id,
          text: value.message,
          timestamp: value.created_time * 1000,
          sourceType: "comment",
          sourcePostId: value.post_id,
          commentId: value.comment_id,
          senderName: value.from.name || null,
        }).catch((err) => {
          console.error("Error processing FB comment:", err);
        });
      } else if (payload.object === "instagram" && change.field === "comments") {
        // Instagram comment
        const value = change.value as MetaInstagramCommentValue;

        if (!value.text) continue;

        processIncomingMessage({
          platform: "instagram_dm",
          senderId: value.from.id,
          recipientId: entry.id, // IG user ID
          messageId: value.id,
          text: value.text,
          timestamp: entry.time * 1000,
          sourceType: "comment",
          sourcePostId: value.media.id,
          commentId: value.id,
          senderName: value.from.username || null,
        }).catch((err) => {
          console.error("Error processing IG comment:", err);
        });
      }
    }
  }

  // Return 200 immediately as Meta requires
  return NextResponse.json({ status: "ok" });
}
