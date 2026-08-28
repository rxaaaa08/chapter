// Wamafy trial — delivery/read status receiver.
//
// POST /api/wamafy-webhook   (set as the Status webhook in Wamafy settings)
//
// Four things Wamafy's docs say a correct receiver must handle, all of which
// are handled in the RPC this calls rather than here:
//   1. `sent` never arrives — we record it from the send response instead.
//   2. Order is not guaranteed; `read` can arrive before `delivered`.
//   3. A status can repeat — the handler must be idempotent on (id, status).
//   4. occurredAt is when Wamafy sent the callback, not the delivery instant.
//
// Delivery is best-effort with NO retries in this version, so this must answer
// 2xx quickly and must never fail on an unexpected payload — a 500 here loses
// the event permanently. We persist the raw callback before interpreting it.

import { readRawBody, verifySignature, logStatus } from './_wamafy.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // Wamafy's dashboard "Send test" reachability check.
  if (req.method === 'GET') return res.status(200).send('ok');
  if (req.method !== 'POST') return res.status(405).send('POST only');

  const secret = process.env.WAMAFY_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed: without the secret we cannot tell a real callback from a
    // forged one, and an unverified caller could poison the delivery log.
    console.error('[wamafy-webhook] WAMAFY_WEBHOOK_SECRET not set — refusing');
    return res.status(503).send('webhook not configured');
  }

  const rawBody = await readRawBody(req);
  const sig = req.headers['x-wamafy-signature'];
  if (!verifySignature(rawBody, typeof sig === 'string' ? sig : '', secret)) {
    console.warn('[wamafy-webhook] signature mismatch — rejecting');
    return res.status(401).send('invalid signature');
  }

  let payload = {};
  try { payload = JSON.parse(rawBody.toString('utf8')); }
  catch { return res.status(400).send('invalid json'); }

  // The status callback is flat (messageId/status at the root); the inbound
  // callback nests under `data`. Read both so neither shape is dropped.
  const d = payload?.data ?? {};
  const event = payload?.event ?? req.headers['x-wamafy-event'] ?? null;
  const messageId = payload?.messageId ?? d?.messageId ?? null;

  try {
    if (event === 'message.status') {
      await logStatus({
        messageId,
        status: payload?.status ?? null,
        errorCode: payload?.errorCode ?? null,
        errorMessage: payload?.errorMessage ?? null,
        occurredAt: payload?.occurredAt ?? null,
        to: payload?.to ?? null,
        templateName: payload?.templateName ?? null,
        raw: payload,
      });
    } else {
      // Inbound messages and anything unrecognised still get stored, keyed as
      // their own event. During a trial the payloads we did not anticipate are
      // the valuable ones — a shape we silently dropped is a finding lost.
      await logStatus({
        messageId,
        status: event ? `event:${event}` : 'event:unknown',
        occurredAt: payload?.occurredAt ?? d?.sentAt ?? null,
        to: d?.from ?? payload?.to ?? null,
        raw: payload,
      });
    }
  } catch (err) {
    // Never 500: Wamafy does not retry, so a thrown error loses the event.
    console.error('[wamafy-webhook] log failed:', err);
  }

  console.log('[wamafy-webhook]', { event, messageId, status: payload?.status ?? null });
  return res.status(200).send('OK');
}
