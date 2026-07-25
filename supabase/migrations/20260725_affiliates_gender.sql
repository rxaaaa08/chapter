-- Capture a creator's gender at signup (owner request, 2026-07-25).
--
-- Nullable and additive: every creator who signed up before this stays NULL, and
-- nothing in the product branches on it — it exists so the founders can see the
-- shape of the roster when planning which creators suit which experience.
--
-- Values are constrained so the column cannot fill up with free-text variants.
-- NULL remains legal for the existing roster and for any signup that happens
-- before the owner redeploys creator-signup (the live function ignores body
-- fields it does not know about).

alter table public.affiliates
  add column if not exists gender text
  check (gender is null or gender in ('male', 'female', 'other'));

comment on column public.affiliates.gender is
  'Self-reported at signup: male | female | other. NULL = signed up before this was collected. Nothing in the product branches on it; it is roster context for the founders.';
