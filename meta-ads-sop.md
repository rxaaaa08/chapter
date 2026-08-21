# Meta Ads — our standing operating procedure

**Rewritten 18 Aug 2026**, after auditing the live account
(`meta-ads-audit-2026-08-18.md`) and adopting the discipline in the Claude Ads
skills. Read the audit for *what is true today*; read this for *how we decide*.

**Spend to date: ₹0.** Nothing has ever run. Everything below is preparation.

---

## Part 0 — The four rules that govern everything else

These come before any tactic, and they override anything further down this file.

### Rule 1 — No borrowed thresholds

We do not run our account against numbers from someone else's account. Industry
medians, agency rules of thumb ("70/20/10", "always bid X"), and blog-post
benchmarks are **questions to ask, never pass/fail tests**.

*This is a correction to the previous version of this SOP*, which told us a
CTR above 1% was "healthy", a click under ₹15 was "good", and ₹500–1,000/day was
the "minimum". Those came from Indian agency blog posts. They may be roughly
right. They were not evidence about **us**, and they were presented as if they
were.

Every threshold in this file now either comes from our own data, from the
account itself, or is explicitly labelled **directional only**.

### Rule 2 — The comparability gate

**Before comparing any two numbers, confirm they are the same kind of number.**
Both must share:

- the same conversion event
- the same time window **and time zone**
- the same counting method (events vs people vs rows)
- the same deduplication identity
- the same currency

If any one of those differs, **do not compare them, and do not add them.** Say
which piece is missing instead.

We have broken this rule twice in two days — once comparing Events Manager's raw
total to the admin panel, once comparing a 20 Jul–16 Aug Meta window to a
since-15-Aug database window. Both produced confident nonsense.

### Rule 3 — "Unknown" is a real answer

If the evidence isn't there, the answer is **unknown** — not a guess dressed up
as a finding. An honest "we can't tell from this" is worth more than a plausible
number, because a plausible number gets acted on.

### Rule 4 — Measurement quality is not performance

Event Match Quality, deduplication, and freshness are **diagnostics**. They tell
us whether we can *see*. They say nothing about whether the ads *worked*. Never
report a match-quality improvement as a business result.

---

## Part 1 — Why Meta's numbers won't match our admin panel

**They are counting different things, and both are correct.**

Events Manager shows **Total events**, counted **before deduplication**. Our
browser pixel and our server both report every sale, so once the Conversions API
is on, the raw total roughly **doubles**. This is by design.

We proved it on our own data over 15–18 Aug:

| Source | Purchase count |
|---|---|
| Our database — actual successful payments | **17** |
| Meta, browser pixel | 17 |
| Meta, server (CAPI) | 19 |
| Meta, "Total events" as displayed | **36** |
| Meta, **after deduplication** | **17** ✓ |

The server's extra 2 are the same payment sent twice — PayU delivers some results
twice, and both our callback and our webhook report it. Because every report
carries the PayU `txnid` as its `event_id`, **Meta collapses them.** The
duplicate is absorbed.

### The whole funnel, measured on a matched window

16–19 Aug 2026, our database against Meta, same three days both sides:

| Funnel step | Ours | Meta | Meta captures |
|---|---|---|---|
| PageView | 351 | 1,001 | **285%** — see below |
| ViewContent | 156 | 126 | 81% |
| AddToCart | 125 | 111 | 89% |
| ReachedPricing | 88 | 75 | 85% |
| InitiateCheckout | 39 | 33 | 85% |
| Lead | 17 | 16 | 94% |
| Purchase | 13 | 13 browser + 14 server | **13 deduplicated** ✓ |

**Expect 83–89% capture on browser-only events.** Measured 17–20 Aug across five
events — 83.6, 84.2, 87.3, 88.0, 88.9. A five-point spread across five different
events is what per-visitor blocking looks like; a bug in any one event would make
it stand out.

Published estimates put typical browser loss at 20–40% *(vendor sources —
directional only)*. **Ours is 11–16%**, because 96% of our traffic is mobile and
ad blockers are overwhelmingly desktop extensions, which Instagram's in-app
browser cannot run at all. This is the floor for a mobile-first audience, not a
fault to chase. Only server-side events could recover it, and our only hook sits
below the events that drift — see the audit for what that would cost.

**Purchase is the exception, and should stay exact** — because the server reports
it too. If deduplicated Purchase ever stops matching our payment count, something
is genuinely broken.

### PageView was inflated 3× — fixed 20 Aug 2026

Meta's pixel fires a PageView on every `history.pushState` by default. Our app
pushes on every sheet and step (the Instagram back button needs distinct URLs per
layer), so Meta was counting *interactions*, not visits — its 1,001 tracked our
total event count of 1,102, not our 351 visits.

Fixed with `fbq.disablePushState = true` in `src/metaPixel.ts`. Verified: three
`pushState` calls now produce zero extra requests to Meta, and navigation is
unaffected.

**Do not "fix" this with `fbq('set','autoConfig',false)`** — that also disables
automatic advanced matching, which raises the match-quality score we want.

### One booking is one Purchase — even when they pay twice

Split events take an advance now and the balance later. Only the **first** payment
reports a Purchase; the balance does not.

This matters more than it sounds. Until 21 Aug 2026 both halves reported, so 89
real bookings became 113 events — a **27% inflated conversion count**, making cost
per purchase read about **21% cheaper than reality**. That error points the
dangerous way: it flatters the ads and pushes you to spend more.

**Consequence to remember when reading revenue:** for split events Meta sees the
advance (₹102), not the full ticket (₹299). Revenue is deliberately understated
rather than booked before it is collected — a no-show would otherwise turn it into
a lie. So **judge ads on cost per booking, not on ROAS**, until every event is
single-payment.

⚠️ **Purchase counts before 21 Aug 2026 are inflated.** Never compare across that
date without accounting for it — that is Rule 2 applied to our own history.

### Deduplication has a 48-hour clock

Meta collapses a browser and a server event only when both carry the same
`event_id` and `event_name` **and arrive within 48 hours**. Ours are the PayU
`txnid` and `'Purchase'`.

That window is why the receipt screen no longer reports a sale older than 24
hours: a WhatsApp receipt link opened days later would otherwise count as a
second purchase, dated to the wrong week. If you ever change how the receipt is
reached, re-check this.

### Which number to use for what

| Question | Use | Never use |
|---|---|---|
| How many tickets did we sell? | **Our database** | Anything from Meta |
| Which ad produced a sale? | Meta's attributed conversions | Our database alone |
| Is tracking healthy? | Deduplicated Purchase vs our payment count | Total events |
| What did a ticket cost? | Ad spend ÷ **our** attributed bookings | Meta's cost-per-result alone |

Our database is authoritative on **volume**. Meta is the only source for
**attribution**. Neither is authoritative for both, and the deduplicated Purchase
count should track our payment count closely — that is the health check.

---

## Part 2 — Event Match Quality

EMQ (0–10) measures how well Meta can tie a conversion to a **person**, and
therefore to an ad. A sale Meta cannot attribute is a sale that teaches the
algorithm nothing.

**We are at 6.2 / 10.** We currently send email, phone, IP and user agent — all
at 100% coverage.

The Phase A upgrade adds first name, last name, city, a stable external ID, and
the Meta click ID (`fbc`). It is written and committed (`9415e8a`) and is
**neither pushed nor deployed**. That is the entire reason the score hasn't moved.

**Phase B (`fbp`) is now written too — 2026-08-18, uncommitted.** The checkout
page reads Meta's `_fbp` cookie and passes it to `create-payu-order`, which
stores it on `payu_payments.fbp`; `payu-callback` and `payu-webhook` replay it
when they report the Purchase. The round trip is necessary because `_fbp` exists
only in the customer's browser, while the *server* is the path that reports the
sales the browser never can (tab closed on PayU, UPI handoff into another
browser) — those events were reaching Meta with no `fbp` at all.

**Its ceiling is real.** `_fbp` is written by `fbevents.js`, so an ad-blocked
visitor has none — the same ~50% the browser pixel already misses. This raises
match quality on the half we can see and recovers nothing from the half we
can't. We deliberately never synthesise a value: an invented `fbp` matches
nobody and drags the score down rather than up.

It lives on `payu_payments`, not `applications.attribution`, on purpose — that
JSONB column carries traffic-*source* meaning (null there = direct/organic), and
`_fbp` is present for nearly every unblocked visitor, so writing it there would
make every organic booking look attributed.

⚠️ **Hashing rules matter.** Meta requires each value normalised *then* SHA-256
hashed: lowercase and trim, strip punctuation and accents from names, phone in
full international form (`91XXXXXXXXXX`). Getting normalisation wrong does not
error — it silently matches nobody, which looks exactly like working.

⚠️ **`fbc` is not the raw `fbclid`.** It must be formatted
`fb.1.<timestamp_ms>.<fbclid>`. Sending the bare click ID is accepted by Meta and
matches nothing. `fbc` and `fbp` are the only fields sent **raw, never hashed**.

**Target:** deploy Phase A, then re-read the score. Do not set a target number in
advance — read what it becomes and decide from there.

---

## Part 3 — Our economics, which set the real limits

This replaces the borrowed budget guidance in the previous version.

### What the account actually enforces

**₹95.76 per ad set per day.** That is this ad account's own minimum daily budget,
read from the account — not an estimate. It is the only hard budget floor we know
to be true.

### What Meta publishes

Meta's own guidance is that an ad set needs roughly **50 conversions per week** to
exit the learning phase. That is platform-published, so it is credible about
Meta's system — but it is a statement about their algorithm, not a promise about
our results.

### What our own numbers say

Founders Meet: **₹299 ticket, roughly ₹100 profit.**

That gives one number that is genuinely ours and genuinely binding:

> **₹100 is the absolute ceiling on what a ticket can cost to acquire before the
> ticket loses money.**

Everything else follows from it:

| If a ticket costs us… | Then… |
|---|---|
| under ₹100 | profitable on first purchase |
| ₹100–300 | loses money now; only justified if attendees buy again — **which we cannot currently measure** |
| over ₹300 | not defensible on any assumption we can support today |

**We do not know our repeat-purchase rate.** Until we do, every argument that
begins "but lifetime value…" is an assumption, not a case. Building that
measurement is on the roadmap below.

### The honest position

At a ₹100/day budget we **can** buy: our true CPM in Chennai, our true
click-through rate on a specific creative, and operational familiarity.

We **cannot** buy: a stable optimisation algorithm, a trustworthy cost-per-ticket,
or a creative A/B result.

Both lists are legitimate. **The failure mode is buying the second list and
reading it as the first** — running a small budget, getting a noisy result, and
concluding "ads don't work for us."

If we spend, we should spend to **learn our own numbers**, and say so out loud
before starting.

---

## Part 4 — Pre-flight, from the audit

Statuses are from the 18 Aug audit. Re-verify before any spend.

| # | Check | Status |
|---|---|---|
| 1 | Pixel fires on chaptera.in | ✅ live, real-time |
| 2 | CAPI live and sending | ✅ since 15 Aug |
| 3 | Deduplication working | ✅ proven twice — 17 = 17, then 13 = 13 |
| 4 | Match quality upgrade deployed | ✅ live — **EMQ 8.4/10**, was 6.2 |
| 5 | **Spend from one account only** (`1580469137074269`) | ⚠️ three accounts exist |
| 6 | **Dev machine not writing to the dataset** | ❌ 14 events from `localhost` |
| 7 | Domain verified | ✅ **done 20 Aug 2026** — DNS TXT on Hostinger |
| 8 | Landing URL carries UTMs | ✅ capture live, 21/38 bookings tagged |
| 9 | Creative is legally runnable | ⚠️ Instagram licensed music **cannot** run as an ad — re-cut with Meta Sound Collection or voiceover |
| 10 | Campaign spending limit set | ❌ no campaign exists yet |
| 11 | The event actually has seats | manual check |
| 12 | **Two-purchase dedup test done** | ❌ **pending — do this before spending.** Two ₹1 bookings from one phone, minutes apart; confirm BOTH land as separate Purchases. Three real same-person-within-48h cases exist, one of them a ₹2,662 second sale |

Items 4, 6 and 7 are ours to fix and cost nothing.

---

## Correction — event priority no longer exists (20 Aug 2026)

An earlier version of this file, and my advice at the time, said domain
verification unlocks **Aggregated Event Measurement** and that Purchase should be
put at the top of an eight-event priority list.

**That step is gone.** Meta removed the AEM tab and the eight-event ranking for
**web** events; all eligible web events are now aggregated automatically. There is
nothing to configure and nothing to rank. Confirmed two ways: the UI is absent
from this account, and multiple secondary sources report the removal. Meta's own
help centre still documents the ranking for **app** events, which we do not run.

Domain verification was still worth doing — it establishes which business
portfolio holds authority over chaptera.in — but the specific payoff named above
no longer applies. Do not go looking for that setting.

## Part 5 — Campaign structure

**One campaign. One ad set. Two or three ads.**

Splitting a small budget across several ad sets gives each one too little to
learn from. At our budget this is the most expensive structural mistake available.

| Level | Setting | Value |
|---|---|---|
| Campaign | Objective | Sales |
| Campaign | Budget | Campaign-level, one number |
| Ad set | Conversion event | see Part 6 |
| Ad set | Location | Chennai + 40km |
| Ad set | Age | 24–40 |
| Ad set | Placements | Automatic *(forced — see below)* |
| Ad | Identity | Facebook Page + **@iamkrutesh** |
| Ad | CTA | Book Now |

**Verified constraint:** this account only offers *Advantage+ Sales* campaigns,
which **force automatic placements**. Instagram-only is not available on a Sales
objective — confirmed by building a campaign from scratch and deleting it. A
Traffic objective would allow manual placements, at the cost of optimising for
clicks rather than buyers. That trade is usually not worth it.

**Audiences:** our only custom audience holds **20 people** and cannot be
delivered to (Meta needs roughly 1,000). Do not build the campaign around it.
Retargeting is not available to us yet, and by the founder's own reasoning —
someone who saw the price and left has answered the question — it is not a
priority when it does become available.

---

## Part 6 — Which event to optimise for

The most consequential single setting. It depends on **our** volume, not on a
benchmark.

Our Founders funnel runs roughly: **68 event views → 50 calendar opens → 42 see
the price → 21 press a CTA → 8 buy.**

Mid-funnel events carry **3–6× the volume** of purchases. That ratio — measured
on our own funnel — is why a mid-funnel target is right at a small budget:
Purchase is too rare a signal for Meta to learn from.

| Our weekly purchases | Optimise for |
|---|---|
| 50+ | Purchase |
| 10–50 | InitiateCheckout |
| under 10 | AddToCart, or don't run yet |

### Owner's decision, 21 Aug 2026: always Purchase — do not re-propose

**Optimise for Purchase regardless of how sparse it is.** This overrides the table
above, which was borrowed reasoning and is wrong for us at this budget.

That table assumes the goal is exiting the learning phase. On a ₹400 test we never
will, whatever event we pick — so a proxy event buys nothing and costs something
real: Meta would go hunting people who press "Book Now" and never pay, when the
entire purpose of the test is learning what a **ticket** costs.

Expect "Learning Limited" permanently and possible under-delivery. Both are the
price of pointing the algorithm at the thing we actually want, and both were
accepted knowingly.

**Never optimise for `SubscribedButtonClick`** — it appears in our dataset with
zero volume and we did not implement it. It is Meta's automatic detection, and we
do not control it.

---

## Part 7 — Reading results

**Do not touch the campaign for 72 hours.** Every edit restarts learning. Fiddling
on day one is the most reliable way to waste the budget.

**Expect "Learning Limited" permanently** at our budgets. It is a description, not
an error.

At day 4, apply Rule 2 before reading anything, then look at:

| Metric | How to judge it |
|---|---|
| Link CTR | Against **our own** organic reel performance, not an industry median |
| Cost per click | Record it. This is a number we are **buying**, not passing or failing |
| CPM in Chennai | Same — we are buying this fact |
| Cost per booking | From **our database**, against the ₹100 ceiling |

The first two are unknown to us today. The correct posture on day 4 of a first
campaign is **"now we know our CPM"**, not "the campaign passed."

**Read booking counts from our own database.** Ads Manager answers "which ad
caused this"; our `attribution` column answers "how many happened."

### Stopping rules — set these before starting, not after

| Condition | Action |
|---|---|
| Cost per booking under ₹100 | Working. Raise budget **50% at a time** — doubling resets learning |
| ₹100–300 | Hold. Do not scale into an unproven loss |
| Over ₹300 by day 6 | **Stop.** The numbers have been bought; that was the goal |
| Spend hits the campaign limit | Stop regardless of results |

Writing these down in advance is the point. A stopping rule invented after seeing
the numbers is not a stopping rule.

---

## Part 8 — Build order

1. **Push and deploy Phase A** — written, inert, raises match quality. Zero risk.
2. **Stop `localhost` events reaching the production dataset.**
3. ~~Check domain verification.~~ **Done 20 Aug 2026.**
4. **Measure repeat purchase** — without it, every lifetime-value argument for
   tolerating a loss-making ticket is unsupported.
5. ~~**`fbp` capture (Phase B)**~~ — written 2026-08-18. The DB column is already
   live on prod; the code is uncommitted. It only takes effect once
   `create-payu-order`, `payu-callback` and `payu-webhook` are **redeployed** —
   the column and the frontend alone do nothing. Ship it with Phase A rather
   than after, since both need the same edge-function deploy.
6. **A lookalike seed** — needs 100+ matched purchasers. We have ~20. Wait.

---

## Appendix — the mistakes that cost the most

1. Comparing two numbers that aren't the same kind of number *(Rule 2)*
2. Treating someone else's benchmark as our pass mark *(Rule 1)*
3. Editing a campaign inside 72 hours and resetting learning
4. Running with no campaign spending limit
5. Reporting a match-quality gain as a business result *(Rule 4)*
6. Judging results on day 2
7. Splitting a small budget across several ad sets
8. Advertising an event that is already nearly sold out
9. Spending before the pixel is verified firing

---

## Sources, with their status

Labelled per Rule 1, so we know what each one is worth.

**Platform-published — credible about Meta's own system:**
- [Differences between event counts in Ads Manager, Ads Reporting and Events Manager](https://www.facebook.com/business/help/337196340694086) — the pre-deduplication explanation
- [Dataset Quality API](https://developers.facebook.com/docs/marketing-api/conversions-api/dataset-quality-api/)
- [About the Conversions API](https://www.facebook.com/business/help/AboutConversionsAPI)

**Independent practitioner — credible, not authoritative:**
- [Meta Conversion Events, Deduplication, and Conflicting Reporting — Jon Loomer](https://www.jonloomer.com/meta-conversion-events-deduplication-and-conflicting-reporting/)

**Vendor/agency — directional only, never a threshold:**
- [How to improve Event Match Quality — Stape](https://stape.io/blog/how-to-improve-event-match-quality-facebook)
- ~~Vizup, Startupbricks budget guides~~ — **removed.** These supplied the
  "₹500–1,000/day minimum" and CTR/CPC thresholds in the previous version. They
  are single-source agency posts with no disclosed methodology, and they were
  being used as pass/fail tests. The account's own ₹95.76/day floor and our own
  ₹100 margin ceiling replace them.

**Our own account and database — authoritative for us:**
- `meta-ads-audit-2026-08-18.md`
