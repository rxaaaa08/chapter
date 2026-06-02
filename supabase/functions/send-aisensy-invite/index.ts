// send-aisensy-invite
//
// Server-side wrapper for the AiSensy WhatsApp invite that admins fire
// when they approve an application. Before this function existed, the
// AiSensy JWT was hardcoded into AdminPanel.tsx and shipped to every
// visitor's browser — any site visitor could grab it from devtools.
//
// Now the JWT lives only in the AISENSY_API_KEY edge-function secret.
// The admin's Google JWT is verified (verify_jwt=true) and we then
// confirm the email is in admin_users before forwarding to AiSensy.

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

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST')    return json(405, { error: 'method not allowed' }, cors);

  try {
    const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
    if (!AISENSY_API_KEY) return json(503, { error: 'aisensy not configured' }, cors);

    // 1. Verify the caller is an admin (admin or ops role)
    //    verify_jwt=true gates anonymous traffic at Supabase's gateway.
    //    Beyond that, we re-validate the email is in admin_users so
    //    a stolen non-admin JWT can't trigger WhatsApp blasts.
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

    // H1: Rate limit per admin email — 30 invite sends per hour. Even
    // a compromised admin JWT can't burn through the AiSensy WhatsApp
    // template quota or spam invitees.
    {
      const { data: ok } = await supabase.rpc('check_rate_limit', {
        p_kind: 'send-aisensy-invite:admin',
        p_key: callerEmail,
        p_window_seconds: 3600,
        p_max_requests: 30,
      });
      if (ok === false) return json(429, { error: 'rate limit exceeded' }, cors);
    }

    // 2. Validate inputs from client
    const body = await req.json().catch(() => ({}));
    const phone     = String(body.phone     ?? '').replace(/\D/g, '').slice(-10);
    const userName  = String(body.userName  ?? '').trim();
    const eventName = String(body.eventName ?? '').trim();
    const eventDate = String(body.eventDate ?? '').trim();

    if (phone.length !== 10)   return json(400, { error: 'invalid phone' }, cors);
    if (!eventName)            return json(400, { error: 'missing eventName' }, cors);

    // 3. Forward to AiSensy
    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey:        AISENSY_API_KEY,
        campaignName:  'invitation_with_contact',
        destination:   '91' + phone,
        userName,
        source:        'send-aisensy-invite',
        templateParams: [eventName, eventDate],
        tags:           ['chapter-invite'],
        attributes:     { name: userName, event_name: eventName, event_date: eventDate, admin: callerEmail },
      }),
    });
    const aiBody = await aiRes.text().catch(() => '');

    // Log without full phone — log tail-4 only to keep correlation while
    // not shipping customer phone numbers to Supabase log retention.
    console.log('[send-aisensy-invite]', {
      caller: callerEmail,
      phone_tail: phone.slice(-4),
      status: aiRes.status,
      body: aiBody.slice(0, 100),
    });

    return json(200, { ok: aiRes.ok, status: aiRes.status }, cors);
  } catch (err) {
    console.error('send-aisensy-invite error:', err);
    return json(500, { error: 'internal error' }, cors);
  }
});
