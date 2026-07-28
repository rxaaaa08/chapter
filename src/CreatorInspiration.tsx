// Full-screen "Watch our videos" panel — the inspiration page reached from the
// "Need inspiration?" link at the bottom of the Submit-your-video card.
//
// Two tabs because two audiences need different examples: creators who shoot
// their own reels, and video editors who cut our event footage into highlight
// reels. Both tabs always show; an empty list renders a "coming soon" line
// rather than disappearing, so the layout stays stable as reels are added.
//
// Reels are a hardcoded list (creatorInspirationReels.ts). Each card opens its
// reel on Instagram in a new tab; on a phone the browser hands off to the IG app.
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CREATOR_INSPIRATION_REELS, EDITOR_INSPIRATION_REELS } from './creatorInspirationReels';

const INK = '#111';
const MUTED = '#9a9aa2';
const HAIR = '#ececed';
const AMBER = '#b45309';

type Audience = 'creators' | 'editors';

const INTRO: Record<Audience, string> = {
  creators: 'Here are our best performing videos. Take inspiration of our format, angles & script.',
  editors: 'Our best performing B-Roll videos. Take inspiration of our caption style & cuts.',
};

// `host` is the MobileShell overlay layer (App.tsx's data-mobile-shell-overlay-host);
// portaling into it clips the panel to the phone frame instead of covering the
// whole window — the same pattern the upcoming-events sheet uses.
export default function CreatorInspiration({ open, onClose, host }: { open: boolean; onClose: () => void; host: HTMLElement | null }) {
  const [tab, setTab] = useState<Audience>('creators');

  // Freeze the dashboard scroller behind the panel while it is open, so the page
  // underneath doesn't scroll (mirrors CreatorUpcomingEvents' sheet).
  useEffect(() => {
    if (!open || !host) return;
    const shellScroller = host.parentElement?.querySelector<HTMLElement>('[data-mobile-shell-scroll]');
    if (!shellScroller) return;
    const previous = shellScroller.style.overflowY;
    shellScroller.style.overflowY = 'hidden';
    return () => { shellScroller.style.overflowY = previous; };
  }, [open, host]);

  if (!open || !host) return null;

  const reels = tab === 'creators' ? CREATOR_INSPIRATION_REELS : EDITOR_INSPIRATION_REELS;

  const tabBtn = (key: Audience, label: string) => {
    const active = tab === key;
    return (
      <button
        type="button"
        onClick={() => setTab(key)}
        style={{ flex: 1, border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 13, fontWeight: active ? 800 : 600, fontFamily: 'inherit', cursor: 'pointer', background: active ? '#fff' : 'transparent', color: active ? INK : MUTED, boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}
      >
        {label}
      </button>
    );
  };

  return createPortal(
    <div style={{ position: 'absolute', inset: 0, background: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto', pointerEvents: 'auto', WebkitOverflowScrolling: 'touch' }}>
      {/* Header — back arrow returns to the dashboard, which stays mounted behind. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', position: 'sticky', top: 0, background: '#fff' }}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid ' + HAIR, background: '#fff', display: 'grid', placeItems: 'center', fontSize: 18, color: INK, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          ←
        </button>
        <div style={{ fontSize: 15, fontWeight: 800, color: INK }}>Watch our videos</div>
      </div>

      <div style={{ padding: '14px 16px 24px', maxWidth: 480, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {/* Audience switch. */}
        <div style={{ display: 'flex', background: '#f4f4f5', borderRadius: 10, padding: 4, gap: 4 }}>
          {tabBtn('creators', 'For creators')}
          {tabBtn('editors', 'For video editors')}
        </div>

        <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, margin: '14px 2px 12px' }}>{INTRO[tab]}</div>

        {reels.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reels.map(reel => (
              <a
                key={reel.instagramUrl}
                href={reel.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', border: '1px solid ' + HAIR, borderRadius: 12, padding: '12px 14px' }}
              >
                <span style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: '#FEF3E2', color: AMBER, display: 'grid', placeItems: 'center', fontSize: 9 }} aria-hidden="true">▶</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 750, color: INK, lineHeight: 1.35 }}>{reel.title}</span>
                <span style={{ fontSize: 16, color: MUTED, flexShrink: 0 }} aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, textAlign: 'center', padding: '24px 0' }}>More coming soon.</div>
        )}
      </div>
    </div>,
    host,
  );
}
