const GRAPH_API_BASE = "https://graph.facebook.com/v21.0";

const REQUIRED_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_read_user_content",
  "pages_manage_metadata",
  "pages_manage_engagement",
  "pages_messaging",
  "instagram_basic",
  "instagram_manage_messages",
];

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
    username?: string;
    name?: string;
    biography?: string;
    followers_count?: number;
  };
}

/**
 * Build the Facebook OAuth dialog URL.
 */
export function getOAuthUrl(redirectUri: string): string {
  const appId = process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID;
  if (!appId) throw new Error("META_APP_ID is not configured");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: REQUIRED_SCOPES.join(","),
    response_type: "code",
    state: crypto.randomUUID(),
  });

  return `https://www.facebook.com/v21.0/dialog/oauth?${params}`;
}

/**
 * Exchange an authorization code for a short-lived user access token.
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("META_APP_ID or META_APP_SECRET not configured");

  const response = await fetch(
    `${GRAPH_API_BASE}/oauth/access_token?` +
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      })
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token exchange failed: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Get all Pages the user manages, including linked Instagram business accounts.
 */
export async function getUserPages(userAccessToken: string): Promise<FacebookPage[]> {
  const response = await fetch(
    `${GRAPH_API_BASE}/me/accounts?` +
      new URLSearchParams({
        fields: "id,name,access_token,instagram_business_account{id,username,name,biography,followers_count}",
        access_token: userAccessToken,
      })
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to fetch pages: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Subscribe a Page to webhook events (messages, feed).
 */
export async function subscribePageToWebhooks(
  pageId: string,
  pageAccessToken: string
): Promise<void> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${pageId}/subscribed_apps`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pageAccessToken}`,
      },
      body: JSON.stringify({
        subscribed_fields: "messages,feed",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Webhook subscription failed: ${error.error?.message || response.statusText}`);
  }
}

/**
 * Get current webhook subscriptions for a Page.
 */
export async function getPageWebhookSubscriptions(
  pageId: string,
  pageAccessToken: string
): Promise<{ data: Array<{ name: string; subscribed_fields: string[] }> }> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${pageId}/subscribed_apps?access_token=${pageAccessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get subscriptions: ${error.error?.message || response.statusText}`);
  }

  return response.json();
}
