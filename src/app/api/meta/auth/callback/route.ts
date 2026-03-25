import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/meta/oauth";
import { exchangeForLongLivedToken } from "@/lib/meta/client";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const host = request.headers.get("host") || request.nextUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${protocol}://${host}`;

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=${encodeURIComponent(searchParams.get("error_description") || "Facebook login was denied")}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=${encodeURIComponent("No authorization code received")}`
    );
  }

  try {
    const redirectUri = `${baseUrl}/api/meta/auth/callback`;

    // 1. Exchange code to verify OAuth worked
    const { accessToken: shortToken } = await exchangeCodeForToken(code, redirectUri);

    // 2. Get long-lived user token
    const { accessToken: longToken, expiresIn } = await exchangeForLongLivedToken(
      shortToken, process.env.META_APP_ID!, process.env.META_APP_SECRET!
    );

    // 3. Get page info using the existing page token (business-managed pages
    //    don't show up in /me/accounts, so we use the token directly)
    const pageToken = process.env.FB_PAGE_ACCESS_TOKEN!;
    const pageRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,instagram_business_account{id,username,name,biography,followers_count}&access_token=${pageToken}`
    );

    if (!pageRes.ok) {
      throw new Error("Failed to fetch page info from existing token");
    }

    const pageData = await pageRes.json();

    // 4. Store directly in database — no page picker needed
    const admin = createAdminClient();

    // Upsert Facebook page
    await admin.from("platform_accounts").upsert(
      {
        platform: "facebook",
        platform_account_id: pageData.id,
        account_name: pageData.name,
        access_token: pageToken,
        user_access_token: longToken,
        user_token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        instagram_business_account_id: pageData.instagram_business_account?.id || null,
        permissions_granted: [
          "pages_show_list", "pages_read_engagement", "pages_manage_metadata",
          "pages_messaging", "instagram_basic", "instagram_manage_messages",
        ],
        is_active: true,
      },
      { onConflict: "platform,platform_account_id" }
    );

    // Upsert Instagram account if linked
    if (pageData.instagram_business_account) {
      const ig = pageData.instagram_business_account;
      await admin.from("platform_accounts").upsert(
        {
          platform: "instagram",
          platform_account_id: ig.id,
          account_name: ig.username || ig.name || pageData.name,
          access_token: pageToken,
          user_access_token: longToken,
          user_token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
          instagram_business_account_id: ig.id,
          permissions_granted: ["instagram_basic", "instagram_manage_messages"],
          is_active: true,
        },
        { onConflict: "platform,platform_account_id" }
      );
    }

    // 5. Subscribe page to webhooks
    try {
      await fetch(`https://graph.facebook.com/v21.0/${pageData.id}/subscribed_apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${pageToken}` },
        body: JSON.stringify({ subscribed_fields: "messages,feed" }),
      });
    } catch (e) {
      console.error("[oauth-callback] Webhook subscription failed:", e);
    }

    return NextResponse.redirect(`${baseUrl}/settings/integrations?connected=true`);
  } catch (err) {
    console.error("[oauth-callback] Error:", err);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=${encodeURIComponent(err instanceof Error ? err.message : "OAuth failed")}`
    );
  }
}
