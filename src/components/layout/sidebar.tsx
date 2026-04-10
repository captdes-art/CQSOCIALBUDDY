"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  AlertTriangle,
  BarChart3,
  Settings,
  Users,
  Plug,
  Anchor,
  Bot,
  TrendingUp,
  Instagram,
  Webhook,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStats } from "@/hooks/use-stats";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inbox", href: "/inbox", icon: Inbox, showBadge: true },
  { name: "Flagged", href: "/flagged", icon: AlertTriangle },
  { name: "Archived", href: "/archived", icon: Archive },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Engagement", href: "/engagement", icon: TrendingUp },
  { name: "Instagram", href: "/instagram", icon: Instagram },
  { name: "Webhooks", href: "/webhooks", icon: Webhook },
];

const settingsNav = [
  { name: "General", href: "/settings", icon: Settings },
  { name: "Auto-Reply", href: "/settings/auto-reply", icon: Bot },
  { name: "Team", href: "/settings/team", icon: Users },
  { name: "Integrations", href: "/settings/integrations", icon: Plug },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: stats } = useStats();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[264px] relative overflow-hidden flex-shrink-0"
      style={{ background: "linear-gradient(180deg, #312e81, #4338ca, #6366f1)" }}
    >
      {/* Decorative pink glow at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[200px] pointer-events-none"
        style={{ background: "linear-gradient(180deg, transparent, rgba(236,72,153,0.2))" }}
      />

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <Anchor className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold text-[16px] text-white tracking-tight">
          CQ Social Buddy
        </span>
      </div>

      <ScrollArea className="flex-1 py-5 relative z-[1]">
        <nav className="px-3 space-y-1">
          <p className="px-3 mb-2 text-[10px] font-semibold text-white/40 uppercase tracking-[1.2px]">
            Main
          </p>
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all",
                  isActive
                    ? "bg-white/[0.18] text-white shadow-sm"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.name}
                {item.showBadge && stats && stats.pendingDrafts > 0 && (
                  <span className="ml-auto bg-pink-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg">
                    {stats.pendingDrafts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <nav className="px-3 mt-6 space-y-1">
          <p className="px-3 mb-2 text-[10px] font-semibold text-white/40 uppercase tracking-[1.2px]">
            Settings
          </p>
          {settingsNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all",
                  isActive
                    ? "bg-white/[0.18] text-white shadow-sm"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User section at bottom */}
      <div className="flex items-center gap-3 px-5 py-4 border-t border-white/10 relative z-[1]">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white text-[13px] font-semibold">
          DS
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Desmond</div>
          <div className="text-[11px] text-white/50">Admin</div>
        </div>
      </div>
    </aside>
  );
}
