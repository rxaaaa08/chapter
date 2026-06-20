-- Single-payment events.
--   payment_mode = 'split' (advance + remaining balance — default, current behaviour)
--                = 'full'  (one-shot full payment; status jumps straight to fully_paid)
-- Default 'split' so every existing event keeps its current two-payment flow.
alter table public.events
  add column if not exists payment_mode text not null default 'split';

alter table public.events
  drop constraint if exists events_payment_mode_check;
alter table public.events
  add constraint events_payment_mode_check check (payment_mode in ('split', 'full'));

-- One-shot AiSensy dedup flag for the new paid-in-full WhatsApp (mirrors the
-- existing aisensy_advance_paid_sent / aisensy_balance_paid_sent flags).
alter table public.applications
  add column if not exists aisensy_full_paid_sent boolean not null default false;
