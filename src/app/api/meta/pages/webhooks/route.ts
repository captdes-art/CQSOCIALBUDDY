import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { getPageWebhookSubscriptions, subscribePageToWebhooks } from "@/lib/meta/oauth";

/**
 * GET /api/meta/pages/webhooks
 * Returns current webhook subscription status for the active Facebook page.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const admin = createAdminClient();
    const { data: account } = await admin
      .from("platform_accounts")
      .select("platform_account_id, account_name, access_token")
      .eq("platform", "facebook")
      .eq("is_active", true)
      .single();

    if (!account) {
      return NextResponse.json({ subscriptions: [], page: null });
    }

    const result = await getPageWebhookSubscriptions(
      account.platform_account_id,
      account.access_token
    );

    return NextResponse.json({
      subscriptions: result.data || [],
      page: {
        id: account.platform_account_id,
        name: account.account_name,
      },
    });
  } catch (err) {
    console.error("Failed to get webhook subscriptions:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get subscriptions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/meta/pages/webhooks
 * Subscribe/refresh webhook subscriptions for the active Facebook page.
 */
export async function POST() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const admin = createAdminClient();
    const { data: account } = await admin
      .from("platform_accounts")
      .select("platform_account_id, account_name, access_token")
      .eq("platform", "facebook")
      .eq("is_active", true)
      .single();

    if (!account) {
      return NextResponse.json({ error: "No active Facebook page" }, { status: 400 });
    }

    await subscribePageToWebhooks(account.platform_account_id, account.access_token);

    return NextResponse.json({
      success: true,
      page: {
        id: account.platform_account_id,
        name: account.account_name,
      },
    });
  } catch (err) {
    console.error("Failed to subscribe webhooks:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to subscribe" },
      { status: 500 }
    );
  }
}
