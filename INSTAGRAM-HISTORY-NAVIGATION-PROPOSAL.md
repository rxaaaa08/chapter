# Instagram Back-Button Navigation V2 — Detailed Proposal

**Status: PROPOSAL ONLY — no production navigation code has been changed by this document.**

*Written 2026-08-05 after re-reading `INSTAGRAM-BACK-BUTTON-HANDOFF.md` and auditing the shipped `/plans` and `/invite` history implementations.*

This proposal keeps the device-proven part of the current fix — every history entry that Instagram must expose gets a URL distinct from the current one — and replaces the fragile part: React component state, the URL, and the browser's history pointer currently tell three different stories after some closes.

The recommended result is one small, shared history controller used by `/plans`, `/invite`, `/invite/:slug`, and the PayU retry overlay. History entries carry versioned, non-sensitive snapshots. Back and Forward render the destination entry. X, backdrop, and swipe-down dismiss through the same history traversal instead of mutating UI state independently.

---

## 0. Executive decision

Build a **destination-driven, URL-visible history controller** in stages.

1. Keep stable distinct URLs such as `?sheet=details-calendar` and `?step=timeline`. This is the behavior already confirmed on a real iPhone inside Instagram.
2. Store the complete navigation snapshot in a namespaced `history.state` object.
3. Push history synchronously from the interaction that opens a view; do not infer pushes later from a React effect.
4. On `popstate`, restore the destination snapshot from `event.state`; do not guess the inverse action from the screen being left.
5. Route every dismiss affordance through the controller. A close button, backdrop tap, native Back, and future swipe-down must all produce the same state and URL.
6. Replace the endless details/switcher re-push trap with a bounded history path: **details → plan switcher → plan list**.
7. Pilot the controller on the smaller direct-invite flow before migrating the live, device-confirmed `/plans` stack.
8. For fresh-document payment recovery, render a safe `resume-booking` root and wait for a tap before pushing timeline/bill; never manufacture a nested entry from a mount effect.

This is deliberately not a React Router migration. The app can obtain correct history behavior with a focused controller and a reducer-like snapshot reconciler, without adding a routing dependency or rewriting booking and payment state.

---

## 1. Why another change is needed

### 1.1 What is solved

The research handoff established the important Instagram-specific fact:

> In Instagram's iOS in-app browser, a `pushState` entry only became visible to the native back chevron when the URL supplied at push time differed from the current URL.

The `/plans` fix gives layers a `?sheet=` value. The invite fix gives steps a `?step=` value. `/plans` was confirmed on device. Both distinct-URL probes — leaving the URL changed and immediately replacing it back — activated the chevron.

This evidence is empirical and valuable. It should remain an invariant of the new design.

### 1.2 What is not solved

The current implementations still use the visible React state as an informal navigation stack:

- `/plans` derives `activeHistoryLayer` from many booleans, pushes from a passive effect, and handles `popstate` according to the **source** layer currently visible.
- Direct closes in `/plans` replace the current URL but retain the old `history.state` payload.
- The plan-details trap pushes a replacement entry from inside `popstate`, so Back can never leave that loop and every push destroys the forward branch.
- `/invite` changes the URL when a step opens but generally does not change it when X/backdrop closes that step.
- `/invite` also handles `popstate` from the source React state rather than the destination history entry, so Forward cannot faithfully reopen a sheet.
- The shared-invite terms sheet currently opens and closes through local React state only, so native Back can skip past it instead of dismissing it.
- `PaymentOverlay` owns its payment-method picker and fee-breakdown sheets locally. Without a parent history entry for those nested sheets, native Back can close the bill/checkout underneath them rather than the visible top sheet.

### 1.3 The repeat-open failure already present in `/invite`

This is not only theoretical stack untidiness. It recreates the original Instagram bug:

```text
1. Start on /invite/<slug>
2. Open timeline        → push /invite/<slug>?step=timeline
3. Tap X                → React renders the card, URL stays ?step=timeline
4. Open timeline again → push ?step=timeline while already at ?step=timeline
5. Instagram may ignore this second identical-URL entry
```

The same shape exists for:

- shared-invite plan details → close → reopen plan details;
- shared-invite chat → close → reopen chat;
- shared-invite timeline → close → reopen timeline;
- timeline → bill → close to timeline → reopen bill;
- direct-invite timeline and bill;
- the failed-payment retry bill when locally dismissed and reopened.

Therefore the accurate current status is:

| Flow | Status |
|---|---|
| `/plans` | Distinct-URL activation shipped and confirmed on device; history/Forward model still fragile |
| `/invite` and `/invite/:slug` | First-open distinct-URL patch shipped; repeat-open URL alignment and device verification remain open |

---

## 2. Goals and non-goals

### Goals

1. Instagram's iOS chevron works on the first and every repeated open of a history-managed view.
2. Back, Forward, X, backdrop, and swipe-down all produce the same destination.
3. The URL, `history.state`, browser pointer, and rendered UI agree after every transition.
4. Back and Forward can traverse multiple layers rapidly without stale React closures or timer races.
5. `ref`, `preview_event`, `dbg`, `payment_status`, `txnid`, and other unrelated query parameters survive transitions that are allowed to preserve them.
6. No history entry or URL contains a phone number, email, OTP, payment token, amount, or other sensitive booking data.
7. PayU return, retry, bfcache, and session-storage restoration continue to work.
8. Migration and rollback are possible one flow at a time.

### Non-goals

- Replacing the app shell with React Router.
- Making payment, form, OTP, or confirmation screens publicly deep-linkable.
- Persisting form contents in the URL or `history.state`.
- Changing database schema, Supabase policies, RPCs, edge functions, or PayU callbacks.
- Changing creator-attribution rules.
- Rewriting every booking boolean into a new global store in one release.
- Migrating creator, admin, and unrelated marketing-page overlays; this proposal covers customer booking and payment flows only.
- Making Instagram's undocumented toolbar behavior a standards guarantee. The in-page close affordance remains mandatory.

---

## 3. Navigation invariants

The implementation should enforce these rules centrally rather than rely on comments at individual call sites.

| Invariant | Meaning |
|---|---|
| Every pushed app entry is owned | It contains a versioned `__chapteraNav` payload |
| Every push has a distinct URL | The serialized destination must differ from `window.location.href` before calling `pushState` |
| State is namespaced and merged | Existing `history.state` keys are preserved |
| URL is a compatibility signal | Instagram sees it; `history.state` remains the authoritative same-document snapshot |
| Pop restores the destination | `event.state` is parsed and rendered; the source screen is not used to guess what happened |
| Dismissal traverses | X/backdrop/swipe call Back when the current entry is owned |
| No push occurs inside `popstate` | Traversal never manufactures a replacement trap or destroys Forward |
| Unknown state fails safe | Invalid, old, or cross-flow entries fall back to the nearest safe base screen |
| Snapshots contain no PII | Only view names and non-sensitive identifiers such as event slugs are allowed |
| Async commits are entry-bound | A stale network/timer completion cannot overwrite a newer or already-popped entry |

Development builds should assert these invariants. Production should fail safely to local UI state and retain a visible close button if the History API throws.

---

## 4. Proposed state contract

Use one namespaced payload across all customer flows:

```ts
type ChapteraHistoryFlow =
  | 'plans'
  | 'shared-invite'
  | 'direct-invite'
  | 'payu-return';

type PolicyKind = 'about' | 'contact' | 'privacy' | 'refund' | 'tc';
type NonEmptyFrames<T> = readonly [T, ...T[]];

type PlansHistoryFrame =
  | { view: 'plan-list' }
  | { view: 'event-details'; eventSlug: string }
  | { view: 'details-calendar'; eventSlug: string }
  | { view: 'details-plan-switcher'; eventSlug: string }
  | { view: 'details-video'; eventSlug: string; mediaKey: string }
  | { view: 'policy-modal'; eventSlug: string; policy: PolicyKind }
  | { view: 'post-details-chat'; eventSlug: string }
  | { view: 'doubt-popup'; eventSlug: string }
  | { view: 'booking-timeline'; eventSlug: string }
  | { view: 'application-form'; eventSlug: string }
  | { view: 'details-form'; eventSlug: string }
  | { view: 'already-paid-sheet'; eventSlug: string }
  | { view: 'tc-modal'; eventSlug: string }
  | { view: 'payment-checkout'; eventSlug: string }
  | { view: 'community-sheet'; eventSlug: string };

type SharedInviteHistoryFrame =
  | { view: 'phone-entry' }
  | { view: 'invite-picker' }
  | { view: 'resume-booking'; eventSlug: string }
  | { view: 'revealed'; eventSlug: string }
  | { view: 'chat'; eventSlug?: string }
  | { view: 'plan-details'; eventSlug: string }
  | { view: 'timeline'; eventSlug: string }
  | { view: 'terms-modal' }
  | { view: 'bill'; eventSlug: string }
  | { view: 'lifestyle' };

type DirectInviteHistoryFrame =
  | { view: 'card'; eventSlug: string }
  | { view: 'resume-booking'; eventSlug: string }
  | { view: 'timeline'; eventSlug: string }
  | { view: 'bill'; eventSlug: string };

type PayUReturnHistoryFrame =
  | { view: 'return-screen'; status: 'success' | 'failed' | 'pending' }
  | { view: 'retry-bill'; eventSlug: string };

type PaymentOverlayHistoryFrame =
  | { view: 'payment-method-picker'; eventSlug: string }
  | { view: 'payment-fee-info'; eventSlug: string };

type ChapteraHistoryDestination =
  | { flow: 'plans'; frames: NonEmptyFrames<PlansHistoryFrame | PaymentOverlayHistoryFrame> }
  | { flow: 'shared-invite'; frames: NonEmptyFrames<SharedInviteHistoryFrame | PaymentOverlayHistoryFrame> }
  | { flow: 'direct-invite'; frames: NonEmptyFrames<DirectInviteHistoryFrame | PaymentOverlayHistoryFrame> }
  | { flow: 'payu-return'; frames: NonEmptyFrames<PayUReturnHistoryFrame | PaymentOverlayHistoryFrame> };

type ChapteraHistorySnapshot = {
  version: 1;
  chainId: string;
  entryId: string;
  parentEntryId?: string;
  revision: number;
  phase: 'ready' | 'pending';
} & ChapteraHistoryDestination;

type ChapteraHistoryState = Record<string, unknown> & {
  __chapteraNav?: ChapteraHistorySnapshot;
};
```

Example `/plans` calendar entry:

```ts
{
  __chapteraNav: {
    version: 1,
    flow: 'plans',
    chainId: 'tab-flow-a1',
    entryId: 'plans-17',
    parentEntryId: 'plans-16',
    revision: 17,
    phase: 'ready',
    frames: [
      { view: 'plan-list' },
      { view: 'event-details', eventSlug: 'pondy-weekend' },
      { view: 'details-calendar', eventSlug: 'pondy-weekend' }
    ]
  }
}
```

Example direct-invite bill entry:

```ts
{
  __chapteraNav: {
    version: 1,
    flow: 'direct-invite',
    chainId: 'tab-flow-b4',
    entryId: 'direct-invite-4',
    parentEntryId: 'direct-invite-3',
    revision: 4,
    phase: 'ready',
    frames: [
      { view: 'card', eventSlug: 'secret-plan' },
      { view: 'timeline', eventSlug: 'secret-plan' },
      { view: 'bill', eventSlug: 'secret-plan' }
    ]
  }
}
```

### Why store a full frame path

A depth number only says that one view is “deeper.” It does not say which sibling or branch is beneath it. Calendar and plan switcher share a depth but are not interchangeable; application form and details form are alternative branches; PayU success and failure share a return surface but require different status snapshots.

A complete frame path makes Back, Forward, multi-step traversal, and sibling restoration deterministic without inferring an inverse action. Every destination has exactly one explicit root frame; a root entry therefore always has `frames.length === 1`, never an empty or adapter-defined alternative representation. `parentEntryId` and `chainId` are assigned only by the controller. Together they distinguish a controller-created child from a deep-looking snapshot that arrived without an owned parent.

Adapters construct only `ChapteraHistoryDestination`. They cannot supply `entryId`, `parentEntryId`, `chainId`, `revision`, or `phase`; those fields are controller-owned. The parser additionally validates flow-specific root and transition rules—for example, a payment subsheet is valid only as the last frame above `bill`, `payment-checkout`, or `retry-bill`, and a policy frame must name the exact policy being displayed.

| Flow | Allowed one-frame roots |
|---|---|
| plans | `plan-list` |
| shared invite | `phone-entry`, verified `invite-picker`, or trusted `resume-booking` |
| direct invite | `card` or trusted `resume-booking` |
| PayU return | `return-screen` with an explicit status |

Only dedicated root constructors can create these shapes. A frame being valid somewhere in a flow does not automatically make it a valid root.

### State merge rule

Never overwrite unrelated history state. When V2 claims an entry, remove only the known V1 Chaptera markers so old listeners cannot mistake a V2 destination for a legacy layer:

```ts
const previous = isPlainObject(window.history.state)
  ? window.history.state
  : {};

const {
  chapteraLayer,
  chapteraInviteStep,
  chapteraRetryChat,
  chapteraRetryBill,
  ...unrelated
} = previous;

const nextState = {
  ...unrelated,
  __chapteraNav: snapshot,
};
```

This matters because the app already uses several history-state markers and a future router or browser integration may add its own keys. Removing all state would be unsafe; retaining the four legacy Chaptera keys would also be unsafe because existing listeners branch on them. V1 and V2 listeners for a flow must still be mutually exclusive behind the migration flag.

### Privacy rule

Allowed:

- flow name;
- view name;
- event slug or public event ID;
- exact public policy kind or public media key;
- non-sensitive return status (`success`, `failed`, or `pending`);
- opaque local chain ID;
- opaque local entry ID;
- opaque parent-entry ID;
- schema version, revision, and pending/ready phase.

Forbidden:

- name, phone, email, gender, OTP, affiliate session ID;
- price, gateway response payloads, transaction IDs, tokens;
- form contents, doubt text, application answers;
- serialized `nativeEventData` or payment context.

Existing session-storage restore paths remain responsible for the minimum payment context they already handle.

The runtime parser must also validate that each frame belongs to its declared flow and that the path begins with an allowed root. The two `PaymentOverlayHistoryFrame` values are shared primitives, but validation allows them only as the final frame above a payment-bearing parent such as `bill`, `payment-checkout`, or `retry-bill`.

---

## 5. URL contract

### 5.1 Keep stable, distinct URLs for the first version

Continue using the proven shapes:

```text
/plans?sheet=details-calendar&_ca_event=pondy-weekend
/plans?sheet=policy-modal&policy=privacy
/plans?sheet=details-video&media=trip-2
/invite?step=timeline
/invite/<slug>?step=bill
/?payment_status=failed&step=retry-bill
```

Include a public event slug when two entries can otherwise represent the same view for different events. If serialization would still equal the current URL, append a non-sensitive short entry key such as `_ca=<entryId>` rather than knowingly issuing an identical push.

`policy`, `media`, and `_ca_event` are controller-owned public discriminators used only for URL visibility/debugging; they are removed at a root destination and never authorize a fresh-load restore by themselves.

The controller must compare normalized absolute URLs before every push:

```ts
if (nextUrl.href === window.location.href) {
  nextUrl.searchParams.set('_ca', snapshot.entryId);
}
```

The `_ca` fallback should be rare. Its purpose is to make the central invariant unbreakable even if a future caller pushes the same view twice.

### 5.2 Preserve unrelated query parameters deliberately

The serializer starts from the current URL, removes only controller-owned keys, then adds the destination key. One-frame root snapshots keep the route URL clean:

```ts
const url = new URL(window.location.href);
url.searchParams.delete('sheet');
url.searchParams.delete('step');
url.searchParams.delete('policy');
url.searchParams.delete('media');
url.searchParams.delete('_ca_event');
url.searchParams.delete('_ca');

if (snapshot.frames.length > 1) {
  switch (snapshot.flow) {
    case 'plans':
      url.searchParams.set('sheet', top.view);
      break;
    case 'shared-invite':
    case 'direct-invite':
    case 'payu-return':
      url.searchParams.set('step', top.view);
      break;
    default:
      assertNever(snapshot);
  }

  if (top.view === 'policy-modal') url.searchParams.set('policy', top.policy);
  if (top.view === 'details-video') url.searchParams.set('media', top.mediaKey);
  if ('eventSlug' in top) url.searchParams.set('_ca_event', top.eventSlug);
}

if (snapshot.flow === 'payu-return' && top.view === 'return-screen') {
  url.searchParams.set('payment_status', top.status);
}
```

This preserves `ref`, UTM parameters, `preview_event`, `dbg`, the rollout flag, the hash, and legitimate PayU return parameters unless the owning route explicitly normalizes them. The PayU adapter updates `payment_status` when polling resolves pending to a final state, keeping the root URL aligned. V2 never copies or adds `txnid` to its snapshot; it merely leaves the pre-existing PayU route parameter untouched until the PayU route owner deliberately removes it.

### 5.3 URL is not permission to restore sensitive views

On a normal same-document Back or Forward, `history.state` contains the trusted local snapshot and the UI may restore it.

On a fresh document load or pasted URL:

- if a valid, compatible snapshot exists, restore the nearest safe view after required event data loads;
- if only URL navigation keys (`sheet`, `step`, `policy`, `media`, `_ca_event`, `_ca`) exist, remove them with a state-preserving `replaceState` and show the safe root view;
- never open a bill, OTP, success receipt, retry payment, or application state solely because a query parameter requested it;
- public event-details deep linking can be a separate future feature with its own explicit data contract.

### 5.4 Why not use push-distinct-then-replace-back everywhere

That probe worked on the tested Instagram version and is a valid fallback when a clean copied URL is essential. It is not recommended as V2's foundation because:

- Instagram's toolbar heuristic is undocumented;
- multiple rapid URL changes could be coalesced in a future host-app version;
- process restoration may retain only the final canonical URL;
- stable distinct URLs are easier to inspect, debug, and restore safely.

The controller should make URL presentation pluggable so this mode can be tested later without changing navigation semantics.

---

## 6. Proposed controller API

Add a focused module, tentatively `src/historyNavigation.ts`:

```ts
type HistoryNavigationAdapter = {
  flow: ChapteraHistoryFlow;
  routeMatches(location: Location): boolean;
  applySnapshot(snapshot: ChapteraHistorySnapshot): void;
  hydrateSnapshot(snapshot: ChapteraHistorySnapshot, signal: AbortSignal):
    Promise<'ready' | { fallback: ChapteraHistoryDestination }>;
  safeBaseDestination(): ChapteraHistoryDestination;
  urlFor(snapshot: ChapteraHistorySnapshot): URL;
};

type HistoryNavigationController = {
  seedBase(destination: ChapteraHistoryDestination): void;
  push(destination: ChapteraHistoryDestination): string;
  pushPending(destination: ChapteraHistoryDestination): string;
  commitPending(entryId: string, destination: ChapteraHistoryDestination): boolean;
  pushSequence(destinations: readonly ChapteraHistoryDestination[]): readonly string[];
  replace(destination: ChapteraHistoryDestination): void;
  replaceRoot(destination: ChapteraHistoryDestination): void;
  dismiss(fallback: ChapteraHistoryDestination): void;
  handlePop(event: PopStateEvent): boolean;
  current(): ChapteraHistorySnapshot | null;
  isCurrent(entryId: string): boolean;
};
```

The exact exported names may change. The behavioral contract should not. Adapters provide destinations; the controller allocates all identity and lineage fields. `push`, `replace`, and the final item in `pushSequence` update the history entry **and** apply the resulting snapshot to the UI; callers must not perform a second independent visibility change.

### 6.1 `seedBase`

On flow mount:

1. Parse `history.state.__chapteraNav`.
2. If it is a compatible snapshot for this flow, restore or normalize it.
3. Otherwise merge a base snapshot into the current entry with `replaceState`.
4. Do not add a history entry merely because the component mounted.

### 6.2 `push`

Used when the user enters a view they should be able to Back out of:

```ts
function push(destination: ChapteraHistoryDestination) {
  const parent = readSnapshot(window.history.state);
  assertOwnedParent(parent, destination.flow);
  assertChildDestination(parent, destination); // parent frames + exactly one child
  const ownedSnapshot = allocateSnapshot(destination, {
    chainId: parent.chainId,
    parentEntryId: parent.entryId,
    revision: parent.revision + 1,
    phase: 'ready',
  });
  const state = mergeChapteraState(window.history.state, ownedSnapshot);
  const url = ensureDistinct(adapter.urlFor(ownedSnapshot), ownedSnapshot.entryId);
  window.history.pushState(state, '', url);
  adapter.applySnapshot(ownedSnapshot);
  return ownedSnapshot.entryId;
}
```

Call this from the event or action that causes navigation, not from a passive synchronization effect.

`pushSequence([returnDestination, finalDestination])` is the controlled exception for the bounded plan switcher. It requires each destination to extend the preceding frame path by exactly one frame, allocates and pushes each valid snapshot synchronously in one user interaction, links their ancestry, and calls `applySnapshot` only for the final destination. Callers cannot request a generic “push without render.” This narrow API prevents invisible arbitrary entries while supporting:

```text
plan list → plan switcher → event details (only details is rendered after the tap)
```

The intermediate switcher entry has a real restorable snapshot and distinct URL. This method remains behind its own device-tested capability flag; if Instagram skips either of the two synchronous entries, `/plans` uses the simpler `plan list → event details` push.

### 6.3 `replace`

Used when the current entry changes meaning without creating another Back target:

- replacing one same-parent child with its atomic successor, such as plan-details → timeline;
- entry-bound PayU pending → success/failure resolution;
- replacing a view that is no longer valid after a terminal action;
- committing pending work through the stricter `commitPending(entryId, destination)` wrapper.

It must update state, URL, and rendered snapshot together. This keeps `push` and `replace` behavior consistent and lets an async pending entry be committed with one call. Replacing an already-owned entry preserves its `entryId`, `chainId`, and valid parent relationship; it changes that entry's meaning, not its identity. `replaceRoot` is the restricted operation for automatic recovery or same-route normalization: it accepts only a valid one-frame root, allocates a new root identity/chain in the current slot, and clears `parentEntryId`. Mount seeding and legacy normalization use the same root rules.

### 6.4 `dismiss`

```ts
function dismiss(fallback: ChapteraHistoryDestination) {
  if (pendingTraversal) return;

  const current = readSnapshot(window.history.state);
  if (
    current?.flow === adapter.flow &&
    current.frames.length > 1 &&
    current.parentEntryId
  ) {
    pendingTraversal = {
      entryId: current.entryId,
      expectedParentEntryId: current.parentEntryId,
      fallback,
    };
    window.history.back();
    return;
  }

  replace(fallback);
}
```

Every X, backdrop, and future swipe handler calls this method. Components must not call a visibility setter independently when the view owns a history entry.

`pendingTraversal` is controller-local, not serialized. It coalesces a double tap on X/backdrop while the browser is still dispatching `popstate`; otherwise two taps can accidentally traverse two views. `handlePop` clears it before applying the destination and can compare the activated `entryId` with `expectedParentEntryId` for diagnostics. A short watchdog may clear the lock and normalize the unchanged current slot to `fallback` only if the same `entryId` is still current and no `pagehide` occurred, preserving a working in-page close if a hostile webview fails to deliver `popstate` without inventing another entry.

`history.length` is intentionally not used as proof of ownership: it reveals neither the previous entry nor whether that entry is same-document. Eligibility comes from a schema-valid child that the controller linked to a parent in the same `chainId`. A one-frame root is not dismissible through the controller; the browser's next native Back is allowed to leave the flow.

### 6.5 `handlePop`

```ts
function handlePop(event: PopStateEvent): boolean {
  const expected = pendingTraversal?.expectedParentEntryId;
  pendingTraversal = null;
  const destination = readSnapshot(event.state);
  if (destination?.flow === adapter.flow && adapter.routeMatches(window.location)) {
    if (expected && destination.entryId !== expected) reportUnexpectedTarget();
    restoreAndHydrate(destination);
    return true;
  }

  const legacy = readCompatibleV1Destination(event.state, window.location);
  if (legacy?.flow === adapter.flow && adapter.routeMatches(window.location)) {
    normalizeCurrentEntry(legacy); // replace current slot; never push
    return true;
  }

  if (adapter.routeMatches(window.location)) {
    normalizeCurrentEntry(adapter.safeBaseDestination());
    return true;
  }

  return false; // a different route/document belongs to the shell/browser
}
```

This distinguishes three cases that must not be conflated: a valid active-flow destination is restored; a V1 or unknown entry on the same route is compatibility-mapped or normalized to a safe root; a different route is left to the shell/browser. Same-route normalization may `replaceState` the entry being activated because it changes no history length and preserves Forward. `handlePop` must never push, call Back, or synthesize a trap.

### 6.6 Async transitions

Several screens appear after timers, animation promises, event fetches, capacity checks, or payment recovery. WebKit has an intervention that may skip script-created history items without user interaction when native `WKWebView.goBack()`/`goForward()` is used. The safe pattern is:

```ts
const pendingId = nav.pushPending(intendedDestination);

try {
  const result = await loadDestination();

  if (!nav.isCurrent(pendingId)) return; // user backed out or opened something else
  nav.commitPending(pendingId, destinationFrom(result));
} catch {
  if (!nav.isCurrent(pendingId)) return;
  nav.commitPending(pendingId, safeFailureDestination);
}
```

`pushPending` creates a distinct owned entry with `phase: 'pending'` during the tap and synchronously renders the intended view's loading shell. `commitPending` preserves that entry's identity and ancestry while replacing it with `phase: 'ready'`. Failure also replaces that slot; it does not add another Back target. A stale promise cannot reopen a screen after Back. If a document reloads with a pending snapshot but no matching live operation, hydration degrades it to the nearest safe destination.

### 6.7 Restoration and hydration

`applySnapshot` performs a synchronous navigation reconciliation. If required event or payment context is not in memory, it renders a safe loading shell rather than leaving the source sheet visible. The controller then calls `hydrateSnapshot(snapshot, signal)` with a new generation-bound `AbortSignal`.

- `ready` means the adapter has restored enough non-sensitive context to render the requested frame.
- `{ fallback }` means context is absent or no longer valid; the controller replaces the current slot with that safe destination.
- A newer Back, Forward, route change, or hydration generation aborts the older request.
- Hydration never pushes. `pageshow` with `event.persisted === true` reconciles the already-current snapshot and starts no new history entry.

### 6.8 One traversal broker

V2 should install one app-shell `popstate` broker, not one independent listener per component. The broker first synchronizes the pathname/search route, then gives exactly one active flow adapter the chance to reconcile its UI. DOM listeners do not consume `popstate`, so merely returning `true` from a component handler cannot prevent another listener from also mutating state.

During migration, a flow-scoped flag is synchronously latched for the component's lifetime. The broker dispatches that flow to either its V1 compatibility handler or its V2 adapter—never both, even for one render. The flag is preserved by URL cleanup and has a remote/default kill-switch path for rollback.

---

## 7. Rendering snapshots without a full state rewrite

A one-release rewrite of every booking boolean would be unnecessarily risky. Migrate with a centralized reconciler first.

### `/plans` adapter

Create `applyPlansSnapshot(snapshot)` next to the existing state declarations. It should set all navigation visibility in one batched transition:

- event details, calendar, plan switcher, policy;
- the exact policy variant and the event-details video viewer;
- post-details chat and doubt sheet;
- booking timeline;
- application or details form;
- the already-paid result above the details form;
- T&C;
- checkout before the full-document PayU handoff;
- community sheet.

The reconciler should change visibility and the current conversational step, but should not discard selected event data, form values, or payment context merely because the user went Back. Retaining that non-navigation state is what allows Forward to reopen the same view within the same document.

After the migration is stable, the many booleans may be consolidated into a reducer in a separate refactor. That is not required for V2 correctness.

`EventDetailsOverlay` remains history-agnostic but becomes controlled for its navigable children. It reports the exact policy kind and public video/media key to the parent; the parent pushes `policy-modal` or `details-video` and supplies the active child from the snapshot. Backdrop, X, policy Done, and Vimeo's ended event all request `dismiss` from the parent rather than clearing child state locally. Inline accordions such as “not included” and “work with us” are content expansion, not navigation entries.

The rendered `showWaitlistForm` branch is currently unreachable because no call sets it to `true`; it is an explicit V2 exception and should be removed in cleanup or assigned a frame before it is re-enabled. The local `/plans` `payment-success` and `payment-failure` branches are also legacy/test-only today—the live provider result is rendered by `PayUReturnScreen`—so they are not V2 plans frames. `openAlreadyPaid` is reachable from the open-event server check and is not an exception: the initiating submit uses a pending entry and commits that entry to `already-paid-sheet` when the server returns the duplicate-booking result.

### Shared-invite adapter

Create `applySharedInviteSnapshot(snapshot)` for:

- one explicit `phone-entry`, `invite-picker`, or `resume-booking` root, selected by trusted verification/recovery state;
- revealed picker;
- chat;
- plan details;
- terms;
- the lifestyle reveal/wipe;
- timeline;
- bill;
- payment nested sheets.

The adapter may use existing session-storage restoration to re-fetch event data, but it must degrade to the nearest safe frame when required context is absent.

The lifestyle wipe allocates its pending child during the “Apply Now” tap, then commits the same entry when the 760 ms reveal completes; the timer itself never pushes. The plan-details Pay CTA is an atomic `replace` to timeline, matching today's effective Back destination (chat) and avoiding a hidden 300 ms close-then-open sequence with two independent state mutations.

The currently rendered `showNativeConfirmation` branch is unreachable because no call opens it. Like the plans waitlist, it is documented as a dormant exception rather than pretending V2 can exercise it. If product work re-enables it, `confirmation` must be added to the frame union and acceptance matrix first.

### Direct-invite adapter

This is the simplest pilot:

```text
card → timeline → bill
```

The current `step` enum maps almost directly to the frame path, making this the lowest-risk place to validate the controller, Back/Forward reconciliation, repeated opens, and URL behavior before touching `/plans`.

### PayU-return adapter

The failed-payment retry bill is a separate flow because the route is owned by `PayUReturnScreen` rather than the invite component underneath it. Its snapshot must never contain recovered payer details. The existing phone-bound server lookup and session-storage handoff remain authoritative.

V2 makes the retry path finite and consistent. `return-screen(status: 'failed') → retry-bill` is one parent/child pair for open, shared-invite, and direct-invite payments. Back, X, and backdrop from the retry bill all dismiss to the failed return screen. A separate, clearly labelled “Return to booking” action may route to the booking flow and request a trusted `resume-booking` root. This removes the current mismatch where Back can restore a timeline while X restores retry chat.

When polling resolves `return-screen(status: 'pending')`, the adapter entry-binds the result and replaces that same root snapshot with `status: 'success'` or `status: 'failed'`. The polling effect never changes only React state and never creates a history entry.

Automatic restoration has no initiating tap and therefore never pushes. On a fresh invite document, valid server/session context calls `replaceRoot` with a non-sensitive `resume-booking` screen; missing context uses `phone-entry` or `card`. The customer's tap on “Resume booking” then pushes timeline or bill synchronously, so native Back and X both return to the resume root. A bfcache return may restore the already-current owned nested snapshot on `pageshow` without adding an entry. The special re-pushing `retry-chat` trap is removed.

### Nested `PaymentOverlay` contract

`PaymentOverlay` should remain unaware of `window.history`; the route owner remains the single history authority. It must, however, stop hiding its two nested sheets solely through internal setters. Add semantic callbacks such as:

```ts
type PaymentSubsheet = 'method-picker' | 'fee-info';

type PaymentOverlayNavigationProps = {
  onOpenSubsheet: (sheet: PaymentSubsheet) => void;
  onDismissSubsheet: () => void;
  activeSubsheet: PaymentSubsheet | null;
};
```

The parent adapter maps these callbacks to `push` and `dismiss`, then derives `activeSubsheet` from the destination snapshot. The overlay may retain local animation state, but it may not independently decide the navigation destination. This contract is required at all four mounts: plans checkout, shared-invite bill, direct-invite bill, and PayU retry bill.

Choosing a payment method is a domain-state commit followed by `dismiss`: Back/Forward does not undo the selected method, and Forward reopens the picker showing the retained selection. Fee info is a pure dismissible sheet. The shared-invite T&C sheet follows the same ownership rule: the adapter pushes `terms-modal`; its current backdrop and “I Agree” actions dismiss that owned entry, and a future X would do the same. Agreement sets `tcAccepted` before dismissal. Forward may reopen the already-accepted terms sheet but must not revert acceptance or resubmit anything.

---

## 8. The plan-details / plan-switcher decision

### Current behavior

On `/plans`, Back from event details opens the plan switcher and immediately pushes a new switcher entry. Back while the switcher is open repeats the same operation. The user cannot leave the loop through native Back, and each push discards Forward history.

This was an explicit product choice, but it was made when Instagram's chevron was dead and therefore did not affect the majority traffic source.

### Recommended bounded behavior

Preserve the useful first destination without trapping the user forever:

```text
plan list → plan switcher → event details
```

When the user selects a plan from the list, the controller may create the switcher return entry and then the details entry during the same interaction, without rendering a visible intermediate frame. The resulting behavior is:

```text
Back:    event details → plan switcher → plan list → previous document
Forward: plan list → plan switcher → event details
```

No entry is pushed during `popstate`. The URL, state, and rendered screen remain aligned at each point.

This two-entry allocation must be included in the real-device pilot because Instagram/WebKit behavior with two synchronous pushes should be measured, not assumed. If it proves unreliable, the product should choose the simpler standard behavior: details → plan list.

### Not recommended

Retaining an endless re-push trap. It prevents the browser's primary escape affordance from ever leaving the flow, repeatedly discards the Forward branch, and rewrites the last slot on every Back cycle.

---

## 9. Transition policy

Each transition must explicitly choose one of three semantics:

| Operation | Use when | Example |
|---|---|---|
| `push` | Back should return to the current view | timeline → bill |
| `dismiss` | Closing the current owned entry | bill X → timeline |
| `replace` | Current entry is invalidated or normalized | pasted `?step=bill` without state → safe base |

Do not decide push-vs-replace by comparing numeric layer depths. Siblings and alternative branches require explicit intent.

Examples:

| Transition | Semantics |
|---|---|
| plan list → event details | push; optionally insert bounded switcher return entry |
| event details → calendar | push |
| event details → video viewer | push with public `mediaKey` |
| event details → policy | push with exact `policy` variant |
| calendar X/backdrop/native Back | dismiss |
| chat → doubt sheet | push |
| failed invite verification → “Apply Now” lifestyle wipe | push pending `lifestyle` in the tap; commit after animation |
| timeline → details/application form | push |
| shared-invite form → terms sheet | push |
| terms backdrop/native Back | dismiss |
| form → T&C | push |
| T&C “I Agree” | update acceptance, then dismiss |
| open-event submit → async server decision | push pending intended destination; commit same entry to checkout or already-paid sheet |
| invite plan-details → “Pay” timeline | replace plan-details with timeline; Back returns to chat rather than reopening the sales sheet |
| details form → bill | push |
| bill/checkout → payment-method picker | push |
| bill/checkout → fee breakdown | push |
| payment nested-sheet X/backdrop/native Back | dismiss to bill/checkout |
| failed return screen → retry bill | push |
| retry-bill X/backdrop/native Back | dismiss to failed return screen |
| trusted fresh-document PayU restore | `replaceRoot(resume-booking)`; never push automatically |
| resume-booking → timeline/bill | push synchronously from the customer's resume tap |
| PayU pending poll resolves | entry-bound replace of `return-screen.status`; never push |
| invalid restored bill without trusted context | replace with the flow's safe root |
| selecting a new branch after Back | push; browser naturally discards old Forward branch |

---

## 10. Migration plan

Do not replace all history behavior in one production commit.

### Phase 0 — Correct the record and freeze the baseline

- Update the research handoff to distinguish 15 invite push call sites from 8 named step values.
- Change the `/invite` status from “safe by construction” to “first-open patch; repeated-open and device verification open.”
- Record a fresh-tab device baseline for the currently working `/plans` details and calendar path.
- Decide whether the details trap becomes bounded (recommended) or details returns directly to the plan list.

No runtime behavior changes in this phase.

### Phase 1 — Pure controller and deterministic tests

- Add `src/historyNavigation.ts` with parsing, merging, URL serialization, distinctness checks, and transition primitives.
- Keep the module independent of React and Supabase.
- Add the single app-shell traversal broker, flow-scoped flag latch, and V1 compatibility parser before any customer route opts in.
- Replace route/affiliate/auth URL cleanup that writes `replaceState({})` with explicit merge-or-clear-owned helpers so unrelated state is never erased accidentally.
- Add tests using the existing `tsx` runtime and Node's test runner; no browser or database is required for pure state/URL tests.
- Add a small development-only navigation harness that renders generic base/sheet/bill frames and exposes Back, Forward, X, replace, and async-pending operations.

### Phase 2 — Pilot on `/invite/:slug`

- Migrate the three-frame `card → timeline → bill` flow.
- Add the PayU-return adapter for failed direct-invite payments, including the finite failed-screen → retry-bill path.
- Keep existing event fetch, payment calculations, and gateway logic unchanged.
- Wire the bill's payment-method picker and fee-breakdown sheets through the parent adapter callbacks.
- Test repeated X/reopen, Back, Forward, rapid double Back, and a new branch after Back.
- Test behind an opt-in query or development flag first; then enable for the direct-invite route.

### Phase 3 — Migrate shared `/invite`

- Add the shared-invite adapter.
- Replace all explicit invite `pushState` call sites with controller calls.
- Replace all setter-only history-managed closes with `dismiss`.
- Migrate plan details, chat, terms, lifestyle wipe, timeline, bill, payment nested sheets, and the handoff to the separately owned PayU-return adapter; remove the retry-chat re-push trap.
- Keep phone verification, capacity checks, session-storage payloads, and PayU submission untouched.

### Phase 4 — Migrate `/plans`

- Add `applyPlansSnapshot`.
- Move history allocation from the `activeHistoryLayer` effect into the actual open actions.
- Replace depth inference with explicit transitions.
- Remove `handlingPopStateRef` and timer-based suppression.
- Remove the push from inside the details/switcher `popstate` branch.
- Implement the chosen bounded switcher behavior.
- Control the exact policy variant and video viewer through the parent adapter.
- Add the already-paid pending/commit path; retain `showWaitlistForm` only as a documented dormant exception.
- Route checkout's payment-method picker and fee-breakdown sheets through the same parent-owned contract.
- Preserve the current device-tested `?sheet=` URL shapes.

### Phase 5 — Hardening and cleanup

- Remove legacy `chapteraLayer`, `chapteraInviteStep`, `chapteraRetryChat`, and `chapteraRetryBill` handling after the migration window.
- Remove the temporary compatibility parser only after tabs containing previous-deployment entries are outside the supported migration window.
- Simplify the debug HUD to read controller events rather than monkey-patching `history.pushState` globally.
- Update the research handoff with the final device results and commit IDs.

---

## 11. File-level implementation map

| File | Proposed change |
|---|---|
| `src/historyNavigation.ts` | New pure controller, schema/V1 parser, state merge/clear helpers, exhaustive URL serializer, hydration generations, and navigation primitives |
| `src/AppFlow.tsx` | `/plans` adapter; controlled details video/policy; explicit transitions; already-paid pending path; bounded switcher; safe auth URL cleanup |
| `src/App.tsx` | Single traversal broker; shared/direct invite and PayU-return adapters; replace 15 invite push sites, retry trap, setter-only closes, and destructive route replacements |
| `src/InvitePlanDetailsSheet.tsx` | No history logic; continue receiving one `onClose`, now supplied by controller owner |
| `src/PaymentOverlay.tsx` | Remain history-agnostic, but expose controlled payment-method/fee-sheet state and semantic open/dismiss callbacks to the route owner |
| `src/affiliate.ts` | Preserve unrelated history state and deliberately clear only route-owned navigation state during affiliate rewrites |
| `src/inAppBrowser.ts` | No required behavior change; optional debug capability flag only |
| `scripts/test-history-navigation.ts` | Pure state/URL/transition tests using test doubles |
| `INSTAGRAM-BACK-BUTTON-HANDOFF.md` | Correct current-status language, then record V2 outcome after device verification |

No Supabase migration, edge-function deployment, or payment-provider change is required.

---

## 12. Test strategy

### 12.1 Pure controller tests

| Test | Expected result |
|---|---|
| Seed base over `null` state | One replaced base entry, no added length |
| Seed over unrelated state keys | Unrelated keys preserved |
| Push a child frame | New owned state and distinct URL |
| Push without an owned same-chain parent | Rejected or normalized before any child entry is created |
| `pushSequence([switcher, details])` | Two linked, distinct entries; only details is applied to UI |
| Serialize identical destination | `_ca` fallback makes URL distinct |
| Replace current snapshot | No added entry |
| Parse wrong version | Rejected and normalized safely |
| Parse cross-flow state | Current adapter does not consume it |
| Parse wrong root/flow, missing policy kind, or misplaced payment child | Rejected |
| Same-route unknown pop target | Current slot normalized to safe root without a push |
| Different-route pop target | Flow adapter does not mutate UI; shell owns routing |
| V1 entry during V2 migration | Compatibility-mapped or safely normalized |
| URL preservation | `ref`, `preview_event`, `dbg`, PayU parameters preserved as specified |
| Cart query cleanup | `phone`/`name` removed; `ref`, UTM, `dbg`, rollout flag, and hash preserved |
| Route/auth/affiliate cleanup | Unrelated state preserved; only intentionally owned navigation state cleared |
| Pasted internal URL without state | Internal keys removed; safe base selected |
| Stale async commit | Ignored when `entryId` is no longer current |
| Pending snapshot after reload | Hydrates if possible; otherwise replaces with safe destination and never pushes |
| Hydration generation aborted | Older completion cannot overwrite a newer Back/Forward destination |
| Double dismiss before `popstate` | Only one `history.back()` request is issued |
| Dismiss watchdog on unchanged entry | Safe fallback replaces the stuck child; no extra entry is pushed |
| Snapshot validation | PII-shaped or unknown fields are not serialized by constructors |

### 12.2 Browser integration matrix

Each row must verify four things after every action: rendered top view, URL, `history.state.__chapteraNav.frames`, and Back/Forward availability.

| Flow | Sequence |
|---|---|
| Direct invite | card → timeline → X → timeline again → Back → Forward |
| Direct invite | timeline → bill → X → bill again → Back → Back → Forward → Forward |
| Shared invite | picker → revealed → chat → Back → Forward |
| Shared invite | failed verification → Apply Now → Back during wipe; stale timer cannot reopen lifestyle |
| Shared invite | chat → plan details → backdrop → reopen → Back → Forward |
| Shared invite | chat → plan details → Pay/timeline → Back returns to chat, not plan details |
| Shared invite | form → terms → backdrop → reopen → Back → Forward |
| Shared invite | form → terms → I Agree → Forward; acceptance remains true and no action repeats |
| Shared invite | chat → timeline → bill → X → X → Forward twice |
| Shared invite retry | failed return → retry bill → Back → failed return → Forward |
| Payment overlay | bill → method picker → choose method → Forward; selection remains committed |
| Payment overlay | bill → method picker → Back → bill → Forward → method picker |
| Payment overlay | bill → fee breakdown → backdrop → Forward |
| Payment overlay | nested sheet → two rapid native Back actions → parent sheet closes second, with no re-push |
| Plans | list → details → calendar → Back → Forward |
| Plans | details → plan switcher → choose another event → Back |
| Plans | details → video → X → Forward; exact `mediaKey` reopens |
| Plans | details → each policy kind → Back → Forward; exact policy reopens |
| Plans | chat → doubt → backdrop → reopen → Back |
| Plans | timeline → application/details form → T&C → Back/Forward |
| Plans | T&C → I Agree → Forward; acceptance remains true |
| Plans | details form → submit pending → already-paid sheet → Back → Forward |
| Plans payment | details form → checkout → PayU document → `payu-return` success/failure/pending adapter |
| Community | list → community sheet → X → reopen → Back |
| Branching | open A → Back → open B; old Forward A must disappear |
| Rapid input | double-tap X/backdrop before `popstate`; only one view dismisses |
| Rapid input | two quick Back taps traverse two entries without a re-push or stale reopen |

Repeat every payment-subsheet row at all four owners: plans checkout, shared-invite bill, direct-invite bill, and PayU retry bill. Each check must verify that the first Back closes the visible nested sheet and the second Back closes its parent.

### 12.3 PayU and external-navigation matrix

| Return shape | Required outcomes |
|---|---|
| `/plans?payment_status=success|failed|pending` | Callback params latched before URL normalization; receipt/failure/polling view correct; no navigation push from polling |
| `/invite?payment_status=success|failed|pending` | Same, with trusted shared-invite `resume-booking` root or safe phone root when context is absent |
| `/invite/:slug?payment_status=success|failed|pending` | Same, with trusted direct-invite `resume-booking` root or safe card root when context is absent |
| Failed return → retry bill | Back/X/backdrop all return to failed screen; Forward reopens retry bill; nested payment sheets work |
| Return to booking → resume root | No automatic push; customer tap pushes timeline/bill; Back and X both return to resume |
| Pending → success/failure poll | Current return entry is replaced/reconciled; no extra history entry and no duplicate-payment CTA |
| Back from PayU | Test both bfcache `pageshow.persisted` restoration and fresh-document/session restore |
| Missing/cleared `sessionStorage` | Never reconstruct payer data from URL/state; hydrate from allowed server lookup or fall back safely |

Exact bill restoration currently differs among shared invite, plans, and direct invite. A valid bfcache/history snapshot may restore the exact bill; a fresh document uses `resume-booking` and requires a tap before pushing the bill. Missing context falls back to the flow's safe root. No adapter may leave a blank bill or infer customer data from query parameters.

### 12.4 Reload and lifecycle tests

- Reload on base entry.
- Reload on a safe event-details entry with compatible state.
- Reload on plans calendar, each policy kind, and details video.
- Reload on direct-invite timeline and bill.
- Reload on shared-invite chat, plan details, timeline, terms, and bill.
- Reload on each payment nested sheet at all four owners.
- For every non-root reload, test both required context present and context missing/cleared.
- Paste/share `?sheet=` or `?step=` into a fresh tab with no state.
- Background and resume the Instagram webview on a nested sheet.
- Fire `pageshow` with `persisted=true`; reconcile the current snapshot without a push or duplicate hydration commit.
- Safari bfcache restoration after returning from PayU.
- Full document return from PayU success, failure, and pending.
- Deploy a new build while a tab contains legacy V1 history entries.

### 12.5 Rollout-flag and mixed-version tests

- The flag is flow-scoped and synchronously latched before either listener is attached.
- Flag-off mounts V1 only; opt-in mounts V2 only; reload with `?history_v2=1` stays V2.
- URL serialization and cart/auth/affiliate cleanup preserve the flag.
- Back through mixed V1 and V2 entries uses the compatibility mapping without two owners reacting.
- Default enablement and remote kill-switch rollback each work without changing another flow.
- A V2 tab loaded before a deployment can Back into an older entry, then Forward into V2 again.

### 12.6 Real-device acceptance matrix

Automation cannot certify Instagram's native toolbar. Final acceptance requires fresh tabs on real devices.

| Platform | Required checks |
|---|---|
| Instagram iOS in-app browser | Test fresh first document with both chevrons disabled; arrival from Linktree/prior document; open → X → reopen three times; X → native Forward → native Back; rapid Back; and three-layer traversal |
| Facebook iOS in-app browser | Same smoke test if traffic uses it |
| Safari iOS | Back/Forward/X and bfcache PayU return |
| Instagram Android in-app browser | Back hardware/toolbar, repeated opens, payment overlay close |
| Chrome Android | Back hardware gesture and Forward menu |
| Desktop Safari/Chrome | Deterministic integration and reload behavior |

Use a fresh tab for each history-sensitive case. Do not infer visibility from DOM presence when Framer Motion leaves exiting nodes mounted; inspect bounding rectangles or controller state.

The two-synchronous-push switcher probe is a release gate on Instagram iOS. If either return entry is skipped, disable that capability and ship details → plan list rather than the bounded virtual return path.

---

## 13. Debugging and observability

Keep `?dbg=1`, but make it report the navigation contract directly:

```text
flow=plans  v=1  entry=plans-17
frames=event-details > details-calendar
url.sheet=details-calendar  state.top=details-calendar  MATCH=YES
push=4  replace=2  pop=3  direction=back
```

Useful development assertions:

- pushed URL differs from the current URL;
- URL top equals state top after every controller operation;
- rendered top equals state top after reconciliation;
- a controller-owned close never calls a raw visibility setter;
- no `pushState` or `replaceState` outside the controller carries a Chaptera navigation marker;
- `popstate` never causes a push.

Do not send snapshot contents to analytics. If a production mismatch counter is later added, log only flow, view name, app version, and a non-user-specific reason code.

---

## 14. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Instagram changes its undocumented heuristic | Native chevron may regress | Keep distinct URL strategy, visible X/backdrop, and future swipe fallback; retain device smoke test |
| WebKit skips entries created without user interaction | Native Back may jump over a view | Allocate pending entry in the initiating tap; bind async completion to entry ID |
| Multiple `popstate` listeners independently react to one traversal | Route and flow state can conflict | One app-shell broker synchronizes the route and dispatches to exactly one latched flow owner |
| A child-owned payment sheet bypasses the route controller | Back closes the underlying bill or checkout instead of the visible sheet | Make nested sheet state controlled by the parent adapter; keep `PaymentOverlay` free of direct History API calls |
| Child-owned video or policy state cannot be restored exactly | Forward opens the wrong policy or leaves the video closed | Controlled child contract carries the public policy/media discriminator; Vimeo-ended routes through `dismiss` |
| React state updates are split across renders | Brief wrong layer or effect feedback loop | One snapshot reconciler/batched update; history is not pushed from render effects |
| Forward lacks required event data | Broken or blank restored view | Retain non-sensitive in-memory context; degrade to nearest safe frame when missing |
| History state from previous deployment | Parser rejects or misreads old entries | Versioned schema plus temporary legacy compatibility path |
| Pasted internal URL opens sensitive view | Privacy/payment risk | Query alone never authorizes restoration; require compatible local snapshot/context |
| Raw route/auth/affiliate `replaceState({})` erases controller ownership | Current UI and state diverge; next Back is misclassified | Central merge-or-clear-owned helper; static audit and regression tests for every raw History API call |
| A restored pending entry has no live async task | Loading shell can hang forever | Hydration recognizes orphaned pending state and replaces it with a safe destination |
| Plan-switcher virtual return entry behaves differently in Instagram | First Back may skip or toolbar may miscount | Dedicated device probe; fall back to details → plan list |
| Rollback sees V2 query parameters | Old build may ignore or display stale URL | Existing routes already tolerate unknown query parameters; rollback normalizes on mount |
| History API throws in restricted contexts | Close may appear dead | Catch failure, apply safe local state, and retain visible close affordance |

---

## 15. Rollout and rollback

### Rollout

1. Ship the pure controller, broker, V1 parser, merge/clear helpers, and harness with all customer flows still latched to V1.
2. Enable V2 only with `?history_v2=1` on the direct-invite and PayU-return pilot.
3. Run automated checks and real-device Instagram tests in a fresh tab.
4. Enable direct invite by default.
5. Repeat for shared invite.
6. Migrate `/plans` last, retaining a short-lived query flag for side-by-side device testing.
7. Remove V1 code only after the payment return and three-layer Back/Forward matrix passes.

The feature flag must select one history owner per flow. It is read before listeners mount, retained for that component lifetime, and preserved by every controller URL. A remote/default kill switch affects the next mount or reload; it does not hot-swap owners mid-traversal. V1 and V2 must never both react or push for the same transition.

### Rollback

- Roll back one flow adapter without reverting the pure controller.
- On V1 mount, use the shared clear-owned helper to strip or ignore `__chapteraNav` and internal V2 query keys without deleting unrelated state or attribution parameters.
- Existing V1 `?sheet=` and `?step=` URLs remain valid app routes even when not restored.
- No database rollback is required.

---

## 16. Acceptance criteria

V2 is complete only when all of the following are true:

- [ ] No history-managed customer close path mutates only React visibility state.
- [ ] Every customer booking/payment bottom sheet is either mapped to a V2 frame or documented as an explicit, approved exception.
- [ ] One broker and one latched owner handle each traversal; V1 and V2 never both react.
- [ ] No Chaptera navigation push occurs from a passive layer-observation effect.
- [ ] No `pushState` occurs inside a `popstate` handler.
- [ ] Every pushed URL is verified distinct from the current URL.
- [ ] Every owned entry has a valid versioned snapshot with no PII.
- [ ] Controller—not adapters—allocates entry identity, ancestry, revision, and pending phase.
- [ ] Back renders the destination snapshot for every mapped layer.
- [ ] Forward reopens the exact dismissed layer with its retained safe context.
- [ ] Repeated open → X → reopen works in Instagram iOS.
- [ ] Rapid multi-entry Back does not reopen a stale sheet.
- [ ] `ref`, preview, debug, PayU return, and route parameters pass their preservation tests.
- [ ] Auth, affiliate, cart, and route cleanup preserve unrelated history state and approved attribution/query keys.
- [ ] Reload/paste without state falls back safely.
- [ ] PayU success, failure, pending, retry bill, and bfcache return pass.
- [ ] Retry-bill Back, X, and backdrop all return to the failed screen; returning to booking is a separate explicit action.
- [ ] Fresh-document payment recovery lands on `resume-booking`; only the customer's resume tap creates the nested entry.
- [ ] Shared/plans terms pass Back/Forward, backdrop, “I Agree,” and repeated-open tests; payment-method and fee sheets pass their Back/Forward/X/backdrop matrix.
- [ ] Exact details-video and policy variants restore through Forward; already-paid pending/commit is covered.
- [ ] Dormant waitlist and confirmation branches remain unreachable or gain frames and tests before re-enablement.
- [ ] The plan-switcher behavior is bounded and explicitly approved.
- [ ] TypeScript, production build, pure tests, integration harness, and real-device matrix all pass.
- [ ] The research handoff is updated with the final verified behavior and commit IDs.

---

## 17. Alternatives considered

### Keep patching `sheetUrl()` / `inviteStepUrl()` call sites

**Rejected as the final design.** It can repair individual chevron failures but cannot guarantee pointer, URL, state, and Forward alignment. The repeat-open invite bug demonstrates how easily one setter-only close reintroduces an identical URL.

### Push distinct, then immediately replace to a clean URL

**Keep as an optional URL adapter, not the navigation model.** It passed the device probe and may be appropriate if copied URLs must remain pristine, but the controller and destination snapshot are still required.

### Adopt React Router modal routes

**Not now.** It would provide established navigation primitives but introduces a broad routing migration across a large single-file shell and payment-sensitive state. The focused controller captures the needed behavior with a much smaller blast radius.

### Full document navigation per sheet

**Rejected.** It would give the native webview real pages but destroy the chat-style SPA experience, complicate form/payment state, and increase reload risk.

### Continue closing with state setters and merely replace the URL

**Rejected.** It prevents the immediate repeat-open URL bug but still strands the pointer, leaves stale forward entries, and makes `history.state` disagree with the UI.

### Rely on `<dialog>`, `CloseWatcher`, or the Navigation API

**Rejected as the baseline.** These APIs cannot command Instagram's custom native toolbar, and deployed iPhone/WebKit support is not broad enough to replace the History API compatibility path.

---

## 18. Estimated implementation sequence

| Work unit | Scope | Expected size |
|---|---|---|
| Controller + broker + compatibility + pure tests + harness | No customer flow changed | 1–2 focused sessions |
| Direct invite + PayU-return pilot | Card/timeline/bill, retry bill, payment nested sheets | 1 focused session plus device check |
| Shared invite migration | Picker/chat/details/terms/timeline/bill/retries | 1–2 sessions plus payment-return QA |
| `/plans` migration | Full layer graph, controlled video/policies, already-paid path, payment nested sheets, and switcher decision | 2–3 focused sessions plus device checks |
| Cleanup and documentation | Remove V1, update HUD/handoff | ½ session |

The work should remain split into reversible commits by phase. Because customer payments are live, device verification is a release gate rather than a post-release nice-to-have.

---

## 19. Decisions required before implementation

1. **Approve bounded switcher behavior (recommended):** details → switcher → plan list, rather than the current endless trap.
2. **Approve stable visible internal URLs for V2:** keep `?sheet=` / `?step=` initially; evaluate push+replace only after controller behavior is stable.
3. **Approve Forward as a supported behavior:** the proposal treats it as part of correctness, matching the observed BookMyShow behavior.
4. **Approve direct invite as the pilot:** it is the smallest real flow and avoids risking the already working `/plans` path first.
5. **Confirm that fresh pasted internal URLs should normalize to a safe base:** no public deep-link promise in V2.
6. **Approve consistent retry-bill dismissal:** Back, X, and backdrop return to the failed PayU screen; a separate action returns to booking.
7. **Approve dormant-state scope:** unreachable waitlist and confirmation branches stay outside V2 until removed or deliberately re-enabled with frames and tests.
8. **Approve a resume gate for fresh-document recovery:** bfcache may restore an existing nested entry, but a fresh document shows `resume-booking` and waits for a tap before pushing timeline/bill.

Recommended answers: **yes to all eight**.

---

## 20. Primary references

- Local evidence and device measurements: `INSTAGRAM-BACK-BUTTON-HANDOFF.md`
- HTML session-history contract: <https://html.spec.whatwg.org/dev/nav-history-apis.html>
- WebKit intervention for script-created entries without user interaction: <https://bugs.webkit.org/show_bug.cgi?id=241885>
- Apple `WKWebView` back-forward behavior: <https://developer.apple.com/documentation/webkit/wkwebview/backforwardlist>
- React guidance on interaction logic vs reactive effects: <https://react.dev/learn/separating-events-from-effects>

The external references describe standards and WebKit behavior. The Instagram distinct-URL requirement itself remains a Chaptera on-device measurement, not a documented Meta contract.
