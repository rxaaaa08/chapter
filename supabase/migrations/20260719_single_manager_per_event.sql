-- Founder decision (2026-07-19 clarity round): exactly ONE manager per event,
-- always — handover means removing the old manager before adding the new one.
-- Enforcing it in the schema makes the "two managers, only the earliest
-- earns" ambiguity impossible instead of merely documented. The accrual
-- trigger's and forecast's earliest-active tie-breakers become dead code
-- (kept as belt-and-braces).

CREATE UNIQUE INDEX IF NOT EXISTS uq_event_managers_event
  ON public.event_managers (event_slug);
