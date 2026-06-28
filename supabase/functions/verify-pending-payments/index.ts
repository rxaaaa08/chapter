import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// verify-pending-payments
//
// Reconciliation backstop (PayU "Verify Payment" step). Fired every 15 min by
// pg_cron. For each payu_payments row stuck at 'pending' (15 min–24 h old), it
// PULLS the authoritative status from PayU's Verify Payment API and resolves
// the row — flipping the application + firing the right WhatsApp, exactly like
// payu-webhook would have.
//
// Why it exists: the browser callback and the S2S webhook are both PUSH
// (PayU -> us). If a UPI payment goes 'pending' and the webhook is delayed,
// dropped, or never delivered, the row sits at 'pending' forever and the
// customer's money may have actually moved. This PULL path doesn't depend on
// PayU reaching us, so nothing gets silently lost.
//
// Auth: mirrors cart-abandonment. The normal pg_cron run hits the bare URL.
// A manual ?force=true run (bypasses the 15-min floor, optional &txnid=) is
// guarded by CRON_SECRET (fail-closed if unset). verify_jwt is false because
// pg_cron (pg_net) calls this without a JWT. The endpoint returns only a count
// summary — never transaction data — and moves no money, so the cron path is
// safe to be open, same as cart-abandonment.

// ── Hashing ──────────────────────────────────────────────────────────────────
async function sha512(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-512', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Helpers (mirrors payu-webhook) ───────────────────────────────────────────
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

// Atomic one-shot claim — shared with payu-callback/payu-webhook via the same
// column flags, so a reconcile send can't double up with a webhook send.
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

const AISENSY_CAMPAIGN_ADVANCE = 'advance_paid+balance';
const AISENSY_CAMPAIGN_BALANCE = 'fullpaid';
const AISENSY_CAMPAIGN_FAILED  = 'payment_failed';
// Single-payment ('full') events: paid-in-full confirmation. Must exist in the
// AiSensy dashboard. Params: {{1}} = amount (₹…), {{2}} = details date.
const AISENSY_CAMPAIGN_FULL    = 'paid_full';

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

async function fireAdvancePaidWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) { console.warn('[reconcile advance_paid] AISENSY_API_KEY not set'); return; }
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
      .from('events').select('booking_steps, event_dates(start_date, booking_steps)').eq('slug', args.eventSlug).maybeSingle();
    // Balance step is always index 2 in the canonical 5-step invite-only
    // booking timeline. Matches the receipt warm-note's positional lookup.
    const balStep = pickBookingSteps(ev, app.selected_date)[2] ?? null;
    const dueFinal = formatDueDate(balStep?.date ?? '');

    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: AISENSY_CAMPAIGN_ADVANCE,
        destination: '91' + args.phone,
        userName: app.name || 'chapter A 3063',
        templateParams: [`₹${Number(args.amount).toLocaleString('en-IN')}`, dueFinal, args.txnid],
        source: 'payu-reconcile',
        media: {}, buttons: [], carouselCards: [], location: {},
        attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
        paramsFallbackValue: { FirstName: app.name || 'user' },
      }),
    });
    if (!aiRes.ok) {
      console.error('[reconcile advance_paid] non-ok, releasing claim:', aiRes.status, await aiRes.text());
      await releaseSendFlag(supabase, app.id, 'aisensy_advance_paid_sent');
    }
  } catch (err) {
    console.error('[reconcile advance_paid] fire failed, releasing claim:', err);
    await releaseSendFlag(supabase, app.id, 'aisensy_advance_paid_sent');
  }
}

async function fireBalancePaidWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) { console.warn('[reconcile balance_paid] AISENSY_API_KEY not set'); return; }
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
      .from('events').select('booking_steps, event_dates(start_date, booking_steps)').eq('slug', args.eventSlug).maybeSingle();
    const detailsStep = pickBookingSteps(ev, app.selected_date)[3];
    const detailsDate = formatShortDateOrdinal(detailsStep?.date ?? '');

    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: AISENSY_CAMPAIGN_BALANCE,
        destination: '91' + args.phone,
        userName: app.name || 'chapter A 3063',
        templateParams: [`₹${Number(args.amount).toLocaleString('en-IN')}`, detailsDate],
        source: 'payu-reconcile',
        media: {}, buttons: [], carouselCards: [], location: {},
        attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
        paramsFallbackValue: { FirstName: app.name || 'user' },
      }),
    });
    if (!aiRes.ok) {
      console.error('[reconcile balance_paid] non-ok, releasing claim:', aiRes.status, await aiRes.text());
      await releaseSendFlag(supabase, app.id, 'aisensy_balance_paid_sent');
    }
  } catch (err) {
    console.error('[reconcile balance_paid] fire failed, releasing claim:', err);
    await releaseSendFlag(supabase, app.id, 'aisensy_balance_paid_sent');
  }
}

async function fireFullPaidWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) { console.warn('[reconcile full_paid] AISENSY_API_KEY not set'); return; }
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
      .from('events').select('booking_steps, event_dates(start_date, booking_steps)').eq('slug', args.eventSlug).maybeSingle();
    const detailsStep = pickBookingSteps(ev, app.selected_date)[3];
    const detailsDate = formatShortDateOrdinal(detailsStep?.date ?? '');

    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: AISENSY_CAMPAIGN_FULL,
        destination: '91' + args.phone,
        userName: app.name || 'chapter A 3063',
        templateParams: [`₹${Number(args.amount).toLocaleString('en-IN')}`, detailsDate],
        source: 'payu-reconcile',
        media: {}, buttons: [], carouselCards: [], location: {},
        attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
        paramsFallbackValue: { FirstName: app.name || 'user' },
      }),
    });
    if (!aiRes.ok) {
      console.error('[reconcile full_paid] non-ok, releasing claim:', aiRes.status, await aiRes.text());
      await releaseSendFlag(supabase, app.id, 'aisensy_full_paid_sent');
    }
  } catch (err) {
    console.error('[reconcile full_paid] fire failed, releasing claim:', err);
    await releaseSendFlag(supabase, app.id, 'aisensy_full_paid_sent');
  }
}

async function firePaymentFailedWhatsApp(supabase: any, args: {
  phone: string; eventSlug: string; amount: number | string; txnid: string;
}) {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) { console.warn('[reconcile payment_failed] AISENSY_API_KEY not set'); return; }
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
        source: 'payu-reconcile',
        media: {}, buttons: [], carouselCards: [], location: {},
        attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
        paramsFallbackValue: { FirstName: app.name || 'user' },
      }),
    });
    if (!aiRes.ok) {
      console.error('[reconcile payment_failed] non-ok, releasing claim:', aiRes.status, await aiRes.text());
      await releaseSendFlag(supabase, app.id, 'aisensy_payment_failed_sent');
    }
  } catch (err) {
    console.error('[reconcile payment_failed] fire failed, releasing claim:', err);
    await releaseSendFlag(supabase, app.id, 'aisensy_payment_failed_sent');
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const PAYU_MERCHANT_KEY  = Deno.env.get('PAYU_MERCHANT_KEY');
    const PAYU_MERCHANT_SALT = Deno.env.get('PAYU_MERCHANT_SALT');
    const PAYU_BASE_URL      = Deno.env.get('PAYU_BASE_URL') ?? 'https://test.payu.in/_payment';
    if (!PAYU_MERCHANT_KEY || !PAYU_MERCHANT_SALT) {
      return new Response(JSON.stringify({ error: 'payu not configured' }), { status: 500 });
    }

    // Verify Payment API lives on a different host than _payment. Match the mode
    // we're already pointed at (test vs live) so reconciliation hits the same
    // environment as the order it's reconciling.
    const isLive = PAYU_BASE_URL.includes('secure.payu.in');
    const verifyUrl = isLive
      ? 'https://info.payu.in/merchant/postservice.php?form=2'
      : 'https://test.payu.in/merchant/postservice.php?form=2';

    const url = new URL(req.url);
    const isForce = url.searchParams.get('force') === 'true';
    const forceTxnid = (url.searchParams.get('txnid') ?? '').trim();

    // Manual/force runs are guarded; the scheduled cron run is open (no data is
    // returned and no money moves — same posture as cart-abandonment).
    if (isForce) {
      const CRON_SECRET = Deno.env.get('CRON_SECRET');
      const secret = url.searchParams.get('secret') ?? '';
      if (!CRON_SECRET || secret !== CRON_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Target rows: still 'pending'. Normal run = 15 min–24 h old (give the
    // push paths time to land; ignore ancient abandoned-at-create rows). Force
    // run = any age, optionally a single txnid.
    let q = supabase
      .from('payu_payments')
      .select('txnid, event_slug, phone, payment_type, event_title, amount')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(100);

    if (isForce) {
      if (forceTxnid) q = q.eq('txnid', forceTxnid);
    } else {
      const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const dayAgo        = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      q = q.lt('created_at', fifteenMinAgo).gt('created_at', dayAgo);
    }

    const { data: rows, error } = await q;
    if (error) {
      console.error('[verify-pending-payments] query error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ checked: 0, success: 0, failed: 0, still_pending: 0 }), { status: 200 });
    }

    let resolvedSuccess = 0, resolvedFailed = 0, stillPending = 0;

    for (const row of rows) {
      const txnid = row.txnid as string;
      try {
        // Verify Payment hash: sha512(key|command|var1|salt), var1 = txnid.
        const hash = await sha512(`${PAYU_MERCHANT_KEY}|verify_payment|${txnid}|${PAYU_MERCHANT_SALT}`);
        const form = new URLSearchParams({
          key: PAYU_MERCHANT_KEY,
          command: 'verify_payment',
          var1: txnid,
          hash,
        });
        const res = await fetch(verifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: form.toString(),
        });
        const data = await res.json().catch(() => null);
        const txn = data?.transaction_details?.[txnid];
        const payStatus = String(txn?.status ?? '').toLowerCase();

        const isSuccess = payStatus === 'success' || payStatus === 'captured';
        const isFailure = payStatus === 'failure' || payStatus === 'failed';

        if (!isSuccess && !isFailure) {
          // pending / in progress / not found — leave it, retry next run.
          stillPending++;
          continue;
        }

        // Defence in depth: if PayU reports an amount, it must match what we
        // stored before we trust a 'success'. Skip (stay pending) on mismatch.
        const reported = Number(txn?.amt ?? txn?.amount ?? NaN);
        const expected = Number(row.amount ?? NaN);
        if (isSuccess && Number.isFinite(reported) && Number.isFinite(expected) && Math.abs(reported - expected) > 0.01) {
          console.error('[verify-pending-payments] amount mismatch, leaving pending', { txnid, reported, expected });
          stillPending++;
          continue;
        }

        const dbStatus = isSuccess ? 'success' : 'failure';
        await supabase.from('payu_payments').update({
          status: dbStatus,
          mihpayid: txn?.mihpayid ?? null,
          payu_response: { ...(txn ?? {}), _hash_matches: true, _source: 'reconcile' },
        }).eq('txnid', txnid);

        const rawSlug = row.event_slug as string | null;
        const phone   = row.phone as string | null;
        const paymentType = (row.payment_type as string | null) ?? 'advance';

        if (isSuccess && rawSlug && phone) {
          const eventSlug = await resolveCanonicalSlug(supabase, rawSlug);
          const newStatus = (paymentType === 'balance' || paymentType === 'full') ? 'fully_paid' : 'advance_paid';

          await supabase.from('applications')
            .update({ status: newStatus })
            .eq('event_slug', eventSlug).eq('phone', phone);

          await supabase.from('invite_payment_submissions').upsert({
            invite_slug: eventSlug,
            event_slug:  eventSlug,
            phone,
            status:      newStatus,
            amount:      row.amount ?? 0,
            event_title: row.event_title ?? '',
            submitted_at: new Date().toISOString(),
          }, { onConflict: 'invite_slug,phone', ignoreDuplicates: false });

          if (paymentType === 'balance') {
            await fireBalancePaidWhatsApp(supabase, { phone, eventSlug, amount: row.amount ?? 0, txnid });
          } else if (paymentType === 'full') {
            await fireFullPaidWhatsApp(supabase, { phone, eventSlug, amount: row.amount ?? 0, txnid });
          } else {
            await fireAdvancePaidWhatsApp(supabase, { phone, eventSlug, amount: row.amount ?? 0, txnid });
          }
          resolvedSuccess++;
          console.log('[verify-pending-payments] resolved -> success', txnid);
        } else if (isFailure && rawSlug && phone) {
          const eventSlug = await resolveCanonicalSlug(supabase, rawSlug);
          await firePaymentFailedWhatsApp(supabase, { phone, eventSlug, amount: row.amount ?? 0, txnid });
          resolvedFailed++;
          console.log('[verify-pending-payments] resolved -> failure', txnid);
        }
      } catch (err) {
        console.error('[verify-pending-payments] error for txnid', txnid, err);
        stillPending++;
      }
    }

    const summary = { checked: rows.length, success: resolvedSuccess, failed: resolvedFailed, still_pending: stillPending };
    console.log('[verify-pending-payments] done:', summary);
    return new Response(JSON.stringify(summary), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('verify-pending-payments error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 200 });
  }
});
