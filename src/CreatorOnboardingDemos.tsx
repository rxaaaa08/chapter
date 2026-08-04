import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Globe, IndianRupee, MessageSquare } from 'lucide-react';
import { InvitePlanDetailsSheet, type InvitePlanDetails } from './InvitePlanDetailsSheet';

// The final-lesson / brand-voice rules video (Vimeo id from vimeo.com/1212875214).
const L7_VIMEO_ID = '1212875214';

const INK = '#111';
const MUTED = '#9a9aa2';
const HAIR = '#ececed';
const GREEN = '#16a34a';
const GOLD = '#eab308';
const GOLD_TINT = '#fffbeb';

const DEMO_HANDLE_FALLBACK = 'yourhandle';
// Demo handles are intentionally shorter than final creator handles so the
// personalised walkthrough copy remains compact on mobile.
const normalizeDemoHandle = (v: string) =>
  v.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 17);

const PONDY_EVENT = { title: 'Pondy Beach Houseparty', price: 3700, pct: 7, cut: 259 };
const CHILL_EVENT = { title: 'Chill Sunday Meetup', price: 359, pct: 8, cut: 29 }; // rounded
const SUNRISE_EVENT = { title: 'Sunrise at Kovalam', price: 699, pct: 5, cut: 35 }; // rounded
const PRIMARY_EVENT = PONDY_EVENT; // alias kept — DemoL1/L2 reference the hero event
const DEMO_EVENTS = [PONDY_EVENT, CHILL_EVENT, SUNRISE_EVENT];

// A demo "conversion" = so many tickets of an event, each worth its own cut.
type EventLine = { event: typeof PONDY_EVENT; tickets: number };
const lineEarned = (lines: EventLine[]) => lines.reduce((sum, l) => sum + l.event.cut * l.tickets, 0);
const linePaid = (lines: EventLine[]) => lines.reduce((sum, l) => sum + l.tickets, 0);

// ONE demo month = the single source of truth for every rupee in levels 3 & 4.
// Mixed events on purpose, so "up to 8%" and the payout bill both read true.
const DEMO_MONTH_LINES: EventLine[] = [
  { event: PONDY_EVENT, tickets: 4 },    // 4 × ₹259 = ₹1,036
  { event: SUNRISE_EVENT, tickets: 8 },  // 8 × ₹35  = ₹280
  { event: CHILL_EVENT, tickets: 30 },   // 30 × ₹29 = ₹870
];
const DEMO_MONTH_EARNED = lineEarned(DEMO_MONTH_LINES); // ₹2,186
const DEMO_MONTH_PAID = linePaid(DEMO_MONTH_LINES);     // 42 tickets

const DEMO_DATES = ['Aug 28', 'Aug 2', 'Aug 16'];
type DemoRange = 'week' | 'month';
const DEMO_RANGES: Array<{ key: DemoRange; label: string }> = [
  { key: 'week', label: 'Last week' },
  { key: 'month', label: 'Last month' },
];
// Clicks/sign-ups per range are the top of the funnel; paid + earned + the
// itemised conversions all derive from the ticket lines, so nothing drifts.
const DEMO_RANGE_CLICKS: Record<DemoRange, { clicks: number; signups: number }> = {
  week: { clicks: 32, signups: 4 },
  month: { clicks: 120, signups: 80 },
};
const DEMO_RANGE_LINES: Record<DemoRange, EventLine[]> = {
  week: [{ event: PONDY_EVENT, tickets: 1 }],
  month: DEMO_MONTH_LINES,
};

type DemoProps = { demoHandle: string; onDone: () => void };
type DemoL1Props = DemoProps & { setDemoHandle: (value: string) => void };

const DemoExitContext = createContext<() => void>(() => {});

export function DemoExitProvider({ onExit, children }: { onExit: () => void; children: React.ReactNode }) {
  return (
    <DemoExitContext.Provider value={onExit}>
      <style>{`
        @keyframes creatorDemoPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.42); transform: scale(1); }
          50% { box-shadow: 0 0 0 9px rgba(234, 179, 8, 0); transform: scale(1.015); }
        }
        @keyframes creatorDemoCalmPulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(234, 179, 8, 0.2); }
          50% { box-shadow: 0 0 0 7px rgba(234, 179, 8, 0); }
        }
        @keyframes creatorDemoInsetBorderGlow {
          0%, 100% { box-shadow: inset 0 0 0 2px ${GOLD}, 0 0 0 0 rgba(234, 179, 8, 0.32); }
          50% { box-shadow: inset 0 0 0 2px ${GOLD}, 0 0 0 7px rgba(234, 179, 8, 0); }
        }
        @keyframes creatorFunnelNumberRoll {
          0% { opacity: 0.58; transform: translateY(6px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .creator-demo-pulse { animation: creatorDemoPulse 1.8s ease-in-out infinite; }
        .creator-demo-calm-pulse { animation: creatorDemoCalmPulse 1.8s ease-in-out infinite; }
        .creator-demo-inset-border-glow { animation: creatorDemoInsetBorderGlow 1.8s ease-in-out infinite; }
        .creator-funnel-number-roll { animation: creatorFunnelNumberRoll 600ms cubic-bezier(0.22, 1, 0.36, 1); transform-origin: center; }
        .creator-money-slider {
          appearance: none; -webkit-appearance: none; height: 4px; border-radius: 999px; outline: none;
        }
        .creator-money-slider::-webkit-slider-thumb {
          appearance: none; -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
          border: 3px solid #FFD700; background: #f3f4f6; box-shadow: 0 2px 7px rgba(17, 17, 17, 0.18);
        }
        .creator-money-slider::-moz-range-thumb {
          width: 11px; height: 11px; border-radius: 50%; border: 3px solid #FFD700;
          background: #f3f4f6; box-shadow: 0 2px 7px rgba(17, 17, 17, 0.18);
        }
        .creator-guide-target { position: relative; z-index: 3; opacity: 1; filter: none; }
        .creator-guide-dim { opacity: 0.5; transition: opacity 180ms ease; }
        .creator-guide-why {
          position: absolute; top: 4px; z-index: 5; width: max-content; max-width: 270px;
          padding: 7px 9px; border-radius: 9px; background: ${INK}; color: #fff;
          box-shadow: 0 8px 22px rgba(17, 17, 17, 0.18);
          font-size: 11.5px; font-weight: 750; line-height: 1.35; pointer-events: none;
        }
        .creator-guide-why::after {
          content: ''; position: absolute; bottom: -5px; width: 10px; height: 10px;
          background: ${INK}; transform: rotate(45deg); border-radius: 1px;
        }
        .creator-guide-why-left { left: 8px; }
        .creator-guide-why-left::after { left: 18px; }
        .creator-guide-why-right { right: 8px; }
        .creator-guide-why-right::after { right: 18px; }
        .creator-guide-why-center-right { left: 50%; transform: translateX(-50%); max-width: calc(100% - 16px); }
        .creator-guide-why-center-right::after { right: 18px; }
        .creator-guide-why-center { left: 50%; transform: translateX(-50%); max-width: calc(100% - 16px); }
        .creator-guide-why-center::after { left: 60%; margin-left: -5px; }
        .creator-guide-why-below { top: auto; bottom: 4px; }
        .creator-guide-why-below::after { top: -5px; bottom: auto; }
        .creator-guide-why-tile { left: 0; right: 0; width: auto; max-width: none; }
        .creator-guide-why-tile-first::after { left: calc(16.6667% - 5px); }
        .creator-guide-why-tile-second::after { left: calc(50% - 5px); }
        .creator-guide-why-tile-third::after { left: calc(83.3333% - 5px); }
        .creator-guide-why-flow { position: relative; top: auto; left: auto; right: auto; width: 100%; max-width: none; margin-bottom: 12px; flex: none; }
        .creator-guide-why-actionable { display: flex; align-items: center; gap: 10px; pointer-events: auto; }
        .creator-guide-next {
          flex: 0 0 auto; border: none; border-radius: 999px; padding: 5px 9px;
          background: #fff; color: ${INK}; font: inherit; font-size: 10.5px;
          font-weight: 850; line-height: 1; cursor: pointer;
        }
        .creator-guide-next:active { transform: scale(0.96); }
        @media (prefers-reduced-motion: reduce) {
          .creator-demo-pulse, .creator-demo-calm-pulse, .creator-demo-inset-border-glow { animation: none; outline: 2px solid ${GOLD}; outline-offset: 3px; }
          .creator-funnel-number-roll { animation: none; }
          .creator-guide-dim { transition: none; }
        }
      `}</style>
      {children}
    </DemoExitContext.Provider>
  );
}

const useDemoExit = () => useContext(DemoExitContext);

const useCompleteWhen = (complete: boolean, onDone: () => void) => {
  const fired = useRef(false);
  useEffect(() => {
    if (!complete || fired.current) return;
    fired.current = true;
    onDone();
  }, [complete, onDone]);
};

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const handleFor = (demoHandle: string) => normalizeDemoHandle(demoHandle) || DEMO_HANDLE_FALLBACK;

const primaryBtn = (enabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
  background: enabled ? '#FFD700' : '#d7d7db', color: enabled ? INK : '#fff', fontSize: 15,
  fontWeight: 700, cursor: enabled ? 'pointer' : 'default', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
});

const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 18 };
const card: React.CSSProperties = { border: `1.5px solid ${HAIR}`, borderRadius: 18, background: '#fff' };
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: MUTED, letterSpacing: 0.45, textTransform: 'uppercase' };
const paragraph: React.CSSProperties = { color: INK, fontSize: 14, lineHeight: 1.58, margin: 0 };
const helper: React.CSSProperties = { color: MUTED, fontSize: 12.5, lineHeight: 1.5 };

function ContinueButton({ enabled = true, label = 'I Understand', pendingLabel = 'Complete the activity to continue' }: { enabled?: boolean; label?: string; pendingLabel?: string }) {
  // No pulse on the full-width bottom CTA — the gold fill is signal enough.
  // Pulse + gold are reserved for guided tap targets inside a lesson.
  const exit = useDemoExit();
  return (
    <button type="button" className={enabled ? 'creator-cta-shimmer' : undefined} disabled={!enabled} onClick={() => { if (enabled) exit(); }} style={primaryBtn(enabled)}>
      {enabled ? label : pendingLabel}
    </button>
  );
}

const guideClass = (active: boolean, guideActive: boolean) => active ? 'creator-guide-target' : guideActive ? 'creator-guide-dim' : undefined;
const guideTopSpace = (active: boolean, text: string) => active
  ? text.length > 180 ? 118
    : text.length > 130 ? 98
      : text.length > 90 ? 82
        : text.length > 58 ? 72
          : text.length > 42 ? 58
            : 50
  : 0;

type GuideTileAnchor = 'first' | 'second' | 'third';

function GuideWhy({ text, align = 'left', placement = 'above', tileAnchor, flow = false, onNext, actionLabel = 'Next' }: { text: string; align?: 'left' | 'right' | 'center-right' | 'center'; placement?: 'above' | 'below'; tileAnchor?: GuideTileAnchor; flow?: boolean; onNext?: () => void; actionLabel?: string }) {
  const positionClass = tileAnchor ? `creator-guide-why-tile creator-guide-why-tile-${tileAnchor}` : `creator-guide-why-${align}`;
  return (
    <div role="note" className={`creator-guide-why ${positionClass}${placement === 'below' ? ' creator-guide-why-below' : ''}${flow ? ' creator-guide-why-flow' : ''}${onNext ? ' creator-guide-why-actionable' : ''}`}>
      <span>{text}</span>
      {onNext && <button type="button" className="creator-guide-next" onClick={onNext}>{actionLabel}</button>}
    </div>
  );
}

function RollingStatNumber({ value, delayMs }: { value: number; delayMs: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const displayValueRef = useRef(value);
  const [animationRun, setAnimationRun] = useState(0);

  useEffect(() => {
    const from = displayValueRef.current;
    if (from === value) return;

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      displayValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    let animationFrame = 0;
    const timeout = window.setTimeout(() => {
      const startedAt = window.performance.now();
      setAnimationRun(run => run + 1);

      const update = (now: number) => {
        const progress = Math.min((now - startedAt) / 600, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const nextValue = Math.round(from + (value - from) * eased);
        displayValueRef.current = nextValue;
        setDisplayValue(nextValue);

        if (progress < 1) animationFrame = window.requestAnimationFrame(update);
        else {
          displayValueRef.current = value;
          setDisplayValue(value);
        }
      };

      animationFrame = window.requestAnimationFrame(update);
    }, delayMs);

    return () => {
      window.clearTimeout(timeout);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [delayMs, value]);

  return (
    <div key={animationRun} className={animationRun > 0 ? 'creator-funnel-number-roll' : undefined} style={{ fontSize: 23, fontWeight: 900 }}>
      {displayValue}
    </div>
  );
}

// TODO(owner): set the real figure to show a proof line in the money-math lesson.
// Left null so nothing is shown until a true number exists — never invent this.
const TOP_CREATOR_LAST_MONTH: number | null = null;

function FollowerJourneyInfographic({ handle }: { handle: string }) {
  const steps: Array<{ mark: string; icon?: React.ReactNode; title: string; detail: string; tone: string; markColor: string }> = [
    { mark: 'JOIN', title: 'Priya comments “Join”', detail: 'On your Promotional Video', tone: GOLD_TINT, markColor: '#854d0e' },
    { mark: 'DM', icon: <MessageSquare size={22} strokeWidth={2.3} />, title: 'She receives your auto-DM', detail: `Sent by you @${handle}`, tone: '#f4f4f5', markColor: INK },
    { mark: 'WWW', icon: <Globe size={22} strokeWidth={2.3} />, title: `Priya opens chaptera.in/@${handle}`, detail: 'Checks details & continues booking', tone: '#eff6ff', markColor: '#1d4ed8' },
    { mark: '✓', icon: <IndianRupee size={24} strokeWidth={2.5} />, title: 'She books our Pondy Strangers Trip', detail: `Priya paid ${inr(PRIMARY_EVENT.price)}`, tone: '#f0fdf4', markColor: '#166534' },
    { mark: `+${inr(PRIMARY_EVENT.cut)}`, title: `You earn ${inr(PRIMARY_EVENT.cut)}`, detail: `${PRIMARY_EVENT.pct}% of ${inr(PRIMARY_EVENT.price)} is your commission`, tone: '#ecfdf3', markColor: '#166534' },
  ];

  return (
    <ol aria-label="How Priya's booking becomes your commission" style={{ ...card, listStyle: 'none', margin: 0, padding: '4px 14px', overflow: 'hidden', background: 'transparent', borderWidth: 1 }}>
      {steps.map((step, index) => (
        <li key={step.title} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '52px minmax(0, 1fr)', alignItems: 'center', gap: 12, minHeight: 67, padding: '7px 0' }}>
          {index > 0 && <span aria-hidden="true" style={{ position: 'absolute', top: 0, left: 64, right: 0, borderTop: `1px dashed ${HAIR}` }} />}
          {index < steps.length - 1 && <span aria-hidden="true" style={{ position: 'absolute', left: 25, top: 51, width: 2, height: 30, background: HAIR }} />}
          <div aria-hidden="true" style={{ position: 'relative', zIndex: 1, width: 48, height: 48, borderRadius: 14, display: 'grid', placeItems: 'center', border: `1px solid ${index === 0 ? '#fde68a' : HAIR}`, background: step.tone, color: step.markColor, fontSize: step.mark.length > 4 ? 10.5 : 11.5, fontWeight: 900, letterSpacing: step.mark === 'WWW' ? 0.2 : 0 }}>
            {step.icon ?? step.mark}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: INK, fontSize: 13.5, lineHeight: 1.25, fontWeight: 850 }}>
              {index === 2 ? (
                <>Priya opens <span style={{ color: '#2563eb', textDecoration: 'underline', textUnderlineOffset: 2 }}>chaptera.in/@{handle}</span></>
              ) : step.title}
            </div>
            <div style={{ ...helper, marginTop: 3, color: '#57534e' }}>{step.detail}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DemoL1({ demoHandle, setDemoHandle, onDone }: DemoL1Props) {
  const exit = useDemoExit();
  const handle = handleFor(demoHandle);
  const handleGuide = !demoHandle;
  const handleWhy = "Type your Insta ID & we'll use it in this demo.";

  const finish = () => {
    onDone();
    exit();
  };

  return (
    <div style={stack}>
      <div className={guideClass(handleGuide, handleGuide)} style={{ position: 'relative', paddingTop: guideTopSpace(handleGuide, handleWhy) }}>
        {handleGuide && <GuideWhy text={handleWhy} />}
        <div className={!demoHandle ? 'creator-demo-pulse' : undefined} style={{ position: 'relative', borderRadius: 12, boxShadow: !demoHandle ? `0 0 0 2px ${GOLD}` : 'none', background: !demoHandle ? GOLD_TINT : '#fff' }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: MUTED, fontWeight: 800 }}>@</span>
          <input
            aria-label="Demo creator handle"
            value={demoHandle}
            onChange={event => setDemoHandle(normalizeDemoHandle(event.target.value))}
            placeholder="yourhandle"
            maxLength={17}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            style={{ width: '100%', padding: '12px 13px 12px 29px', borderRadius: 12, border: `1px solid ${!demoHandle ? GOLD : HAIR}`, background: 'transparent', fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>
      </div>
      <div className={handleGuide ? 'creator-guide-dim' : undefined}><FollowerJourneyInfographic handle={handle} /></div>
          <div
            role="note"
            className={handleGuide ? 'creator-guide-dim' : undefined}
            style={{ border: '1px solid #fde68a', borderRadius: 12, background: '#fff', padding: '15px 14px', color: '#57534e', fontSize: 12.5, lineHeight: 1.5 }}
          >
            <div style={{ color: '#854d0e', fontSize: 10.5, lineHeight: 1.5, fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase', textAlign: 'center', marginBottom: 14 }}>
              <span style={{ whiteSpace: 'nowrap' }}>Note to Editors &amp; Creators</span>
              <br />
              <span style={{ whiteSpace: 'nowrap' }}>Without Auto-DM Setup</span>
            </div>
        <ol style={{ display: 'grid', gap: 14, margin: 0, paddingLeft: 18 }}>
          <li>
            <div style={{ color: '#3f3f46', fontSize: 13.5, lineHeight: 1.35, fontWeight: 600, marginBottom: 5 }}>Are you a video editor &amp; don't post in your own account?</div>
            <div>You can post your edits on chapter அ’s official Instagram account &amp; we’ll attach your custom links to your videos.</div>
          </li>
          <li>
            <div style={{ color: '#3f3f46', fontSize: 13.5, lineHeight: 1.35, fontWeight: 600, marginBottom: 5 }}>Are you a creator who doesn’t have auto-DM set up?</div>
            <div>You can put your custom link in your bio. Or we advice you to set up auto-DM using Superprofile Instagram Automation. It costs ₹499 per month &amp; it’s a 15-minute setup.</div>
          </li>
        </ol>
      </div>
      <div className={handleGuide ? 'creator-guide-dim' : undefined}><button type="button" className="creator-cta-shimmer" onClick={finish} style={primaryBtn(true)}>Continue to Next Lesson</button></div>
    </div>
  );
}

export function DemoL2({ onDone }: DemoProps) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [bookings, setBookings] = useState(3);
  const [sliderTouched, setSliderTouched] = useState(false);
  const commissionEvents = DEMO_EVENTS.slice(0, 2);
  const firstUnflipped = commissionEvents.findIndex((_, index) => !flipped.has(index));
  const cardsComplete = flipped.size === commissionEvents.length;
  const sliderGuideActive = cardsComplete && !sliderTouched;
  const complete = cardsComplete && sliderTouched;
  const guideActive = !complete;
  const eventWhy = [
    'You get commission up to 8% per ticket. Tap the event to reveal your cut.',
    'Your cut % can change per event. Tap to reveal & continue',
  ];
  const sliderWhy = 'Drag the slider to see how much you could get paid.';
  useCompleteWhen(complete, onDone);

  const flip = (index: number) => {
    setFlipped(current => { const next = new Set(current); next.add(index); return next; });
  };

  return (
    <div style={stack}>
      <div style={{ display: 'grid', gap: 10 }}>
        {commissionEvents.map((event, index) => {
          const isFlipped = flipped.has(index);
          const isNext = index === firstUnflipped;
          const locked = !isFlipped && !isNext;
          return (
            <div key={event.title} className={locked && guideActive ? 'creator-guide-dim' : isNext ? 'creator-guide-target' : undefined} style={{ position: 'relative', paddingTop: guideTopSpace(isNext, eventWhy[index]) }}>
              {isNext && <GuideWhy text={eventWhy[index]} />}
              <button
                type="button"
                className={isNext ? 'creator-demo-pulse' : undefined}
                disabled={!isFlipped && !isNext}
                aria-pressed={isFlipped}
                onClick={() => flip(index)}
                style={{ ...card, width: '100%', padding: 15, cursor: !isFlipped && !isNext ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left', minHeight: 82, color: INK, transition: 'transform 0.2s, background 0.2s', borderColor: isNext ? GOLD : isFlipped ? '#bbf7d0' : HAIR, background: isFlipped ? '#f0fdf4' : isNext ? GOLD_TINT : '#fff', transform: isFlipped ? 'rotateX(0deg)' : 'none' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: isFlipped ? 'minmax(0, 1fr) auto' : '1fr', alignItems: 'stretch', gap: isFlipped ? 14 : 0 }}>
                  <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: 14, lineHeight: 1.3, fontWeight: 850 }}>{event.title}</div>
                    <div style={{ marginTop: 8, fontSize: 8.5, color: MUTED, fontWeight: 750, letterSpacing: 0.55, textTransform: 'uppercase' }}>Ticket Price</div>
                    <div style={{ marginTop: 2, fontSize: 17, lineHeight: 1.1, fontWeight: 900 }}>{inr(event.price)}</div>
                  </div>
                  {isFlipped && (
                    <div style={{ minWidth: 100, borderLeft: '1px dashed #bbf7d0', paddingLeft: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      <div style={{ color: GREEN, fontSize: 30, lineHeight: 1, fontWeight: 950, letterSpacing: -0.8 }}>{inr(event.cut)}</div>
                      <div style={{ marginTop: 7, color: GREEN, fontSize: 9, lineHeight: 1.2, fontWeight: 850, letterSpacing: 0.5, textTransform: 'uppercase' }}>{event.pct}% commission</div>
                    </div>
                  )}
                  </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* What-if earnings estimate — the Airbnb "show the money" hook, in level form. */}
      <div className={sliderGuideActive ? 'creator-guide-target' : guideActive ? 'creator-guide-dim' : undefined} style={{ position: 'relative', paddingTop: guideTopSpace(sliderGuideActive, sliderWhy) }}>
        {sliderGuideActive && <GuideWhy text={sliderWhy} />}
        <div className={sliderGuideActive ? 'creator-demo-pulse' : undefined} style={{ ...card, padding: 15, borderColor: sliderGuideActive ? GOLD : HAIR, background: sliderGuideActive ? GOLD_TINT : '#fff' }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>What could a month look like?</div>
          <div style={{ ...helper, marginTop: 5 }}>If your posts bring <b style={{ color: INK }}>{bookings}</b> booking{bookings === 1 ? '' : 's'} to {PRIMARY_EVENT.title} this month…</div>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={bookings}
            onChange={event => { setBookings(Number(event.target.value)); setSliderTouched(true); }}
            onPointerDown={() => setSliderTouched(true)}
            disabled={!cardsComplete}
            aria-label="Bookings this month"
            className="creator-money-slider"
            style={{ width: '100%', marginTop: 16, cursor: cardsComplete ? 'pointer' : 'default', background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${((bookings - 1) / 19) * 100}%, #e5e7eb ${((bookings - 1) / 19) * 100}%, #e5e7eb 100%)` }}
          />
          <div style={{ marginTop: 11, display: 'flex', alignItems: 'baseline', gap: 9 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: GREEN, letterSpacing: -0.8 }}>{inr(bookings * PRIMARY_EVENT.cut)}</div>
            <div style={helper}>this month</div>
          </div>
          <div style={{ ...helper, marginTop: 4, color: GREEN }}>{bookings} × {inr(PRIMARY_EVENT.cut)} per booking</div>
          {TOP_CREATOR_LAST_MONTH != null && (
            <div style={{ marginTop: 12, padding: '9px 11px', borderRadius: 10, background: '#f0fdf4', color: '#166534', fontSize: 12.5, fontWeight: 750 }}>
              Our top creator earned {inr(TOP_CREATOR_LAST_MONTH)} last month.
            </div>
          )}
        </div>
      </div>

      <div className={guideActive ? 'creator-guide-dim' : undefined} style={{ display: 'grid', gap: 8, marginTop: 10 }}>
        <p style={paragraph}>You get a commission of <b>up to 8% per ticket.</b></p>
        <p style={{ ...paragraph, marginBottom: 14 }}>These are demo numbers — the real commission per ticket is available in the real dashboard.</p>
        <ContinueButton
          enabled={complete}
          pendingLabel={!cardsComplete ? `Flip ${commissionEvents.length - flipped.size} more event card${commissionEvents.length - flipped.size === 1 ? '' : 's'}` : 'Drag the slider to continue'}
        />
      </div>
    </div>
  );
}

function DemoEssentialResourceTile({ kind }: { kind: 'drive' | 'whatsapp' }) {
  const drive = kind === 'drive';
  const title = drive ? 'Our Google Drive' : "Creator's Groupchat";
  const detail = drive
    ? 'All the best clips from our events in one place.'
    : 'Receive instant updates & help from the team.';
  const action = drive ? 'Open folder' : 'Join group';

  return (
    <div style={{ minWidth: 0, height: '100%', boxSizing: 'border-box', padding: '18px 11px 16px', background: '#fff', color: INK, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <span aria-hidden="true" style={{ width: 40, height: 36, display: 'grid', placeItems: 'center', marginBottom: 9 }}>
        {drive ? (
          <svg width="34" height="30" viewBox="0 0 64 56">
            <path fill="#0F9D58" d="M24 4h16l20 34H44L32 18z" />
            <path fill="#F4B400" d="M24 4 32 18 12 52 4 38z" />
            <path fill="#4285F4" d="M4 38h40l8 14H12z" />
          </svg>
        ) : (
          <svg width="34" height="34" viewBox="0 0 56 56">
            <circle cx="28" cy="27" r="22" fill="#25D366" />
            <path d="m12.5 41.5-3 9 9.5-3" fill="#25D366" />
            <path d="M18.5 15.5c.8-.8 2.1-.7 2.8.2l3.2 4.2c.6.8.5 1.8-.2 2.5l-2 2c2.1 4.2 5.2 7.3 9.4 9.4l2-2c.7-.7 1.7-.8 2.5-.2l4.2 3.2c.9.7 1 2 .2 2.8l-1.7 1.7c-1.8 1.8-4.5 2.4-6.9 1.6-8.9-3.1-15.9-10.1-19-19-.8-2.4-.2-5.1 1.6-6.9z" fill="#fff" />
          </svg>
        )}
      </span>
      <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, lineHeight: 1.3 }}>{title}</span>
      <span style={{ display: 'block', fontSize: 11.5, color: MUTED, lineHeight: 1.45, marginTop: 5, marginBottom: 11 }}>{detail}</span>
      <span style={{ minHeight: 28, marginTop: 'auto', padding: '6px 10px', border: '1px solid #d9d9dd', borderRadius: 999, background: '#f5f5f6', color: '#4b4b52', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11, fontWeight: 800, lineHeight: 1, boxSizing: 'border-box' }}>
        {action}
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3.25 8.75 8.75 3.25M4.25 3.25h4.5v4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

// 'submit' sits between closing the details sheet and copying the link, so the
// tour tells the real story in order: read the event details → make and submit
// your video → copy your link and post. This array position is what drives the
// dim/gold ordering and the progression, so the sequence lives in one place.
type L3Stage = 'hero' | 'range' | 'clicks' | 'signups' | 'paid' | 'conversion' | 'resources' | 'events' | 'closeSheet' | 'submit' | 'inspiration' | 'copy' | 'team';
const L3_STAGE_ORDER: L3Stage[] = ['hero', 'range', 'clicks', 'signups', 'paid', 'conversion', 'resources', 'events', 'closeSheet', 'submit', 'inspiration', 'copy', 'team'];

export function DemoL3({ demoHandle, onDone }: DemoProps) {
  // Default range is 'week' so the range stop can grow the numbers by switching
  // to 'month' — which also lands the tour on the rich two-row month view that
  // matches the hero (₹987) and the level-4 bill.
  const [range, setRange] = useState<DemoRange>('week');
  const [heroTapped, setHeroTapped] = useState(false);
  const [rangeComplete, setRangeComplete] = useState(false);
  const [clicksTapped, setClicksTapped] = useState(false);
  const [signupsTapped, setSignupsTapped] = useState(false);
  const [paidTapped, setPaidTapped] = useState(false);
  const [conversionTapped, setConversionTapped] = useState(false);
  const [resourcesTapped, setResourcesTapped] = useState(false);
  const [sheetTitle, setSheetTitle] = useState(PRIMARY_EVENT.title);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openedSheet, setOpenedSheet] = useState(false);
  const [closedSheet, setClosedSheet] = useState(false);
  const [submitTapped, setSubmitTapped] = useState(false);
  const [inspirationTapped, setInspirationTapped] = useState(false);
  const [copyTapped, setCopyTapped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [teamTapped, setTeamTapped] = useState(false);
  const [rangeMenuOpen, setRangeMenuOpen] = useState(false);

  const handle = handleFor(demoHandle);
  const rangeClicks = DEMO_RANGE_CLICKS[range];
  const rangeLines = DEMO_RANGE_LINES[range];
  const rangePaidCount = linePaid(rangeLines);
  const rangeEarned = lineEarned(rangeLines);

  const complete = heroTapped && rangeComplete && clicksTapped && signupsTapped && paidTapped
    && conversionTapped && resourcesTapped && openedSheet && closedSheet && submitTapped && inspirationTapped && copyTapped && teamTapped;
  useCompleteWhen(complete, onDone);

  // Twelve stops, in order. While a sheet is open, no body target is active.
  const nextStage: L3Stage | null = sheetOpen ? null
    : !heroTapped ? 'hero'
    : !rangeComplete ? 'range'
    : !clicksTapped ? 'clicks'
    : !signupsTapped ? 'signups'
    : !paidTapped ? 'paid'
    : !conversionTapped ? 'conversion'
    : !resourcesTapped ? 'resources'
    : !openedSheet ? 'events'
    : !closedSheet ? 'closeSheet'
    : !submitTapped ? 'submit'
    : !inspirationTapped ? 'inspiration'
    : !copyTapped ? 'copy'
    : !teamTapped ? 'team'
    : null;
  const activeStage = nextStage;
  const focusStage = activeStage;
  const focusIndex = focusStage ? L3_STAGE_ORDER.indexOf(focusStage) : -1;
  // Completed steps stay fully visible. Every future step is muted, including
  // before the opening hero's Start action is pressed.
  const shouldDim = (stage: L3Stage) => focusStage !== null
    && L3_STAGE_ORDER.indexOf(stage) > focusIndex;

  const isActive = (stage: L3Stage) => activeStage === stage;
  const isFocused = (stage: L3Stage) => isActive(stage);
  const resourcesFocused = isActive('resources');
  const eventsFocused = isActive('events');

  const whyText: Record<L3Stage, string> = {
    hero: 'This shows what you earned this month. Tap "start" to continue.',
    range: 'Your Funnel shows how your reels are performing. Change the time range to Last Month & see how the stats change.',
    clicks: "Clicks = No. of people who opened your link. If your content excites people then you'll get more clicks.",
    signups: "Sign-ups = No. of people who register in our website. If your content doesn't provide correct details about our events, then most who clicked your link won't register in our website",
    paid: 'You get a commission for every paid person shown here. Exciting videos with proper details will get you more commissions!',
    conversion: 'You can see your earnings breakdown here.',
    resources: 'The Google drive has highlights clips from our events. Join group chat to get instant updates from us.',
    events: 'Always read event details before creating promotions. Videos with proper details will get you more commissions. Press Open Details to continue...',
    closeSheet: '',
    submit: 'Upload your reel to your Google Drive or Youtube and submit link here. We will review it & approve it. Press Submit to continue...',
    inspiration: 'Not sure how to promote our events? Tap here to watch our best-performing videos & copy our styles. Press Next to continue.',
    copy: 'Use this button to copy your custom link.',
    team: "We show every creator's performance and earnings as we strongly support transparency. Tap Finish to end the tour.",
  };
  const focusText = (stage: L3Stage) => whyText[stage];
  const resourcesText = whyText.resources;
  const eventsText = whyText.events;
  const tileStage: L3Stage | null = isFocused('clicks') ? 'clicks' : isFocused('signups') ? 'signups' : isFocused('paid') ? 'paid' : null;
  const tileGuideAnchor: GuideTileAnchor | undefined = tileStage === 'clicks' ? 'first' : tileStage === 'signups' ? 'second' : tileStage === 'paid' ? 'third' : undefined;
  const rangeFocused = isFocused('range');
  const shouldDimTile = (stage: L3Stage) => focusStage === 'range' || tileStage !== null ? false : shouldDim(stage);
  const tourActive = focusStage !== null && focusStage !== 'hero';
  const overlayHost = typeof document === 'undefined' ? null : document.getElementById('creator-onboarding-root');

  // Advance a non-interactive tour target only while it's the active stop.
  const tapTarget = (stage: L3Stage, mark: () => void) => {
    if (!isActive(stage)) return;
    mark();
  };

  const advanceHeroFromGuide = () => tapTarget('hero', () => setHeroTapped(true));
  const advanceTileFromGuide = () => {
    if (tileStage === 'clicks') tapTarget('clicks', () => setClicksTapped(true));
    if (tileStage === 'signups') tapTarget('signups', () => setSignupsTapped(true));
    if (tileStage === 'paid') tapTarget('paid', () => setPaidTapped(true));
  };

  const rangeInteractive = isActive('range') || complete;
  const eventsInteractive = isActive('events') || complete;
  const copyInteractive = isActive('copy') || complete;

  const copyCustomLink = () => {
    if (!copyInteractive) return;
    setCopyTapped(true);
    setCopied(true);
    if (navigator.clipboard) void navigator.clipboard.writeText(`https://chaptera.in/@${handle}`).catch(() => {});
  };

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [sheetOpen]);

  const openSheet = (title: string) => {
    if (!eventsInteractive) return;
    setSheetTitle(title);
    setOpenedSheet(true);
    setSheetOpen(true);
  };
  const closeSheet = () => {
    setSheetOpen(false);
    if (openedSheet && !closedSheet) setClosedSheet(true);
  };

  const leaderboard = [
    { rank: 1, handle: 'maya.moves', tickets: 7, earned: 1813 },
    { rank: 2, handle, tickets: DEMO_MONTH_PAID, earned: DEMO_MONTH_EARNED, trainee: true },
    { rank: 3, handle: 'rohan.routes', tickets: 6, earned: 756 },
    { rank: 4, handle: 'nisha.weekends', tickets: 3, earned: 294 },
  ];

  const tileRing = (stage: L3Stage): React.CSSProperties => isActive(stage)
    ? { background: GOLD_TINT, boxShadow: `inset 0 0 0 2px ${GOLD}` }
    : { background: '#fff' };

  return (
    <div style={stack}>
      <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Stop 1 — the earnings hero starts the tour. */}
        <div className={guideClass(isFocused('hero'), shouldDim('hero'))} style={{ position: 'relative', paddingTop: guideTopSpace(isFocused('hero'), focusText('hero')) }}>
          {isFocused('hero') && <GuideWhy text={focusText('hero')} onNext={isActive('hero') ? advanceHeroFromGuide : undefined} actionLabel="Start" />}
          <div
            role={isActive('hero') ? 'button' : undefined}
            tabIndex={isActive('hero') ? 0 : undefined}
            onClick={() => tapTarget('hero', () => setHeroTapped(true))}
            onKeyDown={e => { if (isActive('hero') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tapTarget('hero', () => setHeroTapped(true)); } }}
            className={isActive('hero') ? 'creator-demo-calm-pulse' : undefined}
            style={{ borderRadius: 12, padding: isFocused('hero') ? '9px 10px' : 0, margin: isFocused('hero') ? '-9px -10px' : 0, border: `1.5px solid ${isActive('hero') ? GOLD : 'transparent'}`, background: isActive('hero') ? GOLD_TINT : 'transparent', cursor: isActive('hero') ? 'pointer' : 'default' }}
          >
            <div style={{ ...helper, fontWeight: 700 }}>Earned in July</div>
            <div style={{ fontSize: 38, lineHeight: 1, fontWeight: 900, letterSpacing: -1.2, marginTop: 4 }}>{inr(DEMO_MONTH_EARNED)}</div>
            <div style={{ ...helper, marginTop: 7 }}>Paid out monthly.</div>
          </div>
        </div>

        <div>
          {/* Stop 2 — the full-width tip sits above a compact label/control row. */}
          <div
            className={guideClass(isFocused('range'), shouldDim('range'))}
            style={{ position: 'relative', zIndex: rangeMenuOpen ? 20 : undefined, display: 'flex', flexDirection: 'column' }}
          >
              {isFocused('range') && <GuideWhy text={focusText('range')} tileAnchor="third" flow />}
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={eyebrow}>Your funnel</div>
              <div style={{ flex: 1 }} />
              <div
                className={isActive('range') ? 'creator-demo-pulse' : undefined}
                onKeyDown={event => { if (event.key === 'Escape') setRangeMenuOpen(false); }}
                style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', borderRadius: 999, background: isActive('range') ? GOLD_TINT : '#fff' }}
              >
                <button
                  type="button"
                  disabled={!rangeInteractive}
                  aria-label="Funnel date range"
                  aria-haspopup="true"
                  aria-expanded={rangeMenuOpen}
                  aria-controls="creator-funnel-range-options"
                  onClick={() => { if (rangeInteractive) setRangeMenuOpen(open => !open); }}
                  style={{ minWidth: 118, border: `1.5px solid ${isActive('range') ? GOLD : HAIR}`, borderRadius: 999, background: 'transparent', color: INK, fontSize: 12, fontWeight: 800, lineHeight: 1.2, padding: '7px 38px 7px 11px', textAlign: 'left', outline: 'none', cursor: rangeInteractive ? 'pointer' : 'default', fontFamily: 'inherit' }}
                >
                  {DEMO_RANGES.find(option => option.key === range)?.label}
                </button>
                <span aria-hidden="true" style={{ position: 'absolute', right: 20, width: 8.2, height: 8.2, borderRight: `2.05px solid ${INK}`, borderBottom: `2.05px solid ${INK}`, transform: 'translateY(-2px) rotate(45deg)', pointerEvents: 'none' }} />
                {rangeMenuOpen && (
                  <div id="creator-funnel-range-options" role="group" aria-label="Funnel date range options" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 12, minWidth: 146, overflow: 'hidden', border: `1.5px solid ${HAIR}`, borderRadius: 12, background: '#fff', boxShadow: '0 10px 28px rgba(17,17,17,0.16)', padding: 4 }}>
                    {DEMO_RANGES.map(option => {
                      const selected = option.key === range;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          aria-pressed={selected}
                          disabled={selected}
                          onClick={() => {
                            setRange(option.key);
                            setRangeMenuOpen(false);
                            if (!rangeComplete && option.key === 'month') {
                              setRangeComplete(true);
                            }
                          }}
                          style={{ width: '100%', border: 'none', borderRadius: 8, background: selected ? '#f4f4f5' : '#fff', color: selected ? MUTED : INK, padding: '9px 10px', textAlign: 'left', fontFamily: 'inherit', fontSize: 12, lineHeight: 1.2, fontWeight: 750, cursor: selected ? 'default' : 'pointer' }}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              </div>
          </div>
          {/* Stops 3–5 — each funnel tile individually. One tooltip above the row. */}
          <div className={rangeFocused ? 'creator-guide-target' : undefined} style={{ position: 'relative' }}>
            {tileStage && <GuideWhy text={focusText(tileStage)} tileAnchor={tileGuideAnchor} flow onNext={isActive(tileStage) ? advanceTileFromGuide : undefined} />}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `1.5px solid ${rangeFocused ? GOLD : HAIR}`, borderRadius: 14, overflow: 'hidden' }}>
              {([
                { label: 'Clicks', value: rangeClicks.clicks, stage: 'clicks' as L3Stage, mark: () => setClicksTapped(true) },
                { label: 'Sign-ups', value: rangeClicks.signups, stage: 'signups' as L3Stage, mark: () => setSignupsTapped(true) },
                { label: 'Paid', value: rangePaidCount, stage: 'paid' as L3Stage, mark: () => setPaidTapped(true) },
              ]).map((tile, index) => (
                <div
                  key={tile.label}
                  role={isActive(tile.stage) ? 'button' : undefined}
                  tabIndex={isActive(tile.stage) ? 0 : undefined}
                  onClick={() => tapTarget(tile.stage, tile.mark)}
                  onKeyDown={e => { if (isActive(tile.stage) && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tapTarget(tile.stage, tile.mark); } }}
                  className={shouldDimTile(tile.stage) ? 'creator-guide-dim' : undefined}
                  style={{ borderLeft: index === 0 ? 'none' : `1px solid ${HAIR}`, borderRadius: index === 0 ? '12px 0 0 12px' : index === 2 ? '0 12px 12px 0' : 0, position: 'relative', zIndex: isActive(tile.stage) ? 1 : 0, padding: '13px 4px', textAlign: 'center', cursor: isActive(tile.stage) ? 'pointer' : 'default', ...tileRing(tile.stage) }}
                >
                  <RollingStatNumber value={tile.value} delayMs={index * 80} />
                  <div style={{ fontSize: 10.5, fontWeight: 800, marginTop: 4 }}>{tile.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stop 6 — conversions, itemised per event (two rows for the month). */}
        <div className={guideClass(isFocused('conversion'), shouldDim('conversion'))} style={{ position: 'relative', paddingTop: guideTopSpace(isFocused('conversion'), focusText('conversion')) }}>
          {isFocused('conversion') && <GuideWhy text={focusText('conversion')} align="right" onNext={isActive('conversion') ? () => tapTarget('conversion', () => setConversionTapped(true)) : undefined} />}
          <div style={{ ...eyebrow, marginBottom: 8 }}>Your conversions</div>
          <button type="button" disabled={!isActive('conversion')} onClick={() => tapTarget('conversion', () => setConversionTapped(true))} className={isActive('conversion') ? 'creator-demo-calm-pulse' : undefined} style={{ ...card, width: '100%', padding: 4, textAlign: 'left', color: rangeComplete ? INK : MUTED, fontFamily: 'inherit', cursor: isActive('conversion') ? 'pointer' : 'default', borderColor: isActive('conversion') ? GOLD : HAIR, background: isActive('conversion') ? GOLD_TINT : conversionTapped ? '#f7f7f8' : '#f7f7f8', opacity: rangeComplete ? 1 : 0.65 }}>
            {rangeLines.length === 0 ? (
              <div style={{ ...helper, padding: 11 }}>No paid tickets in this range yet.</div>
            ) : rangeLines.map((line, index) => (
              <div key={line.event.title} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '11px 11px', borderTop: index === 0 ? 'none' : `1px solid ${HAIR}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.event.title}</div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{ color: GREEN, fontWeight: 900, fontSize: 13.5 }}>{inr(line.event.cut * line.tickets)}</div>
                  <div style={{ ...helper, marginTop: 4 }}>{inr(line.event.cut)} × {line.tickets}</div>
                </div>
              </div>
            ))}
          </button>
        </div>

        {/* Stops 7–9 — the unified Essentials card, Open Details, then the existing in-sheet tip. */}
        <div className={guideClass(resourcesFocused, shouldDim('resources'))} style={{ position: 'relative', paddingTop: guideTopSpace(resourcesFocused, resourcesText) }}>
          {resourcesFocused && (
            <GuideWhy
              text={resourcesText}
              tileAnchor="second"
              onNext={() => tapTarget('resources', () => setResourcesTapped(true))}
            />
          )}
          <div style={{ ...eyebrow, marginBottom: 8 }}>The Essentials</div>
          <div style={{ border: '1px solid #a1a1aa', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
            <div
              className={resourcesFocused ? 'creator-demo-inset-border-glow' : undefined}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', alignItems: 'stretch', position: 'relative', zIndex: resourcesFocused ? 2 : 0, background: resourcesFocused ? GOLD_TINT : '#fff' }}
            >
              <DemoEssentialResourceTile kind="drive" />
              <div style={{ minWidth: 0, borderLeft: `1px solid ${HAIR}` }}>
                <DemoEssentialResourceTile kind="whatsapp" />
              </div>
            </div>

            <div
              className={guideClass(eventsFocused, resourcesFocused)}
              style={{ position: 'relative', paddingTop: guideTopSpace(eventsFocused, eventsText), borderTop: `1px solid ${HAIR}` }}
            >
              {eventsFocused && <GuideWhy text={eventsText} tileAnchor="third" />}
              {DEMO_EVENTS.map((event, index) => (
                <div
                  key={event.title}
                  className={eventsFocused && index > 0 ? 'creator-guide-dim' : undefined}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderTop: index === 0 ? 'none' : `1px solid ${HAIR}`, background: '#fff', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', color: INK }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', fontSize: 12, color: MUTED, marginTop: 3 }}>
                      <span style={{ fontWeight: 750 }}>{DEMO_DATES[index]}</span>
                      <span aria-hidden="true">·</span>
                      <span style={{ color: GREEN, fontWeight: 750 }}>{inr(event.cut)} per booking</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!eventsInteractive}
                    className={eventsFocused && index === 0 ? 'creator-demo-pulse' : undefined}
                    onClick={() => openSheet(event.title)}
                    aria-label={`Open details for ${event.title}`}
                    style={{ flexShrink: 0, height: 28, boxSizing: 'border-box', border: `1px solid ${eventsFocused && index === 0 ? GOLD : '#d9d9dd'}`, borderRadius: 999, padding: '0 9px 0 11px', background: eventsFocused && index === 0 ? GOLD_TINT : '#f5f5f6', color: '#4b4b52', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: eventsInteractive ? 'pointer' : 'default', fontFamily: 'inherit' }}
                  >
                    <span style={{ display: 'block', lineHeight: '11px', transform: 'translateY(-0.25px)' }}>Open Details</span>
                    <ChevronRight aria-hidden="true" size={13} strokeWidth={2.4} color="#4b4b52" style={{ display: 'block', flexShrink: 0, transform: 'translateY(0.5px)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stop 10 — submit the video. A static replica of the real card: the
            demos never touch the network, so Submit only advances the tour and
            flips the row to the "under review" state the creator will really
            see. Sits below The Essentials exactly as it does on the live
            dashboard — the footage folder comes before the video. */}
        <div className={guideClass(isFocused('submit'), shouldDim('submit'))} style={{ position: 'relative', paddingTop: guideTopSpace(isFocused('submit'), focusText('submit')) }}>
          {isFocused('submit') && <GuideWhy text={focusText('submit')} align="center-right" />}
          <div style={{ ...eyebrow, marginBottom: 8 }}>Submit your video</div>
          <div style={{ border: '1px solid #a1a1aa', borderRadius: 16, background: '#fff', padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 750, color: INK, lineHeight: 1.35 }}>
              {PRIMARY_EVENT.title} · {DEMO_DATES[0]}
            </div>

            {submitTapped ? (
              <div style={{ fontSize: 12.5, color: INK, marginTop: 9, fontWeight: 700 }}>Submitted — under review</div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <div style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: `1.5px solid ${HAIR}`, fontSize: 12.5, color: MUTED }}>
                  Upload video to your Google Drive &amp; paste link
                </div>
                <button
                  type="button"
                  className={isActive('submit') ? 'creator-demo-calm-pulse' : undefined}
                  disabled={!isActive('submit')}
                  onClick={() => tapTarget('submit', () => setSubmitTapped(true))}
                  style={{
                    width: '100%',
                    marginTop: 10,
                    padding: '11px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${isActive('submit') ? GOLD : 'transparent'}`,
                    background: isActive('submit') ? GOLD_TINT : '#d4d4d8',
                    color: isActive('submit') ? INK : '#fff',
                    fontWeight: 800,
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                    cursor: isActive('submit') ? 'pointer' : 'default',
                  }}
                >
                  Submit
                </button>
              </div>
            )}

            {/* Watch-our-videos deeplink — the 'inspiration' tour stop. A static
                replica of the live footer (CreatorVideoTasks.tsx); in the demo
                the tooltip's Next button advances the tour. */}
            <div
              className={guideClass(isFocused('inspiration'), isFocused('submit'))}
              style={{ position: 'relative', paddingTop: guideTopSpace(isFocused('inspiration'), focusText('inspiration')), marginTop: 12, color: '#57534e', fontSize: 13.5, lineHeight: 1.6, textAlign: 'center' }}
            >
              {isFocused('inspiration') && <GuideWhy text={focusText('inspiration')} align="center" onNext={isActive('inspiration') ? () => tapTarget('inspiration', () => setInspirationTapped(true)) : undefined} />}
              Need inspiration?{' '}
              <button
                type="button"
                disabled={!(isActive('inspiration') || complete)}
                onClick={() => tapTarget('inspiration', () => setInspirationTapped(true))}
                style={{ padding: 0, border: 'none', background: 'none', color: '#2563eb', fontSize: 13.5, fontWeight: 600, fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2, cursor: (isActive('inspiration') || complete) ? 'pointer' : 'default' }}
              >
                Watch our videos
              </button>
            </div>
          </div>
        </div>

        {/* Stop 11 — copy the custom link. */}
        <div className={guideClass(isFocused('copy'), shouldDim('copy'))} style={{ position: 'relative', paddingBottom: guideTopSpace(isFocused('copy'), focusText('copy')) }}>
          {isFocused('copy') && <GuideWhy text={focusText('copy')} align="right" placement="below" />}
          <div style={{ ...card, padding: 13 }}>
            <div style={eyebrow}>Your Custom Link</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>chaptera.in/@{handle}</div>
              <button type="button" className={isActive('copy') ? 'creator-demo-calm-pulse' : undefined} disabled={!copyInteractive} onClick={copyCustomLink} style={{ border: `1.5px solid ${isActive('copy') ? GOLD : complete ? HAIR : 'transparent'}`, borderRadius: 9, background: copied ? GREEN : isActive('copy') ? GOLD_TINT : complete ? '#fff' : copyTapped ? INK : '#d7d7db', color: copied ? '#fff' : complete || isActive('copy') ? INK : copyTapped ? '#fff' : INK, fontSize: 12, fontWeight: 800, padding: '8px 12px', cursor: copyInteractive ? 'pointer' : 'default', fontFamily: 'inherit' }}>{copied ? 'Copied' : 'Copy'}</button>
            </div>
          </div>
        </div>

        {/* Stop 10 — the leaderboard finishes the tour. */}
        <div className={guideClass(isFocused('team'), shouldDim('team'))} style={{ position: 'relative', paddingTop: guideTopSpace(isFocused('team'), focusText('team')), borderTop: `1px solid ${HAIR}`, marginTop: -3 }}>
          {isFocused('team') && <GuideWhy text={focusText('team')} align="center-right" onNext={isActive('team') ? () => tapTarget('team', () => setTeamTapped(true)) : undefined} actionLabel="Finish" />}
          <div style={{ ...eyebrow, marginTop: 13, marginBottom: 9 }}>The Team</div>
          <div
            role={isActive('team') ? 'button' : undefined}
            tabIndex={isActive('team') ? 0 : undefined}
            onClick={() => tapTarget('team', () => setTeamTapped(true))}
            onKeyDown={e => { if (isActive('team') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tapTarget('team', () => setTeamTapped(true)); } }}
            style={{ display: 'grid', gap: 5, borderRadius: 12, padding: isFocused('team') ? 7 : 0, margin: isFocused('team') ? -7 : 0, border: `1.5px solid ${isActive('team') ? GOLD : 'transparent'}`, background: isActive('team') ? GOLD_TINT : 'transparent', cursor: isActive('team') ? 'pointer' : 'default' }}
          >
            {leaderboard.map(row => (
              <div key={row.rank} style={{ padding: '9px 10px', borderRadius: 10, background: row.trainee ? '#ecfdf3' : '#f7f7f8', border: row.trainee ? '1px solid #bbf7d0' : '1px solid transparent', display: 'grid', gridTemplateColumns: '20px 1fr auto', alignItems: 'center', gap: 7 }}>
                <div style={{ fontWeight: 900, fontSize: 12 }}>{row.rank}</div>
                <div style={{ minWidth: 0, fontSize: 11.5, fontWeight: 800 }}>@{row.handle} {row.trainee && <span style={{ color: MUTED, fontSize: 9.5 }}>you</span>}<div style={{ color: MUTED, fontSize: 9.5, marginTop: 2 }}>{row.tickets} tickets</div></div>
                <div style={{ color: GREEN, fontSize: 11.5, fontWeight: 850 }}>{inr(row.earned)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        role="note"
        className={tourActive ? 'creator-guide-dim' : undefined}
        style={{ border: '1px solid #fde68a', borderRadius: 12, background: '#fff', padding: '15px 14px', margin: '10px 0', color: '#57534e', fontSize: 12.5, lineHeight: 1.5 }}
      >
        <div style={{ color: '#854d0e', fontSize: 10.5, lineHeight: 1.5, fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase', textAlign: 'center', marginBottom: 14 }}>
          Accessing Your Dashboard
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div>You can open your real dashboard anytime at <strong><span style={{ color: '#2563eb', textDecoration: 'underline' }}>chaptera.in/creator</span> &amp; login using your gmail</strong> to check your earnings.</div>
        </div>
      </div>
      <div className={tourActive ? 'creator-guide-dim' : undefined}>
        <ContinueButton
          enabled={complete}
          pendingLabel={
            !heroTapped ? 'Tap your earnings to start'
            : !rangeComplete ? 'Choose Last month to continue'
            : !clicksTapped ? 'Tap the Clicks tile to continue'
            : !signupsTapped ? 'Tap the Sign-ups tile to continue'
            : !paidTapped ? 'Tap the Paid tile to continue'
            : !conversionTapped ? 'Tap your conversions to continue'
            : !resourcesTapped ? 'Read the Essentials tip to continue'
            : !openedSheet ? 'Open an upcoming event to continue'
            : sheetOpen ? 'Close the details to continue'
            : !closedSheet ? 'Close the details to continue'
            : !submitTapped ? 'Submit your video to continue'
            : !copyTapped ? 'Tap Copy to continue'
            : 'Tap the leaderboard to finish'
          }
        />
      </div>

      {overlayHost && createPortal(
        <div style={{ position: 'absolute', inset: 0, zIndex: 1000, pointerEvents: sheetOpen ? 'auto' : 'none' }}>
          <InvitePlanDetailsSheet
            open={sheetOpen}
            onClose={closeSheet}
            title={sheetTitle}
            details={PONDY_DETAILS}
            closeDetailsLabel="Close Details"
            closeDetailsHint="This page has sample details, press Close Details to continue."
            closeDetailsButtonClassName={sheetOpen ? 'creator-demo-calm-pulse' : undefined}
          />
        </div>,
        overlayHost,
      )}
    </div>
  );
}

export function DemoL4({ onDone }: DemoProps) {
  const exit = useDemoExit();
  const finish = () => {
    onDone();
    exit();
  };

  return (
    <div style={stack}>
      <div style={{ ...card, padding: 18 }}>
        <div style={{ ...helper, fontWeight: 700 }}>Earned in July</div>
        <div style={{ fontSize: 40, lineHeight: 1, fontWeight: 900, letterSpacing: -1.2, marginTop: 5 }}>{inr(DEMO_MONTH_EARNED)}</div>
        <div style={{ ...helper, marginTop: 7, fontWeight: 700 }}>Paid out monthly</div>

        {/* The bill — one line per event, every amount = cut × tickets; total = hero. */}
        <div style={{ marginTop: 17, display: 'grid', gap: 10 }}>
          {DEMO_MONTH_LINES.map(line => (
            <div key={line.event.title} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'baseline', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{line.event.title}</div>
                <div style={{ ...helper, marginTop: 2 }}>{line.tickets} {line.tickets === 1 ? 'ticket' : 'tickets'} × {inr(line.event.cut)}</div>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 850, textAlign: 'right' }}>{inr(line.event.cut * line.tickets)}</div>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${HAIR}`, marginTop: 2 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'baseline', gap: 12 }}>
            <div style={{ fontSize: 13.5, fontWeight: 900 }}>Total earned in July</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: GREEN, textAlign: 'right' }}>{inr(DEMO_MONTH_EARNED)}</div>
          </div>
        </div>
      </div>
      <p style={paragraph}>Payment settlements are <b>paid monthly</b>. For example, everything you earn in July is added up and paid to you at the end of July.</p>
      <p style={paragraph}>As you post more promotional content you'll learn how to sell more &amp; earn more commission. The best part is there is no limit for how much you can earn by being a chapter அ creator.</p>
      <button type="button" className="creator-cta-shimmer" onClick={finish} style={primaryBtn(true)}>I Understand</button>
    </div>
  );
}

const PONDY_DETAILS: InvitePlanDetails = {
  quickInfo: [
    { label: 'Plan Title', value: PRIMARY_EVENT.title },
    { label: 'Meeting Spot', value: 'Airport Metro' },
    { label: 'Transport', value: 'Party bus' },
    { label: "You'll Meet", value: 'Ppl who never say never' },
    { label: 'Group Size', value: '20 people' },
  ],
  included: ['Party bus to the Pondy beach villa', 'Private pool and beach nearby', 'Campfire, BBQ dinner and beach-house stay', 'Next-morning brunch'],
  itinerary: [
    {
      day: 'Day 1', title: 'Party bus, campfire and houseparty', description: 'Meet the group at Airport Metro, ride to Pondy together, then settle into the beach villa.',
      schedule: [{ time: '4:00 PM', activity: 'Party bus leaves Airport Metro' }, { time: '9:00 PM', activity: 'Campfire and BBQ dinner' }, { time: '10:00 PM', activity: 'Games and the houseparty' }],
    },
    {
      day: 'Day 2', title: 'A lazy morning by the beach', description: 'Wake up at Casa Tequila, recover over brunch, and head back with the crew.',
      schedule: [{ time: 'Morning', activity: 'Brunch at the beach house' }, { time: 'Afternoon', activity: 'Return with the party bus' }],
    },
  ],
  showAccommodation: false,
};

// A single 9:16 Vimeo reel with the same edge-bleed embed + loading spinner as
// the welcome step.
function VimeoReel({ id, title }: { id: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position: 'relative', height: 'min(52vh, 440px)', aspectRatio: '9 / 16', maxWidth: '100%', margin: '0 auto', borderRadius: 24, overflow: 'hidden', background: '#000', border: `1.5px solid ${HAIR}` }}>
      {!loaded && (
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
        src={`https://player.vimeo.com/video/${id}?autoplay=0&muted=0&badge=0&byline=0&title=0&portrait=0&api=1`}
        title={title}
        style={{ position: 'absolute', inset: -2, width: 'calc(100% + 4px)', height: 'calc(100% + 4px)', border: 0, clipPath: 'inset(0 round 22px)' }}
        onLoad={() => setLoaded(true)}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

// Final lesson: one setup walkthrough followed by the brand-voice rules.
// TODO(owner): replace L7_VIMEO_ID with the real recording.
export function DemoL5({ onDone }: DemoProps) {
  const exit = useDemoExit();
  const finish = () => {
    onDone();
    exit();
  };

  return (
    <div style={stack}>
      <VimeoReel id={L7_VIMEO_ID} title="Creator auto-DM setup video" />
      <p style={paragraph}>chapter அ is a lifestyle club people <i>want</i> to enter, and your audience follows you because they trust you. So we never run fake urgency, fake discounts, or "use my code" bait — there are no codes.</p>
      <p style={paragraph}>Our goal is only to bring people together &amp; give them the best possible experience.</p>
      <button type="button" className="creator-cta-shimmer" onClick={finish} style={primaryBtn(true)}>I Understand</button>
    </div>
  );
}
