# Meta App Review — Screen Recording Guide

## Status
- **OAuth flow:** Working (Connect with Facebook on Integrations page)
- **Page:** Celtic Quest Fishing Fleet (ID: 101274736607035)
- **Instagram:** @celtic_quest_fleet (ID: 17841401004979948)
- **Permissions granted:** pages_show_list, pages_read_engagement, pages_manage_metadata, pages_messaging, instagram_basic, instagram_manage_messages
- **Pending review:** pages_read_user_content (for reading user comments with commenter names), pages_manage_engagement (for replying to comments)

## Test User Credentials (for Meta App Review)
- **URL:** https://cq-social-buddy.vercel.app/login
- **Email:** testuser@celticquestfishing.com
- **Password:** TestUser2026!

**Reviewer instructions (paste into submission):**
> To access the app: Go to https://cq-social-buddy.vercel.app/login. Log in with Email: testuser@celticquestfishing.com / Password: TestUser2026!. After logging in, you will see the dashboard with the connected Facebook Page and Instagram account. Navigate to the Inbox to see incoming messages and comments. To test messaging: send a DM to the Celtic Quest Fishing Fleet Facebook Page via Messenger or to @celtic_quest_fleet on Instagram from any account. The message will appear in the app's Inbox, where you can view and send a reply.

---

## Pre-Recording Checklist
- [ ] Celtic Quest Fishing Fleet connected on Integrations page
- [ ] At least 3-5 posts on your Facebook Page
- [ ] At least 2-3 user comments on your Page posts (from a different Facebook account — NOT the page itself)
- [ ] At least 3-5 posts on Instagram
- [ ] A second Facebook account to receive test Messenger messages
- [ ] A second Instagram account to receive test DMs
- [ ] Screen recording software (QuickTime, OBS, or Loom) at 1080p
- [ ] Caption/text overlay tool (during or post-production)

---

## Universal Rules for EVERY Recording
1. App must be in English
2. Add captions/tooltips explaining what you're doing
3. Show the complete Facebook Login flow (Scenes 1-4 below)
4. Move slowly — pause 2-3 seconds on each screen
5. Record at 1080p minimum

---

## THE COMMON OPENING (same for all 6 recordings)

### Scene 1: Login to CQ Social Buddy
1. Open browser → go to https://cq-social-buddy.vercel.app
2. Show the login page
3. **Caption:** "Logging into CQ Social Buddy"
4. Type email and password, click Sign In
5. Dashboard loads — pause 2 seconds

### Scene 2: Navigate to Integrations
1. Click "Integrations" in the sidebar
2. **Caption:** "Navigating to Settings > Integrations"
3. Show the integrations page with "Connect with Facebook" button
4. Pause 2 seconds

### Scene 3: Facebook Login OAuth
1. Click "Connect with Facebook"
2. **Caption:** "Initiating Facebook Login — requesting permissions"
3. Facebook OAuth dialog opens — show permissions listed
4. **Pause 3 seconds** on the permissions screen
5. **Caption:** "User grants app access to requested permissions"
6. Click Continue / Allow
7. Redirected back to app

### Scene 4: Show Connected State
1. Integrations page shows "Connected" with page name and ID
2. **Caption:** "Page 'Celtic Quest Fishing Fleet' (ID: 101274736607035) connected"
3. Instagram account also shown: @celtic_quest_fleet
4. Pause 2 seconds

**After Scene 4, continue into the permission-specific demo below.**

---

## RECORDING 1: `pages_show_list`

**Reviewer wants:** (1) list of Pages user manages, (2) selection with name/ID visible, (3) continuation into a Page-scoped feature

### After Common Opening:
**Scene 5:** Show the connected page with name + ID on Integrations page
- **Caption:** "Connected Pages list showing Pages this user manages"
- Pause 3 seconds

**Scene 6:** Navigate to Engagement page
- **Caption:** "Continuing to a Page-scoped feature using the selected Page"
- Show page name/ID at top, content loading for that page
- Pause 3 seconds

**Total: ~90 seconds**

---

## RECORDING 2: `pages_read_engagement`

**Reviewer wants:** (1) Page selection, (2) retrieval of posts/photos/videos, (3) rendered results with Page identity visible

### After Common Opening:
**Scene 5:** Click "Engagement" in sidebar
- **Caption:** "Navigating to Page Engagement for 'Celtic Quest Fishing Fleet' (ID: 101274736607035)"

**Scene 6:** Show Page identity at top
- **Caption:** "Page identity displayed: Celtic Quest Fishing Fleet"
- Pause 2 seconds

**Scene 7:** Scroll through posts
- Each post shows: text, image, likes count, comments count, shares count
- Pause on 2-3 posts
- **Caption:** "Post engagement data retrieved via pages_read_engagement permission"

**Total: ~2 minutes**

---

## RECORDING 3: `pages_manage_metadata`

**Reviewer wants:** (1) app subscribes to Page events, (2) sample webhook event arriving in app

### After Common Opening:
**Scene 5:** Click "Webhooks" in sidebar
- **Caption:** "Navigating to Webhook Management"

**Scene 6:** Show webhook subscriptions
- **Caption:** "Webhook subscriptions for Page 'Celtic Quest Fishing Fleet'"
- Show subscribed fields (messages, feed)
- Click "Refresh Subscriptions" if available
- Pause 3 seconds

**Scene 7:** Trigger a webhook event
- **Caption:** "Now triggering a sample webhook event"
- **Open NEW browser tab** → go to your Facebook Page
- Write a comment on a post
- **Caption:** "Comment posted on Facebook Page to trigger webhook"

**Scene 8:** Show event arriving
- Switch back to app tab
- Refresh webhook events feed
- Show new event with: type, Page ID, timestamp, payload
- **Caption:** "Webhook event from Page 'Celtic Quest Fishing Fleet' received and logged"
- Pause 3 seconds

**Total: ~2-3 minutes**

---

## RECORDING 4: `pages_messaging`

**Reviewer wants:** (1) Page/account visible, (2) live send from app, (3) message appears in Messenger

### After Common Opening:
**Scene 5:** Click "Inbox" in sidebar
- **Caption:** "Navigating to Inbox — messages for Page 'Celtic Quest Fishing Fleet'"
- Page name/ID should be visible
- Pause 2 seconds

**Scene 6:** Open a Facebook Messenger conversation
- **Caption:** "Opening conversation — replying as Page 'Celtic Quest Fishing Fleet'"
- Show platform badge "Facebook Messenger"
- Page name/ID visible in header
- Scroll through message thread
- Type a reply in the draft panel or manual reply box
- **Caption:** "Composing reply via Facebook Pages Messaging API"

**Scene 7:** Send the message
- Click "Approve & Send" or "Send Reply"
- Wait for success toast
- **Caption:** "Message sent successfully"
- Pause 2 seconds

**Scene 8:** Show in Messenger (CRITICAL)
- **Open NEW tab** → go to messenger.com (or show phone)
- **Caption:** "Verifying message delivery in Facebook Messenger"
- Show the message appearing in the conversation
- **Caption:** "Message from CQ Social Buddy delivered to Messenger"
- Pause 3 seconds

**Total: ~2-3 minutes**

---

## RECORDING 5: `instagram_basic`

**Reviewer wants:** (1) IG account with handle/ID visible, (2) profile fields retrieved, (3) media list displayed

### After Common Opening:
**Scene 5:** Click "Instagram" in sidebar
- **Caption:** "Navigating to Instagram Account: @celtic_quest_fleet (ID: 17841401004979948)"

**Scene 6:** Show profile card
- **Caption:** "Profile fields retrieved via instagram_basic permission"
- Show: handle, ID, name, bio, followers (5,181), media count, profile pic
- Hover over each field slowly
- Pause 3 seconds

**Scene 7:** Show media grid
- Scroll through posts with thumbnails
- Each shows: image, caption, like count, comment count, timestamp
- **Caption:** "Instagram media retrieved and displayed in app UI"
- Pause 3 seconds

**Total: ~2 minutes**

---

## RECORDING 6: `instagram_manage_messages`

**Reviewer wants:** (1) account visible, (2) live send from app, (3) message appears in Instagram

### After Common Opening:
**Scene 5:** Click "Inbox" in sidebar
- **Caption:** "Navigating to Inbox — messages for @celtic_quest_fleet"
- IG handle/ID should be visible
- Pause 2 seconds

**Scene 6:** Open an Instagram Direct conversation
- **Caption:** "Opening Instagram conversation — replying as @celtic_quest_fleet"
- Show "Instagram Direct" platform badge
- IG handle visible in header
- Type a reply
- **Caption:** "Composing reply via Instagram Messaging API"

**Scene 7:** Send the message
- Click "Approve & Send" or "Send Reply"
- Wait for success toast
- **Caption:** "Instagram DM sent successfully"
- Pause 2 seconds

**Scene 8:** Show in Instagram (CRITICAL)
- **Open NEW tab or phone** → Instagram DMs on recipient account
- **Caption:** "Verifying message delivery in Instagram Direct"
- Show message appearing in the DM thread
- **Caption:** "Message from CQ Social Buddy delivered to Instagram Direct"
- Pause 3 seconds

**Total: ~2-3 minutes**

---

## RECORDING 7: `pages_read_user_content`

**Reviewer wants:** (1) complete login flow, (2) user granting permission, (3) user-generated comments displayed with commenter identity — data ONLY available via this permission

**CRITICAL:** This permission provides the `from` field on comments (commenter's name and ID). Without it, you can see comment counts but NOT who wrote the comment. The screencast MUST make this distinction obvious.

### After Common Opening:
**Scene 5:** Click "Engagement" in sidebar
- **Caption:** "Navigating to Engagement for Page 'Celtic Quest Fishing Fleet' (ID: 101274736607035)"
- Show Page name and ID at top
- Pause 2 seconds

**Scene 6:** Find a post that has user comments, click the comments count
- **Caption:** "Clicking to expand user comments on this post"
- The comment section expands below the post
- Pause 2 seconds

**Scene 7:** Show individual comments with commenter names (KEY SCENE)
- **Caption with arrow pointing to commenter name:** "User-generated comment displayed with commenter's name — this data requires pages_read_user_content"
- Pause 3 seconds on a comment showing the commenter's full name in bold
- Scroll slowly if there are multiple comments
- **Caption:** "The 'from' field (commenter identity) is only available with pages_read_user_content permission"
- Show at least 2-3 different user comments with different commenter names visible
- Pause 3 seconds

**Scene 8:** Verify on Facebook.com (CRITICAL)
- **Open NEW browser tab** → navigate to the Facebook Page
- Find the same post
- **Caption:** "Verifying: same user comments visible on Facebook.com"
- Show the comments on Facebook matching what was displayed in the app
- Pause 3 seconds

**Total: ~2-3 minutes**

---

## RECORDING 8: `pages_manage_engagement`

**Reviewer wants:** (1) complete login flow, (2) user granting permission, (3) composing and sending a reply to a user comment from within the app, (4) reply appearing on Facebook.com

### After Common Opening:
**Scene 5:** Click "Engagement" in sidebar
- **Caption:** "Navigating to Engagement for Page 'Celtic Quest Fishing Fleet'"
- Pause 2 seconds

**Scene 6:** Find a post with user comments, click the comments count to expand
- **Caption:** "Expanding comments to find a customer question to reply to"
- Show the comments loading with commenter names
- Pause 2 seconds

**Scene 7:** Click "Reply" on a user comment
- **Caption:** "Clicking Reply to respond to a customer comment"
- Reply textarea appears below the comment
- Pause 2 seconds

**Scene 8:** Type and send the reply (KEY SCENE)
- **Caption:** "Composing reply to customer comment using pages_manage_engagement"
- Type a reply message (e.g., "Thanks for your interest! Our next trip departs Saturday at 6am. Book at celticquestfishing.com")
- Pause 2 seconds on the typed reply
- Click "Send Reply"
- **Caption:** "Reply sent successfully"
- Show the success toast notification
- Pause 2 seconds

**Scene 9:** Verify on Facebook.com (CRITICAL)
- **Open NEW browser tab** → navigate to the Facebook Page
- Find the same post and comment
- **Caption:** "Verifying: reply posted successfully on Facebook.com"
- Show the reply appearing under the original comment on Facebook
- **Caption with arrow:** "Reply from Celtic Quest Fishing Fleet visible on Facebook"
- Pause 3 seconds

**Total: ~3-4 minutes**

---

## Recording Order (recommended)
1. `pages_show_list` — simplest, get comfortable
2. `pages_read_engagement` — natural follow-on
3. `pages_manage_metadata` — prep a post to comment on beforehand
4. `pages_messaging` — have test Facebook account ready
5. `instagram_basic` — straightforward profile + media
6. `instagram_manage_messages` — have test Instagram account ready
7. `pages_read_user_content` — ensure user comments exist on Page posts first
8. `pages_manage_engagement` — will reply to a comment, have post with comments ready

---

## Use Case Descriptions (paste into Meta submission)

### pages_read_user_content
> CQ Social Buddy is a social media management tool used by Celtic Quest Fishing Fleet to respond to customer inquiries on their Facebook Page. We use pages_read_user_content to display user-generated comments on Page posts, including the commenter's name and comment text, in the app's Engagement screen. This allows the business owner to see which customers are asking questions about fishing trips and reply to them. The data is displayed in the app — it is not stored externally, exported, or used for advertising.

### pages_manage_engagement
> CQ Social Buddy is a social media management tool used by Celtic Quest Fishing Fleet to respond to customer inquiries on their Facebook Page. We use pages_manage_engagement to post replies to customer comments on Page posts from within the app's Engagement screen. When a customer asks about trip availability or pricing in a comment, the business owner types a reply in the app and sends it. All replies are composed and sent manually by the business owner — no automated replies are sent.

---

## Submission Notes (add to each permission)
> "Our app uses Supabase Auth for user login and Facebook Login for Business (config_id) for connecting Facebook/Instagram accounts. The OAuth dialog shown in the screencast uses the config_id approach rather than individual scope parameters. The screencast shows the complete flow: user login → Facebook OAuth → permission grant → feature demonstration. All API calls are made server-side using a page access token stored securely."
