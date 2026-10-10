# Multi-Marketer System — Handoff & Reference

How call marketers are modelled, assigned leads, scoped in the admin panel, and
paid commission. Written 2026-06-18. Keep this in sync if you change any of the
migrations or RLS below.

---

## 1. What it does

chapter runs invite/booking events where leads (applications) are worked over
the phone by **call marketers**. Each marketer:

- logs into the admin panel as an **`ops`** user and sees **only their own
  assigned leads** in the People tab,
- owns a lead **end-to-end** — from the moment it's submitted (`pending`),
  through approval (`invited`), to payment,
- earns a flat **commission per ticket** (default **₹50**) when a lead they own
  reaches `fully_paid`.

Admins assign marketers to events; the system auto-distributes leads
round-robin and tracks commission in an append-only ledger.

---

## 2. Roles & auth model

There is **no separate "marketer" role** — marketers are `ops` users.

| Layer | Table | Meaning |
|-------|-------|---------|
| Auth gate | `admin_users (email, role)` | `role = 'ops'` → can log in, lands on People tab. `role = 'admin'` → full panel. |
| Business side-car | `call_marketers (email, …)` | An `ops` user whose email is **also** here is a *marketer* (commission + assignment). |

So a marketer needs **a row in both tables, same email**, matching their Google
login email exactly (store lowercase).

### Permission helpers (Postgres functions)

- **`is_admin()`** — `true` if the JWT email is in `admin_users` (ANY role,
  incl. ops). Pre-existing; used broadly.
- **`is_admin_only()`** — `is_admin() AND current_marketer_id() IS NULL AND
  current_manager_id() IS NULL` (third branch added 2026-07-18 by the manager
  role Phase 1 migration). True only for admins who are **neither** marketer
  **nor** manager. Used to keep both side-car roles from seeing everyone's
  leads via the broad `is_admin()`.
- **`current_marketer_id()`** — JWT-email → `call_marketers.id` (active only),
  else `NULL`. The basis of all marketer-scoped RLS.
- **`current_manager_id()`** — same pattern for the **manager** role
  (`managers` side-car, event-scoped via `event_managers`). See
  `manager-role-proposal.md` and
  `supabase/migrations/20260718_manager_role_phase1.sql`.

> ⚠️ **Offboarding gotcha (applies to marketers AND managers):** the
> `current_*_id()` helpers are active-only, so deactivating the side-car row
> while leaving the `admin_users` ops login in place turns that person into a
> **plain ops user — who passes `is_admin_only()` and sees ALL leads**.
> Off-boarding must always delete the `admin_users` row too.

---

## 3. Database schema

### `call_marketers` — marketer roster
| col | type | notes |
|-----|------|-------|
| `id` | uuid PK | |
| `email` | text UNIQUE | matches `admin_users.email` / JWT email |
| `name` | text | shown in admin UI |
| `commission_amount` | numeric(10,2) default **50** | ₹ per ticket |
| `active` | boolean default true | flip false to off-board |
| `created_at` | timestamptz | |

### `event_marketers` — which marketers cover which event
| col | type | notes |
|-----|------|-------|
| `event_slug` | text | PK part; matches `events.slug` |
| `marketer_id` | uuid → call_marketers ON DELETE CASCADE | PK part |
| PK | (event_slug, marketer_id) | a marketer appears once per event |

### `marketer_sales` — append-only commission ledger
| col | type | notes |
|-----|------|-------|
| `id` | uuid PK | |
| `application_id` | uuid → applications, **UNIQUE** | one sale per application (idempotent) |
| `marketer_id` | uuid → call_marketers ON DELETE RESTRICT | who earned it |
| `amount` | numeric(10,2) | snapshot of commission_amount at sale time |
| `accrued_at` | timestamptz | |

### `applications.assigned_marketer_id`
`uuid → call_marketers ON DELETE SET NULL`. The owner of the lead. `NULL` when
no marketer is assigned to the event. Indexed; also a composite index on
`(event_slug, status)`.

---

## 4. Lifecycle & data flow

### a) Assignment happens at application time (`pending`) — by design
Public applications insert with `status = 'pending'`. The **`BEFORE INSERT`**
trigger `trg_assign_application_marketer` → `assign_application_marketer()`
stamps `assigned_marketer_id` via round-robin **immediately**, before approval.

> This is intentional: marketers own a client end-to-end (approve → convert),
> so admins stay out of the per-application approval loop. Do **not** "fix" this
> to assign on approval. (See memory `marketer-assignment-at-pending`.)

### b) Round-robin — `pick_marketer_round_robin(event_slug)`
- Active marketers on the event, ordered by `call_marketers.id` (deterministic).
- Index = `count(applications for event WHERE assigned_marketer_id NOT NULL) % n`.
- Returns `NULL` if no active marketers on the event → lead stays unassigned.

### c) Rebalance — `redistribute_event_marketers(event_slug)`
Re-deals **all unconverted leads** (`status NOT IN
('advance_paid','fully_paid','rejected')`) round-robin by `created_at`.
**Converted + rejected leads keep their owner** (commission integrity).
Fired automatically by:
- `trg_event_marketers_changed` (AFTER INSERT/DELETE on `event_marketers`) —
  i.e. admin adds/removes a marketer from an event.
- `trg_call_marketer_deactivated` (AFTER UPDATE OF active, true→false) — re-runs
  for every event that marketer was on.

So **adding a 2nd marketer re-splits the existing load**, not just new leads.

### d) Commission accrual — `accrue_marketer_sale()`
**`AFTER UPDATE OF status`** trigger `trg_accrue_marketer_sale`. When
`status` flips to `fully_paid` (from anything else) AND the row has an
`assigned_marketer_id`, inserts a `marketer_sales` row with the **effective**
commission — `COALESCE(events.marketer_commission, call_marketers.commission_amount)`,
i.e. the per-event override if set, else the marketer's own default (₹50).
Idempotent via `UNIQUE(application_id)` + `ON CONFLICT DO NOTHING`. Fires
regardless of who flipped the status (payment webhook or admin), as long as
it's a `status` UPDATE.

**Per-event commission** (`events.marketer_commission`, nullable): set from the
admin event editor, in the `MarketerAssignment` block right under the marketer
chips (writes immediately, like the chips). NULL = fall back to the marketer's
₹50 default. Because the amount is snapshotted at sale time, editing an event's
rate only affects **future** sales. Migration:
`supabase/migrations/20260705_marketer_commission_per_event.sql` — also makes
the Performance tab's two live commission reads event-aware (see §8b).

---

## 4b. Doubts are split too (end-to-end with applications)

There are two kinds of "doubt"; only one is independently assigned:

| Source table | Origin | Where shown | Marketer ownership |
|---|---|---|---|
| `plan_doubts` | invite-payment flow "Other topic" (person already invited) | amber cards in the **Call section**, attached to the application row | rides along with the (already-scoped) application — no own column |
| `doubt_submissions` | booking-application flow "Other topic" (asked **before** applying) | **Doubts tab** | own `assigned_marketer_id`, split per event |

> ⚠️ Naming gotcha in `AdminPanel.tsx`: the state var **`planDoubts` actually
> holds `doubt_submissions` rows** (it feeds the Doubts tab). The real
> `plan_doubts` rows are loaded as `planDoubtsRows` and attached to applications
> as `.doubts` (amber cards). Don't be misled by the names.

**The rule: one person = one marketer per event, across BOTH their application
and their doubt.** Implemented by:
- `doubt_submissions` has `assigned_marketer_id` + `resolve_event_slug(title)`
  helper (the table has no `event_slug`, only `event_title`).
- `trg_assign_doubt_submission_marketer` (BEFORE INSERT): inherit the person's
  application marketer → else another of their doubts → else round-robin.
- `assign_application_marketer` (BEFORE INSERT, updated): inherit the person's
  existing **doubt** marketer before round-robin — so approving/applying after a
  doubt keeps the same owner.
- `redistribute_event_marketers` (rewritten): deals **by phone**, not by row.
  Converted-app people are fixed (doubts follow their app's marketer); free
  people are round-robined with their application + doubts moved together.

**Consequence on even-ness:** applications still split exactly even; doubt
counts split *nearly* even — a person who has both an app and a doubt keeps them
together, so the doubt count can drift by the number of such overlap people.
This was a deliberate choice (keep the person whole > exact per-table split).
`doubt_submissions` whose `event_title` doesn't resolve to a current event, or
whose event has no marketers, stay unassigned.

### Doubt "handled" signal (derived, non-gameable)

The Doubts tab marks a doubt **✓ Applied** when that person has actually
submitted an application for the same event. It is **derived** client-side
(`doubtHasApplied` in AdminPanel.tsx) by checking the applications list for a
matching phone+event — there is **no stored flag and no button**, so a marketer
can't fake "handled"; it only flips when the real outcome (an application)
exists. Applied doubts are de-emphasized and sorted below open ones, and the
header shows a "· N applied" count. The Doubts tab has **no Approve button** —
resolving a doubt is done over WhatsApp; the person then fills the real
application form themselves (choosing pickup point, date, etc.).

## 5. RLS summary

| Table | Admin | Marketer (ops) |
|-------|-------|----------------|
| `applications` | full, but admin policies now use **`is_admin_only()`** | SELECT/UPDATE only where `assigned_marketer_id = current_marketer_id()` |
| `call_marketers` | SELECT `is_admin()`; **writes `is_admin_strict()`** | SELECT own row |
| `event_marketers` | SELECT `is_admin()`; **writes `is_admin_strict()`** | SELECT own membership |
| `marketer_sales` | SELECT `is_admin()`; **writes `is_admin_strict()`** | SELECT own sales (powers commission banner) |

> Writes tightened 2026-07-18
> (`supabase/migrations/20260718_marketer_tables_write_strict.sql`): the old
> ALL-policies used `is_admin()`, which is true for ANY ops login — so any
> marketer could e.g. raise their own `commission_amount` via the REST API.
> Only `role='admin'` can write these tables now. Safe because the marketer
> board is a SECURITY DEFINER RPC and all assignment/accrual triggers are
> SECURITY DEFINER (verified: a marketer flipping a lead to `fully_paid`
> still accrues the `marketer_sales` row).
| `doubt_submissions` | SELECT now uses **`is_admin_only()`** | SELECT only where `assigned_marketer_id = current_marketer_id()` |
| `admin_push_subscriptions` | INSERT/UPDATE/SELECT `is_admin()`; **DELETE `is_admin_only()`** | can subscribe own device, **cannot delete** any device |

> Note: when applications admin policies moved to `is_admin_only()`, marketer
> INSERT was **not** granted — marketers don't create application rows directly,
> they only act on assigned ones. Public inserts use `applications_anon_insert`.

---

## 6. Admin panel UI (`src/AdminPanel.tsx`)

- **Marketers tab** (admin only): roster list with commission totals + active
  toggle, "Add Marketer" form, per-marketer stats. Loaded by `loadMarketersData()`.
- **Commission banner** (People tab, marketers only): "₹X earned this month ·
  N tickets sold · ₹/ticket". Driven by `currentMarketer` + `myCommissionStats`.
- **Event editor → marketer multi-select** (`MarketerAssignment` component):
  writes `event_marketers` via `setEventMarketers()`; the DB trigger then
  redistributes. Always reloads on open so the selection reflects DB truth.
- People tab heading reads **"My Leads"** for marketers, **"People"** for admins.

Key client functions: `loadMarketersData`, `saveNewMarketer`,
`toggleMarketerActive`, `setEventMarketers`, plus the `currentMarketer`
resolution inside `resolveRole`.

---

## 7. How-to (admin operations)

### Add a marketer (Supabase SQL editor)
```sql
INSERT INTO public.admin_users (email, role)
VALUES ('marketer@example.com', 'ops')
ON CONFLICT (email) DO UPDATE SET role = 'ops';

INSERT INTO public.call_marketers (email, name)        -- add commission_amount to override ₹50
VALUES ('marketer@example.com', 'Marketer Name')
ON CONFLICT (email) DO NOTHING;
```
They exist now but get **no leads until assigned to an event**.

### Assign to an event
Use the marketer multi-select on the event editor (preferred), or:
```sql
INSERT INTO public.event_marketers (event_slug, marketer_id)
VALUES ('<event-slug>', '<marketer-id>') ON CONFLICT DO NOTHING;
```
The `AFTER INSERT` trigger redistributes that event's unconverted leads.

### Off-board a marketer
- **From one event:** delete their `event_marketers` row → unconverted leads
  re-deal to remaining marketers on that event.
- **Entirely:** `UPDATE call_marketers SET active = false WHERE id = …` →
  redistributes across all their events; commission stops.

---

## 8. Edge cases & gotchas

- **Sole marketer deactivated / removed:** if no active marketers remain on the
  event, `redistribute` returns 0 and the leads **stay assigned to the
  now-inactive/removed marketer** (nothing to move them to). Reassign by adding
  another marketer.
- **Converted leads never move:** `advance_paid` / `fully_paid` keep their owner
  even on rebalance — so a lead they already half-sold stays theirs for the
  `fully_paid` commission. Legacy converted leads created **before** marketers
  existed are `NULL` and must be assigned manually if you want commission on
  their balance.
- **`marketer_sales` snapshots `amount`** at sale time — later changing a
  marketer's `commission_amount` doesn't rewrite past sales.
- **Commission only on `status` UPDATE to `fully_paid`.** A row inserted
  directly as `fully_paid` (unusual) would not fire the `AFTER UPDATE` trigger.
- **Email must match the Google JWT email exactly** (lowercase) or
  `current_marketer_id()` returns NULL and they're treated as a plain ops user
  (sees all leads, earns nothing).

---

## 8b. Performance tab (founder P&L)

The admin **Performance** tab (internally still `tab === 'marketers'`, label
renamed) is the founder's money + team cockpit. Fed by the
`get_performance_summary()` RPC.

**Core rule: money = the NET amount the founder receives** = the advance/full
price they **configured** (event-level, or per-city in `city_details`), via the
`event_net_price()` helper — **not** the gross PayU charge, which adds the
gateway fee on top for the customer (e.g. customer pays ₹2662.92, founder set
₹2600 advance, ₹62.92 is PayU's fee). `payu_payments` is used only for *who
paid and when* (ticket count + month); the rupee amount comes from config.
Months are **IST** calendar months.

- **Made this month** = collected revenue − commissions − ticket costs − fixed
  costs (all for the current IST month). Calm hero number; shows a friendly
  "↑ ₹X more than last month" delta. No goal/target framing by design.
- **In hand** = all successful payments ever. **On the way** = best-effort sum
  of (event full price − advance paid) for `advance_paid` people (uses pricing
  config, so approximate; manual/cash advances with no payu row overstate it).
- **6-month trend** = profit per IST month (green/red bars).
- **Per-event unit economics** = avg price collected/ticket − editable
  `events.cost_per_ticket` − the event's marketer commission
  (`COALESCE(events.marketer_commission, 50)`, exposed as `commission_per_ticket`
  in the RPC) = profit/ticket + margin.
- **Marketer ROI** = revenue generated (sum of payments from their assigned
  customers) vs commission earned; "for you" = the difference.
- **Fixed costs** = editable `fixed_costs` table (admin-only RLS), summed into
  the monthly profit.

Inputs the founder maintains: `events.cost_per_ticket` (per-event) and
`fixed_costs` rows. Everything else is derived from real data.

Migration: `supabase/migrations/20260618_performance_dashboard.sql`.

## 8c. Attendance — "did they open the panel today?" (added 2026-08-17)

`staff_presence_days` records **one row per staff email per IST day** that they
had the admin panel open. Shown as a **Last seen** column on the Team ▸
Marketers roster (dot + "Today"/"Yesterday"/"N days ago", plus a 14-day strip),
with a summary line: "*N of M* active marketers have opened the panel today".

**How it's written:** `AdminPanel` calls the `touch_presence()` RPC once the
role resolves, then every 5 minutes while the tab is visible, plus on
`visibilitychange` (phones suspend timers in background tabs). The RPC is
SECURITY DEFINER, stamps the caller's **own** JWT email — so nobody can mark
somebody else present — and is a **silent no-op** for non-staff. It swallows all
exceptions: this fires on every admin page load and must never break the panel.

**Why the ping and not something that already existed:**
- `admin_audit_log` records *actions*, not attendance. Reading leads and making
  phone calls leaves zero trace.
- `auth.users.last_sign_in_at` only moves on a **fresh** Google login and
  sessions persist for weeks — one marketer's last sign-in was 16 Jun while he
  was demonstrably working in the panel through July. It cannot answer "today".

> ⚠️ **This is attendance, not work, and it is gameable** — opening the panel
> for five seconds marks you present. A second "Worked today" dot (from
> `admin_audit_log` + `application_events`, both of which carry the actor and a
> timestamp) was designed and **deliberately postponed**: as of 2026-08-17 not
> one `call_status` had been saved by any of the 15 active marketers in ten
> days, so a work signal would have shown the whole team as idle when the real
> problem is that phone work is never recorded. Before adding it, close this
> gap: **saving a call *note* without changing the call *status* currently
> writes nothing anywhere** — not to `admin_audit_log` (the save doesn't call
> `logAdminAction`) and not to `application_events` (the trigger doesn't watch
> `call_notes`).

RLS: SELECT is **`is_admin_strict()`** — founders only, so staff can't read each
other's attendance. No write policies exist; `TRUNCATE` is revoked from
anon+authenticated for the same reason as on `application_events` (it bypasses
RLS).

## 9. File reference

| File | Contents |
|------|----------|
| `supabase/migrations/20260617_marketers_schema.sql` | tables + `assigned_marketer_id` |
| `supabase/migrations/20260617_marketers_functions_and_triggers.sql` | all functions + triggers |
| `supabase/migrations/20260617_marketers_rls.sql` | RLS policies |
| `supabase/migrations/20260618_admin_push_subscriptions_delete_admin_only.sql` | ops can't delete push devices |
| `supabase/migrations/20260705_marketer_commission_per_event.sql` | `events.marketer_commission` + event-aware `accrue_marketer_sale` / `get_performance_summary` |
| `supabase/migrations/20260817_staff_presence.sql` | `staff_presence_days` + `touch_presence()` (§8c attendance) |
| `src/AdminPanel.tsx` | Marketers tab, commission banner, `MarketerAssignment`, presence heartbeat + Last seen column, client logic |

Related: the **Re-Target** flag (`applications.re_target`) and `retarget-check`
edge function are a separate but adjacent system for chasing un-actioned invited
leads — see `supabase/functions/retarget-check/`.
