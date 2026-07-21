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
import { supabase } from './supabase';
import {
  DemoExitProvider,
  DemoL1,
  DemoL2,
  DemoL3,
  DemoL4,
  DemoL5,
  DemoL6,
  DemoL7,
  DemoL8,
} from './CreatorOnboardingDemos';

const INK = '#111';
const MUTED = '#9a9aa2';
const HAIR = '#ececed';
const GREEN = '#16a34a';
const RED = '#dc2626';

// TODO(owner): replace with the real onboarding video id once recorded. This is a
// public Vimeo sample standing in so the flow is testable end-to-end meanwhile.
const PLACEHOLDER_VIMEO_ID = '76979871';

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
  { level: 2, text: 'Take another look at Watch a booking become your money.' },
  { level: 3, text: 'Take another look at Your money math.' },
  { level: 5, text: 'Take another look at When does the money reach you?' },
  { level: 4, text: 'Take another look at Your dashboard.' },
  { level: 1, text: 'Take another look at How a follower reaches your link.' },
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

const PROGRESS_KEY = 'creatorOnboardingProgress';
const LEVELS = [
  { id: 1, title: 'How a follower reaches your link' },
  { id: 2, title: 'Watch a booking become your money' },
  { id: 3, title: 'Your money math' },
  { id: 4, title: 'Your dashboard — a guided poke-around' },
  { id: 5, title: 'When does the money reach you?' },
  { id: 6, title: 'What should you actually post?' },
  { id: 7, title: 'Comments → auto-DM: the setup that books the most' },
  { id: 8, title: 'How we sound' },
] as const;

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
  const [demoHandle, setDemoHandle] = useState(initialProgress.demoHandle);

  useEffect(() => {
    bodyScrollRef.current?.scrollTo({ top: 0 });
  }, [openLevel, step]);

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
    window.history.replaceState({ ...currentState, creatorOnboardingStep: 'video' }, '', window.location.href);
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
    window.history.pushState({ ...(window.history.state ?? {}), creatorOnboardingStep: target }, '', window.location.href);
    if (target === 'levels') setOpenLevel(null);
    setStep(target);
  };

  const reopenLevelFromQuiz = (level: number) => {
    window.history.pushState({
      ...(window.history.state ?? {}),
      creatorOnboardingStep: 'levels',
      creatorOnboardingLevel: level,
      creatorOnboardingReturnTo: 'quiz',
    }, '', window.location.href);
    setOpenLevel(level);
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
  const completedLevelCount = LEVELS.filter(level => completedLevels.has(level.id)).length;
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
        onClick={() => { if (unlocked) setOpenLevel(level.id); }}
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
            width: 48, height: 48, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
            border: '2px solid ' + (completed || next ? INK : HAIR),
            background: completed ? INK : '#fff', color: completed ? '#fff' : unlocked ? INK : MUTED,
            fontSize: completed ? 20 : 15, fontWeight: 800, boxSizing: 'border-box',
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
  const [handle, setHandle] = useState('');
  const [upi, setUpi] = useState('');
  const [phone, setPhone] = useState('');
  const [handleTaken, setHandleTaken] = useState(false); // set only when the server rejects at submit
  const [upiValidationRequested, setUpiValidationRequested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

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
  const canSubmit = name.trim().length > 0 && handleValid && upiValid && phoneValid && !submitting;
  const canAttemptSubmit = name.trim().length > 0 && handleValid && upi.trim().length > 0 && phoneValid && !submitting;

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
  const primaryBtn = (enabled: boolean): React.CSSProperties => ({ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: enabled ? INK : '#d7d7db', color: '#fff', fontSize: 15, fontWeight: 700, cursor: enabled ? 'pointer' : 'default' });
  const secondaryBtn: React.CSSProperties = { width: '100%', padding: '12px 0', borderRadius: 14, border: '1.5px solid ' + HAIR, background: '#fff', color: INK, fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
  const stepDot = (active: boolean): React.CSSProperties => ({ height: 6, borderRadius: 999, flex: 1, background: active ? INK : HAIR });
  const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: MUTED };

  const scrollable = step !== 'video'; // welcome step is fixed / unscrollable
  const levelOpenedFromQuiz = step === 'levels'
    && openLevel !== null
    && window.history.state?.creatorOnboardingStep === 'levels'
    && window.history.state?.creatorOnboardingReturnTo === 'quiz';

  return (
    <div id="creator-onboarding-root" style={{ position: 'relative', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', color: INK, WebkitFontSmoothing: 'antialiased' }}>

      {/* Header: optional back chevron + step progress */}
      <div style={{ padding: '16px 18px 0', flexShrink: 0 }}>
        <div style={{ maxWidth: 460, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => step === 'video' ? signOut() : returnToPreviousStep()}
            aria-label={step === 'video' ? 'Sign out and go back' : step === 'details' ? 'Back to quiz' : step === 'quiz' ? 'Back to levels' : levelOpenedFromQuiz ? 'Back to quiz' : 'Back to video'}
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

      {/* Body */}
      <div ref={bodyScrollRef} style={{ flex: 1, minHeight: 0, overflowY: scrollable ? 'auto' : 'hidden', display: 'flex', flexDirection: 'column', justifyContent: step === 'video' ? 'center' : 'flex-start' }}>
        <div style={{ maxWidth: 460, width: '100%', margin: '0 auto', boxSizing: 'border-box', padding: '18px 18px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>

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
              <button onClick={() => openStep('levels')} style={primaryBtn(true)}>I've watched it — continue</button>
            </div>
          )}

          {/* ── Step 2: demo-level map + interactive level bodies ── */}
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

              <div>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.45, textTransform: 'uppercase' }}>Act 1 · Be your follower</div>
                <div style={{ color: MUTED, fontSize: 13, marginTop: 4, lineHeight: 1.45 }}>see exactly what your audience experiences.</div>
              </div>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div aria-hidden="true" style={{ position: 'absolute', left: 27, top: 24, bottom: 24, width: 2, background: HAIR }} />
                {LEVELS.slice(0, 2).map(renderLevelNode)}
              </div>

              <div style={{ marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.45, textTransform: 'uppercase' }}>Act 2 · Be the creator</div>
                <div style={{ color: MUTED, fontSize: 13, marginTop: 4, lineHeight: 1.45 }}>your money, your dashboard, your playbook.</div>
              </div>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div aria-hidden="true" style={{ position: 'absolute', left: 27, top: 24, bottom: 24, width: 2, background: HAIR }} />
                {LEVELS.slice(2).map(renderLevelNode)}
              </div>

              <div aria-live="polite" style={{ color: allLevelsComplete ? GREEN : MUTED, fontSize: 12.5, lineHeight: 1.4, fontWeight: 800, textAlign: 'center' }}>
                {completedLevelCount} of {LEVELS.length} done
              </div>
              <button
                type="button"
                className={allLevelsComplete ? 'creator-level-next' : undefined}
                onClick={() => { if (allLevelsComplete) openStep('quiz'); }}
                disabled={!allLevelsComplete}
                style={primaryBtn(allLevelsComplete)}
              >
                Continue to the quiz
              </button>
            </>
          )}

          {step === 'levels' && openLevel !== null && (
            <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 22 }}>
              <button
                type="button"
                onClick={() => levelOpenedFromQuiz ? window.history.back() : setOpenLevel(null)}
                aria-label={levelOpenedFromQuiz ? 'Back to quiz' : 'Back to level map'}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', color: INK, fontSize: 13.5, fontWeight: 750, padding: '4px 0', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <span aria-hidden="true" style={{ display: 'block', width: 9, height: 9, borderLeft: '2px solid ' + INK, borderBottom: '2px solid ' + INK, transform: 'rotate(45deg)' }} />
                {levelOpenedFromQuiz ? 'Back to quiz' : 'Level map'}
              </button>
              <div>
                <div style={{ color: MUTED, fontSize: 12, fontWeight: 800, letterSpacing: 0.45, textTransform: 'uppercase' }}>Level {openLevel} of {LEVELS.length}</div>
                <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2, marginTop: 7 }}>
                  {LEVELS.find(level => level.id === openLevel)?.title}
                </div>
              </div>
              <DemoExitProvider onExit={() => setOpenLevel(null)}>
                {openLevel === 1 && <DemoL1 demoHandle={demoHandle} setDemoHandle={setDemoHandle} onDone={() => completeLevel(1)} />}
                {openLevel === 2 && <DemoL2 demoHandle={demoHandle} onDone={() => completeLevel(2)} />}
                {openLevel === 3 && <DemoL3 demoHandle={demoHandle} onDone={() => completeLevel(3)} />}
                {openLevel === 4 && <DemoL4 demoHandle={demoHandle} onDone={() => completeLevel(4)} />}
                {openLevel === 5 && <DemoL5 demoHandle={demoHandle} onDone={() => completeLevel(5)} />}
                {openLevel === 6 && <DemoL6 demoHandle={demoHandle} onDone={() => completeLevel(6)} />}
                {openLevel === 7 && <DemoL7 demoHandle={demoHandle} onDone={() => completeLevel(7)} />}
                {openLevel === 8 && <DemoL8 demoHandle={demoHandle} onDone={() => completeLevel(8)} />}
              </DemoExitProvider>
            </div>
          )}

          {/* ── Step 3: quiz ── */}
          {step === 'quiz' && (
            <>
              <div>
                <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5 }}>Quick check — 5 questions.</div>
                <div style={{ color: MUTED, fontSize: 14, marginTop: 8, lineHeight: 1.55 }}>Everything here is something you just played through. All five right to continue.</div>
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
              <button onClick={submitQuiz} style={primaryBtn(allAnswered)}>Continue</button>
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
                <input style={{ ...input, marginTop: 6 }} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tanya Travels" />
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
                <div style={{ fontSize: 12, color: MUTED, marginTop: 6, lineHeight: 1.4 }}>Remember the payout step from the demo? This is where your monthly earnings land.</div>
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

              {submitError && !handleTaken && <div style={{ color: RED, fontSize: 13, lineHeight: 1.5 }}>{submitError}</div>}
              <button onClick={submit} disabled={!canAttemptSubmit} style={primaryBtn(canAttemptSubmit)}>{submitting ? 'Creating your account…' : 'Create my creator account'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
