# Medium-tier ops checklist (manual)

These items can't be code-fixed — they're dashboard/manual workflows.
Run through them before going live with PayU.

---

## M5 leftovers — two Supabase dashboard toggles

The 20260602_m5_advisor_fixes.sql migration cleared the database-side
warnings. Two items remain that the migration tool can't touch:

### Storage: tighten `event-images` bucket listing
1. Supabase dashboard → Storage → `event-images` → Policies.
2. Find the `Public read event-images` policy on `storage.objects`.
3. Edit the `USING` clause to scope to a specific path prefix instead of
   the whole bucket. Example:
   ```sql
   (bucket_id = 'event-images' AND storage.foldername(name)[1] = 'public')
   ```
   Or, if every object should be readable but the bucket should NOT be
   listable: keep public bucket access (object URLs work) and DROP the
   broad SELECT policy entirely.
4. Verify a known event-image URL still loads.

### Auth: enable leaked-password protection
1. Supabase dashboard → Authentication → Policies → Password.
2. Toggle on **"Block compromised passwords (HaveIBeenPwned check)"**.
3. No restart needed.

---

## M4 — Backup verification (Supabase)

**Goal:** confirm Supabase's automatic backups actually restore — don't
discover that the backup is corrupt during a real incident.

1. **Confirm backups are running**
   - Supabase dashboard → Project `txcmismkdttgsyhbnexf` → Database → Backups
   - Should see daily backups for the last ~7 days (Pro plan retains 7).
   - If on Free plan: backups are **not** included — upgrade required.

2. **Spin up a clone (don't touch prod)**
   - Backups → "Restore to new project" or use the Supabase CLI:
     ```
     supabase db dump --db-url "postgres://...prod..." -f /tmp/prod_dump.sql
     supabase db reset --db-url "postgres://...clone..." --linked
     psql "postgres://...clone..." -f /tmp/prod_dump.sql
     ```
   - Or via dashboard: create a new short-lived project, restore from
     the latest prod backup.

3. **Smoke test on the clone**
   - `SELECT count(*) FROM applications` — should match prod (within
     ~5 min lag).
   - `SELECT count(*) FROM payu_payments WHERE status = 'success'`.
   - Boot AdminPanel pointing at the clone (`VITE_SUPABASE_URL` override).
   - Verify Trips list, Recent applications, Chats render.

4. **Tear down**
   - Delete the clone project so it doesn't accrue cost.

5. **Document**
   - Add `details/BACKUP_VERIFIED_<date>.md` with: timestamp, backup
     used, restore time, what was checked. Re-run quarterly.

---

## M7 — Stale Vercel preview cleanup

**Goal:** preview deploys accumulate from old branches; some still hold
prod env vars or expose un-feature-flagged work. Burn the old ones.

1. **List previews**
   ```
   vercel list --token <YOUR_TOKEN>
   ```
   Filter to non-`main` deployments older than ~30 days.

2. **Audit before deleting**
   - For each old preview, check whether the URL is shared anywhere
     (Slack, docs, customer convos). The Vercel dashboard shows
     "Deployment Sources" per project.
   - Anything tagged with a branch that's been merged & deleted → safe
     to remove.

3. **Delete in batches**
   ```
   vercel remove <deployment-url> --yes
   ```
   Or in the dashboard: Project → Deployments → bulk select → Delete.

4. **Lock down going forward**
   - Project settings → Git → Ignored Build Step: skip preview builds
     for branches matching `dependabot/*`, `renovate/*`, etc.
   - Or: enable Vercel password-protection on Preview environment
     (Settings → Deployment Protection → Password Protection: Standard
     Protection → Apply to Preview).

5. **Verify .env preview vars**
   - Project Settings → Environment Variables → filter "Preview".
   - **Preview should NOT use the prod `VITE_SUPABASE_URL`** — we
     hardened src/supabase.ts to crash if env is missing, but double-
     check no preview env points at the prod DB.

---

## M8 — PayU end-to-end test in sandbox

**Goal:** prove the full booking flow works against PayU's test
environment before flipping `PAYU_BASE_URL` to `https://secure.payu.in/_payment`.

### Prerequisites
- Sandbox credentials from PayU dashboard:
  - `PAYU_MERCHANT_KEY` (test key)
  - `PAYU_MERCHANT_SALT` (test salt)
  - `PAYU_BASE_URL` = `https://test.payu.in/_payment`
- Test invitee phone added to `invited_numbers` (the C1 guard).

### Test matrix

| # | Scenario | Test card / UPI | Expected |
|---|----------|----------------|----------|
| 1 | Successful card payment | `5123456789012346` (Mastercard), CVV `123`, expiry any future, OTP `123456` | redirect to /payment-success, `applications.status = advance_paid`, admin push fires |
| 2 | Failed card payment | `5123456789012346` with OTP `111111` | redirect to /payment-failure, no status change, retry-friendly |
| 3 | UPI success | `success@axisbank` (PayU's mock UPI ID for SUCCESS) | same as #1 |
| 4 | UPI failure | `failure@axisbank` | same as #2 |
| 5 | User abandons after redirect | close tab on PayU page | no status change; cleanup confirmed |
| 6 | Balance payment (after advance) | repeat #1 with `isBalancePayment: true` | `status = fully_paid`, fully_paid push fires |
| 7 | Invited-only guard | run #1 with a phone NOT in `invited_numbers` | create-payu-order rejects with 403 |
| 8 | Webhook reaches Supabase | check `payu_payments` row after #1 | row exists with `mihpayid`, `status='success'` |
| 9 | Idempotent webhook | manually re-POST the same callback to payu-webhook | no duplicate row, no double push |
| 10 | CSP doesn't block redirect | test in production-built bundle (`npm run build && vercel deploy --prebuilt`) — confirm browser allows POST to PayU and back | no CSP violations in browser console |

### What to verify after each scenario
- **Admin panel** People tab: application row updates correctly.
- **Admin push notifications**: pushed within ~5s of payment.
- **Sentry**: no errors logged for payment paths.
- **payu_payments** table: PayU's response stored, no PII leakage beyond
  what's needed.

### After matrix passes
- Update Vercel prod env: `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`,
  `PAYU_BASE_URL=https://secure.payu.in/_payment`.
- Run **one** real-money smoke test (₹1 or smallest allowed). Refund
  immediately from PayU dashboard.
- Update `details/PAYU_GO_LIVE_<date>.md` with: who tested, which
  scenarios, when sandbox→prod cutover happened.

### Rollback plan
- If a prod payment fails in a way sandbox didn't catch:
  - Set `PAYU_BASE_URL=https://test.payu.in/_payment` in Vercel env
    (effectively disables real payments) — takes ~30s to propagate.
  - Note: this leaves bookings stuck mid-flow. Better: temporarily
    flip the booking CTA to a manual-payment fallback (already wired
    in AppFlow.tsx for the "I'll pay manually" path).
