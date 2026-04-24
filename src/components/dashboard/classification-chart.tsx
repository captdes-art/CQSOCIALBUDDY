"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS: Record<string, string> = {
  booking: "from-green-500 to-teal-500",
  faq: "from-indigo-500 to-indigo-400",
  compliment: "from-amber-500 to-yellow-400",
  complaint: "from-red-500 to-red-400",
  complex: "from-violet-500 to-purple-400",
  spam: "from-slate-400 to-slate-300",
};

const LEGEND_DOTS: Record<string, string> = {
  booking: "bg-green-500",
  faq: "bg-indigo-500",
  compliment: "bg-amber-500",
  complaint: "bg-red-500",
  complex: "bg-violet-500",
  spam: "bg-slate-400",
};

const LABELS: Record<string, string> = {
  booking: "Booking",
  faq: "FAQ",
  compliment: "Compliment",
  complaint: "Complaint",
  complex: "Complex",
  spam: "Spam",
};

interface ClassificationChartProps {
  breakdown: Record<string, number>;
}

export function ClassificationChart({ breakdown }: ClassificationChartProps) {
  const total = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  if (total === 0) {
    return (
      <Card className="rounded-[14px] border-border shadow-none">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold">
            Message Types (7 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

  return (
    <Card className="rounded-[14px] border-border shadow-none">
      <CardHeader>
        <CardTitle className="text-[15px] font-semibold">
          Message Types (7 days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Legend dots */}
        <div className="flex flex-wrap gap-4 mb-5">
          {entries.map(([key]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  LEGEND_DOTS[key] || "bg-slate-400"
                }`}
              />
              <span className="text-[13px]">{LABELS[key] || key}</span>
              <span className="text-[12px] text-muted-foreground font-medium">
                {Math.round((breakdown[key] / total) * 100)}%
              </span>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="space-y-3">
          {entries.map(([key, count]) => {
            const pct = Math.round((count / total) * 100);
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] font-medium">
                    {LABELS[key] || key}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {count}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${
                      COLORS[key] || "from-slate-400 to-slate-300"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
