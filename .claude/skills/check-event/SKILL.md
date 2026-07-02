---
name: check-event
description: Pre-launch health check for an event. Verifies per-date booking timelines, sane balance-due dates, spots-left, application status counts, orphaned payments, and stray marketer mappings — the checks that keep catching real bugs before an event goes live. Use before announcing/opening an event, or when the user asks to "check event X".
---

# /check-event — event health check

Runs read-only SQL against the PROD Supabase project (`txcmismkdttgsyhbnexf`) via the
Supabase MCP `execute_sql` tool. Read-only — no writes. `$ARGUMENTS` = the event name or slug.

## 1. Resolve the event
```sql
select slug, title, booking_url, invite_only, payment_mode, is_active
from events where slug ilike '%<arg>%' or title ilike '%<arg>%';
```
If more than one matches, show them and ask which. Note `payment_mode` — `full` events
have NO balance step (skip balance checks for them).

## 2. Per-date timeline + balance-date sanity
```sql
select ed.start_date, ed.status,
  jsonb_array_length(coalesce(ed.booking_steps,'[]'::jsonb)) as n_steps,
  (select s->>'date' from jsonb_array_elements(coalesce(ed.booking_steps,'[]')) s
     where s->>'value' ilike '%{advance}%' or s->>'label' ilike '%advance%' limit 1) as advance_date,
  (select s->>'date' from jsonb_array_elements(coalesce(ed.booking_steps,'[]')) s
     where s->>'value' ilike '%{balance}%' or s->>'label' ilike '%balance%' limit 1) as balance_date
from event_dates ed join events e on e.id = ed.event_id
where e.slug = '<slug>' order by ed.start_date;
```
FLAG: `n_steps = 0` on a date (timeline wiped/unset); a `balance_date` that is empty,
before the advance date, before today, or after the event's own `start_date`. These are
the exact multi-date bugs that have bitten before.

## 3. Spots left per date (all bookings, via the RPC)
```sql
select selected_date, registered, reserved
from event_booking_counts_by_date('<slug>') order by selected_date;
```
Compare `reserved` against capacity (`events.invite_spots` or `total_capacity`).

## 4. Application status breakdown
```sql
select status, cart_abandoned, (recovered_at is not null) as recovered, count(*)
from applications where event_slug = '<slug>'
group by status, cart_abandoned, recovered order by status;
```

## 5. Orphaned payments (paid but status not reflecting it — the "flipped back" bug)
```sql
select a.name, right(a.phone,4) as phone_last4, a.status, p.payment_type, p.created_at
from applications a
join payu_payments p on p.phone = a.phone and p.event_slug = a.event_slug and p.status='success'
where a.event_slug = '<slug>' and a.status not in ('advance_paid','fully_paid');
```
Any row here = a paying customer whose status is wrong. FLAG loudly.

## 6. Stray marketer mappings (open events shouldn't consume marketers unless intended)
```sql
select em.marketer_id, cm.name from event_marketers em
join call_marketers cm on cm.id = em.marketer_id where em.event_slug = '<slug>';
```
For a `payu-hosted` (open) event, note if any exist so the user can confirm it's intended.

## Report
A compact PASS/FLAG summary per section, phones masked to last 4 digits. Do NOT auto-fix
anything — surface findings and let the user decide. If a fix is wanted, propose it and
(for data fixes) guard writes with `status not in ('advance_paid','fully_paid')`.
