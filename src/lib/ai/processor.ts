import { createAdminClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/meta/client";
import { queryVapiKnowledgeBase } from "./vapi-client";
import { classifyMessage } from "./classifier";
import { applyVariation } from "./response-variation";
import type { Platform } from "@/types";

interface IncomingMessageParams {
  platform: Platform;
  senderId: string;
  recipientId: string;
  messageId: string;
  text: string;
  timestamp: number;
  sourceType?: "dm" | "comment";
  sourcePostId?: string;
  commentId?: string;
  senderName?: string | null;
}

/**
 * Main AI processing pipeline.
 * Called when a new message arrives via Meta webhook.
 *
 * Flow:
 * 1. Store message in DB
 * 2. Get/create conversation record
 * 3. Fetch customer profile from Meta
 * 4. Query Vapi knowledge base
 * 5. Classify the message
 * 6. Generate draft with variation
 * 7. Store draft
 * 8. Update conversation status
 * 9. Trigger notifications if needed
 */
export async function processIncomingMessage(
  params: IncomingMessageParams
): Promise<void> {
  const supabase = createAdminClient();
  const metaPlatform = params.platform === "facebook_messenger" ? "facebook" : "instagram";

  // Get access token for profile lookups
  const { data: account } = await supabase
    .from("platform_accounts")
    .select("access_token")
    .eq("platform", metaPlatform)
    .eq("is_active", true)
    .single();

  // Fetch customer profile (best effort)
  // For comments, the sender name may come from the webhook payload directly
  let customerName: string | null = params.senderName || null;
  let customerAvatar: string | null = null;

  if (account && !customerName) {
    try {
      const profile = await getUserProfile(params.senderId, {
        accessToken: account.access_token,
      });
      customerName = profile.name || null;
      customerAvatar = profile.profile_pic || null;
    } catch {
      // Profile fetch failed — continue without it
    }
  }

  const sourceType = params.sourceType || "dm";

  // Find or create conversation
  // For DMs: group by sender. For comments: group by post so all comments on one post are one conversation.
  const conversationId =
    sourceType === "comment" && params.sourcePostId
      ? `${params.platform}:comment:${params.sourcePostId}`
      : `${params.platform}:${params.senderId}`;

  const { data: existingConversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("platform_conversation_id", conversationId)
    .single();

  let dbConversationId: string;

  if (existingConversation) {
    dbConversationId = existingConversation.id;

    // Update conversation with latest message info
    await supabase
      .from("conversations")
      .update({
        customer_name: customerName || undefined,
        customer_avatar_url: customerAvatar || undefined,
        last_message_at: new Date(params.timestamp).toISOString(),
        last_message_preview: params.text.slice(0, 100),
        status: "new", // Reset to new when customer sends a new message
      })
      .eq("id", dbConversationId);
  } else {
    // Create new conversation
    const { data: newConversation, error } = await supabase
      .from("conversations")
      .insert({
        platform: params.platform,
        platform_conversation_id: conversationId,
        customer_platform_id: params.senderId,
        customer_name: customerName,
        customer_avatar_url: customerAvatar,
        status: "new",
        last_message_at: new Date(params.timestamp).toISOString(),
        last_message_preview: params.text.slice(0, 100),
        source_type: sourceType,
        source_post_id: params.sourcePostId || null,
      })
      .select("id")
      .single();

    if (error || !newConversation) {
      console.error("Failed to create conversation:", error);
      return;
    }

    dbConversationId = newConversation.id;
  }

  // Store the inbound message
  const { data: storedMessage, error: msgError } = await supabase
    .from("messages")
    .insert({
      conversation_id: dbConversationId,
      platform_message_id: params.messageId,
      direction: "inbound",
      content: params.text,
      content_type: "text",
      sender_name: customerName,
      sent_at: new Date(params.timestamp).toISOString(),
    })
    .select("id")
    .single();

  if (msgError || !storedMessage) {
    console.error("Failed to store message:", msgError);
    return;
  }

  // Log activity
  await supabase.from("activity_log").insert({
    conversation_id: dbConversationId,
    action: "message_received",
    metadata: {
      platform: params.platform,
      message_id: params.messageId,
      source_type: sourceType,
      ...(params.commentId && { comment_id: params.commentId }),
      ...(params.sourcePostId && { post_id: params.sourcePostId }),
    },
  });

  // Get conversation history for context (last 5 messages)
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("content, direction")
    .eq("conversation_id", dbConversationId)
    .order("sent_at", { ascending: false })
    .limit(5);

  const conversationHistory = (recentMessages || [])
    .reverse()
    .map((m) =>
      m.direction === "inbound"
        ? `Customer: ${m.content}`
        : `Celtic Quest: ${m.content}`
    );

  // Query Vapi knowledge base
  const vapiResponse = await queryVapiKnowledgeBase({
    message: params.text,
    conversationHistory,
  });

  // Classify the message
  const { classification, confidence } = classifyMessage(
    params.text,
    vapiResponse.confidence
  );

  // Generate draft with response variation
  const draftContent = applyVariation({
    vapiAnswer: vapiResponse.answer,
    classification,
    conversationId: dbConversationId,
  });

  // Determine conversation status based on classification
  let newStatus: string;
  if (classification === "complaint" || classification === "complex") {
    newStatus = "flagged";
  } else if (classification === "spam") {
    newStatus = "ignored";
  } else if (draftContent) {
    newStatus = "draft_ready";
  } else {
    newStatus = "flagged";
  }

  // Store the AI draft (even for flagged — shows the classification)
  await supabase.from("ai_drafts").insert({
    conversation_id: dbConversationId,
    message_id: storedMessage.id,
    draft_content: draftContent || "(Flagged for manual response)",
    classification,
    confidence_score: confidence,
    status: newStatus === "draft_ready" ? "pending" : "rejected",
    vapi_response_raw: vapiResponse.raw as unknown as import("@/types/database").Json,
  });

  // Update conversation status and classification
  await supabase
    .from("conversations")
    .update({
      status: newStatus,
      classification,
    })
    .eq("id", dbConversationId);

  // Log draft generation
  await supabase.from("activity_log").insert({
    conversation_id: dbConversationId,
    action: "draft_generated",
    metadata: {
      classification,
      confidence,
      auto_flagged: newStatus === "flagged",
    },
  });

  // Trigger notification for complaints
  if (classification === "complaint") {
    try {
      await triggerComplaintNotification(dbConversationId, params.text, customerName);
    } catch (err) {
      console.error("Failed to send complaint notification:", err);
    }
  }
}

/**
 * Send an SMS notification via GoHighLevel when a complaint comes in.
 */
async function triggerComplaintNotification(
  conversationId: string,
  messageText: string,
  customerName: string | null
): Promise<void> {
  const supabase = createAdminClient();

  // Get all users who want complaint SMS
  const { data: settings } = await supabase
    .from("notification_settings")
    .select("complaint_phone")
    .eq("complaint_sms", true)
    .not("complaint_phone", "is", null);

  if (!settings?.length) return;

  const ghlApiKey = process.env.GHL_API_KEY;
  const ghlLocationId = process.env.GHL_LOCATION_ID;

  if (!ghlApiKey || !ghlLocationId) return;

  const preview = messageText.slice(0, 100);
  const smsBody = `⚠️ CQ Social Buddy Alert\n\nComplaint from ${customerName || "Unknown"}:\n"${preview}"\n\nReview: ${process.env.NEXT_PUBLIC_APP_URL}/inbox/${conversationId}`;

  for (const setting of settings) {
    if (!setting.complaint_phone) continue;

    try {
      await fetch("https://services.leadconnectorhq.com/conversations/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ghlApiKey}`,
          Version: "2021-04-15",
        },
        body: JSON.stringify({
          type: "SMS",
          locationId: ghlLocationId,
          contactId: setting.complaint_phone, // This may need to be a GHL contact ID
          message: smsBody,
        }),
      });
    } catch (err) {
      console.error("GHL SMS send failed:", err);
    }
  }
}
