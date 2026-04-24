# Meta App Review — Complete Troubleshooting & Process Guide

> **Last updated:** 2026-04-08
> **App:** CQ Social Buddy (App ID: 876031045341389)
> **Page:** Celtic Quest Fishing Fleet (Page ID: 101274736607035)
> **Instagram:** @celtic_quest_fleet (ID: 17841401004979948)

---

## Test User Credentials (for Meta Reviewers)

- **URL:** https://cq-social-buddy.vercel.app/login
- **Email:** testuser@celticquestfishing.com
- **Password:** TestUser2026!

**Reviewer instructions (paste into every submission):**
> To access the app: Go to https://cq-social-buddy.vercel.app/login. Log in with Email: testuser@celticquestfishing.com / Password: TestUser2026!. After logging in, you will see the dashboard with the connected Facebook Page and Instagram account. Navigate to the Inbox to see incoming messages and comments. To test messaging: send a DM to the Celtic Quest Fishing Fleet Facebook Page via Messenger or to @celtic_quest_fleet on Instagram from any account. The message will appear in the app's Inbox, where you can view and send a reply.

---

## Facebook Login for Business — CRITICAL

This app uses **Facebook Login for Business** (NOT regular Facebook Login). This has major implications:

### OAuth URL Format
**WRONG (will cause "Invalid Scopes" error):**
```
https://www.facebook.com/v21.0/dialog/oauth?client_id=APP_ID&scope=perm1,perm2&response_type=code
```

**CORRECT:**
```
https://www.facebook.com/v21.0/dialog/oauth?client_id=APP_ID&config_id=CONFIG_ID&redirect_uri=URI&response_type=code&override_default_response_type=true
```

### Configuration ID
- **Config ID:** `801906359657326` (named "SOCIAL PRO 111")
- Created in: Meta Dashboard → Facebook Login for Business → Configurations
- Contains ALL permissions the app needs
- If you need to add new permissions, **edit this configuration** or create a new one

### How to Create/Edit a Configuration
1. Meta App Dashboard → Facebook Login for Business → Configurations
2. Click "Create configuration" or "Edit" on existing
3. Steps: Name → Login variation → **Access token: "User access token"** → Assets → Permissions
4. Add all required permissions in the Permissions step
5. Save → copy the Configuration ID
6. Update `config_id` in `src/app/(dashboard)/settings/integrations/page.tsx`

---

## Complete Permission Map

| Permission | What it does | API endpoints | Status |
|---|---|---|---|
| `pages_show_list` | List user's Pages | GET /me/accounts | Approved |
| `pages_read_engagement` | Read Page posts, comments, likes | GET /{page}/posts, GET /{post}/comments | Approved |
| `pages_read_user_content` | Read user-generated comments/posts on Page | GET /{post}/comments?fields=from | Pending (submitted 2026-04-08) |
| `pages_manage_metadata` | Subscribe to webhooks | POST /{page}/subscribed_apps | Approved |
| `pages_manage_engagement` | Post/edit/delete comments | POST /{post}/comments, POST /{comment}/comments | Pending (submitted 2026-04-08) |
| `pages_messaging` | Send/receive Messenger DMs | POST /me/messages | Approved |
| `instagram_basic` | Read IG profile and media | GET /{ig-user}?fields=..., GET /{ig-user}/media | Approved |
| `instagram_manage_messages` | Send/receive Instagram DMs | POST /me/messages (IG) | Approved |

---

## API Test Calls for App Review

Meta requires at least **1 successful API call per permission** before you can submit for App Review. These calls register in 24-48 hours.

### How it works (no chicken-and-egg problem)
- As the **app admin**, you already have Standard Access to ALL permissions in development mode
- You can make real API calls right now — no approval needed for admin accounts
- Meta just needs to SEE the call logged in their system

### Making test calls via curl

First, get the fresh page token from Supabase:
```bash
source .env.local
PAGE_TOKEN=$(curl -s "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/platform_accounts?select=access_token&platform=eq.facebook&is_active=eq.true&limit=1" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['access_token'])")
```

Then make the test calls:

**pages_manage_engagement** (post a comment):
```bash
curl -X POST "https://graph.facebook.com/v21.0/{POST_ID}/comments" \
  -d "message=Test comment" \
  -d "access_token=${PAGE_TOKEN}"
```

**pages_read_user_content** (read user comments):
```bash
curl "https://graph.facebook.com/v21.0/{POST_ID}/comments?fields=id,message,from&access_token=${PAGE_TOKEN}"
```

**pages_read_engagement** (read posts):
```bash
curl "https://graph.facebook.com/v21.0/101274736607035/posts?fields=id,message&limit=3&access_token=${PAGE_TOKEN}"
```

**pages_manage_metadata** (subscribe to webhooks):
```bash
curl -X POST "https://graph.facebook.com/v21.0/101274736607035/subscribed_apps" \
  -H "Authorization: Bearer ${PAGE_TOKEN}" \
  -d '{"subscribed_fields":"messages,feed"}'
```

---

## OAuth Callback Flow

File: `src/app/api/meta/auth/callback/route.ts`

1. User clicks "Connect with Facebook" → Facebook OAuth dialog opens
2. User grants permissions → redirected to `/api/meta/auth/callback?code=...`
3. Callback exchanges code for short-lived token
4. Exchanges short-lived token for long-lived user token
5. Calls `/me/accounts` to get Page list + Page access tokens
6. **Fallback:** If `/me/accounts` returns 0 pages, tries direct lookup using known Page ID `101274736607035`
7. **Last resort fallback:** Uses `FB_PAGE_ACCESS_TOKEN` env var (this is often expired — avoid relying on it)
8. Stores tokens in Supabase `platform_accounts` table
9. Subscribes page to webhooks
10. Redirects to `/settings/integrations?connected=true`

### Common OAuth Issues

| Error | Cause | Fix |
|---|---|---|
| "Invalid Scopes: pages_read_user_content" | Using `scope=` instead of `config_id=` | Switch to config_id approach |
| "Error validating access token: session invalidated" | Expired token in DB or env var | Reconnect Facebook account |
| `/me/accounts` returns 0 pages | Token doesn't have page access OR Facebook Login for Business token quirk | Direct page lookup fallback handles this |
| "Page fetch failed" error on Integrations page | Old expired token in DB being validated on page load | Ignore — click Connect to get fresh token |

---

## Submission Descriptions (copy-paste for App Review)

### pages_manage_engagement
```
CQ Social Buddy is a social media management tool for Celtic Quest Fishing Fleet, a charter fishing business. We use pages_manage_engagement to reply to customer comments on our Facebook Page posts. When customers ask about trip availability, pricing, or scheduling in post comments, our team reviews the comment in the app and sends a reply directly from the app interface. This allows us to respond to customer inquiries efficiently without switching between multiple platforms.

How to test:
1. Log into the app at: https://cq-social-buddy.vercel.app/login
   - Email: testuser@celticquestfishing.com
   - Password: TestUser2026!
2. Navigate to "Engagement" in the left sidebar.
3. Find a post with comments and click "Reply."
4. The app posts the reply as a comment on the Page post using the pages_manage_engagement permission.
```

### pages_read_user_content
```
CQ Social Buddy is a social media management tool for Celtic Quest Fishing Fleet. We use pages_read_user_content to read user-generated comments and posts on our Facebook Page so that our team can view, moderate, and respond to customer inquiries about fishing trip availability, pricing, and scheduling. This is essential for our customer engagement workflow — without reading user comments, we cannot provide timely responses to potential customers.

How to test:
1. Log into the app at: https://cq-social-buddy.vercel.app/login
   - Email: testuser@celticquestfishing.com
   - Password: TestUser2026!
2. After logging in, navigate to the "Engagement" or "Inbox" section in the left sidebar.
3. You will see user comments and posts from the connected Facebook Page (Celtic Quest Fishing Fleet).
4. The app reads these comments to display them for review and response by the business owner.
```

---

## App Review Submission Checklist

Before submitting:
- [ ] All permission descriptions filled in with clear use case
- [ ] Screen recordings uploaded for each permission (see META_APP_REVIEW_RECORDING_GUIDE.md)
- [ ] API test calls made for each permission (check 24-48 hours later for registration)
- [ ] Test user credentials included in Reviewer Instructions
- [ ] Data handling section completed
- [ ] Business verification completed
- [ ] App is published (not in development mode)
- [ ] Privacy policy URL set (https://cq-social-buddy.vercel.app/privacy)
- [ ] Terms of service URL set (https://cq-social-buddy.vercel.app/terms)
- [ ] Data deletion URL set (https://cq-social-buddy.vercel.app/data-deletion)

---

## History of Submissions

| Round | Date | Result | Issue |
|---|---|---|---|
| 1 | March 2026 | Rejected | Bad screencasts — no OAuth flow, no captions |
| 2 | March 2026 | Approved (6 permissions) | Missing pages_manage_engagement |
| 3 | April 2026 | In progress | Adding pages_manage_engagement |
| 4 | April 2026 | Pending | Adding pages_read_user_content (dependency) |

---

## Files That Matter

| File | Purpose |
|---|---|
| `src/app/(dashboard)/settings/integrations/page.tsx` | OAuth initiation (config_id lives here) |
| `src/app/api/meta/auth/callback/route.ts` | OAuth callback (token exchange, page lookup) |
| `src/lib/meta/oauth.ts` | Token exchange functions (getOAuthUrl is DEAD CODE — not used) |
| `src/lib/meta/send.ts` | Sending messages and comment replies |
| `src/lib/meta/client.ts` | Long-lived token exchange |
| `META_APP_REVIEW_RECORDING_GUIDE.md` | Screencast scripts for each permission |
| `knowledge/meta-app-review-complete-guide.md` | This file |

---

## Git Safety Warning

This repo has macOS "copy 2" duplicate files everywhere (e.g., `oauth 2.ts`, `send 2.ts`). **NEVER use `git add .` or `git add -A`** — it will stage these duplicates and can delete the entire codebase. Always add files by specific path and verify with `git diff --cached --stat` before committing.
