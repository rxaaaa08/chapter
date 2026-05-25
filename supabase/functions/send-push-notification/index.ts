import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── VAPID helpers (pure Deno — no npm web-push needed) ───────────────────────

const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@chaptera.in';

function b64urlToUint8(b64: string): Uint8Array {
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const b64std = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64std), c => c.charCodeAt(0));
}

function uint8ToB64url(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function buildVapidJwt(audience: string): Promise<string> {
  const header = uint8ToB64url(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const payload = uint8ToB64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: VAPID_SUBJECT,
  })));
  const signingInput = `${header}.${payload}`;
  const keyData = b64urlToUint8(VAPID_PRIVATE);
  const key = await crypto.subtle.importKey(
    'pkcs8', keyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${uint8ToB64url(new Uint8Array(sig))}`;
}

async function encryptPayload(
  payload: string,
  p256dhB64: string,
  authB64: string,
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; serverPublicKey: Uint8Array }> {
  const encoder = new TextEncoder();
  const clientPublicKey = await crypto.subtle.importKey(
    'raw', b64urlToUint8(p256dhB64),
    { name: 'ECDH', namedCurve: 'P-256' },
    true, []
  );
  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  );
  const serverPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)
  );
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey },
    serverKeyPair.privateKey, 256
  );
  const authSecret = b64urlToUint8(authB64);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF for content encryption key and nonce
  const hkdf = async (ikm: ArrayBuffer, salt: Uint8Array, info: Uint8Array, length: number) => {
    const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8
    ));
  };

  const prk = await hkdf(
    sharedSecret,
    authSecret,
    encoder.encode(`WebPush: info\0${String.fromCharCode(...b64urlToUint8(p256dhB64))}${String.fromCharCode(...serverPublicKeyRaw)}`),
    32
  );
  const cek = await hkdf(prk, salt, encoder.encode('Content-Encoding: aesgcm\0'), 16);
  const nonce = await hkdf(prk, salt, encoder.encode('Content-Encoding: nonce\0'), 12);

  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const paddedPayload = new Uint8Array([0, 0, ...encoder.encode(payload)]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, paddedPayload)
  );

  return { ciphertext, salt, serverPublicKey: serverPublicKeyRaw };
}

async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }, payloadObj: object) {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await buildVapidJwt(audience);
  const authHeader = `vapid t=${jwt},k=${VAPID_PUBLIC}`;

  const payloadStr = JSON.stringify(payloadObj);
  const { ciphertext, salt, serverPublicKey } = await encryptPayload(
    payloadStr, subscription.p256dh, subscription.auth
  );

  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aesgcm',
      'Encryption': `salt=${uint8ToB64url(salt)}`,
      'Crypto-Key': `dh=${uint8ToB64url(serverPublicKey)};p256ecdsa=${VAPID_PUBLIC}`,
      'TTL': '86400',
      'Content-Length': String(ciphertext.length),
    },
    body: ciphertext,
  });

  return res;
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let phone: string;
    let notifPayload: { title: string; body: string; url: string };

    if (body.type === 'direct') {
      // ── Direct call from admin panel (approval / custom notifications) ──
      if (!body.phone) return new Response('no phone', { status: 200 });
      phone = String(body.phone).replace(/\D/g, '').slice(-10);
      notifPayload = {
        title: body.title ?? 'chapter அ',
        body: body.body ?? '',
        url: body.url ?? '/',
      };
    } else {
      // ── DB webhook: new agent message in doubt_messages ──
      const record = body.record ?? body;
      if (!record || record.sender !== 'agent') {
        return new Response('not an agent message', { status: 200 });
      }

      // Get the conversation to find the user's phone
      const { data: conv } = await supabase
        .from('doubt_conversations')
        .select('phone, event_slug')
        .eq('id', record.conversation_id)
        .single();

      if (!conv?.phone) return new Response('no phone', { status: 200 });
      phone = conv.phone;
      notifPayload = {
        title: 'chapter அ replied',
        body: record.body.length > 80 ? record.body.slice(0, 80) + '…' : record.body,
        url: '/',
      };
    }

    // Get all push subscriptions for this phone
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('phone', phone);

    if (!subs || subs.length === 0) return new Response('no subscriptions', { status: 200 });

    const results = await Promise.allSettled(
      subs.map(sub => sendWebPush(sub, notifPayload))
    );

    // Clean up expired subscriptions (410 Gone)
    const expiredEndpoints: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value.status === 410) {
        expiredEndpoints.push(subs[i].endpoint);
      }
    }
    if (expiredEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', expiredEndpoints);
    }

    return new Response(JSON.stringify({ sent: subs.length, expired: expiredEndpoints.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-push-notification error:', err);
    return new Response(String(err), { status: 500 });
  }
});
