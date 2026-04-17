import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

/**
 * GET /api/meta/instagram/media
 * Fetches recent media from the connected Instagram Business Account.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

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
    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";

    const response = await fetch(
      `${GRAPH_API_BASE}/${igId}/media?fields=${fields}&limit=${limit}&access_token=${account.access_token}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || response.statusText);
    }

    const data = await response.json();

    return NextResponse.json({
      media: data.data || [],
      account: {
        id: account.instagram_business_account_id,
        name: account.account_name,
      },
    });
  } catch (err) {
    console.error("Failed to fetch Instagram media:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch media" },
      { status: 500 }
    );
  }
}
