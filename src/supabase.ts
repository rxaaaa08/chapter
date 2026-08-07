/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Fail loudly if env vars aren't wired up. We used to fall back to the
// production URL + anon key on a misconfigured preview deploy, which
// meant preview builds would silently write to the prod DB.
const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl)     throw new Error('VITE_SUPABASE_URL is not set');
if (!supabaseAnonKey) throw new Error('VITE_SUPABASE_ANON_KEY is not set');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function parseHeroImages(raw: unknown): string[] {
  const normalize = (arr: unknown[]) =>
    arr
      .map(item => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
      .slice(0, 4);

  if (Array.isArray(raw)) return normalize(raw);
  if (typeof raw !== 'string') return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return normalize(parsed);
    } catch {
      // fall through to single URL
    }
  }
  return [trimmed];
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
export function getSessionId(): string {
  const key = 'ca_session_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

export async function trackEvent(
  event_type: 'page_view' | 'city_selected' | 'category_selected' | 'event_selected' | 'calendar_opened' | 'date_selected' | 'reached_pricing' | 'book_clicked' | 'contact_clicked' | 'pricing_cta_clicked' | 'book_cta_clicked' | 'contact_cta_clicked' | 'external_redirect_initiated' | 'application_started' | 'application_submitted' | 'details_form_opened' | 'community_sheet_opened' | 'community_whatsapp_clicked',
  meta: { city?: string; category?: string; event_id?: string; event_title?: string } = {}
) {
  // Instagram / Facebook in-app browsers used to be dropped here: the wall
  // meant their landing was a duplicate of the external-browser one that
  // followed. They're now first-class visitors who browse and pay in place, so
  // their funnel has to be counted like everyone else's.
  try {
    await supabase.from('flow_analytics').insert({
      event_type,
      session_id: getSessionId(),
      city: meta.city ?? null,
      category: meta.category ?? null,
      event_id: meta.event_id ?? null,
      event_title: meta.event_title ?? null,
    });
  } catch (_) {
    // fire-and-forget — never block the user flow
  }
}

// Maps a raw Supabase row + related rows to the Event shape used in AppFlow
export function mapDbEventToEvent(row: any): any {
  const heroImages = parseHeroImages(row.hero_image);
  const quickInfo = Array.isArray(row.quick_info) ? row.quick_info : [];
  const girlsOnlyFromQuickInfo = Array.isArray(quickInfo) && quickInfo.some((item: any) =>
    ['girls only event', "girl's only event", 'girls_only_event'].includes(String(item.label ?? '').trim().toLowerCase()) &&
    String(item.value ?? '').trim().toLowerCase() !== 'false'
  );
  return {
    id: row.slug ?? row.id,
    cities: Array.isArray(row.cities) ? row.cities : (row.cities ?? []),
    category: row.category ?? 'Trips',
    isActivity: row.is_activity ?? false,
    showSecretOffer: row.show_secret_offer ?? true,
    title: row.title,
    oneLiner: row.one_liner ?? '',
    timing: row.timing,
    price: `₹${Number(row.price_full).toLocaleString('en-IN')}`,
    priceFull: Number(row.price_full),
    advanceAmount: Number(row.price_advance),
    priceAdvance: Number(row.price_advance),
    description: row.description,
    heroImage: heroImages[0] ?? '',
    heroImages,
    foundersNoteUrl: row.founders_note_url || undefined,
    startLocation: row.start_location,
    transport: row.transport,
    groupSize: row.group_size,
    accommodationType: row.accommodation_type,
    included: Array.isArray(row.included) ? row.included : (row.included ?? []),
    notIncluded: Array.isArray(row.not_included) ? row.not_included : (row.not_included ?? []),
    optionalActivities: Array.isArray(row.optional_activities) ? row.optional_activities : (row.optional_activities ?? []),
    announcements: Array.isArray(row.announcements) ? row.announcements : (row.announcements ?? []),
    bookingUrl: row.booking_url,
    // 'whatsapp' = free community event (e.g. Weekly Creator's Meet). The
    // plans chat opens a WhatsApp-community bottom sheet instead of the
    // details page; booking_url holds the WhatsApp invite link and
    // description holds "The Essentials" copy (date / time / location).
    // (events.booking_flow is CHECK-constrained to 'payment' | 'whatsapp'.)
    bookingFlow: row.booking_flow ?? undefined,
    // 'full' = single payment (one amount, no advance/balance split); 'split' default.
    paymentMode: row.payment_mode ?? 'split',
    ctaLabel: row.cta_label ?? '',
    // Creator (affiliate) economics — used by the creator dashboard's upcoming-
    // events card to show "you'd earn ₹X per booking". Commission only pays when
    // affiliateEnabled is true at full-payment time.
    affiliateEnabled: row.affiliate_enabled ?? false,
    affiliateCommissionPct: Number(row.affiliate_commission_pct ?? 0) || 0,
    // Flat ₹ per ticket. When > 0 it overrides the percentage, so a creator sees
    // one figure regardless of the buyer's city or ticket type.
    affiliateCommission: Number(row.affiliate_commission ?? 0) || 0,
    // The first video a new creator is asked to make. Creators with no approved
    // video see only starter events until one is approved.
    affiliateStarterTask: row.affiliate_starter_task ?? false,
    inviteOnly: row.invite_only ?? false,
    waitlistUrl: row.waitlist_url ?? undefined,
    inviteSlug: row.invite_slug ?? undefined,
    girlsOnly: Boolean(row.girls_only) || girlsOnlyFromQuickInfo,
    quickInfo,
    pickupPoints: Array.isArray(row.pickup_points)
      ? row.pickup_points.map((p: any, i: number) => ({
          id: p.id ?? String(i),
          label: p.label ?? p.location ?? '',
          meetingSpot: p.meetingSpot ?? p.meeting_spot ?? p.location ?? '',
          time: p.time ?? '',
          transport: p.transport ?? '',
          dateOffset: Number(p.dateOffset ?? p.date_offset ?? 0) || 0,
          ownTransportPrice: Number(p.ownTransportPrice ?? p.own_transport_price ?? 0) || undefined,
          ownOnly: Boolean(p.ownOnly ?? p.own_only ?? false),
          otherPrice: Number(p.otherPrice ?? p.other_price ?? 0) || undefined,
          otherAdvance: Number(p.otherAdvance ?? p.other_advance ?? 0) || undefined,
          forOtherCity: p.forOtherCity ?? p.for_other_city ?? undefined,
          forCity: p.forCity ?? p.for_city ?? undefined,
        }))
      : [],
    transportPlan: row.transport_plan ?? [],
    itinerary: row.itinerary ?? [],
    cityDetails: row.city_details ?? {},
    showAccommodation: row.show_accommodation ?? false,
    accommodation: row.accommodation ?? { name: '', images: [], features: [], policy: '' },
    inviteSpots: row.invite_spots ?? null,
    totalCapacity: row.total_capacity ?? null,
    ticketTypes: Array.isArray(row.ticket_types) ? row.ticket_types : [],
    bookingSteps: Array.isArray(row.booking_steps) && row.booking_steps.length > 0 ? row.booking_steps : undefined,
    dates: (row.event_dates ?? []).map((d: any) => ({
      date: d.start_date,
      status: d.status,
      label: d.label ?? undefined,
      bookingSteps: Array.isArray(d.booking_steps) && d.booking_steps.length > 0 ? d.booking_steps : undefined,
      whatsappGroupUrl: d.whatsapp_group_url ?? undefined,
    })),
    videos: (row.event_media ?? []).map((m: any) => ({
      thumbnail: m.thumbnail_url,
      url: m.url ?? '',
      caption: m.caption,
    })),
    reviews: (row.event_reviews ?? []).filter((r: any) => r.name).map((r: any) => ({
      name: r.name,
      rating: r.rating,
      text: r.review_text,
      dateLabel: r.date_label ?? '',
      reviewCount: Number(r.review_count ?? 0) || undefined,
      images: Array.isArray(r.images) ? r.images : (r.images ?? []),
    })),
    faqs: (row.faqs ?? []).map((f: any) => ({
      question: f.question,
      answer: f.answer,
    })),
    inviteFaqs: Array.isArray(row.invite_faqs)
      ? row.invite_faqs.map((f: any) => ({ question: String(f.question ?? ''), answer: String(f.answer ?? '') })).filter((f: any) => f.question && f.answer)
      : [],
  };
}

// Fetches all bot messages as a key→template map
// Template vars: {city}, {category}, {title}, {name}, {phone}
export async function fetchChatMessages(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('step_key, bot_message')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Supabase fetchChatMessages error:', error);
    return {};
  }

  return Object.fromEntries((data ?? []).map((r: any) => [r.step_key, r.bot_message]));
}

// Fills {variable} placeholders in a message template
export function fillMsg(
  msgs: Record<string, string>,
  key: string,
  vars: Record<string, string> = {},
  fallback = ''
): string {
  const template = msgs[key] ?? fallback;
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}

// ─── EVENT COUNTS (registered + reserved) ────────────────────────────────────
// For invite-only events we surface two key metrics:
//   • registered → total applications submitted for this event (any status)
//   • reserved   → applications whose status is advance_paid OR fully_paid
//                  (i.e. people who actually paid the advance and locked a spot)
// "Spots left" anywhere in the UI = invite_spots − reserved.
export async function fetchEventCounts(eventSlug: string): Promise<{ registered: number; reserved: number }> {
  if (!eventSlug) return { registered: 0, reserved: 0 };
  // applications is RLS-locked to admins, so anon COUNTs return 0. The RPC
  // returns only aggregate integers and resolves invite_slug -> canonical slug.
  const { data, error } = await supabase.rpc('event_booking_counts', { p_slug: eventSlug });
  if (error) {
    console.error('Supabase event_booking_counts error:', error);
    return { registered: 0, reserved: 0 };
  }
  const row = Array.isArray(data) ? data[0] : data;
  return {
    registered: Number((row as any)?.registered ?? 0) || 0,
    reserved:   Number((row as any)?.reserved   ?? 0) || 0,
  };
}

// Per-date booking counts for the calendar's per-date spots-left logic.
// Returns a map keyed by selected_date (YYYY-MM-DD) → { registered, reserved }.
// applications is RLS-locked to admins, so this goes through the anon-safe
// event_booking_counts_by_date RPC (resolves invite_slug → canonical slug).
export async function fetchEventDateCounts(
  eventSlug: string
): Promise<Record<string, { registered: number; reserved: number }>> {
  if (!eventSlug) return {};
  const { data, error } = await supabase.rpc('event_booking_counts_by_date', { p_slug: eventSlug });
  if (error) {
    console.error('Supabase event_booking_counts_by_date error:', error);
    return {};
  }
  const map: Record<string, { registered: number; reserved: number }> = {};
  for (const row of (data ?? []) as any[]) {
    const key = String(row?.selected_date ?? '').slice(0, 10);
    if (!key) continue;
    map[key] = {
      registered: Number(row?.registered ?? 0) || 0,
      reserved:   Number(row?.reserved   ?? 0) || 0,
    };
  }
  return map;
}

// ─── DATE AVAILABILITY ───────────────────────────────────────────────────────
// Whether a given event date is still bookable is asked in six different places
// (calendar cells, which month the calendar opens on, the WhatsApp {eventdate}
// variable, the marketer spots card, the announcement rail, and the admin
// preview). Each used to answer it with its own hand-written copy of the same
// three-part rule, which is exactly how the announcement rail ended up missing
// the past-date half of it and advertised "3 spots left" for a meetup that had
// already happened. These two functions are the single answer — call them
// rather than re-deriving.
//
// IMPORTANT: none of this is stored. `event_dates.status` is the MANUAL field an
// admin sets by hand and means only "what the founder declared"; it is never
// written back from these rules. Availability is derived fresh on every read, so
// it can never go stale the way a nightly-cron flag would at midnight.
export type AnnouncementDate = { date?: string | null; status?: string | null };

// A date strictly before today (local midnight) has elapsed. A past date is
// NEVER bookable regardless of capacity or DB status — without this, raising an
// event's capacity would re-open already-elapsed dates whose "sold out" was only
// implied by reserved >= capacity (recurring events share one capacity across
// every date).
export function isElapsedDate(date?: string | null): boolean {
  if (!date) return false;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  return new Date(date + 'T00:00:00') < todayStart;
}

// A date is sold out when ANY of three things is true: the admin declared it
// sold out, its spots are gone, or it has already happened. `capacity` is null
// for events with no per-date capacity (community/whatsapp flows), in which case
// only the declared status and the calendar matter.
export function isDateSoldOut(opts: {
  status?: string | null;
  date?: string | null;
  capacity?: number | null;
  reserved?: number | null;
}): boolean {
  if (opts.status === 'sold_out') return true;
  if (isElapsedDate(opts.date)) return true;
  const capacity = opts.capacity;
  if (typeof capacity === 'number' && capacity > 0) {
    return capacity - (opts.reserved ?? 0) <= 0;
  }
  return false;
}

// Returns the announcement line, or null when the event should not be announced
// at all (no capacity set, or every date has already happened). Recurring
// events: capacity applies to EACH date independently, so we announce the
// earliest UPCOMING date that still has spots.
export async function buildEventAnnouncement(
  slug: string,
  title: string,
  capacity: number | null | undefined,
  dates: AnnouncementDate[] = [],
): Promise<string | null> {
  if (!slug || !capacity) return null;
  // trim() because event titles are hand-typed in admin and often carry a
  // trailing space, which showed up as "chill sunday meetup  - 3 spots left".
  const label = (title || slug).trim().toLowerCase();

  const allDates = dates.filter(d => d.date);
  const upcoming = allDates
    .filter(d => !isElapsedDate(d.date))
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  let registered: number;
  let reserved: number;

  if (upcoming.length > 0) {
    const perDate = await fetchEventDateCounts(slug);
    const earliest = upcoming.find(d => !isDateSoldOut({
      status: d.status,
      date: d.date,
      capacity,
      reserved: perDate[d.date as string]?.reserved ?? 0,
    }));
    if (!earliest) return `${label} - sold out`;
    reserved   = perDate[earliest.date as string]?.reserved   ?? 0;
    registered = perDate[earliest.date as string]?.registered ?? 0;
  } else if (allDates.length > 0) {
    // Every date has elapsed → there is nothing left to announce.
    return null;
  } else {
    // No per-date structure → fall back to event-level counts.
    ({ registered, reserved } = await fetchEventCounts(slug));
    if (reserved >= capacity) return `${label} - sold out`;
  }

  if (reserved / capacity >= 0.5) return `${label} - ${capacity - reserved} spots left`;
  const displayed = (capacity * 3) + registered;
  return `${label} - ${displayed} people have registered`;
}

export async function fetchEvents(): Promise<any[]> {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_dates ( * ),
      event_media ( * ),
      event_reviews ( * ),
      faqs ( * )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Supabase fetchEvents error:', error);
    return [];
  }

  return (data ?? []).map(mapDbEventToEvent);
}

export async function fetchEventByIdOrSlug(idOrSlug: string): Promise<any | null> {
  const baseSelect = `
      *,
      event_dates ( * ),
      event_media ( * ),
      event_reviews ( * ),
      faqs ( * )
    `;

  let { data, error } = await supabase
    .from('events')
    .select(baseSelect)
    .eq('id', idOrSlug)
    .single();

  if (error || !data) {
    const slugRes = await supabase
      .from('events')
      .select(baseSelect)
      .eq('slug', idOrSlug)
      .single();
    data = slugRes.data;
  }

  return data ? mapDbEventToEvent(data) : null;
}
