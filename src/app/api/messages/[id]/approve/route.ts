import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendReply } from "@/lib/meta/messages";

/**
 * POST /api/messages/[id]/approve — Approve and send an AI draft.
 * Body: { draftId, content? (optional edited content) }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const body = await request.json();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role === "viewer") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { draftId, content } = body;

  // Manual reply — no draft needed, just send the content directly
  if (!draftId || draftId === "manual") {
    if (!content?.trim()) {
      return NextResponse.json({ error: "Reply content is required" }, { status: 400 });
    }

    const result = await sendReply({
      conversationId,
      draftId: "manual",
      content,
      approvedBy: user.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  // Draft-based reply — look up the draft
  const { data: draft } = await supabase
    .from("ai_drafts")
    .select("*")
    .eq("id", draftId)
    .single();

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  // Use edited content if provided, otherwise use the original draft
  const replyContent = content || draft.edited_content || draft.draft_content;

  // If content was edited, save it
  if (content && content !== draft.draft_content) {
    await supabase
      .from("ai_drafts")
      .update({ edited_content: content })
      .eq("id", draftId);
  }

  // Send the reply via Meta API
  const result = await sendReply({
    conversationId,
    draftId,
    content: replyContent,
    approvedBy: user.id,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
