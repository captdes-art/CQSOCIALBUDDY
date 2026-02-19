/**
 * Keywords that indicate a comment is worth replying to.
 * We only auto-reply to comments that look like questions or booking intent.
 * Skip reactions, emojis-only, tags, etc.
 */
const REPLY_KEYWORDS = [
  // Questions (the ? check is separate below)
  "how", "what", "when", "where", "which", "who", "why",
  "can i", "can we", "do you", "is there", "are there",
  "does it", "how do", "tell me",
  // Booking intent
  "book", "reserve", "reservation", "availability", "available",
  "schedule", "trip", "charter", "tickets", "spots", "openings",
  // Pricing
  "price", "pricing", "cost", "rate", "rates", "how much", "fee",
  // Location/logistics
  "location", "address", "directions", "dock", "marina", "parking",
  "what time", "hours",
  // Fishing specific
  "fishing", "catch", "fish", "bait", "rod", "reel", "tackle",
  "species", "season",
];

/**
 * Decide whether we should auto-reply to a Facebook post comment.
 * Returns true if the comment looks like a question or booking inquiry.
 */
export function shouldReplyToComment(text: string): boolean {
  if (!text || text.trim().length < 3) return false;

  const lower = text.toLowerCase();

  // Always reply if there's a question mark
  if (lower.includes("?")) return true;

  // Check for keyword matches
  return REPLY_KEYWORDS.some((keyword) => lower.includes(keyword));
}
