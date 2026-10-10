# Secrets rotation runbook

This repo committed a VAPID private key (`pwa.md:304`, pre-redaction commit).
The leak is in git history, so anyone with read access to the repo at any
point in the past — including any GitHub Actions, CI mirrors, code search
crawlers — can still recover it. Treat the key as compromised and rotate.

## Active secrets that have been exposed

| Secret | Where it leaked | Severity |
|--------|-----------------|----------|
| `VAPID_PRIVATE_KEY` | `pwa.md:304` in commits prior to the redaction | High — anyone with the key can forge push notifications signed by chaptera.in to any subscribed user |

## VAPID key rotation steps

> Rotating invalidates existing push subscriptions. The 4 rows currently in
> `push_subscriptions` and 2 rows in `admin_push_subscriptions` will stop
> receiving notifications until users re-subscribe.

1. **Generate a new keypair**
   ```bash
   npx web-push generate-vapid-keys --json
   ```
   Store the output in your password manager (1Password / Bitwarden).
   Never paste it into a file in this repo.

2. **Update Supabase edge function secrets**
   - Dashboard → Project `txcmismkdttgsyhbnexf` → Edge Functions → `send-push-notification` → Secrets
   - Replace `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` (keep `VAPID_SUBJECT`).
   - Repeat for `send-admin-push` (same values).

3. **Update the client-side public key**
   - `src/AdminPanel.tsx:238` — replace the `VAPID_PUBLIC_KEY` constant
     with the new public key. (Public key in source is expected;
     browsers need it to subscribe.)
   - Deploy the new build to Vercel.

4. **Drop stale subscriptions** (they'll fail anyway, this just keeps the
   table clean)
   ```sql
   TRUNCATE public.push_subscriptions;
   TRUNCATE public.admin_push_subscriptions;
   ```

5. **Have all admins re-subscribe**
   - Open AdminPanel on every admin's device → Notifications tab →
     "Subscribe this device".

6. **Verify**
   - Trigger a test push (e.g. submit a doubt form) and confirm at least
     one admin device receives it.

## Going forward — secrets hygiene

- **Never paste live secrets into markdown, READMEs, handoff docs.** Use
  `<from secrets manager>` placeholders.
- **Add a pre-commit hook to block secret-shaped strings** — gitleaks
  or trufflehog with a tiny config blocks anything matching VAPID,
  Supabase service_role, PayU salt, etc.
- **GitHub repo secret scanning**: ensure it's enabled (Settings →
  Code security → Secret scanning).
- **For any secret you find committed**, rotate immediately — do NOT
  rely on `git filter-repo` cleanup alone. Once leaked, leaked.

## Other secrets to audit

| Secret | Status |
|--------|--------|
| `PAYU_MERCHANT_KEY` | Server-side only (edge function env) — OK |
| `PAYU_MERCHANT_SALT` | Server-side only — OK |
| `WHATSAPP_ACCESS_TOKEN` | Server-side only — OK |
| `X-Admin-Push-Secret` (C3) | Server-side only — OK |
| `GEMINI_API_KEY` | In `.env.local` (gitignored). Not committed but lives on dev laptops in plaintext. Acceptable for now. |
| Supabase `service_role` key | Server-side only — OK |
| Supabase `anon` key | Public by design — OK |
