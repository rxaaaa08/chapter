// Creator (affiliate) dashboard — chaptera.in/creator.
//
// A creator is a Google-authenticated user whose email is in the `affiliates`
// table. They are NOT in admin_users, so is_admin() is false and every
// RLS-locked customer table stays invisible. This screen shows only their own
// funnel + earnings (via creator_stats_since, time-scoped) and a transparent
// team board (via affiliate_leaderboard). Self-contained auth, mirroring the
// admin panel's Google login.
//
// Design: mobile-first, minimal. A single centered column (~440px), plenty of
// whitespace, one accent (ink black), green only for money.
//
// Time windows: payouts run on a MONTHLY cycle, so the earnings hero shows the
// current calendar month (IST) — what the creator will be paid. The funnel has
// its own rolling range picker (24h / week / month / 90d).
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

type Me = { id: string; handle: string; name: string; email: string; active: boolean };
type RangeStats = { clicks_total: number; clicks_unique: number; apps_total: number; tickets_paid: number; earned: number };
type EventRow = { event_slug: string; title: string; tickets: number; earned: number };
type LeaderRow = { handle: string; name: string; tickets: number; earned: number; is_me: boolean };

// Always show 2 decimals — commissions can be small (8% of a low ticket price),
// and rounding to whole rupees would hide real earnings (e.g. ₹0.08 → ₹0).
const inr = (n: any) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const commissionPerTicket = (ev: EventRow) => ev.tickets > 0 ? Number(ev.earned) / ev.tickets : 0;

// Palette — minimal, one accent.
const INK = '#111';
const MUTED = '#9a9aa2';
const HAIR = '#ececed';
const GREEN = '#16a34a';

const DAY = 24 * 60 * 60 * 1000;
const RANGES: Array<{ key: string; label: string; ms: number }> = [
  { key: '24h', label: '24 hrs', ms: DAY },
  { key: 'week', label: 'Week', ms: 7 * DAY },
  { key: 'month', label: 'Month', ms: 30 * DAY },
  { key: '90d', label: '90 days', ms: 90 * DAY },
];

// Start of the current calendar month in IST (UTC+5:30, no DST) + its name.
const istMonth = () => {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  const y = p.find(x => x.type === 'year')!.value;
  const m = p.find(x => x.type === 'month')!.value;
  const name = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', month: 'long' }).format(new Date());
  return { from: `${y}-${m}-01T00:00:00+05:30`, name };
};

export default function CreatorDashboard() {
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [range, setRange] = useState<string>('month');
  const [funnel, setFunnel] = useState<RangeStats | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [monthEarned, setMonthEarned] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState('');

  // ── Install-app nudge ──
  // Android/Chrome fires beforeinstallprompt (captured in index.html before
  // React mounts) → one-tap install button. iOS has no install API, so show
  // the Share → Add to Home Screen steps. Hidden inside the installed app.
  const isStandalone = typeof window !== 'undefined'
    && (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true);
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
  const [installPrompt, setInstallPrompt] = useState<any>(
    () => typeof window !== 'undefined' ? (window as any).__deferredInstallPrompt ?? null : null
  );
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const onPrompt = (e: any) => { e.preventDefault(); (window as any).__deferredInstallPrompt = e; setInstallPrompt(e); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    try { await installPrompt.userChoice; } catch { /* user dismissed */ }
    setInstallPrompt(null);
    (window as any).__deferredInstallPrompt = null;
  };
  const showInstallCard = !isStandalone && !installed && (installPrompt || isIOS);

  const month = istMonth();

  useEffect(() => {
    let done = false;
    const finish = () => { if (!done) { done = true; setAuthLoading(false); } };
    const resolve = async (userEmail: string | undefined) => {
      setEmail(userEmail ?? null);
      if (!userEmail) { setMe(null); finish(); return; }
      try {
        // Self-select RLS returns only this creator's own affiliates row.
        const { data } = await supabase.from('affiliates').select('id, handle, name, email, active').maybeSingle();
        setMe((data as Me) ?? null);
      } catch {
        setMe(null);
      } finally {
        finish();
      }
    };
    // .catch so a rejected getSession (e.g. a failed token refresh) can't leave
    // the page stuck on "Loading…".
    supabase.auth.getSession().then(({ data: { session } }) => resolve(session?.user?.email)).catch(finish);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => resolve(session?.user?.email));
    // Hard safety net: never hang on the loading screen, even if a promise stalls.
    const t = setTimeout(finish, 6000);
    return () => { subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  // Month earnings (calendar month, the payout cycle) + team board — load once.
  useEffect(() => {
    if (!me) return;
    Promise.all([
      supabase.rpc('creator_stats_since', { p_from: month.from }),
      supabase.rpc('affiliate_leaderboard'),
    ]).then(([monthRes, lbRes]) => {
      const row = Array.isArray(monthRes.data) ? monthRes.data[0] : monthRes.data;
      setMonthEarned(Number((row as RangeStats)?.earned) || 0);
      setLeaderboard((lbRes.data as LeaderRow[]) ?? []);
    }).catch(() => {});
  }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  // Funnel — reloads whenever the range chip changes.
  useEffect(() => {
    if (!me) return;
    setLoading(true);
    const ms = (RANGES.find(r => r.key === range) ?? RANGES[2]).ms;
    const from = new Date(Date.now() - ms).toISOString();
    Promise.all([
      supabase.rpc('creator_stats_since', { p_from: from }),
      supabase.rpc('creator_events_since', { p_from: from }),
    ]).then(([statsRes, evRes]) => {
      const row = Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data;
      setFunnel((row as RangeStats) ?? null);
      setEvents((evRes.data as EventRow[]) ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [me, range]);

  const login = async () => {
    setAuthError('');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/creator' },
    });
  };
  const resetCreatorState = () => {
    setMe(null);
    setEmail(null);
    setFunnel(null);
    setEvents([]);
    setMonthEarned(0);
    setLeaderboard([]);
    setCopied(false);
  };
  const logout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setAuthError('');
    resetCreatorState();
    try {
      await supabase.auth.signOut();
    } catch {
      setAuthError('Could not fully sign out. Please refresh and try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const link = me ? `${window.location.origin}/@${me.handle}` : '';
  const linkShort = link.replace(/^https?:\/\//, '');
  const copyLink = () => {
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  const wrap: React.CSSProperties = { minHeight: '100vh', background: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', color: INK, WebkitFontSmoothing: 'antialiased' };

  // ── Loading ──
  if (authLoading) {
    return <div style={{ ...wrap, display: 'grid', placeItems: 'center' }}><div style={{ color: MUTED, fontSize: 14 }}>Loading…</div></div>;
  }

  // ── Not logged in ──
  if (!email) {
    return (
      <div style={{ ...wrap, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ maxWidth: 340, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, marginBottom: 8 }}>Creator dashboard</div>
          <div style={{ color: MUTED, fontSize: 14, marginBottom: 26, lineHeight: 1.55 }}>Sign in to see your link's clicks, bookings and earnings.</div>
          {authError && <div style={{ color: '#dc2626', fontSize: 12.5, marginBottom: 12 }}>{authError}</div>}
          <button onClick={login} style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: INK, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // ── Logged in but not a creator ──
  if (!me) {
    return (
      <div style={{ ...wrap, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 21, fontWeight: 800, marginBottom: 10 }}>Not a creator account</div>
          <div style={{ color: MUTED, fontSize: 14, marginBottom: 22, lineHeight: 1.55 }}>
            <b style={{ color: INK }}>{email}</b> isn't set up as a creator yet. If you think this is a mistake, contact the team to add this exact email.
          </div>
          {authError && <div style={{ color: '#dc2626', fontSize: 12.5, marginBottom: 12 }}>{authError}</div>}
          <button
            onClick={logout}
            disabled={signingOut}
            style={{ padding: '11px 24px', borderRadius: 12, border: '1.5px solid ' + HAIR, background: '#fff', fontWeight: 700, fontSize: 14, cursor: signingOut ? 'default' : 'pointer', opacity: signingOut ? 0.6 : 1 }}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    );
  }

  // ── Creator dashboard ──
  const conv = funnel && funnel.clicks_total > 0 ? Math.round((funnel.tickets_paid / funnel.clicks_total) * 100) : null;
  const interestPct = funnel && funnel.clicks_total > 0 ? Math.round((funnel.apps_total / funnel.clicks_total) * 100) : null;

  const tiles = [
    { label: 'Clicks', value: funnel?.clicks_total ?? 0, sub: '' },
    { label: 'Sign-ups', value: funnel?.apps_total ?? 0, sub: interestPct != null ? `${interestPct}% of clicks showed interest` : '' },
    { label: 'Paid', value: funnel?.tickets_paid ?? 0, sub: conv != null ? `${conv}% of clicks` : '' },
  ];

  return (
    <div style={{ ...wrap, padding: '22px 18px 64px' }}>
      <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.1 }}>Hi {me.name.split(' ')[0]}</div>
            {!me.active && <div style={{ fontSize: 12.5, color: '#dc2626', marginTop: 2 }}>Your account is paused — contact the team.</div>}
          </div>
          <button
            onClick={logout}
            disabled={signingOut}
            style={{ padding: '6px 12px', borderRadius: 9, border: 'none', background: 'none', fontSize: 13, fontWeight: 600, color: MUTED, cursor: signingOut ? 'default' : 'pointer', opacity: signingOut ? 0.6 : 1 }}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>

        {/* Earnings — the hero, this month (payout cycle) */}
        <div>
          <div style={{ fontSize: 12.5, color: MUTED, fontWeight: 600, marginBottom: 4 }}>Earned in {month.name}</div>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1, color: INK }}>{inr(monthEarned)}</div>
          <div style={{ fontSize: 13.5, color: MUTED, marginTop: 10 }}>Paid out monthly.</div>
        </div>

        {/* Your link */}
        <div style={{ border: '1.5px solid ' + HAIR, borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 8 }}>Your Custom Link</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{linkShort}</div>
            <button onClick={copyLink} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 10, border: 'none', background: copied ? GREEN : INK, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'background 0.15s' }}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div style={{ fontSize: 12, color: MUTED, marginTop: 10, lineHeight: 1.5 }}>You earn when someone books a chapter அ experience through it.</div>
        </div>

        {/* Install-app nudge (hidden once installed / inside the app) */}
        {showInstallCard && (
          <div style={{ border: '1.5px solid ' + HAIR, borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <img src="/icon-creator-192.png" alt="" width={44} height={44} style={{ borderRadius: 11, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 750, fontSize: 14 }}>Get the creators app</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2, lineHeight: 1.45 }}>
                {installPrompt
                  ? 'Check your stats anytime from your home screen.'
                  : <>Tap <b style={{ color: INK }}>Share</b> then <b style={{ color: INK }}>Add to Home Screen</b>.</>}
              </div>
            </div>
            {installPrompt && (
              <button onClick={installApp} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 10, border: 'none', background: INK, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Install
              </button>
            )}
          </div>
        )}

        {/* Funnel — with range picker */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>Your funnel</div>
            <div style={{ flex: 1 }} />
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={range}
                onChange={e => setRange(e.target.value)}
                aria-label="Funnel date range"
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  border: '1.5px solid ' + HAIR,
                  borderRadius: 999,
                  background: '#fff',
                  color: INK,
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '6px 42px 6px 11px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {RANGES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  right: 20,
                  width: 8.2,
                  height: 8.2,
                  borderRight: '2.05px solid ' + INK,
                  borderBottom: '2.05px solid ' + INK,
                  transform: 'translateY(-2px) rotate(45deg)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', border: '1.5px solid ' + HAIR, borderRadius: 16, overflow: 'hidden', opacity: loading ? 0.5 : 1, transition: 'opacity 0.15s' }}>
            {tiles.map((m, i) => (
              <div key={m.label} style={{ flex: 1, textAlign: 'center', padding: '16px 6px', borderLeft: i === 0 ? 'none' : '1px solid ' + HAIR }}>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: INK, marginTop: 6 }}>{m.label}</div>
                {m.sub ? <div style={{ fontSize: 10.5, color: MUTED, marginTop: 1 }}>{m.sub}</div> : null}
              </div>
            ))}
          </div>
        </div>

        {/* Your conversions — itemizes the "Paid" tile for the selected range */}
        <div>
          <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Your conversions</div>
          <div style={{ border: '1.5px solid ' + HAIR, borderRadius: 16, overflow: 'hidden' }}>
            {events.length === 0 && (
              <div style={{ padding: '18px 16px', color: MUTED, fontSize: 13.5, lineHeight: 1.5 }}>
                No paid tickets in this range yet.
              </div>
            )}
            {events.map((ev, i) => (
              <div key={ev.event_slug} style={{ padding: '14px 16px', borderTop: i === 0 ? 'none' : '1px solid ' + HAIR }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 750, fontSize: 14.5, lineHeight: 1.25 }}>{ev.title}</div>
                    <div style={{ fontSize: 11.5, color: MUTED, marginTop: 4 }}>{ev.tickets} {ev.tickets === 1 ? 'ticket bought' : 'tickets bought'}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: GREEN }}>{inr(ev.earned)}</div>
                    <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>total</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, padding: '9px 11px', borderRadius: 12, background: '#f7f7f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 12, color: MUTED, fontWeight: 700 }}>Commission per ticket</span>
                  <span style={{ fontSize: 13.5, color: INK, fontWeight: 800 }}>{inr(commissionPerTicket(ev))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* The Team */}
        <div>
          <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 }}>The Team</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {leaderboard.length === 0 && <div style={{ color: MUTED, fontSize: 13.5, padding: '10px 0' }}>No earnings on the board yet. Be the first!</div>}
            {leaderboard.map((r, i) => (
              <div key={r.handle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, background: r.is_me ? '#f5f5f5' : 'transparent' }}>
                <div style={{ width: 20, textAlign: 'center', fontWeight: 800, fontSize: 14, color: i === 0 ? '#eab308' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : '#ccc' }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    @{r.handle}{r.is_me && <span style={{ fontSize: 11, color: MUTED, marginLeft: 6, fontWeight: 600 }}>you</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: MUTED }}>{r.tickets} {r.tickets === 1 ? 'ticket' : 'tickets'}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: r.earned > 0 ? GREEN : MUTED }}>{inr(r.earned)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: MUTED, textAlign: 'center', lineHeight: 1.55, marginTop: 4 }}>
          You earn a commission when someone books through your link and pays. Earnings are paid out monthly.
        </div>
      </div>
    </div>
  );
}
