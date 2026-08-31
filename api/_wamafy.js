// Shared helpers for the Wamafy BSP trial routes.
//
// Underscore-prefixed so Vercel does not expose it as an endpoint.
//
// WHY THESE ROUTES EXIST AT ALL
// The live site sends WhatsApp through AiSensy from six Supabase edge
// functions. There is exactly ONE deployment of those functions, shared by
// every site that points at the project, so there is no way to "point staging
// at Wamafy" by deploying a different frontend. Vercel API routes, unlike
// Supabase edge functions, deploy WITH the branch -- a preview branch gets its
// own URL, its own code and its own Preview-scoped env vars. So the whole
// Wamafy trial lives here, and the live AiSensy path is never edited.
//
// This is a TEST HARNESS, not the final architecture. Once Wamafy is proven,
// sending has to move into the edge functions, because that is where the real
// triggers fire from (payu-callback cannot be replaced by a Vercel route).

import crypto from 'node:crypto';

export const WAMAFY_BASE_URL =
  process.env.WAMAFY_BASE_URL || 'https://api.wamafy.com/api/v1/public';

export function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(typeof c === 'string' ? Buffer.from(c) : c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Wamafy signs callbacks as "sha256=" + HMAC-SHA256(raw body, signing secret).
//
// The Status webhook and the inbound Webhooks panel each issue their OWN
// signing secret -- their docs say status callbacks are "signed the same way",
// which means the same scheme, NOT the same key. Both panels point at this one
// route, so we accept either secret rather than forcing a choice between
// receiving delivery receipts and receiving inbound messages.
//
// Constant-time compare, and fail closed when no secret is set: an unverified
// callback can write rows into our log, so an unconfigured endpoint must refuse
// rather than trust.
export function verifySignature(rawBody, headerValue, secrets) {
  const list = (Array.isArray(secrets) ? secrets : [secrets]).filter(Boolean);
  if (list.length === 0 || !headerValue) return false;
  const prefix = 'sha256=';
  const received = headerValue.startsWith(prefix)
    ? headerValue.slice(prefix.length)
    : headerValue;
  return list.some(secret => {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (received.length !== expected.length) return false;
    try {
      return crypto.timingSafeEqual(
        Buffer.from(received, 'utf8'),
        Buffer.from(expected, 'utf8'),
      );
    } catch {
      return false;
    }
  });
}

// Writes go through the secret-guarded SECURITY DEFINER RPCs rather than the
// service-role key: a leaked log secret lets someone write junk into a log
// table, a leaked service-role key hands over the whole database.
async function callRpc(fn, args) {
  const url = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  const secret = process.env.WHATSAPP_LOG_SECRET;
  if (!url || !anon || !secret) {
    console.error(`[wamafy] cannot ${fn}: supabase url/anon/log-secret missing`);
    return null;
  }
  try {
    const res = await fetch(`${url}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        'apikey': anon,
        'Authorization': `Bearer ${anon}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_secret: secret, ...args }),
    });
    const body = await res.text().catch(() => '');
    if (!res.ok) console.error(`[wamafy] ${fn} failed:`, res.status, body.slice(0, 300));
    return res.ok ? body : null;
  } catch (err) {
    console.error(`[wamafy] ${fn} threw:`, err);
    return null;
  }
}

export function logSend(args) {
  return callRpc('log_whatsapp_send', {
    p_provider: 'wamafy',
    p_message_id: args.messageId ?? null,
    p_to: args.to,
    p_template: args.templateName ?? null,
    p_variables: args.variables ?? null,
    p_ok: args.ok,
    p_http_status: args.httpStatus ?? null,
    p_raw: args.raw ?? null,
  });
}

export function logStatus(args) {
  return callRpc('log_whatsapp_status', {
    p_message_id: args.messageId ?? null,
    p_status: args.status ?? null,
    p_error_code: args.errorCode ?? null,
    p_error_message: args.errorMessage ?? null,
    p_occurred_at: args.occurredAt ?? null,
    p_to: args.to ?? null,
    p_template: args.templateName ?? null,
    p_provider: 'wamafy',
    p_raw: args.raw ?? null,
  });
}

// Customer replies. Stored in their own table, NOT in whatsapp_sends: an inbound
// message is not a send, and treating it as one produced stub rows with no
// sent_at that polluted every delivery-rate query.
//
// Wamafy's two timestamps mean different things and are easy to swap: `sentAt`
// (inside `data`) is when the CUSTOMER sent the message; `occurredAt` on the
// envelope is when Wamafy dispatched the callback. Stamping a reply with
// occurredAt records our own dispatch time as theirs, so sentAt is what we keep.
export function logInbound(d, raw) {
  return callRpc('log_whatsapp_inbound', {
    p_message_id: d?.messageId ?? null,
    p_from: d?.from ?? '',
    p_from_name: d?.fromName ?? null,
    p_type: d?.type ?? null,
    p_text: d?.text ?? null,
    p_reply_id: d?.interactiveReplyId ?? null,
    p_media_id: d?.mediaId ?? null,
    p_media_cap: d?.mediaCaption ?? null,
    p_conversation: d?.conversationId ?? null,
    p_lead: d?.leadId ?? null,
    p_referral: d?.referral ?? null,
    p_sent_at: d?.sentAt ?? null,
    p_provider: 'wamafy',
    p_raw: raw ?? null,
  });
}
