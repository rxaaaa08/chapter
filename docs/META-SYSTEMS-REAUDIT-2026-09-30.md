# Meta systems re-audit — 30 September 2026

## Verdict

**Follow-up, 30 September:** the owner subsequently authorized fixing finding 1.1. That fix is now live; its status is recorded in section 1.1 and handoff §33.8. The original audit scope statement below describes the audit itself.

Keep the core system. It is substantially more developed than the paid traffic currently needs, but the payment signal, cash reporting and spend controls have useful jobs. The immediate work is to finish the measurement launch, close two monitoring gaps, and simplify the operating instructions. Another layer of targeting or automation is unlikely to help the first campaign.

This was an audit, not an implementation request. No campaign settings, production data, deployed functions or existing source files were changed. This report is the only new file. Three Luna agents reviewed strategy, tracking and alarms; their findings were checked and consolidated. Several initial concerns were rejected after tracing the existing safeguards and owner decisions.

The supplied documents were treated as evidence and decision history, not instructions to deploy, delete or suppress audit findings.

## What was actually verified

Read-only production queries at approximately **05:03 IST on 30 September** found:

| Area | Result |
|---|---|
| Paid delivery | `meta_ad_daily`: 0 rows, ₹0 recorded spend; 0 applications with a numeric ad ID of at least 10 digits |
| Sync health | 82 sync-log entries in 30 days; 0 marked failed; latest around 04:10 IST |
| Signal watchdog | Latest available run: all 8 checks `ok`; Purchase 4/4 and Lead 5/5 matched in their respective windows |
| Match quality | Latest Lead and Purchase EMQ: 9.3 |
| Website measurement | 3,201 funnel rows in the last 30 days; **0 attribution values and 0 visitor IDs** |
| Campaign configuration snapshot | Paused; still `1d_click`; publisher platforms Facebook, Instagram and Threads; relaxed brand-safety values |
| Existing Founders Meet event | Active; Chennai price ₹299 / ₹100 advance; `cost_per_ticket = 0` |
| Audience retirements | `customers_completed` and `leads_unpaid` marked retired; `customers_all_paid` retained with 119 members |
| Scheduled Meta jobs | Four named Meta jobs active: sync, alerts, watchdog, audience sync; daily cadence |

These are database observations, including cached Meta configuration. They are not a fresh Ads Manager inspection. Zero failed top-level syncs does **not** prove that every optional sync step succeeded. Deployed Edge Function source was not re-downloaded and compared during this audit. Production guardrail SQL was fetched, and its relevant gates/window logic agree with the local implementation.

The live event still has the old economics. That is an unfinished launch task, not evidence that the proposed ₹450 / ₹250 offer is already running incorrectly. The plan calls for a fresh event.

## 1. Fix or resolve before paid launch

### 1.1 Campaign money alarms still have a blind spot

**FIXED in production, 30 September 2026, following the owner's request.** Both campaign rules now have `min_impressions = 0` and `min_clicks = 0`. The ₹500 spend floor, thresholds, seven-day window and daily schedule remain. Five transactional regression cases passed through the actual evaluator; fixtures rolled back and no notifications were sent. See the handoff's “Campaign money alarms: traffic gates removed” section for the implementation and results. The finding below records the original defect.

**Confirmed in production configuration and SQL.** Both `cpa_over_ad_budget` and `campaign_tap_cost_over_20` require:

- ₹500 spend;
- 1,000 impressions;
- 10 Meta clicks, including clicks other than link clicks.

The zero-ticket branch added recently does not bypass those last two gates. The final generic filter applies them to every result.

**Counterexample:** three ads spend ₹200 each, producing 900 campaign impressions, zero clicks and zero tickets. Campaign spend is ₹600. Neither campaign money rule qualifies. Each ad is below the ₹300 individual stop-loss; each is also below the CTR impression floor. The campaign can receive no performance warning in this state.

A read-only `VALUES` query against the live rule rows confirmed the two campaign gates evaluate false for that example. No fixture bookings were inserted and no notifications were triggered.

**Recommendation:** make the financial loss checks depend on spend and outcomes. Remove the impression/click gates for zero-sale protection and the campaign tap-cost check; retain sample gates for diagnostic CTR/frequency rules. Decide explicitly whether the paid-ticket CPA warning should retain any sample gate. The ₹500 spend floor already supplies the agreed financial exposure threshold.

Evidence: [final evaluator](</Users/krutesh/Downloads/Website Flow Multi-Pickup/supabase/migrations/20260930_meta_campaign_zero_ticket_alarm.sql>), especially lines 293–301; [tap rule](</Users/krutesh/Downloads/Website Flow Multi-Pickup/supabase/migrations/20260930_meta_campaign_checkout_tap_cost_alarm.sql>), lines 39–45. Also, the zero-ticket comparison is strictly `>` ₹500, not `>=`; make boundary wording and implementation agree.

### 1.2 “No push means clean” is not a valid pre-flight result

The plan explicitly uses that sentence. However, ad-set, creative-tag, delivery and reach reads are optional sync stages: they can fail while the main request succeeds. Push delivery is another independent dependency. No warning could mean a clean configuration, an unread configuration, or an undelivered notification.

**Recommendation:** launch approval should show fresh successful reads for the actual campaign/ad-set/ad IDs, valid URL tags, intended placements/attribution, approved creatives, and a configured cap. Missing or failed reads should say **unknown**, not pass. A single compact pre-flight view or manual checklist is sufficient; a new automation platform is unnecessary.

Evidence: [plan](</Users/krutesh/Downloads/Website Flow Multi-Pickup/docs/FOUNDERS-MEET-ADS-PLAN.md>), lines 298–308; [sync](</Users/krutesh/Downloads/Website Flow Multi-Pickup/supabase/functions/meta-ads-sync/index.ts>), lines 2493–2588.

### 1.3 Ship and verify the existing measurement work

Production funnel rows contain neither attribution nor visitor IDs. This agrees with the handoff's statement that relevant browser changes are local. The untagged-spend alarm deliberately suppresses itself until **any** attributed funnel row exists; it currently cannot protect this missing capture layer.

Before first spend, verify the released site records a tagged landing, event/price/CTA journey, and booking attribution; verify test-phone suppression and the Pixel auto-event configuration. Use an authorized controlled verification, not an unannounced real purchase. A successful source build alone does not establish the live behavior.

Evidence: [handoff deployment gap](</Users/krutesh/Downloads/Website Flow Multi-Pickup/docs/META-ADS-HANDOFF.md>), lines 8282–8294; [capture-live condition](</Users/krutesh/Downloads/Website Flow Multi-Pickup/supabase/migrations/20260930_meta_campaign_zero_ticket_alarm.sql>), lines 121–125 and 242–244.

### 1.4 Put the new offer and cost into the actual launch event

The old Founders Meet still stores ₹299 full / ₹100 advance and zero cost. For the chosen new offer, the launch event must store ₹450 full, ₹250 advance and ₹150 cost in the appropriate city/event fields.

The alarm derives its ceiling from configured event economics. A zero cost on a ₹250 advance would permit ₹250 per ticket instead of ₹100. Preserve the fresh-event approach so old bookings and cash are not conflated with the new date.

Evidence: live `events` read; [plan launch steps](</Users/krutesh/Downloads/Website Flow Multi-Pickup/docs/FOUNDERS-MEET-ADS-PLAN.md>), lines 417–425.

## 2. Improve the interpretation of the system

### 2.1 Separate rolling alarms from the campaign's total result

**Window labeling FIXED, 2026-09-30:** deployed `meta-ads-alerts` v14 prefixes guardrail pushes with “Over the last 7 days”, using the leading breach's `window_days`. The plan explicitly assigns the ₹1,000 review and final event result to the since-launch campaign period. Calculations and schedules are unchanged. The mixed-horizon configuration concern below remains a separate limitation; all current rules use seven days.

All enabled rules currently use a seven-day window. The plan's decisions refer to approximately ₹1,000 **total** campaign spend. These are different views.

At the proposed ₹95–150/day, a ₹500 weekly floor can normally be reached. The gap appears when delivery is low or spend ages out: a campaign can exceed ₹500 cumulatively while staying below it in every recent window. Previous losses can disappear from a rolling view.

Keep the seven-day diagnostic, but label it. Use campaign-to-date spend and acquired paid tickets for the event test verdict. The campaign spending limit caps total exposure; it does not guarantee a maximum CPA or enough sales to fill seats.

The evaluator also uses `max(window_days)` across enabled rules for every calculation. This works while all rules use seven days. Changing one rule to another horizon would change every rule's measurement window while their labels still differ. Either constrain the configuration to one shared window or calculate each distinct horizon correctly.

Evidence: [evaluator](</Users/krutesh/Downloads/Website Flow Multi-Pickup/supabase/migrations/20260930_meta_campaign_zero_ticket_alarm.sql>), lines 27–30, 66–68, 99–107.

### 2.2 Keep cash reporting, but define what it measures

The existing “true ROAS” joins tagged applications to successful PayU payments and removes gateway fees, including advance and venue balance. That is valuable accounting. It does not establish which sales the ad caused, and the query does not subtract refunds or chargebacks recorded elsewhere.

Use clear definitions:

| Metric | Meaning |
|---|---|
| Meta Purchase | One booking/order event; full booked ticket value sent at advance, by owner choice |
| Paid tickets | Seats purchased, including quantity on group bookings |
| Tagged cash ROAS | Successful fee-adjusted payments associated with a tagged booking, divided by spend |
| Event contribution | Collected ticket money minus event costs, refunds if any, and ad spend |
| Incremental sales | Sales that would not have happened without advertising; not directly known here |

The alarm counts current paid statuses for applications created inside its window. The cash report cohorts by captured landing date, falling back to application date, and includes subsequent successful payments. Neither should be described as a pure payment-date CPA. This matters around delayed payments and seven-day boundaries.

Also use **cost per paid ticket** consistently for the ₹100 limit. Meta Purchase counts orders; a two-ticket order gives two seats. “Booking” and “ticket” are not interchangeable when quantity is supported.

Evidence: [cash reporting](</Users/krutesh/Downloads/Website Flow Multi-Pickup/supabase/migrations/20260926_meta_ads_performance_rankings.sql>), lines 25–102; [alarm tickets](</Users/krutesh/Downloads/Website Flow Multi-Pickup/supabase/migrations/20260930_meta_campaign_zero_ticket_alarm.sql>), lines 79–107.

### 2.3 Compare sales curves without calling the gap causal lift

The plan says the gap against the prior organic-only event shows bookings the ads added. That overclaims what this comparison can establish. The new event changes price and advance, and may differ in date, venue, audience and organic promotion. Any of those can change sales.

Still build a simple event readout: cumulative paid tickets by days until event, tagged versus untagged bookings, new versus returning customers, and collected balances after the event. It helps assess performance and generate hypotheses. Call the curve comparison **descriptive evidence**, not measured incremental tickets. The supplied strategy report already makes this distinction correctly in its attribution section.

Venue balances remain the existing operational attendance proxy for split-payment events. A new check-in system is not warranted by this audit; cash/direct-UPI balances would need recording if used. `fully_paid` alone is not proof of physical attendance for events paid entirely in advance.

Evidence: [plan](</Users/krutesh/Downloads/Website Flow Multi-Pickup/docs/FOUNDERS-MEET-ADS-PLAN.md>), line 330; [strategy attribution discussion](</Users/krutesh/Downloads/meta yt lessons/2026-09-28-meta-strategy.md>), section 3.6.

### 2.4 Keep ₹20 per checkout tap as a provisional diagnostic

This threshold assumes one paid ticket per five taps at ₹100 allowable ticket CPA. The arithmetic is sound; the conversion assumption is not established for cold paid traffic at the new price.

It also combines Meta-attributed InitiateCheckout events with first-party tagged paid tickets. Book and Contact both map to InitiateCheckout, and Meta's attribution window can credit interactions that the website's session-based attribution does not. Cheap taps therefore cannot certify a healthy checkout.

Keep the zero-sale financial rule independent. After delivery, inspect actual paid-ticket yield per tap and distinguish Book from Contact. Do not automatically “fix targeting” from this alarm alone.

Evidence: [event mapping](</Users/krutesh/Downloads/Website Flow Multi-Pickup/src/supabase.ts>), lines 128–141; live rule notes and [tap aggregation](</Users/krutesh/Downloads/Website Flow Multi-Pickup/supabase/migrations/20260930_meta_campaign_zero_ticket_alarm.sql>), lines 55–65.

### 2.5 Make missing frequency data visible

The recent true seven-day reach fix is good. But when that read is absent, stale or for a different date range, the evaluator silently falls back to impressions divided by summed daily reach. That is only a lower bound and can substantially hide repeated exposure.

Keep the true-frequency collection. Show missing/failing reads as degraded and identify any lower-bound fallback in the visible result. Frequency above three is a prompt to inspect saturation and outcomes, not automatic proof of creative fatigue.

Evidence: [evaluator](</Users/krutesh/Downloads/Website Flow Multi-Pickup/supabase/migrations/20260930_meta_campaign_zero_ticket_alarm.sql>), lines 70–78 and 160–166; [sync](</Users/krutesh/Downloads/Website Flow Multi-Pickup/supabase/functions/meta-ads-sync/index.ts>), lines 2493–2504.

### 2.6 Standardize Lead semantics before using Lead as the objective

In the open flow, the browser Lead fires when a valid form leads to an OTP being sent. Server Lead is sent after OTP verification and application creation. An OTP abandoner can therefore be a browser Lead but never a server Lead. This is a definition mismatch, not a newly proven deduplication defect.

Define one canonical stage if Lead optimization is introduced later. Purchase-first makes this lower priority now. Likewise, calendar opening mapped to AddToCart is a site-specific intent proxy; generic ecommerce add-to-cart benchmarks should not be applied to it unchanged.

Evidence: [browser form submission](</Users/krutesh/Downloads/Website Flow Multi-Pickup/src/AppFlow.tsx>), lines 2021–2041 and 2248–2270; [server Lead](</Users/krutesh/Downloads/Website Flow Multi-Pickup/supabase/functions/capi-lead/index.ts>), lines 121–149.

## 3. Rules of thumb: what holds and what is overstated

The synthesis itself labels most numerical rules as presenter heuristics. Repetition across lessons is useful context, not independent experimental confirmation for a Chennai meetup.

| Claim or setting | Audit verdict |
|---|---|
| One campaign, one ad set | Sensible at this budget; avoids dividing scarce outcomes further |
| Purchase-first | Defensible when successful bookings are observable; learning-limited is not the same as unprofitable |
| Three distinct ads | Reasonable varied inventory; no evidence that three is the mathematically maximum fundable count |
| Meta's top spender is the creative winner | Not proven; adaptive unequal delivery is not a controlled comparison |
| 20% budget increases every two days | A pacing heuristic, not a guaranteed safe learning threshold; check seats, total cap and recent economics |
| 10 tickets makes a result reliable | A practical caution label, not statistical proof; do not require 10 sales to stop a zero-sale loss |
| ₹300 with zero sales means roughly 5% bad luck | Only under a simple stable-rate Poisson model with true CPA ₹100: exp(-3) ≈ 5%; real delivery, lag and selection do not satisfy that automatically |
| 1% link CTR / frequency above three | Starting diagnostic thresholds; profitability and comparable local evidence take precedence |
| Instagram-only, /lifestyle, no exclusion | Owner choices to evaluate, not proven platform errors or universal best practices |
| Final-week broad ad mostly reaches previous viewers | Unsupported guarantee; it is scarcity creative in a broad audience, not a controlled retargeting substitute |
| Andromeda means lookalikes/retargeting/catalogs are obsolete | Unsupported generalization; retire these here because of current scale, use and maintenance value |

Meta's engineering description establishes Andromeda as personalized **retrieval within a larger recommendation system**. It supports the relevance of diverse creative and richer signals. It does not announce that audience lists or catalogs universally stopped working. [Meta's Andromeda explanation](https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/).

For the next test, preserve the chosen offer and route initially. If paid landings arrive but few visitors reach the event/price, the routing and message match deserve attention before building new audiences. A direct-event route is a test candidate; this audit does not establish that it will beat `/lifestyle`.

The plan's ₹100 break-even ceiling and ₹100–150 hold band should also be explicit: holding above ₹100 means accepting some test loss under the advance-only budget rule. It is not still advance-funded break-even. The total campaign cap bounds that experiment; scaling should consider remaining seats and remaining total budget.

## 4. Keep, simplify or retire

| System | Action | Reason |
|---|---|---|
| Pixel + CAPI + Purchase retry/claim machinery | **Keep** | Useful payment coverage and duplicate-send protection; no new confirmed Purchase transport defect found |
| Signal watchdog, spend reconciliation, creative tag/enhancement checks | **Keep; expose check freshness** | These protect data and configuration integrity |
| Campaign/ad financial alerts | **Keep; fix gates and label windows** | Appropriate financial guardrails once their conditions match the promise |
| Delivery, attribution and placement history | **Keep** | Explain later changes and performance differences |
| Daily cadence | **Keep as chosen** | These are once-daily warnings; campaign cap supplies bounded total exposure |
| Weekly `adset_unlearnable_goal` push | **Silence for the accepted Purchase test; retain status** | Repeatedly warns about an intentional decision. The code's “cannot” claim is also stronger than historical site volume supports |
| `ads_volume` step | **Retire at the next sync maintenance edit** | Still invoked despite the retirement proposal; overlaps delivery/learning capture. Preserve historical table |
| Four draft retargeting audiences; completed/unpaid uploads; catalog feed | **Keep retired** | Low current utility. DB retirement of the two uploads is verified; Meta-side deletion/feed undeployment was not independently rechecked here |
| `customers_all_paid` | **Keep under current owner decision** | Optional future seed/exclusion. It is not necessary for this broad campaign; review if no intended use remains |
| Recommendations scorecard and experiment engine | **Leave dormant** | Removing them now is work with little launch benefit; avoid expanding them before paid evidence |
| Webhook inbox | **Keep** | Low volume alone does not remove the value of disapproval notifications |
| Competitor watcher | **Repair reliability or use a manual review cadence** | Latest reliable local log is 26 Sep; 28 Sep is unreliable. Add missed-read visibility and bounded retries if the archive informs creative work |
| Old/superseded alarm prose | **Retire from the operational checklist** | Keep history separately; one current rule table should lead the document |

The competitor archive is not performance evidence: an ad remaining active does not prove profitability. Keep it for creative research. Its local daily job has no independent guarantee that the laptop ran; retries alone cannot report a laptop that remains off.

**Additional legacy item to remove from the launch checklist after an account-level confirmation:** the AEM priority/72-hour-pause instruction. The plan still repeats it, while the 2023 removal of manual web-event prioritization was documented contemporaneously. [Jon Loomer's firsthand walkthrough](https://www.jonloomer.com/meta-announces-big-changes-to-website-conversion-campaigns/) links Meta's notice. The official help page redirected to login during this audit, so this is not presented as a freshly verified account UI fact. Do not spend launch time hunting the legacy priority list or treating it as a blocker.

## 5. Work order

1. **Before spend:** close campaign loss-rule gates; use positive pre-flight verification; release the existing attribution/test-traffic fixes; configure and verify the fresh event economics, date, seats, creative links and campaign cap.
2. **First paid week:** inspect freshness and real tagged journeys, then read cumulative campaign economics alongside rolling alarms. Diagnose landing versus price versus payment losses. Preserve the chosen test budget rather than reacting to every small-sample ratio.
3. **Next maintenance pass:** silence accepted-decision learning pushes; remove `ads_volume`; display degraded optional reads; consolidate the current operating table. Preserve existing uncommitted work and record deployed revisions before further changes.
4. **After the event:** review fee-adjusted cash, venue balances, paid seats, new/returning customers and acquisition source. Compare the sales curve descriptively. Use that evidence to choose the next offer/creative/route test.

## Evidence limits

- All four supplied documents were reviewed, alongside related audit history and relevant local source/migrations.
- Production queries were read-only and aggregate/configuration focused; no customer names, phones or emails were exported.
- There is no paid campaign result yet. None of the CPA, CTR, creative, placement or offer assumptions has been validated on this account's paid traffic.
- No real checkout, ad publish, Pixel send, notification send or production write was performed.
- Agent Reach's Exa connection failed; built-in web search was used as fallback. Several Meta help searches returned no results and one help page required login. External claims are qualified accordingly. The Agent Reach update check also failed on DNS; no tooling was changed.
