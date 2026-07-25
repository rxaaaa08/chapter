// Creator dashboard — video tasks + submission card.
//
// The point of this card: onboarding scales to 100+ creators, but nothing told
// the founders who is actually making videos and who is just sitting in the
// roster. A creator gets a visible task and a place to paste the video link;
// the founders get an activity log for free (see CREATOR-TASKS-HANDOFF.md).
//
// There is deliberately NO campaign or assignment system. A task is DERIVED at
// read time: every event with creator commission switched on that still has an
// upcoming date, shown identically to every creator. Tasks are per DATE (the
// nearest upcoming one per event), so a recurring event like Chill Sunday keeps
// asking for a fresh video instead of ticking done forever. Flipping
// `affiliate_enabled` on an event is the entire "assign a task" action.
//
// Writes go through the submit_creator_video() RPC — creators have no INSERT
// policy on creator_submissions, so status/review columns can never be forged.
import React, { useState } from 'react';
import { supabase } from './supabase';
import { fetchEvents } from './supabase';
import { resolveDefaultFullPrice } from './eventPricing';

const INK = '#111';
const MUTED = '#9a9aa2';
const HAIR = '#ececed';
const GREEN = '#16a34a';
const AMBER = '#b45309';
const RED = '#dc2626';

// "2026-08-02" → "Aug 2". Robust to full ISO timestamps.
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' }).format(d);
};

// Start of today in IST, as a comparable YYYY-MM-DD string.
const istToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export type CreatorTask = {
  slug: string;
  title: string;
  date: string;   // YYYY-MM-DD — the nearest upcoming date for this event
};

export type CreatorSubmission = {
  id: string;
  event_slug: string;
  event_date: string;
  video_url: string;
  status: 'pending' | 'approved' | 'changes_requested';
  review_note: string | null;
  submitted_at: string;
};

export const taskKey = (slug: string, date: string) => `${slug}|${date}`;

// The task list. Same filter as CreatorUpcomingEvents so the two cards can
// never disagree about what is promotable — including resolveDefaultFullPrice,
// which reads CITY-level pricing (Chill Sunday's ₹359 lives in
// city_details.Chennai; its event-level price_full is 0, so reading that
// directly would render "earn ₹0 per booking").
export async function loadCreatorTasks(): Promise<CreatorTask[]> {
  const raw = await fetchEvents();
  const today = istToday();
  return (raw ?? [])
    .map((event: any) => ({ event, priceFull: resolveDefaultFullPrice(event) }))
    .filter(({ event, priceFull }: any) => event.affiliateEnabled && event.bookingFlow !== 'whatsapp' && priceFull > 0)
    .map(({ event, priceFull }: any) => {
      const upcoming = ((event.dates ?? []) as any[])
        .map(d => String(d.date ?? '').slice(0, 10))
        .filter(d => d && d >= today)
        .sort();
      return { slug: event.id as string, title: event.title as string, date: upcoming[0] ?? '' };
    })
    .filter((t: CreatorTask) => Boolean(t.date))
    .sort((a: CreatorTask, b: CreatorTask) => a.date.localeCompare(b.date));
}

// RLS scopes this to the signed-in creator, so no filter is needed (and none
// should be added — the policy is the guarantee, not the query).
export async function loadCreatorSubmissions(): Promise<CreatorSubmission[]> {
  const { data, error } = await supabase
    .from('creator_submissions')
    .select('id, event_slug, event_date, video_url, status, review_note, submitted_at')
    .order('submitted_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as CreatorSubmission[];
}

// The latest submission per task — what each row renders from. Rows arrive
// newest-first, so the first one wins.
export function latestByTask(submissions: CreatorSubmission[]): Record<string, CreatorSubmission> {
  const map: Record<string, CreatorSubmission> = {};
  for (const s of submissions) {
    const key = taskKey(s.event_slug, String(s.event_date).slice(0, 10));
    if (!map[key]) map[key] = s;
  }
  return map;
}

// ---------------------------------------------------------------------------
// "Your Tasks" — what the checklist card becomes once all its steps are done.
// The card deliberately never disappears and never renders empty: a creator
// should always open the dashboard to something that says what to do next.
// ---------------------------------------------------------------------------
export function CreatorTasksCard({ tasks, latest }: { tasks: CreatorTask[]; latest: Record<string, CreatorSubmission> }) {
  const pending = tasks.filter(t => !latest[taskKey(t.slug, t.date)]);

  return (
    <div style={{ border: '1px dashed #d8c27a', borderRadius: 16, padding: 16, background: '#FEFCF7' }}>
      <div style={{ fontSize: 14, fontWeight: 800, textAlign: 'center' }}>Your Tasks</div>

      {tasks.length > 0 && (
        <div style={{ display: 'grid', gap: 0, marginTop: 12 }}>
          {tasks.map((task, i) => {
            const done = Boolean(latest[taskKey(task.slug, task.date)]);
            return (
              <div key={taskKey(task.slug, task.date)} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '9px 0', borderTop: i === 0 ? 'none' : '1px solid ' + HAIR }}>
                <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center', background: done ? GREEN : '#fff', border: '2px solid ' + (done ? GREEN : HAIR), color: '#fff', fontSize: 12, fontWeight: 900 }}>{done ? '✓' : ''}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 750, color: done ? MUTED : INK, textDecoration: done ? 'line-through' : 'none' }}>
                    Make a video for {task.title.trim()}
                  </div>
                  <div style={{ fontSize: 11.5, color: MUTED, marginTop: 2, lineHeight: 1.4 }}>{fmtDate(task.date)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pending.length === 0 && (
        <div style={{ fontSize: 12, color: MUTED, marginTop: tasks.length > 0 ? 12 : 8, lineHeight: 1.5, textAlign: 'center' }}>
          You're all caught up — we'll add the next event soon.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// The submission card. One block per task, nearest date first.
// ---------------------------------------------------------------------------
type Props = {
  tasks: CreatorTask[];
  latest: Record<string, CreatorSubmission>;
  onSubmitted: (row: CreatorSubmission) => void;
};

export default function CreatorVideoTasks({ tasks, latest, onSubmitted }: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string>('');
  // Tasks whose input the creator has deliberately reopened to send another
  // video (repeat submissions are allowed — the server caps them at 10).
  const [reopened, setReopened] = useState<Record<string, boolean>>({});

  if (tasks.length === 0) return null;

  const submit = async (task: CreatorTask) => {
    const key = taskKey(task.slug, task.date);
    const url = (urls[key] ?? '').trim();
    if (!url || busy) return;
    setBusy(key);
    setErrors(prev => ({ ...prev, [key]: '' }));
    const { data, error } = await supabase.rpc('submit_creator_video', {
      p_event_slug: task.slug,
      p_event_date: task.date,
      p_video_url: url,
    });
    setBusy('');
    if (error) {
      // The RPC's messages are written for creators, so show them as-is.
      setErrors(prev => ({ ...prev, [key]: error.message || 'Could not send that link. Please try again.' }));
      return;
    }
    const row = (Array.isArray(data) ? data[0] : data) as { id: string; status: string; submitted_at: string } | null;
    onSubmitted({
      id: row?.id ?? key,
      event_slug: task.slug,
      event_date: task.date,
      video_url: url,
      status: 'pending',
      review_note: null,
      submitted_at: row?.submitted_at ?? new Date().toISOString(),
    });
    setUrls(prev => ({ ...prev, [key]: '' }));
    setReopened(prev => ({ ...prev, [key]: false }));
  };

  const inputBlock = (task: CreatorTask, key: string) => (
    <div style={{ marginTop: 10 }}>
      {/* The placeholder is a full instruction and doesn't fit a 375px field at
          the input's own size, so shrink the placeholder only — pasted Drive
          URLs still render at 14px where they stay readable. */}
      <style>{`.creator-video-url::placeholder { font-size: 12.5px; }`}</style>
      <input
        className="creator-video-url"
        value={urls[key] ?? ''}
        onChange={e => setUrls(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder="Upload video to your Google Drive & paste link"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: 10, border: '1.5px solid ' + (errors[key] ? RED : HAIR), fontSize: 14, fontFamily: 'inherit', color: INK, outline: 'none' }}
      />
      <div style={{ fontSize: 11.5, color: MUTED, marginTop: 6, lineHeight: 1.45 }}>
        Make sure anyone with the link can view it.
      </div>
      {errors[key] && <div style={{ fontSize: 12, color: RED, marginTop: 6, lineHeight: 1.45 }}>{errors[key]}</div>}
      <button
        type="button"
        onClick={() => void submit(task)}
        disabled={!(urls[key] ?? '').trim() || busy === key}
        style={{ width: '100%', marginTop: 10, padding: '11px 16px', borderRadius: 10, border: 'none', background: (urls[key] ?? '').trim() && busy !== key ? INK : '#d4d4d8', color: '#fff', fontWeight: 800, fontSize: 13.5, fontFamily: 'inherit', cursor: (urls[key] ?? '').trim() && busy !== key ? 'pointer' : 'default' }}
      >
        {busy === key ? 'Sending…' : 'Submit'}
      </button>
    </div>
  );

  const sendAnother = (key: string) => (
    <button
      type="button"
      onClick={() => setReopened(prev => ({ ...prev, [key]: true }))}
      style={{ marginTop: 8, padding: 0, border: 'none', background: 'none', color: MUTED, fontSize: 12, fontWeight: 700, fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 2, cursor: 'pointer' }}
    >
      Send another video
    </button>
  );

  return (
    <div>
      <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Submit your video</div>
      <div style={{ border: '1px solid #a1a1aa', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
        {tasks.map((task, i) => {
          const key = taskKey(task.slug, task.date);
          const sub = latest[key];
          const showInput = !sub || reopened[key] || sub.status === 'changes_requested';

          return (
            <div key={key} style={{ padding: 14, borderTop: i === 0 ? 'none' : '1px solid ' + HAIR }}>
              {/* Title and date are one line in one style — the date is part of
                  the task, not a footnote to it. The per-booking commission is
                  deliberately NOT repeated here: it already appears on the
                  upcoming-events card, and this card is about sending the video. */}
              <div style={{ fontSize: 14, fontWeight: 750, color: INK, lineHeight: 1.35 }}>
                {task.title.trim()} · {fmtDate(task.date)}
              </div>

              {sub && sub.status === 'pending' && (
                <div style={{ fontSize: 12.5, color: INK, marginTop: 9, fontWeight: 700 }}>
                  Submitted {fmtDate(String(sub.submitted_at).slice(0, 10))} — under review
                </div>
              )}
              {sub && sub.status === 'approved' && (
                <div style={{ fontSize: 12.5, color: GREEN, marginTop: 9, fontWeight: 800 }}>Approved</div>
              )}
              {sub && sub.status === 'changes_requested' && (
                <div style={{ marginTop: 9 }}>
                  <div style={{ fontSize: 12.5, color: AMBER, fontWeight: 800 }}>Changes requested</div>
                  {sub.review_note && <div style={{ fontSize: 12, color: MUTED, marginTop: 4, lineHeight: 1.5 }}>{sub.review_note}</div>}
                </div>
              )}

              {showInput ? inputBlock(task, key) : sendAnother(key)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
