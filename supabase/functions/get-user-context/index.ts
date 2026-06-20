// get-user-context
//
// Anon-callable endpoint that returns a phone's known state on chaptera:
//   - invites: { event_slug, city }[] — rows in invited_numbers for this phone
//   - applications: { event_slug, status, email, pickup_point_id, selected_city,
//                     selected_date }[] — rows in applications for this phone
//   - invite_submissions: { invite_slug, status }[] — legacy payment-status source
//   - payment: { ... } | null       — if txnid was passed AND the stored phone
//                                     on payu_payments matches the request phone
//
// Why this exists: src/supabase.ts has RLS that denies anon SELECT on these
// tables (a good thing — they hold PII). But the booking site needs to show
// "your invites" and "your receipt" to the user typing/owning that phone. So
// we expose a server-side wrapper that uses service_role to bypass RLS, but
// only returns rows tied to the phone the caller submitted. Anyone enumerating
// can only see data they already specified the phone for, and rate limiting
// caps the blast radius.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

function normalizePhone(raw: any): string | null {
  const digits = String(raw ?? '').replace(/\D/g, '').slice(-10);
  return digits.length === 10 ? digits : null;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
           ?? req.headers.get('cf-connecting-ip')
           ?? req.headers.get('x-real-ip')
           ?? 'unknown';
  return fwd.split(',')[0].trim();
}

function json(status: number, payload: any, cors: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors },
  });
}

async function checkRateLimit(
  supabase: any,
  kind: string,
  key: string,
  windowSeconds: number,
  maxRequests: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_kind: kind, p_key: key, p_window_seconds: windowSeconds, p_max_requests: maxRequests,
  });
  if (error) { console.error('check_rate_limit error', error); return true; }
  return data !== false;
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST')    return json(405, { error: 'method not allowed' }, cors);

  try {
    const body = await req.json().catch(() => ({}));
    const phone = normalizePhone(body.phone);
    const txnid = body.txnid ? String(body.txnid).trim().slice(0, 80) : null;

    if (!phone) return json(400, { error: 'invalid phone' }, cors);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Rate limit — same shape as create-payu-order's checks, slightly looser
    // because users may legitimately re-type their phone a few times.
    const ip = clientIp(req);
    if (!(await checkRateLimit(supabase, 'get-user-context:ip', ip, 60, 30))) {
      return json(429, { error: 'rate limit exceeded' }, cors);
    }
    // 120/hr per phone — generous enough for the receipt page's pending-payment
    // poll (every 4s for ~2.5 min) plus normal context lookups. Enumeration is
    // capped by the per-IP limit above (30/min), not this per-phone one.
    if (!(await checkRateLimit(supabase, 'get-user-context:phone', phone, 3600, 120))) {
      return json(429, { error: 'rate limit exceeded' }, cors);
    }

    // All three queries run in parallel — independent.
    const [
      { data: invites },
      { data: applications },
      { data: inviteSubmissions },
    ] = await Promise.all([
      supabase
        .from('invited_numbers')
        .select('event_slug, city')
        .eq('phone', phone),
      supabase
        .from('applications')
        .select('event_slug, status, email, pickup_point_id, selected_city, selected_date')
        .eq('phone', phone),
      supabase
        .from('invite_payment_submissions')
        .select('invite_slug, status')
        .eq('phone', phone)
        .order('submitted_at', { ascending: false }),
    ]);

    // Optional receipt lookup. We cross-check the phone on payu_payments so
    // a caller can't view someone else's receipt by guessing/scraping txnids.
    let payment: any = null;
    if (txnid) {
      const { data: p } = await supabase
        .from('payu_payments')
        .select('txnid, name, phone, email, amount, event_slug, event_title, status, payment_type, mihpayid, trip_date, created_at')
        .eq('txnid', txnid)
        .maybeSingle();
      if (p && p.phone === phone) payment = p;
      // If txnid exists but phone doesn't match: silently return null. Don't
      // leak whether the txnid exists or who it belongs to.
    }

    return json(200, {
      invites:            invites           ?? [],
      applications:       applications      ?? [],
      invite_submissions: inviteSubmissions ?? [],
      payment,
    }, cors);
  } catch (err) {
    console.error('get-user-context error:', err);
    return json(500, { error: 'internal error' }, cors);
  }
});
