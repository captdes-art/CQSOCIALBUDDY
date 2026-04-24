import { cn } from "@/lib/utils";
import type { Platform } from "@/types";

const platformConfig: Record<
  Platform,
  { label: string; className: string; icon: string }
> = {
  facebook_messenger: {
    label: "Messenger",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: "📘",
  },
  instagram_dm: {
    label: "Instagram",
    className: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    icon: "📸",
  },
};

interface PlatformBadgeProps {
  platform: Platform;
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const config = platformConfig[platform];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
