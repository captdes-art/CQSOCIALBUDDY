export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      auto_reply_settings: {
        Row: {
          id: string
          global_auto_reply_enabled: boolean
          dm_faq_mode: string
          dm_booking_mode: string
          dm_compliment_mode: string
          dm_complaint_mode: string
          dm_complex_mode: string
          dm_spam_mode: string
          comment_auto_reply_enabled: boolean
          comment_public_reply_text: string
          comment_delay_min_seconds: number
          comment_delay_max_seconds: number
          confidence_threshold: number
          auto_draft_delay_minutes: number
          max_auto_replies_per_hour: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          global_auto_reply_enabled?: boolean
          dm_faq_mode?: string
          dm_booking_mode?: string
          dm_compliment_mode?: string
          dm_complaint_mode?: string
          dm_complex_mode?: string
          dm_spam_mode?: string
          comment_auto_reply_enabled?: boolean
          comment_public_reply_text?: string
          comment_delay_min_seconds?: number
          comment_delay_max_seconds?: number
          confidence_threshold?: number
          auto_draft_delay_minutes?: number
          max_auto_replies_per_hour?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          global_auto_reply_enabled?: boolean
          dm_faq_mode?: string
          dm_booking_mode?: string
          dm_compliment_mode?: string
          dm_complaint_mode?: string
          dm_complex_mode?: string
          dm_spam_mode?: string
          comment_auto_reply_enabled?: boolean
          comment_public_reply_text?: string
          comment_delay_min_seconds?: number
          comment_delay_max_seconds?: number
          confidence_threshold?: number
          auto_draft_delay_minutes?: number
          max_auto_replies_per_hour?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          action: string
          conversation_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_drafts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auto_send_at: string | null
          classification: string
          confidence_score: number
          conversation_id: string
          created_at: string
          draft_content: string
          edited_content: string | null
          id: string
          message_id: string
          sent_at: string | null
          status: string
          vapi_response_raw: Json | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auto_send_at?: string | null
          classification: string
          confidence_score?: number
          conversation_id: string
          created_at?: string
          draft_content: string
          edited_content?: string | null
          id?: string
          message_id: string
          sent_at?: string | null
          status?: string
          vapi_response_raw?: Json | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auto_send_at?: string | null
          classification?: string
          confidence_score?: number
          conversation_id?: string
          created_at?: string
          draft_content?: string
          edited_content?: string | null
          id?: string
          message_id?: string
          sent_at?: string | null
          status?: string
          vapi_response_raw?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_drafts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_drafts_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_drafts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_to: string | null
          classification: string | null
          created_at: string
          customer_avatar_url: string | null
          customer_name: string | null
          customer_platform_id: string
          id: string
          last_message_at: string
          last_message_preview: string | null
          platform: string
          platform_conversation_id: string
          source_post_id: string | null
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          classification?: string | null
          created_at?: string
          customer_avatar_url?: string | null
          customer_name?: string | null
          customer_platform_id: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          platform: string
          platform_conversation_id: string
          source_post_id?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          classification?: string | null
          created_at?: string
          customer_avatar_url?: string | null
          customer_name?: string | null
          customer_platform_id?: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          platform?: string
          platform_conversation_id?: string
          source_post_id?: string | null
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          content_type: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          platform_message_id: string
          sender_name: string | null
          sent_at: string
        }
        Insert: {
          content: string
          content_type?: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          platform_message_id: string
          sender_name?: string | null
          sent_at?: string
        }
        Update: {
          content?: string
          content_type?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          platform_message_id?: string
          sender_name?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          complaint_phone: string | null
          complaint_sms: boolean
          created_at: string
          daily_summary_address: string | null
          daily_summary_email: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          complaint_phone?: string | null
          complaint_sms?: boolean
          created_at?: string
          daily_summary_address?: string | null
          daily_summary_email?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          complaint_phone?: string | null
          complaint_sms?: boolean
          created_at?: string
          daily_summary_address?: string | null
          daily_summary_email?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_accounts: {
        Row: {
          access_token: string
          account_name: string
          created_at: string
          id: string
          is_active: boolean
          platform: string
          platform_account_id: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          account_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          platform: string
          platform_account_id: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          account_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          platform?: string
          platform_account_id?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
