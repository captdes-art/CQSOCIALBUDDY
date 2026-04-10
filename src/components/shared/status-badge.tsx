import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ConversationStatus } from "@/types";

const statusConfig: Record<
  ConversationStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  new: { label: "New", variant: "default" },
  draft_ready: { label: "Draft Ready", variant: "secondary" },
  approved: { label: "Approved", variant: "outline" },
  sent: { label: "Sent", variant: "outline" },
  flagged: { label: "Flagged", variant: "destructive" },
  ignored: { label: "Ignored", variant: "outline" },
  archived: { label: "Archived", variant: "outline" },
};

interface StatusBadgeProps {
  status: ConversationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
}
