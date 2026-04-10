import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * PATCH /api/conversations/[id] — Archive or unarchive a conversation.
 * Body: { action: "archive" | "unarchive" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action } = await request.json();

  if (!["archive", "unarchive"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Use 'archive' or 'unarchive'." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  if (action === "archive") {
    const { error } = await supabase
      .from("conversations")
      .update({ status: "archived" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: "archived" });
  }

  // Unarchive — restore to "sent" as a safe default
  const { error } = await supabase
    .from("conversations")
    .update({ status: "sent" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: "sent" });
}

/**
 * DELETE /api/conversations/[id] — Permanently delete a conversation and all related data.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // CASCADE foreign keys handle messages, drafts, activity_log
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
