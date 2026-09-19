// Site experiments — variant assignment, client side.
//
// WHY THIS EXISTS
// A Meta split test is readable on this account for exactly two metrics and
// needs paid traffic first (measured 2026-09-09 by get_experiment_feasibility:
// a purchase-level split test needs ~203 weeks). The site meanwhile takes ~400
// organic sessions a week through a fully instrumented funnel. This is the
// cheaper laboratory and it is already paid for.
//
// The database side, and the three guards that make a result trustworthy, are
// in supabase/migrations/20260909_site_experiments.sql. Read that first.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE VISITOR ID IS NOT THE SESSION ID, AND MUST NOT BE MERGED WITH IT
//
// `ca_session_id` (src/supabase.ts) is sessionStorage — it dies with the tab.
// `ca_attribution` is sessionStorage too, DELIBERATELY, so a visitor returning
// days later on a bare URL is not credited to an old ad.
//
// Experiment assignment needs the opposite: it must follow one person forever,
// or they see version A today and version B on Thursday. That looks like a bug
// to them, and it destroys the measurement — someone exposed to both variants
// before booking belongs to neither, and nothing afterwards can detect that it
// happened.
//
// So this is a THIRD id, in localStorage, with a third lifetime. Three ids for
// one visitor is not an accident to be tidied up; each one's lifetime is a
// separate correct answer to a separate question.
import { useEffect, useState } from 'react';
import { supabase, getVisitorId } from './supabase';

export { getVisitorId };

type Variant = { name: string; weight: number };
type Experiment = { key: string; variants: Variant[] };

// Populated once per page load by loadExperiments(). Empty until then, which is
// why useVariant reports `ready`.
let running: Experiment[] | null = null;
let loading: Promise<void> | null = null;

// Exposures already sent this page load. The database primary key is what
// actually enforces first-assignment-wins; this only stops us firing the same
// insert on every re-render.
const logged = new Set<string>();

// FNV-1a, mapped to [0, 1).
//
// Any stable hash would do; the requirements are that it is deterministic
// across browsers and cheap. Math.imul keeps the multiply in 32-bit territory,
// which plain `*` does not — without it the value silently loses precision past
// 2^53 and the distribution skews.
function hashToUnit(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h / 0x100000000;
}

// The experiment key is part of the hash input on purpose. Hashing the visitor
// id alone would put a given visitor in the same position of every experiment's
// range at once — so anyone in the bottom half would get the control of EVERY
// concurrent test, and two experiments running together would have perfectly
// correlated populations instead of independent ones.
function assign(exp: Experiment, visitorId: string): string {
  const u = hashToUnit(`${exp.key}:${visitorId}`);
  let acc = 0;
  for (const v of exp.variants) {
    acc += v.weight;
    if (u * 100 < acc) return v.name;
  }
  // Weights sum to 100 (enforced by a CHECK constraint), so this is only
  // reachable through floating-point edge at exactly u = 1.
  return exp.variants[exp.variants.length - 1].name;
}

// Fetch the running experiments once. Safe to call repeatedly; concurrent calls
// share one request.
//
// Only `status = 'running'` rows are readable by anon (RLS), so a draft
// experiment cannot leak its copy into the shipped page before it starts.
export function loadExperiments(): Promise<void> {
  if (running) return Promise.resolve();
  if (loading) return loading;
  loading = (async () => {
    try {
      const { data } = await supabase
        .from('experiments')
        .select('key, variants')
        .eq('status', 'running');
      running = (data ?? []) as Experiment[];
    } catch {
      // A failed fetch must never block the page. Everyone gets the control,
      // which is the current live site — the safe default by construction.
      running = [];
    }
  })();
  return loading;
}

// Record that this visitor saw this variant.
//
// A PLAIN INSERT, NOT AN UPSERT — and this is not a style preference.
// The obvious way to write "first assignment wins" is
// `.upsert(row, { onConflict: 'experiment_key,visitor_id', ignoreDuplicates: true })`,
// which reads as INSERT ... ON CONFLICT DO NOTHING and should need only the
// INSERT grant anon has. It does not work. **Measured in a real browser against
// production on 2026-09-09**: the plain insert succeeds and the upsert fails
// with `42501 new row violates row-level security policy`, because PostgREST's
// upsert path is checked against the table's UPDATE policies — and there are
// deliberately none, so that a visitor cannot re-roll their own variant or
// rewrite the denominator of a live test.
//
// An earlier version of this comment confidently asserted the opposite. It was
// reasoning about what the SQL ought to compile to rather than watching what
// happened, and the cost was an experiment that assigned variants correctly,
// rendered them correctly, and silently recorded not one exposure.
//
// So: insert, and treat a duplicate as the success it is.
async function logExposure(key: string, variant: string, visitorId: string) {
  const memo = `${key}:${visitorId}`;
  if (logged.has(memo)) return;
  logged.add(memo);
  try {
    const { error } = await supabase.from('experiment_exposures').insert({
      experiment_key: key,
      visitor_id: visitorId,
      variant,
      first_session_id: sessionStorage.getItem('ca_session_id'),
    });
    // 23505 is the unique violation on (experiment_key, visitor_id) — this
    // visitor is already recorded, which is the normal path on every visit
    // after their first. The database enforcing it is the point.
    if (error && error.code !== '23505') {
      // LOUD, not swallowed. A silently failing exposure write produces a
      // test that looks like it is running and is measuring nothing — the
      // exact failure this function has already had once.
      console.warn('[experiments] exposure NOT recorded', key, error.code, error.message);
    }
  } catch (err) {
    console.warn('[experiments] exposure insert threw', key, err);
  }
}

/**
 * Which variant this visitor should see, and whether that answer is settled.
 *
 * ```tsx
 * const { variant, ready } = useVariant('pricing-headline-v1');
 * return <h2>{variant === 'B' ? 'Pay at the venue' : 'Reserve your spot'}</h2>;
 * ```
 *
 * CALL THIS FROM THE COMPONENT THAT ACTUALLY DIFFERS, not from the app shell.
 * The exposure is logged where the hook runs, and the exposure set is the
 * denominator of the result. Log it on app boot and most of the denominator is
 * people who never reached the thing being tested — which dilutes a real effect
 * toward zero and makes a good change look like no change.
 *
 * `variant` is null until the experiment list has loaded, and null forever for
 * an experiment that is not running. Both mean "render the control".
 *
 * `ready` distinguishes those: false = still loading. For anything above the
 * fold, gate the render on `ready` to avoid a visible flip from A to B; for a
 * surface several taps into the flow, the fetch has long since finished and you
 * can ignore it.
 */
export function useVariant(key: string): { variant: string | null; ready: boolean } {
  const [state, setState] = useState<{ variant: string | null; ready: boolean }>(
    { variant: null, ready: running !== null },
  );

  useEffect(() => {
    let cancelled = false;
    loadExperiments().then(() => {
      if (cancelled) return;
      const exp = running?.find((e) => e.key === key);
      const visitorId = getVisitorId();
      if (!exp || !visitorId || !Array.isArray(exp.variants) || !exp.variants.length) {
        setState({ variant: null, ready: true });
        return;
      }
      const variant = assign(exp, visitorId);
      setState({ variant, ready: true });
      void logExposure(key, variant, visitorId);
    });
    return () => { cancelled = true; };
  }, [key]);

  return state;
}
