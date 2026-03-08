# CQ Social Buddy — Claude Instructions

## Why This Exists
Social media management dashboard for Celtic Quest Fishing Fleet.
Monitors, manages, and automates social media across Facebook, Instagram, TikTok, and X (Twitter).
Features: inbox management, post scheduling, analytics, flagged content review, and DM automation.
Next.js app + Supabase backend.

## Map — Where Things Live
```
src/
  app/
    (auth)/           — Login/auth routes
    (dashboard)/      — Main authenticated dashboard
      page.tsx        — Dashboard home
      analytics/      — Engagement metrics, follower trends
      inbox/          — DM inbox, comment management
      flagged/        — Flagged content for review
      settings/       — Platform connections, API keys
    auth/             — Auth callback routes
    api/              — API routes (webhook receivers, platform sync)
    privacy/          — Privacy policy page

  components/
    dashboard/        — Dashboard-specific components
    inbox/            — Inbox/message UI components
    shared/           — Shared UI components
    ui/               — Base UI primitives
    layout/           — Layout components
    providers.tsx     — App-level providers

  hooks/              — Data hooks
  lib/                — Utilities, Supabase client, platform API clients
  types/              — TypeScript types

supabase/
  migrations/         — DB schema migrations
```

## Rules

### Deployment
- Auto-deploys to Vercel on push to `main`
- After any change: `git add <files> && git commit -m "description" && git push`

### Stack
- Next.js (App Router) + TypeScript + Tailwind
- Supabase backend (auth + database)
- Meta Graph API (Facebook + Instagram)
- TikTok API
- X/Twitter API (tweepy / OAuth 1.0a)

### Social Platform Connections
All platform API keys/tokens stored as Supabase secrets or Vercel env vars — never in code.

**Meta (Facebook + Instagram):**
- Uses Meta Graph API
- Access tokens expire — check token expiry before reporting "not working"
- Instagram is managed through Facebook Business Manager

**TikTok:**
- TikTok for Business API
- Content policy is strict — always check content before auto-posting

**X/Twitter:**
- OAuth 1.0a (tweepy)
- Regenerating any key invalidates all associated access tokens — don't regenerate without updating all four values (consumer key/secret + access token/secret)

### Inbox / DM Automation
- Never auto-respond to DMs without Cap's explicit approval for the response template
- Flag unusual messages for human review rather than auto-responding
- All DM reads/sends must be logged to the database

### Data Privacy
- Customer DMs and messages are private data — never log full message content to console
- Supabase RLS must be enabled on all tables containing user data

## Workflows

### Making a Change
```bash
git add <changed files>
git commit -m "type: what changed"
git push
# Wait for Vercel deploy (~30s)
```

### Local Development
```bash
npm run dev          # Start dev server
npm run build        # Test production build before pushing
```

### Adding a New Social Platform
1. Add platform credentials to Supabase secrets + Vercel env vars
2. Create a new API client in `src/lib/`
3. Add webhook receiver in `src/app/api/`
4. Add platform to settings page
5. Test with platform's sandbox/test mode before enabling live

## Platforms & Features Status
- Facebook: ✅ (Meta Graph API)
- Instagram: ✅ (via Facebook Business Manager)
- TikTok: ✅
- X / Twitter: ✅ (tweepy + OAuth 1.0a)
