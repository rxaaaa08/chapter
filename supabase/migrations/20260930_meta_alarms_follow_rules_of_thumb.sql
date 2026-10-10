-- 2026-09-30, owner, replacing 20260930_meta_cost_alarm_break_even_immediate.sql:
-- "I want this implemented in the alarm, I overstated when I said warn me
-- immediately." "This" is the rules-of-thumb table from the lesson synthesis
-- (Part 3), as explained to him at Founders Meet's Rs.100 ad money per ticket:
--
--   1. Wait until Rs.300-500 is spent before judging whether tickets cost too
--      much (3-5x target; Blue Sense ~5x).       -> cost alarm waits for Rs.500.
--   2. If Rs.150-200 is spent and nothing sold, look at it (stop-loss at ~2x
--      target: Cordeddu 2x, Griffin 1.5-2x).    -> NEW per-ad "Rs.200, no sale".
--   3. Big decisions only after ~10 sales.      -> the plan's Rs.1,000 read; no alarm.
--   4. 3 days for a hint, 7 for a decision.     -> unchanged: 7-day window, day-4 read.
--
-- Cost per ticket stays judged per CAMPAIGN at break-even (100% of ad money per
-- ticket = Rs.100 on Founders Meet), now from Rs.500 of campaign spend with the
-- original noise floors (1,000 impressions, 10 clicks) back. At Rs.150/day the
-- campaign reaches Rs.500 on about day 4, which is the plan's first look.
--
-- The stop-loss is per AD, because its job is "a dead ad is eating money". It is
-- two rules on the existing metrics, so the push wording and the metric CHECK
-- need no change: Rs.200 with no lead (a traffic problem) and Rs.200 with leads
-- but no ticket (a conversion problem), disjoint as at campaign level. Rs.200 is
-- an ABSOLUTE amount = 2x Founders Meet's Rs.100: a zero-sale ad has no ticket to
-- price a percentage from. No impression or click floor: the spend is the floor,
-- and an ad nobody taps must be caught too (the CTR alarm also covers that).
-- The campaign-level Rs.500 no-lead / no-ticket rules stay, for a campaign whose
-- ads each stay under Rs.200 but add up.
--
-- Stated once, in the notes: on an ad that IS on target (Rs.100 a ticket), Rs.200
-- with zero sales still happens about 1 time in 7 by luck (Poisson e^-2 = 13.5%).
-- It means "look at it", not "switch it off".

update public.meta_ad_guardrails
   set threshold = 100,
       min_spend = 500,
       min_impressions = 1000,
       min_clicks = 10,
       label = 'Campaign cost per ticket above break-even',
       notes = notes || ' CHANGED AGAIN 2026-09-30 (owner: "I overstated when I said warn me immediately"): '
               || 'break-even (100) kept, but waits for Rs.500 of campaign spend with the 1,000-impression / '
               || '10-click floors back, per the rules-of-thumb table (judge after 3-5x target = Rs.300-500). '
               || 'At Rs.150/day that is about day 4, the plan''s first look.',
       updated_at = now()
 where rule_key = 'cpa_over_ad_budget';

insert into public.meta_ad_guardrails
  (rule_key, label, metric, comparator, threshold, threshold_mode, level,
   min_spend, min_impressions, min_clicks, window_days, cooldown_hours, enabled, notes)
values
  ('ad_spend_no_lead_200', 'Ad: Rs.200 spent, not one lead', 'spend_without_lead', 'gt', 200, 'absolute', 'ad',
   200, 0, 0, 7, 24, true,
   'Stop-loss, 2026-09-30 (owner, rules-of-thumb table row 2): an AD that has spent Rs.200 (2x Founders Meet''s '
   || 'Rs.100 ad money per ticket; Cordeddu 2x, Griffin 1.5-2x) without one lead. A TRAFFIC problem: the ad '
   || 'or its audience. Look at it; an on-target ad hits this by luck about 1 time in 7. Disjoint from '
   || 'ad_spend_no_ticket_200 by construction.'),
  ('ad_spend_no_ticket_200', 'Ad: Rs.200 spent, people started booking, nobody paid', 'spend_without_ticket', 'gt', 200, 'absolute', 'ad',
   200, 0, 0, 7, 24, true,
   'Stop-loss, 2026-09-30 (owner, rules-of-thumb table row 2): an AD that has spent Rs.200 with leads but no '
   || 'paid ticket. A CONVERSION problem: the offer, the price screen or checkout, not the creative. Look at '
   || 'the funnel before touching the ad; an on-target ad hits this by luck about 1 time in 7.')
on conflict (rule_key) do nothing;
