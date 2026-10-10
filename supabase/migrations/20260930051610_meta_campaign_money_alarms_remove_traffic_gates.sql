-- Owner-requested fix, 2026-09-30: campaign financial warnings must not
-- require traffic before warning about money lost. The Rs.500 spend floor
-- already bounds exposure. Remove only the two campaign rules' traffic gates.
-- CLI-created file timestamp aligned to the workspace's IST date so this
-- change follows the existing 20260930 rule migrations.
do $$
declare affected integer;
begin
  update public.meta_ad_guardrails
     set min_impressions = 0,
         min_clicks = 0,
         notes = coalesce(notes, '') ||
           ' FIXED 2026-09-30: campaign money alarms have no impression or click floor. '
           || 'The Rs.500 spend floor remains; zero-sale CPA uses spend > Rs.500. '
           || 'Low/no traffic must not suppress a financial warning.',
         updated_at = now()
   where level = 'campaign'
     and rule_key in ('cpa_over_ad_budget', 'campaign_tap_cost_over_20');
  get diagnostics affected = row_count;
  if affected <> 2 then
    raise exception 'Expected two campaign money rules, found %; fix rolled back', affected;
  end if;
end $$;
