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

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'method not allowed' }, cors);

  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? '');
  if (action !== 'request' && action !== 'verify') return reply(400, { error: 'invalid action' }, cors);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  if (action === 'request') {
    const name = String(body.name ?? '').trim().replace(/[|<>]/g, '').slice(0, 80);
    const phone = normalizePhone(body.phone);
    const email = normalizeEmail(body.email);
    const requestedSlug = String(body.event_slug ?? '').trim();
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
    const { error: insertError } = await supabase.from('open_event_otp_sessions').insert({
      verification_token: verificationToken,
      event_slug: event.slug,
      phone,
      email,
      code_hash: await sha256(`${verificationToken}:${otp}`),
      expires_at: expiresAt,
    });
    if (insertError) {
      console.error('[open-event-otp] could not create OTP session', insertError);
      return reply(500, { error: 'Could not start verification. Please try again.' }, cors);
    }

    try {
      if (delivery === 'whatsapp') {
        const apiKey = Deno.env.get('AISENSY_API_KEY');
        if (!apiKey) {
          await supabase.from('open_event_otp_sessions').delete().eq('verification_token', verificationToken);
          console.error('[open-event-otp] AISENSY_API_KEY is not configured');
          return reply(500, { error: 'WhatsApp verification is not configured yet.' }, cors);
        }
        const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey,
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
        if (!aiRes.ok || !aiSensyAccepted(responseBody)) {
          console.error('[open-event-otp] AiSensy rejected OTP', aiRes.status, responseText.slice(0, 300));
          await supabase.from('open_event_otp_sessions').delete().eq('verification_token', verificationToken);
          return reply(502, { error: 'We could not send your WhatsApp code. Please try again.' }, cors);
        }
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
      }
    } catch (error) {
      console.error(`[open-event-otp] ${delivery} request failed`, error);
      await supabase.from('open_event_otp_sessions').delete().eq('verification_token', verificationToken);
      return reply(502, { error: `We could not send your ${delivery === 'email' ? 'verification email' : 'WhatsApp code'}. Please try again.` }, cors);
    }

    return reply(200, { verification_token: verificationToken, expires_at: expiresAt, delivery }, cors);
  }

  const verificationToken = String(body.verification_token ?? '');
  const code = String(body.code ?? '').replace(/\D/g, '');
  const phone = normalizePhone(body.phone);
  const email = normalizeEmail(body.email);
  const requestedSlug = String(body.event_slug ?? '').trim();
  if (!/^[a-f0-9]{64}$/.test(verificationToken) || !/^\d{6}$/.test(code) || !phone || !email || !requestedSlug) {
    return reply(400, { error: 'Enter the six-digit code we sent to WhatsApp or email.' }, cors);
  }

  const { data: session, error: sessionError } = await supabase
    .from('open_event_otp_sessions')
    .select('id, event_slug, phone, email, code_hash, expires_at, attempts, verified_at')
    .eq('verification_token', verificationToken)
    .maybeSingle();
  if (sessionError || !session) return reply(400, { error: 'This code has expired. Re-enter your WhatsApp number to get a new code.' }, cors);
  if (session.event_slug !== requestedSlug || session.phone !== phone || session.email !== email) {
    return reply(400, { error: 'Your details changed. Re-enter your WhatsApp number to get a new code.' }, cors);
  }
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return reply(400, { error: 'This code has expired. Re-enter your WhatsApp number to get a new code.' }, cors);
  }
  if (session.verified_at) return reply(200, { verified: true, verification_token: verificationToken }, cors);
  if (session.attempts >= MAX_ATTEMPTS) {
    return reply(429, { error: 'OTP_ATTEMPTS_EXHAUSTED', attempts_exhausted: true }, cors);
  }

  const expectedHash = await sha256(`${verificationToken}:${code}`);
  if (expectedHash !== session.code_hash) {
    await supabase
      .from('open_event_otp_sessions')
      .update({ attempts: session.attempts + 1, updated_at: new Date().toISOString() })
      .eq('id', session.id)
      .eq('attempts', session.attempts)
      .is('verified_at', null);
    const remaining = Math.max(0, MAX_ATTEMPTS - session.attempts - 1);
    if (remaining === 0) {
      return reply(429, { error: 'OTP_ATTEMPTS_EXHAUSTED', attempts_exhausted: true }, cors);
    }
    return reply(400, { error: `OTP is incorrect. ${remaining} attempt${remaining === 1 ? '' : 's'} left.` }, cors);
  }

  const { error: verifyError } = await supabase
    .from('open_event_otp_sessions')
    .update({ verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', session.id)
    .is('verified_at', null);
  if (verifyError) {
    console.error('[open-event-otp] could not mark session verified', verifyError);
    return reply(500, { error: 'Could not confirm your code. Please try again.' }, cors);
  }

  return reply(200, { verified: true, verification_token: verificationToken }, cors);
});
