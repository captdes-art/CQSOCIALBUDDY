interface VapiQueryResponse {
  answer: string;
  confidence: number;
  sources?: Array<{ title: string; content: string }>;
  raw: Record<string, unknown>;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Query the custom Celtic Quest RAG knowledge base hosted on Vercel.
 * Uses the OpenAI-compatible /chat/completions endpoint.
 * Includes conversation history for multi-turn context.
 */
export async function queryVapiKnowledgeBase(params: {
  message: string;
  conversationHistory?: string[];
}): Promise<VapiQueryResponse> {
  const ragUrl = process.env.VAPI_RAG_URL;
  const apiKey = process.env.VAPI_API_KEY;

  if (!ragUrl) {
    throw new Error("VAPI_RAG_URL not configured");
  }

  // Build messages array in OpenAI chat format
  const messages: ChatMessage[] = [];

  // Add system message for social media response context
  messages.push({
    role: "system",
    content:
      "You are a helpful assistant for Celtic Quest Fishing. " +
      "Answer customer questions accurately using the knowledge base. " +
      "Keep responses friendly, concise, and suitable for social media DMs.",
  });

  // Add conversation history as alternating user/assistant messages
  if (params.conversationHistory?.length) {
    for (const msg of params.conversationHistory) {
      if (msg.startsWith("Customer: ")) {
        messages.push({ role: "user", content: msg.replace("Customer: ", "") });
      } else if (msg.startsWith("Celtic Quest: ")) {
        messages.push({
          role: "assistant",
          content: msg.replace("Celtic Quest: ", ""),
        });
      }
    }
  }

  // Add the current message
  messages.push({ role: "user", content: params.message });

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Include API key as Bearer token if configured
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${ragUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `RAG API error (${response.status}): ${errorText || response.statusText}`
      );
    }

    // The RAG endpoint returns a streaming SSE response.
    // Collect all chunks into a complete answer.
    const body = await response.text();
    const { answer, finishReason } = parseSSEResponse(body);

    const confidence = estimateConfidence(answer, finishReason);

    return {
      answer,
      confidence,
      sources: [],
      raw: { finishReason, streamResponse: true },
    };
  } catch (error) {
    console.error("RAG knowledge base query failed:", error);
    // Return a low-confidence fallback so the message gets flagged
    return {
      answer: "",
      confidence: 0,
      raw: { error: error instanceof Error ? error.message : "Unknown error" },
    };
  }
}

/**
 * Parse a streaming SSE response into a complete answer string.
 * Each line is formatted as: data: {"choices":[{"delta":{"content":"word"}}]}
 */
function parseSSEResponse(body: string): {
  answer: string;
  finishReason: string | null;
} {
  let answer = "";
  let finishReason: string | null = null;

  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ") || trimmed === "data: [DONE]") continue;

    try {
      const json = JSON.parse(trimmed.slice(6));
      const delta = json.choices?.[0]?.delta;
      if (delta?.content) {
        answer += delta.content;
      }
      if (json.choices?.[0]?.finish_reason) {
        finishReason = json.choices[0].finish_reason;
      }
    } catch {
      // Skip malformed lines
    }
  }

  return { answer, finishReason };
}

/**
 * Estimate confidence from the RAG response.
 * Uses response quality heuristics since the custom RAG
 * may not return explicit confidence scores.
 */
function estimateConfidence(
  answer: string,
  finishReason: string | null
): number {
  if (finishReason === "stop" && answer.length > 50) {
    return 0.85; // Clean completion with substantial answer
  }

  if (finishReason === "stop" && answer.length > 20) {
    return 0.7; // Clean completion with shorter answer
  }

  // If we got a reasonable answer back
  if (answer && answer.length > 20) {
    return 0.6;
  }

  // Short or empty answer — low confidence
  return 0.2;
}
