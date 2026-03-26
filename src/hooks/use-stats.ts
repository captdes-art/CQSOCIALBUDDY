"use client";

import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  messagesToday: number;
  pendingDrafts: number;
  flaggedConversations: number;
  classificationBreakdown: Record<string, number>;
  avgResponseTimeMinutes: number;
}

export function useStats() {
  return useQuery<DashboardStats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });
}
