import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, fetchEvents, fetchEventByIdOrSlug, fetchChatMessages, fillMsg, trackEvent, fetchEventCounts, fetchEventDateCounts, buildEventAnnouncement, isElapsedDate, isDateSoldOut, newLeadId, reportLead } from './supabase';
import { getAffiliateRef } from './affiliate';
import { getAttribution } from './attribution';
import { setPixelUserData, getFbp, getFbc } from './metaPixel';
import { isInAppBrowser, openExternalUrl, ensureDistinctUrl } from './inAppBrowser';
import { TermsContent } from './TermsContent';
import { NativePaymentOverlay, type PaymentSubsheet } from './PaymentOverlay';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, MessageCircle, Ticket, Send, CheckCircle2, XCircle, ChevronDown, ChevronUp, Play, Pause, ChevronLeft, ChevronRight, Users, Bus, ShieldCheck, Plus, Heart, ArrowRight } from 'lucide-react';
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

// lucide-react dropped brand marks, so the WhatsApp glyph is inlined. Used on the
// pay-at-venue timeline's group-chat row, where the point is that the guest is
// joining a real WhatsApp group — a generic speech bubble doesn't carry that.
const WhatsAppGlyph = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#25D366" aria-hidden="true" className="flex-shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
  </svg>
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
  foundersNoteUrl?: string;
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
  // 'whatsapp' = free community event; chat opens the WhatsApp sheet
  // instead of the details page (bookingUrl = WhatsApp invite link).
  bookingFlow?: string;
  // 'full' = single payment (one "Single Entry" amount, no advance/balance split).
  paymentMode?: string;
  // Split events only: balance paid online at the venue rather than before the event.
  payAtVenue?: boolean;
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
type HistoryLayer = 'event-details' | 'details-calendar' | 'details-plan-switcher' | 'post-details-chat' | 'community-sheet' | 'doubt-popup' | 'booking-timeline' | 'application-form' | 'details-form' | 'payment-checkout' | 'payment-success' | 'payment-failure' | 'policy-modal' | 'tc-modal' | 'payment-method-picker' | 'payment-fee-info';

const GROUPCHAT_MESSAGES: GroupChatMessage[] = [
  { name: 'Harish', text: 'Had such a fun time guys, do lemme know when we plan another beach trip.' },
  { name: 'Nivi', text: 'Does someone have that video of me falling from the surf board? haha' },
  { name: 'Bish', text: 'Bro that sunrise hit different. Still not over that vibe.' },
  { name: 'Kavi', text: 'I came for the trip, left with 4 new people on my speed dial.' },
  { name: 'Reshma', text: 'Can we do a random no-plan food run this weekend too?' },
  { name: 'Jagannath', text: 'Next one I am bringing cards. Post-dinner game table was chaos.' },
];

const GROUPCHAT_AVATAR_COLORS = ['#5B8DEF', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#14B8A6', '#EC4899', '#F97316'];
// The URL that should be showing while `layer` is the visible sheet.
//
// Instagram's in-app browser on iOS only registers a history entry with its
// back chevron when that entry carries a URL DISTINCT from the current one.
// Measured on device: entries pushed with window.location.href (what we used to
// do) leave the chevron greyed out no matter how many are pushed, while an
// otherwise identical pushState carrying a different URL activates it. A hash
// is not enough — it has to be a real URL difference.
//
// So each sheet now owns a ?sheet= value. Everything else in the query string
// is preserved, which matters for ?ref= (creator attribution), ?preview_event
// and ?dbg. Payment return URLs are built server-side, so this never reaches
// PayU.
function sheetUrl(layer: HistoryLayer | null): string {
  const params = new URLSearchParams(window.location.search);
  if (layer) params.set('sheet', layer);
  else params.delete('sheet');
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  // /plans keeps the URL in step with the visible layer on close, so a same-URL
  // push should not arise here — this is belt-and-braces so one future missed
  // close path cannot silently kill the chevron the way it did in the invite
  // flow. Only used for pushes; replaceState callers pass through unchanged.
  return next;
}

function sheetPushUrl(layer: HistoryLayer): string {
  return ensureDistinctUrl(sheetUrl(layer));
}

const HISTORY_LAYER_DEPTH: Record<HistoryLayer, number> = {
  'event-details': 1,
  // Opens straight off the plan list for a whatsapp-flow event, short-circuiting
  // the chat, so it is a top-level sheet like event-details rather than a step
  // inside the booking stack.
  'community-sheet': 1,
  'details-calendar': 2,
  'details-plan-switcher': 2,
  'post-details-chat': 3,
  'doubt-popup': 4,
  'booking-timeline': 5,
  // The invite-flow twin of details-form: both open off the booking timeline,
  // an event is only ever one or the other, so they share a depth.
  'application-form': 6,
  'details-form': 6,
  'payment-checkout': 7,
  'payment-success': 8,
  'payment-failure': 8,
  // Leaf modals — they sit on top of whatever opened them and nothing opens on
  // top of them, so they are deeper than every stack below.
  'policy-modal': 9,
  'tc-modal': 9,
  // The bill's own nested sheets. Deeper than everything: they render on top of
  // the checkout overlay, so back must close them before it closes the bill.
  'payment-method-picker': 10,
  'payment-fee-info': 10,
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





// ─── APPLICATION FORM ──────────────────────────────────────────────────────────
function ApplicationForm({
  event, selectedDate, selectedPickupId, selectedCity, reservedCount,
  step, form, setForm, onNext, onBack, onClose, onSubmitted,
}: {
  event: any; selectedDate?: string; selectedPickupId?: string; selectedCity?: string;
  reservedCount: number | null; step: 1 | 2;
  form: { name: string; phone: string; gender: string; email: string; whyJoin: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; gender: string; email: string; whyJoin: string }>>;
  onNext: () => void; onBack: () => void; onClose: () => void; onSubmitted: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // The wa.me link built at submit time. Rendered as a real <a> on the success
  // screen so the WhatsApp hop never depends on window.open succeeding —
  // Instagram's in-app browser swallows it, and iOS Safari blocks it whenever
  // the popup slips outside the tap gesture.
  const [waLink, setWaLink] = useState('');
  const [step1Attempted, setStep1Attempted] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  // Invite applications collect the same visible fields for chapter and galcode.
  // Galcode still stores Female behind the scenes for the existing DB shape.
  const isChapter = !event.girlsOnly;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const step1Valid = form.name.trim() && /^[6-9]\d{9}$/.test(form.phone) && emailValid;
  const step2Valid = form.whyJoin.trim();
  const formValid = step1Valid && step2Valid; // single-page form: all fields required

  const handleSubmit = async () => {
    if (!formValid || submitting) return;
    setSubmitting(true);
    setError('');

    // Build the WhatsApp URL and open a blank window SYNCHRONOUSLY while still
    // inside the user-gesture event — iOS Safari blocks window.open after any await.
    const formatEventDate = (d?: string) => {
      if (!d) return 'TBD';
      const date = new Date(d + 'T00:00:00');
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
    };
    const waMessage = encodeURIComponent(`I have registered for ${event.title} on ${formatEventDate(selectedDate)}.`);
    const waUrl = `https://wa.me/919940111564?text=${waMessage}`;
    setWaLink(waUrl);
    // Instagram's in-app browser either returns null here or hands back a tab
    // it then refuses to navigate, and closing that dud tab on an error path
    // can take the whole page with it. Don't reach for a popup there at all —
    // the success screen's WhatsApp button carries those visitors instead.
    const waWindow = isInAppBrowser() ? null : window.open('', '_blank');

    try {
      const chosenPoint = selectedPickupId
        ? (event.pickupPoints ?? []).find((p: any) => p.id === selectedPickupId)
        : null;

      // Give the browser pixel an identity now that we have one. Everything the
      // visitor does from here on — Lead, and Purchase if they come back to the
      // receipt — carries it. Before this the browser events were anonymous.
      setPixelUserData({
        email: form.email,
        phone: form.phone,
        name: form.name,
        city: selectedCity,
      });

      // Minted BEFORE the insert so the row itself carries the dedup key. That is
      // what lets the browser Lead, the immediate server call and any later
      // sweep all report the SAME id — a backstop that generated a fresh one
      // would collide with nothing and count the application twice.
      const leadId = newLeadId();

      const { error: sbError } = await supabase.from('applications').insert({
        event_slug: String(event.id ?? '').toLowerCase(),
        // Dedup key for the Meta Lead. NULL on admin/marketer-created rows,
        // which is precisely what keeps those out of the ad dataset.
        lead_id: leadId,
        // Captured here because this is the only moment they exist. If the
        // browser's own capi-lead call later fails, the sweep runs from cron with
        // no request to read headers from — and Meta lists client_user_agent as
        // REQUIRED for every website event. Without these the backstop would
        // report Leads that are missing a required parameter and match poorly.
        lead_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 512) : null,
        lead_fbp: getFbp(),
        lead_fbc: getFbc(),
        name: form.name.trim(),
        phone: form.phone,
        // gender is NOT NULL: galcode invite applications auto-store Female;
        // chapter has no gender field so it stores ''.
        gender: isChapter ? '' : 'Female',
        email: form.email.trim() || null,
        why_join: form.whyJoin.trim(),
        status: 'pending',
        selected_date: selectedDate ?? null,
        pickup_point_id: chosenPoint?.id ?? selectedPickupId ?? null,
        pickup_label: chosenPoint?.label ?? null,
        selected_city: selectedCity ?? null,
        // Creator affiliate attribution: stamp the session ref at application
        // time (invite events attribute at apply). A BEFORE INSERT trigger
        // resolves it to affiliate_id; null/unknown = founder's own link.
        affiliate_code: getAffiliateRef(),
        // Traffic source (utm/fbclid) captured on the landing URL. This is what
        // makes cost-per-ticket knowable from our own data instead of Meta's.
        attribution: getAttribution(),
      });

      if (sbError) {
        waWindow?.close();
        if (sbError.code === '23505') { setAlreadyApplied(true); }
        else { setError(`${sbError.code}: ${sbError.message}`); }
        return;
      }
      // Lead — the conversion an invite-only campaign is optimised on, so it is
      // reported twice: once from this browser, once from our server. They share
      // one id, so Meta counts a single application.
      //
      // The server copy is what reaches Meta for the ~half of visitors whose
      // browser blocks fbevents.js entirely. It is safe to fire here and only
      // here: the applications row was inserted immediately above and the insert
      // succeeded, so capi-lead's "no application, no Lead" guard will find it.
      // (The open flow deliberately has no server Lead — there this event fires
      // before the row exists, and a server copy would arrive with a different
      // id and double-count. Open events optimise on Purchase anyway.)
      trackEvent('application_submitted', { city: selectedCity, category: event.category, event_id: event.id, event_title: event.title, dedupId: leadId });
      reportLead({
        leadId,
        eventSlug: String(event.id ?? '').toLowerCase(),
        eventTitle: event.title,
        phone: form.phone,
      });
      setSubmitted(true);
      onSubmitted();
      // Navigate the already-opened window to WhatsApp. If there wasn't one
      // (in-app browser, or a popup blocker), we deliberately don't retry with
      // another window.open — that second call is outside the tap gesture and
      // gets blocked too. The success screen's WhatsApp button is the fallback.
      if (waWindow) waWindow.location.href = waUrl;
    } catch (err: any) {
      waWindow?.close();
      setError('Something went wrong. Please try again.');
      console.error('handleSubmit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl">🎉</div>
      <p className="text-[20px] font-black text-gray-900">Application sent!</p>
      <p className="text-[14px] text-gray-500 leading-relaxed w-full">We'll review your application.<br/>If selected, you'll get an invitation via WhatsApp.</p>
      {/* A plain <a>, not a scripted popup: a top-level tap on a wa.me link is
          the one handoff every browser performs, Instagram's included. */}
      {waLink && (
        <a
          href={waLink}
          className="mt-2 w-full py-5 rounded-2xl bg-[#25D366] text-white font-black text-[17px] flex items-center justify-center gap-2.5 active:scale-95 transition-all"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.241-.579-.486-.5-.668-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Message us on WhatsApp
        </a>
      )}
      <button
        onClick={() => { onClose(); window.location.href = '/plans'; }}
        className="w-full py-5 rounded-2xl bg-[#FFD700] text-black font-black text-[17px] flex items-center justify-center gap-3 active:scale-95 transition-all relative overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 -skew-x-12"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
        />
        Explore Other Plans
        <ArrowRight size={20} strokeWidth={3} />
      </button>
    </div>
  );

  if (alreadyApplied) return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl">👋</div>
      <p className="text-[20px] font-black text-gray-900">Already Applied!</p>
      <p className="text-[14px] text-gray-500 leading-relaxed w-full">We already have your application for this plan.<br/>We'll reach out on WhatsApp if you're selected.</p>
      <button
        onClick={() => { onClose(); window.location.href = '/plans'; }}
        className="mt-2 w-full py-5 rounded-2xl bg-[#FFD700] text-black font-black text-[17px] flex items-center justify-center gap-3 active:scale-95 transition-all relative overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 -skew-x-12"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
        />
        Explore Other Plans
        <ArrowRight size={20} strokeWidth={3} />
      </button>
    </div>
  );

  /* ── Single-page form: Name, Phone, Email, Why Join ── */
  return (
    <div className="flex-1 overflow-y-auto px-5 pt-1 pb-6 flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
          {step1Attempted && !form.name.trim() && !nameFocused && (
            <span className="text-[11px] text-amber-500 font-medium">Invalid Name</span>
          )}
        </div>
        <div className={`bg-[#F2F2F7] rounded-2xl px-4 py-3.5 transition-shadow ring-2 ${
          nameFocused ? 'ring-[#FFD700]' : step1Attempted && !form.name.trim() ? 'ring-red-500' : 'ring-transparent'
        }`}>
          <input
            type="text" value={form.name} placeholder="What do we call you?"
            onChange={e => setForm(f => ({ ...f, name: e.target.value.slice(0, 24) }))}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            className="w-full bg-transparent text-[16px] font-semibold text-gray-900 placeholder-gray-300 outline-none"
          />
        </div>
      </div>

      {/* Phone */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">WhatsApp Number</label>
          {(form.phone.length > 0 || step1Attempted) && !/^[6-9]\d{9}$/.test(form.phone) && (
            <span className="text-[11px] text-amber-500 font-medium">
              {form.phone.startsWith('0') ? 'Your number cannot start with 0' : 'Invalid Number'}
            </span>
          )}
        </div>
        <div className={`bg-[#F2F2F7] rounded-2xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-[#FFD700] transition-shadow ${(form.phone.length > 0 || step1Attempted) && !/^[6-9]\d{9}$/.test(form.phone) ? 'ring-2 ring-red-500' : ''}`}>
          <input
            type="tel" value={form.phone} placeholder="We'll reach you here"
            onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
            className="w-full bg-transparent text-[16px] font-semibold text-gray-900 placeholder-gray-300 outline-none"
            inputMode="numeric"
          />
        </div>
      </div>

      {/* Email — the invitation is delivered here */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1">
          <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">Email</label>
          {step1Attempted && !emailValid && (
            <span className="text-[11px] text-amber-500 font-medium">Invalid Email</span>
          )}
        </div>
        <div className={`bg-[#F2F2F7] rounded-2xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-[#FFD700] transition-shadow ${step1Attempted && !emailValid ? 'ring-2 ring-red-500' : ''}`}>
          <input
            type="email" value={form.email} placeholder="You'll receive your invite here"
            onChange={e => setForm(f => ({ ...f, email: e.target.value.slice(0, 100) }))}
            className="w-full bg-transparent text-[16px] font-semibold text-gray-900 placeholder-gray-300 outline-none"
            inputMode="email" autoCapitalize="off" autoCorrect="off" spellCheck={false}
          />
        </div>
      </div>

      {/* Why join */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-bold text-gray-400 uppercase tracking-wider px-1">Why do you want to join us?</label>
        <div className="bg-[#F2F2F7] rounded-2xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-[#FFD700] transition-shadow">
          <textarea
            value={form.whyJoin} placeholder="Tell us why this plan excites you..."
            onChange={e => setForm(f => ({ ...f, whyJoin: e.target.value.slice(0, 300) }))}
            rows={1}
            className="w-full bg-transparent text-[16px] font-semibold text-gray-900 placeholder-gray-300 outline-none resize-none leading-relaxed"
          />
        </div>
      </div>

      {error && <p className="text-[13px] text-red-500 text-center">{error}</p>}

      {/* Submit */}
      <button
        type="button" disabled={submitting}
        onClick={() => { setStep1Attempted(true); handleSubmit(); }}
        className="w-full py-[17px] rounded-2xl font-black text-[17px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-[#FFD700] text-black"
      >
        {submitting ? (
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
        ) : (
          <>Submit <ArrowRight size={18} strokeWidth={2.5} /></>
        )}
      </button>
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
  // Transcript length before the customer picked a plan, so closing the details
  // sheet can restore the chat to exactly that point. null = no pick to undo.
  const preSelectMessageCountRef = useRef<number | null>(null);

  // ─── DEBUG HUD (opt-in: /plans?dbg=1) ──────────────────────────────────────
  // Exists because the Instagram in-app browser on iOS is the one place the back
  // button does nothing, and it is the one browser none of our tooling can
  // drive — two theories were built and falsified guessing at it. This reports
  // what actually happens on the device instead of what we assume.
  //
  // Read once at mount, not per render: some flows strip the query string with
  // replaceState, and the readout has to survive that.
  const [isDebugHud] = useState(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('dbg') === '1';
  });
  const [hudPops, setHudPops] = useState(0);
  const [hudPushes, setHudPushes] = useState(0);
  const [hudLen, setHudLen] = useState(() => (typeof window === 'undefined' ? 0 : window.history.length));

  useEffect(() => {
    if (!isDebugHud || typeof window === 'undefined') return;
    // Deliberately a SECOND popstate listener, independent of the layer stack's
    // own. When the stack is disarmed (wrong pathname) its listener never
    // attaches at all, so a zero from it would be ambiguous — did the browser
    // not fire, or did we not listen? This one always listens, so pops=0 means
    // the event genuinely never reached the page.
    const onPop = () => { setHudPops(n => n + 1); setHudLen(window.history.length); };
    window.addEventListener('popstate', onPop);
    const originalPush = window.history.pushState;
    window.history.pushState = function patchedPushState(...args: Parameters<History['pushState']>) {
      setHudPushes(n => n + 1);
      const result = originalPush.apply(window.history, args);
      setHudLen(window.history.length);
      return result;
    };
    return () => {
      window.removeEventListener('popstate', onPop);
      window.history.pushState = originalPush;
    };
  }, [isDebugHud]);

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


  // Google login was removed from the open-event details form — the form now
  // collects name/phone/gender/email manually. We intentionally no longer hydrate
  // googleUser from a lingering Supabase session, so the (dormant) already-booked
  // detection never fires and every booking is treated as fresh.

  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState('INIT');
  // Latches true the instant a calendar CTA (Book Now / Contact Us) is pressed,
  // so the galcode header doesn't flash back to "chapter அ" during the transient
  // PROCESSING (typing) step before ASK_DOUBTS/SHOW_FAQ renders. Auto-reset by an
  // effect once the user lands back on a pre-doubt step.
  const [inDoubtFlow, setInDoubtFlow] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [bookingDate, setBookingDate] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [journeyCardData, setJourneyCardData] = useState<{ event: Event; city: string; startDate: string; meetingPoint?: string } | null>(null);
  const [showBookingTimeline, setShowBookingTimeline] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  // Community event (booking_flow='whatsapp') whose WhatsApp sheet is open.
  // Tapping its chip opens this sheet directly — no user message, no bot
  // reply, no step change; closing returns to the untouched chat.
  const [communityEvent, setCommunityEvent] = useState<Event | null>(null);
  const [appFormData, setAppFormData] = useState({ name: '', phone: '', gender: '', email: '', whyJoin: '' });
  const [appFormSubmitted, setAppFormSubmitted] = useState(false);
  const [applicationCount, setApplicationCount] = useState<number | null>(null);
  const [reservedCount, setReservedCount] = useState<number | null>(null);
  // Per-date counts (keyed YYYY-MM-DD) for per-date spots-left in the calendar,
  // ApplicationForm, and booking timeline. null until loaded.
  const [dateCounts, setDateCounts] = useState<Record<string, { registered: number; reserved: number }> | null>(null);
  // Dynamic global announcements computed from invite-only events
  const [dynamicAnnouncements, setDynamicAnnouncements] = useState<string[]>([]);
  const [detailsCalendarOpen, setDetailsCalendarOpen] = useState(false);
  const [closeDetailsCalendarSignal, setCloseDetailsCalendarSignal] = useState(0);
  const [detailsPlanSwitcherOpen, setDetailsPlanSwitcherOpen] = useState(false);
  const [closeDetailsPlanSwitcherSignal, setCloseDetailsPlanSwitcherSignal] = useState(0);
  // The footer policy sheets (About / Contact / Privacy / Refund / T&C) live
  // inside EventDetailsOverlay, but their open state is mirrored up here for the
  // same reason the calendar's and the plan switcher's are: only this component
  // owns the history stack, so only it can give a sheet a back-button entry.
  const [detailsPolicyOpen, setDetailsPolicyOpen] = useState(false);
  const [closeDetailsPolicySignal, setCloseDetailsPolicySignal] = useState(0);
  const [detailsReady, setDetailsReady] = useState(false);
  const detailsReadyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const detailsSafetyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [detailsForm, setDetailsForm] = useState({ name: '', phone: '', gender: '', email: '' });
  // Seats this booking is for. Always 1 unless the plan allows a group buy.
  const [ticketCount, setTicketCount] = useState(1);
  // How many tickets the blocked "already booked" screen should mention, from
  // the server's 409 — the client can't read applications directly (RLS).
  const [alreadyPaidTickets, setAlreadyPaidTickets] = useState(1);
  const [tcAccepted, setTcAccepted] = useState(false);
  const [googleUser, setGoogleUser] = useState<{ name: string; email: string } | null>(null);
  const [googleSignInLoading, setGoogleSignInLoading] = useState(false);
  const [existingBooking, setExistingBooking] = useState<any>(null);
  const [forceNewBooking, setForceNewBooking] = useState(false);
  const [openAlreadyPaid, setOpenAlreadyPaid] = useState(false);
  const [checkingOpenBooking, setCheckingOpenBooking] = useState(false);
  const [openBookingCheckError, setOpenBookingCheckError] = useState('');
  const [openOtpSession, setOpenOtpSession] = useState('');
  const [openOtpDigits, setOpenOtpDigits] = useState<string[]>(() => Array(6).fill(''));
  const [openOtpDelivery, setOpenOtpDelivery] = useState<'whatsapp' | 'email'>('whatsapp');
  const [openOtpEmailWaitSeconds, setOpenOtpEmailWaitSeconds] = useState(0);
  const [openOtpAttemptsExhausted, setOpenOtpAttemptsExhausted] = useState(false);
  const [sendingOpenOtp, setSendingOpenOtp] = useState(false);
  const [verifyingOpenOtp, setVerifyingOpenOtp] = useState(false);
  const openOtpInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (openOtpEmailWaitSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setOpenOtpEmailWaitSeconds(seconds => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [openOtpEmailWaitSeconds]);

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
  // Which of the bill's nested sheets is open. Held here rather than inside
  // NativePaymentOverlay because only this component owns history, and without
  // an entry of its own, back closed the bill under the open sheet.
  const [paymentSubsheet, setPaymentSubsheet] = useState<PaymentSubsheet | null>(null);
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
    selectedCity?: string;
    // Seats this bill covers. Absent/1 everywhere except a pay-at-venue group buy.
    ticketCount?: number;
  } | null>(null);
  const [offerAcknowledged, setOfferAcknowledged] = useState(false);
  const [showDoubtPopup, setShowDoubtPopup] = useState(false);
  const [doubtFormData, setDoubtFormData] = useState({ name: '', phone: '', email: '', gender: '', message: '', whyJoin: '' });
  // Once a doubt is submitted this session, hide the "ask a doubt" CTA in the
  // FAQ step so it isn't offered again (FAQs + "ready to book" stay visible).
  const [doubtSubmittedThisSession, setDoubtSubmittedThisSession] = useState(false);
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
  // Ordered deepest-first: whatever is visually on top is the layer the back
  // button acts on. The three sheets that don't exclude each other in state --
  // application-form, community-sheet and policy-modal -- therefore have to sit
  // above the broader conditions they can overlap with (isPostDetailsChatLayer
  // ignores all three, and policy-modal is only ever open over event-details).
  const activeHistoryLayer: HistoryLayer | null =
    paymentSubsheet === 'method-picker' ? 'payment-method-picker'
    : paymentSubsheet === 'fee-info' ? 'payment-fee-info'
    : showTcModal ? 'tc-modal'
    : detailsPolicyOpen ? 'policy-modal'
    : showDoubtPopup ? 'doubt-popup'
    : paymentView === 'failure' ? 'payment-failure'
    : paymentView === 'success' ? 'payment-success'
    : paymentView === 'checkout' ? 'payment-checkout'
    : showDetailsForm ? 'details-form'
    : showApplicationForm ? 'application-form'
    : showBookingTimeline ? 'booking-timeline'
    : communityEvent ? 'community-sheet'
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
    // Undo the pick, don't just close the sheet. Trim the transcript back to
    // where it was before they chose this plan and drop the event-scoped state,
    // so the chat — and the header, whose announcement is per-event — look
    // untouched. Leaving them set showed a thread where they had already
    // answered both questions, under a bot asking the first one again.
    if (preSelectMessageCountRef.current !== null) {
      const trimTo = preSelectMessageCountRef.current;
      preSelectMessageCountRef.current = null;
      setMessages(prev => (prev.length > trimTo ? prev.slice(0, trimTo) : prev));
      setSelectedEvent(null);
      setJourneyCardData(null);
      setBookingDate('');
    }
    setStep('SELECT_EVENT');
  }, [isPlansHistoryManaged, activeHistoryLayer]);
  const isPhonePeFlow = selectedEvent?.bookingUrl?.toLowerCase().includes('phonepe');
  const isPayUFlow    = selectedEvent?.bookingUrl === 'payu-hosted';

  // ── Group bookings ────────────────────────────────────────────────────────
  // One number may hold several seats, but ONLY on an open + split +
  // pay-at-venue plan. That is where a group buy makes sense: the advance is
  // small enough to front for friends, and the balance is settled per head who
  // actually turns up. Everywhere else stays strictly one ticket per number.
  // create-payu-order re-checks this and forces 1, so the stepper is a
  // convenience, not the control.
  const MAX_TICKETS = 5;
  const allowsMultiTicket = isPayUFlow
    && selectedEvent?.paymentMode === 'split'
    && !!selectedEvent?.payAtVenue;

  // The date this booking will actually land on. Mirrors the fallback in
  // handleProceedToPhonePe exactly: without it, a customer who never opened the
  // calendar would be offered seats counted against no date at all, while their
  // payment silently went to the first one.
  const effectiveBookingDate = bookingDate || selectedEvent?.dates?.[0]?.date || '';

  // Never offer more seats than that date actually has. Capacity is per-date
  // (totalCapacity) against the date's reserved tickets, which now sums
  // ticket_count rather than counting bookings. Unknown capacity means no cap
  // here — the server still refuses an overshoot.
  const spotsLeftForBookingDate = (() => {
    const cap = (selectedEvent as any)?.totalCapacity;
    if (typeof cap !== 'number' || cap <= 0) return null;
    const reserved = effectiveBookingDate && dateCounts
      ? (dateCounts[effectiveBookingDate]?.reserved ?? 0)
      : 0;
    return Math.max(0, cap - reserved);
  })();
  // The stepper deliberately goes to 5 even when the date holds fewer. Capping
  // the + button silently is the worse experience: someone wanting 4 seats taps
  // a dead control and is told nothing. Letting them ask for 4 and answering
  // "only 2 left on this date" tells them what's actually true, and they can
  // change the date instead of abandoning.
  const maxTickets = MAX_TICKETS;

  // A capacity figure the SERVER corrected us with. dateCounts is fetched when
  // the plan loads and goes stale on a form left open, so the preflight can come
  // back with a smaller number than the client believed. Null until that happens.
  const [serverSpotsLeft, setServerSpotsLeft] = useState<number | null>(null);
  useEffect(() => { setServerSpotsLeft(null); }, [effectiveBookingDate, selectedEvent?.id, ticketCount]);

  const spotsLeftForTickets = serverSpotsLeft ?? spotsLeftForBookingDate;
  const ticketsExceedSpots = allowsMultiTicket
    && spotsLeftForTickets != null
    && ticketCount > spotsLeftForTickets;

  // Reset to a single ticket when the plan can't do group buys; otherwise just
  // hold the 1..5 bound. Deliberately does NOT pull the number down to fit the
  // remaining spots — that would silently undo the customer's choice and hide
  // the very message we want them to read.
  useEffect(() => {
    if (!allowsMultiTicket) { setTicketCount(1); return; }
    setTicketCount(n => Math.min(Math.max(1, n), MAX_TICKETS));
  }, [allowsMultiTicket]);
  const isNativeApplicationFlow = selectedEvent?.bookingUrl === 'native-application';

  // Open-event funnel pings. The server counts DISTINCT sessions per stage, so
  // repeats were always harmless to the numbers — but the form-open effect
  // re-fired every time the customer backed out of the bill onto the form
  // (roughly 2.6 writes per session in practice), which is pure noise in a
  // table we purge at 90 days. Latch each (stage, event) once per session so
  // one visitor writes one row per stage.
  const openFunnelPingedRef = React.useRef<Set<string>>(new Set());
  const pingOpenFunnel = React.useCallback((stage: 'details_form_opened' | 'details_form_submitted') => {
    if (!isPayUFlow || !selectedEvent) return;
    const key = `${stage}:${selectedEvent.id}`;
    if (openFunnelPingedRef.current.has(key)) return;
    openFunnelPingedRef.current.add(key);
    trackEvent(stage, {
      city: formatCityLabel(selectedCity),
      category: selectedCategory || selectedEvent.category,
      event_id: selectedEvent.id,
      event_title: selectedEvent.title,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPayUFlow, selectedEvent, selectedCity, selectedCategory]);

  // Fires when the open details form becomes visible. Invite/PhonePe/community
  // flows are untouched.
  useEffect(() => {
    if (showDetailsForm) pingOpenFunnel('details_form_opened');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDetailsForm, isPayUFlow]);

  // Compute dynamic global announcements from invite-only events once msgs + events are ready
  useEffect(() => {
    if (!msgsReady || !eventsLoaded) return;
    const slugs = (msgs.announcement_event_slugs || '')
      .split('\n').map((s: string) => s.trim()).filter(Boolean);
    const staticText = (msgs.announcement_static_text || '').trim() || 'plans we dream';
    if (slugs.length === 0) {
      setDynamicAnnouncements([staticText]);
      return;
    }
    Promise.all(
      slugs.map(async (slug: string) => {
        const event = events.find(e => e.id === slug);
        if (!event) return null;
        // Shared with the AdminPanel preview so the two can't drift — see
        // buildEventAnnouncement in supabase.ts for the per-date rules.
        return buildEventAnnouncement(
          slug,
          event.title ?? slug,
          (event as any)?.totalCapacity ?? null,
          event.dates ?? [],
        );
      })
    ).then(lines => {
      const valid = lines.filter(Boolean) as string[];
      setDynamicAnnouncements([...valid, staticText]);
    });
  }, [msgsReady, eventsLoaded]);

  // Fetch per-date reserved counts for native-application AND open (payu-hosted)
  // events — both drive per-date capacity/spots-left in the calendar. The same
  // event_booking_counts(_by_date) RPC counts advance_paid/fully_paid as reserved
  // for either flow.
  useEffect(() => {
    const wantsCounts = isNativeApplicationFlow || selectedEvent?.bookingUrl === 'payu-hosted';
    if (!wantsCounts || !selectedEvent?.id) {
      setApplicationCount(null);
      setReservedCount(null);
      setDateCounts(null);
      return;
    }
    fetchEventCounts(selectedEvent.id).then(({ registered, reserved }) => {
      setApplicationCount(registered);
      setReservedCount(reserved);
    });
    fetchEventDateCounts(selectedEvent.id).then(setDateCounts);
  }, [isNativeApplicationFlow, selectedEvent?.id, selectedEvent?.bookingUrl]);

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

  // Use dynamically computed announcements (from invite-only event data + static text).
  // Fall back to the old general_announcements field, then hardcoded defaults.
  const parsedGeneralAnnouncements = (msgs.general_announcements || '')
    .split('\n').map((line: string) => line.trim()).filter(Boolean);
  const globalAnnouncements = dynamicAnnouncements.length > 0
    ? dynamicAnnouncements
    : parsedGeneralAnnouncements.length > 0
      ? parsedGeneralAnnouncements
      : GENERAL_ANNOUNCEMENTS;

  // Determine which announcements to show
  const isAfterTripInfo = step === 'ASK_DOUBTS' || step === 'SHOW_FAQ' || step === 'DONE';
  // Reset the doubt-flow latch once the user is back on a pre-doubt step (not the
  // transient PROCESSING step, and not within the doubt flow itself) — e.g. after
  // going back to event details or picking a new plan.
  useEffect(() => {
    if (step !== 'PROCESSING' && !isAfterTripInfo) setInDoubtFlow(false);
  }, [step, isAfterTripInfo]);
  const currentAnnouncements = (isAfterTripInfo && (selectedEvent?.announcements?.length ?? 0) > 0)
    ? (selectedEvent?.announcements ?? [])
    : globalAnnouncements;

  // Clear timers when unmounting or re-running
  const clearDetailTimers = () => {
    if (detailsReadyTimerRef.current) clearTimeout(detailsReadyTimerRef.current);
    if (detailsSafetyTimerRef.current) clearTimeout(detailsSafetyTimerRef.current);
  };

  useEffect(() => clearDetailTimers, []);

  // Rotate the header one-liner. Keyed on the announcement *content* (not just
  // length) so when the set switches — e.g. general → event after a CTA — the
  // index resets to 0 and a fresh 5s timer starts, instead of inheriting the old
  // timer's leftover phase (which made the first rotation arrive at a random time).
  const announcementsKey = currentAnnouncements.join('|');
  useEffect(() => {
    setAnnouncementIndex(0);
    if (currentAnnouncements.length <= 1) return;
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % currentAnnouncements.length);
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcementsKey]);

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
      // Everything closed. Drop ?sheet= so the URL keeps matching what is on
      // screen — replace, never push: closing must not add an entry.
      if (previousLayer && !handlingPopStateRef.current) {
        window.history.replaceState(window.history.state, '', sheetUrl(null));
      }
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
      // sheetUrl(), not window.location.href — an entry whose URL matches the
      // current one is invisible to Instagram's back chevron. See sheetUrl().
      window.history.pushState({ chapteraLayer: nextLayer }, '', sheetPushUrl(nextLayer));
    } else {
      // Going shallower without a traversal (a sheet closed by its own X rather
      // than by back). No new entry, but the URL still has to follow the layer,
      // or it would keep naming a sheet that is no longer open.
      window.history.replaceState(window.history.state, '', sheetUrl(nextLayer));
    }
    historyLayerRef.current = nextLayer;
  }, [activeHistoryLayer, isDetailsHistoryManaged]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isDetailsHistoryManaged) return;
    const onPopState = () => {
      if (!activeHistoryLayer) return;
      handlingPopStateRef.current = true;
      // There used to be a trap here: back from the details sheet force-opened
      // the plan switcher and pushed a replacement entry, so back could never
      // leave the details screen. It was a deliberate retention choice, made
      // when Instagram's chevron was dead and it therefore only affected Safari.
      // Once back started working in Instagram it applied to most of our
      // traffic, and a back button that refuses to go back reads as broken.
      // Removed 2026-08-05 on the owner's call: back now closes details and
      // returns to the plan list, and no push happens inside popstate at all.
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
        setShowApplicationForm(false);
        setShowBookingTimeline(false);
        setShowWaitlistForm(false);
        setDetailsPlanSwitcherOpen(false);
        setDetailsCalendarOpen(false);
        setCloseDetailsPolicySignal(prev => prev + 1);
        setDetailsPolicyOpen(false);
        setShowChat(false);
        setShowTransition(false);
        setDetailsReady(true);
        setShowDetails(true);
        setStep('EVENT_SELECTED');
        setTimeout(() => { handlingPopStateRef.current = false; }, 0);
        return;
      }
      if (isPreviewMode && activeHistoryLayer === 'event-details') {
        window.location.assign('/lifestyle');
        setTimeout(() => { handlingPopStateRef.current = false; }, 0);
        return;
      }
      if (activeHistoryLayer === 'payment-method-picker' || activeHistoryLayer === 'payment-fee-info') {
        setPaymentSubsheet(null);
      } else if (activeHistoryLayer === 'tc-modal') {
        setShowTcModal(false);
      } else if (activeHistoryLayer === 'policy-modal') {
        setCloseDetailsPolicySignal(prev => prev + 1);
        setDetailsPolicyOpen(false);
      } else if (activeHistoryLayer === 'doubt-popup') {
        setShowDoubtPopup(false);
      } else if (activeHistoryLayer === 'payment-failure' || activeHistoryLayer === 'payment-success') {
        setPaymentView('checkout');
      } else if (activeHistoryLayer === 'payment-checkout') {
        setPaymentView('idle');
        setShowDetailsForm(true);
      } else if (activeHistoryLayer === 'details-form') {
        setShowDetailsForm(false);
        setShowBookingTimeline(true);
      } else if (activeHistoryLayer === 'application-form') {
        // Same landing as tapping the form's own backdrop — back out to the
        // timeline they opened it from, not out of the booking entirely.
        setShowApplicationForm(false);
        setShowBookingTimeline(true);
      } else if (activeHistoryLayer === 'community-sheet') {
        // Nothing underneath to restore: the sheet short-circuits straight off
        // the plan list, so closing it just puts them back on the list.
        setCommunityEvent(null);
      } else if (activeHistoryLayer === 'booking-timeline') {
        setShowBookingTimeline(false);
        setShowChat(true);
        setShowDetails(false);
        setStep('ASK_DOUBTS');
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
        // The other half of the old trap lived here — it opened the plan
        // switcher instead of closing. Back now does the same thing the sheet's
        // own X does. viaHistory=true because the traversal already happened;
        // closeEventDetails must not call history.back() a second time.
        closeEventDetails(true);
      }
      setTimeout(() => { handlingPopStateRef.current = false; }, 0);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [activeHistoryLayer, isDetailsHistoryManaged, isPreviewMode, isPlansHistoryManaged, closeEventDetails]);


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



  const handleEventSelect = (event: Event) => {
    // Community events short-circuit the whole flow: no user message, no
    // bot reply, no details page — just the WhatsApp community sheet.
    if (event.bookingFlow === 'whatsapp') {
      trackEvent('community_sheet_opened', { event_id: event.id, event_title: event.title });
      setCommunityEvent(event);
      return;
    }
    setStep('PROCESSING');
    // Remember how long the transcript was BEFORE this pick, so closing the
    // details sheet can put the chat back exactly as it was. Without this, back
    // left their plan and city sitting in the transcript and then asked which
    // plan they wanted again, which reads like the bot forgot.
    // Only set when it's null: picking a different plan from the switcher runs
    // through here again, and the trim point must stay at the FIRST pick so
    // back still lands on a clean chooser rather than a half-trimmed thread.
    if (preSelectMessageCountRef.current === null) {
      preSelectMessageCountRef.current = messages.length;
    }
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
        const active = (event.dates ?? []).filter(d => d.status !== 'sold_out');
        const upcoming = active
          .filter(d => !isElapsedDate(d.date))
          .map(d => new Date(d.date + 'T00:00:00'))
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
    setInDoubtFlow(true); // galcode header on immediately, before the PROCESSING flash
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
      // Keep chat visible in background so it shows behind the timeline sheet
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
    trackEvent('book_clicked', { city: formatCityLabel(selectedCity), category: selectedCategory || selectedEvent?.category, event_id: selectedEvent?.id, event_title: selectedEvent?.title });
    setShowBookingTimeline(true);
    setShowWaitlistForm(false);
    setStep('DONE');
  };



  const doubtSubmittingRef = React.useRef(false);

  const handleDoubtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (doubtSubmittingRef.current) return; // guard against double-tap
    doubtSubmittingRef.current = true;

    // Capture values and close sheet immediately — don't wait for the network
    const name = doubtFormData.name;
    const phone = doubtFormData.phone;
    const email = doubtFormData.email;
    const message = doubtFormData.message;
    const whyJoin = doubtFormData.whyJoin;
    setShowDoubtPopup(false);
    setDoubtSubmittedThisSession(true);
    setDoubtFormData({ name: '', phone: '', email: '', gender: '', message: '', whyJoin: '' });

    // Inject chat messages right away
    addUserMessage(message);
    simulateBotTyping(() => {
      addBotMessage(`Got it! We'll contact you soon via WhatsApp on +91 ${phone}. 👍`);
    }, 1200);

    // Persist to DB in the background
    const pickup = getSelectedPickupForVars();
    const selectedDate = getSelectedDateForVars();
    const payload = {
      name,
      phone,
      email: email.trim() || null,
      gender: null,
      doubt: message,
      why_join: whyJoin || null,
      event_title: selectedEvent?.title ?? '',
      event_id: selectedEvent?.id ?? '',
      event_category: selectedEvent?.category ?? selectedCategory ?? '',
      city: selectedCity ? formatCityLabel(selectedCity) : '',
      selected_date: selectedDate || null,
      reporting_date: selectedDate ? formatFullDate(selectedDate) : null,
      meeting_spot: pickup.meetingSpot || null,
      transport: pickup.transport || null,
      reporting_time: pickup.reportingTime || null,
      submitted_at: new Date().toISOString(),
    };
    console.log('[handleDoubtSubmit] inserting payload:', payload);
    const { error } = await supabase.from('doubt_submissions').insert(payload);
    if (error) {
      console.error('[handleDoubtSubmit] insert failed:', error.message, error.details, error.hint, error);
    } else {
      console.log('[handleDoubtSubmit] insert succeeded');
    }
    doubtSubmittingRef.current = false;
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

  const openEventFunctionHeaders = {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };

  const resetOpenOtp = () => {
    setOpenOtpSession('');
    setOpenOtpDigits(Array(6).fill(''));
    setOpenOtpDelivery('whatsapp');
    setOpenOtpEmailWaitSeconds(0);
    setOpenOtpAttemptsExhausted(false);
  };

  const checkOpenBookingEligibility = async (): Promise<boolean> => {
    if (!selectedEvent || !isPayUFlow) return true;
    const normalizedPhone = detailsForm.phone.replace(/\D/g, '').slice(-10);
    setCheckingOpenBooking(true);
    setOpenBookingCheckError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payu-order`, {
        method: 'POST',
        headers: openEventFunctionHeaders,
        body: JSON.stringify({
          check_only: true,
          name: detailsForm.name.trim(),
          phone: normalizedPhone,
          email: detailsForm.email.trim(),
          event_slug: selectedEvent.id,
          selected_city: selectedCity || undefined,
          ticket_count: ticketCount,
          // No booking row exists yet on this preflight, so the capacity check
          // needs the chosen date from here — and it has to be the same date the
          // payment will use, fallback included.
          selected_date: effectiveBookingDate || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data?.error === 'already paid for this open event') {
        setAlreadyPaidTickets(Math.max(1, Number(data?.ticket_count ?? 1) || 1));
        setOpenAlreadyPaid(true);
        return false;
      }
      // The group buy no longer fits the date — someone else took the spots
      // while this form was open. Tell them the real number rather than a
      // generic failure; the stepper re-clamps as soon as counts refresh.
      if (res.status === 409 && data?.error === 'not enough spots left for that many tickets') {
        // Record what the server says is left and let the inline message under
        // the stepper do the talking — the customer keeps the number they chose
        // and decides whether to lower it or change the date.
        setServerSpotsLeft(Math.max(0, Number(data?.spots_left ?? 0) || 0));
        return false;
      }
      if (!res.ok) {
        setOpenBookingCheckError('We could not verify this booking right now. Please try again.');
        return false;
      }
      return true;
    } catch (err) {
      console.error('open booking eligibility check failed:', err);
      setOpenBookingCheckError('We could not verify this booking right now. Please try again.');
      return false;
    } finally {
      setCheckingOpenBooking(false);
    }
  };

  const requestOpenEventOtp = async (delivery: 'whatsapp' | 'email' = 'whatsapp') => {
    if (!selectedEvent || !isPayUFlow) return;
    if (!(await checkOpenBookingEligibility())) return;

    setSendingOpenOtp(true);
    setOpenBookingCheckError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/open-event-otp`, {
        method: 'POST',
        headers: openEventFunctionHeaders,
        body: JSON.stringify({
          action: 'request',
          name: detailsForm.name.trim(),
          phone: detailsForm.phone,
          email: detailsForm.email.trim(),
          event_slug: selectedEvent.id,
          delivery,
          ...(delivery === 'email' ? { previous_verification_token: openOtpSession } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.verification_token) {
        setOpenBookingCheckError(data?.error || `We could not send your ${delivery === 'email' ? 'verification email' : 'WhatsApp code'}. Please try again.`);
        return;
      }
      // The form is now genuinely submitted: it passed validation, the booking
      // was found eligible, and we've sent a code. This is the honest "form
      // completed" moment — the applications row only lands AFTER the OTP is
      // verified, so counting rows was really counting form-fill AND OTP pass
      // as one step. Session-scoped, matching the form-open ping's units.
      pingOpenFunnel('details_form_submitted');
      setOpenOtpSession(data.verification_token);
      setOpenOtpDigits(Array(6).fill(''));
      setOpenOtpDelivery(delivery);
      setOpenOtpAttemptsExhausted(false);
      if (delivery === 'whatsapp') setOpenOtpEmailWaitSeconds(30);
      window.setTimeout(() => openOtpInputsRef.current[0]?.focus(), 0);
    } catch (err) {
      console.error('open event OTP request failed:', err);
      setOpenBookingCheckError(`We could not send your ${delivery === 'email' ? 'verification email' : 'WhatsApp code'}. Please try again.`);
    } finally {
      setSendingOpenOtp(false);
    }
  };

  const verifyOpenEventOtpAndProceed = async () => {
    if (!selectedEvent || !openOtpSession) return;
    const code = openOtpDigits.join('');
    if (!/^\d{6}$/.test(code)) {
      setOpenBookingCheckError(`Enter the six-digit code we sent on ${openOtpDelivery === 'email' ? 'email' : 'WhatsApp'}.`);
      return;
    }

    setVerifyingOpenOtp(true);
    setOpenBookingCheckError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/open-event-otp`, {
        method: 'POST',
        headers: openEventFunctionHeaders,
        body: JSON.stringify({
          action: 'verify',
          verification_token: openOtpSession,
          code,
          phone: detailsForm.phone,
          email: detailsForm.email.trim(),
          event_slug: selectedEvent.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.verified) {
        if (data?.attempts_exhausted === true) {
          setOpenOtpAttemptsExhausted(true);
          setOpenBookingCheckError('');
          return;
        }
        setOpenBookingCheckError(data?.error || 'We could not verify that code. Please try again.');
        return;
      }
      await handleProceedToPhonePe(data.verification_token || openOtpSession);
    } catch (err) {
      console.error('open event OTP verification failed:', err);
      setOpenBookingCheckError('We could not verify that code. Please try again.');
    } finally {
      setVerifyingOpenOtp(false);
    }
  };

  const handleProceedToPhonePe = async (verifiedOtpSession = openOtpSession) => {
    if (!selectedEvent) return;

    // The bill is gated by an OTP for open events. create-payu-order
    // verifies this session again when the bill actually requests PayU fields.
    if (isPayUFlow) {
      if (!verifiedOtpSession) {
        setOpenBookingCheckError('Please verify your WhatsApp number first.');
        return;
      }
      if (!(await checkOpenBookingEligibility())) return;
    }

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
      email: detailsForm.email.trim() || undefined,
      otpSession: isPayUFlow ? verifiedOtpSession : undefined,
      ticketCount: allowsMultiTicket ? ticketCount : 1,
      // Sent to create-payu-order so it charges the correct city-aware price
      // directly from the client's current selection (server validates it
      // against event.cities) instead of depending on the applications-row
      // fallback, which can be stale for a returning lead.
      selectedCity,
    };
    // sessionStorage instead of localStorage so the buyer's phone/name
    // doesn't outlive the booking tab on a shared/borrowed device. The
    // PayU redirect stays inside the same tab so this survives the
    // round-trip; closing the tab clears it. The post-PayU receipt page
    // has a phone-input fallback for users who reopen the success URL.
    try {
      sessionStorage.setItem('bookingName', ctx.name);
      sessionStorage.setItem('bookingPhone', ctx.phone);
    } catch (err) {
      // ignore storage errors in restricted environments
    }
    trackEvent('external_redirect_initiated', { city: formatCityLabel(selectedCity), category: selectedCategory || selectedEvent?.category, event_id: selectedEvent?.id, event_title: selectedEvent?.title });

    // Open events: create a `pending` applications row so the lead is tracked
    // (In progress → Cart abandoned → Paid) and the PayU callback can flip its
    // status by (event_slug, phone). Mirrors the invite ApplicationForm insert.
    // Insert-or-ignore on the (event_slug, phone) unique key: if a row already
    // exists (e.g. a prior abandonment), leave it untouched so its status and
    // cart_abandoned flag survive for the "Recovered" flow. Phone is normalised
    // to 10 digits to match what create-payu-order writes to payu_payments
    // (the callback matches on it). Open events have no event_marketers rows, so
    // the assign-marketer trigger no-ops — no human resources pulled in.
    if (isPayUFlow) {
      const normalizedPhone = detailsForm.phone.replace(/\D/g, '').slice(-10);
      // journeyCardData.meetingPoint holds the pickup point's ID (the same value the
      // invite flow passes as selectedPickupId). Match by id (with label/meetingSpot
      // fallbacks) and store the human-readable label — previously this matched by
      // label against an id, so pickup_label got the raw id (e.g. "pt_1783194739092")
      // for any point beyond the first. Mirrors the invite ApplicationForm resolution.
      const chosenPoint = (selectedEvent.pickupPoints ?? []).find((p: any) =>
        p.id === selectedMeetingPoint || p.label === selectedMeetingPoint || p.meetingSpot === selectedMeetingPoint
      );
      const affRef = getAffiliateRef();
      const openSlug = String(selectedEvent.id ?? '').toLowerCase();
      // Use a PLAIN insert, not an upsert. Anon/authenticated have INSERT but no
      // SELECT policy on applications (the PII lockdown), and PostgREST's upsert
      // (`ON CONFLICT DO NOTHING`) needs to SEE the conflicting row to skip it —
      // so RLS rejects the whole upsert with 42501, and the open lead's row was
      // never created (invisible in People, no cart-abandon tracking). A plain
      // insert passes RLS; a returning/abandoned lead simply hits the
      // (event_slug, phone) unique key (23505), which we treat as success — their
      // row already exists and refresh_open_application below updates its fields.
      // Same as the invite flow: identify the browser as soon as we know who it
      // is, so the events after this point stop being anonymous.
      setPixelUserData({
        email: detailsForm.email,
        phone: normalizedPhone,
        name: detailsForm.name,
        city: selectedCity,
      });

      const { error: appErr } = await supabase
        .from('applications')
        .insert({
          event_slug: openSlug,
          name: detailsForm.name.trim(),
          phone: normalizedPhone,
          email: detailsForm.email.trim() || null,
          // Open form now collects gender in-form; why_join stays empty (NOT NULL
          // on applications, but the open flow doesn't ask for it).
          gender: detailsForm.gender || '',
          why_join: '',
          status: 'pending',
          selected_date: dateStr || null,
          pickup_point_id: chosenPoint?.id ?? (selectedMeetingPoint || null),
          pickup_label: chosenPoint?.label ?? null,
          selected_city: selectedCity ?? null,
          // Seats this lead is after. Recorded before payment so an abandoned
          // group buy is visible in the People tab as the 3-seat intent it was,
          // not as a single ticket. The money never comes from here — the server
          // recomputes it from the order request.
          ticket_count: allowsMultiTicket ? ticketCount : 1,
          // Creator affiliate attribution on first insert (BEFORE INSERT trigger
          // resolves affiliate_code → affiliate_id).
          affiliate_code: affRef,
          // Traffic source (utm/fbclid) captured on the landing URL. Only set on
          // the FIRST insert — a returning lead hits the (event_slug, phone)
          // unique key and keeps whatever source first brought them in, which is
          // the honest answer for who earned the booking.
          attribution: getAttribution(),
        });
      // 23505 = returning lead already has a row (expected, fine). Never block the
      // payment on tracking — log anything else and continue to checkout.
      if (appErr && appErr.code !== '23505') console.error('open application insert failed:', appErr);

      // A returning lead's row is left as-is by the 23505 above — so if they now
      // pick a DIFFERENT date/pickup their stale selected_date would no longer match
      // any event_date and would break the per-date group-chat link, warm-note dates,
      // and balance lookups. Anon has no UPDATE policy on applications, so refresh the
      // booking-choice fields via a SECURITY DEFINER RPC that guards against
      // advance_paid/fully_paid. Fire-and-forget.
      const { error: refreshErr } = await supabase.rpc('refresh_open_application', {
        p_event_slug: openSlug,
        p_phone: normalizedPhone,
        p_selected_date: dateStr || null,
        p_pickup_point_id: chosenPoint?.id ?? (selectedMeetingPoint || null),
        p_pickup_label: chosenPoint?.label ?? null,
        p_selected_city: selectedCity ?? null,
        p_ticket_count: allowsMultiTicket ? ticketCount : 1,
      });
      if (refreshErr) console.error('open application detail refresh failed:', refreshErr);

      // Open-event rule: the creator whose link is active at PAYMENT time wins.
      // The upsert above ignores conflicts, so a pre-existing (abandoned) row
      // keeps its old ref — re-attribute the latest session ref onto the UNPAID
      // row (incl. clearing it to founder's-own when there's no ref). The RPC
      // guards against advance_paid/fully_paid rows. Fire-and-forget.
      const { error: attrErr } = await supabase.rpc('attribute_open_application', {
        p_event_slug: openSlug,
        p_phone: normalizedPhone,
        p_code: affRef,
      });
      if (attrErr) console.error('open affiliate re-attribution failed:', attrErr);
    }

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
        // Per-ticket figures x the seats booked. This legacy mock-gateway receipt
        // isn't reachable for a group buy (multi-ticket needs payu-hosted, which
        // goes through PayU and PayUReturnScreen), but leaving a per-ticket total
        // sitting in a receipt table is a wrong number waiting to be believed.
        amount_paid: paymentContext.amount * (paymentContext.ticketCount ?? 1),
        payment_for: paymentContext.isBalancePayment ? 'Remaining Balance' : 'Advance',
        payment_mode: 'Mock BillDesk Gateway',
        status: 'successful',
        paid_on: paymentContext.issuedAt,
        remaining_balance: paymentContext.remainingBalance * (paymentContext.ticketCount ?? 1),
        balance_due: paymentContext.balanceDue,
      }, { onConflict: 'receipt_no' });
    setPaymentView('success');
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
            {!doubtSubmittedThisSession && (
            <button onClick={() => { setShowDoubtPopup(true); }} className="text-right px-5 py-3 bg-gray-200 text-black rounded-2xl text-sm font-medium hover:bg-gray-300 transition-all shadow-sm active:scale-[0.98] flex items-center gap-3 justify-end w-fit max-w-full relative overflow-hidden">
              <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: 0, ease: 'easeInOut' }} />
              <span className="truncate whitespace-normal text-left">{doubtCtaLabel}</span> <MessageCircle size={16} className="flex-shrink-0" />
            </button>
            )}
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
  const isPhoneValid = /^[6-9]\d{9}$/.test(detailsForm.phone);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(detailsForm.email.trim());
  const isGenderValid = !!detailsForm.gender;
  // Open (PayU) events collect email in-form (Google login removed) and always
  // require it. Gender is asked ONLY for girls-only events (female confirmation) —
  // regular chapter events drop it.
  const detailsFormGirlsOnly = !!(selectedEvent?.girlsOnly || hasGirlsOnlyQuickInfo(selectedEvent?.quickInfo));
  const isDetailsFormValid = isNameValid && isPhoneValid && tcAccepted && !ticketsExceedSpots && (!isPayUFlow || (isEmailValid && (!detailsFormGirlsOnly || isGenderValid)));

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
  // GalCode branding (name + photo) ONLY once the user has entered the doubt
  // flow — i.e. after pressing Book Now / Contact Us in the calendar sheet
  // (isAfterTripInfo = ASK_DOUBTS | SHOW_FAQ | DONE). The plan-selection steps
  // stay "chapter அ". Photo is zoomed 1.4x to match the invite-payment header.
  const showGalcodeHeader = isSelectedGirlsOnlyEvent && (isAfterTripInfo || inDoubtFlow);
  const chatHeaderProfile = showGalcodeHeader ? '/galcode_chat_profile.jpeg' : chatProfile;
  const chatHeaderProfileClass = showGalcodeHeader
    ? 'w-full h-full object-contain scale-[1.4]'
    : 'w-full h-full object-contain scale-[1.02] translate-y-[2px]';

  return (
    <div className="h-[100dvh] overflow-hidden bg-white sm:min-h-screen sm:h-auto sm:bg-gray-100 flex items-stretch sm:items-center justify-center p-0 sm:p-4 font-sans">
      {/* Debug readout — only ever rendered with ?dbg=1, so customers never see
          it. pointerEvents:none so it can't swallow a tap on the UI underneath,
          and the highest possible z-index so sheets don't cover it. Inline
          styles rather than Tailwind so nothing here depends on the build. */}
      {isDebugHud && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2147483647,
            pointerEvents: 'none', background: 'rgba(0,0,0,0.88)', color: '#4ade80',
            font: '11px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
            padding: '5px 7px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          }}
        >
          {`path=${typeof window === 'undefined' ? '?' : window.location.pathname}  armed=${isDetailsHistoryManaged ? 'YES' : 'NO'}${isPreviewMode ? ' (preview)' : ''}\nlayer=${activeHistoryLayer ?? 'none'}  len=${hudLen}  push=${hudPushes}  POPS=${hudPops}`}
          {/* Two probes for the same question: what does it take to make the
              Instagram chevron light up? It stays greyed out through any number
              of pushState entries, which is why back can never fire there.
                REAL NAV — a genuine document load (distinct URL, so it cannot be
                  collapsed into a reload). If the chevron wakes after this, the
                  in-app browser is tracking committed navigations only, and the
                  flow needs one real navigation in it.
                HASH — a same-document hash entry. Cheaper than a real load and
                  keeps the SPA intact, so if THIS wakes the chevron it is the
                  better fix and sheets should push hashes instead.
              pointerEvents are re-enabled just for these, since the strip itself
              is inert so it cannot swallow taps meant for the page. */}
          <div style={{ pointerEvents: 'auto', display: 'flex', gap: 6, marginTop: 5 }}>
            <a
              href={`${window.location.pathname}?dbg=1&n=${hudPushes}${hudPops}${hudLen}`}
              style={{ background: '#4ade80', color: '#000', padding: '3px 8px', borderRadius: 4, textDecoration: 'none', fontWeight: 700 }}
            >
              REAL NAV
            </a>
            <button
              type="button"
              onClick={() => { window.location.hash = `h${Date.now().toString().slice(-4)}`; }}
              style={{ background: '#fbbf24', color: '#000', padding: '3px 8px', borderRadius: 4, border: 0, font: 'inherit', fontWeight: 700 }}
            >
              HASH
            </button>
            {/* PUSH-URL — the one combination never tested, and the last thing
                that separates our sheets from BookMyShow's.
                  Our sheets pushState with window.location.href, i.e. an entry
                  whose URL is IDENTICAL to the current one, and Instagram never
                  lights the chevron for those. A hash change doesn't light it
                  either, and a real load lights it but is inert when pressed.
                  BookMyShow lights it by opening a sheet, first page in a fresh
                  tab, no page load involved — so a same-document entry CAN do
                  it. The untested variable is whether the entry needs a
                  genuinely different URL.
                Pushed straight from the tap, so it is also inside the user
                gesture. No reload: this is the same API our sheets already use,
                only with a distinct URL. */}
            <button
              type="button"
              onClick={() => {
                // No manual counter bump: the patched pushState above already
                // counts this, and bumping here too made one tap read as two.
                const n = Date.now().toString().slice(-4);
                window.history.pushState({ chapteraProbe: n }, '', `${window.location.pathname}?dbg=1&p=${n}`);
              }}
              style={{ background: '#60a5fa', color: '#000', padding: '3px 8px', borderRadius: 4, border: 0, font: 'inherit', fontWeight: 700 }}
            >
              PUSH-URL
            </button>
            {/* PUSH+REPL — push a DIFFERENT url, then immediately restore the
                original with replaceState.
                  Reconciles the two facts that otherwise contradict each other:
                  BookMyShow lights the chevron by opening a same-document
                  sheet, yet the URL copied with the sheet open is identical to
                  the one copied with it closed (verified by diffing two real
                  copies — same path, no hash, only inbound tracking params
                  differ). If the webview decides on chevron state at push time,
                  an entry created with a distinct URL would light it, and
                  replacing the URL back afterwards would leave nothing visible
                  or copyable behind.
                  Their Branch params being stripped between the two copies
                  proves they do call replaceState on themselves already.
                If this lights the chevron and PUSH-URL alone also does, prefer
                this one — it keeps our URLs clean. */}
            <button
              type="button"
              onClick={() => {
                const original = `${window.location.pathname}${window.location.search}`;
                const n = Date.now().toString().slice(-4);
                window.history.pushState({ chapteraProbe: n }, '', `${window.location.pathname}?dbg=1&r=${n}`);
                window.history.replaceState({ chapteraProbe: n }, '', original);
              }}
              style={{ background: '#f472b6', color: '#000', padding: '3px 8px', borderRadius: 4, border: 0, font: 'inherit', fontWeight: 700 }}
            >
              PUSH+REPL
            </button>
          </div>
        </div>
      )}
      <div className="w-full bg-white overflow-hidden flex flex-col h-[100dvh] sm:max-w-md sm:h-[85vh] relative sm:rounded-[2rem] sm:shadow-2xl sm:border-4 sm:border-white">

        {/* Header — not rendered under the event-details overlay, so it doesn't
            flash (incl. the galcode↔chapter swap) through during the back transition. */}
        {!showDetails && (
        <div className="bg-white p-4 flex items-center gap-3 z-10 relative">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-black shadow-md overflow-hidden p-1">
              <img src={chatHeaderProfile} alt="chat profile" className={chatHeaderProfileClass} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-lg tracking-tight text-black">{showGalcodeHeader ? 'galcode' : 'chapter அ'}</h1>
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
        )}

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
            dateCounts={dateCounts}
            closeCalendarSignal={closeDetailsCalendarSignal}
            onCalendarVisibilityChange={setDetailsCalendarOpen}
            closePlanSwitcherSignal={closeDetailsPlanSwitcherSignal}
            onPlanSwitcherVisibilityChange={setDetailsPlanSwitcherOpen}
            // Only hand over history control when we're actually managing it;
            // otherwise the overlay closes the switcher directly.
            onDismissPlanSwitcher={isDetailsHistoryManaged ? () => window.history.back() : undefined}
            closePolicySignal={closeDetailsPolicySignal}
            onPolicyVisibilityChange={setDetailsPolicyOpen}
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

        {/* Shared modal backdrop for booking timeline → details form.
            Keeping one mounted layer avoids the blur dipping during the handoff. */}
        <AnimatePresence>
          {(showBookingTimeline || showDetailsForm || paymentView === 'checkout') && (
            <motion.div
              key="booking-shared-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md z-40"
              onClick={() => {
                if (showDetailsForm) {
                  setShowDetailsForm(false);
                  setShowBookingTimeline(true);
                  return;
                }
                if (paymentView === 'checkout') {
                  setPaymentView('idle');
                  setShowDetailsForm(true);
                  return;
                }
                setShowBookingTimeline(false);
                if (selectedEvent) { setShowDetails(true); setShowChat(false); }
              }}
            />
          )}
        </AnimatePresence>

        {/* Booking Timeline Popup */}
        <AnimatePresence>
          {showBookingTimeline && selectedEvent && (
            <>
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
                      setShowChat(true);
                      setShowDetails(false);
                      setStep('ASK_DOUBTS');
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
                      {(() => {
                        const meetingPoint = journeyCardData?.meetingPoint || '';
                        const _cd3 = (selectedEvent as any).cityDetails?.[selectedCity];
                        const pricing = getMeetingPointPricing(selectedEvent, meetingPoint, selectedCity, _cd3?.price_full > 0 ? _cd3.price_full : undefined, _cd3?.price_advance > 0 ? _cd3.price_advance : undefined);
                        const priceStr = `₹${pricing.total.toLocaleString('en-IN')}`;
                        // Single-payment events charge the full price as the one payment, so
                        // {advance} resolves to the full price (the step's label stays editable).
                        const advanceStr = selectedEvent.paymentMode === 'full' ? priceStr : `₹${pricing.advance.toLocaleString('en-IN')}`;
                        const balanceStr = `₹${Math.max(pricing.total - pricing.advance, 0).toLocaleString('en-IN')}`;

                        // Social-proof count: (capacity * 3) + registered for the SELECTED date.
                        // Used to substitute the {application_count} placeholder in the
                        // social-proof booking_steps row's label. Per-date: only counts
                        // applicants who chose this date. Hidden until per-date counts load.
                        const capacity = (selectedEvent as any).totalCapacity;
                        const socialProofDate = bookingDate || selectedEvent?.dates?.[0]?.date || '';
                        const perDateRegistered = dateCounts && socialProofDate ? (dateCounts[socialProofDate]?.registered ?? 0) : null;
                        // A date with no key in dateCounts has genuinely nobody on it, so it
                        // must read 0 — falling back to the event-wide reservedCount here made
                        // a brand-new second date inherit the first date's social proof ("28 ppl
                        // have already joined" on a date with zero bookings). Every other
                        // dateCounts read in this file already treats a missing key as 0. The
                        // single-date open-full case that genuinely needs the event-wide number
                        // is covered by the Math.max just below.
                        const rawPerDateReserved = dateCounts && socialProofDate
                          ? (dateCounts[socialProofDate]?.reserved ?? 0)
                          : reservedCount;
                        const perDateReserved =
                          isPayUFlow && selectedEvent.paymentMode === 'full' && (selectedEvent.dates?.length ?? 0) <= 1
                            ? Math.max(Number(rawPerDateReserved ?? 0), Number(reservedCount ?? 0))
                            : rawPerDateReserved;
                        const socialProofCount =
                          isNativeApplicationFlow && typeof capacity === 'number' && capacity > 0 && perDateRegistered !== null
                            ? (capacity * 3) + perDateRegistered
                            : null;
                        // Joined-count social proof for open events. This used to require
                        // payment_mode='full' because open events were only ever single
                        // payment — which left open SPLIT events (pay at venue) with a
                        // bare event-date card and no "N going" line at all.
                        const openJoinedCount =
                          isPayUFlow && typeof capacity === 'number' && capacity > 0 && perDateReserved !== null
                            ? perDateReserved
                            : null;
                        const showOpenJoinedLabel =
                          openJoinedCount !== null
                          && typeof capacity === 'number'
                          && capacity > 0
                          && openJoinedCount / capacity >= 0.5;

                        const resolveValue = (v: string) => {
                          let out = (v || '')
                            .replace(/\{advance\}/gi, advanceStr)
                            .replace(/\{balance\}/gi, balanceStr)
                            .replace(/\{price\}/gi, priceStr);
                          if (socialProofCount !== null) {
                            out = out.replace(/\{application_count\}/gi, String(socialProofCount));
                          }
                          return out;
                        };

                        const selectedDateEntry = selectedEvent.dates.find(d => d.date === bookingDate);
                        const eventSteps = selectedDateEntry?.bookingSteps ?? selectedEvent.bookingSteps ?? (
                          isPayUFlow
                            // Open events pay immediately (no invitation step). Single-payment
                            // (3): Payment → Meeting Point Details (+ Event Date = yellow card).
                            // Split (4): Advance → Balance → Meeting Point Details (+ yellow card).
                            ? (selectedEvent.paymentMode === 'full'
                                ? [
                                    { label: 'settle payment', value: '{price}', date: '' },
                                    { label: "you'll receive exact", value: 'Meeting Spot Details 📍', date: '' },
                                  ]
                                : selectedEvent.payAtVenue
                                // Pay at venue tells a different story and MUST stay in step with
                                // AdminPanel's openDefaultSteps: advance → you're in the group chat
                                // → settle the rest in person. The meeting-spot row is dropped on
                                // purpose (details arrive in the chat the guest just joined). Balance
                                // stays third so booking_steps[2] still means "balance".
                                // A date whose booking_steps were never saved lands here, so this
                                // branch is what the customer sees — without it the admin editor
                                // and /plans showed two different timelines for the same date.
                                ? [
                                    { label: 'pay advance', value: '{advance}', date: '' },
                                    { label: "you'll receive", value: 'plan group-chat link', date: '' },
                                    { label: 'remaining balance', value: '{balance}', date: '' },
                                  ]
                                : [
                                    { label: 'Advance', value: '{advance}', date: '' },
                                    { label: 'Remaining Balance', value: '{balance}', date: '' },
                                    { label: "you'll receive", value: 'Meeting Point Details 📍', date: '' },
                                  ])
                            : (selectedEvent.paymentMode === 'full'
                                ? [
                                    { label: 'Entry Ticket', value: '{price}', date: '' },
                                    { label: 'Receive', value: 'Pickup, stay & trip details', date: '' },
                                  ]
                                : selectedEvent.payAtVenue
                                // Invite + pay at venue, mirroring AdminPanel's
                                // nativeDefaultSteps: the group chat replaces the
                                // pickup/trip-details promise, and the balance is settled
                                // in person. Same twin-fallback trap as the open branch
                                // above — an unsaved timeline here used to promise trip
                                // details the pay-at-venue story never delivers.
                                ? [
                                    { label: selectedEvent.inviteOnly ? 'Sign Up' : 'Advance', value: selectedEvent.inviteOnly ? 'Free — no payment yet' : '{advance}', date: '' },
                                    { label: "you'll receive", value: 'plan group-chat link', date: '' },
                                    { label: 'Remaining Balance', value: '{balance}', date: '' },
                                  ]
                                : [
                                    { label: selectedEvent.inviteOnly ? 'Sign Up' : 'Advance', value: selectedEvent.inviteOnly ? 'Free — no payment yet' : '{advance}', date: '' },
                                    { label: 'Remaining Balance', value: '{balance}', date: '' },
                                    { label: 'Receive', value: 'Pickup, stay & trip details', date: '' },
                                  ])
                        );

                        // Invite timelines opt into their social-proof/event-date row with
                        // {application_count}. An open single-payment event is simpler: its
                        // final stored row is always the event-date card, so the admin never
                        // has to configure a hidden marker for it.
                        const isOpenSingleTimeline = isPayUFlow && selectedEvent.paymentMode === 'full';
                        let socialProofIdx = -1;
                        for (let i = eventSteps.length - 1; i >= 0; i--) {
                          if ((eventSteps[i].label || '').includes('{application_count}')) { socialProofIdx = i; break; }
                        }
                        if (socialProofIdx < 0 && isOpenSingleTimeline && eventSteps.length >= 3) {
                          socialProofIdx = eventSteps.length - 1;
                        }
                        const displayEventSteps = isPayUFlow && selectedEvent.paymentMode === 'full'
                          ? eventSteps.map((step: any, i: number) => {
                              const text = `${step.label ?? ''} ${step.value ?? ''}`;
                              if (i === 0 || /\{price\}|payment|settle/i.test(text)) {
                                return { ...step, label: 'settle payment', value: '{price}' };
                              }
                              if (i === 1 || /receive|meeting/i.test(text)) {
                                return { ...step, label: "you'll receive exact", value: 'Meeting Spot Details 📍' };
                              }
                              return step;
                            })
                          : eventSteps;

                        const socialProofRow = socialProofIdx >= 0 ? displayEventSteps[socialProofIdx] : null;
                        const steps = (socialProofIdx >= 0 ? displayEventSteps.filter((_: any, i: number) => i !== socialProofIdx) : displayEventSteps)
                          // Single-payment events have no remaining-balance step.
                          .filter((s: any) => selectedEvent.paymentMode === 'full' ? !/balance/i.test(`${s.label} ${s.value}`) : true)
                          // Open events pay immediately — there is no application step. Steps
                          // left over from an invite-era flow (or copied from an invite event)
                          // still carry a "vibe check / Request Invitation" row, which would
                          // otherwise render on a flow that has no invitation at all.
                          .filter((s: any) => isPayUFlow ? !/vibe.?check|request.?invitation/i.test(`${s.label} ${s.value}`) : true)
                          // Drop blank rows (no label and no value) — stale/empty steps from an
                          // earlier save must never render as an empty numbered step.
                          .filter((s: any) => String(s?.label ?? '').trim() !== '' || String(s?.value ?? '').trim() !== '');

                        const yellowTitle = isOpenSingleTimeline
                          ? selectedEvent.title
                          : socialProofRow?.value ? resolveValue(socialProofRow.value) : selectedEvent.title;
                        const yellowDateStr = isOpenSingleTimeline
                          ? bookingDate || selectedEvent.dates?.[0]?.date || ''
                          : (socialProofRow?.date) || bookingDate || selectedEvent.dates?.[0]?.date || '';
                        const yellowSocialLabel = !isOpenSingleTimeline && socialProofRow && socialProofCount !== null
                          ? resolveValue(socialProofRow.label || '')
                          : showOpenJoinedLabel
                          ? `${openJoinedCount} ppl have already joined`
                          : '';

                        return (
                          <>
                            {/* All booking steps — index 0 = "Now" row, rest = deadline rows */}
                            {steps.map((step: any, si: number) => {
                              const isNowRow = si === 0;
                              const stepValue = resolveValue(step.value || '');
                              const dateLabel = !isNowRow && step.date
                                ? `by ${new Date(`${step.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                : null;
                              // The payment row has no meaningful pre-invite deadline — the
                              // customer only pays after being invited — so show "After Invitation"
                              // in place of the date (same gray pill styling). Applies to the
                              // single-payment row ({price}) and, for invite-only events, the
                              // advance row ({advance}).
                              // Open events pay immediately, so they never show the
                              // invite-only "After Invitation" pill.
                              const isAfterInviteRow = !isNowRow
                                && !isPayUFlow
                                && /\{advance\}|\{price\}/i.test(step.value || '')
                                && (selectedEvent.paymentMode === 'full' || selectedEvent.inviteOnly);
                              // Pay at venue: the balance has no deadline — it's settled in person
                              // at the event. Same pill slot as "After Invitation", so the row never
                              // renders bare. Checked before dateLabel so a date left over from
                              // before the toggle was switched on can't win.
                              const isVenueBalanceRow = !isNowRow
                                && !!selectedEvent.payAtVenue
                                && selectedEvent.paymentMode !== 'full'
                                && /\{balance\}/i.test(step.value || '');
                              // Pay-at-venue timelines promise the group chat right after the
                              // advance — that's the trust step that makes paying the rest in
                              // person feel safe. It has no date, so it needs its own pill.
                              // Hyphen is optional in the matcher: the row reads "plan group-chat
                              // link", and a plain /group\s?chat/ would silently miss it, dropping
                              // both the WhatsApp icon and the "After Advance" pill.
                              const isGroupChatRow = !isNowRow
                                && !!selectedEvent.payAtVenue
                                && /group[\s-]?chat/i.test(`${step.label} ${step.value}`);
                              return (
                                <div key={si} className="px-5 py-3 flex items-center justify-between border-b border-black/5">
                                  <div>
                                    <p className="text-[11px] text-gray-400 font-medium mb-0.5">{step.label}</p>
                                    <p className="text-[15px] font-black text-gray-900 leading-none flex items-center gap-1.5">
                                      {stepValue}
                                      {isGroupChatRow && <WhatsAppGlyph />}
                                    </p>
                                  </div>
                                  {isNowRow ? (
                                    <span className="text-[11px] font-semibold text-[#34C759] bg-[#34C759]/10 border border-[#34C759]/30 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                                      Now
                                    </span>
                                  ) : isAfterInviteRow ? (
                                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                                      After Invitation
                                    </span>
                                  ) : isGroupChatRow ? (
                                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                                      After Advance
                                    </span>
                                  ) : isVenueBalanceRow ? (
                                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                                      At the Venue
                                    </span>
                                  ) : dateLabel ? (
                                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                                      {dateLabel}
                                    </span>
                                  ) : null}
                                </div>
                              );
                            })}

                            {/* Prize row — social-proof copy (driven by booking_steps), event title, and date */}
                            <div className="px-5 py-4 flex items-end justify-between bg-[#FFD700]/10">
                              <div>
                                {yellowSocialLabel ? (
                                  <p className="text-[11px] text-gray-400 font-medium mb-0.5 flex items-center gap-1">
                                    <Users size={11} className="flex-shrink-0" />
                                    {yellowSocialLabel}
                                  </p>
                                ) : null}
                                <p className="text-[15px] font-black text-gray-900 leading-tight">{yellowTitle}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                                {yellowDateStr ? (
                                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-black bg-[#FFD700] border border-[#d4af37] font-black">
                                    {new Date(`${yellowDateStr}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="px-6 pb-8">
                    {isNativeApplicationFlow ? (
                      <>
                        <button
                          onClick={() => { trackEvent('application_started', { city: formatCityLabel(selectedCity), category: selectedCategory || selectedEvent?.category, event_id: selectedEvent?.id, event_title: selectedEvent?.title }); setShowBookingTimeline(false); setAppFormSubmitted(false); setAppFormData({ name: '', phone: '', gender: '', email: '', whyJoin: '' }); setShowApplicationForm(true); }}
                          className="w-full py-[17px] rounded-2xl bg-[#FFD700] text-black font-black text-[17px] flex items-center justify-center gap-2.5 active:scale-95 transition-all relative overflow-hidden"
                        >
                          <motion.div className="absolute inset-0 -skew-x-12 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.9, delay: 10, repeat: Infinity, repeatDelay: 8, ease: 'easeInOut' }} />
                          {selectedEvent.ctaLabel || 'Request Invitation'}
                          <ArrowRight size={18} strokeWidth={3.0} />
                        </button>
                      </>
                    ) : selectedEvent.inviteOnly && !isPayUFlow ? (
                      <button
                        onClick={() => {
                          trackEvent('external_redirect_initiated', { city: formatCityLabel(selectedCity), category: selectedCategory || selectedEvent?.category, event_id: selectedEvent?.id, event_title: selectedEvent?.title });
                          // New tab (no opener — bookingUrl is admin-configurable, so treat
                          // it like any third-party link and prevent tabnabbing) in a real
                          // browser; same-tab hop inside Instagram, where window.open is
                          // routinely swallowed and the button would do nothing.
                          openExternalUrl(selectedEvent.bookingUrl);
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
                          // See comment above on the invite-only path.
                          if (selectedEvent.bookingUrl) openExternalUrl(selectedEvent.bookingUrl);
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
                variants={{
                  hidden: { y: '100%', transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } },
                  visible: { y: 0, transition: { type: 'spring', damping: 32, stiffness: 300 } },
                }}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute bottom-0 left-0 right-0 z-[60] bg-white rounded-t-[2rem]"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailsForm(false);
                    setShowBookingTimeline(true);
                  }}
                  className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
                <AnimatePresence mode="wait">

                  {/* ── Details form (single step → checkout) ── */}
                  <motion.div
                      key="details"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col"
                    >
                      {(!existingBooking || forceNewBooking) && (
                      <div className="px-6 pt-6 pb-5 flex-shrink-0">
                        <p className="text-[17px] text-gray-900 leading-snug text-left">
                          We have one life... <span className="font-black">so why not?</span>
                        </p>
                      </div>
                      )}

                      <div className="px-6 space-y-3">

                        {/* Google-account booking hint. A second ticket still needs a different phone. */}
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
                              onClick={() => {
                                setForceNewBooking(true);
                                setDetailsForm(f => ({ ...f, phone: '' }));
                              }}
                              className="w-full text-center py-3 rounded-xl bg-[#34C759] text-white text-[13px] font-bold active:opacity-80 transition-all"
                            >
                              Use a Different Number
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

                        {/* Details — Google login removed; the open flow now collects
                            name/phone and (open/PayU events) gender + email directly. */}
                        {(!existingBooking || forceNewBooking) && (
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
                                onChange={e => {
                                  resetOpenOtp();
                                  setDetailsForm({ ...detailsForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) });
                                }}
                                placeholder="We'll reach you here"
                                className="w-full bg-transparent text-[17px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
                                inputMode="tel"
                              />
                            </div>

                            {isPayUFlow && (
                              <>
                                {/* Gender — girls-only events only (female confirmation).
                                    Regular chapter events don't collect it. */}
                                {detailsFormGirlsOnly && (
                                  <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3 relative">
                                    <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest block mb-0.5">I confirm that I'm Female</label>
                                    <select
                                      value={detailsForm.gender}
                                      onChange={e => setDetailsForm({ ...detailsForm, gender: e.target.value })}
                                      className={`w-full bg-transparent text-[17px] focus:outline-none appearance-none cursor-pointer pr-6 ${detailsForm.gender ? 'text-gray-900' : 'text-gray-300'}`}
                                    >
                                      <option value="" disabled>Select option</option>
                                      <option value="Female">Female</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 bottom-3.5 text-gray-400 pointer-events-none" />
                                  </div>
                                )}

                                <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest">Email</label>
                                    {detailsForm.email.length > 0 && !isEmailValid && (
                                      <span className="text-[11px] text-amber-500 font-medium">Invalid</span>
                                    )}
                                  </div>
                                  <input
                                    type="email"
                                    value={detailsForm.email}
                                    onChange={e => setDetailsForm({ ...detailsForm, email: e.target.value })}
                                    placeholder="Booking updates are sent here"
                                    className="w-full bg-transparent text-[17px] text-gray-900 placeholder:text-gray-300 focus:outline-none"
                                    inputMode="email"
                                    autoCapitalize="off"
                                    autoCorrect="off"
                                  />
                                </div>

                                {/* Group buy. Everything stays under this one
                                    number — we deliberately never collect the
                                    friends' numbers, so there is one point of
                                    contact and one group-chat invite. */}
                                {/* Group buy. Outlined rather than filled, so it
                                    reads as an action next to the filled input
                                    fields — same treatment as the OTP block
                                    below. Deliberately carries no caption: a
                                    disabled control says "you're at the limit"
                                    without a line of copy. */}
                                {allowsMultiTicket && (
                                  <div className={`bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3 flex items-center justify-between gap-3 transition-shadow ${
                                    ticketsExceedSpots ? 'ring-1 ring-red-500' : ''
                                  }`}>
                                    {/* Built as a form field like the ones above
                                        it: permanent label, and a line beneath
                                        that always reads as placeholder guidance —
                                        it describes the choice rather than echoing
                                        it, since the number itself is already
                                        right there in the stepper. Red is reserved
                                        for the one case that blocks them.
                                        Truncated rather than wrapped so the card
                                        can never change height on a narrow phone. */}
                                    <div className="min-w-0">
                                      <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest block mb-0.5">Tickets</span>
                                      <p className={`text-[17px] truncate ${
                                        ticketsExceedSpots ? 'text-red-500' : 'text-gray-300'
                                      }`}>
                                        {ticketsExceedSpots
                                          ? (spotsLeftForTickets === 0
                                              ? 'Date sold out'
                                              : `Only ${spotsLeftForTickets} ${spotsLeftForTickets === 1 ? 'spot' : 'spots'} left`)
                                          : ticketCount > 1
                                            ? `You + ${ticketCount - 1} ${ticketCount - 1 === 1 ? 'friend' : 'friends'}`
                                            : 'Most people join solo'}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3.5 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setTicketCount(n => Math.max(1, n - 1))}
                                        disabled={ticketCount <= 1}
                                        aria-label="One ticket fewer"
                                        className={`w-[30px] h-[30px] rounded-[9px] border text-[17px] leading-none flex items-center justify-center transition-all ${
                                          ticketCount <= 1
                                            ? 'border-gray-200 text-gray-400 bg-white'
                                            : 'border-gray-300 text-gray-900 bg-white active:scale-95'
                                        }`}
                                      >
                                        −
                                      </button>
                                      <span className="text-[17px] font-medium text-gray-900 min-w-[12px] text-center tabular-nums">
                                        {ticketCount}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setTicketCount(n => Math.min(maxTickets, n + 1))}
                                        disabled={ticketCount >= maxTickets}
                                        aria-label="One ticket more"
                                        className={`w-[30px] h-[30px] rounded-[9px] border text-[17px] leading-none flex items-center justify-center transition-all ${
                                          ticketCount >= maxTickets
                                            ? 'border-gray-200 text-gray-400 bg-white'
                                            : 'border-gray-300 text-gray-900 bg-white active:scale-95'
                                        }`}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {openOtpSession && (
                                  <div className="rounded-2xl border border-gray-200 bg-white px-4 pt-3 pb-4">
                                    <p className="text-[13px] text-gray-500 leading-snug">Enter 6-digit code sent to {openOtpDelivery === 'email' ? detailsForm.email.trim() : detailsForm.phone}</p>
                                    <div className="mt-3 flex justify-between gap-2">
                                      {openOtpDigits.map((digit, index) => (
                                        <input
                                          key={index}
                                          ref={node => { openOtpInputsRef.current[index] = node; }}
                                          value={digit}
                                          type="text"
                                          inputMode="numeric"
                                          autoComplete={index === 0 ? 'one-time-code' : 'off'}
                                          maxLength={1}
                                          disabled={verifyingOpenOtp || openOtpAttemptsExhausted}
                                          onChange={e => {
                                            const nextDigit = e.target.value.replace(/\D/g, '').slice(-1);
                                            setOpenOtpDigits(previous => previous.map((value, itemIndex) => itemIndex === index ? nextDigit : value));
                                            if (nextDigit && index < 5) openOtpInputsRef.current[index + 1]?.focus();
                                          }}
                                          onKeyDown={e => {
                                            if (e.key === 'Backspace' && !digit && index > 0) openOtpInputsRef.current[index - 1]?.focus();
                                          }}
                                          onPaste={e => {
                                            const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                                            if (!pasted) return;
                                            e.preventDefault();
                                            setOpenOtpDigits(Array.from({ length: 6 }, (_, itemIndex) => pasted[itemIndex] ?? ''));
                                            openOtpInputsRef.current[Math.min(pasted.length, 5)]?.focus();
                                          }}
                                          className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-[#F2F2F7] text-center text-[19px] font-black text-gray-900 outline-none transition-colors focus:border-gray-500 focus:ring-2 focus:ring-gray-300/50 disabled:opacity-60"
                                          aria-label={`OTP digit ${index + 1}`}
                                        />
                                      ))}
                                    </div>
                                    <div className="mt-3 space-y-1.5">
                                      {openBookingCheckError && (
                                        <p className="text-[12px] font-normal leading-snug text-red-500">{openBookingCheckError}</p>
                                      )}
                                      <div className="min-h-5 text-[13px] leading-snug">
                                        {openOtpDelivery === 'whatsapp' ? (
                                          !sendingOpenOtp && (
                                            <button
                                              type="button"
                                              onClick={() => requestOpenEventOtp('email')}
                                              disabled={verifyingOpenOtp || openOtpEmailWaitSeconds > 0 || !isEmailValid}
                                              className={`text-left leading-snug disabled:cursor-not-allowed ${
                                                openOtpEmailWaitSeconds > 0
                                                  ? 'text-[12px] font-medium text-gray-400'
                                                  : 'text-[13px] font-medium'
                                              }`}
                                            >
                                              {openOtpEmailWaitSeconds > 0 ? (
                                                `Resend OTP (${openOtpEmailWaitSeconds} seconds)`
                                              ) : (
                                                <>
                                                  <span className={`font-normal ${verifyingOpenOtp || !isEmailValid ? 'text-gray-400' : 'text-gray-500'}`}>Didn't Receive Code?</span>{' '}
                                                  <span className={verifyingOpenOtp || !isEmailValid ? 'text-gray-400' : 'text-gray-900 underline'}>Get OTP on Email</span>
                                                </>
                                              )}
                                            </button>
                                          )
                                        ) : (
                                          <span className="text-gray-500">
                                            Need Help?{' '}
                                            <a
                                              href={`https://wa.me/919940111564?text=${encodeURIComponent(`I'm trying to book a slot for ${selectedEvent?.title ?? 'this event'}, I need help with OTP`)}`}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-gray-900 underline font-medium"
                                            >
                                              Contact Us
                                            </a>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        )}

                        {(!existingBooking || forceNewBooking) && (
                        <div className="flex items-center gap-3 select-none pt-1">
                          <div
                            onClick={() => setTcAccepted(!tcAccepted)}
                            className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all cursor-pointer ${tcAccepted ? 'bg-[#F2F2F7] border-[#F2F2F7]' : 'bg-white border-gray-400'}`}
                          >
                            {tcAccepted && (
                              <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                                <path d="M1 4L4 7L10 1" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                        {openBookingCheckError && !openOtpSession && (
                          <p className="mb-3 text-center text-[13px] leading-relaxed text-red-500">{openBookingCheckError}</p>
                        )}
                        <button
                          type="button"
                          disabled={!isDetailsFormValid || checkingOpenBooking || sendingOpenOtp || verifyingOpenOtp || openOtpAttemptsExhausted}
                          onClick={isPayUFlow ? (openOtpSession ? verifyOpenEventOtpAndProceed : () => requestOpenEventOtp('whatsapp')) : handleProceedToPhonePe}
                          className={`w-full min-h-[58px] py-[17px] rounded-2xl text-[17px] font-black flex items-center justify-center gap-2.5 transition-all relative overflow-hidden ${
                            isDetailsFormValid && !checkingOpenBooking && !sendingOpenOtp && !verifyingOpenOtp && !openOtpAttemptsExhausted ? 'bg-[#FFD700] text-black active:scale-95' : 'bg-[#F2F2F7] text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {isDetailsFormValid && !checkingOpenBooking && !sendingOpenOtp && !verifyingOpenOtp && (
                            <motion.div className="absolute inset-0 -skew-x-12 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.9, delay: 10, repeat: Infinity, repeatDelay: 8, ease: 'easeInOut' }} />
                          )}
                          {checkingOpenBooking || sendingOpenOtp || verifyingOpenOtp ? (
                            <span className="flex items-center gap-1.5" role="status" aria-label="Loading">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.1s]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                            </span>
                          ) : (
                            <>
                              <span>{isPayUFlow ? (openOtpSession ? 'Continue to Payment' : 'Get OTP') : 'Continue to Payment'}</span>
                              <ArrowRight size={18} strokeWidth={2.5} />
                            </>
                          )}
                        </button>
                      </div>
                      )}
                    </motion.div>

                </AnimatePresence>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Open-event duplicate booking result — shown before a bill can open. */}
        <AnimatePresence>
          {showDetailsForm && openAlreadyPaid && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[65] bg-black/40 backdrop-blur-md"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[2rem] px-6 pt-8 pb-8"
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenAlreadyPaid(false);
                    resetOpenOtp();
                    setDetailsForm(f => ({ ...f, phone: '' }));
                  }}
                  className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                  aria-label="Close and use a different number"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
                <div className="flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl">👋</div>
                  <p className="text-[20px] font-black text-gray-900">
                    {alreadyPaidTickets > 1 ? 'Spots Already Reserved!' : 'Spot Already Reserved!'}
                  </p>
                  <p className="text-[14px] text-gray-500 leading-relaxed max-w-[310px]">
                    {alreadyPaidTickets > 1
                      ? `You've already booked ${alreadyPaidTickets} tickets for this event with this WhatsApp number.`
                      : 'A payment has already been made for this event with this WhatsApp number.'}
                  </p>
                  {/* No self-serve top-up by decision — a second charge on a
                      paid number is exactly what the server guard stops. */}
                  <p className="text-[14px] text-gray-500 leading-relaxed max-w-[310px]">
                    Need {alreadyPaidTickets > 1 ? 'more tickets' : 'another ticket'}? Please use a different WhatsApp number.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenAlreadyPaid(false);
                      resetOpenOtp();
                      setDetailsForm(f => ({ ...f, phone: '' }));
                    }}
                    className="mt-2 w-full py-4 rounded-2xl bg-[#FFD700] text-black font-black text-[16px] active:scale-95 transition-all"
                  >
                    Use a Different Number
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Community Event Sheet (free recurring events) ────────── */}
        <AnimatePresence>
          {communityEvent && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-[55] bg-black/40 backdrop-blur-md"
                onClick={() => setCommunityEvent(null)}
              />
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 z-[56] bg-white rounded-t-[2rem] flex flex-col"
              >
                {/* Frosted close button floating above sheet */}
                <button
                  onClick={() => setCommunityEvent(null)}
                  className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
                <div className="px-6 pt-7 pb-8 overflow-y-auto">
                  {/* Headline quote — same treatment as the application sheet */}
                  <p className="text-[17px] text-gray-900 leading-snug text-left">We all start as strangers... <span className="font-black">until we meet.</span></p>

                  {/* The Essentials — same design as the invite-flow Journey card,
                      minus the Transport block. Meeting Spot = start_location,
                      You'll Meet = description, date tile = first event date,
                      time = timing column. */}
                  {(() => {
                    const meetingSpot = communityEvent.startLocation || '';
                    const youllMeet   = communityEvent.description || '';
                    const timeStr     = communityEvent.timing || '';
                    const dateStr     = communityEvent.dates?.[0]?.date || '';
                    const d       = dateStr ? new Date(dateStr + 'T00:00:00') : null;
                    const day     = d ? d.getDate().toString() : '';
                    const month   = d ? d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '';
                    const weekday = d ? d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() : '';
                    if (!meetingSpot && !youllMeet && !d) return null;
                    return (
                      <div className="mt-5">
                        <p className="text-[10px] font-bold text-[#2C7FFF] uppercase tracking-widest mb-2 px-1">The Essentials</p>
                        <div className="border border-dashed border-[#2C7FFF] rounded-2xl overflow-hidden bg-white">
                          <div className="flex">
                            <div className="flex-1 flex flex-col">
                              {meetingSpot && (
                                <div className={`px-4 py-3 ${youllMeet ? 'border-b border-dashed border-[#D4E5FF]' : ''}`}>
                                  <div className="flex items-center gap-1 mb-1">
                                    <MapPin size={9} className="text-gray-400" />
                                    <span className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider">Meeting Spot</span>
                                  </div>
                                  <span className="text-[13px] font-black text-gray-900 leading-tight">{meetingSpot}</span>
                                </div>
                              )}
                              {youllMeet && (
                                <div className="px-4 py-3">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Users size={9} className="text-gray-400" />
                                    <span className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider">You'll Meet</span>
                                  </div>
                                  <span className="text-[13px] font-black text-gray-900 leading-tight">{youllMeet}</span>
                                </div>
                              )}
                            </div>
                            {d && (
                              <div className="border-l border-dashed border-[#D4E5FF] flex flex-col items-center justify-center px-5 py-4 bg-white gap-0.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{weekday}</span>
                                <span className="text-[44px] font-black text-gray-900 leading-none">{day}</span>
                                <span className="text-[14px] font-black text-gray-900 leading-tight">{month}</span>
                                {timeStr && <span className="text-[13px] font-bold text-gray-900 mt-1.5">{timeStr}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Join button */}
                  <button
                    onClick={() => {
                      trackEvent('community_whatsapp_clicked', { event_id: communityEvent.id, event_title: communityEvent.title });
                      openExternalUrl(communityEvent.bookingUrl);
                    }}
                    className="mt-6 w-full bg-[#25D366] text-white font-black text-[16px] rounded-2xl py-4 flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform shadow-lg shadow-[#25D366]/25"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.241-.579-.486-.5-.668-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Join WhatsApp Community
                  </button>
                </div>
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
                className="absolute bottom-0 left-0 right-0 z-[56] bg-white rounded-t-[2rem] flex flex-col max-h-[90dvh]"
              >
                {/* Frosted close button floating above sheet */}
                <button
                  onClick={() => { setShowApplicationForm(false); setShowBookingTimeline(true); }}
                  className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
                {/* Header — hidden on the success screen. GalCode events get their own line. */}
                {!appFormSubmitted && (
                  <div className="px-6 pt-6 pb-5 flex-shrink-0">
                    {selectedEvent.girlsOnly ? (
                      <p className="text-[17px] text-gray-900 leading-snug text-left">This plan is reserved for <span className="font-black">girlies-only.</span></p>
                    ) : (
                      <p className="text-[17px] text-gray-900 leading-snug text-left">Not everyone gets in — but the right people <span className="font-black">always do.</span></p>
                    )}
                  </div>
                )}
                <ApplicationForm
                  event={selectedEvent}
                  selectedDate={bookingDate || selectedEvent?.dates?.[0]?.date}
                  selectedPickupId={journeyCardData?.meetingPoint}
                  selectedCity={selectedCity || undefined}
                  reservedCount={reservedCount}
                  step={1}
                  form={appFormData}
                  setForm={setAppFormData}
                  onNext={() => {}}
                  onBack={() => { setShowApplicationForm(false); setShowBookingTimeline(true); }}
                  onClose={() => { setShowApplicationForm(false); setShowBookingTimeline(true); }}
                  onSubmitted={() => setAppFormSubmitted(true)}
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
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  <TermsContent />
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

        {/* Bill page — the exact same review/pay screen as the invite flow
            (shared PaymentOverlay). Open flow is now: details form → bill page →
            PayU, mirroring invite. The bill collects the payment method + fee and
            calls create-payu-order itself; payment_type drives full vs advance. */}
        <AnimatePresence>
          {paymentView === 'checkout' && paymentContext && paymentContext.phonepeUrl === 'payu-hosted' && (() => {
            const isBalance = !!paymentContext.isBalancePayment;
            const isFull = selectedEvent?.paymentMode === 'full' && !isBalance;
            const billPaymentType = isBalance ? 'balance' : (isFull ? 'full' : 'advance');
            // For a single-payment (full) event the bill shows the full price as
            // "Entry Ticket"; for split it shows the advance (or the balance). The
            // server recomputes the real charge from the DB regardless.
            const billBase = isFull ? (paymentContext.amount + paymentContext.remainingBalance) : paymentContext.amount;
            return (
              <NativePaymentOverlay
                eventTitle={paymentContext.eventTitle}
                eventDate={paymentContext.tripDateFull}
                priceAdvance={billBase}
                paymentType={billPaymentType}
                prefillName={paymentContext.name}
                prefillPhone={paymentContext.phone}
                prefillEmail={paymentContext.email ?? ''}
                lockEmail={!!paymentContext.email}
                eventSlug={paymentContext.eventId}
                selectedCity={paymentContext.selectedCity ?? ''}
                otpSession={paymentContext.otpSession ?? ''}
                ticketCount={paymentContext.ticketCount ?? 1}
                onClose={() => {
                  setPaymentView('idle');
                  setShowDetailsForm(true);
                }}
                // The bill's nested sheets get real history entries via the
                // layer stack, so back closes the sheet the customer is looking
                // at instead of the bill underneath it. Dismiss goes through
                // history.back() so the entry is consumed rather than stranded.
                activeSubsheet={paymentSubsheet}
                onOpenSubsheet={setPaymentSubsheet}
                onDismissSubsheet={() => window.history.back()}
              />
            );
          })()}
        </AnimatePresence>

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
                      <p className="mt-0.5 text-[14px] font-black text-gray-900">
                        {paymentContext.isBalancePayment ? 'Remaining Balance' : 'Advance'}
                        {(paymentContext.ticketCount ?? 1) > 1 && (
                          <span className="text-gray-400"> × {paymentContext.ticketCount}</span>
                        )}
                      </p>
                    </div>
                    <p className="text-[22px] font-black text-gray-950 leading-none">{formatINR(paymentContext.amount * (paymentContext.ticketCount ?? 1))}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-[#F7F7F8] px-4 py-3">
                    <p className="text-[12px] font-semibold text-gray-500">Payment Mode</p>
                    <p className="text-[12px] font-black text-gray-900">Mock BillDesk Gateway</p>
                  </div>
                  <div className="flex items-start justify-between gap-3 border-t border-black/5 pt-3">
                    <p className="text-[12px] font-semibold text-gray-500">Balance Due</p>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-gray-800">{formatINR(paymentContext.remainingBalance * (paymentContext.ticketCount ?? 1))}</p>
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
                onClick={() => { setShowDoubtPopup(false); setDoubtFormData({ name: '', phone: '', email: '', gender: '', message: '', whyJoin: '' }); }}
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
                  onClick={() => { setShowDoubtPopup(false); setDoubtFormData({ name: '', phone: '', email: '', gender: '', message: '', whyJoin: '' }); }}
                  className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                  aria-label="Close doubt form"
                >
                  <X size={14} />
                </button>

                {/* ── FORM VIEW: default ── */}
                <>
                <div className="relative px-6 pt-4 pb-4">
                  <p className="text-[24px] font-black text-gray-900 tracking-tight leading-tight">What's the Matter? 🤠</p>
                </div>

                <form onSubmit={handleDoubtSubmit}>
                  <div className="px-6 space-y-3">
                    <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
                      <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest block mb-0.5">Name</label>
                      <input
                        type="text"
                        required
                        value={doubtFormData.name}
                        onChange={e => setDoubtFormData({...doubtFormData, name: e.target.value})}
                        placeholder="What should we call you"
                        className="w-full bg-transparent text-[16px] font-semibold text-gray-900 placeholder-gray-300 focus:outline-none"
                      />
                    </div>

                    <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest">WhatsApp Number</label>
                        {doubtFormData.phone.length > 0 && doubtFormData.phone.length < 10 && (
                          <span className="text-[11px] text-amber-500 font-medium">Invalid Number</span>
                        )}
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        required
                        maxLength={10}
                        value={doubtFormData.phone}
                        onChange={e => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setDoubtFormData({...doubtFormData, phone: digits});
                        }}
                        placeholder="We'll reach you here"
                        className="w-full bg-transparent text-[16px] font-semibold text-gray-900 placeholder-gray-300 focus:outline-none"
                      />
                    </div>

                    <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
                      <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest block mb-0.5">Email</label>
                      <input
                        type="email"
                        inputMode="email"
                        required
                        value={doubtFormData.email}
                        onChange={e => setDoubtFormData({...doubtFormData, email: e.target.value.slice(0, 100)})}
                        placeholder="You'll get booking updates here"
                        className="w-full bg-transparent text-[16px] font-semibold text-gray-900 placeholder-gray-300 focus:outline-none"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                    </div>

                    <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
                      <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest block mb-0.5">Your Doubt</label>
                      <input
                        type="text"
                        required
                        value={doubtFormData.message}
                        onChange={e => setDoubtFormData({...doubtFormData, message: e.target.value})}
                        placeholder="What's the doubt"
                        className="w-full bg-transparent text-[16px] font-semibold text-gray-900 placeholder-gray-300 focus:outline-none"
                      />
                    </div>

                    {!isPayUFlow && (
                      <div className="bg-[#F2F2F7] rounded-2xl px-4 pt-2 pb-3">
                        <label className="text-[11px] text-gray-500 font-semibold uppercase tracking-widest block mb-0.5">Why do you want to join us?</label>
                        <input
                          type="text"
                          required
                          value={doubtFormData.whyJoin}
                          onChange={e => setDoubtFormData({...doubtFormData, whyJoin: e.target.value})}
                          placeholder="Tell us why this plan excites you..."
                          className="w-full bg-transparent text-[16px] font-semibold text-gray-900 placeholder-gray-300 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>


                  <div className="px-6 pt-4 pb-5">
                    <button
                      type="submit"
                      disabled={!doubtFormData.name.trim() || doubtFormData.phone.length !== 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doubtFormData.email.trim()) || !doubtFormData.message.trim() || (!isPayUFlow && !doubtFormData.whyJoin.trim())}
                      className="w-full bg-[#FFD700] text-black font-semibold py-[17px] rounded-2xl text-[17px] transition-colors active:opacity-80 relative overflow-hidden disabled:opacity-50"
                    >
                      <motion.div
                        className="absolute inset-0 -skew-x-12 pointer-events-none"
                        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
                        animate={{ x: ['-100%', '300%'] }}
                        transition={{ delay: 10, duration: 0.8, repeat: Infinity, repeatDelay: 7.0, ease: 'easeInOut' }}
                      />
                      <span className="relative z-10">Send Message</span>
                    </button>
                  </div>
                </form>
                </>
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

const JourneyCard = ({ event, startDate, meetingPoint }: { event: Event; city: string; startDate: string; meetingPoint?: string }) => {
  // Essentials card source of truth = pickup_points. We deliberately do NOT
  // read from event.quickInfo (the "Plan card" admin field) or cityDetails —
  // admins editing the pickup points should never have to also sync a parallel
  // free-text copy. Every event is guaranteed to have at least one pickup point.
  //
  // Resolution: prefer the user's chosen pickup; otherwise use the first one.
  const points = event.pickupPoints ?? [];
  const userPoint =
    (meetingPoint ? points.find(p => p.id === meetingPoint) ?? null : null) ??
    points[0] ?? null;

  const pointDateOffset = userPoint?.dateOffset ?? 0;
  const d = new Date(startDate + 'T00:00:00');
  d.setDate(d.getDate() + pointDateOffset);
  const day     = d.getDate().toString();
  const month   = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

  const resolvedMeeting   = userPoint?.meetingSpot ?? userPoint?.label ?? '';
  const resolvedTransport = userPoint?.transport ?? '';
  const resolvedTime      = userPoint?.time ?? '';

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
              <span className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider">Meeting Spot</span>
            </div>
            <span className="text-[13px] font-black text-gray-900 leading-tight">{resolvedMeeting}</span>
          </div>
          <div className="px-4 py-3">
            <div className="flex items-center gap-1 mb-1">
              <Bus size={9} className="text-gray-400" />
              <span className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider">Transport</span>
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

// Static voice-note waveform shape (0..1 bar heights) — organic, with a few
// scattered louder clusters rather than one central peak, gently lower at the
// edges. Bars left of the playhead fill gold; the rest stay grey.
const FOUNDERS_WAVE = [0.22,0.3,0.26,0.42,0.34,0.52,0.6,0.46,0.66,0.5,0.38,0.3,0.44,0.56,0.4,0.7,0.6,0.78,0.66,0.5,0.74,0.58,0.46,0.36,0.54,0.66,0.48,0.72,0.6,0.5,0.64,0.42,0.56,0.46,0.62,0.4,0.5,0.34,0.42,0.28,0.32,0.22];

// Founder's Note — a per-plan voice note played from a scalloped gold button
// with a tappable waveform (tap to seek). Audio is lazy-loaded (preload="none")
// so it only downloads when played; no autoplay. Hidden upstream when the plan
// has no foundersNoteUrl.
function FoundersNotePlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [duration, setDuration] = useState(0); // seconds
  const [loading, setLoading] = useState(false);

  const fmtTime = (s: number) => {
    if (!isFinite(s) || s <= 0) return '0:00';
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
  };

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { setLoading(true); a.play().catch(() => { setLoading(false); }); } else a.pause();
  };
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a) return;
    if (!a.duration || !isFinite(a.duration)) { a.play().catch(() => {}); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    a.currentTime = frac * a.duration;
    setProgress(frac);
  };

  return (
    <div className="px-6 pt-3 pb-6">
      <h3 className="text-xl font-black mb-3">a note from the team...</h3>
      <div className="flex items-center gap-3 bg-white rounded-[1.6rem] px-4 py-4 border border-gray-200">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? 'Pause founder note' : 'Play founder note'}
          className="relative w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:scale-105 active:scale-95"
        >
          <motion.div
            className="absolute inset-0 -skew-x-12 pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.32) 50%, transparent 100%)', width: '45%' }}
            animate={{ x: ['-130%', '320%'] }}
            transition={{ duration: 0.95, repeat: Infinity, repeatDelay: 6.5, ease: 'easeInOut' }}
          />
          {loading
            ? <svg className="w-4 h-4 animate-spin text-gray-400 relative z-10" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
            : playing
              ? <Pause size={18} className="text-gray-400 relative z-10" fill="currentColor" />
              : <Play size={18} className="text-gray-400 ml-0.5 relative z-10" fill="currentColor" />}
        </button>
        <div className="flex-1 flex items-center gap-[2px] h-6 cursor-pointer" onClick={seek}>
          {FOUNDERS_WAVE.map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-full transition-colors"
              style={{
                height: `${Math.round(h * 100)}%`,
                minHeight: 3,
                background: (i + 0.5) / FOUNDERS_WAVE.length <= progress ? '#FFE066' : '#DBD5C2',
              }}
            />
          ))}
        </div>
        <span className="text-[11px] font-semibold text-black/55 tabular-nums px-2 py-0.5 bg-black/[0.06] rounded-full flex-shrink-0">
          {fmtTime(duration)}
        </span>
      </div>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPlaying={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
        onPause={() => { setPlaying(false); setLoading(false); }}
        onTimeUpdate={e => { const a = e.currentTarget; setProgress(a.duration ? a.currentTime / a.duration : 0); }}
        onEnded={() => { setPlaying(false); setLoading(false); setProgress(0); }}
      />
    </div>
  );
}

const EventDetailsOverlay = ({ event, selectedCity, allEvents, applicationCount, reservedCount, dateCounts, closeCalendarSignal, onCalendarVisibilityChange, closePlanSwitcherSignal, onPlanSwitcherVisibilityChange, onDismissPlanSwitcher, closePolicySignal, onPolicyVisibilityChange, onSwitchEvent, onClose, onAction }: { event: Event, selectedCity: string, allEvents: Event[], applicationCount?: number | null, reservedCount?: number | null, dateCounts?: Record<string, { registered: number; reserved: number }> | null, closeCalendarSignal?: number, onCalendarVisibilityChange?: (open: boolean) => void, closePlanSwitcherSignal?: number, onPlanSwitcherVisibilityChange?: (open: boolean) => void, onDismissPlanSwitcher?: () => void, closePolicySignal?: number, onPolicyVisibilityChange?: (open: boolean) => void, onSwitchEvent: (e: Event, city: string) => void, onClose: () => void, onAction: (a: 'book' | 'contact', date?: string, meetingPoint?: string) => void }) => {
  const [expandedItinerary, setExpandedItinerary] = useState<number | null>(null);
  const [showNotIncluded, setShowNotIncluded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMeetingPoint, setSelectedMeetingPoint] = useState<string>('');
  const [showMeetingPointSwitchBorder, setShowMeetingPointSwitchBorder] = useState(false);
  const nearestEventMonth = () => {
    // Same sold-out rule as the calendar cells — see isDateSoldOut in supabase.ts.
    const capEligible = event.bookingUrl === 'native-application' || event.bookingUrl === 'payu-hosted';
    const nativeCapacity = (event as any).totalCapacity as number | null;
    const cap = capEligible && typeof nativeCapacity === 'number' && nativeCapacity > 0 ? nativeCapacity : null;
    const upcoming = (event.dates ?? [])
      .filter(d => d.date && !isElapsedDate(d.date))
      .sort((a, b) => a.date.localeCompare(b.date));
    // Open on the earliest date that's still bookable (available or filling
    // fast); if every upcoming date is sold out, fall back to the earliest one.
    const target = upcoming.find(d => !isDateSoldOut({
      status: d.status, date: d.date, capacity: cap, reserved: dateCounts?.[d.date]?.reserved ?? 0,
    })) ?? upcoming[0];
    const targetDate = target ? new Date(target.date + 'T00:00:00') : new Date();
    return new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
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
  // City-specific content: prefer city_details[selectedCity], fall back to flat event fields
  const _cd = (event as any).cityDetails?.[selectedCity];
  const activeIncluded: string[] = _cd?.included ?? (event.included ?? []);
  const activeNotIncluded: string[] = _cd?.not_included ?? (event.notIncluded ?? []);
  const activeOptional: string[] = _cd?.optional_activities ?? (event.optionalActivities ?? []);
  const activeItinerary: any[] = _cd?.itinerary ?? (event.itinerary ?? []);
  const activePriceFull: number    = _cd?.price_full    ?? event.priceFull    ?? 0;
  const activePriceAdvance: number = _cd?.price_advance ?? event.priceAdvance ?? event.advanceAmount ?? 0;
  const [activeVideo, setActiveVideo] = useState<{ embedUrl: string; caption: string } | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [stayImageIndexes, setStayImageIndexes] = useState<Record<number, number>>({});
  const headerTouchStartXRef = useRef<number | null>(null);
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

  // Selected trip range — start is the rider-facing tapped date, end is the
  // base (city-agnostic) start plus the trip duration, matching the grid band.
  const tripRange = React.useMemo(() => {
    if (!selectedDate) return null;
    const durationMatch = event.timing.match(/(\d+)\s*D(?:ays?)?\b/i);
    const tripDays = Math.max(durationMatch ? parseInt(durationMatch[1], 10) : activeItinerary.length, 1);
    const start = new Date(`${selectedDate}T00:00:00`);
    const end = new Date(`${shiftDateStr(selectedDate, -cityDateOffset)}T00:00:00`);
    end.setDate(end.getDate() + tripDays - 1);
    const days = Math.max(Math.round((end.getTime() - start.getTime()) / 86400000) + 1, 1);
    const crossesMonth = start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear();
    return { start, end, days, crossesMonth };
  }, [selectedDate, event.timing, activeItinerary, cityDateOffset]);

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

  // Reset calendar to the earliest bookable month whenever the event changes or
  // per-date counts arrive (they load async, and can flip the earliest date from
  // available to sold-out). Skip while the calendar is open so we never yank the
  // user out of a month they're actively browsing.
  useEffect(() => {
    if (showCalendar) return;
    setCurrentMonth(nearestEventMonth());
  }, [event.id, dateCounts]);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedMeetingPoint('');
    setShowMeetingPointSwitchBorder(false);
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

  // Closing the switcher with its own X / backdrop must UNWIND the history
  // entry it pushed, not just flip state. Flipping state left the entry behind
  // and merely rewrote its URL back to ?sheet=event-details — the same URL as
  // the entry beneath it. Instagram's chevron then lit up but did nothing,
  // because a same-URL pair has nothing traversable between them (this is the
  // "sheets close by setting state, not history.back()" gap flagged in
  // INSTAGRAM-BACK-BUTTON-HANDOFF.md, now hit for real).
  //
  // Going through history makes the X behave exactly like the back button:
  // popstate fires, the parent sends closePlanSwitcherSignal, and the effect
  // above does the closing. onDismissPlanSwitcher is absent when the parent
  // isn't managing history (preview links), so fall back to a plain close.
  const dismissPlanSwitcher = () => {
    if (onDismissPlanSwitcher) onDismissPlanSwitcher();
    else setShowPlanSwitcher(false);
  };

  useEffect(() => {
    return () => onPlanSwitcherVisibilityChange?.(false);
  }, [onPlanSwitcherVisibilityChange]);

  // Policy sheets — same three-effect contract as the calendar above: report
  // open/closed upward, close on the parent's signal, and report closed on
  // unmount so a layer can't be left stranded if details closes underneath.
  useEffect(() => {
    onPolicyVisibilityChange?.(!!showPolicyModal);
  }, [showPolicyModal, onPolicyVisibilityChange]);

  useEffect(() => {
    if (!showPolicyModal) return;
    setShowPolicyModal(null);
  }, [closePolicySignal]);

  useEffect(() => {
    return () => onPolicyVisibilityChange?.(false);
  }, [onPolicyVisibilityChange]);

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
	    // Sold-out / elapsed rules live in supabase.ts (isDateSoldOut) so every
	    // surface answers "is this date bookable?" identically.
	    // Shift so Monday = 0, Sunday = 6 (common in India)
	    const firstDay = ((new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7);
	    // ── Per-date spots-left (native application events) ──────────────────────
	    // Capacity (totalCapacity) applies to EACH date independently. reserved per
	    // date comes from dateCounts (advance_paid/fully_paid who picked that date).
	    // Rules: a date with 0 left auto-sells-out; the EARLIEST date that's ≥50%
	    // reserved (and still has spots) is the only one shown amber + "Only X left";
	    // every other non-sold date stays green.
	    // Per-date capacity/sold-out applies to native-application AND open
	    // (payu-hosted) events — both have a totalCapacity and per-date reserved
	    // counts (dateCounts loaded above for either flow).
	    const capEligible = event.bookingUrl === 'native-application' || event.bookingUrl === 'payu-hosted';
	    const nativeCapacity = (event as any).totalCapacity as number | null;
	    const cap = capEligible && typeof nativeCapacity === 'number' && nativeCapacity > 0 ? nativeCapacity : null;
	    const reservedForDate = (baseDate?: string) => (baseDate && dateCounts ? (dateCounts[baseDate]?.reserved ?? 0) : 0);
	    const sortedTripDates = (event.dates ?? []).filter(d => d.date).slice().sort((a, b) => a.date.localeCompare(b.date));
	    // Classify each trip date: 'sold' | 'amber' (earliest filling-fast) | 'green'.
	    let earliestFillingFastDate: string | null = null;
	    let earliestFillingFastLeft = 0;
	    if (cap) {
	      for (const d of sortedTripDates) {
	        const reserved = reservedForDate(d.date);
	        const avail = cap - reserved;
	        if (isDateSoldOut({ status: d.status, date: d.date, capacity: cap, reserved })) continue;  // sold out → skip
	        if (reserved / cap >= 0.5) { earliestFillingFastDate = d.date; earliestFillingFastLeft = avail; break; }
	      }
	    }
	    const dateVisualState = (baseDate?: string, dbStatus?: string): 'sold' | 'amber' | 'green' | null => {
	      // Only classify ACTUAL trip/event dates. Non-trip days have no status
	      // (dbStatus undefined); without this guard they have 0 reservations →
	      // available = capacity > 0 → wrongly painted green across the whole month.
	      if (!capEligible || !cap || !baseDate || !dbStatus) return null;
	      if (isDateSoldOut({ status: dbStatus, date: baseDate, capacity: cap, reserved: reservedForDate(baseDate) })) return 'sold';
	      if (baseDate === earliestFillingFastDate) return 'amber';
	      return 'green';
	    };
	    // Legend summary across all trip dates.
	    const tripStates = cap ? sortedTripDates.map(d => dateVisualState(d.date, d.status)) : [];
	    const legendHasGreen = tripStates.includes('green');
	    const legendAllSoldOut = tripStates.length > 0 && tripStates.every(s => s === 'sold');

    const selectedDateObj = tripRange?.start ?? null;
    const endDateObj = tripRange?.end ?? null;
    
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
	      const cellState = dateVisualState(baseDateStr, tripDate?.status);
	      const effectiveDateStatus =
	        cellState === 'sold'  ? 'sold_out'
	        : cellState === 'amber' ? 'selling_out'
	        : cellState === 'green' ? 'available'
	        : tripDate?.status;

      const isSelectedStart = selectedDate === dateStr;
      const isTripEnd = endDateObj && currentDateObj.getTime() === endDateObj.getTime();
      const isWithinTrip = selectedDateObj && endDateObj && currentDateObj > selectedDateObj && currentDateObj < endDateObj;
      const inTripBand = !!(isSelectedStart || isWithinTrip || isTripEnd);
      const continuesNextMonth = inTripBand && !isTripEnd && i === daysInMonth;
      const continuesPrevMonth = inTripBand && !isSelectedStart && i === 1;

      const shapeClass = (() => {
        if (isSelectedStart && isTripEnd) return "rounded-full";
        if (isSelectedStart) return "rounded-l-full";
        if (isTripEnd) return "rounded-r-full";
        if (isWithinTrip) return "rounded-none";
        return "rounded-xl";
      })();

	      const isSoldOut = tripDate?.status === 'sold_out' || cellState === 'sold';
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
            <span className="text-base relative z-[3] flex items-center justify-center">
              {continuesPrevMonth && <ChevronLeft size={11} strokeWidth={3} className="-ml-1.5 opacity-60" />}
              {i}
              {continuesNextMonth && <ChevronRight size={11} strokeWidth={3} className="-mr-1.5 opacity-60" />}
            </span>
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
          {(() => {
            const amberKey = (label: string) => (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm border border-[#f59e0b] shadow-[0_0_0_1px_rgba(245,158,11,0.35)]" style={{ backgroundColor: '#FFEDE5' }}></div>
                <span>{label}</span>
              </div>
            );
            const greenKey = (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-green-300 border border-green-600 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"></div>
                <span>Available</span>
              </div>
            );
            // Per-date native logic.
            if (cap) {
              if (legendAllSoldOut) return null;                       // all sold out → no keys
              if (earliestFillingFastDate) {                           // ≥1 filling-fast date
                return (
                  <>
                    {amberKey(`Only ${earliestFillingFastLeft} spot${earliestFillingFastLeft === 1 ? '' : 's'} left`)}
                    {legendHasGreen && greenKey}
                  </>
                );
              }
            }
            // Default color legend (non-native, no capacity, or nothing filling fast).
            return (<>{amberKey('Filling fast')}{greenKey}</>);
          })()}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
        {tripRange?.crossesMonth && (() => {
          const startMonth = new Date(tripRange.start.getFullYear(), tripRange.start.getMonth(), 1);
          const endMonth = new Date(tripRange.end.getFullYear(), tripRange.end.getMonth(), 1);
          const viewing = currentMonth.getTime();
          const hintClass = "w-full mt-3 py-2.5 rounded-xl border border-dashed border-[#d4af37] text-[10px] font-bold uppercase tracking-wider text-gray-600 flex items-center justify-center gap-1.5 active:scale-95 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]";
          if (viewing >= startMonth.getTime() && viewing < endMonth.getTime()) {
            return (
              <button type="button" onClick={() => setCurrentMonth(endMonth)} className={hintClass}>
                Trip continues into {endMonth.toLocaleString('default', { month: 'long' })}
                <ChevronRight size={12} strokeWidth={3} className="shrink-0 -translate-y-[0.25px]" />
              </button>
            );
          }
          if (viewing === endMonth.getTime()) {
            return (
              <button type="button" onClick={() => setCurrentMonth(startMonth)} className={hintClass}>
                <ChevronLeft size={12} strokeWidth={3} className="shrink-0 -translate-y-[0.25px]" />
                Started {tripRange.start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </button>
            );
          }
          return null;
        })()}
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
            onClick={() => { if (isPreviewLink) { window.location.href = 'https://chaptera.in/lifestyle'; } else { setSwitcherCity(selectedCity); setShowPlanSwitcher(true); } }}
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

        {/* Founder's Note — per-plan voice note, shown just before the CTA */}
        {event.foundersNoteUrl && <FoundersNotePlayer url={event.foundersNoteUrl} />}

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

                                // Open events mirror invite-only single-step pricing exactly:
                                // single-payment (payment_mode='full') → centered "Entry Ticket"
                                // + price; split → Advance + Remaining Balance. Spots-left is
                                // surfaced via the calendar key, not here.
                                return event.paymentMode === 'full' ? (
                              <div className="flex flex-col items-center text-center gap-1 text-[11px] font-semibold text-gray-700">
                                <p>Entry Ticket</p>
                                <p className="text-2xl font-black text-black leading-tight">{formatINR(displayTotal)}</p>
                              </div>
                                ) : event.payAtVenue ? (
                              // Pay at venue: two tiles that visibly SUM rather than reading as
                              // "price, then debt". Emphasis comes only from tile width (1.5:1)
                              // and number size — same fill on both, nothing greyed out. The full
                              // ticket price is deliberately never shown: the guest sees only the
                              // two parts, and the "+" signals they add up rather than stack.
                              <div className="grid items-stretch" style={{ gridTemplateColumns: '1.5fr 30px 1fr' }}>
                                {/* Amount typography is deliberately identical to the normal
                                    split card below (24px/900 and 16px/600, pure black, default
                                    tracking) so the two variants read as one system. The advance
                                    label is the one thing allowed to wrap — it's long enough to
                                    overflow a narrow tile, and wrapping beats spilling out. */}
                                <div className="bg-white rounded-[14px] flex flex-col justify-center" style={{ padding: '5px 13px 7px', gap: 4 }}>
                                  <p className="text-[11px] font-semibold text-gray-700">Advance (lock your spot)</p>
                                  <p className="text-2xl font-black text-black leading-tight">{formatINR(displayAdvance)}</p>
                                </div>
                                {/* Bare "+" in the seam — no pill or circle behind it. */}
                                <div className="flex flex-col items-center justify-center" style={{ gap: 6 }}>
                                  <span className="w-px bg-[#e4e6e9]" style={{ height: 10 }} />
                                  <span className="text-[11px] font-semibold text-gray-700 leading-none">+</span>
                                  <span className="w-px bg-[#e4e6e9]" style={{ height: 10 }} />
                                </div>
                                <div className="bg-white rounded-[14px] flex flex-col justify-center items-end text-right" style={{ padding: '5px 11px 7px', gap: 4 }}>
                                  <p className="text-[11px] font-semibold text-gray-700 whitespace-nowrap">Pay at Venue</p>
                                  <p className="text-base font-semibold text-black">{formatINR(displayRemaining)}</p>
                                </div>
                              </div>
                                ) : (
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex flex-col gap-1 text-[11px] font-semibold text-gray-700">
                                  <p>Advance</p>
                                  <p className="text-2xl font-black text-black leading-tight">{formatINR(displayAdvance)}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1 text-[11px] font-semibold text-gray-700">
                                  <p className="text-[11px]">Remaining Balance</p>
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
                                  {(event.quickInfo?.find(item => item.label === 'Calendar CTA')?.value?.trim()) || (event.inviteOnly ? 'Apply Now' : 'Book Now')}
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
              {showPolicyModal === 'tc' && <TermsContent />}
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
              onClick={dismissPlanSwitcher}
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
                onClick={dismissPlanSwitcher}
                className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                aria-label="Close plan switcher"
              >
                <X size={14} />
              </button>
              {/* City switcher — same style as month switcher in calendar.
                  "Other" is filtered out (Other Cities flow is gone). Legacy
                  events may still list 'Other' in their cities array; we just
                  don't surface it as a switcher option. */}
              {(() => {
                // Community events (free, WhatsApp-sheet-only) are excluded:
                // the switcher swaps between details pages, which community
                // events don't have.
                const switchableEvents = allEvents.filter(e => e.bookingFlow !== 'whatsapp');
                const cityOrder: string[] = [];
                switchableEvents.forEach(e => (e.cities ?? []).forEach(c => {
                  if (String(c).toLowerCase() === 'other') return;
                  if (!cityOrder.includes(c)) cityOrder.push(c);
                }));
                const cityIdx = cityOrder.indexOf(switcherCity);
                const cityLabel = switcherCity.charAt(0).toUpperCase() + switcherCity.slice(1).toLowerCase();
                const cityEvents = sortGirlsOnlyLast(switchableEvents.filter(e => (e.cities ?? []).includes(switcherCity)));
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
                              // Same unwind as the X: picking a plan closes the
                              // switcher, so its history entry has to go too.
                              onClick={() => { if (!isActive) onSwitchEvent(e, switcherCity); dismissPlanSwitcher(); }}
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
