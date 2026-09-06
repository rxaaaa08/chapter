import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, ChevronDown, ChevronLeft, X } from 'lucide-react';
import { supabase } from './supabase';
import { BUSINESS_WHATSAPP_E164 } from './whatsappLinks';
import { CORRECT_TEAM_ANSWERS, TOUR_STEPS, type TourStep } from './TeamOnboardingTour';
import { EMPTY_PANEL_STATE, TeamMockPanel, type PanelState } from './TeamOnboardingPanel';

const INK = '#111111';
const MUTED = '#9a9aa2';
const HAIR = '#ececed';
const GOLD = '#FFD700';
const RED = '#dc2626';
const LOCAL_PROGRESS_KEY = 'teamOnboardingProgressV2';
const ONBOARDING_INTENT_KEY = 'teamOnboardingIntent';
// TODO(owner): set this to the vertical marketer welcome video id.
const TEAM_WELCOME_VIMEO_ID: string | null = null;
const UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const STEP_COUNT = TOUR_STEPS.length;
// Local-only preview of the tour without a Google account. Compiled out of the
// production bundle, and it can enrol nobody: joining still needs a real
// session plus the server-side answer check in the marketer-signup function.
const TOUR_DEV = import.meta.env.DEV
  && typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('tourdev') !== null;

type Screen = 'welcome' | 'tour' | 'details' | 'success' | 'already' | 'error';

type TeamProgress = {
  current_level: number;
  completed: number[];
  retries: Record<string, number>;
  answers: Record<string, string>;
  level_timestamps: Record<string, string>;
};

const EMPTY_PROGRESS: TeamProgress = {
  current_level: 1,
  completed: [],
  retries: {},
  answers: {},
  level_timestamps: {},
};

const FAQS = [
  {
    question: 'I applied for a core team / operations / design role — why am I doing sales?',
    answer: 'Because it\'s how everyone here starts, including the people already doing those jobs. A few weeks of real customer calls teaches you what no handover document can: what people actually want, where our website loses them, which parts of the experience they care about. When you move into another part of the company, you\'ll decide with that in your head instead of guessing.',
  },
  {
    question: 'So is this a sales job or not?',
    answer: 'Right now, yes. You\'ll be calling and messaging real customers and getting them booked. That\'s the job you\'re training for and the job you\'ll start. Where it goes depends on how you do and what the team needs — we don\'t promise a timeline, but the door is genuinely open, and it\'s the only door.',
  },
  {
    question: 'How do I move into the core team?',
    answer: 'Do the customer desk well, and say what you\'re interested in. The people who move up are the ones who close well, keep their word to customers, and notice things — a confusing message, a date that always sells out, a question that keeps coming up. Tell us what you notice. That\'s the audition.',
  },
  {
    question: 'Do I need any experience to do this?',
    answer: 'No. This training teaches you everything — what customers want, how the panel works, and exactly what to say. If you can make a friendly phone call, you can do this.',
  },
  {
    question: 'Do I have to pay anything to join?',
    answer: 'Never. Joining is completely free, and it always will be. We pay you — you never pay us.',
  },
  {
    question: 'How much can I earn?',
    answer: 'Commission is earned only when a ticket becomes fully paid. Invite events pay the full event fee. On open events, a sale that involved a doubt, cart abandonment, or failed payment pays the full fee; a clean self-serve sale pays half. Your dashboard shows the exact amount actually earned.',
  },
  {
    question: 'How much time does this take?',
    answer: 'It\'s flexible and all from your phone — calls and WhatsApp follow-ups with the leads assigned to you. There are no fixed hours; you work your leads when it suits you.',
  },
  {
    question: 'When do I start getting customers to call?',
    answer: 'Once you\'re assigned to an event. Finishing this training puts you on the team, ready to be staffed — leads start arriving when we add you to an event, and we\'ll message you on WhatsApp when that happens.',
  },
  {
    question: 'I have another doubt.',
    answer: 'We\'re here to help! For anything else, contact us on WhatsApp.',
    link: `https://wa.me/${BUSINESS_WHATSAPP_E164}`,
  },
];

const STATUS_FIELD_GUIDE = [
  ['Pending', 'Nobody has read it yet. Read why they applied, then invite — or leave it. No call.'],
  ['Invited', 'Link is with them. Leave them to decide unless they write back or delivery failed.'],
  ['Re-target', "24h, never opened the page. Calling starts here: call → log it → Resend Details."],
  ['Cart abandoned', "Opened the payment page, didn't finish. Make the trust call."],
  ['Payment failed', 'They tried and it bounced. Strongest signal there is — call now, no waiting.'],
  ['Waitlist', 'Their date sold out. Call → offer the other date → change it.'],
  ['Advance paid', 'Part paid. Still yours: chase the balance. Date is locked from here.'],
  ['Fully paid', "Money in, spot confirmed — you've earned. Answer them, but no more chasing."],
  ['Recovered', 'Abandoned, then paid. A save — counts fully.'],
  ['Rejected', 'Not a fit. Closed — leave the row alone.'],
] as const;

const KNOWN_CHECK_IDS = new Set(Object.keys(CORRECT_TEAM_ANSWERS));

function normalizeProgress(raw: unknown): TeamProgress {
  const value = raw && typeof raw === 'object' ? raw as Partial<TeamProgress> : {};
  const completed = Array.isArray(value.completed)
    ? [...new Set(value.completed.filter((item): item is number => Number.isInteger(item) && item >= 1 && item <= STEP_COUNT))].sort((a, b) => a - b)
    : [];
  // Answers are keyed by check id. A resume from the old level-based training
  // carries ids that no longer exist — drop them rather than submitting keys
  // the server will reject.
  const rawAnswers = value.answers && typeof value.answers === 'object' ? value.answers : {};
  const answers = Object.fromEntries(
    Object.entries(rawAnswers).filter(([key]) => KNOWN_CHECK_IDS.has(key)),
  ) as Record<string, string>;
  return {
    current_level: Math.min(STEP_COUNT, Math.max(1, Number(value.current_level) || Math.min(STEP_COUNT, completed.length + 1))),
    completed,
    retries: value.retries && typeof value.retries === 'object' ? value.retries : {},
    answers,
    level_timestamps: value.level_timestamps && typeof value.level_timestamps === 'object' ? value.level_timestamps : {},
  };
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

const primaryBtn = (enabled = true): React.CSSProperties => ({
  width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
  background: enabled ? GOLD : '#d7d7db', color: enabled ? INK : '#fff',
  fontSize: 15, fontWeight: 700, cursor: enabled ? 'pointer' : 'default',
  fontFamily: 'inherit', position: 'relative', overflow: 'hidden',
});

const secondaryBtn: React.CSSProperties = {
  width: '100%', padding: '12px 0', borderRadius: 14,
  border: '1.5px solid #ececed', background: '#f6f6f7', color: '#000',
  fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
};

// Everything except the tour is a narrow reading column. The tour itself needs
// the full window, because it is showing a replica of a full-width admin table.
const Narrow = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: '100%', maxWidth: 460, margin: '0 auto' }}>{children}</div>
);

function Loader({ label = 'Getting things ready…' }: { label?: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#fff' }}>
      <div style={{ display: 'grid', justifyItems: 'center', gap: 18 }}>
        <div className="team-loader-mark" style={{ width: 62, height: 62, borderRadius: 17, background: INK, display: 'grid', placeItems: 'center', color: GOLD, fontSize: 29, fontWeight: 900, boxShadow: '0 0 32px rgba(255,215,0,.34)' }}>அ</div>
        <span style={{ color: MUTED, fontSize: 13.5, fontWeight: 650 }}>{label}</span>
      </div>
    </div>
  );
}

function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: INK, color: GOLD, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 19 }}>அ</div>
      <div style={{ fontWeight: 850, letterSpacing: '-.45px', fontSize: 17 }}>chapter அ</div>
    </div>
  );
}

function LoginScreen({ onBecome, authError }: { onBecome: () => void; authError: string }) {
  return (
    <div style={{ minHeight: '100vh', padding: '32px 22px', display: 'grid', placeItems: 'center', background: '#fff' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <Wordmark />
        <div style={{ marginTop: 34, border: '1.5px dashed #d9bf52', borderRadius: 24, padding: '28px 22px', background: 'linear-gradient(155deg, #fffdf1 0%, #fff 55%)' }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 850, color: '#8a741b' }}>Core team training</div>
          <h1 style={{ margin: '10px 0 9px', fontSize: 27, lineHeight: 1.12, letterSpacing: '-.8px' }}>Every one of us starts with the customer.</h1>
          <p style={{ margin: '0 0 23px', color: MUTED, fontSize: 14, lineHeight: 1.6 }}>Whatever you end up doing here — sales, operations, design, support — you start on the customer desk. This is where that begins.</p>
          <button type="button" className="team-cta-shimmer" onClick={onBecome} style={primaryBtn(true)}>I want to join the team</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}><span style={{ flex: 1, borderTop: '1px dashed #d4d4d8' }} /><span style={{ color: '#a1a1aa', fontSize: 11.5 }}>or</span><span style={{ flex: 1, borderTop: '1px dashed #d4d4d8' }} /></div>
          <a href="/admin" style={{ ...secondaryBtn, display: 'block', textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>I&apos;m already on the team</a>
          <p style={{ margin: '12px 0 0', color: MUTED, fontSize: 12.5, textAlign: 'center' }}>New here? Press &ldquo;I want to join the team&rdquo; to get started.</p>
          {authError && <p role="alert" style={{ margin: '13px 0 0', color: RED, fontSize: 12.5, textAlign: 'center' }}>{authError}</p>}
        </div>
      </div>
    </div>
  );
}

function TopBar({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '17px 20px 8px', background: '#fff' }}>
      <button type="button" onClick={onBack} aria-label="Go back" style={{ border: 0, background: 'transparent', width: 28, height: 28, padding: 0, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><ChevronLeft size={21} strokeWidth={2.6} /></button>
      <div style={{ flex: 1, display: 'flex', gap: 6 }}>{[1, 2, 3].map(dot => <span key={dot} style={{ height: 6, borderRadius: 999, flex: 1, background: dot <= step ? INK : HAIR, transition: 'background .2s' }} />)}</div>
      <div style={{ width: 28 }} />
    </div>
  );
}

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  return (
    <main style={{ padding: '13px 22px 28px' }}>
      <h1 style={{ margin: 0, fontSize: 23, fontWeight: 850, letterSpacing: '-.55px' }}>Welcome to chapter அ</h1>
      <p style={{ margin: '10px 0 8px', color: MUTED, fontSize: 14, lineHeight: 1.55 }}>We run small-group experiences and trips people genuinely love.</p>
      <p style={{ margin: '0 0 8px', color: MUTED, fontSize: 14, lineHeight: 1.55 }}>Here&apos;s how we hire, and it&apos;s unusual: <strong style={{ color: INK }}>everyone starts on the customer desk.</strong> Designers, operations people, managers, support — everyone. Not as a hurdle to clear, but because it&apos;s the fastest way to learn the only thing that matters here: what our customers actually want, what worries them, and what makes them finally say yes.</p>
      <p style={{ margin: '0 0 8px', color: MUTED, fontSize: 14, lineHeight: 1.55 }}>You&apos;ll spend your first stretch as a <strong style={{ color: INK }}>marketer</strong> — talking to real people who want to come on our trips, and getting them there. What you learn on those calls is what makes someone good at every other job in this company.</p>
      <p style={{ margin: '0 0 18px', color: MUTED, fontSize: 14, lineHeight: 1.55 }}>This training takes about 15 minutes. We&apos;ll walk you through the actual screen you&apos;ll work in every day — with practice leads in it — and explain every button and every status, one at a time.</p>
      <div style={{ height: 'min(56vh, 460px)', aspectRatio: '9 / 16', maxWidth: '100%', margin: '0 auto', position: 'relative', borderRadius: 24, overflow: 'hidden', background: '#000', border: `1.5px solid ${HAIR}` }}>
        {TEAM_WELCOME_VIMEO_ID ? <>
          {!videoLoaded && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', zIndex: 1 }}><span className="team-spinner" style={{ width: 30, height: 30, border: '3px solid rgba(255,255,255,.25)', borderTopColor: GOLD, borderRadius: '50%' }} /></div>}
          <iframe title="Welcome to core team training" src={`https://player.vimeo.com/video/${TEAM_WELCOME_VIMEO_ID}?autoplay=0&muted=0&badge=0&byline=0&title=0&portrait=0&api=1`} onLoad={() => setVideoLoaded(true)} allow="autoplay; fullscreen; picture-in-picture" style={{ position: 'absolute', inset: -2, width: 'calc(100% + 4px)', height: 'calc(100% + 4px)', border: 0, clipPath: 'inset(0 round 22px)' }} />
        </> : <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 28, textAlign: 'center', background: 'linear-gradient(155deg,#171717,#050505)', color: '#d4d4d8' }}><div><div style={{ width: 54, height: 54, margin: '0 auto 16px', borderRadius: 17, background: GOLD, color: INK, display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 900 }}>அ</div><span style={{ fontSize: 13.5, fontWeight: 700 }}>Founder welcome video coming soon</span></div></div>}
      </div>
      <button type="button" className="team-cta-shimmer" onClick={onContinue} style={{ ...primaryBtn(true), marginTop: 18 }}>Start the tour</button>
    </main>
  );
}

function FaqSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 27, stiffness: 270 }} role="dialog" aria-modal="true" aria-label="Team questions" onClick={event => event.stopPropagation()} style={{ position: 'absolute', inset: 'auto 0 0', maxHeight: '84%', overflowY: 'auto', background: '#fff', borderRadius: '32px 32px 0 0', padding: '27px 22px 28px', boxShadow: '0 -16px 40px rgba(0,0,0,.16)' }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <button type="button" onClick={onClose} aria-label="Close questions" style={{ position: 'absolute', right: 18, top: 18, width: 35, height: 35, borderRadius: '50%', border: `1px solid ${HAIR}`, background: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={17} /></button>
            <h2 style={{ margin: '2px 46px 22px 0', fontSize: 22, letterSpacing: '-.45px' }}>Got a question? 🤔</h2>
            {FAQS.map((faq, index) => <div key={faq.question} style={{ borderTop: `1px solid ${HAIR}` }}>
              <button type="button" aria-expanded={expanded === index} onClick={() => setExpanded(value => value === index ? null : index)} style={{ width: '100%', border: 0, background: '#fff', padding: '16px 0', display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}><span style={{ flex: 1, fontWeight: 750, fontSize: 14.5, lineHeight: 1.4 }}>{faq.question}</span><motion.span animate={{ rotate: expanded === index ? 180 : 0 }}><ChevronDown size={18} /></motion.span></button>
              <AnimatePresence initial={false}>{expanded === index && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}><p style={{ margin: '-3px 0 17px', color: '#57534e', fontSize: 13.5, lineHeight: 1.6 }}>{faq.answer} {faq.link && <a href={faq.link} target="_blank" rel="noreferrer" style={{ color: INK, fontWeight: 750 }}>Contact Us</a>}</p></motion.div>}</AnimatePresence>
            </div>)}
          </div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}

function FieldGuideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 302, background: 'rgba(0,0,0,.5)' }} onClick={onClose}>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 27, stiffness: 270 }} role="dialog" aria-modal="true" aria-label="Lead status field guide" onClick={event => event.stopPropagation()} style={{ position: 'absolute', inset: 'auto 0 0', maxHeight: '86%', overflowY: 'auto', background: '#fff', borderRadius: '32px 32px 0 0', padding: '27px 22px 28px', boxShadow: '0 -16px 40px rgba(0,0,0,.16)' }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <button type="button" onClick={onClose} aria-label="Close field guide" style={{ position: 'absolute', right: 18, top: 18, width: 35, height: 35, borderRadius: '50%', border: `1px solid ${HAIR}`, background: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={17} /></button>
            <div style={{ color: '#8a741b', fontSize: 10.5, fontWeight: 850, letterSpacing: 1.25, textTransform: 'uppercase' }}>Keep this handy</div>
            <h2 style={{ margin: '7px 46px 8px 0', fontSize: 22, letterSpacing: '-.45px' }}>Lead status field guide</h2>
            <p style={{ margin: '0 0 18px', color: MUTED, fontSize: 13, lineHeight: 1.55 }}>The one-line next move for every status you&apos;ll see.</p>
            <div style={{ border: `1px solid ${HAIR}`, borderRadius: 16, overflow: 'hidden' }}>{STATUS_FIELD_GUIDE.map(([status, description], index) => <div key={status} style={{ display: 'grid', gridTemplateColumns: '112px 1fr', gap: 11, padding: '12px 13px', borderTop: index === 0 ? 0 : `1px solid ${HAIR}`, alignItems: 'start' }}><strong style={{ fontSize: 12.5, color: INK }}>{status}</strong><span style={{ color: '#57534e', fontSize: 12.5, lineHeight: 1.5 }}>{description}</span></div>)}</div>
          </div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}

function CheckBlock({ check, selected, wrong, onSelect }: { key?: React.Key; check: TourStep['checks'] extends (infer U)[] | undefined ? U : never; selected?: string; wrong: boolean; onSelect: (key: string) => void }) {
  const options = useMemo(() => shuffle(check.options), [check]);
  return (
    <section style={{ marginTop: 16 }}>
      <div style={{ color: '#8a741b', fontSize: 10.5, fontWeight: 850, letterSpacing: 1.2, textTransform: 'uppercase' }}>Quick check</div>
      <h3 style={{ margin: '6px 0 10px', fontSize: 14.5, lineHeight: 1.4 }}>{check.question}</h3>
      <div style={{ display: 'grid', gap: 7 }}>{options.map(option => {
        const isSelected = selected === option.key;
        const isWrong = wrong && isSelected;
        return <button type="button" key={option.key} onClick={() => onSelect(option.key)} style={{ padding: '10px 12px', borderRadius: 11, fontSize: 13, lineHeight: 1.4, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', border: `1.5px solid ${isWrong ? RED : isSelected ? INK : HAIR}`, background: isWrong ? '#fef2f2' : isSelected ? '#f5f5f5' : '#fff', fontWeight: isSelected ? 700 : 500 }}>{option.label}</button>;
      })}</div>
    </section>
  );
}

// ── The spotlight ────────────────────────────────────────────────────────────
// One ring element with a huge box-shadow spread does the dimming, so there is
// exactly one thing to position. pointer-events stay off it, which is what lets
// the trainee actually press the highlighted Approve button underneath.
// Bubble geometry is computed in pixels, so a resize has to re-render — the
// spotlight hook below bails out early when a step has no target, and would
// otherwise leave the bubble sized for the old window.
function useViewport() {
  // A hidden or not-yet-laid-out tab reports 0 for both. Falling through with
  // that would compute a negative bubble width, so keep a sane floor.
  const read = () => ({
    w: Math.max(320, (typeof window === 'undefined' ? 0 : window.innerWidth) || 1024),
    h: Math.max(360, (typeof window === 'undefined' ? 0 : window.innerHeight) || 800),
  });
  const [size, setSize] = useState(read);
  useEffect(() => {
    const onResize = () => setSize(read());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return size;
}

function useSpotlightRect(target: string | null, deps: unknown[]): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    if (!target) { setRect(null); return; }
    const element = document.querySelector(`[data-tour="${target}"]`);
    if (!(element instanceof HTMLElement)) { setRect(null); return; }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // inline:'center' is what drags the table's own horizontal scroll across to
    // the Action column — the spotlight would otherwise sit off-screen.
    element.scrollIntoView({ block: 'center', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    const measure = () => setRect(element.getBoundingClientRect());
    measure();
    // Re-measure once the smooth scroll has settled.
    const settle = window.setTimeout(measure, 420);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, ...deps]);
  return rect;
}

function TourScreen({
  progress, panelState, onPanelState, onComplete, onRetry, onFinish, readOnly,
}: {
  progress: TeamProgress;
  panelState: PanelState;
  onPanelState: (next: PanelState) => void;
  onComplete: (stepNumber: number, answers: Record<string, string>) => Promise<void>;
  onRetry: (stepNumber: number) => Promise<void>;
  onFinish: () => void;
  readOnly: boolean;
}) {
  const startIndex = Math.min(STEP_COUNT - 1, Math.max(0, progress.current_level - 1));
  const [index, setIndex] = useState(startIndex);
  const [selected, setSelected] = useState<Record<string, string>>(progress.answers);
  const [wrong, setWrong] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const step = TOUR_STEPS[index];
  const { w: viewportW, h: viewportH } = useViewport();
  const rect = useSpotlightRect(step.target, [index, panelState, viewportW, viewportH]);
  // A step beside its target gets only the space on that side, which is not
  // always enough — a long explanation plus a four-option check can overflow
  // and hide the question and the Next button below the fold. When that
  // happens, fall back to the centre, where the bubble gets the whole window.
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [forceCentre, setForceCentre] = useState(false);
  useLayoutEffect(() => { setForceCentre(false); }, [index, viewportW, viewportH]);
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el || forceCentre) return;
    if (el.scrollHeight > el.clientHeight + 2) setForceCentre(true);
  });

  const checks = step.checks ?? [];
  const interactionDone = !step.requires || panelState[step.requires];
  // A marketer re-reading this later is refreshing, not being examined: the
  // questions still show as a self-test but never block the walk. Button
  // presses stay required either way — skipping them would leave later steps
  // pointing at rows that have not changed yet.
  const answered = readOnly || checks.every(check => Boolean(selected[check.id]));
  const canAdvance = interactionDone && answered && !saving;
  const isLast = index === STEP_COUNT - 1;

  const next = async () => {
    if (!canAdvance) return;
    if (!readOnly) {
      const nextWrong = Object.fromEntries(checks.map(check => [check.id, selected[check.id] !== CORRECT_TEAM_ANSWERS[check.id]]));
      setWrong(nextWrong);
      if (Object.values(nextWrong).some(Boolean)) {
        await onRetry(index + 1);
        return;
      }
      setSaving(true);
      const picked = Object.fromEntries(checks.map(check => [check.id, selected[check.id]]));
      await onComplete(index + 1, picked);
      setSaving(false);
    }
    if (isLast) { onFinish(); return; }
    setIndex(value => Math.min(STEP_COUNT - 1, value + 1));
  };

  // Bubble goes beside the target — below it by preference, above if that side
  // is roomier. When neither side can hold a readable bubble (a target near the
  // middle of a short window) it floats centred instead: overlapping the target
  // is fine, the gold ring still marks it, and a squeezed 90px bubble is not.
  const bubbleWidth = Math.min(430, viewportW - 28);
  const MIN_BUBBLE_H = 300;
  const spaceBelow = rect ? viewportH - rect.bottom - 28 : 0;
  const spaceAbove = rect ? rect.top - 28 : 0;
  const side = (!rect || forceCentre) ? 'centre'
    : spaceBelow >= MIN_BUBBLE_H ? 'below'
      : spaceAbove >= MIN_BUBBLE_H ? 'above'
        : 'centre';
  const bubbleStyle: React.CSSProperties = side === 'centre'
    ? {
      position: 'fixed',
      width: bubbleWidth,
      left: Math.max(14, viewportW / 2 - bubbleWidth / 2),
      top: '50%',
      transform: 'translateY(-50%)',
      maxHeight: viewportH - 56,
    }
    : {
      position: 'fixed',
      width: bubbleWidth,
      left: Math.max(14, Math.min(viewportW - bubbleWidth - 14, rect!.left + rect!.width / 2 - bubbleWidth / 2)),
      ...(side === 'below' ? { top: rect!.bottom + 14 } : { bottom: viewportH - rect!.top + 14 }),
      maxHeight: side === 'below' ? spaceBelow : spaceAbove,
    };

  return (
    <>
      <TeamMockPanel state={panelState} onStateChange={onPanelState} />

      {/* Dimmer + ring */}
      {rect ? (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: rect.top - 6, left: rect.left - 6,
            width: rect.width + 12, height: rect.height + 12,
            borderRadius: 10,
            boxShadow: '0 0 0 3px rgba(255,215,0,.9), 0 0 0 9999px rgba(9,9,11,.62)',
            pointerEvents: 'none',
            zIndex: 200,
            transition: 'all .22s ease',
          }}
        />
      ) : (
        <div aria-hidden="true" style={{ position: 'fixed', inset: 0, background: 'rgba(9,9,11,.62)', pointerEvents: 'none', zIndex: 200 }} />
      )}

      {/* Bubble */}
      <div
        role="dialog"
        aria-label={step.title}
        style={{
          ...bubbleStyle,
          zIndex: 210,
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 18px 44px rgba(0,0,0,.34)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: INK,
        }}
      >
        {/* Only the reading half scrolls. Back/Next stay pinned below it, so a
            long step with a four-option check can never push them out of reach. */}
        <div ref={scrollerRef} style={{ overflowY: 'auto', minHeight: 0, flex: '1 1 auto', padding: '16px 17px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ color: '#8a741b', fontSize: 10, fontWeight: 850, letterSpacing: 1.2, textTransform: 'uppercase' }}>Step {index + 1} of {STEP_COUNT}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => setGuideOpen(true)} style={{ border: `1px solid ${HAIR}`, background: '#fff', borderRadius: 999, padding: '3px 9px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Field guide</button>
            <button type="button" onClick={() => setFaqOpen(true)} style={{ border: `1px solid ${HAIR}`, background: '#fff', borderRadius: 999, padding: '3px 9px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Doubt?</button>
          </div>
        </div>
        <h2 style={{ margin: '8px 0 8px', fontSize: 18.5, letterSpacing: '-.4px', lineHeight: 1.22 }}>{step.title}</h2>
        <div style={{ display: 'grid', gap: 9 }}>
          {step.body.map(paragraph => <p key={paragraph} style={{ margin: 0, color: '#3f3f46', fontSize: 13.5, lineHeight: 1.55 }}>{paragraph}</p>)}
        </div>

        {!interactionDone && step.requiresHint && (
          <div style={{ marginTop: 12, borderLeft: `3px solid ${GOLD}`, background: '#fffdf4', borderRadius: '0 10px 10px 0', padding: '9px 11px', color: '#7c5b00', fontSize: 12.5, fontWeight: 700 }}>
            👆 {step.requiresHint}
          </div>
        )}

        {checks.map(check => (
          <CheckBlock
            key={check.id}
            check={check}
            selected={selected[check.id]}
            wrong={Boolean(wrong[check.id])}
            onSelect={key => {
              setSelected(current => ({ ...current, [check.id]: key }));
              setWrong(current => ({ ...current, [check.id]: false }));
            }}
          />
        ))}

        {Object.values(wrong).some(Boolean) && (
          <div role="alert" style={{ marginTop: 11, border: '1.5px solid #fecaca', background: '#fef2f2', borderRadius: 11, padding: '9px 11px', color: '#b91c1c', fontSize: 12.5, lineHeight: 1.45 }}>
            Not quite — the answer is in what you just read. Take another look.
          </div>
        )}
        </div>

        <div style={{ display: 'flex', gap: 8, padding: '11px 17px 15px', flexShrink: 0, borderTop: `1px solid ${HAIR}` }}>
          {index > 0 && (
            <button type="button" onClick={() => setIndex(value => Math.max(0, value - 1))} style={{ ...secondaryBtn, width: 92, padding: '11px 0' }}>Back</button>
          )}
          <button
            type="button"
            className={canAdvance ? 'team-cta-shimmer' : undefined}
            disabled={!canAdvance}
            onClick={() => void next()}
            style={{ ...primaryBtn(canAdvance), flex: 1, padding: '11px 0' }}
          >
            {saving ? 'Saving…' : isLast ? (readOnly ? 'Back to my dashboard' : 'Finish up') : 'Next'}
            {!saving && <ArrowRight size={15} style={{ display: 'inline', verticalAlign: '-2px', marginLeft: 5 }} />}
          </button>
        </div>
      </div>

      <FieldGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
      <FaqSheet open={faqOpen} onClose={() => setFaqOpen(false)} />
    </>
  );
}

function Field({ label, error, helper, children }: { label: string; error?: string; helper?: string; children: React.ReactNode }) {
  return <label style={{ display: 'grid', gap: 6 }}><span style={{ color: MUTED, fontSize: 12.5, fontWeight: 700 }}>{label}</span>{children}{helper && !error && <span style={{ color: MUTED, fontSize: 11.5 }}>{helper}</span>}{error && <span style={{ color: RED, fontSize: 11.5 }}>{error}</span>}</label>;
}

const inputStyle = (invalid: boolean): React.CSSProperties => ({ width: '100%', padding: '12px 13px', borderRadius: 12, border: `1.5px solid ${invalid ? RED : HAIR}`, fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' });

function DetailsScreen({ email, initialName, answers, onSuccess, onQuizFailed }: { email: string; initialName: string; answers: Record<string, string>; onSuccess: () => void; onQuizFailed: () => void }) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [requested, setRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const validName = name.trim().length > 0;
  const validPhone = PHONE_RE.test(phone);
  const validUpi = UPI_RE.test(upiId.trim());
  const valid = validName && validPhone && validUpi && agreed;
  const submit = async () => {
    setRequested(true);
    setError('');
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Your sign-in expired. Please sign in again.');
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/marketer-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), phone, upi_id: upiId.trim(), answers }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (body.quiz_failed) { onQuizFailed(); return; }
        if (body.error === 'admin_email') throw new Error('This email is a founder account. Use a different Google account for team access.');
        if (body.error === 'inactive_marketer') throw new Error('This team account is inactive. Contact the founder for help.');
        if (response.status === 429) throw new Error('Too many attempts. Wait 10 minutes, then try again.');
        throw new Error(body.message || body.error || 'We could not create your account. Please try again.');
      }
      onSuccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main style={{ padding: '12px 22px 30px' }}>
      <h1 style={{ margin: 0, fontSize: 23, fontWeight: 850, letterSpacing: '-.55px' }}>Your details</h1>
      <p style={{ margin: '8px 0 22px', color: MUTED, fontSize: 13.5, lineHeight: 1.55 }}>Signing up as <strong style={{ color: INK }}>{email}</strong> — this is the account you&apos;ll always log in with.</p>
      <div style={{ display: 'grid', gap: 16 }}>
        <Field label="Your name" error={requested && !validName ? 'Enter your name.' : undefined}><input value={name} onChange={event => setName(event.target.value.slice(0, 80))} placeholder="As you'd introduce yourself on a call" autoComplete="name" style={inputStyle(requested && !validName)} /></Field>
        <Field label="Phone number" helper="The WhatsApp number we'll reach you on." error={requested && !validPhone ? 'Enter a valid 10-digit Indian mobile number.' : undefined}><input value={phone} onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" inputMode="numeric" autoComplete="tel" style={inputStyle(requested && !validPhone)} /></Field>
        <Field label="UPI ID (so we can pay your commission)" error={requested && !validUpi ? 'Enter a valid UPI ID, like yourname@bank.' : undefined}><input value={upiId} onChange={event => setUpiId(event.target.value.slice(0, 321))} placeholder="yourname@bank" autoCapitalize="none" autoCorrect="off" style={inputStyle(requested && !validUpi)} /></Field>
      </div>
      <button type="button" onClick={() => setAgreed(value => !value)} aria-pressed={agreed} style={{ marginTop: 20, border: 0, background: 'transparent', padding: 0, display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}><span style={{ width: 20, height: 20, flex: '0 0 auto', borderRadius: 6, border: `1.5px solid ${agreed ? INK : HAIR}`, background: agreed ? INK : '#fff', color: '#fff', display: 'grid', placeItems: 'center', marginTop: 1 }}>{agreed && <Check size={14} strokeWidth={3} />}</span><span style={{ color: '#3f3f46', fontSize: 12.5, lineHeight: 1.5 }}>I agree to keep customer details confidential, contact leads only through the booking process, and collect payments only through the official payment link.</span></button>
      {requested && !agreed && <p style={{ color: RED, fontSize: 11.5, margin: '7px 0 0' }}>Please accept the agreement to continue.</p>}
      {error && <div role="alert" style={{ marginTop: 15, border: '1.5px solid #fecaca', background: '#fef2f2', borderRadius: 12, padding: 12, color: '#b91c1c', fontSize: 12.5, lineHeight: 1.5 }}>{error}</div>}
      <button type="button" className={valid && !submitting ? 'team-cta-shimmer' : undefined} disabled={submitting} onClick={() => void submit()} style={{ ...primaryBtn(valid && !submitting), marginTop: 19 }}>{submitting ? 'Setting up your account…' : 'Join the team'}</button>
    </main>
  );
}

function SuccessScreen() {
  return <main style={{ minHeight: '100vh', padding: '48px 24px 34px', display: 'grid', alignContent: 'center', textAlign: 'center' }}><div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 19px', background: INK, color: GOLD, display: 'grid', placeItems: 'center' }}><Check size={31} strokeWidth={3} /></div><h1 style={{ margin: 0, fontSize: 27, letterSpacing: '-.7px' }}>You&apos;re on the team.</h1><p style={{ margin: '12px 0 0', color: MUTED, fontSize: 14, lineHeight: 1.65 }}>Your Team Dashboard is live — this is the real thing now, not practice.</p><p style={{ margin: '10px 0 0', color: MUTED, fontSize: 14, lineHeight: 1.65 }}>You&apos;re starting on the customer desk as a marketer. Leads arrive when you&apos;re <strong>assigned to an event</strong>, and events are staffed as they need people. A quiet first few days is normal — it means you&apos;re on the roster, ready to go. We&apos;ll message you on WhatsApp when your first event comes up.</p><p style={{ margin: '10px 0 24px', color: MUTED, fontSize: 14, lineHeight: 1.65 }}><strong style={{ color: INK }}>What comes after</strong> is up to the work: the people here in operations, design and management all started exactly where you&apos;re standing.</p><a href="/admin" className="team-cta-shimmer" style={{ ...primaryBtn(true), display: 'block', textDecoration: 'none', boxSizing: 'border-box', maxWidth: 380, margin: '0 auto' }}>Open my Team Dashboard</a></main>;
}

function AlreadyScreen({ onSignOut }: { onSignOut: () => void }) {
  return <main style={{ minHeight: '100vh', padding: '48px 24px 34px', display: 'grid', alignContent: 'center', textAlign: 'center' }}><div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 19px', background: INK, color: GOLD, display: 'grid', placeItems: 'center' }}><Check size={31} strokeWidth={3} /></div><h1 style={{ margin: 0, fontSize: 25, letterSpacing: '-.65px' }}>You&apos;re already on the team.</h1><p style={{ margin: '10px 0 23px', color: MUTED, fontSize: 14, lineHeight: 1.6 }}>Your Team Dashboard is ready. Open it to see your leads and your training.</p><div style={{ maxWidth: 380, margin: '0 auto' }}><a href="/admin" className="team-cta-shimmer" style={{ ...primaryBtn(true), display: 'block', textDecoration: 'none', boxSizing: 'border-box' }}>Open Team Dashboard</a><button type="button" onClick={onSignOut} style={{ ...secondaryBtn, marginTop: 10 }}>Sign out</button></div></main>;
}

export default function TeamOnboarding() {
  const [authReady, setAuthReady] = useState(TOUR_DEV);
  const [email, setEmail] = useState(TOUR_DEV ? 'preview@local' : '');
  const [profileName, setProfileName] = useState('');
  const [authError, setAuthError] = useState('');
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [screen, setScreen] = useState<Screen>(TOUR_DEV ? 'tour' : 'welcome');
  const [progress, setProgress] = useState<TeamProgress>(EMPTY_PROGRESS);
  const [panelState, setPanelState] = useState<PanelState>(EMPTY_PANEL_STATE);
  const [readOnly, setReadOnly] = useState(false);
  const [syncWarning, setSyncWarning] = useState('');
  const lookupSequence = useRef(0);
  const intentRecordedFor = useRef('');

  useEffect(() => {
    if (TOUR_DEV) return;
    let alive = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const user = data.session?.user;
      setEmail((user?.email ?? '').toLowerCase());
      setProfileName(String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ''));
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setEmail((session?.user.email ?? '').toLowerCase());
      setProfileName(String(session?.user.user_metadata?.full_name ?? session?.user.user_metadata?.name ?? ''));
      setAuthReady(true);
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (TOUR_DEV || !authReady || !email || intentRecordedFor.current === email) return;
    intentRecordedFor.current = email;
    // supabase-js query builders are lazy thenables: the request is only sent
    // once .then() runs. Without this the funnel row is never written.
    void supabase.rpc('record_marketer_signup_intent').then(() => {}, () => {});
  }, [authReady, email]);

  useEffect(() => {
    if (TOUR_DEV || !authReady || !email) return;
    const sequence = ++lookupSequence.current;
    setLoadingAccount(true);
    const run = async () => {
      let marketerResult = await supabase.from('call_marketers').select('id, active').eq('email', email).maybeSingle();
      // Right after Google login, the first RLS-filtered read can return an
      // empty result before the access token has attached. Retry empties once
      // as well as explicit errors before deciding this is a new marketer.
      if (marketerResult.error || !marketerResult.data) {
        await new Promise(resolve => window.setTimeout(resolve, 250));
        marketerResult = await supabase.from('call_marketers').select('id, active').eq('email', email).maybeSingle();
      }
      if (sequence !== lookupSequence.current) return;
      if (marketerResult.error) {
        setScreen('error');
        setLoadingAccount(false);
        return;
      }
      if (marketerResult.data?.active) {
        sessionStorage.removeItem(ONBOARDING_INTENT_KEY);
        const revisitRequested = new URLSearchParams(window.location.search).get('revisit') === '1';
        if (revisitRequested) {
          const { data: signup } = await supabase.from('marketer_signups').select('progress, name').eq('email', email).maybeSingle();
          const saved = normalizeProgress(signup?.progress);
          setProgress({ ...saved, completed: TOUR_STEPS.map((_, index) => index + 1), current_level: 1 });
          if (!profileName && signup?.name) setProfileName(signup.name);
          setReadOnly(true);
          setScreen('tour');
          setLoadingAccount(false);
          return;
        }
        setScreen('already');
        setLoadingAccount(false);
        return;
      }
      const { error: insertError } = await supabase.from('marketer_signups').upsert({ email }, { onConflict: 'email', ignoreDuplicates: true });
      if (insertError) {
        setScreen('error');
        setLoadingAccount(false);
        return;
      }
      const { data: signup, error: signupError } = await supabase.from('marketer_signups').select('progress, name').eq('email', email).single();
      if (sequence !== lookupSequence.current) return;
      if (signupError) {
        setScreen('error');
        setLoadingAccount(false);
        return;
      }
      let nextProgress = normalizeProgress(signup?.progress);
      try {
        const local = JSON.parse(localStorage.getItem(LOCAL_PROGRESS_KEY) || 'null');
        if (local?.email === email && nextProgress.completed.length === 0 && normalizeProgress(local.progress).completed.length > 0) nextProgress = normalizeProgress(local.progress);
      } catch { /* Ignore a malformed offline fallback. */ }
      setProgress(nextProgress);
      if (!profileName && signup?.name) setProfileName(signup.name);
      setScreen(nextProgress.completed.length > 0 ? 'tour' : 'welcome');
      sessionStorage.removeItem(ONBOARDING_INTENT_KEY);
      setLoadingAccount(false);
    };
    void run();
  }, [authReady, email]);

  const saveProgress = useCallback(async (next: TeamProgress) => {
    setProgress(next);
    if (readOnly || TOUR_DEV) return;
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify({ email, progress: next }));
    const { error } = await supabase.from('marketer_signups').update({ progress: next, updated_at: new Date().toISOString() }).eq('email', email);
    setSyncWarning(error ? 'Saved on this device. We will retry the cloud copy on your next step.' : '');
  }, [email, readOnly]);

  const completeStep = useCallback(async (stepNumber: number, answers: Record<string, string>) => {
    await saveProgress({
      ...progress,
      answers: { ...progress.answers, ...answers },
      completed: [...new Set([...progress.completed, stepNumber])].sort((a, b) => a - b),
      current_level: Math.min(STEP_COUNT, Math.max(progress.current_level, stepNumber + 1)),
      level_timestamps: { ...progress.level_timestamps, [String(stepNumber)]: new Date().toISOString() },
    });
  }, [progress, saveProgress]);

  const recordRetry = useCallback(async (stepNumber: number) => {
    const key = String(stepNumber);
    await saveProgress({ ...progress, retries: { ...progress.retries, [key]: (progress.retries[key] ?? 0) + 1 } });
  }, [progress, saveProgress]);

  const signIn = async () => {
    setAuthError('');
    sessionStorage.setItem(ONBOARDING_INTENT_KEY, '1');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/team` } });
    if (error) { sessionStorage.removeItem(ONBOARDING_INTENT_KEY); setAuthError(error.message); }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem(ONBOARDING_INTENT_KEY);
    window.location.assign('/team');
  };

  if (!authReady) return <><SharedStyles /><Loader /></>;
  if (!email) return <><SharedStyles /><LoginScreen onBecome={() => void signIn()} authError={authError} /></>;
  if (loadingAccount) return <><SharedStyles /><Loader label="Finding your place…" /></>;
  if (screen === 'already') return <><SharedStyles /><AlreadyScreen onSignOut={() => void signOut()} /></>;
  if (screen === 'success') return <><SharedStyles /><SuccessScreen /></>;
  if (screen === 'error') return <><SharedStyles /><main style={{ minHeight: '100vh', padding: 28, display: 'grid', alignContent: 'center', textAlign: 'center' }}><h1 style={{ fontSize: 23, margin: 0 }}>We couldn&apos;t load your training.</h1><p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6 }}>Your sign-in is safe. Check your connection and try again.</p><div style={{ maxWidth: 340, margin: '0 auto' }}><button type="button" className="team-cta-shimmer" onClick={() => window.location.reload()} style={primaryBtn(true)}>Try again</button><button type="button" onClick={() => void signOut()} style={{ ...secondaryBtn, marginTop: 10 }}>Sign out</button></div></main></>;

  return (
    <div style={{ minHeight: '100vh', background: screen === 'tour' ? '#f5f5f0' : '#fff', color: INK, fontFamily: 'system-ui, -apple-system, sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      <SharedStyles />
      {syncWarning && <div role="status" style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff7d6', borderBottom: '1px solid #ead37a', padding: '8px 14px', color: '#6b5912', fontSize: 11.5, textAlign: 'center' }}>{syncWarning}</div>}
      {screen === 'tour' ? (
        <TourScreen
          progress={progress}
          panelState={panelState}
          onPanelState={setPanelState}
          onComplete={completeStep}
          onRetry={recordRetry}
          onFinish={() => { if (readOnly) window.location.assign('/admin'); else setScreen('details'); }}
          readOnly={readOnly}
        />
      ) : (
        <Narrow>
          <TopBar step={screen === 'welcome' ? 1 : 3} onBack={() => {
            if (screen === 'welcome') void signOut();
            else setScreen('tour');
          }} />
          {screen === 'welcome' && <WelcomeScreen onContinue={() => setScreen('tour')} />}
          {screen === 'details' && <DetailsScreen email={email} initialName={profileName} answers={progress.answers} onSuccess={() => { localStorage.removeItem(LOCAL_PROGRESS_KEY); setScreen('success'); }} onQuizFailed={() => { setSyncWarning('One training answer needs another look. Walk the tour again and try once more.'); setScreen('tour'); }} />}
        </Narrow>
      )}
    </div>
  );
}

function SharedStyles() {
  return <style>{`
    @keyframes teamCtaShimmer { 0% { transform: skewX(-16deg) translateX(-180%); } 100% { transform: skewX(-16deg) translateX(430%); } }
    @keyframes teamLoaderEnter { from { opacity:0; transform:scale(.82) rotate(-5deg); } to { opacity:1; transform:scale(1) rotate(0); } }
    @keyframes teamLoaderGlow { 0%,100% { box-shadow:0 0 22px rgba(255,215,0,.22); } 50% { box-shadow:0 0 42px rgba(255,215,0,.48); } }
    @keyframes teamSpinner { to { transform: rotate(360deg); } }
    .team-cta-shimmer::before { content:''; position:absolute; inset:0 auto 0 -35%; width:32%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent); animation:teamCtaShimmer 2.2s ease-in-out infinite; pointer-events:none; }
    .team-loader-mark { animation:teamLoaderEnter .35s ease-out both, teamLoaderGlow 1.8s ease-in-out infinite .35s; }
    .team-spinner { animation:teamSpinner .8s linear infinite; }
    @media (prefers-reduced-motion: reduce) { .team-cta-shimmer::before,.team-loader-mark,.team-spinner { animation:none !important; } }
  `}</style>;
}
