-- Call marketers: business-side record for the ops users who sell tickets
-- over phone. Identity is the JWT email (matched against admin_users.email
-- via the existing 'ops' role gate) — call_marketers is the side-car table
-- that adds commission + assignment data on top of auth.
CREATE TABLE IF NOT EXISTS public.call_marketers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text UNIQUE NOT NULL,
  name              text NOT NULL,
  commission_amount numeric(10,2) NOT NULL DEFAULT 50,
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.call_marketers ENABLE ROW LEVEL SECURITY;

-- Join: which marketers cover which event. Admin manages this from the
-- event edit form.
CREATE TABLE IF NOT EXISTS public.event_marketers (
  event_slug   text NOT NULL,
  marketer_id  uuid NOT NULL REFERENCES public.call_marketers(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_slug, marketer_id)
);
CREATE INDEX IF NOT EXISTS idx_event_marketers_marketer ON public.event_marketers(marketer_id);
ALTER TABLE public.event_marketers ENABLE ROW LEVEL SECURITY;

-- Append-only commission ledger. One row per ticket where status went to
-- fully_paid. Never updated after insert; commission disputes are resolved
-- by querying this table.
CREATE TABLE IF NOT EXISTS public.marketer_sales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  marketer_id     uuid NOT NULL REFERENCES public.call_marketers(id) ON DELETE RESTRICT,
  amount          numeric(10,2) NOT NULL,
  accrued_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id)
);
CREATE INDEX IF NOT EXISTS idx_marketer_sales_marketer ON public.marketer_sales(marketer_id);
ALTER TABLE public.marketer_sales ENABLE ROW LEVEL SECURITY;

-- Per-application ownership. NULL when no marketers are assigned to the
-- event (the BEFORE INSERT trigger silently leaves it null in that case).
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS assigned_marketer_id uuid REFERENCES public.call_marketers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_applications_assigned_marketer ON public.applications(assigned_marketer_id);
CREATE INDEX IF NOT EXISTS idx_applications_event_slug_status ON public.applications(event_slug, status);
