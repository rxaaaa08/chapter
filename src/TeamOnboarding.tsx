import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, ChevronDown, ChevronLeft, Lock, X } from 'lucide-react';
import { supabase } from './supabase';
import {
  CORRECT_TEAM_ANSWERS,
  TEAM_LEVELS,
  type TeamAnswerOption,
  type TeamCheck,
  type TeamLevel,
} from './TeamOnboardingLevels';
import { TeamLevelMock, type DemoLead } from './TeamOnboardingMocks';

const INK = '#111111';
const MUTED = '#9a9aa2';
const HAIR = '#ececed';
const GOLD = '#FFD700';
const RED = '#dc2626';
const LOCAL_PROGRESS_KEY = 'teamOnboardingProgressV1';
const ONBOARDING_INTENT_KEY = 'teamOnboardingIntent';
// TODO(owner): set this to the vertical marketer welcome video id.
const TEAM_WELCOME_VIMEO_ID: string | null = null;
const UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const SUPABASE_FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

type Screen = 'welcome' | 'map' | 'details' | 'success' | 'already' | 'error';

type TeamProgress = {
  current_level: number;
  completed: number[];
  retries: Record<string, number>;
  answers: Record<string, string>;
  test_application?: DemoLead;
  level_timestamps: Record<string, string>;
};

const EMPTY_PROGRESS: TeamProgress = {
  current_level: 1,
  completed: [],
  retries: {},
  answers: {},
  level_timestamps: {},
};

const FALLBACK_LEAD: DemoLead = {
  name: 'Demo Lead',
  date: 'Sun 2 Aug',
  meeting_point: 'Nungambakkam — 11:00 AM',
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
    answer: 'A fixed amount for every fully-paid ticket you close (usually ₹50 — your dashboard shows the exact rate per event). The more events you\'re on and the more leads you close, the more you earn.',
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
    link: 'https://wa.me/919940111564',
  },
];

const STATUS_FIELD_GUIDE = [
  ['Pending', 'Applied, waiting for your call and approval.'],
  ['Invited', 'Approved — payment link is with them. Stay close.'],
  ['Fully paid', "Money in, spot confirmed — you've earned."],
  ['Waitlist', 'Their date sold out. Call → offer the other date → shift.'],
  ['Rejected', 'Not a fit. Closed respectfully.'],
  ['Cart abandoned', "Opened the payment page, didn't finish. Make the trust call."],
  ['Re-target', '24h since invite, never opened the payment page. Resend + call.'],
  ['Recovered', 'Abandoned, then paid. A save — counts fully.'],
] as const;

function normalizeProgress(raw: unknown): TeamProgress {
  const value = raw && typeof raw === 'object' ? raw as Partial<TeamProgress> : {};
  const completed = Array.isArray(value.completed)
    ? [...new Set(value.completed.filter((item): item is number => Number.isInteger(item) && item >= 1 && item <= 13))].sort((a, b) => a - b)
    : [];
  return {
    current_level: Math.min(13, Math.max(1, Number(value.current_level) || Math.min(13, completed.length + 1))),
    completed,
    retries: value.retries && typeof value.retries === 'object' ? value.retries : {},
    answers: value.answers && typeof value.answers === 'object' ? value.answers : {},
    test_application: value.test_application,
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

function Loader({ label = 'Getting things ready…' }: { label?: string }) {
  return (
    <div style={{ height: '100%', minHeight: 480, display: 'grid', placeItems: 'center', background: '#fff' }}>
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
    <div style={{ minHeight: '100%', padding: '32px 22px', display: 'grid', placeItems: 'center', background: '#fff' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <Wordmark />
        <div style={{ marginTop: 34, border: `1.5px dashed #d9bf52`, borderRadius: 24, padding: '28px 22px', background: 'linear-gradient(155deg, #fffdf1 0%, #fff 55%)' }}>
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
      <p style={{ margin: '0 0 18px', color: MUTED, fontSize: 14, lineHeight: 1.55 }}>This training takes about 15 minutes. First you&apos;ll see what our customers see. Then you&apos;ll handle a booking yourself — every situation you&apos;ll actually face, one level at a time.</p>
      <div style={{ height: 'min(56vh, 460px)', aspectRatio: '9 / 16', maxWidth: '100%', margin: '0 auto', position: 'relative', borderRadius: 24, overflow: 'hidden', background: '#000', border: `1.5px solid ${HAIR}` }}>
        {TEAM_WELCOME_VIMEO_ID ? <>
          {!videoLoaded && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', zIndex: 1 }}><span className="team-spinner" style={{ width: 30, height: 30, border: '3px solid rgba(255,255,255,.25)', borderTopColor: GOLD, borderRadius: '50%' }} /></div>}
          <iframe title="Welcome to core team training" src={`https://player.vimeo.com/video/${TEAM_WELCOME_VIMEO_ID}?autoplay=0&muted=0&badge=0&byline=0&title=0&portrait=0&api=1`} onLoad={() => setVideoLoaded(true)} allow="autoplay; fullscreen; picture-in-picture" style={{ position: 'absolute', inset: -2, width: 'calc(100% + 4px)', height: 'calc(100% + 4px)', border: 0, clipPath: 'inset(0 round 22px)' }} />
        </> : <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 28, textAlign: 'center', background: 'linear-gradient(155deg,#171717,#050505)', color: '#d4d4d8' }}><div><div style={{ width: 54, height: 54, margin: '0 auto 16px', borderRadius: 17, background: GOLD, color: INK, display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 900 }}>அ</div><span style={{ fontSize: 13.5, fontWeight: 700 }}>Founder welcome video coming soon</span></div></div>}
      </div>
      <button type="button" className="team-cta-shimmer" onClick={onContinue} style={{ ...primaryBtn(true), marginTop: 18 }}>Start training</button>
    </main>
  );
}

function LevelNode({ level, completed, unlocked, current, onOpen }: { key?: React.Key; level: TeamLevel; completed: boolean; unlocked: boolean; current: boolean; onOpen: () => void }) {
  const state = completed ? 'completed' : unlocked ? 'unlocked' : 'locked';
  const size = completed ? 36 : 48;
  return (
    <button type="button" disabled={!unlocked && !completed} onClick={onOpen} aria-label={`Level ${level.id}: ${level.title}, ${state}`} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, border: 0, background: 'transparent', padding: '7px 0', textAlign: 'left', cursor: unlocked || completed ? 'pointer' : 'default', fontFamily: 'inherit', position: 'relative', zIndex: 1 }}>
      <span className={current ? 'team-level-pulse' : undefined} style={{ width: size, height: size, marginLeft: (48 - size) / 2, marginRight: (48 - size) / 2, flex: '0 0 auto', borderRadius: '50%', border: completed ? `2px solid ${INK}` : `2px solid ${unlocked ? INK : HAIR}`, background: completed ? INK : '#fff', color: completed ? '#fff' : unlocked ? INK : MUTED, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 850 }}>{completed ? <Check size={18} strokeWidth={3} /> : unlocked ? level.id : <Lock size={15} />}</span>
      <span style={{ color: unlocked || completed ? INK : MUTED, fontSize: 14.5, lineHeight: 1.35, fontWeight: unlocked || completed ? 750 : 650 }}>{level.title}</span>
    </button>
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
      {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(12px)' }} onClick={onClose}>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 27, stiffness: 270 }} role="dialog" aria-modal="true" aria-label="Team questions" onClick={event => event.stopPropagation()} style={{ position: 'absolute', inset: 'auto 0 0', maxHeight: '84%', overflowY: 'auto', background: '#fff', borderRadius: '32px 32px 0 0', padding: '27px 22px 28px', boxShadow: '0 -16px 40px rgba(0,0,0,.16)' }}>
          <button type="button" onClick={onClose} aria-label="Close questions" style={{ position: 'absolute', right: 18, top: 18, width: 35, height: 35, borderRadius: '50%', border: `1px solid ${HAIR}`, background: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={17} /></button>
          <h2 style={{ margin: '2px 46px 22px 0', fontSize: 22, letterSpacing: '-.45px' }}>Got a question? 🤔</h2>
          {FAQS.map((faq, index) => <div key={faq.question} style={{ borderTop: `1px solid ${HAIR}` }}>
            <button type="button" aria-expanded={expanded === index} onClick={() => setExpanded(value => value === index ? null : index)} style={{ width: '100%', border: 0, background: '#fff', padding: '16px 0', display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}><span style={{ flex: 1, fontWeight: 750, fontSize: 14.5, lineHeight: 1.4 }}>{faq.question}</span><motion.span animate={{ rotate: expanded === index ? 180 : 0 }}><ChevronDown size={18} /></motion.span></button>
            <AnimatePresence initial={false}>{expanded === index && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}><p style={{ margin: '-3px 0 17px', color: '#57534e', fontSize: 13.5, lineHeight: 1.6 }}>{faq.answer} {faq.link && <a href={faq.link} target="_blank" rel="noreferrer" style={{ color: INK, fontWeight: 750 }}>Contact Us</a>}</p></motion.div>}</AnimatePresence>
          </div>)}
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
      {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, zIndex: 82, background: 'rgba(0,0,0,.5)' }} onClick={onClose}>
        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 27, stiffness: 270 }} role="dialog" aria-modal="true" aria-label="Lead status field guide" onClick={event => event.stopPropagation()} style={{ position: 'absolute', inset: 'auto 0 0', maxHeight: '86%', overflowY: 'auto', background: '#fff', borderRadius: '32px 32px 0 0', padding: '27px 22px 28px', boxShadow: '0 -16px 40px rgba(0,0,0,.16)' }}>
          <button type="button" onClick={onClose} aria-label="Close field guide" style={{ position: 'absolute', right: 18, top: 18, width: 35, height: 35, borderRadius: '50%', border: `1px solid ${HAIR}`, background: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><X size={17} /></button>
          <div style={{ color: '#8a741b', fontSize: 10.5, fontWeight: 850, letterSpacing: 1.25, textTransform: 'uppercase' }}>Keep this handy</div>
          <h2 style={{ margin: '7px 46px 8px 0', fontSize: 22, letterSpacing: '-.45px' }}>Lead status field guide</h2>
          <p style={{ margin: '0 0 18px', color: MUTED, fontSize: 13, lineHeight: 1.55 }}>The one-line next move for every status you&apos;ll see.</p>
          <div style={{ border: `1px solid ${HAIR}`, borderRadius: 16, overflow: 'hidden' }}>{STATUS_FIELD_GUIDE.map(([status, description]) => <div key={status} style={{ display: 'grid', gridTemplateColumns: '106px 1fr', gap: 11, padding: '12px 13px', borderTop: status === 'Pending' ? 0 : `1px solid ${HAIR}`, alignItems: 'start' }}><strong style={{ fontSize: 12.5, color: INK }}>{status}</strong><span style={{ color: '#57534e', fontSize: 12.5, lineHeight: 1.5 }}>{description}</span></div>)}</div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}

function MapScreen({ progress, onOpenLevel, onContinue, readOnly }: { progress: TeamProgress; onOpenLevel: (level: number) => void; onContinue: () => void; readOnly: boolean }) {
  const [faqOpen, setFaqOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const completed = new Set(progress.completed);
  const allDone = completed.size === TEAM_LEVELS.length;
  const renderAct = (act: 1 | 2, label: string, subtitle: string) => {
    const levels = TEAM_LEVELS.filter(level => level.act === act);
    return <section style={{ marginTop: act === 1 ? 8 : 25 }}>
      <div style={{ fontSize: 12.4, fontWeight: 850, letterSpacing: .45, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ marginTop: 3, color: MUTED, fontSize: 10.5, fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase' }}>{subtitle}</div>
      <div style={{ position: 'relative', marginTop: 10 }}><span style={{ position: 'absolute', left: 23, top: 18, bottom: 18, width: 2, background: HAIR }} />{levels.map(level => {
        const done = completed.has(level.id);
        const unlocked = level.id === 1 || completed.has(level.id - 1);
        const current = !done && unlocked && level.id === Math.min(13, Math.max(1, progress.current_level));
        return <LevelNode key={level.id} level={level} completed={done} unlocked={unlocked} current={current} onOpen={() => onOpenLevel(level.id)} />;
      })}</div>
    </section>;
  };
  return (
    <main style={{ padding: '10px 22px 30px' }}>
      <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 12 }}><div><h1 style={{ margin: 0, fontSize: 23, letterSpacing: '-.55px' }}>Your training map</h1><p style={{ margin: '6px 0 0', color: MUTED, fontSize: 13.5 }}>One real situation at a time.</p></div><div style={{ border: `1px solid ${HAIR}`, borderRadius: 999, padding: '7px 10px', fontSize: 12, fontWeight: 800 }}>{completed.size} of 13</div></div>
      {renderAct(1, 'Act 1 · Be the customer', 'See the journey first')}
      {renderAct(2, 'Act 2 · Be the marketer', 'Handle the lead')}
      {allDone && !readOnly && <div style={{ margin: '25px 0 15px', border: `1px solid ${HAIR}`, borderRadius: 18, padding: 17, background: '#fafafa' }}><h2 style={{ margin: 0, fontSize: 19 }}>That&apos;s rung one.</h2><p style={{ margin: '8px 0 0', color: MUTED, fontSize: 13.5, lineHeight: 1.6 }}>You&apos;ve seen what the customer sees, handled a lead from Pending to paid, chased the silent ones, saved an abandoned payment, and turned a sold-out date into a booking.</p><p style={{ margin: '8px 0 0', color: MUTED, fontSize: 13.5, lineHeight: 1.6 }}>That&apos;s the customer desk — where everyone here starts. What comes next depends on what you&apos;re good at and what we need: more events, a team to manage, operations, design, support. All of it starts with the calls you&apos;re about to make.</p><p style={{ margin: '8px 0 0', color: MUTED, fontSize: 13.5, lineHeight: 1.6 }}>One last step: your details — so we know who you are and where to pay you.</p></div>}
      {readOnly && <div style={{ margin: '25px 0 15px', border: `1px solid ${HAIR}`, borderRadius: 18, padding: 17, background: '#fafafa' }}><h2 style={{ margin: 0, fontSize: 19 }}>Your training library</h2><p style={{ margin: '8px 0 0', color: MUTED, fontSize: 13.5, lineHeight: 1.6 }}>Every lesson is unlocked. Reopen any situation for a refresher — nothing you do here changes your live leads or your team account.</p></div>}
      <button type="button" className={allDone ? 'team-cta-shimmer' : undefined} disabled={!allDone} onClick={onContinue} style={primaryBtn(allDone)}>{readOnly ? 'Back to my Team Dashboard' : 'Finish up'} <ArrowRight size={16} style={{ display: 'inline', verticalAlign: '-3px', marginLeft: 4 }} /></button>
      <button type="button" onClick={() => setGuideOpen(true)} style={{ ...secondaryBtn, marginTop: 10 }}>Open the Status Field Guide</button>
      <button type="button" onClick={() => setFaqOpen(true)} style={{ ...secondaryBtn, marginTop: 10 }}>I Have a Doubt</button>
      <FaqSheet open={faqOpen} onClose={() => setFaqOpen(false)} />
      <FieldGuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />
    </main>
  );
}

function CheckBlock({ check, options, selected, wrong, onSelect }: { key?: React.Key; check: TeamCheck; options: TeamAnswerOption[]; selected?: string; wrong: boolean; onSelect: (key: string) => void }) {
  return (
    <section style={{ marginTop: 22 }}>
      <div style={{ color: '#8a741b', fontSize: 11, fontWeight: 850, letterSpacing: 1.25, textTransform: 'uppercase' }}>Quick check</div>
      <h3 style={{ margin: '7px 0 11px', fontSize: 16.5, lineHeight: 1.38 }}>{check.question}</h3>
      <div style={{ display: 'grid', gap: 8 }}>{options.map(option => {
        const isSelected = selected === option.key;
        const isWrong = wrong && isSelected;
        return <button type="button" key={option.key} onClick={() => onSelect(option.key)} style={{ padding: '12px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.4, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', border: `1.5px solid ${isWrong ? RED : isSelected ? INK : HAIR}`, background: isWrong ? '#fef2f2' : isSelected ? '#f5f5f5' : '#fff', fontWeight: isSelected ? 700 : 500 }}>{option.label}</button>;
      })}</div>
    </section>
  );
}

function LevelScreen({ level, progress, demoLead, onBack, onComplete, onRetry, onTestApplication, readOnly }: { key?: React.Key; level: TeamLevel; progress: TeamProgress; demoLead: DemoLead; onBack: () => void; onComplete: (answers: Record<string, string>) => Promise<void>; onRetry: () => Promise<void>; onTestApplication: (lead: DemoLead) => Promise<void>; readOnly: boolean }) {
  const shuffledChecks = useMemo(() => level.checks.map(check => ({ ...check, options: shuffle(check.options) })), [level]);
  const [selected, setSelected] = useState<Record<string, string>>(() => Object.fromEntries(level.checks.map(check => [check.id, progress.answers[check.id] ?? ''])));
  const [wrong, setWrong] = useState<Record<string, boolean>>({});
  const [mockReady, setMockReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const canContinue = mockReady && level.checks.every(check => Boolean(selected[check.id])) && !saving;
  const submit = async () => {
    if (!canContinue) return;
    const nextWrong = Object.fromEntries(level.checks.map(check => [check.id, selected[check.id] !== CORRECT_TEAM_ANSWERS[check.id]]));
    setWrong(nextWrong);
    if (Object.values(nextWrong).some(Boolean)) {
      await onRetry();
      return;
    }
    setSaving(true);
    await onComplete(selected);
  };
  return (
    <main style={{ padding: '19px 22px 30px' }}>
      <button type="button" onClick={onBack} style={{ border: 0, background: 'transparent', padding: 0, color: MUTED, fontWeight: 750, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>‹ Lesson Map</button>
      <div style={{ marginTop: 18, color: '#8a741b', fontSize: 10.5, fontWeight: 850, letterSpacing: 1.25, textTransform: 'uppercase' }}>Level {level.id} · Act {level.act}</div>
      <h1 style={{ margin: '7px 0 13px', fontSize: 23, fontWeight: 850, letterSpacing: '-.55px', lineHeight: 1.2 }}>{level.title}</h1>
      {level.content}
      <div style={{ marginTop: 20 }}><TeamLevelMock levelId={level.id} demoLead={demoLead} onReadyChange={setMockReady} onTestApplication={onTestApplication} /></div>
      <div style={{ marginTop: 16, borderLeft: `3px solid ${GOLD}`, background: '#fffdf4', borderRadius: '0 12px 12px 0', padding: '11px 13px' }}><div style={{ color: '#8a741b', fontSize: 10.5, fontWeight: 850, letterSpacing: 1.05, textTransform: 'uppercase' }}>Why this matters later</div><p style={{ margin: '5px 0 0', color: '#57534e', fontSize: 12.5, lineHeight: 1.55 }}>{level.whyLater}</p></div>
      {readOnly ? <><div style={{ marginTop: 18, border: `1px solid ${HAIR}`, background: '#f7f7f8', borderRadius: 12, padding: '11px 13px', color: MUTED, fontSize: 12.5, lineHeight: 1.5 }}>Review mode — practice here as often as you like. Your completed training and team account won&apos;t be changed.</div><button type="button" onClick={onBack} style={{ ...secondaryBtn, marginTop: 12 }}>Back to lesson map</button></> : <>
        {!mockReady && <p style={{ margin: '11px 0 0', color: MUTED, fontSize: 12.5 }}>Complete the practice above to unlock the check.</p>}
        {shuffledChecks.map(check => <CheckBlock key={check.id} check={check} options={check.options} selected={selected[check.id]} wrong={Boolean(wrong[check.id])} onSelect={key => { setSelected(value => ({ ...value, [check.id]: key })); setWrong(value => ({ ...value, [check.id]: false })); }} />)}
        {Object.values(wrong).some(Boolean) && <div role="alert" style={{ marginTop: 13, border: '1.5px solid #fecaca', background: '#fef2f2', borderRadius: 12, padding: '11px 13px', color: '#b91c1c', fontSize: 13, lineHeight: 1.45 }}>Take another look above ☝️ The answer is in the lesson.</div>}
        <button type="button" className={canContinue ? 'team-cta-shimmer' : undefined} disabled={!canContinue} onClick={submit} style={{ ...primaryBtn(canContinue), marginTop: 18 }}>{saving ? 'Saving…' : 'Continue'}</button>
      </>}
    </main>
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
        if (body.error === 'admin_email') throw new Error('This email is a founder account. Use a different Google account for marketer access.');
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
      <button type="button" className={valid && !submitting ? 'team-cta-shimmer' : undefined} disabled={submitting} onClick={submit} style={{ ...primaryBtn(valid && !submitting), marginTop: 19 }}>{submitting ? 'Setting up your account…' : 'Join the team'}</button>
    </main>
  );
}

function SuccessScreen() {
  return <main style={{ minHeight: '100%', padding: '48px 24px 34px', display: 'grid', alignContent: 'center', textAlign: 'center' }}><div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 19px', background: INK, color: GOLD, display: 'grid', placeItems: 'center' }}><Check size={31} strokeWidth={3} /></div><h1 style={{ margin: 0, fontSize: 27, letterSpacing: '-.7px' }}>You&apos;re on the team.</h1><p style={{ margin: '12px 0 0', color: MUTED, fontSize: 14, lineHeight: 1.65 }}>Your Team Dashboard is live — this is the real thing now, not practice.</p><p style={{ margin: '10px 0 0', color: MUTED, fontSize: 14, lineHeight: 1.65 }}>You&apos;re starting on the customer desk as a marketer. Leads arrive when you&apos;re <strong>assigned to an event</strong>, and events are staffed as they need people. A quiet first few days is normal — it means you&apos;re on the roster, ready to go. We&apos;ll message you on WhatsApp when your first event comes up.</p><p style={{ margin: '10px 0 24px', color: MUTED, fontSize: 14, lineHeight: 1.65 }}><strong style={{ color: INK }}>What comes after</strong> is up to the work: the people here in operations, design and management all started exactly where you&apos;re standing.</p><a href="/admin" className="team-cta-shimmer" style={{ ...primaryBtn(true), display: 'block', textDecoration: 'none', boxSizing: 'border-box' }}>Open my Team Dashboard</a></main>;
}

function AlreadyScreen({ onSignOut }: { onSignOut: () => void }) {
  return <main style={{ minHeight: '100%', padding: '48px 24px 34px', display: 'grid', alignContent: 'center', textAlign: 'center' }}><div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 19px', background: INK, color: GOLD, display: 'grid', placeItems: 'center' }}><Check size={31} strokeWidth={3} /></div><h1 style={{ margin: 0, fontSize: 25, letterSpacing: '-.65px' }}>You&apos;re already on the team.</h1><p style={{ margin: '10px 0 23px', color: MUTED, fontSize: 14, lineHeight: 1.6 }}>Your Team Dashboard is ready. Open it to see your leads and your training.</p><a href="/admin" className="team-cta-shimmer" style={{ ...primaryBtn(true), display: 'block', textDecoration: 'none', boxSizing: 'border-box' }}>Open Team Dashboard</a><button type="button" onClick={onSignOut} style={{ ...secondaryBtn, marginTop: 10 }}>Sign out</button></main>;
}

export default function TeamOnboarding() {
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [profileName, setProfileName] = useState('');
  const [authError, setAuthError] = useState('');
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [screen, setScreen] = useState<Screen>('welcome');
  const [activeLevel, setActiveLevel] = useState<number | null>(null);
  const [progress, setProgress] = useState<TeamProgress>(EMPTY_PROGRESS);
  const [readOnly, setReadOnly] = useState(false);
  const [syncWarning, setSyncWarning] = useState('');
  const lookupSequence = useRef(0);
  const intentRecordedFor = useRef('');

  useEffect(() => {
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
    if (!authReady || !email || intentRecordedFor.current === email) return;
    intentRecordedFor.current = email;
    // supabase-js query builders are lazy thenables: the request is only sent
    // once .then() runs. Without this the funnel row is never written.
    void supabase.rpc('record_marketer_signup_intent').then(() => {}, () => {});
  }, [authReady, email]);

  useEffect(() => {
    if (!authReady || !email) return;
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
          setProgress({ ...saved, completed: TEAM_LEVELS.map(level => level.id), current_level: 13 });
          if (!profileName && signup?.name) setProfileName(signup.name);
          setReadOnly(true);
          setScreen('map');
          window.history.replaceState({ ...(window.history.state ?? {}), teamScreen: 'map', teamLevel: null }, '', '/team?revisit=1');
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
      const initialScreen: Screen = nextProgress.completed.length > 0 ? 'map' : 'welcome';
      setScreen(initialScreen);
      // Seed the major-step history even on a cross-device resume. That keeps
      // native/browser Back walking map → welcome instead of dropping out of
      // the authenticated flow on the first press.
      window.history.replaceState({ ...(window.history.state ?? {}), teamScreen: 'welcome', teamLevel: null }, '', '/team');
      if (initialScreen === 'map') {
        window.history.pushState({ ...(window.history.state ?? {}), teamScreen: 'map', teamLevel: null }, '', '/team');
      }
      sessionStorage.removeItem(ONBOARDING_INTENT_KEY);
      setLoadingAccount(false);
    };
    void run();
  }, [authReady, email]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      if (window.location.pathname !== '/team') return;
      const nextLevel = Number(event.state?.teamLevel) || null;
      const nextScreen = event.state?.teamScreen as Screen | undefined;
      setActiveLevel(nextLevel);
      if (nextScreen) setScreen(nextScreen);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openScreen = useCallback((next: Screen) => {
    setScreen(next);
    setActiveLevel(null);
    window.history.pushState({ ...(window.history.state ?? {}), teamScreen: next, teamLevel: null }, '', readOnly ? '/team?revisit=1' : '/team');
  }, [readOnly]);

  const openLevel = useCallback((level: number) => {
    setActiveLevel(level);
    setScreen('map');
    window.history.pushState({ ...(window.history.state ?? {}), teamScreen: 'map', teamLevel: level }, '', readOnly ? '/team?revisit=1' : '/team');
  }, [readOnly]);

  const returnToMap = useCallback(() => {
    if (activeLevel !== null && window.history.state?.teamLevel) window.history.back();
    else { setActiveLevel(null); setScreen('map'); }
  }, [activeLevel]);

  const saveProgress = useCallback(async (next: TeamProgress) => {
    setProgress(next);
    if (readOnly) return;
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify({ email, progress: next }));
    const { error } = await supabase.from('marketer_signups').update({ progress: next, updated_at: new Date().toISOString() }).eq('email', email);
    setSyncWarning(error ? 'Saved on this device. We will retry the cloud copy on your next step.' : '');
  }, [email, readOnly]);

  const completeLevel = useCallback(async (levelId: number, answers: Record<string, string>) => {
    const next: TeamProgress = {
      ...progress,
      answers: { ...progress.answers, ...answers },
      completed: [...new Set([...progress.completed, levelId])].sort((a, b) => a - b),
      current_level: Math.min(13, Math.max(progress.current_level, levelId + 1)),
      level_timestamps: { ...progress.level_timestamps, [String(levelId)]: new Date().toISOString() },
    };
    await saveProgress(next);
    returnToMap();
  }, [progress, returnToMap, saveProgress]);

  const recordRetry = useCallback(async (levelId: number) => {
    const key = String(levelId);
    await saveProgress({ ...progress, retries: { ...progress.retries, [key]: (progress.retries[key] ?? 0) + 1 } });
  }, [progress, saveProgress]);

  const saveTestApplication = useCallback(async (lead: DemoLead) => {
    await saveProgress({ ...progress, test_application: lead });
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
  if (screen === 'error') return <><SharedStyles /><main style={{ minHeight: '100%', padding: 28, display: 'grid', alignContent: 'center', textAlign: 'center' }}><h1 style={{ fontSize: 23, margin: 0 }}>We couldn&apos;t load your training.</h1><p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6 }}>Your sign-in is safe. Check your connection and try again.</p><button type="button" className="team-cta-shimmer" onClick={() => window.location.reload()} style={primaryBtn(true)}>Try again</button><button type="button" onClick={() => void signOut()} style={{ ...secondaryBtn, marginTop: 10 }}>Sign out</button></main></>;

  const level = activeLevel ? TEAM_LEVELS.find(item => item.id === activeLevel) : undefined;
  return (
    <div style={{ height: '100%', minHeight: 0, background: '#fff', color: INK, fontFamily: 'system-ui, -apple-system, sans-serif', overflowY: 'auto', position: 'relative', WebkitFontSmoothing: 'antialiased' }}>
      <SharedStyles />
      {syncWarning && <div role="status" style={{ position: 'sticky', top: 0, zIndex: 20, background: '#fff7d6', borderBottom: '1px solid #ead37a', padding: '8px 14px', color: '#6b5912', fontSize: 11.5, textAlign: 'center' }}>{syncWarning}</div>}
      {level ? <LevelScreen key={level.id} level={level} progress={progress} demoLead={progress.test_application ?? { ...FALLBACK_LEAD, name: profileName || FALLBACK_LEAD.name }} onBack={returnToMap} onComplete={answers => completeLevel(level.id, answers)} onRetry={() => recordRetry(level.id)} onTestApplication={saveTestApplication} readOnly={readOnly} /> : <>
        <TopBar step={screen === 'welcome' ? 1 : screen === 'map' ? 2 : 3} onBack={() => {
          if (readOnly) window.location.assign('/admin');
          else if (screen === 'welcome') void signOut();
          else if (window.history.state?.teamScreen) window.history.back();
          else setScreen(screen === 'details' ? 'map' : 'welcome');
        }} />
        {screen === 'welcome' && <WelcomeScreen onContinue={() => openScreen('map')} />}
        {screen === 'map' && <MapScreen progress={progress} onOpenLevel={openLevel} onContinue={() => readOnly ? window.location.assign('/admin') : openScreen('details')} readOnly={readOnly} />}
        {screen === 'details' && <DetailsScreen email={email} initialName={profileName} answers={progress.answers} onSuccess={() => { localStorage.removeItem(LOCAL_PROGRESS_KEY); setScreen('success'); window.history.replaceState({ teamScreen: 'success', teamLevel: null }, '', '/team'); }} onQuizFailed={() => { setSyncWarning('One training answer needs another look. Review the map and try again.'); openScreen('map'); }} />}
      </>}
    </div>
  );
}

function SharedStyles() {
  return <style>{`
    @keyframes teamCtaShimmer { 0% { transform: skewX(-16deg) translateX(-180%); } 100% { transform: skewX(-16deg) translateX(430%); } }
    @keyframes teamLoaderEnter { from { opacity:0; transform:scale(.82) rotate(-5deg); } to { opacity:1; transform:scale(1) rotate(0); } }
    @keyframes teamLoaderGlow { 0%,100% { box-shadow:0 0 22px rgba(255,215,0,.22); } 50% { box-shadow:0 0 42px rgba(255,215,0,.48); } }
    @keyframes teamSpinner { to { transform: rotate(360deg); } }
    @keyframes teamLevelPulse { 0%,100% { box-shadow:0 0 0 0 rgba(17,17,17,.13); } 50% { box-shadow:0 0 0 8px rgba(17,17,17,0); } }
    @keyframes teamDotPulse { 0%,80%,100% { opacity:.25; transform:translateY(0); } 40% { opacity:1; transform:translateY(-2px); } }
    .team-cta-shimmer::before { content:''; position:absolute; inset:0 auto 0 -35%; width:32%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent); animation:teamCtaShimmer 2.2s ease-in-out infinite; pointer-events:none; }
    .team-loader-mark { animation:teamLoaderEnter .35s ease-out both, teamLoaderGlow 1.8s ease-in-out infinite .35s; }
    .team-spinner { animation:teamSpinner .8s linear infinite; }
    .team-level-pulse { animation:teamLevelPulse 1.8s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .team-cta-shimmer::before,.team-loader-mark,.team-spinner,.team-level-pulse,.team-typing-dot { animation:none !important; } }
  `}</style>;
}
