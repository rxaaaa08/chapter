import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// meta-ads-sync
//
// Pulls per-ad, per-day spend from the Meta Marketing API into meta_ad_daily,
// which get_meta_ads_performance() then joins against our own bookings.
//
// WHY A SYNC AND NOT A LIVE CALL
// The admin panel cannot talk to Meta directly: the access token must never
// reach a browser, and Meta rate-limits per app, not per viewer. So the panel
// reads our table and this function is the only thing that reads Meta.
//
// WHY IT RE-PULLS OLD DAYS EVERY RUN
// Meta RESTATES a day for up to ~7 days after it closes — attribution windows
// keep assigning conversions backwards, and spend itself settles late. A sync
// that only fetched yesterday would freeze every day at its first, lowest
// reading and quietly understate every ad forever. So each run re-fetches a
// trailing window and UPSERTs. Cheap at our volume, and it is the difference
// between numbers that converge on the truth and numbers that are permanently
// wrong. LOOKBACK_DAYS is deliberately wider than Meta's 7.
//
// WHY IT ASKS FOR DELETED AND ARCHIVED ADS, AND THEN CHECKS THE TOTAL
// Meta's "Manage your ad object's status" reference: `/act_<ID>/insights?level=ad`
// does not return ARCHIVED or DELETED ads unless the query filters on
// ad.effective_status, and a deleted ad "may still track impressions, clicks,
// and actions for 28 days after the date of last delivery". Without the filter,
// an ad deleted between syncs lost its last hours of spend and every later
// conversion, so the failing ads (the ones that get deleted) read cheaper than
// they were. So the query names every status (STATUS_FILTERS), and every run
// also compares Meta's ACCOUNT-level daily spend, which always includes every
// ad, with the sum of our per-ad rows. A difference marks the run not ok
// ('spend_unaccounted'). The comparison does not trust the filter; it is the
// proof the filter worked. See 20260917_meta_spend_reconciliation.sql.
//
// verify_jwt is false: pg_cron (pg_net) calls this without a JWT. Deploy with
//   supabase functions deploy meta-ads-sync --no-verify-jwt
//
// ENV
//   META_ADS_ACCESS_TOKEN  — long-lived system-user token, ads_read scope.
//   META_AD_ACCOUNT_ID     — numeric, no "act_" prefix.
//   CRON_SECRET            — guards the manual backfill path (?since=&until=).
//                            Unset means manual backfill is disabled, not open.

// Moved v25.0 -> v26.0 on 2026-09-08, because the live API said to.
//
// meta-ads-sync's response carried Meta's `x-ad-api-version-warning`:
// "The call has been auto-upgraded to v26.0 as v25.0 will be deprecated."
// Auto-upgrade only rescues endpoints UNAFFECTED by the new version; an
// affected one fails outright instead, so drifting along on the warning is a
// bet that none of ours is ever on that list.
//
// There is NO published v26.0 changelog to check against — the public changelog
// still lists v25.0 as latest, and version26.0 returns HTTP 500. Meanwhile the
// devtools API reports latest_platform_version v26.0 with an EMPTY deprecations
// array. Three Meta surfaces, three answers; the response header is the only one
// observed against our own traffic, so it wins. Verification here is therefore
// empirical, not documentary: deploy, call, confirm the warning is gone.
const API_VERSION = 'v26.0';

// Meta deprecates a version roughly every 90 days. Keeping the version in one
// named constant is the documented way to survive that: when a version is
// retired this is the single line to move, and the failure is a clean error
// rather than fields quietly disappearing from the response.

// ── Error classification ────────────────────────────────────────────────────
// Meta's own guidance: an error carrying "is_transient": true resolves on its
// own and should be retried after a wait, and rate limits should be handled
// with exponential back-off rather than immediate re-requests.
//
// 4  = app request limit reached
// 17 = user request limit reached
// 613 = ad-account call limit (subcode 1487742), and the same code covers the
//       per-second mutation cap. Listed explicitly because without it a 613
//       reached the classifier with no verdict and fell through to
//       `is_transient === true` and then `status >= 500` — but Meta returns 613
//       as HTTP 400 and does not promise is_transient on it, so a plain
//       ad-account throttle could be filed as PERMANENT and abandoned for six
//       hours on a technicality of the error payload. A rate limit is the one
//       error that is transient by definition.
// 80000-80004 = business-use-case rate limits
// 1, 2 = unknown/internal, which Meta documents as usually temporary
const RETRYABLE_CODES = new Set([1, 2, 4, 17, 341, 613, 80000, 80001, 80002, 80003, 80004]);

// ── The 613 that must NOT be retried ────────────────────────────────────────
// "Marketing API Rate Limiting" (read 2026-09-18) lists five distinct meanings
// for code 613, told apart only by subcode:
//
//   1487742  too many calls from this ad account   — an ordinary throttle
//   5044001  mutation QPS cap exceeded             — writes only
//   1487632  ad set budget changed 4x in an hour   — writes only
//   1487225  ad creation limited by daily spend    — writes only
//   (none)   ABUSE PREVENTION
//
// The last one is categorically different and the doc is explicit about it:
// "when our system detects that certain ad accounts generate a large amount of
// abnormal traffic ... we will temporarily reduce the API Rate Limit quota of
// the abnormal accounts", and the remedy is to investigate what is generating
// the traffic and contact Meta support. The doc even names the tell: this is
// the 613 that carries NO subcode.
//
// Retrying it is wrong twice over. It adds four more calls to an account that
// has just been flagged for making too many, and — the part that actually
// costs us — it files an administratively reduced quota under the same verdict
// as a passing throttle. The run would report a retryable rate limit that
// "self-heals on the next run", every day, forever, while the real fix is a
// human conversation with Meta. A wrong diagnosis that looks calm is worse
// than a failure that looks like one.
//
// Meta sends 613 as HTTP 400 and may or may not set is_transient, so this has
// to be decided before both the is_transient and the RETRYABLE_CODES branches
// below. Subcode 0 counts as absent: it is not a real subcode.
const ABUSE_RATE_LIMIT_CODE = 613;
function isAbuseRateLimit(err: MetaError): boolean {
  return Number(err.code) === ABUSE_RATE_LIMIT_CODE
    && (err.error_subcode == null || Number(err.error_subcode) === 0);
}

// Retrying these only burns quota and delays the real fix:
// 190 = invalid/expired OAuth token   200/10/294 = missing permission
// 100 = invalid parameter (our bug, not Meta's weather)
const PERMANENT_CODES = new Set([10, 100, 102, 104, 190, 200, 294]);

// Back-off between attempts. Kept short because an edge function has a wall
// clock: four attempts totalling ~30s still fits, and the 6-hourly cron gives
// us another go long before the data matters.
const RETRY_DELAYS_MS = [2000, 6000, 20000];

type MetaError = {
  code?: number;
  error_subcode?: number;
  message?: string;
  is_transient?: boolean;
  error_user_msg?: string;
  error_data?: { blame_field_specs?: unknown };
};

// Negative codes are internal Meta errors where the real cause is in
// error_subcode, so the subcode is always carried through. code 1 subcode 99
// is specifically a wrong `level` value — a config bug of ours, never transient.
function classify(err: MetaError | null | undefined, httpStatus: number): 'retry' | 'permanent' {
  if (!err) return httpStatus >= 500 ? 'retry' : 'permanent';
  const code = Number(err.code);
  const sub = Number(err.error_subcode);
  if (code === 1 && sub === 99) return 'permanent';
  // Before is_transient and before RETRYABLE_CODES, both of which would
  // otherwise swallow it. See ABUSE_RATE_LIMIT_CODE above.
  if (isAbuseRateLimit(err)) return 'permanent';
  if (PERMANENT_CODES.has(code)) return 'permanent';
  if (err.is_transient === true) return 'retry';
  if (RETRYABLE_CODES.has(code)) return 'retry';
  return httpStatus >= 500 ? 'retry' : 'permanent';
}

function errorSummary(err: MetaError | null | undefined) {
  return {
    meta_code: err?.code ?? null,
    meta_subcode: err?.error_subcode ?? null,
    meta_message: err?.message ?? null,
    meta_user_message: err?.error_user_msg ?? null,
    is_transient: err?.is_transient ?? null,
    // Present on validation errors; names the exact field Meta rejected.
    blame_field_specs: err?.error_data?.blame_field_specs ?? null,
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The Insights throttle header, PARSED rather than only logged.
//
// "Limits and Best Practices" asks for two things and we were doing one:
// check `x-fb-ads-insights-throttle` on every response (done), and "add a
// back-off mechanism to slow down or pause your /insights queries when you come
// close to hitting 100% utility for your application, or for your ad account"
// (not done). A header read into a log line is not a back-off — the log is only
// consulted after something has already broken.
//
// It also carries `ads_api_access_tier`, the only authoritative answer to which
// budget we are actually on. The tiers differ by more than two orders of
// magnitude for insights — Limited/development access is ~600 calls per ad
// account per hour against Full access's ~190,000 — so this is not a detail to
// infer. Surfaced in the run result so it costs no extra API call to know.
type InsightsThrottle = { appPct: number; accPct: number; tier: string | null };

function parseInsightsThrottle(raw: string | null): InsightsThrottle | null {
  if (!raw) return null;
  try {
    const j = JSON.parse(raw);
    const appPct = Number(j?.app_id_util_pct);
    const accPct = Number(j?.acc_id_util_pct);
    // Only treat it as a throttle reading if at least one percentage parsed.
    // x-ad-account-usage and the general Graph headers are different shapes and
    // fall through here harmlessly — no signal is the old behaviour, not an error.
    if (!Number.isFinite(appPct) && !Number.isFinite(accPct)) return null;
    return {
      appPct: Number.isFinite(appPct) ? appPct : 0,
      accPct: Number.isFinite(accPct) ? accPct : 0,
      tier: typeof j?.ads_api_access_tier === 'string' ? j.ads_api_access_tier : null,
    };
  } catch {
    return null;
  }
}

// Slow at one line, stop at the next. Both sit below 100 deliberately: Meta's
// advice is to back off when "close to" the limit, and past it the call fails
// outright (error_code 4) instead of returning a short answer we could keep.
const THROTTLE_PACE_PCT = 75;
const THROTTLE_STOP_PCT = 90;
const THROTTLE_PACE_MS = 2000;

// One page, with back-off. Returns the parsed body or a classified failure.
async function fetchPage(url: string): Promise<
  { ok: true; body: any; usage: string | null; versionWarning: string | null } |
  { ok: false; status: number; attempts: number; summary: ReturnType<typeof errorSummary> }
> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt++;
    let res: Response;
    let body: any = null;
    try {
      res = await fetch(url);
      body = await res.json().catch(() => null);
    } catch (e) {
      // Network-level failure is transient by definition.
      if (attempt <= RETRY_DELAYS_MS.length) {
        console.warn(`[meta-ads-sync] network error, retry ${attempt}`, e instanceof Error ? e.message : String(e));
        await sleep(RETRY_DELAYS_MS[attempt - 1]);
        continue;
      }
      return { ok: false, status: 0, attempts: attempt, summary: errorSummary(null) };
    }

    // Meta reports how much of the rate budget we have consumed. At four calls
    // a day this will never bind, but logging it means we find out from a log
    // line rather than from a sync that silently stopped.
    //
    // /insights has its OWN pair of headers, and they are the only ones that
    // actually arrive on this endpoint: `x-fb-ads-insights-throttle` carries
    // {app_id_util_pct, acc_id_util_pct, ads_api_access_tier} and
    // `x-ad-account-usage` carries the per-account limit. The general Graph
    // headers we used to read here (x-business-use-case-usage / x-app-usage)
    // are for other endpoints, so this line logged null every run and the
    // monitoring the comment above promises was never actually happening.
    // Meta's "Limits and Best Practices" names both Insights headers explicitly.
    // The general ones are kept as a last resort so a future non-insights call
    // through this helper still reports something.
    const usage = res.headers.get('x-fb-ads-insights-throttle')
      ?? res.headers.get('x-ad-account-usage')
      ?? res.headers.get('x-business-use-case-usage')
      ?? res.headers.get('x-app-usage');

    // Meta sets this ONLY when the version we pinned has been deprecated and the
    // call was silently auto-upgraded to the next one. That silence is the
    // hazard: the sync keeps returning ok while running against an API we never
    // tested, until the day an endpoint we use is one of the "affected" ones
    // for that version and starts failing outright instead. Catching the header
    // turns a 90-day deprecation clock from something a human has to remember
    // to check into something this run says out loud.
    const versionWarning = res.headers.get('x-ad-api-version-warning');

    if (res.ok && body && !body.error) return { ok: true, body, usage, versionWarning };

    const err: MetaError | null = body?.error ?? null;
    const verdict = classify(err, res.status);
    const summary = errorSummary(err);

    if (verdict === 'retry' && attempt <= RETRY_DELAYS_MS.length) {
      console.warn(`[meta-ads-sync] transient Meta error, retry ${attempt}`, JSON.stringify(summary));
      await sleep(RETRY_DELAYS_MS[attempt - 1]);
      continue;
    }

    console.error('[meta-ads-sync] Meta API error', res.status, JSON.stringify(summary));
    return { ok: false, status: res.status, attempts: attempt, summary };
  }
}

// How far back each run re-fetches and re-upserts. Two separate reasons set it,
// and the larger one wins:
//
//   1. Attribution. A conversion can be credited to a click up to 7 days old,
//      so a day's numbers keep moving for about a week after the fact. 14 was
//      chosen as that window doubled, which also let a couple of missed cron
//      runs self-heal instead of leaving a permanent hole.
//   2. Meta's actual guarantee, which is wider than that. "Limits and Best
//      Practices" says insights "do not change after 28 days of being reported"
//      — 28 is the outer bound, and anything inside it may still be restated.
//      A 14-day window would therefore never pick up a correction landing on
//      day 15-28, and the stale row would look perfectly healthy forever.
//
// So: 28, matching Meta's documented bound rather than our inference from the
// attribution window. The upsert is on (ad_id, date_start), so re-fetching a
// day that has not changed is a no-op, and at this account's volume doubling
// the window is a few hundred rows.
const LOOKBACK_DAYS = 28;

// One row per ad per day. 500 is far above anything we will run, but the API
// paginates regardless and the loop below follows paging.next either way.
const PAGE_LIMIT = 500;

const FIELDS = [
  'ad_id', 'ad_name',
  'adset_id', 'adset_name',
  'campaign_id', 'campaign_name',
  'spend', 'impressions', 'clicks', 'inline_link_clicks', 'reach', 'frequency',
  // Derived rates. Meta computes these itself, and its arithmetic is the one
  // Ads Manager shows — recomputing them from spend/clicks here would produce
  // numbers that disagree with Meta's in the fourth decimal for no reason.
  'cpc', 'cpm', 'ctr', 'unique_clicks', 'outbound_clicks',
  // Ad relevance diagnostics: how this ad compares with others competing for
  // the same audience. Strings, not numbers.
  'quality_ranking', 'engagement_rate_ranking', 'conversion_rate_ranking',
  'actions', 'action_values', 'cost_per_action_type',
  'date_start',
].join(',');

// Meta reports the same conversion under several action_type aliases. The
// offsite_conversion.* form is the pixel/CAPI one and the only one that
// corresponds to what we send; the bare 'purchase' alias can also include
// on-Meta events, so preferring the specific name avoids double counting.
const PURCHASE_ACTIONS = ['offsite_conversion.fb_pixel_purchase', 'purchase'];
const LEAD_ACTIONS = ['offsite_conversion.fb_pixel_lead', 'lead'];

type Action = { action_type?: string; value?: string };

// First alias present wins — see PURCHASE_ACTIONS. Returns 0 rather than null
// so a missing action block reads as "none happened", which is what it means.
function pickAction(actions: Action[] | undefined, names: string[]): number {
  if (!Array.isArray(actions)) return 0;
  for (const name of names) {
    const hit = actions.find((a) => a?.action_type === name);
    if (hit) return Number(hit.value) || 0;
  }
  return 0;
}

// Meta returns every numeric as a string, and omits a metric entirely rather
// than sending zero when it does not apply. Null preserves that distinction.
function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Meta's day boundaries follow the AD ACCOUNT's timezone, not UTC. Ours is
// Asia/Kolkata, and "today" in IST is already "yesterday" in UTC for 5.5 hours
// every night — so deriving the window from a UTC clock would silently skip a
// day. en-CA formats as YYYY-MM-DD.
//
// This is an ASSUMPTION ABOUT META'S SETTINGS, not about our code, so it was
// verified rather than reasoned about: ad account 1580469137074269 reports
// timezone_name = "Asia/Kolkata" (checked 2026-09-08). It matters twice over,
// because get_meta_ads_performance() buckets OUR revenue by IST date and then
// joins it straight onto Meta's date_start — if the account were ever moved to
// another timezone, every spend row would land against the wrong day's bookings
// and the join would still look perfectly healthy. Re-check with
// GET /act_<id>?fields=timezone_name if anyone reports odd day-level numbers.
function istToday(): Date {
  const ist = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return new Date(`${ist}T00:00:00Z`);
}

// ── Deleted and archived ads ────────────────────────────────────────────────
// Every value of the Ad effective_status enum in Meta's Ad reference (checked
// 2026-09-17). Naming all of them is how an insights query keeps ARCHIVED and
// DELETED ads. Leaving one out silently drops ads in that state again.
const AD_STATUSES = [
  'ACTIVE', 'PAUSED', 'DELETED', 'PENDING_REVIEW', 'DISAPPROVED', 'PREAPPROVED',
  'PENDING_BILLING_INFO', 'CAMPAIGN_PAUSED', 'ARCHIVED', 'ADSET_PAUSED',
  'IN_PROCESS', 'WITH_ISSUES',
];

// Tried in order, stepping down only when Meta refuses the filter itself
// (error 100 on the first page). Meta documents that a status filter CONTAINING
// DELETED errors on some edges, so that is the first thing dropped. The last
// form is the old query. Whichever was used is logged as
// meta_ads_sync_log.status_filter. A step down is not by itself an alarm; the
// spend reconciliation below says whether anything was actually lost.
const STATUS_FILTERS: { name: string; statuses: string[] | null }[] = [
  { name: 'all_statuses', statuses: AD_STATUSES },
  { name: 'without_deleted', statuses: AD_STATUSES.filter((st) => st !== 'DELETED') },
  { name: 'none', statuses: null },
];

type SpendDay = { date: string; account: number; ads: number; gap: number };

// Explicit for the same reason as VolumeResult: assigned from a catch block too.
type SpendCheckResult =
  | { ok: true; days_checked: number; account_spend: number; ads_spend: number; unaccounted: number; mismatched_days: SpendDay[] }
  | { ok: false; error: string };

// Meta's account-level daily spend into meta_account_daily, then the per-day
// comparison in SQL (meta_spend_reconciliation, which skips today and ignores
// sub-rupee rounding). Non-fatal like the steps after it. A failure to LOOK is
// reported as ok:false with the reason, never as a mismatch: not being able to
// check is not evidence that spend is missing.
async function reconcileAccountSpend(
  supabase: any, token: string, accountId: string, since: string, until: string,
): Promise<SpendCheckResult> {
  let next: string | null =
    `https://graph.facebook.com/${API_VERSION}/act_${accountId}/insights` +
    `?level=account&time_increment=1&limit=${PAGE_LIMIT}&fields=spend,impressions,date_start` +
    `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}` +
    `&access_token=${encodeURIComponent(token)}`;

  const rows: Record<string, unknown>[] = [];
  let pages = 0;
  while (next) {
    // One row per day, so a 28-day window is one page. A cap this low still
    // leaves room for a long manual backfill without looping forever.
    if (++pages > 10) return { ok: false, error: 'account insights page cap reached' };
    const page = await fetchPage(next);
    if (!page.ok) {
      return {
        ok: false,
        error: `account insights failed: ${page.summary.meta_code ?? page.status} ${page.summary.meta_message ?? ''}`.trim(),
      };
    }
    for (const r of page.body.data ?? []) {
      if (!r?.date_start) continue;
      rows.push({
        account_id: String(accountId),
        date_start: r.date_start,
        spend: Number(r.spend) || 0,
        impressions: num(r.impressions),
        synced_at: new Date().toISOString(),
      });
    }
    next = page.body.paging?.next ?? null;
  }

  if (rows.length) {
    const { error } = await supabase.from('meta_account_daily').upsert(rows, { onConflict: 'account_id,date_start' });
    if (error) return { ok: false, error: `account spend upsert failed: ${error.message}` };
  }

  const { data, error } = await supabase.rpc('meta_spend_reconciliation', {
    p_account_id: String(accountId), p_since: since, p_until: until, p_today: isoDate(istToday()),
  });
  if (error || !data) return { ok: false, error: `reconciliation failed: ${error?.message ?? 'no result'}` };
  return { ok: true, ...(data as Omit<Extract<SpendCheckResult, { ok: true }>, 'ok'>) };
}

// The sentence that lands in the sync log, the panel's banner and the push.
// Written for the founder: what differs, one concrete day, and the likely cause.
function describeSpendGap(c: Extract<SpendCheckResult, { ok: true }>): string {
  const rupees = (n: number) => `₹${Math.abs(Number(n)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  const days = c.mismatched_days;
  const d0 = days[0];
  const plural = days.length === 1 ? 'day' : 'days';
  const lead = c.unaccounted >= 0
    ? `Meta billed ${rupees(c.unaccounted)} more than our per-ad numbers hold, across ${days.length} ${plural}`
    : `Our per-ad numbers hold ${rupees(c.unaccounted)} more than Meta billed, across ${days.length} ${plural}`;
  const cause = c.unaccounted >= 0
    ? 'Usually a deleted or archived ad, so cost per booking reads low until it is picked up.'
    : 'Usually a day Meta restated for an ad that can no longer be re-read.';
  return `${lead} (${d0.date}: Meta ${rupees(d0.account)}, per-ad ${rupees(d0.ads)}). ${cause}`;
}

// ── Ad volume ───────────────────────────────────────────────────────────────
// A second, much smaller call to /act_<ID>/ads_volume. It is NOT here for the
// per-Page ad limit, which does not bind at this account's scale. It is here
// for two things /insights structurally cannot tell us:
//
//   * Ads that are IN REVIEW. They have not spent, so they have no insights
//     row, so meta_ad_daily cannot see them at all.
//   * Meta's `learning_limited` recommendation — its own read of whether an ad
//     set can gather enough conversions to leave the learning phase. At this
//     account's measured volume (~6 purchases/week against Meta's ~50-per-7-days
//     bar) that is the predicted failure, and it is not computable from our data.
//
// NON-FATAL BY CONTRACT. Spend is the critical path and this runs after it. Any
// failure here is logged and swallowed: a broken volume check must never turn a
// good spend sync into a failed one, and must never fail the HTTP response.
const VOLUME_FIELDS = [
  'actor_id',
  'actor_name',
  'ads_running_or_in_review_count',
  'current_account_ads_running_or_in_review_count',
  'limit_on_ads_running_or_in_review',
  'future_limit_on_ads_running_or_in_review',
  'future_limit_activation_date',
  'recommendations',
].join(',');

// Explicit rather than inferred, because the caller stores it in a `let` that
// is also assigned from a catch block — an inferred union would not include the
// failure shape and the catch would not compile.
type VolumeResult =
  | { ok: true; actors: number; changed: number; degraded?: boolean }
  | { ok: false; error: string };

type VolumeEntry = {
  actor_id?: string;
  actor_name?: string;
  ads_running_or_in_review_count?: number;
  current_account_ads_running_or_in_review_count?: number;
  limit_on_ads_running_or_in_review?: number;
  future_limit_on_ads_running_or_in_review?: number;
  future_limit_activation_date?: string;
  recommendations?: unknown;
};

// Meta returns recommendations as a list, but the documented "supported values"
// are bare strings while other list-shaped fields on this API arrive as objects
// with a `recommendation_type`. Both are accepted rather than guessing which,
// because guessing wrong here fails silently — an unrecognised shape would
// simply never match and learning_limited would never alert.
function recNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => (typeof r === 'string' ? r : (r as any)?.recommendation_type ?? null))
    .filter((r): r is string => typeof r === 'string' && r.length > 0)
    .sort();
}

async function syncAdVolume(supabase: any, token: string, accountId: string): Promise<VolumeResult> {
  const base = `https://graph.facebook.com/${API_VERSION}/act_${accountId}/ads_volume`
    + `?show_breakdown_by_actor=true&access_token=${encodeURIComponent(token)}`;

  // Try-then-fallback, the same shape as the WhatsApp tracking-URL conversion.
  // Meta's documented field list and Meta's actual response have disagreed in
  // both directions across this integration, and an unknown field name is a
  // hard 400 rather than an omission. So: ask for everything, and if that is
  // refused, take the bare breakdown rather than nothing at all.
  let page = await fetchPage(`${base}&fields=${VOLUME_FIELDS}`);
  let degraded = false;
  if (!page.ok) {
    console.warn('[meta-ads-sync] ads_volume with fields failed, retrying bare', JSON.stringify(page.summary));
    page = await fetchPage(base);
    degraded = true;
  }
  if (!page.ok) {
    console.error('[meta-ads-sync] ads_volume unavailable', JSON.stringify(page.summary));
    return { ok: false, error: String(page.summary.meta_code ?? 'unknown') };
  }

  const entries: VolumeEntry[] = Array.isArray(page.body?.data) ? page.body.data : [];
  if (!entries.length) return { ok: true, actors: 0, changed: 0 };

  let changed = 0;
  for (const e of entries) {
    // The bare call returns no actor at all. A stable placeholder keeps the
    // "latest row per actor" comparison working instead of every run reading
    // as a new actor and writing a duplicate.
    const actorId = e.actor_id ?? 'account';
    const recs = recNames(e.recommendations);

    const { data: prevRows } = await supabase
      .from('meta_ad_volume_snapshots')
      .select('ads_running_or_in_review, account_ads_running_or_in_review, limit_on_ads, future_limit, recommendations')
      .eq('actor_id', actorId)
      .order('captured_at', { ascending: false })
      .limit(1);
    const prev = prevRows?.[0] ?? null;

    const running = e.ads_running_or_in_review_count ?? null;
    const inAccount = e.current_account_ads_running_or_in_review_count ?? null;
    const limit = e.limit_on_ads_running_or_in_review ?? null;
    const future = e.future_limit_on_ads_running_or_in_review ?? null;

    // A degraded (bare) response carries only the count. Comparing its missing
    // fields against a previous full row would read as "limit changed to null"
    // and write a row every six hours claiming a change that never happened.
    const same = prev
      && prev.ads_running_or_in_review === running
      && (degraded || (
        prev.account_ads_running_or_in_review === inAccount
        && prev.limit_on_ads === limit
        && prev.future_limit === future
        && JSON.stringify(recNames(prev.recommendations)) === JSON.stringify(recs)
      ));
    if (same) continue;

    const { error } = await supabase.from('meta_ad_volume_snapshots').insert({
      actor_id: actorId,
      actor_name: e.actor_name ?? null,
      ads_running_or_in_review: running,
      account_ads_running_or_in_review: inAccount,
      limit_on_ads: limit,
      future_limit: future,
      future_limit_activation_date: e.future_limit_activation_date ?? null,
      recommendations: recs,
      raw: e as unknown as Record<string, unknown>,
    });
    if (error) {
      console.error('[meta-ads-sync] ads_volume insert failed', error.message);
      continue;
    }
    changed++;

    // Edge-triggered on a NEW recommendation only — the same reasoning as the
    // sync-failure alert above. Meta repeats a standing recommendation on every
    // call, so alerting on presence rather than on arrival would be four
    // notifications a day about one unchanged fact.
    //
    // learning_limited is called out by name because it is the one that means
    // the campaign STRUCTURE is wrong (too many ad sets splitting too few
    // conversions), which is a different fix from anything about the creative.
    const before = new Set(prev ? recNames(prev.recommendations) : []);
    const arrived = recs.filter((r) => !before.has(r));
    if (arrived.length) {
      const human = arrived.includes('learning_limited')
        ? 'not enough conversions to leave the learning phase — consolidate ad sets'
        : arrived.join(', ');
      try {
        await supabase.rpc('notify_admin_push', {
          payload: {
            type: 'meta_ad_issue',
            record: {
              body: `Meta ads: ${human}`.slice(0, 240),
              // Per-actor so two Pages are two notifications rather than one
              // collapsing onto the other — send-admin-push tags from this.
              object_id: `ad-volume-${actorId}`,
            },
          },
        });
      } catch (err) {
        console.error('[meta-ads-sync] could not send ad-volume alert', err instanceof Error ? err.message : String(err));
      }
    }
  }

  return { ok: true, actors: entries.length, changed, degraded };
}

// ── Ad set configuration ────────────────────────────────────────────────────
// /insights tells us what an ad DID. This tells us what an ad set was TOLD TO
// DO — and the difference is where the most expensive mistake in this account
// lives: an ad set optimising for an event the business cannot produce 50 of a
// week never leaves Meta's learning phase, and pays the learning tax for its
// whole life. The account already contains one (see META-ADS-HANDOFF.md §10).
//
// A human found that by reading the config once. This makes it a standing check.
// The grading itself lives in SQL (meta_adset_optimization_warnings) because it
// has to divide Meta's config by OUR funnel volume, and that is a join.
//
// NON-FATAL, like the ads_volume step. Spend is the critical path.
const ADSET_FIELDS = [
  'id',
  'name',
  'campaign_id',
  'campaign{name}',
  'optimization_goal',
  'promoted_object',
  'billing_event',
  'daily_budget',
  'lifetime_budget',
  'effective_status',
  // WHO the ad set aims at. Recorded with history (meta_adset_targeting_history)
  // because it is mutable in place — edit the audience and the old one is gone,
  // the same way applications' selected_date and assigned_marketer_id destroy
  // their own past. "Which audience produced these bookings" cannot be
  // backfilled, so it is captured before any spend rather than after.
  'targeting',
  // WHERE the ad set stands in Meta's learning phase: status, results since the
  // last significant edit, when that edit was, why learning ended. Current state
  // only — Meta keeps no history of it — so record_adset_learning() versions it.
  // Every targeting or creative change, a new ad, a 7-day pause or a bid-strategy
  // change restarts the ~50-result count (Meta help 316478108955072), and at this
  // account's volume that can keep an ad set learning for good. Kept LAST so the
  // fallbacks below can strip it with one replace. META-ADS-HANDOFF.md §23.
  'learning_stage_info',
].join(',');

// WHERE the ad set's money can actually go. These are a SEPARATE set of fields
// from `targeting`, and that is the whole reason they are here: the raw
// `targeting` object returns only the keys someone EXPLICITLY set — four of
// them on the live ad set — while every placement Meta is actually running is
// computed and returned under its own effective_* field. So reading `targeting`
// and seeing no `publisher_platforms` does NOT mean placements are off; it means
// nobody ever chose one, so Advantage+ placements is running everything,
// including Audience Network `rewarded_video`. That is the lowest-intent
// inventory in the ecosystem and it is cheap, so at a floor-level daily budget
// it can absorb a real share of impressions while producing nothing.
//
// It was found once, by a human reading the config on 2026-09-09 (§10), and
// nothing would have noticed if it changed. A preview cannot cover this either:
// /generatepreviews has no Audience Network ad_format at all (§23). Reading
// these fields is the only way to know. Versioned by record_adset_placements()
// because placements are mutable in place, exactly like targeting.
const ADSET_PLACEMENT_FIELDS = [
  'effective_publisher_platforms',
  'effective_facebook_positions',
  'effective_instagram_positions',
  'effective_audience_network_positions',
  'effective_messenger_positions',
  'effective_device_platforms',
  'effective_brand_safety_content_filter_levels',
].join(',');

const ADSET_FIELDS_WITH_PLACEMENTS = `${ADSET_FIELDS},${ADSET_PLACEMENT_FIELDS}`;

// How long the same ad set stays quiet after being reported. Much longer than
// the 6h used for ad ISSUES because this is not an outage — it is a setup
// decision the founder has already been told about once, and re-sending it
// daily would be nagging about something only he can change.
const ADSET_WARN_SUPPRESSION_DAYS = 7;

type AdsetEntry = {
  id?: string;
  name?: string;
  campaign_id?: string;
  campaign?: { name?: string };
  optimization_goal?: string;
  promoted_object?: { pixel_id?: string; custom_event_type?: string };
  billing_event?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  effective_status?: string;
  targeting?: Record<string, unknown>;
  learning_stage_info?: Record<string, unknown>;
  // Meta's COMPUTED placements. Deliberately not narrowed to string[] — the
  // shape is taken on trust and normalised in SQL, so a field that ever comes
  // back as something other than an array is stored rather than silently
  // dropped by a type guess.
  effective_publisher_platforms?: unknown;
  effective_facebook_positions?: unknown;
  effective_instagram_positions?: unknown;
  effective_audience_network_positions?: unknown;
  effective_messenger_positions?: unknown;
  effective_device_platforms?: unknown;
  effective_brand_safety_content_filter_levels?: unknown;
};

type AdsetResult =
  | {
      ok: true; adsets: number; changed: number; warned: number; targeting_versions: number;
      degraded?: boolean;
      // false = Meta refused the field and the fallback ran without it, so NO
      // learning reading was recorded this run (distinct from "recorded: none").
      learning_captured: boolean;
      learning_changes: number;
      // Placements need THREE states, not two, and conflating them is what the
      // first live run caught. `fields_accepted` says only that Meta did not
      // reject the effective_* field names; it says nothing about whether any
      // value came back. `readings` counts the ad sets Meta actually returned
      // placements for. Meta omits a field it has no value for, so accepted
      // with zero readings is the normal state of a paused, never-delivered ad
      // set — and reading that as "captured" would make an unknown look
      // checked. See the placements_unknown finding in SQL.
      placement_fields_accepted: boolean;
      placement_readings: number;
      placement_versions: number;
      // Ad sets pushed about for running Audience Network nobody chose. Runs
      // BEFORE the optimisation-goal warnings and independently of them, so a
      // failure in either RPC cannot silently disable the other (§5 Layer 7).
      placement_warned: number;
    }
  | { ok: false; error: string };

// Budgets arrive as strings in MINOR UNITS — paise on this INR account. Stored
// as rupees so the column reads the same as every other money column in this
// database, and so a panel does not have to remember which one is different.
// See §9 "Everything monetary in the API is in MINOR UNITS".
function paiseToRupees(v: string | undefined): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n / 100 : null;
}

async function syncAdsets(supabase: any, token: string, accountId: string): Promise<AdsetResult> {
  const base = `https://graph.facebook.com/${API_VERSION}/act_${accountId}/adsets`
    + `?limit=200&access_token=${encodeURIComponent(token)}`;

  // Try-then-fallback. Two parts of this list are the likeliest to be refused,
  // and an unknown field is a hard 400 rather than an omission (§9):
  //   * `learning_stage_info` — a struct; losing it means no learning reading
  //     this run, which is reported as learning_captured:false, never as "none".
  //   * `campaign{name}` — nested-field syntax; losing the NAME is cosmetic.
  // Tried in order of what is least costly to lose. Losing the whole call is not
  // acceptable while any shape still works.
  //
  // The placement block is tried FIRST and dropped FIRST, on purpose. It is the
  // newest and least proven set of field names here, and the ladder below it is
  // the one that has been working since v16. Ordering it this way means a wrong
  // guess about a placement field name costs the placements and nothing else —
  // it can never take the learning capture down with it.
  const noLearning = ADSET_FIELDS.replace(',learning_stage_info', '');
  const attempts = [
    { fields: ADSET_FIELDS_WITH_PLACEMENTS, degraded: false, learning: true, placements: true },
    { fields: ADSET_FIELDS, degraded: false, learning: true, placements: false },
    { fields: noLearning, degraded: false, learning: false, placements: false },
    { fields: ADSET_FIELDS.replace('campaign{name},', ''), degraded: true, learning: true, placements: false },
    { fields: noLearning.replace('campaign{name},', ''), degraded: true, learning: false, placements: false },
  ];
  let next: string | null = null;
  let page: Awaited<ReturnType<typeof fetchPage>> | null = null;
  let degraded = false;
  let learningCaptured = false;
  let placementsCaptured = false;
  for (const attempt of attempts) {
    next = `${base}&fields=${encodeURIComponent(attempt.fields)}`;
    page = await fetchPage(next);
    if (page.ok) {
      degraded = attempt.degraded;
      learningCaptured = attempt.learning;
      placementsCaptured = attempt.placements;
      break;
    }
    console.warn('[meta-ads-sync] adsets field shape refused, trying the next', JSON.stringify(page.summary));
  }
  if (!page || !page.ok) {
    const summary = page && !page.ok ? page.summary : null;
    console.error('[meta-ads-sync] adsets unavailable', JSON.stringify(summary));
    return { ok: false, error: String(summary?.meta_code ?? 'unknown') };
  }

  // Follow pagination. Capped like the insights loop so a runaway cannot spin.
  const entries: AdsetEntry[] = [];
  let pages = 0;
  let cursor: string | null = next;
  let body = page.body;
  while (cursor && pages < 20) {
    pages++;
    if (Array.isArray(body?.data)) entries.push(...body.data);
    cursor = body?.paging?.next ?? null;
    if (!cursor) break;
    const nextPage = await fetchPage(cursor);
    if (!nextPage.ok) {
      console.error('[meta-ads-sync] adsets pagination failed', JSON.stringify(nextPage.summary));
      break;
    }
    body = nextPage.body;
  }

  if (!entries.length) {
    return {
      ok: true, adsets: 0, changed: 0, warned: 0, targeting_versions: 0,
      learning_captured: learningCaptured, learning_changes: 0,
      placement_fields_accepted: placementsCaptured, placement_readings: 0, placement_versions: 0,
      placement_warned: 0,
    };
  }

  let changed = 0;
  let targetingVersions = 0;
  let learningChanges = 0;
  let placementVersions = 0;
  let placementReadings = 0;
  for (const a of entries) {
    if (!a.id) continue;
    const row = {
      adset_id: a.id,
      adset_name: a.name ?? null,
      campaign_id: a.campaign_id ?? null,
      campaign_name: a.campaign?.name ?? null,
      optimization_goal: a.optimization_goal ?? null,
      pixel_id: a.promoted_object?.pixel_id ?? null,
      custom_event_type: a.promoted_object?.custom_event_type ?? null,
      billing_event: a.billing_event ?? null,
      daily_budget: paiseToRupees(a.daily_budget),
      lifetime_budget: paiseToRupees(a.lifetime_budget),
      effective_status: a.effective_status ?? null,
      // Convenience copy of the CURRENT spec. The durable record is the history
      // table below — this column is overwritten like every other config field.
      targeting: a.targeting ?? null,
      raw: a as unknown as Record<string, unknown>,
    };

    const { data: prevRows } = await supabase
      .from('meta_adset_config')
      .select('optimization_goal, custom_event_type, billing_event, daily_budget, lifetime_budget, effective_status, campaign_name')
      .eq('adset_id', a.id)
      .limit(1);
    const prev = prevRows?.[0] ?? null;

    // config_changed_at moves only on a MEANINGFUL difference, so "when did this
    // ad set's setup last change" stays answerable without a history table. A
    // degraded response has no campaign name, so that field is excluded from the
    // comparison — otherwise every degraded run would claim a change.
    const same = prev
      && prev.optimization_goal === row.optimization_goal
      && prev.custom_event_type === row.custom_event_type
      && prev.billing_event === row.billing_event
      && Number(prev.daily_budget) === Number(row.daily_budget)
      && Number(prev.lifetime_budget) === Number(row.lifetime_budget)
      && prev.effective_status === row.effective_status
      && (degraded || prev.campaign_name === row.campaign_name);

    const { error } = await supabase.from('meta_adset_config').upsert({
      ...row,
      last_seen_at: new Date().toISOString(),
      ...(same ? {} : { config_changed_at: new Date().toISOString() }),
    }, { onConflict: 'adset_id' });
    if (error) {
      console.error('[meta-ads-sync] adset upsert failed', error.message);
      continue;
    }
    if (!same) changed++;

    // Version the targeting spec. The comparison deliberately happens INSIDE
    // Postgres: Meta returns this object with no guaranteed key order, so a
    // JSON.stringify diff here would log a false change every time Meta
    // reordered keys, writing a new version six times a day and burying the
    // real edits. jsonb equality is key-order independent.
    //
    // Not part of the `same` check above on purpose — targeting can change while
    // every other config field stays identical, and config_changed_at is about
    // the optimisation setup, not the audience.
    if (a.targeting) {
      const { data: isNew, error: tErr } = await supabase.rpc('record_adset_targeting', {
        p_adset_id: a.id,
        p_targeting: a.targeting,
      });
      if (tErr) {
        console.error('[meta-ads-sync] targeting version write failed', tErr.message);
      } else if (isNew === true) {
        targetingVersions++;
      }
    }

    // Placements — WHERE the money can go, next to targeting's WHO it reaches.
    //
    // The effective_ prefix is stripped here and the keys are passed on as-is;
    // meta_normalise_placements() decides which ones it keeps, so a new
    // effective_* field Meta adds later arrives without a code change and is
    // dropped in ONE place rather than being half-handled in two.
    //
    // Sent even when every value is absent: that is a reading ("Meta reported
    // no placements"), which the schema keeps distinct from never having asked.
    // Like targeting and learning, the comparison happens in Postgres — and
    // here it has to do something the targeting version does not. jsonb
    // equality is key-order independent but ARRAY-order sensitive, and every
    // one of these fields is an array, so record_adset_placements() sorts
    // before comparing. Without that, Meta returning ["instagram","facebook"]
    // one day and ["facebook","instagram"] the next would write a new version
    // and bury the real edits.
    if (placementsCaptured) {
      const effective: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(a as Record<string, unknown>)) {
        if (!k.startsWith('effective_')) continue;
        if (v === null || v === undefined) continue;
        effective[k.slice('effective_'.length)] = v;
      }
      // `effective_status` shares the prefix and is not a placement. SQL drops
      // it (the normaliser keeps a fixed key list), but counting it here would
      // make every ad set look like it had a placement reading.
      delete effective['status'];
      if (Object.keys(effective).length > 0) placementReadings++;
      const { data: isNewPlacement, error: pErr } = await supabase.rpc('record_adset_placements', {
        p_adset_id: a.id,
        p_effective: effective,
        p_targeting: a.targeting ?? {},
      });
      if (pErr) {
        console.error('[meta-ads-sync] placement version write failed', pErr.message);
      } else if (isNewPlacement === true) {
        placementVersions++;
      }
    }

    // Learning stage. Recorded on every run where the field was requested,
    // INCLUDING when Meta returned none for this ad set (it is not delivering):
    // that absence is a reading, stored as status NULL, so "Meta reported
    // nothing" never looks like "we never asked". Like targeting, the comparison
    // happens in Postgres, and a new history row means the state changed —
    // learning started, restarted after an edit, finished or went limited.
    // Only pushed nowhere: the founder makes these edits himself, and Meta's
    // learning_limited already pushes through the ads_volume step.
    if (learningCaptured) {
      const { data: isNewState, error: lErr } = await supabase.rpc('record_adset_learning', {
        p_adset_id: a.id,
        p_info: a.learning_stage_info ?? null,
      });
      if (lErr) {
        console.error('[meta-ads-sync] learning stage write failed', lErr.message);
      } else if (isNewState === true) {
        learningChanges++;
      }
    }
  }

  // ── Unchosen Audience Network ─────────────────────────────────────────────
  // The founder asked for this push on 2026-09-18, which is why it exists at
  // all: §15's standing rule is that setup state stays page-only unless he asks.
  //
  // WHAT IT CAN AND CANNOT CATCH, because the difference matters. Meta returns
  // no effective_* placement fields for an ad set that has never delivered
  // (§23 "Reels Ads"), so this CANNOT warn before the first rupee moves. It is
  // a first-day-of-spend alarm, not a pre-spend one. The pre-spend check stays
  // the founder-side item in §24: choose placements by hand in Ads Manager.
  //
  // Only `leak` findings push — i.e. Audience Network that NOBODY CHOSE. If he
  // picks it deliberately the finding reads `info` and stays silent, because a
  // notification about a decision he just made is noise. `brand_safety_relaxed`
  // never pushes either: it is a positioning matter for the page, not money
  // leaving. `placements_unknown` never pushes, because "we cannot see" is not
  // an event.
  let placementWarned = 0;
  const { data: placementFindings, error: pwErr } = await supabase.rpc('meta_adset_placement_warnings');
  if (pwErr) {
    console.error('[meta-ads-sync] placement warnings rpc failed', pwErr.message);
  } else {
    // ONE push per ad set, led by the worse finding. rewarded_video implies
    // audience_network_on, so pushing both would be two notifications about one
    // switch — and two notifications about one thing is how a founder learns to
    // swipe them away (the grouping lesson from meta-ads-alerts, §5 Layer 7).
    const byAdset = new Map<string, any[]>();
    for (const f of (placementFindings ?? [])) {
      if (f.severity !== 'leak') continue;
      if (f.finding !== 'audience_network_rewarded_video' && f.finding !== 'audience_network_on') continue;
      // A paused ad set is not spending. Same rule as the goal warning above.
      if ((f.effective_status ?? '') !== 'ACTIVE') continue;
      const list = byAdset.get(f.adset_id) ?? [];
      list.push(f);
      byAdset.set(f.adset_id, list);
    }

    for (const [adsetId, findings] of byAdset) {
      const worst = findings.find((f) => f.finding === 'audience_network_rewarded_video') ?? findings[0];
      const rewarded = findings.some((f) => f.finding === 'audience_network_rewarded_video');

      const cutoff = new Date(Date.now() - ADSET_WARN_SUPPRESSION_DAYS * 86400_000).toISOString();
      const { data: recent } = await supabase
        .from('meta_ad_guardrail_events')
        .select('id')
        .eq('rule_key', 'adset_unchosen_audience_network')
        .eq('ad_id', adsetId)
        .gte('fired_at', cutoff)
        .limit(1);
      if (recent?.length) continue;

      // Says what to do, because only he can do it and it is free.
      const body = rewarded
        ? `"${worst.adset_name ?? adsetId}" is running on Audience Network rewarded video — people watching an ad to unlock a game life. Nobody picked that placement; it is Meta's default. Turn Audience Network off in the ad set's placement settings.`
        : `"${worst.adset_name ?? adsetId}" is running on Audience Network. Nobody picked that placement; it is Meta's default. Turn it off in the ad set's placement settings.`;

      const { error: pushErr } = await supabase.rpc('notify_admin_push', {
        payload: {
          type: 'meta_ad_issue',
          record: { body: body.slice(0, 240), object_id: `adset-placements-${adsetId}` },
        },
      });
      if (pushErr) console.error('[meta-ads-sync] placement push failed', pushErr.message);

      // One ledger row per ad set, not per finding — unlike the guardrail
      // evaluator, which writes per rule so each rule keeps its own cooldown.
      // Here the two findings are one switch with one fix, so they share a
      // cooldown and splitting them would re-push about the same thing.
      await supabase.from('meta_ad_guardrail_events').insert({
        rule_key: 'adset_unchosen_audience_network',
        label: 'Audience Network running on Meta\'s default, not by choice',
        ad_id: adsetId,
        ad_name: worst.adset_name,
        metric: 'adset_placements',
        // A yes/no finding: there is no number to exceed, so observed and
        // threshold stay NULL rather than carrying an invented 1/0 (§19 does
        // the same for adset_no_customer_exclusion).
        observed: null,
        threshold: null,
        window_days: null,
        context: { findings, rewarded_video: rewarded },
        // "queued without error", not "delivered" — notify_admin_push is
        // fire-and-forget.
        notified_at: pushErr ? null : new Date().toISOString(),
        notify_error: pushErr ? pushErr.message.slice(0, 500) : null,
      });
      placementWarned++;
    }
  }

  // Grade AFTER every row is written, so the check sees the whole account rather
  // than a half-updated picture.
  let warned = 0;
  const { data: warnings, error: warnErr } = await supabase.rpc('meta_adset_optimization_warnings');
  if (warnErr) {
    console.error('[meta-ads-sync] adset warnings rpc failed', warnErr.message);
    return {
      ok: true, adsets: entries.length, changed, warned, targeting_versions: targetingVersions, degraded,
      learning_captured: learningCaptured, learning_changes: learningChanges,
      placement_fields_accepted: placementsCaptured, placement_readings: placementReadings,
      placement_versions: placementVersions, placement_warned: placementWarned,
    };
  }

  for (const w of (warnings ?? [])) {
    // Only the hard verdict pushes. 'tight' is a judgement call that depends on
    // what share of traffic the ad set actually wins, and a notification the
    // founder cannot act on with certainty is noise — it stays visible in
    // get_meta_adset_health() instead.
    if (w.severity !== 'impossible') continue;
    // A paused ad set is not costing anything yet. Still worth recording, not
    // worth waking someone for.
    if ((w.effective_status ?? '') !== 'ACTIVE') continue;

    // Reuses meta_ad_guardrail_events as the ledger so there is ONE history and
    // one future panel view. NOTE: `ad_id` holds an ADSET id for these rows —
    // `metric` is what disambiguates them, and no ad id collides with an ad set
    // id in Meta's numbering.
    const cutoff = new Date(Date.now() - ADSET_WARN_SUPPRESSION_DAYS * 86400_000).toISOString();
    const { data: recent } = await supabase
      .from('meta_ad_guardrail_events')
      .select('id')
      .eq('rule_key', 'adset_unlearnable_goal')
      .eq('ad_id', w.adset_id)
      .gte('fired_at', cutoff)
      .limit(1);
    if (recent?.length) continue;

    const body = `"${w.adset_name ?? w.adset_id}" optimises for ${w.custom_event_type ?? w.optimization_goal}, `
      + `but the whole site produces only ${w.weekly_volume}/week against Meta's ${w.bar} — it cannot leave the learning phase`;

    const { error: pushErr } = await supabase.rpc('notify_admin_push', {
      payload: {
        type: 'meta_ad_issue',
        record: { body: body.slice(0, 240), object_id: `adset-goal-${w.adset_id}` },
      },
    });
    if (pushErr) console.error('[meta-ads-sync] adset warning push failed', pushErr.message);

    await supabase.from('meta_ad_guardrail_events').insert({
      rule_key: 'adset_unlearnable_goal',
      label: 'Optimisation goal cannot exit the learning phase',
      ad_id: w.adset_id,
      ad_name: w.adset_name,
      metric: 'adset_optimization_goal',
      observed: w.weekly_volume,
      threshold: w.bar,
      window_days: 28,
      context: w,
      // "queued without error", not "delivered" — notify_admin_push is
      // fire-and-forget. Same caveat as meta-ads-alerts.
      notified_at: pushErr ? null : new Date().toISOString(),
      notify_error: pushErr ? pushErr.message.slice(0, 500) : null,
    });
    warned++;
  }

  return {
    ok: true, adsets: entries.length, changed, warned, targeting_versions: targetingVersions, degraded,
    learning_captured: learningCaptured, learning_changes: learningChanges,
    placement_fields_accepted: placementsCaptured, placement_readings: placementReadings,
    placement_versions: placementVersions, placement_warned: placementWarned,
  };
}

// ── Delivery settings ───────────────────────────────────────────────────────
// On/off state, budget, objective and bid strategy for every campaign, ad set
// and ad, versioned by record_delivery_states()
// (20260917_meta_delivery_settings_history.sql). Meta overwrites every one of
// these in place: edit a budget or switch something off and the old value is
// gone. So this is the only record of three things:
//   * the budget on a given day. On this account it lives on the CAMPAIGN, which
//     nothing else here ever read.
//   * when anything was switched off and back on. A pause of 7+ days restarts
//     learning, and the learning history alone cannot say why it restarted.
//   * what is switched on but not running (billing, review, issues). It spends
//     nothing, so every spend-based check is blind to it.
// The founder asked for this on the page with NO alerts (2026-09-17), so nothing
// here pushes. Non-fatal, like every step after spend.
//
// Reads use the same status step-down as the insights call: all statuses first,
// so an ARCHIVED or DELETED object records its final state; then without DELETED;
// then Meta's default. The form used is reported per level. META-ADS-HANDOFF.md §23.
const DELIVERY_LEVELS = [
  { level: 'campaign', edge: 'campaigns', fields: 'id,name,objective,status,effective_status,daily_budget,lifetime_budget,spend_cap,bid_strategy' },
  { level: 'adset',    edge: 'adsets',    fields: 'id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,bid_strategy' },
  { level: 'ad',       edge: 'ads',       fields: 'id,name,campaign_id,adset_id,status,effective_status' },
] as const;

// Objects per Postgres call. One call per level is the norm; this only splits a
// very large account so a single request body stays small.
const DELIVERY_CHUNK = 500;

type DeliveryLevelResult =
  | { objects: number; changes: number; status_filter: string; partial?: string }
  | { error: string };

type DeliveryResult =
  | { ok: true; changes: number; levels: Record<string, DeliveryLevelResult> }
  | { ok: false; error: string };

async function syncDelivery(supabase: any, token: string, accountId: string): Promise<DeliveryResult> {
  const levels: Record<string, DeliveryLevelResult> = {};
  let changes = 0;

  for (const spec of DELIVERY_LEVELS) {
    const url = (statuses: string[] | null) =>
      `https://graph.facebook.com/${API_VERSION}/act_${accountId}/${spec.edge}` +
      `?limit=${PAGE_LIMIT}&fields=${encodeURIComponent(spec.fields)}` +
      (statuses
        ? `&filtering=${encodeURIComponent(JSON.stringify([{ field: 'effective_status', operator: 'IN', value: statuses }]))}`
        : '') +
      `&access_token=${encodeURIComponent(token)}`;

    let filterIdx = 0;
    let next: string | null = url(STATUS_FILTERS[filterIdx].statuses);
    const objects: Record<string, unknown>[] = [];
    let pages = 0;
    let readError: string | null = null;

    while (next && pages < 20) {
      pages++;
      const page = await fetchPage(next);
      // Meta refused the status filter itself: same rule as the insights call —
      // only on the first page, only for error 100, step down and start again.
      if (!page.ok && pages === 1 && Number(page.summary.meta_code) === 100 && filterIdx < STATUS_FILTERS.length - 1) {
        console.warn(`[meta-ads-sync] delivery ${spec.level}: status filter '${STATUS_FILTERS[filterIdx].name}' refused, trying the next form`,
          JSON.stringify(page.summary));
        filterIdx++;
        next = url(STATUS_FILTERS[filterIdx].statuses);
        pages = 0;
        continue;
      }
      if (!page.ok) {
        readError = String(page.summary.meta_code ?? 'unknown');
        console.error(`[meta-ads-sync] delivery ${spec.level} read failed`, JSON.stringify(page.summary));
        break;
      }
      if (Array.isArray(page.body?.data)) objects.push(...page.body.data);
      next = page.body?.paging?.next ?? null;
    }

    if (readError && objects.length === 0) {
      levels[spec.level] = { error: readError };
      continue;
    }

    // Whatever was read is recorded even if a later page failed: nothing here
    // treats an object's absence as a deletion, so a partial read cannot
    // invent a change. It is reported as partial all the same.
    let levelChanges = 0;
    let writeError: string | null = null;
    for (let i = 0; i < objects.length; i += DELIVERY_CHUNK) {
      const { data, error } = await supabase.rpc('record_delivery_states', {
        p_level: spec.level,
        p_objects: objects.slice(i, i + DELIVERY_CHUNK),
      });
      if (error) {
        writeError = error.message;
        console.error(`[meta-ads-sync] delivery ${spec.level} write failed`, error.message);
        break;
      }
      levelChanges += Number(data) || 0;
    }
    changes += levelChanges;

    const partial = readError ?? (next ? 'page_cap_reached' : null);
    levels[spec.level] = writeError
      ? { error: `write_failed: ${writeError.slice(0, 120)}` }
      : {
          objects: objects.length,
          changes: levelChanges,
          status_filter: STATUS_FILTERS[filterIdx].name,
          ...(partial ? { partial } : {}),
        };
  }

  return { ok: true, changes, levels };
}

// ── Audiences ───────────────────────────────────────────────────────────────
// Reads EVERY Custom Audience on the ad account (ours, the customer lists, and
// anything made by hand in Ads Manager) and records its size, delivery status and
// rule once per IST day via record_audience_snapshot. Three things depend on it,
// and nothing else can supply them:
//   * Size history. Meta shows one number, today's. Whether retargeting can work
//     here at all turns on whether our Pixel audiences ever grow past the ~20
//     people "Website visitors - 180d" held on 2026-09-10 while the Pixel logged
//     ~1,150 visiting sessions, and that is only answerable by watching.
//   * Rule drift. Meta does not flush an audience when its rule is edited, so an
//     edit in Ads Manager silently turns it into a blend of both versions. The
//     comparison happens in SQL, for the same key-order reason as targeting.
//   * The customer-exclusion check below, which needs current audience ids.
//
// The rule arrives as a JSON-encoded STRING and is passed on as a string on
// purpose: it carries our pixel id as a bare number larger than JavaScript holds
// exactly, so JSON.parse here would store a different pixel. Postgres parses it.
//
// NON-FATAL, like the two steps before it. Spend is the critical path.
const AUDIENCE_FIELDS = [
  'id',
  'name',
  'subtype',
  'approximate_count_lower_bound',
  'approximate_count_upper_bound',
  'delivery_status',
  'operation_status',
  'retention_days',
  'time_updated',
  // Last, so the degraded retry can drop it cleanly. The reporting system user
  // holds the ad account but not the Pixel, and reading a Pixel audience's rule
  // may need the Pixel. Losing the rule costs drift detection, not sizes.
  'rule',
].join(',');

// Same reasoning as ADSET_WARN_SUPPRESSION_DAYS: a setup decision only the
// founder can change, so one reminder a week rather than one per sync.
const EXCLUSION_WARN_SUPPRESSION_DAYS = 7;

type AudienceEntry = {
  id?: string;
  name?: string;
  subtype?: string;
  approximate_count_lower_bound?: number | string;
  approximate_count_upper_bound?: number | string;
  delivery_status?: { code?: number | string; description?: string };
  operation_status?: { code?: number | string; description?: string };
  retention_days?: number | string;
  time_updated?: number | string;
  rule?: string;
};

type AudienceResult =
  | { ok: true; audiences: number; recorded: number; baselined: number; drifted: number; warned: number; degraded: boolean }
  | { ok: false; error: string };

function intOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

// Graph returns time_updated as unix SECONDS. An ISO string is tolerated too.
function metaTime(v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  const d = Number.isFinite(n) ? new Date(n * 1000) : new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function syncAudiences(supabase: any, token: string, accountId: string): Promise<AudienceResult> {
  const base = `https://graph.facebook.com/${API_VERSION}/act_${accountId}/customaudiences`
    + `?limit=200&access_token=${encodeURIComponent(token)}`;

  let page = await fetchPage(`${base}&fields=${encodeURIComponent(AUDIENCE_FIELDS)}`);
  let degraded = false;
  if (!page.ok) {
    console.warn('[meta-ads-sync] audiences with rule failed, retrying without it', JSON.stringify(page.summary));
    page = await fetchPage(`${base}&fields=${encodeURIComponent(AUDIENCE_FIELDS.replace(',rule', ''))}`);
    degraded = true;
  }
  if (!page.ok) {
    console.error('[meta-ads-sync] audiences unavailable', JSON.stringify(page.summary));
    return { ok: false, error: String(page.summary.meta_code ?? 'unknown') };
  }

  // Follow pagination. Capped like the other loops so a runaway cannot spin.
  const entries: AudienceEntry[] = [];
  let body = page.body;
  let pages = 0;
  while (body && pages < 20) {
    pages++;
    if (Array.isArray(body?.data)) entries.push(...body.data);
    const nextUrl: string | null = body?.paging?.next ?? null;
    if (!nextUrl) break;
    const nextPage = await fetchPage(nextUrl);
    if (!nextPage.ok) {
      console.error('[meta-ads-sync] audiences pagination failed', JSON.stringify(nextPage.summary));
      break;
    }
    body = nextPage.body;
  }

  let recorded = 0;
  let baselined = 0;
  let drifted = 0;
  for (const a of entries) {
    if (!a.id) continue;
    const { data, error } = await supabase.rpc('record_audience_snapshot', {
      p_audience_id: a.id,
      p_name: a.name ?? null,
      p_subtype: a.subtype ?? null,
      p_lower: intOrNull(a.approximate_count_lower_bound),
      p_upper: intOrNull(a.approximate_count_upper_bound),
      p_delivery_code: intOrNull(a.delivery_status?.code),
      p_delivery_text: a.delivery_status?.description ?? null,
      p_operation_code: intOrNull(a.operation_status?.code),
      p_operation_text: a.operation_status?.description ?? null,
      p_retention_days: intOrNull(a.retention_days),
      p_rule_text: typeof a.rule === 'string' ? a.rule : null,
      p_time_updated: metaTime(a.time_updated),
    });
    if (error) {
      console.error('[meta-ads-sync] audience snapshot failed', a.id, error.message);
      continue;
    }
    recorded++;
    if (data?.baselined === true) baselined++;
    if (data?.drift === true) drifted++;
  }

  // An ad set that does not exclude customers_all_paid pays to show ads to people
  // who already bought. Graded in SQL (meta_adset_audience_warnings) against the
  // targeting the ad set step has just written.
  let warned = 0;
  const { data: warnings, error: warnErr } = await supabase.rpc('meta_adset_audience_warnings');
  if (warnErr) {
    console.error('[meta-ads-sync] audience warnings rpc failed', warnErr.message);
    return { ok: true, audiences: entries.length, recorded, baselined, drifted, warned, degraded };
  }

  for (const w of (warnings ?? [])) {
    // A paused ad set spends nothing. It stays visible in get_meta_audience_health
    // instead of waking anyone, same rule as the learning-phase warning.
    if ((w.effective_status ?? '') !== 'ACTIVE') continue;

    const cutoff = new Date(Date.now() - EXCLUSION_WARN_SUPPRESSION_DAYS * 86400_000).toISOString();
    const { data: recent } = await supabase
      .from('meta_ad_guardrail_events')
      .select('id')
      .eq('rule_key', 'adset_no_customer_exclusion')
      .eq('ad_id', w.adset_id)
      .gte('fired_at', cutoff)
      .limit(1);
    if (recent?.length) continue;

    const who = w.customers != null ? `your ${w.customers} paying customers` : 'your paying customers';
    const body = `"${w.adset_name ?? w.adset_id}" does not exclude ${who}, so it is paying to show ads to people who already bought`;

    const { error: pushErr } = await supabase.rpc('notify_admin_push', {
      payload: {
        type: 'meta_ad_issue',
        record: { body: body.slice(0, 240), object_id: `adset-exclusion-${w.adset_id}` },
      },
    });
    if (pushErr) console.error('[meta-ads-sync] exclusion warning push failed', pushErr.message);

    // Same ledger as the learning-phase warning, so there is one history. `ad_id`
    // holds an ADSET id here too; `metric` disambiguates. observed/threshold are
    // left NULL because this is a yes/no finding with no quantity to compare.
    await supabase.from('meta_ad_guardrail_events').insert({
      rule_key: 'adset_no_customer_exclusion',
      label: 'Ad set does not exclude existing customers',
      ad_id: w.adset_id,
      ad_name: w.adset_name,
      metric: 'adset_customer_exclusion',
      observed: null,
      threshold: null,
      window_days: null,
      context: w,
      // "queued without error", not "delivered": notify_admin_push is fire-and-forget.
      notified_at: pushErr ? null : new Date().toISOString(),
      notify_error: pushErr ? pushErr.message.slice(0, 500) : null,
    });
    warned++;
  }

  return { ok: true, audiences: entries.length, recorded, baselined, drifted, warned, degraded };
}

// ── Tracking tags on every ad creative ──────────────────────────────────────
// Does every ad actually carry `utm_content={{ad.id}}`?
//
// This is the only irreversible-if-missed item in the whole system: a click that
// lands without that parameter can never be attributed to an ad, by anyone,
// afterwards. Until now it was a hope — a line in META-ADS-SETUP.md and a red
// strip on an unpushed panel.
//
// Meta's "Use URL Tags for Tracking" (2026-09-18) names the field the Ads
// Manager "URL Parameters" box writes to: the creative's `url_tags`. It is set
// PER CREATIVE with no account-level default, so this is not a mistake you make
// once and then stop making — it recurs on every new ad forever. And it is a
// READ, so checking it costs nothing and stays inside `ads_read` and the
// notify-only decision (§15).
//
// It checks BEFORE ANY MONEY MOVES, which is the point. A creative exists the
// moment an ad is created, ahead of the first impression. `untagged_spend`
// (§5 Layer 7) needs spend to have happened AND is deliberately silent until the
// website client ships; this needs neither.
//
// NON-FATAL, like every step above it. Spend is the critical path.
const CREATIVE_TAG_WARN_SUPPRESSION_DAYS = 7;

// Tried in order. An unknown field is a hard 400, not an omission (§5 Layer 8),
// so the ladder gives up the least important part first.
//
// THE LAST RUNG IS DIFFERENT AND IT MATTERS. `object_story_spec` is where a
// destination URL lives, and parameters typed straight into that URL track
// exactly as well as ones in the URL Parameters box. So a check that could not
// see the link would report a correctly-tracked ad as untagged — a false alarm
// on a healthy ad, which is the failure mode every real bug found by testing
// here has taken (§11). Hence `canWarn`: on the bare shape we still RECORD, and
// we say nothing.
const CREATIVE_FIELD_SHAPES: { name: string; fields: string; canWarn: boolean }[] = [
  {
    name: 'full',
    canWarn: true,
    fields: 'id,name,adset_id,campaign_id,effective_status,'
      + 'creative{id,name,url_tags,object_story_spec,asset_feed_spec,template_data,effective_object_story_id}',
  },
  {
    name: 'no_asset_feed',
    canWarn: true,
    fields: 'id,name,adset_id,campaign_id,effective_status,creative{id,name,url_tags,object_story_spec}',
  },
  {
    name: 'bare',
    canWarn: false,
    fields: 'id,name,adset_id,campaign_id,effective_status,creative{id,url_tags}',
  },
];

type AdCreativeEntry = {
  id?: string;
  name?: string;
  adset_id?: string;
  campaign_id?: string;
  effective_status?: string;
  creative?: Record<string, unknown> & { id?: string; name?: string; url_tags?: string };
};

type CreativeTagResult =
  | {
      ok: true; ads: number; creatives: number; recorded: number; changed: number;
      warned: number; shape: string; status_filter: string; partial?: string;
    }
  | { ok: false; error: string };

async function syncCreativeTags(supabase: any, token: string, accountId: string): Promise<CreativeTagResult> {
  const url = (fields: string, statuses: string[] | null) =>
    `https://graph.facebook.com/${API_VERSION}/act_${accountId}/ads` +
    `?limit=${PAGE_LIMIT}&fields=${encodeURIComponent(fields)}` +
    (statuses
      ? `&filtering=${encodeURIComponent(JSON.stringify([{ field: 'effective_status', operator: 'IN', value: statuses }]))}`
      : '') +
    `&access_token=${encodeURIComponent(token)}`;

  let shapeIdx = 0;
  let filterIdx = 0;
  let next: string | null = url(CREATIVE_FIELD_SHAPES[shapeIdx].fields, STATUS_FILTERS[filterIdx].statuses);
  const ads: AdCreativeEntry[] = [];
  let pages = 0;
  let readError: string | null = null;

  while (next && pages < 20) {
    pages++;
    const page = await fetchPage(next);

    // Two independent step-downs, both only on the first page and only for the
    // "unknown field / bad request" code, exactly like the delivery step. The
    // field shape is tried first because losing a field is cheaper than losing
    // the ability to see archived ads.
    if (!page.ok && pages === 1 && Number(page.summary.meta_code) === 100) {
      if (shapeIdx < CREATIVE_FIELD_SHAPES.length - 1) {
        console.warn(`[meta-ads-sync] creative fields '${CREATIVE_FIELD_SHAPES[shapeIdx].name}' refused, trying the next shape`,
          JSON.stringify(page.summary));
        shapeIdx++;
        next = url(CREATIVE_FIELD_SHAPES[shapeIdx].fields, STATUS_FILTERS[filterIdx].statuses);
        pages = 0;
        continue;
      }
      if (filterIdx < STATUS_FILTERS.length - 1) {
        console.warn(`[meta-ads-sync] creative tags: status filter '${STATUS_FILTERS[filterIdx].name}' refused, trying the next form`,
          JSON.stringify(page.summary));
        filterIdx++;
        shapeIdx = 0;
        next = url(CREATIVE_FIELD_SHAPES[shapeIdx].fields, STATUS_FILTERS[filterIdx].statuses);
        pages = 0;
        continue;
      }
    }
    if (!page.ok) {
      readError = String(page.summary.meta_code ?? 'unknown');
      console.error('[meta-ads-sync] creative tag read failed', JSON.stringify(page.summary));
      break;
    }
    if (Array.isArray(page.body?.data)) ads.push(...page.body.data);
    next = page.body?.paging?.next ?? null;
  }

  if (readError && ads.length === 0) return { ok: false, error: readError };

  // Several ads can share one creative, and the tag lives on the creative. Group
  // so the table holds one row per creative with every ad that points at it.
  const byCreative = new Map<string, {
    creative_id: string; creative_name: string | null;
    ad_ids: string[]; ad_names: string[];
    adset_id: string | null; campaign_id: string | null;
    effective_status: string | null;
    url_tags: string | null; raw: Record<string, unknown>;
  }>();

  for (const ad of ads) {
    const c = ad.creative;
    // An ad with no readable creative is skipped rather than recorded as
    // untagged — "we could not see it" and "it has no tag" are different
    // answers, and only one of them is the founder's problem (§9).
    if (!c?.id) continue;
    const existing = byCreative.get(c.id);
    if (existing) {
      if (ad.id) existing.ad_ids.push(ad.id);
      if (ad.name) existing.ad_names.push(ad.name);
      // Keep the liveliest status among the ads sharing this creative, so one
      // archived ad cannot hide a running one from the warning.
      if (ad.effective_status === 'ACTIVE') existing.effective_status = 'ACTIVE';
      continue;
    }
    byCreative.set(c.id, {
      creative_id: c.id,
      creative_name: c.name ?? null,
      ad_ids: ad.id ? [ad.id] : [],
      ad_names: ad.name ? [ad.name] : [],
      adset_id: ad.adset_id ?? null,
      campaign_id: ad.campaign_id ?? null,
      effective_status: ad.effective_status ?? null,
      url_tags: typeof c.url_tags === 'string' ? c.url_tags : null,
      raw: c,
    });
  }

  const rows = [...byCreative.values()];
  let recorded = 0;
  let changed = 0;
  for (let i = 0; i < rows.length; i += DELIVERY_CHUNK) {
    const { data, error } = await supabase.rpc('record_ad_creative_tags', {
      p_rows: rows.slice(i, i + DELIVERY_CHUNK),
    });
    if (error) {
      console.error('[meta-ads-sync] creative tag write failed', error.message);
      return { ok: false, error: `write_failed: ${error.message.slice(0, 120)}` };
    }
    recorded += Number(data?.recorded) || 0;
    changed += Number(data?.changed) || 0;
  }

  const shape = CREATIVE_FIELD_SHAPES[shapeIdx];
  const partial = readError ?? (next ? 'page_cap_reached' : null);

  // Nothing is said on a degraded read. See CREATIVE_FIELD_SHAPES.
  let warned = 0;
  if (!shape.canWarn) {
    console.warn('[meta-ads-sync] creative tags read without object_story_spec — recording but not warning');
    return {
      ok: true, ads: ads.length, creatives: rows.length, recorded, changed, warned,
      shape: shape.name, status_filter: STATUS_FILTERS[filterIdx].name,
      ...(partial ? { partial } : {}),
    };
  }

  const { data: warnings, error: warnErr } = await supabase.rpc('meta_ad_tracking_tag_warnings');
  if (warnErr) {
    console.error('[meta-ads-sync] creative tag warnings rpc failed', warnErr.message);
    return {
      ok: true, ads: ads.length, creatives: rows.length, recorded, changed, warned,
      shape: shape.name, status_filter: STATUS_FILTERS[filterIdx].name,
      ...(partial ? { partial } : {}),
    };
  }

  for (const w of (warnings ?? [])) {
    // Deliberately NOT gated on ACTIVE, unlike the learning-phase and
    // customer-exclusion warnings. Those stay quiet while an ad set is paused
    // because a paused ad set spends nothing, so the mistake costs nothing until
    // it runs. This one is the opposite: the damage is done by the first
    // untagged click and cannot be undone at any price afterwards, so the moment
    // worth speaking up is BEFORE the ad is switched on. Archived and deleted
    // ads are already excluded in SQL.
    const cutoff = new Date(Date.now() - CREATIVE_TAG_WARN_SUPPRESSION_DAYS * 86400_000).toISOString();
    const { data: recent } = await supabase
      .from('meta_ad_guardrail_events')
      .select('id')
      .eq('rule_key', 'ad_missing_click_id_tag')
      .eq('ad_id', w.creative_id)
      .gte('fired_at', cutoff)
      .limit(1);
    if (recent?.length) continue;

    const who = (w.ad_names?.[0] as string | undefined) ?? (w.ad_ids?.[0] as string | undefined) ?? w.creative_id;
    const body = w.verdict === 'wrong'
      ? `"${who}" looks tracked but is not: its link carries utm_content without the {{ad.id}} macro, so its bookings will never match this ad`
      : `"${who}" has no {{ad.id}} in its URL parameters — every click it gets will be impossible to trace back to it`;

    const { error: pushErr } = await supabase.rpc('notify_admin_push', {
      payload: {
        type: 'meta_ad_issue',
        record: { body: body.slice(0, 240), object_id: `creative-tag-${w.creative_id}` },
      },
    });
    if (pushErr) console.error('[meta-ads-sync] creative tag push failed', pushErr.message);

    // Same ledger as every other warning, so there is one history and one future
    // panel view. `ad_id` holds a CREATIVE id here; `metric` disambiguates, as it
    // does for the ad-set rows. observed/threshold are NULL: a yes/no finding.
    await supabase.from('meta_ad_guardrail_events').insert({
      rule_key: 'ad_missing_click_id_tag',
      label: 'Ad is not tagged with {{ad.id}}',
      ad_id: w.creative_id,
      ad_name: (w.ad_names?.[0] as string | undefined) ?? w.creative_name ?? null,
      metric: 'ad_creative_url_tags',
      observed: null,
      threshold: null,
      window_days: null,
      context: w,
      // "queued without error", not "delivered": notify_admin_push is fire-and-forget.
      notified_at: pushErr ? null : new Date().toISOString(),
      notify_error: pushErr ? pushErr.message.slice(0, 500) : null,
    });
    warned++;
  }

  return {
    ok: true, ads: ads.length, creatives: rows.length, recorded, changed, warned,
    shape: shape.name, status_filter: STATUS_FILTERS[filterIdx].name,
    ...(partial ? { partial } : {}),
  };
}

Deno.serve(async (req) => {
  const started = Date.now();

  // Created first so every exit path below can record what happened. A run
  // that fails on missing credentials is exactly the run worth logging.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // A broken sync is currently invisible until somebody opens Growth ▸ Ads. The
  // most likely cause is a revoked or expired token (OAuthException 190), and
  // that can sit unnoticed for days while ad spend keeps running unmeasured —
  // which is the one thing this whole system exists to prevent. So a failure
  // also pushes, reusing the meta_ad_issue type meta-ads-alerts already sends.
  //
  // Only on the HEALTHY → BROKEN edge. The cron fires every 6 hours and a
  // revoked token stays revoked, so alerting on every failed run would be four
  // notifications a day about one problem — which trains him to ignore them.
  // Reading the previous row is what makes this an edge rather than a state,
  // and it has to happen BEFORE the insert below or it reads back the very row
  // we are about to write.
  const alertIfNewlyBroken = async (row: Record<string, unknown>) => {
    try {
      const { data: prev } = await supabase
        .from('meta_ads_sync_log')
        .select('ok')
        .order('ran_at', { ascending: false })
        .limit(1);
      // No history at all is an edge too: the first thing this function ever
      // does must not be to fail quietly.
      if (prev?.length && prev[0].ok === false) return;

      const code = row.error_code ? String(row.error_code) : 'unknown';
      const detail = row.error_detail ? String(row.error_detail) : '';
      // A spend mismatch is not a failed sync: the sync worked and found money
      // missing from the per-ad numbers. "Sync failed" would send him to check
      // the token; the detail sentence already says what to look for.
      // A 613 with no subcode is Meta saying it has cut this ad account's quota
      // for abnormal traffic (see ABUSE_RATE_LIMIT_CODE). "Sync failed, it will
      // retry" is the one message that must NOT go out for it: waiting does not
      // clear it and more calls make it worse. Every other failure keeps its
      // existing wording.
      const abuseThrottle = code === '613' && row.error_subcode == null;
      const body = (code === 'spend_unaccounted'
        ? `Ad spend missing from our numbers · ${detail}`
        : abuseThrottle
        ? 'Meta has cut this ad account’s API quota after flagging unusual traffic. '
          + 'It will not clear by waiting, and retrying makes it worse — check what is calling Meta, then contact Meta support.'
        : `Meta spend sync failed · ${code}${detail ? ` · ${detail}` : ''}`).slice(0, 240);

      // object_id is what send-admin-push builds the notification tag from, and
      // a repeat about the same thing is meant to collapse onto the previous
      // one. There is no Meta object id here — the whole sync is what broke —
      // so pass a stable synthetic key. Leaving it unset would tag this
      // 'meta-ad-issue-unknown', which every other source without an object id
      // would also claim, and two different problems would hide each other.
      await supabase.rpc('notify_admin_push', {
        payload: { type: 'meta_ad_issue', record: { body, error_code: code, object_id: 'spend-sync' } },
      });
    } catch (e) {
      // Never let an alert failure change the outcome of the sync.
      console.error('[meta-ads-sync] could not send failure alert', e instanceof Error ? e.message : String(e));
    }
  };

  // Which STATUS_FILTERS form the per-ad query ended up using. Set by the fetch
  // loop and written on every log row from then on; null for runs that never
  // reached Meta (missing credentials).
  let statusFilter: string | null = null;

  // Fire-and-forget by contract: a logging failure must never turn a working
  // sync into a failed one.
  const logRun = async (row: Record<string, unknown>) => {
    try {
      if (row.ok === false) await alertIfNewlyBroken(row);
      const { error } = await supabase.from('meta_ads_sync_log').insert({
        duration_ms: Date.now() - started,
        status_filter: statusFilter,
        ...row,
      });
      if (error) console.error('[meta-ads-sync] could not write sync log', error.message);
    } catch (e) {
      console.error('[meta-ads-sync] could not write sync log', e instanceof Error ? e.message : String(e));
    }
  };

  try {
    const token = Deno.env.get('META_ADS_ACCESS_TOKEN');
    const accountId = Deno.env.get('META_AD_ACCOUNT_ID');

    if (!token || !accountId) {
      // Loud, not silent: an unset secret is the single most likely reason this
      // function ever does nothing, and it must not look like "no ads ran".
      console.error('[meta-ads-sync] META_ADS_ACCESS_TOKEN or META_AD_ACCOUNT_ID not set — nothing synced');
      await logRun({ ok: false, error_code: 'missing_credentials', error_detail: 'META_ADS_ACCESS_TOKEN or META_AD_ACCOUNT_ID is not set' });
      return new Response(
        JSON.stringify({ ok: false, error: 'missing_credentials' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const url = new URL(req.url);
    const qSince = url.searchParams.get('since');
    const qUntil = url.searchParams.get('until');

    let since: string;
    let until: string;

    if (qSince || qUntil) {
      // Manual backfill. Gated: this can pull an arbitrary range and burn the
      // app's rate limit, so it needs the same secret cart-abandonment uses.
      const secret = Deno.env.get('CRON_SECRET');
      if (!secret || url.searchParams.get('secret') !== secret) {
        return new Response(
          JSON.stringify({ ok: false, error: 'backfill_requires_secret' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        );
      }
      const today = istToday();
      until = qUntil ?? isoDate(today);
      since = qSince ?? isoDate(new Date(today.getTime() - LOOKBACK_DAYS * 86400000));
    } else {
      const today = istToday();
      until = isoDate(today);
      since = isoDate(new Date(today.getTime() - LOOKBACK_DAYS * 86400000));
    }

    const insightsUrl = (statuses: string[] | null) =>
      `https://graph.facebook.com/${API_VERSION}/act_${accountId}/insights` +
      `?level=ad&time_increment=1&limit=${PAGE_LIMIT}` +
      `&fields=${encodeURIComponent(FIELDS)}` +
      `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}` +
      (statuses
        ? `&filtering=${encodeURIComponent(JSON.stringify([{ field: 'ad.effective_status', operator: 'IN', value: statuses }]))}`
        : '') +
      `&access_token=${encodeURIComponent(token)}`;

    let filterIdx = 0;
    statusFilter = STATUS_FILTERS[filterIdx].name;
    let next: string | null = insightsUrl(STATUS_FILTERS[filterIdx].statuses);

    const rows: Record<string, unknown>[] = [];
    let pages = 0;
    let versionWarning: string | null = null;
    let accessTier: string | null = null;
    let throttleStop: string | null = null;

    while (next && pages < 40) {
      pages++;
      const page = await fetchPage(next);

      // Meta refused the status filter itself: step down to the next form and
      // start the window again. Only on the FIRST page and only for error 100
      // (invalid parameter). A later page failing, or any other code, has
      // nothing to do with the filter and takes the normal failure path below.
      // If the plain query fails with 100 too, that is a real error and is
      // reported as one.
      if (!page.ok && pages === 1 && Number(page.summary.meta_code) === 100 && filterIdx < STATUS_FILTERS.length - 1) {
        console.warn(`[meta-ads-sync] Meta rejected status filter '${STATUS_FILTERS[filterIdx].name}' — trying the next form`,
          JSON.stringify(page.summary));
        filterIdx++;
        statusFilter = STATUS_FILTERS[filterIdx].name;
        next = insightsUrl(STATUS_FILTERS[filterIdx].statuses);
        pages = 0;
        continue;
      }

      if (!page.ok) {
        await logRun({
          ok: false, since, until,
          error_code: page.summary.meta_code != null ? String(page.summary.meta_code) : 'meta_api_error',
          // Meta reuses one code for several unrelated failures and the subcode
          // is the only thing separating them — 613 alone cannot tell an
          // ordinary throttle from an account Meta has flagged. It was parsed
          // into the summary and then dropped on write, so the log could not
          // answer afterwards what the alarm had actually been about.
          error_subcode: page.summary.meta_subcode ?? null,
          error_detail: page.summary.meta_message ?? null,
        });
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'meta_api_error',
            status: page.status,
            attempts: page.attempts,
            ...page.summary,
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } },
        );
      }
      if (page.usage) console.log('[meta-ads-sync] rate budget', page.usage);
      if (page.versionWarning && !versionWarning) {
        versionWarning = page.versionWarning;
        console.warn(`[meta-ads-sync] API ${API_VERSION} is deprecated — Meta auto-upgraded this call: ${page.versionWarning}`);
      }

      const throttle = parseInsightsThrottle(page.usage);
      if (throttle) {
        if (throttle.tier) accessTier = throttle.tier;
        // Whichever ceiling is nearer is the one that will stop us.
        const peak = Math.max(throttle.appPct, throttle.accPct);
        if (peak >= THROTTLE_STOP_PCT) {
          throttleStop = `insights rate limit at ${peak}% (app ${throttle.appPct}%, account ${throttle.accPct}%`
            + `${throttle.tier ? `, tier ${throttle.tier}` : ''})`;
        } else if (peak >= THROTTLE_PACE_PCT) {
          // Pace rather than abandon. Meta's guidance is to spread queries out;
          // a short wait between pages is cheap here because the cron owns the
          // wall clock and nobody is waiting on this response.
          console.warn(`[meta-ads-sync] insights throttle at ${peak}% — pacing ${THROTTLE_PACE_MS}ms between pages`);
          await sleep(THROTTLE_PACE_MS);
        }
      }
      const body = page.body;

      for (const r of body.data ?? []) {
        rows.push({
          ad_id: String(r.ad_id),
          date_start: r.date_start,
          account_id: String(accountId),
          ad_name: r.ad_name ?? null,
          adset_id: r.adset_id ?? null,
          adset_name: r.adset_name ?? null,
          campaign_id: r.campaign_id ?? null,
          campaign_name: r.campaign_name ?? null,
          spend: Number(r.spend) || 0,
          impressions: Number(r.impressions) || 0,
          clicks: Number(r.clicks) || 0,
          inline_link_clicks: Number(r.inline_link_clicks) || 0,
          reach: Number(r.reach) || 0,
          frequency: r.frequency != null ? Number(r.frequency) : null,
          // num() rather than Number(x)||0: a metric Meta omits entirely means
          // "not applicable to this ad", which is not the same as zero, and a
          // chart must not draw a zero where there was no measurement.
          cpc: num(r.cpc),
          cpm: num(r.cpm),
          ctr: num(r.ctr),
          unique_clicks: num(r.unique_clicks),
          outbound_clicks: Array.isArray(r.outbound_clicks)
            ? pickAction(r.outbound_clicks, ['outbound_click'])
            : num(r.outbound_clicks),
          quality_ranking: r.quality_ranking ?? null,
          engagement_rate_ranking: r.engagement_rate_ranking ?? null,
          conversion_rate_ranking: r.conversion_rate_ranking ?? null,
          // Kept whole alongside the extracted figures — see the column comment.
          actions: r.actions ?? null,
          action_values: r.action_values ?? null,
          cost_per_action_type: r.cost_per_action_type ?? null,
          meta_leads: pickAction(r.actions, LEAD_ACTIONS),
          meta_purchases: pickAction(r.actions, PURCHASE_ACTIONS),
          meta_purchase_value: pickAction(r.action_values, PURCHASE_ACTIONS),
          synced_at: new Date().toISOString(),
        });
      }

      next = body.paging?.next ?? null;
      // Checked AFTER the rows above are pushed: the page that carried the
      // warning still succeeded, and throwing its data away would make the
      // window shorter than it needs to be.
      if (throttleStop) break;
    }

    let upserted = 0;
    if (rows.length) {
      // Chunked: one oversized statement is the failure mode that only appears
      // once there is real spend to sync.
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        const { error } = await supabase
          .from('meta_ad_daily')
          .upsert(chunk, { onConflict: 'ad_id,date_start' });
        if (error) {
          console.error('[meta-ads-sync] upsert failed', error.message);
          await logRun({ ok: false, since, until, rows_fetched: rows.length, rows_upserted: upserted, error_code: 'upsert_failed', error_detail: error.message });
          return new Response(
            JSON.stringify({ ok: false, error: 'upsert_failed', detail: error.message, upserted }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          );
        }
        upserted += chunk.length;
      }
    }

    // Stopped early to stay under Meta's insights rate limit. The rows fetched
    // so far are real and have just been written, but the window is a PREFIX,
    // and partial spend silently becomes a wrong cost-per-booking. Reported NOT
    // ok for exactly the reason the page-cap guard below is: a short answer that
    // looks complete is worse than a visible failure. The next 6-hourly run
    // re-fetches the whole lookback window, so this self-heals once the limit
    // decays — no state to reconcile.
    if (throttleStop) {
      console.error('[meta-ads-sync] THROTTLE STOP —', throttleStop);
      await logRun({
        ok: false, since, until,
        rows_fetched: rows.length, rows_upserted: upserted,
        error_code: 'insights_throttle_stop', error_detail: throttleStop,
      });
      return new Response(
        JSON.stringify({
          ok: false, error: 'insights_throttle_stop', detail: throttleStop,
          pages, rows: rows.length, upserted,
          ...(accessTier ? { access_tier: accessTier } : {}),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // The page cap was hit and Meta still had more to give. The rows above are
    // real and have been written, but they are a PREFIX of the window, not the
    // window — and a cost-per-booking computed from partial spend is a wrong
    // answer delivered confidently, which is worse than a visible failure.
    // Logged as NOT ok so the panel's stale-data banner fires: this is the same
    // reasoning as null-instead-of-zero everywhere else in this system.
    // Ceiling is 40 x 500 = 20,000 rows, i.e. ~1,400 ads over a 14-day window,
    // so this is a guard against a future account, not a present problem.
    if (next) {
      const detail = `stopped at the ${pages}-page cap with more pages available; ` +
        `${rows.length} rows fetched and ${upserted} written, but the window is incomplete`;
      console.error('[meta-ads-sync] TRUNCATED —', detail);
      await logRun({
        ok: false, since, until,
        rows_fetched: rows.length, rows_upserted: upserted,
        error_code: 'page_cap_reached', error_detail: detail,
      });
      return new Response(
        JSON.stringify({ ok: false, error: 'page_cap_reached', detail, pages, rows: rows.length, upserted }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Deleted/archived ads: compare Meta's account-level daily spend with what
    // the per-ad rows now hold. Runs after the per-ad upsert so it checks what
    // the panel will actually read. Cannot fail this request by throwing; a
    // real MISMATCH is what turns the run not ok, below.
    let spendCheck: SpendCheckResult | null = null;
    try {
      spendCheck = await reconcileAccountSpend(supabase, token, accountId, since, until);
    } catch (e) {
      console.error('[meta-ads-sync] spend reconciliation threw', e instanceof Error ? e.message : String(e));
      spendCheck = { ok: false, error: 'threw' };
    }
    if (spendCheck && !spendCheck.ok) {
      console.warn('[meta-ads-sync] spend reconciliation could not run:', spendCheck.error);
    }

    // Runs only after spend has been written, and cannot fail this request. The
    // await is deliberate rather than fire-and-forget: an edge function's
    // runtime can be torn down the moment the response is returned, so a
    // detached promise here would be killed mid-insert on some runs and not
    // others — which is worse than not doing it at all, because it would look
    // like the data was intermittently changing.
    let volume: VolumeResult | null = null;
    try {
      volume = await syncAdVolume(supabase, token, accountId);
    } catch (e) {
      console.error('[meta-ads-sync] ads_volume step threw', e instanceof Error ? e.message : String(e));
      volume = { ok: false, error: 'threw' };
    }

    // Third independent step, same contract as the two above: it runs after
    // spend is safely written and cannot fail this request. Kept separate from
    // the volume step rather than merged into one "extras" block, because they
    // answer different questions and a single failure flag would not say which
    // one stopped working.
    let adsets: AdsetResult | null = null;
    try {
      adsets = await syncAdsets(supabase, token, accountId);
    } catch (e) {
      console.error('[meta-ads-sync] adset step threw', e instanceof Error ? e.message : String(e));
      adsets = { ok: false, error: 'threw' };
    }

    // Fourth independent step, same contract. It runs after the ad set step on
    // purpose: the customer-exclusion check reads the targeting written there.
    let audiences: AudienceResult | null = null;
    try {
      audiences = await syncAudiences(supabase, token, accountId);
    } catch (e) {
      console.error('[meta-ads-sync] audience step threw', e instanceof Error ? e.message : String(e));
      audiences = { ok: false, error: 'threw' };
    }

    // Fifth independent step: delivery settings (on/off, budget, objective, bid
    // strategy) for campaigns, ad sets and ads, with history. Shown in
    // Growth ▸ Ads only; no alerts, by the founder's choice.
    let delivery: DeliveryResult | null = null;
    try {
      delivery = await syncDelivery(supabase, token, accountId);
    } catch (e) {
      console.error('[meta-ads-sync] delivery step threw', e instanceof Error ? e.message : String(e));
      delivery = { ok: false, error: 'threw' };
    }

    // Sixth independent step: does every ad carry utm_content={{ad.id}}? Kept
    // separate from the delivery step even though both read /ads, for the same
    // reason the volume and ad-set steps are separate — they answer different
    // questions, and one failure flag would not say which one stopped working.
    let creativeTags: CreativeTagResult | null = null;
    try {
      creativeTags = await syncCreativeTags(supabase, token, accountId);
    } catch (e) {
      console.error('[meta-ads-sync] creative tag step threw', e instanceof Error ? e.message : String(e));
      creativeTags = { ok: false, error: 'threw' };
    }

    // Spend Meta billed that our per-ad rows do not hold (or the reverse). The
    // rows written above are real, but a cost per booking computed from them
    // would be wrong without saying so, so the run is NOT ok. That is the same
    // rule as the page-cap and throttle guards. It lights the panel's stale-data
    // banner and pushes once when a healthy sync turns unhealthy
    // (alertIfNewlyBroken). It clears by itself on the first run where the
    // numbers agree again.
    const spendGap = spendCheck && spendCheck.ok && spendCheck.mismatched_days.length > 0 ? spendCheck : null;
    const spendGapDetail = spendGap ? describeSpendGap(spendGap) : null;
    if (spendGapDetail) console.error('[meta-ads-sync] SPEND UNACCOUNTED —', spendGapDetail);

    const result = {
      ok: !spendGap,
      ...(spendGapDetail ? { error: 'spend_unaccounted', detail: spendGapDetail } : {}),
      since,
      until,
      pages,
      rows: rows.length,
      upserted,
      status_filter: statusFilter,
      spend_check: spendCheck,
      ms: Date.now() - started,
      ...(volume ? { volume } : {}),
      ...(adsets ? { adsets } : {}),
      ...(audiences ? { audiences } : {}),
      ...(delivery ? { delivery } : {}),
      ...(creativeTags ? { creative_tags: creativeTags } : {}),
      ...(versionWarning ? { version_warning: versionWarning } : {}),
      ...(accessTier ? { access_tier: accessTier } : {}),
    };
    await logRun({
      ok: !spendGap, since, until, rows_fetched: rows.length, rows_upserted: upserted,
      spend_check: spendCheck,
      ...(spendGapDetail ? { error_code: 'spend_unaccounted', error_detail: spendGapDetail } : {}),
    });
    console.log('[meta-ads-sync]', JSON.stringify(result));
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[meta-ads-sync] unhandled', e instanceof Error ? e.message : String(e));
    await logRun({ ok: false, error_code: 'unhandled', error_detail: e instanceof Error ? e.message : String(e) });
    return new Response(
      JSON.stringify({ ok: false, error: 'unhandled' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
