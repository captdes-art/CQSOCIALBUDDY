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
}

export interface MetaMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: { url: string };
    }>;
  };
}

export interface MetaWebhookPayload {
  object: "page" | "instagram";
  entry: MetaWebhookEntry[];
}
