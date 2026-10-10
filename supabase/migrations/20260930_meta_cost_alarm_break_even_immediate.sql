-- 2026-09-30, owner, same night as 20260930_meta_guardrails_campaign_level_true_frequency.sql:
-- "I want to be buzzed immediately when the ad is spending more than the breakeven".
--
-- The campaign cost rule had been set to the plan's PAUSE line (150% of what a
-- ticket leaves for ads) from Rs.1,000 of campaign spend. He wants break-even
-- (100%) and no waiting: it now fires the first time the campaign's spend per
-- paid ticket passes what a ticket leaves for ads, whatever the spend so far.
-- The spend / impressions / clicks floors go to 0 for this rule only; a ticket
-- existing already implies traffic, and "immediately" means not waiting for a
-- sample. Still judged per CAMPAIGN, still checked once a day (09:07 IST, the
-- owner's daily-cron decision), still one push per 24 h cooldown.
--
-- With NO tickets yet there is no cost per ticket; that case stays with
-- spend_no_ticket_500 / spend_no_lead_500 (Rs.500, campaign level).

update public.meta_ad_guardrails
   set threshold = 100,
       min_spend = 0,
       min_impressions = 0,
       min_clicks = 0,
       label = 'Campaign cost per ticket above break-even',
       notes = notes || ' CHANGED 2026-09-30 (owner, later the same night): back to 100 = break-even, '
               || 'and no spend/impression/click floor, so it fires the first time campaign spend per '
               || 'paid ticket passes the ad money per ticket (Founders Meet: Rs.100). "I want to be buzzed '
               || 'immediately when the ad is spending more than the breakeven."',
       updated_at = now()
 where rule_key = 'cpa_over_ad_budget';
