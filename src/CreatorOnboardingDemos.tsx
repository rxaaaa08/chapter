import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InvitePlanDetailsSheet, type InvitePlanDetails } from './InvitePlanDetailsSheet';

const CreatorLessonOnePlayer = React.lazy(() => import('./remotion/CreatorLessonOnePlayer'));

// TODO(owner): replace with the creator's recorded comments-to-auto-DM walkthrough.
const L7_VIMEO_ID = '76979871';

const INK = '#111';
const MUTED = '#9a9aa2';
const HAIR = '#ececed';
const GREEN = '#16a34a';
const RED = '#dc2626';
const GOLD = '#eab308';
const GOLD_TINT = '#fffbeb';

const DEMO_HANDLE_FALLBACK = 'yourhandle';
// Duplicate of normalizeHandle in CreatorOnboarding.tsx — kept local to
// avoid a circular import; same regex, keep in sync.
const normalizeDemoHandle = (v: string) =>
  v.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 40);

const PRIMARY_EVENT = { title: 'Pondy Beach Houseparty', price: 3700, pct: 7, cut: 259 };
const DEMO_EVENTS = [
  PRIMARY_EVENT,
  { title: 'Chill Sunday Meetup', price: 359, pct: 8, cut: 29 }, // rounded
  { title: 'Sunrise at Kovalam', price: 699, pct: 5, cut: 35 }, // rounded
];
const DEMO_FUNNEL = { clicks: 120, signups: 14, paid: 5 };
const DEMO_MONTH_EARNED = DEMO_FUNNEL.paid * PRIMARY_EVENT.cut;
const FOLLOWER = 'Priya';

const DEMO_DATES = ['Aug 28', 'Aug 2', 'Aug 16'];
type DemoRange = '24h' | 'week' | 'month' | '90d';
const DEMO_RANGES: Array<{ key: DemoRange; label: string }> = [
  { key: '24h', label: '24 hrs' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: '90d', label: '90 days' },
];
const DEMO_RANGE_STATS: Record<DemoRange, typeof DEMO_FUNNEL> = {
  '24h': { clicks: 7, signups: 1, paid: 0 },
  week: { clicks: 32, signups: 4, paid: 1 },
  month: DEMO_FUNNEL,
  '90d': { clicks: 338, signups: 40, paid: 14 },
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
        .creator-demo-pulse { animation: creatorDemoPulse 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .creator-demo-pulse { animation: none; outline: 2px solid ${GOLD}; outline-offset: 3px; }
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
  background: enabled ? INK : '#d7d7db', color: '#fff', fontSize: 15,
  fontWeight: 700, cursor: enabled ? 'pointer' : 'default', fontFamily: 'inherit',
});

const secondaryBtn: React.CSSProperties = {
  width: '100%', padding: '12px 0', borderRadius: 14, border: `1.5px solid ${HAIR}`,
  background: '#fff', color: INK, fontSize: 14.5, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit',
};

const stack: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 18 };
const card: React.CSSProperties = { border: `1.5px solid ${HAIR}`, borderRadius: 18, background: '#fff' };
const eyebrow: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: MUTED, letterSpacing: 0.45, textTransform: 'uppercase' };
const paragraph: React.CSSProperties = { color: INK, fontSize: 14, lineHeight: 1.58, margin: 0 };
const helper: React.CSSProperties = { color: MUTED, fontSize: 12.5, lineHeight: 1.5 };

function ContinueButton({ enabled = true, label = 'I Understand', pendingLabel = 'Complete the activity to continue' }: { enabled?: boolean; label?: string; pendingLabel?: string }) {
  const exit = useDemoExit();
  return <button type="button" className={enabled ? 'creator-demo-pulse' : undefined} disabled={!enabled} onClick={() => { if (enabled) exit(); }} style={primaryBtn(enabled)}>{enabled ? label : pendingLabel}</button>;
}

function AttributionTag({ handle }: { handle: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', padding: '6px 9px', borderRadius: 999, background: '#f0fdf4', color: GREEN, fontSize: 11.5, fontWeight: 800 }}>
      came from @{handle}
    </div>
  );
}

export function DemoL1({ demoHandle, setDemoHandle, onDone }: DemoL1Props) {
  const exit = useDemoExit();
  const handle = handleFor(demoHandle);

  const finish = () => {
    onDone();
    exit();
  };

  return (
    <div style={stack}>
      <p style={paragraph}>First, type the handle you're thinking of — we'll use it everywhere in this demo.</p>
      <div>
        <div className={!demoHandle ? 'creator-demo-pulse' : undefined} style={{ position: 'relative', borderRadius: 12, boxShadow: !demoHandle ? `0 0 0 2px ${GOLD}` : 'none', background: !demoHandle ? GOLD_TINT : '#fff' }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: MUTED, fontWeight: 800 }}>@</span>
          <input
            aria-label="Demo creator handle"
            value={demoHandle}
            onChange={event => setDemoHandle(normalizeDemoHandle(event.target.value))}
            placeholder="yourhandle"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            style={{ width: '100%', padding: '12px 13px 12px 29px', borderRadius: 12, border: `1.5px solid ${!demoHandle ? GOLD : HAIR}`, background: 'transparent', fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ ...helper, marginTop: 6 }}>Just for the demo — you'll claim your real handle at the end.</div>
      </div>
      <div>
        <p style={paragraph}>Watch how one comment carries Priya from your reel to the real chapter அ experiences page.</p>
      </div>
      <div style={{ width: '100%', margin: '0 auto', borderRadius: 20, overflow: 'hidden', background: '#171715', boxShadow: '0 18px 50px rgba(17, 17, 17, 0.16)' }}>
        <React.Suspense fallback={<div role="status" aria-label="Loading lesson video" style={{ width: '100%', aspectRatio: '16 / 9', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 13, fontWeight: 750 }}>Loading video…</div>}>
          <CreatorLessonOnePlayer handle={handle} />
        </React.Suspense>
      </div>
      <button type="button" className={demoHandle ? 'creator-demo-pulse' : undefined} onClick={finish} style={primaryBtn(true)}>Continue to Next Lesson</button>
    </div>
  );
}

export function DemoL2({ onDone }: DemoProps) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const firstUnflipped = DEMO_EVENTS.findIndex((_, index) => !flipped.has(index));
  const complete = flipped.size === DEMO_EVENTS.length;
  useCompleteWhen(complete, onDone);

  return (
    <div style={stack}>
      <p style={paragraph}>Tap the events to see how your cuts work</p>
      <div style={{ display: 'grid', gap: 10 }}>
        {DEMO_EVENTS.map((event, index) => {
          const isFlipped = flipped.has(index);
          return (
            <button
              type="button"
              className={index === firstUnflipped ? 'creator-demo-pulse' : undefined}
              key={event.title}
              aria-pressed={isFlipped}
              onClick={() => setFlipped(current => new Set(current).add(index))}
              style={{ ...card, padding: 15, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', minHeight: 82, color: INK, transition: 'transform 0.2s, background 0.2s', borderColor: index === firstUnflipped ? GOLD : isFlipped ? '#bbf7d0' : HAIR, background: isFlipped ? '#f0fdf4' : index === firstUnflipped ? GOLD_TINT : '#fff', transform: isFlipped ? 'rotateX(0deg)' : 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{event.title}</div>
                <div style={{ flexShrink: 0, fontSize: 13, fontWeight: 850 }}>{inr(event.price)}</div>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: isFlipped ? GREEN : MUTED, fontWeight: isFlipped ? 850 : 650 }}>
                {isFlipped ? `${event.pct}% → ${inr(event.cut)}` : 'Tap to reveal your cut'}
              </div>
            </button>
          );
        })}
      </div>
      <ContinueButton
        enabled={complete}
        pendingLabel={`Flip ${DEMO_EVENTS.length - flipped.size} more event card${DEMO_EVENTS.length - flipped.size === 1 ? '' : 's'}`}
      />
    </div>
  );
}

export function DemoL3({ demoHandle, onDone }: DemoProps) {
  const [range, setRange] = useState<DemoRange>('month');
  const [rangeTapped, setRangeTapped] = useState(false);
  const [conversionTapped, setConversionTapped] = useState(false);
  const [sheetTitle, setSheetTitle] = useState(PRIMARY_EVENT.title);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openedSheet, setOpenedSheet] = useState(false);
  const [copyTapped, setCopyTapped] = useState(false);
  const [copied, setCopied] = useState(false);
  const handle = handleFor(demoHandle);
  const complete = rangeTapped && conversionTapped && openedSheet && copyTapped;
  const rangeStats = DEMO_RANGE_STATS[range];
  const rangeEarned = rangeStats.paid * PRIMARY_EVENT.cut;
  const rangeTicketLabel = `${rangeStats.paid} ${rangeStats.paid === 1 ? 'ticket' : 'tickets'}`;
  const overlayHost = typeof document === 'undefined' ? null : document.getElementById('creator-onboarding-root');
  useCompleteWhen(complete, onDone);

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
    if (!conversionTapped) return;
    setSheetTitle(title);
    setOpenedSheet(true);
    setSheetOpen(true);
  };

  const leaderboard = [
    { rank: 1, handle: 'maya.moves', tickets: 7, earned: 1813 },
    { rank: 2, handle, tickets: 5, earned: DEMO_MONTH_EARNED, trainee: true },
    { rank: 3, handle: 'rohan.routes', tickets: 4, earned: 1036 },
    { rank: 4, handle: 'nisha.weekends', tickets: 2, earned: 518 },
  ];

  return (
    <div style={stack}>
      <p style={paragraph}>This is your dashboard — the real one, with demo numbers. You can open it anytime at <span style={{ color: '#2563eb', textDecoration: 'underline', fontWeight: 750 }}>chaptera.in/creator</span>.</p>
      <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ ...helper, fontWeight: 700 }}>Earned in July</div>
          <div style={{ fontSize: 38, lineHeight: 1, fontWeight: 900, letterSpacing: -1.2, marginTop: 4 }}>{inr(DEMO_MONTH_EARNED)}</div>
          <div style={{ ...helper, marginTop: 7 }}>Paid out monthly.</div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={eyebrow}>① Your funnel</div>
            <div style={{ flex: 1 }} />
            <div className={!rangeTapped ? 'creator-demo-pulse' : undefined} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', borderRadius: 999, background: !rangeTapped ? GOLD_TINT : '#fff' }}>
              <select
                value={range}
                onPointerDown={() => setRangeTapped(true)}
                onKeyDown={() => setRangeTapped(true)}
                onChange={event => { setRange(event.target.value as DemoRange); setRangeTapped(true); }}
                aria-label="Funnel date range"
                style={{ appearance: 'none', WebkitAppearance: 'none', border: `1.5px solid ${!rangeTapped ? GOLD : HAIR}`, borderRadius: 999, background: 'transparent', color: INK, fontSize: 12, fontWeight: 800, padding: '6px 42px 6px 11px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {DEMO_RANGES.map(option => <option key={option.key} value={option.key}>{option.label}</option>)}
              </select>
              <span aria-hidden="true" style={{ position: 'absolute', right: 20, width: 8.2, height: 8.2, borderRight: `2.05px solid ${INK}`, borderBottom: `2.05px solid ${INK}`, transform: 'translateY(-2px) rotate(45deg)', pointerEvents: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `1.5px solid ${HAIR}`, borderRadius: 14, overflow: 'hidden' }}>
            {[
              { label: 'Clicks', value: rangeStats.clicks },
              { label: 'Sign-ups', value: rangeStats.signups },
              { label: 'Paid', value: rangeStats.paid },
            ].map((tile, index) => <div key={tile.label} style={{ borderLeft: index === 0 ? 'none' : `1px solid ${HAIR}`, background: '#fff', padding: '13px 4px', textAlign: 'center' }}><div style={{ fontSize: 23, fontWeight: 900 }}>{tile.value}</div><div style={{ fontSize: 10.5, fontWeight: 800, marginTop: 4 }}>{tile.label}</div></div>)}
          </div>
          {rangeTapped && <div style={{ display: 'grid', gap: 4, marginTop: 9 }}>
            <div style={helper}><b style={{ color: INK }}>Clicks:</b> {rangeStats.clicks} people opened your link. Pays ₹0.</div>
            <div style={helper}><b style={{ color: INK }}>Sign-ups:</b> {rangeStats.signups} applied. Still ₹0 — interest isn't income.</div>
            <div style={helper}><b style={{ color: INK }}>Paid:</b> {rangeStats.paid} fully paid — the only tile that pays. {rangeStats.paid} × {inr(PRIMARY_EVENT.cut)} = {inr(rangeEarned)}.</div>
          </div>}
        </div>

        <div>
          <div style={{ ...eyebrow, marginBottom: 8 }}>② Your conversions</div>
          <button type="button" disabled={!rangeTapped} className={rangeTapped && !conversionTapped ? 'creator-demo-pulse' : undefined} onClick={() => setConversionTapped(true)} style={{ ...card, width: '100%', padding: 13, display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', color: rangeTapped ? INK : MUTED, fontFamily: 'inherit', cursor: rangeTapped ? 'pointer' : 'default', borderColor: rangeTapped && !conversionTapped ? GOLD : HAIR, background: conversionTapped ? '#f7f7f8' : rangeTapped ? GOLD_TINT : '#f7f7f8', opacity: rangeTapped ? 1 : 0.65 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{PRIMARY_EVENT.title}</div>
              <div style={{ ...helper, marginTop: 4 }}>{rangeTicketLabel} · {inr(PRIMARY_EVENT.cut)} per ticket</div>
            </div>
            <div style={{ color: GREEN, fontWeight: 900 }}>{inr(rangeEarned)}</div>
          </button>
          {conversionTapped && <div style={{ ...helper, marginTop: 8 }}>{inr(PRIMARY_EVENT.cut)} per ticket × {rangeStats.paid} = {inr(rangeEarned)}</div>}
        </div>

        <div>
          <div style={{ ...eyebrow, marginBottom: 8 }}>③ See upcoming events</div>
          <div style={{ ...card, overflow: 'hidden', opacity: conversionTapped ? 1 : 0.65 }}>
            {DEMO_EVENTS.map((event, index) => (
              <button type="button" disabled={!conversionTapped} className={conversionTapped && !openedSheet && index === 0 ? 'creator-demo-pulse' : undefined} key={event.title} onClick={() => openSheet(event.title)} style={{ width: '100%', padding: '13px 15px', border: 'none', borderTop: index === 0 ? 'none' : `1px solid ${HAIR}`, background: conversionTapped && !openedSheet && index === 0 ? GOLD_TINT : '#fff', boxShadow: conversionTapped && !openedSheet && index === 0 ? `inset 0 0 0 2px ${GOLD}` : 'none', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', color: conversionTapped ? INK : MUTED, fontFamily: 'inherit', cursor: conversionTapped ? 'pointer' : 'default' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800 }}>{event.title}</div>
                  <div style={{ ...helper, marginTop: 3 }}>{DEMO_DATES[index]}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: conversionTapped ? GREEN : MUTED, fontSize: 13.5, fontWeight: 900 }}>{inr(event.cut)}</div>
                  <div style={{ fontSize: 9.5, color: MUTED }}>per booking</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...card, padding: 13, opacity: openedSheet && !sheetOpen ? 1 : 0.65 }}>
          <div style={eyebrow}>④ Your Custom Link</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>chaptera.in/@{handle}</div>
            <button type="button" disabled={!openedSheet || sheetOpen} onClick={() => { setCopyTapped(true); setCopied(true); }} style={{ border: `1.5px solid ${openedSheet && !sheetOpen && !copyTapped ? GOLD : 'transparent'}`, borderRadius: 9, background: copied ? GREEN : openedSheet && !sheetOpen && !copyTapped ? GOLD_TINT : openedSheet && !sheetOpen ? INK : '#d7d7db', color: copied || (openedSheet && !sheetOpen && copyTapped) ? '#fff' : INK, fontSize: 12, fontWeight: 800, padding: '8px 12px', cursor: openedSheet && !sheetOpen ? 'pointer' : 'default', fontFamily: 'inherit', boxShadow: openedSheet && !sheetOpen && !copyTapped ? `0 0 0 3px rgba(234, 179, 8, 0.14)` : 'none' }}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
          {copyTapped && <div style={{ ...helper, marginTop: 9 }}>chaptera.in/@{handle} is your custom link &amp; you can use this button to copy it.</div>}
        </div>

        <div style={{ borderTop: `1px solid ${HAIR}`, paddingTop: 13 }}>
          <div style={eyebrow}>The Team</div>
          <div style={{ display: 'grid', gap: 5, marginTop: 9 }}>
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
      <ContinueButton
        enabled={complete}
        pendingLabel={!rangeTapped ? 'Choose a range to continue' : !conversionTapped ? 'Tap your conversions to continue' : !openedSheet ? 'Open an upcoming event to continue' : sheetOpen ? 'Close the details to continue' : 'Tap Copy to continue'}
      />

      {overlayHost && createPortal(
        <div style={{ position: 'absolute', inset: 0, zIndex: 1000, pointerEvents: sheetOpen ? 'auto' : 'none' }}>
          <InvitePlanDetailsSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            title={sheetTitle}
            details={PONDY_DETAILS}
            closeButtonClassName={sheetOpen ? 'creator-demo-pulse' : undefined}
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
        <div style={{ ...paragraph, marginTop: 14, fontWeight: 800 }}>Paid out monthly</div>
      </div>
      <p style={paragraph}>Everything you earn in July is paid after the month closes.</p>
      <button type="button" onClick={finish} style={primaryBtn(true)}>I Understand</button>
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

export function DemoL5({ onDone }: DemoProps) {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const exit = useDemoExit();
  const finish = () => {
    onDone();
    exit();
  };

  return (
    <div style={stack}>
      <div style={{ position: 'relative', height: 'min(56vh, 460px)', aspectRatio: '9 / 16', maxWidth: '100%', margin: '0 auto', borderRadius: 24, overflow: 'hidden', background: '#000', border: `1.5px solid ${HAIR}` }}>
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
          src={`https://player.vimeo.com/video/${L7_VIMEO_ID}?autoplay=0&muted=0&badge=0&byline=0&title=0&portrait=0&api=1`}
          title="Creator auto-DM setup video"
          style={{ position: 'absolute', inset: -2, width: 'calc(100% + 4px)', height: 'calc(100% + 4px)', border: 0, clipPath: 'inset(0 round 22px)' }}
          onLoad={() => setVideoLoaded(true)}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
      <button type="button" onClick={finish} style={primaryBtn(true)}>I Understand</button>
    </div>
  );
}

export function DemoL8({ onDone }: DemoProps) {
  const exit = useDemoExit();
  const finish = () => {
    onDone();
    exit();
  };

  return (
    <div style={stack}>
      <p style={paragraph}>Last one — and it's about taste.</p>
      <p style={paragraph}>chapter அ is a club people <i>want</i> into, and your audience follows you because they trust you. So we never run fake urgency, invented discounts, or "use my code" bait — there are no codes. There's your link, the real price, and your honest word that the experience is worth it.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ ...card, padding: 15, borderColor: '#bbf7d0', background: '#f0fdf4' }}>
          <div style={{ color: '#166534', fontSize: 13, fontWeight: 900 }}>Do</div>
          <ul style={{ margin: '10px 0 0', paddingLeft: 17, color: INK, fontSize: 11.5, lineHeight: 1.55 }}>
            <li>Share what genuinely excited you.</li>
            <li>Use the real price and your one link.</li>
            <li>Sound like yourself.</li>
          </ul>
        </div>
        <div style={{ ...card, padding: 15, borderColor: '#fecaca', background: '#fef2f2' }}>
          <div style={{ color: RED, fontSize: 13, fontWeight: 900 }}>Don't</div>
          <ul style={{ margin: '10px 0 0', paddingLeft: 17, color: INK, fontSize: 11.5, lineHeight: 1.55 }}>
            <li>Invent urgency or discounts.</li>
            <li>Promise a coupon code.</li>
            <li>Send people to a payment-only link.</li>
          </ul>
        </div>
      </div>
      <button type="button" onClick={finish} style={primaryBtn(true)}>Finish the demo →</button>
    </div>
  );
}
