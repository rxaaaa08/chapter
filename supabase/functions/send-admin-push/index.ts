import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── VAPID helpers (identical to send-push-notification) ───────────────────────

const VAPID_PUBLIC  = (Deno.env.get('VAPID_PUBLIC_KEY')  ?? '').trim();
const VAPID_PRIVATE = (Deno.env.get('VAPID_PRIVATE_KEY') ?? '').trim();
const VAPID_SUBJECT = (Deno.env.get('VAPID_SUBJECT') ?? 'mailto:chapteraaa.official@gmail.com').trim();

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

  const rawPublic = b64urlToUint8(VAPID_PUBLIC);
  const x = uint8ToB64url(rawPublic.slice(1, 33));
  const y = uint8ToB64url(rawPublic.slice(33, 65));

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: 'EC', crv: 'P-256', x, y, d: VAPID_PRIVATE, ext: false } as JsonWebKey,
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

async function encryptPayload(payload: string, p256dhB64: string, authB64: string): Promise<Uint8Array> {
  const enc = new TextEncoder();

  const serverKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'],
  );
  const serverPublicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', serverKeyPair.publicKey));

  const clientPublicRaw = b64urlToUint8(p256dhB64);
  const clientPublicKey = await crypto.subtle.importKey(
    'raw', clientPublicRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, [],
  );

  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'ECDH', public: clientPublicKey }, serverKeyPair.privateKey, 256,
  ));

  const authSecret = b64urlToUint8(authB64);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const hkdf = async (ikm: Uint8Array, hkdfSalt: Uint8Array, info: Uint8Array, len: number) => {
    const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits(
      { name: 'HKDF', hash: 'SHA-256', salt: hkdfSalt, info }, k, len * 8,
    ));
  };

  const keyInfo = new Uint8Array([
    ...enc.encode('WebPush: info\x00'),
    ...clientPublicRaw,
    ...serverPublicRaw,
  ]);
  const ikm   = await hkdf(sharedSecret, authSecret, keyInfo, 32);
  const cek   = await hkdf(ikm, salt, enc.encode('Content-Encoding: aes128gcm\x00'), 16);
  const nonce = await hkdf(ikm, salt, enc.encode('Content-Encoding: nonce\x00'), 12);

  const aesKey    = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const plaintext = new Uint8Array([...enc.encode(payload), 0x02]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, plaintext));

  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, 4096, false);
  header[20] = 65;
  header.set(serverPublicRaw, 21);

  const body = new Uint8Array(header.length + ciphertext.length);
  body.set(header, 0);
  body.set(ciphertext, header.length);
  return body;
}

async function sendWebPush(
  sub: { endpoint: string; p256dh: string; auth: string },
  notif: { title: string; body: string; url: string; tag?: string },
) {
  const url = new URL(sub.endpoint);
  const jwt = await buildVapidJwt(`${url.protocol}//${url.host}`);
  const encBody = await encryptPayload(JSON.stringify(notif), sub.p256dh, sub.auth);

  return fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Authorization':    `vapid t=${jwt},k=${VAPID_PUBLIC}`,
      'Content-Type':     'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL':              '86400',
    },
    body: encBody,
  });
}

// ── Notification builders ─────────────────────────────────────────────────────

function buildNotification(type: string, record: any): { title: string; body: string; url: string; tag: string } | null {
  // Resolve event title — use event_title field if present, otherwise event_slug
  const eventLabel = (record.event_title ?? record.event_slug ?? '').replace(/-/g, ' ');
  const name = record.name ?? record.applicant_name ?? 'Someone';
  const adminUrl = 'https://chaptera.in/admin';

  switch (type) {
    case 'new_application':
      return {
        title: '📋 New Application',
        body:  `${name} applied for ${eventLabel}`,
        url:   adminUrl,
        tag:   'new-application',
      };
    case 'advance_paid':
      return {
        title: '💛 Advance Paid',
        body:  `${name} paid advance for ${eventLabel}`,
        url:   adminUrl,
        tag:   'advance-paid',
      };
    case 'fully_paid':
      return {
        title: '✅ Fully Paid',
        body:  `${name} settled full payment for ${eventLabel}`,
        url:   adminUrl,
        tag:   'fully-paid',
      };
    case 'new_doubt': {
      const preview = String(record.body ?? '').slice(0, 80);
      const convName = record.conv_name ?? 'Someone';
      return {
        title: '💬 New Doubt',
        body:  `${convName}: ${preview}`,
        url:   `${adminUrl}?tab=chats`,
        tag:   'new-doubt',
      };
    }
    default:
      return null;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  try {
    const body = await req.json();
    const type   = body.type as string;
    const record = body.record ?? {};

    console.log(`send-admin-push: type=${type} record_keys=${Object.keys(record).join(',')}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // For doubt messages we need to join the conversation to get the sender's name
    if (type === 'new_doubt' && record.conversation_id) {
      const { data: conv } = await supabase
        .from('doubt_conversations')
        .select('name')
        .eq('id', record.conversation_id)
        .single();
      if (conv?.name) record.conv_name = conv.name;
    }

    const notif = buildNotification(type, record);
    if (!notif) return new Response(`unknown type: ${type}`, { status: 200 });

    // Fetch all admin subscriptions
    const { data: subs, error: subsErr } = await supabase
      .from('admin_push_subscriptions')
      .select('endpoint, p256dh, auth');

    if (subsErr) {
      console.error('fetch subs error:', subsErr);
      return new Response('db error', { status: 500 });
    }
    if (!subs || subs.length === 0) {
      console.log('no admin subscriptions');
      return new Response('no subscriptions', { status: 200 });
    }

    console.log(`broadcasting to ${subs.length} admin device(s)`);

    const results = await Promise.allSettled(subs.map(s => sendWebPush(s, notif)));

    // Clean up expired (410) subscriptions
    const expired: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value.status === 410) {
        expired.push(subs[i].endpoint);
      }
      if (r.status === 'fulfilled') {
        const txt = await r.value.text().catch(() => '');
        console.log(`push result [${i}]: status=${r.value.status} body=${txt.slice(0, 100)}`);
      } else {
        console.error(`push error [${i}]:`, r.reason);
      }
    }
    if (expired.length > 0) {
      await supabase.from('admin_push_subscriptions').delete().in('endpoint', expired);
      console.log(`removed ${expired.length} expired subscription(s)`);
    }

    return new Response(
      JSON.stringify({ sent: subs.length, expired: expired.length }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('send-admin-push error:', err);
    return new Response(String(err), { status: 500 });
  }
});
