import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  useCurrentFrame,
} from 'remotion';

export const CREATOR_LESSON_ONE_FPS = 30;
export const CREATOR_LESSON_ONE_DURATION = 1050;
export const CREATOR_LESSON_ONE_WIDTH = 1080;
export const CREATOR_LESSON_ONE_HEIGHT = 1920;

export type CreatorLessonOneProps = {
  handle: string;
};

const COLORS = {
  ink: '#171715',
  paper: '#F6F3EA',
  white: '#FFFEFA',
  ocean: '#183B4E',
  blue: '#BFDDE8',
  mint: '#BFE5D5',
  orange: '#FF875E',
  violet: '#D8CBFF',
  muted: '#6F706A',
  line: 'rgba(23, 23, 21, 0.12)',
};

const FONT = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

const safeHandle = (handle: string) => (
  handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 40) || 'yourhandle'
);

const enterStyle = (frame: number, delay = 0, distance = 48): React.CSSProperties => ({
  opacity: interpolate(frame, [delay, delay + 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT,
  }),
  translate: `0 ${interpolate(frame, [delay, delay + 24], [distance, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT,
  })}px`,
});

const Scene: React.FC<React.PropsWithChildren<{ duration: number; background?: string }>> = ({
  children,
  duration,
  background = COLORS.paper,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background,
        color: COLORS.ink,
        fontFamily: FONT,
        opacity: interpolate(frame, [0, 18, duration - 18, duration], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 560,
          height: 560,
          borderRadius: '50%',
          top: -250,
          right: -230,
          background: COLORS.orange,
          opacity: 0.14,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 640,
          height: 640,
          borderRadius: '50%',
          bottom: -390,
          left: -310,
          background: COLORS.mint,
          opacity: 0.3,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

const Brand: React.FC<{ dark?: boolean }> = ({ dark = false }) => (
  <div style={{ color: dark ? COLORS.white : COLORS.ink, fontSize: 34, fontWeight: 900, letterSpacing: -1.2 }}>
    chapter <span style={{ color: COLORS.orange }}>அ</span>
  </div>
);

const Eyebrow: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div
    style={{
      display: 'inline-flex',
      alignSelf: 'flex-start',
      padding: '15px 23px',
      border: `2px solid ${COLORS.line}`,
      borderRadius: 999,
      background: 'rgba(255, 254, 250, 0.72)',
      fontSize: 28,
      fontWeight: 850,
      letterSpacing: 2.2,
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const labels = ['REEL', 'AUTO-DM', 'chapter அ'];
  return (
    <Scene duration={150}>
      <div style={{ padding: '120px 76px 130px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ ...enterStyle(frame, 0, 26), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>Lesson 01</Eyebrow>
          <Brand />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ ...enterStyle(frame, 10), fontSize: 116, lineHeight: 0.96, letterSpacing: -6.5, fontWeight: 900 }}>
            One comment.<br />
            One link.<br />
            <span style={{ color: COLORS.ocean }}>A full journey.</span>
          </div>
          <div style={{ ...enterStyle(frame, 24), marginTop: 50, maxWidth: 820, fontSize: 42, lineHeight: 1.3, color: COLORS.muted, fontWeight: 620 }}>
            See how a follower goes from your reel to every chapter அ experience.
          </div>
        </div>
        <div style={{ ...enterStyle(frame, 42), display: 'flex', alignItems: 'center', gap: 18 }}>
          {labels.map((label, index) => (
            <React.Fragment key={label}>
              <div style={{ padding: '22px 25px', borderRadius: 20, background: index === 0 ? COLORS.violet : index === 1 ? COLORS.mint : COLORS.orange, fontSize: 25, fontWeight: 900, letterSpacing: 0.8 }}>
                {label}
              </div>
              {index < labels.length - 1 && <div style={{ flex: 1, height: 4, borderRadius: 99, background: COLORS.ink, opacity: 0.2 }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Scene>
  );
};

const ReelScene: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  const commentProgress = interpolate(frame, [92, 122], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_OUT,
  });
  return (
    <Scene duration={290} background={COLORS.blue}>
      <div style={{ padding: '104px 76px 92px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div style={{ ...enterStyle(frame, 5), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>1 · The reel</Eyebrow>
          <div style={{ fontSize: 30, fontWeight: 800, color: COLORS.muted }}>@{handle}</div>
        </div>
        <div style={{ ...enterStyle(frame, 12), fontSize: 82, lineHeight: 1.02, letterSpacing: -4, fontWeight: 900 }}>
          Priya sees your<br />Pondy houseparty reel.
        </div>
        <div
          style={{
            ...enterStyle(frame, 24),
            flex: 1,
            minHeight: 0,
            borderRadius: 64,
            padding: 38,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            boxShadow: '0 28px 80px rgba(18, 50, 67, 0.2)',
            background: 'radial-gradient(circle at 72% 18%, rgba(255, 184, 118, 0.72), transparent 30%), linear-gradient(155deg, #24576C 0%, #10212A 70%)',
            color: COLORS.white,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 31, fontWeight: 850 }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', display: 'grid', placeItems: 'center', background: COLORS.white, color: COLORS.ink, fontWeight: 950 }}>
              {handle.slice(0, 1).toUpperCase()}
            </div>
            @{handle} · reel
          </div>
          <div style={{ padding: '0 4px 20px', fontSize: 70, lineHeight: 1.03, letterSpacing: -3.2, fontWeight: 900 }}>
            Pondy was unreal.
            <div style={{ color: '#FFD7A9', marginTop: 22 }}>Comment LINK for everything.</div>
          </div>
          <div
            style={{
              opacity: commentProgress,
              scale: 0.88 + commentProgress * 0.12,
              padding: '28px 31px',
              borderRadius: 28,
              background: COLORS.white,
              color: COLORS.ink,
              fontSize: 38,
              fontWeight: 800,
              boxShadow: '0 14px 40px rgba(0, 0, 0, 0.24)',
            }}
          >
            <span style={{ color: COLORS.muted }}>Priya</span>&nbsp;&nbsp; LINK
          </div>
        </div>
        <div style={{ ...enterStyle(frame, 145), fontSize: 38, lineHeight: 1.28, fontWeight: 740 }}>
          Her one-word comment starts the journey.
        </div>
      </div>
    </Scene>
  );
};

const DmScene: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Scene duration={300}>
      <div style={{ padding: '104px 76px 92px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div style={{ ...enterStyle(frame, 4), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>2 · The auto-DM</Eyebrow>
          <Brand />
        </div>
        <div style={{ ...enterStyle(frame, 12), fontSize: 82, lineHeight: 1.02, letterSpacing: -4, fontWeight: 900 }}>
          “LINK” opens<br />a helpful DM.
        </div>
        <div style={{ ...enterStyle(frame, 26), flex: 1, minHeight: 0, padding: 38, borderRadius: 58, background: COLORS.white, border: `3px solid ${COLORS.line}`, boxShadow: '0 26px 70px rgba(23, 23, 21, 0.11)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ textAlign: 'center', paddingBottom: 28, borderBottom: `3px solid ${COLORS.line}` }}>
            <div style={{ fontSize: 36, fontWeight: 900 }}>@{handle}</div>
            <div style={{ fontSize: 26, color: COLORS.muted, marginTop: 5, fontWeight: 650 }}>auto-DM · sent in seconds</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ ...enterStyle(frame, 58, 36), maxWidth: 760, padding: '31px 34px', borderRadius: '10px 34px 34px 34px', background: '#F0F0ED', fontSize: 34, lineHeight: 1.42, fontWeight: 620 }}>
              Hey Priya! The plan, dates and booking for Pondy are all in one place ↓
            </div>
            <div style={{ display: 'grid', gap: 18, marginTop: 26 }}>
              {['I need more details', 'Book Now'].map((label, index) => (
                <div key={label} style={{ ...enterStyle(frame, 94 + index * 16, 30), borderRadius: 24, padding: '25px 30px', border: `3px solid ${COLORS.ink}`, background: index === 0 ? COLORS.white : COLORS.ink, color: index === 0 ? COLORS.ink : COLORS.white, textAlign: 'center', fontSize: 34, fontWeight: 850 }}>
                  {label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ ...enterStyle(frame, 145, 20), padding: '21px 25px', borderRadius: 20, background: COLORS.mint, textAlign: 'center', fontSize: 28, fontWeight: 850 }}>
            both buttons → chaptera.in/@{handle}
          </div>
        </div>
        <div style={{ ...enterStyle(frame, 168), fontSize: 38, lineHeight: 1.28, fontWeight: 740 }}>
          Two choices. The same useful destination.
        </div>
      </div>
    </Scene>
  );
};

const EventRow: React.FC<{ name: string; meta: string; accent: string; delay: number }> = ({ name, meta, accent, delay }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ ...enterStyle(frame, delay, 32), display: 'flex', alignItems: 'center', gap: 24, padding: 24, borderTop: `3px solid ${COLORS.line}` }}>
      <div style={{ width: 112, height: 112, borderRadius: 24, flexShrink: 0, background: accent }} />
      <div>
        <div style={{ fontSize: 35, lineHeight: 1.16, fontWeight: 900 }}>{name}</div>
        <div style={{ fontSize: 27, color: COLORS.muted, marginTop: 9, fontWeight: 650 }}>{meta}</div>
      </div>
    </div>
  );
};

const LandingScene: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Scene duration={250} background={COLORS.violet}>
      <div style={{ padding: '104px 76px 92px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 40 }}>
        <div style={{ ...enterStyle(frame, 4), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>3 · The destination</Eyebrow>
          <div style={{ fontSize: 30, fontWeight: 800, color: COLORS.muted }}>one club page</div>
        </div>
        <div style={{ ...enterStyle(frame, 10), fontSize: 82, lineHeight: 1.02, letterSpacing: -4, fontWeight: 900 }}>
          Both buttons open<br />the full club page.
        </div>
        <div style={{ ...enterStyle(frame, 22), flex: 1, minHeight: 0, borderRadius: 58, background: COLORS.white, border: `3px solid ${COLORS.line}`, boxShadow: '0 26px 70px rgba(54, 42, 93, 0.14)', overflow: 'hidden' }}>
          <div style={{ padding: '35px 34px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <Brand />
            <div style={{ padding: '15px 20px', borderRadius: 999, background: COLORS.mint, color: '#126044', fontSize: 24, fontWeight: 900 }}>
              came from @{handle}
            </div>
          </div>
          <div style={{ padding: '6px 34px 27px', fontSize: 46, fontWeight: 900, letterSpacing: -1.7 }}>Pick your next story</div>
          <EventRow name="Pondy Beach Houseparty" meta="Aug 28 · ₹3,700" accent="linear-gradient(145deg, #173A4B, #E6B06B)" delay={58} />
          <EventRow name="Sunrise at Kovalam" meta="Aug 24 · ₹900" accent="linear-gradient(145deg, #F7C969, #73B5B6)" delay={75} />
          <EventRow name="Chill Sunday Meetup" meta="Aug 2 · ₹359" accent="linear-gradient(145deg, #E6A9A9, #6D7FA8)" delay={92} />
        </div>
        <div style={{ ...enterStyle(frame, 126), fontSize: 36, lineHeight: 1.3, fontWeight: 740 }}>
          Details and booking live together—never on a random payment page.
        </div>
      </div>
    </Scene>
  );
};

const SummaryScene: React.FC<{ handle: string }> = ({ handle }) => {
  const frame = useCurrentFrame();
  return (
    <Scene duration={140} background={COLORS.ink}>
      <div style={{ padding: '120px 76px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: COLORS.white }}>
        <div style={{ ...enterStyle(frame, 0), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Eyebrow>Remember this</Eyebrow>
          <Brand dark />
        </div>
        <div>
          <div style={{ ...enterStyle(frame, 12), fontSize: 128, lineHeight: 0.92, letterSpacing: -7, fontWeight: 950 }}>
            One link:<br />
            <span style={{ color: COLORS.orange }}>yours.</span>
          </div>
          <div style={{ ...enterStyle(frame, 28), marginTop: 56, fontSize: 46, lineHeight: 1.27, color: '#C9C9C2', fontWeight: 650 }}>
            chaptera.in/@{handle}<br />opens the full experiences page.
          </div>
        </div>
        <div style={{ ...enterStyle(frame, 48), display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', alignItems: 'center', gap: 16, color: COLORS.ink }}>
          {['REEL', 'DM', 'BOOK'].map((label, index) => (
            <React.Fragment key={label}>
              <div style={{ padding: '24px 12px', textAlign: 'center', borderRadius: 22, background: index === 0 ? COLORS.violet : index === 1 ? COLORS.mint : COLORS.orange, fontSize: 27, fontWeight: 950 }}>{label}</div>
              {index < 2 && <div style={{ color: COLORS.white, fontSize: 42, fontWeight: 900 }}>→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </Scene>
  );
};

export const CreatorLessonOne: React.FC<CreatorLessonOneProps> = ({ handle }) => {
  const normalizedHandle = safeHandle(handle);
  return (
    <AbsoluteFill style={{ background: COLORS.paper }}>
      <Sequence name="Lesson title" from={0} durationInFrames={150}>
        <IntroScene />
      </Sequence>
      <Sequence name="Follower sees the reel" from={130} durationInFrames={290}>
        <ReelScene handle={normalizedHandle} />
      </Sequence>
      <Sequence name="Auto-DM arrives" from={400} durationInFrames={300}>
        <DmScene handle={normalizedHandle} />
      </Sequence>
      <Sequence name="Full experiences page" from={680} durationInFrames={250}>
        <LandingScene handle={normalizedHandle} />
      </Sequence>
      <Sequence name="One-link takeaway" from={910} durationInFrames={140}>
        <SummaryScene handle={normalizedHandle} />
      </Sequence>
    </AbsoluteFill>
  );
};
