"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Conversation, ConversationFilters } from "@/types";

interface ConversationsResponse {
  conversations: Conversation[];
  total: number | null;
}

export function useConversations(filters: ConversationFilters = {}) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Build query string from filters
  const params = new URLSearchParams();
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.status) params.set("status", filters.status);
  if (filters.classification) params.set("classification", filters.classification);
  if (filters.assigned_to) params.set("assigned_to", filters.assigned_to);
  if (filters.source_type) params.set("source_type", filters.source_type);
  if (filters.search) params.set("search", filters.search);
  if (filters.sort_by) params.set("sort_by", filters.sort_by);
  if (filters.sort_order) params.set("sort_order", filters.sort_order);

  const queryKey = ["conversations", params.toString()];

  const query = useQuery<ConversationsResponse>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/conversations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
  });

  // Real-time subscription for new/updated conversations
  useEffect(() => {
    const channel = supabase
      .channel("conversations-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => {
          // Invalidate the query to refetch
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  return query;
}
