import Anthropic from "@anthropic-ai/sdk";

const PROMPT_URL =
  "https://celtic-quest-voice-ai.vercel.app/get_text_prompt";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

let cachedPrompt: { text: string; fetchedAt: number } | null = null;

/**
 * Fetch the Celtic Quest system prompt from the voice-AI service.
 * Caches for 10 minutes to avoid hammering the endpoint.
 */
async function getSystemPrompt(): Promise<string> {
  if (cachedPrompt && Date.now() - cachedPrompt.fetchedAt < CACHE_TTL) {
    return cachedPrompt.text;
  }

  console.log("[claude] Fetching system prompt from", PROMPT_URL);
  const response = await fetch(PROMPT_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch system prompt: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  // Handle different response shapes from the endpoint
  const text =
    typeof data === "string"
      ? data
      : data.prompt || data.text || data.system_prompt || JSON.stringify(data);

  cachedPrompt = { text, fetchedAt: Date.now() };
  console.log("[claude] System prompt cached, length:", text.length);
  return text;
}

/**
 * Generate a reply using Claude Sonnet with the Celtic Quest knowledge base.
 * The system prompt includes the full knowledge base (~79K chars, 205 chunks).
 */
export async function generateClaudeReply(params: {
  message: string;
  conversationHistory?: string[];
  isComment?: boolean;
}): Promise<{ answer: string; confidence: number }> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemPrompt = await getSystemPrompt();

  // Add context about the channel so Claude adapts tone
  const channelContext = params.isComment
    ? "\n\nThis message is from a Facebook post comment. Keep the response concise and helpful for a public audience."
    : "\n\nThis message is from a Facebook Messenger DM. Be friendly, helpful, and conversational.";

  // Build messages array from conversation history
  const messages: Anthropic.MessageParam[] = [];

  if (params.conversationHistory?.length) {
    for (const msg of params.conversationHistory) {
      if (msg.startsWith("Customer: ")) {
        messages.push({
          role: "user",
          content: msg.replace("Customer: ", ""),
        });
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

  console.log(
    "[claude] Calling Claude Sonnet, messages:",
    messages.length,
    "isComment:",
    !!params.isComment
  );

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: systemPrompt + channelContext,
    messages,
  });

  const answer =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Estimate confidence based on response quality
  const confidence =
    response.stop_reason === "end_turn" && answer.length > 50
      ? 0.85
      : answer.length > 20
        ? 0.7
        : 0.3;

  console.log(
    "[claude] Response length:",
    answer.length,
    "confidence:",
    confidence
  );

  return { answer, confidence };
}
