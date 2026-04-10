"use client";

import { useState } from "react";
import { useMessages } from "@/hooks/use-messages";
import { usePlatformAccounts } from "@/hooks/use-platform-accounts";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Archive, ArchiveRestore, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlatformBadge } from "@/components/shared/platform-badge";
import { MessageBubble } from "./message-bubble";
import { DraftPanel } from "./draft-panel";
import { toast } from "sonner";
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

  const isArchived = conversation.status === "archived";

  function handleAction() {
    queryClient.invalidateQueries({ queryKey: ["messages", conversation.id] });
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  }

  async function handleArchive() {
    setActionLoading(true);
    try {
      const action = isArchived ? "unarchive" : "archive";
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Failed to " + action);
      toast.success(isArchived ? "Conversation restored" : "Conversation archived");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onBack();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversation.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete conversation");
      toast.success("Conversation permanently deleted");
      setShowDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onBack();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setActionLoading(false);
    }
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

        {/* Archive button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleArchive}
          disabled={actionLoading}
          className="shrink-0"
        >
          {isArchived ? (
            <><ArchiveRestore className="h-4 w-4 mr-1.5" /> Restore</>
          ) : (
            <><Archive className="h-4 w-4 mr-1.5" /> Archive</>
          )}
        </Button>

        {/* Delete menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              This will permanently delete this conversation with{" "}
              <strong>{conversation.customer_name || "Unknown"}</strong>,
              including all messages, AI drafts, and activity logs.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        conversationStatus={conversation.status}
        onAction={handleAction}
      />
    </div>
  );
}
