# Payment Failed Redirect Handoff

## Problem

When a PayU payment fails, the failure page has a **Try Again** button.

For a failed Chill-pill in Himalayas payment, the user landed on a URL like:

```txt
https://chaptera.in/invite/chill-pill-in-himalayas?payment_status=failed&txnid=CHA1779310833672D7FT
```

Pressing **Try Again** redirected them to:

```txt
http://chaptera.in/invite/sunrise-at-kovalam-copy-1777660218667
```

That is not acceptable because the business flow no longer uses event-specific invite links operationally. Everyone should enter through:

```txt
https://chaptera.in/invite
```

The shared invite page then asks for the user's phone number and routes them to the right event internally.

## Root Cause

The payment failure screen is rendered by `PayUReturnScreen` in `src/App.tsx`.

Before the current fix, the failed screen's **Try Again** button did this:

```tsx
const slug = payment?.event_slug || sessionStorage.getItem('ca_payu_event_slug') || undefined;
onDone(slug);
```

The app wrapper then handled that slug like this:

```tsx
const path = `/invite/${eventSlug}`;
window.history.replaceState({}, '', path);
setRoutePath(path);
```

So if `payu_payments.event_slug` contained the internal canonical event slug, the retry path became an internal event-specific URL.

This became visible for Chill-pill because its slugs are split:

```txt
events.slug        = sunrise-at-kovalam-copy-1777660218667
events.invite_slug = chill-pill-in-himalayas
```

For Sunrise at Kovalam, the bug is less visible because:

```txt
events.slug        = sunrise-at-kovalam
events.invite_slug = sunrise-at-kovalam
```

So the unique/internal URL happened to look acceptable.

## Current App Fix

We changed the frontend retry behavior so the **Try Again** button always targets the shared invite entry point:

```tsx
onClick={() => onDone('/invite')}
```

The wrapper handler was also generalized so paths beginning with `/` are used directly:

```tsx
if (nextPath?.startsWith('/')) {
  window.history.replaceState({}, '', nextPath);
  setRoutePath(nextPath);
  setRouteSearch('');
}
```

Relevant file:

```txt
src/App.tsx
```

Relevant areas:

```txt
PayUReturnScreen failed state
App wrapper PayUReturnScreen onDone handler
```

## What This Fix Solves

If the user is already on a PayU failure screen and presses **Try Again**, the app now routes them to:

```txt
/invite
```

It no longer uses:

```txt
payment.event_slug
sessionStorage.ca_payu_event_slug
/invite/:slug
```

for the retry action.

This matches the current operational model: users restart through the shared invite verification page.

## What This Does Not Fully Solve

The Supabase Edge Function can still initially redirect a failed PayU return to an event-specific failure URL.

In the patched Edge Function code we previously generated, the failure branch still does this kind of thing:

```ts
return Response.redirect(
  `${FRONTEND_URL}/invite/${redirectSlug}?payment_status=failed&txnid=${encodeURIComponent(txnid)}`,
  302
);
```

That means the initial failure URL may still be:

```txt
/invite/chill-pill-in-himalayas?payment_status=failed&txnid=...
```

or, depending on slug canonicalization:

```txt
/invite/sunrise-at-kovalam-copy-1777660218667?payment_status=failed&txnid=...
```

The frontend fix prevents the **Try Again** button from continuing down the wrong path, but the failure page URL itself can still expose an event-specific path until the Edge Function redirects are changed.

## Better Backend Fix

The better long-term fix is to change the failure redirects in `payu-callback` and possibly any failure redirect in `payu-webhook` or related PayU functions to always use:

```txt
/invite?payment_status=failed&txnid=...
```

Instead of:

```txt
/invite/:slug?payment_status=failed&txnid=...
```

Suggested failure redirect:

```ts
return Response.redirect(
  `${FRONTEND_URL}/invite?payment_status=failed&txnid=${encodeURIComponent(txnid)}`,
  302
);
```

This should be used whether or not the function can resolve the event slug.

## Why Shared `/invite` Is Preferred

The shared `/invite` flow is now the canonical user entry point.

It:

1. Asks for the phone number.
2. Checks `invited_numbers`.
3. Checks `applications`.
4. Finds the correct event/invite for that phone.
5. Opens the correct invite flow internally.

This avoids leaking old duplicate slugs such as:

```txt
sunrise-at-kovalam-copy-1777660218667
```

It also avoids sending users into event-specific URLs that are no longer part of the intended UX.

## Related Slug Context

There are two slug concepts:

```txt
events.slug        -> canonical/internal event slug; used by applications.event_slug
events.invite_slug -> public invite lookup slug; used by invited_numbers.event_slug
```

For duplicated events, these can differ. Chill-pill is an example:

```txt
events.slug        = sunrise-at-kovalam-copy-1777660218667
events.invite_slug = chill-pill-in-himalayas
```

Payment status updates should use `events.slug`.

User-facing invite routing should use the shared `/invite` page, not either slug directly.

## Recommended Final State

Frontend:

```txt
Try Again -> /invite
```

Backend:

```txt
PayU failure redirect -> /invite?payment_status=failed&txnid=...
```

PayU success redirect can stay event-aware if needed because the receipt page needs to show transaction details, but even success could eventually be normalized if the product wants all returns to use a single shared return route.

## Validation Checklist

1. Trigger a failed payment for an invite-only event where `slug !== invite_slug`.
2. Confirm the browser lands on:

```txt
/invite?payment_status=failed&txnid=...
```

after backend fix.

3. Confirm the failure screen renders.
4. Press **Try Again**.
5. Confirm the URL becomes:

```txt
/invite
```

6. Enter the invited phone number.
7. Confirm the correct event is selected internally.

## Current Status

Completed:

- Frontend **Try Again** behavior changed to `/invite`.
- TypeScript check passed.
- Production build passed.

Still recommended:

- Update `payu-callback` failure redirects to shared `/invite`.
- Check whether `payu-webhook` or any other PayU function ever redirects a browser on failure. If yes, normalize those to `/invite` too.
- Test a real failed payment for an event whose `events.slug` differs from `events.invite_slug`.
