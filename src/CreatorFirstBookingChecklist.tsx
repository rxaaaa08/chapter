// Creator dashboard — creator checklist (Phase I / I3, extended in J3).
//
// A persistent card for BRAND-NEW creators that carries onboarding past signup
// to the real finish line: their first paid booking. Six steps —
//   ① Join the creator group chat  (opens the chat link, ticks on tap)
//   ② Open the Drive footage folder (opens the Drive link, ticks on tap)
//   ③ Copy your custom link         (ticks when the dashboard's Copy button is used)
//   ④ Submit a video                (ticks on their first ever submission)
//   ⑤ Get your first 25 clicks      (auto-ticks from lifetime stats)
//   ⑥ Get your 1st Commission       (auto-ticks from lifetime stats)
//
// Step ④ has no button on purpose: the "Submit your video" card lower down the
// dashboard owns the input, so the hint names that card instead of duplicating it.
//
// Presentational only: it holds no source of truth. The dashboard owns the
// persisted action flags (①–③) and passes the live-stat values (④–⑥) plus the
// shared resource URLs as props, so this component never fetches or writes
// state. Once every step is done the dashboard swaps this card for the "Your
// Tasks" card — it is never removed, so the creator always opens the dashboard
// to something that tells them what to do next.
import React from 'react';

const INK = '#111';
const MUTED = '#9a9aa2';
const HAIR = '#ececed';
const GREEN = '#16a34a';

type Props = {
  joinedChat: boolean;
  openedDrive: boolean;
  copied: boolean;
  hasEverSubmitted: boolean;
  clicks: number;
  firstBooking: boolean;
  chatUrl: string;
  footageUrl: string;
  onJoinChat: () => void;
  onOpenDrive: () => void;
};

export default function CreatorFirstBookingChecklist({ joinedChat, openedDrive, copied, hasEverSubmitted, clicks, firstBooking, chatUrl, footageUrl, onJoinChat, onOpenDrive }: Props) {
  const reachedClickGoal = clicks >= 25;

  type Step = { key: string; done: boolean; title: string; hint: string; link?: string; cta?: string; onOpen?: () => void };
  const steps: Step[] = [
    { key: 'chat', done: joinedChat, title: 'Join the creator group chat', hint: 'Instant updates from the team.', link: chatUrl, cta: 'Join the group chat', onOpen: onJoinChat },
    { key: 'drive', done: openedDrive, title: 'Open Google Drive footage folder', hint: 'Access highlight clips of the best moments from our events.', link: footageUrl, cta: 'Open Google Drive', onOpen: onOpenDrive },
    { key: 'copy', done: copied, title: 'Copy your custom link', hint: 'Use the Copy button above to grab your link.' },
    { key: 'video', done: hasEverSubmitted, title: 'Submit a video for the Upcoming Event', hint: 'Use the "Submit your video" card below to send it to us.' },
    { key: 'click', done: reachedClickGoal, title: 'Get your first 25 clicks', hint: `${Math.min(clicks, 25)} of 25 clicks — keep sharing your custom link.` },
    { key: 'booking', done: firstBooking, title: 'Get your 1st Commission', hint: 'This ticks the moment someone books through your custom link.' },
  ];

  return (
    <div style={{ border: '1px dashed #d8c27a', borderRadius: 16, padding: 16, background: '#FEFCF7' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, textAlign: 'center' }}>Your Checklist</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 0, marginTop: 12 }}>
        {steps.map((step, i) => (
          <div key={step.key}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid ' + HAIR }}>
              <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', background: step.done ? GREEN : '#fff', border: '2px solid ' + (step.done ? GREEN : HAIR), color: '#fff', fontSize: 12, fontWeight: 900 }}>{step.done ? '✓' : ''}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 750, color: step.done ? MUTED : INK, textDecoration: step.done ? 'line-through' : 'none' }}>{step.title}</div>
                {!step.done && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2, lineHeight: 1.4 }}>{step.hint}</div>}
                {step.link && !step.done && (
                  <a href={step.link} target="_blank" rel="noopener noreferrer" onClick={step.onOpen} style={{ display: 'inline-block', marginTop: 7, padding: '7px 12px', borderRadius: 9, border: '1.5px solid ' + HAIR, background: '#fff', color: INK, fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                    {step.cta}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
