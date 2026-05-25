import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, fetchEvents, fetchEventByIdOrSlug, fetchChatMessages, fillMsg, trackEvent, fetchEventCounts } from './supabase';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, MessageCircle, Ticket, Send, CheckCircle2, XCircle, ChevronDown, ChevronUp, Star, Play, ChevronLeft, ChevronRight, Users, Bus, Home, Timer, ShieldCheck, Plus, Minus, Train, Car, Heart, ArrowRight } from 'lucide-react';
import chatProfile from './assets/chat-profile.jpg';

// Types
type Message = {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  time?: string;
};

interface TripDate {
  date: string;
  status: 'available' | 'selling_out' | 'sold_out';
  label?: string;
  bookingSteps?: Array<{ label: string; value: string; date: string }>;
}

type FAQ = {
  question: string;
  answer: string;
};

type QuickInfoIcon = 'pin' | 'bus' | 'users' | 'home' | 'clock' | 'ticket' | 'map' | 'heart';
const GIRLS_ONLY_QUICK_INFO_LABELS = new Set(['galcode event', 'girls only event', "girl's only event", 'girls_only_event']);

const hasGirlsOnlyQuickInfo = (quickInfo?: { label?: string; value?: string }[]) =>
  Array.isArray(quickInfo) &&
  quickInfo.some((item) =>
    GIRLS_ONLY_QUICK_INFO_LABELS.has(String(item.label ?? '').trim().toLowerCase()) &&
    String(item.value ?? '').trim().toLowerCase() !== 'false'
  );

const sortGirlsOnlyLast = (events: Event[]) =>
  [...events].sort((a, b) => Number(Boolean(a.girlsOnly || hasGirlsOnlyQuickInfo(a.quickInfo))) - Number(Boolean(b.girlsOnly || hasGirlsOnlyQuickInfo(b.quickInfo))));

interface Event {
  quickInfo?: { icon: QuickInfoIcon; label: string; value: string }[];
  id: string;
  cities: string[];
  category: string;
  isActivity?: boolean;
  showSecretOffer?: boolean;
  title: string;
  oneLiner?: string;
  timing: string;
  price: string;
  priceFull: number;
  advanceAmount: number;
  priceAdvance: number;
  description: string;
  heroImage: string;
  heroImages?: string[];
  detailsLandscapeImage?: string;
  startLocation: string;
  pickupPoints?: {
    id: string;
    label: string;
    meetingSpot: string;
    time: string;
    transport: string;
    dateOffset?: number;
    ownTransportPrice?: number;
    ownOnly?: boolean;
    otherPrice?: number;
    otherAdvance?: number;
    forOtherCity?: boolean;
    forCity?: string;
  }[];
  transport: string;
  groupSize: string;
  accommodationType: string;
  included: string[];
  notIncluded: string[];
  transportPlan?: {
    type: 'train' | 'bus' | 'tempo' | 'jeep' | 'flight';
    from: string;
    to: string;
    time: string;
    dateOffset: number;
    cities?: string[];
  }[];
  itinerary: { 
    day: string; 
    title: string; 
    description: string;
    schedule?: { time: string; activity: string }[];
  }[];
  showAccommodation?: boolean;
  accommodation: {
    name?: string;
    images?: string[];
    features?: string[];
    policy?: string;
    stays?: { name: string; image?: string; images?: string[]; features: string[] }[];
  };
  optionalActivities?: string[];
  videos: { thumbnail: string; url?: string; caption: string }[];
  reviews: { name: string; rating: number; text: string; dateLabel?: string; reviewCount?: number; images: string[] }[];
  dates: TripDate[];
  faqs: FAQ[];
  bookingUrl: string;
  ctaLabel?: string;
  announcements?: string[];
  inviteOnly?: boolean;
  girlsOnly?: boolean;
  waitlistUrl?: string;
  bookingSteps?: Array<{ label: string; value: string; date: string }>;
  kynPaymentUrl?: string | null;
  ticketTypes?: Array<{ id: string; label: string; price: number; advance: number }>;
}

type GroupChatMessage = { name: string; text: string };
type HistoryLayer = 'event-details' | 'details-calendar' | 'details-plan-switcher' | 'post-details-chat' | 'doubt-popup' | 'booking-timeline' | 'details-form' | 'payment-checkout' | 'payment-success' | 'payment-failure' | 'tc-modal';

const GROUPCHAT_MESSAGES: GroupChatMessage[] = [
  { name: 'Harish', text: 'Had such a fun time guys, do lemme know when we plan another beach trip.' },
  { name: 'Nivi', text: 'Does someone have that video of me falling from the surf board? haha' },
  { name: 'Bish', text: 'Bro that sunrise hit different. Still not over that vibe.' },
  { name: 'Kavi', text: 'I came for the trip, left with 4 new people on my speed dial.' },
  { name: 'Reshma', text: 'Can we do a random no-plan food run this weekend too?' },
  { name: 'Jagannath', text: 'Next one I am bringing cards. Post-dinner game table was chaos.' },
];

const GROUPCHAT_AVATAR_COLORS = ['#5B8DEF', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#14B8A6', '#EC4899', '#F97316'];
const HISTORY_LAYER_DEPTH: Record<HistoryLayer, number> = {
  'event-details': 1,
  'details-calendar': 2,
  'details-plan-switcher': 2,
  'post-details-chat': 3,
  'doubt-popup': 4,
  'booking-timeline': 5,
  'details-form': 6,
  'payment-checkout': 7,
  'payment-success': 8,
  'payment-failure': 8,
  'tc-modal': 9,
};

const getGroupchatColor = (name: string) => {
  const hash = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return GROUPCHAT_AVATAR_COLORS[Math.abs(hash) % GROUPCHAT_AVATAR_COLORS.length];
};

const getGroupchatInitial = (name: string) => {
  const first = (name ?? '').trim().charAt(0);
  return first ? first.toUpperCase() : '?';
};

// Fallback data used only if Supabase is unavailable
const FALLBACK_EVENTS: Event[] = [
  {
    id: 'e1',
    cities: ['Chennai'],
    category: 'Trips',
    title: 'Pondicherry Weekend Escape',
    timing: '1 Night 2 Days',
    price: '₹7,999',
    priceFull: 7999,
    priceAdvance: 2400,
    advanceAmount: 2400,
    description: 'A breezy coastal reset with White Town walks, cafe hopping, sea-facing sunsets, and one easy weekend away with a like-minded group.',
    heroImage: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1600&auto=format&fit=crop',
    startLocation: 'Chennai Pickups',
    quickInfo: [
      { icon: 'pin', label: 'Meeting Spot', value: 'Koyambedu / Anna Nagar / Own Transport' },
      { icon: 'bus', label: 'Transport', value: 'AC Tempo Traveller' },
      { icon: 'users', label: 'Group Size', value: '18 travellers max' },
      { icon: 'heart', label: 'Made For', value: 'Beach lovers, cafe people, and easy weekends' },
    ],
    transportPlan: [
      { type: 'bus', from: 'Chennai', to: 'Pondicherry', time: '6:00 AM', dateOffset: 0, cities: ['Chennai'] },
      { type: 'bus', from: 'Pondicherry', to: 'Chennai', time: '5:30 PM', dateOffset: 1 }
    ],
    transport: 'AC Tempo Traveller',
    groupSize: 'Max 18 travellers',
    accommodationType: 'Boutique stay in White Town',
    included: [
      'Round-trip transport from Chennai',
      '1 night boutique stay on twin sharing basis',
      'Day 1 breakfast and dinner',
      'Beach sunset walk and White Town trail',
      'Experience host and on-ground coordination'
    ],
    notIncluded: [
      'Lunches, cafe orders, and personal shopping',
      'Water sports or cycle rentals',
      'Any entry tickets not listed in inclusions',
      'Anything outside the planned route'
    ],
    optionalActivities: [
      'Promenade cycle ride at sunrise',
      'Auroville bakery run',
      'Kayaking or surfing session'
    ],
    itinerary: [
      {
        day: 'Day 1',
        title: 'Chennai To White Town',
        description: 'Early start from Chennai, brunch by the sea, check in, then spend the afternoon between heritage streets, cafes, and the promenade.',
        schedule: [
          { time: '6:00 AM', activity: 'Depart Chennai' },
          { time: '10:30 AM', activity: 'Brunch and White Town stroll' },
          { time: '5:30 PM', activity: 'Rock Beach sunset and dinner' }
        ]
      },
      {
        day: 'Day 2',
        title: 'Slow Morning And Return',
        description: 'Wake up slow, grab breakfast, choose between beach time and cafes, then drive back to Chennai by evening.',
        schedule: [
          { time: '8:30 AM', activity: 'Breakfast and free time' },
          { time: '12:00 PM', activity: 'Lunch and checkout' },
          { time: '5:30 PM', activity: 'Reach Chennai' }
        ]
      }
    ],
    accommodation: {
      name: 'White Town Courtyard Stay',
      images: [
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop'
      ],
      features: [
        'Walkable to White Town cafes and promenade',
        'Twin-sharing rooms with attached baths',
        'Breakfast included the next morning'
      ],
      policy: 'Twin sharing by default; limited solo upgrade on request'
    },
    videos: [
      {
        thumbnail: 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?q=80&w=400&auto=format&fit=crop',
        caption: 'Golden-hour walks by the promenade'
      },
      {
        thumbnail: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?q=80&w=400&auto=format&fit=crop',
        caption: 'White Town corners and slow cafe stops'
      }
    ],
    reviews: [
      {
        name: 'Nivedha R',
        rating: 5,
        text: 'Super easy weekend plan. Enough structure to feel taken care of, but still lots of time to chill and explore.',
        images: ['https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=200&auto=format&fit=crop']
      }
    ],
    dates: [
      { date: '2026-04-18', status: 'available', label: 'Beach weekend' },
      { date: '2026-05-02', status: 'selling_out', label: 'Almost full' }
    ],
    faqs: [
      { question: 'Can I join solo?', answer: 'Yes. Most people join solo and we room-share thoughtfully unless you ask for a solo upgrade.' },
      { question: 'Is this beginner-friendly?', answer: 'Absolutely. It is designed as a relaxed coastal getaway with very light activity.' }
    ],
    bookingUrl: '/phonepe-mock',
    announcements: [
      'Pondicherry Weekend Escape is now open',
      'Beach sunsets, cafes, and a boutique stay',
      'Round-trip transport from Chennai included'
    ]
  },
  {
    id: 'e2',
    cities: ['Chennai'],
    category: 'Trips',
    title: 'Kolukkumalai Sunrise Trail',
    timing: '2 Nights 3 Days',
    price: '₹11,999',
    priceFull: 11999,
    priceAdvance: 3600,
    advanceAmount: 3600,
    description: 'A high-energy mountain escape with an overnight road trip, a pre-dawn jeep climb, sunrise above the clouds, and tea-estate weather that feels like a reset.',
    heroImage: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?q=80&w=1600&auto=format&fit=crop',
    startLocation: 'Chennai Pickups',
    quickInfo: [
      { icon: 'pin', label: 'Meeting Spot', value: 'Koyambedu / Anna Nagar / Own Transport' },
      { icon: 'bus', label: 'Transport', value: 'Overnight coach + jeep transfer' },
      { icon: 'users', label: 'Group Size', value: '16 travellers max' },
      { icon: 'heart', label: 'Made For', value: 'Sunrise chasers and mountain people' },
    ],
    transportPlan: [
      { type: 'bus', from: 'Chennai', to: 'Munnar Basecamp', time: '9:30 PM', dateOffset: 0, cities: ['Chennai'] },
      { type: 'jeep', from: 'Suryanelli', to: 'Kolukkumalai', time: '4:30 AM', dateOffset: 1 },
      { type: 'bus', from: 'Munnar', to: 'Chennai', time: '6:00 PM', dateOffset: 2 }
    ],
    transport: 'Sleeper coach + jeep',
    groupSize: 'Max 16 travellers',
    accommodationType: 'Cozy Munnar stay',
    included: [
      'Round-trip overnight transport from Chennai',
      'Jeep ride to Kolukkumalai viewpoint',
      '2 nights stay on twin or triple sharing basis',
      '2 breakfasts and 1 camp-style dinner',
      'Experience host and trip coordination'
    ],
    notIncluded: [
      'Lunches, snacks, and tea shop spends',
      'Any personal shopping or extra activities',
      'Travel insurance',
      'Anything outside the listed inclusions'
    ],
    optionalActivities: [
      'Campfire games at the stay',
      'Tea factory stop',
      'Short waterfall detour on the return'
    ],
    itinerary: [
      {
        day: 'Day 1',
        title: 'Overnight Departure',
        description: 'Board from Chennai at night and settle into the road-trip mood as we drive toward the hills.',
        schedule: [
          { time: '9:30 PM', activity: 'Depart Chennai' },
          { time: '11:45 PM', activity: 'Highway snack stop' }
        ]
      },
      {
        day: 'Day 2',
        title: 'Kolukkumalai Sunrise',
        description: 'Reach the foothills before dawn, take the jeep up to Kolukkumalai, catch sunrise, then head to the stay for a slower afternoon.',
        schedule: [
          { time: '4:30 AM', activity: 'Jeep climb from Suryanelli' },
          { time: '6:00 AM', activity: 'Sunrise at Kolukkumalai' },
          { time: '2:00 PM', activity: 'Check in and rest at Munnar stay' }
        ]
      },
      {
        day: 'Day 3',
        title: 'Tea Views And Return',
        description: 'A scenic morning through tea estates before beginning the return journey to Chennai by evening.',
        schedule: [
          { time: '8:30 AM', activity: 'Breakfast and tea-estate walk' },
          { time: '12:30 PM', activity: 'Checkout and lunch stop' },
          { time: '6:00 PM', activity: 'Depart toward Chennai' }
        ]
      }
    ],
    accommodation: {
      name: 'Munnar Hillside Retreat',
      images: [
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop'
      ],
      features: [
        'Hillside stay close to the Munnar route',
        'Warm common lounge for the group',
        'Twin or triple sharing rooms depending on batch'
      ],
      policy: 'Rooming is assigned thoughtfully based on group mix and availability'
    },
    videos: [
      {
        thumbnail: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop',
        caption: 'Sunrise layers over the tea hills'
      },
      {
        thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=400&auto=format&fit=crop',
        caption: 'Clouds, winding roads, and cold mornings'
      }
    ],
    reviews: [
      {
        name: 'Harish K',
        rating: 5,
        text: 'The sunrise was unreal. The overnight travel felt smooth because the whole thing was coordinated really well.',
        images: ['https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=200&auto=format&fit=crop']
      }
    ],
    dates: [
      { date: '2026-04-24', status: 'selling_out', label: 'Few spots left' },
      { date: '2026-05-08', status: 'available', label: 'Mountain batch' }
    ],
    faqs: [
      { question: 'Is the jeep ride included?', answer: 'Yes. The Kolukkumalai jeep transfer is part of the trip cost.' },
      { question: 'How difficult is the trip?', answer: 'It is beginner-friendly overall, but the overnight travel and early sunrise start make it best for people comfortable with a packed schedule.' }
    ],
    bookingUrl: '/phonepe-mock',
    announcements: [
      'Kolukkumalai Sunrise Trail is now open',
      'Overnight road trip, jeep climb, and sunrise views',
      'Munnar weather and tea-estate mornings included'
    ]
  },
];

const GENERAL_ANNOUNCEMENTS = [
  "Chennai-based social club with 4000+ members",
  "Pondicherry Weekend Escape bookings are live",
  "Kolukkumalai Sunrise Trail now taking bookings"
];


const formatUpiINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
const LOCAL_INVITE_PAYMENT_SUBMISSIONS_KEY = 'chaptera_invite_payment_submissions';

const SUPABASE_FUNCTIONS_URL = 'https://txcmismkdttgsyhbnexf.supabase.co/functions/v1';

// VAPID public key in Uint8Array form — iOS Safari requires this, not a string.
const VAPID_PUBLIC_KEY_B64 = 'BKXd5KDV_vL6P19fk10d2STjZSkGHSXz_zHHBg53RxwKIRCDSEn0lHPfCBwDvphRbjnvX0Th-99GHh-cs6yEHpU';
function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

// Helper: write diagnostic log to Supabase. Fire-and-forget so it never blocks.
function logPushStep(phone: string, step: string, status: string, detail?: string) {
  const isPwa = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
  supabase.from('push_debug_logs').insert({
    phone: phone.replace(/\D/g, '').slice(-10) || null,
    step,
    status,
    detail: detail ? String(detail).slice(0, 500) : null,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : null,
    is_pwa: isPwa,
  }).then(() => {}, () => {});
}

// Module-level helper so ApplicationForm can subscribe without prop-drilling.
// Returns a status string for the caller to show in the UI.
async function subscribeToPushForPwa(phone: string): Promise<string> {
  logPushStep(phone, 'start', 'called');
  try {
    const hasNotif = 'Notification' in window;
    const hasSW = 'serviceWorker' in navigator;
    const hasPM = 'PushManager' in window;
    logPushStep(phone, 'feature_check', `notif=${hasNotif} sw=${hasSW} pm=${hasPM}`);
    if (!hasNotif || !hasSW || !hasPM) {
      return `Push not supported (notif=${hasNotif}, sw=${hasSW}, pm=${hasPM})`;
    }

    logPushStep(phone, 'permission_request', 'requesting');
    const permission = await Notification.requestPermission();
    logPushStep(phone, 'permission_result', permission);
    if (permission !== 'granted') return `Permission ${permission}`;

    logPushStep(phone, 'sw_ready', 'awaiting');
    const reg = await navigator.serviceWorker.ready;
    logPushStep(phone, 'sw_ready', 'ready', reg.scope);

    logPushStep(phone, 'get_existing_sub', 'checking');
    let sub = await reg.pushManager.getSubscription();
    logPushStep(phone, 'get_existing_sub', sub ? 'found' : 'none');

    if (!sub) {
      logPushStep(phone, 'subscribe', 'starting');
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY_B64),
      });
      logPushStep(phone, 'subscribe', 'success', sub.endpoint.slice(0, 80));
    }

    const j = sub.toJSON();
    if (!j.keys) {
      logPushStep(phone, 'tojson', 'no_keys');
      return 'Subscription has no keys';
    }

    logPushStep(phone, 'db_upsert', 'starting');
    const { error: upsertErr } = await supabase.from('push_subscriptions').upsert(
      { phone: phone.replace(/\D/g, '').slice(-10), endpoint: sub.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth },
      { onConflict: 'phone,endpoint' },
    );
    if (upsertErr) {
      logPushStep(phone, 'db_upsert', 'error', upsertErr.message);
      return `DB error: ${upsertErr.message}`;
    }
    logPushStep(phone, 'db_upsert', 'success');
    return 'OK';
  } catch (err: any) {
    const msg = err?.message || String(err);
    logPushStep(phone, 'exception', 'caught', `${err?.name || 'Error'}: ${msg}`);
    return `Error: ${err?.name || 'Error'} — ${msg}`;
  }
}

function PayUCheckout({ paymentContext, onError }: {
  paymentContext: { name: string; phone: string; email?: string; amount: number; eventId?: string; eventTitle: string; tripDateFull: string; whatsappGroupUrl?: string };
  onError: () => void;
}) {
  const formRef = React.useRef<HTMLFormElement>(null);
  const [fields, setFields] = React.useState<Record<string, string> | null>(null);
  const [payuUrl, setPayuUrl] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    fetch(`${SUPABASE_FUNCTIONS_URL}/create-payu-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: paymentContext.name,
        phone: paymentContext.phone,
        email: paymentContext.email ?? null,
        amount: paymentContext.amount,
        event_id: paymentContext.eventId ?? null,
        event_slug: paymentContext.eventId ?? null,
        event_title: paymentContext.eventTitle,
        trip_date: paymentContext.tripDateFull,
        whatsapp_group_url: paymentContext.whatsappGroupUrl ?? null,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setPayuUrl(data.payu_url);
        setFields(data.fields);
      })
      .catch(() => setError('Could not initiate payment. Please try again.'));
  }, []);

  React.useEffect(() => {
    if (fields && formRef.current) formRef.current.submit();
  }, [fields]);

  return (
    <div className="absolute inset-0 z-[70] bg-white flex flex-col items-center justify-center gap-4">
      {error ? (
        <div className="flex flex-col items-center gap-3 px-8 text-center">
          <p className="text-red-500 text-sm font-medium">{error}</p>
          <button onClick={onError} className="text-sm text-gray-500 underline">Go back</button>
        </div>
      ) : (
        <>
          <svg className="w-10 h-10 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-gray-500 text-sm font-medium">Redirecting to PayU...</p>
        </>
      )}
      {fields && payuUrl && (
        <form ref={formRef} method="POST" action={payuUrl} className="hidden">
          {Object.entries(fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}
    </div>
  );
}

// ─── APPLICATION FORM ──────────────────────────────────────────────────────────
function ApplicationForm({ event, selectedDate, selectedPickupId, selectedCity, reservedCount, onClose }: { event: any; selectedDate?: string; selectedPickupId?: string; selectedCity?: string; reservedCount: number | null; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', gender: '', whyJoin: '', attendedBefore: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const inviteSpots = typeof event?.inviteSpots === 'number' ? event.inviteSpots : null;
  const spotsLeft = inviteSpots != null && typeof reservedCount === 'number'
    ? Math.max(0, inviteSpots - reservedCount)
    : null;

  const isValid = form.name.trim() && /^\d{10}$/.test(form.phone) && form.gender && form.whyJoin.trim();

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError('');

    // Must be called before any await — iOS requires PushManager.subscribe()
    // to originate from a user gesture context (the button tap).
    // TEMP: show the result in an alert so we can see what's happening on iOS
    // without needing a Mac-tethered debugger. Remove once stable.
    subscribeToPushForPwa(form.phone).then(status => {
      try { alert(`Push: ${status}`); } catch {}
    });

    // Resolve the chosen pickup point details for storage
    const chosenPoint = selectedPickupId
      ? (event.pickupPoints ?? []).find((p: any) => p.id === selectedPickupId)
      : null;

    const { error: sbError } = await supabase.from('applications').insert({
      event_slug: String(event.id ?? '').toLowerCase(),
      name: form.name.trim(),
      phone: form.phone,
      gender: form.gender,
      why_join: form.whyJoin.trim(),
      attended_before: form.attendedBefore.trim(),
      status: 'pending',
      selected_date: selectedDate ?? null,
      pickup_point_id: chosenPoint?.id ?? selectedPickupId ?? null,
      pickup_label: chosenPoint?.label ?? null,
      selected_city: selectedCity ?? null,
    });

    if (sbError) {
      if (sbError.code === '23505') {
        setAlreadyApplied(true);
      } else {
        setError('Something went wrong. Please try again.');
      }
      setSubmitting(false);
      return;
    }
    const dateStr = selectedDate || event.dates?.[0]?.date || '';
    const formattedDate = (() => {
      if (!dateStr) return '';
      const d = new Date(`${dateStr}T00:00:00`);
      if (isNaN(d.getTime())) return '';
      const month = d.toLocaleDateString('en-US', { month: 'long' });
      const day = d.getDate();
      const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
      return `${month} ${day}${suffix}`;
    })();
    // TODO: restore WhatsApp redirect once push notification testing is complete
    // const waText = `Hi, I'm ${form.name.trim()}. I have registered for ${event.title}${formattedDate ? ` on ${formattedDate}` : ''}.`;
    // window.open(`https://wa.me/919940111564?text=${encodeURIComponent(waText)}`, '_blank');
    onClose();
  };

  if (alreadyApplied) return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl">👋</div>
      <p className="text-[20px] font-black text-gray-900">Already Applied!</p>
      <p className="text-[14px] text-gray-500 leading-relaxed max-w-[260px]">We already have your application for this plan. We'll reach out on WhatsApp if you're selected.</p>
      <button onClick={onClose} className="mt-2 w-full py-4 rounded-2xl bg-black text-white font-bold text-[15px] active:opacity-80">Got it</button>
    </div>
  );


  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">

      {/* Name */}
      <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
        <input
          type="text" value={form.name} placeholder="Your full name"
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full bg-transparent text-[16px] font-semibold text-gray-900 placeholder-gray-400 outline-none mt-1"
        />
      </div>

      {/* Phone */}
      <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">WhatsApp Number</label>
        <input
          type="tel" value={form.phone} placeholder="10-digit number"
          onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
          className="w-full bg-transparent text-[16px] font-semibold text-gray-900 placeholder-gray-400 outline-none mt-1"
        />
      </div>

      {/* Gender */}
      <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gender</label>
        <div className="flex gap-2 mt-2">
          {['Male', 'Female', 'Other'].map(g => (
            <button
              key={g} type="button"
              onClick={() => setForm(f => ({ ...f, gender: g }))}
              className={`flex-1 py-2 rounded-xl text-[13px] font-bold transition-all ${form.gender === g ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
            >{g}</button>
          ))}
        </div>
      </div>

      {/* Why join */}
      <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Why do you want to join us?</label>
        <textarea
          value={form.whyJoin} placeholder="Tell us a little about yourself and why this plan excites you..."
          onChange={e => setForm(f => ({ ...f, whyJoin: e.target.value }))}
          rows={3}
          className="w-full bg-transparent text-[15px] font-medium text-gray-900 placeholder-gray-400 outline-none mt-1 resize-none leading-relaxed"
        />
      </div>

      {/* Attended before */}
      <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Attended a chapter அ event before?</label>
        <textarea
          value={form.attendedBefore} placeholder="If yes, which one? (Optional)"
          onChange={e => setForm(f => ({ ...f, attendedBefore: e.target.value }))}
          rows={2}
          className="w-full bg-transparent text-[15px] font-medium text-gray-900 placeholder-gray-400 outline-none mt-1 resize-none leading-relaxed"
        />
      </div>

      {error && <p className="text-[13px] text-red-500 text-center">{error}</p>}

      {/* Submit */}
      <div className="pb-6 pt-2">
        <button
          type="button" disabled={!isValid || submitting}
          onClick={handleSubmit}
          className="w-full py-[17px] rounded-2xl bg-black text-white font-black text-[17px] flex items-center justify-center gap-2 active:opacity-80 transition-all disabled:opacity-40"
        >
          {submitting ? (
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
          ) : (
            <>Submit Application <ArrowRight size={18} strokeWidth={2.5} /></>
          )}
        </button>
        {spotsLeft !== null && (
          <p className="mt-3 text-[12px] font-semibold text-center text-[#b45309]">
            🔥 Only {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
          </p>
        )}
      </div>
    </div>
  );
}

export default function App({ onClose }: { onClose?: () => void } = {}) {
  const [events, setEvents] = useState<Event[]>(FALLBACK_EVENTS);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [loadingSlow, setLoadingSlow] = useState(false);
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const [msgsReady, setMsgsReady] = useState(false);
  const isPreviewMode = typeof window !== 'undefined' && !!new URLSearchParams(window.location.search).get('preview_event');
  const isPlansPath = typeof window !== 'undefined' && window.location.pathname === '/plans';
  const isPlansHistoryManaged = isPlansPath && !isPreviewMode;
  const isDetailsHistoryManaged = isPlansHistoryManaged || isPreviewMode;
  const [previewLoading, setPreviewLoading] = useState(isPreviewMode);
  const historyLayerRef = useRef<HistoryLayer | null>(null);
  const handlingPopStateRef = useRef(false);

  useEffect(() => {
    // After 5s without events, show a "connection slow" retry screen instead of
    // unblocking with stale fallback data. msgsReady CAN timeout safely since
    // message strings fall back to hardcoded defaults which are fine.
    const slowTimeout = setTimeout(() => setLoadingSlow(true), 5000);
    const msgsTimeout = setTimeout(() => setMsgsReady(true), 5000);

    fetchEvents().then((data) => {
      clearTimeout(slowTimeout);
      if (data.length > 0) setEvents(data);
      setEventsLoaded(true);
    });
    fetchChatMessages().then((data) => {
      clearTimeout(msgsTimeout);
      if (Object.keys(data).length > 0) setMsgs(data);
      setMsgsReady(true);
    });
    return () => { clearTimeout(slowTimeout); clearTimeout(msgsTimeout); };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previewEvent = params.get('preview_event');
    if (!previewEvent) return;
    const isGauthReturn = params.get('gauth') === '1';
    fetchEventByIdOrSlug(previewEvent).then((event) => {
      if (!event) { setPreviewLoading(false); return; }
      setSelectedEvent(event);
      setSelectedCategory(event.category || 'Trips');
      setShowTransition(false);
      setShowDetails(true);
      setStep('EVENT_SELECTED');
      setPreviewLoading(false);

      if (isGauthReturn) {
        // Restore flow state saved before the OAuth redirect
        let savedCity = event.cities?.[0] || 'Chennai';
        let savedDate = '';
        let savedMeetingPoint = '';
        try {
          const raw = localStorage.getItem('gauth_return');
          if (raw) {
            const state = JSON.parse(raw);
            localStorage.removeItem('gauth_return');
            if (state.city) savedCity = state.city;
            if (state.date) savedDate = state.date;
            if (state.meetingPoint) savedMeetingPoint = state.meetingPoint;
          }
        } catch { /* ignore */ }
        setSelectedCity(savedCity);
        if (savedDate) setBookingDate(savedDate);
        if (savedDate || savedMeetingPoint) {
          setJourneyCardData({
            event,
            city: savedCity,
            startDate: savedDate || event.dates?.[0]?.date || '',
            meetingPoint: savedMeetingPoint,
          });
        }
        // Clean gauth param from URL
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('gauth');
        window.history.replaceState({}, '', cleanUrl.toString());
        // Pre-fill name from Google session and open details form
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session?.user) return;
          const fullName =
            session.user.user_metadata?.full_name ??
            session.user.user_metadata?.name ??
            '';
          const email = session.user.email ?? '';
          if (fullName) {
            setGoogleUser({ name: fullName, email });
            setDetailsForm(f => ({ ...f, name: fullName }));
          }
          setShowDetails(false);
          setShowDetailsForm(true);
          setShowBookingTimeline(false);
        });
      } else {
        setSelectedCity(event.cities?.[0] || 'Chennai');
      }
    });
  }, []);

  // Check for an existing Google session on mount (skip if this is a gauth return — handled above)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('gauth') === '1') return; // handled by preview_event effect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      const fullName =
        session.user.user_metadata?.full_name ??
        session.user.user_metadata?.name ??
        '';
      const email = session.user.email ?? '';
      if (fullName) setGoogleUser({ name: fullName, email });
    });
  }, []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState('INIT');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [bookingGender, setBookingGender] = useState('');
  const [bookingTransport, setBookingTransport] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [journeyCardData, setJourneyCardData] = useState<{ event: Event; city: string; startDate: string; meetingPoint?: string } | null>(null);
  const [showBookingTimeline, setShowBookingTimeline] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationCount, setApplicationCount] = useState<number | null>(null);
  const [reservedCount, setReservedCount] = useState<number | null>(null);
  const [detailsFormStep, setDetailsFormStep] = useState<'details' | 'instructions'>('details');
  const [detailsCalendarOpen, setDetailsCalendarOpen] = useState(false);
  const [closeDetailsCalendarSignal, setCloseDetailsCalendarSignal] = useState(0);
  const [detailsPlanSwitcherOpen, setDetailsPlanSwitcherOpen] = useState(false);
  const [openDetailsPlanSwitcherSignal, setOpenDetailsPlanSwitcherSignal] = useState(0);
  const [closeDetailsPlanSwitcherSignal, setCloseDetailsPlanSwitcherSignal] = useState(0);
  const [detailsReady, setDetailsReady] = useState(false);
  const detailsReadyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const detailsSafetyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [detailsForm, setDetailsForm] = useState({ name: '', phone: '' });
  const [tcAccepted, setTcAccepted] = useState(false);
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string } | null>(null);
  const [googleSignInLoading, setGoogleSignInLoading] = useState(false);
  const [existingBooking, setExistingBooking] = useState<any>(null);
  const [forceNewBooking, setForceNewBooking] = useState(false);

  // Auto-fill name + check for existing booking when Google user is set
  useEffect(() => {
    if (showDetailsForm && googleUser) {
      setDetailsForm(f => (f.name ? f : { ...f, name: googleUser.name }));
    }
    // Check if this Google account has already booked this event
    if (googleUser && selectedEvent && isPayUFlow) {
      supabase
        .from('payu_payments')
        .select('*')
        .eq('email', googleUser.email)
        .eq('event_id', selectedEvent.id)
        .eq('status', 'success')
        .limit(1)
        .then(({ data }) => {
          const booking = data?.[0] ?? null;
          setExistingBooking(booking);
          setForceNewBooking(false); // reset whenever booking status refreshes
          // Pre-fill phone from their last booking so "Book Another Spot" is ready to go
          if (booking?.phone) {
            setDetailsForm(f => ({ ...f, phone: f.phone || booking.phone }));
          }
        });
    } else {
      setExistingBooking(null);
      setForceNewBooking(false);
    }
  }, [showDetailsForm, googleUser, selectedEvent?.id]);
  const [showTcModal, setShowTcModal] = useState(false);
  const [paymentView, setPaymentView] = useState<'idle' | 'checkout' | 'success' | 'failure'>('idle');
  const [paymentContext, setPaymentContext] = useState<{
    eventId: string;
    eventTitle: string;
    amount: number;
    remainingBalance: number;
    date: string;
    balanceDue: string;
    balanceDueRaw: string;
    pickupDetails: string;
    tripDate: string;
    tripDateFull: string;
    phonepeUrl: string;
    shareUrl: string;
    name: string;
    phone: string;
    receiptId?: string;
    issuedAt?: string;
    girlsOnly?: boolean;
    isBalancePayment?: boolean;
    whatsappGroupUrl?: string;
    email?: string;
  } | null>(null);
  const [balanceCountdown, setBalanceCountdown] = useState('');
  const [offerAcknowledged, setOfferAcknowledged] = useState(false);
  const [showDoubtPopup, setShowDoubtPopup] = useState(false);
  const [doubtFormData, setDoubtFormData] = useState({ name: '', phone: '', message: '' });
  const [doubtSheetView, setDoubtSheetView] = useState<'form' | 'install' | 'chat'>('form');
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
  const [pwaInstallState, setPwaInstallState] = useState<'idle' | 'installing' | 'installed'>('idle');
  const pwaInstallCompleteTimerRef = useRef<number | null>(null);
  const [liveConversationId, setLiveConversationId] = useState<string | null>(
    () => localStorage.getItem('liveConversationId')
  );
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [liveChatInput, setLiveChatInput] = useState('');
  const [liveChatSending, setLiveChatSending] = useState(false);
  const [liveConvResolved, setLiveConvResolved] = useState(false);
  const liveChatEndRef = useRef<HTMLDivElement>(null);
  const [clickedFaqs, setClickedFaqs] = useState<string[]>([]);
  const isPostDetailsChatLayer =
    !!journeyCardData &&
    !!selectedEvent &&
    showChat &&
    !showDetails &&
    !showTransition &&
    !showBookingTimeline &&
    !showDetailsForm &&
    paymentView === 'idle' &&
    !showTcModal;
  const activeHistoryLayer: HistoryLayer | null =
    showTcModal ? 'tc-modal'
    : showDoubtPopup ? 'doubt-popup'
    : paymentView === 'failure' ? 'payment-failure'
    : paymentView === 'success' ? 'payment-success'
    : paymentView === 'checkout' ? 'payment-checkout'
    : showDetailsForm ? 'details-form'
    : showBookingTimeline ? 'booking-timeline'
    : isPostDetailsChatLayer ? 'post-details-chat'
    : (showDetails && detailsPlanSwitcherOpen) ? 'details-plan-switcher'
    : (showDetails && detailsCalendarOpen) ? 'details-calendar'
    : showDetails ? 'event-details'
    : null;
  const closeEventDetails = useCallback((viaHistory = false) => {
    if (!viaHistory && typeof window !== 'undefined' && isPlansHistoryManaged && activeHistoryLayer === 'event-details') {
      window.history.back();
      return;
    }
    setShowDetails(false);
    setShowTransition(false);
    setDetailsReady(false);
    setStep('SELECT_EVENT');
  }, [isPlansHistoryManaged, activeHistoryLayer]);
  const isPhonePeFlow = selectedEvent?.bookingUrl?.toLowerCase().includes('phonepe');
  const isPayUFlow    = selectedEvent?.bookingUrl === 'payu-hosted';
  const isNativeApplicationFlow = selectedEvent?.bookingUrl === 'native-application';

  // Fetch application count for native-application events
  useEffect(() => {
    if (!isNativeApplicationFlow || !selectedEvent?.id) {
      setApplicationCount(null);
      setReservedCount(null);
      return;
    }
    fetchEventCounts(selectedEvent.id).then(({ registered, reserved }) => {
      setApplicationCount(registered);
      setReservedCount(reserved);
    });
  }, [isNativeApplicationFlow, selectedEvent?.id]);

  const doubtCtaLabel = (msgs.doubt_cta_label || '').trim() || 'Vera Doubt Iruku';
  const getSelectedEventQuickInfoValue = (labels: string[]) =>
    selectedEvent?.quickInfo?.find(item => labels.includes(item.label))?.value?.trim() ?? '';
  const getSelectedDateForVars = () => bookingDate || journeyCardData?.startDate || selectedEvent?.dates?.[0]?.date || '';
  const getSelectedPickupForVars = () => {
    const selectedPointId = journeyCardData?.meetingPoint || '';
    if (!selectedEvent || !selectedPointId) {
      return {
        meetingSpot: selectedEvent?.startLocation || '',
        transport: selectedEvent?.transport || '',
        reportingTime: '',
      };
    }
    const point = selectedEvent.pickupPoints?.find(p => p.id === selectedPointId);
    return {
      meetingSpot: point?.meetingSpot || point?.label || selectedEvent.startLocation || '',
      transport: point?.transport || selectedEvent.transport || '',
      reportingTime: point?.time || '',
    };
  };
  const getTemplateVars = (overrides: Record<string, string> = {}) => {
    const dateStr = getSelectedDateForVars();
    const pickup = getSelectedPickupForVars();
    return {
      city: selectedCity ? formatCityLabel(selectedCity) : '',
      category: selectedCategory || selectedEvent?.category || '',
      title: selectedEvent?.title || '',
      reporting_date: dateStr ? formatFullDate(dateStr) : '',
      meeting_spot: pickup.meetingSpot,
      transport: pickup.transport,
      reporting_time: pickup.reportingTime,
      name: '',
      phone: '',
      doubt: '',
      ...overrides,
    };
  };
  const fillMsgForSelectedEvent = (
    key: string,
    vars: Record<string, string> = {},
    fallback = ''
  ) => {
    const tripRef = selectedEvent?.id;
    if (tripRef) {
      const tripKey = `trip_message:${tripRef}:${key}`;
      if (msgs[tripKey]) return fillMsg(msgs, tripKey, vars, fallback);
    }
    return fillMsg(msgs, key, vars, fallback);
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return 'TBD';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatFullDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return 'TBD';
    const day = d.getDate();
    const nth = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    return `${weekday}, ${month} ${day}${nth}`;
  };

  const shiftDateString = (dateStr: string, offset: number) => {
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const parsedGeneralAnnouncements = (msgs.general_announcements || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  // Fallback: pull live announcements from fetched events instead of stale hardcoded strings
  const eventDerivedAnnouncements = events
    .filter(e => !e.inviteOnly)
    .flatMap(e => e.announcements ?? [])
    .filter(Boolean)
    .slice(0, 8);
  const globalAnnouncements = parsedGeneralAnnouncements.length > 0
    ? parsedGeneralAnnouncements
    : eventDerivedAnnouncements.length > 0
      ? eventDerivedAnnouncements
      : GENERAL_ANNOUNCEMENTS;

  // Determine which announcements to show
  const isAfterTripInfo = step === 'ASK_DOUBTS' || step === 'SHOW_FAQ' || step === 'DONE';
  const currentAnnouncements = (isAfterTripInfo && (selectedEvent?.announcements?.length ?? 0) > 0)
    ? (selectedEvent?.announcements ?? [])
    : globalAnnouncements;

  // Clear timers when unmounting or re-running
  const clearDetailTimers = () => {
    if (detailsReadyTimerRef.current) clearTimeout(detailsReadyTimerRef.current);
    if (detailsSafetyTimerRef.current) clearTimeout(detailsSafetyTimerRef.current);
  };

  useEffect(() => clearDetailTimers, []);

  useEffect(() => {
    if (currentAnnouncements.length === 0) return;
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % currentAnnouncements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentAnnouncements.length]);

  // Once details are ready, let the overlay fade out before showing details
  useEffect(() => {
    if (!showTransition || !detailsReady) return;

    // Reveal details immediately underneath the fading overlay
    setShowDetails(true);
    setStep('EVENT_SELECTED');

    // Then fade the overlay out shortly after
    const exitTimer = setTimeout(() => {
      setShowTransition(false);
    }, 200);
    return () => clearTimeout(exitTimer);
  }, [detailsReady, showTransition]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isDetailsHistoryManaged) return;
    const previousLayer = historyLayerRef.current;
    const nextLayer = activeHistoryLayer;

    if (!nextLayer) {
      historyLayerRef.current = null;
      return;
    }
    if (handlingPopStateRef.current) {
      historyLayerRef.current = nextLayer;
      return;
    }
    if (previousLayer === nextLayer) return;

    const shouldPush = !previousLayer || HISTORY_LAYER_DEPTH[nextLayer] >= HISTORY_LAYER_DEPTH[previousLayer];
    if (shouldPush) {
      window.history.pushState({ chapteraLayer: nextLayer }, '', window.location.href);
    }
    historyLayerRef.current = nextLayer;
  }, [activeHistoryLayer, isDetailsHistoryManaged]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isDetailsHistoryManaged) return;
    const onPopState = () => {
      if (!activeHistoryLayer) return;
      handlingPopStateRef.current = true;
      if (
        isPlansHistoryManaged &&
        (activeHistoryLayer === 'event-details' || activeHistoryLayer === 'details-plan-switcher')
      ) {
        // Keep browser back trapped inside details: always surface the plan switcher.
        setOpenDetailsPlanSwitcherSignal(prev => prev + 1);
        setDetailsPlanSwitcherOpen(true);
        setShowDetails(true);
        setStep('EVENT_SELECTED');
        window.history.pushState({ chapteraLayer: 'details-plan-switcher' }, '', window.location.href);
        historyLayerRef.current = 'details-plan-switcher';
        setTimeout(() => { handlingPopStateRef.current = false; }, 0);
        return;
      }
      if (isPreviewMode && activeHistoryLayer === 'details-calendar') {
        setCloseDetailsCalendarSignal(prev => prev + 1);
        setDetailsCalendarOpen(false);
        setShowDetails(true);
        setStep('EVENT_SELECTED');
        setTimeout(() => { handlingPopStateRef.current = false; }, 0);
        return;
      }
      if (isPreviewMode && activeHistoryLayer === 'details-plan-switcher') {
        setCloseDetailsPlanSwitcherSignal(prev => prev + 1);
        setDetailsPlanSwitcherOpen(false);
        setShowDetails(true);
        setStep('EVENT_SELECTED');
        setTimeout(() => { handlingPopStateRef.current = false; }, 0);
        return;
      }
      if (isPreviewMode && activeHistoryLayer !== 'event-details') {
        setShowTcModal(false);
        setShowDoubtPopup(false);
        setPaymentView('idle');
        setShowDetailsForm(false);
        setShowBookingTimeline(false);
        setShowWaitlistForm(false);
        setDetailsPlanSwitcherOpen(false);
        setDetailsCalendarOpen(false);
        setShowChat(false);
        setShowTransition(false);
        setDetailsReady(true);
        setShowDetails(true);
        setStep('EVENT_SELECTED');
        setTimeout(() => { handlingPopStateRef.current = false; }, 0);
        return;
      }
      if (isPreviewMode && activeHistoryLayer === 'event-details') {
        window.location.assign('/aboutus');
        setTimeout(() => { handlingPopStateRef.current = false; }, 0);
        return;
      }
      if (activeHistoryLayer === 'tc-modal') {
        setShowTcModal(false);
      } else if (activeHistoryLayer === 'doubt-popup') {
        setShowDoubtPopup(false);
      } else if (activeHistoryLayer === 'payment-failure' || activeHistoryLayer === 'payment-success') {
        setPaymentView('checkout');
      } else if (activeHistoryLayer === 'payment-checkout') {
        setPaymentView('idle');
        setDetailsFormStep('instructions');
        setShowDetailsForm(true);
      } else if (activeHistoryLayer === 'details-form') {
        setShowDetailsForm(false);
        setDetailsFormStep('details');
        setShowBookingTimeline(true);
      } else if (activeHistoryLayer === 'booking-timeline') {
        setShowBookingTimeline(false);
        setShowDetails(true);
        setStep('EVENT_SELECTED');
      } else if (activeHistoryLayer === 'post-details-chat') {
        setShowDetails(true);
        setStep('EVENT_SELECTED');
      } else if (activeHistoryLayer === 'details-plan-switcher') {
        setCloseDetailsPlanSwitcherSignal(prev => prev + 1);
        setDetailsPlanSwitcherOpen(false);
      } else if (activeHistoryLayer === 'details-calendar') {
        setCloseDetailsCalendarSignal(prev => prev + 1);
        setDetailsCalendarOpen(false);
      } else if (activeHistoryLayer === 'event-details') {
        setOpenDetailsPlanSwitcherSignal(prev => prev + 1);
        setDetailsPlanSwitcherOpen(true);
      }
      setTimeout(() => { handlingPopStateRef.current = false; }, 0);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [activeHistoryLayer, isDetailsHistoryManaged, isPreviewMode, isPlansHistoryManaged, closeEventDetails]);

  // Reset announcement index when switching contexts
  useEffect(() => {
    setAnnouncementIndex(0);
  }, [isAfterTripInfo, selectedEvent]);

  // Balance due countdown timer
  useEffect(() => {
    if (paymentView !== 'success' || !paymentContext?.balanceDueRaw) return;
    const update = () => {
      const now = new Date();
      const due = new Date(`${paymentContext.balanceDueRaw}T23:59:59`);
      const diff = due.getTime() - now.getTime();
      if (diff <= 0) { setBalanceCountdown('Due now'); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setBalanceCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [paymentView, paymentContext?.balanceDueRaw]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatKynTime = (secs: number) => {
    const d = Math.floor(secs / (24 * 3600));
    const h = Math.floor((secs % (24 * 3600)) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(d).padStart(2, '0')}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };


  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Only start typing after loading screen clears (both events + msgs ready)
  // so users see: loading screen → chat appears → typing dots → first message
  useEffect(() => {
    if (!eventsLoaded || !msgsReady) return;
    simulateBotTyping(() => {
      setMessages([{
        id: Date.now().toString(),
        sender: 'bot',
        text: fillMsg(msgs, 'welcome', {}, 'Welcome to chapter அ! 👋\nWhich plan are you looking to join?'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      setStep('SELECT_EVENT');
    }, 1000);
  }, [eventsLoaded, msgsReady]);

  const simulateBotTyping = (callback: () => void, delay: number = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay);
  };

  const nowTimeStr = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text, time: nowTimeStr() }]);
  };

  const addBotMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text, time: nowTimeStr() }]);
  };

  const formatCityLabel = (city: string) => (city === 'Other' ? 'Other City' : city);

  const handleCitySelect = (city: string, label?: string) => {
    setStep('PROCESSING');
    const cityLabel = label ?? formatCityLabel(city);
    addUserMessage(cityLabel);
    setSelectedCity(city);
    trackEvent('city_selected', { city: cityLabel });

    simulateBotTyping(() => {
      const cityEvents = events.filter(e => e.cities.includes(city));
      if (cityEvents.length > 0) {
        const msgKey = city === 'Other' ? 'other_select_event' : 'select_event';
        addBotMessage(fillMsg(msgs, msgKey, { city: cityLabel }, `Here's what we have coming up in ${cityLabel}. What sounds good to you?`));
        setStep('SELECT_EVENT');
      } else {
        addBotMessage(fillMsg(msgs, 'no_events', { city: cityLabel }, `Oops, looks like we don't have anything scheduled in ${cityLabel} right now. Check back later!`));
        setStep('NO_EVENTS');
      }
    });
  };

  const handleCategorySelect = (category: string) => {
    setStep('PROCESSING');
    addUserMessage(category);
    setSelectedCategory(category);
    trackEvent('category_selected', { city: formatCityLabel(selectedCity), category });
    
    simulateBotTyping(() => {
      const cityLabel = formatCityLabel(selectedCity);
      const filteredEvents = events.filter(e => e.cities.includes(selectedCity) && e.category === category);
      if (filteredEvents.length > 0) {
        const selectPlanKey = selectedCity === 'Other' ? 'other_select_event' : 'select_event';
        addBotMessage(fillMsg(msgs, selectPlanKey, { city: cityLabel, category }, `Here are the upcoming ${category} in ${cityLabel}. Which one are you interested in?`));
        setStep('SELECT_EVENT');
      } else {
        addBotMessage(fillMsg(msgs, 'no_events', { city: cityLabel, category }, `Oops, looks like we don't have any ${category} scheduled in ${cityLabel} right now. Check back later!`));
        setStep('NO_EVENTS');
      }
    }, 1000);
  };

  const handleEventSelect = (event: Event) => {
    setStep('PROCESSING');
    addUserMessage(event.oneLiner || event.title);
    setSelectedEvent(event);
    trackEvent('event_selected', { city: formatCityLabel(selectedCity), category: selectedCategory || event.category, event_id: event.id, event_title: event.title });

    // After the user picks a plan, ask which city they're joining from.
    // Options come from the event's own cities array (minus "Other") + own transport.
    const pickupCities = (event.cities ?? []).filter((c: string) => c !== 'Other');

    if (pickupCities.length === 0) {
      // No designated pickup cities — skip the question, default to 'Other'
      setSelectedCity('Other');
      clearDetailTimers();
      setDetailsReady(false);
      setShowTransition(true);
      detailsReadyTimerRef.current = setTimeout(() => setDetailsReady(true), 1200);
      detailsSafetyTimerRef.current = setTimeout(() => setDetailsReady(true), 3000);
      setStep('EVENT_SELECTED');
      return;
    }

    // Build template vars — spots_left requires an async DB call
    const buildMeetingMsgVars = async () => {
      const eventname = event.title;

      // spots_left: only for capacity-limited events
      let spots_left = '';
      const capacity: number | null = (event as any).inviteSpots ?? (event as any).totalCapacity ?? null;
      if (capacity != null && capacity > 0) {
        const { reserved } = await fetchEventCounts(event.id);
        const left = Math.max(0, capacity - reserved);
        spots_left = left <= 5 ? 'last few' : String(left);
      }

      // eventdate: nearest upcoming non-sold-out date (1-city variant only)
      const eventdate = (() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const active = (event.dates ?? []).filter(d => d.status !== 'sold_out');
        const upcoming = active
          .map(d => new Date(d.date + 'T00:00:00'))
          .filter(d => d >= today)
          .sort((a, b) => a.getTime() - b.getTime());
        const d = upcoming[0]
          ?? active.map(d2 => new Date(d2.date + 'T00:00:00')).sort((a, b) => b.getTime() - a.getTime())[0];
        if (!d) return '';
        const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
        const month   = d.toLocaleDateString('en-US', { month: 'short' });
        const day = d.getDate();
        const v = day % 100;
        const su = ['th', 'st', 'nd', 'rd'];
        const suffix = su[(v - 20) % 10] || su[v] || su[0];
        return `${weekday}, ${month} ${day}${suffix}`;
      })();

      return { eventname, spots_left, eventdate };
    };

    buildMeetingMsgVars().then(vars => {
      simulateBotTyping(() => {
        let meetingPointMsg: string;
        if (pickupCities.length === 1) {
          meetingPointMsg = fillMsg(msgs, 'ask_pickup_city_1',
            { city1: pickupCities[0], eventname: vars.eventname, spots_left: vars.spots_left, eventdate: vars.eventdate },
            `This plan has a meeting point in {city1}.`);
        } else if (pickupCities.length === 2) {
          meetingPointMsg = fillMsg(msgs, 'ask_pickup_city_2',
            { city1: pickupCities[0], city2: pickupCities[1], eventname: vars.eventname, spots_left: vars.spots_left },
            `This plan has meeting points in {city1} & {city2}.`);
        } else {
          const numberedList = pickupCities.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n');
          meetingPointMsg = fillMsg(msgs, 'ask_pickup_city_many',
            { cities_list: numberedList, eventname: vars.eventname, spots_left: vars.spots_left },
            `This plan has meeting points in:\n{cities_list}`);
        }
        addBotMessage(meetingPointMsg);
        setStep('ASK_PICKUP_CITY');
      });
    });
  };

  const handlePickupCitySelect = (city: string, label: string) => {
    setStep('PROCESSING');
    addUserMessage(label);
    setSelectedCity(city);
    trackEvent('city_selected', { city: label });

    clearDetailTimers();
    setDetailsReady(false);
    setShowTransition(true);
    detailsReadyTimerRef.current = setTimeout(() => setDetailsReady(true), 1200);
    detailsSafetyTimerRef.current = setTimeout(() => setDetailsReady(true), 3000);
    setStep('EVENT_SELECTED');
  };

  const handleFromAnotherCity = () => {
    setStep('PROCESSING');
    addUserMessage("I'm from another city");
    simulateBotTyping(() => {
      addBotMessage(
        fillMsg(msgs, 'ask_own_transport_city', {},
          "You can join us at any of these meeting points with your own transport 🙂")
      );
      setStep('ASK_OWN_TRANSPORT_CITY');
    });
  };

  const handleDetailsAction = (action: 'book' | 'contact', date?: string, meetingPoint?: string) => {
    setShowChat(true);
    setShowBookingTimeline(false);
    setShowWaitlistForm(false);
    setShowDetails(false);
    setDetailsReady(false);
    setMessages([]); // Clear chat history for a fresh start
    setClickedFaqs([]); // Reset clicked FAQs for the new flow
    if (date) setBookingDate(date);
    if (selectedEvent) {
      setJourneyCardData({
        event: selectedEvent,
        city: selectedCity,
        startDate: date || selectedEvent.dates?.[0]?.date || '',
        meetingPoint: meetingPoint || ''
      });
    }
    trackEvent(action === 'book' ? 'book_clicked' : 'contact_clicked', { city: formatCityLabel(selectedCity), category: selectedCategory || selectedEvent?.category, event_id: selectedEvent?.id, event_title: selectedEvent?.title });
    setStep('PROCESSING');

    simulateBotTyping(() => {
      if (action === 'book') {
        addBotMessage(fillMsgForSelectedEvent('ask_doubts_book', getTemplateVars(), `Yo! 🤙 You're about to lock in your spot for ${selectedEvent?.title}. Just making sure we're on the exact same page before we make it official—all clear on the details, or got any last-minute questions?`));
        setStep('ASK_DOUBTS');
      } else {
        addBotMessage(fillMsgForSelectedEvent('ask_doubts_contact', getTemplateVars(), `Hey! 🌊 Got some questions about ${selectedEvent?.title}? I've got answers. Check out these common questions below, or let me know if you're ready to roll!`));
        setStep('SHOW_FAQ');
      }
    });
  };

  const handleDoubtsSelect = (hasDoubts: boolean) => {
    setStep('PROCESSING');
    if (hasDoubts) {
      addUserMessage((msgs.doubts_btn_yes || '').trim() || 'Hold up, I have a question');
      simulateBotTyping(() => {
        addBotMessage(fillMsgForSelectedEvent('show_faq', getTemplateVars(), "No sweat! Here's what people usually ask. Tap one to see the answer, or let me know when you're ready to book."));
        setStep('SHOW_FAQ');
      });
    } else {
      addUserMessage((msgs.doubts_btn_no || '').trim() || "All clear, let's book! 🚀");
      // Skip extra questions and jump straight to booking timeline
      setShowChat(false);
      setTimeout(() => setShowBookingTimeline(true), 150);
      setShowWaitlistForm(false);
      setStep('DONE');
    }
  };

  const handleFaqSelect = (faq: FAQ) => {
    setStep('PROCESSING');
    const isFirstFaqAnswer = clickedFaqs.length === 0;
    addUserMessage(faq.question);
    setClickedFaqs(prev => [...prev, faq.question]);
    
    simulateBotTyping(() => {
      addBotMessage(faq.answer);
      if (isFirstFaqAnswer) {
        simulateBotTyping(() => {
          addBotMessage(fillMsgForSelectedEvent('faq_followup', getTemplateVars(), "Hope that clears it up! Got anything else, or are we locking this in?"));
          setStep('SHOW_FAQ');
        }, 1000);
      } else {
        simulateBotTyping(() => {
          addBotMessage(fillMsgForSelectedEvent('faq_followup_repeat', getTemplateVars(), "Anything else on your mind? 😊"));
          setStep('SHOW_FAQ');
        }, 1000);
      }
    }, 800);
  };

  const handleReadyToBook = () => {
    addUserMessage((msgs.doubts_btn_no || '').trim() || "All clear, let's book! 🚀");
    setShowChat(false);
    trackEvent('book_clicked', { city: formatCityLabel(selectedCity), category: selectedCategory || selectedEvent?.category, event_id: selectedEvent?.id, event_title: selectedEvent?.title });
    setTimeout(() => setShowBookingTimeline(true), 150);
    setShowWaitlistForm(false);
    setStep('DONE');
  };

  const handleGenderSelect = (gender: string) => {
    setStep('PROCESSING');
    setBookingGender(gender);
    addUserMessage(gender);
    
    simulateBotTyping(() => {
      addBotMessage(fillMsgForSelectedEvent('ask_transport', {}, "Got it. And do you need transport from Chennai, or will you arrange your own transport?"));
      setStep('ASK_TRANSPORT');
    });
  };

  const handleTransportSelect = (transport: string) => {
    setStep('PROCESSING');
    setBookingTransport(transport);
    addUserMessage(transport);
    
    simulateBotTyping(() => {
      setStep('DONE');
      setShowWaitlistForm(false);
    });
  };

  // ── PWA detection & install prompt ────────────────────────────────────────
  const isPwa = window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isIOSChrome = isIOS && /CriOS/i.test(navigator.userAgent);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  useEffect(() => {
    const handler = () => {
      setPwaInstallState('installing');
      if (pwaInstallCompleteTimerRef.current) window.clearTimeout(pwaInstallCompleteTimerRef.current);
      pwaInstallCompleteTimerRef.current = window.setTimeout(() => {
        setPwaInstallState('installed');
        pwaInstallCompleteTimerRef.current = null;
      }, 15000);
    };
    window.addEventListener('appinstalled', handler);
    return () => {
      window.removeEventListener('appinstalled', handler);
      if (pwaInstallCompleteTimerRef.current) window.clearTimeout(pwaInstallCompleteTimerRef.current);
    };
  }, []);

  const startPwaInstallFromDoubtSheet = async () => {
    if (!deferredInstallPrompt) return;
    try {
      await deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setPwaInstallState('installing');
        setDeferredInstallPrompt(null);
      }
    } catch {
      setPwaInstallState('idle');
    }
  };

  // ── Push notification subscription ────────────────────────────────────────
  const subscribeToPush = async (phone: string) => {
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BKXd5KDV_vL6P19fk10d2STjZSkGHSXz_zHHBg53RxwKIRCDSEn0lHPfCBwDvphRbjnvX0Th-99GHh-cs6yEHpU',
      });
      const subJson = sub.toJSON();
      if (!subJson.keys) return;
      const tenDigit = phone.replace(/\D/g, '').slice(-10);
      await supabase.from('push_subscriptions').upsert({
        phone: tenDigit,
        endpoint: sub.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      }, { onConflict: 'phone,endpoint' });
    } catch (err) {
      console.warn('[push] subscribe failed:', err);
    }
  };

  // ── Live chat: load messages + Realtime ────────────────────────────────────
  useEffect(() => {
    if (!liveConversationId) return;
    supabase.from('doubt_messages').select('*')
      .eq('conversation_id', liveConversationId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setLiveMessages(data); });
    supabase.from('doubt_conversations').select('status')
      .eq('id', liveConversationId).single()
      .then(({ data }) => { if (data) setLiveConvResolved(data.status === 'resolved'); });
    const sub = supabase.channel(`flow-chat-${liveConversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'doubt_messages',
        filter: `conversation_id=eq.${liveConversationId}`,
      }, (payload) => { setLiveMessages(prev => [...prev, payload.new]); })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'doubt_conversations',
        filter: `id=eq.${liveConversationId}`,
      }, (payload) => { setLiveConvResolved((payload.new as any).status === 'resolved'); })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [liveConversationId]);

  useEffect(() => {
    liveChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages]);

  const submitDoubtAsPwaChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, phone, message } = doubtFormData;
    if (!name || !phone || !message) return;
    setLiveChatSending(true);
    const tenDigit = phone.replace(/\D/g, '').slice(-10);
    const { data: convData, error } = await supabase
      .from('doubt_conversations')
      .insert({
        phone: tenDigit,
        name: name.trim(),
        event_slug: selectedEvent?.slug ?? null,
        status: 'open',
      })
      .select().single();
    if (error || !convData) { setLiveChatSending(false); return; }
    await supabase.from('doubt_messages').insert({
      conversation_id: convData.id,
      sender: 'user',
      body: message.trim(),
    });
    localStorage.setItem('liveConversationId', convData.id);
    localStorage.setItem('liveConvName', name.trim() || '');
    localStorage.setItem('liveConvEventSlug', selectedEvent?.slug ?? '');
    localStorage.setItem('liveConvEventTitle', selectedEvent?.title ?? '');
    setLiveConversationId(convData.id);
    setLiveChatSending(false);
    setDoubtSheetView('chat');
    // Request push permission now that they're engaged
    subscribeToPush(phone);
  };

  const sendLiveChatMessage = async () => {
    if (!liveConversationId || !liveChatInput.trim()) return;
    setLiveChatSending(true);
    const body = liveChatInput.trim();
    setLiveChatInput('');
    await supabase.from('doubt_messages').insert({
      conversation_id: liveConversationId,
      sender: 'user',
      body,
    });
    setLiveChatSending(false);
  };

  const handleDoubtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = doubtFormData.name;
    const phone = doubtFormData.phone;
    const message = doubtFormData.message;
    const pickup = getSelectedPickupForVars();
    const selectedDate = getSelectedDateForVars();
    try {
      await supabase.from('doubt_submissions').insert({
        name,
        phone,
        doubt: message,
        event_title: selectedEvent?.title ?? '',
        event_category: selectedEvent?.category ?? selectedCategory ?? '',
        city: selectedCity ? formatCityLabel(selectedCity) : '',
        selected_date: selectedDate || null,
        reporting_date: selectedDate ? formatFullDate(selectedDate) : null,
        reporting_time: pickup.reportingTime || null,
        submitted_at: new Date().toISOString(),
      });
    } catch (_) {}
    setShowDoubtPopup(false);
    setDoubtFormData({ name: '', phone: '', message: '' });
    setStep('PROCESSING');
    addUserMessage(message);
    simulateBotTyping(() => {
      addBotMessage(fillMsgForSelectedEvent('contact_success', getTemplateVars({ name, phone, doubt: message }), `Got it, ${name}! Our team will reach out to you on WhatsApp at ${phone} shortly.`));
      setStep('DONE');
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    if (!selectedEvent) return;
    setGoogleSignInLoading(true);
    try {
      // Save current flow state so we can restore after OAuth redirect
      localStorage.setItem('gauth_return', JSON.stringify({
        city: selectedCity,
        date: bookingDate || selectedEvent.dates?.[0]?.date || '',
        meetingPoint: journeyCardData?.meetingPoint || '',
      }));
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/?gauth=1&preview_event=${selectedEvent.id}`,
        },
      });
    } catch {
      setGoogleSignInLoading(false);
    }
  };

  const handleProceedToPhonePe = async () => {
    if (!selectedEvent) return;

    const dateStr = bookingDate || selectedEvent.dates?.[0]?.date || '';
    const selectedDateEntry = selectedEvent.dates?.find((d: any) => d.date === dateStr);
    const selectedMeetingPoint = journeyCardData?.meetingPoint || '';
    const _cd1 = (selectedEvent as any).cityDetails?.[selectedCity];
    const pricing = getMeetingPointPricing(selectedEvent, selectedMeetingPoint, selectedCity, _cd1?.price_full > 0 ? _cd1.price_full : undefined, _cd1?.price_advance > 0 ? _cd1.price_advance : undefined);
    const balanceDueRaw = shiftDateString(dateStr, -5) || '';
    const balanceDue = balanceDueRaw ? formatDisplayDate(balanceDueRaw) : 'TBD';
    const pickupDetails = dateStr ? formatDisplayDate(shiftDateString(dateStr, -3) || undefined) : 'TBD';
    const tripDate = formatDisplayDate(dateStr);
    const totalAmount = pricing.total;
    const advanceAmount = pricing.advance;
    const balanceAmount = totalAmount - advanceAmount;
    const ctx = {
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      amount: advanceAmount,
      remainingBalance: balanceAmount,
      isBalancePayment: false,
      date: formatDisplayDate(dateStr),
      balanceDue,
      balanceDueRaw,
      pickupDetails,
      tripDate,
      tripDateFull: formatFullDate(dateStr),
      phonepeUrl: selectedEvent.bookingUrl,
      shareUrl: typeof window !== 'undefined' ? window.location.origin : '/',
      name: detailsForm.name.trim(),
      phone: detailsForm.phone,
      receiptId: `CA-${Date.now().toString(36).toUpperCase()}`,
      issuedAt: new Date().toISOString(),
      girlsOnly: selectedEvent.girlsOnly || hasGirlsOnlyQuickInfo(selectedEvent.quickInfo),
      whatsappGroupUrl: selectedDateEntry?.whatsappGroupUrl ?? undefined,
      email: googleUser?.email ?? undefined,
    };
    try {
      localStorage.setItem('bookingName', ctx.name);
      localStorage.setItem('bookingPhone', ctx.phone);
    } catch (err) {
      // ignore storage errors in restricted environments
    }
    trackEvent('external_redirect_initiated', { city: formatCityLabel(selectedCity), category: selectedCategory || selectedEvent?.category, event_id: selectedEvent?.id, event_title: selectedEvent?.title });
    setPaymentContext(ctx);
    setShowDetailsForm(false);
    setPaymentView('checkout');
  };

  const handleMockPaymentComplete = async () => {
    if (!paymentContext) return;
    await supabase
      .from('mock_payment_receipts')
      .upsert({
        receipt_no: paymentContext.receiptId,
        event_id: paymentContext.eventId,
        event_title: paymentContext.eventTitle,
        event_date: paymentContext.tripDateFull,
        customer_name: paymentContext.name,
        contact: paymentContext.phone,
        amount_paid: paymentContext.amount,
        payment_for: paymentContext.isBalancePayment ? 'Remaining Balance' : 'Advance Booking',
        payment_mode: 'Mock BillDesk Gateway',
        status: 'successful',
        paid_on: paymentContext.issuedAt,
        remaining_balance: paymentContext.remainingBalance,
        balance_due: paymentContext.balanceDue,
      }, { onConflict: 'receipt_no' });
    setPaymentView('success');
  };

  const recordPaymentSubmission = async (
    amount: number,
    options: { event?: Event; name?: string; phone?: string; dateStr?: string } = {}
  ) => {
    const eventForSubmission = options.event ?? selectedEvent;
    if (!eventForSubmission) return;
    const tenDigit = (options.phone ?? detailsForm.phone).replace(/^\+91/, '').replace(/^0/, '').replace(/\D/g, '').slice(-10);
    const submittedAt = new Date().toISOString();
    const dateStr = options.dateStr ?? (bookingDate || eventForSubmission.dates?.[0]?.date || '');
    const name = options.name ?? detailsForm.name.trim();
    const { error: submissionError } = await supabase.rpc('upsert_payment_submission', {
      p_invite_slug: null,
      p_event_id: eventForSubmission.id,
      p_event_slug: eventForSubmission.id,
      p_event_title: eventForSubmission.title,
      p_selected_date: dateStr,
      p_name: name,
      p_phone: tenDigit,
      p_amount: amount,
      p_submitted_at: submittedAt,
    });
    if (submissionError) {
      // RPC doesn't exist — fall back to direct insert so admin can see submissions
      await supabase.from('invite_payment_submissions').insert({
        invite_slug: null,
        event_id: eventForSubmission.id,
        event_slug: eventForSubmission.id,
        event_title: eventForSubmission.title,
        selected_date: dateStr,
        name,
        phone: tenDigit,
        amount,
        status: 'pending_verification',
        submitted_at: submittedAt,
      });
      // Also keep a local copy as backup
      try {
        const localRows = JSON.parse(localStorage.getItem(LOCAL_INVITE_PAYMENT_SUBMISSIONS_KEY) || '[]');
        localRows.unshift({
          id: `local-${Date.now()}`,
          invite_slug: null,
          event_id: eventForSubmission.id,
          event_slug: eventForSubmission.id,
          event_title: eventForSubmission.title,
          selected_date: dateStr,
          name,
          phone: tenDigit,
          amount,
          status: 'pending_verification',
          submitted_at: submittedAt,
          source: 'localStorage',
        });
        localStorage.setItem(LOCAL_INVITE_PAYMENT_SUBMISSIONS_KEY, JSON.stringify(localRows));
      } catch {
        // ignore storage errors
      }
    }
  };

  // Called when user taps "Get Payment Details" — inserts submission + refreshes slots
  const handleGetPaymentDetails = async () => {
    if (!paymentContext || !selectedEvent) return;
    const selectedMeetingPoint = journeyCardData?.meetingPoint || '';
    const _cd2 = (selectedEvent as any).cityDetails?.[selectedCity];
    const pricing = getMeetingPointPricing(selectedEvent, selectedMeetingPoint, selectedCity, _cd2?.price_full > 0 ? _cd2.price_full : undefined, _cd2?.price_advance > 0 ? _cd2.price_advance : undefined);
    await recordPaymentSubmission(pricing.advance);
    setShowDetailsForm(false);
    setPaymentView('checkout');
  };

  const renderOptions = () => {
    if (isTyping || step === 'PROCESSING' || step === 'INIT') {
      return (
        <div className="flex justify-start">
          <div className="bg-white rounded-r-2xl rounded-bl-2xl px-4 py-3 shadow-sm flex items-center gap-1.5">
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.15 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.3 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
          </div>
        </div>
      );
    }

    const btnClass = "px-5 py-3 bg-[#FFD700] text-black rounded-2xl text-sm font-semibold hover:bg-[#e6c200] transition-all shadow-sm active:scale-95 flex items-center gap-3 justify-between min-w-[160px]";
    const primaryBtnClass = "px-5 py-3 bg-[#FFD700] text-black rounded-2xl text-sm font-bold hover:bg-[#e6c200] transition-all shadow-sm active:scale-95 flex items-center gap-3 justify-between min-w-[160px]";
    const girlsOnlyBtnClass = "px-5 py-3 bg-[#FF4FB8] text-white rounded-2xl text-sm font-bold hover:bg-[#e93ea3] transition-all shadow-sm active:scale-95 flex items-center gap-3 justify-between min-w-[160px]";

    switch (step) {
      case 'ASK_CITY': {
        const baseCities: string[] = Array.from(new Set(events.flatMap(e => e.cities as string[]).filter(Boolean)));
        const middleCities = baseCities
          .filter(c => {
            const lc = c.toLowerCase();
            return lc !== 'chennai' && lc !== 'other';
          })
          .sort((a, b) => a.localeCompare(b));
        const availableCities = ['Chennai', ...middleCities, 'Other'];
        const cityOptions = availableCities.map((city) => ({
          value: city,
          label: city === 'Other' ? 'Other City' : city,
        }));
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2 w-full">
            {cityOptions.map((city, i) => (
              <button key={city.value} onClick={() => handleCitySelect(city.value, city.label)} className={`${btnClass} relative overflow-hidden`}>
                <motion.div
                  className="absolute inset-0 -skew-x-12"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: i * 1.2, ease: 'easeInOut' }}
                />
                <span>{city.label}</span> <Send size={16} />
              </button>
            ))}
          </motion.div>
        );
      }
      case 'ASK_CATEGORY': {
        const availableCategories: string[] = Array.from(new Set(events.filter(e => e.cities.includes(selectedCity)).map(e => e.category)));
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2 w-full">
            {availableCategories.map((cat, i) => (
              <button key={cat} onClick={() => handleCategorySelect(cat)} className={`${btnClass} relative overflow-hidden`}>
                <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: i * 1.2, ease: 'easeInOut' }} />
                <span>{cat}</span> <Send size={16} />
              </button>
            ))}
          </motion.div>
        );
      }
      case 'ASK_DOUBTS':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2 w-full">
            {[
              { label: (msgs.doubts_btn_yes || '').trim() || 'Hold up, I have a question', onClick: () => handleDoubtsSelect(true), cls: btnClass },
              { label: (msgs.doubts_btn_no || '').trim() || "All clear, let's book! 🚀", onClick: () => handleDoubtsSelect(false), cls: primaryBtnClass },
            ].map(({ label, onClick, cls }, i) => (
              <button key={label} onClick={onClick} className={`${cls} relative overflow-hidden`}>
                <motion.div
                  className="absolute inset-0 -skew-x-12"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: i * 1.2, ease: 'easeInOut' }}
                />
                <span>{label}</span> <Send size={16} />
              </button>
            ))}
          </motion.div>
        );
      case 'ASK_GENDER':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2 w-full">
            {['Male', 'Female'].map((g, i) => (
              <button key={g} onClick={() => handleGenderSelect(g)} className={`${btnClass} relative overflow-hidden`}>
                <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: i * 1.2, ease: 'easeInOut' }} />
                <span>{g}</span> <Send size={16} />
              </button>
            ))}
          </motion.div>
        );
      case 'ASK_TRANSPORT':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2 w-full">
            {['With Transport', 'Without Transport'].map((t, i) => (
              <button key={t} onClick={() => handleTransportSelect(t)} className={`${btnClass} relative overflow-hidden`}>
                <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: i * 1.2, ease: 'easeInOut' }} />
                <span>{t}</span> <Send size={16} />
              </button>
            ))}
          </motion.div>
        );
      case 'SHOW_FAQ': {
        const remainingFaqs = selectedEvent?.faqs.filter(faq => !clickedFaqs.includes(faq.question)) || [];
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2 w-full">
            {remainingFaqs.map((faq, idx) => (
              <button key={idx} onClick={() => handleFaqSelect(faq)} className="text-right px-5 py-3 bg-[#FFD700] text-black rounded-2xl text-sm font-medium hover:bg-[#e6c200] transition-all shadow-sm active:scale-[0.98] flex items-center gap-3 justify-end w-fit max-w-full relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 -skew-x-12"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: idx * 1.2, ease: 'easeInOut' }}
                />
                <span className="truncate whitespace-normal text-left">{faq.question}</span> <Send size={16} className="flex-shrink-0" />
              </button>
            ))}
            <button onClick={() => { setShowDoubtPopup(true); setDoubtSheetView(liveConversationId ? 'chat' : isPwa ? 'form' : 'install'); }} className="text-right px-5 py-3 bg-gray-200 text-black rounded-2xl text-sm font-medium hover:bg-gray-300 transition-all shadow-sm active:scale-[0.98] flex items-center gap-3 justify-end w-fit max-w-full relative overflow-hidden">
              <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: 0, ease: 'easeInOut' }} />
              <span className="truncate whitespace-normal text-left">{doubtCtaLabel}</span> <MessageCircle size={16} className="flex-shrink-0" />
            </button>
            <button onClick={handleReadyToBook} className={primaryBtnClass + " mt-2 relative overflow-hidden"}>
              <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: 1.2, ease: 'easeInOut' }} />
              <span>{(msgs.doubts_btn_no || '').trim() || "All clear, let's book! 🚀"}</span> <Send size={16} />
            </button>
          </motion.div>
        );
      }
      case 'NO_EVENTS':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2 w-full">
            <button onClick={() => {
              setStep('PROCESSING');
              simulateBotTyping(() => {
                addBotMessage(fillMsg(msgs, 'retry_city', {}, "Let's try again! Which plan are you looking to join?"));
                setStep('SELECT_EVENT');
              });
            }} className={`${btnClass} relative overflow-hidden`}>
              <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }} />
              <span>Start Over</span> <Send size={16} />
            </button>
          </motion.div>
        );
      case 'ASK_PICKUP_CITY': {
        const pickupCities = (selectedEvent?.cities ?? []).filter((c: string) => c !== 'Other');
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2 w-full">
            {pickupCities.map((city: string, i: number) => (
              <button key={city} onClick={() => handlePickupCitySelect(city, `I'll join in ${city}`)} className={`${btnClass} relative overflow-hidden`}>
                <motion.div
                  className="absolute inset-0 -skew-x-12"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: i * 1.2, ease: 'easeInOut' }}
                />
                <span>I'll join in {city}</span> <Send size={16} className="flex-shrink-0" />
              </button>
            ))}
            <button onClick={handleFromAnotherCity} className={`${btnClass} relative overflow-hidden`}>
              <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: pickupCities.length * 1.2, ease: 'easeInOut' }} />
              <span>I'm from another city</span> <Send size={16} className="flex-shrink-0" />
            </button>
          </motion.div>
        );
      }
      case 'ASK_OWN_TRANSPORT_CITY': {
        const pickupCities = (selectedEvent?.cities ?? []).filter((c: string) => c !== 'Other');
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2 w-full">
            {pickupCities.map((city: string, i: number) => (
              <button key={city} onClick={() => handlePickupCitySelect(city, `I'll come to ${city} by own transport`)} className={`${btnClass} relative overflow-hidden`}>
                <motion.div
                  className="absolute inset-0 -skew-x-12"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: i * 1.2, ease: 'easeInOut' }}
                />
                <span>I'll come to {city} by own transport</span> <Send size={16} className="flex-shrink-0" />
              </button>
            ))}
          </motion.div>
        );
      }
      case 'SELECT_EVENT': {
        const filteredEvents = sortGirlsOnlyLast(events);
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2 w-full">
            {filteredEvents.map((event, i) => {
              const isGirlsOnlyEvent = event.girlsOnly || hasGirlsOnlyQuickInfo(event.quickInfo);
              const eventBtnClass = isGirlsOnlyEvent ? girlsOnlyBtnClass : btnClass;
              return (
                <button key={event.id} onClick={() => handleEventSelect(event)} className={`${eventBtnClass} relative overflow-hidden`}>
                  <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: i * 1.2, ease: 'easeInOut' }} />
                  <span className="text-left flex-1 mr-2 flex items-center gap-2">
                    {isGirlsOnlyEvent && (
	                      <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[7px] font-black uppercase leading-none tracking-[0.08em] text-white ring-1 ring-white/35 flex flex-col items-center gap-[1px]">
	                        <span>Girls</span>
	                        <span>Only</span>
	                      </span>
                    )}
                    <span>{event.oneLiner || event.title}</span>
                  </span>
                  <Send size={16} className="flex-shrink-0" />
                </button>
              );
            })}
          </motion.div>
        );
      }
      case 'EVENT_SELECTED':
        return (
          <div className="text-right text-sm text-gray-500 py-2 w-full">
            Viewing event details...
          </div>
        );
      case 'DONE':
        return null;
      default:
        return null;
    }
  };

  const isNameValid = detailsForm.name.trim().length >= 1;
  const isPhoneValid = /^\d{10,}$/.test(detailsForm.phone);
  const isDetailsFormValid = isNameValid && isPhoneValid && tcAccepted && (!isPayUFlow || !!googleUser);

  if (previewLoading) return <div className="fixed inset-0 bg-white z-50" />;

  const appReady = eventsLoaded && msgsReady;
  if (!appReady) return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-6">
      {/* Logo with gentle glow pulse */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative"
      >
        {/* Glow ring behind logo */}
        <motion.div
          animate={{ opacity: [0.15, 0.45, 0.15], scale: [1, 1.18, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-2xl bg-[#FFD700]"
          style={{ filter: 'blur(10px)' }}
        />
        <div className="relative w-16 h-16 rounded-2xl bg-black shadow-xl overflow-hidden p-1.5">
          <img src={chatProfile} alt="chapter அ" className="w-full h-full object-contain scale-[1.02] translate-y-[2px]" />
        </div>
      </motion.div>

      {/* Slow connection fallback */}
      <AnimatePresence>
        {loadingSlow && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <p className="text-sm text-gray-400 font-medium">connection is slow…</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-[#FFD700] text-black text-sm font-bold rounded-full active:scale-95 transition-transform"
            >
              Tap to reload
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  const isSelectedGirlsOnlyEvent = selectedEvent?.girlsOnly || hasGirlsOnlyQuickInfo(selectedEvent?.quickInfo);

  return (
    <div className="h-[100dvh] overflow-hidden bg-white sm:min-h-screen sm:h-auto sm:bg-gray-100 flex items-stretch sm:items-center justify-center p-0 sm:p-4 font-sans">
      <div className="w-full bg-white overflow-hidden flex flex-col h-[100dvh] sm:max-w-md sm:h-[85vh] relative sm:rounded-[2rem] sm:shadow-2xl sm:border-4 sm:border-white">

        {/* Header */}
        <div className="bg-white p-4 flex items-center gap-3 z-10 relative">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-black shadow-md overflow-hidden p-1">
              <img src={chatProfile} alt="chapter அ profile" className="w-full h-full object-contain scale-[1.02] translate-y-[2px]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-lg tracking-tight text-black">chapter அ</h1>
              <CheckCircle2 size={16} className="text-blue-500 fill-blue-50" />
            </div>
            <div className="h-[14px] overflow-hidden relative mt-0.5">
              {!showDetails && eventsLoaded && (
                <AnimatePresence mode="wait">
                  <motion.p
                    key={announcementIndex + (isAfterTripInfo ? '-event' : '-general')}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[11px] text-gray-500 font-medium leading-tight absolute inset-0 whitespace-nowrap"
                  >
                    {currentAnnouncements[announcementIndex]}
                  </motion.p>
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>

        {showChat && !showDetails && !showTransition && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F2ED] relative">
            {journeyCardData && (
              <JourneyCard event={journeyCardData.event} city={journeyCardData.city} startDate={journeyCardData.startDate} meetingPoint={journeyCardData.meetingPoint} />
            )}
            {messages.map(msg => (
              <React.Fragment key={msg.id}>
                <ChatMessage message={msg} />
              </React.Fragment>
            ))}
            <div className="pt-1">
              {(() => {
                const opts = renderOptions();
                if (isTyping || step === 'PROCESSING' || step === 'INIT') return opts;
                if (!opts || step === 'EVENT_SELECTED' || step === 'DONE') return opts;
                return (
                  <div className="bg-white rounded-2xl border border-gray-200 p-3">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider px-1 mb-2">Choose your reply</p>
                    {opts}
                  </div>
                );
              })()}
            </div>
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}

        {/* Transition Overlay */}
        <AnimatePresence>
          {showTransition && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{
                opacity: { duration: 0.35, ease: 'easeOut' },
                scale:   { type: 'spring', damping: 20, stiffness: 120 }
              }}
              className={`absolute inset-0 z-40 flex flex-col items-center justify-center overflow-hidden ${isSelectedGirlsOnlyEvent ? 'bg-[#FF4FB8]' : 'bg-[#FFD700]'}`}
            >
              {isSelectedGirlsOnlyEvent && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(circle at 50% 44%, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.08) 34%, rgba(255,79,184,0) 68%)' }}
                  animate={{ opacity: [0.65, 1, 0.65], scale: [0.96, 1.04, 0.96] }}
                  transition={{ duration: 1.25, ease: 'easeInOut' }}
                />
              )}
              <motion.div
                initial={{ x: -100, y: 100, scale: 0.5, opacity: 0 }}
                animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                transition={{
                  x: { type: 'spring', damping: 14, stiffness: 130 },
                  y: { type: 'spring', damping: 14, stiffness: 130 },
                  scale: { type: 'spring', damping: 16, stiffness: 150 },
                  opacity: { duration: 0.25, ease: 'easeOut' },
                }}
              >
                <motion.div
                  animate={{ x: 150, y: -150, scale: 0.5, opacity: 0 }}
                  transition={{ delay: 1.35, duration: 0.45, ease: 'easeIn' }}
                >
                  <Send size={48} className={isSelectedGirlsOnlyEvent ? 'text-white' : 'text-black'} />
                </motion.div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className={`mt-4 font-bold text-lg tracking-wide absolute top-[55%] ${isSelectedGirlsOnlyEvent ? 'text-white' : 'text-black'}`}
              >
                Sending details...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Event Details Overlay (no mount animation) */}
        {showDetails && selectedEvent && (
          <EventDetailsOverlay
            event={selectedEvent}
            selectedCity={selectedCity}
            allEvents={events}
            applicationCount={applicationCount}
            reservedCount={reservedCount}
            closeCalendarSignal={closeDetailsCalendarSignal}
            onCalendarVisibilityChange={setDetailsCalendarOpen}
            openPlanSwitcherSignal={openDetailsPlanSwitcherSignal}
            closePlanSwitcherSignal={closeDetailsPlanSwitcherSignal}
            onPlanSwitcherVisibilityChange={setDetailsPlanSwitcherOpen}
            onSwitchEvent={(e, city) => {
              setSelectedEvent(e);
              setSelectedCategory(e.category);
              setSelectedCity(city);
            }}
            onClose={() => {
              closeEventDetails();
            }}
            onAction={handleDetailsAction}
          />
        )}

        {/* Booking Timeline Popup */}
        <AnimatePresence>
          {showBookingTimeline && selectedEvent && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-md z-40"
                onClick={() => {
                  setShowBookingTimeline(false);
                  if (selectedEvent) { setShowDetails(true); setShowChat(false); }
                }}
              />
              <motion.div
                variants={{
                  hidden: { y: '100%', transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } },
                  visible: { y: 0, transition: { type: 'spring', damping: 32, stiffness: 300 } },
                }}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-[2rem]"
              >
                <div onClick={e => e.stopPropagation()}>
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingTimeline(false);
                      if (selectedEvent) { setShowDetails(true); setShowChat(false); }
                    }}
                    className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                <div className="pt-4">
                  <div className="px-6 pt-3 pb-4">
                    <p className="text-[24px] font-black text-gray-900 tracking-tight leading-tight text-center">Your Booking Timeline</p>
                  </div>

                  <div className="px-6 pb-6">
                    <div className="bg-[#F2F2F7] rounded-3xl overflow-hidden">
                      {/* All booking steps — index 0 = "Now" row, rest = deadline rows */}
                      {(() => {
                        const meetingPoint = journeyCardData?.meetingPoint || '';
                        const _cd3 = (selectedEvent as any).cityDetails?.[selectedCity];
                        const pricing = getMeetingPointPricing(selectedEvent, meetingPoint, selectedCity, _cd3?.price_full > 0 ? _cd3.price_full : undefined, _cd3?.price_advance > 0 ? _cd3.price_advance : undefined);
                        const advanceStr = `₹${pricing.advance.toLocaleString('en-IN')}`;
                        const balanceStr = `₹${Math.max(pricing.total - pricing.advance, 0).toLocaleString('en-IN')}`;
                        const priceStr = `₹${pricing.total.toLocaleString('en-IN')}`;
                        const resolveValue = (v: string) => v
                          .replace(/\{advance\}/gi, advanceStr)
                          .replace(/\{balance\}/gi, balanceStr)
                          .replace(/\{price\}/gi, priceStr);

                        const selectedDateEntry = selectedEvent.dates.find(d => d.date === bookingDate);
                        const eventSteps = selectedDateEntry?.bookingSteps ?? selectedEvent.bookingSteps ?? [
                          { label: selectedEvent.inviteOnly ? 'Sign Up' : 'Advance', value: selectedEvent.inviteOnly ? 'Free — no payment yet' : '{advance}', date: '' },
                          { label: 'Remaining Balance', value: '{balance}', date: '' },
                          { label: 'Receive', value: 'Pickup, stay & trip details', date: '' },
                        ];
                        const steps = eventSteps;

                        const buildCountdown = (dateStr: string) => {
                          const secs = dateStr
                            ? Math.max(0, Math.floor((new Date(dateStr + 'T00:00:00').getTime() - Date.now()) / 1000))
                            : 0;
                          if (secs === 0) return 'Due soon';
                          const d = Math.floor(secs / (3600 * 24));
                          const h = Math.floor((secs % (3600 * 24)) / 3600);
                          const m = Math.floor((secs % 3600) / 60);
                          const s = secs % 60;
                          return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
                        };
                        return steps.map((step, si) => {
                          const isNowRow = si === 0;
                          const stepValue = resolveValue(step.value || '');
                          const dateLabel = !isNowRow && step.date
                            ? `by ${new Date(`${step.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            : null;
                          return (
                            <div key={si} className="px-5 py-3 flex items-center justify-between border-b border-black/5">
                              <div>
                                <p className="text-[11px] text-gray-400 font-medium mb-0.5">{step.label}</p>
                                <p className="text-[15px] font-black text-gray-900 leading-none">{stepValue}</p>
                              </div>
                              {isNowRow ? (
                                <span className="text-[11px] font-semibold text-[#34C759] bg-[#34C759]/10 border border-[#34C759]/30 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                                  Now
                                </span>
                              ) : dateLabel ? (
                                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                                  {dateLabel}
                                </span>
                              ) : null}
                            </div>
                          );
                        });
                      })()}

	                      {/* Prize row — event title + date */}
	                      <div className="px-5 py-4 flex items-end justify-between bg-[#FFD700]/10">
	                        <div>
	                          {(() => {
	                            const capacity = (selectedEvent as any).totalCapacity;
	                            const socialProofCount =
	                              isNativeApplicationFlow && typeof capacity === 'number' && capacity > 0 && typeof applicationCount === 'number'
	                                ? (capacity * 3) + applicationCount
	                                : null;
	                            return socialProofCount !== null ? (
	                              <p className="text-[11px] text-gray-400 font-medium mb-0.5 flex items-center gap-1"><Users size={11} className="flex-shrink-0" />{socialProofCount} ppl have requested invitation</p>
	                            ) : null;
	                          })()}
	                          <p className="text-[15px] font-black text-gray-900 leading-tight">{selectedEvent.title}</p>
	                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                          {(() => {
                            const dateStr = bookingDate || selectedEvent.dates?.[0]?.date || '';
                            return dateStr ? (
                              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-black bg-[#FFD700] border border-[#d4af37] font-black">
                                {new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-8">
                    {isNativeApplicationFlow ? (
                      <>
                        <button
                          onClick={() => { setShowBookingTimeline(false); setShowApplicationForm(true); }}
                          className="w-full py-[17px] rounded-2xl bg-black text-white font-black text-[17px] flex items-center justify-center gap-2 active:opacity-80 transition-all"
                        >
                          {selectedEvent.ctaLabel || 'Request Invitation'}
                          <ArrowRight size={18} strokeWidth={3.0} />
                        </button>
                      </>
                    ) : selectedEvent.inviteOnly ? (
                      <button
                        onClick={() => {
                          trackEvent('external_redirect_initiated', { city: formatCityLabel(selectedCity), category: selectedCategory || selectedEvent?.category, event_id: selectedEvent?.id, event_title: selectedEvent?.title });
                          window.open(selectedEvent.bookingUrl, '_blank');
                        }}
                        className="w-full py-[17px] rounded-2xl bg-black text-white font-black text-[17px] flex items-center justify-center gap-2 active:opacity-80 transition-all"
                      >
                        {selectedEvent.ctaLabel || 'Request Invitation'}
                        <ArrowRight size={18} strokeWidth={3.0} />
                      </button>
                    ) : isPhonePeFlow ? (
                      <button
                        onClick={() => {
                          setShowBookingTimeline(false);
                          setShowDetailsForm(true);
                        }}
                        className="w-full py-[17px] rounded-2xl bg-[#FFD700] text-black font-black text-[17px] flex items-center justify-center gap-2.5 active:scale-95 transition-all relative overflow-hidden"
                      >
                        <motion.div className="absolute inset-0 -skew-x-12 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.9, delay: 10, repeat: Infinity, repeatDelay: 8, ease: 'easeInOut' }} />
                        {selectedEvent.ctaLabel || 'Confirm'}
                        <ArrowRight size={18} strokeWidth={3.0} />
                      </button>
                    ) : isPayUFlow ? (
                      <button
                        onClick={() => {
                          setShowBookingTimeline(false);
                          setShowDetailsForm(true);
                        }}
                        className="w-full py-[17px] rounded-2xl bg-[#FFD700] text-black font-black text-[17px] flex items-center justify-center gap-2.5 active:scale-95 transition-all relative overflow-hidden"
                      >
                        <motion.div className="absolute inset-0 -skew-x-12 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.9, delay: 10, repeat: Infinity, repeatDelay: 8, ease: 'easeInOut' }} />
                        {selectedEvent.ctaLabel || 'Book Now'}
                        <ArrowRight size={18} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowBookingTimeline(false);
                          trackEvent('external_redirect_initiated', { city: formatCityLabel(selectedCity), category: selectedCategory || selectedEvent?.category, event_id: selectedEvent?.id, event_title: selectedEvent?.title });
                          if (selectedEvent.bookingUrl) window.open(selectedEvent.bookingUrl, '_blank');
                        }}
                        className="w-full py-[17px] rounded-2xl bg-[#FFD700] text-black font-black text-[17px] flex items-center justify-center gap-2.5 active:scale-95 transition-all relative overflow-hidden"
                      >
                        <motion.div className="absolute inset-0 -skew-x-12 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.9, delay: 10, repeat: Infinity, repeatDelay: 8, ease: 'easeInOut' }} />
                        {selectedEvent.ctaLabel || 'Book Now'}
                        <ArrowRight size={18} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Details Form — bottom sheet */}
        <AnimatePresence>
          {showDetailsForm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[55] bg-black/40 backdrop-blur-md"
                onClick={() => {
                  setShowDetailsForm(false);
                  setDetailsFormStep('details');
                  setTimeout(() => setShowBookingTimeline(true), 80);
                }}
              />
              <motion.div
                layout
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 z-[60] bg-white rounded-t-[2rem]"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsForm(false);
                    setDetailsFormStep('details');
                    setTimeout(() => setShowBookingTimeline(true), 80);
                  }}
                  className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
                <AnimatePresence mode="wait">

                  {/* ── Step 1: Details form ── */}
                  {detailsFormStep === 'details' && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col"
                    >
                      {(!existingBooking || forceNewBooking) && (
                      <div className="px-6 pt-3 pb-4">
                        <p className="text-[24px] font-black text-gray-900 tracking-tight leading-tight">
                          Let's Lock This In! 🔐
                        </p>
                      </div>
                      )}

                      <div className="px-6 space-y-3">

                        {/* Already booked — show options: view booking or book another */}
                        {existingBooking && isPayUFlow && !forceNewBooking && (
                          <div className="bg-[#34C759]/8 border border-[#34C759]/25 rounded-2xl px-4 py-4 flex flex-col gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#34C759]/15 flex items-center justify-center flex-shrink-0">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                                </svg>
                              </div>
                              <p className="text-[13px] font-bold text-gray-900">You're already booked!</p>
                            </div>
                            <p className="text-[12px] text-gray-500 leading-relaxed">
                              Your spot for <span className="font-semibold text-gray-700">{existingBooking.event_title || selectedEvent?.title}</span> is confirmed under <span className="font-semibold text-gray-700">{googleUser?.email}</span>.
                            </p>
                            <button
                              type="button"
                              onClick={() => setForceNewBooking(true)}
                              className="w-full text-center py-3 rounded-xl bg-[#34C759] text-white text-[13px] font-bold active:opacity-80 transition-all"
                            >
                              Book Another Spot
                            </button>
                            <a
                              href="/myplans"
                              className="w-full text-center py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] font-semibold text-gray-600 active:opacity-70 transition-all"
                            >
                              View My Booking →
                            </a>
                            <p className="text-center text-[12px] text-gray-400">
                              Want to switch accounts?{' '}
                              <button
                                type="button"
                                onClick={async () => {
                                  await supabase.auth.signOut();
                                  setGoogleUser(null);
                                  setDetailsForm(f => ({ ...f, name: '' }));
                                  setExistingBooking(null);
                                  setForceNewBooking(false);
                                }}
                                className="text-gray-600 underline font-medium active:opacity-60"
                              >
                                Sign Out
                              </button>
                            </p>
                          </div>
                        )}

                        {/* Google Sign-In */}
                        {(!existingBooking || forceNewBooking) && (
                          <>
                            {googleUser ? (
                              /* Already signed in — show pill with avatar */
                              <div className="flex items-center gap-3 bg-[#F2F2F7] rounded-2xl px-4 py-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 select-none">
                                  {googleUser.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold text-gray-800 leading-tight truncate">{googleUser.name}</p>
                                  <p className="text-[11px] text-gray-400 leading-tight truncate">{googleUser.email}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await supabase.auth.signOut();
                                    setGoogleUser(null);
                                    setDetailsForm(f => ({ ...f, name: '' }));
                                  }}
                                  className="text-[11px] text-gray-400 font-medium flex-shrink-0 active:opacity-60"
                                >
                                  Switch
                                </button>
                              </div>
                            ) : (
                              /* Not signed in — show Google button */
                              <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={googleSignInLoading}
                                className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-200 rounded-2xl px-4 py-[14px] text-[15px] font-semibold text-gray-800 shadow-sm active:opacity-70 transition-all disabled:opacity-50"
                              >
                                {googleSignInLoading ? (
                                  <svg className="animate-spin w-5 h-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                  </svg>
                                ) : (
                                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                                  </svg>
                                )}
                                <span>{googleSignInLoading ? 'Redirecting…' : 'Continue with Google'}</span>
                              </button>
                            )}

                            {/* Divider — only for non-PayU (invite / UPI flows) */}
                            {!isPayUFlow && (
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-px bg-gray-100" />
                                <span className="text-[11px] text-gray-300 font-semibold uppercase tracking-wider">or enter manually</span>
                                <div className="flex-1 h-px bg-gray-100" />
                              </div>
                            )}
                          </>
                        )}

                        {/* Name + phone — shown for non-PayU always, for PayU only after Google sign-in (and not if already booked, unless booking another) */}
                        {(!isPayUFlow || googleUser) && (!existingBooking || forceNewBooking) && (
                          <>
                            <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
                              <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest block mb-0.5">Full Name</label>
                              <input
                                type="text"
                                value={detailsForm.name}
                                onChange={e => setDetailsForm({ ...detailsForm, name: e.target.value })}
                                placeholder="What do we call you?"
                                className="w-full bg-transparent text-[17px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
                              />
                            </div>

                            <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
                              <div className="flex items-center justify-between mb-0.5">
                                <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest">WhatsApp Number</label>
                                {detailsForm.phone.length > 0 && !isPhoneValid && (
                                  <span className="text-[11px] text-amber-500 font-medium">Invalid</span>
                                )}
                              </div>
                              <input
                                type="tel"
                                value={detailsForm.phone}
                                onChange={e => setDetailsForm({ ...detailsForm, phone: e.target.value.replace(/\D/g, '') })}
                                placeholder="Updates & reminders are sent here"
                                className="w-full bg-transparent text-[17px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
                                inputMode="tel"
                              />
                            </div>
                          </>
                        )}

                        {(!existingBooking || forceNewBooking) && (
                        <div className="flex items-center gap-3 select-none pt-1">
                          <div
                            onClick={() => setTcAccepted(!tcAccepted)}
                            className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all cursor-pointer ${tcAccepted ? 'bg-black border-black' : 'bg-white border-gray-300'}`}
                          >
                            {tcAccepted && (
                              <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                                <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className="text-[13px] text-gray-500 leading-snug">
                            I agree to the{' '}
                            <button type="button" onClick={() => setShowTcModal(true)} className="text-gray-900 underline font-medium">
                              Terms & Conditions
                            </button>
                          </span>
                        </div>
                        )}

                      </div>

                      {(!existingBooking || forceNewBooking) && (
                      <div className="px-6 pt-6 pb-6">
                        <button
                          type="button"
                          disabled={!isDetailsFormValid}
                          onClick={handleProceedToPhonePe}
                          className={`w-full py-[17px] rounded-2xl text-[17px] font-semibold transition-all inline-flex items-center justify-center gap-2 ${
                            isDetailsFormValid ? 'bg-black text-white active:opacity-80' : 'bg-[#F2F2F7] text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <span>Pay Advance</span>
                          <ArrowRight size={18} strokeWidth={3.0} className="shrink-0" />
                        </button>
                      </div>
                      )}
                    </motion.div>
                  )}

                  {/* ── Step 2: Payment instructions ── */}
                  {detailsFormStep === 'instructions' && (
                    <motion.div
                      key="instructions"
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="flex flex-col"
                    >
                      <div className="px-6 pt-3 pb-5">
                        <p className="text-[24px] font-black text-gray-900 tracking-tight leading-tight">{paymentContext?.isBalancePayment ? 'One last step! 🎉' : 'Almost there! 🤠'}</p>
                      </div>

                      {/* Step rows */}
                      <div className="px-6 space-y-3">
                        {/* Step 1 */}
                        <div className="flex gap-4 items-start bg-[#F7F7F8] rounded-2xl px-4 py-4">
                          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[13px] font-black flex-shrink-0">1</div>
                          <div>
                            <p className="text-[15px] font-bold text-gray-900 leading-snug mb-0.5">{paymentContext?.isBalancePayment ? `Settle Balance ${paymentContext ? formatUpiINR(paymentContext.amount) : ''}` : `Pay ${paymentContext ? formatUpiINR(paymentContext.amount) : ''} advance`}</p>
                            <p className="text-[13px] text-gray-500 leading-relaxed">Scan QR code or copy our UPI ID on the next page.</p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-4 items-start bg-[#F7F7F8] rounded-2xl px-4 py-4">
                          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[13px] font-black flex-shrink-0">2</div>
                          <div>
                            <p className="text-[15px] font-bold text-gray-900 leading-snug mb-0.5">Send Us Payment Screenshot</p>
                            <p className="text-[13px] text-gray-500 leading-relaxed">Send payment screenshot to the WhatsApp number you got this invite from.</p>
                            <p className="text-[13px] text-gray-500 leading-relaxed mt-1">Your payment will be confirmed within 24 hours.</p>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 pt-6 pb-6">
                        <button
                          type="button"
                          onClick={() => {
                            setDetailsFormStep('details');
                            handleGetPaymentDetails();
                          }}
                          className="w-full py-[17px] rounded-2xl text-[17px] font-semibold bg-black text-white active:opacity-80 transition-all inline-flex items-center justify-center gap-2"
                        >
                          <span>Get Payment Details</span>
                          <ArrowRight size={18} strokeWidth={3.0} className="shrink-0" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Native Application Form ─────────────────────────────── */}
        <AnimatePresence>
          {showApplicationForm && selectedEvent && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-[55] bg-black/40 backdrop-blur-md"
                onClick={() => { setShowApplicationForm(false); setShowBookingTimeline(true); }}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 z-[56] bg-white rounded-t-[2rem] overflow-hidden flex flex-col"
                style={{ maxHeight: '92%' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
                  <div>
                    <p className="text-[18px] font-black text-gray-900">Apply for this Plan</p>
                    <p className="text-[13px] text-gray-400 mt-0.5">{selectedEvent.title}</p>
                  </div>
                  <button onClick={() => { setShowApplicationForm(false); setShowBookingTimeline(true); }} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center active:opacity-60">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>

                {/* Form */}
                <ApplicationForm
                  event={selectedEvent}
                  selectedDate={bookingDate || selectedEvent?.dates?.[0]?.date}
                  selectedPickupId={journeyCardData?.meetingPoint}
                  selectedCity={selectedCity || undefined}
                  reservedCount={reservedCount}
                  onClose={() => { setShowApplicationForm(false); setShowBookingTimeline(true); }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* T&C Modal */}
        <AnimatePresence>
          {showTcModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[75] bg-black"
                onClick={() => setShowTcModal(false)}
              />
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 z-[80] bg-white rounded-t-[2rem] flex flex-col max-h-[80%]"
              >
                <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
                  <h3 className="text-[17px] font-bold text-gray-900">Terms & Conditions</h3>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-[14px] text-gray-600 leading-relaxed">
                  <p className="text-[13px] text-gray-400 italic">Note: The term "Event" refers to all kinds of experiences we curate including trips, activities, workshops & events in this policy agreement.</p>
                  <p><strong className="text-gray-900">1. Advance Payment</strong><br />The advance payment secures your spot and is non-refundable under any circumstances.</p>
                  <p><strong className="text-gray-900">2. Balance Payment</strong><br />The remaining balance is due on the date shown on the website after you make the advance payment. Further notices and reminders will be sent via WhatsApp. Failure to pay will result in forfeiture of your spot.</p>
                  <p><strong className="text-gray-900">3. Itinerary Changes</strong><br />chapter அ reserves the right to modify the itinerary due to weather, safety, or unforeseen circumstances.</p>
                  <p><strong className="text-gray-900">4. Liability</strong><br />chapter அ is not liable for personal injury, loss of belongings, or delays caused by third-party services.</p>
                  <p><strong className="text-gray-900">5. WhatsApp Communication</strong><br />By providing your number, you consent to receiving logistic updates and booking reminders on WhatsApp.</p>
                  <p><strong className="text-gray-900">6. Age Requirement</strong><br />Certain experiences are strictly 21+. Participants must meet the minimum age requirement specified for each experience. Valid ID proof may be required. Failure to meet the age requirement may result in denial of entry without refund.</p>
                </div>
                <div className="px-6 pb-8 pt-3 flex-shrink-0">
                  <button
                    onClick={() => { setTcAccepted(true); setShowTcModal(false); }}
                    className="w-full py-[15px] rounded-2xl bg-black text-white text-[16px] font-semibold active:opacity-80 transition-all"
                  >
                    I Agree
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* PayU Hosted Checkout */}
        {paymentView === 'checkout' && paymentContext && paymentContext.phonepeUrl === 'payu-hosted' && (
          <PayUCheckout
            paymentContext={paymentContext}
            onError={() => { setPaymentView('idle'); setShowDetailsForm(true); }}
          />
        )}

        {/* Payment Success Screen */}
        <AnimatePresence>
          {paymentView === 'success' && paymentContext && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 z-[70] bg-white flex flex-col overflow-y-auto"
            >
              {/* Hero */}
              <div className="flex flex-col items-center pt-12 pb-6 px-6 flex-shrink-0">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 260, delay: 0.1 }}
                  className="w-[68px] h-[68px] rounded-full bg-[#34C759]/12 flex items-center justify-center mb-4"
                >
                  <CheckCircle2 size={34} className="text-[#34C759]" strokeWidth={1.75} />
                </motion.div>
                <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">Your Spot is Reserved, {paymentContext.name}!</h2>
              </div>

              {/* Card 1 — Payment Receipt */}
              <div className="mx-6 bg-white rounded-3xl overflow-hidden flex-shrink-0 mb-5 border border-gray-200 shadow-sm">
                <div className="px-5 py-4 border-b border-black/5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Issued by CHAPTER</p>
                    <p className="mt-1 text-[15px] font-black text-gray-950 leading-tight">Payment Receipt</p>
                  </div>
                  <span className="text-[11px] font-bold text-[#34C759] bg-[#34C759]/10 border border-[#34C759]/30 px-2.5 py-1 rounded-full flex-shrink-0">
                    Successful
                  </span>
                </div>

                <div className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-3 border-b border-black/5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Receipt No.</p>
                    <p className="mt-0.5 text-[13px] font-black text-gray-900 break-words">{paymentContext.receiptId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Paid On</p>
                    <p className="mt-0.5 text-[13px] font-bold text-gray-900">
                      {paymentContext.issuedAt ? new Date(paymentContext.issuedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just now'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Customer</p>
                    <p className="mt-0.5 text-[13px] font-bold text-gray-900">{paymentContext.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Contact</p>
                    <p className="mt-0.5 text-[13px] font-bold text-gray-900">{paymentContext.phone}</p>
                  </div>
                </div>

                <div className="px-5 py-4 border-b border-black/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Event</p>
                  <p className="mt-1 text-[15px] font-black text-gray-900 leading-tight">{paymentContext.eventTitle}</p>
                  <p className="mt-1 text-[12px] font-semibold text-gray-500">{paymentContext.tripDateFull}</p>
                </div>

                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payment For</p>
                      <p className="mt-0.5 text-[14px] font-black text-gray-900">{paymentContext.isBalancePayment ? 'Remaining Balance' : 'Advance Booking'}</p>
                    </div>
                    <p className="text-[22px] font-black text-gray-950 leading-none">{formatINR(paymentContext.amount)}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F7F7F8] px-4 py-3">
                    <p className="text-[12px] font-semibold text-gray-500">Payment Mode</p>
                    <p className="text-[12px] font-black text-gray-900">Mock BillDesk Gateway</p>
                  </div>
                  <div className="flex items-start justify-between gap-3 border-t border-black/5 pt-3">
                    <p className="text-[12px] font-semibold text-gray-500">Balance Due</p>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-gray-800">{formatINR(paymentContext.remainingBalance)}</p>
                      {paymentContext.remainingBalance > 0 && (
                        <p className="mt-0.5 text-[10px] font-semibold text-gray-400">due by {paymentContext.balanceDue}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    This receipt confirms successful payment toward the event booking listed above.
                  </p>
                </div>

                <div className="px-5 pb-5">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full py-3 rounded-2xl bg-black text-white text-[14px] font-bold active:opacity-80 transition-all"
                  >
                    Print / Save Receipt
                  </button>
                </div>
              </div>

              {/* Card 2 — Secret Offer (dashed border) */}
              {selectedEvent?.showSecretOffer !== false && <div className="mx-6 rounded-3xl overflow-hidden flex-shrink-0 border border-dashed border-gray-400/60">
                <div className="px-5 pt-5 pb-4">
                  <p className="text-[17px] font-black leading-tight text-gray-900">Secret Offer — Claim Now or Never</p>
                </div>
                {/* Acknowledgement checkbox */}
                <div
                  className="mx-5 mb-5 flex items-start gap-3 cursor-pointer select-none"
                  onClick={() => setOfferAcknowledged(v => !v)}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all duration-150 ${offerAcknowledged ? 'bg-[#25D366] border-[#25D366]' : 'border-gray-300 bg-white'}`}>
                    {offerAcknowledged && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-600 leading-snug">I'm aware that once I leave this beautiful website, this offer will be gone.</p>
                </div>

                <a
                  href={(() => {
                    if (!offerAcknowledged) return undefined;
                    const phoneRaw = getSelectedEventQuickInfoValue(['Secret Offer Number', 'Secret Offer Phone', 'Secret Offer WhatsApp']) || '919739832100';
                    const phone = phoneRaw.replace(/\D/g, '');
                    const template = getSelectedEventQuickInfoValue(['Secret Offer Message']) || "Hi! I just paid the advance for {title} ({date}). I'd like to pay the remaining balance and claim my offer!";
                    const message = template
                      .replace(/\{title\}/gi, paymentContext.eventTitle)
                      .replace(/\{date\}/gi, paymentContext.date);
                    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                  })()}
                  onClick={!offerAcknowledged ? (e) => e.preventDefault() : undefined}
                  className={`relative overflow-hidden flex items-center justify-center gap-2.5 font-bold py-[18px] text-[16px] transition-all duration-200 ${offerAcknowledged ? 'bg-[#25D366] text-white active:opacity-80' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {offerAcknowledged && (
                    <motion.div
                      className="absolute inset-0 -skew-x-12 pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)', width: '55%' }}
                      animate={{ x: ['-130%', '320%'] }}
                      transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 1.2, ease: 'easeInOut' }}
                    />
                  )}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={offerAcknowledged ? 'opacity-100' : 'opacity-40 relative z-10'}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="relative z-10">Claim Secret Offer</span>
                </a>
              </div>}

              <div className="pb-8" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Failure Screen */}
        <AnimatePresence>
          {paymentView === 'failure' && paymentContext && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 z-[70] bg-white flex flex-col overflow-y-auto"
            >
              {/* Hero */}
              <div className="flex flex-col items-center pt-16 pb-5 px-6 flex-shrink-0">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 18, stiffness: 260, delay: 0.1 }}
                  className="w-[68px] h-[68px] rounded-full bg-[#FF3B30]/10 flex items-center justify-center mb-4"
                >
                  <XCircle size={34} className="text-[#FF3B30]" strokeWidth={1.75} />
                </motion.div>
                <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">Didn't go through</h2>
                <p className="text-[15px] text-gray-500 mt-1 text-center leading-snug">
                  No stress — you're closer than you think
                </p>
              </div>

              {/* Actions */}
              <div className="px-6 pt-4 pb-8 flex-shrink-0">
                <button
                  onClick={() => setPaymentView('checkout')}
                  className="w-full bg-black text-white font-semibold py-[17px] rounded-2xl text-[16px] active:opacity-80 transition-all"
                >
                  Try Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waitlist Modal */}
        <AnimatePresence>
          {showWaitlistForm && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-md z-40"
              />
              <motion.div
                initial={{ y: 30, opacity: 0, scale: 0.99 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 30, opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] z-50 flex flex-col shadow-2xl"
                style={{ height: '88%' }}
              >
                {/* Everything scrolls together */}
                <div className="flex-1 overflow-y-auto px-6 sm:px-7 pb-8 pt-10">
                  {/* Header */}
                  <div className="relative mb-4">
                    <div className="text-center px-4">
                      <p className="text-xs font-medium text-gray-600 leading-tight whitespace-nowrap">
                        Not everyone gets in — but the right people always do.
                      </p>
                    </div>
                  </div>

                  {/* Iframe */}
                  <div className="mt-6 rounded-2xl border-2 border-dashed border-gray-200 p-2">
                    <iframe
                      src="https://tally.so/embed/WOYKOR?alignLeft=1&hideTitle=1&transparentBackground=1"
                      width="100%"
                      height="480"
                      style={{ border: 'none', display: 'block' }}
                      title="Trip Waitlist"
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Doubt Bottom Sheet */}
        <AnimatePresence>
          {showDoubtPopup && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[55] bg-black/40 backdrop-blur-md"
                onClick={() => { setShowDoubtPopup(false); setDoubtFormData({ name: '', phone: '', message: '' }); }}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.32, ease: 'easeOut' }}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] z-[60] flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => { setShowDoubtPopup(false); setDoubtFormData({ name: '', phone: '', message: '' }); }}
                  className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                  aria-label="Close doubt form"
                >
                  <X size={14} />
                </button>

                {/* ── CHAT VIEW: returning user with existing conversation ── */}
                {doubtSheetView === 'chat' && liveConversationId && (
                  <>
                    <div className="relative px-6 pt-4 pb-3 border-b border-gray-100">
                      <p className="text-[20px] font-black text-gray-900 tracking-tight leading-tight">Your Chat 💬</p>
                      <p className="text-[13px] text-gray-400 mt-0.5">We'll reply here as soon as possible</p>
                    </div>
                    <div className="flex flex-col gap-2.5 p-4 overflow-y-auto flex-1" style={{ maxHeight: 320 }}>
                      {liveMessages.map(msg => {
                        const isUser = msg.sender === 'user';
                        return (
                          <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-snug ${isUser ? 'bg-[#FFD700] text-black rounded-br-sm' : 'bg-[#F2F2F7] text-gray-900 rounded-bl-sm'}`}>
                              <div className="whitespace-pre-wrap break-words">{msg.body}</div>
                              <div className={`text-[10px] mt-1 ${isUser ? 'text-black/40 text-right' : 'text-gray-400'}`}>
                                {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                {!isUser && <span className="ml-1 font-semibold">· chapter அ</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {liveMessages.length === 0 && (
                        <p className="text-[13px] text-gray-400 text-center py-4">Your message was sent! We'll reply here shortly.</p>
                      )}
                      <div ref={liveChatEndRef} />
                    </div>
                    {!liveConvResolved ? (
                      <div className="px-4 pb-5 pt-2 flex gap-2.5 items-end border-t border-gray-100">
                        <input
                          type="text"
                          value={liveChatInput}
                          onChange={e => setLiveChatInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') sendLiveChatMessage(); }}
                          placeholder="Type a follow-up…"
                          className="flex-1 bg-[#F2F2F7] rounded-2xl px-4 py-3 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
                        />
                        <button
                          onClick={sendLiveChatMessage}
                          disabled={!liveChatInput.trim() || liveChatSending}
                          className="w-11 h-11 bg-black rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-30 active:scale-95 transition-all"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        </button>
                      </div>
                    ) : (
                      <div className="px-6 pb-5 pt-3 text-center text-[13px] text-gray-400">This conversation has been resolved.</div>
                    )}
                  </>
                )}

                {/* ── INSTALL PROMPT VIEW ── */}
                {doubtSheetView === 'install' && (
                  <>
                    <div className="px-6 pt-7 pb-2">
                      <p className="text-[24px] font-black text-gray-900 tracking-tight leading-tight">Chat with Us!</p>
                      <p className="text-[14px] text-gray-500 mt-1">Add our app to get replies directly here & get notified instantly.</p>
                    </div>

                    <div className="px-6 pb-6 space-y-3 mt-2">
                      {pwaInstallState === 'installed' ? (
                        <div className="bg-[#F2F2F7] rounded-3xl p-4 flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                            <img src="/icon-192.png" alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] text-gray-400 font-medium">ready on your phone</p>
                            <p className="text-[15px] font-black text-gray-900 leading-tight">Find chapter அ on your home screen</p>
                          </div>
                          <CheckCircle2 size={22} className="text-[#34C759] shrink-0 ml-auto" strokeWidth={2.8} />
                        </div>
                      ) : pwaInstallState === 'installing' ? (
                        <div className="bg-[#F2F2F7] rounded-3xl p-5 flex flex-col items-center gap-3">
                          <motion.div
                            className="w-9 h-9 rounded-full border-[3px] border-gray-300 border-t-black"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
                          />
                          <p className="text-xs text-gray-500 font-medium">Waiting for install to complete…</p>
                        </div>
                      ) : deferredInstallPrompt ? (
                        /* Android: native one-tap install */
                        <>
                          <div className="bg-[#F2F2F7] rounded-3xl overflow-hidden">
                            <div className="px-5 py-4 flex items-center justify-between">
                              <div>
                                <p className="text-[11px] text-gray-400 font-medium mb-0.5">install the app</p>
                                <p className="text-[15px] font-black text-gray-900 leading-none">chapter அ</p>
                              </div>
                              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0 ml-3">
                                <span className="text-white text-base font-black">அ</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={startPwaInstallFromDoubtSheet}
                            className="w-full bg-black text-white font-bold py-[17px] rounded-2xl text-[17px] active:opacity-80"
                          >
                            Install App
                          </button>
                        </>
                      ) : isIOSChrome ? (
                        /* iOS Chrome: ··· menu at the bottom right → Add to Home Screen */
                        <div className="bg-[#F2F2F7] rounded-3xl overflow-hidden">
                          {[
                            { label: 'open chrome menu', value: 'Tap ··· at the bottom right', badge: 'Chrome bottom bar' },
                            { label: 'add to your phone', value: 'Tap "Add to Home Screen"', badge: null },
                            { label: 'start chatting', value: 'Open the app', badge: '← chat will be here' },
                          ].map((step, i, arr) => (
                            <div key={i} className={`px-5 py-3.5 flex items-center justify-between ${i < arr.length - 1 ? 'border-b border-black/5' : ''}`}>
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                <div>
                                  <p className="text-[11px] text-gray-400 font-medium">{step.label}</p>
                                  <p className="text-[15px] font-black text-gray-900 leading-tight">{step.value}</p>
                                </div>
                              </div>
                              {step.badge && (
                                <span className="text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full shrink-0 ml-2">{step.badge}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : isAndroid ? (
                        /* Android fallback: Chrome menu step */
                        <div className="bg-[#F2F2F7] rounded-3xl overflow-hidden">
                          {[
                            { label: 'open chrome menu', value: 'Tap ⋮ at the top right', badge: 'Chrome top bar' },
                            { label: 'install the app', value: 'Tap "Add to Home Screen"', badge: null },
                            { label: 'start chatting', value: 'Open the app', badge: '← chat will be here' },
                          ].map((step, i, arr) => (
                            <div key={i} className={`px-5 py-3.5 flex items-center justify-between ${i < arr.length - 1 ? 'border-b border-black/5' : ''}`}>
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                <div>
                                  <p className="text-[11px] text-gray-400 font-medium">{step.label}</p>
                                  <p className="text-[15px] font-black text-gray-900 leading-tight">{step.value}</p>
                                </div>
                              </div>
                              {step.badge && (
                                <span className="text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full shrink-0 ml-2">{step.badge}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* iOS Safari: share steps */
                        <div className="bg-[#F2F2F7] rounded-3xl overflow-hidden">
                          {[
                            { label: 'open share menu', value: 'Tap the Share button', badge: '① Safari bottom bar' },
                            { label: 'add to your phone', value: 'Tap "Add to Home Screen"', badge: null },
                            { label: 'start chatting', value: 'Open the app', badge: '← chat will be here' },
                          ].map((step, i, arr) => (
                            <div key={i} className={`px-5 py-3.5 flex items-center justify-between ${i < arr.length - 1 ? 'border-b border-black/5' : ''}`}>
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                <div>
                                  <p className="text-[11px] text-gray-400 font-medium">{step.label}</p>
                                  <p className="text-[15px] font-black text-gray-900 leading-tight">{step.value}</p>
                                </div>
                              </div>
                              {step.badge && (
                                <span className="text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full shrink-0 ml-2">{step.badge}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ── FORM VIEW: default ── */}
                {doubtSheetView === 'form' && (
                <>
                <div className="relative px-6 pt-4 pb-4">
                  <p className="text-[24px] font-black text-gray-900 tracking-tight leading-tight">What's the Matter? 🤠</p>
                </div>

                <form onSubmit={isPwa ? submitDoubtAsPwaChat : (e) => { e.preventDefault(); setDoubtSheetView('install'); }}>
                  <div className="px-6 space-y-3">
                    <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
                      <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest block mb-0.5">Name</label>
                      <input
                        type="text"
                        required
                        value={doubtFormData.name}
                        onChange={e => setDoubtFormData({...doubtFormData, name: e.target.value})}
                        placeholder="What should we call you"
                        className="w-full bg-transparent text-[17px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
                      />
                    </div>

                    <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest">WhatsApp Number</label>
                        {doubtFormData.phone.length > 0 && doubtFormData.phone.length < 10 && (
                          <span className="text-[11px] text-amber-500 font-medium">Invalid</span>
                        )}
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        required
                        value={doubtFormData.phone}
                        onChange={e => setDoubtFormData({...doubtFormData, phone: e.target.value.replace(/\D/g, '')})}
                        placeholder="We'll reach you here"
                        className="w-full bg-transparent text-[17px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
                      />
                    </div>

                    <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
                      <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest block mb-0.5">Your Doubt</label>
                      <textarea
                        required
                        value={doubtFormData.message}
                        onChange={e => setDoubtFormData({...doubtFormData, message: e.target.value})}
                        placeholder="What's the doubt"
                        className="w-full bg-transparent text-[17px] text-gray-900 placeholder:text-gray-300 focus:outline-none resize-none h-20"
                      />
                    </div>
                  </div>

                  <div className="px-6 pt-6 pb-5">
                    <button
                      type="submit"
                      disabled={liveChatSending}
                      className="w-full bg-[#FFD700] text-black font-semibold py-[17px] rounded-2xl text-[17px] transition-colors active:opacity-80 relative overflow-hidden disabled:opacity-50"
                    >
                      <motion.div
                        className="absolute inset-0 -skew-x-12 pointer-events-none"
                        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
                        animate={{ x: ['-100%', '300%'] }}
                        transition={{ delay: 10, duration: 0.8, repeat: Infinity, repeatDelay: 7.0, ease: 'easeInOut' }}
                      />
                      <span className="relative z-10">{liveChatSending ? 'Sending…' : isPwa ? 'Start Chat' : 'Send Message'}</span>
                    </button>
                  </div>
                </form>
                </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

const ChatMessage = ({ message }: { message: Message }) => {
  const isBot = message.sender === 'bot';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div className={`max-w-[90%] px-4 py-3 relative ${isBot ? 'bg-white text-black rounded-r-2xl rounded-bl-2xl shadow-sm' : 'bg-[#FFD700] text-black rounded-l-2xl rounded-br-2xl'}`}>
        {message.text && <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.text}</p>}

        <span className={`text-[10px] float-right mt-1 ml-3 select-none ${isBot ? 'text-gray-400' : 'text-black/60'}`}>
          {message.time ?? ''}
        </span>
      </div>
    </motion.div>
  );
}

const MEETING_POINT_CONFIG: Record<string, { meetingSpot: string; transport: string; pickupTime?: string; dropdownLabel: string }> = {
  koyambedu:     { meetingSpot: 'Koyambedu', transport: 'Party Bus', pickupTime: '7:00 AM', dropdownLabel: 'Koyambedu — by 7:00 AM' },
  anna_nagar:    { meetingSpot: 'Anna Nagar', transport: 'Party Bus', pickupTime: '8:00 AM', dropdownLabel: 'Anna Nagar — by 8:00 AM' },
};

const getMeetingPointPricing = (event: Event, meetingPointId?: string, city?: string, baseTotalOverride?: number, baseAdvanceOverride?: number) => {
  const baseTotal = baseTotalOverride ?? (parseInt(event.price.replace(/[^0-9]/g, ''), 10) || 0);
  const baseAdvance = baseAdvanceOverride ?? (event.advanceAmount || 0);
  if (!meetingPointId) {
    return { total: baseTotal, advance: Math.min(baseAdvance, baseTotal) };
  }
  const selectedPoint = event.pickupPoints?.find(p => p.id === meetingPointId);
  if (city === 'Other') {
    const total = selectedPoint?.otherPrice && selectedPoint.otherPrice > 0
      ? selectedPoint.otherPrice
      : (meetingPointId === 'own_transport'
        ? (baseTotalOverride != null ? baseTotal : (event.pickupPoints?.find(p => p.id === 'own_transport')?.ownTransportPrice ?? baseTotal))
        : baseTotal);
    const desiredAdvance = selectedPoint?.otherAdvance && selectedPoint.otherAdvance > 0
      ? selectedPoint.otherAdvance
      : baseAdvance;
    return { total, advance: Math.min(desiredAdvance, total) };
  }
  if (meetingPointId !== 'own_transport') {
    return { total: baseTotal, advance: Math.min(baseAdvance, baseTotal) };
  }
  const ownPoint = event.pickupPoints?.find(p => p.id === 'own_transport');
  // If a city-specific price override was supplied, it takes precedence over the
  // globally-stored ownTransportPrice (which was set from the old global price_full).
  const ownTotal = baseTotalOverride != null
    ? baseTotal
    : (ownPoint?.ownTransportPrice ?? baseTotal);
  return { total: ownTotal, advance: Math.min(baseAdvance, ownTotal) };
};

const getCityPickupPoints = (event: Event, selectedCity: string) => {
  const dbPoints = event.pickupPoints ?? [];
  if (dbPoints.length === 0) {
    if (selectedCity === 'Other') {
      return [{ id: 'own_transport', label: 'Own Transport', meetingSpot: 'Event Location', time: '', transport: 'Your Own Transport' }];
    }
    return Object.entries(MEETING_POINT_CONFIG).map(([k, v]) => ({
      id: k,
      label: v.dropdownLabel,
      meetingSpot: v.meetingSpot,
      time: v.pickupTime ?? '',
      transport: v.transport,
      dateOffset: 0,
    }));
  }

  const ownPoint = dbPoints.find(p => p.id === 'own_transport');
  const isOtherCity = selectedCity === 'Other';

  // New system: forCity string takes priority over old forOtherCity boolean
  const hasForCityPoints = dbPoints.some(p => p.id !== 'own_transport' && p.forCity);

  let points: typeof dbPoints;
  if (hasForCityPoints) {
    if (selectedCity && selectedCity !== 'Other') {
      // Normal flow: user selected a city — show only points tagged to that city
      points = dbPoints.filter(p =>
        p.id === 'own_transport' || p.forCity === selectedCity
      );
    } else {
      // No city selected yet (preview link, etc.) — show all forCity-tagged points
      points = dbPoints;
    }
  } else {
    // Legacy: forOtherCity boolean (home city = false, Other = true)
    const hasTaggedPoints = dbPoints.some(p => p.id !== 'own_transport' && p.forOtherCity !== undefined);
    if (hasTaggedPoints) {
      points = dbPoints.filter(p =>
        p.id === 'own_transport' || (isOtherCity ? p.forOtherCity === true : p.forOtherCity === false)
      );
    } else {
      // No flags at all — show all points to everyone (fully backward compatible)
      points = dbPoints;
    }
  }

  if (!isOtherCity && ownPoint?.ownOnly) {
    return [ownPoint];
  }
  return points;
};

const JourneyCard = ({ event, city, startDate, meetingPoint }: { event: Event; city: string; startDate: string; meetingPoint?: string }) => {
  const dbPoint = meetingPoint ? event.pickupPoints?.find(p => p.id === meetingPoint) : null;
  const pointDateOffset = dbPoint?.dateOffset ?? 0;
  const d = new Date(startDate + 'T00:00:00');
  d.setDate(d.getDate() + pointDateOffset);
  const day    = d.getDate().toString();
  const month  = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  const qi = event.quickInfo || [];
  const spotField      = qi.find(c => c.label === 'Meeting Spot' || c.label === 'Venue')    || qi[0];
  const transportField = qi.find(c => c.label === 'Transport'    || c.label === 'Format')   || qi[1];

  const firstTime = event.transportPlan?.[0]?.time || event.itinerary?.[0]?.schedule?.[0]?.time || '';

  // City-specific quick-info override
  const _cityData = city ? (event as any).cityDetails?.[city] : null;

  const cfg = (!dbPoint && meetingPoint) ? MEETING_POINT_CONFIG[meetingPoint] : null;
  const resolvedMeeting   = dbPoint ? dbPoint.meetingSpot : cfg ? cfg.meetingSpot  : (_cityData?.meeting_spot ?? spotField?.value);
  const resolvedTransport = dbPoint ? dbPoint.transport   : cfg ? cfg.transport     : (_cityData?.transport    ?? transportField?.value);
  const resolvedTime      = dbPoint ? dbPoint.time        : cfg?.pickupTime || firstTime;

  return (
    <div>
      <p className="text-[10px] font-bold text-[#2C7FFF] uppercase tracking-widest mb-2 px-1">The Essentials</p>

    <div className="border border-dashed border-[#2C7FFF] rounded-2xl overflow-hidden bg-white">

      {/* Body: left info + right date (spanning full height) */}
      <div className="flex">

        {/* Left: Meeting Spot (top) + Transport (bottom) */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-dashed border-[#D4E5FF] border-opacity-60">
            <div className="flex items-center gap-1 mb-1">
              <MapPin size={9} className="text-gray-400" />
              <span className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider">{spotField?.label}</span>
            </div>
            <span className="text-[13px] font-black text-gray-900 leading-tight">{resolvedMeeting}</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center gap-1 mb-1">
              <Bus size={9} className="text-gray-400" />
              <span className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider">{transportField?.label}</span>
            </div>
            <span className="text-[13px] font-black text-gray-900 leading-tight">{resolvedTransport}</span>
          </div>
        </div>

        {/* Right: Date spanning full height */}
        <div className="border-l border-dashed border-[#D4E5FF] border-opacity-60 flex flex-col items-center justify-center px-5 py-4 bg-white gap-0.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{weekday}</span>
          <span className="text-[44px] font-black text-gray-900 leading-none">{day}</span>
          <span className="text-[14px] font-black text-gray-900 leading-tight">{month}</span>
          {resolvedTime && <span className="text-[13px] font-bold text-gray-900 mt-1.5">{resolvedTime}</span>}
        </div>

      </div>
    </div>
    </div>
  );
};

const EventDetailsOverlay = ({ event, selectedCity, allEvents, applicationCount, reservedCount, closeCalendarSignal, onCalendarVisibilityChange, openPlanSwitcherSignal, closePlanSwitcherSignal, onPlanSwitcherVisibilityChange, onSwitchEvent, onClose, onAction }: { event: Event, selectedCity: string, allEvents: Event[], applicationCount?: number | null, reservedCount?: number | null, closeCalendarSignal?: number, onCalendarVisibilityChange?: (open: boolean) => void, openPlanSwitcherSignal?: number, closePlanSwitcherSignal?: number, onPlanSwitcherVisibilityChange?: (open: boolean) => void, onSwitchEvent: (e: Event, city: string) => void, onClose: () => void, onAction: (a: 'book' | 'contact', date?: string, meetingPoint?: string) => void }) => {
  const [expandedItinerary, setExpandedItinerary] = useState<number | null>(null);
  const [showNotIncluded, setShowNotIncluded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMeetingPoint, setSelectedMeetingPoint] = useState<string>('');
  const [showMeetingPointSwitchBorder, setShowMeetingPointSwitchBorder] = useState(false);
  const nearestEventMonth = () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const upcoming = (event.dates ?? [])
      .map(d => new Date(d.date + 'T00:00:00'))
      .filter(d => d >= today)
      .sort((a, b) => a.getTime() - b.getTime());
    const target = upcoming[0] ?? new Date();
    return new Date(target.getFullYear(), target.getMonth(), 1);
  };
  const [currentMonth, setCurrentMonth] = useState(nearestEventMonth);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarRevealed, setCalendarRevealed] = useState(false);
  const [showWorkWithUs, setShowWorkWithUs] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState<'privacy' | 'refund' | 'about' | 'contact' | 'tc' | null>(null);
  const [showPlanSwitcher, setShowPlanSwitcher] = useState(false);
  const [switcherCity, setSwitcherCity] = useState(selectedCity);
  const [headerImageIndex, setHeaderImageIndex] = useState(0);
  const [headerCarouselPaused, setHeaderCarouselPaused] = useState(false);
  const isPreviewLink = typeof window !== 'undefined' && !!new URLSearchParams(window.location.search).get('preview_event');
  const isPayUFlow = event.bookingUrl === 'payu-hosted';

  // City-specific content: prefer city_details[selectedCity], fall back to flat event fields
  const _cd = (event as any).cityDetails?.[selectedCity];
  const activeIncluded: string[] = _cd?.included ?? (event.included ?? []);
  const activeNotIncluded: string[] = _cd?.not_included ?? (event.notIncluded ?? []);
  const activeOptional: string[] = _cd?.optional_activities ?? (event.optionalActivities ?? []);
  const activeItinerary: any[] = _cd?.itinerary ?? (event.itinerary ?? []);
  const activePriceFull: number    = _cd?.price_full    ?? event.priceFull    ?? 0;
  const activePriceAdvance: number = _cd?.price_advance ?? event.priceAdvance ?? event.advanceAmount ?? 0;
  const [openSpotsLeft, setOpenSpotsLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!(event as any).totalCapacity || !isPayUFlow) return;
    supabase
      .from('payu_payments')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'success')
      .then(({ count }) => {
        const left = Math.max(0, (event as any).totalCapacity - (count ?? 0));
        setOpenSpotsLeft(left);
      });
  }, [event.id, (event as any).totalCapacity, isPayUFlow]);
  const [activeVideo, setActiveVideo] = useState<{ embedUrl: string; caption: string } | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [stayImageIndexes, setStayImageIndexes] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(2 * 24 * 3600 + 14 * 3600 + 32 * 60 + 10);
  const initialTimeLeft = useRef<number>(2 * 24 * 3600 + 14 * 3600 + 32 * 60 + 10);
  const headerTouchStartXRef = useRef<number | null>(null);
  const lastHandledOpenPlanSwitcherSignalRef = useRef(openPlanSwitcherSignal ?? 0);
  const meetingPointSwitchBorderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cityDateOffset = React.useMemo(() => {
    // Pickup points carry per-city departure offsets — use them first
    const cityPoints = getCityPickupPoints(event, selectedCity).filter(p => p.id !== 'own_transport');
    if (cityPoints.length > 0 && (cityPoints[0].dateOffset ?? 0) !== 0) {
      return cityPoints[0].dateOffset ?? 0;
    }
    // Fall back to transportPlan for legacy events
    if (!(event as any).transportPlan?.length) return 0;
    const leg = (event as any).transportPlan.find((l: any) => l.cities?.map((c: any) => c.toLowerCase()).includes(selectedCity.toLowerCase()));
    return leg ? leg.dateOffset : 0;
  }, [event, selectedCity]);
  const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  const headerImages = React.useMemo(() => {
    const fromArray = Array.isArray(event.heroImages) ? event.heroImages : [];
    const merged = [...fromArray, event.heroImage]
      .map(img => (img || '').trim())
      .filter(Boolean)
      .filter((img, idx, arr) => arr.indexOf(img) === idx)
      .slice(0, 4);
    return merged;
  }, [event.heroImages, event.heroImage]);
  const currentHeaderImage = headerImages[Math.min(headerImageIndex, Math.max(headerImages.length - 1, 0))] || '';

  const shiftDateStr = (dateStr: string, offset: number) => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const itineraryRef = useRef<HTMLDivElement>(null);

  // Auto-open first itinerary item (no auto-scroll)
  useEffect(() => {
    if (event?.itinerary?.length) {
      setExpandedItinerary(0);
    }
  }, [event]);

  useEffect(() => {
    setStayImageIndexes({});
    setHeaderImageIndex(0);
    setHeaderCarouselPaused(false);
  }, [event.id]);

  useEffect(() => {
    if (headerImageIndex >= headerImages.length) setHeaderImageIndex(0);
  }, [headerImageIndex, headerImages.length]);

  useEffect(() => {
    if (headerCarouselPaused) return;
    if (headerImages.length <= 1) return;
    const timer = setInterval(() => {
      setHeaderImageIndex(prev => (prev + 1) % headerImages.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [headerImages.length, headerCarouselPaused]);

  // Reset calendar to nearest upcoming month whenever the event changes
  useEffect(() => {
    setCurrentMonth(nearestEventMonth());
  }, [event.id]);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedMeetingPoint('');
    setShowMeetingPointSwitchBorder(false);
    setTimeLeft(initialTimeLeft.current);
  }, [event.id, selectedCity]);

  useEffect(() => {
    onCalendarVisibilityChange?.(showCalendar);
  }, [showCalendar, onCalendarVisibilityChange]);

  useEffect(() => {
    if (!showCalendar) return;
    setShowCalendar(false);
  }, [closeCalendarSignal]);

  useEffect(() => {
    return () => onCalendarVisibilityChange?.(false);
  }, [onCalendarVisibilityChange]);

  useEffect(() => {
    onPlanSwitcherVisibilityChange?.(showPlanSwitcher);
  }, [showPlanSwitcher, onPlanSwitcherVisibilityChange]);

  useEffect(() => {
    if (!showPlanSwitcher) return;
    setShowPlanSwitcher(false);
  }, [closePlanSwitcherSignal]);

  useEffect(() => {
    if (!openPlanSwitcherSignal) return;
    if (openPlanSwitcherSignal <= lastHandledOpenPlanSwitcherSignalRef.current) return;
    lastHandledOpenPlanSwitcherSignalRef.current = openPlanSwitcherSignal;
    setSwitcherCity(selectedCity);
    setShowPlanSwitcher(true);
  }, [openPlanSwitcherSignal, selectedCity]);

  useEffect(() => {
    return () => onPlanSwitcherVisibilityChange?.(false);
  }, [onPlanSwitcherVisibilityChange]);

  useEffect(() => {
    if (!showCalendar || !selectedDate) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [showCalendar, selectedDate]);

  // Full staggered animation only on initial calendar open
  useEffect(() => {
    if (!showCalendar) { setCalendarRevealed(false); return; }
    setCalendarRevealed(false);
    const t = setTimeout(() => setCalendarRevealed(true), 550);
    return () => clearTimeout(t);
  }, [showCalendar]);

  useEffect(() => {
    return () => {
      if (meetingPointSwitchBorderTimerRef.current) clearTimeout(meetingPointSwitchBorderTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!activeVideo) return;

    const onMessage = (event: MessageEvent) => {
      if (!event.origin.includes('vimeo.com')) return;
      const payload = typeof event.data === 'string' ? (() => { try { return JSON.parse(event.data); } catch { return null; } })() : event.data;
      if (payload?.event === 'ended') { setActiveVideo(null); }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [activeVideo]);

  // When navigating months, skip animation — show dates instantly
  useEffect(() => {
    if (showCalendar) setCalendarRevealed(true);
  }, [currentMonth]);

  const formatTime = (totalSeconds: number) => {
    const d = Math.floor(totalSeconds / (3600 * 24));
    const h = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(d).padStart(2, '0')}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  const shouldPulseMeetingPoint = !!selectedDate && !selectedMeetingPoint;

  const triggerMeetingPointSwitchBorder = () => {
    if (meetingPointSwitchBorderTimerRef.current) clearTimeout(meetingPointSwitchBorderTimerRef.current);
    setShowMeetingPointSwitchBorder(true);
    meetingPointSwitchBorderTimerRef.current = setTimeout(() => {
      setShowMeetingPointSwitchBorder(false);
      meetingPointSwitchBorderTimerRef.current = null;
    }, 1500);
  };

	  const renderCalendar = () => {
	    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
	    // Shift so Monday = 0, Sunday = 6 (common in India)
	    const firstDay = ((new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7);
	    const nativeCapacity = (event as any).totalCapacity as number | null;
	    const nativeTaken = typeof reservedCount === 'number' ? reservedCount : null;
	    const nativeAvailability =
	      event.bookingUrl === 'native-application' && nativeCapacity && nativeTaken !== null
	        ? {
	            available: Math.max(nativeCapacity - nativeTaken, 0),
	            isFillingFast: nativeTaken / nativeCapacity >= 0.5,
	          }
	        : null;
	    const useNativeFillingFastCells = !!nativeAvailability?.isFillingFast && nativeAvailability.available > 0;
	    
	    // Calculate trip duration
	    const durationMatch = event.timing.match(/(\d+)\s*Days?/i);
    const tripDays = durationMatch ? parseInt(durationMatch[1], 10) : activeItinerary.length;
    
    const selectedDateObj = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
    // Base trip start is always the original city-agnostic start
    const baseStartStr = selectedDate ? shiftDateStr(selectedDate, -cityDateOffset) : null;
    const baseStartObj = baseStartStr ? new Date(`${baseStartStr}T00:00:00`) : null;
    const endDateObj = baseStartObj ? new Date(baseStartObj) : null;
    if (endDateObj) endDateObj.setDate(endDateObj.getDate() + tripDays - 1);
    
    const days = [];
    let availableCellIdx = 0;
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
	      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
	      const baseDateStr = shiftDateStr(dateStr, -cityDateOffset);
	      const tripDate = event.dates?.find(d => d.date === baseDateStr);
	      const effectiveDateStatus =
	        useNativeFillingFastCells && tripDate?.status === 'available'
	          ? 'selling_out'
	          : tripDate?.status;

      const isSelectedStart = selectedDate === dateStr;
      const isTripEnd = endDateObj && currentDateObj.getTime() === endDateObj.getTime();
      const isWithinTrip = selectedDateObj && endDateObj && currentDateObj > selectedDateObj && currentDateObj < endDateObj;

      const shapeClass = (() => {
        if (isSelectedStart && isTripEnd) return "rounded-full";
        if (isSelectedStart) return "rounded-l-full";
        if (isTripEnd) return "rounded-r-full";
        if (isWithinTrip) return "rounded-none";
        return "rounded-xl";
      })();

	      const isSoldOut = tripDate?.status === 'sold_out';
	      const isUnavailable = !tripDate || isSoldOut;
	      const isColoured = !!tripDate && (effectiveDateStatus === 'available' || effectiveDateStatus === 'selling_out');
      const isShimmerable = isColoured && !isSelectedStart && !isWithinTrip && !isTripEnd && !selectedDate;
      const shimmerIdx = isShimmerable ? availableCellIdx++ : -1;
      const staggerDelay = (i - 1) * 0.025;

      // Separate text/border classes from background — bg is handled by overlay
      const textBorderClass = (() => {
        if (isSelectedStart) return "text-black font-black border border-[#d4af37] z-10";
        if (isWithinTrip)    return "text-black font-semibold border border-[#d4af37]/80 z-0";
        if (isTripEnd)       return "text-black font-semibold border border-[#d4af37]";
	        if (effectiveDateStatus === 'available')    return "text-green-900 font-bold border border-green-500 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]";
	        if (effectiveDateStatus === 'selling_out')  return "text-amber-950 font-bold border border-[#f59e0b] shadow-[0_0_0_1px_rgba(245,158,11,0.35)]";
		        if (isSoldOut)     return "text-gray-600 font-black";
        return "text-gray-400";
      })();

      const bgOverlay = (() => {
        if (isSelectedStart || isWithinTrip || isTripEnd) return "rgba(255,226,138,1)";
	        if (effectiveDateStatus === 'available')   return "rgba(187,247,208,0.8)";
	        if (effectiveDateStatus === 'selling_out') return "#FFEDE5";
	        if (isSoldOut) return "#e5e7eb";
	        return "#f3f4f6"; // gray-100 for unavailable
      })();

      days.push(
        <motion.button
          key={i}
          disabled={isUnavailable}
          onClick={() => {
            if (!selectedDate) {
              trackEvent('date_selected', { city: selectedCity, category: event.category, event_id: event.id, event_title: event.title });
            }
            setSelectedDate(dateStr);
          }}
          className={`h-10 ${shapeClass} flex items-center justify-center relative overflow-hidden bg-white ${textBorderClass} ${tripDate && tripDate.status !== 'sold_out' && !isSelectedStart ? 'hover:scale-102 active:scale-98' : ''} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]`}
        >
          {/* Background colour overlay — fades IN after stagger */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-[1]"
            initial={{ opacity: 0 }}
            animate={{ opacity: calendarRevealed ? 1 : 0 }}
            transition={{ duration: 0.45, delay: staggerDelay, ease: 'easeInOut' }}
            style={{ backgroundColor: bgOverlay }}
          />
	          {/* Slash — fades in only for unavailable non-trip dates, slightly after bg */}
	          {isUnavailable && !isSoldOut && !isSelectedStart && !isWithinTrip && !isTripEnd && (
	            <motion.div
	              className="absolute inset-0 pointer-events-none z-[2]"
	              initial={{ opacity: 0 }}
	              animate={{ opacity: calendarRevealed ? 1 : 0 }}
	              transition={{ duration: 0.35, delay: staggerDelay + 0.18, ease: 'easeInOut' }}
	              style={{
	                backgroundImage: 'linear-gradient(315deg, transparent 48%, rgba(128,128,128,0.18) 49%, rgba(128,128,128,0.18) 51%, transparent 52%)',
	                backgroundSize: '100% 100%'
              }}
            />
          )}
          {/* Repeating staggered shimmer on available/filling fast cells */}
          {shimmerIdx >= 0 && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-[2] -skew-x-12"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)', width: '55%' }}
              animate={{ x: ['-120%', '320%'] }}
              transition={{
                duration: 0.65,
                delay: shimmerIdx * 0.4,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut',
              }}
            />
	          )}
	          {/* Label — always on top */}
	          {isSoldOut ? (
	            <>
	              <motion.span
	                className="text-base relative z-[3] text-gray-400 font-normal"
	                initial={{ opacity: 1 }}
	                animate={{ opacity: calendarRevealed ? [1, 1, 0] : 1 }}
	                transition={{ duration: 0.7, delay: staggerDelay, times: [0, 0.7, 1], ease: 'easeInOut' }}
	              >
	                {i}
	              </motion.span>
	              <motion.span
	                className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-[3px] text-[10px] leading-none font-black tracking-wider text-gray-600 [text-shadow:0_0_0_currentColor]"
	                initial={{ opacity: 0 }}
	                animate={{ opacity: calendarRevealed ? 1 : 0 }}
	                transition={{ duration: 0.25, delay: staggerDelay + 0.62, ease: 'easeOut' }}
	              >
	                <span>SOLD</span>
	                <span>OUT</span>
	              </motion.span>
	            </>
	          ) : (
	            <span className="text-base relative z-[3]">{i}</span>
	          )}
        </motion.button>
      );
    }

	    return (
      <div className="mb-1">
        <div className="flex justify-center items-center gap-6 mb-3">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            title="Previous month"
            aria-label="Previous month"
            className="p-1 bg-gray-100 text-gray-500 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b200]"
          >
            <ChevronLeft size={14} />
          </button>
          <h4 className="font-black text-[20px] tracking-tight">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            title="Next month"
            aria-label="Next month"
            className="p-1 bg-gray-100 text-gray-500 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b200]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-5 mt-4 mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-600">
          {nativeAvailability?.available > 0 && nativeAvailability.isFillingFast ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm border border-[#f59e0b] shadow-[0_0_0_1px_rgba(245,158,11,0.35)]" style={{ backgroundColor: '#FFEDE5' }}></div>
              <span>Only {nativeAvailability.available} spot{nativeAvailability.available === 1 ? '' : 's'} left</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm border border-[#f59e0b] shadow-[0_0_0_1px_rgba(245,158,11,0.35)]" style={{ backgroundColor: '#FFEDE5' }}></div>
                <span>Filling fast</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-green-300 border border-green-600 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"></div>
                <span>Available</span>
              </div>
            </>
          )}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200, delay: 0.15 }}
      className="absolute inset-0 bg-white z-50 flex flex-col h-full overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto pb-0">
        {/* Minimal nav bar — replaces hero image */}
        <div className="flex items-center px-4 pt-12 pb-4 border-b border-gray-100">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
            onClick={() => { if (isPreviewLink) { window.location.href = 'https://chaptera.in/aboutus'; } else { setSwitcherCity(selectedCity); setShowPlanSwitcher(true); } }}
          >
            <ChevronLeft size={16} className="text-gray-700 ml-[-1px]" strokeWidth={2.5} />
          </button>
          <h1 className="flex-1 text-center text-[15px] font-bold text-gray-700 px-3 truncate">{event.title}</h1>
          <div className="w-8 flex-shrink-0" />
        </div>

        {/* Top landscape image slot between header and plan card */}
        {headerImages.length > 0 && (
          <div className="px-4 pt-4 pb-1">
            <div
              className="mx-3"
              onTouchStart={(e) => {
                if (headerImages.length <= 1) return;
                setHeaderCarouselPaused(true);
                headerTouchStartXRef.current = e.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (headerImages.length <= 1) return;
                const startX = headerTouchStartXRef.current;
                headerTouchStartXRef.current = null;
                if (startX === null) return;
                const endX = e.changedTouches[0]?.clientX ?? startX;
                const deltaX = endX - startX;
                if (Math.abs(deltaX) < 35) return;
                setHeaderImageIndex(prev => (
                  deltaX < 0
                    ? (prev + 1) % headerImages.length
                    : (prev - 1 + headerImages.length) % headerImages.length
                ));
              }}
              onTouchCancel={() => {
                headerTouchStartXRef.current = null;
              }}
            >
              <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                <img
                  src={currentHeaderImage}
                  alt={`${event.title} header landscape`}
                  className="w-full aspect-[4/3] object-contain bg-gray-50"
                  onClick={() => setHeaderCarouselPaused(true)}
                  onTouchStart={() => setHeaderCarouselPaused(true)}
                />
              </div>
            </div>
            {headerImages.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {headerImages.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setHeaderCarouselPaused(true);
                      setHeaderImageIndex(idx);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === headerImageIndex ? 'bg-gray-900' : 'bg-gray-300'}`}
                    aria-label={`View hero image ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Info — boarding pass card */}
        {event.quickInfo && event.quickInfo.length > 0 && (() => {
          const madeFor    = event.quickInfo!.find(c => c.label === 'Made For' || c.label === "You'll Meet") || event.quickInfo![3];
          const groupSize  = event.quickInfo!.find(c => c.label === 'Group Size')   || event.quickInfo![2];
          const _msBase    = event.quickInfo!.find(c => c.label === 'Meeting Spot') || event.quickInfo![0];
          const _trBase    = event.quickInfo!.find(c => c.label === 'Transport')    || event.quickInfo![1];
          // City-specific override: prefer city_details[selectedCity].meeting_spot / .transport
          const meetingSpot = _cd?.meeting_spot ? { ..._msBase, value: _cd.meeting_spot } : _msBase;
          const transport   = _cd?.transport    ? { ..._trBase, value: _cd.transport    } : _trBase;
          const planTitle  = event.quickInfo!.find(c => c.label === 'Plan Title')?.value || 'The Plan';
          const groupNum   = groupSize?.value.match(/\d+[-–]\d+|\d+/)?.[0] || groupSize?.value;
          const groupSub   = groupSize?.value.replace(/\d+\s?/, '') || '';
          return (
            <div className="pt-5 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-black mb-4 px-6">{planTitle}</h3>
              <div className="mx-3 border border-dashed border-[#595959] rounded-2xl overflow-hidden bg-gray-50">

                {/* Top row — MEETING SPOT | TRANSPORT */}
                <div className="flex border-b border-dashed border-[#bfbfbf]/50">
                  <div className="flex-1 px-3 py-3.5 border-r border-dashed border-[#bfbfbf]/50">
                    <div className="flex items-center gap-1 mb-1.5">
                      <MapPin size={9} className="text-gray-500" />
                      <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">{meetingSpot?.label}</span>
                    </div>
                    <span className="text-[13px] font-black text-gray-900 leading-tight">{meetingSpot?.value}</span>
                  </div>
                  <div className="flex-1 px-3 py-3.5">
                    <div className="flex items-center gap-1 mb-1.5">
                      <Bus size={9} className="text-gray-500" />
                      <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">{transport?.label}</span>
                    </div>
                    <span className="text-[13px] font-black text-gray-900 leading-tight">{transport?.value}</span>
                  </div>
                </div>

                {/* Bottom row — MADE FOR | 👥 18 */}
                <div className="flex items-center">
                  <div className="flex-1 px-3 py-4 border-r border-dashed border-[#bfbfbf]/50">
                    <div className="flex items-center gap-1 mb-1.5">
                      <Heart size={9} className="text-gray-500" />
                      <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">You'll Meet</span>
                    </div>
                    <span className="text-[14px] font-black text-gray-900 leading-snug">{madeFor?.value}</span>
                  </div>
                  <div className="px-3 py-4 flex flex-col items-start flex-shrink-0">
                    <div className="flex items-center gap-1 mb-1.5">
                      <Users size={9} className="text-gray-500" />
                      <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">Gang Size</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[20px] font-black text-gray-900 leading-none">{groupNum}</span>
                      <span className="text-[13px] font-black text-gray-900 leading-none">ppl</span>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          );
        })()}

        {/* What's Included */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-black mb-4">What's Included</h3>
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 space-y-3">
              {activeIncluded.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-800">{item}</span>
                </div>
              ))}
            </div>
            {activeOptional.length > 0 && (
              <div className="px-4 pb-2 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Plus size={20} className="text-gray-500" />
                  <span>Optional activities</span>
                </div>
                <div className="space-y-2">
                  {activeOptional.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-gray-800 font-medium">
                      <CheckCircle2 size={18} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-1">
              <button 
                onClick={() => setShowNotIncluded(!showNotIncluded)}
                className="w-full px-4 py-3 flex items-center gap-2 text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="uppercase tracking-wide">What's not included</span>
                {showNotIncluded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
              </button>
              <AnimatePresence>
                {showNotIncluded && (
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: 'auto' }} 
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-gray-50"
                  >
                    <div className="p-4 pt-0">
                      <ul className="list-disc pl-5 space-y-1.5">
                        {activeNotIncluded.map((item, i) => (
                          <li key={i} className="text-[12px] leading-5 text-gray-600/85 marker:text-gray-400">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* The Plan */}
        <div className="p-6" ref={itineraryRef}>
          <h3 className="text-xl font-black mb-4">You'll Experience</h3>
          <div className="space-y-3">
            {activeItinerary.map((day, i) => (
              <div key={i} className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                <button 
                  onClick={() => setExpandedItinerary(expandedItinerary === i ? null : i)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]"
                >
                  <div>
                    <span className="text-[11px] font-black text-gray-900 uppercase tracking-[0.08em]">{day.day}</span>
                    <h4 className="font-semibold text-gray-900 mt-0.5">{day.title}</h4>
                  </div>
                  <motion.div
                    initial={false}
                    animate={{ rotate: expandedItinerary === i ? 180 : 0, scale: expandedItinerary === i ? 1.05 : 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-8 h-8 rounded-full bg-[#FFD700] text-black flex items-center justify-center flex-shrink-0 self-center"
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {expandedItinerary === i && (
                    <motion.div 
                      initial={{ height: 0 }} 
                      animate={{ height: 'auto' }} 
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 border-t border-gray-100">
                        <p className="text-sm text-gray-600 leading-relaxed mb-4 mt-3">
                          {day.description}
                        </p>
                        {day.schedule && (
                          <div className="relative pl-4 border-l border-gray-900/10 space-y-5 mt-4 ml-2 mb-2">
                            {day.schedule.map((item, idx) => (
                              <div key={idx} className="relative">
                                <div className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full bg-[#ffd700]" />
                                <div className="text-xs font-bold text-gray-400 mb-0.5 tracking-wide uppercase">{item.time}</div>
                                <div className="text-sm font-medium text-gray-800">{item.activity}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Where We Stay */}
        {event.showAccommodation && (
          <div className="p-6">
            <h3 className="text-xl font-black mb-4">
              {event.girlsOnly || hasGirlsOnlyQuickInfo(event.quickInfo) ? 'The Spot' : 'Where We Stay'}
            </h3>
            {(() => {
              const accommodation = event.accommodation ?? {};
              const stays = (accommodation.stays && accommodation.stays.length > 0)
                ? accommodation.stays
                : [{
                    name: accommodation.name ?? 'Stay',
                    images: [0, 1, 2].map(i => accommodation.images?.[i] ?? ''),
                    features: [0, 1, 2].map(i => accommodation.features?.[i] ?? '').filter(Boolean),
                  }];
              return (
                <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                  {stays.map((stay, stayIndex) => (
                    <div key={stayIndex} className={stayIndex > 0 ? 'border-t border-gray-200' : ''}>
                      <div className="relative w-full aspect-[4/3]">
                        {(() => {
                          const stayImages = (stay.images ?? []).filter(Boolean);
                          const images = stayImages.length > 0 ? stayImages : (stay.image ? [stay.image] : []);
                          const currentIndex = Math.max(0, Math.min(stayImageIndexes[stayIndex] ?? 0, Math.max(images.length - 1, 0)));
                          return images.length > 0 ? (
                            <>
                              <img src={images[currentIndex]} alt={stay.name || `Stay ${stayIndex + 1}`} className="w-full h-full object-cover" />
                              {images.length > 1 && (
                                <>
                                  <button
                                    onClick={() => setStayImageIndexes(prev => ({ ...prev, [stayIndex]: (currentIndex - 1 + images.length) % images.length }))}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                                  >
                                    <ChevronLeft size={20} className="text-gray-800 pr-0.5" />
                                  </button>
                                  <button
                                    onClick={() => setStayImageIndexes(prev => ({ ...prev, [stayIndex]: (currentIndex + 1) % images.length }))}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                                  >
                                    <ChevronRight size={20} className="text-gray-800 pl-0.5" />
                                  </button>
                                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {images.map((_, imgIndex) => (
                                      <div
                                        key={imgIndex}
                                        className={`w-1.5 h-1.5 rounded-full transition-colors ${imgIndex === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                                      />
                                    ))}
                                  </div>
                                </>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          );
                        })()}
                      </div>
                      <div className="p-4">
                        <div className="text-[11px] font-black text-gray-900 uppercase tracking-[0.08em] mb-2">
                          Night {stayIndex + 1}
                        </div>
                        <h4 className="font-bold text-lg mb-3">{stay.name || `Stay ${stayIndex + 1}`}</h4>
                        <ul className="space-y-2">
                          {(stay.features ?? []).filter(Boolean).map((feat, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                              {feat}
                            </li>
                          ))}
                        </ul>
                        {stayIndex === stays.length - 1 && (
                          <div className="mt-4 bg-emerald-50 p-3 rounded-xl text-sm font-medium text-emerald-800 border border-emerald-100 flex items-start gap-2">
                            <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>Rooms are same-gender — so everyone's comfortable</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Our Plan's Group Chat */}
        {(() => {
          const eventGroupchatMessages: GroupChatMessage[] = (event.reviews ?? [])
            .map(review => ({
              name: (review.name ?? '').trim(),
              text: (review.text ?? '').trim(),
            }))
            .filter(msg => msg.name.length > 0 && msg.text.length > 0);
          const groupchatMessagesToRender = eventGroupchatMessages.length > 0 ? eventGroupchatMessages : GROUPCHAT_MESSAGES;
          return (
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-xl font-black text-gray-900 mb-3">Our Plan's Group Chat</h3>
          <div className="relative h-56 overflow-hidden rounded-2xl border border-gray-200 bg-white/90 px-2 py-2">
            <motion.div
              className="flex flex-col items-start"
              style={{ willChange: 'transform' }}
              animate={{ y: ['0%', '-50%'] }}
              transition={{ duration: 48, ease: 'linear', repeat: Infinity }}
            >
              {[...groupchatMessagesToRender, ...groupchatMessagesToRender].map((msg, idx) => {
                const color = getGroupchatColor(msg.name);
                return (
                  <div key={`${msg.name}-${idx}`} className="flex items-end gap-2.5 mb-3">
                    <div
                      className="w-7 h-7 rounded-full text-white text-[11px] font-black flex items-center justify-center shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {getGroupchatInitial(msg.name)}
                    </div>
                    <div className="max-w-[66%]">
                      <div className="text-[11px] font-bold mb-1.5" style={{ color }}>
                        {msg.name}
                      </div>
                      <div
                        className="text-[14px] leading-[1.4] text-gray-900 px-3 py-2.5"
                        style={{
                          background: '#e9e9eb',
                          borderRadius: '18px 18px 18px 4px',
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
            <div className="pointer-events-none absolute left-0 right-0 top-0 h-5 bg-gradient-to-b from-white/80 via-white/35 to-transparent" />
            <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-5 bg-gradient-to-t from-white/80 via-white/35 to-transparent" />
          </div>
        </div>
          );
        })()}

        {/* Video Carousel */}
        {!event.isActivity && !!event.videos?.length && (
          <div className="pt-3 pb-6">
            <div className="px-6 mb-3 flex items-center justify-between">
              <h3 className="text-xl font-black">
                {event.girlsOnly || hasGirlsOnlyQuickInfo(event.quickInfo) ? 'galcode vibes.mp4' : 'chapter அ vibes.mp4'}
              </h3>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar px-6 gap-4 pb-4">
              {event.videos?.map((vid, i) => {
                const vimeoId = vid.url?.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
                const embedUrl = vimeoId ? `https://player.vimeo.com/video/${vimeoId}?autoplay=0&muted=0&badge=0&byline=0&title=0&portrait=0&api=1&player_id=video-modal-player` : null;
                return (
                  <div key={i} className="group relative w-48 h-72 flex-shrink-0 snap-center rounded-2xl overflow-hidden bg-gray-900 shadow-lg"
                    onClick={() => embedUrl && setActiveVideo({ embedUrl, caption: vid.caption || 'Trip video' })}
                    style={{ cursor: embedUrl ? 'pointer' : 'default' }}
                  >
                    {vid.thumbnail ? (
                      <img src={vid.thumbnail} alt="Video thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-800" />
                    )}
                    <div className="absolute bottom-3 right-3">
                      <div className="relative w-11 h-11 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 overflow-hidden transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105">
                        <motion.div
                          className="absolute inset-0 -skew-x-12 pointer-events-none"
                          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.32) 50%, transparent 100%)', width: '45%' }}
                          animate={{ x: ['-130%', '320%'] }}
                          transition={{ duration: 0.95, delay: i * 2.2, repeat: Infinity, repeatDelay: 6.5, ease: 'easeInOut' }}
                        />
                        <Play size={18} className="text-white ml-0.5 relative z-10" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Action Button (End of scroll) */}
        <div className="px-4 pt-4 pb-12">

          <button
            onClick={() => {
              trackEvent('calendar_opened', { city: selectedCity, category: event.category, event_id: event.id, event_title: event.title });
              setShowCalendar(true);
            }}
            className="w-full py-5 rounded-2xl bg-[#FFD700] text-black font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 -skew-x-12"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
            />
            Join Our Plan
            <ArrowRight size={22} strokeWidth={3.0} />
          </button>

	        </div>

        {/* Footer — Branding + Work With Us + Legal links */}
        <div className="bg-[#F5F2ED] border-t border-[#E4DDD3]">

          {/* Branding — non-clickable sign-off */}
          <div className="px-5 pt-7 pb-5">
            <span className="text-[18px] font-black text-black/75 leading-snug tracking-tight">
              {event.girlsOnly || hasGirlsOnlyQuickInfo(event.quickInfo) ? 'private curated events,' : 'plans we dream,'}
            </span>
            <br />
            <span className="text-[18px] font-black text-black/75 leading-snug tracking-tight">
              {event.girlsOnly || hasGirlsOnlyQuickInfo(event.quickInfo) ? 'by galcode' : <>by chapter <span className="text-[18px]">அ</span></>}
            </span>
          </div>

          {/* Work With Us — single expanding pill */}
          <div className="px-5 pb-4">
            <motion.div layout className="border-2 border-dashed border-[#C8BFB4] rounded-2xl overflow-hidden">
              <AnimatePresence mode="wait">
                {!showWorkWithUs ? (
                  <motion.button
                    key="collapsed"
                    onClick={() => setShowWorkWithUs(true)}
                    className="w-full flex items-center justify-between px-4 py-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-[13px] font-bold text-black/70 tracking-wide">Work With Us!</span>
                      <span className="text-[11px] text-black/40">Apply now — join the team</span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#D9D0C4] flex items-center justify-center flex-shrink-0">
                      <ChevronDown size={16} className="text-black/60" />
                    </div>
                  </motion.button>
                ) : (
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex justify-end px-3 pt-2">
                      <button
                        onClick={() => setShowWorkWithUs(false)}
                        className="w-9 h-9 rounded-full bg-[#D9D0C4] flex items-center justify-center"
                      >
                        <ChevronDown size={16} className="text-black/60 rotate-180" />
                      </button>
                    </div>
                    <iframe
                      src={(event.girlsOnly || hasGirlsOnlyQuickInfo(event.quickInfo))
                        ? 'https://tally.so/embed/rj20P5?alignLeft=1&hideTitle=1&transparentBackground=1'
                        : 'https://tally.so/embed/ZjYeb0?alignLeft=1&hideTitle=1&transparentBackground=1'}
                      width="100%"
                      height="520"
                      style={{ border: 'none', display: 'block' }}
                      title="Work With Us"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Legal links */}
          <div className="px-4 py-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
            <button onClick={() => setShowPolicyModal('about')} className="text-[11px] text-black/40 active:text-black transition-colors">About Us</button>
            <span className="text-black/20 text-[11px]">·</span>
            <button onClick={() => setShowPolicyModal('contact')} className="text-[11px] text-black/40 active:text-black transition-colors">Contact</button>
            <span className="text-black/20 text-[11px]">·</span>
            <button onClick={() => setShowPolicyModal('privacy')} className="text-[11px] text-black/40 active:text-black transition-colors">Privacy Policy</button>
            <span className="text-black/20 text-[11px]">·</span>
            <button onClick={() => setShowPolicyModal('tc')} className="text-[11px] text-black/40 active:text-black transition-colors">T&amp;C</button>
            <span className="text-black/20 text-[11px]">·</span>
            <button onClick={() => setShowPolicyModal('refund')} className="text-[11px] text-black/40 active:text-black transition-colors">Refund Policy</button>
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md z-40"
              onClick={() => setShowCalendar(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 z-50"
            >
              <button
                type="button"
                onClick={() => setShowCalendar(false)}
                className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                aria-label="Close calendar"
              >
                <X size={14} />
              </button>
              <div className="bg-white rounded-t-[2rem] flex flex-col max-h-[95%] overflow-hidden shadow-2xl">
              <div className="relative p-4 pb-0 bg-white sticky top-0 z-10">
                <div className="h-[11px]" aria-hidden="true" />
              </div>
              <div className="p-4 overflow-y-auto pb-safe">
                {renderCalendar()}
                
                <AnimatePresence>
                  {selectedDate && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3"
                    >
                      {/* Meeting Point Dropdown */}
                      <div className="flex flex-col gap-1.5">
                        <label className={`block w-fit origin-left font-bold uppercase tracking-wider px-1 text-[11px] text-gray-500 transition-all duration-200 ${selectedMeetingPoint ? 'opacity-60 scale-[0.75]' : 'opacity-100 scale-100'}`}>Choose Meeting Point</label>
                        <motion.div
                          className="relative"
                          animate={shouldPulseMeetingPoint ? {
                            scale: [1, 1.015, 1]
                          } : {
                            scale: 1
                          }}
                          transition={shouldPulseMeetingPoint ? {
                            duration: 1.25,
                            repeat: Infinity,
                            ease: 'easeInOut'
                          } : {
                            duration: 0.2
                          }}
                        >
                          <select
                            value={selectedMeetingPoint}
                            onChange={e => {
                              const nextMeetingPoint = e.target.value;
                              const isSwitchingMeetingPoint = !!selectedMeetingPoint && selectedMeetingPoint !== nextMeetingPoint;
                              if (!selectedMeetingPoint) {
                                // First time selecting a meeting point — price is now visible
                                trackEvent('reached_pricing', { city: selectedCity, category: event.category, event_id: event.id, event_title: event.title });
                              }
                              setSelectedMeetingPoint(nextMeetingPoint);
                              if (isSwitchingMeetingPoint) {
                                triggerMeetingPointSwitchBorder();
                              } else if (meetingPointSwitchBorderTimerRef.current) {
                                clearTimeout(meetingPointSwitchBorderTimerRef.current);
                                meetingPointSwitchBorderTimerRef.current = null;
                                setShowMeetingPointSwitchBorder(false);
                              }
                              e.currentTarget.blur();
                            }}
                            className={`w-full appearance-none bg-white border-2 rounded-xl px-4 py-4 pr-10 text-sm font-semibold text-gray-800 focus:outline-none transition-colors cursor-pointer ${shouldPulseMeetingPoint ? 'border-gray-500' : showMeetingPointSwitchBorder ? 'border-transparent' : 'border-gray-200'}`}
                            style={{ color: selectedMeetingPoint ? undefined : '#9ca3af' }}
                          >
                            <option value="" disabled hidden>Where will you join us?</option>
                            {(() => {
                              const pickupOptions = getCityPickupPoints(event, selectedCity).map(p => ({
                                value: p.id,
                                label: p.label || p.meetingSpot || 'Pickup Point',
                              }));
                              return pickupOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ));
                            })()}
                          </select>
                          <AnimatePresence initial={false}>
                            {showMeetingPointSwitchBorder && !shouldPulseMeetingPoint && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 1, 0] }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, times: [0, 0.18, 0.72, 1], ease: 'easeInOut' }}
                                className="absolute inset-0 rounded-xl border-2 border-[#FFD700] pointer-events-none"
                              />
                            )}
                          </AnimatePresence>
                          <ChevronDown size={selectedMeetingPoint ? 22 : 24} strokeWidth={3} className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none transition-opacity duration-200 ${selectedMeetingPoint ? 'opacity-50' : 'opacity-100'}`} />
                        </motion.div>
                      </div>

                      {/* Pricing + CTAs — only shown after meeting point is chosen */}
                      <AnimatePresence>
                        {selectedMeetingPoint && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.25 }}
                          >
                            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex flex-col gap-3">
                              {(() => {
                                const pricing = getMeetingPointPricing(event, selectedMeetingPoint, selectedCity, activePriceFull > 0 ? activePriceFull : undefined, activePriceAdvance > 0 ? activePriceAdvance : undefined);
                                const displayAdvance = pricing.advance;
                                const displayTotal = pricing.total;
                                const displayRemaining = Math.max(displayTotal - displayAdvance, 0);

                                return isPayUFlow ? (
                              <div className="flex flex-col gap-2">
                                {openSpotsLeft !== null && openSpotsLeft < 10 && (
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${openSpotsLeft <= 3 ? 'bg-red-500' : 'bg-orange-400'}`} />
                                    <span className={`text-[12px] font-bold ${openSpotsLeft <= 3 ? 'text-red-600' : 'text-orange-500'}`}>
                                      {openSpotsLeft === 0 ? 'Sold out' : `Only ${openSpotsLeft} spot${openSpotsLeft === 1 ? '' : 's'} left`}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-end justify-between gap-3">
                                  <p className="text-[11px] font-semibold text-gray-500">Total</p>
                                  <p className="text-2xl font-black text-black leading-tight">{formatINR(pricing.total)}</p>
                                </div>
                              </div>
                                ) : (
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-col gap-1 text-[11px] font-semibold text-gray-700">
                                  <p>Lock your spot (Advance)</p>
                                  <p className="text-2xl font-black text-black leading-tight">{formatINR(displayAdvance)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-[11px] font-semibold text-gray-700">
                                  <p className="text-[11px]">Remaining balance</p>
                                  <p className="text-base font-semibold text-black">
                                    {formatINR(displayRemaining)}
                                  </p>
                                </div>
                              </div>
                                );
                              })()}

                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => {
                                    trackEvent('contact_cta_clicked', { city: selectedCity, category: event.category, event_id: event.id, event_title: event.title });
                                    setShowCalendar(false);
                                    // Pass the base event date (undo the cityDateOffset shift) so
                                    // handleDetailsAction / JourneyCard don't double-offset.
                                    const baseDate = selectedDate ? shiftDateStr(selectedDate, -cityDateOffset) : undefined;
                                    onAction('contact', baseDate, selectedMeetingPoint);
                                  }}
                                  className="w-full sm:min-w-[160px] px-3 py-2.5 rounded-lg bg-[#FFF3BF] text-[#b38200] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#ffe58f] transition-colors border border-[#FFD700]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]"
                                >
                                  <MessageCircle size={15} />
                                  Contact Us
                                </button>
                                <button
                                  onClick={() => {
                                    trackEvent('book_cta_clicked', { city: selectedCity, category: event.category, event_id: event.id, event_title: event.title });
                                    setShowCalendar(false);
                                    const baseDate = selectedDate ? shiftDateStr(selectedDate, -cityDateOffset) : undefined;
                                    onAction('book', baseDate, selectedMeetingPoint);
                                  }}
                                  className="w-full sm:min-w-[160px] px-3 py-2.5 rounded-lg bg-[#FFD700] text-black font-black text-sm flex items-center justify-center gap-2 hover:bg-[#e6c200] transition-transform active:scale-95 shadow-md shadow-[#FFD700]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50 relative overflow-hidden"
                                >
                                  <motion.div
                                    className="absolute inset-0 -skew-x-12"
                                    style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
                                    animate={{ x: ['-100%', '300%'] }}
                                    transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
                                  />
                                  {(event.quickInfo?.find(item => item.label === 'Calendar CTA')?.value?.trim()) || 'Book Now'}
                                  <ArrowRight size={16} strokeWidth={3.0} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Policy / Legal Modals */}
      <AnimatePresence onExitComplete={() => setVideoReady(false)}>
        {activeVideo && (
          <>
            <motion.div
              key="video-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-[210] bg-black/70 flex items-center justify-center"
              onClick={() => { setActiveVideo(null); }}
            >
              {!videoReady && (
                <svg className="animate-spin w-8 h-8 text-gray-300 pointer-events-none" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              )}
            </motion.div>

            <motion.div
              key="video-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: videoReady ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-[211] flex items-center justify-center p-4"
              style={{ pointerEvents: videoReady ? 'auto' : 'none' }}
              onClick={() => setActiveVideo(null)}
            >
              <div className="relative w-[88%] max-w-[320px] overflow-visible" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => { setActiveVideo(null); }}
                  className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-[#FFD700] text-black flex items-center justify-center hover:bg-[#e6c200] transition-colors shadow-lg"
                  style={{ opacity: videoReady ? 1 : 0, transition: 'opacity 0.3s ease' }}
                  aria-label="Close video"
                >
                  <X size={20} strokeWidth={3} />
                </button>
                <div className="relative w-full max-w-[320px]">
                  {/* Reserve final 9:16 size immediately to prevent opening jank */}
                  <div style={{ paddingTop: '177.7778%' }} />
                  <div className="absolute inset-0 rounded-[28px] bg-transparent">
                    <div
                      className="relative w-full h-full overflow-hidden rounded-[27px]"
                      style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
                    >
                      <iframe
                        id="video-modal-player"
                        src={activeVideo.embedUrl}
                        title={activeVideo.caption}
                        className="absolute max-w-none"
                        style={{
                          inset: '-2px',
                          width: 'calc(100% + 4px)',
                          height: 'calc(100% + 4px)',
                          border: 0,
                          clipPath: 'inset(0 round 27px)'
                        }}
                        allow="autoplay; fullscreen; picture-in-picture"
                        onLoad={(e) => {
                          e.currentTarget.contentWindow?.postMessage(JSON.stringify({ method: 'addEventListener', value: 'ended' }), '*');
                          setVideoReady(true);
                        }}
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPolicyModal && (
          <motion.div
            key="policy-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-black/50"
            onClick={() => setShowPolicyModal(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPolicyModal && (
          <motion.div
            key={showPolicyModal}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-[201] bg-white rounded-t-[2rem] flex flex-col max-h-[85%]"
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />
            <div className="px-6 pt-3 pb-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-[17px] font-bold text-gray-900">
                {showPolicyModal === 'about' && 'About Us'}
                {showPolicyModal === 'contact' && 'Contact Us'}
                {showPolicyModal === 'privacy' && 'Privacy Policy'}
                {showPolicyModal === 'tc' && 'Terms & Conditions'}
                {showPolicyModal === 'refund' && 'Refund & Cancellation Policy'}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-[14px] text-gray-600 leading-relaxed">
              {showPolicyModal === 'about' && (
                <>
                  <p>We are <strong className="text-gray-900">chapter அ</strong>, an experience-based social club, operated by <strong className="text-gray-900">CHAPTER</strong>, registered in Chennai, India.</p>
                  <p>From cozy house parties to unforgettable trips, we believe that everyone deserves to feel like they belong & find people to do things that they have always wanted to.</p>
                  <p>Join our plans, and let's lifemaxx together — one experience at a time.</p>
                </>
              )}
              {showPolicyModal === 'contact' && (
                <>
                  <p><strong className="text-gray-900">chapter அ</strong><br />Chennai, Tamil Nadu, India</p>
                  <p>Email: <a href="mailto:chapteraaa.official@gmail.com" className="text-gray-900 underline">chapteraaa.official@gmail.com</a></p>
                  <p>WhatsApp / Phone: <a href="tel:+918838111564" className="text-gray-900 underline">+91 8838111564</a></p>
                  <p>We typically respond within a few hours on WhatsApp.</p>
                </>
              )}
              {showPolicyModal === 'privacy' && (
                <>
                  <p><strong className="text-gray-900">1. Information We Collect</strong><br />We collect your name and WhatsApp number when you make a booking. This is used solely to communicate further details and payment reminders.</p>
                  <p><strong className="text-gray-900">2. How We Use It</strong><br />Your information is used to confirm bookings, send booking updates, and process payments. We do not sell or share your data with third parties.</p>
                  <p><strong className="text-gray-900">3. Payment Data</strong><br />Payments are processed via secure and trusted Indian payment gateways. We do not store any card or UPI credentials on our servers.</p>
                  <p><strong className="text-gray-900">4. WhatsApp Communication</strong><br />By providing your number, you consent to receiving updates and reminder messages on WhatsApp.</p>
                  <p><strong className="text-gray-900">5. Contact</strong><br />For privacy concerns, email us at chapteraaa.official@gmail.com.</p>
                </>
              )}
              {showPolicyModal === 'tc' && (
                <>
                  <p className="text-gray-500 text-[13px]">Note: The term "Event" refers to all kinds of experiences we curate including trips, activities, workshops & events in this policy agreement.</p>
                  <p><strong className="text-gray-900">1. Advance Payment</strong><br />The advance payment secures your spot and is non-refundable under any circumstances.</p>
                  <p><strong className="text-gray-900">2. Balance Payment</strong><br />The remaining balance is due on the date shown on the website after you make the advance payment. Further notices and reminders will be sent via WhatsApp. Failure to pay will result in forfeiture of your spot.</p>
                  <p><strong className="text-gray-900">3. Itinerary Changes</strong><br />chapter அ reserves the right to modify the itinerary due to weather, safety, or unforeseen circumstances.</p>
                  <p><strong className="text-gray-900">4. Liability</strong><br />chapter அ is not liable for personal injury, loss of belongings, or delays caused by third-party services.</p>
                  <p><strong className="text-gray-900">5. WhatsApp Communication</strong><br />By providing your number, you consent to receiving logistic updates and booking reminders on WhatsApp.</p>
                  <p><strong className="text-gray-900">6. Age Requirement</strong><br />Certain experiences are strictly 21+. Participants must meet the minimum age requirement specified for each experience. Valid ID proof may be required. Failure to meet the age requirement may result in denial of entry without refund.</p>
                </>
              )}
              {showPolicyModal === 'refund' && (
                <>
                  <p className="text-gray-500 text-[13px]">Note: The term "Event" refers to all kinds of experiences we curate including trips, activities, workshops & events in this policy agreement.</p>
                  <p><strong className="text-gray-900">1. Advance Payment</strong><br />A fixed advance amount is required to secure a spot on any event. This advance is non-refundable unless chapter அ cancels the event.</p>
                  <p><strong className="text-gray-900">2. Balance Payment</strong><br />The remaining balance must be paid before the event. Only those who have completed the full payment will be allowed to join the event. If the balance is not paid, the advance will not be refunded.</p>
                  <p><strong className="text-gray-900">3. Cancellation by Customer</strong><br />If a customer cancels, no refund will be provided, as we engage third-party partners for transport, accommodation, and curated expenses in advance. These arrangements are confirmed on your behalf and are non-recoverable.</p>
                  <p><strong className="text-gray-900">4. Cancellation by chapter அ</strong><br />If the event is cancelled for any reason, a full refund of all amounts paid will be issued.</p>
                  <p><strong className="text-gray-900">5. Contact for Refunds</strong><br />Reach us on WhatsApp at +91 8838111564 or email chapteraaa.official@gmail.com.</p>
                </>
              )}
            </div>
            <div className="px-6 pb-8 pt-3 flex-shrink-0">
              <button
                onClick={() => setShowPolicyModal(null)}
                className="w-full py-[14px] rounded-2xl bg-black text-white text-[15px] font-semibold active:opacity-80 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Plan Switcher Bottom Sheet ───────────────────────────────────── */}
      <AnimatePresence>
        {showPlanSwitcher && (
          <>
            <motion.div
              key="switcher-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[200] bg-black/50"
              onClick={() => setShowPlanSwitcher(false)}
            />
            <motion.div
              key="switcher-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-[201] bg-white rounded-t-[2rem] flex flex-col max-h-[85%]"
            >
              <button
                type="button"
                onClick={() => setShowPlanSwitcher(false)}
                className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                aria-label="Close plan switcher"
              >
                <X size={14} />
              </button>
              {/* City switcher — same style as month switcher in calendar */}
              {(() => {
                const cityOrder: string[] = [];
                allEvents.forEach(e => (e.cities ?? []).forEach(c => { if (!cityOrder.includes(c)) cityOrder.push(c); }));
                const cityIdx = cityOrder.indexOf(switcherCity);
                const cityLabel = switcherCity.toLowerCase() === 'other' ? 'Other Cities' : switcherCity.charAt(0).toUpperCase() + switcherCity.slice(1).toLowerCase();
                const cityEvents = sortGirlsOnlyLast(allEvents.filter(e => (e.cities ?? []).includes(switcherCity)));
                const categories: string[] = [];
                cityEvents.forEach(e => { if (!categories.includes(e.category)) categories.push(e.category); });

                return (
                  <>
                    <div className="flex flex-col items-center gap-3 px-6 pt-7 pb-5 border-b border-gray-100 flex-shrink-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        CHANGE CITY
                      </span>
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => setSwitcherCity(cityOrder[(cityIdx - 1 + cityOrder.length) % cityOrder.length])}
                          className="p-1 bg-gray-100 text-gray-500 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="font-black text-[20px] tracking-tight">{cityLabel}</span>
                        <button
                          onClick={() => setSwitcherCity(cityOrder[(cityIdx + 1) % cityOrder.length])}
                          className="p-1 bg-gray-100 text-gray-500 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                    {/* Plans for selected city */}
                    <div className="flex-1 overflow-y-auto px-5 py-5">
                      <div className="mb-5">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3 text-center">CHANGE PLAN</div>
                        {cityEvents.map(e => {
                          const isActive = e.id === event.id && switcherCity === selectedCity;
                          const isGirlsOnlyPlan = e.girlsOnly || hasGirlsOnlyQuickInfo(e.quickInfo);
                          const activePlanClass = isGirlsOnlyPlan
                            ? 'bg-[#FFF0F8] border-2 border-[#FF4FB8]'
                            : 'bg-[#FFF9E6] border-2 border-[#FFD700]';
                          const activeTextClass = isGirlsOnlyPlan ? 'text-[#c0187a]' : 'text-[#b38200]';
                          const activeBadgeClass = isGirlsOnlyPlan
                            ? 'text-[#c0187a] bg-[#FF4FB8]/15'
                            : 'text-[#b38200] bg-[#FFD700]/20';
                          return (
                            <button
                              key={e.id}
                              onClick={() => { if (!isActive) onSwitchEvent(e, switcherCity); setShowPlanSwitcher(false); }}
                              className={`w-full text-left px-4 py-4 rounded-2xl mb-3 flex items-center justify-between gap-3 transition-all active:scale-[0.98] ${isActive ? activePlanClass : 'bg-gray-50 border border-gray-100'}`}
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <span className={`min-w-0 truncate text-[15px] font-bold ${isActive ? activeTextClass : 'text-gray-900'}`}>{e.title}</span>
                                {!isActive && isGirlsOnlyPlan && (
                                  <span className="rounded-full bg-[#FFF3F8] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#D36B9E] ring-1 ring-[#F7CFE1] flex-shrink-0">
                                    Girls Only
                                  </span>
                                )}
                              </div>
                              {isActive && <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${activeBadgeClass}`}>Viewing</span>}
                            </button>
                          );
                        })}
                      </div>
                      {cityEvents.length === 0 && (
                        <p className="text-[13px] text-gray-400 text-center py-8">No plans for this city yet.</p>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
