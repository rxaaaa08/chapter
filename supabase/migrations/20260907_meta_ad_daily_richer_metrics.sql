-- Widen what we keep per ad per day. All from the same insights call and the
-- same ads_read token — we simply were not asking. Added now rather than later
-- because the sync re-pulls a 14-day trailing window, so these backfill for the
-- last fortnight automatically; a column added after a campaign runs starts
-- empty for everything before it.
alter table public.meta_ad_daily
  add column if not exists cpc                     numeric(12,4),
  add column if not exists cpm                     numeric(12,4),
  add column if not exists ctr                     numeric(8,4),
  add column if not exists unique_clicks           bigint,
  add column if not exists outbound_clicks         bigint,
  add column if not exists quality_ranking         text,
  add column if not exists engagement_rate_ranking text,
  add column if not exists conversion_rate_ranking text,
  add column if not exists actions              jsonb,
  add column if not exists action_values        jsonb,
  add column if not exists cost_per_action_type jsonb;

comment on column public.meta_ad_daily.quality_ranking is
  'Meta ad relevance diagnostic. String enum, not numeric: ABOVE_AVERAGE / AVERAGE / BELOW_AVERAGE_10 / BELOW_AVERAGE_20 / BELOW_AVERAGE_35 / UNKNOWN.';
comment on column public.meta_ad_daily.actions is
  'The raw actions array exactly as Meta sent it. meta_purchases/meta_leads are extracted from this; keeping the original means new questions do not need a re-sync, and Meta only serves ~37 months of history.';
