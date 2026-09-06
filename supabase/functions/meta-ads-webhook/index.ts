import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// meta-ads-webhook
//
// Receives Meta's ads webhooks (ad_account object) and files them in
// meta_ads_events. It deliberately does NOT act on them yet: a notification
// only says that something changed, never what it changed to, so acting means
// polling the Graph API — a separate concern with its own failure modes.
//
// verify_jwt is false: Meta sends these unauthenticated. Deploy with
//   supabase functions deploy meta-ads-webhook --no-verify-jwt
//
// ENV
//   META_APP_SECRET            — App Settings > Basic. Keys the HMAC that proves
//                                a POST really came from Meta.
//   META_WEBHOOK_VERIFY_TOKEN  — a string we choose. Meta echoes it back once,
//                                during the subscription handshake.

const SIGNATURE_HEADER = 'x-hub-signature-256';

// ── The subscribe-name vs deliver-name trap ─────────────────────────────────
// Most ad_account webhooks arrive under their own name: subscribe to
// creative_fatigue, receive field='creative_fatigue'. `effective_status` is the
// exception — you subscribe with that name, but Meta delivers it inside the
// shared `field_changed` envelope with value.changed_fields=['effective_status'].
//
// A handler that switched on field==='effective_status' would never fire, and
// the symptom would be indistinguishable from Meta never sending anything. So
// nothing here switches on the subscription name: we store what Meta actually
// said in `field` and unpack `changed_fields` when the envelope carries it.
const FIELD_CHANGED = 'field_changed';

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Length-independent comparison. Overkill at our traffic, but a signature check
// that leaks timing is a signature check with an asterisk on it.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// The signature is computed over the RAW request body. Parsing to JSON and
// re-serialising changes whitespace and key order, so the HMAC would never
// match — and the failure reads as "Meta is sending bad signatures", which
// sends you debugging entirely the wrong thing. Raw bytes, always.
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

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return hex(buf);
}

type Change = { field?: string; value?: Record<string, unknown> };
type Entry = { id?: string; time?: number; changes?: Change[] };

Deno.serve(async (req) => {
  const started = Date.now();

  // ── Verification handshake ────────────────────────────────────────────────
  // Meta sends this ONCE, synchronously, while we call the subscriptions edge.
  // If the challenge is not echoed back verbatim the subscription is silently
  // not created — so this branch existing and working is a precondition for
  // subscribing at all, not an afterthought.
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const expected = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN');

    if (!expected) {
      console.error('[meta-ads-webhook] META_WEBHOOK_VERIFY_TOKEN not set — cannot complete handshake');
      return new Response('not configured', { status: 500 });
    }
    if (mode !== 'subscribe' || !token || !timingSafeEqual(token, expected)) {
      console.warn('[meta-ads-webhook] handshake rejected', JSON.stringify({ mode, hasToken: !!token }));
      return new Response('forbidden', { status: 403 });
    }
    console.log('[meta-ads-webhook] handshake ok');
    // Body must be the challenge and nothing else — no JSON wrapper, no newline.
    return new Response(challenge ?? '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  // ── Notification ──────────────────────────────────────────────────────────
  const secret = Deno.env.get('META_APP_SECRET');
  if (!secret) {
    // Fail closed. An unverified webhook endpoint is an open door for anyone
    // who learns the URL, and this one feeds an alerting path.
    console.error('[meta-ads-webhook] META_APP_SECRET not set — refusing to accept unverified payloads');
    return new Response(JSON.stringify({ ok: false, error: 'not_configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const rawBody = await req.text();

  if (!(await signatureMatches(rawBody, req.headers.get(SIGNATURE_HEADER), secret))) {
    console.warn('[meta-ads-webhook] REJECTED: bad or missing signature', JSON.stringify({
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
    // Signature was valid, so this really is Meta — a shape we cannot parse is
    // worth shouting about rather than swallowing.
    console.error('[meta-ads-webhook] signature valid but body is not JSON', rawBody.slice(0, 500));
    return new Response(JSON.stringify({ ok: false, error: 'bad_json' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const rows: Record<string, unknown>[] = [];
  for (const entry of payload.entry ?? []) {
    const entryTime = typeof entry.time === 'number' ? new Date(entry.time * 1000).toISOString() : null;
    for (const change of entry.changes ?? []) {
      const value = (change.value ?? {}) as Record<string, unknown>;
      const field = change.field ?? 'unknown';
      rows.push({
        ad_account_id: entry.id ?? null,
        field,
        changed_fields: field === FIELD_CHANGED && Array.isArray(value.changed_fields)
          ? value.changed_fields
          : null,
        object_id: typeof value.object_id === 'string' ? value.object_id : null,
        object_type: typeof value.object_type === 'string' ? value.object_type : null,
        value,
        entry_time: entryTime,
        dedup_key: await sha256Hex(
          `${entry.id ?? ''}|${field}|${entry.time ?? ''}|${JSON.stringify(value)}`,
        ),
      });
    }
  }

  if (rows.length) {
    // ignoreDuplicates: a Meta retry is byte-identical, so it collapses onto the
    // same dedup_key rather than filing the same rejection twice.
    const { error } = await supabase
      .from('meta_ads_events')
      .upsert(rows, { onConflict: 'dedup_key', ignoreDuplicates: true });
    if (error) {
      // 500 makes Meta retry, which is what we want: better a duplicate
      // delivery than a dropped rejection notice.
      console.error('[meta-ads-webhook] insert failed', error.message);
      return new Response(JSON.stringify({ ok: false, error: 'insert_failed' }), {
        status: 500, headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  console.log('[meta-ads-webhook]', JSON.stringify({
    ok: true,
    object: payload.object ?? null,
    entries: (payload.entry ?? []).length,
    changes: rows.length,
    fields: rows.map((r) => r.field),
    ms: Date.now() - started,
  }));

  // Meta retries anything slow or non-200, so acknowledge now. Reading the
  // Graph API for detail is a separate job on stored rows.
  return new Response(JSON.stringify({ ok: true, stored: rows.length }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
});
