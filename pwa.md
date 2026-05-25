# PWA Integration — Full Handoff

## Overview

The PWA is not a general feature for all users. It is a targeted channel for two specific user groups:

1. **Doubt chatters** — users who tap "Other Topic" in the booking flow or invite flow and want to chat live with an agent
2. **Advance/balance payers** — users who have paid (to be wired up, see pending section)

Everyone else just uses the website normally. The PWA install prompt is never shown unless the user is in one of these two journeys.

---

## What's Been Built

### 1. PWA Foundation

**Files:** `public/manifest.json`, `public/sw.js`, `index.html`

- `manifest.json` — standard PWA manifest with `display: standalone`, black theme, chapter அ icon
- `sw.js` — service worker handles:
  - `install` / `activate` lifecycle (skip waiting, claim clients)
  - `fetch` passthrough
  - `push` event: shows notification with title/body/icon from payload
  - `notificationclick` event: focuses existing window or opens a new one
- `index.html` — captures `beforeinstallprompt` before React mounts and stores it on `window.__deferredInstallPrompt` so it's never missed by the React `useEffect`

**PWA detection (both App.tsx and AppFlow.tsx):**
```ts
const isPwa = window.matchMedia('(display-mode: standalone)').matches
  || (window.navigator as any).standalone === true;
```

---

### 2. In-App Browser Nudge (Instagram / Facebook)

**File:** `src/App.tsx` — `InAppBrowserNudge` component

Detects Instagram (`/Instagram/i`) and Facebook (`/FBAN|FBAV/i`) in-app browsers. Shows a non-dismissible full-screen overlay on every route.

**Android:**
- Card title: "Install our App"
- Subtitle: "Add chapter அ to your home screen for the best experience"
- Yellow "Install App" button with Download icon
- Tapping fires a Chrome intent URL with `?pwa_install=1` appended:
  ```
  intent://<host><path>?pwa_install=1
  #Intent;scheme=https;package=com.android.chrome;
  S.browser_fallback_url=<encoded-url>;end
  ```
- Chrome opens the page → `?pwa_install=1` is detected → install dialog auto-fires

**iOS:**
- Bouncing yellow arrow pointing at the `···` button (top-right of screen)
- Card title: "Wait a minute!"
- 2 steps: Tap `···` menu → Tap "Open in external browser"
- Scroll locked with `position: fixed` + `touchmove` prevention (iOS ignores `overflow: hidden` on body)

**Rendered on all routes:** homepage, `/lifestyle`, `/galcode`, `/plans`, `/invite/*`, shared invite pages.

---

### 3. Auto-Trigger PWA Install from `?pwa_install=1`

**File:** `src/App.tsx` — `useEffect` in root `App()`

When Chrome opens from the Android IG nudge with `?pwa_install=1`:
1. Param is cleaned from URL immediately (`history.replaceState`)
2. Checks `window.__deferredInstallPrompt` (captured early in `index.html`) — if present, calls `.prompt()` immediately
3. If prompt hasn't fired yet, registers a `beforeinstallprompt` listener and calls `.prompt()` when it does

```ts
const already = (window as any).__deferredInstallPrompt;
if (already) {
  already.prompt();
  delete (window as any).__deferredInstallPrompt;
  return;
}
window.addEventListener('beforeinstallprompt', trigger);
```

---

### 4. PWA Install Bottom Sheets (Doubt Chat Flow)

Two entry points, same logic:

#### Entry Point A — Invite flow (`src/App.tsx`, `InviteFlow` component)

Triggered by: "Other Topic" button in the invite chat (after FAQ buttons)

- Button onClick: `setShowPwaSheet(true)` — no message added to chat, no step change (mirrors "Re-check plan details" behaviour)
- State: `showPwaSheet: boolean`
- Bottom sheet has 3 views based on context:

| Condition | View shown |
|---|---|
| `liveConversationId` exists | Live chat thread + reply input |
| `isPwa` (installed, no conversation) | Textarea to type first message + Send button |
| Not installed | Install instructions (OS-specific) |

**After sending first message** (`startLiveChat()`): sheet closes, `liveConversationId` saved to `localStorage`, push subscription requested.

#### Entry Point B — Booking flow (`src/AppFlow.tsx`)

Triggered by: "Other Topic" button in the booking chat

- Button onClick: `setShowDoubtPopup(true)` + `setDoubtSheetView(...)` 
- `doubtSheetView` is `'chat' | 'install' | 'form'`
- View selection: `liveConversationId ? 'chat' : isPwa ? 'form' : 'install'`
- `'form'` view: Name / Phone / Message form → submits via `submitDoubtAsPwaChat()`
- `'install'` view: OS-specific install instructions (see below)
- `'chat'` view: Live thread + reply input

---

### 5. OS-Specific Install Instructions

Used in both bottom sheets (install view). Priority order:

1. **`deferredInstallPrompt` available (Android Chrome, site is installable)**
   - Shows app card + "Install App" button
   - Triggers Chrome's native install mini-sheet

2. **iOS Chrome (`/CriOS/i`)**
   - Step 1: Tap `···` at the bottom right *(Chrome bottom bar)*
   - Step 2: Tap "Add to Home Screen"
   - Step 3: Open the app *(← chat will be here)*

3. **Android, no prompt (Chrome ⋮ menu fallback)**
   - Step 1: Tap ⋮ at the top right *(Chrome top bar)*
   - Step 2: Tap "Add to Home Screen"
   - Step 3: Open the app

4. **iOS Safari**
   - Step 1: Tap the Share button *(① Safari bottom bar)*
   - Step 2: Tap "Add to Home Screen"
   - Step 3: Open the app

No "I'll do it later" buttons — install is required to access the chat channel.

---

### 6. PWA Re-entry (Skip Routing, Go Straight to Chat)

**File:** `src/App.tsx` — root `App()` function

When the PWA is opened and `liveConversationId` exists in `localStorage`, the entire routing system is bypassed and `LiveChatScreen` is shown directly:

```ts
const [showLiveChat, setShowLiveChat] = useState(
  () => typeof window !== 'undefined' && !!localStorage.getItem('liveConversationId')
);
if (showLiveChat) {
  return <LiveChatScreen onBack={() => setShowLiveChat(false)} />;
}
```

**`LiveChatScreen` component** (bottom of `App.tsx`):
- WhatsApp-style UI with green `#075E54` header
- Loads conversation + messages from `doubt_conversations` / `doubt_messages`
- Realtime subscription for new messages and status changes
- Send input for follow-up messages
- Back button clears all localStorage keys:
  ```
  liveConversationId, liveConvName, liveConvEventSlug, liveConvEventTitle
  ```

---

### 7. Push Notifications

**Files:** `public/sw.js`, `src/App.tsx`, `src/AppFlow.tsx`, `supabase/functions/send-push-notification/index.ts`

#### Client side — `subscribeToPush(phone)` (both App.tsx and AppFlow.tsx)

Called after a conversation is created. Requests notification permission, creates a push subscription using the VAPID public key, and upserts to `push_subscriptions` table:

```ts
const sub = await reg.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: 'BKXd5KDV_vL6P19fk10d2STjZSkGHSXz_zHHBg53RxwKIRCDSEn0lHPfCBwDvphRbjnvX0Th-99GHh-cs6yEHpU',
});
await supabase.from('push_subscriptions').upsert({
  phone, endpoint: sub.endpoint, p256dh: subJson.keys.p256dh, auth: subJson.keys.auth,
}, { onConflict: 'phone,endpoint' });
```

#### Service worker — `public/sw.js`

```js
self.addEventListener('push', e => {
  const payload = e.data.json(); // { title, body, url }
  e.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: '/apple-touch-icon.png',
    tag: 'chat-reply',   // replaces previous unread notification
    renotify: true,
    data: { url: payload.url },
  }));
});
self.addEventListener('notificationclick', e => {
  // focuses existing window or opens new one
});
```

#### Edge Function — `supabase/functions/send-push-notification/index.ts`

- Triggered by a `pg_net` DB webhook on `doubt_messages` INSERT where `sender = 'agent'`
- Pure Deno implementation — no npm packages
- Builds VAPID JWT from scratch using `crypto.subtle` (ES256)
- Encrypts payload using AES-GCM + ECDH (RFC 8291 / aesgcm encoding)
- Fetches phone from `doubt_conversations`, gets all `push_subscriptions` for that phone
- Sends Web Push to each subscription endpoint
- Cleans up expired (HTTP 410) subscriptions automatically

---

### 8. Admin Panel — Chats Tab

**File:** `src/AdminPanel.tsx`

- Tab: `'chats'` added to the tab union type
- Green dot badge on Chats tab when open conversations exist
- Two-panel layout: 280px conversation list + flex thread view
- Functions: `loadChats()`, `loadChatMessages()`, `sendAgentReply()`, `openConversation()`, `markResolved()`, `reopenConversation()`
- Realtime subscriptions on both the conversations list and active thread
- Agent replies insert into `doubt_messages` with `sender: 'agent'` — this triggers the push notification DB hook

---

### 9. Supabase Database Tables

These tables were created via SQL migrations run directly in the Supabase dashboard (not committed to the `supabase/migrations/` folder):

#### `doubt_conversations`
| column | type | notes |
|---|---|---|
| id | uuid PK | auto |
| phone | text | 10-digit |
| name | text | nullable |
| event_slug | text | nullable |
| status | text | `'open'` \| `'resolved'` |
| created_at | timestamptz | auto |

Realtime enabled.

#### `doubt_messages`
| column | type | notes |
|---|---|---|
| id | uuid PK | auto |
| conversation_id | uuid FK | → doubt_conversations.id |
| sender | text | `'user'` \| `'agent'` |
| body | text | |
| created_at | timestamptz | auto |

Realtime enabled. INSERT with `sender = 'agent'` triggers push notification via `pg_net`.

#### `push_subscriptions`
| column | type | notes |
|---|---|---|
| id | uuid PK | auto |
| phone | text | 10-digit |
| endpoint | text | |
| p256dh | text | |
| auth | text | |
| created_at | timestamptz | auto |

Unique constraint on `(phone, endpoint)`.

---

### 10. localStorage Keys

| key | value | set by | cleared by |
|---|---|---|---|
| `liveConversationId` | UUID | `startLiveChat()` / `submitDoubtAsPwaChat()` | `LiveChatScreen` back button |
| `liveConvName` | user name string | same | same |
| `liveConvEventSlug` | event slug string | same | same |
| `liveConvEventTitle` | event title string | same | same |

---

## VAPID Keys

```
Public key:  BKXd5KDV_vL6P19fk10d2STjZSkGHSXz_zHHBg53RxwKIRCDSEn0lHPfCBwDvphRbjnvX0Th-99GHh-cs6yEHpU
Private key: gTk_kUUDG6M8pSPd7T_0forHklEWs4GzkgVxavyVPdw
Subject:     mailto:hello@chaptera.in
```

---

## Pending — Checklist

### 🔴 Critical (push notifications won't work without these)

- [ ] **Add VAPID secrets to Supabase Edge Function**
  Go to: Supabase Dashboard → Project → Edge Functions → `send-push-notification` → Secrets
  Add three secrets:
  ```
  VAPID_PUBLIC_KEY  = BKXd5KDV_vL6P19fk10d2STjZSkGHSXz_zHHBg53RxwKIRCDSEn0lHPfCBwDvphRbjnvX0Th-99GHh-cs6yEHpU
  VAPID_PRIVATE_KEY = gTk_kUUDG6M8pSPd7T_0forHklEWs4GzkgVxavyVPdw
  VAPID_SUBJECT     = mailto:hello@chaptera.in
  ```

- [ ] **Verify `pg_net` trigger is active in Supabase**
  The trigger `trg_push_on_agent_message` should fire on `doubt_messages` INSERT where `sender = 'agent'` and call the `send-push-notification` edge function via `pg_net.http_post`. Confirm it exists by running in Supabase SQL editor:
  ```sql
  SELECT trigger_name, event_manipulation, action_statement
  FROM information_schema.triggers
  WHERE trigger_name = 'trg_push_on_agent_message';
  ```

- [ ] **Confirm `doubt_conversations`, `doubt_messages`, `push_subscriptions` tables exist** in production Supabase project (they were created manually, not via migration files)

- [ ] **Confirm Realtime is enabled** on `doubt_conversations` and `doubt_messages` in Supabase Dashboard → Database → Replication

### 🟡 Features to build

- [ ] **Advance/balance payer PWA flow**
  Users who have paid should also be nudged to install the PWA (second target group). The install prompt + live chat channel needs to be wired into the post-payment success screen. `PwaInstallCard` component already exists in `App.tsx` (used on PayU success screen) — it has its own `beforeinstallprompt` listener and renders iOS/Android instructions. Needs to be reviewed and connected to the live chat conversation flow.

- [ ] **Conversation continuity across devices**
  Currently `liveConversationId` is only in `localStorage` — if the user reinstalls the PWA or clears storage, they lose their conversation history. Could be improved by looking up conversations by phone number on PWA open.

- [ ] **Unread message count badge**
  Show a notification badge on the PWA icon (via `navigator.setAppBadge()`) when there are unread agent replies.

- [ ] **Push notification for advance-paid users**
  Once the advance-paid PWA flow is built, they'll need their own conversation + push subscription path. The same `push_subscriptions` table and edge function can be reused.

### 🟢 Nice to have / polish

- [ ] **Commit DB migrations**
  `doubt_conversations`, `doubt_messages`, `push_subscriptions`, and the `pg_net` trigger were created directly in Supabase dashboard. They should be added as `.sql` files in `supabase/migrations/` so they're reproducible.

- [ ] **iOS: Combine IG browser nudge + PWA install into one flow**
  Currently iOS IG users see two separate prompts (exit IG → then later install sheet). Could be one unified card showing the full 3-step journey.

- [ ] **Test push on iOS**
  Web Push on iOS requires iOS 16.4+ and the site must be installed as a PWA. Notification permission prompt behaviour differs from Android — worth testing end-to-end.

---

## File Map

| file | what it does |
|---|---|
| `src/App.tsx` | `InAppBrowserNudge`, `InviteFlow` (doubt chat + install sheet), `LiveChatScreen`, `PwaInstallCard`, root `App()` PWA auto-trigger |
| `src/AppFlow.tsx` | Booking flow doubt chat + install sheet (`doubtSheetView`), `submitDoubtAsPwaChat` |
| `src/AdminPanel.tsx` | Chats tab — agents read and reply to live conversations |
| `public/sw.js` | Service worker — push event, notificationclick, fetch passthrough |
| `public/manifest.json` | PWA manifest |
| `index.html` | Early `beforeinstallprompt` capture on `window.__deferredInstallPrompt` |
| `supabase/functions/send-push-notification/index.ts` | Deno edge function — VAPID JWT + AES-GCM encryption + Web Push delivery |
