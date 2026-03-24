import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getUserPages } from "@/lib/meta/oauth";
import { exchangeForLongLivedToken, getUserProfile } from "@/lib/meta/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Build baseUrl from the request's Host header to match what the browser sent.
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

    // 1. Exchange code for short-lived token
    const { accessToken: shortToken } = await exchangeCodeForToken(code, redirectUri);

    // 2. Exchange for long-lived user token (60 days)
    const appId = process.env.META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;
    const { accessToken: longToken, expiresIn } = await exchangeForLongLivedToken(
      shortToken, appId, appSecret
    );

    // 3. Try to fetch user's pages
    let pages = await getUserPages(longToken);

    // 4. Fallback: if /me/accounts returns empty (business-managed pages),
    //    use the existing FB_PAGE_ACCESS_TOKEN to identify the page
    if (pages.length === 0 && process.env.FB_PAGE_ACCESS_TOKEN) {
      const pageToken = process.env.FB_PAGE_ACCESS_TOKEN;
      const res = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id,name,access_token,instagram_business_account{id,username,name,biography,followers_count}&access_token=${pageToken}`
      );
      if (res.ok) {
        const pageData = await res.json();
        pages = [{
          id: pageData.id,
          name: pageData.name,
          access_token: pageToken,
          instagram_business_account: pageData.instagram_business_account || undefined,
        }];
      }
    }

    if (pages.length === 0) {
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=${encodeURIComponent("No Facebook Pages found. Make sure you manage at least one Page.")}`
      );
    }

    // 5. Store pages data in cookie for the page picker
    const oauthData = JSON.stringify({
      userToken: longToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      pages: pages.map((p) => ({
        id: p.id,
        name: p.name,
        accessToken: p.access_token,
        instagramBusinessAccount: p.instagram_business_account || null,
      })),
    });

    const response = NextResponse.redirect(
      `${baseUrl}/settings/integrations?step=select-page`
    );

    response.cookies.set("meta_oauth_data", Buffer.from(oauthData).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[oauth-callback] Error:", err);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=${encodeURIComponent(err instanceof Error ? err.message : "OAuth failed")}`
    );
  }
}
