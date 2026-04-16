/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://txcmismkdttgsyhbnexf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4Y21pc21rZHR0Z3N5aGJuZXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMzEyMzksImV4cCI6MjA5MDkwNzIzOX0.0GTg30cJz28QiTzadCjCAAxa8ZPRkV5EptNXNMjTRI0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Maps a raw Supabase row + related rows to the Event shape used in AppFlow
export function mapDbEventToEvent(row: any): any {
  return {
    id: row.slug ?? row.id,
    cities: Array.isArray(row.cities) ? row.cities : (row.cities ?? []),
    category: row.category ?? 'Trips',
    isActivity: row.is_activity ?? false,
    title: row.title,
    timing: row.timing,
    price: `₹${Number(row.price_full).toLocaleString('en-IN')}`,
    advanceAmount: row.price_advance,
    description: row.description,
    heroImage: row.hero_image,
    startLocation: row.start_location,
    transport: row.transport,
    groupSize: row.group_size,
    accommodationType: row.accommodation_type,
    included: Array.isArray(row.included) ? row.included : (row.included ?? []),
    notIncluded: Array.isArray(row.not_included) ? row.not_included : (row.not_included ?? []),
    optionalActivities: Array.isArray(row.optional_activities) ? row.optional_activities : (row.optional_activities ?? []),
    announcements: Array.isArray(row.announcements) ? row.announcements : (row.announcements ?? []),
    bookingUrl: row.booking_url,
    inviteOnly: row.invite_only ?? false,
    waitlistUrl: row.waitlist_url ?? undefined,
    quickInfo: row.quick_info ?? [],
    pickupPoints: row.pickup_points ?? [],
    transportPlan: row.transport_plan ?? [],
    itinerary: row.itinerary ?? [],
    accommodation: row.accommodation ?? { name: '', images: [], features: [], policy: '' },
    dates: (row.event_dates ?? []).map((d: any) => ({
      date: d.start_date,
      status: d.status,
      label: d.label ?? undefined,
    })),
    videos: (row.event_media ?? []).map((m: any) => ({
      thumbnail: m.thumbnail_url,
      caption: m.caption,
    })),
    reviews: (row.event_reviews ?? []).map((r: any) => ({
      name: r.name,
      rating: r.rating,
      text: r.review_text,
      images: Array.isArray(r.images) ? r.images : (r.images ?? []),
    })),
    faqs: (row.faqs ?? []).map((f: any) => ({
      question: f.question,
      answer: f.answer,
    })),
  };
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
