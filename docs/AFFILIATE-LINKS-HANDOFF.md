# Creator Affiliate Links — Build & Deploy Handoff

> Complete reference for the **creator affiliate-link** feature + the **edge-function
> deploy** shipped alongside it on **2026-07-04**.
> Audience: the founder (no-code) + any future dev picking this up cold.
> Line numbers drift — always confirm identifiers with `grep`.
> Companions: `OPEN-EVENTS-HANDOFF.md`, `multi-marketer.md`, `CLAUDE.md`, auto-memory
> `affiliate-links-design.md`.

Shipped in commit **`fe27355`** ("Ship open-event flow + creator affiliate links"),
pushed to `main`. DB migrations + 3 edge functions are **live on prod**
(`txcmismkdttgsyhbnexf`).

---

## 0. TL;DR — what exists now

- Instagram creators get a link **`chaptera.in/@<handle>`**. Anyone who books through it
  and **pays in full** earns the creator **8% of the ticket price**.
- Commission is **gated per event** by a toggle (`events.affiliate_enabled`, default OFF).
  Nothing pays until you switch an event on.
- Commission **stacks** with the existing call-marketer commission (both can be paid on
  the same sale) and is **subtracted from the founder's monthly-profit number**.
- Admins manage creators in a new **Creators** tab; creators see their own clicks /
  bookings / earnings + a transparent leaderboard at **`chaptera.in/creator`**.
- Attribution is **session-scoped** (no stale credit) and **last-click wins**.

**Status: built, deployed, but DORMANT** — no event has commissions enabled and there are
no live creators except one test row (`@krutesh`). One **required** config step remains
before the creator dashboard works in production (Supabase Auth redirect URLs — see §9).

---

## 1. The link & attribution model

### 1.1 Link format
`chaptera.in/@<handle>` where `<handle>` matches `^[a-z0-9._]{1,40}$` (lowercase letters,
digits, dot, underscore). Chosen so creators can use their real Instagram handle.

Two redirect layers turn `/@handle` into `/lifestyle?ref=handle`:
- **Server (prod):** `vercel.json` redirect `"/@:handle" → "/lifestyle?ref=:handle"`.
- **Client (local dev + fallback):** `src/App.tsx` `routePath` initializer detects a
  `/@…` path, rewrites the URL to `/lifestyle?ref=<handle>`, and returns `/lifestyle`.

Links **always** land on `/lifestyle` — never a specific event (a deliberate product
decision).

### 1.2 Session-scoped capture (the core rule)
`src/affiliate.ts` owns capture. On every app load, `captureAffiliateRef()`:
1. Reads `?ref=` (or the `/@handle` path), normalizes it (`normalizeHandle`).
2. Stores it in **`sessionStorage`** under key `ca_affiliate_ref`.
3. Logs a click via the `record_affiliate_click` RPC — **deduped**: only when the active
   handle changes this session (`prev !== handle`), so in-session navigation doesn't
   re-count.

**Why sessionStorage (not localStorage):** the ref lives only for the current browsing
session. There is deliberately **NO cross-session persistence**. If a visitor returns days
later without a ref in the URL, **no creator is credited** — it's treated as the founder's
own/official link. This is the founder's explicit rule ("use the link they were on at the
exact moment of payment; no ref = my own link").

### 1.3 When attribution is stamped (last-click wins)
- **Invite-only events** — stamped at **application submit**
  (`src/AppFlow.tsx`, the `ApplicationForm` insert). The row carries `affiliate_code =
  getAffiliateRef()`. You can't apply to the same event twice with one phone, so the
  **first application per event wins** for that event — but it only pays if that
  application later reaches `fully_paid`.
- **Open events** (`booking_url='payu-hosted'`) — stamped at the **details-form step**
  before checkout (`handleProceedToPhonePe`, gated `if (isPayUFlow)`). Because the open
  upsert is insert-or-ignore, a returning (abandoned) row would keep its old ref, so we
  ALSO call the `attribute_open_application` RPC to **overwrite the latest session ref**
  onto the unpaid row — including overwriting to `NULL` when there's no ref. That
  implements "the creator whose link is active **at payment time** wins" for open events.

**Consequences (all intended):** a repeat buyer via the same creator's link credits that
creator again; one person booking two different events credits the creator on both; a
lead who applied via creator A but never paid, then paid a *different* event via creator B,
credits **only B**.

### 1.4 Known attribution limitation
Attribution lives in the visitor's browser between click and action. Instagram opens links
in its in-app browser; if someone taps a reel link, closes it, and later opens Safari and
types the URL, the ref is gone (different browser/session) → no credit. This is inherent
to every link-based affiliate system. Same-session conversions (most impulse bookings)
track fine.

---

## 2. Commission model

| Rule | Value |
|---|---|
| Rate | **8%** of the **configured full price** (city-aware) — `events.affiliate_commission_pct`, default 8, overridable per event |
| Basis | `event_net_price(slug, selected_city, 'full')` — the NET price the founder set, **not** the gross PayU charge (which adds the gateway fee) |
| When it accrues | Only at **`fully_paid`** (split events = advance + balance both done; single-payment = the one full payment) |
| Per-event gate | `events.affiliate_enabled` must be TRUE **at the moment of full-payment**. Off = no commission. No retroactive payout if flipped on later |
| Stacking | **Both** marketer (`marketer_sales`) and affiliate (`affiliate_sales`) can be paid on the same ticket — independent triggers/columns |
| Refunds | Not modelled — the business doesn't refund advances/balances. No clawback logic |
| Snapshot | `affiliate_sales.amount` is frozen at accrual time; later changing the % or price doesn't rewrite past sales |

---

## 3. Database schema

All applied to prod via migration files in `supabase/migrations/`:

- `20260704_affiliates_schema.sql`
- `20260704_affiliates_functions_and_triggers.sql`
- `20260704_affiliates_rls.sql`
- `20260704_performance_summary_affiliate_aware.sql`

### 3.1 `affiliates` — creator roster
| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `handle` | text UNIQUE | the `@handle`; CHECK `^[a-z0-9._]{1,40}$` (lowercase) |
| `name` | text | shown in admin + on the creator dashboard |
| `email` | text UNIQUE | their Google login email — **must match exactly** or the dashboard won't recognize them |
| `active` | boolean default true | flip false to pause a creator |
| `created_at` | timestamptz | |

### 3.2 `affiliate_sales` — append-only commission ledger
| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `application_id` | uuid **UNIQUE** → applications ON DELETE CASCADE | one sale per application (idempotency) |
| `affiliate_id` | uuid → affiliates ON DELETE RESTRICT | who earned it |
| `amount` | numeric(10,2) | snapshot of 8% × full price at accrual |
| `accrued_at` | timestamptz default now() | |
| `paid_out_at` | timestamptz NULL | stamped when the founder settles the payout |

Indexes: `idx_affiliate_sales_affiliate`, plus a partial `idx_affiliate_sales_unpaid`
(`WHERE paid_out_at IS NULL`).

### 3.3 `affiliate_clicks` — funnel/click log
| col | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `affiliate_id` | uuid → affiliates ON DELETE CASCADE | |
| `session_id` | text | the browser session id (`ca_session_id`); powers unique-visitor count |
| `created_at` | timestamptz default now() | |

### 3.4 Columns added to existing tables
- `applications.affiliate_code text` — the raw `?ref=` handle the client sent (kept even
  when it doesn't resolve, for diagnostics).
- `applications.affiliate_id uuid → affiliates ON DELETE SET NULL` — the resolved creator.
  `NULL` = founder's own link.
- `events.affiliate_enabled boolean NOT NULL DEFAULT false` — the per-event toggle.
- `events.affiliate_commission_pct numeric(5,2) NOT NULL DEFAULT 8` — the rate (overridable).

---

## 4. Functions, triggers & RPCs

All `SECURITY DEFINER, SET search_path = public`. Mirrors the marketer system.

### 4.1 Identity / resolution helpers
- **`current_affiliate_id()`** → JWT-email → `affiliates.id` (active only), else NULL.
  Basis of all creator-scoped RLS. Mirrors `current_marketer_id()`. **`is_admin()` stays
  false for creators** (they're not in `admin_users`), so RLS-locked customer tables stay
  invisible.
- **`resolve_affiliate_id(p_code)`** → strips a leading `@`, lowercases, matches
  `affiliates.handle` (active), else NULL. Used by the trigger + RPCs so the public site
  never needs SELECT on `affiliates`.

### 4.2 Attribution trigger (BEFORE INSERT on applications)
`trg_assign_application_affiliate` → `assign_application_affiliate()`: if `affiliate_id`
is null and `affiliate_code` is non-empty, resolves the code → `affiliate_id`. Independent
of the marketer-assignment trigger (different column), so both fire on insert.

### 4.3 Accrual trigger (AFTER UPDATE OF status on applications)
`trg_accrue_affiliate_sale` → `accrue_affiliate_sale()`: when `status` flips to
`fully_paid` (from anything else) AND `affiliate_id` is set AND the event's
`affiliate_enabled` is true, inserts an `affiliate_sales` row with
`round(pct/100 * event_net_price(slug, selected_city, 'full'), 2)`. Idempotent via
`ON CONFLICT (application_id) DO NOTHING`. Fires regardless of who flipped status (PayU
callback/webhook or admin). This is why **no edge-function changes were needed** for
accrual — it rides the existing status flip.

### 4.4 Public RPCs (anon-safe; `GRANT EXECUTE … TO anon, authenticated`)
- **`record_affiliate_click(p_code, p_session_id)`** — logs a click if the handle resolves
  to an active creator; silent no-op otherwise.
- **`attribute_open_application(p_event_slug, p_phone, p_code)`** — open-event
  re-attribution. Normalizes phone to 10 digits; sets `affiliate_code` + resolved
  `affiliate_id` on the matching application **only where `status NOT IN
  ('advance_paid','fully_paid')`** (guarded — never touches a paid row). Anon can't UPDATE
  `applications` directly, so this SECURITY DEFINER RPC does it.

### 4.5 Creator dashboard RPCs (`GRANT EXECUTE … TO authenticated`)
- **`creator_stats()`** — the calling creator's own funnel: `clicks_total`,
  `clicks_unique` (distinct session), `apps_total` (attributed applications),
  `tickets_paid`, `earned_total`, `earned_unpaid`. Scoped to `current_affiliate_id()`.
  Needed because `applications` is RLS-locked — a creator can't count their leads directly.
- **`affiliate_leaderboard()`** — ALL active creators: `handle`, `name`, `tickets`,
  `earned`, `is_me`. LEFT JOINs sales (creators with 0 earnings still appear), ordered by
  `earned DESC`. Only returns rows to a logged-in creator or admin. Exposes handle +
  aggregates only — never customer data.

### 4.6 Performance summary (money math)
`20260704_performance_summary_affiliate_aware.sql` rewrote `get_performance_summary()` so
the `ev_committed` CTE subtracts affiliate commission — `pct% × full price` — for every
`advance_paid`/`fully_paid` application whose event is `affiliate_enabled` and that has an
`affiliate_id`. This flows into `this_month_profit`, `committed_total`, and the 6-month
`forecast`. Matches how the flat ₹50 marketer commission is already subtracted (optimistic:
counted for `advance_paid` too, as committed income). **No-op until an event is enabled.**

---

## 5. RLS summary

| Table | Admin (`is_admin()`) | Creator (`current_affiliate_id()`) | Public/anon |
|---|---|---|---|
| `affiliates` | full | SELECT own row only | none (uses resolve RPC) |
| `affiliate_sales` | full | SELECT own sales | none |
| `affiliate_clicks` | full | SELECT own clicks | writes via RPC only |
| `applications` (affiliate cols) | unchanged (`is_admin_only()`) | unchanged | INSERT carries `affiliate_code`; updated via `attribute_open_application` RPC |

Creators are authenticated Google users **not** in `admin_users`, so `is_admin()` is false
for them and every RLS-locked customer table (applications, invited_numbers, phones) stays
invisible. Cross-creator data (the leaderboard) is exposed only through the SECURITY
DEFINER RPC, never a table grant.

---

## 6. Frontend files & wiring

| File | What changed |
|---|---|
| `src/affiliate.ts` | **NEW.** `normalizeHandle()`, `captureAffiliateRef()` (sessionStorage capture + `/@handle` rewrite + deduped click log), `getAffiliateRef()`. sessionStorage key `ca_affiliate_ref`; reuses `ca_session_id` for the click's session id. |
| `src/App.tsx` | imports `captureAffiliateRef`, `normalizeHandle`, `CreatorDashboard`; `routePath` initializer handles `/@handle`; mount effect calls `captureAffiliateRef()`; `isCreatorPage = routePath === '/creator'` → `return <CreatorDashboard/>`; `/creator` excluded from homepage render + `page_view`. |
| `src/AppFlow.tsx` | imports `getAffiliateRef`; invite `ApplicationForm` insert adds `affiliate_code`; open-flow upsert adds `affiliate_code` and then calls the `attribute_open_application` RPC. |
| `src/CreatorDashboard.tsx` | **NEW.** Self-contained `/creator` page (see §7). |
| `src/AdminPanel.tsx` | Creators tab + per-event toggle + Performance subtraction (see §8). |
| `vercel.json` | added `"/@:handle" → "/lifestyle?ref=:handle"` redirect. |

---

## 7. Creator dashboard (`/creator`) — `src/CreatorDashboard.tsx`

Self-contained component (own Google auth, mirrors the admin login):
1. `supabase.auth.getSession()` / `onAuthStateChange` resolve the email.
2. `supabase.from('affiliates').select(...).maybeSingle()` — self-select RLS returns only
   the creator's own row. If a row comes back → they're a creator.
3. Loads `creator_stats()` + `affiliate_leaderboard()`.

**Screens:** not-logged-in ("Continue with Google") · logged-in-but-not-a-creator ("Not a
creator account" + sign out) · the dashboard (their `@handle` link with copy button,
total earned + unpaid, a 3-tile funnel of clicks/bookings/paid-tickets, and the
transparent leaderboard with real handles + earnings, their row highlighted).

**Role model:** there is no "creator" row in `admin_users`. The creator role is defined by
membership in `affiliates`. Same Google login as the team; the app routes by table
membership. This keeps creators walled off from all customer data at the database level.

---

## 8. Admin panel — `src/AdminPanel.tsx`

- **Creators tab** (`tab === 'affiliates'`, label "Creators", admin only). State:
  `affiliates`, `affiliateStats` (`AffiliateStat` type), add-form state.
  - `loadAffiliatesData()` — pulls roster + builds per-creator rollups from
    `affiliate_clicks`, attributed `applications`, and `affiliate_sales`.
  - `saveNewAffiliate()` — normalizes handle, inserts (`23505` → "handle/email exists").
  - `toggleAffiliateActive()` — pause/resume.
  - `markAffiliatePaid()` — settles a creator's outstanding commission by stamping
    `paid_out_at = now()` on all their unpaid `affiliate_sales` (bulk, per creator; history
    preserved). Confirmed with a `window.confirm`.
  - Table columns: Creator (name + `/@handle` + copy-link), Clicks, Bookings (+conv%),
    Paid tickets, Earned, Unpaid, Actions (Mark paid / Pause).
- **Per-event toggle** — in the event editor (near Payment Mode). A switch bound to
  `trip.affiliate_enabled` (via `set('affiliate_enabled', …)`) + a %-input for
  `affiliate_commission_pct` (default 8). Persists because `saveTrip` spreads all trip
  fields and the loader uses `select('*')`. `Trip` type gained
  `affiliate_enabled?`/`affiliate_commission_pct?`.
- **Performance tab** — already reads `get_performance_summary()`, so affiliate commissions
  now flow into the profit numbers automatically (§4.6).

---

## 9. What is NOT done / required next steps

### 9.1 REQUIRED before creator dashboard works in prod
**Supabase Auth → URL Configuration → Redirect URLs:** add
`https://chaptera.in/**` and `http://localhost:3000/**`. Without this, `signInWithOAuth`
falls back to the Site URL and creator logins bounce to `/lifestyle` (observed in testing).
Can't be done via the code or MCP — it's a dashboard setting.

### 9.2 Operational / not automated
- **Onboarding is manual** — add creators in the Creators tab (handle + name + Google
  email). No self-serve "apply to be a creator" flow.
- **No event is affiliate-enabled yet** — the whole feature is dormant until you flip a
  toggle. Turn it on per event in the editor.
- **Payout granularity** — "Mark paid" settles a creator's *entire* outstanding balance at
  once; there's no per-ticket payout. Fine for monthly settlement.
- **Test creator exists:** `@krutesh` → `krutesh08@gmail.com` (active). Remove or keep for
  testing. (Originally created with a typo'd email `krueate@gmail.com`, since corrected.)

### 9.3 Nice-to-have / future
- Leaderboard shows ALL active creators including 0-earning ones — fine at small scale;
  may want a cap/pagination at hundreds.
- No email/WhatsApp notification to a creator when they earn — dashboard is pull-only.
- No date-range filter on the creator funnel (all-time only).
- Commission rate is global-ish (per-event override exists, not per-creator) — matches the
  current "same rate for everyone" decision.

---

## 10. Edge functions deployed 2026-07-04

Deployed via the Supabase CLI (`supabase functions deploy … --no-verify-jwt`), each
verified by fetching the deployed source back and confirming `verify_jwt=false` + the
changed code is live. **All three MUST stay `verify_jwt=false`** — PayU and pg_cron call
them without a JWT; enabling JWT would 401 every payment callback and halt payments.

| Function | Version | verify_jwt | What changed |
|---|---|---|---|
| `payu-callback` | 30 | false | open events → `/plans` redirect (pending/success/failure); `recovered_at` stamp on first payment of a `cart_abandoned` lead; `AISENSY_CAMPAIGN_FULL = 'single_payment_sucessful'` (was `paid_full`); meeting-spot date located by **label** (`pickMeetingSpotStep`) not fixed index `[3]` |
| `payu-webhook` | 25 | false | brought into lockstep with the callback: same `single_payment_sucessful`, same `pickMeetingSpotStep`, same `recovered_at` stamp |
| `cart-abandonment` | 16 | false | open events (1h window) get the `cart_abandon_open` template (name, event, date-they'd-miss); invite events (2h) unchanged; `formatEventDate` helper; flag update widened to `status IN ('invited','pending')` |

### 10.1 Why the webhook mattered (the race)
PayU notifies twice per payment — the browser redirect (`payu-callback`) and a
server-to-server call (`payu-webhook`). They race via `claimSendFlag` (an atomic
false→true UPDATE); the winner sends. If only the callback had the new campaign name, the
webhook winning the race would fire the dead `paid_full` and the WhatsApp would silently
fail ~half the time. Both now use `single_payment_sucessful`, so it's deterministic.

### 10.2 The single-payment bug this fixed
On the previously-deployed code, a successful single-payment (`payment_type='full'`)
correctly flipped `status='fully_paid'` but the confirmation WhatsApp **never sent**,
because `paid_full` was not a working AiSensy campaign (`aisensy_full_paid_sent` rolled
back to false). Confirmed on a ₹1.02 **test** payment (no real customer affected). Fixed by
the `single_payment_sucessful` campaign (which the founder verified exists in AiSensy).

### 10.3 AiSensy campaigns these depend on (must exist, exact spelling)
- `single_payment_sucessful` (note: "sucessful") — {{1}} amount, {{2}} meeting-spot date.
- `cart_abandon_open` — {{1}} name, {{2}} event name, {{3}} event date.
- Unchanged: `advance_paid+balance`, `fullpaid`, `payment_failed`, `cart_abandonment`.

---

## 11. Verification done

- **DB simulations (on prod, test rows cleaned):** click logging (3 clicks / 2 unique);
  invite attribution via `affiliate_code` trigger; open re-attribution from NULL → creator
  via RPC; accrual = 2 × 8% of ₹6000 = ₹960; idempotency across a double status-flip;
  toggle-OFF event pays ₹0; payout marking zeroes unpaid while keeping earned.
- **Browser:** `/@ZZZ.Test_Handle` → `/lifestyle?ref=zzz.test_handle`; ref persists across
  in-session navigation; fresh session → no ref (no stale credit); `/creator` renders the
  login screen; no console errors.
- **`npx tsc --noEmit` clean; `npm run build` succeeds.**
- **Edge functions:** deployed source re-fetched and confirmed byte-correct + `verify_jwt=false`.
- **`get_performance_summary()` unchanged** (₹8,515) since no live affiliate event exists.

---

## 12. File / object reference

| Artifact | Purpose |
|---|---|
| `supabase/migrations/20260704_affiliates_schema.sql` | tables + columns |
| `supabase/migrations/20260704_affiliates_functions_and_triggers.sql` | helpers, triggers, RPCs |
| `supabase/migrations/20260704_affiliates_rls.sql` | RLS policies |
| `supabase/migrations/20260704_performance_summary_affiliate_aware.sql` | profit nets out affiliate commission |
| `src/affiliate.ts` | client capture (sessionStorage, click log, `/@` rewrite) |
| `src/App.tsx` | routing (`/@handle`, `/creator`), mount capture |
| `src/AppFlow.tsx` | invite + open attribution stamping |
| `src/CreatorDashboard.tsx` | `/creator` dashboard |
| `src/AdminPanel.tsx` | Creators tab, per-event toggle, payouts |
| `vercel.json` | `/@:handle` redirect |
| `supabase/functions/payu-callback` | v30 — routing, recovered_at, campaign/label fixes |
| `supabase/functions/payu-webhook` | v25 — lockstep with callback |
| `supabase/functions/cart-abandonment` | v16 — open-event nudge |

---

## 13. How to go fully live (operator checklist)

1. **Supabase Auth redirect URLs** — add `https://chaptera.in/**` + `http://localhost:3000/**` (§9.1).
2. **Add creators** in the Creators tab (handle + name + their Google email).
3. **Enable commissions** on the events you want, in the event editor (toggle + %).
4. Share each creator's `chaptera.in/@handle` link; they track results at `chaptera.in/creator`.
5. **Monthly:** review the Creators tab, "Mark paid" per creator after settling, and read
   net profit (already commission-adjusted) in the Performance tab.
