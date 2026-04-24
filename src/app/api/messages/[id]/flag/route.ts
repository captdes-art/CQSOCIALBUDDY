import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/messages/[id]/flag — Flag a conversation for manual review.
 * Body: { assignTo?: string (user ID) }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const body = await request.json().catch(() => ({}));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updateData: Record<string, unknown> = {
    status: "flagged",
  };

  if (body.assignTo) {
    updateData.assigned_to = body.assignTo;
  }

  const { error } = await supabase
    .from("conversations")
    .update(updateData)
    .eq("id", conversationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  await supabase.from("activity_log").insert({
    user_id: user.id,
    conversation_id: conversationId,
    action: body.assignTo ? "assigned" : "flagged",
    metadata: body.assignTo ? { assigned_to: body.assignTo } : undefined,
  });

  return NextResponse.json({ success: true });
}
