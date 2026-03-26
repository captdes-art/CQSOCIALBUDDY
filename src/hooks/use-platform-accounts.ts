"use client";

import { useQuery } from "@tanstack/react-query";

interface PlatformAccountSummary {
  id: string;
  platform: string;
  platform_account_id: string;
  account_name: string;
  is_active: boolean;
  instagram_business_account_id: string | null;
  permissions_granted: string[] | null;
  created_at: string;
}

async function fetchAccounts(): Promise<PlatformAccountSummary[]> {
  const res = await fetch("/api/meta/accounts");
  if (!res.ok) throw new Error("Failed to fetch accounts");
  const data = await res.json();
  return data.accounts;
}

export function usePlatformAccounts() {
  return useQuery({
    queryKey: ["platform-accounts"],
    queryFn: fetchAccounts,
    staleTime: 30_000,
  });
}
