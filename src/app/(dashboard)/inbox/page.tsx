"use client";

import { useState, useMemo } from "react";
import { useConversations } from "@/hooks/use-conversations";
import { useQueryClient } from "@tanstack/react-query";
import { FilterBar } from "@/components/inbox/filter-bar";
import { ConversationList } from "@/components/inbox/conversation-list";
import { ConversationDetail } from "@/components/inbox/conversation-detail";
import { BatchApproveBar } from "@/components/inbox/batch-approve-bar";
import { MessageSquare } from "lucide-react";
import type { ConversationFilters, Conversation } from "@/types";

export default function InboxPage() {
  const [filters, setFilters] = useState<ConversationFilters>({
    source_type: "dm",
    sort_by: "last_message_at",
    sort_order: "desc",
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data, isLoading } = useConversations(filters);
  const conversations = data?.conversations || [];

  // Find the active conversation object
  const activeConversation = useMemo(
    () => conversations.find((c: Conversation) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  // Build batch approve items (only conversations with pending drafts)
  const batchItems = useMemo(() => {
    return conversations
      .filter((c: Conversation) => selectedIds.has(c.id) && c.status === "draft_ready")
      .map((c: Conversation) => ({
        conversationId: c.id,
        draftId: c.latest_draft?.id || "",
      }))
      .filter((item) => item.draftId);
  }, [conversations, selectedIds]);

  function handleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function handleBatchComplete() {
    setSelectedIds(new Set());
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }

  return (
    <div className="flex h-full">
      {/* Left panel: conversation list */}
      <div
        className={`flex flex-col border-r w-full lg:w-[400px] lg:shrink-0 ${
          activeConversationId ? "hidden lg:flex" : "flex"
        }`}
      >
        <FilterBar filters={filters} onFiltersChange={setFilters} />
        <BatchApproveBar
          selectedCount={selectedIds.size}
          selectedItems={batchItems}
          onClear={() => setSelectedIds(new Set())}
          onComplete={handleBatchComplete}
        />
        <ConversationList
          conversations={conversations}
          isLoading={isLoading}
          activeId={activeConversationId}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onClick={(id) => setActiveConversationId(id)}
        />
      </div>

      {/* Right panel: conversation detail */}
      <div
        className={`flex-1 ${
          activeConversationId ? "flex" : "hidden lg:flex"
        }`}
      >
        {activeConversation ? (
          <ConversationDetail
            conversation={activeConversation}
            onBack={() => setActiveConversationId(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mb-3" />
            <p className="text-lg font-medium">Select a conversation</p>
            <p className="text-sm mt-1">
              Choose a message from the inbox to view details and respond
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
