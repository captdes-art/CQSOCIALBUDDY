"use client";

import {
  MessageSquare,
  FileEdit,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  messagesToday: number;
  pendingDrafts: number;
  flaggedConversations: number;
  avgResponseTimeMinutes: number;
}

export function StatsCards({
  messagesToday,
  pendingDrafts,
  flaggedConversations,
  avgResponseTimeMinutes,
}: StatsCardsProps) {
  const stats = [
    {
      title: "Messages Today",
      value: messagesToday,
      icon: MessageSquare,
      description: "Inbound messages received",
    },
    {
      title: "Pending Drafts",
      value: pendingDrafts,
      icon: FileEdit,
      description: "Awaiting your approval",
    },
    {
      title: "Flagged",
      value: flaggedConversations,
      icon: AlertTriangle,
      description: "Need manual review",
      className: flaggedConversations > 0 ? "text-destructive" : "",
    },
    {
      title: "Avg Response Time",
      value: `${avgResponseTimeMinutes}m`,
      icon: Clock,
      description: "Draft to sent (7-day avg)",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.className || ""}`}>
              {stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
