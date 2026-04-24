import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/conversations — List conversations with filters.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;

  // Build query
  let query = supabase
    .from("conversations")
    .select("*, assigned_profile:profiles!conversations_assigned_to_fkey(id, full_name, avatar_url)");

  // Filter by source_type only when explicitly provided. No default so that
  // Flagged / Archived views surface both DMs and comments.
  const sourceType = searchParams.get("source_type");
  if (sourceType) query = query.eq("source_type", sourceType);

  // Filters
  const platform = searchParams.get("platform");
  if (platform) query = query.eq("platform", platform);

  const status = searchParams.get("status");
  if (status) {
    query = query.eq("status", status);
  } else {
    // Exclude archived conversations by default unless explicitly requested
    query = query.neq("status", "archived");
  }

  const classification = searchParams.get("classification");
  if (classification) query = query.eq("classification", classification);

  const assignedTo = searchParams.get("assigned_to");
  if (assignedTo) query = query.eq("assigned_to", assignedTo);

  const search = searchParams.get("search");
  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,last_message_preview.ilike.%${search}%`
    );
  }

  // Sorting
  const sortBy = searchParams.get("sort_by") || "last_message_at";
  const sortOrder = searchParams.get("sort_order") || "desc";
  query = query.order(sortBy, { ascending: sortOrder === "asc" });

  // Pagination
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations: data, total: count });
}
