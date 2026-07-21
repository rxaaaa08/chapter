import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { InvitePlanDetailsSheet, type InvitePlanDetails } from './InvitePlanDetailsSheet';

const CreatorLessonOnePlayer = React.lazy(() => import('./remotion/CreatorLessonOnePlayer'));
const CreatorLessonTwoPlayer = React.lazy(() => import('./remotion/CreatorLessonTwoPlayer'));
const CreatorLessonSevenPlayer = React.lazy(() => import('./remotion/CreatorLessonSevenPlayer'));

const INK = '#111';
const MUTED = '#9a9aa2';
const HAIR = '#ececed';
const GREEN = '#16a34a';
const RED = '#dc2626';

const DEMO_HANDLE_FALLBACK = 'yourhandle';
// Duplicate of normalizeHandle in CreatorOnboarding.tsx — kept local to
// avoid a circular import; same regex, keep in sync.
const normalizeDemoHandle = (v: string) =>
  v.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 40);

const PRIMARY_EVENT = { title: 'Pondy Beach Houseparty', price: 3700, pct: 8, cut: 296 };
const DEMO_EVENTS = [
  PRIMARY_EVENT,
  { title: 'Sunrise at Kovalam', price: 900, pct: 6, cut: 54 },
  { title: 'Chill Sunday Meetup', price: 359, pct: 4, cut: 14 }, // rounded
];
const DEMO_FUNNEL = { clicks: 120, signups: 14, paid: 5 };
const DEMO_MONTH_EARNED = DEMO_FUNNEL.paid * PRIMARY_EVENT.cut;
const FOLLOWER = 'Priya';

const DEMO_DATES = ['Aug 28', 'Aug 24', 'Aug 2'];

type DemoProps = { demoHandle: string; onDone: () => void };
type DemoL1Props = DemoProps & { setDemoHandle: (value: string) => void };

const DemoExitContext = createContext<() => void>(() => {});

export function DemoExitProvider({ onExit, children }: { onExit: () => void; children: React.ReactNode }) {
  return <DemoExitContext.Provider value={onExit}>{children}</DemoExitContext.Provider>;
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

type ChecklistItem = { label: string; done: boolean };

function TapChecklist({ items }: { items: ChecklistItem[] }) {
  return (
    <>
      <style>{`
        @keyframes creatorDemoPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(17, 17, 17, 0.2); transform: scale(1); }
          50% { box-shadow: 0 0 0 8px rgba(17, 17, 17, 0); transform: scale(1.025); }
        }
        .creator-demo-pulse { animation: creatorDemoPulse 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .creator-demo-pulse { animation: none; outline: 2px solid ${INK}; outline-offset: 3px; } }
      `}</style>
      <div aria-label="Tap checklist" style={{ display: 'flex', flexWrap: 'wrap', gap: 7, padding: 10, border: `1px solid ${HAIR}`, borderRadius: 14, background: '#fafafa' }}>
        {items.map(item => (
          <div key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 26, padding: '4px 8px', borderRadius: 999, background: item.done ? '#ecfdf3' : '#fff', border: `1px solid ${item.done ? '#bbf7d0' : HAIR}`, color: item.done ? '#147a3d' : MUTED, fontSize: 11.5, lineHeight: 1.2, fontWeight: 800 }}>
            <span aria-hidden="true" style={{ width: 15, height: 15, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, background: item.done ? GREEN : '#fff', border: `1.5px solid ${item.done ? GREEN : '#c9c9cd'}`, color: '#fff', fontSize: 9 }}>{item.done ? '✓' : ''}</span>
            {item.label}
          </div>
        ))}
      </div>
    </>
  );
}

function ContinueButton({ enabled = true, label = 'Continue', pendingLabel = 'Complete the activity to continue' }: { enabled?: boolean; label?: string; pendingLabel?: string }) {
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
      <style>{`
        @keyframes creatorDemoPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(17, 17, 17, 0.2); transform: scale(1); }
          50% { box-shadow: 0 0 0 9px rgba(17, 17, 17, 0); transform: scale(1.015); }
        }
        .creator-demo-pulse { animation: creatorDemoPulse 1.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .creator-demo-pulse { animation: none; } }
      `}</style>
      <p style={paragraph}>First, type the handle you're thinking of — we'll use it everywhere in this demo.</p>
      <div>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: MUTED, fontWeight: 800 }}>@</span>
          <input
            aria-label="Demo creator handle"
            value={demoHandle}
            onChange={event => setDemoHandle(normalizeDemoHandle(event.target.value))}
            placeholder="yourhandle"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            style={{ width: '100%', padding: '12px 13px 12px 29px', borderRadius: 12, border: `1.5px solid ${HAIR}`, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ ...helper, marginTop: 6 }}>Just for the demo — you'll claim your real handle at the end.</div>
      </div>
      <div>
        <p style={paragraph}>Watch how one comment carries Priya from your reel to the real chapter அ experiences page.</p>
        <p style={{ ...helper, marginTop: 6 }}>The video updates with your demo handle and works with sound off.</p>
      </div>
      <div style={{ width: 'min(100%, 286px)', margin: '0 auto', borderRadius: 26, overflow: 'hidden', background: '#171715', boxShadow: '0 18px 50px rgba(17, 17, 17, 0.16)' }}>
        <React.Suspense fallback={<div role="status" aria-label="Loading lesson video" style={{ width: '100%', aspectRatio: '9 / 16', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 13, fontWeight: 750 }}>Loading video…</div>}>
          <CreatorLessonOnePlayer handle={handle} />
        </React.Suspense>
      </div>
      <button type="button" className="creator-demo-pulse" onClick={finish} style={primaryBtn(true)}>Mark as done</button>
    </div>
  );
}

export function DemoL2({ demoHandle, onDone }: DemoProps) {
  const [showExplainer, setShowExplainer] = useState(true);
  const [scene, setScene] = useState<1 | 2 | 3>(1);
  const [counter, setCounter] = useState(0);
  const handle = handleFor(demoHandle);
  const counterFinished = counter >= PRIMARY_EVENT.cut;
  const complete = scene === 3 && counterFinished;
  useCompleteWhen(complete, onDone);

  useEffect(() => {
    if (scene !== 3) { setCounter(0); return; }
    const started = Date.now();
    const interval = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - started) / 1000);
      setCounter(Math.round(PRIMARY_EVENT.cut * progress));
      if (progress >= 1) window.clearInterval(interval);
    }, 32);
    return () => window.clearInterval(interval);
  }, [scene]);

  const replay = () => {
    setScene(1);
    setCounter(0);
  };

  if (showExplainer) {
    return (
      <div style={stack}>
        <div style={{ ...card, overflow: 'hidden', background: '#111', maxWidth: 286, width: '100%', margin: '0 auto' }}>
          <React.Suspense fallback={<div role="status" style={{ aspectRatio: '9 / 16', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 12.5 }}>Loading explainer…</div>}>
            <CreatorLessonTwoPlayer handle={handle} />
          </React.Suspense>
        </div>
        <p style={{ ...paragraph, color: MUTED, textAlign: 'center' }}>A short sound-off preview of how your tag stays with Priya from link to payment. Next, you drive the booking yourself.</p>
        <button type="button" className="creator-demo-pulse" onClick={() => setShowExplainer(false)} style={primaryBtn(true)}>Try it yourself</button>
      </div>
    );
  }

  return (
    <div style={stack}>
      <p style={paragraph}>Priya's on the Pondy Beach Houseparty page — and notice the little tag riding along: <b>came from @{handle}</b>. As long as that tag is there, whatever she books is credited to you.</p>
      <p style={paragraph}>Walk her through it.</p>

      <div style={{ ...card, padding: 15, background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AttributionTag handle={handle} />
        {scene === 1 && (
          <>
            <div style={{ ...card, padding: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 850 }}>{PRIMARY_EVENT.title}</div>
              <div style={{ ...helper, marginTop: 6 }}>dates · pickup points · {inr(PRIMARY_EVENT.price)}</div>
            </div>
            <button type="button" className="creator-demo-pulse" onClick={() => setScene(2)} style={primaryBtn(true)}>{FOLLOWER} applies</button>
          </>
        )}
        {scene === 2 && (
          <>
            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
              <div style={{ width: 42, height: 42, margin: '0 auto 12px', borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', background: GREEN, fontWeight: 900 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Application sent.</div>
              <div style={{ ...helper, marginTop: 4 }}>The payment page opens…</div>
            </div>
            <button type="button" className="creator-demo-pulse" onClick={() => setScene(3)} style={primaryBtn(true)}>{FOLLOWER} pays {inr(PRIMARY_EVENT.price)}</button>
          </>
        )}
        {scene === 3 && (
          <div style={{ textAlign: 'center', padding: '22px 8px' }}>
            <div style={{ width: 42, height: 42, margin: '0 auto 12px', borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', background: GREEN, fontWeight: 900 }}>✓</div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Booking confirmed</div>
            <div aria-live="polite" style={{ fontSize: 44, lineHeight: 1, color: GREEN, fontWeight: 900, letterSpacing: -1.4, marginTop: 18 }}>+{inr(counter)}</div>
            <div style={{ ...helper, marginTop: 8 }}>your commission · 8% of {inr(PRIMARY_EVENT.price)}</div>
          </div>
        )}
      </div>

      {scene === 3 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button type="button" onClick={replay} style={secondaryBtn}>Replay</button>
            <ContinueButton enabled={complete} pendingLabel="Watch your commission land" />
          </div>
        </>
      )}
    </div>
  );
}

export function DemoL3({ onDone }: DemoProps) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const firstUnflipped = DEMO_EVENTS.findIndex((_, index) => !flipped.has(index));
  const complete = flipped.size === DEMO_EVENTS.length;
  useCompleteWhen(complete, onDone);

  return (
    <div style={stack}>
      <TapChecklist items={[
        { label: `Reveal event cuts ${flipped.size}/3`, done: flipped.size === DEMO_EVENTS.length },
      ]} />
      <p style={paragraph}>You earn <b>up to 8% of the full ticket price</b> on every booking that comes through your link. Tap the events to see your cut.</p>
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
              style={{ ...card, padding: 15, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', minHeight: 82, color: INK, transition: 'transform 0.2s, background 0.2s', background: isFlipped ? '#f0fdf4' : '#fff', transform: isFlipped ? 'rotateX(0deg)' : 'none' }}
            >
              <div style={{ fontSize: 14, fontWeight: 800 }}>{event.title}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: isFlipped ? GREEN : MUTED, fontWeight: isFlipped ? 850 : 650 }}>
                {isFlipped ? `${event.pct}% → ${inr(event.cut)}` : `${inr(event.price)} ticket`}
              </div>
            </button>
          );
        })}
      </div>
      <p style={{ ...paragraph, color: MUTED }}>Commission runs on events where creator earnings are switched on — your dashboard always shows the exact per-event number, so there's never a surprise.</p>
      <ContinueButton
        enabled={complete}
        pendingLabel={`Flip ${DEMO_EVENTS.length - flipped.size} more event card${DEMO_EVENTS.length - flipped.size === 1 ? '' : 's'}`}
      />
    </div>
  );
}

export function DemoL4({ demoHandle, onDone }: DemoProps) {
  const [funnelCaption, setFunnelCaption] = useState('');
  const [conversionTapped, setConversionTapped] = useState(false);
  const [copyTapped, setCopyTapped] = useState(false);
  const [copied, setCopied] = useState(false);
  const handle = handleFor(demoHandle);
  const exploredCount = Number(Boolean(funnelCaption)) + Number(conversionTapped) + Number(copyTapped);
  const complete = Boolean(funnelCaption) && conversionTapped && copyTapped;
  useCompleteWhen(complete, onDone);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const tiles = [
    { label: 'Clicks', value: DEMO_FUNNEL.clicks, caption: 'Clicks: 120 people opened your link. Pays ₹0.' },
    { label: 'Sign-ups', value: DEMO_FUNNEL.signups, caption: "Sign-ups: 14 applied. Still ₹0 — interest isn't income." },
    { label: 'Paid', value: DEMO_FUNNEL.paid, caption: `Paid: 5 fully paid — the only tile that pays. 5 × ${inr(PRIMARY_EVENT.cut)} = ${inr(DEMO_MONTH_EARNED)}.` },
  ];

  return (
    <div style={stack}>
      <TapChecklist items={[
        { label: 'A funnel tile', done: Boolean(funnelCaption) },
        { label: 'Your conversions', done: conversionTapped },
        { label: 'Copy your link', done: copyTapped },
      ]} />
      <p style={paragraph}>This is your dashboard — the real one, with demo numbers. You'll find it anytime at <b>chaptera.in/creator</b>. Three things to tap.</p>
      <div aria-live="polite" style={{ ...helper, marginTop: -10, fontWeight: 800 }}>{exploredCount} of 3 explored</div>
      <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ ...helper, fontWeight: 700 }}>Earned in July</div>
          <div style={{ fontSize: 38, lineHeight: 1, fontWeight: 900, letterSpacing: -1.2, marginTop: 4 }}>{inr(DEMO_MONTH_EARNED)}</div>
          <div style={{ ...helper, marginTop: 7 }}>Paid out monthly.</div>
        </div>

        <div style={{ ...card, padding: 13 }}>
          <div style={eyebrow}>③ Your Custom Link</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>chaptera.in/@{handle}</div>
            <button type="button" className={Boolean(funnelCaption) && conversionTapped && !copyTapped ? 'creator-demo-pulse' : undefined} onClick={() => { setCopyTapped(true); setCopied(true); }} style={{ border: 'none', borderRadius: 9, background: copied ? GREEN : INK, color: '#fff', fontSize: 12, fontWeight: 800, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
          {copyTapped && <div style={{ ...helper, marginTop: 9 }}>chaptera.in/@{handle} — the one link you'll ever share. This button is how it gets everywhere.</div>}
        </div>

        <div>
          <div style={{ ...eyebrow, marginBottom: 8 }}>① Your funnel</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `1.5px solid ${HAIR}`, borderRadius: 14, overflow: 'hidden' }}>
            {tiles.map((tile, index) => (
              <button type="button" className={!funnelCaption && index === 0 ? 'creator-demo-pulse' : undefined} key={tile.label} onClick={() => setFunnelCaption(tile.caption)} style={{ border: 'none', borderLeft: index === 0 ? 'none' : `1px solid ${HAIR}`, background: funnelCaption === tile.caption ? '#f7f7f8' : '#fff', padding: '13px 4px', fontFamily: 'inherit', cursor: 'pointer' }}>
                <div style={{ fontSize: 23, fontWeight: 900 }}>{tile.value}</div>
                <div style={{ fontSize: 10.5, fontWeight: 800, marginTop: 4 }}>{tile.label}</div>
              </button>
            ))}
          </div>
          {funnelCaption && <div style={{ ...helper, marginTop: 8 }}>{funnelCaption}</div>}
        </div>

        <div>
          <div style={{ ...eyebrow, marginBottom: 8 }}>② Your conversions</div>
          <button type="button" className={Boolean(funnelCaption) && !conversionTapped ? 'creator-demo-pulse' : undefined} onClick={() => setConversionTapped(true)} style={{ ...card, width: '100%', padding: 13, display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', color: INK, fontFamily: 'inherit', cursor: 'pointer', background: conversionTapped ? '#f7f7f8' : '#fff' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{PRIMARY_EVENT.title}</div>
              <div style={{ ...helper, marginTop: 4 }}>5 tickets · {inr(PRIMARY_EVENT.cut)} per ticket</div>
            </div>
            <div style={{ color: GREEN, fontWeight: 900 }}>{inr(DEMO_MONTH_EARNED)}</div>
          </button>
          {conversionTapped && <div style={{ ...helper, marginTop: 8 }}>{PRIMARY_EVENT.title} · 5 tickets · {inr(DEMO_MONTH_EARNED)} · {inr(PRIMARY_EVENT.cut)} per ticket. Every rupee, itemised per event.</div>}
        </div>

        <div style={{ borderTop: `1px solid ${HAIR}`, paddingTop: 13 }}>
          <div style={eyebrow}>The Team</div>
          <div style={{ marginTop: 9, padding: '10px 12px', borderRadius: 11, background: '#f5f5f5', display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ fontWeight: 900 }}>3</div>
            <div style={{ flex: 1, fontSize: 12.5, fontWeight: 800 }}>@{handle} <span style={{ color: MUTED, fontSize: 10.5 }}>you</span></div>
            <div style={{ color: GREEN, fontWeight: 850 }}>{inr(DEMO_MONTH_EARNED)}</div>
          </div>
          <div style={{ ...helper, marginTop: 8 }}>and yes, there's a leaderboard. Everyone sees everyone's tickets and earnings — including yours.</div>
        </div>
      </div>
      <ContinueButton
        enabled={complete}
        pendingLabel={!funnelCaption ? 'Tap a funnel tile to continue' : !conversionTapped ? 'Tap your conversions to continue' : 'Tap Copy to continue'}
      />
    </div>
  );
}

export function DemoL5({ onDone }: DemoProps) {
  const [opened, setOpened] = useState<Set<number>>(new Set());
  const complete = opened.size === 3;
  useCompleteWhen(complete, onDone);
  const nodes = [
    { title: 'Bookings all month', caption: "every fully-paid booking adds to your July total, the moment it's paid." },
    { title: 'Month closes', caption: 'your July number locks.' },
    { title: 'Paid to your UPI', caption: "that's why we ask for your UPI ID at signup — it's where your money goes." },
  ];
  const firstUnopened = nodes.findIndex((_, index) => !opened.has(index));

  return (
    <div style={stack}>
      <TapChecklist items={nodes.map((node, index) => ({ label: node.title, done: opened.has(index) }))} />
      <p style={paragraph}>Simple rule: <b>you're paid monthly.</b> Everything you earn in a month is paid out after the month closes — straight to your UPI.</p>
      <div style={{ ...card, padding: 16 }}>
        <div style={{ ...helper, fontWeight: 700 }}>Earned in July</div>
        <div style={{ fontSize: 40, lineHeight: 1, fontWeight: 900, letterSpacing: -1.2, marginTop: 5 }}>{inr(DEMO_MONTH_EARNED)}</div>
        <div style={{ position: 'relative', display: 'grid', gap: 10, marginTop: 22 }}>
          <div aria-hidden="true" style={{ position: 'absolute', left: 20, top: 22, bottom: 22, width: 2, background: HAIR }} />
          {nodes.map((node, index) => {
            const isOpen = opened.has(index);
            return (
              <button type="button" className={index === firstUnopened ? 'creator-demo-pulse' : undefined} key={node.title} aria-pressed={isOpen} onClick={() => setOpened(current => new Set(current).add(index))} style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 10px', border: `1.5px solid ${isOpen ? INK : HAIR}`, borderRadius: 14, background: '#fff', color: INK, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: isOpen ? INK : '#fff', border: `2px solid ${isOpen ? INK : HAIR}`, color: '#fff', fontSize: 10, fontWeight: 900 }}>{isOpen ? '✓' : ''}</span>
                <span>
                  <span style={{ display: 'block', fontSize: 13.5, fontWeight: 850 }}>{node.title}</span>
                  {isOpen && <span style={{ display: 'block', ...helper, marginTop: 5 }}>{node.caption}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <ContinueButton enabled={complete} pendingLabel={firstUnopened >= 0 ? `Tap ${nodes[firstUnopened].title.toLowerCase()} to continue` : undefined} />
    </div>
  );
}

const PONDY_DETAILS: InvitePlanDetails = {
  quickInfo: [
    { label: 'Plan Title', value: PRIMARY_EVENT.title },
    { label: 'Meeting Spot', value: 'Airport Metro' },
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

const DEMO_CAPTIONS = [
  'went with this crew to pondy last month — easily the best weekend of my year. next dates are up, link takes you to everything 🌊',
  "if you've been waiting for a sign to actually go — this is it. comment LINK and I'll DM you the details.",
];

export function DemoL6({ onDone }: DemoProps) {
  const [sheetTitle, setSheetTitle] = useState(PRIMARY_EVENT.title);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [openedSheet, setOpenedSheet] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState<number | null>(null);
  useCompleteWhen(openedSheet, onDone);

  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [sheetOpen]);

  useEffect(() => {
    if (copiedCaption === null) return;
    const timeout = window.setTimeout(() => setCopiedCaption(null), 1200);
    return () => window.clearTimeout(timeout);
  }, [copiedCaption]);

  const openSheet = (title: string) => {
    setSheetTitle(title);
    setOpenedSheet(true);
    setSheetOpen(true);
  };

  const copyCaption = (caption: string, index: number) => {
    try { void navigator.clipboard?.writeText(caption).catch(() => {}); } catch { /* clipboard unavailable */ }
    setCopiedCaption(index);
  };

  return (
    <div style={stack}>
      <TapChecklist items={[
        { label: 'Open event details', done: openedSheet },
        { label: 'Close the details', done: openedSheet && !sheetOpen },
      ]} />
      <p style={paragraph}>Your dashboard answers this for you. The <b>"See upcoming events"</b> card lists every experience you can promote — with dates, and what each booking pays you.</p>
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: 15, borderBottom: `1px solid ${HAIR}` }}>
          <div style={{ fontSize: 15, fontWeight: 850 }}>See upcoming events</div>
          <div style={{ ...helper, marginTop: 3 }}>3 to promote · earn up to {inr(PRIMARY_EVENT.cut)} per booking</div>
        </div>
        {DEMO_EVENTS.map((event, index) => (
          <button type="button" className={!openedSheet && index === 0 ? 'creator-demo-pulse' : undefined} key={event.title} onClick={() => openSheet(event.title)} style={{ width: '100%', padding: '13px 15px', border: 'none', borderTop: index === 0 ? 'none' : `1px solid ${HAIR}`, background: '#fff', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', color: INK, fontFamily: 'inherit', cursor: 'pointer' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800 }}>{event.title}</div>
              <div style={{ ...helper, marginTop: 3 }}>{DEMO_DATES[index]}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ color: GREEN, fontSize: 13.5, fontWeight: 900 }}>{inr(event.cut)}</div>
              <div style={{ fontSize: 9.5, color: MUTED }}>per booking</div>
            </div>
          </button>
        ))}
      </div>
      <p style={paragraph}>This card is your what-to-post radar. Post about what's coming up — your one link does the rest.</p>
      <div style={{ display: 'grid', gap: 10 }}>
        {DEMO_CAPTIONS.map((caption, index) => (
          <button type="button" key={caption} onClick={() => copyCaption(caption, index)} style={{ ...card, padding: 14, textAlign: 'left', color: INK, fontFamily: 'inherit', cursor: 'pointer', lineHeight: 1.52, fontSize: 13.5, background: copiedCaption === index ? '#f0fdf4' : '#fff' }}>
            “{caption}”
            <span style={{ display: 'block', marginTop: 8, color: copiedCaption === index ? GREEN : MUTED, fontSize: 10.5, fontWeight: 800 }}>{copiedCaption === index ? 'Copied' : 'Tap to copy'}</span>
          </button>
        ))}
      </div>
      <ContinueButton enabled={openedSheet && !sheetOpen} pendingLabel={openedSheet ? 'Close the details to continue' : 'Open an event to continue'} />

      <div style={{ position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 448, zIndex: 1000, pointerEvents: sheetOpen ? 'auto' : 'none' }}>
        <InvitePlanDetailsSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={sheetTitle}
          details={PONDY_DETAILS}
          closeButtonClassName={sheetOpen ? 'creator-demo-pulse' : undefined}
        />
      </div>
    </div>
  );
}

export function DemoL7({ demoHandle, onDone }: DemoProps) {
  const [showExplainer, setShowExplainer] = useState(true);
  const [selectedPath, setSelectedPath] = useState<'bio' | 'dm' | null>(null);
  const [pathStep, setPathStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [playedPaths, setPlayedPaths] = useState<Set<'bio' | 'dm'>>(new Set());
  const handle = handleFor(demoHandle);
  const complete = playedPaths.size === 2;
  useCompleteWhen(complete, onDone);

  const bioSteps = [
    'Sees your Pondy reel',
    `Opens @${handle}'s profile`,
    'Hunts for the bio link',
    'Some followers drop off',
    `Others reach chaptera.in/@${handle}`,
  ];
  const dmSteps = [
    'Comments "LINK"',
    'Your auto-DM arrives',
    'Taps either DM button',
    `Reaches chaptera.in/@${handle}`,
  ];
  const activeSteps = selectedPath === 'bio' ? bioSteps : dmSteps;
  const nextPath = !playedPaths.has('bio') ? 'bio' : !playedPaths.has('dm') ? 'dm' : null;

  useEffect(() => {
    if (!running || !selectedPath) return;
    const stepCount = selectedPath === 'bio' ? 5 : 4;
    if (pathStep >= stepCount - 1) {
      setRunning(false);
      setPlayedPaths(current => new Set(current).add(selectedPath));
      return;
    }
    const timeout = window.setTimeout(() => setPathStep(current => current + 1), 520);
    return () => window.clearTimeout(timeout);
  }, [running, pathStep, selectedPath]);

  const playPath = (path: 'bio' | 'dm') => {
    setSelectedPath(path);
    setPathStep(0);
    setRunning(true);
  };

  const checklistItems = [
    { label: 'Try the bio path', done: playedPaths.has('bio') },
    { label: 'Try the auto-DM path', done: playedPaths.has('dm') },
  ];

  if (showExplainer) {
    return (
      <div style={stack}>
        <TapChecklist items={checklistItems} />
        <div style={{ ...card, overflow: 'hidden', background: '#111', maxWidth: 286, width: '100%', margin: '0 auto' }}>
          <React.Suspense fallback={<div role="status" style={{ aspectRatio: '9 / 16', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 12.5 }}>Loading explainer…</div>}>
            <CreatorLessonSevenPlayer handle={handle} />
          </React.Suspense>
        </div>
        <p style={{ ...paragraph, color: MUTED, textAlign: 'center' }}>A 24-second sound-off race between bio and auto-DM. Next, you try both paths yourself.</p>
        <button type="button" className="creator-demo-pulse" onClick={() => setShowExplainer(false)} style={primaryBtn(true)}>Try it yourself</button>
      </div>
    );
  }

  return (
    <div style={stack}>
      <TapChecklist items={checklistItems} />

      <div>
        <div style={{ fontSize: 18, lineHeight: 1.25, fontWeight: 900 }}>You just posted your Pondy Beach Houseparty reel.</div>
        <div style={{ ...paragraph, marginTop: 6, color: MUTED }}>Where does your link live?</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {([
          { id: 'bio' as const, title: 'In my bio', caption: 'Followers find it on my profile.' },
          { id: 'dm' as const, title: 'Auto-DM commenters', caption: 'The link goes straight to them.' },
        ]).map(path => {
          const played = playedPaths.has(path.id);
          const selected = selectedPath === path.id;
          return (
            <button
              type="button"
              key={path.id}
              className={nextPath === path.id ? 'creator-demo-pulse' : undefined}
              disabled={running}
              aria-pressed={selected}
              onClick={() => playPath(path.id)}
              style={{ ...card, minHeight: 126, padding: 14, textAlign: 'left', color: INK, fontFamily: 'inherit', cursor: running ? 'default' : 'pointer', borderColor: selected ? INK : played ? '#86efac' : HAIR, background: played ? '#f0fdf4' : selected ? '#f7f7f8' : '#fff', opacity: running && !selected ? 0.55 : 1 }}
            >
              <div aria-hidden="true" style={{ width: 25, height: 25, borderRadius: '50%', display: 'grid', placeItems: 'center', background: played ? GREEN : selected ? INK : '#f2f2f3', color: played || selected ? '#fff' : MUTED, fontSize: 12, fontWeight: 900 }}>{played ? '✓' : path.id === 'bio' ? '1' : '2'}</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.25, fontWeight: 900, marginTop: 12 }}>{path.title}</div>
              <div style={{ color: MUTED, fontSize: 11.5, lineHeight: 1.4, marginTop: 5 }}>{path.caption}</div>
            </button>
          );
        })}
      </div>

      {selectedPath && (
        <div style={{ ...card, padding: 12, borderRadius: 24, background: '#111', borderColor: '#111', boxShadow: '0 18px 45px rgba(17,17,17,0.13)' }}>
          <div style={{ height: 22, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <div style={{ width: 74, height: 5, borderRadius: 999, background: '#3f3f46' }} />
          </div>
          <div style={{ borderRadius: 17, background: '#fff', padding: 13, minHeight: 250 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingBottom: 11, borderBottom: `1px solid ${HAIR}` }}>
              <div style={{ fontSize: 12, fontWeight: 900 }}>Priya's journey</div>
              <div style={{ padding: '4px 7px', borderRadius: 999, background: selectedPath === 'dm' ? INK : '#f2f2f3', color: selectedPath === 'dm' ? '#fff' : MUTED, fontSize: 11, fontWeight: 850 }}>{selectedPath === 'dm' ? 'AUTO-DM' : 'BIO'}</div>
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {activeSteps.map((stepText, index) => {
                const visible = pathStep >= index;
                const isDropoff = selectedPath === 'bio' && index === 3;
                const isCurrent = visible && (running ? pathStep === index : index === activeSteps.length - 1);
                return (
                  <div key={stepText} style={{ display: 'flex', alignItems: 'center', gap: 9, minHeight: 38, padding: '8px 10px', borderRadius: 11, background: visible ? isDropoff ? '#fef2f2' : isCurrent ? '#f0fdf4' : '#f7f7f8' : '#fafafa', border: `1px solid ${visible && isDropoff ? '#fecaca' : visible && isCurrent ? '#bbf7d0' : HAIR}`, opacity: visible ? 1 : 0.32, transition: 'opacity 0.25s, background 0.25s, border-color 0.25s' }}>
                    <div aria-hidden="true" style={{ width: 19, height: 19, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: visible ? isDropoff ? RED : INK : '#e4e4e7', color: '#fff', fontSize: 11, fontWeight: 900 }}>{isDropoff ? '−' : visible ? '✓' : ''}</div>
                    <div style={{ color: visible && isDropoff ? RED : INK, fontSize: 12, lineHeight: 1.35, fontWeight: 780 }}>{stepText}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div aria-live="polite" style={{ color: '#fff', fontSize: 12.5, lineHeight: 1.45, padding: '12px 5px 2px', fontWeight: 720 }}>
            {selectedPath === 'bio'
              ? 'Your bio works, but every extra hop gives interest time to fade.'
              : 'The link goes to them in the moment they are interested.'}
          </div>
        </div>
      )}

      {playedPaths.size === 1 && !running && (
        <div style={{ padding: 12, borderRadius: 13, background: '#fff7ed', color: '#9a3412', fontSize: 13, lineHeight: 1.4, fontWeight: 850, textAlign: 'center' }}>Now try the other one.</div>
      )}

      {complete && (
        <div style={{ ...card, padding: 16, borderColor: '#bbf7d0', background: '#f0fdf4' }}>
          <div style={{ color: '#166534', fontSize: 16, lineHeight: 1.35, fontWeight: 900 }}>Both work. Auto-DM books more — we've tested it.</div>
          <div style={{ color: '#166534', fontSize: 12.5, lineHeight: 1.5, marginTop: 7 }}>Auto-DM is optional. When you want it, we suggest <b>Superprofile</b> for Instagram comment-to-DM automations.</div>
        </div>
      )}

      <div role="group" aria-label="Static preview of the auto-DM setup" style={{ ...card, padding: 15, background: '#f8f8f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={eyebrow}>Your auto-DM preview</div>
          <div style={{ color: MUTED, fontSize: 11, fontWeight: 800 }}>NOTHING TO TAP</div>
        </div>
        <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.55 }}>Hey! Everything about the trip — the plan, dates, and booking, all in one place.</div>
        <div style={{ display: 'grid', gap: 8, marginTop: 13 }}>
          {['I need more details', 'Book Now'].map(label => (
            <div key={label} style={{ ...card, borderColor: '#d7d7db', padding: 10, fontSize: 11.5, fontWeight: 800, background: '#fff' }}>{label}</div>
          ))}
          <div aria-hidden="true" style={{ textAlign: 'center', color: MUTED, fontSize: 15, lineHeight: 1 }}>↓&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓</div>
          <div style={{ padding: 11, borderRadius: 11, background: INK, color: '#fff', textAlign: 'center', fontSize: 12, fontWeight: 850 }}>one destination · chaptera.in/@{handle}</div>
        </div>
        <div style={{ ...helper, fontSize: 11.5, marginTop: 10 }}>A preview of what you'll set up in Superprofile — nothing to tap here. Two mindsets, one page for details and booking. Never two links.</div>
      </div>
      <ContinueButton enabled={complete} pendingLabel={playedPaths.size === 0 ? 'Try one link path to continue' : 'Try the other link path to continue'} />
    </div>
  );
}

export function DemoL8({ onDone }: DemoProps) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const complete = revealed.size === 2;
  useCompleteWhen(complete, onDone);
  const contrasts = [
    {
      quote: '90% OFF if you book in the next 10 minutes!!',
      verdict: 'Not us.',
      explanation: "Fake urgency burns your audience's trust — and ours.",
      color: RED,
    },
    {
      quote: 'went with this crew last month — booking through my link if you want in.',
      verdict: "That's us.",
      explanation: 'Honest beats loud, every time.',
      color: GREEN,
    },
  ];
  const firstUnrevealed = contrasts.findIndex((_, index) => !revealed.has(index));

  return (
    <div style={stack}>
      <TapChecklist items={[
        { label: 'Reveal the hype post', done: revealed.has(0) },
        { label: 'Reveal the honest post', done: revealed.has(1) },
      ]} />
      <p style={paragraph}>Last one — and it's about taste.</p>
      <p style={paragraph}>chapter அ is a club people <i>want</i> into, and your audience follows you because they trust you. So we never run fake urgency, invented discounts, or "use my code" bait — there are no codes. There's your link, the real price, and your honest word that the experience is worth it.</p>
      <div style={{ display: 'grid', gap: 10 }}>
        {contrasts.map((contrast, index) => {
          const isRevealed = revealed.has(index);
          return (
            <button type="button" className={index === firstUnrevealed ? 'creator-demo-pulse' : undefined} key={contrast.quote} aria-pressed={isRevealed} onClick={() => setRevealed(current => new Set(current).add(index))} style={{ ...card, padding: 17, minHeight: 142, textAlign: 'left', color: INK, fontFamily: 'inherit', cursor: 'pointer', background: isRevealed ? '#fafafa' : '#fff', borderColor: isRevealed ? contrast.color : HAIR }}>
              <div style={{ fontSize: 16, lineHeight: 1.42, fontWeight: 750 }}>“{contrast.quote}”</div>
              {isRevealed && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ color: contrast.color, fontSize: 15, fontWeight: 900 }}>{contrast.verdict}</div>
                  <div style={{ ...helper, marginTop: 4 }}>{contrast.explanation}</div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <ContinueButton enabled={complete} label="Finish the demo →" pendingLabel={firstUnrevealed === 0 ? 'Reveal the hype post to continue' : 'Reveal the honest post to continue'} />
    </div>
  );
}
