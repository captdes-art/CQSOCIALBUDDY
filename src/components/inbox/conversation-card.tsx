"use client";

import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { ClassificationBadge } from "@/components/shared/classification-badge";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

interface ConversationCardProps {
  conversation: Conversation;
  isSelected: boolean;
  isActive: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onClick: (id: string) => void;
}

export function ConversationCard({
  conversation,
  isSelected,
  isActive,
  onSelect,
  onClick,
}: ConversationCardProps) {
  const initials = (conversation.customer_name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 border-b cursor-pointer transition-colors hover:bg-muted/50 w-full min-w-0",
        isActive && "bg-muted",
        conversation.status === "new" && "border-l-2 border-l-primary"
      )}
      onClick={() => onClick(conversation.id)}
    >
      {/* Checkbox for batch select */}
      <div
        className="pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) =>
            onSelect(conversation.id, checked as boolean)
          }
        />
      </div>

      {/* Avatar */}
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={conversation.customer_avatar_url || ""} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-medium text-sm truncate min-w-0 flex-1">
            {conversation.customer_name || "Unknown"}
          </span>
          <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
            {formatDistanceToNow(new Date(conversation.last_message_at), {
              addSuffix: true,
            })}
          </span>
        </div>

        {/* Message preview */}
        <p className="text-sm text-muted-foreground truncate mt-0.5">
          {conversation.last_message_preview || "No messages yet"}
        </p>

        {/* Badges */}
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <PlatformBadge platform={conversation.platform} />
          <StatusBadge status={conversation.status} />
          {conversation.classification && (
            <ClassificationBadge classification={conversation.classification} />
          )}
        </div>
      </div>
    </div>
  );
}
