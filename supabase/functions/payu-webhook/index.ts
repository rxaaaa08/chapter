import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendPurchaseToMeta, payuAddedOnToUnix } from '../_shared/metaCapi.ts';

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
// True when the event collects its balance in person — those events send no
// balance-paid WhatsApp (the bill's success page is the confirmation). Fails
// OPEN on a lookup error so a DB blip can never silently swallow a real send.
async function isPayAtVenue(supabase: any, eventSlug: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('pay_at_venue')
      .eq('slug', eventSlug)
      .maybeSingle();
    if (error) return false;
    return !!data?.pay_at_venue;
  } catch (_e) {
    return false;
  }
}

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

const AISENSY_CAMPAIGN          = 'advance_success_dpl';
const AISENSY_CAMPAIGN_BALANCE  = 'fullpaid_dpl';
const AISENSY_CAMPAIGN_FAILED   = 'payment_failure_dpl';
// Single-payment ('full') events: paid-in-full confirmation. NOTE: this
// campaign/template must exist in the AiSensy dashboard or sends will fail.
// Params: {{1}} = amount (₹…, same format as advance_paid), {{2}} = meeting-spot
// details date (located by label, NOT a fixed index — see pickMeetingSpotStep).
// MUST match payu-callback's constant — the two race via claimSendFlag, and the
// race winner sends, so a name mismatch makes delivery a coin flip.
const AISENSY_CAMPAIGN_FULL     = 'single_payment_sucess_dpl';
// Pay-at-venue advances reuse the single-payment template; its {{2}} is a
// "you'll get details ..." line, filled with a phrase since these events carry
// no meeting-spot row to read a date from.
const PAY_AT_VENUE_DETAILS_WHEN = 'one week before the event';

// The event-level timeline owns the step labels; per-date timelines often only
// override dates and intentionally leave label/value blank. Find the meeting
// step's index on the event-level timeline, then use that same position from
// the selected date's timeline when it supplies a date.
function pickMeetingSpotStep(ev: any, selectedDate?: string | null): any {
  const eventLevel = Array.isArray(ev?.booking_steps) ? ev.booking_steps : [];
  const index = eventLevel.findIndex((s: any) =>
    /meeting\s*(spot|point)|you'?ll receive/i.test(`${s?.label ?? ''} ${s?.value ?? ''}`)
  );
  if (index < 0) return null;
  if (selectedDate && Array.isArray(ev?.event_dates)) {
    const row = ev.event_dates.find((d: any) => String(d?.start_date ?? '') === String(selectedDate));
    const perDate = Array.isArray(row?.booking_steps) ? row.booking_steps : [];
    if (perDate[index]?.date) return perDate[index];
  }
  return eventLevel[index] ?? null;
}

// Labels belong to the event-level timeline; a per-date timeline often has
// only dates. Resolve the balance row's index once, then take that date.
function pickBalanceDueStep(ev: any, selectedDate?: string | null): any {
  const eventLevel = Array.isArray(ev?.booking_steps) ? ev.booking_steps : [];
  const index = eventLevel.findIndex((s: any) =>
    /\{balance\}|\b(?:remaining\s+)?balance\b/i.test(`${s?.label ?? ''} ${s?.value ?? ''}`)
  );
  if (index < 0) return null;
  if (selectedDate && Array.isArray(ev?.event_dates)) {
    const row = ev.event_dates.find((d: any) => String(d?.start_date ?? '') === String(selectedDate));
    const perDate = Array.isArray(row?.booking_steps) ? row.booking_steps : [];
    if (perDate[index]?.date) return perDate[index];
  }
  return eventLevel[index] ?? null;
}

function formatRupeesTwoDecimals(value: number | string): string {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `₹${safeAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function capitalizeFirstChar(value: string): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'User';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function buildInviteButtonParam(phone: string, name: string): string {
  const params = new URLSearchParams();
  params.set('phone', phone);
  params.set('name', name);
  return `?${params.toString()}`;
}

function buildAiSensyUrlButton(value: string, count = 1) {
  return Array.from({ length: count }, (_, index) => ({
    type: 'button',
    sub_type: 'URL',
    index,
    parameters: [
      {
        type: 'text',
        text: value,
      },
    ],
  }));
}

function buildInviteContactUrl(baseUrl: string, phone: string, name: string): string {
  const params = new URLSearchParams();
  params.set('phone', phone);
  const trimmedName = name.trim();
  if (trimmedName) params.set('name', trimmedName);
  return `${baseUrl}/invite?${params.toString()}`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function paymentFailureEmailHtml(args: {
  userName: string; amount: string; contactUrl: string; senderName: string;
}): string {
  const name = esc(args.userName || 'there');
  const amount = esc(args.amount);
  const url = args.contactUrl;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f3f4f6;color-scheme:light;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;">
        <tr><td style="background:#000000;padding:20px 32px;">
          <span style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-weight:900;font-size:18px;letter-spacing:-0.025em;color:#ffffff;">chapter &#2949;</span>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">Payment Failed :(</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#4b5563;">Hi ${name}, your payment of <strong style="color:#111827;">${amount}</strong> has failed.</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:#4b5563;">Please <strong style="color:#111827;">Retry Payment</strong>.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 12px;">
            <tr><td style="border-radius:14px;background:#000000;">
              <a href="${url}" target="_blank" style="display:inline-block;padding:15px 28px;font-size:16px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:14px;">Retry Payment &#8594;</a>
            </td></tr>
          </table>
          <p style="margin:0 0 12px;font-size:15px;line-height:22px;color:#4b5563;">If anything feels unclear - press Contact Us</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="border-radius:14px;background:#f3f4f6;">
              <a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:800;color:#374151;text-decoration:none;border-radius:14px;">Contact Us &#8594;</a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;line-height:20px;color:#9ca3af;">If the button doesn't work, open this link:<br><a href="${url}" target="_blank" style="color:#2563eb;word-break:break-all;">${url}</a></p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0 0 10px;font-size:12px;line-height:18px;color:#9ca3af;">Sent by ${esc(args.senderName)}. You received this because a payment attempt for a chapter &#2949; experience did not complete.</p>
          <p style="margin:0;font-size:12px;line-height:18px;color:#9ca3af;">Do not reply to this email. To contact us, press the <strong style="color:#6b7280;">Contact Us</strong> button.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendPaymentFailureEmail(args: {
  email: string; userName: string; amount: string; contactUrl: string; source: string;
}): Promise<boolean> {
  const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
  if (!BREVO_API_KEY) {
    console.warn(`[${args.source} payment_failed_email] BREVO_API_KEY not set, skipping email`);
    return false;
  }
  const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') ?? 'info@chaptera.in';
  const senderName = Deno.env.get('BREVO_SENDER_NAME') ?? 'chapter அ';
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: args.email, name: args.userName || undefined }],
        subject: `Payment failed for ${args.amount}`,
        htmlContent: paymentFailureEmailHtml({ userName: args.userName, amount: args.amount, contactUrl: args.contactUrl, senderName }),
        tags: ['chapter-payment-failed-email'],
      }),
    });
    const ok = res.status >= 200 && res.status < 300;
    const body = await res.text().catch(() => '');
    console.log(`[${args.source} payment_failed_email] brevo response:`, { to_tail: args.email.slice(-8), status: res.status, ok, body: body.slice(0, 120) });
    return ok;
  } catch (err) {
    console.error(`[${args.source} payment_failed_email] brevo failed:`, err);
    return false;
  }
}

async function maybeSendPaymentFailureEmail(supabase: any, app: any, args: {
  phone: string; userName: string; amount: string; source: string;
}): Promise<void> {
  const email = String(app?.email ?? '').trim();
  if (!email || app?.payment_failed_email_sent) return;

  const { data: claimed, error: claimError } = await supabase
    .from('applications')
    .update({ payment_failed_email_sent: true, payment_failed_email_sent_at: new Date().toISOString() })
    .eq('id', app.id)
    .eq('payment_failed_email_sent', false)
    .select('id')
    .maybeSingle();
  if (claimError) {
    console.error(`[${args.source} payment_failed_email] could not claim send flag:`, claimError);
    return;
  }
  if (!claimed) return;

  const baseUrl = (Deno.env.get('BREVO_INVITE_BASE_URL') ?? 'https://chaptera.in').replace(/\/+$/, '');
  const emailed = await sendPaymentFailureEmail({
    email,
    userName: args.userName,
    amount: args.amount,
    contactUrl: buildInviteContactUrl(baseUrl, args.phone, args.userName),
    source: args.source,
  });
  if (!emailed) {
    const { error: releaseError } = await supabase
      .from('applications')
      .update({ payment_failed_email_sent: false, payment_failed_email_sent_at: null })
      .eq('id', app.id);
    if (releaseError) console.error(`[${args.source} payment_failed_email] could not release send flag:`, releaseError);
  }
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
    // Resolve the event-level balance step and use that same index from the
    // selected-date timeline, matching the balance-paid message's approach.
    const balStep = pickBalanceDueStep(ev, app.selected_date);
    const dueFinal = formatDueDate(balStep?.date ?? '');
    const displayName = capitalizeFirstChar(app.name || 'there');
    const buttonParam = buildInviteButtonParam(args.phone, displayName);
    const formattedAmount = formatRupeesTwoDecimals(args.amount);
    // Pay at venue has no balance deadline — advance_success_dpl's {{2}} would be
    // empty on a template that tells the guest to pay before it. Swap to the
    // approved single-payment template with a phrase for its details line.
    const payAtVenue = await isPayAtVenue(supabase, args.eventSlug);

    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: payAtVenue ? AISENSY_CAMPAIGN_FULL : AISENSY_CAMPAIGN,
        destination: '91' + args.phone,
        userName: displayName || 'chapter A 3063',
        templateParams: payAtVenue
          ? [formattedAmount, PAY_AT_VENUE_DETAILS_WHEN]
          : [formattedAmount, dueFinal, args.txnid],
        source: 'payu-webhook',
        media: {}, buttons: buildAiSensyUrlButton(buttonParam, 2), carouselCards: [], location: {},
        attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
        paramsFallbackValue: { FirstName: displayName },
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
  // Pay at venue: balance settled in person — the bill page is the confirmation.
  // Checked BEFORE claimSendFlag so a skipped send never burns the claim.
  if (await isPayAtVenue(supabase, args.eventSlug)) return;
  if (!(await claimSendFlag(supabase, app.id, 'aisensy_balance_paid_sent'))) return;

  try {
    const { data: ev } = await supabase
      .from('events')
      .select('booking_steps, event_dates(start_date, booking_steps)')
      .eq('slug', args.eventSlug)
      .maybeSingle();
    const detailsStep = pickMeetingSpotStep(ev, app.selected_date);
    const detailsDate = formatShortDateOrdinal(detailsStep?.date ?? '');
    const displayName = capitalizeFirstChar(app.name || 'there');
    const buttonParam = buildInviteButtonParam(args.phone, displayName);
    const formattedAmount = formatRupeesTwoDecimals(args.amount);

    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: AISENSY_CAMPAIGN_BALANCE,
        destination: '91' + args.phone,
        userName: displayName || 'chapter A 3063',
        templateParams: [
          formattedAmount,
          detailsDate,
        ],
        source: 'payu-webhook',
        media: {}, buttons: buildAiSensyUrlButton(buttonParam, 2), carouselCards: [], location: {},
        attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
        paramsFallbackValue: { FirstName: displayName },
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
    const detailsStep = pickMeetingSpotStep(ev, app.selected_date);
    const detailsDate = formatShortDateOrdinal(detailsStep?.date ?? '');
    const displayName = capitalizeFirstChar(app.name || 'there');
    const buttonParam = buildInviteButtonParam(args.phone, displayName);
    const formattedAmount = formatRupeesTwoDecimals(args.amount);

    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: AISENSY_CAMPAIGN_FULL,
        destination: '91' + args.phone,
        userName: displayName || 'chapter A 3063',
        templateParams: [
          formattedAmount,
          detailsDate,
        ],
        source: 'payu-webhook',
        media: {}, buttons: buildAiSensyUrlButton(buttonParam, 2), carouselCards: [], location: {},
        attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
        paramsFallbackValue: { FirstName: displayName },
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
  // Keep the WhatsApp lookup independent of the email-only migration. If that
  // migration has not reached production yet, failure WhatsApps must still send.
  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('id, name, email, aisensy_payment_failed_sent')
    .eq('phone', args.phone)
    .eq('event_slug', args.eventSlug)
    .maybeSingle();
  if (appError) {
    console.error('[aisensy payment_failed webhook] application lookup failed:', appError);
    return;
  }
  if (!app) return;

  const displayName = capitalizeFirstChar(app.name || 'there');
  const formattedAmount = formatRupeesTwoDecimals(args.amount);
  let claimedWhatsApp = false;

  try {
    if (AISENSY_API_KEY && !app.aisensy_payment_failed_sent && await claimSendFlag(supabase, app.id, 'aisensy_payment_failed_sent')) {
      claimedWhatsApp = true;
      const buttonParam = buildInviteButtonParam(args.phone, displayName);
      const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: AISENSY_API_KEY,
          campaignName: AISENSY_CAMPAIGN_FAILED,
          destination: '91' + args.phone,
          userName: displayName || 'chapter A 3063',
          templateParams: [displayName, formattedAmount],
          source: 'payu-webhook',
          media: {}, buttons: buildAiSensyUrlButton(buttonParam, 2), carouselCards: [], location: {},
          attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
          paramsFallbackValue: { FirstName: displayName },
        }),
      });

      if (!aiRes.ok) {
        console.error('[aisensy payment_failed webhook] non-ok, releasing claim:', aiRes.status, await aiRes.text());
        await releaseSendFlag(supabase, app.id, 'aisensy_payment_failed_sent');
      }
    } else if (!AISENSY_API_KEY) {
      console.warn('[aisensy payment_failed webhook] AISENSY_API_KEY not set, skipping WhatsApp');
    }

  } catch (err) {
    console.error('[aisensy payment_failed webhook] fire failed, releasing claim:', err);
    if (claimedWhatsApp) {
      await releaseSendFlag(supabase, app.id, 'aisensy_payment_failed_sent');
    }
  }

  try {
    await maybeSendPaymentFailureEmail(supabase, app, {
      phone: args.phone,
      userName: displayName,
      amount: formattedAmount,
      source: 'payu-webhook',
    });
  } catch (err) {
    console.error('[payu-webhook payment_failed_email] fire failed:', err);
  }
}

// ── Replay safety ────────────────────────────────────────────────────────────
//
// PayU re-delivers a webhook until it is acknowledged, and this path, the
// browser callback and verify-pending-payments can all resolve the same
// booking. Re-applying the CURRENT result is harmless; applying a STALE one is
// not — an old advance result landing after the balance was paid computes
// 'advance_paid' and walks a fully_paid booking backwards. Rank the paid
// statuses so a booking only ever moves forward. Mirrors payu-callback.
const PAID_RANK: Record<string, number> = { advance_paid: 1, fully_paid: 2 };

function isStaleStatus(current: string | null | undefined, incoming: string): boolean {
  return (PAID_RANK[current ?? ''] ?? 0) > (PAID_RANK[incoming] ?? 0);
}

// Multi-ticket: a payment row's `quantity` means different things by type, and
// the booking has a column for each — tickets bought vs heads that turned up at
// the venue and were billed the balance.
//
// Written as part of the SAME update that flips the status, never a follow-up
// write: PayU is known to deliver two success notifications for one capture, so
// a split write can land the status without the count.
//
// BOTH counts are always stamped, including 1. Skipping the write on a quantity
// of 1 looked harmless (the column defaults to 1) but is not: an abandoned lead
// who first picked 3 seats leaves a stale ticket_count on their pending row, so
// paying for a single seat later has to actively correct it. And on a balance,
// "one of the three booked actually came" is precisely the case worth keeping —
// left null it would be indistinguishable from a balance never paid.
//
// Kept BYTE-IDENTICAL in payu-callback, payu-webhook and verify-pending-payments
// rather than shared: supabase/functions/_shared/* is bundled at DEPLOY time, so
// a shared copy silently goes stale in whichever of the three is not redeployed.
function ticketCountPatch(paymentType: string, quantity: unknown): Record<string, number> {
  const raw = Math.floor(Number(quantity));
  const qty = Number.isFinite(raw) && raw >= 1 ? raw : 1;
  return paymentType === 'balance' ? { attended_count: qty } : { ticket_count: qty };
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
      .select('event_slug, phone, payment_type, event_title, amount, name, email, fbp, fbc, client_ip, client_user_agent, source_url, payu_response, quantity')
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
          .select('status, cart_abandoned, recovered_at, selected_city, attribution')
          .eq('event_slug', eventSlug)
          .eq('phone', phone)
          .maybeSingle();
        const isRecovery = !!(appRow as any)?.cart_abandoned && !(appRow as any)?.recovered_at;
        const isStale = isStaleStatus((appRow as any)?.status, newStatus);

        // Guarantee the paid buyer has a backing application row. The open flow's
        // best-effort client insert can fail (RLS reject, rate-limit, tab closed),
        // leaving a PAID customer with no row: invisible in the People tab,
        // uncounted toward capacity, and no fully-paid WhatsApp (it needs the row).
        // The webhook is often the ONLY path that runs (tab closed on PayU), so it
        // must self-heal too. Insert as 'pending' so the UPDATE below drives the
        // normal pending→paid transition; insert-or-ignore guards the race with the
        // callback twin / a late client insert. gender/why_join are NOT NULL with no
        // default (open form omits them) → empty; selected_date left null (only the
        // display-formatted trip_date is stored) → WhatsApp date falls back to event.
        if (!appRow) {
          await supabase
            .from('applications')
            .upsert({
              event_slug: eventSlug,
              name: stored.name ?? '',
              phone,
              email: stored.email ?? null,
              gender: '',
              why_join: '',
              status: 'pending',
            }, { onConflict: 'event_slug,phone', ignoreDuplicates: true });
        }

        // A stale replay must not touch the booking at all — see PAID_RANK.
        if (isStale) {
          console.warn('[payu-webhook] stale result ignored — booking is already further ahead', {
            txnid, current: (appRow as any)?.status, incoming: newStatus,
          });
        } else {
          await supabase
            .from('applications')
            .update({ status: newStatus, ...(isRecovery ? { recovered_at: new Date().toISOString() } : {}), ...ticketCountPatch(paymentType, (stored as any).quantity) })
            .eq('event_slug', eventSlug)
            .eq('phone', phone);

          // name is NOT NULL with no default here; omitting it failed every one
          // of these upserts with an unchecked 400. Mirrors payu-callback.
          const { error: submissionError } = await supabase
            .from('invite_payment_submissions')
            .upsert(
              {
                invite_slug:  eventSlug,
                event_slug:   eventSlug,
                phone,
                name:         stored.name ?? '',
                status:       newStatus,
                amount:       stored.amount ?? 0,
                event_title:  stored.event_title ?? '',
                submitted_at: new Date().toISOString(),
              },
              { onConflict: 'event_slug,phone', ignoreDuplicates: false },
            );
          if (submissionError) {
            console.error('[payu-webhook] invite_payment_submissions upsert failed:', submissionError);
          }

          // The webhook is the ONLY path that sees a payment when the customer
          // closed the tab on PayU — precisely the case the browser pixel can
          // never report. Same event_id (txnid) as the callback and the browser
          // event, so however many of the three fire, Meta records one sale.
          await sendPurchaseToMeta({
            txnid,
            value: Number(stored.amount ?? amount) || 0,
            currency: 'INR',
            email: stored.email ?? null,
            phone,
            eventSlug,
            eventTitle: stored.event_title ?? null,
            sourceUrl: (stored as any)?.source_url ?? `${Deno.env.get('FRONTEND_URL') ?? 'https://chaptera.in'}/`,
            // Same identifier set as the callback. Both paths must send an
            // identical user_data shape, or the same sale would score
            // differently depending on which one happened to report it.
            name: stored.name ?? null,
            city: (appRow as any)?.selected_city ?? null,
            fbclid: (appRow as any)?.attribution?.fbclid ?? null,
            fbclidSeenAt: (appRow as any)?.attribution?.landed_at ?? null,
            // Captured in the browser at checkout by create-payu-order. This is
            // the one identifier the server cannot derive for itself, and it is
            // what lets Meta match a sale to the browser it showed the ad to
            // when there was no ad CLICK to leave an fbclid behind.
            fbp: (stored as any)?.fbp ?? null,
            // Real cookie if checkout captured one; metaCapi falls back to
            // rebuilding from fbclid when it did not.
            fbc: (stored as any)?.fbc ?? null,
            paymentType,
            // The webhook is a server-to-server call from PayU, so req.headers
            // describes PayU's machine, not the customer — sending those would be
            // worse than sending nothing. These were captured from the customer's
            // own browser at checkout, and this is the only path that reports a
            // sale when they never came back.
            clientIp: (stored as any)?.client_ip ?? null,
            userAgent: (stored as any)?.client_user_agent ?? null,
            // How late this fires is exactly why event_time must come from PayU
            // rather than from now().
            eventTime: payuAddedOnToUnix((stored as any)?.payu_response?.addedon),
          });

          if (paymentType === 'advance') {
            await fireAdvancePaidWhatsApp(supabase, { phone, eventSlug, amount: stored.amount ?? amount, txnid });
          } else if (paymentType === 'balance') {
            await fireBalancePaidWhatsApp(supabase, { phone, eventSlug, amount: stored.amount ?? amount, txnid });
          } else if (paymentType === 'full') {
            await fireFullPaidWhatsApp(supabase, { phone, eventSlug, amount: stored.amount ?? amount, txnid });
          }
        }
      }
    } else {
      // Failure path — fire the payment_failed WhatsApp. The callback also
      // fires it, but if the user closed the tab on PayU's failure page the
      // callback never ran; the webhook is then the only path. The shared
      // aisensy_payment_failed_sent claim prevents a double-up.
      // A replayed failure from an abandoned earlier attempt must never reach
      // someone who has since paid on a different txnid — telling a paid guest
      // their payment failed would send them to pay a second time.
      if (rawSlug && phone) {
        const eventSlug = await resolveCanonicalSlug(supabase, rawSlug);
        const { data: failRow } = await supabase
          .from('applications')
          .select('status')
          .eq('event_slug', eventSlug)
          .eq('phone', phone)
          .maybeSingle();
        if (PAID_RANK[(failRow as any)?.status ?? '']) {
          console.warn('[payu-webhook] failure result ignored — booking is already paid', {
            txnid, current: (failRow as any)?.status,
          });
        } else {
          await firePaymentFailedWhatsApp(supabase, { phone, eventSlug, amount: stored.amount ?? amount, txnid });
        }
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
