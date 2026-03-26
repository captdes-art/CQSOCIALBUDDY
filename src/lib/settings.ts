import { createAdminClient } from "@/lib/supabase/server";
import type { AutoReplySettings, AutomationMode, Classification } from "@/types";

const CACHE_TTL = 60 * 1000; // 1 minute
let cached: { settings: AutoReplySettings; fetchedAt: number } | null = null;

// Default settings (used as fallback if DB query fails)
const DEFAULTS: AutoReplySettings = {
  id: "",
  global_auto_reply_enabled: true,
  dm_faq_mode: "auto_send",
  dm_booking_mode: "auto_draft",
  dm_compliment_mode: "auto_send",
  dm_complaint_mode: "manual",
  dm_complex_mode: "manual",
  dm_spam_mode: "ignore",
  comment_auto_reply_enabled: true,
  comment_public_reply_text: "Great question! Check your DMs for the full answer 🎣",
  comment_delay_min_seconds: 15,
  comment_delay_max_seconds: 45,
  confidence_threshold: 0.75,
  auto_draft_delay_minutes: 5,
  max_auto_replies_per_hour: 50,
  created_at: "",
  updated_at: "",
};

/**
 * Get auto-reply settings from Supabase.
 * Caches for 1 minute to avoid hitting the DB on every webhook.
 */
export async function getAutoReplySettings(): Promise<AutoReplySettings> {
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.settings;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("auto_reply_settings")
      .select("*")
      .limit(1)
      .single();

    if (error || !data) {
      console.warn("[settings] Failed to fetch settings, using defaults:", error?.message);
      return DEFAULTS;
    }

    const settings = data as AutoReplySettings;
    cached = { settings, fetchedAt: Date.now() };
    return settings;
  } catch (err) {
    console.error("[settings] Error fetching settings:", err);
    return DEFAULTS;
  }
}

/**
 * Clear the settings cache. Call this after updating settings.
 */
export function clearSettingsCache(): void {
  cached = null;
}

/**
 * Get the automation mode for a given classification.
 */
export function getAutomationMode(
  settings: AutoReplySettings,
  classification: Classification
): AutomationMode {
  if (!settings.global_auto_reply_enabled) return "manual";

  const modeMap: Record<Classification, AutomationMode> = {
    faq: settings.dm_faq_mode,
    booking: settings.dm_booking_mode,
    compliment: settings.dm_compliment_mode,
    complaint: settings.dm_complaint_mode,
    complex: settings.dm_complex_mode,
    spam: settings.dm_spam_mode,
  };

  return modeMap[classification] || "manual";
}

/**
 * Check if a message should be auto-sent based on settings.
 * Combines the automation mode with the confidence threshold.
 */
export function shouldAutoSend(
  settings: AutoReplySettings,
  classification: Classification,
  confidence: number
): boolean {
  const mode = getAutomationMode(settings, classification);
  if (mode !== "auto_send") return false;
  return confidence >= settings.confidence_threshold;
}

/**
 * Check if a message should be auto-drafted (sent after delay).
 */
export function shouldAutoDraft(
  settings: AutoReplySettings,
  classification: Classification,
  confidence: number
): boolean {
  const mode = getAutomationMode(settings, classification);
  if (mode !== "auto_draft") return false;
  return confidence >= settings.confidence_threshold;
}
