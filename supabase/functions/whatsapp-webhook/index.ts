import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// whatsapp-webhook
//
// Receives Meta's WhatsApp webhooks for OUR OWN number (Cloud API, direct) and
// files them where the Wamafy receiver used to: delivery ticks into
// whatsapp_sends, customer messages into whatsapp_inbound, everything else into
// whatsapp_send_events. People ▸ Call and People ▸ Chat read those tables and
// do not care which provider wrote the row.
//
// verify_jwt is false: Meta sends these unauthenticated. Deploy with
//   supabase functions deploy whatsapp-webhook --no-verify-jwt
//
// ENV
//   WHATSAPP_APP_SECRET            — App secret (App settings > Basic) of the
//                                    Meta app subscribed to the WhatsApp account.
//                                    Keys the HMAC that proves a POST is Meta's.
//                                    Falls back to META_APP_SECRET, because the
//                                    plan is to carry WhatsApp on the same app
//                                    as the ads webhooks (chaptera-ads), whose
//                                    secret is already stored under that name.
//                                    Set this one only if a different app is used.
//   WHATSAPP_WEBHOOK_VERIFY_TOKEN  — a string we choose. Meta echoes it back
//                                    once, during the subscription handshake.
//   WHATSAPP_LOG_SECRET            — guards the three log_whatsapp_* RPCs.
//
// WHAT IS DIFFERENT FROM WAMAFY, AND WHY THE CODE DIFFERS
//   * Meta RETRIES a delivery that does not get a 200, for days. Wamafy never
//     did. So a failed write answers 500 here and Meta sends it again; the RPCs
//     are safe to repeat (write-once timestamps, ON CONFLICT DO NOTHING).
//   * A status's `timestamp` is when it HAPPENED, in unix seconds. Wamafy's
//     occurredAt was only when the callback was dispatched.
//   * One POST can carry several statuses and several messages. Nothing here
//     reads index [0] and stops.
//   * Sending a free-form message outside the 24-hour window is ACCEPTED by the
//     API and fails later, as a `failed` status with code 131047. That status is
//     the only place the failure is ever reported.

const SIGNATURE_HEADER = 'x-hub-signature-256';
const PROVIDER = 'meta';

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Computed over the RAW body. Parsing and re-serialising changes whitespace and
// key order, and the mismatch then reads as "Meta is signing wrongly".
async function signatureMatches(rawBody: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false;
  const [scheme, provided] = header.split('=');
  if (scheme !== 'sha256' || !provided) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(rawBody));
  return timingSafeEqual(hex(mac), provided.toLowerCase());
}

// Meta sends unix SECONDS as a string. Anything unparseable becomes null so the
// RPC stamps its own now() rather than storing 1970.
function unixToIso(value: unknown): string | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000).toISOString();
}

const MEDIA_TYPES = ['image', 'video', 'audio', 'document', 'sticker'];

// What the customer actually said, across the shapes Meta uses for it. A tapped
// template button arrives as type "button"; a tapped reply button or list row
// as type "interactive".
function readInbound(m: any): { text: string | null; replyId: string | null; mediaId: string | null; mediaCaption: string | null } {
  const type = String(m?.type ?? '');
  let text: string | null = null;
  let replyId: string | null = null;
  if (type === 'text') text = m.text?.body ?? null;
  else if (type === 'button') { text = m.button?.text ?? null; replyId = m.button?.payload ?? null; }
  else if (type === 'interactive') {
    const r = m.interactive?.button_reply ?? m.interactive?.list_reply ?? null;
    text = r?.title ?? null;
    replyId = r?.id ?? null;
  } else if (type === 'reaction') text = m.reaction?.emoji ?? null;
  const media = MEDIA_TYPES.includes(type) ? m[type] : null;
  return { text, replyId, mediaId: media?.id ?? null, mediaCaption: media?.caption ?? null };
}

type Change = { field?: string; value?: any };
type Entry = { id?: string; changes?: Change[] };

Deno.serve(async (req) => {
  // ── Verification handshake ────────────────────────────────────────────────
  // Sent once, when the callback URL is saved in the app's WhatsApp settings. If
  // the challenge is not echoed back verbatim Meta refuses to save the URL.
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const expected = Deno.env.get('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (!expected) {
      console.error('[whatsapp-webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN not set — cannot complete handshake');
      return new Response('not configured', { status: 500 });
    }
    if (mode !== 'subscribe' || !token || !timingSafeEqual(token, expected)) {
      console.warn('[whatsapp-webhook] handshake rejected', JSON.stringify({ mode, hasToken: !!token }));
      return new Response('forbidden', { status: 403 });
    }
    console.log('[whatsapp-webhook] handshake ok');
    return new Response(challenge ?? '', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  // ── Notification ──────────────────────────────────────────────────────────
  const appSecret = Deno.env.get('WHATSAPP_APP_SECRET') ?? Deno.env.get('META_APP_SECRET');
  const logSecret = Deno.env.get('WHATSAPP_LOG_SECRET');
  if (!appSecret || !logSecret) {
    // Fail closed: an unverified caller could write rows into the delivery log
    // and forge a customer's message into People ▸ Chat.
    console.error('[whatsapp-webhook] not configured', JSON.stringify({ appSecret: !!appSecret, logSecret: !!logSecret }));
    return new Response(JSON.stringify({ ok: false, error: 'not_configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await req.text();
  if (!(await signatureMatches(rawBody, req.headers.get(SIGNATURE_HEADER), appSecret))) {
    console.warn('[whatsapp-webhook] REJECTED: bad or missing signature', JSON.stringify({
      hasHeader: !!req.headers.get(SIGNATURE_HEADER), bytes: rawBody.length,
    }));
    return new Response(JSON.stringify({ ok: false, error: 'bad_signature' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: { object?: string; entry?: Entry[] };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error('[whatsapp-webhook] signature valid but body is not JSON', rawBody.slice(0, 500));
    return new Response(JSON.stringify({ ok: false, error: 'bad_json' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Every write goes through here so one failure is counted, not thrown: the
  // rest of the payload still gets filed, and the response tells Meta to retry.
  let failures = 0;
  const counts = { statuses: 0, inbound: 0, other: 0 };
  const call = async (fn: string, args: Record<string, unknown>) => {
    try {
      const { error } = await supabase.rpc(fn, { p_secret: logSecret, ...args });
      if (error) { failures++; console.error(`[whatsapp-webhook] ${fn} failed:`, error.message); }
    } catch (err) {
      failures++;
      console.error(`[whatsapp-webhook] ${fn} threw:`, err);
    }
  };

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const field = String(change.field ?? '');
      const value = change.value ?? {};

      if (field !== 'messages') {
        // Template approved or rejected, quality or limit changes, account
        // alerts. Kept with no message id, so no stub row appears in
        // whatsapp_sends for something that was never a send.
        counts.other++;
        await call('log_whatsapp_status', {
          p_message_id: null, p_status: `event:${field || 'unknown'}`,
          p_provider: PROVIDER, p_raw: { account: entry.id ?? null, value },
        });
        continue;
      }

      for (const st of value.statuses ?? []) {
        counts.statuses++;
        const err = Array.isArray(st.errors) ? st.errors[0] : null;
        await call('log_whatsapp_status', {
          p_message_id: st.id ?? null,
          p_status: st.status ?? null,
          p_error_code: err?.code != null ? String(err.code) : null,
          // `details` is the specific sentence; message and title are generic.
          p_error_message: err ? (err.error_data?.details ?? err.message ?? err.title ?? null) : null,
          p_occurred_at: unixToIso(st.timestamp),
          p_to: st.recipient_id ?? null,
          p_provider: PROVIDER,
          p_raw: st,
        });
      }

      // The sender's display name travels beside the message, matched by wa_id.
      const names = new Map<string, string>();
      for (const c of value.contacts ?? []) {
        if (c?.wa_id && c?.profile?.name) names.set(String(c.wa_id), String(c.profile.name));
      }
      for (const m of value.messages ?? []) {
        counts.inbound++;
        const read = readInbound(m);
        await call('log_whatsapp_inbound', {
          p_message_id: m.id ?? null,
          p_from: String(m.from ?? ''),
          p_from_name: names.get(String(m.from ?? '')) ?? null,
          p_type: m.type ?? null,
          p_text: read.text,
          p_reply_id: read.replyId,
          p_media_id: read.mediaId,
          p_media_cap: read.mediaCaption,
          // Set when the chat was opened from a click-to-WhatsApp ad.
          p_referral: m.referral ?? null,
          p_sent_at: unixToIso(m.timestamp),
          p_provider: PROVIDER,
          p_raw: m,
        });
      }

      // Account-level errors Meta attaches to the messages field itself.
      if (Array.isArray(value.errors) && value.errors.length) {
        counts.other++;
        await call('log_whatsapp_status', {
          p_message_id: null, p_status: 'event:messages_error',
          p_provider: PROVIDER, p_raw: { account: entry.id ?? null, errors: value.errors },
        });
      }
    }
  }

  // No message text and no phone numbers in the log line.
  console.log('[whatsapp-webhook]', JSON.stringify({ ...counts, failures }));
  if (failures > 0) {
    return new Response(JSON.stringify({ ok: false, error: 'log_failed' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response('OK', { status: 200 });
});
