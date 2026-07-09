// Shared PayU bill page + payment-method UI. Extracted verbatim from App.tsx so
// BOTH the invite flow (App.tsx) and the open-event flow (AppFlow.tsx) render the
// exact same bill page — single source of truth, no drift. Pure relocation:
// behaviour is unchanged from the original inline definitions.
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from './supabase';

const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

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

export function NativePaymentOverlay({
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
      } else if (raw.includes('already paid for this open event')) {
        msg = 'This number already has a confirmed spot for this event. Use a different number for another ticket.';
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
