"use client";

interface WelcomeBannerProps {
  stats?: {
    messagesToday: number;
    pendingDrafts: number;
    flaggedConversations: number;
    classificationBreakdown: Record<string, number>;
    avgResponseTimeMinutes: number;
  } | null;
  isLoading: boolean;
}

export function WelcomeBanner({ stats, isLoading }: WelcomeBannerProps) {
  const totalMessages = stats
    ? Object.values(stats.classificationBreakdown).reduce((sum, v) => sum + v, 0)
    : 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-8 py-7 text-white"
      style={{
        background: "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)",
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-[50%] -right-[10%] w-[300px] h-[300px] rounded-full bg-white/[0.08] pointer-events-none" />
      <div className="absolute -bottom-[40%] left-[20%] w-[200px] h-[200px] rounded-full bg-white/[0.06] pointer-events-none" />

      <h2 className="relative z-10 text-xl font-bold">
        Welcome back, Desmond
      </h2>
      <p className="relative z-10 text-[14px] text-white/80 mt-1">
        Here&apos;s your social media performance overview for today.
      </p>

      {!isLoading && stats && (
        <div className="relative z-10 flex flex-wrap gap-8 mt-4">
          <div>
            <div className="text-[28px] font-extrabold tracking-tight leading-none">
              {totalMessages}
            </div>
            <div className="text-[12px] text-white/70 mt-0.5">
              Total messages this week
            </div>
          </div>
          <div>
            <div className="text-[28px] font-extrabold tracking-tight leading-none">
              {totalMessages > 0
                ? `${Math.round(
                    ((totalMessages - stats.flaggedConversations) /
                      totalMessages) *
                      100
                  )}%`
                : "—"}
            </div>
            <div className="text-[12px] text-white/70 mt-0.5">
              Response rate
            </div>
          </div>
          <div>
            <div className="text-[28px] font-extrabold tracking-tight leading-none">
              {stats.avgResponseTimeMinutes}m
            </div>
            <div className="text-[12px] text-white/70 mt-0.5">
              Avg. response time
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
