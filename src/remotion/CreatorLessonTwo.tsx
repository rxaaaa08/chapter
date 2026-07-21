import React from 'react';
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from 'remotion';

export const CREATOR_LESSON_TWO_FPS = 30;
export const CREATOR_LESSON_TWO_DURATION = 750;
export const CREATOR_LESSON_TWO_WIDTH = 1080;
export const CREATOR_LESSON_TWO_HEIGHT = 1920;

export type CreatorLessonTwoProps = { handle: string };

const C = {
  ink: '#171715',
  paper: '#F7F3EA',
  white: '#FFFEFA',
  orange: '#FF875E',
  yellow: '#FFDA32',
  mint: '#BFE5D5',
  violet: '#D8CBFF',
  green: '#1F9D63',
  muted: '#6F706A',
  line: 'rgba(23, 23, 21, 0.13)',
};

const FONT = '"DM Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const safeHandle = (handle: string) => handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 40) || 'yourhandle';

const Stage: React.FC<React.PropsWithChildren<{ duration: number; background?: string; dark?: boolean }>> = ({ children, duration, background = C.paper, dark = false }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background, color: dark ? C.white : C.ink, fontFamily: FONT, overflow: 'hidden', opacity: interpolate(frame, [0, 12, duration - 12, duration], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
      <div style={{ position: 'absolute', width: 620, height: 620, borderRadius: '50%', top: -360, right: -270, background: C.orange, opacity: dark ? 0.2 : 0.13 }} />
      <div style={{ position: 'absolute', width: 720, height: 720, borderRadius: '50%', bottom: -500, left: -390, background: C.mint, opacity: dark ? 0.1 : 0.28 }} />
      {children}
    </AbsoluteFill>
  );
};

const Brand: React.FC<{ light?: boolean }> = ({ light = false }) => <div style={{ color: light ? C.white : C.ink, fontSize: 34, fontWeight: 950, letterSpacing: -1 }}>chapter <span style={{ color: C.orange }}>அ</span></div>;
const Pill: React.FC<React.PropsWithChildren<{ dark?: boolean }>> = ({ children, dark = false }) => <div style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '14px 21px', borderRadius: 999, background: dark ? C.ink : 'rgba(255,255,255,0.76)', color: dark ? C.white : C.ink, border: `2px solid ${dark ? C.ink : C.line}`, fontSize: 27, lineHeight: 1, fontWeight: 950, letterSpacing: 1.6, textTransform: 'uppercase' }}>{children}</div>;

const AttributionTag: React.FC<{ handle: string; glow?: number }> = ({ handle, glow = 0 }) => <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11, padding: '13px 18px', borderRadius: 999, background: '#E8F8F0', color: '#12623E', border: '2px solid #A7E4C5', boxShadow: `0 0 0 ${Math.round(glow * 16)}px rgba(31,157,99,${0.2 * (1 - glow)})`, fontSize: 26, fontWeight: 950 }}><div style={{ width: 12, height: 12, borderRadius: '50%', background: C.green }} />came from @{handle}</div>;

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={95} background={C.orange}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '120px 78px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Pill>Lesson 02</Pill><Brand /></div>
        <div>
          <div style={{ fontSize: 124, lineHeight: 0.91, letterSpacing: -7, fontWeight: 950, opacity: interpolate(frame, [3, 23], [0, 1], { extrapolateRight: 'clamp' }), translate: `0 ${interpolate(frame, [3, 28], [65, 0], { extrapolateRight: 'clamp', easing: EASE })}px` }}>Follow<br />the little<br /><span style={{ color: '#74321E' }}>green tag.</span></div>
          <div style={{ marginTop: 52, maxWidth: 830, color: '#71351F', fontSize: 45, lineHeight: 1.28, fontWeight: 740 }}>It carries your credit from Priya's tap to your earnings.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: C.ink, fontSize: 27, fontWeight: 950 }}><div style={{ flex: 1, padding: 23, borderRadius: 22, background: C.white, textAlign: 'center' }}>YOUR LINK</div><div style={{ fontSize: 42 }}>→</div><div style={{ flex: 1, padding: 23, borderRadius: 22, background: C.mint, textAlign: 'center' }}>PONDY</div><div style={{ fontSize: 42 }}>→</div><div style={{ flex: 1, padding: 23, borderRadius: 22, background: C.ink, color: C.white, textAlign: 'center' }}>+₹259</div></div>
      </div>
    </Stage>
  );
};

const InfoCell: React.FC<{ label: string; value: string; right?: boolean; bottom?: boolean }> = ({ label, value, right = false, bottom = false }) => <div style={{ padding: '24px 25px', borderRight: right ? 'none' : '2px dashed rgba(23,23,21,0.28)', borderBottom: bottom ? 'none' : '2px dashed rgba(23,23,21,0.28)' }}><div style={{ color: C.muted, fontSize: 21, lineHeight: 1, fontWeight: 850, letterSpacing: 1.1, textTransform: 'uppercase' }}>{label}</div><div style={{ marginTop: 14, fontSize: 29, lineHeight: 1.16, fontWeight: 950 }}>{value}</div></div>;

const PlanPage: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  const glow = interpolate(frame % 48, [0, 24, 48], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Stage duration={195} background={C.yellow}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '88px 64px 78px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Pill dark>1 · The plan page</Pill><AttributionTag handle={handle} glow={glow} /></div>
        <div style={{ marginTop: 29, fontSize: 67, lineHeight: 1.03, letterSpacing: -3.1, fontWeight: 950 }}>Priya opens the real<br />Pondy experience.</div>
        <div style={{ flex: 1, minHeight: 0, marginTop: 34, borderRadius: 55, overflow: 'hidden', background: C.white, border: `3px solid ${C.line}`, boxShadow: '0 28px 75px rgba(90,72,0,0.2)', scale: interpolate(frame, [0, 30], [0.91, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE }) }}>
          <div style={{ height: 112, padding: '25px 30px', display: 'flex', alignItems: 'center', gap: 23, boxSizing: 'border-box', borderBottom: `2px solid ${C.line}` }}><div style={{ width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#F4F4F1', fontSize: 34, fontWeight: 950 }}>‹</div><div style={{ fontSize: 34, fontWeight: 950 }}>Pondy Beach Houseparty</div></div>
          <div style={{ padding: 30 }}>
            <div style={{ fontSize: 31, fontWeight: 950 }}>The Plan</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: 20, border: '2px dashed rgba(23,23,21,0.42)', borderRadius: 28, overflow: 'hidden', background: '#FAFAF8' }}>
              <InfoCell label="Meeting Spot" value="Airport metro" />
              <InfoCell label="Transport" value="Party bus" right />
              <InfoCell label="You'll Meet" value="Ppl who never say never" bottom />
              <InfoCell label="Gang Size" value="20 ppl" right bottom />
            </div>
            <div style={{ marginTop: 26, padding: 26, borderRadius: 28, background: '#F7F7F8', border: `2px solid ${C.line}` }}><div style={{ fontSize: 29, fontWeight: 950 }}>What's Included</div><div style={{ display: 'grid', gap: 15, marginTop: 19, fontSize: 25, lineHeight: 1.2, fontWeight: 700 }}>{['Party bus to our Pondy beach villa', 'Private pool & beach nearby', 'Campfire, BBQ dinner & stay'].map(item => <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 14 }}><span style={{ color: C.green, fontSize: 28 }}>✓</span>{item}</div>)}</div></div>
          </div>
        </div>
        <div style={{ marginTop: 29, fontSize: 38, lineHeight: 1.25, fontWeight: 850 }}>The tag is still there while she checks the details.</div>
      </div>
    </Stage>
  );
};

const PriceRow: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong = false }) => <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, padding: '19px 0', borderTop: `2px solid ${C.line}`, fontSize: strong ? 35 : 29, fontWeight: strong ? 950 : 780 }}><span style={{ color: strong ? C.ink : C.muted }}>{label}</span><span>{value}</span></div>;

const BookingPage: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={190} background={C.violet}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '90px 70px 82px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Pill>2 · Pick the date</Pill><Brand /></div>
        <div style={{ marginTop: 32, fontSize: 70, lineHeight: 1.03, letterSpacing: -3.2, fontWeight: 950 }}>The same visit moves<br />into booking.</div>
        <div style={{ flex: 1, minHeight: 0, marginTop: 38, padding: 34, borderRadius: 50, background: C.white, border: `3px solid ${C.line}`, boxShadow: '0 25px 65px rgba(54,42,93,0.15)', translate: `0 ${interpolate(frame, [0, 30], [110, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE })}px` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><div style={{ color: C.muted, fontSize: 23, fontWeight: 850, textTransform: 'uppercase', letterSpacing: 1.3 }}>August 2026</div><div style={{ marginTop: 8, fontSize: 38, fontWeight: 950 }}>Pondy Beach Houseparty</div></div><AttributionTag handle={handle} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, marginTop: 30 }}>
            {['24', '25', '26', '27', '28', '29', '30'].map(day => <div key={day} style={{ height: 72, borderRadius: 20, display: 'grid', placeItems: 'center', background: day === '28' ? C.yellow : '#F5F5F3', border: day === '28' ? `3px solid ${C.ink}` : `2px solid ${C.line}`, fontSize: 27, fontWeight: 950 }}>{day}</div>)}
          </div>
          <div style={{ marginTop: 28, padding: '21px 24px', borderRadius: 22, border: `2px solid ${C.line}`, fontSize: 28, fontWeight: 850 }}>Airport Metro — by 3:00 PM <span style={{ float: 'right' }}>⌄</span></div>
          <div style={{ marginTop: 28 }}><PriceRow label="Advance" value="₹2,600" /><PriceRow label="Remaining balance" value="₹1,100" /><PriceRow label="Full ticket" value="₹3,700" strong /></div>
        </div>
        <div style={{ marginTop: 30, fontSize: 38, lineHeight: 1.25, fontWeight: 850 }}>Date, pickup and price — the tag rides through all of it.</div>
      </div>
    </Stage>
  );
};

const PaymentBeat: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [36, 92], [0, 259], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE });
  return (
    <Stage duration={130} background={C.mint}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '110px 78px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
        <AttributionTag handle={handle} glow={interpolate(frame, [0, 30, 60], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
        <div><div style={{ width: 132, height: 132, margin: '0 auto', borderRadius: '50%', display: 'grid', placeItems: 'center', background: C.green, color: C.white, fontSize: 72, fontWeight: 950, scale: interpolate(frame, [3, 26], [0.45, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE }) }}>✓</div><div style={{ marginTop: 35, fontSize: 39, fontWeight: 900 }}>Priya's ₹3,700 booking is fully paid.</div><div style={{ marginTop: 43, color: C.green, fontSize: 142, lineHeight: 0.88, letterSpacing: -8, fontWeight: 950 }}>+₹{Math.round(progress)}</div><div style={{ marginTop: 23, fontSize: 35, fontWeight: 850 }}>your commission · 7%</div></div>
        <div style={{ fontSize: 36, lineHeight: 1.28, fontWeight: 850 }}>Payment completes the handoff. Your earnings land.</div>
      </div>
    </Stage>
  );
};

const DashboardBeat: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={140}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '98px 72px 88px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Pill>3 · Your dashboard</Pill><Brand /></div>
        <div style={{ marginTop: 40, fontSize: 76, lineHeight: 1.02, letterSpacing: -3.8, fontWeight: 950 }}>One paid ticket.<br /><span style={{ color: C.green }}>Every rupee itemised.</span></div>
        <div style={{ marginTop: 52, padding: 34, borderRadius: 42, background: C.white, border: `3px solid ${C.line}`, boxShadow: '0 25px 65px rgba(23,23,21,0.1)', opacity: interpolate(frame, [6, 28], [0, 1], { extrapolateRight: 'clamp' }), translate: `0 ${interpolate(frame, [6, 30], [70, 0], { extrapolateRight: 'clamp', easing: EASE })}px` }}>
          <div style={{ color: C.muted, fontSize: 24, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>Your conversions</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22, marginTop: 28 }}><div style={{ flex: 1 }}><div style={{ fontSize: 38, fontWeight: 950 }}>Pondy Beach Houseparty</div><div style={{ color: C.muted, fontSize: 27, marginTop: 9, fontWeight: 700 }}>1 ticket bought</div></div><div style={{ color: C.green, fontSize: 43, fontWeight: 950 }}>₹259</div></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginTop: 29, padding: '22px 24px', borderRadius: 22, background: '#F7F7F8' }}><span style={{ color: C.muted, fontSize: 26, fontWeight: 800 }}>Commission per ticket</span><span style={{ fontSize: 31, fontWeight: 950 }}>₹259</span></div>
          <div style={{ marginTop: 25 }}><AttributionTag handle={handle} /></div>
        </div>
        <div style={{ marginTop: 'auto', fontSize: 39, lineHeight: 1.27, fontWeight: 850 }}>Her booking is traceable all the way back to your link.</div>
      </div>
    </Stage>
  );
};

const Close: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={100} background={C.ink} dark>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '120px 78px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Pill>Remember this</Pill><Brand light /></div>
        <div style={{ fontSize: 118, lineHeight: 0.93, letterSpacing: -6.4, fontWeight: 950, opacity: interpolate(frame, [0, 22], [0, 1], { extrapolateRight: 'clamp' }), translate: `0 ${interpolate(frame, [0, 26], [54, 0], { extrapolateRight: 'clamp', easing: EASE })}px` }}>Your link<br />starts it.<br /><span style={{ color: C.orange }}>Full payment pays.</span></div>
        <div style={{ color: '#CACAC4', fontSize: 43, lineHeight: 1.3, fontWeight: 720 }}>chaptera.in/@{handle}<br />→ Pondy → fully paid → +₹259</div>
      </div>
    </Stage>
  );
};

export const CreatorLessonTwo: React.FC<CreatorLessonTwoProps> = ({ handle }) => {
  const normalized = safeHandle(handle);
  return <AbsoluteFill style={{ background: C.paper }}>
    <Sequence name="Follow the green tag" from={0} durationInFrames={95}><Hook /></Sequence>
    <Sequence name="Live Pondy plan page" from={75} durationInFrames={195}><PlanPage handle={normalized} /></Sequence>
    <Sequence name="Live-style date and price sheet" from={250} durationInFrames={190}><BookingPage handle={normalized} /></Sequence>
    <Sequence name="Full payment becomes commission" from={420} durationInFrames={130}><PaymentBeat handle={normalized} /></Sequence>
    <Sequence name="Creator dashboard conversion" from={530} durationInFrames={140}><DashboardBeat handle={normalized} /></Sequence>
    <Sequence name="Day-one takeaway" from={650} durationInFrames={100}><Close handle={normalized} /></Sequence>
  </AbsoluteFill>;
};
