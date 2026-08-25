import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendLeadToMeta } from '../_shared/metaCapi.ts';

// capi-lead
//
// Reports a submitted application to Meta as a server-side Lead, alongside the
// browser's own Lead. Both carry the same event_id, so Meta counts one.
//
// WHY THIS EXISTS
// Invite-only events are optimised on Lead rather than Purchase, because payment
// there is a separate admin-gated step that lands much later — on
// anna-nagar-meetup, 48% of paid bookings completed more than 24 h after the
// application and 17% took over a week. The application is the conversion the ad
// actually produced. That makes Lead the number Meta bids against, so it has to
// be as complete as Purchase is.
//
// The browser alone cannot deliver that. Roughly half of visitors block
// fbevents.js, and their Lead never fires. This endpoint sits on our own domain,
// which an ad blocker has no reason to touch, so the same event still reaches
// Meta for exactly those people. They stay matchable too: _fbc is written by our
// own code (ensureFbcCookie in src/metaPixel.ts) before fbevents.js is even
// requested, so an ad-blocked visitor who clicked an ad still carries the click id.
//
// TWO MODES
//   browser  POST from the application form, moments after the row is inserted.
//            The fast path, and the only one that has the visitor's cookies.
//   sweep    ?sweep=1, from pg_cron. The backstop.
//
// WHY A BACKSTOP AND NOT A WEBHOOK
// Purchase gets three independent server-side paths because PayU is a separate
// company whose servers know a payment happened and can call us. A form
// submission has no such third party: the only actor is the visitor's browser,
// so there is nobody to webhook us. If that one call dies — tab closed,
// connection dropped, cold-start timeout — the row exists and Meta never hears
// about it, silently.
//
// Our database is the one server-side witness. The sweep is how it speaks: it
// finds applications still owed to Meta and reports them. Same shape as
// verify-pending-payments, for the same reason.

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allowlist instead of wildcard, mirroring create-payu-order.
const ALLOWED_ORIGIN = /^https:\/\/(?:[a-z0-9-]+\.)?chaptera\.in$|^https:\/\/chapter-[a-z0-9-]+\.vercel\.app$|^http:\/\/localhost:\d{4,5}$/;

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allow  = ALLOWED_ORIGIN.test(origin) ? origin : 'null';
  return {
    'Access-Control-Allow-Origin':  allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

// Same precedence as create-payu-order, kept identical on purpose.
function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
           ?? req.headers.get('cf-connecting-ip')
           ?? req.headers.get('x-real-ip')
           ?? 'unknown';
  return fwd.split(',')[0].trim();
}

async function checkRateLimit(
  supabase: any,
  kind: string,
  key: string,
  windowSeconds: number,
  maxRequests: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_kind: kind,
    p_key: key,
    p_window_seconds: windowSeconds,
    p_max_requests: maxRequests,
  });
  if (error) {
    console.error('[capi-lead] check_rate_limit error', error);
    return true; // fail-open on infra error — losing an ad event beats a 500
  }
  return data !== false;
}

// Mirrors FBP_PATTERN in src/metaPixel.ts. The optional final group is the
// appendix Meta's parameter-builder documentation appends (fb.1.<ts>.<id>.ABcDEFGh);
// without it a valid five-part cookie would be silently dropped.
const META_COOKIE = /^fb\.\d+\.\d+\.[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)?$/;

// Matches MAX_META_COOKIE_LEN in src/metaPixel.ts. An _fbc is a 19-character
// prefix plus an fbclid of whatever length Meta minted, and ours reach 187 —
// a 206-character cookie that the old 200 cap threw away, on exactly the
// visitors the click id exists to identify. _fbp is a fixed short shape, so it
// keeps its own tight ceiling.
const MAX_FBC_LEN = 512;
const MAX_FBP_LEN = 120;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The columns both modes need off an applications row.
const APP_FIELDS = 'lead_id, lead_reported_at, lead_user_agent, lead_fbp, lead_fbc, event_slug, phone, name, email, selected_city, attribution, created_at';

/**
 * Reports one application and, only on confirmed success, marks it done.
 *
 * The stamp is what stops the sweep re-sending forever. It is deliberately set
 * from the RETURN VALUE rather than optimistically: a rejected or uncounted
 * event leaves lead_reported_at null so the next sweep retries it, and the 24 h
 * window bounds how long that can go on.
 */
async function reportApplication(
  supabase: any,
  row: any,
  live: { fbp: string | null; fbc: string | null; ip: string | null; userAgent: string | null; sourceUrl: string | null },
  eventTitle: string | null,
): Promise<boolean> {
  const submittedMs = Date.parse(String(row?.created_at ?? ''));

  // Shape-check here rather than only at the caller, so BOTH paths are covered.
  // The sweep's values were written to the row by a browser and are therefore
  // just as untrusted as a request body — and a malformed cookie is worse than
  // no cookie, because Meta scores a supplied-but-unmatchable field against
  // match quality instead of ignoring it.
  const fbp = live.fbp && META_COOKIE.test(live.fbp) && live.fbp.length <= MAX_FBP_LEN ? live.fbp : null;
  const fbc = live.fbc && META_COOKIE.test(live.fbc) && live.fbc.length <= MAX_FBC_LEN ? live.fbc : null;

  const sent = await sendLeadToMeta({
    leadId: String(row.lead_id),
    eventSlug: row.event_slug ?? null,
    eventTitle,
    // Identity always comes from the row, never from a request body.
    phone: row.phone ?? null,
    email: row.email ?? null,
    name: row.name ?? null,
    city: row.selected_city ?? null,
    fbclid: row.attribution?.fbclid ?? null,
    fbclidSeenAt: row.attribution?.landed_at ?? null,
    fbp,
    fbc,
    clientIp: live.ip,
    userAgent: live.userAgent,
    sourceUrl: live.sourceUrl,
    // When the application was submitted, not when this call happened.
    eventTime: Number.isFinite(submittedMs) ? Math.floor(submittedMs / 1000) : null,
  });

  if (sent) {
    const { error } = await supabase
      .from('applications')
      .update({ lead_reported_at: new Date().toISOString() })
      .eq('event_slug', row.event_slug)
      .eq('phone', row.phone);
    if (error) {
      // Not fatal: the Lead reached Meta, and a re-send would carry the same
      // lead_id, which Meta deduplicates. Worth logging loudly though, because
      // it means this row will be retried on every sweep for 24 h.
      console.error('[capi-lead] reported but failed to stamp lead_reported_at', row.lead_id, error);
    }
  }
  return sent;
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const url = new URL(req.url);

  // ── Sweep mode ─────────────────────────────────────────────────────────────
  // Open, same posture as cart-abandonment and verify-pending-payments: pg_cron
  // calls it without a JWT, it returns only a count, and it is idempotent — a
  // reported row is stamped and never picked up again. The worst an unwanted
  // caller achieves is reporting Leads we already owed Meta.
  if (url.searchParams.get('sweep') === '1') {
    try {
      const now = Date.now();
      // Older than 10 min: give the browser path every chance to have done it.
      // Younger than 24 h: Meta's own guidance is that events delayed beyond a
      // day suffer badly on attribution and delivery, so past that a retry is
      // not worth having. It also bounds retries for a permanently failing row.
      const { data: rows, error } = await supabase
        .from('applications')
        .select(APP_FIELDS)
        .not('lead_id', 'is', null)
        .is('lead_reported_at', null)
        .lte('created_at', new Date(now - 10 * 60 * 1000).toISOString())
        .gte('created_at', new Date(now - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('[capi-lead] sweep query failed', error);
        return new Response(JSON.stringify({ ok: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      let recovered = 0, failed = 0;
      for (const row of rows ?? []) {
        // The user agent and both cookies were captured onto the row when the
        // application was inserted, precisely so this path is not sending an
        // event without client_user_agent — which Meta lists as required for
        // every website event.
        //
        // Only client_ip is genuinely unavailable: the applications INSERT goes
        // straight to PostgREST with no edge function to read headers from, and
        // a client-reported IP would be a value we cannot stand behind. That one
        // missing field is the honest cost of being a backstop.
        const okSent = await reportApplication(
          supabase, row,
          {
            fbp: (row as any).lead_fbp ?? null,
            fbc: (row as any).lead_fbc ?? null,
            ip: null,
            userAgent: (row as any).lead_user_agent ?? null,
            sourceUrl: null,
          },
          null,
        );
        okSent ? recovered++ : failed++;
      }

      if (recovered || failed) {
        console.log('[capi-lead] sweep done', JSON.stringify({ recovered, failed, scanned: (rows ?? []).length }));
      }
      return new Response(JSON.stringify({ ok: true, recovered, failed }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('[capi-lead] sweep failed', err);
      return new Response(JSON.stringify({ ok: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  }

  // ── Browser mode ───────────────────────────────────────────────────────────
  //
  // TRUST MODEL
  // Anon-callable, and it writes into the dataset that decides where ad money
  // goes — so it trusts the browser as little as possible:
  //
  //   * The client sends only what the server cannot know for itself: which row
  //     to look up, and the two Meta cookies.
  //   * Every identifying value is read from the applications row.
  //   * No Lead is reported unless a matching application actually exists.
  //   * IP and user-agent come from the request headers, which for this call are
  //     genuinely the customer's — a direct browser fetch, not a webhook.
  //
  // It always answers {ok:true}. Whether an application exists is not something
  // an unauthenticated caller should be able to probe, so success and every
  // rejection look identical from outside; the reasons go to the logs.
  const ok = () => new Response(
    JSON.stringify({ ok: true }),
    { headers: { ...cors, 'Content-Type': 'application/json' } },
  );

  try {
    if (req.method !== 'POST') return ok();

    const body = await req.json().catch(() => ({} as Record<string, unknown>));

    // The dedup key. Must be the exact string the browser passed to fbq as
    // eventID — a mismatch here does not lose the Lead, it doubles it.
    const leadId = String((body as any).leadId ?? '').trim();
    if (!UUID_RE.test(leadId)) {
      console.warn('[capi-lead] rejected: leadId is not a uuid');
      return ok();
    }

    const eventSlug = String((body as any).eventSlug ?? '').trim().toLowerCase().slice(0, 200);
    // Phones are stored as bare last-10-digits (CLAUDE.md), so normalise to that
    // shape before it is ever used as a lookup key or a rate-limit key.
    const phone = String((body as any).phone ?? '').replace(/\D/g, '').slice(-10);
    if (!eventSlug || phone.length !== 10) {
      console.warn('[capi-lead] rejected: missing event slug or malformed phone');
      return ok();
    }

    const ip = clientIp(req);

    // Two ceilings. The IP limit stops a script; the phone limit stops the same
    // applicant being replayed into Meta over and over with fresh uuids.
    //
    // Five per hour, not three: the worst an attacker achieves here is inflating
    // the Lead count for someone who genuinely applied, whereas a limit that
    // clips a real applicant costs the exact signal these campaigns bid on. One
    // person applying to two or three plans in a session is ordinary behaviour.
    if (!(await checkRateLimit(supabase, 'capi-lead:ip', ip, 60, 20))) {
      console.warn('[capi-lead] rate limited by ip');
      return ok();
    }
    if (!(await checkRateLimit(supabase, 'capi-lead:phone', phone, 3600, 5))) {
      console.warn('[capi-lead] rate limited by phone');
      return ok();
    }

    // THE GUARD: no application row, no Lead. Forging one therefore requires
    // actually creating an application, which is the real conversion anyway.
    // Service role is what makes this readable at all — anon has no SELECT on
    // applications (the PII lockdown).
    const { data: appRow } = await supabase
      .from('applications')
      .select(APP_FIELDS)
      .eq('event_slug', eventSlug)
      .eq('phone', phone)
      .maybeSingle();

    if (!appRow) {
      console.warn('[capi-lead] no matching application, Lead not reported', eventSlug);
      return ok();
    }
    if ((appRow as any).lead_reported_at) {
      // Already done — a double submit, or the sweep got there first.
      return ok();
    }

    // Trust the row's own lead_id when it has one, so the browser Lead, this
    // call and any later sweep all report the SAME id. Falling back to the
    // request's id covers rows inserted before this column existed.
    const rowLeadId = String((appRow as any).lead_id ?? '').trim();
    const effectiveId = UUID_RE.test(rowLeadId) ? rowLeadId : leadId;
    if (rowLeadId && rowLeadId !== leadId) {
      // Worth knowing about: it means the browser reported one id and the row
      // carries another, so the pixel event and this one will not deduplicate.
      console.warn('[capi-lead] lead_id mismatch between row and request', rowLeadId, leadId);
    }

    // event_source_url. Taken from the Referer rather than a client-supplied
    // string, and only kept when it is genuinely one of our own pages.
    const rawReferer = req.headers.get('referer') ?? '';
    const sourceUrl = /^https:\/\/(www\.)?chaptera\.in\//.test(rawReferer)
      ? rawReferer.slice(0, 512)
      : null;

    // The only two values the server genuinely cannot derive: they live in the
    // visitor's cookies. Shape-checked rather than trusted — a malformed value
    // is worse than none, because Meta scores a supplied-but-unmatchable field
    // against match quality instead of ignoring it.
    const rawFbp = String((body as any).fbp ?? '').trim();
    const rawFbc = String((body as any).fbc ?? '').trim();
    const fbp = META_COOKIE.test(rawFbp) && rawFbp.length <= MAX_FBP_LEN ? rawFbp : null;
    const fbc = META_COOKIE.test(rawFbc) && rawFbc.length <= MAX_FBC_LEN ? rawFbc : null;

    await reportApplication(
      supabase,
      { ...(appRow as any), lead_id: effectiveId },
      {
        fbp,
        fbc,
        ip: ip && ip !== 'unknown' ? ip : null,
        userAgent: req.headers.get('user-agent')?.slice(0, 512) ?? null,
        sourceUrl,
      },
      String((body as any).eventTitle ?? '').slice(0, 200) || null,
    );

    return ok();
  } catch (err) {
    // An ad event must never surface as an error to someone who just applied.
    console.error('[capi-lead] failed', err);
    return ok();
  }
});
