import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/messages?conversation_id=xxx — Get messages for a conversation.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const conversationId = request.nextUrl.searchParams.get("conversation_id");

  if (!conversationId) {
    return NextResponse.json(
      { error: "conversation_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("sent_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also get the latest draft for this conversation
  const { data: draft } = await supabase
    .from("ai_drafts")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ messages: data, draft });
}
