import { createAdminClient } from "@/lib/supabase/server";

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

/**
 * Split a long message into chunks that fit within a character limit.
 * Splits at paragraph breaks first, then sentence breaks, then word breaks.
 */
function splitMessageChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    let splitAt = remaining.lastIndexOf("\n\n", maxLength);
    if (splitAt <= 0) splitAt = remaining.lastIndexOf("\n", maxLength);
    if (splitAt <= 0) {
      const sentenceMatch = remaining.slice(0, maxLength).match(/[\s\S]*[.!?]\s/);
      if (sentenceMatch) splitAt = sentenceMatch[0].length;
    }
    if (splitAt <= 0) splitAt = remaining.lastIndexOf(" ", maxLength);
    if (splitAt <= 0) splitAt = maxLength;

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  return chunks;
}

function getPageToken(): string {
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("FB_PAGE_ACCESS_TOKEN not configured");
  return token;
}

/**
 * Get the access token for a platform from the database.
 * Falls back to FB_PAGE_ACCESS_TOKEN env var.
 */
async function getTokenForPlatform(platform: string): Promise<string> {
  const dbPlatform = platform === "instagram_dm" ? "instagram" : "facebook";
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("platform_accounts")
    .select("access_token")
    .eq("platform", dbPlatform)
    .eq("is_active", true)
    .single();

  if (data?.access_token) return data.access_token;

  // Fallback to env var
  return getPageToken();
}

/**
 * Send a DM via Facebook Messenger or Instagram.
 * Instagram DMs use /{ig-account-id}/messages with the DB token.
 * Facebook uses /me/messages with the page token.
 */
export async function sendFacebookDM(
  recipientId: string,
  message: string,
  options?: { platform?: string; pageId?: string }
): Promise<string> {
  const token = await getTokenForPlatform(options?.platform || "facebook_messenger");

  // Always use /me/messages — works for both Facebook Messenger and Instagram DMs
  // when using a page token derived from an OAuth user token with instagram_manage_messages
  const endpoint = `${GRAPH_API_BASE}/me/messages`;

  console.log("[meta-send] Sending DM to:", recipientId, "platform:", options?.platform);

  // Split long messages into chunks (Instagram has 1000 char limit)
  const chunks = splitMessageChunks(message, 950);
  let lastMessageId = "";

  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, 500));
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: chunks[i] },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errMsg = (error as Record<string, Record<string, string>>).error?.message || response.statusText;
      console.error("[meta-send] DM send failed:", errMsg);
      throw new Error(`DM send failed: ${errMsg}`);
    }

    const data = await response.json();
    lastMessageId = data.message_id;
    console.log(`[meta-send] Sent chunk ${i + 1}/${chunks.length}, id:`, lastMessageId);
  }

  return lastMessageId;
}

/**
 * Reply publicly to a comment (Facebook or Instagram).
 * Facebook: POST /{comment_id}/comments
 * Instagram: POST /{comment_id}/replies
 */
export async function replyToFacebookComment(
  commentId: string,
  message: string,
  options?: { platform?: string }
): Promise<string> {
  const platform = options?.platform || "facebook_messenger";
  const token = await getTokenForPlatform(platform);
  const isInstagram = platform === "instagram_dm";

  // Instagram uses /replies, Facebook uses /comments
  const endpoint = isInstagram
    ? `${GRAPH_API_BASE}/${commentId}/replies`
    : `${GRAPH_API_BASE}/${commentId}/comments`;

  console.log("[meta-send] Replying to comment:", commentId, "platform:", platform);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Comment reply failed: ${(error as Record<string, Record<string, string>>).error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  console.log("[meta-send] Comment reply posted, id:", data.id);
  return data.id;
}

/**
 * Send a private reply (one-time DM) to someone who commented on a post.
 * Uses the Facebook Private Replies API.
 * Note: Only one private reply allowed per comment, within 7 days.
 * Note: Private replies are only available for Facebook, not Instagram.
 */
export async function sendPrivateReply(
  commentId: string,
  message: string,
  options?: { platform?: string }
): Promise<string> {
  const token = await getTokenForPlatform(options?.platform || "facebook_messenger");

  console.log("[meta-send] Sending private reply for comment:", commentId);

  const response = await fetch(
    `${GRAPH_API_BASE}/${commentId}/private_replies?access_token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorMsg =
      (error as Record<string, Record<string, string>>).error?.message ||
      response.statusText;

    // If private replies fail (common — user may have privacy settings),
    // log but don't throw so the public reply still works
    console.warn("[meta-send] Private reply failed:", errorMsg);
    throw new Error(`FB private reply failed: ${errorMsg}`);
  }

  const data = await response.json();
  console.log("[meta-send] Private reply sent, id:", data.id);
  return data.id;
}

/**
 * Random delay between min and max milliseconds.
 * Used to make comment replies look natural.
 */
export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  console.log("[meta-send] Waiting", delay, "ms before replying");
  return new Promise((resolve) => setTimeout(resolve, delay));
}
