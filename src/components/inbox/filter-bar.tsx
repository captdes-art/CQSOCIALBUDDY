"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ConversationFilters } from "@/types";

interface FilterBarProps {
  filters: ConversationFilters;
  onFiltersChange: (filters: ConversationFilters) => void;
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  function updateFilter(key: keyof ConversationFilters, value: string) {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? undefined : value,
    });
  }

  return (
    <div className="flex flex-col gap-2 p-3 border-b sm:flex-row sm:items-center">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          className="pl-8 h-9"
          value={filters.search || ""}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
      </div>

      {/* Platform filter */}
      <Select
        value={filters.platform || "all"}
        onValueChange={(v) => updateFilter("platform", v)}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Platforms</SelectItem>
          <SelectItem value="facebook_messenger">Messenger</SelectItem>
          <SelectItem value="instagram_dm">Instagram</SelectItem>
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={filters.status || "all"}
        onValueChange={(v) => updateFilter("status", v)}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="draft_ready">Draft Ready</SelectItem>
          <SelectItem value="flagged">Flagged</SelectItem>
          <SelectItem value="sent">Sent</SelectItem>
          <SelectItem value="ignored">Ignored</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>

      {/* Classification filter */}
      <Select
        value={filters.classification || "all"}
        onValueChange={(v) => updateFilter("classification", v)}
      >
        <SelectTrigger className="w-[140px] h-9">
          <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="booking">Booking</SelectItem>
          <SelectItem value="faq">FAQ</SelectItem>
          <SelectItem value="compliment">Compliment</SelectItem>
          <SelectItem value="complaint">Complaint</SelectItem>
          <SelectItem value="complex">Complex</SelectItem>
          <SelectItem value="spam">Spam</SelectItem>
        </SelectContent>
      </Select>

      {/* Reset */}
      {(filters.platform ||
        filters.status ||
        filters.classification ||
        filters.search) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onFiltersChange({
              sort_by: "last_message_at",
              sort_order: "desc",
            })
          }
        >
          Clear
        </Button>
      )}
    </div>
  );
}
