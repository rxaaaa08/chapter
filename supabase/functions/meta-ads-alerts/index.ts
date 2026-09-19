// meta-ads-alerts — turn stored Meta webhook events into something a human sees.
//
// WHY THIS IS SEPARATE FROM THE WEBHOOK
// meta-ads-webhook stores and returns 200 fast, deliberately: Meta retries
// anything slow or non-200, so doing real work inside it buys duplicate
// deliveries. A webhook also only ever says "something changed", never what it
// changed TO — learning that means polling Meta, which is exactly the slow thing
// that must not happen in the handler. So the inbox fills there and is drained
// here. meta_ads_events.handled_at / handled_note were reserved for this.
//
// WHAT IT DELIBERATELY DOES NOT DO
// Meta's docs for these two webhooks end with "Example actions" that all WRITE —
// activate the ad, pause the ad set, resubmit the creative. We do none of that.
// The stored token is `ads_read`, on purpose, and deciding what to do about a
// rejected ad is the founder's call, not a cron job's. This function reads,
// explains, and notifies. The pause button stays human.
//
// TWO FIELDS, TWO TREATMENTS
//   with_issues_ad_objects — something is WRONG (rejection, delivery block).
//                            Actionable, so it pushes.
//   in_process_ad_objects  — something FINISHED publishing. On an account whose
//                            ads are created by hand in Ads Manager (which shows
//                            this already), a push would be pure noise. Recorded
//                            as handled with a note saying no action was needed,
//                            so the inbox does not grow a permanent backlog of
//                            rows nobody ever looks at.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Pinned, like meta-ads-sync and meta-audience-sync. Meta retires a version
// roughly every 90 days — this is now the THIRD place that has to move together.
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

// How long the same problem on the same object stays quiet after being reported.
// Meta re-sends an issue while it persists; without this, one rejected ad would
// push every 15 minutes until it was fixed.
const REPEAT_SUPPRESSION_HOURS = 6;

// Fields differ by node type and asking for the wrong one is a hard 400, not an
// omission — `review_feedback` exists on an ad and not on a campaign. Anything
// unrecognised falls back to `name`, which every node has.
function pollFields(level: string | null): string {
  switch ((level ?? '').toLowerCase()) {
    // issues_info is where a POST-PROCESSING failure explains itself — level,
    // error_code, error_summary, error_message. Requested on ad and creative
    // only: it is documented on those two nodes, and asking a node for a field
    // it does not have is a hard 400 rather than an omission, which would cost
    // us the whole context poll.
    case 'ad':        return 'name,effective_status,configured_status,review_feedback,issues_info';
    case 'adset':
    case 'ad_set':    return 'name,effective_status,configured_status';
    case 'campaign':  return 'name,effective_status,configured_status';
    // A creative carries its post-processing state in `status` (IN-PROCESS /
    // WITH_ISSUES / ACTIVE), NOT in effective_status like the other three.
    case 'creative':
    case 'adcreative':return 'name,status,issues_info';
    default:          return 'name';
  }
}

type Ctx = {
  name?: string;
  /** Campaign / ad set / ad. A creative reports through `status` instead. */
  effective_status?: string;
  status?: string;
  review_feedback?: unknown;
  issues_info?: unknown;
  error?: string;
};

// Enrichment, never a dependency. The webhook payload already carries the
// actionable part (error_summary / error_message); the poll only adds the ad's
// name and the rejection reason. If it fails, the alert still goes out — a
// silent failure here would turn a rejected ad into no notification at all.
async function pollContext(objectId: string, level: string | null, token: string): Promise<Ctx> {
  try {
    // Token in the Authorization header, not the query string. Graph accepts
    // both, but the catch below returns String(err) into handled_note, and some
    // fetch failures stringify the whole request URL into the error message —
    // which would write the access token into a database column. Admin-only and
    // RLS-gated, so this is a hardening step rather than a live leak, but there
    // is no reason to put a credential somewhere it can be echoed at all.
    const url = `https://graph.facebook.com/${API_VERSION}/${encodeURIComponent(objectId)}` +
                `?fields=${encodeURIComponent(pollFields(level))}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Meta's raw code travels with the translation: a translation tells you
      // what to do, the raw code tells you whether the translation was right.
      const e = json?.error ?? {};
      return { error: `${e.code ?? res.status}${e.error_subcode ? '/' + e.error_subcode : ''}: ${e.message ?? 'poll failed'}` };
    }
    return {
      name: typeof json?.name === 'string' ? json.name : undefined,
      effective_status: typeof json?.effective_status === 'string' ? json.effective_status : undefined,
      status: typeof json?.status === 'string' ? json.status : undefined,
      review_feedback: json?.review_feedback,
      issues_info: json?.issues_info,
    };
  } catch (err) {
    return { error: String(err) };
  }
}

// A post-processing failure explains itself here, and more precisely than
// review_feedback does: Meta's own example is error_code 1815869, "Ad post is
// not available". Preferred over review_feedback when both are present.
function issueDetail(issuesInfo: unknown, knownCode: string | null): string | null {
  if (!Array.isArray(issuesInfo) || !issuesInfo.length) return null;
  const first = issuesInfo[0] as Record<string, unknown> | null;
  const msg = first?.error_message ?? first?.error_summary;
  if (typeof msg !== 'string' || !msg.trim()) return null;
  // The webhook payload usually carries this same number, and the push body has
  // a 240-character budget — printing the code twice spends it on nothing. Only
  // append when this node disagrees with the event, which is worth seeing.
  const own = first?.error_code != null ? String(first.error_code) : null;
  const code = own && own !== knownCode ? ` (${own})` : '';
  return `${msg.slice(0, 160)}${code}`;
}

function firstReason(review: unknown): string | null {
  if (!review) return null;
  if (typeof review === 'string') return review.slice(0, 160);
  if (typeof review === 'object') {
    const vals = Object.values(review as Record<string, unknown>);
    for (const v of vals) {
      if (typeof v === 'string' && v.trim()) return v.slice(0, 160);
    }
  }
  return null;
}

// ── Guardrails ──────────────────────────────────────────────────────────────
// The second half of this function. The webhook half above reacts to things
// META tells us; this half reacts to things only WE can know — real spend
// divided by real paid tickets, from meta_ad_guardrail_breaches(). See
// META-ADS-HANDOFF.md Layer 7 for why that is more accurate than Meta's own
// threshold engine (its conversion counts read ~50% high on this account).
//
// The evaluator is granted to service_role ONLY, which is the key this function
// uses. Calling the founder-gated wrapper instead would return zero rows here,
// forever, silently — that is the whole reason there are two functions.

type Breach = {
  rule_key: string;
  label: string;
  ad_id: string;
  ad_name: string | null;
  metric: string;
  observed: number | null;
  threshold: number | null;
  window_days: number | null;
  context: Record<string, unknown> | null;
};

// Which breach speaks for an ad when several fire at once. Ordered by how
// irreversible the damage is, not by how alarming the number looks:
// untagged_spend leads because attribution missed while it is true can never be
// recovered, whereas an expensive ticket is merely money and is still measured.
const SEVERITY: Record<string, number> = {
  untagged_spend: 0,
  cost_per_ticket: 1,
  spend_without_lead: 2,
  spend_without_ticket: 3,
  frequency: 4,
  ctr: 5,
};

const rupees = (n: number) => `Rs.${Number(n).toLocaleString('en-IN')}`;

// One readable clause per metric. The rule's own `label` is deliberately NOT
// used here: it states the RULE ("cost per ticket above 40% of ticket price"),
// and what a notification needs is the OBSERVATION ("Rs.500 per ticket vs a
// Rs.180 ceiling"). Both sides of the comparison, because a bare number cannot
// be acted on without knowing what it was measured against.
function describe(b: Breach): string {
  const o = b.observed ?? 0;
  const t = b.threshold ?? 0;
  switch (b.metric) {
    case 'cost_per_ticket':
      return `${rupees(o)} per ticket vs a ${rupees(t)} ceiling`;
    case 'spend_without_ticket':
      return `${rupees(o)} spent, people started booking and nobody paid`;
    case 'spend_without_lead':
      return `${rupees(o)} spent, not one lead`;
    case 'frequency':
      return `the same people have seen it ${o} times`;
    case 'ctr':
      return `${o}% click-through, under the ${t}% floor`;
    case 'untagged_spend':
      return `${rupees(o)} spent but no tagged traffic — {{ad.id}} is missing`;
    default:
      return `${b.metric} ${o} vs ${t}`;
  }
}

async function runGuardrails(supabase: any) {
  const out = { breaches: 0, ads_notified: 0, failed: 0 };

  const { data, error } = await supabase.rpc('meta_ad_guardrail_breaches');
  if (error) {
    console.error('[meta-ads-alerts] guardrail evaluator failed:', error.message);
    return { ...out, error: error.message };
  }

  const breaches: Breach[] = Array.isArray(data) ? data : [];
  if (!breaches.length) return out;
  out.breaches = breaches.length;

  // GROUPED BY AD, not by rule. The 2026-09-08 dry run had one bad ad
  // legitimately trip three rules at once; three separate notifications about
  // one ad is how a founder learns to swipe them away without reading. One push
  // per ad, led by the most serious finding, with the rest counted.
  const byAd = new Map<string, Breach[]>();
  for (const b of breaches) {
    const list = byAd.get(b.ad_id) ?? [];
    list.push(b);
    byAd.set(b.ad_id, list);
  }

  for (const [adId, list] of byAd) {
    list.sort((x, y) => (SEVERITY[x.metric] ?? 99) - (SEVERITY[y.metric] ?? 99));
    const lead = list[0];
    const name = lead.ad_name ? `"${lead.ad_name}"` : `ad ${adId}`;
    const extra = list.length > 1 ? ` · +${list.length - 1} more` : '';
    const body = `${name}: ${describe(lead)}${extra}`.slice(0, 240);

    const { error: pushErr } = await supabase.rpc('notify_admin_push', {
      payload: {
        type: 'meta_ad_issue',
        record: {
          body,
          // Namespaced so a guardrail about an ad does not collapse onto a
          // WEBHOOK alert about the same ad — that path tags with the bare Meta
          // object id, and the two are different problems needing different
          // fixes. Also distinct from 'spend-sync' and 'ad-volume-*'.
          object_id: `guardrail-${adId}`,
        },
      },
    });
    if (pushErr) {
      console.error('[meta-ads-alerts] guardrail push failed:', pushErr.message);
      out.failed++;
    } else {
      out.ads_notified++;
    }

    // WRITTEN WHETHER OR NOT THE PUSH LANDED — and this is the opposite of how
    // the webhook half above handles a failed push, on purpose.
    //
    // A webhook event is a one-shot MESSAGE: if it is not delivered it is gone,
    // so that path leaves the row unhandled and retries. A guardrail breach is
    // DERIVED STATE, recomputed from live spend on every run — if the condition
    // is still true after the cooldown it will simply surface again by itself.
    // Nothing is lost by recording it now.
    //
    // Recording it is also what ARMS THE COOLDOWN: meta_ad_guardrail_breaches()
    // excludes any (rule, ad) with a row inside cooldown_hours. Skipping the
    // insert on push failure would therefore re-evaluate and re-push the same
    // breach every 15 minutes for as long as pushes stayed broken.
    //
    // One row PER RULE even though the push was per ad, so each rule keeps its
    // own independent cooldown and the panel history shows every finding rather
    // than only the one that happened to lead the notification.
    const rows = list.map((b) => ({
      rule_key: b.rule_key,
      label: b.label,
      ad_id: b.ad_id,
      ad_name: b.ad_name,
      metric: b.metric,
      observed: b.observed,
      threshold: b.threshold,
      window_days: b.window_days,
      context: b.context,
      // CAREFUL WITH THIS COLUMN'S NAME. notify_admin_push() posts to
      // send-admin-push FIRE-AND-FORGET via net.http_post, so pushErr is null
      // whenever the RPC was ACCEPTED — not when the notification was
      // delivered. A receiver that answers "unknown type" still reads as
      // success here. So notified_at means "queued without error", and the
      // real delivery evidence is net._http_response (see §8 of the handoff).
      notified_at: pushErr ? null : new Date().toISOString(),
      notify_error: pushErr ? pushErr.message.slice(0, 500) : null,
    }));

    const { error: insErr } = await supabase.from('meta_ad_guardrail_events').insert(rows);
    if (insErr) {
      // Loud: without this row the cooldown never arms and this ad will be
      // re-notified on the next run, and the one after that.
      console.error('[meta-ads-alerts] guardrail event insert FAILED — cooldown not armed:', insErr.message);
    }
  }

  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // ── Caller gate ───────────────────────────────────────────────────────────
  // This function is deployed --no-verify-jwt because pg_cron calls it with no
  // JWT, which until now meant anyone who learned the URL could invoke it. It
  // cannot forge data — every row it reads was HMAC-verified by
  // meta-ads-webhook — and it is idempotent, so a repeat run writes nothing
  // twice. But idempotence protects the DATA, not the QUOTA: each call makes
  // real Graph calls on META_ADS_ACCESS_TOKEN, and Meta answers sustained
  // abnormal traffic by cutting this ad account's API quota until a human
  // contacts support (error 613 with no subcode — see meta-ads-sync's
  // ABUSE_RATE_LIMIT_CODE). An open endpoint that spends Graph quota is the
  // most plausible way this account ever gets there.
  //
  // The secret lives in app_secrets rather than in a function secret because
  // the caller is Postgres, which cannot read function secrets — the same
  // reason notify_admin_push() has always injected X-Admin-Push-Secret from
  // that table. Both sides read this one row, so rotating it is a single
  // UPDATE with no deploy and no window where cron and function disagree.
  // 20260918_meta_ads_alerts_auth.sql carries the full reasoning.
  //
  // Plain !== rather than a constant-time compare, matching send-admin-push:
  // this is a 64-hex value behind network jitter, and the realistic attack is
  // someone finding the URL, not measuring microseconds.
  {
    const { data: secretRow, error: secretErr } = await supabase
      .from('app_secrets')
      .select('value')
      .eq('name', 'meta_alerts_secret')
      .maybeSingle();

    const expected = (secretRow?.value ?? '').trim();
    const provided = (req.headers.get('x-meta-alerts-secret') ?? '').trim();

    // Fail CLOSED on a missing or unreadable secret. A run that cannot check
    // who called it should not go on to spend Graph quota — and this function
    // can do no useful work without the database anyway, so refusing here
    // costs nothing a DB outage had not already cost.
    if (secretErr || !expected) {
      console.error(
        '[meta-ads-alerts] meta_alerts_secret missing or unreadable; refusing all traffic',
        secretErr?.message ?? '',
      );
      return new Response(JSON.stringify({ ok: false, error: 'not_configured' }), {
        status: 503, headers: { 'Content-Type': 'application/json' },
      });
    }
    if (provided !== expected) {
      console.warn('[meta-ads-alerts] rejected request with missing/wrong X-Meta-Alerts-Secret');
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const token = Deno.env.get('META_ADS_ACCESS_TOKEN') ?? '';

  const summary = { pushed: 0, suppressed: 0, informational: 0, failed: 0, scanned: 0 };

  try {
    // Oldest first: if several arrive at once, the founder reads them in the
    // order the problems actually happened.
    const { data: rows, error } = await supabase
      .from('meta_ads_events')
      .select('id, field, object_id, object_type, value, received_at')
      .is('handled_at', null)
      .in('field', ['with_issues_ad_objects', 'in_process_ad_objects'])
      .order('received_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('[meta-ads-alerts] inbox read failed:', error.message);
      return new Response(JSON.stringify({ ok: false, error: error.message }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    summary.scanned = rows?.length ?? 0;

    for (const row of rows ?? []) {
      const value: any = row.value ?? {};

      // ── Informational: finished publishing. Recorded, not announced. ───────
      if (row.field === 'in_process_ad_objects') {
        await supabase.from('meta_ads_events').update({
          handled_at: new Date().toISOString(),
          handled_note: `no action needed — ${row.object_type ?? 'object'} finished processing`
            + (value.status_name ? ` (${value.status_name})` : ''),
        }).eq('id', row.id);
        summary.informational++;
        continue;
      }

      // ── An issue. Suppress a repeat of the SAME problem on the SAME object. ─
      const errorCode = value.error_code != null ? String(value.error_code) : null;
      const since = new Date(Date.now() - REPEAT_SUPPRESSION_HOURS * 3600_000).toISOString();
      // The match has to include error_code, not just the object. Meta can
      // report a genuinely DIFFERENT problem on the same ad inside the same 6
      // hours — a rejection followed by a delivery block, say — and matching on
      // object_id alone would swallow the second one while the note claimed it
      // was a repeat. That is the failure mode where suppression stops being
      // noise control and starts hiding real problems.
      let recentQuery = supabase
        .from('meta_ads_events')
        .select('id')
        .eq('field', 'with_issues_ad_objects')
        .eq('object_id', row.object_id ?? '')
        .not('handled_at', 'is', null)
        .gte('handled_at', since)
        .like('handled_note', 'pushed%');

      // A missing code is its own bucket: two events that both lack one are the
      // same problem as far as we can tell, and `.eq(col, null)` does not match
      // nulls in PostgREST — it needs `.is()`.
      recentQuery = errorCode === null
        ? recentQuery.is('value->>error_code', null)
        : recentQuery.eq('value->>error_code', errorCode);

      const { data: recent } = await recentQuery.limit(1);

      if (recent && recent.length > 0) {
        await supabase.from('meta_ads_events').update({
          handled_at: new Date().toISOString(),
          handled_note: `suppressed — same object and code${errorCode ? ` (${errorCode})` : ''} already reported within ${REPEAT_SUPPRESSION_HOURS}h`,
        }).eq('id', row.id);
        summary.suppressed++;
        continue;
      }

      const ctx = token && row.object_id
        ? await pollContext(row.object_id, row.object_type ?? value.level ?? null, token)
        : { error: token ? 'no object id on the event' : 'META_ADS_ACCESS_TOKEN not set' };

      const label = ctx.name
        ? `${(row.object_type ?? 'object').toUpperCase()} "${ctx.name}"`
        : `${(row.object_type ?? 'object').toUpperCase()} ${row.object_id ?? '?'}`;
      const what = value.error_summary || value.error_message || 'Meta reported a problem';
      const reason = issueDetail(ctx.issues_info, errorCode) ?? firstReason(ctx.review_feedback);

      const body = [
        `${label}: ${what}`,
        errorCode ? `code ${errorCode}` : null,
        (ctx.effective_status ?? ctx.status) ? `now ${ctx.effective_status ?? ctx.status}` : null,
        reason,
      ].filter(Boolean).join(' · ').slice(0, 240);

      const { error: pushErr } = await supabase.rpc('notify_admin_push', {
        payload: {
          type: 'meta_ad_issue',
          record: { body, object_id: row.object_id, error_code: errorCode },
        },
      });

      if (pushErr) {
        // Left UNHANDLED on purpose so the next run retries. Re-alerting about a
        // real problem is the safe direction to fail in; silently swallowing a
        // rejected ad is not. The note records that it was attempted.
        await supabase.from('meta_ads_events').update({
          handled_note: `push failed: ${pushErr.message}`,
        }).eq('id', row.id);
        summary.failed++;
        continue;
      }

      await supabase.from('meta_ads_events').update({
        handled_at: new Date().toISOString(),
        handled_note: `pushed: ${body}${ctx.error ? ` [context poll failed — ${ctx.error}]` : ''}`,
      }).eq('id', row.id);
      summary.pushed++;
    }

    // Runs after the inbox is drained, and cannot fail this request. The two
    // halves are independent — a broken evaluator must not leave a rejected ad
    // unreported, and an unreadable inbox must not stop a runaway ad being
    // caught. Reported separately in the response for the same reason: one
    // number covering both would hide which half stopped working.
    let guardrails: Awaited<ReturnType<typeof runGuardrails>> | { error: string } = { error: 'not run' };
    try {
      guardrails = await runGuardrails(supabase);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[meta-ads-alerts] guardrails threw:', msg);
      guardrails = { error: msg };
    }

    console.log(`[meta-ads-alerts] ${JSON.stringify({ ...summary, guardrails })}`);
    return new Response(JSON.stringify({ ok: true, ...summary, guardrails }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[meta-ads-alerts] unexpected:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err), ...summary }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
});
