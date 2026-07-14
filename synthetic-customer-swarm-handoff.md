# Synthetic Customer Swarm — Detailed Build Handoff

**Status:** Proposal / build specification only. Nothing in this document is implemented yet.

**Written:** 2026-07-13

**Audience:** A future Claude Code session building the feature for a no-code founder.

**Repository:** Chaptera — React 19 + Vite + TypeScript frontend, Supabase/Postgres backend, Supabase Edge Functions, PayU payments, AiSensy WhatsApp, Brevo email, PWA/web push.

---

## 0. Read this first

Before changing anything, read these files completely or in the targeted ranges described by `CLAUDE.md`:

1. `CLAUDE.md` — production safety rules and current file map.
2. `HANDOFF.md` — application routes and payment flows.
3. `OPEN-EVENTS-HANDOFF.md` — open-event lifecycle and PayU flow.
4. `AFFILIATE-LINKS-HANDOFF.md` — creator attribution and commission side effects.
5. `multi-marketer.md` — assignment and marketer commission triggers.
6. `pwa.md` — installed-app, push and dormant chat infrastructure.
7. `supabase/migrations/20260709_purger_multi_passcode.sql` — existing scan/purge behaviour.
8. `src/AppFlow.tsx` — `/plans`, preview-event loading, open booking, OTP and application creation. Read targeted sections, not the entire file.
9. `src/App.tsx` — invite flow, `/myplans`, PayU return screen and routing. Read targeted sections.
10. `src/PaymentOverlay.tsx` — bill-open tracking and `create-payu-order` request.
11. `supabase/functions/create-payu-order/index.ts`.
12. `supabase/functions/payu-callback/index.ts`.
13. `supabase/functions/payu-webhook/index.ts`.
14. `supabase/functions/verify-pending-payments/index.ts`.
15. `supabase/functions/open-event-otp/index.ts`.
16. `src/AdminPanel.tsx` only around event preview, PayU-mode banner, test-data purger, release log and roadmap integration.

Do not trust line numbers in this handoff forever. Anchor on component and function names.

### Existing rules that remain non-negotiable

- The connected Supabase database contains live production customers.
- Test customer phones must use the reserved `90000000xx` range.
- Never mutate a real `advance_paid` or `fully_paid` row.
- Never push to `main` without the founder explicitly approving the push in that conversation.
- Never deploy Edge Functions without explicit approval. Write them and provide deployment commands.
- Local `npm run dev` currently talks to production Supabase.
- After frontend changes, `npx tsc --noEmit` must pass.
- Use isolated commits, one concern per commit.
- The founder is no-code. Provide plain-English run instructions and an admin-facing result wherever practical.

---

## 1. The idea in one paragraph

The Synthetic Customer Swarm is a deterministic browser-testing system. It launches a real browser, behaves like several predefined fake customers, completes important Chaptera journeys, checks the visible result and relevant database result, captures screenshots/traces, and produces a pass/fail report. It is not a chatbot and does not require an AI API at runtime. AI is useful while authoring new tests and optionally summarising failures, but every actual pass/fail assertion must be deterministic.

Examples of synthetic customers:

- A new open-event buyer.
- An invite-only applicant.
- An approved invitee paying an advance.
- A balance payer.
- A failed-payment returner.
- A buyer arriving through a creator link.
- An own-transport or multi-pickup buyer.
- An email-OTP fallback user.

The browser automation should use Playwright. A cron or GitHub Actions schedule may start a run, but the browser scripts themselves perform the journey.

---

## 2. Founder-facing mental model

Think of each test as a robot intern with a checklist:

1. Open the website.
2. Select a city and event.
3. Pick a date and pickup point.
4. enter fake customer details.
5. Reach the bill.
6. Simulate a payment outcome when needed.
7. Confirm the correct screen appears.
8. Confirm the expected test rows exist in Supabase.
9. Capture screenshots and a browser trace.
10. Delete the test rows.
11. Report pass or fail in simple English.

There is no free-form agent deciding what to do. The robot follows a fixed script. If the expected button, amount, state or database row is missing, the test fails.

---

## 3. Goals

### Primary goals

1. Detect customer-flow breakage before or immediately after a release.
2. Cover Chaptera-specific edge cases that generic uptime monitoring cannot catch.
3. Make failures understandable to a no-code founder through screenshots and plain-English step names.
4. Verify both browser behaviour and production-database writes using reserved test identities.
5. Continue functioning without any AI API after the initial build.
6. Leave no persistent test data after a successful run.
7. Prevent synthetic runs from messaging real people, paying real commissions, consuming real event capacity or polluting long-term analytics.

### Secondary goals

- Allow a manual run from a terminal or GitHub Actions.
- Later attach results to the product roadmap / release log.
- Later run a small nightly smoke pack.
- Make it easy to add one new persona without rewriting the harness.

---

## 4. Non-goals for version 1

- Pixel-perfect visual regression testing across every screen.
- Testing every browser engine. Start with Chromium/mobile emulation.
- Real-money PayU transactions.
- Sending real WhatsApp, email or web-push messages.
- Testing AiSensy or Brevo delivery end to end.
- Automatically repairing a failure.
- Letting AI decide whether a test passed.
- Testing admin UI through a shared production login in CI.
- Running dozens of concurrent buyers against production.
- Replacing human acceptance testing for new designs.

---

## 5. Important decision: use the real database, but not uncontrolled live side effects

The founder accepts writing test rows to the real Supabase database because reserved phone numbers can be purged. That is acceptable only with the following distinction:

### Safe to write and purge later

- Fake applications.
- Fake doubt rows.
- Fake PayU pending rows.
- Fake invited-number rows.
- Fake bill-open rows.
- Fake OTP-session rows.
- Synthetic run/result rows.

### Not safe to “undo later”

- A WhatsApp or email already delivered.
- A creator or marketer commission shown as earned.
- A real marketer being assigned and notified.
- A real event temporarily appearing fuller or sold out.
- A real admin push generated repeatedly.
- Analytics snapshots polluted before cleanup.
- Rate-limit budgets exhausted for a real IP/channel.
- A real PayU charge.

Therefore the design uses the real database but introduces **test fixtures and explicit side-effect suppression**.

---

## 6. Recommended architecture

```text
Manual command / GitHub Actions / nightly schedule
                       │
                       ▼
              Playwright test runner
                       │
        ┌──────────────┼─────────────────┐
        │              │                 │
        ▼              ▼                 ▼
  Preview website   Supabase DB     Test-control function
  real frontend     real project    secret-authenticated
        │              │                 │
        └──────────────┼─────────────────┘
                       ▼
            Screenshots + traces + results
                       │
                       ▼
               Guaranteed cleanup
                       │
                       ▼
          HTML report / Actions artifact
```

### Runtime components

1. **Playwright runner** — controls Chromium and executes personas.
2. **Hidden fixture events** — inactive events visible only through existing preview-event flows.
3. **Swarm test-control Edge Function** — starts runs, mints short-lived browser tokens, simulates test-only payment outcomes, performs scoped verification and cleans up.
4. **Synthetic test tables** — record run status, persona status and readable step results.
5. **Side-effect guards** — suppress real messages, commissions, marketer assignment, admin pushes and long-term metric pollution for test identities.
6. **Reporter** — Playwright HTML report plus a compact founder-readable summary.

---

## 7. Use Playwright, not an AI browser agent

Add Playwright as a pinned dev dependency and commit the lockfile.

Suggested commands after checking the currently supported package version:

```bash
npm install --save-dev --save-exact @playwright/test@<verified-version>
npx playwright install chromium
```

Do not guess the current Playwright version. Check official documentation before installing.

### Why Playwright

- Stable semantic locators.
- Mobile-device emulation.
- Request/response inspection.
- Screenshots, video and execution traces.
- Ability to add a short-lived `x-chaptera-swarm-token` header to browser requests.
- Ability to block PayU navigation while still verifying that the order was created.
- HTML reports without building a custom reporting UI in version 1.

### The tests must not depend on AI

Good assertion:

```ts
await expect(page.getByText('Payment successful')).toBeVisible();
expect(paymentRow.status).toBe('success');
```

Bad assertion:

```ts
const answer = await askAI('Does this page look successful?');
expect(answer).toContain('yes');
```

AI may later explain why a deterministic assertion failed, but it must not be the source of truth.

---

## 8. Proposed file structure

```text
tests/
  swarm/
    README.md
    playwright.config.ts
    global-setup.ts
    global-teardown.ts
    env.ts
    fixtures/
      swarmFixture.ts
      personas.ts
      database.ts
      testControl.ts
    pages/
      PlansPage.ts
      EventDetailsPage.ts
      BookingChatPage.ts
      OtpPage.ts
      PaymentPage.ts
      PayuReturnPage.ts
      InvitePage.ts
      MyPlansPage.ts
    specs/
      smoke.spec.ts
      open-booking.spec.ts
      invite-application.spec.ts
      advance-payment.spec.ts
      balance-payment.spec.ts
      failed-payment-retry.spec.ts
      creator-attribution.spec.ts
    reporters/
      founder-summary.ts
    utils/
      ids.ts
      redact.ts
      assertions.ts
      artifacts.ts

supabase/functions/
  swarm-test-control/
    index.ts

supabase/migrations/
  <created-by-supabase-cli>_synthetic_customer_swarm.sql

.github/workflows/
  synthetic-customer-swarm.yml       # Phase 4, not required for first local run
```

Add package scripts:

```json
{
  "test:swarm": "playwright test -c tests/swarm/playwright.config.ts",
  "test:swarm:smoke": "playwright test -c tests/swarm/playwright.config.ts tests/swarm/specs/smoke.spec.ts",
  "test:swarm:headed": "playwright test -c tests/swarm/playwright.config.ts --headed",
  "test:swarm:report": "playwright show-report tests/swarm/report"
}
```

Do not reuse `scripts/test-aisensy-deeplink.mjs`; it performs a real provider request unless dry-run mode is enabled and solves a different problem.

---

## 9. Stable selectors are a prerequisite

The current UI contains a great deal of conversational text that the founder edits. Tests should not locate critical controls only by exact marketing copy.

Add narrow `data-testid` attributes to important journey controls. These do not change customer appearance.

Suggested selectors:

```text
plans-city-selector
plans-event-card-{slug}
event-details-open
event-date-{yyyy-mm-dd}
event-book-cta
booking-name
booking-phone
booking-email
booking-city
booking-pickup-{id}
booking-own-transport
booking-submit-details
otp-code
otp-submit
payment-open
payment-amount
payment-phone
payment-email
payment-submit
payment-success
payment-failed
payment-retry
myplans-phone
myplans-submit
booking-status
```

Rules:

- Add only selectors needed by the tests.
- Do not encode volatile array indexes when a stable slug/id exists.
- Continue checking visible text for user-facing copy where the wording itself matters.
- Prefer role/label locators for accessible controls; use `data-testid` for dynamic chat controls that otherwise have unstable wording.

---

## 10. Test identities

### Reserved phone pool

Use only the reserved range:

```text
9000000001 – 9000000099
```

Suggested fixed allocation in version 1:

| Persona | Phone |
|---|---:|
| Smoke visitor / doubt | 9000000001 |
| Open booking | 9000000002 |
| Invite application | 9000000003 |
| Advance payment | 9000000004 |
| Balance payment | 9000000005 |
| Failed-payment retry | 9000000006 |
| Creator attribution | 9000000007 |
| Email OTP fallback | 9000000008 |
| Own transport | 9000000009 |
| Multi-pickup | 9000000010 |

### Emails

Use a domain that cannot deliver to a real inbox, for example:

```text
swarm+<persona>+<runid>@example.invalid
```

Do not use a real customer email. Do not use a Gmail address that might exist.

### Names

Prefix every name clearly:

```text
[SWARM] Open Buyer
[SWARM] Balance Buyer
```

### Browser session IDs

Modify test setup so every analytics session ID begins with:

```text
swarm_<run-id>_<persona>
```

This is required because `flow_analytics` and affiliate click records are session-based rather than phone-based. The existing phone purger cannot remove those rows unless the session identifier is also known.

---

## 11. Hidden fixture events

Do not run the first swarm version against a live customer event. Test applications can temporarily affect real capacity, marketer worklists and performance counts even if purged later.

### Schema addition

Add to `events`:

```sql
is_test_fixture boolean NOT NULL DEFAULT false
```

This column is internal and must not be writable by anonymous users.

### Fixture event set

Create hidden, inactive events through a versioned seed/migration or a strict-admin setup script:

1. `swarm-open-split` — open, split payment, two pickup points.
2. `swarm-open-full` — open, single payment.
3. `swarm-invite-split` — invite-only, split payment.
4. Optional `swarm-community` — WhatsApp/community flow.

Recommended properties:

- `is_active = false`.
- `is_test_fixture = true`.
- Obvious title prefix: `[SWARM FIXTURE]`.
- Far-future dates so normal date-expiry logic does not break unexpectedly.
- Small, deterministic prices such as ₹100 advance / ₹300 full.
- Two deterministic pickup points.
- Affiliate commissions disabled unless the attribution test explicitly needs to validate suppression.
- No real WhatsApp group URL.
- No real customer imagery required.

### Access path

The frontend already supports `?preview_event=<event-id-or-slug>` and the admin panel generates preview links for hidden events. Reuse that mechanism.

Normal customer discovery must continue excluding hidden fixtures.

### Payment exception

`create-payu-order` currently rejects `is_active=false`. Add a very narrow exception:

An inactive event may create an order only when all are true:

1. `events.is_test_fixture = true`.
2. Phone is in the `90000000xx` range.
3. Request contains a valid short-lived `x-chaptera-swarm-token` tied to the active run.
4. Request origin is an allowed preview/local origin.
5. The requested event matches the test run’s registered fixture event.

No single condition is sufficient on its own.

---

## 12. Swarm authentication

Create a strong random permanent runner secret stored only in:

- Supabase Edge Function secret: `SWARM_RUNNER_SECRET`.
- Local `.env.swarm.local` ignored by Git.
- GitHub Actions secret in Phase 4.

Never put it in a `VITE_` environment variable; every `VITE_` value is public in the browser bundle.

### Permanent secret versus browser token

The permanent `SWARM_RUNNER_SECRET` must never enter Chromium, browser storage, frontend JavaScript, screenshots or Playwright traces.

At `start_run`, the Node runner authenticates directly to `swarm-test-control` with the permanent secret. The function returns a random, short-lived **browser token** that:

- Is scoped to one `run_id`.
- Expires after approximately 30 minutes.
- Is stored only as a hash in the database.
- Stops working immediately when the run finishes or cleanup begins.
- Can access only the fixture events and identities registered to that run.

The custom Playwright fixture reads this token from a temporary runtime file created by global setup and attaches it to browser requests:

```ts
await page.setExtraHTTPHeaders({
  'x-chaptera-swarm-token': runtime.browserToken
});
```

Playwright traces may capture request headers, so the token must be short-lived and invalidated at cleanup. Still avoid printing it in logs and exclude the temporary runtime file from Git.

Suggested temporary file:

```text
tests/swarm/.runtime/run.json
```

Add `.runtime/` to `.gitignore`, create it with owner-only file permissions where supported, and remove it during global teardown.

The Edge Function must compare the permanent secret and hashed browser tokens safely and return the same generic unauthorized response for missing, wrong or expired credentials.

---

## 13. Database schema

Create the migration using `supabase migration new synthetic_customer_swarm`; do not invent a timestamp manually.

### `synthetic_test_runs`

One row per swarm run.

```sql
id                    uuid primary key default gen_random_uuid()
run_key               text unique not null
trigger_type          text not null check in ('local','manual','release','scheduled')
base_url              text not null
git_sha               text
status                text not null check in ('created','running','passed','failed','cleanup_failed','cancelled')
started_at            timestamptz
finished_at           timestamptz
cleanup_started_at    timestamptz
cleanup_finished_at   timestamptz
browser_token_hash    text
browser_token_expires_at timestamptz
summary               jsonb not null default '{}'
created_at            timestamptz not null default now()
```

### `synthetic_test_cases`

One row per persona in a run.

```sql
id                    uuid primary key default gen_random_uuid()
run_id                uuid not null references synthetic_test_runs(id) on delete cascade
case_key              text not null
persona_label         text not null
phone                 text not null
session_id            text not null
fixture_event_slug    text
status                text not null check in ('queued','running','passed','failed','skipped')
failure_step          text
failure_message       text
duration_ms           integer
artifact_manifest     jsonb not null default '{}'
started_at            timestamptz
finished_at           timestamptz
unique(run_id, case_key)
```

### `synthetic_test_steps`

Readable step-level history.

```sql
id                    bigserial primary key
case_id               uuid not null references synthetic_test_cases(id) on delete cascade
step_order            integer not null
step_key              text not null
label                 text not null
status                text not null check in ('running','passed','failed','skipped')
expected              text
actual                text
details               jsonb not null default '{}'
started_at            timestamptz
finished_at           timestamptz
unique(case_id, step_order)
```

### `synthetic_test_identities`

Explicitly maps every test identity to a run so cleanup does not infer too broadly from a phone prefix.

```sql
id                    uuid primary key default gen_random_uuid()
run_id                uuid not null references synthetic_test_runs(id) on delete cascade
phone                 text not null
email                 text
session_id            text not null
fixture_event_slug    text
created_at            timestamptz not null default now()
unique(run_id, phone)
```

### Access model

- Enable RLS on all four tables.
- No anonymous policies.
- Strict admins may SELECT.
- The browser must not directly INSERT/UPDATE these tables.
- `swarm-test-control` writes using the service role after validating the swarm secret.
- Revoke default privileges explicitly.
- If using a `SECURITY DEFINER` function, revoke EXECUTE from `PUBLIC` immediately and prefer placing privileged helpers in an unexposed schema.

### Why store run rows in production

- The founder can see what ran even if the local terminal disappears.
- Failed cleanup is auditable.
- The future admin integration can read results without parsing GitHub artifacts.
- Cleanup is scoped to registered identities rather than “delete every 900 number.”

---

## 14. Swarm test-control Edge Function

Create `supabase/functions/swarm-test-control/index.ts` following the project’s CORS and JSON helper conventions.

### Required actions

#### `start_run`

Input:

```json
{
  "action": "start_run",
  "run_key": "20260713T120000Z-abc123",
  "trigger_type": "local",
  "base_url": "http://localhost:3000",
  "git_sha": "abc123",
  "cases": [
    {
      "case_key": "open_booking",
      "phone": "9000000002",
      "email": "swarm+open+abc123@example.invalid",
      "session_id": "swarm_abc123_open",
      "fixture_event_slug": "swarm-open-split"
    }
  ]
}
```

Behaviour:

- Validate the permanent runner secret.
- Validate every phone against the reserved pool.
- Validate every session starts with `swarm_`.
- Validate every event has `is_test_fixture=true`.
- Reject duplicate active use of the same phone.
- Insert run, cases and identities.
- Generate a cryptographically random browser token, store only its SHA-256 hash, and set a short expiry.
- Return `run_id`, the one-time raw browser token and `case_id` mapping to the Node runner.

#### `record_step`

- Update current case and insert/update step status.
- Cap string lengths.
- Never accept arbitrary SQL or filesystem paths.

#### `complete_case`

- Mark pass/fail and store a redacted artifact manifest.
- Artifact paths should be relative names such as `open-booking/trace.zip`, never machine-absolute paths.

#### `simulate_payment`

Input:

```json
{
  "action": "simulate_payment",
  "run_id": "...",
  "case_key": "advance_payment",
  "txnid": "...",
  "outcome": "success"
}
```

Strict validation:

1. Valid permanent runner secret from the Node process.
2. Active registered run.
3. `txnid` exists in `payu_payments`.
4. Payment phone matches the case’s registered test phone.
5. Payment event is a registered fixture with `is_test_fixture=true`.
6. Current payment is still pending unless the requested outcome is explicitly idempotent.
7. Application phone and event match the same case.

For version 1, the simulator may perform a test-only status transition that mirrors the expected callback result. Clearly document that this validates the booking UI and database consequences, not PayU’s external gateway.

Preferred later refactor: callback, webhook, payment verifier and test simulator call one well-tested internal finalization routine after their own authentication. Do not rush this refactor into the first commit; payment logic is production-critical.

#### `verify_case`

Return a bounded, PII-safe snapshot for the registered test identity only:

- Application status and selected date/city/pickup.
- PayU rows and amounts.
- Affiliate id and commission count.
- Marketer assignment and commission count.
- Bill-open flags.
- OTP-session existence.
- Relevant analytics event types for the registered session.

Never accept an arbitrary phone. Derive the phone from `run_id + case_key`.

#### `cleanup_run`

- Validate the permanent runner secret.
- Fetch identities registered to the run.
- Delete only rows belonging to those phones/session ids.
- Record per-table deleted counts.
- Resnapshot affected historical analytics days if required.
- Mark `cleanup_finished_at` and final cleanup status.
- Preserve the run/case/step result rows; delete the identity rows only if desired. The test report itself is the audit trail.

If cleanup is partial, mark `cleanup_failed` and return the remaining row counts. Never claim success because some deletions worked.

#### `finish_run`

- Aggregate case counts.
- Mark passed only if every required case passed and cleanup succeeded.
- A skipped optional case must not silently become passed.

### Function safety

- POST only, except OPTIONS.
- Strict origin allowlist plus the appropriate permanent secret or run-scoped token.
- `Cache-Control: no-store`.
- Request-size and field-length caps.
- Do not return service-role errors verbatim.
- Never log secrets, OTPs, full response headers or unredacted request bodies.
- Keep service-role key server-side only.

---

## 15. Test-mode OTP

Real OTP delivery is not required for the first swarm. Sending OTPs on every run wastes provider capacity and tests the provider more than the website.

Modify `open-event-otp` with a narrow swarm branch.

### Swarm OTP requirements

All must be true:

- Valid, unexpired `x-chaptera-swarm-token` tied to the registered run/case.
- Registered active run/case.
- Reserved test phone.
- Test fixture event.
- Allowed preview/local origin.

When true:

- Do not call AiSensy or Brevo.
- Use a fixed code such as `000000`, or return a run-specific code to the Playwright Node process.
- Still create/verify the normal OTP-session record so downstream order gating is exercised.
- Mark the session as synthetic if a schema field is added, or ensure it is discoverable through the registered phone/run.

When any condition is false, use the normal production OTP behaviour unchanged.

Never expose a fixed OTP for real events or non-test phones.

---

## 16. Payment testing strategy

### Version 1: test order creation + simulate outcome

The browser should exercise the real bill UI and real `create-payu-order` logic against a hidden fixture.

Test flow:

1. Reach the bill in the browser.
2. Start listening for the `create-payu-order` response.
3. Click the Pay button.
4. Capture and validate the response fields and server-calculated amount.
5. Abort navigation to the external PayU domain.
6. Call `swarm-test-control:simulate_payment` from the Playwright Node context.
7. Navigate the browser to the normal Chaptera return URL with the test transaction id and success/failed status.
8. Validate `PayUReturnScreen` and the resulting application context.

This validates:

- Browser bill behaviour.
- OTP gate.
- Server-authoritative amount calculation.
- Pending PayU row creation.
- Success/failure return UI.
- Application status consequences.
- Customer-context lookup.

It does not validate PayU’s external hosted page or signature callback. State this clearly in reports.

### Version 2: PayU sandbox contract test

Only after version 1 is stable, optionally run a separate low-frequency sandbox test when `PAYU_BASE_URL` is test mode. Do not switch the production function’s PayU base URL casually. This may require a separate deployed preview function/environment.

The admin panel already probes and displays PayU mode. The swarm should record the probe result at run start and refuse real-gateway automation unless the chosen test explicitly allows order creation without completing real payment.

### Absolute rule

The swarm must never submit a real charge on the live PayU gateway.

---

## 17. Side-effect suppression

Add one shared helper conceptually equivalent to:

```ts
isSyntheticTest({ phone, eventSlug, browserToken })
```

It must require a valid run-scoped browser token, registered test identity and test fixture. Phone prefix alone is not enough.

### Suppress for swarm cases

1. AiSensy WhatsApp sends.
2. Brevo email sends.
3. Customer web-push sends.
4. Admin push triggers.
5. Marketer assignment.
6. Marketer commission accrual.
7. Affiliate commission accrual.
8. Cart-abandonment cron sends.
9. Retarget-check sends.
10. Manager alerts and briefings based on test fixtures.
11. Performance dashboard financial totals.
12. Public capacity counts for real events (fixtures are separate, so this is naturally isolated).

### Still allow and verify

- The internal “would send” decision may be recorded in a synthetic step/result.
- Pending/success/failure application state.
- PayU test rows.
- Bill-open tracking.
- Attribution stamping.
- Analytics events tied to the synthetic session, followed by cleanup.

### How to test messaging logic without sending

Return or record a redacted `would_send` payload:

```json
{
  "channel": "whatsapp",
  "campaign": "advance_paid",
  "destination": "9000000004",
  "suppressed": true
}
```

Do not include provider API keys or arbitrary message bodies containing secrets.

---

## 18. Cleanup design

The existing `scan_phone_data(text[])` and `purge_phone_data(text[], passcode)` cover many phone-based tables and resnapshot affected days. They do not fully understand a swarm run or session-only analytics.

### Do not weaken the founder purger

- Keep the passcode gate.
- Do not expose the passcode to the test browser.
- Do not embed the passcode in GitHub workflow files.

### Add scoped automated cleanup

`cleanup_run` uses the service role after validating `SWARM_RUNNER_SECRET`, but may delete only identities registered in `synthetic_test_identities`.

Deletion coverage must be compared against the current schema at build time. At minimum inspect and cover:

- `marketer_sales` joined through test applications.
- `affiliate_sales` joined through test applications.
- `applications`.
- `payu_payments`.
- `invited_numbers`.
- `invite_payment_submissions`.
- `doubt_submissions`.
- `plan_doubts`.
- `doubt_messages` before `doubt_conversations` if foreign keys require it.
- `doubt_conversations`.
- `bill_opens`.
- `push_subscriptions`.
- `push_debug_logs`.
- `open_event_otp_sessions`.
- Email-event rows linked to the test application/email.
- Rate-limit rows keyed to test phone/email/session where safe and identifiable.
- `flow_analytics` where `session_id` equals the registered synthetic session.
- `affiliate_clicks` where the click session equals the registered synthetic session.
- Any newly introduced payment/message test log.

Do not delete by name prefix alone. Do not delete every `90000000xx` row indiscriminately. Delete only the identities registered to the run.

### Cleanup lifecycle

Playwright global teardown must call cleanup inside `finally`, even after test failures.

```ts
try {
  await runAllCases();
} finally {
  await cleanupRun(runId);
}
```

If the process is killed before teardown, a later cleanup job may find runs stuck in `running` for more than a safe threshold and clean only their registered identities.

### Manual fallback

The founder can use the existing admin test-data purger with the run’s phone list if automated cleanup fails. The run report must show the phone list and remaining table counts—but never the purge passcode.

---

## 19. Initial test personas

Build in this order.

### Persona 1 — public smoke visitor

Purpose: confirm that the basic customer surface loads.

Steps:

1. Open `/plans?preview_event=<swarm-open-split>`.
2. Confirm the plan UI renders.
3. Confirm event title, price, date and details can be opened.
4. Confirm no fatal console error.
5. Confirm privacy/terms routes return usable pages in a separate lightweight test.

Database writes: ideally none except synthetic analytics session rows.

### Persona 2 — open-event application to bill

Purpose: verify the main self-serve funnel.

Steps:

1. Open hidden open split-payment fixture.
2. Select city.
3. Select date.
4. Select pickup.
5. Choose “no doubt / book.”
6. Enter test identity.
7. Complete test OTP.
8. Reach bill.
9. Assert displayed advance and full price.
10. Assert `applications` row is pending with correct date/city/pickup.
11. Assert `bill_opens` exists after bill mount.

### Persona 3 — invite-only application

Purpose: verify curated application capture.

Steps:

1. Open hidden invite fixture through preview link.
2. Complete the application flow.
3. Assert pending application and selected date/pickup.
4. Assert no PayU row yet.
5. Assert no real WhatsApp/email/admin push was sent.

Do not automate admin approval in the first browser version. Use a strict test-control action to approve only the registered test application, or seed the invited state as setup for Persona 4.

### Persona 4 — advance-payment success

Purpose: verify the first paid state.

Setup:

- Registered invited test application for invite fixture, or open fixture pending application.

Steps:

1. Open the customer’s invitation/context route.
2. Open payment.
3. Assert advance amount.
4. Create order.
5. Simulate success.
6. Open return screen.
7. Assert application becomes `advance_paid` for split mode.
8. Assert payment row becomes successful.
9. Assert no real marketer/creator commission yet unless business logic says otherwise.
10. Assert confirmation communication was suppressed and recorded as `would_send`.

### Persona 5 — balance-payment success

Purpose: verify second payment and final state.

Setup:

- Test application in `advance_paid` with correct selected date.

Steps:

1. Open My Plans / invite context.
2. Confirm balance amount and deadline.
3. Create balance order.
4. Simulate success.
5. Assert `fully_paid`.
6. Assert exact meeting/group detail behaviour.
7. Assert no real commission rows were created for synthetic tests.

### Persona 6 — failed-payment retry

Purpose: protect the recovery flow.

Steps:

1. Create order.
2. Simulate failure.
3. Open failed return screen.
4. Assert Try Again is visible.
5. Follow retry path.
6. Assert phone/event context is restored.
7. Confirm a second order can be created without re-OTP where the deliberate recovery exception applies.
8. Simulate success.
9. Assert final application state and `recovered_at` behaviour if this path qualifies as abandonment recovery.

### Persona 7 — creator-attributed buyer

Purpose: protect attribution without paying fake commission.

Steps:

1. Open `/@<test-creator-handle>` or `/lifestyle?ref=<handle>`.
2. Confirm referral code stored in session.
3. Continue to fixture event.
4. Submit application.
5. Assert `affiliate_id` is stamped correctly.
6. Complete payment if required.
7. Assert commission accrual was deliberately suppressed because identity is synthetic.
8. Assert the test affiliate’s real earnings did not change.

Use a dedicated inactive/internal test creator, not a real creator.

---

## 20. Later personas

After the first seven are reliable:

- Full-payment open event.
- Email OTP fallback.
- Own transport with alternate price.
- Two different pickup points.
- Sold-out date.
- Waitlist join.
- Doubt-qualified payment without repeat OTP.
- Cart abandonment and recovery.
- Existing My Plans lookup.
- Community WhatsApp flow with outbound navigation intercepted.
- Instagram/FB in-app-browser user agent and external-browser instruction.
- Android standalone PWA routing.
- Per-date balance deadline and meeting-detail release.
- Single-payment full-paid confirmation.
- Browser-back sequence across event details, calendar and payment layers.

---

## 21. Page-object rules

Keep selectors and interaction logic out of spec files.

Example:

```ts
class PaymentPage {
  constructor(private page: Page) {}

  amount() {
    return this.page.getByTestId('payment-amount');
  }

  async submitAndCaptureOrder() {
    const responsePromise = this.page.waitForResponse(r =>
      r.url().includes('/functions/v1/create-payu-order') && r.request().method() === 'POST'
    );
    await this.page.getByTestId('payment-submit').click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    return response.json();
  }
}
```

Specs should read like business journeys:

```ts
test('advance payment moves an invited split-payment customer to advance paid', async ({ swarm }) => {
  await swarm.invite.open();
  await swarm.invite.verifyContext();
  const order = await swarm.payment.createAdvanceOrder();
  await swarm.control.simulatePayment(order.txnid, 'success');
  await swarm.returnScreen.openSuccess(order.txnid);
  await swarm.returnScreen.expectAdvancePaid();
  await swarm.database.expectApplicationStatus('advance_paid');
});
```

---

## 22. Assertions

Every important case needs three layers.

### A. Browser assertion

What the customer sees:

- Correct event/date/pickup.
- Correct amount.
- Correct status copy.
- Correct CTA available.
- No fatal screen or infinite spinner.

### B. Network assertion

What the browser sent/received:

- Expected endpoint called.
- Request identifies the fixture event and registered test phone.
- Response status and shape are valid.
- Order amount is server-generated.
- No call to AiSensy/Brevo in swarm mode.

### C. Database assertion

What the system of record contains:

- One application, not duplicates.
- Correct status.
- Correct selected date/city/pickup.
- Correct PayU row and amount.
- Correct affiliate attribution when applicable.
- Zero real commission rows for synthetic identities.
- Zero marketer assignment when suppression is expected.

Do not query production directly from the browser with a service key. Use the secret-authenticated test-control `verify_case` action from the Node runner.

---

## 23. Reporting

### Playwright artifacts

On failure retain:

- Screenshot.
- Trace ZIP.
- Network summary with secrets redacted.
- Console errors.
- Founder-summary JSON/Markdown.

On success retain only the compact report by default to control artifact size.

### Founder summary format

```text
Synthetic Customer Swarm
Run: 2026-07-13 18:20 IST
Commit: abc123

6 of 7 journeys passed

PASS  Public plans smoke
PASS  Open booking to bill
PASS  Invite application
PASS  Advance payment
FAIL  Balance payment
PASS  Failed-payment retry
PASS  Creator attribution

Balance payment failed at: verify displayed amount
Expected: ₹200
Actual: ₹300
Evidence: balance-payment/failure.png

Cleanup: passed — 14 test rows removed
```

### Future admin integration

Do not build this before the CLI/Actions report is stable.

Later add a “Run customer tests” action to Roadmap/Experiments:

- Admin starts GitHub Actions through a secure server-side integration, not by exposing a GitHub token in the browser.
- Release card shows latest run status.
- Admin reads `synthetic_test_runs/cases/steps` through strict-admin RLS.
- Failure card links to external GitHub artifact only if access is authenticated; otherwise show the stored summary and ask the founder to open Actions.

---

## 24. Playwright configuration

Start with:

- Chromium only.
- One worker (`workers: 1`) because fixed phones and production DB should not be concurrent initially.
- Mobile viewport similar to a modern Android device.
- Retries: 0 locally, 1 in CI only for infrastructure flakes.
- Trace: `retain-on-failure`.
- Screenshot: `only-on-failure` plus explicit checkpoint screenshots where helpful.
- Video: `retain-on-failure`.
- Expect timeout: approximately 10 seconds; longer only for known network operations.
- Global timeout per case to prevent stuck runs.

Do not hide real bugs with three automatic retries.

Recommended config concepts:

```ts
export default defineConfig({
  testDir: './specs',
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['html', { outputFolder: 'tests/swarm/report', open: 'never' }],
    ['./reporters/founder-summary.ts']
  ],
  use: {
    baseURL: requireEnv('SWARM_BASE_URL'),
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
});
```

The custom swarm fixture sets `x-chaptera-swarm-token` after global setup. Never pass `SWARM_RUNNER_SECRET` into the browser context.

Do not commit `.env.swarm.local`.

---

## 25. Manual run first

Version 1 must work manually before adding cron or GitHub Actions.

Expected founder/developer flow:

```bash
cp .env.swarm.example .env.swarm.local
# Fill SWARM_BASE_URL and SWARM_RUNNER_SECRET locally.
npm run test:swarm:smoke
npm run test:swarm
npm run test:swarm:report
```

The actual runner should load `.env.swarm.local` explicitly or rely on exported environment variables. Do not make Vite expose the secret.

---

## 26. GitHub Actions and scheduling — Phase 4

After local reliability:

```yaml
on:
  workflow_dispatch:
  schedule:
    - cron: '30 22 * * *'
```

The example UTC schedule corresponds to early morning IST; verify the desired time before committing it. GitHub cron uses UTC and may not run at the exact minute under load.

Workflow requirements:

- Checkout exact commit.
- Install pinned dependencies with `npm ci`.
- Install only Chromium required by Playwright.
- Run one worker.
- Upload report/trace artifacts even if tests fail.
- Always attempt cleanup in a final step.
- Use repository secrets for swarm secret and base URL.
- Never store Supabase service-role key in the browser test; only the Edge Function has it.
- Set a job timeout.
- Prevent two swarm workflows from running concurrently with a concurrency group.

Do not schedule against a developer’s local URL. Use a stable preview deployment that runs the current production frontend or the commit being tested while still pointing to the approved real database.

---

## 27. Release integration — optional after scheduling

The repository already has:

- `feature_releases`.
- `roadmap_features`.
- `sync_release_to_roadmap()`.
- Need Testing cards after releases.

Possible later link:

1. Release record stores `latest_swarm_run_id` or a separate join table maps run to release.
2. A successful run adds “Automated customer journeys passed” to the release evidence.
3. A failed run keeps the roadmap card in Need Testing.
4. It must not automatically mark a feature Complete. Automated journeys are evidence, not the founder’s final acceptance.

---

## 28. Build phases

### Phase 0 — discovery and written design

Deliverables:

- Verify current Supabase/Playwright documentation and versions.
- Confirm exact tables/columns touched by all seven personas.
- Map side-effect triggers/functions.
- Create a cleanup coverage matrix.
- Write a threat model for the test secret and payment simulator.
- No production changes yet.

Acceptance:

- Founder can review the proposed fixture events, test phones and suppressed effects.
- Builder identifies every place a test row could cause an external side effect.

### Phase 1 — harness + smoke test

Deliverables:

- Pinned Playwright dependency.
- Config, environment validation, global setup/teardown.
- Hidden fixture event schema/data.
- Run/case/step/identity tables with RLS.
- Test-control actions: start, record, verify, cleanup, finish.
- Stable frontend selectors.
- Public smoke persona.

Acceptance:

- `npm run test:swarm:smoke` passes.
- Run rows are recorded.
- Synthetic analytics rows are removed.
- No outbound messages or commissions occur.

### Phase 2 — booking and OTP

Deliverables:

- Test-mode OTP branch.
- Open booking to bill.
- Invite-only application.
- Database verification.

Acceptance:

- Correct application values are proven with a bounded verification response.
- Cleanup shows zero remaining rows for the test identity.

### Phase 3 — payment simulation

Deliverables:

- Strict `simulate_payment` action.
- Advance success.
- Balance success.
- Failed payment + retry.
- Creator attribution test.
- Side-effect suppression verification.

Acceptance:

- No real PayU charge.
- Test can prove expected amount and final application status.
- Fake creator/marketer earnings remain zero.
- Failure screenshots and trace work by intentionally breaking one local assertion, then reverting it.

### Phase 4 — CI and scheduling

Deliverables:

- GitHub workflow manual trigger.
- Concurrency lock.
- Artifact upload.
- Always-run cleanup.
- Optional nightly smoke schedule.

Acceptance:

- Manual Actions run succeeds from a clean checkout.
- A deliberately failed assertion produces readable artifacts.
- Cleanup succeeds even when the test step fails.

### Phase 5 — admin/roadmap integration

Deliverables:

- Strict-admin result view.
- Latest run linked to release/roadmap.
- Optional secure Run button.

Acceptance:

- No GitHub or swarm secrets in client bundle.
- Founder can see pass/fail and failure step without reading raw logs.

---

## 29. Verification matrix

| Area | Required verification |
|---|---|
| TypeScript | `npx tsc --noEmit` |
| Frontend build | `npm run build` |
| Playwright smoke | clean run against fixture |
| RLS | anon cannot read/write synthetic run tables |
| Strict admin | can read run/case/step summaries |
| Secret gate | missing/wrong secret rejected uniformly |
| Fixture gate | real event rejected even with a test phone |
| Phone gate | non-900 phone rejected even for fixture |
| Payment simulator | cannot act on real event/phone/unknown txnid |
| Side effects | zero real provider calls, pushes, assignments and commissions |
| Cleanup | pre-scan count > 0, cleanup counts returned, post-scan count = 0 |
| Analytics | session-scoped flow/click rows removed or excluded |
| Failure artifacts | screenshot + trace + readable step captured |
| Concurrency | second active run with same phone rejected |
| Idempotency | repeated cleanup and repeated payment simulation are safe |

For every DB write used during implementation, verify with `RETURNING` or a follow-up SELECT. Remove all temporary test rows afterward.

---

## 30. Threat model and failure modes

### Threat: leaked permanent secret or browser token

Risk: attacker uses test-only OTP/payment controls.

Mitigations:

- Never expose the permanent secret as a Vite variable or browser header.
- Give Chromium only a short-lived token that is hashed at rest.
- Require fixture + phone + registered run in addition to the token.
- Invalidate the browser token during cleanup/finish.
- Rotate the permanent secret easily.
- Log run identity and reject unknown origins.
- Rate-limit test-control requests.
- Provide a server-side kill switch such as `SWARM_ENABLED=false`.

### Threat: simulator touches real booking

Mitigations:

- Query transaction and join to event/application server-side.
- Require `is_test_fixture=true` and registered test phone.
- Never accept arbitrary application id from the client.
- Reject paid/non-pending rows except idempotent replay of the same recorded outcome.

### Threat: test sends customer communications

Mitigations:

- Shared synthetic-identity helper.
- Provider functions return `suppressed` result.
- Integration test asserts no provider fetch occurred.

### Threat: cleanup deletes real data

Mitigations:

- Delete only identities registered to run.
- Fixture-event constraint.
- Reserved phone constraint.
- Dry-run scan action returns exact counts before delete.
- Max phone count per run.
- Audit-log cleanup.

### Threat: dead run leaves data

Mitigations:

- `finally` cleanup.
- GitHub always-step cleanup.
- Stale-run cleanup command.
- Admin manual purge fallback.
- Run status `cleanup_failed` instead of false success.

### Threat: brittle tests fail after copy edits

Mitigations:

- Stable semantic selectors.
- Page objects.
- Assert copy only when copy is the feature under test.

### Threat: flaky network creates false alarms

Mitigations:

- Wait for meaningful UI/network conditions, never arbitrary sleeps.
- One CI retry only for the whole case or clearly safe setup step.
- Distinguish `infrastructure_error` from product assertion failure in the reporter if practical.

### Threat: test events enter public catalogue

Mitigations:

- `is_active=false`.
- `[SWARM FIXTURE]` title.
- `is_test_fixture=true`.
- Public fetch remains active-only.
- Build a manager rule/test asserting fixtures are not publicly discoverable.

---

## 31. Coding rules for the builder

- Do not create a giant single `swarm.spec.ts` file.
- Keep page objects small and business-oriented.
- Keep the permanent runner secret out of Chromium entirely. Avoid logging the short-lived browser token and invalidate it before retaining traces.
- Use deterministic ids and timestamps where practical.
- Never use `waitForTimeout()` as the main readiness mechanism.
- Use `Promise.all()` carefully when clicking triggers navigation/response.
- Avoid relying on CSS class names generated for styling.
- Cap all test-control response sizes.
- Do not return full customer tables from verification actions.
- No `SECURITY DEFINER` helper without explicit authorization checks, `search_path`, revoked PUBLIC execute and advisor review.
- Never add a broad anon SELECT policy just to make tests easier.
- Do not put the Supabase service-role key in Playwright environment variables if the browser could access them.
- Keep payment test helpers unusable when `SWARM_ENABLED` is off.
- Keep normal production behaviour byte-for-byte equivalent when the swarm gate is not satisfied.

---

## 32. Suggested isolated commit sequence

1. `Add Playwright swarm harness and stable customer-flow selectors`
2. `Add synthetic run registry and hidden fixture support`
3. `Add secret-gated swarm test-control function`
4. `Suppress external side effects for registered synthetic identities`
5. `Add open and invite booking personas`
6. `Add test-only payment simulation and payment personas`
7. `Add creator attribution persona and cleanup coverage`
8. `Add GitHub Actions manual swarm runner`
9. `Add optional scheduled smoke run`

Do not combine the production payment simulator guard with unrelated UI work.

---

## 33. Owner decisions required before implementation

1. Approve adding hidden fixture events to the production database.
2. Approve the reserved phone allocation.
3. Choose the preview base URL used by CI.
4. Decide whether nightly smoke runs are wanted or only manual/release-triggered runs.
5. Approve suppressing admin pushes and marketer assignment for fixture events.
6. Confirm that version 1 should simulate PayU outcome rather than use the real gateway.
7. Decide retention for synthetic run summaries, for example 30 or 90 days.
8. Approve creating and storing `SWARM_RUNNER_SECRET` and `SWARM_ENABLED` as Edge Function secrets.

These decisions do not authorize deployment. The founder must separately approve applying migrations, deploying Edge Functions and pushing the frontend.

---

## 34. Definition of done for version 1

The feature is done only when:

- A clean checkout can run the documented command.
- At least six core personas execute in Chromium/mobile emulation.
- Tests use hidden fixture events and reserved identities.
- No real PayU charge occurs.
- No real WhatsApp, email, push, marketer assignment or commission occurs.
- Browser, network and database assertions exist for payment-critical journeys.
- Failure creates a screenshot, trace and readable failure step.
- Cleanup runs after both pass and failure.
- Post-cleanup verification proves zero remaining customer/test rows for the run, excluding retained run results.
- RLS and secret-gate tests pass.
- `npx tsc --noEmit` and `npm run build` pass.
- The founder can read the summary without understanding Playwright.
- Deployment/run instructions are included.

---

## 35. What to say to Claude Code

Use this exact kickoff prompt with this handoff attached or named:

> Build Phase 0 and Phase 1 of `synthetic-customer-swarm-handoff.md`. First audit the current repository against the handoff and write a short discrepancy note: current tables/columns, current side-effect producers, current purge coverage, and any safety issue that requires changing the proposal. Do not apply migrations, deploy Edge Functions, push to main, or write test rows until I approve the reviewed plan. After approval, implement the Playwright harness, stable selectors, hidden fixture schema, synthetic run registry, secret-gated test-control skeleton, one public smoke persona, and guaranteed cleanup. Verify TypeScript, build, RLS and cleanup. Use isolated commits and explain every owner action in plain English.

After Phase 1 is verified:

> Continue with Phase 2 of `synthetic-customer-swarm-handoff.md`: test-mode OTP, open booking to bill, invite application, bounded database verification and complete cleanup. Do not send real WhatsApp/email/push messages and do not deploy without my approval.

After Phase 2:

> Continue with Phase 3 of `synthetic-customer-swarm-handoff.md`: strict fixture-only payment simulation, advance success, balance success, failed-payment retry and creator attribution. Threat-model the simulator before writing it. Prove it cannot touch a real event, real phone or unknown transaction. Do not use real PayU money.

---

## 36. Final recommendation

Build this in layers. The valuable first milestone is not “16 personas.” It is:

1. One safe hidden fixture.
2. One deterministic browser persona.
3. One secret-gated verification path.
4. Guaranteed cleanup.
5. Proof that no external side effect occurred.

Once that foundation is trustworthy, adding more customer personas is straightforward. If the foundation is unsafe, a larger swarm only creates production noise faster.
