"use client";

import {
  MessageSquare,
  FileEdit,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  messagesToday: number;
  pendingDrafts: number;
  flaggedConversations: number;
  avgResponseTimeMinutes: number;
}

const iconWrapStyles: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-500",
  amber: "bg-amber-50 text-amber-500",
  red: "bg-red-50 text-red-500",
  teal: "bg-teal-50 text-teal-500",
};

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
      color: "indigo",
    },
    {
      title: "Pending Drafts",
      value: pendingDrafts,
      icon: FileEdit,
      description: "Awaiting your approval",
      color: "amber",
    },
    {
      title: "Flagged",
      value: flaggedConversations,
      icon: AlertTriangle,
      description: "Need manual review",
      color: "red",
      valueClass: flaggedConversations > 0 ? "text-red-500" : "",
    },
    {
      title: "Avg Response",
      value: `${avgResponseTimeMinutes}m`,
      icon: Clock,
      description: "Draft to sent (7-day avg)",
      color: "teal",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="rounded-[14px] border-border shadow-none hover:shadow-[0_4px_16px_rgba(99,102,241,0.08)] transition-all hover:-translate-y-0.5"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-muted-foreground font-medium">
                {stat.title}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${
                  iconWrapStyles[stat.color]
                }`}
              >
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div
              className={`text-[30px] font-extrabold tracking-tight leading-none ${
                stat.valueClass || ""
              }`}
            >
              {stat.value}
            </div>
            <p className="text-[12px] text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
