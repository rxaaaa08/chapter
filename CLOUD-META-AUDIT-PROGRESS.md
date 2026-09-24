# Cloud Meta audit — progress file

Started 2026-09-24 on branch `cloud/meta-audit`. Manager: one interactive cloud session.
If this session is resumed, read this file first.

Two jobs, kept strictly separate:
- **Part A — audit** of what is built, against Meta's own docs → `CLOUD-META-AUDIT.md`
- **Part B — opportunities** in Meta's docs we have not built → `CLOUD-META-OPPORTUNITIES.md`

## Doc sources (corrected 2026-09-24)
- ~~The Pixel and Conversions API doc sets are not in the repo.~~ **Corrected:** the owner pushed them in `3ca17f3`. Everything is under `docs/meta-marketing-api/`:
  - `guides/` (Marketing API, 300 pages) and `api-reference/` (469 pages)
  - `conversions-api/` (193 pages) — **primary source for the CAPI areas**
  - `pixel/` (21 pages) — **primary source for the Pixel area**
  - `developer-docs-html/` (62 saved developer pages: dedup, advanced matching, rate limits, Dataset Quality API, value optimisation, Parameter Builder…) and `extra-pages-html/` (33 saved pages: lead ads, click-to-WhatsApp, Threads/Instagram ads, URL tags, error codes, troubleshooting). Researchers read plain-text copies made in the session scratchpad but cite the original `.html` path plus the quoted passage.
- The container's network still refuses developers.facebook.com (proxy 403), so nothing is cited from outside the repo; with no in-repo passage a claim is marked "NO IN-REPO DOC".
- All of these folders feed the inventory's docs map, the Pixel/CAPI audit areas, and every Part B theme.

## Phase status
| Phase | Status |
|---|---|
| 1. Inventory | DONE 2026-09-24 — 1 researcher; code map (Pixel, CAPI, 7 API pins, webhooks, audiences, catalog, panel RPCs, 37 migrations, cron order) + docs map (~995 pages, [REQ] pages flagged, HTML duplicates mapped). Notable: `_shared/metaCapi` has 5 real importers — the CLAUDE.md grep also matches 2 comments in meta-signal-watchdog; `retarget-check` has no Meta touchpoint; `api/webhook.js` pins WhatsApp Cloud API v19.0 (not ads). |
| 2. Plan + plan review | DONE 2026-09-24 — plan reviewer (Opus) raised 26 points: 25 AGREED (one with modification), 1 DISAGREED. Final plan below. |
| 3. Progress file | this file |
| 4. Research (A + B) | Round 1 DONE 2026-09-24: 20 researchers (11 Part A, 9 Part B). Part A: 33 candidate defects + many checked-fine items; Part B: 45 candidate opportunities. Round 2 (thin areas + doc-first sweep of requirement pages) launching. |
| 5. Verify | running in parallel with research: Opus verifier, batches of ~5 with one planted false claim each. Part A batch 1 back (2 CONFIRMED, 4 DISPROVED incl. the planted one); 14 more batches running. |
| 6. Reports | not started |

## Audited snapshot
Repo at `782b6c8` on `cloud/meta-audit` (2026-09-24). This clone's history is squashed, so hashes quoted in the handoff do not resolve here and git cannot tell pushed from unpushed. A finding is called "live" only where `META-ADS-HANDOFF.md`'s own status notes say so.

## Final plan

### Part A — audit areas (one Sonnet researcher each)
| Area | Code | Primary docs | Status |
|---|---|---|---|
| A1 Pixel | `src/metaPixel.ts`, `src/supabase.ts` PIXEL_EVENTS/trackEvent, 5 `setPixelUserData` + `trackPurchaseOnce` call sites, `tools/pixel-harness/`, `vercel.json`/`index.html` (CSP) | `pixel/` (all), developer-docs-html Pixel pages | round 1 |
| A2 CAPI capture → storage → send, payload | `create-payu-order` capture (IP/UA/fbp/fbc/source_url/reported_value), `AppFlow` lead_fbp/lead_fbc, `src/attribution.ts` landed_at/fbclid, `_shared/metaCapi.ts` user_data/custom_data/event_id, the 4 senders | `conversions-api/05 Parameters`, `12 Handling Duplicate Events`, `13/02 End-to-end` | round 1 |
| A3 CAPI transport | `_shared/metaCapi.ts` post/timeout/errors/test code, `capi-lead` sweep, retry paths, 5-importer bundling | `conversions-api/03, 04, 14, 15, 16`, Main Body Parameters | round 1 |
| A4a Insights fetch | `meta-ads-sync` insights, reconciliation, fetchPage/retry/613/throttle/version header; `meta-insights-features` | guides/02/03, 08/01,02,04,11, 12, 13 out-of-cycle 2025/2026; api-ref 02/45 + 01/09 Insights; 18 Currencies | round 1 |
| A4b Object reads + enums | `meta-ads-sync` delivery, adset config/targeting/placements/learning, creative url_tags, ads_volume, audience registry read; the history SQL that stores enums | api-ref 01, 06, 12, 25 (learning-stage-info, issues-info, review-feedback); guides/11 Manage Your Ad Object's Status; guides/14 Destination Type | round 1 |
| A5 Custom audiences | `meta-audience-sync`, `meta_audience_membership()`, website-audience registry + validator | guides/07/03 Customer File, 07/04 Audience Rules, 07/09 WCA, Custom Audience TOS; api-ref 19 (Users, Sessions, Usersreplace), 25 custom-audience-* | round 1 |
| A6 Catalog feed | `meta-catalog-feed`, `meta_catalog_items()` + helpers | api-ref 22 (Product Feeds, Products), 25 product-feed*/product-item; pixel/01/04; guides/04/20. If no field spec: "NO IN-REPO DOC" | round 1 |
| A7 Webhooks | `meta-ads-webhook` | guides/09 (all 8) | round 1 |
| A8 Alerts / watchdog / guardrails | `meta-ads-alerts`, `meta-signal-watchdog`, guardrail/volume/signal SQL | guides/09 Effective status + With-issues; api-ref 14/01 Overview, 14 Stats; error-code pages; conversions-api/11 Dataset Quality | round 1 |
| A9 Cross-cutting | 7 `API_VERSION` pins vs changelogs, token handling, CLAUDE.md claims vs code, `adlib-probe`/`ad-library-ingest`/`tools/ad-library` vs §25 only (no Ad Library doc in repo); `api/webhook.js` v19 one line; `retarget-check` dropped (no Meta code) | guides/02/02, guides/13 (all) | round 1 |
| A10 Our measurement + join | `get_meta_ads_performance`, `{{ad.id}}`/`utm_content` join, `get_meta_ad_funnel`, true ROAS net of fees, enough-to-judge, scorecard, flow_analytics attribution, creative tracking tags, `src/attribution.ts`, panel labels (AdminPanel ~3253-3312, ~10843-12310) | extra-pages-html Use URL Tags for Tracking; api-ref 01/09 + 02/45 Insights; guides/08/04; out-of-cycle 2025 attribution changes | round 1 |

Regret questions assigned: attribution window / `action_report_time` basis of stored actions (A4a + A10); invite-only approval lag vs Meta's click window (A2 + A10); renamed/copied slugs orphaning content_ids, catalog and audiences + multi-ticket `num_items` (A2 + A6); refunds/cancellations never reported and never removed from `customers_all_paid` (A2 + A5, NEEDS-OWNER-INPUT whether refunds happen).

Round 2 (after round 1): re-brief thin areas + one doc-first sweep over the [REQ] pages.

### Part B — opportunity themes (one Sonnet researcher each)
| Theme | Primary docs |
|---|---|
| B1 Audiences & lookalikes | guides/07 (all), pixel/02/05, api-ref 19, api-ref 02 product/saved audiences |
| B2 Catalogs & Advantage+ catalog ads | guides/04/20, 24, 25, 18; api-ref 22 (diagnostics, event-source health, product sets, feed rules) |
| B3a Value & optimisation | conversions-api/13 Value Optimization (+ Profit), pLTV, Append Attribution; guides/05 Bidding + Value Rules; api-ref 11 Promoted Object; guides/11/04 Omni Optimal Setup |
| B3b Signal infrastructure | conversions-api/11 Dataset Quality (§13 item 2 already approved), 06 Parameter Builder (§27.3), 07 App, 08 Offline, 09 Business Messaging (M13), 10 Conversion Leads (M12), 17 Gateway; api-ref 14 Ads Pixel (35), api-ref 02 customconversions/adspixels |
| B4 Measurement & reporting not yet used (+ read-only leftovers of the deleted rules theme) | guides/08 (breakdowns, feature settings, ad volume); insights fields we don't request; api-ref 02 ad_custom_derived_metrics, minimum budgets, account spend_cap/amount_spent; 04 Ad Activity; Performance Recommendations History; webhook fields we don't consume; api-ref 12 Delivery Estimate/Stats; 20 High Demand Period; 23 R&F Prediction |
| B5a Creative intelligence & brand controls | guides/04/19 Asset Feed Spec, 21 Advantage+ Creative, 23 Generative AI, 26 Multi-advertiser, 29 Flexible, 30 Format Automation, 31 Metadata Tagging; api-ref 05, 07, 09, 10, 21, 25 ad-creative-* (degrees_of_freedom_spec / creative_features_spec readable on ads_read?) |
| B5b Formats not yet reviewed | guides/04/15 Event and Local Ads, 11 Marketing Messages, 03 Instant Experiences, 28 Call ads, 12 Profile Visit, 13 Multi-Media, 04 Collection, 02 Video & Carousel; extra-pages-html Instagram Platform insights |
| B8 Platform, account & governance | api-ref 15 Business, 17 Business User, 24 System User, 03 Ad Account User, 08 Ad Labels, 16, 18; guides/02/04 Data Processing Options; api-ref 12 Publisher Delivery Report; developer-docs-html Ads CLI / Ads MCP / Command Reference / Datasets and Catalogs / Tutorials and Recipes; guides/13 upcoming changes; §24, §25.5 |
| B9 Creator / partnership ads | guides/04/14 Partnership Ads (all), Branded Content; AFFILIATE-LINKS-HANDOFF.md, CREATOR-*; regret question: does an ad click carrying a creator ref pay affiliate commission on a paid-ad sale? |

Every Part B idea is tagged: access (ads_read / write / App Review), who acts (Ads Manager setting vs build), volume gate, lossy-if-deferred. Guides/03 is not re-read (reviewed in §23). Lead ads (M12), click-to-WhatsApp (M13), Threads and the 13 Instagram pages (§23) are not re-opened.

### Verification protocol
Opus verifier, batches of ~5, receives only claims + citations (not researcher reasoning). It re-greps both quotes verbatim, maps `.txt` lines back to the `.html`, rejects evidence from stub "moved" pages, dead links and version-lagged examples, checks every candidate against META-AUDIT-CONTEXT and handoff §9/§12/§13/§19/§20/§22/§23/§24/§27, requires which Purchase path is hit and whether it only bites after spend, writes the strongest counter-reading before its verdict, and keeps "checked, nothing wrong" lists. One planted false claim per batch tests it. Verdicts: A = CONFIRMED / DISPROVED / UNCERTAIN (+ CONFIRMS-KNOWN relabel); B = VIABLE / NOT VIABLE / NEEDS-OWNER-INPUT / NOT-NEW.

### Plan review — decisions
| # | Point (short) | Decision |
|---|---|---|
| 1 | Don't push after each phase (CLAUDE.md rule 2); also add pointers in META-ADS-HANDOFF.md / META-AUDIT-CONTEXT.md | **DISAGREED.** The owner explicitly told this session to commit and push these three files to `cloud/meta-audit` after every phase, and to commit only these three files. That is his OK in this conversation for exactly these pushes, which never touch `main`. Commits going out are listed before each push. The handoff pointers are recommended in the reports for a later session, not written here. |
| 2 | Record the audited snapshot; git can't tell pushed from unpushed | AGREED |
| 3 | Assign the capture half of CAPI (create-payu-order, lead_fbp/fbc, attribution fallback) | AGREED — A2 is now capture → storage → send |
| 4 | Our own measurement SQL / `{{ad.id}}` join has no owner | AGREED — new A10 |
| 5 | Attribution window / report-time basis of stored actions | AGREED — A4a + A10 |
| 6 | Invite-only approval lag vs click window | AGREED — A2 + A10 |
| 7 | Split A4 | AGREED — A4a / A4b |
| 8 | Name docs for A4–A9 | AGREED |
| 9 | Catalog field spec may be absent | AGREED |
| 10 | Renamed slugs; multi-ticket num_items | AGREED |
| 11 | Refunds/cancellations | AGREED |
| 12 | Pixel harness, CSP, call sites | AGREED |
| 13 | Pixel + CIP docs were audited days ago — focus on what's new | AGREED |
| 14 | Prior work not in pre-reading | AGREED |
| 15 | A9 is a catch-all | AGREED |
| 16 | Queue of live checks | AGREED |
| 17 | Delete B6 (rules/automation) — settled | AGREED — read-only leftovers moved to B4 |
| 18 | Shrink B7 to unreviewed formats, merge into B5 | AGREED with modification — kept as its own researcher (B5b) so B5a stays focused on brand controls |
| 19 | Split B3 | AGREED — B3a / B3b |
| 20 | Partnership / creator ads theme | AGREED — B9 |
| 21 | Meta altering creative by default | AGREED — B5a |
| 22 | Unassigned doc folders | AGREED |
| 23 | B8 doc paths mislabelled; brand safety settled | AGREED |
| 24 | Shared filter tags for Part B | AGREED |
| 25 | Stronger verifier protocol, planted errors | AGREED |
| 26 | AdminPanel is 13,732 lines | AGREED (measured) |

Counts: **25 AGREED, 1 DISAGREED.**
