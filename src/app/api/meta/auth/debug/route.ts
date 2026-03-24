import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getUserPages } from "@/lib/meta/oauth";
import { exchangeForLongLivedToken } from "@/lib/meta/client";

/**
 * DEBUG ENDPOINT — same as callback but returns JSON instead of redirecting.
 * Remove this after debugging is complete.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const host = request.headers.get("host") || request.nextUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${protocol}://${host}`;
  // Must match what the client sent to Facebook — currently /debug
  const redirectUri = `${baseUrl}/api/meta/auth/debug`;

  const debug: Record<string, unknown> = {
    host,
    protocol,
    baseUrl,
    redirectUri,
    hasCode: !!code,
    codeLength: code?.length || 0,
    error: error || null,
    META_APP_ID: process.env.META_APP_ID ? "SET" : "MISSING",
    META_APP_SECRET: process.env.META_APP_SECRET ? "SET" : "MISSING",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "NOT SET",
    NEXT_PUBLIC_META_APP_ID: process.env.NEXT_PUBLIC_META_APP_ID || "NOT SET",
  };

  if (!code) {
    debug.step = "no code provided";
    return NextResponse.json(debug);
  }

  // Step 1: Exchange code for short-lived token
  try {
    debug.step = "exchanging code for token";
    const { accessToken: shortToken } = await exchangeCodeForToken(code, redirectUri);
    debug.shortTokenLength = shortToken.length;
    debug.step = "got short token";

    // Step 2: Exchange for long-lived token
    const appId = process.env.META_APP_ID!;
    const appSecret = process.env.META_APP_SECRET!;
    const { accessToken: longToken, expiresIn } = await exchangeForLongLivedToken(
      shortToken, appId, appSecret
    );
    debug.longTokenLength = longToken.length;
    debug.expiresIn = expiresIn;
    debug.step = "got long token";

    // Step 3: Check what permissions were actually granted
    const permsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/permissions?access_token=${longToken}`
    );
    const permsData = await permsRes.json();
    debug.permissions = permsData.data || permsData;

    // Step 4: Fetch pages
    const pages = await getUserPages(longToken);
    debug.pagesCount = pages.length;
    debug.pages = pages.map((p) => ({
      id: p.id,
      name: p.name,
      hasIG: !!p.instagram_business_account,
    }));

    // Step 5: Check who the token belongs to
    const meRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${longToken}`
    );
    debug.me = await meRes.json();

    // Step 6: Raw accounts call
    const accountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longToken}`
    );
    debug.rawAccounts = await accountsRes.json();

    // Step 7: Try fetching businesses
    const bizRes = await fetch(
      `https://graph.facebook.com/v21.0/me/businesses?access_token=${longToken}`
    );
    debug.businesses = await bizRes.json();

    // Step 8: If we have a business, try fetching its pages
    const bizData = debug.businesses as { data?: Array<{ id: string; name: string }> };
    if (bizData.data && bizData.data.length > 0) {
      const bizId = bizData.data[0].id;
      const bizPagesRes = await fetch(
        `https://graph.facebook.com/v21.0/${bizId}/owned_pages?fields=id,name,access_token,instagram_business_account{id,username,name}&access_token=${longToken}`
      );
      debug.businessPages = await bizPagesRes.json();
    }

    debug.step = "complete";
  } catch (err) {
    debug.error = err instanceof Error ? err.message : String(err);
    debug.errorStack = err instanceof Error ? err.stack : undefined;
  }

  return NextResponse.json(debug, { status: 200 });
}
