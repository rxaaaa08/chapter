// whatsapp-reply
//
// Lets an admin answer a customer's WhatsApp message in their own words from the
// People tab, instead of picking up a personal phone.
//
// WHY AN EDGE FUNCTION AND NOT A VERCEL ROUTE
// Production Vercel deliberately holds no WhatsApp sending key, so a bug in a
// public endpoint cannot message customers. Sending lives only here, behind
// Supabase's gateway and an admin_users check.
//
// THE 24-HOUR WINDOW
// Free-form text is only allowed within 24 hours of the CUSTOMER's last message
// (Meta's rule; Wamafy returns 400 NO_OPEN_CONVERSATION otherwise). This exposes
// a `window` action so the UI can disable the box and say why, rather than
// letting someone type a careful reply that silently bounces.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const WAMAFY_BASE_URL = Deno.env.get('WAMAFY_BASE_URL') ?? 'https://api.wamafy.com/api/v1/public';

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allow = /^https:\/\/(?:[a-z0-9-]+\.)?chaptera\.in$|^https:\/\/chapter-[a-z0-9-]+\.vercel\.app$|^http:\/\/localhost:\d{4,5}$/.test(origin)
    ? origin : 'null';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  };
}

function json(status: number, body: unknown, cors: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'POST only' }, cors);

  const apiKey = Deno.env.get('WAMAFY_API_KEY');
  if (!apiKey) return json(503, { error: 'WhatsApp replies are not configured yet.' }, cors);

  // 1. Caller must be a real admin. verify_jwt=true stops anonymous traffic at
  //    the gateway; re-checking admin_users means a stolen non-admin JWT still
  //    cannot message customers.
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
  const action = String(body.action ?? '');
  const phone = String(body.phone ?? '').replace(/\D/g, '').slice(-10);
  if (!/^\d{10}$/.test(phone)) return json(400, { error: 'invalid phone' }, cors);

  // A marketer's People ▸ Chat only ever shows their OWN leads' phones (RLS on
  // whatsapp_inbound/whatsapp_sends), but that is a read-time filter -- this
  // endpoint is the real boundary, since a phone number is just a request
  // field. Founders (role='admin') stay unrestricted; anyone else must have
  // an active, own lead on this phone or they cannot message it.
  if (adminRow.role !== 'admin') {
    const { data: marketer } = await supabase
      .from('call_marketers')
      .select('id')
      .eq('email', callerEmail)
      .eq('active', true)
      .maybeSingle();
    const ownLead = marketer
      ? await supabase
          .from('applications')
          .select('id')
          .eq('assigned_marketer_id', marketer.id)
          .eq('phone', phone)
          .limit(1)
          .maybeSingle()
      : null;
    if (!marketer || !ownLead?.data) return json(403, { error: 'not authorized for this conversation' }, cors);
  }

  // 2. Is the customer-service window open?
  if (action === 'window') {
    try {
      const res = await fetch(`${WAMAFY_BASE_URL}/window?to=91${phone}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const text = await res.text();
      let parsed: any = null;
      try { parsed = text ? JSON.parse(text) : null; } catch { /* keep raw */ }
      if (!res.ok) {
        console.error('[whatsapp-reply] window check failed:', res.status, text.slice(0, 200));
        return json(502, { error: 'could not check the reply window' }, cors);
      }
      const d = parsed?.data ?? parsed ?? {};
      return json(200, { windowOpen: !!d.windowOpen, expiresAt: d.expiresAt ?? null }, cors);
    } catch (err) {
      console.error('[whatsapp-reply] window check threw:', err);
      return json(502, { error: 'could not check the reply window' }, cors);
    }
  }

  // 2b. Window shut: answer via the doubt_assisstance template, which carries
  //     their question in {{1}} and our answer in {{2}}. Not a canned
  //     announcement -- a template shaped to deliver a specific reply, which is
  //     the only way to answer someone outside the 24-hour window.
  //
  //     It is MARKETING category and will stay that way: Meta reclassifies
  //     anything that is not strictly transactional. The consequence to know is
  //     that a guest who opted out of marketing will not receive it. That is not
  //     silent -- the send is logged and a suppression comes back as a failed
  //     status with a reason, visible in whatsapp_sends.
  if (action === 'send_doubt') {
    const question = String(body.question ?? '').trim().slice(0, 900);
    const answer   = String(body.answer   ?? '').trim().slice(0, 900);
    const name     = String(body.name ?? '').trim().replace(/[|<>]/g, '').slice(0, 60);
    if (!question || !answer) return json(400, { error: 'both the question and the answer are needed' }, cors);

    const { data: allowedT } = await supabase.rpc('check_rate_limit', {
      p_kind: 'whatsapp-reply:admin',
      p_key: callerEmail,
      p_window_seconds: 3600,
      p_max_requests: 60,
    });
    if (allowedT === false) return json(429, { error: 'too many replies in the last hour' }, cors);

    const buttonParam = `?${new URLSearchParams({ phone, name: name || 'Guest' }).toString()}`;
    try {
      const res = await fetch(`${WAMAFY_BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: `+91${phone}`,
          templateName: 'doubt_assisstance',
          variables: { '1': question, '2': answer },
          buttons: [{ index: 0, type: 'url', value: buttonParam }],
        }),
      });
      const raw = await res.text();
      let parsed: any = null;
      try { parsed = raw ? JSON.parse(raw) : null; } catch { /* keep raw */ }
      if (!res.ok || parsed?.success === false) {
        console.error('[whatsapp-reply] doubt template rejected:', res.status, raw.slice(0, 300));
        return json(502, { error: parsed?.error?.message ?? 'could not send the answer' }, cors);
      }
      const messageId = parsed?.data?.messageId ?? parsed?.messageId ?? null;
      try {
        await supabase.from('whatsapp_sends').insert({
          provider: 'wamafy',
          message_id: messageId,
          to_phone: phone,
          template_name: 'doubt_assisstance',
          // The answer, so the thread reads as a conversation rather than as
          // "a template was sent" with the content lost.
          body_text: answer,
          sent_by_email: callerEmail,
          sent_at: new Date().toISOString(),
          send_ok: true,
          send_http_status: res.status,
          raw_send: parsed,
        });
      } catch (logErr) {
        console.error('[whatsapp-reply] could not log the answer:', logErr);
      }
      console.log('[whatsapp-reply] doubt answered', { by: callerEmail, to_tail: phone.slice(-4), messageId });
      return json(200, { ok: true, messageId }, cors);
    } catch (err) {
      console.error('[whatsapp-reply] doubt send threw:', err);
      return json(502, { error: 'could not send the answer' }, cors);
    }
  }

  if (action !== 'send') return json(400, { error: 'invalid action' }, cors);

  const text = String(body.text ?? '').trim().slice(0, 4000);
  if (!text) return json(400, { error: 'message is empty' }, cors);

  // 3. Rate limit per admin. Even a compromised admin JWT should not be able to
  //    spam a customer or burn through the message allowance.
  const { data: allowed } = await supabase.rpc('check_rate_limit', {
    p_kind: 'whatsapp-reply:admin',
    p_key: callerEmail,
    p_window_seconds: 3600,
    p_max_requests: 60,
  });
  if (allowed === false) return json(429, { error: 'too many replies in the last hour' }, cors);

  try {
    const res = await fetch(`${WAMAFY_BASE_URL}/messages/text`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: `+91${phone}`, text }),
    });
    const raw = await res.text();
    let parsed: any = null;
    try { parsed = raw ? JSON.parse(raw) : null; } catch { /* keep raw */ }

    if (!res.ok || parsed?.success === false) {
      const code = parsed?.error?.code ?? '';
      // The window closed between the UI's check and the send. Say so plainly:
      // "failed" would send someone hunting for a fault that is not there.
      if (code === 'NO_OPEN_CONVERSATION' || /NO_OPEN_CONVERSATION/i.test(raw)) {
        return json(409, {
          error: 'closed',
          message: 'Their 24-hour reply window has closed, so a free-form message can no longer be sent.',
        }, cors);
      }
      console.error('[whatsapp-reply] send rejected:', res.status, raw.slice(0, 300));
      return json(502, { error: parsed?.error?.message ?? 'could not send the reply' }, cors);
    }

    const messageId = parsed?.data?.messageId ?? parsed?.messageId ?? null;

    // 4. Record it next to the template sends so the thread reads in order, and
    //    so delivery/read callbacks attach by message_id like anything else.
    //    Never allowed to fail the reply: the message has already gone.
    try {
      await supabase.from('whatsapp_sends').insert({
        provider: 'wamafy',
        message_id: messageId,
        to_phone: phone,
        template_name: null,
        body_text: text,
        sent_by_email: callerEmail,
        sent_at: new Date().toISOString(),
        send_ok: true,
        send_http_status: res.status,
        raw_send: parsed,
      });
    } catch (logErr) {
      console.error('[whatsapp-reply] could not log the reply:', logErr);
    }

    console.log('[whatsapp-reply] sent', { by: callerEmail, to_tail: phone.slice(-4), messageId });
    return json(200, { ok: true, messageId }, cors);
  } catch (err) {
    console.error('[whatsapp-reply] send threw:', err);
    return json(502, { error: 'could not send the reply' }, cors);
  }
});
