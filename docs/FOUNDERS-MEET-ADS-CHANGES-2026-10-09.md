# Founders Meet — Phase 4 change list
**STOPPED BEFORE ACCOUNT CHANGES. No writes attempted. Everything below is a proposal, not work already applied.**

The live account **partly matches the plan**. Sales, Website, Purchase, dataset, highest-volume bidding, Advantage+ audience and paused status match. The campaign still has its old name and one-day-click attribution; non-Instagram placements and Relaxed effective safety filters remain. There are **no live ads or creatives**. Drafts and the required Page/Instagram identity could not be verified.

Read 9 October 2026, about 17:53 IST. Account1580469137074269; campaign120248398500750192; ad set120248398504180192. Only this account was read. The dataset is28370453785913523.

## A. Concrete changes with known current and wanted values
These are the two proposed field edits for approval. No editability/write test has been performed. If the build tool does not offer the exact setting, stop that row; do not substitute or create another ad set.

| ID | Field: now → to | Reference | Execution condition |
|---|---|---|---|
| C01 | Campaign name: `Founders Meet · Aug 30 · first test` → `Founders Meet` | Plan§5 | Campaign field `name`; status remains PAUSED |
| S07 | Attribution: `1-day click` → **7-day click +1-day engaged-view +1-day view** | Plan§2/§6 | Read field `attribution_spec` confirms current window; use exact supported write form only. If locked, owner-only. **Do not duplicate the ad set.** |

## B. Visible differences needing the owner's Ads Manager controls
These are not exact executable API instructions. The read connector does not expose the required edit controls. Wanted values are settled; no new business decision is proposed.

| ID | Field: now → to | Why not an automatic edit | Owner route |
|---|---|---|---|
| S10/S11 | Returned ages **18–65** → **hard minimum21, suggested22–40** | Only one age pair returned; strict and suggested ages cannot be distinguished | Ad sets → select existing ad set → Edit → Audience → Audience controls minimum21, suggested age22–40 if separately offered. **Do not set a hard maximum40 as a substitute.** Plan§6 |
| S18 | Requested Facebook/Instagram/Messenger/Threads; effective Facebook/Instagram/Threads → **Instagram only** | Placement editability/rollout unavailable | Existing ad set → Edit → Placements. If manual exclusion is offered, disable Facebook/Messenger/Threads/Audience Network; retain required Instagram spots. If removed, leave unchanged and report it—no value-rule workaround. Plan§6 |
| S21 | Effective `FACEBOOK_RELAXED, AN_RELAXED, FEED_RELAXED` → **Moderate** | Only effective values returned; no writable filter field shown | Existing ad set → Edit → Brand safety/suitability or Inventory filter → Moderate if offered. Plan§5 |

The `AN_RELAXED` filter is **not evidence of Audience Network delivery**: Audience Network is absent from both returned platform lists. These navigation labels follow the plan and familiar Ads Manager grouping; the current UI itself was not inspected.

## C. Three ads: creation is WAITING, not approved for building yet
The live ad and creative lists are empty. Drafts are unreadable, so first inspect Ads Manager drafts to avoid duplicating anything already staged.

Each ad needs selected eligible media, the real Page/Instagram identity and finished copy/area. New media uploads are owner-only; the launcher has no upload tool. No ad is certified eligible from a caption or missing metadata.

| Ad | Required selection |
|---|---|
| 1 | The proven reel, only if eligible and free of dates/old prices; organic results are not paid-ad proof |
| 2 | A different reason to attend: room experience or a past guest |
| 3 | A different person/situation, such as someone new to Chennai building alone, or a clear static |

For **each of the three**, the known settings change from **no live ad/creative →** the following (all 45 per-ad rows, including blocked fields, are in the comparison appendix):
- No date anywhere; idea + Chennai + venue area; real guest language.
- Price: `₹250 to book your seat online, ₹200 at the venue.`
- Headline: `Founders Meet · Chennai`; button: **Book now**.
- Destination: `https://chaptera.in/lifestyle` (host observed in dataset; plan supplies /lifestyle).
- Page **Join Chapter அ** + real Instagram account, not Page-backed Instagram.
- One image/video per ad; multi-advertiser ads **off**; all enhancements **off**, including automatic text/price rewriting.
- Status **PAUSED**.
- Literal URL parameters:
`utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.id}}&utm_content={{ad.id}}&placement={{placement}}&site_source_name={{site_source_name}}`

Existing-post captions may be immutable; an old date or price needs different media/new upload, not an invented caption override. Plan§7 technical checklist remains a manual eligibility check, not a claim newly verified by the lessons or connector.

## D. Exact questions / inputs still needed
1. **What is the fixed event date, and the exact booking-close time in IST?**
2. **How many seats should ads fill?** This sets the proposed limit at₹100 × that count; it does not authorize a write.
3. **What exact daily amount in rupees do you choose?** ₹100/day in the plan is an example. The account currently returns₹95.76/day; Phase0 returned a minimum₹96.73. These observations are not a request to raise spending or a prediction of delivery refusal.
4. **What venue area should appear in the creative?** City-wide targeting stays settled.
5. **Which existing reel/image IDs should be used for ads1–3, and what exact copy/guest wording should accompany them?** If they need uploading, do that manually first.
6. **Which real Instagram account should pair with Join Chapter அ?** In Ads Manager → existing campaign/ad set → ad Identity, confirm the Page/Instagram association and connector access. Empty tool lists may be a permissions issue, not an absent account.
7. **Keep the18 prior paid no-shows blocked, or should that group receive a separate owner-approved exception?** Current paid-phone block stays unchanged; this is plan§13's existing open question, not a proposal to remove the same-plan rebooking rule.
8. **Top-up ceiling:** still deliberately undecided. No answer is required for these initial non-money edits; nothing will top up automatically.

## E. Owner-only money, schedule and outside work
Money/schedule writes remain forbidden by the launcher even after figures are supplied. These are manual owner actions, not part of approval for sectionA.

| Item | Current reading / needed action | Owner route / plan |
|---|---|---|
| Campaign daily budget | ₹95.76 → owner's chosen fixed daily amount | Campaigns → select campaign → Edit → Budget; plan§4 |
| Campaign spending limit | Field absent, **not proven no limit** → ₹100 × seats once supplied | Campaign → Edit → campaign spending limit; plan§4 |
| Start/end | Start2026-08-21 16:24:40IST; end key absent → exact owner schedule | Existing ad set → Edit → Budget & schedule; plan§4. Reconcile seats ×₹100, daily pace and date; do not assume21 days always fits |
| Cost/ticket | Account tools cannot read it → ₹150 | Chapter admin Team → Performance → Per-Event Unit Economics → Your cost/ticket; plan§9.1 |
| Ticket pricing | Not read → ₹450 full/₹250 advance/₹200 venue | Event city pricing (`city_details`, not `price_full`); plan§9.2 |
| New date | Add to SAME `founders-meet`, never rename the old date | Event date/calendar editor; plan§9.3 |
| Calendar/site checks | Date discovery from/lifestyle; past+new dates and receipts; full-date view; already-booked behavior | Inspect website without making test bookings; plan§8/§9.3/§13 |
| Automatic event tracking | Flags not returned; do not infer OFF from empty event rules | Events Manager → dataset → Settings → Track events automatically without code OFF. Purchase priority only if list appears. UI/72-hour claims not re-authenticated here; plan§9.4 |
| Push device | Not readable | Keep founder device notifications on; plan§9.5 |
| Test bookings | No test-phone guard assumed | Avoid test bookings during ads; plan§9.6 |
| Morning checks | Only after eventual paused build | Review tags/enhancement/placement checks; no alert is not proof; plan§9 |
| Girls-Only show-up count | Not available through this account read | Owner's separate authorized database review of2026-10-04 `fully_paid`, not split-event attended_count; plan§3/§13 |
| No organic reels / reporting value | Owner policies retained | No organic reels during run; full ticket value at advance never reopened. Tagged sales and no organic posts are not proof of incremental sales |

## F. Unknowns that must not be described as matching
- **Drafts:** `This tool is new and is being gradually rolled out across ad accounts. Please check back at a later date. Ad account ID: 1580469137074269`. Owner must inspect draft changes; no repeated request to bypass this limitation.
- Gender, languages, interests, lookalikes, exclusions, bid/cost goal, spending limit and end time were absent or unsupported. **Absent is not empty, none, zero or default.**
- Six Instagram tokens returned: `stream,story,reels,explore_home,profile_feed,ig_search`. Check the intended Explore placement in the UI; do not silently assume `explore_home` equals every Explore surface. Keep Feed with Explore/search as plan requires.
- Limited spend on excluded placements: not readable; inspect Placements → advanced controls and switch OFF if offered.
- Geography:40km around returned coordinates13.0827,80.2707, primary_city_id1021534; city label not returned. Check it is the intended Chennai city-wide region. Residence types are `frequently_in,home`; try “living in” only if offered, accepting Meta widening as plan allows.
- Connector Page/Instagram lists were empty. Do not claim either identity is unlinked.
- Attribution model and tracking automatic flags not exposed. Dataset active; sampled last24h event URL was the bare site address. This is a bounded observation, not an audit of all tracking or a finding of a broken server sender.
- Special category/A-B controls are not specified by current rev4.1 and were not verified. Do not invent a category or experiment setting.

No second account read was run: unsupported fields, unavailable drafts and empty permission-limited identity lists require UI/capability resolution, not a repeated blanket read.

For the remaining unreadable settled controls, manually inspect the existing ad set → Audience: all genders, languages blank, interests/lookalikes/exclusions none; and Conversion/performance: cost-per-result goal empty. Inspect only first; do not treat the connector's absent keys as proof a change is needed. If already correct, leave them unchanged.

## G. Lesson reconciliation and completeness
**97/97 requested source items accounted for:**35 NOT A SETTING;11 IN SYNC;40 OUR DECISION;11 CONTESTED;0 APPLY. These are repeated source-item counts, not97 independent claims. IN SYNC describes the plan, not the unbuilt live ads. The separate matrix lists non-settings, channel counts, plan sections, stale-source corrections and fitting ideas not explicitly adopted (discount economics, optional cut rules and exact observed-CPA heuristics).

**107/107 settings/checks have a disposition:**2 CHANGE;3 CHANGE-CONDITIONAL;10 MATCH;10 UNKNOWN;42 WAITING;25 OWNER-ONLY;15 READ-ONLY. Coverage:4 campaign +7 money/schedule/minimum +22 adset +45 per-ad +14 outside +15 secondary.
- Co-manager **AGREED**, no blocking disagreement. Accepted updated one-read Phase3 and guard/manual distinction.
- Documentary verifier confirmed all five candidates (coverage, no new APPLY controls, stale creative rows, causal-interpretation caution, READY not approval).
- Account discrepancy verifier **CONFIRMED all 11 candidates F1–F11**, with the stated unknowns/editability/scope caveats retained. See [verdicts](working/2026-10-08-fm-account-verification.md).

## H. Run record and stop
- One connection test from Phase0; one full blind account snapshot in Phase3; no build launcher.
- **WRITE CALLS ATTEMPTED:0.**
- **REFUSED BY GUARD:1:** `REFUSED by chapter-ads guard: tool mcp__meta-ads__ads_experiment_list_tests is not on this run's list`. A read tool was attempted outside the launcher's allowlist. It was blocked, not retried or replaced to evade the guard.
- Draft rollout error above; oversized field-context response handled with named read fields. Full field-context absence is not proof fields cannot exist in another UI/tool.
- Audience description urged an exclusion; tool prose urged opportunity checks/lift studies/next-actions. None was treated as authorization.
- Campaign/ad set both PAUSED; maximum-range metric replies returned0INR spent. An omitted metric on another call is not contradictory nonzero. No claim beyond the returned range.
- Phase0 minimum came from raw account listing; Phase3 minimum field not exposed. Both recorded without pretending a second independent minimum confirmation.
- Stop at Phase 4. **No account change before Krutesh's “go” on this list.** That authorization covers only explicitly approved rows, never activation, money/schedule changes, new campaigns/ad sets or guessed missing values.

## Evidence and appendices
- [Settings sheet](working/2026-10-08-fm-settings-sheet.md)
- [Full 97-item lessons matrix](working/2026-10-08-fm-lessons-matrix.md)
- [All 107 wanted/live/draft comparisons](working/2026-10-08-fm-manager-comparison.md)
- [Preserved account reader output and RAW READINGS](working/2026-10-08-fm-account-reading.md)
- [Co-manager agreement](working/2026-10-08-fm-plan-review-notes.md)
- Raw log: `working/ads-runs/2026-10-09T175145-read-fm-phase3-blind-snapshot.jsonl`.
