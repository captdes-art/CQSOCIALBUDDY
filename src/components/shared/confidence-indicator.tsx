import { cn } from "@/lib/utils";

interface ConfidenceIndicatorProps {
  score: number; // 0.0 - 1.0
  className?: string;
}

export function ConfidenceIndicator({
  score,
  className,
}: ConfidenceIndicatorProps) {
  const percentage = Math.round(score * 100);

  let colorClass: string;
  let label: string;

  if (percentage >= 80) {
    colorClass = "text-green-600 dark:text-green-400";
    label = "High";
  } else if (percentage >= 50) {
    colorClass = "text-amber-600 dark:text-amber-400";
    label = "Medium";
  } else {
    colorClass = "text-red-600 dark:text-red-400";
    label = "Low";
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Simple bar indicator */}
      <div className="flex gap-0.5">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              "h-3 w-1 rounded-full",
              bar <= (percentage >= 80 ? 3 : percentage >= 50 ? 2 : 1)
                ? colorClass.replace("text-", "bg-")
                : "bg-muted"
            )}
          />
        ))}
      </div>
      <span className={cn("text-xs font-medium", colorClass)}>
        {percentage}% {label}
      </span>
    </div>
  );
}
