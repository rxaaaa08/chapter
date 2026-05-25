import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── VAPID helpers ─────────────────────────────────────────────────────────────

const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:krutesh08@gmail.com';

function b64urlToUint8(b64: string): Uint8Array {
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const b64std = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64std), c => c.charCodeAt(0));
}

function uint8ToB64url(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function buildVapidJwt(audience: string): Promise<string> {
  const header  = uint8ToB64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = uint8ToB64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_SUBJECT,
  })));
  const signingInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'pkcs8', b64urlToUint8(VAPID_PRIVATE),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign'],
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${uint8ToB64url(new Uint8Array(sig))}`;
}

// ── aes128gcm encryption (RFC 8291) ──────────────────────────────────────────
// Supported by Chrome (Android) and Safari (iOS 16.4+).
// The older aesgcm draft encoding is NOT supported by iOS Safari.

async function encryptPayload(
  payload: string,
  p256dhB64: string,
  authB64: string,
): Promise<Uint8Array> {
  const enc = new TextEncoder();

  // Generate ephemeral server key pair
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'],
  );
  const serverPublicRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', serverKeyPair.publicKey),
  ); // 65 bytes uncompressed

  // Import client (subscriber) public key
  const clientPublicRaw = b64urlToUint8(p256dhB64); // 65 bytes
  const clientPublicKey = await crypto.subtle.importKey(
    'raw', clientPublicRaw,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, [],
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    serverKeyPair.privateKey, 256,
  ));

  const authSecret = b64urlToUint8(authB64);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF helper: Extract + Expand in one WebCrypto call
  const hkdf = async (ikm: Uint8Array, hkdfSalt: Uint8Array, info: Uint8Array, len: number) => {
    const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: hkdfSalt, info }, k, len * 8,
    ));
  };

  // Step 1 — derive IKM (RFC 8291 §3.3)
  // key_info = "WebPush: info" || 0x00 || ua_public (65) || as_public (65)
  const keyInfo = new Uint8Array([
    ...enc.encode('WebPush: info\x00'),
    ...clientPublicRaw,
    ...serverPublicRaw,
  ]);
  const ikm = await hkdf(sharedSecret, authSecret, keyInfo, 32);

  // Step 2 — CEK and nonce with aes128gcm context strings
  const cek   = await hkdf(ikm, salt, enc.encode('Content-Encoding: aes128gcm\x00'), 16);
  const nonce = await hkdf(ikm, salt, enc.encode('Content-Encoding: nonce\x00'), 12);

  // Step 3 — encrypt: plaintext + 0x02 (last-record delimiter per RFC 8291)
  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const plaintext = new Uint8Array([...enc.encode(payload), 0x02]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, plaintext),
  );

  // Step 4 — build RFC 8291 body header: salt(16) + rs(4,BE) + idlen(1) + as_public(65)
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096, false); // rs = 4096, big-endian
  header[20] = 65;                                         // idlen = server key length
  header.set(serverPublicRaw, 21);

  // body = header || ciphertext
  const body = new Uint8Array(header.length + ciphertext.length);
  body.set(header, 0);
  body.set(ciphertext, header.length);
  return body;
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payloadObj: object,
) {
  const url = new URL(subscription.endpoint);
  const jwt = await buildVapidJwt(`${url.protocol}//${url.host}`);

  const body = await encryptPayload(
    JSON.stringify(payloadObj),
    subscription.p256dh,
    subscription.auth,
  );

  return fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization':    `vapid t=${jwt},k=${VAPID_PUBLIC}`,
      'Content-Type':     'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL':              '86400',
      'Content-Length':   String(body.length),
    },
    body,
  });
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  try {
    const body = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let phone: string;
    let notifPayload: { title: string; body: string; url: string };

    if (body.type === 'direct') {
      // ── Direct call from admin panel (approval / custom notifications) ──
      if (!body.phone) return new Response('no phone', { status: 200 });
      phone = String(body.phone).replace(/\D/g, '').slice(-10);
      notifPayload = {
        title: body.title ?? 'chapter அ',
        body:  body.body  ?? '',
        url:   body.url   ?? '/',
      };
    } else {
      // ── DB webhook: new agent message in doubt_messages ──
      const record = body.record ?? body;
      if (!record || record.sender !== 'agent') {
        return new Response('not an agent message', { status: 200 });
      }
      const { data: conv } = await supabase
        .from('doubt_conversations')
        .select('phone')
        .eq('id', record.conversation_id)
        .single();
      if (!conv?.phone) return new Response('no phone', { status: 200 });
      phone = conv.phone;
      notifPayload = {
        title: 'chapter அ replied',
        body:  record.body.length > 80 ? record.body.slice(0, 80) + '…' : record.body,
        url:   '/',
      };
    }

    // Look up all push subscriptions for this phone number
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('phone', phone);

    if (!subs || subs.length === 0) return new Response('no subscriptions', { status: 200 });

    const results = await Promise.allSettled(subs.map(s => sendWebPush(s, notifPayload)));

    // Clean up expired subscriptions (HTTP 410)
    const expired: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value.status === 410) expired.push(subs[i].endpoint);
    }
    if (expired.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', expired);
    }

    return new Response(
      JSON.stringify({ sent: subs.length, expired: expired.length }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('send-push-notification error:', err);
    return new Response(String(err), { status: 500 });
  }
});
