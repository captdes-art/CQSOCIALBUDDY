import { createAdminClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/meta/client";
import { generateClaudeReply } from "./claude-client";
import { classifyMessage } from "./classifier";
import { applyVariation } from "./response-variation";
import { shouldReplyToComment } from "./keyword-filter";
import {
  getAutoReplySettings,
  getAutomationMode,
  shouldAutoSend as checkAutoSend,
  shouldAutoDraft as checkAutoDraft,
} from "@/lib/settings";
import { sendFacebookDM } from "@/lib/meta/send";
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
 * All behavior is controlled by auto_reply_settings in Supabase:
 * - Global kill switch
 * - Per-classification mode (auto_send / auto_draft / manual / ignore)
 * - Confidence threshold
 * - Comment reply text and delay range
 */
export async function processIncomingMessage(
  params: IncomingMessageParams
): Promise<void> {
  const sourceType = params.sourceType || "dm";

  if (sourceType === "comment") {
    await processComment(params);
  } else {
    await processDM(params);
  }
}

// ─── DM PROCESSING ────────────────────────────────────────────────────────────

async function processDM(params: IncomingMessageParams): Promise<void> {
  const supabase = createAdminClient();
  const settings = await getAutoReplySettings();
  const metaPlatform =
    params.platform === "facebook_messenger" ? "facebook" : "instagram";

  console.log("[processor:dm] Processing DM from:", params.senderId);

  // Fetch customer profile (best effort)
  let customerName: string | null = params.senderName || null;
  let customerAvatar: string | null = null;

  const { data: account } = await supabase
    .from("platform_accounts")
    .select("access_token")
    .eq("platform", metaPlatform)
    .eq("is_active", true)
    .single();

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

  // Find or create conversation (group by sender)
  const conversationKey = `${params.platform}:${params.senderId}`;
  const dbConversationId = await findOrCreateConversation(supabase, {
    platform: params.platform,
    conversationKey,
    senderId: params.senderId,
    customerName,
    customerAvatar,
    timestamp: params.timestamp,
    text: params.text,
    sourceType: "dm",
  });

  if (!dbConversationId) return;

  // Store the inbound message
  const storedMessage = await storeInboundMessage(supabase, {
    conversationId: dbConversationId,
    messageId: params.messageId,
    text: params.text,
    customerName,
    timestamp: params.timestamp,
    platform: params.platform,
    sourceType: "dm",
  });

  if (!storedMessage) return;

  // Check if this conversation is currently flagged — if so, force manual-only mode
  const { data: currentConv } = await supabase
    .from("conversations")
    .select("status")
    .eq("id", dbConversationId)
    .single();
  const isConversationFlagged = currentConv?.status === "flagged";

  // Get conversation history for context (last 5 messages)
  const conversationHistory = await getConversationHistory(
    supabase,
    dbConversationId
  );

  // Call Claude for the response
  let claudeAnswer: string;
  let claudeConfidence: number;
  let claudeSentiment: string = "neutral";

  try {
    const claudeResult = await generateClaudeReply({
      message: params.text,
      conversationHistory,
      isComment: false,
    });
    claudeAnswer = claudeResult.answer;
    claudeConfidence = claudeResult.confidence;
    claudeSentiment = claudeResult.sentiment;
  } catch (err) {
    console.error("[processor:dm] Claude API failed:", err);
    claudeAnswer = "";
    claudeConfidence = 0;
  }

  // Classify the message — keyword-based first, then override with Claude's sentiment
  let { classification, confidence } = classifyMessage(
    params.text,
    claudeConfidence
  );

  // Claude's sentiment detection is more reliable than keyword matching.
  // If Claude says it's a complaint but keywords missed it, override.
  if (claudeSentiment === "complaint" && classification !== "complaint") {
    console.log("[processor:dm] Claude detected complaint sentiment, overriding keyword classification:", classification, "→ complaint");
    classification = "complaint";
    confidence = Math.max(confidence, 0.8);
  }

  // Apply response variation to the Claude answer
  const draftContent = applyVariation({
    vapiAnswer: claudeAnswer,
    classification,
    conversationId: dbConversationId,
  });

  // ── Determine behavior from settings ──
  // The single env-var kill switch (AUTO_SEND_ENABLED) lives in send.ts
  // and blocks the actual outbound HTTP call. Auto behavior here is
  // governed by DB settings + the circuit breaker below.
  const mode = isConversationFlagged ? "manual" : getAutomationMode(settings, classification);
  let doAutoSend = !isConversationFlagged && checkAutoSend(settings, classification, confidence) && !!draftContent;
  let doAutoDraft = !isConversationFlagged && checkAutoDraft(settings, classification, confidence) && !!draftContent;

  // Circuit breaker (added 2026-05-02 after the runaway-loop incident):
  // never auto-send if we've already sent ANY outbound message to this
  // conversation in the last hour. Forces the reply to be a manual draft.
  if (doAutoSend || doAutoDraft) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentOutbound } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", dbConversationId)
      .eq("direction", "outbound")
      .gte("sent_at", oneHourAgo);
    if ((recentOutbound ?? 0) > 0) {
      console.warn(
        "[processor:dm] Circuit breaker tripped — already sent",
        recentOutbound,
        "msg(s) in last hour. Forcing manual draft."
      );
      doAutoSend = false;
      doAutoDraft = false;
    }
  }

  let newStatus: string;
  let draftStatus: string;
  let autoSendAt: string | null = null;

  // Complaints are always flagged — never auto-sent regardless of settings
  if (classification === "complaint") {
    newStatus = "flagged";
    draftStatus = "pending";
  } else if (mode === "ignore") {
    newStatus = "ignored";
    draftStatus = "rejected";
  } else if (doAutoSend) {
    newStatus = "sent";
    draftStatus = "sent";
  } else if (doAutoDraft) {
    // Auto-draft: will be sent by the cron job after the delay
    newStatus = "draft_ready";
    draftStatus = "pending";
    autoSendAt = new Date(
      Date.now() + settings.auto_draft_delay_minutes * 60 * 1000
    ).toISOString();
  } else if (mode === "manual" && draftContent) {
    newStatus = "draft_ready";
    draftStatus = "pending";
  } else if (!draftContent) {
    // No draft (complaint/complex/spam with empty variation)
    newStatus = "flagged";
    draftStatus = "rejected";
  } else {
    newStatus = "draft_ready";
    draftStatus = "pending";
  }

  console.log(
    "[processor:dm] classification:", classification,
    "mode:", mode,
    "confidence:", confidence.toFixed(2),
    "threshold:", settings.confidence_threshold,
    "→", doAutoSend ? "AUTO_SEND" : doAutoDraft ? "AUTO_DRAFT" : newStatus
  );

  // Store the AI draft
  const { error: draftError } = await supabase.from("ai_drafts").insert({
    conversation_id: dbConversationId,
    message_id: storedMessage.id,
    draft_content: draftContent || "(Flagged for manual response)",
    classification,
    confidence_score: confidence,
    status: draftStatus,
    auto_send_at: autoSendAt,
    vapi_response_raw: {
      source: "claude-sonnet",
      answer_length: claudeAnswer.length,
      automation_mode: mode,
    },
    ...(doAutoSend
      ? {
          approved_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
        }
      : {}),
  });

  if (draftError) {
    console.error("[processor:dm] Failed to store AI draft:", draftError.message, draftError.details, draftError.hint);
  }

  // Auto-send immediately if settings allow
  if (doAutoSend) {
    try {
      const sentMessageId = await sendFacebookDM(
        params.senderId,
        draftContent,
        { platform: params.platform, pageId: params.recipientId }
      );
      console.log("[processor:dm] Auto-sent DM reply:", sentMessageId);

      await supabase.from("messages").insert({
        conversation_id: dbConversationId,
        platform_message_id: sentMessageId,
        direction: "outbound",
        content: draftContent,
        content_type: "text",
        sender_name: "Celtic Quest AI",
        sent_at: new Date().toISOString(),
      });

      newStatus = "sent";
    } catch (err) {
      console.error("[processor:dm] Auto-send failed:", err);
      newStatus = "draft_ready";
      await supabase
        .from("ai_drafts")
        .update({
          status: "pending",
          approved_by: null,
          approved_at: null,
          sent_at: null,
        })
        .eq("conversation_id", dbConversationId)
        .eq("message_id", storedMessage.id);
    }
  }

  // Update conversation status — flagged conversations stay flagged
  await supabase
    .from("conversations")
    .update({
      status: isConversationFlagged ? "flagged" : newStatus,
      classification,
      ...(newStatus === "sent" && draftContent && {
        last_message_preview: draftContent.slice(0, 100),
      }),
    })
    .eq("id", dbConversationId);

  // Log activity
  await supabase.from("activity_log").insert({
    conversation_id: dbConversationId,
    action: doAutoSend ? "reply_sent" : "draft_generated",
    metadata: {
      classification,
      confidence,
      automation_mode: mode,
      auto_sent: doAutoSend,
      auto_draft: doAutoDraft,
      auto_send_at: autoSendAt,
    },
  });

  // Trigger notification for complaints
  if (classification === "complaint") {
    try {
      await triggerComplaintNotification(
        dbConversationId,
        params.text,
        customerName
      );
    } catch (err) {
      console.error("Failed to send complaint notification:", err);
    }
  }
}

// ─── COMMENT PROCESSING ───────────────────────────────────────────────────────

async function processComment(params: IncomingMessageParams): Promise<void> {
  const supabase = createAdminClient();
  const settings = await getAutoReplySettings();
  const commentText = params.text;
  const commentId = params.commentId!;

  console.log(
    "[processor:comment] Processing comment from:",
    params.senderName || params.senderId,
    "text:",
    commentText.slice(0, 60)
  );

  // Check global kill switch
  if (!settings.global_auto_reply_enabled || !settings.comment_auto_reply_enabled) {
    console.log("[processor:comment] Auto-reply disabled by settings");

    // Store for dashboard but don't reply
    const convId = await findOrCreateConversation(supabase, {
      platform: params.platform,
      conversationKey: `${params.platform}:comment:${params.sourcePostId}`,
      senderId: params.senderId,
      customerName: params.senderName || null,
      customerAvatar: null,
      timestamp: params.timestamp,
      text: commentText,
      sourceType: "comment",
      sourcePostId: params.sourcePostId,
    });

    if (convId) {
      await storeInboundMessage(supabase, {
        conversationId: convId,
        messageId: params.messageId,
        text: commentText,
        customerName: params.senderName || null,
        timestamp: params.timestamp,
        platform: params.platform,
        sourceType: "comment",
        commentId,
      });

      await supabase
        .from("conversations")
        .update({ status: "draft_ready" })
        .eq("id", convId);
    }
    return;
  }

  // Keyword filter — skip if comment isn't a question/booking intent
  if (!shouldReplyToComment(commentText)) {
    console.log("[processor:comment] Skipping — no matching keywords");

    const dbConversationId = await findOrCreateConversation(supabase, {
      platform: params.platform,
      conversationKey: `${params.platform}:comment:${params.sourcePostId}`,
      senderId: params.senderId,
      customerName: params.senderName || null,
      customerAvatar: null,
      timestamp: params.timestamp,
      text: commentText,
      sourceType: "comment",
      sourcePostId: params.sourcePostId,
    });

    if (dbConversationId) {
      await storeInboundMessage(supabase, {
        conversationId: dbConversationId,
        messageId: params.messageId,
        text: commentText,
        customerName: params.senderName || null,
        timestamp: params.timestamp,
        platform: params.platform,
        sourceType: "comment",
        commentId,
      });

      await supabase
        .from("conversations")
        .update({ status: "ignored", classification: "spam" })
        .eq("id", dbConversationId);
    }
    return;
  }

  // Store the comment in DB
  const dbConversationId = await findOrCreateConversation(supabase, {
    platform: params.platform,
    conversationKey: `${params.platform}:comment:${params.sourcePostId}`,
    senderId: params.senderId,
    customerName: params.senderName || null,
    customerAvatar: null,
    timestamp: params.timestamp,
    text: commentText,
    sourceType: "comment",
    sourcePostId: params.sourcePostId,
  });

  if (!dbConversationId) return;

  const storedMessage = await storeInboundMessage(supabase, {
    conversationId: dbConversationId,
    messageId: params.messageId,
    text: commentText,
    customerName: params.senderName || null,
    timestamp: params.timestamp,
    platform: params.platform,
    sourceType: "comment",
    commentId,
  });

  if (!storedMessage) return;

  // Call Claude for the full answer
  let fullAnswer: string;

  try {
    const claudeResult = await generateClaudeReply({
      message: commentText,
      isComment: true,
    });
    fullAnswer = claudeResult.answer;
  } catch (err) {
    console.error("[processor:comment] Claude API failed:", err);
    // Save a pending draft anyway so the comment shows up for manual reply
    // instead of disappearing into a flagged-with-nothing-to-do state.
    await supabase.from("ai_drafts").insert({
      conversation_id: dbConversationId,
      message_id: storedMessage.id,
      draft_content: "",
      classification: "faq",
      confidence_score: 0,
      status: "pending",
      vapi_response_raw: {
        source: "claude-error",
        error: err instanceof Error ? err.message : String(err),
      },
    });
    await supabase
      .from("conversations")
      .update({ status: "draft_ready", classification: "faq" })
      .eq("id", dbConversationId);
    return;
  }

  // Store the AI draft as pending so the user can review and approve before
  // anything posts to the public comment thread.
  await supabase.from("ai_drafts").insert({
    conversation_id: dbConversationId,
    message_id: storedMessage.id,
    draft_content: fullAnswer,
    classification: "faq",
    confidence_score: 0.85,
    status: "pending",
    vapi_response_raw: { source: "claude-sonnet", type: "comment-reply" },
  });

  // Park the comment in draft_ready so the human can review and approve.
  // Approval routes through the standard /api/messages/[id]/approve flow,
  // which already handles comment-source replies.
  await supabase
    .from("conversations")
    .update({
      status: "draft_ready",
      classification: "faq",
      last_message_preview: commentText.slice(0, 100),
    })
    .eq("id", dbConversationId);

  await supabase.from("activity_log").insert({
    conversation_id: dbConversationId,
    action: "draft_generated",
    metadata: {
      type: "comment_draft_generated",
      platform: params.platform,
    },
  });
}

// ─── SHARED HELPERS ───────────────────────────────────────────────────────────

async function findOrCreateConversation(
  supabase: ReturnType<typeof createAdminClient>,
  params: {
    platform: Platform;
    conversationKey: string;
    senderId: string;
    customerName: string | null;
    customerAvatar: string | null;
    timestamp: number;
    text: string;
    sourceType: "dm" | "comment";
    sourcePostId?: string;
  }
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("platform_conversation_id", params.conversationKey)
    .single();

  if (existing) {
    // Check current status — preserve "flagged" so admins must explicitly clear it
    const { data: currentConv } = await supabase
      .from("conversations")
      .select("status")
      .eq("id", existing.id)
      .single();

    const updateData: Record<string, unknown> = {
      customer_name: params.customerName || undefined,
      customer_avatar_url: params.customerAvatar || undefined,
      last_message_at: new Date(params.timestamp).toISOString(),
      last_message_preview: params.text.slice(0, 100),
    };
    // Only reset to "new" if not flagged
    if (currentConv?.status !== "flagged") {
      updateData.status = "new";
    }

    await supabase
      .from("conversations")
      .update(updateData)
      .eq("id", existing.id);

    return existing.id;
  }

  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
      platform: params.platform,
      platform_conversation_id: params.conversationKey,
      customer_platform_id: params.senderId,
      customer_name: params.customerName,
      customer_avatar_url: params.customerAvatar,
      status: "new",
      last_message_at: new Date(params.timestamp).toISOString(),
      last_message_preview: params.text.slice(0, 100),
      source_type: params.sourceType,
      source_post_id: params.sourcePostId || null,
    })
    .select("id")
    .single();

  if (error || !newConv) {
    console.error("Failed to create conversation:", error);
    return null;
  }

  return newConv.id;
}

async function storeInboundMessage(
  supabase: ReturnType<typeof createAdminClient>,
  params: {
    conversationId: string;
    messageId: string;
    text: string;
    customerName: string | null;
    timestamp: number;
    platform: Platform;
    sourceType: "dm" | "comment";
    commentId?: string;
  }
): Promise<{ id: string } | null> {
  // Dedupe: Meta retries webhooks if we don't respond fast enough. If this
  // platform_message_id has already been stored, skip — don't re-process.
  // (Added 2026-05-02 as part of the runaway-loop fix.)
  const { data: existing } = await supabase
    .from("messages")
    .select("id")
    .eq("platform_message_id", params.messageId)
    .eq("direction", "inbound")
    .maybeSingle();
  if (existing) {
    console.log("[storeInboundMessage] Skipping duplicate webhook for messageId:", params.messageId);
    return null;
  }

  const { data: stored, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      platform_message_id: params.messageId,
      direction: "inbound",
      content: params.text,
      content_type: "text",
      sender_name: params.customerName,
      sent_at: new Date(params.timestamp).toISOString(),
    })
    .select("id")
    .single();

  if (error || !stored) {
    console.error("Failed to store message:", error);
    return null;
  }

  await supabase.from("activity_log").insert({
    conversation_id: params.conversationId,
    action: "message_received",
    metadata: {
      platform: params.platform,
      message_id: params.messageId,
      source_type: params.sourceType,
      ...(params.commentId && { comment_id: params.commentId }),
    },
  });

  return stored;
}

async function getConversationHistory(
  supabase: ReturnType<typeof createAdminClient>,
  conversationId: string
): Promise<string[]> {
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("content, direction")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: false })
    .limit(5);

  return (recentMessages || [])
    .reverse()
    .map((m) =>
      m.direction === "inbound"
        ? `Customer: ${m.content}`
        : `Celtic Quest: ${m.content}`
    );
}

async function triggerComplaintNotification(
  conversationId: string,
  messageText: string,
  customerName: string | null
): Promise<void> {
  const supabase = createAdminClient();

  const { data: notifSettings } = await supabase
    .from("notification_settings")
    .select("complaint_phone")
    .eq("complaint_sms", true)
    .not("complaint_phone", "is", null);

  if (!notifSettings?.length) return;

  const ghlApiKey = process.env.GHL_API_KEY;
  const ghlLocationId = process.env.GHL_LOCATION_ID;
  if (!ghlApiKey || !ghlLocationId) return;

  const preview = messageText.slice(0, 100);
  const smsBody = `⚠️ CQ Social Buddy Alert\n\nComplaint from ${customerName || "Unknown"}:\n"${preview}"\n\nReview: ${process.env.NEXT_PUBLIC_APP_URL}/inbox/${conversationId}`;

  for (const setting of notifSettings) {
    if (!setting.complaint_phone) continue;

    try {
      await fetch(
        "https://services.leadconnectorhq.com/conversations/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ghlApiKey}`,
            Version: "2021-04-15",
          },
          body: JSON.stringify({
            type: "SMS",
            locationId: ghlLocationId,
            contactId: setting.complaint_phone,
            message: smsBody,
          }),
        }
      );
    } catch (err) {
      console.error("GHL SMS send failed:", err);
    }
  }
}
