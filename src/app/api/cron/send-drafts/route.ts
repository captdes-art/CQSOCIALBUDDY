import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendFacebookDM } from "@/lib/meta/send";

/**
 * Cron job: Auto-send pending drafts that have passed their auto_send_at time.
 * Runs every minute via Vercel Cron.
 *
 * This handles the "auto-draft" mode: drafts are created with a future
 * auto_send_at timestamp. If the admin hasn't manually approved/rejected
 * the draft by that time, it gets sent automatically.
 */
export async function GET(request: NextRequest) {
  // KILL SWITCH (added 2026-05-02 by Des to track down DM spam):
  // The schedule has been removed from vercel.json AND this route refuses
  // to do any work unless AUTO_SEND_ENABLED=true is set on Vercel.
  // To re-enable later, restore the schedule in vercel.json AND set
  // AUTO_SEND_ENABLED=true in env vars.
  if (process.env.AUTO_SEND_ENABLED !== "true") {
    console.warn("[cron:send-drafts] Hit while kill switch active — refusing to send.");
    return NextResponse.json({ sent: 0, killSwitch: true });
  }

  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Find pending drafts that should be auto-sent.
  // Safety nets (added 2026-05-02 after the 128/1415-message runaway loop):
  //   1. status MUST be "pending"
  //   2. sent_at MUST be null — even if status update fails, a draft with
  //      a non-null sent_at can NEVER be picked up again
  //   3. exclude flagged conversations
  const { data: drafts, error } = await supabase
    .from("ai_drafts")
    .select(`
      id,
      conversation_id,
      draft_content,
      conversations!inner (
        customer_platform_id,
        platform,
        source_type,
        status
      )
    `)
    .eq("status", "pending")
    .is("sent_at", null)
    .not("auto_send_at", "is", null)
    .lte("auto_send_at", now)
    .neq("conversations.status", "flagged")
    .limit(10); // Process max 10 per run to stay within limits

  if (error) {
    console.error("[cron:send-drafts] Query failed:", error);
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }

  if (!drafts?.length) {
    return NextResponse.json({ sent: 0 });
  }

  console.log("[cron:send-drafts] Found", drafts.length, "drafts to auto-send");

  let sentCount = 0;
  let skipped = 0;

  for (const draft of drafts) {
    const conv = draft.conversations as unknown as {
      customer_platform_id: string;
      platform: string;
      source_type: string;
    };

    // Only auto-send DMs (comments are handled differently)
    if (conv.source_type === "comment") continue;

    // Circuit breaker: never send more than 1 outbound message to the same
    // recipient within the last hour. Even if every other safeguard fails,
    // the worst case is one extra message — not 128.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", draft.conversation_id)
      .eq("direction", "outbound")
      .gte("sent_at", oneHourAgo);

    if ((recentCount ?? 0) > 0) {
      console.warn(
        "[cron:send-drafts] Circuit breaker: already sent",
        recentCount,
        "msg(s) to this conversation in last hour. Skipping draft:",
        draft.id
      );
      // Mark this draft as skipped so it never gets picked up again
      await supabase
        .from("ai_drafts")
        .update({ status: "rejected", sent_at: now })
        .eq("id", draft.id);
      skipped++;
      continue;
    }

    // CRITICAL: mark the draft as sent BEFORE actually sending. If marking
    // fails, refuse to send. This makes runaway loops impossible — the
    // record-keeping must succeed first, or the send is aborted.
    const { error: markErr } = await supabase
      .from("ai_drafts")
      .update({
        status: "sent",
        sent_at: now,
        approved_at: now,
        // approved_by intentionally left null for auto-sends — this column
        // is a UUID FK to profiles and rejects arbitrary strings (the
        // original bug was setting it to "auto-draft-cron")
      })
      .eq("id", draft.id)
      .eq("status", "pending") // optimistic lock: only update if still pending
      .is("sent_at", null);

    if (markErr) {
      console.error(
        "[cron:send-drafts] Failed to mark draft as sent — REFUSING to send to avoid loop. draft:",
        draft.id,
        "error:",
        markErr
      );
      continue;
    }

    try {
      const messageId = await sendFacebookDM(
        conv.customer_platform_id,
        draft.draft_content
      );

      // Store outbound message
      await supabase.from("messages").insert({
        conversation_id: draft.conversation_id,
        platform_message_id: messageId,
        direction: "outbound",
        content: draft.draft_content,
        content_type: "text",
        sender_name: "Celtic Quest AI",
        sent_at: now,
      });

      // Update conversation
      await supabase
        .from("conversations")
        .update({
          status: "sent",
          last_message_at: now,
          last_message_preview: draft.draft_content.slice(0, 100),
        })
        .eq("id", draft.conversation_id);

      // Log activity
      await supabase.from("activity_log").insert({
        conversation_id: draft.conversation_id,
        action: "reply_sent",
        metadata: {
          draft_id: draft.id,
          sent_by: "auto-draft-cron",
          platform_message_id: messageId,
        },
      });

      sentCount++;
      console.log("[cron:send-drafts] Sent draft:", draft.id);
    } catch (err) {
      // Send failed AFTER marking as sent. We do NOT roll back the mark —
      // a stuck send is far better than a runaway loop. Mark as failed for
      // visibility.
      console.error("[cron:send-drafts] Send failed after mark — leaving draft marked sent. draft:", draft.id, err);
      await supabase
        .from("ai_drafts")
        .update({ status: "failed" })
        .eq("id", draft.id);
    }
  }

  return NextResponse.json({ sent: sentCount, skipped, total: drafts.length });
}
