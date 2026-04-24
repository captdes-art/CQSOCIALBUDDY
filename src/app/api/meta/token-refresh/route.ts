import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { refreshPageToken } from "@/lib/meta/client";

// POST /api/meta/token-refresh — Cron job to refresh Meta page access tokens.
// Called on the 1st and 15th of each month by Vercel Cron (see vercel.json).
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;

  // Get all active platform accounts
  const { data: accounts } = await supabase
    .from("platform_accounts")
    .select("*")
    .eq("is_active", true);

  if (!accounts?.length) {
    return NextResponse.json({ message: "No active accounts to refresh" });
  }

  const results = [];

  for (const account of accounts) {
    try {
      const { accessToken, expiresIn } = await refreshPageToken(
        account.access_token,
        appId,
        appSecret
      );

      const expiresAt = new Date(
        Date.now() + expiresIn * 1000
      ).toISOString();

      await supabase
        .from("platform_accounts")
        .update({
          access_token: accessToken,
          token_expires_at: expiresAt,
        })
        .eq("id", account.id);

      // Log the refresh
      await supabase.from("activity_log").insert({
        action: "token_refreshed",
        metadata: {
          platform: account.platform,
          account_name: account.account_name,
          expires_at: expiresAt,
        },
      });

      results.push({
        account: account.account_name,
        success: true,
        expiresAt,
      });
    } catch (error) {
      results.push({
        account: account.account_name,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ results });
}
