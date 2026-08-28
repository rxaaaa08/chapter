// Wamafy trial — list approved templates.
//
// GET /api/wamafy-templates   headers: x-test-secret: <WAMAFY_TEST_SECRET>
//
// Read-only, but still secret-guarded: it reveals our template inventory.
//
// Needed before the first send. Wamafy's `buttons` array is keyed by the
// button's 0-based position IN THE TEMPLATE, not its position in the array we
// send — and only DYNAMIC buttons take a value (supplying one for a fixed URL
// or quick-reply button is rejected). This endpoint is how we find out which
// index is which for our eight templates.

import { WAMAFY_BASE_URL, requireTestSecret } from './_wamafy.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });
  if (!requireTestSecret(req, res)) return;

  const apiKey = process.env.WAMAFY_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'WAMAFY_API_KEY not configured' });

  const status = typeof req.query?.status === 'string' ? req.query.status : 'all';
  const number = typeof req.query?.number === 'string' ? req.query.number : '';
  const qs = new URLSearchParams({ status });
  if (number) qs.set('number', number);

  try {
    const wamRes = await fetch(`${WAMAFY_BASE_URL}/templates?${qs}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const text = await wamRes.text().catch(() => '');
    let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 2000) }; }
    return res.status(wamRes.status).json(json);
  } catch (err) {
    console.error('[wamafy-templates] fetch failed:', err);
    return res.status(502).json({ error: 'wamafy unreachable', detail: String(err) });
  }
}
