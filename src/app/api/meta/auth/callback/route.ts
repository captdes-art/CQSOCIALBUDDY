import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getUserPages } from "@/lib/meta/oauth";
import { exchangeForLongLivedToken } from "@/lib/meta/client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Build baseUrl from the request's Host header to match what the browser sent.
  // NEVER use NEXT_PUBLIC_APP_URL — it gets baked in at build time from .env.local.
  const host = request.headers.get("host") || request.nextUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${protocol}://${host}`;

  if (error) {
    console.error("Facebook OAuth error:", error, searchParams.get("error_description"));
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
    console.log("[oauth-callback] baseUrl:", baseUrl);
    console.log("[oauth-callback] redirectUri:", redirectUri);
    console.log("[oauth-callback] code length:", code.length);

    // 1. Exchange code for short-lived token
    const { accessToken: shortToken } = await exchangeCodeForToken(code, redirectUri);
    console.log("[oauth-callback] Got short token, length:", shortToken.length);

    // 2. Exchange for long-lived user token (60 days)
    const appId = process.env.META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;
    const { accessToken: longToken, expiresIn } = await exchangeForLongLivedToken(
      shortToken,
      appId,
      appSecret
    );

    console.log("[oauth-callback] Got long token, expiresIn:", expiresIn);

    // 3. Fetch user's pages
    const pages = await getUserPages(longToken);
    console.log("[oauth-callback] Got pages:", pages.length, pages.map(p => p.name));

    if (pages.length === 0) {
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=${encodeURIComponent("No Facebook Pages found. Make sure you manage at least one Page.")}`
      );
    }

    // 4. Store pages data temporarily so the page picker can access it
    // Note: user session is checked later in the /connect step
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

    // Set a short-lived cookie with the OAuth data (5 minutes)
    response.cookies.set("meta_oauth_data", Buffer.from(oauthData).toString("base64"), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[oauth-callback] FULL ERROR:", err);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=${encodeURIComponent(err instanceof Error ? err.message : "OAuth failed")}`
    );
  }
}
