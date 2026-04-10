"use client";

import { useState, useMemo } from "react";
import { useConversations } from "@/hooks/use-conversations";
import { ConversationList } from "@/components/inbox/conversation-list";
import { ConversationDetail } from "@/components/inbox/conversation-detail";
import { Archive, MessageSquare } from "lucide-react";
import type { Conversation } from "@/types";

export default function ArchivedPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data, isLoading } = useConversations({
    status: "archived",
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
      {/* Left panel */}
      <div
        className={`flex flex-col border-r w-full lg:w-[400px] lg:shrink-0 ${
          activeId ? "hidden lg:flex" : "flex"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b">
          <Archive className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-semibold">Archived Conversations</h1>
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

      {/* Right panel */}
      <div className={`flex-1 ${activeId ? "flex" : "hidden lg:flex"}`}>
        {activeConversation ? (
          <ConversationDetail
            conversation={activeConversation}
            onBack={() => setActiveId(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">Archived Conversations</p>
            <p className="text-sm mt-1">
              Select an archived conversation to view or restore it
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
