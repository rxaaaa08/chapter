// WhatsApp auto-reply webhook.
// Fires when someone sends "I need more details" via the wa.me link.
//
// Security model:
//   * GET  — Meta sends a one-time challenge during webhook subscription.
//            We echo the challenge back only if the verify_token matches our
//            WHATSAPP_VERIFY_TOKEN env var.
//   * POST — Meta sends incoming-message payloads signed with our app secret.
//            We require WHATSAPP_APP_SECRET to be set and the x-hub-signature-256
//            header to match HMAC-SHA256(body, app_secret). Without this, anyone
//            with the webhook URL could POST a crafted "i need more details"
//            payload and burn through our WhatsApp send quota.
//
// Vercel auto-parses req.body to JSON, but we need the raw bytes to compute
// the HMAC — so we disable the body parser and read the stream ourselves.

import crypto from 'node:crypto';

export const config = {
  api: {
    bodyParser: false,
  },
};

const VERIFY_TOKEN    = process.env.WHATSAPP_VERIFY_TOKEN;
const ACCESS_TOKEN    = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const APP_SECRET      = process.env.WHATSAPP_APP_SECRET;
const WEBSITE_LINK    = 'https://chaptera.in';

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Constant-time comparison of the received signature header against the
// HMAC we compute from the raw body. Returns true only on exact match.
function verifyMetaSignature(rawBody, headerValue) {
  if (!APP_SECRET || !headerValue) return false;
  // Header format: "sha256=<hex>"
  const prefix = 'sha256=';
  if (!headerValue.startsWith(prefix)) return false;
  const received = headerValue.slice(prefix.length);
  const expected = crypto
    .createHmac('sha256', APP_SECRET)
    .update(rawBody)
    .digest('hex');
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received, 'utf8'), Buffer.from(expected, 'utf8'));
}

export default async function handler(req, res) {

  // ── Meta one-time webhook verification (GET) ───────────────────────────────
  if (req.method === 'GET') {
    const mode      = req.query['hub.mode'];
    const token     = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // ── Incoming WhatsApp messages (POST) ──────────────────────────────────────
  if (req.method === 'POST') {
    if (!APP_SECRET) {
      // Fail closed: without the secret we can't verify, so we must not act.
      console.error('[whatsapp-webhook] WHATSAPP_APP_SECRET not set — refusing all traffic');
      return res.status(503).send('webhook not configured');
    }

    const rawBody = await readRawBody(req);
    const sigHeader = req.headers['x-hub-signature-256'] ?? req.headers['x-hub-signature'];
    if (!verifyMetaSignature(rawBody, sigHeader)) {
      console.warn('[whatsapp-webhook] signature mismatch — rejecting');
      return res.status(401).send('invalid signature');
    }

    // Parse only AFTER signature verification.
    let payload = {};
    try { payload = JSON.parse(rawBody.toString('utf8')); }
    catch { return res.status(400).send('invalid json'); }

    const messages = payload?.entry?.[0]?.changes?.[0]?.value?.messages;
    if (messages?.length) {
      const msg  = messages[0];
      const from = msg.from;
      const text = (msg.text?.body ?? '').toLowerCase().trim();

      if (text.includes('i need more details')) {
        await sendWhatsAppMessage(
          from,
          `Hi! Here are all the details about Chaptera: ${WEBSITE_LINK}`
        );
      }
    }

    return res.status(200).send('OK');
  }

  res.status(405).send('Method not allowed');
}

async function sendWhatsAppMessage(to, message) {
  await fetch(
    `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    }
  );
}
