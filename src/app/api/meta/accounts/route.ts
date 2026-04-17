import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

/**
 * GET /api/meta/accounts
 * Returns all active platform accounts.
 */
export async function GET() {
  const auth = await requireAuth();
  if (auth.response) return auth.response;

  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("platform_accounts")
      .select("id, platform, platform_account_id, account_name, is_active, instagram_business_account_id, permissions_granted, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ accounts: data || [] });
  } catch (err) {
    console.error("Failed to fetch accounts:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
