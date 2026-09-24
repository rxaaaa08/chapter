# META-AUDIT-CONTEXT.md — what an auditor cannot learn from the code

**Read this before auditing anything Meta-related. It is short on purpose.**

A read-only auditor sees code and documentation. It cannot see the database, the
live traffic, or the decisions behind the code — so it reliably reports things
that are true of the code and false in practice. This file supplies exactly those
missing facts.

**How to use it — important.** This is NOT a list of things you may not look at.
Audit the code normally. But if your finding matches something already settled
below, report it as **`CONFIRMS-KNOWN: <id>`** on one line and move on — do not
re-argue it and do not spend a verifier turn on it. If you find something
**different** in the same code, report it in full as a normal finding. When a
settled entry and the code disagree, that is a real finding: say so.

**Which sections apply to your job.** §1 and §3 are **Conversions API** scope.
§4, §5 and §6 are **Marketing API** scope (reading ads, insights, audiences,
webhooks, catalog feed). §2 is production fact and applies to everything. An
auditor should be given §2 plus the set matching its job, not all of it — so a
Conversions API job gets §1–§3, and a Marketing API job gets §2 plus §4–§6.

Last updated 2026-09-21.

---

## 1. Settled findings — decided, not open

| id | What | Decision |
|---|---|---|
| `S1` | `client_user_agent` is assigned conditionally (`_shared/metaCapi.ts`) while Meta calls it required for website events | **Measured 2026-09-21, not a live problem.** Capture went live 21 Aug (payments) and 27 Aug (leads). Coverage: Jun 0%, Jul 0%, Aug 29%, **Sep 12/12 and 12/12**; since 20 Aug only 1 of 38 payments lacks one. The `if` is a deliberate safety net — a fabricated or PayU-derived user agent asserts the wrong person and is worse than omitting the field. **Do not propose removing the conditional.** |
| `S2` | Name normalisation strips accents (`Valéry` → `valery`), where Meta's example keeps `valéry` | **Owner's decision 2026-09-21: accepted deviation.** India-only business; Roman-script Indian names essentially never carry combining accents. **`src/metaPixel.ts` normalises identically**, so browser and server agree with each other — changing only one side would break the 1:1 match that EMQ 8.0 depends on. Either both change together or neither does, and neither is worth it. |
| `S3` | Phone normalisation takes the last 10 digits and prefixes `91`, assuming India | **Owner confirmed 2026-09-21: the business is India-only.** Correct behaviour, not a defect. |

---

## 2. Production facts the code does not state

- **India-only business.** Every customer, every phone number, every event.
- **Volume is small:** roughly 6–12 ticket purchases a month at present. A finding
  that only bites at high volume should say so rather than being ranked urgent.
- **Phones are stored as bare last-10-digits** (see `CLAUDE.md`), which is why the
  `91` prefix is added at send time rather than being stored.
- **Three paths report a Purchase**, and only one has a live browser:
  `payu-callback` (customer returns to the site — live headers), `payu-webhook`
  and `verify-pending-payments` (customer never came back — stored values only).
  Any finding about live request headers must say which path it applies to.
- **The Meta database layer is already live in production**; the admin panel is
  not pushed. "Not in the pushed site" does not mean "not built".

---

## 3. Deliberate choices that look like bugs

Do not report these as defects. Report only a *new* problem with them.

| What | Why it is deliberate |
|---|---|
| Meta is sent the **full ticket value at the advance payment**, not the amount collected | Owner's decision: the ad's job ends at the booking. Never re-propose. |
| `fbc` and `fbp` are sent **raw, never hashed** | Meta requires these two unhashed; hashing them breaks matching. |
| `country` is always hashed `'in'` | India-only, see §2. |
| A single-word name sends `fn` only, **never a blank `ln`** | Meta scores an empty field as supplied-but-unmatched, which is worse than absent. |
| `event_time` comes from PayU's `addedon`, **not** `now()` | These paths can fire hours late; `now()` would mis-time the event. |
| Balance payments and test phones (`90000000xx`) are **skipped** | A balance payment is not a second sale; test rows are not sales at all. |
| Open events accrue **no** marketer or manager commission | Owner's decision, enforced by a trigger guard. |

---

## 4. Marketing API — settled findings, decided not open

Each was evaluated against the endpoint spec and the live account on the date
given, and written up at length in `META-ADS-HANDOFF.md` §12. Report a match as
`CONFIRMS-KNOWN: <id>`.

| id | What | Decision |
|---|---|---|
| `M1` | Threshold rules / the `subscriptions` webhook field | **Not available, 2026-09-08, two independent reasons.** The `ad_account` topic offers our app seven fields and `subscriptions` is not among them; and creating one needs `ads_management` + write, where our token is `ads_read`. **Do not re-check by reading Meta's docs** — they describe it as though everyone has it. Check `devtools_webhook_list` `list_topics`. |
| `M2` | `tracking_specs` / `conversion_specs` on ads | **Unusable and mostly unnecessary, 2026-09-08.** Setting `tracking_specs` is a write; `conversion_specs` has been **read-only since v2.4** and is derived from the ad set's `optimization_goal`; and a pixel named in `promoted_object` is tracked automatically. The real lever is `optimization_goal`, which is already stored. |
| `M3` | `/reachestimate` audience sizing | **Low value, 2026-09-09.** The live ad set runs `targeting_optimization: expansion_all` with `advantage_audience: 1`, so the stated targeting is not the audience Meta will use — estimating the stated spec measures the wrong thing. Ads Manager shows it at creation time anyway. Capture `targeting` itself, not the estimate. |
| `M4` | Ad Studies — split tests **and** lift studies | **Blocked three ways, 2026-09-09, and the third survives any budget.** Lift is hard-ineligible (Meta wants ≥ $5,000 spend **and** ≥ 500 optimised conversions in 90 days); creation needs `ads_management`; and at 402 landing sessions/week a Purchase-level test needs **203 weeks**. Meta still reports a winner and a confidence number, so such a test returns a confident coin flip. Site experiments were built instead (§17). |
| `M5` | Marketing mix modeling (`breakdowns=mmm`) | **Strictly coarser than what we have, 2026-09-08.** Ad-**set** level only, while our entire join is ad-level (`utm_content={{ad.id}}`); returns only impressions and spend, with spend documented as **estimated**. Backfillable, so nothing is lost by skipping it. |
| `M6` | Block lists, publisher and content | **Need App Review, 2026-09-09**, which this account needs for nothing else. Their limits (2M posts per list, 200 lists per third party) show they are brand-safety-vendor tooling. A single advertiser gets both outcomes free in Ads Manager via placements + content suitability. |
| `M7` | Batch / async request APIs | Exist to **create and update** ads at volume. We do neither. |
| `M8` | ETags / `If-None-Match` on the sync | **Rejected 2026-09-07.** Meta's own doc says a 304 still counts against rate limits, so the saving is bandwidth, which was never the constraint — and acting on a 304 means skipping processing, turning a wrong assumption into stale data that looks healthy. |
| `M9` | Any write to Meta's ad objects | The token is `ads_read`. Not possible **and not wanted** — see §6. |
| `M10` | Widening the token to `ads_management` | **Turned out unnecessary**: audience writes succeed on `ads_read` because the system user holds asset-level Full access on the ad account. Do not widen it without a reason. |
| `M11` | Auto-applying Meta's recommendations | The API makes it easy and it is the one automation to argue against. The point of measuring our own CPA is to decide for ourselves. Meta's own example actions raise budgets and broaden targeting to US/CA/GB. |
| `M12` | Lead Ads / Instant Forms, incl. Conversion Leads | **Owner declined 2026-09-18:** "I don't think we need lead ads as of now." |
| `M13` | Click-to-WhatsApp conversion reporting | **Owner declined 2026-09-21**, asked directly. The `referral` capture stays because it costs nothing. |

**Known gap, NOT settled — do not report it as a defect, but do not call it done
either:** there is no campaign/ad-set **rollup** view (the panel is ad-level) and
no panel surface for past alerts or past guardrail breaches. Both are recorded as
to-dos in `META-ADS-HANDOFF.md` §13.

---

## 5. Marketing API — production facts the code does not state

- **The token is a system-user token scoped `ads_read`**, with asset-level Full
  access on ad account `act_1580469137074269`. Every "you could POST this"
  finding is therefore out of scope by design, not by oversight (`M9`).
- **There is NO shared module on the ads side.** Unlike the CAPI code, each
  function pins its own `API_VERSION` — **six places** as of 2026-09-16, all
  reading `v26.0`. Re-derive with
  `grep -rn "API_VERSION = " supabase/functions/`; the written list has been
  wrong four times.
- **`meta-insights-features` deliberately uses a different host and auth**:
  `https://ads-api.facebook.com/<version>/marketing-api` with
  `Authorization: Bearer`, where everything else uses `graph.facebook.com` with
  `?access_token=`. Both are documented that way. Not a bug — see the comment
  block at the top of that file.
- **Every Meta cron runs once a day**, by the owner's cost decision (retry 08:37
  → sync 08:50 → alerts 09:07 → watchdog 09:11 → audiences 10:20 IST). Do not
  propose a faster cadence.
- **The database layer is live; the admin panel (Growth ▸ Ads) is NOT pushed.**
  "Not in the pushed site" does not mean "not built".
- **No ad has actually spent yet, and no real creative has been graded.** A
  finding that only appears once spend exists should say so rather than being
  ranked urgent.
- **Three Meta Insights features were irreversibly enabled on 2026-09-09.** They
  cannot be turned off.

---

## 6. Marketing API — deliberate choices that look like bugs

| What | Why it is deliberate |
|---|---|
| The whole ads integration is **read-only** | The token is `ads_read` and writes are unwanted (`M9`, `M11`). A "you could automate this" finding is a non-finding. |
| `meta-ads-sync` keeps **archived and deleted** ads (all 12 statuses) | Deleted ads still spent real money. Dropping them under-reports spend — that was a real bug, fixed 2026-09-17. |
| Each sync re-reconciles **account-level** spend | It proves on every run whether anything is missing, whether or not the status filter works. |
| We run **our own** circuit breaker on real spend ÷ real tickets | Meta's rules engine was evaluated and is unusable here (`M1`). |
| `meta-ads-alerts` answers **401** to a bare request | It requires `X-Meta-Alerts-Secret` (and `send-admin-push` requires its own header). The platform `verify_jwt` stays false because pg_cron sends no JWT, so the gate lives in the function body. **A 401 is the system working.** It spends real Meta quota per call, so never "simplify" the gate away. |
| `meta-catalog-feed` is reachable **unauthenticated** | Meta fetches it that way. Deliberate. |
| The guardrail CPA alarm is **40% of ticket price**, not margin | Owner's definition: ad money per ticket = money at booking − cost. |
| `adlib-probe` failing must **never** mark competitor ads as disappeared | A failed read is not evidence of absence. |

---

## 7. Keeping this file true

Whoever settles a finding adds it here in the same session, with the date and the
measurement behind it. An entry with no evidence is worse than no entry, because
it silences a check without justifying it. If a settled entry is ever reopened,
say so here rather than deleting it — a future auditor needs to know it was
considered.
