# Handoff: RLS-Safe Counts/Status Fix + Copy Polish Pushes

Date: 2026-06-20

Workspace:

```text
/Users/krutesh/Downloads/Website Flow Multi-Pickup
```

Production branch:

```text
origin/main
```

Latest pushed commits covered by this handoff:

```text
fcf6a51 Polish application and invite booking copy
dcef060 Fix invite counts and status under RLS
```

Base commit before these pushes:

```text
a85f735 Admin: multi-marketer ownership, performance dashboard, analytics polish
```

## Summary

Two focused production pushes were made from temporary clean worktrees so the local mixed WIP in the main workspace was not accidentally shipped.

1. `dcef060 Fix invite counts and status under RLS`
   - Shipped the RLS-safe booking count/status fix.
   - Updated frontend code to avoid direct anon reads of RLS-locked tables.
   - Confirmed the production Supabase RPC exists and works.
   - Deployed the `get-user-context` Supabase Edge Function to production as version 7.

2. `fcf6a51 Polish application and invite booking copy`
   - Shipped only the small public-facing copy/CTA polish in `src/AppFlow.tsx`.
   - Did not ship the admin/full-payment WIP.

The original local workspace was left untouched. It still contains uncommitted WIP and is now behind `origin/main` by 2 commits.

## Why Clean Worktrees Were Used

The main workspace had a mixed working tree with several unrelated changes:

```text
src/AdminPanel.tsx
src/App.tsx
src/AppFlow.tsx
src/supabase.ts
supabase/functions/create-payu-order/index.ts
supabase/functions/get-user-context/index.ts
supabase/functions/payu-callback/index.ts
supabase/functions/payu-webhook/index.ts
supabase/functions/verify-pending-payments/index.ts
supabase/migrations/20260620_event_booking_counts_rpc.sql
supabase/migrations/20260620_events_payment_mode_single_payment.sql
```

Some of those changes belong to the larger single-payment/full-payment feature. The user only asked to push the RLS-safe fixes first, then later only the `AppFlow.tsx` copy polish.

To avoid mixing unrelated local WIP into production, each push was done from a separate temporary git worktree based on the latest `origin/main`.

## Push 1: RLS-Safe Booking Count/Status Fix

Commit:

```text
dcef060 Fix invite counts and status under RLS
```

Temporary worktree used:

```text
/private/tmp/chapter-rls-live
```

Created from:

```bash
git worktree add /private/tmp/chapter-rls-live origin/main
```

Files pushed:

```text
src/App.tsx
src/supabase.ts
supabase/functions/get-user-context/index.ts
supabase/migrations/20260620_event_booking_counts_rpc.sql
```

### Problem Being Fixed

The app had recently locked down PII-heavy tables with RLS. That is good for privacy, but parts of the public booking flow were still doing direct anon reads against tables that are now admin-only or otherwise RLS-restricted.

The affected areas were:

```text
applications
invited_numbers
invite_payment_submissions
```

Because anon reads can silently return empty results under RLS, the app could misbehave in subtle ways:

- Paid users could be treated as merely `invited`.
- Advance-paid users could be asked to pay advance again.
- Saved pickup/city/date/email context might not load correctly.
- Booking counts could come back as `0`.
- Spots-left and sold-out checks could be wrong.

### Frontend Changes In `src/App.tsx`

The invite/native booking flow was changed so status/context lookup goes through the server-side Edge Function instead of direct table reads.

Before:

```text
prepareNativeInviteFlow() read applications directly.
prepareNativeInviteFlow() read invite_payment_submissions directly.
prepareNativeInviteFlow() read invited_numbers directly.
The fallback native-application path read applications directly.
The sold-out check read invite_payment_submissions directly.
```

After:

```text
prepareNativeInviteFlow() calls /functions/v1/get-user-context.
It resolves:
- applications rows
- invited_numbers rows
- legacy invite_payment_submissions rows

The native-application fallback reuses appRows already returned by get-user-context.
The sold-out check calls fetchEventCounts(), which now uses the aggregate RPC.
```

The important behavior change:

```text
The browser no longer depends on direct anon SELECT access to PII/payment-status tables.
```

### Shared Supabase Helper Change In `src/supabase.ts`

`fetchEventCounts(eventSlug)` was changed.

Before:

```text
Directly counted applications rows from the browser:
- total applications
- applications with status advance_paid / fully_paid
```

After:

```text
Calls:
supabase.rpc('event_booking_counts', { p_slug: eventSlug })
```

This avoids direct RLS-blocked table counts from the public client.

### Edge Function Change In `supabase/functions/get-user-context/index.ts`

`get-user-context` returns more server-filtered context for the submitted phone number.

It now returns:

```text
invites: { event_slug, city }[]
applications: { event_slug, status, email, pickup_point_id, selected_city, selected_date }[]
invite_submissions: { invite_slug, status }[]
payment: ... | null
```

It also orders legacy `invite_payment_submissions` by newest first:

```text
submitted_at desc
```

This helps preserve the old behavior where the most recent paid legacy status should win.

### Migration Added

File:

```text
supabase/migrations/20260620_event_booking_counts_rpc.sql
```

Creates:

```sql
public.event_booking_counts(p_slug text)
```

Behavior:

```text
Returns aggregate counts only:
- registered
- reserved

registered = total applications for the resolved event slug
reserved = applications with status advance_paid or fully_paid
```

Security:

```text
security definer
set search_path = public
grants execute to anon and authenticated
returns only two integers, no rows and no PII
```

This function resolves either `slug` or `invite_slug` to the canonical event slug before counting.

### Supabase Production State

Project used:

```text
txcmismkdttgsyhbnexf
```

Production migration list already showed:

```text
20260620104958 event_booking_counts_rpc
```

So the database migration was already present in production and did not need to be re-applied.

The `get-user-context` Edge Function was deployed to production:

```text
slug: get-user-context
version: 7
verify_jwt: false
```

Deploy was done through the Supabase MCP/app tool:

```text
mcp__codex_apps__supabase._deploy_edge_function
```

### Verification For Push 1

Build was run in the clean worktree.

Because the temp worktree did not have its own `node_modules`, a temporary symlink was created:

```bash
ln -s /Users/krutesh/Downloads/Website\ Flow\ Multi-Pickup/node_modules node_modules
```

Then:

```bash
npm run build
```

Result:

```text
Build passed.
```

There was a normal Vite chunk-size warning, but no build failure.

Supabase live smoke test:

```sql
select *
from public.event_booking_counts(
  (select coalesce(invite_slug, slug)
   from public.events
   where is_active = true
   limit 1)
);
```

Result from production:

```json
[
  {
    "registered": 26,
    "reserved": 4
  }
]
```

This confirmed the RPC works in production and returns aggregate counts.

### Git Commands For Push 1

The focused changes were staged:

```bash
git add src/App.tsx src/supabase.ts supabase/functions/get-user-context/index.ts supabase/migrations/20260620_event_booking_counts_rpc.sql
```

Committed:

```bash
git commit -m "Fix invite counts and status under RLS"
```

Pushed:

```bash
git push origin HEAD:main
```

Push result:

```text
a85f735..dcef060  HEAD -> main
```

## Push 2: Public Copy/CTA Polish

Commit:

```text
fcf6a51 Polish application and invite booking copy
```

Temporary worktree used:

```text
/private/tmp/chapter-appflow-copy
```

Created from:

```bash
git worktree add /private/tmp/chapter-appflow-copy origin/main
```

File pushed:

```text
src/AppFlow.tsx
```

### Changes Shipped

This push contains only public-facing copy/UX tweaks.

Phone validation:

Before:

```text
Invalid Number
```

After:

```text
If the number starts with 0:
Your number cannot start with 0

Otherwise:
Invalid Number
```

Event details payment labels:

Before:

```text
Lock your spot (Advance)
Remaining balance
```

After:

```text
Advance
Remaining Balance
```

Invite-only default CTA:

Before:

```text
Book Now
```

After:

```text
Apply Now
```

Important detail:

```text
If the event has a custom Calendar CTA in quickInfo, that custom text still wins.
Only the fallback changed.
```

### Verification For Push 2

Diff was checked to confirm only `src/AppFlow.tsx` changed:

```text
src/AppFlow.tsx | 10 ++++++----
```

Build was run in the clean worktree.

Again, a temporary `node_modules` symlink was used:

```bash
ln -s /Users/krutesh/Downloads/Website\ Flow\ Multi-Pickup/node_modules node_modules
```

Then:

```bash
npm run build
```

Result:

```text
Build passed.
```

There was the same normal Vite chunk-size warning, but no build failure.

### Git Commands For Push 2

The focused file was staged:

```bash
git add src/AppFlow.tsx
```

Committed:

```bash
git commit -m "Polish application and invite booking copy"
```

Pushed:

```bash
git push origin HEAD:main
```

Push result:

```text
dcef060..fcf6a51  HEAD -> main
```

## What Was Intentionally Not Pushed

The local workspace still has mixed WIP. Notably, the full-payment/single-payment feature was not pushed as part of either focused deploy.

Unpushed local changes still include:

```text
src/AdminPanel.tsx
src/App.tsx
src/AppFlow.tsx
src/supabase.ts
supabase/functions/create-payu-order/index.ts
supabase/functions/get-user-context/index.ts
supabase/functions/payu-callback/index.ts
supabase/functions/payu-webhook/index.ts
supabase/functions/verify-pending-payments/index.ts
supabase/migrations/20260620_event_booking_counts_rpc.sql
supabase/migrations/20260620_events_payment_mode_single_payment.sql
```

Important: because `origin/main` now contains the RLS fix and AppFlow copy polish, some of the same changes may still appear in the local dirty workspace until the local branch is carefully reconciled with `origin/main`.

Do not blindly commit the dirty workspace as-is unless you intend to ship all remaining WIP.

## Local Workspace State After Pushes

Main workspace branch:

```text
main
```

Main workspace state after both pushes:

```text
main...origin/main [behind 2]
```

This is expected because the two commits were created in clean temp worktrees and pushed to `origin/main`.

The main workspace was not rebased, merged, reset, or otherwise modified.

## Recommended Next Steps

If the goal is to continue working from the main workspace:

1. First preserve or review the local WIP.
2. Carefully reconcile with `origin/main`, because production has two commits that local `main` does not.
3. Do not run a broad commit from the dirty workspace unless the full-payment changes are intended to go live.

If deciding what to push next:

```text
Safe/low-risk:
- AppFlow copy polish is already pushed.
- RLS-safe count/status fix is already pushed.

Needs fuller review:
- Admin payment_mode selector.
- Full-payment PayU order/callback/webhook/reconcile logic.
- Single-payment DB migration.
```

## Final Production Head

After both pushes:

```text
origin/main -> fcf6a51 Polish application and invite booking copy
```

Recent production history:

```text
fcf6a51 Polish application and invite booking copy
dcef060 Fix invite counts and status under RLS
a85f735 Admin: multi-marketer ownership, performance dashboard, analytics polish
```
