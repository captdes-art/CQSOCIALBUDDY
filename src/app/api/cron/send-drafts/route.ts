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
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Find pending drafts that should be auto-sent
  // Exclude flagged conversations — those require explicit admin approval
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

  for (const draft of drafts) {
    const conv = draft.conversations as unknown as {
      customer_platform_id: string;
      platform: string;
      source_type: string;
    };

    // Only auto-send DMs (comments are handled differently)
    if (conv.source_type === "comment") continue;

    try {
      const messageId = await sendFacebookDM(
        conv.customer_platform_id,
        draft.draft_content
      );

      // Update draft status
      await supabase
        .from("ai_drafts")
        .update({
          status: "sent",
          approved_by: "auto-draft-cron",
          approved_at: now,
          sent_at: now,
        })
        .eq("id", draft.id);

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
      console.error("[cron:send-drafts] Failed to send draft:", draft.id, err);
      // Don't update status — will retry on next cron run
    }
  }

  return NextResponse.json({ sent: sentCount, total: drafts.length });
}
