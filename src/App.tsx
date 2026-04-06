import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, MapPin, MessageCircle, Ticket, Send, CheckCircle2, XCircle, ChevronDown, ChevronUp, Star, Play, ChevronLeft, ChevronRight, Users, Bus, Home, Timer, ShieldCheck, Plus, Minus, Train, Car, Heart, ArrowRight } from 'lucide-react';

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
  }
];

const GENERAL_ANNOUNCEMENTS = [
  "Chennai-based social club with 4000+ members",
  "🇱🇰 Sri Lanka Retreat waitlist now open",
  "✈️ Flights included from Chennai"
];

export default function App() {
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
  const [journeyCardData, setJourneyCardData] = useState<{ event: Event; city: string; startDate: string } | null>(null);
  const [showBookingTimeline, setShowBookingTimeline] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [showDetailsForm, setShowDetailsForm] = useState(false);
  const [detailsForm, setDetailsForm] = useState({ name: '', phone: '' });
  const [tcAccepted, setTcAccepted] = useState(false);
  const [showTcModal, setShowTcModal] = useState(false);
  const [paymentView, setPaymentView] = useState<'idle' | 'checkout' | 'success' | 'failure'>('idle');
  const [paymentContext, setPaymentContext] = useState<{
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
  } | null>(null);
  const [balanceCountdown, setBalanceCountdown] = useState('');
  const [offerAcknowledged, setOfferAcknowledged] = useState(false);
  const [kynTimer, setKynTimer] = useState(15 * 60); // 15 minutes for KYN flow
  const [showDoubtPopup, setShowDoubtPopup] = useState(false);
  const [doubtFormData, setDoubtFormData] = useState({ name: '', phone: '', message: '' });
  const [clickedFaqs, setClickedFaqs] = useState<string[]>([]);
  const isPhonePeFlow = selectedEvent?.bookingUrl?.toLowerCase().includes('phonepe');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const parseAmount = (price: string) => {
    const num = parseInt(price.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

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

  // Determine which announcements to show
  const isAfterTripInfo = step === 'ASK_DOUBTS' || step === 'SHOW_FAQ' || step === 'DONE';
  const currentAnnouncements = (isAfterTripInfo && selectedEvent?.announcements) 
    ? selectedEvent.announcements 
    : GENERAL_ANNOUNCEMENTS;

  useEffect(() => {
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % currentAnnouncements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentAnnouncements.length]);

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

  // KYN timer (separate from chat)
  useEffect(() => {
    const t = setInterval(() => {
      setKynTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

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

  useEffect(() => {
    simulateBotTyping(() => {
      setMessages([{
        id: Date.now().toString(),
        sender: 'bot',
        text: 'Welcome to chapter அ! 👋\nWhich city are you from buddy?'
      }]);
      setStep('ASK_CITY');
    }, 1000);
  }, []);

  const simulateBotTyping = (callback: () => void, delay: number = 800) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
  };

  const addBotMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text }]);
  };

  const handleCitySelect = (city: string) => {
    setStep('PROCESSING');
    addUserMessage(city);
    setSelectedCity(city);
    
    simulateBotTyping(() => {
      addBotMessage(`Awesome! What would you like to attend in ${city}?`);
      setStep('ASK_CATEGORY');
    });
  };

  const handleCategorySelect = (category: string) => {
    setStep('PROCESSING');
    addUserMessage(category);
    setSelectedCategory(category);
    
    simulateBotTyping(() => {
      const filteredEvents = EVENTS.filter(e => e.cities.includes(selectedCity) && e.category === category);
      if (filteredEvents.length > 0) {
        addBotMessage(`Here are the upcoming ${category} in ${selectedCity}. Which one are you interested in?`);
        setStep('SELECT_EVENT');
      } else {
        addBotMessage(`Oops, looks like we don't have any ${category} scheduled in ${selectedCity} right now. Check back later!`);
        setStep('NO_EVENTS');
      }
    }, 1000);
  };

  const handleEventSelect = (event: Event) => {
    setStep('PROCESSING');
    addUserMessage(event.title);
    setSelectedEvent(event);
    
    setTimeout(() => {
      setShowTransition(true);
      setTimeout(() => {
        setShowTransition(false);
        setShowDetails(true);
        setStep('EVENT_SELECTED');
      }, 1800);
    }, 500);
  };

  const handleDetailsAction = (action: 'book' | 'contact', date?: string) => {
    setShowChat(true);
    setShowBookingTimeline(false);
    setShowWaitlistForm(false);
    setShowDetails(false);
    setMessages([]); // Clear chat history for a fresh start
    setClickedFaqs([]); // Reset clicked FAQs for the new flow
    if (date) setBookingDate(date);
    if (selectedEvent) {
      setJourneyCardData({
        event: selectedEvent,
        city: selectedCity,
        startDate: date || selectedEvent.dates?.[0]?.date || ''
      });
    }
    setStep('PROCESSING');
    
    simulateBotTyping(() => {
      if (action === 'book') {
        addBotMessage(`Yo! 🤙 You're about to lock in your spot for ${selectedEvent?.title}. Just making sure we're on the exact same page before we make it official—all clear on the details, or got any last-minute questions?`);
        setStep('ASK_DOUBTS');
      } else {
        addBotMessage(`Hey! 🌊 Got some questions about ${selectedEvent?.title}? I've got answers. Check out these common questions below, or let me know if you're ready to roll!`);
        setStep('SHOW_FAQ');
      }
    });
  };

  const handleDoubtsSelect = (hasDoubts: boolean) => {
    setStep('PROCESSING');
    if (hasDoubts) {
      addUserMessage("Hold up, I have a question.");
      simulateBotTyping(() => {
        addBotMessage("No sweat! Here's what people usually ask. Tap one to see the answer, or let me know when you're ready to book.");
        setStep('SHOW_FAQ');
      });
    } else {
      addUserMessage("All clear, let's book it! 🚀");
      // Skip extra questions and jump straight to booking timeline
      setShowChat(false);
      setTimeout(() => setShowBookingTimeline(true), 150);
      setShowWaitlistForm(false);
      setStep('DONE');
    }
  };

  const handleFaqSelect = (faq: FAQ) => {
    setStep('PROCESSING');
    addUserMessage(faq.question);
    setClickedFaqs(prev => [...prev, faq.question]);
    
    simulateBotTyping(() => {
      addBotMessage(faq.answer);
      simulateBotTyping(() => {
        addBotMessage("Hope that clears it up! Got anything else, or are we locking this in?");
        setStep('SHOW_FAQ');
      }, 1000);
    }, 800);
  };

  const handleReadyToBook = () => {
    addUserMessage("All clear, let's book it! 🚀");
    setShowChat(false);
    setTimeout(() => setShowBookingTimeline(true), 150);
    setShowWaitlistForm(false);
    setStep('DONE');
  };

  const handleGenderSelect = (gender: string) => {
    setStep('PROCESSING');
    setBookingGender(gender);
    addUserMessage(gender);
    
    simulateBotTyping(() => {
      addBotMessage("Got it. And do you need transport from Chennai, or will you arrange your own transport?");
      setStep('ASK_TRANSPORT');
    });
  };

  const handleTransportSelect = (transport: string) => {
    setStep('PROCESSING');
    setBookingTransport(transport);
    addUserMessage(transport);
    
    simulateBotTyping(() => {
      addBotMessage(`Perfect! I'll show you exactly what to select on KYN.`);
      setStep('DONE');
      setShowKynPopup(true);
      setShowWaitlistForm(false);
    });
  };

  const handleDoubtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDoubtPopup(false);
    setStep('PROCESSING');
    addUserMessage("Vera Doubt Iruku");
    
    simulateBotTyping(() => {
      addBotMessage(`Got it, ${doubtFormData.name}! Our team will reach out to you on WhatsApp at ${doubtFormData.phone} shortly to help you with your doubt: "${doubtFormData.message}".`);
      setDoubtFormData({ name: '', phone: '', message: '' });
      setStep('DONE');
    }, 1000);
  };

  const handleProceedToPhonePe = () => {
    if (!selectedEvent) return;
    const dateStr = bookingDate || selectedEvent.dates?.[0]?.date || '';
    const balanceDueRaw = shiftDateString(dateStr, -5) || '';
    const balanceDue = balanceDueRaw ? formatDisplayDate(balanceDueRaw) : 'TBD';
    const pickupDetails = dateStr ? formatDisplayDate(shiftDateString(dateStr, -3) || undefined) : 'TBD';
    const tripDate = formatDisplayDate(dateStr);
    const totalAmount = parseAmount(selectedEvent.price);
    const advanceAmount = Math.round(totalAmount * 0.3);
    const ctx = {
      eventTitle: selectedEvent.title,
      amount: advanceAmount,
      remainingBalance: totalAmount - advanceAmount,
      date: formatDisplayDate(dateStr),
      balanceDue,
      balanceDueRaw,
      pickupDetails,
      tripDate,
      tripDateFull: formatFullDate(dateStr),
      phonepeUrl: selectedEvent.bookingUrl,
      shareUrl: typeof window !== 'undefined' ? window.location.origin : '/',
      name: detailsForm.name.trim(),
      phone: detailsForm.phone
    };
    try {
      localStorage.setItem('bookingName', ctx.name);
      localStorage.setItem('bookingPhone', ctx.phone);
    } catch (err) {
      // ignore storage errors in restricted environments
    }
    setPaymentContext(ctx);
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

    switch (step) {
      case 'ASK_CITY': {
        const availableCities = Array.from(new Set(EVENTS.flatMap(e => e.cities)));
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2 w-full">
            {availableCities.map((city, i) => (
              <button key={city} onClick={() => handleCitySelect(city)} className={`${btnClass} relative overflow-hidden`}>
                <motion.div
                  className="absolute inset-0 -skew-x-12"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: i * 1.2, ease: 'easeInOut' }}
                />
                <span>{city}</span> <Send size={16} />
              </button>
            ))}
          </motion.div>
        );
      }
      case 'ASK_CATEGORY': {
        const availableCategories = Array.from(new Set(EVENTS.filter(e => e.cities.includes(selectedCity)).map(e => e.category)));
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
              { label: 'Hold up, I have a question', onClick: () => handleDoubtsSelect(true), cls: btnClass },
              { label: "All clear, let's book! 🚀", onClick: () => handleDoubtsSelect(false), cls: primaryBtnClass },
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
            <button onClick={() => setShowDoubtPopup(true)} className="text-right px-5 py-3 bg-gray-200 text-black rounded-2xl text-sm font-medium hover:bg-gray-300 transition-all shadow-sm active:scale-[0.98] flex items-center gap-3 justify-end w-fit max-w-full relative overflow-hidden">
              <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: 0, ease: 'easeInOut' }} />
              <span className="truncate whitespace-normal text-left">Vera Doubt Iruku</span> <MessageCircle size={16} className="flex-shrink-0" />
            </button>
            <button onClick={handleReadyToBook} className={primaryBtnClass + " mt-2 relative overflow-hidden"}>
              <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: 1.2, ease: 'easeInOut' }} />
              <span>All clear, let's book! 🚀</span> <Send size={16} />
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
                addBotMessage("Let's try again! Which city are you from?");
                setStep('ASK_CITY');
              });
            }} className={`${btnClass} relative overflow-hidden`}>
              <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }} />
              <span>Start Over</span> <Send size={16} />
            </button>
          </motion.div>
        );
      case 'SELECT_EVENT': {
        const filteredEvents = EVENTS.filter(e => e.cities.includes(selectedCity) && e.category === selectedCategory);
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-end gap-2 w-full">
            {filteredEvents.map((event, i) => (
              <button key={event.id} onClick={() => handleEventSelect(event)} className={`${btnClass} relative overflow-hidden`}>
                <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, delay: i * 1.2, ease: 'easeInOut' }} />
                <span className="text-left flex-1 mr-2">{event.title}</span> <Send size={16} className="flex-shrink-0" />
              </button>
            ))}
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
        return (
          <div className="flex flex-col items-end gap-2 w-full">
            <button onClick={() => window.location.reload()} className={`${btnClass} relative overflow-hidden`}>
              <motion.div className="absolute inset-0 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }} animate={{ x: ['-100%', '300%'] }} transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }} />
              <span>Start New Chat</span> <Send size={16} />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const isNameValid = detailsForm.name.trim().length >= 1;
  const isPhoneValid = /^\d{10,}$/.test(detailsForm.phone);
  const isDetailsFormValid = isNameValid && isPhoneValid && tcAccepted;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-0 sm:p-4 font-sans">
      <div className="w-full max-w-md bg-white sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-[85vh] relative border-4 border-white">
        
        {/* Header */}
        <div className="bg-white p-4 flex items-center gap-3 z-10 relative">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-[#FFD700] font-black text-2xl shadow-md">
              அ
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="font-black text-lg tracking-tight text-black">chapter அ</h1>
              <CheckCircle2 size={16} className="text-blue-500 fill-blue-50" />
            </div>
            <div className="h-[14px] overflow-hidden relative mt-0.5">
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
            </div>
          </div>
        </div>

        {showChat && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F2ED] relative">
            {journeyCardData && (step === 'ASK_DOUBTS' || step === 'SHOW_FAQ') && (
              <JourneyCard event={journeyCardData.event} city={journeyCardData.city} startDate={journeyCardData.startDate} />
            )}
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
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
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#FFD700] z-40 flex flex-col items-center justify-center overflow-hidden"
            >
              <motion.div
                animate={{
                  x: [-100, 0, 0, 150],
                  y: [100, 0, 0, -150],
                  scale: [0.5, 1, 1, 0.5],
                  opacity: [0, 1, 1, 0]
                }}
                transition={{ duration: 1.8, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
              >
                <Send size={48} className="text-black" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mt-4 font-bold text-lg text-black tracking-wide absolute top-[55%]"
              >
                Giving you all the details...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Event Details Overlay */}
        <AnimatePresence>
          {showDetails && selectedEvent && (
            <EventDetailsOverlay 
              event={selectedEvent} 
              selectedCity={selectedCity}
              onClose={() => {
                setShowDetails(false);
                setStep('SELECT_EVENT');
              }}
              onAction={handleDetailsAction} 
            />
          )}
        </AnimatePresence>

        {/* Booking Timeline Popup */}
        <AnimatePresence>
          {showBookingTimeline && selectedEvent && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/45 backdrop-blur-md z-40"
                onClick={() => { if (selectedEvent.id !== 'e3' && !selectedEvent.inviteOnly) setShowBookingTimeline(false); }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute inset-0 z-50 flex items-center justify-center px-5"
              >
                <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                  <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-black text-gray-900 leading-tight text-center">Your Booking Timeline</h2>
                    </div>
                    {selectedEvent.id !== 'e3' && !selectedEvent.inviteOnly && (
                      <button
                        onClick={() => setShowBookingTimeline(false)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mt-1 flex-shrink-0"
                      >
                        <X size={16} className="text-gray-600" />
                      </button>
                    )}
                  </div>

                  <div className="px-6 pb-6">
                    <div className="bg-[#F2F2F7] rounded-3xl overflow-hidden">
                      {/* Advance / Sign Up row */}
                      <div className="px-5 py-3 flex items-center justify-between border-b border-black/5">
                        <div>
                          <p className="text-[11px] text-gray-400 font-medium mb-0.5">{selectedEvent.inviteOnly ? 'Sign Up' : 'Advance'}</p>
                          <p className="text-[15px] font-black text-gray-900 leading-none">
                            {selectedEvent.inviteOnly ? 'Free — no payment yet' : `₹${selectedEvent.advanceAmount.toLocaleString('en-IN')}`}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold text-[#34C759] bg-[#34C759]/10 border border-[#34C759]/30 px-2.5 py-1 rounded-full">
                          {selectedEvent.inviteOnly ? 'Free' : 'Now'}
                        </span>
                      </div>

                      {/* Remaining balance row */}
                      <div className="px-5 py-3 flex items-center justify-between border-b border-black/5">
                        <div>
                          <p className="text-[11px] text-gray-400 font-medium mb-0.5">Remaining Balance</p>
                          <p className="text-[15px] font-black text-gray-900 leading-none">
                            ₹{(parseInt(selectedEvent.price.replace(/\D/g, '')) - selectedEvent.advanceAmount).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                          {bookingDate ? `by ${new Date(new Date(`${bookingDate}T00:00:00`).getTime() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '5 days before trip'}
                        </span>
                      </div>

                      {/* Receive details row */}
                      <div className="px-5 py-3 flex items-center justify-between border-b border-black/5">
                        <div>
                          <p className="text-[11px] text-gray-400 font-medium mb-0.5">Receive</p>
                          <p className="text-[15px] font-black text-gray-900 leading-none">Visa, flights & stay info</p>
                        </div>
                        <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                          {bookingDate ? `by ${new Date(new Date(`${bookingDate}T00:00:00`).getTime() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : '3 days before trip'}
                        </span>
                      </div>

                      {/* Prize row — event title + date, yellow accented */}
                      <div className="px-5 py-4 flex items-center justify-between bg-[#FFD700]/10">
                        <p className="text-[15px] font-black text-gray-900 leading-tight">{selectedEvent.title}</p>
                        {bookingDate && (
                          <span className="text-[11px] font-black text-black bg-[#FFD700] border border-[#d4af37] px-2.5 py-1 rounded-full flex-shrink-0 ml-3">
                            {new Date(`${bookingDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6">
                    {selectedEvent.inviteOnly ? (
                      <button
                        onClick={() => { window.open(selectedEvent.waitlistUrl, '_blank'); }}
                        className="w-full py-5 rounded-2xl bg-[#FFD700] text-black font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
                      >
                        Request Invitation
                        <ArrowRight size={22} strokeWidth={2.5} />
                      </button>
                    ) : selectedEvent.id === 'e3' ? (
                      <button
                        onClick={() => {
                          if (isPhonePeFlow) {
                            setShowBookingTimeline(false);
                            setShowDetailsForm(true);
                          } else {
                            setShowBookingTimeline(false);
                            setTimeout(() => setShowWaitlistForm(true), 150);
                          }
                        }}
                        className="w-full py-5 rounded-2xl bg-[#FFD700] text-black font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
                      >
                        {isPhonePeFlow ? 'Confirm' : 'Request Invitation'}
                        <ArrowRight size={22} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          alert('Enquiry sent!');
                          setShowBookingTimeline(false);
                        }}
                        className="w-full py-5 rounded-2xl bg-[#FFD700] text-black font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
                      >
                        Request Invitation
                        <ArrowRight size={22} strokeWidth={2.5} />
                      </button>
                    )}
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
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[55] bg-black"
                onClick={() => {
                  setShowDetailsForm(false);
                  setTimeout(() => setShowBookingTimeline(true), 80);
                }}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 32, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 z-[60] bg-white rounded-t-[2rem] flex flex-col" style={{ minHeight: 'auto' }}
              >
                {/* Handle + Header */}
                <div className="px-6 pt-4 pb-4">
                  <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
                  <p className="text-[24px] font-black text-gray-900 tracking-tight leading-tight whitespace-nowrap">Let's Lock This In! 🔐</p>
                </div>

                {/* Fields */}
                <div className="px-6 space-y-3">
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

                  <div className="flex items-center gap-3 select-none pt-1">
                    <div
                      onClick={() => setTcAccepted(!tcAccepted)}
                      className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all cursor-pointer ${
                        tcAccepted ? 'bg-black border-black' : 'bg-white border-gray-300'
                      }`}
                    >
                      {tcAccepted && (
                        <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                          <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-[13px] text-gray-500 leading-snug">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={() => setShowTcModal(true)}
                        className="text-gray-900 underline font-medium"
                      >
                        Terms & Conditions
                      </button>
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="px-6 pt-7 pb-5 space-y-3">
                  <div className="flex items-center justify-center gap-1.5">
                    <ShieldCheck size={13} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-[12px] text-gray-400">Secure Payments via PhonePe</span>
                  </div>
                  <button
                    type="button"
                    disabled={!isDetailsFormValid}
                    onClick={handleProceedToPhonePe}
                    className={`w-full py-[17px] rounded-2xl text-[17px] font-semibold transition-all ${
                      isDetailsFormValid
                        ? 'bg-black text-white active:opacity-80'
                        : 'bg-[#F2F2F7] text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Pay Advance
                  </button>
                </div>
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
                  <p><strong className="text-gray-900">1. Advance Payment</strong><br />The advance payment secures your spot and is non-refundable unless chapter அ cancels the trip.</p>
                  <p><strong className="text-gray-900">2. Balance Payment</strong><br />The remaining balance is due on the date communicated via WhatsApp. Failure to pay may result in forfeiture of your spot.</p>
                  <p><strong className="text-gray-900">3. Cancellations</strong><br />Cancellations made 14+ days before departure receive a 50% refund of the advance. No refunds within 14 days.</p>
                  <p><strong className="text-gray-900">4. Itinerary Changes</strong><br />chapter அ reserves the right to modify the itinerary due to weather, safety, or unforeseen circumstances.</p>
                  <p><strong className="text-gray-900">5. Liability</strong><br />chapter அ is not liable for personal injury, loss of belongings, or delays caused by third-party services.</p>
                  <p><strong className="text-gray-900">6. WhatsApp Communication</strong><br />By providing your number, you consent to receiving trip-related updates and reminders on WhatsApp.</p>
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

        {/* PhonePe Mock Checkout */}
        <AnimatePresence>
          {paymentView === 'checkout' && paymentContext && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[70] bg-gradient-to-br from-[#111827] via-black to-[#0f172a] text-white flex flex-col"
            >
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-semibold">Mock PhonePe</p>
                  <h2 className="text-2xl font-black mt-1">Redirecting to PhonePe</h2>
                  <p className="text-sm text-gray-400 mt-1">Amount: {formatINR(paymentContext.amount)}</p>
                </div>
                <ShieldCheck className="text-emerald-400" size={28} />
              </div>

              <div className="flex-1 px-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-300">Paying for</p>
                      <p className="font-bold text-lg">{paymentContext.eventTitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-300">Trip Date</p>
                      <p className="font-semibold">{paymentContext.date}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentView('success')}
                      className="w-full py-4 rounded-xl bg-emerald-500 text-black font-black text-base shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
                    >
                      Payment complete
                    </button>
                    <button
                      onClick={() => setPaymentView('failure')}
                      className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold text-base border border-white/20 hover:bg-white/15 active:scale-95 transition-all"
                    >
                      Payment not complete
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-3">
                    Use these buttons to mock PhonePe response. You'll be redirected back to the site accordingly.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
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
              {/* Close */}
              <div className="flex justify-end px-5 pt-6 flex-shrink-0">
                <button
                  onClick={() => {
                    setPaymentView('idle');
                    setPaymentContext(null);
                    setOfferAcknowledged(false);
                    setShowChat(true);
                  }}
                  className="w-9 h-9 rounded-full bg-[#F2F2F7] flex items-center justify-center"
                >
                  <X size={15} className="text-gray-600" />
                </button>
              </div>

              {/* Hero */}
              <div className="flex flex-col items-center pt-4 pb-6 px-6 flex-shrink-0">
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

              {/* Card 1 — Booking Receipt */}
              <div className="mx-6 bg-[#F2F2F7] rounded-3xl overflow-hidden flex-shrink-0">
                {/* Event title */}
                <div className="px-5 py-3 border-b border-black/5">
                  <p className="text-[15px] font-bold text-gray-900">
                    {paymentContext.eventTitle} · {paymentContext.tripDateFull}
                  </p>
                </div>

                {/* Advance paid row */}
                <div className="px-7 pt-3 pb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium mb-0.5">Advance</p>
                    <p className="text-[20px] font-black text-gray-900 leading-none">{formatINR(paymentContext.amount)}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#34C759] bg-[#34C759]/10 border border-[#34C759]/30 px-2.5 py-1 rounded-full">Paid</span>
                </div>

                {/* Remaining balance row */}
                <div className="px-7 pb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium mb-0.5">Remaining Balance</p>
                    <p className="text-[20px] font-black text-gray-900 leading-none">{formatINR(paymentContext.remainingBalance)}</p>
                  </div>
                  {balanceCountdown && (
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full tabular-nums">due in {balanceCountdown}</span>
                  )}
                </div>
              </div>

              {/* Card 2 — Secret Offer (dashed border) */}
              <div className="mx-6 mt-3 rounded-3xl overflow-hidden flex-shrink-0 border border-gray-200">
                <div className="px-5 pt-5 pb-3">
                  <p className="text-[22px] font-black leading-tight text-gray-900 whitespace-nowrap">Claim This — Now or Never</p>
                </div>
                {/* Acknowledgement checkbox */}
                <div
                  className="mx-5 mb-4 flex items-start gap-3 cursor-pointer select-none"
                  onClick={() => setOfferAcknowledged(v => !v)}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center border-2 transition-all duration-150 ${offerAcknowledged ? 'bg-[#25D366] border-[#25D366]' : 'border-gray-300 bg-white'}`}>
                    {offerAcknowledged && (
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                        <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-600 leading-snug">I understand this secret offer disappears when I leave this page</p>
                </div>

                <a
                  href={offerAcknowledged ? `https://wa.me/919739832100?text=${encodeURIComponent(`Hi! I just paid the advance for ${paymentContext.eventTitle} (${paymentContext.date}). I'd like to pay the remaining balance and claim my offer!`)}` : undefined}
                  onClick={!offerAcknowledged ? (e) => e.preventDefault() : undefined}
                  className={`flex items-center justify-center gap-2.5 font-bold py-5 text-[16px] transition-all duration-200 ${offerAcknowledged ? 'bg-[#25D366] text-white active:opacity-80' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={offerAcknowledged ? 'opacity-100' : 'opacity-40'}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Claim Secret Offer
                </a>
              </div>

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
                className="absolute inset-0 bg-black/45 backdrop-blur-md z-40"
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
                      title="Sri Lanka Waitlist"
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Doubt Popup */}
        <AnimatePresence>
          {showDoubtPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl p-6 w-full max-w-[320px] shadow-2xl flex flex-col items-center relative"
              >
                <button
                  onClick={() => setShowDoubtPopup(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"
                >
                  <X size={18} />
                </button>

                <div className="w-16 h-16 bg-[#FFD700] text-black rounded-2xl flex items-center justify-center font-black text-2xl mb-4 shadow-md">
                  <MessageCircle size={32} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Got a unique doubt?</h3>
                <p className="text-sm text-gray-600 mb-6 text-center">
                  Leave your details and we'll get back to you on WhatsApp!
                </p>

                <form onSubmit={handleDoubtSubmit} className="w-full space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Name</label>
                    <input 
                      type="text" 
                      required
                      value={doubtFormData.name}
                      onChange={e => setDoubtFormData({...doubtFormData, name: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">WhatsApp Number</label>
                    <input 
                      type="tel" 
                      required
                      value={doubtFormData.phone}
                      onChange={e => setDoubtFormData({...doubtFormData, phone: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all"
                      placeholder="Your WhatsApp number"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Your Doubt</label>
                    <textarea 
                      required
                      value={doubtFormData.message}
                      onChange={e => setDoubtFormData({...doubtFormData, message: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent transition-all resize-none h-24"
                      placeholder="What's on your mind?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-black text-[#FFD700] font-black py-4 rounded-2xl hover:bg-gray-900 transition-colors shadow-sm active:scale-[0.98] mt-2"
                  >
                    Send Message
                  </button>
                </form>
              </motion.div>
            </motion.div>
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
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

const JourneyCard = ({ event, city, startDate }: { event: Event; city: string; startDate: string }) => {
  const cityLower = city.toLowerCase();
  const baseStart = startDate;
  const categoryIcon = () => {
    if (event.category === 'Activities') return <Play size={12} className="text-blue-600" />;
    if (event.category === 'Trips') return <Bus size={12} className="text-blue-600" />;
    return <Home size={12} className="text-blue-600" />;
  };
  const shiftDateStr = (dateStr: string, offset: number) => {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const parsePrice = (priceStr: string) => {
    const num = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };
  const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  if (event.transportPlan && event.category === 'Trips') {
    const cityOffset = event.transportPlan.find(l => l.cities?.map(c => c.toLowerCase()).includes(cityLower))?.dateOffset || 0;
    const legs = event.transportPlan.filter(leg => !leg.cities || leg.cities.map(c => c.toLowerCase()).includes(cityLower));
    return (
      <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
        <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">
          You're Booking
        </h4>
        <div className="flex flex-col gap-4 relative">
          <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gray-200"></div>
          {legs.map((leg, idx) => {
            const legDate = shiftDateStr(baseStart, -cityOffset + leg.dateOffset);
            return (
              <div key={idx} className="flex gap-3 relative z-10">
                <div className="bg-white border-2 border-blue-500 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                  {leg.type === 'train' ? <Train size={12} className="text-blue-600" /> : 
                   leg.type === 'bus' ? <Bus size={12} className="text-blue-600" /> :
                   leg.type === 'tempo' ? <Bus size={12} className="text-blue-600" /> :
                   <Car size={12} className="text-blue-600" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900 leading-tight">
                    {leg.type.charAt(0).toUpperCase() + leg.type.slice(1)} from {leg.from} to {leg.to}
                  </span>
                  <span className="text-[10px] text-gray-500 mt-0.5">
                    {new Date(legDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {leg.time}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const pickup = event.pickupPoints?.find(p => p.city.toLowerCase() === cityLower);
  return (
    <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
      <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-2">
        You're Booking
      </h4>
      <div className="flex flex-col gap-2 text-sm text-gray-700">
        <div className="flex items-start gap-2">
          <MapPin size={12} className="text-blue-600 mt-0.5" />
          <span className="font-semibold">
            {pickup ? `${pickup.city} · ${pickup.location}` : event.startLocation}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Calendar size={12} className="text-blue-600 mt-0.5" />
          <span>
            {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
            {pickup?.time ? `· ${pickup.time}` : ''}
          </span>
        </div>
        <div className="flex items-start gap-2">
          {categoryIcon()}
          <span className="font-medium capitalize">{event.category}</span>
        </div>
        {event.category === 'Trips' && (
          <div className="flex items-start gap-2">
            <Bus size={12} className="text-blue-600 mt-0.5" />
            <span className="font-medium">{event.transport}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const EventDetailsOverlay = ({ event, selectedCity, onClose, onAction }: { event: Event, selectedCity: string, onClose: () => void, onAction: (a: 'book' | 'contact', date?: string) => void }) => {
  const [expandedItinerary, setExpandedItinerary] = useState<number | null>(null);
  const [showNotIncluded, setShowNotIncluded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1)); // April 2026
  const [showCalendar, setShowCalendar] = useState(false);
  const [showWorkWithUs, setShowWorkWithUs] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState<'privacy' | 'refund' | 'about' | 'contact' | 'tc' | null>(null);
  const [timeLeft, setTimeLeft] = useState(2 * 24 * 3600 + 14 * 3600 + 32 * 60 + 10);
  const [accImageIndex, setAccImageIndex] = useState(0);
  const initialTimeLeft = useRef<number>(2 * 24 * 3600 + 14 * 3600 + 32 * 60 + 10);
  const cityDateOffset = React.useMemo(() => {
    if (!event.transportPlan) return 0;
    const leg = event.transportPlan.find(l => l.cities?.map(c => c.toLowerCase()).includes(selectedCity.toLowerCase()));
    return leg ? leg.dateOffset : 0;
  }, [event.transportPlan, selectedCity]);
  const parsePrice = (priceStr: string) => {
    const num = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };
  const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

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
    if (!showCalendar || !selectedDate) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [showCalendar, selectedDate]);

  const formatTime = (totalSeconds: number) => {
    const d = Math.floor(totalSeconds / (3600 * 24));
    const h = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(d).padStart(2, '0')}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    // Shift so Monday = 0, Sunday = 6 (common in India)
    const firstDay = ((new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7);
    
    // Calculate trip duration
    const durationMatch = event.timing.match(/(\d+)\s*Days?/i);
    const tripDays = durationMatch ? parseInt(durationMatch[1], 10) : event.itinerary.length;
    
    const selectedDateObj = selectedDate ? new Date(`${selectedDate}T00:00:00`) : null;
    // Base trip start is always the original city-agnostic start
    const baseStartStr = selectedDate ? shiftDateStr(selectedDate, -cityDateOffset) : null;
    const baseStartObj = baseStartStr ? new Date(`${baseStartStr}T00:00:00`) : null;
    const endDateObj = baseStartObj ? new Date(baseStartObj) : null;
    if (endDateObj) endDateObj.setDate(endDateObj.getDate() + tripDays - 1);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const baseDateStr = shiftDateStr(dateStr, -cityDateOffset);
      const tripDate = event.dates?.find(d => d.date === baseDateStr);
      
      let bgClass = "bg-gray-50 text-gray-400";
      if (tripDate) {
        if (tripDate.status === 'available') bgClass = "bg-green-200/80 text-green-900 font-bold border border-green-500 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]";
        else if (tripDate.status === 'selling_out') bgClass = "bg-orange-200/70 text-orange-900 font-bold border border-orange-400";
        else if (tripDate.status === 'sold_out') bgClass = "bg-gray-50 text-gray-300 line-through";
      }

      const isSelectedStart = selectedDate === dateStr;
      const isTripEnd = endDateObj && currentDateObj.getTime() === endDateObj.getTime();
      const isWithinTrip = selectedDateObj && endDateObj && currentDateObj > selectedDateObj && currentDateObj < endDateObj;
      const strikeStyle = (!tripDate || tripDate.status === 'sold_out') && !isSelectedStart && !isWithinTrip && !isTripEnd
        ? {
            backgroundImage:
              'linear-gradient(315deg, transparent 0%, transparent 48%, rgba(128,128,128,0.12) 49%, rgba(128,128,128,0.12) 51%, transparent 52%, transparent 100%)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '100% 100%'
          }
        : undefined;

      const shapeClass = (() => {
        if (isSelectedStart && isTripEnd) return "rounded-full";
        if (isSelectedStart) return "rounded-l-full";
        if (isTripEnd) return "rounded-r-full";
        if (isWithinTrip) return "rounded-none";
        return "rounded-xl";
      })();

      if (isSelectedStart) {
        bgClass = "bg-[#FFE28A] text-black font-black border border-[#d4af37] z-10";
      } else if (isWithinTrip) {
        bgClass = "bg-[#FFE28A] text-black font-semibold border border-[#d4af37]/80 z-0";
      } else if (isTripEnd) {
        bgClass = "bg-[#FFE28A] text-black font-semibold border border-[#d4af37]";
      }

      const isShimmerable = !!tripDate && tripDate.status !== 'sold_out' && !isSelectedStart && !isWithinTrip && !isTripEnd;

      days.push(
        <motion.button
          key={i}
          disabled={!tripDate || tripDate.status === 'sold_out'}
          onClick={() => setSelectedDate(dateStr)}
          animate={isShimmerable ? { scale: [1, 1.06, 1] } : {}}
          transition={isShimmerable ? { duration: 1.2, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' } : {}}
          className={`h-10 ${shapeClass} flex items-center justify-center relative overflow-hidden ${bgClass} ${tripDate && tripDate.status !== 'sold_out' && !isSelectedStart ? 'hover:scale-102 active:scale-98' : ''} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]`}
          style={strikeStyle}
        >
          <span className="text-base">{i}</span>
        </motion.button>
      );
    }

    return (
      <div className="mb-1">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            title="Previous month"
            aria-label="Previous month"
            className="p-1.5 bg-[#FFD700] text-black rounded-full hover:bg-[#e6c200] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b200]"
          >
            <ChevronLeft size={18} />
          </button>
          <h4 className="font-black text-base">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            title="Next month"
            aria-label="Next month"
            className="p-1.5 bg-[#FFD700] text-black rounded-full hover:bg-[#e6c200] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6b200]"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-5 mt-4 mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-300 border border-green-600 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-orange-300 border border-orange-600 shadow-[0_0_0_1px_rgba(234,88,12,0.35)]"></div>
            <span>Filling fast</span>
          </div>
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
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 bg-white z-50 flex flex-col h-full overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto pb-0">
        {/* Header with Hero Image */}
        <div className="relative h-[45vh] min-h-[300px] w-full flex-shrink-0">
          <img src={event.heroImage} alt={event.title} className="w-full h-full object-cover object-center" />
        </div>

        {/* Quick Info — boarding pass card */}
        {event.quickInfo && event.quickInfo.length > 0 && (() => {
          const madeFor    = event.quickInfo!.find(c => c.label === 'Made For')     || event.quickInfo![3];
          const groupSize  = event.quickInfo!.find(c => c.label === 'Group Size')   || event.quickInfo![2];
          const meetingSpot= event.quickInfo!.find(c => c.label === 'Meeting Spot') || event.quickInfo![0];
          const transport  = event.quickInfo!.find(c => c.label === 'Transport')    || event.quickInfo![1];
          const groupNum   = groupSize?.value.match(/\d+[-–]\d+|\d+/)?.[0] || groupSize?.value;
          const groupSub   = groupSize?.value.replace(/\d+\s?/, '') || '';
          return (
            <div className="pt-5 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-black mb-4 px-6">The Plan</h3>
              <div className="mx-3 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden bg-gray-50">

                {/* Top row — MEETING SPOT | TRANSPORT */}
                <div className="flex border-b-2 border-dashed border-gray-200">
                  <div className="flex-1 px-3 py-3.5 border-r-2 border-dashed border-gray-200">
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
                  <div className="flex-1 px-3 py-4 border-r-2 border-dashed border-gray-200">
                    <div className="flex items-center gap-1 mb-1.5">
                      <Heart size={9} className="text-gray-500" />
                      <span className="text-[8px] text-gray-500 font-semibold uppercase tracking-wider">{madeFor?.label}</span>
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
          <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 overflow-hidden">
            <div className="p-4 space-y-3">
              {event.included?.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-800">{item}</span>
                </div>
              ))}
            </div>
            {event.optionalActivities && event.optionalActivities.length > 0 && (
              <div className="px-4 pb-2 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Plus size={20} className="text-gray-500" />
                  <span>Optional activities</span>
                </div>
                <div className="space-y-2">
                  {event.optionalActivities.map((act, idx) => (
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
                    <div className="p-4 pt-0 space-y-2 pl-8">
                      {event.notIncluded?.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-[10px] text-gray-400 mt-1">•</span>
                          <span className="text-[11px] text-gray-600/80">{item}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* The Plan */}
        <div className="p-6 border-b border-gray-100" ref={itineraryRef}>
          <h3 className="text-xl font-black mb-4">You'll Experience</h3>
          <div className="space-y-3">
            {event.itinerary?.map((day, i) => (
              <div key={i} className="rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
                <button 
                  onClick={() => setExpandedItinerary(expandedItinerary === i ? null : i)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-50 hover:bg-gray-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-black uppercase tracking-[0.08em]">{day.day}</span>
                    <h4 className="font-semibold text-gray-900 mt-0.5">{day.title}</h4>
                  </div>
                  <motion.div
                    initial={false}
                    animate={{ rotate: expandedItinerary === i ? 180 : 0, scale: expandedItinerary === i ? 1.05 : 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="p-2 rounded-full bg-[#FFD700] text-black shadow-sm"
                  >
                    {expandedItinerary === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
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
                          <div className="relative pl-4 border-l-2 border-gray-100 space-y-5 mt-4 ml-2 mb-2">
                            {day.schedule.map((item, idx) => (
                              <div key={idx} className="relative">
                                <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#FFD700] border-2 border-white shadow-sm" />
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
        {!event.isActivity && (
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-black mb-4">Where We Stay</h3>
            <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 overflow-hidden">
              <div className="relative w-full h-48">
                <img 
                  src={event.accommodation?.images[accImageIndex]} 
                  alt="Accommodation" 
                  className="w-full h-full object-cover" 
                />
                {event.accommodation?.images && event.accommodation.images.length > 1 && (
                  <>
                  <button 
                    onClick={() => setAccImageIndex(prev => (prev - 1 + event.accommodation!.images.length) % event.accommodation!.images.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                  >
                    <ChevronLeft size={20} className="text-gray-800 pr-0.5" />
                  </button>
                  <button 
                    onClick={() => setAccImageIndex(prev => (prev + 1) % event.accommodation!.images.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                  >
                    <ChevronRight size={20} className="text-gray-800 pl-0.5" />
                  </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {event.accommodation.images.map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === accImageIndex ? 'bg-white' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className="p-4">
                <h4 className="font-bold text-lg mb-3">{event.accommodation?.name}</h4>
                <ul className="space-y-2 mb-4">
                  {event.accommodation?.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <div className="bg-emerald-50 p-3 rounded-xl text-sm font-medium text-emerald-800 border border-emerald-100 flex items-start gap-2">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>Rooms are same-gender — so everyone's comfortable</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews */}
        {!event.isActivity && (
          <div className="pt-5 pb-2">
            <div className="px-6 mb-2">
              <h3 className="text-xl font-black">Fellow Lifemaxxers Said</h3>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar px-6 gap-4 pb-4 pt-1">
              {event.reviews?.map((review, i) => {
                const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
                const colorIndex = review.name.length % colors.length;
                const avatarColor = colors[colorIndex];
                const initial = review.name.charAt(0).toUpperCase();
                
                return (
                  <div key={i} className="w-72 flex-shrink-0 snap-center bg-gray-50 p-4 rounded-xl border-2 border-gray-200 flex flex-col gap-3">
                    {/* Reviewer Info */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-lg ${avatarColor}`}>
                        {initial}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-gray-900">{review.name}</span>
                        <span className="text-xs text-gray-500">Local Guide · {review.name.length * 2 + 5} reviews</span>
                      </div>
                      {/* Google G Logo SVG */}
                      <div className="ml-auto opacity-20">
                        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      </div>
                    </div>

                    {/* Rating & Time */}
                    <div className="flex items-center gap-2">
                      <div className="flex text-[#fbbc04]">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} size={14} fill={j < review.rating ? "currentColor" : "none"} className={j < review.rating ? "" : "text-gray-300"} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{(i * 2) + 1} months ago</span>
                    </div>

                    {/* Review Text */}
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-4">{review.text}</p>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Video Carousel */}
        {!event.isActivity && (
          <div className="pt-4 pb-6">
            <div className="px-6 mb-3 flex items-center justify-between">
              <h3 className="text-xl font-black">chapter அ vibes.mp4</h3>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar px-6 gap-4 pb-4">
              {event.videos?.map((vid, i) => (
                <div key={i} className="relative w-48 h-72 flex-shrink-0 snap-center rounded-2xl overflow-hidden bg-gray-800 shadow-lg">
                  <img src={vid.thumbnail} alt="Video thumbnail" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                      <Play size={20} className="text-white ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <p className="absolute bottom-4 left-4 right-4 text-sm font-bold leading-tight text-white">
                    {vid.caption}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Action Button (End of scroll) */}
        <div className="px-4 pt-4 pb-12">
          <button
            onClick={() => setShowCalendar(true)}
            className="w-full py-5 rounded-2xl bg-[#FFD700] text-black font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 -skew-x-12"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
              animate={{ x: ['-100%', '300%'] }}
              transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
            />
            Join Our Plan
            <ArrowRight size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* Footer — Branding + Work With Us + Legal links */}
        <div className="bg-[#F5F2ED] border-t border-[#E4DDD3]">

          {/* Branding — non-clickable sign-off */}
          <div className="px-5 pt-7 pb-5">
            <span className="text-[18px] font-black text-black/75 leading-snug tracking-tight">plans we dream,</span>
            <br />
            <span className="text-[18px] font-black text-black/75 leading-snug tracking-tight">by chapter அ</span>
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
                      <span className="text-[11px] text-black/40">Join the team — apply now</span>
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
                      src="https://tally.so/embed/ZjYeb0?alignLeft=1&hideTitle=1&transparentBackground=1"
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
              className="absolute inset-0 bg-black/45 backdrop-blur-md z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[2rem] z-50 flex flex-col max-h-[95%] overflow-hidden shadow-2xl"
            >
              <div className="p-4 pb-0 bg-white sticky top-0 z-10">
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
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
                      <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-1 text-[11px] font-semibold text-gray-700">
                          <p>Lock your spot (Advance)</p>
                          <p className="text-2xl font-black text-black leading-tight">₹{event.advanceAmount}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 text-[11px] font-semibold text-gray-700">
                          <p className="text-[11px] text-gray-500">Remaining balance</p>
                          <p className="text-base font-semibold text-gray-800">
                            {formatINR(Math.max(parsePrice(event.price) - event.advanceAmount, 0))}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button 
                          onClick={() => { setShowCalendar(false); onAction('contact', selectedDate || undefined); }}
                          className="w-full sm:min-w-[160px] px-3 py-2.5 rounded-lg bg-[#FFF3BF] text-[#b38200] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#ffe58f] transition-colors border border-[#FFD700]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4af37]"
                        >
                          <MessageCircle size={15} />
                          Contact Us
                        </button>
                        <button
                          onClick={() => {
                            setShowCalendar(false);
                            onAction('book', selectedDate || undefined);
                          }}
                          className="w-full sm:min-w-[160px] px-3 py-2.5 rounded-lg bg-[#FFD700] text-black font-black text-sm flex items-center justify-center gap-2 hover:bg-[#e6c200] transition-transform active:scale-95 shadow-md shadow-[#FFD700]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/50 relative overflow-hidden"
                        >
                          <motion.div
                            className="absolute inset-0 -skew-x-12"
                            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)', width: '50%' }}
                            animate={{ x: ['-100%', '300%'] }}
                            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
                          />
                          Book Now
                          <ChevronRight size={15} className="text-black" />
                        </button>
                      </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Policy / Legal Modals */}
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
                  <p><strong className="text-gray-900">chapter அ</strong> is a curated travel experiences company operated by <strong className="text-gray-900">CHAPTER</strong>, registered in India.</p>
                  <p>We design and run small-group trips for people who want to travel meaningfully — slow itineraries, real places, good company.</p>
                  <p>Our trips are designed for 18–35 year olds looking to explore India and beyond without the chaos of typical group tours.</p>
                </>
              )}
              {showPolicyModal === 'contact' && (
                <>
                  <p><strong className="text-gray-900">CHAPTER</strong></p>
                  <p>Registered Address:<br />Chennai, Tamil Nadu, India</p>
                  <p>Email: <a href="mailto:chapteraaa.official@gmail.com" className="text-gray-900 underline">chapteraaa.official@gmail.com</a></p>
                  <p>WhatsApp / Phone: <a href="tel:+918838111564" className="text-gray-900 underline">+91 88381 11564</a></p>
                  <p>We typically respond within a few hours on WhatsApp.</p>
                </>
              )}
              {showPolicyModal === 'privacy' && (
                <>
                  <p><strong className="text-gray-900">1. Information We Collect</strong><br />We collect your name and WhatsApp number when you make a booking. This is used solely to communicate trip details and payment reminders.</p>
                  <p><strong className="text-gray-900">2. How We Use It</strong><br />Your information is used to confirm bookings, send trip updates, and process payments. We do not sell or share your data with third parties.</p>
                  <p><strong className="text-gray-900">3. Payment Data</strong><br />Payments are processed via PhonePe. We do not store any card or UPI credentials on our servers.</p>
                  <p><strong className="text-gray-900">4. WhatsApp Communication</strong><br />By providing your number, you consent to receiving trip-related messages on WhatsApp. You may opt out at any time by messaging us.</p>
                  <p><strong className="text-gray-900">5. Data Retention</strong><br />We retain your contact details for up to 1 year post-trip for support purposes, after which it is deleted.</p>
                  <p><strong className="text-gray-900">6. Contact</strong><br />For privacy concerns, email us at chapteraaa.official@gmail.com.</p>
                </>
              )}
              {showPolicyModal === 'tc' && (
                <>
                  <p><strong className="text-gray-900">1. Advance Payment</strong><br />The advance payment secures your spot and is non-refundable unless chapter அ cancels the trip.</p>
                  <p><strong className="text-gray-900">2. Balance Payment</strong><br />The remaining balance is due on the date communicated via WhatsApp. Failure to pay may result in forfeiture of your spot.</p>
                  <p><strong className="text-gray-900">3. Cancellations</strong><br />Cancellations made 14+ days before departure receive a 50% refund of the advance. No refunds within 14 days.</p>
                  <p><strong className="text-gray-900">4. Itinerary Changes</strong><br />chapter அ reserves the right to modify the itinerary due to weather, safety, or unforeseen circumstances.</p>
                  <p><strong className="text-gray-900">5. Liability</strong><br />chapter அ is not liable for personal injury, loss of belongings, or delays caused by third-party services.</p>
                  <p><strong className="text-gray-900">6. WhatsApp Communication</strong><br />By providing your number, you consent to receiving trip-related updates and reminders on WhatsApp.</p>
                </>
              )}
              {showPolicyModal === 'refund' && (
                <>
                  <p><strong className="text-gray-900">1. Advance Payment</strong><br />The advance (30% of trip cost) is required to secure your spot. It is non-refundable unless chapter அ cancels the trip.</p>
                  <p><strong className="text-gray-900">2. Balance Payment</strong><br />The remaining balance must be paid by the date communicated via WhatsApp. Failure to pay may result in forfeiture of your spot without refund of the advance.</p>
                  <p><strong className="text-gray-900">3. Cancellation by Traveller</strong><br />
                    14+ days before departure: 50% of advance refunded.<br />
                    7–13 days before departure: No refund.<br />
                    Less than 7 days: No refund.
                  </p>
                  <p><strong className="text-gray-900">4. Cancellation by chapter அ</strong><br />If we cancel a trip for any reason, a full refund of all amounts paid will be issued within 7 business days.</p>
                  <p><strong className="text-gray-900">5. Refund Process</strong><br />Approved refunds are processed to the original payment method within 5–7 business days.</p>
                  <p><strong className="text-gray-900">6. Contact for Refunds</strong><br />Reach us on WhatsApp at +91 88381 11564 or email chapteraaa.official@gmail.com.</p>
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

    </motion.div>
  );
}
