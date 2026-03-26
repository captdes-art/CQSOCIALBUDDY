-- CQ Social Buddy — Auto-Reply Settings
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. AUTO-REPLY SETTINGS (singleton — one row for the app)
-- ============================================
create table public.auto_reply_settings (
  id uuid primary key default gen_random_uuid(),

  -- Global kill switch
  global_auto_reply_enabled boolean not null default true,

  -- Per-classification automation mode for DMs
  -- Values: 'auto_send', 'auto_draft', 'manual', 'ignore'
  dm_faq_mode text not null default 'auto_send'
    check (dm_faq_mode in ('auto_send', 'auto_draft', 'manual', 'ignore')),
  dm_booking_mode text not null default 'auto_draft'
    check (dm_booking_mode in ('auto_send', 'auto_draft', 'manual', 'ignore')),
  dm_compliment_mode text not null default 'auto_send'
    check (dm_compliment_mode in ('auto_send', 'auto_draft', 'manual', 'ignore')),
  dm_complaint_mode text not null default 'manual'
    check (dm_complaint_mode in ('auto_send', 'auto_draft', 'manual', 'ignore')),
  dm_complex_mode text not null default 'manual'
    check (dm_complex_mode in ('auto_send', 'auto_draft', 'manual', 'ignore')),
  dm_spam_mode text not null default 'ignore'
    check (dm_spam_mode in ('auto_send', 'auto_draft', 'manual', 'ignore')),

  -- Comment auto-reply controls
  comment_auto_reply_enabled boolean not null default true,
  comment_public_reply_text text not null default 'Great question! Check your DMs for the full answer 🎣',
  comment_delay_min_seconds integer not null default 15,
  comment_delay_max_seconds integer not null default 45,

  -- Thresholds
  confidence_threshold numeric not null default 0.75,
  auto_draft_delay_minutes integer not null default 5,
  max_auto_replies_per_hour integer not null default 50,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Insert default settings row
insert into public.auto_reply_settings (id) values (gen_random_uuid());

-- Enable RLS
alter table public.auto_reply_settings enable row level security;

-- Anyone authenticated can read settings
create policy "Authenticated users can read auto_reply_settings"
  on public.auto_reply_settings for select
  to authenticated
  using (true);

-- Only admins can update settings
create policy "Admins can update auto_reply_settings"
  on public.auto_reply_settings for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================
-- 2. ADD auto_send_at TO ai_drafts
-- ============================================
-- Used by auto-draft mode: cron sends pending drafts after this timestamp
alter table public.ai_drafts
  add column if not exists auto_send_at timestamptz;
