import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Hashing ──────────────────────────────────────────────────────────────────

async function sha512(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const FRONTEND_URL = Deno.env.get('FRONTEND_URL') ?? 'https://chaptera.in';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDueDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return '';
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const day = d.getDate();
  const s = ['th', 'st', 'nd', 'rd'], v = day % 100;
  const suffix = (s[(v - 20) % 10] || s[v] || s[0]);
  return `${month} ${day}${suffix}`;
}

async function resolveCanonicalSlug(supabase: any, inputSlug: string): Promise<string> {
  if (!inputSlug) return inputSlug;
  const { data } = await supabase
    .from('events')
    .select('slug')
    .or(`slug.eq.${inputSlug},invite_slug.eq.${inputSlug}`)
    .maybeSingle();
  return data?.slug ?? inputSlug;
}

// ── AiSensy WhatsApp ─────────────────────────────────────────────────────────

const AISENSY_CAMPAIGN_ADVANCE = 'advance_paid+balance';
const AISENSY_CAMPAIGN_FAILED  = 'payment_failed';

async function fireAdvancePaidWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) {
    console.warn('[aisensy advance_paid] AISENSY_API_KEY not set, skipping');
    return;
  }
  try {
    const { data: app } = await supabase
      .from('applications')
      .select('id, name, aisensy_advance_paid_sent')
      .eq('phone', args.phone)
      .eq('event_slug', args.eventSlug)
      .maybeSingle();
    if (!app || app.aisensy_advance_paid_sent) return;

    const { data: ev } = await supabase
      .from('events')
      .select('booking_steps')
      .eq('slug', args.eventSlug)
      .maybeSingle();
    const balStep = (ev?.booking_steps ?? []).find((s: any) =>
      /balance/i.test(`${s.label ?? ''} ${s.value ?? ''}`)
    );
    const dueFinal = formatDueDate(balStep?.date ?? '');

    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: AISENSY_CAMPAIGN_ADVANCE,
        destination: '91' + args.phone,
        userName: app.name || 'chapter A 3063',
        templateParams: [
          `₹${Number(args.amount).toLocaleString('en-IN')}`,
          dueFinal,
          args.txnid,
        ],
        source: 'payu-callback',
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {
          event_slug: args.eventSlug,
          txn_id: args.txnid,
          amount: String(args.amount),
        },
        paramsFallbackValue: { FirstName: app.name || 'user' },
      }),
    });

    if (aiRes.ok) {
      await supabase
        .from('applications')
        .update({ aisensy_advance_paid_sent: true })
        .eq('id', app.id);
    }
  } catch (err) {
    console.error('[aisensy advance_paid] fire failed:', err);
  }
}

async function firePaymentFailedWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) return;
  try {
    const { data: app } = await supabase
      .from('applications')
      .select('id, name, aisensy_payment_failed_sent')
      .eq('phone', args.phone)
      .eq('event_slug', args.eventSlug)
      .maybeSingle();
    if (!app || app.aisensy_payment_failed_sent) return;

    const amountNum = Number(args.amount);
    const formattedAmount = amountNum % 1 === 0
      ? `₹${amountNum.toLocaleString('en-IN')}`
      : `₹${amountNum.toFixed(2)}`;

    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: AISENSY_CAMPAIGN_FAILED,
        destination: '91' + args.phone,
        userName: app.name || 'chapter A 3063',
        templateParams: [app.name || 'there', formattedAmount],
        source: 'payu-callback',
        media: {}, buttons: [], carouselCards: [], location: {},
        attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
        paramsFallbackValue: { FirstName: app.name || 'user' },
      }),
    });

    if (aiRes.ok) {
      await supabase
        .from('applications')
        .update({ aisensy_payment_failed_sent: true })
        .eq('id', app.id);
    }
  } catch (err) {
    console.error('[aisensy payment_failed] fire failed:', err);
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  let txnidForCatch = '';
  try {
    const PAYU_MERCHANT_KEY  = Deno.env.get('PAYU_MERCHANT_KEY');
    const PAYU_MERCHANT_SALT = Deno.env.get('PAYU_MERCHANT_SALT');
    if (!PAYU_MERCHANT_KEY || !PAYU_MERCHANT_SALT) {
      return Response.redirect(`${FRONTEND_URL}/invite?payment_status=failed`, 302);
    }

    const formData = await req.formData();
    const p = Object.fromEntries(formData.entries()) as Record<string, string>;

    const { status, txnid, amount, productinfo, firstname, email,
            udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '',
            hash: receivedHash, mihpayid = '' } = p;
    txnidForCatch = txnid ?? '';

    if (!txnid || !status || !amount || !receivedHash) {
      console.warn('[payu-callback] missing required fields');
      return Response.redirect(`${FRONTEND_URL}/invite?payment_status=failed`, 302);
    }

    // ── 1. Verify hash ──
    //
    // PayU reverse hash format (per docs):
    //   sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    //
    // The five empty fields between status and udf5 correspond to udf10..udf6
    // (PayU's response includes them even though the request never sent any).
    // Previous version omitted them and silently failed every hash check.
    //
    // If PayU surfaces an additionalCharges field on a transaction, it gets
    // prepended to the same string. Our current event prices never trigger
    // this but it's cheap to support both shapes.
    const additionalCharges = (p.additionalCharges ?? '').toString();
    const baseReverse =
      `${PAYU_MERCHANT_SALT}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_MERCHANT_KEY}`;
    const reverseStr = additionalCharges
      ? `${additionalCharges}|${baseReverse}`
      : baseReverse;
    const calculatedHash = await sha512(reverseStr);
    const hashMatches = calculatedHash === receivedHash;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (!hashMatches) {
      console.error('[payu-callback] HASH MISMATCH — rejecting', { txnid, mihpayid });
      // Log the attempt but do NOT update any application status
      await supabase.from('payu_payments').update({
        payu_response: { ...p, _hash_matches: false, _rejected: 'hash_mismatch' },
      }).eq('txnid', txnid);
      return Response.redirect(`${FRONTEND_URL}/invite?payment_status=failed&txnid=${encodeURIComponent(txnid)}`, 302);
    }

    // ── 2. Verify amount matches what we stored ──
    const { data: stored } = await supabase
      .from('payu_payments')
      .select('event_slug, phone, payment_type, event_title, amount')
      .eq('txnid', txnid)
      .maybeSingle();

    if (!stored) {
      console.error('[payu-callback] unknown txnid', txnid);
      return Response.redirect(`${FRONTEND_URL}/invite?payment_status=failed&txnid=${encodeURIComponent(txnid)}`, 302);
    }

    const reportedAmount = Number(amount);
    const expectedAmount = Number(stored.amount);
    // Allow 1-paisa rounding tolerance
    if (Math.abs(reportedAmount - expectedAmount) > 0.01) {
      console.error('[payu-callback] AMOUNT MISMATCH — rejecting', { txnid, reportedAmount, expectedAmount });
      await supabase.from('payu_payments').update({
        payu_response: { ...p, _hash_matches: true, _rejected: 'amount_mismatch', _expected: expectedAmount },
      }).eq('txnid', txnid);
      return Response.redirect(`${FRONTEND_URL}/invite?payment_status=failed&txnid=${encodeURIComponent(txnid)}`, 302);
    }

    // ── 3. Hash + amount both OK, proceed ──
    const dbStatus = status === 'success' ? 'success' : 'failure';

    await supabase.from('payu_payments').update({
      status: dbStatus,
      mihpayid: mihpayid || null,
      payu_response: { ...p, _hash_matches: true },
    }).eq('txnid', txnid);

    if (status === 'success') {
      const rawSlug    = stored.event_slug as string | null;
      const phone      = stored.phone as string | null;
      const paymentType = (stored.payment_type as string | null) ?? 'advance';
      const newStatus  = paymentType === 'balance' ? 'fully_paid' : 'advance_paid';

      if (rawSlug && phone) {
        const eventSlug = await resolveCanonicalSlug(supabase, rawSlug);

        await supabase
          .from('applications')
          .update({ status: newStatus })
          .eq('event_slug', eventSlug)
          .eq('phone', phone);

        await supabase
          .from('invite_payment_submissions')
          .upsert({
            invite_slug: eventSlug,
            event_slug: eventSlug,
            phone,
            status: newStatus,
            amount: stored.amount ?? 0,
            event_title: stored.event_title ?? '',
            submitted_at: new Date().toISOString(),
          }, { onConflict: 'invite_slug,phone', ignoreDuplicates: false });

        if (paymentType === 'advance') {
          await fireAdvancePaidWhatsApp(supabase, {
            phone, eventSlug,
            amount: stored.amount ?? amount,
            txnid,
          });
        }

        return Response.redirect(
          `${FRONTEND_URL}/invite/${eventSlug}?payment_status=success&txnid=${encodeURIComponent(txnid)}&payment_type=${paymentType}`,
          302,
        );
      }

      return Response.redirect(
        `${FRONTEND_URL}/?payment_status=success&txnid=${encodeURIComponent(txnid)}`,
        302,
      );
    } else {
      // Failure path — fire WhatsApp template if we can
      if (stored?.phone && stored?.event_slug) {
        const eventSlug = await resolveCanonicalSlug(supabase, stored.event_slug);
        await firePaymentFailedWhatsApp(supabase, {
          phone: stored.phone, eventSlug,
          amount: stored.amount ?? 0,
          txnid,
        });
      }
      return Response.redirect(
        `${FRONTEND_URL}/invite?payment_status=failed&txnid=${encodeURIComponent(txnid)}`,
        302,
      );
    }
  } catch (err) {
    console.error('payu-callback error:', err);
    const txnidParam = txnidForCatch ? `&txnid=${encodeURIComponent(txnidForCatch)}` : '';
    return Response.redirect(`${FRONTEND_URL}/invite?payment_status=failed${txnidParam}`, 302);
  }
});
