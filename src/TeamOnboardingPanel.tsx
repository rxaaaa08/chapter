// Mock of the admin panel's People ▸ Call view, for core-team training.
//
// This is a REPLICA, not a reuse: it imports no Supabase client, holds no real
// rows and writes nothing. Every lead below is invented. The point is that a
// trainee's first sight of the panel is the panel — same table, same six
// columns, same status colours, same buttons — so nothing is new on day one.
//
// Mirrors src/AdminPanel.tsx: statusColor (4868), statusIcons (4899),
// laneMark/channelIcon (5077-5134), resendDetailsButton (5261), the call row
// (6588-6746), the table shell (6521) and the earnings/team board (5463).
// When any of those change visually, change them here too — a training screen
// that lies is worse than none.
import React, { useState } from 'react';

// Delivery-tick lane states, in the same vocabulary the real panel uses.
export type LaneState = 'missing' | 'accepted' | 'delivered' | 'read' | 'clicked' | 'failed' | 'none';

export type MockLead = {
  id: string;
  name: string;
  phone: string;
  whyJoin?: string;
  date: string;
  /** Renders the date as a live <select>, the way a multi-date event does. */
  dateSelectable?: boolean;
  applied: string;
  /** Already-resolved display status — the real panel derives this in displayStatus(). */
  status: string;
  seats?: number;
  attended?: number;
  recovered?: boolean;
  selfServe?: boolean;
  doubt?: string;
  awaitingReply?: string;
  /** Which message the ticks refer to, plus each lane's state. */
  lanes?: { label: string; wa: LaneState; mail: LaneState };
  callNote?: string;
};

const EVENT_TITLE = 'Chill Sunday Meetup';
const MEETING_LINE = 'Nungambakkam, Chennai';
const DATES = ['Sun 2 Aug (sold out)', 'Sun 16 Aug'];

// Every status and notation a marketer can meet on an invite-only event, one
// lead each, in the order the tour walks them.
export const MOCK_LEADS: MockLead[] = [
  {
    id: 'aarav', name: 'Aarav Menon', phone: '9840012345', date: 'Sun 16 Aug', applied: '2 Aug, 09:14',
    whyJoin: 'New to the city, looking to meet people outside work.',
    status: 'pending',
  },
  {
    id: 'nikhil', name: 'Nikhil Verma', phone: '9962233445', date: 'Sun 16 Aug', applied: '2 Aug, 10:02',
    status: 'pending',
    doubt: "I'd be coming alone — will it be awkward?",
  },
  {
    id: 'diya', name: 'Diya Sharma', phone: '9884455667', date: 'Sun 16 Aug', applied: '1 Aug, 18:40',
    status: 'invited', callNote: 'Called',
    lanes: { label: 'Invite', wa: 'read', mail: 'delivered' },
  },
  {
    id: 'kabir', name: 'Kabir Anand', phone: '9791122334', date: 'Sun 16 Aug', applied: '1 Aug, 17:05',
    status: 'invited', awaitingReply: 'is parking available near the spot?',
    lanes: { label: 'Invite', wa: 'read', mail: 'read' },
  },
  {
    // Deliberately starts with no call note, so the trainee sees Resend Details
    // faded and has to log the call first — the same order the real panel nudges.
    id: 'rohan', name: 'Rohan Iyer', phone: '9500667788', date: 'Sun 16 Aug', applied: '31 Jul, 12:20',
    status: 're_target',
    lanes: { label: 'Invite', wa: 'delivered', mail: 'failed' },
  },
  {
    id: 'sneha', name: 'Sneha Nair', phone: '9445566778', date: 'Sun 16 Aug', applied: '1 Aug, 20:11',
    status: 'cart_abandoned', callNote: 'Had Safety/Trust Doubts',
    lanes: { label: 'Nudge', wa: 'delivered', mail: 'delivered' },
  },
  {
    id: 'ananya', name: 'Ananya Rao', phone: '9840099887', date: 'Sun 16 Aug', applied: '1 Aug, 21:35',
    status: 'payment_failed',
    lanes: { label: 'Retry', wa: 'accepted', mail: 'delivered' },
  },
  {
    id: 'vikram', name: 'Vikram Shetty', phone: '9003344556', date: 'Sun 2 Aug (sold out)', applied: '30 Jul, 08:50',
    status: 'waitlist', dateSelectable: true,
  },
  {
    id: 'karthik', name: 'Karthik Raj', phone: '9677788990', date: 'Sun 16 Aug', applied: '29 Jul, 14:02',
    status: 'advance_paid',
    lanes: { label: 'Payment success', wa: 'read', mail: 'none' },
  },
  {
    id: 'meera', name: 'Meera Pillai', phone: '9840055443', date: 'Sun 16 Aug', applied: '28 Jul, 19:30',
    status: 'fully_paid', seats: 2, recovered: true,
    lanes: { label: 'Payment success', wa: 'read', mail: 'none' },
  },
  {
    id: 'ishaan', name: 'Ishaan Gupta', phone: '9791100223', date: 'Sun 16 Aug', applied: '27 Jul, 11:11',
    status: 'rejected',
  },
];

const statusColor = (status: string) => {
  if (status === 'fully_paid')     return '#16a34a';
  if (status === 'advance_paid')   return '#84cc16';
  if (status === 'invited')        return '#2196f3';
  if (status === 'cart_abandoned') return '#b45309';
  if (status === 'payment_failed') return '#dc2626';
  if (status === 're_target' || status === 'resent_details') return '#7c3aed';
  if (status === 'waitlist')       return '#a855f7';
  if (status === 'in_progress')    return '#0891b2';
  if (status === 'pending')        return '#f97316';
  if (status === 'rejected')       return '#dc2626';
  return '#999';
};

const statusLabel = (st: string) => st.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const WA_BLUE = '#34b7f1';
const MAIL_AMBER = '#FE9A00';

function StatusIcons({ recovered, selfServe }: { recovered?: boolean; selfServe?: boolean }) {
  if (!recovered && !selfServe) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 1, opacity: 0.7, verticalAlign: 'middle' }}>
      {recovered && (
        <svg width="12" height="10" viewBox="0 0 16 14" role="img" style={{ display: 'block', flexShrink: 0, color: 'currentColor' }}>
          <title>Recovered — paid after abandoning the bill</title>
          <path d="M12.8 5.2A4.8 4.8 0 0 0 4.2 3.4L2.8 4.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2.8 2.1v2.7h2.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3.2 8.8a4.8 4.8 0 0 0 8.6 1.8l1.4-1.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.2 11.9V9.2h-2.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {selfServe && (
        <svg width="12" height="10" viewBox="0 0 16 14" role="img" style={{ display: 'block', flexShrink: 0, color: 'currentColor' }}>
          <title>Self-serve — booked with no help</title>
          <path d="M9.4 1 3.4 8.2h3.7l-.9 4.8 6-7.2H8.5L9.4 1z" fill="currentColor" />
        </svg>
      )}
    </span>
  );
}

function ChannelIcon({ channel }: { channel: 'whatsapp' | 'mail' }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"
         style={{ display: 'block', flexShrink: 0, color: '#a8a8a8' }}
         fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {channel === 'whatsapp' ? (
        <>
          <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
          <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
        </>
      ) : (
        <>
          <path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" />
          <path d="M3 7l9 6l9 -6" />
        </>
      )}
    </svg>
  );
}

function LaneMark({ state, colour }: { state: LaneState; colour: string }) {
  if (state === 'none') {
    return <span style={{ width: 15, color: '#c4c4c4', display: 'inline-flex', justifyContent: 'center', flexShrink: 0 }}>–</span>;
  }
  if (state === 'failed' || state === 'missing') {
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', flexShrink: 0, color: '#ef4444', marginRight: 3 }}>
        <circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" strokeWidth="2.8" />
        <path d="M6 6 18 18" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (state === 'clicked') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', flexShrink: 0, color: colour, marginRight: 2 }}>
        <path d="M14.2 12.0L21.0 12.0M13.8 13.3L19.3 17.3M12.7 14.1L14.8 20.6M11.3 14.1L9.2 20.6M10.2 13.3L4.7 17.3M9.8 12.0L3.0 12.0M10.2 10.7L4.7 6.7M11.3 9.9L9.2 3.4M12.7 9.9L14.8 3.4M13.8 10.7L19.3 6.7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  const tickColour = state === 'read' ? colour : '#b0b0b0';
  return (
    <svg width="15" height="10" viewBox="0 0 17 12" aria-hidden="true" style={{ display: 'block', flexShrink: 0, color: tickColour }}>
      <path d={state === 'accepted' ? 'M4 6.6 6.5 9.1 11.7 3.2' : 'M1.5 6.6 4 9.1 9.2 3.2'}
            fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {state !== 'accepted' && (
        <path d="M1.5 6.6 4 9.1 9.2 3.2" transform="translate(5 0)" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

function DeliveryLanes({ lanes, tourKey }: { lanes: MockLead['lanes']; tourKey?: string }) {
  if (!lanes) return null;
  return (
    <div data-tour={tourKey} style={{ marginTop: 5, fontSize: 10, color: '#999', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }} title={`${lanes.label} on WhatsApp — ${lanes.wa}`}>
        <ChannelIcon channel="whatsapp" />
        <LaneMark state={lanes.wa} colour={WA_BLUE} />
      </div>
      {lanes.mail !== 'none' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }} title={`${lanes.label} on email — ${lanes.mail}`}>
          <ChannelIcon channel="mail" />
          <LaneMark state={lanes.mail} colour={MAIL_AMBER} />
        </div>
      )}
    </div>
  );
}

const USER_STATUS_OPTIONS = [
  "Didn't Get Invite", 'Saw Invite, But Forgot', 'Needed Date/Time/Location Clarity',
  'Needed Price/Payment Clarity', 'Had Safety/Trust Doubts', 'Wanted Friend Confirmation',
  'Website/Payment Issue', 'Not Interested', 'Called', 'No Answer',
];

const selectStyle: React.CSSProperties = {
  appearance: 'none', WebkitAppearance: 'none', backgroundColor: '#f5f5f5',
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27 viewBox=%270 0 10 6%27%3E%3Cpath fill=%27%23555%27 d=%27M1 0l4 4 4-4 1 1-5 5-5-5z%27/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '10px 6px',
  color: '#555', border: 'none', borderRadius: 99, padding: '4px 24px 4px 8px', fontSize: 12,
  width: '100%', outline: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
};

const dateSelectStyle: React.CSSProperties = {
  appearance: 'none', WebkitAppearance: 'none', fontSize: 10, color: '#444', fontWeight: 600,
  backgroundColor: '#f5f5f5',
  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%278%27 height=%275%27 viewBox=%270 0 10 6%27%3E%3Cpath fill=%27%23555%27 d=%27M1 0l4 4 4-4 1 1-5 5-5-5z%27/%3E%3C/svg%3E")',
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center', backgroundSize: '8px 5px',
  border: 'none', borderRadius: 99, padding: '2px 20px 2px 8px', cursor: 'pointer', maxWidth: 120,
  fontFamily: 'inherit',
};

const HEADERS = ['Name', 'Phone', 'Event', 'User Status', 'Date', 'Action'];
const HEADER_KEYS = ['head-name', 'head-phone', 'head-event', 'head-status', 'head-date', 'head-action'];

export type PanelState = {
  /** Set once the trainee presses Approve on the first lead. */
  approved: boolean;
  /** Set once they shift the waitlisted lead to the open date. */
  dateShifted: boolean;
  /** Set once they record a call outcome on the re-target lead. */
  noteLogged: boolean;
  /** Set once they press Resend Details. */
  detailsResent: boolean;
};

export const EMPTY_PANEL_STATE: PanelState = { approved: false, dateShifted: false, noteLogged: false, detailsResent: false };

export function TeamMockPanel({ state, onStateChange }: { state: PanelState; onStateChange: (next: PanelState) => void }) {
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(MOCK_LEADS.map(lead => [lead.id, lead.callNote ?? ''])));

  const rowFor = (lead: MockLead): MockLead => {
    // The two scripted interactions the tour asks for. Everything else is static.
    if (lead.id === 'aarav' && state.approved) {
      return { ...lead, status: 'invited', lanes: { label: 'Invite', wa: 'accepted', mail: 'accepted' } };
    }
    if (lead.id === 'vikram' && state.dateShifted) {
      return { ...lead, status: 'invited', date: 'Sun 16 Aug' };
    }
    if (lead.id === 'rohan' && state.detailsResent) {
      return { ...lead, status: 'resent_details', lanes: { label: 'Details', wa: 'accepted', mail: 'accepted' } };
    }
    return lead;
  };

  return (
    <div style={{ background: '#f5f5f0', fontFamily: 'sans-serif', padding: '18px 16px 26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: '#111', color: '#FFD700', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 15 }}>அ</div>
        <strong style={{ fontSize: 15 }}>People</strong>
      </div>

      {/* People sub-view pills. Call is the only one a marketer works in. */}
      <div data-tour="pills" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['Call', true], ['Approval', false], ['Payments', false], ['Doubts', false], ['Chat', false]].map(([label, active]) => (
          <span key={String(label)} style={{
            padding: '8px 18px', borderRadius: 99, border: 'none',
            background: active ? '#111' : '#fff', color: active ? '#fff' : '#555',
            fontWeight: 700, fontSize: 13,
            boxShadow: active ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
          }}>{String(label)}</span>
        ))}
      </div>

      {/* Earnings tiles — the real panel shows these above the table. */}
      <div data-tour="earnings" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['Paid advance', '2', false], ['Fully paid', '1', false], ['Earned this month', '₹50', true]].map(([label, value, accent]) => (
          <div key={String(label)} style={{ flex: 1, minWidth: 0, background: accent ? '#f0fdf4' : '#fafafa', border: `1px solid ${accent ? '#bbf7d0' : '#eee'}`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: accent ? '#15803d' : '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{String(label)}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: accent ? '#16a34a' : '#111', lineHeight: 1.1, marginTop: 3 }}>{String(value)}</div>
          </div>
        ))}
      </div>

      {/* Transparent team board */}
      <div data-tour="board" style={{ background: '#fff', border: '1px solid #ececec', borderRadius: 12, overflow: 'hidden', fontSize: 13, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', color: '#999', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
          <span style={{ flex: 1, minWidth: 0 }}>The Team</span>
          <span style={{ width: 48, textAlign: 'right' }}>Sold</span>
          <span style={{ width: 84, textAlign: 'right' }}>Earnings</span>
        </div>
        {[['Maya', 11, '₹550', false], ['You', 1, '₹50', true], ['Kiran', 5, '₹250', false]].map(([name, sold, earned, isMe]) => (
          <div key={String(name)} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderTop: '1px solid #f5f5f0', background: isMe ? '#f0fdf4' : 'transparent' }}>
            <span style={{ flex: 1, minWidth: 0, fontWeight: isMe ? 700 : 500, color: '#111' }}>
              {String(name)}{isMe && <span style={{ fontSize: 10, color: '#16a34a', marginLeft: 6 }}>you</span>}
            </span>
            <span style={{ width: 48, textAlign: 'right', color: '#111', fontWeight: 600 }}>{String(sold)}</span>
            <span style={{ width: 84, textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>{String(earned)}</span>
          </div>
        ))}
      </div>

      {/* The table. Horizontal scroll is the real behaviour — kept, not fixed. */}
      <div data-tour="table" style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
          <thead>
            <tr style={{ background: '#fafafa' }}>
              {HEADERS.map((h, i) => (
                <th key={h} data-tour={HEADER_KEYS[i]} style={{ textAlign: 'left', padding: '11px 12px', borderBottom: '1px solid #ececec', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#888', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_LEADS.map(base => {
              const lead = rowFor(base);
              const showApprove = lead.status === 'pending';
              const showResend = lead.status === 're_target';
              return (
                <tr key={lead.id} data-tour={`row-${lead.id}`} style={{ borderBottom: '1px solid #f0f0f0', verticalAlign: 'top', background: lead.doubt ? '#fffbeb' : (lead.awaitingReply ? '#f0fdf4' : undefined) }}>
                  <td style={{ padding: '11px 12px', maxWidth: 280, minWidth: 200 }}>
                    <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lead.name}
                      {lead.seats && lead.seats > 1 && (
                        <span data-tour={lead.id === 'meera' ? 'seat-badge' : undefined} title={`${lead.seats} tickets on this booking`} style={{ marginLeft: 6, color: '#999', fontSize: 12, fontWeight: 500 }}>×{lead.seats}</span>
                      )}
                      {lead.doubt && (
                        <span data-tour="doubt-pill" title="1 unresolved doubt" style={{ marginLeft: 6, background: '#fde047', color: '#854d0e', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>💬 1</span>
                      )}
                    </div>
                    {lead.whyJoin && (
                      <div style={{ fontSize: 10, color: '#888', marginTop: 2, lineHeight: 1.35 }}>{lead.whyJoin}</div>
                    )}
                  </td>
                  <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                    <span data-tour={lead.id === 'aarav' ? 'phone-link' : undefined} style={{ color: '#2563eb', fontWeight: 600 }}>{lead.phone}</span>
                  </td>
                  <td style={{ padding: '11px 12px', color: '#555', maxWidth: 180 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{EVENT_TITLE}</div>
                    <div style={{ fontSize: 10, color: '#888', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{MEETING_LINE}</span>
                      <span style={{ color: '#bbb' }}>·</span>
                      {lead.dateSelectable ? (
                        <select
                          data-tour="date-select"
                          value={lead.date}
                          onChange={e => onStateChange({ ...state, dateShifted: e.target.value === 'Sun 16 Aug' })}
                          title="Move this applicant to a different date"
                          style={dateSelectStyle}
                        >
                          {DATES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      ) : (
                        <span style={{ color: '#aaa' }}>{lead.date}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '11px 12px', width: 150 }}>
                    {lead.doubt && (
                      <div data-tour="doubt-card" style={{ marginBottom: 6, background: '#fef3c7', borderLeft: '3px solid #f59e0b', borderRadius: 4, padding: '5px 8px', fontSize: 12, color: '#78350f', lineHeight: 1.4 }}>
                        <div style={{ fontSize: 10, color: '#92400e', fontWeight: 600, marginBottom: 2 }}>💬 2 Aug, 10:02</div>
                        {lead.doubt}
                      </div>
                    )}
                    {lead.awaitingReply && (
                      <div data-tour="reply-chip" title={lead.awaitingReply} style={{ marginBottom: 6, background: '#dcfce7', borderLeft: '3px solid #22c55e', borderRadius: 4, padding: '4px 7px', fontSize: 11, color: '#14532d', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        ↩ {lead.awaitingReply}
                      </div>
                    )}
                    <select
                      data-tour={lead.id === 'rohan' ? 'call-note' : undefined}
                      value={notes[lead.id] ?? ''}
                      onChange={e => {
                        setNotes(current => ({ ...current, [lead.id]: e.target.value }));
                        if (lead.id === 'rohan' && e.target.value) onStateChange({ ...state, noteLogged: true });
                      }}
                      style={selectStyle}
                    >
                      <option value=""></option>
                      {USER_STATUS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                    {showResend && (
                      <button
                        type="button"
                        data-tour="resend-btn"
                        onClick={() => onStateChange({ ...state, detailsResent: true })}
                        style={{
                          marginTop: 5, background: '#fff', color: '#777', border: '1px solid #e5e5e5',
                          borderRadius: 999, padding: '2px 7px', fontSize: 10, fontWeight: 600,
                          cursor: 'pointer', opacity: notes[lead.id] ? 1 : 0.45, whiteSpace: 'nowrap',
                          fontFamily: 'inherit',
                        }}
                      >
                        Resend Details
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '11px 12px', color: '#888', whiteSpace: 'nowrap', fontSize: 10, width: 90 }}>{lead.applied}</td>
                  <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                    {showApprove ? (
                      <button
                        type="button"
                        data-tour={lead.id === 'aarav' ? 'approve-btn' : undefined}
                        onClick={() => { if (lead.id === 'aarav') onStateChange({ ...state, approved: true }); }}
                        style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
                      >
                        ✓ Approve
                      </button>
                    ) : (
                      <>
                        <div>
                          <span data-tour={`badge-${lead.id}`} style={{ background: statusColor(lead.status) + '22', color: statusColor(lead.status), borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {statusLabel(lead.status)}
                            <StatusIcons recovered={lead.recovered} selfServe={lead.selfServe} />
                          </span>
                        </div>
                        <DeliveryLanes lanes={lead.lanes} tourKey={lead.id === 'diya' ? 'ticks' : undefined} />
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
