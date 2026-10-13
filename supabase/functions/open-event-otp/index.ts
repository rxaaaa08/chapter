import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGIN = /^https:\/\/(?:[a-z0-9-]+\.)?chaptera\.in$|^https:\/\/chapter-[a-z0-9-]+\.vercel\.app$|^http:\/\/localhost:\d{4,5}$/;
const OTP_TTL_MS = 8 * 60 * 1000;
const EMAIL_FALLBACK_DELAY_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN.test(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

function reply(status: number, body: Record<string, unknown>, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

function normalizePhone(value: unknown): string | null {
  const digits = String(value ?? '').replace(/\D/g, '').slice(-10);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

function normalizeEmail(value: unknown): string | null {
  const email = String(value ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

// Event/invite slugs are strictly lowercase alphanumerics + hyphens. Enforcing
// that here keeps the value safe to interpolate into the PostgREST `.or()`
// filter in resolveOpenEvent (no comma/paren/dot to smuggle extra conditions).
function normalizeSlug(value: unknown): string | null {
  const slug = String(value ?? '').trim();
  return /^[a-z0-9-]{1,120}$/.test(slug) ? slug : null;
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
    ?? req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
  return forwarded.split(',')[0].trim();
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
    // A rate-limit outage should not prevent every legitimate booking, but it
    // is logged so it can be fixed promptly.
    console.error('[open-event-otp] rate limit check failed', error);
    return true;
  }
  return data !== false;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function randomOtp(): string {
  const bytes = crypto.getRandomValues(new Uint32Array(1));
  return String(bytes[0] % 1_000_000).padStart(6, '0');
}

async function sha256(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function resolveOpenEvent(supabase: any, eventSlug: string) {
  const { data } = await supabase
    .from('events')
    .select('slug, is_active, booking_url')
    .or(`slug.eq.${eventSlug},invite_slug.eq.${eventSlug}`)
    .maybeSingle();
  if (!data || !data.is_active || data.booking_url !== 'payu-hosted') return null;
  return data;
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function aiSensyAccepted(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return true;
  const result = payload as Record<string, unknown>;
  return result.success !== false && result.status !== 'error' && !result.error;
}

// ── Meta Cloud API, direct ───────────────────────────────────────────────────
// First choice from 2026-10: our own WhatsApp account, with no provider between
// us and Meta. DORMANT until BOTH WHATSAPP_CLOUD_TOKEN and
// WHATSAPP_CLOUD_PHONE_ID are set, so this deploys ahead of the number being
// registered and changes nothing until then.
//
// Returns null when not configured (the caller moves on to the next provider),
// otherwise what Meta answered. A refusal is returned rather than thrown, so the
// caller decides whether a fallback is still worth trying.
//
// Templates carry the names they had on Wamafy, recreated in our own account
// and ALL in language "en": Meta refuses a send whose language differs from the
// approved template's, so one language everywhere removes a whole class of
// silent failure.
//
// Meta also refuses a parameter that is empty or holds a newline, a tab or four
// spaces in a row -- and a refused confirmation is worse than an odd-looking
// one, so parameters are flattened here and an empty one becomes "-".
//
// Duplicated in every sender rather than shared: supabase/functions/_shared/*
// is bundled at DEPLOY time, so an edit there silently leaves deployed callers
// on an old copy. Keep the copies byte-identical.
const WA_CLOUD_LANG = 'en';

function cloudApiConfigured(): boolean {
  return !!(Deno.env.get('WHATSAPP_CLOUD_TOKEN') && Deno.env.get('WHATSAPP_CLOUD_PHONE_ID'));
}

function cloudParam(value: unknown): string {
  const flat = String(value ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {4,}/g, '   ').trim();
  return flat || '-';
}

// ── Our own tap tracking ─────────────────────────────────────────────────────
// Meta reports a button tap to nobody, so each message carries its own code:
// minted here, added to the link tail of every button (…&wa=<code>.<button>),
// and stored on the message's row once the send is logged. /invite reports the
// code back when it opens, and log_whatsapp_click() stamps clicked_at. See the
// 20261011_whatsapp_own_click_tracking migration.
function newClickToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// One value per button, so a tap also says WHICH button it was.
function clickTaggedTails(tail: string, token: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${tail}${tail.includes('?') ? '&' : '?'}wa=${token}.${i}`);
}

// Never allowed to throw: a lost tag costs one "clicked" mark and nothing else.
async function attachClickToken(supabase: any, messageId: string | null, token: string | null | undefined): Promise<void> {
  if (!messageId || !token) return;
  try {
    const { error } = await supabase.from('whatsapp_sends').update({ click_token: token }).eq('message_id', messageId);
    if (error) console.error('[click tag] could not attach:', error.message);
  } catch (err) {
    console.error('[click tag] attach threw:', err);
  }
}

async function sendViaCloudApi(args: {
  phone: string;             // last 10 digits
  template?: string;         // omit to send free-form `text` instead
  bodyParams?: string[];
  buttonValues?: string[];   // one per DYNAMIC url button, in template order
  text?: string;
}): Promise<{ ok: boolean; messageId: string | null; status: number; raw: string; errorCode: number | null } | null> {
  const token = Deno.env.get('WHATSAPP_CLOUD_TOKEN');
  const phoneId = Deno.env.get('WHATSAPP_CLOUD_PHONE_ID');
  if (!token || !phoneId) return null;
  const base = (Deno.env.get('WHATSAPP_CLOUD_API_BASE') ?? 'https://graph.facebook.com/v24.0').replace(/\/+$/, '');

  let payload: Record<string, unknown>;
  if (args.template) {
    const components: Record<string, unknown>[] = [];
    if (args.bodyParams?.length) {
      components.push({
        type: 'body',
        parameters: args.bodyParams.map((t) => ({ type: 'text', text: cloudParam(t) })),
      });
    }
    // The same shape serves a url button's link tail and an authentication
    // template's copy-code value: Meta names both sub_type "url".
    (args.buttonValues ?? []).forEach((value, i) => {
      components.push({
        type: 'button', sub_type: 'url', index: String(i),
        parameters: [{ type: 'text', text: String(value) }],
      });
    });
    payload = {
      messaging_product: 'whatsapp', to: `91${args.phone}`, type: 'template',
      template: { name: args.template, language: { code: WA_CLOUD_LANG }, components },
    };
  } else {
    payload = {
      messaging_product: 'whatsapp', recipient_type: 'individual', to: `91${args.phone}`,
      type: 'text', text: { body: String(args.text ?? '') },
    };
  }

  // Since Meta split accounts in two (2026) a number can sit on several
  // messaging accounts, and each holds its own templates and payment method.
  // Unless a send names one, Meta chooses. On 2026-10-11 it chose a new, empty
  // account that Ads Manager had attached to our number, and every send was
  // refused: first "cannot access the provided Paid Message Account", then,
  // once access was granted, "template name does not exist". Naming ours makes
  // the choice ours. Unset, Meta decides as before.
  const messagingAccount = Deno.env.get('WHATSAPP_CLOUD_MESSAGING_ACCOUNT_ID');
  if (messagingAccount) payload.paid_messaging_account_id = messagingAccount;

  try {
    const res = await fetch(`${base}/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const raw = await res.text();
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch { /* keep raw for logs */ }
    const messageId = parsed?.messages?.[0]?.id ?? null;
    // No message id means Meta did not take it, whatever the status code says.
    return { ok: res.ok && !!messageId, messageId, status: res.status, raw, errorCode: parsed?.error?.code ?? null };
  } catch (err) {
    return { ok: false, messageId: null, status: 0, raw: String(err), errorCode: null };
  }
}

// ── WhatsApp OTP delivery ────────────────────────────────────────────────────
// Wamafy became the primary sender on 2026-08-31 (BSP migration off AiSensy).
//
// AiSensy is kept as an automatic FALLBACK rather than deleted. This template
// gates every open-event booking -- create-payu-order refuses a ticket without a
// verified OTP session -- so a Wamafy outage would otherwise stop ticket sales
// outright. Both credentials are still live, so the fallback costs nothing until
// it is needed. Remove the AiSensy branch only once Wamafy has proven itself
// over real bookings, and note that Supabase edge functions have NO rollback:
// the restore point is backup/aisensy-live-2026-08-31/.
//
// Returns which provider actually accepted the send, or null if none could.
async function sendOtpViaWhatsApp(phone: string, otp: string, name: string): Promise<
  { provider: 'meta' | 'wamafy' | 'aisensy'; messageId: string | null } | null
> {
  // Meta direct first. An authentication template takes the code twice: once in
  // the body, once as the copy-code button's value.
  const cloud = await sendViaCloudApi({ phone, template: 'otp', bodyParams: [otp], buttonValues: [otp] });
  if (cloud?.ok) return { provider: 'meta', messageId: cloud.messageId };
  if (cloud) console.error('[open-event-otp] cloud api rejected OTP', cloud.status, cloud.raw.slice(0, 300));

  const wamafyKey = Deno.env.get('WAMAFY_API_KEY');
  if (wamafyKey) {
    try {
      const res = await fetch('https://api.wamafy.com/api/v1/public/messages', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${wamafyKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: `+91${phone}`,
          templateName: 'otp',
          variables: { '1': otp },
          // Authentication templates carry a copy-code button, and WhatsApp
          // rejects the whole send when its parameter is missing.
          buttons: [{ index: 0, type: 'copy_code', value: otp }],
        }),
      });
      const text = await res.text();
      let body: any = null;
      try { body = text ? JSON.parse(text) : null; } catch { /* keep raw text for logs */ }
      if (res.ok && body?.success !== false) {
        return { provider: 'wamafy', messageId: body?.data?.messageId ?? null };
      }
      console.error('[open-event-otp] wamafy rejected OTP', res.status, text.slice(0, 300));
    } catch (err) {
      console.error('[open-event-otp] wamafy fetch failed', err);
    }
  }

  const aisensyKey = Deno.env.get('AISENSY_API_KEY');
  if (!aisensyKey) return null;
  try {
    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: aisensyKey,
        campaignName: 'otp',
        destination: `91${phone}`,
        userName: name || 'chapter A 3063',
        source: 'open-event-booking',
        templateParams: [otp],
        buttons: [{
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: otp }],
        }],
      }),
    });
    const responseText = await aiRes.text();
    let responseBody: unknown = null;
    try { responseBody = responseText ? JSON.parse(responseText) : null; } catch { /* retain raw text for logs */ }
    if (aiRes.ok && aiSensyAccepted(responseBody)) {
      return { provider: 'aisensy', messageId: null };
    }
    console.error('[open-event-otp] AiSensy rejected OTP', aiRes.status, responseText.slice(0, 300));
  } catch (err) {
    console.error('[open-event-otp] aisensy fetch failed', err);
  }
  return null;
}

// Records the send in whatsapp_sends so delivery/read callbacks can attach to it
// by message_id. Entirely optional: skipped when the secret is unset, and never
// allowed to throw -- logging must not be able to fail a booking.
// The OTP itself is deliberately NOT logged.
async function logOtpSend(supabase: any, args: {
  provider: string; messageId: string | null; phone: string; eventSlug: string;
}): Promise<void> {
  const secret = Deno.env.get('WHATSAPP_LOG_SECRET');
  if (!secret) return;
  // Attach the send to this event's booking when one already exists. Without it
  // the row is attributed by phone alone, and a guest with more than one booking
  // has that ignored entirely by the reader -- so their verification lane would
  // show nothing rather than the truth.
  //
  // Often there IS no application yet: on open events the row is created around
  // payment, and the code goes out before that. Null is the honest answer then,
  // and the backfill rule picks it up later for single-booking numbers.
  let applicationId: string | null = null;
  try {
    const { data: row } = await supabase
      .from('applications').select('id')
      .eq('event_slug', args.eventSlug).eq('phone', args.phone)
      .maybeSingle();
    applicationId = row?.id ?? null;
  } catch { /* best effort: never allowed to fail a booking */ }
  try {
    await supabase.rpc('log_whatsapp_send', {
      p_secret: secret,
      p_provider: args.provider,
      p_message_id: args.messageId,
      p_to: args.phone,
      p_template: 'otp',
      p_variables: null,
      p_ok: true,
      p_http_status: 200,
      p_raw: null,
      p_application_id: applicationId,
    });
  } catch (err) {
    console.error('[open-event-otp] send log failed', err);
  }
}

// The email twin of logOtpSend. Verification codes are deliberately claimed with
// NO application id: a resend is legitimate (rate limited to 2 per 10 minutes
// elsewhere), so this kind is excluded from the one-shot index in email_sends.
// Claiming it against a lead would block the second code and kill the booking.
//
// The OTP itself is never logged -- only that a code went out, and where to.
async function logOtpEmail(supabase: any, args: {
  email: string; messageId: string | null; ok: boolean; httpStatus: number;
}): Promise<void> {
  const secret = Deno.env.get('WHATSAPP_LOG_SECRET');
  if (!secret) return;
  try {
    const { data, error } = await supabase.rpc('claim_email_send', {
      p_secret: secret,
      p_kind: 'verification_code',
      p_to_email: args.email,
      p_application_id: null,
      p_bill_open_id: null,
      p_subject: 'Verification code',
      p_sent_by: null,
    });
    if (error || data === null) {
      if (error) console.error('[open-event-otp] email claim failed', error);
      return;
    }
    await supabase.rpc('log_email_send', {
      p_secret: secret, p_id: data, p_message_id: args.messageId,
      p_ok: args.ok, p_http_status: args.httpStatus, p_raw: null,
    });
  } catch (err) {
    console.error('[open-event-otp] email send log failed', err);
  }
}

function otpEmailHtml(args: { name: string; otp: string }): string {
  const name = esc(args.name || 'there');
  const otp = esc(args.otp);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:#f4f4f5;color-scheme:light;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;margin:0;padding:32px 16px;background:#f4f4f5;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#ffffff;border-radius:24px;overflow:hidden;">
        <tr><td style="padding:26px 32px 23px;background:#111111;text-align:left;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:20px;line-height:24px;font-weight:900;letter-spacing:-0.4px;color:#ffffff;">chapter &#2949;</p>
        </td></tr>
        <tr><td style="padding:34px 32px 12px;">
          <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:24px;line-height:31px;font-weight:800;letter-spacing:-0.35px;color:#111827;">Your verification code</p>
          <p style="margin:0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#4b5563;">Hi ${name}, use this code to continue your booking.</p>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="width:100%;background:#f7f7f8;border-radius:16px;">
            <tr><td align="center" style="padding:21px 12px;font-family:Arial,sans-serif;font-size:32px;line-height:38px;font-weight:900;letter-spacing:8px;color:#111827;">${otp}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 34px;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:21px;color:#6b7280;">This code expires in 8 minutes. Never share it with anyone.</p>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eeeeee;">
          <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;line-height:18px;color:#9ca3af;">You received this email because a booking verification was requested with this email address.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Arriving from our own WhatsApp message ───────────────────────────────────
// A guest who taps the button in a message we sent them lands on the site
// inside WhatsApp's own browser. That is the one place a code hurts: it arrives
// in the chat the browser is covering, so they must close the site to read it
// (found by the owner on his own phone, 2026-10-11).
//
// They do not need one. The link they tapped carries that message's private tap
// code (96 random bits, whatsapp_sends.click_token), which exists only inside
// the message delivered to that one WhatsApp number. Presenting it proves what
// a six-digit code proves: "I can read what was sent to this WhatsApp".
//
// Three limits keep that honest:
//   * Only a message sent INSIDE a chat the guest opened (no template name).
//     Template buttons reach people who may never have written to us, and they
//     are deliberately not part of this.
//   * Only for CHAT_LINK_TTL_MS. A typed code dies in 8 minutes; a link sits in
//     the chat on purpose, so its power to skip the code has to lapse.
//   * Only for the number the message went to. Any other number gets a code.
//
// Nothing here loosens create-payu-order, which still demands a verified
// session. This is a second way to EARN one, recorded on the row as
// verified_via = 'chat_link' (20261011_open_event_chat_link_arrival.sql).
//
// Every doubt resolves toward asking for a code: an unknown link, an old one,
// a failed lookup and a failed write all end in the ordinary OTP.
const CHAT_LINK_TTL_MS = 14 * 24 * 60 * 60 * 1000;
// Same shape src/whatsappClick.ts accepts, without the ".<button>" tail.
const CHAT_CODE = /^[A-Za-z0-9_-]{12,40}$/;

function chatCodeFrom(value: unknown): string | null {
  const code = String(value ?? '').split('.')[0];
  return CHAT_CODE.test(code) ? code : null;
}

async function resolveChatLink(supabase: any, code: string): Promise<{ sendId: number; phone: string } | null> {
  const { data, error } = await supabase
    .from('whatsapp_sends')
    .select('id, to_phone, sent_at, created_at')
    .eq('click_token', code)
    .eq('provider', 'meta')
    .is('template_name', null)
    .not('message_id', 'is', null)
    .maybeSingle();
  if (error) {
    console.error('[open-event-otp] chat link lookup failed', error);
    return null;
  }
  if (!data) return null;
  const sentAt = new Date(data.sent_at ?? data.created_at).getTime();
  if (!Number.isFinite(sentAt) || Date.now() - sentAt > CHAT_LINK_TTL_MS) return null;
  const phone = normalizePhone(data.to_phone);
  return phone ? { sendId: Number(data.id), phone } : null;
}

// ── Which visit this attempt was made in (analytics only) ────────────────────
// The site may send its visit id and browser id with a request. They are stored
// on the session row so "this code was asked for in this visit" is a recorded
// fact (docs/UNIFIED-ANALYTICS-BUILD-LOG.md, phase 6). They grant nothing and
// this function never reads them back.
//
// Two rules keep them from ever costing a booking: anything that is not a
// well-formed id is dropped, and an insert that fails with them is retried
// without them (insertSession below).
const VISIT_ID = /^[0-9a-fA-F-]{16,64}$/;

function visitIdsFrom(body: any): { session_id?: string; visitor_id?: string } {
  const out: { session_id?: string; visitor_id?: string } = {};
  if (typeof body?.session_id === 'string' && VISIT_ID.test(body.session_id)) out.session_id = body.session_id;
  if (typeof body?.visitor_id === 'string' && VISIT_ID.test(body.visitor_id)) out.visitor_id = body.visitor_id;
  return out;
}

async function insertSession(
  supabase: any,
  row: Record<string, unknown>,
  visitIds: { session_id?: string; visitor_id?: string },
): Promise<{ error: unknown }> {
  if (!visitIds.session_id && !visitIds.visitor_id) {
    return await supabase.from('open_event_otp_sessions').insert(row);
  }
  const first = await supabase.from('open_event_otp_sessions').insert({ ...row, ...visitIds });
  if (!first.error) return first;
  console.error('[open-event-otp] insert with visit ids failed, retrying without them', first.error);
  return await supabase.from('open_event_otp_sessions').insert(row);
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'method not allowed' }, cors);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? '');
  if (action !== 'request' && action !== 'verify' && action !== 'chat_prefill' && action !== 'chat_verify') {
    return reply(400, { error: 'invalid action' }, cors);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Whose message was that link from? Lets the site fill the name and number
  // blanks for someone arriving from our WhatsApp reply. Answers "not found"
  // for anything it does not recognise, so the form simply stays empty.
  if (action === 'chat_prefill') {
    const code = chatCodeFrom(body.wa);
    if (!code) return reply(200, { found: false }, cors);
    if (!(await checkRateLimit(supabase, 'open-event-otp:chat:ip', clientIp(req), 60, 20))) {
      return reply(200, { found: false }, cors);
    }
    const link = await resolveChatLink(supabase, code);
    if (!link) return reply(200, { found: false }, cors);
    // Their WhatsApp profile name, as it arrived with their own message. Often a
    // nickname, which is why the site leaves the blank editable.
    let name = '';
    try {
      const { data: lastMessage } = await supabase
        .from('whatsapp_inbound')
        .select('from_name')
        .eq('from_phone', link.phone)
        .not('from_name', 'is', null)
        .order('received_at', { ascending: false })
        .limit(1);
      name = String(lastMessage?.[0]?.from_name ?? '').replace(/[|<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
    } catch { /* a missing name is just an empty blank */ }
    return reply(200, { found: true, phone: link.phone, name }, cors);
  }

  // The same guest pressing the form's button: the link stands in for the code.
  if (action === 'chat_verify') {
    const name = String(body.name ?? '').trim().replace(/[|<>]/g, '').slice(0, 80);
    const phone = normalizePhone(body.phone);
    const email = normalizeEmail(body.email);
    const requestedSlug = normalizeSlug(body.event_slug);
    if (!name || !phone || !email || !requestedSlug) return reply(400, { error: 'invalid booking details' }, cors);

    const event = await resolveOpenEvent(supabase, requestedSlug);
    if (!event) return reply(403, { error: 'OTP verification is only available for an active open event.' }, cors);

    // One answer for every refusal, and the site reacts to it one way: it asks
    // for a code, exactly as if there had been no link.
    const useCode = () => reply(403, { error: 'verification code required', use_code: true }, cors);
    const code = chatCodeFrom(body.wa);
    if (!code) return useCode();
    if (!(await checkRateLimit(supabase, 'open-event-otp:chat:ip', clientIp(req), 60, 20))) return useCode();
    if (!(await checkRateLimit(supabase, 'open-event-otp:chat:code', code, 600, 10))) return useCode();

    const link = await resolveChatLink(supabase, code);
    if (!link || link.phone !== phone) return useCode();

    const chatToken = randomToken();
    const chatExpiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
    const { error: chatInsertError } = await insertSession(supabase, {
      verification_token: chatToken,
      event_slug: event.slug,
      phone,
      email,
      // No code exists for this session. The column is NOT NULL, so it holds a
      // hash nothing can match, and the row is born verified instead.
      code_hash: await sha256(`${chatToken}:${randomToken()}`),
      expires_at: chatExpiresAt,
      verified_at: new Date().toISOString(),
      verified_via: 'chat_link',
      via_send_id: link.sendId,
    }, visitIdsFrom(body));
    if (chatInsertError) {
      console.error('[open-event-otp] could not create chat-link session', chatInsertError);
      return useCode();
    }
    console.log('[open-event-otp] verified by chat link', { send: link.sendId });

    // The Meta Lead dedup id, by the same rule as the code path below: the
    // row's own lead_id for a returning applicant, a fresh uuid otherwise.
    let chatLeadId: string = crypto.randomUUID();
    try {
      const { data: existing } = await supabase
        .from('applications').select('lead_id')
        .eq('event_slug', event.slug).eq('phone', phone)
        .maybeSingle();
      const rowLead = String(existing?.lead_id ?? '');
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rowLead)) chatLeadId = rowLead;
    } catch { /* keep the fresh id */ }

    return reply(200, { verified: true, verification_token: chatToken, expires_at: chatExpiresAt, lead_id: chatLeadId }, cors);
  }

  if (action === 'request') {
    const name = String(body.name ?? '').trim().replace(/[|<>]/g, '').slice(0, 80);
    const phone = normalizePhone(body.phone);
    const email = normalizeEmail(body.email);
    const requestedSlug = normalizeSlug(body.event_slug);
    const delivery = String(body.delivery ?? 'whatsapp');
    if (!name || !phone || !email || !requestedSlug) return reply(400, { error: 'invalid booking details' }, cors);
    if (delivery !== 'whatsapp' && delivery !== 'email') return reply(400, { error: 'invalid OTP delivery method' }, cors);

    const event = await resolveOpenEvent(supabase, requestedSlug);
    if (!event) return reply(403, { error: 'OTP verification is only available for an active open event.' }, cors);

    if (delivery === 'email') {
      const previousToken = String(body.previous_verification_token ?? '');
      if (!/^[a-f0-9]{64}$/.test(previousToken)) {
        return reply(400, { error: 'Request a WhatsApp code before requesting an email code.' }, cors);
      }
      const { data: previousSession } = await supabase
        .from('open_event_otp_sessions')
        .select('event_slug, phone, email, created_at, expires_at')
        .eq('verification_token', previousToken)
        .maybeSingle();
      if (
        !previousSession ||
        previousSession.event_slug !== event.slug ||
        previousSession.phone !== phone ||
        new Date(previousSession.expires_at).getTime() <= Date.now()
      ) {
        return reply(400, { error: 'This verification expired. Re-enter your WhatsApp number to start again.' }, cors);
      }
      const waitMs = new Date(previousSession.created_at).getTime() + EMAIL_FALLBACK_DELAY_MS - Date.now();
      if (waitMs > 0) {
        return reply(429, { error: `Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting an email code.` }, cors);
      }
    }

    const ip = clientIp(req);
    if (!(await checkRateLimit(supabase, 'open-event-otp:ip', ip, 60, 5))) {
      return reply(429, { error: 'Too many OTP requests from this network. Please wait a minute.' }, cors);
    }
    // Decoupled per-channel budgets: the paid WhatsApp channel is cost-capped
    // (2/number/10min) WITHOUT ever starving the email fallback. Email draws on
    // its own separate budget keyed by email, so a user whose WhatsApp never
    // arrives can always get an email code — no matter how many WhatsApp tries
    // they burned. (Email delivery still requires a valid prior WhatsApp session
    // above, so this can't be abused independently.)
    if (delivery === 'whatsapp' && !(await checkRateLimit(supabase, 'open-event-otp:phone', phone, 600, 2))) {
      return reply(429, { error: 'Too many WhatsApp code requests for this number. Please wait about 10 minutes and try again.' }, cors);
    }
    if (delivery === 'email' && !(await checkRateLimit(supabase, 'open-event-otp:email', email, 600, 2))) {
      return reply(429, { error: 'Too many email code requests. Please wait about 10 minutes and try again.' }, cors);
    }

    const verificationToken = randomToken();
    const otp = randomOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
    const { error: insertError } = await insertSession(supabase, {
      verification_token: verificationToken,
      event_slug: event.slug,
      phone,
      email,
      code_hash: await sha256(`${verificationToken}:${otp}`),
      expires_at: expiresAt,
    }, visitIdsFrom(body));
    if (insertError) {
      console.error('[open-event-otp] could not create OTP session', insertError);
      return reply(500, { error: 'Could not start verification. Please try again.' }, cors);
    }

    try {
      if (delivery === 'whatsapp') {
        const sent = await sendOtpViaWhatsApp(phone, otp, name);
        if (!sent) {
          await supabase.from('open_event_otp_sessions').delete().eq('verification_token', verificationToken);
          console.error('[open-event-otp] no WhatsApp provider could send the OTP');
          return reply(502, { error: 'We could not send your WhatsApp code. Please try again.' }, cors);
        }
        console.log('[open-event-otp] OTP sent via', sent.provider);
        await logOtpSend(supabase, { provider: sent.provider, messageId: sent.messageId, phone, eventSlug: event.slug });
      } else {
        const apiKey = Deno.env.get('BREVO_API_KEY');
        if (!apiKey) {
          await supabase.from('open_event_otp_sessions').delete().eq('verification_token', verificationToken);
          console.error('[open-event-otp] BREVO_API_KEY is not configured');
          return reply(500, { error: 'Email verification is not configured yet.' }, cors);
        }
        const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') ?? 'info@chaptera.in';
        const senderName = Deno.env.get('BREVO_SENDER_NAME') ?? 'chapter அ';
        const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json',
            'accept': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email, name }],
            subject: `${otp} is your chapter அ verification code`,
            htmlContent: otpEmailHtml({ name, otp }),
            tags: ['open-event-otp'],
          }),
        });
        const responseText = await emailRes.text();
        if (!emailRes.ok) {
          console.error('[open-event-otp] Brevo rejected OTP email', emailRes.status, responseText.slice(0, 300));
          await supabase.from('open_event_otp_sessions').delete().eq('verification_token', verificationToken);
          return reply(502, { error: 'We could not send your verification email. Please try again.' }, cors);
        }
        // Logged only after Brevo accepted it, so a rejected code leaves no row.
        let otpMessageId: string | null = null;
        try { otpMessageId = responseText ? (JSON.parse(responseText)?.messageId ?? null) : null; } catch { /* keep raw for logs */ }
        await logOtpEmail(supabase, {
          email, messageId: otpMessageId, ok: true, httpStatus: emailRes.status,
        });
      }
    } catch (error) {
      console.error(`[open-event-otp] ${delivery} request failed`, error);
      await supabase.from('open_event_otp_sessions').delete().eq('verification_token', verificationToken);
      return reply(502, { error: `We could not send your ${delivery === 'email' ? 'verification email' : 'WhatsApp code'}. Please try again.` }, cors);
    }

    // The Meta Lead dedup id for this booking (cloud audit A-2, 2026-09-26).
    //
    // The browser fires its Lead the moment this code is sent, and it used to
    // mint a fresh id on every page load. A RETURNING applicant — very often
    // someone the cart-abandonment nudge brought back — already has a row whose
    // lead_id the server reported the first time, so the new browser Lead could
    // never pair with anything and Meta counted an extra Lead per return visit.
    // Seen live on 18 Sep (META-ADS-HANDOFF.md §28.3).
    //
    // So the server hands back the id to use: the row's own lead_id when one
    // exists, otherwise a fresh one the client then writes onto the row it
    // inserts. ALWAYS a uuid either way, so this public, unauthenticated
    // response never reveals whether this phone has booked before — the same
    // rule capi-lead follows. Best effort: a lookup failure still returns a
    // fresh id and never blocks the code that was just sent.
    let leadId: string = crypto.randomUUID();
    try {
      const { data: existing } = await supabase
        .from('applications').select('lead_id')
        .eq('event_slug', event.slug).eq('phone', phone)
        .maybeSingle();
      const rowLead = String(existing?.lead_id ?? '');
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rowLead)) leadId = rowLead;
    } catch { /* keep the fresh id */ }

    return reply(200, { verification_token: verificationToken, expires_at: expiresAt, delivery, lead_id: leadId }, cors);
  }

  const verificationToken = String(body.verification_token ?? '');
  const code = String(body.code ?? '').replace(/\D/g, '');
  const phone = normalizePhone(body.phone);
  const email = normalizeEmail(body.email);
  const requestedSlug = normalizeSlug(body.event_slug);
  if (!/^[a-f0-9]{64}$/.test(verificationToken) || !/^\d{6}$/.test(code) || !phone || !email || !requestedSlug) {
    return reply(400, { error: 'Enter the six-digit code we sent to WhatsApp or email.' }, cors);
  }

  // Second layer of defence: cap verify calls per session token even before we
  // touch the DB, so a flood of guesses is shed cheaply. The real cap is the
  // row-locked RPC below (which no burst can outrun); this just limits load.
  // Keyed by token, so getting a fresh code (new token) always starts clean.
  if (!(await checkRateLimit(supabase, 'open-event-otp:verify', verificationToken, 600, MAX_ATTEMPTS + 3))) {
    return reply(429, { error: 'OTP_ATTEMPTS_EXHAUSTED', attempts_exhausted: true }, cors);
  }

  // Atomic verify: attempt-count check, code comparison and increment all happen
  // inside one row-locked transaction, so concurrent guesses can never exceed
  // MAX_ATTEMPTS real comparisons against a session.
  const expectedHash = await sha256(`${verificationToken}:${code}`);
  const { data: verifyRows, error: verifyError } = await supabase.rpc('verify_open_event_otp', {
    p_token: verificationToken,
    p_expected_hash: expectedHash,
    p_event_slug: requestedSlug,
    p_phone: phone,
    p_email: email,
    p_max_attempts: MAX_ATTEMPTS,
  });
  if (verifyError) {
    console.error('[open-event-otp] verify RPC failed', verifyError);
    return reply(500, { error: 'Could not confirm your code. Please try again.' }, cors);
  }
  const result = Array.isArray(verifyRows) ? verifyRows[0] : verifyRows;
  const status = String(result?.status ?? '');
  const remaining = Number(result?.remaining ?? 0);

  switch (status) {
    case 'verified':
    case 'already_verified':
      return reply(200, { verified: true, verification_token: verificationToken }, cors);
    case 'exhausted':
      return reply(429, { error: 'OTP_ATTEMPTS_EXHAUSTED', attempts_exhausted: true }, cors);
    case 'wrong':
      return reply(400, { error: `OTP is incorrect. ${remaining} attempt${remaining === 1 ? '' : 's'} left.` }, cors);
    case 'mismatch':
      return reply(400, { error: 'Your details changed. Re-enter your WhatsApp number to get a new code.' }, cors);
    case 'expired':
    case 'not_found':
      return reply(400, { error: 'This code has expired. Re-enter your WhatsApp number to get a new code.' }, cors);
    default:
      console.error('[open-event-otp] unexpected verify status', status);
      return reply(500, { error: 'Could not confirm your code. Please try again.' }, cors);
  }
});
