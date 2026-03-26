import { NextRequest, NextResponse } from "next/server";
import { generateClaudeReply } from "@/lib/ai/claude-client";

/**
 * POST /api/test-claude
 * Diagnostic endpoint — tests Claude + knowledge base directly.
 * Returns the raw answer, confidence, and any error.
 */
export async function POST(request: NextRequest) {
  const { text } = await request.json();

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const result = await generateClaudeReply({ message: text });
    return NextResponse.json({
      status: "ok",
      answer: result.answer,
      confidence: result.confidence,
      answerLength: result.answer.length,
    });
  } catch (err) {
    return NextResponse.json({
      status: "error",
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 5) : undefined,
    }, { status: 500 });
  }
}
