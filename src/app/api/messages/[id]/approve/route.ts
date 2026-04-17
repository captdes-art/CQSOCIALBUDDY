import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { sendReply } from "@/lib/meta/messages";

/**
 * POST /api/messages/[id]/approve — Approve and send an AI draft.
 * Body: { draftId, content? (optional edited content) }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;

    const { id: conversationId } = await params;
    const admin = createAdminClient();
    const body = await request.json();

    // Get user ID from the first admin profile (single-user app)
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();

    const userId = profile?.id || "system";

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
        approvedBy: userId,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Draft-based reply — look up the draft
    const { data: draft } = await admin
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
      await admin
        .from("ai_drafts")
        .update({ edited_content: content })
        .eq("id", draftId);
    }

    // Send the reply via Meta API
    const result = await sendReply({
      conversationId,
      draftId,
      content: replyContent,
      approvedBy: userId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[approve] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
