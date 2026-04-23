import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Send, RotateCcw } from 'lucide-react';
import chatProfile from './assets/chat-profile.jpg';
import AppFlow from './AppFlow';
import AdminPanel from './AdminPanel';
import { trackEvent } from './supabase';

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

function JoinLetterPage({ onContinue }: { onContinue: () => void }) {
  const posterUrl = '/join-poster-founder.png?v=20260423-1';
  const [posterLoaded, setPosterLoaded] = useState(false);

  return (
    <div className="h-[100dvh] overflow-hidden bg-white sm:min-h-screen sm:h-auto sm:bg-white flex items-stretch sm:items-center justify-center p-0 sm:p-4 font-sans">
      <div className="w-full bg-white overflow-hidden flex flex-col h-[100dvh] sm:max-w-md sm:h-[85vh] relative sm:rounded-[2rem] sm:shadow-2xl sm:border-4 sm:border-white">
        <div style={{ height: '100%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px, 2.2vh, 20px)' }}>
          <div
            style={{
              width: 'min(86%, 360px)',
              height: '86%',
              overflow: 'hidden',
              color: '#232323',
              fontFamily: "'DM Sans', sans-serif",
              position: 'relative',
              borderRadius: '2rem',
              boxShadow: '0 24px 70px rgba(0,0,0,0.16)',
              border: 'none',
              background: '#fff',
            }}
          >
          {!posterLoaded && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#fff',
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 24,
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                style={{ position: 'relative' }}
              >
                <motion.div
                  animate={{ opacity: [0.15, 0.45, 0.15], scale: [1, 1.18, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 16,
                    background: '#FFD700',
                    filter: 'blur(10px)',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: '#000',
                    boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
                    overflow: 'hidden',
                    padding: 6,
                  }}
                >
                  <img
                    src={chatProfile}
                    alt="chapter அ"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'scale(1.02) translateY(2px)' }}
                  />
                </div>
              </motion.div>
            </div>
          )}
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                position: 'relative',
                background: '#FFD700',
              }}
            >
              <img
                src={posterUrl}
                alt="Chapter A founder poster"
                onLoad={() => setPosterLoaded(true)}
                onError={() => setPosterLoaded(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  flexShrink: 0,
                  objectFit: 'cover',
                  objectPosition: 'bottom center',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 94%, rgba(0,0,0,0.72) 97%, rgba(0,0,0,0.34) 99%, rgba(0,0,0,0) 100%)',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskSize: '100% 100%',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 94%, rgba(0,0,0,0.72) 97%, rgba(0,0,0,0.34) 99%, rgba(0,0,0,0) 100%)',
                  maskRepeat: 'no-repeat',
                  maskSize: '100% 100%',
                }}
              />
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 8,
                  pointerEvents: 'none',
                  backgroundImage: `url(${posterUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'bottom center',
                  filter: 'blur(4px)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 58%, rgba(0,0,0,1) 100%)',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskSize: '100% 100%',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.15) 58%, rgba(0,0,0,1) 100%)',
                  maskRepeat: 'no-repeat',
                  maskSize: '100% 100%',
                }}
              />
            </div>
            <button
              type="button"
              aria-label="Enter chapter plans"
              onClick={onContinue}
              style={{
                flexShrink: 0,
                width: '100%',
                height: '72px',
                maxHeight: '72px',
                border: 'none',
                borderRadius: '0 0 2rem 2rem',
                background: '#FFD700',
                color: '#111',
                cursor: 'pointer',
                overflow: 'visible',
                position: 'relative',
                marginTop: '-2px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: 'none',
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
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.34) 50%, transparent 100%)',
                    transform: 'skewX(-14deg)',
                    filter: 'blur(1.4px)',
                  }}
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
                />
              </span>
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: 8,
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                  pointerEvents: 'none',
                  background: 'linear-gradient(to bottom, rgba(255,215,0,1) 0%, rgba(255,215,0,1) 62%, rgba(255,215,0,0) 100%)',
                  filter: 'blur(4px)',
                }}
              />
              <span
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  fontSize: 'clamp(18px, 3vw, 22px)',
                  fontWeight: 900,
                  letterSpacing: '0',
                  lineHeight: 1,
                  color: '#111',
                }}
              >
                <span>Tap to Enter</span>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <ArrowRight size={24} strokeWidth={3} />
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

      {/* Bottom sheet */}
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className={`fixed bottom-0 left-0 right-0 z-[10000] bg-white rounded-t-3xl px-6 pt-7 ${isAndroid ? 'pb-10' : 'pb-10'} shadow-2xl`}
      >
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
      </motion.div>
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
  const hasPreviewParam = routeSearch.includes('preview_event');
  const [showHomepage, setShowHomepage] = useState(!isAdmin && !hasPreviewParam && !isPlansPage && !isLifestylePage);

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
    if (typeof window !== 'undefined') {
      window.location.href = 'https://chaptera.in/plans';
    }
  };

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const isLetterPage = isLifestylePage && !hasPreviewParam;
    if (isAdmin || showHomepage || isLetterPage) {
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
  }, [showHomepage, isAdmin, isLifestylePage, hasPreviewParam]);

  if (isAdmin) return <AdminPanel />;

  if (isLifestylePage && !hasPreviewParam) {
    return (
      <>
        <LandscapeBlocker />
        <InAppBrowserNudge />
        <JoinLetterPage onContinue={continueFromJoin} />
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
