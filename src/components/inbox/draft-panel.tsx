"use client";

import { useState } from "react";
import {
  Check,
  Edit3,
  Flag,
  FlagOff,
  EyeOff,
  Loader2,
  Send,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClassificationBadge } from "@/components/shared/classification-badge";
import { ConfidenceIndicator } from "@/components/shared/confidence-indicator";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { AiDraft } from "@/types";

interface DraftPanelProps {
  draft: AiDraft | null;
  conversationId: string;
  conversationStatus?: string;
  onAction: () => void; // Called after any action to refresh data
}

export function DraftPanel({
  draft,
  conversationId,
  conversationStatus,
  onAction,
}: DraftPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [manualReply, setManualReply] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleClearFlag() {
    setLoading("unflag");
    try {
      const res = await fetch(`/api/messages/${conversationId}/unflag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to clear flag");
      toast.success("Flag cleared — AI auto-reply restored");
      onAction();
    } catch {
      toast.error("Failed to clear flag");
    } finally {
      setLoading(null);
    }
  }

  const isFlagged = conversationStatus === "flagged";

  if (!draft || draft.status === "sent" || draft.status === "rejected") {
    return (
      <div className="p-4 border-t bg-muted/30">
        {isFlagged && (
          <div className="flex items-center justify-between mb-3 p-2 rounded-md bg-destructive/10 border border-destructive/20">
            <span className="text-xs font-medium text-destructive flex items-center gap-1">
              <Flag className="h-3 w-3" />
              Flagged — AI auto-reply paused
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              disabled={loading === "unflag"}
              onClick={handleClearFlag}
            >
              {loading === "unflag" ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <FlagOff className="h-3 w-3 mr-1" />
              )}
              Clear Flag
            </Button>
          </div>
        )}
        <p className="text-sm text-muted-foreground text-center">
          No AI draft available
        </p>
        {/* Manual reply for flagged items */}
        <div className="mt-3">
          <Textarea
            placeholder="Type a manual reply..."
            value={manualReply}
            onChange={(e) => setManualReply(e.target.value)}
            rows={3}
          />
          <Button
            size="sm"
            className="mt-2 w-full"
            disabled={!manualReply.trim() || loading === "manual"}
            onClick={() => handleManualSend()}
          >
            {loading === "manual" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Send Reply
          </Button>
        </div>
      </div>
    );
  }

  const displayContent = isEditing
    ? editedContent
    : draft.edited_content || draft.draft_content;

  async function handleApprove(content?: string) {
    setLoading("approve");
    try {
      const res = await fetch(`/api/messages/${conversationId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draft!.id,
          content: content,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }

      toast.success("Reply sent!");
      setIsEditing(false);
      onAction();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setLoading(null);
    }
  }

  async function handleFlag() {
    setLoading("flag");
    try {
      await fetch(`/api/messages/${conversationId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      toast.info("Conversation flagged for review");
      onAction();
    } catch {
      toast.error("Failed to flag conversation");
    } finally {
      setLoading(null);
    }
  }

  async function handleManualSend() {
    if (!manualReply.trim()) return;
    setLoading("manual");
    try {
      const res = await fetch(`/api/messages/${conversationId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draft?.id || "manual",
          content: manualReply,
        }),
      });
      if (!res.ok) throw new Error("Failed to send");
      toast.success("Reply sent!");
      setManualReply("");
      onAction();
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="border-t bg-muted/20">
      {/* Flagged banner */}
      {isFlagged && (
        <div className="flex items-center justify-between px-4 py-2 bg-destructive/10 border-b border-destructive/20">
          <span className="text-xs font-medium text-destructive flex items-center gap-1">
            <Flag className="h-3 w-3" />
            Flagged — AI auto-reply paused. Approve drafts manually.
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={loading === "unflag"}
            onClick={handleClearFlag}
          >
            {loading === "unflag" ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <FlagOff className="h-3 w-3 mr-1" />
            )}
            Clear Flag
          </Button>
        </div>
      )}
      {/* Draft header */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            AI Draft
          </span>
          <ClassificationBadge classification={draft.classification} />
        </div>
        <ConfidenceIndicator score={draft.confidence_score} />
      </div>

      {/* Draft content */}
      <div className="p-4">
        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={5}
            className="mb-2"
          />
        ) : (
          <div className="text-sm whitespace-pre-wrap bg-background rounded-lg p-3 border">
            {displayContent}
          </div>
        )}
      </div>

      <Separator />

      {/* Action buttons */}
      <div className="flex items-center gap-2 p-3 flex-wrap">
        {isEditing ? (
          <>
            <Button
              size="sm"
              onClick={() => handleApprove(editedContent)}
              disabled={loading === "approve"}
            >
              {loading === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Send Edited
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              onClick={() => handleApprove()}
              disabled={loading === "approve"}
            >
              {loading === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Approve & Send
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditedContent(displayContent);
                setIsEditing(true);
              }}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleFlag}
              disabled={loading === "flag"}
            >
              <Flag className="h-4 w-4 mr-1" />
              Flag
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                toast.info("Conversation ignored");
                onAction();
              }}
            >
              <EyeOff className="h-4 w-4 mr-1" />
              Ignore
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
