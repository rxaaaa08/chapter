# Manager Role — Proposal

A third role for the admin panel: **Manager** — the escalation step above marketers.
One manager end-to-end owns specific events: oversees that event's marketers, sees all
its leads, keeps dates/group-chats current, and gets paid commission — without needing
the founders for day-to-day decisions.

Written 2026-07-18. Proposal only — nothing here is built yet.

---

## 1. How roles work today (so the plan makes sense)

There are only two login roles, enforced by a database rule (`admin_users.role` may
only be `'admin'` or `'ops'`):

| Role | Who | What they see |
|---|---|---|
| `admin` | Founders (3 accounts) | Everything — all tabs |
| `ops` | Staff (8 accounts) | People tab (+ Doubts, Call) |

**"Marketer" is not a role** — it's an `ops` user whose email *also* appears in the
`call_marketers` table. That second table (a "side-car") is what gives them
commission, lead assignment, and the scoped "My Leads" view. This pattern works well
and is battle-tested, so **Manager should be built the same way**: an `ops` login +
a new `managers` side-car table. No change to the risky role rule, no new login flow.

⚠️ **One trap this design must fix on day one:** today, an `ops` user who is *not* a
marketer is treated as a mini-admin by the database security rules (`is_admin_only()`)
— they'd see **every lead of every event**. A manager must only see their own events'
leads, so the security helper functions need a `current_manager_id()` sibling and the
lead-visibility rules need a third branch. This is the single most important
implementation detail; everything else is additive.

⚠️ **Naming collision:** the admin panel already has a tab called **"Manager"** — the
daily 6pm briefing. Recommendation: rename that tab to **"Briefing"** and let the new
role own the word "Manager". (Small label change, no logic.)

---

## 2. Database plan (mirrors the marketer system 1:1)

New tables — same shapes as the marketer/creator ones that already work:

- **`managers`** — roster: `id, email (unique, lowercase, = Google login), name,
  commission_amount, active, created_at`. Mirrors `call_marketers`.
- **`event_managers`** — which manager covers which event: `(event_slug, manager_id)`.
  Mirrors `event_marketers`. Usually one manager per event, but the shape allows two
  (e.g. a handover week).
- **`manager_sales`** — append-only commission ledger: `id, application_id (unique),
  manager_id, amount, accrued_at, paid_out_at`. Mirrors `affiliate_sales` (it has the
  `paid_out_at` column, so the Performance card can show **earned vs unpaid** exactly
  like the Creators card does).

New helper: **`current_manager_id()`** (JWT email → `managers.id`, active only), and
`is_admin_only()` becomes "admin AND not a marketer AND not a manager".

### What a manager can touch (database security rules)

| Data | Manager access | Note |
|---|---|---|
| `applications` (leads) | READ all leads of *their* events; UPDATE same scope | Sees every marketer's leads, unlike a marketer who sees only their own |
| `doubt_submissions` | READ for their events | The escalation queue |
| `event_marketers` | READ + **INSERT/DELETE for their events** | Adding/removing a marketer auto-redistributes leads — the DB trigger already does this, so it Just Works |
| `call_marketers` | READ roster (names/active); no commission edits | Needed to pick who to assign |
| `event_dates` | **INSERT new dates** + UPDATE `whatsapp_group_url`/`status` on their events | Deliberately **no delete, no date rename** — renames strand existing bookings (known landmine in the current editor) |
| `events` | READ their events only | No editing prices, descriptions, timelines |
| `marketer_sales` | READ for their events' marketers | Powers their marketer-ROI view |
| `managers` | READ own row | Powers their commission banner |
| Everything else (analytics, roadmap, fixed costs, other events) | No access | |

Manager writes go through the existing `log_admin_action` audit log — which doubles
as the raw material for measuring manager activity (§6).

---

## 3. The Manager dashboard (what they see when they log in)

A manager logs in with Google like everyone else and lands on a scoped panel:

1. **Event header cards** — one per assigned event: spots left per date (via the
   existing `event_booking_counts_by_date` RPC, same as the marketer card), sold /
   reserved / capacity, days to event, current dates + group-chat links.
2. **All Leads** — the People tab, but scoped to their events and showing **every
   marketer's leads**, each tagged with the marketer's name (admins already get this
   tag; managers inherit it). Same filters (status, cart-abandoned, re-target).
3. **Team panel** — the marketers on each event: add/remove via the same
   multi-select the admin event editor uses (redistribution is automatic), each with:
   - leads assigned / contacted / converted, conversion %
   - revenue generated vs commission earned (**marketer ROI** — same numbers as the
     admin Performance tab, but scoped by a new `get_manager_summary()` RPC so the
     database enforces they only see their events)
   - "stale leads" count: leads sitting in `pending`/`invited` for 48h+ with no
     status change — the manager's daily to-do generator.
4. **Dates & group chats** — add a new event date (with capacity + WhatsApp group
   link), edit group links, mark a date selling-out/sold-out. Additive-only.
5. **Doubts queue** — all doubts for their events (marketers only see their own),
   with the existing derived "✓ Applied" signal.
6. **Commission banner** — "₹X earned this month · N tickets", same as marketers get.

### What a manager cannot do (kept deliberate)
- Change prices, event descriptions, timelines/booking steps, or announcements.
- Delete or rename dates, delete leads, or touch converted (`advance_paid`/`fully_paid`) money fields.
- See other managers' events, the Performance tab, Analytics, Roadmap, or fixed costs.
- Change anyone's commission rates (their own or marketers').

---

## 4. Paying managers (mirrors Creators)

**Recommendation: flat ₹ per fully-paid ticket on their events, with a per-event
override** — i.e. the marketer model, not the creator % model.

Why not a % like creators? Creators are paid % because they *bring* the customer and
their value scales with ticket price. A manager's work scales with *ticket count*
(each lead = calls, follow-ups, problems), and a flat ₹/ticket is also much easier to
reason about next to the existing ₹50/ticket marketer cost in per-event unit
economics. But the ledger design supports either — if you prefer %, only the accrual
trigger changes.

Mechanics (all proven patterns copied from marketers/creators):
- `managers.commission_amount` (default **₹35** — confirmed), optional
  `events.manager_commission` override, snapshotted into `manager_sales` at sale time.
- Accrues automatically when a lead on their event flips to `fully_paid`
  (an `AFTER UPDATE` trigger, idempotent, same as `accrue_marketer_sale`).
- **Managers card in the Performance tab**, right beside Creators: add by email +
  name (+ ₹/ticket), active toggle, and per-manager rollups — events covered, tickets,
  earned, **unpaid** (mark-paid sets `paid_out_at`, like creator payouts).

### Profit math — three places must subtract manager commission
`get_performance_summary()` bakes commissions into money numbers in three spots; all
three must learn the manager cost or the profit cards will silently overstate:
1. **Made this month** — subtract `manager_sales` accrued this IST month (exactly how marketer commission is handled).
2. **6-month forecast** (`committed_profit`) — subtract the event's effective manager ₹/ticket per committed ticket.
3. **Per-event unit economics** — profit/ticket = price − cost/ticket − marketer ₹ − affiliate % − **manager ₹**.

(Note from memory: the live version of this RPC is ahead of the committed migration
files — whoever builds this must dump the live definition first, not edit the file in
the repo.)

---

## 5. Managers hiring marketers

You want managers to interview and hire. Direct writes to `admin_users` (the login
gate) are too sensitive to open up, so:

**A `manager_add_marketer(email, name)` database function** (security-definer,
callable only by active managers) that atomically:
1. inserts the `admin_users` row as `ops` + the `call_marketers` row,
2. assigns the new marketer to one of *that manager's* events (can't hire into someone else's event),
3. writes an audit-log entry and **pushes a notification to admins** ("Priya added marketer Rahul to Goa Trip") via the existing `send-admin-push` function.

Guardrails: admins can deactivate anyone; a cap (e.g. max 2 hires/week/manager) is
easy to add if ever needed. Removal stays symmetric: managers can *deactivate*
marketers on their events (triggers auto-redistribution) but not delete history —
commission ledgers are append-only.

---

## 6. Measuring manager performance (the admin's view)

You asked how to know a manager is actually working. Two layers:

**Outcome metrics** (does their event succeed?) — shown on the Managers card per manager:
- **Fill rate**: tickets sold ÷ capacity per event date — the single best outcome number.
- **Conversion funnel**: pending → invited → advance → fully-paid rates for their events, benchmarked against your all-events average.
- **Revenue managed** vs commission paid = **manager ROI**, same framing as marketer ROI.
- **Lead velocity**: median hours a lead sits in `pending` before moving — a slow team is a badly-managed team.
- **Recovery rate**: % of cart-abandoned leads on their events that end up paid (`recovered_at`).
- **Doubt closure**: % of doubts on their events that turn into applications (the derived "✓ Applied" signal — non-gameable).

**Activity metrics** (are they present?) — derived from the audit log, zero new tracking:
- actions in the last 7 days (status changes, marketer add/remove, dates added),
- last-active timestamp,
- marketers hired / removed count.

**Delivery suggestion:** fold a "Manager scorecard" rule into the existing daily 6pm
briefing (the Daily Manager system — ironic naming, hence the rename): e.g. *"Goa
Trip (managed by Priya): 12 leads stale >48h, fill rate 40% with 9 days left."* You
then manage managers by exception instead of watching dashboards.

---

## 7. Extra systems worth considering (borrowed from how bigger teams run this)

Ranked by value-for-effort; none are required for v1:

1. **Escalation inbox** (recommended v2): a marketer taps "Escalate" on a lead with a
   one-line reason → it lands in the manager's queue with an SLA timer. Today
   escalation happens invisibly on WhatsApp; this makes "manager sorts problems
   without us" measurable, and "escalations resolved / median resolution time"
   becomes the best manager-performance number of all.
2. **Lead notes**: a small append-only notes thread per application (marketer + manager
   visible). Right now call context lives in people's heads/WhatsApp; handovers and
   redistributions lose it. Also makes activity auditable.
3. **Stale-lead nudges**: the 48h+ stale count from §3, pushed to the manager daily
   rather than waiting for them to look.
4. **Weekly manager digest to admins**: one WhatsApp/push per week per manager —
   fill rate, conversion, escalations, hires. Reuses the briefing engine.
5. **Capacity guardrail**: managers can add dates, so a soft rule — new dates beyond
   N total or above X capacity notify admins — keeps autonomy without surprises.

Explicitly *not* proposed: separate manager login portal (reuse the admin panel),
per-manager targets/quotas UI (your brand direction is calm, ~10–12 curated plans —
a quota system is corporate machinery you don't need at this size).

---

## 8. Build order (each phase ships alone and works alone)

| Phase | What | Risk |
|---|---|---|
| **1. Foundations** — ✅ **BUILT 2026-07-18** (`supabase/migrations/20260718_manager_role_phase1.sql`, applied to prod; verified by JWT-simulation for admin/ops/marketer/manager/anon personas, test rows deleted) | `managers` + `event_managers` + `manager_sales` tables, `current_manager_id()`, `is_event_manager()`, `manager_owns_application()`, the `is_admin_only()` fix, manager read scope + lead-update scope | Low — additive, but the `is_admin_only()` change needs careful testing so admins/marketers see exactly what they see today |
| **2. Manager dashboard** — ✅ **BUILT 2026-07-18** (`20260718_manager_role_phase2_summary.sql` applied to prod + AdminPanel.tsx; "Manager" tab renamed "Briefing") | Scoped panel: commission banner, stale-lead alert, team table from `get_manager_summary()`, spots-left card, marketer name-tags + filter, doubts | Medium — biggest UI chunk |
| **3. Team controls** — ✅ **BUILT 2026-07-18** (`20260718_manager_role_phase3_team.sql` applied to prod; hire push verified delivered to all admin devices) | Add/remove marketers on own events (chips), `manager_add_marketer()` hiring RPC + admin push via notify_admin_push | Low — DB triggers already do the hard part |
| **4. Dates & group chats** — ✅ **BUILT 2026-07-18** (`20260718_manager_role_phase4_dates.sql` applied to prod; seeding verified: sibling steps shifted by the date delta, rhythm preserved) | `manager_add_event_date()` (additive only, timeline auto-seeded) + `manager_update_event_date()` (group link + status only) RPCs + dates block in the manager panel | Low, small |
| **5. Money** — ✅ **BUILT 2026-07-18** (`20260718_manager_role_phase5_money.sql` applied to prod; live RPC dumped first; verified: ₹35 accrual on fully-paid + profit dropped exactly ₹35/ticket) | `events.manager_commission` override, `accrue_manager_sale` trigger (earliest-assigned active manager), Managers card in Performance (add/deactivate/mark-paid + event chips), manager cost in committed profit + forecast + per-event unit economics | Medium — touches the live-drifted RPC |
| **6. Scorecard** | Manager metrics on the card + briefing rule | Low, read-only |

Founder decisions — **CONFIRMED 2026-07-18**: **(a)** default manager commission =
**₹35/ticket** (flat, per-event override available), **(b)** rename the "Manager"
tab to **"Briefing"** — approved, **(c)** managers see lead phone numbers — yes,
**(d)** hiring is **fully autonomous with an admin push notification** (no approval
step).

---

## 9. Risks & gotchas register

- **`is_admin_only()` third branch** — the one change that touches existing behaviour; ship first, alone, verified with SQL simulation for all three roles.
- **A manager who is also a marketer**: emails could appear in both side-cars. Define the precedence (proposal: manager view wins; they keep earning marketer commission on their own assigned leads). Don't leave it undefined.
- **Date additions vs per-date timelines**: a new `event_dates` row needs `booking_steps` seeded (copy the event's canonical 5 steps) or bookings on that date get a broken timeline — the add-date RPC must do this, not trust the UI.
- **Commission double-cost**: a fully-paid ticket can now cost marketer ₹ + affiliate % + manager ₹. Fine — but the per-event unit economics card must show all three so pricing decisions stay honest.
- **Manager offboarding**: deactivating a manager must *not* redistribute anything (unlike marketers — leads belong to marketers, not managers). Just cuts access + stops accrual. Their unpaid ledger stays visible for final payout. **Verified trap (2026-07-18): also delete their `admin_users` row** — a deactivated manager (or marketer) who keeps an ops login reverts to the plain-ops broad view and sees every lead.
- **Live RPC drift**: dump `get_performance_summary` from prod before editing (memory: `analytics-summary-rpc-drift` — same discipline applies).
