# Dead-code audit report — 2026-07-13

> **Update 2026-07-18: Tier 1 AND Tier 2 are DONE.** Tier 1 (items 1-20)
> went in commits aac6ee7…836cb62; Tier 2 (items 23-27, 29-30, 35-40 —
> live-chat, chat-wizard steps, phantom countdowns, openSharedInviteBooking,
> the two admin flags, and all seven images) in commits 33dfff7…5632987.
> Everything verified with tsc + production build + browser walkthrough.
> Still open by choice: items 21-22 (un-exports), 28 (itineraryRef),
> 31 (send-push-notification webhook branch), 32 (applyMethodFee.rate),
> 33 (tsx devDep), 34 (PaymentOverlay setters) and the untracked local
> clutter. The sold-out re-check question from item 24 is tracked as its
> own follow-up task. Before pushing: glance at AiSensy/Brevo dashboard
> templates for hot-links to payment-qr.png / join-poster images.

Read-only audit. **Nothing was removed or changed.** Six parallel analysis passes covered: cross-file imports/exports, npm dependencies, App.tsx, AppFlow.tsx, AdminPanel.tsx + admin sub-files, all 13 Supabase edge functions, migrations/cron wiring, and every static asset. Every finding below was verified with reference-count greps; the headline items were independently re-verified by the orchestrator.

Legend:
- ✅ **SAFE** — zero references anywhere; deleting it cannot change behavior.
- 🟡 **LIKELY SAFE** — dead in the code, but with a named caveat to check first.
- 🔒 **KEEP** — looks dead but is deliberately parked or externally used. Do not delete.

---

## Tier 1 — Safe to remove (verified zero references)

### Frontend code

| # | Item | Location | What it is |
|---|------|----------|------------|
| 1 | `EVENTS` mock array + its private types `Event`, `TripDate`, `FAQ`, `QuickInfoIcon`, `Message` | `src/App.tsx:20-245` (~220 lines) | Pre-Supabase mock event data. Real events come from `src/supabase.ts` fetchers. Referenced nowhere. |
| 2 | `GENERAL_ANNOUNCEMENTS` (App copy) | `src/App.tsx:241-245` | Orphaned duplicate. The live copy is in `AppFlow.tsx:400`. |
| 3 | `ReplyContainer` component | `src/App.tsx:3206-3213` | Superseded "Choose your reply" card; never rendered. |
| 4 | Unused icon import `Ticket` | `src/App.tsx:3` | Imported from lucide-react, never used. |
| 5 | Unused icon imports `Star, Home, Timer, Minus, Train, Car` | `src/AppFlow.tsx:7` | Never used. |
| 6 | `SUPABASE_FUNCTIONS_URL` (AppFlow copy) | `src/AppFlow.tsx:411` | Orphaned; App.tsx and PaymentOverlay.tsx have their own live copies. |
| 7 | `Badge` component | `src/AdminPanel.tsx:208-214` | Status pill, zero render sites. (`statusColor`/`statusLabel` it calls stay — used elsewhere.) |
| 8 | `StringListEditor` component | `src/AdminPanel.tsx:8241-8282` | Generic list editor, zero render sites. |
| 9 | `doubtSubmissions` state + `DoubtSubmission` type | `src/AdminPanel.tsx:301` + type at `:114` | Never read; the live equivalent is `planDoubts`. Type is used only by this dead state. |
| 10 | `generalAnnouncementsText` state | `src/AdminPanel.tsx:306` (+ setter calls at 721, 2241, 2259) | Write-only leftover from single-textarea → 3-field refactor; `globalAnnouncementsFields` is what's actually saved. |
| 11 | `otherActionById` state | `src/AdminPanel.tsx:552` | Never set, never read. |
| 12 | Unused `useMemo` import | `src/JourneyMap.tsx:13` | Never called. |
| 13 | `@keyframes shimmer` | `src/index.css:35` | Components define their own inline shimmer keyframes; verified no Tailwind arbitrary `animate-[shimmer…]` usage. |

### Edge functions (repo code only — deleting deployed copies is a separate ops step)

| # | Item | Location | What it is |
|---|------|----------|------------|
| 14 | `pickBookingSteps()` helper ×3 | `payu-callback/index.ts:89-97`, `payu-webhook/index.ts:78-86`, `verify-pending-payments/index.ts:90-98` | Identical copy-pasted helper, never called in any of the three. Superseded by `pickMeetingSpotStep`/`pickBalanceDueStep`. |

### npm dependencies (package.json)

| # | Package | Evidence |
|---|---------|----------|
| 15 | `@google/genai` | Zero imports in src/. Also dead with it: the `GEMINI_API_KEY` define block in `vite.config.ts` and the README's AI-Studio boilerplate. |
| 16 | `dotenv` | Never imported; Vite's own `loadEnv` is used instead. |
| 17 | `express` + `@types/express` | Never imported; `api/webhook.js` uses raw Node `http`/`crypto`. |
| 18 | `html2pdf.js` | Superseded — App.tsx uses a dynamic `import('jspdf')` (`App.tsx:4779`). |
| 19 | `autoprefixer` | No postcss/tailwind config exists; Tailwind v4 via `@tailwindcss/vite` doesn't need it. |
| 20 | `vite` duplicate entry | Listed in BOTH dependencies and devDependencies, same version. Drop one (keep devDependencies). |

Removal = edit package.json, run `npm install`, run `npx tsc --noEmit` + `npm run build`.

### Unused export keywords (keep the code, just drop `export`)

| # | Item | Location |
|---|------|----------|
| 21 | `mapDbEventToEvent` | `src/supabase.ts:79` — used internally by fetchers, never imported elsewhere. Do NOT delete the function, only the `export` keyword. |
| 22 | `JourneySeedNode`, `JourneySeedEdge`, `JourneyMapSeed` types | `src/journeyMapSeeds.ts:15,22,34` — only used inside the file. |

---

## Tier 2 — Likely safe (dead, with one caveat each)

| # | Item | Location | Caveat |
|---|------|----------|--------|
| 23 | Retired live-chat subsystem (invite side): state + effects + `startLiveChat` + `sendLiveChatMessage` (~85 lines), `LiveChatScreen` + its gate (~140 lines) | `src/App.tsx:1659-1666, 2494-2575, 5166-5299, 5424-5430` | Deliberately deprecated (RLS blocks anon inserts; 0 rows ever in prod per in-code comment). Twin copy in `AppFlow.tsx:876-883, 1592-1629, 3624-3673`. Remove both files' copies together (~300 lines total) or neither — partial removal creates drift. Tiny edge: a device with a stale `liveConversationId` in localStorage from a very old deploy would just see the normal app. |
| 24 | `openSharedInviteBooking` | `src/App.tsx:2611-2662` (52 lines) | Never called — BUT it contains a sold-out re-check that the live inline click handlers (e.g. `App.tsx:3349, 3477`) do NOT have. Decide separately whether that re-check should be ported into the live handlers before deleting. |
| 25 | Old chat-wizard steps: `ASK_CITY`, `ASK_CATEGORY`, `ASK_GENDER`, `ASK_TRANSPORT` cases + handlers `handleCitySelect`, `handleCategorySelect`, `handleGenderSelect`, `handleTransportSelect` + write-only `bookingGender`/`bookingTransport` state | `src/AppFlow.tsx:2032-2117, 1338-1376, 1569-1589` | No `setStep` call targets these steps (verified exhaustively). Remove as one unit, not piecemeal. |
| 26 | Phantom countdown `timeLeft` + `initialTimeLeft` + its 1-second interval | `src/AppFlow.tsx:4091-4092, 4176, 4213-4219` | Value never rendered; currently forces a needless re-render every second while the calendar is open. Removing is a small perf win. |
| 27 | Phantom countdown `balanceCountdown` + effect | `src/AppFlow.tsx:867, 1267-1284` | Never rendered (App.tsx has its own separate, live countdown). Lost its consumer at some point. |
| 28 | `itineraryRef` | `src/AppFlow.tsx:4139, 4744` | Ref attached but `.current` never read. Inert. |
| 29 | `affiliatesLoading` state | `src/AdminPanel.tsx:480, 911, 918` | Write-only. Could instead be wired to a spinner — dead code vs. missing UI, owner's call. |
| 30 | `savingCallId` state | `src/AdminPanel.tsx:542, 1670, 1681` | Same pattern — likely a forgotten "Saving…" indicator. |
| 31 | `doubt_messages` webhook branch in send-push-notification | `supabase/functions/send-push-notification/index.ts:272-290` | Orphaned since the PWA-chat DB trigger was dropped (`20260601_admin_push_triggers.sql:29-30`). Theoretical residual: a dashboard-configured DB webhook (none evidenced). |
| 32 | `applyMethodFee().rate` return field | `supabase/functions/create-payu-order/index.ts:99-107` | Callers only read `.total`/`.method`. Dead data, not dead logic. |
| 33 | `tsx` devDependency | package.json | No script/workflow invokes it; could be used ad-hoc from CLI. Dev-only, low risk. |
| 34 | `setName`/`setPhone` in PaymentOverlay | `src/PaymentOverlay.tsx:284-285` | Setters unused by design (fields read-only at pay time). Cosmetic: could be plain consts. |

### Assets — dead in code, but check external templates first

These are unreferenced by any code, HTML, or manifest. **Caveat:** files in `public/` are reachable by plain URL (e.g. `https://…/payment-qr.png`), so an old AiSensy/WhatsApp template or email configured in a dashboard could still hot-link them — grep can't see those dashboards. `payment-qr.png` in particular smells like the old manual-UPI era. Check AiSensy/Brevo templates before deleting.

| # | File | Notes |
|---|------|-------|
| 35 | `public/icon.png` | manifest uses icon-192/512; HTML uses apple-touch-icon |
| 36 | `public/details-landscape-apr24.png` | dated session artifact |
| 37 | `public/join-poster.png`, `public/join-poster-founder.png` | old campaign posters? |
| 38 | `public/payment-qr.png` | pre-PayU manual UPI QR — check WhatsApp templates |
| 39 | `public/chat-profile.jpg` | app imports the `src/assets/` copy instead (orchestrator-verified; the first pass got this one wrong) |
| 40 | `src/assets/join-letter-logo.png` | never imported |

### Untracked local clutter (not in git; deleting affects only your machine)

`~$aptera-website-feature-catalogue.docx` (Word lock file), `.DS_Store` files, `work/` (gitignored scratch), `dist/` (build output, regenerated), `chaptera-business-model-sustainability-report/`, `chaptera-operations-vision-report/`, `chaptera-website-feature-catalogue.docx`, `synthetic-customer-swarm-handoff.md`, `creator-carousel/`, `tools/` — archive elsewhere if you want to keep the reports/docs.

---

## Tier 3 — Looks dead, KEEP

| Item | Location | Why keep |
|------|----------|----------|
| `OtherCityForm` (~197 lines) | `src/AdminPanel.tsx:7667-7863` | Explicit in-code comment (`:2640-2643`): deliberately dormant so the Other Cities flow can be revived by re-adding one JSX block. |
| Google Sign-In / already-booked detection (~250 lines) | `src/AppFlow.tsx:688-742, 815-841, 1686-1705, 2820-2866` | Explicit comment: intentionally no longer hydrated; parked, not forgotten. |
| `'affiliates'` localStorage migration guard | `src/AdminPanel.tsx:264` | Real users may still have the old tab value cached. (The `'affiliates'` member in the tab type union is vestigial — cosmetic only.) |
| `api/webhook.js` | repo root | Meta WhatsApp webhook — called externally by Meta via Vercel's filesystem routing; no internal import is expected. |
| All 13 edge functions | supabase/functions/ | Every one has a live caller: client invoke, pg_cron, DB trigger, or external webhook (PayU/Brevo/Meta). None deletable. |
| `payu-webhook`, `brevo-webhook` | — | Callers are configured in PayU/Brevo dashboards; unverifiable from code but expected. |
| `public/email-previews/` (7 HTML files) | — | Design reference copies of edge-function emails. Documentation value. |
| `tools/generate_creator_carousel.cjs` | — | Manual one-off generator. Note: it requires `sharp`, which isn't in package.json — it would fail if run today. |
| `normalizeStatus` `'fixes_needed'` mapping | `src/ProductRoadmap.tsx:101-105` | Read-side compat shim for legacy rows. |
| `@types/node`, `tailwindcss` devDeps | package.json | Used indirectly by tooling. |
| `scripts/test-aisensy-deeplink.mjs` | — | Wired to `npm run test:aisensy-deeplink`. |
| All root/details `.md` handoff & proposal docs | — | Documentation, referenced by the auto-memory system. |

Retired `roadmap_tasks`/`roadmap_test_runs`/checklist feature: **zero code remnants in src/** — already fully cleaned. (Old migrations mentioning them are history; migrations are never deleted.)

---

## Side findings (not dead code, surfaced during the audit)

1. **`cart-abandonment` cron job is not in migrations.** The job (`cart-abandonment-check`) was evidently created directly against prod; if the DB were ever rebuilt from migrations alone, this cron would silently not come back. Worth capturing in a migration someday.
2. **Sold-out re-check gap** — see item 24: the dead `openSharedInviteBooking` had a sold-out re-check the live handlers lack.
3. **`quickInfo[].icon` is written by admin but never read** — rendering matches on `.label` instead (`AppFlow.tsx:30/44`, `AdminPanel.tsx:6743/6752`).
4. **`.idea/` is tracked in git** despite being gitignored (added to .gitignore after the fact). Fixing needs `git rm --cached` — cosmetic, low priority.
5. **`@` path alias** configured in tsconfig/vite but never used by any import.
6. **`AdminPanel.tsx` is now ~8.3k lines**, not the ~6.6k the CLAUDE.md file map says.

## Rough size of the prize
Deleting all Tier 1 + Tier 2 code items ≈ **1,100+ lines of source** plus 6 npm packages and ~7 image files. None of it changes runtime behavior (that's the definition used throughout: zero live references).
