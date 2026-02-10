"use client";

import { Menu, Bell, Anchor, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MobileNav } from "./mobile-nav";
import Link from "next/link";

interface HeaderProps {
  unreadCount?: number;
}

export function Header({ unreadCount = 0 }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 py-4 border-b border-border bg-card lg:px-6">
      {/* Mobile menu + logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <MobileNav />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Anchor className="h-5 w-5 text-primary" />
          <span className="font-semibold">CQ Social</span>
        </div>
      </div>

      {/* Title */}
      <div className="hidden lg:block">
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Celtic Quest Social Media Command Center
        </p>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex items-center gap-2 h-[38px] px-4 rounded-[10px] text-[13px] font-medium"
        >
          <Search className="h-4 w-4" />
          Search
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="relative h-[38px] w-[38px] rounded-[10px]"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
        <Link href="/inbox">
          <Button
            size="sm"
            className="hidden sm:flex items-center gap-2 h-[38px] px-4 rounded-[10px] text-[13px] font-medium bg-primary hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4" />
            New Draft
          </Button>
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}
