import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// retarget-check
//
// Fired every 30 min by pg_cron (job 'retarget-check'). For each application
// with status='invited' whose AiSensy invite went out >= 24h ago AND which
// has NO bill_opens row (the user never even opened the bill page),
// sets applications.re_target = true. The admin People page renders
// "Re-Target" from this flag so call marketers can chase them — covers both
// AiSensy delivery failures and people who saw the message but ignored it.
//
// re_target and cart_abandoned are mutually exclusive by construction:
// re_target = "never opened the bill", cart_abandoned = "opened but didn't
// pay". A user moves OUT of re_target eligibility the moment a bill_opens
// row appears for them (they may then become cart_abandoned 2h later).
//
// verify_jwt is false because pg_cron (pg_net) calls this without a JWT.

Deno.serve(async (req) => {
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

  // Candidates: invited rows where AiSensy fired, the 24h window has passed,
  // and we haven't flagged them yet. Force mode bypasses the 24h window so
  // we can test a single phone without waiting a day.
  let query = supabase
    .from('applications')
    .select('id, phone, event_slug')
    .eq('status', 'invited')
    .eq('aisensy_invite_sent', true)
    .eq('re_target', false)
    .not('invite_sent_at', 'is', null);

  if (isForce) {
    const tenDigit = forcePhone.replace(/^\+91/, '').replace(/^91/, '').replace(/\D/g, '').slice(-10);
    query = query.eq('phone', tenDigit);
  } else {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    query = query.lt('invite_sent_at', twentyFourHoursAgo);
  }

  const { data: rows, error } = await query;
  if (error) {
    console.error('[retarget-check] query error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return new Response(JSON.stringify({ flagged: 0, total: 0 }), { status: 200 });
  }

  let flagged = 0;

  for (const row of rows) {
    // Open events have no invite approval lifecycle and can never be Re-Target.
    // Keep this server-side guard even if a stale admin client accidentally
    // writes status='invited' again.
    const { data: event } = await supabase
      .from('events')
      .select('booking_url')
      .eq('slug', row.event_slug)
      .maybeSingle();
    if (event?.booking_url === 'payu-hosted') continue;

    // Skip anyone who has a bill_opens row — they entered the flow, so
    // they're either cart_abandoned (handled by the other job) or
    // mid-payment. Either way, not a re-target candidate.
    const { data: opens } = await supabase
      .from('bill_opens')
      .select('id')
      .eq('phone', row.phone)
      .eq('event_slug', row.event_slug)
      .limit(1);

    if (opens && opens.length > 0) continue;

    const { error: updErr } = await supabase
      .from('applications')
      .update({ re_target: true })
      .eq('id', row.id);

    if (updErr) {
      console.error('[retarget-check] update error:', { id: row.id, error: updErr.message });
      continue;
    }
    flagged++;
  }

  console.log('[retarget-check] done:', { flagged, total: rows.length });
  return new Response(JSON.stringify({ flagged, total: rows.length }), { status: 200 });
});
