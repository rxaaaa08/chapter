-- Match quality + browser/server pairing, recorded daily by the watchdog
-- =============================================================================
-- Builds handoff §13 item 2 ("record measurement-quality history automatically",
-- owner said yes 2026-09-21) together with cloud-audit OPP-2 (owner asked for it
-- 2026-09-26), because they are the same Graph call.
--
-- WHAT IS RECORDED — one row per event per daily run, from Meta's Dataset
-- Quality API (GET /dataset_quality?dataset_id=…):
--   * event_match_quality.composite_score — EMQ, 0–10. Went 8.0 → 9.3 → 8 across
--     three hand reads in September and nobody noticed for two weeks (§27.1).
--   * match_key_feedback — coverage % per key (email, phone, fbp, ln …).
--   * event_coverage.percentage / goal_percentage — "the 7-day average percent of
--     Pixel events that are covered by the Conversions API, and share
--     deduplication keys with events from the Conversions API". Meta's goal: 75.
--     THIS is the number that once caught a real bug here: the open flow's
--     browser Lead carried no event_id, holding Lead coverage at 33%
--     (src/AppFlow.tsx comment). Nothing watched it until now.
--   * dedupe_key_feedback — which key did the pairing, browser vs server share.
--   * data_freshness.upload_frequency, and EMQ diagnostics — stored raw, never
--     alarmed on.
-- The whole per-event object is kept in `raw` too, so a question asked later is
-- a query, not a re-read — this history cannot be backfilled.
--
-- WHAT IS JUDGED — Purchase and Lead only. They are the only events with a
-- server twin; the five browser-only events read near zero coverage forever BY
-- DESIGN and have no EMQ at all (§27.1). They are stored, never graded.
--
-- THE VERDICT (meta_dataset_quality_evaluate), written into meta_signal_checks
-- under the new check key 'dataset_quality' so it appears on the existing
-- "Is Meta hearing about your sales?" card and uses its push machinery:
--   ok         — Purchase and Lead, where graded, are at or above Meta's goal.
--   gap        — (page only, amber) coverage below goal on the latest run, or
--                EMQ at least 1.5 below its 30-day best on two runs in a row.
--   broken     — (pushes) coverage below goal on EVERY run for at least 7 days.
--   too_few    — Meta returned no coverage figure for either event (no sale and
--                no application in its 7-day window). Measured 2026-09-26: the
--                reply had no Purchase entry and no EMQ at all.
--   unreadable — the call failed (set by the function, not here).
--
-- WHY 7 DAYS BEFORE A PUSH. Coverage is Meta's 7-day average, so two daily reads
-- share six days of data — "two runs in a row" would be the same evidence twice.
-- At 6–12 sales a month one odd sale can drag a 7-day window under 75% and roll
-- out a week later. A real bug (like the missing event_id) never rolls out. A
-- streak longer than the window is the cheapest test that tells them apart. The
-- page still goes amber on day one, so nothing is hidden — only the phone waits.

-- ── The history table ───────────────────────────────────────────────────────
create table if not exists public.meta_dataset_quality (
  id                bigint generated always as identity primary key,
  checked_at        timestamptz not null,
  dataset_id        text not null,
  event_name        text not null,
  emq_score         numeric,          -- NULL = Meta gave no score, never "0"
  match_keys        jsonb,            -- {"email": 100, "ln": 33.3, …}
  coverage_pct      numeric,          -- NULL = no figure this run
  coverage_goal_pct numeric,
  dedupe_keys       jsonb,            -- Meta's array, as returned
  data_freshness    text,
  diagnostics       jsonb,
  fields_shape      text not null,    -- which rung of the field ladder answered
  raw               jsonb not null
);

create index if not exists meta_dataset_quality_event_time
  on public.meta_dataset_quality (event_name, checked_at desc);

comment on table public.meta_dataset_quality is
  'Daily Dataset Quality API reads: EMQ, match-key coverage, event coverage and '
  'dedup keys per event. Written only by meta_dataset_quality_evaluate() from '
  'meta-signal-watchdog. Graded for Purchase and Lead only. Cannot be backfilled.';

alter table public.meta_dataset_quality enable row level security;
revoke all on public.meta_dataset_quality from anon, authenticated;

-- ── Register the check ──────────────────────────────────────────────────────
alter table public.meta_signal_watch drop constraint if exists meta_signal_watch_check_key_check;
alter table public.meta_signal_watch add constraint meta_signal_watch_check_key_check
  check (check_key = any (array['capi_token','capi_test_mode','purchase_server','lead_server',
                                'view_content_web','add_to_cart_web','pixel_config',
                                'dataset_quality']));

-- cooldown 72 h: a sustained pairing fault is re-announced every third day, not
-- every morning — it is a code fix, not an outage, and a daily repeat of the
-- same sentence is how alerts get swiped away.
insert into public.meta_signal_watch (check_key, label, kind, sort_order, cooldown_hours, enabled, push_enabled)
values ('dataset_quality', 'Match quality & pairing', 'probe', 80, 72, true, true)
on conflict (check_key) do nothing;

-- ── Record + judge ──────────────────────────────────────────────────────────
-- p_web is the `web` array exactly as Meta returned it. Inserts one history row
-- per event, then returns {verdict, detail} for meta_signal_record().
create or replace function public.meta_dataset_quality_evaluate(
  p_dataset_id  text,
  p_web         jsonb,
  p_fields_shape text,
  p_now         timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_ev        jsonb;
  v_name      text;
  v_graded    jsonb := '[]'::jsonb;
  v_verdict   text := 'ok';
  v_parts     text[] := '{}';
  v_any_fig   boolean := false;
  r           record;
  v_cov       numeric;
  v_goal      numeric;
  v_emq       numeric;
  v_other_at  timestamptz;
  v_streak    timestamptz;
  v_best      numeric;
  v_prev_emq  numeric;
  v_emq_drop  boolean;
  v_state     text;
begin
  if p_web is null or jsonb_typeof(p_web) <> 'array' then
    return jsonb_build_object('verdict', 'unreadable',
      'detail', jsonb_build_object('summary', 'Meta''s reply had no web section', 'fields_shape', p_fields_shape));
  end if;

  for v_ev in select * from jsonb_array_elements(p_web)
  loop
    v_name := nullif(trim(v_ev ->> 'event_name'), '');
    continue when v_name is null;
    insert into public.meta_dataset_quality (
      checked_at, dataset_id, event_name, emq_score, match_keys,
      coverage_pct, coverage_goal_pct, dedupe_keys, data_freshness, diagnostics, fields_shape, raw
    ) values (
      p_now, p_dataset_id, v_name,
      nullif(v_ev #>> '{event_match_quality,composite_score}', '')::numeric,
      (select jsonb_object_agg(k ->> 'identifier', (k #>> '{coverage,percentage}')::numeric)
         from jsonb_array_elements(case when jsonb_typeof(v_ev #> '{event_match_quality,match_key_feedback}') = 'array'
                                        then v_ev #> '{event_match_quality,match_key_feedback}' else '[]'::jsonb end) k
        where k ? 'identifier'),
      nullif(v_ev #>> '{event_coverage,percentage}', '')::numeric,
      nullif(v_ev #>> '{event_coverage,goal_percentage}', '')::numeric,
      coalesce(v_ev -> 'dedupe_key_feedback', v_ev -> 'dedup_key_feedback'),
      v_ev #>> '{data_freshness,upload_frequency}',
      v_ev #> '{event_match_quality,diagnostics}',
      coalesce(p_fields_shape, 'unknown'),
      v_ev
    );
  end loop;

  -- Grade the two paired events.
  for r in select * from (values ('Purchase', 'Sales'), ('Lead', 'Applications')) as t(ev, noun)
  loop
    -- Reset per event: PL/pgSQL keeps variables across iterations, and a
    -- Purchase value leaking into the Lead line would be a wrong number on the page.
    v_streak := null; v_best := null; v_prev_emq := null;

    select q.coverage_pct, coalesce(q.coverage_goal_pct, 75), q.emq_score
      into v_cov, v_goal, v_emq
      from public.meta_dataset_quality q
     where q.event_name = r.ev and q.checked_at = p_now and q.dataset_id = p_dataset_id
     limit 1;

    if not found then
      v_cov := null; v_goal := 75; v_emq := null;
    end if;

    v_state := 'no_data';
    if v_cov is not null then
      v_any_fig := true;
      if v_cov >= v_goal then
        v_state := 'ok';
      else
        -- Start of the current below-goal streak: the first run after the last
        -- run that was NOT below goal (at goal, or no figure).
        select max(q.checked_at) into v_other_at
          from public.meta_dataset_quality q
         where q.event_name = r.ev and q.dataset_id = p_dataset_id and q.checked_at < p_now
           and (q.coverage_pct is null or q.coverage_pct >= coalesce(q.coverage_goal_pct, 75));
        select min(q.checked_at) into v_streak
          from public.meta_dataset_quality q
         where q.event_name = r.ev and q.dataset_id = p_dataset_id and q.checked_at <= p_now
           and q.checked_at > coalesce(v_other_at, '-infinity'::timestamptz)
           and q.coverage_pct < coalesce(q.coverage_goal_pct, 75);
        v_state := case when v_streak <= p_now - interval '7 days' then 'broken' else 'gap' end;
      end if;
    end if;

    -- EMQ: a sustained fall from its 30-day best. Page only.
    v_emq_drop := false;
    if v_emq is not null then
      select max(q.emq_score) into v_best
        from public.meta_dataset_quality q
       where q.event_name = r.ev and q.dataset_id = p_dataset_id
         and q.checked_at >= p_now - interval '30 days' and q.checked_at < p_now;
      select q.emq_score into v_prev_emq
        from public.meta_dataset_quality q
       where q.event_name = r.ev and q.dataset_id = p_dataset_id and q.checked_at < p_now
       order by q.checked_at desc limit 1;
      v_emq_drop := v_best is not null and v_prev_emq is not null
                    and v_emq <= v_best - 1.5 and v_prev_emq <= v_best - 1.5;
    end if;

    if v_state = 'broken' then
      v_verdict := 'broken';
    elsif (v_state = 'gap' or v_emq_drop) and v_verdict <> 'broken' then
      v_verdict := 'gap';
    end if;

    v_parts := v_parts || (
      r.noun || ': ' ||
      case when v_emq is null then 'no match score' else 'match ' || trim(to_char(v_emq, 'FM90.0')) || '/10' end ||
      case when v_emq_drop then ' (down from ' || trim(to_char(v_best, 'FM90.0')) || ')' else '' end ||
      ' · ' ||
      case when v_cov is null then 'nothing to pair this week'
           else trim(to_char(v_cov, 'FM990.0')) || '% paired' ||
                case when v_cov < v_goal then ' (goal ' || trim(to_char(v_goal, 'FM990')) || '%)' else '' end
      end
    );

    v_graded := v_graded || jsonb_build_object(
      'event', r.ev, 'state', v_state, 'emq', v_emq, 'emq_drop', v_emq_drop, 'emq_30d_best', v_best,
      'coverage_pct', v_cov, 'coverage_goal_pct', v_goal, 'below_goal_since', case when v_state in ('gap','broken') then v_streak end
    );
  end loop;

  if v_verdict = 'ok' and not v_any_fig then
    v_verdict := 'too_few';
  end if;

  return jsonb_build_object(
    'verdict', v_verdict,
    'detail', jsonb_build_object(
      'summary', array_to_string(v_parts, ' — '),
      'graded', v_graded,
      'events_returned', (select count(*) from jsonb_array_elements(p_web)),
      'fields_shape', p_fields_shape
    )
  );
end;
$function$;

comment on function public.meta_dataset_quality_evaluate(text, jsonb, text, timestamptz) is
  'Stores one Dataset Quality read per event and returns the dataset_quality '
  'verdict. Pushes (via broken) only when Purchase/Lead pairing has been below '
  'Meta''s goal on every run for 7+ days. SERVICE ROLE ONLY.';

revoke all on function public.meta_dataset_quality_evaluate(text, jsonb, text, timestamptz) from public, anon, authenticated;
grant execute on function public.meta_dataset_quality_evaluate(text, jsonb, text, timestamptz) to service_role;

-- ── The founder reader, extended ────────────────────────────────────────────
-- Adds `quality`: Purchase and Lead history for the last 30 days, oldest first,
-- so the card can show the trend §27.1 says nobody could see.
create or replace function public.get_meta_signal_health()
returns jsonb
language sql
stable
security definer
set search_path = public
as $function$
  select case when public.is_admin_strict() then jsonb_build_object(
    'last_run_at', (select max(checked_at) from public.meta_signal_checks),
    'checks', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'check_key', w.check_key, 'label', w.label, 'kind', w.kind,
               'push_enabled', w.push_enabled,
               'verdict', c.verdict, 'checked_at', c.checked_at,
               'expected', c.expected, 'matched', c.matched, 'meta_total', c.meta_total,
               'window_start', c.window_start, 'window_end', c.window_end, 'detail', c.detail
             ) order by w.sort_order), '[]'::jsonb)
      from public.meta_signal_watch w
      left join lateral (
        select * from public.meta_signal_checks x
        where x.check_key = w.check_key order by x.checked_at desc limit 1
      ) c on true
      where w.enabled
    ),
    'alarms', (
      select coalesce(jsonb_agg(to_jsonb(a) order by a.checked_at desc), '[]'::jsonb)
      from (
        select c.check_key, w.label, c.verdict, c.checked_at, c.expected, c.matched, c.detail,
               c.notified_at, c.notify_error
        from public.meta_signal_checks c
        join public.meta_signal_watch w using (check_key)
        where c.push_decided
        order by c.checked_at desc
        limit 20
      ) a
    ),
    'quality', (
      select coalesce(jsonb_object_agg(ev, hist), '{}'::jsonb)
      from (
        select q.event_name as ev,
               jsonb_agg(jsonb_build_object('at', q.checked_at, 'emq', q.emq_score,
                                            'coverage', q.coverage_pct, 'goal', q.coverage_goal_pct)
                         order by q.checked_at) as hist
          from public.meta_dataset_quality q
         where q.event_name in ('Purchase', 'Lead')
           and q.checked_at >= now() - interval '30 days'
         group by q.event_name
      ) h
    )
  ) end
$function$;

revoke all on function public.get_meta_signal_health() from public, anon, authenticated;
grant execute on function public.get_meta_signal_health() to authenticated;
