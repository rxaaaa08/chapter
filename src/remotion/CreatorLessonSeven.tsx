import React from 'react';
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from 'remotion';

export const CREATOR_LESSON_SEVEN_FPS = 30;
export const CREATOR_LESSON_SEVEN_DURATION = 720;
export const CREATOR_LESSON_SEVEN_WIDTH = 1080;
export const CREATOR_LESSON_SEVEN_HEIGHT = 1920;

export type CreatorLessonSevenProps = { handle: string };

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
      <div style={{ position: 'absolute', width: 620, height: 620, borderRadius: '50%', top: -350, right: -270, background: C.orange, opacity: 0.16 }} />
      <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', bottom: -440, left: -360, background: C.mint, opacity: 0.3 }} />
      {children}
    </AbsoluteFill>
  );
};

const Brand: React.FC = () => <div style={{ fontSize: 34, fontWeight: 950, letterSpacing: -1 }}>chapter <span style={{ color: C.orange }}>அ</span></div>;

const Pill: React.FC<React.PropsWithChildren<{ dark?: boolean }>> = ({ children, dark = false }) => (
  <div style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '14px 21px', borderRadius: 999, background: dark ? C.ink : 'rgba(255,255,255,0.7)', color: dark ? C.white : C.ink, border: `2px solid ${dark ? C.ink : C.line}`, fontSize: 27, fontWeight: 900, letterSpacing: 1.8, textTransform: 'uppercase' }}>{children}</div>
);

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={100} background={C.violet}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '120px 78px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: interpolate(frame, [0, 18], [0, 1], { extrapolateRight: 'clamp', easing: EASE }) }}>
          <Pill>Lesson 07</Pill><Brand />
        </div>
        <div>
          <div style={{ fontSize: 112, lineHeight: 0.96, letterSpacing: -6, fontWeight: 950, translate: `0 ${interpolate(frame, [6, 30], [55, 0], { extrapolateRight: 'clamp', easing: EASE })}px`, opacity: interpolate(frame, [6, 26], [0, 1], { extrapolateRight: 'clamp' }) }}>
            Same reel.<br />Same follower.<br /><span style={{ color: '#493C83' }}>Two paths.</span>
          </div>
          <div style={{ marginTop: 48, maxWidth: 830, color: '#564E75', fontSize: 43, lineHeight: 1.28, fontWeight: 680, opacity: interpolate(frame, [20, 42], [0, 1], { extrapolateRight: 'clamp' }) }}>
            Watch Priya race from interest to your chapter அ link.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 29, fontWeight: 900 }}>
          <div style={{ flex: 1, padding: 22, textAlign: 'center', borderRadius: 22, background: C.white }}>BIO</div>
          <div style={{ fontSize: 40 }}>VS</div>
          <div style={{ flex: 1, padding: 22, textAlign: 'center', borderRadius: 22, background: C.ink, color: C.white }}>AUTO-DM</div>
        </div>
      </div>
    </Stage>
  );
};

const JourneyStep: React.FC<{ label: string; active: boolean; danger?: boolean; faded?: boolean }> = ({ label, active, danger = false, faded = false }) => (
  <div style={{ minHeight: 96, padding: '22px 24px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 18, border: `3px solid ${active ? danger ? '#F6B1B1' : C.ink : C.line}`, background: active ? danger ? '#FFF0F0' : C.white : '#F6F5F1', opacity: active ? faded ? 0.46 : 1 : 0.26 }}>
    <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: active ? danger ? C.red : C.ink : '#D7D6D1', color: C.white, fontSize: 23, fontWeight: 950 }}>{active ? danger ? '−' : '✓' : ''}</div>
    <div style={{ color: active && danger ? C.red : C.ink, fontSize: 29, lineHeight: 1.15, fontWeight: 820 }}>{label}</div>
  </div>
);

const Phone: React.FC<React.PropsWithChildren<{ title: string; accent: string; badge?: string }>> = ({ title, accent, badge, children }) => (
  <div style={{ width: 438, height: 1160, boxSizing: 'border-box', padding: 18, borderRadius: 72, background: C.ink, boxShadow: '0 34px 80px rgba(23,23,21,0.18)' }}>
    <div style={{ height: '100%', borderRadius: 55, background: '#F8F7F3', overflow: 'hidden', padding: '26px 24px', boxSizing: 'border-box' }}>
      <div style={{ width: 96, height: 8, borderRadius: 99, background: '#D5D4D0', margin: '0 auto 29px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingBottom: 22, borderBottom: `3px solid ${C.line}` }}>
        <div style={{ fontSize: 31, fontWeight: 950 }}>{title}</div>
        {badge && <div style={{ padding: '8px 12px', borderRadius: 999, background: accent, fontSize: 21, lineHeight: 1, fontWeight: 950 }}>{badge}</div>}
      </div>
      <div style={{ display: 'grid', gap: 16, marginTop: 24 }}>{children}</div>
    </div>
  </div>
);

const Race: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  const bioActive = [30, 88, 150, 222];
  const dmActive = [30, 74, 118, 162];
  return (
    <Stage duration={400} background={C.blue}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '92px 72px 88px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pill>The path race</Pill><Brand />
        </div>
        <div style={{ marginTop: 34, fontSize: 62, lineHeight: 1.04, letterSpacing: -2.8, fontWeight: 950 }}>Priya sees the same<br />Pondy reel.</div>
        <div style={{ display: 'flex', gap: 30, marginTop: 42 }}>
          <Phone title="Link in bio" accent={C.violet}>
            <JourneyStep label="Sees the reel" active={frame >= bioActive[0]} />
            <JourneyStep label={`Opens @${handle}`} active={frame >= bioActive[1]} faded={frame >= 260} />
            <JourneyStep label="Hunts for the link" active={frame >= bioActive[2]} faded={frame >= 260} />
            <JourneyStep label="Interest drops off" active={frame >= bioActive[3]} danger />
            <div style={{ marginTop: 22, padding: 22, borderRadius: 22, background: '#FFF0F0', color: C.red, textAlign: 'center', fontSize: 27, lineHeight: 1.25, fontWeight: 900, opacity: interpolate(frame, [222, 250], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>Too many hops.<br />Some people leave.</div>
          </Phone>
          <Phone title="Auto-DM" accent={C.mint} badge="FASTER">
            <JourneyStep label={'Comments "LINK"'} active={frame >= dmActive[0]} />
            <JourneyStep label="DM arrives" active={frame >= dmActive[1]} />
            <JourneyStep label="Taps a button" active={frame >= dmActive[2]} />
            <JourneyStep label="Club page opens" active={frame >= dmActive[3]} />
            <div style={{ marginTop: 22, padding: 22, borderRadius: 22, background: '#E8F8F0', color: '#167348', textAlign: 'center', lineHeight: 1.25, fontWeight: 900, opacity: interpolate(frame, [162, 190], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}><div style={{ fontSize: 22 }}>chaptera.in/@{handle}</div><div style={{ fontSize: 27, marginTop: 9 }}>The link comes to her<br />while interest is hot.</div></div>
          </Phone>
        </div>
        <div style={{ marginTop: 'auto', fontSize: 39, lineHeight: 1.25, fontWeight: 850 }}>Both work. Fewer hops win more bookings.</div>
      </div>
    </Stage>
  );
};

const TwoButtons: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={270} background={C.mint}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '94px 76px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Pill dark>Build this</Pill><Brand /></div>
        <div style={{ marginTop: 42, alignSelf: 'flex-start', fontSize: 76, lineHeight: 1.02, letterSpacing: -3.7, fontWeight: 950 }}>Two buttons.<br /><span style={{ color: '#167348' }}>One link.</span></div>
        <div style={{ width: 720, marginTop: 46, padding: 34, borderRadius: 48, background: C.white, border: `3px solid ${C.line}`, boxShadow: '0 28px 70px rgba(28,95,67,0.14)', scale: interpolate(frame, [0, 34], [0.88, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE }) }}>
          <div style={{ fontSize: 31, lineHeight: 1.4, fontWeight: 680 }}>Hey Priya! The plan, dates and booking are all in one place ↓</div>
          <div style={{ display: 'grid', gap: 18, marginTop: 28 }}>
            {['I need more details', 'Book Now'].map((label, index) => (
              <div key={label} style={{ padding: '24px 28px', borderRadius: 22, border: `3px solid ${C.ink}`, background: index === 0 ? C.white : C.ink, color: index === 0 ? C.ink : C.white, textAlign: 'center', fontSize: 31, fontWeight: 900, opacity: interpolate(frame, [34 + index * 22, 58 + index * 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>{label}</div>
            ))}
          </div>
          <div style={{ textAlign: 'center', color: C.muted, fontSize: 42, lineHeight: 1, margin: '20px 0 13px' }}>↓&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;↓</div>
          <div style={{ padding: 22, borderRadius: 21, background: C.orange, textAlign: 'center', fontSize: 29, fontWeight: 950 }}>chaptera.in/@{handle}</div>
        </div>
        <div style={{ marginTop: 42, maxWidth: 820, textAlign: 'center', fontSize: 40, lineHeight: 1.3, fontWeight: 820 }}>Details or booking—both mindsets land on your same useful page.</div>
        <div style={{ marginTop: 'auto', padding: '20px 28px', borderRadius: 999, background: C.ink, color: C.white, fontSize: 28, fontWeight: 900 }}>Suggested setup tool · Superprofile</div>
      </div>
    </Stage>
  );
};

export const CreatorLessonSeven: React.FC<CreatorLessonSevenProps> = ({ handle }) => {
  const normalized = safeHandle(handle);
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Sequence name="Lesson 7 title" from={0} durationInFrames={100}><Intro /></Sequence>
      <Sequence name="Bio versus auto-DM race" from={80} durationInFrames={400}><Race handle={normalized} /></Sequence>
      <Sequence name="Two buttons feed one link" from={450} durationInFrames={270}><TwoButtons handle={normalized} /></Sequence>
    </AbsoluteFill>
  );
};
