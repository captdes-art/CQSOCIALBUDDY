import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { subscribePageToWebhooks } from "@/lib/meta/oauth";

/**
 * POST /api/meta/auth/connect
 * Called when user selects a page from the page picker.
 * Stores the page token and subscribes to webhooks.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read OAuth data from cookie
  const cookie = request.cookies.get("meta_oauth_data");
  if (!cookie?.value) {
    return NextResponse.json(
      { error: "OAuth session expired. Please connect with Facebook again." },
      { status: 400 }
    );
  }

  let oauthData;
  try {
    oauthData = JSON.parse(Buffer.from(cookie.value, "base64").toString("utf-8"));
  } catch {
    return NextResponse.json({ error: "Invalid OAuth data" }, { status: 400 });
  }

  const body = await request.json();
  const { pageId } = body;

  if (!pageId) {
    return NextResponse.json({ error: "pageId is required" }, { status: 400 });
  }

  // Find the selected page in the OAuth data
  const page = oauthData.pages.find((p: { id: string }) => p.id === pageId);
  if (!page) {
    return NextResponse.json({ error: "Page not found in OAuth data" }, { status: 400 });
  }

  try {
    // Subscribe page to webhooks
    await subscribePageToWebhooks(page.id, page.accessToken);

    // Store in platform_accounts using admin client (bypasses RLS)
    const admin = createAdminClient();

    // Upsert Facebook page account
    const { error: fbError } = await admin
      .from("platform_accounts")
      .upsert(
        {
          platform: "facebook",
          platform_account_id: page.id,
          account_name: page.name,
          access_token: page.accessToken,
          user_access_token: oauthData.userToken,
          user_token_expires_at: oauthData.tokenExpiresAt,
          instagram_business_account_id: page.instagramBusinessAccount?.id || null,
          permissions_granted: [
            "pages_show_list",
            "pages_read_engagement",
            "pages_manage_metadata",
            "pages_messaging",
            "instagram_basic",
            "instagram_manage_messages",
          ],
          connected_by: user.id,
          is_active: true,
        },
        { onConflict: "platform,platform_account_id" }
      );

    if (fbError) throw fbError;

    // If there's a linked Instagram business account, store that too
    if (page.instagramBusinessAccount) {
      const { error: igError } = await admin
        .from("platform_accounts")
        .upsert(
          {
            platform: "instagram",
            platform_account_id: page.instagramBusinessAccount.id,
            account_name: page.instagramBusinessAccount.username || page.instagramBusinessAccount.name || page.name,
            access_token: page.accessToken, // IG uses the page token
            user_access_token: oauthData.userToken,
            user_token_expires_at: oauthData.tokenExpiresAt,
            instagram_business_account_id: page.instagramBusinessAccount.id,
            permissions_granted: ["instagram_basic", "instagram_manage_messages"],
            connected_by: user.id,
            is_active: true,
          },
          { onConflict: "platform,platform_account_id" }
        );

      if (igError) throw igError;
    }

    // Log activity
    await admin.from("activity_log").insert({
      user_id: user.id,
      action: "message_received", // reusing existing action type
      metadata: {
        type: "facebook_connected",
        page_id: page.id,
        page_name: page.name,
        has_instagram: !!page.instagramBusinessAccount,
      },
    });

    // Clear the OAuth cookie
    const response = NextResponse.json({
      success: true,
      page: {
        id: page.id,
        name: page.name,
        hasInstagram: !!page.instagramBusinessAccount,
        instagramUsername: page.instagramBusinessAccount?.username,
      },
    });

    response.cookies.set("meta_oauth_data", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Failed to connect page:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to connect page" },
      { status: 500 }
    );
  }
}
