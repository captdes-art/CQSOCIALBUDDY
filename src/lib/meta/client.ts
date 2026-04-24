const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

/**
 * Split a long message into chunks that fit within a character limit.
 * Splits at paragraph breaks first, then sentence breaks, then word breaks.
 */
function splitMessage(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLength) {
      chunks.push(remaining);
      break;
    }

    // Try to split at a paragraph break (\n\n)
    let splitAt = remaining.lastIndexOf("\n\n", maxLength);

    // If no paragraph break, try a single line break
    if (splitAt <= 0) {
      splitAt = remaining.lastIndexOf("\n", maxLength);
    }

    // If no line break, try a sentence break (. ! ?)
    if (splitAt <= 0) {
      const sentenceMatch = remaining.slice(0, maxLength).match(/[\s\S]*[.!?]\s/);
      if (sentenceMatch) {
        splitAt = sentenceMatch[0].length;
      }
    }

    // Last resort: split at a space
    if (splitAt <= 0) {
      splitAt = remaining.lastIndexOf(" ", maxLength);
    }

    // Absolute last resort: hard cut
    if (splitAt <= 0) {
      splitAt = maxLength;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  return chunks;
}

interface MetaApiOptions {
  accessToken: string;
}

interface SendMessageParams {
  recipientId: string;
  message: string;
  accessToken: string;
  pageId: string;
  platform: "facebook" | "instagram";
}

interface UserProfileResult {
  id: string;
  name?: string;
  profile_pic?: string;
}

/**
 * Send a message via the Meta Graph API.
 * Handles both Facebook Messenger and Instagram DMs.
 */
export async function sendMessage({
  recipientId,
  message,
  accessToken,
  pageId,
  platform,
}: SendMessageParams): Promise<{ messageId: string }> {
  // Always use /me/messages — works for both Facebook Messenger and Instagram DMs
  // when using a page token derived from an OAuth user token
  const endpoint = `${GRAPH_API_BASE}/me/messages`;

  // Instagram has a 1000 character limit per message.
  // Split long messages into multiple sends at natural break points.
  const chunks = splitMessage(message, 950);

  let lastMessageId = "";

  for (let i = 0; i < chunks.length; i++) {
    if (i > 0) {
      // Small delay between chunks so they arrive in order
      await new Promise((r) => setTimeout(r, 500));
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: chunks[i] },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Meta API error: ${error.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    lastMessageId = data.message_id;
    console.log(`[meta-client] Sent chunk ${i + 1}/${chunks.length}, id:`, lastMessageId);
  }

  return { messageId: lastMessageId };
}

/**
 * Reply to a comment on a Facebook or Instagram post.
 * Facebook: POST /{comment_id}/comments
 * Instagram: POST /{comment_id}/replies
 */
export async function replyToComment({
  commentId,
  message,
  accessToken,
  platform,
}: {
  commentId: string;
  message: string;
  accessToken: string;
  platform: "facebook" | "instagram";
}): Promise<{ commentId: string }> {
  const endpoint =
    platform === "facebook"
      ? `${GRAPH_API_BASE}/${commentId}/comments`
      : `${GRAPH_API_BASE}/${commentId}/replies`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Meta API comment reply error: ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  return { commentId: data.id };
}

/**
 * Fetch a user's profile info from Meta.
 *
 * Instagram exposes the profile directly at /{USER_ID}. Facebook Messenger
 * no longer does — we have to look the user up through /me/conversations,
 * which returns participant names. We try the direct endpoint first and
 * fall back to the conversations lookup when it fails.
 */
export async function getUserProfile(
  userId: string,
  { accessToken }: MetaApiOptions
): Promise<UserProfileResult> {
  // Direct profile endpoint — works for Instagram, usually fails for FB Messenger.
  try {
    const fields = "id,name,first_name,last_name,username,profile_pic";
    const directRes = await fetch(
      `${GRAPH_API_BASE}/${userId}?fields=${fields}&access_token=${accessToken}`
    );
    if (directRes.ok) {
      const data = await directRes.json();
      const name =
        data.name ||
        [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
        data.username ||
        undefined;
      if (name) {
        return { id: data.id || userId, name, profile_pic: data.profile_pic };
      }
    }
  } catch {
    // fall through to conversations lookup
  }

  // Fallback: find the user in the page's Messenger conversations.
  try {
    const convRes = await fetch(
      `${GRAPH_API_BASE}/me/conversations?fields=participants&user_id=${userId}&access_token=${accessToken}`
    );
    if (convRes.ok) {
      const data = await convRes.json();
      const threads = (data.data as Array<{ participants?: { data?: Array<{ id: string; name?: string }> } }>) || [];
      for (const thread of threads) {
        const match = thread.participants?.data?.find((p) => p.id === userId);
        if (match?.name) {
          return { id: userId, name: match.name };
        }
      }
    } else {
      const errBody = await convRes.text().catch(() => "");
      console.warn(
        "[getUserProfile] Conversations lookup failed for userId:",
        userId,
        "status:",
        convRes.status,
        "body:",
        errBody.slice(0, 200)
      );
    }
  } catch (err) {
    console.warn("[getUserProfile] Conversations lookup threw:", err);
  }

  return { id: userId };
}

/**
 * Exchange a short-lived token for a long-lived one (60 days).
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortLivedToken,
      })
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Token exchange failed: ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in, // seconds
  };
}

/**
 * Refresh an existing long-lived page access token.
 */
export async function refreshPageToken(
  currentToken: string,
  appId: string,
  appSecret: string
): Promise<{ accessToken: string; expiresIn: number }> {
  // For page tokens, we re-exchange to get a fresh long-lived token
  return exchangeForLongLivedToken(currentToken, appId, appSecret);
}
