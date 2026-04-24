"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message, AiDraft } from "@/types";

interface MessagesResponse {
  messages: Message[];
  draft: AiDraft | null;
}

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const query = useQuery<MessagesResponse>({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return { messages: [], draft: null };
      const res = await fetch(
        `/api/messages?conversation_id=${conversationId}`
      );
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!conversationId,
  });

  // Real-time subscription for new messages in this conversation
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["messages", conversationId],
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ai_drafts",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["messages", conversationId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, queryClient]);

  return query;
}
