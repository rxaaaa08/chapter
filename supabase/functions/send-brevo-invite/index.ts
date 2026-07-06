// send-brevo-invite
//
// Server-side wrapper for the Brevo transactional email invite that admins fire
// when they approve an application. Mirrors send-aisensy-invite: the Brevo API
// key lives ONLY in the BREVO_API_KEY edge-function secret (never shipped to the
// browser), the caller's Google JWT is verified (verify_jwt=true) and we confirm
// the email is in admin_users before forwarding to Brevo.
//
// Fired in addition to the WhatsApp invite — email is a secondary channel for
// chapter events, which collect an email on the application form.
//
// Required secrets: BREVO_API_KEY.
// Optional overrides: BREVO_SENDER_EMAIL (default info@chaptera.in),
//   BREVO_SENDER_NAME (default "chapter அ"), BREVO_INVITE_BASE_URL
//   (default https://chaptera.in).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_ORIGIN = /^https:\/\/(?:[a-z0-9-]+\.)?chaptera\.in$|^https:\/\/chapter-[a-z0-9-]+\.vercel\.app$|^http:\/\/localhost:\d{4,5}$/;

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allow  = ALLOWED_ORIGIN.test(origin) ? origin : 'null';
  return {
    'Access-Control-Allow-Origin':  allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

function json(status: number, payload: any, cors: Record<string, string>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

// Basic HTML-escape so an applicant-controlled name / event title can't inject
// markup into the email body.
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inviteEmailHtml(args: {
  userName: string; eventName: string; eventDate: string; inviteUrl: string; senderName: string; logoUrl: string;
}): string {
  const name = esc(args.userName || 'there');
  const event = esc(args.eventName);
  const date = esc(args.eventDate);
  const url = args.inviteUrl; // already a sanitised same-origin URL
  const logo = esc(args.logoUrl);
  const dateLine = date
    ? `<p style="margin:0 0 20px;font-size:15px;line-height:22px;color:#4b5563;">Plan Date: <strong style="color:#111827;">${date}</strong></p>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f3f4f6;color-scheme:light;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;">
        <tr><td style="background:#EDE6D6;padding:20px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;text-align:left;">
              <span style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-weight:900;font-size:18px;letter-spacing:-0.025em;color:#000000;">chapter &#2949;</span>
            </td>
            <td align="right" style="vertical-align:middle;text-align:right;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr>
                <td style="background:#000000;border-radius:14px;padding:4px;">
                  <img src="${logo}" width="40" height="40" alt="chapter &#2949; logo" style="display:block;width:40px;height:40px;border-radius:10px;object-fit:contain;">
                </td>
              </tr></table>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">You're invited!</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:#4b5563;">Hey ${name}, you're invited to our <strong style="color:#111827;">${event}</strong>.</p>
          ${dateLine}
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
            <tr><td style="border-radius:14px;background:#FFD700;">
              <a href="${url}" target="_blank" style="display:inline-block;padding:15px 28px;font-size:16px;font-weight:800;color:#111827;text-decoration:none;border-radius:14px;">Open Invitation &#8594;</a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;line-height:20px;color:#9ca3af;">If the button doesn't work, open this link:<br><a href="${url}" target="_blank" style="color:#2563eb;word-break:break-all;">${url}</a></p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0 0 10px;font-size:12px;line-height:18px;color:#9ca3af;">Sent by ${esc(args.senderName)}. You received this because you applied to join a chapter &#2949; experience.</p>
          <p style="margin:0;font-size:12px;line-height:18px;color:#9ca3af;">Do not reply to this email. To contact us press the <strong style="color:#6b7280;">Open Invitation</strong> button.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST')    return json(405, { error: 'method not allowed' }, cors);

  try {
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    if (!BREVO_API_KEY) return json(503, { error: 'brevo not configured' }, cors);

    // 1. Verify the caller is an admin. verify_jwt=true gates anonymous traffic
    //    at the gateway; we re-validate the email is in admin_users so a stolen
    //    non-admin JWT can't trigger email blasts.
    const authHeader = req.headers.get('authorization') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user?.email) return json(401, { error: 'unauthorized' }, cors);
    const callerEmail = userData.user.email;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: adminRow } = await supabase
      .from('admin_users')
      .select('role')
      .eq('email', callerEmail)
      .maybeSingle();
    if (!adminRow) return json(403, { error: 'not an admin' }, cors);

    // Rate limit per admin email — 60 email sends per hour. A compromised admin
    // JWT can't burn through Brevo credits or spam invitees.
    {
      const { data: ok } = await supabase.rpc('check_rate_limit', {
        p_kind: 'send-brevo-invite:admin',
        p_key: callerEmail,
        p_window_seconds: 3600,
        p_max_requests: 60,
      });
      if (ok === false) return json(429, { error: 'rate limit exceeded' }, cors);
    }

    // 2. Validate inputs
    const body = await req.json().catch(() => ({}));
    const email      = String(body.email ?? '').trim();
    const userName   = String(body.userName  ?? '').trim();
    const eventName  = String(body.eventName ?? '').trim();
    const eventDate  = String(body.eventDate ?? '').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: 'invalid email' }, cors);
    if (!eventName)                                return json(400, { error: 'missing eventName' }, cors);

    // Always the canonical /invite entry point. The invite page resolves the
    // applicant by their session/phone — NOT a slug in the URL. A per-slug path
    // (…/invite/<slug>) is not a real route and 404s, so never build one.
    const baseUrl     = (Deno.env.get('BREVO_INVITE_BASE_URL') ?? 'https://chaptera.in').replace(/\/+$/, '');
    const inviteUrl   = `${baseUrl}/invite`;
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') ?? 'info@chaptera.in';
    const senderName  = Deno.env.get('BREVO_SENDER_NAME')  ?? 'chapter அ';
    const logoUrl     = Deno.env.get('BREVO_LOGO_URL')     ?? 'https://chaptera.in/chat-profile.jpg';

    // 3. Forward to Brevo
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email, name: userName || undefined }],
        subject: `You're invited to our ${eventName}!`,
        htmlContent: inviteEmailHtml({ userName, eventName, eventDate, inviteUrl, senderName, logoUrl }),
        tags: ['chapter-invite-email'],
      }),
    });
    const brevoBody = await brevoRes.text().catch(() => '');

    // Log without the full recipient address — keep correlation, don't retain PII.
    console.log('[send-brevo-invite]', {
      caller: callerEmail,
      to_tail: email.slice(-8),
      status: brevoRes.status,
      body: brevoBody.slice(0, 120),
    });

    return json(200, {
      ok: brevoRes.ok,
      status: brevoRes.status,
      ...(brevoRes.ok ? {} : { error: brevoBody.slice(0, 300) || `brevo http ${brevoRes.status}` }),
    }, cors);
  } catch (err) {
    console.error('send-brevo-invite error:', err);
    return json(500, { error: 'internal error' }, cors);
  }
});
