-- CQ Social Buddy — Meta OAuth & Webhook Events
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD COLUMNS TO PLATFORM_ACCOUNTS
-- ============================================
alter table public.platform_accounts
  add column if not exists user_access_token text,
  add column if not exists user_token_expires_at timestamptz,
  add column if not exists instagram_business_account_id text,
  add column if not exists permissions_granted text[],
  add column if not exists connected_by uuid references public.profiles(id);

-- ============================================
-- 2. WEBHOOK EVENTS LOG
-- ============================================
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('facebook', 'instagram')),
  event_type text not null,
  page_id text,
  payload jsonb not null default '{}',
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_webhook_events_created_at on public.webhook_events (created_at desc);
create index idx_webhook_events_page_id on public.webhook_events (page_id);

-- RLS for webhook_events
alter table public.webhook_events enable row level security;

create policy "Authenticated users can read webhook events"
  on public.webhook_events for select
  using (auth.role() = 'authenticated');

create policy "Service role can insert webhook events"
  on public.webhook_events for insert
  with check (true);
