import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

/**
 * GET /api/meta/pages/posts
 * Fetches posts from the connected Facebook Page with engagement metrics.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 50);

  try {
    const admin = createAdminClient();
    const { data: account } = await admin
      .from("platform_accounts")
      .select("platform_account_id, account_name, access_token")
      .eq("platform", "facebook")
      .eq("is_active", true)
      .single();

    if (!account) {
      return NextResponse.json({ error: "No active Facebook page" }, { status: 400 });
    }

    const fields = [
      "id",
      "message",
      "created_time",
      "full_picture",
      "permalink_url",
      "likes.summary(true)",
      "comments.summary(true)",
      "shares",
    ].join(",");

    const response = await fetch(
      `${GRAPH_API_BASE}/${account.platform_account_id}/posts?` +
        new URLSearchParams({
          fields,
          limit: limit.toString(),
          access_token: account.access_token,
        })
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || response.statusText);
    }

    const data = await response.json();

    const posts = (data.data || []).map((post: Record<string, unknown>) => ({
      id: post.id,
      message: post.message || "",
      created_time: post.created_time,
      full_picture: post.full_picture || null,
      permalink_url: post.permalink_url || null,
      likes_count: (post.likes as Record<string, Record<string, number>>)?.summary?.total_count || 0,
      comments_count: (post.comments as Record<string, Record<string, number>>)?.summary?.total_count || 0,
      shares_count: (post.shares as Record<string, number>)?.count || 0,
    }));

    return NextResponse.json({
      posts,
      page: {
        id: account.platform_account_id,
        name: account.account_name,
      },
    });
  } catch (err) {
    console.error("Failed to fetch page posts:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
