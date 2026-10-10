# Analytics additions — invite time-to-pay & creator ticket share

**Status: proposal only — nothing here is built yet.** Written 2026-07-07 after a
full audit of the analytics stack. A later Claude session should implement this
file top-to-bottom; every design decision is already made, and the "Build steps"
sections are ordered instructions.

Context for the implementing session:
- Analytics tab lives in `src/AdminPanel.tsx` (~line 4117, `tab === 'analytics'`).
  All figures come from one server-side RPC `get_analytics_summary(p_since)` loaded
  by `loadAnalytics()` (~line 1575) with a 24h/week/month/90d window picker
  (`analyticsWindow` state).
- Creators admin UI lives inside the Performance/marketers tab (`loadAffiliatesData()`
  ~line 826 builds per-creator rollups client-side from `affiliates`,
  `affiliate_sales`, `affiliate_clicks`, and `applications.affiliate_id`).
- The DB is PRODUCTION. New SQL ships as a versioned migration via
  `mcp apply_migration` (never raw DDL through execute_sql), and edge functions
  are deployed by the owner only.

---

## Feature A — average time from invite → advance paid (invite-only events)

**What the owner wants:** for `booking_url = 'native-application'` events, how long
does an invited person take to pay their advance?

### What exists today (verified against prod on 2026-07-07)

- `applications.invite_sent_at` (timestamptz) is stamped when the invite goes out.
  Coverage: 187 of 192 invited-or-beyond applications have it; earliest value
  2026-06-06 (nothing before that — the column is newer than some data).
- There is **no "paid at" timestamp on applications**. Status flips to
  `advance_paid` but nothing records *when*.
- The pay moment is recoverable from `payu_payments` (`status='success'`,
  matched by `event_slug` + last-10-digit phone). A dry run of the exact metric:
  **51 measurable conversions, median 3.1 hours, average 44.2 hours** — the
  average is dragged by a handful of multi-day payers, so the UI must lead with
  the **median** and show avg as secondary.

### Design decisions (already made)

1. **Add `applications.advance_paid_at timestamptz`** and stamp it with a DB
   trigger on status change, NOT in the edge functions. Reason: status is flipped
   in at least three places (`payu-callback`, `payu-webhook`, the
   `verify-pending-payments` cron) plus occasional manual admin flips — a trigger
   catches all of them and needs no edge-function deploy.
2. **Backfill** existing rows from `payu_payments` (first successful payment per
   event+phone). Rows with no matching payment stay NULL and are simply excluded.
3. Compute the stat **server-side** inside `get_analytics_summary` (new
   `invite_time_to_pay` key) so the Analytics tab gets it for free with the
   existing window picker. Window filter applies to `invite_sent_at` (cohort =
   people *invited* in the window).
4. Show **median + average + n**, overall and per invite-only event. Exclude
   pairs where `advance_paid_at <= invite_sent_at` (paid before/at invite —
   data noise).
5. `payment_mode='full'` events skip `advance_paid` and go straight to
   `fully_paid` — the trigger below treats the first arrival in either status as
   "paid the first payment", which is the number the owner actually wants.

### Build steps

**Step 1 — migration** (one versioned migration, name it
`add_advance_paid_at_and_time_to_pay`):

```sql
alter table public.applications add column if not exists advance_paid_at timestamptz;

create or replace function public.stamp_advance_paid_at()
returns trigger language plpgsql as $$
begin
  if new.advance_paid_at is null
     and lower(new.status) in ('advance_paid','fully_paid')
     and lower(coalesce(old.status,'')) not in ('advance_paid','fully_paid') then
    new.advance_paid_at := now();
  end if;
  return new;
end $$;

drop trigger if exists trg_stamp_advance_paid_at on public.applications;
create trigger trg_stamp_advance_paid_at
  before update on public.applications
  for each row execute function public.stamp_advance_paid_at();

-- Backfill from first successful PayU payment (event + last-10 phone match).
update public.applications a
set advance_paid_at = sub.first_paid
from (
  select a2.id,
         (select min(p.created_at) from public.payu_payments p
           where p.event_slug = a2.event_slug
             and p.status = 'success'
             and right(regexp_replace(p.phone,'\D','','g'),10)
               = right(regexp_replace(a2.phone,'\D','','g'),10)) as first_paid
  from public.applications a2
  where lower(a2.status) in ('advance_paid','fully_paid')
    and a2.advance_paid_at is null
) sub
where a.id = sub.id and sub.first_paid is not null;
```

Safety notes for the implementing session: the backfill only *fills a new NULL
column* on paid rows (no status/PII mutation, so the golden-rule guard doesn't
apply, but still run the inner SELECT alone first to eyeball row counts, and
verify after with a `select count(*) ... where advance_paid_at is not null`).

**Step 2 — extend `get_analytics_summary`** (same migration or a second one;
`create or replace` the function keeping everything else identical) — add a CTE
and one key to the final `jsonb_build_object`:

```sql
invite_ttp as (
  select e.id::text as event_id, e.title,
         count(*) as n,
         percentile_cont(0.5) within group
           (order by extract(epoch from (a.advance_paid_at - a.invite_sent_at))) as median_s,
         avg(extract(epoch from (a.advance_paid_at - a.invite_sent_at))) as avg_s
  from public.applications a
  join public.events e on e.slug = a.event_slug
  where e.booking_url = 'native-application'
    and a.invite_sent_at >= p_since
    and a.advance_paid_at > a.invite_sent_at
  group by e.id, e.title
)
-- in jsonb_build_object add:
'invite_time_to_pay', (
  select coalesce(jsonb_agg(jsonb_build_object(
    'event_id', event_id, 'title', title, 'n', n,
    'median_hours', round((median_s/3600)::numeric,1),
    'avg_hours',    round((avg_s/3600)::numeric,1))), '[]'::jsonb)
  from invite_ttp
)
```

**Step 3 — UI** in `src/AdminPanel.tsx` Analytics tab: inside the invite-funnel
section add a "⏱ Invite → advance paid" card. Overall line first (recompute
overall from the per-event rows weighted by `n`), then one row per event:
`title — median Xh · avg Yh · n tickets`. Format hours ≥48 as days ("2.1 d").
If `n` is 0 for the window, show "No paid invites in this window."

**Step 4 — verify**: `npx tsc --noEmit`; then run the RPC via SQL
(`select get_analytics_summary(now() - interval '90 days') -> 'invite_time_to_pay';`)
and cross-check one event by hand. Admin UI is behind login — verify via tsc +
SQL, not browser preview.

---

## Feature B — % of tickets contributed by creators (global)

**What the owner wants:** one global number — of all paid tickets, what share came
through any creator link vs direct (own/in-house marketing). Cumulative across
all creators and all events.

### What exists today (verified against prod on 2026-07-07)

- `applications.affiliate_id` is stamped at booking time (invite submit + open
  details-form) since **2026-07-04** — attribution exists only from that date, so
  an "all-time" share would understate creators. The share must be computed
  **within the selected time window** (and optionally shown "since launch").
- Current snapshot since launch: **10 of 63 paid tickets (~16%) via creators.**
- The Creators section (Performance tab) shows per-creator rollups but no
  creator-vs-direct split.

### Design decisions (already made)

1. "Ticket" = application with status `advance_paid` or `fully_paid` (an advance
   is a sold ticket in this business; `fully_paid`-only would undercount split
   events mid-cycle).
2. Windowed by `applications.created_at` (when the booking was made — matches
   how attribution is stamped).
3. Computed **server-side in the same `get_analytics_summary` RPC** (new
   `creator_share` key). The client-side `loadAffiliatesData()` can't do this:
   its `applications` query only selects attributed rows, and anon/authenticated
   clients can't count the direct ones anyway (RLS) — a SECURITY DEFINER RPC is
   the right place.
4. Display in **two places**: a hero-style card at the top of the Creators
   section ("Creators drove N of M tickets — X%"), and a one-liner in the
   Analytics tab overview. Both from the same RPC key.

### Build steps

**Step 1 — extend `get_analytics_summary`** (can ride in the same migration as
Feature A): add a CTE + key:

```sql
creator_share as (
  select count(*) filter (where lower(status) in ('advance_paid','fully_paid')) as paid_total,
         count(*) filter (where lower(status) in ('advance_paid','fully_paid')
                            and affiliate_id is not null) as paid_creator
  from public.applications
  where created_at >= p_since
)
-- in jsonb_build_object add:
'creator_share', (
  select jsonb_build_object('paid_total', paid_total, 'paid_creator', paid_creator,
    'pct', case when paid_total > 0
           then round(100.0 * paid_creator / paid_total, 1) else 0 end)
  from creator_share
)
```

**Step 2 — UI**:
- Creators section (Performance tab, near `loadAffiliatesData`'s render): card
  reading "Creators drove **{paid_creator} of {paid_total}** paid tickets
  (**{pct}%**) — rest came direct". Easiest wiring: have the Creators section
  call the RPC with `p_since = '2026-07-04'` (attribution launch) or reuse the
  analytics summary if already loaded; a tiny dedicated RPC is NOT needed.
- Analytics tab overview: one stat chip "Creator share {pct}%" using the
  already-loaded summary for the selected window.
- Add a caption "attribution live since 4 Jul 2026" wherever an all-time-ish
  window (90d) is shown, so early-July direct tickets aren't misread.

**Step 3 — verify**: tsc + run the RPC in SQL and cross-check against
`select count(*) filter (where affiliate_id is not null), count(*) from applications where lower(status) in ('advance_paid','fully_paid');`

---

## Related housekeeping the audit surfaced (not part of the two features)

1. **Fixed already (2026-07-07, in working tree):** affiliate clicks logged with
   NULL `session_id` on fresh visits because `captureAffiliateRef()` ran before
   the session id existed — `src/affiliate.ts` now calls `getSessionId()` (which
   creates it). 4 of the first 12 prod clicks were affected; they stay NULL
   (each counts as its own unique click via the `coalesce(session_id, id)` in
   `creator_stats_since` — acceptable, tiny numbers).
2. **Fixed already (2026-07-07, in working tree): Instagram double-count.** The
   IG/FB in-app browser is fully blocked by the `InAppBrowserNudge` wall and the
   visitor re-opens the same URL externally — so every IG visitor landed twice
   in analytics. Now `isInAppBrowserBlocked()` (exported from `src/supabase.ts`,
   UA regex `/Instagram|FBAN|FBAV/i`) suppresses, inside the blocked browser:
   `trackEvent` inserts (visitors/funnel), `record_affiliate_click` (creator
   clicks), and the GA pageview (`index.html`). The nudge itself now uses the
   same helper so detection can't drift. Historical data before this fix still
   contains the duplicates (visitor counts and creator clicks were inflated for
   IG traffic; not retroactively separable).
3. **`flow_analytics` is purged at 90 days** (`purge_flow_analytics` cron, daily
   03:17) and there are still **no daily snapshots** — the
   `experiments-and-ab-testing-proposal.md` snapshot work must ship before late
   September 2026 or the first weeks of funnel history are gone. Feature A/B
   don't depend on `flow_analytics` (they read `applications`), so they are NOT
   affected by the purge.
4. **Local `npm run dev` writes real `page_view`s into prod `flow_analytics`**,
   and React StrictMode double-fires the page_view effect in dev — a single
   local page load was observed writing 4 page_view rows to prod. Optional one-liner if the
   owner wants it: early-return in `trackEvent` when `import.meta.env.DEV`
   (tradeoff: analytics can then never be smoke-tested from a local preview).
