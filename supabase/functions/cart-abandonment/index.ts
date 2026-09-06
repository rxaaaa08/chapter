import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// cart-abandonment
//
// Fired every 30 min by pg_cron (job 'cart-abandonment-check'). For each
// bill_opens row past its flow's window (open events 1h, invite events 2h) that
// hasn't been messaged AND is still unpaid, flags the application
// cart_abandoned and sends a re-engagement WhatsApp: both invite and open events
// get `car_abandon_deeplink2` with a dynamic /invite deeplink CTA. Applicants with
// an email on file also get a Brevo cart-abandon email (/invite?phone=&name= deep
// link). Skips only terminal states (paid application, successful
// nudged via payment_failed) — pending payu_payments rows (clicked Pay, bailed
// on PayU) remain eligible.
//
// SECURITY: the AiSensy API key and the force-mode secret used to be
// hardcoded in this file (a leaked secret shipped in deployed code). Both
// now read from edge-function env vars:
//   AISENSY_API_KEY  — shared project secret, same one the payu-* and
//                      send-aisensy-invite functions already use.
//   CRON_SECRET      — guards the manual ?force=true test path. If unset,
//                      force mode is disabled (fail-closed). The normal
//                      pg_cron invocation does NOT use it, so scheduled runs
//                      keep working regardless.
// verify_jwt is false because pg_cron (pg_net) calls this without a JWT.

const AISENSY_CAMPAIGN_CART = 'car_abandon_deeplink2';
// Open events reuse the same deeplink template. Keeping a separate constant
// makes the open branch explicit without changing trigger behavior.

// Format the date the applicant chose as "Monday, March 5th" — matches the
// invite invitation template's date param so both WhatsApp templates read the
// same way. Returns '' for a missing/invalid date.
function formatEventDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return '';
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
  const month = d.toLocaleDateString('en-US', { month: 'long' });
  const day = d.getDate();
  const s = ['th', 'st', 'nd', 'rd'], v = day % 100;
  const suffix = (s[(v - 20) % 10] || s[v] || s[0]);
  return `${dayName}, ${month} ${day}${suffix}`;
}

function capitalizeFirstChar(value: string): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'User';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function buildInviteButtonParam(phone: string, name: string): string {
  const params = new URLSearchParams();
  params.set('phone', phone);
  params.set('name', name);
  return `?${params.toString()}`;
}

function buildAiSensyUrlButton(value: string) {
  return [
    {
      type: 'button',
      sub_type: 'URL',
      index: 0,
      parameters: [
        {
          type: 'text',
          text: value,
        },
      ],
    },
  ];
}

// ── Cart-abandonment EMAIL (Brevo) — invite + open events ─────────────────────
// Mirrors the send-brevo-invite design (beige header, Inter wordmark, yellow
// button) with cart-abandon copy. Sent when the applicant left an email on file.
// Invite + open: Contact Us deep-links to /invite?phone=&name= so the poster
// verification step is skipped. Best-effort — WhatsApp is primary and fires first.

function buildInviteContactUrl(baseUrl: string, phone: string, name: string): string {
  const params = new URLSearchParams();
  params.set('phone', phone);
  const n = (name || '').trim();
  if (n && n !== 'there') params.set('name', n);
  return `${baseUrl}/invite?${params.toString()}`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function cartAbandonEmailHtml(args: {
  userName: string; eventName: string; contactUrl: string; senderName: string;
}): string {
  const name = esc(args.userName || 'there');
  const event = esc(args.eventName);
  const url = args.contactUrl;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#f3f4f6;color-scheme:light;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;">
        <tr><td style="background:#000000;padding:20px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;text-align:left;">
              <span style="font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-weight:900;font-size:18px;letter-spacing:-0.025em;color:#ffffff;">chapter &#2949;</span>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">We're here to help you&hellip;</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#4b5563;">Hey ${name}, we're trying to give you the best <strong style="color:#111827;">${event}</strong> experience.</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#4b5563;">You were only 1 step away from joining us&hellip;</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:#4b5563;">If something felt unclear or if you'd like talk to us - press Contact Us.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
            <tr><td style="border-radius:14px;background:#000000;">
              <a href="${url}" target="_blank" style="display:inline-block;padding:15px 28px;font-size:16px;font-weight:800;color:#ffffff;text-decoration:none;border-radius:14px;">Contact Us &#8594;</a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;line-height:20px;color:#9ca3af;">If the button doesn't work, open this link:<br><a href="${url}" target="_blank" style="color:#2563eb;word-break:break-all;">${url}</a></p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #f3f4f6;">
          <p style="margin:0 0 10px;font-size:12px;line-height:18px;color:#9ca3af;">Sent by ${esc(args.senderName)}. You received this because you started an application for a chapter &#2949; experience.</p>
          <p style="margin:0;font-size:12px;line-height:18px;color:#9ca3af;">Do not reply to this email. To contact us press the <strong style="color:#6b7280;">Contact Us</strong> button.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Cart-abandonment WhatsApp ────────────────────────────────────────────────
// Wamafy primary since 2026-09-01, AiSensy kept as an automatic fallback while
// both accounts are paid. Migrated second, after otp, because a failure here
// costs one re-engagement nudge and nothing else -- no booking is gated on it.
//
// Both the open and invite branches send the SAME three parameters and one URL
// button, so they share this helper rather than duplicating the payload twice
// as the AiSensy code did.
//
// URL button value is the placeholder tail only (?phone=&name=): WhatsApp
// appends it to the prefix baked into the approved template, so passing a full
// URL would put our domain in the link twice. Same contract AiSensy uses.
async function sendCartAbandonWhatsApp(args: {
  phone: string; name: string; eventTitle: string; eventDate: string; buttonParam: string;
}): Promise<{ provider: 'wamafy' | 'aisensy'; messageId: string | null } | null> {
  const wamafyKey = Deno.env.get('WAMAFY_API_KEY');
  if (wamafyKey) {
    try {
      const res = await fetch('https://api.wamafy.com/api/v1/public/messages', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${wamafyKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: `+91${args.phone}`,
          templateName: 'cart_abandon',
          variables: { '1': args.name, '2': args.eventTitle, '3': args.eventDate },
          buttons: [{ index: 0, type: 'url', value: args.buttonParam }],
        }),
      });
      const text = await res.text();
      let body: any = null;
      try { body = text ? JSON.parse(text) : null; } catch { /* keep raw for logs */ }
      if (res.ok && body?.success !== false) {
        return { provider: 'wamafy', messageId: body?.data?.messageId ?? null };
      }
      console.error('[cart-abandonment] wamafy rejected:', res.status, text.slice(0, 300));
    } catch (err) {
      console.error('[cart-abandonment] wamafy fetch failed:', err);
    }
  }

  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) return null;
  try {
    const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: AISENSY_API_KEY,
        campaignName: AISENSY_CAMPAIGN_CART,
        destination: '91' + args.phone,
        userName: args.name || 'chapter A 3063',
        templateParams: [args.name, args.eventTitle, args.eventDate],
        source: 'cart-abandonment',
        media: {},
        buttons: buildAiSensyUrlButton(args.buttonParam),
        carouselCards: [],
        location: {},
        paramsFallbackValue: { FirstName: args.name },
      }),
    });
    const body = await aiRes.text().catch(() => '');
    if (aiRes.status >= 200 && aiRes.status < 300) {
      return { provider: 'aisensy', messageId: null };
    }
    console.error('[cart-abandonment] aisensy rejected:', aiRes.status, body.slice(0, 300));
  } catch (err) {
    console.error('[cart-abandonment] aisensy fetch failed:', err);
  }
  return null;
}

// Optional: skipped when the secret is unset, and never allowed to throw --
// logging must not be able to fail or delay a nudge.
async function logCartAbandonSend(supabase: any, args: {
  provider: string; messageId: string | null; phone: string; applicationId?: string | null;
}): Promise<void> {
  const secret = Deno.env.get('WHATSAPP_LOG_SECRET');
  if (!secret) return;
  try {
    await supabase.rpc('log_whatsapp_send', {
      p_secret: secret, p_provider: args.provider, p_message_id: args.messageId,
      p_to: args.phone, p_template: 'cart_abandon', p_variables: null,
      p_ok: true, p_http_status: 200, p_raw: null,
      // Attribute to the booking, not just the phone -- a repeat guest would
      // otherwise show this nudge on every lead they have.
      p_application_id: args.applicationId ?? null,
    });
  } catch (err) {
    console.error('[cart-abandonment] send log failed:', err);
  }
}

async function sendCartAbandonEmail(args: {
  email: string; userName: string; eventName: string; contactUrl: string;
}): Promise<{ ok: boolean; messageId: string | null; status: number }> {
  const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
  if (!BREVO_API_KEY) {
    console.warn('[cart-abandonment] BREVO_API_KEY not set, skipping email');
    return { ok: false, messageId: null, status: 0 };
  }
  const contactUrl  = args.contactUrl;
  const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') ?? 'info@chaptera.in';
  const senderName  = Deno.env.get('BREVO_SENDER_NAME')  ?? 'chapter அ';
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: args.email, name: args.userName || undefined }],
        subject: `We don't want you to miss our ${args.eventName}…`,
        htmlContent: cartAbandonEmailHtml({ userName: args.userName, eventName: args.eventName, contactUrl, senderName }),
        tags: ['chapter-cart-abandon-email'],
      }),
    });
    const ok = res.status >= 200 && res.status < 300;
    const body = await res.text().catch(() => '');
    // Brevo's messageId is what the delivery callbacks attach to. Without it an
    // event can only be matched back by guessing at the address.
    let messageId: string | null = null;
    try { messageId = body ? (JSON.parse(body)?.messageId ?? null) : null; } catch { /* keep raw for logs */ }
    console.log('[cart-abandonment] brevo email:', { to_tail: args.email.slice(-8), status: res.status, ok, body: body.slice(0, 120) });
    return { ok, messageId, status: res.status };
  } catch (err) {
    console.error('[cart-abandonment] brevo email failed:', err);
    return { ok: false, messageId: null, status: 0 };
  }
}

// ── Email send log ───────────────────────────────────────────────────────────
// The email twin of logCartAbandonSend above. Claim a row in email_sends, send,
// then stamp it with Brevo's message id so delivery callbacks have something to
// attach to. Nudges are claimed against the BILL OPEN, not the application: the
// same person can abandon the same event twice and should be nudged twice.
//
// Duplicated per function rather than shared: _shared/ is bundled at DEPLOY
// time, so editing it leaves already-deployed callers on an old copy, silently.
//
// Best-effort throughout -- logging must never delay or fail a nudge.
async function claimEmailSend(supabase: any, args: {
  kind: string; toEmail: string; applicationId?: string | null;
  billOpenId?: string | null; subject?: string | null;
}): Promise<number | null> {
  const secret = Deno.env.get('WHATSAPP_LOG_SECRET');
  if (!secret) return null;
  try {
    const { data, error } = await supabase.rpc('claim_email_send', {
      p_secret: secret,
      p_kind: args.kind,
      p_to_email: args.toEmail,
      p_application_id: args.applicationId ?? null,
      p_bill_open_id: args.billOpenId ?? null,
      p_subject: args.subject ?? null,
      p_sent_by: null,
    });
    if (error) { console.error('[cart-abandonment] email claim failed:', error); return null; }
    // null means someone already claimed this send, so the row exists. Not an
    // error, and not a reason to skip: cart_abandon_email_sent still decides.
    return (data as number | null) ?? null;
  } catch (err) {
    console.error('[cart-abandonment] email claim threw:', err);
    return null;
  }
}

async function logEmailSend(supabase: any, args: {
  id: number | null; messageId: string | null; ok: boolean; httpStatus: number;
}): Promise<void> {
  const secret = Deno.env.get('WHATSAPP_LOG_SECRET');
  if (!secret || args.id === null) return;
  try {
    await supabase.rpc('log_email_send', {
      p_secret: secret, p_id: args.id, p_message_id: args.messageId,
      p_ok: args.ok, p_http_status: args.httpStatus, p_raw: null,
    });
  } catch (err) {
    console.error('[cart-abandonment] email send log failed:', err);
  }
}

async function releaseEmailSend(supabase: any, id: number | null): Promise<void> {
  const secret = Deno.env.get('WHATSAPP_LOG_SECRET');
  if (!secret || id === null) return;
  try {
    await supabase.rpc('release_email_send', { p_secret: secret, p_id: id });
  } catch (err) {
    console.error('[cart-abandonment] email release failed:', err);
  }
}

async function maybeSendCartAbandonEmail(
  supabase: ReturnType<typeof createClient>,
  row: { id: string; event_title?: string | null; cart_abandon_email_sent?: boolean; phone: string },
  args: { email: string; userName: string; applicationId?: string | null },
): Promise<void> {
  if (!args.email || row.cart_abandon_email_sent) return;
  const baseUrl = (Deno.env.get('BREVO_INVITE_BASE_URL') ?? 'https://chaptera.in').replace(/\/+$/, '');
  const contactUrl = buildInviteContactUrl(baseUrl, row.phone, args.userName);
  const eventName = row.event_title || 'our next experience';
  // cart_abandon_email_sent above is still the authority on whether to send.
  // This claim only creates the log row, so a logging outage cannot swallow a
  // nudge. Phase 5c flips the authority to this table.
  const logId = await claimEmailSend(supabase, {
    kind: 'nudge',
    toEmail: args.email,
    applicationId: args.applicationId ?? null,
    billOpenId: row.id,
    subject: `We don't want you to miss our ${eventName}…`,
  });
  const sent = await sendCartAbandonEmail({
    email: args.email,
    userName: args.userName,
    eventName,
    contactUrl,
  });
  const emailed = sent.ok;
  if (emailed) {
    await logEmailSend(supabase, {
      id: logId, messageId: sent.messageId, ok: true, httpStatus: sent.status,
    });
  } else {
    await releaseEmailSend(supabase, logId);
  }
  if (emailed) {
    await supabase
      .from('bill_opens')
      .update({ cart_abandon_email_sent: true })
      .eq('id', row.id);
  }
}

Deno.serve(async (req) => {
  // Require SOME WhatsApp provider, not one specific one. This used to demand
  // AISENSY_API_KEY, which would have silently killed the whole cron the day
  // that key is finally removed -- even with Wamafy working perfectly.
  if (!Deno.env.get('WAMAFY_API_KEY') && !Deno.env.get('AISENSY_API_KEY')) {
    console.warn('[cart-abandonment] no WhatsApp provider configured, skipping');
    return new Response(JSON.stringify({ error: 'no whatsapp provider configured' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const isForce = url.searchParams.get('force') === 'true';
  const forcePhone = url.searchParams.get('phone') ?? '';

  // Protect force/test mode with a secret (env-driven; fail-closed if unset).
  if (isForce) {
    const CRON_SECRET = Deno.env.get('CRON_SECRET');
    const secret = url.searchParams.get('secret') ?? '';
    if (!CRON_SECRET || secret !== CRON_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }
    if (!forcePhone) {
      return new Response('phone param required for force mode', { status: 400 });
    }
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Build query — force mode bypasses the abandonment window entirely.
  // The window differs by flow (open events fire after 1h, invite after 2h), so
  // fetch everything opened >=1h ago (the shorter window) and enforce the exact
  // per-flow threshold inside the loop once we know the event type.
  let query = supabase
    .from('bill_opens')
    .select('id, phone, name, event_slug, event_title, opened_at, cart_abandon_email_sent')
    .eq('cart_abandonment_sent', false);

  if (isForce) {
    const tenDigit = forcePhone.replace(/^\+91/, '').replace(/^91/, '').replace(/\D/g, '').slice(-10);
    query = query.eq('phone', tenDigit);
  } else {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    query = query.lt('opened_at', oneHourAgo);
  }

  const { data: rows, error } = await query;
  if (error) {
    console.error('[cart-abandonment] query error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return new Response(JSON.stringify({ sent: 0, total: 0 }), { status: 200 });
  }

  let sent = 0;
  let skipped = 0;

  for (const row of rows) {
    // Resolve the event first: its type sets both the abandonment window (open
    // fires after 1h, invite after 2h) and, later, which template to send.
    // event_dates is a fallback event date for the open copy's 3rd param.
    const { data: evRow } = await supabase
      .from('events')
      .select('booking_url, event_dates(start_date)')
      .or(`slug.eq.${row.event_slug},invite_slug.eq.${row.event_slug}`)
      .maybeSingle();
    const isOpenEvent = (evRow as any)?.booking_url === 'payu-hosted';

    // Per-flow abandonment window. The query already filtered to >=1h; invite
    // events wait the full 2h, so an invite row aged 1–2h is left untouched (no
    // flag, no message) for a later run. Force mode bypasses the window.
    if (!isForce) {
      const ageMs = Date.now() - new Date(row.opened_at as string).getTime();
      const windowHours = isOpenEvent ? 1 : 2;
      if (ageMs < windowHours * 60 * 60 * 1000) continue;
    }

    // Application row drives skip logic and template params (name, date, email).
    const { data: appRows } = await supabase
      .from('applications')
      .select('id, name, selected_date, email, status, aisensy_payment_failed_sent')
      .eq('phone', row.phone)
      .eq('event_slug', row.event_slug)
      .limit(1);
    const app = appRows?.[0] as {
      id?: string; name?: string; selected_date?: string | null; email?: string | null;
      status?: string; aisensy_payment_failed_sent?: boolean;
    } | undefined;

    // Terminal states only — skip forever (mark handled so we stop re-checking).
    const isPaid = app?.status === 'advance_paid' || app?.status === 'fully_paid';
    const { data: payments } = await supabase
      .from('payu_payments')
      .select('id, status')
      .eq('phone', row.phone)
      .eq('event_slug', row.event_slug);
    const hasSuccess = (payments ?? []).some((p) => p.status === 'success');
    const allFailedWithNudge =
      (payments?.length ?? 0) > 0 &&
      payments!.every((p) => p.status === 'failure') &&
      !!app?.aisensy_payment_failed_sent;

    if (isPaid || hasSuccess || allFailedWithNudge) {
      await supabase
        .from('bill_opens')
        .update({ cart_abandonment_sent: true })
        .eq('id', row.id);
      skipped++;
      console.log('[cart-abandonment] skipped (terminal):', row.phone, row.event_slug, {
        isPaid, hasSuccess, allFailedWithNudge,
      });
      continue;
    }

    // Genuine abandonment (past the flow's window — open 1h / invite 2h — and
    // still unpaid). Includes bill-only abandoners AND people who clicked Pay
    // but bailed on PayU (payu_payments stuck at pending). Set the
    // cart_abandoned flag on their application so the admin People page can
    // surface Cart-Abandoned for follow-up. This is a flag, NOT a status
    // change — the base status is preserved so the payment auth gates keep
    // working and the user can still pay later. Covers BOTH flows:
    //   invite → status 'invited' (post-approval)
    //   open   → status 'pending' (open bookings stay 'pending' until paid)
    // Done regardless of WhatsApp delivery — it reflects behaviour, not send.
    const { data: markedApps, error: markErr } = await supabase
      .from('applications')
      .update({ cart_abandoned: true })
      .eq('phone', row.phone)
      .eq('event_slug', row.event_slug)
      .in('status', ['invited', 'pending'])
      .select('id');
    if (markErr || !markedApps?.length) {
      console.error('[cart-abandonment] could not mark application cart_abandoned; leaving bill_open unhandled', {
        phone: row.phone,
        event_slug: row.event_slug,
        error: markErr?.message ?? 'no matching unpaid application',
      });
      continue;
    }

    const displayName = app?.name || row.name || 'there';
    const selectedDate = (app?.selected_date as string | null) ?? null;
    const applicantEmail = String(app?.email ?? '').trim();
    const aiSensyName = capitalizeFirstChar(displayName);
    const eventDateIso = selectedDate
      || (evRow as any)?.event_dates?.[0]?.start_date
      || '';
    const eventDate = formatEventDate(eventDateIso);

    // ── OPEN events: car_abandon_deeplink2 template ──────────────────────────
    // Open events get the cart_abandoned flag above (admin visibility +
    // Recovered tracking) AND their own re-engagement WhatsApp — different copy
    // from invite, plus a 3rd param for the date they'd miss. Only mark the
    // bill_open handled on a successful send, so a transient AiSensy failure
    // retries on the next cron run (matches the invite path's at-least-once).
    if (isOpenEvent) {
      {
        const sent_ = await sendCartAbandonWhatsApp({
          phone: row.phone, name: aiSensyName,
          eventTitle: row.event_title || 'trip', eventDate,
          buttonParam: buildInviteButtonParam(row.phone, aiSensyName),
        });
        console.log('[cart-abandonment] open nudge:', {
          phone: row.phone, event_slug: row.event_slug, provider: sent_?.provider ?? 'none',
        });
        // Only mark handled on a successful send, so a transient provider
        // failure retries on the next cron run (at-least-once).
        if (sent_) {
          await supabase.from('bill_opens').update({ cart_abandonment_sent: true }).eq('id', row.id);
          sent++;
          await logCartAbandonSend(supabase, { provider: sent_.provider, messageId: sent_.messageId, phone: row.phone, applicationId: app?.id ?? null });
        }
      }
      // Email channel (open events with an email on file). Runs AFTER WhatsApp
      // so Brevo latency can't delay the primary channel — same pattern as invite.
      await maybeSendCartAbandonEmail(supabase, row, {
        email: applicantEmail,
        userName: displayName,
        applicationId: app?.id ?? null,
      });
      continue;
    }

    // ── INVITE events: car_abandon_deeplink2 template ────────────────────────
    // Fire AiSensy car_abandon_deeplink2 campaign FIRST — WhatsApp is the primary
    // channel and must not wait on Brevo latency; the email follows below.
    {
      const sent_ = await sendCartAbandonWhatsApp({
        phone: row.phone, name: aiSensyName,
        eventTitle: row.event_title || 'trip', eventDate,
        buttonParam: buildInviteButtonParam(row.phone, aiSensyName),
      });
      console.log('[cart-abandonment] invite nudge:', {
        phone: row.phone, event_slug: row.event_slug, provider: sent_?.provider ?? 'none',
      });
      if (sent_) {
        await supabase.from('bill_opens').update({ cart_abandonment_sent: true }).eq('id', row.id);
        sent++;
        await logCartAbandonSend(supabase, { provider: sent_.provider, messageId: sent_.messageId, phone: row.phone, applicationId: app?.id ?? null });
      }
    }

    // Email channel (invite events with an email on file). Runs AFTER WhatsApp
    // so Brevo slowness can't delay the primary channel. Its own flag keeps it
    // independent: a WhatsApp retry can't re-email, and a permanently-failing
    // WhatsApp number still gets the email once.
    await maybeSendCartAbandonEmail(supabase, row, {
      email: applicantEmail,
      userName: displayName,
      applicationId: app?.id ?? null,
    });
  }

  console.log('[cart-abandonment] done:', { sent, skipped, total: rows.length });
  return new Response(JSON.stringify({ sent, skipped, total: rows.length }), { status: 200 });
});
