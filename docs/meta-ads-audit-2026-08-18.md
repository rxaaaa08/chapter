# Meta Ads account audit — 18 Aug 2026

Point-in-time snapshot of the live account, run against the Meta API and our own
database rather than from memory. Every line below is evidence, not recollection.

**Scope:** measurement setup, account structure, audiences, attribution.
**Data window:** 12 Aug 2026 (pixel created) → 18 Aug 2026 17:22 IST.
**Spend to date:** ₹0. No campaign has ever run.

Dispositions used: **PASS** (evidence shows it works) · **OPEN** (evidence shows a
real gap) · **UNKNOWN** (could not be checked from here) · **N/A** (does not apply
to us).

---

## The headline

Measurement is in better shape than it looks, and the account structure is in
worse shape than we thought.

1. Deduplication **works** — proven against our own payment rows, below.
2. Match quality is stuck at 6.2/10 because the fix is **written but never
   deployed and never pushed**.
3. There are **three ad accounts**, and the one we should not use is the one with
   no payment method and no business attached.
4. Our **local dev server has been sending events into the production dataset.**

---

## Part 1 — Measurement

### M03 Deduplication — **PASS**

This is the control everything else depends on, so it gets the full working.

Window: 15 Aug 21:30 IST (first server event) → 18 Aug 03:30 IST (last).

| Source | Purchase events |
|---|---|
| Our database (`payu_payments`, status = success) | **17 payments** |
| Meta — browser pixel | 17 events |
| Meta — server (CAPI) | 19 events |
| Meta — "Total events" as displayed in Events Manager | **36** |

Read that table carefully, because it is the whole argument:

- **36 is not 17.** Events Manager shows *Total events*, which is counted **before**
  deduplication. It is the sum of both sources. It will always roughly double the
  real number once CAPI is on. It is not a bug and it is not a discrepancy.
- **The server sent 19 events for 17 payments.** Two payments were reported twice.
  This is expected: `payu-callback` and `payu-webhook` both call
  `sendPurchaseToMeta`, and PayU is known to deliver the same result twice
  (proven separately on 17–18 Aug). Because both paths use the PayU `txnid` as the
  `event_id`, Meta collapses them. **The duplicate is absorbed, not counted.**
- Deduplicated, Meta's Purchase count resolves to our 17.

**What this means:** the deduplication design is doing exactly its job, including
absorbing a PayU-side duplicate we cannot fix. Nothing to change.

### M04 Event Match Quality — **OPEN**

Current score: **6.2 / 10** on Purchase.

| Identifier | Coverage |
|---|---|
| Email | 100% |
| Phone | 100% |
| IP address | 100% |
| User agent | 100% |
| First name, last name, city, external ID, click ID (`fbc`) | **absent** |

The Phase A upgrade that adds all five missing identifiers exists as commit
`9415e8a` ("Tell Meta who bought, not just that someone did"), made 17 Aug 22:15 IST.

Two independent pieces of evidence confirm it is not live:

- `payu-callback` and `payu-webhook` were last deployed **15 Aug 22:13 IST** —
  before the commit was written. The running code is commit `4b98772`.
- The commit is **not pushed** to `main` either.

So the score is not stuck for a mysterious reason. The fix is sitting on this
machine. **This is the single highest-value open item.**

### M01 Pixel · M10 Freshness · M07 Events — **PASS**

- Dataset `28370453785913523` ("chaptera.in website"), active, created 12 Aug.
- Last browser event 18 Aug 17:20 IST; last server event 18 Aug 03:30 IST.
- Upload frequency: real-time.
- First-party cookie: **enabled** (helps the `_fbp` cookie survive).
- Data use: advertising and analytics.

Seven events are live and firing: `PageView`, `ViewContent`, `AddToCart`,
`ReachedPricing` (custom), `InitiateCheckout`, `Lead`, `Purchase`.

One anomaly: **`SubscribedButtonClick`** is registered on the dataset but has
**zero volume** across the whole window. We never implemented it — it is almost
certainly Meta's automatic event detection. Harmless today, but it is an event we
do not control and should never be optimised for.

### Events from `localhost` — **OPEN (new finding)**

Fourteen events reached the production dataset from host `localhost`, on 12, 15
and 17 Aug — our own `npm run dev` sessions.

The volume is trivial. The principle is not: **our development machine is writing
into the dataset that will decide where ad money goes**, and into the website-
visitor audience. It should be gated to the production hostname.

### M05 Domain verification — **UNKNOWN**

Cannot be checked through the API from here. Flagged on day one and never
completed. Needs a look at Business Settings → Brand safety → Domains.

### M08 CAPI Gateway — **N/A**

`gateway_status: NOT_ONBOARDED`. We send to the Conversions API directly, which
is the simpler and correct choice at our size. Nothing to do.

---

## Part 2 — Account structure

### M11 Account fragmentation — **OPEN**

There are **three** ad accounts on this login:

| Account | ID | Business | Payment method | Usable |
|---|---|---|---|---|
| chapter அ advertisement | `1580469137074269` | Chapter அ | Yes | **Yes — use this one** |
| Join Chapter (Read-Only) | `2198866167606294` | Chapter அ | Yes | Read-only to tooling |
| Chapter A. | `919806607052555` | **none** | **No** | No — stray |

The pixel is owned by business `1507936207635471` (Chapter அ). "Chapter A." sits
**outside** that business and has no payment method attached. A campaign built
there would be building on sand.

**Decision needed:** all spend and all data should live in
`chapter அ advertisement` (`1580469137074269`), and only there.

Account minimum daily budget, from the account itself: **₹95.76 per ad set per
day.** This is a real, account-specific floor — not an estimate.

### M13–M18, M33–M37 Campaign controls — **N/A**

**There are no campaigns in either queryable account.** The Founders Meet draft
does not exist as an API object; unpublished drafts in Ads Manager often do not.
Nothing is running, nothing is paused, ₹0 has been spent.

Every campaign-structure control — learning phase, budget distribution, bid
strategy, placements, attribution setting, frequency — is therefore unassessable
today. They become live questions the moment something publishes, not before.

### M19–M24 Audiences — **OPEN**

One audience exists, in `1580469137074269`:

- **"Website visitors - 180d"**, created 15 Aug, delivery status active.
- **Reported size: 20 people.**

Meta needs roughly 1,000 people before it will deliver to a custom audience. At 20,
this audience **cannot be used** — not for retargeting, not as a lookalike seed.
It will fill slowly on its own; at current traffic that is a matter of weeks, not
days, and only counts visitors whose browser wasn't blocking the pixel.

No **Purchasers** audience exists — that is the one lost when Escape closed the
dialog. It costs nothing to rebuild and Meta retains 730 days of history, so
nothing was actually lost except the click.

### M39 UTM and first-party attribution — **PASS**

Our own attribution column is live and populating. Of 38 bookings since 12 Aug:

| | Count |
|---|---|
| Carry attribution data | 22 / 38 |
| Carry `utm_source` | 21 |
| Carry `fbclid` (Meta click ID) | 8 |
| Carry a referrer | 8 |
| Carry a creator code | 5 |

The 16 rows with no attribution are direct or returning visitors — that is the
design working, not a failure.

Worth noting: **8 bookings already carry an `fbclid` with zero ad spend.** Those
are organic Instagram clicks. It means the click-ID plumbing will work on day one
when ads do run — and it is exactly the field Phase A would start sending to Meta.

---

## Open items, in the order they matter

| # | Item | Why it's first |
|---|---|---|
| 1 | **Push and deploy Phase A** (`9415e8a`) | Written, tested, inert. Directly raises 6.2/10. |
| 2 | **Decide the one ad account** — `1580469137074269` | Everything else builds on top of this choice. |
| 3 | **Stop `localhost` events reaching the dataset** | Dev traffic in the file that decides ad spend. |
| 4 | **Verify domain verification** | Unknown, affects iPhone conversion reporting. |
| 5 | Rebuild the Purchasers audience | Free, 2 minutes, useful later — not urgent. |
| 6 | Leave "Website visitors - 180d" alone | Unusable at 20 people. Let it fill. |

Items 1–3 are things we control completely. None of them require spending anything.

---

# Addendum — 20 Aug 2026: the drift, measured and explained

The original audit compared setup. This measures **output**: our numbers against
Meta's, over one matched window.

**Window:** 16 Aug 00:00 → 19 Aug 00:00 UTC. Both sides queried for the identical
range — the Meta API echoed back `2026-08-15T17:00 PDT → 2026-08-18T17:00 PDT`,
which is the same three days. The comparability gate is satisfied.

## The comparison

| Funnel step | Our database | Meta | Meta captures |
|---|---|---|---|
| PageView | 351 | **1,001** | **285%** ⚠️ |
| ViewContent | 156 | 126 | 81% |
| AddToCart *(calendar opened)* | 125 | 111 | 89% |
| ReachedPricing | 88 | 75 | 85% |
| InitiateCheckout | 39 | 33 | 85% |
| Lead | 17 | 16 | 94% |
| Purchase | 13 | 13 browser + 14 server | **13 deduplicated** ✓ |

Everything below PageView captures **81–94%**, and runs the expected direction:
Meta sees slightly fewer because roughly one visitor in six blocks the tracker.

**The old "46% of purchases" figure is retired.** It was measured on unmatched
windows before the Conversions API existed. This is the first properly matched
comparison, and Purchase now reconciles exactly.

## Purchase: why Meta returns two numbers

Queried per source, the split is unambiguous:

- **Browser pixel: 13** — exactly one per payment
- **Server (CAPI): 14**
- **Our database: 13 actual payments**
- **Deduplicated: 13** ✓

The server's extra event is one payment reported twice — PayU delivers some
results twice and both `payu-callback` and `payu-webhook` report it. Both carry
the same `txnid`, so Meta collapses them.

The API returns one row per source **without labelling which is which**, which is
the only reason it looked like a contradiction.

## PageView: solved — Meta's SPA behaviour, amplified by our own design

Meta's documentation, verbatim:

> "By default Facebook Pixel activates the HTML 5 History State API listener.
> This means that each time a new state appears in the history, such as
> `history.pushState`, Facebook Pixel fires a `PageView` event."

Most sites push history a few times per visit. **We push on every sheet and every
step** — 62 `pushState`/`replaceState` sites across `App.tsx` and `AppFlow.tsx` —
because the Instagram back button only works when each layer owns a distinct URL.

So Meta was not counting visits. It was counting **navigation events**:

| | |
|---|---|
| Our `page_view` / sessions | 351 / **311 sessions** |
| Meta PageView | **1,001** = 3.2 per session |
| Our **total** logged interactions | **1,102** = 3.5 per session |
| 1,102 × the ~90% capture seen elsewhere | **≈ 1,000** ✓ |

Meta's PageView tracked our *total event count*, not our visit count.

**Our code was not at fault.** `trackEvent` fires exactly one pixel event per
mapped type; there is no stray PageView.

### Fixed

`fbq.disablePushState = true`, set on the stub before `init` in `src/metaPixel.ts`.

Deliberately **not** the broader `fbq('set','autoConfig',false)`: auto-config also
drives automatic advanced matching, which helps the match-quality score Phase A
exists to raise. Turning it off would fight our own work.

Verified in a real browser against the dev server, with `fbevents.js` genuinely
loaded (not the tracker-blocking preview pane):

| Check | Result |
|---|---|
| `fbevents.js` really loaded | yes |
| `disablePushState` flag reached the loaded script | `true` |
| Requests to `facebook.com/tr` **before** 3 `pushState` calls | **1** |
| Requests **after** 3 `pushState` calls | **1** — zero new |
| URL changed on each push | yes — navigation unaffected |
| Events sent for the whole page load | exactly one `PageView` |

Reporting only. Our `pushState` calls, popstate handling and the layer stack are
untouched: Meta stops emitting an event, the browser still gets its history entry.

### What it does and doesn't affect

- Does **not** affect Purchase, InitiateCheckout, or any optimisation you'd run
- Does **not** break the website-visitors audience — that is people-based
- **Does** make PageView a real visit count again, and any cost-per-landing-page-view
  metric trustworthy

`SubscribedButtonClick` is almost certainly auto-config's button detection, and is
left alone for the same reason.

## Revised open list

| # | Item | Status |
|---|---|---|
| 1 | **Deploy Phase A + B** | ❌ built, pushed, **not deployed** — EMQ still 6.2 |
| 2 | Domain verification | ✅ **done 20 Aug 2026** (DNS TXT, Hostinger) |
| 3 | PageView inflation | ✅ **fixed**, pending deploy of the frontend |
| 4 | Purchase accuracy | ✅ reconciles exactly |
| 5 | `localhost` leak | ✅ fixed and confirmed stopped |

---

# Addendum 2 — 21 Aug 2026: full-system audit

A deeper pass over every part of the setup: the Meta account, the dataset, the
code paths, and the payment data. Five defects found, four fixed.

**Event Match Quality is now 8.4/10**, up from 6.2 at the first audit. The new
identifiers sit at 42.9% coverage and are still climbing as pre-upgrade events
age out of the trailing window.

## The expensive one: a split booking counted as two sales

`payu-callback` and `payu-webhook` reported a Purchase on **every** successful
payment, with no `payment_type` gate. A split event takes an advance now and the
balance later, so one customer produced two conversions.

Over 60 days:

| Payment type | Count |
|---|---|
| `full` | 48 |
| `advance` | 41 |
| **`balance`** | **24** |

89 real bookings → **113 Purchase events**. A **27% inflated conversion count**,
which makes cost per purchase read roughly **21% cheaper than it is**.

That is the most expensive error in the whole setup, because it points the wrong
way: it makes ads look better than they are, and optimising against it means
overspending on sales that were already counted.

**Fixed.** The ad earns the booking at the first payment; the balance is
collection from a customer already won, and no longer reports a Purchase. Gated
inside `metaCapi` so the two paths cannot drift.

**Trade-off taken deliberately:** Meta now sees the advance (₹102) rather than the
full ticket (₹299) for split events, so revenue is understated there. That is the
safe direction — the alternative books money before it is collected, and with
balance-at-venue collection a no-show would make it a lie.

⚠️ **Historical baseline is affected.** Purchase counts in Meta before 21 Aug 2026
include those duplicate balance events. Do not compare pre- and post-fix Purchase
counts without accounting for it.

## `ct` was never set on the receipt

The advanced-matching call on the receipt passed `payment.selected_city`, and that
field does not exist — `get-user-context` returns the payment row, which has no
city. So `ct` was silently undefined on that path. **Fixed** by attaching the
matched application's city, which was already loaded.

## Identity was lost on every reload

`setPixelUserData` runs at the booking forms and the receipt, and fbq holds that
identity — but only for that page load. `page_view` reaches **24 in a single
session**, so reloads are common, and everything a known visitor did afterwards
reached Meta anonymous. **Fixed**: re-identified on mount from the booking phone
in sessionStorage, before the first pixel event.

## What was checked and found healthy

| Check | Result |
|---|---|
| Lead firing twice (two source events) | only **1 session in 83** — not a real source of drift |
| Per-session event repeats | 1.0–1.3× — genuine user behaviour, not instrumentation |
| Payment amounts | 59/59 valid, ₹1.02–₹1,126.62, none zero or null |
| PayU payment timestamps | 131/132 present |
| Email coverage | 100% |
| Phone format | 106/106 produce a valid 10-digit number |
| Orphan payment with no application row | 1 — our own deleted test booking |
| Custom audience rule | correct: `ALL_VISITORS`, right pixel, 180d, status Normal |
| Invite-flow instrumentation | discovery events fire in `AppFlow` for **both** flows |

## Open, and deliberately not changed

**No Instagram account linked to the ad account** (`ig_accounts: []`). Still the
blocker from 12 Aug — it needs an SMS code to a number the owner may not control.
Blocks IG-engagement audiences.

**The Page is not associated with the ad account** (`pages: []`), though
"Join Chapter அ" *does* exist under the business. Expected while no ads have run;
not a blocker.

**Zero custom conversions.** `ReachedPricing` is a custom event with no custom
conversion defined, so it may not be selectable as an optimisation target. Low
priority — the SOP targets InitiateCheckout, a standard event.

**Website-visitors audience is still 20 people**, with `time_updated` equal to
`time_created`. The rule is correct and healthy, so this is Meta not having
recomputed it rather than a fault. Unusable below ~1,000 either way.

**`/invite` bill-open fires no `InitiateCheckout`.** Deliberately left alone:
those visitors arrive from WhatsApp invites, not ads, and feeding non-ad
conversions into the optimisation signal would teach Meta about people who never
click ads.

**Last name is still 37%** — most people type one word into the name field.
Only a form change would move it, which is a conversion decision, not a tracking
one. Gender and state were considered and declined by the owner.

## Disclosure

Four test events — `AdvancedMatchingProbe`, `AdvancedMatchingProbe2`,
`AdvMatchProbe3`, `AdvMatchProbe4` — are registered in the production dataset.
**I fired those** while verifying advanced matching. One occurrence each, against
2,040 PageViews, and they will age out of the reporting window. Nothing to act on,
but they are mine, not Meta's and not yours.

---

# Addendum 3 — 21 Aug 2026: deduplication, audited against the spec

Checked our setup line by line against Meta's published deduplication rules.

## The rules, from Meta's documentation

> "We determine if events are identical based on their **ID** and **name**."

> "If we find the same server key combination (`event_id` and `event_name`) **and**
> browser key combination (`eventID` and `event`) sent to the same Pixel ID
> **within 48 hours**, we discard the subsequent events."

So four things must line up: identical `event_id`, identical `event_name`, the
same pixel, and arrival **within 48 hours**. `action_source` is not part of the
match. Both values must be strings, and the match is case-sensitive.

## Our setup against each rule

| Requirement | Ours |
|---|---|
| `eventID` (browser) = `event_id` (server) | ✅ both the PayU `txnid`, same string |
| Same `event_name`, same case | ✅ `'Purchase'` on both sides |
| String, not a number | ✅ PayU txnids are alphanumeric |
| Same pixel | ✅ one dataset, `28370453785913523` |
| Within 48 hours | ⚠️ **was not guaranteed — now enforced** |

## Two holes found

**The balance fix was only half done.** Gating the server stopped it reporting the
second half of a split booking, but the receipt screen kept firing a browser
Purchase for exactly those payments. The double count had not gone away — it had
moved from one source to the other. The browser now applies the same rule.

**Stale receipts fell outside the 48-hour window.** The server fires seconds after
payment. A receipt opened days later — the WhatsApp link, on a device that never
fired it — arrives outside the window and is counted as a **second purchase**, and
dated days after the real sale, misattributing it to the wrong reporting window.
Now suppressed past 24h, deliberately half the limit so a slow clock or a late
webhook cannot push a legitimate view over the edge.

Both guards **fail open**: an unparseable timestamp or a missing `payment_type`
still reports the sale. The failure mode is counting once too often, never
silently losing a conversion.

The 5-second fire-without-a-receipt fallback was removed at the same time. Its
reasoning — a conversion missing its amount beats no conversion — predated the
server reporting anything, and no longer holds.

## Measured pairing, 16–20 Aug

| Source | Purchase events |
|---|---|
| Browser | **12** |
| Server | **13** |

Every browser event has a server twin **in the same hour bucket**. The extra
server event is PayU delivering one result twice, absorbed by the shared `txnid`.

A practitioner benchmark circulating online puts a "healthy" Purchase
deduplication rate at 40–70%. **Treat that as directional only** — it describes
setups where the browser misses a large share of events. Ours pairs almost
one-to-one because both sources deliberately report every sale, and the receipt
screen is a page load nearly every payer reaches. Higher is not a fault.

## Considered and dismissed

**Meta's fallback match on `fbp`/`external_id` + `event_name`.** Now that browser
events carry `external_id` via advanced matching, two Purchases from the same
person could in principle collide. They cannot in practice: every event carries a
distinct `event_id` (a distinct PayU txnid), and ID-and-name matching takes
precedence. Two bookings by one customer stay two events.

**Adding `event_id` to non-Purchase events.** Meta's best-practice card suggests
it, but those events have no server counterpart, so there is nothing to
deduplicate against. It would add a field with no effect.

---

# Addendum 4 — 21 Aug 2026: the non-Purchase drift, explained

Purchase reconciles exactly because the server reports it too. Every other event
is browser-only, and Meta sees fewer than we log. This is why.

## Measured, 17–20 Aug (matched window)

| Event | Meta | Ours | Meta captures |
|---|---|---|---|
| ViewContent | 107 | 128 | **83.6%** |
| AddToCart | 85 | 101 | **84.2%** |
| ReachedPricing | 62 | 71 | **87.3%** |
| InitiateCheckout | 22 | 25 | **88.0%** |
| Lead | 8 | 9 | **88.9%** |

## The shape of the numbers is the finding

Every rate sits between 83.6% and 88.9% — a **five-point spread across five
different events**, fired from different components at different moments in the
flow.

An instrumentation bug does not behave like that. A miswired event, a race, a
missing call site, a listener that sometimes fails — any of those would make one
event stand out. Uniformity across all five means the loss is **per-visitor, not
per-event**: some people's browsers never run our code at all, and those people
lose their whole session's worth of events together.

That is tracker blocking, and no browser-side change can fix it. Code that does
not execute cannot be made to execute better.

## Our loss is unusually LOW, and the device mix says why

Published estimates put browser-pixel loss at **20–40%**, with some sources
claiming 30–60%. *(Vendor and agency sources — directional only, per Rule 1.)*

Ours is **11–16%**. Better than the range, not worse.

The device breakdown over the same window explains it:

| Device | Events | Share |
|---|---|---|
| Android phone | 804 | **63.9%** |
| iPhone | 405 | **32.2%** |
| Desktop | 49 | **3.9%** |

**96.1% of traffic is mobile.** Ad blockers are overwhelmingly a desktop browser-
extension phenomenon, and Instagram's in-app browser — where much of this traffic
lives — cannot run extensions at all. The industry's 20–40% reflects desktop-heavy
audiences. Ours does not.

So the drift is not a defect, and it is not even average. It is the floor for a
mobile-first audience.

## What "fixing" it would actually require

The only way to recover a blocked visitor's events is to send those events from
the server, as we already do for Purchase. That has one natural hook —
`create-payu-order`, the moment a bill is generated — and it is a poor fit:

- It sits **lower** in the funnel than the events that drift. It cannot recover a
  blocked ViewContent or AddToCart, because those people never reach a bill.
- Making it report `InitiateCheckout` would change what that event means, from
  "pressed Book Now" to "reached the payment page", and **break its baseline** —
  counts would drop because fewer people reach a bill than press the button.
- Recovering `Lead` server-side would need new infrastructure: the application
  insert happens client-side, so it would take a database trigger and a new
  endpoint.

**Recommendation: do not chase it.** The SOP already says to expect 81–94% on
browser-only events and not to treat it as a fault. This research confirms that
rule with our own numbers and explains the mechanism, so it can stop being an
open question.

If a campaign ever optimises on `InitiateCheckout` and its volume proves too thin,
the server-side option is written down above — with the baseline break it costs.

---

# Addendum 5 — 21 Aug 2026: checked against three more official docs

Read *Using the API*, *Verifying Your Setup*, and *Handling Duplicate Pixel and
Conversions API Events*. Two things I had told the owner were wrong, and one real
hardening came out of it.

## CORRECTION: test events are not harmless

I said a `test_event_code` routes purchases away from live totals. Meta:

> "Events sent with `test_event_code` are **not dropped**. They flow into Events
> Manager and are used for **targeting and ads measurement** purposes."

The advice — confirm `META_CAPI_TEST_CODE` is unset — was right. The reason given
for it was wrong, and the risk is higher than described: a test code left set
does not quarantine anything, it pollutes live measurement.

## CORRECTION: Meta does not merge the two sources

I said Meta "combines the data from both sources" when deduplicating, sourced from
a practitioner blog. Meta:

> "If server and browser events do not differ meaningfully in their content, we
> generally **prefer the event that is received first**."

So the event that arrives **first** is the one kept. That makes arrival order
matter, and ours is favourable by accident of architecture: `payu-callback` runs
server-side *during* the PayU redirect, before the browser reaches the receipt, so
the **server event — the one carrying eleven identifiers — arrives first.**

If that ever inverts (a slower callback, a faster receipt), the kept event becomes
the poorer one. Worth remembering before changing anything about the redirect.

## The pending two-purchase test is lower-risk than feared

Meta's limits on the `fbp`/`external_id` fallback:

> "Generally, it only works for deduplicating events sent **first from the browser
> and then through the server**."

> "Does **not** deduplicate events when only using one event source ... If you send
> us two consecutive server events with the same information, we do not discard
> either."

Our order is server-first, which is the direction that method does *not* cover,
and two server events for one person are explicitly never collapsed. The test is
still worth doing — the cross-source case (purchase A's browser event, purchase
B's server event) is not addressed by either quote — but the likely answer is now
"nothing collapses".

## HARDENING: event_time outside Meta's window cost the whole event

> "`event_time` can be up to **7 days** before you send an event ... If any
> `event_time` in `data` is greater than 7 days in the past, we return an error for
> the **entire request** and process no events."

We take `event_time` from PayU's own `addedon`, so a stale or clock-skewed value
would have cost the sale silently rather than degrading it. Now clamped: anything
older than the limit (with an hour of margin) or in the future falls back to now.
Verified — 2 minutes and 6 days pass through unchanged; 8 days and a future time
fall back.

## Confirmed already correct

| Meta's rule | Ours |
|---|---|
| **"aim for an Event Match Quality score of 6.0 or higher"** | **8.0–8.4** — Meta's own benchmark, comfortably cleared |
| Send within an hour of the event | seconds, via the callback |
| Max 1,000 events per request | we send 1 |
| Data Processing Options / LDU | US-only; correctly omitted, which Meta lists as the way to disable it |
| `action_source` accurate | `website`, and it is |

**Noted, not changed:** we call API `v21.0`; Meta's current examples use `v25.0`.
Every version is supported at least two years, so v21 is fine — but it is worth
moving before it ages out, and that is a deploy, not an emergency.
