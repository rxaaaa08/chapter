-- Pay at venue: a modifier on split-payment events. When true, the guest pays
-- the advance online to reserve and pays the balance ONLINE AT THE VENUE (same
-- PayU bill, on their phone, in front of the host) instead of days beforehand.
--
-- This is NOT cash. Nothing about payment plumbing, statuses, or commission
-- accrual changes: the balance is still a normal PayU payment and payu-callback
-- still flips the guest to fully_paid on its own.
--
-- Meaningful only when payment_mode = 'split'; ignored for 'full'. Applies to
-- both invite-only and open events. Default false so every existing event is
-- unaffected the moment this lands — nothing to backfill.
--
-- Applied to prod 2026-08-09 (9 events, 0 with the flag on).

alter table public.events
  add column if not exists pay_at_venue boolean not null default false;

comment on column public.events.pay_at_venue is
  'Split events only: guest pays the balance online at the venue instead of before the event. Presentation + group-chat access modifier; does not change payment plumbing.';
