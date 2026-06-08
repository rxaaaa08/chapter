# Security audit — June 2026 session

A complete record of every fix, finding, and verification performed during the
security hardening pass that ran up to the `preview-may24` deploy.

Read this if you (or a future maintainer) need to understand:

* **Why** the code looks the way it does in payment flows, edge functions, RLS
  policies, etc.
* **What** was wrong before and what's now correct.
* **What's left to do** before flipping PayU to live and merging to `main`.

---

## TL;DR — what changed and what's next

* 🔴 **3 critical bugs found and fixed live**:
  1. PayU reverse-hash format was wrong; every successful callback was silently
     failing hash verification. Going live without this fix would have rejected
     **every real payment** as "hash mismatch."
  2. Per-application admin approvals never landed in `invited_numbers`, so
     every customer your team approved individually got blocked at PayU's
     pay-button with `403 phone not invited for this event`.
  3. The bill page showed `₹X + transaction fee` but only `₹X` was sent to
     PayU, so the merchant was absorbing PayU's ~2.42–3.67% cut on every
     transaction.

* 🟠 **Critical security gaps closed**:
  * The leaked `admin_push_secret` (committed in a migration file) was rotated
    and replaced with a `gen_random_bytes(48)` value. End-to-end push verified.
  * `event-images` storage bucket had four anonymous-write policies (delete,
    update, insert, list). Anyone could've defaced or vandalised the bucket.
    All four dropped; existing image URLs still serve.
  * `send-push-notification` accepted any anonymous POST — could be abused to
    phish subscribed users with arbitrary push payloads. Now requires admin JWT.
  * Meta WhatsApp webhook had no signature verification; any caller could
    trigger your WhatsApp send-quota. HMAC-SHA256 verification added.
  * Browser-side reads of `invited_numbers`, `applications`, and `payu_payments`
    silently returned `[]` (broken UX **and** information leak path); now
    routed through a phone-bound edge function.

* 🟢 **32 audit tasks completed across M/L/H tiers + 6 defense-in-depth items**.

* 🟡 **Two manual things still on you**:
  1. Add `WHATSAPP_APP_SECRET` to Vercel env vars when you set up Meta
     (without it, `/api/webhook` correctly returns 503).
  2. Before flipping to live PayU: update `PAYU_MERCHANT_KEY`,
     `PAYU_MERCHANT_SALT`, and `PAYU_BASE_URL` in Supabase Edge Function secrets.

* ✅ **Verified end-to-end via real PayU sandbox transaction**:
  * Hash format matches (`_hash_matches: true`)
  * Per-application invite-auth works
  * Receipt page renders correctly with same-origin sessionStorage

---

## Table of contents

1. [Critical bugs (real exploits / real money)](#critical-bugs)
2. [High-tier (H) work](#h-tier)
3. [Medium-tier (M) work](#m-tier)
4. [Low-tier (L) work](#l-tier)
5. [Defense in depth](#defense-in-depth)
6. [Critical security gaps from a second pass](#second-pass-gaps)
7. [Files that changed](#file-map)
8. [Edge function deployments](#edge-fn-deployments)
9. [Database migrations applied](#db-migrations)
10. [Manual tasks still on you](#manual-tasks)
11. [Pre-launch checklist](#pre-launch-checklist)
12. [Known risk notes for future maintainers](#risk-notes)

---

<a id="critical-bugs"></a>
## 1. Critical bugs (real exploits / real money)

### 1.1 PayU reverse-hash format wrong since `ab185b8`

PayU's documented reverse-hash spec:

```
sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
```

The five empty fields between `status` and `udf5` correspond to `udf10..udf6`
that PayU's response includes whether or not you sent them. Our `payu-callback`
and `payu-webhook` were computing:

```
sha512(SALT|status|udf5|udf4|udf3|udf2|udf1|email|...)
```

— five empty fields missing. Every callback's hash check silently failed.

**Evidence:** the most recent "success" row (`CHA17797202669136SQG`,
2026-05-25) had `_hash_matches: false` stored; the calculated hash didn't
match PayU's hash. All 38 historical "success" rows have the same fingerprint.

Pre-`ab185b8` code accepted these anyway. Post-`ab185b8` code correctly
rejects them — meaning **going live with the bug would have rejected every
real payment as "hash mismatch."**

**Fix:** corrected the reverse-hash string in both `payu-callback` and
`payu-webhook`, including support for the optional `additionalCharges` prefix.

**Verified:** I did an actual PayU sandbox transaction (txn
`CHA17804219081749IG3` on 2026-06-02 for ₹2,600). The post-fix row stored
`_hash_matches: true`, `status: success`, and a matching `mihpayid`.

### 1.2 Per-application admin approvals couldn't pay

`create-payu-order`'s invite-only guard only checked `invited_numbers`:

```ts
if (event.invite_only) {
  const { data: invited } = await supabase
    .from('invited_numbers')
    .select('phone')
    .eq('phone', phone).eq('event_slug', canonicalSlug)
    .maybeSingle();
  if (!invited) return err(403, 'phone not invited for this event', cors);
}
```

But your team has **two** ways to grant access:

1. Bulk-add phones via Plans → Invited Numbers → writes to `invited_numbers`.
2. Approve an individual application via People → Approval → writes to
   `applications.status = 'invited'`.

The PayU guard only honored (1). Anyone approved via path (2) saw the bill
page (auth via `applications`) but got `403 phone not invited for this event`
at the Pay button.

**Verified live:** I hit this bug while doing the hash test. The fix
unblocked the test in seconds.

**Fix:** guard now accepts **either** an `invited_numbers` row **or** an
`applications` row with `status IN ('invited', 'advance_paid', 'fully_paid')`.

### 1.3 PayU transaction fee absorbed by merchant, not charged to customer

The bill page showed `₹2,600 + ₹62.92 fee = ₹2,662.92 To Pay` but
`create-payu-order` only used the DB `price_advance` (₹2,600) in the hash
and the form. PayU charged ₹2,600. The merchant absorbed the ~2.42–3.67%
fee on every payment.

**Fix:** server now keeps a canonical fee-rates table keyed by payment
method. Client sends `preferred_method`; server multiplies the base by
`(1 + fee_rate)` and uses the total in both the hash and the PayU form.
Customer pays the bill amount; merchant nets the base price.

**Bonus security win in the same fix:** `enforce_paymethod` is now emitted
server-side, glued to the same `fields` object as the hash. Before, it was a
client-side hidden input — an attacker could change it via devtools to pay
credit-card-fee-rate via UPI (or any mismatch). Now the priced method is
bound to the enforced method.

**Single source of truth:** server exposes `GET ?probe=fees` returning the
live rate map. The bill page fetches it on mount and uses it for both the
displayed `%` and the calculated total. The client's `PAYMENT_METHOD_GROUPS`
values are a one-time emergency fallback only.

---

<a id="h-tier"></a>
## 2. High-tier (H) work

### H1 — Rate limiting on public endpoints + form INSERTs

Public endpoints (`create-payu-order`, `send-aisensy-invite`) and the four
anon-writable form tables (`applications`, `doubt_submissions`, `plan_doubts`,
`invite_payment_submissions`) had no rate limit. An attacker could spam
PayU orders, fill the DB with bogus applications, or burn through your
WhatsApp send-quota.

**Implementation:**

* New `public.rate_limits` table + `public.check_rate_limit()` function.
  Atomically counts + inserts; cleans up rows older than 1 day on a 1% sample.
* `BEFORE INSERT` triggers on each form table call `rate_limit_anon_insert()`
  which checks IP and phone against `check_rate_limit`. Service-role and
  `is_admin()` callers bypass entirely.
* Caps: form INSERT — 30/min/IP, 10/hour/phone. `create-payu-order` — 10/min/IP,
  5/hour/phone. `send-aisensy-invite` — 30/hour/admin-email.

**Verified:** I hammered `create-payu-order` 12 times in 17 seconds — first 5
got the legitimate 404 (fake slug), then HTTP 429 for the rest. PostgREST
maps the `PT429` SQLSTATE I used in the trigger to HTTP 429, so the client
sees a clean `{"code":"PT429", "message":"rate limit exceeded (phone)"}`.

**Bonus discovery:** I tried to spoof IP via `x-forwarded-for: 203.0.113.99`
header — Supabase's gateway ignored it and used the real client IP. So
header-spoof attacks against per-IP limits don't work.

### H3 — XSS via `dangerouslySetInnerHTML`

**Audited.** Zero usages anywhere in `src/`. All user-submitted text renders
through React's safe `{value}` interpolation.

### H4 — CORS allowlist on all 6 edge functions

**Audited and verified:**

| Function | Status |
|---|---|
| `create-payu-order` | ✅ ALLOWED_ORIGIN regex (browser-callable) |
| `send-aisensy-invite` | ✅ Same regex (browser-callable) |
| `send-push-notification` | ✅ Same regex (browser-callable, now also admin-JWT gated) |
| `payu-callback` | ✅ Intentionally no CORS — PayU server-to-server form post |
| `payu-webhook` | ✅ Same — server-to-server webhook |
| `send-admin-push` | ✅ Gated by `X-Admin-Push-Secret` header; not browser-called |

Allowed origins: `chaptera.in` (+ any subdomain), `chapter-*.vercel.app` (any
preview), `http://localhost:[4-5 digit port]`.

### H5 — PayU `txnid` idempotency

**Audited.** `payu_payments.txnid` has a `UNIQUE` constraint. Both callback
and webhook use `UPDATE WHERE txnid = $1` (not `INSERT`), so duplicate PayU
deliveries are no-ops. Hash + amount verified before any state change;
mismatches log to `payu_response` and return early without flipping status.
WhatsApp double-send blocked by `aisensy_advance_paid_sent` / `aisensy_payment_failed_sent` flags.

### H6 — `sessionStorage` rehydrate hardening

**Audited.** [App.tsx:2055-2085](src/App.tsx:2055) only restores
`{name, phone, verifiedSlug}` from sessionStorage. Validates phone is 10
digits. Re-fetches full event/price data from DB via `prepareNativeInviteFlow`,
so a tampered sessionStorage can't display a bogus price. Single-use: removed
on read.

### H7 — `service_role` key in client bundle

**Audited.** `grep -rn "service_role\|SERVICE_ROLE_KEY" src/` returns only a
UI placeholder string in `AdminPanel.tsx` (`'your-service-role-key-here'`)
shown as a setup hint. No real key anywhere in `src/`. `git log --all -p`
shows only legitimate usages.

### H8 — PayU merchant salt in client

**Audited.** `grep -rn "MERCHANT_SALT\|PAYU_SALT" src/` → zero hits. Salt
lives only in Supabase Edge Function secrets, accessed via `Deno.env.get`.

### H10 — Admin audit log

**Audited and extended.** `admin_audit_log` table exists. `logAdminAction()`
helper in `AdminPanel.tsx` calls a SECURITY DEFINER RPC that re-validates
`is_admin()` server-side so a tampered client call can't fake entries.

**Coverage extended in this session** from 11 → 17 call sites. Now covered:
application approval (existing), event create/update/delete/duplicate/duplicate
(existing), event live/offline toggle (existing), invited-numbers bulk
add/delete (existing), plus newly: `event_timeline_save`,
`event_other_city_enable/disable`, `chat_message_update`,
`chat_step_template_save`, `general_announcements_save`,
`announcement_config_save`, `doubt_form_settings_save`.

---

<a id="m-tier"></a>
## 3. Medium-tier (M) work

### M1 — Security headers in `vercel.json`

Added:

* `Strict-Transport-Security` — 2-year HSTS with preload
* `X-Content-Type-Options: nosniff`
* `X-Frame-Options: SAMEORIGIN`
* `Referrer-Policy: strict-origin-when-cross-origin`
* `Permissions-Policy` — denies camera/mic/geo/cohorts
* `X-XSS-Protection: 0` (modern advice — rely on CSP instead)
* `Content-Security-Policy` — strict allowlists for `script-src`,
  `connect-src`, `frame-src`, `form-action`, `frame-ancestors`. Allows
  Sentry, GA, Contentsquare, PayU, Supabase. Disallows everything else.

### M2 — npm audit clean

Pre-fix: 8 vulnerabilities including 1 critical (protobufjs in @google/genai).
Post-fix: **0 vulnerabilities.** `npm audit fix` re-synced the lockfile with
the already-installed safe versions in `node_modules/`.

### M3 — DPDP privacy policy

`PrivacyScreen` (in `App.tsx:4861`) extended with DPDP-required sections:
Your Rights (access/correct/erase/withdraw consent), Data Retention, Where
Your Data Is Stored (cross-border disclosure), Children & Minors, and a named
**Grievance Officer** block with a 30-day response SLA.

### M4 / M7 / M8 — Manual ops checklist

Wrote `details/M4_M7_M8_OPS_CHECKLIST.md` covering:

* M4: Supabase backup restore drill (quarterly)
* M7: Vercel stale preview deployment cleanup
* M8: PayU sandbox e2e test matrix (10 scenarios)

Plus leftover Supabase dashboard items: `event-images` bucket lockdown
(now done — see [§ 6](#second-pass-gaps)) and leaked-password protection
(N/A for Google OAuth — confirmed with user).

### M5 — Supabase advisor cleanup

Applied migration `20260602_m5_advisor_fixes`:

* Enabled RLS on `bill_opens` and `push_debug_logs` (were OFF — policies
  existed for `bill_opens` but were inert without RLS enabled).
* Dropped wide-open policies on `mock_payment_receipts` (dead-code path
  per `handleMockPaymentComplete` having no caller).
* Set `search_path = public` on 8 trigger functions (was role-mutable).
* Revoked `EXECUTE` on trigger-only SECURITY DEFINER functions from
  `PUBLIC, anon, authenticated` so attackers can't spoof admin pushes via
  `/rest/v1/rpc/trg_admin_push_*`.

Post-fix advisor scan: 0 ERROR-level, remaining WARN/INFO are by-design.

---

<a id="l-tier"></a>
## 4. Low-tier (L) work

### L1 — Strip `console.*` from production bundle

`vite.config.ts` now has `esbuild: { drop: ['console', 'debugger'] }` in
production. PII (phone/email/txnid) accidentally `console.error`'d in the
client never reaches a user's devtools in production.

### L2 — Source maps explicitly disabled

`build: { sourcemap: false }`. Was the default but now protected against
future drift.

### L3 — VAPID private key rotation runbook

The previous VAPID private key was committed to `pwa.md`. Even though I
redacted it in this session, the value is **in git history and must be
considered compromised**.

`details/SECRETS_ROTATION.md` walks through:

1. Generating new keys (`npx web-push generate-vapid-keys --json`)
2. Updating Supabase Edge Function secrets for `send-push-notification` and
   `send-admin-push`
3. Updating the public key in `AdminPanel.tsx:238`
4. Truncating stale subscriptions
5. Re-subscribing admins

**To-do:** the rotation itself is on you. The runbook is the easy part.

### L4 — PayU mode visibility

AdminPanel header now shows a colored badge: 🟢 **LIVE** / 🟡 **TEST** /
⚪ **?**. Probes `create-payu-order ?probe=mode` on mount. So it's
immediately obvious whether real money is at stake.

### L5 — Push subscriptions capped at 1 per phone

`push_subscriptions` previously had `UNIQUE (phone, endpoint)`. Three test
rows shared one device endpoint under different phones (a spam vector).
Changed to `UNIQUE (phone)` so the same phone can't have multiple endpoints.
Future re-subscribe code should `upsert(..., { onConflict: 'phone' })` —
latest device wins.

---

<a id="defense-in-depth"></a>
## 5. Defense in depth (6 items)

### DiD-A — Column-level `WITH CHECK` on form INSERT policies

Anon form INSERTs previously had `WITH CHECK (true)` — anyone could insert
arbitrary content. Now enforced:

* `applications` — phone must match `^[0-9]{10}$`, name 1–80 chars,
  event_slug ≤ 120, why_join ≤ 1000, status must be `'pending'`
* `doubt_submissions` — phone shape (if present), name length, doubt ≤ 2000
* `plan_doubts` — phone shape, message 1–2000, status whitelist
  `('new','open','pending','resolved')`
* `invite_payment_submissions` — phone shape, name length, status whitelist
  `('pending','pending_verification')`

Service role bypasses all of this (edge functions still work).

### DiD-B — PII moved from `localStorage` → `sessionStorage`

`bookingName` and `bookingPhone` now live in tab-scoped sessionStorage
instead of persistent localStorage. Survives the PayU redirect round-trip,
clears when the tab closes. Receipt page falls back to a phone-input prompt
if sessionStorage is empty (e.g., on a fresh re-open of the success URL).

### DiD-C — PII redacted in edge function logs

`send-aisensy-invite` previously logged the full phone on every call. Now
logs only the last 4 digits (`phone_tail`) plus the admin email. AiSensy
response body truncated to 100 chars.

### DiD-D — Form fields masked from analytics

* **Contentsquare:** added `ipHashing: true` and `denyAdvertising: true` via
  `_uxa.push` **before** the tracker loads. Plus a runtime MutationObserver
  in `main.tsx` that auto-tags every `<input type="tel">`,
  `<input type="email">`, and text inputs with name/phone/email/number
  placeholders with `data-cs-mask="masked"`. Session replays no longer
  capture form values.

* **Google Analytics:** added `anonymize_ip: true`, `allow_google_signals: false`,
  `allow_ad_personalization_signals: false` to `gtag('config', ...)`.

### DiD-E — Dead `liveConversationId` code path

Verified `doubt_conversations` and `doubt_messages` have 0 rows in
production history (C6 retired the consumer live chat). RLS denies anon
INSERT anyway, so the code path can never succeed. Stopped rehydrating the
conversation ID from localStorage to prevent stale-state leaks on shared
devices. Code path is now a true no-op (left in place to avoid touching
JSX in the booking flow).

### DiD-F — Pre-commit secret scanner

New `.githooks/pre-commit` hook + `package.json:scripts.prepare` that
auto-installs via `git config core.hooksPath .githooks` on every
`npm install`. Catches:

* JWTs (`eyJ...` shape)
* AWS access keys (`AKIA...`)
* Stripe keys (`sk_live_...`)
* GitHub PATs (`gh[pous]_...`)
* OpenAI / Anthropic keys (`sk-...`, `sk-ant-...`)
* Generic `(secret|key|salt|token) = '...20+chars...'` assignments

Bypass with `# nosecret` on the same line, or `PLACEHOLDER` in the value,
or `git commit --no-verify` (for tested edge cases).

**Verified working:** a planted JWT in `details/_secret_test_fixture.js`
triggered the hook and exited 1 with a readable error.

---

<a id="second-pass-gaps"></a>
## 6. Critical security gaps from Codex's second pass

### Gap 1: `admin_push_secret` was committed in `20260601_c3_admin_push_secret.sql`

**Rotated.** New value generated by `gen_random_bytes(48)` at apply time, so
the secret never touches a markdown/SQL file. New value pasted into the
Supabase Edge Function secret `ADMIN_PUSH_SECRET`.

**Verified:** I triggered `notify_admin_push()` via SQL — the function
returned HTTP 200 with `{"sent": 2, "expired": 0}` — pushes successfully
delivered to both subscribed admin devices (Apple + FCM, both returned
`status: 201`).

### Gap 2: `.claude/worktrees/` not gitignored

7 old Claude Code worktree directories existed under `.claude/worktrees/`.
Untracked today but a stray `git add .` would have committed them. Added
`.claude/worktrees/`, `.idea/`, and `work/` to `.gitignore`.

### Gap 3: Meta WhatsApp webhook signature not verified

`/api/webhook` previously trusted any POST. Now reads the raw body
(disabled Vercel's `bodyParser`), computes `HMAC-SHA256(body,
WHATSAPP_APP_SECRET)`, and compares against `x-hub-signature-256` in
constant time. Refuses all traffic when `WHATSAPP_APP_SECRET` is unset
(returns 503).

### Gap 4: `send-push-notification` was anon-callable

Anyone with the URL could POST `{type: 'direct', phone, title, body, url}`
and we'd deliver a phishing push to that phone's subscribed devices. Now
gated with admin JWT verification + `verify_jwt: true` at the gateway.

**Verified:** anon POST returns HTTP 401.

### Gap 5: Browser queries silently returning `[]`

`App.tsx:1796` (invite picker) and `App.tsx:4545` (payment receipt) directly
queried `invited_numbers` / `applications` / `payu_payments` from the browser.
After C5 locked RLS to admins only, these queries returned empty arrays.

**Fix:** new `get-user-context` edge function that takes `{phone, txnid?}`,
uses service_role to bypass RLS, filters server-side by the caller-supplied
phone. For receipt lookup, cross-checks `txnid.phone === request.phone` so
a stolen txnid alone doesn't reveal the receipt. Rate-limited 30/min/IP,
30/hour/phone.

### Gap 6: `event-images` bucket wide open

The `storage.objects` table had **four** anon policies on the bucket:

1. `Anon delete event-images` — anyone could delete any image
2. `Anon update event-images` — anyone could replace any image
3. `Anon upload event-images` — anyone could upload (free CDN abuse)
4. `Public read event-images` — anyone could list the inventory

**All four dropped.** Public bucket GET URLs still work (Supabase public
buckets serve files via `/object/public/` without policy checks). Anon
writes/deletes/listing now all 403. Existing 41 images continue to load.

**Bonus cleanup:** removed the file-upload UI from `AdminPanel.tsx` since
team workflow uses Cloudinary URLs. `ImageUploadInput` is now a paste-only
field.

---

<a id="file-map"></a>
## 7. Files that changed

### Application code

* `src/App.tsx` — invite picker, receipt page, bill page (server-canonical
  fees, server-emitted enforce_paymethod), PrivacyScreen DPDP updates,
  sessionStorage migration, deprecated liveConversationId
* `src/AppFlow.tsx` — sessionStorage for bookingName/bookingPhone,
  `noopener,noreferrer` on `window.open` of booking URLs, deprecated
  liveConversationId
* `src/AdminPanel.tsx` — PayU mode badge, extended audit-log coverage
  (6 new sites), removed file-upload UI
* `src/main.tsx` — `Sentry sendDefaultPii: false`, runtime PII-input
  masker (data-cs-mask MutationObserver)
* `index.html` — GA `anonymize_ip` + signals off, Contentsquare
  `ipHashing` + `denyAdvertising`

### Server-side

* `supabase/functions/create-payu-order/index.ts` — fixed reverse hash
  (well, only the forward hash lives here — see below), added rate
  limiting, added L4 `?probe=mode`, added per-application-approval
  invite-auth fix, added server-side fee table + `?probe=fees`,
  server-emitted `enforce_paymethod`
* `supabase/functions/payu-callback/index.ts` — fixed reverse hash
* `supabase/functions/payu-webhook/index.ts` — fixed reverse hash
* `supabase/functions/send-aisensy-invite/index.ts` — rate limit per
  admin email, PII-redacted log
* `supabase/functions/send-push-notification/index.ts` — admin JWT
  verification, verify_jwt=true at gateway
* `supabase/functions/get-user-context/index.ts` — **new** — phone-bound
  reads for invite picker + receipt lookup
* `api/webhook.js` — HMAC-SHA256 signature verification on Meta webhook

### Config

* `vercel.json` — security headers (HSTS, CSP, X-Frame-Options, etc.)
* `vite.config.ts` — esbuild drop `console`/`debugger` in prod, explicit
  sourcemap false
* `.gitignore` — added `.claude/worktrees/`, `.idea/`, `work/`
* `package.json` — `prepare` script auto-installs pre-commit hook
* `.githooks/pre-commit` — **new** — secret scanner

### Docs / runbooks

* `details/M4_M7_M8_OPS_CHECKLIST.md` — backup drill, preview cleanup,
  PayU sandbox test matrix
* `details/SECRETS_ROTATION.md` — VAPID rotation runbook (do this!)
* `details/SECURITY_AUDIT_JUNE_2026.md` — **this file**
* `pwa.md` — VAPID private key redacted

---

<a id="edge-fn-deployments"></a>
## 8. Edge function deployments

| Function | Latest version | Notable change |
|---|---|---|
| `create-payu-order` | v20 | `?probe=fees`, server-canonical fee + enforce |
| `payu-callback` | v19 | Reverse hash fix |
| `payu-webhook` | v14 | Reverse hash fix |
| `send-push-notification` | v20 | Admin-JWT gated |
| `send-aisensy-invite` | v5 | PII-redacted log |
| `send-admin-push` | v12 | Unchanged in this session |
| `get-user-context` | v1 | **New** |

---

<a id="db-migrations"></a>
## 9. Database migrations applied

In `supabase/migrations/`:

1. `20260602_m5_advisor_fixes.sql` — RLS on `bill_opens` /
   `push_debug_logs`, search_path on 8 functions, REVOKE EXECUTE on
   trigger-only functions
2. `20260602_l5_push_subs_one_per_phone.sql` — UNIQUE constraint on
   `push_subscriptions(phone)`
3. `20260602_h1_rate_limiting.sql` — `rate_limits` table,
   `check_rate_limit()`, `rate_limit_anon_insert()`, BEFORE INSERT
   triggers on 4 form tables
4. `20260602_rotate_admin_push_secret.sql` — rotate to
   `gen_random_bytes(48)` (already applied; new value lives only in
   Supabase + your password manager)
5. `20260602_lock_event_images_bucket.sql` — drop the 4 anon policies
   on `storage.objects` for `event-images`
6. `20260602_tighten_form_inserts.sql` — column-level `WITH CHECK` on
   form INSERTs

All applied to `txcmismkdttgsyhbnexf`.

---

<a id="manual-tasks"></a>
## 10. Manual tasks still on you

### Before going live with PayU

1. **Update PayU production secrets** in Supabase Edge Function secrets:
   * `PAYU_MERCHANT_KEY` → live key from PayU dashboard
   * `PAYU_MERCHANT_SALT` → live salt from PayU dashboard
   * `PAYU_BASE_URL` → `https://secure.payu.in/_payment`
2. **Verify the AdminPanel badge flips 🟡 TEST → 🟢 LIVE** after the env
   var change propagates (~30s).
3. **Do one ₹1 (or smallest allowed) real-money smoke transaction.**
4. **Run this SQL** afterwards to confirm the live keys also hash correctly:

   ```sql
   SELECT
     txnid,
     status,
     amount,
     payu_response->>'_hash_matches' AS matched
   FROM payu_payments
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   `matched` should be `"true"`.

5. **Refund the ₹1** from PayU dashboard.

### When you set up Meta WhatsApp

* Add `WHATSAPP_APP_SECRET` to Vercel env vars (Project Settings →
  Environment Variables → Add → scope: Production + Preview). Value comes
  from Meta App Dashboard → Settings → Basic → App Secret.
* Until this exists, `/api/webhook` correctly returns 503 and the
  "I need more details" WhatsApp auto-reply doesn't fire.

### Rotate the VAPID private key (in git history)

Follow `details/SECRETS_ROTATION.md`. The previous private key was
committed in `pwa.md` and is now in git history forever. Until rotated,
anyone who saw the repo can forge push notifications to your subscribed
users.

### Sanity-check GitHub remote URL

Run `git remote -v`. The current URL embeds a GitHub PAT
(`ghp_...`). It's never committed (it lives in `.git/config` which git
doesn't track), but anyone with terminal access to this directory can
read it. Worth rotating to a fine-grained PAT scoped to this repo only
and storing it in macOS keychain instead.

---

<a id="pre-launch-checklist"></a>
## 11. Pre-launch checklist

In order:

* [ ] Push preview-may24 (done by this session's commit + push).
* [ ] Team does multi-hour testing on the preview deployment URL:
  * Invite flow → bill → PayU sandbox → receipt
  * Test at least UPI and credit card to verify both fee rates
  * Verify per-application approvals can pay (the big bug we found)
  * Try the doubt forms, plan-doubt forms
  * Verify the admin panel: applications, approvals, push subscriptions
  * Try logging in / out of admin
* [ ] If something breaks, screenshot + paste the row from
  `payu_payments` or the relevant error so it can be debugged.
* [ ] Update PayU secrets to live values (see § 10).
* [ ] Do one ₹1 live transaction.
* [ ] Confirm `matched = true` via SQL.
* [ ] Refund the ₹1.
* [ ] Merge preview-may24 → main.
* [ ] After main deploys: do one more ₹1 live transaction to confirm
  production deploy still works end-to-end.

---

<a id="risk-notes"></a>
## 12. Known risk notes for future maintainers

1. **The 38 historical "success" rows** in `payu_payments` from before the
   hash fix all have `_hash_matches: false`. Those bookings happened — the
   customers paid — but they were never properly hash-verified by us.
   Don't be surprised when querying old data.

2. **Fee rates live in `create-payu-order` only.** The client mirrors
   them via `?probe=fees` on bill mount and falls back to the values
   baked into `App.tsx PAYMENT_METHOD_GROUPS` if the probe fails. To
   change a rate: edit the `FEE_RATES` const in
   `supabase/functions/create-payu-order/index.ts` and redeploy. Don't
   bother editing `PAYMENT_METHOD_GROUPS` — those are emergency
   fallback values only.

3. **`enforce_paymethod` is server-emitted.** Don't add it back to the
   client form as a hidden input — that breaks the binding between the
   priced fee and the enforced method.

4. **Receipt lookup is phone-bound.** The receipt page reads
   `sessionStorage.bookingPhone` and sends it to `get-user-context`
   along with the txnid. If a user lands on the success URL in a fresh
   session (e.g., from email), they're prompted to re-enter the phone
   they booked with. This is correct behavior — don't "fix" it by
   removing the phone gate.

5. **Per-application approval = invited.** If you ever change the
   `applications.status` enum, update `create-payu-order`'s invite-auth
   query (`['invited', 'advance_paid', 'fully_paid']`) to match.

6. **Rate limits live in `public.rate_limits`.** If you want to raise or
   lower a cap, the numbers are passed as args to `check_rate_limit()`
   — they're not hardcoded in the function. Edit the call sites:
   * Form INSERTs: `rate_limit_anon_insert` in the trigger function
   * `create-payu-order` + `send-aisensy-invite`: at the top of the
     handler

7. **`is_admin()` is the admin gate.** It checks the JWT email against
   `admin_users`. If you ever introduce a new admin tier or change the
   schema, the entire RLS lock depends on this function returning
   correctly.

8. **`service_role` is the unconditional bypass.** Every edge function
   uses it; nothing in `src/` should ever touch it. If you see a new
   edge function with `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`,
   confirm it has its own auth gate (admin JWT, shared secret, or
   PayU-style hash check). The C-tier work documented this principle;
   stick to it.

---

*Last updated: 2026-06-03 (preview-may24 branch). If you make material
changes to the security posture, append a dated note here so the next
maintainer doesn't have to reverse-engineer them.*
