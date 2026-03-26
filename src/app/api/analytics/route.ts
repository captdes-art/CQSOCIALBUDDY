import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/analytics — Dashboard stats.
 */
export async function GET() {
  const supabase = createAdminClient();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // Run queries in parallel
  const [
    todayMessages,
    pendingDrafts,
    flaggedCount,
    classificationBreakdown,
    avgResponseTime,
  ] = await Promise.all([
    // Messages received today
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("direction", "inbound")
      .gte("sent_at", startOfDay),

    // Pending drafts awaiting approval
    supabase
      .from("ai_drafts")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),

    // Flagged conversations
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("status", "flagged"),

    // Classification breakdown (last 7 days)
    supabase
      .from("conversations")
      .select("classification")
      .gte("created_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .not("classification", "is", null),

    // Average response time (sent drafts from last 7 days)
    supabase
      .from("ai_drafts")
      .select("created_at, sent_at")
      .eq("status", "sent")
      .gte("sent_at", new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  // Calculate classification breakdown
  const breakdown: Record<string, number> = {};
  if (classificationBreakdown.data) {
    for (const row of classificationBreakdown.data) {
      const cls = row.classification || "unknown";
      breakdown[cls] = (breakdown[cls] || 0) + 1;
    }
  }

  // Calculate average response time in minutes
  let avgMinutes = 0;
  if (avgResponseTime.data?.length) {
    const totalMinutes = avgResponseTime.data.reduce((sum, row) => {
      if (row.sent_at && row.created_at) {
        const diff = new Date(row.sent_at).getTime() - new Date(row.created_at).getTime();
        return sum + diff / (1000 * 60);
      }
      return sum;
    }, 0);
    avgMinutes = Math.round(totalMinutes / avgResponseTime.data.length);
  }

  return NextResponse.json({
    messagesToday: todayMessages.count || 0,
    pendingDrafts: pendingDrafts.count || 0,
    flaggedConversations: flaggedCount.count || 0,
    classificationBreakdown: breakdown,
    avgResponseTimeMinutes: avgMinutes,
  });
}
