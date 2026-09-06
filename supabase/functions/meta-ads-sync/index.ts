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
// verify_jwt is false: pg_cron (pg_net) calls this without a JWT. Deploy with
//   supabase functions deploy meta-ads-sync --no-verify-jwt
//
// ENV
//   META_ADS_ACCESS_TOKEN  — long-lived system-user token, ads_read scope.
//   META_AD_ACCOUNT_ID     — numeric, no "act_" prefix.
//   CRON_SECRET            — guards the manual backfill path (?since=&until=).
//                            Unset means manual backfill is disabled, not open.

const API_VERSION = 'v25.0';

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
// 80000-80004 = business-use-case rate limits
// 1, 2 = unknown/internal, which Meta documents as usually temporary
const RETRYABLE_CODES = new Set([1, 2, 4, 17, 341, 80000, 80001, 80002, 80003, 80004]);

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

// One page, with back-off. Returns the parsed body or a classified failure.
async function fetchPage(url: string): Promise<
  { ok: true; body: any; usage: string | null } |
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
    const usage = res.headers.get('x-business-use-case-usage') ?? res.headers.get('x-app-usage');

    if (res.ok && body && !body.error) return { ok: true, body, usage };

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

// Wider than Meta's ~7-day restatement window, so a couple of missed cron runs
// still self-heal instead of leaving a permanent hole.
const LOOKBACK_DAYS = 14;

// One row per ad per day. 500 is far above anything we will run, but the API
// paginates regardless and the loop below follows paging.next either way.
const PAGE_LIMIT = 500;

const FIELDS = [
  'ad_id', 'ad_name',
  'adset_id', 'adset_name',
  'campaign_id', 'campaign_name',
  'spend', 'impressions', 'clicks', 'inline_link_clicks', 'reach', 'frequency',
  'actions', 'action_values',
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

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Meta's day boundaries follow the AD ACCOUNT's timezone, not UTC. Ours is
// Asia/Kolkata, and "today" in IST is already "yesterday" in UTC for 5.5 hours
// every night — so deriving the window from a UTC clock would silently skip a
// day. en-CA formats as YYYY-MM-DD.
function istToday(): Date {
  const ist = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return new Date(`${ist}T00:00:00Z`);
}

Deno.serve(async (req) => {
  const started = Date.now();
  try {
    const token = Deno.env.get('META_ADS_ACCESS_TOKEN');
    const accountId = Deno.env.get('META_AD_ACCOUNT_ID');

    if (!token || !accountId) {
      // Loud, not silent: an unset secret is the single most likely reason this
      // function ever does nothing, and it must not look like "no ads ran".
      console.error('[meta-ads-sync] META_ADS_ACCESS_TOKEN or META_AD_ACCOUNT_ID not set — nothing synced');
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let next: string | null =
      `https://graph.facebook.com/${API_VERSION}/act_${accountId}/insights` +
      `?level=ad&time_increment=1&limit=${PAGE_LIMIT}` +
      `&fields=${encodeURIComponent(FIELDS)}` +
      `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}` +
      `&access_token=${encodeURIComponent(token)}`;

    const rows: Record<string, unknown>[] = [];
    let pages = 0;

    while (next && pages < 40) {
      pages++;
      const page = await fetchPage(next);

      if (!page.ok) {
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
          meta_leads: pickAction(r.actions, LEAD_ACTIONS),
          meta_purchases: pickAction(r.actions, PURCHASE_ACTIONS),
          meta_purchase_value: pickAction(r.action_values, PURCHASE_ACTIONS),
          synced_at: new Date().toISOString(),
        });
      }

      next = body.paging?.next ?? null;
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
          return new Response(
            JSON.stringify({ ok: false, error: 'upsert_failed', detail: error.message, upserted }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          );
        }
        upserted += chunk.length;
      }
    }

    const result = {
      ok: true,
      since,
      until,
      pages,
      rows: rows.length,
      upserted,
      ms: Date.now() - started,
    };
    console.log('[meta-ads-sync]', JSON.stringify(result));
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[meta-ads-sync] unhandled', e instanceof Error ? e.message : String(e));
    return new Response(
      JSON.stringify({ ok: false, error: 'unhandled' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
