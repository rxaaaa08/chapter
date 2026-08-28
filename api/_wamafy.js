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

// Wamafy signs callbacks as "sha256=" + HMAC-SHA256(raw body, signing secret),
// the same scheme Meta uses. Constant-time compare, and fail closed when the
// secret is unset -- an unverified callback can write rows into our log, so an
// unconfigured endpoint must refuse rather than trust.
export function verifySignature(rawBody, headerValue, secret) {
  if (!secret || !headerValue) return false;
  const prefix = 'sha256=';
  const received = headerValue.startsWith(prefix)
    ? headerValue.slice(prefix.length)
    : headerValue;
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
}

// Guards the trigger routes. Without this anyone who finds the preview URL can
// spend our WhatsApp quota, and the preview URL is not secret.
export function requireTestSecret(req, res) {
  const expected = process.env.WAMAFY_TEST_SECRET;
  if (!expected) {
    res.status(503).json({ error: 'WAMAFY_TEST_SECRET not configured' });
    return false;
  }
  const got = req.headers['x-test-secret'];
  if (typeof got !== 'string' || got.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected))) {
    res.status(401).json({ error: 'bad or missing x-test-secret' });
    return false;
  }
  return true;
}

// Fail-closed allowlist. The whole point of the trial is that it cannot reach a
// real customer: the second number is the only thing we are testing against, so
// an unset allowlist refuses rather than defaulting to "anyone".
export function assertAllowedRecipient(phone) {
  const raw = process.env.WAMAFY_TEST_ALLOWED_NUMBERS || '';
  const allowed = raw.split(',').map(s => s.replace(/\D/g, '').slice(-10)).filter(Boolean);
  if (allowed.length === 0) {
    return { ok: false, error: 'WAMAFY_TEST_ALLOWED_NUMBERS not set — refusing to send to anyone' };
  }
  const target = String(phone || '').replace(/\D/g, '').slice(-10);
  if (!target || !allowed.includes(target)) {
    return { ok: false, error: `recipient not in WAMAFY_TEST_ALLOWED_NUMBERS (got ...${target.slice(-4)})` };
  }
  return { ok: true, phone: target };
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
