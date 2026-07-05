# chapter அ — Growth research & feature/business-model proposals

*Written 2026-07-05. Research-backed proposals for where to take the product and business next. Companion to `multi-marketer.md` and the affiliate-links handoff doc.*

---

## 1. Where you sit in the market (so the proposals make sense)

There are three kinds of companies doing what you do, and you're a hybrid of all three:

| Model | Examples | How they make money |
|---|---|---|
| **Curated stranger-meetups** | Timeleft, 222, Let's Socialise (India) | Subscription or per-seat fee; venue pays for footfall |
| **Group-trip operators** | WanderOn, JustWravel, Capture a Trip (India) | Margin on the trip itself (you run the trip) |
| **Experience marketplaces** | Fever, Headout, Airbnb Experiences | 15–30% commission on other people's events |

Key benchmarks from the research:

- **Timeleft** charges ~₹1,099/month in India for a *subscription* to stranger dinners (food not included) and the founder reports ~$1M/month revenue across 200+ cities. Their city-launch trick: a city only "unlocks" when 151 people sign up — the waitlist itself creates urgency.
- **222** matches strangers with a ~30-question personality quiz, charges a token $2.22/seat, and makes money from **venues paying for guaranteed foot traffic** (~$3/head delivered).
- **Fever/Headout/Airbnb Experiences** take **15–30% commission** (20–25% is the norm) when they sell *other people's* events. Fever's "Originals" (events they co-produce) earn them more but cost more.
- **WanderOn/JustWravel** are basically you at scale: JustWravel does ~₹12 crore/year serving 50k+ travellers, domestic trips from ₹6,500. Their retention glue is pre-trip WhatsApp groups and "trip captains".

**You are currently vertically integrated** (you create AND sell the events) — like Fever Originals, not like Swiggy. Swiggy doesn't cook. This matters: your margins are better than a marketplace's, but your growth is capped by how many events *you* can run. The long-term "Swiggy for strangers" move is opening the platform to third-party hosts — but that's a Phase-3 decision (see §5), because curation quality is currently your moat.

---

## 2. Business-model proposals

### 2.1 Treat open events as the top of one funnel, not a second business
Low-ticket open meetups (₹300–800) are your cheapest way to acquire *verified, show-up-in-person* customers. The people who attend and enjoy them are the highest-intent audience on earth for a ₹6,000–15,000 concept trip. Concretely:

- After every open event, an AiSensy flow: feedback → "you might like [next concept trip in your city]" with a returning-customer discount code.
- In admin, a "graduated" metric: % of open-event attendees who later book an invite-only trip. This is the number that tells you whether open events are marketing spend or a real business.
- Your `applications` table already keys on phone — cross-event customer history is a query away.

### 2.2 Staggered pricing: do named tiers, not 1% creep
Your instinct (airline-style rising prices) is right, but the research says the implementation matters:

- **2–4 visible, named tiers** beat continuous small adjustments: e.g. *Early Bird* (first ~30% of seats, 15–25% below standard) → *Standard* (next ~40%) → *Last Call* (final ~30%, 10–20% above standard).
- The conversion driver is **showing the tier boundary**: "Only 4 seats left at ₹499" is one of the most effective honest-scarcity tactics in ticketing. A silent 1% increase converts nobody — the *visible threat* of the next tier is what converts.
- You already have per-date capacity, `event_booking_counts_by_date`, and colour-coded calendar cells — tier state can derive from the same counts. Schema-wise this is a `price_tiers` JSONB on `event_dates` (thresholds as % sold + price), and the calendar cell + bill page show current tier and seats-left-at-this-price.
- Guardrails: never raise the price on someone mid-checkout (honour the tier at bill creation for ~15 min), and never *lower* prices visibly after people paid more (silent discounts via codes are fine; public drops burn trust).

### 2.3 A membership pass (the Timeleft move) — pilot after open events prove repeat demand
Subscriptions smooth revenue and multiply LTV, but only work once people attend repeatedly. Sequence:

1. Ship open events. Measure **repeat rate** (% booking a 2nd event within 60 days).
2. If repeat rate is healthy (>20–25%), pilot a **chapter Pass**: e.g. ₹999/month = entry to N meetups + early access to trip dates + a standing discount on trips. Sell it *at the post-event high* (in the feedback flow).
3. Keep it simple: a `memberships` table, pass state checked at bill creation, WhatsApp renewal nudges. No new payment infra — PayU recurring is hard; monthly manual renewal links are fine at pilot scale.

### 2.4 Affiliate/creator programme — two additions to the current design
The planned design (8% of full price at `fully_paid`, last-click, creator dashboard) is sound — Fever and Headout both run affiliate programmes in the same 4–10% band for third-party promoters. Two research-driven additions:

- **Promo codes as a tracking fallback.** Instagram is where your creators live, and story viewers screenshot rather than click. Give every creator a code (`ANU10`) that applies a small discount *and* attributes the sale, alongside the link. Codes catch the conversions links miss.
- **Creator-hosted events later.** The natural evolution: a creator doesn't just promote your event, they *front* one ("Coffee & sketching with @anu"). You handle booking/payment/ops, they bring the audience, revenue split ~70/30 or 80/20 in your favour. That's the first careful step toward marketplace dynamics without opening the gates to strangers.

### 2.5 Venue partnerships (the 222 move) — turn a cost into revenue on low-ticket meetups
For a 20-person café meetup you're delivering exactly what 222 charges venues for: guaranteed, pre-paid foot traffic on a weekday. Ask venues for: free/discounted space, a per-head kickback, or a minimum-spend deal. Even "free venue" changes low-ticket meetup unit economics dramatically. This is a BD motion, not a code change — the only product support needed is a per-event "venue cost" field in your finance section (you already track logistical costs).

### 2.6 Referrals & group bookings — friends are the cheapest acquisition channel
You sell *social* products; the buyer's friends are literally the product's raw material.

- **Bring-a-friend pricing:** "2 seats: ₹X each → ₹X−50 each." Multi-seat checkout is a real flow change (one payment, N applications rows), so start with the cheap version: a post-booking share link that gives the friend ₹50 off and the referrer ₹50 credit on their *next* event (credit, not cash — it forces a repeat booking).
- Referral credits can live as rows in a small `credits` table redeemed at bill creation, same server-trusted pricing path as everything else.

### 2.7 B2B/corporate — the high-margin sleeper
Same infra, different buyer: team offsites and "new-in-town" onboarding socials for companies. One corporate booking = 20–50 seats at better margins with zero marketer commission. Needs nothing but a landing section + a Tally form routed to you. Worth listing before it's "built".

---

## 3. Product/feature proposals

### 3.1 PWA + web push on Android (the app-without-an-app)
Your no-native-app call is right, and the research confirms you can still get push notifications as a webapp:

- **Android + Chrome: mature, full-featured web push** since 2015, with an automatic "Add to Home Screen" install banner. India is overwhelmingly Android — this covers most of your users.
- **iOS: works since 16.4 but only after the user manually adds to Home Screen** — treat iOS as WhatsApp-only (you already have AiSensy).
- Real-world benchmark: a flash-discount push produced a **22% lift in transactions** for a ticketing org.
- Build: manifest + service worker + a push edge function; prompt for install/push *after* a successful booking (highest-goodwill moment). Use it for: spot-opened-from-waitlist, price-tier-about-to-change, event-day reminders, new-event-in-your-city.

### 3.2 Close the post-event loop (currently your funnel ends at payment)
Everything after `fully_paid` is retention, and retention is what makes every other number work:

- **Feedback flow** (AiSensy, day after): rating + one question. Feeds testimonials and a per-event quality score in admin.
- **Photo delivery**: a post-event link (Drive is fine) sent via WhatsApp — the single most shared artifact; every share is organic marketing.
- **Check-in at meeting spot** (marketer taps "arrived" in admin, or QR later): gives you a true **no-show rate**, powers loyalty tiers, and cleans up your conversion analytics.
- **"Book your next one"** with returning-customer code inside the feedback flow (see §2.1).

### 3.3 Waitlist auto-offer
You already have a `waitlist` status. When a paid booking is cancelled/refunded on a sold-out date, auto-WhatsApp the first waitlisted person a 4-hour claim link. Sold-out dates currently generate zero revenue from overflow demand; this converts it. Also: a sold-out calendar cell should collect waitlist entries (one tap), not just say "sold out".

### 3.4 Social proof on event pages
For strangers-events the #1 anxiety is "who else is going / is this real":
- "23 going · 7 spots left" (via the existing `event_booking_counts_by_date` RPC — no RLS change needed).
- First-name + age-ish chips ("Priya, Arjun and 21 others") — first names only, no PII risk.
- Post-event ratings/testimonials from §3.2 rendered on the event page.

### 3.5 Light matching/curation for open meetups (differentiator, Phase 3)
Timeleft's and 222's entire moat is "we compose the table well". A 5-question vibe quiz at booking (interests, energy, age band) + a simple grouping step in admin (even manual at first, shown as table/group assignments in admin) lets you say "curated, not random" — which is the difference between competing with a free WhatsApp group and competing with Timeleft. Store answers on the application row; no algorithm needed until volume demands it.

### 3.6 City waitlist pages (the Timeleft 151 trick)
You have multi-city support; use demand *data* to decide expansion. A "chapter அ in Kochi? Join the waitlist" page (name + phone into a table) per candidate city. Launch a city when the list crosses your threshold — and the launch announcement to that list sells out event #1.

### 3.7 Open-event funnel analytics (already planned — one addition)
When you build the open-event funnel mirror, add **cohort retention** alongside drop-off: of everyone whose first event was in month M, what % booked again within 60 days? That single chart tells you more about the business than any conversion tweak.

---

## 4. What NOT to do (equally research-backed)

- **No native app** — your call is confirmed. PWA push (§3.1) captures most of the benefit at ~2% of the cost.
- **No continuous/opaque dynamic pricing.** Airline-style invisible repricing reads as manipulation in a trust-first social product. Named tiers with visible boundaries (§2.2) capture the same revenue with none of the resentment.
- **No open marketplace yet.** Letting anyone host destroys the quality bar that makes strangers trust you. The bridge is creator-hosted events under your ops (§2.4).
- **No subscription before repeat-rate data.** A pass sold before people naturally re-attend just becomes a refund/churn problem (§2.3).

---

## 5. Suggested sequence

**Phase 1 — now → ~3 months (revenue & data from what exists)**
1. Ship open events + finish affiliates (with promo-code fallback).
2. Tiered pricing on 1–2 events as a pilot.
3. Post-event feedback + repeat-booking WhatsApp flow; start measuring repeat rate.
4. Waitlist auto-offer; social proof counts on event pages.

**Phase 2 — ~3–6 months (retention & channels)**
5. PWA + Android web push.
6. Referral credits ("bring a friend").
7. Venue-partnership BD for low-ticket meetups; venue-cost field in finances.
8. Open-event funnel + cohort retention chart.

**Phase 3 — 6–12 months (model expansion, gated on Phase-1/2 data)**
9. chapter Pass membership pilot (if repeat rate >20–25%).
10. Creator-hosted events (revenue-split).
11. Vibe-quiz curation for meetups.
12. City waitlist pages → expansion; B2B landing section.

**North-star metrics:** repeat-booking rate (60-day) · revenue per attendee per quarter · CAC by channel (marketer vs creator vs organic) · no-show rate · per-event contribution margin (your finance section already computes the last one).

---

## Sources

- [Timeleft](https://timeleft.com/) · [How Timeleft solved the chicken-and-egg problem](https://startupspells.com/p/how-timeleft-solved-the-chicken-and-egg-problem) · [Timeleft review (India pricing)](https://museumofthoughtsblog.wordpress.com/2025/08/21/making-friends-through-timeleft-my-honest-review-after-joining-multiple-dinners/) · [SCMP on Timeleft](https://www.scmp.com/postmag/culture/article/3299424/socialising-platform-timeleft-offers-dinner-date-strangers-hong-kong)
- [222 on TechCrunch](https://techcrunch.com/2022/11/14/2440702/) · [222 venue partnerships](https://partners.222.place/) · [dot.LA on 222](https://dot.la/222-friend-app-2658453941.html)
- [ThePrint: Delhi-NCR stranger meetups](https://theprint.in/feature/delhi-ncr-is-tackling-urban-loneliness-its-called-stranger-meetups/2451273/)
- [JustWravel story (₹12 Cr revenue)](https://startuppedia.in/startup-stories/two-school-friends-build-an-award-winning-social-travel-startup-clocked-12-crore-in-revenue-served-15k-customers-during-last-fy-8632125) · [WanderOn](https://wanderon.in/) · [JustWravel](https://www.justwravel.com/)
- [OTA commission rates 2026 (Viator/GYG/Klook/Airbnb)](https://www.sambahq.com/ota-supplier-guide/ota-commission-rates) · [Fever business model](https://vizologi.com/business-strategy-canvas/fever-business-model-canvas/) · [Fever affiliate programme](https://business.feverup.com/affiliates/) · [Headout business model](https://vizologi.com/business-strategy-canvas/headout-business-model-canvas/)
- [Ticket Fairy: early-bird & tiered pricing](https://www.ticketfairy.com/blog/tiered-pricing-and-early-bird-strategies-for-festivals) · [Ticket Fairy: pricing in 2026](https://www.ticketfairy.com/blog/mastering-event-ticket-pricing-in-2026-from-early-birds-to-dynamic-pricing-vip-packages) · [Zoho Backstage: dynamic pricing](https://www.zoho.com/backstage/dynamic-ticket-pricing-for-events.html) · [XTIX: tier structure & conversion](https://xtix.ai/blog/early-bird-pricing-how-to-structure-tiers-to-maximize-conversion-jdpxg)
- [MobiLoud: PWA push iOS/Android](https://www.mobiloud.com/blog/pwa-push-notifications) · [MagicBell: PWA iOS limitations](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) · [Edana: PWA push reliability + 22% case study](https://edana.ch/en/2026/03/19/push-notifications-on-web-applications-pwa-is-it-really-reliable-on-ios-and-android/)
- [Soho House membership](https://www.sohohouse.com/en-us/membership) · [Community monetization models](https://kit.com/resources/blog/online-community)
