// Wamafy trial — trigger a template send and log it.
//
// POST /api/wamafy-send
//   headers: x-test-secret: <WAMAFY_TEST_SECRET>
//   body:    { to, templateName, variables?, buttons?, from?, language? }
//
// Guarded three ways, because a preview URL is not a secret and this endpoint
// spends money: a shared secret, a fail-closed recipient allowlist, and a
// provider key that only exists in Preview-scoped env vars.

import {
  WAMAFY_BASE_URL, requireTestSecret, assertAllowedRecipient, logSend,
} from './_wamafy.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!requireTestSecret(req, res)) return;

  const apiKey = process.env.WAMAFY_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'WAMAFY_API_KEY not configured' });

  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const { to, templateName, variables, buttons, from, language } = body;

  if (!to || !templateName) {
    return res.status(400).json({ error: 'to and templateName are required' });
  }

  const gate = assertAllowedRecipient(to);
  if (!gate.ok) return res.status(403).json({ error: gate.error });

  // Wamafy wants only the part that replaces the placeholder on a URL button —
  // it appends that to the approved prefix. Sending a full URL puts our domain
  // in the link twice. This is the same contract AiSensy has today, where we
  // pass the "?phone=…&name=…" tail and the base lives in the approved
  // template, so existing call sites port across unchanged.
  const payload = { to: String(to), templateName };
  if (variables && Object.keys(variables).length) payload.variables = variables;
  if (Array.isArray(buttons) && buttons.length)    payload.buttons = buttons;
  if (from)     payload.from = from;
  if (language) payload.language = language;

  let httpStatus = 0;
  let json = null;
  let rawText = '';

  try {
    const wamRes = await fetch(`${WAMAFY_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    httpStatus = wamRes.status;
    rawText = await wamRes.text().catch(() => '');
    json = safeParse(rawText);
  } catch (err) {
    console.error('[wamafy-send] fetch failed:', err);
    await logSend({
      messageId: null, to: gate.phone, templateName, variables,
      ok: false, httpStatus: 0, raw: { fetch_error: String(err) },
    });
    return res.status(502).json({ error: 'wamafy unreachable', detail: String(err) });
  }

  const ok = httpStatus >= 200 && httpStatus < 300 && json?.success !== false;
  // messageId is what makes delivery statuses joinable to a booking later.
  // Without it the status webhook is a pile of anonymous events.
  const messageId = json?.data?.messageId ?? json?.messageId ?? null;

  await logSend({
    messageId, to: gate.phone, templateName, variables,
    ok, httpStatus, raw: json ?? { raw: rawText.slice(0, 2000) },
  });

  console.log('[wamafy-send]', {
    to_tail: gate.phone.slice(-4), templateName, httpStatus, ok, messageId,
  });

  return res.status(ok ? 200 : 502).json({
    ok, httpStatus, messageId,
    logged: true,
    wamafy: json ?? rawText.slice(0, 600),
  });
}

function safeParse(text) {
  try { return JSON.parse(text); } catch { return null; }
}
