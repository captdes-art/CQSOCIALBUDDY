import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Require authentication for an API route.
 * Returns the authenticated user or a 401 response.
 *
 * Usage:
 *   const auth = await requireAuth();
 *   if (auth.response) return auth.response;
 *   const user = auth.user;
 */
export async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, response: null };
}
