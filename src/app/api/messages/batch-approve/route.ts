import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendReply } from "@/lib/meta/messages";

/**
 * POST /api/messages/batch-approve — Approve and send multiple drafts at once.
 * Body: { items: Array<{ conversationId, draftId }> }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role === "viewer") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { items } = body as {
    items: Array<{ conversationId: string; draftId: string }>;
  };

  if (!items?.length) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  const results: Array<{
    conversationId: string;
    success: boolean;
    error?: string;
  }> = [];

  // Process each item sequentially to respect rate limits
  for (const item of items) {
    // Get the draft content
    const { data: draft } = await supabase
      .from("ai_drafts")
      .select("draft_content, edited_content")
      .eq("id", item.draftId)
      .single();

    if (!draft) {
      results.push({
        conversationId: item.conversationId,
        success: false,
        error: "Draft not found",
      });
      continue;
    }

    const content = draft.edited_content || draft.draft_content;

    const result = await sendReply({
      conversationId: item.conversationId,
      draftId: item.draftId,
      content,
      approvedBy: user.id,
    });

    results.push({
      conversationId: item.conversationId,
      success: result.success,
      error: result.error,
    });

    // Small delay between sends to avoid rate limiting
    if (items.indexOf(item) < items.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  const successCount = results.filter((r) => r.success).length;
  return NextResponse.json({
    success: true,
    sent: successCount,
    failed: results.length - successCount,
    results,
  });
}
