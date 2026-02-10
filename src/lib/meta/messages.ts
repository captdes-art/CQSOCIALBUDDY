import { createAdminClient } from "@/lib/supabase/server";
import { sendMessage } from "./client";
import type { Platform } from "@/types";

// Rate limiting: track sends per hour per platform
const sendCounts = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_PER_HOUR = 180; // stay under Meta's 200/hr limit

function checkRateLimit(platform: string): boolean {
  const now = Date.now();
  const key = platform;
  const entry = sendCounts.get(key);

  if (!entry || now > entry.resetAt) {
    sendCounts.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }

  if (entry.count >= RATE_LIMIT_PER_HOUR) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Send an approved reply back to the customer via Meta Graph API.
 * Handles rate limiting and logs the activity.
 */
export async function sendReply(params: {
  conversationId: string;
  draftId: string;
  content: string;
  approvedBy: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Get conversation details
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", params.conversationId)
    .single();

  if (convError || !conversation) {
    return { success: false, error: "Conversation not found" };
  }

  // Determine platform
  const metaPlatform: "facebook" | "instagram" =
    conversation.platform === "facebook_messenger" ? "facebook" : "instagram";

  // Check rate limit
  if (!checkRateLimit(metaPlatform)) {
    return {
      success: false,
      error: "Rate limit reached. Message queued for later.",
    };
  }

  // Get access token for the platform
  const { data: account } = await supabase
    .from("platform_accounts")
    .select("*")
    .eq("platform", metaPlatform)
    .eq("is_active", true)
    .single();

  if (!account) {
    return { success: false, error: `No active ${metaPlatform} account configured` };
  }

  try {
    // Send via Meta API
    const { messageId } = await sendMessage({
      recipientId: conversation.customer_platform_id,
      message: params.content,
      accessToken: account.access_token,
      pageId: account.platform_account_id,
      platform: metaPlatform,
    });

    // Store the outbound message
    await supabase.from("messages").insert({
      conversation_id: params.conversationId,
      platform_message_id: messageId,
      direction: "outbound",
      content: params.content,
      content_type: "text",
      sender_name: "Celtic Quest AI",
      sent_at: new Date().toISOString(),
    });

    // Update draft status
    await supabase
      .from("ai_drafts")
      .update({
        status: "sent",
        approved_by: params.approvedBy,
        approved_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      })
      .eq("id", params.draftId);

    // Update conversation status
    await supabase
      .from("conversations")
      .update({
        status: "sent",
        last_message_at: new Date().toISOString(),
        last_message_preview: params.content.slice(0, 100),
      })
      .eq("id", params.conversationId);

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: params.approvedBy,
      conversation_id: params.conversationId,
      action: "reply_sent",
      metadata: { draft_id: params.draftId, platform_message_id: messageId },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
