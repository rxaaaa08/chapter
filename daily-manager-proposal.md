# Daily Manager — Proposal

*Written 2026-07-07. Companion to `experiments-and-ab-testing-proposal.md` (shares its Layer-2 daily snapshots). Not built yet.*

The idea: a **read-only operations manager** inside the admin panel. Every morning it checks the whole business against rules the founder defines, and delivers a briefing — urgent money matters, underperformers, overperformers, and trends. It **never acts on its own**: no messages to customers, no status changes, no price edits. It only watches and reports. Deterministic rules, not AI (an optional AI narration layer is noted at the end, off by default).

---

## 1. Why this is very buildable here

Every piece of plumbing already exists in production:

- **Delivery to the founder's phone**: `notify_admin_push()` (migration `20260601_admin_push_triggers.sql`) already posts to the `send-admin-push` edge function → admin push subscriptions. The morning brief rides the same pipe. WhatsApp (AiSensy) and email (Brevo) are available as alternate channels later.
- **Scheduling**: `pg_cron` already runs nightly jobs (analytics purge, retarget-check, verify-pending-payments). The manager is one more scheduled job.
- **Data**: every example brief is computable today —
  - marketer conversion → `event_marketers` + `applications` (assignment + `fully_paid`), `get_marketer_board`
  - balance-due chase → `event_dates.booking_steps` (index 2 = balance step / due date) + `applications.status = 'advance_paid'` + assigned marketer
  - creator over/underperformance → affiliates schema + `creator_stats_since`
  - pricing conversion → `get_analytics_summary` funnel (`reached_pricing` → `converted_any`)
  - form-completion trend → `flow_analytics` now; `analytics_daily` (Experiments proposal Layer 2) once built, for periods beyond 90 days

---

## 2. Architecture — three small pieces

### a. `manager_rules` — the rulebook (founder-editable)

One row per rule: `rule_type`, plain-language `label`, `params` (thresholds, window, minimum sample), `severity` (urgent / warning / win / info), `cadence` (daily / weekly), `cooldown_days`, `enabled`, message `template` with placeholders.

Example row (in spirit): *type* `marketer_conversion_low`, *params* `{threshold_pct: 5, window_days: 30, min_assigned: 10}`, *template* "Marketer {name} converted {rate}% of {n} leads in the last {window} days (below your {threshold}% bar)."

The founder tunes thresholds, toggles rules, and edits wording **from the panel — no code**. Adding a brand-new *kind* of check (a new `rule_type`) is a small SQL snippet added on request (same honesty as the Experiments proposal: ~15 minutes each).

### b. The morning run — `evaluate_manager_rules()`

A SQL function scheduled via `pg_cron` (e.g. 08:00 IST daily; a second weekly pass on Mondays for slow-moving performance rules). For each enabled rule it:

1. computes the metric over the rule's window,
2. applies the threshold **and the minimum-sample guard** (a marketer with 2 leads and 0 sales is not "underperforming" — it's noise),
3. writes matching findings to `manager_alerts` with a **fingerprint** (`rule + subject + period`) so the same fact isn't re-raised every day — the `cooldown_days` gate,
4. auto-resolves open alerts whose condition has passed (marketer recovered → alert closes itself),
5. groups the day's output into a `manager_briefings` row and fires ONE push: *"Morning brief: 2 urgent, 3 updates, 1 win."*

### c. The Manager section in the admin panel

- **Today's brief**: alerts grouped Urgent → Watch → Wins, each in the founder's own template wording, with a deep-link (e.g. an urgent balance-chase alert links to the People tab pre-filtered to that event's advance-paid guests).
- **Acknowledge / snooze (3d / 7d) / dismiss** per alert.
- **History**: past briefings, so "what did the manager flag last Tuesday?" is answerable.
- **Rulebook editor**: the threshold/toggle/wording UI over `manager_rules`.

---

## 3. Starter rulebook (~10 rules, covering all five examples)

**Urgent — money today (daily):**
1. **Balance-due chase**: an event date's balance step is due today/tomorrow → list guests still `advance_paid` (not `fully_paid`), grouped by assigned marketer with phone links. *(example #2)*
2. **Stuck payments**: PayU payment `pending` > N hours.
3. **Capacity pressure**: a date ≥ 90% full (prep to announce sold-out), or < 50% paid within N days of the event (existing amber-threshold concept).

**Watch — performance (weekly cadence, min-sample guarded):**
4. **Marketer conversion low**: `fully_paid ÷ assigned` over trailing 30d below threshold (default 5%), min 10 assigned. *(example #1)*
5. **Doubts going stale**: assigned doubts unanswered > 24h, per marketer.
6. **Creator underperforming**: affiliate clicks high but paid conversions ~0 over window, min sample. *(example #3, first half)*
7. **Pricing conversion low**: `reached_pricing → CTA` below threshold (default 20%), min 50 sessions → "consider price or pricing-page copy". *(example #5)*

**Trends (needs `analytics_daily` from the Experiments proposal):**
8. **Form completion moved**: week-over-week beyond ± N points, referencing the nearest release marker → "completion up 6 pts since the question reduction shipped". *(example #4)*
9. **Traffic anomaly**: visitors down > 30% vs the same weekday's 4-week average.
10. **Abandonment spike / recovery-rate shift**.

**Wins (positive alerts — the manager also celebrates):** top creator of the week *(example #3, second half)*, a date selling out, recovered abandoners count.

---

## 4. Anti-noise design (what makes a manager trustworthy)

- **Minimum samples** on every ratio rule — no alarms from 3 data points.
- **Fingerprint + cooldown** — a standing problem is raised once, then only when it *changes* (worsens past a second threshold, or resolves).
- **Auto-resolve** — conditions that pass close their own alerts; the founder never grooms a stale list.
- **One push per day**, not one per alert; urgent-only exceptions can bypass (e.g. stuck payment).
- **Severity budget** — if more than ~7 alerts fire, the brief shows the top ones by severity and folds the rest, so mornings stay readable.

---

## 5. Build plan & dependencies

| Phase | What | Effort |
|---|---|---|
| A | `manager_rules` + `manager_alerts` + `manager_briefings`, `evaluate_manager_rules()` with rules 1–7 (live-table rules), pg_cron schedule, Manager section (brief + history + ack/snooze). | ~1 session |
| B | Morning push via existing `notify_admin_push()`, rulebook editor UI (thresholds/toggles/wording). | ~½ session |
| C | Trend rules 8–10 — **after** Experiments Phase 1 ships `analytics_daily` (shared foundation; build that first). | ~½ session |
| D *(optional, later)* | AI narration: a Claude call that turns the day's alert rows into a 3-sentence natural morning note. Still read-only; deterministic rules stay the source of truth. Pennies per day. Pairs with the `ai-chatbot.md` proposal. | ~½ session |

No new services, no new costs (push/cron/DB all existing). Cron + any edge-function changes follow the usual rule: founder deploys or grants one-off approval.

**Self-serve honesty**: tuning thresholds, toggling rules, editing wording, snoozing — all founder-self-serve forever. A brand-new rule *type* = one small ask per rule. The starter pack above covers every scenario named in the founding request.
