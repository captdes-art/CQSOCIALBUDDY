"use client";

import { useMessages } from "@/hooks/use-messages";
import { usePlatformAccounts } from "@/hooks/use-platform-accounts";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { MessageBubble } from "./message-bubble";
import { DraftPanel } from "./draft-panel";
import type { Conversation } from "@/types";

interface ConversationDetailProps {
  conversation: Conversation;
  onBack: () => void;
}

export function ConversationDetail({
  conversation,
  onBack,
}: ConversationDetailProps) {
  const { data, isLoading } = useMessages(conversation.id);
  const { data: accounts } = usePlatformAccounts();
  const queryClient = useQueryClient();

  // Find the connected account for this conversation's platform
  const isFacebook = conversation.platform === "facebook_messenger";
  const connectedAccount = accounts?.find((a) =>
    isFacebook ? a.platform === "facebook" : a.platform === "instagram"
  );

  const initials = (conversation.customer_name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleAction() {
    queryClient.invalidateQueries({ queryKey: ["messages", conversation.id] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Avatar className="h-9 w-9">
          <AvatarImage src={conversation.customer_avatar_url || ""} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {conversation.customer_name || "Unknown"}
            </span>
            <PlatformBadge platform={conversation.platform} />
          </div>
          <p className="text-xs text-muted-foreground">
            {isFacebook ? "Facebook Messenger" : "Instagram Direct"}
            {connectedAccount && (
              <span className="ml-1">
                — Replying as {isFacebook ? connectedAccount.account_name : `@${connectedAccount.account_name}`}
                {" "}(ID: {connectedAccount.platform_account_id})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          data?.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
      </ScrollArea>

      {/* AI Draft panel */}
      <DraftPanel
        draft={data?.draft || null}
        conversationId={conversation.id}
        onAction={handleAction}
      />
    </div>
  );
}
