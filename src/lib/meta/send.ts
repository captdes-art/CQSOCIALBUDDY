const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

function getPageToken(): string {
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("FB_PAGE_ACCESS_TOKEN not configured");
  return token;
}

/**
 * Send a DM via Facebook Messenger or Instagram using the page access token.
 * Instagram DMs use /{page-or-ig-id}/messages, Facebook uses /me/messages.
 */
export async function sendFacebookDM(
  recipientId: string,
  message: string,
  options?: { platform?: string; pageId?: string }
): Promise<string> {
  const token = getPageToken();
  const isInstagram = options?.platform === "instagram_dm";

  // Instagram DMs require the Instagram-scoped page ID as the endpoint
  const endpoint = isInstagram && options?.pageId
    ? `${GRAPH_API_BASE}/${options.pageId}/messages`
    : `${GRAPH_API_BASE}/me/messages`;

  console.log("[meta-send] Sending DM to:", recipientId, "via:", endpoint);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `DM send failed: ${(error as Record<string, Record<string, string>>).error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  console.log("[meta-send] DM sent, message_id:", data.message_id);
  return data.message_id;
}

/**
 * Reply publicly to a Facebook comment.
 */
export async function replyToFacebookComment(
  commentId: string,
  message: string
): Promise<string> {
  const token = getPageToken();

  console.log("[meta-send] Replying to comment:", commentId);

  const response = await fetch(
    `${GRAPH_API_BASE}/${commentId}/comments?access_token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `FB comment reply failed: ${(error as Record<string, Record<string, string>>).error?.message || response.statusText}`
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
 */
export async function sendPrivateReply(
  commentId: string,
  message: string
): Promise<string> {
  const token = getPageToken();

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
