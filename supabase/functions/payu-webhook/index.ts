import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Hashing ──────────────────────────────────────────────────────────────────

async function sha512(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDueDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return '';
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const day = d.getDate();
  const s = ['th','st','nd','rd'], v = day % 100;
  const suffix = (s[(v - 20) % 10] || s[v] || s[0]);
  return `${month} ${day}${suffix}`;
}

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
// See payu-callback for the full rationale. claimSendFlag flips the flag
// false→true atomically and reports whether THIS caller won; releaseSendFlag
// rolls it back on send failure so a retry can re-send. Prevents the
// callback + webhook from both sending the same WhatsApp.
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

const AISENSY_CAMPAIGN          = 'advance_paid+balance';
const AISENSY_CAMPAIGN_BALANCE  = 'fullpaid';
const AISENSY_CAMPAIGN_FAILED   = 'payment_failed';
// Single-payment ('full') events: paid-in-full confirmation. NOTE: this
// campaign/template must exist in the AiSensy dashboard or sends will fail.
// Params: {{1}} = amount (₹…, same format as advance_paid), {{2}} = meeting-spot
// details date (located by label, NOT a fixed index — see pickMeetingSpotStep).
// MUST match payu-callback's constant — the two race via claimSendFlag, and the
// race winner sends, so a name mismatch makes delivery a coin flip.
const AISENSY_CAMPAIGN_FULL     = 'single_payment_sucessful';

// Resolve booking-timeline steps for an applicant: prefer the per-date steps for
// the date they chose (multi-date events can have different deadlines per date),
// falling back to the event-level steps.
function pickBookingSteps(ev: any, selectedDate?: string | null): any[] {
  const eventLevel = Array.isArray(ev?.booking_steps) ? ev.booking_steps : [];
  if (selectedDate && Array.isArray(ev?.event_dates)) {
    const row = ev.event_dates.find((d: any) => String(d?.start_date ?? '') === String(selectedDate));
    const perDate = Array.isArray(row?.booking_steps) ? row.booking_steps : [];
    if (perDate.length > 0) return perDate;
  }
  return eventLevel;
}

// Locate the meeting-spot step ("you'll receive exact … Meeting Spot/Point
// Details") in a booking timeline. Its index varies by event type — invite full
// = 2, invite split = 3, open single = 1, open split = 2 — so match by
// label/value, never a fixed index. Mirrors payu-callback.
function pickMeetingSpotStep(steps: any[]): any {
  return (Array.isArray(steps) ? steps : []).find((s: any) =>
    /meeting\s*(spot|point)|you'?ll receive/i.test(`${s?.label ?? ''} ${s?.value ?? ''}`)
  ) ?? null;
}

async function fireAdvancePaidWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) { console.warn('[aisensy advance_paid webhook] AISENSY_API_KEY not set'); return; }
  const { data: app } = await supabase
    .from('applications')
    .select('id, name, selected_date, aisensy_advance_paid_sent')
    .eq('phone', args.phone)
    .eq('event_slug', args.eventSlug)
    .maybeSingle();
  if (!app || app.aisensy_advance_paid_sent) return;
  if (!(await claimSendFlag(supabase, app.id, 'aisensy_advance_paid_sent'))) return;

  try {
    const { data: ev } = await supabase
      .from('events')
      .select('booking_steps, event_dates(start_date, booking_steps)')
      .eq('slug', args.eventSlug)
      .maybeSingle();
    // Balance step is always index 2 in the canonical 5-step invite-only
    // booking timeline. Matches the receipt warm-note's positional lookup.
    const balStep = pickBookingSteps(ev, app.selected_date)[2] ?? null;
    const dueFinal = formatDueDate(balStep?.date ?? '');

    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: AISENSY_CAMPAIGN,
        destination: '91' + args.phone,
        userName: app.name || 'chapter A 3063',
        templateParams: [
          `₹${Number(args.amount).toLocaleString('en-IN')}`,
          dueFinal,
          args.txnid,
        ],
        source: 'payu-webhook',
        media: {}, buttons: [], carouselCards: [], location: {},
        attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
        paramsFallbackValue: { FirstName: app.name || 'user' },
      }),
    });

    if (!aiRes.ok) {
      console.error('[aisensy advance_paid webhook] non-ok, releasing claim:', aiRes.status, await aiRes.text());
      await releaseSendFlag(supabase, app.id, 'aisensy_advance_paid_sent');
    }
  } catch (err) {
    console.error('[aisensy advance_paid webhook] fire failed, releasing claim:', err);
    await releaseSendFlag(supabase, app.id, 'aisensy_advance_paid_sent');
  }
}

async function fireBalancePaidWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) { console.warn('[aisensy balance_paid webhook] AISENSY_API_KEY not set'); return; }
  const { data: app } = await supabase
    .from('applications')
    .select('id, name, selected_date, aisensy_balance_paid_sent')
    .eq('phone', args.phone)
    .eq('event_slug', args.eventSlug)
    .maybeSingle();
  if (!app || app.aisensy_balance_paid_sent) return;
  if (!(await claimSendFlag(supabase, app.id, 'aisensy_balance_paid_sent'))) return;

  try {
    const { data: ev } = await supabase
      .from('events')
      .select('booking_steps, event_dates(start_date, booking_steps)')
      .eq('slug', args.eventSlug)
      .maybeSingle();
    const detailsStep = pickMeetingSpotStep(pickBookingSteps(ev, app.selected_date));
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
          `₹${Number(args.amount).toLocaleString('en-IN')}`,
          detailsDate,
        ],
        source: 'payu-webhook',
        media: {}, buttons: [], carouselCards: [], location: {},
        attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
        paramsFallbackValue: { FirstName: app.name || 'user' },
      }),
    });

    if (!aiRes.ok) {
      console.error('[aisensy balance_paid webhook] non-ok, releasing claim:', aiRes.status, await aiRes.text());
      await releaseSendFlag(supabase, app.id, 'aisensy_balance_paid_sent');
    }
  } catch (err) {
    console.error('[aisensy balance_paid webhook] fire failed, releasing claim:', err);
    await releaseSendFlag(supabase, app.id, 'aisensy_balance_paid_sent');
  }
}

async function fireFullPaidWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) { console.warn('[aisensy full_paid webhook] AISENSY_API_KEY not set'); return; }
  const { data: app } = await supabase
    .from('applications')
    .select('id, name, selected_date, aisensy_full_paid_sent')
    .eq('phone', args.phone)
    .eq('event_slug', args.eventSlug)
    .maybeSingle();
  if (!app || app.aisensy_full_paid_sent) return;
  if (!(await claimSendFlag(supabase, app.id, 'aisensy_full_paid_sent'))) return;

  try {
    const { data: ev } = await supabase
      .from('events')
      .select('booking_steps, event_dates(start_date, booking_steps)')
      .eq('slug', args.eventSlug)
      .maybeSingle();
    const detailsStep = pickMeetingSpotStep(pickBookingSteps(ev, app.selected_date));
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
          `₹${Number(args.amount).toLocaleString('en-IN')}`,
          detailsDate,
        ],
        source: 'payu-webhook',
        media: {}, buttons: [], carouselCards: [], location: {},
        attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
        paramsFallbackValue: { FirstName: app.name || 'user' },
      }),
    });

    if (!aiRes.ok) {
      console.error('[aisensy full_paid webhook] non-ok, releasing claim:', aiRes.status, await aiRes.text());
      await releaseSendFlag(supabase, app.id, 'aisensy_full_paid_sent');
    }
  } catch (err) {
    console.error('[aisensy full_paid webhook] fire failed, releasing claim:', err);
    await releaseSendFlag(supabase, app.id, 'aisensy_full_paid_sent');
  }
}

async function firePaymentFailedWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) { console.warn('[aisensy payment_failed webhook] AISENSY_API_KEY not set'); return; }
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
        source: 'payu-webhook',
        media: {}, buttons: [], carouselCards: [], location: {},
        attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
        paramsFallbackValue: { FirstName: app.name || 'user' },
      }),
    });

    if (!aiRes.ok) {
      console.error('[aisensy payment_failed webhook] non-ok, releasing claim:', aiRes.status, await aiRes.text());
      await releaseSendFlag(supabase, app.id, 'aisensy_payment_failed_sent');
    }
  } catch (err) {
    console.error('[aisensy payment_failed webhook] fire failed, releasing claim:', err);
    await releaseSendFlag(supabase, app.id, 'aisensy_payment_failed_sent');
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const PAYU_MERCHANT_KEY  = Deno.env.get('PAYU_MERCHANT_KEY');
    const PAYU_MERCHANT_SALT = Deno.env.get('PAYU_MERCHANT_SALT');
    if (!PAYU_MERCHANT_KEY || !PAYU_MERCHANT_SALT) {
      return new Response('not configured', { status: 500 });
    }

    const formData = await req.formData();
    const p = Object.fromEntries(formData.entries()) as Record<string, string>;

    const {
      status, txnid, amount, productinfo, firstname, email,
      udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '',
      hash: receivedHash, mihpayid = '',
    } = p;

    if (!txnid || !status || !amount || !receivedHash) {
      console.warn('[payu-webhook] missing required fields');
      return new Response('bad request', { status: 400 });
    }

    // PayU reverse hash: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const additionalCharges = (p.additionalCharges ?? '').toString();
    const baseReverse =
      `${PAYU_MERCHANT_SALT}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_MERCHANT_KEY}`;
    const reverseStr = additionalCharges ? `${additionalCharges}|${baseReverse}` : baseReverse;
    const calculatedHash = await sha512(reverseStr);
    const hashMatches = calculatedHash === receivedHash;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (!hashMatches) {
      console.error('[payu-webhook] HASH MISMATCH — rejecting', { txnid, mihpayid });
      await supabase.from('payu_payments').update({
        payu_response: { ...p, _hash_matches: false, _rejected: 'hash_mismatch', _source: 'webhook' },
      }).eq('txnid', txnid);
      // Acknowledge with 200 so PayU doesn't retry indefinitely, but DO NOT
      // update any application status.
      return new Response(JSON.stringify({ received: true, hashMatches: false, rejected: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: stored } = await supabase
      .from('payu_payments')
      .select('event_slug, phone, payment_type, event_title, amount')
      .eq('txnid', txnid)
      .maybeSingle();

    if (!stored) {
      console.error('[payu-webhook] unknown txnid', txnid);
      return new Response(JSON.stringify({ received: true, error: 'unknown txnid' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    const reportedAmount = Number(amount);
    const expectedAmount = Number(stored.amount);
    if (Math.abs(reportedAmount - expectedAmount) > 0.01) {
      console.error('[payu-webhook] AMOUNT MISMATCH — rejecting', { txnid, reportedAmount, expectedAmount });
      await supabase.from('payu_payments').update({
        payu_response: { ...p, _hash_matches: true, _rejected: 'amount_mismatch', _expected: expectedAmount, _source: 'webhook' },
      }).eq('txnid', txnid);
      return new Response(JSON.stringify({ received: true, hashMatches: true, rejected: 'amount_mismatch' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    const dbStatus = status === 'success' ? 'success' : status === 'pending' ? 'pending' : 'failure';

    await supabase
      .from('payu_payments')
      .update({
        status: dbStatus,
        mihpayid: mihpayid || null,
        payu_response: { ...p, _hash_matches: true, _source: 'webhook' },
      })
      .eq('txnid', txnid);

    const rawSlug    = stored.event_slug as string | null;
    const phone      = stored.phone as string | null;
    const paymentType = (stored.payment_type as string | null) ?? 'advance';

    // Pending — record the status but fire no WhatsApp and don't change the
    // application. A later webhook/callback with the final status resolves it.
    if (status === 'pending') {
      return new Response(JSON.stringify({ received: true, status: 'pending', txnid }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (status === 'success') {
      const newStatus = (paymentType === 'balance' || paymentType === 'full') ? 'fully_paid' : 'advance_paid';

      if (rawSlug && phone) {
        const eventSlug = await resolveCanonicalSlug(supabase, rawSlug);

        // Recovered: stamp recovered_at when a cart_abandoned lead first pays.
        // Mirrors payu-callback — the webhook may be the ONLY path that runs
        // (user paid but closed the tab before PayU redirected the browser),
        // so without this the Recovered badge would be missed for those.
        const { data: appRow } = await supabase
          .from('applications')
          .select('cart_abandoned, recovered_at')
          .eq('event_slug', eventSlug)
          .eq('phone', phone)
          .maybeSingle();
        const isRecovery = !!(appRow as any)?.cart_abandoned && !(appRow as any)?.recovered_at;

        await supabase
          .from('applications')
          .update({ status: newStatus, ...(isRecovery ? { recovered_at: new Date().toISOString() } : {}) })
          .eq('event_slug', eventSlug)
          .eq('phone', phone);

        await supabase
          .from('invite_payment_submissions')
          .upsert(
            {
              invite_slug:  eventSlug,
              event_slug:   eventSlug,
              phone,
              status:       newStatus,
              amount:       stored.amount ?? 0,
              event_title:  stored.event_title ?? '',
              submitted_at: new Date().toISOString(),
            },
            { onConflict: 'invite_slug,phone', ignoreDuplicates: false },
          );

        if (paymentType === 'advance') {
          await fireAdvancePaidWhatsApp(supabase, { phone, eventSlug, amount: stored.amount ?? amount, txnid });
        } else if (paymentType === 'balance') {
          await fireBalancePaidWhatsApp(supabase, { phone, eventSlug, amount: stored.amount ?? amount, txnid });
        } else if (paymentType === 'full') {
          await fireFullPaidWhatsApp(supabase, { phone, eventSlug, amount: stored.amount ?? amount, txnid });
        }
      }
    } else {
      // Failure path — fire the payment_failed WhatsApp. The callback also
      // fires it, but if the user closed the tab on PayU's failure page the
      // callback never ran; the webhook is then the only path. The shared
      // aisensy_payment_failed_sent claim prevents a double-up.
      if (rawSlug && phone) {
        const eventSlug = await resolveCanonicalSlug(supabase, rawSlug);
        await firePaymentFailedWhatsApp(supabase, { phone, eventSlug, amount: stored.amount ?? amount, txnid });
      }
    }

    return new Response(JSON.stringify({ received: true, status: dbStatus, txnid, hashMatches: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('payu-webhook error:', err);
    return new Response(JSON.stringify({ received: true, error: String(err) }),
      { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
});
