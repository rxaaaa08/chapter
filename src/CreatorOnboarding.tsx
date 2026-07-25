// Creator self-serve onboarding — the /creator "Register as Creator" flow (Phase 3).
//
// Rendered by CreatorDashboard once the visitor is signed in with Google but has
// no affiliates row yet AND chose the new-creator path. Google sign-in already
// happened (it's step 0, owned by CreatorDashboard), so `email` here is the
// verified login — we never ask them to type it.
//
// Steps: welcome video → demo levels → comprehension quiz (all 5 correct to
// proceed) → details (handle + name + UPI + phone) → creator-signup. The
// levels are pure client state and never touch the backend. The quiz is gated
// client-side for UX, but the edge function re-checks every answer server-side,
// so this is not a security boundary — just the funnel. Handle availability is
// NOT shown live; if the chosen handle is taken, the server says so at submit.
//
// Layout fills the MobileShell frame (height:100%), so the welcome step centers
// and doesn't scroll, and the later steps scroll within the frame without a gap.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from './supabase';
import { CreatorTermsContent } from './CreatorTermsContent';
import {
  DemoExitProvider,
  DemoL1,
  DemoL2,
  DemoL3,
  DemoL4,
  DemoL5,
} from './CreatorOnboardingDemos';

const INK = '#111';
const MUTED = '#9a9aa2';
const HAIR = '#ececed';
const RED = '#dc2626';

// The creator welcome video (Vimeo id from vimeo.com/1212874247).
const PLACEHOLDER_VIMEO_ID = '1212874247';

// Correct answer token per question, in order. MUST stay identical to
// QUIZ_ANSWER_KEY in supabase/functions/creator-signup — the server re-checks
// against the same tokens. Options are shuffled for display; the token travels
// with the option, so order on screen doesn't matter.
const CORRECT = ['pay_through_link', 'eight_percent', 'monthly', 'creator_dashboard', 'experiences_page'];

type Option = { key: string; label: string };
type Question = { q: string; options: Option[] };

const QUIZ: Question[] = [
  {
    q: 'When do you actually earn a commission?',
    options: [
      { key: 'pay_through_link', label: 'When someone books a ticket through my link' },
      { key: 'on_click', label: 'As soon as someone clicks my link' },
      { key: 'on_follow', label: 'When someone follows me on Instagram' },
      { key: 'on_share', label: 'Whenever I share my link somewhere' },
    ],
  },
  {
    q: 'How much do you earn per booking?',
    options: [
      { key: 'eight_percent', label: 'Upto 8% of the full ticket price' },
      { key: 'flat_500', label: 'A flat ₹500' },
      { key: 'half', label: 'Half the ticket price' },
      { key: 'by_followers', label: 'It depends on my follower count' },
    ],
  },
  {
    q: 'When do creators get paid?',
    options: [
      { key: 'monthly', label: 'Monthly' },
      { key: 'instant', label: 'Instantly after each booking' },
      { key: 'yearly', label: 'Once a year' },
      { key: 'on_request', label: 'Only when I request it' },
    ],
  },
  {
    q: 'How will you check your creator dashboard?',
    options: [
      { key: 'creator_dashboard', label: 'Visit chaptera.in/creator' },
      { key: 'instagram_message', label: 'Message us on Instagram' },
      { key: 'whatsapp_contact', label: 'Contact us on WhatsApp' },
      { key: 'website_home', label: 'Visit chaptera.in' },
    ],
  },
  {
    q: 'Where does your link send people?',
    options: [
      { key: 'experiences_page', label: 'To the chapter அ website, where people can check details and book' },
      { key: 'google_form', label: 'To a google form' },
      { key: 'my_insta', label: 'To my Instagram profile' },
      { key: 'payment', label: 'Straight to a payment page' },
    ],
  },
];

const QUIZ_HINTS = [
  { level: 1, text: 'Take another look at The BIG picture.' },
  { level: 2, text: 'Take another look at Your money math.' },
  { level: 4, text: 'Take another look at When does the money reach you?' },
  { level: 3, text: 'Take another look at Your dashboard.' },
  { level: 1, text: 'Take another look at The BIG picture.' },
];

// Fisher–Yates, returns a new array (never mutates the source options).
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Same normalisation the edge function + admin panel + DB CHECK apply.
const normalizeHandle = (v: string) => v.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 40);
const HANDLE_RE = /^[a-z0-9._]{1,40}$/;
const UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
// Same rule as the invite-only application form: 10 digits, starts 6–9.
const PHONE_RE = /^[6-9]\d{9}$/;

const PROGRESS_KEY = 'creatorOnboardingProgressV3';
const LEVELS = [
  { id: 1, title: 'The BIG picture' },
  { id: 2, title: 'Your money math' },
  { id: 3, title: 'Your dashboard' },
  { id: 4, title: 'When does the money reach you?' },
  { id: 5, title: 'Important Rules & Advice' },
] as const;

type CreatorFaq = {
  id: string;
  question: string;
  answer: React.ReactNode;
};

const CREATOR_FAQS: CreatorFaq[] = [
  {
    id: 'footage',
    question: 'Where can I access clips & footages of events required for my editing?',
    answer: 'You real dashboard will give your our drive link.',
  },
  {
    id: 'approval',
    question: 'How can I submit my video for approval?',
    answer: "You'll be able to join our creator's WhatsApp groupchat from your dashboard. You can submit your videos to us there.",
  },
  {
    id: 'post-link',
    question: 'Where can I post my link?',
    answer: 'You can use your link anywhere on Instagram. On your bio, through automations or on your stories & so on!',
  },
  {
    id: 'paid',
    question: 'When will I get paid?',
    answer: 'Creator earnings are settled monthly. Everything you earn during the month is added together and paid at the end of that month.',
  },
  {
    id: 'post',
    question: 'How do I know what to post about?',
    answer: 'Your dashboard lists our upcoming events and their details. Use those details to make clear, exciting content that helps your followers understand the experience before they book.',
  },
  {
    id: 'official-account',
    question: 'Can my edits be posted on chapter அ’s Instagram?',
    answer: 'Yes. If you are a video editor and do not post on your own account, you can share your edits with us. We can post them on chapter அ’s official Instagram account and attach your custom link.',
  },
  {
    id: 'other-doubts',
    question: 'I have other doubts',
    answer: (
      <>
        We&apos;re here to help! To get more clairity, feel free to{' '}
        <a
          href="https://wa.me/919940111564"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}
        >
          Contact Us
        </a>
      </>
    ),
  },
];

type OnboardingStep = 'video' | 'levels' | 'quiz' | 'details';
type StoredProgress = { completed: number[]; demoHandle: string };

const readStoredProgress = (): StoredProgress => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { completed: [], demoHandle: '' };
    const parsed = JSON.parse(raw);
    const completed = Array.isArray(parsed?.completed)
      ? parsed.completed.filter((n: unknown) => Number.isInteger(n) && Number(n) >= 1 && Number(n) <= LEVELS.length)
      : [];
    return { completed, demoHandle: typeof parsed?.demoHandle === 'string' ? parsed.demoHandle : '' };
  } catch {
    return { completed: [], demoHandle: '' }; // private mode / malformed data
  }
};

type Props = { email: string; onComplete: () => void };

export default function CreatorOnboarding({ email, onComplete }: Props) {
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<OnboardingStep>('video');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [initialProgress] = useState<StoredProgress>(readStoredProgress);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(() => new Set(initialProgress.completed));
  const [openLevel, setOpenLevel] = useState<number | null>(null);
  const [demoHandle, setDemoHandle] = useState(initialProgress.demoHandle.slice(0, 17));
  const [showFaqSheet, setShowFaqSheet] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>('earn');
  const [showTermsSheet, setShowTermsSheet] = useState(false);

  useEffect(() => {
    bodyScrollRef.current?.scrollTo({ top: 0 });
  }, [openLevel, step]);

  useEffect(() => {
    if (!showFaqSheet) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowFaqSheet(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showFaqSheet]);

  useEffect(() => {
    if (!showTermsSheet) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowTermsSheet(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showTermsSheet]);

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({
        completed: Array.from(completedLevels).sort((a: number, b: number) => a - b),
        demoHandle,
      }));
    } catch { /* private mode */ }
  }, [completedLevels, demoHandle]);

  // Keep the four onboarding screens in browser history so native/browser Back
  // behaves exactly like the in-app chevron instead of leaving the auth flow.
  useEffect(() => {
    const currentState = window.history.state ?? {};
    window.history.replaceState({ ...currentState, creatorOnboardingStep: 'video', creatorOnboardingLevel: null }, '', window.location.href);
    const onPopState = (event: PopStateEvent) => {
      const target = event.state?.creatorOnboardingStep;
      if (target === 'video' || target === 'levels' || target === 'quiz' || target === 'details') {
        if (target === 'video') setVideoLoaded(false);
        if (target === 'levels') {
          const historyLevel = Number(event.state?.creatorOnboardingLevel);
          setOpenLevel(Number.isInteger(historyLevel) && historyLevel >= 1 && historyLevel <= LEVELS.length ? historyLevel : null);
        } else {
          setOpenLevel(null);
        }
        setStep(target);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openStep = (target: 'levels' | 'quiz' | 'details') => {
    window.history.pushState({
      ...(window.history.state ?? {}),
      creatorOnboardingStep: target,
      creatorOnboardingLevel: null,
    }, '', window.location.href);
    if (target === 'levels') setOpenLevel(null);
    setStep(target);
  };

  const reopenLevelFromQuiz = (level: number) => {
    window.history.pushState({
      ...(window.history.state ?? {}),
      creatorOnboardingStep: 'levels',
      creatorOnboardingLevel: null,
    }, '', window.location.href);
    window.history.pushState({
      ...(window.history.state ?? {}),
      creatorOnboardingStep: 'levels',
      creatorOnboardingLevel: level,
    }, '', window.location.href);
    setOpenLevel(level);
    setStep('levels');
  };

  const openLevelFromMap = (level: number) => {
    const mapState = {
      ...(window.history.state ?? {}),
      creatorOnboardingStep: 'levels',
      creatorOnboardingLevel: null,
    };
    // Normalise the visible map entry before pushing the lesson. Without this,
    // an old level id can survive in history and Back reopens that stale level.
    window.history.replaceState(mapState, '', window.location.href);
    window.history.pushState({
      ...mapState,
      creatorOnboardingStep: 'levels',
      creatorOnboardingLevel: level,
    }, '', window.location.href);
    setOpenLevel(level);
  };

  const returnToLevelMap = () => {
    const historyLevel = Number(window.history.state?.creatorOnboardingLevel);
    if (window.history.state?.creatorOnboardingStep === 'levels' && historyLevel === openLevel) {
      window.history.back();
      return;
    }
    window.history.replaceState({
      ...(window.history.state ?? {}),
      creatorOnboardingStep: 'levels',
      creatorOnboardingLevel: null,
    }, '', window.location.href);
    setOpenLevel(null);
    setStep('levels');
  };

  const returnToPreviousStep = () => {
    const previous: OnboardingStep = step === 'details' ? 'quiz' : step === 'quiz' ? 'levels' : 'video';
    if (window.history.state?.creatorOnboardingStep === step) {
      window.history.back();
    } else {
      if (previous === 'video') setVideoLoaded(false);
      if (previous === 'levels') setOpenLevel(null);
      setStep(previous);
    }
  };

  const completeLevel = (level: number) => {
    setCompletedLevels(current => {
      if (current.has(level)) return current;
      const next = new Set(current);
      next.add(level);
      return next;
    });
  };

  const allLevelsComplete = LEVELS.every(level => completedLevels.has(level.id));
  const nextUnlockedLevel = LEVELS.find(level => (
    !completedLevels.has(level.id)
    && (level.id === 1 || completedLevels.has(level.id - 1))
  ))?.id;

  const renderLevelNode = (level: typeof LEVELS[number]) => {
    const completed = completedLevels.has(level.id);
    const unlocked = completed || level.id === 1 || completedLevels.has(level.id - 1);
    const next = level.id === nextUnlockedLevel;
    return (
      <button
        key={level.id}
        type="button"
        disabled={!unlocked}
        onClick={() => { if (unlocked) openLevelFromMap(level.id); }}
        aria-label={`Level ${level.id}: ${level.title}${completed ? ', completed' : unlocked ? ', unlocked' : ', locked'}`}
        style={{
          position: 'relative', zIndex: 1, width: '100%', display: 'flex', alignItems: 'center', gap: 13,
          padding: '9px 4px', border: 'none', background: 'transparent', textAlign: 'left',
          cursor: unlocked ? 'pointer' : 'default', fontFamily: 'inherit', color: unlocked ? INK : MUTED,
        }}
      >
        <span
          className={next ? 'creator-level-next' : undefined}
          style={{
            width: completed ? 34.2 : 48, height: completed ? 34.2 : 48, margin: completed ? 6.9 : 0, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
            border: '2px solid ' + (completed || next ? INK : HAIR),
            background: completed ? INK : '#fff', color: completed ? '#fff' : unlocked ? INK : MUTED,
            fontSize: completed ? 16.2 : 15, fontWeight: 800, boxSizing: 'border-box',
          }}
        >
          {completed ? '✓' : unlocked ? level.id : (
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden="true">
              <rect x="1" y="6" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.7" />
              <path d="M4 6V4a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          )}
        </span>
        <span style={{ fontSize: 14.5, lineHeight: 1.35, fontWeight: unlocked ? 750 : 650 }}>{level.title}</span>
      </button>
    );
  };

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError('');
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      try { sessionStorage.removeItem('creatorOnboardingIntent'); } catch { /* private mode */ }
    } catch {
      setSignOutError('Could not sign out. Please try again.');
      setSigningOut(false);
    }
  };

  // ── Quiz ──
  // Shuffle option order once (per mount), not on every keystroke.
  const shuffled = useMemo(() => QUIZ.map(q => ({ ...q, options: shuffle(q.options) })), []);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizError, setQuizError] = useState('');
  const allAnswered = QUIZ.every((_, i) => answers[i]);
  const wrongIdx = QUIZ.map((_, i) => i).filter(i => answers[i] && answers[i] !== CORRECT[i]);
  const firstWrongHint = wrongIdx.length > 0 ? QUIZ_HINTS[wrongIdx[0]] : null;

  const submitQuiz = () => {
    if (!allAnswered) { setQuizError('Please answer every question.'); return; }
    if (wrongIdx.length > 0) {
      setQuizError('Some answers aren’t right yet.');
      return;
    }
    setQuizError('');
    openStep('details');
  };

  // ── Details ──
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');
  const [handle, setHandle] = useState('');
  const [upi, setUpi] = useState('');
  const [phone, setPhone] = useState('');
  const [handleTaken, setHandleTaken] = useState(false); // set only when the server rejects at submit
  const [upiValidationRequested, setUpiValidationRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (step !== 'details') return;
    const suggestedHandle = normalizeHandle(demoHandle);
    if (!suggestedHandle) return;
    setHandle(current => current === '' ? suggestedHandle : current);
  }, [demoHandle, step]);

  const normHandle = normalizeHandle(handle);
  const handleValid = HANDLE_RE.test(normHandle);
  const upiValid = UPI_RE.test(upi.trim());
  const phoneValid = PHONE_RE.test(phone);
  const canSubmit = name.trim().length > 0 && gender !== '' && handleValid && upiValid && phoneValid && termsAccepted && !submitting;
  const canAttemptSubmit = name.trim().length > 0 && gender !== '' && handleValid && upi.trim().length > 0 && phoneValid && termsAccepted && !submitting;

  const submit = async () => {
    setUpiValidationRequested(true);
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError('');
    setHandleTaken(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setSubmitError('Your sign-in expired. Please refresh and sign in again.'); setSubmitting(false); return; }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/creator-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          gender,
          handle: normHandle,
          upi_id: upi.trim(),
          phone,
          quiz_answers: QUIZ.map((_, i) => answers[i]),
        }),
      });
      const data = await res.json().catch(() => ({}));
      const finishOnboarding = () => {
        try { localStorage.removeItem(PROGRESS_KEY); } catch { /* private mode */ }
        onComplete();
      };
      if (res.ok && data?.ok) { finishOnboarding(); return; }
      if (data?.already_creator) { finishOnboarding(); return; } // row exists → dashboard will find it
      // Handle taken is the one thing we surface inline under the field.
      if (data?.handle_taken) { setHandleTaken(true); setSubmitError('That handle is taken — please pick another.'); }
      else if (data?.quiz_failed) { setSubmitError('Please re-check the quiz answers.'); returnToPreviousStep(); }
      else setSubmitError(data?.error || 'Something went wrong. Please try again.');
    } catch {
      setSubmitError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Styles ──
  const input: React.CSSProperties = { width: '100%', padding: '12px 13px', borderRadius: 12, border: '1.5px solid ' + HAIR, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const primaryBtn = (enabled: boolean): React.CSSProperties => ({ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: enabled ? '#FFD700' : '#d7d7db', color: enabled ? INK : '#fff', fontSize: 15, fontWeight: 700, cursor: enabled ? 'pointer' : 'default' });
  const secondaryBtn: React.CSSProperties = { width: '100%', padding: '12px 0', borderRadius: 14, border: '1.5px solid ' + HAIR, background: '#f6f6f7', color: '#000', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
  const stepDot = (active: boolean): React.CSSProperties => ({ height: 6, borderRadius: 999, flex: 1, background: active ? INK : HAIR });
  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: MUTED };
  const levelMapSubtitle: React.CSSProperties = { color: MUTED, fontSize: 10.5, lineHeight: 1.5, fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase', marginTop: 4 };

  const onLevelMap = step === 'levels' && openLevel === null;
  const scrollable = step !== 'video' && !onLevelMap; // welcome + lesson map are fixed / unscrollable
  const insideLevel = step === 'levels' && openLevel !== null;

  return (
    <div id="creator-onboarding-root" style={{ position: 'relative', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', color: INK, WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @keyframes creatorCtaShimmer {
          0% { transform: skewX(-12deg) translateX(-100%); }
          24.25%, 100% { transform: skewX(-12deg) translateX(300%); }
        }
        .creator-cta-shimmer { position: relative; overflow: hidden; }
        .creator-cta-shimmer::before {
          content: ''; position: absolute; inset: 0; width: 50%; pointer-events: none;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%);
          animation: creatorCtaShimmer 3.3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .creator-cta-shimmer::before { animation: none; display: none; }
        }
      `}</style>

      {/* Global progress belongs to the four major onboarding screens, not lessons. */}
      {!insideLevel && (
        <div style={{ padding: '16px 18px 0', flexShrink: 0 }}>
          <div style={{ maxWidth: 460, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => step === 'video' ? signOut() : returnToPreviousStep()}
              aria-label={step === 'video' ? 'Sign out and go back' : step === 'details' ? 'Back to quiz' : step === 'quiz' ? 'Back to levels' : 'Back to video'}
              disabled={step === 'video' && signingOut}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, border: 'none', background: 'none', cursor: step === 'video' && signingOut ? 'default' : 'pointer', marginLeft: -8, flexShrink: 0, opacity: step === 'video' && signingOut ? 0.6 : 1 }}
            >
              <span style={{ display: 'block', width: 11, height: 11, borderLeft: '2.2px solid ' + INK, borderBottom: '2.2px solid ' + INK, transform: 'rotate(45deg)' }} />
            </button>
            <div style={{ flex: 1, display: 'flex', gap: 6 }}>
              <div style={stepDot(true)} />
              <div style={stepDot(step === 'levels' || step === 'quiz' || step === 'details')} />
              <div style={stepDot(step === 'quiz' || step === 'details')} />
              <div style={stepDot(step === 'details')} />
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div ref={bodyScrollRef} style={{ flex: 1, minHeight: 0, overflowY: scrollable ? 'auto' : 'hidden', display: 'flex', flexDirection: 'column', justifyContent: step === 'video' ? 'center' : 'flex-start' }}>
        <div style={{ maxWidth: 460, width: '100%', height: onLevelMap ? '100%' : undefined, margin: '0 auto', boxSizing: 'border-box', padding: onLevelMap ? '18px 18px' : '18px 18px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ── Step 1: video (centered, unscrollable) ── */}
          {step === 'video' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.15 }}>Welcome — let's get you set up</div>
                <div style={{ color: MUTED, fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>
                  Watch the video to understand how the creator partnership works and how you earn.
                </div>
                {signOutError && <div style={{ color: RED, fontSize: 12.5, marginTop: 8 }}>{signOutError}</div>}
              </div>
              {/* 9:16 vertical reel — same embed + edge-bleed trick as the /plans
                  video carousel modal (portrait player, no chrome). Height-capped
                  so the welcome step stays centered and unscrollable. */}
              <div style={{ position: 'relative', height: 'min(56vh, 460px)', aspectRatio: '9 / 16', maxWidth: '100%', borderRadius: 24, overflow: 'hidden', background: '#000', border: '1.5px solid ' + HAIR }}>
                {!videoLoaded && (
                  <div role="status" aria-label="Loading video" style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'grid', placeItems: 'center', background: '#000' }}>
                    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
                      <circle cx="16" cy="16" r="13" fill="none" stroke="#3f3f46" strokeWidth="3" />
                      <path d="M16 3a13 13 0 0 1 13 13" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="0.8s" repeatCount="indefinite" />
                      </path>
                    </svg>
                  </div>
                )}
                <iframe
                  src={`https://player.vimeo.com/video/${PLACEHOLDER_VIMEO_ID}?autoplay=0&muted=0&badge=0&byline=0&title=0&portrait=0&api=1`}
                  title="Creator welcome video"
                  style={{ position: 'absolute', inset: -2, width: 'calc(100% + 4px)', height: 'calc(100% + 4px)', border: 0, clipPath: 'inset(0 round 22px)' }}
                  onLoad={() => setVideoLoaded(true)}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <button className="creator-cta-shimmer" onClick={() => openStep('levels')} style={primaryBtn(true)}>I've watched it — continue</button>
            </div>
          )}

          {/* ── Step 2: demo lesson map + interactive level bodies ── */}
          {step === 'levels' && openLevel === null && (
            <>
              <style>{`
                @keyframes creatorLevelPulse {
                  0%, 100% { box-shadow: 0 0 0 0 rgba(17, 17, 17, 0.18); transform: scale(1); }
                  50% { box-shadow: 0 0 0 9px rgba(17, 17, 17, 0); transform: scale(1.04); }
                }
                .creator-level-next { animation: creatorLevelPulse 1.8s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce) { .creator-level-next { animation: none; } }
              `}</style>

              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 14 }}>
                <div>
                  <div style={{ color: '#2B2B2B', fontSize: 12.43, fontWeight: 800, letterSpacing: 0.45, textTransform: 'uppercase' }}>Act 1 · Be your follower</div>
                  <div style={levelMapSubtitle}>See what your audience experiences</div>
                </div>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div aria-hidden="true" style={{ position: 'absolute', left: 27, top: 24, bottom: 24, width: 2, background: HAIR }} />
                  {LEVELS.slice(0, 1).map(renderLevelNode)}
                </div>

                <div style={{ marginTop: 4 }}>
                  <div style={{ color: '#2B2B2B', fontSize: 12.43, fontWeight: 800, letterSpacing: 0.45, textTransform: 'uppercase' }}>Act 2 · Be the creator</div>
                  <div style={levelMapSubtitle}>Your money, your dashboard &amp; our rules</div>
                </div>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div aria-hidden="true" style={{ position: 'absolute', left: 27, top: 24, bottom: 24, width: 2, background: HAIR }} />
                  {LEVELS.slice(1).map(renderLevelNode)}
                </div>
              </div>

              <div style={{ marginTop: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => { if (allLevelsComplete) openStep('quiz'); }}
                  disabled={!allLevelsComplete}
                  className={allLevelsComplete ? 'creator-cta-shimmer' : undefined}
                  style={{ ...primaryBtn(allLevelsComplete), flexShrink: 0 }}
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => setShowFaqSheet(true)}
                  style={{ ...secondaryBtn, flexShrink: 0 }}
                >
                  I Have a Doubt
                </button>
              </div>
            </>
          )}

          {step === 'levels' && openLevel !== null && (
            <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 22 }}>
              <button
                type="button"
                onClick={returnToLevelMap}
                aria-label="Go back to Lesson Map"
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', color: MUTED, fontSize: 13.5, fontWeight: 700, padding: '4px 0', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <span aria-hidden="true" style={{ display: 'block', width: 9, height: 9, borderLeft: '2px solid ' + MUTED, borderBottom: '2px solid ' + MUTED, transform: 'rotate(45deg)' }} />
                Lesson Map
              </button>
              <div>
                <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
                  {LEVELS.find(level => level.id === openLevel)?.title}
                </div>
              </div>
              <DemoExitProvider onExit={returnToLevelMap}>
                {openLevel === 1 && <DemoL1 demoHandle={demoHandle} setDemoHandle={setDemoHandle} onDone={() => completeLevel(1)} />}
                {openLevel === 2 && <DemoL2 demoHandle={demoHandle} onDone={() => completeLevel(2)} />}
                {openLevel === 3 && <DemoL3 demoHandle={demoHandle} onDone={() => completeLevel(3)} />}
                {openLevel === 4 && <DemoL4 demoHandle={demoHandle} onDone={() => completeLevel(4)} />}
                {openLevel === 5 && <DemoL5 demoHandle={demoHandle} onDone={() => completeLevel(5)} />}
              </DemoExitProvider>
            </div>
          )}

          {/* ── Step 3: quiz ── */}
          {step === 'quiz' && (
            <>
              <div>
                <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5 }}>Before you continue...</div>
                <div style={{ color: MUTED, fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>Answer everything correctly to go to the next step</div>
              </div>
              {shuffled.map((question, i) => (
                <div key={i}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, lineHeight: 1.35 }}>{i + 1}. {question.q}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {question.options.map(opt => {
                      const selected = answers[i] === opt.key;
                      const isWrongPick = selected && quizError !== '' && opt.key !== CORRECT[i];
                      return (
                        <button
                          key={opt.key}
                          onClick={() => { setAnswers(a => ({ ...a, [i]: opt.key })); setQuizError(''); }}
                          style={{
                            textAlign: 'left', padding: '12px 14px', borderRadius: 12, fontSize: 14, lineHeight: 1.4, cursor: 'pointer',
                            border: '1.5px solid ' + (isWrongPick ? RED : selected ? INK : HAIR),
                            background: selected ? (isWrongPick ? '#fef2f2' : '#f5f5f5') : '#fff',
                            color: INK, fontWeight: selected ? 700 : 500, fontFamily: 'inherit',
                          }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {quizError && allAnswered && firstWrongHint ? (
                <div style={{ border: '1.5px solid #fecaca', background: '#fef2f2', borderRadius: 12, padding: 13 }}>
                  <div style={{ color: RED, fontSize: 13, lineHeight: 1.5 }}>{firstWrongHint.text}</div>
                  <button
                    type="button"
                    onClick={() => reopenLevelFromQuiz(firstWrongHint.level)}
                    style={{ marginTop: 9, padding: 0, border: 'none', background: 'transparent', color: INK, fontSize: 12.5, fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Reopen this level
                  </button>
                </div>
              ) : quizError ? (
                <div style={{ color: RED, fontSize: 13, lineHeight: 1.5 }}>{quizError}</div>
              ) : null}
              <button className={allAnswered ? 'creator-cta-shimmer' : undefined} onClick={submitQuiz} style={primaryBtn(allAnswered)}>Continue</button>
              <button onClick={returnToPreviousStep} style={secondaryBtn}>Back to the demo</button>
            </>
          )}

          {/* ── Step 4: details ── */}
          {step === 'details' && (
            <>
              <div>
                <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5 }}>Your Details</div>
                <div style={{ color: MUTED, fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>
                  Signing up as <b style={{ color: INK }}>{email}</b> — this is the account you'll always log in with.
                </div>
              </div>

              <div>
                <label style={label}>Your name / brand</label>
                <input style={{ ...input, marginTop: 6 }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tamil Trekker" />
              </div>

              {/* Three fixed options rather than a text field, so the column stays
                  queryable instead of filling with free-text variants. */}
              <div>
                <label style={label}>Gender</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 6 }}>
                  {([['male', 'Male'], ['female', 'Female'], ['other', 'Other']] as const).map(([value, text]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setGender(value)}
                      aria-pressed={gender === value}
                      style={{
                        padding: '12px 0',
                        borderRadius: 12,
                        border: '1.5px solid ' + (gender === value ? INK : HAIR),
                        background: gender === value ? INK : '#fff',
                        color: gender === value ? '#fff' : INK,
                        fontSize: 14.5,
                        fontWeight: 700,
                        fontFamily: 'inherit',
                        cursor: 'pointer',
                      }}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={label}>Choose your handle</label>
                <div style={{ position: 'relative', marginTop: 6 }}>
                  <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: MUTED, fontSize: 15, fontWeight: 700 }}>@</span>
                  <input
                    style={{ ...input, paddingLeft: 28, borderColor: handleTaken ? RED : HAIR }}
                    value={handle}
                    onChange={e => {
                      setHandle(e.target.value);
                      if (handleTaken) {
                        setHandleTaken(false);
                        setSubmitError('');
                      }
                    }}
                    placeholder="traveller.tanya"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
                <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.4, color: handleTaken ? RED : MUTED }}>
                  {handleTaken
                    ? 'That handle is taken — please pick another.'
                    : <>Your link will be <b style={{ color: INK }}>chaptera.in/@{normHandle || 'yourhandle'}</b></>}
                </div>
              </div>

              <div>
                <label style={label}>Enter your UPI ID (so we can pay you)</label>
                <input style={{ ...input, marginTop: 6, borderColor: upiValidationRequested && !upiValid ? RED : HAIR }} value={upi} onChange={e => setUpi(e.target.value)} placeholder="yourname@bank" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
                {upiValidationRequested && !upiValid && <div style={{ fontSize: 12, color: RED, marginTop: 6 }}>That doesn't look like a UPI ID (e.g. name@okhdfc).</div>}
              </div>

              <div>
                <label style={label}>Phone number</label>
                <input
                  style={{ ...input, marginTop: 6, borderColor: phone && !phoneValid ? RED : HAIR }}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  type="tel"
                />
                {phone && !phoneValid && <div style={{ fontSize: 12, color: RED, marginTop: 6 }}>Enter a valid 10-digit mobile number.</div>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 2, userSelect: 'none' }}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={termsAccepted}
                  aria-label="Accept Creator Terms and Conditions"
                  onClick={() => setTermsAccepted(current => !current)}
                  style={{
                    width: 20,
                    height: 20,
                    padding: 0,
                    borderRadius: 6,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: termsAccepted ? '2px solid #f2f2f7' : '2px solid #9ca3af',
                    background: termsAccepted ? '#f2f2f7' : '#fff',
                    cursor: 'pointer',
                    transition: 'background 160ms ease, border-color 160ms ease',
                  }}
                >
                  {termsAccepted && (
                    <svg width="11" height="8" viewBox="0 0 11 8" fill="none" aria-hidden="true">
                      <path d="M1 4L4 7L10 1" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.4 }}>
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsSheet(true)}
                    style={{ padding: 0, border: 'none', background: 'transparent', color: '#111827', fontSize: 'inherit', fontWeight: 600, fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2, cursor: 'pointer' }}
                  >
                    Terms &amp; Conditions
                  </button>
                </span>
              </div>

              {submitError && !handleTaken && <div style={{ color: RED, fontSize: 13, lineHeight: 1.5 }}>{submitError}</div>}
              <button className={canAttemptSubmit ? 'creator-cta-shimmer' : undefined} onClick={submit} disabled={!canAttemptSubmit} style={primaryBtn(canAttemptSubmit)}>{submitting ? 'Creating your account…' : 'Create my creator account'}</button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showFaqSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              onClick={() => setShowFaqSheet(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="creator-faq-title"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 61, maxHeight: '88%', display: 'flex', flexDirection: 'column' }}
              onClick={event => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowFaqSheet(false)}
                aria-label="Close FAQs"
                style={{ position: 'absolute', right: 16, top: -40, width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>

                <div style={{ minHeight: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '32px 32px 0 0', overflow: 'hidden', boxShadow: '0 -16px 40px rgba(0,0,0,0.16)' }}>
                  <div style={{ flexShrink: 0, padding: '24px 24px 18px', borderBottom: '1px solid #f1f1f2' }}>
                  <div id="creator-faq-title" style={{ fontSize: 21, fontWeight: 850, letterSpacing: -0.45, lineHeight: 1.2 }}>What&apos;s the matter? 🤠</div>
                  </div>

                <div style={{ minHeight: 0, overflowY: 'auto', padding: '0 24px max(28px, env(safe-area-inset-bottom))' }}>
                  <div style={{ borderBottom: '1px solid #e4e4e7' }}>
                    {CREATOR_FAQS.map(faq => {
                      const expanded = openFaq === faq.id;
                      const contentId = `creator-faq-${faq.id}`;
                      return (
                        <div key={faq.id} style={{ borderTop: '1px solid #e4e4e7' }}>
                          <button
                            type="button"
                            aria-expanded={expanded}
                            aria-controls={contentId}
                            onClick={() => setOpenFaq(current => current === faq.id ? null : faq.id)}
                            style={{ width: '100%', minHeight: 58, padding: '16px 0', border: 'none', background: 'transparent', color: INK, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            <span style={{ fontSize: 14.5, lineHeight: 1.4, fontWeight: 750 }}>{faq.question}</span>
                            <span aria-hidden="true" style={{ width: 9, height: 9, flexShrink: 0, borderRight: '1.8px solid #71717a', borderBottom: '1.8px solid #71717a', transform: expanded ? 'rotate(225deg)' : 'rotate(45deg)', transition: 'transform 180ms ease', marginTop: expanded ? 5 : -4, marginRight: 3 }} />
                          </button>
                          <AnimatePresence initial={false}>
                            {expanded && (
                              <motion.div
                                id={contentId}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{ padding: '0 28px 18px 0', color: '#57534e', fontSize: 13.5, lineHeight: 1.6 }}>
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTermsSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, zIndex: 75, background: '#000' }}
              onClick={() => setShowTermsSheet(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="creator-terms-title"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 80, maxHeight: '80%', display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '32px 32px 0 0', overflow: 'hidden', boxShadow: '0 -16px 40px rgba(0,0,0,0.16)' }}
              onClick={event => event.stopPropagation()}
            >
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f1f2', flexShrink: 0 }}>
                <div id="creator-terms-title" style={{ color: '#18181b', fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>Terms &amp; Conditions</div>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px' }}>
                <CreatorTermsContent />
              </div>
              <div style={{ padding: '12px 24px max(28px, env(safe-area-inset-bottom))', flexShrink: 0, background: '#fff' }}>
                <button
                  type="button"
                  onClick={() => { setTermsAccepted(true); setShowTermsSheet(false); }}
                  style={{ width: '100%', padding: '15px 0', borderRadius: 16, border: 'none', background: '#111', color: '#fff', fontSize: 16, fontWeight: 650, fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  I Agree
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
