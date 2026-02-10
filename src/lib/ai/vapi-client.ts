interface VapiQueryResponse {
  answer: string;
  confidence: number;
  sources?: Array<{ title: string; content: string }>;
  raw: Record<string, unknown>;
}

/**
 * Query the Vapi knowledge base for a response to a customer message.
 * Includes conversation history for context.
 */
export async function queryVapiKnowledgeBase(params: {
  message: string;
  conversationHistory?: string[];
}): Promise<VapiQueryResponse> {
  const apiKey = process.env.VAPI_API_KEY;
  const knowledgeBaseId = process.env.VAPI_KNOWLEDGE_BASE_ID;

  if (!apiKey || !knowledgeBaseId) {
    throw new Error("Vapi API key or knowledge base ID not configured");
  }

  // Build context from conversation history
  const context = params.conversationHistory?.length
    ? `Previous messages:\n${params.conversationHistory.join("\n")}\n\nCurrent message: ${params.message}`
    : params.message;

  try {
    const response = await fetch(
      `https://api.vapi.ai/knowledge-base/${knowledgeBaseId}/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: context,
          topK: 5,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Vapi API error: ${error.message || response.statusText}`
      );
    }

    const data = await response.json();

    // Extract answer and estimate confidence from the response
    const answer = data.answer || data.text || "";
    const confidence = estimateConfidence(data);

    return {
      answer,
      confidence,
      sources: data.sources || [],
      raw: data,
    };
  } catch (error) {
    console.error("Vapi query failed:", error);
    // Return a low-confidence fallback so the message gets flagged
    return {
      answer: "",
      confidence: 0,
      raw: { error: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}

/**
 * Estimate confidence from Vapi response data.
 * Uses similarity scores if available, otherwise heuristics.
 */
function estimateConfidence(data: Record<string, unknown>): number {
  // If Vapi returns a confidence/score directly
  if (typeof data.confidence === "number") return data.confidence;
  if (typeof data.score === "number") return data.score;

  // If there are source results with scores
  const sources = data.sources as Array<{ score?: number }> | undefined;
  if (sources?.length) {
    const avgScore =
      sources.reduce((sum, s) => sum + (s.score || 0), 0) / sources.length;
    if (avgScore > 0) return Math.min(avgScore, 1);
  }

  // If we got an answer back, give it moderate confidence
  const answer = data.answer || data.text;
  if (answer && typeof answer === "string" && answer.length > 20) {
    return 0.6;
  }

  // No good answer
  return 0.2;
}
