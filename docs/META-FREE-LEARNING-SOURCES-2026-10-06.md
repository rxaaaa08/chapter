# Free sources for learning Meta ads — research, 2026-10-06

**Asked by the owner:** "research the internet on what sources can we use to learn
& perfect our meta ads strategy at free of cost."

**Scope assumed:** chapter அ (asked from this repo). A short Wamafy note is in §7.

**Status:** research only. Nothing built, nothing changed, nothing subscribed to.

---

## 1. The one-paragraph answer

We are already saturated on one kind of source: practitioner opinion on YouTube
(91 lessons from 48 channels in `~/Downloads/meta yt lessons/`), plus Meta's
developer docs (logged in `META-ADS-HANDOFF.md` §23). More YouTube adds little.
The free sources worth adding are the three kinds we have almost none of:

1. **Meta's own primary sources on how the delivery system works** — the thing
   the YouTubers are paraphrasing.
2. **Measured data from many accounts** — experiments and benchmarks, not opinion.
3. **A change tracker** — one place that says what Meta changed this week.

Event-ticket-specific written sources were checked and are thin (§5). The eight
event lessons already in the lessons folder are better than anything found.

---

## 2. The shortlist — seven worth adding

| # | Source | What it is | Why it fills a gap | Cost / gate |
|---|---|---|---|---|
| 1 | **Engineering at Meta blog** (engineering.fb.com) | Meta's engineers describing the ad system | Primary source. Five posts matter, listed in §3 | Free, no signup |
| 2 | **Meta Help Center, through the Meta Ads connector already plugged into Claude** | Official how-it-works articles, searchable from a chat | Tested 2026-10-06: one question returned the three official articles on the learning phase. No browsing needed | Free, already connected |
| 3 | **Jon Loomer** (jonloomer.com) | Independent Meta-ads writer. Blog about twice a week, two free mini-courses (Andromeda; modern targeting), a Monday tips email, a weekly digest, a 5–10 minute podcast | Best single "what changed and what it means" source. Not among our 48 channels | Free; email signup for the courses and emails |
| 4 | **Haus — "The Meta Report" and blog** (haus.io) | Results of 640 real holdout experiments on Meta | Evidence on what Meta ads truly add, versus what Ads Manager claims. Our whole system is built on that distinction | Free; report is email-gated, blog is open |
| 5 | **Motion — Creative Benchmarks 2026 + Thumbstop newsletter** (motionapp.com) | Study of 550,000+ ads from 6,000+ advertisers, about $1.3B of spend, Sep 2025 – Jan 2026. Newsletter every Sunday | Creative is the main lever now (consensus #1 in our synthesis). This is data on it, not opinion | Free, report ungated; newsletter by email |
| 6 | **Common Thread Collective — "Every Meta Ads Change in 2026"** (commonthreadco.com) | One page, updated weekly, listing each Meta ads change | The change tracker. One page instead of ten feeds | Free |
| 7 | **"Close Enough?" — Gordon, Moakler, Zettelmeyer** (arXiv 2201.07055; Marketing Science 2023) | Academic study of 663 Facebook experiments | The strongest free evidence that attributed numbers can be far from true lift | Free PDF |

Numbers those sources report (as read on 2026-10-06, not re-derived by us):

- **Haus:** Meta drove about 19% average lift on a brand's main number; optimising
  to Meta's "incremental attribution" setting returned about 1.26× the standard
  setting across tests as of July 2026 (1.38× for online-only brands, 1.02× for
  brands that also sell in shops).
- **Motion:** only about 5% of ads reach 10× their account's median spend.
  Advertisers who launch more ads find proportionally more winners.
- **"Close Enough?":** modelled estimates missed true lift by a median of 115%,
  107% and 62% for top, middle and bottom-of-funnel outcomes.

---

## 3. Engineering at Meta — the five posts

| Date | Post | What it covers |
|---|---|---|
| 2024-12-02 | Meta Andromeda | The retrieval step: cutting tens of millions of ads to a few thousand candidates |
| 2025-11-10 | Generative Ads Model (GEM) | The large model that teaches the ranking models |
| 2026-03-31 | Adaptive Ranking Model | How the ranking step serves very large models |
| 2026-07-15 | Hierarchical Interest Representation for deep-funnel optimisation | How the system copes when purchases are rare |
| 2026-08-05 | From User Sequences to Scaling Laws | The multi-stage ranking design |

**The 2026-07-15 post is the one closest to our sparse-purchase constraint.**
Full text read on 2026-10-08; the earlier automated summary is superseded by
§10 below. The roughly 6 purchases/week cited earlier was historical site-wide
volume, not this campaign's results or a forecast. Compare ad-driven volume
separately (handoff §29.4).

---

## 4. Useful, but second tier

| Source | Use it for | Caveat |
|---|---|---|
| **Triple Whale benchmarks** (free, ungated; 40,000+ brands, Aug 2025 – Jul 2026) | Direction of the market: median CPM $15.06 (+13% on the year), CPA $38.99, CTR 2.39%, ROAS 1.88 | Online shops, mostly US. No events cut, no India cut. Trend only |
| **Superads benchmark explorer** (superads.ai, free) | The only free tool found with an India filter | Shows an odd spike in India CPM in mid-2026; unverified |
| **Meta Ads connector — industry benchmark, opportunity score, Ad Library search** | Comparing our own ad sets with similar advertisers, from a chat | Tool definitions seen, **not run**. The benchmark needs ads running to say anything |
| **Scalability School** and **Marketing Operators** podcasts | Weekly operator talk; both are on YouTube, so the `yt-lesson` skill can turn episodes into lessons | Online-shop brands, not events |
| **Mobile Dev Memo** (Eric Seufert) | Deep analysis of Meta's ad business; the podcast is free and includes an interview with a Meta VP on the AI ad system | Many articles are paid |
| **ppc.land** | Daily ad-industry news with an RSS feed | News, not strategy |
| **Meta Blueprint** | 90+ free short courses, including "Performance 5", Meta's official five-point checklist | Teaches the setup Meta prefers. Only the exams cost money ($99–150) and we do not need them |
| **Meta Robyn and GeoLift** (open source) | Measuring true ad effect by modelling, or by switching ads off in some regions | Need a history of spend. The daily spend and sales they need are already being recorded, so nothing is lost by waiting |
| **People to follow** — Barry Hott (creative), Taylor Holiday, Cody Plofker, David Herrmann | Early sight of changes | Not individually verified. Bram Van der Hallen WAS verified on 2026-10-08 and is now source 8 — see §9 |
| **Free communities** — Online Geniuses, Demand Curve (Slack) | Asking questions | Found by search only; not joined or checked |

---

## 5. Checked and not worth the time (negative results)

- **Event-ticket guides in writing.** Hive's "Meta Ads in 2026: 6 shifts event
  marketers can't ignore" (2026-05-12) has no numbers and lists what we have
  already built (pixel plus Conversions API, signals, vertical video, a fast
  page). Ticket Fairy's guide is free and specific (80/20 prospecting-to-
  retargeting at launch moving to 30/70 in the last week; about half of tickets
  sell in the last month) but it is the vendor's own advertorial with loosely
  cited figures. It still repeats the "under 20% text on the image" rule, which
  Meta dropped years ago — a sign of how carefully it is kept.
- **A free benchmark for event tickets in India.** None exists. One Indian
  agency blog quotes ₹50–130 CPM for "wedding / events"; that is one agency's
  word. Our own numbers will be the benchmark.
- **Meta Marketing Pro calls** (Meta's free one-to-one calls). Agency reviews
  describe them as scripted and sales-led. Treat as a sales call.
- **Meta Growth Academy India** (free, in person, with India SME Forum). For
  first-time advertisers, in 14 cities; **Chennai is not one of them**.
- **Hindi full courses on YouTube** (WsCube Tech and similar). Beginner level.
- **Foxwell Founders.** Highly rated, but paid. Their free newsletter exists;
  not checked.
- **Reddit (r/FacebookAds, r/PPC).** Could not be read at all — see §6.

---

## 6. How this was done, and traps hit

- Tools: agent-reach's Exa search, then Claude's built-in web search and page
  fetch, plus one call to the Meta Ads connector.
- **Exa's free tier refused after one burst of eight parallel searches** (HTTP
  429). Run Exa searches one at a time, or expect to fall back.
- **Reddit was unreachable both ways:** the OpenCLI Chrome extension was not
  connected, and the built-in search is blocked from reddit.com.
- **A third route was found on 2026-10-07 and run on 2026-10-08:** Claude in
  Chrome, connected to the owner's own Chrome ("Browser 1"). Results are in §9 —
  it reads LinkedIn, but NOT Reddit or X. The connector directory has no Reddit
  connector; it has an Exa one,
  which adds nothing the built-in search did not cover. The unauthorised
  marketing connectors (Ahrefs, Similarweb, HubSpot, Klaviyo, Supermetrics) are
  paid products about other jobs and would not have changed any finding here.
- **jonloomer.com and triplewhale.com return 403 to the built-in fetcher** but
  read fine through `https://r.jina.ai/<url>`.
- Most page contents were read through an automated summariser. Figures above
  are as those summaries or search snippets gave them. Open the source before
  relying on any single number. Exception: the July 15 Engineering post was
  read in full on 2026-10-08 through Jina Reader and the direct web reader (§10).

---

## 7. Wamafy note

Sources 1–7 are about how Meta's system works and how to measure it, so they
apply to Wamafy unchanged. What differs is the missing piece: for business-
software lead generation and click-to-WhatsApp ads, nearly everything free is
written by WhatsApp vendors selling their own tool. No independent, data-backed
free source was found. A proper search for that should be its own job, run from
`~/Downloads/Wamafy`.

---

## 8. Links

- Engineering at Meta: https://engineering.fb.com/2024/12/02/production-engineering/meta-andromeda-advantage-automation-next-gen-personalized-ads-retrieval-engine/
- https://engineering.fb.com/2025/11/10/ml-applications/metas-generative-ads-model-gem-the-central-brain-accelerating-ads-recommendation-ai-innovation/
- https://engineering.fb.com/2026/03/31/ml-applications/meta-adaptive-ranking-model-bending-the-inference-scaling-curve-to-serve-llm-scale-models-for-ads/
- https://engineering.fb.com/2026/07/15/ai-research/exploring-hierarchical-interest-representation-for-meta-ads-deep-funnel-optimization/
- https://engineering.fb.com/2026/08/05/ml-applications/from-user-sequences-to-scaling-laws-a-multi-stage-architecture-for-metas-ads-ranking/
- Help Center articles returned by the connector: https://www.facebook.com/business/help/269269737396981 (learning limited), https://www.facebook.com/business/help/910877842876429, https://www.facebook.com/business/help/296463804090290
- Jon Loomer: https://www.jonloomer.com/free-resources/
- Haus: https://www.haus.io/resources/the-meta-report · https://www.haus.io/blog-tags/meta
- Motion: https://motionapp.com/thumbstop-pulse/creative-benchmarks-2026/ · https://motionapp.com/thumbstop/
- Common Thread Collective: https://commonthreadco.com/blogs/coachs-corner/meta-ads-changes-2026
- "Close Enough?": https://arxiv.org/abs/2201.07055
- Triple Whale: https://www.triplewhale.com/blog/facebook-ads-benchmarks
- Superads India CPM: https://www.superads.ai/facebook-ads-costs/cpm-cost-per-mille/india
- Performance 5 (Blueprint): https://www.facebookblueprint.com/student/path/253157-performance-5
- Robyn: https://github.com/facebookexperimental/Robyn · GeoLift: https://github.com/facebookincubator/GeoLift
- Scalability School: https://www.scalabilityschool.com/ · Pubcast: https://pubcast.jonloomer.com/
- Mobile Dev Memo podcast: https://mobiledevmemo.com/category/original-content/podcast/
- ppc.land: https://ppc.land/
- Hive: https://resources.hive.co/articles/meta-ads-in-2026-6-shifts-event-marketers-cant-ignore
- Ticket Fairy: https://www.ticketfairy.com/blog/mastering-facebook-instagram-ads-for-event-promotion-in-2026-advanced-targeting-strategies-for-maximum-roi
- Meta Growth Academy India: https://indiasmeforum.org/meta-growth-academy/
- Meta Marketing Pro review: https://weareyatter.com/meta-marketing-pros-should-you-take-their-calls/

---

## 9. Second pass through the owner's Chrome — 2026-10-08

Run with the owner's OK ("yes go ahead"), read-only, one tab, closed afterwards.

| Site | Result |
|---|---|
| **Reddit** | **Blocked.** Claude's Chrome extension refuses reddit.com ("not allowed due to safety restrictions"). With the built-in search also blocked, Claude has no route of its own to Reddit. The only route left is the OpenCLI extension in agent-reach, which the owner would have to switch on himself |
| **X** | **Not signed in.** This Chrome is logged out of X, so search bounced to the login page. Claude cannot sign in. Works only if the owner signs in to X in Chrome first |
| **LinkedIn** | **Works** (signed in). Following one named person is valuable; keyword search is not |

### LinkedIn: what works and what does not

- **Works — Bram Van der Hallen's activity feed** (112,940 followers; several
  posts a week, each one a Meta Ads Manager change he has spotted, with a
  screenshot). **This moves him from "second tier, unverified" to the shortlist
  as source 8: the fastest free change tracker found.** He also runs a LinkedIn
  newsletter. Free; following needs a LinkedIn account.
- **Does not work — keyword search.** "meta ads" + ticket sales + events
  returned agency self-promotion and a ticketing vendor's advert. "meta ads" +
  India + D2C returned hiring posts. Third confirmation that event-ticket and
  India-specific sources are thin.

### What his feed showed (read 2026-10-08; his observations, phased rollouts)

Only the first item was cross-checked. The rest are one practitioner's reports
from accounts he can see; a change may not be in our account yet.

1. **Excluding placements on an ad set is being removed.** Cross-checked:
   several trade write-ups date the Ads Manager notice to about 19–20 August
   2026 ("Excluding placements, platforms, devices and operating systems will no
   longer be available for your ad sets"), rolling out in phases, Sales and
   Leads campaigns first, no end date given. What is reported to remain:
   - account-level exclusions, currently only Audience Network, Facebook
     Marketplace and Facebook right column;
   - "value rules", which can bid a placement down by at most 90% (Meta's Help
     Center confirms the 90% floor and a 1000% ceiling) — reduced, never off;
   - choosing placements per creative at the ad level, where every placement
     must still be covered by some creative.
   **This touches `FOUNDERS-MEET-ADS-PLAN.md` §6**, which unticks Facebook,
   Messenger and Threads on the ad set to run Instagram only. A dated note was
   added there. **Not checked:** whether our account has the change, whether the
   API still accepts ad-set exclusions, and what our placement watch will then
   report.
2. **"Related media" trap** (about 2 Oct): in the new upload screen, a newly
   uploaded image is offered to all active ads by default. Left ticked, it edits
   every ad.
3. **Creative enhancements are now off by default on new ads** (about early
   Sep), and enabled ones show a green dot. Our enhancements guard still stands.
4. **Meta can now add and manage website events by itself, using AI** (about
   early Sep; a setting in Events Manager). Our pixel was deliberately locked
   down, so this setting is worth reading. Not checked in our account.
5. **Activity History has an "Outcome" column** — cost per result for the 7 days
   before and after each change.
6. **The ad's landing page is being added as the first comment on the ad**
   (about mid Sep).
7. **"In-market categories" targeting is in test until 2026-11-02**, where an
   account has it.
8. **Brand lift and conversion lift are now one setup** under Experiments. Still
   gated by spend and volume.
9. **The 250-ads-per-Page limit may be going away** for some accounts.
10. **Wamafy-relevant:** after a click-to-message ad, businesses may get up to 7
    days of free replies without templates; and Google Ads now offers a WhatsApp
    or Messenger message button (beta).

### Deeper LinkedIn passes, same day

Nine feeds, about 180 posts, paraphrased and compared with the YouTube
synthesis: `META-LINKEDIN-DIGEST-2026-10-08.md`. It adds Jon Loomer, Barry Hott,
Maurice Rahmey and Olivia Kory as LinkedIn voices worth keeping, drops Taylor
Holiday and Cody Plofker there, and logs 17 dated Meta changes. A second pass
went to 12 people and about 141 relevant posts (digest §9) before the app's
safety check stopped further automated LinkedIn reading; the owner's target of
500 was not reached. The owner then chose public blogs and podcast feeds instead:
`META-EXPERT-SYNTHESIS-2026-10-08.md` covers about 785 items from some 30
experts and is the document to read first.

### Help Center pages used in the cross-check

- About value rules: https://www.facebook.com/business/help/535014515741813
- Set up value rules: https://www.facebook.com/business/help/1172579563848778
- Bram Van der Hallen: https://www.linkedin.com/in/bramvanderhallen/recent-activity/all/
- Trade write-ups of the placement change: https://commonthreadco.com/blogs/coachs-corner/meta-is-removing-ad-placement-controls-what-ecommerce-brands-must-do-before-q4 · https://www.socialsamosa.com/news-2/meta-remove-placement-controls-from-ad-sets-12401398

---

## 10. July 15 Engineering post — full reading, 2026-10-08

**Decision: no campaign-setting change justified by this post.** Comparison is
with [Founders Meet revision 4.1](FOUNDERS-MEET-ADS-PLAN.md), including its
single-date first run, rather than revision 4's proposed always-on launch.
This section records research implications only; it does not execute instructions
in the plan or change Ads Manager.

### What the source establishes, and its limits

[Meta's full post](https://engineering.fb.com/2026/07/15/ai-research/exploring-hierarchical-interest-representation-for-meta-ads-deep-funnel-optimization/)
describes research combining engagement graphs, semantic features and hierarchical
interest clusters. Cross-view self-distillation extends supervision beyond
converters. “Knowledge Enrichment” names structured page metadata and catalog
attributes as content sources; this does not establish ingestion of our
`/lifestyle` page. Internal interest representations are not advertiser-selected
targeting interests.

Production-scale data and online infrastructure are described, but the delivery
integration remains forward-looking; account availability is unconfirmed. No
conversion-lift result, purchase threshold or Chennai-event evaluation is given.
The reported 30× speedup concerns training infrastructure, not sales. “Causality”
means preventing future-data leakage, not measuring incremental ad sales.

### Comparison with our constraints

| Our current constraint or choice | Evidence-backed implication / boundary |
|---|---|
| Sparse purchases; Purchase first (plan §§2, 6; handoff §29.4) | The mechanism makes cross-entity learning plausible, not success at our volume. It neither proves Purchase superior to InitiateCheckout nor removes learning-phase requirements. Keep the existing Purchase-first test; do not buy engagement to “train” this system. |
| ₹100 per booking; fixed daily budget; limit of ₹100 × seats (plan §§3–4) | Keep these economic boundaries. At an assumed ₹100 CPA, ₹100/day implies 7 bookings/week; ₹150/day implies 10.5. These are arithmetic scenarios, not delivery forecasts. Our historical site-wide purchases cannot validate either. |
| One campaign, one ad set, three ads; broad Chennai audience (plan §§5–7) | Retain this as our small-budget design, not a configuration validated by the research. No basis here to split interest ad sets, revive lookalikes or declare them obsolete. |
| Date-less creative → `/lifestyle`; ₹250 online + ₹200 at venue (plan §§7–8) | **Cautious inference:** accurate, consistent descriptions remain sensible. Use the existing prelaunch checks: who the meet serves, Chennai/area, the payment split, and a readily discoverable date on the site. Do not claim that copy edits will improve this model, add keyword stuffing, or rebuild the retired catalog merely for it. |
| Pixel/CAPI and signal watchdog retained (plan §12) | Keep the existing measurement safeguards. There is no demonstrated Founders Meet benefit here from adding events or changing the Purchase value convention. |
| Instagram only; no same-plan repeat bookings; unknown cross-plan lifetime value (plan §§1–3, 6) | Keep these constraints and the separate placement-availability check in §9. This research is not a reason to widen placements, reopen repeat booking, or fund acquisition from assumed future visits. |

### Strategy consequence for the first run

Keep the one-date, fixed-daily-budget test and change one thing at a time.
Evaluate whole-run spend per tagged paid booking, seats filled, lead time and
venue balances/no-shows as already planned (§§10–11). Treat uneven delivery
among three ads as allocation, not a controlled creative comparison. A better
prediction model would not make our small sample larger.

**Measurement clarification:** pausing organic reels does not establish that
every booking was caused by ads. Tagged bookings support attribution; incremental
sales remain unknown without a suitable counterfactual. Keep that distinction
when interpreting the plan's “ad sales” and return figures.

The useful change is to the rationale: sparse conversions do not mean Meta has
only our own purchase history to learn from, but this paper supplies no evidence
that our ₹100 booking target will be achievable. Any later change of optimisation
event should remain a deliberate review of our funnel and economics, not a
conclusion drawn from this architecture post.

---

## 10. Fifty more sources — 2026-10-08

**Asked by the owner:** "get 50 more other resources."

All 50 are free, were not used in any earlier pass, and were checked on
2026-10-08: the page or feed answered, and where a feed exists the newest item
and the number of Meta-related items since 1 October 2025 were read by script.
About 110 candidates were checked to find them. **Checked means live and
recent, not read in depth** — only titles were skimmed (§10.3).

### 10.1 The list

**Meta's own**

| # | Source | What it gives | Checked |
|---|---|---|---|
| 1 | Meta Business News — facebook.com/business/news | Official ads announcements | Live; newest 6 Oct 2026 |
| 2 | Meta Newsroom — about.fb.com/news | Company-level news; ads launches appear here too | Feed live |
| 3 | Meta Ads Guide — facebook.com/business/ads-guide | Sizes and limits for every format and placement | Live |
| 4 | Advertising Standards — transparency.meta.com | What ads are allowed | Live |
| 5 | Meta for Developers blog | API version notes; WhatsApp business tools for AI agents (15 Sep 2026) | Live |
| 6 | Meta Investor Relations — investor.atmeta.com | Quarterly figures on ad volume and price | Live; earnings pages not read |

**News**

| # | Source | What it gives | Checked |
|---|---|---|---|
| 7 | Social Media Today | Daily platform changes; ran "Meta tests Reels-first Facebook feed in India" on 6 Oct | Feed live; 4 of newest 10 on Meta |
| 8 | Search Engine Journal, paid media | Trade coverage of ad platforms | Feed live |
| 9 | Social Media Examiner articles | Weekly how-to pieces with guest experts | Feed live; 9 of newest 25 |
| 10 | TechCrunch, Meta tag | Meta as a company: AI, policy, products | Feed live; 18 of 20 |
| 11 | Practical Ecommerce + its podcast | Small-shop view; 7 Meta episodes | Feeds live |
| 12 | Geekout (Matt Navarra) | Weekly newsletter on social-platform changes | Page live |

**Numbers and benchmarks**

| # | Source | What it gives | Checked |
|---|---|---|---|
| 13 | WordStream | Yearly Facebook benchmarks (2026 edition 14 Sep); placements guide (24 Sep) | Feed live |
| 14 | Lebesgue blog | Benchmarks by industry and order size; its own switch-off test; learning-phase update (21 Sep) | Feed live; 4 items |
| 15 | Databox Benchmarks | Benchmark groups across tools | Page live |
| 16 | Northbeam blog | Measurement writing from a tracking vendor | Page live |

**Creative and craft**

| # | Source | What it gives | Checked |
|---|---|---|---|
| 17 | Foreplay blog | Ad creative and ad-library research | Page live |
| 18 | Birch blog (was Revealbot) | Automation and rules | Page live |
| 19 | Tier 11 blog | Written side of the Perpetual Traffic team | Page live |
| 20 | Marketing Examples | Short copywriting examples | Page live |

**Tracking** (closest to our own server-side setup)

| # | Source | What it gives | Checked |
|---|---|---|---|
| 21 | Simo Ahava's blog | The reference on server-side tagging | Feed live; newest 9 Sep 2026 |
| 22 | Analytics Mania | Tag and event tutorials | Page live |
| 23 | Stape blog | Server-side tracking and Conversions API | Page live |

**Measuring true effect — tools and research**

| # | Source | What it gives | Checked |
|---|---|---|---|
| 24 | Google Meridian | Free open-source budget-mix modelling | Page live |
| 25 | PyMC-Marketing | Free open-source budget-mix modelling | Page live |
| 26 | Recast blog | Plain-language pieces on modelling and synthetic controls | Feed live |
| 27 | "Predicted Incrementality by Experimentation" — Gordon, Moakler, Zettelmeyer, 2023 | Predicting true lift from past experiments | arXiv 2304.06828 |
| 28 | "Characterizing and Minimizing Divergent Delivery in Meta Advertising Experiments" — Burtch, Moakler, Gordon, 2025 | Why two ads in a Meta A/B test reach different people | arXiv 2508.21251 |
| 29 | "Where A/B Testing Goes Wrong" — Braun and Schwartz, Journal of Marketing 2025 | Same problem, independent authors | Found by search; page blocks scripts |
| 30 | "Privacy-Robust Incrementality Measurement … under Signal Loss", 2026 | Measuring lift with less data | arXiv 2606.03878 |
| 31 | "Which Firms Gain from Digital Advertising?" — NBER 30925 | Field experiment on who benefits | Page live |
| 32 | "GRACE: … Real-Time Ads Retrieval", Aug 2026 | How ads are picked before ranking | arXiv 2608.00938 |

**Podcasts**

| # | Source | What it gives | Meta episodes since Oct 2025 |
|---|---|---|---|
| 33 | **Hometown ADvantage** (Nicole Eldridge) | **Facebook ads for local businesses** | 19 |
| 34 | **The Art of Online Business** (Kwadwo Sampany-Kessie) | Small budgets; the offer before the ad | 43 |
| 35 | The DTC Podcast + DTC Newsletter (Pilothouse) | Agency running large accounts | 46 |
| 36 | The Smart Marketer Podcast | Regular Meta question-and-answer episodes | 19 |
| 37 | The Unofficial Shopify Podcast | Shop owners | 12 |
| 38 | eCommerce Evolution (Brett Curry) | Meta beside YouTube and Google | 6 |
| 39 | Ecom Growth Insider | Founder interviews | 5 |
| 40 | Mobile User Acquisition Show (Shamanth Rao) | Meta for apps; "signal engineering" | 5 |
| 41 | Sub Club (RevenueCat) | Subscription apps on Meta | 4 |

**Organic Instagram** (our funnel is organic reels)

| # | Source | What it gives | Checked |
|---|---|---|---|
| 42 | Buffer resources | Organic social practice | Feed live |
| 43 | Sprout Social Insights | Organic social data | Feed live |

**Course**

| # | Source | What it gives | Checked |
|---|---|---|---|
| 44 | Coursera — Meta Social Media Marketing certificate | Meta's own course, free to audit | Page live |

**India**

| # | Source | What it gives | Checked |
|---|---|---|---|
| 45 | Social Samosa | Indian marketing news; covered the placement change | Page live |
| 46 | Inc42 | Indian startup and consumer-brand news; "Facebook tests Reels-first UX in India" (6 Oct) | Feed live |
| 47 | Clevrr — D2C Festive Marketing Report 2026 | Indian festive-season ad data | Page live; vendor report |
| 48 | Nurdd — Indian D2C ad benchmarks 2026 | CPM, click cost and return by category | Page live; **one agency's numbers** |

**Events**

| # | Source | What it gives | Checked |
|---|---|---|---|
| 49 | Eventbrite blog | Event marketing | Page live; vendor |
| 50 | Skiddle Promotion Centre | UK event promoters | Feed live; none of newest 10 on Meta |

### 10.2 Which matter most for us

- **33 and 34** are the nearest voices to a small, local, booking-based
  business found in any pass.
- **14** has a September 2026 learning-phase update and its own switch-off test.
- **13** has a September 2026 placements guide, timely given the removal.
- **28 and 29** explain why Meta's own A/B test is not a clean comparison —
  relevant to the split-test question already recorded in memory.
- **21 and 23** are the references for our own Conversions API setup.
- **45–48** are the first India sources found; 47 and 48 need caution.

### 10.3 What a skim of about 135 of their titles showed

Not counted in the 785 items of the expert synthesis. Nothing contradicted it.

- The "variety is not volume" correction appears again: "Velocity isn't
  strategy — the Andromeda creative trap" (DTC Podcast, May 2026).
- The March attribution change had a visible cost: "Meta attribution change —
  why ROAS dropped 40%" (DTC Podcast, 24 Apr 2026), then "the setting you need
  to test now" (8 May).
- One brand ran a six-week blackout to test Meta's true effect (27 Apr).
- Creator-partnership ads are now 30–50% of ads on that agency's biggest
  accounts (25 Sep).
- Small-business hosts repeat "the offer has to earn the ads" and "you can't
  add ads to a funnel you're still figuring out".
- **A date that does not fit:** The Art of Online Business titled an episode
  "Meta took away your ad placement controls" on 20 April 2026, four months
  before the August notice. Not listened to; it may refer to an earlier step.

### 10.4 Checked and left out

No working feed or page: Search Engine Land feed, Elevar (address now points
elsewhere), Swipe Insight (now a different product), TikTok Creative Center
(timed out), Hootsuite, CXL, AdEspresso, KlientBoost, Madgicx, Later, Marketing
Brew, Storyboard18, exchange4media, Meta success-stories page (loads empty to a
script), Instagram business blog (now redirects to Meta Business News).
Too little on Meta: AdExchanger, Digiday, Marketing Week, afaqs!, Honest
Ecommerce, eComFuel, EcomCrew. Unverified: Varos free tier, HubSpot Academy
course page, "The Performers" newsletter.

---

## 11. YouTube versus the written sources — comparison, 2026-10-08

**Asked by the owner:** compare what OpenClaw wrote after reading the ~90 YouTube
lessons with what the experts say on LinkedIn and other online sources, and show
the differences.

**The two documents compared**

- **YouTube:** `LESSONS-DIGEST-2026-10-04.md` — OpenClaw's digest of all 91
  lessons, finished 8 October 2026.
- **Written:** `META-EXPERT-SYNTHESIS-2026-10-08.md` — LinkedIn posts, blogs,
  newsletters and podcast summaries, about 785 items.

### 11.1 Where each piece of reading lives

| What was read | Synthesised in | By |
|---|---|---|
| 91 YouTube lessons | `LESSONS-DIGEST-2026-10-04.md` | OpenClaw |
| ~141 LinkedIn posts | `META-LINKEDIN-DIGEST-2026-10-08.md`, then folded into the expert synthesis | Claude |
| 644 blog, newsletter and podcast items | `META-EXPERT-SYNTHESIS-2026-10-08.md` | Claude |
| The 50 extra sources in §10 | **Listed only.** About 135 titles skimmed (§10.3); not synthesised | Claude |

### 11.2 They are not like for like — read this before the differences

| | YouTube digest | Written synthesis |
|---|---|---|
| Size | 91 lessons, 48 channels | ~785 items, about 30 people and shows |
| Depth | Each lesson read in full; each claim checked against the lesson text | Headline plus the first lines of the summary |
| Period | April 2024 → September 2026 | October 2025 → October 2026 |
| Bar for "agreement" | Four separate channels, no opposing claim | Looser: several independent voices |
| Who dominates | No single voice | **Jon Loomer: 231 of 785 items, and he is not in the YouTube lessons at all** |
| People in both | Ben Heath, Andrew Faris, Sam Piliero, Depesh Mandalia | Same four |

So part of any difference below comes from depth and from who was read, not
only from the medium. Where the written side leans one way, check whether it
is mostly Loomer.

### 11.3 Where they say the same thing

| Topic | YouTube | Written |
|---|---|---|
| Judge by money, not attention numbers | Pattern 3, four channels | Hott, Heath, Graham |
| What Meta credits is not what the ads caused | Pattern 6, four channels | Kory, Hott, Rahmey, Holiday, Foxwell blog |
| Real variety, not cosmetic copies | Pattern 2, four channels | Loomer, Scalability School, Marketing Operators |
| The page must carry on the ad's promise | Pattern 5, four channels | Same, and goes further: Meta reads the page |
| What a customer is worth sets what you can pay | Pattern 4, four channels | Winter, Graham, Holiday: "an offer problem, not an ads problem" |
| A small account should stay simple and ask for the Purchase | Its best-fit side on two splits | Consensus points 1 and 10 |

**Nothing in the written sources contradicts the digest's ten strongest patterns.**

### 11.4 Where they lean differently

| Question | YouTube | Written | What is behind the difference |
|---|---|---|---|
| **Limiting where ads show** (our Instagram-only choice) | Three conditional views; treats it as an owner's choice | Usually unnecessary when asking for a sale; and since August 2026 the ad-set switch for it is being removed | The lessons end in September 2026 and do not mention the removal |
| **Purchase, or an earlier step?** | A real split: Piliero "nearly always Purchase", Heath allows testing an earlier step when sales are structurally few | Loomer, 7 Oct 2026: an earlier step "almost always" makes a low-volume problem worse | Written leans harder to Purchase — but it is one voice |
| **How many ads to start with** | 3–15 per ad set (Blue Sense), 4–8 per idea (Piliero), 20 or more (Heath) | 2–3, even one (Loomer) | YouTube voices mostly run larger accounts |
| **Retargeting** | No blanket rule; event cases keep it | "Mostly unnecessary" (Loomer), though others still use it | Same nuance; Loomer's volume tilts the written side |
| **The "learning" label** | A split: Heath watches it, Mark says ads never stop learning | "Just a label" (Loomer); Heath on LinkedIn stresses waiting, not the label | Written sides with Mark |
| **Patience** | A three-channel view, below its own bar for agreement | One of the loudest messages: Loomer, Heath, Graham, Winter | Small-business hosts are mostly outside the YouTube set |
| **Raising budget by a fixed percentage** | A live argument: four channels for about 20%, two against | Almost silent | YouTube goes deep on mechanics; headlines do not |
| **Meta's automatic creative changes** | One nuanced view (Piliero: additions around the ad are fine, changes to the media are not) | Review all of them; seven named this year | Written has the newer settings; YouTube has the finer distinction |

### 11.5 Only in the written sources

Counted by searching the digest's text.

| Topic | Mentions in the YouTube digest |
|---|---|
| Labelling existing customers and engaged people | **0** |
| "Value rules" as the replacement for restrictions | **0** |
| Related media, automatic events, one-click Conversions API, upgraded Pixel | **0** |
| AI agents acting in the ad account, and account safety | 2, in passing |
| Account bans, outages, "bad days" | **0** |
| The March 2026 rule that only a click on the link counts | 0 on the rule; one split on a related setting |
| A dated record of what Meta changed | None — by design it used lessons only |

### 11.6 Only on YouTube

- **How to make the ad:** start from customer research (its pattern 1); an idea
  defined as person × angle × offer; a nine-step script.
- **Events and tickets:** six channels — make place and date unmistakable, how
  early to start, how to phase money toward the date. The written sources have
  nothing on events.
- **Thresholds worked out in rupees** for our own plan.
- **Test and budget structures**, argued in detail.
- **Checked claims.** Every statement traces to a line in a lesson.

### 11.7 Why they differ

YouTube is long, slow-dating, and about how to build and judge. Written posts
are short, dated, and about what changed this week and what to stop worrying
about. Use YouTube for how to make and test the ad; use the written sources for
what Meta changed and what to leave alone.

### 11.8 Missing from both

India and rupee pricing, low-priced experiences, invite-only events, WhatsApp
after booking, Instagram in-app checkout. Neither gives a Chennai benchmark.

### 11.9 What this means for us — facts to check, not decisions

Three statements in the YouTube digest are sound for September 2026 but have a
later change reported against them:

1. It keeps "Instagram-only … and the recorded placement choices" as settled.
   The choice is the owner's; the switch that carries it out is being removed.
2. It says of attribution, "our setting remains unchanged". Since March 2026 a
   click only counts if it was on the link, and the ad set now offers three
   attribution models.
3. It treats creative enhancements as one on-or-off question. Seven separate
   automatic changes were named this year.

Everywhere else the written sources back the digest's own best-fit reading:
Purchase first, a concentrated setup, economics before borrowed budgets.
