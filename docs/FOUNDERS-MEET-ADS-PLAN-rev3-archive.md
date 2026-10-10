# Founders Meet — Meta ads plan (drafted 2026-09-30, revision 3 same day)

**Status: DRAFT settings, written at the owner's request.** Nothing has been created in Ads Manager. The owner still has to fill in two numbers: seat count and venue area.

**Revision 3 (2026-09-30):** the owner asked for the full settings list, judged against the 70-lesson synthesis (`~/Downloads/meta yt lessons/SYNTHESIS-patterns-across-lessons.md`) and the strategy report (`2026-09-28-meta-strategy.md`). He also asked which of our Meta systems are outdated after Andromeda and should be removed. The changes from revision 2:

- **3 ads, each a different idea, instead of 3–5 ads that include two hook-swaps of the same reel.** Meta treats near-identical ads as roughly one ad (synthesis #2, ≈15 lessons). Hook-swapping belongs *later*, on whichever ad wins (synthesis #4, Cordeddu's ladder).
- **One "last seats" ad added in the final week, inside the same ad set.** This replaces a separate retargeting campaign (synthesis Part 4.6, disagreement G).
- **The end date is when bookings close on the event day**, not the event morning. Event sales bunch at the very end (Willington).
- **Economics:** the ₹100 ceiling is tight, and a larger advance is the biggest lever (synthesis #12). Stated once, below.
- **Measure the sales curve against last time's organic curve** (synthesis Part 4.8).
- **New section: what to remove from the Meta system** (bottom of this file).

Revision 2 had already made these changes:

- campaign-level judgement (§15's 10-ticket rule);
- decisions tied to the existing alarms (§5 Layer 7);
- a reel-eligibility check (§23);
- the paused overnight pre-flight (§23, §30);
- four items outside Ads Manager.

**Settled decisions this plan relies on (handoff sections):**

| Decision | Where |
|---|---|
| Every ad lands on `/lifestyle` | §15 |
| Ad budget per ticket = advance − cost | §21.6 |
| Purchase first | §29.4 |
| Attribution: 7-day click · 1-day engaged-view · 1-day view | §29.5 |
| Instagram only | §30 |
| Meta is told the full ticket at the advance | §21.1 |

## Economics (owner, 2026-09-30)

| | |
|---|---|
| Ticket | ₹450 = ₹250 advance online + ₹200 at the venue |
| Cost per attendee | ₹150 |
| Ad money per booking | ₹250 − ₹150 = **₹100** (break-even) |

- **The owner's rule is right, and it is the rule already in the system (§21.6).** At ≤ ₹100 per booking a no-show cannot lose money, because the advance is kept. Last Founders Meet, **18 of 28** didn't come, at a ₹100 advance (§21.4).
- **The ₹100 is clean:**
  - the customer pays the gateway fee on top;
  - open events pay no marketer or manager commission (§21.8);
  - ad bookings pay no creator commission (§29.1).
- **It is a tight ceiling. Stated once:**
  - Founders Meet's organic history gives ~4 paid tickets per 100 landings (~9.6 per 100 plan views × ~43% of landers opening a plan). Site-wide it is 1.8–2.2 per 100 (§29.4).
  - So ₹100 per booking needs each ad landing to cost about **₹2–4**, and ad visitors are colder than organic ones.
  - No Chennai benchmark exists (strategy report Q8). The first ~₹1,000 of spend answers whether ₹100 is reachable.
- **The biggest lever is the offer, not the settings** (synthesis #12, ≈15 lessons). Two examples, owner's call and not a recommendation to change the price:
  - **₹300 advance + ₹150 at the venue** leaves **₹150** of ad money per booking, 50% more room.
  - A larger advance should also cut no-shows further.

### Price option raised by the owner (2026-09-30): lower the price instead of raising the advance

**The idea.** Charge ₹299 = ₹199 advance + ₹100 at the venue. Ad money per booking falls to ₹199 − ₹150 = **₹49**, and the owner's bet is that a lower price raises conversion by more than it cuts ad money.

**Correction to the premise.** The last Founders Meet was **₹299 = ₹100 advance + ₹199 at the venue**, not ₹199 + ₹100. Evidence: 28 advances at ₹102.42 and 10 venue balances at ₹203.82, both including the 2.42% gateway fee; `city_details` also says 299/100. The ₹199-advance split was the Girls-Only Meet. Under the advance rule (§21.6), last time's split left **−₹50** for ads, which is why it could never have funded them.

**Measured 2026-09-30** (distinct sessions from 2026-08-01, open events; paid = successful advance or full payment, excluding test phones and payments under ₹50):

| Plan (price at the time) | Paid upfront | Saw price → tapped Book | Tapped Book → paid | Opened plan → paid |
|---|---|---|---|---|
| Founders Meet (₹299) | ₹100 | 41% (70/172) | **40%** (28/70) | 8.6% (28/327) |
| Girls-Only Meet (₹299) | ₹199 | 37% (32/87) | 28% (9/32) | 6.2% (9/146) |
| Sunrise at Kovalam (₹299) | ₹299 | 31% (38/123) | 26% (10/38) | 4.9% (10/204) |
| Anna Nagar Meetup (₹359) | ₹359 | 29% (108/372) | 19% (20/108) | 3.0% (20/662) |

- The owner remembered 50–60% at the Book step. The measured figure is **40%**, still the best of any plan.
- Conversion falls steadily as the amount paid **upfront** rises. That fits his idea, but it compares 4 different plans and audiences, with 9–28 sales each. Suggestive, not proof.
- Anna Nagar then ran as form-now-pay-later, so its row is the weakest comparison.

**The break-even rule.** What an ad can afford per visitor = ad money per booking × the share of visitors who pay.

- ₹49 is 49% of ₹100, so the cheaper price wins only if it **more than doubles** conversion compared with ₹450 / ₹250 upfront.
- Nothing here has a ₹250 upfront amount. Interpolating the table, ₹199 upfront converts roughly 1.3–1.6× better than ₹250 would, so the two options come out **about even on what ads can afford**, within noise.

**What does differ:**

| | ₹450 (₹250 + ₹200) | ₹299 (₹199 + ₹100) |
|---|---|---|
| Ad money per booking | ₹100 | ₹49 |
| Profit per attendee who shows, before ads | ₹300 | ₹149 |
| Sales per visitor (organic and paid) | lower | higher, so the event fills faster and Meta gets more Purchase signal to learn from |

**A third shape, not yet measured by anyone:** keep ₹450 total but ask **₹199 upfront + ₹251 at the venue**.

- If the upfront amount is what drives conversion (the table points that way), this gets the same ₹49 ad room and the same conversion as ₹299 / ₹199, while keeping ₹300 profit per attendee.
- The unknown is whether a larger venue balance lowers show-up or puts people off at the price screen, since the total is also shown there.

**Owner's follow-up (2026-09-30): the advance has to be higher anyway, for commitment, and the split must look even.**

- **No-shows spoil the room.** At ₹100, 18 of 28 didn't come. The 10 who did were promised a bigger group, so the event felt thin. His read: ₹100 is throwaway money in Chennai, so people forget, or skip it without a second thought.
- **The advance should cover logistics, ad money AND a slice of profit.** He hosts himself, and the venue balance is his profit, which a no-show wipes out.
- **No online-heavy split like ₹300 + ₹100.** Pay-at-venue exists so a new brand looks trustworthy: "see the space, then pay the rest". A lopsided split reads as a grab.
- **Candidates he named:** ₹250 + ₹200, ₹200 + ₹250, or ₹250 + ₹250.

**Recommendation: ₹450 = ₹250 online + ₹200 at the venue** (what this plan already assumed). It is the only candidate that meets all three of his tests:

- 2.5× last time's commitment;
- a near-even 56/44 split;
- ₹100 left after logistics.
- ₹200 + ₹250 leaves ₹50 and no profit upfront.
- ₹250 + ₹250 has the same advance maths and only raises the price.

**Locking profit means splitting that ₹100 between ads and profit.** They are the same ₹100.

- **Suggested:** aim ads at **₹75 a booking**, locking **₹25** of profit even on a no-show. Keep **₹100** as the break-even line, where the existing cost alarm fires with `cost_per_ticket` = ₹150.
- **The decision table becomes:** ≤ ₹75 → raise budget ~20% every 2 days; ₹75–100 → hold; > ₹100 → pause and change the reel or offer.

**A live test of his commitment theory is 4 days away.** The Girls-Only Meet on 2026-10-04 has **10 advances at ₹199** (vs ₹100 last time).

- How many of the 10 show is the first real reading of whether a bigger advance cuts no-shows.
- Record it. `applications.attended_count` is not filled in on any split event (Founders Meet reads 0 despite 10 venue balances), so venue balances paid (`fully_paid`) are today's only attendance record.

**OWNER DECISION 2026-09-30: ₹450 = ₹250 online + ₹200 at the venue. The whole ₹100 (advance − ₹150 cost) is the ad limit; only the venue balance is profit.** He briefly chose a ₹75 ad target with ₹25 profit locked at booking. The alarm threshold went 100 → 75, then was reverted to **100** the same day: "keep it simple while we learn the system". Do not re-propose the profit slice unprompted. With this price, the Budget section's arithmetic and the event's `cost_per_ticket` (₹150) stay as written. The ad ceiling becomes (advance − 150) × tickets.

## Why one ad set, and no top/bottom-of-funnel split

The owner's reading, agreed and now checked against the lessons:

- **The decision is quick and small:** 5–10 minutes from landing to booking, ₹250 and one evening, one city. Funnel stages exist for long decisions.
  - **Measured 2026-09-30.**
    - **Method:** every successful open-event advance/full payment from 2026-08-09 (when the pay-redirect event starts) to 2026-09-29, excluding test phones and payments under ₹50. Each payment is matched to the site visit whose "go to PayU" tap came within 3 minutes of the PayU order. "Paid" is the status change to advance_paid/fully_paid.
    - **Result:** 46 of 62 payments linked. Median **4.4 min** from the first page of the paying visit to paid; 38 of 46 (83%) within 10 min, 40 of 46 within 15; the slowest 10% took 18+ min. Median **2.8 min** to the tap that goes to PayU, and 45 of 46 tapped within 10 min.
    - **Where the slow cases were:** mostly INSIDE PayU (7 spent over 5 min there; 15–23 min for the slowest, i.e. payment friction, not indecision).
    - **Founders Meet alone:** 28 linked, median 4.4 min, 22 of 28 within 10 min, all 28 reached PayU within 10 min.
    - **Unlinked (16):** 15 are Anna Nagar Meetup. It then ran as submit-a-form-then-pay-later: 10 of the 16 paid more than an hour after the form, some days later. That is a genuinely longer decision, but from a different flow.
    - **What it cannot show:** earlier visits in another browser session. The cross-visit `visitor_id` is 0 of 3,203 rows in the last 30 days, because the client code is not pushed. Only 3 of 46 linked buyers had visibly come back to pay (form filled hours or days earlier).
    - **So:** "5–10 minutes on the visit they buy" is VERIFIED; "5–10 minutes from first hearing of us" is not measurable yet.
- **The reels already do both jobs:** they explain chapter அ and give the plan's details.
- **The lessons fold funnel stages into one ad set at this size:** Mandalia, Blue Sense (~90% of accounts), Willington 2026 (disagreement G, H).
- **After Andromeda, the ad does the targeting.** Meta reads the reel itself to decide who sees it (synthesis #1, ≈20 lessons). A "cold" and a "warm" ad set would mostly compete for the same people.
- **Retargeting has no pool.**
  - "Website visitors – 180d" read **20 people** on 2026-09-29, the same as on 2026-09-11 (§19).
  - Meta can tie only ~1% of our organic visitors to an account.
  - The one event-specific exception, a retargeting finale near the date, is covered by a final-week ad in the same ad set (below). Meta shows it to warm people by itself.

**Structure: 1 campaign → 1 ad set → 3 ads (+1 in the final week).**

**OWNER DECISION 2026-09-30: re-edit the existing paused campaign rather than build a new one.** It was only a test build and has never delivered, so there is no history or learning to lose.

The objects are campaign `120248398500750192` "Founders Meet · Aug 30 · first test" and ad set `120248398504180192` "Chennai +40km · broad · Purchase". This is what they held on 2026-09-29 (read from `meta_adset_config`) and what to change:

| Setting | Now | Change to |
|---|---|---|
| Campaign name | Founders Meet · Aug 30 · first test | `Founders Meet · <date>` (it becomes `utm_campaign`, so rename before any ad runs) |
| Budget | ₹95.76/day **on the campaign** (Advantage campaign budget) | ₹150/day, left on the campaign. With one ad set this is identical to an ad-set budget, and switching it is an extra step for nothing |
| Campaign spending limit | none | ₹100 × tickets wanted |
| Objective / event / bidding | Sales · Purchase · dataset `28370453785913523` · highest volume | **already right** |
| Attribution | **1-day click** | 7-day click · 1-day engaged-view · 1-day view. If greyed out, duplicate the ad set and set it on the copy (§29.5) |
| Age | 18–65 | minimum 21; suggestion 22–40 |
| Location | Chennai 40 km, "living in or recently in" | keep 40 km; try "people living in", accept if Meta widens it |
| Advantage+ audience | on | **already right** |
| Exclusions | none | **already right** (owner decision, below) |
| Placements | Facebook (11 spots), Instagram (6), Messenger, Threads | **untick Facebook, Messenger, Threads**; keep all 6 Instagram spots |
| Audience Network | off (since 2026-09-18) | **already right** |
| Brand safety | Relaxed (a default) | Moderate |
| Schedule | none | start/end per the Budget section |
| Ads | none exist | create the 3 ads (below) |

**Every edit takes effect only on Publish. Publishing a paused campaign keeps it paused.** The next morning's sync should show `attribution_setting = 1d_engaged_view_1d_view_7d_click` and `publisher_platforms = [instagram]`.

## Settings

### Campaign

- **Objective:** Sales. Choose **manual** if Ads Manager offers it (otherwise switching placements to Instagram-only turns it manual anyway).
- **Name:** `Founders Meet · <date>`. The name travels into bookings as `utm_campaign`.
- **Special ad category:** none.
- **A/B test:** off.
- **Budget:** ₹150/day, on the campaign where the existing one already has it. With one ad set there is nothing for it to split.
- **Campaign spending limit = the total ad ceiling** (₹100 × the tickets you want ads to sell).
  - This is the hard stop.
  - Meta may spend up to ~75% over the daily budget on a given day, and our alarms run once a day (§8).
  - §5 Layer 7 calls for an Ads Manager spend rule as the one auto-pause. The campaign spending limit does that job without a separate rule.

### Ad set

**Conversion**

| Setting | Value |
|---|---|
| Conversion location | Website |
| Performance goal | Maximise number of conversions |
| Dataset | `28370453785913523` |
| Event | Purchase |
| Cost per result goal | empty |
| Bid strategy | Highest volume |
| Attribution | 7-day click · 1-day engaged-view · 1-day view |

- **Leave the cost goal empty.** Manual bidding amplifies winners and never rescues losers. It comes after proven ads, not before (synthesis #19).
- **Attribution:** check it stuck after publishing. The next sync stores `1d_engaged_view_1d_view_7d_click` in `meta_adset_config.attribution_setting`.
- **Expect one push once it's live:** "this ad set cannot reach ~50 conversions a week" (§29.4). That is the known trade-off of Purchase-first, not an alarm.

**Budget and schedule**

- **Daily budget:** ₹150, set on the campaign (see the table above). Meta's minimum is ₹94.91.
- **Start:** so that daily budget × days of ads ≈ the campaign spending limit (see Budget). At ₹150 a day and 20 tickets, that is ~2 weeks before the event.
- **End:** when bookings close on the event day, not the event morning.
  - Event sales bunch at the end. In one of Willington's cases, 80–90% came on the day before and the day itself.
  - With a 5–10 minute decision, same-day bookings are realistic.

**Audience**

- **Location:**
  - **OWNER DECISION 2026-10-08: city-wide Chennai.** Every event is in Chennai for now, so keep the existing ad set's Chennai + 40 km and do not use a venue pin. (Before this, the plan offered a 20–25 km venue pin as an alternative. The 91-lesson digest found no universal radius.)
  - Choose "people living in this location".
  - Meta widened this to "living in or recently in" on the old ad set (§10). If it won't hold with Advantage+ audience on, accept it.
- **Minimum age:** 21. This is a hard limit.
- **Age suggestion:** 22–40. Advantage+ treats it as a hint only.
- **Gender:** all.
- **Languages:** empty.
- **Interests / lookalikes:** none. The ad does the targeting (synthesis #1).
- **Advantage+ audience:** on.
- **No exclusions. OWNER DECISION 2026-09-30: keep it broad and simple.**
  - One campaign, no past-guest exclusion, no separate past-guest campaign. Meta does the targeting within Chennai and the minimum age.
  - **His reasons:**
    - A past guest's interests can't be modelled yet: someone who came to a beach-house party may want a café meetup and not a Founders Meet.
    - Past guests don't all see every organic reel.
    - At scale, filling seats has to be predictable, whoever buys.
  - **How it gets revisited:** if the campaign turns out to bring in many returning customers, look for a cheaper way to reach them then. Until then, nothing is modelled.
  - **What this needs from us:** at each read, split ad bookings into **new vs returning** (phone matched against earlier paid bookings). It is a query Claude runs; no panel card exists for it. Without the split, "a lot of repeat customers" can't be seen.
  - **That weekly push is OFF (owner asked, 2026-09-30).** `meta-ads-sync` v29 has `PUSH_MISSING_CUSTOMER_EXCLUSION = false`. The finding still shows on the Audiences card, and the retargeting-widened push is untouched. Flip the constant to bring it back. Deployed with `--no-verify-jwt`; deployed code diffed equal to the repo; a manual run returned `ok:true`. Not committed.
  - Earlier in this conversation the plan excluded `customers_all_paid` and then proposed a separate "Past guests" campaign. Both were superseded by this decision, and the reasoning for them is not repeated here.

**Placements**

- **Manual:** all 6 Instagram spots the existing ad set has (Feed, Stories, Reels, Explore, profile feed, search).
- **Keep Feed ticked if Explore is on.** Explore needs Feed and silently delivers nothing without it (§23).
- **Untick** Facebook, Messenger, Threads and Audience Network.
- **Off:** "Allow limited spend to excluded placements".
- **Brand safety:** your call. The relaxed default was never chosen (§24 item 5). Moderate suits a curated club.

### Each ad

- **Identity:** Page "Join Chapter அ" + your Instagram account.
  - Check the Instagram account is attached; this can't be read from here.
  - **Don't create a "Page-backed Instagram account"** (§23). That would run your ads as the Page instead of your real handle.
- **Format:** one video per ad. Not multi-creative; the true-ROAS join is per ad (§23).
- **Multi-advertiser ads:** off.
- **Destination:** `/lifestyle` (§15).
- **URL parameters, on every ad:**
  `utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.id}}&utm_content={{ad.id}}&placement={{placement}}&site_source_name={{site_source_name}}`
- **Enhancements:** turn all of them off (synthesis #15). Owner-specific reason: text tools can rewrite the date or price. The OPP-1 guard (§30) pushes per creative if any are left on, especially these four, which are on by default:
  - multi-advertiser ads;
  - relevant comments;
  - adapt to placement;
  - description automation.
- **Copy, line 1:** `Founders Meet · Sat <date> · <area>, Chennai`
  - City, date and area go first. The ad with the least information needed to decide usually wins (synthesis Part 4.1).
  - Then one line naming the *situation*, not a label: for people building something in Chennai (disagreement J). Use words your past guests used; that vocabulary is itself targeting (synthesis #1).
  - Then: `₹250 to book your seat online, ₹200 at the venue. Limited seats.`
- **Headline:** `Founders Meet — Sat <date>`.
- **CTA:** Book now. Shop now was flagged as off-brand (§23).

## The reels (§23 "Reels Ads", "The Instagram Ads API guide set")

**Three ads at launch, each a different idea, not three versions of one.**

- Meta groups near-identical ads (same person, same room, same script, new opening line) into roughly one ad (synthesis #2, ≈15 lessons).
- At ₹150 a day, every ad needs enough spend to teach something (disagreement D). Three is the most this budget can fund.

| Ad | What it is | Why |
|---|---|---|
| 1 | The proven reel (10K views, 25+ bookings) | Your best evidence. Organic winners are the proven-concept inventory (synthesis Part 7) |
| 2 | A reel with a different **reason** to come, e.g. what actually happened in the room last time, or a past guest talking | A different angle |
| 3 | A reel with a different **person or situation**, e.g. someone new to Chennai building alone. Or a plain date/venue flyer as a static | A different persona or format. Flyers won for events people already want (Videll) |

**Hook swaps come later, and only on the winner.** Once one ad is clearly taking the spend, new openings on *that* reel are the cheapest next test (synthesis #4, disagreement M).

**Final-week ad (added ~6 days before the event, one batched change):** `This Saturday · <n> seats left`, only if it's true.

- It replaces a separate retargeting campaign. Meta will show it mostly to people who already saw the others.
- Adding it can restart learning. At this volume the ad set is learning-limited anyway, so the cost is small.

**Rules for the reels themselves:**

- **Only some reels can be promoted as an existing post.** It must be:
  - under 90 seconds;
  - 9:16;
  - **no third-party copyrighted or trending music;**
  - no filters or interactive stickers;
  - **not cross-posted to Facebook**.

  A reel with trending audio **cannot** be promoted as-is.
- **Promoting an existing post keeps its likes and comments,** and it stays trackable if the CTA link carries the URL parameters. But its caption can't be edited. If the caption names the old date or the old price (₹299, ₹100 advance), use a new upload.
- **A new upload needs:**
  - licensed music (Meta's Sound Collection), original audio or voice only;
  - 9:16 at 1080×1920, under 60 seconds;
  - a 9:16 thumbnail;
  - the bottom 35% of the frame kept clear of text.

  The ad account holds 0 videos today.
- **Check the video itself** for the old date or price in on-screen text.

## Pre-flight: create everything PAUSED, let the morning checks run, then switch on

The daily jobs read paused ads too (§8: sync 08:50, alerts 09:07, watchdog 09:11 IST). So build the campaign **paused** the day before, and look for pushes the next morning.

| Push | Meaning |
|---|---|
| `{{ad.id}}` missing or wrong on a creative | Fix the URL parameters (§23) |
| An enhancement left on (OPP-1) | Switch it off on that creative (§30) |
| Placements | Now read before spend (A-6 fixed, §28.14). The Audience Network push fires only once the ad set is active |

**No push means clean. Then switch the campaign on.**

## Budget

- **Total ceiling:** ₹100 × the tickets you want ads to sell. For example, 20 tickets = ₹2,000. This is also the campaign spending limit.
- **Pacing:** ₹150 a day.
- **Make the two numbers agree (owner asked, 2026-09-30).** Daily budget × days of ads should roughly equal the total ceiling.
  - Otherwise the ceiling stops the campaign early, right before the final days when event sales bunch up.
  - Example: 20 tickets = ₹2,000. At ₹150 a day, that lasts ~13 days, so **start ads ~2 weeks before the event, not 3**.
  - Alternatively, spread ₹2,000 over 3 weeks at ~₹95 a day. That is Meta's floor (₹94.91) and gives Meta less to learn from each day.
  - Prefer the shorter, fuller run.
- **Date:** about 4 weeks out, giving ~3 weeks of ads. The lessons suggest 4–6 weeks of lead time for small events (Willington). With a 5–10 minute decision, 3 weeks is enough.
- **Benchmark:** none exists for Chennai. The first ~₹1,000 finds out whether ₹100 per booking is reachable.

## When to act — at the CAMPAIGN level, not per ad

**Two time windows, updated 2026-09-30:** phone guardrail messages start **“Over the last 7 days”**. They judge recent performance in the rolling seven-day window, not total campaign spend. For the **₹1,000 review and final event result**, use the date range from this campaign's first delivery through the review date: total spend divided by tagged paid tickets over that same campaign period. Do not substitute the seven-day alarm CPA. A quiet recent alarm does not mean earlier losses have been recovered. The campaign spending limit remains the cap on total campaign exposure.

**The rule behind this section (§15, §21.7 item 5).** Don't move budget, pause, or pick a winner on anything with fewer than 10 paid tickets. At ₹100 a ticket, one ad would need ~₹1,000 of its own spend to reach 10, and none will in a budget this size. So:

- **Leave individual ads alone.** Where Meta puts the money is its own verdict on the ads, and ads work as a team (synthesis #6, ≈12 lessons). Don't switch off the ad taking most of the spend because another looks cheaper on 1–2 tickets.
- **Judge the campaign as a whole.** At ~₹1,000 of total spend, the campaign itself reaches the 10-ticket floor if it is on target.
- **Wait before judging.** About 3 days is an early signal and 7+ days a decision; after any change, leave it still for 48–72 hours (synthesis #11).
- **Read the numbers after 09:11 IST.** Everything syncs once a day, so a "day 3" read happens on the morning of day 4.
- **Count bookings from our data** (bookings carrying an ad id), not Meta's Purchases. Meta's count includes view-through credit (§29.5).
- **Also watch the whole sales curve.** Chart daily Founders Meet bookings (ad + organic) against last Founders Meet's organic-only curve. Bookings the ads *added* show up as the gap between the two, which Meta's numbers cannot tell you (synthesis Part 4.8, #14).

**The phone alarms that already exist** (§5 Layer 7; one push per ad, daily). Treat them as *diagnosis*, not as orders to pause:

| Alarm | Fires when |
|---|---|
| Cost per ticket | An ad's cost per paid ticket passes ad money per ticket, i.e. **₹100** here (needs `cost_per_ticket` = ₹150 set, below) |
| Spend without a lead | ₹500 spent with no lead: a traffic problem. "Lead" here = a booking row carrying the ad id (see below) |
| Spend without a ticket | ₹1,000 spent with Leads but no tickets: a conversion problem |
| Frequency | Above 3 |
| CTR | Below 0.5% |

**OUT OF DATE: the current alarm settings are in "Second audit" at the bottom of this file and in handoff §33.6.** The two blocks below describe the per-ad rules as they stood earlier on 2026-09-30, and are kept as history.

**How they actually fire (read from the live rules, 2026-09-30, BEFORE the campaign-level change):**

- **Per ad, over its last 7 days**, checked once a day at 09:07 IST, so a push arrives the next morning.
- **The money alarms fire only once that ad has ALL of:** ₹500 spent, 1,000 impressions and 10 clicks. So "₹200 spent, no lead" fires nothing.
- **The click alarm (since 2026-09-30):** fires when under **1%** of impressions become taps through to the site, from **1,000 impressions**, with no spend or click minimum. So the dud ad nobody taps IS caught.
- **Cost per ticket:** spend ÷ tickets > ₹100, and only once the ad has ≥ 1 ticket.
  - Example: ₹520 spent for 4 tickets = ₹130 → fires. ₹520 for 6 = ₹87 → silent.
- **What these alarms call a "lead" (checked in code 2026-09-30):** a row in `applications` whose `attribution.utm_content` is the ad id, in any status. It is NOT Meta's Lead event.
  - **Open, self-serve events:** the row is inserted in `handleProceedToPhonePe` (`src/AppFlow.tsx`), i.e. only AFTER the WhatsApp OTP is verified, as the person moves on to pay. So "leads but no tickets" there means **people verified their number and went to pay, and nobody completed payment**: a price-screen or payment problem.
  - **Invite flow:** the row is the submitted application.
  - Both flows are covered. (Meta's Lead event fires earlier, at the OTP request.)
- **Spend without a lead:** zero such rows and more than ₹500 spent.
- **Spend without a ticket:** Leads but zero tickets, and more than **₹500** spent (was ₹1,000 until 2026-09-30). The two are exclusive, so one dead ad never pushes twice.
- **After firing,** each rule stays quiet on that ad for 24 h (48 h for frequency and CTR).

**Checked against the lessons' rules of thumb** (synthesis Part 3), at a ₹100 target:

| Rule of thumb | At ₹100 | Our alarm | Verdict |
|---|---|---|---|
| Spend 3× target before judging (common); 3–5× (Iles); ~5× (Blue Sense) | ₹300–500 | cost per ticket judged from ₹500 | **matches** the careful end (5×) |
| Stop-loss at ~2× target with no conversion (Cordeddu); 1.5–2× (Griffin) | ₹150–200 | no-lead at ₹500; leads-but-no-ticket at ₹500 (was ₹1,000) | **5×**, the careful end. Still looser than a 2× stop-loss, deliberately: at 3 ads sharing ₹150/day an ad reaches ₹200 within days, on luck alone |
| ~10 conversions before a decision (Cordeddu) | ~₹1,000 | the plan's campaign-level read at ~₹1,000 | **matches** |
| ≥ 3 days for a signal, ≥ 7 to decide | — | 7-day window, day-4 read | **matches** |

**DONE 2026-09-30 (owner: "yes do both", and 1,000 impressions not 2,000):**

- **The CTR alarm now judges taps through to the site.**
  - Before: "clicks (all)" (likes, profile taps) at 0.5%, from 2,000 impressions and 10 clicks, so ads nobody tapped could never trigger it.
  - Now: rule `link_ctr_under_1pct` (renamed from `ctr_under_half_pct`), link clicks ÷ impressions < 1%, from 1,000 impressions, no minimum spend or clicks.
  - The metric is still called `ctr`, so the push wording ("X% click-through, under the 1% floor") and the panel needed no deploy.
- **"Leads but no ticket" fires at ₹500**, not ₹1,000. The rule is renamed `spend_no_ticket_500`.
- **How it was changed:** `supabase/migrations/20260930_meta_guardrail_link_ctr_and_no_ticket_500.sql`. It patches the LIVE function definition (dumped first) and was applied with `supabase db query --linked -f`, so it is not in `list_migrations`.
- **Verified:**
  - Rules read back correctly, and anon/authenticated still cannot execute the function.
  - With 4 fixture ads at ₹100 spend, the alarm fired for 1,200 impressions with 5 link clicks (0.42%) and for 1,500 impressions with 0 link clicks (0%). It stayed silent for 1,200 with 20 (1.67%) and for 800 impressions.
  - Fixtures deleted afterwards (`meta_ad_daily` 0 rows, 0 guardrail events).
  - The ₹500 change is a threshold on an unchanged code path. It was NOT fixture-tested, because that needs fake bookings in `applications`, which set off real assignments and notifications.

 (synthesis #18). The fix is a new *idea*, not a budget change.

**Owner's decision points:**

- **Morning of day 4 (~₹450 spent), no bookings:** don't touch the budget. In Ads Manager, compare link clicks with landing-page views, then look at the site-wide funnel in Growth ▸ Analytics. The per-ad funnel card isn't live yet (below).
- **Around ₹1,000 total spent:**

| Campaign cost per booking | Action |
|---|---|
| ≤ ₹100 | Raise the daily budget ~20% every 2 days |
| ₹100–150 | Hold |
| > ₹150 | Pause, then change the reel, the message or the offer, not the settings (synthesis #12: when many ads fail, change the offer) |

- **Seats nearly gone:** pause the same day. Nothing stored marks a date sold out (§20).
- **Avoid test bookings while ads run.** The browser Pixel's test-phone guard isn't live (§28.8), so a test booking reaches Meta as a real sale.

## What the live admin panel can and cannot show you

**Live now:**

- per-ad spend, bookings, cost per ticket;
- true ROAS without fees;
- all the phone pushes above.

**Not pushed** (in the local commits):

- the "too few tickets to judge" label and grey ROAS. **Until then the live panel colours ROAS green or red even on 1–2 tickets. Don't act on those colours.**
- the "Learning phase" and "What's switched on" cards;
- "What each plan can spend on ads";
- the per-ad funnel;
- the `untagged_spend` alarm;
- the placement-per-booking capture.

Funnel steps from visits made before that code ships can't be recovered later. Stated once; pushing is the owner's call.

## Outside Ads Manager, before switching on

1. **Set the event's cost per ticket to ₹150:** Team ▸ Performance ▸ Per-Event Unit Economics ▸ "Your cost/ticket". The owner deferred this "until actively running ads" (§18). At ₹0 the cost alarm thinks ₹250 per ticket is fine.
2. **Price:** set ₹450 full / ₹250 advance in the event's city pricing. For open events, `city_details` holds the real price, not `price_full` (§21.5).
3. **Create a new event rather than re-dating the old one.** Bookings are unique per event and phone, and whether a past guest can book the same plan on a new date has never been verified (§21.6). A fresh event avoids it.
4. **Events Manager → "Track events automatically without code" → off.** The code fix for this isn't live (§24 item 4). If the event-priority (AEM) list appears once the campaign exists, put Purchase at the top. Changing it later pauses delivery for 72 hours (§9).
5. **One founder push device.** Every alarm goes to that single phone (§16 Phase 5). Keep its notifications on for these three weeks.

## After the event

- **Compare no-shows from ad bookings with organic ones** (§21.4). If ad bookers no-show far more, the advance has stopped being a clean signal for ad traffic. At ₹250 the advance is 2.5× last time's ₹100, so no-shows should drop anyway.
- **Record what the first ₹1,000 showed:** cost per landing, cost per booking and which idea took the spend. The next plan starts from these numbers instead of guesses.

---

## What to remove from the Meta system — the post-Andromeda audit (2026-09-30)

**The owner's question:** some of what we built, especially audience building, follows the pre-2025 playbook. Which parts should go?

**The test applied:** what 2025–26 practice says replaced it (synthesis #1: the creative is the targeting; disagreement G: separate retargeting is mostly not needed; #14: closing ads are over-credited). Checked against our own measurements.

**DONE 2026-09-30** on the owner's instruction ("do the retiring"). Everything in the Retire table below is carried out; the exact changes are in `META-ADS-HANDOFF.md` §24.

### Retire: built for a playbook that no longer applies

| What | Built for | Why it goes | Live facts (2026-09-30) |
|---|---|---|---|
| The **4 draft website audiences** `price_seen`, `dates_opened`, `plan_viewed`, `top_engaged` (§19) | Three retargeting tiers (the classic top/middle/bottom funnel split) plus a lookalike seed | Meta now finds warm people from the ad itself; separate retargeting is "mostly not needed" (Blue Sense ~90% of accounts, Mandalia, Willington 2026, Mark). It needs tens of thousands of matchable people, and our pool is 20. Your 5–10 minute decision leaves no middle of a funnel to nurture | All 4 are `draft`, never created on Meta. Retiring them only means marking them `retired` in the registry. No Meta change |
| **Lookalike plan** (§13 item 5) and the `customers_completed` upload | A lookalike seeded from people who came | Lookalikes are "weak or dead for most advertisers" after Andromeda (synthesis #1, ≈20 lessons). With Advantage+ audience on, Meta treats them as a hint anyway. The owner already dropped the weighted version (OPP-12, §32) | 85 people's hashed details uploaded daily for a use that will not happen |
| The `leads_unpaid` upload | A retargeting list of people who started but never paid | Same reason as the tiers. These people also gave their phone number, so they can already be reached on WhatsApp for free | 167 non-customers' hashed details uploaded daily with nothing using them. That also goes against §12's own rule: share personal data only when something uses it |
| **Catalog ads readiness** (§20) and `meta-catalog-feed` | Advantage+ catalog (dynamic product) ads | Catalog ads are the textbook "closing ad" that looks best in Meta's numbers and adds least in reality (Blue Sense's "DPA death spiral": 7× reported vs ~1.9× real). With ~3 plans there is no catalog to speak of. The handoff already called it a brand cost for a curated club | No catalog exists on Meta. The feed is a public URL nobody fetches |

**How they were retired (kept as the recipe):**

1. Mark the 4 drafts `retired` in `meta_website_audiences`.
2. Take `customers_completed` and `leads_unpaid` out of `meta-audience-sync`.
   - Redeploy with `--no-verify-jwt`: it imports `_shared/metaCapi.ts`, so check that it is bundled.
   - Then delete those two lists on Meta. It is safe: no ad set uses them. Check with `ads_get_custom_audience_adsets` first, because deleting an audience an ad set uses pauses that campaign.
3. Undeploy `meta-catalog-feed`.

The database tables can stay. They cost nothing, and history is not deleted.

### Leave as-is, switched off in practice

- **OPP-3 "retargeting widened" warning** (§30). It only fires for ad sets targeting our retargeting audiences. With none, it never fires. Removing it is effort for nothing.
- **Audience size snapshots** (§19). One cheap daily read. They test the one open question: do paid clicks grow the website pool, since ad clicks carry a click id? If "Website visitors" climbs past a few thousand after this campaign, retargeting could be reconsidered then.

### Keep: these matter *more* after Andromeda, not less

- **`customers_all_paid` + its daily sync.** Owner, 2026-09-30: keep it running as the seed for a possible future lookalike of paying customers. Not attached to the Founders Meet ad set (owner's decision, above), but it is the ready-made lever if returning customers later need a cheaper route, either as an exclusion or as a target. The "ad set missing the exclusion" push will fire weekly under that decision; see the Audience section.
- **Pixel + Conversions API + match quality + the signal watchdog.** When the ad picks the audience, the other thing Meta learns from is the sales signal. EMQ 9.3.
- **The `{{ad.id}}` join, true ROAS and the circuit-breaker alarms.** Meta's numbers over-credit closing ads (synthesis #14). Our cash is the referee.
- **The creative-enhancements guard (OPP-1).** Turning off enhancements that alter the ad is consensus (synthesis #15).
- **Placement watch, learning-status capture, delivery history.** These are records, not strategy. They stay true whatever the strategy is.

---

## Second audit, 2026-09-30: whole system vs the rules of thumb

Full write-up: `META-ADS-HANDOFF.md` §33. Two things affect this plan directly:
- **FIXED 2026-09-30 (handoff §33.6): the money alarms now judge the whole campaign.**
  - **Final setting, owner 2026-09-30:** the alarms follow the rules-of-thumb table (handoff §33.6).
  - Campaign cost per ticket pushes above **₹100 (break-even)** once the campaign has spent **₹500**, about day 4. With **zero tickets** it pushes once ₹500 is spent ("not one ticket sold"), even if Book now taps look cheap.
  - **Any single ad** that spends **₹300** without a sale pushes "look at it". About 1 time in 20 that is bad luck on a good ad (owner chose ₹300 over ₹200 "to give the reel a fair chance").
  - A campaign whose **Book now / Contact taps cost more than ₹20 each** (about 1 in 5 tappers pays, so a tap is worth ~₹20 at ₹100 a ticket) pushes from ₹500 spent, including when nobody has tapped at all. This replaced the campaign "no lead" / "no ticket" alarms (owner, 2026-09-30: the drop-off is at the price step).
  - Pushes are heads-ups. The pause line stays ₹150, read at ~₹1,000.
  - **Fixed 2026-09-30 after re-audit:** both campaign money alarms have **no impression or click floor**. Low or zero traffic cannot suppress them. The spend floor stays ₹500: zero-ticket CPA fires above ₹500; zero-tap warning fires at ₹500. The rules still use a rolling seven-day window and run once daily.
  - Click-through, frequency and missing tags stay per ad.
  - This supersedes the per-ad alarm description in "When to act".
- **FIXED 2026-09-30: frequency now uses Meta's own 7-day count**, instead of summed daily reach, which read up to 7× low.

---

## Owner's answers to the 91-lesson digest's questions (2026-10-08)

The digest is `docs/LESSONS-DIGEST-2026-10-04.md` (OpenClaw job `lessons-digest`; its §4 marks every setting in this plan SUPPORTED / CONTESTED / CONTRADICTED / LESSONS SILENT, and §11 asked three questions).

1. **Efficient ticket sales, not a fair test of each ad. OWNER DECISION.** Meta decides how the budget is shared between the ads. An ad Meta barely shows stays untested, and that is accepted; do not add structure (separate ad sets, forced equal spend) to give every idea a hearing. This matches "Leave individual ads alone" above.
2. **City-wide Chennai targeting. OWNER DECISION.** Recorded in the Audience section.
3. **Daily budget or one lifetime budget: NOT DECIDED.** The owner is unsure. The digest's event lessons split one against one (Two Story Media runs a small daily budget; Southworth prefers a lifetime budget for shows), so the lessons do not settle it. The options put to him on 2026-10-08:

| Shape | What it means | For | Against |
|---|---|---|---|
| A. ₹150 a day + ₹2,000 campaign limit (the plan as written) | ~13 days of ads | Simple; the "+20% every 2 days" rule is written for a daily budget | Meta can overspend a day by up to ~75%, so the limit can be reached BEFORE the event, in the days when event sales bunch up |
| B. ₹2,000 lifetime over 3 weeks | ~₹95 a day on average | Longest presence | ₹95 a day is Meta's minimum (₹94.91 × 21 days = ₹1,993), so Meta has no room to spend more on good days, and each day teaches it very little |
| C. ₹2,000 lifetime over the last ~2 weeks, ending at booking close | ~₹143 a day on average, paced by Meta | Meta makes the money last to the event day by itself, and may spend more on days it expects bookings | Spend per day is uneven, so a day-by-day read is noisier; scaling means raising the total, not a daily figure; whether the existing paused campaign's daily budget can be switched to lifetime without rebuilding it is UNVERIFIED |

Recommendation given: **C**, because it removes the one risk shape A has (running out before the final days) and avoids B's problem (spending at Meta's floor). It rests on reasoning, not on the lessons. The ceiling stays ₹100 × tickets either way. The older "three weeks of ads" wording in the Budget section stays superseded by "about 2 weeks" whichever of A or C is chosen.

### Budget shape: the owner's direction (2026-10-08, later the same day)

**OWNER DIRECTION: learn the right lead time by trial and error, not by guessing it.** His words, condensed: the budget is ₹100 × the seats we want ads to fill (10 seats = ₹1,000, 15 = ₹1,500). Set it as a lifetime budget from about three weeks out and watch. If the seats are not filled as the money runs down, **add more money in the final week, knowingly at a loss**, because that is when most bookings come. The loss buys the lesson: next time we know whether one, one and a half or two weeks is enough for that event. He rejected "₹2,000 over two weeks" as a fixed answer, because two weeks is itself a guess.

Points raised in reply, for whoever sets this up:

- **Meta's minimum may forbid the longest version. UNVERIFIED in Ads Manager.** This plan records a ₹94.91 daily minimum. If a lifetime budget must be at least that × the number of days, then ₹1,000 covers at most ~10 days, ₹1,500 ~15 days, and three weeks needs ~₹2,000. So "15 seats over three weeks" may be refused; the choices are to start later or accept the larger total.
- **Read the lead time from BOOKINGS per day, not from spend per day.** With a lifetime budget Meta paces the spending itself, so the spend curve shows Meta's pacing, not when people wanted to book. The lesson is in ad-tagged bookings counted by days-before-event, and cost per booking week by week.
- **Where the "loss" really starts.** A booking that shows up brings ₹450 against ₹150 cost, so ₹300 in all. Ad cost up to ₹100 is covered by the advance alone. Between ₹100 and ₹300 the ad is paid from the venue balance, so it only works if the person shows up. Above ₹300 it loses money even when they come. A top-up limit was suggested on that basis; the owner has not set one yet.
- **The ₹100 campaign alarm will fire during a top-up.** That is expected then, not a fault.
- **One event is one reading.** Organic reels sell alongside the ads, so the first curve is a starting point, not a rule.

### A different shape the owner is now leaning to: always-on ads with no date in them (2026-10-08)

**OWNER DIRECTION, not yet a final plan.** He is turning Founders Meet into a repeating product. In a month he would open **two dates** of the same plan on the website (he considered three, and wants to test with two), and run ads **every day** whose creatives name only the idea and the place, **never a date**. A visitor taps Join, sees the calendar, and picks whichever date suits. He saw a Chennai meetup/trips brand doing this in the Meta Ad Library. He will also post **no organic reels while the ads run**, so sales in that period can be read as coming from the ads. The top-up ceiling is left undecided ("very hard to decide at the moment").

What this changes in this plan, if he goes ahead:

- **Budget type settles itself: a DAILY budget.** A lifetime budget needs an end date, and always-on ads have none. A flat daily amount also makes the read cleaner, since every day spends about the same and bookings per day can be compared directly. The total becomes ₹100 × all the seats on sale across the dates, not per event.
- **The lead-time question is answered a better way.** Instead of inferring it from when bookings arrive, compare each ad booking's date with the event date the person CHOSE (`applications.selected_date`). People picking the nearer or the farther date is the direct reading.
- **The ad copy section above is superseded for this shape.** It puts city, date and area in line 1 and adds a "This Saturday · n seats left" ad. With no date, line 1 is the idea and the place, and the last-seats ad does not apply as written.
- **It runs against one of the digest's seven consensus patterns** ("make the event, place and date unmistakable", 4 event channels). Those channels sell one-off events: concerts, races, shows. A repeating plan with a calendar is closer to selling a product, which those lessons do not cover. The competitor's ad shows that someone runs this shape, not that it pays; the Ad Library shows no results.
- **Things it gains:** the campaign and its ads are not rebuilt for every date, so sales history and likes build up in one place; a reel's caption never goes out of date; a visitor who cannot make one date has another.
- **Things it gives up:** the deadline in the ad itself. Urgency then lives only on the website.

**NOT a blocker — corrected by the owner the same day.** A session flagged that a phone which has paid for an open event is refused a second booking for that event (`create-payu-order` 409 "already paid for this open event"), and called it a blocker for a repeating product. **The owner: that rule is deliberate.** Each Founders Meet needs NEW people. The games, the session and the venue are the same every time, so a returning guest would find it repetitive. The repeat he wants is ACROSS plans: someone who came to a Founders Meet later comes to a Sunday meetup or a Pondicherry beach-house party. Lifetime value is therefore counted across chapter அ events, not within one plan (not yet measured). Do not propose letting a guest rebook another date of the same plan. With two dates under one event the rule does exactly what he wants: one person, one date.

**The competitor, in more detail (owner, 2026-10-08).** A Chennai trips-and-meetups brand, about four years old and by his read thriving, runs many events at once. Every ad in its Ad Library is a reel, and none shows a date. That is stronger evidence than one ad would be. The difference from us: their ads open a chat where a person makes the sale (they also sell on a website; he is not sure how the two split). In a chat, a human gives the dates and answers doubts. On our self-serve site the plan page and calendar have to do that job alone, so how quickly a visitor from a date-less ad finds the dates matters more for us than for them.

**Smaller things to check then:** what the visitor sees when one date is full and the other is not; that the cost alarm's `cost_per_ticket` is set on the event; and that ads are paused when BOTH dates are full, since nothing does that automatically.

