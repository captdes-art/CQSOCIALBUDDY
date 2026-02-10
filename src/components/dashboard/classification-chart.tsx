"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS: Record<string, string> = {
  booking: "bg-green-500",
  faq: "bg-sky-500",
  compliment: "bg-amber-500",
  complaint: "bg-red-500",
  complex: "bg-purple-500",
  spam: "bg-gray-400",
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
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Message Types (7 days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map(([key, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">{LABELS[key] || key}</span>
                <span className="text-sm text-muted-foreground">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full ${COLORS[key] || "bg-gray-300"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
