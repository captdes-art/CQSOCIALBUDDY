import { NextRequest, NextResponse } from "next/server";
import { generateClaudeReply } from "@/lib/ai/claude-client";
import { classifyMessage } from "@/lib/ai/classifier";
import { applyVariation } from "@/lib/ai/response-variation";
import { getAutoReplySettings, shouldAutoSend } from "@/lib/settings";
import { requireAuth } from "@/lib/auth/require-auth";

/**
 * POST /api/test-pipeline
 * Diagnostic test endpoint — runs each pipeline step and reports results.
 *
 * Body: { "text": "customer message here" }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  const { text } = await request.json();

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const steps: Record<string, unknown> = {};

  // Step 1: Generate Claude reply
  let claudeAnswer = "";
  let claudeConfidence = 0;
  try {
    const result = await generateClaudeReply({ message: text });
    claudeAnswer = result.answer;
    claudeConfidence = result.confidence;
    steps.claude = {
      status: "ok",
      answerLength: claudeAnswer.length,
      confidence: claudeConfidence,
      preview: claudeAnswer.slice(0, 200),
    };
  } catch (err) {
    steps.claude = {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Step 2: Classify
  const { classification, confidence } = classifyMessage(text, claudeConfidence);
  steps.classifier = { classification, confidence };

  // Step 3: Apply variation
  const draftContent = applyVariation({
    vapiAnswer: claudeAnswer,
    classification,
    conversationId: "test-diag",
  });
  steps.variation = {
    hasContent: !!draftContent,
    contentLength: draftContent.length,
    preview: draftContent.slice(0, 200),
  };

  // Step 4: Check settings
  const settings = await getAutoReplySettings();
  const wouldAutoSend = shouldAutoSend(settings, classification, confidence) && !!draftContent;
  steps.settings = {
    globalEnabled: settings.global_auto_reply_enabled,
    faqMode: settings.dm_faq_mode,
    threshold: settings.confidence_threshold,
    wouldAutoSend,
  };

  return NextResponse.json({ status: "ok", steps });
}
