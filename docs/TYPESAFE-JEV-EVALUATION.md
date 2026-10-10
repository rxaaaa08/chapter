# TypeSafe / Jev — evaluation for chapter அ

**Written 2026-09-22.** Research only. Nothing built, nothing installed, no account
created, no API key requested. The `typesafe@typesafe-ai` Claude Code plugin was
installed and then **uninstalled the same day** at the owner's request — it is not
scoped to this project. See `[[marketing-skills-trimmed-plugin]]` memory for scope rules.

---

## 1. The short answer

Jev is **not** a tool for building the chapter web app. It is a component you would
put **inside** the product, at runtime. Those are different things, and the vendor
says so directly.

Of everything it could do here, **one use is genuinely strong** (reading competitor
ad copy in the Ad Library watcher), **one is decent** (routing customer doubts before
anyone drafts a reply), and a long list of chapter அ's hardest problems are ones Jev
is explicitly bad at — all the money and date arithmetic.

---

## 2. What Jev is, and what it is not

Jev is a **"System One" model**: it does not write text, hold a conversation, or
produce code. You send it a `state` (some text or JSON) plus typed questions, and it
returns typed answers with calibrated probabilities:

| Type | Returns | Use for |
| --- | --- | --- |
| **Noul** | one number 0–1 = probability of "yes" | "Is this true of this record?" |
| **Choice** | one option from your list + probability per option + confidence | "Which bucket?" |
| **Score** | position on ordered levels you describe + confidence | "How much / how severe?" |

One `POST https://api.typesafe.ai/v1/systemone` carries the state **once** and answers
**every question in parallel** against it. That is the key efficiency: 13 questions in
one call instead of 13 calls. Vendor's own cookbook measures this at 12.2× cheaper and
10× faster than one-question-per-call, with identical answers.

### The half of the question that gets a flat "no"

> *"…how we can use typesafe jev for our uses of building & perfecting the chapter web app"*

For **building** the app — writing React, fixing the booking timeline, running `tsc`,
reviewing edge functions — Jev does nothing. It cannot write or read code. TypeSafe's
own documentation page "Jev with coding agents" exists specifically to say this:

> Jev is **not** a drop-in replacement for the LLM behind Claude Code, Cursor, opencode,
> Copilot… There is no `model: "jev-latest"` setting that turns your coding agent into a
> Jev-powered agent, because the two systems solve different problems.

So it does not speed up our work together, replace me, or make the codebase better on
its own. The only thing that changes "building the app" is that the app would gain a
new runtime dependency to maintain. **The skill we briefly installed was only there to
teach a coding agent how to write TypeSafe integrations correctly** — it is documentation
about the API, not the API.

---

## 3. Cost — measured, not estimated

Price is **$42 per billion input tokens ($0.042 per million)**. Output tokens are free.
Rate limit 1,200 requests/minute. Context 64k per request.

Measured chapter அ volumes on **2026-09-22** (live DB):

| Source | Rows total | Last 30 days | Avg text length |
| --- | --- | --- | --- |
| `applications` | 310 | 27 | — |
| `doubt_submissions` | 49 | 2 | 35 chars |
| `whatsapp_inbound` | 20 | 20 | 12 chars |
| `competitor_ads` | 4 | 4 | 539 chars |

Running Jev over **all four sources, every row**:

- **At today's volume: $0.001 / month.** One tenth of one US cent.
- **At 50× today's volume: $0.053 / month.**
- To reach **$10/month** we would need ~476,000 requests/month — roughly **17,600×**
  our current volume.

**Conclusion: cost is not a factor in this decision and will not become one.** Do not
spend any more time modelling it. The decision rests entirely on whether a calibrated
typed judgment does something we cannot already do in code — and on whether we want a
third-party dependency in the path at all. Note `package.json` currently has **zero**
AI/LLM dependencies and no edge function calls any AI API; this would be the first.

*(Small-sample caveat, stated once per house rule: 4 competitor ads is far too few to
read any chart from. That is an argument about reading results, never about building
the pipe.)*

---

## 4. Where it genuinely fits — ranked

### 4.1 STRONG — Ad Library competitor watcher (`competitor_ads.ad_text`)

This is the best fit by a distance, because it repairs **two known-broken signals** that
META-ADS-HANDOFF.md §25.5 already records, both of which were found by a human reading
four days of data by hand, and neither of which code can do.

**Correction 1 — "longevity means it works" is only true for evergreen creative.**
An event-dated ad stops because the event passed, not because it failed. Today
`days_running` cannot tell these apart, so the panel's core signal is unreliable.

A single **Noul** fixes it:
```
is_event_dated:
  type: noul
  instructions: "Does this ad promote an event happening on one specific date or
                 weekend, rather than an ongoing offer available any time?"
  criteria:
    true:  "Names a date, a day of the week, a month, or a phrase like 'this Saturday'"
    false: "Promotes something available continuously, with no single occasion"
```
Then code — **not Jev** — interprets `days_running` differently for each bucket. A regex
cannot do this: dates appear as "27th", "this Sat", "Aug 27", "next weekend", and a date
in the copy does not always mean the ad is event-dated.

**Correction 2 — a disappearance can mean "edited and relaunched".** The cricket ad came
back the next day under a **new `library_id` with identical copy**, which today looks
like one ad dying and a different one being born. That is exactly the vendor's *entity
alignment* cookbook (deciding whether two catalogue rows are the same product). One
**Score** over a candidate pair:
```
relaunch_of_disappeared:
  type: score
  instructions: { candidate: <old ad_text>, question: "Is the ad in state the same ad as `candidate`, relaunched?" }
  criteria: ["Unrelated ad", "Same campaign, different ad", "Same ad relaunched"]
```
Code picks the candidates (same page, disappeared in the last N days — a cheap SQL
filter), Jev judges only the semantic pair, and code owns the threshold and the linking.
Confidence gates anything uncertain to the owner rather than writing it automatically.

**Also worth having, same request, no extra call:** what the ad offers (Choice), who it
addresses (Choice), whether it leads with price / scarcity / social proof (Nouls). That
turns unstructured competitor copy into columns that Growth ▸ Ads can actually chart —
the "turn judgments into reusable data" pattern.

All of this is **one request per ad**, run by the existing daily capture, costing
fractions of a cent, touching **no customer data at all** — competitor ad copy is
public. That last point makes this the lowest-risk place to try Jev if we ever do.

### 4.2 DECENT — routing customer doubts before drafting

The `ai-chatbot.md` doubt-bot was proposed and never built. **Jev cannot be that bot**
— it generates no text, so it cannot replace the `drafts` skill or write a reply.

What it can do is be the **router in front of** the reply:
- *"Is this question fully answerable from the event's published facts?"* (Noul) → if
  yes, code answers deterministically from the DB.
- *"Which topic?"* (Choice: price / timing / pickup / eligibility / refund / other) →
  routes to the right canned answer or the right person.
- *"How close is this person to buying?"* (Score) → the marketer sees the hot lead first.

**Why this shape is safer than an LLM for us specifically:** quoting a wrong price or a
wrong meeting point to a customer is a live-money bug on a payments product. Here Jev
only ever returns *a topic and a confidence*; **code does every factual lookup**. There
is no path by which a model invents a price. That is a real safety property, not a
nicety.

### 4.3 The rest

Lead-quality scoring, marketer call-note triage, and creative-fatigue reading of our own
ad copy are all plausible and all cheap, but none of them is a problem we currently have
evidence of having. Not recommended until something asks for them.

---

## 5. Where Jev must never go in chapter அ

From the vendor's own `jev-1.13` jaggedness page (reviewed 2026-09-17) plus our scars:

| Never | Why |
| --- | --- |
| **Any money arithmetic** — commission, balance due, ROAS, CPA, spots left | Jaggedness #2: "Jev is not a calculator." We have already paid ₹875 by accident once (§21.8). All money math stays in code, permanently. |
| **Any date comparison or ordering** | Jaggedness #3: Jev reads dates as text, not ordered quantities. chapter அ is *made of* date logic — `selected_date`, balance-due dates, per-date `booking_steps`, `stepRole()`. Extraction is fine; comparison is code's job, always. |
| **Anything on the payment path** | `create-payu-order`, `payu-callback`, `payu-webhook`, `verify-pending-payments` are already excluded from unattended deploys. Adding a third-party API call into a payment gate adds a new way for money to stop. |
| **Counting anything** | Jaggedness #2: does not count reliably, error grows with list size. `event_booking_counts` is SQL and stays SQL. |
| **Treating its output as an instruction** | Jaggedness #6: "state is not treated as hostile by default." Customer doubts and competitor ad copy are both outside our control. A doubt containing "ignore previous instructions" could move an answer. Blast radius stays small only because code owns all the facts — keep it that way. |

---

## 6. Integration notes and traps, if we ever build it

- **Call the HTTP endpoint with `fetch`, not the npm SDK.** Edge functions are Deno and
  every other third-party call here (Meta, AiSensy, Brevo, PayU) is raw `fetch`. Match it.
- **The `_shared/` deploy-drift trap applies.** If a Jev helper lands in
  `supabase/functions/_shared/`, it bundles at **deploy** time and every importer must be
  redeployed or the live code silently stays old. This has already cost us two Meta
  reporting gaps. Re-derive importers with `grep -rl`, never trust a written list.
- **API key server-side only, in `app_secrets`.** Never in client code. The pattern and
  the double-guard reasoning are already in CLAUDE.md.
- **Rate limits are explicitly unstable.** The docs warn limits "can change without
  notice." Fine for a daily cron; a real risk for anything a customer waits on
  synchronously. Prefer cron/background over the request path.
- **PII.** Doubts and WhatsApp messages carry names, phones and emails. Zero data
  retention is enterprise-only. The routing questions in §4.2 do not need identity —
  **strip PII before sending.** §4.1 avoids this entirely (public ad copy).
- **Pin the model version** (`jev-1.13.0`, not `jev-latest`) if thresholds are ever tuned,
  because an alias moves under you.

---

## 7. Negative results — checked, nothing there

Recording these so nobody re-investigates:

- **Jev cannot help build or review this codebase.** Checked the vendor's own coding-agents
  page. It is not a code model. Settled; do not re-open.
- **Cost modelling is finished.** $0.001/month today, $0.053 at 50×. No further analysis
  needed at any volume chapter அ will plausibly reach.
- **No existing AI dependency to piggyback on.** `package.json` has none; no edge function
  calls any AI API. This would be a first dependency, not an incremental one.
- **Jev cannot be the doubt-bot** from `ai-chatbot.md`. It generates nothing. Any bot still
  needs a generative model; Jev could only route in front of it.

---

## 8. Open — owner's call, nothing started

1. Do we want a third-party AI API in this stack at all? (Today: zero.)
2. If yes, is §4.1 (competitor ad copy — public data, no PII, daily cron, fractions of a
   cent) the right first and only trial?
3. §4.1's value is currently gated on **4 competitor ads**. The pipe is worth building
   before the data exists — data not captured is gone forever — but the read is not.

No account, no key, no code. Nothing happens here without an explicit go-ahead.
