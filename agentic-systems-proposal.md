# Agentic Systems for Chaptera — What's Real, What's Hype, What to Build

*Written 2026-07-07. A plain-language guide + proposal. Nothing here is built. Companion to
`ai-chatbot.md`, `daily-manager-proposal.md`, `experiments-and-ab-testing-proposal.md`,
and `growth-research-proposals.md` — this document deliberately does NOT repeat those; it
maps the new "agent" tools onto the business and says where each one genuinely helps.*

---

## 0. The one-paragraph verdict

You are already running an agentic-ish operation: cron jobs that chase abandoned carts,
a round-robin trigger that assigns marketers, WhatsApp templates that fire on payment,
push notifications to your phone. The new tools (n8n, OpenClaw, agent frameworks) don't
replace any of that — they add three genuinely new abilities: **(1)** connecting outside
services (Instagram, Sheets, review platforms) without writing code, **(2)** a personal
AI assistant you can message on WhatsApp that answers questions about your business, and
**(3)** AI that handles open-ended jobs no fixed rule can (answering arbitrary customer
doubts, writing content). The core rule of this proposal: **anything that touches money,
customer messages, or the production database stays deterministic and inside your
existing Supabase stack. Agents get read-only access and edge jobs.** Most of the
highest-value "agentic" ideas for Chaptera are already written up as the Daily Manager
and AI Chatbot proposals — this document mostly tells you which tool to *not* use for those.

---

## 1. The vocabulary, in plain language

**Workflow automation (n8n, Zapier, Make).** A visual canvas where you draw flows like
"when a new row appears in Google Sheets → send a WhatsApp message → wait 2 days → send
a follow-up." No code; you drag boxes and connect them. n8n is the one people talk about
most because it's open-source (you can self-host it free) and it added AI nodes, so a box
in the flow can be "ask Claude to summarize this" instead of just "copy this field."
Think of it as **plumbing between apps**.

**AI agent.** An AI model given tools (read a database, send a message, browse the web)
and a goal, which then *decides for itself* which tools to use and in what order. Unlike
a workflow, the steps aren't fixed in advance. Powerful for open-ended tasks; risky for
precise ones, because it can misunderstand and act on the misunderstanding.

**OpenClaw** (you said "open claw" — same thing; it was renamed a couple of times).
An open-source personal AI agent that runs 24/7 on your own computer or a small server,
and that you talk to through WhatsApp/Telegram/Discord. People use it as a "chief of
staff": message it "how did sales go today?", it checks the connected systems and
replies. The catch, and it's a big one: it runs with whatever access you give it, all
the time, and the security community has repeatedly flagged that a always-on agent with
broad permissions is a serious risk. More in §5.

**Agentic workflow.** The middle ground: a fixed workflow (n8n-style) where *some* steps
are AI. E.g. "every Monday: pull last week's numbers (fixed) → have AI write a 5-line
summary in plain English (AI) → send it to my WhatsApp (fixed)." This is the shape most
of the useful ideas below take, because the AI is boxed in — it can only write text, not
touch data.

**What you're using right now.** Claude Code — the thing you're talking to — is itself
an agent (it reads your code, queries your DB, edits files, with you approving actions).
Your Claude setup also already has connectors to **Canva** and **Tally** and your
**Supabase** project. So "getting into agents" is not a from-scratch journey; you're
several steps in.

---

## 2. What Chaptera already automates (so we don't rebuild it in a shinier box)

Worth listing, because n8n tutorials will demo exactly these things and make them look new:

| Already live | Where it lives |
|---|---|
| Abandoned-cart detection + WhatsApp/email recovery | `cart-abandonment` edge function, 30-min cron |
| Payment confirmation → status flip → WhatsApp receipt | `payu-callback` |
| Lead → marketer round-robin assignment | DB trigger on application INSERT |
| Invite approval → WhatsApp + Brevo email | approval flow + `send-brevo-invite` |
| Admin push notifications on key events | `notify_admin_push()` |
| Stuck-payment re-verification | `verify-pending-payments` cron |
| Funnel analytics + admin dashboard | `flow_analytics` + Analytics tab |

**Any pitch that amounts to "use n8n to send a WhatsApp when someone books" should be
rejected — you have that, it's server-side, and it's more reliable than an external
workflow tool calling in.** The genuinely new territory is what's below.

---

## 3. The honest tool-by-tool map

### 3.1 n8n — useful at the EDGES of the business, not the core

**Where it's the wrong tool:** anything in the booking/payment path. Your payment flow
is Supabase edge functions talking to PayU with server-trusted pricing. Moving any of
that into n8n would mean two brains running the business (some logic in Supabase, some
in n8n), a second system to keep alive, and a second place things can silently fail —
for zero benefit. Also: your DB has RLS locks protecting customer PII precisely so that
outside things can't read it casually; an n8n instance with a service key bypasses all
of that.

**Where it's genuinely good for you — the "edges":** one-off and marketing-side
integrations that never touch the booking database, where the alternative today is
"ask Claude Code to build another edge function" for something that isn't really a
product feature:

- **Post-event feedback loop:** day after an event date → send attendees a Tally
  feedback form via AiSensy → collect responses → if rating ≥ 4, follow up asking for a
  Google review / Instagram story tag; if ≤ 2, alert you personally. (Reads a list you
  export; doesn't write to the DB.)
- **Instagram/social lead capture:** DM keyword or comment ("PLANS") → auto-reply with
  the booking link → log the lead in a Sheet. n8n has ready-made nodes for this.
- **Content distribution:** new event goes live → auto-draft the announcement for
  Instagram caption + WhatsApp broadcast text + email, all from the event's own details.
- **Back-office paperwork:** monthly → pull paid bookings → generate a revenue Sheet /
  simple invoices for your accountant.

**Cost:** n8n Cloud starts around €20–24/month; self-hosting is free but then *you* own
keeping a server alive — for a no-code founder, pay for Cloud or skip it.

**My honest take:** n8n is a *nice-to-have* for you, not a lever. The feedback loop
(first bullet) is the only one I'd rank in the top five things to do, and even that can
be built inside your existing stack (one edge function + pg_cron + the Tally account you
already have) with no new monthly bill and no new system to babysit. Adopt n8n only if
you find yourself wanting 3+ of these edge automations — one tool for many small flows
is when it earns its keep.

### 3.2 OpenClaw — the right *idea*, the wrong risk profile for a live-payments business

The dream it sells is real and relevant: you, on WhatsApp, asking *"how many spots left
for Saturday? who hasn't paid their balance? draft a nudge message for them"* and getting
instant answers without opening the admin panel.

But OpenClaw specifically means running an always-on, broadly-permissioned agent on a
machine you maintain, connected to your personal WhatsApp, with credentials to your
systems. For a production business with live customer PII and payments, that's the
single riskiest architecture on this page: if it's tricked (agents can be manipulated by
message content), misfires, or the machine is compromised, it has standing access to
everything you gave it. The security track record of the whole always-on-agent category
in 2025–26 has been rough. **Recommendation: don't run OpenClaw against Chaptera prod.**

Get the same dream safely, in two steps that are already in your existing proposals:

1. **The Daily Manager** (`daily-manager-proposal.md`) delivers the *push* half: every
   morning, urgent items, underperformers, wins — deterministic rules, no AI to go wrong,
   riding your existing push pipeline. Build this first; it's ~80% of the value.
2. **A read-only "Ask Chaptera" layer** delivers the *pull* half: a small edge function
   that takes your question, lets Claude query a **read-only, PII-limited database view**
   (counts, statuses, revenue — no phone numbers), and answers. Exposed first inside the
   admin panel (safest — already behind your login), later via WhatsApp if you want it,
   with the key design rule: **the AI can read; it can never write, message a customer,
   or refund anything.** Drafting a nudge message is fine — *sending* it is your tap.

That's OpenClaw's value with none of its blast radius.

### 3.3 AI agents for customers — already specced, one addition

Customer-facing AI at Chaptera means one thing: the doubt bot, and `ai-chatbot.md` is a
complete build plan for it (instant answers from live event facts, human escalation
preserved). Nothing in the n8n/OpenClaw world does this better than that plan — it's
your data, your brand voice, your existing tables.

One extension worth adding to that spec when it's built: **abandonment recovery with a
brain.** Today the cart-abandonment cron sends everyone the same template. Once the
doubt bot exists, its same knowledge layer can personalize the recovery hook (the person
who stopped at *pricing* gets a different message than the one who stopped at *date
selection* — you already track which step they reached in `flow_analytics`). Template
still goes out via AiSensy as today; the AI only picks/fills the variant. Small change,
directly aimed at the recovered-revenue number.

### 3.4 Scheduled Claude agents — the sleeper option you already own

Claude Code can run on a schedule in the cloud (no server of yours, no n8n). This is the
lowest-effort way to get "agentic" leverage, because the agent works on *artifacts for
you*, not on production systems:

- **Monday morning analyst:** reads last week's numbers (via the same read-only view as
  §3.2) and writes you a plain-English narrative — "completion recovered 4 points after
  the email-field change; Saturday's date is filling 2× faster than the last event" —
  the kind of interpretation the deterministic Daily Manager deliberately doesn't do.
  The Experiments proposal's daily snapshots make this dramatically better; another
  reason to build those before late September (the 90-day purge deadline).
- **Content producer:** new event announced → drafts poster concepts via your connected
  Canva, caption variants, WhatsApp broadcast copy — into a folder for you to pick from.
- **Weekly competitor watch:** checks the competitor set from `growth-research-proposals.md`
  for new event formats/pricing and appends to a running note.

All read-only or draft-only. Worst case: a bad draft you ignore.

---

## 4. The decision rule (keep this even if you ignore everything else)

Before automating anything, three questions:

1. **Does it touch money, customer messages, or booking statuses?**
   → It must be deterministic code in your Supabase stack, built and reviewed here.
   No AI decisions, no external workflow tools in the loop.
2. **Is it a fixed, repeating job?** (send X when Y happens, every day at Z)
   → pg_cron + edge function if it's core; n8n only if it's an edge/marketing flow
   that never needs DB write access.
3. **Is it open-ended?** (answer any question, write, summarize, interpret)
   → That's the only place AI belongs — and always read-only or draft-only, with a
   human (you) tapping send.

And one standing safety rule for any agent, anywhere: **agents get a dedicated
read-only key to a limited view, never the service-role key, and never standing access
to customer phone numbers.**

---

## 5. Prioritized roadmap

| # | What | Tool | Risk | Why this order |
|---|---|---|---|---|
| 1 | Daily snapshots + release log | existing stack | none | Deadline: June data purges ~late Sept. Everything analytical builds on it. *(Experiments proposal, Layers 1–2)* |
| 2 | Daily Manager morning brief | existing stack | none (read-only) | Biggest ops win; no AI needed. *(daily-manager-proposal.md)* |
| 3 | AI doubt bot | edge fn + Claude API | low (escalates to humans) | Directly converts hesitant buyers. *(ai-chatbot.md)* |
| 4 | "Ask Chaptera" Q&A in admin panel | edge fn + Claude API, read-only view | low | The safe version of the OpenClaw dream; reuses #3's plumbing. |
| 5 | Post-event feedback → review loop | existing stack (or n8n) | low | Reviews are the cheapest growth lever for experiential events. |
| 6 | Monday analyst + content producer | scheduled Claude agents | minimal (drafts only) | Needs #1's snapshots to be genuinely insightful. |
| 7 | Smarter abandonment messages | extension of #3 | low-medium | Only after the doubt bot's knowledge layer proves itself. |
| — | Instagram DM capture, invoice sheets | n8n, when 3+ such flows exist | low | Nice-to-haves; adopt n8n as a batch, not for one flow. |
| ✗ | OpenClaw against prod | — | **high** | Standing broad access + live PII + payments. The dream ships as #2 + #4 instead. |
| ✗ | Rebuilding existing automations in n8n | — | pointless | §2 — already live, already server-side. |

**Running costs if you do all of the green rows:** roughly the Claude API usage for the
doubt bot / Q&A / weekly agents (low tens of dollars a month at your traffic) and zero
new subscriptions until/unless you adopt n8n Cloud (~€20/mo). No new servers to maintain.

---

## 6. What to say when you're ready

Each row above is a self-contained ask to Claude Code:

- *"Build Layer 1 and 2 of the experiments proposal"* (#1)
- *"Build the Daily Manager from its proposal doc"* (#2)
- *"Build the doubt bot from ai-chatbot.md"* (#3)
- *"Add the Ask-Chaptera question box to the admin panel"* (#4)
- *"Build the post-event feedback loop with our Tally account"* (#5)
- *"Set up the Monday-morning analyst as a scheduled agent"* (#6)
