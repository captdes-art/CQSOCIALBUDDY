import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/meta/auth/disconnect
 * Disconnects all platform accounts (sets is_active = false).
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    const { error } = await admin
      .from("platform_accounts")
      .update({ is_active: false })
      .eq("is_active", true);

    if (error) throw error;

    // Log activity
    await admin.from("activity_log").insert({
      user_id: user.id,
      action: "message_received",
      metadata: { type: "facebook_disconnected" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to disconnect:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to disconnect" },
      { status: 500 }
    );
  }
}
