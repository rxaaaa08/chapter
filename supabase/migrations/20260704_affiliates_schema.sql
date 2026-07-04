-- ─────────────────────────────────────────────────────────────────────────────
-- AFFILIATE (creator) links — schema
--
-- Instagram creators get a link chaptera.in/@<handle> (→ /lifestyle?ref=<handle>).
-- When a customer they referred reaches fully_paid on an affiliate-enabled event,
-- the creator earns a commission (default 8% of the configured full price).
--
-- Mirrors the call-marketer system (20260617_marketers_*), and STACKS with it:
-- a sale can pay BOTH a marketer and an affiliate. Attribution is session-scoped
-- on the client and stamped onto applications.affiliate_id; accrual rides the
-- existing status→fully_paid flip, so create-payu-order / payu-callback are
-- untouched.
-- ─────────────────────────────────────────────────────────────────────────────

-- Creator roster. Identity is the JWT email (Google login). Creators are NOT in
-- admin_users — is_admin() must stay false for them so the RLS-locked customer
-- tables (applications, invited_numbers, …) remain invisible. `handle` is the
-- @handle used in the link (lowercase; letters/numbers/dot/underscore).
CREATE TABLE IF NOT EXISTS public.affiliates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handle      text UNIQUE NOT NULL,
  name        text NOT NULL,
  email       text UNIQUE NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT affiliates_handle_format CHECK (handle ~ '^[a-z0-9._]{1,40}$')
);
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Append-only commission ledger. One row per ticket that reached fully_paid on
-- an affiliate-enabled event with an affiliate attributed. `amount` is snapshot
-- at accrual time; `paid_out_at` is stamped when the founder settles the payout.
CREATE TABLE IF NOT EXISTS public.affiliate_sales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  affiliate_id    uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE RESTRICT,
  amount          numeric(10,2) NOT NULL,
  accrued_at      timestamptz NOT NULL DEFAULT now(),
  paid_out_at     timestamptz,
  UNIQUE (application_id)
);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_affiliate ON public.affiliate_sales(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_unpaid ON public.affiliate_sales(affiliate_id) WHERE paid_out_at IS NULL;
ALTER TABLE public.affiliate_sales ENABLE ROW LEVEL SECURITY;

-- Click log — powers the creator funnel ("N people came via your link"). Written
-- via record_affiliate_click() RPC (anon can't read this table). session_id lets
-- us count unique visitors vs raw clicks.
CREATE TABLE IF NOT EXISTS public.affiliate_clicks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id  uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  session_id    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON public.affiliate_clicks(affiliate_id, created_at);
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

-- Per-application attribution. affiliate_code = the raw ?ref= handle the client
-- sent (kept for diagnostics even when it doesn't resolve); affiliate_id = the
-- resolved creator, set by a BEFORE INSERT trigger (and the open-event
-- re-attribution RPC). NULL affiliate_id = the founder's own/official link →
-- no commission.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS affiliate_code text,
  ADD COLUMN IF NOT EXISTS affiliate_id   uuid REFERENCES public.affiliates(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_applications_affiliate ON public.applications(affiliate_id);

-- Per-event controls. affiliate_enabled OFF by default — an event pays NO
-- commission until the founder flips it on from the event editor. Rate is a flat
-- 8% but overridable per event without a migration.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS affiliate_enabled        boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliate_commission_pct numeric(5,2) NOT NULL DEFAULT 8;
