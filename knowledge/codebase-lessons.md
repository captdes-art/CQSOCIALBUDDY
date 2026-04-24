# Codebase Lessons — CQ Social Buddy
_Accumulated knowledge from prior coding jobs. Read this before starting any task._
_Last updated: 2026-03-09_

---

## Stack Quick Reference
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase (xuoxhinovwhzxcxfhqab)
- **Social APIs:** Meta Graph API (FB/IG), TikTok, X (Twitter)
- **Deploy:** Vercel — auto-deploys from `main`
- **Purpose:** Social media automation pipeline for Celtic Quest

---

## Golden Rules
1. Commit and push after every change
2. Never hardcode social API tokens — use Supabase secrets or Vercel env vars
3. Meta Graph API: rate limits are real — batch requests where possible
4. Smoke test after deploy — verify photo pipeline still runs

---

## Key Integrations
- Meta Graph API — Facebook + Instagram posts, DM handling
- TikTok API — video uploads
- X/Twitter — post automation (Tweepy + OAuth1)
- Photo pipeline — processes WhatsApp crew photos for social posting

---

## Lessons Log
### 2026-03-09 — Initial Seed
- No CLAUDE.md present — seed based on project type
- Social API tokens are sensitive — always use secrets, never log values
