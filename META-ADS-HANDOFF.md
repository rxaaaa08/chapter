# Meta Ads Systems — Handoff

**Last updated:** 2026-09-18 (§21 what Meta is told and why, where the price lives, pre-spend economics audit; §21.3 **true ROAS without gateway fees, per payment method — BUILT**; §22 signal watchdog — BUILT, runs daily 09:11 IST; §23 deleted/archived ads kept in spend + account-level spend check — BUILT; §23 ad set learning status + "too few tickets to judge" — BUILT; §23 delivery settings history + "What's switched on" card — BUILT; §21.7 item 1 **ticket economics — BUILT**: the cost alarm now judges an ad against the ad money a ticket leaves, plus a per-plan click ceiling; §21.8 **open events pay no marketer/manager commission — FIXED**, and event costs are deferred until he starts spending; **§24 the before-the-first-ad checklist**; §23 four Meta "get started" docs reviewed, **nothing to adopt** — the ad-creative one found the Page every creative needs; §15 **every ad lands on `/lifestyle`**, the founder's decision; §9 two new read-tool traps — an empty list can mean "not allowed to see", and a read enum is not the create vocabulary; §23 rate limiting / versioning / overview — **the 613 that must not be retried, FIXED** in `meta-ads-sync` v18 with `error_subcode` now recorded, and **`meta-ads-alerts` caller secret, BUILT** (v6); **`app_secrets` client grants REVOKED** so RLS is no longer its only guard; §23 Reels Ads — **effective placements captured with history, BUILT** (`meta-ads-sync` v20): we stored what an ad set was configured with and never what is actually running, which is where §10's Audience Network `rewarded_video` leak lives, and an unknown now reports itself instead of reading as clean; **the push for unchosen Audience Network, BUILT** on his instruction (v21) — but it cannot fire before spend starts, because Meta reports no placements for an ad set that has never delivered; §23 **Lead Ads DECLINED by the founder** and **Threads Ads** audited — nothing built in either; §10 **Audience Network turned OFF and Threads kept, the FIRST write this project has made to a Meta ad object**, which also surfaced the trap that a write response echoes what you SENT, not what Meta stored; §23 **the Instagram Ads API guide set (13 docs)** reviewed — **the `{{ad.id}}` pre-flight check BUILT** (`meta-ads-sync` v22 reads every ad creative's `url_tags` and pushes if the macro is absent or *wrong*, before any money moves and including on paused ads); §6 **a function REVOKE must name `public`** — the first cut left a writer anon-callable and `information_schema` said it was fine; three corrections — the placement macro IS documented (`SITE_SOURCE_NAME`), `/generatepreviews` CAN be called with no creative, and a promoted Instagram post CAN be fully tracked if its CTA carries the link; §23 the media spec for the photos that do not yet exist; **§26 the ledger for the 16-18 Sep watchdog + spend-integrity session** — re-verified on production 2026-09-19, including the watchdog's first real sale matched (Purchase 1 of 1) and the deleted-ads change surviving `meta-ads-sync` v15 → v22)
**2026-09-19 addendum — the Meta Pixel docs (20 pages), §23:** automatic advanced matching was **never on** for this Pixel (so §9's reason for leaving automatic setup on was false); automatic setup is now **switched off in code** (`src/metaPixel.ts`, `5bcb721`, committed, **not pushed**) after a sealed-page test proved nothing we rely on changes; and **watchdog check 7, `pixel_config`, is BUILT and live** (`meta-signal-watchdog` v5, alerts on): it reads the settings file Meta serves for the Pixel every day and alarms if Meta starts blocking an event, stripping a parameter, or switching the Pixel off on chaptera.in — the silent failure no count check can see. Also written that day: **§5 "What Meta hears, button by button"** (every event mapped to the button that fires it, read from the live code), **§9 "Mistakes not to repeat"**, and the sealed test page `tools/pixel-harness/` (`d446316`).
**Status:** All measurement infrastructure built and live on production. **Zero rupees spent on ads. No ad has ever served on the account.**

Read this before touching anything Meta-related. It is written for a Claude session
starting cold, and for the founder, who is a **no-code founder** — explain plans in
plain language and never assume he can edit code or config himself.

---

## 1. The aim

chapter அ is a Chennai social-experiences booking webapp (₹299 tickets, meetups and
group trips). The founder is about to spend money on Meta ads for the first time.

His stated standard, and the reason all of this exists — this one **is** verbatim:

> *"we need to fix this to fully perfection before we spend a single rupee on meta ads."*

And the governing principle for every proposal. Both rules below are **condensed
from CLAUDE.md, not word-for-word** — read the originals there before quoting them
back to the founder:

> **Build systems for the scale we are heading to, not the scale we are at.**
> Current volume is never a reason to defer infrastructure. Data not captured on
> day one is gone forever and cannot be backfilled. Judge a proposal by whether it
> still holds at 50x the volume. Small *sample* is a legitimate caveat on reading a
> chart; it is never an argument against building the pipe that fills it.

And a pacing rule that matters for how you talk to him:

> **Do not push him toward launching.** He sets the pace and will say when he is
> ready. Until then the work is building and perfecting systems, not getting
> started. A closing "next step: launch" is exactly the nudge he does not want.
> Stating a genuine irreversible deadline **once** is still correct; repeating it
> as a nudge is not.

---

## 2. The one insight everything rests on

**Meta's numbers and the business's numbers disagree, systematically, in Meta's favour.**

A chapter அ ticket is ₹299. Most events are `split`: the customer pays a ₹102
advance now and the balance later (often at the venue). Not every advance becomes
`fully_paid`. Measured 2026-09-16: **~95% on normal split bookings, but 10 of 28 on
Founders Meet, a pay-at-venue event, where the other 18 did not show up** (§21.4).
The older "~80%" figure was a blend of the two.

Meta books a Purchase worth the **full ₹299** the moment the ₹102 advance clears.
**That is deliberate: it is the founder's decision, and his reasoning is in §21.1.**
Paying the advance is the conversion the ad produced, and a missed balance is
usually about something other than the ad. So Meta's reported ROAS is optimistic
by construction, on purpose. It counts *commitment* and cannot see whether the
balance was ever paid. Our side measures the cash.

Everything in this document exists to compute the **true** cost per acquisition from
money actually received, and to hold Meta's version of events next to it.

The clearest illustration, used as the test case for the recommendation scorecard:

| | Spend | Bookings | Cost per booking |
|---|---|---|---|
| Before | ₹1,400 | 7 | ₹200 |
| After | ₹3,500 | 10 | **₹350** |

Bookings up 43% — Meta reports that as success. Cost per booking up 75%. Both
numbers are true. Only one is about the business.

### Vocabulary used throughout

A session that has only read this document will not have met these. Terms are used
freely from here on.

| Term | What it means here |
|---|---|
| **CAPI** | Meta's **Conversions API**. Sends conversion events from our *server* rather than the visitor's browser, so ad blockers, iOS restrictions and a UPI-app handoff cannot lose them. |
| **Pixel / dataset** | The same object under two Meta names (renamed *dataset* in 2024). Ours is `28370453785913523`. The browser-side tracking script, and the bucket the CAPI events land in. |
| **EMQ** | **Event Match Quality**, scored /10 by Meta. How reliably Meta can tie our events to real people from the identifiers we send. Ours is 9.3; Meta's bar is 6.0. **Readable via the Meta Ads MCP** — `ads_get_dataset_quality` with `dataset_id` 28370453785913523 returns the composite score *and* per-match-key coverage percentages, which Events Manager does not show as cleanly. (An earlier version of this line said EMQ was Events-Manager-only and told you not to go looking for an API. That was wrong; it cost at least one session the check.) |
| **ROAS** | Return On Ad Spend — revenue divided by spend. The whole point of §2 is that Meta's version and ours differ. |
| **`fbp` / `fbc`** | Meta's two browser cookies. `_fbp` identifies the *browser*; `_fbc` records the *ad click* that brought them (format `fb.1.<ms>.<fbclid>`). Both are sent to Meta **raw, never hashed** — every other identifier is hashed. |
| **`fbclid`** | The click id Meta appends to an ad's destination URL. The raw ingredient `_fbc` is built from. |
| **System user** | A Meta Business Manager robot account. Owns long-lived API tokens that do not die when a human leaves or changes password. We have two, deliberately separate — see §9. |
| **Custom Audience** | A list of people uploaded to Meta (hashed) to target or exclude. **Lookalike** = Meta finding *new* people who resemble a seed list. |
| **PayU** | The Indian payment gateway that takes the money. `payu_payments` is our record of every attempt; `txnid` is its per-transaction id, which we reuse as Meta's `event_id`. |
| **`applications`** | One row per person per event — the booking. Unique on `(event_slug, phone)`. Carries `status`, `attribution` (jsonb), `ticket_count`, `selected_city`. **This is the customer table.** |
| **`payu_payments`** | One row per payment attempt. Carries `status`, `amount`, `reported_value`, and the Meta identifiers captured at checkout (`fbp`, `fbc`, `client_ip`, `client_user_agent`). |
| **Open vs invite flow** | Two booking paths. *Open* (`payu-hosted`) — anyone books and pays. *Invite* (`native-application`) — apply first, get approved, then pay. Both create `applications` rows. |
| **Advance / balance** | A `split` event takes a ~₹102 advance now and the rest later, often at the venue. A `full` event takes ₹299 in one go. |

**Meta's object hierarchy**, since every table and webhook refers to it:

```
ad account  (1580469137074269 — billing and permissions live here)
  └── campaign   (the objective: sales, leads)
       └── ad set   (the audience, budget and schedule)
            └── ad     (the creative — the thing people actually see)
```

`meta_ad_daily` is keyed at the **ad** level and carries the ad set and campaign ids
on every row, so a rollup to either is a query rather than a re-sync. Webhooks name
whichever level changed — see the four naming conventions in §9.

---

## 3. Meta-side identities

Everything below is real and current. Do not guess these.

| Thing | Value | Notes |
|---|---|---|
| **Ad account** | `1580469137074269` | "chapter அ advertisement". The ONLY one with a payment method AND API access. Three other ad accounts exist on the business and are read-only or MCP-disabled — do not use them. |
| **Business portfolio** | `1507936207635471` | "Chapter அ" |
| **App (ads/reporting)** | `38444690021845940` | "chaptera-ads". Created 2026-09-07. **PUBLISHED** (`live_mode`). Category ENTERTAINMENT, base domain `chaptera.in`. |
| **App (CAPI)** | — | "Conversions API Application". Auto-created by Meta during Events Manager CAPI setup. Does NOT appear in My Apps and cannot be added to a business portfolio. |
| **App (WhatsApp)** | `1221239236143201` | "Automation WA". Belongs to a **different** business portfolio ("Chapter A"). Unrelated to ads. |
| **Pixel / dataset** | `28370453785913523` | "chaptera.in website" |
| **System user (reporting)** | `61593969580394` | `chaptera-reporting`. Holds the ad account (Full access), the `chaptera.in` domain, and the `chaptera-ads` app. Token is **`ads_read` only**. |
| **System user (CAPI)** | `61593183602008` | `Conversions API System User`. Separate on purpose — see §9. |
| **Facebook Page** | `1201531216384934` | "Join Chapter அ", task `CREATE_ADS`. **Every ad creative needs a `page_id`**, and this is the identity every ad speaks as. Not yet promoted under the ad account — that is what 0 ads looks like, not a missing Page. §23, "Create an ad creative". |
| **Domain** | `chaptera.in` | Verified. Domain id `1610925223948745`. |
| **Webhook callback** | `https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-ads-webhook` | |
| **Custom audience: all paid** | `120248791739550192` | 107 people |
| **Custom audience: fully paid** | `120248791740360192` | 85 people |
| **Custom audience: unpaid leads** | `120248791741860192` | 165 people |

**Supabase project:** `txcmismkdttgsyhbnexf`

### Legal URLs registered on the app
- Privacy policy — `https://chaptera.in/privacy`
- Terms of service — `https://chaptera.in/termsofservice`
- Data deletion — `https://chaptera.in/data-deletion`

---

## 4. Secrets

All set in Supabase. **Claude cannot set these — the founder must.** Never ask him
to paste a token into chat.

| Secret | Used by | Scope |
|---|---|---|
| `META_CAPI_ACCESS_TOKEN` | `_shared/metaCapi.ts` | Sends Purchase/Lead events. Belongs to the **CAPI** system user. |
| `META_PIXEL_ID` | `_shared/metaCapi.ts` | Defaults to `28370453785913523` if unset. |
| `META_CAPI_TEST_CODE` | `_shared/metaCapi.ts` | When set, lets `90000000xx` test phones through to Meta. Normally unset. |
| `META_ADS_ACCESS_TOKEN` | `meta-ads-sync`, `meta-audience-sync` | System user token, `ads_read`. Belongs to the **reporting** system user. |
| `META_AD_ACCOUNT_ID` | `meta-ads-sync`, `meta-audience-sync` | `1580469137074269`, no `act_` prefix. |
| `META_APP_SECRET` | `meta-ads-webhook` | HMAC key that proves a webhook came from Meta. |
| `META_WEBHOOK_VERIFY_TOKEN` | `meta-ads-webhook` | Handshake token we chose. Not printed here — read it from Supabase secrets, or from the Webhooks form in the App Dashboard where it was pasted. |
| `CRON_SECRET` | `meta-ads-sync` (backfill path) | Guards `?since=&until=`. |

---

## 5. What is built — layer by layer

Six layers. Each depends on the ones above it.

### Layer 0 — Client-side capture (`src/attribution.ts`, `src/metaPixel.ts`)

**`src/attribution.ts`** (115 lines) captures where a visitor came from, off the
landing URL, into `sessionStorage`, and `AppFlow.tsx` writes it into
`applications.attribution` (jsonb) at row insert.

Captures: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`,
`fbclid`, `referrer`, `landed_at`, and the creator `affiliate_code`.

- **Session-scoped on purpose.** A visitor returning days later with a bare URL is
  NOT credited to the old ad. Under-credit paid rather than invent conversions.
- **`fbclid` is rejected rather than truncated** above 512 chars. A truncated click
  id is a valid-*looking* id that matches nobody, and Meta scores a
  supplied-but-unmatchable parameter *against* match quality. Dropping it is honest.
- Live since **2026-08-13**. Real values seen: `sp_auto_dm` (Superprofile auto-DM),
  `ig` + `link_in_bio` with an `l.instagram.com` referrer, bare `fbclid`.

**`src/metaPixel.ts`** (512 lines) is the browser side. Exports, in full:
`META_PIXEL_ID`, `isPixelConfigured`, `initMetaPixel`, `setPixelUserData`,
`trackPixel`, `trackPurchaseOnce`, `captureMetaIds`, `getFbp`, `getFbc`,
`ensureFbcCookie`, plus the `PixelUserData` and `PixelParams` types.

- `fbc` format is `fb.<subdomainIndex>.<creationTimeMs>.<fbclid>` — subdomain index
  **1** for an apex domain. Sent **RAW, never hashed**. Sending a bare `fbclid`
  here is a common invisible mistake: Meta accepts it and matches nobody.
- `normalisePart()` in this file must stay byte-identical in meaning to
  `normaliseNamePart()` in `_shared/metaCapi.ts`, or one person reaches Meta as two.

### What Meta hears, button by button — the live site, verified 2026-09-19

Built for the founder, who asked to be "very clear on the business logic". Read
from **`origin/main` (`a900ed3`)**, not the working tree: three pixel behaviours
differ between them and are flagged below. **Re-derive before relying on it**
(`git show origin/main:src/AppFlow.tsx | grep -n "trackEvent('"`, against
`PIXEL_EVENTS` in `src/supabase.ts`); §9 "Mistakes not to repeat" item 4 says why.

| # | What the visitor does, on screen | Our step (`flow_analytics`) | What Meta receives | Sent by |
|---|---|---|---|---|
| 1 | Opens any customer page in full: `/lifestyle`, `/plans`, `/invite`, the payment-result page | `page_view` | **PageView** | browser |
| — | Taps the `/lifestyle` poster ("Enter chapter plans") | — | nothing (an in-app move, not a page load) | — |
| — | Picks city / category / pickup city in the chat | `city_selected` etc. | nothing | — |
| 2 | Taps a plan in the `/plans` chat list | `event_selected` | **ViewContent** | browser |
| 3 | Taps **Join Our Plan** at the end of the plan details | `calendar_opened` | **AddToCart** | browser |
| — | Picks a date in the calendar | `date_selected` | nothing | — |
| 4 | Picks a meeting point for the first time — the price appears | `reached_pricing` | **ReachedPricing** (custom event) | browser |
| 5a | Taps **Book Now** under the price (**Apply Now** on invite-only plans, or the plan's own "Calendar CTA" label) | `book_cta_clicked` | **InitiateCheckout**, `cta_type: book` | browser |
| 5b | Taps **Contact Us** under the price | `contact_cta_clicked` | **InitiateCheckout**, `cta_type: contact` | browser |
| — | "All clear, let's book! 🚀" / "Hold up, I have a question", FAQs, the booking-timeline button ("Book Now" / "Request Invitation"), opening the details form | various | nothing | — |
| 6 | **Invite plan:** fills the application (name, phone, email, why join) and taps **Submit** | `application_submitted` | **Lead** | browser **and** server (`capi-lead`, same `lead_id`; a cron sweep retries a failed server send) |
| 7 | **Open plan:** fills name / phone / email and taps **Get OTP** | `details_form_submitted` | **Lead** (browser half) | browser |
| 8 | **Open plan:** enters the code and taps **Continue to Payment** (the booking row is created here) | — | **Lead** (server half of #7, same id — Meta counts one) | server |
| — | The bill page and the pay button that goes to PayU | — | nothing (`create-payu-order` only stamps `fbp`/`fbc`/`reported_value` for later) | — |
| 9 | Payment succeeds — the advance, or the whole ticket on single-payment plans | — | **Purchase** | server always (`payu-callback`, `payu-webhook`, `verify-pending-payments`); browser too if the success screen is seen within 24 h. `event_id` = PayU `txnid`, so Meta counts one |
| — | Pays the balance later | — | nothing, on purpose (the sale was counted at #9) | — |
| — | Taps some buttons anywhere | — | **SubscribedButtonClick** — Meta's own automatic detection, not ours | browser, **until `5bcb721` ships** |

**What rides along with each event**
- Every browser event from #2 to #5: `content_ids` = [plan slug], `content_name` =
  plan title, `content_category`, `content_type: 'product'`, `city`; InitiateCheckout
  also `cta_type`. **No value or currency** on any of them. PageView carries only
  `content_type`.
- Lead: the same plan fields and **no value**, deliberately (`metaCapi.ts`:
  an invented rupee figure would teach Meta to chase the wrong applicants).
- Purchase: `currency: INR`, `value` = **full ticket price × number of tickets**
  even when only the advance was paid (the founder's decision, §21.1), `order_id` =
  `txnid`, plus the plan fields.
- **Who the person is:** nothing but Meta's own browser cookie, IP and device until
  #6 / #7. From that tap on, for the rest of that page load, every browser event
  carries hashed email, phone, first/last name, city, country and customer id. A
  reload in the same tab re-attaches the phone, and the payment-success screen
  re-attaches everything. Server copies (Lead, Purchase) always carry the full set.

**What each one is for**

| Meta event | Used for |
|---|---|
| PageView | Visit counts only. Nothing optimises on it. |
| ViewContent | One of the two realistic optimisation goals at this volume (§9, learning phase); watchdog check `view_content_web`; "browsed a plan" audiences. |
| AddToCart | The other realistic optimisation goal; watchdog `add_to_cart_web`; "opened the calendar for plan X" audiences (§19). |
| ReachedPricing | "Saw the price and did not buy" audiences. Custom, so not directly optimisable. |
| InitiateCheckout | Price acceptance — did the price make them act. Book and Contact pooled by the founder's choice; `cta_type` keeps them separable. |
| Lead | The conversion for invite-only campaigns; watchdog `lead_server`. **It means two different moments:** an invite Lead is a submitted application (before approval); an open Lead is a requested OTP (before the code is entered and before payment). |
| Purchase | The money event: Meta's ROAS, watchdog `purchase_server`, compared against our cash-based true ROAS (§2). |

**Live differs from the working tree in three places (unpushed as of 2026-09-19):**
1. **AddToCart fires on every tap** of Join Our Plan on the live site; the working
   tree sends it once per plan per page load (`pingCalendarOpenedOnce`).
2. **A direct link to a plan sends no ViewContent** on the live site; the working
   tree adds it. Ads land on `/lifestyle` (§15), so this matters for shared links,
   not ads.
3. **Automatic button-click events** are live until `5bcb721` ships.

**One gap in both:** switching to a different plan with the plan switcher inside
the details page (`onSwitchEvent`) sends **no ViewContent** for the new plan. The
later AddToCart / InitiateCheckout / Lead / Purchase carry the new plan's
`content_ids`, so money and funnel attribution are right; only "viewed plan X"
audiences miss it. Not fixed — a one-line client change, noted rather than made.

### Layer 1 — Conversions API (`supabase/functions/_shared/metaCapi.ts`, 574 lines)

Server-side event reporting. Browser and server each send the event; Meta collapses
them on a shared `event_id`.

- **Purchase** `event_id` = the PayU `txnid`. Distinct per sale, which is what stops
  two purchases by the same person collapsing into one.
- **Lead** `event_id` = a minted `lead_id` stored on the application row.
- `user_data` sent: `em`, `ph`, `fn`, `ln`, `ct`, `country`, `external_id` (= hashed
  phone), `client_ip_address`, `client_user_agent`, plus raw `fbc`/`fbp`.
- **Importers — FIVE, all must be redeployed together when this file changes:**
  `payu-callback`, `payu-webhook`, `verify-pending-payments`, `capi-lead`, and
  **`meta-audience-sync`** (which imports only the hashing helpers). Always
  re-derive this list rather than trusting it:
  `grep -rl "_shared/metaCapi" supabase/functions/`
- **Exports the normalisation** — `sha256Hex`, `normaliseEmail`, `normalisePhone`,
  `normaliseNamePart` — so audience uploads hash through exactly this path.

**Audited and fixed 2026-09-06.** EMQ went 8.0 → **9.3/10** (Meta's bar is 6.0).
Browser/server now 1:1 on both events. `payu_payments.reported_value` holds the
value both reporters read, so they cannot disagree; it is the **full ticket**, not
the advance. That is the founder's decision, and his reasoning (§21.1) does **not**
depend on how many advances complete, so a low completion rate is not a reason to
reopen it. Balance payments fire nothing.

### Layer 2 — Spend sync (`supabase/functions/meta-ads-sync`)

Pulls per-ad, per-day insights from the Marketing API into `meta_ad_daily`.

```
GET /v25.0/act_<ID>/insights?level=ad&time_increment=1&time_range={...}
    &fields=ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,
            spend,impressions,clicks,inline_link_clicks,reach,frequency,
            cpc,cpm,ctr,unique_clicks,outbound_clicks,
            quality_ranking,engagement_rate_ranking,conversion_rate_ranking,
            actions,action_values,cost_per_action_type,date_start
```

- **Re-pulls a 14-day trailing window every run and UPSERTs.** Meta restates a day
  for up to ~7 days afterwards. A sync that only fetched yesterday would freeze
  every day at its first and lowest reading and be permanently wrong.
- **No breakdowns**, deliberately. Off-Meta conversions (Purchase/Lead) lose
  `region`, `dma` and both hourly breakdowns entirely.
- Retries transient errors with back-off; fails fast on permanent ones. See §9.
- Writes one row per run to `meta_ads_sync_log` — see §9 for why that exists.
- **Cron job 13**, `20 3 * * *`: **once a day, 08:50 IST** since 2026-09-17 (founder's decision, §8). It was every 6 hours before.

### Layer 3 — Webhooks (`supabase/functions/meta-ads-webhook`)

Receives Meta's `ad_account` webhooks and files them in `meta_ads_events`.
**Stores only — does not act.** A notification says *something changed*, never what
it changed to; acting means polling, which is a separate concern.

- `GET` handles the `hub.challenge` handshake. If the challenge is not echoed back
  verbatim the subscription is silently not created.
- `POST` verifies `X-Hub-Signature-256` = HMAC-SHA256 over the **raw body**, keyed
  on the app secret. Fails closed with no secret.
- Returns 200 fast. Meta retries anything slow or non-200.
- Dedups on a hash of (account, field, entry time, value) — **the envelope carries
  no event id**, so there is no natural key.

**Subscribed to all 7 `ad_account` fields**, `include_values: true`:
`ad_recommendations`, `ads_async_creation_request`, `creative_fatigue`,
`in_process_ad_objects`, `marketing_messages_subscriber_upload_status`,
`product_set_issue`, `with_issues_ad_objects`.

### Layer 4 — Custom Audiences (`supabase/functions/meta-audience-sync`)

Three audiences built from our own customer records, which Meta cannot assemble for
itself because they depend on who actually paid.

| Key | People | Purpose |
|---|---|---|
| `customers_all_paid` | 107 | **Exclude** from prospecting |
| `customers_completed` | 85 | Lookalike seed |
| `leads_unpaid` | 165 | Retargeting |

- **Uploads the difference, not the membership.** Meta's `/users` edge adds and
  dedupes, so re-sending everyone daily would appear to work — and would never
  *remove* anybody, leaving a lead who finally paid inside the retargeting audience
  forever. `meta_audience_members` records what was actually sent.
- Removal uses `POST ?method=delete`, not a real `DELETE` — bodies get stripped by
  intermediaries and it would silently remove nobody.
- Hashes through the **exported CAPI normalisation**, not a second implementation.
- **`leads_unpaid` is 165, not 184**, because it excludes anyone who has ever paid
  for *any* event. Someone mid-booking today who bought a trip in August is a
  customer, not a cold lead.
- The lookalike seed is **deliberately created before it is usable** — Meta wants
  ~100 *matched* people and we have 85 raw. It fills as people book.
- **Cron job 14**, `50 4 * * *` (daily).

### Layer 5 — Recommendation scorecard (`get_meta_recommendation_scorecard`)

Scores Meta's own ad recommendations against our cash. Meta suggests a change,
projects the lift itself, and measures the result with its own numbers —
recommendation and verdict from the same party, which is paid when you spend more.

Compares the ad's true cost per booking in the N days before a recommendation
against the N days after, then aggregates by `recommendation_type` so that over
months you learn which *kinds* of advice have been worth taking on this account.

**What it does not claim:** we cannot see whether a recommendation was applied. It
measures what *followed*.

**This limitation is now fixable, and was not when the layer was written.**
`GET /act_<ID>/opportunity_score_history?get_reason=true` returns a per-day
`changelog` carrying `applied_recommendation_types_then` / `_now` per ad object —
a direct record of WHEN a recommendation was applied and to WHAT. Joining that to
this layer upgrades it from "what followed" to "what followed *your applying it*".
Not built: with no campaigns every changelog is empty. Build it once ads run.
Constraints: two-day latency (`to_date` must be yesterday or earlier, else error
subcode `5014023`), 45-day maximum window, and `get_reason=true` costs response
size and latency. Every figure carries its sample size, and a row where
either window has no bookings reports **"not measurable"** rather than 0% — those
are opposite conclusions.

### Layer 6 — The panel (`src/AdminPanel.tsx`, Growth ▸ Ads)

`growthMode: 'ads'`, third pill beside Analytics and Experiments. Reads
`get_meta_ads_performance` and `get_meta_recommendation_scorecard`.

Shows: window selector (7/30/90d), headline stats, a hand-rolled SVG
cost-per-booking chart, a per-ad table with true ROAS next to Meta's, a tracking
health strip, and the recommendation scorecard (hidden until one arrives).

There is **no chart library** in this project. All charts are hand-rolled SVG.

---

### Layer 7 — Guardrails / the circuit breaker (`20260908_meta_ad_guardrails.sql`)

**Migration APPLIED to prod 2026-09-08** (as `meta_ad_guardrails`). Nothing is
wired to it yet — no cron, no panel, and `meta-ads-alerts` does not call the
evaluator. The tables are live and empty; that is correct with no ad spend.
Verified on apply: 3 tables with RLS + 1 policy each, 6 rules seeded, and the
ungated core returned **0 rows rather than NULL** when called without a
founder JWT — which is the exact case that would have silently disabled it.

Threshold rules over our own spend-to-bookings data, replacing the Meta
`subscriptions` rules engine we cannot have (§12). Founder's decision on the
shape, 2026-09-08:

- **Notify-only.** Token stays `ads_read`. Nothing here pauses an ad.
- **Auto-pause is delegated to ONE crude Ads Manager rule on raw daily spend.**
  The reasoning is worth preserving: Meta's *conversion* counts read ~50% high
  on this account, but Meta's *spend* number is definitionally correct — it is
  what they bill. So Meta's automation is trusted with the one metric Meta
  cannot be wrong about, and our own data judges everything else.
- **"Must pay for itself now"** — an ad is failing if cost per paid ticket
  exceeds the margin on that ticket. Not an LTV/member view. Revisit if the
  club ladder starts producing measurable repeat purchases.

Two tables and two functions:

| Object | Purpose |
|---|---|
| `meta_ad_guardrails` | The rules, as ROWS — editable without a deploy. Fixed metric vocabulary in a CHECK, because an unrecognised metric would be a rule that silently never fires. |
| `meta_ad_guardrail_events` | Every breach, whether or not the push landed. Doubles as the cooldown ledger and as the panel's history. |
| `meta_ad_guardrail_breaches()` | Ungated core. **Granted to `service_role` ONLY.** |
| `get_meta_ad_guardrail_breaches()` | Founder-gated wrapper for the panel. |

**Why two functions and not one.** `is_admin_strict()` reads
`auth.jwt() ->> 'email'`, so it is FALSE for the cron's service-role key. A
single founder-gated function would hand the cron a NULL and the breaker would
never fire — silently, looking healthy. That is the §9 failure class exactly.

Six enabled rules: **cost per ticket above the ad money the ticket leaves**,
Rs.1,000 spent with leads but no tickets, Rs.500 spent with no leads at all,
frequency over 3, CTR under 0.5%, and spend with zero tagged sessions. A seventh
row, `cpa_over_40pct`, is kept **disabled** — see below.

**The cost rule changed on 2026-09-18 and this is the current one.**
`cpa_over_ad_budget` (`threshold_mode = 'pct_of_ad_budget'`, threshold 100)
fires when an ad's cost per paid ticket passes **money paid at booking minus
`cost_per_ticket`** — the founder's rule, §21.6. It replaced `cpa_over_40pct`,
which is now `enabled = false` but deliberately still a row, so the history that
names it keeps explaining itself. Details and verification in §21.7 item 1.

Three design points that took a dry run to get right:

- **The threshold is a PERCENTAGE of a per-ticket figure, never a flat rupee
  ceiling.** Tickets run Rs.299 to Rs.3,700; Rs.200 CAC is suicide on one and a
  steal on the other. `pct_of_ticket_price` scaled to the dominant event's
  `price_full` and was wrong in both directions (§21.6); `pct_of_ad_budget`
  scales to what the ticket actually leaves, ticket-weighted across the plans
  one ad really sold.
- **A `price_full >= 50` floor keeps percentage rules off placeholder-priced
  events.** Live rows exist at Rs.2 and Rs.3 (deliberate real test payments), and
  40% of Rs.2 is an 80-paise ceiling every real ad breaches instantly. **This is
  NOT the amount-based payment filter the founder rejected** — that decision was
  about which payments reach Meta's dataset and is untouched.
- **`untagged_spend` is gated on capture being live, and that gate is the whole
  rule.** Without it the rule fired on EVERY ad — including a deliberately
  healthy fixture — because `flow_analytics.attribution` is NULL on every row
  until `src/attribution.ts` ships, so no ad has tagged traffic. It would have
  told the founder "{{ad.id}} is missing" when the real cause was our own
  undeployed client. "No tagged traffic" is only evidence about the ads once
  something, somewhere, has ever been tagged. Found by the 2026-09-08 wiring
  test, not by review.
- **`spend_without_ticket` and `spend_without_lead` are disjoint on purpose.**
  The first requires `leads > 0` (a CONVERSION problem — they came and did not
  buy); the second is `leads = 0` (a TRAFFIC problem — they never came).
  Overlapping, one dead ad pushed twice about one thing.

Noise floors are copied from Meta's own milestone minimums (impressions >= 1000,
clicks >= 10, spend >= 1000 minor units). An alarm that is always on gets muted,
and muting is how the one alarm that matters gets missed.

**Verified 2026-09-08 by dry run** — the evaluator's logic was run against real
`events` prices with six synthetic ads injected as CTEs (no writes). Every
intended breach fired, a healthy ad stayed silent, and an ad below the floors
was correctly suppressed. What is NOT yet verified: the DDL itself, since the
migration has not been applied.

**WIRED 2026-09-08.** `meta-ads-alerts` now runs in two independent halves: it
drains the webhook inbox, then calls `meta_ad_guardrail_breaches()`, pushes, and
writes `meta_ad_guardrail_events`. Either half can fail without stopping the
other, and they report separately in the response so one number cannot hide
which half broke. Cron job 15 fires it **once a day at 09:07 IST** since 2026-09-17 (§8), after the spend sync so the breaker judges fresh spend. It was every 15 minutes before.

**Pushes are grouped BY AD, event rows are written PER RULE.** The wiring test
had one fixture ad trip four rules at once; four notifications about one ad is
how a founder learns to swipe them away. So: one push per ad led by the most
serious finding (`SEVERITY` in the function — `untagged_spend` first because it
is the only irreversible one), with `+N more` appended. But one event row per
rule, so each rule keeps an independent cooldown and the panel history shows
every finding rather than only the headline.

**The event row is written even when the push FAILS**, which is the opposite of
how the webhook half handles a failed push, deliberately. A webhook event is a
one-shot MESSAGE — lose it and it is gone — so that path retries. A guardrail
breach is DERIVED STATE, recomputed from live spend every run: if it is still
true after the cooldown it resurfaces by itself. Writing the row is also what
ARMS the cooldown, so skipping it on failure would re-push the same breach every
15 minutes for as long as pushes stayed broken.

**Still to do:** surface `meta_ad_guardrail_events` in Growth ▸ Ads. Until then a
push is the only surface, and the table is the only record that it happened.

---

### Layer 8 — Ad volume (`meta-ads-sync` + `20260908_meta_ad_volume.sql`)

**Migration APPLIED to prod 2026-09-08** (as `meta_ad_volume`). `meta-ads-sync`
**WAS redeployed 2026-09-08 19:49 (v7)** and the live function now carries the
ads_volume step — an earlier version of this paragraph still said it had not
been, which is the stale-handoff failure this document exists to prevent;
re-check `list_edge_functions` rather than trusting the sentence.
`meta_ad_volume_snapshots` is nevertheless still empty, and that is CORRECT:
`/ads_volume` returns an empty list on an account with no ads, and the sync
writes nothing rather than inventing a zero row.

A second, small call from `meta-ads-sync` to `/act_<ID>/ads_volume`. **It is not
here for the per-Page ad limit** — 250 ads at this spend tier is not a constraint
on a business running a handful, and nobody should build for it. It is here for
two things `/insights` structurally cannot report:

- **Ads that are IN REVIEW.** They have not spent, so they have no insights row,
  so `meta_ad_daily` cannot see them. This is the only cheap way to know an ad
  exists before it costs anything.
- **`recommendations` → `learning_limited`.** Meta's own read of whether an ad
  set can gather enough conversions to leave the learning phase — the predicted
  failure at this account's volume, and not computable from our data.

`meta_ad_volume_snapshots` is a **change-only** log: a row is written only when
something differs from the previous snapshot for that actor. `meta_ads_sync_log`
already records that a run happened; this records that something changed.
`get_meta_ad_volume_status()` is the founder-gated reader.

Four things that took care:

- **Non-fatal by contract.** It runs after the spend upsert and is wrapped so it
  cannot fail the request. Spend is the critical path.
- **`await`ed, not fire-and-forget.** An edge function's runtime can be torn down
  when the response returns, so a detached promise would be killed mid-insert on
  some runs and not others — data that looks intermittently self-changing is
  worse than no data.
- **Try-then-fallback on `fields=`.** An unknown field name is a hard 400, not an
  omission, and this API's documented field list has disagreed with its actual
  response in both directions (§9). So: ask for everything, and on refusal take
  the bare breakdown. A degraded response deliberately compares only the count —
  comparing its absent fields against a full previous row would write a
  "changed to null" row every six hours.
- **`recommendations` shape is accepted two ways** — bare strings, or objects
  with `recommendation_type`. Meta documents the former; sibling list fields on
  this API use the latter. Guessing wrong fails silently, and a
  `learning_limited` that never matches is a warning that never arrives.

**`untracked_ads` has two causes and the RPC says which.** It counts ads running
with no tagged funnel traffic, which is empty both when `{{ad.id}}` is missing
AND when our own attribution client has not shipped. Those need opposite
responses, so `capture_live_since` is returned alongside: NULL there means blame
us, not the ads. **Right now it is NULL**, so until that client ships this metric
reads every ad as untracked — correctly, but for our reason rather than Meta's.

---

### Layer 9 — Ad set config + the learning-phase check (`20260909_meta_adset_config.sql`)

**Migration APPLIED and `meta-ads-sync` DEPLOYED 2026-09-09.**

`/insights` says what an ad DID; this says what an ad set was TOLD TO DO. The gap
is where the most expensive mistake in this account lives — §10 records a real
ad set optimising for `PURCHASE` when the business produces ~10 purchases a week
against Meta's ~50-in-7-days bar. A human found that by reading the config once.
This makes it a standing check.

`meta_adset_config` (upsert per ad set, `config_changed_at` moves only on a
meaningful diff) + `meta_adset_optimization_warnings()` (service_role) +
`get_meta_adset_health()` (founder-gated).

**The test is deliberately conservative, and that is what makes it actionable.**
It grades the optimisation event against **site-wide** weekly volume — every
visitor, paid and organic. An ad set only ever wins a fraction of that, so
site-wide is a hard upper bound. `impossible` therefore means: *even capturing
100% of everything the business produces, this ad set could not reach 50 a week.*
That claim needs no assumption about traffic share, cost per event or budget.
`tight` (under 3x the bar) is a judgement call and deliberately does NOT push.

**Measured 2026-09-09**, four-week average, distinct sessions:

| Optimise for | Our event | Per week | Verdict |
|---|---|---|---|
| `PURCHASE` | paid bookings | **10.3** | impossible |
| `LEAD` | application/details submitted | 17.5 | impossible |
| `INITIATE_CHECKOUT` | book/contact CTA | 52.0 | tight |
| `ADD_TO_CART` | `calendar_opened` | 139.3 | tight |
| `VIEW_CONTENT` | `event_selected` | 184.8 | clears |
| `LANDING_PAGE_VIEWS` | `page_view` | 411.3 | clears |

Four things worth knowing before touching it:

- **The event map's source of truth is `PIXEL_EVENTS` in `src/supabase.ts`.**
  Change that and this check silently grades the wrong number. `reached_pricing`
  is a CUSTOM event and therefore cannot be an optimisation target at all, which
  is why it has no row.
- **Purchases are counted from `applications`, not `flow_analytics`** — they are
  reported server-side from real payments, so that is what Meta's pixel receives.
- **Only `impossible` + `ACTIVE` pushes.** A paused ad set costs nothing, and a
  `tight` verdict is not something the founder can act on with certainty.
  Suppressed 7 days per ad set — this is a setup decision, not an outage.
- **Warnings reuse `meta_ad_guardrail_events` as the ledger**, so there is one
  history and one future panel view. In those rows `ad_id` holds an **ad set**
  id; `metric = 'adset_optimization_goal'` is what disambiguates them.

**Budgets can live on the CAMPAIGN, not the ad set.** The live ad set stores
`daily_budget: null` because the ₹95.76 is set at campaign level. Null here means
"budget is elsewhere", not "no budget". Values arrive in paise and are stored as
rupees (§9, minor units).

#### Targeting, with history (`20260909_meta_adset_targeting.sql`)

The same sync also captures **who** an ad set aims at.
`meta_adset_config.targeting` is the current spec;
`meta_adset_targeting_history` appends one row per distinct VERSION, written by
`record_adset_targeting()` (service_role only).

**A plain column would not have been enough, and that is the point.**
`meta_adset_config` is upserted every sync, so a lone `targeting` column would be
overwritten the moment the audience is edited — destroying exactly what it was
meant to preserve. This is the same shape as `applications.selected_date` and
`assigned_marketer_id`, whose in-place overwriting produced two confidently wrong
historical answers on 2026-08-07/08. **Not backfillable**: every edit made before
2026-09-09 is already gone.

**The comparison runs in SQL, not TypeScript.** Meta returns the targeting object
with no guaranteed key order, so a `JSON.stringify` diff in the edge function
would report a change every time Meta reordered keys — writing a new version four
times a day and burying the real edits. Postgres `jsonb` equality is key-order
independent and duplicate-key normalised. Verified by running the sync twice:
1 version then 0, with the existing row's `last_seen_at` extended.

**`first_seen_at` is an OBSERVATION time, not the edit time.** The sync is
6-hourly, so a version's true start is somewhere in the preceding six hours. That
matters only for a same-day attribution question, and it is why the lookup was
left as a documented four-line query (§6) rather than hidden behind a helper
implying precision the data does not have.

**The trap: absence means "on Meta's default", not "off".** The raw Graph
`targeting` field returns only EXPLICITLY-CONFIGURED keys — for the live ad set
exactly four (`age_min`, `age_max`, `geo_locations`, `targeting_automation`).
Every `effective_*` field is computed by Meta and returned separately. So a
missing `publisher_platforms` does not mean placements are off; it means none was
ever chosen, so Advantage+ placements is running everything — which is why
`rewarded_video` on Audience Network is live. **Never write a check that reads a
missing key as disabled.** The capture enriches itself: choose a placement by
hand and those keys start appearing, versioned like everything else.

#### Effective placements, with history (`20260918_meta_adset_placements.sql`)

**BUILT 2026-09-18, `meta-ads-sync` v20; the Audience Network push added in
v21.** The paragraph above says what is
missing; this is what now reads it. The ad set step also asks for the seven
`effective_*` placement fields, and `record_adset_placements()` stores them with
every array sorted, beside the list of which of those keys the ad set itself
explicitly carries — so a check can tell a decision from a default.

**Meta accepts those field names and currently returns none of them** for the
paused, never-delivered ad set, which is why `meta_adset_placement_warnings()`
reports `placements_unknown` rather than nothing. Full record, including the
array-order trap that does not carry over from targeting, in §23 "Reels Ads".

#### Learning status, with history (`20260917_meta_adset_learning_stage.sql`)

**BUILT 2026-09-17, `meta-ads-sync` v16.** The same ad set step reads
`learning_stage_info`: status, results since the last significant edit, when
that edit was, why learning ended.

- **Where it goes.** The current reading lands in `meta_adset_config.learning_*`.
  `meta_adset_learning_history` gets a row only when (status, last significant
  edit) changes.
- **Why it is recorded.** Meta keeps no history of it, and any targeting or
  creative change, a new ad, a pause of 7+ days or a bid-strategy change restarts
  the ~50-result count. So "which edit reset learning" is answerable only from
  this table, read beside `meta_adset_targeting_history`.
- **What reads it.** `get_meta_adset_health()` and the Growth ▸ Ads "Learning
  phase" card (NOT pushed). Nothing pushes.
- **What the sync reports.** `learning_captured:false` means Meta refused the
  field and the sync fell back without it, which is not the same as "no learning
  stage".

Full record in §23, "Optimization Tips".

#### Delivery settings, with history (`20260917_meta_delivery_settings_history.sql`)

**BUILT 2026-09-17, `meta-ads-sync` v17.** A fifth independent step,
`syncDelivery`, reads `/campaigns`, `/adsets` and `/ads`: status,
effective_status, objective, budgets, spend cap and bid strategy. It uses the
same status step-down as insights, so deleted and archived objects record their
final state. `record_delivery_states()` writes one call per level and adds a
history row only when a tracked setting changes.

- **Why.** Meta overwrites these in place, and nothing else here read campaigns.
  The budget on this account lives on the campaign, a pause of 7+ days restarts
  learning, and "switched on but not running" spends nothing, so it is invisible
  to every spend check.
- **What reads it.** `get_meta_delivery_status()` feeds Growth ▸ Ads "What's
  switched on" (NOT pushed). It also explains restarts in the "Learning phase"
  card.
- **No alerts,** by the founder's choice.

Full record in §23, "Ad Campaign Management".

---

### Layer 10 — Insights feature settings (`meta-insights-features`)

Four Ads Insights **breakdowns are opt-in per ad account**. Until the account
enables one, the Insights API simply does not return it. Enabled on
**2026-09-09**, before any spend:

| Feature | State | Why |
|---|---|---|
| `impression_device` | **enabled** | Mobile-first product; which device an impression landed on is a real question. In neither breakdown-restriction list, so off-Meta conversions survive it. |
| `frequency_value` | **enabled** | The distribution behind the scalar `frequency` already in `meta_ad_daily` — i.e. at what frequency performance actually decays, which an average hides. Feeds the creative-fatigue item in §13. |
| `time_of_day_viewer_tz` | **enabled** | `hourly_stats_aggregated_by_audience_time_zone`. **Type 1 — off-Meta conversions are dropped ENTIRELY**, so this answers "what hours does budget burn", never "what hours produce tickets". Enabled anyway because spend-by-hour is actionable and free. |
| `comscore` | **deliberately not enabled** | Comscore markets are a US/Canada TV-market construct with no Chennai relevance, and it is unclear from Meta's doc whether enabling a third-party measurement integration shares anything. Useless plus unclear. |

**`impression_device` is NOT `action_device`.** The latter *is* a Type 2
breakdown and returns the metric without the breakdown value. Two similar names,
different behaviour.

#### Two traps unique to this endpoint

- **The host is not `graph.facebook.com`.** It is
  `https://ads-api.facebook.com/<version>/marketing-api`. Every other Meta call
  in this repo uses the graph host, so reusing that constant yields a 404 that
  reads like "the feature does not exist".
- **Auth is an `Authorization: Bearer` header, not `?access_token=`.** Everything
  else here passes the token as a query parameter. Getting this wrong returns a
  401 that looks exactly like a dead token — sending you to Business Manager
  instead of to the call shape.

`ads_read` is sufficient even for the POST, which is unusual for a write and is
worth re-reading if the enable path ever starts returning 403.

#### The urgency argument was weaker than it looked — recorded honestly

Enabling was pitched as irreversible-if-missed, on the strength of
`insights_effective_date`: Meta's doc says an enabled feature returns data only
from that date forward. **All three came back with that field ABSENT**, which
the doc defines as *effective for all dates*. So no history was at stake here.

Two readings fit and they cannot be told apart from the outside: Meta may grant
full retroactivity, or "all dates" is trivially true on an account with no ad
history. Either way the decision still stands — enabling cost nothing, and the
doc explicitly provides for a date stamp, so waiting until after spend started
would have risked exactly the loss described. **But the alarm was louder than
the evidence supported, and that is worth writing down rather than quietly
enjoying the good outcome.**

#### The function

`meta-insights-features`, deployed `--no-verify-jwt`. Read-only by default,
returning the catalog joined to what is enabled. Enabling requires `CRON_SECRET`
**and** an exact feature name validated against Meta's live catalog rather than a
hardcoded list — the doc defines a `metric` feature type with nothing in it yet,
so the catalog will grow, and each new feature carries the same one-way-door
property. **Meta does not support disabling anything here.**

Worth re-running occasionally for exactly that reason: a new feature appearing in
the catalog is a decision nobody will otherwise be prompted to make.

### Layer 11 — Audiences (`20260911_meta_audience_layer.sql`)

The registry of Website Custom Audiences we rely on, a daily size snapshot of
every audience on the account, and the check that every ad set excludes existing
customers. What Meta's Audience Rules doc changed, the ~1% match finding and the
four drafts are all in **§19**, kept in one place on purpose.

## 6. Database reference

All tables are **founder-gated** (`is_admin_strict()` SELECT policy) with
INSERT/UPDATE/DELETE revoked from `anon` and `authenticated`. Only the service role
writes, from edge functions.

### `meta_ad_daily` — spend, one row per ad per day
PK `(ad_id, date_start)`.

`ad_id, date_start, account_id, ad_name, adset_id, adset_name, campaign_id,
campaign_name, effective_status, currency, spend, impressions, clicks,
inline_link_clicks, reach, frequency, meta_leads, meta_purchases,
meta_purchase_value, synced_at, cpc, cpm, ctr, unique_clicks, outbound_clicks,
quality_ranking, engagement_rate_ranking, conversion_rate_ranking, actions,
action_values, cost_per_action_type`

- `*_ranking` are **string enums**, not numbers: `ABOVE_AVERAGE`, `AVERAGE`,
  `BELOW_AVERAGE_10/20/35`, `UNKNOWN`.
- `actions` / `action_values` / `cost_per_action_type` are the **raw arrays kept
  whole**. `meta_purchases`/`meta_leads` are extracted from them. Meta serves only
  ~37 months of history, so a question asked too late cannot be answered at all —
  keeping the originals means new questions are a query, not a re-sync.

### `meta_account_daily` — what Meta billed per day, account-wide (2026-09-17)
PK `(account_id, date_start)`. `spend, impressions, synced_at`. Meta's
account-level total includes every ad whatever its status, so this is the
reference the per-ad rows are reconciled against on every sync. No row for a
day means Meta billed nothing that day. Details in §23, "Monitoring and
analytics".

### `meta_ads_sync_log` — one row per sync run
Since 2026-09-17 also `status_filter` (which ad statuses the per-ad query asked
for: `all_statuses` normally) and `spend_check` (the per-day comparison with
`meta_account_daily`). Since 2026-09-18 also **`error_subcode`** (bigint).

`id, ran_at, ok, since, until, rows_fetched, rows_upserted, error_code,
error_subcode, error_detail, duration_ms`

**`error_subcode` NULL is a fact, not a blank.** Meta reuses one code for
unrelated failures and separates them only by subcode, and for `error_code`
613 the ABSENCE of a subcode is the diagnosis: an abuse-prevention quota
reduction rather than a passing throttle. Added with 0 failed runs in history
(57 runs, all ok), so nothing was lost by adding it late. §23, "Rate limiting".

### `meta_ads_events` — webhook inbox
`id, received_at, ad_account_id, field, changed_fields, object_id, object_type,
value, entry_time, dedup_key, handled_at, handled_note`

`handled_at` / `handled_note` are for a future layer that polls and acts. Nothing
sets them today.

### `meta_ad_guardrails` / `meta_ad_guardrail_events` — the circuit breaker

Rules as ROWS so they change without a deploy; breaches logged whether or not the
push landed. `meta_ad_guardrail_events` is **also the cooldown ledger** — the
evaluator excludes any `(rule_key, ad_id)` with a row inside `cooldown_hours`, so
deleting rows from it re-arms those alerts. Full design in §5 Layer 7.

### `meta_ad_volume_snapshots` — ads running or in review

Change-only log, one row per actor when something differs. Exists for ads **in
review** (no insights row, so `meta_ad_daily` cannot see them) and for Meta's
`learning_limited` recommendation — **not** for the per-Page ad limit, which does
not bind at this scale. Full design in §5 Layer 8.

### The change-only history pattern, used by six tables

Meta overwrites settings in place, exactly as `applications` overwrites its own
past (the note that produced two confidently wrong answers on 2026-08-07/08). So
everything mutable that matters is versioned the same way, and a new table for a
new setting should copy this rather than invent a shape:

- **One row per distinct STATE, not per sync run.** While a state holds, its row's
  `last_seen_at` (and any count) moves forward. A new row means something
  actually changed.
- **The comparison happens in SQL, never in TypeScript.** Meta returns objects
  with no guaranteed key order, and numbers arrive sometimes as strings. `jsonb`
  equality and row `is not distinct from` ignore both; a `JSON.stringify` diff
  would write a false version every sync and bury the real edits.
- **Times are OBSERVATION times.** The sync runs on a schedule, so a change
  happened somewhere in the window before `first_seen_at`. Where Meta supplies
  the real moment (`last_sig_edit_ts`), that is stored separately.
- **Absence is recorded, not skipped.** "Meta reported nothing" is a reading and
  gets a row (status NULL); "we never asked" is the absence of any reading. An
  object missing from a response is never treated as deleted.
- **Only a service-role function writes.** A founder gate would hand the cron a
  NULL and silently stop the capture (§6 RPC notes).

One rule this list added on 2026-09-18, from the placement build: **sort arrays
before comparing.** `jsonb` equality is key-order independent but
**array**-order sensitive, so a table whose versioned value contains arrays needs
`meta_sorted_jsonb_array()` on the way in or Meta reordering a list writes a
false version. The older four version objects whose arrays sit inside deeper
structures Meta has not been observed to reorder; do not assume that holds for a
new one.

The six: `meta_adset_targeting_history`, `meta_adset_learning_history`,
`meta_adset_placement_history`, `meta_delivery_history`, `meta_audience_snapshots`
(one row per audience per IST day) and, outside Meta, `application_events`.

### `meta_adset_config` / `meta_adset_targeting_history`

Ad set setup, plus an append-only log of every distinct **targeting** spec it has
had. Exists because targeting is mutable in place: edit the audience and the old
one is gone, exactly like `applications.selected_date`. One row per VERSION with
the window it was observed live — not one per sync. Full design in §5 Layer 9.

What was ad set X aimed at on date D:

```sql
select targeting from public.meta_adset_targeting_history
where adset_id = '<id>' and first_seen_at <= '<date>'::timestamptz
order by first_seen_at desc limit 1;
```

`first_seen_at` is an observation time, not the edit time — the sync is 6-hourly.

### `meta_adset_placement_history` (+ `meta_adset_config.placements`), built 2026-09-18

WHERE an ad set's money can go, beside targeting's WHO it reaches.
`meta_adset_config.placements` holds the current reading as
`{ placements, explicitly_set }` — Meta's computed `effective_*` values with
every array sorted, plus the list of those keys the ad set itself explicitly
carries. `placements_observed_at` is stamped even when Meta returns nothing.

**Read the three states before concluding anything.** `placements_observed_at`
NULL means never asked. Set, with `placements -> 'placements'` empty, means Meta
had nothing to report — on this account, an ad set that has never delivered and
whose placements were never chosen by hand. Neither is evidence that Audience
Network is off, which is why `meta_adset_placement_warnings()` emits a
`placements_unknown` row rather than staying silent. Full design in §23,
"Reels Ads".

What placements was ad set X running on date D, and had anyone chosen them:

```sql
select placements -> 'placements'     as running,
       placements -> 'explicitly_set' as chosen_by_hand
from public.meta_adset_placement_history
where adset_id = '<id>' and first_seen_at <= '<date>'::timestamptz
order by first_seen_at desc limit 1;
```

### `meta_adset_learning_history` (+ `meta_adset_config.learning_*`), built 2026-09-17

Where each ad set stands in Meta's learning phase. `meta_adset_config` carries the
current reading: `learning_status`, `learning_conversions`,
`learning_last_sig_edit_at`, `learning_exit_reason`,
`learning_attribution_windows`, `learning_stage_raw` and `learning_observed_at`.
The history table keeps **one row per distinct (status, last significant edit)**,
so a new row means learning started, restarted after an edit, finished or went
limited. While a state holds, the same row's `conversions_last` and
`last_seen_at` move forward. Written only by `record_adset_learning()`
(service role). Full design in §23, "Optimization Tips".

`learning_observed_at` NULL means never read. Read, but `learning_status` NULL,
means Meta reported no learning stage: the ad set is not delivering. What
learning state was ad set X in on date D, and which edit started it:

```sql
select status, last_sig_edit_at, conversions_first, conversions_last
from public.meta_adset_learning_history
where adset_id = '<id>' and first_seen_at <= '<date>'::timestamptz
order by id desc limit 1;
```

### `meta_delivery_objects` / `meta_delivery_history`, built 2026-09-17

On/off state and money for every campaign, ad set and ad. `meta_delivery_objects`
holds the current state, one row per `object_id`, with `level`, `name`,
`campaign_id`, `adset_id`, `status`, `effective_status`, `objective`,
`bid_strategy`, `daily_budget`, `lifetime_budget`, `spend_cap` (**rupees**), `raw`
and `changed_at`. `meta_delivery_history` gets a row only when one of the seven
tracked settings changes; a rename alone adds none. Written only by
`record_delivery_states()` (service role).

- **`status` vs `effective_status`.** `status` is what someone set;
  `effective_status` is what is happening (parents, review, billing). Both are
  stored.
- **Overlap with `meta_adset_config`.** Deliberate: that table covers
  optimisation, audience and learning, and this one covers on/off and money at
  every level.

What was campaign X's budget and on/off state on date D:

```sql
select status, effective_status, daily_budget, lifetime_budget
from public.meta_delivery_history
where object_id = '<campaign id>' and first_seen_at <= '<date>'::timestamptz
order by id desc limit 1;
```

`first_seen_at` is when the 6-hourly sync noticed, not when the change was made.

### `meta_audiences` / `meta_audience_members`
`meta_audiences`: `key, name, description, audience_id, member_count,
last_synced_at, last_error, created_at`

`meta_audience_members`: `(audience_key, phone)` PK, `added_at`, `removed_at`.
Keyed on **phone** because that is this system's person key — the `applications`
unique key is `(event_slug, phone)` and phone is what CAPI hashes into
`external_id`. Keying on anything else splits one person into two.

### `meta_ad_creative_tags` — does every ad carry `{{ad.id}}`? (2026-09-18)

One row per ad CREATIVE, because several ads can share one and the tracking tag
lives on the creative. `creative_id` PK, plus `ad_ids`/`ad_names`, `adset_id`,
`campaign_id`, `effective_status`, `url_tags`, `raw`, `verdict`
(`ok`/`missing`/`wrong`), `has_placement_macro`, `first_seen_at`,
`last_seen_at`, `tags_changed_at`.

**No history table, deliberately:** Meta documents ad creatives as immutable once
created, so `url_tags` cannot drift the way targeting, learning state and
delivery settings do. `tags_changed_at` moves only on a real change, so if that
assumption ever breaks the fact is recorded — **a row there is itself the
finding.** Written only by `record_ad_creative_tags()`. Full design in §23, "The
Instagram Ads API guide set".

### RPCs (all `SECURITY DEFINER` — but they are NOT protected the same way)

| Function | Args | Returns |
|---|---|---|
| `get_meta_ads_performance` | `p_since date, p_until date` | `per_ad`, `daily`, `totals`, `diagnostics`, `judge_min_tickets`. Revenue is ticket money with fees removed (§21.3). Since 2026-09-17, each ad and the totals also carry `enough_to_judge` (paid tickets ≥ 10) and a 95% likely range: `cost_per_ticket_low/high` and `true_roas_low/high` (§23). |
| `get_meta_recommendation_scorecard` | `p_window_days integer` | `recommendations`, `by_type` |
| `meta_audience_membership` | `p_key text` | `phone, email, name, city` — **service role only** |
| `get_meta_ad_funnel` | `p_since date, p_until date, p_ad_id text` | per-ad funnel drop-off + `diagnostics` |
| `get_meta_ad_volume_status` | — | latest ad-volume snapshot per actor + tracking cross-check |
| `get_experiment_feasibility` | `p_cells int, p_lift_pct numeric, p_weeks_history int, p_weekly_sessions int` | per-metric base rate, sample size per cell, weeks-to-answer, and whether each cell clears the learning-phase bar |
| `get_experiment_results` | `p_key text` | per-variant rates + the three guards (SRM, horizon, `client_stamping_live`) |
| `norm_sf` | `z numeric` | upper-tail normal probability, A&S 26.2.17. **Not founder-gated — it is pure arithmetic with no data access.** Max error 7.5e-8, verified against known values 2026-09-09 |
| `payu_fee_split` | `p_amount numeric, p_mode text` | `ticket_amount, fee_amount, fee_rate, method`: a PayU payment split into ticket money and the gateway fee, at the rate for PayU's `mode`. **NULLs when the split does not land on whole rupees** — callers count those as fee unknown, never guess. Pure arithmetic, but EXECUTE revoked from anon/authenticated (only SECURITY DEFINER RPCs use it). Rates mirror `FEE_RATES` in `create-payu-order`. |
| `meta_ad_guardrail_breaches` | — | one row per (rule, ad) currently breaching — **service role only** |
| `meta_adset_optimization_warnings` | — | ad sets aimed at an event we cannot produce 50/week of — **service role only** |
| `record_adset_targeting` | `p_adset_id text, p_targeting jsonb` | appends a targeting version only on a real change — **service role only** |
| `record_adset_learning` | `p_adset_id text, p_info jsonb` | stores one `learning_stage_info` reading and appends a history row only when (status, last significant edit) changes; a NULL `p_info` is recorded as "no learning stage" — **service role only** |
| `record_adset_placements` | `p_adset_id text, p_effective jsonb, p_targeting jsonb` | stores one effective-placement reading (arrays sorted, unknown keys dropped, `explicitly_set` derived from the ad set's own targeting) and appends a history row only on a real change; an empty reading still stamps `placements_observed_at` — **service role only**. Built 2026-09-18, §23 "Reels Ads" |
| `meta_adset_placement_warnings` | — | ad sets running Audience Network, `rewarded_video` or relaxed brand safety, each with `chosen` saying whether it was a decision or Meta's default, **plus a `placements_unknown` row so an unread ad set never reads as a clean one** — **service role only** |
| `meta_sorted_jsonb_array` / `meta_normalise_placements` | `jsonb` / `jsonb, jsonb` | pure helpers behind the above; `search_path` pinned to `''` because they run inside a SECURITY DEFINER chain. EXECUTE revoked from anon/authenticated |
| `get_meta_adset_health` | — | ad set config, current targeting, version counts, warnings, plus since 2026-09-17 `learning` (current reading, with `results_to_exit` 50), `learning_history` (newest 10 states) per ad set, and `learning_capture_since`; since 2026-09-18 also `placements` (effective + explicitly_set + observed_at), `placement_versions`, `placement_warnings` and `placement_capture_since` |
| `poisson_ci95` | `p_n numeric` | `low, high`: approximate 95% interval for a count (Wilson–Hilferty). Within 1% of the exact bounds from 5 up and 2.5% from 3 up; rough at 1–2. EXECUTE revoked from anon/authenticated. |
| `record_delivery_states` | `p_level text, p_objects jsonb` | records a batch of campaigns, ad sets or ads, and returns how many changed. Minor units are converted to rupees; key order and string-vs-number never count as a change — **service role only** |
| `get_meta_delivery_status` | — | one jsonb with four parts: `objects` (current, excluding archived and deleted, with `blocked`); `blocked` (on at every level, yet not ACTIVE; a parent switched off on purpose does not count); `changes` (newest 40, each with fields moved, `off_for_days` on a switch back on, and `first_sighting`/`new_object`); and `learning_restarts` (each restart with delivery changes within ±12 h, including newly created objects). Plus `capture_since` and `last_read_at`. Founder-gated. |
| `get_meta_ad_guardrail_breaches` | — | founder-facing wrapper over the above |
| `meta_booking_prices` | `p_payment_mode text, p_price_advance numeric, p_price_full numeric, p_cities jsonb, p_city_details jsonb, p_city text` | `city, advance, full_price, at_booking`: what one ticket costs the customer **at booking** — the advance on a `split` plan, the whole price on a `full` one. **Mirrors `cityPrices()` in `create-payu-order`, snake_case-only city keys included**, because it has to agree with what is actually charged rather than with what the catalog advertises. A NULL `p_city` falls back to the first configured city. EXECUTE revoked from anon/authenticated. Built 2026-09-18, §21.7 item 1. |
| `get_meta_plan_ad_budgets` | `p_days integer default 90` | Per live paying plan: `at_booking`, `cost_per_ticket`, **`ad_money_per_ticket`** (what a ticket leaves for ads), the plan's own view→ticket rate, `max_cost_per_click` with a 95% range, `enough_to_estimate` (10 paid tickets) and named `warnings`. Founder-gated. Feeds Growth ▸ Ads "What each plan can spend on ads". |
| `meta_creative_tag_verdict` | `p_url_tags text, p_raw jsonb` | `ok` / `wrong` / `missing` for one creative's tracking tags. Searches the WHOLE creative, not just `url_tags`, because parameters put directly in the destination URL track identically and must not raise a false alarm. EXECUTE revoked from `public`, `anon` and `authenticated`. |
| `record_ad_creative_tags` | `p_rows jsonb` | Records a batch of creatives and their verdict; `tags_changed_at` moves only on a real change — **service role only** |
| `meta_ad_tracking_tag_warnings` | — | Live ads whose creative does not carry `utm_content={{ad.id}}`, `wrong` first. Includes PAUSED ads on purpose — **service role only** |
| `get_meta_ad_tracking_tags` | — | Founder-gated: every live creative's verdict, `url_tags`, placement-macro flag, plus `capture_since`, `last_read_at` and a summary. One jsonb (PostgREST's 1,000-row cap). |

**The founder-gated ones return NULL (or zero rows) for a non-founder** — they wrap
their output in `case when public.is_admin_strict() then ... end`. That covers
`get_meta_ads_performance`, `get_meta_recommendation_scorecard`,
`get_meta_ad_funnel`, `get_meta_ad_volume_status` and
`get_meta_ad_guardrail_breaches`.

**FOUR functions are deliberately ungated, and for the same reason:**
`meta_audience_membership`, `meta_ad_guardrail_breaches`,
`meta_adset_optimization_warnings` and, since 2026-09-18,
`meta_ad_tracking_tag_warnings` (plus its writer `record_ad_creative_tags`). All
are called by an edge function **as the service role**, for which
`is_admin_strict()` is false — so adding the usual gate would not secure them, it
would silently disable them. A guardrail evaluator that returns NULL to its own
cron is a circuit breaker that never trips, looking perfectly healthy. Their only
protection is the `REVOKE` on EXECUTE plus a `GRANT` to `service_role` alone.

That is one mechanism where the others have two, so the rule is absolute:
**never grant any of them to `authenticated`.** For `meta_audience_membership`
the cost is every customer's contact details; for `meta_ad_guardrail_breaches` it
is the ad economics; for `record_ad_creative_tags` it is a writer exposed to the
internet. A founder-facing wrapper already exists for each — use it.

**AND THE `REVOKE` MUST NAME `public`, NOT ONLY `anon, authenticated`.** Postgres
grants EXECUTE on every new function to **PUBLIC**, which both client roles
inherit through, and a revoke naming only those two does not touch it. The
creative-tag functions shipped with exactly that mistake on 2026-09-18 and were
anon-callable until the security advisor caught it minutes later. Two further
traps in the same lesson: `information_schema.role_routine_grants` lists grants
**by role name** and so shows nothing for a PUBLIC grant — an empty result there
is not proof — and **`CREATE OR REPLACE` resets a function's ACL**, so the revoke
belongs after it. Verify with `has_function_privilege('anon', …, 'EXECUTE')`,
which resolves inheritance, and confirm with `set local role anon`. Full record
in §23, "The Instagram Ads API guide set".

**`meta_audience_membership` does NOT, and never returns NULL.** It has no internal
founder check at all: it returns real customer PII (phone, email, name, city) to
anyone holding EXECUTE, and throws *permission denied* for anyone who does not. Its
only protection is the `REVOKE` on EXECUTE, granted to `service_role` alone.

That asymmetry is deliberate — `meta-audience-sync` calls it **as the service role**,
for which `is_admin_strict()` is false, so adding the usual gate would break the
audience sync. But it means this function is defended by one mechanism where the
others have two. **Never grant it to `authenticated`.** Doing so while adding a panel
feature would expose every customer's contact details with no second line of defence.
The same warning is attached to the function in the database itself — run
`\df+ public.meta_audience_membership` or read `obj_description` — so it is visible
to anyone inspecting the schema without this document.

**`get_meta_ads_performance` measurement rules — do not change these casually:**
- Bookings bucket by **`attribution.landed_at`** (the click day), not the payment
  day. Spend happens when the click happens; the ticket may be paid three days
  later. Bucketing by payment day would divide today's spend by conversions that
  last week's spend produced.
- Revenue = **ticket money actually received**: every successful payment
  (advance and balance), **with the PayU gateway fee removed** at that payment
  method's own rate by `payu_fee_split()`. Changed 2026-09-16; before that it was
  `payu_payments.amount`, which includes the fee the customer pays on top and
  read 2.4–5% high. The fee is reported beside it (`our_fees`, `totals.fees`,
  `totals.fees_by_method`), never dropped silently. See §21.3 item 3.
- Counts both **bookings** (rows) and **tickets** (`sum(ticket_count)`), because one
  booking can carry several heads on pay-at-venue events. Counting rows alone made a
  four-ticket sale read as one acquisition, i.e. 4x worse than reality.
- The join key is `attribution->>'utm_content' ~ '^[0-9]{6,}$'` — organic tags like
  `link_in_bio` are real attribution but not ad ids and must not join to spend.

---

## 7. Edge functions

Deploy command matters. `verify_jwt` defaults to **true** when the flag is omitted,
and there is no `supabase/config.toml`.

Every function below deploys with `--no-verify-jwt`. The third column is the one
that catches people: **an ✅ means this function bundles `_shared/metaCapi.ts`, so it
must be redeployed whenever that file changes** — see §9.

| Function | verify_jwt | Imports `_shared/metaCapi.ts` |
|---|---|---|
| `meta-ads-sync` | false | — |
| `meta-ads-webhook` | false | — |
| `meta-ads-alerts` | false | — · **needs `X-Meta-Alerts-Secret` since 2026-09-18** |
| `meta-signal-watchdog` | false | — (deliberately: it watches the CAPI path from outside, §22) |
| `meta-audience-sync` | false | **✅** |
| `payu-callback` | false | **✅** |
| `payu-webhook` | false | **✅** |
| `verify-pending-payments` | false | **✅** |
| `capi-lead` | false | **✅** |

Do not trust that column either — re-derive it:
`grep -rl "_shared/metaCapi" supabase/functions/`

**`--no-verify-jwt` no longer means "anyone can call it" for every function.**
Since 2026-09-18 `meta-ads-alerts` checks `X-Meta-Alerts-Secret` against
`app_secrets.meta_alerts_secret` and answers **401** to anything else, **503** if
the secret row is missing. The platform flag is still `false` — it has to be,
because pg_cron sends no JWT — and the gate lives in the function body instead.
So a plain curl at that URL returning 401 is the system **working**, not broken;
§11 says how to exercise it properly. Same shape as `send-admin-push`, which has
gated on `X-Admin-Push-Secret` all along.

The command itself:

```bash
npx supabase functions deploy <name> --no-verify-jwt
```

Omitting the flag sets `verify_jwt: true`, which makes Meta's and PayU's
unauthenticated POSTs return 401 — for `payu-callback` that means **payments stop**.

**After any deploy, verify with the Supabase MCP `list_edge_functions`:**
`updated_at` must have moved AND `verify_jwt` must still read what this table says.

## 8. Cron jobs

| Job | Schedule | Target |
|---|---|---|
| 12 `capi-lead-sweep` | `7 3 * * *` (08:37 IST, daily; was every 15 min) | POSTs to the **`capi-lead`** edge function with `?sweep=1` — catches Leads the browser missed. The job name and the function name differ; the function is the one in the table above. |
| 13 `meta-ads-sync` | `20 3 * * *` (08:50 IST, daily; was every 6 h) | spend, and since 2026-09-08 the `ads_volume` snapshot |
| 14 `meta-audience-sync` | `50 4 * * *` (10:20 IST, daily) | audiences |
| 15 `meta-ads-alerts` | `37 3 * * *` (09:07 IST, daily; was every 15 min) | drains the `meta_ads_events` webhook inbox. **Created 2026-09-08** (`20260908_meta_ads_alerts_cron.sql`). |
| `meta-signal-watchdog` | `41 3 * * *` | is Meta receiving our sales, applications and page events? Once a day, 09:11 IST. **Created 2026-09-16 hourly; made daily 2026-09-17 by the founder** (`20260917_meta_signal_watchdog_daily.sql`). §22. |

**All schedules above are UTC**, which is where reading them wrong starts: job 11
`daily_manager_brief` is `30 12 * * *` and that is the **6pm IST** briefing, not
a lunchtime one.

### Every Meta job runs once a day: the founder's decision, 2026-09-17

**Why.** Asked because the project is on the Supabase free plan. The numbers
put to him first, measured 2026-09-17:
- About 380 edge-function runs a day, ~11,000 a month, against the free plan's
  500,000. The Meta jobs were about 200 a day, ~1.2% of the plan.
- Database 75 MB of 500 MB; all `meta_*` tables together under 1 MB.

He chose everything daily over the recommendation to keep the old schedules.
**Do not re-propose faster schedules unless he asks**, e.g. when ads start
spending or the plan changes. The trade-offs he accepted:
- A failed application send reaches Meta up to a day late. One submitted in the
  10 minutes before the retry runs is never retried.
- Rejected ads and cost-alarm breaches surface up to a day late. The Ads
  Manager daily-spend rule is still the hard stop.
- Growth ▸ Ads is up to a day old.

**The daily order (IST)**, so each job reads what the one before wrote:

| Time | Job | Notes |
|---|---|---|
| 08:37 | `capi-lead-sweep` | **Must stay before the watchdog.** Otherwise the watchdog reads applications the retry is about to send as missing, and two in a row would push a false alarm. It was first put at 09:22 and moved the same day. |
| 08:50 | `meta-ads-sync` | Spend, then the account-level spend check (§23) |
| 09:07 | `meta-ads-alerts` | Cost alarms judge the spend just synced |
| 09:11 | `meta-signal-watchdog` | §22 |
| 10:20 | `meta-audience-sync` | Unchanged |

None of these lands on `:00/:15/:30/:45`, where `verify-pending-payments` and
`cart-abandonment` still run. Those are payment and customer jobs, not Meta
jobs, and were deliberately left alone.

**Every Meta job now passes `timeout_milliseconds := 60000`.** pg_net gives up
after 5 s by default, and `meta-ads-sync` measured 4.0–7.1 s. The job still
finished, but `net._http_response` recorded a timeout for a run that worked. The
runtime can also tear a request down once its caller has gone, and with one run
a day that is a lost day. **Any new cron that calls Meta needs the same.**

**One unverified risk.** Meta's hourly `/stats` may bucket an event by when it
arrived rather than by its `event_time`. If so, an application the daily retry
sends hours late lands in a different hour, and the watchdog's ±1 h matching
reads it as missing. Every lead so far was sent within minutes, so the data
cannot tell. If `lead_server` shows gaps while `lead_sends_failing` is 0, this is
the likely cause.

**Older sections still describe the previous cadences** (6-hourly sync, 15-minute
alerts and retry): the dated narrative in §5, §10 and §16–§18, and comments
inside `meta-ads-sync` and `meta-ads-alerts`. The comments were left unedited
on purpose, so working functions were not redeployed for text. This section and
`20260917_meta_jobs_daily.sql` are the record.

**Two constants lose their job at this cadence.** `meta-ads-alerts`
`REPEAT_SUPPRESSION_HOURS` (6 h) now never triggers between daily runs, so a
persisting rejected ad re-pushes once a day. The guardrail `cooldown_hours`
behave the same way. That is acceptable: once a day about a live problem is the
cadence he chose.

### `succeeded` in `cron.job_run_details` does NOT mean the function worked

`net.http_post` is asynchronous. `cron.job_run_details.status = 'succeeded'` only
says the SQL statement queued the request — it is `succeeded` even when the edge
function returns 500, or 404 because it was never deployed. The real answer is
in **`net._http_response`**, which carries `status_code` and the response body:

```sql
select status_code, left(content, 200), created
from net._http_response
where created > now() - interval '10 minutes'
order by created desc;
```

Verified for job 15 on creation: cron fired at `14:37:00.125`, pg_net recorded
**200** at `14:37:00.147` with `{"ok":true,...,"scanned":0}`. Use this table, not
the cron log, whenever a cron "runs" but nothing happens.

---

## 9. Hard-won lessons — read this section twice

Every item here cost real time to discover. Several came from being wrong in this
project, not from documentation.

### Meta's docs and Meta's API disagree, in both directions
The ads-webhooks doc lists six `ad_account` fields including `effective_status` and
`subscriptions`. The app's actual field list has **seven**, and includes neither of
those. Four overlap; two are doc-only; three are API-only. **Neither list is
authoritative** — only trying the subscription is.

### `effective_status` is subscribed by one name and delivered under another
**This did not happen to us — the field is not available on this app at all.** It is
recorded because the pattern will catch someone eventually. Per Meta's docs you
subscribe with `effective_status`, but Meta delivers it as `field: "field_changed"`
with `value.changed_fields: ["effective_status"]`. A handler matching
`field === 'effective_status'` would never fire, and the symptom is indistinguishable
from Meta sending nothing at all.

### Four different naming conventions for the same object, on the same webhook topic

| Webhook | Object key | Type key |
|---|---|---|
| `field_changed`, `subscriptions` | `object_id` | `object_type` (lower case) |
| `creative_fatigue` | `adgroup_id` | *none* — implied `ad` |
| `with_issues_ad_objects`, `in_process_ad_objects` | `id` | `level` (**UPPER case**) |
| `ad_recommendations` | `ad_object_ids` (**array**) | *none* |

None of this is documented. It was found by pressing **Test** on all seven fields
and reading what arrived. A bare `id` key is too generic to trust, so the handler
only accepts it when `level` is present to say what it refers to.

### Custom Audience Terms are per AD ACCOUNT, not per business
The generic terms page signs for whichever account it defaults to. With four ad
accounts on this business, that was the wrong one — and the second failure was
identical to the first, which reads as "it just doesn't work". Use:
`https://www.facebook.com/ads/manage/customaudiences/tos.php?act=1580469137074269`

### Publishing the app is required for webhooks, NOT for tokens
An unpublished app receives **only dashboard Test payloads**. No production data at
all, "including from app admins, developers or testers". But `ads_read` tokens and
the insights API work fine unpublished — which is why the spend sync worked for a
day before the app was published. Two subsystems, two rules.

### App Review turned out NOT to be needed
A System User token on your own ad account is sufficient. The one-minute test is:
have the founder set the secrets (see §4 — Claude cannot set them), then curl the sync. `190`/`200`/`294` means review; data means done.
Business verification already passes on this business.

**But that answers only half the question, and the two halves use the same
words.** Meta's "Authorization" doc describes two independent axes:

- **Permission access level** (`ads_read` at standard vs advanced access). This
  is the one settled above. The doc: *"If your app is only managing your ad
  account, standard access to the `ads_read` and `ads_management` permissions
  are sufficient."* We only ever touch our own account, so standard is enough
  and no review is required.
- **Marketing API Access Tier** (Limited vs Full). Never applied for, so this app
  sits on the default. The doc is blunt about what that means: Limited access is
  *"Heavily rate-limited per ad account. For development only. Not for production
  apps running for live advertisers."* Full access needs App Review **plus** at
  least **500 Marketing API calls in the last 15 days** with an **error rate
  under 15%**.

**CORRECTED 2026-09-18 — the old arithmetic here is stale in both directions.**
This paragraph used to say we make "roughly 4–6 calls a day" and therefore could
never reach the 500-calls-per-15-days bar (~33/day). Both halves have moved:

- **Our volume grew.** `meta-ads-sync` alone now makes about **8 Graph calls per
  run** (insights, account-level insights for the spend reconciliation,
  ads_volume, ad sets, audiences, and three for delivery settings) on a 6-hourly
  cron, plus the daily audience sync and the daily watchdog. That is roughly
  **35–45 calls a day, i.e. 500–650 per 15 days** — around the threshold rather
  than far below it.
- **But the app-level counter reads zero,** so that estimate cannot be turned
  into a qualification. Checked 2026-09-18 via `devtools_api_usage`:
  `total_calls: 0` over 30 days, `call_quota: 240`, usage 0%, status healthy.
  Marketing API traffic is metered **per ad account** (`x-fb-ads-insights-throttle`,
  `x-ad-account-usage`), not against the app's Graph quota, which is why our
  syncs do not appear there.
- **Only the App Dashboard can settle it:** App Review → Permissions and
  Features shows the tier and the +Upgrade button with the requirement status.
  Founder-side, one look.

The rate limit is still nowhere near binding at this volume, and the throttle
guard in `meta-ads-sync` paces at 75% and stops at 90% (§13 item 4). Do not read
"App Review not needed" as covering the tier: it does not. §23,
"Authorization" carries the decision this feeds.

### Everything monetary in the API is in MINOR UNITS
Paise, for an INR account. ₹299 = `"29900"`. The docs' own examples say
`$10.00 = 1000`, which reads as dollars and quietly means minor units of *your*
currency. Getting this wrong by 100x means an alarm that never fires or always does.

### The `_shared/` bundling trap
`supabase/functions/_shared/*` is bundled at **deploy time**. Editing it changes
nothing live until *every* importer is redeployed, and nothing warns you. This has
already cost two Meta reporting gaps. Importers of `metaCapi.ts` are
`payu-callback`, `payu-webhook`, `verify-pending-payments`, `capi-lead` and
`meta-audience-sync` — **five, and the list grows.** Re-derive it every time with
`grep -rl "_shared/metaCapi" supabase/functions/`; an earlier version of this very
document listed four and omitted the audience sync, which would have left audience
hashing silently drifting from event hashing.

### null and zero are different answers — everywhere
This discipline is applied throughout and must not be "simplified" away:
- `cost_per_booking` is **null**, not 0, when there are no bookings. A chart must
  not draw a line through a number that does not exist.
- The CPA chart breaks the line into segments at gaps rather than joining across.
- The sync uses a null-preserving `num()` rather than `Number(x) || 0` — Meta
  **omits** a metric when it does not apply, which is not zero.
- The recommendation scorecard reports "not measurable" rather than 0% change.
- **An absent error subcode is a DIAGNOSIS, not a missing field.** Meta code 613
  means an ordinary, self-clearing ad-account throttle when it carries subcode
  `1487742`, and an abuse-prevention quota cut — which retrying makes worse —
  when it carries none at all. `classify()` in `meta-ads-sync` treated both as
  retryable until 2026-09-18, and `meta_ads_sync_log` had nowhere to record
  which had happened. Full record in §23, "Rate limiting, versioning and
  overview".
- **The bug this prevents:** the panel originally decided "are we connected to
  Meta?" from `max(synced_at)` on the spend table. A healthy sync of an account
  with no ads writes no rows — so the moment setup started working, the page said
  "Not connected to Meta yet". `meta_ads_sync_log` exists purely to tell "never
  ran" from "ran, found nothing".

### An empty list from a read tool can mean "not allowed to see it" — check a second read

Same discipline as the row above, in a place nobody had hit yet. Looking for the
Page an ad creative needs (§23, "Create an ad creative"), 2026-09-18:

| Read | Result | The wrong conclusion |
|---|---|---|
| `ads_get_ad_account_pages` on `1580469137074269` | `[]` | "there is no Page" |
| `ads_get_ig_accounts` | `[]` | "no Instagram is linked" |
| `ads_get_user_pages` | **"Join Chapter அ"** `1201531216384934` | — the Page exists, and can be advertised as |

The first read is empty because **no ad has ever been created**, so no Page is
promoted under the account yet. The second is empty because our token is
`ads_read` with no `instagram_basic` — the Ads MCP's own tool description says
so, in as many words, and reading the tool doc is what stopped a confident wrong
answer. Two empty arrays, two different causes, neither of them the obvious one.

**The rule: before reporting an absence, find a second read that would show the
thing if it existed.** If there isn't one, report it as *unknown* rather than
*absent* — the Instagram question is still unknown today, and is recorded that
way rather than resolved. An absence you cannot distinguish from a permission
gap is not a finding.

### A SQL verification that prints nothing has not passed — it has not been read

The Supabase MCP's `execute_sql` returns **only the result of the LAST
statement** in whatever you send it, and it does **not** surface `RAISE NOTICE`
at all. Found on 2026-09-18 while proving the `app_secrets` revoke had broken
nothing: a `DO $$ … $$` block ran four permission probes, raised a notice for
each, and came back showing only the unrelated `SELECT` that followed it. The
block had genuinely executed — but every assertion inside it was invisible, and
a block that raises no exception looks exactly like a block whose checks all
passed.

That is the whole trap. **Silence from an assertion is not evidence.** A test
harness whose output you cannot see is worth less than no test, because it
carries the feeling of having checked.

**The fix is to make assertions return ROWS, not messages:** create a temp table
inside the block, insert one row per outcome, and `SELECT` it as the final
statement. Rewritten that way the same probes printed four legible lines — anon
SELECT denied, authenticated SELECT denied, anon INSERT denied, service_role
SELECT works — which is what actually proved the revoke safe. Two smaller
edges from the same session: multi-statement scripts silently drop every result
but the last, so send one question per call or fold them into one `SELECT`; and
`pg_get_functiondef` throws on aggregates, so any sweep over `pg_proc` wants
`where p.prokind = 'f'`.

### A read enum is not the create vocabulary — it is wrong in BOTH directions

`ads_get_field_context` on `objective` (2026-09-18) was checked to settle which
objective name a new campaign accepts (§23, Ad Campaign Management left it open).
It cannot, and the shape of the failure is the useful part:

- It **carries retired names** — `CONVERSIONS`, `LINK_CLICKS`, `BRAND_AWARENESS`,
  `REACH`, `PAGE_LIKES`, `VIDEO_VIEWS`, `MOBILE_APP_INSTALLS`, `CANVAS_APP_*` —
  necessarily, because campaigns created years ago must still read back.
- It **omits current ones**: only four `OUTCOME_*` values appear.
  `OUTCOME_TRAFFIC` and `OUTCOME_APP_PROMOTION` are missing.

So a read vocabulary is a **superset of history and a subset of what is
creatable**, and is evidence for neither question. Only a create call settles a
create question, and creates are out of scope by decision (§15). This is the §9
"docs and the API disagree" pattern relocated into a *tool's own metadata*, which
is a more convincing-looking place to be wrong.

### An opportunity score of 100 can mean "nothing to grade"
Checked 2026-09-07 with zero campaigns ever run: `opportunity_score` came back
**100** and `recommendations` **[]**. That is a degenerate 100 — an account with no
campaigns has nothing to be sub-optimal about — and it is NOT evidence the account
is well configured. It will drop the day the first ad runs, and that drop is
normal rather than a regression. If the score is ever charted, 100-with-no-ads
must be stored as a different fact from 100-with-ads, or the first real campaign
looks like a cliff off a peak that never existed.

### What does and does not send an ad back through review
Changes to **creative, targeting, optimisation goal or billing event** trigger a
fresh ad review; changes to **bid, budget or schedule do not**. So budget can be
tuned on a live ad freely, while a caption tweak stops delivery until it clears
review. Also: an ad that was PAUSED entering review stays paused on exit — it does
not quietly resume spending once approved. This is also why `in_process_ad_objects`
is recorded silently instead of pushed: routine creative edits would otherwise
notify the founder constantly.

### The two ad-object webhooks are two outcomes of ONE workflow
Since v4.0 Meta decoupled the heavy part of ad creation into a **post-processing**
phase, surfaced as the run status `IN_PROCESS`. `in_process_ad_objects` fires when
an object LEAVES that phase; `with_issues_ad_objects` fires when the phase FAILS,
setting the object to `WITH_ISSUES` and explaining itself in **`issues_info`**
(`level`, `error_code`, `error_summary`, `error_message`). Two consequences:
`issues_info` — not `review_feedback` — is where a post-processing failure states
its reason, and a **creative reports this in `status`**, not `effective_status`
like campaigns, ad sets and ads do. `meta-ads-alerts` requests `issues_info` on the
ad and creative nodes only, because it is documented on those and a field a node
does not have is a hard 400, not an omission.

### A paginated sync that stops at its page cap is a silent wrong answer
`meta-ads-sync` follows `paging.next` correctly, but on hitting its 40-page cap it
used to exit the loop and report `ok: true` with a partial row set — and a cost per
booking computed from partial spend is a confident wrong answer, which is worse
than a visible failure. It now logs `page_cap_reached` and marks the run NOT ok so
the panel's stale-data banner fires. The ceiling is 40 x 500 = 20,000 rows, i.e.
~1,400 ads over a 14-day window, so this guards a future account rather than a
present one.

### The HMAC must be computed over the RAW body
Parse to JSON and re-serialise and the signature will never match — and the symptom
reads as "Meta is sending bad signatures", which sends you debugging the wrong end.

### Meta's dashboard Test sends `entry.id = 0`
The real account id is inside `value.ad_account_id`. Storing `"0"` as an ad account
is filing a placeholder as though it were data.

### Translated errors must carry the raw code
The audience sync first reported "Custom Audience Terms have not been accepted", the
founder accepted them, and the identical sentence came back — indistinguishable from
a wrong diagnosis. Every failure now reports Meta's raw `code`/`subcode` **alongside**
the translation. *A translation tells you what to do; the raw code tells you whether
the translation was right.*

### PostgREST `upsert` is checked against UPDATE policies, even ignoring duplicates

`experiment_exposures` is INSERT-only for anon on purpose: no UPDATE policy
exists, so a visitor cannot re-roll their own variant or rewrite the denominator
of a live test. The obvious way to write "first assignment wins" is therefore

```js
.upsert(row, { onConflict: 'experiment_key,visitor_id', ignoreDuplicates: true })
```

which reads as `INSERT ... ON CONFLICT DO NOTHING` and ought to need only the
INSERT grant. **It does not work.** Measured in a real browser on 2026-09-09,
same row, same session, back to back:

| Call | Result |
|---|---|
| `.insert(row)` | OK |
| `.upsert(row, { ignoreDuplicates: true })` | `42501 new row violates row-level security policy` |

PostgREST's upsert path is evaluated against the table's UPDATE policies
whatever the conflict resolution says, so a table with none rejects every
upsert. Use a plain insert and treat error code **`23505`** (unique violation)
as the success it is — the primary key is what enforces first-wins, and it does
so at the database rather than in client code.

**How it was nearly missed, which is the real lesson.** The exposure write was
`await`ed inside a bare `try {} catch {}` with no error check, in the house
fire-and-forget style. So the experiment assigned variants correctly, rendered
them correctly, and recorded **not one exposure** — a test that looks like it is
running and is measuring nothing. Analytics writes are fire-and-forget *for the
user*; that is not a reason to discard the error. Log it.

### AEM event priority cannot be set before the first ad
The Aggregated Event Measurement configuration tool does not exist on an account
with no ad activity — Meta autoconfigures it *from* ad activity. **But changing the
list later pauses every ad using those events for 72 hours** (error `3260008`), so
set the order once, deliberately, after the first campaign is live and then leave it.
An ad set optimising for Purchase will also refuse to publish if Purchase is not
configured on the domain (error `3260007`) — that is the moment the tool appears.

### The 8 AEM slots are ALREADY full, and one is junk
Web AEM allows **8 events per domain**. Checked 2026-09-08 via `ads_get_dataset_stats`:
the dataset is already carrying exactly eight distinct events — `PageView`,
`ViewContent`, `AddToCart`, `InitiateCheckout`, `Lead`, `Purchase`, `ReachedPricing`
(our custom one) and **`SubscribedButtonClick`**. That last one is not ours: there
are zero configured event rules on the pixel (`ads_pixel_event_read` returns `[]`),
so it comes from Meta's **automatic event detection**, which is still on because
`src/metaPixel.ts` deliberately does not call `fbq('set','autoConfig',false)`.
So a slot that could hold a real funnel step is being spent on an auto-detected
button click with no business meaning. Combine that with the 72-hour pause above and
the ordering is: decide the 8 **before** the first campaign, because afterwards every
change costs 72 hours of paused delivery. Adding any new event (e.g. `AddPaymentInfo`)
means consciously dropping one — the two weakest are `SubscribedButtonClick` and
`ReachedPricing`.

**The junk slot can be reclaimed WITHOUT the autoConfig trade-off.** The paragraph
above frames `SubscribedButtonClick` as the price of leaving automatic advanced
matching on, because both ride on `autoConfig`. They do not have to be traded
against each other: Meta's Ads Data Advisor doc says automatic event detection is
switched off on its own in **Events Manager → Settings → "Track events
automatically without code"**, which drops the auto-detected click event while
leaving automatic advanced matching — and the EMQ 9.3 it helps produce — intact.
Confirmed 2026-09-08 that the event is genuinely auto-detected and not ours:
`ads_pixel_event_read` returns `[]`, i.e. zero configured event rules on the pixel.
Do it **before** the first campaign; afterwards the 72-hour pause above applies.

**CORRECTED 2026-09-19 — there was never a trade-off here.** Automatic advanced
matching is **not on** for this Pixel: Meta's own settings file for it (§23,
"Meta Pixel docs") has no `AutomaticMatching` opt-in, only
`AutomaticMatchingForPartnerIntegrations`, which fbevents ignores unless
`AutomaticMatching` is also on. So "the EMQ 9.3 it helps produce" above is
wrong — EMQ comes from `setPixelUserData()` and CAPI — and the reason
`src/metaPixel.ts` gave for not calling `autoConfig` was false. It now does
(`5bcb721`, not pushed): the pixel-scoped form opts the Pixel out of Meta's whole
`AutomaticSetup` group, which stops `SubscribedButtonClick` at source. The
Events Manager switch becomes belt-and-braces once that ships.

### Meta's per-Pixel settings file is the side-effect-free read of what the Pixel is set to do

`https://connect.facebook.net/signals/config/<pixel_id>` is what fbevents.js loads
for our Pixel in every visitor's browser. It is public, needs no token and fires
no event, and it names every feature Meta has switched on for the Pixel and
every restriction it applies — which is why §24 item 4 could be called "not
verifiable through the API" and still be verifiable. Measured 2026-09-19:
- the **bare URL** serves what live browsers load today; a `v=` parameter pins
  an older file (`v=2.9.200`: 17 features; bare: 26 opt-ins, 25 distinct);
- identical bytes for a browser, a server and an Instagram user agent;
- an **unknown** Pixel id gets a ~30 KB file whose plugin is literally
  `/* empty plugin */`.

Read it before asserting what Meta has "switched on" for the Pixel. It is
watched daily by `pixel_config` (§22). Parsing it: find
`fbq.registerPlugin("<id>"`, then `instance.optIn("<id>", "<Feature>", …)` and
`config.set("<id>", "<key>", <json>)` — the JSON must be bracket-matched, not
regex-matched, because values contain braces inside strings.

### An unfiltered dataset-stats read hides auto-detected events

Found 2026-09-19. `ads_get_dataset_stats` with `aggregation=event` and **no**
`event_name` listed no `SubscribedButtonClick` across 7 days, and
`event_total_counts` over 28 days listed none either. The same read **filtered
to `event_name=SubscribedButtonClick`** returned 32 across the month, including
2 in an hour (18 Sep, 09:00 PDT) that the unfiltered read showed without it.
Before reporting an event absent from the dataset, ask for it by name. Same
family as "an empty list can mean not allowed to see it" above.

### Mistakes not to repeat — from the 2026-09-19 Pixel review

Written because the founder asked for it: *"record your learnings in the meta ads
handoff also so future sessions don't make this mistake."*

1. **A "we deliberately don't" is only as true as the fact under it — check the
   fact.** `src/metaPixel.ts` said automatic setup was kept on to protect automatic
   advanced matching, and this section repeated it with a number attached ("the
   EMQ 9.3 it helps produce"). Nobody had checked whether that matching was on. It
   never was, so for a month the Pixel sent junk button-click events and page
   metadata to protect nothing. When you find or write a reason for NOT doing
   something, verify its premise against the live source and write down how it
   was verified. This is the sibling of "Write down a decision's REASON" above:
   that lesson is about recording the right reason, this one is about the reason
   being true.
2. **"Not verifiable" is a claim — look for another read first.** §24 item 4 called
   automatic events unverifiable through the API. The answer was in a public file
   every visitor's browser downloads ("Meta's per-Pixel settings file", above).
   Before recording something as unverifiable, ask what the browser, or Meta's
   own scripts, read.
3. **Never test a Pixel change against the live dataset.** That means not on
   chaptera.in, and not on a hand-made localhost page with the real Pixel id: that is how
   four `AdvancedMatchingProbe…` custom events got into the dataset Meta
   optimises on. Use **`tools/pixel-harness/`** (`preview_start` "pixel-harness",
   port 5199): the real fbevents and the real id behind a CSP that lets nothing
   leave. **Run the control first** and see the thing you expect to remove — a
   clean treatment run without a dirty control proves nothing.
4. **Describe the live site from `origin/main`, never from the working tree.** On
   2026-09-19 three Pixel behaviours differed between them (the AddToCart latch,
   direct-link ViewContent, automatic setup). A "what Meta hears" table built from
   the working tree would have told the founder things his site does not do. Use
   `git show origin/main:<file>`; §5 has the table.
5. **plpgsql: a bare text literal next to a `text[]` is read as an array literal.**
   `v_list := v_list || 'some text'` fails with 22P02 *malformed array literal* —
   but only when that line runs, so the function is created without complaint and
   breaks on its first unusual input. Use `array_append(v_list, '…'::text)`.
   Caught in `meta_pixel_config_verdict` by the "our domain switched off"
   fixture; the ordinary cases never reached that line. It is one more reason to
   always write the fixture for the rare branch.

### Mid-funnel events reach Meta anonymous, and that is correct

`ads_get_dataset_quality` returns an Event Match Quality score for `Lead` and
`Purchase` (both **9.3/10**) and **no score at all** for `ViewContent`,
`AddToCart`, `InitiateCheckout`, `ReachedPricing` and `PageView`. That looks like
a bug in the Advanced Matching work. It is not, and the audit of 2026-09-08
traced every one of those call sites in both flows to be sure.

Those four events all fire from `AppFlow.tsx` **before any identity exists**:
`event_selected` (~1626), `calendar_opened` (~5421), `reached_pricing` (~5586)
and the two CTA events (~5698/5712) all happen upstream of the form that collects
the phone. `setPixelUserData` is already called at the earliest moment identity
exists in each flow — `AppFlow.tsx:535` (invite form submit), `:2001`
(open-event, at OTP request, deliberately moved earlier than OTP *verify*),
`:2162`, and `App.tsx:4580` (receipt). There is no line where identity was in
scope and simply not passed. **The gap is the funnel's shape, not a missing
call.**

The one case that IS recovered is a returning visitor: `App.tsx` (~5551) re-reads
`sessionStorage.bookingPhone` on mount and re-identifies before the first event,
so a reload mid-session carries identity through all of it. Phone only, tab
scoped, deliberately.

Two related things that also look wrong and are not:
- **`fbc` coverage sits at 33-50%** while every other match key is at 100%. `fbc`
  only exists for someone who arrived by clicking an ad, and almost nobody has —
  no ads have run. It rises on its own with spend; it is not a defect to chase.
- **The PayU bill page (`src/PaymentOverlay.tsx`) fires no Meta event at all.** It
  imports `getFbc`/`getFbp` for the server's matching and nothing else.
  `AddPaymentInfo` is the natural standard event for that moment and was
  deliberately NOT added: the 8 AEM slots are full (§9 above), so adding it means
  consciously dropping one. That is a trade to make on purpose, not in passing.

### `event_source_url` can only ever be the bare origin, by construction
Every event — browser and server — reports `https://chaptera.in/`, never a real page
path. Verified in the DB: of 181 `payu_payments` rows, 21 carry a `source_url` and
**all 21 are exactly the bare origin**. This is not a bug in either half; it is two
correct decisions cancelling out. `create-payu-order` (~line 264) and `capi-lead`
(~line 331) deliberately take the URL from the `Referer` header rather than trusting
a client-supplied string — but `vercel.json` sets
`Referrer-Policy: strict-origin-when-cross-origin`, and the call to Supabase is
**cross-origin**, so the browser strips the path and sends only the origin. The
regex `^https://(www\.)?chaptera\.in/` then happily accepts it.
Consequence: no URL-based Custom Audiences and no URL-rule custom conversions.

**Read that precisely: URL *rules* are dead here, the Website Custom Audience rule
ENGINE is not.** Meta's WCA rules filter on three kinds of field — `url`, `event`,
and any custom-data key. Only the first is broken by the bare origin. `event`
matches our event names (`ViewContent`, `AddToCart`, `InitiateCheckout`,
`ReachedPricing`, `Lead`, `Purchase`), and every one of our pixel events already
carries `content_ids` (the event slug), `content_name`, `content_category`,
`city` and `cta_type` as custom data — see `trackEvent` in `src/supabase.ts`. So
rules like "opened the calendar for THIS plan and never purchased" are available
today without touching `event_source_url` at all.

The old line here — that DB-built audiences are "strictly better" — is true about
match quality and false about coverage, and coverage is the point. See §13. If it is ever worth fixing, the fix that
*keeps* the security property is to have the client send only `pathname + search` and
have the server compose `https://chaptera.in` + that validated path — the domain then
stays server-controlled and a client can never inject a foreign one.

### `chaptera.in/aboutus` does not exist
It returns 200 only because the SPA serves `index.html` for any path, so it silently
renders the marketing homepage. The real terms page is `/termsofservice`.

### Full-page document routes must be added to the body-scroll allow-list
`App.tsx` sets `overflow: hidden` on `html`/`body` for every route except an
allow-list, so AppFlow's fixed-height mobile UI only scrolls its inner containers.
The legal pages were fixed-height and happy under it; the moment they became real
documents they were ~3,200px tall inside an 830px viewport with no way down.
**Any future full-page route needs adding to that list.**

### SKAdNetwork is not AEM
Help content that says "assign values 1 through 63 in SKAdNetwork settings" is about
**iOS app installs**. chapter அ has no iOS app. Web AEM is 8 events per *domain*;
SKAdNetwork is conversion values per *app*. Following the app path would configure
something with no effect on web ads.

### `fb_login_id` is not obtainable and not needed
It is the Facebook App-Scoped User ID, available only by implementing **Facebook
Login** on the site. Instagram cannot produce it — an IG account is not an FB
account. EMQ is 9.3 against a bar of 6.0; the Events Manager "you are not sending X"
list is a generic checklist, not a diagnosis.

---

### Purchase optimisation cannot exit the learning phase at this volume

Meta exits an ad set from the learning phase after roughly **50 optimisation
events in 7 days**. Below that the ad set stays "Learning" — delivery is more
expensive and more erratic — and if it cannot get there it is flagged
**`learning_limited`**, which is one of the `recommendations` values the
`ads_volume` endpoint returns.

**Measured 2026-09-08**, site-wide, organic, per week:

| Signal | Sessions/week (4-wk avg) | Against the 50/week bar |
|---|---|---|
| `page_view` → PageView | 466 | — (not an optimisation target) |
| `event_selected` → **ViewContent** | 214 | **4x above** |
| `calendar_opened` → **AddToCart** | 161 | **3x above** |
| `reached_pricing` | 130 | 2.6x above |
| `book_cta_clicked` | 51 | at the bar |
| `details_form_submitted` + `application_submitted` → **Lead** | ~22 | **less than half** |
| paid tickets → **Purchase** | ~6 (10-wk median) | **8x short** |

Weekly paid tickets over the last 10 weeks were 6, 3, 11, 31, 9, 4, 4, 0, 1, 9.
The single best week on record — 31, during an event launch, across ALL traffic —
is still below the bar.

**And these are upper bounds.** The learning phase counts conversions attributed
to THAT AD SET, not site-wide. A new ad set driving, say, 30% of site traffic
would see roughly 48 AddToCarts and about 2 Purchases a week.

Three consequences, and they run against instinct:

1. **Optimising a campaign for Purchase would keep it permanently in learning.**
   Purchase is the obvious choice and, at this volume, the wrong one. The
   realistic optimisation targets are **AddToCart (`calendar_opened`)** and
   **ViewContent (`event_selected`)** — the only two with several times the
   required volume.
2. **One ad set, not several.** Every ad set needs its own 50/week. Splitting a
   small budget across several ad sets to "test creatives" guarantees that none
   of them ever learns, and all of them deliver expensively. Test creatives as
   multiple ADS inside ONE ad set, where the conversions pool.
   **Refinement, verified 2026-09-16 against Meta's help centre (§23): adding a
   new ad to an ad set is itself a significant edit that restarts learning.** So
   launch a round's creatives together, and add new ones in batches rather than
   one at a time.
3. **This does not change what success is measured on.** Delivery is optimised
   on a high-volume proxy; profitability is still judged by
   `meta_ad_guardrails`' `cost_per_ticket`, which counts real paid tickets. That
   split — optimise on the proxy, judge on the cash — is deliberate, and it is
   why the guardrail layer was built on our own bookings rather than on whatever
   event Meta is optimising toward.

Revisit this the moment weekly purchases clear ~50 sustained; until then the
arithmetic does not change.

### EMQ moves with click-id coverage, so it drops when no ads are running

Measured 2026-09-18: **8.0/10** on Lead and Purchase, against 9.3 on 2026-09-08
and 8.0 in the audit before that. Nothing regressed. Every other match key still
reads 100% (email, phone, first name, city, IP, user agent, `fbp`,
`external_id`, country); the one that moves is **`fbc`, the click id, which only
exists for someone who arrived from an ad**. In the 2026-09-08 window some
organic Instagram links still carried one; in the 2026-09-18 window none did.

So: **do not read a fall from 9.3 to 8.0 as a broken Advanced Matching.** Check
`fbc` coverage first, and expect the number to rise on its own once paid clicks
arrive. The bar is 6.0. §24 records the same figure as part of the readiness
check.

### A missing learning stage means "not delivering", not "learned" or "not captured"

Measured 2026-09-16 on the paused, never-delivered ad set: Meta's response
carried **no `learning_stage_info` key at all**, not even a null. This is the
same trap as absent targeting keys (§5 Layer 9), in a new place. Three states
must stay distinct, and the schema keeps them apart:

| State | What the data shows | What it means |
|---|---|---|
| never read | `meta_adset_config.learning_observed_at` IS NULL | The sync never asked. Check `meta-ads-sync`. |
| read, nothing reported | `learning_observed_at` set, `learning_status` NULL | Meta has no learning stage for it: not delivering. |
| read, with a status | `learning_status` = LEARNING / SUCCESS / FAIL | The real reading. |

Never collapse the middle row into "learned" or "no problem". An ad set that
restarts delivery after a pause of 7+ days re-enters learning (Meta help
316478108955072).

### Write down a decision's REASON, not the number that happened to support it

The clearest example in this document. The founder's decision to send Meta the
full ticket value at the advance was recorded as *"founder's call, given ~80% of
advances complete"*. That was a statistic quoted alongside the decision, not the
reason for it. When a pay-at-venue event later collected 36%, the recorded
justification collapsed and the decision looked wrong — so the next session would
have re-opened a settled question. His actual reason never depended on the rate:
the advance is the conversion the ad produced, and a missed balance is usually
about something else (§21.1).

**So: when recording a decision, write the reasoning that would survive the
numbers changing, and mark the numbers as evidence-of-the-day.** The same applies
to the cost-alarm margin basis (§21.6) and to the "no alerts for delivery states"
choice (§15): each is recorded with its why, so a future session can tell a
decision from an assumption.

### Enough tickets to judge is not proven profitable

`get_meta_ads_performance` marks an ad `enough_to_judge` at 10 paid tickets.
That is a floor for **comparing** ads, not evidence an ad makes money. In the
2026-09-17 fixture, an ad at 12 tickets and 1.50× true ROAS still had a likely
range of 0.77–2.61×, which runs below break-even. Always read `true_roas_low`
before calling an ad profitable. Below the floor the panel greys the ROAS rather
than colouring it, because green and red are verdicts (§23).

### Switched on is not running, and a spend alarm cannot tell you

`status` is what someone set; `effective_status` is what is happening. An ad
can be `status` ACTIVE while `effective_status` reads `PENDING_BILLING_INFO`,
`DISAPPROVED`, `PENDING_REVIEW` or `WITH_ISSUES`. **It then spends nothing, so
every alarm built on spend (§5 Layer 7) stays silent, exactly when something
needs attention.** Only a delivery-state read catches it: `meta_delivery_objects`,
shown in Growth ▸ Ads "What's switched on" (§23).

Three rules the build got right only because the fixtures tested them:
- **A parent switched off on purpose is not a blockage.** Pausing a campaign
  turns every ad under it `CAMPAIGN_PAUSED` while the ads' own `status` stays
  ACTIVE. So `blocked` requires the object AND every existing parent to be
  switched on. Without that, pausing one campaign would light up every ad
  beneath it as "broken".
- **A newly created object is a change, not inventory.** Adding a new ad
  restarts learning. So a first sighting more than an hour after capture began
  is `new_object` and counts as a restart cause. The initial capture of what
  already existed does not.
- **Absence is not deletion.** The delivery sync never treats an object missing
  from a read as deleted, so a partial or throttled read cannot invent a change.

**Meta accepted `filtering` on `effective_status` including DELETED on all three
edges** (`/campaigns`, `/adsets`, `/ads`) on 2026-09-16, as it did on insights.
Meta documents that a filter containing DELETED errors on some edges, so the
`STATUS_FILTERS` step-down stays. The status filter used for each edge is
reported in the sync result as `delivery.levels.<level>.status_filter`.

### A doc you cannot use is still a specification worth stealing

The `act_<ID>/subscriptions` endpoint is unavailable to us (§12). The doc for it
is still the most useful thing in the batch, because it is a list — written by
people who watch millions of ad accounts — of **which numbers are worth waking
someone up for**, and **at what floor a number stops being signal**.

Alarmable metrics it names, all of which we already store per ad per day in
`meta_ad_daily` or can derive from it: `spent`, `today_spent`, `yesterday_spent`,
`cpc`, `cpm`, `cpp`, `ctr`, `link_ctr`, `frequency`, `impressions`, `reach`,
`clicks`, `results`, `result_rate`, plus the `cost_per_*_fb` family.

Two design ideas in it are worth copying outright:

- **Milestones fire at every multiple of the threshold**, not once. A spend
  milestone every ₹1,000 paces notifications by *money at risk* rather than by
  the clock, which is strictly better than a daily digest — a quiet day is
  silent and a runaway ad is loud, automatically.
- **The minimum milestone values are a stated noise floor**: impressions ≥ 1000,
  reach ≥ 1000, clicks ≥ 10, spend ≥ 1000 minor units, results ≥ 5. Below those
  a ratio is arithmetic on noise. Any threshold we set should carry the same
  floors — a 0% CTR on 12 impressions is not a finding.

**Our own version of this is strictly more accurate than Meta's would have
been.** Meta's `cost_per_purchase_fb` divides real spend by *Meta's* conversion
count, which this account has measured reading ~50% high. A breaker built on it
therefore fires late, every time, and in the one direction that costs money.
`meta_ad_daily` joined to `applications` divides real spend by real paid
tickets. The only thing Meta's version would genuinely have given us is
**latency** — near-real-time versus the 6-hourly sync — and that gap narrows for
free by running the sync more often.

### `application:ads_rules_engine` — an unverified lead, not a solution

The `application` webhook topic **does** offer a field our app can subscribe to
called `ads_rules_engine`, and its documented payload is the same shape as the
subscriptions one: rule id, account id, ad object id, object type, trigger type,
**trigger field name, current field value**. Its triggers — "metadata
creation/updates, stats milestones, stats changes, delivery insights
modifications" — are `OBJECT_CREATED` / `OBJECT_UPDATED` /
`INSIGHTS_MILESTONE_REACHED` / `INSIGHTS_UPDATED` under other names. §9 already
records that this platform names the same object four ways on one topic, so
that is characteristic rather than surprising.

**What is NOT established**: whether it delivers rules created through the
unavailable API, rules created in the Ads Manager *Automated Rules* UI, or only
events for apps that build rules engines for other advertisers. Nobody has
tested it. Do not design around it until someone has, and note that the
`application` topic is app-scoped — subscribing means receiving app-level
traffic we currently do not receive at all.

The cheap test, when there is a live ad to test against: create one Automated
Rule in Ads Manager, subscribe the field, and see whether anything arrives.

---

## 10. Current state

**Updated 2026-09-09, end of the guardrails + ad-set-config session.** Every Meta-side table is
still empty and that is **correct** — nothing has happened on the ad account yet.
Emptiness here is not evidence of a fault; read `meta_ads_sync_log`'s newest `ok`
for that, never a row count.

| | Count |
|---|---|
| `meta_ad_daily` rows | 0 |
| `meta_ads_events` rows | 0 |
| `meta_ad_volume_snapshots` rows | 0 — Meta returns no actor entries with no ads |
| `meta_ad_guardrail_events` rows | 0 |
| `meta_ad_guardrails` rules | **6, all enabled** |
| `meta_ads_sync_log` runs | growing — the daily cron (08:50 IST since 2026-09-17) fires whether or not there is data. Check `ok` on the newest row, not the count. |
| Recommendations received | 0 |
| Opportunity score | **100 — degenerate**, see §9. Recommendations `[]`. |
| Bookings carrying an ad id | 0 |
| Custom audience members uploaded | 357 across 3 audiences |

Meta reports each of these as exactly `1000 / 1000`. **That is a floor, not a
count, and not a processing placeholder** (corrected 2026-09-11): three lists of
85, 107 and 165 people still read exactly 1,000 three days after upload. Meta does
not reveal a customer list's matched size below 1,000. See §19.
The account also has a pre-existing Pixel-built audience "Website visitors - 180d"
with ~20 people.

### There is already a campaign, and it is configured for the one goal that cannot work

**Read from the live account 2026-09-08.** Both objects are **PAUSED**, so nothing
is burning — but the configuration is worth resolving before anything unpauses.

| Object | Setting |
|---|---|
| Campaign `120248398500750192` | "Founders Meet · Aug 30 · first test", `objective: OUTCOME_SALES`, `daily_budget: ₹95.76`, **PAUSED** |
| Ad set `120248398504180192` | "Chennai +40km · broad · Purchase", `optimization_goal: OFFSITE_CONVERSIONS`, `promoted_object: {pixel_id: 28370453785913523, custom_event_type: PURCHASE}`, `billing_event: IMPRESSIONS`, **PAUSED** |

`billing_event: IMPRESSIONS` with `optimization_goal: OFFSITE_CONVERSIONS` is oCPM,
which is correct and normal. The problem is `custom_event_type: PURCHASE`.

**This is the exact case §9 "Purchase optimisation cannot exit the learning phase"
describes, now instantiated.** Meta needs ~50 optimisation events per ad set per
7 days. Site-wide purchases run ~6/week. At the configured ₹95.76/day — which is
essentially Meta's floor of ₹94.91 — the weekly budget is about ₹670, so even at
a generous ₹180 cost per ticket that is under 4 purchases a week. The ad set would
sit in learning permanently and pay the learning-phase tax for its whole life.

**Rough arithmetic at that budget** (assumed costs-per-event, NOT measured — treat
as an order of magnitude, and replace with real numbers once any spend exists):

| Optimise for | Assumed cost/event | Events/week at ₹670 | Clears the ~50 bar? |
|---|---|---|---|
| `PURCHASE` | ₹180+ | under 4 | **no, by ~13x** |
| `ADD_TO_CART` (`calendar_opened`) | ~₹15–25 | ~27–45 | **borderline** |
| `VIEW_CONTENT` (`event_selected`) | ~₹8–12 | ~55–84 | yes |

The honest trade-off, stated once: optimising for a higher-funnel event finds
people who open calendars, not people who pay. At a ₹299–450 ticket with a short
funnel the correlation is probably decent, but it is a real cost, not a free win.
The standard practice is to start higher-funnel while volume is thin and move down
as it builds — and `meta_ad_guardrails.cost_per_ticket` keeps judging on real cash
throughout, which is exactly why that layer reads our bookings rather than
whatever Meta is optimising toward.

**Not changed by this session.** The stored token is `ads_read`; changing an ad
set is a write we cannot make and would not make unasked.

### What that ad set is actually targeting — read 2026-09-09

Read from the live account. Still PAUSED, so none of this has cost anything yet.

**SUPERSEDED 2026-09-18 for the placement and geo rows — Audience Network is
now OFF and `location_types` is now `["frequently_in","home"]`. The table below is
kept as the 2026-09-09 reading, i.e. the record of what Meta's defaults produced.
Current state is in "CHANGED 2026-09-18" below.**

| Setting | Value |
|---|---|
| Age | **18–65** (the full adult range) |
| Geo | custom location 13.0827, 80.2707 (Chennai), **40 km radius**, `location_types: ["home"]` |
| Audience expansion | `targeting_optimization: "expansion_all"`, `targeting_automation: {advantage_audience: 1}` |
| Platforms | facebook, instagram, **audience_network**, messenger, threads |
| Audience Network positions | `classic`, **`rewarded_video`** |
| Brand safety | `FACEBOOK_RELAXED`, `AN_RELAXED`, `FEED_RELAXED` — the loosest tier |

`location_types: ["home"]` is a good choice and worth keeping: it targets people
who LIVE within 40 km rather than anyone who passed through, which is right for a
club that expects the same faces back.

Three things are worth a decision before this unpauses. None of them is a bug —
they are Ads Manager defaults, which is exactly why they are easy to miss.

- **`rewarded_video` on Audience Network** is the placement where someone watches
  an ad to unlock a life in a mobile game. It is the lowest-intent inventory in
  the entire ecosystem, and it is cheap — so at a ₹95.76/day budget it can absorb
  a real share of impressions while producing nothing. §12 already predicted this
  tension in the abstract ("Meta's `AUTOMATIC_PLACEMENTS` recommendation pushes
  toward exactly the broad placements block lists exist to clean up afterwards");
  this is that prediction instantiated. **DONE 2026-09-18 — Audience Network is
  OFF** (see "CHANGED 2026-09-18" below). The prediction held exactly: nobody ever
  chose this placement, it arrived with Advantage+ and stayed because absence of a
  choice reads as consent.
- **Brand safety is on the RELAXED tier**, meaning ads can be served beside
  edgier content. For a brand whose whole positioning is a curated club (see the
  `brand-vision-lifestyle-club` note), that is a positioning decision being made
  by a default rather than by the founder.
- **Age 18–65** is the widest possible range. With `advantage_audience: 1` Meta
  treats it as a suggestion and expands anyway, so narrowing it is less powerful
  than it looks — but 18–65 also tells Meta nothing about who actually books.

**ABSENCE IN THE STORED `targeting` MEANS "ON META'S DEFAULT", NOT "OFF".**
Discovered on capture, 2026-09-09, and it is the trap in this table. The raw
Graph `targeting` field returns **only the keys that were explicitly configured**
— for this ad set exactly four: `age_min`, `age_max`, `geo_locations`,
`targeting_automation`. Every `effective_*` field in the table above
(`effective_publisher_platforms`, `effective_audience_network_positions`,
`effective_brand_safety_content_filter_levels`) is **computed by Meta and
returned separately**, not as part of `targeting`.

So reading the captured spec and seeing no `publisher_platforms` does NOT mean
placements are off — it means **no placement was ever chosen**, so Advantage+
placements are running everything, which is precisely why `rewarded_video` is
live. Same for brand safety: no key means the relaxed default, not "unset".

Two consequences. First, do not write a check that treats a missing key as
disabled. Second, the capture gets richer on its own: the moment a placement is
chosen by hand, `publisher_platforms` and friends start appearing in `targeting`
and are versioned like everything else.

**TARGETING IS MUTABLE IN PLACE — NOW CAPTURED, as of 2026-09-09.** `meta_adset_config`
records what an ad set optimises FOR but not WHO it aims at. Edit the targeting
and the previous version is gone — the same class of problem as `applications`
overwriting its own history, which produced two confidently wrong answers on
2026-08-07/08 (see the `applications-mutable-state-no-history` note). "Which
audience produced these bookings" is not answerable today and cannot be
backfilled. **BUILT 2026-09-09**: `meta_adset_config.targeting` holds the current
spec and `meta_adset_targeting_history` appends one row per distinct VERSION,
written by `record_adset_targeting()`. The comparison happens in **SQL, not
TypeScript**, because Meta returns this object with no guaranteed key order and a
`JSON.stringify` diff would log a false change whenever Meta reordered keys —
writing a new version four times a day and burying the real edits. Postgres
`jsonb` equality is key-order independent. Verified by running the sync twice:
first run recorded 1 version, second recorded 0 and extended the existing
version's `last_seen_at` window instead.

`first_seen_at` is an OBSERVATION time, not the moment of the edit — the sync is
6-hourly, so a version's true start is somewhere in the preceding six hours. That
only matters for a same-day attribution question, and it is why the lookup was
left as a documented four-line query rather than hidden behind a helper that
would imply precision the data does not have.

### CHANGED 2026-09-18 — Audience Network off, Threads kept

The founder asked for this directly (*"turn off audience network and keep
threads, I don't know why audience network has turned one"*), was told that
leaving Advantage+ placements is all-or-nothing and that his own unpublished Ads
Manager draft could collide with a live edit, and reaffirmed (*"go ahead"*).

**This is the first write this project has ever made to a Meta ad object.** It
is a deliberate one-off on the founder's instruction, NOT a change of posture:
§15's notify-only rule and the `ads_read` stored token both stand. The write went
through the Meta Ads MCP, which authenticates separately from
`META_ADS_ACCESS_TOKEN`.

**Nothing had ever been "turned on".** The ad set carried no `publisher_platforms`
key at all, so Advantage+ placements was running everything — Audience Network
and its `rewarded_video` position included. Absence of a choice was the choice,
which is the trap recorded above.

**What was written** (`ads_update_entity`, ad set `120248398504180192`): the
COMPLETE targeting spec, with `publisher_platforms` set explicitly to
`["facebook","instagram","messenger","threads"]` and `facebook_positions`,
`instagram_positions`, `messenger_positions` and `threads_positions` mirroring
the `effective_*` lists already running, so nothing silently expanded. **The whole
object has to be sent** — Meta replaces `targeting` wholesale, so omitting
`geo_locations` would have wiped the Chennai 40 km radius.

**Verified by reading it back, not from the write response:**

| | Before | After |
|---|---|---|
| `effective_publisher_platforms` | facebook, instagram, **audience_network**, messenger, threads | facebook, instagram, threads |
| `effective_audience_network_positions` | `classic`, **`rewarded_video`** | **key absent** |
| `effective_threads_positions` | `threads_stream` | `threads_stream` |

`effective_status` read `IN_PROCESS` immediately after the write and settled back
to `PAUSED` — the post-processing phase §9 describes, not a fault.

**Messenger was written into `publisher_platforms` but does NOT appear in
`effective_publisher_platforms`.** Not investigated; `messenger_positions:
["story"]` alone is evidently not eligible here. It costs nothing while paused.

#### The new trap: a write response echoes what you SENT, not what Meta STORED

`location_types` was `["home"]` before. `["home"]` was sent; the write response
echoed `["home"]` back; **the stored value is `["frequently_in","home"]`.** Sent
a second time, deliberately, with the identical result. So Meta silently widened
the geo from *people who live here* to *people who live here or are often here* —
the exact setting the table above calls a good choice worth keeping.

**Hypothesis, NOT verified:** `targeting_automation: {advantage_audience: 1}`
forces that expansion. Testing it would mean changing a second setting nobody
asked about, on a live ad set, so it was left alone.

Two lessons, both of the §9 family:

- **Only a read is evidence.** A write response is a receipt for your REQUEST,
  not a description of the RESULT. Read back after every write, every time.
- **An edit can change a field you did not edit.** Diff the whole object
  afterwards, not only the key you meant to touch. This was caught solely because
  the read-back was compared line by line against the before state.

**It is still `["frequently_in","home"]` today.** Whether the Ads Manager UI can
force it back to home-only is unchecked, and is the founder's to look at.

#### It also proved the targeting history works, on a real edit

This is the **first genuine targeting change since capture began on 2026-09-08**.
`meta_adset_targeting_history` recorded it as version 2 on the next sync:

| Version | Platforms | Threads | `location_types` | Window |
|---|---|---|---|---|
| 1 | *(none explicit)* | — | `["home"]` | 8 Sep 18:59 → 18 Sep 11:34 |
| 2 | facebook, instagram, messenger, threads | `threads_stream` | `["frequently_in","home"]` | 18 Sep 14:24 |

§5 Layer 9 said every edit made before 2026-09-09 was already gone, and that the
table existed so the next one would not be. It was not.

**Still open on this ad set, unchanged by this edit:** it optimises for `PURCHASE`
(graded `impossible`), it does not exclude the 107 existing customers, and brand
safety is still on the relaxed tier. All three are in §24.

### What changed on 2026-09-08/09

**The ledger is §18** — every change, with the evidence that proved it live.
Deliberately not repeated here: two copies of a status list is how one of them
goes stale, which is the failure §18's own "Corrections made to this document"
entry is about.

In summary: five migrations applied (guardrails, ad volume, alerts cron, the
`untagged_spend` capture gate, ad-set config + targeting history), five edge
functions deployed, one cron created, and `API_VERSION` moved to v26.0
everywhere. Live object state at the end: **5 new tables, all with RLS; 4
functions granted to `service_role` only; `anon` on none; 3 active meta crons.**
Row counts: 6 rules, 1 ad set, 1 targeting version, 1 `impossible` optimisation
goal, everything else 0 — correct with no ad spend.

### Still NOT live, and what each one costs

| Piece | Where | Why it matters |
|---|---|---|
| **Client stamps the source onto funnel rows** | `src/supabase.ts`, `src/attribution.ts` — working tree, `tsc` clean | The single highest-value unshipped item. Until it lands, `flow_analytics.attribution` is NULL on every row, so: `capture_live_since` stays NULL, `get_meta_ad_funnel()` returns nothing usable, `untracked_ads` cannot distinguish a missing `{{ad.id}}` from our own gap, and the `untagged_spend` guardrail is deliberately silent. **Not backfillable** — every visit that happens before it ships has no source, forever. |
| Growth ▸ Ads "Where the traffic stops" | `src/AdminPanel.tsx` — working tree | the reader for the above |
| Growth ▸ Ads "Is Meta hearing about your sales?" card | `src/AdminPanel.tsx` — working tree, `tsc` clean | the watchdog's only surface besides a push notification (§22). The database side is live; the card is not. |
| A panel view of `meta_ad_guardrail_events` | **WRITTEN 2026-09-09**, in the working tree (`src/AdminPanel.tsx`, Growth ▸ Ads, grouped by ad — see §18) | Not shipped, so a push is still the only surface today. The table is deliberately written even when a push fails, precisely so this view has something to show. |
| A panel view of `get_meta_adset_health()` | **WRITTEN 2026-09-17**: the "Learning phase" card in Growth ▸ Ads, in the working tree, `tsc` clean, **NOT pushed** | It also shows the `impossible`/`tight` optimisation-goal verdicts, which never reach a phone while an ad set is paused or only `tight`. §23. |
| Live end-to-end push test of a **guardrail breach** | the `meta_ad_issue` TYPE is proven — §18 Phase 5 got a real notification onto the founder's phone and he confirmed seeing it | What is still unproven is a breach specifically: the evaluator finding a real ad, grouping by ad, writing the ledger row and pushing. That needs committed fake spend, so it has not been run. The delivery half is no longer in doubt. |
| `{{ad.id}}` in every ad's URL Parameters | founder-side, Ads Manager | stated once in §10 and in `META-ADS-SETUP.md`; the only irreversible-if-missed item |
| Ad set optimising for `PURCHASE` | live account, PAUSED | graded `impossible` by the new check. Not changed by any session — the token is `ads_read` and it is the founder's call. |

**`_shared/metaCapi.ts` — CLOSED 2026-09-09.** It reads `v26.0`, and all five
importers were redeployed again after the last edit (payu-callback v69,
payu-webhook v64, verify-pending-payments v36, capi-lead v9, meta-audience-sync
v9 — see §18). The 90-second edit-after-deploy gap flagged earlier is gone. Still
re-derive rather than trusting this list:

```bash
grep -rl "_shared/metaCapi" supabase/functions/
```

### The trap in the deploy ORDER, which still applies

`notify_admin_push()` posts to `send-admin-push` **fire-and-forget** via
`net.http_post`, so the caller's `pushErr` is `null` even when the receiver
answers "unknown type". Any sender deployed ahead of a `send-admin-push` that
lacks the `meta_ad_issue` case would stamp its row as handled, count a success,
send nothing, and never retry. **Deploy `send-admin-push` FIRST.** Four senders
now depend on that case: `meta-ads-alerts` (both halves), `meta-ads-sync`
(dead-token alert and ad-volume recommendations) and `meta-audience-sync`
(dead-audience alert).

The same fire-and-forget fact is why **`meta_ad_guardrail_events.notified_at`
means "queued without error", not "delivered"**. Real delivery evidence is in
`net._http_response` (§8).

```bash
npx supabase functions deploy send-admin-push --no-verify-jwt && \
npx supabase functions deploy meta-ads-alerts --no-verify-jwt && \
npx supabase functions deploy meta-ads-sync --no-verify-jwt && \
npx supabase functions deploy meta-audience-sync --no-verify-jwt
```

`send-admin-push` is live in the payment-notification path — verify `verify_jwt`
is still `false` afterwards with `list_edge_functions`.

### 2026-09-08/09 — documentation audit: everything changed, and where it stands

Source: a pass over 22 of Meta's own docs — Pixel base code and SPA behaviour,
the Pixel event/parameter reference, Advanced Matching, Custom Audiences, Ads
Data Advisor, Conversions API, Marketing API overview/versioning/rate-limiting,
Insights limits and best practices, Ad Creatives, Optimization Tips, Ads CLI and
the Ads MCP server. Three sub-agents audited the browser funnel, the CAPI path
and the sync in parallel; the live checks came from the Meta Ads MCP and from
curling production directly.

**STATUS TABLE — verified against `list_edge_functions` and `git status` on
2026-09-09, not from memory. Re-verify the same way before trusting it.**

| Change | Where | Status |
|---|---|---|
| `calendar_opened` latched per plan (AddToCart no longer multi-fires) | `src/AppFlow.tsx` → `pingCalendarOpenedOnce()` | working tree — **NOT pushed, inert** |
| `placement` / `site_source_name` captured; unsubstituted `{{macro}}` values dropped | `src/attribution.ts` | working tree — **NOT pushed, inert** |
| `613` added to `RETRYABLE_CODES` + `x-ad-api-version-warning` detector | `meta-ads-sync` | **LIVE** (v10) |
| Insights throttle parsed, paced at 75% / stopped at 90%, `access_tier` surfaced | `meta-ads-sync` | **LIVE** (v11, 2026-09-09) — it rode along on the ad-set-config deploy. Confirmed by a live call returning `"access_tier": "development_access"`. |
| `API_VERSION` v25.0 → **v26.0** in all pins (four then; **five now** — `meta-insights-features` joined the set, see §13 item 5) | `meta-ads-sync`, `meta-audience-sync`, `meta-ads-alerts`, `_shared/metaCapi.ts` | **LIVE** — see §13 item 5 for the deploy table and evidence |
| Stale comment claiming Meta sees the advance, not the full ticket | `_shared/metaCapi.ts` | **LIVE** — comment-only; rode along on the 2026-09-09 importer redeploy |
| Marketing mix modeling (`breakdowns=mmm`) | — | Evaluated and **rejected**; reasoning in §12 |

**Not code — founder-side, and stated once each rather than nagged:**
Events Manager → Settings → "Track events automatically without code" (frees the
junk AEM slot, §9); the `{{placement}}` / `{{site_source_name}}` macros in the
ad's URL Parameters field, which the `src/attribution.ts` change above is inert
without; and `{{ad.id}}`, already tracked in its own section below.

**CLOSED 2026-09-16 — built as `meta-signal-watchdog`, see §22.** The paragraph
below is kept as the reasoning that shaped it.

**Open decision, deliberately not taken:** a revoked or expired
`META_CAPI_ACCESS_TOKEN` stops all server-side Purchase and Lead reporting
**silently** — the only trace is `console.error`. Every good fix touches
`payu-callback` / `payu-webhook`, so it wants to be a one-concern change made on
purpose. Cheapest shape that avoids the payment path entirely: have
`meta-ads-alerts` compare paid bookings in a window against the Purchases Meta
acknowledges, and push on divergence.

**Two sessions were editing and deploying this repo simultaneously on 09-08/09,
and it showed.** A deploy hit `409 Function was deployed concurrently`,
`meta-ads-alerts` appeared mid-session from the other side, and this file grew by
~750 lines underneath an edit. Nothing diverged — the SHAs matched, because both
sides were deploying the same working tree — but the habit that made that safe is
worth keeping: **re-read before writing, and verify deployed state with
`list_edge_functions` rather than trusting any written record, including this
one.** The `_shared/` bundling trap (§9) makes that doubly true, since a repo edit
there is invisible until every importer is redeployed.

**1. AddToCart could fire several times for one visitor.** `calendar_opened` maps
to Meta's `AddToCart`, and it fired inline on every tap of the bottom "Join our
plan" CTA. The calendar is a *closable* sheet, so open → close → re-read the
itinerary → open again is ordinary browsing, not repeated intent. Every other
funnel ping in that file was already latched — `reached_pricing` behind
`if (!selectedMeetingPoint)`, `date_selected` behind `if (!selectedDate)`,
`pingOpenFunnel` behind a per-stage `Set` — this one alone was not. It inflated a
signal Meta optimises delivery on *and* deflated the panel's "Calendar → date
picked %", whose denominator is this step while its numerator is latched. The
latch is module scope, not a ref: `EventDetailsOverlay` unmounts when the sheet
closes, so a ref would reset on exactly the reopen it exists to suppress.

**2. Placement is now captured, and unsubstituted macros are dropped.**
`attribution.ts` gains `placement` and `site_source_name` — which surface the
click came from, Reels vs Feed vs Audience Network. Same day-one logic as
`{{ad.id}}`: a click that lands before the parameter exists never gets one, and
Meta's own breakdown can only say where the IMPRESSIONS went, never which surface
produced a paid ticket. **Needs the matching macros added to the ad's URL
Parameters field** alongside the existing string; confirm the exact spellings in
Ads Manager's URL builder, because Meta's URL macros are not covered by any of
the docs in this batch.

`clean()` now also drops any value containing `{{` or `}}`. A macro that never
substituted arrives literally as `{{ad.id}}`, fails
`attribution->>'utm_content' ~ '^[0-9]{6,}$'`, and makes the booking read as
**organic while still looking tagged** — invisible in exactly the place someone
would look to catch it. Dropping it makes the row honestly untagged, which the
panel's tracking-health strip is built to notice.

**4. The insights throttle header is now acted on, not just logged.**
`x-fb-ads-insights-throttle` was being read into a `console.log` and nothing
else. Meta's "Limits and Best Practices" asks for two things — check the header
on every response, and "add a back-off mechanism to slow down or pause your
/insights queries when you come close to hitting 100% utility" — and only the
first was happening. A header in a log line is not a back-off; the log is only
read after something has already broken.

It is now parsed. At **75%** utilisation (app or account, whichever is nearer)
the sync paces 2s between pages; at **90%** it stops, banks the rows it has, and
reports `ok:false` with `error_code:'insights_throttle_stop'` — the same rule as
the page-cap guard, because a short window that looks complete becomes a wrong
cost-per-booking. It self-heals: the next 6-hourly run re-fetches the whole
lookback window, so there is no state to reconcile.

The header also carries `ads_api_access_tier`, now surfaced as `access_tier` in
the run result. That is the only authoritative answer to which budget we are on,
and the tiers differ by more than two orders of magnitude for insights —
Limited/development access is ~600 calls per ad account per hour against Full
access's ~190,000. Worth knowing before spend makes it matter, not after.
**Full access now needs 500 Marketing API calls in the past 15 days**, reduced
from 1,500; at ~4 calls a day this account does not qualify and does not need to.

**3. `meta-ads-sync` hardening.** Code `613` (ad-account call limit, subcode
1487742) was in neither `RETRYABLE_CODES` nor `PERMANENT_CODES`, so it fell
through to `is_transient` and then `status >= 500` — but Meta returns 613 as HTTP
400 and does not promise `is_transient`, so a plain throttle could be filed as
permanent and abandoned for six hours. A rate limit is transient by definition;
it is now listed. The same deploy added the `x-ad-api-version-warning` reader that
found the v25.0 deprecation within seconds of going live (§13 item 5).

### What the audit checked and found already correct

Recorded so it does not get re-audited: Purchase `value` is stamped once at order
creation as full price x quantity and read identically by all four reporters, with
balance payments skipped on both sides — split and multi-ticket bookings both
report full price exactly once.

**A stale comment in `_shared/metaCapi.ts` said the opposite** and was corrected
on 2026-09-08. It claimed "Meta therefore sees the advance (₹102) rather than the
full ticket (₹299) for split events, so revenue is understated there" — true when
written, wrong since the 2026-09-03 `reported_value` change, which stamps
`prices.full * ticketCount` at order time for every non-balance payment. Found by
reading the deployed bundle back out of `capi-lead` rather than the repo copy.
Worth noting as a pattern: this file's comments are load-bearing — someone
reasoning about whether to trust Meta's revenue number would have believed it.
The fix is comment-only, so it was deliberately NOT given a third redeploy of the
payment path in one day — it rode along on the next importer deploy instead, and
is live as of 2026-09-09. All four Purchase paths use the byte-identical
PayU `txnid` as `event_id`, so a callback/webhook race collapses to one sale. CAPI
failures cannot throw into a payment. No identifier available at a call site goes
unsent. EMQ is 9.3/10 on Lead and Purchase. The root `/` → `/lifestyle` 307
preserves the query string (tested live). No CSP blocks the tracker, and the
service worker bypasses cross-origin so `fbevents.js` is untouched.

Two more results from the same pass, recorded so they are not re-derived:
- **The `_shared/` drift trap was checked and is clean.** The last change to
  `_shared/metaCapi.ts` before this session (commit `9477767`) only added `export`
  keywords — no behaviour change — and its commit message confirms all importers
  were redeployed alongside. So no importer was ever running a semantically
  different copy.
- **`isStaleStatus` does not do quite what its name suggests.** It blocks only a
  *strictly higher* current rank than the incoming one, so `payu-callback` and
  `payu-webhook` can both process the *same-rank* transition for one payment and
  both call `sendPurchaseToMeta`. That is harmless — the shared `txnid`
  `event_id` collapses the pair at Meta's end — but the guard is narrower than
  the name implies, and anyone leaning on it for something other than Purchase
  should check that assumption first.

**CLOSED 2026-09-16 (§22).** **One gap left deliberately unfixed:** a revoked or expired `META_CAPI_ACCESS_TOKEN`
would stop all server-side Purchase and Lead reporting **silently** — the only
record is `console.error`. Every good fix touches `payu-callback` / `payu-webhook`,
so it is a one-concern change to make deliberately, not a drive-by on a payment
path. Cheapest shape: have `meta-ads-alerts` compare paid bookings in a window
against Purchases Meta acknowledges, and push on divergence — no payment-path
change at all.

### The one thing still outstanding, founder-side

**`{{ad.id}}` must be in every ad's URL Parameters field**, in Ads Manager:

```
utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.id}}&utm_content={{ad.id}}
```

Meta substitutes the real numeric ad id at click time, and `src/attribution.ts`
already captures `utm_content`. **This is the entire join between Meta's spend and
our bookings, and traffic that arrives before it is set can never be attributed.**
It is the only irreversible-if-missed item in the whole system. It is stated once in
`META-ADS-SETUP.md` and the panel's tracking-health strip shows it in red if it is
ever missing; do not nag him about it.

---

## 11. How to verify everything still works

Run these when picking up cold, or after any change.

**Two of these are read-only. One is not.** `meta-ads-sync` and the webhook checks
only read from Meta and write locally. **`meta-audience-sync` WRITES to Meta** — it
adds and removes real customers' hashed phone and email in a live Custom Audience.
It is safe to re-run (idempotent, and a no-op when membership has not changed), but
it is an outward-facing action on a third-party platform touching customer PII, and
this project's rule is to ask before those. Do not fire it casually as a health check.

```bash
# READ-ONLY. Spend sync — expect {"ok":true,...}. rows:0 is fine with no ads running.
curl -s -X POST "https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-ads-sync" \
  -H "Content-Type: application/json" -d '{}'

# WRITES TO META. Adds/removes members in live Custom Audiences. Ask first.
# Expect ok:true, and added/removed 0 on a repeat run.
curl -s -X POST "https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-audience-sync" \
  -H "Content-Type: application/json" -d '{}'

# Webhook handshake — must echo the challenge verbatim with 200.
# Substitute the real verify token; it is deliberately not written down here.
curl -s "https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-ads-webhook?hub.mode=subscribe&hub.verify_token=$META_WEBHOOK_VERIFY_TOKEN&hub.challenge=TEST123"

# Webhook rejects a forged signature — must be 401.
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-ads-webhook" \
  -H "x-hub-signature-256: sha256=deadbeef" -H "Content-Type: application/json" -d '{}'

# meta-ads-alerts refuses an unauthenticated caller — must be 401 (§7).
# A 401 here is the system WORKING. There is no curl that makes it run, because
# the secret is deliberately only in the database — use the SQL below instead.
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-ads-alerts" \
  -H "Content-Type: application/json" -d '{}'
```

**To actually RUN `meta-ads-alerts` by hand**, run the cron's own command — it
reads the secret from `app_secrets`, so the value never has to be seen, pasted
or put in a shell history. Then read the reply out of `net._http_response`,
because `net.http_post` is asynchronous and returns only a request id (§8):

```sql
select net.http_post(
  url := 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-ads-alerts',
  body := '{}'::jsonb,
  headers := jsonb_build_object(
    'Content-Type',         'application/json',
    'X-Meta-Alerts-Secret', COALESCE(
      (select value from public.app_secrets where name = 'meta_alerts_secret'), '')
  ),
  timeout_milliseconds := 60000
) as request_id;
-- then, a few seconds later, with the id it returned:
select status_code, left(content, 200), created from net._http_response where id = <request_id>;
-- healthy looks like: 200 {"ok":true,...,"guardrails":{...}} — both halves reporting.
```

```sql
-- System health in one query.
select
  (select count(*) from meta_ad_daily)      as spend_rows,
  (select count(*) from meta_ads_events)    as webhook_events,
  (select ok from meta_ads_sync_log order by ran_at desc limit 1) as last_sync_ok,
  (select count(*) from meta_audiences where audience_id is not null) as audiences_live,
  (select count(*) from meta_audiences where last_error is not null)  as audiences_failing,
  (select count(*) from cron.job where jobname like 'meta%')          as meta_crons,
  -- meta-ads-alerts FAILS CLOSED (§7). Both of these must be true or the
  -- alerts cron is being refused by its own endpoint and nothing says so:
  -- the secret row must exist, and job 15 must still send it. Deleting the
  -- row, or rewriting that cron command without the header, silences every
  -- webhook-issue alert and every guardrail breach at once.
  (select count(*) from public.app_secrets
     where name = 'meta_alerts_secret' and coalesce(value,'') <> '')  as alerts_secret_set,
  (select count(*) from cron.job
     where jobname = 'meta-ads-alerts'
       and command like '%X-Meta-Alerts-Secret%')                     as alerts_cron_sends_secret,
  -- The last thing job 15 actually got back. 401 = the two above disagree;
  -- 503 = the secret row is gone. Anything but 200 means alerts are dead.
  (select r.status_code from net._http_response r
     where r.content like '%"guardrails"%' or r.content like '%unauthorized%'
     order by r.created desc limit 1)                                 as alerts_last_http,
  (select count(*) from applications
     where attribution->>'utm_content' ~ '^[0-9]{6,}$')               as bookings_tagged_to_an_ad,
  -- Guardrails (Layer 7). enabled_rules dropping to 0 disables the breaker
  -- silently, so it is a health number, not a curiosity.
  (select count(*) from meta_ad_guardrails where enabled)             as enabled_rules,
  (select count(*) from meta_ad_guardrail_events
     where fired_at > now() - interval '7 days')                      as breaches_7d,
  (select count(*) from meta_ad_guardrail_events
     where notify_error is not null
       and fired_at > now() - interval '7 days')                      as breach_pushes_failed_7d,
  -- Ad volume (Layer 8).
  (select count(*) from meta_ad_volume_snapshots)                     as volume_snapshots,
  -- Ad set config (Layer 9). unlearnable_goals > 0 means an ad set is aimed at
  -- an event the whole business cannot produce 50/week of — see §10.
  (select count(*) from meta_adset_config)                            as adsets_synced,
  (select count(*) from meta_adset_optimization_warnings()
     where severity = 'impossible')                                   as unlearnable_goals,
  -- NULL means targeting capture has never run. Versions climbing faster than
  -- ad sets exist means someone is editing audiences — which is exactly what
  -- the history table is for.
  (select count(*) from meta_adset_targeting_history)                 as targeting_versions,
  (select min(first_seen_at) from meta_adset_targeting_history)       as targeting_capture_since,
  -- Placements (§23 "Reels Ads"). adsets_placements_unknown counts ad sets
  -- whose running placements we do NOT know — either never read, or read and
  -- Meta returned none. It is EXPECTED to equal the ad set count while nothing
  -- has ever delivered; it must fall to 0 once an ad set delivers, and a
  -- non-zero value there is the one number that says "do not read a clean
  -- Audience Network verdict as evidence".
  (select count(*) from meta_adset_placement_history)                 as placement_versions,
  (select min(first_seen_at) from meta_adset_placement_history)       as placement_capture_since,
  (select count(*) from meta_adset_placement_warnings()
     where severity = 'unknown')                                      as adsets_placements_unknown,
  (select count(*) from meta_adset_placement_warnings()
     where severity = 'leak')                                         as placement_leaks,
  -- Ad sets already pushed about for unchosen Audience Network (v21). Pairs
  -- with placement_leaks: leaks above 0 while this stays 0 means every leaking
  -- ad set is PAUSED, which is the page-but-not-the-phone case by design.
  (select count(*) from meta_ad_guardrail_events
     where rule_key = 'adset_unchosen_audience_network')              as audience_network_pushes,
  -- True ROAS without fees (§21.3). Successful payments whose gateway fee
  -- cannot be split from the ticket price. 0 is healthy. Above 0 usually means
  -- a fee rate changed in create-payu-order / PaymentOverlay.tsx and
  -- payu_fee_split() was not updated, so those payments count with the fee in.
  (select count(*) from payu_payments p
     cross join lateral payu_fee_split(p.amount, p.payu_response->>'mode') f
     where p.status = 'success' and f.ticket_amount is null)          as payments_fee_unknown,
  -- Learning status (§23). NULL = never captured. Should move once a day (sync is daily since 2026-09-17);
  -- if it goes stale, the adset step of meta-ads-sync has stopped reading it.
  (select min(first_seen_at) from meta_adset_learning_history)        as learning_capture_since,
  (select max(learning_observed_at) from meta_adset_config)           as learning_last_read,
  -- Delivery settings (§23). last_read should move every 6 hours; objects
  -- switched on at every level yet not delivering are shown on the page only.
  (select max(last_seen_at) from meta_delivery_objects)               as delivery_last_read,
  (select count(*) from meta_delivery_history)                        as delivery_changes_recorded,
  -- THE ONE THAT GATES TWO OTHER THINGS. NULL means no funnel row has ever
  -- carried a source, i.e. src/attribution.ts is still unshipped — which keeps
  -- the untagged_spend guardrail silent and makes untracked_ads unreadable.
  (select min(created_at) from flow_analytics where attribution is not null)
                                                                      as capture_live_since;
```

**Did the crons actually reach their functions?** `cron.job_run_details` says only
that the SQL ran — `net.http_post` is asynchronous, so it reads `succeeded` even
on a 404. Use the response table:

```sql
select r.status_code, left(r.content, 120) as body, r.created
from net._http_response r
where r.created > now() - interval '2 hours'
order by r.created desc
limit 20;
```

**Is the breaker actually able to run?** The evaluator is granted to
`service_role` ONLY, so a founder session gets zero rows from it by design. Call
the wrapper instead, and if it returns nothing, that is either "no breaches" or
"you are not `is_admin_strict()`" — check which:

```sql
select public.is_admin_strict()               as am_i_a_founder,
       count(*)                               as breaches_visible
from public.get_meta_ad_guardrail_breaches();
```

**Is the sales watchdog running, and what did it last say?** (§22) It runs once a
day at 03:41 UTC. Six rows per run; `push_decided` marks an alert.

```sql
select check_key, verdict, expected, matched, meta_total,
       detail->'dev_rows_excluded' as test_rows_set_aside, push_decided, checked_at
from public.meta_signal_checks
where checked_at > (select max(checked_at) from public.meta_signal_checks) - interval '1 minute'
order by check_key;
```

To run it by hand: `curl -s -X POST https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-signal-watchdog -H "Content-Type: application/json" -d '{}'`.

**Is any ad spend missing from the per-ad numbers?** (§23) Every spend sync
compares Meta's account-level daily spend with the sum of per-ad rows.
`error_code = 'spend_unaccounted'` on the newest row means they disagree. A
`status_filter` other than `all_statuses` means Meta refused the full filter.

```sql
select ran_at, ok, error_code, status_filter,
       spend_check->>'days_checked' as days_checked,
       spend_check->'mismatched_days' as mismatched_days
from public.meta_ads_sync_log order by ran_at desc limit 1;
```
It only reads from Meta. It answers 429 within 5 minutes of the previous run.

### Recipes for checking a change without leaving a trace

Used throughout 2026-09-16/18 and worth reusing, because this project has no
staging: the database is production and the admin panel is behind Google login.

- **Test a founder-gated RPC, or any writer, in a transaction that undoes
  itself.** Put the fixtures and the calls in a `DO $$ ... $$` block and end it
  with `raise exception 'RESULT %', <jsonb>`. The exception returns the results
  AND rolls everything back, so no rows, no commissions, and no pushes survive:
  `net.http_post` only queues, so a rollback cancels the notification too.
  Afterwards, prove it with a leftover count.
- **Open the founder gate inside that block** rather than weakening the
  function: `perform set_config('request.jwt.claims',
  json_build_object('email', (select email from admin_users where role='admin'))::text, true);`
  Call the function once BEFORE that line too — it must return NULL.
- **Check an edge function's types without Deno.** Copy it to a scratch folder
  beside a `shim.d.ts` declaring `Deno` and the `esm.sh` import, and run `tsc`
  under `strict`. Do the same for the currently deployed copy, so only NEW
  errors count.
- **Change a live RPC by text replacement, not by hand-copying it.** Read
  `pg_get_functiondef(...)`, `replace()` exactly the fragment you mean, raise if
  the fragment is missing, and `execute` the result. It cannot silently drop
  something a session added ahead of the repo, and it is idempotent if you check
  for the new text first.
- **Render panel wording without a browser.** The admin is login-gated, so
  extract the module-level helper into a scratch `.ts` file, run it through
  `ts.transpileModule` in node, and print the sentences for real cases. That is
  how "switched back on after 10 days off" and "something new" were checked.
- **Confirm a Graph field exists before writing code around it:** the Ads MCP's
  `ads_get_field_context` names the level it lives at. `learning_stage_info` was
  verified that way before the build, not after a 400.
- **Always include the fixture that must NOT fire.** Every real bug found by
  testing here was an alarm firing on something healthy, not one staying quiet:
  `untagged_spend` firing on a deliberately healthy ad (2026-09-08), and
  `blocked` nearly firing on every ad under a campaign switched off on purpose
  (2026-09-17). A fixture set where everything fires proves only that the
  wiring works.
- **Test a Pixel change in the sealed harness, never against the live dataset.**
  `tools/pixel-harness/index.html`, started with `preview_start` "pixel-harness"
  (port 5199): the real fbevents with our Pixel id behind a CSP that lets
  nothing leave, every would-be send captured in `window.__sent`
  (`window.__summary()` lists them). Mirror the change in its loader block and
  run `?mode=control` first. §9, "Mistakes not to repeat".

### Signal-quality checks, via the Meta Ads MCP (read-only, no cost)

Three calls, all on `dataset_id` 28370453785913523:

| Call | What it answers |
|---|---|
| `ads_get_dataset_quality` | EMQ composite score **and per-match-key coverage %**. This is the one the old handoff wrongly said did not exist. |
| `ads_get_dataset_stats` (`aggregation: event`) | Which events are arriving and in what volume — this is how the full-8-AEM-slots problem above was found. |
| `ads_get_dataset_stats` + `event_source: WEB_ONLY` / `SERVER_ONLY` | **The browser↔server 1:1 check.** Run the same query twice, once per source, and compare bucket by bucket. |
| ~~`ads_get_dataset_stats` + `aggregation: event_total_counts`~~ | **Never reconcile against this.** It ignores `event_source`, can return nothing for a window full of events, and its totals run below the hourly buckets. Reading it produced a false "Meta sees only 80%" on 2026-09-16 (§22). |

**Baseline measured 2026-09-08** (7-day window), for comparison on any future run:

- EMQ **9.3/10** on both Purchase and Lead.
- Coverage **100%** on `em`, `ph`, `ip_address`, `user_agent`, `fbp`, `external_id`,
  `country`, `fn`, `ct`. The only key below 100% is **`fbc`** (33% Lead / 50% Purchase).
- **`fbc` being low is expected and is NOT a defect while spend is zero** — `fbc` can
  only be built from a real `fbclid`, and today those arrive only from organic
  Instagram links. Re-read this number once traffic is actually paid; that is when a
  low value would mean something.
- Purchase **7 web / 7 server**, identical bucket for bucket. Lead **3/3 on 6 Sep**.
  Two extra browser Leads on 1 Sep are pre-fix ghosts, not a live gap — when checking
  Lead parity, only look at days after 2026-09-06.

The founder can also press **Test** on any webhook field in
App Dashboard → Use cases → Customize → Webhooks → Ad Account, which sends a real
signed payload end to end. That is the only way to exercise signature verification
with the live app secret.

---

## 12. What is deliberately NOT built, and why

| Not built | Why |
|---|---|
| **Threshold rules / `subscriptions` webhook** | **Re-verified 2026-09-08 against the full endpoint spec — still not available, and now for two independent reasons.** (1) *Delivery*: the `ad_account` topic offers our app exactly seven fields — `ad_recommendations`, `ads_async_creation_request`, `creative_fatigue`, `in_process_ad_objects`, `marketing_messages_subscriber_upload_status`, `product_set_issue`, `with_issues_ad_objects`. `subscriptions` is absent, and the spec says the app-level subscribe to that field "is required for notifications to be delivered and must be created first". (2) *Creation*: `POST /act_<ID>/subscriptions` requires `ads_management` plus write access; our system-user token is `ads_read`. Either blocker alone is fatal. **Do not re-check this by reading Meta's docs — they describe the endpoint as though everyone has it. Check `devtools_webhook_list` `list_topics` and look for the field.** See §9 for why the doc is worth keeping anyway. |
| **`tracking_specs` / `conversion_specs` on ads** | **Checked 2026-09-08 against the full spec — unusable and mostly unnecessary.** Three separate reasons. (1) Setting `tracking_specs` is a WRITE on an ad object; the token is `ads_read`. (2) `conversion_specs` has been **read-only since v2.4** and is derived from the ad set's `optimization_goal`, so there is nothing to configure there in the first place — the lever is `optimization_goal` + `promoted_object`, not the spec. (3) The doc itself says a pixel named in `promoted_object` is **tracked automatically**, so for a single-pixel advertiser the main use case is already covered. Also note `tracking_specs` is not even readable through the Ads MCP — it returns in `unknown_fields`. The one genuinely useful thing in that doc is where it points: the ad set's optimisation config, which is what §10 now records for the live campaign. Multi-pixel tracking, app events, `leadgen_quality_conversion` (Lead Ads instant forms) and RSVP specs are all for products we do not run. |
| **`/reachestimate` audience sizing** | **Evaluated 2026-09-09, low value here.** It returns an audience-size RANGE for a targeting spec. Three reasons it earns little: (1) the live ad set runs `targeting_optimization: expansion_all` with `advantage_audience: 1`, so the stated targeting is not the audience Meta will actually use — an estimate of the stated spec measures the wrong thing; (2) Ads Manager already shows this during ad set creation, which is when the decision is made; (3) `estimated_audience_size` is not exposed through the Ads MCP, so it would need a raw Graph call for a number nobody acts on. **The valuable half of that doc is `targeting` itself**, which IS readable (alias `targeting_spec`) and is NOT stored — see §10. Capture the spec, not the estimate. Note also that the doc's opening line, ads in WhatsApp Status, is a placement choice rather than infrastructure; we own the WABA, so it is available, but it needs nothing built. |
| **Click-to-WhatsApp ad conversion reporting (CAPI for Business Messaging)** | **Owner declined 2026-09-21**, asked directly: he does not want ad-started WhatsApp conversations measured. Proposed as #3 of OpenClaw's five CAPI proposals (§27.5). The plumbing is already half there and stays there harmlessly — `whatsapp_inbound.referral jsonb` exists and `api/_wamafy.js:141` forwards the provider's `referral` object — so if a click-to-WhatsApp ad ever runs, the ad-click id (`ctwa_clid`) would be captured without new work. Measured 2026-09-21: **0 of 20 inbound rows carry a referral and no `raw` payload contains "ctwa"** — which reflects our never having run such an ad, NOT the provider dropping the id. Do not read that zero as a bug, and do not re-propose the reporting layer. |
| **Auto-applying recommendations** | The API makes it easy and it is the one automation to argue against. The whole point of measuring your own CPA is to decide for yourself rather than accept Meta's projection. Meta's example actions raise budgets and broaden targeting to US/CA/GB. |
| **Campaign / ad-set rollup views** | The panel is ad-level only. `campaign_id`, `adset_id` and their names are stored on every row, so a rollup is a query change, not a rebuild. |
| **Any write to Meta's ad objects** | The stored token is `ads_read`. Creating/pausing/editing ads is not possible and is not wanted. |
| **`ads_management` on the stored token** | Turned out unnecessary — audience writes succeeded on `ads_read` because the system user has asset-level Full access on the ad account. Do not widen it without a reason. |
| **Subscribing to User / Page / Instagram / WhatsApp webhook topics** | Those deliver *other people's personal data* with no purpose behind it, and the published privacy policy does not cover it. Switch one on only when building the thing that consumes it, and update the policy at the same time. The WhatsApp Business Account topic is genuinely valuable later — free delivery/read logging that AiSensy charges ~₹18k/yr for. |
| **Polling Meta for creative-fatigue context** | Meta's doc recommends polling `impressions, frequency, ctr, cpc, actions, cost_per_action_type` for the last 7 days to diagnose fatigue. `meta_ad_daily` already stores every one of those per ad per day, so the decay shape is a local query. Only the creative's image/copy and the ad set's targeting would still need a poll. |
| **Block lists, both kinds** | *Publisher* block lists (exclude domains/apps; `block_list_management_v2_api_access`) and *content* block lists (exclude specific FB/IG/Threads posts; `brand_safety_content_block_list`). Both need a capability grant, i.e. App Review — which this account needs for nothing else (§9). Their limits say who they are for: 10,000 URLs per publisher list, **2M posts** per content list, 200 lists per third party, 480K calls/hour. That is brand-safety-vendor tooling for many advertisers' accounts. A single advertiser has both outcomes for free in Ads Manager: **choose placements** at the ad set level, and set **content suitability / inventory filter**. Note the tension to meet as a decision rather than a surprise: Meta's `AUTOMATIC_PLACEMENTS` recommendation pushes toward exactly the broad placements — Audience Network, in-stream, Reels, IG profile feed — that block lists exist to clean up afterwards. |
| **ETags / `If-None-Match` on the sync** | Evaluated 2026-09-07 and rejected. Meta's own doc says a 304 **still counts against rate limits** — the saving is bandwidth, which was never our constraint (a 14-day window every 6 hours on a near-empty account). It also adds a real hazard: acting on a 304 means skipping processing, which is only safe if the stored copy is definitely right, so a wrong assumption becomes stale data that looks healthy. |
| **Batch / async request APIs** | The batch, `async_batch_requests` and `asyncadrequestsets` endpoints exist to CREATE and UPDATE ads at volume. We do neither — `ads_read`, no writes. The only read-side use would be batching `meta-ads-alerts`' per-object context polls, which run rarely and cap at 50 rows. `?ids=id1,id2&fields=…` is the simpler form if that ever matters. |
| ~~**Archived-ad stats filter**~~ | **BUILT 2026-09-17, see §23 "Monitoring and analytics".** The objection here, that it could not be verified and a malformed filter would break a working sync, was met two ways. The filter steps down to the old query if Meta refuses it. And an account-level spend reconciliation proves on every run whether anything is missing, whether or not the filter works. |
| **`st` / `zp` / `db` / `ge` in CAPI user_data** | `ct` is already sent. `applications.gender` exists but is **empty on every row**. `zp` and `db` are not collected. At EMQ 9.3 these would move nothing. |
| **Meta Ad Studies — split tests AND lift studies (`/<BUSINESS_ID>/ad_studies`)** | **Evaluated against the endpoint spec and the live account on 2026-09-09. Blocked three ways, and the third is the one that matters.** (1) *Lift is hard-ineligible*: `ads_experiment_check_eligibility` on `act_1580469137074269` returned `eligible:false, NOT_RECOMMENDED` — Meta requires **>= $5,000 spend (~₹4.4 lakh) AND >= 500 optimised conversions in one 90-day window**; we pass only the EMQ leg. Not a near miss. (2) *Creation needs a write*: `POST …/ad_studies` requires `ads_management`; the stored token is `ads_read` by design. Split-test eligibility could not even be evaluated — it needs >= 2 ad entity ids and the account has none. (3) **Volume makes it pointless anyway, and this blocker survives all the money in the world being spent.** A split test must clear TWO independent gates: enough conversions per cell to beat noise, and Meta's ~50-per-cell-per-week learning bar — every cell is its own ad set. Measured over 12 weeks at 402 landing sessions/week: **ViewContent 3.5 weeks, AddToCart 5.5 (both clear), ReachedPricing 7.6, InitiateCheckout 23, Lead 81, and Purchase 203 weeks — about four years.** A 7-cell creative test (Meta's maximum) makes even ViewContent unreadable at 19 weeks. **The trap:** Meta reports a winner and a confidence figure regardless, so a purchase-level test here returns a confident coin flip, and acting on it is a permanent decision made from noise. Note Meta's own admission for Creative Tests (`SPLIT_TEST_V2`) — `winner_ad_object_id` and `winner_confidence` are **always null**; only `high_performer_ids`. That product does not claim a statistical winner at all. `get_experiment_feasibility()` recomputes this table live; **this is why site experiments were built instead — see §17.** Likely read path if a study is ever run from the Ads Manager UI is the account-scoped `GET /act_<ID>/impacting_ad_studies`, NOT the business-scoped edge — **unverified**, no study exists to test against. |
| **Marketing mix modeling (`breakdowns=mmm`)** | Evaluated 2026-09-08 and rejected as *strictly coarser than what we already have*. It is **ad-set level only**, and our entire join is ad level — `utm_content={{ad.id}}` into `meta_ad_daily (ad_id, date_start)` — so MMM rows cannot be matched to a booking at all. It returns **only impressions and spend**, no conversions, and Meta documents the **spend as ESTIMATED**; `meta-ads-sync` already pulls actual spend at finer granularity, and the entire point of Layer 2 is joining Meta's spend to OUR cash, which an estimate undermines. It also cannot be combined with any other breakdown or `action_breakdowns`, and is CSV-async-only (POST → `report_run_id` → poll `async_status` → download `async_report_url`; the legacy `GET /<report_run_id>/insights` read is no longer supported for it), so it needs a second, different code path from the sync JSON pagination we already run. The geo/placement columns it ships (`country`, `region`, `dma`, `device_platform`, `platform_position`, `publisher_platform`, `creative_media_type`) are the only tempting part — and every one of them is obtainable through ORDINARY insights breakdowns at **ad** level, which is where they would actually be useful. **Not lossy to skip:** unlike `{{ad.id}}`, this is backfillable — Meta serves long insights history and Ads Reporting has its own MMM export for historical data. Revisit only when there is genuine multi-channel spend with months of variance to model, which is a different business from the one in §1. |

---

## 13. Obvious next things to build

Not commitments — a menu, roughly in order of value.

1. ~~Act on webhook events.~~ **BUILT 2026-09-07, DEPLOYED + CRONNED 2026-09-09**
   as `meta-ads-alerts`: issues push, in-process rows are recorded silently,
   repeats are suppressed 6h per object, and the context poll is enrichment that
   can fail without losing the alert. Deliberately read-only — the docs' "Example
   actions" all write, and the token is `ads_read`. It now also runs the
   guardrail evaluator as an independent second half (§5 Layer 7), on cron job 15
   every 15 minutes.
   **Still open here: a panel view of past issues and past breaches.** Today a
   push is the only surface for either, so a missed notification is invisible —
   which is exactly why `meta_ad_guardrail_events` is written even when the push
   fails.
2. **Record measurement-quality history automatically.** *Owner said yes,
   2026-09-21.* Today Meta's match-quality score (EMQ) is only ever read by hand,
   and §27.1 shows why that fails: it went **8.0 (3 Sep) → 9.3 (8 Sep) → 8
   (21 Sep)** and the drop sat unnoticed for two weeks, found only because
   someone happened to re-run the call. The graded key set changed underneath us
   too — `fbc` left the feedback list, `ln` arrived at 33.3%.

   **Nothing blocks this, which makes it the only proposal of the five that is
   purely build work.** Access is proven: `ads_get_dataset_quality` on dataset
   `28370453785913523` returned live metrics on 2026-09-21 with the token we
   already hold — the docs' `ads_read` + `ads_management`/`business_management`
   worry did not materialise. **Verify with a real call, not this sentence**, the
   same rule as everything else in §9.

   Shape it as an extension of the watchdog that exists, not a new system:
   - Collect per event: `composite_score`, each `match_key_feedback` coverage %,
     and `data_freshness.upload_frequency`. Store one row per dataset per event
     per run so a history accumulates from day one — the point is the **trend**,
     which cannot be backfilled (§"build for future scale").
   - Fold it into `meta-signal-watchdog` (§22) and its `meta_signal_checks`
     table rather than a new cron. It already runs daily at 09:11 IST, already
     holds a Graph token, and already answers "is Meta receiving our sales?" —
     this is the same question one layer up. **Daily, not more often** (§8,
     owner's standing call on every Meta cron).
   - **Only Purchase and Lead will ever have a score.** The five browser-only
     events (`InitiateCheckout`, `PageView`, `ViewContent`, `AddToCart`,
     `ReachedPricing`) returned no `event_match_quality` block at all, because
     EMQ needs a server counterpart. A panel that renders five permanently empty
     rows looks broken; render only what is scored, and label the rest
     "browser-only, not scored" rather than blank.
   - **A missing score at our volume means "unavailable", never "failed."** The
     composite is computed over very few events, so one low read is noise, not
     decay. Alert on a sustained move, not a single point — and state the small
     sample once rather than suppressing the chart (§"build for future scale").
   - Do **not** rebuild `ln` handling in response to its 33.3%. That is customer
     typing, explained at `_shared/metaCapi.ts:174`, and confirmed against our
     own rows (§27.2).

3. **Surface creative fatigue in the panel.** A `creative_fatigue` event plus the
   7-day decay already in `meta_ad_daily` is a complete story with no extra API call.
4. **Campaign / ad-set rollup** in Growth ▸ Ads. Pure query work.
5. **A lookalike audience**, once `customers_completed` crosses ~100 matched.
6. **Deprecation watch.** `API_VERSION` is pinned in **FIVE** places as of
   2026-09-09 — `meta-ads-sync`, `meta-audience-sync`, `meta-ads-alerts`,
   **`meta-insights-features`** and **`_shared/metaCapi.ts:60`** — and they must
   move together. **This list has now been wrong three times** (three, then
   four, then five): `meta-insights-features` was written after the v26.0 bump
   and arrived already on v26.0, so nothing was broken — but the next bump made
   from a written list would have left it behind. The line number moved too.
   Re-derive, always:
   `grep -rn "API_VERSION = " supabase/functions/`. The shared one is
   the dangerous member of the set: editing it changes nothing live until every
   importer is redeployed, so a version bump there is a **five-function** deploy,
   not a one-file edit (see §9, "The `_shared/` bundling trap", and re-derive the
   list with `grep -rl "_shared/metaCapi" supabase/functions/` rather than
   trusting this sentence).

   **UPDATE 2026-09-16: SIX places, and the list was wrong a fourth time.**
   `meta-signal-watchdog` (§22) pins its own `API_VERSION`, also v26.0. The grep
   found it; the list above did not. All six read v26.0.

   **STATUS 2026-09-09: ALL FIVE READ v26.0** — verified by the grep above, not
   from this list. The three deployed on 2026-09-08 — `meta-ads-sync`,
   `meta-audience-sync` and `meta-ads-alerts` — were moved to
   **v26.0**, deployed, and verified **empirically rather than documentarily** —
   a live call now returns no `x-ad-api-version-warning`, where the same call on
   v25.0 returned *"The call has been auto-upgraded to v26.0 as v25.0 will be
   deprecated."*

   That warning matters more than the doc check that preceded it. The MCP
   deprecations list read **empty** on 2026-09-07 while the live API was already
   auto-upgrading our calls and saying v25.0 would be deprecated — so **the
   response header is the earlier and more truthful signal, and it is the one to
   trust.** This is the same "docs and API disagree" pattern §9 catalogues.

   **`_shared/metaCapi.ts` was moved the same day**, on the founder's explicit
   go-ahead, as the deliberate one-concern change it needed to be. The importer
   list was re-derived with `grep -rl "_shared/metaCapi" supabase/functions/`
   rather than trusted, and all **five** were redeployed in one pass — every
   deploy printing `Uploading asset (<fn>): supabase/functions/_shared/metaCapi.ts`,
   which is the only direct evidence that the shared module actually travelled
   with each one:

   | Function | Version | `verify_jwt` after |
   |---|---|---|
   | `payu-callback` | 66 → 67 | false |
   | `payu-webhook` | 61 → 62 | false |
   | `verify-pending-payments` | 33 → 34 | false |
   | `capi-lead` | 6 → 7 | false |
   | `meta-audience-sync` | 6 → 7 | false |

   **There is no safe smoke test for this one and that is the point.** Every path
   that would exercise it sends a REAL event — a Lead, a Purchase, or an audience
   write. So the verification is what it can be: the deployed bundle demonstrably
   contains the module, `verify_jwt` is still `false` on all five, and
   `grep -rn "graph\.facebook\.com" supabase/functions/` confirms every call site
   interpolates `${API_VERSION}` with no unversioned or second-version call left
   anywhere. The real confirmation is the next live booking reporting normally.

   Meta retires a version roughly every 90 days. Re-derive the pin sites with
   `grep -rn "API_VERSION = " supabase/functions/` rather than trusting any list,
   including this one — that grep is what found the fourth site after two
   written lists had both said "three". `product_todos` is the existing to-do
   table.
6. **Age / gender breakdowns — who an ad reaches vs who books.** The sync takes
   no breakdowns (§5 Layer 2), correctly: off-Meta conversions lose `region`,
   `dma` and both hourly breakdowns entirely. Age and gender **do survive —
   verified 2026-09-08 against Meta's "Insights API Breakdowns" doc**, so this is
   no longer a question to answer before building. The doc restricts off-Meta
   action metrics under exactly two lists: *Type 1* (`region`, `dma`, both
   `hourly_stats_*`) which drops the metric entirely, and *Type 2*
   (`action_device`, `action_destination`, `action_target_id`, `product_id`,
   `action_carousel_card_id/name`, `action_canvas_component_name`) which returns
   the metric without the breakdown value. `age` and `gender` appear in neither
   list, and the doc's permitted-combinations table includes `age`, `gender` and
   `age, gender`, each asterisked as joinable with `action_type`. Two caveats it
   also states: action metrics are unavailable "when there is an attempted
   aggregation across multiple attribution settings", and none of the five
   breakdown-incompatible fields (`app_store_clicks`, `newsfeed_avg_position`,
   `newsfeed_clicks`, `relevance_score`, `newsfeed_impressions`) may be requested
   alongside a breakdown — we request none of them today. Worth it because audience
   composition is a real question for this business, not vanity. Needs its OWN
   table: a breakdown multiplies rows (ad x day x gender) and breaks
   `meta_ad_daily`'s `(ad_id, date_start)` primary key. NOT lossy — Meta serves
   ~37 months of insights, so this is backfillable whenever it is built.

   **One constraint on the backfill, from "Limits and Best Practices":** since
   10 June 2025, `reach` — and with it `frequency` and `cpp` — is **omitted**, not
   errored, from any breakdown query whose `start_date` is more than 13 months
   old. Async jobs can still retrieve it, capped at **10 requests per ad account
   per day**, with their own `x-Fb-Ads-Insights-Reach-Throttle` header to watch;
   past that cap the fields silently disappear again. So a breakdown backfill
   reaching further than 13 months will quietly return reach for the recent half
   and not the old half. Decide up front whether reach matters for this table —
   if it does not, the constraint is irrelevant and the backfill is simple.
7. **PayU settlement reconciliation** so revenue is net of fees — there is a
   separate memory note on this (`payu-docs-mcp-and-settlement-finances`).

### Website Custom Audiences — the one gap our own DB structurally cannot fill

**BUILT 2026-09-11 as a registry with four drafts — see §19. None is on Meta yet.**
The evaluation below is kept because §19 builds on it.

Evaluated 2026-09-09 against Meta's Website Custom Audiences doc. **Not built:
creating an audience is a write to the live ad account and wants an explicit
go-ahead.** Recorded here so the reasoning does not have to be redone.

`meta-audience-sync` (Layer 4) builds **Customer File** audiences, and
`meta_audience_members` is keyed by **phone**. That is the whole limitation in one
line: every audience we have can only contain someone who *identified themselves*
— submitted a form or paid. The visitor who read the plan, opened the calendar,
saw the price and left without typing a phone number is invisible to it forever.
That person is the entire retargeting population, and the Pixel already knows
them.

Three audiences worth having, all expressible with `event` + custom-data rules and
none needing a URL:

| Audience | Rule shape | Why |
|---|---|---|
| Saw the price, did not buy | `event` = `ReachedPricing`, exclude `Purchase` | The sharpest intent signal we emit; §9 calls `ReachedPricing` one of the two weakest AEM slots, but as an audience rule it is the strongest |
| Opened the calendar for a specific plan | `event` = `AddToCart` AND `content_ids` contains the slug | Per-plan retargeting, which the DB audiences cannot express at all |
| All browsers, excluding customers | `event` = `ViewContent`, exclude the existing all-paid Customer File audience | Prospecting exclusion done properly |

Practical notes from the doc, so they are not rediscovered:
- **`prefill` defaults to true and reaches back up to 180 days**, so creating these
  now would backfill from Pixel history rather than starting empty. Not lossy to
  defer, but free to do early.
- **The doc contradicts itself on retention**: the `retention_days` parameter says
  1-180, the FAQ says 365. Trust the parameter table; it is the normative half.
- **Deleting a WCA that an active campaign targets PAUSES that campaign.** Worth
  knowing before anyone tidies up an audience list.
- **`external_id` namespaces do not cross.** The `external_id` we send via CAPI
  (hashed phone) cannot be used to build a Customer File audience, and Customer
  File `extern_id` cannot build a web audience. No current bug —
  `meta-audience-sync` hashes email/phone/name directly — but it is exactly the
  kind of "reuse the id we already have" optimisation that would silently match
  nobody.
- `content_ids` is sent as an ARRAY. The doc's custom-data example uses a scalar
  (`category`), so array matching should be verified on a throwaway audience
  before anything depends on it.

### Found by the 2026-09-08 documentation audit, deliberately NOT built

Raised against Meta's own Marketing API docs and left as decisions rather than
silent changes. Each is real; none is urgent while the account has no ads.

| Open item | Why it was left |
|---|---|
| ~~**`meta-ads-alerts` has no request authentication.**~~ **FIXED 2026-09-18** (founder: "do both the fixes"). It now requires `X-Meta-Alerts-Secret`, injected by cron job 15 from `app_secrets` and checked by the function, which fails closed. The deferral reason recorded here — "decide it when writing the cron" — expired when the cron was created on 2026-09-08. What made it worth doing rather than tidy: idempotence protects the DATA, never the QUOTA, and an open endpoint spending Graph quota is this account's most plausible route to Meta's abuse-prevention throttle. | Record in §23, "Rate limiting, versioning and overview". The migration ships BEFORE the function deploy, deliberately — the reverse of the usual order. |
| **`meta-ads-alerts` does not atomically claim rows.** It selects `handled_at IS NULL`, then updates per row. Two overlapping runs (a manual invoke during a cron run) could both claim the same row and double-push. | Needs a claim-then-work rewrite (`UPDATE … WHERE handled_at IS NULL RETURNING id`). Not worth doing blind before there is a cron, a real event, or a second caller. |
| ~~**`meta_ads_sync_log` has no `error_subcode` column.**~~ **FIXED 2026-09-18.** Meta's subcode is what distinguishes one code-613 meaning from another, and it was computed into the error summary and then dropped on write. Added as `bigint`, against 57 runs of which 0 had failed, so no failure history was lost by adding it late. | Record in §23, "Rate limiting, versioning and overview". NULL there is now a meaningful reading, not a blank — see §6. |
| **`meta_ad_daily.effective_status` is always NULL.** Nothing requests or writes it — insights does not return it; it comes from the `/ads` edge or the webhook. | Either populate it from a second call or drop the column. Both are changes to a table that is about to receive its first real rows; decide with data in hand. |
| **Customer phone and name travel in the `/invite` deeplink query string**, put there by `cart-abandonment` for WhatsApp and email. `src/App.tsx` scrubs the URL on mount, and that scrub is a child effect so it runs *before* the Pixel `PageView` — verified 2026-09-08, so **this does not reach Meta**. It still reaches WhatsApp's link-preview crawler, browser history and server logs. | Not a Meta-ads defect, so out of scope for this audit, and the honest fix is an opaque single-use token plus a lookup — a change to a live customer messaging flow that needs the owner's call, not a quiet edit. |

---

## 14. Related files and notes

| Where | What |
|---|---|
| `META-ADS-SETUP.md` | The founder-facing setup steps: URL parameters, secrets, tokens, App Review. |
| `CLAUDE.md` | Golden safety rules, the file map, and both workflow rules quoted in §1. |
| `supabase/migrations/20260906_meta_ads_performance.sql` | `meta_ad_daily` + `get_meta_ads_performance` |
| `supabase/migrations/20260907_meta_ads_sync_log.sql` | sync log + why it exists |
| `supabase/migrations/20260907_meta_ads_events.sql` | webhook inbox |
| `supabase/migrations/20260907_meta_custom_audiences.sql` | audiences + membership function |
| `supabase/migrations/20260907_meta_recommendation_scorecard.sql` | the scorecard |
| `supabase/migrations/20260907_meta_ad_daily_richer_metrics.sql` | the widened metrics |
| `supabase/migrations/20260903_payu_payments_reported_value.sql` | the value both reporters read |
| `supabase/migrations/20260907_flow_analytics_attribution.sql` | source on funnel rows — **applied; the client that fills it is not shipped** |
| `supabase/migrations/20260907_meta_ad_funnel.sql` | `get_meta_ad_funnel()` |
| `supabase/migrations/20260908_meta_ad_guardrails.sql` | Layer 7 — the circuit breaker |
| `supabase/migrations/20260908_meta_ad_volume.sql` | Layer 8 — ads running or in review |
| `supabase/migrations/20260908_meta_ads_alerts_cron.sql` | cron job 15 |
| `supabase/migrations/20260909_experiment_feasibility.sql` | `get_experiment_feasibility()` — can a split test say anything, and in how long |
| `supabase/migrations/20260909_site_experiments.sql` | §17 — `experiments`, `experiment_exposures`, `get_experiment_results()`, `norm_sf()` |
| `supabase/migrations/20260909_flow_analytics_visitor_id.sql` | the cross-session join key experiments need |
| `src/experiments.ts` | `useVariant()`, deterministic assignment, exposure logging |
| `src/supabase.ts` | `getVisitorId()` beside `getSessionId()` — read the note on why they are NOT the same id |
| `src/AppFlow.tsx` | `PriceCommitmentLine` — the first experiment's hook, at the price step |
| `supabase/functions/meta-insights-features/` | Layer 10 — opt-in Insights breakdowns; read-only by default, enabling is a one-way door |
| `supabase/migrations/20260916_payu_fee_split.sql` | `payu_fee_split()`: a PayU payment split into ticket money and gateway fee at its payment method's rate. Rates must mirror `FEE_RATES` in `create-payu-order` and `PAYMENT_METHOD_GROUPS` in `src/PaymentOverlay.tsx`. §21.3 |
| `supabase/migrations/20260916_meta_ads_true_roas_net_of_fees.sql` | `get_meta_ads_performance` and the recommendation scorecard count ticket money; fees reported beside it, per method. §21.3 |
| `supabase/migrations/20260917_meta_adset_learning_stage.sql` | `meta_adset_learning_history`, `meta_adset_config.learning_*`, `record_adset_learning()`, `get_meta_adset_health()` with learning. §23 |
| `supabase/migrations/20260917_meta_ads_enough_tickets_to_judge.sql` | `poisson_ci95()`, and `get_meta_ads_performance` with `enough_to_judge` plus likely ranges. §23 |
| `supabase/migrations/20260917_meta_delivery_settings_history.sql` | `meta_delivery_objects`, `meta_delivery_history`, `record_delivery_states()`, `get_meta_delivery_status()`. §23 |
| `supabase/migrations/20260918_meta_adset_placements.sql` | §23 "Reels Ads" — `meta_adset_config.placements`, `meta_adset_placement_history`, `record_adset_placements()`, `meta_adset_placement_warnings()`, the two sorting helpers, and `get_meta_adset_health()` with placements. Applied as three migrations (`meta_adset_placements`, `..._unknown_is_a_finding`, `meta_placement_helpers_pin_search_path`), all folded into this one file |
| `supabase/functions/meta-signal-watchdog/` | §22 — is Meta receiving our sales, applications, plan views and calendar opens; token probe. Read-only on Meta. |
| `supabase/migrations/20260916_meta_signal_watchdog.sql` | §22 — `meta_signal_watch`, `meta_signal_checks`, matching, verdicts, push decision, `get_meta_signal_health()` |
| `supabase/migrations/20260916_meta_signal_watchdog_cron.sql` | §22 — the cron, with `timeout_milliseconds := 60000`. Its hourly schedule is superseded by the daily file below. |
| `supabase/migrations/20260916_meta_signal_exclude_dev_sessions.sql` | §22 — sets local test sessions aside in the browser checks |
| `supabase/migrations/20260917_meta_signal_watchdog_daily.sql` | §22 — daily schedule (founder's decision) and the hold periods tuned to it |
| `supabase/migrations/20260917_meta_spend_reconciliation.sql` | §23 — `meta_account_daily`, `status_filter` / `spend_check` on the sync log, `meta_spend_reconciliation()` |
| `supabase/migrations/20260917_meta_jobs_daily.sql` | §8 — every Meta cron once a day (founder's decision, free plan), the daily order, 60 s timeouts |
| `supabase/migrations/20260918_open_events_pay_no_commission.sql` | §21.8 — `accrue_marketer_sale()` / `accrue_manager_sale()` pay nothing on open events |
| `supabase/migrations/20260918_meta_ad_budget_per_ticket.sql` | §21.7 item 1 — `meta_booking_prices()`, the `pct_of_ad_budget` threshold mode, rule `cpa_over_ad_budget` (and `cpa_over_40pct` disabled), the evaluator reading ad money per ticket, `get_meta_plan_ad_budgets()` |
| `supabase/migrations/20260918_meta_ads_sync_log_error_subcode.sql` | §23 — `meta_ads_sync_log.error_subcode`, so the two meanings of code 613 stay distinguishable in the only record that survives a run |
| `supabase/migrations/20260918_meta_ads_alerts_auth.sql` | §23 — the `meta_alerts_secret` row and the cron header that carries it. **Apply this BEFORE deploying the gated `meta-ads-alerts`**; the reverse order locks the cron out for up to a day |
| `supabase/migrations/20260918_app_secrets_revoke_client_grants.sql` | §23 — `anon` and `authenticated` lose their table grants on `app_secrets`, so RLS is no longer the only thing guarding it. Readers are SECURITY DEFINER functions owned by `postgres`, or `service_role` |
| `supabase/migrations/20260918_meta_ad_creative_tracking_tags.sql` | §23 — `meta_ad_creative_tags`, `meta_creative_tag_verdict()`, `record_ad_creative_tags()`, `meta_ad_tracking_tag_warnings()`, `get_meta_ad_tracking_tags()`: does every ad carry `utm_content={{ad.id}}`, checked before any spend |
| `supabase/migrations/20260918_meta_ad_creative_tags_revoke_public.sql` | §23 — the PUBLIC grant the first file's revoke did not remove, which left a writer anon-callable. **A revoke on a FUNCTION must name `public`**; `CREATE OR REPLACE` resets the ACL, so the revoke goes after it |
| `supabase/migrations/20260919_meta_pixel_config_watch.sql` | §22 check 7 / §23 "Meta Pixel docs" — `pixel_config` watch row, `meta_pixel_config_verdict()`, `meta_pixel_config_evaluate()`. Applied as two migrations (`meta_pixel_config_watch`, `meta_pixel_config_verdict_array_append`), folded into this one file |

**Migration count will not match, and the numbers below are from 2026-09-07 —
re-derive rather than quoting them.** As of that date production had **8**
applied Meta migrations against **6** repo files. Two revisions (`meta_ads_performance_ticket_count` and
`meta_ads_performance_sync_state`) were `CREATE OR REPLACE` rewrites folded back into
`20260906_meta_ads_performance.sql` rather than added as new files. Replaying the repo
still produces the correct end state — verified: the repo file contains
`ticket_count`, `cost_per_ticket`, `last_sync_at`, `last_sync_error` and
`last_row_synced_at`, and the live function has all of them. Do not "fix" the gap by
inventing the two missing files.

**Auto-memory notes** (in `~/.claude/projects/.../memory/`): `meta-ads-admin-panel-plan`,
`meta-capi-audit-2026-09`, `meta-ads-pixel-setup`, `edge-function-shared-module-drift`,
`no-traffic-source-tracking`, `build-for-future-scale`, `dedup-two-purchase-test-pending`,
and from 2026-09-16 `ad-unit-economics-findings`, `meta-full-value-at-advance-decision`,
`meta-ads-entrepreneur-partner`.

**MCP servers connected:** Meta Ads (`mcp.facebook.com/ads`) for reading ad entities
and dataset quality; Meta Social Technologies (`mcp.facebook.com/devtools`) for app
settings, review status, API usage and webhook topics. The devtools server's **write**
tools (`webhook_manage`, `webhook_test`) are not exposed to these sessions — only
read tools are.

---

## 15. Standing safety rules for anyone working on this

- **The Supabase DB is PRODUCTION with live customers.** Test rows use phone
  `90000000xx`; verify writes with `RETURNING`; delete test rows afterwards.
- **`npm run dev` talks to PRODUCTION Supabase.** This matters more here than
  anywhere else in the project: testing `attribution.ts` or `metaPixel.ts` locally
  creates real `applications` rows, fires the real Pixel, and can push real events
  into the live Meta dataset — where they will train ad optimisation. Only the
  `90000000xx` phone convention protects against that, and only if you use it.
- **Never `git push` without explicit go-ahead in that conversation turn.**
  Pushing to `main` deploys the live site.
- **The founder decided small ₹1–3 test transactions may reach the Meta dataset.**
  He tests systems quickly with real phones and small amounts, and does not want an
  amount-based filter. Do not re-propose one. `skipAsTestBooking()` covers only
  `90000000xx` phones and that is deliberate.
- **The founder decided that Meta is told the FULL ticket value when the advance
  is paid** (live 2026-09-06; reasoning recorded 2026-09-16 in §21.1). Do not
  re-propose reporting the advance, an expected value, or a value discounted for
  no-shows. True ROAS is our side's job and already exists
  (`get_meta_ads_performance`).
- **True ROAS counts TICKET MONEY, never raw `payu_payments.amount`.** That amount
  includes the gateway fee the customer pays on top, at a rate set by their
  payment method, and PayU keeps it (founder-confirmed 2026-09-16). Any new
  revenue or ROAS figure goes through `payu_fee_split()`. **If a fee rate ever
  changes** in `FEE_RATES` (`create-payu-order`) or `src/PaymentOverlay.tsx`,
  update `payu_fee_split()` in the same change. Otherwise new payments show up as
  "fee unknown" (§11 health query) and are counted with the fee still in.
- **Never advise moving budget, pausing, or picking a "winner" on ads marked
  `enough_to_judge: false`** (fewer than 10 paid tickets). Their real cost per
  ticket can be half or double the figure, so that advice acts on luck. At this
  account's volume Meta's own tips (segment, shift budget, adjust targeting
  mid-campaign) also restart learning. Say "too few tickets to judge" and point
  at the likely range instead. §23.
- **Delivery states are page-only: the founder chose NO alerts** (2026-09-17).
  Do not add a push for "switched on but not running", budget changes or on/off
  changes without asking him first. They show in Growth ▸ Ads "What's switched
  on" and in the "Learning phase" card. §23.
- **No writes to Meta's ad objects — unless the founder asks for a specific one.**
  Nothing automated may create, edit, pause, archive or delete a campaign, ad set or
  ad: the stored token is `ads_read` and the system notifies rather than acts (§5
  Layer 7). A Meta doc describing those calls is not a reason to reopen this (§23,
  "Ad Campaign Management"). **Exactly ONE write has ever happened**: Audience
  Network turned off on 2026-09-18, asked for by name, after the founder was told the
  trade-offs and reaffirmed (§10, "CHANGED 2026-09-18"). It went through the Meta
  Ads MCP, which authenticates separately from `META_ADS_ACCESS_TOKEN` — so the
  stored token is still `ads_read` and no cron, function or alarm gained the ability
  to change anything that spends money. **That is the shape of any future exception:
  asked for by name, done once, read back, recorded. Never a drive-by, and never as a
  side effect of another task.**
- **Every ad lands on `/lifestyle`. Founder-stated 2026-09-18.** Not a per-plan
  link, and **do not re-propose one** — attribution, `fbp`/`fbc`, PageView and
  ViewContent are all verified working on that landing, so nothing unpushed is
  needed for it. The single exception is structural rather than a choice:
  Advantage+ catalog ads link to one plan by construction, so the unpushed
  direct-plan-link ViewContent fix becomes a prerequisite *if* catalog ads are
  ever switched on. §23, "Create an ad creative".
- **Optimising for clicks (`LINK_CLICKS` / `OUTCOME_TRAFFIC`) is not the way out
  of the learning-phase problem**, however well the arithmetic seems to work. It
  abandons the conversion machinery this whole document exists to feed, and
  AddToCart/ViewContent already clear the bar several times over. If ~50 events a
  week is the binding constraint, the levers are ViewContent optimisation or
  budget. Analysis, not a rule — the objective is the founder's call — but do not
  propose click optimisation as a fix. §23, "Basic Ad Creation".
- **This document is written by several sessions at once, sometimes within the
  same minute.** It grew by ~500 lines underneath this session's edits on
  2026-09-18, as it did on 09-08/09 (§10). The habits that keep that safe, learned
  the practical way: re-read immediately before writing; **insert before a known
  heading rather than appending at end-of-file**, so two sessions do not both
  land at the bottom; **add a row to someone's table rather than renumbering
  their list**; and verify with a `grep -c` afterwards that both your change and
  theirs survived. An exact-match edit that fails loudly is safer than a blind
  append.
- **Never grant `anon` or `authenticated` anything on `public.app_secrets`**,
  and never add an RLS policy to it without reading why it has none. It is
  guarded twice on purpose since 2026-09-18 — deny-all RLS **and** no client
  grants — because for a long time RLS was the only thing between a browser
  session and every secret in it. Its readers are SECURITY DEFINER functions
  owned by `postgres`, or `service_role`. §23.
- **When you put a secret in front of an endpoint a cron already calls, ship
  the CRON CHANGE FIRST and the function second.** This is the reverse of the
  usual order and it is not a preference. A cron sending a header the live
  function ignores is harmless; a function demanding a header the cron does not
  send is a 401, and pg_net does not retry — on the daily schedule (§8) that is
  **a whole day of no alerts**, silently. Done this way for `meta-ads-alerts`
  on 2026-09-18.
- **A function that fails closed needs a health check, or it fails quietly.**
  `meta-ads-alerts` now refuses a caller it cannot authenticate, which is
  right — but it means deleting `app_secrets.meta_alerts_secret`, or rewriting
  job 15 without the header, kills every webhook-issue alert and every
  guardrail breach at once, and the only trace is a status code in
  `net._http_response` that nobody reads daily. The §11 health query carries
  three columns for exactly this (`alerts_secret_set`,
  `alerts_cron_sends_secret`, `alerts_last_http`). A panel surface for it is
  **not built** — noted so it is a known gap rather than a surprise.
- After every code edit: `npx tsc --noEmit` must pass.
- **Another session may be editing and deploying the same files.** It happened
  on 2026-09-08/09 and again on 2026-09-16/18, in `meta-ads-sync`,
  `AdminPanel.tsx` and this document. The discipline that kept it safe:
  - **Before deploying**, download the deployed function and diff it against the
    repo. Deploy only when the difference is your own additions.
  - **A cheap pre-check that usually settles it without downloading anything:**
    compare the local file's mtime against the deployed `updated_at` from
    `list_edge_functions`. Deployed-AFTER-edited, by seconds, means the local
    file is what produced that version and nobody has touched it since; on
    2026-09-18 both files read `03:52:07` local / `03:52:29` deployed and
    `23:47:02` / `23:49:30`. Deployed-BEFORE-edited is the §9 `_shared` drift
    gap and needs the real diff. This orders the question cheaply — it does not
    replace the diff when the answer comes out wrong, and it says nothing about
    a bundled `_shared/` file, whose own mtime is what matters there.
  - **Right before the upload**, download again and confirm nothing was deployed
    in between.
  - **After deploying**, download once more and diff: deployed must equal repo.
  - **After editing this document**, grep for your own markers. An edit tool may
    warn that the file changed on disk; re-check rather than assume.
  - Treat another session's rows and sections as current state. Correct them
    only with evidence, never by reverting.
- One concern per commit; commit messages explain the *why*.

---

## 16. The phased build plan — started 2026-09-09

Written before the work, so that a session picking this up mid-way can tell what
was done from what was merely intended. **Each phase updates this section as it
lands**; if a phase below still says "planned", it did not happen.

The ordering is not arbitrary. It runs from *lowest risk and highest certainty*
to *highest*, and every phase before the last one is reversible. The push to
`main` is last because it is the only step that touches live customers.

### Why these six, and not the §13 menu

§13 is a menu of good ideas. This is the shorter list of things that are
**already half-built and therefore currently worth nothing**. A migration with
no caller, a table with no panel, a client change sitting in a working tree —
each of those is a system that looks finished in the repo and does nothing in
production. Finishing them beats starting anything new, and it is also the
cheapest work available, because the hard half is already done.

The one genuinely new thing here (Phase 4, the first experiment) is included
because an experiment engine that has never run an experiment is not evidence
that it works.

---

### Phase 1 — Make disk and live provably identical  ✅ DONE

**The problem.** `_shared/metaCapi.ts` was edited at `20:14:26` and its five
importers were redeployed at `20:12:41–20:12:59` — the file changed about 90
seconds *after* the last deploy. The diff read as comment-only, but "reads as"
is not "is", and four of the five importers sit on the payment path.

**Why it cannot be left.** This is §9's `_shared/` bundling trap in its exact
shape. The failure mode is silent: the repo says one thing, production runs
another, and nothing anywhere disagrees out loud.

**What was done.** Verified the deployed bundle directly (the Supabase MCP
returns bundled `_shared` files, so this is checkable rather than assumable),
then redeployed all five so the question cannot be asked again. `send-admin-push`
goes first per the deploy-order trap above.

### Phase 2 — Give the guardrails a surface  ✅ DONE

**The problem.** `meta_ad_guardrail_events` has no panel view, so a push
notification is the *only* place a breach is ever visible. A missed
notification is a breach that never happened, as far as anyone can tell.

**Why it matters more than it sounds.** The whole guardrail layer exists to
catch an ad quietly burning money. Routing its only output through a channel
with no history — one that `notify_admin_push` cannot even confirm delivery
for, because it is fire-and-forget — means the system's single job depends on
the founder happening to see a phone notification.

**What was done.** A breach history in Growth ▸ Ads, reading
`get_meta_ad_guardrail_breaches()` plus the stored `meta_ad_guardrail_events`
rows, grouped by ad.

### Phase 3 — The site-experiments panel  ✅ DONE

**Context.** The engine went live on 2026-09-09 (tables, RPCs,
`flow_analytics.visitor_id`) after `get_experiment_feasibility` showed a
purchase-level Meta split test needs ~203 weeks on this account — see
`site-experiments-engine` and `meta-split-test-feasibility` in auto-memory.

**The problem.** Creating an experiment meant writing SQL by hand, which for a
no-code founder means it may as well not exist.

**What was done.** Growth ▸ Experiments gained a create form and a results
view that surfaces all three guards — SRM, the fixed horizon, and
`client_stamping_live` — rather than just a winner.

### Phase 4 — Run the first experiment  ✅ DONE (as a draft, not started)

**Why an untested engine is not a finished one.** Everything in Phase 3 is
verified against synthetic data in rolled-back transactions. That proves the
arithmetic, not the plumbing: nothing has yet proved a real browser assigns a
variant, writes an exposure, and has its conversion joined back.

**Where.** The price step. The funnel says 21.6% of visitors see the price and
8.5% act on it — a 61% drop, the largest single leak, and the same step the
`invite-vs-open-flow-conversion` note found the gap opening at. It is also
comfortably testable: ~7.6 weeks on `ReachedPricing`, ~5.5 on `AddToCart`.

**The sample size is set from `get_experiment_feasibility()` BEFORE it starts**,
not chosen afterwards. That is the anti-peeking guard and it only works if the
number is committed up front. `price-commitment-line-v1` carries **4,626 per
variant** on `book_cta_clicked`, straight from that function.

**What was built.** `PriceCommitmentLine` in `src/AppFlow.tsx`, mounted only
inside the `selectedMeetingPoint && …` branch so that "was exposed" means
"actually saw a price". Variant B adds one line — *"Only ₹100 now — the rest
when you arrive."* — which restates the two figures already on screen and
**promises nothing the site does not already keep**. A test that wins by making
a claim we do not honour is worse than a test that loses.

**Verified end to end in a real browser against production**, then every test
row deleted: variant assigned, line rendered, exposure written, and the
conversion joined back through `visitor_id`. All three guards reported
correctly — `client_stamping_live: true`, `ready: false` with the anti-peeking
note, SRM p=0.317 and not failed.

**It is left as a DRAFT.** The engine is proven; whether to run this particular
test, and with what wording, is the owner's call. Press Start in
Growth ▸ Experiments.

### Phase 5 — Prove the alarm actually renders  ✅ DONE 2026-09-09

**The gap.** `meta_ad_issue` has never been shown to produce a visible
notification on a real device. Every layer beneath it is verified; the last
inch is not. `notify_admin_push` is fire-and-forget, so
`meta_ad_guardrail_events.notified_at` records "queued without error" and
nothing more.

**Result — the chain is real, END TO END, including the last inch.**
`notify_admin_push` with a `meta_ad_issue`
payload returned request `17690`; `net._http_response` for it reads
`status_code 200` and the body `{"sent":1,"expired":0,"perDevice":[{"host":
"web.push.apple.com","status":201}]}`. Apple **accepted** the push (201). This
also proves the `send-admin-push` v29 case resolves: an unknown type returns
200 with `sent:0`, so `sent:1` could not have happened before that deploy.

**The founder confirmed it appeared on his phone (2026-09-09).** That is the
only part of this chain no tool can check: `net._http_response` proves Apple
ACCEPTED the push (201), never that a human saw it. A notification can be
accepted and still be silenced by Focus mode, a revoked permission, or a
service worker that failed to install — so an unread `sent:1` is not evidence.
It is now evidence, because a person looked. **`meta_ad_issue` is therefore
fully proven: payload → RPC → edge function → Apple → visible on a device.**

Nothing needed cleaning up afterwards — the test went straight through
`notify_admin_push` rather than writing a synthetic `meta_ad_guardrail_events`
row, so the breach history stays honest.

**But it goes to exactly ONE device, and that is worth knowing.**
`admin_push_subscriptions` holds 5 devices: 1 has no owner recorded and by
design receives nothing, and of the 4 owned, only **one** belongs to a
strict-admin email — `meta_ad_issue` is founder-only, so it is not in
`STAFF_TYPES`. Every Meta alarm in this system therefore depends on a single
phone having notifications enabled and a live subscription. That is a single
point of failure on the layer whose whole job is to speak up when nobody is
looking. Adding a second founder device is a re-subscribe from Settings in the
admin app — the founder's action, not a code change.

### Phase 6 — Ship  ⛔ HELD BY THE OWNER, 2026-09-09

**Asked and declined on 2026-09-09 — nothing was pushed.** Re-ask rather than
assuming this still holds.

Pushing to `main` deploys the live site, so it never happens without explicit
go-ahead in the same conversation turn (CLAUDE.md rule 2). Isolated,
one-concern commits; `npx tsc --noEmit` green; `git status --short` checked
before and after.

**One thing to raise before any future push:** the working tree carries
uncommitted work from SEVERAL sessions at once — `src/attribution.ts`,
`meta-ads-sync`, `meta-audience-sync`, `_shared/metaCapi.ts`,
`meta-ads-alerts/` and a number of migrations were not written in the session
that built the experiments engine. A `git add -A` therefore ships other
people's half-finished work under one session's commit message. Stage
deliberately, and say out loud what is being included.

Until this lands, **`flow_analytics.attribution` and `visitor_id` stay NULL on
every row** — which means the ad funnel and every experiment are collecting
nothing, however finished they look in the repo.

---

## 17. Site experiments — the answer to §12's split-test row

Built 2026-09-09. **This is not a Meta system**, and it is documented here
because it exists entirely as a consequence of a Meta finding: §12 records that
a split test on this account cannot read anything below AddToCart, and needs
paid traffic before it can start. The site meanwhile takes **~400 organic
sessions a week** through a fully instrumented funnel. That is the cheaper
laboratory, and it is already paid for.

It is Layer 3 of `experiments-and-ab-testing-proposal.md`, plus three guards
that proposal did not have.

### A real defect in that proposal, now fixed — do not reintroduce it

The proposal says: *"deterministic hash of the existing `session_id` → variant.
Same visitor always sees the same version."* **That is false as written.**
`ca_session_id` lives in `sessionStorage` and dies with the tab, so a visitor
returning on Thursday is re-rolled into a possibly different variant. Two things
break at once: they watch the site change under them, and anyone exposed to both
variants before booking belongs to neither — with nothing afterwards able to
detect that it happened.

Assignment therefore uses a **third id**, `ca_visitor_id` in `localStorage`.

**Three ids for one visitor is correct, not mess, and a future session must not
tidy them together:**

| Id | Lives in | Lifetime | Why that lifetime |
|---|---|---|---|
| `ca_session_id` | sessionStorage | one visit | "what happened in this visit" — the funnel's unit |
| `ca_attribution` | sessionStorage | one visit | deliberately under-credits ads; a bare-URL return is not credited to an old ad |
| `ca_visitor_id` | localStorage | forever | assignment must be sticky or the test measures nothing |

### The three guards, each stopping one specific wrong conclusion

- **SRM (sample ratio mismatch).** Designed 50/50 but observed 60/40 means
  something is broken, and the comparison is then measuring the breakage. This
  is the highest-value check in A/B testing and almost nobody builds it, because
  a test with SRM looks *completely normal* — clean winner, good p-value. Below
  p=0.001 the result is marked INVALID and **no winner is reported at all**.
- **Fixed horizon.** `target_exposures_per_variant` is set from
  `get_experiment_feasibility()` **before** the test starts; results report
  `ready: false` until it is reached. **This one is from our own history** — the
  invite-vs-open finding hit p=0.047 on a *third sequential look*, and five
  earlier n=8 findings died at larger n. The numbers still display, because
  hiding them only moves the peeking to raw SQL.
- **`client_stamping_live`.** Tells "nobody converted" from "we are not
  measuring yet" — the same null-versus-zero discipline as §9.

### Objects

`experiments` (key, hypothesis, primary_metric, variants jsonb, status,
target_exposures_per_variant, decision) and `experiment_exposures`
(PK `(experiment_key, visitor_id)`, first-assignment-wins enforced by the
primary key, not by client code). `flow_analytics.visitor_id` is the join key —
conversions in a LATER session still belong to the assigned variant, which
joining on `session_id` would silently drop, and returning visitors are exactly
the population a booking funnel converts.

RLS: anon may read only `status='running'` rows and may **INSERT** an exposure;
SELECT, UPDATE and DELETE on exposures are closed, so a visitor cannot re-roll
their variant or rewrite the denominator of a live test. See §9 for the
PostgREST `upsert` trap this creates.

Panel: **Growth ▸ Experiments** (create + results) and the breach history in
**Growth ▸ Ads**.

---

## 18. Everything done on 2026-09-09, and its exact status

The ledger. **"Live" means verified on production, not merely written.**

### Live on production

| What | Evidence |
|---|---|
| `send-admin-push` **v29** — the `meta_ad_issue` case | Deployed 20:04:46, `verify_jwt` still false. Live source read back and confirmed. **This was the session's first finding:** `meta-ads-sync` had been deployed sending `meta_ad_issue` while the live receiver had no such case, so the dead-token and `learning_limited` alarms were being silently dropped — `notify_admin_push` is fire-and-forget, so every one counted as a success. |
| Five `_shared/metaCapi.ts` importers redeployed | payu-callback **v69**, payu-webhook **v64**, verify-pending-payments **v36**, capi-lead **v9**, meta-audience-sync **v9** — all `verify_jwt: false`, each deploy log naming the shared module. Closes the 90-second edit-after-deploy gap that left disk and live unprovable. |
| `get_experiment_feasibility()` | Applied; exercised through the founder gate. |
| `experiments`, `experiment_exposures`, `get_experiment_results()`, `norm_sf()`, `jsonb_weight_sum()` | Applied. |
| `flow_analytics.visitor_id` + 2 partial indexes | Applied. **Still NULL on every row until the client ships.** |
| Three Insights breakdowns enabled on the ad account | `impression_device`, `frequency_value`, `time_of_day_viewer_tz` — verified by reading the status back from Meta; `comscore` deliberately left off. **Irreversible: Meta has no disable.** Layer 10. |
| `meta-insights-features` edge function | Deployed `--no-verify-jwt`, `verify_jwt: false`. Enable path re-closed and confirmed 403 both without a secret and with the retired one-shot nonce. |
| The alarm reaches a device, **and a human saw it** | Phase 5 — request `17690`, `net._http_response` 200, `{"sent":1,"perDevice":[{"host":"web.push.apple.com","status":201}]}`, **and the founder confirmed the notification appeared on his phone**. Apple accepting a push is not the same as a person seeing one (Focus mode, revoked permission, a dead service worker all return 201), so this last step needed a human and got one. |

### Also live on production — the guardrails and ad-set batch (2026-09-08/09)

Same standard: "live" means verified on production. Every grant below was read
back from `information_schema`, and **`anon` holds EXECUTE on none of these
functions**.

| What | Evidence |
|---|---|
| `meta_ad_guardrails` + `meta_ad_guardrail_events` + `meta_ad_guardrail_breaches()` + `get_meta_ad_guardrail_breaches()`, **6 seeded rules** | Tables exist with RLS + 1 policy each; core granted to **`service_role` only**. Layer 7. |
| `meta_ad_volume_snapshots` + `get_meta_ad_volume_status()` | Applied; advisors show only the generic SECURITY-DEFINER notice every founder-gated RPC already carries. Layer 8. |
| `meta_adset_config` + `meta_adset_optimization_warnings()` + `get_meta_adset_health()` | Applied; the real ad set synced and graded **`impossible`** — 10.3 purchases/week against Meta's bar of 50. Layer 9. |
| `meta_adset_targeting_history` + `record_adset_targeting()` | Applied; **sync run twice — first recorded 1 version, second recorded 0** and extended the existing window, proving the jsonb comparison is not fooled by key reordering. |
| Cron **job 15** `meta-ads-alerts`, `7,22,37,52 * * * *` | Fired at `14:37:00.125`; **`net._http_response` recorded 200 at `.147`**. Offset 7 min so it interleaves with the other quarter-hourly jobs. |
| `meta-ads-alerts` — first ever deploy, then wired to the guardrail evaluator | Live call returns `ok:true` with a `guardrails` block and **no `error` key**, which is what proves the `service_role` grant. Two independent halves (webhook drain, then evaluator), reported separately. |
| `meta-ads-sync` — `ads_volume`, ad-set config, and targeting capture | Live call returns `volume`, `adsets` and `targeting_versions` blocks. Three independent non-fatal steps after the spend upsert. |
| `API_VERSION` v25.0 → **v26.0** on the three ads functions | The deprecation warning v25.0 returned is **gone** from a live call. |
| `untagged_spend` gated on `capture_live` | Rollback-transaction fixtures: a deliberately healthy ad went from **falsely alarming** to silent. |

### Bugs that testing found and review had not

All four were caught by running the thing against real data, not by reading it.

1. **`page.summary.code` did not exist** — `errorSummary()` returns `meta_code`.
   `undefined` at runtime, and a compile error under Deno.
2. **`untagged_spend` fired on EVERY ad, including a deliberately healthy
   fixture.** `flow_analytics.attribution` is NULL until the client ships, so no
   ad has tagged traffic — the alarm would have blamed `{{ad.id}}` for our own
   undeployed code. The always-on alarm the noise floors exist to prevent,
   caused by the rule that warns about tracking.
3. **The two spend rules overlapped.** One dead ad tripped both
   `spend_without_ticket` and `spend_without_lead` and pushed twice about one
   thing. Now disjoint by construction (`leads > 0` vs `leads = 0`), which also
   turned them into a real diagnosis: conversion problem vs traffic problem.
4. **Placeholder-priced events broke the percentage ceiling.** Live rows at ₹2
   and ₹3 gave a 40%-of-price ceiling of 80 paise, which every real ad breaches
   instantly. Now floored at `price_full >= 50`. **This is NOT the amount-based
   payment filter the founder rejected** — that decision is untouched.

### Design decisions in that batch worth not re-litigating

- **Two functions, not one, for the evaluator.** `is_admin_strict()` reads the
  JWT email and is FALSE for the cron's service-role key. A single founder-gated
  function would have handed the cron a NULL and the breaker would never fire —
  silently, looking healthy. Verified by calling all three from a non-founder
  session: the ungated core returned **0 rows, not NULL**.
- **Pushes group BY AD; event rows write PER RULE.** One fixture ad tripped four
  rules at once. One push led by severity (`untagged_spend` first, the only
  irreversible one) with `+N more`; one row per rule so cooldowns stay
  independent and the history shows every finding.
- **The breach row is written even when the push FAILS** — opposite to the
  webhook half, deliberately. A webhook event is a one-shot MESSAGE; lose it and
  it is gone. A guardrail breach is DERIVED STATE, recomputed every run, so it
  resurfaces by itself. The row is also what ARMS the cooldown, so skipping it
  would re-push every 15 minutes.
- **The targeting comparison lives in SQL, not TypeScript.** Meta returns that
  object with no guaranteed key order; a `JSON.stringify` diff would log a false
  change on every reorder, writing a version four times a day and burying real
  edits. `jsonb` equality is key-order independent.
- **The learning-phase test grades against SITE-WIDE volume.** An ad set wins
  only a fraction of that, so site-wide is a hard upper bound — `impossible`
  means *even capturing 100% of everything the business produces, it could not
  reach 50/week*. That needs no assumption about traffic share, cost per event
  or budget, which is what makes it safe to act on. `tight` never pushes.

### Written and verified, but NOT shipped — the working tree

Nothing below is running for a single real visitor. **Until a push,
`visitor_id` and `attribution` stay NULL on every live row, so the ad funnel and
every experiment collect nothing however finished they look.**

| What | File |
|---|---|
| `useVariant()`, assignment, exposure logging | `src/experiments.ts` (new) |
| `getVisitorId()` + the `visitor_id` stamp on every funnel row | `src/supabase.ts` |
| Guardrail breach history, grouped by ad | `src/AdminPanel.tsx` (Growth ▸ Ads) |
| Site-experiments create form + results view | `src/AdminPanel.tsx` (Growth ▸ Experiments) |
| `PriceCommitmentLine` — the first experiment's hook | `src/AppFlow.tsx` |

### Sitting in the database, deliberately not running

`price-commitment-line-v1` exists as a **draft**: `book_cta_clicked`, 4,626
exposures per variant (straight from `get_experiment_feasibility`). Variant B
adds one line — *"Only ₹100 now — the rest when you arrive."* — restating two
figures already on screen and **promising nothing the site does not already
keep**. Proven end to end in a real browser against production (assign → render
→ exposure written → conversion joined via `visitor_id`, all three guards
correct), then every test row deleted. Whether to run it, and with what wording,
is the owner's call: Start is in Growth ▸ Experiments.

### Verification that was run, so nobody repeats it

- `norm_sf` against eight known values — max error **7.1e-8**, matching the
  published A&S bound.
- `get_experiment_results` on synthetic healthy / SRM-broken / under-target
  cases, all inside rolled-back transactions. Hand-computed z of 2.962 matched.
- RLS as the real `anon` role: INSERT lands, re-insert is a no-op, SELECT
  returns nothing, and both founder RPCs throw *permission denied* — a second
  layer beyond the NULL gate.
- Assignment hash over 200,000 uuids: 49.81/50.19 on a 50/50, and **50.23%
  agreement between two concurrent experiments**, which is what proves the
  experiment key belongs in the hash input (without it, 100% correlated).
- A real browser driven through the whole booking flow, twice.

### Corrections made to this document

Three rows in §10 claimed `meta-ads-sync` and `send-admin-push` still needed
redeploying when they were already live, and Layer 8 said the ads_volume step
was not deployed when it was. **A stale handoff is not a cosmetic problem — it
is what allowed the deploy-order violation above**, so these were corrected
rather than left. Also added: the PostgREST upsert lesson (§9), the Ad Study
evaluation (§12), and §17.

### Open, and owned by the founder

| | |
|---|---|
| **Push to `main`** | Asked 2026-09-09 and **declined**. Re-ask; do not assume. The working tree carries uncommitted work from SEVERAL sessions, so `git add -A` would ship other people's half-finished work under one commit message. Stage deliberately. |
| **Only ONE device receives Meta alarms** | 5 subscriptions exist; `meta_ad_issue` is founder-only, so exactly one matched. Every alarm in this system depends on one phone having notifications on. A second founder device is a re-subscribe from Settings. |
| **`{{ad.id}}` in URL Parameters** | Unchanged, still the only irreversible-if-missed item. §10. |
| **Customer exclusion on the paused ad set** | "Chennai +40km · broad · Purchase" does not exclude `chapter அ · customers (any payment)`, so if unpaused it pays to reach 107 people who already bought. Ads Manager → the ad set → Audience → exclude it. Flagged in Growth ▸ Ads ▸ Audiences; pushes only if the ad set goes ACTIVE unfixed. §19. |
| **Create the four draft audiences** | Awaiting the founder's go-ahead (raised 2026-09-11). A write to the live ad account; inert and free until an ad set uses them. Prefill backfills Pixel history. §19. |
| **A photo for every live plan** | Founders Meet has none; Pondy and Anna Nagar share one video thumbnail. A plan with no photo cannot enter the catalog, and any ad for it needs one anyway. Upload it in the plan editor; Growth ▸ Ads ▸ Plans ready to advertise turns green on its own. §20. |
| **Create the catalog** | Awaiting the founder's go-ahead (raised 2026-09-11). A write to the business, inert until an ad uses it. The feed already exists. §20. |
| **`cost_per_ticket` reads ₹0 on Founders Meet and Girls-Only Sip & Chat** | **DEFERRED BY THE FOUNDER, 2026-09-18: "don't worry about the costs of events as of now, I'll update the costs when I'm actively running ads." Do not ask again.** Until he does, those two plans' ad money per ticket reads as the whole advance (₹100 and ₹199), which is too generous, and the Growth ▸ Ads card labels each of them "cost per ticket is ₹0" so the figure is never read as verified. The alarm still works on every plan whose cost IS set. Original note: raised 2026-09-16. On 2026-09-17 the founder answered that these events use Chennai city pricing, which is the correct price. That settles the **price** (already recorded in §21.5), not the **cost**. `events.cost_per_ticket` is a separate column: what it costs the business to deliver one ticket. `city_details` holds no cost (checked 2026-09-17: only `price_full`/`price_advance` per city). Live values: Anna Nagar ₹150, Pondy ₹2,600, Founders Meet ₹0, Girls-Only ₹0. The founder can fill it in himself: Team ▸ Performance ▸ Per-Event Unit Economics ▸ "Your cost/ticket". §21.6. |
| **Which margin the cost alarm uses** | **ANSWERED, AND BUILT 2026-09-18 — see §21.7 item 1.** The rule below is his; the alarm now reads it. Kept for the reasoning.<br>**ANSWERED 2026-09-17, then refined the same day.** First answer: cash actually collected, fees removed, not the full ticket. Refined: **the ad budget per ticket is the ADVANCE minus `cost_per_ticket`.** Most events will be pay-at-venue; the founder sets the advance above cost on purpose so the surplus funds the ad, and the balance collected at the venue is profit. **No extra input field**: derive it from the city advance and the cost. He will put every cost except marketing (logistics, people, etc.) into `cost_per_ticket`. The advance is already fee-free (the customer pays the fee on top). Commissions accrue only at `fully_paid`, so they come out of the balance, not the ad budget. **Still open:** the rule for plans that are not pay-at-venue (Pondy: advance ₹2,600 = cost ₹2,600, so ₹0) and for full-payment plans. This does **not** change what Meta is told (§21.1). §21.6. |
| **Push the Growth ▸ Ads additions** | The database side is LIVE, so fee-free true ROAS already shows on the panel on `origin/main`. Everything below is in `src/AdminPanel.tsx`, `tsc` clean, and NOT pushed. That file carries other sessions' work too, so stage deliberately.<br>• **Fees (§21.3):** the "Customers paid = ticket money + fees" line, fees per payment method, the fee-unknown warning, and the per-ad hover.<br>• **§23, added 2026-09-17:** the "Learning phase" card; the "too few tickets to judge" label and the likely ROAS range on each ad; the note above the ad table; and the grey (not green or red) ROAS when there are too few tickets.<br>• **§23, added 2026-09-17:** the "What's switched on" card, and the reason shown beside each learning restart. |
| **Push the "What each plan can spend on ads" card** | Growth ▸ Ads, `src/AdminPanel.tsx`, `tsc` clean, **not pushed**. The database side is live, so the alarm already judges ads on ad money per ticket; the card is what shows the figures and the click ceiling. §21.7 item 1. |
| **Push the sales-watchdog card** | The watchdog is live and pushes to the phone. The Growth ▸ Ads card that shows its state and alert history is in `src/AdminPanel.tsx`, `tsc` clean, not pushed. Same file-sharing caution as above. §22. |
| **Push the "Some ad spend is missing" banner** | Growth ▸ Ads wording for a `spend_unaccounted` sync, in `src/AdminPanel.tsx`, `tsc` clean, not pushed. Without it the live panel shows the same finding under the generic "Last sync from Meta failed" banner, whose token advice does not apply. The phone push already has the right wording (deployed). §23. |
| ~~**Open events are still accruing marketer and manager commission**~~ | **FIXED 2026-09-18 on his instruction: "for open events no need to pay to marketers or managers."** Both accrual triggers now return early on `is_open_event()`. Record in §21.8. What is still HIS call: the ₹385 manager and ₹325 marketer already accrued but unpaid — nothing was reversed. The ₹500 on Anna Nagar was paid out to 7 marketers and is gone. Original finding: raised 2026-09-18, after he asked whether commissions apply to open events. His 2026-08-10 decision was that open events pay none, but the triggers have no open-event exception: `accrue_marketer_sale()` and `accrue_manager_sale()` fall back to the person's own `commission_amount` when `events.marketer_commission` is NULL, which it now is on every event. Since 10 Aug that accrued **₹875 marketer** (Anna Nagar ₹500 across 7 marketers, all already paid out; Kovalam ₹325 to the founder's own account, unpaid) and **₹385 manager** (Anna Nagar, Srivarthini, unpaid). No marketer is mapped to any active open event now, but **Srivarthini is still the mapped manager on Anna Nagar**, so 111 unpaid leads there would each accrue ₹35 if they pay, and 3 old `advance_paid` rows still carry a marketer. Nothing was changed — whether to unmap, add an open-event exception to the triggers, or keep paying is his call. |
| **Tag every analytics row with the site address** | Proposal, raised 2026-09-16, not built. Local test visits write to live `flow_analytics`, and today they can only be recognised by a fingerprint (§22). A host or dev flag on each row would let the funnel, experiments and watchdog filter them by fact. Client change, so it needs a push. |
| **Check the 5 credit-card-via-UPI payments against a PayU settlement report** | Those customers paid the UPI fee (2.42%). Confirm PayU deducted only the UPI rate; if it charged more, true ROAS on those reads slightly high. §21.3. |
| **TODO before pushing and before ads go live: read the ad-reading token's expiry** | Raised 2026-09-18; the founder said he would look it up in Meta's **Access Token Debugger** (paste the token there, never into chat). `META_ADS_ACCESS_TOKEN` is the only token with no advance check. **Never** ⇒ nothing to build. A **date** ⇒ replace it before then, and build the daily check sketched in §23 "Authentication". What a silent expiry costs: spend is recoverable, but each day's learning status, delivery history and audience snapshots are not, and the customer-exclusion audience stops updating. §24. |
| **Finances page still includes gateway fees in revenue** | `get_performance_summary` sums raw `payu_payments.amount`. Left alone on 2026-09-16 because the ask was ROAS. `payu_fee_split()` fixes it the same way when the founder says yes. §21.3. |

---

## 19. The audience layer — built 2026-09-11

Source: Meta's **Audience Rules** doc, supplied by the founder on 2026-09-10 and
read against the live dataset and ad account rather than on its own.

### What the doc changed, and what it did not

| The doc says | What it means here |
|---|---|
| Rules filter on `url`, `event`, or any custom-data field | `url` / `path` / `domain` are dead: 27 days of `ads_get_dataset_stats aggregation=url` show only `https://chaptera.in/` (§9). `event` and custom data work: the dataset is `advertising_and_analytics` with first-party cookies on, and the Pixel sees our funnel about 1:1 (15 Aug to 10 Sep: ViewContent 605 vs our 607, AddToCart 507 vs 490, ReachedPricing 304 vs 297, InitiateCheckout 149 vs 140). |
| "Editing aggregation and retention_seconds does not flush the audience" | The design rule for the whole layer. An edited audience is a blend of both versions with nothing on Meta's side saying so. A created audience's rule is therefore frozen; a change is a new version. |
| Aggregations `count`, `sum`, `avg`, `min`, `max`, `time_spent`, `last_event_time_field`; absolute or percentile | The genuinely new lever. Used by `top_engaged` (time_spent, top 25%). **`count` on AddToCart is unreliable until the `calendar_opened` latch ships** (it multi-fires today); build "came back twice" on ReachedPricing instead. |
| `retention_seconds` max 365 days | Contradicts the WCA parameter table (180). A third source; 180 satisfies all of them. |
| `exclusions` is "Required" | Its own examples omit it, and the Ads MCP calls it optional. |
| Nothing at all about `template` | The Ads MCP says `template` is REQUIRED for WEBSITE audiences. The drafts carry it. If Meta rejects it at creation, fix the draft before it freezes. |

### The findings that matter

**Meta can currently place about 1% of our visitors in an audience.** "Website
visitors - 180d" (match-all, prefilled) reads **20 people** against **1,671**
sessions our own table recorded in the same window. Pixel coverage is not the
cause; it is about 1:1 (above). The loss is in tying an anonymous browser event to
a Meta account: mid-funnel events carry only `fbp`/`fbc` (§9, "Mid-funnel events
reach Meta anonymous"), and organic Instagram in-app-browser visits rarely carry a
click id. So retargeting pools built from today's organic traffic would hold
single digits, below what Meta will deliver to. Ad clicks carry `fbclid`, so the
pools *should* grow with paid traffic. That is a hypothesis, and
`meta_audience_snapshots` is what confirms or kills it. One caveat on the 20:
Meta's `time_updated` for that audience has not moved since it was created on
15 Aug, so the count may be stale rather than small. A few days of snapshots
settle which.

**Customer lists read 1,000 / 1,000 — a floor, not a count.** Corrected in §10.
Consequence: Meta will never tell us a list's matched size below 1,000, so §13
item 4's "once customers_completed crosses ~100 matched" cannot be observed from
Meta. Use our own `member_count` with an assumed match rate.

**The paused ad set does not exclude existing customers.** Its targeting has no
`excluded_custom_audiences`, so if unpaused it pays to show ads to the 107 people
in `customers_all_paid`, the audience built for exactly this job and never
attached. Founder-side fix in Ads Manager; the token is `ads_read`.

### What was built

| Piece | Status |
|---|---|
| `meta_website_audiences`: registry, PK `(key, version)`. Trigger `meta_website_audiences_guard` validates on every write, freezes `rule` once `audience_id` is set, forbids rebinding and un-retiring. One active version per key. | **LIVE** |
| `meta_validate_website_rule(jsonb)`: returns every problem. Our pixel only, retention 1 s to 180 days, at most 10 rules and 100 filters, `event` uses `eq` and names an event we send, custom-data fields we send, `url` only as the match-all, aggregation shape. The event and field lists mirror `src/supabase.ts`. | **LIVE** |
| `meta_audience_snapshots` + `record_audience_snapshot()`: every audience on the account, one row per IST day. Baselines Meta's copy of our rule on first sight and flags drift by jsonb equality. The rule is passed as TEXT and parsed in Postgres, because Meta's rule carries the pixel id as a bare number past JavaScript's exact-integer range. | **LIVE** |
| `meta_adset_audience_warnings()` (service_role only): ad sets not excluding `customers_all_paid`, skipping ad sets deliberately aimed at customers. | **LIVE** |
| `get_meta_audience_health()`: founder-gated, returns one jsonb (PostgREST's 1,000-row cap). | **LIVE** |
| `meta-ads-sync` **v13**: fourth non-fatal step `syncAudiences`. Pushes `meta_ad_issue` only for ACTIVE ad sets missing the exclusion, 7-day cooldown, ledger `meta_ad_guardrail_events` with rule_key `adset_no_customer_exclusion` (observed/threshold NULL: a yes/no finding). | **LIVE**. First run: `audiences 4, recorded 4, drifted 0, warned 0, degraded false`, so the reporting token CAN read a Pixel audience's rule. `verify_jwt` still false. |
| Growth ▸ Ads "Audiences" card; the guardrail history now shows "—" for a NULL observed value. | working tree, `tsc` clean, **NOT pushed** |

Seeds: `all_visitors` v0, adopted from Ads Manager and active, plus four
**drafts that are not on Meta**:

| key (v1) | Job | Rule (30 days unless stated) | Our qualifying visits |
|---|---|---|---|
| `price_seen` | retarget | ReachedPricing; exclude Purchase (180 d) and Lead | 399 |
| `dates_opened` | retarget | AddToCart; exclude ReachedPricing, Purchase (180 d), Lead | 506 |
| `plan_viewed` | retarget | ViewContent; exclude AddToCart, Purchase (180 d), Lead | 678 |
| `top_engaged` | seed | match-all, time_spent top 25%, 180 days | 1,671 |

The three retarget tiers are disjoint by construction, so they can carry
different messages without bidding against each other. Leads are excluded
because they are already reachable on WhatsApp and through `leads_unpaid`: these
hold only people we have no other way to reach. Buyers are excluded by the Pixel
Purchase event **and** should also be excluded at the ad set by
`customers_all_paid`, because the Pixel misses anyone who never came back from the
UPI app.

### How to create one, when the founder says so

1. Create through the Meta Ads MCP (`ads_create_custom_audience`, subtype
   WEBSITE) using the draft's `name` and `rule`. The reporting system user holds
   the ad account but not the Pixel, so creating from an edge function is not the
   path.
2. In ONE update, set `audience_id` and `status = 'active'`. The trigger stamps
   `activated_at` and freezes the rule from then on.
3. Read the audience straight back and store Meta's rule as `rule_baseline`, so
   drift detection has no six-hour blind window before the next sync.
4. To change a live audience later: insert version N+1, create it, then retire the
   old version here. **Never delete it on Meta** — that pauses any campaign
   targeting it.

### Deliberately not built

- **Per-plan audiences** (`content_ids` contains a slug). The highest-value
  retargeting there is ("a new date for the plan you looked at"), but
  `content_ids` is an ARRAY and array matching is unverified. It needs one
  throwaway audience to verify first, and at about 1% matchable it would hold
  nobody yet. The cleaner fix is to add a scalar custom param (the slug) to every
  Pixel event, which is a client change.
- **A push on audience drift or starvation.** An audience Meta cannot deliver to
  spends nothing, so it is an opportunity cost, not burn. Visible in the panel only.

### Verification run

- 43 assertions in one rolled-back transaction: every seed valid; 10 bad rules
  each refused with a reason; frozen-rule edit, rebind and two-active-versions all
  blocked; draft edits allowed; a key-reordered rule reads as no drift and an
  edited one as drift; pixel id stored exactly as `28370453785913523`; unparseable
  rule text survives; one row per audience per day; anon and authenticated can
  execute none of the core functions; the founder gate returns NULL when closed.
- The edge function type-checked with `tsc` and a Deno shim (Deno is not
  installed on this machine).
- Security advisor: the only finding on the new objects was EXECUTE on the trigger
  function, now revoked (`meta_audience_layer_guard_grants`, mirrored into the
  migration file). `get_meta_audience_health` carries the same
  authenticated-SECURITY-DEFINER notice as every founder RPC.

---

## 20. Catalog readiness — built 2026-09-11

Source: Meta's **Advantage+ catalog ads** doc (user signals, catalog association,
product audiences), supplied by the founder on 2026-09-11 and read against the
live data rather than on its own.

### What the doc changes here, and what it does not

| The doc says | Here |
|---|---|
| App Events, SDK, MMP (`fb_mobile_*`) | Not applicable: there is no app, and this project never proposes one. |
| `Search` and `ViewCategory` with the top 5-10 `content_ids` | There is no search, and a "category" is the whole plan list, so it would be noise. Not built. |
| `content_ids` + `content_type` on ViewContent / AddToCart / Purchase | **Already done.** Every Pixel product event carries `content_ids: [slug]` and `content_type: 'product'`: 1,718 of 1,718 funnel rows in the 28 days to 2026-09-11, zero ids that are not a real slug. Browser Purchase and the CAPI Purchase and Lead send the same. A catalog keyed on slug matches from its first day. |
| `product` vs `product_group` | Plan-level products (id = slug), no variants. Date-level products would need a date-specific id after `date_selected` and `product_group` at ViewContent; not worth it at ~10 plans. Switching later changes the ids, so product audiences would restart. |
| Associate the Pixel with a catalog; product audiences via `/act_<id>/product_audiences` | The supported way to do the per-plan retargeting §19 left unbuilt, because plain WCA rules cannot be trusted to match inside the `content_ids` array. Needs a catalog first, and carries the same ~1% match caveat as §19. |
| Exclusions apply per product GROUP | With no `item_group_id`, each plan is its own group: buying plan A excludes someone only from plan A's audience. That is right for a club where one person books several plans. |

### What reading it against our data found

- **No catalog exists** on the business, and none is connected to the Pixel
  (`ads_catalog_list_catalogs`, `ads_catalog_event_source_get_catalogs`).
- **Price.** Open events store `price_full = 0`; the real price lives per city in
  `city_details` (`resolveDefaultFullPrice`). A naive feed would advertise Founders
  Meet at ₹0.
- **Images.** No live plan has a `hero_image`. Founders Meet has no media at all;
  the other two share one video thumbnail (800×1200 JPEG: above Meta's 500×500
  floor, but two identical ads).
- **Link.** The only URL that opens one plan is `/?preview_event=<slug>`
  (`vercel.json` exempts it from the `/` → `/lifestyle` redirect). It works for
  customers, but **it never fired `event_selected` (ViewContent)**; only tapping a
  plan in the list did (`AppFlow.tsx` ~1627). Latent today (2 of 386 sessions in 28
  days landed that way), but every ad pointed straight at a plan would have
  reported page views and no plan views, starving the event this account can
  optimise on. Fixed in the working tree.
- **Availability** is computable but not stored: per-date capacity
  (`total_capacity`) minus paid tickets on that `selected_date`, the same
  arithmetic as `AppFlow` `spotsLeftForBookingDate`. `event_dates.status` is
  `available` on every row, so nothing stored ever says "sold out".

### What was built

| Piece | Status |
|---|---|
| `meta_catalog_items()` (service_role only): one row per active plan that takes payment, with resolved price, image (hero, else first media thumbnail), direct link, in or out of stock, next open date, **problems** that keep it out of the feed (`no_price`, `no_image`, `no_description`) and **warnings** that stop it being advertised well (`no_upcoming_date`, `sold_out`, `shared_image`, `invite_only`). Helpers `meta_plan_price`, `meta_first_image` and `meta_positive_number` mirror `src/eventPricing.ts` and `parseHeroImages`; keep them in step. | **LIVE** |
| `get_meta_catalog_readiness()`: founder-gated jsonb over the same rows. | **LIVE** |
| `meta-catalog-feed` v1: public CSV product feed from the same rows. Serves only rows with no problem; answers 503, never an empty 200, if the query fails; GET and HEAD only. | **LIVE**, `verify_jwt: false`. Serves 2 rows today (Pondy in stock, Anna Nagar out of stock); Founders Meet held back for having no photo. |
| `AppFlow.tsx`: a direct plan link fires `event_selected`, skipped on a Google-login return and when `staff=1`. | working tree, `tsc` clean, **NOT pushed** |
| `AdminPanel.tsx`: preview links carry `&staff=1`; the "Plans ready to advertise" card in Growth ▸ Ads. | working tree, **NOT pushed** |
| `CLAUDE.md`: the `--no-verify-jwt` list gained `meta-ads-alerts` and `meta-insights-features`, both live with `verify_jwt: false` and both missing from it, plus `meta-catalog-feed`. | done |

Verification: 19 assertions in a rolled-back transaction (8 price-mirror cases
including camelCase precedence, "Other" skipped, a case-insensitive city key and
a garbage price falling back to the plan price; 5 image-mirror cases including
broken JSON; the real plans; founder gate NULL when closed; grants). The live feed
fetched with no credentials returned 200 `text/csv`, HEAD 200, POST 405. The
security advisor's only note is the standard SECURITY-DEFINER notice every
founder RPC carries.

### Deliberately not built

- **The catalog itself**, the Pixel association, product sets and product
  audiences: all writes to the business, awaiting the founder. The steps are a
  commerce catalog, then a scheduled feed pointing at
  `https://txcmismkdttgsyhbnexf.supabase.co/functions/v1/meta-catalog-feed`, then
  connecting the Pixel as its event source.
- **Staff noise beyond ViewContent.** Admin previews still fire `page_view`, and
  any later step an admin clicks through. That predates this work; the real fix is
  a session-level guard inside `trackEvent`, a central change deliberately not made
  in passing.

### One opinion, stated once

Catalog ads render the plan's photo, title and price in Meta's own template. For a
curated club that is a brand cost on cold audiences. Their natural use here is
retargeting people who already viewed a specific plan, where showing them that
exact plan is the whole point.

---

## 21. What Meta is told, what we measure, and the pre-spend economics — 2026-09-16

Source: a session that read this document, checked it against the live systems,
and put questions to the founder. His answers are recorded as his, **condensed
from his messages, not verbatim**.

### 21.1 Meta gets the full ticket at the advance: the founder's decision and his reasoning

**The decision.** When a customer pays the advance, Meta receives a Purchase worth
**the full ticket price × tickets**. The balance payment reports nothing. Live
since 2026-09-06 (`reported_value`; migration applied 2026-09-03).

**His reasoning, condensed:**
- Someone who pays the advance has already been convinced. The ad, the creative
  and the page did their job, and that is the conversion Meta should learn from.
- Skipping the balance costs the customer their own advance. So when it happens,
  it is usually for a reason unrelated to the ad: an emergency, a clash, not being
  able to attend.
- So the ad is credited with the whole ticket.
- What was actually collected is tracked separately on our side. That, not Meta's
  figure, is the real ROAS.

**Why this is written down in full.** Two earlier records gave different reasons:
- The original comment in `_shared/metaCapi.ts` defended reporting only the
  *advance* ("a no-show would make it a lie"). The `reported_value` change
  reversed that on purpose.
- §2 and Layer 1 then justified full value with "~80% of advances complete". That
  was never his reasoning. It also invites someone to reopen the decision as soon
  as a pay-at-venue event shows 36% (§21.4).

**The founder's reasoning does not depend on the completion rate.** Do not
re-propose reporting the advance, an expected value, or a no-show-adjusted value
(§15).

### 21.2 Verified against the code and the live systems, 2026-09-16

| Claim | Evidence |
|---|---|
| The value is stamped once, at order time, from the city price | `create-payu-order` ~730: `reported_value: paymentType === 'balance' ? null : prices.full * ticketCount`. `prices` comes from `cityPrices(event, trustedCity)` (~550), which reads `city_details`. It is stamped on each payment row, so a later price test does not rewrite what Meta was told about an earlier sale. |
| All three server reporters send it | `payu-callback` ~992, `payu-webhook` ~934, `verify-pending-payments` ~946: `reported_value ?? amount`. |
| The browser sends the same number | `App.tsx` ~4589: `trackPurchaseOnce` with `payment.reported_value`. Balance payments return early (~4564). |
| A balance reports nothing | `sendPurchaseToMeta` returns on `paymentType === 'balance'`, before any network call. |
| What runs is what the repo says | `_shared/metaCapi.ts` on disk is dated 10 Sep, **after** the last importer deploy (8 Sep 18:20 UTC). That is the §9 drift pattern. It was checked by **content**, not by dates: the deployed `capi-lead` v9 bundle contains every uncommitted change in that file (the v26.0 version and the rewritten value comment). No drift. |
| Meta is still receiving events | `ads_get_dataset_stats` SERVER_ONLY: the last real Lead (13 Sep 18:55 UTC) and the last Purchase (6 Sep) each landed in the same hour. `ads_get_dataset_quality` currently returns **no match-quality score for Lead or Purchase**, because there were too few events in its window (0 Purchases, 1 Lead in the last 7 days). This is not a fault. Check that absence against our own sales before reading it as a breakage. |
| True ROAS exists and is live | `get_meta_ads_performance`: `our_revenue` is every successful `payu_payments.amount` for the booking (advance **and** any later balance), bucketed by click day, with `true_roas` beside `meta_roas` per ad. The base Growth ▸ Ads panel **is pushed**: commit `234d7bc` is on `origin/main`, though an older memory note says otherwise. Later additions (breach history, audiences card, plans-ready card) are still unpushed. |

### 21.3 What true ROAS does not yet separate

The gap between `meta_roas` and `true_roas` currently mixes four things. Only the
last is about Meta:

1. **Balances not yet due.** Revenue is cash *so far*. On a pay-at-venue event the
   balance cannot arrive before the event day, so a recent window reads low and
   corrects itself later. Nothing is wrong with the ad.
2. **No-shows.** Under the founder's reasoning (§21.1) these are not the ad's
   fault, so they deserve their own line. They can be derived without capturing
   any new data:
   - On a pay-at-venue event, a booking still `advance_paid` after its date means
     the person did not come. The founder confirmed this for Founders Meet.
   - Since 2026-08-31 (first stamped balance 13:38 UTC), a venue balance also
     writes `applications.attended_count` with the number of people paid for at
     the door. That catches a multi-ticket group where only some of them came.
3. **The gateway fee.** Customers pay it on top, as a separate line on the bill
   page. **Founder-confirmed and verified in code: it exactly covers PayU's
   deduction.** `PaymentOverlay.tsx` sets each rate by grossing up PayU's cut, so
   the business keeps exactly the ticket price:
   - UPI, debit card, net banking, BNPL: PayU takes 2.36%, customer pays +2.42%
   - credit card, EMI: 3.54% → +3.67%
   - wallets / cash card: 4.72% → +4.95%

   The server mirrors these in `FEE_RATES` in `create-payu-order`.

   - **Meta is already fee-free:** `reported_value` = ticket price × tickets.
   - **BUILT 2026-09-16 — true ROAS is now fee-free too.** The founder asked
     directly: *"I need to know with full clarity the true ROAS without the
     fees"*, taking into account that each payment method has its own rate.
     See "True ROAS without fees" below.
   - **One edge to confirm against a PayU settlement report:** the 5 `UPICC`
     payments (a credit card used through UPI) paid the UPI rate. Does PayU also
     charge us the UPI rate on those?
4. **Meta over-attributing.** This is the gap the panel exists to show.

**Candidate build, not built:** split `our_revenue` into *collected*, *still due*
and *lost to no-shows*. That is a change to one RPC plus the panel. (The fee half
of the original candidate is built: see below.)

#### True ROAS without fees — BUILT 2026-09-16

**How it works.** The ticket amount is not stored on a payment row, but PayU's
`payu_response->>'mode'` is. `payu_fee_split(amount, mode)` applies that method's
rate and then **checks the answer**. Ticket prices are whole rupees, so a correct
split lands on whole rupees to within paisa rounding. The method rates:

| Method key | PayU `mode` | Rate |
|---|---|---|
| upi, debitcard, netbanking, bnpl | UPI, DC, NB, BNPL | 2.42% |
| upi_credit_card | UPICC | 2.42% |
| creditcard, emi | CC, EMI | 3.67% |
| cashcard | CASH | 4.95% |

If the mode is missing or unknown, or its rate does not check out, the function
tries every rate (including 0) and accepts one only if exactly one fits. Two fits
are ambiguous: ₹5,121.00 is both ₹5,000 + 2.42% and a fee-free ₹5,121. Anything
else returns NULL.

**No guessing, no silent drops.**
- An unsplittable payment counts at the amount paid, so money never disappears.
- It is counted in `diagnostics.fee_unknown_payments` / `_amount`, and the panel
  shows an amber note when that is above 0.
- So a future fee change that nobody mirrors into the function shows up as a
  visible count, not as quietly wrong ROAS.

**Changed:**
- `get_meta_ads_performance`: `our_revenue`, `revenue` and `true_roas` are now
  ticket money. It also gains `our_fees`/`our_paid` per ad, `fees` per day,
  `totals.fees`/`paid`/`fees_by_method`, and `diagnostics.fee_unknown_*`. Key
  names are unchanged, so the panel already on `origin/main` shows fee-free true
  ROAS without a push.
- `get_meta_recommendation_scorecard`: its revenue uses the same split. It was
  applied as an exact text replacement against the LIVE definition, which fails
  loudly if that text has drifted, rather than as a hand-copied body.
- Growth ▸ Ads panel (working tree, `tsc` clean, **NOT pushed**):
  - "Money received" becomes "Ticket money", showing the fees removed.
  - A line reads "Customers paid ₹X = ₹Y ticket money + ₹Z fees".
  - The fees are broken down per method with each rate.
  - The fee-unknown note.
  - A hover on each ad's ROAS.

**Files:** migrations `20260916_payu_fee_split.sql` and
`20260916_meta_ads_true_roas_net_of_fees.sql`, both applied under those names.

**Verified:**
- **Real history:** all 156 successful payments split, with 0 unknown and 0
  negative fees:

  | Method | Payments | Fees |
  |---|---|---|
  | UPI | 147 | ₹926.01 |
  | credit card via UPI | 5 | ₹26.54 |
  | credit card | 3 | ₹21.94 |
  | no mode (resolved uniquely at 2.42%) | 1 | ₹62.92 |

  In total, customers paid ₹43,584.41 = ₹42,547 ticket money + ₹1,037.41 fees.
- **20 cases** passed: every method, lower-case mode, null and empty mode, a
  fee-free payment, a mode contradicted by the amount, the ambiguous ₹5,121, an
  unsplittable amount, an unknown mode, zero and null amounts, and a real ₹2 test.
- **RPC fixtures in a rolled-back transaction** (fixture slug `zz-fixture-true-roas`):
  - Inputs: ₹1,000 spend and 5 payments across UPI, credit card, wallet, no mode
    and unsplittable, plus a failed one.
  - Results: paid ₹1,332.98, ticket money ₹1,297.55, fees ₹35.43. True ROAS
    **1.30×** (1.33× with fees), Meta ROAS 1.50×.
  - Fees came out correctly per method, 1 payment was fee-unknown, the failed
    payment was ignored, and the scorecard revenue was ₹1,297.55.
  - With the founder gate closed, the result was NULL.
  - Afterwards: 0 rows left behind and 0 pushes sent.

- **First payment after the build:** 2026-09-16 18:26 UTC, a ₹1.02 UPI advance
  (a founder test). It split cleanly to ₹1 ticket + ₹0.02 fee. The §11 health
  query read 0 fee-unknown out of 157 on 2026-09-17.

**Not changed, and worth knowing:** `get_performance_summary` (Finances) still
sums `payu_payments.amount`, so its revenue figures include the gateway fee. It
is out of scope for ROAS and was left alone; the same helper fixes it when
wanted.

### 21.4 The number that checks the decision keeps holding

The reasoning in §21.1 assumes no-shows happen for reasons unrelated to the ad.
There is a baseline, from organic traffic only:
- **Founders Meet** (30 Aug, ₹100 advance, pay at venue): 28 advances, 10
  balances, 18 people did not come (64%).
- **Normal split bookings** complete about 95%: Anna Nagar 63/66, Kovalam 13/13,
  Pondy 3/4.

That is one event, 28 people and a low advance, so treat it as a baseline rather
than a rate.

**The check to run once ads exist: no-show rate by traffic source, on the same
plan.** If people who book from ads no-show far more than organic bookers, the
advance has stopped being a clean conversion signal for that traffic. That is the
moment to revisit the decision, with numbers. Until then this is a measurement to
keep, not a reason to change what Meta is told. Stated once.

### 21.5 Where the price lives

**Founder-confirmed:** `events.price_full` / `price_advance` are not the price for
open events. Founders Meet's read 0 because its prices are being tested.
**`city_details` per-city prices are correct and authoritative.**

Every reader already uses them:
- `create-payu-order` `cityPrices()`
- the guardrail evaluator's own `event_price` CTE (the highest per-city snake_case
  `price_full`)
- `meta_plan_price` for the catalog (camelCase `priceFull` first, then snake_case,
  then the column)

The two SQL readers disagree on camelCase keys and on multi-city plans (highest
city vs first city). That is harmless today, because every live plan has one city
and uses snake_case. Merge them into one when the ticket-economics work below is
built.

City prices on 2026-09-16:

| Plan | Full price | Advance |
|---|---|---|
| Founders Meet | ₹299 | ₹100 |
| Girls-Only Sip & Chat | ₹299 | ₹199 |
| Anna Nagar | ₹450 | ₹250 |
| Pondy | ₹3,700 | ₹2,600 |

### 21.6 Pre-spend economics audit: findings

**The cost-per-ticket alarm is set on price, but the founder's rule is margin.**
`cpa_over_40pct` fires at 40% of the ticket price. The 2026-09-08 decision
(Layer 7) is that an ad fails when a paid ticket costs more than the margin on it:

| Plan | Alarm fires at | Contribution per ad-sourced ticket |
|---|---|---|
| Pondy (₹3,700, cost ₹2,600) | ₹1,480 | ~₹800–1,050 |
| Anna Nagar (₹450, cost ₹150) | ₹180 | ~₹150–240 |
| Founders Meet (₹299, cost ₹0*) | ₹120 | ~₹170 |

How contribution is worked out: cash per ticket at the measured completion rate,
minus `cost_per_ticket`, minus the marketer and manager commission actually
accrued (Anna Nagar ~₹45 + ~₹9.5; Pondy ~₹37.5). Creator commission is left out
because an ad-sourced ticket normally carries none.

The alarm is too strict on meetups and too loose on trips. A Pondy ad at ₹1,200
per ticket would lose ₹150–400 on every sale without firing.
\*Whether the ₹0 cost is real is still open (§18).

**Design question for when this is built — ANSWERED 2026-09-17.** The founder
chose the margin on **cash actually collected, with transaction fees removed**,
not the margin on the full ticket. Do not re-propose the full-ticket basis. This
is consistent with §21.1 rather than a reversal of it: Meta is still told the
full ticket at the advance, because that is the conversion the ad produced; our
alarm judges whether the ad pays for itself, and only cash does that.

**Refined the same day into a concrete rule: ad budget per ticket = advance −
`cost_per_ticket`.** The founder's model for pay-at-venue plans: the advance
covers the event's full cost (everything except marketing) plus the ad; the
balance at the venue is profit. No separate "max cost per ticket" field. Why it
is a strong rule: the advance is the one payment kept even from a no-show, so an
ad inside that budget cannot lose money even if every buyer stays home (Founders
Meet: 18 of 28). Live values 2026-09-17: Anna Nagar ₹250 − ₹150 = ₹100; Founders
Meet ₹100 − ₹0 and Girls-Only ₹199 − ₹0 (cost not yet filled in, so the whole
advance reads as ad budget); Pondy ₹2,600 − ₹2,600 = ₹0 (not pay-at-venue; rule
for such plans still open). True ROAS on the panel keeps counting all cash,
balances included.

**Repeat buying is thin so far.**
- About 103–107 people have paid.
- Of the ~48 whose first purchase was 60+ days ago, 6–7 bought again (about 1 in 7).
- One person has gone from a meetup to a trip.
- **Nobody has ever re-booked the same plan on a new date.** `applications` is
  unique on `(event_slug, phone)`, so it is unverified whether a past guest even
  *can*. Repeat buying must be read from `payu_payments`.

The sample is small and few trips have been on offer. But for now a customer is
worth about one ticket, which supports "must pay for itself now".

**Price history matters when reading old cash.** Anna Nagar sold at ₹299 until
mid-July, ₹359 from 23 Jul, and ₹450 since (no sales at ₹450 yet).

**Traffic comes in launch bursts:** 2,646 sessions in the week of 29 Jun, 1,249
in the week of 10 Aug, 83 in the week of 7 Sep. The "~400 sessions a week" used
in §12 and §17 is an average across bursts, not a steady state.

**Audience snapshots:** "Website visitors - 180d" read 20 on all six days from 11
to 16 Sep. At trough traffic a ~1% match rate predicts about one new person a
week, so this still does not settle whether the audience is stale or just small
(§19).

### 21.7 Proposed build order, awaiting the founder

1. **Ticket economics — BUILT 2026-09-18** (founder: "use one rule everywhere,
   go ahead and build it"). Record below.
   ~~One per-plan definition of what a ticket is worth. The cost alarm reads it
   instead of 40% of price. Before any spend, it also gives a maximum cost per
   click for each plan, from real funnel rates.~~
2. **True-ROAS split** (§21.3): collected / still due / lost to no-shows. The
   fee-free half is **BUILT 2026-09-16** (§21.3, "True ROAS without fees").
3. **Customer value by source:** repeat buying at 30/60/90 days, conversion to
   trips, and the §21.4 no-show check, all per source.
4. **BUILT 2026-09-16 — see §22** (runs daily at 09:11 IST, plus a token probe).
   **Daily check that Meta is still receiving events.** Compare our paid bookings
   and Leads against Meta's server counts, and push on a mismatch. This closes the
   silent-token gap in §10.
5. **Once ads run, judge creatives by concept**, pooled across ads, because a
   single ad never earns enough tickets to judge on its own.

#### Ticket economics — BUILT 2026-09-18

**The founder's rule, in his own model.** Most events will be pay-at-venue. The
advance is set ABOVE the event's cost on purpose: the cost covers everything
except marketing, and the surplus is what pays for the ad. The balance collected
at the venue is profit.

```
ad money per ticket = money paid AT BOOKING − events.cost_per_ticket
```

He asked for **one rule everywhere** rather than a per-plan "maximum CAC" field,
because price and cost already give the answer: on a `split` plan the money at
booking is the advance, on a `full` plan it is the whole price. He also said he
will keep putting every cost except marketing (logistics, people) into
`cost_per_ticket`.

**Why the advance and not the whole ticket.** The advance is the one payment kept
even when the guest never arrives — 18 of 28 did not at Founders Meet (§21.4).
An ad inside this budget therefore cannot lose money even if every buyer
no-shows. What Meta is told is untouched (§21.1), and true ROAS on the panel
still counts every rupee received.

**What was built** (migration `meta_ad_budget_per_ticket`, applied):

| Piece | Note |
|---|---|
| `meta_booking_prices()` | The one resolver for money at booking. **Mirrors `cityPrices()` in `create-payu-order`** — a city override counts only when > 0, and snake_case keys only. §21.5 asked for one price reader; this one states which side it must agree with (what is CHARGED), and `meta_plan_price()`'s camelCase-first read is left alone for the catalog. |
| `threshold_mode = 'pct_of_ad_budget'` | A new mode, not an edit of the old one, so past `meta_ad_guardrail_events` rows still explain themselves. The threshold is a percentage of the ad money, so **100 = fires when a ticket costs more than it leaves**, and a lower number warns earlier without a deploy. |
| Rule `cpa_over_ad_budget` | Enabled. `cpa_over_40pct` is now `enabled = false`, kept as a row with a note saying what superseded it. |
| `meta_ad_guardrail_breaches()` | Ticket-weighted ad money across the plans one ad actually sold, and **`tickets` now sums `applications.ticket_count` instead of counting rows** — a four-head pay-at-venue booking was reading as one acquisition, i.e. four times worse than reality. Context gained `ad_money_per_ticket` and `cost_not_set`. |
| `get_meta_plan_ad_budgets()` | Per plan, before any spend: ad money per ticket, and the most a click may cost — `ad money × (paid tickets ÷ plan-view sessions)`, with a 95% range from `poisson_ci95()`, local test sessions set aside by the §22 fingerprint. |
| Growth ▸ Ads "What each plan can spend on ads" | Working tree, `tsc` clean, **NOT pushed**. |

**Deliberate choices worth not re-litigating:**
- **No new input field.** The founder rejected one as unnecessary complication.
- **The push wording needed no change**, so `meta-ads-alerts` was NOT redeployed:
  it already says "Rs.X per ticket vs a Rs.Y ceiling", which is exactly the
  comparison. One less deploy on a function another session was touching.
- **A negative budget is clamped to 0 in the threshold** (a plan costing more to
  host than it collects at booking), so the notification reads "vs a Rs.0
  ceiling" rather than a negative one; the real figure travels in the context.
- **The Rs.50 price floor is kept**, so the deliberate Rs.2/Rs.3 test events
  cannot set an 80-paise ceiling. Not the amount-based payment filter he rejected.
- **`cost_not_set` is reported rather than guessed.** `cost_per_ticket` is NOT
  NULL DEFAULT 0, so "free to host" and "never filled in" are the same value; a
  Rs.0 cost makes the whole advance look like ad money. The panel says so on the
  plan, and the flag travels in the breach context.
- **The click ceiling is computed over 90 days, not the panel's window
  selector.** It is a conversion rate, and traffic arrives in launch bursts
  (§21.6) — a 7-day rate would swing by an order of magnitude.

**Live figures the day it was built** (2026-09-18, 90-day window):

| Plan | At booking | Cost | Ad money per ticket | Most a click may cost |
|---|---|---|---|---|
| Chill Sunday Meetup (Anna Nagar) | ₹250 advance | ₹150 | **₹100** | ₹2.23 (likely ₹1.63–2.97), 46 tickets / 2,064 plan views |
| Founders Meet | ₹100 advance | ₹0 *(not filled in)* | ₹100 | ₹9.62 (likely ₹6.39–13.91), 28 / 291 |
| Our Cozy Girls-Only Meet | ₹199 advance | ₹0 *(not filled in)* | ₹199 | ₹1.35 — too few tickets to judge (1 of 10) |
| Pondy Beach Houseparty | ₹2,600 advance | ₹2,600 | **₹0** | none: nothing to spend |

**Read the click ceiling as an upper bound.** It comes from visitors who mostly
already know the brand; ad traffic normally converts worse. Founders Meet's
₹9.62 also rests on a ₹0 cost that is probably not real.

**Verified** in one rolled-back transaction, six fixture ads against real prices:
Anna Nagar at ₹150/ticket fired against a ₹100 ceiling; the same plan at
₹80/ticket stayed silent; Pondy fired against ₹0; Founders Meet fired with
`cost_not_set: true`; an ad selling 5 Anna Nagar and 5 Pondy tickets was judged
against the ticket-weighted ₹50; and an ad under the Rs.500 spend floor was
suppressed. Ten tickets came from two bookings, which is what proves the
`ticket_count` fix. `cpa_over_40pct` fired on nothing. The founder gate returned
NULL when closed. Afterwards: 0 fixture rows, 0 breach events, 0 commissions
accrued, 0 pushes. The security advisor shows only the standard SECURITY DEFINER
notice every founder RPC carries; `meta_booking_prices` is not flagged at all.

**Still open on this item:** the real `cost_per_ticket` for Founders Meet and
Girls-Only (§18), which is the founder's to type in Team ▸ Performance.

Also raised for evaluation, not for building: **Click-to-WhatsApp ads.** They fit
the founder's own reason for pay-at-venue (first-time buyers need trust, and a
real marketer supplies it), and `whatsapp_inbound.referral` already exists (0
rows so far).

---

### 21.8 Open events pay no commission — FIXED 2026-09-18

**His instruction, verbatim in substance:** *"for open events no need to pay to
marketers or managers. Fix this."* Plus, in the same message: *"don't worry about
the costs of events as of now, I'll update the costs when I'm actively running
ads."*

**Why this belongs in a Meta document.** Break-even per ad-sourced ticket is
computed after commissions (§21.6). A commission nobody intends to pay makes
every margin figure wrong in the same direction, so the ad economics could not
be trusted until this was settled.

**What was wrong.** The decision dates from 2026-08-10 and was never in the
code. It had been implemented by clearing `events.marketer_commission`, which
does the opposite of stopping payment: both accrual triggers read
`COALESCE(events.<role>_commission, <person>.commission_amount)`, so a NULL on
the event falls through to **the person's own rate**. Measured on production
2026-09-18, accrued on open events since 2026-08-10:

| Role | Amount | Detail |
|---|---|---|
| Marketer | ₹875 | Anna Nagar ₹500 across 7 marketers, **all `paid_out_at` set**; Kovalam ₹325 to the founder's own marketer account, unpaid |
| Manager | ₹385 | Anna Nagar, one manager, unpaid |

It was also not finished happening: `event_managers` still maps a manager to
`anna-nagar-meetup`, so each of its ~111 unpaid leads would have accrued ₹35 on
payment, and three older `advance_paid` rows still carry a marketer stamp.

**The fix** (`20260918_open_events_pay_no_commission.sql`, applied):
`accrue_marketer_sale()` and `accrue_manager_sale()` return early when
`is_open_event()` is true.

Four deliberate choices:

- **In the accrual, not in the mappings.** Assignment happens at LEAD time and
  the owner id is stamped on the row (the attribution pin in CLAUDE.md), so
  unmapping a marketer or manager today would not stop an already-stamped lead
  from accruing when it pays. The accrual is the only reliable place to say no.
- **Assignment is untouched.** A manager still owns open-event leads for the
  6pm brief and the scorecards — unpaid. This changed the money, not the ops.
- **The two-tier open-event fee is kept but unreachable**, with a comment
  saying so. Reinstating open-event commission is then deleting one guard
  rather than rebuilding the 2026-08-04 machinery.
- **Nothing accrued was reversed.** Money already paid out is not a migration's
  decision. The ₹385 + ₹325 unpaid rows are still there, and what to do with
  them is the founder's call (§18).

**Verified** in one rolled-back transaction: an open-event booking flipped to
`fully_paid` with both a marketer and a manager assigned produced **0 marketer
rows and 0 manager rows**, with both assignments still on the row; an
invite-event booking flipped the same way still produced **₹50 marketer and ₹35
manager**. Afterwards: 0 fixture rows left, totals unchanged (75 marketer, 18
manager), and both functions carry the warning in `obj_description` so it is
visible to anyone reading the schema without this file.

**Still forecasting a commission it will never pay:**
`get_performance_summary()` (Finances, and the per-event unit-economics table)
computes marketer and manager commission per ticket for open events too, from
`COALESCE(e.marketer_commission, 50)` and the manager's rate. So Finances now
understates open-event profit by that much. It is a display-side change to his
money dashboard, so it was raised rather than bundled into this migration.

---

## 22. Signal watchdog: is Meta receiving our sales? Built 2026-09-16, daily since 2026-09-17

This closes the silent-token gap flagged in §10 and listed as §21.7 item 4. It
was asked for directly by the founder.

### Status at a glance — re-verified against production 2026-09-19

| | |
|---|---|
| **Live** | Yes. `meta-signal-watchdog` **v4**, `verify_jwt: false`. Database objects applied. Untouched by the sessions that took `meta-ads-sync` to v22. |
| **Schedule** | **Once a day, 03:41 UTC = 09:11 IST** (founder's decision, 2026-09-17). **Proven on its own**: unattended daily runs on 17 and 18 Sep, six rows each. It ran hourly on 16 Sep before the change. |
| **Alerts** | ON for all six checks. **None has ever fired**: 0 push decisions across 78 check rows. |
| **Last verdicts** (03:41 UTC, 18 Sep) | **All six ok.** Token ok, never expires · test mode off · **Purchase 1 of 1** · Lead 2 of 2 · plan views 17 of 19 · calendar opens 14 of 16 · no test sessions set aside |
| **First real sale checked** | 18 Sep. Until then Purchase had read `too_few` (no sales in the window) since the watchdog was built, so the money path was unexercised. A real paid booking has now been matched to Meta's copy of it, 1 of 1. |
| **Not pushed** | The Growth ▸ Ads card ("Is Meta hearing about your sales?"). Until it ships, a phone notification is the only surface. |
| **Not committed** | All of it. The function, the four migration files, the card, and the edits to `CLAUDE.md` and this file are in the working tree. |
| **Not tested end to end** | A watchdog alert actually reaching the phone (see Verification run). |
| **Open proposal** | Tag every `flow_analytics` row with the site address (§18). |

**Applied migration names differ from the repo files, on purpose.** Five were
applied: `meta_signal_watchdog`, `meta_signal_watchdog_cron`,
`meta_signal_watchdog_cron_timeout`, `meta_signal_exclude_dev_sessions` and
`meta_signal_watchdog_daily`. The repo has four files: the timeout change is
folded into `20260916_meta_signal_watchdog_cron.sql`. Two settings were changed
by direct UPDATE:
- The test-mode label was renamed to "Meta test mode". This is mirrored in the
  seed.
- `push_enabled` was switched on. **Not** mirrored: the seed deliberately stays
  `false`, so a fresh environment starts silent.

Replaying the repo files gives the same end state apart from that switch.

### What it answers

Every Purchase and Lead reaches Meta through one secret, `META_CAPI_ACCESS_TOKEN`,
and `_shared/metaCapi.ts` is fire-and-forget on purpose. If that token is revoked,
expires, or loses the Pixel, nothing says so. Sales keep landing in
`payu_payments`, Meta optimises on half the data, and the first human sign is a
week of bad numbers.

`meta-signal-watchdog` runs **once a day at 09:11 IST** and compares what **our database** says
happened with what **Meta's dataset** says it received. It changes nothing on
the payment path, deliberately: the send-log alternative would edit
`_shared/metaCapi.ts`, a five-function redeploy through `payu-callback` and
`payu-webhook` (§9). Watching from outside also catches failures a send log
cannot: a changed Pixel ID, a code path that stopped calling the sender, a
browser Pixel broken by a deploy.

### Six checks (rows in `meta_signal_watch`, so thresholds change without a deploy)

| Check | Our side | Meta side | Broken when |
|---|---|---|---|
| `capi_token` | — | `debug_token` + Pixel read, with the CAPI token | Meta rejects it (190), `is_valid:false`, the Pixel drops out of its granular scope, or the Pixel is unavailable. **`expiring`** within 7 days of a death date. |
| `capi_test_mode` | — | is `META_CAPI_TEST_CODE` set | set at two daily checks in a row (test bookings then reach Meta as real sales) |
| `purchase_server` | `payu_payments` success, not balance, not a test phone, at PayU `addedon` | `/stats` SERVER_ONLY `Purchase` | newest **2** sales both missing, or ≥3 missing and ≥20% of the 6-day window |
| `lead_server` | `applications` with a `lead_id`, not a test phone | SERVER_ONLY `Lead` | same as Purchase. Its detail also carries `lead_sends_failing`: leads that `capi-lead` has retried for over an hour without Meta confirming. |
| `view_content_web` | `flow_analytics` `event_selected` | WEB_ONLY `ViewContent` | fewer than 25% matched over 72 h, with at least 15 expected. Under 60% is a `gap`. |
| `add_to_cart_web` | `flow_analytics` `calendar_opened` | WEB_ONLY `AddToCart` | same |
| `pixel_config` *(check 7, added 2026-09-19)* | what the site sends (mirrored in the verdict function) | Meta's public settings file for the Pixel (§9) | Meta **blocks** an event we send, **strips** a parameter we send, **prohibits** chaptera.in, or turns on **restricted-data mode** → `broken`, pushes at once. File unfetchable, unparseable, or the empty plugin Meta serves for unknown Pixels → `unreadable`, pushes on day two. Restrictions on things we do not send, URL parameters blanked in Meta's copy, or a watched feature (automatic matching, automatic events, SmartSetup, page scraping, first-party cookie, restricted mode) switched within 7 days → `gap`, page only. Alerts **on** from its first live run: it has no thresholds to tune, and until the card ships the phone is its only surface. |

The two browser checks are there because ViewContent and AddToCart are the only
events this account can optimise on (§9). A broken Pixel starves those first.

### How matching works, and why not totals

Meta's dataset holds extra server events from test rows that were deleted
afterwards. So a window total can read "6 received, 6 expected" while a real
sale is missing and a test event stands in for it. Instead, each of our events
claims one Meta event in its own hour or the hour either side, oldest first
(`meta_signal_match`). Hours are keyed in UTC; Meta buckets at -07:00, and both
are whole-hour offsets.

**Checked against real history before any threshold was set:**
- **Lead**: every application row matched to the exact hour, 26 Aug to 13 Sep.
- **Purchase**: every paid booking matched except **21 Aug 09:37 PDT, which Meta
  never received**. The check reports that week as a `gap`, 4 of 5. A real lost
  sale, and not by itself proof the pipe broke.
- **Browser**: matched per event against Meta's hourly WEB_ONLY counts, with our
  own local test sessions set aside, by week from 19 Aug:
  - ViewContent: 98%, 94%, 93%, 94%
  - AddToCart: 98%, 96%, 88%, 98%

  An earlier version of this line said "Meta used to see all of it and now sees
  about 80%". **That was wrong**: see "The 80% that was not real" below.

### When it pushes

`meta_signal_record()` decides, and the decision itself arms the cooldown (the
`meta_ad_guardrail_events` rule, §5 Layer 7):
- `broken` and `expiring` push immediately.
- `unreadable` pushes only on the second daily check in a row (held ≥12 h).
- `test_mode_on` pushes only on the second daily check in a row (held ≥12 h).
- `gap`, `too_few` and `unverifiable` never push.

The first run of a bad streak pushes. Within one streak it reminds after
`cooldown_hours`: 12 h for most checks, which on the daily schedule means **one
reminder per daily run**, and 20 h for test mode. A new streak after a recovery
pushes again, but never twice within 2 h. Pushes use the proven `meta_ad_issue` type, tagged `signal-<check_key>`,
rather than a new `send-admin-push` case in the payment-notification path.

### Facts measured on the first live run

- **The CAPI token is a SYSTEM_USER token, never expires (`expires_at: 0`), and
  lists the Pixel in its granular scopes.** Its only named scope is
  `read_ads_dataset_quality`.
- **The CAPI token cannot read `/stats` or the Pixel node** ("(#100) Missing
  Permission"). The reporting token (`META_ADS_ACCESS_TOKEN`) can, so the stats
  reads use it first. **This check's view of Meta therefore depends on the
  reporting token.** If it dies, the event checks go `unreadable` and push after
  the second daily check, and `meta-ads-sync` raises its own dead-token alarm too.
- The hourly `/stats` aggregation returned no duplicate event entries. MAX is
  kept as a guard in case it ever does, because a sum would hide a missing sale.
  (The twin "Purchase 2, Purchase 2" entries seen earlier came from
  `event_total_counts`, which ignores the source filter; see below.)
- First verdicts:
  - token: ok
  - test mode: off
  - Purchase: `too_few` (no sales in 6 days)
  - Lead: 1 of 1
  - ViewContent: 18 of 20
  - AddToCart: 16 of 17

### Objects

| Object | Notes |
|---|---|
| `meta_signal_watch` | The six checks and their thresholds. Founder SELECT only. |
| `meta_signal_checks` | **Every run, ok rows included**, because a trend over time needs the unremarkable runs too. 6 rows a day on the daily schedule. |
| `meta_signal_expected_times()` | Our side. **Each branch mirrors the sender's own rule.** Change who `sendPurchaseToMeta` skips, or the `PIXEL_EVENTS` map, and this must change too. |
| `meta_signal_match()`, `meta_signal_verdict()` | Pure functions, testable with fixtures. |
| `meta_signal_dev_sessions()` | Local test sessions to set aside in the browser checks (the StrictMode fingerprint below). `service_role` only. Each browser check row records `dev_rows_excluded`. |
| `meta_signal_evaluate()`, `meta_signal_record()` | `service_role` only. A founder gate would return nothing to the cron, silently disabling the watchdog (§6). |
| `get_meta_signal_health()` | Founder-gated jsonb for Growth ▸ Ads ("Is Meta hearing about your sales?"). The card is in the working tree, **not pushed**. |
| `meta_pixel_config_verdict()`, `meta_pixel_config_evaluate()` | Check 7 (2026-09-19, `20260919_meta_pixel_config_watch.sql`). The verdict is pure over the facts `readPixelConfig()` extracts; evaluate adds the last *readable* run as the baseline, so an unreadable day cannot erase it. `service_role` only. Its event and key lists **mirror `PIXEL_EVENTS` (src/supabase.ts) and `PixelParams` (src/metaPixel.ts)** — send a new event or parameter, add it there, or its stripping reads as someone else's problem. It writes a plain-English `detail.summary`, which the card shows as-is. |
| Cron `meta-signal-watchdog` | `41 3 * * *` (daily, 09:11 IST), `timeout_milliseconds := 60000` |

**The function refuses a run within 5 minutes of the last one (429).** It is
`--no-verify-jwt` for the cron, and this bounds what a stranger with the URL can
spend, with no secret for the cron to carry.

### Verification run

- **Rules and matching:** 23 of 23 assertions on made-up numbers. They cover hour
  tolerance, a PDT key aligning with UTC, one Meta event unable to match two
  sales, an extra in another hour unable to hide a miss, the newest-run counter,
  garbage keys, and every verdict at today's volume and at 500 sales a week.
- **Real history,** using Meta's actual hourly counts: the 21 Aug week reads
  `gap` 4/5, the test-heavy 31 Aug week reads `ok` 5/5 (Meta total 11), and
  6 Sep reads `ok` 2/2. A simulated outage on the same sales reads `broken`, and
  a simulated dead Pixel today reads `broken` 0/20.
- **Push timing (hourly-era hold periods),** in a rolled-back transaction: first
  alarm, quiet repeat, 12 h reminder, recovery, new streak, flap guard, 6 h
  `unreadable` hold, 24 h test-mode hold, `push_enabled=false`, gap never
  pushing, grants, founder gate closed. 0 failures, and 0 rows left behind. The
  daily-schedule re-test is in "Daily, not hourly" below.
- **Live:** deployed v1, v2 (reporting token read first), v3 (comment corrections
  from the 80% investigation) and v4 (daily wording); `verify_jwt: false` after
  each. First run 200 with six
  sane verdicts; a second call within 5 minutes returned 429. The first
  **scheduled** run (11:41 UTC) wrote all six rows, but `net._http_response`
  recorded a pg_net timeout: the default is 5 s and a run takes ~8-9 s. The cron
  now passes `timeout_milliseconds := 60000` (`cron.alter_job`, mirrored in the
  cron migration file). **Any future cron that calls Meta more than once needs
  the same**, or §8's "trust `net._http_response`" check reads a timeout for a
  run that worked.
- **Phone alerts ON since 2026-09-16**, switched on by one UPDATE after the two
  clean runs above. Every row was seeded `push_enabled = false` so that a
  threshold mistake could not wake the founder on day one.

**Not tested end to end: a watchdog push reaching a phone.** No check is broken,
and faking one would put a false alarm on the founder's phone. The delivery type
(`meta_ad_issue`) is proven (§16 Phase 5). What is unexercised is the watchdog's
own branch that calls it and stamps `notified_at`.

### The 80% that was not real: investigated 2026-09-16

The founder asked why Meta seemed to see only ~80% of plan views and calendar
opens. The number was wrong in two separate ways.

**1. It came from the wrong Meta figure.** It was built from
`aggregation=event_total_counts`. That is **not the same measurement** as the
hourly `aggregation=event` counts:
- **It ignores `event_source`.** WEB_ONLY and SERVER_ONLY return byte-identical
  output. That is where the twin "Purchase 2, Purchase 2" entries come from.
- **It returned nothing** for a full day (30–31 Aug Pacific) that holds ~32
  hourly-counted plan views, and nothing for a 3-hour window holding 2.
- **Its weekly totals ran below the sum of its own hourly buckets**, e.g. 132
  against 152 plan views for the week of 26 Aug.

**Never reconcile against `event_total_counts`.** Use the hourly counts; they tie
out to our rows.

**2. Our side included our own testing.** `npm run dev` writes to the production
database. Since 18 Aug (commit `100b875`) the Pixel deliberately never loads off
`chaptera.in`, so local test visits land in `flow_analytics` and never reach
Meta. Both sides are correct, and the difference reads as Meta missing events.

In the week of 2 Sep, one session on 3 Sep (14:52–15:15 IST) was **6 of the 8**
plan views Meta did not get:
- it browsed inactive test plans ("Chill-pill in Himalayas" at ₹2, "Weekend
  Creator's Meet")
- every page view was written twice, milliseconds apart

**The fingerprint.** `src/main.tsx` renders in React StrictMode, which runs every
effect twice on the dev server and never in a production build, and `page_view`
fires from an effect. Since 12 Aug, only 21 of 1,703 sessions had a sub-second
`page_view` pair, 18 of them on nearly every page.
`meta_signal_dev_sessions()` sets a session aside when it has ≥2 sub-second pairs
covering ≥80% of its page views. That is deliberately strict: wrongly treating a
real visitor as a test would *hide* a real miss.

Validated on the two other sessions it flagged:
- `4d047d68` (6 Sep): page-view pairs 0–7 ms apart, and Meta's count for that
  hour equals exactly the other two real visitors in it.
- `c128f736`: doubled page views only, no plans opened.

**The real numbers, matched per event, test sessions set aside:**

| Week from | Plan views Meta got | Calendar opens Meta got |
|---|---|---|
| 19 Aug | 135 / 138 (98%) | 109 / 111 (98%) |
| 26 Aug | 144 / 153 (94%) | 129 / 134 (96%) |
| 2 Sep | 40 / 43 (93%) | 30 / 34 (88%) |
| 9 Sep | 44 / 47 (94%) | 45 / 46 (98%) |

No trend; the 88% is 4 events out of 34. The residual ~2–7% is consistent with
visitors whose browsers never ran Meta's script (ad blockers, strict tracking
protection). **Unverified**: `flow_analytics` stores no user agent or device, so
this cannot be split further from our side.

**Also ruled out:** events firing before the Pixel exists. `initMetaPixel()` runs
at module load in `src/main.tsx`, before any React effect, and the `fbq` stub
queues calls until `fbevents.js` arrives.

**Why it mattered beyond the question.** Unfixed, a long local test session in a
quiet 72-hour window would have pushed the browser checks to `gap`, or to a
false `broken` alarm on the founder's phone.
`20260916_meta_signal_exclude_dev_sessions.sql` applies the fingerprint to both
browser checks.

**Durable fix, not built:** stamp the host (or a dev flag) on every
`flow_analytics` row, so the funnel, the experiments and this watchdog can all
filter test traffic by fact rather than by fingerprint. That is a client change,
so it waits for a push. The fingerprint breaks silently if StrictMode is removed
or `page_view` leaves its effect. If that happens, the watchdog over-reports
gaps; it does not hide them. Stated once.

### Daily, not hourly: the founder's decision, 2026-09-17

The watchdog was built hourly and moved to **once a day, 03:41 UTC = 09:11 IST**,
at the founder's request. The trade-off was put to him once, and he chose daily.
**Do not re-propose hourly unless he asks.** The trade-off:
- A dead CAPI token is noticed up to a day late.
- Purchase sends are never retried, so sales in that gap do not reach Meta.
- `capi-lead` retries applications for only 24 h, so a late fix can also lose
  the earliest applications.

**What moved with the schedule** (`20260917_meta_signal_watchdog_daily.sql`):
- **The "must hold for" periods in `meta_signal_record()`.** `unreadable` went
  from 6 h to 12 h, and `test_mode_on` from 24 h to 12 h. On a daily schedule
  both mean *bad on two checks in a row*. A 24 h hold would have been a trap: two
  daily runs land a few seconds under 24 h apart, so the push would have slipped
  a whole extra day.
- **The `capi_test_mode` reminder cooldown**, from 24 h to 20 h, for the same
  reason.
- **The other checks' 12 h cooldown now means one reminder per daily run** while
  a problem persists.
- **Push wording** says "two daily checks in a row", and the panel card says
  "Checked once a day".

**Verified:**
- 10 timing assertions in a rolled-back transaction: runs a day apart, landing 3
  seconds short of 24 h; `broken` pushes day 1 and reminds day 2; `unreadable`
  and `test_mode_on` stay quiet on day 1 and push on day 2; one unreadable day
  between good days never pushes; `expiring` pushes on first sight.
- The cron keeps `timeout_milliseconds := 60000`.
- Function v4 is deployed with `verify_jwt: false`.

**If the schedule ever changes again, re-read those hold periods**, because they
are tuned to it.

---

## 23. Meta docs reviewed: log

The founder is supplying Meta developer docs one at a time (from 2026-09-16), to
build growth systems from before any ad spend. Each is read **against the live
systems and the business economics**, not on its own. Recorded here so a doc is
not re-audited, and so it is clear what each one changed. Earlier doc audits are
in §9, §12, §13, §19 and §20.

| Date | Doc | Verdict | What it changed |
|---|---|---|---|
| 2026-09-16 | **Ad optimization basics** (`customaudiences` + `insights` endpoints) | Nothing new; both endpoints already in use, more deeply than the doc shows | Nothing to build. Three checks below. |
| 2026-09-17 | **Monitoring and analytics** (Insights API overview) | Mostly already built. **One real gap found:** deleted and archived ads fell out of the per-ad spend sync. **Demographic budget shifts: don't, yet.** | **BUILT:** every ad status requested, plus an account-level spend check on every sync. Entry below. |
| 2026-09-16 | **Optimization Tips** (generic best practices). It was a source in the 2026-09-08 audit, but nothing was recorded about it then. | Generic advice. **Five of its tips would hurt at this account's volume**; the rest are already built. | Refined the one-ad-set rule (§9). **Both candidate builds were BUILT 2026-09-17** at the founder's request (learning status; too few tickets to judge). Per-tip table and build record below. |
| 2026-09-17 | **Ad Campaign Management** (modify, pause, archive, delete campaigns) | Every call in it is a WRITE; the token is `ads_read` by design and the founder chose notify-only (§5 Layer 7). Nothing to adopt. Deleting is already safe for our numbers (previous entry). | **One gap found, BUILT 2026-09-17** (founder: "build it, show it on the page, no alerts"): a delivery-settings history for campaigns, ad sets and ads. Record below. |
| 2026-09-17 | **Authentication** (access tokens: user, system user, OAuth code flow, storage) | Mostly already done, and done more strictly than the doc: system-user tokens only, two system users on purpose, and secrets kept outside the database. | **One real gap found, NOT built:** the reporting token (`META_ADS_ACCESS_TOKEN`) is never checked before it fails, and its expiry date is unknown. Candidate below. |
| 2026-09-18 | **Authorization** (access tiers, permissions, App Review, business verification) | Confirms §9: `ads_read` at standard access is enough for our own account, and business verification already passes. | **Corrected §9's stale call-volume arithmetic.** One decision surfaced for the founder, NOT urgent: we sit on the Limited tier, which Meta calls development-only. One constraint recorded: Limited allows 1 system user + 1 admin, and we already have two. |
| 2026-09-18 | **Get Started with the Marketing API** (prerequisites index) | Nothing to adopt: every prerequisite already done, and all five linked pages already audited. | **Nothing built.** Re-verified the one hidden dependency its "billing information and spending limits" line points at: the spend↔bookings join needs the ad account on IST, and `timezone_name` still reads `Asia/Kolkata`. Recorded it here because it existed only in a code comment. Account spending limits already surface via `blocked`. |
| 2026-09-18 | **Basic Ad Creation** (`campaigns` / `adsets` / `ads` POST endpoints) | Every endpoint is a write; `ads_read` and notify-only by decision. Nothing to adopt. **One dangerous idea in it:** `objective=LINK_CLICKS` reads like an escape from the learning-phase problem and would abandon the conversion signal this whole system feeds. | **Nothing built.** Recorded why click optimisation is the wrong lever (the real constraint is budget, not objective); established that the read enum **cannot** settle which objective name a new campaign accepts — it carries legacy names *and* omits `OUTCOME_TRAFFIC`/`OUTCOME_APP_PROMOTION`. Third doc running with a budget in minor units and a v25.0 pin. |
| 2026-09-18 | **Create an ad campaign / ad set / ad / ad creative** (the four expanded pages) | First three are the same examples as the row above — not re-audited. **The creative page is new** and names the one hard prerequisite never recorded here: every creative needs a `page_id`. | **Nothing built.** Found the Page (**"Join Chapter அ"**, `1201531216384934`) and recorded that the two empty reads are NOT evidence of a missing Page or missing Instagram. Recorded the founder's decision that **every ad lands on `/lifestyle`**, and verified in code that attribution, `fbp`/`fbc`, PageView and ViewContent all work on that landing — so the unpushed plan-link fix is not a blocker (it stays a prerequisite for catalog ads only). Connected `picture` to the missing plan photos. One founder check added to §24. |
| 2026-09-18 | **Ad creative** (the full reference: creatives, placements, previews) | Mostly writes again. **First read-only capability in the batch:** `/generatepreviews` renders a creative per placement, free, before any spend. And `object_story_id` offers a route around the missing plan photos. | **Nothing built.** Recorded the preview API as available-but-untestable (needs a creative; none exists) and its blind spot — **no Audience Network format**, so the placement most worth seeing cannot be previewed. Confirmed from Meta's side that the ad account holds **0 images and 0 videos**, so creative raw material is the real bottleneck. Recorded the promoted-post trap: no link ⇒ no `{{ad.id}}` ⇒ no join to spend at all. |

| 2026-09-18 | **Marketing API Rate Limiting** | **One real defect found in our code**, plus the concrete quota numbers we had been estimating. Meta reuses code `613` for five unrelated failures separated only by subcode, and the one with NO subcode is an abuse-prevention quota cut that must not be retried. | **BUILT** (founder: "do both the fixes"): `meta-ads-sync` no longer retries that 613, `meta_ads_sync_log` gained `error_subcode`, and the phone alert says the opposite of "it will retry". **Also BUILT:** `meta-ads-alerts` now requires a caller secret — it was the most plausible way this account ever generates the traffic that triggers the throttle. Record below. |
| 2026-09-18 | **Marketing API versioning** | Confirms our posture and supplies the best single piece of evidence for §9's "never trust a doc's version": **the versioning page itself says the current version is v25.0**, which already returns a deprecation warning here. | **Nothing built** — the `x-ad-api-version-warning` detector already live in `meta-ads-sync` is exactly the mechanism this doc describes, and it sits in the shared fetch helper so it covers every call. Recorded that auto-upgrade is CONDITIONAL, that it must not be switched off, and that our app's birth date floors how far back we could ever pin. |
| 2026-09-18 | **Marketing API overview** | Conceptual hierarchy, already in §2. **One real fact:** ad creatives are immutable once created. | **Nothing built.** Creative iteration is therefore structurally "a new ad", i.e. a significant edit that restarts learning — which hardens the batching rule in §9 item 2 from a preference into a constraint. Its component table also puts budget at ad-set level only, which is wrong for this account. |
| 2026-09-18 | **The Instagram Ads API guide set — 13 docs** (Get Started, Data and CTA Requirements, Media Requirements, Add Interactive Elements, Use URL Tags for Tracking, Instagram Advantage+ Catalog Ads, Use Posts as Instagram Ads, Get Ad Insights, Get Ad Preview, Add Call-To-Action, Ads With Mixed Placements, Set Up IG Accounts With Pages, Set Up IG Accounts On Business Manager) | Mostly writes again. **But one doc names the field the single irreversible-if-missed item actually lives in, and that field is READABLE.** | **BUILT** (founder: "go build the necessary systems"): the `{{ad.id}}` pre-flight check — `meta-ads-sync` v22 reads every ad's creative `url_tags` and pushes if the macro is absent or wrong, before any money moves. Record below. Also: closed §10's open question on the placement macro, corrected §23's claim that `/generatepreviews` could not be tested, found the media specs that the missing-photos bottleneck needs, and recorded that a promoted Instagram post CAN be fully tracked (§23 previously implied otherwise). |
| 2026-09-18 | **Reels Ads** | Mostly writes again, and one doc error bad enough to name. **But its placement matrix exposed a real hole:** we store what an ad set was *configured* with, never what is *effectively* running — which is precisely where §10's Audience Network `rewarded_video` leak lives. | **BUILT** (founder: "build the systems now"): effective placements captured with history, plus a check that separates "the founder chose this" from "Meta's default turned it on" and refuses to stay silent when placements are unknown — plus, on his say-so, a push when an ACTIVE ad set is found on Audience Network nobody chose. `meta-ads-sync` **v21**. Record below. |
| 2026-09-18 | **Lead Ads** (six pages: overview, forms, retrieving, CRM webhooks, testing, Advantage+ catalog lead gen) | **DECLINED by the founder the same day** — "I don't think we need lead ads as of now." A lead ad never sends anyone to the site, so it bypasses every layer in this document and needs a parallel measurement spine, an App Review and a wider token. | **Nothing built.** Checked live that the `page` topic DOES offer `leadgen` and that no App Review has ever been submitted. Recorded the ₹13.40 double-bind (clearing learning and breaking even land on the same price), and **one dormant defect: `untagged_spend` and `spend_without_lead` would false-alarm on every lead ad forever** — carve them out in the same change if this is ever adopted. |
| 2026-09-18 | **Threads Ads** (eight pages: overview, creation, carousel, Advantage+ catalog, app ads, promoting existing posts, reply moderation, insights) | Threads is a **placement, not a channel** — it cannot run without Instagram — and Meta states twice that it is throttling delivery there on purpose. Nothing to adopt. | **Nothing built.** Recorded that **Threads is ALREADY live on the paused ad set** via Advantage+ defaults, like `rewarded_video` but with the opposite verdict; that **reply moderation is impossible on the two mock-account routes** and needs `ads_management` we do not have; and that `publisher_platform`/`platform_position` are in **neither** breakdown-restriction list, so cost per ticket by placement is computable later (backfillable, so not built). Confirmed `SITE_SOURCE_NAME` is a real macro. Corrected the promoted-post trap recorded above. |
| 2026-09-19 | **Meta Pixel docs — the whole set (20 pages)**: overview, get started, conversion tracking, collaborative ads, Advantage+ catalog ads, Marketing API, movies, guides, multiple pixels, advanced, advanced matching, custom audiences, SPAs, GDPR/LDU/terms, support, Data Advisor, migrating, reference | The code already does almost everything the prose says, several things more carefully. **Two real findings, both from Meta's live per-Pixel settings file rather than the prose:** automatic advanced matching was never on, and Meta can silently drop or strip browser data with nothing watching. | **BUILT:** automatic setup off in `src/metaPixel.ts` (`5bcb721`, **not pushed**), proven in a sealed page first; **watchdog check 7 `pixel_config`, live** (`meta-signal-watchdog` v5, alerts on). Record below. |

### Ad optimization basics, 2026-09-16

- **The doc's examples use v25.0.** Every pin here is v26.0; v25.0 already
  returned a deprecation warning (§13 item 5). This is the §9 "docs lag the API"
  pattern again, so never copy a version from a doc example. The grep also found
  a sixth pin (`meta-signal-watchdog`), now recorded in §13 item 5.
- **`customaudiences`:** the doc's create example sends only `name` and
  `subtype=CUSTOM`. `meta-audience-sync` also sends
  `customer_file_source: 'USER_PROVIDED_ONLY'`, which Meta requires for
  customer-list audiences. Do not "simplify" to the doc's shape.
- **`insights`:** the doc's example has no `level` and no `time_increment`, so it
  returns ONE account-level total for the whole range. That cannot be joined to
  bookings. `meta-ads-sync` uses `level=ad&time_increment=1` with the full field
  list (§5 Layer 2), which is what makes true ROAS per ad possible.
- **Lookalikes** (the other thing this endpoint makes):
  - The seed `customers_completed` still holds **85** people on 2026-09-16,
    unchanged since 7 Sep. Meta needs at least 100 in the source.
  - Meta shows a customer list's matched size only as a 1,000 floor (§19), so
    read the gate from our own `member_count`, not from Meta.
  - `customers_all_paid` holds 107 and would clear the count, but it includes
    advance-payers who never came (18 at Founders Meet, §21.4). A club's
    lookalike should resemble people who show up. Keep the seed on people who
    came.

### Optimization Tips, 2026-09-16

A general best-practice list written for accounts with volume. Every tip is
sound in isolation, but several assume what this account does not have: about
50 conversions a week per ad set, and samples big enough to compare ads. The
verdicts:

| Tip | Verdict here | Why |
|---|---|---|
| Custom audiences from website visitors | Built | §19 registry plus 4 drafts. Meta places only ~1% of visitors, so these pools stay tiny until paid traffic brings click ids. |
| **Segment by age, gender, location, interests** | **Don't, yet** | Each segment becomes its own ad set needing its own ~50 results a week. Site-wide volume is ~10 purchases and ~139 AddToCarts a week (§5 Layer 9), so splitting guarantees *learning limited*. Meta's own help says to combine similar ad sets. With Advantage+ audience on, narrowing is only a suggestion anyway. Keep location (Chennai, home, 40 km) as the one hard filter. |
| Lookalike audiences | Not yet | Seed is 85 people who came, below Meta's 100 (§23, previous entry). |
| Set clear objectives | Built as analysis | Optimise on AddToCart/ViewContent, judge on true cost per ticket (§9, §10). The paused ad set still optimises for Purchase, graded `impossible`. |
| **Shift budget to the best-performing ads** | **Don't, on small numbers** | At this volume a "best" ad is usually 2 tickets against 1, which is noise. Meta also says a large budget change can send an ad set back into learning. Judge on true cost per ticket once each ad has enough paid tickets; until then, pool by concept (§21.7 item 5). |
| Daily budgets | Built, founder's call | The only auto-pause is one Ads Manager rule on raw daily spend (§5 Layer 7). Meta warns a very small budget gives delivery a poor signal; ₹95.76/day sits at Meta's floor (§10). |
| High-quality, mobile-first visuals | Partly open | Founders Meet has no photo; Pondy and Anna Nagar share one thumbnail (§20). `impression_device` is enabled (§5 Layer 10). |
| **Continuously A/B test creatives** | **Not as written** | Meta split tests cannot read anything below AddToCart here (§12), and every new ad restarts learning (verified below). Add creatives in batches. Test offers and page copy on the site-experiments engine instead (§17). |
| **Dynamic creatives** | **Avoid** | Meta retired dynamic creative for Sales objectives in June 2024 (flexible ad format instead), and reports results only as a total across combinations. Our true-ROAS join is per ad (`{{ad.id}}`), so several creatives mixed inside one ad hide which one sold. One concept per ad keeps each judgeable on cash. |
| Real-time Insights | Built, deliberately not real-time | Meta restates up to 28 days; the sync re-pulls a 28-day window every 6 h (§5 Layer 2). Acting on hour-level numbers means acting on figures that will still change. |
| **Adjust targeting mid-campaign** | **Don't** | Any targeting change restarts learning and sends ads back through review (§9). "Performing better" would be judged on Meta's conversion count, which reads high. Every edit is captured in `meta_adset_targeting_history` if it happens. |
| Reporting dashboards | Built | Growth ▸ Ads, with true ROAS net of fees (§21.3). |
| Conversions API | Built | EMQ 9.3; daily watchdog (§22). |

**Verified in Meta's help centre** (via the Ads MCP, 2026-09-16), not taken from the doc:
- *Significant edits and learning phase*
  (https://www.facebook.com/business/help/316478108955072). These always restart
  learning: any change to targeting, any change to ad creative, a change of
  optimisation event, **adding a new ad to the ad set**, pausing for 7 days or
  longer, and changing bid strategy. Budget, bid and spending-limit changes may
  or may not, depending on size.
- *About the learning phase*
  (https://www.facebook.com/business/help/112167992830700). Exit takes about 50
  results in the week after the last significant edit. Meta recommends avoiding
  high ad volumes, combining similar ad sets, and not editing while learning.
- *About dynamic creative*
  (https://www.facebook.com/business/help/170372403538781). Unavailable for new
  Sales ad sets since June 2024. Results are aggregate, and Meta says it is not a
  substitute for split testing.

**Both candidate builds from this doc: BUILT 2026-09-17** (founder: "build both
of them").

#### 1. Ad set learning status, with history

**Why.** `learning_stage_info` is current state only: Meta keeps no history of
it, so "when did learning restart, and what had we just changed" is lost unless
recorded as it happens. With that history, Growth ▸ Ads can say "don't edit yet".
That is the direct protection against the three harmful tips above.

**Field verified before building.** `ads_get_field_context` confirms
`learning_stage_info` at ad set level: status, conversions, last significant
edit time, exit reason, attribution windows.

**What was built:**
- **`meta-ads-sync`**, deployed **v16** `--no-verify-jwt`:
  - `learning_stage_info` is appended to `ADSET_FIELDS`.
  - The ad set fetch tries four field shapes in order: full; without learning;
    without campaign name; without both. An unknown field is a hard 400, so a
    refusal costs the least important part rather than the call.
    `learning_captured:false` means the field was refused this run, which is
    different from "Meta returned none".
  - Every ad set is passed to `record_adset_learning()` each run, including
    ones with no learning stage.
  - It pushes nothing, on purpose: the founder makes these edits himself, and
    `learning_limited` already pushes via the ads_volume step.
- **`record_adset_learning()`** (service role only):
  - Parses every key defensively and keeps the raw object.
  - `last_sig_edit_ts` is taken as unix seconds; milliseconds are tolerated.
  - A new history row is written only when (status, last significant edit)
    changes.
- **`get_meta_adset_health()`** gained `learning`, `learning_history` and
  `learning_capture_since`. All existing keys are kept.
- **Growth ▸ Ads "Learning phase" card** (working tree, NOT pushed), one row per
  ad set:
  - Learning: "N of ~50 results since the last big edit on X, don't edit".
  - Finished learning.
  - Learning limited, with what actually helps.
  - Not delivering.
  - Not read yet.
  - It also lists the big edits on record, and shows the `impossible`/`tight`
    optimisation-goal verdicts that otherwise reach no phone while an ad set is
    paused.

**Live first reading, 2026-09-16 20:43 UTC.** The paused, never-delivered ad set
"Chennai +40km · broad · Purchase" came back **with no `learning_stage_info` key
at all** (absent, not null). It is recorded as status NULL with `observed_at`
set: 1 history row, and `learning_capture_since` is now set. The same read graded
its Purchase goal `impossible` at **3.5 purchases a week** site-wide (it was 10.3
on 2026-09-09, before the traffic lull).

**Verified:**
- 10 steps in a rolled-back transaction, all as expected:
  - paused → true; again → false
  - learning starts → true; same state with reordered keys and string values → false
  - an edit restarts learning → true
  - finished → true; same state with a millisecond timestamp → false
  - learning limited with an exit reason → true
  - malformed values parse to NULLs → true
  - a NULL ad set id → false
- That gave 6 history rows with conversions tracked forward.
- With the founder gate closed, the result is NULL; existing keys are intact.
- The sync type-checks under strict `tsc` with a Deno shim, both the live and the
  new copy.
- Live run: `learning_captured:true`, `learning_changes:1`, `degraded:false`.
- `list_edge_functions`: `updated_at` moved, `verify_jwt:false`.
- The deployed bundle was downloaded afterwards and is identical to the repo.
  Another session was editing this same file that day.

#### 2. "Too few tickets to judge"

**Why.** The per-ad table showed cost per ticket and a green or red ROAS however
few tickets sat behind it. That invites the "shift budget to the winner" tip on
noise.

**What was built:**
- **`get_meta_ads_performance`** adds:
  - `judge_min_tickets` (10);
  - per ad and in totals, `enough_to_judge`;
  - a 95% likely range: `cost_per_ticket_low/high`, `true_roas_low/high`.
- **The range** comes from `poisson_ci95()` on paid tickets: spend is exact,
  and the ticket count is the uncertain part. It is rough on purpose, treating
  every ticket as worth the average.
- **Why 10:** at 10 tickets the real cost per ticket plausibly runs from about
  half to double the figure; at 4 it runs from a third to nearly triple. It is a
  floor for "worth comparing", not proof. The range is always shown.
- **Growth ▸ Ads** (working tree, NOT pushed):
  - a "too few tickets to judge (N of 10)" label under an ad's cost;
  - ROAS in **grey, not green or red**, when there are too few tickets, for
    each ad and the headline;
  - "likely X–Y×" shown inline, readable on a phone;
  - a one-paragraph note above the table.

**Verified:**
- `poisson_ci95` against exact bounds at n = 0, 1, 2, 3, 4, 5, 10, 12, 20, 50
  and 100: within 1% from n = 5 and 2.5% from n = 3. At n = 1 the lower bound is
  48% off, which is harmless because it is always "too few".
- Rolled-back fixtures:

  | Ad | Paid tickets | Cost per ticket (range) | True ROAS (range) | Label |
  |---|---|---|---|---|
  | A | 3 | ₹300 (₹103–1,493) | 1.00× (0.20–2.91) | too few |
  | B | 12 | ₹200 (₹114–388) | 1.50× (0.77–2.61) | enough |

  **Note B's range dips below break-even: "enough to judge" is not "proven
  profitable".**
- Fees still split correctly. The founder gate closed gives NULL; 0 rows left
  behind.

### Monitoring and analytics, 2026-09-17

**Already built, so nothing to do:**
- `/insights` per ad per day with spend, clicks, CTR, CPC and conversions (§5
  Layer 2).
- ROAS both ways, Meta's and true ROAS net of fees (§21.3).
- The doc's "high engagement, low conversions" case, as the two disjoint alarms
  `spend_without_ticket` / `spend_without_lead` (§5 Layer 7).
- The doc's example is on v25.0 again; never copy a version from a doc.

**Not taken: "reallocate budget to demographics with higher engagement."**
- Engagement is not tickets.
- Our cash cannot be split by age or gender: no booking form asks age, and only
  46 of 118 paid bookings carry a gender (2026-09-17). Any per-demographic
  "result" would rest on Meta's conversion count, which reads high here (§2).
- At 6–10 tickets a week, age × gender cells hold one or two, which is noise.
- It is the same trap as the "Segment by age, gender" tip in the previous entry.
- Meta keeps breakdowns for 37 months, so waiting loses nothing (§13 item 6).

**The real gap, BUILT 2026-09-17: deleted and archived ads.** The doc's
`filtering` parameter led to Meta's "Manage your ad object's status" reference,
which is explicit about three things:
- `/act_<ID>/insights?level=ad` does **not** return ARCHIVED or DELETED ads
  unless the query filters on `ad.effective_status`.
- A deleted ad "may still track impressions, clicks, and actions for 28 days
  after the date of last delivery".
- The account-level total includes every ad whatever its status.

The sync used `level=ad` with no filter. So an ad deleted between 6-hourly syncs
lost its last hours of spend and every conversion credited to it afterwards.
Deleting a campaign did the same to every ad under it. The upsert never deletes,
so synced days survived and the tail went missing. **Failing ads are the ones
that get deleted, so this understated cost exactly where the truth matters.**

**What was built:**
- **`meta-ads-sync` v15 asks for all 12 statuses.** The list is the full
  `effective_status` enum from Meta's Ad reference; leaving one out silently
  drops ads in that state. The query uses
  `filtering=[{field:'ad.effective_status',operator:'IN',value:[…]}]`. If Meta
  refuses the filter (error 100 on the first page), the sync steps down to the
  list without DELETED, then to no filter. Which form was used is logged as
  `meta_ads_sync_log.status_filter`.
- **Every sync also checks the total.** It reads Meta's account-level daily
  spend into `meta_account_daily`, and `meta_spend_reconciliation()` compares
  each completed day with the sum of per-ad rows:
  - Today is skipped, because it is still moving.
  - A day counts as a mismatch only past ₹1 and 1%, so paisa rounding is not
    flagged.
  - Both directions count.
- **A mismatch marks the run not ok** with `error_code = 'spend_unaccounted'`
  and a plain sentence, e.g. *"Meta billed ₹70 more than our per-ad numbers
  hold, across 1 day (2026-10-02: Meta ₹250, per-ad ₹180). Usually a deleted or
  archived ad…"*. That lights the Growth ▸ Ads banner. It sends one push when a
  healthy sync turns unhealthy, opening with "Ad spend missing from our
  numbers", not "sync failed". It clears on the first run where the totals
  agree.
- **Not being able to run the check is reported, never treated as a
  mismatch.** `spend_check` then holds `{ok:false, error}`, and the run stays
  ok.
- **Cost:** one extra read-only call per sync. The sync ran every 6 hours when
  this was built. Since 2026-09-17 it runs once a day at 08:50 IST (§8), so 1
  call a day.

**Why the account total and not just the filter.** The filter can only be
proven by deleting an ad that has spent, and this account has never spent. The
reconciliation doesn't trust the filter; it is the proof. The first time an ad
with spend is deleted, a clean run means the filter worked. A
`spend_unaccounted` run means it did not, and says how much is missing. It also
catches causes nobody has thought of yet.

**Verified:**
- **8 assertions** in a rolled-back transaction on a fake account: a healthy
  day; a deleted ad's missing ₹70; three ad rows summing 3 paise off (not
  flagged); ₹50 per-ad on a day Meta billed nothing (flagged the other way); a
  50-paise difference (under the floor); today excluded; an all-today window
  checking nothing; grants.
- **The mismatch sentence** rendered for one-day, two-day and reverse cases.
- **Live, twice (v14, then v15 with the push wording):** Meta **accepted the
  full filter including DELETED** (`status_filter: all_statuses`). The
  reconciliation checked 28 days, ₹0 billed, ₹0 per-ad, 0 mismatches, `ok:
  true`. The volume, ad-set and audience steps were all still ok.
- **Deploy checks:** before deploying, the local file was byte-identical to the
  deployed v13, so only this change shipped. Live v15 was read back and equals
  the local file, with `verify_jwt: false`.

**Not verified, and cannot be yet:** a real deleted ad's spend being recovered.
That needs an ad that has spent. See the paragraph above for how the first one
will prove it either way.

**Not pushed:** the Growth ▸ Ads banner wording for `spend_unaccounted` (§18).
**Not committed:** the migration file, `meta-ads-sync` and `AdminPanel.tsx`
edits.

**The version number above is already stale, and that is the point.** This
shipped as `meta-ads-sync` v15; later sessions took the same function to **v22**
the next day. **Never check whether this is still live by reading a version
number** — read the newest `meta_ads_sync_log` row instead. Verified that way on
2026-09-19: `status_filter = all_statuses`, `spend_check` covering 28 days with
0 mismatches, `ok = true`. Both halves survived every redeploy.

### Ad Campaign Management, 2026-09-17

**Nothing to adopt.** Every operation in this doc changes a live object:
modifying objective or budget, pausing, archiving, deleting. The stored token is
`ads_read` on purpose, and on 2026-09-08 the founder decided the system notifies
and never acts; the one auto-pause is an Ads Manager rule on raw daily spend
(§5 Layer 7). This doc is not a reason to reopen that.

**Checked against this account rather than taken from the doc:**
- **The budget in its example would be refused here.** `daily_budget=2000` is in
  minor units (§9), which on this INR account is **₹20 a day**. Meta's minimum
  for this account is about ₹94.91/day (§10). Never read a doc's money figure as
  rupees.
- **Its objective name is the older one.** It sets `objective=CONVERSIONS`; the
  live campaign is on the outcome-based `OUTCOME_SALES`. Both still appear in the
  Ads MCP's objective list, so "which name does a NEW campaign accept" is
  unverified.
- **Every change it shows can restart learning.** Changing the optimisation
  event and pausing for 7+ days always do; a large budget change may (Meta help
  316478108955072, §23 "Optimization Tips"). Its first example changes objective,
  budget and status in one call, which is the most disruptive edit there is.
- **Deleting is permanent**, confirmed in Meta's help "Delete an ad, ad set or
  campaign" (https://www.facebook.com/business/help/991073724257797). Deleted
  objects cannot be restored, only duplicated, and their reporting stays
  available for 37 months. **Our numbers already survive a deletion:**
  `meta-ads-sync` v15+ requests every `effective_status`, and the account-level
  spend reconciliation proves nothing went missing (previous entry).
- **`status` is not `effective_status`.** `status` is what someone set:
  ACTIVE/PAUSED/ARCHIVED/DELETED. `effective_status` is what is actually
  happening, one of 13 values including `CAMPAIGN_PAUSED`, `ADSET_PAUSED`,
  `DISAPPROVED`, `PENDING_REVIEW`, `WITH_ISSUES` and `PENDING_BILLING_INFO`
  (Ads MCP field context, 2026-09-17). Pausing a campaign changes every ad
  under it to `CAMPAIGN_PAUSED` without touching the ads' own `status`.

**The gap this doc exposed: a delivery-settings history. BUILT 2026-09-17**
(founder: "build it, show it on the page, no alerts").

**Why.** Before this, `meta-ads-sync` never read `/campaigns`,
`meta_adset_config` kept only the latest `effective_status`, and
`meta_ad_daily.effective_status` is always NULL. So three things were
unrecorded, and none can be backfilled:
1. The budget on a given day. On this account it lives on the CAMPAIGN.
2. When anything was switched off and back on. A pause of 7+ days restarts
   learning.
3. What is switched on but not running. It spends nothing, so no spend check
   sees it.

**What was built:**
- **`meta-ads-sync` v17**, deployed `--no-verify-jwt`, adds a fifth independent,
  non-fatal step, `syncDelivery`:
  - It reads `/campaigns` (`objective, status, effective_status, daily_budget,
    lifetime_budget, spend_cap, bid_strategy`), `/adsets` (the same, without
    objective or spend cap) and `/ads` (`campaign_id, adset_id, status,
    effective_status`).
  - Each read uses `filtering` on `effective_status` with the existing
    `STATUS_FILTERS` step-down.
  - It records via `record_delivery_states()`, one call per level (split at 500
    objects).
  - A partial read is still recorded but reported as `partial`: nothing treats
    an object's absence as a deletion, so a short read cannot invent a change.
  - **Nothing pushes.**
- **`record_delivery_states()`:**
  - Minor units become rupees, rounded to paise; a non-integer budget string
    becomes NULL.
  - Status codes are upper-cased, and an id-less object is skipped.
  - A history row is added only when a tracked setting changes, compared in SQL.
  - An unknown level raises.
- **`get_meta_delivery_status()`:** documented in §6.
  - **`blocked`** is deliberately narrow. The object and every existing parent
    must be switched on, yet not ACTIVE. An ad under a campaign you switched off
    on purpose is a choice, not a blockage.
  - **`new_object`** is a first sighting more than an hour after capture began.
    A newly created ad restarts learning, so it counts as a cause. The initial
    inventory does not.
- **Growth ▸ Ads, "What's switched on"** (working tree, NOT pushed):
  - Any "Switched on but not running" items, in red, with a plain reason (e.g.
    "stopped: the payment method needs attention in Ads Manager").
  - Each campaign with its ad sets nested: objective, budget ("budget set on the
    campaign" where it lives there), bidding, and Running / Off / On but not
    running.
  - The ad count.
  - The newest 8 changes in plain words ("daily budget ₹95.76 → ₹300",
    "switched back on after 10 days off", "new, switched on").
- **The "Learning phase" card** now shows, under each recorded restart, what
  changed in delivery within 12 hours. If nothing did, it says the cause was a
  targeting, creative or goal edit.
- The labels and change sentences live in module-level helpers in
  `AdminPanel.tsx` (`describeMetaDeliveryChange` and friends), shared by both
  cards.

**Live first reading, 2026-09-16 22:22 UTC:**
- Campaign "Founders Meet · Aug 30 · first test": PAUSED, `OUTCOME_SALES`,
  **₹95.76/day on the campaign**, `LOWEST_COST_WITHOUT_CAP`.
- Ad set "Chennai +40km · broad · Purchase": PAUSED, no budget of its own, no
  bid strategy.
- **0 ads** on the account.
- All three levels accepted the full status filter (`all_statuses`).
- A second run recorded **0 changes**.
- `blocked` is empty.

**Verified:**
- **Rolled-back fixture sequence, every count as expected:**
  - Initial capture of a campaign, an ad set and two ads (one billing-blocked).
  - The same campaign again with keys reordered, a numeric budget, lower-case
    codes and a rename: **0**.
  - Budget ₹95.76 → ₹300: 1.
  - Campaign switched off: 1. The billing-blocked ad following its parent: 1,
    and **not blocked while the campaign is off**.
  - Campaign back on after 10 days: `off_for_days` 10.0. The ad blocked again: 1.
  - An id-less object skipped; a garbage budget "12.5" stored as NULL.
  - An unknown level raised.
  - The founder gate closed gave NULL.
- **Learning link:** a learning restart at the switch-back-on time listed the
  campaign's "back on after 10 days off" as a nearby change. A second fixture
  confirmed an ad created 3 h after capture is `new_object` and appears as a
  restart cause, while the real campaign's initial capture does not.
- **Deploy checks:** the deployed bundle was re-downloaded right before
  deploying. It was unchanged since the last check, and the local file differed
  only by 127 added lines, so no one else's change was overwritten.
  `list_edge_functions` shows v17, `verify_jwt:false`.
- **Types:** sync function type-checked under strict `tsc` with a Deno shim;
  panel `npx tsc --noEmit` clean.
- **Sentences:** the change sentences were rendered by running the shared
  helper on 10 cases, including an unknown code ("something new") and an empty
  change list.
- **Clean-up:** 0 fixture rows left. Anon cannot read; only `service_role` can
  record.

### Authentication, 2026-09-17

**Already done, and stricter than the doc:**
- **System-user tokens only**, which the doc itself recommends for
  server-to-server work: they do not die with a password change or a person
  leaving.
- **Two system users, deliberately** (§3, §9). "Revoke tokens" in Business
  Settings is per system user and revokes all of that user's tokens, so a leak
  of one token is contained to its own job:
  - `chaptera-reporting` holds `META_ADS_ACCESS_TOKEN` (`ads_read`, the ad
    account, the domain, the app);
  - `Conversions API System User` holds `META_CAPI_ACCESS_TOKEN`.
- **Least scope** ("limit token scope"). The reporting token is `ads_read`; audience
  writes work through asset-level access, not `ads_management` (§12). The CAPI
  token's only named scope is `read_ads_dataset_quality`, with the Pixel in its
  granular scope (live `debug_token`, 2026-09-16).
- **User tokens were used once and never stored.** The only one was a throwaway
  `ads_management` token from Graph API Explorer, for the one-off
  `subscribed_apps` call (§5 Layer 3).
- **Secrets are NOT stored in the database, on purpose, against the doc's
  "store it in your database".** They live in Supabase function secrets,
  readable only by edge functions at run time. A database row would be readable
  by SQL, backups, the MCP and every service-role query. Claude cannot set or
  read them, and they are never pasted into chat (§4). Do not move them into a
  table.
- **The OAuth code flow** (`/oauth/access_token` with an app secret) is for
  managing OTHER people's ad accounts. It does not apply here, and building for
  it would contradict the brand rule against white-labelling (auto-memory
  `brand-vision-lifestyle-club`).
- **"Regularly refresh tokens" does not apply to never-expiring system-user
  tokens.** A scheduled rotation would add a founder task (only he can set
  secrets) to guard against a risk the monitoring already covers. Rotate on
  exposure: revoke the one system user's tokens and replace that secret.

**The doc's "regularly check validity", compared with what exists:**

| Token | Proactive check | Reactive check |
|---|---|---|
| `META_CAPI_ACCESS_TOKEN` (sales → Meta) | **Yes.** `meta-signal-watchdog` `capi_token` runs `debug_token` daily. Live 2026-09-16: valid, `SYSTEM_USER`, `expires_at` 0 (never), `data_access_expires_at` 0, Pixel in granular scope. Pushes `broken` immediately and `expiring` 7 days ahead. | Purchase/Lead parity checks (§22). |
| `META_ADS_ACCESS_TOKEN` (reporting) | **None.** Its expiry date has never been read. | `meta-ads-sync` pushes when a healthy run turns broken (code 190 etc.); watchdog event checks go `unreadable` and push after 6 h. |

**Why the second row matters more than it looks.** The reporting token is used
by five functions: `meta-ads-sync`, `meta-audience-sync`, `meta-ads-alerts`,
`meta-insights-features` and the watchdog's `/stats` reads. Some of what dies
with it can be recovered, some cannot:
- **Recoverable:** spend (insights keep 37 months, and the sync re-pulls 28
  days).
- **Not recoverable:** the learning-status history, the delivery-settings
  history and the daily audience snapshots are current-state reads. A day
  without them is missing forever.
- **Money leak:** a stale `customers_all_paid` exclusion means ads keep
  reaching people who already bought.

If this token was generated with a 60-day expiry around 2026-09-07, it dies
around 2026-11-06, and the only warning is the breakage.

**Candidate build, NOT built (awaiting the founder).** Mirror the `capi_token`
check for the reporting token: `debug_token` on `META_ADS_ACCESS_TOKEN` (valid,
type, `expires_at`, `data_access_expires_at`, `ads_read` present, ad account
`1580469137074269` in granular scope), as a row in `meta_signal_watch`, with the
same verdicts. Coordinate with the watchdog's owner session and diff the
deployed bundle first (§23 verification pattern). Whether `expiring` pushes, or
shows on the page only, is the founder's call. **No-code alternative right now:**
the founder pastes the token into Meta's Access Token Debugger himself (never
into chat) and reads "Expires".

**Smaller, related, NOT built: webhook secret mismatches are invisible.**
`meta-ads-webhook` answers 401 and only logs when the `X-Hub-Signature-256`
check fails. So if the App Secret is ever reset in the App Dashboard without
updating `META_APP_SECRET` in the same minute, every webhook is silently
refused. Candidate: count refusals in a table and show them in Growth ▸ Ads.
Rare, but the failure has no symptom until someone asks why no webhooks have
arrived.

### Authorization, 2026-09-18

**Confirms what §9 already settled.** Our app manages only our own ad account,
so standard access to `ads_read` is sufficient and no App Review is needed for
the permission. Business verification already passes. The doc repeats the naming
change an earlier session recorded: for the **Marketing API Access Tier**,
"Standard Access" is now **Limited**, "Advanced Access" is now **Full**, and the
Full bar dropped from 1,500 to **500 calls in 15 days** with an error rate under
15%.

**Two axes, same words, still the thing people get wrong** (§9): the *permission*
access level (standard vs advanced on `ads_read`) is settled and fine; the
*Marketing API Access Tier* (Limited vs Full) is separate, and we are on Limited.

**What this doc adds that was not recorded:**

- **A system-user cap.** Limited allows **1 system user plus 1 admin system
  user**; Full allows 10 plus 1. We already run two — `chaptera-reporting` and
  the auto-created `Conversions API System User` (§3) — so we are at the cap
  unless one occupies the admin slot. **Consequence: do not plan a third system
  user (say, a separate token per function) while on Limited.** Which of ours
  holds the admin slot is unverified.
- **Meta's own words about our tier.** Limited is *"heavily rate-limited per ad
  account. For development only. Not for production apps running for live
  advertisers."* Our live calls confirm the tier: the insights throttle header
  returns `access_tier: development_access` (§13 item 4).
- **The qualification counter is invisible to us.** Checked 2026-09-18 with
  `devtools_api_usage`: `total_calls: 0` over 30 days, `call_quota: 240`, usage
  0%, `overall_status: healthy`, no cooldown. Marketing API traffic is metered
  per AD ACCOUNT, not against the app's Graph quota, so our ~35–45 calls a day
  do not appear there. Only App Dashboard → App Review → Permissions and
  Features shows the tier and the requirement status.

**The decision this surfaces, for the founder, NOT urgent and NOT a nudge.**
Before ad spend becomes routine, decide whether to request Full access
(App Dashboard → Marketing API Access Tier → **+Upgrade**). The case for it is
Meta's own sentence about Limited not being for production advertisers, plus
headroom for the heavier syncs this account now runs. The case against is that
nothing is throttled today: usage reads 0%, the sync paces itself at 75% and
stops at 90%, and an upgrade is an App Review submission. **Nothing breaks if
this is left alone**, and the throttle guard reports it if that changes. Recorded
so it is a choice rather than a surprise on the first heavy-spend day.

**Also worth keeping in mind:** *"Calls on ANY access level are against
production data."* That is the same fact §15 records for test bookings reaching
the live Meta dataset. There is no sandbox anywhere in this system.

### Get Started with the Marketing API, 2026-09-18

**A prerequisites index. Nothing to adopt, nothing to build.** Every box it lists
is already ticked: an active ad account with a payment method
(`1580469137074269`, §3), a registered developer account, a created and
**published** app (`38444690021845940`, §3), and its two linked pages —
Authorization and Authentication — each already audited above. Its three "next
steps" are logged too: Ad Campaign Management (2026-09-17), Ad optimization
basics (2026-09-16), and campaign management's write calls, all declined for the
`ads_read` reason in §15.

**It is still worth the read-through, for one line.** Step 4 of "Finding your Ad
Account number" points at the Account overview — *"your billing information and
spending limits"* — which is the one part of this system that is account-level
rather than campaign-level, and where the handoff had recorded nothing.

**The dependency that hides there, re-verified 2026-09-18.** Meta's insights day
boundaries follow the **AD ACCOUNT's** timezone, and
`get_meta_ads_performance()` buckets our bookings with
`at time zone 'Asia/Kolkata'` before joining them straight onto
`meta_ad_daily.date_start`. So the entire spend-to-bookings join silently
depends on that account staying on IST. **It is:** `timezone_name` read live as
`Asia/Kolkata` on 2026-09-18, confirming the 2026-09-08 check.

**This was already found and handled** — `istToday()` in `meta-ads-sync` carries
the reasoning and the original verification, and says to re-check with
`GET /act_<id>?fields=timezone_name` if anyone reports odd day-level numbers.
**What was missing is that it was recorded ONLY in that code comment**, and this
document is what a cold session reads. Hence this entry. If the account is ever
moved to another timezone, every spend row lands against the wrong day's
bookings **and the join still looks perfectly healthy** — no row count changes,
no error, only slightly wrong daily numbers. Window totals would stay nearly
right, which is what makes it hard to notice.

**An account spending limit needs nothing built.** `effective_status` is
documented as accounting for "parent state, ad review, billing, and **budget
conditions**" (Ads MCP field context, 2026-09-18), so an account-level limit
being reached leaves objects switched on but not ACTIVE — which is exactly
`get_meta_delivery_status()`'s `blocked` list, already on the Growth ▸ Ads
"What's switched on" card (§23, Ad Campaign Management). Note the shape it takes:
an account-level stop hits EVERY object at once, so `blocked` would list all of
them with the same code, reading as "everything is broken" rather than "the
account hit its limit". Fine as a surface; worth knowing before reading it in a
hurry. There is no `ACCOUNT_PAUSED` in the enum — the 13 values are the ones
listed in §23, Ad Campaign Management.

**Not readable through the Ads MCP:** `account_status`, `balance`,
`funding_source`, `min_daily_budget`, `is_prepay_account` and an account-level
`spend_cap` all come back as `unknown_fields` (its `spend_cap` is campaign-level
only). Those stay a founder-side glance in Ads Manager, or a raw Graph call
nobody needs yet.

### Basic Ad Creation, 2026-09-18

**Every endpoint in it is a WRITE.** `POST /campaigns`, `POST /adsets`,
`POST /ads`. The token is `ads_read` on purpose and the founder's 2026-09-08
decision is notify-only (§5 Layer 7, §15). Same verdict as "Ad Campaign
Management": **nothing to adopt.** Recorded for the four things reading it
against this account turned up.

#### The trap: `objective=LINK_CLICKS` looks like the answer to the learning-phase problem. It is not.

This is the one genuinely dangerous idea in the doc, and it is dangerous
precisely because the arithmetic *appears* to work. §9 establishes that Meta
needs ~50 optimisation events per ad set per 7 days and this business produces
~10 purchases a week (3.5 in the recent lull). A reasonable person reads
`objective=LINK_CLICKS` — the doc's own headline example — and concludes that
link clicks are abundant, so optimising for them escapes the learning phase
entirely and buys cheaper traffic besides.

**Four reasons that is the wrong move here:**

1. **It optimises for the click, not for anything after it.** Meta's model would
   go looking for people who habitually tap links. That population overlaps
   badly with people who book a ₹299 social experience. `OFFSITE_CONVERSIONS` on
   AddToCart still uses the *conversion* machinery — Meta modelling people who
   take a real action on our site.
2. **A link click is not a funnel step; it is the entry to the funnel.** The
   whole design in §9 item 3 is *optimise on a high-volume proxy, judge on real
   cash*, and the proxy has to sit **on the path to a booking**. Our own funnel
   already shows `page_view` 411/week collapsing to `event_selected` 185/week
   (§5 Layer 9). Click optimisation maximises the one part of the funnel the
   business already has plenty of and which converts worst.
3. **It abandons the infrastructure this entire document exists to build.** EMQ
   9.3, browser/server 1:1, Advanced Matching, CAPI, the signal watchdog — all of
   it exists to give Meta's *conversion* optimisation clean signal. `LINK_CLICKS`
   uses none of it. That is paying for a pipe and then not using it.
4. **There is no learning-phase problem at the recommended events anyway.**
   AddToCart runs 139/week site-wide and ViewContent 185/week, both several times
   the bar (§5 Layer 9). The bar is only unreachable at Purchase and Lead. So it
   solves a problem that is already solved, at the cost of the signal quality.

**Where the honest difficulty actually is, and it is budget, not objective.**
A new ad set earns its own conversions rather than inheriting site-wide ones, so
what matters is how many events the *budget* buys. At §10's assumed costs and
the configured ₹95.76/day (~₹670/week): AddToCart ~27–45/week, i.e. **borderline
against the bar**, and ViewContent ~55–84/week, i.e. clears. So if reaching 50 a
week is the binding constraint, the levers are **ViewContent optimisation or a
larger budget** — both already identified in §10 — never a switch to click
optimisation. Stated once, as analysis; the objective is the founder's call and
the token cannot change it regardless.

#### The objective-name question is NOT settled by the read enum, and now it is clear why

§23 "Ad Campaign Management" left open which objective name a NEW campaign
accepts, noting both `CONVERSIONS` and `OUTCOME_SALES` appear in the Ads MCP's
list. This doc adds a *third* legacy name in its headline example
(`LINK_CLICKS`). Reading the enum (`ads_get_field_context`, 2026-09-18) shows
**it cannot settle the question, in both directions:**

- It carries the **legacy** set — `CONVERSIONS`, `LINK_CLICKS`,
  `BRAND_AWARENESS`, `REACH`, `PAGE_LIKES`, `VIDEO_VIEWS`, `MOBILE_APP_INSTALLS`,
  `CANVAS_APP_*` and more — necessarily, because old campaigns must still read
  back.
- It is **missing two current ODAX objectives**, `OUTCOME_TRAFFIC` and
  `OUTCOME_APP_PROMOTION`. Only four `OUTCOME_*` values are listed.

**So a read vocabulary is a superset of history and a subset of what is
creatable, and it is evidence for neither.** Only a create call settles it, and
creates are out of scope by decision. Leave the question open rather than
inferring an answer from this enum — the inference would be wrong in both
directions at once. This is the §9 "docs and API disagree" pattern showing up in
a *tool's* metadata rather than in a doc.

#### Third doc running whose money figure would be refused here

`daily_budget=1000` is **₹10/day** on this INR account (minor units, §9), below
Meta's ~₹94.91 minimum for it (§10). "Ad Campaign Management" had
`daily_budget=2000` = ₹20. Both would be rejected. Also the third doc in a row
pinned to **v25.0**, which already returned a deprecation warning here; our six
pins read v26.0 (§13 item 5). **Never read a doc's money figure as rupees, and
never copy a version from a doc example.**

Two smaller notes:

- **`targeting={"geo_locations":{"countries":["US"]}}`** would replace a
  deliberate decision with a default. The live ad set uses a 40 km radius around
  Chennai with `location_types: ["home"]`, which §10 records as a good choice
  worth keeping for a club that expects the same faces back.
- **The doc's own examples are internally inconsistent on status** — campaign and
  ad set are created `PAUSED`, the ad `ACTIVE`. Followed top to bottom that
  yields an ACTIVE ad under paused parents, which spends nothing and reads as
  `CAMPAIGN_PAUSED`/`ADSET_PAUSED`. That is **exactly the case the delivery
  fixtures cover** — "a parent switched off on purpose is not a blockage" (§23,
  Ad Campaign Management) — so this is confirmation that `blocked` was built
  right, not a gap.
- **The ad set example omits `optimization_goal`, `promoted_object` and
  `billing_event`** — the three fields that decide everything discussed above.
  §12 already records that the lever is `optimization_goal` + `promoted_object`
  rather than `tracking_specs`. An `OUTCOME_SALES` ad set additionally refuses to
  publish if Purchase is not configured on the domain (error `3260007`, §9). The
  doc's minimal shape is under-specified in precisely the field that matters most
  here.

---

### Create an ad creative, 2026-09-18

The founder supplied the four expanded pages of the previous entry: *Create an ad
campaign*, *Create an ad set*, *Create an ad*, *Create an ad creative*. **The
first three are the same examples already logged above** — same `LINK_CLICKS`,
same `daily_budget=1000`, same US country targeting, same `status=ACTIVE` ad
under a `PAUSED` parent. Nothing further to add, and deliberately not
re-audited. The **ad creative** page is new, and it is the one that names
things this document had never recorded.

`POST /act_<ID>/adcreatives` with an `object_story_spec` carrying `page_id` and a
`link_data` block: `message`, `link`, `caption`, `picture`, `call_to_action`.
Still a write, so still nothing to adopt. What matters is that **three of those
five fields are already constrained by decisions and defects recorded elsewhere
in this document**, and the constraints are invisible from the doc.

#### `page_id` — the prerequisite nobody had written down

Every creative needs a Facebook Page. Checked 2026-09-18:

| Read | Result | What it means |
|---|---|---|
| `ads_get_user_pages` | **"Join Chapter அ"**, `1201531216384934`, CREATE_ADS | A usable Page exists. This is the identity every ad will carry. |
| `ads_get_ad_account_pages` on `1580469137074269` | `[]` | No Page is *promoted under* the ad account yet — consistent with **0 ads ever created** (§23, Ad Campaign Management), NOT with a missing Page. |
| `ads_get_ig_accounts` | `[]` | **Unresolved, and it must stay unresolved.** The tool's own doc gives two causes: nothing linked, *or* the app lacks `instagram_basic`. Our token is `ads_read`. So this is evidence of nothing. |

**The Instagram row is the one worth a founder's look**, and it is not a
build. Organic traffic here is Instagram-first — §5 Layer 0 records real
`utm_source=ig` with `link_in_bio` and an `l.instagram.com` referrer. If the
Instagram account is not attached to the ad account and that Page, Instagram
placements run with a fallback identity instead of the real handle, which for a
curated club (auto-memory `brand-vision-lifestyle-club`) is a brand cost paid on
every impression. One look in Business Settings settles it. Added to §24.

**Do not restate the two empty lists as "no Page" or "no Instagram".** That is
the §9 null-versus-zero discipline in a new place: `ads_get_ad_account_pages`
returning `[]` and a Page genuinely not existing are the same output from
opposite situations, and only the third read told them apart.

#### `link` — the destination is `/lifestyle`, and that is the founder's decision

**Founder-stated 2026-09-18: every ad lands on `/lifestyle`.** Not a per-plan
link. Recorded so nobody re-proposes plan-level destinations, and so the
paragraph this entry originally carried — which assumed a direct plan link —
does not mislead a later session.

**Everything that destination needs is already live on production.** Verified in
the code, not assumed:

| On a `/lifestyle` landing | Where |
|---|---|
| `utm_content={{ad.id}}` captured into the session | `captureAttribution()`, `App.tsx:5522` |
| `fbp` / `fbc` captured, with a poll for late cookie writes | `captureMetaIds()`, `App.tsx:5530`/`5536` |
| PageView fires | `trackEvent('page_view')`, `App.tsx:5556` (skipped for admin/creator/team routes) |
| ViewContent fires **one step later**, when a plan is tapped | `event_selected`, `AppFlow.tsx:867` and `:1638` |

So the optimisation signal is intact: an ad to `/lifestyle` produces a PageView
on arrival and a ViewContent as soon as the visitor opens any plan. **The
unpushed direct-plan-link fix (§20) is NOT a blocker for this ad plan** — it only
ever mattered for `/?preview_event=<slug>` landings.

**The number that follows from it.** Because ViewContent arrives a step after the
landing, a `/lifestyle` ad needs roughly twice as many landing sessions as the
ViewContents it wants. Organic traffic runs `page_view` **411/week** to
`event_selected` **185/week** (§5 Layer 9, four-week average, distinct
sessions) — about **45% of visitors who land go on to open a plan**. So clearing
Meta's ~50-a-week bar on ViewContent needs on the order of **110+ landing
sessions a week** from the ad set. Treat 45% as a ceiling rather than a forecast:
organic arrivals come mostly from an Instagram bio link and are already warm,
where ad traffic is colder.

**Where the §20 finding still applies, so it is not lost.** Advantage+ catalog
ads render one plan and link to that plan by construction — there is no
`/lifestyle` option. So if catalog ads are ever switched on (§20, awaiting the
founder), the direct-plan-link fix becomes a prerequisite again rather than a
nicety. Scoped, not deleted.

#### `picture` — there is nothing good to point it at for one plan

§20's catalog readiness measured it: **no live plan has a `hero_image`**,
Founders Meet has no media at all, and Pondy and Anna Nagar share one video
thumbnail. The doc's `picture` takes a remote URL, which Meta re-hosts; the
sturdier field for repeat use is an `image_hash` from the account's own image
library. Either way the binding constraint is not the API, it is that the photos
do not exist. Already an open founder item in §18.

#### One opinion, stated once: `SHOP_NOW` is the wrong call to action here

The doc's example uses it. It is an e-commerce frame for a ₹299 seat at a curated
social experience, and it competes with the positioning the whole brand rests on.
`BOOK_NOW`, `LEARN_MORE` or `SIGN_UP` all fit a club better. Not a system
concern, not worth a build, and entirely the founder's call — noted because a
default copied from a doc example is a brand decision made by accident, which is
the same failure shape as the relaxed brand-safety tier in §10.

**Fourth doc running pinned to v25.0.** Our six pins read v26.0 (§13 item 5). At
this point treat every money figure and every version in Meta's example pages as
wrong until checked against this account.

### Ad creative (the full reference), 2026-09-18

The longer version of the creative page. Most of it is writes again and changes
nothing (§15). **But it is the first doc in this batch containing something we
can actually use, and it names an option for the missing-photos problem that was
not on the table before.**

#### `/generatepreviews` — the first READ-only capability in five docs

A `GET` that renders a creative as it will appear, **per placement**, returning
an iframe valid 24 hours. No spend, no live ad, nothing published. The Ads MCP
wraps it as `ads_get_ad_preview`.

**Why it is worth more here than it looks.** §10 records two things about the
live ad set that are defaults nobody chose: Audience Network `rewarded_video` is
switched on, and brand safety sits on the relaxed tier. Both are abstract
warnings in a table. A preview turns them into something the founder can look at
before any money moves — which is the only form of that argument a no-code
founder can actually check for himself.

**Could NOT be tested, 2026-09-18.** The tool takes an `ad_id` or a
`creative_id`, and this account has neither (0 ads, and no creative has ever been
made). Recorded as available-and-unexercised rather than working.

**The sharp limitation, worth knowing before relying on it.** The MCP's
`ad_format` list is `DESKTOP_FEED_STANDARD`, `MOBILE_FEED_STANDARD`,
`INSTAGRAM_STANDARD`, `INSTAGRAM_STORY`, `INSTAGRAM_REELS`,
`RIGHT_COLUMN_STANDARD`, `MESSENGER_MOBILE_INBOX_MEDIA`, `THREADS_STREAM`.
**There is no Audience Network format in it.** So the placement most worth
seeing — the rewarded-video inventory §10 flags — is precisely the one this
preview cannot show. Use the preview for Feed, Stories and Reels; settle the
Audience Network question by turning the placement off, not by looking at it.

#### `object_story_id` — a way around the missing photos, with a trap attached

The doc's main example promotes **an existing Page post** rather than building a
creative from new assets. That is a genuine option nobody here had considered,
and it addresses a real blocker: §20 found no plan has a `hero_image`, Founders
Meet has no media at all, and two plans share one thumbnail.

**Confirmed from Meta's side too, 2026-09-18** — the ad account's own asset
library is empty: `ads_get_ad_images` `[]` and `ads_get_ad_videos` `[]`. Unlike
the Pages case above, this token reads every other edge on this account fine and
these are account-scoped, so empty here is most likely genuinely empty rather
than hidden. Two independent reads, our database and Meta's, agree that **there
is no creative raw material anywhere yet.** That, not the API, is what stands
between this account and its first ad.

Promoting an existing post also carries organic proof — the likes and comments a
post already has travel with it, which a fresh creative starts without. For a
club selling on trust, that is not a small thing.

**The trap, and it is severe enough to decide up front.** A promoted post is only
useful here **if it carries a link to `/lifestyle` with the URL parameters on
it**. A post with no link drives profile visits or post engagement, so:

- no site landing, therefore no `page_view` and no `event_selected`
- no `utm_content={{ad.id}}`, therefore **no join to spend at all** (§6)
- nothing in `flow_analytics`, nothing for the funnel, nothing for true ROAS

Every measurement system in this document would read that ad as having produced
exactly nothing, and would be right. Note also that the doc frames page post ads
under the **Page Post Engagement** objective, which optimises for engagement
rather than site visits — the wrong goal for a business that sells tickets on a
website. So: promoting an existing post is viable, and the asset question and the
link question have to be answered **together**, never separately.

#### Smaller notes

- **The doc recommends the default that §10 flags as a problem**, in as many
  words: *"Run ads across the full range of available placements… To use this
  optimization, leave this field blank."* That blank field is exactly how
  `rewarded_video` came to be live. §12 predicted this tension in the abstract;
  here is Meta's doc stating it outright.
- **Its placement vocabulary is internally inconsistent**: the prose talks about
  `page_type`, `desktopfeed` and `rightcolumn` while its own curl example uses
  `publisher_platforms`. Legacy and current in one page — the §9 pattern again.
- **"each field you want to retrieve needs to be asked for explicitly"** confirms
  existing practice rather than changing it: an unknown field is a hard 400, not
  an omission, which is why the sync uses try-then-fallback field shapes (§5
  Layer 8).
- **Fifth doc running** with money in minor units (`daily_budget=10000` = ₹100,
  `bid_amount=1000` = ₹10) and a v25.0 pin. Both are standing rules now (§9, §15);
  not restated again.

### Rate limiting, versioning and overview, 2026-09-18

Three docs read together. The rate-limiting one is the first in this whole
batch to find a **defect in our own code** rather than confirm a decision.

#### The quota numbers we had been estimating, now exact

| Limit | Limited tier (us) | Full tier |
|---|---|---|
| Burst score, per ad account | **60**, decaying over 300 s; read = 1 point, write = 3; 300 s block on hitting it | 9,000, 60 s block |
| `ads_insights` per hour | **600 + 400 × active ads** − 0.001 × user errors | 190,000 + the same terms |
| `ads_management` per hour | **300 + 40 × active ads** | 100,000 + the same |
| `custom_audience` per hour | 5,000 + 40 × active audiences | 190,000+, capped at 700,000 |

Two things follow that were not known before.

**The Dev-tier ceiling RISES as the account grows.** §23 "Authorization" left
"request Full access?" as an open founder decision, partly on the strength of
a flat "~600 insights calls an hour" — which is the figure at **zero** ads. Ten
active ads makes it 4,600. The tier gets roomier exactly as it gets used, so
the case for upgrading is weaker than it looked, not stronger. Nothing is
throttled today (usage reads 0%, and the sync paces at 75% and stops at 90%).

**The burst score is the one to watch at scale, and only at scale.** A run
makes about 8 calls today, ~8 of 60. At the 40-page insights cap it would be
~47 of 60 — still inside, but that is the number that binds first on a large
future account, and it is a different limit from the one the sync paces on.

Also confirmed rather than inferred: **Marketing API calls are excluded from
Graph API rate limiting entirely.** That is why `devtools_api_usage` read
`total_calls: 0` (§23, "Authorization") — a correct reading of the wrong
meter, not a broken check. The 500-calls-in-15-days upgrade counter still has
no API surface; App Dashboard remains the only place it is visible.

#### THE DEFECT: one error code, five meanings, and we retried the wrong one

Code `613` carries five documented situations, told apart only by subcode:
`1487742` an ordinary ad-account throttle; `5044001`, `1487632` and `1487225`
write-only caps we can never hit on an `ads_read` token; and **613 with NO
subcode**, which is Meta saying it detected "a large amount of abnormal
traffic" from this ad account and has **temporarily reduced our quota** until a
human investigates and contacts support.

`classify()` in `meta-ads-sync` had all of `613` in `RETRYABLE_CODES`. So that
error was retried four times and then filed as a passing rate limit.

**The retries are the smaller half of the harm. The misdiagnosis is the real
one.** The run would report a transient throttle that "self-heals next run",
the banner and the phone alert would both say so, and it would repeat every
day while the actual remedy was a conversation with Meta. A wrong answer that
sounds calm is worse than a failure that sounds like one — the same failure
shape as §9's "null and zero are different answers", with **absence itself as
the diagnosis**.

**What was built** (migration `meta_ads_sync_log_error_subcode`, applied;
`meta-ads-sync` **v18**, deployed `--no-verify-jwt`):

- `isAbuseRateLimit()` + a branch in `classify()` placed **before** both the
  `is_transient` and `RETRYABLE_CODES` checks, either of which would otherwise
  swallow it. Subcode `0` counts as absent; a *present* unknown 613 subcode
  still retries, so today's behaviour is unchanged everywhere else.
- `meta_ads_sync_log.error_subcode` (bigint). The subcode was already parsed
  into `errorSummary()` and then dropped on write, so the only durable record
  of a failure could not tell the two 613s apart afterwards. §6.
- Its own push wording. Every other failure keeps the existing sentence; this
  one says the quota was cut, that waiting will not clear it, and that
  retrying makes it worse.

**Verified — and the method is the reusable part.** The test did not re-state
the classifier's logic; it `sed`-ed the four real declarations out of the source
file by line number and ran *those*. A hand-copied rule under test proves only
that the copy is self-consistent, which is exactly the assurance you do not
want on a branch that decides whether to retry. Extract it, or test it in
place.

The four real declarations were extracted verbatim from the
deployed file and run against 12 cases: the ordinary 613 still retries, all
three absent-subcode spellings go permanent, **613 with `is_transient: true`
goes permanent** (which is what proves the ordering), a present unknown subcode
still retries, and 190 / 4 / 17 / 80004 / code-1-subcode-99 are all unchanged.
12 of 12. Then a live unauthenticated call returned **HTTP 200** with every
step ok — spend check, volume, ad sets (`learning_captured: true`), audiences —
which also re-proves `verify_jwt: false`. The column was added against **57
runs, 0 of them failed**, so no history was lost by adding it late.

#### `meta-ads-alerts` now requires a caller secret

§13 listed this as open and deferred it with "decide it when writing the cron,
not before". The cron has been job 15 since 2026-09-08, so that reason had
expired — and this doc is what makes it worth doing rather than tidy.

The function is `--no-verify-jwt` because pg_cron calls it with no JWT, so
anyone with the URL could invoke it. It cannot forge data and it is idempotent.
**But idempotence protects the DATA, not the QUOTA** — every call makes real
Graph calls on `META_ADS_ACCESS_TOKEN`, and an open endpoint that spends Graph
quota is the most plausible route this account has to the abuse throttle above.
The two findings are one finding.

- **The secret lives in `app_secrets`**, not in a function secret, because the
  caller is Postgres and Postgres cannot read function secrets. This is the
  same exception `notify_admin_push()` has always relied on for
  `X-Admin-Push-Secret`. §23 "Authentication" says keep secrets out of the
  database and that rule still stands for anything that talks to Meta, PayU or
  WhatsApp; this value is not a credential to anything, it only proves a call
  came from our own cron.
- **Both sides read the same row**, so rotation is one `UPDATE` with no deploy
  and no window where cron and function disagree. The statement is in the
  migration.
- **Fails closed.** A missing or unreadable secret returns 503 rather than
  proceeding, because a run that cannot tell who called it should not go on to
  spend quota — and the function can do no useful work without the database
  anyway.
- **The order of the two halves is the safety-critical part, and it is the
  reverse of the usual.** The migration ships FIRST, so the cron starts sending
  a header the live function still ignores; the gated function ships second.
  Deploying the function first would have locked the cron out of its own
  endpoint for **up to a day**, because these jobs are daily (§8) and a 401
  does not retry.
- `cron.alter_job`, not `cron.schedule` — the daily schedule is the founder's
  2026-09-17 decision and must not be silently rewritten by a change about
  auth. `timeout_milliseconds := 60000` preserved.

**Verified live, in this order:** cron command rewritten (schedule still
`37 3 * * *`, timeout kept, secret 64 chars) → function deployed **v6** → no
header **401**, wrong secret **401**, empty secret **401**, `OPTIONS` **204**
→ then the cron's own `net.http_post` run verbatim, which returned **200
`{"ok":true,...}` with both halves reporting** (webhook drain and guardrail
evaluator). The 401s return our own JSON body, which is itself the proof that
`verify_jwt` is still `false` and the platform is letting the request reach our
code.

The old cron migration's "no auth header, same as every other cron here"
paragraph was **not deleted but marked superseded**, because its reasoning —
idempotence makes a double run harmless — is the thing that turned out to be
incomplete, and removing it would hide why.

#### Versioning: the doc that is wrong about versions

**It states the current version is v25.0.** Our six pins read v26.0, and a live
v25.0 call already returns *"auto-upgraded to v26.0 as v25.0 will be
deprecated"*. Five docs in this batch have carried v25.0 examples; this is the
one whose whole subject is versions. Treat §9's rule as settled.

- **Auto-upgrade is conditional, not a safety net.** A call to a dead version
  is upgraded only if that endpoint is **not** listed as changed in the next
  version's changelog; if it is, the call fails outright. Our
  `x-ad-api-version-warning` detector is already live and lives in the shared
  fetch helper, so it covers every call `meta-ads-sync` makes — and the comment
  at that line already describes this exact failure. Nothing to build.
- **Do not switch auto-upgrade off.** It can be disabled under Marketing API
  App Product Page → Settings. Leaving it on converts a hard outage into a
  warning header we already read. Founder-side "don't touch".
- **The app's birth date floors how far back we can pin.** An app may only call
  versions that were current while it existed; ours was created 2026-09-07.
- Unversioned Marketing API calls are invalid and fail — already true of every
  call site, which interpolates `${API_VERSION}`.

#### Overview: creatives are immutable

*"Ad creatives contain only the visual elements of the ad, and you can't change
them once they're created."* So "tweak the caption and see if it does better"
is not an edit — it is a new creative, a new ad, and therefore a **significant
edit that restarts learning** (§23, "Optimization Tips"). That turns the
launch-creatives-in-batches rule from a preference into a mechanical
constraint.

Its component table also puts Budget and Bidding at **ad-set level only**. On
this account the ₹95.76 sits on the **campaign**, which is why the ad set
stores `daily_budget: null` — someone reading this table would conclude no
budget was set. §5 Layer 9 already warns about exactly that.

#### Two observations recorded, not acted on

- **The sync's lookback is 28 days, not the 14 that §5 Layer 2 still says.**
  Read straight off the live run: `since 2026-08-21, until 2026-09-18`. Layer 2
  is the stale copy; §23 "Optimization Tips" already said 28.
- **`app_secrets` was defended by one mechanism where it should have two —
  FIXED 2026-09-18** (founder: "do the revoke too"). RLS was enabled with
  **zero policies**, which denies `anon` and `authenticated` everything, but
  both still held full table grants (`relacl` read `anon=arwdDxtm`,
  `authenticated=arwdDxtm`, almost certainly Supabase's default
  `GRANT ALL ... TO anon, authenticated` on the public schema). RLS was
  therefore the ONLY thing between a browser session and every secret in the
  table, and the day anyone added a policy for an unrelated reason those grants
  would wake up and the policy would become the whole gate. Same
  one-mechanism-vs-two point §6 makes about `meta_audience_membership`, with
  the opposite half missing.

  `20260918_app_secrets_revoke_client_grants.sql` revokes both. `postgres`
  (owner) and `service_role` keep theirs — they are the only identities that
  actually read it.

  **Checked before revoking, not assumed:** every reader reaches the table
  another way. Eleven SECURITY DEFINER functions (`notify_admin_push`,
  `purge_phone_data`, the four `log_whatsapp_*`, the four email-send ones,
  `log_feature_release`), all owned by `postgres`, which also owns the table,
  so they execute as the owner and their EXECUTE grants are untouched; the
  `brevo-webhook` and `meta-ads-alerts` edge functions, both reading with the
  service-role key; and cron job 15. `src/` never touches it — the only mention
  is a comment. And the decisive argument: RLS with no policies already denied
  both roles every row, so nothing that worked could have been using these
  grants. **Verified after:** `anon` SELECT, `authenticated` SELECT and `anon`
  INSERT all now raise *permission denied* (a harder, earlier failure than the
  silent empty result RLS gave), `service_role` still reads, all five secrets
  intact and unaltered, and the live cron → `meta-ads-alerts` call still
  returned **200 `ok:true`** — which exercises both surviving readers, postgres
  for the header and service_role for the gate.

  The table now carries this reasoning in its own `obj_description`, so it is
  visible to anyone reading the schema without this file.

### Lead Ads — the whole surface, 2026-09-18. DECLINED by the founder

Six pages supplied together: *Lead Ads*, *Lead Forms for Ads*, *Retrieving
Leads*, *Meta Webhooks for Lead Ads for CRM*, *Testing and Troubleshooting*,
and *Advantage+ Catalog Ads for Lead Generation*.

**The founder's decision, same day: "I don't think we need lead ads as of
now."** Nothing was built and nothing on Meta was touched. This entry exists so
the six docs are not re-audited, and because reading them found **one dormant
defect in a live system** that becomes real the day a lead ad ever runs.

**What a lead ad is, in one line:** an instant form that opens inside Facebook
or Instagram. The person never reaches chaptera.in — the creative's `link` is
forced to `https://fb.me/`. That single fact drives everything below.

#### Checked live, not taken from the doc

| Check | Result |
|---|---|
| `devtools_webhook_list list_topics` | The **`page`** topic IS available to app `38444690021845940`, carrying **`leadgen`** and **`leadgen_update`**. Unlike `ad_account.subscriptions` (§12), there is no delivery blocker. |
| `devtools_app_review privileges` | `privileges: []`, `rejections: []`. Nothing ever submitted. `leads_retrieval` would be this app's **first ever App Review**. |

#### The arithmetic, which is the real answer

At the configured ₹95.76/day (~₹670/week):
- **To leave the learning phase**, ~50 results in 7 days ⇒ a lead must cost
  **≤ ₹13.40**.
- **To pay for itself on Anna Nagar** (₹100 ad money per ticket, §21.7), at
  ₹13.40/lead you need **1 paid ticket per 7.5 leads — a 13% lead→ticket rate.**

Those land on the same price by coincidence, and the coincidence IS the finding:
**at this budget there is no gap between "clears learning" and "barely breaks
even".** 13% is demanding for a one-tap pre-filled form from someone who never
saw the site. Our own site leads convert far better (§5 Layer 9: 17.5 Leads/week
against 10.3 purchases/week) but those people browsed, read the itinerary and
reached the price step first — not the same person.

**This is the third doc in a row whose apparent escape hatch is really a budget
question** (after `LINK_CLICKS` and demographic segmentation, both §23). The
binding constraint on this account is money per week, not funnel friction.

#### The dormant defect: two guardrail rules would false-alarm forever

Recorded because it needs no code from us to happen — one campaign built in Ads
Manager is enough.

| Rule | What would happen |
|---|---|
| `untagged_spend` | Fires on **every** lead ad, forever. It counts spend with zero tagged funnel sessions, and a lead ad produces zero site sessions **by design**. Silent today only because `capture_live_since` is NULL — **it arms the moment `src/attribution.ts` ships.** |
| `spend_without_lead` | Fires at ₹500 spend, reporting "a traffic problem — they never came". They were never meant to come. |

This is the exact shape of the bug the 2026-09-08 wiring test caught. §5 Layer 7
states the principle: *no tagged traffic is only evidence about the ads once
something, somewhere, has ever been tagged.* A lead ad is a permanent exception
to that. **If lead ads are ever adopted, carve both rules out in the same
change** — an alarm that is always on is how the one that matters gets swiped
away. Not built now, deliberately: a carve-out for a channel we do not run is a
half-built system, which is what §16 exists to clean up.

Unverified, flagged rather than asserted: whether `ctr_below` also misreads,
since an instant form opening may not count as an outbound link click.

#### The one genuinely attractive property, recorded so it is not forgotten

**`{{ad.id}}` — the only irreversible-if-missed item in this whole system
(§10) — does not exist for lead ads.** There is no destination URL and no URL
macro. The `ad_id` arrives inside the lead object itself, from Meta, on both the
webhook and the bulk read. Since phone is this system's person key everywhere
(`applications`, `meta_audience_members`), lead → paid ticket → `meta_ad_daily`
is a clean backward join that **cannot be forgotten at ad-creation time**. If the
channel is ever revisited, this is the argument in its favour.

The counterweight: Meta pre-fills the phone from the Facebook profile. Our
unique key is last-10-digits and our entire comms stack is WhatsApp, so a stale
or mis-formatted FB phone is a lead we can neither reach nor match.

#### What adopting it would actually cost, against current posture

| Requirement | Conflict |
|---|---|
| App Review for `leads_retrieval` + `pages_manage_ads` | Ends §9's "App Review turned out NOT to be needed". Business verification already passes, so it is a submission and a wait, not a wall. |
| A **Page** access token | §23 "Authentication" is system-user-tokens-only, deliberately. A system user can hold one — but §23 "Authorization" records that **Limited tier allows 1 system user + 1 admin, and we already run two.** So no third dedicated user; it would mean widening `chaptera-reporting` past `ads_read`, which §12 says not to do without a reason. |
| Subscribing the `page` topic | §12's standing rule: it delivers other people's personal data, the published privacy policy does not cover it, and it is switched on **only alongside the consumer and a policy update in the same change**. Non-optional here. |
| A parallel measurement spine | webhook → fetch lead → store with `ad_id` → match phone at payment → join to spend. Buildable and clean, but a second attribution path beside the one that exists. |

#### Smaller facts worth keeping

- **The whole pipeline is provable with ZERO ad spend.** The app is published, so
  the lead-ads testing tool works (it is blocked only in development mode), and
  `POST /{FORM_ID}/test_leads` produces a real signed webhook delivery with fake
  data. One test lead per form; delete to re-create. It needs a form to exist
  first, which is a write to the Page.
- **Meta tells on itself about lead quality.** `is_optimized_for_quality` (adds a
  review-and-confirm step), `block_display_for_non_targeted_viewer` (filters
  organic leads, which otherwise arrive with no `ad_id` and pollute the join),
  `QUALITY_LEAD` optimisation, and the CAPI conversion-leads integration are four
  separate mechanisms for fixing the same problem. Here a junk lead is not a
  wasted impression, it is a marketer's phone call — and §21.8 established
  marketers are unpaid on open events.
- **The CAPI conversion-leads integration is the piece that would fit best** —
  send back which leads became paying customers so Meta optimises for quality
  rather than volume. Same shape as `capi-lead`. It is the second thing to build
  if this is ever adopted, not an afterthought.
- **`tracking_parameters` is per-FORM and static**, so it cannot carry
  `{{ad.id}}`. Its use is tagging which plan or offer a form serves. The ad id
  comes free anyway.
- **The lead-read rate limit reads as ZERO on day one:** 200 × 24 × leads created
  in the past 90 days. With no lead history that is literally 0. Either there is
  an undocumented floor or the first lead is unreadable — **unverified**; do not
  design a bulk-read-heavy integration on that formula without testing it.
- **Advantage+ catalog lead ads** would arrive already tagged with
  `retailer_item_id`, which maps straight to our `slug` (§20 confirmed
  `content_ids = [slug]` and the feed is keyed on it). Structurally neat, but it
  stacks two unbuilt things: there is still no catalog on Meta.
- **Side finding, unrelated to lead ads:** the **`catalog`** webhook topic is
  available to our app with `items_batch` and `product_feed`. That is a free
  health signal for the `meta-catalog-feed` already live (§20) — Meta would tell
  us when a feed import fails. Not built, not urgent, recorded as available.

### Reels Ads, 2026-09-18

Supplied by the founder. Nine steps from access token to insights, most of them
writes we do not make (§15). Four things in it were worth the read, and one of
them exposed a hole big enough to build against the same day.

#### What it confirms, so nobody re-derives it

- **Reels placements accept what this account should optimise for.** The
  placement matrix lists `OUTCOME_SALES` + `OFFSITE_CONVERSIONS` as a valid
  combination on both `instagram.reels`/`profile_reels` and
  `facebook.facebook_reels`. It does **not** constrain `custom_event_type`, so
  §9's recommendation — optimise on AddToCart or ViewContent, judge on real cash
  — stays fully available on Reels. **Choosing Reels does not force this account
  off conversion optimisation**, which was the thing worth checking.
- **`breakdowns=publisher_platform,platform_position`.** Neither field appears in
  Meta's Type 1 or Type 2 breakdown-restriction lists (§13 item 6), so off-Meta
  conversions should survive a placement breakdown. **Unverified** — the doc's
  own example requests only impressions, clicks and spend, no action metrics, so
  it proves nothing. Free to settle on the first ad that runs. Note what it
  would and would not give: Meta's breakdown says where the IMPRESSIONS went,
  never which placement produced a paid ticket. The half that answers that is
  the `{{placement}}` / `{{site_source_name}}` capture already written into
  `src/attribution.ts` and still unpushed, plus the matching macros in URL
  Parameters. Same day-one property as `{{ad.id}}`: clicks that land before it
  exists never get one.
- **Promoting an existing organic reel** (`source_instagram_media_id` +
  `instagram_user_id` on the creative) is a second route around the
  missing-photos problem, alongside the `object_story_id` route recorded above.
  Eligibility is concrete: under 90 seconds, 9:16, **no third-party copyrighted
  music, GIFs, interactive stickers or camera filters**, and **not shared to
  Facebook**. Two of those bind the founder's *next* reel rather than his past
  ones, and cost nothing to comply with: trending audio is licensed for organic
  and not for ads, and cross-posting a reel to the Page makes it ineligible.
  Gated on the same unresolved Instagram question as everything else in §24 —
  `ads_get_ig_accounts` returns `[]`, which per the tool's own documentation
  means *either* nothing linked *or* no `instagram_basic`, and our token is
  `ads_read`. **Still evidence of nothing.** Re-checked 2026-09-18.
- **Creative rules worth following now, at zero cost:** keep the bottom 35% of a
  9:16 frame clear of text and logos (the Reels UI covers it), and build for
  sound-on.

#### One doc error severe enough to name

**Step 4, "Target Definition", is wrong.** It POSTs a `targeting_spec` carrying
geo, age and interests to `/act_<ID>/customaudiences` with `subtype=CUSTOM` and
`customer_file_source=USER_PROVIDED_ONLY`. A customer-file audience takes no
targeting spec — demographics belong on the **ad set**. Copied onto this account
it would create a junk audience sitting next to the three real ones from Layer 4.
Also: the doc's own rate-limit section says "Standard Access → Advanced Access",
the retired names its **own banner** says have changed. Plus `daily_budget=5000`
= ₹50/day, below this account's ₹94.91 minimum, and a v25.0 pin. That is now the
fifth doc running on both counts (§9, §15); not restated again.

#### The hole it exposed, and what was built

**`meta_adset_config.targeting` holds only the keys an ad set EXPLICITLY carries
— four of them on the live ad set.** Every placement actually running is computed
by Meta and returned under a separate `effective_*` field that nothing here had
ever asked for. So §10's finding that Audience Network `rewarded_video` is live
— the inventory where someone watches an ad to unlock a life in a mobile game,
the lowest-intent in the ecosystem — came from a human reading the config once on
2026-09-09, and **nothing would have noticed if it changed**. A preview cannot
cover it either: `/generatepreviews` has no Audience Network `ad_format` at all
(previous entry). Reading the effective fields is the only way to know.

Placements are also mutable in place, exactly like targeting: choose one and the
previous set is gone with nothing recording it. Not backfillable, which is why
this belongs before spend rather than after.

**BUILT 2026-09-18** (migration `meta_adset_placements`, plus two corrective
migrations below; `meta-ads-sync` **v20**, then **v21** for the push,
`verify_jwt: false` throughout):

| Piece | Note |
|---|---|
| `meta_adset_config.placements` + `placements_observed_at` | Current reading. `observed_at` is stamped **even when Meta returns nothing**, so "read, found nothing" never looks like "never asked". |
| `meta_adset_placement_history` | One row per distinct VERSION, mirroring `meta_adset_targeting_history`. `first_seen_at` is an observation time; the sync is daily. |
| `record_adset_placements()` | Service role only. Comparison in SQL, like targeting and learning. |
| `meta_adset_placement_warnings()` | Service role only. Four findings, each carrying whether it was **chosen**. |
| `get_meta_adset_health()` | Gains `placements`, `placement_versions`, `placement_warnings`, `placement_capture_since`. Every existing key kept — verified byte for byte. |
| `meta-ads-sync` v20 | The placement block is tried FIRST and dropped FIRST in the field ladder. |
| `meta-ads-sync` v21 | The Audience Network push, below. |

**Three decisions worth not re-litigating:**

- **`explicitly_set` is stored beside the effective placements, not derived at
  read time.** §5 Layer 9's trap is that absence means "on Meta's default", not
  "off". A warning that cannot tell *"the founder chose Audience Network"* from
  *"nobody chose anything, so Advantage+ turned it on"* is worse than none — the
  first needs no response and the second is the money leak. Recording both makes
  each version self-describing rather than needing a second query.
- **The placement block is dropped FIRST in the try-then-fallback ladder.** It
  was the newest and least proven set of field names in the file, and the ladder
  beneath it has worked since v16. Ordering it this way means a wrong guess about
  a placement field name costs the placements and nothing else — it can never
  take the proven learning capture down with it.
- **Nothing pushes.** §15's standing rule is that setup and delivery state is
  page-only unless the founder asks otherwise, and the one ad set is PAUSED, so
  nothing here is urgent. Wiring a push is a later one-line change, not a
  decision to take for him.

#### The defect the first live run found, which review had not

`placement_fields_accepted: true`, `placement_readings: 0`.

**Meta ACCEPTED all seven `effective_*` field names on `/act_<ID>/adsets` — no
400, so the names are right — and returned not one of them.** It omits a field it
has no value for, exactly as it does for `daily_budget` (the budget lives on the
campaign) and `learning_stage_info` (§9). The full response for the live ad set
carried nine keys and no `effective_*` placement among them.

Two things were wrong because of it, and both are now fixed:

1. **The warnings function returned ZERO rows** for an ad set that is, per §10,
   running Audience Network `rewarded_video` on Meta's default. A panel reading
   only these warnings would have shown "no problems" while the leak this whole
   layer exists to catch sat there unseen. **Silence is not health.** An unread
   ad set is now a finding, `placements_unknown`, severity `unknown`, carrying
   `reason: never_read | meta_returned_none`. Same discipline as `untagged_spend`
   being gated on capture being live (Layer 7): a check that cannot see must say
   so out loud.
2. **The sync reported `placement_captured: true`,** which meant only that the
   field shape survived. Split into `placement_fields_accepted` (no 400) and
   `placement_readings` (ad sets Meta actually returned values for). Accepted
   with zero readings is the normal state of a paused, never-delivered ad set;
   reading it as "captured" makes an unknown look checked.

**So the capture is wired and proven wired, and it will start producing rows when
the ad set delivers or when a placement is chosen by hand.** That second case is
itself the action §10 recommends, and it works today with no dependence on the
effective fields at all — a manual placement choice lands in `targeting`, where
`explicitly_set` reads it directly.

**A trap that does not carry over from the targeting build.** `record_adset_targeting()`
moved its comparison into SQL because jsonb equality is **key**-order independent.
That protection does **not** extend here: jsonb equality on an **array** *is*
order-sensitive, and every one of these fields is an array. Unsorted, Meta
returning `["instagram","facebook"]` one day and `["facebook","instagram"]` the
next would write a new version and bury the real edits — the same failure the
targeting build avoided, in a new place. `meta_sorted_jsonb_array()` sorts on the
way in, and the fixtures prove a reordered reading records no change.

One smaller catch: `effective_status` shares the `effective_` prefix and is not a
placement. SQL drops it (the normaliser keeps a fixed key list), but counting it
in `placement_readings` would have made every ad set look like it had a reading.

**Verified** — 22 assertions in rolled-back transactions, plus the live run:
sorting and null passthrough; the normaliser keeping only known keys, sorting
them and deriving `explicitly_set`; first reading versions, **reordered arrays do
not**, a real change does, an empty reading still stamps `observed_at` and writes
no version, a null ad set id is refused; three unchosen findings read `leak` and
three chosen ones read `info`; an ARCHIVED ad set is excluded; the founder gate
returns NULL; `anon` and `authenticated` hold EXECUTE on none of the four new
functions and the history table has exactly one RLS policy. Afterwards: **0
fixture rows, 0 breach events, 0 pushes.** The security advisor flagged the two
new helpers for a mutable `search_path` — pinned to `''` rather than inherited,
because they run inside a SECURITY DEFINER chain — and shows nothing else on the
new objects. Repo migration and live database were then compared function by
function: **all five bodies are byte-identical once comments are normalised.**

**Applied migration names differ from the single repo file, on purpose:**
`meta_adset_placements`, then `meta_adset_placements_unknown_is_a_finding` and
`meta_placement_helpers_pin_search_path`, both folded into
`20260918_meta_adset_placements.sql` so a replay produces the live state.

#### The push for unchosen Audience Network — BUILT 2026-09-18, `meta-ads-sync` v21

Offered rather than assumed, because §15 says setup state stays page-only unless
he asks. He asked the same day: *"add the push for unchosen audience network."*

**Read this limit before relying on it: it CANNOT fire before the first rupee
moves.** Meta returns no `effective_*` placement fields for an ad set that has
never delivered, so there is nothing to detect while the account is quiet. This
is a **first-day-of-spend** alarm, not a pre-spend one. The pre-spend check is
still the founder-side item in §24 — choose placements by hand in Ads Manager —
and this exists to catch the case where that was forgotten, or where a later edit
puts Audience Network back.

| Decision | Why |
|---|---|
| Only `severity = 'leak'` pushes | Audience Network he picked on purpose reads `info` and stays silent. A notification about a decision just made is noise. |
| Only `audience_network_on` and `audience_network_rewarded_video` | `brand_safety_relaxed` is a positioning matter for the page, not money leaving. `placements_unknown` never pushes: "we cannot see" is not an event. |
| ACTIVE only | Same rule as `adset_unlearnable_goal`. A paused ad set costs nothing. It still SHOWS on the page — verified with fixtures, so the page and the phone deliberately disagree. |
| **ONE push per ad set**, led by `rewarded_video` when present | `rewarded_video` implies `audience_network_on`, so pushing both is two notifications about one switch — the grouping lesson from §5 Layer 7. |
| **ONE ledger row per ad set**, not per finding | Unlike the guardrail evaluator, which writes per rule so each keeps its own cooldown. Here the two findings are one switch with one fix, so they share a cooldown; splitting them would re-push about the same thing. |
| `observed` / `threshold` NULL | A yes/no finding with no number to exceed, the same shape as `adset_no_customer_exclusion` (§19). Inventing 1/0 would make the history lie. |
| 7-day suppression (`ADSET_WARN_SUPPRESSION_DAYS`, reused) | Identical reasoning to the goal warning: a setup decision only he can change, and daily nagging is how an alarm gets muted. |
| Wording names the fix | "Turn Audience Network off in the ad set's placement settings" — free, no API, and the only action available. |

**A defect caught while wiring it.** The block was first written after the
optimisation-goal warnings, whose RPC failure path `return`s early — so a failure
in `meta_adset_optimization_warnings()` would have silently disabled the
Audience Network push, with nothing saying so. It now runs **before** that
section and reports its own count (`placement_warned`), so either check can fail
without taking the other down. That is §5 Layer 7's two-independent-halves rule,
which existed precisely because this shape is easy to reintroduce.

**Verified** — 13 assertions in rolled-back transactions against the exact
predicate the edge function applies: an ACTIVE ad set on unchosen Audience
Network yields two findings but **one** ad set to push about; a deliberately
chosen one yields **zero** leaks; a paused one still reports on the page but is
dropped by the ACTIVE gate; brand safety is a finding and is **not** pushable;
`classic`-only produces `audience_network_on` alone while `rewarded_video`
produces both; and the cooldown lookup finds its own rule's row without colliding
with `adset_unlearnable_goal` on the same ad set id. Afterwards: 0 fixture rows,
0 ledger rows, **0 pushes**.

**Not tested end to end, deliberately:** an actual notification. Faking one means
a false alarm on the founder's phone, which §22 already declined to do for the
watchdog. The delivery chain itself is proven (§16 Phase 5, `meta_ad_issue` seen
on his phone); what is unexercised is this branch calling it.

**Live and silent, as it should be.** The 2026-09-18 run: `placement_warned: 0`,
0 ledger rows, 0 pushes, and the only finding is `placements_unknown` — Meta
returning nothing for a paused ad set.

**Not pushed:** nothing client-side changed, so there is no panel card for this
yet. `get_meta_adset_health()` carries the data for whenever the Growth ▸ Ads
"Learning phase" card ships.

### Threads Ads — the whole surface, 2026-09-18

Eight pages supplied together: *Threads Ads*, *Threads Ads Creation*, *Threads
Carousel Ads*, *Threads Advantage+ Catalog Ads*, *Threads App Ads*, *Promote
Existing Posts as Threads Ads*, *Threads Ads Reply Moderation*, *Get Threads Ads
Insights*.

**Nothing built.** Threads is a PLACEMENT, not a channel — it cannot be run
without Instagram — and Meta states twice, in two of these eight docs, that it
is throttling the placement on purpose: *"we are keeping the volume of ads in
Threads intentionally low as we test and learn, therefore expect that delivery
to Threads will be low."* At this account's budget that makes Threads a rounding
error. Building for it would be building for inventory Meta is rate-limiting.

Three things are nevertheless worth knowing, and the first is live right now.

#### It is ALREADY switched on, and nobody chose it

§10's targeting read lists `effective_publisher_platforms` as facebook,
instagram, **audience_network, messenger, threads**. The ad set sets no explicit
`publisher_platforms`, so Advantage+ placements runs everything and Threads is
inside "everything".

**Same class of finding as `rewarded_video`** (§10): a Meta default making a
decision that reads like a choice. The verdict is the opposite one, though.
Rewarded video is the lowest-intent inventory in the ecosystem; Threads is
text-first and conversational, which plausibly suits a curated club and the same
audience that already arrives via `l.instagram.com` (§5 Layer 0). **Opinion,
stated once:** keep Threads, drop Audience Network. Both are one placement edit
in Ads Manager, no build, and the founder's call.

**Threads can never be a standalone test.** `threads_stream` requires
`instagram` AND the Instagram `stream` position in the same ad set. It rides on
Instagram delivery; it does not fragment the ad set into its own learning
phase, which is the one structural point in its favour.

#### The brand risk: we could watch the conversation and not join it

Threads ads carry public replies — the native interaction mode, not an edge
case. The moderation doc's limitation list lands badly here:

| Route to a Threads identity | Can moderate replies? |
|---|---|
| Real Instagram-associated Threads account | Yes |
| Instagram-backed (mock, API-created) | **No** |
| Page-backed (mock, API-created) | **No** |

The two mock routes are exactly what is available to someone without a real
Threads profile, and both are explicitly unsupported for reply moderation, as
are Advantage+ catalog ads and boosted posts.

Our token narrows it further: **reading replies needs `ads_read` (we have it);
hiding a reply or posting one needs `ads_management`**, which §15 rules out by
decision. So even on a real Threads account, today we could read the
conversation under our own ad and do nothing about it. Not a blocker — Ads
Manager and the Threads app both moderate by hand — but it should be a choice
rather than a discovery, on a platform where the replies are the point.

#### The measurement opening, and why it was NOT built

The insights doc names `breakdowns=publisher_platform, platform_position`.
Checked against §13 item 6: **neither field appears in the Type 1 list** (drops
the metric entirely: `region`, `dma`, both `hourly_stats_*`) **nor in Type 2**
(returns the metric without the breakdown value). So off-Meta conversions —
our Purchase and Lead — **survive the placement breakdown**, and true cost per
ticket BY PLACEMENT is computable. That is the thing that would settle §10's
open `rewarded_video` question with cash instead of suspicion.

**Deliberately not built, for §13 item 6's reason:** Meta serves ~37 months of
insights, so the spend half is **backfillable**. The half that is not
backfillable is the client macro, and §10 already records it — not repeated here
as a nudge. The two halves are complementary and both are needed: Meta's
breakdown gives spend per placement, our `attribution.placement` gives bookings
per placement.

**One thing this batch does settle.** §10 says Meta's URL macros "are not
covered by any of the docs in this batch" and to confirm spellings in Ads
Manager. This batch confirms one: **`SITE_SOURCE_NAME` is a real `url_tags`
macro**, and the doc recommends `utm_source=threads` for third-party tracking.

#### Checked live and NOT settled — do not repeat it

The creation doc calls the placement **`threads_stream`**; the insights doc
reports it as **`threads_feed`**. `ads_get_field_context` on `platform_position`,
`publisher_platform`, `threads_positions` and `instagram_positions` returned
**all four in `unknown_fields`** — the Ads MCP catalog carries neither breakdown
nor targeting-position fields. So the tool is evidence of nothing here, exactly
as with the `objective` enum (§23, "Basic Ad Creation") and `ads_get_ig_accounts`
(§23, "Create an ad creative"). Most likely both names are correct — one is a
targeting INPUT and the other a reporting OUTPUT, which is the §9 "four naming
conventions for one object" pattern — but that is inference, not a check.

#### Creative constraints that bite this business specifically

- **No URLs and no hashtags in the caption.** For a brand whose organic motion
  is link-in-bio, the CTA is the entire path to the site. The same page then sets
  a 30-hashtag limit, contradicting itself within one doc.
- **80–160 characters recommended, 1,000 hard cap — and going over fails
  SILENTLY.** Meta's words: the request "will succeed for Instagram, but it will
  not be delivered on Threads." An ad that looks created and never serves.
- **Existing Threads posts cannot be promoted.** But existing **Instagram** posts
  can become Threads ads (`source_instagram_media_id`), and Facebook posts via
  `object_story_id`. That matters because §23 found the ad account holds **0
  images and 0 videos** — promoting an existing IG post sidesteps the empty asset
  library entirely.
- **The catch on that route:** posts with copyrighted music or interactive
  elements such as filters **cannot be promoted**. Most Reels with trending audio
  are therefore out, which is most of the creator-video output.
- **Carousels have NO call-to-action button on Threads**; a headline or name
  overwrites the CTA text, each child needs its own `link` and its own
  `picture`/`image_hash` (not inherited), and images outside 1:1 are centre-
  cropped to 1:1 — a different rule from the 4:5 crop applied to single images.
- **Advantage+ catalog ads on Threads** never render product video (always
  images), and **disable reply, quote, save and share entirely**. A static entry
  card placed BEFORE the catalog cards stops the ad being delivered to Threads at
  all. Academic for now: there is still no catalog on Meta (§20).
- **App ads: not applicable.** There is no app and this project does not propose
  one (auto-memory `operations-improvement-proposal`).

#### A correction to an earlier entry in this section

§23, "Ad creative (the full reference)" records a promoted-post trap as *no link
⇒ no `{{ad.id}}` ⇒ no join to spend at all*. **That is narrower than written.**
The promote-existing-post flow here passes
`call_to_action={"type":"LEARN_MORE","value":{"link":"<LINK_URL>"}}`, so a
promoted post CAN carry a destination and therefore a join. The trap applies to
promoted posts with no CTA link, not to the format as such.

**Fifth and sixth doc running on a stale version:** these pin v25.0, and the
reply-moderation page pins **v24.0** — the oldest yet. Our six pins read v26.0
(§13 item 5). Also the third batch running whose `daily_budget=1000` example
would be ₹10/day here, below Meta's ~₹94.91 minimum for this account (§9, minor
units).

### The Instagram Ads API guide set — 13 docs, 2026-09-18

The founder supplied Meta's whole Instagram Ads API guide set. Twelve of the
thirteen are writes or restatements and change nothing (§15, `ads_read` and
notify-only). **One is different, and it produced the only build in the batch.**

#### THE BUILD: the `{{ad.id}}` pre-flight check — `meta-ads-sync` v22

"Use URL Tags for Tracking" names the field that the Ads Manager **URL
Parameters** box writes to: the ad creative's **`url_tags`**. Three facts follow,
none of which was recorded here before, and together they are the whole case:

1. **It is PER CREATIVE, with no account-level default.** Every creative ever
   made has to carry the macro. So this is not a mistake made once and then
   done with — it recurs on every new ad, forever.
2. **It is a READ.** `GET /<creative_id>?fields=url_tags`, inside `ads_read`.
   Nothing about this writes to Meta.
3. **It can be checked BEFORE ANY MONEY MOVES.** A creative exists the moment an
   ad is created, ahead of the first impression. Every other tracking alarm here
   needs spend to have happened first, and `untagged_spend` is deliberately
   silent until the website client ships (§5 Layer 7). This one has neither
   dependency — which matters because the mistake it catches is *only* fixable
   before the traffic arrives. §10 calls `{{ad.id}}` "the only
   irreversible-if-missed item in the whole system"; until now it was guarded by
   a line in `META-ADS-SETUP.md` and a red strip on an unpushed panel.

**Three verdicts, and the middle one is the reason to build it at all:**

| Verdict | Meaning |
|---|---|
| `ok` | The `{{ad.id}}` macro is present. |
| `missing` | No `utm_content` anywhere. Traffic lands untagged and unjoinable. |
| **`wrong`** | `utm_content` present but NOT the macro — a hardcoded string, or `{{ad.name}}`. **The ad reads as tracked from every angle a human would look at, and joins to nothing.** Same shape as the unsubstituted-`{{macro}}` finding in §10, in a new place. Sorted first everywhere. |

**It searches the WHOLE creative, not just `url_tags`, and that is the
fixture-that-must-not-fire rule (§11).** Parameters typed straight into the
destination URL are substituted by Meta identically and track perfectly well. A
check reading `url_tags` alone would have raised an alarm on a correctly-tracked
ad — and every real bug testing has found in this system was an alarm firing on
something healthy, never one staying quiet. The search can only err toward
silence.

**What it does not claim:** that *every* link in a multi-link creative is
tagged. It answers "does this creative carry the macro at all". Recorded as a
limit rather than engineered around, because no such creative exists yet.

**Objects** (`20260918_meta_ad_creative_tracking_tags.sql`, applied):

| Object | Note |
|---|---|
| `meta_ad_creative_tags` | One row per CREATIVE (several ads can share one; the tag lives on the creative). Founder-gated SELECT, `anon`/`authenticated` revoked. |
| `meta_creative_tag_verdict(text, jsonb)` | The rule, in SQL so correcting it is a `CREATE OR REPLACE` and not an edge-function deploy. |
| `record_ad_creative_tags(jsonb)` | Writer. **service_role only** — a founder gate would hand the cron a NULL and silently stop the capture (§6). |
| `meta_ad_tracking_tag_warnings()` | Ungated core. **service_role only.** |
| `get_meta_ad_tracking_tags()` | Founder-gated reader for Growth ▸ Ads. NULL for a non-founder. |

**No history table, and that is a decision rather than an omission.** Meta's
Marketing API overview states ad creatives are **immutable once created**, so
`url_tags` cannot drift the way targeting, learning state and delivery settings
do — versioning it would guard against something the platform does not permit.
`tags_changed_at` exists anyway and moves only on a real change, so if Meta ever
does allow an edit the fact is recorded. **A row appearing there is itself the
finding.**

**Why it alarms on PAUSED ads, where every other warning here does not.** The
learning-phase and customer-exclusion warnings stay quiet on a paused ad set
because a paused ad set spends nothing, so the mistake costs nothing until it
runs. This one is the opposite case: the damage is done by the FIRST untagged
click and cannot be undone afterwards at any price. The moment worth speaking up
is before the ad is switched on. Archived and deleted ads are excluded in SQL.
Suppressed 7 days per creative, like the other setup-decision warnings.

**A degraded read says NOTHING.** The field ladder is full → no-asset-feed →
bare, and the bare shape drops `object_story_spec`, which is where a destination
URL lives. On that rung the step still RECORDS and deliberately does not warn,
because a check that cannot see the link would report a correctly-tracked ad as
untagged. Reported as `creative_tags.shape`.

**The placement macro is recorded and never alarmed on.** `has_placement_macro`
notes `{{site_source_name}}`/`{{placement}}`, but the client that consumes them
(`src/attribution.ts`) is unpushed, so a zero there is about us, not the ads —
the exact mistake the `untagged_spend` capture gate exists to prevent.

**Verified.** 18 of 18 assertions in one rolled-back transaction: all three
verdicts, the canonical §10 string, a `{{ad.name}}` macro and a hardcoded value
both reading `wrong`, **the tag-in-the-link-only fixture reading `ok`** (the one
that must not fire), a promoted post with no link reading `missing`, whitespace
inside the macro, an id-less object skipped, paused warned and archived not,
`wrong` sorted first, re-recording the same state counting 0 changes with
`tags_changed_at` still NULL, a real change stamping it, and the founder gate
returning NULL when closed. Afterwards: 0 rows, 0 events, 0 pushes.

**Live.** `meta-ads-sync` **v22**, `verify_jwt: false`, deployed bundle read back
and byte-identical to the repo. Before deploying, the live v21 was downloaded and
diffed: **0 lines removed, 270 added**, so another session's work was not
overwritten. The live run returned `ok: true` with
`creative_tags: {ads: 0, creatives: 0, shape: "full", status_filter: "all_statuses"}`
— **`shape: "full"` is the load-bearing part: Meta accepted `url_tags`,
`object_story_spec`, `asset_feed_spec`, `template_data` and
`effective_object_story_id` on an `ads_read` token, first try, no step-down.**

**Not verified, and cannot be yet:** a real creative graded. The account has 0
ads. Same shape as the deleted-ads spend filter (§23, "Monitoring and
analytics") — it proves itself the first time there is something to grade.

#### The security hole this opened for one minute, and how it was nearly missed

The first migration said `revoke all on function ... from anon, authenticated`.
**That reads as sufficient and is not.** Postgres grants EXECUTE on every new
function to **PUBLIC**, which those roles inherit through and which a revoke
naming them does not touch. `record_ad_creative_tags` — a WRITER — was reachable
at `/rest/v1/rpc` with nothing but the publishable anon key.

**The near-miss is the lesson, and it is a §9 lesson landing inside the §9
document.** The verification run straight after applying queried
`information_schema.role_routine_grants` for `grantee in ('anon','authenticated')`
and got **zero rows**. That looked like proof. It actually meant *"this view
lists grants BY ROLE NAME, and PUBLIC is not a role name"* — an empty result
that meant the question was wrong, exactly as the empty Page and Instagram reads
did earlier the same day (§9, "An empty list from a read tool can mean 'not
allowed to see it'").

- **Use `has_function_privilege()`**, which resolves inheritance and cannot be
  fooled, and confirm with `set local role anon`. Both were run after the fix;
  all four objects now refuse.
- **`CREATE OR REPLACE` resets a function's ACL to the default**, so the revoke
  belongs AFTER it, never before. Getting that order wrong is how the same hole
  returns on the next edit.
- The existing ungated cores were already correct — `meta_ad_guardrail_breaches`
  and `meta_audience_membership` read `{postgres=X/postgres,service_role=X/postgres}`
  with no public entry — so this restored the house pattern rather than inventing
  one. Fixed in `20260918_meta_ad_creative_tags_revoke_public.sql`, and folded
  into the original file so a replay is correct without it.

#### Three corrections to this document

- **§10 item 2 said the placement-macro spelling "is not covered by any of the
  docs in this batch."** It is now: **"Get Ad Insights" names `SITE_SOURCE_NAME`**
  as the documented `url_tags` macro for telling placements apart in external
  tools. That is the macro `src/attribution.ts` has been waiting for. The exact
  brace spelling is still only settleable against a live ad.
- **§23 "Ad creative" said `/generatepreviews` "could NOT be tested — the tool
  takes an `ad_id` or a `creative_id`, and this account has neither."** "Get Ad
  Preview" documents a path needing **neither**: pass an `object_story_spec`
  inline in the `creative` parameter. Still blocked on having an image, but the
  stated reason was wrong. (No Audience Network format in the list — that blind
  spot holds.)
- **§23 "Ad creative" framed promoting an existing post as a tracking dead end**
  ("no link ⇒ no `{{ad.id}}` ⇒ no join to spend at all"). True only of a post
  with **no CTA link**. "Use Posts as Instagram Ads" shows `call_to_action` being
  set at creative-creation time with its own destination, and `url_tags` lives on
  the creative regardless — so **an existing Instagram post CAN be boosted to
  `/lifestyle` with the full join intact.** That matters more than it sounds:
  §23 established that the real bottleneck is 0 images and 0 videos on the
  account, and this is creative raw material that already exists and already
  carries organic likes and comments. Two caveats from the same doc: posts with
  copyrighted music or filters **cannot** be boosted (most reels with trending
  audio), and `boost_eligibility_info` is the read that says which qualify.

#### What these docs change in Meta, founder-side

- **Do NOT create a Page-Backed Instagram Account.** If the real Instagram
  account is not linked, Meta offers a "shadow" account backed by the Page — ads
  then run as **"Join Chapter அ"** with the Page's picture instead of the real
  handle. A Page gets exactly one, permanently, and where a page-connected
  account exists it must be used instead. For a club that sells on trust the real
  handle is the asset; the PBIA is the shortcut that quietly spends it.
- **The Instagram identity question may be answerable after all.** §24 records it
  as unresolvable because `ads_read` lacks `instagram_basic`. These docs name
  three *Marketing API* endpoints on a different permission path —
  `act_<id>/instagram_accounts`, `<page_id>/instagram_accounts`,
  `<business_id>/instagram_accounts` (plus `connected_instagram_accounts`) — and
  say a business-owned app qualifies, which ours is. None is exposed through the
  Ads MCP, so settling it still needs a raw Graph call or one look in Business
  Settings. "Unknown" is now "probably checkable".
- **Explore and search have a hidden placement dependency:** Explore needs BOTH
  `stream` and `explore`; search results need `stream`. Choosing Explore alone
  silently delivers nothing. And omitting `instagram_positions` delivers to every
  Instagram placement — the same absence-means-default trap as §5 Layer 9.
- **Automated product tagging is ON by default.** Only bites once a catalog
  exists (§20, deferred), but Meta will then auto-tag products onto ads by
  matching the creative image or the destination URL. A shopping overlay
  appearing on a curated club's ads because nobody opted out — the same class as
  `rewarded_video` and the relaxed brand-safety tier: a brand decision made by a
  default. `enroll_status: opt_out` per item turns it off.
- **Catalog ads never accumulate social proof.** `instagram_permalink_url` and
  `effective_instagram_media_id` are unavailable for template creatives, so those
  posts can never carry likes or comments. Reinforces §20's one opinion:
  retargeting only, never cold.

#### The media spec, because photos are the actual bottleneck

"Media Requirements" is the most immediately useful doc in the batch, given that
§23 established the binding constraint is 0 images and 0 videos rather than
anything in the API:

- **600px minimum width on every image and video, every placement.**
- **Feed:** 1:1 recommended; 1.91:1 to 4:5 supported.
- **Stories/Reels:** 9:16. **Videos cannot be cropped** (images can), so vertical
  has to be shot, not derived.
- **Video 3–60s**, looping endlessly on Instagram and once on Facebook. Every
  video needs a thumbnail **at the video's own aspect ratio**, ≥600px wide.
- **Caption ≤2,200 characters, ≤30 hashtags.**
- **Catalog images must be ≥600px on BOTH sides — and an undersized one produces
  NO error, it just never delivers.** `meta_catalog_items()` flags a missing
  image but not an undersized one, so a small photo passes our readiness check
  and silently fails on Instagram. Worth closing if catalog ads are ever switched
  on; not built, because they are deferred (§20).

Practical version, covering Feed, Explore, Stories and Reels with nothing
reshot: **one 1:1 and one 9:16 per plan at 1080px on the short side, plus one
15–30s vertical video per plan with a matching vertical thumbnail.**

#### Smaller notes

- **`WEBSITE_CLICKS` ads must not link to a Facebook Page or Instagram profile**
  — Meta says API error and a poor experience. Consistent with the founder's
  `/lifestyle` decision (§15); nothing to change.
- **`publisher_platform` / `platform_position` breakdowns survive off-Meta
  conversions**, on the §13 item 6 reading of the two restriction lists (neither
  names them). That would give placement per *impression and spend* from Meta,
  complementing `{{site_source_name}}`'s placement per *booking* from our side.
  Backfillable (37 months), needs its own table like age/gender. Candidate, not
  urgent, and the restriction-list reading wants confirming before it is built.
- **Every objective name in all 13 docs is the pre-ODAX vocabulary**
  (`LINK_CLICKS`, `CONVERSIONS`, `POST_ENGAGEMENT`). Consistent with §23's "a read
  enum is not the create vocabulary"; these settle nothing either. One useful
  mapping fact: `CONVERSIONS` (today's `OUTCOME_SALES`) is compatible with every
  Instagram placement, so the existing campaign's objective closes none off.
- **Name-based URL macros are snapshotted at first publish**, not read live. So
  `utm_campaign={{campaign.name}}` keeps the name the campaign had when it was
  first published, while `meta_ad_daily.campaign_name` comes live from insights —
  rename a campaign and the two disagree. Harmless as configured (the join uses
  `{{ad.id}}`, an id), but a reason to prefer id macros for anything joined on.
- **Sixth doc batch running pinned to v25.0**, with `daily_budget=1000` = ₹10/day,
  below this account's ~₹94.91 minimum. Both standing rules now (§9, §15).

### Meta Pixel docs — the whole set (20 pages), 2026-09-19

Founder: *"act like a fellow entrepreneur with longterm vision start building
systems that can help us grow. Before I spend a single rupee in meta ads I want
to perfect our systems."* Local copy: `~/Downloads/Meta Pixel Docs/` (saved
2026-09-19 through Meta's "View as Markdown", README indexes it).

**The prose had almost nothing new.** `disablePushState`, `eventID` dedup,
advanced matching through `init`, standard vs custom events and SPA tagging
were all already done, several more carefully than the docs. What mattered came
from a file the docs mention in one line of their CSP section:
`connect.facebook.net/signals/config/<pixel_id>`, the settings fbevents loads for
our Pixel in every visitor's browser (§9 has how to read it).

**Finding 1 — automatic advanced matching was never on.** The Pixel is opted
into 25 features and `AutomaticMatching` is not one of them. `src/metaPixel.ts`
and §9 both kept automatic setup on to protect it; it protected nothing. What
automatic setup actually did here: the junk `SubscribedButtonClick` (32 in the
month to 19 Sep, last on 18 Sep, each carrying the button's text and the page
title), page-metadata scraping (`AutomaticParameters`, `Microdata*`), and
**SmartSetup** + `SmartSetupTotalPriceExtraction` — Meta guessing standard events
and prices on its own. Those two are new: absent from the older `v=2.9.200` file.

**BUILT: automatic setup switched off in code** — `fbq('set','autoConfig',false,
META_PIXEL_ID)` queued before init, `5bcb721`, **committed, not pushed**.
- *Why the pixel-scoped form:* in fbevents 2.9.403 it opts the Pixel out of the
  whole `AutomaticSetup` group (InferredEvents, Microdata, AutomaticParameters,
  EngagementData, PageMetadata, ScrollDepth, WebChat, MicrodataCoverage /
  FieldTransmission, AutomaticMatchingRegex / AI, SmartSetup*). The global form
  (no Pixel id) only sets a single flag.
- *Why in code, not the Events Manager switch:* Data Advisor pre-selects
  automatic events on setups since 3 Aug 2026 and applies its suggestions by
  default, so a switch can be flipped back by one click in an extension. Code
  cannot.
- *Proven before committing, in a sealed page:* the real fbevents 2.9.403, our
  Pixel id, a CSP of `connect-src 'none'; img-src 'none'; frame-src 'none';
  form-action 'none'`, and stubs on beacon / fetch / XHR / img / form, so
  **nothing could reach the dataset**. Control: every button tap produced a
  `SubscribedButtonClick` with `cd[buttonText]` and `cd[pageFeatures]`. With the
  line: three taps, **zero**, while PageView, ViewContent with `content_ids` and
  `eid`, ReachedPricing, and all six hashed `ud[…]` fields went out unchanged.
  **Reuse this harness for any future Pixel change** — it now lives in the repo
  at `tools/pixel-harness/` (`d446316`). It is the only way to see
  exactly what fbevents sends without writing to the live dataset. Recipe: serve
  one static page on localhost with that CSP, install the stubs before loading
  fbevents, mirror `initMetaPixel()`'s call order, click, read `window.__sent`.

**Finding 2 — Meta can drop or strip browser data silently, and nothing watched
for it.** The same file carries, per Pixel:
- `eventValidation.restrictedEventNames` / `unverifiedEventNames`: fbevents
  drops those events outright;
- `unwantedData.blacklisted_keys[event].cd` and `sensitive_keys`: parameters
  deleted, the sensitive ones listed as sha256 of the key name;
- `prohibitedSources`: sha256 of hostnames where the Pixel locks itself;
- the `ProtectedDataMode` feature.

This is the integrity system the Conversion Tracking doc describes flagging
custom conversions with since 2 Sep 2025. A stripped `content_ids` or `value`
still arrives as an event, so no count check can ever see it: per-plan audiences
and Meta-side ROAS would just quietly stop working. For a business with a 1:1
dating test on its list, classification into a sensitive category is plausible.

**BUILT: watchdog check 7, `pixel_config`.** Live in `meta-signal-watchdog` v5,
inside the existing 09:11 IST run, phone alerts on. Rules are in §22.
- Tests: 25/25 SQL fixture assertions (including the grants), and 12/12 parser
  tests against the real file, the unknown-Pixel file, injected restrictions, a
  brace inside a string, and truncated JSON.
- One live run, all seven checks `ok`. First reading: "Meta blocks nothing and
  strips nothing we send".
- One bug caught by the tests before anything shipped: in plpgsql a bare text
  literal next to a `text[]` is parsed as an **array literal** (22P02), so every
  append is an explicit `array_append`.

**Everything else in the set, checked and left alone:**

| Doc | Verdict |
|---|---|
| Overview, Get Started, Guides index, Migrating Pixels | Base code, noscript, legacy pixels. `initMetaPixel()` is Meta's snippet transcribed; nothing to change. |
| Conversion Tracking | **0 custom conversions exist** (`ads_get_customconversions`, 19 Sep), so `is_unavailable` has nothing to flag. Custom event names ≤ 50 characters and audience keys without spaces: ours comply. |
| Collaborative Ads | A seller-platform programme. Not us. |
| Advantage+ Catalog Ads vs Reference | **They disagree.** The catalog page accepts `content_ids` OR `contents` on AddToCart; the Reference marks `contents` required for catalog ads. We send `content_ids` + `content_type:'product'`. Matters only if catalog ads are switched on (§20): add `contents:[{id, quantity}]` then, alongside the direct-plan-link fix §15 already names. |
| Pixel for Marketing API | AEM 8, `promoted_object`, `disablePushState`: all recorded or done. |
| Pixel for Movies | The closest analogue to a ticket business (`content_ids` = movie\|theatre\|showtime, `num_items` = tickets). **Two ideas recorded, not built:** `num_items` on Purchase when multi-ticket open events ship (value already = full × ticket count, so it is reporting only), and per-date content ids, which would allow a "opened the calendar for the 28 Sep trip" audience but would split `content_ids` from the catalog's ids. The date isn't chosen until after AddToCart anyway. |
| Track Multiple Events (`trackSingle`) | One Pixel today. **A tripwire, not a build:** if a second Pixel is ever added (agency, GTM, a partner), every `fbq('track')` fires into it too. Switch `trackPixel()` to `trackSingle` / `trackSingleCustom` in that same change. |
| Advanced | `autoConfig`: acted on. **CSP:** `vercel.json` sets none. If one is ever added it must allow `connect.facebook.net` for both `/en_US/fbevents.js` and `/signals/config/`, or the Pixel dies silently; the browser count checks would take ~3 days to notice. Scroll / visibility / delay triggers are engagement events with no business meaning; not adopted. |
| Advanced Matching, Tagging SPAs | Done. The harness confirmed manual matching survives automatic setup being off. |
| Custom Audiences | §19. |
| GDPR, LDU, Terms | LDU is US-state only. `fbq('consent','revoke'/'grant')` is what a consent banner would drive; see the founder item below. |
| Support FAQ | Its "click id missing after a redirect" failure is **verified absent**: `/`→`/lifestyle` (307) and `www`→apex (308) both keep `fbclid` and `utm_content`. |
| Meta Ads Data Advisor | Fine for the founder read-only (install, pin, watch events fire). **Do not run its setup automations on chaptera.in.** Its GTM flow would add a second base code, and a "suggested" standard event carries no `event_id`, so a suggested Purchase would double-count every sale Meta sees. |
| Reference: standard events | `SubmitApplication` (literally the invite flow), `Schedule` (picking a date) and `Contact` exist and are optimisable. **Not adopted.** Renaming a live event restarts its history and moves AEM slots, and pooling book + contact into InitiateCheckout is the founder's decision. Recorded as options, not proposals. |

**Also seen:** the dataset holds four custom test events (`AdvancedMatchingProbe`,
`AdvancedMatchingProbe2`, `AdvMatchProbe3`, `AdvMatchProbe4`, one each) from an
earlier session's probing. Harmless; noted so nobody reads them as a leak.

**One founder item, not urgent, not built: consent.** The GDPR page gives the
mechanism (`fbq('consent','revoke')` before init, `'grant'` after a yes, and CAPI
would need the same gate). India's DPDP Act rules are being phased in, and
whether a Pixel on a booking site needs prior consent under them is a question
for a lawyer, not for code. Worth half an hour of a lawyer's time before scale;
the code change is small once there is an answer.


### Customer Information Parameters, 6-page audit — 2026-09-21 (OpenClaw pilot, verified here)

First real OpenClaw audit (`~/.openclaw/workspace/reports/2026-09-21-capi-small.md`).
Six pages, one question: does what we send match the spec? Every claim below was
**re-verified against the live repo in an interactive session** before being
written here. **Nothing is fixed yet — these are findings awaiting the owner's
decision.**

1. **`client_user_agent` can be omitted, and Meta calls it required. REAL.**
   Meta: *"The `client_user_agent` is required for website events shared using
   the Conversions API"* (`05 Parameters/04 Customer Information Parameters/01
   Customer Information Parameters.md:51`). We assign it conditionally —
   `if (p.userAgent) user_data.client_user_agent = p.userAgent;`
   (`_shared/metaCapi.ts:317`) — while every event is `action_source: 'website'`.
   Delayed and retry paths feed it from stored values
   (`payu-webhook:963`, `verify-pending-payments:959`, `capi-lead:216`), so a
   missing stored UA silently drops a required field. Never substitute PayU's
   user agent: it would assert the wrong browser identity.
   **MEASURED AGAINST PRODUCTION 2026-09-21 — already solved in practice, do NOT
   "fix" the code.** Capture went live **21 Aug** (`payu_payments.client_user_agent`,
   first row 2026-08-21 16:37 UTC) and **27 Aug** (`applications.lead_user_agent`).
   Coverage by month — payments: Jun 0/54 · Jul 0/36 · Aug 25/87 · **Sep 12/12**;
   applications: Jun 0/132 · Jul 0/58 · Aug 3/108 · **Sep 12/12**. Since 20 Aug
   only **1 of 38** payments lacks one. The all-time "80% / 95% missing" figures
   are almost entirely rows written **before the columns existed** — a trap worth
   naming, because the headline number looks alarming and means nothing.
   **Therefore the conditional `if (p.userAgent)` is a correct safety net, not a
   bug:** the only rows it can still drop are pre-August ones, and sending a
   fabricated or PayU-derived user agent would be worse than sending none.
   **Residual exposure:** a pre-August unpaid lead converting later. Low volume,
   shrinking, and not worth a code change. What *would* earn its keep is an alarm
   if coverage ever falls back below ~95% — not built, owner's call.
   **Caveat:** September is 12 payments and 12 applications — a small sample, and
   100% of a small number is weaker evidence than it looks. The 21-Aug→Sep trend
   is what carries the conclusion, not the September figure alone.

2. **Accent stripping diverges from Meta's own example. REAL — but the fix is
   two-sided, and that is the important part.** Meta: *"Input: Valéry /
   Normalized format: valéry"* (same file, line 41, the `fn` row). We lowercase,
   NFD-decompose, strip combining marks, then drop everything outside a–z
   (`_shared/metaCapi.ts:163-168`), so `Valéry` → `valery` — a different SHA-256.
   **⚠ `src/metaPixel.ts:185-186` does the IDENTICAL normalisation**, so browser
   and server currently agree with each other while both differ from Meta.
   **Changing the server alone would break the browser/server 1:1 match** that
   the [[meta-capi-audit-2026-09]] work established and that EMQ 8.0 rests on.
   Either both sides change together, or neither does.
   **CLOSED 2026-09-21 — owner's decision: not worth fixing.** The business is
   India-only and Indian names written in the Roman alphabet essentially never
   carry combining accents, so the affected population is near zero, against a
   two-file coordinated change that risks the browser/server match if either half
   is missed. Deliberate accepted deviation, not an oversight. Re-open only if
   the customer base stops being India-only.

3. **Phone normalisation assumes an Indian 10-digit number. CLOSED 2026-09-21 —
   owner confirmed the business is India-only, so this is correct behaviour, not
   a defect. Do not re-open it.** `_shared/metaCapi.ts:87-93` strips non-digits, takes the last ten and
   prefixes `91`; `CLAUDE.md` confirms phones are stored as bare last-10-digits.
   Correct for Indian mobiles; a non-Indian number is silently relabelled Indian.
   Meta requires a country code and no leading zeros. **Decide whether the
   business is India-only** before treating this as a defect.

4. **A 200 with no `events_received` counted as a successful send. FIXED AND DEPLOYED 2026-09-21.** Found by the full audit as candidate A-1; the verifier REJECTED it as a *documented requirement* violation (Meta's quote is about Events Manager, not a mandatory parser rule) and was right, but the narrow code observation was true. `_shared/metaCapi.ts` checked `received === 0 || messages.length > 0`, so an **absent** count passed both tests and fell through to the success log as `events_received=?` — visible, but recorded as sent, which is the one outcome that parser exists to prevent.
   Now a non-numeric count logs `200 WITHOUT A COUNT` and returns false. **Checked before changing it:** Purchases discard the boolean (`sendPurchaseToMeta` returns `void`), so the three payment functions change only their log line; `capi-lead` is the only behavioural change, and there failing is the safe side — it leaves `lead_reported_at` unstamped so the sweep retries with the **same `lead_id`, which Meta deduplicates** (the code's own comment says so).
   **Deployed to all five importers** with `--no-verify-jwt`: `capi-lead` v9→10, `meta-audience-sync` v9→10, `verify-pending-payments` v36→37, `payu-webhook` v64→65, `payu-callback` v69→70. Every `verify_jwt` re-read as `false` afterwards, every `ezbr_sha256` changed, and an unauthenticated GET returns 302/200 — **not 401** — on all five, which is the check that proves payments still work.

**A negative result worth keeping:** Researcher A found no contradictions in
`03 Using the API`, `05 Parameters/03 Server Event Parameters` or
`12 Handling Duplicate Events`. That certifies nothing about runtime behaviour or
browser/server deduplication — it only means those three pages raised no
candidate against the field map.

**Also settled, so nobody re-opens it:** `05 Parameters/02 Main Body Parameters.md`
was deliberately excluded from the six and the co-manager objected. Checked
directly — it holds exactly two rows, `data` (required) and `test_event_code`
(optional), both already sent correctly. Nothing there.

## 24. Before the first ad spends — the checklist

Written 2026-09-18, from the readiness check the founder asked for: *"can you
check again if we can use these meta ads systems in live ads or no thoroughly?"*

**Every row here is a founder action in Meta's own tools, or a decision. The code
side is built and live except where a row says otherwise.** Each row points at
the section holding the detail rather than restating it, so there is one copy to
keep true.

### Verified live on 2026-09-18 — do not re-audit

| What | State |
|---|---|
| App `chaptera-ads` | **Published** (`live_mode`), legal URLs and base domain set. Publishing is what makes Meta deliver production webhooks rather than test payloads (§9). |
| Ad account `1580469137074269` | **ACTIVE, payment method on file**, INR, Meta minimum ₹94.91/day. |
| Webhooks | `ad_account` subscription **enabled**, all 7 fields, `include_values: true`. |
| Reading the account | `meta-ads-sync` last run ok, **0 failed runs in 48 h**. |
| Sales reaching Meta | EMQ **8.0/10** on Lead and Purchase against a bar of 6.0; 100% coverage on every key except the click id, which only exists for people who arrived from an ad. It read 9.3 when organic Instagram links still carried one, so it should rise again with paid traffic — not a defect (§9). |
| Watchdog | All six checks `ok` (§22). |
| Push devices | **One** founder device of five registered. Every Meta alarm depends on it (§16 Phase 5). |
| Advertising identity | Page **"Join Chapter அ"** (`1201531216384934`) exists with CREATE_ADS — this is who every ad speaks as. It is not yet promoted under the ad account, which is what 0 ads looks like, not a missing Page. **Whether the Instagram account is attached could NOT be determined** (`ads_read` has no `instagram_basic`) — see the Instagram item under "In Meta, before the first ad runs", and §23, "Create an ad creative". |
| Stray subscription | A `user` topic webhook subscription exists with **no fields**. It delivers nothing, but it contradicts §12's "no User/Page/IG topics" posture and the privacy policy's scope. Remove when convenient. |

**The app's Marketing API tier does not gate running ads.** Ads run from Ads
Manager; the app only reads data and receives notifications (§23,
"Authorization").

### In Meta, before the first ad runs

1. **`{{ad.id}}` in every ad's URL Parameters.** The whole join between spend and
   bookings, and the only irreversible-if-missed item: traffic that arrives
   without it can never be matched to an ad. §10.
   **NOW CHECKED AUTOMATICALLY, since 2026-09-18** — `meta-ads-sync` reads every
   ad creative's `url_tags` daily and pushes if the macro is absent or wrong,
   including on PAUSED ads, so the mistake surfaces before the ad is switched on
   rather than after the traffic is lost. It is still the founder's to *set*:
   the token is `ads_read` and nothing here writes to Meta. Note it is **per
   creative with no account-level default**, so it has to be right on every new
   ad, not once. §23, "The Instagram Ads API guide set".
2. **The paused ad set optimises for `PURCHASE`,** graded `impossible` — the site
   produces ~4–10 purchases a week against Meta's ~50 bar, so it would sit in
   learning for its whole life. §5 Layer 9, §10.
3. **That ad set does not exclude existing customers.** The audience exists (107
   people) and is not attached. §19.
4. **The AEM 8-event priority list**, once, after the first campaign exists —
   changing it later pauses delivery for 72 hours. Also Events Manager →
   "Track events automatically without code", to free the junk slot. Neither is
   verifiable through the API; both are founder-side. §9.
   **UPDATED 2026-09-19:** the junk slot is now closed in code (`5bcb721`, live
   once pushed), so that switch becomes belt-and-braces, and whether automatic
   events are on IS readable after all — from Meta's public settings file (§9),
   daily, by `pixel_config` (§22).
5. **Brand-safety default, and one geo setting to re-check.** The relaxed content
   tier (`FACEBOOK_RELAXED`, `AN_RELAXED`, `FEED_RELAXED`) is still a Meta default
   nobody chose. **The Audience Network half of this item is DONE — turned off
   2026-09-18 on the founder's instruction** (§10, "CHANGED 2026-09-18"). That
   write also left `location_types` widened by Meta from `["home"]` to
   `["frequently_in","home"]`, against what was sent and twice over: check whether
   the Ads Manager UI can force it back to people who LIVE in the radius, which is
   what a club expecting the same faces back wants. §10.

- **Confirm the Instagram account is attached** to the ad account and to the
  Page "Join Chapter அ". Added 2026-09-18 and deliberately left unnumbered so
  the list above keeps its numbering. This could **not** be checked from here —
  `ads_read` carries no `instagram_basic`, so the empty read is evidence of
  nothing. It matters because organic traffic is Instagram-first (§5 Layer 0),
  and an unattached account means Instagram placements serve under a fallback
  identity rather than the real handle. One look in Business Settings. §23,
  "Create an ad creative".
- **Confirm a Threads identity exists**, now that `threads_stream` is an
  explicitly chosen placement rather than one of Advantage+'s many (§10, "CHANGED
  2026-09-18"). Meta is explicit: ads cannot run on Threads without an
  Instagram-associated, Instagram-backed or Page-backed Threads account. While it
  was one default among many, an ad that could not serve there simply served
  elsewhere and nobody noticed; now it is a placement deliberately kept, so no
  identity means it will not deliver. **Not checkable from here** — the same
  `instagram_basic` gap as the bullet above, so an empty read proves nothing. If a
  Threads profile exists with the SAME USERNAME as the Instagram account and in the
  same Business Portfolio, that is the Instagram-associated route and needs no
  setup. The two fallback routes create a MOCK account nobody can log into, and
  mock accounts cannot moderate replies at all. One look in Business Settings.
  §23, "Threads Ads".
- **Two caption rules for Threads**, for whoever writes the ad copy. Over **1,000
  characters** the request "will succeed for Instagram, but it will not be
  delivered on Threads" — Meta's own words, i.e. silent non-delivery on a
  placement that reports as healthy; 80–160 characters is what Meta recommends.
  And **URLs and hashtags are not supported in the caption at all**, so on Threads
  the call-to-action button is the entire path to the site. §23, "Threads Ads".

### Before pushing the website

6. **TODO: read `META_ADS_ACCESS_TOKEN`'s expiry** in Meta's Access Token
   Debugger. Never into chat. "Never" ⇒ nothing to build; a date ⇒ replace it
   before then and build the daily check in §23 "Authentication". §18.
7. **Stage the push deliberately.** `src/AdminPanel.tsx`, `src/AppFlow.tsx`,
   `src/attribution.ts` and `src/supabase.ts` carry several sessions' work;
   `git add -A` would ship all of it under one message. §18.
8. **TODO: verify the live database structure — the written record is
   INCOMPLETE.** Founder's ask, 2026-09-21: confirm the schema is sound before
   the Meta system is fully live. Measured the same day: the live database
   reports **273 applied migrations** while `supabase/migrations/` holds **190
   files**, and since 2026-09-01 alone **16 migrations are applied live with no
   file of that name in the repo** — `meta_ads_performance_ticket_count`,
   `meta_ads_performance_sync_state`, `meta_audience_membership_security_note`,
   `meta_audience_layer_guard_grants`, `meta_ad_guardrails_untagged_needs_capture`,
   `meta_signal_watchdog_cron_timeout`, `meta_jobs_daily_retry_before_watchdog`,
   `meta_adset_placements_unknown_is_a_finding`, `meta_placement_helpers_pin_search_path`,
   `meta_pixel_config_verdict_array_append`, `ad_library_ingest_secret`,
   `ad_library_ingest_secret_hashed`, `email_status_request_is_not_delivered`,
   `whatsapp_click_tracking`, `whatsapp_sends_application_id`,
   `whatsapp_sends_backfill_application_id`. Whether those are unsaved files or
   renamed ones has **not** been investigated.
   **Why this is a to-do and not a footnote:** the migrations folder is therefore
   NOT a picture of the live schema, so anything that audits it instead of the
   database can report "we never did X" when X has been live for weeks — the same
   failure mode as the live-RPC drift in §14's notes. Several of the missing rows
   are security changes (`*_guard_grants`, `*_security_note`), which is the worst
   category to be wrong about.
   **Where it must be done:** an interactive Claude session with the Supabase MCP.
   `/check-db` runs Supabase's own security and performance linters and reads them
   against this project's deliberate exceptions (`app_secrets`,
   `meta_audience_membership`). **OpenClaw cannot do this** — its workers have live
   connections disabled, no internet, and an 8-program shell with no `psql` or
   `supabase`; it can only read the incomplete `.sql` files (`OPENCLAW-HANDOFF.md`
   §6).
   **Note this verifies what is already running, not a pre-deploy gate:** the Meta
   database layer is live — **20 `meta*` tables and 39 meta functions in production
   on 2026-09-21**. It is the admin panel that is unpushed, not the schema.

### What the push switches on (and what stays broken without it)

Live today without it: the booking-level source (since 13 Aug), so cost per
booking, cost per ticket and true ROAS per ad all work.

Only after the push:
- the per-ad funnel — where an ad's traffic stopped;
- site experiments (they need the visitor id that survives sessions);
- which placement a click came from;
- ViewContent on a direct plan link;
- every new Growth ▸ Ads card: fees by payment method, "too few tickets to
  judge", "Learning phase", "What's switched on";
- **the `untagged_spend` alarm**, which is the one that would tell you
  `{{ad.id}}` is missing. It is deliberately silent until funnel rows carry a
  source, so until the push that mistake is visible only on the page's Tracking
  health panel, never on the phone. §5 Layer 7.
- **automatic setup off** (`5bcb721`, 2026-09-19): no more `SubscribedButtonClick`,
  no page scraping, no SmartSetup guessing events or prices. §23, "Meta Pixel docs".

### Limits already accepted, recorded so they are not rediscovered as faults

- **One push device.** A second is a re-subscribe from Settings in the admin app.
- **Every Meta cron runs once a day** (founder's decision 2026-09-17, free-plan
  reasons). Cost alarms and rejected-ad notices surface up to a day late; the
  hard stop is the Ads Manager daily-spend rule. §8 records the trade-offs he
  accepted and names ads starting to spend as the moment to revisit.
- **Limited (development) Marketing API tier.** Usage reads 0% and the sync
  paces itself, so nothing is throttled at this volume. §23, "Authorization".

---

## 25. Competitor ad watching — the Ad Library capture system

**Founder-requested 2026-09-18.** Watchlist starts at **one page**:
`thirdspace_by_losh` (`1042347828962277`). He will add more himself.

### What this answers, and why it cannot be bought later

Meta will never tell us a competitor's spend or reach in India (§25.3). The one
signal that *is* available is **how long an ad keeps running** — losers get
switched off within days, so an ad still live after weeks is one the advertiser
believes in. That signal exists only if somebody was watching: **the Ad Library
tells you an ad started, never that it stopped.**

Worse, for a local Indian advertiser a stopped ad **disappears from the library
entirely**. Measured 2026-09-18 across three real Chennai competitor pages:
6 ads with `ACTIVE`, **0 with `INACTIVE`**. So the creative is gone too, unless
it was captured while live. Every day without this running is competitor history
that cannot be reconstructed at any price — the §1 "data not captured on day one
is gone forever" rule, applied to somebody else's data.

### 25.1 The architecture, and why it is not the two obvious alternatives

**It is a plain Node script on the founder's Mac, run by launchd. Not a Claude
scheduled task, and not a Supabase edge function.** Both were considered and
rejected with reasons, so they are not re-proposed:

| Rejected | Why |
|---|---|
| **Claude scheduled task** (`~/.claude/scheduled-tasks/`) | Genuinely viable — it runs locally, has a browser, needs no dependencies. Its only real advantage over a script was writing a daily summary, and **the founder explicitly removed the summary** ("I don't need an ai summary everyday"). What remains — fetch a list, diff, download — has no judgement in it. A Claude task would then burn tokens every day forever to do something deterministic, and would only run while the Claude app is open. |
| **Supabase for the CREATIVE half** | Cannot render JavaScript, and the Ad Library page is a **481-byte empty shell** without a browser (measured). It could never do the creative half at all. **This is still true and still the reason capture runs locally.** |
| ~~**Supabase for the METADATA half**~~ | **REVERSED BY THE FOUNDER, 2026-09-18 — it is now Phase 2 and it is built.** Initially deferred as a second system for a founder who asked to simplify. He then asked to see competitor activity inside Growth ▸ Ads, which a local JSON file cannot do. Note the reversal cost nothing: the ledger had not been built yet, and metadata is cheap to move. Had the creative been put there too, it would not have been. |

**No API token is involved, by design.** The Ad Library searches used in-session
come from Meta's advertiser-facing MCP tool, which a local script cannot call.
The *public* `/ads_archive` API needs the Facebook.com/ID political-advertiser
verification the founder has not done — and per Meta's own doc would return only
political ads for India anyway, which is useless here. The script therefore reads
the **public Ad Library web pages** in headless Chrome. Nothing to expire, rotate
or leak. **Do not "improve" this by adding a token.**

**Zero dependencies, verified.** It drives the Google Chrome already installed at
`/Applications/Google Chrome.app` over the DevTools Protocol, using Node 24's
built-in `WebSocket` and `fetch`. No Playwright, no Puppeteer, no Chromium
download. (`~/Library/Caches/ms-playwright` exists on this machine but is **0 B**
— an empty marker, not an install. Do not assume Playwright is available.)

### 25.2 Proven on 2026-09-18, before any of it was built

A throwaway script captured all three of `thirdspace_by_losh`'s live ads into
`~/Desktop/ads/`: one 9-second video and two 600×600 images, with copy, start
dates and metadata. That run is what the phases below promote into a real tool.

**The bug that proof found, which is the whole reason to build it carefully.**
The obvious design — open each ad's `?id=<library_id>` permalink and read the
page — is **wrong**. That URL opens a *dialog on top of the full ad grid*, so
`document.querySelector('video')` returns the first video on the PAGE, not the ad
requested. The first run captured one competitor's video **three times, byte
identical (same MD5), labelled as three different ads**, and reported
`3/3 captured` — a confident wrong answer that looked like success. It was caught
only by checksumming the output.

**The fix:** render the page-level grid **once**, and walk up from each
`Library ID: N` to the smallest ancestor containing exactly one library id AND
its own media. That ancestor is the ad card; everything is read from inside it.
**Never extract media from `document` scope on an Ad Library page.**

**A CORRECTION, made 2026-09-18 the same day.** This section first said to
re-verify by checksumming the captured files, on the grounds that identical MD5s
across different ads mean the scoping has broken. **That is a bad test and it was
wrong to write down**, for three independent reasons — the founder spotted the
first one:

- **It false-alarms on legitimate reuse.** Advertisers routinely run one image
  across several ads. Identical bytes are then *correct*, and a rule that calls
  it a bug trains whoever reads it to ignore the alarm.
- **It cannot fire on a page running a single ad** — the normal case for a small
  competitor, and exactly when nobody would notice the tool was broken.
- **It only fails after downloading**, i.e. once the wrong thing is already on
  disk and in the ledger.

**What replaces it: three invariants asserted inside the page, before any
download** (`tools/ad-library/extractor.mjs`):

1. **Exactly-one-id.** The card is the smallest ancestor containing exactly one
   `Library ID:` and its own media. An ancestor holding two ids is a container
   of several ads, and reading media from it is the bug itself.
2. **No DOM node may be claimed by two ads.** Keyed on the NODE, deliberately
   not on the URL — two ads sharing a creative are two different nodes holding
   the same URL, which is legitimate; two ads resolving to the *same node* is
   always the bug. This is the assertion that would have caught it at source.
3. **The id must appear inside the card the media came from**, proving text and
   creative came from one subtree.

A violation is **reported and the ad is not captured** — never guessed at, never
silently dropped. The run continues so good ads are still saved, and exits
non-zero so the failure is visible.

**And the invariants are tested against fixed HTML, not against the live site:**
`node tools/ad-library/selftest.mjs`. The Ad Library changes without notice and
cannot be made to produce a broken layout on demand, so correctness is asserted
on fixtures where the right answer is known — including the two cases a checksum
can never test: **a shared-media layout that MUST be rejected**, and **honest
creative reuse that MUST be accepted**. Five fixtures, all passing. Run it after
touching `extractor.mjs` or `capture.mjs`.

### 25.3 What is obtainable, and what never will be

| Available | Not available, ever, for India |
|---|---|
| Library ID, page, status | Spend (any figure at all) |
| "Started running on <date>" | Impressions / reach |
| "Total active time" **while the ad is live** | Demographics, targeting |
| Full ad copy | Which ads *were* run, before we started watching |
| The creative: MP4 (360p) or image (600×600), plus video poster | The original-resolution master |
| `asset_age_days` + `duration_s`, decoded from Meta's own video URL | |

**`asset_age_days` is the standout and is free.** It is embedded, base64, in the
`efg=` parameter of every video URL. On the proof run, an ad that started
11 Aug carried a **44-day-old asset** — evidence the creative predates the ad and
is being *re-run*, which is the clearest possible signal the advertiser thinks it
works. It is evidence of reuse, not proof of a prior ad run; combined with our
own observation history it becomes solid.

**Two traps recorded so they are not rediscovered:**
- **Media URLs are signed and expire.** The `oe=` parameter on the proof video
  decoded to **4.5 days** out. Storing the URL is useless; the bytes must be
  downloaded on the spot.
- **`estimated_total_count` from the search API is unreliable at small N**, and a
  broad keyword search returns multi-country spam whose currency is not even INR.
  Only page-scoped reads are trustworthy for competitor work.

### 25.4 Where everything lives

```
tools/ad-library/            ← in this repo, version-controlled, NOT part of the site build
  capture.mjs                ← the engine
  watchlist.txt             ← one "page_id  label" per line; the founder edits this
  com.chaptera.ad-library.plist

~/Desktop/ads/               ← creative, deliberately OUTSIDE the repo
  _last_run.json             ← machine-readable result of the last run
  _run.log                   ← one line per run, INCLUDING quiet days (Phase 3)
  thirdspace_by_losh/
    11-aug-2026__1028535673493135/
      video.mp4  poster.jpg  ad.txt  meta.json
```

**The metadata lives in Supabase, not on disk** — `competitor_ads` and
`competitor_ad_events` (Phase 2). `library_id` is the join: it is the table's
primary key, the folder-name suffix, and a field in every `meta.json`. So an ad
row in Growth ▸ Ads names the exact folder its creative sits in, and neither half
depends on Meta still serving anything.

Output sits outside the repo on purpose: these are third-party creatives and must
never end up in a commit or on the deployed site.

---

### Phase 1 — The capture engine (creative side)  ✅ DONE 2026-09-18

Promote the proof script into `tools/ad-library/capture.mjs`.

- Reads `watchlist.txt` rather than command-line arguments, so adding a
  competitor is editing one line of text and needs no code change.
- **Idempotent**: an ad whose folder already exists is skipped without a
  download. Re-running twice in a day costs one page render and nothing else.
- Per ad: `video.mp4` + `poster.jpg`, or `image.jpg`; plus `ad.txt` (full copy)
  and `meta.json` (library id, start date, active time at capture, media type,
  and for video `duration_s` / `asset_age_days` / encoding).
- Scrolls the grid before extracting, so cards below the fold mount their media.
- Chrome always launches on a **throwaway `--user-data-dir`**, so it can never
  touch the founder's real Chrome profile, and is `SIGKILL`ed on every exit path.
- Exit codes: `0` captured, `2` no ads found, `1` failure.
- Writes `_last_run.json` — a machine-readable result Phases 2 and 3 consume
  without re-rendering anything.

**Built as `tools/ad-library/capture.mjs` + `watchlist.txt`.** Verified on
`thirdspace_by_losh`:

| Check | Result |
|---|---|
| Clean capture into an empty directory | **3/3 ads**, `live=3 new=3` |
| **Extractor invariants** (`selftest.mjs`, fixed HTML) | **5/5 pass**, including a shared-media layout that must be rejected and creative reuse that must be accepted |
| Live capture distinctness | 3 of 3 media files distinct, 0 invariant violations |
| Idempotent re-run over a populated directory | `live=3 new=0 already-had=3` in **3.7 s**, zero downloads |
| Leaked headless Chrome processes | 0 |
| Leftover throwaway profiles | 0 |
| Founder's own Chrome profile | untouched, still running |

What it captured: one 9-second video ad running since **11 Aug** whose asset is
**44 days old** (a re-run — their most durable creative), and two 600×600 image
ads both launched that same day. Ad copy, start dates and active time all
captured.

### Phase 2 — The ledger, in Supabase (metadata side)  ✅ DONE 2026-09-18

**The founder changed this decision on 2026-09-18, and the change is the point
of the whole layer.** §25.1 originally put the ledger in a local
`_ledger.json`. He asked instead to see competitor activity inside the admin:
*"Within my admin I'd like to see ad ids that have been running successfully &
ads ids that have been removed. I don't want to necessarily see the ad within my
admin itself, if I see the id I guess that's enough because I can then see the ad
locally by matching the ID."*

**That shape is better than showing the creative, and not only because he asked
for it.** Metadata is tiny and queryable; creatives are not. Keeping media out of
the panel means no Supabase Storage, no upload step, no bandwidth, and no
third-party creative anywhere near the deployed site. The panel shows an id, how
long it ran, and a one-line excerpt; the video sits on his Mac in a folder named
after the same id.

**`library_id` is the join, and it is a good one:** Meta-assigned, globally
unique, permanent, never reused. It is the primary key here, the folder-name
suffix on disk, and a field inside each `meta.json`. **Both halves live on
hardware we control, so an ad being deleted from Meta's library breaks
neither.**

Objects (`20260918_competitor_ads_ledger.sql`, applied):

| Object | Note |
|---|---|
| `competitor_ads` | One row per ad ever seen. `started_on` (parsed), `first_seen_at`, `last_seen_at`, `disappeared_on`, `creative_captured`, `creative_path`, `ad_text`. Founder-gated SELECT. |
| `competitor_ad_events` | Append-only `first_seen` / `disappeared` / `reappeared`, never updated or deleted — the same change-only pattern as the five Meta tables in §6. |
| `competitor_ad_parse_date()` | Meta renders `11 Aug 2026`; an unrecognised format returns NULL rather than aborting a whole day's ingest. |
| `record_competitor_ads(page_id, page_label, ok, ads)` | The writer. **service_role only.** |
| `get_competitor_ads(days)` | Founder-gated reader: `running`, `removed`, `summary`. One jsonb, because PostgREST silently caps a RETURNS TABLE at 1,000 rows. |

**THE SAFETY-CRITICAL ARGUMENT IS THE `ok` FLAG, and it is the reason this is an
RPC rather than a plain upsert.** A failed render, a Meta outage and a throttled
read all return zero ads — which is indistinguishable from "this competitor
switched everything off" unless the caller says which happened. With `ok = false`
the function records sightings and marks **nothing** as disappeared. Getting this
wrong would stamp a competitor's entire live catalogue as dead on the first bad
night, and because `disappeared_on` is a permanent observation, the history would
be wrong forever. This is §6's "absence is not deletion", in the one place where
it would do the most damage.

**`days_running` prefers Meta's own start date over our first sighting.** Meta
displays when an ad actually started, which can predate the day we began
watching by weeks — the real thirdspace video started 11 Aug and was first seen
18 Sep. Using `first_seen_at` would have understated it as 0 days instead of 38.

**`creative_captured` never downgrades.** Later runs skip the download because
the folder already exists, and would otherwise report `false` and erase the fact
that the creative is on disk.

**Verified** — 12 assertions in one rolled-back transaction:

| Check | Result |
|---|---|
| First observation of 3 ads | `new=3 disappeared=0` |
| Meta's `11 Aug 2026` parsed | `2026-08-11` |
| Same observation repeated | `new=0 disappeared=0` |
| **Failed read (`ok=false`) returning zero ads** | **`disappeared=0`, all 3 still live** |
| Successful read missing one ad | exactly `disappeared=1` |
| That ad reappearing | `reappeared=1`, `disappeared_on` cleared |
| `creative_captured` on a later skip-run | stays `true` |
| Transition events logged | 7 rows |
| Garbage date string | NULL, no exception |
| Founder gate closed / open | NULL / full result |
| `days_running` for the 11-Aug ad | **38** |

Afterwards: 0 rows, 0 events left behind. Grants read
`anon=false, authenticated=false, service_role=true` on the writer and
`authenticated=true` on the reader — with the revoke naming `public`, per the
lesson in §6 learned earlier the same day.

### Phase 3 — The ingest path  ✅ DONE 2026-09-18

The local script has to reach Supabase, and **it must not hold the service-role
key to do it.** That key is the master credential for a production database with
live customers (CLAUDE.md rule 1); putting it in a file on a laptop to power a
competitor-research tool is a real widening of blast radius for no benefit.

Instead, the same shape `meta-ads-alerts` adopted on 2026-09-18: an edge function
`ad-library-ingest`, `--no-verify-jwt`, gated on a caller secret held in
`app_secrets` and checked by the function, failing closed. The script holds only
that secret, which is a credential to nothing else — the worst case if it leaks
is somebody writing junk competitor rows.

- `capture.mjs` gains a reporting step: after each page it POSTs
  `{page_id, page_label, ok, ads[]}` and logs what came back.
- **`ok` is the page's real outcome**, including the extractor invariants: a page
  with unresolved cards reports `ok:false`, so a partly-broken read can never
  mark ads as disappeared.
- `_run.log` on disk, one line per run **including a boring one** — a silently
  dead job is the failure §8 keeps recording, and absence of a line is the alarm.
- A `--verify` mode that walks the local folders and the Supabase rows and
  reports orphans in **both** directions, so the two halves can be proved to
  agree rather than assumed to.

**Built.** `ad-library-ingest` edge function, `verify_jwt: false`, deployed.

**THE SECRET IS STORED AS A SHA-256 HASH, and this deviates from
`meta_alerts_secret` on purpose.** The plaintext lives only in the founder's
macOS keychain (service `chaptera-ad-library-ingest`); `app_secrets` holds
`ad_library_ingest_secret_sha256` and the function hashes what it receives
before a constant-time compare. `meta_alerts_secret` is plaintext because
pg_cron — Postgres itself — has to send it, so the database must hold a usable
value. **Nothing inside the database ever sends this one; only a laptop does.**
So a database dump, a backup, or anyone who can read `app_secrets` learns
nothing usable. Rotation: new random value into the keychain, its sha256 into
the row; both sides read the same row, so there is no disagreement window.

**Reliability is decided per page, and the render proof is what makes a zero
trustworthy.** `extractor.mjs` now also returns Meta's own results counter
("~3 results"), which is only present once the app has really rendered. A page
reports `ok:true` only when every invariant held, every id resolved to its own
card, **and** the counter was seen. So "they switched everything off" and "we
could not look" stay distinguishable, and only the first can mark ads
disappeared. `ok` also defaults to FALSE in the edge function, so a malformed
payload can never be read as authority to mark a catalogue dead.

**Verified live:** wrong secret 401, no header 401, empty secret 401, GET 405,
OPTIONS 204 — each returning our own JSON body, which is itself the proof that
`verify_jwt` is false and the request reached our code. Then a real run wrote 3
ads (`new:3`), a second run reported `new:0 observed:3`, and `--verify` read
back "3 local folder(s), 3 ledger row(s) — both halves agree".

**Two defects found by running it, not by review:**
- **`asset_age` was lost on skip-runs.** A day that skips the download has no
  `efg` data in hand, so the ledger was writing NULL over a signal it already
  had. It now reads the value back out of the stored `meta.json`.
- **The panel excerpt was Ad Library chrome**, not the ad — every row read
  "Active Library ID: 1028535…". A card's `innerText` begins with UI furniture;
  the message starts after "Sponsored". `adCopy()` strips it.

### Phase 4 — launchd, daily  ✅ DONE 2026-09-18

`com.chaptera.ad-library.plist`, `StartCalendarInterval` at **18:00 local**, the
same pattern already proven on this machine by `com.chaptera.vite-dev.plist`
(CLAUDE.md).

- **The founder does not need to babysit 6pm.** launchd runs a missed
  `StartCalendarInterval` job when the Mac wakes, so an asleep laptop fires late
  rather than not at all. Only a full day powered off is skipped — and because
  the ledger now lives in Supabase, a skipped day loses the creative file for an
  ad that came and went, never the run-length record of anything already seen.
- `stdout`/`stderr` → `~/Library/Logs/chaptera-ad-library.log`.
- Installed with `launchctl bootstrap gui/$(id -u)`, verified by forcing a run
  with `launchctl kickstart` rather than by waiting until 6pm.

**Built and installed**, `tools/ad-library/com.chaptera.ad-library.plist`.

**`ProcessType` MUST be `Standard`, NOT `Background` — this cost a real debug
cycle.** The first scheduled run sat at `state = running` for over four minutes
with Chrome alive and one line of output, where a manual run took 4 seconds.
`ProcessType Background` asks launchd to throttle CPU and I/O, which is exactly
wrong for a job driving a browser: the render loop is wall-clock bounded, so
throttling does not save work, it just stops the job finishing inside its own
budget. With `Standard` the same run completes in **6.7 s, exit code 0**, and
the keychain read works fine under launchd.

**Nothing in a scheduled job may be able to wait forever**, which that hang also
exposed: `Browser.open()` awaited a WebSocket with no timeout, so a socket that
neither opened nor errored would hang the run indefinitely. Both the socket open
and the tab-open fetch are now capped at 20 s, and `capture.mjs` carries a hard
10-minute budget for the whole run. Keep all three.

### Phase 5 — Growth ▸ Ads: "What competitors are running"  ✅ DONE 2026-09-18 (NOT pushed)

A card reading `get_competitor_ads()`, two lists and no media:

- **Running** — library id, how many days, a one-line excerpt, and the local
  folder name so the creative is one Finder search away.
- **Removed** — library id, how long it ran, when it vanished.
- A note when `missing_creative > 0`: ads we know ran but never got onto the Mac.
- `last_observed_at` shown plainly, so a stale watcher is visible on the page
  rather than inferred.

Sorted by days running, because on this data **that is the entire signal**: with
no spend or reach available for India, how long an advertiser keeps an ad alive
is the only evidence of what is working for them.

**Built in `src/AdminPanel.tsx`, `tsc` clean, NOT pushed** (that file carries
several sessions' work — stage deliberately). It shows a **re-run** badge when a
video's asset age exceeds the ad's own age, a stale-capture warning when the
last observation is 2+ days old, and distinguishes "never captured anything"
from "captured, found nothing" — the §9 null-versus-zero discipline.

**Verified against live data** through the founder gate, since the admin is
login-gated: every key the card reads is present, `running_count: 3`,
`longest_running_days: 38`, `missing_creative: 0`, and the re-run badge
correctly evaluates true for the 38-day-old ad carrying a 44-day-old asset.

### Deliberately NOT built

- **A daily AI summary.** Explicitly removed by the founder. The data is on disk
  for him to look at; asking Claude about it is a thing he can do any day he
  wants, at the cost of that one conversation instead of 365 of them.
- ~~**Supabase mirror and a Growth ▸ Ads card.**~~ **SUPERSEDED — the owner
  reversed this on 2026-09-18 and both were built (Phase 2 and Phase 5).** The
  bullet is kept struck through rather than deleted so the reversal stays
  visible: it was deferred as a second system, then asked for because he wanted
  competitor ids visible in the admin. Note what made the reversal cheap — only
  the *metadata* moved. Had the creative been planned into Supabase too, changing
  course would have been expensive.
- **More than a handful of watchlist pages.** Meta's terms permit downloading
  creative for an *individual* ad for analysis and prohibit bulk extraction of
  the Ad Library; the Ads MCP tool's own documentation says so in as many words.
  A named watchlist checked once a day is analysis. The watchlist is capped in
  the script so it cannot quietly grow into the other thing.

### 25.5 The Ad Library API question — decision record, open as of 2026-09-22

**Status: applied for, NOT granted, and the live system is unaffected either
way.** The owner applied around 2026-09-19 expecting a 48-hour answer. Four days
on nothing has changed. This section exists so the next session does not redo
the research or re-run the dead ends.

#### What was measured, and when

**Probe re-run 2026-09-22 — identical to 2026-09-19, no movement:**

| Call | Result |
|---|---|
| India commercial, keyword `meetup` | `code 10, subcode 2332002` |
| India commercial, thirdspace page id | `code 10, subcode 2332002` |
| **India political (control)** | `code 10, subcode 2332002` |
| **UK commercial (control)** | `code 10, subcode 2332002` |

**All four fail identically, and that is the finding.** The block sits at **app
authorization, upstream of any country or ad-type logic** — so this probe can
neither confirm nor refute the India question. It only says "not authorised
yet". Do not read the India failure as evidence about India.

App state, same date: `chaptera-ads` (`38444690021845940`) reports
`submission_status: NO_SUBMISSION` and **zero App Review privileges**. Two apps
exist on the account — `chaptera-ads` and `Automation WA`
(`1221239236143201`). **`NO_SUBMISSION` does NOT prove the owner did not
apply**: the Ad Library route goes through identity confirmation at
`facebook.com/ID`, which is a separate flow and does not create an App Review
submission. Whether that identity flow was completed is **unverified** — a
password re-auth wall stopped the 2026-09-19 session there, and entering the
owner's password is not something an agent does.

#### Why approval may not help, and the mechanism

Meta's own documentation, three independent secondary sources, and the field
list all agree: **commercial ads are archived only for the EU and UK.** The
mechanism matters more than the rule — that coverage exists because the **EU
Digital Services Act legally requires it**. It is compliance, not a product
decision. India has no equivalent law, so Meta does not archive Indian
commercial ads at all.

**This makes it a data-availability problem, not a permissions problem.**
Approval would grant access to an archive that has no Indian commercial rows in
it. One source states it plainly: an ad delivered outside the EU/UK "is not
archived, not searchable, and not retrievable" — while remaining perfectly
visible on the consumer website, which is exactly the asymmetry the scraper
exploits.

**The owner's counter-position is on the record and is not unreasonable**
(2026-09-19): §9 of this document records that Meta's docs and Meta's API
disagree in both directions, so documentation is not evidence here. He applied
in order to test it against his own account. That is the right instinct and the
probe exists to settle it in about ten seconds.

#### If India data DOES come back, the prize is real

Not marginal — it would obsolete a large part of what was built:

- **`ad_delivery_stop_time`, direct from Meta.** The entire daily-observation
  design exists *because* the public pages never say an ad stopped. This field
  is that answer, handed over.
- **`ad_active_status: INACTIVE` becomes queryable → BACKFILL.** Months of
  competitor history retrievable at once. The "not backfillable at any price"
  premise of §25 would no longer hold.
- **Structured `ad_creative_bodies` / `ad_creative_link_titles` /
  `publisher_platforms`.** No card-walking, no three invariants, no
  `adCopy()`, no self-test to maintain.

#### What would NOT improve, even in the best case

- **No creative media URLs.** The API returns `ad_snapshot_url` — a link back to
  the web page. **Chrome would still be required for the video and images.** The
  API could replace the metadata half only.
- **No spend, no reach, no engagement** for commercial ads. Spend ranges are
  political-only. The §25.3 table stands unchanged.
- **~200 calls/hour** on a development-tier app, and pagination burns quota.

#### The bar the API has to beat: what four days of live running showed

The system has run daily since 2026-09-18 and **the disappearance path is no
longer theoretical — three real stop events have been recorded** (2026-09-19 ×2,
2026-09-20 ×1). Six runs, all `ok`, launchd firing 18:00 IST.

| Library ID | Started | Gone | Days | Media |
|---|---|---|---|---|
| `1028535673493135` | 11 Aug | **still running** | **41** | video, asset age 44 |
| `4654351548178711` | 18 Sep | 19 Sep | 1 | image |
| `1579327690656776` | 18 Sep | 19 Sep | 1 | image (cricket, 20 Sep event) |
| `1569934310862653` | 19 Sep | 20 Sep | 1 | image (cricket, **same copy, NEW id**) |

**TWO CORRECTIONS TO THE ORIGINAL THESIS, both found by the data rather than by
reasoning. Do not re-derive these:**

1. **Longevity is only a "what works" signal for EVERGREEN creative.** §25 said
   run-length is the proxy for what is working. The evidence refines that: the
   brand/lineup video has run 41 days, while **event-dated ads stop because the
   event happened, not because they failed.** A one-day cricket-meetup ad for a
   20 Sep event is not a loser. Sorting the panel purely by days-running will
   therefore rank event ads as failures, which is wrong. **Any future analysis
   must separate evergreen from event-dated creative before reading longevity as
   performance.**
2. **"Disappeared" can mean "edited and relaunched", not "abandoned".** The
   cricket ad reappeared on 19 Sep under a **different library ID with identical
   copy**. Some edits in Meta mint a new ad id. So a disappearance plus a
   same-copy arrival on the same or next day is one campaign continuing, not two
   decisions. The `competitor_ad_events` log holds the raw transitions; the
   interpretation layer does not yet account for this.

Neither correction is reflected in the Growth ▸ Ads card yet.

#### What to do when the answer arrives

1. **Re-run the probe first** — it is still deployed as `adlib-probe`
   (secret-gated on the same `ad_library_ingest_secret_sha256`, called with the
   keychain item `chaptera-ad-library-ingest`). Ten seconds, four calls,
   including the UK control. **Read the UK control**: UK returning commercial ads
   while India returns none confirms the geographic restriction from the owner's
   own account, which is the evidence that settles this for good.
2. **If India commercial data returns:** migrate the metadata half onto the API
   for stop-times and a historical backfill, keep Chrome for creative only, and
   revisit both thesis corrections above with the fuller history.
3. **If it does not:** delete `adlib-probe` (it is a throwaway, kept only for
   this test), record the negative result here with the date, and leave the
   running system alone. **Nothing is lost** — it has been working the whole
   time.

#### Boundaries that held, and should keep holding

The 2026-09-19 session drove the owner's Chrome to inspect the Developer
dashboard and stopped at a password re-auth wall. **Four things stay the
owner's**: entering his password, uploading government ID for identity
confirmation, accepting the Ad Library API terms of service, and generating or
handling an access token. If a token is ever issued it goes straight into
Supabase secrets — never into a chat transcript, never into this repo.

Also on the record: the Ad Library search used *in conversation*
(`ads_library_search`, Meta's advertiser-facing MCP) is **not** the same thing as
`/ads_archive` and a script cannot call it. It remains genuinely better for one
job the daily watcher cannot do — **discovery**, i.e. keyword search across all
advertisers to find competitors worth adding to the watchlist. That is how
thirdspace_by_losh, DriftedCircle and Twisty Events were found. Use it on
request; do not try to automate it.

#### Git state as of 2026-09-22

Committed locally, **NOT pushed** (golden rule): `3643837` "feat(ads): capture
competitor activity from the Ad Library" and `bd74001`. Part of 38 unpushed
commits on `main`. The Growth ▸ Ads card is in `src/AdminPanel.tsx` and is the
only piece the owner cannot see until a push happens.

---

## 26. Ledger: the signal-watchdog and spend-integrity session, 16-18 Sep

One session, three questions from the founder. Kept as a ledger of **what is
live and how it was proved**, with pointers instead of second copies — §18's own
lesson is that two status lists mean one of them is stale. Detail lives in §22
(watchdog), §23 "Monitoring and analytics" (deleted ads) and §8 (schedules).

### What was asked, and what came of it

| He asked | What was built | Where |
|---|---|---|
| "Let's build this" — a warning when Meta stops receiving our sales | `meta-signal-watchdog`: six checks (CAPI token, test mode, Purchase, Lead, ViewContent, AddToCart), verdicts in SQL, alerts to his phone | §22 |
| "Why has what Meta sees dropped to 80%? Check it thoroughly" | It had not. The number came from the wrong Meta figure, and our own test sessions. The watchdog now sets those aside | §22, "The 80% that was not real" |
| "Make it daily" (watchdog), then "make every call once a day" (free plan) | Every Meta cron daily, in a deliberate order, each with a 60 s timeout | §8 |
| "Yes build the deleted ads fix" (from the Monitoring and analytics doc) | All 12 ad statuses requested, plus an account-level spend reconciliation every sync | §23 |

### Live on production — re-verified 2026-09-19, not from memory

| What | Evidence |
|---|---|
| Watchdog running unattended, daily | Runs on 17 and 18 Sep at 03:41 UTC, six rows each. `meta-signal-watchdog` v4, `verify_jwt: false`. |
| It has checked a **real sale** | 18 Sep: Purchase 1 of 1, Lead 2 of 2, both matched to Meta's copy. Before that the money path had only ever read `too_few`. |
| Nothing has alarmed | 0 push decisions across 78 check rows, with alerts ON for all six checks. |
| Deleted/archived ads kept, spend proved complete | Newest `meta_ads_sync_log` row: `status_filter = all_statuses`, 28 days checked, 0 mismatches. **Survived other sessions taking that function from v15 to v22.** |
| Five Meta crons, all daily, all with a 60 s timeout | `cron.job`: 03:07 retry · 03:20 sync · 03:37 alerts · 03:41 watchdog · 04:50 audiences (UTC). |
| `meta_account_daily` empty | Correct: Meta has billed nothing. Emptiness here is not a fault. |

### Eight migrations applied, six files in the repo

Applied: `meta_signal_watchdog`, `meta_signal_watchdog_cron`,
`meta_signal_watchdog_cron_timeout`, `meta_signal_exclude_dev_sessions`,
`meta_signal_watchdog_daily`, `meta_spend_reconciliation`, `meta_jobs_daily`,
`meta_jobs_daily_retry_before_watchdog`. The last two of those pairs were folded
back into the cron and jobs-daily files rather than added as new ones, the same
convention §14 records. Replaying the repo gives the same end state, except that
`push_enabled` stays `false` on a fresh environment on purpose.

### Still owned by the founder

- **Push the panel work**: the "Is Meta hearing about your sales?" card and the
  "Some ad spend is missing" banner. Until then a phone alert is the only
  surface for either. §18.
- **Nothing from this session is committed.** The function, six migration files,
  `src/AdminPanel.tsx` and the edits to `CLAUDE.md` and this file are in a
  working tree shared with other sessions, so stage deliberately.

### What is still unproven, stated plainly

- **A watchdog alert reaching the phone.** Nothing has broken, and faking a
  breakage would put a false alarm on his phone. The delivery type is proven
  (§16 Phase 5); the watchdog's own call to it is not.
- **A deleted ad's spend actually being recovered.** Needs an ad that has spent.
  The reconciliation is what will answer it either way, on the first occurrence.
- **Whether Meta buckets a late-sent event by arrival or by event time.** It
  decides whether an application the daily retry delivers hours late reads as
  missing. §8 has the symptom to watch for.

### Decisions worth not re-litigating

- **Daily, not hourly or 6-hourly**, for every Meta cron. His call on cost, made
  against the measured numbers (the Meta jobs were ~1.2% of the free plan). §8.
- **No demographic budget shifting yet.** Engagement is not tickets, our cash
  cannot be split by age or gender, and the cells would hold one or two people.
  §23.
- **Never reconcile against `event_total_counts`.** It is not the hourly counts,
  and reading it produced the false 80%. §22.

## 27. The five CAPI proposals, and what live checks settled — 2026-09-21

OpenClaw's `capi-proposals` job (report:
`~/.openclaw/workspace/reports/2026-09-21-capi-proposals.md`) read the
Conversions API docs against the repo and returned **five ranked proposals, no
defects**. Its workers have no live access, so every proposal ended with an
"unknown until someone checks the account/database" caveat. This section records
what those checks actually returned, so nobody pays to re-derive it.

**All numbers below measured 2026-09-21. Read-only checks: two prod SELECTs and
two Meta dataset reads. Nothing was changed, deployed or pushed.**

### 27.1 Dataset Quality — access CONFIRMED, and it already tells us something

The proposal's blocking dependency was whether our authorization can read the
Dataset Quality API at all (the docs list `ads_read` + `ads_management` or
`business_management`, and the handoff's CAPI token does not establish those).

**It works today.** `ads_get_dataset_quality` on dataset `28370453785913523`
returned real metrics, so proposal #1 is buildable without any new permission:

| Event | EMQ | Notes |
|---|---|---|
| Purchase | **8** / 10 | `data_freshness: real_time` |
| Lead | **8** / 10 | `data_freshness: real_time` |
| InitiateCheckout, PageView, ViewContent, AddToCart, ReachedPricing | *(none)* | no `event_match_quality` block at all |

**EMQ HAS MOVED, AND WE ONLY NOTICED BY ACCIDENT — this is the case for #1.**
Three point reads now exist, and nothing recorded them automatically:

| Date | Purchase EMQ | How it was read |
|---|---|---|
| 2026-09-03 | 8.0 | Events Manager, by hand |
| 2026-09-08 | **9.3** | `ads_get_dataset_quality`, by hand |
| 2026-09-21 | **8** | `ads_get_dataset_quality`, by hand (this check) |

The per-key list changed too: on 8 Sep the below-100% field was **`fbc`** (33%
Lead / 50% Purchase) and `ln` was not listed at all; today `fbc` is absent from
the feedback and **`ln` appears at 33.3%**. So both the composite and the set of
keys Meta grades us on drift between reads.

Nobody is watching this. A 9.3 → 8 move went unrecorded for two weeks and was
found only because someone happened to run the call again. **That is precisely
the gap proposal #1 closes, and it is the strongest argument in the report** —
stronger than the report itself could make, because its workers could not read
the number twice. Note also that the memory note asserting "EMQ is 9.3/10 as of
2026-09-06" is now stale as a statement of current health.

One caveat to state once: at our volume the composite is computed over very few
events, so a single-point drop is not proof of decay — which is itself the
argument for a history rather than another one-off read.

Match-key coverage on Purchase and Lead, both **100%**: email, phone,
`ip_address`, `user_agent`, `fbp`, `external_id`, `country`, `fn`, `ct`.
The **only** field below 100% is `ln` (last name) at **33.3%** — see §27.2.

Two things worth keeping:

- **EMQ exists only for events with a server counterpart.** The five
  browser-only events returned no score. So an EMQ history card would chart
  Purchase and Lead and nothing else — not a fault, but don't build a panel that
  shows five empty rows and looks broken.
- `ads_get_dataset_details` also reports `is_active: true`,
  `first_party_cookie_enabled`, `data_use_setting:
  advertising_and_analytics`, and `gateway_status: NOT_ONBOARDED` (Conversions
  API Gateway unused — correct, we send our own). `server_last_fired_time` was
  ~26h behind `last_fired_time`, which at our volume just means no sale that
  day, not a broken sender.

### 27.2 The `ln` 33.3% is real, understood, and NOT a bug — but the code comment is stale

`splitName()` in `supabase/functions/_shared/metaCapi.ts:174` deliberately sends
no `ln` for a single-word name, because Meta scores an empty field as
supplied-but-unmatched. Meta's 33.3% is therefore measuring our customers'
typing, not our code.

Confirmed independently against our own rows — and the two agree closely, which
is a nice end-to-end check that the `user_data` pipeline sends what we think:

| Scope | n | has a second name part |
|---|---|---|
| All applications with a name | 310 | 29.0% |
| Paid only (`advance_paid`/`fully_paid`) | 125 | **34.4%** |
| Paid, last 60 days | 72 | 31.9% |

Meta's measured `ln` coverage 33.3% ≈ our 34.4% on paid rows. **The comment on
`metaCapi.ts:173` claims "45% of our bookings carry a second name part" — that
is stale; the real figure is ~34% of paid bookings, ~29% of all.** The comment
is wrong about a measured number, which is the kind of thing that later gets
quoted as fact. Fixing it is a one-line comment edit, owner's call.

The only way to move `ln` is to ask for first and last name as two fields at
booking, which trades a small EMQ gain against a longer form on a mobile
checkout. Not proposed.

### 27.3 Parameter Builder / IPv6 — no live evidence of anything to gain

The proposal rests on the docs' "IPV6 is preferable over IPV4 for IPV6-enabled
users". Measured, over every `payu_payments` row that has an IP:

- **0 of 37 stored `client_ip` values are IPv6. All 37 are IPv4** (samples are
  Jio/Airtel mobile ranges, `152.57.x.x`, `122.183.x.x`).

So the header our edge actually receives is IPv4, always. A browser-side helper
could in principle discover an IPv6 address the server never sees — but only via
its optional `getIpFn`, i.e. **an external address-lookup service**, with the
cost and privacy trade-off that implies. Meanwhile `ip_address` coverage is
already **100%** at EMQ 8 (§27.1), so there is no measured deficit to close.
**Weakest of the five on current evidence. Deno compatibility never even had to
be settled.**

### 27.4 `client_ip` NULL on 80% of payment rows — checked, NOT a defect

The IPv6 query surfaced `client_ip` null on 152 of 189 `payu_payments` rows,
which looks alarming. It is purely historical — the columns were added
mid-August:

| Month | payments | with_ip | with_ua | with_fbp | with_fbc |
|---|---|---|---|---|---|
| 2026-06 | 54 | 0 | 0 | 0 | 0 |
| 2026-07 | 36 | 0 | 0 | 0 | 0 |
| 2026-08 | 87 | 25 | 25 | 16 | 3 |
| 2026-09 | 12 | **12** | **12** | **12** | 3 |

September is **12/12** on IP, user-agent and `fbp`. Capture is healthy.
Low `fbc` is expected and not a fault: `fbc` only exists when someone arrived by
clicking an ad, and we are barely running ads. **Recorded so the next person who
runs that query doesn't re-open it as a bug.**

### 27.5 Business Messaging / `ctwa_clid` — untestable, for the right reason

The proposal hoped our raw referral JSON already retains the click-to-WhatsApp
ad id. Measured on `whatsapp_inbound` (20 rows):

- **0 rows with a non-null `referral`**, and **0 rows whose `raw` contains
  "ctwa"** anywhere.

The `referral jsonb` column exists (`20260901_whatsapp_inbound.sql:24`) and
`api/_wamafy.js:141` forwards `d?.referral`. **This does not show the provider
drops the id — it shows we have never run a Click-to-WhatsApp ad, so there has
never been a referral to store.** Absence of the cause, not evidence of a
failure.

**DECIDED 2026-09-21: the owner declined this, asked directly — he does not want
ad-started WhatsApp conversations measured.** So the open question is moot and
should not be reopened; recorded as a row in §12. The existing capture stays as
it is (it costs nothing and needs no work), which means if a click-to-WhatsApp
ad is ever run, `ctwa_clid` lands in `referral` on its own.

### 27.6 Where the other two stand

- **Revenue Optimization (#4)** — the report itself calls it a clarity
  extension, not missing plumbing: value and INR already agree browser/server
  and the ad goal is already displayed (`AdminPanel.tsx` goal label). Nothing to
  verify live; it is purely "would this comparison help you".
- **Append Attribution (#5)** — still blocked on limited-beta access, and on the
  one thing the code genuinely cannot supply: **actual ad-click time.**
  `src/attribution.ts` stores `landed_at`, which is site-arrival time, and
  `buildFbc()` at `metaCapi.ts:189` already uses it as the `fbc` timestamp.
  Confirmed present, confirmed *not* the same thing. Do not relabel it.

### 27.7 Verified citations, and one correction to how the report reads

Every `file:line` the report cited was checked in the **real** folder (it read
`~/OpenClaw-Workspace/chapter-copy`). All substantive claims hold; line numbers
drift by a few. Specifically confirmed present: `_fbp` cookie handling
(`src/metaPixel.ts`), IP + UA forwarding (`metaCapi.ts:316-317`), per-payment
IP/UA/fbp/fbc persistence (`create-payu-order/index.ts:734`), attribution
capture with unsubstituted-macro rejection (`src/attribution.ts`), and the
watchdog's `debug_token` + `/stats` reads (`meta-signal-watchdog/index.ts`).

**Conversion Leads stays demoted** — Instant-Forms-only per the docs, and the
owner declined lead ads on 18 September (§ recorded at `META-ADS-HANDOFF.md`
line ~4348). Not reopened here.

### 27.8 Net read

Of five proposals, live checks **promoted one and demoted one**:

- **#1 Dataset Quality is stronger than the report could claim** — access is
  proven, metrics are real, and the very first read already produced a usable
  number (`ln` 33.3%) plus a stale-comment correction. It is the only one of the
  five with zero unresolved dependencies.
- **#2 Parameter Builder is weaker than ranked** — zero IPv6 in the wild, IP
  coverage already 100%, and any upside needs a paid third-party IP service.
- **#3 Messaging — DECLINED by the owner 2026-09-21.** Closed, not deferred; §12.
- **#4/#5** unchanged: a clarity nicety, and a beta-gated model needing click
  time we do not have.

**Decisions taken on this report, 2026-09-21:** #1 accepted and written up as a
to-do (§13 item 2); the stale 45% name comment corrected in
`_shared/metaCapi.ts` (comment only — **no behaviour change, so no redeploy is
owed**, despite the `_shared/` bundling rule in §9); #3 declined; #2 left
unranked-down but not pursued; #5 explained to the owner and not pursued.

Nothing here was implemented. Per the golden rule, implementation of any
proposal is a separate owner decision.
