-- Per-ad funnel visibility: record WHERE a funnel step's visitor came from.
--
-- WHY THIS EXISTS
-- applications.attribution already answers "which bookings did this ad
-- produce". It cannot answer the more useful question: "where did this ad's
-- traffic fall out". Those are different problems with different fixes —
-- an ad that sends 100 people who all leave at the price reveal and an ad that
-- sends 100 people who never scroll past the hero look IDENTICAL in the
-- bookings table (zero bookings each), but one needs a cheaper ticket and the
-- other needs a better hook. Without a source on the funnel row there is no way
-- to tell them apart, and at 20 live ads that is the whole optimisation loop.
--
-- SAME SHAPE AS applications.attribution, deliberately. The ad-id idiom already
-- used by get_meta_ads_performance —
--     attribution->>'utm_content' ~ '^[0-9]{6,}$'
-- — works here unchanged, so spend joins to funnel steps exactly the way it
-- already joins to bookings. One mental model, one regex, one place to change.
--
-- ONE DELIBERATE DIFFERENCE: fbclid is stripped before it is written here.
-- fbclid is a Meta *matching* token, useful once at conversion time (where
-- applications.attribution still carries it in full). It is also by far the
-- largest field — up to 512 characters — and a funnel session writes ~3 rows,
-- so carrying it would triple the biggest string in the payload to answer no
-- question anyone will ask of this table. src/attribution.ts owns that rule in
-- getFunnelAttribution(); do not re-implement it at a call site.
--
-- NOT BACKFILLABLE. Every row written before this column exists has no source
-- and never will. That is the whole reason it goes in before any ad spend.
alter table public.flow_analytics
  add column if not exists attribution jsonb;

comment on column public.flow_analytics.attribution is
  'Traffic source active for this session when the step fired: utm_*, referrer, '
  'landed_at, affiliate_code. Same shape as applications.attribution EXCEPT '
  'fbclid, which is stripped (see src/attribution.ts getFunnelAttribution). '
  'NULL means direct/organic — a real answer, not a failure. Ad id is '
  'attribution->>''utm_content''.';

-- Partial on purpose: only tagged traffic is indexed, so the index stays small
-- and organic rows — which are and will remain the bulk of the table — cost
-- nothing to insert. Ad id leads because the common query is "this ad, this
-- window"; created_at second serves "all ad traffic, this window" by scanning
-- only the tagged slice.
create index if not exists flow_analytics_attribution_ad_idx
  on public.flow_analytics ((attribution->>'utm_content'), created_at desc)
  where attribution is not null;
