import Anthropic from "@anthropic-ai/sdk";

const PROMPT_BASE_URL =
  process.env.VAPI_RAG_URL || "https://celtic-quest-voice-ai.vercel.app";
const PROMPT_URL = `${PROMPT_BASE_URL}/get_text_prompt`;
const KB_URL = `${PROMPT_BASE_URL}/kb_content`;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

let cachedPrompt: { text: string; fetchedAt: number } | null = null;

/**
 * Build Basic Auth header for Voice AI admin endpoints.
 */
function getAuthHeader(): string {
  const username = process.env.VOICE_AI_ADMIN_USERNAME;
  const password = process.env.VOICE_AI_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "Missing VOICE_AI_ADMIN_USERNAME or VOICE_AI_ADMIN_PASSWORD env vars — cannot fetch knowledge base"
    );
  }

  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

/**
 * Fetch the Celtic Quest system prompt + knowledge base from the voice-AI service.
 * The prompt template has a {context} placeholder that gets filled with the KB content.
 * Caches the assembled prompt for 10 minutes.
 */
// Static fallback used when the Voice AI knowledge-base service is unreachable
// (auth failure, service down, env var missing). Without this, the entire
// auto-reply path silently fails and conversations end up flagged with no draft.
const FALLBACK_SYSTEM_PROMPT = `You are the customer-service AI for Celtic Quest Fishing Fleet, a family-friendly fishing charter business based out of Port Jefferson and Jamesport, Long Island, NY.

Tone: warm, friendly, nautical, helpful. Keep replies short and personable — usually 1-3 sentences for comments and short paragraphs for DMs. Never invent specific schedules, prices, or availability you do not know.

When you don't know a specific fact (exact prices, exact dates, captain names, specific catch reports), say something like "let me check on that for you — please send us a DM or call 631-928-3926 / visit celticquestfishing.com" rather than guessing.

Always be encouraging and inviting, sign off with something like "Tight lines!" or "Hope to see you on the water!" when natural.`;

async function getSystemPrompt(): Promise<string> {
  if (cachedPrompt && Date.now() - cachedPrompt.fetchedAt < CACHE_TTL) {
    return cachedPrompt.text;
  }

  let authHeader: string | null = null;
  try {
    authHeader = getAuthHeader();
  } catch (err) {
    console.warn("[claude] KB auth header missing, using fallback prompt:", err);
    return FALLBACK_SYSTEM_PROMPT;
  }

  // Fetch prompt template and knowledge base content in parallel
  console.log("[claude] Fetching system prompt + knowledge base");
  let promptRes: Response;
  let kbRes: Response;
  try {
    [promptRes, kbRes] = await Promise.all([
      fetch(PROMPT_URL, { headers: { Authorization: authHeader } }),
      fetch(KB_URL, { headers: { Authorization: authHeader } }),
    ]);
  } catch (err) {
    console.warn("[claude] KB fetch threw, using fallback prompt:", err);
    return FALLBACK_SYSTEM_PROMPT;
  }

  if (!promptRes.ok) {
    console.warn(
      `[claude] KB prompt request failed (${promptRes.status} ${promptRes.statusText}) — using fallback prompt so the AI can still draft a reply.`
    );
    return FALLBACK_SYSTEM_PROMPT;
  }

  // Extract prompt template
  const promptData = await promptRes.json();
  const promptTemplate =
    typeof promptData === "string"
      ? promptData
      : promptData.prompt || promptData.text || promptData.system_prompt || "";

  // Extract knowledge base content
  let kbContent = "";
  if (kbRes.ok) {
    const kbData = await kbRes.json();
    kbContent = kbData.content || kbData.text || "";
    console.log("[claude] Knowledge base loaded, length:", kbContent.length);
  } else {
    console.warn("[claude] Failed to fetch KB content:", kbRes.status, "— using prompt template only");
  }

  // Inject knowledge base into the {context} placeholder
  const assembled = kbContent
    ? promptTemplate.replace("{context}", kbContent)
    : promptTemplate;

  cachedPrompt = { text: assembled, fetchedAt: Date.now() };
  console.log("[claude] System prompt assembled, length:", assembled.length);
  return assembled;
}

/**
 * Generate a reply using Claude Sonnet with the Celtic Quest knowledge base.
 * The system prompt includes the full knowledge base (~79K chars, 205 chunks).
 */
export async function generateClaudeReply(params: {
  message: string;
  conversationHistory?: string[];
  isComment?: boolean;
}): Promise<{ answer: string; confidence: number; sentiment: string }> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const systemPrompt = await getSystemPrompt();

  // Add context about the channel so Claude adapts tone
  const channelContext = params.isComment
    ? "\n\nThis message is from a Facebook post comment. Keep the response concise and helpful for a public audience."
    : "\n\nThis message is from a social media DM (Facebook Messenger or Instagram). Be friendly, helpful, and conversational.";

  // Ask Claude to classify the customer's sentiment
  const classificationInstruction = `

IMPORTANT: Before your reply, output a single JSON line with your classification of the customer's message sentiment. Use this exact format on the first line:
{"sentiment":"<one of: positive, neutral, negative, complaint>"}

Use "complaint" for ANY expression of dissatisfaction, unhappiness, frustration, anger, or negative experience — even mild ones like "I was unhappy" or "not great". When in doubt between negative and complaint, choose complaint.
Use "negative" for mildly negative but not complaint-worthy messages (e.g. "the weather was bad").
Use "positive" for compliments, thanks, excitement.
Use "neutral" for questions, booking inquiries, general info requests.

Then write your reply on the next line. Do NOT include the JSON in your reply text.`;

  // Build messages array from conversation history.
  // Anthropic API requires strictly alternating user/assistant roles.
  // Merge consecutive same-role messages to avoid API errors.
  const messages: Anthropic.MessageParam[] = [];

  if (params.conversationHistory?.length) {
    for (const msg of params.conversationHistory) {
      const isCustomer = msg.startsWith("Customer: ");
      const role = isCustomer ? "user" : "assistant";
      const content = isCustomer
        ? msg.replace("Customer: ", "")
        : msg.replace("Celtic Quest: ", "");

      if (!content) continue;

      const last = messages[messages.length - 1];
      if (last && last.role === role) {
        // Merge consecutive same-role messages
        last.content += `\n${content}`;
      } else {
        messages.push({ role, content });
      }
    }
  }

  // Add the current message (merge if last message is also from user)
  const last = messages[messages.length - 1];
  if (last && last.role === "user") {
    last.content += `\n${params.message}`;
  } else {
    messages.push({ role: "user", content: params.message });
  }

  console.log(
    "[claude] Calling Claude Sonnet, messages:",
    messages.length,
    "isComment:",
    !!params.isComment
  );

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    system: systemPrompt + channelContext + classificationInstruction,
    messages,
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Parse sentiment from the first line and extract the actual reply
  let sentiment = "neutral";
  let answer = rawText;

  const firstLineEnd = rawText.indexOf("\n");
  if (firstLineEnd > 0) {
    const firstLine = rawText.slice(0, firstLineEnd).trim();
    try {
      const parsed = JSON.parse(firstLine);
      if (parsed.sentiment) {
        sentiment = parsed.sentiment;
        answer = rawText.slice(firstLineEnd + 1).trim();
      }
    } catch {
      // If parsing fails, use the full text as the answer
      console.warn("[claude] Could not parse sentiment JSON from first line:", firstLine);
    }
  }

  // Estimate confidence based on response quality
  const confidence =
    response.stop_reason === "end_turn"
      ? answer.length > 10
        ? 0.85
        : 0.7
      : answer.length > 20
        ? 0.7
        : 0.3;

  console.log(
    "[claude] Response length:",
    answer.length,
    "confidence:",
    confidence
  );

  return { answer, confidence, sentiment };
}
