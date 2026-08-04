# Instagram in-app browser: making the back chevron close in-page bottom sheets

**Status: SOLVED and shipped 2026-08-04**, confirmed working on device. Kept as a full research record — the answer, every method tried, the BookMyShow comparison data, and what is still open.

Written for someone continuing the research. Everything below was **measured on a real iPhone**, not inferred. Where something is a guess it says so.

---

## 1. The answer

**Instagram's iOS in-app browser only registers a history entry with its back chevron when that entry carries a URL DISTINCT from the current one.**

Every `pushState` in the app passed `window.location.href` — an identical URL — so every entry our bottom sheets created was invisible to the chevron. It stayed greyed out for the entire booking flow, and a greyed chevron does nothing when tapped.

Nothing was ever wrong with our sheet-closing logic. The `popstate` handler and the whole layer stack worked correctly inside Instagram the entire time — proved early by the HASH probe, which fires `popstate` and closed sheets every time.

### The fix

Each sheet/step owns a query value, so its entry carries a distinct URL:

| Flow | Helper | URL shape |
|---|---|---|
| `/plans` (11 bottom sheets) | `sheetUrl()` in `src/AppFlow.tsx` | `/plans?sheet=details-calendar` |
| `/invite` (14 steps) | `inviteStepUrl()` in `src/App.tsx` | `/invite?step=timeline` |

Both **push** when a layer deepens and **replace** when it shallows, so the URL always names what is on screen, closing a sheet with its own X cannot strand the URL, and no phantom entries accumulate. The rest of the query string is preserved (`ref` for creator attribution, `preview_event`, `dbg`). Payment return URLs are built server-side and never see any of this.

Commits: `73810f2` (`/plans` sheets), `ca79a6a` (the details trap, initially missed), `d33af0e` (invite flow).

### Rules that follow

- **Never `pushState(state, '', window.location.href)`.** An entry must carry a distinct URL or Instagram cannot see it.
- **A hash is not enough.** `location.hash = x` creates an entry and fires `popstate`, but never activated the chevron.
- **Registration happens at push time.** A later `replaceState` cannot rescue an entry pushed at the current URL — but pushing distinct *then* replacing back works fine, and keeps the visible URL unchanged. (This is what BookMyShow does.)
- **Grep for every `pushState`, not just the obvious one.** The details trap has its own push inside the `popstate` handler and was missed on the first pass. Symptom of a missed site: **back works exactly once, then the chevron goes dead.**

---

## 2. Every method tried

Chronological. Four theories were built or half-built before the right one; the dead ends are the expensive part to rediscover.

| # | Theory | How it was tested | Result |
|---|---|---|---|
| 1 | Sheets simply had no history entries wired | Added layers for 3 unmanaged sheets (`99411e2`) | Correct work, but unrelated to the Instagram problem |
| 2 | "Instagram ignores same-document entries entirely — platform ceiling" | Reasoned from `POPS=0` + greyed chevron | **Wrong.** BookMyShow does exactly this and works |
| 3 | Sheets need unique URLs per step | Killed prematurely on a misread of the BookMyShow URL evidence | **Was actually right** — see §4 for how it was wrongly dismissed |
| 4 | WebKit requires `pushState` inside the user gesture (ours run in a React passive effect, after paint) | **Built and shipped** — moved the calendar's push into its tap handler (`584abe5`) | **No change on device.** Reverted (`035ff7b`) |
| 5 | Instagram only enables the chevron after a committed document load; put one real navigation in the flow | Built the `/lifestyle → /plans` hop as a real navigation | **Wrong** — BookMyShow activates it with no committed load at all. Reverted before shipping |
| 6 | A `beforeunload` handler is blocking the traversal | Grepped the codebase | No such listener exists anywhere |
| 7 | **The entry needs a distinct URL** | `PUSH-URL` + `PUSH+REPL` probes on device | **CORRECT** — both activate the chevron |

### The probe results that settled it

An opt-in readout at `?dbg=1` reports `path`, whether the layer system is armed, the current layer, `history.length`, a `pushState` count, and **`POPS`** — every `popstate` the page receives, from a listener independent of the app's own.

| Entry created | URL vs current | Chevron |
|---|---|---|
| our sheet `pushState` | **identical** (`window.location.href`) | stays grey |
| `location.hash = x` | fragment only | stays grey |
| `pushState` with a distinct URL | **distinct** | **activates** |
| `pushState` distinct → `replaceState` back | **distinct at push time** | **activates** |
| committed document load | distinct | activates |

Other measurements worth keeping:

- With the calendar open and the chevron grey: `len=3, push=2, POPS=0`. The entries existed and WebKit had recorded them; Instagram simply did not count them.
- **HASH closed sheets perfectly every time** while never lighting the chevron — which is what proved our `popstate` path was healthy and sent the search toward chevron *activation* rather than sheet code.
- After a committed load the chevron activated but pressing it did nothing, moving no counter. Explained in hindsight: the sheet's own entry was still pushed at an identical URL, so there was nothing traversable above.
- Safari on the same iPhone always worked correctly. This was never WebKit-wide, only Instagram.

---

## 3. The BookMyShow comparison

BookMyShow's bottom sheets close on back inside the Instagram in-app browser. It was the existence proof that kept the search alive after theory 2 declared it impossible.

**Observed on device, arriving via a Linktree page:**
- Tab opens with the back chevron **already active**, forward inactive.
- Open a bottom sheet → back chevron closes it.
- Close the sheet → **forward** chevron becomes active and **re-opens** it.

**Observed opening a sheet's page URL directly — first page in a fresh tab, the same condition as our failing test:**
- Both chevrons initially **inactive**.
- **Opening the bottom sheet activates the back chevron.** ← this killed theory 5.
- Closing it activates forward and deactivates back.

Two inferences:
- Their sheet-close calls `history.back()`, not a state setter — otherwise forward could not re-open the sheet. **Ours still close by setting state**, which leaves the history pointer above a dead entry. A real difference in stack hygiene, still unaddressed (§5).
- A same-document entry *can* light the chevron, with no page load anywhere.

**Their URLs, diffed properly** (sheet open vs closed, copied out of Instagram via "Open in browser"):

```
1: …/movies/mumbai/the-odyssey/ET00452034?utm_source=Meta&…&_branch_referrer=…&_branch_match_id=…&utm_content=link_in_bio&fbclid=…
2: …/movies/mumbai/the-odyssey/ET00452034?utm_source=Meta&…&utm_content=link_in_bio&fbclid=…
```

| | Result |
|---|---|
| Path | **identical** |
| Fragment | **none in either** |
| Only in URL 1 | `_branch_referrer`, `_branch_match_id` |
| Differing value | `fbclid` |

Everything that differs is *inbound* tracking — Branch.io deep-link params and a Facebook click id. **Sheet state is genuinely not in their URL.**

But the same diff shows the mechanism: `_branch_*` present in one capture and gone in the other proves **BookMyShow rewrites its own URL after load**, i.e. calls `replaceState` on itself. Combined with §1, their sheet-open is consistent with *push a distinct URL, then replace back* — which lights the chevron while leaving nothing visible or copyable behind. Our `PUSH+REPL` probe reproduces exactly that behaviour.

Their `history.state` is `{"idx":0}` — router-managed, React Router-shaped.

**Caveat on the URL evidence:** the differing `fbclid` means the two captures came from separate link clicks, not one session sampled twice. The conclusion holds because neither URL contains anything sheet-shaped, but it is not a perfect same-session comparison.

---

## 4. Where the investigation went wrong

Worth recording, because the same trap is easy to fall into again.

**The unique-URL theory (3) was right and was dismissed twice.** First on the owner's report that BookMyShow's URL "doesn't differ" — which was true, but only because they push distinct and replace back. Second when the paste test showed both copied links opening with the sheet closed; that tested *paste behaviour*, not string equality, and a non-restored param would look identical.

**Lesson:** "the URL is the same" and "the entry was pushed at the same URL" are different claims. Only the second one matters, and it is not observable from outside the page.

**A second failure mode:** several conclusions were drawn from the headless preview browser, which cannot render this app faithfully — Framer Motion does not animate there, so sheets sit in the DOM at `translateY(100%)` and DOM-presence checks report closed sheets as open. One "my fix is broken" conclusion was pure tooling artefact.

---

## 5. Still open

- **Sheets close by setting state, not `history.back()`.** BookMyShow does the latter (their forward chevron re-opens the sheet). Ours leaves the history pointer stranded above a dead entry, so the stack drifts out of sync with the screen. It works today because the `popstate` handler acts on the *current visible layer* rather than on the popped entry, but it is untidy and is the likeliest source of future edge cases.
- **`?sheet=` / `?step=` are not restored on load.** Reloading or sharing one lands on the flow's start with the sheet closed. Harmless; a possible improvement, and it would make steps genuinely deep-linkable.
- **The details-sheet trap is now live for Instagram traffic.** Back on the plan details page force-opens the plan switcher and re-arms, so back can never leave from there. Deliberately kept by the owner — but that decision was made while the chevron was dead in Instagram, i.e. when it only affected Safari. It now applies to the majority of traffic.
- **The invite flow fix is unverified on device.** The code change is mechanical and safe by construction (the invite `popstate` handler reads component state, never `history.state`), but reaching those steps locally needs a real invited phone number, which would write to the production database.
- **Why an activated chevron did nothing after a committed load** is explained only in hindsight (§2) and was never re-tested directly.

---

## 6. Reproducing and debugging

**The readout:** append `?dbg=1` to any `/plans` URL. Shows `path`, `armed`, `layer`, `len`, `push`, `POPS`, plus four probes — `REAL NAV`, `HASH`, `PUSH-URL`, `PUSH+REPL`. Without the flag nothing renders and `pushState` is not even patched, so customers run unmodified code. It is inert in production and is what solved this.

**Verification gotchas that cost real time:**
- AnimatePresence sheets sit in the DOM at `translateY(100%)` after closing — check `getBoundingClientRect().top` against `innerHeight`, never node presence.
- The browser screenshot tool returns a blank white image once the details overlay is open.
- Framer Motion does not animate in the headless preview at all, so elements stay at their `initial` state and real pointer clicks miss. Drive the flow with JS clicks and verify by state, not pixels.
- Testing repeatedly in one tab pollutes `history.length`; start a fresh tab for anything history-sensitive.

**Relevant files:**

| File | What's in it |
|---|---|
| `src/AppFlow.tsx` | `/plans`. `sheetUrl()`, `HistoryLayer` + depths, `activeHistoryLayer`, the push effect, the `popstate` handler (including the details trap and its own push), and the `?dbg=1` readout |
| `src/App.tsx` | Routing shell, and the invite flow: `inviteStepUrl()` plus 14 step pushes and their `popstate` handler |
| `src/inAppBrowser.ts` | Instagram/Facebook webview detection and safe outbound navigation |
