# Meta integration audit — is what we built set up correctly? (Part A)

Cloud audit session, 2026-09-24 to 2026-09-26. Repo snapshot `782b6c8` on `cloud/meta-audit` (squashed history: handoff commit hashes don't resolve here, and git cannot tell what is live — "live" below only where `META-ADS-HANDOFF.md` says so). Companion report: `CLOUD-META-OPPORTUNITIES.md`. Method, plan and status: `CLOUD-META-AUDIT-PROGRESS.md`.

Sources: our code, and Meta's own docs saved in the repo under `docs/meta-marketing-api/` (Marketing API guides and reference, the Conversions API set, the Pixel set, and saved developer pages). Nothing was fetched from the internet and nothing live was touched. SQL is described "per migrations" — the live database may differ.

---

## Plain-English summary

**What's solid.** The foundations are in good shape, and almost everything the docs require is already done, often more carefully than the docs ask:
- The browser Pixel and the server copy of each sale and application pair up correctly, use the same ids and names, and send identity details in the format Meta specifies.
- The webhook receiver checks Meta's signature properly.
- The spend sync keeps deleted ads and waits out Meta's 28-day correction window.
- Rate limits are respected, audience uploads are hashed exactly as Meta asks, and the catalog feed never tells Meta "everything is gone" by mistake.

**Nothing HIGH was found.** No finding loses or corrupts conversion or spend data today in a way that could break payments or ads.

**What's broken or weak** (six MEDIUM items; three confirmed, three waiting on a live check):
1. **A sale can silently fail to reach Meta and is never retried** (A-1). If Meta's servers hiccup at the wrong moment, that sale never reaches Meta. The payment-rescue job is the path most exposed, because it runs once per payment.
2. **Returning open-event applicants add extra, unpaired "Lead" events** (A-2). Someone who comes back to finish an unpaid open-event booking makes the browser report a new Lead that can never be matched to the server's copy. That inflates Lead counts.
3. **The daily audience update would keep resetting Meta's learning** (A-3). This starts the day an audience (for example "exclude existing customers") is attached to a live ad set. Dormant today.
4. **Two server copies of one sale may both be counted** (A-4, needs a live check). PayU often tells us about a payment twice. The docs don't say whether Meta merges two server-only copies.
5. **Rejected-ad alerts may lose their reason, or the whole ad lookup** (A-5, needs a live check). We ask Meta for a field under a name its reference doesn't list.
6. **The Audience Network watch may be looking in the wrong place** (A-6, needs a live check). A verifier noticed we may request placement details at the wrong level of Meta's data.

**Fix first:** A-1 (it affects real sales today), then A-2. Then run the three live checks for A-4, A-5 and A-6: each is one read-only call, listed at the end.

**Counts after verification** (39 real candidates + 8 planted fakes):

| Severity | Confirmed | Uncertain (needs a live check) |
|---|---|---|
| HIGH | 0 | 0 |
| MEDIUM | 3 | 3 |
| LOW | 10 | 3 |

- 5 matched decisions already on file (CONFIRMS-KNOWN).
- 11 real candidates were disproved.
- All 8 planted false claims were caught.

---

## Findings

Each finding: what's wrong, evidence on both sides, the fix (described, not applied), what it touches, and which functions would need redeploying. Every Meta function here is deployed with `--no-verify-jwt` (CLAUDE.md rule 3). Editing `supabase/functions/_shared/metaCapi.ts` means redeploying all five of its importers: `payu-callback`, `payu-webhook`, `verify-pending-payments`, `capi-lead`, `meta-audience-sync`.

### A-1 — A failed sale report to Meta is never retried — MEDIUM — CONFIRMED (with corrections)
**What's wrong.** When the server tells Meta about a sale and Meta times out or errors, the code logs it and gives up. There's no retry, and no record of whether the send worked. Meta's own guidance is to retry. Most payments get a second chance by accident, because PayU often notifies us twice, but the payment-rescue job (`verify-pending-payments`) marks the payment done *before* sending, so it gets exactly one try. That job exists to rescue sales that already have no browser copy.

**Evidence.**
- Code: `supabase/functions/_shared/metaCapi.ts:454-463` — the catch ends in `return false;`. `:472` — `export async function sendPurchaseToMeta(args: CapiPurchaseArgs): Promise<void>`, and at `:516` the result of `await postEventToMeta({` is thrown away.
- Code: `verify-pending-payments/index.ts:792` `.eq('status', 'pending')`, then `:855-856` flips the status before the send at `:938`. `supabase/migrations/` has no send-record column for purchases; only `applications.lead_reported_at` exists.
- Doc: `docs/meta-marketing-api/conversions-api/16 Troubleshooting.md:15` — "We recommend retrying the request in cases where the response indicates a non-client error, such as a timeout."
- Doc: `guides/12 Troubleshooting/01 Error Handling.md:45` — "Wait, then retry the request later."

**Corrections from the verifier.**
- "Never retried" overstates it for payments PayU reports through both callback and webhook: `payu-webhook/index.ts:721-722` re-sends at the same status, and Meta deduplicates on the txnid.
- The missing send log was a deliberate choice (handoff §22 ~4113-4122, "fire-and-forget on purpose"; ~4331 "Purchase sends are never retried"). The missing retry is what's open.
- The watchdog's `purchase_server` check catches losses afterwards, but it won't alert on a single lost sale.

**Scope.** Mostly `verify-pending-payments`, plus webhook-only payments where PayU notifies once. Bites today.

**Fix.** Have `sendPurchaseToMeta` return its result. Let `verify-pending-payments` retry a failed send on its next run within Meta's 7-day window, for example with a `purchase_reported_at` column mirroring the Lead design. This touches `_shared/metaCapi.ts` (all five importers redeploy), the three payment functions and a migration. The payment-path functions are excluded from unattended deploys (CLAUDE.md rule 2).

**Live check.** Edge-function logs (Supabase `query_logs`) for `[meta-capi] TIMEOUT`, `send failed` and `REJECTED` on the three payment functions, plus past `purchase_server` verdicts in `meta_signal_checks`.

### A-2 — Returning open-event applicants create extra Leads that never pair with the server — MEDIUM — CONFIRMED
**What's wrong.** In the open-event flow, the browser fires a Lead as soon as the OTP is sent, with a fresh id minted on each page load. If this phone already has an application for the event, the server reports the application's *original* id, or nothing at all if it already reported. So the browser's new Lead never matches anything, and Meta counts an extra Lead each time someone comes back. That is exactly what the cart-abandonment nudges cause. The invite flow doesn't have this problem.

**Evidence.**
- Code: `src/AppFlow.tsx:1203-1207` (`openLeadIdRef` minted per mount); `:1222` (`dedupId: openLeadId()`); `:2019` fires `pingOpenFunnel('details_form_submitted')` before any row check; `:2223-2224` is the duplicate-row path.
- Code: `supabase/functions/capi-lead/index.ts:311-314` (returns early if `lead_reported_at` is set) and `:319-325` (`const effectiveId = UUID_RE.test(rowLeadId) ? rowLeadId : leadId;` with the warning "the pixel event and this one will not deduplicate").
- The comment at `AppFlow.tsx:2235-2238` ("the pair still matches") is contradicted by capi-lead.
- Doc: `conversions-api/12 Handling Duplicate Events.md:27-28` — "a Meta Pixel's `eventID` must match the Conversion API's `event_id`".

**Scope.** Lead only, no Purchase path. Bites today; it matters for bidding once a Lead-optimised ad set runs.

**Fix.** When the OTP is requested, have `open-event-otp` return the existing application's `lead_id`, and reuse it as the browser eventID. This touches `src/AppFlow.tsx` and `supabase/functions/open-event-otp` (deploy with `--no-verify-jwt`).

**Live check.** Edge logs for capi-lead's "lead_id mismatch between row and request" (an undercount).

### A-3 — Daily audience updates would reset an ad set's learning once an audience is attached — MEDIUM — CONFIRMED (dormant)
**What's wrong.** Our audiences are updated by adding and removing people each day. Meta says in bold that adding or removing through that route resets the learning phase of any active ad set using the audience, and that the "replace" route doesn't. The system itself recommends attaching `customers_all_paid` as an exclusion (§19), and it pushes a warning when an active ad set lacks one. Do that, and most booking days would restart learning.

**Evidence.**
- Code: `supabase/functions/meta-audience-sync/index.ts:245` (add) and `:262` (remove), both on `${audienceId}/users`.
- Doc: `guides/07 Audience Guides/03 Customer File Custom Audiences.md:409` — "This endpoint does not reset your ad set's learning phase when an audience is part of active ad sets unlike POST or DELETE API calls to the `/<CUSTOM_AUDIENCE_ID>/users` endpoint."

**Scope.** No Purchase path. Only once a customer-list audience sits on an ACTIVE ad set. It matters most for AddToCart/ViewContent goals, the only ones that can exit learning at our volume (§9).

**Fix.** Before any audience is attached, switch that audience to `usersreplace`. That needs a `session` with `batch_seq`, no overlapping replaces, and completion within 90 minutes. Or confirm with a real test whether an exclusion-only audience triggers the reset. Touches `meta-audience-sync` only.

**Live check.** After attaching one, compare `meta_adset_learning_history` against `meta_audience_members` change days.

### A-4 — Two server copies of one sale might both be counted — MEDIUM — UNCERTAIN
**What's wrong.** `payu-callback` and `payu-webhook` (and a repeated callback) can each send the same Purchase with the same id. The docs only promise to merge a browser copy with a server copy. On the "match by browser id" method they say two server-only events are not discarded. For the event-id method we use, they don't say either way. When the customer never returned to the site (a large share of buyers), there is no browser copy to anchor the merge.

**Evidence.**
- Code: `payu-callback/index.ts:984`, `payu-webhook/index.ts:926`, `verify-pending-payments/index.ts:938`; `isStaleStatus` lets same-status replays through (`payu-callback/index.ts:745-758`).
- The webhook's own comment (`:922-924`): "however many of the three fire, Meta records one sale".
- Doc: `conversions-api/12 Handling Duplicate Events.md:92` ("same server key combination … **and** browser key combination … we discard the subsequent events"), and `:61` for the other method: "If you send us two consecutive server events with the same information, we do not discard either."

**Scope.** Purchase paths `payu-callback` + `payu-webhook`. Bites today at any volume if Meta double counts.

**Fix, if confirmed.** A claim-then-send lock so only one path reports each txnid.

**Live check.** `select checked_at, expected, matched, meta_total from meta_signal_checks where check_key='purchase_server' order by checked_at desc limit 14;` A `meta_total` persistently above `matched` suggests double counting. Alternatively, find txnids sent by two paths in edge logs and compare `ads_get_dataset_stats` (SERVER_ONLY, hourly). The auto-memory note `dedup-two-purchase-test-pending` (handoff ~2922) suggests this test was already planned.

### A-5 — Rejected-ad alerts may lose the rejection reason, or the whole ad lookup — MEDIUM if real — UNCERTAIN (plus a confirmed LOW half)
**What's wrong.** When an ad is rejected, the alert job asks Meta for the ad's details, including `review_feedback`. Meta's Ad reference lists only `ad_review_feedback` on an ad. `review_feedback` exists on ad sets, as a plain string meaning something else. If Meta refuses an unknown field, which this codebase has hit before, the whole lookup fails: the ad name, status and `issues_info` are all lost, though the push still arrives with the webhook's own message. Separately, the function that extracts the reason can't read the documented shape of that field, since the reasons sit one level deeper, under `global`. That half is confirmed but low impact.

**Evidence.**
- Code: `supabase/functions/meta-ads-alerts/index.ts:62` — `case 'ad': return 'name,effective_status,configured_status,review_feedback,issues_info';`. `:134-144` (`firstReason` takes only top-level string values); `:452`.
- Doc: `api-reference/01 Ad/01 Overview.md:277` (`ad_review_feedback`, AdgroupReviewFeedback); `api-reference/12 Ad Set/01 Overview.md:405` (`review_feedback` string, "Reviews for dynamic creative ad"); `api-reference/25 …/adgroup-review-feedback.md:17-18` (`global` map, `placement_specific`).
- The Ads Webhooks guide itself uses `review_feedback` in its poll (`guides/09 Ads Webhooks/08 With-issues ad objects.md:70`).

**Scope.** No Purchase path. Bites on the first rejected ad.

**Fix.** Request `ad_review_feedback` and read inside `global`/`placement_specific`, in the same change. Touches `meta-ads-alerts` only.

**Live check.** `GET /v26.0/<any AD_ID>?fields=name,effective_status,configured_status,review_feedback,issues_info` with the reporting token. A "nonexisting field" error confirms it.

### A-6 — The placement watch may request placement fields at the wrong level — MEDIUM if real — UNCERTAIN (raised by a verifier, not independently re-verified)
**What's wrong.** The "Audience Network nobody chose" watch reads Meta's *effective* placements as top-level ad-set fields. Meta's docs define them as sub-fields of `targeting`. The handoff explains empty readings as "the ad set never delivered". But the same handoff records effective placement values read through the Meta Ads MCP from that same paused ad set. If the nested form returns data and ours doesn't, the watch has been blind by construction.

**Evidence.**
- Code: `supabase/functions/meta-ads-sync/index.ts:688-696` (`ADSET_PLACEMENT_FIELDS`).
- Doc: `docs/meta-marketing-api/api-reference/25 Linked pages not in the sidebar/targeting.md:49-50` (effective_* rows under Targeting); `guides/07 Audience Guides/15 Targeting Guides/04 Placement Targeting.md:350` (`fields=targeting{effective_publisher_platforms,…}`).
- Handoff ~1968-1974 and ~2070-2074 record MCP values; ~5688-5692 and ~5754 give the "never delivered" explanation.

**Scope.** The Audience Network push and the placement history. It matters once ads spend.

**Live check.** Read ad set `120248398504180192` with `fields=targeting{effective_publisher_platforms,effective_audience_network_positions}` and with `fields=effective_publisher_platforms`, then compare. If confirmed, move the fields under `targeting{…}` in `meta-ads-sync` and redeploy it.

### A-7 — Meta's purchase numbers carry an unrecorded attribution window, and the panel doesn't explain the gap in either direction — LOW — CONFIRMED
**What's wrong.** The spend sync stores Meta's purchase counts but not *which* attribution window produced them. For invite-only events, where payment often comes more than 7 days after the click (17% took over a week, `capi-lead/index.ts:11-13`), Meta's default 7-day click window won't credit the sale, while our own booking-based join does. So "Meta says" can read low or zero for a sale we correctly credit.

The panel gives no hint of this. The only "reads high" note is a developer comment that isn't shown on screen (`src/AdminPanel.tsx:11473-11475`), and it contradicts another comment that says Meta "will always read low" (`src/attribution.ts:10-14`).

**Evidence.**
- Code: `meta-ads-sync/index.ts:303-317` (FIELDS, no `attribution_setting`) and `:1834-1842`. `src/AdminPanel.tsx:11477` (`Meta says …×`).
- Doc: `api-reference/02 Ad Account/45 Insights.md:123` ("The `default` option means `["7d_click","1d_view"]`"); `api-reference/01 Ad/09 Insights.md:191` (`attribution_setting` — "Each ad set has its own attribution setting value").
- Doc: `guides/08 Insights API/04 Limits & Best Practices.md:243-246` (since 2025-06-10 the API "will mimic Ads Manager settings" and dates web purchases by conversion time). The same page at `:248`, and `45 Insights.md:502`, still tell you to set `use_unified_attribution_setting=true` — Meta's docs contradict each other on this.

**Corrections.** Each ad set's windows *are* partly captured, via `learning_stage_info` (`meta_adset_config.learning_attribution_windows`, `20260917_meta_adset_learning_stage.sql:121-129`), but they are never shown.

**Scope.** Reported numbers only, no data loss. Once ads spend.

**Fix.** Add `attribution_setting` to the sync fields (redeploy `meta-ads-sync`), store it per row, and add one line under "Meta says" explaining that Meta uses its own window (for example 7 days after the click) while our number follows the booking however late it pays. Also record this in handoff §2, which today only describes Meta reading high.

**Live check.** `SELECT adset_id, learning_attribution_windows FROM meta_adset_config;` plus the invite-lag percentile query in `scratchpad/results/VA7.md` (reproduced under "Live checks").

### A-8 — The catalog feed puts a changing date in a label that triggers Meta policy re-review — LOW (MEDIUM once catalog ads run) — CONFIRMED
**What's wrong.** `custom_label_4` holds the next open date. That changes whenever a date passes *or sells out*. Meta says changing custom labels sends items back through policy review, "which can impact ad delivery", and recommends `internal_label` for filter labels.

**Evidence.**
- Code: `supabase/functions/meta-catalog-feed/index.ts:30-32`, `:76-80`; `supabase/migrations/20260911_meta_catalog_readiness.sql:182`, `:197`.
- Doc: `api-reference/22 Product Catalog/27 Items Batch.md:105` — "switching to internal labels (`internal_label`) instead is recommended. Unlike custom labels, you can add or update internal labels as often as needed without sending items through policy review each time, which can impact ad delivery."

**Scope.** No catalog exists yet (§20).

**Fix.** Before creating the catalog, move `next_date` (at least) out of custom labels. It's unproven in the repo that a *commerce* CSV feed accepts `internal_label`; the in-repo CSV examples are travel catalogs. Redeploy `meta-catalog-feed` plus the SQL.

### A-9 — Catalog titles are cut at 150 characters; Meta's product limit is 100 — LOW — CONFIRMED (latent)
- Code: `20260911_meta_catalog_readiness.sql:190` `left(btrim(s.title), 150),`.
- Doc: `api-reference/22 Product Catalog/27 Items Batch.md:122` — "`title` … Required. Max size: 100."
- That limit is documented for the batch API; the feed limit is unproven. Fix: 150 → 100 in a `CREATE OR REPLACE` (no redeploy).
- Live check: `SELECT slug, length(btrim(title)) FROM events WHERE is_active AND booking_flow='payment' AND length(btrim(title))>100;`

### A-10 — Catalog feed format and quoting — LOW — UNCERTAIN
The feed is comma-CSV with every field quoted. One doc names only "Tab Separated file or XML" and says quoted fields apply "only for TSV feeds" (`api-reference/25 …/product-feed.md:18`, `:122`). Others explicitly document comma CSV with exactly our quoting (`guides/04 …/11 Automotive Ads Guides/05 Reference.md:16`). The real risk is a feed configured with quoted fields *off*, which would put literal `"` characters in every value.
- Code: `meta-catalog-feed/index.ts:37-40`, `:86`.
- Fix when the catalog is created: set delimiter = COMMA and quoted fields = on explicitly, or serve TSV.
- Live check: once a feed exists, `ads_catalog_list_product_feeds`, then read its upload sessions and diagnostics.

### A-11 — Ad set optimisation-goal check may miss InitiateCheckout because of an enum spelling — LOW — UNCERTAIN
`meta_adset_optimization_warnings()` maps `'INITIATE_CHECKOUT'`. Meta's docs disagree on the spelling:
- The Promoted Object reference says `INITIATED_CHECKOUT` (`api-reference/11 Ad Promoted Object.md:62`).
- The Pixel reference's "Promoted Object custom_event_type value" column says `INITIATE_CHECKOUT` (`pixel/04 Reference.md:23`).

If the API returns the former, an InitiateCheckout-optimised ad set silently drops out of the "can't exit learning" check.
- Code: `supabase/migrations/20260909_meta_adset_config.sql:149` (the only definition).
- Fix: add both spellings, as was already done for ViewContent (`:147-148`). SQL only, no redeploy.
- Live check: `ads_get_field_context` for `promoted_object.custom_event_type`, then `SELECT DISTINCT custom_event_type FROM meta_adset_config;`

### A-12 — The `{{ad.id}}` pre-flight check trusts the macro anywhere in the creative — LOW — UNCERTAIN
The verdict returns `ok` if `utm_content={{ad.id}}` appears anywhere in the creative, including the destination link itself, on the stated belief that "Meta substitutes macros in both" (`supabase/migrations/20260918_meta_ad_creative_tracking_tags.sql:121-123`, `:133-150`). The only in-repo doc describes macros as values inside `url_tags` (`extra-pages-html/Use URL Tags for Tracking.html`, txt:17, :27-34). The handoff admits "Meta's URL macros are not covered by any of the docs in this batch" (~2255), and the recorded test was SQL-only (~6021).
- It only matters if the tag is typed into the link against the setup instructions.
- Live check: on the first real ad, confirm landing sessions carry a numeric `utm_content`.

### A-13 — The paste-ready URL-parameter string has no placement macro — LOW — CONFIRMED
Every paste-ready copy omits the placement macro, so a founder who follows the setup card or the §24 checklist will never capture placement per booking, which can't be backfilled. The copies are:
- `src/AdminPanel.tsx:11042`
- `META-ADS-SETUP.md:20`
- `META-ADS-HANDOFF.md:2347`
- `supabase/migrations/20260906_meta_ads_performance.sql:17`

Meanwhile `src/attribution.ts:59-62` waits for `placement`/`site_source_name`.
- Doc: `guides/04 Ad Creative/07 Instagram Ads Guides/03 Setup & Management/07 Get Ad Insights.md:69` ("use the `url_tags` macro [SITE_SOURCE_NAME] … to distinguish different placements").
- No in-repo doc supports a `{{placement}}` macro at all.
- Correction: handoff §10 (~2211, ~2252) does say to add the macros, just not as a paste-ready string. The capture code is itself unpushed (~2202).
- Fix: settle the exact spelling on one live click, then update all four strings and the §24 item. Frontend and docs only.

### A-14 — The placement watch can't see Threads or WhatsApp positions — LOW — CONFIRMED (narrower than first stated)
`ADSET_PLACEMENT_FIELDS` (`meta-ads-sync/index.ts:688-696`) and the normaliser (`20260918_meta_adset_placements.sql:79-87`) cover neither `effective_threads_positions` nor `effective_whatsapp_positions`, both documented (`api-reference/25 …/targeting.md:49-50`). Meta auto-adds WhatsApp marketing messages under Advantage+ placements for onboarded accounts (`guides/04 Ad Creative/11 Marketing Messages.md:102`).
- Platform-level `effective_publisher_platforms` is captured, and Threads is now an explicit founder choice (handoff ~2051).
- Fix: fields + normaliser keys + a warning rule. Adding fields alone changes nothing. Redeploy `meta-ads-sync` and add a migration. See also A-6 and OPP-13.

### A-15 — Audience error messages tell you to widen the token, which contradicts M10 — LOW — CONFIRMED
`explain()` in `supabase/functions/meta-audience-sync/index.ts:113-134` maps every unmatched code-200 error, and codes 294/10, to "the token is ads_read only … needs ads_management". That contradicts settled **M10** (audience writes work on `ads_read`; "do not widen it without a reason").

It also misses two documented errors:
- 100/33, system user not on the ad account (`guides/12 Troubleshooting/02 Error Codes/01 Standard Error Codes.md:18`)
- 200/1870050, ad account not linked to Business Suite (`guides/07 Audience Guides/03 Customer File Custom Audiences.md:187`)

The raw code is always appended, so nothing is lost; it's the advice that's wrong. Fix: correct the texts and add the two cases. Redeploy `meta-audience-sync`.

### A-16 — Error classification ignores Insights subcodes, and any first-page code 100 drops the status filter — LOW — CONFIRMED
`classify()` retries every code 2 and treats every code 100 as permanent (`meta-ads-sync/index.ts:82`, `:121`, `:140-152`). The Insights error table splits them by subcode (`guides/08 Insights API/11 Error Codes.md:12`, `:16-18`): 2/1504041-42 are permanent, 2/1504043 is intermittent, and 100/1504018 is a timeout that calls for a smaller range. The cost is up to 3 wasted retries.

The more notable half: `:1863` treats **any** code 100 on page 1 as "Meta refused the status filter" and steps down to filters that drop deleted/archived ads. §6 says those must be kept. The account-level spend reconciliation would flag missing spend.
- Fix: check subcodes; step down only on the specific filter-refusal error. Redeploy `meta-ads-sync`.
- Live check: `SELECT status_filter, error_code, error_subcode, count(*) FROM meta_ads_sync_log GROUP BY 1,2,3;`

### A-17 — The handoff puts the Conversions API version on the 90-day Marketing API clock — LOW — CONFIRMED (doc only)
`META-ADS-HANDOFF.md` §13 item 6 (~2706-2766) groups `_shared/metaCapi.ts:60` with the ads pins that "must move together" on "roughly every 90 days". The CAPI doc says otherwise: `conversions-api/03 Using the API.md:9` — "every version is supported for at least two years. This exception is only valid for the Conversions API." The code comment already knows this (`metaCapi.ts:28`, `:58`).

This matters because a CAPI bump is a five-function redeploy that includes payment paths. Fix: correct §13 item 6. No code change.

### A-18 — Webhook inbox hygiene: two spellings of "ad set", and only the first object per recommendation — LOW — CONFIRMED
- `meta-ads-webhook/index.ts:54-58` stores `adset` or `ad_set` depending on the payload (docs: `guides/09 Ads Webhooks/03 Effective status.md:57` vs `08 With-issues ad objects.md:60`). The only consumer handles both (`meta-ads-alerts/index.ts:63-64`).
- `:74-81` keeps only the first `ad_object_ids` entry (doc `06 Ad recommendations.md:47`, `:64`). The full value is kept in jsonb.
- Fix when a consumer is built: normalise the spelling and read the array. Redeploy `meta-ads-webhook`.

### A-19 — Server caps `_fbp` at 120 characters while the browser accepts 512 — LOW — CONFIRMED (latent)
- Code: `src/metaPixel.ts:376`, `:390`; `create-payu-order/index.ts:274-275`; `capi-lead/index.ts:95`, `:122`, `:341`.
- No fbp length limit is documented (`conversions-api/05 Parameters/04 Customer Information Parameters/03 fbp and fbc Parameters.md:152-161`). A future longer `_fbp` would be silently dropped with no fallback — the same failure the old 200 cap caused for fbc.
- Fix: raise the cap or document the deliberate split. Touches `create-payu-order` (a payment path) and `capi-lead`.

### Smaller hygiene notes (verified, not ranked)
- **Stale comments.** Four comments say "about half of visitors block the Pixel": `src/supabase.ts:200`, `src/AppFlow.tsx:593`, `:2228`, `capi-lead/index.ts:17`. The in-repo measurements say 11–16% (August) and ~2–7% (September).
- **Watchdog blind hour.** `lead_sends_failing` never counts applications created 08:11–09:11 IST, because of the daily 24 h/1 h window. The main `lead_server` match still covers them.
- **`landed_at` re-stamping.** It is re-stamped on every tracked page load, including a reload of the same ad link (`src/attribution.ts:124`). Meta wants the first-seen time; this affects only the server's fallback click-id rebuild.
- **Undrained webhook rows.** Rows for the five fields nobody drains are never marked handled, so the "unhandled" index grows forever.
- **Overbroad heading.** Handoff §9's heading "Everything monetary in the API is in MINOR UNITS" is too broad: insights `spend` and `action_values` are *not* in minor units, and the code correctly treats them so. Someone taking the heading literally could introduce a 100× bug.
- **80014 in the retry lists.** One verifier confirmed it missing from `meta-signal-watchdog`'s transient list as hygiene. Another showed three in-repo API reference pages tie 80014 to **catalog batch uploads**, which neither function makes (`api-reference/22 Product Catalog/05 Batch.md:52`, `27 Items Batch.md:63`, `29 Localized Items Batch.md:62`). Adding it is harmless; not a defect.

---

## Checked and fine (with citations)

- **Browser/server pairing for Purchase and Lead.** Same event names and ids. `metaPixel.ts:309` Purchase with eventID txnid; `metaCapi.ts:517`, `:599`; doc `conversions-api/12 Handling Duplicate Events.md:28-29`, `:38` (eventID is the 4th fbq argument).
- **Advanced matching keys and formats.** `em`, `ph` with 91, `external_id`, `fn`/`ln`, `ct`, `country` (`src/metaPixel.ts:195-229`) match `pixel/02 Guides/04 Advanced Matching.md:50-62`. Plaintext is correct because the Pixel hashes (`:22-23`). `external_id` is the same string on both channels (`conversions-api/05 …/02 External ID.md:11`).
- **fbc format and handling.** `fb.<subdomainIndex>.<ms>.<fbclid>`; fbclid is never re-cased (`metaPixel.ts:503-538`; `03 fbp and fbc Parameters.md:56-57`; ClickID txt:37). The server rebuild uses index 1 as the doc prescribes (`:108`) and milliseconds throughout.
- **`event_time`.** The 7-day clamp matches the doc (`metaCapi.ts:216-227`; `conversions-api/03 Using the API.md:116`). PayU's IST `addedon` is converted with an explicit `+05:30` (`metaCapi.ts:210-213`).
- **Payload basics.** `event_source_url` is always set (`metaCapi.ts:390`; `Server Event Parameters.md`, "required for website events"). `value` is sent as a number (`:526`; `Standard Parameters.md:77`). `order_id` is a documented website standard parameter (`Standard Parameters.md:46`).
- **Transport.** The CAPI endpoint and access-token placement are exactly as documented (`metaCapi.ts:402-403`; `03 Using the API.md:19`). A 200 without a count is treated as a failure (already fixed). `test_event_code` comes only from an env var, and the watchdog alarms if it's left on (`meta-signal-watchdog/index.ts:462-464`). There is no CAPI rate limit at our volume (`03 Using the API.md:266-270`).
- **Lead retry.** The sweep uses the same `lead_id`, inside Meta's 48 h dedup window (`capi-lead/index.ts:184-190`; `12 Handling Duplicate Events.md:92-94`).
- **IP and user agent.** The first `x-forwarded-for` entry is the client (`create-payu-order/index.ts:136-142`); stored IPs are real Jio/Airtel addresses (§27.3). `payu-callback` prefers live headers; the webhook and cron use checkout values only, never PayU's or their own.
- **fbp/fbc are sent from both flows.** The invite and open flows share `NativePaymentOverlay`, which always sends fbp/fbc (`src/PaymentOverlay.tsx:460`, `:464`).
- **Webhooks.** The handshake echoes `hub.challenge` after a timing-safe token check. The HMAC-SHA256 is over the raw body (`meta-ads-webhook/index.ts:111-126`, `:144-191`), matching `guides/09 Ads Webhooks/02 Get started.md:33-43`. All documented payload shapes resolve to an object. `entry.time` is treated as seconds.
- **Insights sync.** The 28-day lookback matches "do not change after 28 days" (`meta-ads-sync/index.ts:297`; `guides/08 Insights API/04 Limits & Best Practices.md:96`). The throttle header is parsed exactly as documented (`:114-121`). Spend is a plain decimal, not minor units (`:1931`; `01 Ad/09 Insights.md:417`). The ad account timezone assumption is verified (`:137`). Hitting a page cap fails loudly (`:2015-2035`). All 12 `effective_status` values are requested (`01 Ad/01 Overview.md:296`). An explicit IST window rather than `date_preset` is correct, because the two don't cover the same days.
- **Rate limiting.** The abuse-prevention 613 case is handled before the transient check (`meta-ads-sync/index.ts:113-115`, `:147`; `02 About Marketing API/03 Rate Limiting.md:128-134`). Backoff is 2/6/20 s. The permanent codes 10/100/102/104/190/200/294 match `Standard Error Codes.md`. No token appears in any logged URL.
- **Custom audiences.** Batch size 5000 is under the 10,000 limit. `session` is optional for single batches: the endpoint reference doesn't require it and the function works live. Blank fields are empty strings, as the reference asks (`19 …/10 Users.md:165`). Remove-via-`?method=delete` is documented (`03 Customer File …md:207`). `USER_PROVIDED_ONLY` and `CUSTOM` are valid. Country and city normalisation match the doc.
- **Catalog feed.** `in stock`/`out of stock` spelling (`product-item.md:100`); price as `1234.00 INR`; condition `new`; description ≤ 5000; a 503 rather than an empty 200, because empty uploads delete items (`product-feed.md:45`, `:110`); out-of-stock stops delivery per the FAQ.
- **Alerts and watchdog.** Creative `status` vs `effective_status` is correct. The `issues_info` sub-fields are documented. `/stats` parameters, shape, window (< 7 days) and time units (seconds) match `api-reference/14 Ads Pixel/35 Stats.md`. The guardrails compute CTR and frequency themselves, in consistent units.
- **Measurement join.** Unsubstituted macros are dropped at capture, and every join also requires digits (`src/attribution.ts:82-91`). Attribution is stamped on the first application insert, so late invite payments still credit the ad. The Poisson interval maths is correct. Units are rupees on both sides.
- **Version and tokens.** All 7 pins read v26.0. `api/webhook.js:111` v19.0 is the WhatsApp Cloud API, not ads, and out of scope. `meta-insights-features` uses a different host and Bearer auth, exactly per its doc.

## CONFIRMS-KNOWN
- CONFIRMS-KNOWN: S1 — `client_user_agent` conditional (`metaCapi.ts:324`).
- CONFIRMS-KNOWN: S2 — accent stripping on both Pixel and CAPI sides.
- CONFIRMS-KNOWN: S3 — `91` + last-10-digit phone.
- CONFIRMS-KNOWN: M1 — the `subscriptions` webhook field is unavailable.
- CONFIRMS-KNOWN: M8 — ETags rejected.
- CONFIRMS-KNOWN: M7 — batch/async APIs not adopted.
- CONFIRMS-KNOWN: META-ADS-HANDOFF.md §23 Pixel review (2026-09-19) — `disablePushState = true` although the SPA doc calls it "not recommended" (measured 1,001 vs 351 PageViews).
- CONFIRMS-KNOWN: META-ADS-HANDOFF.md §23 Pixel review — `content_name`/`content_category` values contain spaces. "Audience keys without spaces: ours comply", and Meta's own examples use spaced values.
- CONFIRMS-KNOWN: META-ADS-HANDOFF.md §13 item 3 — `creative_fatigue` is stored but not surfaced. The claim that `ad_recommendations` is "never read" was wrong: the scorecard reads it.
- CONFIRMS-KNOWN: `20260917_meta_jobs_daily.sql:10-12` and handoff ~4332 — the daily Lead sweep's 24 h retry window was accepted with the daily cadence. The "silent loss" claim was wrong: the `lead_server` 144 h match flags it.
- CONFIRMS-KNOWN: `meta-ads-audit-2026-08-18.md` Addendum 4 and `meta-ads-sop.md:99-110` — the five mid-funnel events are Pixel-only ("do not chase it"). **Recommend the owner re-decides.** That decision rested on "our only hook is create-payu-order" and "a server Lead would need new infrastructure"; since 27 Aug `capi-lead` is exactly that kind of own-domain relay (`capi-lead/index.ts:17-22`). The measured loss is small (~2–7% in September) and no campaign bids on these events, so it may still be right — but it should rest on current facts.
- CONFIRMS-KNOWN: §3 / §6 — full value at the advance; fbc/fbp raw; balance and test phones skipped; archived and deleted ads kept; `meta-ads-alerts` 401 without its secret.
- CONFIRMS-KNOWN: §27.1–27.4 — `ln` 33%, IPv4-only, historical `client_ip` nulls.

## Disproved candidates (one line each)
| ID | Claim | Why disproved |
|---|---|---|
| A3-2 | 3 s timeout vs Meta's 1.5 s | Errs toward keeping data given no retry; deliberate and commented. |
| A5-1 | `session` missing on `/users` | Optional per the endpoint reference; only the guide's copied table says "Required"; works live. |
| A5-3 | Validator lets `time_spent` through without `field` | Meta's own non-count example omits it; would fail loudly at a manual step §19 already plans for. |
| A9-1 / A4a-2 | 80014 missing from the retry list | 80014 is the catalog-batch throttle per three reference pages; the sync never makes those calls. |
| A4a-4 | Use `date_preset` | `last_28d` isn't the same window; the explicit range is shared with the spend reconciliation. |
| A1-2 | `order_id` isn't a Pixel parameter | It's a documented website standard parameter, and custom properties are allowed. |
| A2-2 | Purchase should carry `original_event_data` | That field belongs on follow-up events (AppendValue/AppendAttribution), not on the conversion itself (pLTV guide :111). |
| A2-4 | Slug drift orphans content ids | No path renames a slug any more (duplicateTrip removed; `saveTrip` keeps it). Residual: lowercasing on save, delete-then-recreate. |
| A2-6 | `num_items` on Purchase violates the docs | Nothing is built; the Pixel reference and "Pixel for Movies" both put `num_items` on Purchase. |
| A10-3 | Guardrail windows by `created_at`, not `landed_at` | The "same idiom" comment means the regex; both dates come from the same session. |
| R2c-1 | Later utm-only page load wipes fbclid | Documented last-touch design; fbc survives via the `_fbc` cookie, `lead_fbc` and the checkout fbc. |

Planted false claims, all caught:
- **A99-1:** HMAC over re-serialised JSON.
- **A99-2:** `in_stock` spelling.
- **A99-3:** spend divided by 100.
- **A99-4:** `phone` instead of `ph`.
- **A99-5:** `/stats` times in milliseconds.
- **A99-6:** literal macro stored and joined.
- **A99-7:** Lead sent with a value.
- **A99-8:** last `x-forwarded-for` entry used.

---

## What this audit could NOT check — live checks to run

All are read-only. Run them in an interactive session with Supabase/Meta access.
1. **A-1.** Supabase `query_logs` for `[meta-capi] TIMEOUT|send failed|REJECTED` on `payu-callback`, `payu-webhook`, `verify-pending-payments`; and `select check_key, checked_at, verdict, expected, matched from meta_signal_checks where check_key like 'purchase%' order by checked_at desc limit 60;`
2. **A-2.** Edge logs for capi-lead "lead_id mismatch between row and request".
3. **A-4.** `select checked_at, expected, matched, meta_total from meta_signal_checks where check_key='purchase_server' order by checked_at desc limit 14;` Then, for a txnid sent by two paths, `ads_get_dataset_stats` SERVER_ONLY hourly.
4. **A-5.** `GET /v26.0/<AD_ID>?fields=name,effective_status,configured_status,review_feedback,issues_info` with `META_ADS_ACCESS_TOKEN`.
5. **A-6.** Ad set `120248398504180192` with `fields=targeting{effective_publisher_platforms,effective_audience_network_positions}`, compared against `fields=effective_publisher_platforms`.
6. **A-7.** Two checks:
   - `SELECT adset_id, learning_attribution_windows FROM meta_adset_config;`
   - Invite payment lag:
     ```sql
     SELECT percentile_cont(ARRAY[0.5,0.9]) WITHIN GROUP (ORDER BY extract(epoch FROM p.first_paid - a.created_at)/86400)
     FROM applications a JOIN events e ON e.slug=a.event_slug
     JOIN LATERAL (SELECT min(created_at) first_paid FROM payu_payments p
                   WHERE p.event_slug=a.event_slug AND p.phone=a.phone AND p.status='success') p ON true
     WHERE e.booking_url='native-application' AND a.status IN ('advance_paid','fully_paid');
     ```
7. **A-9.** `SELECT slug, length(btrim(title)) FROM events WHERE is_active AND booking_flow='payment' AND length(btrim(title))>100;`
8. **A-11.** `SELECT DISTINCT custom_event_type FROM meta_adset_config;` and `ads_get_field_context` for `promoted_object.custom_event_type`.
9. **A-13.** The exact brace spelling of the placement macro on one live click; `SELECT creative_id, url_tags, has_placement_macro FROM meta_ad_creative_tags;`
10. **A-16.** `SELECT status_filter, error_code, error_subcode, count(*) FROM meta_ads_sync_log GROUP BY 1,2,3;`
11. **Deployed state (CLAUDE.md rule 3).** `list_edge_functions`: `verify_jwt` must match CLAUDE.md's lists, and `adlib-probe` / `ad-library-ingest` should be checked too. Confirm `_shared/metaCapi.ts` is current in all five importers (compare `updated_at`).
12. **Audiences.** `SELECT key, audience_id, member_count, last_error, last_synced_at FROM meta_audiences;`
13. **Webhook subscription health.** `SELECT field, count(*), count(*) FILTER (WHERE handled_at IS NULL) FROM meta_ads_events GROUP BY 1;` and `devtools_webhook_list` `list_topics`.

Also not checkable from the repo: whether Meta accepts `internal_label` in a commerce CSV feed (A-8), and Meta's Ad Library API (no in-repo doc; code checked against handoff §25 only).

---

## Where this should also be written down (not done here)
This session was limited to three files. `CLAUDE.md` asks for findings to live in the owning document, so a later session should:
- add a §23 log row and a pointer to both reports in `META-ADS-HANDOFF.md`;
- add A-17's correction to §13 item 6, and A-7's reverse-gap note to §2;
- record the R2a-1 re-decision question;
- add settled lines (e.g. "80014 = catalog batch") to `META-AUDIT-CONTEXT.md` so nobody re-audits them.

---

## Team log
- **Researchers (Sonnet): 24 runs.** 1 inventory; 20 round-1 (11 Part A areas, 9 Part B themes); 3 round-2 (CAPI/Pixel requirement sweep, Marketing API requirement sweep, browser→server capture chain).
- **Plan reviewer (Opus): 1 run.** 26 points: **25 AGREED, 1 DISAGREED.** The disagreement was the push-after-each-phase rule: the owner explicitly asked for pushes to `cloud/meta-audit` after each phase.
- **Verifier (Opus): 18 batches** (9 Part A, 9 Part B). Each got claims and citations only, and each Part A and Part B batch except one carried a planted false claim. The last Part A batch hit a usage limit after delivering its full report.
  - **Part A (39 real candidates):** 18 CONFIRMED, 5 UNCERTAIN, 11 DISPROVED, 5 CONFIRMS-KNOWN. Plus 8/8 planted claims DISPROVED. After merging duplicates these became 19 findings: A-1…A-19, with A-5 combining two candidates and A-7 three.
  - **Part B (43 real candidates):** 10 VIABLE (9 after merging duplicates), 7 NEEDS-OWNER-INPUT, 6 NOT-NEW, 20 NOT VIABLE. Plus 9/9 planted non-ideas NOT VIABLE.
  - **Manager reconciliation:** one verifier CONFIRMED the 80014 omission in the watchdog as hygiene, while another DISPROVED the same omission in the sync with stronger evidence (80014 = catalog batch). The report follows the stronger evidence and lists it as a harmless hygiene note.
