import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// cart-abandonment
//
// Fired every 30 min by pg_cron (job 'cart-abandonment-check'). For each
// bill_opens row past its flow's window (open events 1h, invite events 2h) that
// hasn't been messaged AND has no
// payu_payments row, flags the application cart_abandoned and sends a
// re-engagement WhatsApp: invite events get `cart_abandonment`, open events
// (booking_url='payu-hosted') get `cart_abandon_open` (different copy + the
// date they'd miss).
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

const AISENSY_CAMPAIGN_CART = 'cart_abandonment';
// Open events (booking_url='payu-hosted') get their own re-engagement template
// with different copy + a 3rd param (the date they'd miss). Meta-approved as
// `cart_abandon_open`. Params: {{1}} name, {{2}} event name, {{3}} event date.
const AISENSY_CAMPAIGN_CART_OPEN = 'cart_abandon_open';

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

// ── Cart-abandonment EMAIL (Brevo) — invite-only chapter events ────────────────
// Mirrors the send-brevo-invite design (beige header, Inter wordmark, yellow
// button) with cart-abandon copy. Sent only to invite-event applicants who left
// an email; open events keep WhatsApp only. Best-effort — WhatsApp is primary.

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function cartAbandonEmailHtml(args: {
  userName: string; eventName: string; contactUrl: string; senderName: string; logoUrl: string;
}): string {
  const name = esc(args.userName || 'there');
  const event = esc(args.eventName);
  const url = args.contactUrl;
  const logo = esc(args.logoUrl);
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
          <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">We're here to help you&hellip;</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#4b5563;">Hey ${name}, we're trying to give you the best <strong style="color:#111827;">${event}</strong> experience.</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#4b5563;">You were only 1 step away from joining us&hellip;</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:#4b5563;">If you need any help, feel free to Contact Us.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
            <tr><td style="border-radius:14px;background:#FFD700;">
              <a href="${url}" target="_blank" style="display:inline-block;padding:15px 28px;font-size:16px;font-weight:800;color:#111827;text-decoration:none;border-radius:14px;">Contact Us &#8594;</a>
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

async function sendCartAbandonEmail(args: { email: string; userName: string; eventName: string }): Promise<boolean> {
  const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
  if (!BREVO_API_KEY) {
    console.warn('[cart-abandonment] BREVO_API_KEY not set, skipping email');
    return false;
  }
  const baseUrl     = (Deno.env.get('BREVO_INVITE_BASE_URL') ?? 'https://chaptera.in').replace(/\/+$/, '');
  const contactUrl  = `${baseUrl}/invite`;
  const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') ?? 'info@chaptera.in';
  const senderName  = Deno.env.get('BREVO_SENDER_NAME')  ?? 'chapter அ';
  const logoUrl     = Deno.env.get('BREVO_LOGO_URL')     ?? 'https://chaptera.in/chat-profile.jpg';
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', 'accept': 'application/json' },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: args.email, name: args.userName || undefined }],
        subject: `We don't want you to miss our ${args.eventName}…`,
        htmlContent: cartAbandonEmailHtml({ userName: args.userName, eventName: args.eventName, contactUrl, senderName, logoUrl }),
        tags: ['chapter-cart-abandon-email'],
      }),
    });
    const ok = res.status >= 200 && res.status < 300;
    const body = await res.text().catch(() => '');
    console.log('[cart-abandonment] brevo email:', { to_tail: args.email.slice(-8), status: res.status, ok, body: body.slice(0, 120) });
    return ok;
  } catch (err) {
    console.error('[cart-abandonment] brevo email failed:', err);
    return false;
  }
}

Deno.serve(async (req) => {
  const AISENSY_API_KEY = Deno.env.get('AISENSY_API_KEY');
  if (!AISENSY_API_KEY) {
    console.warn('[cart-abandonment] AISENSY_API_KEY not set, skipping');
    return new Response(JSON.stringify({ error: 'aisensy not configured' }), {
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

    // Skip if they already initiated a payment (any status — success, failure, or pending).
    // Use .limit(1) instead of .maybeSingle() to safely handle multiple rows.
    const { data: payments } = await supabase
      .from('payu_payments')
      .select('id')
      .eq('phone', row.phone)
      .eq('event_slug', row.event_slug)
      .limit(1);

    if (payments && payments.length > 0) {
      // Mark as sent so we don't keep checking this row
      await supabase
        .from('bill_opens')
        .update({ cart_abandonment_sent: true })
        .eq('id', row.id);
      skipped++;
      console.log('[cart-abandonment] skipped (has payu_payments row):', row.phone, row.event_slug);
      continue;
    }

    // Genuine abandonment (past the flow's window — open 1h / invite 2h — and
    // never paid). Set the
    // cart_abandoned flag on their application so the admin People page can
    // surface Cart-Abandoned for follow-up. This is a flag, NOT a status
    // change — the base status is preserved so the payment auth gates keep
    // working and the user can still pay later. Covers BOTH flows:
    //   invite → status 'invited' (post-approval)
    //   open   → status 'pending' (open bookings stay 'pending' until paid)
    // Someone who already paid (advance_paid/fully_paid) is excluded — and is
    // skipped above anyway if they have a payu_payments row.
    // Done regardless of WhatsApp delivery — it reflects behaviour, not send.
    await supabase
      .from('applications')
      .update({ cart_abandoned: true })
      .eq('phone', row.phone)
      .eq('event_slug', row.event_slug)
      .in('status', ['invited', 'pending']);

    // Look up the application: name for the greeting, and selected_date so the
    // open template can name the date they'd miss. Name falls back to the
    // bill_opens poster name, then 'there'.
    const { data: appRows } = await supabase
      .from('applications')
      .select('name, selected_date, email')
      .eq('phone', row.phone)
      .eq('event_slug', row.event_slug)
      .limit(1);
    const displayName = appRows?.[0]?.name || row.name || 'there';
    const selectedDate = (appRows?.[0]?.selected_date as string | null) ?? null;
    const applicantEmail = String((appRows?.[0] as any)?.email ?? '').trim();

    // ── OPEN events: cart_abandon_open template ──────────────────────────────
    // Open events get the cart_abandoned flag above (admin visibility +
    // Recovered tracking) AND their own re-engagement WhatsApp — different copy
    // from invite, plus a 3rd param for the date they'd miss. Only mark the
    // bill_open handled on a successful send, so a transient AiSensy failure
    // retries on the next cron run (matches the invite path's at-least-once).
    if (isOpenEvent) {
      const eventDateIso = selectedDate
        || (evRow as any)?.event_dates?.[0]?.start_date
        || '';
      const eventDate = formatEventDate(eventDateIso);
      try {
        const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: AISENSY_API_KEY,
            campaignName: AISENSY_CAMPAIGN_CART_OPEN,
            destination: '91' + row.phone,
            userName: displayName || 'chapter A 3063',
            templateParams: [
              displayName,                 // {{1}} user name
              row.event_title || 'trip',   // {{2}} event name
              eventDate,                   // {{3}} event date they chose
            ],
            source: 'cart-abandonment',
            media: {},
            buttons: [],
            carouselCards: [],
            location: {},
            attributes: {
              event_slug: row.event_slug,
            },
            paramsFallbackValue: { FirstName: displayName },
          }),
        });

        const ok = aiRes.status >= 200 && aiRes.status < 300;
        const body = await aiRes.text().catch(() => '');
        console.log('[cart-abandonment] open aisensy response:', {
          phone: row.phone,
          event_slug: row.event_slug,
          status: aiRes.status,
          ok,
          body: body.slice(0, 300),
        });

        if (ok) {
          await supabase
            .from('bill_opens')
            .update({ cart_abandonment_sent: true })
            .eq('id', row.id);
          sent++;
        }
      } catch (err) {
        console.error('[cart-abandonment] open aisensy fetch failed:', err);
      }
      continue;
    }

    // ── INVITE events: cart_abandonment template ─────────────────────────────
    // Fire AiSensy cart_abandonment campaign FIRST — WhatsApp is the primary
    // channel and must not wait on Brevo latency; the email follows below.
    try {
      const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: AISENSY_API_KEY,
          campaignName: AISENSY_CAMPAIGN_CART,
          destination: '91' + row.phone,
          userName: displayName || 'chapter A 3063',
          templateParams: [
            displayName,
            row.event_title || 'trip',
          ],
          source: 'cart-abandonment',
          media: {},
          buttons: [],
          carouselCards: [],
          location: {},
          attributes: {
            event_slug: row.event_slug,
          },
          paramsFallbackValue: { FirstName: displayName },
        }),
      });

      const ok = aiRes.status >= 200 && aiRes.status < 300;
      const body = await aiRes.text().catch(() => '');
      console.log('[cart-abandonment] aisensy response:', {
        phone: row.phone,
        event_slug: row.event_slug,
        status: aiRes.status,
        ok,
        body: body.slice(0, 300),
      });

      if (ok) {
        await supabase
          .from('bill_opens')
          .update({ cart_abandonment_sent: true })
          .eq('id', row.id);
        sent++;
      }
    } catch (err) {
      console.error('[cart-abandonment] aisensy fetch failed:', err);
    }

    // Email channel (invite-only chapter events that left an email). Runs AFTER
    // the WhatsApp so any Brevo slowness can't delay the primary channel. Its own
    // flag keeps it independent: a WhatsApp retry can't re-email, and a
    // permanently-failing WhatsApp number still gets the email once.
    if (applicantEmail && !(row as any).cart_abandon_email_sent) {
      const emailed = await sendCartAbandonEmail({
        email: applicantEmail,
        userName: displayName,
        eventName: row.event_title || 'our next experience',
      });
      if (emailed) {
        await supabase
          .from('bill_opens')
          .update({ cart_abandon_email_sent: true })
          .eq('id', row.id);
      }
    }
  }

  console.log('[cart-abandonment] done:', { sent, skipped, total: rows.length });
  return new Response(JSON.stringify({ sent, skipped, total: rows.length }), { status: 200 });
});
