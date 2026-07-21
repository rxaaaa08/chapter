import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { InvitePlanDetailsSheet, type InvitePlanDetails } from './InvitePlanDetailsSheet';

const CreatorLessonOnePlayer = React.lazy(() => import('./remotion/CreatorLessonOnePlayer'));

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

const PRIMARY_EVENT = { title: 'Pondy Beach Houseparty', price: 3700, cut: 296 };
const DEMO_EVENTS = [
  PRIMARY_EVENT,
  { title: 'Sunrise at Kovalam', price: 900, cut: 72 },
  { title: 'Chill Sunday Meetup', price: 359, cut: 29 }, // 8% rounded
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

function ContinueButton({ enabled = true, label = 'Continue' }: { enabled?: boolean; label?: string }) {
  const exit = useDemoExit();
  return <button type="button" disabled={!enabled} onClick={() => { if (enabled) exit(); }} style={primaryBtn(enabled)}>{label}</button>;
}

function AttributionTag({ handle }: { handle: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', padding: '6px 9px', borderRadius: 999, background: '#f0fdf4', color: GREEN, fontSize: 11.5, fontWeight: 800 }}>
      came from @{handle}
    </div>
  );
}

function EventRows({ showPrice = true }: { showPrice?: boolean }) {
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      {DEMO_EVENTS.map((event, index) => (
        <div key={event.title} style={{ padding: '13px 14px', borderTop: index === 0 ? 'none' : `1px solid ${HAIR}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, flexShrink: 0, background: index === 0 ? 'linear-gradient(145deg, #173a4b, #e6b06b)' : index === 1 ? 'linear-gradient(145deg, #f7c969, #73b5b6)' : 'linear-gradient(145deg, #e6a9a9, #6d7fa8)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.3, fontWeight: 750 }}>{event.title}</div>
            {showPrice && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 3 }}>{inr(event.price)}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DemoL1({ demoHandle, setDemoHandle, onDone }: DemoL1Props) {
  const exit = useDemoExit();
  const [scene, setScene] = useState<'explainer' | 1 | 2 | 3>('explainer');
  const handle = handleFor(demoHandle);
  useCompleteWhen(scene === 3, onDone);

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
      <div style={stack}>
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
          <button type="button" onClick={() => setDemoHandle(DEMO_HANDLE_FALLBACK)} style={{ border: 'none', background: 'none', color: INK, fontWeight: 750, fontSize: 12.5, padding: '8px 0 0', cursor: 'pointer', fontFamily: 'inherit' }}>
            use my name for now
          </button>
        </div>
      </div>

      {scene === 'explainer' && (
        <>
          <div>
            <p style={paragraph}>Before you try it yourself, watch the whole journey in 35 seconds.</p>
            <p style={{ ...helper, marginTop: 6 }}>The video updates with your demo handle and works with sound off.</p>
          </div>
          <div style={{ width: 'min(100%, 286px)', margin: '0 auto', borderRadius: 26, overflow: 'hidden', background: '#171715', boxShadow: '0 18px 50px rgba(17, 17, 17, 0.16)' }}>
            <React.Suspense fallback={<div role="status" aria-label="Loading lesson video" style={{ width: '100%', aspectRatio: '9 / 16', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 13, fontWeight: 750 }}>Loading video…</div>}>
              <CreatorLessonOnePlayer handle={handle} />
            </React.Suspense>
          </div>
          <button type="button" className="creator-demo-pulse" onClick={() => setScene(1)} style={primaryBtn(true)}>Try the journey yourself</button>
        </>
      )}

      {scene === 1 && (
        <>
          <div>
            <p style={paragraph}>Now meet Priya — she just watched your reel about the Pondy Beach Houseparty. Your caption says: <i>"comment LINK and I'll send you everything."</i></p>
            <p style={{ ...paragraph, marginTop: 8 }}>Watch what happens when she does.</p>
          </div>
          <div style={{ ...card, overflow: 'hidden', background: '#101010', color: '#fff' }}>
            <div style={{ minHeight: 300, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'radial-gradient(circle at 70% 20%, rgba(230,176,107,0.45), transparent 32%), linear-gradient(155deg, #173a4b, #101010 68%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', color: INK, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 900 }}>{handle.slice(0, 1).toUpperCase()}</div>
                <div style={{ fontSize: 12.5, fontWeight: 800 }}>@{handle} · reel</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 850, lineHeight: 1.12, letterSpacing: -0.4, maxWidth: 270 }}>Pondy Beach Houseparty was unreal — comment LINK and I'll send you everything</div>
              <div style={{ padding: '11px 12px', borderRadius: 13, background: 'rgba(255,255,255,0.94)', color: INK, fontSize: 13.5, fontWeight: 750 }}>{FOLLOWER}: LINK</div>
            </div>
          </div>
          <button type="button" className="creator-demo-pulse" onClick={() => setScene(2)} style={primaryBtn(true)}>{FOLLOWER} comments "LINK"</button>
        </>
      )}

      {scene === 2 && (
        <>
          <div style={{ ...card, padding: 14, background: '#f8f8f9' }}>
            <div style={{ textAlign: 'center', paddingBottom: 12, borderBottom: `1px solid ${HAIR}` }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>@{handle}</div>
              <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>auto-DM · sent in seconds</div>
            </div>
            <div style={{ marginTop: 22, maxWidth: '88%', padding: '12px 13px', borderRadius: '5px 15px 15px 15px', background: '#fff', border: `1px solid ${HAIR}`, fontSize: 13.5, lineHeight: 1.5 }}>
              Hey Priya! Everything about the Pondy Beach Houseparty — the plan, dates, and booking, all in one place:
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              <button type="button" onClick={() => setScene(3)} style={{ ...secondaryBtn, padding: '10px 8px' }}>I need more details</button>
              <button type="button" onClick={() => setScene(3)} style={{ ...secondaryBtn, padding: '10px 8px' }}>Book Now</button>
            </div>
            <div style={{ ...helper, textAlign: 'center', marginTop: 9 }}>both buttons → chaptera.in/@{handle}</div>
          </div>
        </>
      )}

      {scene === 3 && (
        <>
          <div style={{ ...card, padding: 14, background: '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 850 }}>chapter அ</div>
              <AttributionTag handle={handle} />
            </div>
            <EventRows />
          </div>
          <p style={paragraph}>Whichever button she tapped, she lands here — the full chapter அ page. It answers her questions AND takes her booking. That's why there's only ever <b>one link: yours.</b> No per-event links, no payment-page links.</p>
          <p style={{ ...paragraph, color: MUTED }}>(How to set up this auto-DM for your own reels — and why the two buttons — is a later level. For now, stay in Priya's shoes.)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button type="button" onClick={() => setScene(1)} style={secondaryBtn}>Replay</button>
            <button type="button" onClick={exit} style={primaryBtn(true)}>Continue</button>
          </div>
        </>
      )}
    </div>
  );
}

export function DemoL2({ demoHandle, onDone }: DemoProps) {
  const [scene, setScene] = useState<1 | 2 | 3>(1);
  const [counter, setCounter] = useState(0);
  const [showCounterexample, setShowCounterexample] = useState(false);
  const [sawCounterexample, setSawCounterexample] = useState(false);
  const handle = handleFor(demoHandle);
  const complete = scene === 3 && sawCounterexample;
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

  const toggleCounterexample = () => {
    setShowCounterexample(current => {
      const next = !current;
      if (next) setSawCounterexample(true);
      return next;
    });
  };

  const replay = () => {
    setScene(1);
    setCounter(0);
    setShowCounterexample(false);
  };

  return (
    <div style={stack}>
      <p style={paragraph}>Priya's on the Pondy Beach Houseparty page — and notice the little tag riding along: <b>came from @{handle}</b>. As long as that tag is there, whatever she books is credited to you.</p>
      <p style={paragraph}>Walk her through it.</p>

      <div style={{ ...card, padding: 15, background: '#fafafa', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!showCounterexample && <AttributionTag handle={handle} />}
        {scene === 1 && (
          <>
            <div style={{ ...card, padding: 14 }}>
              <div style={{ fontSize: 17, fontWeight: 850 }}>{PRIMARY_EVENT.title}</div>
              <div style={{ ...helper, marginTop: 6 }}>dates · pickup points · {inr(PRIMARY_EVENT.price)}</div>
            </div>
            <button type="button" onClick={() => setScene(2)} style={primaryBtn(true)}>{FOLLOWER} applies</button>
          </>
        )}
        {scene === 2 && (
          <>
            <div style={{ textAlign: 'center', padding: '24px 10px' }}>
              <div style={{ width: 42, height: 42, margin: '0 auto 12px', borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', background: GREEN, fontWeight: 900 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>Application sent.</div>
              <div style={{ ...helper, marginTop: 4 }}>The payment page opens…</div>
            </div>
            <button type="button" onClick={() => setScene(3)} style={primaryBtn(true)}>{FOLLOWER} pays {inr(PRIMARY_EVENT.price)}</button>
          </>
        )}
        {scene === 3 && (
          <div style={{ textAlign: 'center', padding: '22px 8px' }}>
            <div style={{ width: 42, height: 42, margin: '0 auto 12px', borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', background: GREEN, fontWeight: 900 }}>✓</div>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Booking confirmed</div>
            <div aria-live="polite" style={{ fontSize: 44, lineHeight: 1, color: showCounterexample ? MUTED : GREEN, fontWeight: 900, letterSpacing: -1.4, marginTop: 18 }}>+{inr(showCounterexample ? 0 : counter)}</div>
            <div style={{ ...helper, marginTop: 8 }}>your commission · 8% of {inr(PRIMARY_EVENT.price)}</div>
          </div>
        )}
      </div>

      <button type="button" aria-pressed={showCounterexample} onClick={toggleCounterexample} style={secondaryBtn}>What if she books next week instead?</button>
      {showCounterexample && (
        <div style={{ padding: 14, borderRadius: 14, background: '#f7f7f8', color: INK, fontSize: 13.5, lineHeight: 1.55 }}>
          The "came from @{handle}" tag is gone — she came back directly, in a new visit. Commission: <b>₹0.</b> The booking has to happen in the visit your link started. (One more reason the auto-DM works so well: the link — and the booking — happen right there, in the moment.)
        </div>
      )}

      {scene === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button type="button" onClick={replay} style={secondaryBtn}>Replay</button>
          <ContinueButton enabled={complete} />
        </div>
      )}
    </div>
  );
}

export function DemoL3({ onDone }: DemoProps) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [tappedChips, setTappedChips] = useState<Set<number>>(new Set());
  const complete = flipped.size === DEMO_EVENTS.length && tappedChips.size === 3;
  useCompleteWhen(complete, onDone);
  const chips = [
    { label: 'Click', detail: '₹0. Clicks show reach, not income.' },
    { label: 'Sign-up', detail: "₹0. Interest isn't income either." },
    { label: 'Fully paid', detail: <><b>This</b> is when you earn. Every time.</> },
  ];

  return (
    <div style={stack}>
      <p style={paragraph}>You earn <b>up to 8% of the full ticket price</b> on every booking that comes through your link. Tap the events to see your cut.</p>
      <div style={{ display: 'grid', gap: 10 }}>
        {DEMO_EVENTS.map((event, index) => {
          const isFlipped = flipped.has(index);
          return (
            <button
              type="button"
              key={event.title}
              aria-pressed={isFlipped}
              onClick={() => setFlipped(current => new Set(current).add(index))}
              style={{ ...card, padding: 15, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', minHeight: 82, color: INK, transition: 'transform 0.2s, background 0.2s', background: isFlipped ? '#f0fdf4' : '#fff', transform: isFlipped ? 'rotateX(0deg)' : 'none' }}
            >
              <div style={{ fontSize: 14, fontWeight: 800 }}>{event.title}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: isFlipped ? GREEN : MUTED, fontWeight: isFlipped ? 850 : 650 }}>
                {isFlipped ? `your cut: ${inr(event.cut)}` : inr(event.price)}
              </div>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {chips.map((chip, index) => {
          const tapped = tappedChips.has(index);
          return (
            <button
              type="button"
              key={chip.label}
              aria-pressed={tapped}
              onClick={() => setTappedChips(current => new Set(current).add(index))}
              style={{ minHeight: 108, borderRadius: 14, padding: '12px 8px', border: `1.5px solid ${tapped ? INK : HAIR}`, background: tapped ? '#f7f7f8' : '#fff', color: INK, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 850 }}>{chip.label}</div>
              {tapped && <div style={{ marginTop: 8, fontSize: 10.5, color: MUTED, lineHeight: 1.4 }}>{chip.detail}</div>}
            </button>
          );
        })}
      </div>
      <p style={{ ...paragraph, color: MUTED }}>Commission runs on events where creator earnings are switched on — your dashboard always shows the exact per-event number, so there's never a surprise.</p>
      <ContinueButton enabled={complete} />
    </div>
  );
}

export function DemoL4({ demoHandle, onDone }: DemoProps) {
  const [funnelCaption, setFunnelCaption] = useState('');
  const [conversionTapped, setConversionTapped] = useState(false);
  const [copyTapped, setCopyTapped] = useState(false);
  const [copied, setCopied] = useState(false);
  const handle = handleFor(demoHandle);
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
      <p style={paragraph}>This is your dashboard — the real one, with demo numbers. You'll find it anytime at <b>chaptera.in/creator</b>. Three things to tap.</p>
      <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ ...helper, fontWeight: 700 }}>Earned in July</div>
          <div style={{ fontSize: 38, lineHeight: 1, fontWeight: 900, letterSpacing: -1.2, marginTop: 4 }}>{inr(DEMO_MONTH_EARNED)}</div>
          <div style={{ ...helper, marginTop: 7 }}>Paid out monthly.</div>
        </div>

        <div style={{ ...card, padding: 13 }}>
          <div style={eyebrow}>Your Custom Link</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 800, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>chaptera.in/@{handle}</div>
            <button type="button" onClick={() => { setCopyTapped(true); setCopied(true); }} style={{ border: 'none', borderRadius: 9, background: copied ? GREEN : INK, color: '#fff', fontSize: 12, fontWeight: 800, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
          {copyTapped && <div style={{ ...helper, marginTop: 9 }}>chaptera.in/@{handle} — the one link you'll ever share. This button is how it gets everywhere.</div>}
        </div>

        <div>
          <div style={{ ...eyebrow, marginBottom: 8 }}>Your funnel</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `1.5px solid ${HAIR}`, borderRadius: 14, overflow: 'hidden' }}>
            {tiles.map((tile, index) => (
              <button type="button" key={tile.label} onClick={() => setFunnelCaption(tile.caption)} style={{ border: 'none', borderLeft: index === 0 ? 'none' : `1px solid ${HAIR}`, background: funnelCaption === tile.caption ? '#f7f7f8' : '#fff', padding: '13px 4px', fontFamily: 'inherit', cursor: 'pointer' }}>
                <div style={{ fontSize: 23, fontWeight: 900 }}>{tile.value}</div>
                <div style={{ fontSize: 10.5, fontWeight: 800, marginTop: 4 }}>{tile.label}</div>
              </button>
            ))}
          </div>
          {funnelCaption && <div style={{ ...helper, marginTop: 8 }}>{funnelCaption}</div>}
        </div>

        <div>
          <div style={{ ...eyebrow, marginBottom: 8 }}>Your conversions</div>
          <button type="button" onClick={() => setConversionTapped(true)} style={{ ...card, width: '100%', padding: 13, display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', color: INK, fontFamily: 'inherit', cursor: 'pointer', background: conversionTapped ? '#f7f7f8' : '#fff' }}>
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
      <ContinueButton enabled={complete} />
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

  return (
    <div style={stack}>
      <p style={paragraph}>Simple rule: <b>you're paid monthly.</b> Everything you earn in a month is paid out after the month closes — straight to your UPI.</p>
      <div style={{ ...card, padding: 16 }}>
        <div style={{ ...helper, fontWeight: 700 }}>Earned in July</div>
        <div style={{ fontSize: 40, lineHeight: 1, fontWeight: 900, letterSpacing: -1.2, marginTop: 5 }}>{inr(DEMO_MONTH_EARNED)}</div>
        <div style={{ position: 'relative', display: 'grid', gap: 10, marginTop: 22 }}>
          <div aria-hidden="true" style={{ position: 'absolute', left: 20, top: 22, bottom: 22, width: 2, background: HAIR }} />
          {nodes.map((node, index) => {
            const isOpen = opened.has(index);
            return (
              <button type="button" key={node.title} aria-pressed={isOpen} onClick={() => setOpened(current => new Set(current).add(index))} style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 10px', border: `1.5px solid ${isOpen ? INK : HAIR}`, borderRadius: 14, background: '#fff', color: INK, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}>
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
      <ContinueButton enabled={complete} />
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
      <p style={paragraph}>Your dashboard answers this for you. The <b>"See upcoming events"</b> card lists every experience you can promote — with dates, and what each booking pays you.</p>
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: 15, borderBottom: `1px solid ${HAIR}` }}>
          <div style={{ fontSize: 15, fontWeight: 850 }}>See upcoming events</div>
          <div style={{ ...helper, marginTop: 3 }}>3 to promote · earn up to {inr(PRIMARY_EVENT.cut)} per booking</div>
        </div>
        {DEMO_EVENTS.map((event, index) => (
          <button type="button" key={event.title} onClick={() => openSheet(event.title)} style={{ width: '100%', padding: '13px 15px', border: 'none', borderTop: index === 0 ? 'none' : `1px solid ${HAIR}`, background: '#fff', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', color: INK, fontFamily: 'inherit', cursor: 'pointer' }}>
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
      <ContinueButton enabled={openedSheet && !sheetOpen} />

      <div style={{ position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 448, zIndex: 1000, pointerEvents: sheetOpen ? 'auto' : 'none' }}>
        <InvitePlanDetailsSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={sheetTitle}
          details={PONDY_DETAILS}
        />
      </div>
    </div>
  );
}

export function DemoL7({ demoHandle, onDone }: DemoProps) {
  const [pathStep, setPathStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const handle = handleFor(demoHandle);
  useCompleteWhen(hasRun, onDone);

  useEffect(() => {
    if (!running) return;
    if (pathStep >= 3) {
      setRunning(false);
      setHasRun(true);
      return;
    }
    const timeout = window.setTimeout(() => setPathStep(current => current + 1), 550);
    return () => window.clearTimeout(timeout);
  }, [running, pathStep]);

  const runPaths = () => {
    setPathStep(0);
    setRunning(true);
  };

  const bioSteps = ['watches your reel', 'opens your profile', 'finds and taps the bio link', 'club page'];
  const dmSteps = ['comments "LINK"', 'auto-DM arrives (two buttons, one link)', 'club page'];

  return (
    <div style={stack}>
      <p style={paragraph}>Remember how Priya reached your link in level 1? Comment → auto-DM. Now set it up from your side.</p>
      <p style={paragraph}><b>The play:</b> set your reels to auto-DM anyone who comments a keyword (like "LINK"). The DM carries your link — so the link goes <i>to them</i>, right in the moment they're interested.</p>
      <p style={paragraph}><b>The two buttons.</b> Give your auto-DM two buttons — <b>"I need more details"</b> and <b>"Book Now"</b> — and point <b>both at your same link.</b> Different people are in different mindsets when they tap; your chapter அ page serves both — it answers the details <i>and</i> takes the booking. Never two different links. One link: yours.</p>
      <p style={paragraph}><b>This is optional.</b> Your link in your bio works too. But we've tested both, and <b>auto-DM books more than bio</b> — nobody has to dig through your profile to find the link.</p>
      <p style={paragraph}><b>The tool we suggest: Superprofile</b> — it handles Instagram comment-to-DM automations well.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignItems: 'stretch' }}>
        <div style={{ ...card, padding: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 850 }}>Link in bio</div>
          <div style={{ display: 'grid', gap: 7, marginTop: 12 }}>
            {bioSteps.map((step, index) => {
              const lit = pathStep >= index;
              const litOpacity = Math.max(0.46, 1 - index * 0.18);
              return <div key={step} style={{ padding: '8px 7px', borderRadius: 9, background: lit ? '#f2f2f3' : '#fafafa', color: INK, fontSize: 10.5, lineHeight: 1.3, fontWeight: 750, opacity: lit ? litOpacity : 0.32, transition: 'opacity 0.3s, background 0.3s' }}>{step}</div>;
            })}
          </div>
          <div style={{ ...helper, fontSize: 10.5, marginTop: 11 }}>three hops — works, but people drop off along the way.</div>
        </div>
        <div style={{ ...card, borderColor: INK, padding: 12, position: 'relative' }}>
          <div style={{ display: 'inline-block', padding: '4px 7px', borderRadius: 999, background: INK, color: '#fff', fontSize: 8.5, fontWeight: 900, marginBottom: 7 }}>Tested: works better</div>
          <div style={{ fontSize: 13, fontWeight: 850 }}>Comment → auto-DM</div>
          <div style={{ display: 'grid', gap: 7, marginTop: 12 }}>
            {dmSteps.map((step, index) => {
              const lit = pathStep >= index;
              return <div key={step} style={{ padding: '8px 7px', borderRadius: 9, background: lit ? INK : '#fafafa', color: lit ? '#fff' : INK, fontSize: 10.5, lineHeight: 1.3, fontWeight: 750, opacity: lit ? 1 : 0.32, transition: 'opacity 0.3s, background 0.3s, color 0.3s' }}>{step}</div>;
            })}
          </div>
          <div style={{ ...helper, fontSize: 10.5, marginTop: 11 }}>the link comes to them — nothing to hunt for.</div>
        </div>
      </div>
      <button type="button" disabled={running} onClick={runPaths} style={primaryBtn(!running)}>Walk both paths</button>

      <div style={{ ...card, padding: 15, background: '#f8f8f9' }}>
        <div style={eyebrow}>your auto-DM</div>
        <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.55 }}>Hey! Everything about the trip — the plan, dates, and booking, all in one place: <b>chaptera.in/@{handle}</b></div>
        <div style={{ display: 'grid', gap: 8, marginTop: 13 }}>
          <div style={{ ...card, borderColor: '#d7d7db', padding: 10, fontSize: 11.5, fontWeight: 800 }}>I need more details <span style={{ color: MUTED }}>→ chaptera.in/@{handle}</span></div>
          <div style={{ ...card, borderColor: '#d7d7db', padding: 10, fontSize: 11.5, fontWeight: 800 }}>Book Now <span style={{ color: MUTED }}>→ chaptera.in/@{handle}</span></div>
        </div>
      </div>
      <ContinueButton enabled={hasRun} />
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

  return (
    <div style={stack}>
      <p style={paragraph}>Last one — and it's about taste.</p>
      <p style={paragraph}>chapter அ is a club people <i>want</i> into, and your audience follows you because they trust you. So we never run fake urgency, invented discounts, or "use my code" bait — there are no codes. There's your link, the real price, and your honest word that the experience is worth it.</p>
      <div style={{ display: 'grid', gap: 10 }}>
        {contrasts.map((contrast, index) => {
          const isRevealed = revealed.has(index);
          return (
            <button type="button" key={contrast.quote} aria-pressed={isRevealed} onClick={() => setRevealed(current => new Set(current).add(index))} style={{ ...card, padding: 17, minHeight: 142, textAlign: 'left', color: INK, fontFamily: 'inherit', cursor: 'pointer', background: isRevealed ? '#fafafa' : '#fff', borderColor: isRevealed ? contrast.color : HAIR }}>
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
      <ContinueButton enabled={complete} label="Finish the demo →" />
    </div>
  );
}
