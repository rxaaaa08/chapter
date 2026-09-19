// meta-signal-watchdog — does Meta actually receive what happens on the site?
//
// WHY THIS EXISTS
// Every Purchase and Lead reaches Meta through one secret, META_CAPI_ACCESS_TOKEN.
// _shared/metaCapi.ts is fire-and-forget by contract — it must never delay a
// customer's receipt — so a rejected send is a console.error and nothing else.
// If the token is revoked, expires, or loses the Pixel, sales keep landing in
// payu_payments and nothing anywhere says Meta stopped hearing about them. Meta
// would optimise on half the data and the first human sign would be a week of
// inexplicably bad numbers.
//
// WHY IT WATCHES FROM THE OUTSIDE
// The obvious fix — have metaCapi.ts log every send result — edits a module
// bundled into payu-callback and payu-webhook, i.e. a five-function redeploy
// through the payment path (handoff §9, the _shared/ bundling trap). This
// function touches none of that. It compares what OUR database says happened
// with what META's dataset says it received, which also catches failures a
// send log never would: a Pixel ID changed in one place, a code path that
// stopped calling the sender at all, a browser Pixel broken by a deploy.
//
// WHY IT IS ITS OWN FUNCTION
// meta-ads-alerts already runs two independent halves every 15 minutes. The
// thing that notices other things breaking should not share a failure domain
// with them.
//
// HOW OFTEN: once a day, 09:11 IST (cron '41 3 * * *'). The founder's decision
// on 2026-09-17, made knowing a dead token is then noticed up to a day late.
// The "held for" periods in meta_signal_record() are tuned to that schedule.
//
// WHAT IT NEVER DOES
// Send an event, write to Meta, or read anything personal. Every Graph call here
// is a GET; the verdict logic lives in SQL (meta_signal_* functions), where it
// can be tested against fixtures without touching this file.
//
// THE SEVENTH CHECK, pixel_config (2026-09-19), is not a comparison of counts:
// it reads the settings file Meta serves to every visitor's browser for the
// Pixel and asks whether Meta has told the browser to drop an event, delete a
// parameter, or stop on our domain. Section 2b below; verdict in
// meta_pixel_config_verdict().
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Pinned with the other Meta functions — SIX places now. Re-derive before a bump:
//   grep -rn "API_VERSION = " supabase/functions/
const API_VERSION = 'v26.0';
const GRAPH = `https://graph.facebook.com/${API_VERSION}`;

// Same dataset as src/metaPixel.ts and _shared/metaCapi.ts.
const DEFAULT_PIXEL_ID = '28370453785913523';

const CALL_TIMEOUT_MS = 15_000;

// Warn this far ahead of a token's death date. A week covers a weekend and a
// founder who is travelling; the token cannot be replaced by anyone else.
const EXPIRY_WARN_DAYS = 7;

// A partial page set would under-count Meta's side and read as missing sales —
// a false alarm that looks exactly like a real one. Stop and say so instead.
const MAX_STATS_PAGES = 20;

// Deployed --no-verify-jwt so the cron can reach it, which means anyone with the
// URL can too. It cannot forge a result — it only reads — but each run spends
// Graph quota. Refusing a run within 5 minutes of the last one bounds that
// without needing a secret the cron would have to carry.
const MIN_RUN_GAP_MS = 5 * 60_000;

// Meta's own "try again later" family (rate limits, service hiccups). Anything
// in here means we could not LOOK, never that something is broken.
const TRANSIENT_CODES = new Set([1, 2, 4, 17, 32, 341, 613, 80000, 80001, 80002, 80003, 80004]);

type GraphError = { code: number | null; subcode: number | null; message: string };
type GraphResult = { ok: boolean; json: any; err: GraphError | null; transient: boolean };

function isPermission(e: GraphError | null) {
  const c = e?.code ?? -1;
  return c === 10 || (c >= 200 && c <= 299);
}

// The token goes in the Authorization header, but debug_token needs it as
// `input_token` in the query string, and some fetch failures stringify the whole
// URL into their message. Nothing that could hold the token is stored unscrubbed.
function scrub(s: string, secrets: string[]): string {
  let out = s;
  for (const x of secrets) if (x) out = out.split(x).join('[token]');
  return out.slice(0, 300);
}

async function graphGet(url: string, token: string, secrets: string[]): Promise<GraphResult> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json && !json.error) return { ok: true, json, err: null, transient: false };
    const e = json?.error ?? {};
    const err: GraphError = {
      code: typeof e.code === 'number' ? e.code : null,
      subcode: typeof e.error_subcode === 'number' ? e.error_subcode : null,
      message: scrub(String(e.message ?? `HTTP ${res.status}`), secrets),
    };
    const transient = e.is_transient === true || TRANSIENT_CODES.has(err.code ?? -1) || res.status >= 500;
    return { ok: false, json, err, transient };
  } catch (x) {
    // Network failure or timeout: we could not look.
    return {
      ok: false, json: null, transient: true,
      err: { code: null, subcode: null, message: scrub(x instanceof Error ? `${x.name}: ${x.message}` : String(x), secrets) },
    };
  }
}

const codeOf = (e: GraphError | null) => e ? `${e.code ?? '?'}${e.subcode ? '/' + e.subcode : ''}` : null;

// ── 1. The token ─────────────────────────────────────────────────────────────
// Two independent looks, because either can be unavailable without the token
// being at fault:
//   debug_token — is it valid, and WHEN does it die. The death date is the part
//                 worth having: it turns an outage into a week's notice.
//   the Pixel   — can this token reach the dataset at all.
// Only a definitive answer is "broken": 190 (Meta rejects the token outright),
// is_valid:false, or a Pixel marked unavailable. A permission refusal on a READ
// says nothing about whether SENDS work, so it is "unverifiable", never "broken".
async function probeToken(capiToken: string, pixelId: string, secrets: string[]) {
  if (!capiToken) {
    return { verdict: 'broken', detail: { reason: 'META_CAPI_ACCESS_TOKEN is not set' } };
  }
  const detail: Record<string, unknown> = {};
  let broken: string | null = null;
  let expiring: { at: number; days: number } | null = null;
  let confirmedWorking = false;
  let couldNotLook = false;

  const dbg = await graphGet(`${GRAPH}/debug_token?input_token=${encodeURIComponent(capiToken)}`, capiToken, secrets);
  if (dbg.ok) {
    const d = dbg.json?.data ?? {};
    detail.token_type = d.type ?? null;
    detail.token_valid = d.is_valid ?? null;
    detail.expires_at = d.expires_at ?? null;                    // 0 = never
    detail.data_access_expires_at = d.data_access_expires_at ?? null;
    detail.scopes = Array.isArray(d.scopes) ? d.scopes : null;
    // Which assets the token is scoped to. Measured 2026-09-16: SYSTEM_USER,
    // expires_at 0 (never), and the Pixel listed in its granular scope target_ids.
    // A token can stay is_valid:true after its system user loses the Pixel — and
    // then every send fails — so the scope list is the part that catches the
    // quiet version of this failure. Judged only when the list actually names
    // assets, so a response that omits target_ids cannot read as "lost access".
    const scoped = Array.isArray(d.granular_scopes)
      ? d.granular_scopes.filter((g: any) => Array.isArray(g?.target_ids) && g.target_ids.length)
      : [];
    if (scoped.length) {
      detail.pixel_in_granular_scope = scoped.some((g: any) => g.target_ids.map(String).includes(pixelId));
    }
    if (d.is_valid === false) {
      broken = `Meta says the token is not valid${d.error?.message ? ` — ${scrub(String(d.error.message), secrets)}` : ''}`;
    } else if (detail.pixel_in_granular_scope === false) {
      broken = `the token no longer has access to Pixel ${pixelId}`;
    } else if (d.is_valid === true) {
      confirmedWorking = true;
      const now = Date.now() / 1000;
      const deaths = [Number(d.expires_at), Number(d.data_access_expires_at)].filter((t) => Number.isFinite(t) && t > 0);
      const soonest = deaths.length ? Math.min(...deaths) : null;
      if (soonest !== null && soonest - now < EXPIRY_WARN_DAYS * 86400) {
        expiring = { at: soonest, days: Math.max(0, Math.floor((soonest - now) / 86400)) };
      }
    }
  } else {
    detail.debug_error = { code: codeOf(dbg.err), message: dbg.err?.message };
    if (dbg.err?.code === 190) broken = `Meta rejects the token (${codeOf(dbg.err)})`;
    else if (dbg.transient) couldNotLook = true;
    // Anything else (e.g. debug_token wanting an app token) just means this
    // look is unavailable; the Pixel read below still decides.
  }

  // Measured 2026-09-16: this read answers "(#100) Missing Permission" for the
  // CAPI token — its only named scope is read_ads_dataset_quality — so today the
  // debug_token look above is what confirms it. Kept because a token that CAN
  // read the Pixel also reports is_unavailable, and a refusal here is harmless.
  const px = await graphGet(`${GRAPH}/${pixelId}?fields=id,name,is_unavailable,last_fired_time`, capiToken, secrets);
  if (px.ok) {
    detail.pixel_readable = true;
    detail.pixel_last_fired_time = px.json?.last_fired_time ?? null;
    if (px.json?.is_unavailable === true) broken = broken ?? 'Meta marks the Pixel as unavailable';
    else confirmedWorking = true;
  } else {
    detail.pixel_readable = false;
    detail.pixel_error = { code: codeOf(px.err), message: px.err?.message };
    if (px.err?.code === 190) broken = broken ?? `Meta rejects the token (${codeOf(px.err)})`;
    else if (px.transient) couldNotLook = true;
    else if (!isPermission(px.err) && px.err?.code !== 100) couldNotLook = true;
  }

  if (broken) return { verdict: 'broken', detail: { ...detail, reason: broken } };
  if (expiring) return { verdict: 'expiring', detail: { ...detail, expires_on: new Date(expiring.at * 1000).toISOString(), days_left: expiring.days } };
  if (confirmedWorking) return { verdict: 'ok', detail };
  if (couldNotLook) return { verdict: 'unreadable', detail };
  return { verdict: 'unverifiable', detail };
}

// ── 2. Meta's side: event counts per hour ────────────────────────────────────
type Hourly = Record<string, Record<string, number>>; // event -> ISO hour -> count

async function fetchStats(
  source: 'SERVER_ONLY' | 'WEB_ONLY', startSec: number, endSec: number,
  pixelId: string, tokens: { name: string; token: string }[], secrets: string[],
): Promise<{ ok: true; hourly: Hourly; token_used: string; duplicate_entries: number; buckets: number }
         | { ok: false; error: string }> {
  const errors: string[] = [];

  for (const { name, token } of tokens) {
    if (!token) continue;
    const hourly: Hourly = {};
    let url: string | null = `${GRAPH}/${pixelId}/stats?aggregation=event&event_source=${source}` +
      `&start_time=${startSec}&end_time=${endSec}`;
    let pages = 0, buckets = 0, parsed = 0, duplicates = 0;
    let failed: GraphResult | null = null;

    while (url) {
      if (++pages > MAX_STATS_PAGES) return { ok: false, error: `page cap (${MAX_STATS_PAGES}) reached — refusing a partial count` };
      const r = await graphGet(url, token, secrets);
      if (!r.ok) { failed = r; break; }

      for (const b of Array.isArray(r.json?.data) ? r.json.data : []) {
        buckets++;
        // The raw edge names the bucket start_time; the MCP wrapper shows
        // `timestamp`. Accept both rather than guess which this version sends.
        const ms = Date.parse(String(b?.start_time ?? b?.timestamp ?? ''));
        if (!Number.isFinite(ms)) continue;
        parsed++;
        const hour = new Date(Math.floor(ms / 3_600_000) * 3_600_000).toISOString();
        const seen = new Set<string>();
        for (const e of Array.isArray(b?.data) ? b.data : []) {
          const ev = typeof e?.value === 'string' ? e.value : null;
          const n = Number(e?.count);
          if (!ev || !Number.isFinite(n) || n < 0) continue;
          hourly[ev] ??= {};
          // MAX, not sum, if one event ever appears twice in a bucket. A guard,
          // not a live correction: this hourly aggregation has returned no
          // duplicates (duplicate_entries in each check row records it).
          // Summing would be the DANGEROUS direction — an inflated Meta count
          // hides a missing sale.
          //
          // DO NOT reconcile against aggregation=event_total_counts instead.
          // Measured 2026-09-16, it is a different number: it IGNORES
          // event_source (WEB_ONLY and SERVER_ONLY return identical output, which
          // is where its twin "Purchase 2, Purchase 2" entries come from), it
          // returned nothing for a whole day holding ~32 hourly-counted plan
          // views, and its weekly totals ran below the sum of these hourly
          // buckets (132 vs 152). Reading it produced a false "Meta only sees
          // 80% of plan views"; the hourly counts said 93-98%.
          if (seen.has(ev)) duplicates++;
          seen.add(ev);
          hourly[ev][hour] = Math.max(hourly[ev][hour] ?? 0, n);
        }
      }
      url = typeof r.json?.paging?.next === 'string' ? r.json.paging.next : null;
    }

    if (failed) {
      errors.push(`${name}: ${codeOf(failed.err)} ${failed.err?.message ?? ''}`.trim());
      // A permission refusal or a dead token on one token is a reason to try
      // the other; a rate limit or outage is not — it would fail the same way.
      if (failed.transient) return { ok: false, error: errors.join(' | ') };
      continue;
    }
    // Buckets arrived and none could be read: Meta changed the shape. Counting
    // that as "zero events" would page the founder about sales that arrived fine.
    if (buckets > 0 && parsed === 0) {
      return { ok: false, error: `unrecognised stats shape (${buckets} buckets, none with a readable time)` };
    }
    console.log(`[meta-signal-watchdog] stats ${source} via ${name}: ${pages} page(s), ${buckets} bucket(s), ${duplicates} duplicate entr(ies)`);
    return { ok: true, hourly, token_used: name, duplicate_entries: duplicates, buckets };
  }
  return { ok: false, error: errors.length ? errors.join(' | ') : 'no token available to read stats' };
}

// ── 2b. What Meta has told the Pixel to do ───────────────────────────────────
// fbevents.js obeys a per-Pixel settings file Meta serves publicly (the Pixel
// docs' CSP section names the path). It can make the browser drop an event,
// delete a parameter, or switch the Pixel off on a domain, and nothing tells
// us — a stripped content_ids still arrives as a ViewContent, so the count
// checks above can never see it. This reads the rules themselves. The verdict
// is meta_pixel_config_verdict() in SQL; this only extracts facts.
//
// An anonymous GET of a public CDN file, exactly what a visitor's browser
// fetches. No token is ever attached, so none can leak here, and no Graph
// quota is spent. Fetched with NO version parameter: measured 2026-09-19, an
// old v= serves an older, smaller file (17 features vs 26), and the bare URL
// serves what live browsers load today.
const PIXEL_CONFIG_URL = 'https://connect.facebook.net/signals/config/';

// One JSON value (object or array) starting exactly at src[from], found by
// bracket matching that respects strings, then handed to JSON.parse. The file
// is JavaScript with JSON literals inside it, not JSON.
function jsonValueAt(src: string, from: number): unknown {
  const open = src[from];
  if (open !== '{' && open !== '[') throw new Error(`expected { or [ at ${from}`);
  let depth = 0, inStr = false, esc = false;
  for (let i = from; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) return JSON.parse(src.slice(from, i + 1));
    }
  }
  throw new Error('unterminated value');
}

// Mirrors fbevents' own reading: a restriction list only acts when its feature
// is opted in, and a feature with no settings object restricts nothing. Any
// shape we do not recognise is a parse error, which the verdict reports as
// "could not read" — never as "nothing restricted".
function parsePixelConfig(src: string, pixelId: string): Record<string, unknown> {
  const id = pixelId.replace(/\D/g, '');
  const facts: Record<string, unknown> = { fetched: true, bytes: src.length };
  const errors: string[] = [];
  facts.parse_errors = errors;

  const start = src.indexOf(`fbq.registerPlugin("${id}"`);
  facts.section_found = start >= 0 && src.includes(`configLoaded("${id}")`);
  if (start < 0) return facts;
  const section = src.slice(start);
  // What Meta serves for a Pixel id it does not know (measured 2026-09-19).
  facts.empty_plugin = section.includes('/* empty plugin */');

  const features = new Set<string>();
  for (const m of section.matchAll(new RegExp(`instance\\.optIn\\("${id}",\\s*"(\\w+)"`, 'g'))) features.add(m[1]);
  facts.features = [...features].sort();

  const settings: Record<string, any> = {};
  for (const m of section.matchAll(new RegExp(`config\\.set\\("${id}",\\s*"(\\w+)",\\s*`, 'g'))) {
    try { settings[m[1]] = jsonValueAt(section, (m.index ?? 0) + m[0].length); }
    catch (e) { errors.push(`${m[1]}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  if (!facts.empty_plugin && features.size === 0) errors.push('no features found in the Pixel section');

  const list = (v: unknown, what: string): string[] => {
    if (v == null) return [];
    if (Array.isArray(v) && v.every((x) => typeof x === 'string')) return v as string[];
    errors.push(`${what} is not a list of names`);
    return [];
  };
  const obj = (v: unknown, what: string): Record<string, unknown> => {
    if (v == null) return {};
    if (typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
    errors.push(`${what} is not an object`);
    return {};
  };

  const ev = features.has('EventValidation') ? settings.eventValidation : null;
  facts.restricted_events = list(ev?.restrictedEventNames, 'restrictedEventNames');
  facts.unverified_events = list(ev?.unverifiedEventNames, 'unverifiedEventNames');

  const ud = features.has('UnwantedData') ? settings.unwantedData : null;
  facts.blacklisted_keys = obj(ud?.blacklisted_keys, 'blacklisted_keys');
  facts.sensitive_keys = obj(ud?.sensitive_keys, 'sensitive_keys');

  const ps = features.has('ProhibitedSources') ? settings.prohibitedSources : null;
  const sources = ps?.prohibitedSources;
  if (sources != null && !Array.isArray(sources)) errors.push('prohibitedSources is not a list');
  facts.prohibited_sources = Array.isArray(sources) ? sources : [];

  return facts;
}

async function readPixelConfig(pixelId: string): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`${PIXEL_CONFIG_URL}${encodeURIComponent(pixelId)}`, {
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
    if (!res.ok) return { fetched: false, http_status: res.status, error: `HTTP ${res.status}` };
    const src = await res.text();
    return { ...parsePixelConfig(src, pixelId), http_status: res.status };
  } catch (x) {
    return { fetched: false, error: x instanceof Error ? `${x.name}: ${x.message}`.slice(0, 200) : String(x).slice(0, 200) };
  }
}

// ── 3. What a push says ──────────────────────────────────────────────────────
// Plain words, both sides of the comparison, and the fix — the founder reads
// this on a lock screen, and a code with no sentence is not actionable.
const NOUN: Record<string, string> = {
  purchase_server: 'paid bookings', lead_server: 'applications',
  view_content_web: 'plan views', add_to_cart_web: 'calendar opens',
};

function pushBody(key: string, verdict: string, r: any): string {
  const d = r.detail ?? {};
  let text: string;
  if (key === 'capi_token' && verdict === 'broken') {
    text = `Sales are NOT reaching Meta: ${d.reason ?? 'the reporting token failed'}. Make a new token in Events Manager → Conversions API and replace META_CAPI_ACCESS_TOKEN in Supabase.`;
  } else if (key === 'capi_token' && verdict === 'expiring') {
    const day = d.expires_on ? new Date(d.expires_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'soon';
    text = `The token that reports sales to Meta stops working on ${day} (${d.days_left ?? '?'} days). Make a new one in Events Manager → Conversions API and replace META_CAPI_ACCESS_TOKEN before then.`;
  } else if (key === 'pixel_config' && verdict === 'broken') {
    text = `${d.summary ?? 'Meta is limiting what the website Pixel can send'}. Ads optimise on what is left. Open Events Manager → the Pixel → Diagnostics.`;
  } else if (key === 'pixel_config' && verdict === 'unreadable') {
    text = `The watchdog could not read Meta's settings for the website Pixel on two daily checks in a row.${d.reason ? ` (${d.reason})` : ''}`;
  } else if (key === 'capi_test_mode') {
    text = 'Meta test mode (META_CAPI_TEST_CODE) was on at two daily checks in a row, so 90000000xx test bookings reach Meta as real sales. Remove that secret in Supabase when testing is done.';
  } else if (verdict === 'unreadable' && key === 'capi_token') {
    const why = (d.pixel_error as any)?.message ?? (d.debug_error as any)?.message;
    text = `The watchdog could not check the token that reports sales to Meta on two daily checks in a row.${why ? ` (${why})` : ''}`;
  } else if (verdict === 'unreadable') {
    text = `The watchdog could not read Meta on two daily checks in a row, so it cannot tell whether ${NOUN[key] ?? 'events'} are reaching Meta.${d.error ? ` (${d.error})` : ''}`;
  } else if (verdict === 'broken' && (key === 'purchase_server' || key === 'lead_server')) {
    const missing = (r.expected ?? 0) - (r.matched ?? 0);
    const run = Number(d.newest_unmatched_run ?? 0);
    text = `Meta did not receive ${missing} of the last ${r.expected} ${NOUN[key]} (6 days)` +
      (run >= 2 ? `, including the newest ${run}` : '') +
      '. Ads are optimising without them. Check the Conversions API token first.';
  } else if (verdict === 'broken') {
    text = `Meta saw only ${r.matched} of ${r.expected} ${NOUN[key] ?? 'events'} in the last 3 days. The Pixel on chaptera.in may be broken.`;
  } else {
    text = `${key}: ${verdict}`;
  }
  return text.slice(0, 240);
}

// ── Main ─────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  const started = Date.now();
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const capiToken = Deno.env.get('META_CAPI_ACCESS_TOKEN') ?? '';
  const adsToken = Deno.env.get('META_ADS_ACCESS_TOKEN') ?? '';
  const pixelId = Deno.env.get('META_PIXEL_ID') ?? DEFAULT_PIXEL_ID;
  const secrets = [capiToken, adsToken];

  try {
    const { data: last } = await supabase
      .from('meta_signal_checks').select('checked_at').order('checked_at', { ascending: false }).limit(1);
    const lastAt = last?.[0]?.checked_at ? Date.parse(last[0].checked_at) : 0;
    if (Date.now() - lastAt < MIN_RUN_GAP_MS) {
      return json({ ok: false, skipped: `last run ${Math.round((Date.now() - lastAt) / 1000)}s ago` }, 429);
    }

    const { data: watch, error: watchErr } = await supabase
      .from('meta_signal_watch').select('*').eq('enabled', true).order('sort_order');
    if (watchErr) throw new Error(`watch list unreadable: ${watchErr.message}`);

    type Row = { check_key: string; verdict: string; expected: number | null; matched: number | null;
                 meta_total: number | null; window_start: string | null; window_end: string | null; detail: any };
    const results: Row[] = [];
    const keys = new Set((watch ?? []).map((w: any) => w.check_key));

    if (keys.has('capi_token')) {
      const p = await probeToken(capiToken, pixelId, secrets);
      results.push({ check_key: 'capi_token', verdict: p.verdict, expected: null, matched: null,
                     meta_total: null, window_start: null, window_end: null, detail: p.detail });
    }
    if (keys.has('capi_test_mode')) {
      const on = !!Deno.env.get('META_CAPI_TEST_CODE');
      results.push({ check_key: 'capi_test_mode', verdict: on ? 'test_mode_on' : 'ok', expected: null, matched: null,
                     meta_total: null, window_start: null, window_end: null, detail: { test_code_set: on } });
    }
    if (keys.has('pixel_config')) {
      // Isolated: whatever happens here becomes this check's own 'unreadable'
      // row, never an exception that costs the other six checks their day.
      let verdict = 'unreadable';
      let detail: any = null;
      try {
        const facts = await readPixelConfig(pixelId);
        const { data: ev, error: evErr } = await supabase.rpc('meta_pixel_config_evaluate', { p_facts: facts });
        if (evErr || !ev) detail = { reason: `evaluate failed: ${evErr?.message ?? 'no result'}`, summary: 'Could not evaluate' };
        else { verdict = ev.verdict; detail = ev.detail; }
      } catch (x) {
        detail = { reason: x instanceof Error ? x.message.slice(0, 200) : 'unexpected', summary: 'Could not evaluate' };
      }
      results.push({ check_key: 'pixel_config', verdict, expected: null, matched: null,
                     meta_total: null, window_start: null, window_end: null, detail });
    }

    // One stats read per source covers every check on it: the widest window,
    // plus an hour either side for the matcher's tolerance.
    const events = (watch ?? []).filter((w: any) => w.kind === 'money' || w.kind === 'browser');
    const hourNow = Math.floor(Date.now() / 3_600_000) * 3600;
    const stats: Record<string, Awaited<ReturnType<typeof fetchStats>>> = {};
    for (const source of ['SERVER_ONLY', 'WEB_ONLY'] as const) {
      const mine = events.filter((w: any) => w.event_source === source);
      if (!mine.length) continue;
      const spanHours = Math.max(...mine.map((w: any) => w.window_hours + w.lag_hours)) + 1;
      // Reporting token first. Measured 2026-09-16: the CAPI token is refused on
      // /stats ("(#100) Missing Permission" — its only named scope is
      // read_ads_dataset_quality) and the reporting token reads it fine. The
      // CAPI token stays as a fallback in case either grant ever changes. So
      // this check's eyesight depends on META_ADS_ACCESS_TOKEN: if that dies,
      // these rows go 'unreadable' and push on the second daily check, and
      // meta-ads-sync raises its own dead-token alarm besides.
      stats[source] = await fetchStats(source, hourNow - spanHours * 3600, Math.floor(Date.now() / 1000), pixelId,
        [{ name: 'reporting', token: adsToken }, { name: 'capi', token: capiToken }], secrets);
    }

    for (const w of events) {
      const s = stats[w.event_source];
      if (!s || !s.ok) {
        results.push({ check_key: w.check_key, verdict: 'unreadable', expected: null, matched: null, meta_total: null,
                       window_start: null, window_end: null, detail: { error: s && !s.ok ? s.error : 'not fetched' } });
        continue;
      }
      const { data: ev, error: evErr } = await supabase.rpc('meta_signal_evaluate', {
        p_check_key: w.check_key, p_meta_hourly: s.hourly[w.meta_event] ?? {},
      });
      if (evErr || !ev) {
        // Our own SQL failed, not Meta. Recorded as unreadable so it is visible,
        // with the reason, rather than silently skipped.
        results.push({ check_key: w.check_key, verdict: 'unreadable', expected: null, matched: null, meta_total: null,
                       window_start: null, window_end: null, detail: { error: `evaluate failed: ${evErr?.message ?? 'no result'}` } });
        continue;
      }
      results.push({
        check_key: w.check_key, verdict: ev.verdict, expected: ev.expected, matched: ev.matched,
        meta_total: ev.meta_total, window_start: ev.window_start, window_end: ev.window_end,
        detail: { ...(ev.detail ?? {}), stats_token: s.token_used, duplicate_entries: s.duplicate_entries },
      });
    }

    const summary: { check_key: string; verdict: string; pushed: boolean }[] = [];
    for (const r of results) {
      const { data: rec, error: recErr } = await supabase.rpc('meta_signal_record', {
        p_check_key: r.check_key, p_verdict: r.verdict, p_expected: r.expected, p_matched: r.matched,
        p_meta_total: r.meta_total, p_window_start: r.window_start, p_window_end: r.window_end, p_detail: r.detail,
      });
      const row = Array.isArray(rec) ? rec[0] : rec;
      if (recErr || !row) {
        console.error(`[meta-signal-watchdog] record failed for ${r.check_key}:`, recErr?.message);
        summary.push({ check_key: r.check_key, verdict: r.verdict, pushed: false });
        continue;
      }

      let pushed = false;
      if (row.should_push) {
        const { error: pushErr } = await supabase.rpc('notify_admin_push', {
          payload: {
            // Reuses the founder-only type proven end to end on 2026-09-09
            // (handoff §16 Phase 5) rather than adding a new case to
            // send-admin-push, which sits in the payment-notification path.
            type: 'meta_ad_issue',
            record: { body: pushBody(r.check_key, r.verdict, r), object_id: `signal-${r.check_key}` },
          },
        });
        pushed = !pushErr;
        await supabase.from('meta_signal_checks').update(
          pushErr ? { notify_error: pushErr.message.slice(0, 500) } : { notified_at: new Date().toISOString() },
        ).eq('id', row.check_id);
      }
      summary.push({ check_key: r.check_key, verdict: r.verdict, pushed });
    }

    // Verdicts only in the response. The counts are business data and this URL
    // is public; they live in meta_signal_checks behind the founder gate.
    console.log(`[meta-signal-watchdog] ${JSON.stringify(summary)}`);
    return json({ ok: true, checks: summary, duration_ms: Date.now() - started });
  } catch (err) {
    const msg = scrub(err instanceof Error ? err.message : String(err), secrets);
    console.error('[meta-signal-watchdog] unexpected:', msg);
    return json({ ok: false, error: msg }, 500);
  }
});
