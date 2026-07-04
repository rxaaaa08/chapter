// Creator (affiliate) dashboard — chaptera.in/creator.
//
// A creator is a Google-authenticated user whose email is in the `affiliates`
// table. They are NOT in admin_users, so is_admin() is false and every
// RLS-locked customer table stays invisible. This screen shows only their own
// funnel + earnings (via the creator_stats RPC) and a transparent leaderboard of
// all creators (via affiliate_leaderboard). Self-contained auth, mirroring the
// admin panel's Google login.
import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';

type Me = { id: string; handle: string; name: string; email: string; active: boolean };
type Stats = { clicks_total: number; clicks_unique: number; apps_total: number; tickets_paid: number; earned_total: number; earned_unpaid: number };
type LeaderRow = { handle: string; name: string; tickets: number; earned: number; is_me: boolean };

const inr = (n: any) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');

export default function CreatorDashboard() {
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const resolve = async (userEmail: string | undefined) => {
      setEmail(userEmail ?? null);
      if (!userEmail) { setMe(null); setAuthLoading(false); return; }
      // Self-select RLS returns only this creator's own affiliates row.
      const { data } = await supabase.from('affiliates').select('id, handle, name, email, active').maybeSingle();
      setMe((data as Me) ?? null);
      setAuthLoading(false);
    };
    supabase.auth.getSession().then(({ data: { session } }) => resolve(session?.user?.email));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => resolve(session?.user?.email));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!me) return;
    setLoading(true);
    Promise.all([
      supabase.rpc('creator_stats'),
      supabase.rpc('affiliate_leaderboard'),
    ]).then(([statsRes, lbRes]) => {
      // creator_stats returns a single row (RETURNS TABLE) → take [0].
      const row = Array.isArray(statsRes.data) ? statsRes.data[0] : statsRes.data;
      setStats((row as Stats) ?? null);
      setLeaderboard((lbRes.data as LeaderRow[]) ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [me]);

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/creator' },
    });
  };
  const logout = async () => { await supabase.auth.signOut(); setMe(null); setEmail(null); };

  const link = me ? `${window.location.origin}/@${me.handle}` : '';
  const copyLink = () => navigator.clipboard?.writeText(link);

  const wrap: React.CSSProperties = { minHeight: '100vh', background: '#f6f6f8', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#111' };
  const card: React.CSSProperties = { background: '#fff', border: '1.5px solid #ececf1', borderRadius: 16, padding: 18 };

  // ── Loading ──
  if (authLoading) {
    return <div style={{ ...wrap, display: 'grid', placeItems: 'center' }}><div style={{ color: '#999' }}>Loading…</div></div>;
  }

  // ── Not logged in ──
  if (!email) {
    return (
      <div style={{ ...wrap, display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ ...card, maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>Creator Dashboard</div>
          <div style={{ color: '#888', fontSize: 14, marginBottom: 22, lineHeight: 1.5 }}>Sign in to see your link's clicks, bookings and earnings.</div>
          <button onClick={login} style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: '1.5px solid #e0e0e0', background: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
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
        <div style={{ ...card, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Not a creator account</div>
          <div style={{ color: '#888', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
            <b>{email}</b> isn't set up as a creator yet. If you think this is a mistake, ask the chapter A team to add this exact email.
          </div>
          <button onClick={logout} style={{ padding: '10px 22px', borderRadius: 10, border: '1.5px solid #e0e0e0', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>
    );
  }

  // ── Creator dashboard ──
  const conv = stats && stats.clicks_total > 0 ? Math.round((stats.tickets_paid / stats.clicks_total) * 100) : null;
  return (
    <div style={{ ...wrap, padding: '20px 16px 60px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1 }}>Hi {me.name.split(' ')[0]} 👋</div>
            <div style={{ fontSize: 13, color: '#888' }}>{me.active ? 'Your creator dashboard' : 'Your account is paused — contact the team'}</div>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={logout} style={{ padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e0e0e0', background: '#fff', fontSize: 12, fontWeight: 600, color: '#666', cursor: 'pointer' }}>Sign out</button>
        </div>

        {/* Your link */}
        <div style={{ ...card, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff' }}>
          <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 600, marginBottom: 6 }}>YOUR LINK — share it everywhere</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 18, fontWeight: 800, wordBreak: 'break-all' }}>{link.replace(/^https?:\/\//, '')}</div>
            <button onClick={copyLink} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.22)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Copy</button>
          </div>
        </div>

        {/* Earnings */}
        <div style={{ ...card }}>
          <div style={{ fontSize: 13, color: '#999', fontWeight: 600, marginBottom: 4 }}>You've earned</div>
          <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: '#16a34a' }}>{inr(stats?.earned_total)}</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
            {Number(stats?.earned_unpaid) > 0
              ? <><b style={{ color: '#dc2626' }}>{inr(stats?.earned_unpaid)}</b> still to be paid out to you</>
              : 'All settled up 🎉'}
          </div>
        </div>

        {/* Funnel */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {[
            { label: 'Clicks', value: stats?.clicks_total ?? 0, sub: `${stats?.clicks_unique ?? 0} unique` },
            { label: 'Bookings', value: stats?.apps_total ?? 0, sub: 'reached checkout' },
            { label: 'Paid tickets', value: stats?.tickets_paid ?? 0, sub: conv != null ? `${conv}% of clicks` : '—' },
          ].map(m => (
            <div key={m.label} style={{ ...card, padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{m.value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#444', marginTop: 2 }}>{m.label}</div>
              <div style={{ fontSize: 10, color: '#aaa' }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Leaderboard */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 8px', fontWeight: 800, fontSize: 15 }}>Creator leaderboard 🏆</div>
          <div style={{ padding: '0 18px 6px', fontSize: 12, color: '#aaa' }}>Everyone's earnings — chase the top spot.</div>
          <div>
            {leaderboard.length === 0 && <div style={{ padding: 18, color: '#bbb', fontSize: 13 }}>No earnings on the board yet. Be the first!</div>}
            {leaderboard.map((r, i) => (
              <div key={r.handle} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 18px', borderTop: '1px solid #f2f2f5', background: r.is_me ? '#eef2ff' : '#fff' }}>
                <div style={{ width: 22, textAlign: 'center', fontWeight: 800, color: i === 0 ? '#eab308' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : '#ccc', fontSize: 15 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>@{r.handle}{r.is_me && <span style={{ fontSize: 11, color: '#6366f1', marginLeft: 6 }}>you</span>}</div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>{r.tickets} {r.tickets === 1 ? 'ticket' : 'tickets'}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#16a34a' }}>{inr(r.earned)}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', lineHeight: 1.5 }}>
          {loading ? 'Refreshing…' : 'You earn a commission when someone books through your link and pays in full for an eligible event. Numbers update in real time.'}
        </div>
      </div>
    </div>
  );
}
