import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Hashing ──────────────────────────────────────────────────────────────────

async function sha512(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── CORS ─────────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

// Resolve any slug (real slug OR invite_slug) to the canonical events row.
async function resolveEvent(supabase: any, inputSlug: string) {
  if (!inputSlug) return null;
  const { data } = await supabase
    .from('events')
    .select('slug, title, price_advance, price_full, is_active, invite_only, invite_slug')
    .or(`slug.eq.${inputSlug},invite_slug.eq.${inputSlug}`)
    .maybeSingle();
  return data ?? null;
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

function err(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST')    return err(405, 'method not allowed');

  try {
    const body = await req.json().catch(() => ({}));

    // ── 1. Validate client inputs (do NOT trust amount / event_title) ──
    const name = sanitizeName(body.name);
    if (!name) return err(400, 'invalid name');

    const phone = normalizePhone(body.phone);
    if (!phone) return err(400, 'invalid phone');

    const rawSlug = String(body.event_slug ?? '').trim();
    if (!rawSlug) return err(400, 'missing event_slug');

    const paymentType = body.payment_type === 'balance' ? 'balance' : 'advance';

    // Email is optional and only used for PayU receipts — sanity check it
    const customerEmail = String(body.email ?? '').trim();
    const email = (customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))
      ? customerEmail
      : 'booking@chaptera.in';

    // trip_date is informational only (stored on payu_payments)
    const tripDate = body.trip_date ? String(body.trip_date).slice(0, 32) : null;

    // ── 2. Init Supabase ──
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ── 3. Look up event server-side. Compute amount + productinfo from DB. ──
    const event = await resolveEvent(supabase, rawSlug);
    if (!event) return err(404, 'event not found');
    if (!event.is_active) return err(409, 'event is not active');

    const canonicalSlug = event.slug as string;
    const productinfo   = event.title as string;

    // ── 4. Compute amount from DB based on payment_type ──
    let amountNum: number;
    if (paymentType === 'balance') {
      // Balance = full price - advance already paid
      const full = Number(event.price_full ?? 0);
      const adv  = Number(event.price_advance ?? 0);
      if (full <= 0) return err(409, 'event price_full not configured');
      if (adv  <  0) return err(409, 'event price_advance not configured');
      // Require that the user has actually paid the advance for this event
      const { data: app } = await supabase
        .from('applications')
        .select('id, status')
        .eq('event_slug', canonicalSlug)
        .eq('phone', phone)
        .maybeSingle();
      if (!app)                              return err(409, 'no application found for balance payment');
      if (app.status !== 'advance_paid')     return err(409, 'advance not yet paid');
      amountNum = full - adv;
      if (amountNum <= 0) return err(409, 'computed balance is non-positive');
    } else {
      // Advance payment
      const adv = Number(event.price_advance ?? 0);
      if (adv <= 0) return err(409, 'event price_advance not configured');
      amountNum = adv;
      // For invite-only events: require the phone to be in invited_numbers
      if (event.invite_only) {
        const { data: invited } = await supabase
          .from('invited_numbers')
          .select('phone')
          .eq('phone', phone)
          .eq('event_slug', canonicalSlug)
          .maybeSingle();
        if (!invited) return err(403, 'phone not invited for this event');
      }
    }

    // ── 5. Build PayU fields with server-computed values only ──
    const PAYU_MERCHANT_KEY  = Deno.env.get('PAYU_MERCHANT_KEY');
    const PAYU_MERCHANT_SALT = Deno.env.get('PAYU_MERCHANT_SALT');
    const PAYU_BASE_URL      = Deno.env.get('PAYU_BASE_URL') ?? 'https://test.payu.in/_payment';
    if (!PAYU_MERCHANT_KEY || !PAYU_MERCHANT_SALT) return err(500, 'payu not configured');

    const txnid     = `CHA${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const firstname = name.split(' ')[0];
    const amountStr = amountNum.toFixed(2);

    // PayU hash format: key|txnid|amount|productinfo|firstname|email|udf1..udf5|||||||salt
    const hashString = `${PAYU_MERCHANT_KEY}|${txnid}|${amountStr}|${productinfo}|${firstname}|${email}|||||||||||${PAYU_MERCHANT_SALT}`;
    const hash       = await sha512(hashString);

    // ── 6. Insert pending payu_payments row with server-trusted amount ──
    await supabase.from('payu_payments').insert({
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

    const callbackUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/payu-callback`;

    return new Response(JSON.stringify({
      payu_url: PAYU_BASE_URL,
      fields: {
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
      },
    }), { headers: { 'Content-Type': 'application/json', ...CORS } });
  } catch (e) {
    console.error('create-payu-order error:', e);
    return err(500, 'internal error');
  }
});
