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

function buildAiSensyUrlButtons(phone: string, name: string, count = 1) {
  const params = new URLSearchParams();
  params.set('phone', phone);
  params.set('name', name || 'Guest');
  const value = `?${params.toString()}`;
  return Array.from({ length: count }, (_, index) => ({
    type: 'button',
    sub_type: 'URL',
    index,
    parameters: [{ type: 'text', text: value }],
  }));
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

    const body = await req.json().catch(() => ({}));
    const deliveryKind = String(body.deliveryKind ?? '');
    const isOpenEventDetails = deliveryKind === 'open_event_details';
    const isInviteDetailsResend = deliveryKind === 'resend_invite_details';
    const isDetailsDelivery = isOpenEventDetails || isInviteDetailsResend;

    // H1: Rate limit per admin email — 30 sends per hour. Even
    // a compromised admin JWT can't burn through the AiSensy WhatsApp
    // template quota or spam invitees.
    {
      const { data: ok } = await supabase.rpc('check_rate_limit', {
        p_kind: isDetailsDelivery ? 'send-details:admin' : 'send-aisensy-invite:admin',
        p_key: callerEmail,
        p_window_seconds: 3600,
        p_max_requests: 30,
      });
      if (ok === false) return json(429, { error: 'rate limit exceeded' }, cors);
    }

    // 2. Validate inputs from client
    const phone     = String(body.phone     ?? '').replace(/\D/g, '').slice(-10);
    const userName  = String(body.userName  ?? '').trim();
    const eventName = String(body.eventName ?? '').trim();
    const eventDate = String(body.eventDate ?? '').trim();
    // Optional: the exact event slug. New frontends send it; stale ones don't,
    // in which case we resolve it from eventName (title OR slug) below.
    const eventSlug = String(body.eventSlug ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '');

    if (phone.length !== 10)   return json(400, { error: 'invalid phone' }, cors);
    if (!eventName)            return json(400, { error: 'missing eventName' }, cors);

    // The alternate details delivery is deliberately restricted to real open
    // events. This server-side check prevents a modified admin client from
    // bypassing the invite-only approval lifecycle.
    if (isOpenEventDetails) {
      if (!eventSlug) return json(400, { error: 'missing eventSlug' }, cors);
      const { data: openEvent } = await supabase
        .from('events')
        .select('slug')
        .eq('slug', eventSlug)
        .eq('booking_url', 'payu-hosted')
        .maybeSingle();
      if (!openEvent) return json(400, { error: 'not an open event' }, cors);
    }

    if (isInviteDetailsResend) {
      if (!eventSlug) return json(400, { error: 'missing eventSlug' }, cors);
      const { data: inviteEvent } = await supabase
        .from('events')
        .select('slug, booking_url')
        .eq('slug', eventSlug)
        .maybeSingle();
      if (!inviteEvent || inviteEvent.booking_url === 'payu-hosted') {
        return json(400, { error: 'not an invite-only event' }, cors);
      }
    }

    // 3+4 run CONCURRENTLY. The email invite (Brevo) never depended on the
    // WhatsApp result — it used to simply run after it, which made the admin
    // wait for AiSensy latency PLUS Brevo latency on every approval. Kicking
    // the email off first and awaiting it after the WhatsApp send makes the
    // total wait max(whatsapp, email) instead of the sum. The helper catches
    // every failure internally (never rejects), so a Brevo outage still can't
    // change the WhatsApp result returned below.

    // 4. Email invite (Brevo) — server-side so it fires regardless of which
    // frontend version the admin/marketer is running (a stale PWA that never
    // learned to call send-brevo-invite still triggers the email through here).
    // Best-effort. send-brevo-invite stays the single source of truth for the
    // email design + variant selection — we just call it, forwarding the
    // admin's token, then stamp email_invite_sent on the row.
    const sendInviteEmail = async (): Promise<void> => {
      try {
        const slug = eventSlug
          || String((await supabase.rpc('resolve_event_slug', { p_title: eventName })).data ?? '').toLowerCase();
        if (!slug) return;
        const { data: appRow } = await supabase
          .from('applications')
          .select('email, email_invite_sent')
          .eq('event_slug', slug)
          .eq('phone', phone)
          .maybeSingle();
        const inviteEmail = String(appRow?.email ?? '').trim();
        if (!inviteEmail || appRow?.email_invite_sent) return;
        const emailRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-brevo-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
          body: JSON.stringify({ email: inviteEmail, userName, eventName, eventDate }),
        });
        const emailJson = await emailRes.json().catch(() => ({}));
        if (emailRes.ok && emailJson.ok) {
          await supabase
            .from('applications')
            .update({ email_invite_sent: true, email_invite_sent_at: new Date().toISOString() })
            .eq('event_slug', slug)
            .eq('phone', phone);
        } else {
          console.warn('[send-aisensy-invite] brevo email not sent:', emailJson?.error ?? emailRes.status);
        }
      } catch (err) {
        console.error('[send-aisensy-invite] email step failed:', err);
      }
    };
    const emailPromise = isDetailsDelivery ? Promise.resolve() : sendInviteEmail();

    // 3. Forward to AiSensy
    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey:        AISENSY_API_KEY,
        campaignName:  isDetailsDelivery ? 'send_details_dpl' : 'invitation_with_contact',
        destination:   '91' + phone,
        userName,
        source:        isOpenEventDetails ? 'send-open-event-details' : isInviteDetailsResend ? 'resend-invite-details' : 'send-aisensy-invite',
        // send_details_dpl: {{1}} user name, {{2}} event name.
        templateParams: isDetailsDelivery ? [userName || 'Guest', eventName] : [eventName, eventDate],
        ...(isDetailsDelivery ? {
          media: {},
          // The approved campaign has two dynamic URL buttons. Both use the
          // same /invite?phone=&name= replacement as the open cart deeplink.
          buttons: buildAiSensyUrlButtons(phone, userName, 2),
          carouselCards: [],
          location: {},
          paramsFallbackValue: { FirstName: userName || 'Guest' },
        } : {}),
        tags:           [isOpenEventDetails ? 'chapter-open-details' : isInviteDetailsResend ? 'chapter-resend-details' : 'chapter-invite'],
        attributes:     { name: userName, event_name: eventName, event_date: eventDate, admin: callerEmail, flow: isOpenEventDetails ? 'open' : isInviteDetailsResend ? 'invite-resend' : 'invite' },
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

    // Let the concurrent email leg finish before responding, so its outcome
    // is fully logged within this invocation (edge runtime may not keep
    // work alive after the response is returned).
    await emailPromise;

    // Include a truncated AiSensy response body when the call failed, so the
    // admin toast can show the actual reason (bad key / unknown template /
    // quota / etc). On success we omit the body — saves log noise + payload.
    return json(200, {
      ok: aiRes.ok,
      status: aiRes.status,
      ...(aiRes.ok ? {} : { error: aiBody.slice(0, 300) || `aisensy http ${aiRes.status}` }),
    }, cors);
  } catch (err) {
    console.error('send-aisensy-invite error:', err);
    return json(500, { error: 'internal error' }, cors);
  }
});
