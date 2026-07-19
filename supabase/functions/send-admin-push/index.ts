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
      // Android delays/batches normal-urgency pushes under battery saver/doze;
      // admin alerts are time-sensitive, so ask for immediate delivery.
      'Urgency':          'high',
    },
    body: encBody,
  });
}

// ── Notification builders ─────────────────────────────────────────────────────

function formatEventDate(raw: any): string {
  if (!raw) return '';
  const s = String(raw);
  // ISO YYYY-MM-DD → "26 Sep"
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day = parseInt(m[3], 10);
  const monIdx = parseInt(m[2], 10) - 1;
  if (monIdx < 0 || monIdx > 11) return s;
  return `${day} ${months[monIdx]}`;
}

function buildNotification(type: string, record: any): { title: string; body: string; url: string; tag: string } | null {
  const eventLabel = (record.event_title ?? record.event_slug ?? '').replace(/-/g, ' ');
  const name = record.name ?? record.applicant_name ?? 'Someone';
  const eventDate = formatEventDate(record.selected_date);
  const datePart = eventDate ? ` (${eventDate})` : '';
  const adminUrl = 'https://chaptera.in/admin';

  switch (type) {
    case 'new_application':
      return {
        title: '🤠 New Application',
        body:  `${name} - ${eventLabel}${datePart}`,
        url:   adminUrl,
        tag:   'new-application',
      };
    case 'advance_paid':
      return {
        title: '✨ Advance Paid',
        body:  `${name} - ${eventLabel}${datePart}`,
        url:   adminUrl,
        tag:   'advance-paid',
      };
    case 'fully_paid':
      return {
        title: '✅ Fully Paid',
        body:  `${name} - ${eventLabel}${datePart}`,
        url:   adminUrl,
        tag:   'fully-paid',
      };
    case 'new_invite_doubt': {
      const preview = String(record.message ?? '').slice(0, 80);
      return {
        title: '🚨 Invitation Doubt',
        body:  `${eventLabel}: ${preview}`,
        url:   adminUrl,
        tag:   'new-invite-doubt',
      };
    }
    case 'new_booking_doubt': {
      const preview = String(record.doubt ?? '').slice(0, 80);
      const label = record.event_title ?? eventLabel;
      return {
        title: '🤓 Booking Doubt',
        body:  `${label}: ${preview}`,
        url:   adminUrl,
        tag:   'new-booking-doubt',
      };
    }
    case 'manager_brief':
      return {
        title: String(record.title ?? '🗞️ Daily brief'),
        body:  String(record.body ?? ''),
        url:   adminUrl,
        tag:   'manager-brief',
      };
    default:
      return null;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    // send-admin-push is invoked only by pg_net from a DB trigger, never
    // from a browser, so OPTIONS preflights shouldn't happen in practice.
    // Return an empty response with no CORS headers — if a browser does
    // try to hit this, the missing Allow-Origin makes the request fail.
    return new Response(null, { status: 204 });
  }

  // ── Shared-secret gate ─────────────────────────────────────────────────────
  // The function is deployed with verify_jwt=false because it's invoked via
  // pg_net from a DB trigger (no JWT context). To stop random internet POSTs
  // from spamming admins, every call must carry X-Admin-Push-Secret matching
  // the ADMIN_PUSH_SECRET env var. notify_admin_push() in the DB injects this
  // header automatically.
  const expectedSecret = (Deno.env.get('ADMIN_PUSH_SECRET') ?? '').trim();
  const providedSecret = (req.headers.get('x-admin-push-secret') ?? '').trim();
  if (!expectedSecret) {
    console.error('send-admin-push: ADMIN_PUSH_SECRET env var is not set; refusing all traffic');
    return new Response('not configured', { status: 503 });
  }
  if (providedSecret !== expectedSecret) {
    console.warn('send-admin-push: rejected request with missing/wrong X-Admin-Push-Secret');
    return new Response('unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const type   = body.type as string;
    const record = body.record ?? {};

    console.log(`send-admin-push: type=${type} record_keys=${Object.keys(record).join(',')}`);
    console.log(`vapid_check: pub_len=${VAPID_PUBLIC.length} priv_len=${VAPID_PRIVATE.length} sub=${VAPID_SUBJECT} pub_head=${VAPID_PUBLIC.slice(0,8)} pub_tail=${VAPID_PUBLIC.slice(-8)}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Look up event title from events table if only slug is present
    if (!record.event_title && record.event_slug) {
      const { data: ev } = await supabase
        .from('events')
        .select('title')
        .eq('slug', record.event_slug)
        .maybeSingle();
      if (ev?.title) record.event_title = ev.title;
    }

    const notif = buildNotification(type, record);
    if (!notif) return new Response(`unknown type: ${type}`, { status: 200 });

    // Fetch all subscriptions. email = device owner. NULL = unknown owner
    // (pre-column subscription or stale cached app) → gets NOTHING: most
    // legacy devices turned out to be MARKETER phones, so defaulting NULL to
    // founder-level would leak all payments + briefs to staff. Known founder
    // devices were stamped 2026-07-19; unknown owners just re-subscribe from
    // Settings (the current app stamps their email).
    const { data: allSubs, error: subsErr } = await supabase
      .from('admin_push_subscriptions')
      .select('endpoint, p256dh, auth, email');

    if (subsErr) {
      console.error('fetch subs error:', subsErr);
      return new Response('db error', { status: 500 });
    }
    if (!allSubs || allSubs.length === 0) {
      console.log('no admin subscriptions');
      return new Response('no subscriptions', { status: 200 });
    }

    // ── Per-role routing ─────────────────────────────────────────────────────
    // Founders (role=admin / legacy NULL-email devices) receive everything.
    // Staff receive only their-level activity:
    //   managers  → events they manage (record.event_slug)
    //   marketers → leads assigned to them (record.assigned_marketer_id)
    // Every other type (manager_brief = daily brief / hire alerts / weekly
    // scorecards, plus unknown types) is founder-only.
    const STAFF_TYPES = new Set(['new_application', 'advance_paid', 'fully_paid', 'new_booking_doubt', 'new_invite_doubt']);
    const staffEmails = Array.from(new Set(
      allSubs.map(s => (s.email ?? '').toLowerCase()).filter(e => e.length > 0),
    ));

    let adminEmails = new Set<string>();
    let managerEvents = new Map<string, Set<string>>();  // email → managed slugs
    let marketerIdByEmail = new Map<string, string>();
    if (staffEmails.length > 0) {
      const [{ data: adminRows }, { data: mgrRows }, { data: mkRows }] = await Promise.all([
        supabase.from('admin_users').select('email, role').in('email', staffEmails),
        supabase.from('managers').select('id, email, active, event_managers(event_slug)').in('email', staffEmails),
        supabase.from('call_marketers').select('id, email, active').in('email', staffEmails),
      ]);
      adminEmails = new Set((adminRows ?? []).filter((r: any) => r.role === 'admin').map((r: any) => String(r.email).toLowerCase()));
      (mgrRows ?? []).forEach((m: any) => {
        if (!m.active) return;
        managerEvents.set(String(m.email).toLowerCase(),
          new Set(((m.event_managers ?? []) as any[]).map(em => String(em.event_slug))));
      });
      (mkRows ?? []).forEach((m: any) => { if (m.active) marketerIdByEmail.set(String(m.email).toLowerCase(), String(m.id)); });
    }

    const eventSlug = String(record.event_slug ?? '');
    const assignedMarketer = String(record.assigned_marketer_id ?? '');
    const subs = allSubs.filter(s => {
      const email = (s.email ?? '').toLowerCase();
      if (!email) return false;                      // unknown owner — no pushes
      if (adminEmails.has(email)) return true;       // founder-owned device
      if (!STAFF_TYPES.has(type)) return false;      // founder-only content
      const managed = managerEvents.get(email);
      if (managed && eventSlug && managed.has(eventSlug)) return true;
      const mkId = marketerIdByEmail.get(email);
      if (mkId && assignedMarketer && mkId === assignedMarketer) return true;
      return false;
    });

    if (subs.length === 0) {
      console.log(`no matching devices for type=${type} (of ${allSubs.length} total)`);
      return new Response('no matching subscriptions', { status: 200 });
    }

    console.log(`sending type=${type} to ${subs.length}/${allSubs.length} device(s)`);

    const results = await Promise.allSettled(subs.map(s => sendWebPush(s, notif)));

    const perDevice: any[] = [];
    const expired: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const host = (() => { try { return new URL(subs[i].endpoint).host; } catch { return '?'; } })();
      if (r.status === 'fulfilled') {
        const txt = await r.value.text().catch(() => '');
        console.log(`push result [${i}]: host=${host} status=${r.value.status} body=${txt.slice(0, 100)}`);
        perDevice.push({ i, host, status: r.value.status, body: txt.slice(0, 200) });
        // FCM signals a dead subscription with 404 as well as 410
        if (r.value.status === 410 || r.value.status === 404) expired.push(subs[i].endpoint);
      } else {
        console.error(`push error [${i}]:`, r.reason);
        perDevice.push({ i, host, error: String(r.reason).slice(0, 200) });
      }
    }
    if (expired.length > 0) {
      await supabase.from('admin_push_subscriptions').delete().in('endpoint', expired);
      console.log(`removed ${expired.length} expired subscription(s)`);
    }

    return new Response(
      JSON.stringify({
        sent: subs.length, expired: expired.length, perDevice,
        vapid: { pub_len: VAPID_PUBLIC.length, priv_len: VAPID_PRIVATE.length, pub_head: VAPID_PUBLIC.slice(0,8), pub_tail: VAPID_PUBLIC.slice(-8) },
      }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('send-admin-push error:', err);
    return new Response(String(err), { status: 500 });
  }
});
