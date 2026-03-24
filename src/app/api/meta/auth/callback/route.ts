import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getUserPages } from "@/lib/meta/oauth";
import { exchangeForLongLivedToken } from "@/lib/meta/client";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

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

    // 1. Exchange code for short-lived token
    const { accessToken: shortToken } = await exchangeCodeForToken(code, redirectUri);

    // 2. Exchange for long-lived user token (60 days)
    const appId = process.env.META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;
    const { accessToken: longToken, expiresIn } = await exchangeForLongLivedToken(
      shortToken,
      appId,
      appSecret
    );

    // 3. Fetch user's pages
    const pages = await getUserPages(longToken);

    if (pages.length === 0) {
      return NextResponse.redirect(
        `${baseUrl}/settings/integrations?error=${encodeURIComponent("No Facebook Pages found. Make sure you manage at least one Page.")}`
      );
    }

    // 4. Store pages data temporarily so the page picker can access it
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        `${baseUrl}/login?error=${encodeURIComponent("Session expired. Please log in again.")}`
      );
    }

    // Store the OAuth result in a cookie (encrypted via signed cookie)
    // The page picker will read this to display pages
    const oauthData = JSON.stringify({
      userToken: longToken,
      tokenExpiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      pages: pages.map((p) => ({
        id: p.id,
        name: p.name,
        accessToken: p.access_token,
        instagramBusinessAccount: p.instagram_business_account || null,
      })),
      userId: user.id,
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
    console.error("Facebook OAuth callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=${encodeURIComponent(err instanceof Error ? err.message : "OAuth failed")}`
    );
  }
}
