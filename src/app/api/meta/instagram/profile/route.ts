import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

/**
 * GET /api/meta/instagram/profile
 * Fetches the connected Instagram Business Account profile fields.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const admin = createAdminClient();
    const { data: account } = await admin
      .from("platform_accounts")
      .select("platform_account_id, account_name, access_token, instagram_business_account_id")
      .eq("platform", "instagram")
      .eq("is_active", true)
      .single();

    if (!account || !account.instagram_business_account_id) {
      return NextResponse.json({ error: "No active Instagram account" }, { status: 400 });
    }

    const igId = account.instagram_business_account_id;
    const fields = "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url";

    const response = await fetch(
      `${GRAPH_API_BASE}/${igId}?fields=${fields}&access_token=${account.access_token}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || response.statusText);
    }

    const profile = await response.json();

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("Failed to fetch Instagram profile:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
