-- 2026-09-30, owner: "let this be 300 so we give the reel a fair chance."
--
-- The per-ad stop-loss from 20260930_meta_alarms_follow_rules_of_thumb.sql moves
-- from Rs.200 (2x the Rs.100 ad money per Founders Meet ticket) to Rs.300 (3x).
-- Why: 2x came from two presenters only (Cordeddu, whose multiple is unclear in
-- the captions, and Griffin's own heuristic), while the common rule (Blue Sense,
-- Iles) is to spend ~3x target before judging, and it explicitly covers
-- zero-sale ads ("zero or one conversions -> cut it"). An on-target ad reaches
-- Rs.300 with no sale about 1 time in 20 by luck (e^-3 = 5%), against about
-- 1 in 7 at Rs.200.
--
-- Rule keys renamed to match the amount, as was done for link_ctr_under_1pct;
-- no guardrail event rows existed yet, so no history is orphaned.

update public.meta_ad_guardrails
   set rule_key = 'ad_spend_no_lead_300',
       threshold = 300,
       min_spend = 300,
       label = 'Ad: Rs.300 spent, not one lead',
       notes = notes || ' CHANGED 2026-09-30 (owner: "let this be 300 so we give the reel a fair chance"): '
               || 'Rs.200 (2x) -> Rs.300 (3x, the common rule, which covers zero-sale ads). An on-target ad '
               || 'now hits this by luck about 1 time in 20, not 1 in 7. Was ad_spend_no_lead_200.',
       updated_at = now()
 where rule_key = 'ad_spend_no_lead_200';

update public.meta_ad_guardrails
   set rule_key = 'ad_spend_no_ticket_300',
       threshold = 300,
       min_spend = 300,
       label = 'Ad: Rs.300 spent, people started booking, nobody paid',
       notes = notes || ' CHANGED 2026-09-30 (owner: "let this be 300 so we give the reel a fair chance"): '
               || 'Rs.200 (2x) -> Rs.300 (3x, the common rule, which covers zero-sale ads). An on-target ad '
               || 'now hits this by luck about 1 time in 20, not 1 in 7. Was ad_spend_no_ticket_200.',
       updated_at = now()
 where rule_key = 'ad_spend_no_ticket_200';
