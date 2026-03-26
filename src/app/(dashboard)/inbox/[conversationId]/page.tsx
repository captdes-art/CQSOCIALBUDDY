"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ConversationDetail } from "@/components/inbox/conversation-detail";
import { Loader2 } from "lucide-react";
import type { Conversation } from "@/types";

// Direct link to a specific conversation (for notification links)
export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const router = useRouter();

  const { data, isLoading } = useQuery<{ conversations: Conversation[] }>({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const res = await fetch(`/api/conversations?search=${conversationId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const conversation = data?.conversations?.[0];

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  return (
    <ConversationDetail
      conversation={conversation}
      onBack={() => router.push("/inbox")}
    />
  );
}
