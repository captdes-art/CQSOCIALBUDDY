import type { Classification } from "@/types";

interface ClassificationResult {
  classification: Classification;
  confidence: number;
}

// Keyword sets for each classification
const BOOKING_KEYWORDS = [
  "book",
  "reserve",
  "reservation",
  "availability",
  "available",
  "trip",
  "charter",
  "schedule",
  "spots",
  "openings",
  "tickets",
  "sign up",
  "deposit",
  "how much",
  "pricing",
  "cost",
  "rate",
  "dates",
  "what days",
  "sailing",
  "fishing trip",
];

const COMPLAINT_KEYWORDS = [
  "refund",
  "cancel",
  "cancellation",
  "terrible",
  "worst",
  "horrible",
  "disappointed",
  "upset",
  "angry",
  "sue",
  "lawyer",
  "attorney",
  "bbb",
  "better business",
  "rip off",
  "ripoff",
  "scam",
  "fraud",
  "never again",
  "disgusted",
  "demand",
  "unacceptable",
  "manager",
  "speak to someone",
];

const COMPLIMENT_KEYWORDS = [
  "amazing",
  "great time",
  "best",
  "thank",
  "thanks",
  "awesome",
  "loved it",
  "incredible",
  "fantastic",
  "wonderful",
  "excellent",
  "perfect",
  "had a blast",
  "so much fun",
  "recommend",
  "five stars",
  "5 stars",
  "can't wait to come back",
];

const SPAM_PATTERNS = [
  /\b(viagra|crypto|bitcoin|lottery|winner|claim your)\b/i,
  /\b(click here|free money|guaranteed|act now)\b/i,
  /https?:\/\/[^\s]+\.(xyz|click|buzz|loan)/i,
  /\b(dm me for|check my bio|follow for follow)\b/i,
];

/**
 * Classify an incoming message based on content and Vapi confidence.
 */
export function classifyMessage(
  messageText: string,
  vapiConfidence: number
): ClassificationResult {
  const text = messageText.toLowerCase();

  // Check spam first — highest priority
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return { classification: "spam", confidence: 0.95 };
    }
  }

  // Check complaints — flag these, never auto-respond
  const complaintScore = calculateKeywordScore(text, COMPLAINT_KEYWORDS);
  if (complaintScore >= 0.3) {
    return { classification: "complaint", confidence: Math.min(0.5 + complaintScore, 0.95) };
  }

  // Check compliments
  const complimentScore = calculateKeywordScore(text, COMPLIMENT_KEYWORDS);
  if (complimentScore >= 0.3) {
    return { classification: "compliment", confidence: Math.min(0.6 + complimentScore, 0.95) };
  }

  // Check booking questions
  const bookingScore = calculateKeywordScore(text, BOOKING_KEYWORDS);
  if (bookingScore >= 0.2) {
    return { classification: "booking", confidence: Math.min(0.6 + bookingScore, 0.95) };
  }

  // If Vapi confidence is low or message is very long with multiple questions, flag as complex
  const questionCount = (text.match(/\?/g) || []).length;
  if (vapiConfidence < 0.4 || (text.length > 500 && questionCount >= 3)) {
    return { classification: "complex", confidence: 0.3 };
  }

  // Default: FAQ with Vapi's confidence
  return { classification: "faq", confidence: vapiConfidence };
}

/**
 * Calculate a score based on how many keywords from the set appear in the text.
 */
function calculateKeywordScore(text: string, keywords: string[]): number {
  let matches = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      matches++;
    }
  }
  return matches / Math.max(keywords.length * 0.1, 1); // normalize
}
