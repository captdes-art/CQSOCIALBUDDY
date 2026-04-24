"use client";

import { useStats } from "@/hooks/use-stats";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ClassificationChart } from "@/components/dashboard/classification-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 lg:p-6">
        <p className="text-muted-foreground">Unable to load analytics</p>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <StatsCards
        messagesToday={stats.messagesToday}
        pendingDrafts={stats.pendingDrafts}
        flaggedConversations={stats.flaggedConversations}
        avgResponseTimeMinutes={stats.avgResponseTimeMinutes}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ClassificationChart breakdown={stats.classificationBreakdown} />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Response Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Average Response Time
                </p>
                <p className="text-3xl font-bold">
                  {stats.avgResponseTimeMinutes}
                  <span className="text-lg font-normal text-muted-foreground">
                    {" "}min
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Messages Handled Today
                </p>
                <p className="text-3xl font-bold">{stats.messagesToday}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Pending Review
                </p>
                <p className="text-3xl font-bold">
                  {stats.pendingDrafts + stats.flaggedConversations}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
