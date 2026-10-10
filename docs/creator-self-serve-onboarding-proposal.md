# Self-serve creator onboarding — proposal

_Status: PROPOSAL, not built. Written 2026-07-21._

## 1. The problem, in one line

200+ creators want to partner, and today each one costs you a live meeting **plus**
a manual row-entry in the admin panel. That doesn't scale, and none of it is
tracked. We want the creator to onboard themselves — watch, understand, prove it,
pick their handle, verify their number — and land in the dashboard, with you doing
**zero** per-creator work (or one tap of "approve", if you want a gate).

## 2. What already exists (so we build the minimum)

- **`affiliates` table** — `id, handle, name, email, active`. A creator IS a row here.
  Handle: lowercase `[a-z0-9._]`, ≤40, unique. Email: unique.
- **Creator = a Google login whose email is an active `affiliates` row.** They're kept
  out of `admin_users` on purpose, so they can never read customer data. Login is
  Google OAuth on `/creator`.
- **The dashboard already handles the "logged-in-but-no-creator-row-yet" state** — it
  shows a polite "not a creator account" screen. During onboarding, the person is
  literally in that state until we insert their row. So onboarding lives naturally
  next to the existing login.
- **A proven OTP engine** (`supabase/functions/open-event-otp`) — WhatsApp with email
  fallback, 6-digit, rate-limited (2 / 10 min), atomic verify. **But it's tied to an
  event slug today**, so we either add a "creator signup" mode to it or spin a tiny
  sibling function. (See §6.)
- **AiSensy WhatsApp** — already wired for other flows, reusable for a welcome message.
- **The event details bottom sheet** in `AppFlow.tsx` — the same sheet the `/invite`
  "Re-check plan details" button opens. Your "See upcoming events" idea reuses this.

The upshot: we are mostly **wiring existing parts together**, not building a new system.

## 3. The one change that makes the whole thing safe: log in FIRST

Your draft order was: video → quiz → _then_ type name / handle / phone / **preferred
gmail**. There's a trap hiding in that last step.

The creator's login is **Google**. If they *type* a "preferred gmail" but later sign
in with a *different* Google account, the dashboard won't find their row and they're
stuck on "not a creator." Typed email ≠ the account they actually authenticate with.

**Fix: put "Continue with Google" at the very start of the New-Creator path.** Then:

- the email is **verified and authoritative** — it's the exact account they'll always
  log in with, no typo, no mismatch;
- everything after (video, quiz, handle, phone) happens in one signed-in session;
- at the end we insert the `affiliates` row with `email = that Google email`, and the
  dashboard finds it immediately.

This removes an entire class of "I can't log in" support tickets. It costs one extra
tap up front, framed as _"Sign in to start — this is the account you'll use forever."_

## 4. The recommended flow

_Decisions locked 2026-07-21: no phone OTP; collect UPI; no auto-WhatsApp for v1
(link shared manually)._

```
/creator
 └─ [ I'm already a creator ]  → existing Google login → dashboard   (unchanged)
 └─ [ I'm a new creator ]      → onboarding:

    Step 0  Continue with Google        ← captures verified email (the login, forever)
    Step 1  Watch the welcome video      (your Vimeo, unlisted + domain-locked)
    Step 2  Quiz — must pass to continue  (5 MCQs; answers checked server-side)
    Step 3  Your details:
            • Claim your @handle          (live "available ✓ / taken ✗")
            • Your name
            • UPI ID for payouts          ← §5, real gap today
            • Phone (optional, unverified) so you can reach them
    Step 4  Done → land straight in the dashboard
```

No OTP step — Google sign-in already proves who they are, so the phone is just an
optional contact field (plain text, no verification). Progress is stored in
`sessionStorage`/`localStorage` so an accidental refresh (or the OAuth redirect bounce)
doesn't send them back to step 0.

**A note on Tally.** Tally is great for collecting creator *interest* (how the 200 came
in), but the actual onboarding has to be native on `/creator` — because only a native
flow can (a) capture the exact Google login email, (b) check handle availability live,
and (c) auto-create the `affiliates` row so the dashboard works instantly. A Tally form
would still leave you hand-entering every row, which is the thing we're removing.

**Video (step 1).** Host on Vimeo as **unlisted + domain-restricted to chaptera.in**
so the link can't circulate. Add a "you must watch to the end" gate only if you care —
the quiz is the real comprehension check, so I'd let them scrub.

**Quiz (step 2) — 5 questions, all must be correct, reshuffled.** Drafted from your real
rules (perfect later):
1. **When do you earn a commission?** → _When someone books AND completes payment through
   my link._
2. **How much do you earn per booking?** → _8% of the full ticket price._
3. **When do creators get paid?** → _Monthly._
4. **Click, leave, come back a week later and book directly — do you earn?** → _No — they
   must book through your link in the same visit._
5. **Where does your link send people?** → _To the chapter அ experiences page, where they
   explore and book_ (not one specific event).

Wrong answers → "Re-watch this part" with a gentle retry. **Verify answers in the edge
function, not just the browser** — otherwise the quiz is trivially skippable by anyone
who opens dev tools. Low stakes (see §7) but cheap to do right.

## 5. Two gaps this surfaces — worth fixing while we're here

1. **There is nowhere to store how you actually pay a creator.** The `affiliates` table
   has no UPI / bank field. You track *what* you owe (`affiliate_sales`) and mark it
   paid, but the payout destination lives in your head or a chat. With 200 creators
   that breaks. **DECIDED: add `upi_id` (and `phone`) to `affiliates`, collected at
   step 3.** Small change, big operational relief. Surface the UPI in the admin Creators
   list so the "mark paid" step has the destination right next to it.

2. **Handle squatting / impersonation.** Self-serve means someone can claim `@nike` or a
   rival creator's handle. Financially it's near-harmless (see §7), but it's a brand
   risk. Mitigations, cheapest first:
   - Uniqueness + format check (already enforced by the DB) so no duplicates.
   - A "new / unreviewed" flag so you can eyeball new signups in the admin panel.
   - Optional later: verify Instagram ownership (creator DMs a code, or posts your link
     in their bio and we check). Not for v1.

## 6. The plumbing (plain-language, for the build later)

- **New edge function `creator-signup`** (service-role, so it can insert into `affiliates`
  which anon can't). It's the trust boundary — it re-checks, server-side, that:
  (a) the request carries a valid signed "quiz-passed" token, (b) the caller is actually
  signed in with Google (email taken from the auth token, never from the request body),
  (c) the handle is still free, (d) this Google email isn't already a creator, then
  inserts the row with the UPI. One function = one place all the rules live. **No OTP** —
  identity comes from the Google session.
- **Handle-availability check** — a tiny `SECURITY DEFINER` RPC `handle_available(h)` that
  returns true/false without exposing the affiliates table to anon.
- **Frontend** — a `CreatorOnboarding.tsx` component rendered on `/creator` when the
  "new creator" path is active; the existing `CreatorDashboard.tsx` stays as-is and just
  starts finding the row once signup completes.
- **Approval model — your call (§8).** Either auto-activate (`active = true` on insert)
  or insert as `active = false` and you tap approve in the existing Creators list. The
  existing pause/reactivate toggle already does the second one for free.

Nothing here touches the payments code, the deploy-held open-event batch, or customer
data. It's additive.

## 7. Why the security risk is low (so you can relax the gate)

A spam or fake creator **can't cost you money by existing**. Commission only accrues when
someone *actually books and pays* through their link, and only on events where you've
flipped `affiliate_enabled` on. A fake `@whoever` who never drives a real paid booking
earns ₹0. So the failure mode of "let anyone self-serve" is brand-tidiness (junk handles),
not financial loss — which means you can lean toward **frictionless auto-approve** and
clean up later, rather than gating every signup. Your choice in §8.

## 8. Feature ideas beyond your list (ranked by bang-for-buck)

**Tier 1 — do these with v1, they're cheap and compounding:**
1. **Capture UPI at signup** (§5.1) — DECIDED. Without it you can't pay 200 people cleanly.
2. **"See upcoming events" card — your idea, plus earnings framing.** Reuse the AppFlow
   details bottom sheet (same one as `/invite` "Re-check plan details"). On each event,
   show the creator **"you'd earn ₹X per booking"** — that turns a passive list into "here's
   what's worth promoting." _(No per-event link button — attribution is session-scoped and
   every creator link lands on the experiences page, not a specific event. The one link in
   their dashboard header is the link.)_ The earnings number should reflect reality: show
   ₹X only where the event actually pays (`affiliate_enabled`), otherwise omit it.
3. **A "your starter kit" block in the dashboard** — their link + 2–3 pre-written captions
   they can copy. (You have Canva tooling available; event creatives could be generated per
   event later.) Removes the "what do I even post?" stall that kills new creators.
4. _Auto welcome-WhatsApp — DEFERRED. For now you'll share the `/creator` onboarding link
   personally, so no AiSensy welcome template is needed yet. Revisit once volume makes
   personal outreach painful; the AiSensy plumbing is already there when you want it._

**Tier 2 — strong, but can follow:**
5. **Profile completeness / first-share nudge.** New creators who never share once are dead
   weight. A gentle "share your link to activate your earnings" until they've driven ≥1 click.
6. **Creator-refers-creator.** A creator's own link can recruit the next creator; small
   thank-you bonus. Turns 200 into 400 without you meeting anyone.
7. **"Rookie of the month"** on the existing leaderboard — spotlight best *new* creator, not
   just all-time top. Keeps newcomers motivated before they can out-earn veterans.

**Tier 3 — later, once volume justifies it:**
8. **Content submission + attribution** — creator pastes the reel/post URL they used; you see
   which content actually drove clicks. Feeds "what works" back to everyone.
9. **Instagram-ownership verification** for high-value or verified-badge creators (§5.2).
10. **Tiered commission** — top performers earn a higher %. (Needs the payout/price-lock work
    already noted in the dynamic-pricing proposal; don't front-run it.)

## 9. What I'd explicitly NOT do

- Don't let creators type their login email by hand — capture it from Google (§3).
- Don't trust the quiz client-side only — check it in the edge function (§4).
- Don't build a bespoke OTP — extend the one you have (§6).
- Don't gate hard on approval unless you *want* to review — the money risk is low (§7).
- Don't put customer data anywhere near the creator role — the whole point of the
  affiliates-not-admin_users design is that creators can't read applications/phones. Keep it.

## 10. Decisions

**Resolved 2026-07-21:**
- ✅ Collect UPI at signup.
- ✅ Drop phone OTP (phone kept as optional unverified contact).
- ✅ Auto welcome-WhatsApp deferred — onboarding link shared personally for now.
- ✅ 5 quiz questions drafted (§4), to be refined later.
- ✅ "You'd earn ₹X per booking" on the upcoming-events card; **no** per-event link.

**Resolved 2026-07-21 (round 3):**
- ✅ **Login-first confirmed** — "Continue with Google" is the entry point for the
  new-creator path. Build plan below (§11).

**Resolved 2026-07-21 (round 2):**
- ✅ **Auto-activate + a "new" flag.** New signups create their `affiliates` row with
  `active = true` immediately (link + dashboard work instantly, zero work for the owner).
  A flag on the row (e.g. `reviewed_at`, empty until cleared) marks them as
  "self-joined, not yet eyeballed." The admin Creators list highlights un-reviewed rows
  as a "new arrivals" tray so the owner can glance + clear on their own schedule — review
  is **optional and after-the-fact**, never a gate. Safe because a fake creator earns ₹0
  until a real paid booking (§7).
- ✅ **Video: allow scrubbing** — the quiz is the real comprehension check.
- ✅ **Free handle choice** — creators pick any available handle (no forced Instagram
  match). Uniqueness + format still enforced by the DB `CHECK`. Impersonation stays a
  low-severity brand risk mopped up via the new-arrivals tray, not a hard block.

## 11. Phased build plan

Principle: **back-end first, each phase independently safe and shippable.** Nothing
user-visible turns on until the piece under it is proven. Every phase ends with
`npx tsc --noEmit` green and (for DB) a `RETURNING`/SELECT proof. Follows the house rules:
non-destructive migrations only, **owner deploys the edge function** (never me), one
concern per commit, nothing pushed without an explicit go-ahead.

### Phase 1 — Schema + admin visibility  (backend only, invisible to creators)
_Goal: lay the data foundation and let the owner see/pay self-joined creators, with zero
change to the live creator flow yet._
- Migration on `affiliates` (all **nullable, additive** — safe on the live table):
  - `upi_id text` — payout destination (the real gap, §5.1).
  - `phone text` — optional contact.
  - `reviewed_at timestamptz` — **the "new" flag.** `NULL` = self-joined, not yet
    eyeballed; a timestamp = owner has reviewed. Existing hand-entered creators get
    back-filled to `now()` so they don't all show as "new" on day one.
- `handle_available(text) → boolean` — `SECURITY DEFINER` RPC so the onboarding page can
  check a handle without exposing the `affiliates` table to anon.
- Admin **Performance → Creators** list: show each creator's UPI next to "mark paid", and
  a **"NEW" badge + one-tap "Mark reviewed"** on un-reviewed rows (the new-arrivals tray).
- _Ships alone. No creator sees anything different._

### Phase 2 — `creator-signup` edge function  (backend, not yet wired to any button)
_Goal: build and prove the trust boundary before any UI can reach it._
- Service-role function that, in one call, verifies: (a) caller is signed in with Google
  (email read from the **auth token, never the body**); (b) the submitted quiz answers are
  all correct (correct set held server-side); (c) handle is free + valid; (d) this email
  isn't already a creator → then `INSERT` the `affiliates` row (`active = true`,
  `reviewed_at = NULL`, with name/handle/upi/phone).
- Tested by simulation (curl + SQL) with a `90000000xx`-style throwaway, then cleaned up.
- **Owner deploys it** (golden rule). Unreachable from the UI until Phase 3, so shipping
  it early is safe.

### Phase 3 — The onboarding UI on `/creator`  (the visible feature)
_Goal: the self-serve flow itself._
- Entry screen gains the fork: **"I'm already a creator"** / **"I'm a new creator"** —
  both go through Google login (intent stashed in `sessionStorage` so it survives the
  OAuth redirect bounce).
- After login, a new `CreatorOnboarding.tsx` drives: Vimeo video → 5-question quiz
  (scrub allowed; client gates the UI, the edge fn is the real check) → details form
  (@handle w/ live availability + name + UPI + optional phone) → calls `creator-signup`
  → drops them into the existing dashboard.
- Reuses the **settled-auth pattern** from `CreatorDashboard` — never query inside
  `onAuthStateChange` (that race is what caused the old "not a creator" fl… see the
  auth-callback-race note).
- Existing dashboard is untouched; it just starts finding the freshly-created row.

### Phase 4 — Dashboard extras  (enhancement, independent)
_Goal: your "See upcoming events" idea + the promotion nudge._
- **"See upcoming events" card** — reuses the AppFlow event details bottom sheet (same as
  `/invite` "Re-check plan details"); each event shows **"you'd earn ₹X per booking"**
  (only where `affiliate_enabled`).
- Optional **"starter kit"** block — their link + 2–3 copy-paste captions.

### Sequencing notes
- 1 → 2 → 3 is the safe order (data, then the guarded gate, then the door). 4 can land any
  time after 3, or even in parallel since it only touches the dashboard.
- Each phase is its own commit(s); each waits for your explicit "push" before it deploys.
- Owner action points: **deploy the Phase 2 edge function**, upload the Vimeo video +
  give me the link/ID for Phase 3, and (optionally) approve final quiz wording.
```
