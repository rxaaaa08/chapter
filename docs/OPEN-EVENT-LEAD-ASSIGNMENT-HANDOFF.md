# Open-event lead assignment + staggered marketer fees — build handoff

**Written 2026-08-03. Self-contained: everything below was verified against the live production
database and the current working tree on that date. You should not need to re-explore to build this.**

Companion visual (the owner's reference for the model):
`https://claude.ai/code/artifact/70dc8baa-8040-4a12-b08c-e2f88c2b41a1`

---

## 0. What you are building, in one paragraph

Today, a lead on an **open event** (`events.booking_url = 'payu-hosted'`) is only assigned to a
marketer if that person asks a doubt. Everyone else — including people who pay — has no human
owner. This change makes open events behave like invite events for *assignment* (every lead is
round-robined to a marketer the moment their row is created), while making the *fee* depend on
whether the sale needed a human: a ticket that sold itself with no friction pays **half** the
event's marketer fee; a ticket involving a doubt, a cart abandonment, or a failed payment pays the
**full** fee. Invite-only events are completely unchanged.

---

## 1. The decision — settled, do not re-open

The owner worked through this and made the calls. Build what's here; don't re-litigate it.

### 1.1 The model

| Outcome | Fee |
|---|---|
| Lead never reaches `fully_paid` | **₹0** |
| Paid, and nothing got in the way | **half** the event's marketer fee |
| Paid, and *any* of: asked a doubt · cart abandoned · had a failed payment | **full** fee |

### 1.2 The halving rule

The event's existing single fee (`events.marketer_commission`, currently `50.00` on
`sunrise-at-kovalam`) becomes the **full** fee. The self-serve fee is **half of it, computed** —
never stored, never a second column. Round to the nearest rupee (`round(v_full / 2)`), so a ₹75 full
fee yields ₹38, not ₹37.50.

One sentence for the sales team: *if the sale needed you, full fee; if it didn't, half.*

### 1.3 Why the fee does NOT ask who recovered the lead

An earlier draft paid more when a marketer personally rescued an abandoned lead. **The owner
rejected this and is right:** even when a marketer calls someone personally, that lead still
converts by clicking the same link the automatic cart-abandonment WhatsApp sent them. There is no
signal anywhere that separates a human rescue from a self-return — any flag would be the marketer's
word for it. So: **if it came back, it's the full fee, regardless of who or what brought it back.**

This means you will sometimes pay the full fee for a ticket the cron recovered on its own. That is
a knowingly accepted cost. Do not add a "marketer contacted" timestamp, a rescue-attribution
column, or a `contacted_at` field. They were considered and deliberately cut.

### 1.4 Why every lead is assigned, not just the noisy ones

The point is not workload distribution — it's ownership. If a marketer only meets a lead at the
moment a doubt arrives, that person is a task that landed on them. If the name has been sitting in
their list since it came in, the doubt is *their* customer asking *them* a question. It also means
a self-serve ticket is visibly theirs before anything goes wrong, so nobody has to work out whose
job it is when a paid guest asks where to meet three days before the trip.

**Do not add a rule that hides quiet leads from marketers.** They see everything on their events.

---

## 2. Ground rules (from `CLAUDE.md` — read it too)

1. **The Supabase DB is PRODUCTION with live paying customers.** Test rows use phone `90000000xx`.
   Verify every write with `RETURNING`. Delete test rows afterwards.
2. **Never `git push` without the owner's explicit go-ahead in that conversation turn.** Pushing to
   `main` deploys the live site.
3. **Never deploy edge functions.** The owner deploys. (This build needs no edge-function change —
   see §6.)
4. **After every code edit, `npx tsc --noEmit` must pass.**
5. One concern per commit; commit messages explain the *why*.
6. The owner is a **no-code founder** — explain plans in plain language, never assume they can edit
   code or config themselves.
7. Admin/marketer views sit behind login and are **not drivable in the preview server**. Verify
   those with `tsc` + SQL simulation instead.

---

## 3. The system as it stands today (verified 2026-08-03)

### 3.1 Live data — the problem, in numbers

`sunrise-at-kovalam` is the only live open event.

- **6 applications, 0 with `assigned_marketer_id`.** Three of the six are `fully_paid`.
- **3 doubt rows on that event, all with `assigned_marketer_id = NULL`.**
- 2 `payu_payments` rows with `status = 'failure'`, 3 with `success`.
- `event_marketers` maps exactly one active marketer to the event (Krutesh, `a4e37247-…`), created
  2026-07-10 — i.e. *before* two of the three unassigned doubts were submitted.

That last point matters: the doubt-assignment path should have fired and didn't. See Phase 0.

### 3.2 Relevant schema

| Table | Columns you'll touch |
|---|---|
| `applications` | `id`, `event_slug`, `phone` (last-10), `status`, `assigned_marketer_id`, `cart_abandoned`, `recovered_at`, `re_target`, `call_status`, `call_notes`, `selected_date`, `created_at` |
| `marketer_sales` | `id`, `application_id` (UNIQUE), `marketer_id`, `amount numeric(10,2)`, `accrued_at`, `paid_out_at` |
| `doubt_submissions` | `phone`, `event_title` (**not** slug — resolve via `resolve_event_slug()`), `assigned_marketer_id`, `submitted_at` |
| `plan_doubts` | `phone`, `event_slug`, `message`, `created_at` |
| `payu_payments` | `event_slug`, `phone`, `status` (`success` / `failure`), `payment_type` (`advance`/`balance`/`full`), `created_at` |
| `events` | `slug`, `booking_url`, `payment_mode`, `marketer_commission numeric` |
| `event_marketers` | `event_slug`, `marketer_id` |
| `call_marketers` | `id`, `name`, `active`, `commission_amount` |

### 3.3 Functions and triggers, as they behave right now

All of these are **live and match the repo migrations** (checked with `pg_get_functiondef`).

| Object | Current behaviour | Changes in this build? |
|---|---|---|
| `assign_application_marketer()` → `trg_assign_application_marketer` (BEFORE INSERT on `applications`) | Inherits a prior doubt's marketer; falls back to `pick_marketer_round_robin()` **only if `NOT is_open_event(...)`** | **YES — Phase 1** |
| `assign_doubt_submission_marketer()` → `trg_assign_doubt_submission_marketer` | app → other doubt → round-robin; also anchors the person's unassigned application | No |
| `assign_app_from_plan_doubt()` → `trg_assign_app_from_plan_doubt` | Open events only: stamps a marketer on the person's unassigned application | No (becomes a mostly-redundant no-op after Phase 1 — leave it) |
| `accrue_marketer_sale()` → `trg_accrue_marketer_sale` (on `applications`) | On transition into `fully_paid` with a marketer, inserts one `marketer_sales` row for `COALESCE(e.marketer_commission, cm.commission_amount)` | **YES — Phase 2** |
| `redistribute_event_marketers(text)` | Rebalances on marketer add/remove. For open events, **restricted to people who already have a marketer** | **YES — Phase 3** |
| `force_reshuffle_event_marketers(text)` | Founder-only manual "Reshuffle leads" button. For open events, **restricted to doubt-raisers only** | **YES — Phase 3** |
| `pick_marketer_round_robin(text)` | Deals by `count(*)` of already-assigned applications on the event, `ORDER BY cm.id` | No |
| `is_open_event(text)` | `booking_url = 'payu-hosted'` | No |
| `resolve_event_slug(text)` | Title-or-slug → slug. **Note: matches on title, so event copies sharing a title are ambiguous.** | No |
| `guard_paid_status_change()` → `trg_guard_paid_status` | Blocks *status transitions into* `advance_paid`/`fully_paid` unless service-role or strict admin | No — and note it does **not** block updating other columns on a paid row, so the Phase 3 backfill works |
| `get_performance_summary()` | Founder-gated finances RPC; subtracts a **flat** marketer commission per paid ticket | **YES — Phase 4** |

### 3.4 RLS facts that make this simpler than it looks

- **`applications_marketer_select`**: `assigned_marketer_id = current_marketer_id()`. A marketer
  physically cannot see an unassigned lead. **This means Phase 1 delivers the entire "marketers see
  every lead" requirement with zero frontend work** — assignment *is* visibility.
- **`marketer_sales_self_select`**: `marketer_id = current_marketer_id()`. A marketer can read their
  own accrued fees directly. Phase 4 uses this instead of building an RPC.
- `applications` are unreadable by `anon` — client code must go through `get-user-context` or the
  `event_booking_counts` RPCs. Nothing here changes that.

---

## 4. Build phases

Each phase is independently committable. Phases 1–3 are the core; 4 is required for the money to
report correctly; 5 is polish.

---

### Phase 0 — Find out why the three doubts were never assigned

**Do this first. It's diagnostic, not a change.** The doubt→assign path is the one mechanism the
current design depends on, and on the live data it produced three `NULL`s. If it's broken, Phase 1
may not fix it, and you'd ship a change that still leaves leads unowned.

Everything looks correct on paper — the trigger exists and is enabled, the function body matches the
migration, the event has an active mapped marketer since 2026-07-10, and two of the three doubts
postdate that. So reproduce it:

```sql
-- Does the round-robin arm find anybody today?
SELECT array_agg(cm.id ORDER BY cm.id)
  FROM event_marketers em JOIN call_marketers cm ON cm.id = em.marketer_id
 WHERE em.event_slug = 'sunrise-at-kovalam' AND cm.active = true;
```

Then insert a **test doubt** with phone `9000000091`, event_title `'Sunrise at Kovalam'`, and check
whether `assigned_marketer_id` comes back populated. **Warning:** `trg_admin_push_doubt_submission`
will fire a real push notification to the founder — tell them before you do it, or ask them to
ignore one test alert. Delete the row afterwards.

Prime suspect if it fails: `resolve_event_slug()` matches on **title**, and three events in the DB
descend from the same original (`sunrise-at-kovalam`, plus two renamed copies). If the title was
ambiguous at insert time, the doubt may have resolved to a copy slug.

Report what you find to the owner before proceeding. If it's a real bug, fix it here as its own
commit.

---

### Phase 1 — Round-robin every open-event lead at creation

**One function, one line of logic removed.** Drop the `is_open_event` guard so the round-robin
fallback applies to every event.

Migration `supabase/migrations/2026XXXX_open_event_assign_all_leads.sql`:

```sql
-- Open events now assign every incoming lead, exactly like invite events.
-- Ownership is universal; the FEE is what varies (see accrue_marketer_sale).
-- Replaces the doubt-only rule from 20260706_open_event_marketer_assignment.sql.
CREATE OR REPLACE FUNCTION public.assign_application_marketer()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_phone    text;
  v_marketer uuid;
BEGIN
  IF NEW.assigned_marketer_id IS NOT NULL THEN RETURN NEW; END IF;
  v_phone := right(regexp_replace(coalesce(NEW.phone,''),'\D','','g'),10);

  -- inherit an existing doubt's marketer for this person+event (both flows)
  SELECT ds.assigned_marketer_id INTO v_marketer
    FROM doubt_submissions ds
   WHERE right(regexp_replace(ds.phone,'\D','','g'),10) = v_phone
     AND resolve_event_slug(ds.event_title) = NEW.event_slug
     AND ds.assigned_marketer_id IS NOT NULL
   LIMIT 1;

  -- round-robin fallback now applies to OPEN events too (this is the change)
  IF v_marketer IS NULL THEN
    v_marketer := pick_marketer_round_robin(NEW.event_slug);
  END IF;

  NEW.assigned_marketer_id := v_marketer;
  RETURN NEW;
END
$$;
```

Keep `is_open_event()` — it's still used by Phase 2 and by other code.

**Verify:** insert a test application on the open event with phone `9000000092`, confirm
`assigned_marketer_id` is populated via `RETURNING`, then delete it. Confirm an invite-event insert
still behaves identically.

**Note for the owner:** if an open event has *no* marketers mapped in `event_marketers`, leads stay
unassigned — same as invite events. Mapping at least one marketer per open event is now a setup
step that matters.

---

### Phase 2 — Two-tier fee at accrual

Add a helper that answers "did anything get in the way of this sale?", then make the accrual trigger
halve the fee when the answer is no.

**A timing insight that removes an entire class of complexity:** `accrue_marketer_sale` fires *at
the moment of payment*. So any doubt row that exists when it fires is, by definition, from before
the payment. **You do not need to compare timestamps.** Just check for existence.

```sql
-- Did anything stand between this lead and the money?
-- Deliberately does NOT ask who recovered them — see §1.3 of the handoff.
CREATE OR REPLACE FUNCTION public.open_lead_was_worked(
  p_event_slug text,
  p_phone      text,
  p_abandoned  boolean
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT COALESCE(p_abandoned, false)
      OR EXISTS (
           SELECT 1 FROM doubt_submissions ds
            WHERE resolve_event_slug(ds.event_title) = p_event_slug
              AND right(regexp_replace(ds.phone,'\D','','g'),10)
                = right(regexp_replace(coalesce(p_phone,''),'\D','','g'),10))
      OR EXISTS (
           SELECT 1 FROM plan_doubts pd
            WHERE pd.event_slug = p_event_slug
              AND right(regexp_replace(pd.phone,'\D','','g'),10)
                = right(regexp_replace(coalesce(p_phone,''),'\D','','g'),10))
      OR EXISTS (
           SELECT 1 FROM payu_payments pp
            WHERE pp.event_slug = p_event_slug
              AND pp.status = 'failure'
              AND right(regexp_replace(pp.phone,'\D','','g'),10)
                = right(regexp_replace(coalesce(p_phone,''),'\D','','g'),10));
$$;
```

```sql
-- Open events pay half for a frictionless self-serve ticket, full otherwise.
-- Invite events are UNCHANGED: always the full fee.
CREATE OR REPLACE FUNCTION public.accrue_marketer_sale()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_full   numeric(10,2);
  v_amount numeric(10,2);
BEGIN
  IF NEW.status = 'fully_paid'
     AND (OLD.status IS DISTINCT FROM 'fully_paid')
     AND NEW.assigned_marketer_id IS NOT NULL
  THEN
    SELECT COALESCE(e.marketer_commission, cm.commission_amount)
      INTO v_full
      FROM call_marketers cm
      LEFT JOIN events e ON e.slug = NEW.event_slug
     WHERE cm.id = NEW.assigned_marketer_id;

    IF v_full IS NULL THEN RETURN NEW; END IF;

    IF COALESCE(is_open_event(NEW.event_slug), false)
       AND NOT open_lead_was_worked(NEW.event_slug, NEW.phone, NEW.cart_abandoned)
    THEN
      v_amount := round(v_full / 2);   -- self-serve close: half, nearest rupee
    ELSE
      v_amount := v_full;              -- worked close, and all invite events
    END IF;

    INSERT INTO marketer_sales (application_id, marketer_id, amount)
    VALUES (NEW.id, NEW.assigned_marketer_id, v_amount)
    ON CONFLICT (application_id) DO NOTHING;
  END IF;
  RETURN NEW;
END
$$;
```

**Behaviours to preserve, and why they're already right:**
- `ON CONFLICT (application_id) DO NOTHING` → **one fee per ticket, ever.** A lead who asks a doubt
  *and* abandons *and* fails a payment still yields a single full fee. Flags decide the tier; they
  don't stack.
- Accrual only on `fully_paid`, so **split-payment open events pay the fee once, when the balance
  lands.** Advance alone accrues nothing. Unchanged from today.
- A doubt asked **after** payment doesn't upgrade anything — the row already exists and
  `ON CONFLICT` protects it. That's the intended "the half fee covers later support" behaviour.

**Verify with SQL simulation** (no UI needed) — for each of the six live Kovalam rows, print what
the tier *would* be:

```sql
SELECT a.name, right(a.phone,4) AS ph, a.status, a.cart_abandoned,
       public.open_lead_was_worked(a.event_slug, a.phone, a.cart_abandoned) AS worked,
       CASE WHEN public.open_lead_was_worked(a.event_slug, a.phone, a.cart_abandoned)
            THEN e.marketer_commission ELSE round(e.marketer_commission / 2) END AS fee
  FROM applications a JOIN events e ON e.slug = a.event_slug
 WHERE e.booking_url = 'payu-hosted'
 ORDER BY a.created_at;
```

Sanity-check the output against the known facts: `Muthukumar` is `cart_abandoned` + recovered →
should be **worked/full**. `Karthick` and `Sanjay` paid cleanly → should be **self-serve/half**,
unless they have a doubt or failed-payment row.

---

### Phase 3 — Reshuffle, redistribute, and backfill

#### 3a. Remove the open-event carve-outs

Both rebalancing functions were written specifically to *enforce* the doubt-only rule. Left alone,
reshuffling an open event would strand every self-serve lead — undoing Phase 1 for exactly the event
you just rebalanced.

- **`redistribute_event_marketers(text)`** — in Step B's `FOR v_rec IN` query, delete the
  `AND (NOT v_is_open OR phone10 IN (...))` block, and remove the now-unused `v_is_open` variable.
- **`force_reshuffle_event_marketers(text)`** — delete the equivalent
  `AND (NOT v_is_open OR phone10 IN (SELECT … FROM doubt_submissions …))` block and its `v_is_open`
  declaration. Keep the `is_admin_strict()` guard and the "return 0 if nobody mapped" early exit.

Both already exclude anyone with a paid ticket (`status IN ('advance_paid','fully_paid')`), which is
correct and must stay: **never move the owner of a lead who has already paid**, because their fee is
tied to that person.

Dump the live definition with `pg_get_functiondef` before editing, edit that text, and commit the
full new definition as a migration. (There's a history in this repo of live RPC definitions drifting
ahead of committed migrations — see the `analytics-summary-rpc-drift` note.)

#### 3b. Backfill the existing unowned leads

After 3a, run `SELECT force_reshuffle_event_marketers('sunrise-at-kovalam');` to deal the three
*unpaid* leads. That leaves the three **already-paid** rows, which the reshuffle deliberately skips.
Deal those with a one-off, round-robin by creation order:

```sql
WITH mk AS (
  SELECT cm.id, row_number() OVER (ORDER BY cm.id) - 1 AS idx, count(*) OVER () AS n
    FROM event_marketers em JOIN call_marketers cm ON cm.id = em.marketer_id
   WHERE em.event_slug = 'sunrise-at-kovalam' AND cm.active
),
tgt AS (
  SELECT a.id, row_number() OVER (ORDER BY a.created_at) - 1 AS i
    FROM applications a
   WHERE a.event_slug = 'sunrise-at-kovalam'
     AND a.status IN ('advance_paid','fully_paid')
     AND a.assigned_marketer_id IS NULL
)
UPDATE applications a
   SET assigned_marketer_id = mk.id
  FROM tgt, mk
 WHERE a.id = tgt.id AND mk.idx = tgt.i % mk.n
RETURNING a.id, a.name, a.status, a.assigned_marketer_id;
```

Run the `SELECT` halves alone first to preview the pairing. `trg_guard_paid_status` does not block
this — it only guards *status transitions*, not other columns on a paid row.

**This creates no `marketer_sales` rows.** The accrual trigger fires only on the transition into
`fully_paid`, which already happened. So those three tickets become **owned for service but not
retroactively paid**. That's the recommended outcome — confirm with the owner (§7, Q2).

---

### Phase 4 — Make the money report correctly

Two places still assume one flat fee per ticket.

#### 4a. `get_performance_summary()` — the profit forecast

In the `ev_committed` CTE, the per-ticket deduction is currently flat:

```sql
- COALESCE(e.marketer_commission, cm.commission_amount, 0)
```

Make it tier-aware:

```sql
- CASE
    WHEN e.booking_url = 'payu-hosted'
     AND NOT public.open_lead_was_worked(a.event_slug, a.phone, a.cart_abandoned)
    THEN round(COALESCE(e.marketer_commission, cm.commission_amount, 0) / 2)
    ELSE COALESCE(e.marketer_commission, cm.commission_amount, 0)
  END
```

Left unchanged, the forecast **understates profit** on every self-serve open ticket. Note also that
`ev_agg.commission_per_ticket` (`COALESCE(e.marketer_commission, 50)`) is now the *full* fee while
the real blended cost is lower — surface it as "full fee" in the UI or leave it, but know what it
means. Same discipline as 3a: dump live, edit, commit the whole definition, keep the
`is_admin_strict()` gate intact.

#### 4b. The marketer's earnings bill — `src/AdminPanel.tsx` ~line 6673

```ts
const mkRate = inPool ? Number(t.marketer_commission ?? currentMarketer?.commission_amount ?? 50) : 0;
// …
calculations.push({ role: 'Marketer', rate: mkRate, tickets: fullyPaidApps.filter(…).length });
```

This is `rate × ticket count`, which is now wrong for open events — the rate varies per ticket.
**Fix it by reading the actual accrued amounts** rather than recomputing: RLS policy
`marketer_sales_self_select` already lets a marketer select their own rows, so fetch
`marketer_sales` for `marketer_id = currentMarketer.id`, join to applications for the event slug,
and sum `amount` per event. That's the authoritative number the payout settlement already uses, so
the bill and the payout can never disagree.

Keep the Manager rows exactly as they are — manager commission is flat and unaffected.

---

### Phase 5 — Order the marketer's list by what needs a human (optional, do last)

Assignment now means marketers see every lead on their events. Make the top of the list the work:
float leads with a **failed payment**, **cart abandoned**, or an **unanswered doubt** above the
quiet self-serve ones, in the People tab's `filteredApps` ordering (`src/AdminPanel.tsx` ~line 4193).

Do not add a filter that *hides* quiet leads — see §1.4. This is sort order only.

---

### Phase 6 — Housekeeping the repo asks for

`CLAUDE.md` requires these whenever a live flow changes:

- **`src/journeyMapSeeds.ts`** — refresh the open-event journey-map seed nodes to show assignment at
  row creation and the two fee outcomes. The `sync-map` skill pushes the committed seed to the live
  `journey_maps` rows.
- **`src/TeamOnboarding.tsx` / `TeamOnboardingLevels.tsx` / `TeamOnboardingMocks.tsx`** — the core-team
  onboarding teaches marketers how leads reach them. "You only get open-event leads when they ask a
  doubt" is about to become false. Update the lesson copy and any practice simulators that model it.
- Consider a roadmap card written in plain business English (the `cleanup-roadmap` skill / the
  `roadmap-card-plain-english` convention) — the release trigger will auto-create a boilerplate one
  on push.

---

## 5. Test plan

Run all of it against prod with test phones `90000000xx`, and delete every test row afterwards.
Warn the owner first: application and doubt inserts fire **real admin push notifications**.

| # | Scenario | Setup | Expected |
|---|---|---|---|
| 1 | Self-serve close | New open-event application, phone `9000000093`, no doubt, no abandon, then flip to `fully_paid` via service role | `assigned_marketer_id` set at insert; one `marketer_sales` row at **half** the event fee |
| 2 | Doubt then pays | Doubt row first, then application, then `fully_paid` | One `marketer_sales` row at **full** fee; app inherits the doubt's marketer |
| 3 | Abandoned then pays | Application with `cart_abandoned = true`, then `fully_paid` | **Full** fee |
| 4 | Failed payment then pays | Insert a `payu_payments` row with `status='failure'` for the phone+event, then `fully_paid` | **Full** fee |
| 5 | Never pays | Application left `pending` | Assigned, **no** `marketer_sales` row |
| 6 | Doubt *after* payment | Test 1, then insert a doubt, then re-run the update | Still exactly one sale row, still **half** — `ON CONFLICT` holds |
| 7 | Invite event untouched | Full invite flow through `fully_paid` | Assigned as before; **full** fee; no halving |
| 8 | No marketers mapped | Open event with an empty `event_marketers` | Lead inserts fine, `assigned_marketer_id` NULL, no crash |
| 9 | Reshuffle | `force_reshuffle_event_marketers()` on the open event | Unpaid leads redealt; **paid leads keep their existing owner** |

Cleanup afterwards:

```sql
DELETE FROM marketer_sales WHERE application_id IN
  (SELECT id FROM applications WHERE phone LIKE '90000000%');
DELETE FROM applications      WHERE phone LIKE '90000000%' RETURNING id, name;
DELETE FROM doubt_submissions WHERE phone LIKE '90000000%' RETURNING id;
DELETE FROM payu_payments     WHERE phone LIKE '90000000%' RETURNING id;
```

---

## 6. Out of scope — do not build these

- **Any rescue-attribution mechanism.** No `contacted_at`, no "who recovered this" flag, no third
  fee tier. Explicitly rejected — §1.3.
- **A second fee column on `events`.** The halving is computed. One number per event stays one
  number per event.
- **Edge-function changes.** Nothing here needs `create-payu-order`, `payu-callback`,
  `cart-abandonment`, or `open-event-otp`. If you think you need one, you've taken a wrong turn —
  stop and ask.
- **Retroactive commission** for the three already-paid Kovalam tickets, unless the owner says
  otherwise in §7 Q2.
- **Refund reversal.** The model says a refunded ticket should reverse its fee, but there is no
  refund flow in the system today (paid statuses are guarded and corrections are manual). Leave it;
  raise it as a future item.
- **Changing invite-event behaviour in any way.**

---

## 7. Open questions for the owner — ask before Phase 2

1. **Confirm the fee.** `sunrise-at-kovalam` currently has `marketer_commission = 50.00`, so this
   ships as ₹50 worked / ₹25 self-serve. Keep, or change the full fee? (The interactive calculator in
   the companion artifact shows any other figure.)
2. **The three already-paid Kovalam tickets** get an owner in Phase 3b but no commission, since the
   payment already happened. Recommended: leave it — nobody did the work. Confirm.
3. **Every open event needs at least one marketer mapped** in `event_marketers` from now on, or its
   leads stay unowned. Should this become a warning in the event editor?
4. **Refunds** (§6) — park for later, or is there an existing manual process the fee should follow?
