import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { ArrowRight, Send, RotateCcw, LockKeyhole, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, MapPin, Bus, Heart, Users, X, MessageCircle, ShieldCheck, Download, Ticket } from 'lucide-react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import chatProfile from './assets/chat-profile.jpg';
import AppFlow from './AppFlow';
import AdminPanel from './AdminPanel';
import { trackEvent, supabase, fetchEventCounts, fetchEventDateCounts, fetchEventByIdOrSlug } from './supabase';
import { TermsContent } from './TermsContent';

// Driven by VITE_SUPABASE_URL so preview/staging deploys never accidentally
// call prod edge functions. supabase.ts already throws if the env var is
// missing, so by the time we reach here it is guaranteed to be set.
const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

// Types
type Message = {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
};

interface TripDate {
  date: string;
  status: 'available' | 'selling_out' | 'sold_out';
  label?: string;
}

type FAQ = {
  question: string;
  answer: string;
};

type QuickInfoIcon = 'pin' | 'bus' | 'users' | 'home' | 'clock' | 'ticket' | 'map' | 'heart';

interface Event {
  quickInfo?: { icon: QuickInfoIcon; label: string; value: string }[];
  id: string;
  cities: string[];
  category: string;
  isActivity?: boolean;
  title: string;
  timing: string;
  price: string;
  advanceAmount: number;
  description: string;
  heroImage: string;
  startLocation: string;
  pickupPoints?: { city: string; location: string; time: string }[];
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
  accommodation: {
    name: string;
    images: string[];
    features: string[];
    policy: string;
  };
  optionalActivities?: string[];
  videos: { thumbnail: string; caption: string }[];
  reviews: { name: string; rating: number; text: string; images: string[] }[];
  dates: TripDate[];
  faqs: FAQ[];
  bookingUrl: string;
  announcements?: string[];
  inviteOnly?: boolean;
  waitlistUrl?: string;
}

// Mock Data
const EVENTS: Event[] = [
  {
    id: 'e3',
    cities: ['Chennai'],
    category: 'Trips',
    title: 'Sri Lanka Retreat',
    timing: '4 Nights 5 Days',
    price: '₹24,999',
    advanceAmount: 5000,
    description: 'A slow, sun-soaked island escape across Colombo, Kandy, and the south coast. Waterfalls, tea country train rides, and a villa by the beach to reset.',
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop',
    startLocation: 'Chennai Airport (MAA)',
    quickInfo: [
      { icon: 'pin', label: 'Meeting Spot', value: 'Chennai Airport (MAA)' },
      { icon: 'bus', label: 'Transport', value: 'Flights + Coach' },
      { icon: 'users', label: 'Group Size', value: '16-18 travellers' },
      { icon: 'heart', label: "You'll Meet", value: 'Beach lovers & culture seekers' },
    ],
    transportPlan: [
      { type: 'flight', from: 'Chennai', to: 'Colombo', time: '7:00 AM', dateOffset: 0 },
      { type: 'train', from: 'Colombo', to: 'Kandy', time: '2:00 PM', dateOffset: 1 },
      { type: 'tempo', from: 'Kandy', to: 'South Coast Villa', time: '8:00 AM', dateOffset: 2 },
      { type: 'flight', from: 'Colombo', to: 'Chennai', time: '6:00 PM', dateOffset: 4 }
    ],
    transport: 'Flights + Private Coach',
    groupSize: 'Max 18 travellers',
    accommodationType: 'Boutique villa & hillside resort',
    included: [
      'Round-trip flights from Chennai',
      'All on-ground transport in Sri Lanka',
      '4 nights stay (double occupancy)',
      'Daily breakfast + 2 curated dinners',
      'Train ride through tea country',
      'Local experience hosts & trip manager'
    ],
    notIncluded: [
      'Lunches and personal shopping',
      'Visa fees (approx ₹1,500)',
      'Travel insurance',
      'Any extras outside the itinerary'
    ],
    optionalActivities: [
      'Galle old town sunset walk',
      'Surf lesson in Weligama',
      'Sigiriya sunrise hike'
    ],
    itinerary: [
      {
        day: 'Day 1',
        title: 'Fly In & Colombo Night',
        description: 'Morning flight from Chennai, drop bags at the hotel, explore cafes and a sunset by Galle Face Green.',
        schedule: [
          { time: '7:00 AM', activity: 'Flight Chennai → Colombo' },
          { time: '5:00 PM', activity: 'Sunset at Galle Face Green' }
        ]
      },
      {
        day: 'Day 2',
        title: 'Tea Country Rails',
        description: 'Scenic train ride to Kandy, temple visit, and evening cultural show.',
        schedule: [
          { time: '2:00 PM', activity: 'Train to Kandy' },
          { time: '7:00 PM', activity: 'Cultural show & dinner' }
        ]
      },
      {
        day: 'Day 3',
        title: 'Waterfalls & Drive South',
        description: 'Road-trip through waterfalls and spice gardens en route to the south coast villa.',
        schedule: [
          { time: '9:00 AM', activity: 'Stop at Ramboda Falls' },
          { time: '4:00 PM', activity: 'Check-in at beach villa' }
        ]
      },
      {
        day: 'Day 4',
        title: 'Beach Day & Surf',
        description: 'Slow morning by the pool, optional surf lesson, golden-hour dinner by the sea.',
        schedule: [
          { time: '11:00 AM', activity: 'Beach + pool time' },
          { time: '5:30 PM', activity: 'Sunset dinner spread' }
        ]
      },
      {
        day: 'Day 5',
        title: 'Fly Back',
        description: 'Head back to Colombo after breakfast and fly to Chennai in the evening.',
        schedule: [
          { time: '12:00 PM', activity: 'Colombo cafe crawl' },
          { time: '6:00 PM', activity: 'Flight to Chennai' }
        ]
      }
    ],
    accommodation: {
      name: 'Kandy Hillside Resort · South Coast Villa',
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1501117716987-c8e1ecb210af?q=80&w=1200&auto=format&fit=crop'
      ],
      features: [
        'Infinity pool overlooking tea gardens',
        'Private beach access at the villa',
        'Daily housekeeping and local breakfast'
      ],
      policy: "Rooms are same gender sharing — so that everyone's comfortable"
    },
    videos: [
      {
        thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop',
        caption: 'Tropical evenings on the south coast'
      },
      {
        thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=400&auto=format&fit=crop',
        caption: 'Train through tea country vibes'
      }
    ],
    reviews: [
      {
        name: 'Aishwarya N',
        rating: 5,
        text: 'The slow-paced itinerary was perfect. Loved the villa and the curated meals.',
        images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=200&auto=format&fit=crop']
      }
    ],
    dates: [
      { date: '2026-04-12', status: 'selling_out', label: 'Waitlist moving' },
      { date: '2026-04-26', status: 'available', label: 'Summer batch' }
    ],
    faqs: [
      { question: 'Is visa included?', answer: 'Visa fee is not included. We will guide you through the easy online process.' },
      { question: 'Can I join solo?', answer: 'Absolutely, most travellers join solo. We pair roomies thoughtfully.' }
    ],
    bookingUrl: '/phonepe-mock',
    announcements: [
      "🇱🇰 Sri Lanka Retreat waitlist now open",
      "🍃 Slow mornings, tea country trains, and a beach villa",
      "✈️ Flights included from Chennai"
    ]
  },
];

const GENERAL_ANNOUNCEMENTS = [
  "Chennai-based social club with 4000+ members",
  "🇱🇰 Sri Lanka Retreat waitlist now open",
  "✈️ Flights included from Chennai"
];

// ─── HOMEPAGE COMPONENT ────────────────────────────────────────────────────────
function HomePage({ onEnterApp, onViewExperiences }: { onEnterApp: () => void; onViewExperiences: () => void }) {
  const [showSending, setShowSending] = useState(false);

  const handleViewExperiences = () => {
    setShowSending(true);
    // Wait for animation to finish, then switch view inside SPA (no page reload)
    setTimeout(() => {
      onViewExperiences();
    }, 1900);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#fff', color: '#0e0e0e', lineHeight: 1.6, WebkitFontSmoothing: 'antialiased', overflowX: 'hidden', minHeight: '100vh' }}>
      {/* Sending animation overlay */}
      <AnimatePresence>
        {showSending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ opacity: { duration: 0.35, ease: 'easeOut' }, scale: { type: 'spring', damping: 20, stiffness: 120 } }}
            style={{ position: 'fixed', inset: 0, background: '#FFD700', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          >
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
                <Send size={48} color="#000" />
              </motion.div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              style={{ marginTop: '1rem', fontWeight: 700, fontSize: '1.125rem', color: '#000', letterSpacing: '0.025em', position: 'absolute', top: '55%' }}
            >
              Sending details...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --yellow: #f5c518; --black: #0e0e0e; --white: #ffffff; --gray-50: #f8f8f6; --gray-100: #f0f0ec; --gray-400: #999; --gray-600: #555; --gray-800: #222; --radius-sm: 10px; --radius-md: 16px; --radius-lg: 24px; }
        html { scroll-behavior: smooth; }
        .hp-nav { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; padding: 0.9rem 2.5rem; }
        .hp-nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; cursor: pointer; }
        .hp-logo-mark { width: 38px; height: 38px; background: #0e0e0e; border-radius: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .hp-logo-image { width: 100%; height: 100%; object-fit: contain; }
        .hp-logo-name { font-size: 15px; font-weight: 700; color: #0e0e0e; letter-spacing: -0.3px; }
        .hp-nav-links { display: flex; gap: 2rem; list-style: none; }
        .hp-nav-links a { font-size: 13px; font-weight: 500; color: #555; text-decoration: none; transition: color 0.2s; }
        .hp-nav-links a:hover { color: #0e0e0e; }
        .hp-hero { padding: 6rem 2.5rem 5rem; text-align: center; background: #fff; position: relative; overflow: hidden; }
        .hp-hero::before { content: ''; position: absolute; top: -80px; left: 50%; transform: translateX(-50%); width: 600px; height: 600px; background: radial-gradient(circle, rgba(245,197,24,0.12) 0%, transparent 70%); pointer-events: none; }
        .hp-hero h1 { font-family: 'Instrument Serif', serif; font-size: clamp(38px, 6vw, 60px); font-weight: 400; color: #0e0e0e; line-height: 1.12; letter-spacing: -1.5px; margin-bottom: 1.25rem; max-width: 760px; margin-left: auto; margin-right: auto; }
        .hp-hero h1 em { font-style: italic; color: #555; }
        .hp-hero p { font-size: 16px; color: #555; max-width: 620px; margin: 0 auto 2.25rem; line-height: 1.75; }
        @keyframes hp-shimmer { 0% { transform: skewX(-12deg) translateX(-160%); } 100% { transform: skewX(-12deg) translateX(360%); } }
        .hp-btn-primary { display: inline-block; position: relative; overflow: hidden; background: #FFD700; color: #111; font-size: 19px; font-weight: 700; padding: 1.15rem 3rem; border-radius: 50px; text-decoration: none; border: none; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; letter-spacing: -0.2px; }
        .hp-btn-primary::after { content: ''; position: absolute; top: 0; left: 0; width: 45%; height: 100%; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%); animation: hp-shimmer 1s ease-in-out infinite; animation-delay: 1s; animation-iteration-count: infinite; animation-play-state: running; filter: blur(2.2px); box-shadow: 0 -4px 16px rgba(255,255,255,0.22); }
        .hp-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
        .hp-about { padding: 5rem 2.5rem; background: #0e0e0e; color: #fff; }
        .hp-about-inner { max-width: 720px; margin: 0 auto; }
        .hp-section-label { font-size: 11px; font-weight: 700; color: #999; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px; display: block; }
        .hp-about .hp-section-label { color: #f5c518; }
        .hp-about h2 { font-family: 'Instrument Serif', serif; font-size: 36px; font-weight: 400; letter-spacing: -1px; margin-bottom: 1.25rem; line-height: 1.2; }
        .hp-about p { font-size: 14px; color: rgba(255,255,255,0.72); line-height: 1.85; margin-bottom: 0.85rem; }
        section.hp-section h2 { font-family: 'Instrument Serif', serif; font-size: 32px; font-weight: 400; color: #0e0e0e; letter-spacing: -0.8px; margin-bottom: 1.75rem; line-height: 1.2; }
        .hp-container { max-width: 720px; margin: 0 auto; }
        .hp-offerings { padding: 5rem 2.5rem; background: #f8f8f6; }
        .hp-offerings-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .hp-offering-card { background: #fff; border-radius: 16px; padding: 1.5rem; border: 1px solid #eee; transition: transform 0.2s, box-shadow 0.2s; }
        .hp-offering-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,0.07); }
        .hp-offering-icon { width: 42px; height: 42px; background: #f5c518; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
        .hp-offering-card h3 { font-size: 14px; font-weight: 700; color: #0e0e0e; margin-bottom: 5px; }
        .hp-offering-card p { font-size: 13px; color: #999; line-height: 1.6; }
        .hp-booking { padding: 5rem 2.5rem; background: #fff; }
        .hp-booking-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .hp-booking-card { background: #f8f8f6; border-radius: 16px; padding: 1.5rem; border: 1px solid #eee; }
        .hp-booking-step { width: 32px; height: 32px; background: #f5c518; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #0e0e0e; margin-bottom: 0.75rem; }
        .hp-booking-card h3 { font-size: 14px; font-weight: 700; color: #0e0e0e; margin-bottom: 5px; }
        .hp-booking-card p { font-size: 13px; color: #555; line-height: 1.65; }
        .hp-policy { padding: 5rem 2.5rem; background: #fff; }
        .hp-policy-grid { display: flex; flex-direction: column; gap: 10px; }
        .hp-policy-card { background: #f8f8f6; border-radius: 10px; padding: 1.1rem 1.4rem; display: flex; align-items: flex-start; gap: 1rem; }
        .hp-policy-dot { width: 8px; height: 8px; border-radius: 50%; background: #f5c518; margin-top: 6px; flex-shrink: 0; }
        .hp-policy-card h3 { font-size: 14px; font-weight: 700; color: #0e0e0e; margin-bottom: 3px; }
        .hp-policy-card p { font-size: 13px; color: #555; line-height: 1.65; }
        .hp-terms { padding: 5rem 2.5rem; background: #f8f8f6; }
        .hp-terms-list { display: flex; flex-direction: column; gap: 0; border: 1px solid #e8e8e8; border-radius: 16px; overflow: hidden; background: #fff; }
        .hp-terms-item { padding: 1.1rem 1.4rem; border-bottom: 1px solid #f0f0f0; display: flex; gap: 1rem; align-items: flex-start; }
        .hp-terms-item:last-child { border-bottom: none; }
        .hp-terms-bar { width: 3px; min-height: 40px; background: #f5c518; border-radius: 3px; flex-shrink: 0; }
        .hp-terms-item h3 { font-size: 14px; font-weight: 700; color: #0e0e0e; margin-bottom: 3px; }
        .hp-terms-item p { font-size: 13px; color: #555; line-height: 1.65; }
        .hp-privacy { padding: 5rem 2.5rem; background: #fff; }
        .hp-privacy-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .hp-privacy-card { background: #f8f8f6; border-radius: 16px; padding: 1.25rem; border: 1px solid #eee; }
        .hp-privacy-card h3 { font-size: 13px; font-weight: 700; color: #0e0e0e; margin-bottom: 6px; }
        .hp-privacy-card p { font-size: 13px; color: #555; line-height: 1.65; }
        .hp-contact { padding: 5rem 2.5rem; background: #0e0e0e; }
        .hp-contact .hp-section-label { color: #f5c518; }
        .hp-contact h2 { font-family: 'Instrument Serif', serif; font-size: 32px; font-weight: 400; color: #fff; letter-spacing: -0.8px; margin-bottom: 1.75rem; line-height: 1.2; }
        .hp-contact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 1rem; }
        .hp-contact-card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 1rem 1.25rem; }
        .hp-contact-label { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px; }
        .hp-contact-card p { font-size: 14px; color: #fff; }
        .hp-contact-card a { color: #f5c518; text-decoration: none; }
        .hp-contact-note { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 0.75rem; }
        .hp-footer { background: #0e0e0e; border-top: 1px solid rgba(255,255,255,0.07); padding: 1.25rem 2.5rem; display: flex; justify-content: space-between; align-items: center; }
        .hp-footer-logo { display: flex; align-items: center; gap: 8px; }
        .hp-footer-logo-mark { width: 28px; height: 28px; background: #f5c518; border-radius: 7px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .hp-footer-name { color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 600; }
        .hp-footer p { font-size: 12px; color: rgba(255,255,255,0.3); }
        @media (max-width: 640px) {
          .hp-nav { padding: 0.8rem 1.25rem; }
          .hp-nav-links { display: none; }
          .hp-hero { padding: 4rem 1.25rem 3.5rem; }
          .hp-offerings, .hp-policy, .hp-terms, .hp-privacy, .hp-contact { padding: 3.5rem 1.25rem; }
          .hp-offerings-grid, .hp-booking-grid, .hp-privacy-grid, .hp-contact-grid { grid-template-columns: 1fr; }
          .hp-about { padding: 4rem 1.25rem; }
          .hp-footer { flex-direction: column; gap: 8px; text-align: center; padding: 1.25rem; }
        }
      `}</style>

      {/* Nav */}
      <nav className="hp-nav">
        <div className="hp-nav-logo">
          <div className="hp-logo-mark">
            <img src={chatProfile} alt="chapter a logo" className="hp-logo-image" />
          </div>
          <span className="hp-logo-name">chapter அ</span>
        </div>
        <ul className="hp-nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#experiences">Experiences</a></li>
          <li><a href="#booking">Booking</a></li>
          <li><a href="#policies">Policies</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      {/* Hero */}
      <section className="hp-hero">
        <h1>Curated experiences <br /><em>for people who want to step out and connect</em></h1>
        <p>chapter அ is a Chennai-based social experiences brand that curates group trips, social gatherings, activities and community-led events. Participants can browse upcoming experiences, view event details and make bookings online.</p>
        <button type="button" className="hp-btn-primary" onClick={handleViewExperiences}>View Upcoming Experience</button>
      </section>

      {/* About */}
      <section className="hp-about" id="about">
        <div className="hp-about-inner">
          <span className="hp-section-label">About Us</span>
          <h2>Who we are</h2>
          <p>chapter அ is a curated social experiences brand operated by <strong>CHAPTER</strong>, a registered business entity based in Chennai, Tamil Nadu, India.</p>
          <p>We organise and facilitate social experiences, community events, activities and group trips for young adults. Our experiences are designed to help individuals and groups discover new places, meet new people and participate in well-managed experiences in a comfortable setting.</p>
          <p>Each experience is published with relevant information such as date, inclusions, exclusions, pricing, advance payment terms, fulfilment details and support information so customers can review the details before booking.</p>
          <p>Customers can reserve spots through our website by paying an advance amount online. Where applicable, the remaining balance is collected before the experience date, and confirmed participants receive updates, reminders and logistical details through WhatsApp or email.</p>
          <p>Legal Entity Name: <strong>CHAPTER</strong><br />Proprietor's Name: <strong>Krutesh S.K</strong><br />MSME Registration: <strong>UDYAM-TN-02-0414270</strong><br />Registered Business Address: <strong>16/45, Dharmaraja Koil Street, Kilpauk Garden Colony, Chennai - 600010</strong></p>
        </div>
      </section>

      {/* Booking Process */}
      <section className="hp-booking hp-section" id="booking">
        <div className="hp-container">
          <span className="hp-section-label">Booking Process</span>
          <h2>How booking works</h2>
          <div className="hp-booking-grid">
            <div className="hp-booking-card">
              <div className="hp-booking-step">1</div>
              <h3>Browse an experience</h3>
              <p>Customers can review the published experience page to see the date, location, inclusions, exclusions, pricing, eligibility and other relevant details before making a booking decision.</p>
            </div>
            <div className="hp-booking-card">
              <div className="hp-booking-step">2</div>
              <h3>Pay the advance online</h3>
              <p>An advance amount is collected through the website to reserve a spot. The applicable advance amount and the balance payment structure are displayed as part of the booking flow.</p>
            </div>
            <div className="hp-booking-card">
              <div className="hp-booking-step">3</div>
              <h3>Receive confirmation and reminders</h3>
              <p>After booking, customers receive confirmation and further communication through WhatsApp or email, including reminders about any pending balance payment and pre-event instructions.</p>
            </div>
            <div className="hp-booking-card">
              <div className="hp-booking-step">4</div>
              <h3>Complete payment and join</h3>
              <p>Where applicable, the remaining balance must be paid before the experience date. Once payment formalities are completed, customers receive the final logistical details required to participate.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Online Payments */}
      <section className="hp-policy hp-section" style={{ paddingTop: '2rem' }}>
        <div className="hp-container">
          <span className="hp-section-label">Online Payments</span>
          <h2>Online payments</h2>
          <p>This online payment system is provided by CHAPTER. CHAPTER may update these terms from time to time and any changes will be effective immediately on being set out here. Please ensure you are aware of the current terms. The country of domicile for CHAPTER is India.</p>
        </div>
      </section>

      {/* Terms */}
      <section className="hp-terms hp-section">
        <div className="hp-container">
          <span className="hp-section-label">Terms & Conditions</span>
          <h2>Terms of use</h2>
          <p style={{ fontSize: 12, color: '#555', marginBottom: '1.25rem', fontStyle: 'italic' }}>These terms apply to bookings made through chapter அ for experiences, activities, group trips and social events.</p>
          <div className="hp-terms-list">
            {[
              ['1. Booking Confirmation', 'A booking is considered confirmed only after successful payment and receipt of confirmation from chapter அ.'],
              ['2. Payment Schedule', 'Where a booking is split into advance and balance payment, the balance due date will be communicated on the website or through direct customer communication. Failure to complete payment may result in cancellation of the reservation.'],
              ['3. Experience Changes', 'chapter அ may make reasonable changes to schedules, venues, transport plans or itinerary elements due to weather, vendor availability, safety considerations or other operational reasons.'],
              ['4. Third-Party Services', 'Some experiences may involve third-party vendors such as transport operators, accommodation partners, activity organisers or venue partners. chapter அ coordinates the experience but may rely on these service providers for fulfilment.'],
              ['5. Customer Communication', 'By submitting contact details during booking, the customer agrees to receive booking confirmation, reminders, logistical updates and customer support communication through WhatsApp, phone call or email.'],
              ['6. Eligibility', 'Certain experiences may have age limits or participation requirements. These conditions will be specified on the relevant booking page. Customers may be asked to provide valid identification where necessary.'],
            ].map(([title, body]) => (
              <div className="hp-terms-item" key={title}>
                <div className="hp-terms-bar" />
                <div><h3>{title}</h3><p>{body}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Refund Policy */}
      <section className="hp-policy hp-section" id="policies">
        <div className="hp-container">
          <span className="hp-section-label">Refund & Cancellation Policy</span>
          <h2>Our refund policy</h2>
          <p style={{ fontSize: 12, color: '#999', marginBottom: '1.25rem', fontStyle: 'italic' }}>Note: The term "experience" includes trips, activities, workshops, events and community gatherings published by chapter அ.</p>
          <div className="hp-policy-grid">
            {[
              ['1. Advance Payment', 'An advance amount may be required to reserve a spot for an experience. The applicable advance amount is shown on the booking page. The booking is confirmed only after successful payment.'],
              ['2. Balance Payment', 'For experiences with partial payment options, the remaining balance must be paid by the communicated due date before participation. Reminder messages may be sent through WhatsApp or email.'],
              ['3. Cancellation by Customer', 'Unless otherwise stated on the specific booking page, advance payments are non-refundable because reservations and third-party arrangements may be made in advance on behalf of the customer.'],
              ['4. Cancellation by chapter அ', 'If chapter அ cancels an experience, the customer will receive a refund of the amount paid for that booking, unless an alternative date or replacement experience is accepted by the customer.'],
              ['5. Refund Support', 'For cancellation or refund-related queries, customers can contact us on WhatsApp at +91 8838111564 or by email at chapteraaa.official@gmail.com.'],
            ].map(([title, body]) => (
              <div className="hp-policy-card" key={title}>
                <div className="hp-policy-dot" />
                <div><h3>{title}</h3><p>{body}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="hp-privacy hp-section">
        <div className="hp-container">
          <span className="hp-section-label">Privacy Policy</span>
          <h2>Your data, our responsibility</h2>
          <div className="hp-privacy-grid">
            {[
              ['1. Information We Collect', 'We may collect customer information such as name, phone number, email address and booking details when a customer fills out a form or makes a booking.'],
              ['2. How We Use It', 'This information is used to confirm bookings, provide customer support, share logistical details, send payment reminders where applicable and manage the booked experience.'],
              ['3. Payment Data', 'Payments are processed through secure third-party payment gateways. chapter அ does not store customer card details, UPI PINs or other sensitive payment credentials.'],
              ['4. Limited Sharing', 'Customer information may be shared only where reasonably required to fulfil an experience, such as with transport, accommodation or activity partners, and only to the extent necessary.'],
              ['5. Contact', 'For privacy-related questions or customer support, email us at chapteraaa.official@gmail.com.'],
            ].map(([title, body]) => (
              <div className="hp-privacy-card" key={title}>
                <h3>{title}</h3><p>{body}</p>
              </div>
            ))}
          </div>
          <div className="hp-privacy-grid" style={{ marginTop: '1.25rem' }}>
            <div className="hp-privacy-card" style={{ gridColumn: '1 / -1' }}>
              <h3>Changes to our Privacy Policy</h3>
              <p>CHAPTER reserves the entire right to modify/amend/remove this privacy statement anytime and without any reason. Nothing contained herein creates or is intended to create a contract/agreement between CHAPTER and any user visiting the CHAPTER website or providing identifying information of any kind.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DND Policy */}
      <section className="hp-policy hp-section">
        <div className="hp-container">
          <span className="hp-section-label">DND Policy</span>
          <h2>DND policy</h2>
          <p>If you wish to stop any further sms/email alerts/contacts from our side, all you need to do is to send an email:-chapteraaa.official@gmail.com with your mobile numbers and you will be excluded from the alerts list.</p>
        </div>
      </section>

      {/* Contact */}
      <section className="hp-contact" id="contact">
        <div className="hp-container">
          <span className="hp-section-label">Contact</span>
          <h2>Get in touch</h2>
          <div className="hp-contact-grid">
            <div className="hp-contact-card"><div className="hp-contact-label">Location</div><p>Chennai, Tamil Nadu, India</p></div>
            <div className="hp-contact-card"><div className="hp-contact-label">Email</div><p><a href="mailto:chapteraaa.official@gmail.com">chapteraaa.official@gmail.com</a></p></div>
            <div className="hp-contact-card"><div className="hp-contact-label">WhatsApp / Phone</div><p><a href="https://wa.me/918838111564">+91 8838111564</a></p></div>
          </div>
          <p className="hp-contact-note">Customer support and booking assistance are available through WhatsApp and email.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="hp-footer">
        <div className="hp-footer-logo">
          <div className="hp-footer-logo-mark">
            <img src={chatProfile} alt="chapter a logo" className="hp-logo-image" />
          </div>
          <span className="hp-footer-name">chapter அ</span>
        </div>
        <div style={{ marginTop: 10, textAlign: 'right' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Operated by <strong>CHAPTER</strong></p>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Proprietor's Name: Krutesh S.K</p>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Registered Address: 16/45, Dharmaraja Koil Street, Kilpauk Garden Colony, Chennai - 600010</p>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>MSME Registration: UDYAM-TN-02-0414270</p>
          <p style={{ marginTop: 4 }}>© 2025 chapter அ. All rights reserved.</p>
          <p style={{ marginTop: 6 }}>
            <a href="/privacy" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline', marginRight: 12 }}>Privacy Policy</a>
            <a href="/termsofservice" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline' }}>Terms of Service</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

// Layered poster assets — each PNG is 874×1330 with the element pre-positioned
// on a transparent canvas, so stacking them at inset:0 reproduces the original
// poster exactly while letting each layer animate independently.
const POSTER_LAYER_VERSION = 'v=20260424-2';
const POSTER_LAYER_SRC = {
  // frame.png now bakes in the letter text — no separate text layer needed.
  frame: `/poster-layers/frame.png?${POSTER_LAYER_VERSION}`,
  borderTop: `/poster-layers/border-top.png?${POSTER_LAYER_VERSION}`,
  borderLeft: `/poster-layers/border-left.png?${POSTER_LAYER_VERSION}`,
  borderRight: `/poster-layers/border-right.png?${POSTER_LAYER_VERSION}`,
  flowerLeft: `/poster-layers/flower-left.png?${POSTER_LAYER_VERSION}`,
  flowerRight: `/poster-layers/flower-right.png?${POSTER_LAYER_VERSION}`,
  palm: `/poster-layers/palm.png?${POSTER_LAYER_VERSION}`,
  lighthouse: `/poster-layers/lighthouse.png?${POSTER_LAYER_VERSION}`,
  beach: `/poster-layers/beach.png?${POSTER_LAYER_VERSION}`,
} as const;

const GALCODE_POSTER_LAYER_VERSION = 'v=20260504-1';
const GALCODE_POSTER_LAYER_SRC = {
  frame: `/galcode-poster-layers/frame.png?${GALCODE_POSTER_LAYER_VERSION}`,
  borderTop: `/galcode-poster-layers/border-top.png?${GALCODE_POSTER_LAYER_VERSION}`,
  borderLeft: `/galcode-poster-layers/border-left.png?${GALCODE_POSTER_LAYER_VERSION}`,
  borderRight: `/galcode-poster-layers/border-right.png?${GALCODE_POSTER_LAYER_VERSION}`,
  flowerLeft: `/galcode-poster-layers/flower-left.png?${GALCODE_POSTER_LAYER_VERSION}`,
  flowerRight: `/galcode-poster-layers/flower-right.png?${GALCODE_POSTER_LAYER_VERSION}`,
  palm: `/galcode-poster-layers/palm.png?${GALCODE_POSTER_LAYER_VERSION}`,
  lighthouse: `/galcode-poster-layers/lighthouse.png?${GALCODE_POSTER_LAYER_VERSION}`,
  beach: `/galcode-poster-layers/beach.png?${GALCODE_POSTER_LAYER_VERSION}`,
} as const;

type PosterLayerSrc = { frame: string; borderTop: string; borderLeft: string; borderRight: string; flowerLeft: string; flowerRight: string; palm: string; lighthouse: string; beach: string };
type PosterTheme = {
  loaderGlow: string;
  ctaBackground: string;
  ctaShadow: string;
  ctaTextColor: string;
  bottomBlend: string;
  flowerGlow: {
    off: string;
    on: string;
  };
  layerFilter?: string;
};

const LIFESTYLE_POSTER_THEME: PosterTheme = {
  loaderGlow: '#FFD700',
  ctaBackground: '#FFD700',
  ctaShadow: '0 -22px 36px rgba(255,215,0,0.45), 0 -10px 18px rgba(255,215,0,0.55), 0 -3px 8px rgba(255,215,0,0.8)',
  ctaTextColor: '#111',
  bottomBlend: 'linear-gradient(to bottom, rgba(255,215,0,0) 0%, rgba(255,215,0,0.04) 25%, rgba(255,215,0,0.16) 50%, rgba(255,215,0,0.42) 72%, rgba(255,215,0,0.78) 88%, rgba(255,215,0,1) 100%)',
  flowerGlow: {
    off: 'drop-shadow(0 0 0px rgba(255,215,0,0)) drop-shadow(0 0 0px rgba(255,215,0,0))',
    on: 'drop-shadow(0 0 6px rgba(255,215,0,0.85)) drop-shadow(0 0 14px rgba(255,215,0,0.55))',
  },
};

const GALCODE_POSTER_THEME: PosterTheme = {
  loaderGlow: '#FF4FB8',
  ctaBackground: '#FF4FB8',
  ctaShadow: '0 -22px 36px rgba(255,79,184,0.32), 0 -10px 18px rgba(255,79,184,0.42), 0 -3px 8px rgba(255,79,184,0.62)',
  ctaTextColor: '#FFFFFF',
  bottomBlend: 'linear-gradient(to bottom, rgba(255,79,184,0) 0%, rgba(255,79,184,0.04) 25%, rgba(255,79,184,0.16) 50%, rgba(255,79,184,0.42) 72%, rgba(255,79,184,0.78) 88%, rgba(255,79,184,1) 100%)',
  flowerGlow: {
    off: 'drop-shadow(0 0 0px rgba(255,79,184,0)) drop-shadow(0 0 0px rgba(255,79,184,0))',
    on: 'drop-shadow(0 0 6px rgba(255,79,184,0.85)) drop-shadow(0 0 14px rgba(255,79,184,0.55))',
  },
};

// Base style that every layer shares — each PNG fills the full poster area.
// Transforms (rotate / scale / translate) are layered on top per-element.
const POSTER_LAYER_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'block',
  objectFit: 'cover',
  objectPosition: 'bottom center',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  pointerEvents: 'none',
};

// Tuning controls for the soft dark patch that blends the palm root into the
// beach. Values are percentages of the poster canvas, so they scale cleanly.
const PALM_ROOT_BLEND = {
  left: 6.5,
  top: 91.0,
  width: 4.2,
  height: 4.2,
  opacity: 1.0,
  blurPx: 3,
  radius: 35,
  color: 'rgba(0, 0, 0, 0.86)',
  featherColor: 'rgba(0, 0, 0, 0.86)',
};

// Tuning controls for the lighthouse beacon. left/top mark the lamp center.
const LIGHTHOUSE_LAMP_DOT = {
  left: 77.0,
  top: 67.0,
  spread: 18.9,
  centerStop: 4,
  midStop: 35,
  minOpacity: 0.0,
  maxOpacity: 1.0,
  pulseSeconds: 0.5,
  pauseSeconds: 4.4,
};

const LIGHTHOUSE_FLOAT = {
  animate: { y: [-1.5, 1.5, -1.5] },
  transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' as const },
};

function JoinLetterPage({
  onContinue,
  ctaLabel = 'Tap to Enter',
  ctaIcon = 'arrow',
  layers = POSTER_LAYER_SRC,
  theme = LIFESTYLE_POSTER_THEME,
}: {
  onContinue: () => void;
  ctaLabel?: string;
  ctaIcon?: 'arrow' | 'download';
  layers?: PosterLayerSrc;
  theme?: PosterTheme;
}) {
  const [posterLoaded, setPosterLoaded] = useState(false);

  useEffect(() => {
    setPosterLoaded(false);
    let cancelled = false;
    // Preload every layer — only reveal the poster once all are cached,
    // so the scene doesn't "pop in" piece by piece on first render.
    const loaders = Object.values(layers).map(src =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      }),
    );
    Promise.all(loaders).then(() => { if (!cancelled) setPosterLoaded(true); });
    // Safety fallback — if any layer never resolves (slow/hung network),
    // reveal the page anyway after 6s so the user is never stuck on the loader.
    const timeout = window.setTimeout(() => {
      if (!cancelled) setPosterLoaded(true);
    }, 6000);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [layers]);

  const handleCardPress = () => onContinue();
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    handleCardPress();
  };

  if (!posterLoaded) {
    return (
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
            className="absolute inset-0 rounded-2xl"
            style={{ background: theme.loaderGlow, filter: 'blur(10px)' }}
          />
          <div className="relative w-16 h-16 rounded-2xl bg-black shadow-xl overflow-hidden p-1.5">
            <img src={chatProfile} alt="chapter அ" className="w-full h-full object-contain scale-[1.02] translate-y-[2px]" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-white sm:min-h-screen sm:h-auto sm:bg-gray-100 flex items-stretch sm:items-center justify-center font-sans p-0 sm:p-4">
      <div className="w-full bg-white overflow-hidden flex flex-col h-[100dvh] sm:max-w-md sm:h-[85vh] relative sm:rounded-[2rem] sm:shadow-2xl sm:border-4 sm:border-white" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
        <div style={{ height: '100%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px, 2.2vh, 20px)' }}>
          <div
            style={{
              width: 'min(90vw, 360px)',
              overflow: 'hidden',
              color: '#232323',
              fontFamily: "'DM Sans', sans-serif",
              position: 'relative',
              borderRadius: '0 0 2rem 2rem',
              boxShadow: 'none',
              border: 'none',
              background: '#fff',
            }}
          >
          <div
            style={{
              height: 'auto',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                aspectRatio: '874 / 1330',
                overflow: 'hidden',
                display: 'block',
                position: 'relative',
                background: '#FFFFFF',
              }}
            >
              {/* 1. Base frame — arch + paper + letter text, all static. */}
              <img
                src={layers.frame}
                alt="Chapter A founder letter"
                aria-hidden="false"
                style={{ ...POSTER_LAYER_STYLE, filter: theme.layerFilter }}
              />

              {/* 2. Decorative yellow borders — noticeable opacity breathing,
                     each offset in phase so the frame feels alive as a whole
                     but never in a mechanical pulse. */}
              <motion.img
                src={layers.borderTop}
                alt=""
                aria-hidden="true"
                style={{ ...POSTER_LAYER_STYLE, filter: theme.layerFilter }}
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.img
                src={layers.borderLeft}
                alt=""
                aria-hidden="true"
                style={{ ...POSTER_LAYER_STYLE, filter: theme.layerFilter }}
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 4.2, delay: 0.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.img
                src={layers.borderRight}
                alt=""
                aria-hidden="true"
                style={{ ...POSTER_LAYER_STYLE, filter: theme.layerFilter }}
                animate={{ opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 4.8, delay: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* 3. Flowers — gentle counter-rotation + soft scale pulse with
                     a #FFD700 golden drop-shadow glow that sparkles in/out,
                     pivots at each flower's own center so the motion feels
                     rooted in the blossom rather than the canvas. */}
              <motion.img
                src={layers.flowerLeft}
                alt=""
                aria-hidden="true"
                style={{ ...POSTER_LAYER_STYLE, transformOrigin: '18% 11%' }}
                animate={{
                  rotate: [-3, 3, -3],
                  scale: [1, 1.04, 1],
                  filter: [
                    theme.flowerGlow.off,
                    theme.flowerGlow.on,
                    theme.flowerGlow.off,
                  ],
                }}
                transition={{
                  rotate: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
                  scale:  { duration: 6, repeat: Infinity, ease: 'easeInOut' },
                  filter: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' },
                }}
              />
              <motion.img
                src={layers.flowerRight}
                alt=""
                aria-hidden="true"
                style={{ ...POSTER_LAYER_STYLE, transformOrigin: '84% 12%' }}
                animate={{
                  rotate: [3, -3, 3],
                  scale: [1, 1.03, 1],
                  filter: [
                    theme.flowerGlow.off,
                    theme.flowerGlow.on,
                    theme.flowerGlow.off,
                  ],
                }}
                transition={{
                  rotate: { duration: 9, delay: 0.4, repeat: Infinity, ease: 'easeInOut' },
                  scale:  { duration: 7, delay: 0.4, repeat: Infinity, ease: 'easeInOut' },
                  filter: { duration: 3.4, delay: 1.7, repeat: Infinity, ease: 'easeInOut' },
                }}
              />

              {/* 4. Lighthouse island — sits behind the beach so the waves
                     read as foreground. Barely-there vertical float for a
                     hazy-distance feel. */}
              <motion.img
                src={layers.lighthouse}
                alt=""
                aria-hidden="true"
                style={{ ...POSTER_LAYER_STYLE, filter: theme.layerFilter }}
                animate={LIGHTHOUSE_FLOAT.animate}
                transition={LIGHTHOUSE_FLOAT.transition}
              />

              {/* 5. Beach — static, rendered above the lighthouse so the
                     shoreline covers the island's base. */}
              <img
                src={layers.beach}
                alt=""
                aria-hidden="true"
                style={{ ...POSTER_LAYER_STYLE, filter: theme.layerFilter }}
              />

              {/* 6. Lighthouse lamp — a tiny pulsing beacon at the lamp tip. */}
              <motion.div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: `${LIGHTHOUSE_LAMP_DOT.left}%`,
                  top: `${LIGHTHOUSE_LAMP_DOT.top}%`,
                  width: `${LIGHTHOUSE_LAMP_DOT.spread}%`,
                  aspectRatio: '1 / 1',
                  borderRadius: '999px',
                  pointerEvents: 'none',
                  transform: 'translate(-50%, -50%)',
                  background:
                    `radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.82) ${LIGHTHOUSE_LAMP_DOT.centerStop}%, rgba(255,255,255,0.28) ${LIGHTHOUSE_LAMP_DOT.midStop}%, rgba(255,255,255,0) 100%)`,
                }}
                animate={{
                  ...LIGHTHOUSE_FLOAT.animate,
                  opacity: [
                    LIGHTHOUSE_LAMP_DOT.minOpacity,
                    LIGHTHOUSE_LAMP_DOT.maxOpacity,
                    LIGHTHOUSE_LAMP_DOT.minOpacity,
                  ],
                }}
                transition={{
                  y: LIGHTHOUSE_FLOAT.transition,
                  opacity: {
                    duration: LIGHTHOUSE_LAMP_DOT.pulseSeconds,
                    repeat: Infinity,
                    repeatDelay: LIGHTHOUSE_LAMP_DOT.pauseSeconds,
                    ease: 'easeInOut',
                  },
                }}
              />

              {/* 7. Lone palm — top of the illustration stack so the trunk
                     and fronds stand in front of water and island alike.
                     Slow sway from the trunk base. Bottom ~6% of the layer
                     fades to transparent so the trunk merges into the sand
                     behind it instead of terminating in a hard edge. */}
              <motion.img
                src={layers.palm}
                alt=""
                aria-hidden="true"
                style={{
                  ...POSTER_LAYER_STYLE,
                  filter: theme.layerFilter,
                  transformOrigin: '16% 94%',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 90%, rgba(0,0,0,0.55) 94%, rgba(0,0,0,0.18) 97%, transparent 100%)',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskSize: '100% 100%',
                  maskImage: 'linear-gradient(to bottom, black 0%, black 90%, rgba(0,0,0,0.55) 94%, rgba(0,0,0,0.18) 97%, transparent 100%)',
                  maskRepeat: 'no-repeat',
                  maskSize: '100% 100%',
                }}
                animate={{ rotate: [-1.8, 1.8, -1.8] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* 8. Palm root blend — tune PALM_ROOT_BLEND above for placement. */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: `${PALM_ROOT_BLEND.left}%`,
                  top: `${PALM_ROOT_BLEND.top}%`,
                  width: `${PALM_ROOT_BLEND.width}%`,
                  height: `${PALM_ROOT_BLEND.height}%`,
                  borderRadius: `${PALM_ROOT_BLEND.radius}%`,
                  opacity: PALM_ROOT_BLEND.opacity,
                  pointerEvents: 'none',
                  background: `radial-gradient(ellipse at center, ${PALM_ROOT_BLEND.color} 0%, rgba(22, 23, 18, 0.48) 34%, ${PALM_ROOT_BLEND.featherColor} 72%)`,
                  filter: `blur(${PALM_ROOT_BLEND.blurPx}px)`,
                  mixBlendMode: 'multiply',
                }}
              />

              {/* 9. Bottom yellow blend into the CTA — unchanged. */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 42,
                  pointerEvents: 'none',
                  background:
                    theme.bottomBlend,
                }}
              />
            </div>
            <button
              type="button"
              aria-label="Enter chapter plans"
              onClick={(e) => { e.stopPropagation(); onContinue(); }}
              style={{
                flexShrink: 0,
                width: '100%',
                height: '72px',
                maxHeight: '72px',
                border: 'none',
                borderRadius: '0 0 2rem 2rem',
                background: theme.ctaBackground,
                color: theme.ctaTextColor,
                cursor: 'pointer',
                overflow: 'visible',
                position: 'relative',
                marginTop: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: theme.ctaShadow,
                transition: 'transform 160ms ease',
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.995)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.995)'; }}
              onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: '-8px 0 0 0',
                  pointerEvents: 'none',
                  borderRadius: 'inherit',
                  overflow: 'visible',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.58) 22%, rgba(0,0,0,0.9) 46%, rgba(0,0,0,1) 100%)',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskSize: '100% 100%',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.58) 22%, rgba(0,0,0,0.9) 46%, rgba(0,0,0,1) 100%)',
                  maskRepeat: 'no-repeat',
                  maskSize: '100% 100%',
                }}
              >
                <motion.span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    inset: '0 auto 0 -50%',
                    width: '50%',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                    transform: 'skewX(-14deg)',
                    filter: 'blur(1.4px)',
                  }}
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 3.0, ease: 'easeInOut' }}
                />
              </span>
              <span
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 'clamp(16px, 2.6vw, 20px)',
                  fontWeight: 900,
                  letterSpacing: '0',
                  lineHeight: 1,
                  color: theme.ctaTextColor,
                }}
              >
                <span>{ctaLabel}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {ctaIcon === 'download' ? <Download size={20} strokeWidth={3} /> : <ArrowRight size={20} strokeWidth={3} />}
                </span>
              </span>
            </button>
          </div>
      </div>
      </div>
    </div>
    </div>
  );
}

// ─── INVITE FLOW ──────────────────────────────────────────────────────────────

// Reuse the same layer sources and constants from JoinLetterPage
const INVITE_LAYER_SRC = {
  frame: `/poster-layers/invite-frame.png?v=1`,
  borderTop: POSTER_LAYER_SRC.borderTop,
  borderLeft: POSTER_LAYER_SRC.borderLeft,
  borderRight: POSTER_LAYER_SRC.borderRight,
  flowerLeft: POSTER_LAYER_SRC.flowerLeft,
  flowerRight: POSTER_LAYER_SRC.flowerRight,
  palm: POSTER_LAYER_SRC.palm,
  lighthouse: POSTER_LAYER_SRC.lighthouse,
  beach: POSTER_LAYER_SRC.beach,
};

type InviteStep = 'card' | 'timeline' | 'bill';

type SharedInviteMatch = {
  slug: string;
  eventSlug?: string;
  title: string;
  dateLabel: string;
  status?: string;
  inviteSpots?: number | null;
};

function InviteChatEssentialsCard({
  quickInfo,
  transportPlan,
  pickupPoints,
  firstDate,
  savedPickupPointId,
}: {
  quickInfo: Array<{ label: string; value: string }>;
  transportPlan: Array<{ time?: string; [key: string]: any }>;
  pickupPoints?: Array<{ id?: string; label?: string; meetingSpot?: string; meeting_spot?: string; location?: string; time?: string; transport?: string; [key: string]: any }>;
  firstDate?: string;
  savedPickupPointId?: string | null;
}) {
  // Essentials card source of truth = pickup_points. We deliberately do NOT
  // read from quick_info (the "Plan card" admin field) — admins editing the
  // pickup points should never have to also sync a parallel free-text copy.
  // Every event is guaranteed to have at least one pickup point.
  //
  // Resolution: prefer the user's known pickup; otherwise use the first one.
  const points = pickupPoints ?? [];
  const userPoint =
    (savedPickupPointId ? points.find(p => p.id === savedPickupPointId) ?? null : null) ??
    points[0];

  const resolvedMeetingSpot = userPoint?.meetingSpot ?? userPoint?.meeting_spot ?? userPoint?.label ?? '';
  const resolvedTransport   = userPoint?.transport ?? '';
  const firstTime           = userPoint?.time ?? '';

  const dateStr = firstDate ?? '';

  if (!resolvedMeetingSpot && !resolvedTransport && !dateStr) return null;

  const d       = dateStr ? new Date(dateStr + 'T00:00:00') : null;
  const day     = d ? d.getDate().toString() : '';
  const month   = d ? d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '';
  const weekday = d ? d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() : '';

  return (
    <div className="mb-4">
      <p className="text-[10px] font-bold text-[#2C7FFF] uppercase tracking-widest mb-2 px-1">The Essentials</p>
      <div className="border border-dashed border-[#2C7FFF] rounded-2xl overflow-hidden bg-white">
        <div className="flex">
          <div className="flex-1 flex flex-col">
            {resolvedMeetingSpot && (
              <div className="px-4 py-3 border-b border-dashed border-[#D4E5FF]">
                <div className="flex items-center gap-1 mb-1">
                  <MapPin size={9} className="text-gray-400" />
                  <span className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider">Meeting Spot</span>
                </div>
                <span className="text-[13px] font-black text-gray-900 leading-tight">{resolvedMeetingSpot}</span>
              </div>
            )}
            {resolvedTransport && (
              <div className="px-4 py-3">
                <div className="flex items-center gap-1 mb-1">
                  <Bus size={9} className="text-gray-400" />
                  <span className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider">Transport</span>
                </div>
                <span className="text-[13px] font-black text-gray-900 leading-tight">{resolvedTransport}</span>
              </div>
            )}
          </div>
          {d && (
            <div className="border-l border-dashed border-[#D4E5FF] flex flex-col items-center justify-center px-5 py-4 bg-white gap-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{weekday}</span>
              <span className="text-[44px] font-black text-gray-900 leading-none">{day}</span>
              <span className="text-[14px] font-black text-gray-900 leading-tight">{month}</span>
              {firstTime && <span className="text-[13px] font-bold text-gray-900 mt-1.5">{firstTime}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type InvitePlanDetails = {
  quickInfo?: Array<{ label: string; value: string }>;
  included?: string[];
  itinerary?: Array<{
    day?: string;
    title?: string;
    description?: string;
    schedule?: Array<{ time?: string; activity?: string }>;
  }>;
  accommodation?: {
    name?: string;
    images?: string[];
    features?: string[];
    policy?: string;
    stays?: Array<{ name?: string; image?: string; images?: string[]; features?: string[] }>;
  };
  showAccommodation?: boolean;
};

function InvitePlanDetailsSheet({
  open,
  onClose,
  title,
  details,
  onPayAdvance,
  isFullyPaid = false,
  isBalancePayment = false,
  isFullPay = false,
  whatsappGroupUrl,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  details: InvitePlanDetails | null;
  onPayAdvance?: () => void;
  isFullyPaid?: boolean;
  isBalancePayment?: boolean;
  isFullPay?: boolean;
  whatsappGroupUrl?: string;
}) {
  const [expandedItinerary, setExpandedItinerary] = useState<number | null>(0);
  const [stayImageIndexes, setStayImageIndexes] = useState<Record<number, number>>({});
  const quickInfo = details?.quickInfo ?? [];
  const planTitle = quickInfo.find(c => c.label === 'Plan Title')?.value || 'The Plan';
  const meetingSpot = quickInfo.find(c => c.label === 'Meeting Spot' || c.label === 'Venue') || quickInfo[0];
  const transport = quickInfo.find(c => c.label === 'Transport' || c.label === 'Format') || quickInfo[1];
  const groupSize = quickInfo.find(c => c.label === 'Group Size') || quickInfo[2];
  const madeFor = quickInfo.find(c => c.label === "You'll Meet" || c.label === 'Made For') || quickInfo[3];
  const groupNum = groupSize?.value.match(/\d+[-–]\d+|\d+/)?.[0] || groupSize?.value || 'Limited';
  const included = (details?.included ?? []).filter(Boolean);
  const itinerary = (details?.itinerary ?? []).filter(item => item?.title || item?.description || (item?.schedule ?? []).length > 0);
  const accommodation = details?.accommodation;
  const stays = (accommodation?.stays && accommodation.stays.length > 0)
    ? accommodation.stays
    : accommodation?.name || (accommodation?.features ?? []).length > 0 || (accommodation?.images ?? []).length > 0
      ? [{ name: accommodation?.name, images: accommodation?.images, features: accommodation?.features }]
      : [];
  const roomSharingPolicy = accommodation?.policy === 'Twin sharing by default; limited solo upgrade on request'
    || accommodation?.policy === 'Twin sharing by default; upgrade to solo room on request'
    ? "Rooms are same-gender — so everyone's comfortable"
    : accommodation?.policy;
  const showStay = Boolean(details?.showAccommodation && stays.length > 0);

  useEffect(() => {
    if (!open) return;
    setExpandedItinerary(0);
    setStayImageIndexes({});
  }, [open, title]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-[90] flex items-end bg-black/35"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 -top-10 z-20 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
              aria-label="Close plan details"
            >
              <X size={14} />
            </button>

            <div className="bg-white rounded-t-[2rem] shadow-2xl overflow-hidden">
              <style>{`
                .invite-details-scroll { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.18) transparent; }
                .invite-details-scroll::-webkit-scrollbar { width: 3px; }
                .invite-details-scroll::-webkit-scrollbar-track { background: transparent; margin-top: 28px; margin-bottom: 8px; }
                .invite-details-scroll::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.18); border-radius: 99px; border-top: 16px solid transparent; border-bottom: 16px solid transparent; background-clip: content-box; }
              `}</style>
              <div className="invite-details-scroll overflow-y-auto" style={{ maxHeight: '78dvh' }}>
              <div className="pt-5 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-black mb-4 px-6">{planTitle}</h3>
                <div className="mx-3 border border-dashed border-[#595959] rounded-2xl overflow-hidden bg-gray-50">
                  <div className="flex border-b border-dashed border-[#bfbfbf]/50">
                    <div className="flex-1 px-3 py-3.5 border-r border-dashed border-[#bfbfbf]/50">
                      <div className="flex items-center gap-1 mb-1.5">
                        <MapPin size={9} className="text-gray-500" />
                        <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">{meetingSpot?.label || 'Meeting Spot'}</span>
                      </div>
                      <span className="text-[13px] font-black text-gray-900 leading-tight">{meetingSpot?.value || 'To be shared'}</span>
                    </div>
                    <div className="flex-1 px-3 py-3.5">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Bus size={9} className="text-gray-500" />
                        <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">{transport?.label || 'Transport'}</span>
                      </div>
                      <span className="text-[13px] font-black text-gray-900 leading-tight">{transport?.value || 'To be shared'}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex-1 px-3 py-4 border-r border-dashed border-[#bfbfbf]/50">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Heart size={9} className="text-gray-500" />
                        <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">You'll Meet</span>
                      </div>
                      <span className="text-[14px] font-black text-gray-900 leading-snug">{madeFor?.value || 'chapter அ people'}</span>
                    </div>
                    <div className="px-3 py-4 flex flex-col items-start flex-shrink-0">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Users size={9} className="text-gray-500" />
                        <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">Gang Size</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[20px] font-black text-gray-900 leading-none">{groupNum}</span>
                        {/\d/.test(groupNum) && <span className="text-[13px] font-black text-gray-900 leading-none">ppl</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {included.length > 0 && (
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-black mb-4">What's Included</h3>
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="p-4 space-y-3">
                      {included.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm font-medium text-gray-800">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {itinerary.length > 0 && (
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-xl font-black mb-4">You'll Experience</h3>
                  <div className="space-y-3">
                    {itinerary.map((day, i) => (
                      <div key={i} className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                        <button
                          type="button"
                          onClick={() => setExpandedItinerary(expandedItinerary === i ? null : i)}
                          className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]"
                        >
                          <div>
                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-[0.08em]">{day.day || `Day ${i + 1}`}</span>
                            {day.title && <h4 className="font-semibold text-gray-900 mt-0.5">{day.title}</h4>}
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
                                {day.description && (
                                  <p className="text-sm text-gray-600 leading-relaxed mb-4 mt-3">
                                    {day.description}
                                  </p>
                                )}
                                {(day.schedule ?? []).filter(item => item.time || item.activity).length > 0 && (
                                  <div className="relative pl-4 border-l border-gray-900/10 space-y-5 mt-4 ml-2 mb-2">
                                    {(day.schedule ?? []).filter(item => item.time || item.activity).map((item, idx) => (
                                      <div key={idx} className="relative">
                                        <div className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full bg-[#ffd700]" />
                                        {item.time && <div className="text-xs font-bold text-gray-400 mb-0.5 tracking-wide uppercase">{item.time}</div>}
                                        {item.activity && <div className="text-sm font-medium text-gray-800">{item.activity}</div>}
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
              )}

              {showStay && (
                <div className="p-6">
                  <h3 className="text-xl font-black mb-4">Where We Stay</h3>
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                    {stays.map((stay, i) => {
                      const images = (stay.images ?? []).filter(Boolean);
                      const allImages = images.length > 0 ? images : (stay.image ? [stay.image] : []);
                      const currentIndex = Math.max(0, Math.min(stayImageIndexes[i] ?? 0, Math.max(allImages.length - 1, 0)));
                      return (
                        <div key={i} className={i > 0 ? 'border-t border-gray-200' : ''}>
                          <div className="relative w-full aspect-[4/3]">
                            {allImages.length > 0 ? (
                              <>
                                <img src={allImages[currentIndex]} alt={stay.name || `Stay ${i + 1}`} className="w-full h-full object-cover" />
                                {allImages.length > 1 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setStayImageIndexes(prev => ({ ...prev, [i]: (currentIndex - 1 + allImages.length) % allImages.length }))}
                                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                                      aria-label="Previous stay photo"
                                    >
                                      <ChevronLeft size={20} className="text-gray-800 pr-0.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setStayImageIndexes(prev => ({ ...prev, [i]: (currentIndex + 1) % allImages.length }))}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                                      aria-label="Next stay photo"
                                    >
                                      <ChevronRight size={20} className="text-gray-800 pl-0.5" />
                                    </button>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                                      {allImages.map((_, imgIndex) => (
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
                            )}
                          </div>
                          <div className="p-4">
                            <div className="text-[11px] font-black text-gray-900 uppercase tracking-[0.08em] mb-2">
                              Night {i + 1}
                            </div>
                            <h4 className="font-bold text-lg mb-3">{stay.name || `Stay ${i + 1}`}</h4>
                            {(stay.features ?? []).filter(Boolean).length > 0 && (
                              <ul className="space-y-2">
                                {(stay.features ?? []).filter(Boolean).map((feature, idx) => (
                                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                                    {feature}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {i === stays.length - 1 && roomSharingPolicy && (
                              <div className="mt-4 bg-emerald-50 p-3 rounded-xl text-sm font-medium text-emerald-800 border border-emerald-100 flex items-start gap-2">
                                <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                <span>{roomSharingPolicy}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {!isFullyPaid && onPayAdvance && (
                <div className="px-5 pb-8">
                  <button
                    type="button"
                    onClick={onPayAdvance}
                    className="w-full py-4 rounded-2xl text-white font-black text-[17px] flex items-center justify-center gap-2 active:opacity-90 transition-all relative overflow-hidden"
                    style={{ backgroundColor: '#22C55E' }}
                  >
                    <motion.div
                      className="absolute inset-0 -skew-x-12 pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)', width: '50%' }}
                      animate={{ x: ['-100%', '300%'] }}
                      transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
                    />
                    <span>{isFullPay ? 'Pay Now' : isBalancePayment ? 'Pay Balance' : 'Pay Advance'}</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              )}
              {/* Fully-paid users see the Join Groupchat CTA in place of Pay.
                  AiSensy template buttons can't link to chat.whatsapp.com
                  directly (Meta blocks it) — this is the workaround: the
                  template links here and we relay the real group URL. */}
              {isFullyPaid && whatsappGroupUrl && (
                <div className="px-5 pb-8">
                  <a
                    href={whatsappGroupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 rounded-2xl text-white font-black text-[17px] flex items-center justify-center gap-2 active:opacity-90 transition-all relative overflow-hidden"
                    style={{ backgroundColor: '#22C55E' }}
                  >
                    <motion.div
                      className="absolute inset-0 -skew-x-12 pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)', width: '50%' }}
                      animate={{ x: ['-100%', '300%'] }}
                      transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
                    />
                    <span>Join Groupchat</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </a>
                </div>
              )}
              {/* Fully paid but no group URL configured on the event_dates row
                  → keep the spacer (no message, per the design decision). */}
              {isFullyPaid && !whatsappGroupUrl && <div className="h-8" />}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SharedInviteFlow({ onNavigateToLifestyle }: { onNavigateToLifestyle: () => void }) {
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [isRetryLoading, setIsRetryLoading] = useState(() => !!sessionStorage.getItem('ca_payu_retry_chat'));
  // Timeline restore takes priority over bill restore. If a back-from-retry-bill
  // queued ca_payu_timeline, we must NOT also fire the bill restore — otherwise
  // the bill briefly flashes on top after the timeline is set, looking like the
  // back press did nothing.
  const [isBillRestoreLoading, setIsBillRestoreLoading] = useState(() =>
    !!sessionStorage.getItem('ca_payu_bill') && !sessionStorage.getItem('ca_payu_timeline')
  );
  const [isTimelineRestoreLoading, setIsTimelineRestoreLoading] = useState(() => !!sessionStorage.getItem('ca_payu_timeline'));
  const [inviteApplicationCount, setInviteApplicationCount] = useState<number | null>(null);
  const [inviteReservedCount, setInviteReservedCount] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasFailedOnce, setHasFailedOnce] = useState(false);
  const [matches, setMatches] = useState<SharedInviteMatch[]>([]);
  const [wipePhase, setWipePhase] = useState<'idle' | 'wiping' | 'revealed' | 'returning'>('idle');
  const [pendingSlug, setPendingSlug] = useState('');
  const [verifiedSlug, setVerifiedSlug] = useState('');
  const [pendingInviteSpots, setPendingInviteSpots] = useState<number | null>(null);
  const [wipingToLifestyle, setWipingToLifestyle] = useState(false);
  const [tcAccepted, setTcAccepted] = useState(false);
  const [showTcModal, setShowTcModal] = useState(false);
  // Native-application payment overlay
  const [nativeEventData, setNativeEventData] = useState<{ priceAdvance: number; priceFull: number; paymentMode?: string; girlsOnly?: boolean; title: string; firstDate: string; bookingSteps?: Array<{ label: string; value: string; date?: string }>; announcements?: string[]; planDetails?: InvitePlanDetails; transportPlan?: any[]; isBalancePayment?: boolean; isFullyPaid?: boolean; whatsappGroupUrl?: string; inviteSlug?: string; eventSlug?: string; inviteSpots?: number | null; inviteFaqs?: Array<{ question: string; answer: string }>; resolvedCity?: string } | null>(null);
  const [showNativeTimeline, setShowNativeTimeline] = useState(false);
  const [showNativeBill, setShowNativeBill] = useState(false);
  const [showNativeConfirmation, setShowNativeConfirmation] = useState(false);
  // Email from the user's application keyed by canonical event_slug. Populated
  // by verifyPhone (the existing get-user-context lookup) and passed straight
  // into NativePaymentOverlay as prefillEmail + lockEmail — so the bill renders
  // with the email already in hand. No duplicate fetch, no skeleton flicker.
  const [appEmailBySlug, setAppEmailBySlug] = useState<Record<string, string>>({});
  // Chat overlay state
  const [chatOpen, setChatOpen] = useState(false);
  // 0 = typing dots only, 1 = messages visible, 2 = reply card visible
  const [chatRevealStep, setChatRevealStep] = useState<0 | 1 | 2>(0);
  const [chatTransitioning, setChatTransitioning] = useState(false);
  const [chatEventQuickInfo, setChatEventQuickInfo] = useState<Array<{ label: string; value: string }>>([]);
  const [chatEventTransportPlan, setChatEventTransportPlan] = useState<any[]>([]);
  const [chatEventPickupPoints, setChatEventPickupPoints] = useState<any[]>([]);
  const [savedPickupPointId, setSavedPickupPointId] = useState<string | null>(null);
  const [inviteChatStep, setInviteChatStep] = useState<'prompt' | 'has_doubt' | 'other_topic' | 'doubt_submitted' | 'waitlist'>('prompt');
  const [isInviteTyping, setIsInviteTyping] = useState(false);
  const [inviteMessages, setInviteMessages] = useState<Array<{ id: string; sender: 'bot' | 'user'; text: string; time: string }>>([]);
  const [doubtText, setDoubtText] = useState('');
  const [doubtSubmitError, setDoubtSubmitError] = useState('');
  const [submittingDoubt, setSubmittingDoubt] = useState(false);
  // liveConversationId path is deprecated (consumer live chat retired —
  // 0 rows ever in doubt_conversations/doubt_messages in prod; RLS denies
  // anon INSERTs anyway). State retained for JSX compatibility but no
  // longer rehydrates from localStorage so stale IDs don't leak across
  // sessions on shared devices.
  const [liveConversationId, setLiveConversationId] = useState<string | null>(
    () => null
  );
  const [liveMessages, setLiveMessages] = useState<any[]>([]);
  const [liveChatInput, setLiveChatInput] = useState('');
  const [liveChatSending, setLiveChatSending] = useState(false);
  const [liveConvResolved, setLiveConvResolved] = useState(false);
  const liveChatEndRef = useRef<HTMLDivElement>(null);
  const [askedFaqs, setAskedFaqs] = useState<number[]>([]);
  const [inviteAnnouncementIndex, setInviteAnnouncementIndex] = useState(0);
  const [showPlanDetailsSheet, setShowPlanDetailsSheet] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatTransitionTimerRef = useRef<number | null>(null);
  const restoreInvitePickerOnChatBackRef = useRef(false);
  // Set to true when chat is opened via payment retry — back button is disabled in that case
  const isRetryChatRef = useRef(false);
  const [billRestored, setBillRestored] = useState(false); // true when overlay is re-opened via browser-back from PayU
  const verificationFrameControls = useAnimation();

  const isPhoneReady = /^\d{10}$/.test(form.phone);
  const isFormReady = form.name.trim().length > 0 && isPhoneReady && tcAccepted;
  const isInviteRevealed = wipePhase === 'revealed';
  const isLifestyleRevealed = wipingToLifestyle && isInviteRevealed;
  const isLifestyleRevealing = wipingToLifestyle && (wipePhase === 'wiping' || wipePhase === 'revealed');
  const isChoosingInvitePlan = isInviteRevealed && matches.length > 0 && !verifiedSlug;
  const normalizeInviteStatus = (status?: string) => status === 'full_paid' ? 'fully_paid' : (status ?? 'pending');
  const isInviteActionableStatus = (status?: string) => ['invited', 'advance_paid', 'fully_paid'].includes(normalizeInviteStatus(status));
  const invitePlanStatus = (status?: string) => {
    switch (normalizeInviteStatus(status)) {
      case 'fully_paid':
        return { label: 'Fully paid', tone: 'white' };
      case 'advance_paid':
        return { label: 'Advance paid', tone: 'solidGreen' };
      case 'invited':
        return { label: 'Invited', tone: 'green' };
      case 'waitlist':
        return { label: 'On waitlist', tone: 'muted' };
      default:
        return { label: 'Application in review', tone: 'muted' };
    }
  };


  useEffect(() => {
    let cancelled = false;
    const srcs = [...Object.values(POSTER_LAYER_SRC), '/invite-verification-frame.png', '/tc-agree-text.png', '/tc-link-text.png'];
    const loaders = srcs.map(src => new Promise<void>(resolve => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = src;
    }));
    Promise.all(loaders).then(() => { if (!cancelled) setPosterLoaded(true); });
    const timeout = window.setTimeout(() => { if (!cancelled) setPosterLoaded(true); }, 6000);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, []);

  // Builds & stores nativeEventData for any invite event regardless of booking_url.
  // ALL invite payment flows route through PayU (NativeBookingTimeline → NativePaymentOverlay).
  // Returns { isFullyPaid, inviteSpots } or null if the event can't be found.
  const prepareNativeInviteFlow = async (
    slug: string,
    phone: string,
    matchHint?: { title?: string; inviteSpots?: number | null }
  ): Promise<{ isFullyPaid: boolean; isBalancePayment: boolean; inviteSpots: number | null } | null> => {
    const { data: eventRow } = await supabase
      .from('events')
      .select('slug, title, invite_slug, invite_spots, price_advance, price_full, payment_mode, city_details, cities, booking_steps, quick_info, pickup_points, transport_plan, announcements, included, itinerary, accommodation, show_accommodation, invite_faqs, event_dates(start_date, whatsapp_group_url, booking_steps)')
      .eq('invite_slug', slug)
      .maybeSingle();

    // Fall back to slug match if invite_slug didn't find it
    const event = eventRow ?? (await supabase
      .from('events')
      .select('slug, title, invite_slug, invite_spots, price_advance, price_full, payment_mode, city_details, cities, booking_steps, quick_info, pickup_points, transport_plan, announcements, included, itinerary, accommodation, show_accommodation, invite_faqs, event_dates(start_date, whatsapp_group_url, booking_steps)')
      .eq('slug', slug)
      .maybeSingle()).data;
    if (!event) return null;
    const realSlug: string = event.slug ?? slug;

    // Resolve payment status via the get-user-context edge function (service_role).
    // applications / invite_payment_submissions / invited_numbers are RLS-locked to
    // admins (the C5 PII lockdown dropped anon SELECT), so a direct anon read here
    // returns nothing — which silently defaulted everyone to 'invited' and re-asked
    // for the advance even after it was paid. This mirrors findInviteMatches, which
    // already routes through the same wrapper. The endpoint only returns rows tied
    // to the submitted phone, is CORS-restricted, and is rate-limited.
    const slugSet = new Set([slug, realSlug, event.invite_slug].filter(Boolean));
    const paidStatuses = new Set(['advance_paid', 'fully_paid']);
    let appRow: any = null;
    let inviteRow: any = null;
    let legacyStatus: string | null = null;
    try {
      const ctxRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-context`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ phone }),
      });
      if (ctxRes.ok) {
        const ctx = await ctxRes.json();
        const apps: any[] = Array.isArray(ctx.applications) ? ctx.applications : [];
        const subs: any[] = Array.isArray(ctx.invite_submissions) ? ctx.invite_submissions : [];
        const invs: any[] = Array.isArray(ctx.invites) ? ctx.invites : [];
        appRow = apps.find(a => slugSet.has(a.event_slug)) ?? null;
        inviteRow = invs.find(i => slugSet.has(i.event_slug)) ?? null;
        legacyStatus = subs.find(s => slugSet.has(s.invite_slug) && paidStatuses.has(String(s.status)))?.status ?? null;
      } else {
        console.error('[prepareNativeInviteFlow] get-user-context non-ok', ctxRes.status);
      }
    } catch (err) {
      console.error('[prepareNativeInviteFlow] get-user-context failed', err);
    }
    const appStatus = (appRow?.status as string | undefined) ?? legacyStatus ?? 'invited';
    const isFullyPaid      = appStatus === 'fully_paid';
    const isBalancePayment = appStatus === 'advance_paid';
    // Single-payment event: one charge for the full price (no advance/balance).
    const isFullPay        = (event.payment_mode ?? 'split') === 'full';

    // Seed appEmailBySlug from the applications row so the bill page can
    // pre-fill + lock the email field even on a cold restore path that
    // bypasses verifyPhone (e.g. hard-reload of the bill overlay after
    // the user already submitted their application). Without this, the
    // map is only ever populated by verifyPhone, leaving the email field
    // blank + editable on reload despite the email already being on file.
    const storedEmail = String((appRow as any)?.email ?? '').trim();
    if (storedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storedEmail) && storedEmail !== 'booking@chaptera.in') {
      setAppEmailBySlug(prev => prev[realSlug] === storedEmail ? prev : { ...prev, [realSlug]: storedEmail });
    }

    // Resolve the user's city for per-city pricing:
    // 1. Prefer stored selected_city from their application
    // 2. Fall back to city stored in invited_numbers (set by admin when inviting per-city)
    // 3. Last resort: first non-Other city on the event (single home-city events)
    const storedCity: string | null = (appRow as any)?.selected_city ?? null;
    const inviteCity: string | null = (inviteRow as any)?.city ?? null;
    const cityNames: string[] = Array.isArray(event.cities) ? event.cities : [];
    const resolvedCity: string | null =
      storedCity ??
      inviteCity ??
      (cityNames.filter((c: string) => c !== 'Other')[0] ?? null);

    // Normalize city_details keys to match cities array casing (mirrors AdminPanel normalizeCityDetails)
    const rawCityDetails: Record<string, any> = (event.city_details && typeof event.city_details === 'object') ? event.city_details : {};
    const cityDetails: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawCityDetails)) {
      const canonical = cityNames.find((c: string) => c.toLowerCase() === key.toLowerCase()) ?? key;
      cityDetails[canonical] = { ...(cityDetails[canonical] ?? {}), ...(value as any) };
    }

    const _cd = resolvedCity ? (cityDetails[resolvedCity] ?? null) : null;
    const priceAdvance = Number(_cd?.price_advance > 0 ? _cd.price_advance : (event.price_advance ?? 0));
    const priceFull    = Number(_cd?.price_full    > 0 ? _cd.price_full    : (event.price_full    ?? 0));
    const balanceAmount = Math.max(0, priceFull - priceAdvance);
    const dates = Array.isArray(event.event_dates) ? event.event_dates : [];
    const earliestDate = dates.map((d: any) => String(d.start_date ?? '')).filter(Boolean).sort()[0] ?? '';
    // Resolve THIS user's trip date. event_dates is one-row-per-date and each
    // row has its own group URL + capacity is per-date. We prefer the row
    // matching applications.selected_date, fall back to the earliest date.
    // firstDate drives the visible date label, the per-date sold-out check,
    // and the WhatsApp group URL — keeping all three on the same date is what
    // stops users invited to July 19 from seeing "July 5 sold out" instead.
    const selectedDate: string | null = (appRow as any)?.selected_date ?? null;
    const matchedDateRow = selectedDate
      ? dates.find((d: any) => String(d.start_date ?? '') === selectedDate)
      : null;
    const firstDate = String(matchedDateRow?.start_date ?? earliestDate ?? '');
    const resolvedGroupUrl: string | undefined = matchedDateRow?.whatsapp_group_url || undefined;

    // City-specific plan details (included list, itinerary, meeting_spot)
    const includedList: string[] = Array.isArray(_cd?.included) ? _cd.included : (Array.isArray(event.included) ? event.included : []);
    const itinerary: any[] = Array.isArray(_cd?.itinerary) ? _cd.itinerary : (Array.isArray(event.itinerary) ? event.itinerary : []);

    setNativeEventData({
      // Amount to pay now: full price for single-payment events, otherwise the
      // balance (if advance already paid) or the advance.
      priceAdvance: isFullPay ? priceFull : (isBalancePayment ? balanceAmount : priceAdvance),
      priceFull,
      paymentMode: event.payment_mode ?? 'split',
      // GalCode events (girls-only flag in quick_info) get a "galcode" chat header.
      girlsOnly: Array.isArray(event.quick_info) && event.quick_info.some((i: any) =>
        ['girls only event', "girl's only event", 'girls_only_event'].includes(String(i.label ?? '').trim().toLowerCase())
        && String(i.value ?? '').trim().toLowerCase() !== 'false'
      ),
      // The city we resolved per-user (application > invited_numbers > 1st event city).
      // Passed straight to NativePaymentOverlay → create-payu-order so the server
      // can pick the same city_details override that this UI just used to compute
      // priceAdvance, instead of silently falling back to the plan default.
      resolvedCity: resolvedCity ?? undefined,
      title: event.title ?? matchHint?.title ?? '',
      firstDate,
      // Prefer the per-date booking_steps (admins set different settle/balance
      // dates per cohort). Falls back to the event-level steps when a date
      // hasn't been customised yet.
      bookingSteps: Array.isArray((matchedDateRow as any)?.booking_steps) && (matchedDateRow as any).booking_steps.length > 0
        ? (matchedDateRow as any).booking_steps
        : Array.isArray(event.booking_steps) ? event.booking_steps : undefined,
      announcements: Array.isArray(event.announcements) ? event.announcements.filter(Boolean) : [],
      planDetails: {
        quickInfo: Array.isArray(event.quick_info) ? event.quick_info : [],
        included: includedList,
        itinerary,
        accommodation: event.accommodation ?? undefined,
        showAccommodation: Boolean(event.show_accommodation),
      },
      isBalancePayment,
      isFullyPaid,
      whatsappGroupUrl: resolvedGroupUrl,
      transportPlan: Array.isArray(event.transport_plan) ? event.transport_plan : [],
      inviteSlug: event.invite_slug ?? slug,
      eventSlug: realSlug,
      inviteSpots: event.invite_spots ?? matchHint?.inviteSpots ?? null,
      inviteFaqs: Array.isArray(event.invite_faqs)
        ? event.invite_faqs.map((f: any) => ({ question: String(f.question ?? ''), answer: String(f.answer ?? '') })).filter((f: any) => f.question && f.answer)
        : [],
    });

    setChatEventQuickInfo(Array.isArray(event.quick_info) ? event.quick_info : []);
    setChatEventTransportPlan(Array.isArray(event.transport_plan) ? event.transport_plan : []);
    const parsedPickupPoints = Array.isArray(event.pickup_points) ? event.pickup_points : [];
    setChatEventPickupPoints(parsedPickupPoints);
    // Only surface the saved pickup choice when the event has multiple pickup points —
    // single-pickup events don't need a personalised override.
    setSavedPickupPointId(
      parsedPickupPoints.length > 1 ? (appRow?.pickup_point_id ?? null) : null
    );
    // Fetch application + reserved counts for the greeting message and sold-out
    // check, both scoped to THIS user's date (firstDate). invite_spots is
    // per-date capacity, and the social-proof "out of N applications" line
    // should reflect interest in the same cohort the user was invited to — not
    // every date of the plan combined. Mirrors the booking-application flow,
    // which already drives its social-proof number from per-date counts.
    // Falls back to slug-wide totals only when the date can't be resolved.
    if (firstDate) {
      fetchEventDateCounts(realSlug).then(map => {
        const dc = map[firstDate];
        setInviteApplicationCount(dc?.registered ?? 0);
        setInviteReservedCount(dc?.reserved ?? 0);
      });
    } else {
      fetchEventCounts(realSlug).then(({ registered, reserved }) => {
        setInviteApplicationCount(registered);
        setInviteReservedCount(reserved);
      });
    }

    return { isFullyPaid, isBalancePayment, inviteSpots: event.invite_spots ?? matchHint?.inviteSpots ?? null };
  };

  const triggerWipe = (slug: string) => {
    setPendingSlug(slug);
    const loaders = Object.values(INVITE_LAYER_SRC).map(src => new Promise<void>(resolve => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = src;
    }));
    Promise.all(loaders).then(() => {
      setLoading(false);
      setWipePhase('wiping');
      verificationFrameControls.set({
        clipPath: 'inset(0% 0 0% 0)',
        opacity: 1,
      });
      verificationFrameControls.start({
        clipPath: 'inset(0 0 100% 0)',
        opacity: 1,
        transition: {
          clipPath: { duration: 0.75, ease: [0.4, 0, 0.2, 1] },
          opacity: { duration: 0 },
        },
      }).then(() => {
        setVerifiedSlug(slug);
        setWipePhase('revealed');
        verificationFrameControls.set({
          clipPath: 'inset(0 0 100% 0)',
          opacity: 0,
        });
        window.history.pushState({ chapteraInviteStep: 'revealed' }, '', window.location.href);
      });
    });
  };

  const selectInviteMatch = async (match: SharedInviteMatch, openDirectly = false) => {
    if (!isInviteActionableStatus(match.status)) return;
    const tenDigit = form.phone.replace(/^\+91/, '').replace(/^0/, '');
    const chooseFromRevealedPoster = isChoosingInvitePlan || openDirectly;
    const shouldRestorePickerOnChatBack = isChoosingInvitePlan && !openDirectly;
    setLoading(true);
    setError('');

    const ready = await prepareNativeInviteFlow(match.slug, tenDigit, match);
    if (!ready) {
      setError('not_found');
      setHasFailedOnce(true);
      setLoading(false);
      return;
    }

    setPendingInviteSpots(ready.inviteSpots ?? match.inviteSpots);
    setVerifiedSlug(match.slug);
    setPendingSlug(match.slug);
    setMatches(currentMatches => shouldRestorePickerOnChatBack ? currentMatches : []);

    if (chooseFromRevealedPoster) {
      restoreInvitePickerOnChatBackRef.current = shouldRestorePickerOnChatBack;
      setLoading(false);
      openChat();
      return;
    }

    triggerWipe(match.slug);
  };

  const findInviteMatches = async () => {
    const tenDigit = form.phone.replace(/^\+91/, '').replace(/^0/, '');
    if (!form.name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^\d{10}$/.test(tenDigit)) {
      setError('Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    setLoading(true);
    setError('');
    setMatches([]);
    setVerifiedSlug('');
    setPendingSlug('');
    restoreInvitePickerOnChatBackRef.current = false;

    // Query invited_numbers + applications so the plan picker can show the user's
    // real state for every plan tied to this phone. Both tables are now
    // RLS-locked to admins (C5), so we go through the get-user-context edge
    // function which uses service_role + filters by the caller-supplied phone.
    let inviteRows: { event_slug: string }[] = [];
    let appRows: { event_slug: string; status: string; email?: string }[] = [];
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-context`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ phone: tenDigit }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      inviteRows = json.invites      ?? [];
      appRows    = json.applications ?? [];
    } catch (err) {
      setError('Could not check invites right now. Please try again.');
      setLoading(false);
      return;
    }

    const appStatusBySlug = new Map<string, string>();
    const emailMap: Record<string, string> = {};
    const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    (appRows ?? []).forEach((row: any) => {
      const slug = String(row.event_slug ?? '').trim();
      if (slug) appStatusBySlug.set(slug, String(row.status ?? 'pending'));
      const e = String(row.email ?? '').trim();
      if (slug && e && isValidEmail(e)) emailMap[slug] = e;
    });
    setAppEmailBySlug(emailMap);
    const candidates = new Map<string, string>();
    (inviteRows ?? []).forEach((row: any) => {
      const inviteSlug = String(row.event_slug ?? '').trim();
      if (inviteSlug) candidates.set(inviteSlug, 'invited');
    });
    appStatusBySlug.forEach((status, eventSlug) => {
      candidates.set(eventSlug, status);
    });

    // For each matched invite_slug/event_slug, fetch the event details in parallel.
    const checks = await Promise.all(Array.from(candidates.entries()).map(async ([candidateSlug, fallbackStatus]) => {
      if (!candidateSlug) return null;

      // is_active=true filter so legacy invited_numbers/applications rows
      // tied to events the admin has since disabled don't show up as picker
      // options. Without this, a phone with an invited_numbers row for a
      // disabled plan still sees that plan listed as 'Invited'.
      const { data: event } = await supabase
        .from('events')
        .select('slug, title, invite_slug, invite_spots, event_dates(start_date, status)')
        .or(`invite_slug.eq.${candidateSlug},slug.eq.${candidateSlug}`)
        .eq('is_active', true)
        .maybeSingle();

      if (!event) return null;
      const realSlug = String(event.slug ?? candidateSlug);
      const inviteSlug = String(event.invite_slug ?? realSlug);
      const status = appStatusBySlug.get(realSlug) ?? appStatusBySlug.get(inviteSlug) ?? fallbackStatus;

      const dates = Array.isArray(event.event_dates) ? event.event_dates : [];
      const upcomingDates = dates
        .map((date: any) => String(date.start_date ?? ''))
        .filter(Boolean)
        .sort();
      const firstDate = upcomingDates[0] ?? '';
      const dateLabel = firstDate
        ? new Date(`${firstDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Invite';
      return {
        slug: inviteSlug,
        eventSlug: realSlug,
        title: String(event.title ?? 'chapter அ invite'),
        dateLabel,
        status,
        inviteSpots: event.invite_spots ?? null,
      };
    }));

    let found = checks.filter(Boolean) as SharedInviteMatch[];
    const statusRank = (status?: string) => {
      switch (normalizeInviteStatus(status)) {
        case 'fully_paid': return 4;
        case 'advance_paid': return 3;
        case 'invited': return 2;
        default: return 1;
      }
    };
    const dedupedMatches = new Map<string, SharedInviteMatch>();
    found.forEach(match => {
      const key = match.eventSlug || match.slug || `${match.title}:${match.dateLabel}`;
      const existing = dedupedMatches.get(key);
      if (!existing || statusRank(match.status) > statusRank(existing.status)) {
        dedupedMatches.set(key, match);
      }
    });
    found = Array.from(dedupedMatches.values());

    // Block waitlist numbers only when they have nothing else — if they're also invited
    // to other plans, keep the waitlist entry and show it as non-actionable in the selector.
    const hasWaitlistOnly = found.length > 0 && found.every(m => m.status === 'waitlist');
    if (hasWaitlistOnly) {
      setError('waitlist_blocked');
      setHasFailedOnce(true);
      setLoading(false);
      return;
    }

    // Fallback: check applications for native-application flow events. Reuses the
    // appRows already returned by get-user-context (service_role) — a direct
    // applications read here is RLS-blocked for anon and would always be empty.
    if (found.length === 0) {
      const appData = (appRows ?? []).filter(
        (a: any) => ['invited', 'advance_paid', 'fully_paid'].includes(String(a.status)),
      ).slice(0, 1);

      if (appData.length > 0) {
        const eventSlug = appData[0].event_slug;
        const ready = await prepareNativeInviteFlow(eventSlug, tenDigit);
        if (ready) {
          setLoading(false);
          setVerifiedSlug(eventSlug);
          window.history.pushState({ chapteraInviteStep: 'chat' }, '', window.location.href);
          setInviteChatStep('prompt');
          setInviteMessages([]);
          setIsInviteTyping(false);
          setDoubtText('');
          setDoubtSubmitError('');
          setAskedFaqs([]);
          setChatOpen(true);
          return;
        }
      }
    }

    if (found.length === 0) {
      setError("not_found");
      setHasFailedOnce(true);
      setLoading(false);
      return;
    }

    if (found.length === 1 && isInviteActionableStatus(found[0].status)) {
      await selectInviteMatch(found[0], true);
      return;
    }

    setMatches(found);
    triggerWipe('');
  };

  useEffect(() => {
    if (chatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [inviteChatStep, chatOpen, chatRevealStep, isInviteTyping, inviteMessages]);

  // Sequential reveal: typing dots → messages → reply card
  useEffect(() => {
    if (!chatOpen || chatTransitioning) { setChatRevealStep(0); return; }
    setChatRevealStep(0);
    const t1 = setTimeout(() => setChatRevealStep(1), 700);
    const t2 = setTimeout(() => setChatRevealStep(2), 1300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [chatOpen, chatTransitioning]);

  useEffect(() => {
    setInviteAnnouncementIndex(0);
  }, [nativeEventData?.eventSlug]);

  useEffect(() => {
    if (!chatOpen) return;
    const announcements = (nativeEventData?.announcements ?? []).filter(Boolean);
    if (announcements.length <= 1) return;
    const interval = window.setInterval(() => {
      setInviteAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [chatOpen, nativeEventData?.announcements?.length]);

  const openChat = () => {
    if (chatOpen || chatTransitioning) return;
    isRetryChatRef.current = false; // normal chat open — back is allowed
    setInviteChatStep('prompt');
    setInviteMessages([]);
    setIsInviteTyping(false);
    setDoubtText('');
    setDoubtSubmitError('');
    setAskedFaqs([]);
    setChatTransitioning(true);
    setChatOpen(true);
    if (chatTransitionTimerRef.current) {
      window.clearTimeout(chatTransitionTimerRef.current);
    }
    window.history.pushState({ chapteraInviteStep: 'chat' }, '', window.location.href);
    chatTransitionTimerRef.current = window.setTimeout(() => {
      setChatTransitioning(false);
      chatTransitionTimerRef.current = null;
    }, 900);
  };

  const nowInviteTimeStr = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const addInviteUserMsg = (text: string) => {
    setInviteMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text, time: nowInviteTimeStr() }]);
  };

  const addInviteBotMsg = (text: string) => {
    setInviteMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text, time: nowInviteTimeStr() }]);
  };

  const simulateInviteTyping = (callback: () => void, delay: number = 800) => {
    setIsInviteTyping(true);
    window.setTimeout(() => {
      setIsInviteTyping(false);
      callback();
    }, delay);
  };

  useEffect(() => {
    return () => {
      if (chatTransitionTimerRef.current) {
        window.clearTimeout(chatTransitionTimerRef.current);
      }
    };
  }, []);

  // Payment retry: user pressed back on the bill page after a failed payment.
  // Skip phone entry — jump straight to the invite chat for their event.
  useEffect(() => {
    const raw = sessionStorage.getItem('ca_payu_retry_chat');
    if (!raw) return;
    sessionStorage.removeItem('ca_payu_retry_chat');
    let parsed: { name?: string; phone?: string; eventSlug?: string };
    try { parsed = JSON.parse(raw); } catch { return; }
    const { name, phone, eventSlug } = parsed;
    if (!name || !phone || !eventSlug) return;

    const tenDigit = String(phone).replace(/^\+91/, '').replace(/^0/, '').replace(/\D/g, '').slice(-10);
    setForm({ name, phone: tenDigit });
    setTcAccepted(true);

    prepareNativeInviteFlow(eventSlug, tenDigit).then(ready => {
      setIsRetryLoading(false);
      if (!ready) return;
      isRetryChatRef.current = true;
      setVerifiedSlug(eventSlug);
      setWipePhase('revealed');
      // Push a clean buffer entry so browser back hits /invite (not the payment-failed URL).
      // onPop will re-push again when back is pressed, keeping the user in the chat.
      window.history.pushState({ chapteraRetryChat: true }, '', window.location.href);
      setInviteChatStep('prompt');
      setInviteMessages([]);
      setIsInviteTyping(false);
      setDoubtText('');
      setDoubtSubmitError('');
      setAskedFaqs([]);
      setChatOpen(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bill restore: user pressed browser back from the PayU payment page.
  // The form POST disables bfcache, so we save bill state before submitting
  // and restore it here so the bill overlay re-opens instead of showing the form.
  //
  // H6: we only trust { name, phone, verifiedSlug } from sessionStorage —
  // these aren't security-sensitive on their own. The full nativeEventData
  // (prices, dates, plan details) is re-fetched fresh from the DB via
  // prepareNativeInviteFlow so a tampered sessionStorage can't display a
  // bogus price or substitute a different event before the user clicks
  // Pay. (The actual PayU amount is server-trusted in create-payu-order,
  // but a fake display price is still a UX/trust problem.)
  useEffect(() => {
    const raw = sessionStorage.getItem('ca_payu_bill');
    if (!raw) return;
    // Yield to timeline restore: if the back-from-retry-bill flow queued a
    // ca_payu_timeline payload, that path owns the screen — drop our bill
    // restore quietly so the user lands on the timeline, not a flash of the
    // bill on top of it.
    if (sessionStorage.getItem('ca_payu_timeline')) {
      sessionStorage.removeItem('ca_payu_bill');
      setIsBillRestoreLoading(false);
      return;
    }
    sessionStorage.removeItem('ca_payu_bill');
    let restored: { name?: string; phone?: string; verifiedSlug?: string } = {};
    try { restored = JSON.parse(raw); } catch { setIsBillRestoreLoading(false); return; }
    const name = String(restored.name ?? '').trim();
    const phone = String(restored.phone ?? '').replace(/\D/g, '').slice(-10);
    const slug = String(restored.verifiedSlug ?? '').trim();
    if (!name || phone.length !== 10 || !slug) { setIsBillRestoreLoading(false); return; }

    prepareNativeInviteFlow(slug, phone).then(ready => {
      if (!ready) { setIsBillRestoreLoading(false); return; }
      setForm({ name, phone });
      setVerifiedSlug(slug);
      setTcAccepted(true);
      setPosterLoaded(true);  // skip poster loading — bill overlay covers the screen
      setChatOpen(true);      // restore chat so back-from-bill shows timeline over chat
      setBillRestored(true);  // triggers backdrop so poster never shows during slide-up
      setShowNativeBill(true);
      setIsBillRestoreLoading(false);
    }).catch(() => setIsBillRestoreLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Payment retry (browser Back from the retry bill on the Payment Failed
  // screen): land the user directly on their event's booking timeline — the
  // step before the bill — instead of the Payment Failed screen. Details come
  // from the recovered payment row, so phone entry is skipped. A buffer history
  // entry is pushed so a further Back closes the timeline in place (onPop)
  // rather than jumping documents.
  useEffect(() => {
    const raw = sessionStorage.getItem('ca_payu_timeline');
    if (!raw) return;
    sessionStorage.removeItem('ca_payu_timeline');
    let restored: { name?: string; phone?: string; eventSlug?: string } = {};
    try { restored = JSON.parse(raw); } catch { setIsTimelineRestoreLoading(false); return; }
    const name = String(restored.name ?? '').trim();
    const phone = String(restored.phone ?? '').replace(/\D/g, '').slice(-10);
    const slug = String(restored.eventSlug ?? '').trim();
    if (!name || phone.length !== 10 || !slug) { setIsTimelineRestoreLoading(false); return; }

    prepareNativeInviteFlow(slug, phone).then(ready => {
      if (!ready) { setIsTimelineRestoreLoading(false); return; }
      setForm({ name, phone });
      setVerifiedSlug(slug);
      setTcAccepted(true);
      setPosterLoaded(true);  // skip poster — timeline covers the screen
      setChatOpen(true);      // chat underneath so back-from-timeline reveals it
      window.history.pushState({ chapteraInviteStep: 'timeline' }, '', window.location.href);
      setShowNativeTimeline(true);
      setIsTimelineRestoreLoading(false);
    }).catch(() => setIsTimelineRestoreLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Live chat: load messages + Realtime subscription ───────────────────────
  useEffect(() => {
    if (!liveConversationId) return;
    // Load existing messages
    supabase.from('doubt_messages').select('*')
      .eq('conversation_id', liveConversationId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setLiveMessages(data); });
    // Check if resolved
    supabase.from('doubt_conversations').select('status')
      .eq('id', liveConversationId).single()
      .then(({ data }) => { if (data) setLiveConvResolved(data.status === 'resolved'); });
    // Subscribe to new messages
    const sub = supabase.channel(`live-chat-${liveConversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'doubt_messages',
        filter: `conversation_id=eq.${liveConversationId}`,
      }, (payload) => {
        setLiveMessages(prev => [...prev, payload.new]);
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'doubt_conversations',
        filter: `id=eq.${liveConversationId}`,
      }, (payload) => {
        setLiveConvResolved((payload.new as any).status === 'resolved');
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [liveConversationId]);

  // Scroll live chat to bottom
  useEffect(() => {
    liveChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveMessages]);

  const startLiveChat = async (firstMessage: string) => {
    if (!firstMessage.trim()) return;
    setLiveChatSending(true);
    const tenDigit = form.phone.replace(/^\+91/, '').replace(/^0/, '').replace(/\D/g, '').slice(-10);
    // Create conversation
    const { data: convData, error: convErr } = await supabase
      .from('doubt_conversations')
      .insert({
        phone: tenDigit,
        name: form.name.trim() || null,
        event_slug: nativeEventData?.eventSlug ?? verifiedSlug ?? null,
        status: 'open',
      })
      .select()
      .single();
    if (convErr || !convData) { setLiveChatSending(false); return; }
    const convId = convData.id;
    // Insert first message
    await supabase.from('doubt_messages').insert({
      conversation_id: convId,
      sender: 'user',
      body: firstMessage.trim(),
    });
    // Deprecated: no longer persisting conversation IDs in localStorage.
    // RLS on doubt_conversations.INSERT denies anon writes, so the upstream
    // .insert above always returns no row (convId is null) — this is a no-op
    // in practice and the code is kept only until the JSX path is removed.
    // localStorage.setItem('liveConversationId', convId);
    localStorage.setItem('liveConvName', form.name.trim() || '');
    localStorage.setItem('liveConvEventSlug', nativeEventData?.eventSlug ?? verifiedSlug ?? '');
    localStorage.setItem('liveConvEventTitle', nativeEventData?.title ?? '');
    setLiveConversationId(convId);
    setDoubtText('');
    setLiveChatSending(false);
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

  const submitDoubt = async () => {
    const msg = doubtText.trim();
    if (!msg || !verifiedSlug) return;
    setSubmittingDoubt(true);
    setDoubtSubmitError('');
    const tenDigit = form.phone.replace(/^\+91/, '').replace(/^0/, '').replace(/\D/g, '').slice(-10);
    const { error } = await supabase.from('plan_doubts').insert({
      phone: tenDigit,
      event_slug: nativeEventData?.eventSlug ?? verifiedSlug,
      message: msg,
      status: 'new',
    });
    setSubmittingDoubt(false);
    if (error) {
      console.error('[submitDoubt] plan_doubts insert failed:', error);
      setDoubtSubmitError('Could not send this right now. Please try again.');
      return;
    }
    addInviteUserMsg(doubtText);
    simulateInviteTyping(() => {
      addInviteBotMsg("Got it! 👍 We'll reach out to you on WhatsApp soon.");
      setInviteChatStep('doubt_submitted');
    });
  };

  const wipeToLifestyle = () => {
    setWipingToLifestyle(true);
    setWipePhase('wiping');
    window.setTimeout(() => {
      setWipePhase('revealed');
      window.history.pushState({ chapteraInviteStep: 'lifestyle' }, '', window.location.href);
    }, 760);
  };

  const openSharedInviteBooking = async () => {
    if (!verifiedSlug) return;

    // Check if sold out at the moment user taps "Tap to Continue". Capacity
    // (pendingInviteSpots) is per-date, so reserved must be counted against
    // THIS user's date (nativeEventData.firstDate is the resolved per-user
    // date). Falls back to slug-wide if the date couldn't be resolved.
    if (pendingInviteSpots !== null) {
      const userDate = nativeEventData?.firstDate ?? '';
      let reserved = 0;
      if (userDate) {
        const map = await fetchEventDateCounts(verifiedSlug);
        reserved = map[userDate]?.reserved ?? 0;
      } else {
        ({ reserved } = await fetchEventCounts(verifiedSlug));
      }
      if (reserved >= pendingInviteSpots) {
        setError('sold_out');
        setHasFailedOnce(true);
        return;
      }
    }

    // Ensure nativeEventData is set (handles multi-match flow where it wasn't set in findInviteMatches)
    if (!nativeEventData) {
      const tenDigit = form.phone.replace(/\D/g, '').slice(-10);
      const ready = await prepareNativeInviteFlow(verifiedSlug, tenDigit);
      if (!ready) {
        setError('not_found');
        return;
      }
      if (ready.isFullyPaid) {
        if (typeof window !== 'undefined') {
          window.history.pushState({ chapteraInviteStep: 'confirmation' }, '', window.location.href);
        }
        setShowNativeConfirmation(true);
        return;
      }
      if (ready.isBalancePayment) {
        if (typeof window !== 'undefined') {
          window.history.pushState({ chapteraInviteStep: 'timeline' }, '', window.location.href);
        }
        setShowNativeTimeline(true);
        return;
      }
    }

    if (typeof window !== 'undefined') {
      window.history.pushState({ chapteraInviteStep: 'timeline' }, '', window.location.href);
    }
    setShowNativeTimeline(true);
  };

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      if (event.state?.chapteraLayer) return;
      if (showPlanDetailsSheet) {
        setShowPlanDetailsSheet(false);
        return;
      }
      if (showNativeBill) {
        sessionStorage.removeItem('ca_payu_bill');
        setBillRestored(false);
        setShowNativeBill(false);
        setShowNativeTimeline(true);
        return;
      }
      if (showNativeTimeline) {
        setShowNativeTimeline(false);
        return;
      }
      if (chatOpen) {
        if (isRetryChatRef.current) {
          // Back is disabled for retry chat — re-push to cancel the navigation
          window.history.pushState({ chapteraInviteStep: 'chat', isRetry: true }, '', window.location.href);
          return;
        }
        setChatOpen(false);
        setChatTransitioning(false);
        if (chatTransitionTimerRef.current) {
          window.clearTimeout(chatTransitionTimerRef.current);
          chatTransitionTimerRef.current = null;
        }
        if (restoreInvitePickerOnChatBackRef.current) {
          restoreInvitePickerOnChatBackRef.current = false;
          setVerifiedSlug('');
          setPendingSlug('');
          setPendingInviteSpots(null);
          setNativeEventData(null);
          setLoading(false);
          setError('');
        }
        return;
      }
      if (showNativeConfirmation) {
        setShowNativeConfirmation(false);
        return;
      }
      if (wipePhase !== 'idle' && wipePhase !== 'returning') {
        setWipePhase('returning');
        verificationFrameControls.start({
          clipPath: 'inset(0% 0 0% 0)',
          opacity: 1,
          transition: {
            clipPath: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
            opacity: { duration: 0.3, ease: 'easeOut' },
          },
        }).then(() => {
          setWipePhase('idle');
          setVerifiedSlug('');
          setPendingSlug('');
          setMatches([]);
          setWipingToLifestyle(false);
          setNativeEventData(null);
        });
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [wipePhase, showNativeBill, showNativeTimeline, showNativeConfirmation, chatOpen, showPlanDetailsSheet]);

  // Bill restore / payment retry: show the branded loader from frame 0 — must come
  // before the posterLoaded check so the poster never flashes behind the overlay.
  if (isBillRestoreLoading || isRetryLoading) {
    return null;
  }

  // Timeline restore (browser Back from the retry bill) is an in-app transition,
  // so show the branded loader during the async event fetch rather than a blank
  // frame — a bare `return null` makes the screen look like it goes dark.
  if (!posterLoaded || isTimelineRestoreLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative"
        >
          <motion.div
            animate={{ opacity: [0.15, 0.45, 0.15], scale: [1, 1.18, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-2xl"
            style={{ background: LIFESTYLE_POSTER_THEME.loaderGlow, filter: 'blur(10px)' }}
          />
          <div className="relative w-16 h-16 rounded-2xl bg-black shadow-xl overflow-hidden p-1.5">
            <img src={chatProfile} alt="chapter அ" className="w-full h-full object-contain scale-[1.02] translate-y-[2px]" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-white sm:min-h-screen sm:h-auto sm:bg-gray-100 flex items-stretch sm:items-center justify-center font-sans p-0 sm:p-4">
      <div className="w-full bg-white overflow-hidden flex flex-col h-[100dvh] sm:max-w-md sm:h-[85vh] relative sm:rounded-[2rem] sm:shadow-2xl sm:border-4 sm:border-white">
        <div style={{ height: '100%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px, 2.2vh, 20px)', pointerEvents: chatOpen || chatTransitioning ? 'none' : 'auto' }}>
          <div style={{ width: 'min(90vw, 360px)', position: 'relative', borderRadius: '0 0 2rem 2rem', overflow: 'hidden', background: '#fff' }}>
          <div
            className="relative w-full aspect-[874/1330] bg-white overflow-hidden"
            onClick={() => {
              if (matches.length > 0) return;
              if (isFormReady && !error && wipePhase === 'idle' && !loading) findInviteMatches();
              else if (isInviteRevealed) wipingToLifestyle ? onNavigateToLifestyle() : openChat();
            }}
            style={{ cursor: (isFormReady && wipePhase === 'idle') || isInviteRevealed ? 'pointer' : 'default' }}
          >
            {/* Frame revealed underneath during wipe — mounted before animation starts */}
            <img src={wipingToLifestyle ? POSTER_LAYER_SRC.frame : INVITE_LAYER_SRC.frame} aria-hidden="true" style={POSTER_LAYER_STYLE} />
            {/* Verification frame — wipes away forward, fades back on return */}
            <motion.img
              src="/invite-verification-frame.png"
              aria-hidden="true"
              style={POSTER_LAYER_STYLE}
              initial={{ clipPath: 'inset(0% 0 0% 0)', opacity: 1 }}
              animate={verificationFrameControls}
            />
            <motion.img src={POSTER_LAYER_SRC.borderTop} alt="" aria-hidden="true" style={POSTER_LAYER_STYLE} animate={{ opacity: [0.45, 1, 0.45] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.img src={POSTER_LAYER_SRC.borderLeft} alt="" aria-hidden="true" style={POSTER_LAYER_STYLE} animate={{ opacity: [0.45, 1, 0.45] }} transition={{ duration: 4.2, delay: 0.8, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.img src={POSTER_LAYER_SRC.borderRight} alt="" aria-hidden="true" style={POSTER_LAYER_STYLE} animate={{ opacity: [0.45, 1, 0.45] }} transition={{ duration: 4.8, delay: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
            <motion.img
              src={POSTER_LAYER_SRC.flowerLeft}
              alt=""
              aria-hidden="true"
              style={{ ...POSTER_LAYER_STYLE, transformOrigin: '18% 11%' }}
              animate={{ rotate: [-3, 3, -3], scale: [1, 1.04, 1], filter: [LIFESTYLE_POSTER_THEME.flowerGlow.off, LIFESTYLE_POSTER_THEME.flowerGlow.on, LIFESTYLE_POSTER_THEME.flowerGlow.off] }}
              transition={{ rotate: { duration: 8, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' }, filter: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } }}
            />
            <motion.img
              src={POSTER_LAYER_SRC.flowerRight}
              alt=""
              aria-hidden="true"
              style={{ ...POSTER_LAYER_STYLE, transformOrigin: '84% 12%' }}
              animate={{ rotate: [3, -3, 3], scale: [1, 1.03, 1], filter: [LIFESTYLE_POSTER_THEME.flowerGlow.off, LIFESTYLE_POSTER_THEME.flowerGlow.on, LIFESTYLE_POSTER_THEME.flowerGlow.off] }}
              transition={{ rotate: { duration: 9, delay: 0.4, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 7, delay: 0.4, repeat: Infinity, ease: 'easeInOut' }, filter: { duration: 3.4, delay: 1.7, repeat: Infinity, ease: 'easeInOut' } }}
            />
            <motion.img src={POSTER_LAYER_SRC.lighthouse} alt="" aria-hidden="true" style={POSTER_LAYER_STYLE} animate={LIGHTHOUSE_FLOAT.animate} transition={LIGHTHOUSE_FLOAT.transition} />
            <img src={POSTER_LAYER_SRC.beach} alt="" aria-hidden="true" style={POSTER_LAYER_STYLE} />
            <motion.div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${LIGHTHOUSE_LAMP_DOT.left}%`,
                top: `${LIGHTHOUSE_LAMP_DOT.top}%`,
                width: `${LIGHTHOUSE_LAMP_DOT.spread}%`,
                aspectRatio: '1 / 1',
                borderRadius: '999px',
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.82) ${LIGHTHOUSE_LAMP_DOT.centerStop}%, rgba(255,255,255,0.28) ${LIGHTHOUSE_LAMP_DOT.midStop}%, rgba(255,255,255,0) 100%)`,
              }}
              animate={{ ...LIGHTHOUSE_FLOAT.animate, opacity: [LIGHTHOUSE_LAMP_DOT.minOpacity, LIGHTHOUSE_LAMP_DOT.maxOpacity, LIGHTHOUSE_LAMP_DOT.minOpacity] }}
              transition={{ y: LIGHTHOUSE_FLOAT.transition, opacity: { duration: LIGHTHOUSE_LAMP_DOT.pulseSeconds, repeat: Infinity, repeatDelay: LIGHTHOUSE_LAMP_DOT.pauseSeconds, ease: 'easeInOut' } }}
            />
            <motion.img
              src={POSTER_LAYER_SRC.palm}
              alt=""
              aria-hidden="true"
              style={{
                ...POSTER_LAYER_STYLE,
                transformOrigin: '16% 94%',
                WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 90%, rgba(0,0,0,0.55) 94%, rgba(0,0,0,0.18) 97%, transparent 100%)',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskSize: '100% 100%',
                maskImage: 'linear-gradient(to bottom, black 0%, black 90%, rgba(0,0,0,0.55) 94%, rgba(0,0,0,0.18) 97%, transparent 100%)',
                maskRepeat: 'no-repeat',
                maskSize: '100% 100%',
              }}
              animate={{ rotate: [-1.8, 1.8, -1.8] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${PALM_ROOT_BLEND.left}%`,
                top: `${PALM_ROOT_BLEND.top}%`,
                width: `${PALM_ROOT_BLEND.width}%`,
                height: `${PALM_ROOT_BLEND.height}%`,
                borderRadius: `${PALM_ROOT_BLEND.radius}%`,
                opacity: PALM_ROOT_BLEND.opacity,
                pointerEvents: 'none',
                background: `radial-gradient(ellipse at center, ${PALM_ROOT_BLEND.color} 0%, rgba(22, 23, 18, 0.48) 34%, ${PALM_ROOT_BLEND.featherColor} 72%)`,
                filter: `blur(${PALM_ROOT_BLEND.blurPx}px)`,
                mixBlendMode: 'multiply',
              }}
            />
            <motion.div
                aria-hidden="true"
                animate={{ opacity: isFormReady && !error && !isChoosingInvitePlan ? 1 : 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 42,
                  pointerEvents: 'none',
                  background: LIFESTYLE_POSTER_THEME.bottomBlend,
                }}
              />

            {/* TC text layers — full-size poster overlays */}
            <motion.div
              animate={{ opacity: wipePhase === 'idle' || wipePhase === 'returning' ? 1 : 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 11 }}
            >
              <img src="/tc-agree-text.png" aria-hidden="true" style={POSTER_LAYER_STYLE} />
              <img src="/tc-link-text.png" aria-hidden="true" style={POSTER_LAYER_STYLE} />
            </motion.div>
            {/* Checkbox aligned to TC text (66% from top, left of "I agree to the" at 18.8%) */}
            <motion.div
              animate={{ opacity: wipePhase === 'idle' || wipePhase === 'returning' ? 1 : 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              style={{ position: 'absolute', top: '68.9%', left: '11%', transform: 'translateY(-50%)', zIndex: 12, pointerEvents: wipePhase === 'idle' ? 'auto' : 'none' }}
            >
              <div
                onClick={() => setTcAccepted(!tcAccepted)}
                style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${tcAccepted ? '#2f2c25' : '#c9a84c'}`,
                  background: tcAccepted ? '#2f2c25' : '#f5f0e8',
                  cursor: 'pointer', transition: 'all 0.18s ease',
                }}
              >
                {tcAccepted && (
                  <svg width="9" height="7" viewBox="0 0 11 8" fill="none">
                    <path d="M1 4L4 7L10 1" stroke="#f5f0e8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </motion.div>
            {/* Tappable overlay on "Terms & Conditions" text (cols 39.8–69.9%, rows 64.5–67.5%) */}
            <motion.button
              type="button"
              onClick={() => setShowTcModal(true)}
              animate={{ opacity: 0 }}
              style={{ position: 'absolute', top: '67.5%', left: '39.5%', width: '31%', height: '3.5%', zIndex: 12, background: 'transparent', border: 'none', cursor: 'pointer', pointerEvents: wipePhase === 'idle' ? 'auto' : 'none' }}
            />

            <motion.div
              className="absolute inset-x-[10%] top-[39%] z-10 space-y-3"
              animate={{ opacity: wipePhase === 'idle' || wipePhase === 'returning' ? 1 : 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              style={{ pointerEvents: wipePhase === 'idle' ? 'auto' : 'none' }}
            >
              <div className="bg-[#f5f0e8] border border-[#c9a84c] rounded-xl px-4 pt-2 pb-2 shadow-[0_6px_20px_rgba(71,60,34,0.08)]">
                <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-[#8a7b43] mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
                  placeholder="Name used in application"
                  autoComplete="name"
                  className="w-full bg-transparent text-[13px] font-medium text-[#2f2c25] placeholder:text-[#b5a882] placeholder:font-normal focus:outline-none"
                />
              </div>

              <div className="bg-[#f5f0e8] border border-[#c9a84c] rounded-xl px-4 pt-2 pb-2 shadow-[0_6px_20px_rgba(71,60,34,0.08)]">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-[#8a7b43]">WhatsApp Number</label>
                  {form.phone.length > 0 && !isPhoneReady && (
                    <span className="text-[10px] font-semibold text-amber-500 tracking-wide">Invalid</span>
                  )}
                </div>
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={event => {
                    const digits = event.target.value.replace(/\D/g, '');
                    const phone = digits.startsWith('91') && digits.length > 10
                      ? digits.slice(2, 12)
                      : digits.slice(0, 10);
                    setForm(current => ({ ...current, phone }));
                    setError('');
                    setMatches([]);
                  }}
                  placeholder="Number used in application"
                  className="w-full bg-transparent text-[13px] font-medium text-[#2f2c25] placeholder:text-[#b5a882] placeholder:font-normal focus:outline-none"
                />
              </div>


              {false && matches.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2 rounded-2xl bg-white/72 border border-[#d8cfae] p-2 shadow-[0_6px_20px_rgba(71,60,34,0.08)] backdrop-blur-sm"
                >
                  <p className="px-2 pt-1 text-left text-[11px] uppercase tracking-[0.16em] font-black text-[#8a7b43]">Choose Invite</p>
                  {matches.map(match => (
                    <button
                      key={match.slug}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        selectInviteMatch(match);
                      }}
                      className="w-full rounded-xl bg-white px-3 py-3 text-left active:scale-[0.99] transition-transform"
                    >
                      <span className="block text-[14px] font-black leading-tight text-[#2f2c25]">{match.title}</span>
                      <span className="mt-1 block text-[11px] font-bold text-[#8f876e]">{match.dateLabel}</span>
                    </button>
                  ))}
                </motion.div>
              )}

            </motion.div>

            {isChoosingInvitePlan && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="absolute inset-x-[13%] top-[30%] bottom-[34%] z-20 flex flex-col overflow-hidden"
                onClick={(event) => event.stopPropagation()}
              >
                {/* Single unified card — rows divided by lines */}
                <div className="overflow-y-auto rounded-2xl border border-[#c9a84c] bg-[#f5f0e8]/92 backdrop-blur-sm shadow-[0_8px_18px_rgba(49,42,23,0.1)] divide-y divide-[#c9a84c]/35">
                  {matches.map(match => {
                    const status = invitePlanStatus(match.status);
                    const isActionable = isInviteActionableStatus(match.status);
                    const isFullyPaid = normalizeInviteStatus(match.status) === 'fully_paid';
                    return (
                      <button
                        key={match.slug}
                        type="button"
                        disabled={!isActionable}
                        onClick={(event) => {
                          event.stopPropagation();
                          selectInviteMatch(match);
                        }}
                        className={`w-full px-3.5 py-2.5 text-left transition-colors ${
                          !isActionable
                            ? 'opacity-60 cursor-default'
                            : isFullyPaid
                              ? 'active:bg-[#d8f0cc]/60'
                              : 'active:bg-[#e8e0cc]/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {/* Date · Status + Title stacked */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[9px] font-semibold tracking-[0.06em] text-[#a89b6e]">{match.dateLabel}</span>
                              <span className="text-[9px] text-[#c9b97a]">·</span>
                              <span className={`text-[9px] font-bold tracking-[0.04em] ${
                                status.tone === 'solidGreen' || status.tone === 'green' || status.tone === 'white'
                                  ? 'text-[#4f8a2a]'
                                  : 'text-[#a89b6e]'
                              }`}>{status.label}</span>
                            </div>
                            <span className={`block text-[13px] font-black leading-tight ${isActionable ? 'text-[#2f2c25]' : 'text-[#5f636b]'}`}>{match.title}</span>
                          </div>
                          {/* Chevron centered across both lines */}
                          {isActionable && <ChevronRight size={14} strokeWidth={2.5} className="text-[#a89b6e] flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
          <div style={{ minHeight: 72, height: error ? 'auto' : 72, position: 'relative', flexShrink: 0 }}>
            <motion.button
                  type="button"
                  aria-label={isInviteRevealed ? 'Confirm your spot' : 'Open invitation'}
                  disabled={!isLifestyleRevealed && (loading || !isFormReady || !!error || wipePhase === 'wiping' || wipePhase === 'returning' || chatTransitioning || isChoosingInvitePlan)}
                  onClick={isChoosingInvitePlan ? undefined : (isInviteRevealed ? (wipingToLifestyle ? onNavigateToLifestyle : openChat) : findInviteMatches)}
                  animate={{
                    background: isChoosingInvitePlan ? '#F2F2F7' : !isLifestyleRevealing && error ? '#fff1f2' : isLifestyleRevealing || isFormReady ? LIFESTYLE_POSTER_THEME.ctaBackground : '#F2F2F7',
                    color: isChoosingInvitePlan ? '#9ca3af' : !isLifestyleRevealing && error ? '#ef4444' : isLifestyleRevealing || isFormReady ? LIFESTYLE_POSTER_THEME.ctaTextColor : '#9ca3af',
                    boxShadow: isChoosingInvitePlan ? 'none' : isLifestyleRevealing || (isFormReady && !error) ? LIFESTYLE_POSTER_THEME.ctaShadow : 'none',
                  }}
                  transition={{ duration: isLifestyleRevealing ? 0.75 : 0.3, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    pointerEvents: isLifestyleRevealed || (isFormReady && !error && wipePhase !== 'wiping') ? 'auto' : 'none',
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: !isLifestyleRevealing && error ? 'auto' : '72px',
                    minHeight: '72px',
                    border: 'none',
                    borderRadius: '0 0 2rem 2rem',
                    cursor: isChoosingInvitePlan ? 'default' : loading ? 'wait' : 'pointer',
                    overflow: 'hidden',
                    marginTop: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                  onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.995)'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  onTouchStart={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.995)'; }}
                  onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: '-8px 0 0 0',
                      pointerEvents: 'none',
                      borderRadius: 'inherit',
                      overflow: 'visible',
                      opacity: isChoosingInvitePlan ? 0 : 1,
                      WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.58) 22%, rgba(0,0,0,0.9) 46%, rgba(0,0,0,1) 100%)',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskSize: '100% 100%',
                      maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.58) 22%, rgba(0,0,0,0.9) 46%, rgba(0,0,0,1) 100%)',
                      maskRepeat: 'no-repeat',
                      maskSize: '100% 100%',
                    }}
                  >
                    <motion.span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        inset: '0 auto 0 -50%',
                        width: '50%',
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                        transform: 'skewX(-14deg)',
                        filter: 'blur(1.4px)',
                      }}
                      animate={isFormReady && !isChoosingInvitePlan ? { x: ['-100%', '300%'] } : { x: '-100%' }}
                      transition={{ duration: 0.8, repeat: isFormReady && !isChoosingInvitePlan ? Infinity : 0, repeatDelay: 3.0, ease: 'easeInOut' }}
                    />
                  </span>
                  <span style={{ position: 'relative', zIndex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 24 }}>
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                          <span className="inline-block w-5 h-5 border-2 border-black/20 border-t-black rounded-full" style={{ animation: 'spin 0.7s linear infinite' }} />
                        </motion.span>
                      ) : !isLifestyleRevealing && error ? (
                        <motion.span key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 16px', textAlign: 'center' }}>
                          {error === 'sold_out' ? (
                            <>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', lineHeight: 1.3 }}>Sold Out</span>
                              <span style={{ fontSize: 12, fontWeight: 500, color: '#f87171', lineHeight: 1.4 }}>All spots have been filled.</span>
                            </>
                          ) : error === 'waitlist_blocked' ? (
                            <>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7', lineHeight: 1.3 }}>You're on the waitlist.</span>
                              <span style={{ fontSize: 12, fontWeight: 500, color: '#a855f7', lineHeight: 1.4 }}>We'll contact you if a spot opens up!</span>
                            </>
                          ) : (
                            <>
                              <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', lineHeight: 1.3 }}>This number isn't on our invite list.</span>
                              <span style={{ fontSize: 12, fontWeight: 500, color: '#f87171', lineHeight: 1.4 }}>Re-enter the number you used in the application form.</span>
                            </>
                          )}
                        </motion.span>
                      ) : isChoosingInvitePlan ? (
                        <motion.span key="choose-plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'clamp(16px, 2.6vw, 20px)', fontWeight: 900, lineHeight: 1 }}>
                          <span>Tap a Plan</span>
                        </motion.span>
                      ) : wipePhase === 'wiping' || wipePhase === 'revealed' ? (
                        <motion.span key="revealed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'clamp(16px, 2.6vw, 20px)', fontWeight: 900, lineHeight: 1 }}>
                          <span>{wipingToLifestyle ? 'Tap to Enter' : 'Tap to Continue'}</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}><ArrowRight size={20} strokeWidth={3} /></span>
                        </motion.span>
                      ) : (
                        <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'clamp(16px, 2.6vw, 20px)', fontWeight: 900, lineHeight: 1 }}>
                          <span>Open Invitation</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            {isFormReady ? <ArrowRight size={20} strokeWidth={3} /> : <LockKeyhole size={16} strokeWidth={2.5} />}
                          </span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </motion.button>
          </div>
          <motion.div
            animate={{ opacity: hasFailedOnce && wipePhase === 'idle' ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ textAlign: 'center', paddingTop: 14, paddingBottom: 4, pointerEvents: hasFailedOnce && wipePhase === 'idle' ? 'auto' : 'none' }}
          >
            <span style={{ fontSize: 13, color: '#9ca3af' }}>Haven't applied yet? </span>
            <button type="button" onClick={wipeToLifestyle} style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textDecoration: 'underline', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Apply Now</button>
          </motion.div>
          </div>
        </div>
        {/* ── Chat overlay ── slides in immediately; loader is shown inside */}
        <AnimatePresence>
          {chatOpen && (() => {
            const firstName = form.name.trim().split(' ')[0];
            const isFullyPaid = nativeEventData?.isFullyPaid ?? false;
            const isPaid = nativeEventData?.isBalancePayment ?? false;
            const isFullPay = (nativeEventData?.paymentMode ?? 'split') === 'full';
            const eventTitle = nativeEventData?.title ?? '';
            const headerAnnouncements = (nativeEventData?.announcements ?? []).filter(Boolean);
            const headerText = headerAnnouncements.length > 0
              ? headerAnnouncements[inviteAnnouncementIndex % headerAnnouncements.length]
              : eventTitle;
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const btnClass = "px-5 py-3 bg-[#FFD700] text-black rounded-2xl text-sm font-semibold hover:bg-[#e6c200] transition-all shadow-sm active:scale-95 flex items-center gap-3 justify-between min-w-[160px]";

            const totalSpots = nativeEventData?.inviteSpots ?? null;
            const isSoldOut = !isFullyPaid && !isPaid
              && typeof inviteReservedCount === 'number'
              && totalSpots != null
              && inviteReservedCount >= totalSpots;

            const socialProofCount = typeof inviteApplicationCount === 'number' && totalSpots != null
              ? (totalSpots * 3) + inviteApplicationCount
              : null;
            const applicationPhrase = socialProofCount !== null ? String(socialProofCount) : 'all';

            // Step index 3 is always "Get Meeting Point Details" in native application events
            const meetingPointDate = nativeEventData?.bookingSteps?.[3]?.date ?? null;
            const formatMeetingDate = (iso: string): string => {
              const d = new Date(`${iso}T00:00:00`);
              if (isNaN(d.getTime())) return iso;
              const day = d.getDate();
              const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
              const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
              const month = d.toLocaleDateString('en-US', { month: 'long' });
              return `${dayName}, ${month} ${day}${suffix}`;
            };
            const meetingPointDateFormatted = meetingPointDate ? formatMeetingDate(meetingPointDate) : null;

            const botGreeting = isFullyPaid
              ? `Hi ${firstName}! We can't wait to see you in ${nativeEventData?.title ?? 'this trip'}. We're currently sorting out all the final logistics…\n\nJust join the group chat & we will send all details there${meetingPointDateFormatted ? ` by ${meetingPointDateFormatted}` : ' soon'}.`
              : isSoldOut
              ? `Hey ${firstName}, we really wanted you in this plan but...\n\nAll ${totalSpots} spots in ${nativeEventData?.title ?? 'this plan'} are already reserved.\n\nPlease note — your spot is only reserved once the advance is settled.\n\nJoin the waitlist & we'll let you know if someone cancels their spot. We hope to see you in the future!`
              : isPaid
              ? `Hi ${firstName}, we're working on giving you the best ${nativeEventData?.title ?? 'trip'} experience!\n\nWe'll add you to the plan group chat & share further meeting point details${meetingPointDateFormatted ? ` by ${meetingPointDateFormatted}` : ' a few days before the plan'}.\n\nWhat would you like to do now?`
              : (inviteReservedCount != null && totalSpots != null && inviteReservedCount / totalSpots > 0.50)
              ? `Hi ${firstName}, out of all applications, your vibe matched our club perfectly!\n\nBut please note — the invitation does not reserve your spot. A spot is reserved for you once ${isFullPay ? 'payment is made' : 'the advance is paid'}.\n\n${inviteReservedCount} out of ${totalSpots} spots are already reserved. What would you like to do now?`
              : (inviteReservedCount != null && totalSpots != null)
              ? `Hi ${firstName}, out of ${applicationPhrase} applications, your vibe matched our club perfectly!\n\nBut please note — invitation does not reserve your spot. We follow 1st come - 1st served basis.\n\nSpots are reserved for those who settle ${isFullPay ? 'payment' : 'the advance'} first. What would you like to do?`
              : `Hi ${firstName}! What would you like to do now?`;

            const hasEssentials = !!(chatEventQuickInfo.length > 0 || chatEventTransportPlan[0]?.time || nativeEventData?.firstDate);

            // GalCode events use a dedicated chat profile photo (served from /public),
            // zoomed in 1.5x so the logo fills the tile instead of sitting boxed-in.
            const chatHeaderProfile = nativeEventData?.girlsOnly ? '/galcode_chat_profile.jpeg' : chatProfile;
            const chatHeaderProfileClass = nativeEventData?.girlsOnly
              ? 'w-full h-full object-contain scale-[1.4]'
              : 'w-full h-full object-contain scale-[1.02] translate-y-[2px]';

            const ReplyContainer = ({ children, delay = 0.15 }: { children: React.ReactNode; delay?: number }) => (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="pt-1">
                <div className="bg-white rounded-2xl border border-gray-200 p-3">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider px-1 mb-2">Choose your reply</p>
                  <div className="flex flex-col items-end gap-2">{children}</div>
                </div>
              </motion.div>
            );

            return (
              <div
                key="chat-overlay"
                className="absolute inset-0 z-[60] flex flex-col bg-white"
              >
                <AnimatePresence>
                  {chatTransitioning && (
                    <motion.div
                      key="inner-loader"
                      initial={{ opacity: 1 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center"
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="relative"
                      >
                        <motion.div
                          animate={{ opacity: [0.15, 0.45, 0.15], scale: [1, 1.18, 1] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                          className="absolute inset-0 rounded-2xl"
                          style={{ background: '#FFD700', filter: 'blur(10px)' }}
                        />
                        <div className="relative w-16 h-16 rounded-2xl bg-black shadow-xl overflow-hidden p-1.5">
                          <img src={chatHeaderProfile} alt="chat profile" className={chatHeaderProfileClass} />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Header — identical to /plans page */}
                <div className="bg-white p-4 flex items-center gap-3 z-10 relative">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-black shadow-md overflow-hidden p-1">
                      <img src={chatHeaderProfile} alt="chat profile" className={chatHeaderProfileClass} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <h1 className="font-black text-lg tracking-tight text-black">{nativeEventData?.girlsOnly ? 'galcode' : 'chapter அ'}</h1>
                      <CheckCircle2 size={16} className="text-blue-500 fill-blue-50" />
                    </div>
                    <div className="h-[14px] overflow-hidden relative mt-0.5">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={`${inviteAnnouncementIndex}-${headerText}`}
                          initial={{ y: 15, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -15, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="text-[11px] text-gray-500 font-medium leading-tight absolute inset-0 whitespace-nowrap"
                        >
                          {headerText}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Chat area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F2ED] relative">

                  {/* Essentials card — visible immediately when chat opens */}
                  {hasEssentials && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
                      <InviteChatEssentialsCard
                        quickInfo={chatEventQuickInfo}
                        transportPlan={chatEventTransportPlan}
                        pickupPoints={chatEventPickupPoints}
                        firstDate={nativeEventData?.firstDate}
                        savedPickupPointId={savedPickupPointId}
                      />
                    </motion.div>
                  )}

                  {/* Step 0: Typing indicator — below essentials, where bot message will appear */}
                  {chatRevealStep === 0 && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-r-2xl rounded-bl-2xl px-4 py-3 shadow-sm flex items-center gap-1.5">
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.15 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                        <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.3 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      </div>
                    </div>
                  )}

                  {/* Steps 1+: Bot greeting */}
                  {chatRevealStep >= 1 && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: hasEssentials ? 0.1 : 0 }} className="flex justify-start mb-4">
                      <div className="max-w-[90%] px-4 py-3 bg-white text-black rounded-r-2xl rounded-bl-2xl shadow-sm">
                        <p className="text-[15px] leading-relaxed whitespace-pre-line">{botGreeting}</p>
                        <span className="text-[10px] float-right mt-1 ml-3 text-gray-400">{timeStr}</span>
                      </div>
                    </motion.div>
                  )}

                  {/* All subsequent messages after initial greeting */}
                  {chatRevealStep >= 2 && inviteMessages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'} mb-4`}
                    >
                      <div className={`max-w-[90%] px-4 py-3 ${msg.sender === 'bot' ? 'bg-white text-black rounded-r-2xl rounded-bl-2xl shadow-sm' : 'bg-[#FFD700] text-black rounded-l-2xl rounded-br-2xl'}`}>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <span className={`text-[10px] float-right mt-1 ml-3 ${msg.sender === 'bot' ? 'text-gray-400' : 'text-black/60'}`}>{msg.time}</span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Reply options / typing indicator — same pattern as /plans renderOptions() */}
                  {chatRevealStep >= 2 && (() => {
                    const inviteFaqs = nativeEventData?.inviteFaqs ?? [];
                    const remainingFaqs = inviteFaqs.filter((_, i) => !askedFaqs.includes(i));
                    const btnClass = "px-5 py-3 bg-[#FFD700] text-black rounded-2xl text-sm font-semibold hover:bg-[#e6c200] transition-all shadow-sm active:scale-95 flex items-center gap-3 justify-between min-w-[160px] relative overflow-hidden";

                    // Typing indicator — replaces buttons while bot is typing, exactly like /plans
                    if (isInviteTyping) {
                      return (
                        <div className="flex justify-start mb-4">
                          <div className="bg-white rounded-r-2xl rounded-bl-2xl px-4 py-3 shadow-sm flex items-center gap-1.5">
                            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.15 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                            <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.3 }} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          </div>
                        </div>
                      );
                    }

                    // prompt — initial reply buttons
                    if (inviteChatStep === 'prompt') {
                      return (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 p-3 mb-4">
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider px-1 mb-2">Choose your reply</p>
                          <div className="flex flex-col items-end gap-2">
                            {!isFullyPaid && !isSoldOut && (
                              <button
                                className="px-5 py-3 text-white rounded-2xl text-sm font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-3 justify-between min-w-[160px] relative overflow-hidden"
                                style={{ backgroundColor: '#22C55E' }}
                                onClick={() => { window.history.pushState({ chapteraInviteStep: 'timeline' }, '', window.location.href); setShowNativeTimeline(true); }}
                              >
                                <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: 0, ease: 'easeInOut' }} />
                                <span>{isFullPay ? 'Pay Now' : isPaid ? 'Pay Balance' : 'Pay Advance'}</span>
                                <Send size={16} />
                              </button>
                            )}
                            {/* Join Groupchat — replaces Pay chip for fully-paid users.
                                Same green styling so it reads as the primary action.
                                Only shown when the event_dates row has a group URL set;
                                otherwise the reply set quietly drops to plan details + doubt. */}
                            {isFullyPaid && nativeEventData?.whatsappGroupUrl && (
                              <a
                                href={nativeEventData.whatsappGroupUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-3 text-white rounded-2xl text-sm font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-3 justify-between min-w-[160px] relative overflow-hidden"
                                style={{ backgroundColor: '#22C55E' }}
                              >
                                <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: 0, ease: 'easeInOut' }} />
                                <span>Join Groupchat</span>
                                <Send size={16} />
                              </a>
                            )}
                            {!isSoldOut && (
                              <button className={btnClass} onClick={() => { window.history.pushState({ chapteraInviteStep: 'planDetails' }, '', window.location.href); setShowPlanDetailsSheet(true); }}>
                                <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: 1.2, ease: 'easeInOut' }} />
                                <span>Re-check plan details</span>
                                <Send size={16} />
                              </button>
                            )}
                            {isSoldOut && (
                              <button className={btnClass} onClick={() => {
                                const tenDigit = form.phone.replace(/^\+91/, '').replace(/^0/, '').replace(/\D/g, '').slice(-10);
                                // join_waitlist is a SECURITY DEFINER RPC. applications is RLS-locked
                                // (anon has no UPDATE/SELECT, and the anon INSERT policy only allows
                                // status='pending'), so the old client update().select()+insert()
                                // silently failed after the security lockdown. The RPC upserts the
                                // waitlist status server-side (and won't downgrade a paid applicant).
                                supabase.rpc('join_waitlist', {
                                  p_phone: tenDigit,
                                  p_event_slug: verifiedSlug,
                                  p_name: form.name.trim(),
                                }).then(() => {});
                                addInviteUserMsg('Join Waitlist');
                                simulateInviteTyping(() => {
                                  addInviteBotMsg("We're adding you to the waitlist, if someone cancels we'll contact you!");
                                  setInviteChatStep('waitlist');
                                });
                              }}>
                                <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: 1.2, ease: 'easeInOut' }} />
                                <span>Join Waitlist</span>
                                <Send size={16} />
                              </button>
                            )}
                            {!isSoldOut && (
                              <button className={btnClass} onClick={() => {
                                const botIntro = inviteFaqs.length > 0
                                  ? 'Here are some common questions — tap one for an instant answer 💬'
                                  : "Sure! What's on your mind? 💬 We'll get back to you on WhatsApp.";
                                addInviteUserMsg('I Have a Doubt');
                                simulateInviteTyping(() => {
                                  addInviteBotMsg(botIntro);
                                  setInviteChatStep('has_doubt');
                                });
                              }}>
                                <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: 2.4, ease: 'easeInOut' }} />
                                <span>I Have a Doubt</span>
                                <Send size={16} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    }

                    // has_doubt — FAQ chips
                    if (inviteChatStep === 'has_doubt') {
                      return (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-200 p-3 mb-4">
                          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider px-1 mb-2">Choose your reply</p>
                          <div className="flex flex-col items-end gap-2">
                            {remainingFaqs.map((faq) => {
                              const origIdx = inviteFaqs.indexOf(faq);
                              return (
                                <button
                                  key={origIdx}
                                  className={btnClass}
                                  onClick={() => {
                                    addInviteUserMsg(faq.question);
                                    simulateInviteTyping(() => {
                                      setAskedFaqs(prev => [...prev, origIdx]);
                                      addInviteBotMsg(faq.answer);
                                    });
                                  }}
                                >
                                  <span className="text-left leading-snug">{faq.question}</span>
                                  <Send size={14} className="shrink-0" />
                                </button>
                              );
                            })}
                            <button
                              className="px-5 py-3 bg-gray-200 text-black rounded-2xl text-sm font-medium hover:bg-gray-300 transition-all shadow-sm active:scale-[0.98] flex items-center gap-3 justify-between min-w-[160px] relative overflow-hidden"
                              onClick={() => {
                                addInviteUserMsg('Other Topic');
                                simulateInviteTyping(() => {
                                  addInviteBotMsg("Sure! What's on your mind? 💬 Type your question below and we'll get back to you on WhatsApp.");
                                  setInviteChatStep('other_topic');
                                });
                              }}
                            >
                              <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: 0, ease: 'easeInOut' }} />
                              <span>Other Topic</span>
                              <MessageCircle size={14} className="shrink-0" />
                            </button>
                            {!isSoldOut && (
                              <button className={btnClass} onClick={() => { window.history.pushState({ chapteraInviteStep: 'planDetails' }, '', window.location.href); setShowPlanDetailsSheet(true); }}>
                                <span>Re-check plan details</span>
                                <Send size={14} className="shrink-0" />
                              </button>
                            )}
                            {!isFullyPaid && !isSoldOut && (
                              <button
                                className="px-5 py-3 text-white rounded-2xl text-sm font-semibold transition-all shadow-sm active:scale-95 flex items-center gap-3 justify-between min-w-[160px] relative overflow-hidden"
                                style={{ backgroundColor: '#22C55E' }}
                                onClick={() => { window.history.pushState({ chapteraInviteStep: 'timeline' }, '', window.location.href); setShowNativeTimeline(true); }}
                              >
                                <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }} />
                                <span>{isFullPay ? 'Pay Now' : isPaid ? 'Pay Balance' : 'Pay Advance'}</span>
                                <Send size={14} className="shrink-0" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    }

                    // other_topic — free-text doubt input
                    if (inviteChatStep === 'other_topic') {
                      return (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-200 p-3 mb-4">
                          <textarea
                            value={doubtText}
                            onChange={e => setDoubtText(e.target.value)}
                            placeholder="Type your question…"
                            rows={3}
                            style={{ resize: 'none' }}
                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] text-gray-800 placeholder:text-gray-400 focus:outline-none"
                          />
                          {doubtSubmitError && <p className="text-red-500 text-[11px] mt-1 px-1">{doubtSubmitError}</p>}
                          <button
                            onClick={submitDoubt}
                            disabled={!doubtText.trim() || submittingDoubt}
                            className="mt-2 w-full bg-[#FFD700] text-black rounded-xl py-2.5 text-[14px] font-semibold disabled:opacity-40 active:scale-[0.98] transition-all"
                          >
                            {submittingDoubt ? 'Sending…' : 'Send Message'}
                          </button>
                        </motion.div>
                      );
                    }

                    // doubt_submitted and waitlist — no reply options
                    return null;
                  })()}

                  <div ref={chatEndRef} className="h-4" />
                </div>
                <InvitePlanDetailsSheet
                  open={showPlanDetailsSheet}
                  onClose={() => setShowPlanDetailsSheet(false)}
                  title={nativeEventData?.title ?? 'Plan'}
                  details={nativeEventData?.planDetails ?? null}
                  isFullyPaid={nativeEventData?.isFullyPaid ?? false}
                  isBalancePayment={nativeEventData?.isBalancePayment ?? false}
                  isFullPay={(nativeEventData?.paymentMode ?? 'split') === 'full'}
                  whatsappGroupUrl={nativeEventData?.whatsappGroupUrl}
                  onPayAdvance={() => {
                    setShowPlanDetailsSheet(false);
                    window.setTimeout(() => {
                      window.history.pushState({ chapteraInviteStep: 'timeline' }, '', window.location.href);
                      setShowNativeTimeline(true);
                    }, 300);
                  }}
                />

              </div>
            );
          })()}
        </AnimatePresence>
        <AnimatePresence>
          {showNativeTimeline && nativeEventData && (
            <NativeBookingTimeline
              eventTitle={nativeEventData.title}
              eventDate={nativeEventData.firstDate}
              priceAdvance={nativeEventData.priceAdvance}
              priceFull={nativeEventData.priceFull}
              bookingSteps={nativeEventData.bookingSteps}
              isBalancePayment={nativeEventData.isBalancePayment}
              isFullPay={nativeEventData.paymentMode === 'full'}
              inviteSlug={nativeEventData.inviteSlug}
              eventSlug={nativeEventData.eventSlug}
              inviteSpots={nativeEventData.inviteSpots}
              applicationCount={inviteApplicationCount}
              reserved={inviteReservedCount}
              onPayAdvance={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState({ chapteraInviteStep: 'bill' }, '', window.location.href);
                }
                // Save bill state now so a page refresh (or browser-back from PayU) restores the overlay
                if (nativeEventData) {
                  // H6: only persist minimal identifiers — full nativeEventData
                  // is re-fetched from DB on restore so a tampered sessionStorage
                  // can't inject fake prices / event swap.
                  sessionStorage.setItem('ca_payu_bill', JSON.stringify({
                    name: form.name.trim(),
                    phone: form.phone,
                    verifiedSlug,
                  }));
                }
                setShowNativeTimeline(false);
                setShowNativeBill(true);
              }}
              onClose={() => setShowNativeTimeline(false)}
            />
          )}
        </AnimatePresence>
        {/* Backdrop that covers the poster while the bill overlay slides in after a browser-back restore.
            Same bg as the overlay so the transition is seamless — no poster flash. */}
        {showNativeBill && billRestored && (
          <div className="absolute inset-0 z-[69] bg-[#F5F5F5]" />
        )}
        <AnimatePresence>
          {showNativeBill && nativeEventData && (
            <NativePaymentOverlay
              eventTitle={nativeEventData.title}
              eventDate={nativeEventData.firstDate}
              priceAdvance={nativeEventData.priceAdvance}
              prefillName={form.name.trim()}
              prefillPhone={form.phone}
              prefillEmail={appEmailBySlug[nativeEventData.eventSlug || verifiedSlug] ?? ''}
              lockEmail={!!appEmailBySlug[nativeEventData.eventSlug || verifiedSlug]}
              eventSlug={nativeEventData.eventSlug || verifiedSlug}
              selectedCity={nativeEventData.resolvedCity ?? ''}
              paymentType={nativeEventData.paymentMode === 'full' ? 'full' : (nativeEventData.isBalancePayment ? 'balance' : 'advance')}
              skipEntrance={billRestored}
              onBeforePayU={() => {
                if (nativeEventData) {
                  // H6: only persist minimal identifiers — full nativeEventData
                  // is re-fetched from DB on restore so a tampered sessionStorage
                  // can't inject fake prices / event swap.
                  sessionStorage.setItem('ca_payu_bill', JSON.stringify({
                    name: form.name.trim(),
                    phone: form.phone,
                    verifiedSlug,
                  }));
                }
                // Remember the payer's phone so the PayU return screen can fetch
                // the payment row. payu_payments is RLS-locked to admins (C5), so
                // PayUReturnScreen reads it phone-bound via get-user-context —
                // without this the success receipt + the failed-payment smart
                // Try Again had no phone and fell back to the /invite form.
                // (The booking-application flow already does this; the invite
                // flow was missing it.)
                try { sessionStorage.setItem('bookingPhone', form.phone.replace(/\D/g, '').slice(-10)); } catch { /* ignore quota */ }
              }}
              onClose={() => {
                sessionStorage.removeItem('ca_payu_bill');
                setBillRestored(false);
                setShowNativeBill(false);
                setShowNativeTimeline(true);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showNativeConfirmation && nativeEventData && (
            <NativeBookingConfirmation
              eventTitle={nativeEventData.title}
              eventDate={nativeEventData.firstDate}
              priceFull={nativeEventData.priceFull}
              bookingSteps={nativeEventData.bookingSteps}
              onClose={() => setShowNativeConfirmation(false)}
            />
          )}
        </AnimatePresence>
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

      </div>
    </div>
  );
}

// ─── PAYMENT METHOD TYPES + CONFIG (used by Timeline + Overlay) ──────────────
type PayMethod = {
  id: string;
  label: string;
  subLabel?: string;
  feeRate: number;
  feeLabel: string;
  enforcePaymethod: string;
};
type PayMethodGroup = { group: string; methods: PayMethod[] };

// Fee breakdown (from PayU MSA dated 11 May 2026)
// PayU deduction = (TPF + PFF 2%) × 1.18 GST
//
// IMPORTANT — feeRate uses the GROSS-UP (markup) formula, NOT the raw deduction %.
// PayU deducts its % from the *total charged to the user*, so a simple pass-through
// under-collects. Correct markup = deduction% / (1 − deduction%).
//
//   2.36% deduction  →  0.0236 / 0.9764  =  0.02417…  → feeRate: 0.0242  (+2.42%)
//   3.54% deduction  →  0.0354 / 0.9646  =  0.03669…  → feeRate: 0.0367  (+3.67%)
//   4.72% deduction  →  0.0472 / 0.9528  =  0.04953…  → feeRate: 0.0495  (+4.95%)
//
// Example: base ₹1,000, UPI chosen → user pays ₹1,024.20
//          PayU takes 2.36% of ₹1,024.20 = ₹24.17  →  you receive ₹1,000.03 ✓
const PAYMENT_METHOD_GROUPS: PayMethodGroup[] = [
  { group: 'UPI',         methods: [{ id: 'upi',        label: 'UPI',                subLabel: 'Google Pay, PhonePe, Paytm & more',           feeRate: 0.0242, feeLabel: '2.42%', enforcePaymethod: 'upi'        }] },
  { group: 'Cards',       methods: [{ id: 'debitcard',  label: 'Debit Card',         subLabel: 'Visa, Mastercard, Maestro, RuPay & more',      feeRate: 0.0242, feeLabel: '2.42%', enforcePaymethod: 'debitcard'  },
                                    { id: 'creditcard', label: 'Credit Card',        subLabel: 'Visa, Mastercard, Amex, Diners & more',        feeRate: 0.0367, feeLabel: '3.67%', enforcePaymethod: 'creditcard' }] },
  { group: 'Net Banking', methods: [{ id: 'netbanking', label: 'Net Banking',        subLabel: 'SBI, HDFC, ICICI, Axis & all major banks',     feeRate: 0.0242, feeLabel: '2.42%', enforcePaymethod: 'netbanking' }] },
  { group: 'More Payment Options', methods: [
                                    { id: 'emi',        label: 'EMI',                      subLabel: 'Credit card EMI from ICICI, Axis, Standard Chartered & more banks', feeRate: 0.0367, feeLabel: '3.67%', enforcePaymethod: 'emi'        },
                                    { id: 'cashcard',   label: 'Wallets & Pay by Rewards', subLabel: 'Mobikwik, Ola Money (Postpaid + Wallet) & TWID Pay by Rewards',   feeRate: 0.0495, feeLabel: '4.95%', enforcePaymethod: 'cashcard'   },
                                    { id: 'bnpl',       label: 'Buy Now Pay Later',        subLabel: 'LazyPay',                                                         feeRate: 0.0242, feeLabel: '2.42%', enforcePaymethod: 'bnpl'       }] },
];

// ─── NATIVE BOOKING CONFIRMATION ─────────────────────────────────────────────
function NativeBookingConfirmation({
  eventTitle,
  eventDate,
  priceFull,
  bookingSteps,
  onClose,
}: {
  eventTitle: string;
  eventDate: string;
  priceFull: number;
  bookingSteps?: Array<{ label: string; value: string; date?: string }>;
  onClose: () => void;
}) {
  const dateLabel = eventDate
    ? new Date(`${eventDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : '';

  // Find the "receive" step (meeting spot info) from booking steps if present
  const receiveStep = (bookingSteps ?? []).find(s => /receive|spot|meeting/i.test(`${s.label} ${s.value}`));

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-md z-[65]"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        exit={{ y: '100%', transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 z-[66] bg-white rounded-t-[2rem]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button" onClick={onClose}
          className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>



        {/* Big green tick + heading */}
        <div className="px-6 pt-5 pb-4 text-center">
          <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <p className="text-[24px] font-black text-gray-900 tracking-tight leading-tight">You're fully booked!</p>
          <p className="text-[14px] text-gray-400 mt-1">Both payments received. See you there 🎉</p>
        </div>

        {/* Booking summary card */}
        <div className="mx-6 mb-6 bg-[#F2F2F7] rounded-3xl overflow-hidden">
          {/* Paid row */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-black/5">
            <div>
              <p className="text-[11px] text-gray-400 font-medium mb-0.5">total paid</p>
              <p className="text-[15px] font-black text-gray-900 leading-none">₹{priceFull.toLocaleString('en-IN')}</p>
            </div>
            <span className="text-[11px] font-bold text-white bg-green-500 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
              ✓ Paid
            </span>
          </div>

          {/* Receive step — if configured */}
          {receiveStep && (
            <div className="px-5 py-3 flex items-center justify-between border-b border-black/5">
              <div>
                <p className="text-[11px] text-gray-400 font-medium mb-0.5">{receiveStep.label}</p>
                <p className="text-[15px] font-black text-gray-900 leading-none">{receiveStep.value}</p>
              </div>
              {receiveStep.date && (
                <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                  by {new Date(`${receiveStep.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          )}

          {/* Event + date row */}
          <div className="px-5 py-4 flex items-center justify-between">
            <p className="text-[15px] font-black text-gray-900 leading-tight">{eventTitle}</p>
            {dateLabel && (
              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full flex-shrink-0 ml-3 tabular-nums">
                {new Date(`${eventDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── NATIVE BOOKING TIMELINE ──────────────────────────────────────────────────
function NativeBookingTimeline({
  eventTitle,
  eventDate,
  priceAdvance,
  priceFull,
  bookingSteps,
  isBalancePayment = false,
  isFullPay = false,
  inviteSlug,
  eventSlug,
  inviteSpots,
  applicationCount = null,
  reserved = null,
  onPayAdvance,
  onClose,
}: {
  eventTitle: string;
  eventDate: string;
  priceAdvance: number;
  priceFull: number;
  bookingSteps?: Array<{ label: string; value: string; date?: string }>;
  isBalancePayment?: boolean;
  isFullPay?: boolean;
  inviteSlug?: string;
  eventSlug?: string;
  inviteSpots?: number | null;
  applicationCount?: number | null;
  reserved?: number | null;
  onPayAdvance: () => void;
  onClose: () => void;
}) {
  // When isBalancePayment: priceAdvance = the balance amount to pay now,
  // priceFull - priceAdvance = the original advance already paid.
  const originalAdvance = isBalancePayment ? priceFull - priceAdvance : priceAdvance;
  const balanceToPay   = isBalancePayment ? priceAdvance : priceFull - priceAdvance;

  const advanceStr = `₹${priceAdvance.toLocaleString('en-IN')}`;
  const balanceStr = `₹${Math.max(priceFull - priceAdvance, 0).toLocaleString('en-IN')}`;
  const priceStr   = `₹${priceFull.toLocaleString('en-IN')}`;

  const countStr = applicationCount !== null ? String(applicationCount) : null;
  const resolveValue = (v: string) =>
    v.replace(/\{advance\}/gi, advanceStr)
     .replace(/\{balance\}/gi, balanceStr)
     .replace(/\{price\}/gi, priceStr)
     .replace(/\{application_count\}/gi, countStr ?? '__')
     .replace(/\b__\b/g, countStr ?? '__');

  // Live countdown ticker (re-renders every second so due-by stays fresh)
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isBalancePayment) return;
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, [isBalancePayment]);

  // Spots left = invite_spots − reserved (people with advance_paid OR fully_paid).
  // Starts as null so the badge shows bouncing dots while we fetch — no
  // optimistic full-capacity number that briefly lies if reality is lower.
  // The dot loader lives in the JSX below for the null state. On fetch
  // failure we fall back to inviteSpots so it doesn't loop forever.
  // Seed from the reserved count the parent already fetched (for the greeting) so the
  // badge is correct on first paint — no loading flash, no date→amber swap on open.
  const seededSlots = !isBalancePayment && inviteSpots != null && reserved != null
    ? Math.max(0, inviteSpots - reserved)
    : null;
  const [slotsLeft, setSlotsLeft] = useState<number | null>(seededSlots);
  useEffect(() => {
    if (isBalancePayment || inviteSpots == null) { setSlotsLeft(null); return; }
    const lookupSlug = eventSlug || inviteSlug;
    // Refresh in the background; keep the seeded value visible meanwhile (don't reset
    // to null) so an already-known count never flickers back to a loading state.
    if (!lookupSlug) { setSlotsLeft(prev => prev ?? inviteSpots); return; }
    // invite_spots is per-date capacity, so reserved must be per the user's
    // date too — otherwise a sold-out earlier date wrongly makes a later date
    // look sold out. eventDate is the date this user was invited to.
    if (eventDate) {
      fetchEventDateCounts(lookupSlug)
        .then(map => setSlotsLeft(Math.max(0, inviteSpots - (map[eventDate]?.reserved ?? 0))))
        .catch(() => setSlotsLeft(prev => prev ?? inviteSpots));
    } else {
      fetchEventCounts(lookupSlug)
        .then(({ reserved: fresh }) => setSlotsLeft(Math.max(0, inviteSpots - fresh)))
        .catch(() => setSlotsLeft(prev => prev ?? inviteSpots));
    }
  }, [isBalancePayment, eventSlug, inviteSlug, inviteSpots, eventDate]);

  const buildCountdown = (dateStr: string): string => {
    if (!dateStr) return '';
    const secs = Math.max(0, Math.floor((new Date(`${dateStr}T00:00:00`).getTime() - Date.now()) / 1000));
    if (secs === 0) return 'Due soon';
    const d = Math.floor(secs / (3600 * 24));
    const h = Math.floor((secs % (3600 * 24)) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  // Find the balance due date from booking steps (if configured)
  const balanceDueDate = isBalancePayment
    ? (bookingSteps ?? []).find(s => /balance/i.test(`${s.label} ${s.value}`))?.date ?? ''
    : '';

  // Build steps list
  const steps = isFullPay
    // Single-payment (post-invite): render the admin's booking steps, dropping
    // the balance step and the vibe-check / social-proof rows (social-proof is
    // the separate event-title row below). The payment row (its value resolves
    // to the full price) is relabeled "Single Entry Payment" — this timeline is
    // only shown after the user is invited, so the pre-invite label doesn't fit.
    ? (bookingSteps ?? [])
        .filter(s => !/balance|vibe.?check|request.?invitation|apply|application/i.test(`${s.label} ${s.value}`))
        .map(s => /\{advance\}|\{price\}/i.test(s.value) ? { ...s, label: 'entry payment' } : s)
    : isBalancePayment
    ? [
        // Row 0: advance — already paid
        { label: 'advance', value: `₹${Math.max(originalAdvance, 0).toLocaleString('en-IN')}`, date: '' },
        // Row 1: remaining balance — due now (highlighted)
        { label: 'remaining balance', value: `₹${Math.max(balanceToPay, 0).toLocaleString('en-IN')}`, date: balanceDueDate },
        // Any extra non-advance/non-balance/non-application steps (e.g. "Receive" with a date)
        // The user has already been invited so the vibe-check/application step is skipped.
        ...(bookingSteps ?? []).filter(s =>
          !/advance|balance|vibe.?check|request.?invitation|apply|application/i.test(`${s.label} ${s.value}`)
        ),
      ]
    : bookingSteps && bookingSteps.length > 0
      ? (() => {
          // User is invited but advance unpaid — skip application-phase steps too
          const filteredSteps = bookingSteps.filter(s =>
            !/vibe.?check|request.?invitation|apply|application/i.test(`${s.label} ${s.value}`)
          );
          const advIdx = filteredSteps.findIndex(s => /advance/i.test(`${s.label} ${s.value}`));
          const src = filteredSteps[advIdx] ?? filteredSteps[0];
          return [
            { ...(src ?? { date: '' }), label: 'settle advance', value: '{advance}', date: '' },
            ...filteredSteps.filter((_, i) => i !== advIdx),
          ];
        })()
      : [
          { label: 'settle advance', value: '{advance}', date: '' },
          { label: 'Remaining Balance', value: '{balance}', date: '' },
          { label: 'Receive', value: 'Pickup, stay & trip details', date: '' },
        ];

  const dateLabel = eventDate
    ? new Date(`${eventDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';
  // Fuller form for the spots-or-date badge: "Sat, May 22". Used when we
  // suppress the spots-left number (because <50% of capacity is reserved)
  // and want to surface the trip date there instead.
  const badgeDateLabel = eventDate
    ? new Date(`${eventDate}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '';
  // Spots-left becomes the badge only once half-or-more of the capacity is
  // reserved. Below that threshold we show the date instead — scarcity
  // messaging only when there's actually scarcity.
  const SCARCITY_THRESHOLD = 0.5;
  const showScarcityBadge =
    slotsLeft !== null
    && inviteSpots != null
    && inviteSpots > 0
    && (inviteSpots - slotsLeft) / inviteSpots >= SCARCITY_THRESHOLD;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-md z-[65]"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%', transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 z-[66] bg-white rounded-t-[2rem]"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button (floating above sheet) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>



        {/* Title */}
        <div className="px-6 pt-7 pb-4">
          <p className="text-[24px] font-black text-gray-900 tracking-tight leading-tight text-center">Your Booking Timeline</p>
        </div>

        {/* Timeline card */}
        <div className="px-6 pb-6">
          <div className="bg-[#F2F2F7] rounded-3xl overflow-hidden">
            {steps.map((step, si) => {
              const isNowRow = si === 0;
              const stepValue = resolveValue(step.value || '');
              const isAdvancePaidRow  = isBalancePayment && si === 0;
              const isBalanceDueRow   = isBalancePayment && si === 1;
              // buildCountdown returns the 'Due soon' sentinel once the deadline
              // has arrived or passed. Prefixing it with "due by" reads as
              // "due by Due soon", so in that case show the status bare ("Due Now").
              const balanceCountdown = isBalanceDueRow && balanceDueDate ? buildCountdown(balanceDueDate) : '';
              const balanceBadgeLabel = !balanceDueDate
                ? 'Now'
                : balanceCountdown === 'Due soon'
                  ? 'Due Now'
                  : `due by ${balanceCountdown}`;
              const stepDateLabel = !isNowRow && step.date && !isBalanceDueRow
                ? `by ${new Date(`${step.date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : null;
              return (
                <div key={si} className={`px-5 py-3 flex items-center justify-between border-b border-black/5 ${isBalanceDueRow ? 'bg-[#FFD700]/10' : ''}`}>
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium mb-0.5">{resolveValue(step.label)}</p>
                    <p className="text-[15px] font-black text-gray-900 leading-none">{stepValue}</p>
                  </div>
                  {isAdvancePaidRow ? (
                    <span className="text-[11px] font-bold text-white bg-green-500 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                      ✓ Paid
                    </span>
                  ) : isBalanceDueRow ? (
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full flex-shrink-0 ml-3 tabular-nums">
                      {balanceBadgeLabel}
                    </span>
                  ) : isNowRow ? (
                    <span className="text-[11px] font-semibold text-[#34C759] bg-[#34C759]/10 border border-[#34C759]/30 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                      Now
                    </span>
                  ) : stepDateLabel ? (
                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                      {stepDateLabel}
                    </span>
                  ) : null}
                </div>
              );
            })}

            {/* Event title row — spots left badge when not yet paid, date badge when paid */}
            <div className={`px-5 py-4 flex items-center justify-between ${isBalancePayment ? '' : 'bg-[#FFD700]/10'}`}>
              <p className="text-[15px] font-black text-gray-900 leading-tight">{eventTitle}</p>
              {isBalancePayment ? (
                dateLabel ? (
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full flex-shrink-0 ml-3 tabular-nums">
                    {dateLabel}
                  </span>
                ) : null
              ) : showScarcityBadge ? (
                // ≥ 50% of capacity reserved — amber spots-left badge.
                // Checked first: if scarcity kicks in after the count loads,
                // the gold date pill below swaps to this attention-grabbing
                // amber one — deliberate visual nudge signaling urgency.
                <span className="text-[11px] font-semibold text-amber-600 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full flex-shrink-0 ml-3 tabular-nums">
                  {slotsLeft === 0 ? 'No Spots Left' : `${slotsLeft} Spot${slotsLeft === 1 ? '' : 's'} Left`}
                </span>
              ) : badgeDateLabel ? (
                // Gold date pill — matches AppFlow.tsx booking-application
                // timeline. Shown immediately on first paint (no loading
                // state) since we already know the date locally — only
                // swap to the amber spots badge above if/when the fetched
                // count reveals scarcity.
                <span className="text-[11px] font-black text-black bg-[#FFD700] border border-[#d4af37] px-2.5 py-1 rounded-full flex-shrink-0 ml-3 tabular-nums">
                  {badgeDateLabel}
                </span>
              ) : slotsLeft === null && inviteSpots != null ? (
                // Rare fallback: event has no date set + capacity tracking is
                // on + count is still loading. Bouncing dots while we wait
                // to decide between "X Spots Left" or nothing.
                <span className="flex-shrink-0 ml-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200">
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut', delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* CTA — gold styling matches AppFlow.tsx booking-application timeline.
            Always reads "Confirm" regardless of advance vs balance stage —
            same button position + same role, label stays consistent. */}
        <div className="px-6 pb-8">
          <button
            type="button"
            onClick={() => onPayAdvance()}
            className="w-full py-[17px] rounded-2xl bg-[#FFD700] text-black font-black text-[17px] flex items-center justify-center gap-2.5 active:scale-95 transition-all relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 -skew-x-12 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)', width: '50%' }}
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 0.9, delay: 10, repeat: Infinity, repeatDelay: 8, ease: 'easeInOut' }}
            />
            Confirm
            <ArrowRight size={18} strokeWidth={3.0} />
          </button>
        </div>

      </motion.div>
    </>
  );
}

// ─── NATIVE PAYMENT OVERLAY ───────────────────────────────────────────────────

function PayMethodIcon({ id }: { id: string }) {
  const base = 'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden';
  switch (id) {
    // UPI — coloured UPI badge
    case 'upi':
      return (
        <div className={`${base} bg-white border border-gray-100 shadow-sm`}>
          <img
            src="/upi-logo.png"
            alt="UPI"
            width={32}
            height={16}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="w-8 h-auto object-contain"
          />
        </div>
      );
    // Credit Card — Visa/MC circles
    case 'creditcard':
      return (
        <div className={`${base} bg-[#1A1F71]`}>
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <rect x="1" y="1" width="20" height="14" rx="2" stroke="white" strokeWidth="1.2"/>
            <rect x="1" y="4" width="20" height="3.5" fill="white" fillOpacity="0.12"/>
            <circle cx="14" cy="12" r="3" fill="#EB001B" fillOpacity="0.9"/>
            <circle cx="18" cy="12" r="3" fill="#F79E1B" fillOpacity="0.9"/>
            <rect x="3" y="2.5" width="4" height="2.5" rx="0.5" fill="#FFD700" fillOpacity="0.75"/>
          </svg>
        </div>
      );
    // Debit Card — card with magnetic stripe chip
    case 'debitcard':
      return (
        <div className={`${base} bg-[#1a1a2e]`}>
          <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
            <rect x="1" y="1" width="20" height="14" rx="2" stroke="white" strokeWidth="1.2"/>
            <rect x="1" y="5" width="20" height="3" fill="white" fillOpacity="0.65"/>
            <rect x="3" y="10.5" width="6" height="2" rx="0.5" fill="white" fillOpacity="0.9"/>
            <rect x="3" y="2.2" width="4" height="2.8" rx="0.4" fill="#FFD700" fillOpacity="0.85"/>
          </svg>
        </div>
      );
    // Net Banking — bank building
    case 'netbanking':
      return (
        <div className={`${base} bg-[#EEF2FF]`}>
          <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
            <path d="M1 8L11 2L21 8" stroke="#3B5BDB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="2.5" y="9" width="3" height="7" rx="0.5" fill="#3B5BDB"/>
            <rect x="9.5" y="9" width="3" height="7" rx="0.5" fill="#3B5BDB"/>
            <rect x="16.5" y="9" width="3" height="7" rx="0.5" fill="#3B5BDB"/>
            <rect x="1" y="16" width="20" height="2.5" rx="0.5" fill="#3B5BDB"/>
          </svg>
        </div>
      );
    // EMI — calendar with ₹ symbol
    case 'emi':
      return (
        <div className={`${base} bg-[#FFF3E0]`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="3" width="18" height="15" rx="2" stroke="#E65100" strokeWidth="1.3"/>
            <rect x="1" y="7" width="18" height="1.5" fill="#E65100" fillOpacity="0.3"/>
            <line x1="5" y1="1" x2="5" y2="5" stroke="#E65100" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="15" y1="1" x2="15" y2="5" stroke="#E65100" strokeWidth="1.5" strokeLinecap="round"/>
            <text x="10" y="16" textAnchor="middle" fill="#E65100" fontSize="7" fontWeight="bold" fontFamily="sans-serif">EMI</text>
          </svg>
        </div>
      );
    // Wallets — wallet / purse
    case 'cashcard':
      return (
        <div className={`${base} bg-[#E8F5E9]`}>
          <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
            <rect x="1" y="4" width="20" height="13" rx="2" stroke="#2E7D32" strokeWidth="1.3"/>
            <path d="M1 7h20" stroke="#2E7D32" strokeWidth="1.3"/>
            <rect x="13" y="9.5" width="6" height="5" rx="1.5" fill="#2E7D32" fillOpacity="0.2" stroke="#2E7D32" strokeWidth="1"/>
            <circle cx="16" cy="12" r="1.2" fill="#2E7D32"/>
            <path d="M4 2.5 Q11 0.5 18 2.5" stroke="#2E7D32" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
          </svg>
        </div>
      );
    // BNPL — shopping bag with clock
    case 'bnpl':
      return (
        <div className={`${base} bg-[#FCE4EC]`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M6 5a4 4 0 018 0" stroke="#C62828" strokeWidth="1.3" strokeLinecap="round" fill="none"/>
            <rect x="2" y="5" width="16" height="13" rx="2" stroke="#C62828" strokeWidth="1.3"/>
            <circle cx="14" cy="13" r="4" fill="#FCE4EC" stroke="#C62828" strokeWidth="1.2"/>
            <line x1="14" y1="11" x2="14" y2="13" stroke="#C62828" strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="14" y1="13" x2="16" y2="13" stroke="#C62828" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
      );
    default:
      return (
        <div className={`${base} bg-gray-100`}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="4" width="18" height="13" rx="2" stroke="#888" strokeWidth="1.4"/>
            <rect x="1" y="7" width="18" height="3" fill="#888"/>
          </svg>
        </div>
      );
  }
}

function PaymentMethodSheet({
  selected,
  onSelect,
  onClose,
  feeRates,
}: {
  selected: PayMethod | null;
  onSelect: (m: PayMethod) => void;
  onClose: () => void;
  // Server-canonical map keyed by method.id. Falls back to method.feeRate
  // if a method isn't in the live table (e.g., new method, stale server).
  feeRates: Record<string, number>;
}) {
  const labelFor = (m: PayMethod) => {
    const r = feeRates[m.id] ?? m.feeRate;
    return `${(r * 100).toFixed(2)}%`;
  };
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%', transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      className="absolute inset-0 z-[80] bg-white flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
        <p className="text-[18px] font-black text-gray-900">Select Payment Method</p>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="#333" strokeWidth="2.2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Scrollable method list */}
      <div className="flex-1 overflow-y-auto pb-8">
        {/* Fee note (moved to top so customers see it before scanning options) */}
        <p className="text-[11px] text-gray-400 text-center px-6 pt-4 pb-1">
          Fees shown are collected by PayU Payment Processing Gateway.
        </p>
        {PAYMENT_METHOD_GROUPS.map((group) => (
          <div key={group.group}>
            {/* Group header */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-5 pt-5 pb-2">
              {group.group}
            </p>
            <div className="mx-4 bg-[#F7F7FA] rounded-2xl overflow-hidden">
              {group.methods.map((method, i) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => { onSelect(method); onClose(); }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-gray-100 ${
                    i < group.methods.length - 1 ? 'border-b border-white' : ''
                  } ${selected?.id === method.id ? 'bg-gray-100' : ''}`}
                >
                  <PayMethodIcon id={method.id} />
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 leading-tight">{method.label}</p>
                    {method.subLabel && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{method.subLabel}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-gray-400 font-medium bg-gray-200 rounded-full px-2 py-0.5">
                      {labelFor(method)} fee
                    </span>
                    {selected?.id === method.id ? (
                      <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    ) : (
                      <svg width="7" height="12" viewBox="0 0 7 12" fill="none">
                        <path d="M1 1l5 5-5 5" stroke="#C0C0C0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function NativePaymentOverlay({
  eventTitle,
  eventDate,
  priceAdvance,
  prefillName = '',
  prefillPhone = '',
  prefillEmail = '',
  lockEmail = false,
  eventSlug = '',
  selectedCity = '',
  paymentType = 'advance',
  skipEntrance = false,
  onBeforePayU,
  onClose,
}: {
  eventTitle: string;
  eventDate: string;
  priceAdvance: number;
  prefillName?: string;
  prefillPhone?: string;
  prefillEmail?: string;
  lockEmail?: boolean;
  eventSlug?: string;
  selectedCity?: string;
  paymentType?: 'advance' | 'balance' | 'full';
  skipEntrance?: boolean;
  onBeforePayU?: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(prefillName);
  const [phone, setPhone] = useState(prefillPhone);
  const [email, setEmail] = useState(prefillEmail);
  // Email is shown read-only when it's on file from the customer's application
  // (they can't change phone/email at pay time). The caller passes lockEmail —
  // SharedInviteFlow already fetched the user's context during phone-verification,
  // so we don't repeat that lookup here. No async, no skeleton, no flicker.
  const emailLockedState = lockEmail;
  const [paying, setPaying] = useState(false);
  const [payuData, setPayuData] = useState<{ url: string; fields: Record<string, string> } | null>(null);
  const [error, setError] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PayMethod | null>(
    PAYMENT_METHOD_GROUPS[0].methods[0] // default: UPI
  );
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  // Server-canonical fee rates. PAYMENT_METHOD_GROUPS values are only the
  // initial fallback; on mount we ask create-payu-order for the live table
  // and rely on those for both display and the amount we send to PayU. Drift
  // between client display and what PayU actually charges becomes impossible
  // because the same FEE_RATES table on the server backs both.
  const [feeRates, setFeeRates] = useState<Record<string, number>>(() => {
    const seed: Record<string, number> = {};
    for (const g of PAYMENT_METHOD_GROUPS) for (const m of g.methods) seed[m.id] = m.feeRate;
    return seed;
  });
  useEffect(() => {
    fetch(`${SUPABASE_FUNCTIONS_URL}/create-payu-order?probe=fees`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => { if (d?.rates && typeof d.rates === 'object') setFeeRates(d.rates); })
      .catch(() => { /* keep fallback — bill still works, charge stays correct because server side does its own lookup */ });
  }, []);
  const liveFeeRate  = selectedMethod ? (feeRates[selectedMethod.id] ?? selectedMethod.feeRate) : 0;
  const liveFeeLabel = `${(liveFeeRate * 100).toFixed(2)}%`;
  const formRef = useRef<HTMLFormElement>(null);
  // Tracks intentional PayU navigation so beforeunload doesn't block it
  const navigatingToPayU = useRef(false);

  // Record that the bill page was opened — used for cart abandonment messaging.
  // Goes through the record_bill_open SECURITY DEFINER RPC, NOT a direct
  // .upsert(): anon has no SELECT policy on bill_opens (privacy), and a client
  // upsert compiles to INSERT ... ON CONFLICT which needs SELECT to check the
  // conflict — so the direct upsert failed RLS silently and nothing was
  // recorded. The RPC does the upsert with the owner's privileges.
  useEffect(() => {
    if (!prefillPhone || !eventSlug) return;
    const tenDigit = prefillPhone.replace(/^\+91/, '').replace(/^0/, '').replace(/\D/g, '').slice(-10);
    if (tenDigit.length !== 10) return;
    supabase.rpc('record_bill_open', {
      p_phone: tenDigit,
      p_name: prefillName || null,
      p_event_slug: eventSlug,
      p_event_title: eventTitle,
    }).then(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Advance breakdown: liveFeeRate comes from the server-canonical table
  // (with a baked-in fallback). Whatever the bill shows is exactly what the
  // server will charge.
  const platformFee = selectedMethod ? priceAdvance * liveFeeRate : 0;
  const totalPayNow = priceAdvance + platformFee;
  const fmtFee = (n: number) => n % 1 === 0 ? `₹${n.toLocaleString('en-IN')}` : `₹${n.toFixed(2)}`;
  const [showFeeInfo, setShowFeeInfo] = useState(false);
  // Fee sub-breakdown: base 2% + 18% GST on that
  const basePFF = selectedMethod ? priceAdvance * 0.02 : 0;
  const gstOnFee = selectedMethod ? basePFF * 0.18 : 0;

  const formattedDate = eventDate
    ? (() => {
        const d = new Date(`${eventDate}T00:00:00`);
        // eventDate may already be a human-formatted string — e.g. a stored
        // trip_date threaded in from a failed payment on retry. If it doesn't
        // parse as a raw YYYY-MM-DD, use it verbatim instead of mangling it.
        if (Number.isNaN(d.getTime())) return eventDate;
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const month = d.toLocaleDateString('en-US', { month: 'long' });
        const day = d.getDate();
        const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
        return `${dayName}, ${month} ${day}${suffix}`;
      })()
    : '';

  const handlePay = async () => {
    const tenDigit = phone.replace(/^\+91/, '').replace(/^0/, '').replace(/\D/g, '').slice(-10);
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!/^\d{10}$/.test(tenDigit)) { setError('Please enter a valid 10-digit WhatsApp number.'); return; }
    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { setError('Please enter a valid email address.'); return; }
    setPaying(true);
    setError('');
    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-payu-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: tenDigit,
          email: cleanEmail,
          // amount is informational only — the server recomputes from
          // price_advance + the fee rate for preferred_method below.
          amount: totalPayNow,
          event_title: eventTitle,
          event_slug: eventSlug || undefined,
          // Pass the user's selected city so the server can apply any
          // city-specific price override from event.city_details (e.g. Pondy
          // ₹1,600 vs plan default ₹2,600). Server validates this against
          // event.cities before trusting it; falls back to applications.selected_city.
          selected_city: selectedCity || undefined,
          trip_date: formattedDate,
          payment_type: paymentType,
          // Server uses this to (1) charge the right fee on top of the base
          // and (2) emit enforce_paymethod so PayU's page is bound to the
          // method the customer was priced for.
          preferred_method: selectedMethod?.id,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPayuData({ url: data.payu_url, fields: data.fields });
    } catch (e: any) {
      // Surface the actual server error so callers/admins debugging this can
      // tell rate limits / invite gating / config issues apart from generic
      // network blips. Maps technical messages from create-payu-order to
      // customer-friendly copy; falls through to the generic line otherwise.
      const raw = String(e?.message ?? '').toLowerCase();
      let msg = 'Could not initiate payment. Please try again.';
      if (raw.includes('rate limit') && raw.includes('phone')) {
        msg = "Too many attempts — please wait an hour and try again.";
      } else if (raw.includes('rate limit')) {
        msg = "Too many attempts from your network — please try again in a minute.";
      } else if (raw.includes('phone not invited')) {
        msg = "This number isn't on the invite list for this plan. Check the number or contact us.";
      } else if (raw.includes('no application found for balance')) {
        msg = "We couldn't find your booking for the balance payment. Contact us if this looks wrong.";
      } else if (raw.includes('advance not yet paid')) {
        msg = "Please settle the advance before paying the balance.";
      } else if (raw.includes('event is not active')) {
        msg = "This plan isn't open for booking right now.";
      } else if (raw.includes('event not found')) {
        msg = "Couldn't find this plan. Refresh and try again.";
      }
      setError(msg);
      setPaying(false);
    }
  };

  // Reset payment state when this overlay becomes active again after a PayU
  // navigation.  Two cases must be handled separately:
  //
  //  1. Fresh load (no bfcache)  — useEffect([]) fires on mount, resets state.
  //  2. bfcache restore          — the component is NOT remounted; React mount
  //     effects don't re-run.  The browser fires `pageshow` with persisted=true
  //     instead, so we listen for that and reset there.
  useEffect(() => {
    setPaying(false);
    setPayuData(null);
    navigatingToPayU.current = false;
  }, []);

  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setPaying(false);
        setPayuData(null);
        navigatingToPayU.current = false;
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  useEffect(() => {
    if (payuData && formRef.current) {
      navigatingToPayU.current = true; // suppress the beforeunload guard
      // Store the event slug so the failed-payment screen can navigate back
      if (eventSlug) sessionStorage.setItem('ca_payu_event_slug', eventSlug);
      // Save full bill state so browser-back from PayU restores the overlay (works on every attempt)
      onBeforePayU?.();
      formRef.current.submit();
    }
  }, [payuData]);

  return (
    /* ── Full-screen checkout page (slides up like a native screen) ── */
    <motion.div
      initial={skipEntrance ? { y: 0 } : { y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%', transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      className="absolute inset-0 z-[70] bg-[#F5F5F5] flex flex-col"
    >
      <style>{`
        @keyframes pay-shimmer {
          0%, 72%  { transform: skewX(-15deg) translateX(-180%); opacity: 0; }
          73%      { opacity: 1; }
          86%      { transform: skewX(-15deg) translateX(280%);  opacity: 0; }
          87%, 100%{ transform: skewX(-15deg) translateX(-180%); opacity: 0; }
        }
        .pay-shimmer-sweep {
          position: absolute; inset: 0; width: 38%;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.32) 50%, transparent 100%);
          animation: pay-shimmer 5s ease-in-out infinite;
          pointer-events: none; filter: blur(1px);
        }
      `}</style>

      {/* ── Fixed header ── */}
      <div className="bg-white flex-shrink-0 flex items-center gap-3 px-4 pt-5 pb-4 border-b border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:bg-gray-200 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={20} strokeWidth={2.5} className="text-gray-700 ml-[-1px]" />
        </button>
        <p className="text-[17px] font-bold text-gray-900">Review Booking</p>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Bill details card ── */}
        <div className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 px-4 pt-4 pb-2">
          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-[1px] mb-3">Bill Details</p>

          {/* Advance / Balance */}
          <div className="flex items-center justify-between py-3 border-b border-dashed border-gray-200">
            <span className="text-[14px] text-gray-700">{paymentType === 'full' ? 'Entry Ticket' : paymentType === 'balance' ? 'Balance' : 'Advance'}</span>
            <span className="text-[14px] font-medium text-gray-900">₹{priceAdvance.toLocaleString('en-IN')}</span>
          </div>

          {/* Payment processing fee */}
          <div className="flex items-center justify-between py-3 border-b border-dashed border-gray-200">
            <button
              type="button"
              onClick={() => selectedMethod && setShowFeeInfo(true)}
              className="flex items-center gap-1 active:opacity-60 transition-opacity"
            >
              <span className="text-[14px] text-gray-700 border-b border-dashed border-gray-400">
                Payment Processing Fee
              </span>
              {selectedMethod && <span className="text-gray-400 text-[12px]">({liveFeeLabel})</span>}
            </button>
            <span className={`text-[14px] font-medium ${selectedMethod ? 'text-gray-900' : 'text-gray-300'}`}>
              {selectedMethod ? fmtFee(platformFee) : '—'}
            </span>
          </div>

          {/* To Pay */}
          <div className="flex items-center justify-between py-3.5">
            <span className="text-[15px] font-bold text-gray-900">To Pay</span>
            <span className="text-[15px] font-bold text-gray-900">
              {fmtFee(selectedMethod ? totalPayNow : priceAdvance)}
            </span>
          </div>
        </div>

        {/* ── Payment method selector card ── */}
        <div className="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {/* Header row */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-gray-100">
            <p className="text-[12px] font-bold text-gray-500 uppercase tracking-[1px]">Payment Method</p>
            <button
              type="button"
              onClick={() => setShowMethodPicker(true)}
              className="flex items-center gap-0.5 active:opacity-60 transition-opacity"
            >
              <span className="text-[13px] font-semibold text-green-500">Change</span>
              <ChevronRight size={14} strokeWidth={2.5} className="text-green-500" />
            </button>
          </div>

          {/* Method row */}
          <button
            type="button"
            onClick={() => setShowMethodPicker(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors"
          >
            {selectedMethod ? (
              <PayMethodIcon id={selectedMethod.id} />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <rect x="1" y="1" width="16" height="12" rx="2" stroke="#999" strokeWidth="1.3"/>
                  <rect x="1" y="4.5" width="16" height="2.5" fill="#999"/>
                </svg>
              </div>
            )}
            <div className="flex-1 text-left">
              <p className="text-[15px] font-bold text-gray-900 leading-tight">
                {selectedMethod?.label ?? 'Select a method'}
              </p>
              {selectedMethod?.subLabel && (
                <p className="text-[12px] text-gray-400 mt-0.5 leading-tight">{selectedMethod.subLabel}</p>
              )}
            </div>
            {selectedMethod && (
              <span className="text-[12px] text-gray-400 flex-shrink-0 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-0.5">
                {liveFeeLabel} fee
              </span>
            )}
          </button>
        </div>

        {/* ── Your Details card ── */}
        <div className="mx-4 mt-4 mb-6 bg-white rounded-2xl border border-gray-100 px-4 pt-4 pb-4">

          <p className="text-[12px] font-bold text-gray-500 uppercase tracking-[1px] mb-3">Your Details</p>

          {/* Person icon + static details */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="6" r="3.5" stroke="#888" strokeWidth="1.3"/>
                <path d="M2 16c0-3.87 3.13-6 7-6s7 2.13 7 6" stroke="#888" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-gray-900 leading-snug">{name}</p>
              {phone && <p className="text-[13px] text-gray-500 mt-0.5">+91 {phone}</p>}
              {emailLockedState && email && <p className="text-[13px] text-gray-500 mt-0.5 truncate">{email}</p>}
            </div>
          </div>

          {/* Email. Read-only (shown above with name/phone) when it's on file
              from the customer's application; otherwise an editable field for
              bulk-invited / older applicants. PayU requires a real email —
              previously every txn used a shared fallback (booking@chaptera.in). */}
          {!emailLockedState && (
            <div className="mt-3.5">
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); if (error) setError(''); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-[14px] text-gray-900 outline-none focus:border-gray-900 transition-colors"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-[12px] font-medium mt-3">{error}</p>}
        </div>

      </div>{/* end scrollable */}

      {/* ── Fixed bottom bar — Zepto style ── */}
      <div className="bg-white flex-shrink-0 border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">

          {/* Left: paying via */}
          <button
            type="button"
            onClick={() => setShowMethodPicker(true)}
            className="flex items-center gap-2.5 active:opacity-70 transition-opacity flex-shrink-0"
          >
            {selectedMethod ? (
              <PayMethodIcon id={selectedMethod.id} />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <rect x="1" y="1" width="16" height="12" rx="2" stroke="#999" strokeWidth="1.3"/>
                  <rect x="1" y="4.5" width="16" height="2.5" fill="#999"/>
                </svg>
              </div>
            )}
            <div className="text-left">
              <div className="flex items-center gap-0.5">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider">Paying via</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2.5 4L5 6.5L7.5 4" stroke="#AAA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[13px] font-bold text-gray-900 leading-tight max-w-[90px] truncate">
                {selectedMethod?.label ?? 'Select'}
              </p>
            </div>
          </button>

          {/* Right: green pill pay button */}
          <button
            type="button"
            onClick={handlePay}
            disabled={paying || !selectedMethod}
            className="flex-1 h-14 rounded-2xl flex items-center justify-center active:opacity-80 transition-all disabled:opacity-40 relative overflow-hidden"
            style={{ backgroundColor: '#22C55E' }}
          >
            <div className="pay-shimmer-sweep" />
            {paying ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="text-white font-black text-[17px]">
                Pay {fmtFee(selectedMethod ? totalPayNow : priceAdvance)}
              </span>
            )}
          </button>

        </div>
      </div>

      {/* Hidden PayU form. enforce_paymethod is now included in `fields` by
          the server (see create-payu-order) so it's bound to the same amount
          the fee was priced for. No client-side hidden input needed. */}
      {payuData && (
        <form ref={formRef} method="POST" action={payuData.url} className="hidden">
          {Object.entries(payuData.fields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}

      {/* Payment method picker (slides up over this page) */}
      <AnimatePresence>
        {showMethodPicker && (
          <PaymentMethodSheet
            selected={selectedMethod}
            onSelect={m => setSelectedMethod(m)}
            onClose={() => setShowMethodPicker(false)}
            feeRates={feeRates}
          />
        )}
      </AnimatePresence>

      {/* Fee breakdown sheet */}
      <AnimatePresence>
        {showFeeInfo && selectedMethod && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 bg-black/40 z-[90]"
              onClick={() => setShowFeeInfo(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }}
              exit={{ y: '100%', transition: { duration: 0.24, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-[91] bg-white rounded-t-[1.75rem] px-5 pt-5 pb-5"
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowFeeInfo(false)}
                className="absolute right-4 -top-10 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white/90 flex items-center justify-center active:scale-95 transition-all shadow-sm"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Rows */}
              <div className="flex items-center justify-between py-3 border-b border-dashed border-gray-100">
                <div>
                  <p className="text-[14px] text-gray-800">Transaction Processing Fees</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">Charged by PayU at 2% of advance</p>
                </div>
                <span className="text-[14px] font-medium text-gray-900">{fmtFee(basePFF)}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-dashed border-gray-100">
                <div>
                  <p className="text-[14px] text-gray-800">GST on Processing Fee</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">18% GST applied to processing fee</p>
                </div>
                <span className="text-[14px] font-medium text-gray-900">{fmtFee(gstOnFee)}</span>
              </div>
              <div className="flex items-center justify-between py-4">
                <p className="text-[15px] font-bold text-gray-900">Total Fee</p>
                <span className="text-[15px] font-bold text-gray-900">{fmtFee(platformFee)}</span>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-[11px] text-gray-400 leading-relaxed text-center">
                  Fees shown are collected by PayU Payment Processing Gateway.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

function InviteFlow({ slug, initialPosterLoaded = false }: { slug: string; initialPosterLoaded?: boolean }) {
  const [step, setStep] = useState<InviteStep>('card');
  const [posterLoaded, setPosterLoaded] = useState(initialPosterLoaded);
  const [eventInfo, setEventInfo] = useState<{
    bookingUrl: string;
    priceAdvance: number;
    priceFull: number;
    title: string;
    firstDate: string;
    bookingSteps?: Array<{ label: string; value: string; date?: string }>;
    inviteSpots?: number | null;
    eventSlug?: string;
    inviteSlug?: string;
  } | null>(null);
  const [billPrefill, setBillPrefill] = useState<{ name: string; phone: string } | null>(null);

  // Fetch event data to know if it's a native-application event
  useEffect(() => {
    if (!slug) return;
    supabase
      .from('events')
      .select('slug, invite_slug, booking_url, price_advance, price_full, title, booking_steps, invite_spots, event_dates(start_date, whatsapp_group_url, booking_steps)')
      .or(`slug.eq.${slug},invite_slug.eq.${slug}`)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const dates = Array.isArray(data.event_dates) ? data.event_dates : [];
          const firstDate = dates.map((d: any) => String(d.start_date ?? '')).filter(Boolean).sort()[0] ?? '';
          setEventInfo({
            bookingUrl: data.booking_url ?? '',
            priceAdvance: Number(data.price_advance ?? 0),
            priceFull: Number(data.price_full ?? 0),
            title: data.title ?? '',
            firstDate,
            bookingSteps: Array.isArray(data.booking_steps) ? data.booking_steps : undefined,
            inviteSpots: data.invite_spots ?? null,
            eventSlug: data.slug ?? slug,
            inviteSlug: data.invite_slug ?? data.slug ?? slug,
          });
        }
      });
  }, [slug]);

  useEffect(() => {
    if (initialPosterLoaded) return;
    setPosterLoaded(false);
    let cancelled = false;
    const loaders = Object.values(INVITE_LAYER_SRC).map(src =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      }),
    );
    Promise.all(loaders).then(() => { if (!cancelled) setPosterLoaded(true); });
    const timeout = window.setTimeout(() => { if (!cancelled) setPosterLoaded(true); }, 6000);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [initialPosterLoaded]);

  useEffect(() => {
    const handleInviteBack = (event: PopStateEvent) => {
      if (event.state?.chapteraLayer) return;
      setStep(prev => {
        if (prev === 'bill') return 'timeline';
        if (prev === 'timeline') return 'card';
        return 'card';
      });
    };
    window.addEventListener('popstate', handleInviteBack);
    return () => window.removeEventListener('popstate', handleInviteBack);
  }, []);

  const openInviteBooking = () => {
    // All invite payment flows now route through PayU (NativeBookingTimeline → NativePaymentOverlay)
    if (typeof window !== 'undefined') {
      window.history.pushState({ chapteraInviteStep: 'timeline' }, '', window.location.href);
    }
    setStep('timeline');
  };

  // Loading state
  if (!posterLoaded) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative"
        >
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
      </div>
    );
  }

  return (
    <div className="h-[100dvh] overflow-hidden bg-white sm:min-h-screen sm:h-auto sm:bg-gray-100 flex items-stretch sm:items-center justify-center font-sans p-0 sm:p-4">
      <div className="w-full bg-white overflow-hidden flex flex-col h-[100dvh] sm:max-w-md sm:h-[85vh] relative sm:rounded-[2rem] sm:shadow-2xl sm:border-4 sm:border-white">

        {/* Step 1 — Invitation Card */}
          <div style={{ height: '100%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px, 2.2vh, 20px)', pointerEvents: step === 'card' ? 'auto' : 'none' }}>
            <div
              role="button"
              tabIndex={0}
              aria-label="Open invitation booking"
              onClick={openInviteBooking}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openInviteBooking();
                }
              }}
              style={{
                width: 'min(90vw, 360px)',
                maxHeight: '100%',
                overflow: 'visible',
                color: '#232323',
                fontFamily: "'DM Sans', sans-serif",
                position: 'relative',
                borderRadius: '0 0 2rem 2rem',
                background: 'transparent',
                cursor: 'pointer',
                filter: 'drop-shadow(0 24px 34px rgba(0,0,0,0.14))',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ height: 'auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ width: '100%', aspectRatio: '874 / 1330', overflow: 'hidden', display: 'block', position: 'relative', background: '#FFFFFF' }}>
                  {/* Invite frame */}
                  <img src={INVITE_LAYER_SRC.frame} alt="Your invitation" style={POSTER_LAYER_STYLE} />

                  {/* Borders */}
                  <motion.img src={INVITE_LAYER_SRC.borderTop} alt="" aria-hidden="true" style={POSTER_LAYER_STYLE} animate={{ opacity: [0.45, 1, 0.45] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }} />
                  <motion.img src={INVITE_LAYER_SRC.borderLeft} alt="" aria-hidden="true" style={POSTER_LAYER_STYLE} animate={{ opacity: [0.45, 1, 0.45] }} transition={{ duration: 4.2, delay: 0.8, repeat: Infinity, ease: 'easeInOut' }} />
                  <motion.img src={INVITE_LAYER_SRC.borderRight} alt="" aria-hidden="true" style={POSTER_LAYER_STYLE} animate={{ opacity: [0.45, 1, 0.45] }} transition={{ duration: 4.8, delay: 1.6, repeat: Infinity, ease: 'easeInOut' }} />

                  {/* Flowers */}
                  <motion.img src={INVITE_LAYER_SRC.flowerLeft} alt="" aria-hidden="true" style={{ ...POSTER_LAYER_STYLE, transformOrigin: '18% 11%' }} animate={{ rotate: [-3, 3, -3], scale: [1, 1.04, 1], filter: ['drop-shadow(0 0 0px rgba(255,215,0,0))', 'drop-shadow(0 0 6px rgba(255,215,0,0.85)) drop-shadow(0 0 14px rgba(255,215,0,0.55))', 'drop-shadow(0 0 0px rgba(255,215,0,0))'] }} transition={{ rotate: { duration: 8, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' }, filter: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' } }} />
                  <motion.img src={INVITE_LAYER_SRC.flowerRight} alt="" aria-hidden="true" style={{ ...POSTER_LAYER_STYLE, transformOrigin: '84% 12%' }} animate={{ rotate: [3, -3, 3], scale: [1, 1.03, 1], filter: ['drop-shadow(0 0 0px rgba(255,215,0,0))', 'drop-shadow(0 0 6px rgba(255,215,0,0.85)) drop-shadow(0 0 14px rgba(255,215,0,0.55))', 'drop-shadow(0 0 0px rgba(255,215,0,0))'] }} transition={{ rotate: { duration: 9, delay: 0.4, repeat: Infinity, ease: 'easeInOut' }, scale: { duration: 7, delay: 0.4, repeat: Infinity, ease: 'easeInOut' }, filter: { duration: 3.4, delay: 1.7, repeat: Infinity, ease: 'easeInOut' } }} />

                  {/* Lighthouse */}
                  <motion.img src={INVITE_LAYER_SRC.lighthouse} alt="" aria-hidden="true" style={POSTER_LAYER_STYLE} animate={LIGHTHOUSE_FLOAT.animate} transition={LIGHTHOUSE_FLOAT.transition} />

                  {/* Beach */}
                  <img src={INVITE_LAYER_SRC.beach} alt="" aria-hidden="true" style={POSTER_LAYER_STYLE} />

                  {/* Lighthouse lamp */}
                  <motion.div
                    aria-hidden="true"
                    style={{ position: 'absolute', left: `${LIGHTHOUSE_LAMP_DOT.left}%`, top: `${LIGHTHOUSE_LAMP_DOT.top}%`, width: `${LIGHTHOUSE_LAMP_DOT.spread}%`, aspectRatio: '1 / 1', borderRadius: '999px', pointerEvents: 'none', transform: 'translate(-50%, -50%)', background: `radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.82) ${LIGHTHOUSE_LAMP_DOT.centerStop}%, rgba(255,255,255,0.28) ${LIGHTHOUSE_LAMP_DOT.midStop}%, rgba(255,255,255,0) 100%)` }}
                    animate={{ ...LIGHTHOUSE_FLOAT.animate, opacity: [LIGHTHOUSE_LAMP_DOT.minOpacity, LIGHTHOUSE_LAMP_DOT.maxOpacity, LIGHTHOUSE_LAMP_DOT.minOpacity] }}
                    transition={{ y: LIGHTHOUSE_FLOAT.transition, opacity: { duration: LIGHTHOUSE_LAMP_DOT.pulseSeconds, repeat: Infinity, repeatDelay: LIGHTHOUSE_LAMP_DOT.pauseSeconds, ease: 'easeInOut' } }}
                  />

                  {/* Palm */}
                  <motion.img src={INVITE_LAYER_SRC.palm} alt="" aria-hidden="true" style={{ ...POSTER_LAYER_STYLE, transformOrigin: '16% 94%', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 90%, rgba(0,0,0,0.55) 94%, rgba(0,0,0,0.18) 97%, transparent 100%)', WebkitMaskRepeat: 'no-repeat', WebkitMaskSize: '100% 100%', maskImage: 'linear-gradient(to bottom, black 0%, black 90%, rgba(0,0,0,0.55) 94%, rgba(0,0,0,0.18) 97%, transparent 100%)', maskRepeat: 'no-repeat', maskSize: '100% 100%' }} animate={{ rotate: [-1.8, 1.8, -1.8] }} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }} />

                  {/* Palm root blend */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: `${PALM_ROOT_BLEND.left}%`, top: `${PALM_ROOT_BLEND.top}%`, width: `${PALM_ROOT_BLEND.width}%`, height: `${PALM_ROOT_BLEND.height}%`, borderRadius: `${PALM_ROOT_BLEND.radius}%`, opacity: PALM_ROOT_BLEND.opacity, pointerEvents: 'none', background: `radial-gradient(ellipse at center, ${PALM_ROOT_BLEND.color} 0%, rgba(22, 23, 18, 0.48) 34%, ${PALM_ROOT_BLEND.featherColor} 72%)`, filter: `blur(${PALM_ROOT_BLEND.blurPx}px)`, mixBlendMode: 'multiply' }} />

                  {/* Bottom gradient */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 42, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(255,215,0,0) 0%, rgba(255,215,0,0.04) 25%, rgba(255,215,0,0.16) 50%, rgba(255,215,0,0.42) 72%, rgba(255,215,0,0.78) 88%, rgba(255,215,0,1) 100%)' }} />
                </div>

                {/* CTA Button */}
                <button
                  type="button"
                  aria-label="Confirm your spot"
                  onClick={(e) => { e.stopPropagation(); openInviteBooking(); }}
                  style={{ flexShrink: 0, width: '100%', height: '72px', maxHeight: '72px', border: 'none', borderRadius: '0 0 2rem 2rem', background: '#FFD700', color: '#111', cursor: 'pointer', overflow: 'visible', position: 'relative', marginTop: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 -22px 36px rgba(255,215,0,0.45), 0 -10px 18px rgba(255,215,0,0.55), 0 -3px 8px rgba(255,215,0,0.8)', transition: 'transform 160ms ease' }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.995)'; }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.995)'; }}
                  onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <span aria-hidden="true" style={{ position: 'absolute', inset: '-8px 0 0 0', pointerEvents: 'none', borderRadius: 'inherit', overflow: 'visible', WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.58) 22%, rgba(0,0,0,0.9) 46%, rgba(0,0,0,1) 100%)', WebkitMaskRepeat: 'no-repeat', WebkitMaskSize: '100% 100%', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.58) 22%, rgba(0,0,0,0.9) 46%, rgba(0,0,0,1) 100%)', maskRepeat: 'no-repeat', maskSize: '100% 100%' }}>
                    <motion.span aria-hidden="true" style={{ position: 'absolute', inset: '0 auto 0 -50%', width: '50%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', transform: 'skewX(-14deg)', filter: 'blur(1.4px)' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 3.0, ease: 'easeInOut' }} />
                  </span>
                  <span style={{ position: 'relative', zIndex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 'clamp(16px, 2.6vw, 20px)', fontWeight: 900, letterSpacing: '0', lineHeight: 1, color: '#111' }}>
                    <span>Tap to Continue</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <ArrowRight size={20} strokeWidth={3} />
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>

        <AnimatePresence>
          {step === 'timeline' && eventInfo && (
            <NativeBookingTimeline
              eventTitle={eventInfo.title}
              eventDate={eventInfo.firstDate}
              priceAdvance={eventInfo.priceAdvance}
              priceFull={eventInfo.priceFull}
              bookingSteps={eventInfo.bookingSteps}
              inviteSlug={eventInfo.inviteSlug}
              eventSlug={eventInfo.eventSlug}
              inviteSpots={eventInfo.inviteSpots ?? null}
              onPayAdvance={() => {
                if (typeof window !== 'undefined') {
                  window.history.pushState({ chapteraInviteStep: 'bill' }, '', window.location.href);
                }
                setStep('bill');
              }}
              onClose={() => setStep('card')}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step === 'bill' && eventInfo && (
            <NativePaymentOverlay
              eventTitle={eventInfo.title}
              eventDate={eventInfo.firstDate}
              priceAdvance={eventInfo.priceAdvance}
              prefillName={billPrefill?.name ?? ''}
              prefillPhone={billPrefill?.phone ?? ''}
              eventSlug={eventInfo.eventSlug ?? slug}
              onClose={() => {
                setBillPrefill(null);
                setStep('timeline');
              }}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// ─── LANDSCAPE BLOCKER ────────────────────────────────────────────────────────
function LandscapeBlocker() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (!isLandscape) return null;

  return (
    <div className="fixed inset-0 bg-white z-[99999] flex flex-col items-center justify-center gap-4 px-8">
      <RotateCcw size={52} color="#1C1C1C" strokeWidth={1.5} />
      <h2 className="text-gray-900 font-black text-xl text-center">Rotate your phone</h2>
      <p className="text-gray-500 text-sm text-center leading-relaxed">
        Our website is designed for portrait mode
      </p>
    </div>
  );
}


// ─── PAYU RETURN SCREEN ────────────────────────────────────────────────────────
function PayUReturnScreen({ status, txnid, onDone }: { status: 'success' | 'failed' | 'pending'; txnid: string; onDone: (nextPath?: string) => void }) {
  const [payment, setPayment] = React.useState<any>(null);
  // 4th step in the invite-only booking timeline is always the "Meeting Spot
  // Details" step — its date is when the customer gets added to the WhatsApp
  // group chat. Surfaced in the receipt warm-note so they know what to expect.
  const [detailsDate, setDetailsDate] = React.useState<string>('');
  // Balance due date — sourced from the booking step whose label/value mentions
  // "balance". Used in the advance-paid receipt warm note ("settle balance
  // anytime before X"). Same find-by-regex pattern as payu-callback.
  const [balanceDate, setBalanceDate] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [dlLoading, setDlLoading] = React.useState(false);
  const [showRetryBill, setShowRetryBill] = React.useState(false);
  // When a 'pending' payment is later confirmed by the poll below, this overrides
  // the URL-derived status so the screen advances to the receipt / failed view
  // instead of staying on "processing".
  const [resolved, setResolved] = React.useState<'success' | 'failed' | null>(null);
  // Phone-input fallback for when the user lands on the receipt page in a
  // cold/cross-origin session (e.g. cleared cache, different device, opened
  // the success URL from email). sessionStorage.bookingPhone is the happy
  // path; this fallback lets the legitimate buyer prove ownership by
  // re-entering the phone they booked with.
  const [phoneInput, setPhoneInput] = React.useState('');
  const [phoneError, setPhoneError] = React.useState('');
  const [submittingPhone, setSubmittingPhone] = React.useState(false);

  // Application email for this event (same lookup the bill uses). When present,
  // the retry-bill renders the email LOCKED — the smart bill is part of the same
  // booking flow, so an applicant shouldn't be able to change their email there
  // any more than they can on the original bill.
  const [appEmailForEvent, setAppEmailForEvent] = React.useState<string>('');
  // The date this applicant chose (from their application). Multi-date events
  // give each date its own booking timeline, so the warm-note balance/details
  // dates must be read from THIS date's steps, not the event-level fallback.
  const [appSelectedDate, setAppSelectedDate] = React.useState<string>('');

  // get-user-context cross-checks the supplied phone against the stored phone
  // on the txnid (server-side). Returns the payment row only on match,
  // otherwise null. Anyone with the txnid alone cannot view someone else's
  // receipt without also knowing the correct phone. We also stash the
  // application's email for the payment's event, used to lock the retry bill.
  const fetchReceipt = React.useCallback(async (phone: string): Promise<any> => {
    if (phone.length !== 10) return null;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-user-context`,
        {
          method: 'POST',
          headers: {
            'Content-Type':  'application/json',
            'apikey':        import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ phone, txnid }),
        },
      );
      if (!res.ok) return null;
      const d = await res.json();
      const p = d.payment ?? null;
      // Match the application for the payment's event_slug (if we have one)
      // and stash its email. Used by the retry-bill to lock the email field.
      const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || '').trim());
      const apps = Array.isArray(d.applications) ? d.applications : [];
      const targetSlug = String(p?.event_slug ?? '').trim();
      const matchedApp = targetSlug ? apps.find((a: any) => String(a.event_slug) === targetSlug) : null;
      const onFile = matchedApp?.email ?? '';
      setAppEmailForEvent(isValidEmail(onFile) ? String(onFile).trim() : '');
      // Stash the applicant's chosen date so the warm note reads the right
      // per-date booking steps for a multi-date event.
      setAppSelectedDate(String(matchedApp?.selected_date ?? ''));
      return p;
    } catch { return null; }
  }, [txnid]);

  React.useEffect(() => {
    if (!txnid) { setLoading(false); return; }
    // Read from sessionStorage (tab-scoped) — see comment in AppFlow.tsx
    // for the rationale (PII shouldn't outlive the booking tab).
    const storedPhone = (typeof window !== 'undefined' && sessionStorage.getItem('bookingPhone')) || '';
    const tenDigit = storedPhone.replace(/^\+91/, '').replace(/^0/, '').replace(/\D/g, '').slice(-10);
    if (tenDigit.length !== 10) { setLoading(false); return; }
    fetchReceipt(tenDigit).then(p => { setPayment(p); setLoading(false); });
  }, [txnid, status, fetchReceipt]);

  // Once we know the event_slug from the payment, look up the event for two
  // dates used by the receipt warm note. Both come from the canonical 5-step
  // invite-only booking timeline (vibe check → advance → balance → meeting
  // spot → social proof), so they're read positionally:
  //   - balanceDate = step index 2 ("remaining balance") → advance-paid note
  //   - detailsDate = step index 3 ("Meeting Spot Details") → balance/full note
  // Best-effort: if a step or date is missing the warm note drops that
  // clause gracefully.
  React.useEffect(() => {
    const slug = payment?.event_slug;
    if (!slug) { setDetailsDate(''); setBalanceDate(''); return; }
    let cancelled = false;
    const fmt = (raw: any): string => {
      if (typeof raw !== 'string' || !raw) return '';
      const d = new Date(`${raw}T00:00:00`);
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    fetchEventByIdOrSlug(slug).then(ev => {
      if (cancelled) return;
      // Prefer the booking steps for the DATE this applicant chose (multi-date
      // events give each date its own timeline). Fall back to the event-level
      // steps when there's no per-date match (single-date events, or missing).
      const perDate = (appSelectedDate && Array.isArray(ev?.dates))
        ? ev.dates.find((d: any) => String(d?.date ?? '') === appSelectedDate)?.bookingSteps
        : undefined;
      const steps: any[] = (Array.isArray(perDate) && perDate.length > 0)
        ? perDate
        : (Array.isArray(ev?.bookingSteps) ? ev.bookingSteps : []);
      setBalanceDate(fmt(steps[2]?.date));
      setDetailsDate(fmt(steps[3]?.date));
    }).catch(() => { /* silent — warm note just drops the date clause */ });
    return () => { cancelled = true; };
  }, [payment?.event_slug, appSelectedDate]);

  // The retry bill (NativePaymentOverlay below) is a full-screen overlay shown
  // in place, without its own route. The Try Again button pushes a history
  // entry when opening it; here we catch the matching Back press and hand the
  // user back into the actual booking flow — onto their event's booking
  // timeline — rather than the Payment Failed screen. Without this, Back
  // bypassed the overlay and crossed straight back into the original /invite
  // document (which re-displays a near-identical bill), so the first Back press
  // looked like it did nothing.
  React.useEffect(() => {
    if (!showRetryBill) return;
    const onPop = () => {
      if (payment?.event_slug && payment?.name && payment?.phone) {
        try {
          // ca_payu_bill is still set from the original bill→PayU hop and was
          // never consumed (SharedInviteFlow didn't mount during the failed
          // return). Clear it so only the timeline restore fires, not the bill.
          sessionStorage.removeItem('ca_payu_bill');
          sessionStorage.setItem('ca_payu_timeline', JSON.stringify({
            name: payment.name,
            phone: String(payment.phone).replace(/^\+91/, '').replace(/^0/, '').replace(/\D/g, '').slice(-10),
            eventSlug: payment.event_slug,
          }));
        } catch { /* ignore quota */ }
        onDone('/invite');
      } else {
        setShowRetryBill(false);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [showRetryBill, payment, onDone]);

  // While the payment is "processing" (status=pending), poll for the final
  // outcome so the customer is auto-advanced to the receipt (or the failed
  // screen) the instant PayU confirms — no refresh, no relying solely on the
  // WhatsApp. Polls every 4s for up to ~2.5 min, then gives up (the WhatsApp
  // covers the rare slow case). Needs the booking phone in this session.
  React.useEffect(() => {
    if (status !== 'pending' || resolved) return;
    const stored = (typeof window !== 'undefined' && sessionStorage.getItem('bookingPhone')) || '';
    const tenDigit = stored.replace(/^\+91/, '').replace(/^0/, '').replace(/\D/g, '').slice(-10);
    if (tenDigit.length !== 10) return;
    let active = true;
    const tick = async () => {
      const p = await fetchReceipt(tenDigit);
      if (!active || !p) return;
      setPayment(p);
      if (p.status === 'success') setResolved('success');
      else if (p.status === 'failure') setResolved('failed');
    };
    const id = window.setInterval(tick, 4000);
    const stopAt = window.setTimeout(() => { active = false; window.clearInterval(id); }, 150000);
    return () => { active = false; window.clearInterval(id); window.clearTimeout(stopAt); };
  }, [status, resolved, fetchReceipt]);

  const handleSubmitPhone = async () => {
    const t = phoneInput.replace(/^\+91/, '').replace(/^0/, '').replace(/\D/g, '').slice(-10);
    if (t.length !== 10) { setPhoneError('Please enter a valid 10-digit phone number.'); return; }
    setPhoneError('');
    setSubmittingPhone(true);
    const p = await fetchReceipt(t);
    setSubmittingPhone(false);
    if (p) {
      // Remember for next time so future receipt views skip this step.
      try { sessionStorage.setItem('bookingPhone', t); } catch { /* ignore quota errors */ }
      setPayment(p);
    } else {
      setPhoneError("We couldn't find a receipt under that phone. Double-check the number you used to book.");
    }
  };

  const phoneFrame = (children: React.ReactNode) => (
    <div className="h-[100dvh] bg-white sm:min-h-screen sm:h-auto sm:bg-gray-100 flex items-stretch sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full bg-white flex flex-col h-[100dvh] sm:max-w-md sm:h-[85vh] sm:rounded-[2rem] sm:shadow-2xl sm:border-4 sm:border-white overflow-y-auto">
        {children}
      </div>
    </div>
  );

  // Effective status: a 'pending' payment that the poll above confirms flips
  // `resolved`, advancing the customer to the receipt (success) or failed view.
  const view = resolved ?? status;

  // Payment is still being confirmed (e.g. a slow UPI collect). We deliberately
  // do NOT show the failed screen or a retry CTA here — the payment may still
  // succeed, and nudging a retry risks a double charge. The poll above advances
  // this screen automatically once PayU confirms; the WhatsApp is the fallback.
  if (view === 'pending') {
    return phoneFrame(
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
        <div className="w-[68px] h-[68px] rounded-full bg-amber-50 flex items-center justify-center">
          <span className="w-7 h-7 border-[3px] border-amber-200 border-t-amber-500 rounded-full animate-spin" />
        </div>
        <div>
          <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Confirming your payment</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            This usually takes a few seconds for UPI &amp; bank payments. This page updates on its own — no need to refresh, and you'll get a WhatsApp once it's done.
          </p>
          <p className="text-[13px] font-semibold text-gray-400 mt-3">Please don't pay again — you won't be charged twice.</p>
        </div>
        <button
          onClick={() => onDone('/invite')}
          className="mt-1 px-7 py-3 rounded-2xl border border-gray-300 text-gray-700 font-semibold text-sm active:opacity-70 transition-all"
        >Done</button>
      </div>
    );
  }

  // Retry bill: show the NativePaymentOverlay with recovered payment details
  if (view === 'failed' && showRetryBill && payment) {
    const baseAmount = Math.round(Number(payment.amount) / 1.0242);
    return (
      <div className="h-[100dvh] bg-white sm:min-h-screen sm:h-auto sm:bg-gray-100 flex items-stretch sm:items-center justify-center p-0 sm:p-4">
        <div className="w-full bg-white flex flex-col h-[100dvh] sm:max-w-md sm:h-[85vh] sm:rounded-[2rem] sm:shadow-2xl sm:border-4 sm:border-white overflow-hidden relative">
          <NativePaymentOverlay
            eventTitle={payment.event_title ?? ''}
            eventDate={payment.trip_date ?? ''}
            priceAdvance={baseAmount}
            prefillName={payment.name ?? ''}
            prefillPhone={payment.phone ?? ''}
            prefillEmail={appEmailForEvent || (payment.email && payment.email !== 'booking@chaptera.in' ? payment.email : '')}
            lockEmail={!!appEmailForEvent}
            eventSlug={payment.event_slug ?? ''}
            paymentType={payment.payment_type === 'balance' ? 'balance' : 'advance'}
            onClose={() => {
              // If we have enough data, go back to the invite chat (skip phone re-entry)
              if (payment?.event_slug && payment?.name && payment?.phone) {
                sessionStorage.setItem('ca_payu_retry_chat', JSON.stringify({
                  name: payment.name,
                  phone: String(payment.phone).replace(/^\+91/, '').replace(/^0/, '').replace(/\D/g, '').slice(-10),
                  eventSlug: payment.event_slug,
                }));
                onDone('/invite');
              } else {
                setShowRetryBill(false);
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return phoneFrame(
      <div className="flex-1 flex items-center justify-center">
        <svg className="w-8 h-8 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      </div>
    );
  }

  // Payment failed screen — shown after DB row is fetched so Try Again can restore the bill page
  if (view === 'failed') {
    return phoneFrame(
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
        <div className="w-[68px] h-[68px] rounded-full bg-red-50 flex items-center justify-center">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <div>
          <h2 className="text-[24px] font-bold text-gray-900 tracking-tight">Payment Failed</h2>
          <p className="text-sm text-gray-500 mt-1">Your payment could not be processed. No amount was charged.</p>
        </div>
        <button
          onClick={() => {
            if (payment?.event_slug && payment?.event_title && payment?.amount) {
              // Push a history entry so the browser Back button closes the retry
              // bill (returns here, to the Payment Failed screen) instead of
              // silently crossing back into the original /invite document — which
              // re-shows a near-identical bill, making the first Back appear to do
              // nothing. The popstate listener below consumes this entry.
              try { window.history.pushState({ chapteraRetryBill: true }, '', window.location.href); } catch { /* history may be unavailable */ }
              setShowRetryBill(true);
            } else {
              onDone('/invite');
            }
          }}
          className="mt-2 px-8 py-4 rounded-2xl bg-black text-white font-bold text-sm active:opacity-80 transition-all"
        >Try Again</button>
      </div>
    );
  }

  // Success but no payment in state → ask the buyer to re-enter their phone.
  // Hits when sessionStorage.bookingPhone is missing (different device, cleared
  // cache, success URL shared by email). The server-side check still verifies
  // phone == stored phone on the txnid, so this can't leak someone else's
  // receipt to a guesser.
  if (view === 'success' && !payment) {
    return phoneFrame(
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
        <div className="w-[68px] h-[68px] rounded-full bg-green-50 flex items-center justify-center">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <h2 className="text-[22px] font-bold text-gray-900 tracking-tight">Payment Successful</h2>
          <p className="text-sm text-gray-500 mt-1 px-2 leading-relaxed">Enter the phone number you used to book to view your receipt.</p>
        </div>
        <div className="w-full max-w-xs flex flex-col gap-2">
          <input
            type="tel"
            inputMode="numeric"
            placeholder="10-digit phone number"
            value={phoneInput}
            onChange={e => { setPhoneInput(e.target.value); if (phoneError) setPhoneError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmitPhone(); }}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-base outline-none focus:border-gray-900"
          />
          {phoneError && <p className="text-xs text-red-500 text-left">{phoneError}</p>}
          <button
            onClick={handleSubmitPhone}
            disabled={submittingPhone}
            className="mt-1 px-6 py-3 rounded-2xl bg-black text-white font-bold text-sm active:opacity-80 transition-all disabled:opacity-50"
          >{submittingPhone ? 'Loading…' : 'View Receipt'}</button>
        </div>
      </div>
    );
  }

  const paidOn = payment?.created_at
    ? new Date(payment.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Just now';
  const urlPaymentType = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('payment_type')
    : null;
  const paymentType = String(payment?.payment_type || urlPaymentType || '').toLowerCase();
  const paymentForLabel = paymentType === 'advance'
    ? 'Advance'
    : paymentType === 'balance'
      ? 'Remaining Balance'
      : 'Full Payment';

  const handleDownloadReceipt = async () => {
    if (dlLoading) return;

    setDlLoading(true);
    try {
      const { jsPDF } = await import('jspdf');
      const receiptNo = String(txnid || payment?.txnid || 'receipt').replace(/[^a-z0-9-]/gi, '-');
      const amount = `Rs. ${Number(payment?.amount ?? 0).toLocaleString('en-IN')}`;
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const left = 48;
      const right = pageWidth - 48;
      let y = 58;

      doc.setFillColor(17, 24, 39);
      doc.roundedRect(left, y, right - left, 86, 14, 14, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('ISSUED BY CHAPTER', left + 24, y + 30);
      doc.setFontSize(22);
      doc.text('Payment Receipt', left + 24, y + 58);
      doc.setFillColor(52, 199, 89);
      doc.roundedRect(right - 112, y + 26, 88, 26, 13, 13, 'F');
      doc.setFontSize(10);
      doc.text('Successful', right - 92, y + 43);

      y += 124;
      const row = (label: string, value: string, x: number, rowY: number, align: 'left' | 'right' = 'left') => {
        doc.setTextColor(156, 163, 175);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(label.toUpperCase(), x, rowY, { align });
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(11);
        doc.text(value || '-', x, rowY + 18, { align, maxWidth: align === 'right' ? 190 : 230 });
      };

      row('Receipt No.', txnid || payment?.txnid || '-', left, y);
      row('Paid On', paidOn, right, y, 'right');
      row('Customer', payment?.name || '-', left, y + 54);
      row('Contact', payment?.phone || '-', right, y + 54, 'right');

      y += 124;
      doc.setDrawColor(229, 231, 235);
      doc.line(left, y - 26, right, y - 26);
      row('Event', payment?.event_title || '-', left, y);
      if (payment?.trip_date) {
        doc.setTextColor(107, 114, 128);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(payment.trip_date, left, y + 36);
      }

      y += 92;
      doc.line(left, y - 26, right, y - 26);
      row('Payment For', paymentForLabel, left, y);
      doc.setTextColor(3, 7, 18);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(24);
      doc.text(amount, right, y + 18, { align: 'right' });

      y += 78;
      doc.setFillColor(247, 247, 248);
      doc.roundedRect(left, y, right - left, 58, 12, 12, 'F');
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('This receipt confirms successful payment toward the event booking listed above.', left + 18, y + 34);

      doc.save(`chapter-receipt-${receiptNo}.pdf`);
    } catch (error) {
      console.error('Receipt download failed', error);
      alert('Could not download the receipt. Please try again.');
    } finally {
      setDlLoading(false);
    }
  };

  return phoneFrame(
    <div className="flex flex-col px-6 py-10 gap-5 max-w-sm mx-auto w-full">

        {/* Hero */}
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="w-[68px] h-[68px] rounded-full bg-[#34C759]/12 flex items-center justify-center mb-4">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#34C759" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 className="text-[24px] font-bold text-gray-900 tracking-tight text-center">
            Your Spot is Confirmed{payment?.name ? `, ${payment.name.trim().split(' ')[0]}` : ''}!
          </h2>
        </div>

        {/* Warm note — copy varies by payment type:
            - advance: settle-balance reminder ("anytime before X")
            - balance / full: groupchat-add promise (Meeting Spot Details date)
            Both gracefully drop the date clause if it isn't available. */}
        {payment?.event_title && (
          <div className="bg-[#FAF7F2] border border-[#E8E0D5] rounded-2xl px-4 py-3.5">
            {payment?.payment_type === 'advance' ? (
              <p className="text-[13px] text-gray-500 leading-relaxed">
                We're working to give you the best <span className="font-semibold text-gray-600">{payment.event_title}</span> experience!
                {balanceDate
                  ? <> You can settle balance anytime before <span className="font-semibold text-gray-600">{balanceDate}</span>.</>
                  : <> You can settle the balance anytime before due.</>}
                {' '}See you soon 💛
              </p>
            ) : (
              <p className="text-[13px] text-gray-500 leading-relaxed">
                We will add you to <span className="font-semibold text-gray-600">{payment.event_title}</span> groupchat
                {detailsDate ? <> by <span className="font-semibold text-gray-600">{detailsDate}</span></> : null}.
                See you soon 💛
              </p>
            )}
          </div>
        )}

        {/* WhatsApp group join — shown first so it's above the fold */}
        {payment?.whatsapp_group_url && (
          <div className="bg-[#25D366]/8 border border-[#25D366]/20 rounded-3xl px-5 py-5 flex flex-col gap-3">
            <div>
              <p className="text-[13px] font-black text-gray-900 leading-tight">Join Plan Group Chat</p>
              <p className="text-[12px] text-gray-500 mt-0.5">Exact meeting point details & last-minute updates — all in one place.</p>
            </div>
            <style>{`
              @keyframes wa-shimmer {
                0% { transform: skewX(-12deg) translateX(-160%); }
                100% { transform: skewX(-12deg) translateX(360%); }
              }
            `}</style>
            <a
              href={payment.whatsapp_group_url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative overflow-hidden flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#25D366] text-white text-[14px] font-bold active:opacity-80 transition-all"
            >
              <span
                className="pointer-events-none absolute top-0 left-0 h-full"
                style={{ width: '45%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)', animation: 'wa-shimmer 1s ease-in-out 1s infinite', filter: 'blur(2.2px)', boxShadow: '0 -4px 16px rgba(255,255,255,0.22)' }}
              />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Join WhatsApp Group
            </a>
          </div>
        )}

        {/* Invoice card */}
        <div id="payu-receipt-card" className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
          {/* Header */}
          <div className="px-5 py-4 border-b border-black/5 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400">Issued by CHAPTER</p>
              <p className="mt-1 text-[15px] font-black text-gray-950 leading-tight">Payment Receipt</p>
            </div>
            <span className="text-[11px] font-bold text-[#34C759] bg-[#34C759]/10 border border-[#34C759]/30 px-2.5 py-1 rounded-full flex-shrink-0">
              Successful
            </span>
          </div>

          {/* Receipt No + Paid On */}
          <div className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-3 border-b border-black/5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Receipt No.</p>
              <p className="mt-0.5 text-[12px] font-black text-gray-900 break-all">{txnid || payment?.txnid || '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Paid On</p>
              <p className="mt-0.5 text-[13px] font-bold text-gray-900">{paidOn}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Customer</p>
              <p className="mt-0.5 text-[13px] font-bold text-gray-900">{payment?.name || '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Contact</p>
              <p className="mt-0.5 text-[13px] font-bold text-gray-900">{payment?.phone || '—'}</p>
            </div>
          </div>

          {/* Event */}
          <div className="px-5 py-4 border-b border-black/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Event</p>
            <p className="mt-1 text-[15px] font-black text-gray-900 leading-tight">{payment?.event_title || '—'}</p>
            {payment?.trip_date && <p className="mt-1 text-[12px] font-semibold text-gray-500">{payment.trip_date}</p>}
          </div>

          {/* Amount + Payment Mode */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Payment For</p>
                <p className="mt-0.5 text-[14px] font-black text-gray-900">{paymentForLabel}</p>
              </div>
              <p className="text-[22px] font-black text-gray-950 leading-none">
                ₹{Number(payment?.amount ?? 0).toLocaleString('en-IN')}
              </p>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              This receipt confirms successful payment toward the event booking listed above.
            </p>
          </div>

          <div className="px-5 pb-5" data-html2canvas-ignore="true">
            <button
              type="button"
              onClick={handleDownloadReceipt}
              disabled={dlLoading}
              className="w-full py-3 rounded-2xl bg-black text-white text-[14px] font-bold active:opacity-80 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {dlLoading ? (
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              ) : (
                <Download size={16} strokeWidth={2.4} />
              )}
              {dlLoading ? 'Preparing Receipt...' : 'Download Receipt'}
            </button>
          </div>

        </div>

      </div>
  );
}

// ─── PRIVACY SCREEN ────────────────────────────────────────────────────────────
function PrivacyScreen() {
  return (
    <div className="h-[100dvh] overflow-hidden bg-white sm:min-h-screen sm:h-auto sm:bg-gray-100 flex items-stretch sm:items-center justify-center font-sans p-0 sm:p-4">
      <div className="w-full bg-white overflow-hidden flex flex-col h-[100dvh] sm:max-w-md sm:h-[85vh] relative sm:rounded-[2rem] sm:shadow-2xl sm:border-4 sm:border-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-gray-100 flex-shrink-0">
          <a href="/lifestyle" className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F2F2F7] active:opacity-60 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </a>
          <div>
            <p className="text-[17px] font-bold text-gray-900 leading-tight">Privacy Policy</p>
            <p className="text-[12px] text-gray-400">chapter அ</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#F2F2F7]">
          <div className="px-4 py-5 flex flex-col gap-3">

            {/* Intro */}
            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[13px] text-gray-500 leading-relaxed">This Privacy Policy describes how chapter அ collects, uses and protects information provided by customers when booking experiences, activities, group trips and social events.</p>
            </div>

            {/* Privacy items */}
            {[
              ['Information We Collect', 'We may collect customer information such as name, phone number, email address and booking details when a customer fills out a form or makes a booking.'],
              ['How We Use It', 'This information is used to confirm bookings, provide customer support, share logistical details, send payment reminders where applicable and manage the booked experience.'],
              ['Payment Data', 'Payments are processed through secure third-party payment gateways. chapter அ does not store customer card details, UPI PINs or other sensitive payment credentials.'],
              ['Limited Sharing', 'Customer information may be shared only where reasonably required to fulfil an experience, such as with transport, accommodation or activity partners, and only to the extent necessary.'],
              ['Google Sign-In', 'When you sign in with Google, we receive your name and email address to confirm your booking identity. We do not access your Google account beyond these basic profile details.'],
            ].map(([title, body]) => (
              <div key={title} className="bg-white rounded-2xl px-4 py-4">
                <p className="text-[13px] font-bold text-gray-900 mb-1">{title}</p>
                <p className="text-[13px] text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}

            {/* DPDP rights */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 mt-2">Your Rights Under the DPDP Act</p>

            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[13px] font-bold text-gray-900 mb-1">Right to Access &amp; Correction</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">You can request a copy of the personal data we hold about you, or ask us to correct any information that is inaccurate. Email <a href="mailto:chapteraaa.official@gmail.com" className="text-blue-600 underline">chapteraaa.official@gmail.com</a> from the email address linked to your booking, or message us on WhatsApp at +91 8838111564.</p>
            </div>

            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[13px] font-bold text-gray-900 mb-1">Right to Erasure (Delete My Data)</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">You can request deletion of your personal data once your booking obligations are complete. Send an email titled <span className="text-gray-800 font-medium">&ldquo;Delete My Data&rdquo;</span> to <a href="mailto:chapteraaa.official@gmail.com?subject=Delete%20My%20Data" className="text-blue-600 underline">chapteraaa.official@gmail.com</a> with your registered phone number. We will action the request within 30 days. Note: information required for legal/financial recordkeeping (e.g. payment receipts) may be retained for the period mandated by Indian tax and consumer protection law.</p>
            </div>

            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[13px] font-bold text-gray-900 mb-1">Right to Withdraw Consent</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">You may withdraw consent for non-essential communications (marketing, reminders) at any time by emailing us. Withdrawing consent does not affect the legality of processing carried out before withdrawal.</p>
            </div>

            {/* Retention */}
            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[13px] font-bold text-gray-900 mb-1">Data Retention</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">Booking and contact records are retained for up to 36 months after the completed experience to support refunds, customer service, and statutory requirements. Payment records are retained as long as required by Indian tax and accounting law (typically 8 years). After these periods, data is deleted or anonymised.</p>
            </div>

            {/* Cross-border transfer */}
            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[13px] font-bold text-gray-900 mb-1">Where Your Data Is Stored</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">Our primary database is hosted in India (Mumbai region). Some operational tools — including error monitoring (Sentry), analytics (Google Analytics), and customer experience tracking (Contentsquare) — may process limited data on servers outside India. We only share what is necessary for these services to function, and these providers act under their own privacy commitments.</p>
            </div>

            {/* Children */}
            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[13px] font-bold text-gray-900 mb-1">Children &amp; Minors</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">Our experiences are intended for adults aged 18 and above. If we discover that we have collected information from anyone under 18 without verifiable parental consent, we will delete that information promptly. If you believe we hold information about a minor, contact us immediately.</p>
            </div>

            {/* DND */}
            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[13px] font-bold text-gray-900 mb-1">DND / Opt-Out</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">If you wish to stop receiving SMS, email alerts or any other communication from us, send an email to <span className="text-gray-800 font-medium">chapteraaa.official@gmail.com</span> with your mobile number and you will be removed from our alerts list.</p>
            </div>

            {/* Grievance Officer */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 mt-2">Grievance Officer</p>

            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[13px] font-bold text-gray-900 mb-1">For DPDP Complaints</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">As required by the Digital Personal Data Protection Act, 2023, we have designated a Grievance Officer to receive privacy complaints.</p>
              <div className="mt-3 space-y-1">
                <p className="text-[13px] text-gray-700"><span className="text-gray-400">Email:</span> <a href="mailto:chapteraaa.official@gmail.com?subject=DPDP%20Grievance" className="text-blue-600 underline">chapteraaa.official@gmail.com</a></p>
                <p className="text-[13px] text-gray-700"><span className="text-gray-400">WhatsApp:</span> <a href="https://wa.me/918838111564" className="text-blue-600 underline">+91 8838111564</a></p>
              </div>
              <p className="text-[12px] text-gray-400 leading-relaxed mt-3">We will acknowledge your complaint within 7 working days and respond substantively within 30 days. If you are not satisfied with our response, you may approach the Data Protection Board of India.</p>
            </div>

            {/* Changes */}
            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[13px] font-bold text-gray-900 mb-1">Changes to this Policy</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">chapter அ reserves the right to modify this privacy policy at any time. Changes are effective immediately upon being published here.</p>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[13px] font-bold text-gray-900 mb-1">Contact</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">For privacy-related questions, email us at <a href="mailto:chapteraaa.official@gmail.com" className="text-blue-600 underline">chapteraaa.official@gmail.com</a> or WhatsApp us at <a href="https://wa.me/918838111564" className="text-blue-600 underline">+91 8838111564</a>.</p>
            </div>

            {/* Footer note */}
            <p className="text-center text-[11px] text-gray-400 pb-4">Last updated: June 2026 · chaptera.in</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TERMS OF SERVICE SCREEN ───────────────────────────────────────────────────
function TermsScreen() {
  return (
    <div className="h-[100dvh] overflow-hidden bg-white sm:min-h-screen sm:h-auto sm:bg-gray-100 flex items-stretch sm:items-center justify-center font-sans p-0 sm:p-4">
      <div className="w-full bg-white overflow-hidden flex flex-col h-[100dvh] sm:max-w-md sm:h-[85vh] relative sm:rounded-[2rem] sm:shadow-2xl sm:border-4 sm:border-white">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-gray-100 flex-shrink-0">
          <a href="/lifestyle" className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F2F2F7] active:opacity-60 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </a>
          <div>
            <p className="text-[17px] font-bold text-gray-900 leading-tight">Terms of Service</p>
            <p className="text-[12px] text-gray-400">chapter அ</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#F2F2F7]">
          <div className="px-4 py-5 flex flex-col gap-3">

            {/* Intro */}
            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[13px] text-gray-500 leading-relaxed">These terms apply to bookings made through chapter அ for experiences, activities, group trips and social events. By completing a booking, you agree to these terms.</p>
            </div>

            {/* Full Terms & Conditions (single-source shared content) */}
            <div className="bg-white rounded-2xl px-4 py-4">
              <TermsContent />
            </div>

            {/* General note */}
            <div className="bg-white rounded-2xl px-4 py-4">
              <p className="text-[13px] font-bold text-gray-900 mb-1">Governing Terms</p>
              <p className="text-[13px] text-gray-500 leading-relaxed">This online payment system is provided by CHAPTER. CHAPTER may update these terms from time to time and any changes will be effective immediately on being set out here. The country of domicile for CHAPTER is India.</p>
            </div>

            {/* Footer note */}
            <p className="text-center text-[11px] text-gray-400 pb-4">Last updated: May 2026 · chaptera.in</p>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── LIVE CHAT SCREEN ─────────────────────────────────────────────────────────
function LiveChatScreen({ onBack }: { onBack: () => void }) {
  const convId       = localStorage.getItem('liveConversationId') ?? '';
  const convName     = localStorage.getItem('liveConvName') ?? '';
  const convTitle    = localStorage.getItem('liveConvEventTitle') ?? '';
  const [messages, setMessages]       = useState<any[]>([]);
  const [input, setInput]             = useState('');
  const [sending, setSending]         = useState(false);
  const [resolved, setResolved]       = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!convId) return;
    supabase.from('doubt_messages').select('*')
      .eq('conversation_id', convId).order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setMessages(data); });
    supabase.from('doubt_conversations').select('status')
      .eq('id', convId).single()
      .then(({ data }) => { if (data) setResolved(data.status === 'resolved'); });
    const sub = supabase.channel(`live-screen-${convId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'doubt_messages',
        filter: `conversation_id=eq.${convId}`,
      }, payload => setMessages(prev => [...prev, payload.new]))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'doubt_conversations',
        filter: `id=eq.${convId}`,
      }, payload => setResolved((payload.new as any).status === 'resolved'))
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [convId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const body = input.trim();
    setInput('');
    await supabase.from('doubt_messages').insert({ conversation_id: convId, sender: 'user', body });
    setSending(false);
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });

  const handleBack = () => {
    ['liveConversationId', 'liveConvName', 'liveConvEventSlug', 'liveConvEventTitle'].forEach(k => localStorage.removeItem(k));
    onBack();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#ECE5DD] font-sans" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="bg-[#075E54] text-white px-4 pt-10 pb-3 flex items-center gap-3 shrink-0">
        <button onClick={handleBack} className="p-1 -ml-1 opacity-80 active:opacity-60">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="w-9 h-9 rounded-full bg-[#128C7E] flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-black">அ</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[15px] leading-tight">chapter அ</div>
          <div className="text-[12px] opacity-70 truncate">{convTitle || 'Live Chat'}</div>
        </div>
        {resolved && (
          <span className="text-[11px] bg-white/20 rounded-full px-2.5 py-0.5 font-semibold">Resolved</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-2">
        {/* Context chip */}
        <div className="flex justify-center mb-1">
          <span className="bg-[#FFF3CD] text-[#856404] text-[11px] font-semibold px-3 py-1 rounded-full shadow-sm">
            {convName ? `Hi ${convName.split(' ')[0]}! We'll reply here.` : "We'll reply here directly."}
          </span>
        </div>

        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl shadow-sm text-[14px] leading-snug relative ${
                isUser ? 'bg-[#DCF8C6] text-gray-900 rounded-br-sm' : 'bg-white text-gray-900 rounded-bl-sm'
              }`}>
                {!isUser && <div className="text-[11px] font-bold text-[#075E54] mb-0.5">chapter அ</div>}
                <div className="whitespace-pre-wrap break-words">{msg.body}</div>
                <div className="text-[10px] text-gray-400 mt-1 text-right">{formatTime(msg.created_at)}</div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="flex justify-center mt-8">
            <div className="bg-white rounded-2xl px-5 py-4 shadow-sm text-center max-w-[260px]">
              <div className="text-2xl mb-1">💬</div>
              <p className="text-[13px] text-gray-600 font-medium">Your message is sent!</p>
              <p className="text-[12px] text-gray-400 mt-0.5">We'll reply here shortly.</p>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      {!resolved ? (
        <div className="bg-[#F0F0F0] px-3 py-2.5 flex items-end gap-2.5 shrink-0 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Type a message…"
            rows={1}
            style={{ resize: 'none', maxHeight: 120, overflowY: 'auto' }}
            className="flex-1 bg-white rounded-2xl px-4 py-2.5 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none leading-snug"
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-[#075E54] rounded-full flex items-center justify-center shrink-0 disabled:opacity-40 active:scale-95 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      ) : (
        <div className="bg-white px-4 py-4 text-center text-[13px] text-gray-500 shrink-0">
          This conversation has been marked as resolved.
          <button onClick={handleBack} className="block mx-auto mt-2 text-[#075E54] font-semibold text-[13px]">← Back to app</button>
        </div>
      )}
    </div>
  );
}

// ─── IN-APP BROWSER NUDGE ─────────────────────────────────────────────────────
function InAppBrowserNudge() {
  const isInstagram = typeof navigator !== 'undefined' && /Instagram/i.test(navigator.userAgent);
  const isFacebook  = typeof navigator !== 'undefined' && /FBAN|FBAV/i.test(navigator.userAgent);
  const isAndroid   = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const isInApp = isInstagram || isFacebook;

  useEffect(() => {
    if (!isInApp) return;
    const scrollY = window.scrollY;
    const prevPosition     = document.body.style.position;
    const prevTop          = document.body.style.top;
    const prevWidth        = document.body.style.width;
    const prevOverflow     = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow  = 'hidden';
    document.body.style.position  = 'fixed';
    document.body.style.top       = `-${scrollY}px`;
    document.body.style.width     = '100%';

    const preventTouch = (e: TouchEvent) => e.preventDefault();
    window.addEventListener('touchmove', preventTouch, { passive: false });

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow  = prevOverflow;
      document.body.style.position  = prevPosition;
      document.body.style.top       = prevTop;
      document.body.style.width     = prevWidth;
      window.scrollTo(0, scrollY);
      window.removeEventListener('touchmove', preventTouch);
    };
  }, [isInApp]);

  if (!isInApp) return null;

  const openInBrowser = () => {
    const url = window.location.href;
    window.location.href =
      `intent://${window.location.host}${window.location.pathname}${window.location.search}` +
      `#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
  };

  return (
    <>
      {/* Non-dismissible backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 z-[9999] backdrop-blur-sm"
        onClick={e => { e.preventDefault(); e.stopPropagation(); }}
      />

      {/* iOS: bouncing arrow pointing to the ··· button top-right */}
      {!isAndroid && (
        <motion.div
          className="fixed z-[10001] pointer-events-none flex flex-col items-center"
          style={{ top: 52, right: 18 }}
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
            <path d="M12 2 L12 28M12 2 L4 12M12 2 L20 12" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-white text-xs font-bold mt-1" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>tap here</span>
        </motion.div>
      )}

      {/* Centered card */}
      <div className="fixed inset-0 z-[10000] flex items-center justify-center px-6 pointer-events-none">
        <div className="w-full max-w-sm bg-white rounded-3xl px-6 pt-7 pb-8 shadow-2xl pointer-events-auto">
          {isAndroid ? (
            <>
              <h2 className="text-center font-black text-lg text-gray-900 mb-2">Wait a minute!</h2>
              <p className="text-center text-sm text-gray-500 leading-relaxed mb-5">
                Instagram's browser doesn't fully support our site
              </p>
              <button
                onClick={openInBrowser}
                className="relative w-full py-4 rounded-2xl bg-[#FFD700] text-black font-bold text-base active:opacity-80 transition-opacity overflow-hidden"
              >
                <motion.span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                  animate={{ x: ['0%', '240%'] }}
                  transition={{ duration: 0.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.4 }}
                />
                <span className="relative z-10 inline-flex items-center justify-center gap-2">
                  Open in Browser
                  <ArrowRight size={18} strokeWidth={2.8} />
                </span>
              </button>
            </>
          ) : (
            <>
              <h2 className="text-center font-black text-lg text-gray-900 mb-1">Wait a minute!</h2>
              <p className="text-center text-sm text-gray-500 leading-relaxed mb-6">
                Instagram's browser doesn't fully support our website, follow steps to continue.
              </p>
              <div className="bg-gray-50 rounded-2xl p-4 mb-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#FFD700] flex-shrink-0 flex items-center justify-center font-black text-sm text-black mt-0.5">1</div>
                <div>
                  <p className="font-bold text-sm text-gray-800">Tap the <span className="font-black">···</span> menu</p>
                  <p className="text-xs text-gray-500 mt-0.5">See top right of your screen</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#FFD700] flex-shrink-0 flex items-center justify-center font-black text-sm text-black">2</div>
                <div>
                  <p className="font-bold text-sm text-gray-800">Tap <span className="italic">"Open in external browser"</span></p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── APP WRAPPER ───────────────────────────────────────────────────────────────
export default function App() {
  // ── Live chat intercept: if user has an open conversation, show it immediately
  const [showLiveChat, setShowLiveChat] = useState(
    () => typeof window !== 'undefined' && !!localStorage.getItem('liveConversationId')
  );
  if (showLiveChat) {
    return <LiveChatScreen onBack={() => setShowLiveChat(false)} />;
  }

  const [routePath, setRoutePath] = useState(() => {
    if (typeof window === 'undefined') return '/';
    // The PWA is admin-only. Whenever it's launched in standalone mode, force
    // the route to /admin. This handles iOS Safari (which uses the install-time
    // URL instead of the manifest's start_url) and any case where the launch
    // URL got stored as something other than /admin.
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (isStandalone && window.location.pathname !== '/admin') {
      window.history.replaceState({}, '', '/admin');
      return '/admin';
    }
    return window.location.pathname;
  });
  const [routeSearch, setRouteSearch] = useState(typeof window !== 'undefined' ? window.location.search : '');
  const isStandaloneApp = typeof window !== 'undefined'
    && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);
  const isAdmin = routePath === '/admin';
  const isLegacyJoinPage = routePath === '/join';
  const isLifestylePage = routePath === '/lifestyle' || isLegacyJoinPage;
  const isGalcodePage = routePath === '/galcode';
  const isSharedInvitePage = routePath === '/invite';
  const isInvitePage = routePath.startsWith('/invite/');
  const isPrivacyPage = routePath === '/privacy';
  const isTermsPage = routePath === '/termsofservice';
  const inviteSlug = isInvitePage ? routePath.replace('/invite/', '').split('/')[0] : '';
  const hasPreviewParam = routeSearch.includes('preview_event');
  // Latch PayU return params on mount — must happen before the URL gets replaced by the route sync effect
  const [payuReturnStatus, setPayuReturnStatus] = useState<'success' | 'failed' | 'pending' | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('payment_status') as 'success' | 'failed' | 'pending' | null;
  });
  const [payuReturnTxnid] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('txnid') ?? '';
  });
  const isPayUReturn = !!payuReturnStatus;
  const isMyPlansPage = routePath === '/myplans';
  // /plans and /myplans both suppress the homepage (myplans redirects to /invite, plans renders AppFlow)
  const isAppFlowPath = routePath === '/plans' || isMyPlansPage;
  const [showHomepage, setShowHomepage] = useState(!isStandaloneApp && !isAdmin && !hasPreviewParam && !isAppFlowPath && !isLifestylePage && !isGalcodePage && !isSharedInvitePage && !isInvitePage && !isPayUReturn && !isPrivacyPage && !isTermsPage);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isAdmin) trackEvent('page_view');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncRoute = () => {
      if (window.location.pathname === '/join') {
        const nextSearch = window.location.search || '';
        window.history.replaceState({}, '', `/lifestyle${nextSearch}`);
        setRoutePath('/lifestyle');
        setRouteSearch(nextSearch);
        return;
      }
      setRoutePath(window.location.pathname);
      setRouteSearch(window.location.search);
    };
    window.addEventListener('popstate', syncRoute);
    // /join → /lifestyle is still handled client-side because Vercel only
    // sees the request once; if a customer has a legacy bookmark to /join
    // we want the URL bar to update without a full document reload.
    if (window.location.pathname === '/join') {
      const nextSearch = window.location.search || '';
      window.history.replaceState({}, '', `/lifestyle${nextSearch}`);
      syncRoute();
      return () => window.removeEventListener('popstate', syncRoute);
    }
    // The "/" → "/lifestyle" redirect used to live here. It's now done by
    // Vercel server-side (see vercel.json) so the response is a true 307
    // and there's no flash of the homepage before React boots. The PWA
    // launches at /admin (manifest.json start_url), so a server-side
    // redirect at / is safe — no standalone bypass needed.
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  const enterApp = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      window.history.pushState({}, '', '/');
      setRoutePath('/');
      setRouteSearch('');
    }
    setShowHomepage(false);
  };

  // Navigate within the SPA — no page reload, so the sending animation completes
  // cleanly and AppFlow mounts with previewLoading=true already blocking the chat UI
  const enterAppWithPreview = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      window.history.pushState({}, '', '/?preview_event=502f25f2-a3ab-481a-83b3-f4e2cded9b82');
      setRoutePath('/');
      setRouteSearch('?preview_event=502f25f2-a3ab-481a-83b3-f4e2cded9b82');
    }
    setShowHomepage(false);
  };

  const continueFromJoin = () => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.history.pushState({}, '', '/plans');
    setRoutePath('/plans');
    setRouteSearch('');
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const isLetterPage = (isLifestylePage || isGalcodePage) && !hasPreviewParam;
    if (isAdmin || showHomepage || isLetterPage || isSharedInvitePage || isInvitePage) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      return;
    }
    // AppFlow is a fixed-height mobile UI — lock body scroll so only internal containers scroll
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showHomepage, isAdmin, isLifestylePage, isGalcodePage, isSharedInvitePage, isInvitePage, hasPreviewParam]);

  if (isPayUReturn) return (
    <PayUReturnScreen
      status={payuReturnStatus!}
      txnid={payuReturnTxnid}
      onDone={(nextPath?: string) => {
        setPayuReturnStatus(null);
        sessionStorage.removeItem('ca_payu_event_slug');
        if (nextPath?.startsWith('/')) {
          window.history.replaceState({}, '', nextPath);
          setRoutePath(nextPath);
          setRouteSearch('');
        } else if (nextPath) {
          const path = `/invite/${nextPath}`;
          window.history.replaceState({}, '', path);
          setRoutePath(path);
          setRouteSearch('');
        } else {
          window.history.replaceState({}, '', '/');
          setRoutePath('/');
          setRouteSearch('');
          setShowHomepage(false);
        }
      }}
    />
  );

  if (isMyPlansPage) {
    window.location.replace('/invite');
    return null;
  }
  if (isPrivacyPage) return <PrivacyScreen />;
  if (isTermsPage) return <TermsScreen />;

  if (isAdmin) return <AdminPanel />;

  if (isSharedInvitePage) {
    return (
      <>
        <InAppBrowserNudge />
        <LandscapeBlocker />
        <SharedInviteFlow onNavigateToLifestyle={() => { window.location.href = '/plans'; }} />
      </>
    );
  }

  if (isInvitePage && inviteSlug) {
    return (
      <>
        <InAppBrowserNudge />
        <LandscapeBlocker />
        <InviteFlow slug={inviteSlug} />
      </>
    );
  }

  if (isLifestylePage && !hasPreviewParam) {
    return (
      <>
        <InAppBrowserNudge />
        <LandscapeBlocker />
        <JoinLetterPage
          onContinue={continueFromJoin}
        />
      </>
    );
  }

  if (isGalcodePage && !hasPreviewParam) {
    return (
      <>
        <InAppBrowserNudge />
        <LandscapeBlocker />
        <JoinLetterPage
          onContinue={continueFromJoin}
          layers={GALCODE_POSTER_LAYER_SRC}
          theme={GALCODE_POSTER_THEME}
        />
      </>
    );
  }

  if (showHomepage) {
    return (
      <>
        <InAppBrowserNudge />
        <LandscapeBlocker />
        <AnimatePresence>
          <motion.div
            key="homepage"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <HomePage onEnterApp={enterApp} onViewExperiences={enterAppWithPreview} />
          </motion.div>
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <InAppBrowserNudge />
      <LandscapeBlocker />
      <AppFlow />
      {/* Vercel Speed Insights — ships real-user Core Web Vitals (LCP / INP / CLS)
          to the Vercel dashboard. Tiny script (~2KB), no PII collected. */}
      <SpeedInsights />
    </>
  );
}
