import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clearSettingsCache } from "@/lib/settings";

/**
 * GET — Fetch current auto-reply settings.
 * Creates a default row if none exists.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get settings (singleton row)
  let { data: settings, error } = await supabase
    .from("auto_reply_settings")
    .select("*")
    .limit(1)
    .single();

  if (error || !settings) {
    // Create default row if it doesn't exist
    const { data: newSettings, error: insertError } = await supabase
      .from("auto_reply_settings")
      .insert({})
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to initialize settings" },
        { status: 500 }
      );
    }

    settings = newSettings;
  }

  return NextResponse.json({ settings });
}

/**
 * PUT — Update auto-reply settings. Requires admin role.
 */
export async function PUT(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await request.json();

  // Whitelist allowed fields
  const allowedFields = [
    "global_auto_reply_enabled",
    "dm_faq_mode",
    "dm_booking_mode",
    "dm_compliment_mode",
    "dm_complaint_mode",
    "dm_complex_mode",
    "dm_spam_mode",
    "comment_auto_reply_enabled",
    "comment_public_reply_text",
    "comment_delay_min_seconds",
    "comment_delay_max_seconds",
    "confidence_threshold",
    "auto_draft_delay_minutes",
    "max_auto_replies_per_hour",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  // Get the settings row ID
  const { data: existing } = await supabase
    .from("auto_reply_settings")
    .select("id")
    .limit(1)
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: "Settings not found" },
      { status: 404 }
    );
  }

  const { data: updated, error } = await supabase
    .from("auto_reply_settings")
    .update(updates)
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }

  // Clear server-side cache so processor picks up new settings immediately
  clearSettingsCache();

  return NextResponse.json({ settings: updated });
}
