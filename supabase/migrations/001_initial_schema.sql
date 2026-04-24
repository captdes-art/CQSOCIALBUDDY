-- CQ Social Buddy — Initial Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'viewer' check (role in ('admin', 'reviewer', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 2. PLATFORM ACCOUNTS
-- ============================================
create table public.platform_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('facebook', 'instagram')),
  platform_account_id text not null,
  account_name text not null,
  access_token text not null,
  token_expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_platform_accounts_unique on public.platform_accounts (platform, platform_account_id);

-- ============================================
-- 3. CONVERSATIONS
-- ============================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('facebook_messenger', 'instagram_dm')),
  platform_conversation_id text not null unique,
  customer_platform_id text not null,
  customer_name text,
  customer_avatar_url text,
  status text not null default 'new' check (status in ('new', 'draft_ready', 'approved', 'sent', 'flagged', 'ignored')),
  classification text check (classification in ('booking', 'faq', 'compliment', 'complaint', 'complex', 'spam')),
  assigned_to uuid references public.profiles(id) on delete set null,
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  source_type text not null default 'dm' check (source_type in ('dm', 'comment')),
  source_post_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_conversations_platform on public.conversations (platform);
create index idx_conversations_status on public.conversations (status);
create index idx_conversations_classification on public.conversations (classification);
create index idx_conversations_assigned_to on public.conversations (assigned_to);
create index idx_conversations_last_message on public.conversations (last_message_at desc);
create index idx_conversations_source_type on public.conversations (source_type);

-- ============================================
-- 4. MESSAGES
-- ============================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  platform_message_id text not null unique,
  direction text not null check (direction in ('inbound', 'outbound')),
  content text not null,
  content_type text not null default 'text' check (content_type in ('text', 'image', 'attachment')),
  sender_name text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_messages_conversation on public.messages (conversation_id, sent_at);

-- ============================================
-- 5. AI DRAFTS
-- ============================================
create table public.ai_drafts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  draft_content text not null,
  edited_content text,
  classification text not null check (classification in ('booking', 'faq', 'compliment', 'complaint', 'complex', 'spam')),
  confidence_score real not null default 0.0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'sent', 'rejected')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  sent_at timestamptz,
  vapi_response_raw jsonb,
  created_at timestamptz not null default now()
);

create index idx_ai_drafts_conversation on public.ai_drafts (conversation_id);
create index idx_ai_drafts_status on public.ai_drafts (status);

-- ============================================
-- 6. ACTIVITY LOG
-- ============================================
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  action text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_activity_log_conversation on public.activity_log (conversation_id);
create index idx_activity_log_created on public.activity_log (created_at desc);

-- ============================================
-- 7. NOTIFICATION SETTINGS
-- ============================================
create table public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade unique,
  complaint_sms boolean not null default true,
  complaint_phone text,
  daily_summary_email boolean not null default true,
  daily_summary_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- 8. UPDATED_AT TRIGGER
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger update_platform_accounts_updated_at before update on public.platform_accounts
  for each row execute function public.update_updated_at();
create trigger update_conversations_updated_at before update on public.conversations
  for each row execute function public.update_updated_at();
create trigger update_notification_settings_updated_at before update on public.notification_settings
  for each row execute function public.update_updated_at();

-- ============================================
-- 9. ROW LEVEL SECURITY
-- ============================================

-- Helper function: get current user's role
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- PROFILES
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.get_user_role() = 'admin');

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.get_user_role() = 'admin');

-- PLATFORM ACCOUNTS (admin only)
alter table public.platform_accounts enable row level security;

create policy "Authenticated users can read platform accounts"
  on public.platform_accounts for select
  using (auth.role() = 'authenticated');

create policy "Admins can manage platform accounts"
  on public.platform_accounts for all
  using (public.get_user_role() = 'admin');

-- CONVERSATIONS
alter table public.conversations enable row level security;

create policy "Authenticated users can read conversations"
  on public.conversations for select
  using (auth.role() = 'authenticated');

create policy "Admin and reviewer can update conversations"
  on public.conversations for update
  using (public.get_user_role() in ('admin', 'reviewer'));

create policy "Service role can insert conversations"
  on public.conversations for insert
  with check (true);

-- MESSAGES
alter table public.messages enable row level security;

create policy "Authenticated users can read messages"
  on public.messages for select
  using (auth.role() = 'authenticated');

create policy "Service role can insert messages"
  on public.messages for insert
  with check (true);

-- AI DRAFTS
alter table public.ai_drafts enable row level security;

create policy "Authenticated users can read drafts"
  on public.ai_drafts for select
  using (auth.role() = 'authenticated');

create policy "Admin and reviewer can update drafts"
  on public.ai_drafts for update
  using (public.get_user_role() in ('admin', 'reviewer'));

create policy "Service role can insert drafts"
  on public.ai_drafts for insert
  with check (true);

-- ACTIVITY LOG
alter table public.activity_log enable row level security;

create policy "Authenticated users can read activity log"
  on public.activity_log for select
  using (auth.role() = 'authenticated');

create policy "Service role can insert activity log"
  on public.activity_log for insert
  with check (true);

-- NOTIFICATION SETTINGS
alter table public.notification_settings enable row level security;

create policy "Users can manage own notification settings"
  on public.notification_settings for all
  using (auth.uid() = user_id);

-- ============================================
-- 10. ENABLE REALTIME
-- ============================================
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.ai_drafts;
