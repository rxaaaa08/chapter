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
    .select('slug, title, price_advance, price_full, is_active, invite_only, invite_slug, cities, city_details, payment_mode, booking_url, pay_at_venue, invite_spots, total_capacity')
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

function err(status: number, message: string, cors: Record<string, string>, extra?: Record<string, unknown>) {
  return new Response(JSON.stringify({ error: message, ...(extra ?? {}) }), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

// ── Multi-ticket (open + split + pay-at-venue ONLY) ─────────────────────────
// One WhatsApp number may buy up to MAX_TICKETS_PER_BOOKING seats, but ONLY on
// a pay-at-venue open event. That narrow gate is the founder's decision, and it
// is enforced here rather than in the UI because this function is anon-callable:
// a hand-crafted request naming any other event silently gets one ticket, never
// an error, so nothing about existing invite or single-payment flows can shift.
const MAX_TICKETS_PER_BOOKING = 5;

function isMultiTicketEvent(event: any): boolean {
  return event?.booking_url === 'payu-hosted'
      && event?.payment_mode === 'split'
      && event?.pay_at_venue === true;
}

// Floors, bounds and defaults an untrusted quantity to 1..max. Anything absent,
// fractional, negative or non-numeric collapses to 1 — the safe direction.
function clampTickets(raw: unknown, max: number): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, max);
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
    const checkOnly = body.check_only === true;

    // ── 1. Validate client inputs (do NOT trust amount / event_title) ──
    const name = sanitizeName(body.name);
    if (!name) return err(400, 'invalid name', cors);

    const phone = normalizePhone(body.phone);
    if (!phone) return err(400, 'invalid phone', cors);

    const rawSlug = String(body.event_slug ?? '').trim();
    if (!rawSlug) return err(400, 'missing event_slug', cors);

    // Preliminary type from the client; finalized after we resolve the event,
    // because a single-payment event overrides it to 'full' regardless of claim.
    let paymentType = body.payment_type === 'balance' ? 'balance' : 'advance';

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

    // Meta's _fbp browser cookie, handed over by the checkout page. Stored on
    // the payment row and replayed to the Conversions API by payu-callback /
    // payu-webhook — the server can never read this cookie itself, and those
    // two are the only paths that see a payment when the browser event doesn't
    // fire. Purely for ad match quality; nothing about the order depends on it.
    //
    // Shape-checked before it touches the DB: this endpoint is anon-callable,
    // so an unvalidated string here is a free write into our own table. A
    // malformed value is also worse than none — Meta scores a supplied-but-
    // unmatchable field against us rather than ignoring it.
    // The customer's own browser context, captured HERE because this is the only
    // moment we are called directly by it. payu-callback can read equivalent
    // headers (PayU's callback is a form POST rendered in the customer's
    // browser), but payu-webhook cannot — it is a server-to-server call, so its
    // headers describe PayU's machine. The webhook is the only path that reports
    // a sale when the customer never returns, so without this those events reach
    // Meta missing client_user_agent, which Meta lists as REQUIRED.
    // Reuses the clientIp() helper above rather than re-deriving it, so the
    // header precedence (x-forwarded-for, cf-connecting-ip, x-real-ip) stays in
    // one place. It returns 'unknown' when it finds nothing; store null instead,
    // because a literal "unknown" would be a supplied-but-unmatchable value.
    const ipRaw = clientIp(req);
    const customerIp = ipRaw && ipRaw !== 'unknown' ? ipRaw : null;
    const customerUserAgent = req.headers.get('user-agent')?.slice(0, 512) || null;

    // event_source_url for Meta. Taken from the Referer rather than trusting a
    // client-supplied string, and only kept when it is genuinely one of our own
    // pages — this endpoint is anon-callable.
    const rawReferer = req.headers.get('referer') ?? '';
    const sourceUrl = /^https:\/\/(www\.)?chaptera\.in\//.test(rawReferer)
      ? rawReferer.slice(0, 512)
      : null;

    // Mirrors FBP_PATTERN in src/metaPixel.ts — the optional final group is the
    // appendix Meta's parameter-builder documentation appends
    // (fb.1.<ts>.<id>.ABcDEFGh). Without it a valid five-part cookie would be
    // rejected here and silently stored as null.
    const META_COOKIE = /^fb\.\d+\.\d+\.[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)?$/;

    const rawFbp = String(body.fbp ?? '').trim();
    const fbp = META_COOKIE.test(rawFbp) && rawFbp.length <= 120 ? rawFbp : null;

    // Meta's click id as the browser recorded it. Preferred over rebuilding it
    // server-side, so both reports of one sale carry the same string. Same
    // shape-check; the cap is far looser because an fbclid is much longer than
    // an fbp id — 512, matching MAX_META_COOKIE_LEN in src/metaPixel.ts.
    //
    // Was 200, which is under the length of a real cookie for some of our own
    // traffic: `fb.1.<13-digit ms>.` is 19 characters and the longest fbclid in
    // applications.attribution is 187, for a 206-character total. Those rows
    // stored null and the sale was reported with a rebuilt click id instead of
    // the true one — the exact substitution this parameter exists to avoid.
    const rawFbc = String(body.fbc ?? '').trim();
    const fbc = META_COOKIE.test(rawFbc) && rawFbc.length <= 512 ? rawFbc : null;

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
    const rateKind = checkOnly ? 'check-open-booking' : 'create-payu';
    const ipLimit = checkOnly ? 20 : 10;
    const phoneLimit = checkOnly ? 10 : 5;
    if (!(await checkRateLimit(supabase, `${rateKind}:ip`, ip, 60, ipLimit))) {
      return err(429, 'rate limit exceeded (ip)', cors);
    }
    if (!(await checkRateLimit(supabase, `${rateKind}:phone`, phone, 3600, phoneLimit))) {
      return err(429, 'rate limit exceeded (phone)', cors);
    }

    // ── 3. Look up event server-side. Compute amount + productinfo from DB. ──
    const event = await resolveEvent(supabase, rawSlug);
    if (!event) return err(404, 'event not found', cors);
    if (!event.is_active) return err(409, 'event is not active', cors);

    // Single-payment events override the split advance/balance flow entirely:
    // one payment for the full price, status jumps straight to fully_paid. The
    // server decides this from the DB so a client can't downgrade a full-pay
    // event to a cheaper 'advance' charge.
    if (event.payment_mode === 'full') paymentType = 'full';

    // How many seats this order is for. Forced to 1 on every event shape that
    // is not open+split+pay-at-venue, so a client claiming otherwise is ignored
    // rather than rejected.
    const multiTicket = isMultiTicketEvent(event);
    const ticketCount = multiTicket
      ? clampTickets(body.ticket_count, MAX_TICKETS_PER_BOOKING)
      : 1;

    const canonicalSlug = event.slug as string;
    // Populated below when this phone+email previously submitted a doubt for
    // this exact open event. A matching doubt is an intentional alternate path
    // into /invite: it replaces OTP, even if Sales has not pressed Send Details.
    let matchingDoubt: any = null;

    // One open-event spot per WhatsApp number. Enforce this in the payment
    // function so a stale bill page or direct request cannot create a second
    // advance/full charge. A legitimate split-payment balance is still allowed.
    if (event.booking_url === 'payu-hosted' && paymentType !== 'balance') {
      const { data: paidApplication, error: paidApplicationError } = await supabase
        .from('applications')
        .select('id, ticket_count')
        .eq('event_slug', canonicalSlug)
        .eq('phone', phone)
        .in('status', ['advance_paid', 'fully_paid'])
        .maybeSingle();
      if (paidApplicationError) {
        console.error('[create-payu-order] paid application lookup failed', paidApplicationError);
        return err(500, 'could not verify booking status', cors);
      }
      // Hand the count back so the blocked screen can say "you've already booked
      // 3 tickets" rather than the generic one-spot message. There is no
      // self-serve top-up by decision; extra seats are handled by hand.
      if (paidApplication) {
        return err(409, 'already paid for this open event', cors, {
          ticket_count: Number((paidApplication as any).ticket_count ?? 1) || 1,
        });
      }
    }

    // ── Capacity gate for group buys ────────────────────────────────────────
    // A 4-seat order can overshoot a date that only had 2 left. The stepper is
    // already capped client-side; this is the copy an edited request can't skip.
    //
    // Runs BEFORE the check_only return on purpose, so the details form learns
    // the date is too full while the customer is still on it — rather than after
    // they have sat through an OTP. The date comes from the request on that
    // preflight (no booking row exists yet) and from the row itself by the time
    // a real order is placed.
    //
    // Deliberately NOT atomic: two simultaneous group buys can still tip a hot
    // date a few seats over, which is ops-resolvable. The atomic version is the
    // same FOR UPDATE reservation pattern used to harden OTP verify.
    //
    // Fails OPEN on missing data (no date, no configured capacity): before this
    // there was no gate at all, so an unknown must never start blocking sales.
    if (ticketCount > 1 && paymentType !== 'balance') {
      // total_capacity is what the customer's own calendar divides against, so
      // the server must agree with it or the stepper and the gate would disagree
      // about the same date. invite_spots is the older field and only a fallback.
      const perDateSpots = Number(event.total_capacity ?? event.invite_spots ?? 0);
      if (perDateSpots > 0) {
        let chosenDate = String(body.selected_date ?? '').trim().slice(0, 32) || null;
        if (!chosenDate) {
          const { data: appRow } = await supabase
            .from('applications')
            .select('selected_date')
            .eq('event_slug', canonicalSlug)
            .eq('phone', phone)
            .maybeSingle();
          chosenDate = (appRow as any)?.selected_date ?? null;
        }
        if (chosenDate) {
          const { data: dateCounts } = await supabase
            .rpc('event_booking_counts_by_date', { p_slug: canonicalSlug });
          const row = Array.isArray(dateCounts)
            ? dateCounts.find((d: any) => d.selected_date === chosenDate)
            : null;
          const reserved = Number(row?.reserved ?? 0);
          const left = perDateSpots - reserved;
          if (left < ticketCount) {
            return err(409, 'not enough spots left for that many tickets', cors, {
              spots_left: Math.max(0, left),
            });
          }
        }
      }
    }

    // Used by the open-event details form before it opens the bill. The actual
    // order request repeats the guard above to close the preflight race window.
    if (checkOnly) {
      return new Response(JSON.stringify({ can_checkout: true }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    // Normal open-event ticket purchases prove control of the entered contact
    // details with OTP. Two deliberate return paths may skip it: a prior PayU
    // order, or a matching event+phone+email doubt. Balance payments also remain
    // available without repeating verification.
    if (event.booking_url === 'payu-hosted' && paymentType !== 'balance') {
      // Recovery exemption: a customer whose earlier attempt FAILED is sent a
      // WhatsApp + email deeplink into the invite-style bill, which carries no
      // OTP session. They already proved control of this number on the ORIGINAL
      // attempt — create-payu-order writes a payu_payments row only AFTER the
      // OTP gate below, and that table is service-role-only (anon cannot forge
      // one). So a prior payu_payments row for this exact event + phone is
      // unforgeable proof of a completed verification; skip re-OTP for it.
      //   NB: an existing `applications` row is deliberately NOT accepted here —
      //   anon can self-INSERT a status='pending' row for any phone
      //   (applications_anon_insert policy), which would reopen the OTP bypass.
      const [
        { data: priorOrder, error: priorOrderError },
        { data: doubtRows, error: doubtRowsError },
      ] = await Promise.all([
        supabase
          .from('payu_payments')
          .select('txnid')
          .eq('event_slug', canonicalSlug)
          .eq('phone', phone)
          .limit(1)
          .maybeSingle(),
        supabase
          .from('doubt_submissions')
          .select('id, name, phone, email, gender, why_join, event_id, event_title, city, selected_date, meeting_spot, submitted_at')
          .eq('phone', phone)
          .order('submitted_at', { ascending: false })
          .limit(50),
      ]);
      if (priorOrderError) {
        console.error('[create-payu-order] prior order lookup failed', priorOrderError);
        return err(500, 'could not verify booking status', cors);
      }
      if (doubtRowsError) {
        console.error('[create-payu-order] doubt eligibility lookup failed', doubtRowsError);
        return err(500, 'could not verify booking status', cors);
      }

      const normalizedEmail = email.trim().toLowerCase();
      const normalizedTitle = String(event.title ?? '').trim().toLowerCase();
      matchingDoubt = (doubtRows ?? []).find((row: any) => {
        const doubtEmail = String(row.email ?? '').trim().toLowerCase();
        const doubtEventId = String(row.event_id ?? '').trim().toLowerCase();
        const doubtEventTitle = String(row.event_title ?? '').trim().toLowerCase();
        return doubtEmail === normalizedEmail
          && (doubtEventId === canonicalSlug.toLowerCase() || doubtEventTitle === normalizedTitle);
      }) ?? null;

      if (!priorOrder && !matchingDoubt) {
        // Normal open-event booking: no prior verified order and no matching
        // doubt, so require the existing fresh OTP session. A doubt-only buyer
        // is deliberately allowed through without waiting for Sales to act.
        const verificationToken = String(body.otp_session ?? '');
        if (!/^[a-f0-9]{64}$/.test(verificationToken)) {
          return err(403, 'OTP verification required before payment', cors);
        }
        const { data: otpSession, error: otpSessionError } = await supabase
          .from('open_event_otp_sessions')
          .select('event_slug, phone, email, expires_at, verified_at')
          .eq('verification_token', verificationToken)
          .maybeSingle();
        const sessionEmail = String((otpSession as any)?.email ?? '').trim().toLowerCase();
        if (
          otpSessionError ||
          !otpSession ||
          !otpSession.verified_at ||
          new Date(otpSession.expires_at).getTime() <= Date.now() ||
          otpSession.event_slug !== canonicalSlug ||
          otpSession.phone !== phone ||
          sessionEmail !== email.toLowerCase()
        ) {
          return err(403, 'OTP verification required before payment', cors);
        }
      }
    }
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
        // MUST stay validated against event.cities, exactly like body.selected_city
        // above. applications.selected_city is anon-writable — the
        // applications_anon_insert policy constrains only phone/name/event_slug/
        // why_join/status — so accepting it unvalidated let a customer name ANY key
        // in city_details (retired cities, leftover test entries) and be charged
        // that price instead of the live one.
        trustedCity = cityList.find(c => c.toLowerCase() === storedCity.toLowerCase()) ?? null;
      }
    }
    // A single-city event has exactly one correct price: the one the UI showed.
    // Without this, an untrusted city falls through to the plan-level price_full,
    // which on several events is a stale legacy value the customer never saw
    // (Kovalam's is 900 against a real Kovalam price of 299).
    if (!trustedCity && cityList.length === 1) trustedCity = cityList[0];
    const prices = cityPrices(event, trustedCity);

    // ── 4. Compute amount from DB based on payment_type ──
    let amountNum: number;
    // Heads the guest is paying the venue balance for. Stays null on advance /
    // full orders, where the quantity written to the payment row is ticketCount.
    let balanceAttendingCount: number | null = null;
    if (paymentType === 'full') {
      // Single-payment event: charge the full price in one shot (city-aware).
      const full = prices.full;
      if (full <= 0) return err(409, 'event price_full not configured', cors);
      amountNum = full * ticketCount;
      // Same invite-only authorization gate as the advance (first-payment) path.
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
    } else if (paymentType === 'balance') {
      // Balance = full price - advance already paid (both city-aware)
      const full = prices.full;
      const adv  = prices.advance;
      if (full <= 0) return err(409, 'event price_full not configured', cors);
      if (adv  <  0) return err(409, 'event price_advance not configured', cors);
      // Require that the user has actually paid the advance for this event
      const { data: app } = await supabase
        .from('applications')
        .select('id, status, ticket_count')
        .eq('event_slug', canonicalSlug)
        .eq('phone', phone)
        .maybeSingle();
      if (!app)                              return err(409, 'no application found for balance payment', cors);
      if (app.status !== 'advance_paid')     return err(409, 'advance not yet paid', cors);

      // Pay-at-venue: the guest settles the balance only for the people who
      // actually turned up, chosen on their own phone with the host watching.
      // The ceiling comes from the DB row, never from the client's claim about
      // how many it booked, so the worst a tampered request can do is pay for
      // FEWER heads than are present — which is the risk the host is there to
      // catch, not one this function can rule out.
      //
      // An absent attending_count means "everyone came": a bill page cached
      // from before multi-ticket shipped therefore charges the full amount,
      // which is the safe direction to be wrong in.
      const bookedTickets = Math.max(1, Number((app as any).ticket_count ?? 1) || 1);
      const attendingCount = body.attending_count === undefined || body.attending_count === null
        ? bookedTickets
        : clampTickets(body.attending_count, bookedTickets);

      amountNum = (full - adv) * attendingCount;
      if (amountNum <= 0) return err(409, 'computed balance is non-positive', cors);
      // Recorded on the payment row so payu-callback can stamp attended_count.
      balanceAttendingCount = attendingCount;
    } else {
      // Advance payment (city-aware)
      const adv = prices.advance;
      if (adv <= 0) return err(409, 'event price_advance not configured', cors);
      amountNum = adv * ticketCount;
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

    // A doubt-only buyer may not have an applications row yet because the old
    // flow created one only when Sales pressed Send Details. Preserve the
    // doubt's date/city/contact choices now so PayU callbacks, group links and
    // admin status all have the same canonical lead to update. This write is
    // service-role-only and never overwrites an existing application.
    if (matchingDoubt) {
      const { error: doubtAppError } = await supabase
        .from('applications')
        .upsert({
          event_slug: canonicalSlug,
          name: String(matchingDoubt.name ?? name).trim() || name,
          phone,
          email: String(matchingDoubt.email ?? customerEmail).trim() || null,
          gender: String(matchingDoubt.gender ?? ''),
          why_join: String(matchingDoubt.why_join ?? ''),
          status: 'pending',
          selected_date: matchingDoubt.selected_date ?? null,
          selected_city: matchingDoubt.city ?? trustedCity ?? null,
          pickup_label: matchingDoubt.meeting_spot ?? null,
        }, { onConflict: 'event_slug,phone', ignoreDuplicates: true });
      if (doubtAppError) {
        // Do not strand a willing payer because lead tracking failed. The PayU
        // callback has its own repair-upsert; log this so ops can investigate.
        console.error('[create-payu-order] could not create doubt application', doubtAppError);
      }
    }

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
      // What this payment covers: seats bought on an advance/full order, heads
      // present on a venue balance. payu-callback copies it onto the booking as
      // ticket_count or attended_count accordingly.
      quantity: balanceAttendingCount ?? ticketCount,
      // What this booking is WORTH, as opposed to what PayU is charging right
      // now. On a split booking those differ by design: we charge the ₹102
      // advance but the ad won a ₹299 ticket, and reporting the advance told
      // Meta every split sale had the same value — which is both a 3x
      // understatement and a constant, so value optimisation had nothing to
      // rank. Excludes PayU's fee: that is the customer's cost, not revenue.
      //
      // Decided HERE, once, because the browser Purchase and the server
      // Purchase both report this sale and Meta keeps only one of them. Two
      // separate calculations could disagree; one stored number cannot.
      //
      // Null on a balance payment — that half is never reported to Meta, so
      // there is no value to state.
      reported_value: paymentType === 'balance' ? null : prices.full * ticketCount,
      whatsapp_group_url: null, // never trust this from the client
      fbp,
      fbc,
      client_ip: customerIp,
      client_user_agent: customerUserAgent,
      source_url: sourceUrl,
    });
    if (insErr) {
      console.error('[create-payu-order] pending insert failed, aborting order', insErr);
      return err(500, 'could not create order, please try again', cors);
    }

    // Persist the payer's REAL email onto their application so the balance-payment
    // flow can pre-fill + lock it (otherwise they're re-asked for the email when
    // they return to pay the balance). Never the booking@ placeholder. Non-fatal —
    // a failure here must not block the order.
    if (customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      const { error: emailErr } = await supabase
        .from('applications')
        .update({ email: customerEmail })
        .eq('event_slug', canonicalSlug)
        .eq('phone', phone);
      if (emailErr) console.error('[create-payu-order] could not backfill applications.email', emailErr);
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
