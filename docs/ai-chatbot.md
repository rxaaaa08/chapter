# AI Doubt-Solving Chatbot — Build Handoff

**Status: PROPOSAL ONLY — nothing built yet. No code has been changed.**
Written 2026-07-07 after a full read of the doubt-solving code. This file is the
single source of truth for a future Claude Code session to build the feature.
Read this top-to-bottom before touching code. Line numbers were accurate on
2026-07-07 and may have drifted — anchor on function/state names, not lines.

---

## 0. The idea in one paragraph

Today users can only tap pre-written FAQ chips; anything else goes to a manual
form (`plan_doubts` / `doubt_submissions`) that a human marketer answers later
on WhatsApp. We replace that dead-end with an AI answer layer: the user types
any question, a new Supabase edge function assembles a knowledge base
(live event facts from the DB + owner-written knowledge + FAQ answers), calls
the Claude API with strict guardrails and a brand-tone prompt, and returns an
instant answer in Chaptera's voice. If the bot can't answer, it escalates
through the **existing** human path (same tables, same admin push, same
marketer assignment) — the human safety net is never removed.

---

## 1. Current state of the doubt-solving code (as-read, 2026-07-07)

### 1.1 Booking/open flow — `src/AppFlow.tsx` (the `/plans` chat UI)

- Chat step machine. Relevant steps: `ASK_DOUBTS` → `SHOW_FAQ` → `DONE`
  (see `case 'ASK_DOUBTS'` ~line 1938, `case 'SHOW_FAQ'` ~line 1979).
- FAQ chips render from `selectedEvent.faqs` (the `faqs` **table**, joined in
  `src/supabase.ts` `fetchEvents()` via `faqs ( * )`; mapped at ~line 160 to
  `{question, answer}`). Clicked chips are tracked in `clickedFaqs` state so
  each chip is offered once.
- `handleFaqSelect` (~line 1552) plays the scripted answer with
  `simulateBotTyping`.
- "Other topic" doubt form: `showDoubtPopup` / `doubtFormData` state
  (~line 881), submitted by `handleDoubtSubmit` (~line 1645) →
  **INSERT into `doubt_submissions`** (name, phone, gender, doubt, why_join,
  event_title, event_id, event_category, city, selected_date, reporting_date,
  meeting_spot, transport, reporting_time, submitted_at). Fire-and-forget; the
  chat immediately shows "Got it! We'll contact you soon via WhatsApp".
- `doubtSubmittedThisSession` hides the doubt CTA after one submission.
- Doubt CTA label comes from `chat_messages` table key `doubt_cta_label`,
  default `'Vera Doubt Iruku'` (~line 1024).

### 1.2 Invite flow — `src/App.tsx` (invite chat)

- State machine `inviteChatStep`: `'prompt' | 'has_doubt' | 'other_topic' |
  'doubt_submitted' | 'waitlist'` (~line 1577).
- `has_doubt` step (~line 3227) renders chips from `events.invite_faqs`
  (**JSONB column on `events`**, mapped in `src/supabase.ts` ~line 164), plus
  "Other Topic", "Re-check plan details", and a pay button. The doubt chip is
  hidden for fully-paid guests (~line 3202).
- `other_topic` step (~line 3288): free-text `<textarea>` bound to `doubtText`,
  submitted by `submitDoubt` (~line 2351) → **INSERT into `plan_doubts`**
  (phone last-10, event_slug, message, status `'new'`). On success the chat
  shows "Got it! 👍 We'll reach out to you on WhatsApp soon." and moves to
  `doubt_submitted` (terminal — no more replies).

### 1.3 Dead live-chat infrastructure (IMPORTANT — reuse this)

Both `App.tsx` (~lines 2267–2349) and `AppFlow.tsx` (~lines 1603–1641) contain
a fully-wired Realtime chat client for `doubt_conversations` /
`doubt_messages`: load messages by `conversation_id`, subscribe to
`postgres_changes` INSERT/UPDATE, `sendLiveChatMessage` inserting
`{conversation_id, sender: 'user', body}`. **It has never worked in prod**:

- 0 rows ever in `doubt_conversations`/`doubt_messages` (comment at
  `App.tsx` ~line 1584 and ~2326).
- RLS (migration `20260601_lock_pii_tables.sql`) allows only:
  admin SELECT/UPDATE on both tables and admin INSERT on `doubt_messages`
  **with `sender = 'agent'`**. Anon INSERT on `doubt_conversations` is denied,
  so `startLiveChat` (~`App.tsx` line 2302) silently no-ops.
- The old push trigger on `doubt_messages` was dropped in
  `20260601_admin_push_triggers.sql` ("consumer PWA was removed;
  doubt_messages is unused").

These tables + the Realtime UI wiring are the natural storage/log layer for
the bot. All bot-era writes go through the edge function (service role
bypasses RLS), so anon policies stay locked.

### 1.4 Admin side — `src/AdminPanel.tsx`

- Open-flow FAQ editor edits the `faqs` table rows per event; invite FAQ
  editor edits `events.invite_faqs` JSONB with copy/paste-between-events
  support (~lines 2922–2977).
- People tab merges `doubt_submissions` (booking form) and `plan_doubts`
  (invite form) into outreach lists (~lines 627, 921–955). Note: comment at
  ~954 — `plan_doubts` rows have phone+event_slug and match applications;
  `doubt_submissions` rows have no event_slug.
- Admin push notifications fire on INSERT via DB triggers
  (`20260601_admin_push_triggers.sql`): `new_invite_doubt` (plan_doubts) and
  `new_booking_doubt` (doubt_submissions) → `send-admin-push` edge function.

### 1.5 Tables reference (verify columns with a SELECT before building)

| Table | Key columns | RLS |
|---|---|---|
| `plan_doubts` | id, phone (last-10), event_slug, message, status ('new'\|'replied'\|'closed'), created_at | anon INSERT ✔, authenticated INSERT ✔ (20260522 migration), admin/service read |
| `doubt_submissions` | name, phone, gender, doubt, why_join, event_title, event_id, event_category, city, selected_date, …, submitted_at | anon INSERT ✔ (verify), admin read |
| `doubt_conversations` | id (uuid), phone, name, event_slug, status ('open'\|'resolved') | admin SELECT/UPDATE only; **no anon INSERT** |
| `doubt_messages` | conversation_id, sender ('user'/'agent' — check constraint unknown, VERIFY), body, created_at | admin SELECT, admin INSERT as 'agent' only |
| `faqs` | event-joined rows: question, answer (+ event FK — verify exact FK column) | anon SELECT (joined in public fetch) |
| `events.invite_faqs` | JSONB `[{question, answer}]` | part of public events row |
| `event_dates` | start_date, status, label, booking_steps (JSONB, canonical 5 steps; index 2 = balance step, index 3 = meeting-spot step), whatsapp_group_url | public |
| `chat_messages` | step_key, bot_message — scripted copy templates | public |

Also available: `check_rate_limit(p_kind, p_key, p_window_seconds,
p_max_requests)` RPC (used by `get-user-context`), and anon-safe RPCs
`event_booking_counts(_by_date)` for spots-left.

### 1.6 Edge-function house style (copy from `supabase/functions/get-user-context/index.ts`)

- `Deno.serve`, `createClient` from `https://esm.sh/@supabase/supabase-js@2`
  with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env.
- CORS allowlist regex:
  `^https:\/\/(?:[a-z0-9-]+\.)?chaptera\.in$|^https:\/\/chapter-[a-z0-9-]+\.vercel\.app$|^http:\/\/localhost:\d{4,5}$`
  via a `corsFor(req)` helper; OPTIONS preflight; POST-only; `json()` helper
  with `Cache-Control: no-store`.
- `normalizePhone` → last 10 digits; `clientIp` from x-forwarded-for.
- Rate limiting via the `check_rate_limit` RPC, keyed per phone AND per IP.

---

## 2. Golden rules that constrain this build (from CLAUDE.md — non-negotiable)

1. **The Supabase DB is PRODUCTION.** Test with phone `90000000xx`, verify
   writes with `RETURNING`, delete test rows after. Never mutate rows with
   status `advance_paid`/`fully_paid`.
2. **Pushing to `main` deploys the live site.** Never push without explicit
   go-ahead in that conversation turn.
3. **Never deploy edge functions** — the owner deploys (or grants one-off
   approval). Write the function, hand over the deploy command.
4. `npm run dev` talks to PROD Supabase.
5. After every code edit: `npx tsc --noEmit` must pass.
6. One concern per commit; commit messages explain the why.
7. The owner is a no-code founder — explain every step in plain language and
   never assume he can edit code/config himself.

---

## 3. Target architecture

```
User types question in chat
        │
        ▼
POST /functions/v1/doubt-bot        (new edge function, anon-callable)
  { action: 'message', phone, event_slug, flow: 'invite'|'open',
    selected_date?, conversation_id?, message }
        │
        ├─ CORS + rate-limit (check_rate_limit: phone 20/hr, ip 40/hr)
        ├─ create/load doubt_conversations row (service role)
        ├─ ASSEMBLE KNOWLEDGE (service role reads):
        │    • events row (title, description, quickInfo, pickup_points,
        │      ticket_types, payment_mode, itinerary, accommodation,
        │      city_details, cta, invite_spots)
        │    • event_dates for the event (+ the user's selected_date steps —
        │      ALWAYS prefer per-date booking_steps over event-level fallback)
        │    • spots left via event_booking_counts_by_date RPC
        │    • faqs rows + events.invite_faqs
        │    • bot_knowledge rows (new table): global + per-event notes
        │    • if phone matches an applications row: status, selected_date,
        │      pickup, amounts (READ ONLY — never mutate applications here)
        ├─ CALL CLAUDE (Anthropic API, key in Supabase secrets)
        │    structured output: { answer, escalate, escalation_reason }
        ├─ LOG: insert user msg + bot msg into doubt_messages
        │    (sender 'user' / 'bot'), token usage into message meta
        └─ RETURN { conversation_id, answer, escalate }
        │
        ▼
Chat UI renders answer (existing bubble components)
  if escalate → show "Want me to get a human? 🙋" chip
       → taps → existing plan_doubts / doubt_submissions insert
         (unchanged: admin push trigger fires, marketer follows up)
```

Key decisions and why:

- **No RAG / vector DB.** Per-event knowledge is a few KB. Stuff everything
  into the prompt on every request. Simpler, cheaper, no retrieval failures.
- **Facts are injected server-side from the DB** (price, dates, spots,
  timeline). The bot physically cannot quote a stale price.
- **The HTTP response carries the reply** — the client does NOT need SELECT
  on `doubt_messages` (RLS stays locked). Realtime is only needed later for
  the optional human-handoff live chat (Phase 3+).
- **Escalation reuses the existing tables** so admin push triggers and the
  open-event marketer-on-doubt assignment (see memory note
  `open-event-marketer-assignment`) keep working with zero changes.

### 3.1 New edge function: `supabase/functions/doubt-bot/index.ts`

Actions (single endpoint, `action` discriminator):

- `message` — main path described above.
- `history` — optional: returns messages for `(conversation_id, phone)` pair
  (validate phone matches the conversation row, mirroring the
  `get-user-context` "you can only see data for the phone you supplied"
  model). Used to restore a chat after reload. Phase 2+.

Claude call — use the official SDK via Deno npm specifier:

```ts
import Anthropic from 'npm:@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

const response = await anthropic.messages.create({
  model: MODEL,                    // see §5 — env var BOT_MODEL, default claude-sonnet-5
  max_tokens: 1024,
  thinking: { type: 'disabled' },  // latency: FAQ answers don't need thinking
  output_config: {
    effort: 'low',
    format: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          answer:            { type: 'string' },
          escalate:          { type: 'boolean' },
          escalation_reason: { type: 'string' },
        },
        required: ['answer', 'escalate', 'escalation_reason'],
        additionalProperties: false,
      },
    },
  },
  system: [
    { type: 'text', text: BRAND_SYSTEM_PROMPT,          // stable — cacheable
      cache_control: { type: 'ephemeral' } },
    { type: 'text', text: eventKnowledgeBlock },        // per-event, per-request
  ],
  messages: conversationTurns,     // prior turns from doubt_messages + new msg
});
```

Notes for the builder:

- **Do NOT set `temperature`/`top_p`/`top_k`** — Claude Sonnet 5 rejects
  non-default sampling params with a 400.
- Parse the JSON from the text block with `JSON.parse` (structured outputs
  guarantee schema-valid JSON). Handle `stop_reason === 'refusal'` and
  `'max_tokens'` by returning a friendly fallback + `escalate: true`.
- Keep conversation history server-side: reload prior `doubt_messages` for the
  conversation and replay as alternating user/assistant turns (cap at last 12
  messages).
- Wrap the Anthropic call in a try/catch; on any API error return
  `{ answer: <friendly "I'm having trouble, want a human?">, escalate: true }`
  — the bot failing must never strand the user.
- Timeouts: Supabase edge functions default wall clock is generous, but set
  the SDK `timeout` to ~25s and return the fallback on timeout.

### 3.2 DB migrations (versioned files in `supabase/migrations/`, owner applies)

**Migration A — extend the conversation tables:**

```sql
-- 1. Allow 'bot' sender. FIRST verify the existing constraint:
--    select conname, pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'doubt_messages'::regclass;
--    If a CHECK on sender exists, drop + recreate as ('user','agent','bot').

-- 2. Conversation provenance + bot bookkeeping
alter table doubt_conversations
  add column if not exists handled_by  text not null default 'bot'
    check (handled_by in ('bot','human')),
  add column if not exists flow        text
    check (flow in ('invite','open')),
  add column if not exists selected_date date,
  add column if not exists escalated_at timestamptz;

-- 3. Per-message metadata (model, tokens in/out, latency) for cost tracking
alter table doubt_messages
  add column if not exists meta jsonb;
```

**Migration B — `bot_knowledge` (the owner-editable knowledge base):**

```sql
create table if not exists bot_knowledge (
  id          uuid primary key default gen_random_uuid(),
  event_slug  text,              -- NULL = global/brand-level knowledge
  title       text not null,     -- e.g. "Refund policy", "What to bring"
  content     text not null,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  updated_at  timestamptz not null default now()
);
create index if not exists idx_bot_knowledge_slug on bot_knowledge(event_slug);

alter table bot_knowledge enable row level security;
-- admin full access (mirror the is_admin() pattern from 20260601_lock_pii_tables.sql)
create policy "bot_knowledge_admin_all" on bot_knowledge
  for all to authenticated using (is_admin()) with check (is_admin());
-- no anon policies: only the edge function (service role) reads it
```

Remember: `Event.id` in the frontend = `events.slug` in the DB (CLAUDE.md).
`bot_knowledge.event_slug` should store the same slug the chat already has.

### 3.3 Secrets / config

- `ANTHROPIC_API_KEY` — owner creates an Anthropic Console account, generates
  a key, then: `npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
  (walk him through it; same pattern as `BREVO_API_KEY`, see memory note
  `brevo-email-invites`).
- `BOT_MODEL` secret (optional) so the model can be swapped without redeploy.
- Deploy command to hand the owner:
  `npx supabase functions deploy doubt-bot` (rule: **we never run this**).

---

## 4. Prompt design

### 4.1 System prompt (draft — tune with the owner during Phase 1 testing)

```
You are Chaptera's booking assistant, chatting with a customer inside the
Chaptera web app. Chaptera runs social experience events (treks, trips,
meetups) for young people in Tamil Nadu.

VOICE
- Warm, hype, big-sibling energy. Short messages (1-3 sentences, this is a
  chat bubble, not an email). Emojis welcome but max 1-2 per message.
- Casual Tanglish is on-brand when the user writes that way ("Vera doubt
  iruku?", "seri seri"). Mirror the user's language: English → English,
  Tamil/Tanglish → Tanglish.
- Never sound corporate. Never say "As an AI". You're part of the Chaptera
  team.

STYLE EXAMPLES (real Chaptera copy — match this energy)
- "Yo! 🤙 You're about to lock in your spot. All clear on the details?"
- "No sweat! Here's what people usually ask."
- "Hope that clears it up! Got anything else, or are we locking this in?"

HARD RULES
1. Answer ONLY from the EVENT FACTS and KNOWLEDGE sections below. If the
   answer isn't there, do NOT guess — set escalate=true and tell the user
   you're getting a teammate to help on WhatsApp.
2. Prices, dates, spots left, meeting points and timings in EVENT FACTS are
   live from our system — quote them exactly. Never invent or round them.
3. Never promise refunds, discounts, date changes or exceptions beyond what
   KNOWLEDGE explicitly states. If asked, escalate.
4. Payments happen only through the app's pay buttons. Never share account
   numbers or take payment details in chat.
5. If the user is angry, distressed, or asks for a human: escalate
   immediately with a kind message.
6. Keep it to the point. One question → one answer. Offer the booking nudge
   only when the user seems satisfied.

OUTPUT
Respond with JSON: { "answer": string, "escalate": boolean,
"escalation_reason": string ("" when escalate is false) }.
"answer" is shown to the user as a chat bubble even when escalating —
so when escalating, the answer should say a human will reach out on WhatsApp.
```

### 4.2 Event knowledge block (assembled per request by the function)

```
## EVENT FACTS (live from database — trust these over everything)
Event: {title} ({slug}) — {category}, {city}
Payment mode: {split: advance ₹X + balance ₹Y | full: ₹Z one-time}
Dates: {for each event_date: date, label, status, spots left}
User's selected date: {date} — timeline steps: {booking_steps for that date,
  incl. balance-due step (index 2) and meeting-spot step (index 3)}
Pickup points: {label, meetingSpot, time, transport}
{if applications row for this phone: Your booking status: {status},
 amount paid / balance due summary}

## FAQS (owner-written Q&A for this event)
{faqs rows + invite_faqs, "Q: ... A: ..." pairs}

## KNOWLEDGE (owner-written notes)
{bot_knowledge global rows, then event rows, ordered by sort_order}
```

Do not include other customers' data, admin data, or anything not listed
above. The phone's own application row is the only per-user data allowed.

---

## 5. Model choice & cost

| Model | ID | $/MTok in/out | ~₹/conversation* | Use |
|---|---|---|---|---|
| Haiku 4.5 | `claude-haiku-4-5` | $1 / $5 | ₹1–2 | cost floor, fine for plain FAQ |
| **Sonnet 5 (recommended)** | `claude-sonnet-5` | $3 / $15 (intro $2/$10 through 2026-08-31) | ₹3–6 | best tone-match + escalation judgment per rupee |
| Opus 4.8 | `claude-opus-4-8` | $5 / $25 | ₹10–15 | likely overkill here |

*Assumes ~4k-token system+knowledge prompt × 2–3 turns, ~150-token answers.
Owner decided (2026-07-07 session): start with Sonnet 5, revisit after
reading Phase 2 logs. Model is a one-line env-var swap (`BOT_MODEL`).

Cost controls built in: rate limits (§3.1), 12-message conversation cap,
`max_tokens: 1024`, per-message token logging in `doubt_messages.meta`
(so the admin review screen can show ₹ per conversation), and
`cache_control` on the stable brand system prompt.

---

## 6. Build phases

### Phase 0 — prerequisites (no user-visible change)

1. Owner: Anthropic account + API key → Supabase secret (§3.3).
2. Verify `doubt_messages.sender` constraint (§3.2 Migration A step 1) with a
   read-only query; write Migrations A + B; owner applies (or approves MCP
   `apply_migration` one-off).
3. Build `supabase/functions/doubt-bot/index.ts` per §3.1. `npx tsc --noEmit`
   for the frontend is unaffected; sanity-check the function with
   `deno check` if available.
4. Owner deploys the function. Test with curl using test phone `9000000001`
   and a real event slug; verify: reply JSON sane, `doubt_conversations` +
   `doubt_messages` rows created (`RETURNING`/SELECT), rate limit kicks in.
   **Delete test rows afterwards.**

Acceptance: curl returns an on-brand answer citing a real price from the DB;
a made-up question ("can I bring my horse?") returns `escalate: true`.

### Phase 1 — invite chat integration (smallest audience first)

Files: `src/App.tsx` only.

1. In the `other_topic` step (~line 3288): keep the textarea, but on send call
   `doubt-bot` instead of inserting into `plan_doubts` directly. Show the
   existing typing indicator (`simulateInviteTyping`) while awaiting; render
   `answer` with `addInviteBotMsg`. Store `conversation_id` in component state
   (and `sessionStorage` for reload survival).
2. After a bot answer, stay in a new `bot_chat` step: textarea remains for
   follow-ups + two chips: "That helps! 🙌" (→ back to `has_doubt` chips) and
   "Talk to a human 🙋".
3. "Talk to a human" (and any `escalate: true` response) → insert into
   `plan_doubts` exactly as `submitDoubt` does today, with
   `message = last user question + ' [bot conv ' + conversation_id + ']'`,
   then show the existing "We'll reach out on WhatsApp" copy and move to
   `doubt_submitted`. This keeps the admin push trigger + People-tab flow
   untouched.
4. Error path: fetch failure → apologetic bubble + straight to the
   `plan_doubts` fallback (the current behavior, effectively).
5. Do NOT touch the FAQ chips, the paid-guest chip hiding, or `AppFlow.tsx`.

Verification: `npx tsc --noEmit`; preview server (launch.json "Vite Dev
Server", port 3000) with test phone `9000000001` on a real invite link —
this writes real rows in prod, so clean up `doubt_conversations`,
`doubt_messages`, `plan_doubts` test rows after. Confirm a real admin push
fires on escalation (warn the owner first — it pings his phone).

Ship: isolated commit(s); owner's explicit go-ahead before push (deploys the
site). Use the `/ship` skill.

### Phase 2 — admin panel: knowledge editor + conversation review

Files: `src/AdminPanel.tsx`, maybe a small new component file.

1. **Bot knowledge editor**: new section in the event editor (next to the
   invite-FAQ editor, ~line 2922) CRUDing `bot_knowledge` rows for that
   event_slug, plus a "Global knowledge" panel (event_slug NULL). Admin is
   authenticated so RLS policy from Migration B applies directly — no edge
   function needed.
2. **Conversation review screen**: list `doubt_conversations` (admin SELECT
   already allowed) newest-first with expandable transcript from
   `doubt_messages`, per-conversation token/₹ total from `meta`, and badges:
   escalated / resolved-by-bot.
3. **"Promote to FAQ" button** on any user question: prefills a new
   `invite_faqs`/`faqs` entry (this IS the training loop).
4. Optional: thumbs up/down on each bot bubble (user side) writing into
   `doubt_messages.meta.feedback` via a `feedback` action on the edge function.

Admin views sit behind login — not drivable in preview. Verify via tsc + SQL
simulation (CLAUDE.md Verification section).

### Phase 3 — open/booking flow + extras

1. Mirror Phase 1 in `src/AppFlow.tsx`: replace the doubt form's
   fire-and-forget with the bot; escalation falls back to the existing
   `doubt_submissions` insert (keeps `new_booking_doubt` push + open-event
   marketer-on-doubt assignment intact).
2. Optional **human handoff live chat**: when a marketer replies from the
   admin panel (`doubt_messages` INSERT as 'agent' — policy already exists),
   let the user receive it. Options: (a) polling the `history` action, or
   (b) a narrowly-scoped anon SELECT policy / Realtime. Decide then; (a) is
   safer. The client Realtime wiring already exists (§1.3) if (b) is chosen.
3. Optional: pre-booking bot entry point (answer questions before date
   selection), "was this helpful?" analytics, weekly digest of unanswered
   questions.

---

## 7. Guardrails checklist (enforce in code review before each ship)

- [ ] API key only in Supabase secrets; never in the client bundle.
- [ ] All DB writes in the function use service role; anon RLS unchanged.
- [ ] Rate limits per phone + per IP via existing `check_rate_limit` RPC.
- [ ] Message length cap (~500 chars in), 12-message conversation cap,
      `max_tokens` cap out.
- [ ] Prompt injects ONLY: event public data, this phone's own application
      row, owner-written knowledge. Never other users' rows.
- [ ] Every bot failure path degrades to the human escalation flow.
- [ ] `applications` is read-only in this feature. No status mutations, ever.
- [ ] Test rows use phone `90000000xx` and are deleted after verification.
- [ ] tsc passes; commits isolated; no push or function deploy without the
      owner's explicit go-ahead in that turn.

## 8. Open items for the owner (ask at build kickoff)

1. Anthropic account + key ready? (Phase 0 blocker.)
2. Confirm Sonnet 5 as launch model (decision from 2026-07-07 proposal
   session; cheap to change later).
3. Review/edit the §4.1 system prompt voice — especially the Tanglish rules.
4. First batch of global `bot_knowledge` content: refund policy, safety,
   what-to-bring, who-is-chaptera. Bot quality is capped by this content.
5. OK to receive test admin pushes during Phase 1 verification?
