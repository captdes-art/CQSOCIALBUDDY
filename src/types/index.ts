export type Platform = "facebook_messenger" | "instagram_dm";
export type SourceType = "dm" | "comment";

export type ConversationStatus =
  | "new"
  | "draft_ready"
  | "approved"
  | "sent"
  | "flagged"
  | "ignored";

export type Classification =
  | "booking"
  | "faq"
  | "compliment"
  | "complaint"
  | "complex"
  | "spam";

export type DraftStatus = "pending" | "approved" | "sent" | "rejected";
export type UserRole = "admin" | "reviewer" | "viewer";
export type MessageDirection = "inbound" | "outbound";
export type ContentType = "text" | "image" | "attachment";

export type ActivityAction =
  | "message_received"
  | "draft_generated"
  | "draft_approved"
  | "reply_sent"
  | "flagged"
  | "assigned"
  | "ignored";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface PlatformAccount {
  id: string;
  platform: "facebook" | "instagram";
  platform_account_id: string;
  account_name: string;
  access_token: string;
  token_expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_access_token: string | null;
  user_token_expires_at: string | null;
  instagram_business_account_id: string | null;
  permissions_granted: string[] | null;
  connected_by: string | null;
}

export interface WebhookEvent {
  id: string;
  platform: "facebook" | "instagram";
  event_type: string;
  page_id: string | null;
  payload: Record<string, unknown>;
  processed: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  platform: Platform;
  platform_conversation_id: string;
  customer_platform_id: string;
  customer_name: string | null;
  customer_avatar_url: string | null;
  status: ConversationStatus;
  classification: Classification | null;
  assigned_to: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  source_type: SourceType;
  source_post_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  assigned_profile?: Profile;
  latest_draft?: AiDraft;
}

export interface Message {
  id: string;
  conversation_id: string;
  platform_message_id: string;
  direction: MessageDirection;
  content: string;
  content_type: ContentType;
  sender_name: string | null;
  sent_at: string;
  created_at: string;
}

export interface AiDraft {
  id: string;
  conversation_id: string;
  message_id: string;
  draft_content: string;
  edited_content: string | null;
  classification: Classification;
  confidence_score: number;
  status: DraftStatus;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  vapi_response_raw: Record<string, unknown> | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  conversation_id: string | null;
  action: ActivityAction;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  complaint_sms: boolean;
  complaint_phone: string | null;
  daily_summary_email: boolean;
  daily_summary_address: string | null;
  created_at: string;
  updated_at: string;
}

// API filter types
export interface ConversationFilters {
  platform?: Platform;
  status?: ConversationStatus;
  classification?: Classification;
  assigned_to?: string;
  source_type?: SourceType;
  min_confidence?: number;
  search?: string;
  sort_by?: "last_message_at" | "created_at" | "confidence_score";
  sort_order?: "asc" | "desc";
}

// Meta webhook payload types
export interface MetaWebhookEntry {
  id: string;
  time: number;
  messaging?: MetaMessagingEvent[];
  changes?: MetaChangeEvent[];
}

export interface MetaMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    attachments?: Array<{
      type: string;
      payload: { url: string };
    }>;
  };
}

export interface MetaChangeEvent {
  field: "feed" | "comments" | string;
  value: MetaFeedChangeValue | MetaInstagramCommentValue;
}

/** Facebook Page feed change (comments on posts) */
export interface MetaFeedChangeValue {
  item: "comment" | "post" | "reaction" | string;
  comment_id: string;
  post_id: string;
  parent_id?: string;
  from: { id: string; name?: string };
  message?: string;
  created_time: number;
  verb: "add" | "edited" | "remove" | string;
}

/** Instagram comment webhook value */
export interface MetaInstagramCommentValue {
  id: string;
  text: string;
  from: { id: string; username?: string };
  media: { id: string };
}

export interface MetaWebhookPayload {
  object: "page" | "instagram";
  entry: MetaWebhookEntry[];
}

// Auto-reply settings types
export type AutomationMode = "auto_send" | "auto_draft" | "manual" | "ignore";

export interface AutoReplySettings {
  id: string;
  global_auto_reply_enabled: boolean;
  // Per-classification DM modes
  dm_faq_mode: AutomationMode;
  dm_booking_mode: AutomationMode;
  dm_compliment_mode: AutomationMode;
  dm_complaint_mode: AutomationMode;
  dm_complex_mode: AutomationMode;
  dm_spam_mode: AutomationMode;
  // Comment controls
  comment_auto_reply_enabled: boolean;
  comment_public_reply_text: string;
  comment_delay_min_seconds: number;
  comment_delay_max_seconds: number;
  // Thresholds
  confidence_threshold: number;
  auto_draft_delay_minutes: number;
  max_auto_replies_per_hour: number;
  // Timestamps
  created_at: string;
  updated_at: string;
}
