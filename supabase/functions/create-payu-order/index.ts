import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Hashing ──────────────────────────────────────────────────────────────────

async function sha512(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── CORS ─────────────────────────────────────────────────────────────────────
// Allowlist instead of wildcard. Echoes the request Origin back only if it
// matches one of our known fronts. Untrusted origins get a CORS rejection
// and never reach the handler logic in the browser.
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

// ── Helpers ──────────────────────────────────────────────────────────────────

// Resolve any slug (real slug OR invite_slug) to the canonical events row.
async function resolveEvent(supabase: any, inputSlug: string) {
  if (!inputSlug) return null;
  const { data } = await supabase
    .from('events')
    .select('slug, title, price_advance, price_full, is_active, invite_only, invite_slug, cities, city_details')
    .or(`slug.eq.${inputSlug},invite_slug.eq.${inputSlug}`)
    .maybeSingle();
  return data ?? null;
}

// Picks the city-specific override from event.city_details if present, falls
// back to the plan-level price. City keys are matched case-insensitively
// because admin storage and customer selection can diverge in casing.
function cityPrices(event: any, trustedCity: string | null): { advance: number; full: number; matchedCity: string | null } {
  const planAdv  = Number(event?.price_advance ?? 0);
  const planFull = Number(event?.price_full    ?? 0);
  if (!trustedCity) return { advance: planAdv, full: planFull, matchedCity: null };
  const details: Record<string, any> = (event?.city_details && typeof event.city_details === 'object') ? event.city_details : {};
  const matchKey = Object.keys(details).find(k => k.toLowerCase() === trustedCity.toLowerCase()) ?? null;
  const override = matchKey ? details[matchKey] : null;
  const adv  = Number(override?.price_advance);
  const full = Number(override?.price_full);
  return {
    advance: adv  > 0 ? adv  : planAdv,
    full:    full > 0 ? full : planFull,
    matchedCity: matchKey ?? trustedCity,
  };
}

function normalizePhone(raw: any): string | null {
  const digits = String(raw ?? '').replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return null;
  return digits;
}

function sanitizeName(raw: any): string | null {
  const s = String(raw ?? '').trim();
  if (!s || s.length > 80) return null;
  // Strip pipe character — it'd break PayU's |-delimited hash field structure
  return s.replace(/\|/g, '');
}

function err(status: number, message: string, cors: Record<string, string>) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

// ── Payment-method fee table (server-side canonical source) ─────────────────
//
// Customers pay PayU's transaction fee on top of the base advance/balance.
// The fee rate depends on the method (credit card is dearer than UPI). The
// client sends preferred_method as a hint; the server looks up the rate and
// recomputes the total so a tampered client can't pay credit-card-rate via
// a UPI selection (or vice-versa). enforce_paymethod is also emitted from
// here for the same reason — keeps the picked method bound to the priced fee.
//
// Rates mirror App.tsx PAYMENT_METHOD_GROUPS. Keep in sync if either changes.
const FEE_RATES: Record<string, number> = {
  upi:        0.0242,
  debitcard:  0.0242,
  creditcard: 0.0367,
  netbanking: 0.0242,
  emi:        0.0367,
  cashcard:   0.0495,
  bnpl:       0.0242,
};

function applyMethodFee(baseAmount: number, preferredMethod: string | null): { total: number; rate: number; method: string | null } {
  if (!preferredMethod) return { total: baseAmount, rate: 0, method: null };
  const rate = FEE_RATES[preferredMethod];
  if (rate === undefined) return { total: baseAmount, rate: 0, method: null };
  // Match the client formula exactly so the figure shown on the bill matches
  // what PayU charges. Round to 2 decimals (paisa).
  const total = Math.round((baseAmount + baseAmount * rate) * 100) / 100;
  return { total, rate, method: preferredMethod };
}

// ── Rate limiting (H1) ───────────────────────────────────────────────────────
//
// Calls the check_rate_limit() RPC which atomically counts + inserts a row in
// public.rate_limits. Service-role JWT bypasses RLS so this just works.

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
    console.error('check_rate_limit error', error);
    return true; // fail-open on infra error
  }
  return data !== false;
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  // L4: GET /?probe=mode returns whether this deployment is pointed at
  // PayU's test or live gateway. Used by AdminPanel to render a banner —
  // no auth needed since the answer is derivable from the redirect URL
  // any browser ends up at anyway.
  if (req.method === 'GET') {
    const url = new URL(req.url);
    if (url.searchParams.get('probe') === 'mode') {
      const base = Deno.env.get('PAYU_BASE_URL') ?? 'https://test.payu.in/_payment';
      const mode = base.includes('secure.payu.in') ? 'live'
                 : base.includes('test.payu.in')   ? 'test'
                 : 'unknown';
      const configured = !!(Deno.env.get('PAYU_MERCHANT_KEY') && Deno.env.get('PAYU_MERCHANT_SALT'));
      return new Response(JSON.stringify({ mode, configured }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors },
      });
    }
    // Server-canonical fee table. The bill page calls this on mount so its
    // displayed fee % always matches what the server will actually charge.
    // Without this, the client had a parallel rate table that could drift.
    if (url.searchParams.get('probe') === 'fees') {
      return new Response(JSON.stringify({ rates: FEE_RATES }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...cors },
      });
    }
    return err(405, 'method not allowed', cors);
  }

  if (req.method !== 'POST')    return err(405, 'method not allowed', cors);

  try {
    const body = await req.json().catch(() => ({}));

    // ── 1. Validate client inputs (do NOT trust amount / event_title) ──
    const name = sanitizeName(body.name);
    if (!name) return err(400, 'invalid name', cors);

    const phone = normalizePhone(body.phone);
    if (!phone) return err(400, 'invalid phone', cors);

    const rawSlug = String(body.event_slug ?? '').trim();
    if (!rawSlug) return err(400, 'missing event_slug', cors);

    const paymentType = body.payment_type === 'balance' ? 'balance' : 'advance';

    // Email is optional and only used for PayU receipts — sanity check it
    const customerEmail = String(body.email ?? '').trim();
    const email = (customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))
      ? customerEmail
      : 'booking@chaptera.in';

    // trip_date is informational only (stored on payu_payments)
    const tripDate = body.trip_date ? String(body.trip_date).slice(0, 32) : null;

    // Preferred payment method (optional). When provided + valid, the server
    // charges the corresponding fee on top of the base price and binds the
    // PayU page to that method (enforce_paymethod). When omitted, customer
    // pays the base price (legacy behaviour for flows without a method picker).
    const rawPreferredMethod = String(body.preferred_method ?? '').toLowerCase().trim();
    const preferredMethod = rawPreferredMethod && FEE_RATES[rawPreferredMethod] !== undefined
      ? rawPreferredMethod
      : null;

    // ── 2. Init Supabase ──
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ── 2a. Rate limiting (H1): 10/min/IP, 5/hour/phone ──
    // Cap the IP rate to absorb a botnet hammer; cap per-phone to stop a
    // single user (or a stolen invite_slug being shared) from creating
    // dozens of pending payu_payments rows that we then have to clean up.
    const ip = clientIp(req);
    if (!(await checkRateLimit(supabase, 'create-payu:ip', ip, 60, 10))) {
      return err(429, 'rate limit exceeded (ip)', cors);
    }
    if (!(await checkRateLimit(supabase, 'create-payu:phone', phone, 3600, 5))) {
      return err(429, 'rate limit exceeded (phone)', cors);
    }

    // ── 3. Look up event server-side. Compute amount + productinfo from DB. ──
    const event = await resolveEvent(supabase, rawSlug);
    if (!event) return err(404, 'event not found', cors);
    if (!event.is_active) return err(409, 'event is not active', cors);

    const canonicalSlug = event.slug as string;
    // Strip the pipe char before productinfo enters the |-delimited PayU hash
    // string. A title containing '|' would inject an extra delimiter and break
    // hash validation for that transaction (same reason sanitizeName strips it
    // from the customer name). Pipes in plan titles are rare but would silently
    // fail the payment, so we defuse it here.
    const productinfo   = String(event.title ?? '').replace(/\|/g, ' ').trim();

    // ── 3a. Resolve TRUSTED city for city-specific pricing ──
    // Each event has plan-level price_advance/price_full, which serve as the
    // default. event.city_details = { [city]: { price_advance, price_full } }
    // holds optional per-city overrides (e.g. Pondy = ₹1,600 advance while
    // Chennai uses the plan default ₹2,600). Server must pick the right one;
    // otherwise the client UI's correct per-city price doesn't match what we
    // actually charge.
    //
    // Trust order:
    //   1. body.selected_city  — what the client just told us. Validated
    //      against event.cities so a customer can't claim a city the event
    //      doesn't list (and pay the wrong price).
    //   2. applications.selected_city — server-trusted, persisted at apply
    //      time. Used as fallback / cross-check, especially for retry-bill
    //      where the client doesn't have selected_city handy.
    //
    // No trusted city → fall back to plan defaults. Same behaviour as before.
    const cityList: string[] = Array.isArray(event.cities) ? event.cities.map((c: any) => String(c)) : [];
    let trustedCity: string | null = null;
    const claimedCity = String(body.selected_city ?? '').trim();
    if (claimedCity && cityList.some(c => c.toLowerCase() === claimedCity.toLowerCase())) {
      trustedCity = cityList.find(c => c.toLowerCase() === claimedCity.toLowerCase()) ?? claimedCity;
    }
    if (!trustedCity) {
      const { data: appCityRow } = await supabase
        .from('applications')
        .select('selected_city')
        .eq('phone', phone)
        .eq('event_slug', canonicalSlug)
        .maybeSingle();
      const storedCity = String((appCityRow as any)?.selected_city ?? '').trim();
      if (storedCity) {
        trustedCity = cityList.find(c => c.toLowerCase() === storedCity.toLowerCase()) ?? storedCity;
      }
    }
    const prices = cityPrices(event, trustedCity);

    // ── 4. Compute amount from DB based on payment_type ──
    let amountNum: number;
    if (paymentType === 'balance') {
      // Balance = full price - advance already paid (both city-aware)
      const full = prices.full;
      const adv  = prices.advance;
      if (full <= 0) return err(409, 'event price_full not configured', cors);
      if (adv  <  0) return err(409, 'event price_advance not configured', cors);
      // Require that the user has actually paid the advance for this event
      const { data: app } = await supabase
        .from('applications')
        .select('id, status')
        .eq('event_slug', canonicalSlug)
        .eq('phone', phone)
        .maybeSingle();
      if (!app)                              return err(409, 'no application found for balance payment', cors);
      if (app.status !== 'advance_paid')     return err(409, 'advance not yet paid', cors);
      amountNum = full - adv;
      if (amountNum <= 0) return err(409, 'computed balance is non-positive', cors);
    } else {
      // Advance payment (city-aware)
      const adv = prices.advance;
      if (adv <= 0) return err(409, 'event price_advance not configured', cors);
      amountNum = adv;
      // For invite-only events: require the phone to be authorized through
      // EITHER the bulk-invited list OR a per-application approval from the
      // admin panel. The two tables represent two valid ways admins grant
      // access — bulk uploading a phone list (invited_numbers) vs accepting
      // an individual application (applications.status flips to 'invited').
      // Before this we only checked invited_numbers, which silently broke
      // payment for every customer approved via the per-application flow.
      if (event.invite_only) {
        const [{ data: invited }, { data: approvedApp }] = await Promise.all([
          supabase
            .from('invited_numbers')
            .select('phone')
            .eq('phone', phone)
            .eq('event_slug', canonicalSlug)
            .maybeSingle(),
          supabase
            .from('applications')
            .select('id')
            .eq('phone', phone)
            .eq('event_slug', canonicalSlug)
            .in('status', ['invited', 'advance_paid', 'fully_paid'])
            .maybeSingle(),
        ]);
        if (!invited && !approvedApp) return err(403, 'phone not invited for this event', cors);
      }
    }

    // ── 4b. Apply PayU transaction fee on top of base amount ──
    // The customer pays the base (price_advance / balance) PLUS PayU's cut
    // for the chosen method, so the merchant nets the base price. Without
    // a preferred_method this is a no-op (legacy behaviour).
    const baseAmount = amountNum;
    const feeResult  = applyMethodFee(baseAmount, preferredMethod);
    amountNum = feeResult.total;

    // ── 5. Build PayU fields with server-computed values only ──
    const PAYU_MERCHANT_KEY  = Deno.env.get('PAYU_MERCHANT_KEY');
    const PAYU_MERCHANT_SALT = Deno.env.get('PAYU_MERCHANT_SALT');
    const PAYU_BASE_URL      = Deno.env.get('PAYU_BASE_URL') ?? 'https://test.payu.in/_payment';
    if (!PAYU_MERCHANT_KEY || !PAYU_MERCHANT_SALT) return err(500, 'payu not configured', cors);

    const txnid     = `CHA${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const firstname = name.split(' ')[0];
    const amountStr = amountNum.toFixed(2);

    // PayU hash format: key|txnid|amount|productinfo|firstname|email|udf1..udf5|||||||salt
    const hashString = `${PAYU_MERCHANT_KEY}|${txnid}|${amountStr}|${productinfo}|${firstname}|${email}|||||||||||${PAYU_MERCHANT_SALT}`;
    const hash       = await sha512(hashString);

    // ── 6. Insert pending payu_payments row with server-trusted amount ──
    // Must happen BEFORE we hand PayU fields to the browser. If it fails we abort
    // the order: a payment with no DB row is invisible to the reconciliation cron
    // (it can only see rows), so we never let a payment reach PayU unrecorded.
    const { error: insErr } = await supabase.from('payu_payments').insert({
      txnid,
      event_id: null,
      event_slug: canonicalSlug,
      event_title: productinfo,
      amount: amountNum,
      name,
      phone,
      email,
      trip_date: tripDate,
      status: 'pending',
      payment_type: paymentType,
      whatsapp_group_url: null, // never trust this from the client
    });
    if (insErr) {
      console.error('[create-payu-order] pending insert failed, aborting order', insErr);
      return err(500, 'could not create order, please try again', cors);
    }

    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/payu-callback`;

    // enforce_paymethod is emitted server-side (when a method was picked) so
    // a tampered DOM can't change which method PayU shows after the fee was
    // priced in. enforce_paymethod is NOT in the request hash per PayU's
    // spec, so appending it to fields doesn't break verification.
    const fields: Record<string, string> = {
      key: PAYU_MERCHANT_KEY,
      txnid,
      amount: amountStr,
      productinfo,
      firstname,
      email,
      phone,
      surl: callbackUrl,
      furl: callbackUrl,
      hash,
    };
    if (feeResult.method) fields.enforce_paymethod = feeResult.method;

    return new Response(JSON.stringify({
      payu_url: PAYU_BASE_URL,
      base_amount:  baseAmount.toFixed(2),
      fee_amount:   (amountNum - baseAmount).toFixed(2),
      total_amount: amountStr,
      fields,
    }), { headers: { 'Content-Type': 'application/json', ...cors } });
  } catch (e) {
    console.error('create-payu-order error:', e);
    return err(500, 'internal error', cors);
  }
});
