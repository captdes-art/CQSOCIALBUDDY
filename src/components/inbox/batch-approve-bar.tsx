"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BatchApproveBarProps {
  selectedCount: number;
  selectedItems: Array<{ conversationId: string; draftId: string }>;
  onClear: () => void;
  onComplete: () => void;
}

export function BatchApproveBar({
  selectedCount,
  selectedItems,
  onClear,
  onComplete,
}: BatchApproveBarProps) {
  const [loading, setLoading] = useState(false);

  if (selectedCount === 0) return null;

  async function handleBatchApprove() {
    setLoading(true);
    try {
      const res = await fetch("/api/messages/batch-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedItems }),
      });

      if (!res.ok) throw new Error("Batch approve failed");

      const data = await res.json();
      toast.success(`Sent ${data.sent} replies, ${data.failed} failed`);
      onComplete();
    } catch {
      toast.error("Failed to batch approve");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-b">
      <span className="text-sm font-medium">
        {selectedCount} conversation{selectedCount !== 1 ? "s" : ""} selected
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleBatchApprove} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Check className="h-4 w-4 mr-1" />
          )}
          Approve & Send All
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
