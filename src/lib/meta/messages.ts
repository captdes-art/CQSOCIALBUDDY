import { createAdminClient } from "@/lib/supabase/server";
import { sendMessage, replyToComment } from "./client";
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
 * Handles both DM replies and comment replies.
 * Includes rate limiting and activity logging.
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

  const isComment = conversation.source_type === "comment";

  // Check if this is a test conversation (from test-pipeline endpoint)
  const isTestConversation =
    conversation.customer_platform_id?.startsWith("test-");

  let messageId: string;

  if (isTestConversation) {
    // Skip Meta API for test conversations — just simulate sending
    messageId = `test-reply-${Date.now()}`;
  } else {
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
      if (isComment) {
        // For comments, find the most recent inbound comment ID to reply to
        const { data: lastInboundMsg } = await supabase
          .from("messages")
          .select("platform_message_id")
          .eq("conversation_id", params.conversationId)
          .eq("direction", "inbound")
          .order("sent_at", { ascending: false })
          .limit(1)
          .single();

        const commentIdToReply = lastInboundMsg?.platform_message_id;

        if (!commentIdToReply) {
          return { success: false, error: "No comment found to reply to" };
        }

        // Reply to the comment on the post
        const result = await replyToComment({
          commentId: commentIdToReply,
          message: params.content,
          accessToken: account.access_token,
          platform: metaPlatform,
        });
        messageId = result.commentId;
      } else {
        // Send as DM
        console.log("[messages] Sending DM to:", conversation.customer_platform_id, "platform:", metaPlatform, "token starts:", account.access_token.slice(0, 20));
        const result = await sendMessage({
          recipientId: conversation.customer_platform_id,
          message: params.content,
          accessToken: account.access_token,
          pageId: account.platform_account_id,
          platform: metaPlatform,
        });
        messageId = result.messageId;
      }
    } catch (sendError) {
      const errMsg = sendError instanceof Error ? sendError.message : "Send failed";
      console.error("[messages] Send failed:", errMsg);
      return { success: false, error: errMsg };
    }
  }

  try {
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

    // Update draft status (skip for manual replies with no draft)
    if (params.draftId !== "manual") {
      await supabase
        .from("ai_drafts")
        .update({
          status: "sent",
          approved_by: params.approvedBy,
          approved_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
        })
        .eq("id", params.draftId);
    }

    // Update conversation — keep flagged status so admins must explicitly clear it
    const conversationUpdate: Record<string, unknown> = {
      last_message_at: new Date().toISOString(),
      last_message_preview: params.content.slice(0, 100),
    };
    if (conversation.status !== "flagged") {
      conversationUpdate.status = "sent";
    }
    await supabase
      .from("conversations")
      .update(conversationUpdate)
      .eq("id", params.conversationId);

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: params.approvedBy,
      conversation_id: params.conversationId,
      action: "reply_sent",
      metadata: {
        draft_id: params.draftId,
        platform_message_id: messageId,
        reply_type: isComment ? "comment" : "dm",
      },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
