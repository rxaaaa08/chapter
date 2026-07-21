import React from 'react';
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from 'remotion';

export const CREATOR_LESSON_ONE_FPS = 30;
export const CREATOR_LESSON_ONE_DURATION = 900;
export const CREATOR_LESSON_ONE_WIDTH = 1080;
export const CREATOR_LESSON_ONE_HEIGHT = 1920;

export type CreatorLessonOneProps = { handle: string };

const C = {
  ink: '#171715',
  paper: '#F7F3EA',
  white: '#FFFEFA',
  chat: '#F7F4EF',
  yellow: '#FFDA32',
  orange: '#FF875E',
  mint: '#BFE5D5',
  blue: '#BFDDE8',
  violet: '#D8CBFF',
  green: '#20A464',
  muted: '#74746E',
  line: 'rgba(23, 23, 21, 0.13)',
};

const FONT = '"DM Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const safeHandle = (handle: string) => handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 40) || 'yourhandle';

const Stage: React.FC<React.PropsWithChildren<{ duration: number; background?: string; dark?: boolean }>> = ({ children, duration, background = C.paper, dark = false }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background, color: dark ? C.white : C.ink, fontFamily: FONT, overflow: 'hidden', opacity: interpolate(frame, [0, 12, duration - 12, duration], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
      <div style={{ position: 'absolute', width: 620, height: 620, borderRadius: '50%', top: -360, right: -270, background: C.orange, opacity: dark ? 0.22 : 0.14 }} />
      <div style={{ position: 'absolute', width: 720, height: 720, borderRadius: '50%', bottom: -480, left: -380, background: C.mint, opacity: dark ? 0.12 : 0.28 }} />
      {children}
    </AbsoluteFill>
  );
};

const Brand: React.FC<{ light?: boolean }> = ({ light = false }) => <div style={{ color: light ? C.white : C.ink, fontSize: 35, fontWeight: 950, letterSpacing: -1 }}>chapter <span style={{ color: C.orange }}>அ</span></div>;
const Eyebrow: React.FC<React.PropsWithChildren<{ dark?: boolean }>> = ({ children, dark = false }) => <div style={{ display: 'inline-flex', alignSelf: 'flex-start', padding: '14px 21px', borderRadius: 999, background: dark ? C.ink : 'rgba(255,255,255,0.76)', color: dark ? C.white : C.ink, border: `2px solid ${dark ? C.ink : C.line}`, fontSize: 27, lineHeight: 1, fontWeight: 950, letterSpacing: 1.7, textTransform: 'uppercase' }}>{children}</div>;

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={100} background={C.violet}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '120px 78px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Eyebrow>Lesson 01</Eyebrow><Brand /></div>
        <div>
          <div style={{ fontSize: 120, lineHeight: 0.94, letterSpacing: -6.8, fontWeight: 950, opacity: interpolate(frame, [2, 22], [0, 1], { extrapolateRight: 'clamp' }), translate: `0 ${interpolate(frame, [2, 28], [62, 0], { extrapolateRight: 'clamp', easing: EASE })}px` }}>One comment<br />opens the<br /><span style={{ color: '#4E3F88' }}>whole club.</span></div>
          <div style={{ marginTop: 48, maxWidth: 810, color: '#514A70', fontSize: 44, lineHeight: 1.3, fontWeight: 720 }}>Priya never needs to hunt for your link.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 15, alignItems: 'center', fontSize: 28, fontWeight: 950 }}>
          {['REEL', 'DM', 'PONDY'].map((label, index) => <React.Fragment key={label}><div style={{ padding: '22px 10px', borderRadius: 22, background: index === 1 ? C.ink : C.white, color: index === 1 ? C.white : C.ink, textAlign: 'center' }}>{label}</div>{index < 2 && <div style={{ fontSize: 42 }}>→</div>}</React.Fragment>)}
        </div>
      </div>
    </Stage>
  );
};

const ReelScene: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={190} background={C.blue}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '96px 76px 90px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Eyebrow>1 · The reel</Eyebrow><div style={{ color: C.muted, fontSize: 31, fontWeight: 850 }}>@{handle}</div></div>
        <div style={{ marginTop: 34, fontSize: 76, lineHeight: 1.02, letterSpacing: -3.7, fontWeight: 950 }}>Your Pondy hook<br />does its job.</div>
        <div style={{ flex: 1, minHeight: 0, marginTop: 42, borderRadius: 62, padding: 38, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: C.white, overflow: 'hidden', background: 'radial-gradient(circle at 72% 18%, rgba(255,190,116,0.78), transparent 31%), linear-gradient(155deg, #24576C 0%, #10212A 72%)', boxShadow: '0 28px 80px rgba(18,50,67,0.22)', scale: interpolate(frame, [0, 28], [0.92, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE }) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 31, fontWeight: 900 }}><div style={{ width: 68, height: 68, borderRadius: '50%', background: C.white, color: C.ink, display: 'grid', placeItems: 'center', fontWeight: 950 }}>{handle.slice(0, 1).toUpperCase()}</div>@{handle} · reel</div>
          <div style={{ fontSize: 70, lineHeight: 1.03, letterSpacing: -3.2, fontWeight: 950 }}>Pondy was unreal.<div style={{ color: '#FFD8AB', marginTop: 22 }}>Comment LINK for everything.</div></div>
          <div style={{ padding: '27px 30px', borderRadius: 28, background: C.white, color: C.ink, fontSize: 38, fontWeight: 850, opacity: interpolate(frame, [82, 108], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), scale: interpolate(frame, [82, 112], [0.86, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE }) }}><span style={{ color: C.muted }}>Priya</span>&nbsp;&nbsp; LINK</div>
        </div>
        <div style={{ marginTop: 36, fontSize: 39, lineHeight: 1.27, fontWeight: 820 }}>Her comment starts the journey.</div>
      </div>
    </Stage>
  );
};

const DmScene: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={240}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '96px 76px 90px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Eyebrow>2 · The auto-DM</Eyebrow><Brand /></div>
        <div style={{ marginTop: 34, fontSize: 76, lineHeight: 1.02, letterSpacing: -3.7, fontWeight: 950 }}>The link comes<br />straight to Priya.</div>
        <div style={{ flex: 1, minHeight: 0, marginTop: 42, borderRadius: 58, padding: 38, background: C.white, border: `3px solid ${C.line}`, boxShadow: '0 26px 70px rgba(23,23,21,0.11)', display: 'flex', flexDirection: 'column', translate: `${interpolate(frame, [0, 32], [160, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE })}px 0` }}>
          <div style={{ textAlign: 'center', paddingBottom: 27, borderBottom: `3px solid ${C.line}` }}><div style={{ fontSize: 36, fontWeight: 950 }}>@{handle}</div><div style={{ color: C.muted, fontSize: 27, marginTop: 6, fontWeight: 700 }}>auto-DM · sent in seconds</div></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ maxWidth: 760, padding: '31px 34px', borderRadius: '10px 34px 34px 34px', background: '#F0F0ED', fontSize: 35, lineHeight: 1.42, fontWeight: 650, opacity: interpolate(frame, [30, 58], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>Hey Priya! The Pondy plan, dates and booking are all in one place ↓</div>
            <div style={{ display: 'grid', gap: 18, marginTop: 27 }}>
              {['I need more details', 'Book Now'].map((label, index) => <div key={label} style={{ position: 'relative', borderRadius: 24, padding: '25px 30px', border: `3px solid ${C.ink}`, background: index === 0 ? C.white : C.ink, color: index === 0 ? C.ink : C.white, textAlign: 'center', fontSize: 34, fontWeight: 900, opacity: interpolate(frame, [74 + index * 20, 100 + index * 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>{label}{index === 1 && <div style={{ position: 'absolute', inset: -10, borderRadius: 31, border: `5px solid ${C.orange}`, opacity: interpolate(frame, [142, 157, 176], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), scale: interpolate(frame, [142, 176], [0.88, 1.12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }} />}</div>)}
            </div>
          </div>
          <div style={{ padding: '21px 25px', borderRadius: 20, background: C.mint, textAlign: 'center', fontSize: 29, fontWeight: 900 }}>both buttons → chaptera.in/@{handle}</div>
        </div>
      </div>
    </Stage>
  );
};

const SendIcon: React.FC = () => <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>;

const WebsiteScene: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={320} background={C.yellow}>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '88px 66px 82px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Eyebrow dark>3 · The website</Eyebrow><div style={{ fontSize: 30, fontWeight: 900 }}>chaptera.in/@{handle}</div></div>
        <div style={{ marginTop: 31, fontSize: 68, lineHeight: 1.03, letterSpacing: -3, fontWeight: 950 }}>Her tap opens the<br />real experiences flow.</div>
        <div style={{ flex: 1, minHeight: 0, marginTop: 36, borderRadius: 55, background: C.chat, border: `3px solid ${C.line}`, overflow: 'hidden', boxShadow: '0 28px 75px rgba(90,72,0,0.2)', scale: interpolate(frame, [0, 30], [0.91, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE }) }}>
          <div style={{ height: 132, padding: '25px 31px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 21, background: C.white, borderBottom: `2px solid ${C.line}` }}>
            <div style={{ position: 'relative', width: 76, height: 76, borderRadius: 24, background: C.ink, color: C.yellow, display: 'grid', placeItems: 'center', fontSize: 37, fontWeight: 950 }}><span>அ</span><div style={{ position: 'absolute', right: -5, bottom: -5, width: 22, height: 22, borderRadius: '50%', background: C.green, border: `4px solid ${C.white}` }} /></div>
            <div><div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 35, fontWeight: 950 }}>chapter அ <span style={{ width: 23, height: 23, borderRadius: '50%', background: '#2F80ED', color: C.white, display: 'grid', placeItems: 'center', fontSize: 15 }}>✓</span></div><div style={{ color: C.muted, fontSize: 25, marginTop: 3, fontWeight: 650 }}>plans we dream</div></div>
          </div>
          <div style={{ padding: '28px 30px 36px', translate: `0 ${interpolate(frame, [20, 150], [155, -42], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE })}px` }}>
            <div style={{ width: '78%', padding: '29px 31px', borderRadius: '8px 30px 30px 30px', background: C.white, boxShadow: '0 5px 10px rgba(23,23,21,0.08)', fontSize: 34, lineHeight: 1.42, fontWeight: 620 }}>Veyil koluthu dhu leh! Anyways... What plan do you wanna join?</div>
            <div style={{ marginTop: 28, padding: 28, borderRadius: 35, background: C.white, border: `2px solid ${C.line}` }}>
              <div style={{ color: '#9A9AA2', fontSize: 24, lineHeight: 1, fontWeight: 900, letterSpacing: 1.5 }}>CHOOSE YOUR REPLY</div>
              <div style={{ display: 'grid', gap: 17, marginTop: 23 }}>
                {['Party at our Pondy beach-house', 'Catch a sunrise in Kovalam', 'Our Chill Sunday Meetups'].map((label, index) => {
                  const pondy = index === 0;
                  return <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, padding: '23px 28px', borderRadius: 999, background: C.yellow, fontSize: 31, lineHeight: 1.15, fontWeight: 850, boxShadow: pondy ? `0 0 0 ${interpolate(frame, [154, 178, 205], [0, 11, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}px rgba(255,135,94,0.34)` : 'none', scale: pondy ? interpolate(frame, [154, 178, 205], [1, 1.035, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE }) : 1 }}><span>{label}</span><SendIcon /></div>;
                })}
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 34, fontSize: 37, lineHeight: 1.28, fontWeight: 850 }}>The page answers questions and leads Priya to the Pondy plan.</div>
      </div>
    </Stage>
  );
};

const ClosingScene: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Stage duration={150} background={C.ink} dark>
      <div style={{ height: '100%', boxSizing: 'border-box', padding: '120px 78px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Eyebrow>Remember this</Eyebrow><Brand light /></div>
        <div><div style={{ fontSize: 128, lineHeight: 0.92, letterSpacing: -7, fontWeight: 950, opacity: interpolate(frame, [0, 24], [0, 1], { extrapolateRight: 'clamp' }), translate: `0 ${interpolate(frame, [0, 27], [58, 0], { extrapolateRight: 'clamp', easing: EASE })}px` }}>One link:<br /><span style={{ color: C.orange }}>yours.</span></div><div style={{ marginTop: 55, color: '#CACAC4', fontSize: 47, lineHeight: 1.28, fontWeight: 700 }}>chaptera.in/@{handle}<br />opens the full experiences flow.</div></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 16, alignItems: 'center', color: C.ink, fontSize: 28, fontWeight: 950 }}>{['REEL', 'DM', 'PONDY'].map((label, index) => <React.Fragment key={label}><div style={{ padding: '24px 10px', borderRadius: 22, background: index === 0 ? C.violet : index === 1 ? C.mint : C.orange, textAlign: 'center' }}>{label}</div>{index < 2 && <div style={{ color: C.white, fontSize: 42 }}>→</div>}</React.Fragment>)}</div>
      </div>
    </Stage>
  );
};

export const CreatorLessonOne: React.FC<CreatorLessonOneProps> = ({ handle }) => {
  const normalized = safeHandle(handle);
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Sequence name="Lesson 1 hook" from={0} durationInFrames={100}><IntroScene /></Sequence>
      <Sequence name="Pondy reel and LINK comment" from={80} durationInFrames={190}><ReelScene handle={normalized} /></Sequence>
      <Sequence name="Auto-DM and two buttons" from={245} durationInFrames={240}><DmScene handle={normalized} /></Sequence>
      <Sequence name="Real chapter experiences flow" from={455} durationInFrames={320}><WebsiteScene handle={normalized} /></Sequence>
      <Sequence name="One-link closing card" from={750} durationInFrames={150}><ClosingScene handle={normalized} /></Sequence>
    </AbsoluteFill>
  );
};
