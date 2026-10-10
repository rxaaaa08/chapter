# Payment Failure Flows — Full Reference

This document explains every path a user can take when a PayU payment fails
or is interrupted — the failure redirect, the failure screen, the smart
Try Again button, and the browser-back-from-PayU restore flow.

---

## Overview — The Two Main Failure Paths

```
Path A: Payment fails on PayU's page
  → PayU POSTs result to payu-callback
  → payu-callback redirects browser to /invite?payment_status=failed&txnid=...
  → App shows PayUReturnScreen (failure state)
  → User taps Try Again → Smart retry

Path B: User presses browser Back while on PayU's page
  → Browser navigates back to our app (cold start — all React state is lost)
  → App finds ca_payu_bill in sessionStorage
  → Shows branded spinner instantly (no form flash)
  → Restores bill breakdown page exactly as the user left it
```

---

## Path A — PayU Failure Redirect

### 1. How the failure URL is constructed

When PayU processes a failed payment, it POSTs to the `payu-callback` Edge
Function. The failure branch always redirects to:

```
https://chaptera.in/invite?payment_status=failed&txnid=CHA1234...
```

The URL deliberately uses the generic `/invite` path — never
`/invite/:slug` — so no internal event slug is ever exposed in the browser
address bar on failure.

### 2. How the app detects it's a PayU return

On every page load, the root `App` component reads `payment_status` from the
URL search params using a `useState` synchronous initializer:

```tsx
const [payuReturnStatus] = useState<'success' | 'failed' | null>(() =>
  new URLSearchParams(window.location.search).get('payment_status') as ...
);
const [payuReturnTxnid] = useState(() =>
  new URLSearchParams(window.location.search).get('txnid') ?? ''
);
```

These are latched on mount so they survive any URL replacement that happens
later. If `payuReturnStatus` is non-null, the entire app renders
`PayUReturnScreen` instead of any other page.

### 3. PayUReturnScreen — failure state

`PayUReturnScreen` is a dedicated full-screen component (`src/App.tsx`).

On mount it fetches the `payu_payments` row for the given `txnid`:

```ts
supabase.from('payu_payments').select('*').eq('txnid', txnid).maybeSingle()
```

This gives the screen access to: `event_slug`, `event_title`, `amount`,
`phone`, `name`, `payment_type`.

While this fetch is in flight, a spinner is shown. Once resolved:

- **If `status === 'failed'`** → shows the failure screen (red X, "Payment
  Failed", "No amount was charged", Try Again button)
- **If `status === 'success'`** → shows the success receipt screen

### 4. The Smart Try Again button

The Try Again button has two behaviours depending on whether the
`payu_payments` row was successfully fetched:

**Smart retry (payment row available):**
```
payment.event_slug + event_title + amount all present
  → setShowRetryBill(true)
  → Renders NativePaymentOverlay inline, pre-filled with recovered data
  → User can re-attempt payment immediately without re-entering anything
```

**Fallback (payment row missing or incomplete):**
```
→ onDone('/invite')
→ App navigates to /invite
→ User re-enters their phone number
```

This means in the normal case the user never has to type their phone number
again — the bill page re-opens automatically with all their details.

### 5. Smart retry — closing the inline bill overlay

When the user closes the bill overlay from within the smart retry screen
(without paying), the app does something clever:

```tsx
sessionStorage.setItem('ca_payu_retry_chat', JSON.stringify({
  name: payment.name,
  phone: payment.phone,  // normalised to 10-digit
  eventSlug: payment.event_slug,
}));
onDone('/invite');
```

On the next render of `SharedInviteFlow` (after navigating to `/invite`),
a `useEffect` reads `ca_payu_retry_chat` and automatically re-enters the
chat overlay for that phone + event — skipping the phone entry form entirely.

The retry chat also locks browser back: pressing back from it re-pushes a
history entry so the user can't accidentally navigate away mid-retry.

### 6. onDone handler — how navigation works after the return screen

`PayUReturnScreen` calls `onDone(path?)` to hand navigation back to the root
app. The root handler:

```tsx
onDone={(nextPath) => {
  setPayuReturnStatus(null);          // clears the PayU return state
  sessionStorage.removeItem('ca_payu_event_slug');
  if (nextPath?.startsWith('/')) {
    window.history.replaceState({}, '', nextPath);
    setRoutePath(nextPath);
    setRouteSearch('');
  }
}}
```

- `replaceState` is used (not `pushState`) so the failure URL is fully
  replaced in history — pressing back after recovering won't re-show the
  failure screen.

---

## Path B — Browser Back from PayU Page

### The core problem

When the user taps Pay, our app does a form POST to PayU's servers. This
navigation destroys all React state (it's a full page navigation, not a
client-side route). When the user presses browser Back:

- The browser navigates back to our app URL
- bfcache (back-forward cache) may or may not restore the page
- Even if it does, the PayU form navigation typically breaks bfcache
- Result: the app cold-starts with zero state — normally it would just show
  the `/invite` phone entry form

**The user wants to see their bill page again, not re-enter their phone.**

### The fix — `ca_payu_bill` sessionStorage key

The solution is to save all the state needed to reconstruct the bill page into
`sessionStorage` before every PayU form submission. `sessionStorage` survives
browser-back navigation.

#### When it's saved (two places)

**1. When Pay Advance is tapped (timeline → bill transition):**
```tsx
// NativeBookingTimeline onPayAdvance callback
window.history.pushState({ chapteraInviteStep: 'bill' }, '', window.location.href);
sessionStorage.setItem('ca_payu_bill', JSON.stringify({
  name: form.name.trim(),
  phone: form.phone,
  verifiedSlug,
  nativeEventData,
}));
setShowNativeBill(true);
```

This handles the first payment attempt. It also means that if the user
refreshes the page while on the bill screen, the bill is restored.

**2. Right before the PayU form is submitted (inside NativePaymentOverlay):**
```tsx
// onBeforePayU callback — called every time formRef.current.submit() fires
onBeforePayU?.();  // saves ca_payu_bill again with latest state
formRef.current.submit();
```

This is critical for the **second attempt**. On the second try, the user is
already on the bill page (restored from the first back-navigation). They tap
Pay again. Without this second save, browser-back after the second PayU
attempt would find `ca_payu_bill` empty (it was cleared on the first restore)
and fall back to the `/invite` form.

#### What is stored in `ca_payu_bill`
```json
{
  "name": "Krutesh",
  "phone": "9876543210",
  "verifiedSlug": "sunrise-at-kovalam",
  "nativeEventData": {
    "title": "Sunrise at Kovalam",
    "priceAdvance": 1000,
    "priceFull": 4500,
    "firstDate": "2026-06-15",
    "eventSlug": "sunrise-at-kovalam",
    "inviteSlug": "sunrise-at-kovalam",
    "isBalancePayment": false,
    "inviteSpots": 20,
    "bookingSteps": [...],
    "planDetails": {...},
    ...
  }
}
```

### How the restore works on cold start

On app mount, a `useEffect` runs synchronously before the first meaningful
render:

```tsx
// Synchronous loading state — shows spinner BEFORE the form can flash
const [isBillRestoreLoading] = useState(() =>
  !!sessionStorage.getItem('ca_payu_bill')
);

// On mount:
useEffect(() => {
  const raw = sessionStorage.getItem('ca_payu_bill');
  if (!raw) return;
  sessionStorage.removeItem('ca_payu_bill'); // consume immediately
  try {
    const { name, phone, verifiedSlug, nativeEventData } = JSON.parse(raw);
    setForm({ name, phone });
    setVerifiedSlug(verifiedSlug);
    setNativeEventData(nativeEventData);
    setTcAccepted(true);
    setWipePhase('revealed');
    setPosterLoaded(true);
    setBillRestored(true);   // triggers instant appearance + backdrop
    setShowNativeBill(true);
  } catch {}
  setIsBillRestoreLoading(false);
}, []);
```

**Why `isBillRestoreLoading` is a synchronous initializer:**
If it were just a `useEffect` setState, React would render the phone entry
form for one frame before the effect runs. The synchronous `useState(() => ...)`
initializer means `isBillRestoreLoading` is `true` on the very first render,
so the branded spinner shows immediately — the form never flashes.

### The poster flash problem and the backdrop fix

Even with the spinner, once `isBillRestoreLoading` becomes `false`, the app
renders the invite poster behind the bill overlay. Without extra protection,
the poster could appear for a frame before the overlay fully covers it.

Two safeguards prevent this:

**1. `billRestored` state flag** triggers a `z-[69]` backdrop:
```tsx
{showNativeBill && billRestored && (
  <div className="absolute inset-0 z-[69] bg-[#F5F5F5]" />
)}
```
This covers the poster at exactly the same z-index as the bill overlay's
background colour — seamless, no flash.

**2. `skipEntrance` prop on NativePaymentOverlay:**
```tsx
<NativePaymentOverlay
  skipEntrance={billRestored}
  ...
/>
```
Normally the overlay slides up from the bottom with `initial={{ y: '100%' }}`.
When `skipEntrance={true}`, it uses `initial={{ y: 0 }}` — it just appears
instantly with no animation, matching the user's expectation after pressing
Back.

### Browser-back from the bill page itself

The `popstate` listener in `SharedInviteFlow` handles the case where the user
presses back while already on the bill page (not coming from PayU, just
navigating back within the app):

```tsx
if (showNativeBill) {
  sessionStorage.removeItem('ca_payu_bill'); // don't restore on next load
  setBillRestored(false);
  setShowNativeBill(false);
  setShowNativeTimeline(true);  // go back to the booking timeline
  return;
}
```

The `ca_payu_bill` key is explicitly cleared here so that a subsequent page
load doesn't incorrectly restore the bill page.

### bfcache edge case — `pageshow` event

If the browser does restore the page from bfcache (some mobile browsers do),
the PayU form submission state (`paying = true`) could be stuck. A `pageshow`
listener resets it:

```tsx
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    setPaying(false);
    setPayuData(null);
    navigatingToPayU.current = false;
  }
});
```

---

## sessionStorage Keys Summary

| Key | Written when | Read when | Cleared when |
|---|---|---|---|
| `ca_payu_bill` | Pay Advance tapped (timeline→bill) AND right before every PayU form.submit() | App cold-starts (bill restore) | Consumed on restore; also cleared on manual back-navigation from bill page |
| `ca_payu_event_slug` | Right before PayU form.submit() | PayU return screen (legacy, less used now) | After PayUReturnScreen onDone() |
| `ca_payu_retry_chat` | When user closes inline retry bill overlay | SharedInviteFlow on mount | Consumed immediately after reading |

---

## State Flags Summary

| Flag | Type | Purpose |
|---|---|---|
| `isBillRestoreLoading` | `useState` (sync initializer) | Shows branded spinner on cold start when `ca_payu_bill` exists — prevents form flash |
| `billRestored` | `useState` | `true` after bill is restored from sessionStorage. Triggers backdrop z-[69] and `skipEntrance=true` on overlay |
| `isRetryLoading` | `useState` (sync initializer) | Shows branded spinner on cold start when `ca_payu_retry_chat` exists |
| `navigatingToPayU` | `useRef` | Suppresses the `beforeunload` warning when intentionally submitting to PayU |

---

## Full Flow Diagrams

### Normal payment failure
```
User taps Pay
  → history.pushState (bill step)
  → ca_payu_bill saved to sessionStorage
  → onBeforePayU() re-saves ca_payu_bill (right before submit)
  → PayU form submitted (full page navigation away from our app)
  → Payment fails on PayU
  → PayU POSTs to payu-callback
  → payu-callback updates payu_payments: status = 'failure'
  → Fires payment_failed WhatsApp (once per person per event)
  → Redirects to: /invite?payment_status=failed&txnid=CHA...
  → App mounts fresh, reads payment_status from URL
  → Shows PayUReturnScreen (failure state)
  → Fetches payu_payments row by txnid
  → Shows "Payment Failed" screen + Try Again button
  → User taps Try Again
    → payment row has full data → setShowRetryBill(true)
    → NativePaymentOverlay re-renders inline, pre-filled
    → User completes payment successfully
    → Redirected to: /invite/:slug?payment_status=success&txnid=...
```

### Browser back from PayU
```
User taps Pay
  → ca_payu_bill saved to sessionStorage (in onBeforePayU)
  → Redirected to PayU payment page
  → User presses browser Back button
  → App cold-starts at /invite (URL hasn't changed)
  → isBillRestoreLoading = true (synchronous) → spinner shown immediately
  → Bill restore useEffect runs on mount
  → Reads + consumes ca_payu_bill from sessionStorage
  → Restores: form, verifiedSlug, nativeEventData
  → Sets: billRestored = true, showNativeBill = true
  → isBillRestoreLoading = false → spinner hidden
  → Backdrop z-[69] covers poster (no poster flash)
  → NativePaymentOverlay renders with skipEntrance = true (no slide animation)
  → Bill page appears instantly, exactly as user left it
  → User taps Pay again
    → onBeforePayU() saves ca_payu_bill again to sessionStorage
    → PayU form submitted
    → If user presses Back again → same restore flow repeats
```

---

## What Was Broken Before (Historical Context)

Before these fixes were implemented:

1. **Browser back from PayU went to `/invite` phone form** — the user had to
   re-enter their phone number every time they came back.

2. **Second back-navigation went to `/invite`** — `ca_payu_bill` was only
   saved in `onPayAdvance` (timeline→bill transition). The second attempt
   started from the already-restored bill page, bypassing `onPayAdvance`.
   `onBeforePayU` was added to re-save on every submission.

3. **Poster flashed during restore** — the bill overlay slid up with a slide
   animation (`y: '100%'`), briefly showing the poster underneath. Fixed with
   `skipEntrance=true` + backdrop.

4. **Try Again went to `/invite/:slug`** — exposed internal event slugs in the
   URL and broke events where `events.slug ≠ events.invite_slug`. Fixed by
   always using `onDone('/invite')` for the fallback path.
