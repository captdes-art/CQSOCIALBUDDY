import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === "outbound";

  return (
    <div
      className={cn("flex mb-3", isOutbound ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5",
          isOutbound
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        )}
      >
        {/* Sender name for inbound */}
        {!isOutbound && message.sender_name && (
          <p className="text-xs font-medium mb-0.5 opacity-70">
            {message.sender_name}
          </p>
        )}

        {/* Message content */}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

        {/* Timestamp */}
        <p
          className={cn(
            "text-[10px] mt-1",
            isOutbound ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          {format(new Date(message.sent_at), "h:mm a")}
        </p>
      </div>
    </div>
  );
}
