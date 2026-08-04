# Instagram in-app browser: back chevron does not close our bottom sheets

**Status: UNSOLVED.** Written 2026-08-04. Self-contained — everything below was measured, not assumed. Where something is a guess it says so.

This document is a research brief. The goal is to find out **what a web page must do so that the Instagram in-app browser's back chevron (iOS) becomes active and closes an in-page bottom sheet**, given that a competitor site (BookMyShow) demonstrably achieves it.

---

## 1. The product context (why this matters)

Mobile-first booking web app (React + Vite + TypeScript SPA). Practically all traffic arrives from Instagram, and since 2026-08-04 visitors browse and pay **inside the Instagram in-app browser** rather than being pushed out to Safari.

The booking flow is a chat-style SPA at `/plans`. It is one single document from landing to payment, and the user meets **eleven different bottom sheets** along the way (plan details, calendar, booking timeline, details form, application form, T&C, policy sheets, doubt popup, plan switcher, community sheet, payment views).

The user's expectation — and the behaviour on competitor sites — is that the browser back button closes the top bottom sheet. On our site inside Instagram it does nothing at all, for every sheet, for the entire flow.

**Business impact:** a customer who taps back mid-booking gets no response. Instagram's chevron is the only navigation affordance in that browser (no URL bar, no edge-swipe).

---

## 2. What our code does

### 2.1 The layer stack

All sheets are driven by one derived "layer" value in `src/AppFlow.tsx`:

```ts
type HistoryLayer = 'event-details' | 'details-calendar' | 'details-plan-switcher'
  | 'post-details-chat' | 'community-sheet' | 'doubt-popup' | 'booking-timeline'
  | 'application-form' | 'details-form' | 'payment-checkout' | 'payment-success'
  | 'payment-failure' | 'policy-modal' | 'tc-modal';
```

Three pieces work together:

1. **`activeHistoryLayer`** — a derived ternary chain, ordered deepest-first. Whatever sheet is visually on top is the current layer.
2. **A push effect** — a `useEffect` watching `activeHistoryLayer`. When the layer gets deeper it pushes a history entry:
   ```ts
   window.history.pushState({ chapteraLayer: nextLayer }, '', window.location.href);
   ```
3. **A `popstate` handler** — maps each layer to its "go back one" action (close this sheet, restore the one beneath).

### 2.2 The critical detail

**Every `pushState` call in the app passes `window.location.href` — the URL never changes.** There are 17 such call sites across the two flows. The entire booking flow, landing to payment, lives at one URL.

### 2.3 Entry path

A real customer's journey, and it matters:

| Step | Mechanism | Committed document load? |
|---|---|---|
| Instagram link → `/lifestyle` | first page in a fresh tab | yes (the initial load) |
| `/lifestyle` → `/plans` | `history.pushState({}, '', '/plans')` | **no** |
| every bottom sheet after that | `history.pushState(..., location.href)` | **no** |

There is **no Linktree or intermediate page**. `/lifestyle` is the first page the customer ever sees, and nothing behind it in the tab.

---

## 3. Measurements (all on a real iPhone, Instagram in-app browser)

An opt-in debug readout was shipped behind `?dbg=1` to get ground truth. It displays `path`, whether the layer system is armed, the current layer, `history.length`, a count of `pushState` calls, and **`POPS`** — a count of every `popstate` event the page receives, from a listener deliberately independent of the app's own.

### 3.1 Our site

| Observation | Result |
|---|---|
| Open `/plans?dbg=1` directly (first page, fresh tab) | `len=1`, chevron **greyed** |
| Open plan details + calendar (2 × `pushState`, same URL) | `len=3, push=2, POPS=0`, chevron **still greyed** |
| Press the greyed chevron | nothing |
| Press **HASH** probe (`location.hash = 'hNNNN'`) | chevron **still greyed** — but the sheet **closes correctly** |
| Press **REAL NAV** probe (`<a href>` to a distinct URL, full document load) | chevron **becomes active** |
| With chevron active, open calendar, press chevron | **nothing happens** — sheet stays open, and `len`, `push`, `POPS` do not move at all |

### 3.2 BookMyShow (the working comparison)

Tested two ways.

**Arriving via a Linktree page (a real navigation behind it):**
- Tab opens with back chevron **already active**, forward inactive.
- Open bottom sheet → back chevron closes it.
- Close bottom sheet → **forward** chevron becomes active and **re-opens the sheet**.

**Opening the sheet's page URL directly (first page in a fresh tab — same conditions as our failing test):**
- Both chevrons **inactive** initially.
- **Open the bottom sheet → the back chevron becomes ACTIVE.**
- Close the bottom sheet → forward chevron active, back chevron inactive.

**URL behaviour — the two copied URLs have now been diffed directly:**

```
1: …/movies/mumbai/the-odyssey/ET00452034?utm_source=Meta&…&_branch_referrer=…&_branch_match_id=…&utm_content=link_in_bio&fbclid=…
2: …/movies/mumbai/the-odyssey/ET00452034?utm_source=Meta&…&utm_content=link_in_bio&fbclid=…
```

| | Result |
|---|---|
| Path | **identical** — `/movies/mumbai/the-odyssey/ET00452034` |
| Fragment / hash | **none in either** |
| Only in URL 1 | `_branch_referrer`, `_branch_match_id` |
| Differing value | `fbclid` |

Everything that differs is *inbound* tracking (Branch.io deep-link params, a Facebook click id) — nothing a sheet-open would add. **Sheet state is definitively not encoded in the URL.**

Two inferences worth carrying forward:
- The differing `fbclid` means these came from two separate link clicks, so it is not a perfect same-session capture. The conclusion holds anyway because neither URL contains anything sheet-shaped.
- `_branch_*` present in one and absent in the other proves **BookMyShow rewrites its own URL after load** (standard Branch SDK cleanup). So they demonstrably call `replaceState` on themselves. See §6.

**Inspected from a desktop harness:** BookMyShow's `history.state` is `{"idx":0}` — the shape of a router-managed history (React Router-like). Could not drive their sheets programmatically; their site blocks the automation tooling used.

---

## 4. What these measurements establish

**Confirmed:**

1. **Our popstate handling works perfectly inside Instagram.** The HASH probe fires `popstate`, our handler runs, and sheets close correctly every time. Nothing about our sheet-closing logic is broken on that browser.
2. **Instagram's chevron CAN traverse same-document entries.** BookMyShow does it, first page in a fresh tab, no page load, same URL when pasted.
3. **A same-document entry CAN activate the chevron.** BookMyShow activates it purely by opening a sheet.
4. **Our same-URL `pushState` entries never activate it**, no matter how many are pushed (`len=3`, `push=2`, still grey).
5. **A hash change does not activate it** either.
6. **A committed document load DOES activate it** — but the activated chevron was then completely inert (no sheet close, no counter movement).
7. **Safari on the same iPhone works correctly** on every sheet. This is Instagram-specific, not WebKit-wide.

**The unexplained anomaly:** after REAL NAV the chevron was active yet pressing it did nothing measurable — not a traversal, not a navigation, no `popstate`, no change in `len`. No theory so far accounts for this.

---

## 5. Ruled out (do not re-propose without new evidence)

| Theory | How it died |
|---|---|
| "Instagram ignores same-document `pushState` entirely; it's a platform ceiling" | BookMyShow does exactly this and works. |
| "Sheets need unique URLs per step — that's how BookMyShow does it" | Dead **as a description of BookMyShow**: the two copied URLs were diffed and the sheet state is not in the URL at all (§3.2). Still open as a *fix for us* — see §6, because whether a distinct URL lights **our** chevron is a separate question from whether BMS uses one. |
| "WebKit requires `pushState` inside the user gesture" — our pushes happen in a React passive effect, after paint, outside the gesture | **Built and shipped** (moved the calendar's push into its tap handler, commit `584abe5`). No change on device. Reverted in `035ff7b`. Also never explained why Safari works, since both are WebKit. |
| "Instagram only enables the chevron on committed document loads, so put one real navigation in the flow" | BookMyShow activates it with **no** committed load, first page in a fresh tab. |
| "Our page blocks the navigation with a `beforeunload` handler" | Grepped — no `beforeunload`/`unload`/`pagehide` listener is registered anywhere (only stale comments referencing a removed one). |

---

## 6. The remaining lead, and the two live probes

Every `pushState` we make passes `window.location.href` — an entry whose URL is **identical** to the current one. Those never light the chevron. A committed load lights it; a hash change does not; BookMyShow lights it with a same-document, same-URL sheet-open. Nobody has yet established what the webview actually keys on.

There is a mechanism that fits **every** observation simultaneously:

> Push an entry carrying a **different** URL (which may be what lights the chevron), then immediately `replaceState` back to the original URL. The entry keeps whatever property the webview decided at push time, while the visible and copyable URL never changes.

This reconciles the two facts that otherwise contradict each other — the chevron lights on sheet-open, yet the copied URL is unchanged — and BookMyShow is already known to call `replaceState` on itself (their Branch params vanish between the two captures, §3.2).

**Two probes are live in the `?dbg=1` readout and NEITHER HAS BEEN RUN ON THE DEVICE YET.** These results are the first thing to ask for:

| Probe | What it does | Verified locally |
|---|---|---|
| `PUSH-URL` (`3e12bba`) | same-document `pushState` with a genuinely distinct URL, from inside the tap, no reload | URL changes, `len` +1, no reload |
| `PUSH+REPL` | pushes a distinct URL then instantly `replaceState`s back to the original | `len` +1, **URL visibly unchanged**, entry still traversable (`POPS=1` on back) |

Interpretation:
- **Either lights the chevron** → that is the fix; apply the same call at every sheet open. Prefer `PUSH+REPL` if both work, since it keeps our URLs clean.
- **Neither lights it** → the History API is not the mechanism at all, and the answer is in whatever else BookMyShow's page does.

One more asymmetry worth investigating: BookMyShow's sheet-close leaves a **forward** entry (pressing forward re-opens the sheet), so they close via `history.back()`. Our sheets close by setting component state directly, which strands the history pointer above a dead entry. That is a real difference in how the stack is maintained, independent of how entries are created.

---

## 7. Questions for research

1. What exactly governs whether the Instagram iOS in-app browser enables its back chevron? It is not simply "a committed document load" (BookMyShow disproves it) and not simply "any history entry" (our `pushState` and hash entries disprove it).
2. Does Instagram's chevron distinguish `pushState` entries by whether the URL differs from the current one?
3. Why would a chevron that is *enabled* (after a real document load) then do nothing at all when pressed — no navigation, no `popstate`, no history movement?
4. Does Instagram's iOS webview maintain its own navigation stack (e.g. from `WKNavigationDelegate` callbacks, which do not fire for same-document navigations) separate from the `WKWebView` back-forward list, and if so what writes to it?
5. What precisely does BookMyShow's bottom-sheet open call? (A network-level or JS-level capture of their `history.*` calls at sheet-open would answer this outright and end the investigation.)

---

## 8. What a solution must satisfy

- Works in the Instagram in-app browser on **iOS**.
- Must not regress Safari, Chrome, or Android, where back already works correctly.
- The site is a **single-document SPA**; a full page reload per sheet open is not acceptable in a chat-style booking flow.
- Must not break creator attribution: `?ref=<handle>` is captured into `sessionStorage` on first load and read at booking time.
- The flow takes **real payments**; changes ship to production and are tested by hand on a phone, so cheap and reversible beats clever.

**Fallback if the chevron is genuinely unreachable:** in-page dismissal — swipe-down-to-dismiss on the sheets. No sheet currently has it (no `drag`/`onDragEnd` anywhere in `src/AppFlow.tsx`); every sheet does have a close button or backdrop tap, so nothing is a dead end today. This is known to work because the popstate path itself works; it just needs a trigger that does not depend on Instagram.

---

## 9. Relevant files

| File | What's in it |
|---|---|
| `src/AppFlow.tsx` | The `/plans` flow. Layer type + depths, `activeHistoryLayer`, the push effect, the `popstate` handler, the `?dbg=1` readout and its three probes. |
| `src/App.tsx` | Routing shell; `continueFromJoin()` is the `/lifestyle → /plans` hop (currently `pushState`). Also the invite flow, which has its own separate history handling with the same same-URL pattern. |
| `src/inAppBrowser.ts` | Instagram/Facebook webview detection and safe outbound navigation. |

**Reproduce the failure:** open `https://chaptera.in/plans?dbg=1` in the Instagram in-app browser on an iPhone, tap through to a plan, open the calendar, press back. Expected today: nothing happens, and `POPS` stays at 0.
