# Meta opportunities — what Meta's docs offer that we have not built (Part B)

Cloud audit session, 2026-09-24. Repo snapshot `782b6c8` on `cloud/meta-audit`. Companion report: `CLOUD-META-AUDIT.md` (defects in what exists). Method and team log: `CLOUD-META-AUDIT-PROGRESS.md`.

Every idea below was read in Meta's own docs, checked against the code to prove we do not already have it, checked against every earlier decision in `META-AUDIT-CONTEXT.md` and `META-ADS-HANDOFF.md`, and then handed to a separate verifier whose only job was to argue it does not apply to us. Only ideas that survived are in the main list.

Nothing here is launch advice. Every item is either something to build before or alongside ads, or a decision that belongs to you.

---

## The short version — five worth your attention, in order

1. **A guard against Meta quietly changing your ads (brand protection).** Meta switches some "creative enhancements" on by default for every new ad unless told otherwise: automatic image touch-ups and crops, auto-written descriptions, showing a stranger's "relevant comment" under your ad, and placing your ad in a shared strip next to other brands' ads. Nobody at chapter அ would have chosen these for a curated club. We already built one pre-flight check that reads every ad before it spends (the `{{ad.id}}` check); this is a second check in exactly the same place that pushes you a notice when one of these is on. Small build, zero running cost, works before any money moves. (**OPP-1**)
2. **Check that the browser and server copies of each sale actually pair up.** The same Meta call you already approved for recording match quality (handoff §13 item 2) also returns "event coverage" and "deduplication key" numbers — whether Meta sees the Pixel's Purchase and Lead as the same events our server sends. This exact number once caught a real bug here (Lead coverage stuck at 33% because the open-event flow sent no event id). Nothing watches it today. Add two fields to the build you already said yes to. (**OPP-2**)
3. **A decision before creator commissions and ads run together.** Today, one booking can be counted as an ad sale in the ROAS numbers *and* pay a creator commission — for example, someone first clicks your ad, later comes back through a creator's link and pays. Creator commissions are switched off everywhere right now, so no money is at risk yet. The question is what you want to happen when both are on. (**OPP-10**, needs your decision)
4. **Stop Meta widening your retargeting audiences.** When you eventually run an ad aimed only at "people who saw the price and didn't buy", Meta's default settings (Advantage+ audience, plus a separate "audience expansion" switch) let it show that ad to anyone it likes, turning retargeting into prospecting without saying so. The fix is two settings when the ad set is created, plus an automatic warning in the checks we already run. (**OPP-3**)
5. **A retargeting pool that doesn't depend on website cookies.** Meta can currently match only about 1% of site visitors into audiences (handoff §19). An audience of people who engaged with the "Join Chapter அ" Facebook Page — including people who interacted with your ads — is built from Meta's own logged-in data, so it doesn't have that ceiling. One-off creation in Ads Manager; nothing to build. (**OPP-4**)

Counts after verification: **9 VIABLE, 7 NEEDS YOUR INPUT, 6 already on file, 20 not viable** (43 candidates from 9 researchers; two duplicates merged).

---

## Viable opportunities (ranked by value to this business)

### OPP-1 — Creative-enhancement guardrail (pre-flight check for defaults nobody chose)
**Verifier verdict: VIABLE — value medium.** (B5a-1)

**What it is.** Every Meta ad creative carries a settings block listing which AI and automation features are on for it. Several are documented as switched ON unless the ad says otherwise. A daily read of that block (in the same call that already reads the `{{ad.id}}` tag) could push a notice when one you did not choose is on.

**Why it helps us.** A curated club sells trust. A stranger's comment shown under your ad, an automatically cropped or touched-up photo, or your ad sitting in a strip beside other advertisers are brand decisions made by a default, not by you. This is the same pattern as the Audience Network and Threads defaults already found and watched (handoff §10, §23 "Reels Ads").

**The docs.**
- `docs/meta-marketing-api/api-reference/25 Linked pages not in the sidebar/ad-creative-features-spec.md:17` — `adapt_to_placement` … "This feature is labeled 'Image touch-ups' in Ads Manager. **Default is opt-in.**"; `:23` `description_automation` "Default is opt-in."; `:36` `inline_comment` "Opt in/opt out of Relevant comments enhancement. Default is opt-in."
- `docs/meta-marketing-api/guides/04 Ad Creative/26 Multi-advertiser Ads.md:13` — "Ads created on or after August 19, 2024 that do not specify the `enroll_status` field will be opted into multi-advertiser ads by default."
- `api-reference/25 …/ad-creative-degrees-of-freedom-spec.md:17` (`creative_features_spec`), `ad-creative-feature-details.md:89` (`enroll_status` = `OPT_IN`/`OPT_OUT`), `api-reference/05 Ad Creative/01 Overview.md:267,269` (`contextual_multi_ads`, `degrees_of_freedom_spec` are fields on the creative).

**Proof we don't have it.** `grep -rn "degrees_of_freedom_spec\|creative_features_spec\|contextual_multi_ads\|inline_comment\|adapt_to_placement"` over the whole repo outside `docs/` → 0 hits, including every handoff. Nearest code: `supabase/functions/meta-ads-sync/index.ts:1482-1499` (`CREATIVE_FIELD_SHAPES`, the creative read the `{{ad.id}}` check uses).

**What we'd need first.** Nothing from Meta beyond today's `ads_read` token (the fields sit on the object we already read — not yet proven live; there is no creative to test against). Your own list of which features you consider unwanted — the push should fire only on your list.

**Build size: small–medium.** Touches `meta-ads-sync` (the creative read), a new migration beside `20260918_meta_ad_creative_tracking_tags.sql`, and one line in Growth ▸ Ads. Redeploy `meta-ads-sync` with `--no-verify-jwt`. Verifier's corrections, which matter:
- Add the two fields as a **new first rung above** the existing `'full'` shape, not inside it. If Meta refuses a field, the fallback ladder steps down and would silently drop `asset_feed_spec` from today's `{{ad.id}}` check (`meta-ads-sync/index.ts:1542-1549`).
- Treat a feature as enrolled when its setting is **absent or not `OPT_OUT`** — the doc says absent means on.
- Leave "music" out: the docs never state its default.

**Risks / reasons to wait.** Zero creatives exist, so it reports nothing until the first ad is made. Fixing a flagged ad means a new ad (creatives cannot be edited), which restarts learning — which is exactly why the check should run on paused ads before anything spends.

### OPP-2 — Event coverage and deduplication-key readings, added to the approved match-quality history
**Verifier verdict: VIABLE — value medium-high.** (B3b-1)

**What it is.** The Dataset Quality API call you approved on 2026-09-21 (handoff §13 item 2, store EMQ daily) also returns: *event coverage* (the share of Pixel events that Meta could pair with a server event) and *dedup key feedback* (which key did the pairing). §13 item 2 plans to store only the match-quality score, key coverage and data freshness.

**Why it helps us.** Pairing is the one quality measure that has already caught a real silent bug in this codebase: `src/AppFlow.tsx:1218-1221` records that the open flow's browser Lead "arrived with no event_id at all … which is what held Lead event coverage at 33% against Meta's 75% guidance". Nothing checks pairing automatically today — the watchdog compares counts, not pairing. The audit also found a new pairing gap (audit finding A-2 in `CLOUD-META-AUDIT.md`: returning open-event applicants).

**The docs.** `docs/meta-marketing-api/conversions-api/11 Dataset Quality API/01 Dataset Quality API.md:314` — "Event coverage is the 7-day average percentage of Meta Pixel events that are covered by the Conversions API, and share deduplication keys with events from the Conversions API"; `:348` `"goal_percentage": 75`; `:409` "The deduplication key feedback shows the percentages of events from the Pixel and the Conversions API that were received with each deduplication key."

**Proof we don't have it.** `grep -rn "event_coverage\|dedup_key_feedback\|dedupe_key_feedback" supabase/ src/` → 0 hits; the handoff never mentions event coverage.

**What we'd need first.** Nothing new — same call, same access (proven working 2026-09-21, handoff §27.1).

**Build size: small, in the same change as §13 item 2.** Touches `supabase/functions/meta-signal-watchdog/index.ts`, the §13-item-2 history migration, optionally the Growth ▸ Ads card. Corrections from the verifier: the field is spelled `dedupe_key_feedback` in Meta's example requests (`:422`) but `dedup_key_feedback` in its field table (`:101`) — use the request spelling or try both. Alert only on Purchase and Lead and only on a sustained drop; the five browser-only events will read near zero forever by design. Store the "Additional Conversions Reported" and named diagnostics raw, never alert on them.

**Risks.** At 6–12 purchases a month many 7-day windows will be thin or empty; state that once on the chart rather than hiding it.

### OPP-3 — Keep retargeting audiences from being widened by Meta
**Verifier verdict: VIABLE — value medium.** (B1-4)

**What it is.** Two defaults would quietly turn a retargeting ad set into prospecting: `advantage_audience` (defaults on for new ad sets since v23, and treats an included custom audience as a suggestion) and `targeting_relaxation_types` (audience "expansion" for custom and lookalike audiences, on by default).

**Why it helps us.** The §19 audience design builds three disjoint retargeting tiers so each can carry its own message and its own cost per ticket. If Meta widens them, those per-tier numbers mean nothing, and nothing would tell you.

**The docs.** `guides/07 Audience Guides/15 Targeting Guides/08 Advantage Targeting Guides/01 Advantage Targeting.md:12` — "`targeting_relaxation_types` … indicates opt-in lookalike and custom audience expansion"; `05 Advantage Custom Audience.md:9-12` — "Campaigns with supported objectives are enabled by default … To opt out, set the `custom_audience` parameter within `targeting_relaxation_types` to `0`"; `02 Advantage+ Audience.md:7` (only location, minimum age, language and custom audience *exclusions* are not expanded) and `:14` (`advantage_audience` "defaults to `1`").

**Proof we don't have it.** `grep -rn "targeting_relaxation"` over the handoffs, `supabase/` and `src/` → 0 hits. The live ad set runs `advantage_audience: 1` (handoff ~1971).

**What we'd need first.** Nothing. Setting it is an Ads Manager step you do when creating a retargeting ad set.

**Build size: small.** One line in the §19 "How to create one" runbook — set `advantage_audience: 0` **and** `targeting_relaxation_types: {custom_audience: 0, lookalike: 0}` on retargeting ad sets, then read back — plus a warning in the existing `meta_adset_audience_warnings()` (`supabase/migrations/20260911_meta_audience_layer.sql:474`) when an ad set includes a §19 retargeting audience while either is on. Unverified: whether Meta echoes `targeting_relaxation_types` in the stored `targeting` — check with `SELECT adset_id, targeting FROM meta_adset_config;`.

**Risks.** None; no retargeting ad set exists yet, which is why now is the time to write it down.

### OPP-4 — Facebook Page engagement audience
**Verifier verdict: VIABLE — value medium.** (B1-1)

**What it is.** A custom audience of people who engaged with the "Join Chapter அ" Page (1201531216384934), its posts or its ads, kept up to 730 days and prefilled from history on creation.

**Why it helps us.** §19 found Meta can place only about 1% of our site visitors into website audiences, because mid-funnel browser events are anonymous. A Page engagement audience comes from Meta's logged-in side and does not have that ceiling. Because every ad runs under this Page, people who engage with your ads join it automatically.

**The docs.** `guides/07 Audience Guides/07 Engagement Custom Audiences.md:10` — "When you first create this audience, Facebook prefills the audience with a list of people who already engaged with your Page in the given retention period"; `:90` `page_engaged` "People who visited your Page or engaged with any of your Page's content or ads, on Facebook or Messenger"; `:198` "Page: 730 days".

**Proof we don't have it.** No `page_engaged`, `page_visited`, `page_post_interaction` anywhere outside `docs/`. The audience registry cannot even hold it: `supabase/migrations/20260911_meta_audience_layer.sql:148` accepts only our Pixel as a source.

**What we'd need first.** A founder check of how active the Facebook Page actually is (the business is Instagram-first, so the prefill may be small). Creation is one step through the Meta Ads MCP or Ads Manager — the reporting system user does not hold the Page (handoff ~121), so not from an edge function. Pair it with OPP-3: under `advantage_audience: 1` an *included* audience is only a suggestion.

**Build size: none to small.** The existing daily `record_audience_snapshot()` already records every audience on the account, so its size and drift are tracked automatically once it exists. Use a separate registry key rather than loosening the "our Pixel only" rule.

**Risks.** Weaker intent than the §19 funnel tiers; Meta shows sizes below 1,000 only as a floor (§19).

### OPP-5 — Show "clicked on Meta" above "landed on our site" in the funnel
**Verifier verdict: VIABLE (reframed) — value medium.** (B4-1)

**What it is.** A row showing Meta's link clicks per ad directly above our own "Landed" count, so the gap — people who clicked but never saw the page — is visible per ad.

**Why it helps us.** Mobile-first Indian traffic on slow networks and in Instagram's in-app browser loses people between the click and the page. Today nothing separates "the ad failed" from "the page never loaded".

**The docs.** `docs/meta-marketing-api/api-reference/25 Linked pages not in the sidebar/ads-action-stats.md:55` (`landing_page_view` action type); `api-reference/02 Ad Account/45 Insights.md:339` (`landing_page_view_per_link_click`).

**Proof we don't have it.** Both halves exist but are never put side by side: link clicks per ad come from `get_meta_ads_performance` (`supabase/migrations/20260917_meta_ads_enough_tickets_to_judge.sql:167`), our own "Landed" from `get_meta_ad_funnel` (`20260907_meta_ad_funnel.sql:41`, `:136`), rendered in two separate tables (`src/AdminPanel.tsx` ~11435 and ~11497-11580). `grep -rn "landing_page_view" supabase/ src/` → 0.

**What we'd need first.** Nothing. The data is already stored; `meta_ad_daily.actions` keeps Meta's raw actions array, so Meta's own landing-page-view count is also available from history.

**Build size: small.** A new version of `get_meta_ad_funnel` with a "Clicked (Meta)" row, and the panel card. No sync change, no redeploy. Backfillable.

**Risks.** Clicks and sessions are different units (one person can click twice) — label the ratio. Reads empty until ads spend.

### OPP-6 — Show the ad quality rankings we already store
**Verifier verdict: VIABLE — value low now, medium at scale.** (B4-2)

**What it is.** Meta's quality, engagement-rate and conversion-rate rankings per ad are already fetched and written to `meta_ad_daily` every day (`meta-ads-sync/index.ts:312-314`, `:1947-1949`), but no report or panel ever reads them.

**Why it helps us.** It is the one "why" signal that separates a creative problem from a price or targeting problem.

**The docs.** `api-reference/25 …/ad-report-run/insights.md:173, :240, :337` (field names only — the repo has no doc describing what the grades mean or when Meta starts grading).

**Build size: small.** Add the latest graded value per ad to `get_meta_ads_performance`'s per-ad output and show it, labelling `UNKNOWN` as "not graded yet". No new fetch.

**Risks.** Every value will read UNKNOWN until real spend.

### OPP-7 — Ad account activity log (who changed what, including Meta)
**Verifier verdict: VIABLE — value low-medium.** (B8-2, merged with B4-4)

**What it is.** Meta's account history: every budget, status, targeting and review change with who made it and when, plus billing charges, declines and spend-limit changes.

**Why it helps us.** Our delivery-settings history records *when our daily sync noticed* a change, not when it happened or who made it. The log also shows changes **Meta made on its own**, which matters given the rule never to auto-apply Meta's suggestions (M11).

**The docs.** `api-reference/04 Ad Activity.md:7` ("returns one week's data by default. Information returned includes major account status changes, updates made to budget, campaign, targeting, audiences"), `:27` (event types incl. `ad_account_billing_decline`, `ad_account_update_spend_limit`, `ad_account_add_user_to_role`); `developer-docs-html/Ads MCP Server.html` (txt:27) "Activity logs … mirroring the Ads Manager campaign history page".

**Proof we don't have it.** No `/activities` call anywhere in `supabase/` or `src/`; never considered in the handoff.

**What we'd need first.** One read-only check to settle access and history length: `ads_account_get_activity_logs(ad_account_id="1580469137074269", start_time=<90 days ago>)`. The researcher's "lost after a week" urgency did not hold: the doc says one week *by default*, and the Meta Ads MCP tool defaults to three months back.

**Build size: small-medium.** You can already read it on request through the Meta Ads MCP with nothing built. For an automatic record: one daily read inside an existing Meta job into a change-only table, shown on the page, no push by default (matching your "show it on the page, no alerts" choice for delivery history).

### OPP-8 — Keep Meta's promise next to each recommendation
**Verifier verdict: VIABLE (reshaped) — value low.** (B4-5)

**What it is.** When Meta sends a recommendation, also store Meta's own estimate at that moment (`lift_estimate`, `opportunity_score_lift`) so the existing recommendation scorecard can show "Meta promised X; our cash showed Y".

**Why it helps us.** It strengthens the rule never to auto-apply recommendations (M11) by putting Meta's claim next to the real outcome. Recommendations expire, so the at-arrival estimate cannot be recovered later.

**The docs.** `guides/11 Best Practices & Recommendations/02 Performance Recommendations API.md` (field table ~128-150; `recommendation_content` "to include the `lift_estimate` and `body` strings, which are omitted by default"; ~:142 recommendations expire). The researcher's suggested fields (`importance`, `estimated_impact`, `blame_field`, from the webhook guide) are **not** in the endpoint reference — asking for a field that doesn't exist fails the whole call (`meta-ads-alerts/index.ts:52-54`).

**Build size: small.** Store the snapshot silently (no push) beside the webhook row; extend the scorecard RPC.

### OPP-9 — Label our custom audiences for Meta
**Verifier verdict: VIABLE — value low.** (B8-4)

**What it is.** A new field (April 2026) that tells Meta what a customer list is, e.g. `CUSTOMERS` or `HIGH_VALUE_CUSTOMERS`.

**The docs.** `guides/13 Version Changelogs/03 Out-of-Cycle Change Index/04 2026.md:148-156`; `guides/07 Audience Guides/03 Customer File Custom Audiences.md:55`.

**Build size: small.** The three existing audiences never reach the create call again, so the useful change is one line in the §19 creation recipe (the Meta Ads MCP create tool already accepts `audience_labels`). The docs disagree on value case and on string-vs-array — test on a throwaway audience first. No measured benefit.

---

## Needs your input

### OPP-10 — Should a sale that came from an ad also pay creator commission?
**Verifier verdict: NEEDS-OWNER-INPUT — value medium.** (B9-4; the trace was re-checked line by line)

**What happens today.** A booking stores the ad it came from (`attribution.utm_content`, stamped on first submission — `src/AppFlow.tsx:580`, `:2220`) and, separately, a creator (`affiliate_code` → `affiliate_id`, `src/AppFlow.tsx:577`, `:2215`). Creator commission is paid on `affiliate_id` alone (`accrue_affiliate_sale()`, `supabase/migrations/20260829_multi_ticket_commissions_and_finances.sql:13-56`, per migrations); ad credit is counted on `utm_content` alone (`20260916_meta_ads_true_roas_net_of_fees.sql:50-55`). Neither looks at the other. For open events the creator is re-set at payment time (`attribute_open_application()`, `20260704_affiliates_functions_and_triggers.sql:113-141`), so someone who first clicked an ad and later returns through a creator's link counts as an ad sale **and** pays the creator — no special link needed. The handoff's per-ticket profit working assumes this doesn't happen ("an ad-sourced ticket normally carries none", `META-ADS-HANDOFF.md` ~3860).

**Why no money is at risk now.** Creator commissions are switched off on every event (`AFFILIATE-LINKS-HANDOFF.md:28`, "built, deployed, but DORMANT").

**The question.** Before switching creator commission on for any event that also runs Meta ads, when a booking has both an ad click and a creator link, do you want to: (1) pay the creator and count it as an ad sale (today's behaviour); (2) pay the creator but take it out of ad ROAS; (3) not pay creator commission on ad-sourced bookings; or (4) keep both but subtract the creator commission in the ad profit numbers?

**Read-only checks.** `select count(*) from applications where affiliate_id is not null and attribution->>'utm_content' ~ '^[0-9]{6,}$';` and `select slug from events where affiliate_enabled;`

### OPP-11 — Catalog health readings, once you create the catalog
**NEEDS-OWNER-INPUT — value medium (diagnostics) / low (match stats).** (B2-2, B2-1)

Meta's own verdict on catalog items after it ingests the feed: `MUST_FIX` issues such as `POLICY_VIOLATION` and `IMAGE_QUALITY` (`api-reference/22 Product Catalog/18 Diagnostics.md:91-97`), Dynamic Ads checks (`15 Da Checks.md:9`), and whether Pixel product ids matched catalog items (`20 Event Stats.md:9-11`). Our own readiness check cannot see Meta-side rejections, and the handoff already records that an undersized catalog image "produces NO error, it just never delivers" (§23 ~6140). **Gated on your §20 decision to create the catalog and connect the Pixel.** Cheapest first step then: route the `product_set_issue` webhook field we already receive but never read (`meta-ads-alerts/index.ts:381`) and add a daily diagnostics read to the watchdog. Also needed: the reporting system user assigned to the catalog, and a real call to confirm `ads_read` can read it.

### OPP-12 — Value-weighted lookalike
**NEEDS-OWNER-INPUT — value low-medium.** (B1-3)

A lookalike seeded with each customer's value (`guides/07 Audience Guides/06 Value-Based Lookalikes.md:7, :15, :29, :63`), so Meta weights toward people who resemble your best and repeat customers. The handoff decided the lookalike seed should be "people who came" (`META-ADS-HANDOFF.md` ~4410-4413, §13 item 5). **Question:** keep that rule and add value weighting (lifetime paid, repeat count) to a `customers_completed` seed once it reaches ~100, or override it and seed from everyone who paid now, with no-shows weighted 0? Needs a new value-based audience (existing ones can't be converted), a schema change in `meta-audience-sync`, and a separate Terms acceptance per ad account.

### OPP-13 — WhatsApp marketing messages as an ad placement, or at least a watch for it
**NEEDS-OWNER-INPUT — value low (as a channel), low-medium (as a watch).** (B5b-3)

Meta can send paid promotional WhatsApp messages from your number as an ad placement (`guides/04 Ad Creative/11 Marketing Messages.md:9`), and `:102` says "With Advantage+ placements, marketing messages are added automatically for eligible campaigns." **Question:** do you ever want this? It needs onboarding and a marketing opt-in you do not collect, and an unsolicited paid broadcast is a brand risk. If not, the placement watch should at least be able to see it — see audit finding A-14 (and A-6) in `CLOUD-META-AUDIT.md`.

### OPP-14 — Creator partnership ads
**NEEDS-OWNER-INPUT — value low.** (B9-1)

Ads that run from a creator's own handle, boosting their post or using their testimonial (`guides/04 Ad Creative/14 Partnership Ads/…/06 Testimonial Ads.md:7`; `…/01 Boost Existing Instagram Media as Partnership Ads.md:7`). Made in Ads Manager, nothing to build, and the existing `{{ad.id}}` check already covers these creatives. **Question:** will you ask creators to publish their video as a labelled paid-partnership post or send an ad code — extra creator work you earlier chose not to ask for (`CREATOR-TASKS-HANDOFF.md:64-65`)? Note the handoff records that most creator Reels (trending audio) cannot be boosted (§23 ~5903-5910), and creators' submitted videos can already run as brand media under creator terms §11. Decide OPP-10 first if you do.

### OPP-15 — Optimise for profit instead of ticket value (far future)
**NEEDS-OWNER-INPUT — value low.** (B3a-2)

Sending a profit figure alongside the Purchase value (`conversions-api/13 Guides/11 …Value Optimization for Profit/01 Overview.md:5-7, :61-66`). Needs at least 100 conversions a week, real `cost_per_ticket` on every plan (two are ₹0 today, handoff ~3884), and it would put each booking's profit into the browser Pixel for anyone to see. It also touches what Meta is told, which is your decision (§21.1). Nothing is gained by building early.

---

## Already built (docs describe it; we have it)

| Capability in the docs | Where we already have it |
|---|---|
| Value + currency on every Purchase (value optimisation's technical requirement) | `supabase/functions/_shared/metaCapi.ts:525-526` |
| `bid_strategy`, `optimization_goal`, delivery settings read and tracked with history | `meta-ads-sync/index.ts:1163-1164`, `supabase/migrations/20260917_meta_delivery_settings_history.sql` |
| Customer File custom audiences | `supabase/functions/meta-audience-sync/index.ts` (3 audiences) |
| Website custom audience registry with drift tracking | `supabase/migrations/20260911_meta_audience_layer.sql` (§19) |
| Product catalog feed + readiness | `supabase/functions/meta-catalog-feed/index.ts`, `20260911_meta_catalog_readiness.sql` (§20) |
| `content_ids`/`content_type` on every product event | `src/supabase.ts` PIXEL_EVENTS, `_shared/metaCapi.ts:540` |
| Recommendation type/message scored against our cash | `20260907_meta_recommendation_scorecard.sql` (Layer 5) |
| Raw `actions` array kept for later questions | `20260907_meta_ad_daily_richer_metrics.sql:15-22` |
| Insights feature settings (opt-in breakdowns) | `supabase/functions/meta-insights-features/index.ts` |
| Performance recommendations read-only, never applied | Layer 5, M11 |
| Ad account on IST, spend in major units, 28-day restatement lookback | `meta-ads-sync/index.ts` ~286-366 |

## Already considered (decided earlier — not re-proposed)

- Partnership lead forms, Lead Ads, Instant Forms, Conversion Leads — **M12**.
- Click-to-WhatsApp / Messenger / Instagram-DM ads and their reporting — **M13**.
- Threshold rules / rules engine, split tests and lift, reach estimates, MMM, block lists, batch APIs, ETags — **M1, M4, M3, M5, M6, M7, M8**.
- Auto-applying recommendations incl. "automatic placements" — **M11**; would also undo your 2026-09-18 Audience Network OFF (handoff §10).
- Programmatic ad creation / higher API tier — **M9**; Full-tier question already with you (§23 "Authorization").
- Plain lookalike from `customers_completed` — **§13 item 5**; OPP-12 is the value-weighted variant.
- Age/gender breakdowns — **§13 item 6**. Campaign/ad-set rollup (incl. per-creator via one ad set per creator) — **§13 item 4**. Creative fatigue in the panel — **§13 item 3**.
- Product sets by the feed's custom labels, product audiences, the catalog itself — **§20 "Deliberately not built"** (and see audit finding A-8 on custom labels).
- Collection ads — behind the same §20 catalog gate.
- Instagram engagement and video-viewer audiences — already in `meta-ads-plan.md:104-107`, blocked on confirming the Instagram account is linked (§24 checklist ~6416). When built, use up to 730 days, not 365.
- Account balance / spend cap / minimum daily budget guardrail — **§23 "Get Started" (2026-09-18)**: spend-limit and billing stops already show as `blocked` / `PENDING_BILLING_INFO`.
- Parameter Builder / IPv6 — **§27.3**. Append Attribution — **§27.6**. EMQ history — **§13 item 2** (OPP-2 adds to it).
- Ad Library API for competitors — **§25.5**.
- Data Processing Options / LDU — US-states only (`guides/02 About Marketing API/04 Data Processing Options.md:35`); **§23 Pixel review**. India's DPDP consent question stays with a lawyer (§23).

## Not viable (one line each)

| ID | Idea | Why not |
|---|---|---|
| B2-4 | Choose the `destinations` (travel) catalog vertical | Most plans are experiences, not places; destination ads assume Search and travel dates we don't have; would break the verified slug-to-product match. |
| B2-5 | Category collages for catalog ads | Grouping must use brand / product type / Google category, all constant in our feed; needs ≥4 values; prospecting format the §20 brand opinion rejects. |
| B3a-1 | Read AEM v2 goal eligibility | App-campaign endpoint (`app_id` required) on a stub page; web AEM needs no setup any more. |
| B3a-3 | Predicted lifetime value | No validated model; repeat buying ~1 in 7; needs 100 Meta-attributed conversions/week for 4 weeks; contradicts "must pay for itself now". |
| B3a-4 | Value rules (bid by age/gender/place) | Settled: "no demographic budget shifting yet" (handoff §26 ~7132); otherwise a write or launch advice. |
| B3a-5 | Cost cap / bid cap / min ROAS | Campaign configuration; `bid_strategy` already tracked; min ROAS blocked by the §9 volume problem. |
| B3b-2 | Report venue attendance as an in-store event | §21.1/§21.4: no-shows are "not a reason to change what Meta is told" until the no-show-by-source check runs; `attended_count` only means attendance on pay-at-venue events; "physical store" would be inaccurate. |
| B3b-3 | Extra Pixel diagnostic endpoints as watchdog checks | Stub pages with undocumented responses; catalog-only or partner-oriented; overlaps what's built. One-off probe at most. |
| B3b-4 | Pixel domain allow/block rule | Documented edge is read-only; setting it is undocumented and a write; `pixel_config` already watches the harm. |
| B5a-2 | Per-asset insights for dynamic creative | Contradicts §23 "Dynamic creatives: Avoid"; per-asset rows can't join to our cash. |
| B5b-1 | Facebook Event ads | Nothing to build; needs a public Facebook Event per plan with a "Going" list, which doesn't fit an invite-only club. |
| B5b-2 | Website ads with a WhatsApp footer button | Duplicates the site's tracked doubt → WhatsApp route (`src/AppFlow.tsx:1829`) with an untracked one. |
| B5b-5 | Per-card carousel breakdown | Meta strips the card value from off-site conversions (Insights Breakdowns, Type 2); our per-plan join already answers it. |
| B5b-6 | Multi-media ads, one link per image | Contradicts your decision that every ad lands on `/lifestyle` (handoff ~2983). |
| B5b-7 | Profile-visit ads | No join to spend or tickets (handoff ~5220); would trip the `untagged_spend` guardrail. |
| B5b-8 | Instant Experiences | Adds a Meta page before the site; blinds the `{{ad.id}}` check; needs Page scopes. |
| B8-1 | Daily business-level access audit | Business edges likely unreadable on the Limited tier with `ads_read`; empty-list trap (§9); ad-account half is covered by OPP-7. |
| B8-3 | Read ad labels | Built for accounts with thousands of ads; no evidence you label; §13 item 4 covers grouping. |
| B8-5 | Publisher delivery report | Needs the `brand_safety_third_party_partners` capability (same App Review class as M6); only covers in-stream/Audience Network, which is off. |
| B9-2 | Partnership Ads advertisable-content API | Paid-for copy of the free Partnership Ads Hub screen; new scopes; your creators don't publish tagged posts. |

Nine planted non-ideas were also given to the verifiers (one per batch) and all nine were rejected — see the team log in `CLOUD-META-AUDIT.md`.

---

## What would have to be checked live

These cannot be settled from the repo; each is a read-only check for a later session:
- OPP-1: `ads_get_creatives` with fields `degrees_of_freedom_spec,contextual_multi_ads` on the first creative that exists.
- OPP-2: `ads_get_dataset_quality` on dataset `28370453785913523` — confirm `event_coverage` and `dedupe_key_feedback` come back.
- OPP-3: `SELECT adset_id, targeting FROM meta_adset_config;` — is `targeting_relaxation_types` echoed?
- OPP-4: the Page's organic size (founder, in Meta Business Suite).
- OPP-7: `ads_account_get_activity_logs` for the ad account, 90 days back.
- OPP-10: the two `select`s above.
- OPP-11: once a catalog exists, `ads_catalog_get_diagnostics` and a `GET /<catalog_id>/diagnostics` with the stored token.
- OPP-13: `GET act_1580469137074269?fields=marketing_messages_settings{whatsapp_activation_status}`.
