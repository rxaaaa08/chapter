# Operations Improvement — Full Proposal

*Written 2026-07-07. This is the umbrella document: it walks the business operation by operation (as the founder described them) and maps each to a concrete technical improvement. Where a dedicated proposal already exists in this repo, this doc points to it instead of repeating it. Companions: `experiments-and-ab-testing-proposal.md`, `ai-chatbot.md`, `daily-manager-proposal.md`, `analytics-additions-proposal.md`, `dynamic-pricing-proposal.md`, `agentic-systems-proposal.md`, `pwa.md`.*

**Ground rules that apply to everything below** (same as every other proposal here): the Supabase DB is production with live customers; nothing auto-messages a customer with wording the founder hasn't approved; edge functions are deployed by the founder; pushes to `main` go live and need explicit go-ahead.

---

## The operations, as stated

| # | Operation | Current system | Health |
|---|---|---|---|
| M1 | Instagram reels marketing → creator affiliate links | Affiliate system (creator @handle links, 8% commission, creator dashboard, leaderboard) — **live since 2026-07-04** | Good, but blind on traffic quality |
| M2 | Show full plan details on the website | Event pages, per-date calendar, chat-style booking flows | Good, but untested (no A/B) and under-measured |
| O1 | Open events: pay → get group link | Fully automated (PayU → status flip → AiSensy success msg) except WhatsApp group approval | Scales |
| O2 | Open events: cart abandonment | One automated message via 30-min cron; zero human time | OK, single-touch only |
| O3 | Open events: doubts | Doubt form → marketer assigned → personal call/WhatsApp | **Founder's biggest pain point** |
| I1 | Invite-only: application intake | Admin panel + marketer role, per-marketer lead views | Good |
| I2 | Invite-only: approve → invite | One-click approve → AiSensy WhatsApp + Brevo email | Good |
| I3 | Invite-only: self-serve payment | Same automated pipe as open events | Scales |
| I4 | Invite-only: doubts | Doubt forms | Same pain as O3 |
| I5 | Invite-only: abandoners / missed invites | Manual chasing by human marketers | Most expensive human step |

---

## M1 — Creator affiliates: from "live" to "manageable"

The system works. What's missing is the ability to tell **good creators from lucky ones**, and to keep creators motivated without manual effort.

**a) Creator funnel stats (clicks → bookings), in the creator dashboard and admin panel.**
Today a creator whose reel drove 500 visitors and 2 sales looks identical to one who drove 10 visitors and 2 sales. Surfacing per-creator link traffic next to paid conversions tells the founder which creators bring *audience* vs which bring *buyers* — that decides who gets pushed, coached, or dropped. (Attribution is already session-scoped in `src/affiliate.ts`; this is about counting and displaying arrivals per creator, not changing how commissions work.)

**b) Global creator ticket-share %.** Already specced in `analytics-additions-proposal.md` — the "what % of all tickets are creator-driven" number that says whether the affiliate program matters yet.

**c) Automated monthly creator statements.** A scheduled job (existing `pg_cron` + AiSensy/Brevo pipes) that sends each creator "this month: X tickets, ₹Y earned." Creators who see regular payout messages keep posting; the founder stops answering "how much did I make?" DMs. Founder-approved template, one message per creator per month, no replies handled.

---

## M2 — The website as the brochure: measure, then test

**a) Ship the analytics daily snapshots first.** `experiments-and-ab-testing-proposal.md` Layer 2 (`analytics_daily`) is **time-boxed: the 90-day purge means history older than ~late September is gone forever** unless snapshots ship before then. Nearly every other measurement idea in this document reads from it.

**b) A/B testing of the pages that sell.** Form completion fell 66% → 57% after the single-page-form change and nobody knew until it was dug out by hand. The experiments proposal exists precisely so the next change like that is caught in days, not weeks. This is the difference between "we think the new page is better" and "the new page books 9% fewer people."

**c) Per-event WhatsApp/Instagram share cards (OG images).** When anyone shares an event link, the preview should be a mini-poster: event photo, date, price. One template rendered per event (build-time or a tiny edge function), set via meta tags. Cheap, and it upgrades every single shared link forever — including every affiliate link from M1.

---

## O1 — Pay → group chat: shrink the one manual step

Full automation (a bot adding numbers to a WhatsApp group) is not realistically available — the official WhatsApp Business API doesn't offer group-participant management, and unofficial libraries risk the business number. So keep the human step but make it a 10-second scan:

**"Paid, awaiting group entry" checklist in the admin panel.** Per event date: everyone `advance_paid`/`fully_paid`, with a manual "in group ✓" toggle (one new boolean column on `applications`, admin-only write). The approver opens the event, sees exactly who's missing, done. Bonus: the daily manager (see cross-cutting section) can flag "3 paid guests not yet in the group for Saturday's date."

---

## O2 — Cart abandonment: add a second touch and a scoreboard

Current: one message ~30 minutes after abandoning (`cart-abandonment` cron), and — deliberately — no marketer time on cold abandoners (that decision stands; see `open-event-marketer-assignment` design note).

**a) Second-touch message, next morning, different angle.** Message 1 says "come back and finish." Message 2 (~18h later) should assume there's a *reason* they stalled and lead with the doubt channel: "have a question about the plan? ask here." It converts hesitation into a doubt conversation — which is exactly the funnel O3 makes cheap. Same cron, one more time-window check, one founder-approved template. Hard cap: two automated messages total, then silence.

**b) Recovery-rate scoreboard.** `recovered_at` already marks abandoners who later paid. Show recovery % per event and per message-touch in the admin analytics — so the founder knows whether these messages earn their keep, and whether touch #2 adds anything before deciding to keep it.

---

## O3 / I4 — Doubts: the honest answer to "we'd need an app"

**The app was already built.** `pwa.md` documents a complete installable web-app channel from June: install prompts, a WhatsApp-style live chat screen, web push notifications (service worker + `send-push-notification` edge function + `push_subscriptions` table), and a Chats tab in the admin panel where a marketer types a reply and the user's phone gets a push notification. Exactly the flow the founder described wishing for.

**And it validated the founder's own worry.** It sits dormant today — the AI-chatbot proposal calls its tables "dead" — because it requires the user to *install* something before they can chat. That's the app-adoption problem in miniature: the install wall killed it, precisely as the founder predicted an app would die.

So the fix for doubt-handling is not more install friction. It's a two-tier system with **zero install steps**, plus an optional revival of the push channel where it's actually justified:

**Tier 1 — instant AI answer on the website (`ai-chatbot.md`, already fully specced).** The user types a doubt into the same form/chat they use today and gets an accurate answer *in seconds* — the bot knows the event's details, dates, prices, and timeline steps, answers only from that data, and hands anything it can't answer (or any "I want a human") to Tier 2. It reuses the dormant `doubt_conversations`/`doubt_messages` tables. This alone likely resolves the majority of doubts (timing, inclusions, refunds) with **zero marketer minutes and zero wait time** — the two things the current system spends most of.

**Tier 2 — marketers reply from the dashboard, delivered on WhatsApp.** For escalated doubts, the marketer types a reply in the admin panel (the Chats tab UI already exists) and it reaches the user **on WhatsApp** — the one app that needs no installing, no permission prompt, and gets opened dozens of times a day. Mechanically: within WhatsApp's 24-hour customer-service window a free-form session message can be sent via the API; outside it, a founder-approved template ("reply from chapter அ about your question…") re-opens the conversation. If AiSensy's API plan doesn't expose session messages cleanly, their Live Chat inbox is the zero-code fallback — marketers still get off their personal numbers, and every conversation is on the business number and reviewable. Marketer phone-number hygiene, full conversation logs, and no cold-calling unless the user prefers a call.

**Key reframe: WhatsApp *is* the push notification channel in this market.** A native app's push notification is strictly worse than a WhatsApp message from the business number — lower install rates (as the founder already believes) *and* lower open rates. The chapter app effectively already ships on every customer's phone.

**Optional Tier 3 — revive the built PWA push channel for *paid* guests only.** Post-payment users are the one group motivated enough to add the site to their home screen (the `PwaInstallCard` on the success screen exists already). For them, push becomes a *logistics* channel — "meeting spot updated," "balance due tomorrow" — not a doubt channel. Worth doing only after Tiers 1–2 prove out; the plumbing (service worker, edge function, subscriptions table) is already written and needs only the VAPID secrets + trigger checklist at the bottom of `pwa.md`.

---

## I1 — Application intake: measure the pipeline's clock

The panel and marketer lead views work. The missing instrument is **time**: `analytics-additions-proposal.md` specs the invite→advance time-to-pay tracking (an `advance_paid_at` trigger). It answers "how long does an invite stay warm?" — which directly feeds I5's chase timing and the invite-expiry design below. Build it before I5 so the expiry window is chosen from data, not vibes.

---

## I2 / I3 — Approve → invite → self-serve pay

Healthy; no structural change proposed. Two adjacent notes: the Brevo email leg needs its `BREVO_API_KEY` secret + function deploy to go fully live (see `brevo-email-invites` note), and once measurement exists, `dynamic-pricing-proposal.md` is the revenue layer that sits on top of this flow — its price-locking prerequisite (balances currently recomputed live) is worth fixing regardless.

---

## I5 — Manual chasing: make every marketer minute count

This is where real human hours go, so the goal is not automation of the *relationship* — it's removing the clerical work around it.

**a) Chase worklist in the marketer dashboard.** A per-marketer view: "your invitees, invited N+ days ago, not yet paid," and "your advance-paid guests with balance due in ≤ 3 days" — sorted by urgency, with the guest's context (event, date, amount) on the card. Data is all present (`applications.status`, invite timestamps, per-date balance steps); this is a query + a panel section, not a new system. Marketer effort per chase drops from "find, cross-check, copy number, compose" to "read card, tap."

**b) One-tap nudge from the worklist.** Each card gets a "send reminder" button that fires a founder-approved AiSensy template (with event/date/amount merged in) and stamps who nudged whom, when. Two effects: marketers stop composing the same message 40 times, and nudges become *measurable* — which templates and timings actually convert shows up in the data.

**c) Invite expiry with an automated 48-hour warning.** Invites that never expire train people to ignore them. Add an expiry (default N days from invite — pick N from the I1 time-to-pay data), a cron-fired "your invite closes in 48 hours" template, and release the spot on expiry (status change guarded to never touch paid rows). Deadline messages are reliably among the highest-converting sends, and this one is fully automatic. The founder chooses honest expiry: expired means expired (re-approval possible from the panel).

---

## Cross-cutting: the Daily Manager ties it together

`daily-manager-proposal.md` is the read-only morning briefing that watches all of the above: balance-due chases, stale doubts, marketer conversion, creator over/under-performance, abandonment spikes, paid-but-not-in-group guests. It becomes far more useful once the pieces above exist, and its trend rules explicitly depend on the analytics snapshots (M2-a). Build order below reflects that.

---

## Priority order & build plan

| Priority | What | Operation | Why now | Effort |
|---|---|---|---|---|
| 1 | Analytics daily snapshots + release markers (`experiments-and-ab-testing-proposal.md` Phase 1) | M2 | **Deadline: 90-day purge eats history ~late Sept.** Everything downstream reads from it. | ~1 session |
| 2 | AI doubt-bot Tier 1 (`ai-chatbot.md`) | O3/I4 | Attacks the founder's #1 pain; infra (tables, edge-function pattern) exists | per ai-chatbot.md phases |
| 3 | Marketer WhatsApp replies from dashboard (Tier 2) | O3/I4 | Completes the doubt loop; gets marketers off personal numbers | ~1 session (+ AiSensy plan check first) |
| 4 | Chase worklist + one-tap nudge | I5 | Biggest human-hours saving per line of code | ~1 session |
| 5 | Invite expiry + 48h warning (after I1 time-to-pay ships) | I5/I1 | Highest-converting automated message; needs the timing data | ~½ session each |
| 6 | Second-touch abandonment msg + recovery scoreboard | O2 | Small, additive to existing cron | ~½ session |
| 7 | Creator funnel stats + monthly statements | M1 | Grows in value as the creator roster grows | ~1 session |
| 8 | Paid-not-in-group checklist | O1 | Nice 10-second-scan win; also feeds a manager rule | ~½ session |
| 9 | Per-event OG share cards | M2 | Compounding but not urgent | ~½ session |
| 10 | Daily Manager (after 1; richer after 2–8) | all | The morning cockpit over everything above | per daily-manager-proposal.md |
| — | Optional: revive PWA push for paid guests (Tier 3) | O3 | Only if Tiers 1–2 leave a gap; plumbing already built (`pwa.md` checklist) | ~½ session |

**What is deliberately *not* proposed:** building a native app (the PWA experiment already demonstrated the install-wall problem); automating WhatsApp group adds (no official API, real risk to the business number); putting marketer time back on cold open-event abandoners (prior decision, stands); any AI that messages customers autonomously (AI drafts/answers doubts from event data only — humans own outreach, per `agentic-systems-proposal.md`).
