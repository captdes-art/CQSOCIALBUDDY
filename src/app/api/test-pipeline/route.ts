import { NextRequest, NextResponse } from "next/server";
import { processIncomingMessage } from "@/lib/ai/processor";

/**
 * POST /api/test-pipeline
 * Test endpoint to simulate an incoming customer message.
 * Bypasses Meta signature verification for testing.
 *
 * Body: { "text": "customer message here" }
 */
export async function POST(request: NextRequest) {
  const { text } = await request.json();

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    await processIncomingMessage({
      platform: "facebook_messenger",
      senderId: "test-customer-123",
      recipientId: "test-page-id",
      messageId: `test-${Date.now()}`,
      text,
      timestamp: Date.now(),
    });

    return NextResponse.json({ status: "ok", message: "Pipeline executed" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
