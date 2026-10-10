# Automated testing — proposal & build handoff

**Written:** 2026-08-15
**Status:** NOT BUILT — proposal only. Nothing in this document has been implemented.
**Audience:** a future Claude session (or any developer) building this, plus the founder deciding whether to.

This file is deliberately self-contained. A fresh session should be able to build Phase 1 and 2
from this document alone, without re-exploring the codebase.

---

## 0. Why this exists

chapter அ is a live payments application. Today the entire safety net under it is:

| Layer | Present? | What it actually proves |
|---|---|---|
| Type checking (`tsc --noEmit`) | ✅ | No misspelled fields, no wrong types. **Not** that the logic is right. |
| Automated tests | ❌ | — |
| Manual checking | ✅ | Whatever the founder happened to click that day |
| Sentry | ✅ | Tells you a customer already hit the bug |
| `verify-pending-payments` cron | ✅ | Reconciles against PayU — a production test in disguise |

`package.json` currently has exactly one test script, `test:aisensy-deeplink`, which pings a
third-party API. There is no test runner installed.

The consequence is not that the app is broken — it demonstrably works. The consequence is that
**a change in one file can silently break something two files away**, and the only detection
mechanism is a customer complaining. That is why every push carries dread, and why the app is
changed carefully rather than confidently.

### Bugs that have already happened, that tests would have caught

These are not hypotheticals. Each is recorded in the repo's own history or memory notes:

1. **2026-08-02 — manager commission paid the wrong person.** A late/bulk `fully_paid` flip
   resolved the manager live at payment time instead of using the manager pinned at lead time.
   → a database test on `accrue_manager_sale` catches this.
2. **2026-08-14 — a duplicate PayU callback.** One ₹367.69 ticket delivered the identical
   callback twice, three minutes apart. → an integration test on `payu-callback` catches this.
3. **Creator commission displayed as two different numbers on one screen** (₹26.93 vs ₹27).
   → a unit test on `formatCreatorEarn` catches this.
4. **Form Open Rate above 100%** — two funnel steps counted in different units (sessions vs rows).
   → a database test on the analytics RPC catches this.
5. **`resolve_event_slug` whitespace bug** and **title drift after event renames** leaving 12/39
   doubts unowned. → database tests catch both.

---

## 1. Constraints specific to this project

Read these before writing a single test. They are the reason this proposal is shaped the way it is.

1. **There is only ONE database, and it is production with live customers.**
   `npm run dev` talks to prod. Any test that writes rows would write them next to real bookings.
   **This is the single biggest blocker** and it gates Phases 3–6.
2. **Test rows use phone `90000000xx`** (existing project convention). Any test that must touch
   real data uses that range and cleans up after itself.
3. **Never mutate rows whose status is `advance_paid` / `fully_paid`.** Guard every test UPDATE
   with `status not in ('advance_paid','fully_paid')`.
4. **Edge functions are deployed by the owner, never by an agent.** Tests must not deploy.
5. **Pushing to `main` deploys the live site.** CI must be wired so a failing test *blocks* the
   deploy rather than reporting after the fact.
6. Admin and marketer views sit behind Google login and are **not drivable in the preview
   browser** — E2E coverage of those surfaces is impractical and is deliberately out of scope.

---

## 2. The ladder

```
 5  SYNTHETIC MONITORING   robot books a real ticket hourly in prod      Phase 6
 4  END-TO-END             robot browser walks the booking flow          Phase 5
 3  INTEGRATION            call an edge function, assert what it did     Phase 4
 2  DATABASE               assert triggers & RPCs behave                 Phase 3
 1  UNIT                   assert one function's maths                   Phase 1
 0  TYPE CHECK             tsc --noEmit                                  ✅ exists
```

Industry rule of thumb: **many level-1, some level-2/3, very few level-4.** Teams that invert
this end up with slow, flaky suites they learn to ignore — worse than having none.

---

## 3. Phase 1 — Unit tests (do this first)

**Effort:** half a day · **Risk to production: zero** · **Prerequisite: none**

No database, no network, no browser. Pure functions only. Runs in under a second.

### 3.1 Setup

- Install **Vitest** (it shares Vite's config, so it fits this project with almost no setup) and
  **jsdom** or **happy-dom** for the two files that touch `sessionStorage`/`window`.
- Pin versions compatible with the project's Vite 6 / TypeScript 5.8 — the builder resolves this
  at install time; do not assume a version number from this document.
- Add `vitest.config.ts` (or extend `vite.config.ts`) with `environment: 'node'` by default and
  `jsdom` only for the files that need it.
- Tests live in `src/__tests__/` or beside each file as `*.test.ts`. Pick one and be consistent.
- Add to `package.json`:
  ```json
  "test": "vitest run",
  "test:watch": "vitest"
  ```
  (`npm test` is currently unused — `test:aisensy-deeplink` is separate and should stay separate,
  since it hits a live third-party API and must never run in CI.)

### 3.2 `src/eventPricing.ts` — highest value, ~12 tests

| # | Test | Expected |
|---|---|---|
| 1 | Flat creator fee beats percentage | `resolveCreatorEarn({affiliateCommission:300, affiliateCommissionPct:8}, 5000)` → `300` |
| 2 | Falls back to percentage with no flat fee | `({affiliateCommissionPct:8}, 5000)` → `400` |
| 3 | snake_case works identically | `({affiliate_commission:300}, 5000)` → `300` |
| 4 | No commission configured | `({}, 5000)` → `0` |
| 5 | Zero/negative/garbage treated as unset | `({affiliateCommission:0, affiliateCommissionPct:8}, 5000)` → `400` |
| 6 | City price overrides plan price | cities `['Bangalore']` + `cityDetails.Bangalore.price_full=6500`, `priceFull=5000` → `6500` |
| 7 | City match is case-insensitive | cities `['bangalore']`, details key `'Bangalore'` → city price wins |
| 8 | `'Other'` is skipped when picking the first city | cities `['Other','Chennai']` → uses Chennai |
| 9 | City exists but has no price → plan price | → `5000` |
| 10 | No cities at all → plan price | → `5000` |
| 11 | Nothing configured → `0` | → `0` |
| 12 | `formatCreatorEarn` paise rule | `26.93` → `'₹26.93'`, `50` → `'₹50'` (**not** `'₹50.00'`), `100000` → `'₹1,00,000'` |

Test 12 is the regression test for a bug that actually shipped. Keep the comment explaining that.

### 3.3 `src/dateKeys.ts` — subtle, ~10 tests

This file is the most bug-prone pure code in the app: regex date parsing plus **year inference**.

| # | Test | Expected |
|---|---|---|
| 1 | `isoDateKey('2026-08-16')` | `20260816` |
| 2 | `isoDateKey` rejects junk / empty / null | `null` |
| 3 | `isoDateKey` rejects impossible dates (`'2026-02-30'`) | `null` — the round-trip check catches it |
| 4 | `payuTripDateKey` with embedded ISO | `{trip_date:'2026-08-16'}` → `20260816` |
| 5 | Human format, short month | `'Sun, Aug 16th'` + `created_at` Aug 2026 → `20260816` |
| 6 | Human format, long month | `'Sunday, August 16th'` → same |
| 7 | Explicit year in the text wins over inference | `'Aug 16th, 2027'` → `20270816` |
| 8 | **Year rollover** — created Dec 2026, trip `'Jan 5th'` | → `20270105`, not `20260105` |
| 9 | Same-day boundary — created Aug 16, trip `'Aug 16th'` | → `20260816` (`>=`, not `>`) |
| 10 | Unparseable / missing `created_at` | `null` |

Test 8 is the one that matters. Get it wrong and a December booking for a January trip lands in
the wrong year, which corrupts every per-date report.

`dateKeyInTimeZone` needs a fixed `Date` and an explicit zone (`'Asia/Kolkata'`); assert it does
not shift the calendar day. Do **not** rely on the machine's local timezone anywhere.

### 3.4 `src/affiliate.ts` — `normalizeHandle` only, ~6 tests

`normalizeHandle` is pure. The rest of the file touches `window`/`sessionStorage`/Supabase —
cover those in Phase 5 or not at all.

| Test | Expected |
|---|---|
| Strips a leading `@` | `'@Krutesh'` → `'krutesh'` |
| Lowercases | `'KRUTESH'` → `'krutesh'` |
| Strips disallowed characters | `'kru tesh!'` → `'krutesh'` |
| Keeps dot and underscore | `'kru.te_sh'` → `'kru.te_sh'` |
| Truncates to 40 chars | 60-char input → 40 chars |
| `null` / `undefined` / `''` | `''` |

**Important:** the file's comment says this must match the DB `affiliates_handle_format` CHECK
constraint. The test should state that in a comment so the two are kept in step.

### 3.5 `src/attribution.ts` — needs jsdom, ~6 tests

| Test | Expected |
|---|---|
| Captures utm params from the URL into sessionStorage | stored object has them |
| Captures `fbclid` | stored |
| Truncates values over 200 chars | 200 |
| A bare URL does NOT erase a stored attribution | previous value survives |
| A second URL WITH params overwrites | re-attributed to the newer ad |
| `getAttribution()` merges in the creator ref, returns `null` when empty | per the file's own comment |

The "bare URL must not erase" case protects against the Instagram back-button history rewrites,
which call `replaceState` — this is a real interaction between two systems and worth locking down.

### 3.6 `supabase/functions/payu-callback/index.ts` — `isStaleStatus`, ~5 tests

This is the replay-safety guard added on 2026-08-14, currently a module-private function at
around line 599. **It must be exported to be testable** — that is the only source change Phase 1
requires, and it is a one-word edit.

| Current | Incoming | Expected | Meaning |
|---|---|---|---|
| `fully_paid` | `advance_paid` | `true` (stale — ignore) | **the damage case** |
| `advance_paid` | `advance_paid` | `false` | harmless replay of the current result |
| `advance_paid` | `fully_paid` | `false` | legitimate forward move |
| `null` / `pending` | `advance_paid` | `false` | first payment |
| unknown status string | anything | `false` | unranked never blocks |

Row 1 is the bug from 2026-08-14. This is the single most valuable unit test in the proposal:
five lines of test protecting against un-paying a customer who has settled in full.

### 3.7 Explicitly NOT in Phase 1

Do not unit-test React components. Do not chase a coverage percentage. Do not test
`App.tsx`/`AppFlow.tsx`/`AdminPanel.tsx` — they are 5k–6.6k-line files whose logic is tangled
with rendering, and testing them meaningfully requires the refactor described in §9. Skipping
them is the right call, not a compromise.

---

## 4. Phase 2 — Wire into CI (do this immediately after Phase 1)

**Effort:** ~1 hour · **Risk: zero** · **Prerequisite: Phase 1**

Without this, tests exist but nobody runs them, which is the same as not having them.

- Add a new workflow, e.g. `.github/workflows/test.yml` (do **not** modify
  `.github/workflows/log-release.yml` — it has a different job and its own secret).
- Trigger: `on: [push, pull_request]`.
- Steps: checkout → setup Node → `npm ci` → `npm run lint` (that's `tsc --noEmit`) → `npm test`.
- **Do not** run `test:aisensy-deeplink` in CI — it hits a live API and needs a real key.
- Then, in the Vercel project settings, make the production deploy depend on this check passing.
  *This is a dashboard change the owner must make; an agent cannot and should not do it.*

Result: a push that breaks the commission maths **does not reach customers**. The site stays on
the last good version and an email arrives instead of a support message.

**Optional:** add `npm test` to `.githooks/pre-commit`. Recommended *against* initially — the
existing hook is a fast secret scan, and making commits slow encourages `--no-verify`, which
would also bypass the secret scanner. CI is the right gate.

---

## 5. Phase 3 — Database tests (highest value overall, needs a test DB)

**Effort:** half a day for the branch + 1 day for the tests · **Prerequisite: §5.1**

The app's real intelligence lives in the database: **150 functions and 22 triggers**. None of it
is reachable from Phase 1.

### 5.1 Prerequisite — a database that is not production

Use **Supabase branches**: a throwaway copy of the schema, created from the 130 migration files,
hammered with fake data, then deleted. Nothing else in this proposal matters as much as this
step, and it also makes ordinary development safer (no more real admin push notifications fired
by local clicking).

The branch must be created and torn down by the test run, never left lying around. Confirm cost
implications with the owner before enabling — Supabase branches are a paid feature on some plans.

### 5.2 Tests, in priority order

**A. Commission attribution — `accrue_marketer_sale`, `accrue_manager_sale`, `accrue_affiliate_sale`**

The 2026-08-02 bug lives here. Assert:

1. Flipping an application to `fully_paid` creates **exactly one** commission row.
2. It credits `applications.assigned_marketer_id` / `assigned_manager_id` — **the pinned value**,
   not whoever is currently mapped to the event.
3. Changing the event's marketers *after* payment does **not** move the commission.
4. Flipping to `fully_paid` twice does not double-accrue.
5. Manager accrual is ₹35 (per the manager-role design).
6. Affiliate accrual matches `resolveCreatorEarn` — **flat fee wins over percentage**, mirroring
   the TypeScript. The `eventPricing.ts` comment says these two must stay in step; this test is
   what enforces it.

**B. Round-robin assignment — `pick_marketer_round_robin`**

Verified behaviour: it aggregates active marketers for the event ordered by id, counts
applications on that event with a non-null `assigned_marketer_id`, and returns
`marketers[(count % n) + 1]`.

1. Three marketers, three applications → one each.
2. Fourth application wraps back to the first.
3. An inactive marketer is never picked.
4. No marketers mapped → returns `NULL` (must not error).
5. Deactivating a marketer mid-sequence does not crash the next assignment.

**C. The paid-status guard — `guard_paid_status_change`**

1. An UPDATE attempting to move `fully_paid` → `pending` is blocked.
2. `pending` → `advance_paid` → `fully_paid` is allowed.
3. `redistribute_event_marketers` re-stamps only rows whose
   `status NOT IN ('advance_paid','fully_paid','rejected')`.

**D. The audit log — `log_application_change` / `trg_zz_log_application_change`**

1. Changing `status`, `selected_date`, marketer, manager, affiliate, `call_status`,
   `cart_abandoned`, `recovered_at`, city or pickup each writes an `application_events` row.
2. A change that touches none of those writes nothing.
3. **The trigger swallows exceptions** — deliberately, so logging can never roll back a booking.
   Test that a deliberately broken log attempt still lets the booking write succeed. This is the
   most important test in group D.
4. `anon` and `authenticated` cannot INSERT/UPDATE/DELETE/**TRUNCATE** `application_events`.

**E. RLS — the security boundary**

For each of `applications`, `invited_numbers`, `invite_payment_submissions`: assert an `anon`
client gets **zero rows**, not an error. Then assert the same data *is* reachable through
`get-user-context` and the `event_booking_counts` RPCs. This test is the proof that a leaked URL
cannot expose customer data.

**F. Slug/title resolution — `resolve_event_slug`**

1. Leading/trailing whitespace is tolerated (a real bug, fixed 2026-08-04).
2. Resolution prefers `event_id` over title (the title-drift bug that left 12/39 doubts unowned).
3. A renamed event still resolves for existing rows.

**G. Analytics unit correctness — `get_conversion_funnel` / `get_analytics_summary`**

Seed a known fixture (e.g. 10 sessions, 6 form opens, 3 payments) and assert every rate is
between 0 and 100 and that each ratio divides **like units** — sessions/sessions, phones/phones,
rows/rows. This is the guard against the >100% bug recurring.

**H. Rate limiting — `check_rate_limit`**

OTP limits are per-channel: WhatsApp 2/10min keyed by phone, email 2/10min keyed by email.
Assert the third attempt within the window is refused and that the two channels count separately.

---

## 6. Phase 4 — Edge-function integration tests

**Effort:** 1–2 days · **Prerequisite: Phase 3**

Call a function with a crafted request; assert what it wrote. Fiddly because PayU signatures must
be forged with the test salt and WhatsApp/email must be stubbed so **no real message is sent**.

Priority order:

1. **`payu-callback` idempotency** — the same success payload twice produces one booking, one
   status change, one WhatsApp send. This is the 2026-08-14 bug end-to-end, above the
   `isStaleStatus` unit test.
2. **`payu-callback` stale replay** — an old `advance_paid` callback arriving after `fully_paid`
   leaves the booking at `fully_paid` and sends nothing.
3. **Hash verification** — a payload with a wrong/absent hash is rejected outright. Security test.
4. **`create-payu-order` OTP gate** — a new open-event ticket without a verified OTP session is
   refused; the two deliberate skips (a prior `payu_payments` row for this event+phone, or a
   matching `doubt_submissions` row on event+phone+email) are accepted; **an existing
   `applications` row is NOT accepted** (anon can self-INSERT a `pending` row — this is the
   deliberate design and the test must lock it in).
5. **`create-payu-order` server-trusted pricing** — a tampered client-supplied amount is ignored
   and the server's own price is used. Security test.
6. **`open-event-otp` concurrency** — the atomic `FOR UPDATE` verify path caps a flood of
   concurrent attempts (the July 2026 fix; it was verified once by hand at 40 concurrent → capped
   at 5; this makes that permanent).

Stub every outbound call (AiSensy, Brevo, push). A test that sends a real WhatsApp message to a
real customer is worse than no test.

---

## 7. Phase 5 — End-to-end browser test

**Effort:** 2–3 days + ongoing maintenance · **Prerequisite: Phase 3**

**Recommendation: exactly ONE test, the open-event happy path.** Not twenty. One test that says
"the site is fundamentally alive" captures most of the value; each additional one adds
maintenance cost and flakiness.

- **Tool:** Playwright.
- **Path:** `/plans` → open a plan → pick a date → details form → OTP → bill page → PayU test
  card → return → assert an `applications` row reached `advance_paid` and the receipt renders.
- **Two obstacles, both solvable:**
  - *OTP goes to WhatsApp.* The test cannot read WhatsApp. Read the code directly from
    `open_event_otp_sessions` on the branch DB — test-environment only, never a production path.
  - *Payment goes to PayU.* Use PayU's sandbox credentials and test cards.
- Use a phone in the `90000000xx` range and delete the rows afterwards.
- Run **nightly**, not on every push — it is too slow and too flaky to gate deploys on.
- Also worth one mobile-viewport run: this is a mobile-first app and ~all traffic is from
  Instagram.

**Out of scope:** admin and marketer flows (login-gated, not drivable), and the invite-only flow
(needs a seeded invite; add later if the open-event test proves stable).

---

## 8. Phase 6 — Synthetic monitoring

**Effort:** half a day · **Prerequisite: Phase 5**

Reuse the Playwright test, point it at **production**, run it hourly against a hidden test event,
alert the founder on failure via the existing `send-admin-push` path.

This is arguably the best fit for this app, because it catches the failures a test environment
never sees: AiSensy changing a template, PayU having an outage, a Supabase key expiring, the SSL
certificate lapsing, a Vercel deploy half-succeeding.

Requires a permanently hidden test event and a cleanup job that deletes synthetic bookings —
otherwise they pollute every analytics figure. **Decide with the owner how synthetic rows are
excluded from reporting before building this.** Suggested: a dedicated event slug filtered out of
every analytics RPC.

---

## 9. Related work this proposal does NOT cover

- **`App.tsx` (5,148 lines), `AppFlow.tsx` (~5.2k), `AdminPanel.tsx` (~6.6k).** Their size is why
  component-level testing is impractical. Splitting them is a separate, larger project. Extracting
  pure logic out of them into small files *as an ongoing habit* would grow Phase 1 coverage for
  free — but do not start that refactor as part of this work.
- **Visual regression testing.** The `.codex-qa/` folder shows this is already done by hand with
  before/after screenshots. Automating it (Playwright screenshot diffing) is possible but low
  priority and generates constant false positives on a design that still changes often.
- **Load testing.** Not warranted at current volume.

---

## 10. Effort and value summary

| Phase | What | Effort | Prod risk | Value | Blocks deploy? |
|---|---|---|---|---|---|
| 1 | Vitest + ~40 unit tests | **½ day** | none | high | — |
| 2 | CI wiring | **1 hr** | none | high | ✅ yes |
| 3a | Supabase test branch | **½ day** | none | unlocks 3–6 | — |
| 3b | ~25 database tests | **1 day** | none | **highest** | ✅ yes |
| 4 | Edge-function integration | **1–2 days** | none | high | ✅ yes |
| 5 | One Playwright E2E | **2–3 days** | low | moderate | ❌ nightly |
| 6 | Hourly synthetic booking | **½ day** | low | high | ❌ alerts |

**Phases 1 + 2 together are one afternoon**, need no test database, touch no existing files except
one `export` keyword in `payu-callback`, and carry zero production risk. That is the recommended
starting point and it can be done in isolation, any time.

**Phase 3b is where the real protection is**, because that is where the app's real logic lives.

---

## 11. Decision checklist for the founder

Answer these before a build session starts:

1. **Phases 1 + 2 only, or the full ladder?** (Recommend: 1 + 2 now, decide the rest after seeing
   them work.)
2. **Are Supabase branches available and acceptable on the current plan?** Check the cost. This
   gates everything from Phase 3 onward.
3. **Should a failing test block the Vercel production deploy?** (Recommend: yes — but it means a
   broken test stops shipping until it is fixed.)
4. **Is a PayU sandbox account available?** Needed for Phases 4–5.
5. **For Phase 6: how should synthetic bookings be excluded from analytics?**
6. **Who fixes a failing test at 11pm?** If the honest answer is "Claude, next session", that is
   fine — but it argues for fewer, more meaningful tests rather than many brittle ones.

---

## 12. Build notes for the agent picking this up

- Read `CLAUDE.md` first — the golden safety rules and the deploy-hold status take precedence
  over anything written here.
- `npx tsc --noEmit` must pass after every edit, as always.
- Phase 1 adds only new files, plus one `export` in `supabase/functions/payu-callback/index.ts`.
  **Do not deploy that function** — the export changes nothing at runtime and can ride along with
  the owner's next deploy.
- Commit per the project convention: one concern per commit, message explains the *why*.
- Do not push without explicit go-ahead in that conversation turn.
- Write the tests in plain, readable style — they double as documentation of the money rules for
  a founder who is learning to read code. Name them as sentences
  (`'a flat creator fee beats the percentage'`), not as `test1`.
