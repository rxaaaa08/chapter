import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGIN = /^https:\/\/(?:[a-z0-9-]+\.)?chaptera\.in$|^https:\/\/chapter-[a-z0-9-]+\.vercel\.app$|^http:\/\/localhost:\d{4,5}$/;
const OTP_TTL_MS = 8 * 60 * 1000;
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

function aiSensyAccepted(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return true;
  const result = payload as Record<string, unknown>;
  return result.success !== false && result.status !== 'error' && !result.error;
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
    if (!name || !phone || !email || !requestedSlug) return reply(400, { error: 'invalid booking details' }, cors);

    const ip = clientIp(req);
    if (!(await checkRateLimit(supabase, 'open-event-otp:ip', ip, 60, 5))) {
      return reply(429, { error: 'Too many OTP requests from this network. Please wait a minute.' }, cors);
    }
    if (!(await checkRateLimit(supabase, 'open-event-otp:phone', phone, 600, 3))) {
      return reply(429, { error: 'Too many OTP requests. Please wait a few minutes and try again.' }, cors);
    }

    const event = await resolveOpenEvent(supabase, requestedSlug);
    if (!event) return reply(403, { error: 'OTP verification is only available for an active open event.' }, cors);

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

    const apiKey = Deno.env.get('AISENSY_API_KEY');
    if (!apiKey) {
      await supabase.from('open_event_otp_sessions').delete().eq('verification_token', verificationToken);
      console.error('[open-event-otp] AISENSY_API_KEY is not configured');
      return reply(500, { error: 'WhatsApp verification is not configured yet.' }, cors);
    }

    try {
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
        console.error('[open-event-otp] AiSensy rejected OTP', aiRes.status, responseText);
        await supabase.from('open_event_otp_sessions').delete().eq('verification_token', verificationToken);
        return reply(502, { error: 'We could not send your WhatsApp code. Please try again.' }, cors);
      }
    } catch (error) {
      console.error('[open-event-otp] AiSensy request failed', error);
      await supabase.from('open_event_otp_sessions').delete().eq('verification_token', verificationToken);
      return reply(502, { error: 'We could not send your WhatsApp code. Please try again.' }, cors);
    }

    return reply(200, { verification_token: verificationToken, expires_at: expiresAt }, cors);
  }

  const verificationToken = String(body.verification_token ?? '');
  const code = String(body.code ?? '').replace(/\D/g, '');
  const phone = normalizePhone(body.phone);
  const email = normalizeEmail(body.email);
  const requestedSlug = String(body.event_slug ?? '').trim();
  if (!/^[a-f0-9]{64}$/.test(verificationToken) || !/^\d{6}$/.test(code) || !phone || !email || !requestedSlug) {
    return reply(400, { error: 'Enter the six-digit code we sent on WhatsApp.' }, cors);
  }

  const { data: session, error: sessionError } = await supabase
    .from('open_event_otp_sessions')
    .select('id, event_slug, phone, email, code_hash, expires_at, attempts, verified_at')
    .eq('verification_token', verificationToken)
    .maybeSingle();
  if (sessionError || !session) return reply(400, { error: 'This code has expired. Please request a new one.' }, cors);
  if (session.event_slug !== requestedSlug || session.phone !== phone || session.email !== email) {
    return reply(400, { error: 'Your booking details changed. Please request a new code.' }, cors);
  }
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    return reply(400, { error: 'This code has expired. Please request a new one.' }, cors);
  }
  if (session.verified_at) return reply(200, { verified: true, verification_token: verificationToken }, cors);
  if (session.attempts >= MAX_ATTEMPTS) {
    return reply(429, { error: 'Too many incorrect attempts. Please request a new code.' }, cors);
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
    return reply(400, { error: `That code is incorrect. ${remaining} attempt${remaining === 1 ? '' : 's'} left.` }, cors);
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
