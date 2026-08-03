import React, { useEffect, useMemo, useRef, useState } from 'react';

export type DemoLead = {
  name: string;
  date: string;
  meeting_point: string;
};

type MockProps = {
  demoLead: DemoLead;
  onReadyChange: (ready: boolean) => void;
  onTestApplication?: (lead: DemoLead) => Promise<void>;
};

const INK = '#111';
const MUTED = '#9a9aa2';
const HAIR = '#ececed';
const GOLD = '#FFD700';
const GREEN = '#16a34a';
const AMBER = '#b45309';

const card: React.CSSProperties = {
  border: `1.5px solid ${HAIR}`,
  borderRadius: 16,
  background: '#fff',
  padding: 15,
  boxShadow: '0 10px 28px rgba(17,17,17,0.055)',
};

const action: React.CSSProperties = {
  width: '100%',
  border: 'none',
  borderRadius: 12,
  background: INK,
  color: '#fff',
  padding: '11px 12px',
  fontFamily: 'inherit',
  fontSize: 13.5,
  fontWeight: 800,
  cursor: 'pointer',
};

function useReady(ready: boolean, onReadyChange: (ready: boolean) => void) {
  useEffect(() => onReadyChange(ready), [onReadyChange, ready]);
}

function Status({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'red' }) {
  const colors = tone === 'green'
    ? { color: '#166534', background: '#f0fdf4', border: '#bbf7d0' }
    : tone === 'amber'
      ? { color: AMBER, background: '#fffbeb', border: '#fde68a' }
      : tone === 'red'
        ? { color: '#b91c1c', background: '#fef2f2', border: '#fecaca' }
        : { color: '#52525b', background: '#f4f4f5', border: '#e4e4e7' };
  return (
    <span style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: 999, border: `1px solid ${colors.border}`, background: colors.background, color: colors.color, fontSize: 10.5, fontWeight: 850, lineHeight: 1 }}>
      {children}
    </span>
  );
}

function LeadCard({ demoLead, status, tone = 'neutral', children }: { demoLead: DemoLead; status: string; tone?: 'neutral' | 'green' | 'amber' | 'red'; children?: React.ReactNode }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: MUTED, fontSize: 10.5, fontWeight: 800, letterSpacing: 1.1, textTransform: 'uppercase' }}>Chill Sunday Meetup</div>
          <div style={{ marginTop: 5, fontSize: 17, fontWeight: 850, letterSpacing: -0.25 }}>{demoLead.name}</div>
        </div>
        <Status tone={tone}>{status}</Status>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 13 }}>
        <div style={{ borderRadius: 10, background: '#f7f7f8', padding: '9px 10px' }}>
          <div style={{ color: MUTED, fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase' }}>Date</div>
          <div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 750 }}>{demoLead.date}</div>
        </div>
        <div style={{ borderRadius: 10, background: '#f7f7f8', padding: '9px 10px' }}>
          <div style={{ color: MUTED, fontSize: 9.5, fontWeight: 800, textTransform: 'uppercase' }}>Meeting area</div>
          <div style={{ marginTop: 3, fontSize: 12.5, fontWeight: 750 }}>Nungambakkam</div>
        </div>
      </div>
      {children && <div style={{ marginTop: 13 }}>{children}</div>}
    </div>
  );
}

function Caption({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'amber' }) {
  const palette = tone === 'green'
    ? { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' }
    : tone === 'amber'
      ? { bg: '#fffbeb', border: '#fde68a', color: '#92400e' }
      : { bg: '#f7f7f8', border: HAIR, color: '#52525b' };
  return <div style={{ border: `1px solid ${palette.border}`, background: palette.bg, color: palette.color, borderRadius: 12, padding: '11px 12px', fontSize: 12.5, lineHeight: 1.5, fontWeight: 650 }}>{children}</div>;
}

function BotBubble({ children }: { children: React.ReactNode }) {
  return <div style={{ alignSelf: 'flex-start', maxWidth: '84%', borderRadius: '5px 14px 14px', background: '#fff', boxShadow: '0 4px 16px rgba(17,17,17,.08)', padding: '10px 11px', fontSize: 12.5, lineHeight: 1.48, fontWeight: 650 }}>{children}</div>;
}

function TypingDots() {
  return <BotBubble><span aria-label="Chapter is typing" style={{ display: 'inline-flex', gap: 4 }}>{[0, 1, 2].map(index => <span key={index} style={{ width: 5, height: 5, borderRadius: '50%', background: '#a1a1aa', animation: `team-dot-pulse 1s ${index * 120}ms infinite ease-in-out` }} />)}</span></BotBubble>;
}

function GoldReply({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} style={{ alignSelf: 'flex-end', width: '88%', border: '1px solid #e5c100', borderRadius: 12, background: GOLD, color: INK, padding: '10px 12px', fontFamily: 'inherit', fontSize: 12, fontWeight: 900, cursor: 'pointer', textAlign: 'left', boxShadow: '0 5px 14px rgba(255,215,0,.22)' }}>{children}<span aria-hidden="true" style={{ float: 'right' }}>➤</span></button>;
}

function LevelOneMock({ onReadyChange }: MockProps) {
  const [screen, setScreen] = useState<'chat' | 'details' | 'timeline'>('chat');
  const [chatPhase, setChatPhase] = useState<'city' | 'events'>('city');
  const [selectedCity, setSelectedCity] = useState('');
  const [typing, setTyping] = useState(true);
  const [timelineScrolled, setTimelineScrolled] = useState(false);
  useEffect(() => {
    if (screen !== 'chat') return undefined;
    setTyping(true);
    const timer = window.setTimeout(() => setTyping(false), 430);
    return () => window.clearTimeout(timer);
  }, [chatPhase, screen]);
  useReady(screen === 'timeline' && timelineScrolled, onReadyChange);
  return (
    <div style={{ ...card, padding: 12, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 11 }}>
        {(['chat', 'details', 'timeline'] as const).map((item, index) => (
          <span key={item} style={{ height: 4, flex: 1, borderRadius: 999, background: screen === item || (screen === 'timeline' && index < 2) || (screen === 'details' && index === 0) ? INK : HAIR }} />
        ))}
      </div>
      {screen === 'chat' && (
        <div style={{ borderRadius: 14, background: '#f1f1f2', minHeight: 272, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ width: 27, height: 27, borderRadius: '50%', background: INK, color: GOLD, display: 'grid', placeItems: 'center', fontWeight: 950, fontSize: 12 }}>C</span>
            <div><div style={{ fontSize: 11.5, fontWeight: 900 }}>Chapter</div><div style={{ color: MUTED, fontSize: 9.5 }}>Your weekend co-pilot</div></div>
          </div>
          <BotBubble>Hey! I&apos;ll help you find people and plans that feel like your kind of weekend.</BotBubble>
          {selectedCity && <div style={{ alignSelf: 'flex-end', borderRadius: '14px 5px 14px 14px', background: INK, color: '#fff', padding: '8px 10px', fontSize: 11.5, fontWeight: 800 }}>{selectedCity}</div>}
          {typing ? <TypingDots /> : chatPhase === 'city' ? (
            <>
              <BotBubble>First up — where are you looking to step out?</BotBubble>
              {['Chennai', 'Bengaluru', 'Hyderabad'].map(city => <React.Fragment key={city}><GoldReply onClick={() => { setSelectedCity(city); setChatPhase('events'); }}>{city}</GoldReply></React.Fragment>)}
            </>
          ) : (
            <>
              <BotBubble>Lovely. Here&apos;s a Chapter plan running in Chennai.</BotBubble>
              <GoldReply onClick={() => setScreen('details')}>Our Chill Sunday Meetups</GoldReply>
            </>
          )}
        </div>
      )}
      {screen === 'details' && (
        <div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2].map(i => <div key={i} style={{ height: 72, flex: 1, borderRadius: 10, background: i === 0 ? '#f1c47a' : i === 1 ? '#9dc5b6' : '#d9b0a2' }} />)}
          </div>
          <div style={{ marginTop: 12, fontSize: 17, fontWeight: 900 }}>Chill Sunday Meetup</div>
          <div style={{ marginTop: 9, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
            {['Your Own Transport', 'ppl who bond over stories, chaos & good times', 'Nungambakkam', 'Group Size 25'].map(x => <div key={x} style={{ minHeight: 37, borderRadius: 9, background: '#f7f7f8', padding: 8, fontSize: 10.2, fontWeight: 750, lineHeight: 1.3, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{x}</div>)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 10, padding: '9px 10px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', fontSize: 11.5 }}>
            <span><strong>Sun 2 Aug</strong> · Sun 16 Aug</span><strong>₹359</strong>
          </div>
          <button type="button" onClick={() => setScreen('timeline')} style={{ ...action, marginTop: 12 }}>Apply Now</button>
        </div>
      )}
      {screen === 'timeline' && (
        <div>
          <div style={{ fontSize: 15.5, fontWeight: 900 }}>Your booking timeline</div>
          <div
            onScroll={event => {
              const element = event.currentTarget;
              if (element.scrollTop > 28 || element.scrollTop + element.clientHeight >= element.scrollHeight - 8) setTimelineScrolled(true);
            }}
            style={{ display: 'grid', gap: 9, marginTop: 12, maxHeight: 168, overflowY: 'auto', paddingRight: 5, overscrollBehavior: 'contain' }}
          >
            {[
              ['Application approved', 'Today'],
              ['Payment confirmation', 'After payment'],
              ['Meet your group online', 'Before the meetup'],
              ['Exact meeting spot revealed', 'Closer to Sun 2 Aug'],
              ['Chill Sunday Meetup', 'Sun 2 Aug'],
            ].map(([title, when], i) => (
              <div key={title} style={{ display: 'grid', gridTemplateColumns: '25px 1fr', gap: 9, alignItems: 'center' }}>
                <span style={{ width: 25, height: 25, borderRadius: '50%', display: 'grid', placeItems: 'center', background: i === 3 ? GOLD : INK, color: i === 3 ? INK : '#fff', fontSize: 11, fontWeight: 900 }}>{i + 1}</span>
                <div><div style={{ fontSize: 12.5, fontWeight: 800 }}>{title}</div><div style={{ color: MUTED, fontSize: 10.5 }}>{when}</div></div>
              </div>
            ))}
          </div>
          {timelineScrolled
            ? <Caption tone="green">You found the dated meeting-spot step. This replica is training-only.</Caption>
            : <div style={{ color: MUTED, fontSize: 11.5, marginTop: 10, textAlign: 'center' }}>Scroll the timeline to find when the exact meeting spot appears ↓</div>}
        </div>
      )}
    </div>
  );
}

function LevelTwoMock({ demoLead, onReadyChange, onTestApplication }: MockProps) {
  const [applied, setApplied] = useState(false);
  const [opened, setOpened] = useState(false);
  const [name, setName] = useState(demoLead.name);
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useReady(opened, onReadyChange);
  const apply = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\s/g, '');
    if (!cleanName || saving) { setError('Add the name you would use on a real application.'); return; }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) { setError('Enter a valid 10-digit Indian phone number.'); return; }
    if (!agreed) { setError('Agree to the terms and conditions to continue.'); return; }
    setSaving(true);
    setError('');
    try {
      await onTestApplication?.({ name: cleanName, date: 'Sun 2 Aug', meeting_point: 'Nungambakkam — 11:00 AM' });
      setApplied(true);
    } catch {
      setError('Your practice application could not be saved. Try once more.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div style={{ ...card, display: 'grid', gap: 12 }}>
      {!applied ? (
        <>
          <div><div style={{ color: MUTED, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>Practice application</div><div style={{ marginTop: 4, fontSize: 17, fontWeight: 900 }}>Chill Sunday Meetup</div></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            <Caption><strong>Sun 2 Aug</strong><br />Selected date</Caption>
            <Caption><strong>Nungambakkam</strong><br />11:00 AM</Caption>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            <label style={{ display: 'grid', gap: 5 }}><span style={{ color: MUTED, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>Your name</span><input value={name} onChange={event => setName(event.target.value.slice(0, 80))} placeholder="Your name" style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${error && !name.trim() ? '#dc2626' : HAIR}`, borderRadius: 11, padding: '10px 11px', fontFamily: 'inherit', fontSize: 14 }} /></label>
            <label style={{ display: 'grid', gap: 5 }}><span style={{ color: MUTED, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>Phone number</span><input value={phone} onChange={event => setPhone(event.target.value.slice(0, 11))} inputMode="tel" autoComplete="tel" placeholder="98765 43210" style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${error && phone && !/^[6-9]\d{9}$/.test(phone.replace(/\s/g, '')) ? '#dc2626' : HAIR}`, borderRadius: 11, padding: '10px 11px', fontFamily: 'inherit', fontSize: 14 }} /></label>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, border: `1px solid ${agreed ? '#d4d4d8' : HAIR}`, borderRadius: 11, padding: '10px 11px', cursor: 'pointer' }}><input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} style={{ marginTop: 2, accentColor: INK }} /><span style={{ fontSize: 11.5, lineHeight: 1.45, fontWeight: 650 }}>I agree to the terms &amp; conditions and understand this is a training application.</span></label>
          </div>
          {error && <div role="alert" style={{ color: '#b91c1c', fontSize: 11.5 }}>{error}</div>}
          <button type="button" onClick={() => void apply()} disabled={saving} style={{ ...action, opacity: saving ? .65 : 1 }}>{saving ? 'Saving practice application…' : 'Apply — practice only'}</button>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '10px 4px' }}>
          <div style={{ width: 44, height: 44, margin: '0 auto', borderRadius: '50%', display: 'grid', placeItems: 'center', background: INK, color: '#fff', fontSize: 21, fontWeight: 900 }}>✓</div>
          <div style={{ marginTop: 12, fontSize: 19, fontWeight: 900 }}>Application sent.</div>
          <div style={{ marginTop: 8, color: MUTED, fontSize: 12.5, lineHeight: 1.55 }}>From this moment on, you&apos;re not the customer anymore.<br /><strong style={{ color: INK }}>You&apos;re the marketer. And your first lead is… {name.trim()}.</strong></div>
          <Caption>Right now, on a marketer&apos;s dashboard, this application would arrive as a new lead.</Caption>
          <div style={{ marginTop: 10, color: MUTED, fontSize: 11.5 }}>Sun 2 Aug · Nungambakkam</div>
          <button type="button" onClick={() => setOpened(true)} style={{ ...action, marginTop: 13 }}>{opened ? 'Dashboard opened ✓' : 'Open my dashboard'}</button>
        </div>
      )}
    </div>
  );
}

function LevelThreeMock({ demoLead, onReadyChange }: MockProps) {
  useReady(true, onReadyChange);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...card, padding: 13 }}>
        <div style={{ color: MUTED, fontSize: 10.5, fontWeight: 850, textTransform: 'uppercase', letterSpacing: 1 }}>Round-robin dealing</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginTop: 12 }}>
          {['Maya', 'You', 'Kiran'].map((name, i) => <div key={name} style={{ borderRadius: 12, border: `1px solid ${i === 1 ? INK : HAIR}`, padding: '10px 6px', textAlign: 'center', background: i === 1 ? '#f7f7f8' : '#fff' }}><div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 1 ? GOLD : '#e4e4e7', margin: '0 auto 6px', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 900 }}>{i + 1}</div><div style={{ fontSize: 11.5, fontWeight: 800 }}>{name}</div>{i === 1 && <div style={{ color: GREEN, fontSize: 9.5, fontWeight: 800, marginTop: 3 }}>New lead ↓</div>}</div>)}
        </div>
      </div>
      <LeadCard demoLead={demoLead} status="Pending" />
    </div>
  );
}

function LevelFourMock({ onReadyChange }: MockProps) {
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [active, setActive] = useState('Call');
  useReady(visited.has('Call') && visited.has('Doubts'), onReadyChange);
  const tap = (tab: string) => { setActive(tab); setVisited(current => new Set(current).add(tab)); };
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ ...card, padding: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Call', 'Doubts'].map(tab => <button key={tab} type="button" onClick={() => tap(tab)} style={{ flex: 1, borderRadius: 999, border: `1.5px solid ${active === tab ? INK : HAIR}`, background: active === tab ? INK : '#fff', color: active === tab ? '#fff' : INK, padding: '9px 8px', fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer' }}>{tab}</button>)}
        </div>
        <div style={{ marginTop: 12 }}><Caption>{active === 'Call' ? 'Your assigned lead cards. Every call starts here.' : "Questions from people who haven't applied yet."}</Caption></div>
      </div>
      <div style={card}>
        <div style={{ fontSize: 13.5, fontWeight: 900 }}>The team board</div>
        <div style={{ display: 'grid', gap: 8, marginTop: 11 }}>
          {[
            ['1', 'Maya', '11 tickets', '₹550'], ['2', 'You', '7 tickets', '₹350'], ['3', 'Kiran', '5 tickets', '₹250'],
          ].map(([rank, name, tickets, money]) => <div key={name} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 8, alignItems: 'center', borderRadius: 10, background: name === 'You' ? '#fff9cc' : '#f7f7f8', padding: '9px 10px' }}><b>{rank}</b><div><b style={{ fontSize: 12.5 }}>{name}</b><div style={{ color: MUTED, fontSize: 10.5 }}>{tickets}</div></div><b style={{ color: GREEN, fontSize: 12.5 }}>{money}</b></div>)}
        </div>
      </div>
    </div>
  );
}

const STATUS_EXPLANATIONS: Array<[string, string, 'neutral' | 'green' | 'amber' | 'red']> = [
  ['Pending', "They've applied and are waiting. Call, make sure they're a fit, and approve them.", 'neutral'],
  ['Invited', 'You approved them; the payment link is with them on WhatsApp. Stay close until they pay.', 'amber'],
  ['Fully paid', 'Money received, spot confirmed. This is when you earn.', 'green'],
  ['Waitlist', 'Their date sold out. Call, offer the other date, then shift.', 'amber'],
  ['Rejected', 'Not a fit for this plan. Handled respectfully and closed.', 'red'],
  ['Cart abandoned', "Opened the payment page, didn't finish. Make the trust call.", 'red'],
  ['Re-target', '24h since invite, never opened the payment page. Resend + call.', 'amber'],
  ['Recovered', 'Abandoned, then came back and paid. A save — it counts.', 'green'],
];

function LevelFiveMock({ onReadyChange }: MockProps) {
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [active, setActive] = useState('Pending');
  useReady(['Pending', 'Invited', 'Fully paid'].every(x => opened.has(x)), onReadyChange);
  const current = STATUS_EXPLANATIONS.find(([name]) => name === active)!;
  return (
    <div style={card}>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {STATUS_EXPLANATIONS.map(([name, , tone]) => <button key={name} type="button" onClick={() => { setActive(name); setOpened(old => new Set(old).add(name)); }} style={{ border: active === name ? `1.5px solid ${INK}` : '1.5px solid transparent', padding: 2, borderRadius: 999, background: '#fff', cursor: 'pointer' }}><Status tone={tone}>{opened.has(name) ? '✓ ' : ''}{name}</Status></button>)}
      </div>
      <div style={{ marginTop: 13 }}><Caption tone={current[2] === 'green' ? 'green' : current[2] === 'amber' ? 'amber' : 'neutral'}>{current[1]}</Caption></div>
      <div style={{ color: MUTED, fontSize: 10.5, marginTop: 10 }}>Tap Pending, Invited and Fully paid to continue.</div>
    </div>
  );
}

function LevelSixMock({ demoLead, onReadyChange }: MockProps) {
  const [step, setStep] = useState(0);
  useReady(step >= 2, onReadyChange);
  const status = step === 0 ? 'Pending' : step === 1 ? 'Invited' : 'Fully paid';
  return (
    <LeadCard demoLead={demoLead} status={status} tone={step === 2 ? 'green' : step === 1 ? 'amber' : 'neutral'}>
      {step === 0 && <button type="button" style={action} onClick={() => setStep(1)}>Approve</button>}
      {step === 1 && <div style={{ display: 'grid', gap: 10 }}><Caption tone="green"><strong>Invite sent — automatically.</strong> WhatsApp sent the invite and payment link. You never send payment links yourself.</Caption><button type="button" style={{ ...action, background: GOLD, color: INK }} onClick={() => setStep(2)}>Skip ahead — they pay ₹359</button></div>}
      {step === 2 && <div style={{ display: 'grid', gap: 9 }}><div style={{ borderRadius: 12, background: '#f0fdf4', color: GREEN, padding: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}><span>Commission</span><span>+ ₹50</span></div><Caption tone="green"><strong>This is the moment you earn.</strong> A fixed amount for every fully-paid ticket — your dashboard always shows your exact rate.</Caption><Caption>That&apos;s the whole happy path: <strong>call → approve → they pay → you earn.</strong> The rest of this training is about the days when it doesn&apos;t go this smoothly.</Caption></div>}
    </LeadCard>
  );
}

function LevelSevenMock({ demoLead, onReadyChange }: MockProps) {
  const [revealed, setRevealed] = useState(false);
  useReady(true, onReadyChange);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 9 }}>
      <LeadCard demoLead={demoLead} status="Fully paid" tone="green" />
      <div style={{ ...card, padding: 12 }}>
        <div style={{ fontSize: 12.5, fontWeight: 900 }}>What they see</div>
        <div style={{ display: 'grid', gap: 7, marginTop: 10 }}>
          <Caption tone="green">WhatsApp confirmation ✓</Caption>
          <Caption>Receipt · ₹359</Caption>
          <button type="button" onClick={() => setRevealed(true)} style={{ border: `1px solid ${revealed ? GOLD : HAIR}`, borderRadius: 11, background: revealed ? '#fffbea' : '#f7f7f8', padding: 10, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}><b style={{ fontSize: 11.5 }}>Exact meeting spot</b><div style={{ color: MUTED, fontSize: 9.5, marginTop: 3 }}>Reveals closer to the day</div></button>
        </div>
        {revealed && <div style={{ marginTop: 8, color: '#7c5b00', fontSize: 10.5, lineHeight: 1.4 }}>Revealed on this date — not before.</div>}
      </div>
    </div>
  );
}

function LevelEightMock({ demoLead, onReadyChange }: MockProps) {
  const [sent, setSent] = useState(false);
  useReady(sent, onReadyChange);
  return (
    <LeadCard demoLead={demoLead} status="Re-target" tone="amber">
      {!sent ? <button type="button" style={action} onClick={() => setSent(true)}>Resend details</button> : <div style={{ display: 'grid', gap: 8 }}><Caption tone="green">WhatsApp ✓ sent</Caption><Caption tone="green">Email ✓ sent</Caption><div style={{ color: MUTED, fontSize: 11.5, textAlign: 'center' }}>Both channels, one tap. Now make the call.</div></div>}
    </LeadCard>
  );
}

function LevelNineMock({ demoLead, onReadyChange }: MockProps) {
  const [recovered, setRecovered] = useState(false);
  useReady(recovered, onReadyChange);
  return (
    <LeadCard demoLead={demoLead} status={recovered ? 'Recovered' : 'Cart abandoned'} tone={recovered ? 'green' : 'red'}>
      <div style={{ display: 'grid', gap: 10 }}>
        <Caption tone={recovered ? 'green' : 'neutral'}>{recovered ? 'A save. Recovered leads count exactly like any other paid booking.' : 'WhatsApp: Your Chill Sunday Meetup spot is still waiting — complete your payment here.'}</Caption>
        {!recovered && <button type="button" style={action} onClick={() => setRecovered(true)}>You called them — they finish paying</button>}
      </div>
    </LeadCard>
  );
}

function LevelTenMock({ demoLead, onReadyChange }: MockProps) {
  const [applied, setApplied] = useState(false);
  useReady(applied, onReadyChange);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 9 }}>
      <button type="button" onClick={() => setApplied(true)} style={{ ...card, padding: 12, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 5 }}><b style={{ fontSize: 12 }}>Doubts tab</b>{applied && <Status tone="green">Applied ✓</Status>}</div>
        <div style={{ color: AMBER, fontSize: 11.5, lineHeight: 1.45, marginTop: 9 }}>&ldquo;I&apos;d be coming alone — will it be awkward?&rdquo;</div>
        <div style={{ color: MUTED, fontSize: 9.5, marginTop: 8 }}>Tap to answer → they apply → your lead</div>
      </button>
      <div style={{ ...card, padding: 12 }}>
        <b style={{ fontSize: 12 }}>{demoLead.name}</b>
        <div style={{ marginTop: 9, borderRadius: 10, background: '#fffbeb', color: AMBER, border: '1px solid #fde68a', padding: 9, fontSize: 10.5, lineHeight: 1.4 }}>&ldquo;Can I bring a friend along?&rdquo;<div style={{ fontSize: 9, marginTop: 4 }}>Pinned to lead</div></div>
      </div>
    </div>
  );
}

function LevelElevenMock({ demoLead, onReadyChange }: MockProps) {
  const [shifted, setShifted] = useState(false);
  useReady(shifted, onReadyChange);
  const alternateDate = demoLead.date === 'Sun 16 Aug' ? 'Sun 2 Aug' : 'Sun 16 Aug';
  const shiftedLead = { ...demoLead, date: shifted ? alternateDate : demoLead.date };
  return (
    <LeadCard demoLead={shiftedLead} status={shifted ? 'Invited' : 'Waitlist'} tone="amber">
      {!shifted ? <div style={{ display: 'grid', gap: 10 }}><Caption tone="amber">{demoLead.date} · <strong>Sold out</strong></Caption><button type="button" style={action} onClick={() => setShifted(true)}>Change date → {alternateDate}</button></div> : <Caption tone="green">✓ Date updated · moved off waitlist</Caption>}
    </LeadCard>
  );
}

function LevelTwelveMock({ onReadyChange }: MockProps) {
  const [caption, setCaption] = useState(false);
  useReady(true, onReadyChange);
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <button type="button" onClick={() => setCaption(true)} style={{ ...card, width: '100%', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }}>
        <div style={{ color: MUTED, fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase' }}>Your earnings</div>
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}><strong style={{ fontSize: 26, letterSpacing: -0.7 }}>₹350</strong><span style={{ color: GREEN, fontSize: 12, fontWeight: 850 }}>7 tickets</span></div>
        {caption && <div style={{ color: MUTED, fontSize: 10.5, marginTop: 8 }}>Updates the moment a lead hits Fully paid.</div>}
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: 5, alignItems: 'center', fontSize: 10.5, fontWeight: 800, textAlign: 'center' }}>
        <span>Booking</span><span>→</span><span>Event happens</span><span>→</span><span style={{ borderRadius: 999, background: GOLD, padding: '7px 5px' }}>Payout</span>
      </div>
    </div>
  );
}

const VOICE_WAVE = [0.3, .52, .38, .72, .48, .62, .35, .8, .56, .44, .68, .32, .58, .4, .7, .5, .28, .6, .42, .52];
// TODO(owner): replace empty URLs with the founder's L13 voice-note recordings.
const VOICE_NOTES = [
  { title: 'How I open a call', caption: 'The warm first 20 seconds.', url: '' },
  { title: 'When they hesitate', caption: 'Giving room without losing the lead.', url: '' },
  { title: "When it's a no", caption: 'Closing warmly so they come back next time.', url: '' },
];

function VoiceNote({ note, onPlayed }: { key?: React.Key; note: typeof VOICE_NOTES[number]; onPlayed: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const toggle = () => {
    if (!note.url || !audioRef.current) return;
    onPlayed();
    if (audioRef.current.paused) void audioRef.current.play(); else audioRef.current.pause();
  };
  return (
    <div style={{ ...card, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" onClick={toggle} disabled={!note.url} aria-label={note.url ? `${playing ? 'Pause' : 'Play'} ${note.title}` : `${note.title} recording coming soon`} style={{ width: 38, height: 38, borderRadius: '50%', border: 0, background: note.url ? GOLD : '#f0f0f1', color: note.url ? INK : MUTED, fontSize: 15, cursor: note.url ? 'pointer' : 'default' }}>{note.url ? playing ? 'Ⅱ' : '▶' : '…'}</button>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12.5, fontWeight: 850 }}>{note.title}</div><div style={{ color: MUTED, fontSize: 10.5, marginTop: 2 }}>{note.caption}</div></div>
        <div style={{ width: 78, height: 22, display: 'flex', gap: 2, alignItems: 'center' }}>{VOICE_WAVE.map((h, i) => <span key={i} style={{ flex: 1, minWidth: 1.5, height: `${h * 100}%`, background: note.url ? '#d9c164' : '#d4d4d8', borderRadius: 999 }} />)}</div>
      </div>
      {!note.url && <div style={{ color: MUTED, fontSize: 9.5, marginTop: 7, textAlign: 'center' }}>Founder recording coming soon</div>}
      {note.url && <audio ref={audioRef} src={note.url} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />}
    </div>
  );
}

function LevelThirteenMock({ onReadyChange }: MockProps) {
  const hasAudio = VOICE_NOTES.some(note => Boolean(note.url));
  const [played, setPlayed] = useState(false);
  const [contrast, setContrast] = useState<'bad' | 'good' | null>(null);
  useReady(!hasAudio || played, onReadyChange);
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {VOICE_NOTES.map(note => <VoiceNote key={note.title} note={note} onPlayed={() => setPlayed(true)} />)}
      <div style={{ ...card, display: 'grid', gap: 8 }}>
        <button type="button" onClick={() => setContrast('bad')} style={{ border: `1px solid ${contrast === 'bad' ? '#fecaca' : HAIR}`, borderRadius: 11, background: contrast === 'bad' ? '#fef2f2' : '#fff', padding: 11, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', fontSize: 11.5, lineHeight: 1.45 }}>&ldquo;Sir, only 2 spots left, book in the next 10 minutes or lose it!&rdquo;{contrast === 'bad' && <strong style={{ display: 'block', color: '#b91c1c', marginTop: 6 }}>Not us. Fake urgency reads as desperation.</strong>}</button>
        <button type="button" onClick={() => setContrast('good')} style={{ border: `1px solid ${contrast === 'good' ? '#bbf7d0' : HAIR}`, borderRadius: 11, background: contrast === 'good' ? '#f0fdf4' : '#fff', padding: 11, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer', fontSize: 11.5, lineHeight: 1.45 }}>&ldquo;Take your time — want me to hold the details on WhatsApp so you can decide tonight?&rdquo;{contrast === 'good' && <strong style={{ display: 'block', color: '#166534', marginTop: 6 }}>That&apos;s us. Helpful beats pushy, every time.</strong>}</button>
      </div>
    </div>
  );
}

export function TeamLevelMock({ levelId, demoLead, onReadyChange, onTestApplication }: MockProps & { levelId: number }) {
  // Each lesson owns isolated, in-memory state. None of these components imports
  // Supabase or writes to real applications/admin tables.
  const props = useMemo(() => ({ demoLead, onReadyChange, onTestApplication }), [demoLead, onReadyChange, onTestApplication]);
  switch (levelId) {
    case 1: return <LevelOneMock {...props} />;
    case 2: return <LevelTwoMock {...props} />;
    case 3: return <LevelThreeMock {...props} />;
    case 4: return <LevelFourMock {...props} />;
    case 5: return <LevelFiveMock {...props} />;
    case 6: return <LevelSixMock {...props} />;
    case 7: return <LevelSevenMock {...props} />;
    case 8: return <LevelEightMock {...props} />;
    case 9: return <LevelNineMock {...props} />;
    case 10: return <LevelTenMock {...props} />;
    case 11: return <LevelElevenMock {...props} />;
    case 12: return <LevelTwelveMock {...props} />;
    case 13: return <LevelThirteenMock {...props} />;
    default: return null;
  }
}
