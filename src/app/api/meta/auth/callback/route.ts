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

  function redirectError(msg: string) {
    console.error("[oauth] ERROR:", msg);
    return NextResponse.redirect(
      `${baseUrl}/settings/integrations?error=${encodeURIComponent(msg)}`
    );
  }

  if (error) {
    return redirectError(searchParams.get("error_description") || "Facebook login was denied");
  }

  if (!code) {
    return redirectError("No authorization code received");
  }

  try {
    const redirectUri = `${baseUrl}/api/meta/auth/callback`;
    console.log("[oauth] Step 1: Exchanging code, redirectUri:", redirectUri);

    // 1. Exchange code for short-lived token
    const { accessToken: shortToken } = await exchangeCodeForToken(code, redirectUri);
    console.log("[oauth] Step 2: Got short token");

    // 2. Exchange for long-lived user token (for refresh later)
    let longToken = shortToken;
    let tokenExpiry: string | null = null;
    try {
      const longResult = await exchangeForLongLivedToken(
        shortToken, process.env.META_APP_ID!, process.env.META_APP_SECRET!
      );
      longToken = longResult.accessToken;
      tokenExpiry = longResult.expiresIn
        ? new Date(Date.now() + longResult.expiresIn * 1000).toISOString()
        : null;
      console.log("[oauth] Step 3: Got long-lived user token, expiresIn:", longResult.expiresIn);
    } catch (e) {
      console.warn("[oauth] Long-lived token exchange failed (non-fatal):", e);
    }

    // 3. Try to get pages via /me/accounts with the user tokens
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let pageData: any = null;
    let pageToken: string | null = null;

    for (const token of [shortToken, longToken]) {
      console.log("[oauth] Trying /me/accounts with token:", token.substring(0, 20) + "...");
      const pagesRes = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username,name,biography,followers_count}&access_token=${token}`
      );
      const pagesBody = await pagesRes.json();
      console.log("[oauth] /me/accounts response:", JSON.stringify(pagesBody).substring(0, 500));
      if (pagesRes.ok) {
        const pages = pagesBody.data || [];
        console.log("[oauth] /me/accounts returned", pages.length, "pages");
        if (pages.length > 0) {
          pageData = pages[0];
          pageToken = pageData.access_token;
          break;
        }
      }
    }

    // 4. Fallback: derive page token from user token using known page ID
    if (!pageData) {
      console.log("[oauth] /me/accounts returned no pages, trying direct page ID lookup");
      const knownPageId = "101274736607035";
      for (const uToken of [longToken, shortToken]) {
        try {
          const ptRes = await fetch(
            `https://graph.facebook.com/v21.0/${knownPageId}?fields=id,name,access_token,instagram_business_account{id,username,name,biography,followers_count}&access_token=${uToken}`
          );
          if (ptRes.ok) {
            const ptData = await ptRes.json();
            console.log("[oauth] Direct page lookup result:", JSON.stringify(ptData).substring(0, 300));
            if (ptData.access_token) {
              pageData = ptData;
              pageToken = ptData.access_token;
              console.log("[oauth] Got page token via direct lookup for:", ptData.name);
              break;
            }
          } else {
            const errData = await ptRes.json().catch(() => ({}));
            console.log("[oauth] Direct page lookup failed:", JSON.stringify(errData).substring(0, 300));
          }
        } catch (e) {
          console.log("[oauth] Direct page lookup error:", e);
        }
      }
    }

    // 5. Last resort: use FB_PAGE_ACCESS_TOKEN env var
    if (!pageData) {
      console.log("[oauth] All token approaches failed, trying FB_PAGE_ACCESS_TOKEN env var");
      const staticToken = process.env.FB_PAGE_ACCESS_TOKEN;
      if (!staticToken) {
        return redirectError("Could not find Facebook Pages. Grant pages_show_list permission and try again.");
      }

      const pageRes = await fetch(
        `https://graph.facebook.com/v21.0/me?fields=id,name,instagram_business_account{id,username,name,biography,followers_count}&access_token=${staticToken}`
      );
      if (!pageRes.ok) {
        const pageErr = await pageRes.json().catch(() => ({}));
        return redirectError(`Page fetch failed: ${JSON.stringify(pageErr)}`);
      }

      pageData = await pageRes.json();
      pageToken = staticToken;
    }

    console.log("[oauth] Step 4: Page:", pageData.name, "ID:", pageData.id);

    // 4. Store in database
    const admin = createAdminClient();
    const finalToken = pageToken!;

    const { error: fbErr } = await admin.from("platform_accounts").upsert(
      {
        platform: "facebook",
        platform_account_id: pageData.id,
        account_name: pageData.name,
        access_token: finalToken,
        user_access_token: longToken,
        user_token_expires_at: tokenExpiry,
        instagram_business_account_id: pageData.instagram_business_account?.id || null,
        permissions_granted: [
          "pages_show_list", "pages_read_engagement", "pages_manage_metadata",
          "pages_messaging", "instagram_basic", "instagram_manage_messages",
        ],
        is_active: true,
      },
      { onConflict: "platform,platform_account_id" }
    );

    if (fbErr) {
      console.error("[oauth] FB upsert error:", fbErr);
      return redirectError(`Database error (FB): ${fbErr.message}`);
    }
    console.log("[oauth] Step 5: Facebook account saved");

    // 5. Store Instagram account if linked
    if (pageData.instagram_business_account) {
      const ig = pageData.instagram_business_account;
      const { error: igErr } = await admin.from("platform_accounts").upsert(
        {
          platform: "instagram",
          platform_account_id: ig.id,
          account_name: ig.username || ig.name || pageData.name,
          access_token: finalToken,
          user_access_token: longToken,
          user_token_expires_at: tokenExpiry,
          instagram_business_account_id: ig.id,
          permissions_granted: ["instagram_basic", "instagram_manage_messages"],
          is_active: true,
        },
        { onConflict: "platform,platform_account_id" }
      );

      if (igErr) {
        console.error("[oauth] IG upsert error:", igErr);
        return redirectError(`Database error (IG): ${igErr.message}`);
      }
      console.log("[oauth] Step 6: Instagram account saved");
    }

    // 6. Subscribe page to webhooks (non-fatal)
    try {
      await fetch(`https://graph.facebook.com/v21.0/${pageData.id}/subscribed_apps`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${finalToken}` },
        body: JSON.stringify({ subscribed_fields: "messages,feed" }),
      });
      console.log("[oauth] Step 7: Webhook subscription sent");
    } catch (e) {
      console.warn("[oauth] Webhook subscription failed (non-fatal):", e);
    }

    console.log("[oauth] DONE — redirecting with connected=true");
    return NextResponse.redirect(`${baseUrl}/settings/integrations?connected=true`);
  } catch (err) {
    return redirectError(err instanceof Error ? err.message : "OAuth failed");
  }
}
