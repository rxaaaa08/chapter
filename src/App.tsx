import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Send, RotateCcw, LockKeyhole } from 'lucide-react';
import chatProfile from './assets/chat-profile.jpg';
import AppFlow from './AppFlow';
import AdminPanel from './AdminPanel';
import { trackEvent, supabase } from './supabase';

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
      policy: 'Twin sharing by default; upgrade to solo room on request'
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

type PosterLayerSrc = typeof POSTER_LAYER_SRC;
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
  layers = POSTER_LAYER_SRC,
  theme = LIFESTYLE_POSTER_THEME,
}: {
  onContinue: () => void;
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
                <span>Tap to Enter</span>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <ArrowRight size={20} strokeWidth={3} />
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

type InviteStep = 'card' | 'flow';

type SharedInviteMatch = {
  slug: string;
  title: string;
  dateLabel: string;
};

function SharedInviteFlow() {
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasFailedOnce, setHasFailedOnce] = useState(false);
  const [matches, setMatches] = useState<SharedInviteMatch[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [wipePhase, setWipePhase] = useState<'idle' | 'wiping' | 'revealed'>('idle');
  const [pendingSlug, setPendingSlug] = useState('');
  const [verifiedSlug, setVerifiedSlug] = useState('');
  const [showInviteBooking, setShowInviteBooking] = useState(false);
  const isPhoneReady = /^\d{10}$/.test(form.phone);
  const isFormReady = form.name.trim().length > 0 && isPhoneReady;
  const isInviteRevealed = wipePhase === 'revealed';

  useEffect(() => {
    let cancelled = false;
    const srcs = [...Object.values(POSTER_LAYER_SRC), '/invite-verification-frame.png'];
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

    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('title, invite_slug, event_dates(start_date, status)')
      .eq('is_active', true)
      .not('invite_slug', 'is', null);

    if (eventsError || !eventsData) {
      setError('Could not check invites right now. Please try again.');
      setLoading(false);
      return;
    }

    const inviteEvents = (eventsData as any[])
      .filter(event => String(event.invite_slug ?? '').trim())
      .map(event => ({
        title: String(event.title ?? 'chapter அ invite'),
        slug: String(event.invite_slug ?? '').trim(),
        dates: Array.isArray(event.event_dates) ? event.event_dates : [],
      }));

    const checks = await Promise.all(inviteEvents.map(async (event) => {
      const { data } = await supabase
        .from('invited_numbers')
        .select('id')
        .eq('event_slug', event.slug)
        .eq('phone', tenDigit)
        .maybeSingle();

      if (!data) return null;
      const upcomingDates = event.dates
        .map((date: any) => String(date.start_date ?? ''))
        .filter(Boolean)
        .sort();
      const firstDate = upcomingDates[0] ?? '';
      const dateLabel = firstDate
        ? new Date(`${firstDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Invite';
      return { slug: event.slug, title: event.title, dateLabel };
    }));

    const found = checks.filter(Boolean) as SharedInviteMatch[];
    setLoading(false);

    if (found.length === 0) {
      setError("not_found");
      setHasFailedOnce(true);
      return;
    }

    if (found.length === 1) {
      const nextSlug = found[0].slug;
      setPendingSlug(nextSlug);
      const loaders = Object.values(INVITE_LAYER_SRC).map(src => new Promise<void>(resolve => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = src;
      }));
      Promise.all(loaders).then(() => {
        setWipePhase('wiping');
        window.setTimeout(() => {
          setVerifiedSlug(nextSlug);
          setWipePhase('revealed');
        }, 760);
      });
      return;
    }

    setMatches(found);
  };

  const openSharedInviteBooking = () => {
    if (!verifiedSlug) return;
    if (typeof window !== 'undefined') {
      window.history.pushState({ chapteraInviteStep: 'flow' }, '', window.location.href);
    }
    setShowInviteBooking(true);
  };

  if (selectedSlug) return <InviteFlow slug={selectedSlug} initialPosterLoaded />;

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
        <div style={{ height: '100%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px, 2.2vh, 20px)' }}>
          <div style={{ width: 'min(90vw, 360px)', position: 'relative', borderRadius: '0 0 2rem 2rem', overflow: 'hidden', background: '#fff' }}>
          <div className="relative w-full aspect-[874/1330] bg-white overflow-hidden">
            {/* Invite frame revealed underneath during wipe */}
            {wipePhase !== 'idle' && (
              <img src={INVITE_LAYER_SRC.frame} aria-hidden="true" style={POSTER_LAYER_STYLE} />
            )}
            {/* Verification frame — clips away top-down during wipe */}
            <motion.img
              src="/invite-verification-frame.png"
              aria-hidden="true"
              style={POSTER_LAYER_STYLE}
              animate={{ clipPath: wipePhase !== 'idle' ? 'inset(0 0 100% 0)' : 'inset(0% 0 0% 0)' }}
              transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
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
                animate={{ opacity: isFormReady && !error ? 1 : 0 }}
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

            <motion.div
              className="absolute inset-x-[10%] top-[39%] z-10 space-y-3"
              animate={{ opacity: wipePhase === 'idle' ? 1 : 0 }}
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
                <label className="block text-[11px] uppercase tracking-[0.18em] font-semibold text-[#8a7b43] mb-1">WhatsApp Number</label>
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

              {matches.length > 1 && (
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
                      onClick={() => setSelectedSlug(match.slug)}
                      className="w-full rounded-xl bg-white px-3 py-3 text-left active:scale-[0.99] transition-transform"
                    >
                      <span className="block text-[14px] font-black leading-tight text-[#2f2c25]">{match.title}</span>
                      <span className="mt-1 block text-[11px] font-bold text-[#8f876e]">{match.dateLabel}</span>
                    </button>
                  ))}
                </motion.div>
              )}

            </motion.div>
          </div>
          <div style={{ minHeight: 72, height: error ? 'auto' : 72, position: 'relative', flexShrink: 0 }}>
            <motion.button
                  type="button"
                  aria-label={isInviteRevealed ? 'Confirm your spot' : 'Open invitation'}
                  disabled={loading || !isFormReady || !!error || wipePhase === 'wiping'}
                  onClick={isInviteRevealed ? openSharedInviteBooking : findInviteMatches}
                  animate={{
                    background: error ? '#fff1f2' : isFormReady ? LIFESTYLE_POSTER_THEME.ctaBackground : '#F2F2F7',
                    color: error ? '#ef4444' : isFormReady ? LIFESTYLE_POSTER_THEME.ctaTextColor : '#9ca3af',
                    boxShadow: isFormReady && !error ? LIFESTYLE_POSTER_THEME.ctaShadow : 'none',
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  style={{
                    pointerEvents: isFormReady && !error && wipePhase !== 'wiping' ? 'auto' : 'none',
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: error ? 'auto' : '72px',
                    minHeight: '72px',
                    border: 'none',
                    borderRadius: '0 0 2rem 2rem',
                    cursor: loading ? 'wait' : 'pointer',
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
                      animate={isFormReady ? { x: ['-100%', '300%'] } : { x: '-100%' }}
                      transition={{ duration: 0.8, repeat: isFormReady ? Infinity : 0, repeatDelay: 3.0, ease: 'easeInOut' }}
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
                    }}
                  >
                    {loading ? (
                      <span className="inline-block w-5 h-5 border-2 border-black/20 border-t-black rounded-full" style={{ animation: 'spin 0.7s linear infinite' }} />
                    ) : error ? (
                      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 16px', textAlign: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', lineHeight: 1.3 }}>This number isn't on our invite list.</span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#f87171', lineHeight: 1.4 }}>Re-enter the number you used in the application form.</span>
                      </span>
                    ) : wipePhase !== 'idle' ? (
                      <>
                        <span>Tap to Continue</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          <ArrowRight size={20} strokeWidth={3} />
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Open Invitation</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {isFormReady ? <ArrowRight size={20} strokeWidth={3} /> : <LockKeyhole size={16} strokeWidth={2.5} />}
                        </span>
                      </>
                    )}
                  </span>
                </motion.button>
          </div>
          {hasFailedOnce && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', paddingTop: 14, paddingBottom: 4 }}
            >
              <span style={{ fontSize: 13, color: '#9ca3af' }}>Haven't applied yet? </span>
              <a href="/lifestyle" style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textDecoration: 'underline' }}>Apply Now</a>
            </motion.div>
          )}
          </div>
        </div>
        {showInviteBooking && verifiedSlug && (
          <AppFlow
            inviteSlug={verifiedSlug}
            inviteVerifiedUser={{
              name: form.name.trim(),
              phone: form.phone,
            }}
            onClose={() => setShowInviteBooking(false)}
          />
        )}
      </div>
    </div>
  );
}

function InviteFlow({ slug, initialPosterLoaded = false }: { slug: string; initialPosterLoaded?: boolean }) {
  const [step, setStep] = useState<InviteStep>('card');
  const [posterLoaded, setPosterLoaded] = useState(initialPosterLoaded);

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
      setStep('card');
    };
    window.addEventListener('popstate', handleInviteBack);
    return () => window.removeEventListener('popstate', handleInviteBack);
  }, []);

  const openInviteBooking = () => {
    if (typeof window !== 'undefined') {
      window.history.pushState({ chapteraInviteStep: 'flow' }, '', window.location.href);
    }
    setStep('flow');
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

        {step === 'flow' && <AppFlow inviteSlug={slug} onClose={() => setStep('card')} />}

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

// ─── IN-APP BROWSER NUDGE ──────────────────────────────────────────────────────
function InAppBrowserNudge() {
  const isInstagram = typeof navigator !== 'undefined' && /Instagram/i.test(navigator.userAgent);
  const isFacebook  = typeof navigator !== 'undefined' && /FBAN|FBAV/i.test(navigator.userAgent);
  const isAndroid   = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const isInApp = isInstagram || isFacebook;

  useEffect(() => {
    if (!isInApp) return;
    // iOS Safari / Instagram WebView ignores overflow:hidden on body.
    // The only reliable fix is position:fixed + capturing the scroll offset.
    const scrollY = window.scrollY;
    const prevPosition = document.body.style.position;
    const prevTop      = document.body.style.top;
    const prevWidth    = document.body.style.width;
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow  = 'hidden';
    document.body.style.position  = 'fixed';
    document.body.style.top       = `-${scrollY}px`;
    document.body.style.width     = '100%';

    // Also block touchmove at the window level so rubber-band scroll is suppressed
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
    // Android: fire a Chrome intent; falls back to the URL in any browser if Chrome isn't default
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
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />

      {/* iOS: animated arrow pointing to the ··· button in the top-right */}
      {!isAndroid && (
        <motion.div
          className="fixed z-[10001] pointer-events-none flex flex-col items-center"
          style={{ top: 32, right: 13 }}
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Arrow pointing up */}
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
          /* ── Android: one-tap button ── */
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
          /* ── iOS: manual steps ── */
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
  const [routePath, setRoutePath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [routeSearch, setRouteSearch] = useState(typeof window !== 'undefined' ? window.location.search : '');
  const isAdmin = routePath === '/admin';
  const isPlansPage = routePath === '/plans';
  const isLegacyJoinPage = routePath === '/join';
  const isLifestylePage = routePath === '/lifestyle' || isLegacyJoinPage;
  const isGalcodePage = routePath === '/galcode';
  const isSharedInvitePage = routePath === '/invite';
  const isInvitePage = routePath.startsWith('/invite/');
  const inviteSlug = isInvitePage ? routePath.replace('/invite/', '').split('/')[0] : '';
  const hasPreviewParam = routeSearch.includes('preview_event');
  const [showHomepage, setShowHomepage] = useState(!isAdmin && !hasPreviewParam && !isPlansPage && !isLifestylePage && !isGalcodePage && !isSharedInvitePage && !isInvitePage);

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
    if (window.location.pathname === '/join') {
      const nextSearch = window.location.search || '';
      window.history.replaceState({}, '', `/lifestyle${nextSearch}`);
      syncRoute();
      return () => window.removeEventListener('popstate', syncRoute);
    }
    if (window.location.pathname === '/' && !window.location.search.includes('preview_event')) {
      window.history.replaceState({}, '', '/aboutus');
      syncRoute();
    }
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
      window.history.pushState({}, '', '/?preview_event=1a59de1a-8ce4-49f1-a436-96aeaaa0ad61');
      setRoutePath('/');
      setRouteSearch('?preview_event=1a59de1a-8ce4-49f1-a436-96aeaaa0ad61');
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

  if (isAdmin) return <AdminPanel />;

  if (isSharedInvitePage) {
    return (
      <>
        <LandscapeBlocker />
        <InAppBrowserNudge />
        <SharedInviteFlow />
      </>
    );
  }

  if (isInvitePage && inviteSlug) {
    return (
      <>
        <LandscapeBlocker />
        <InAppBrowserNudge />
        <InviteFlow slug={inviteSlug} />
      </>
    );
  }

  if (isLifestylePage && !hasPreviewParam) {
    return (
      <>
        <LandscapeBlocker />
        <InAppBrowserNudge />
        <JoinLetterPage onContinue={continueFromJoin} />
      </>
    );
  }

  if (isGalcodePage && !hasPreviewParam) {
    return (
      <>
        <LandscapeBlocker />
        <InAppBrowserNudge />
        <JoinLetterPage onContinue={continueFromJoin} layers={GALCODE_POSTER_LAYER_SRC} theme={GALCODE_POSTER_THEME} />
      </>
    );
  }

  if (showHomepage) {
    return (
      <>
        <LandscapeBlocker />
        <InAppBrowserNudge />
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
      <LandscapeBlocker />
      <InAppBrowserNudge />
      <AppFlow />
    </>
  );
}
