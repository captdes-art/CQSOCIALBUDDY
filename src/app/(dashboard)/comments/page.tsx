"use client";

import { useState, useMemo } from "react";
import { useConversations } from "@/hooks/use-conversations";
import { ConversationList } from "@/components/inbox/conversation-list";
import { ConversationDetail } from "@/components/inbox/conversation-detail";
import { MessageSquare, MessageCircle } from "lucide-react";
import type { Conversation } from "@/types";

export default function CommentsPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data, isLoading } = useConversations({
    source_type: "comment",
    sort_by: "last_message_at",
    sort_order: "desc",
  });

  const conversations = data?.conversations || [];
  const activeConversation = useMemo(
    () => conversations.find((c: Conversation) => c.id === activeId) || null,
    [conversations, activeId]
  );

  return (
    <div className="flex h-full">
      <div
        className={`flex flex-col border-r w-full lg:w-[400px] lg:shrink-0 ${
          activeId ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h1 className="font-semibold">Comments</h1>
          <span className="text-xs text-muted-foreground">
            ({conversations.length} items)
          </span>
        </div>
        <ConversationList
          conversations={conversations}
          isLoading={isLoading}
          activeId={activeId}
          selectedIds={new Set()}
          onSelect={() => {}}
          onClick={(id) => setActiveId(id)}
        />
      </div>

      <div className={`flex-1 ${activeId ? "flex" : "hidden lg:flex"}`}>
        {activeConversation ? (
          <ConversationDetail
            conversation={activeConversation}
            onBack={() => setActiveId(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">Comments on Page Posts</p>
            <p className="text-sm mt-1">
              Public comments left on your Facebook and Instagram posts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
