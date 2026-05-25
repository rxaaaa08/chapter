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

// VAPID private keys are distributed as raw 32-byte P-256 scalars (base64url),
// but WebCrypto's importKey requires PKCS#8 DER format. Wrap the raw key here.
// Structure: SEQUENCE { version, AlgorithmIdentifier(ecPublicKey, P-256), OCTET STRING { ECPrivateKey } }
function rawP256PrivateKeyToPkcs8(rawKey: Uint8Array): Uint8Array {
  if (rawKey.length !== 32) throw new Error(`Expected 32-byte P-256 private key, got ${rawKey.length}`);
  const prefix = new Uint8Array([
    0x30, 0x41,                                                       // SEQUENCE, 65 bytes
    0x02, 0x01, 0x00,                                                  //   INTEGER version=0
    0x30, 0x13,                                                        //   SEQUENCE (algorithm), 19 bytes
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,              //     OID 1.2.840.10045.2.1 ecPublicKey
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,        //     OID 1.2.840.10045.3.1.7 P-256
    0x04, 0x27,                                                        //   OCTET STRING, 39 bytes
    0x30, 0x25,                                                        //     SEQUENCE ECPrivateKey, 37 bytes
    0x02, 0x01, 0x01,                                                  //       INTEGER version=1
    0x04, 0x20,                                                        //       OCTET STRING, 32 bytes (the private key)
  ]);
  const out = new Uint8Array(prefix.length + 32);
  out.set(prefix, 0);
  out.set(rawKey, prefix.length);
  return out;
}

async function buildVapidJwt(audience: string): Promise<string> {
  const header  = uint8ToB64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = uint8ToB64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_SUBJECT,
  })));
  const signingInput = `${header}.${payload}`;

  // Import via JWK — more reliable than PKCS#8 in Deno's WebCrypto.
  // JWK needs x and y of the public key; we extract them from VAPID_PUBLIC
  // which is the uncompressed P-256 point (0x04 || x[32] || y[32]).
  const rawPublic = b64urlToUint8(VAPID_PUBLIC);
  if (rawPublic.length !== 65 || rawPublic[0] !== 0x04) {
    throw new Error(`Bad VAPID_PUBLIC: len=${rawPublic.length} firstByte=${rawPublic[0]}`);
  }
  const x = uint8ToB64url(rawPublic.slice(1, 33));
  const y = uint8ToB64url(rawPublic.slice(33, 65));

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      'jwk',
      { kty: 'EC', crv: 'P-256', x, y, d: VAPID_PRIVATE, ext: false } as JsonWebKey,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false, ['sign'],
    );
  } catch (e: any) {
    throw new Error(`JWK_import: ${e?.name}: ${e?.message} | d_len=${VAPID_PRIVATE.length} x_len=${x.length} y_len=${y.length}`);
  }

  let sig: ArrayBuffer;
  try {
    sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput));
  } catch (e: any) {
    throw new Error(`SIGN: ${e?.name}: ${e?.message}`);
  }

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
  let jwt: string;
  try {
    jwt = await buildVapidJwt(`${url.protocol}//${url.host}`);
  } catch (e: any) {
    throw new Error(`VAPID_JWT_FAIL: ${e?.name}: ${e?.message}`);
  }

  let body: Uint8Array;
  try {
    body = await encryptPayload(JSON.stringify(payloadObj), subscription.p256dh, subscription.auth);
  } catch (e: any) {
    throw new Error(`ENCRYPT_FAIL: ${e?.name}: ${e?.message}`);
  }

  console.log(`sendWebPush jwt.length=${jwt.length} body.length=${body.length} vapid_public.length=${VAPID_PUBLIC?.length}`);

  try {
    return await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization':    `vapid t=${jwt},k=${VAPID_PUBLIC}`,
        'Content-Type':     'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'TTL':              '86400',
      },
      body,
    });
  } catch (e: any) {
    throw new Error(`FETCH_FAIL: ${e?.name}: ${e?.message}`);
  }
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

    // Log Apple/Google response for every push attempt
    const summary: any[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const ep = subs[i].endpoint;
      const host = new URL(ep).host;
      if (r.status === 'fulfilled') {
        const body = await r.value.text().catch(() => '');
        const detail = `${host} status=${r.value.status} body=${body.slice(0, 200)}`;
        console.log('push result:', detail);
        await supabase.from('push_debug_logs').insert({
          phone, step: 'push_response', status: String(r.value.status),
          detail, user_agent: 'edge-function', is_pwa: null,
        });
        summary.push({ host, status: r.value.status, body: body.slice(0, 200) });
      } else {
        const reason = String(r.reason).slice(0, 200);
        console.error('push fetch failed:', host, reason);
        await supabase.from('push_debug_logs').insert({
          phone, step: 'push_response', status: 'fetch_error',
          detail: `${host}: ${reason}`, user_agent: 'edge-function', is_pwa: null,
        });
        summary.push({ host, status: 'fetch_error', reason });
      }
    }

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
      JSON.stringify({ sent: subs.length, expired: expired.length, results: summary }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('send-push-notification error:', err);
    return new Response(String(err), { status: 500 });
  }
});
