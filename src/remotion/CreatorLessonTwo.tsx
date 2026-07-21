import React from 'react';
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from 'remotion';

export const CREATOR_LESSON_TWO_FPS = 30;
export const CREATOR_LESSON_TWO_DURATION = 630;
export const CREATOR_LESSON_TWO_WIDTH = 1080;
export const CREATOR_LESSON_TWO_HEIGHT = 1920;

export type CreatorLessonTwoProps = { handle: string };

const C = {
  ink: '#171715',
  paper: '#F7F3EA',
  white: '#FFFEFA',
  orange: '#FF875E',
  mint: '#BFE5D5',
  violet: '#D8CBFF',
  blue: '#BFDDE8',
  green: '#1F9D63',
  red: '#D84C4C',
  muted: '#6F706A',
  line: 'rgba(23, 23, 21, 0.13)',
};

const FONT = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const safeHandle = (handle: string) => handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 40) || 'yourhandle';

const Stage: React.FC<React.PropsWithChildren<{ duration: number; background?: string }>> = ({ children, duration, background = C.paper }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background, color: C.ink, fontFamily: FONT, overflow: 'hidden', opacity: interpolate(frame, [0, 14, duration - 14, duration], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
      <div style={{ position: 'absolute', width: 610, height: 610, borderRadius: '50%', top: -340, right: -280, background: C.orange, opacity: 0.16 }} />
      <div style={{ position: 'absolute', width: 720, height: 720, borderRadius: '50%', bottom: -460, left: -370, background: C.mint, opacity: 0.3 }} />
      {children}
    </AbsoluteFill>
  );
};

const Brand: React.FC = () => <div style={{ fontSize: 34, fontWeight: 950, letterSpacing: -1 }}>chapter <span style={{ color: C.orange }}>அ</span></div>;
const Pill: React.FC<React.PropsWithChildren<{ dark?: boolean }>> = ({ children, dark = false }) => <div style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '14px 21px', borderRadius: 999, background: dark ? C.ink : 'rgba(255,255,255,0.72)', color: dark ? C.white : C.ink, border: `2px solid ${dark ? C.ink : C.line}`, fontSize: 27, fontWeight: 900, letterSpacing: 1.7, textTransform: 'uppercase' }}>{children}</div>;

const AttributionTag: React.FC<{ handle: string; glow?: number }> = ({ handle, glow = 0 }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 11, padding: '13px 18px', borderRadius: 999, background: '#E8F8F0', color: '#12623E', border: '2px solid #A7E4C5', boxShadow: `0 0 0 ${Math.round(glow * 16)}px rgba(31,157,99,${0.2 * (1 - glow)})`, fontSize: 26, fontWeight: 900 }}>
    <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.green }} /> came from @{handle}
  </div>
);

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={90} background={C.orange}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '120px 78px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Pill>Lesson 02</Pill><Brand /></div>
        <div>
          <div style={{ fontSize: 118, lineHeight: 0.94, letterSpacing: -6.5, fontWeight: 950, translate: `0 ${interpolate(frame, [4, 28], [58, 0], { extrapolateRight: 'clamp', easing: EASE })}px`, opacity: interpolate(frame, [4, 24], [0, 1], { extrapolateRight: 'clamp' }) }}>The tag<br />must survive<br /><span style={{ color: '#74321E' }}>the visit.</span></div>
          <div style={{ marginTop: 48, maxWidth: 830, color: '#71351F', fontSize: 43, lineHeight: 1.3, fontWeight: 720 }}>One visit carries your credit from link to payment.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', alignItems: 'center', gap: 14, fontSize: 26, fontWeight: 950 }}>
          {['LINK', 'PAY', '+₹296'].map((label, index) => (
            <React.Fragment key={label}><div style={{ padding: '22px 10px', borderRadius: 21, background: index === 2 ? C.ink : C.white, color: index === 2 ? C.white : C.ink, textAlign: 'center' }}>{label}</div>{index < 2 && <div style={{ fontSize: 40 }}>→</div>}</React.Fragment>
          ))}
        </div>
      </div>
    </Stage>
  );
};

const FlowCard: React.FC<React.PropsWithChildren<{ label: string; active: boolean }>> = ({ label, active, children }) => (
  <div style={{ padding: 28, borderRadius: 34, background: C.white, border: `3px solid ${active ? C.ink : C.line}`, opacity: active ? 1 : 0.24, boxShadow: active ? '0 22px 54px rgba(23,23,21,0.11)' : 'none' }}>
    <div style={{ color: C.muted, fontSize: 23, lineHeight: 1, fontWeight: 900, letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</div>
    {children}
  </div>
);

const SameVisit: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  const tagGlow = interpolate(frame % 42, [0, 21, 42], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const commission = Math.round(interpolate(frame, [150, 205], [0, 296], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE }));
  return (
    <Stage duration={300} background={C.mint}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '92px 76px 88px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Pill>Same visit</Pill><Brand /></div>
        <div style={{ marginTop: 34, fontSize: 70, lineHeight: 1.03, letterSpacing: -3.1, fontWeight: 950 }}>Day 1 · Priya taps<br />your creator link.</div>
        <div style={{ display: 'grid', gap: 22, marginTop: 38 }}>
          <FlowCard label="1 · Event page" active={frame >= 18}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginTop: 20 }}>
              <div><div style={{ fontSize: 34, fontWeight: 950 }}>Pondy Beach Houseparty</div><div style={{ color: C.muted, fontSize: 27, marginTop: 8, fontWeight: 700 }}>Aug 28 · ₹3,700</div></div>
              {frame >= 34 && <AttributionTag handle={handle} glow={tagGlow} />}
            </div>
          </FlowCard>
          <div style={{ height: 42, margin: '-10px 0', display: 'grid', placeItems: 'center', color: C.green, fontSize: 42, fontWeight: 950, opacity: frame >= 64 ? 1 : 0 }}>↓</div>
          <FlowCard label="2 · Payment" active={frame >= 72}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, marginTop: 19 }}><div style={{ fontSize: 36, fontWeight: 950 }}>Priya pays ₹3,700</div>{frame >= 92 && <AttributionTag handle={handle} glow={tagGlow} />}</div>
          </FlowCard>
          <div style={{ height: 42, margin: '-10px 0', display: 'grid', placeItems: 'center', color: C.green, fontSize: 42, fontWeight: 950, opacity: frame >= 120 ? 1 : 0 }}>↓</div>
          <FlowCard label="3 · Your dashboard" active={frame >= 132}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginTop: 17 }}>
              <div><div style={{ color: C.green, fontSize: 74, lineHeight: 1, letterSpacing: -2.8, fontWeight: 950 }}>+₹{commission}</div><div style={{ color: C.muted, fontSize: 25, marginTop: 8, fontWeight: 720 }}>your commission · 8%</div></div>
              {frame >= 148 && <AttributionTag handle={handle} glow={tagGlow} />}
            </div>
          </FlowCard>
        </div>
        <div style={{ marginTop: 'auto', fontSize: 40, lineHeight: 1.28, fontWeight: 850 }}>The same tag reaches payment. You get the credit.</div>
      </div>
    </Stage>
  );
};

const LaterVisit: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  const later = frame >= 72;
  return (
    <Stage duration={200} background={C.violet}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '94px 76px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Pill>A new visit</Pill><Brand /></div>
        <div style={{ marginTop: 36, fontSize: 70, lineHeight: 1.04, letterSpacing: -3.1, fontWeight: 950 }}>What if Priya<br />comes back later?</div>
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '310px 1fr', gap: 30, alignItems: 'stretch' }}>
          <div style={{ padding: 30, borderRadius: 42, background: C.white, border: `3px solid ${C.line}`, textAlign: 'center' }}>
            <div style={{ color: C.muted, fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2 }}>Calendar</div>
            <div style={{ marginTop: 34, color: later ? C.red : C.ink, fontSize: 132, lineHeight: 0.9, letterSpacing: -7, fontWeight: 950 }}>{later ? '8' : '1'}</div>
            <div style={{ color: C.muted, fontSize: 34, marginTop: 18, fontWeight: 850 }}>DAY</div>
            <div style={{ marginTop: 34, height: 8, borderRadius: 99, background: '#ECE9F6', overflow: 'hidden' }}><div style={{ height: '100%', width: `${interpolate(frame, [18, 92], [8, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}%`, background: C.red }} /></div>
          </div>
          <div style={{ padding: 32, borderRadius: 42, background: C.white, border: `3px solid ${C.line}`, opacity: later ? 1 : 0.36 }}>
            <div style={{ color: C.muted, fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 1.8 }}>Direct visit</div>
            <div style={{ marginTop: 30, fontSize: 37, lineHeight: 1.2, fontWeight: 950 }}>She types<br />chaptera.in</div>
            <div style={{ marginTop: 32, padding: '18px 20px', borderRadius: 18, background: '#FFF0F0', color: C.red, fontSize: 27, lineHeight: 1.25, fontWeight: 900, opacity: later ? 1 : 0 }}>No “came from @{handle}” tag</div>
            <div style={{ marginTop: 38, color: C.muted, fontSize: 78, lineHeight: 1, letterSpacing: -2.5, fontWeight: 950, opacity: later ? 1 : 0 }}>+₹0</div>
          </div>
        </div>
        <div style={{ marginTop: 46, padding: 28, borderRadius: 28, background: C.ink, color: C.white, fontSize: 39, lineHeight: 1.3, fontWeight: 820, opacity: interpolate(frame, [88, 116], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>A new direct visit starts without your tag, so it cannot credit you.</div>
        <div style={{ marginTop: 'auto', fontSize: 35, lineHeight: 1.3, fontWeight: 800 }}>That is why in-the-moment links—especially auto-DMs—matter.</div>
      </div>
    </Stage>
  );
};

const Summary: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={100} background={C.ink}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '120px 78px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: C.white }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Pill>Remember this</Pill><Brand /></div>
        <div style={{ fontSize: 116, lineHeight: 0.95, letterSpacing: -6.2, fontWeight: 950, opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' }), translate: `0 ${interpolate(frame, [0, 24], [50, 0], { extrapolateRight: 'clamp', easing: EASE })}px` }}>Same visit.<br /><span style={{ color: C.orange }}>Tag reaches pay.</span><br />You earn.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: C.ink, fontSize: 27, fontWeight: 950 }}><div style={{ flex: 1, padding: 22, borderRadius: 22, background: C.mint, textAlign: 'center' }}>YOUR LINK</div><div style={{ color: C.white, fontSize: 42 }}>→</div><div style={{ flex: 1, padding: 22, borderRadius: 22, background: C.orange, textAlign: 'center' }}>PAYMENT</div><div style={{ color: C.white, fontSize: 42 }}>→</div><div style={{ flex: 1, padding: 22, borderRadius: 22, background: C.violet, textAlign: 'center' }}>+₹296</div></div>
      </div>
    </Stage>
  );
};

export const CreatorLessonTwo: React.FC<CreatorLessonTwoProps> = ({ handle }) => {
  const normalized = safeHandle(handle);
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Sequence name="Lesson 2 title" from={0} durationInFrames={90}><Intro /></Sequence>
      <Sequence name="Tagged same-visit booking" from={70} durationInFrames={300}><SameVisit handle={normalized} /></Sequence>
      <Sequence name="Later direct visit has no tag" from={350} durationInFrames={200}><LaterVisit handle={normalized} /></Sequence>
      <Sequence name="Same-visit takeaway" from={530} durationInFrames={100}><Summary /></Sequence>
    </AbsoluteFill>
  );
};
