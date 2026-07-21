import React from 'react';
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from 'remotion';

export const CREATOR_LESSON_ONE_FPS = 30;
export const CREATOR_LESSON_ONE_DURATION = 720;
export const CREATOR_LESSON_ONE_WIDTH = 1920;
export const CREATOR_LESSON_ONE_HEIGHT = 1080;

export type CreatorLessonOneProps = { handle: string };

const C = {
  ink: '#171715',
  paper: '#F7F3EA',
  white: '#FFFEFA',
  orange: '#FF875E',
  yellow: '#FFD832',
  mint: '#BFE5D5',
  violet: '#D8CBFF',
  green: '#1F9D63',
  muted: '#6F706A',
  line: 'rgba(23, 23, 21, 0.14)',
};

const FONT = '"DM Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const safeHandle = (handle: string) => handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 40) || 'yourhandle';
const STEPS = ['Comment', 'Auto-DM', 'Details', 'Trip page', 'Booking', '₹259 earned'];

const Stage: React.FC<React.PropsWithChildren<{ duration: number; background?: string; dark?: boolean }>> = ({ children, duration, background = C.paper, dark = false }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background, color: dark ? C.white : C.ink, fontFamily: FONT, overflow: 'hidden', opacity: interpolate(frame, [0, 12, duration - 12, duration], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
      <div style={{ position: 'absolute', width: 660, height: 660, borderRadius: '50%', top: -420, right: -190, background: C.orange, opacity: dark ? 0.18 : 0.12 }} />
      <div style={{ position: 'absolute', width: 760, height: 760, borderRadius: '50%', bottom: -560, left: -360, background: C.mint, opacity: dark ? 0.08 : 0.24 }} />
      {children}
    </AbsoluteFill>
  );
};

const Brand: React.FC<{ light?: boolean }> = ({ light = false }) => <div style={{ color: light ? C.white : C.ink, fontSize: 38, lineHeight: 1, fontWeight: 950, letterSpacing: -1.4 }}>chapter <span style={{ color: C.orange }}>அ</span></div>;

const AttributionTag: React.FC<{ handle: string; glow?: number }> = ({ handle, glow = 0 }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '11px 17px', borderRadius: 999, background: '#E8F8F0', color: '#12623E', border: '2px solid #A7E4C5', boxShadow: `0 0 0 ${Math.round(glow * 13)}px rgba(31,157,99,${0.2 * (1 - glow)})`, fontSize: 25, lineHeight: 1, fontWeight: 900 }}>
    <span style={{ width: 11, height: 11, borderRadius: '50%', background: C.green }} />came from @{handle}
  </div>
);

const Header: React.FC<{ step: number; label: string; light?: boolean }> = ({ step, label, light = false }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '11px 17px', borderRadius: 999, background: light ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.72)', border: `2px solid ${light ? 'rgba(255,255,255,0.22)' : C.line}`, color: light ? C.white : C.ink, fontSize: 23, lineHeight: 1, fontWeight: 900, letterSpacing: 1.1, textTransform: 'uppercase' }}>
      <span style={{ color: light ? C.yellow : C.orange }}>{String(step).padStart(2, '0')}</span>{label}
    </div>
    <Brand light={light} />
  </div>
);

const ProgressRail: React.FC<{ active: number; light?: boolean }> = ({ active, light = false }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
    {STEPS.map((step, index) => (
      <div key={step} style={{ minWidth: 0 }}>
        <div style={{ height: 5, borderRadius: 999, background: index <= active ? index === active ? C.yellow : C.green : light ? 'rgba(255,255,255,0.16)' : 'rgba(23,23,21,0.12)' }} />
        <div style={{ marginTop: 8, color: index === active ? light ? C.white : C.ink : light ? 'rgba(255,255,255,0.5)' : C.muted, fontSize: 17, lineHeight: 1, fontWeight: index === active ? 900 : 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{step}</div>
      </div>
    ))}
  </div>
);

const PostScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={145} background={C.yellow}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '62px 72px 50px', display: 'flex', flexDirection: 'column' }}>
        <Header step={1} label="Trip post" />
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '0.82fr 1.18fr', gap: 64, alignItems: 'center' }}>
          <div style={{ opacity: interpolate(frame, [0, 24], [0, 1], { extrapolateRight: 'clamp' }), translate: `0 ${interpolate(frame, [0, 28], [42, 0], { extrapolateRight: 'clamp', easing: EASE })}px` }}>
            <div style={{ color: '#725408', fontSize: 31, lineHeight: 1.15, fontWeight: 850 }}>Priya spots your Pondy post.</div>
            <div style={{ marginTop: 18, fontSize: 82, lineHeight: 0.94, letterSpacing: -4.5, fontWeight: 950 }}>One word<br />starts the<br /><span style={{ color: '#8B4B00' }}>whole journey.</span></div>
          </div>
          <div style={{ position: 'relative', height: 690, borderRadius: 42, overflow: 'hidden', background: C.white, border: `3px solid ${C.line}`, boxShadow: '0 30px 80px rgba(91,68,0,0.18)', scale: interpolate(frame, [0, 30], [0.92, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE }) }}>
            <div style={{ height: 390, position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #71C9DB 0%, #BFE5D5 48%, #FFDA91 49%, #FF875E 100%)' }}>
              <div style={{ position: 'absolute', width: 175, height: 175, borderRadius: '50%', top: 52, right: 72, background: '#FFF2A8' }} />
              <div style={{ position: 'absolute', left: 62, right: 62, bottom: 42, height: 170, borderRadius: '26px 26px 8px 8px', background: '#FFFEFA', boxShadow: '0 20px 45px rgba(41,83,84,0.2)' }}>
                <div style={{ position: 'absolute', left: 40, right: 40, bottom: -18, height: 86, borderRadius: 22, background: '#39A7B8', border: '9px solid #DDF7F7' }} />
                <div style={{ position: 'absolute', left: 60, top: 34, width: 190, height: 92, borderRadius: 12, background: C.orange }} />
                <div style={{ position: 'absolute', right: 60, top: 34, width: 190, height: 92, borderRadius: 12, background: C.violet }} />
              </div>
              <div style={{ position: 'absolute', left: 34, bottom: 28, padding: '9px 15px', borderRadius: 999, background: 'rgba(23,23,21,0.8)', color: C.white, fontSize: 20, fontWeight: 900 }}>PONDY · AUG 28</div>
            </div>
            <div style={{ padding: '25px 29px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}><div><div style={{ fontSize: 32, fontWeight: 950 }}>Pondy Beach Houseparty</div><div style={{ marginTop: 5, color: C.muted, fontSize: 22, fontWeight: 720 }}>Beach villa · party bus · one wild weekend</div></div><div style={{ fontSize: 28, fontWeight: 950 }}>₹3,700</div></div>
              <div style={{ marginTop: 23, padding: '17px 21px', borderRadius: 18, background: frame >= 44 ? '#FFF8DA' : '#F7F7F5', border: `2px solid ${frame >= 44 ? '#E1B800' : C.line}`, display: 'flex', alignItems: 'center', gap: 14, opacity: interpolate(frame, [35, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), translate: `0 ${interpolate(frame, [35, 60], [24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE })}px` }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', display: 'grid', placeItems: 'center', background: C.ink, color: C.white, fontSize: 20, fontWeight: 950 }}>P</div>
                <div style={{ flex: 1 }}><div style={{ color: C.muted, fontSize: 18, fontWeight: 800 }}>Priya comments</div><div style={{ marginTop: 2, fontSize: 30, fontWeight: 950 }}>Join</div></div>
                <div style={{ width: 17, height: 17, borderRadius: '50%', background: C.green, boxShadow: '0 0 0 8px rgba(31,157,99,0.12)' }} />
              </div>
            </div>
          </div>
        </div>
        <ProgressRail active={0} />
      </div>
    </Stage>
  );
};

const DmScene: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={150} background={C.violet}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '62px 72px 50px', display: 'flex', flexDirection: 'column' }}>
        <Header step={2} label="Auto-DM arrives" />
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '0.74fr 1.26fr', gap: 70, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 77, lineHeight: 0.96, letterSpacing: -4.1, fontWeight: 950 }}>Her comment<br />gets an<br /><span style={{ color: '#5639A1' }}>instant reply.</span></div>
            <div style={{ marginTop: 30 }}><AttributionTag handle={handle} glow={interpolate(frame % 48, [0, 24, 48], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} /></div>
          </div>
          <div style={{ height: 660, padding: 31, boxSizing: 'border-box', borderRadius: 42, background: C.white, border: `3px solid ${C.line}`, boxShadow: '0 30px 80px rgba(60,43,105,0.16)', opacity: interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' }), translate: `0 ${interpolate(frame, [0, 30], [50, 0], { extrapolateRight: 'clamp', easing: EASE })}px` }}>
            <div style={{ color: C.muted, fontSize: 19, fontWeight: 850, letterSpacing: 1.1, textTransform: 'uppercase' }}>Direct message to Priya</div>
            <div style={{ marginTop: 22, marginLeft: 'auto', width: '86%', padding: 23, borderRadius: '25px 25px 8px 25px', background: '#F2F2F4', fontSize: 24, lineHeight: 1.32, fontWeight: 720 }}>Hey! Everything about the trip — plan, dates and booking — is right here.</div>
            <div style={{ display: 'grid', gap: 13, marginTop: 22 }}>
              {['I need more details', 'Book Now'].map((label, index) => {
                const selected = index === 0 && frame >= 55;
                return <div key={label} style={{ position: 'relative', padding: '19px 24px', borderRadius: 18, border: `3px solid ${selected ? C.ink : C.line}`, background: selected ? C.yellow : C.white, textAlign: 'center', fontSize: 25, fontWeight: 900, scale: selected ? interpolate(frame, [55, 72, 95], [1, 1.045, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE }) : 1 }}>{label}{selected && <span style={{ position: 'absolute', right: 18, top: '50%', width: 23, height: 23, borderRadius: '50%', background: C.ink, translate: `0 ${interpolate(frame, [55, 75], [26, -12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE })}px` }} />}</div>;
              })}
            </div>
            <div style={{ marginTop: 24, padding: '16px 19px', borderRadius: 17, background: C.ink, color: C.white, textAlign: 'center', fontSize: 23, fontWeight: 900 }}>both buttons → chaptera.in/@{handle}</div>
          </div>
        </div>
        <ProgressRail active={frame < 55 ? 1 : 2} />
      </div>
    </Stage>
  );
};

const InfoCell: React.FC<{ label: string; value: string; right?: boolean; bottom?: boolean }> = ({ label, value, right = false, bottom = false }) => <div style={{ padding: '18px 20px', borderRight: right ? 'none' : '2px dashed rgba(23,23,21,0.24)', borderBottom: bottom ? 'none' : '2px dashed rgba(23,23,21,0.24)' }}><div style={{ color: C.muted, fontSize: 16, fontWeight: 850, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div><div style={{ marginTop: 8, fontSize: 23, lineHeight: 1.12, fontWeight: 950 }}>{value}</div></div>;

const PlanScene: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={175} background={C.mint}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '54px 72px 48px', display: 'flex', flexDirection: 'column' }}>
        <Header step={4} label="Real trip page" />
        <div style={{ flex: 1, minHeight: 0, marginTop: 24, display: 'grid', gridTemplateColumns: '0.69fr 1.31fr', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ color: '#21614A', fontSize: 28, fontWeight: 850 }}>She taps for details.</div>
            <div style={{ marginTop: 13, fontSize: 67, lineHeight: 0.98, letterSpacing: -3.4, fontWeight: 950 }}>The real Pondy<br />page opens.</div>
            <div style={{ marginTop: 26 }}><AttributionTag handle={handle} glow={interpolate(frame % 48, [0, 24, 48], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} /></div>
          </div>
          <div style={{ height: 730, borderRadius: 38, overflow: 'hidden', background: C.white, border: `3px solid ${C.line}`, boxShadow: '0 28px 75px rgba(28,91,68,0.15)', scale: interpolate(frame, [0, 28], [0.92, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE }) }}>
            <div style={{ height: 88, padding: '0 26px', display: 'flex', alignItems: 'center', gap: 18, borderBottom: `2px solid ${C.line}` }}><div style={{ width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#F4F4F1', fontSize: 27, fontWeight: 950 }}>‹</div><div style={{ flex: 1, fontSize: 28, fontWeight: 950 }}>Pondy Beach Houseparty</div><div style={{ fontSize: 25, fontWeight: 950 }}>₹3,700</div></div>
            <div style={{ padding: '22px 26px' }}>
              <div style={{ fontSize: 25, fontWeight: 950 }}>The Plan</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: 14, border: '2px dashed rgba(23,23,21,0.36)', borderRadius: 22, overflow: 'hidden', background: '#FAFAF8' }}>
                <InfoCell label="Meeting Spot" value="Airport Metro" />
                <InfoCell label="Transport" value="Party bus" right />
                <InfoCell label="You'll Meet" value="Ppl who never say never" bottom />
                <InfoCell label="Gang Size" value="20 ppl" right bottom />
              </div>
              <div style={{ marginTop: 18, padding: '19px 22px', borderRadius: 22, background: '#F7F7F8', border: `2px solid ${C.line}` }}><div style={{ fontSize: 23, fontWeight: 950 }}>What's Included</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, rowGap: 11, marginTop: 13, fontSize: 19, lineHeight: 1.18, fontWeight: 730 }}>{['Party bus to the Pondy beach villa', 'Private pool and beach nearby', 'Campfire and BBQ dinner', 'Next-morning brunch'].map(item => <div key={item} style={{ display: 'flex', gap: 9 }}><span style={{ color: C.green, fontWeight: 950 }}>✓</span>{item}</div>)}</div></div>
            </div>
          </div>
        </div>
        <ProgressRail active={3} />
      </div>
    </Stage>
  );
};

const BookingScene: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  const selected = Math.min(3, Math.floor(frame / 37));
  return (
    <Stage duration={175} background={C.orange}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '54px 72px 48px', display: 'flex', flexDirection: 'column' }}>
        <Header step={5} label="Booking" />
        <div style={{ flex: 1, minHeight: 0, marginTop: 22, display: 'grid', gridTemplateColumns: '0.72fr 1.28fr', gap: 58, alignItems: 'center' }}>
          <div>
            <div style={{ color: '#74321E', fontSize: 28, fontWeight: 850 }}>Priya chooses the trip.</div>
            <div style={{ marginTop: 14, fontSize: 68, lineHeight: 0.97, letterSpacing: -3.5, fontWeight: 950 }}>Date. Pickup.<br />Payment.<br /><span style={{ color: '#74321E' }}>Booked.</span></div>
          </div>
          <div style={{ height: 724, padding: 30, boxSizing: 'border-box', borderRadius: 38, background: C.white, border: `3px solid ${C.line}`, boxShadow: '0 28px 75px rgba(109,47,25,0.17)', translate: `0 ${interpolate(frame, [0, 28], [55, 0], { extrapolateRight: 'clamp', easing: EASE })}px` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}><div><div style={{ color: C.muted, fontSize: 17, fontWeight: 850, letterSpacing: 1, textTransform: 'uppercase' }}>Booking summary</div><div style={{ marginTop: 5, fontSize: 29, fontWeight: 950 }}>Pondy Beach Houseparty</div></div><AttributionTag handle={handle} /></div>
            <div style={{ display: 'grid', gap: 12, marginTop: 22 }}>
              {[
                ['Trip date', 'Aug 28'],
                ['Pickup point', 'Airport Metro · 3:00 PM'],
                ['Advance paid', '₹2,600'],
                ['Remaining balance', '₹1,100'],
              ].map(([label, value], index) => <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '14px 17px', borderRadius: 17, background: index <= selected ? '#F0FDF4' : '#F7F7F8', border: `2px solid ${index <= selected ? '#A7E4C5' : C.line}`, opacity: index <= selected ? 1 : 0.46 }}><div style={{ width: 31, height: 31, borderRadius: '50%', display: 'grid', placeItems: 'center', background: index <= selected ? C.green : '#DADAD7', color: C.white, fontSize: 17, fontWeight: 950 }}>{index <= selected ? '✓' : index + 1}</div><div style={{ flex: 1, color: C.muted, fontSize: 19, fontWeight: 780 }}>{label}</div><div style={{ fontSize: 22, fontWeight: 950 }}>{value}</div></div>)}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 19, padding: '18px 20px', borderRadius: 18, background: C.ink, color: C.white }}><span style={{ fontSize: 22, fontWeight: 830 }}>Full ticket paid</span><span style={{ color: C.yellow, fontSize: 32, fontWeight: 950 }}>₹3,700</span></div>
          </div>
        </div>
        <ProgressRail active={4} />
      </div>
    </Stage>
  );
};

const CommissionScene: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={150} background={C.ink} dark>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '62px 72px 50px', display: 'flex', flexDirection: 'column' }}>
        <Header step={6} label="Creator earnings" light />
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 24, alignItems: 'center' }}>
          <div style={{ padding: '34px 28px', borderRadius: 30, background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.12)', textAlign: 'center' }}><div style={{ color: '#B7B7B0', fontSize: 20, fontWeight: 850, textTransform: 'uppercase', letterSpacing: 1 }}>Fully paid</div><div style={{ marginTop: 12, fontSize: 49, fontWeight: 950 }}>₹3,700</div></div>
          <div style={{ color: C.yellow, fontSize: 50, fontWeight: 950 }}>×</div>
          <div style={{ padding: '34px 28px', borderRadius: 30, background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.12)', textAlign: 'center' }}><div style={{ color: '#B7B7B0', fontSize: 20, fontWeight: 850, textTransform: 'uppercase', letterSpacing: 1 }}>Your rate</div><div style={{ marginTop: 12, color: C.yellow, fontSize: 49, fontWeight: 950 }}>7%</div></div>
          <div style={{ color: C.yellow, fontSize: 50, fontWeight: 950 }}>=</div>
          <div style={{ padding: '33px 27px', borderRadius: 32, background: C.mint, color: C.ink, border: `3px solid ${C.green}`, textAlign: 'center', scale: interpolate(frame, [18, 55], [0.72, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE }), boxShadow: `0 0 0 ${Math.round(interpolate(frame, [25, 62, 90], [0, 24, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))}px rgba(191,229,213,0.16)` }}><div style={{ color: '#12623E', fontSize: 20, fontWeight: 850, textTransform: 'uppercase', letterSpacing: 1 }}>You earned</div><div style={{ marginTop: 9, color: C.green, fontSize: 65, lineHeight: 1, fontWeight: 950 }}>+₹{Math.round(interpolate(frame, [25, 82], [0, 259], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE }))}</div></div>
        </div>
        <div style={{ marginBottom: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 30 }}><div style={{ color: '#C8C8C1', fontSize: 28, fontWeight: 760 }}>Priya's booking traces back to chaptera.in/@{handle}</div><AttributionTag handle={handle} /></div>
        <ProgressRail active={5} light />
      </div>
    </Stage>
  );
};

export const CreatorLessonOne: React.FC<CreatorLessonOneProps> = ({ handle }) => {
  const normalized = safeHandle(handle);
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Sequence name="Priya comments Join" from={0} durationInFrames={145}><PostScene /></Sequence>
      <Sequence name="Auto-DM and details tap" from={125} durationInFrames={150}><DmScene handle={normalized} /></Sequence>
      <Sequence name="Live Pondy trip details" from={250} durationInFrames={175}><PlanScene handle={normalized} /></Sequence>
      <Sequence name="Pondy booking flow" from={400} durationInFrames={175}><BookingScene handle={normalized} /></Sequence>
      <Sequence name="Creator commission payoff" from={550} durationInFrames={170}><CommissionScene handle={normalized} /></Sequence>
    </AbsoluteFill>
  );
};
