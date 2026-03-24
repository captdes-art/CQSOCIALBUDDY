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
  TrendingUp,
  Instagram,
  Webhook,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inbox", href: "/inbox", icon: Inbox },
  { name: "Flagged", href: "/flagged", icon: AlertTriangle },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Engagement", href: "/engagement", icon: TrendingUp },
  { name: "Instagram", href: "/instagram", icon: Instagram },
  { name: "Webhooks", href: "/webhooks", icon: Webhook },
];

const settingsNav = [
  { name: "General", href: "/settings", icon: Settings },
  { name: "Team", href: "/settings/team", icon: Users },
  { name: "Integrations", href: "/settings/integrations", icon: Plug },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div
      className="flex flex-col h-full text-white"
      style={{ background: "linear-gradient(180deg, #312e81, #4338ca, #6366f1)" }}
    >
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
          <Anchor className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold text-[16px]">CQ Social Buddy</span>
      </div>

      <ScrollArea className="flex-1 py-4">
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
                    ? "bg-white/[0.18] text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {item.name}
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
                    ? "bg-white/[0.18] text-white"
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
    </div>
  );
}
