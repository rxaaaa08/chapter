-- L5: Cap push_subscriptions at one row per phone.
--
-- Today the table has UNIQUE (phone, endpoint) — meaning a single phone
-- can have multiple rows if it switches devices, or worse, the same
-- endpoint can appear under multiple phones (three test rows currently
-- share one apple endpoint, which is a spam vector). The consumer
-- subscribe path is currently dormant (no client writer remains after
-- the C6 consumer PWA removal), so we tighten the constraint defensively
-- so that any future re-introduction inherits the right invariant:
--
--   * One subscription per phone.
--   * Re-subscribing from a new device overwrites the old row (use
--     `upsert(..., { onConflict: 'phone' })`).
--
-- Pre-flight check (run before this migration if uncertain):
--   SELECT phone, count(*) FROM public.push_subscriptions
--     GROUP BY phone HAVING count(*) > 1;
-- Currently returns zero rows.

ALTER TABLE public.push_subscriptions
  DROP CONSTRAINT IF EXISTS push_subscriptions_phone_endpoint_key;

ALTER TABLE public.push_subscriptions
  ADD CONSTRAINT push_subscriptions_phone_key UNIQUE (phone);
