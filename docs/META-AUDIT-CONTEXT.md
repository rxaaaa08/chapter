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

## 4. Keeping this file true

Whoever settles a finding adds it here in the same session, with the date and the
measurement behind it. An entry with no evidence is worse than no entry, because
it silences a check without justifying it. If a settled entry is ever reopened,
say so here rather than deleting it — a future auditor needs to know it was
considered.
