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

// Short-month + ordinal-day format, e.g. May 22nd / Aug 26th.
// Used by the balance-paid template's {{2}} param. Distinct from
// formatDueDate which uses the full month name (August 26th).
function formatShortDateOrdinal(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return '';
  const month = d.toLocaleDateString('en-US', { month: 'short' });
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

// ── AiSensy one-shot send dedup ───────────────────────────────────────────────
//
// payu-callback (browser redirect) and payu-webhook (server-to-server) BOTH
// fire on a successful payment. A plain read-flag-then-set guard
// races: if both land within the read window they each see the flag false and
// both send, so the customer gets two identical WhatsApps. claimSendFlag flips
// the flag false→true in a single conditional UPDATE and reports whether THIS
// caller won the flip — only the winner sends. releaseSendFlag rolls the flag
// back if the send fails, so a later retry (e.g. PayU webhook re-delivery) can
// re-send. This makes delivery effectively at-most-once across the two paths,
// with at-least-once retry on transient AiSensy failures.
async function claimSendFlag(supabase: any, appId: string, col: string): Promise<boolean> {
  const { data } = await supabase
    .from('applications')
    .update({ [col]: true })
    .eq('id', appId)
    .eq(col, false)
    .select('id')
    .maybeSingle();
  return !!data;
}
async function releaseSendFlag(supabase: any, appId: string, col: string): Promise<void> {
  await supabase.from('applications').update({ [col]: false }).eq('id', appId);
}

// ── AiSensy WhatsApp ─────────────────────────────────────────────────────────

const AISENSY_CAMPAIGN_ADVANCE = 'advance_paid+balance';
const AISENSY_CAMPAIGN_FAILED  = 'payment_failed';
const AISENSY_CAMPAIGN_BALANCE = 'fullpaid';
// Single-payment ('full') events: paid-in-full confirmation. NOTE: this
// campaign/template must exist in the AiSensy dashboard or sends will fail.
// Params: {{1}} = amount (₹…), {{2}} = details date (from booking_steps[3]).
const AISENSY_CAMPAIGN_FULL    = 'paid_full';

async function fireAdvancePaidWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) {
    console.warn('[aisensy advance_paid] AISENSY_API_KEY not set, skipping');
    return;
  }
  const { data: app } = await supabase
    .from('applications')
    .select('id, name, aisensy_advance_paid_sent')
    .eq('phone', args.phone)
    .eq('event_slug', args.eventSlug)
    .maybeSingle();
  if (!app || app.aisensy_advance_paid_sent) return;          // fast path
  if (!(await claimSendFlag(supabase, app.id, 'aisensy_advance_paid_sent'))) return;  // lost the race

  try {
    const { data: ev } = await supabase
      .from('events')
      .select('booking_steps')
      .eq('slug', args.eventSlug)
      .maybeSingle();
    // Balance step is always index 2 in the canonical 5-step invite-only
    // booking timeline (vibe check → advance → balance → meeting spot →
    // social proof). Matches the receipt warm-note's positional lookup.
    const balStep = Array.isArray(ev?.booking_steps) ? ev.booking_steps[2] : null;
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

    if (!aiRes.ok) {
      console.error('[aisensy advance_paid] non-ok, releasing claim:', aiRes.status, await aiRes.text());
      await releaseSendFlag(supabase, app.id, 'aisensy_advance_paid_sent');
    }
  } catch (err) {
    console.error('[aisensy advance_paid] fire failed, releasing claim:', err);
    await releaseSendFlag(supabase, app.id, 'aisensy_advance_paid_sent');
  }
}

async function fireBalancePaidWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) {
    console.warn('[aisensy balance_paid] AISENSY_API_KEY not set, skipping');
    return;
  }
  const { data: app } = await supabase
    .from('applications')
    .select('id, name, aisensy_balance_paid_sent')
    .eq('phone', args.phone)
    .eq('event_slug', args.eventSlug)
    .maybeSingle();
  if (!app || app.aisensy_balance_paid_sent) return;
  if (!(await claimSendFlag(supabase, app.id, 'aisensy_balance_paid_sent'))) return;

  try {
    // {{2}} comes from the 4th booking step's date — same source as the
    // receipt warm note and the invite-flow chat copy. Formatted as
    // May 22nd / Aug 26th per the approved AiSensy template spec.
    const { data: ev } = await supabase
      .from('events')
      .select('booking_steps')
      .eq('slug', args.eventSlug)
      .maybeSingle();
    const detailsStep = (ev?.booking_steps ?? [])[3];
    const detailsDate = formatShortDateOrdinal(detailsStep?.date ?? '');

    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: AISENSY_CAMPAIGN_BALANCE,
        destination: '91' + args.phone,
        userName: app.name || 'chapter A 3063',
        templateParams: [
          `₹${Number(args.amount).toLocaleString('en-IN')}`,  // {{1}} amount
          detailsDate,                                         // {{2}} details date
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

    if (!aiRes.ok) {
      console.error('[aisensy balance_paid] non-ok, releasing claim:', aiRes.status, await aiRes.text());
      await releaseSendFlag(supabase, app.id, 'aisensy_balance_paid_sent');
    }
  } catch (err) {
    console.error('[aisensy balance_paid] fire failed, releasing claim:', err);
    await releaseSendFlag(supabase, app.id, 'aisensy_balance_paid_sent');
  }
}

async function fireFullPaidWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) {
    console.warn('[aisensy full_paid] AISENSY_API_KEY not set, skipping');
    return;
  }
  const { data: app } = await supabase
    .from('applications')
    .select('id, name, aisensy_full_paid_sent')
    .eq('phone', args.phone)
    .eq('event_slug', args.eventSlug)
    .maybeSingle();
  if (!app || app.aisensy_full_paid_sent) return;
  if (!(await claimSendFlag(supabase, app.id, 'aisensy_full_paid_sent'))) return;

  try {
    const { data: ev } = await supabase
      .from('events')
      .select('booking_steps')
      .eq('slug', args.eventSlug)
      .maybeSingle();
    const detailsStep = (ev?.booking_steps ?? [])[3];
    const detailsDate = formatShortDateOrdinal(detailsStep?.date ?? '');

    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: AISENSY_CAMPAIGN_FULL,
        destination: '91' + args.phone,
        userName: app.name || 'chapter A 3063',
        templateParams: [
          `₹${Number(args.amount).toLocaleString('en-IN')}`,  // {{1}} amount
          detailsDate,                                         // {{2}} details date
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

    if (!aiRes.ok) {
      console.error('[aisensy full_paid] non-ok, releasing claim:', aiRes.status, await aiRes.text());
      await releaseSendFlag(supabase, app.id, 'aisensy_full_paid_sent');
    }
  } catch (err) {
    console.error('[aisensy full_paid] fire failed, releasing claim:', err);
    await releaseSendFlag(supabase, app.id, 'aisensy_full_paid_sent');
  }
}

async function firePaymentFailedWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) return;
  const { data: app } = await supabase
    .from('applications')
    .select('id, name, aisensy_payment_failed_sent')
    .eq('phone', args.phone)
    .eq('event_slug', args.eventSlug)
    .maybeSingle();
  if (!app || app.aisensy_payment_failed_sent) return;
  if (!(await claimSendFlag(supabase, app.id, 'aisensy_payment_failed_sent'))) return;

  try {
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

    if (!aiRes.ok) {
      console.error('[aisensy payment_failed] non-ok, releasing claim:', aiRes.status, await aiRes.text());
      await releaseSendFlag(supabase, app.id, 'aisensy_payment_failed_sent');
    }
  } catch (err) {
    console.error('[aisensy payment_failed] fire failed, releasing claim:', err);
    await releaseSendFlag(supabase, app.id, 'aisensy_payment_failed_sent');
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

    // PayU reverse hash: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    // The 5 empty fields between status and udf5 are udf10..udf6.
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
      await supabase.from('payu_payments').update({
        payu_response: { ...p, _hash_matches: false, _rejected: 'hash_mismatch' },
      }).eq('txnid', txnid);
      return Response.redirect(`${FRONTEND_URL}/invite?payment_status=failed&txnid=${encodeURIComponent(txnid)}`, 302);
    }

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
    if (Math.abs(reportedAmount - expectedAmount) > 0.01) {
      console.error('[payu-callback] AMOUNT MISMATCH — rejecting', { txnid, reportedAmount, expectedAmount });
      await supabase.from('payu_payments').update({
        payu_response: { ...p, _hash_matches: true, _rejected: 'amount_mismatch', _expected: expectedAmount },
      }).eq('txnid', txnid);
      return Response.redirect(`${FRONTEND_URL}/invite?payment_status=failed&txnid=${encodeURIComponent(txnid)}`, 302);
    }

    const dbStatus = status === 'success' ? 'success' : status === 'pending' ? 'pending' : 'failure';

    await supabase.from('payu_payments').update({
      status: dbStatus,
      mihpayid: mihpayid || null,
      payu_response: { ...p, _hash_matches: true },
    }).eq('txnid', txnid);

    // Pending (e.g. a slow UPI collect, or a bank transfer still settling).
    // Do NOT treat it as a failure: don't fire the payment-failed WhatsApp and
    // don't touch the application status. PayU sends the final success/failure
    // later (webhook or a follow-up callback), which resolves it. Showing a
    // 'failed' screen here would wrongly nudge a retry and risk a double charge.
    if (status === 'pending') {
      return Response.redirect(`${FRONTEND_URL}/invite?payment_status=pending&txnid=${encodeURIComponent(txnid)}`, 302);
    }

    if (status === 'success') {
      const rawSlug    = stored.event_slug as string | null;
      const phone      = stored.phone as string | null;
      const paymentType = (stored.payment_type as string | null) ?? 'advance';
      const newStatus  = (paymentType === 'balance' || paymentType === 'full') ? 'fully_paid' : 'advance_paid';

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
        } else if (paymentType === 'balance') {
          await fireBalancePaidWhatsApp(supabase, {
            phone, eventSlug,
            amount: stored.amount ?? amount,
            txnid,
          });
        } else if (paymentType === 'full') {
          await fireFullPaidWhatsApp(supabase, {
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
