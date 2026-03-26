import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/ai/processor";

/**
 * POST /api/test-pipeline
 * Test endpoint to simulate an incoming customer message.
 * Bypasses Meta signature verification for testing.
 *
 * Body for DM:      { "text": "customer message here" }
 * Body for comment:  { "text": "comment text", "type": "comment", "postId": "post-123" }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { text, type, postId } = body;

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const isComment = type === "comment";

  try {
    await processIncomingMessage({
      platform: "facebook_messenger",
      senderId: `test-customer-${Date.now()}`,
      recipientId: "test-page-id",
      messageId: `test-${Date.now()}`,
      text,
      timestamp: Date.now(),
      sourceType: isComment ? "comment" : "dm",
      sourcePostId: isComment ? (postId || `test-post-${Date.now()}`) : undefined,
      commentId: isComment ? `test-comment-${Date.now()}` : undefined,
      senderName: isComment ? "Test Commenter" : undefined,
    });

    return NextResponse.json({
      status: "ok",
      message: `Pipeline executed (${isComment ? "comment" : "DM"})`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
