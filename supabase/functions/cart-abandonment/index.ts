import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// cart-abandonment
//
// Fired every 30 min by pg_cron (job 'cart-abandonment-check'). For each
// bill_opens row older than 2h that hasn't been messaged AND has no
// payu_payments row, sends the AiSensy `cart_abandonment` WhatsApp nudge.
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

  // Build query — force mode bypasses 2-hour window
  let query = supabase
    .from('bill_opens')
    .select('id, phone, name, event_slug, event_title')
    .eq('cart_abandonment_sent', false);

  if (isForce) {
    const tenDigit = forcePhone.replace(/^\+91/, '').replace(/^91/, '').replace(/\D/g, '').slice(-10);
    query = query.eq('phone', tenDigit);
  } else {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    query = query.lt('opened_at', twoHoursAgo);
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

    // Look up application name — falls back to poster name, then 'there'
    const { data: appRows } = await supabase
      .from('applications')
      .select('name')
      .eq('phone', row.phone)
      .eq('event_slug', row.event_slug)
      .limit(1);
    const displayName = appRows?.[0]?.name || row.name || 'there';

    // Fire AiSensy cart_abandonment campaign
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
  }

  console.log('[cart-abandonment] done:', { sent, skipped, total: rows.length });
  return new Response(JSON.stringify({ sent, skipped, total: rows.length }), { status: 200 });
});
