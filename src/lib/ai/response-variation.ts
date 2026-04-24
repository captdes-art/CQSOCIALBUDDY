import type { Classification } from "@/types";

const GREETINGS = [
  "Hey there!",
  "Hey!",
  "Hi!",
  "Ahoy!",
  "Hey, great to hear from you!",
  "Hi there!",
  "What's up!",
];

const SIGN_OFFS = [
  "Tight lines! 🎣",
  "See you on the water! 🚤",
  "Can't wait to get you out there! 🌊",
  "Hope to see you soon! ⚓",
  "Looking forward to having you aboard! 🎣",
  "Fish on! 🐟",
];

const COMPLIMENT_RESPONSES = [
  "That's so awesome to hear! We love getting people out on the water.",
  "You just made our crew's day! Thanks so much for the kind words.",
  "Nothing beats hearing stuff like this! Glad you had a great time.",
  "That means the world to us! We put everything into making sure folks have a blast.",
  "We're grinning ear to ear reading this! Thanks for taking the time to reach out.",
  "You're the best! We had a great time having you aboard too.",
];

// Track recently used variations to avoid repeats
const recentlyUsed = new Map<string, string[]>();
const MAX_HISTORY = 5;

/**
 * Pick a random item from an array, avoiding recent picks for this conversation.
 */
function pickVariation(
  items: string[],
  conversationId: string,
  category: string
): string {
  const key = `${conversationId}:${category}`;
  const history = recentlyUsed.get(key) || [];

  // Filter out recently used items
  const available = items.filter((item) => !history.includes(item));
  const pool = available.length > 0 ? available : items;

  const pick = pool[Math.floor(Math.random() * pool.length)];

  // Update history
  history.push(pick);
  if (history.length > MAX_HISTORY) history.shift();
  recentlyUsed.set(key, history);

  return pick;
}

/**
 * Apply response variation to a Vapi-generated draft.
 * Makes similar answers sound different so it doesn't look robotic.
 */
export function applyVariation(params: {
  vapiAnswer: string;
  classification: Classification;
  conversationId: string;
}): string {
  const { vapiAnswer, classification } = params;

  switch (classification) {
    case "compliment": {
      // Use Claude's context-aware response so each reply references what the
      // customer actually said. Fall back to canned variations only if Claude failed.
      const signOff = pickVariation(SIGN_OFFS, "__global__", "signoff");
      if (vapiAnswer?.trim()) {
        return `${vapiAnswer}\n\n${signOff}`;
      }
      const response = pickVariation(COMPLIMENT_RESPONSES, "__global__", "compliment");
      return `${response}\n\n${signOff}`;
    }

    case "booking": {
      if (!vapiAnswer?.trim()) return "";
      const greeting = pickVariation(GREETINGS, "__global__", "greeting");
      const signOff = pickVariation(SIGN_OFFS, "__global__", "signoff");
      return `${greeting} ${vapiAnswer}\n\n${signOff}`;
    }

    case "faq": {
      // If Claude didn't produce an answer (e.g. knowledge base fetch failed),
      // return empty so the message gets flagged for manual response
      if (!vapiAnswer?.trim()) return "";
      const greeting = pickVariation(GREETINGS, "__global__", "greeting");
      const signOff = pickVariation(SIGN_OFFS, "__global__", "signoff");
      return `${greeting} ${vapiAnswer}\n\n${signOff}`;
    }

    // Complaints and complex messages: keep Claude's answer as a suggested draft
    // for admin review — it will never be auto-sent (processor enforces this)
    case "complaint":
    case "complex":
      return vapiAnswer;

    case "spam":
      return "";

    default:
      return vapiAnswer;
  }
}
