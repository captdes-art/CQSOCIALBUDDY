"use client";

import { useStats } from "@/hooks/use-stats";
import { useConversations } from "@/hooks/use-conversations";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ClassificationChart } from "@/components/dashboard/classification-chart";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { ConversationCard } from "@/components/inbox/conversation-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Conversation } from "@/types";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: pendingData, isLoading: pendingLoading } = useConversations({
    status: "draft_ready",
    sort_by: "last_message_at",
    sort_order: "desc",
  });

  const pendingConversations = pendingData?.conversations?.slice(0, 5) || [];

  return (
    <div className="p-4 lg:p-7 space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner stats={stats} isLoading={statsLoading} />

      {/* Stats */}
      {statsLoading ? (
        <div className="flex items-center justify-center h-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : stats ? (
        <StatsCards
          messagesToday={stats.messagesToday}
          pendingDrafts={stats.pendingDrafts}
          flaggedConversations={stats.flaggedConversations}
          avgResponseTimeMinutes={stats.avgResponseTimeMinutes}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Pending approvals */}
        <Card className="rounded-[14px] border-border shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[15px] font-semibold">
              Pending Approvals
            </CardTitle>
            <Link href="/inbox?status=draft_ready">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary font-semibold text-[13px] hover:text-indigo-600"
              >
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {pendingLoading ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : pendingConversations.length ? (
              pendingConversations.map((c: Conversation) => (
                <ConversationCard
                  key={c.id}
                  conversation={c}
                  isSelected={false}
                  isActive={false}
                  onSelect={() => {}}
                  onClick={() => {}}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground p-4 text-center">
                All caught up! No pending drafts.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Classification breakdown */}
        {stats && (
          <ClassificationChart breakdown={stats.classificationBreakdown} />
        )}
      </div>
    </div>
  );
}
