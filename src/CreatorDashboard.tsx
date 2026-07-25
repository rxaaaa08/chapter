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
import React, { useEffect, useRef, useState } from 'react';
import chatProfile from './assets/chat-profile.jpg';
import { supabase } from './supabase';
import CreatorOnboarding from './CreatorOnboarding';
import CreatorUpcomingEvents from './CreatorUpcomingEvents';
import CreatorFirstBookingChecklist from './CreatorFirstBookingChecklist';
import CreatorVideoTasks, { CreatorTasksCard, latestByTask, loadCreatorSubmissions, loadCreatorTasks, narrowToStarter, type CreatorSubmission, type CreatorTask } from './CreatorVideoTasks';
import { CREATOR_FOOTAGE_URL, CREATOR_GROUP_CHAT_URL } from './creatorLinks';

// Creator checklist state — action flags are persisted per creator id; the
// 25-click / first-booking ticks derive from live lifetime stats.
type ChecklistState = { joinedChat: boolean; openedDrive: boolean; copied: boolean };
type ChecklistStep = 'joined_chat' | 'opened_drive' | 'copied_link';
type ChecklistRpcRow = { joined_chat: boolean; opened_drive: boolean; copied_link: boolean };
const CHECKLIST_DEFAULT: ChecklistState = { joinedChat: false, openedDrive: false, copied: false };
const checklistKey = (id: string) => `creatorChecklist:${id}`;

// The "Essentials" card. Each row renders only when its URL is set; the whole
// card is null if both are blank. Lives at module scope (depends only on the URLs).
const RES_INK = '#111';
const RES_MUTED = '#9a9aa2';
const essentialTile = (url: string, title: string, helper: string, action: string, icon: React.ReactNode) => (
  <a className="creator-essential-tile" key={title} href={url} target="_blank" rel="noopener noreferrer" aria-label={`${action}: ${title}`} style={{ minWidth: 0, height: '100%', boxSizing: 'border-box', padding: '18px 11px 16px', background: '#fff', textDecoration: 'none', color: RES_INK, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
    <span aria-hidden="true" style={{ width: 40, height: 36, display: 'grid', placeItems: 'center', marginBottom: 9 }}>{icon}</span>
    <span style={{ display: 'block', fontSize: 12.5, fontWeight: 800, lineHeight: 1.25 }}>{title}</span>
    <span style={{ display: 'block', fontSize: 11.5, color: RES_MUTED, lineHeight: 1.45, marginTop: 5, marginBottom: 11 }}>{helper}</span>
    <span style={{ minHeight: 28, marginTop: 'auto', padding: '6px 10px', border: '1px solid #d9d9dd', borderRadius: 999, background: '#f5f5f6', color: '#4b4b52', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11, fontWeight: 800, lineHeight: 1, boxSizing: 'border-box' }}>
      {action}
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3.25 8.75 8.75 3.25M4.25 3.25h4.5v4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  </a>
);
// Takes starterOnly rather than reading state, so it can stay at module scope:
// a creator with no approved video sees the same narrowed event list here as in
// their submission card.
const teamResourcesCard = (starterOnly: boolean) => (CREATOR_FOOTAGE_URL || CREATOR_GROUP_CHAT_URL) ? (
  <div>
    <div style={{ fontSize: 11.5, color: RES_MUTED, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>The Essentials</div>
    <div style={{ border: '1px solid #a1a1aa', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
      <div className="creator-essential-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', alignItems: 'stretch' }}>
        {CREATOR_FOOTAGE_URL && essentialTile(
          CREATOR_FOOTAGE_URL, 'Our Google Drive', 'All the best clips from our events in one place.', 'Open folder',
          <svg width="34" height="30" viewBox="0 0 64 56" aria-hidden="true">
            <path fill="#0F9D58" d="M24 4h16l20 34H44L32 18z" />
            <path fill="#F4B400" d="M24 4 32 18 12 52 4 38z" />
            <path fill="#4285F4" d="M4 38h40l8 14H12z" />
          </svg>,
        )}
        {CREATOR_GROUP_CHAT_URL && essentialTile(
          CREATOR_GROUP_CHAT_URL, "Creator's Groupchat", 'Receive instant updates & help from the team.', 'Join group',
          <svg width="34" height="34" viewBox="0 0 56 56" aria-hidden="true">
            <circle cx="28" cy="27" r="22" fill="#25D366" />
            <path d="m12.5 41.5-3 9 9.5-3" fill="#25D366" />
            <path d="M18.5 15.5c.8-.8 2.1-.7 2.8.2l3.2 4.2c.6.8.5 1.8-.2 2.5l-2 2c2.1 4.2 5.2 7.3 9.4 9.4l2-2c.7-.7 1.7-.8 2.5-.2l4.2 3.2c.9.7 1 2 .2 2.8l-1.7 1.7c-1.8 1.8-4.5 2.4-6.9 1.6-8.9-3.1-15.9-10.1-19-19-.8-2.4-.2-5.1 1.6-6.9z" fill="#fff" />
          </svg>,
        )}
      </div>
      <CreatorUpcomingEvents embedded starterOnly={starterOnly} />
    </div>
  </div>
) : null;

type Me = {
  id: string;
  handle: string;
  name: string;
  email: string;
  active: boolean;
  checklist_joined_chat_at: string | null;
  checklist_opened_drive_at: string | null;
  checklist_copied_link_at: string | null;
};
type RangeStats = { clicks_total: number; clicks_unique: number; apps_total: number; tickets_paid: number; earned: number };
type LifetimeStats = Pick<RangeStats, 'clicks_total' | 'tickets_paid'>;
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

function CreatorConversionsCard({ events }: { events: EventRow[] }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 10 }}>Your conversions</div>
      <div style={{ border: '1.5px solid ' + HAIR, borderRadius: 16, overflow: 'hidden' }}>
        {events.length === 0 && (
          <div style={{ padding: '18px 16px', color: MUTED, fontSize: 13.5, lineHeight: 1.5, textAlign: 'center' }}>
            No paid tickets in this range yet.
          </div>
        )}
        {events.map((ev, i) => (
          <div key={ev.event_slug} style={{ padding: '15px 16px', borderTop: i === 0 ? 'none' : '1px solid ' + HAIR }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'baseline', columnGap: 14 }}>
              <div style={{ minWidth: 0, fontWeight: 750, fontSize: 14.5, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
              <div style={{ justifySelf: 'end', textAlign: 'right', fontWeight: 800, fontSize: 15, lineHeight: 1.25, color: GREEN, whiteSpace: 'nowrap' }}>{inr(ev.earned)}</div>
              <div style={{ gridColumn: '1 / -1', minWidth: 0, fontSize: 12, color: MUTED, lineHeight: 1.35, marginTop: 5 }}>
                {ev.tickets} {ev.tickets === 1 ? 'ticket' : 'tickets'} × {inr(commissionPerTicket(ev))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreatorTeamCard({ leaderboard }: { leaderboard: LeaderRow[] }) {
  const leaderboardScrollRef = useRef<HTMLDivElement>(null);
  const [leaderScroll, setLeaderScroll] = useState({ ratio: 1, progress: 0, scrollable: false });

  const syncLeaderboardScroll = (node: HTMLDivElement | null) => {
    if (!node) return;
    const maxScroll = Math.max(0, node.scrollHeight - node.clientHeight);
    const rawRatio = node.scrollHeight > 0 ? Math.min(1, node.clientHeight / node.scrollHeight) : 1;
    const minRatio = node.clientHeight > 0 ? Math.min(1, 22 / node.clientHeight) : 1;
    const next = {
      ratio: Math.max(rawRatio, minRatio),
      progress: maxScroll > 0 ? node.scrollTop / maxScroll : 0,
      scrollable: maxScroll > 1,
    };
    setLeaderScroll(current => (
      Math.abs(current.ratio - next.ratio) < 0.001
      && Math.abs(current.progress - next.progress) < 0.001
      && current.scrollable === next.scrollable
    ) ? current : next);
  };

  useEffect(() => {
    const node = leaderboardScrollRef.current;
    if (!node) return;
    const sync = () => syncLeaderboardScroll(node);
    sync();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null;
    observer?.observe(node);
    window.addEventListener('resize', sync);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [leaderboard.length]);

  return (
    <div>
      <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 12 }}>The Team</div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0, border: '1px solid ' + INK, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
          <div
            ref={leaderboardScrollRef}
            className="creator-leaderboard-scroll"
            onScroll={event => syncLeaderboardScroll(event.currentTarget)}
            style={{ maxHeight: 244, overflowY: 'auto', overscrollBehavior: 'contain' }}
          >
            {leaderboard.length === 0 && <div style={{ color: MUTED, fontSize: 13.5, padding: '18px 16px' }}>No earnings on the board yet. Be the first!</div>}
            {leaderboard.map((r, i) => (
              <div key={r.handle} style={{ display: 'grid', gridTemplateColumns: '20px minmax(0, 1fr) minmax(88px, auto)', alignItems: 'center', columnGap: 12, padding: '12px 14px', borderTop: i === 0 ? 'none' : '1px solid ' + HAIR, background: r.is_me ? '#f5f5f5' : '#fff' }}>
                <div style={{ width: 20, textAlign: 'center', fontWeight: 800, fontSize: 14, color: i === 0 ? '#eab308' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : '#ccc' }}>{i + 1}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    @{r.handle}{r.is_me && <span style={{ fontSize: 11, color: MUTED, marginLeft: 6, fontWeight: 600 }}>you</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: MUTED }}>{r.tickets} {r.tickets === 1 ? 'ticket' : 'tickets'}</div>
                </div>
                <div style={{ minWidth: 88, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', justifySelf: 'end', textAlign: 'right' }}>
                  {r.tickets === 0 ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', minHeight: 16, padding: '2px 6px', border: '1px solid #e1f2e6', borderRadius: 999, background: '#f7fcf8', color: '#4f7f5d', fontSize: 9.5, fontWeight: 750, lineHeight: 1, whiteSpace: 'nowrap' }}>
                      Newly Joined
                    </span>
                  ) : (
                    <div style={{ fontWeight: 800, fontSize: 15, color: GREEN, whiteSpace: 'nowrap' }}>{inr(r.earned)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {leaderScroll.scrollable && (
          <div aria-hidden="true" style={{ position: 'relative', width: 3, flexShrink: 0, margin: '8px 0', borderRadius: 999, background: '#e4e4e7', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: `${leaderScroll.progress * (1 - leaderScroll.ratio) * 100}%`, height: `${leaderScroll.ratio * 100}%`, borderRadius: 999, background: INK, transition: 'top 80ms linear' }} />
          </div>
        )}
      </div>
      <div style={{ marginTop: 18, color: '#57534e', fontSize: 13.5, lineHeight: 1.6, textAlign: 'center' }}>
        Need help? Feel free to{' '}
        <a
          href="https://wa.me/919940111564"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}
        >
          Contact Us
        </a>
      </div>
    </div>
  );
}

export default function CreatorDashboard() {
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  // Distinguishes "genuinely not a creator" (absent) from "lookup still running
  // or failed" (loading/error). The error state is load-bearing: a flaky request
  // must never fall through to the "not a creator" screen.
  const [meStatus, setMeStatus] = useState<'loading' | 'found' | 'absent' | 'error'>('loading');
  const [lookupNonce, setLookupNonce] = useState(0); // bump to retry the lookup
  const [range, setRange] = useState<string>('month');
  const [funnel, setFunnel] = useState<RangeStats | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [monthEarned, setMonthEarned] = useState<number>(0);
  const [lifetimeClicks, setLifetimeClicks] = useState<number>(0);
  const [lifetimeTickets, setLifetimeTickets] = useState<number>(0);
  const [checklist, setChecklist] = useState<ChecklistState>(CHECKLIST_DEFAULT);
  // Video tasks: derived from live events, never assigned. `submissions` is this
  // creator's own rows only — RLS guarantees that, so the query carries no filter.
  const [tasks, setTasks] = useState<CreatorTask[]>([]);
  const [submissions, setSubmissions] = useState<CreatorSubmission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(false);
  // The centered mark stays up until the dashboard's first data has landed, so a
  // creator never sees a frame of ₹0.00 and empty cards before the real numbers
  // arrive. One flag per initial load; each flips true even on failure, so a
  // broken RPC shows the dashboard rather than spinning forever.
  const [statsReady, setStatsReady] = useState(false);   // month earnings + lifetime milestones + team board
  const [funnelReady, setFunnelReady] = useState(false); // funnel + conversions (first load only)
  const [tasksReady, setTasksReady] = useState(false);   // video tasks + own submissions
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [authError, setAuthError] = useState('');
  // New-creator onboarding intent. Set before the Google OAuth redirect and read
  // back on remount (sessionStorage survives the bounce), so a fresh signer who
  // chose "I'm a new creator" lands in onboarding instead of the dead-end screen.
  const [wantsOnboarding, setWantsOnboarding] = useState<boolean>(() => {
    try { return sessionStorage.getItem('creatorOnboardingIntent') === '1'; } catch { return false; }
  });
  const startOnboarding = () => {
    try { sessionStorage.setItem('creatorOnboardingIntent', '1'); } catch { /* private mode */ }
    setWantsOnboarding(true);
  };
  const clearOnboardingIntent = () => {
    try { sessionStorage.removeItem('creatorOnboardingIntent'); } catch { /* private mode */ }
    setWantsOnboarding(false);
  };
  // Signup finished → drop the intent and re-run the creator lookup; the row now
  // exists, so the dashboard renders on the next pass.
  const completeOnboarding = () => {
    clearOnboardingIntent();
    setMeStatus('loading');
    setLookupNonce(n => n + 1);
  };

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

  // Track only WHO is logged in here. The creator lookup is deliberately kept
  // OUT of the auth callback: onAuthStateChange can fire before the new session
  // token is attached to the client, so a query made inside it may run
  // unauthenticated and — thanks to self-select RLS — come back empty. That
  // false "no row" is what produced the intermittent "not a creator" screen
  // right after signing in.
  useEffect(() => {
    let mounted = true;
    const apply = (userEmail: string | undefined) => {
      if (!mounted) return;
      setEmail(userEmail ?? null);
      setAuthReady(true);
    };
    // .catch so a rejected getSession (e.g. a failed token refresh) can't leave
    // the page stuck on "Loading…".
    supabase.auth.getSession()
      .then(({ data: { session } }) => apply(session?.user?.email))
      .catch(() => { if (mounted) setAuthReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => apply(session?.user?.email));
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Look up the creator row once auth has settled (and again on manual retry).
  // Failures surface as an error state with a Retry button — they must NEVER be
  // silently treated as "not a creator". An empty result on the first try right
  // after login is retried once, in case the auth token attached a beat late.
  useEffect(() => {
    if (!authReady) return;
    if (!email) { setMe(null); setMeStatus('absent'); return; }
    let cancelled = false;
    setMeStatus('loading');
    const withTimeout = <T,>(p: PromiseLike<T>, ms: number): Promise<T> =>
      Promise.race([
        Promise.resolve(p),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
      ]);
    (async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        let data: any = null, error: any = null;
        try {
          // Self-select RLS returns only this creator's own affiliates row.
          const res: any = await withTimeout(
            supabase.from('affiliates').select('id, handle, name, email, active, checklist_joined_chat_at, checklist_opened_drive_at, checklist_copied_link_at').maybeSingle(),
            5000,
          );
          data = res.data; error = res.error;
        } catch (e) {
          error = e;
        }
        if (cancelled) return;
        if (error) {
          // Network/permission/timeout — retry once, then surface as an error.
          if (attempt === 0) { await new Promise(r => setTimeout(r, 600)); if (cancelled) return; continue; }
          setMeStatus('error');
          return;
        }
        if (data) { setMe(data as Me); setMeStatus('found'); return; }
        // No row — could be a token race on the first attempt; retry once.
        if (attempt === 0) { await new Promise(r => setTimeout(r, 600)); if (cancelled) return; continue; }
        setMe(null);
        setMeStatus('absent');
        return;
      }
    })();
    return () => { cancelled = true; };
  }, [authReady, email, lookupNonce]);

  // Month earnings, lifetime checklist milestones, and team board — load once.
  useEffect(() => {
    if (!me) return;
    Promise.all([
      supabase.rpc('creator_stats_since', { p_from: month.from }),
      supabase.rpc('creator_stats'),
      supabase.rpc('affiliate_leaderboard'),
    ]).then(([monthRes, lifetimeRes, lbRes]) => {
      const monthRow = Array.isArray(monthRes.data) ? monthRes.data[0] : monthRes.data;
      const lifetimeRow = Array.isArray(lifetimeRes.data) ? lifetimeRes.data[0] : lifetimeRes.data;
      const tickets = Number((lifetimeRow as LifetimeStats)?.tickets_paid) || 0;
      setMonthEarned(Number((monthRow as RangeStats)?.earned) || 0);
      setLifetimeClicks(Number((lifetimeRow as LifetimeStats)?.clicks_total) || 0);
      setLifetimeTickets(tickets);
      setLeaderboard((lbRes.data as LeaderRow[]) ?? []);
    }).catch(() => {}).finally(() => setStatsReady(true));
  }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load permanent checklist flags from the creator row. Merge the old
  // localStorage shape once so existing completions migrate to the database.
  useEffect(() => {
    if (!me) { setChecklist(CHECKLIST_DEFAULT); return; }
    let cancelled = false;
    let legacy = CHECKLIST_DEFAULT;
    try {
      const raw = localStorage.getItem(checklistKey(me.id));
      const parsed = raw ? JSON.parse(raw) : {};
      legacy = {
        joinedChat: Boolean(parsed.joinedChat),
        openedDrive: Boolean(parsed.openedDrive),
        copied: Boolean(parsed.copied),
      };
    } catch { /* private mode / malformed legacy state */ }

    const server = {
      joinedChat: Boolean(me.checklist_joined_chat_at),
      openedDrive: Boolean(me.checklist_opened_drive_at),
      copied: Boolean(me.checklist_copied_link_at),
    };
    const merged = {
      joinedChat: server.joinedChat || legacy.joinedChat,
      openedDrive: server.openedDrive || legacy.openedDrive,
      copied: server.copied || legacy.copied,
    };
    setChecklist(merged);

    const pending: ChecklistStep[] = [];
    if (legacy.joinedChat && !server.joinedChat) pending.push('joined_chat');
    if (legacy.openedDrive && !server.openedDrive) pending.push('opened_drive');
    if (legacy.copied && !server.copied) pending.push('copied_link');
    if (pending.length > 0) {
      void (async () => {
        for (const p_step of pending) {
          if (cancelled) return;
          await supabase.rpc('complete_creator_checklist_step', { p_step });
        }
      })();
    }
    return () => { cancelled = true; };
  }, [me]);

  // Video tasks + this creator's submissions. Runs only once `me` has settled,
  // never inside onAuthStateChange — the token may not be attached yet there,
  // which is the race that once produced a false "not a creator" screen.
  useEffect(() => {
    if (!me) { setTasks([]); setSubmissions([]); return; }
    let cancelled = false;
    void (async () => {
      try {
        const [taskRows, submissionRows] = await Promise.all([
          loadCreatorTasks().catch(() => [] as CreatorTask[]),
          loadCreatorSubmissions(),
        ]);
        if (cancelled) return;
        setTasks(taskRows);
        setSubmissions(submissionRows);
      } finally {
        if (!cancelled) setTasksReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [me]);

  // Belt and braces: a request that neither resolves nor rejects would otherwise
  // hold the loading mark forever. After this window the dashboard renders with
  // whatever has arrived — the old behaviour — rather than showing nothing.
  useEffect(() => {
    if (!me) return;
    const timer = setTimeout(() => { setStatsReady(true); setFunnelReady(true); setTasksReady(true); }, 6000);
    return () => clearTimeout(timer);
  }, [me]);

  const completeChecklistStep = (step: ChecklistStep, patch: Partial<ChecklistState>) => {
    setChecklist(prev => {
      const next = { ...prev, ...patch };
      if (me) { try { localStorage.setItem(checklistKey(me.id), JSON.stringify(next)); } catch { /* private mode */ } }
      return next;
    });
    if (!me) return;
    void supabase.rpc('complete_creator_checklist_step', { p_step: step }).then(({ data, error }) => {
      if (error) return; // optimistic local fallback retries through migration on next login
      const row = (Array.isArray(data) ? data[0] : data) as ChecklistRpcRow | null;
      if (!row) return;
      setChecklist(prev => ({
        joinedChat: prev.joinedChat || Boolean(row.joined_chat),
        openedDrive: prev.openedDrive || Boolean(row.opened_drive),
        copied: prev.copied || Boolean(row.copied_link),
      }));
    });
  };

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
    }).catch(() => setLoading(false))
      // First load only — never set back to false, or changing the range chip
      // would throw the whole dashboard back to the loading mark.
      .finally(() => setFunnelReady(true));
  }, [me, range]);

  // An existing creator who happened to tap "I'm a new creator" resolves to a real
  // row — drop the now-stale intent so we never show them onboarding.
  useEffect(() => { if (me) clearOnboardingIntent(); }, [me]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async () => {
    setAuthError('');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/creator' },
    });
  };
  const resetCreatorState = () => {
    setMe(null);
    setMeStatus('absent');
    setEmail(null);
    setFunnel(null);
    setEvents([]);
    setMonthEarned(0);
    setLifetimeClicks(0);
    setLifetimeTickets(0);
    setChecklist(CHECKLIST_DEFAULT);
    setLeaderboard([]);
    setCopied(false);
    // Signing out must re-arm the loading gate, or the next login would flash
    // the previous creator's empty dashboard before their own data arrives.
    setStatsReady(false);
    setFunnelReady(false);
    setTasksReady(false);
    clearOnboardingIntent();
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

  useEffect(() => {
    if (!accountMenuOpen) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountMenuOpen]);

  const link = me ? `${window.location.origin}/@${me.handle}` : '';
  const linkShort = link.replace(/^https?:\/\//, '');
  const copyLink = () => {
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      if (!checklist.copied) completeChecklistStep('copied_link', { copied: true });
      setTimeout(() => setCopied(false), 1600);
    });
  };

  // 100% (not 100vh) so the screen fills the MobileShell frame exactly — no
  // overflow past the phone frame on desktop, no stray scroll gap.
  const wrap: React.CSSProperties = { minHeight: '100%', background: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', color: INK, WebkitFontSmoothing: 'antialiased' };

  // ── Loading (auth not settled, or logged in and lookup still running) ──
  // Loading mark: while auth settles, while the creator row is being looked up,
  // and — once we know they ARE a creator — until their first data has landed.
  // The onboarding, "not a creator" and error branches below are unaffected.
  const dashboardDataReady = statsReady && funnelReady && tasksReady;
  if (!authReady || (email && meStatus === 'loading') || (meStatus === 'found' && me?.active && !dashboardDataReady)) {
    return (
      <div style={{ ...wrap, display: 'grid', placeItems: 'center' }}>
        <style>{`
          @keyframes creatorLoaderEnter {
            from { opacity: 0; transform: scale(0.85); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes creatorLoaderGlow {
            0%, 100% { opacity: 0.15; transform: scale(1); }
            50% { opacity: 0.45; transform: scale(1.18); }
          }
          @media (prefers-reduced-motion: reduce) {
            .creator-loader-mark { animation: none !important; }
            .creator-loader-glow { animation: none !important; opacity: 0.25 !important; }
          }
        `}</style>
        <div role="status" aria-label="Loading" className="creator-loader-mark" style={{ position: 'relative', width: 64, height: 64, animation: 'creatorLoaderEnter 0.35s ease-out both' }}>
          <div className="creator-loader-glow" aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: 16, background: '#FFD700', filter: 'blur(10px)', animation: 'creatorLoaderGlow 2s ease-in-out infinite' }} />
          <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 16, background: '#000', boxShadow: '0 8px 22px rgba(0,0,0,0.22)', overflow: 'hidden', padding: 6, boxSizing: 'border-box' }}>
            <img src={chatProfile} alt="" aria-hidden="true" style={{ width: '100%', height: '100%', objectFit: 'contain', transform: 'translateY(2px) scale(1.02)' }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Not logged in ──
  if (!email) {
    return (
      <div style={{ ...wrap, width: '100%', height: '100%', minHeight: 0, display: 'grid', placeItems: 'center', boxSizing: 'border-box', overflow: 'hidden', overscrollBehavior: 'none', padding: 24 }}>
        <style>{`
          @keyframes creatorLoginCtaShimmer {
            0% { transform: skewX(-12deg) translateX(-100%); }
            24.25%, 100% { transform: skewX(-12deg) translateX(300%); }
          }
          .creator-login-cta-shimmer { position: relative; overflow: hidden; }
          .creator-login-cta-shimmer::before {
            content: ''; position: absolute; inset: 0; width: 50%; pointer-events: none;
            background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%);
            animation: creatorLoginCtaShimmer 3.3s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .creator-login-cta-shimmer::before { animation: none; display: none; }
          }
        `}</style>
        <div style={{ maxWidth: 340, width: '100%', textAlign: 'center' }}>
          <div style={{ border: '1px dashed #d8c27a', borderRadius: 20, padding: '18px 14px 14px', background: '#fff' }}>
            <div style={{ marginBottom: 26 }}>
              <div style={{ position: 'relative', width: 64, height: 64, overflow: 'hidden', margin: '0 auto 12px' }}>
                <img
                  src="/icon-512.png"
                  alt="Chapter அ logo"
                  style={{ position: 'absolute', left: '50%', top: '50%', width: 116, height: 116, maxWidth: 'none', transform: 'translate(-50%, -41%)' }}
                />
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 }}>chapter <span style={{ fontWeight: 900, WebkitTextStroke: '0.35px currentColor' }}>அ</span></div>
              <div style={{ fontSize: 15, color: '#6b6b73', fontWeight: 400, letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 3 }}>creator dashboard</div>
            </div>
            {authError && <div style={{ color: '#dc2626', fontSize: 12.5, marginBottom: 14 }}>{authError}</div>}
            <button className="creator-login-cta-shimmer" onClick={() => { startOnboarding(); login(); }} style={{ width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', background: '#FFD700', color: INK, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Register as Creator
            </button>
            <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 2px' }}>
              <span style={{ flex: 1, height: 0, borderTop: '1px dashed #d4d4d8' }} />
              <span style={{ color: '#a1a1aa', fontSize: 11.5, fontWeight: 400, lineHeight: 1 }}>or</span>
              <span style={{ flex: 1, height: 0, borderTop: '1px dashed #d4d4d8' }} />
            </div>
            <button onClick={login} style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: '1.5px solid ' + HAIR, background: '#fff', color: INK, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Log in to Dashboard
            </button>
            <div style={{ color: MUTED, fontSize: 12.5, fontWeight: 400, lineHeight: 1.45, marginTop: 12 }}>
              New here? Press Register as Creator to get started.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Lookup failed (network / timeout) — must NOT read as "not a creator" ──
  if (meStatus === 'error') {
    return (
      <div style={{ ...wrap, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ maxWidth: 340, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 21, fontWeight: 800, marginBottom: 10 }}>Couldn't load your dashboard</div>
          <div style={{ color: MUTED, fontSize: 14, marginBottom: 22, lineHeight: 1.55 }}>
            Something went wrong reaching the server. Check your connection and try again.
          </div>
          <button
            onClick={() => { setMeStatus('loading'); setLookupNonce(n => n + 1); }}
            style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', background: INK, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Logged in, no creator row yet, chose the new-creator path → onboarding ──
  if (meStatus === 'absent' && wantsOnboarding) {
    return <CreatorOnboarding email={email} onComplete={completeOnboarding} />;
  }

  // ── Logged in but not a creator (and didn't opt into onboarding) ──
  if (!me) {
    return (
      <div style={{ ...wrap, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 21, fontWeight: 800, marginBottom: 10 }}>You're not a creator yet</div>
          <div style={{ color: MUTED, fontSize: 14, marginBottom: 22, lineHeight: 1.55 }}>
            <b style={{ color: INK }}>{email}</b> isn't set up as a creator. Want to become one and start earning?
          </div>
          {authError && <div style={{ color: '#dc2626', fontSize: 12.5, marginBottom: 12 }}>{authError}</div>}
          <button
            onClick={startOnboarding}
            style={{ width: '100%', maxWidth: 260, padding: '13px 0', borderRadius: 12, border: 'none', background: INK, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Become a creator
          </button>
          <div style={{ marginTop: 14 }}>
            <button
              onClick={logout}
              disabled={signingOut}
              style={{ padding: '9px 20px', borderRadius: 12, border: '1.5px solid ' + HAIR, background: '#fff', fontWeight: 700, fontSize: 13.5, color: MUTED, cursor: signingOut ? 'default' : 'pointer', opacity: signingOut ? 0.6 : 1 }}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
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
  // The first-ever submission ticks the checklist step; the recurring ask lives
  // in the "Your Tasks" card this checklist becomes once every step is done.
  const hasEverSubmitted = submissions.length > 0;
  const latestSubmissionByTask = latestByTask(submissions);
  // Training wheels: until one of their videos is APPROVED, a creator is only
  // asked for the starter event. Approval — not merely submitting — is the gate,
  // so nobody's first attempt at a flagship trip goes out unseen.
  const hasApprovedVideo = submissions.some(s => s.status === 'approved');
  const visibleTasks = narrowToStarter<CreatorTask>(tasks, hasApprovedVideo);
  const checklistComplete = checklist.joinedChat
    && checklist.openedDrive
    && checklist.copied
    && hasEverSubmitted
    && lifetimeClicks >= 25
    && lifetimeTickets > 0;

  return (
    <div style={{ ...wrap, padding: '22px 18px 32px' }}>
      <style>{`
        .creator-leaderboard-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .creator-leaderboard-scroll::-webkit-scrollbar { display: none; }
        .creator-essential-grid > .creator-essential-tile + .creator-essential-tile { border-left: 1px solid #ececed; }
        .creator-essential-tile { transition: background-color 150ms ease; }
        .creator-essential-tile:active { background: #f3f3f4 !important; }
        .creator-essential-tile:focus-visible { outline: 2px solid #111; outline-offset: -3px; }
        @media (hover: hover) {
          .creator-essential-tile:hover { background: #fafafa !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .creator-essential-tile { transition: none; }
        }
      `}</style>
      <div style={{ maxWidth: 440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Compact account control */}
        <div ref={accountMenuRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', zIndex: 20 }}>
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            aria-controls="creator-account-menu"
            onClick={() => setAccountMenuOpen(open => !open)}
            style={{ height: 36, padding: '5px 10px 5px 6px', borderRadius: 999, border: '1px solid ' + HAIR, background: '#fff', color: INK, display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', cursor: 'pointer' }}
          >
            <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: '50%', background: INK, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 850, textTransform: 'uppercase' }}>
              {me.name.trim().charAt(0) || me.handle.charAt(0)}
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 750, whiteSpace: 'nowrap' }}>{me.name.split(' ')[0]}</span>
            <span aria-hidden="true" style={{ width: 16, height: 16, flexShrink: 0, display: 'grid', placeItems: 'center', color: MUTED, transform: accountMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 160ms ease' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5.25 7 9l4-3.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
          {accountMenuOpen && (
            <div id="creator-account-menu" role="menu" style={{ position: 'absolute', left: 0, top: 43, width: 148, padding: 4, border: '1px solid ' + HAIR, borderRadius: 12, background: '#fff', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', display: 'grid', gap: 8 }}>
              <a
                href="https://wa.me/919940111564"
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setAccountMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', width: '100%', minHeight: 36, boxSizing: 'border-box', padding: '9px 10px', borderRadius: 8, background: '#f7f7f8', color: INK, textAlign: 'left', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', lineHeight: 1, textDecoration: 'none' }}
              >
                Contact Us
              </a>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setAccountMenuOpen(false); void logout(); }}
                disabled={signingOut}
                style={{ display: 'flex', alignItems: 'center', width: '100%', minHeight: 36, boxSizing: 'border-box', padding: '9px 10px', borderRadius: 8, border: 'none', background: '#f7f7f8', color: INK, textAlign: 'left', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', lineHeight: 1, cursor: signingOut ? 'default' : 'pointer', opacity: signingOut ? 0.6 : 1 }}
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
          {!me.active && <div style={{ fontSize: 12.5, color: '#dc2626', marginTop: 6, textAlign: 'left' }}>Your account is paused — contact the team.</div>}
        </div>

        {/* Earnings — the hero, this month (payout cycle) */}
        <div>
          <div style={{ fontSize: 11.5, color: MUTED, fontWeight: 500, letterSpacing: 2.8, lineHeight: 1.3, textTransform: 'uppercase', marginBottom: 7 }}>Earned in {month.name}</div>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1, color: INK }}>{inr(monthEarned)}</div>
        </div>

        {/* Your link */}
        <div style={{ border: '1px solid #a1a1aa', borderRadius: 16, padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{linkShort}</div>
            <button onClick={copyLink} style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 10, border: 'none', background: copied ? GREEN : INK, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'background 0.15s' }}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Creator milestones → then the rolling task list. This card never goes
            away: once the checklist is finished it becomes "Your Tasks", so the
            dashboard always answers "what should I do next?". */}
        {me.active && (checklistComplete
          ? <CreatorTasksCard tasks={visibleTasks} latest={latestSubmissionByTask} />
          : (
            <CreatorFirstBookingChecklist
              joinedChat={checklist.joinedChat}
              openedDrive={checklist.openedDrive}
              copied={checklist.copied}
              hasEverSubmitted={hasEverSubmitted}
              clicks={lifetimeClicks}
              firstBooking={lifetimeTickets > 0}
              chatUrl={CREATOR_GROUP_CHAT_URL}
              footageUrl={CREATOR_FOOTAGE_URL}
              onJoinChat={() => completeChecklistStep('joined_chat', { joinedChat: true })}
              onOpenDrive={() => completeChecklistStep('opened_drive', { openedDrive: true })}
            />
          ))}

        {/* The Essentials — footage/creatives to post + the creator group chat */}
        {teamResourcesCard(!hasApprovedVideo)}

        {/* Where the video actually gets sent. Sits below The Essentials on
            purpose: a creator needs the footage folder before they have a video
            to submit, so the order follows the actual sequence of work. */}
        {me.active && (
          <CreatorVideoTasks
            tasks={visibleTasks}
            latest={latestSubmissionByTask}
            onSubmitted={row => setSubmissions(prev => [row, ...prev])}
            starterOnly={!hasApprovedVideo}
          />
        )}

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
        <CreatorConversionsCard events={events} />

        {/* The Team */}
        <CreatorTeamCard leaderboard={leaderboard} />
      </div>
    </div>
  );
}
