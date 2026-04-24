"use client";

import { ConversationCard } from "./conversation-card";
import { Loader2, Inbox } from "lucide-react";
import type { Conversation } from "@/types";

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  activeId: string | null;
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onClick: (id: string) => void;
}

export function ConversationList({
  conversations,
  isLoading,
  activeId,
  selectedIds,
  onSelect,
  onClick,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <Inbox className="h-10 w-10 mb-2" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1">
          Messages will appear here when customers reach out
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-w-0">
      {conversations.map((conversation) => (
        <ConversationCard
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedIds.has(conversation.id)}
          isActive={activeId === conversation.id}
          onSelect={onSelect}
          onClick={onClick}
        />
      ))}
    </div>
  );
}
