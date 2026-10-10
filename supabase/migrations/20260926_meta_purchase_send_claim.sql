-- Claim-then-send lock for the server-side Meta Purchase.
--
-- WHY
-- Three functions can report the same sale to Meta: payu-callback (customer's
-- browser returned), payu-webhook (PayU server-to-server) and
-- verify-pending-payments (rescue cron). All three send the same event_id (the
-- PayU txnid). Meta documents that it merges a BROWSER copy with a SERVER copy
-- that share an event_id; it does not document what happens to two SERVER copies
-- under event_id dedup, and for the other dedup method it says outright that two
-- consecutive server events with the same information are NOT discarded
-- (conversions-api/12 Handling Duplicate Events.md:61). Cloud audit finding A-4,
-- 2026-09-26: a double-counted sale halves the apparent cost per purchase, the
-- one number the ads work exists to measure.
--
-- Today the webhook is silent (PayU stopped calling it after 2026-07-17, see
-- META-ADS-HANDOFF.md §28.12), so the live duplicate source is a browser-replayed
-- callback at the same status. The moment the webhook is switched back on, most
-- payments would be reported twice. This lock goes in FIRST, by the owner's
-- decision of 2026-09-26.
--
-- HOW
-- Before sending, a caller claims the row. Exactly one concurrent caller wins
-- (a single conditional UPDATE; under READ COMMITTED the loser re-checks the
-- WHERE after the winner commits and matches nothing). After the send:
--   * confirmed by Meta  -> meta_purchase_sent_at is stamped; no one sends again.
--   * not confirmed      -> the claim is released, so a later path may try again.
-- A claim older than 2 minutes with no sent_at is treated as abandoned (the
-- claiming function died mid-send); the Meta call itself times out at 3 s, so a
-- live holder never gets near that.
--
-- meta_purchase_sent_at IS NULL does NOT mean "never reported" for rows created
-- before this migration — the columns start empty. It is meaningful from
-- 2026-09-26 onward, which is also what a later A-1 retry sweep would rely on.

alter table public.payu_payments
  add column if not exists meta_purchase_claimed_at timestamptz,
  add column if not exists meta_purchase_sent_at    timestamptz;

comment on column public.payu_payments.meta_purchase_claimed_at is
  'Claim-then-send lock for the server Meta Purchase (claim_meta_purchase). Set when a function starts sending; cleared if Meta did not confirm.';
comment on column public.payu_payments.meta_purchase_sent_at is
  'When Meta confirmed the server Purchase for this txnid (events_received=1). NULL on rows before 2026-09-26 means unknown, not unsent.';

-- Returns true when THIS caller may send the Purchase for p_txnid.
-- A txnid with NO payu_payments row returns true (send, unlocked): every caller
-- has already read that row, so this should not happen, but if it ever does the
-- lock must not be the thing that silently drops a real sale.
create or replace function public.claim_meta_purchase(p_txnid text)
returns boolean
language sql
security definer
set search_path = public
as $$
  with claimed as (
    update public.payu_payments
       set meta_purchase_claimed_at = now()
     where txnid = p_txnid
       and meta_purchase_sent_at is null
       and (meta_purchase_claimed_at is null
            or meta_purchase_claimed_at < now() - interval '2 minutes')
    returning 1
  )
  select case
           when not exists (select 1 from public.payu_payments where txnid = p_txnid) then true
           else exists (select 1 from claimed)
         end;
$$;

-- Records the outcome of a claimed send. p_sent = true stamps sent_at;
-- false releases the claim so another path can try.
create or replace function public.finish_meta_purchase(p_txnid text, p_sent boolean)
returns void
language sql
security definer
set search_path = public
as $$
  update public.payu_payments
     set meta_purchase_sent_at    = case when p_sent then now() else meta_purchase_sent_at end,
         meta_purchase_claimed_at = case when p_sent then meta_purchase_claimed_at else null end
   where txnid = p_txnid
     and meta_purchase_sent_at is null;
$$;

-- Server-only. A REVOKE must name PUBLIC, or the default PUBLIC grant survives
-- and anon can still call it (memory: function-revoke-must-name-public).
revoke all on function public.claim_meta_purchase(text)           from public, anon, authenticated;
revoke all on function public.finish_meta_purchase(text, boolean) from public, anon, authenticated;
grant execute on function public.claim_meta_purchase(text)           to service_role;
grant execute on function public.finish_meta_purchase(text, boolean) to service_role;

-- ── Added the same day for the A-1 retry sweep (applied as migration
--    `meta_purchase_send_attempts`) ─────────────────────────────────────────
-- verify-pending-payments now re-sends sales Meta never confirmed. Each claim
-- counts an attempt, and the sweep stops at 5, so an event Meta permanently
-- rejects is not re-sent every 15 minutes for a week.
alter table public.payu_payments
  add column if not exists meta_purchase_attempts integer not null default 0;
comment on column public.payu_payments.meta_purchase_attempts is
  'How many times a server Meta Purchase send was claimed for this txnid. The verify-pending-payments retry sweep (cloud audit A-1) stops at 5 so a permanently rejected event is not re-sent every 15 minutes.';

create or replace function public.claim_meta_purchase(p_txnid text)
returns boolean
language sql
security definer
set search_path = public
as $$
  with claimed as (
    update public.payu_payments
       set meta_purchase_claimed_at = now(),
           meta_purchase_attempts   = meta_purchase_attempts + 1
     where txnid = p_txnid
       and meta_purchase_sent_at is null
       and (meta_purchase_claimed_at is null
            or meta_purchase_claimed_at < now() - interval '2 minutes')
    returning 1
  )
  select case
           when not exists (select 1 from public.payu_payments where txnid = p_txnid) then true
           else exists (select 1 from claimed)
         end;
$$;
revoke all on function public.claim_meta_purchase(text) from public, anon, authenticated;
grant execute on function public.claim_meta_purchase(text) to service_role;

create index if not exists payu_payments_meta_purchase_unconfirmed_idx
  on public.payu_payments (created_at)
  where status = 'success' and meta_purchase_sent_at is null;
