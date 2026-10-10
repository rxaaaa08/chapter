# Admin Panel — Full Reference

## Overview

The admin panel lives at `/admin` on any deployment of the app:
- **Local:** `http://localhost:5175/admin`
- **Production:** `https://chaptera.in/admin`

It is a React component (`src/AdminPanel.tsx`) rendered directly when `window.location.pathname === '/admin'`.

---

## Authentication

### How it works
- Uses **Google OAuth via Supabase Auth** — no passwords anywhere in the code.
- When a user clicks "Continue with Google", `supabase.auth.signInWithOAuth({ provider: 'google' })` is called.
- After Google authentication, Supabase redirects back to the admin panel URL.
- On load, the app calls `supabase.auth.getSession()` and `onAuthStateChange` to detect the session.
- The signed-in user's email is then looked up in the `admin_users` table in Supabase to determine their role.

### Access levels

| Role | What they can see |
|------|-------------------|
| `admin` | Full access — Plans, Flow, People, Analytics tabs |
| `ops` | People tab only (Call, Approval, Payments, Doubts sub-tabs) |
| Not in table | Access denied screen |

### The `admin_users` table (Supabase)
Stored in the `txcmismkdttgsyhbnexf` Supabase project.

```
email TEXT (primary key / unique)
role  TEXT — either 'admin' or 'ops'
```

RLS policy: any authenticated user can read all rows.

---

## Current Users

| Email | Role | Notes |
|-------|------|-------|
| krutesh08@gmail.com | admin | Full access |
| krueate@gmail.com | admin | Full access |
| rxaa08@gmail.com | admin | Full access |
| abitamilkrudan@gmail.com | ops | People tab only |
| sfcthinu@gmail.com | ops | People tab only |

---

## How to Add a New User

### Step 1 — Add them to `admin_users`
Go to **Supabase dashboard → SQL Editor** and run:

```sql
-- Full admin access
INSERT INTO admin_users (email, role) VALUES ('newperson@gmail.com', 'admin');

-- People tab only
INSERT INTO admin_users (email, role) VALUES ('newperson@gmail.com', 'ops');
```

### Step 2 — Nothing else needed
The new user just goes to `https://chaptera.in/admin`, clicks "Continue with Google", and signs in with the Gmail address you added. Supabase creates their auth account automatically on first sign-in.

> **Note:** You do NOT need to manually add them in Supabase → Authentication → Users. That happens automatically on first Google sign-in.

---

## How to Remove a User

Go to **Supabase dashboard → SQL Editor** and run:

```sql
DELETE FROM admin_users WHERE email = 'person@gmail.com';
```

Their next visit to `/admin` will show "Access Denied". Their Supabase auth account still exists but can't get past the role check.

---

## How to Change a User's Role

```sql
UPDATE admin_users SET role = 'ops' WHERE email = 'person@gmail.com';
-- or
UPDATE admin_users SET role = 'admin' WHERE email = 'person@gmail.com';
```

The change takes effect on their next sign-in (or page refresh if already signed in).

---

## Admin Panel Tabs

### Plans (admin only)
- View and edit all trips/events.
- Edit title, description, pricing, dates, pickup points, itinerary, FAQs, media, reviews, etc.
- Toggle `is_active` to show/hide events on the public site.

### Flow (admin only)
- Edit the chat bot messages users see during booking flow.
- Manage global announcements shown across the site.
- Configure "doubt CTA" label.

### People
Available to both `admin` and `ops` roles. Contains four sub-tabs:

| Sub-tab | What it shows |
|---------|--------------|
| **Call** | Applications with call status tracking (not called / called / no answer) |
| **Approval** | Applications waiting for manual approval. Shows "Why join" answers. Approve button promotes status to `invited`. |
| **Payments** | PayU payment records, advance/balance tracking, application statuses |
| **Doubts** | Doubt form submissions from users |

### Analytics (admin only)
- Page views, event selections, booking funnel metrics from `flow_analytics` table.

---

## Application Statuses

| Status | Meaning |
|--------|---------|
| `applied` | Submitted application, not yet reviewed |
| `invited` | Approved by admin (manually via Approve button) |
| `advance_paid` | Paid the advance amount via PayU |
| `fully_paid` | Paid the full/balance amount via PayU |

---

## Supabase Project Details

| Field | Value |
|-------|-------|
| Project name | rxaaaa08's Project |
| Project ID | `txcmismkdttgsyhbnexf` |
| Region | ap-southeast-1 |
| Supabase URL | `https://txcmismkdttgsyhbnexf.supabase.co` |

---

## Key Technical Notes

- **OAuth redirect URLs** must be registered in Supabase → Authentication → URL Configuration → Redirect URLs. Currently registered:
  - `https://chaptera.in/*`
  - `http://localhost:5175/admin`
  - `http://localhost:5174/*` (legacy)

- **Vite dev server** is locked to port `5175` via `vite.config.ts` (`port: 5175, strictPort: true`).

- **The `redirectTo`** in `signInWithOAuth` uses `window.location.origin + window.location.pathname` (not `window.location.href`) to avoid stacking hash tokens in the URL on repeated sign-ins.

- **`plan_doubts` table** is queried separately from `applications` and joined in memory by `(phone, event_slug)`.

---

## Files

| File | Purpose |
|------|---------|
| `src/AdminPanel.tsx` | The entire admin panel UI and logic |
| `src/supabase.ts` | Supabase client (anon key, project URL) |
| `vite.config.ts` | Dev server config (port lock) |
