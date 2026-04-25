import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

/**
 * GET /api/meta/pages/posts/[postId]/comments
 * Fetches comments on a specific post from the Graph API.
 * Requires pages_read_user_content for the `from` field.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { postId } = await params;
    const admin = createAdminClient();
    const { data: account } = await admin
      .from("platform_accounts")
      .select("access_token")
      .eq("platform", "facebook")
      .eq("is_active", true)
      .single();

    if (!account) {
      return NextResponse.json({ error: "No active Facebook page" }, { status: 400 });
    }

    const fields = "id,message,from{name,id},created_time,like_count";
    const response = await fetch(
      `${GRAPH_API_BASE}/${postId}/comments?` +
        new URLSearchParams({
          fields,
          limit: "25",
          access_token: account.access_token,
        })
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || response.statusText);
    }

    const data = await response.json();
    const rawComments = (data.data || []) as Array<Record<string, unknown>>;

    // Until pages_read_user_content is approved, Meta omits the `from` field
    // on the GET /comments response. Fall back to the commenter name we
    // captured from the feed webhook (stored as messages.sender_name with
    // platform_message_id = comment_id).
    const commentIds = rawComments.map((c) => c.id as string);
    const idToName = new Map<string, string>();
    if (commentIds.length) {
      const { data: rows } = await admin
        .from("messages")
        .select("platform_message_id, sender_name")
        .in("platform_message_id", commentIds);
      for (const row of rows || []) {
        if (row.sender_name) idToName.set(row.platform_message_id, row.sender_name);
      }
    }

    const comments = rawComments.map((c) => {
      const apiFrom = c.from as { name?: string; id?: string } | undefined;
      const fallbackName = idToName.get(c.id as string);
      const from = apiFrom?.name
        ? { name: apiFrom.name, id: apiFrom.id || "" }
        : fallbackName
          ? { name: fallbackName, id: "" }
          : null;
      return {
        id: c.id,
        message: c.message || "",
        from,
        created_time: c.created_time,
        like_count: c.like_count || 0,
      };
    });

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("Failed to fetch post comments:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meta/pages/posts/[postId]/comments
 * Posts a reply to a comment using pages_manage_engagement.
 * Body: { commentId, message }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    await params; // validate route param exists
    const admin = createAdminClient();
    const { commentId, message } = await request.json();

    if (!commentId || !message) {
      return NextResponse.json(
        { error: "commentId and message are required" },
        { status: 400 }
      );
    }

    const { data: account } = await admin
      .from("platform_accounts")
      .select("access_token")
      .eq("platform", "facebook")
      .eq("is_active", true)
      .single();

    if (!account) {
      return NextResponse.json({ error: "No active Facebook page" }, { status: 400 });
    }

    // Reply to the specific comment
    const response = await fetch(`${GRAPH_API_BASE}/${commentId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${account.access_token}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || response.statusText);
    }

    const data = await response.json();
    return NextResponse.json({ success: true, commentId: data.id });
  } catch (err) {
    console.error("Failed to reply to comment:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reply" },
      { status: 500 }
    );
  }
}
