// brevo-webhook
//
// Receives Brevo transactional webhook events. We currently care about invite
// mail opens/unsubscribes, recovery mail opens, and resend-details clicks.
//
// Deploy with --no-verify-jwt because Brevo cannot send a Supabase JWT.
// Protect the endpoint with BREVO_WEBHOOK_TOKEN and configure Brevo to send:
//   Authorization: Bearer <BREVO_WEBHOOK_TOKEN>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function json(status: number, payload: any) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function authorised(req: Request): boolean {
  const expected = Deno.env.get('BREVO_WEBHOOK_TOKEN')?.trim();
  if (!expected) {
    console.error('[brevo-webhook] BREVO_WEBHOOK_TOKEN is not configured');
    return false;
  }

  const auth = req.headers.get('authorization') ?? '';
  const bearer = auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const tokenHeader = req.headers.get('x-brevo-token')?.trim()
    ?? req.headers.get('x-webhook-token')?.trim();
  const tokenQuery = new URL(req.url).searchParams.get('token')?.trim();

  return bearer === expected || tokenHeader === expected || tokenQuery === expected;
}

function normaliseEvents(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.events)) return body.events;
  return body && typeof body === 'object' ? [body] : [];
}

function eventTags(event: any): string[] {
  const tags: string[] = [];
  if (Array.isArray(event?.tags)) tags.push(...event.tags.map((t: any) => String(t)));

  if (event?.tag) {
    const raw = String(event.tag).trim();
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) tags.push(...parsed.map((t: any) => String(t)));
      else tags.push(raw);
    } catch {
      // Brevo may send a plain string tag; use it as-is.
      tags.push(raw);
    }
  }

  Object.keys(event ?? {})
    .filter(key => /^\d+$/.test(key))
    .sort((a, b) => Number(a) - Number(b))
    .forEach(key => tags.push(String(event[key])));

  return Array.from(new Set(tags.map(tag => tag.trim()).filter(Boolean)));
}

const INVITE_EMAIL_TAGS = new Set(['chapter-invite-email', 'galcode-invite-email']);
const CART_ABANDON_EMAIL_TAGS = new Set(['chapter-cart-abandon-email', 'galcode-cart-abandon-email']);
const RESEND_INVITE_TAGS = new Set(['resend invite', 'resend-invite']);

function hasAnyTag(tags: string[], allowed: Set<string>): boolean {
  return tags.some(tag => allowed.has(tag));
}

function emailKind(event: any): 'invite' | 'cart_abandon' | 'resend_invite' | null {
  const tags = eventTags(event);
  if (hasAnyTag(tags, RESEND_INVITE_TAGS)) return 'resend_invite';
  if (hasAnyTag(tags, CART_ABANDON_EMAIL_TAGS)) return 'cart_abandon';
  if (tags.length === 0 || hasAnyTag(tags, INVITE_EMAIL_TAGS)) return 'invite';
  return null;
}

function resendApplicationId(event: any): string | null {
  for (const tag of eventTags(event)) {
    const match = tag.match(/^application-([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

function isOpenedEvent(event: any): boolean {
  const kind = String(event?.event ?? event?.eventType ?? event?.type ?? '').toLowerCase();
  return kind === 'unique_proxy_open' || kind === 'unique_opened' || kind === 'unique_open';
}

function isUnsubscribedEvent(event: any): boolean {
  const kind = String(event?.event ?? event?.eventType ?? event?.type ?? '').toLowerCase();
  return kind === 'unsubscribed' || kind === 'unsubscribe';
}

function isClickEvent(event: any): boolean {
  const kind = String(event?.event ?? event?.eventType ?? event?.type ?? '').toLowerCase();
  return kind === 'click' || kind === 'clicked';
}

function eventTimestamp(event: any): string {
  const rawTs = Number(event?.ts_event ?? event?.ts_epoch ?? event?.ts);
  if (Number.isFinite(rawTs)) {
    const parsedTs = new Date(rawTs > 10_000_000_000 ? rawTs : rawTs * 1000);
    if (!Number.isNaN(parsedTs.getTime())) return parsedTs.toISOString();
  }

  const rawDate = event?.date ?? event?.timestamp;
  const parsedDate = rawDate ? new Date(String(rawDate)) : null;
  if (parsedDate && !Number.isNaN(parsedDate.getTime())) return parsedDate.toISOString();

  return new Date().toISOString();
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method not allowed' });
  if (!authorised(req)) return json(401, { error: 'unauthorized' });

  const body = await req.json().catch(() => null);
  const events = normaliseEvents(body);
  if (events.length === 0) return json(200, { ok: true, processed: 0 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let processed = 0;
  let opened = 0;
  let recoveryOpened = 0;
  let unsubscribed = 0;
  let detailsClicked = 0;
  let updated = 0;

  for (const event of events) {
    processed++;
    const openedEvent = isOpenedEvent(event);
    const unsubscribedEvent = isUnsubscribedEvent(event);
    const clickEvent = isClickEvent(event);
    const kind = emailKind(event);
    if ((!openedEvent && !unsubscribedEvent && !clickEvent) || !kind) continue;
    if (clickEvent && kind !== 'resend_invite') continue;
    // For resend-details mail, the product definition of "opened" is an
    // explicit CTA/link click. Ignore tracking-pixel opens entirely.
    if (openedEvent && kind === 'resend_invite') continue;

    const email = String(event?.email ?? event?.recipient ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
    if (openedEvent) opened++;
    if (openedEvent && kind === 'cart_abandon') recoveryOpened++;
    if (unsubscribedEvent) unsubscribed++;
    if (clickEvent && kind === 'resend_invite') detailsClicked++;

    const happenedAt = eventTimestamp(event);
    const trackedColumn = clickEvent && kind === 'resend_invite'
      ? 'resend_details_link_clicked_at'
      : unsubscribedEvent
      ? 'email_unsubscribed_at'
      : kind === 'cart_abandon'
      ? 'cart_abandon_email_opened_at'
      : 'email_opened_at';

    const exactApplicationId = kind === 'resend_invite' && clickEvent
      ? resendApplicationId(event)
      : null;

    let query = supabase.from('applications').select('id');
    if (exactApplicationId) {
      // New resend emails carry the exact application ID. Do not require the
      // lead to still be Re-Target: the click trail must survive later status
      // changes such as Cart Abandoned or Paid.
      query = query
        .eq('id', exactApplicationId)
        .ilike('email', email)
        .not('resend_details_email_sent_at', 'is', null)
        .is(trackedColumn, null);
    } else {
      // Backward-compatible lookup for emails sent before exact tags existed.
      query = query
        .ilike('email', email)
        .eq('status', 'invited')
        .is(trackedColumn, null)
        .order('email_invite_sent_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(1);

      if (kind === 'resend_invite' && clickEvent) {
        query = query.eq('re_target', true).not('resend_details_email_sent_at', 'is', null);
      } else if (kind === 'cart_abandon' && openedEvent) {
        query = query.eq('cart_abandoned', true);
      } else {
        query = query.eq('email_invite_sent', true);
      }
    }

    const { data: appRow, error: selectErr } = await query.maybeSingle();

    if (selectErr) {
      console.error('[brevo-webhook] application lookup failed:', selectErr.message);
      continue;
    }
    if (!appRow?.id) continue;

    const { error: updateErr } = await supabase
      .from('applications')
      .update({ [trackedColumn]: happenedAt })
      .eq('id', appRow.id)
      .is(trackedColumn, null);

    if (updateErr) {
      console.error('[brevo-webhook] application update failed:', updateErr.message);
      continue;
    }
    updated++;
  }

  return json(200, { ok: true, processed, opened, recoveryOpened, unsubscribed, detailsClicked, updated });
});
