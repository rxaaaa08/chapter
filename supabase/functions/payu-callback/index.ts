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
// True when the event collects its balance in person. Such events deliberately
// send no balance-paid WhatsApp: the guest pays at the venue in front of us and
// the bill's success page is the confirmation. Fails OPEN (returns false) on a
// lookup error so a transient DB blip can never silently swallow a real send.
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

// ── AiSensy WhatsApp ─────────────────────────────────────────────────────────

const AISENSY_CAMPAIGN_ADVANCE = 'advance_success_dpl';
const AISENSY_CAMPAIGN_FAILED  = 'payment_failure_dpl';
const AISENSY_CAMPAIGN_BALANCE = 'fullpaid_dpl';
// Single-payment ('full') events: paid-in-full confirmation. NOTE: this
// campaign/template must exist in the AiSensy dashboard or sends will fail.
// Params: {{1}} = amount (₹…, same format as advance_paid), {{2}} = meeting-spot
// details date (located by label, NOT a fixed index — see pickMeetingSpotStep).
const AISENSY_CAMPAIGN_FULL    = 'single_payment_sucess_dpl';
// Pay-at-venue advances reuse the single-payment template, whose {{2}} is a
// "you'll get details ..." line. These events have no meeting-spot row to read a
// date from, so we pass a phrase. Must stay grammatical in the approved copy.
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

// Resolve the balance-due step exactly like the meeting-spot step above:
// labels live on the event-level timeline, while a selected date commonly only
// supplies the matching dates. Never assume the balance row is at a fixed index.
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
  if (!AISENSY_API_KEY) {
    console.warn('[aisensy advance_paid] AISENSY_API_KEY not set, skipping');
    return;
  }
  const { data: app } = await supabase
    .from('applications')
    .select('id, name, selected_date, aisensy_advance_paid_sent')
    .eq('phone', args.phone)
    .eq('event_slug', args.eventSlug)
    .maybeSingle();
  if (!app || app.aisensy_advance_paid_sent) return;          // fast path
  if (!(await claimSendFlag(supabase, app.id, 'aisensy_advance_paid_sent'))) return;  // lost the race

  try {
    const { data: ev } = await supabase
      .from('events')
      .select('booking_steps, event_dates(start_date, booking_steps)')
      .eq('slug', args.eventSlug)
      .maybeSingle();
    // Match the event-level balance row, then use the selected-date row at the
    // same index — the same robust lookup used by the paid-in-full message.
    const balStep = pickBalanceDueStep(ev, app.selected_date);
    const dueFinal = formatDueDate(balStep?.date ?? '');
    const displayName = capitalizeFirstChar(app.name || 'there');
    const buttonParam = buildInviteButtonParam(args.phone, displayName);
    const formattedAmount = formatRupeesTwoDecimals(args.amount);
    // Pay at venue has no balance deadline, so advance_success_dpl's {{2}} would
    // render EMPTY (formatDueDate('') === '') on a template whose fixed copy tells
    // the guest to settle before that date — visibly broken and factually wrong.
    // Use the already-approved single-payment template instead: its {{2}} is a
    // "when you'll get details" line, which we fill with a phrase rather than a
    // date because these events carry no meeting-spot row to read one from.
    const payAtVenue = await isPayAtVenue(supabase, args.eventSlug);

    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: payAtVenue ? AISENSY_CAMPAIGN_FULL : AISENSY_CAMPAIGN_ADVANCE,
        destination: '91' + args.phone,
        userName: displayName || 'chapter A 3063',
        templateParams: payAtVenue
          ? [formattedAmount, PAY_AT_VENUE_DETAILS_WHEN]
          : [formattedAmount, dueFinal, args.txnid],
        source: 'payu-callback',
        media: {},
        buttons: buildAiSensyUrlButton(buttonParam, 2),
        carouselCards: [],
        location: {},
        attributes: {
          event_slug: args.eventSlug,
          txn_id: args.txnid,
          amount: String(args.amount),
        },
        paramsFallbackValue: { FirstName: displayName },
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
    .select('id, name, selected_date, aisensy_balance_paid_sent')
    .eq('phone', args.phone)
    .eq('event_slug', args.eventSlug)
    .maybeSingle();
  if (!app || app.aisensy_balance_paid_sent) return;
  // Pay at venue: the balance is settled in person, with the guest standing in
  // front of us and already in the group chat. The bill's success page is the
  // confirmation — a "you're fully paid" WhatsApp adds nothing. Checked BEFORE
  // claimSendFlag so a skipped send never burns the claim.
  if (await isPayAtVenue(supabase, args.eventSlug)) return;
  if (!(await claimSendFlag(supabase, app.id, 'aisensy_balance_paid_sent'))) return;

  try {
    // {{2}} is the meeting-spot step's date — same source as the receipt warm
    // note and the invite-flow chat copy. Located by label (invite split = index
    // 3, open split = index 2), formatted May 22nd / Aug 26th per the template.
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
          formattedAmount, // {{1}} amount
          detailsDate,     // {{2}} details date
        ],
        source: 'payu-callback',
        media: {},
        buttons: buildAiSensyUrlButton(buttonParam, 2),
        carouselCards: [],
        location: {},
        attributes: {
          event_slug: args.eventSlug,
          txn_id: args.txnid,
          amount: String(args.amount),
        },
        paramsFallbackValue: { FirstName: displayName },
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
          formattedAmount, // {{1}} amount
          detailsDate,     // {{2}} details date
        ],
        source: 'payu-callback',
        media: {},
        buttons: buildAiSensyUrlButton(buttonParam, 2),
        carouselCards: [],
        location: {},
        attributes: {
          event_slug: args.eventSlug,
          txn_id: args.txnid,
          amount: String(args.amount),
        },
        paramsFallbackValue: { FirstName: displayName },
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
  // Keep the WhatsApp lookup independent of the email-only migration. If that
  // migration has not reached production yet, failure WhatsApps must still send.
  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('id, name, email, aisensy_payment_failed_sent')
    .eq('phone', args.phone)
    .eq('event_slug', args.eventSlug)
    .maybeSingle();
  if (appError) {
    console.error('[aisensy payment_failed] application lookup failed:', appError);
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
          source: 'payu-callback',
          media: {}, buttons: buildAiSensyUrlButton(buttonParam, 2), carouselCards: [], location: {},
          attributes: { event_slug: args.eventSlug, txn_id: args.txnid, amount: String(args.amount) },
          paramsFallbackValue: { FirstName: displayName },
        }),
      });

      if (!aiRes.ok) {
        console.error('[aisensy payment_failed] non-ok, releasing claim:', aiRes.status, await aiRes.text());
        await releaseSendFlag(supabase, app.id, 'aisensy_payment_failed_sent');
      }
    } else if (!AISENSY_API_KEY) {
      console.warn('[aisensy payment_failed] AISENSY_API_KEY not set, skipping WhatsApp');
    }

  } catch (err) {
    console.error('[aisensy payment_failed] fire failed, releasing claim:', err);
    if (claimedWhatsApp) {
      await releaseSendFlag(supabase, app.id, 'aisensy_payment_failed_sent');
    }
  }

  try {
    await maybeSendPaymentFailureEmail(supabase, app, {
      phone: args.phone,
      userName: displayName,
      amount: formattedAmount,
      source: 'payu-callback',
    });
  } catch (err) {
    console.error('[payu-callback payment_failed_email] fire failed:', err);
  }
}

// ── Replay safety ────────────────────────────────────────────────────────────
//
// The same payment result can reach us more than once for one booking: PayU's
// result page re-submits its form, the customer's browser replays the POST out
// of history, this path and payu-webhook both fire, or verify-pending-payments
// re-resolves the row. Observed live on 2026-08-14 — a single ₹367.69 ticket
// delivered the identical callback twice, three minutes apart.
//
// Replaying the CURRENT result is harmless: every write below either sets the
// value it already holds or is claim-flag guarded. The damage case is a STALE
// result — an old advance callback arriving after the balance was paid computes
// 'advance_paid' and walks a fully_paid booking backwards, un-paying a customer
// who has settled in full. Rank the paid statuses so a booking only ever moves
// forward; anything at or behind where we already are is ignored.
const PAID_RANK: Record<string, number> = { advance_paid: 1, fully_paid: 2 };

function isStaleStatus(current: string | null | undefined, incoming: string): boolean {
  return (PAID_RANK[current ?? ''] ?? 0) > (PAID_RANK[incoming] ?? 0);
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
      .select('event_slug, phone, payment_type, event_title, amount, name, email')
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

    // Open events (booking_url='payu-hosted') run in the /plans flow, not the
    // invite flow, so their post-payment return must route to /plans. Resolve it
    // once here so every redirect branch below picks the right destination.
    const { data: evRow } = await supabase
      .from('events')
      .select('booking_url')
      .or(`slug.eq.${stored.event_slug},invite_slug.eq.${stored.event_slug}`)
      .maybeSingle();
    const isOpenEvent = (evRow as any)?.booking_url === 'payu-hosted';

    // Pending (e.g. a slow UPI collect, or a bank transfer still settling).
    // Do NOT treat it as a failure: don't fire the payment-failed WhatsApp and
    // don't touch the application status. PayU sends the final success/failure
    // later (webhook or a follow-up callback), which resolves it. Showing a
    // 'failed' screen here would wrongly nudge a retry and risk a double charge.
    if (status === 'pending') {
      return Response.redirect(
        isOpenEvent
          ? `${FRONTEND_URL}/plans?payment_status=pending&txnid=${encodeURIComponent(txnid)}&event=${encodeURIComponent(stored.event_slug ?? '')}`
          : `${FRONTEND_URL}/invite?payment_status=pending&txnid=${encodeURIComponent(txnid)}`,
        302,
      );
    }

    if (status === 'success') {
      const rawSlug    = stored.event_slug as string | null;
      const phone      = stored.phone as string | null;
      const paymentType = (stored.payment_type as string | null) ?? 'advance';
      const newStatus  = (paymentType === 'balance' || paymentType === 'full') ? 'fully_paid' : 'advance_paid';

      if (rawSlug && phone) {
        const eventSlug = await resolveCanonicalSlug(supabase, rawSlug);

        // Recovered: if this lead had been marked cart_abandoned, stamp
        // recovered_at on the first payment that clears it — so the admin can
        // badge them "Recovered" and measure recovery from marketing nudges.
        // Set once (don't overwrite an earlier recovery on a later balance pay).
        const { data: appRow } = await supabase
          .from('applications')
          .select('status, cart_abandoned, recovered_at')
          .eq('event_slug', eventSlug)
          .eq('phone', phone)
          .maybeSingle();
        const isRecovery = !!(appRow as any)?.cart_abandoned && !(appRow as any)?.recovered_at;
        const isStale = isStaleStatus((appRow as any)?.status, newStatus);

        // Guarantee the paid buyer has a backing application row. The open flow
        // creates a 'pending' row client-side before PayU, but that best-effort
        // insert can fail (RLS reject, rate-limit, tab closed) — leaving a PAID
        // customer with no row: invisible in the People tab, uncounted toward
        // capacity, and (since fireFullPaidWhatsApp needs the row) no group-chat
        // WhatsApp. Create it now from the trusted payment record. Insert as
        // 'pending' (not the paid status) so the UPDATE below drives the normal
        // pending→paid transition the accrual/notify triggers expect. Insert-or-
        // ignore guards the race with a late client insert / the webhook twin.
        // gender/why_join are NOT NULL with no default and the open form doesn't
        // collect them, so send empty (mirrors the client insert). selected_date
        // is left null (payu_payments only stores the display-formatted trip_date),
        // so the WhatsApp meeting-spot date falls back to the event-level steps.
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

        // A stale replay must not touch the booking at all: not the status, not
        // the submission mirror, not the WhatsApp. The redirect below still runs
        // so the customer lands on their receipt either way.
        if (isStale) {
          console.warn('[payu-callback] stale result ignored — booking is already further ahead', {
            txnid, current: (appRow as any)?.status, incoming: newStatus,
          });
        } else {
          await supabase
            .from('applications')
            .update({ status: newStatus, ...(isRecovery ? { recovered_at: new Date().toISOString() } : {}) })
            .eq('event_slug', eventSlug)
            .eq('phone', phone);

          // Two separate defects kept this write failing since the table was
          // created, both silent because the error was never read: `name` is NOT
          // NULL with no default and was not being sent, and the conflict target
          // named invite_slug when the actual unique constraint is
          // (event_slug, phone). Either one alone returns a 400, so the table sat
          // permanently empty while get-user-context read it for the
          // returning-customer view. Both are fixed here; keep them in step.
          const { error: submissionError } = await supabase
            .from('invite_payment_submissions')
            .upsert({
              invite_slug: eventSlug,
              event_slug: eventSlug,
              phone,
              name: stored.name ?? '',
              status: newStatus,
              amount: stored.amount ?? 0,
              event_title: stored.event_title ?? '',
              submitted_at: new Date().toISOString(),
            }, { onConflict: 'event_slug,phone', ignoreDuplicates: false });
          if (submissionError) {
            console.error('[payu-callback] invite_payment_submissions upsert failed:', submissionError);
          }

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
        }

        return Response.redirect(
          isOpenEvent
            ? `${FRONTEND_URL}/plans?payment_status=success&txnid=${encodeURIComponent(txnid)}&event=${encodeURIComponent(eventSlug)}&payment_type=${paymentType}`
            : `${FRONTEND_URL}/invite/${eventSlug}?payment_status=success&txnid=${encodeURIComponent(txnid)}&payment_type=${paymentType}`,
          302,
        );
      }

      return Response.redirect(
        `${FRONTEND_URL}/?payment_status=success&txnid=${encodeURIComponent(txnid)}`,
        302,
      );
    } else {
      // Failure path — fire WhatsApp template if we can. A replayed failure from
      // an ABANDONED earlier attempt must never reach someone who has since paid
      // (they retried and succeeded on a different txnid): telling a paid guest
      // their payment failed would send them to pay a second time.
      if (stored?.phone && stored?.event_slug) {
        const eventSlug = await resolveCanonicalSlug(supabase, stored.event_slug);
        const { data: failRow } = await supabase
          .from('applications')
          .select('status')
          .eq('event_slug', eventSlug)
          .eq('phone', stored.phone)
          .maybeSingle();
        if (PAID_RANK[(failRow as any)?.status ?? '']) {
          console.warn('[payu-callback] failure result ignored — booking is already paid', {
            txnid, current: (failRow as any)?.status,
          });
        } else {
          await firePaymentFailedWhatsApp(supabase, {
            phone: stored.phone, eventSlug,
            amount: stored.amount ?? 0,
            txnid,
          });
        }
      }
      return Response.redirect(
        isOpenEvent
          ? `${FRONTEND_URL}/plans?payment_status=failed&txnid=${encodeURIComponent(txnid)}&event=${encodeURIComponent(stored.event_slug ?? '')}`
          : `${FRONTEND_URL}/invite?payment_status=failed&txnid=${encodeURIComponent(txnid)}`,
        302,
      );
    }
  } catch (err) {
    console.error('payu-callback error:', err);
    const txnidParam = txnidForCatch ? `&txnid=${encodeURIComponent(txnidForCatch)}` : '';
    return Response.redirect(`${FRONTEND_URL}/invite?payment_status=failed${txnidParam}`, 302);
  }
});
