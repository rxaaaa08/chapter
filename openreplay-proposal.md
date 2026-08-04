# OpenReplay (Self-Hosted Session Replay) — Proposal & Build-vs-Keep Decision

**Status: PROPOSAL ONLY — nothing built. No code, DB, or dependency has been changed.**
*Written 2026-07-27 after reading the live front-end. Anchor on file/function names, not
line numbers. This doc answers a plain question — "should we adopt OpenReplay?" — and the
honest answer depends on one fact the founder may not have realised: **we already run
session replay in production.** Read §1 before §3.*

---

## 0. The idea in one paragraph

OpenReplay is an **open-source, self-hostable "DVR for your website"**: it records real
user sessions and lets you replay them like a video (rebuilt from the page, not a real
video), with the console errors and every network call attached. The pitch is that,
unlike most rivals, **the recordings can live on our own server** instead of a US vendor's
cloud — attractive for an app that handles Indian customers' phone numbers and live PayU
payments. The question this doc settles is not "is session replay useful" (it is, and
we already have it) but "**is OpenReplay worth adding or swapping in, given what we
already run?**"

---

## 1. What we ALREADY have (read this first)

We are **not** starting from zero. The live site already ships three overlapping
observability tools:

| Tool | Where it's wired | What it gives us today |
|---|---|---|
| **Contentsquare** | `index.html` (`t.contentsquare.net/uxa/…`, loaded `async`) | **Session replay**, heatmaps, zone/experience analytics. Privacy pre-configured: `setPrivacyAttributes({ ipHashing: true, denyAdvertising: true })`. |
| **Sentry** | `src/main.tsx` (`@sentry/react`, `Sentry.init`) | JS error tracking, `tracesSampleRate: 0.2`, `sendDefaultPii: false`, prod-only. Sentry also has its own replay add-on (not currently enabled). |
| **Google Analytics** + our own `flow_analytics` / `analytics_daily` | app-wide | Funnels, per-event drop-off, the Experiments tab. |

We have also **already done the hard privacy work** that any replay tool needs:
- `src/main.tsx` runs a `MutationObserver` that auto-stamps `data-cs-mask="masked"` on
  every `tel`/`email` input and any text input whose placeholder matches
  `/name|phone|email|number/i`, re-applying on every React re-render.
- The in-app privacy notice (`src/App.tsx` ~4412) **already names Sentry, Google
  Analytics and Contentsquare** as sub-processors that may process limited data outside
  India — so our DPDP disclosure is written around the current stack.

**Implication:** the incremental value of OpenReplay is only the *delta* over
Contentsquare + Sentry — not the full value of "session replay." Most "OpenReplay helps
you debug abandoned bookings" benefits are things Contentsquare can already do today.

---

## 2. What OpenReplay is (the full picture)

Per session it can capture:
- **Session replay** — clicks, taps, scrolls, page transitions, on the real (mobile)
  viewport. Same category as Contentsquare.
- **DevTools** — console logs, JS errors, and a **full network waterfall** (every fetch
  to Supabase / edge functions with status + timing). *This is richer than Contentsquare's
  replay and closer to Sentry, but tied to the visual replay.*
- **Redux / state plugin** — optional, see app state at each moment.
- **Performance** — Core Web Vitals, slow frames, memory/CPU.
- **Assist / co-browse** — live-watch a user's screen in real time (support use case).
- **Product analytics** — funnels, heatmaps, rage-click / dead-click detection.

**Genuine differentiators vs our current stack:**
1. **Self-hosting / data ownership** — recordings can stay on our infra (DPDP story:
   customer session data never leaves India if we host in-region). Contentsquare is a
   US/EU SaaS.
2. **Network-trace-linked replay** — "watch the session AND see the exact
   `open-event-otp` / `create-payu-order` / `payu-callback` call that failed" in one
   pane. Our current split is Contentsquare (visual) + Sentry (errors) + Supabase logs
   (network) — three tools, manually correlated.
3. **Open-source / no per-session SaaS bill** if self-hosted.

**Where it does NOT add much:** basic replay, heatmaps, rage-click — Contentsquare
already covers these.

---

## 3. Recommendation

**Do NOT bolt OpenReplay on as a fourth tracker.** Running Contentsquare *and* OpenReplay
simultaneously means two full session-replay scripts on a mobile-first page (perf cost),
two privacy sub-processors to disclose, and double the masking surface to keep correct.
That's a net loss.

Instead, pick **one** of these three paths:

- **Path A — Do nothing (recommended default).** We already have replay (Contentsquare)
  + errors (Sentry). If the real pain is "correlate a replay with the failing network
  call," the cheaper fix is to **enable Sentry's own Session Replay add-on** (one config
  block in `main.tsx`, reuses our existing Sentry project and masking philosophy) rather
  than stand up a new service. Try this first.
- **Path B — Adopt OpenReplay and RETIRE Contentsquare.** Justified only if the
  **data-residency / self-hosting** argument matters enough to run our own server. This
  is a *replacement*, not an addition: we'd remove the Contentsquare script, add the
  OpenReplay tracker, re-point the masking, and update the privacy notice. Net tool count
  stays the same.
- **Path C — Trial OpenReplay Cloud, test-data only.** Spin up the free cloud tier, point
  it at a local `npm run dev` session, and drive it **only with test phone `90000000xx`**
  so no real PII is recorded. Decide between A and B from hands-on feel. Low commitment.

My call: **Path C to evaluate → then Path A unless the self-hosting/DPDP case is strong,
in which case Path B.** Adding it as a fourth tool is off the table.

---

## 4. Integration plan (only if Path B or the eval in Path C)

Pure front-end change. **No Supabase schema, RPC, or edge-function change. No deploy of
any edge function.** Fits the "one concern per commit, `tsc` must pass" workflow.

**4.1 Install**
```bash
npm install @openreplay/tracker
```

**4.2 Initialise once, masking ON from the first line** — a new `src/observability/openreplay.ts`,
imported at the top of `src/main.tsx`. Crucially, **mirror the existing masking rules**
so we don't regress the DPDP posture we already have:
```ts
import Tracker from '@openreplay/tracker';

export const tracker = new Tracker({
  projectKey: import.meta.env.VITE_OPENREPLAY_KEY,
  // self-hosted only: ingestPoint: 'https://<our-openreplay-host>/ingest'
  obscureInputEmails: true,
  obscureInputNumbers: true,   // phones / OTP typed into inputs
  obscureTextNumbers: true,    // amounts / phones rendered as text (safer default)
  defaultInputMode: 1,         // obscure all inputs by default; opt IN to record
  network: {                   // don't record Supabase JWTs or PayU payloads
    capturePayload: false,
    sanitiser: (msg) => msg,   // strip auth headers here if capturePayload ever on
  },
});
if (import.meta.env.PROD) tracker.start();  // prod-only, like Sentry
```

**4.3 Re-point the existing masking.** `main.tsx` already tags sensitive inputs with
`data-cs-mask`. OpenReplay uses its own attribute (`data-openreplay-hidden` /
`data-openreplay-obscured`). Extend the existing `MutationObserver` block to stamp **both**
attributes (or the OpenReplay one if we're on Path B and Contentsquare is gone), so the
same tel/email/name/number inputs stay masked. **Additionally hand-tag** things the
placeholder heuristic won't catch:
  - the OTP code display in the open-event flow (`src/AppFlow.tsx`),
  - the payment amount / bill lines in `src/PaymentOverlay.tsx` (`NativePaymentOverlay`)
    and the `PayUReturnScreen` receipt in `src/App.tsx`.
  - (The PayU-hosted page itself is off our domain and never recorded — good.)

**4.4 Attribute a session to a booking WITHOUT leaking PII**
```ts
tracker.setUserID(last4OrHash);          // never the raw 10-digit phone
tracker.setMetadata('event_slug', slug); // so we can filter sessions per event
```
Then in the dashboard: "show abandoned sessions for event X."

**4.5 Optional plugins:** `@openreplay/tracker-assist` (live co-browse for support),
`@openreplay/tracker-redux` (only if we ever wire Redux — we don't today).

**4.6 If Path B — remove Contentsquare:** delete the `_uxa` / `t.contentsquare.net`
block from `index.html`, and (optionally) rename `data-cs-mask` handling. Update the
privacy notice in `App.tsx` to swap "Contentsquare" for "OpenReplay (self-hosted, data
in India)" — which is actually a *stronger* DPDP statement.

---

## 5. Privacy / DPDP — the blocker to respect

Session replay records the live DOM, so **by default** it would capture guest phone
numbers, emails, on-screen OTP codes, and payment amounts. We already treat this
seriously for Contentsquare; OpenReplay must clear the same bar **before any real
customer is recorded**:
- masking configured (§4.2/§4.3) and **verified on a real replay**, not assumed;
- network payload capture **off** so Supabase JWTs / PayU data aren't stored;
- if self-hosting (Path B), host **in-region (Mumbai)** so the DPDP disclosure improves;
- privacy notice updated to match whatever the final tool list is.

**Golden-rule fit:** this touches no DB and deploys no edge function, so it doesn't risk
production data directly. The only risk is *recording* production PII — which the eval
(Path C, test phone `90000000xx` only) is designed to avoid.

---

## 6. Cost (2026)

- **Open-source self-hosted** — free software; real cost is the server (Postgres + a
  small Docker/K8s stack) + our ops time. Cheapest licence, most maintenance.
- **Cloud Free** — $0, ~1,000 sessions/mo, 30-day retention. Fine for the Path C eval.
- **Cloud Pay-as-you-go** — ~$5.95 / 1,000 sessions/mo, unlimited users/projects.
- **Dedicated (managed VM)** — ~$199/mo (~$0.276/hr), dedicated VM in its own VPC,
  no limits, 7-day free trial no card. The "self-hosting benefits without running K8s"
  option, if Path B is chosen but we don't want to operate it ourselves.

For our traffic (tens of sessions/week), the cloud free tier likely covers real usage
indefinitely — but that reintroduces the US-cloud residency question that self-hosting
was meant to solve. That tension is exactly why Path B only makes sense if data
residency is the *reason* we're doing this.

---

## 7. Decision checklist (for the founder)

1. **Is the real goal debugging, or data residency?**
   - *Debugging abandoned bookings / OTP / PayU* → **Path A** (enable Sentry Replay; we
     already own Sentry) is cheaper than a new tool.
   - *Keeping customer session data in India / off US SaaS* → **Path B** (OpenReplay
     self-hosted, retire Contentsquare) is the only path that delivers it.
2. **Are we willing to run a server (or pay ~$199/mo managed)?** If no → self-hosting is
   out; OpenReplay's main edge disappears; stay on Path A.
3. **Confirm we do NOT want two replay tools at once.** (This doc assumes replace, not
   add.)
4. **Green-light the Path C eval?** (Free cloud tier, `npm run dev`, test phone only —
   zero production risk, gives a real feel before committing.)

*Nothing in this doc has been built. Next step is the founder picking A / B / C above;
only then does any code get written.*
