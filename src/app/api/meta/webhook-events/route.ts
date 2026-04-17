import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

/**
 * GET /api/meta/webhook-events
 * Returns recent webhook events for display in the Webhooks page.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const pageId = searchParams.get("page_id");

  try {
    const admin = createAdminClient();

    let query = admin
      .from("webhook_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (pageId) {
      query = query.eq("page_id", pageId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ events: data || [] });
  } catch (err) {
    console.error("Failed to fetch webhook events:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch events" },
      { status: 500 }
    );
  }
}
