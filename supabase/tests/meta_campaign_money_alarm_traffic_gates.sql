-- Regression for campaign financial gates. Run as a privileged SQL session.
-- Everything rolls back; calls only the STABLE evaluator, never alert sending.
begin;
set local statement_timeout = '15s';

create temporary table money_alarm_cases (
  campaign text, total_spend numeric, impressions_per_ad integer,
  taps_per_ad integer, expected text[]
) on commit drop;
insert into money_alarm_cases values
 ('audit_money_fix_600_zero',600,300,0,array['campaign_tap_cost_over_20','cpa_over_ad_budget']),
 ('audit_money_fix_600_no_impressions',600,0,0,array['campaign_tap_cost_over_20','cpa_over_ad_budget']),
 ('audit_money_fix_450_zero',450,300,0,array[]::text[]),
 ('audit_money_fix_600_cheap_taps',600,300,10,array['cpa_over_ad_budget']),
 ('audit_money_fix_500_boundary',500,300,0,array['campaign_tap_cost_over_20']);

do $$
begin
  if exists(select 1 from public.meta_ad_daily where ad_id like 'audit_money_fix_%')
     or exists(select 1 from public.meta_ad_guardrail_events where ad_id like 'audit_money_fix_%') then
    raise exception 'Reserved regression IDs already exist';
  end if;
end $$;

insert into public.meta_ad_daily
 (ad_id,date_start,account_id,ad_name,campaign_id,campaign_name,spend,impressions,clicks,actions)
select c.campaign||'_'||i, current_date, 'audit_money_fix', 'Regression fixture',
       c.campaign,c.campaign,
       case when i<3 then trunc(c.total_spend/3,2)
            else c.total_spend-2*trunc(c.total_spend/3,2) end,
       c.impressions_per_ad,0,
       jsonb_build_array(jsonb_build_object('action_type','offsite_conversion.fb_pixel_initiate_checkout',
                                          'value',c.taps_per_ad::text))
from money_alarm_cases c cross join generate_series(1,3) i;

-- Prove the original gates suppress the reported Rs.600 scenario.
update public.meta_ad_guardrails set min_impressions=1000,min_clicks=10
where level='campaign' and rule_key in ('cpa_over_ad_budget','campaign_tap_cost_over_20');
do $$
begin
  if exists(select 1 from public.meta_ad_guardrail_breaches()
            where ad_id='audit_money_fix_600_zero') then
    raise exception 'Original blind spot was not reproduced';
  end if;
end $$;

-- Exercise the fix through the actual evaluator.
update public.meta_ad_guardrails set min_impressions=0,min_clicks=0
where level='campaign' and rule_key in ('cpa_over_ad_budget','campaign_tap_cost_over_20');
do $$
declare c record; actual text[];
begin
  for c in select * from money_alarm_cases loop
    select coalesce(array_agg(rule_key order by rule_key),array[]::text[]) into actual
      from public.meta_ad_guardrail_breaches() where ad_id=c.campaign;
    if actual is distinct from c.expected then
      raise exception 'Case % expected %, got %',c.campaign,c.expected,actual;
    end if;
  end loop;
end $$;

select c.campaign,c.total_spend,c.expected,
       (select coalesce(array_agg(b.rule_key order by b.rule_key),array[]::text[])
        from public.meta_ad_guardrail_breaches() b where b.ad_id=c.campaign) as actual
from money_alarm_cases c order by c.campaign;
rollback;
