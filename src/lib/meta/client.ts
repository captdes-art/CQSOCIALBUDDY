const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

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
  // Facebook Messenger: POST /me/messages
  // Instagram: POST /{page-id}/messages
  const endpoint =
    platform === "facebook"
      ? `${GRAPH_API_BASE}/me/messages`
      : `${GRAPH_API_BASE}/${pageId}/messages`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Meta API error: ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  return { messageId: data.message_id };
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
 */
export async function getUserProfile(
  userId: string,
  { accessToken }: MetaApiOptions
): Promise<UserProfileResult> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${userId}?fields=id,name,profile_pic&access_token=${accessToken}`
  );

  if (!response.ok) {
    // If profile fetch fails, return just the ID
    return { id: userId };
  }

  return response.json();
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
