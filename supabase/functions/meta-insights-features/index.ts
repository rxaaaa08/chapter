// meta-insights-features
//
// Reads — and, only when explicitly told to, enables — Meta's Ads Insights
// "feature settings". These are breakdowns an ad account must opt into before
// the Insights API will return them at all.
//
// WHY THIS MATTERS MORE THAN A NORMAL SETTINGS TOGGLE
// A feature that is enabled today comes back carrying `insights_effective_date`,
// and Meta returns data for that breakdown only from that date forward. Every
// day before it is gone permanently — there is no backfill. So this sits in the
// same category as the `{{ad.id}}` URL parameter: cheap now, impossible later.
// Enabling before the first rupee of spend is the entire point.
//
// AND IT IS A ONE-WAY DOOR. Meta's own doc: "The API does not support disabling
// a feature." Nothing here may enable anything by default, or as a side effect
// of a status check, or on a cron. Enabling takes a deliberate call carrying the
// secret AND the exact feature name.
//
// ── TWO TRAPS, BOTH UNIQUE TO THIS ENDPOINT ────────────────────────────────
//
// 1. THE HOST IS NOT graph.facebook.com.
//    It is https://ads-api.facebook.com/<version>/marketing-api. Every other
//    Meta call in this repo — insights, ads_volume, adsets, CAPI, audiences —
//    goes to graph.facebook.com, so the natural thing to do is reuse that
//    constant and get a 404 that reads like "the feature does not exist".
//
// 2. AUTH IS A BEARER HEADER, NOT ?access_token=.
//    Everything else here passes the token as a query parameter. This endpoint
//    is documented with `Authorization: Bearer`. Passing it the usual way
//    produces a 401 that looks like a dead token rather than a wrong call
//    shape — and a "dead token" is exactly the wrong thing to go debugging,
//    because it sends you to the Business Manager rather than to this line.
//
// verify_jwt is false: it may be invoked without a JWT. Deploy with
//   supabase functions deploy meta-insights-features --no-verify-jwt
//
// ENV
//   META_ADS_ACCESS_TOKEN — system-user token, ads_read. Meta documents
//                           ads_read as sufficient even for the POST, which is
//                           unusual for a write and worth re-reading if the
//                           enable path ever starts returning 403.
//   META_AD_ACCOUNT_ID    — numeric, no "act_" prefix.
//   CRON_SECRET           — guards the enable path. Unset means enabling is
//                           DISABLED, not open.

const API_VERSION = 'v26.0';

// Deliberately its own constant, not shared with the graph.facebook.com one.
// See trap 1 above. If a future version bump touches API_VERSION elsewhere,
// this needs moving too — grep for both hosts.
const FEATURES_BASE = 'https://ads-api.facebook.com';

type MetaErr = { code?: number; error_subcode?: number; message?: string; type?: string };

// Every failure reports Meta's RAW code and subcode alongside any wording we
// add. §9 of META-ADS-HANDOFF.md: the audience sync once returned the same
// translated sentence after the founder had already fixed the cause, which was
// indistinguishable from a wrong diagnosis. A translation says what to do; the
// raw code says whether the translation was right.
function errShape(status: number, body: any) {
  const e: MetaErr = body?.error ?? {};
  return {
    http_status: status,
    meta_code: e.code ?? null,
    meta_subcode: e.error_subcode ?? null,
    meta_type: e.type ?? null,
    meta_message: e.message ?? null,
  };
}

async function call(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${FEATURES_BASE}/${API_VERSION}/marketing-api${path}`, {
    ...init,
    headers: {
      // Trap 2. Not a query parameter.
      'Authorization': `Bearer ${token}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok && !body?.error, status: res.status, body };
}

Deno.serve(async (req) => {
  const json = (v: unknown, status = 200) =>
    new Response(JSON.stringify(v, null, 2), {
      status, headers: { 'Content-Type': 'application/json' },
    });

  try {
    const token = Deno.env.get('META_ADS_ACCESS_TOKEN');
    const accountId = Deno.env.get('META_AD_ACCOUNT_ID');
    if (!token || !accountId) {
      return json({ ok: false, error: 'missing_credentials' }, 500);
    }

    const url = new URL(req.url);
    const enable = url.searchParams.get('enable');

    // ── Catalog + current status. Read-only, always safe to call. ───────────
    const [catalog, current] = await Promise.all([
      call(`/act_${accountId}/insights/feature-settings/list-features`, token),
      call(`/act_${accountId}/insights/feature-settings`, token),
    ]);

    if (!catalog.ok) {
      return json({ ok: false, step: 'list-features', ...errShape(catalog.status, catalog.body) }, 502);
    }

    const available: Array<{ feature_name: string; feature_type: string }> =
      catalog.body?.data ?? [];
    // A feature the account has never enabled is simply ABSENT from this
    // response — Meta does not return it with status "disabled". So "not in
    // this list" is the real meaning of not enabled, and an empty array means
    // nothing has ever been enabled rather than that the call failed.
    const enabled: Array<{ feature_name: string; status: string; insights_effective_date?: string }> =
      current.ok ? (current.body?.data ?? []) : [];
    const enabledNames = new Set(enabled.map((f) => f.feature_name));

    const report = {
      ok: true,
      account: `act_${accountId}`,
      available: available.map((f) => ({
        ...f,
        enabled: enabledNames.has(f.feature_name),
        // Present only when the feature is date-limited. Its ABSENCE on an
        // enabled feature means "effective for all dates", which is the good
        // case, so it must not be rendered as a missing value.
        effective_from:
          enabled.find((e) => e.feature_name === f.feature_name)?.insights_effective_date ?? null,
      })),
      enabled_count: enabledNames.size,
      // Surfaced rather than swallowed: a failed status read with a working
      // catalog read is a different problem from "nothing is enabled", and the
      // two look identical if this is dropped.
      status_read_failed: current.ok ? null : errShape(current.status, current.body),
    };

    if (!enable) return json(report);

    // ── Enable. Guarded twice, and IRREVERSIBLE. ────────────────────────────
    const secret = Deno.env.get('CRON_SECRET');
    // The three approved breakdowns were enabled on 2026-09-09 through a
    // one-shot nonce that lived in this file for about two minutes and was
    // removed in the next deploy. CRON_SECRET is the only key now.
    const given = url.searchParams.get('secret');
    if (!secret || given !== secret) {
      return json({ ok: false, error: 'enable_requires_secret', ...report }, 403);
    }
    // Checked against Meta's own catalog rather than a list hardcoded here: the
    // doc says the catalog will grow (a `metric` feature type is defined with
    // nothing in it yet), and a local copy would reject a real new feature.
    if (!available.some((f) => f.feature_name === enable)) {
      return json({
        ok: false, error: 'unknown_feature', requested: enable,
        valid: available.map((f) => f.feature_name),
      }, 400);
    }
    if (enabledNames.has(enable)) {
      // Meta returns 200 for a repeat enable, but saying "already enabled" is
      // more useful than echoing a success that implies something changed.
      return json({ ok: true, already_enabled: true, feature: enable, ...report });
    }

    const res = await call(`/act_${accountId}/insights/feature-settings`, token, {
      method: 'POST',
      body: JSON.stringify({ feature_name: enable }),
    });
    if (!res.ok) {
      return json({ ok: false, step: 'enable', feature: enable, ...errShape(res.status, res.body) }, 502);
    }

    return json({
      ok: true,
      enabled: enable,
      echoed_id: res.body?.id ?? null,
      // Meta's stated lag. Re-reading the status immediately will usually show
      // the feature enabled while the BREAKDOWN is still not queryable, so the
      // two are reported as separate facts.
      note: 'Enabled. Allow up to 24h before the breakdown returns data in the Insights API. This cannot be undone.',
    });
  } catch (e) {
    return json({ ok: false, error: 'unhandled', detail: e instanceof Error ? e.message : String(e) }, 500);
  }
});
