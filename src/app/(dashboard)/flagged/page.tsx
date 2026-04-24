"use client";

import { useState, useMemo } from "react";
import { useConversations } from "@/hooks/use-conversations";
import { ConversationList } from "@/components/inbox/conversation-list";
import { ConversationDetail } from "@/components/inbox/conversation-detail";
import { AlertTriangle, MessageSquare } from "lucide-react";
import type { Conversation } from "@/types";

export default function FlaggedPage() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data, isLoading } = useConversations({
    status: "flagged",
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
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h1 className="font-semibold">Flagged Queue</h1>
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
            <p className="text-lg font-medium">Flagged Messages</p>
            <p className="text-sm mt-1">
              Complaints and complex questions that need manual review
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
