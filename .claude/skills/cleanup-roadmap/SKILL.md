---
name: cleanup-roadmap
description: Rewrite the auto-generated product-roadmap cards into plain-English, business-logic sentences so a no-code founder can read them. Finds roadmap_features rows whose description is still boilerplate (or that the user names) and rewrites each into one clear sentence about what it does for the guest/business. Use when the user says "clean up the roadmap", after a push created new boilerplate cards, or names specific cards to rephrase.
---

# /cleanup-roadmap — plain-English roadmap descriptions

The owner is a **no-code founder** tracking the features they build. Every push to `main`
auto-creates a "Need Testing" card in `roadmap_features` (GitHub Action `log-release.yml`
→ `feature_releases` → `sync_release_to_roadmap()` trigger). New cards arrive with:
- a **title** = the raw git commit first line (developer-speak), and
- a **description** = boilerplate: `Added automatically from the release log (git · commit … on …).`

This skill rewrites those into readable sentences. It only edits the `description` column
(and, when a title is pure jargon, may gently clarify the title) of `roadmap_features` on
the PROD Supabase project (`txcmismkdttgsyhbnexf`) via the Supabase MCP `execute_sql` tool.
It never touches customer, payment, or application data. Decision to leave the trigger/robot
unchanged and rewrite by hand was made 2026-07-14 (see memory `roadmap-card-plain-english`).

## 1. Find the cards that need rewriting
If `$ARGUMENTS` names specific cards, target those by title. Otherwise sweep the boilerplate:
```sql
select id, title, description, status, created_at
from roadmap_features
where archived = false
  and (description is null
       or description ilike 'Added automatically from the release log%'
       or description ilike '%Backfilled from git:%')
order by created_at desc;
```
If nothing matches, tell the user the board is already clean and stop.

## 2. Rewrite each one
For every card, write **one plain-English sentence** (occasionally two) describing what the
feature does **for the guest or the business** — the outcome, not the code. Rules:
- Voice = the batch cleaned on 2026-07-14: concrete, friendly, no jargon.
- **Strip all commit hashes** and release-log references — those are code logic, not business logic.
- Say "guest" for a customer, name real surfaces (People tab, Manager tab, plans chat, bill page).
- **Internal / developer-only changes** (docs, DB housekeeping, reverted commits, secret/key
  changes, build-tooling) get an honest label, not an invented benefit:
  `Internal <thing> only. No change to the live site or the customer experience.`
- If a title is unreadable jargon (e.g. "Reuse fresh get-user-context result across invite
  verify steps"), you may also set a clearer title — but keep it faithful to what shipped.
  When unsure what a card actually did, read the commit or the code before guessing.

## 3. Apply as one guarded UPDATE, verify with RETURNING
Batch all rewrites into a single statement so it is one clean write:
```sql
update roadmap_features as r
set description = v.description, updated_at = now()
from (values
  ('<uuid>', '<new plain-English description>'),
  ('<uuid>', '<new plain-English description>')
  -- one row per card
) as v(id, description)
where r.id = v.id::uuid
returning r.id, r.title, r.description;
```
Escape apostrophes by doubling them (`''`). Read the RETURNING output back to confirm every
row updated as intended.

## 4. Report
Show a short before → after table of what changed (mask nothing — this is internal roadmap
copy, not customer data). If any card was ambiguous and you guessed, flag it so the owner can
correct it. Do not archive or delete cards unless the user explicitly asks.
