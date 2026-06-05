-- Orthogonal behavioural flag set by the cart-abandonment job when an invited
-- user opened the bill but never paid (>= 2h). Kept SEPARATE from status so the
-- payment lifecycle (status) and the invite-flow auth gates that key off
-- status IN ('invited','advance_paid','fully_paid') stay untouched. The admin
-- People page renders "Cart Abandoned" from this flag for invited-but-unpaid
-- users; status itself remains 'invited' so they can still pay when they
-- return via the nudge.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS cart_abandoned boolean DEFAULT false;
