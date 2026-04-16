import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const ADMIN_PASSWORD = 'chaptera2025';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TripDate = { id?: string; start_date: string; status: 'available' | 'selling_out' | 'sold_out'; label: string };
type PickupPoint = { id: string; label: string; meetingSpot: string; time: string; transport: string };
type EventMedia = { id?: string; url: string; caption: string };
type Trip = {
  id?: string;
  slug: string;
  title: string;
  timing: string;
  price_full: number;
  price_advance: number;
  description: string;
  hero_image: string;
  cities: string[];
  category: string;
  booking_url: string;
  cta_label: string;
  is_active: boolean;
  pickup_points?: PickupPoint[];
  event_media?: EventMedia[];
  event_dates?: TripDate[];
};
type ChatMsg = { id: string; step_key: string; bot_message: string; flow: string };

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const statusLabel = { available: 'Available', selling_out: 'Selling Out', sold_out: 'Sold Out' };
const statusColor = { available: '#16a34a', selling_out: '#d97706', sold_out: '#dc2626' };

function Badge({ status }: { status: TripDate['status'] }) {
  return (
    <span style={{ background: statusColor[status] + '20', color: statusColor[status], padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
      {statusLabel[status]}
    </span>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [pwError, setPwError] = useState(false);
  const [tab, setTab] = useState<'trips' | 'messages'>('trips');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [addingTrip, setAddingTrip] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };


  const login = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else setPwError(true);
  };

  // ─── LOAD DATA ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    Promise.all([
      supabase.from('events').select('*, event_dates(*), event_media(*)').order('created_at', { ascending: true }),
      supabase.from('chat_messages').select('*').order('sort_order', { ascending: true }),
    ]).then(([evRes, msgRes]) => {
      if (evRes.data) setTrips(evRes.data as Trip[]);
      if (msgRes.data) setMsgs(msgRes.data as ChatMsg[]);
      setLoading(false);
    });
  }, [authed]);

  // ─── SAVE TRIP ──────────────────────────────────────────────────────────────
  const saveTrip = async (trip: Trip) => {
    setSaving(trip.id ?? 'new');
    const { event_dates, event_media, id, ...fields } = trip;

    let eventId = id;
    if (id) {
      await supabase.from('events').update(fields).eq('id', id);
    } else {
      const { data } = await supabase.from('events').insert(fields).select('id').single();
      eventId = data?.id;
    }

    if (eventId && event_dates) {
      await supabase.from('event_dates').delete().eq('event_id', eventId);
      if (event_dates.length > 0) {
        await supabase.from('event_dates').insert(
          event_dates.map(d => ({ event_id: eventId, start_date: d.start_date, status: d.status, label: d.label }))
        );
      }
    }

    if (eventId && event_media) {
      await supabase.from('event_media').delete().eq('event_id', eventId);
      const validMedia = event_media.filter(m => m.url.trim());
      if (validMedia.length > 0) {
        await supabase.from('event_media').insert(
          validMedia.map((m, i) => ({ event_id: eventId, url: m.url, thumbnail_url: m.url, caption: m.caption, type: 'vimeo', sort_order: i }))
        );
      }
    }

    // Refresh
    const { data } = await supabase.from('events').select('*, event_dates(*), event_media(*)').order('created_at', { ascending: true });
    if (data) setTrips(data as Trip[]);
    setSaving(null);
    setEditingTrip(null);
    setAddingTrip(false);
    showToast('Saved!');
  };

  const deleteTrip = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await supabase.from('events').delete().eq('id', id);
    setTrips(prev => prev.filter(t => t.id !== id));
    showToast('Deleted.');
  };

  const toggleActive = async (trip: Trip) => {
    await supabase.from('events').update({ is_active: !trip.is_active }).eq('id', trip.id!);
    setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, is_active: !t.is_active } : t));
  };

  // ─── SAVE MESSAGE ────────────────────────────────────────────────────────────
  const saveMsg = async (msg: ChatMsg) => {
    setSaving(msg.id);
    await supabase.from('chat_messages').update({ bot_message: msg.bot_message }).eq('id', msg.id);
    setSaving(null);
    showToast('Message saved!');
  };

  // ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f0', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#fff', padding: 40, borderRadius: 16, width: 340, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>chapter அ</div>
          <div style={{ color: '#888', marginBottom: 28 }}>Admin Panel</div>
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: pwError ? '1.5px solid #dc2626' : '1.5px solid #e5e5e5', fontSize: 15, boxSizing: 'border-box', outline: 'none' }}
          />
          {pwError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 6 }}>Wrong password</div>}
          <button onClick={login} style={{ marginTop: 14, width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Sign in
          </button>
        </div>
      </div>
    );
  }

  // ─── ADMIN UI ────────────────────────────────────────────────────────────────
  const s = {
    page: { minHeight: '100vh', background: '#f5f5f0', fontFamily: 'sans-serif', padding: '0 0 60px' } as React.CSSProperties,
    header: { background: '#fff', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 } as React.CSSProperties,
    tab: (active: boolean) => ({ padding: '8px 20px', borderRadius: 99, border: 'none', background: active ? '#111' : 'transparent', color: active ? '#fff' : '#666', fontWeight: 600, cursor: 'pointer', fontSize: 14 }) as React.CSSProperties,
    card: { background: '#fff', borderRadius: 14, padding: 20, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as React.CSSProperties,
    label: { fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 } as React.CSSProperties,
    input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e5e5', fontSize: 14, boxSizing: 'border-box', outline: 'none' } as React.CSSProperties,
    textarea: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e5e5e5', fontSize: 14, boxSizing: 'border-box', resize: 'vertical', outline: 'none', minHeight: 80 } as React.CSSProperties,
    btn: (color = '#111') => ({ padding: '8px 18px', background: color, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }) as React.CSSProperties,
    outlineBtn: { padding: '8px 18px', background: 'transparent', color: '#111', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' } as React.CSSProperties,
  };

  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#111', color: '#fff', padding: '12px 24px', borderRadius: 99, fontWeight: 600, zIndex: 100, fontSize: 14 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>chapter அ &nbsp;<span style={{ color: '#aaa', fontWeight: 400 }}>Admin</span></div>
        <div style={{ flex: 1 }} />
        <button style={s.tab(tab === 'trips')} onClick={() => setTab('trips')}>Trips</button>
        <button style={s.tab(tab === 'messages')} onClick={() => setTab('messages')}>Bot Messages</button>
      </div>

      <div style={{ maxWidth: 720, margin: '32px auto', padding: '0 20px' }}>
        {loading && <div style={{ textAlign: 'center', color: '#aaa', marginTop: 60 }}>Loading...</div>}

        {/* ── TRIPS TAB ────────────────────────────────────────────────────── */}
        {!loading && tab === 'trips' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 20 }}>Trips & Events</div>
              <button style={s.btn()} onClick={() => { setAddingTrip(true); setEditingTrip({ slug: '', title: '', timing: '', price_full: 0, price_advance: 0, description: '', hero_image: '', cities: ['Chennai'], category: 'Trips', booking_url: '', cta_label: '', is_active: true, event_dates: [], event_media: [{url:'',caption:''},{url:'',caption:''},{url:'',caption:''}] }); }}>
                + Add Trip
              </button>
            </div>

            {trips.map(trip => (
              <div key={trip.id} style={{ ...s.card, opacity: trip.is_active ? 1 : 0.55 }}>
                {editingTrip?.id === trip.id ? (
                  <TripForm trip={editingTrip} onChange={setEditingTrip} onSave={() => saveTrip(editingTrip!)} onCancel={() => setEditingTrip(null)} saving={saving === trip.id} s={s} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {trip.hero_image && <img src={trip.hero_image} alt="" style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{trip.title}</div>
                      <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>₹{trip.price_full?.toLocaleString('en-IN')} · {trip.timing}</div>
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(trip.event_dates ?? []).map((d, i) => <Badge key={i} status={d.status} />)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      <button onClick={() => toggleActive(trip)} title={trip.is_active ? 'Hide trip' : 'Show trip'}
                        style={{ ...s.outlineBtn, color: trip.is_active ? '#16a34a' : '#aaa' }}>
                        {trip.is_active ? 'Live' : 'Hidden'}
                      </button>
                      <button style={s.outlineBtn} onClick={() => setEditingTrip({ ...trip })}>Edit</button>
                      <button style={s.btn('#dc2626')} onClick={() => deleteTrip(trip.id!, trip.title)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {addingTrip && editingTrip && !editingTrip.id && (
              <div style={s.card}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>New Trip</div>
                <TripForm trip={editingTrip} onChange={setEditingTrip} onSave={() => saveTrip(editingTrip!)} onCancel={() => { setAddingTrip(false); setEditingTrip(null); }} saving={saving === 'new'} s={s} />
              </div>
            )}
          </>
        )}

        {/* ── MESSAGES TAB ─────────────────────────────────────────────────── */}
        {!loading && tab === 'messages' && (
          <>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Bot Messages</div>
            <div style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>
              Use <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{city}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{title}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{name}'}</code> as placeholders.
            </div>
            {msgs.map(msg => (
              <div key={msg.id} style={s.card}>
                <label style={s.label}>{msg.step_key}</label>
                <textarea
                  style={s.textarea}
                  value={msg.bot_message}
                  onChange={e => setMsgs(prev => prev.map(m => m.id === msg.id ? { ...m, bot_message: e.target.value } : m))}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button style={s.btn(saving === msg.id ? '#aaa' : '#111')} disabled={saving === msg.id} onClick={() => saveMsg(msg)}>
                    {saving === msg.id ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ─── TRIP FORM ────────────────────────────────────────────────────────────────
function TripForm({ trip, onChange, onSave, onCancel, saving, s }: {
  trip: Trip; onChange: (t: Trip) => void; onSave: () => void; onCancel: () => void; saving: boolean; s: any;
}) {
  const set = (key: keyof Trip, val: any) => onChange({ ...trip, [key]: val });
  const dates = trip.event_dates ?? [];
  const pickups = trip.pickup_points ?? [];
  // Always show exactly 3 video slots
  const rawMedia = trip.event_media ?? [];
  const videos: EventMedia[] = [0,1,2].map(i => rawMedia[i] ?? { url: '', caption: '' });
  const setVideo = (i: number, key: keyof EventMedia, val: string) => {
    const updated = videos.map((v, idx) => idx === i ? { ...v, [key]: val } : v);
    onChange({ ...trip, event_media: updated });
  };

  const setPickup = (i: number, key: keyof PickupPoint, val: string) => {
    const updated = pickups.map((p, idx) => idx === i ? { ...p, [key]: val } : p);
    onChange({ ...trip, pickup_points: updated });
  };
  const addPickup = () => onChange({ ...trip, pickup_points: [...pickups, { id: `pt_${Date.now()}`, label: '', meetingSpot: '', time: '', transport: '' }] });
  const removePickup = (i: number) => onChange({ ...trip, pickup_points: pickups.filter((_, idx) => idx !== i) });

  const setDate = (i: number, key: keyof TripDate, val: string) => {
    const updated = dates.map((d, idx) => idx === i ? { ...d, [key]: val } : d);
    onChange({ ...trip, event_dates: updated });
  };
  const addDate = () => onChange({ ...trip, event_dates: [...dates, { start_date: '', status: 'available', label: '' }] });
  const removeDate = (i: number) => onChange({ ...trip, event_dates: dates.filter((_, idx) => idx !== i) });

  const field = (label: string, key: keyof Trip, type = 'text') => (
    <div style={{ marginBottom: 14 }}>
      <label style={s.label}>{label}</label>
      <input type={type} style={s.input} value={(trip[key] as string) ?? ''} onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)} />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1/-1' }}>{field('Title', 'title')}</div>
        {field('Duration (e.g. 1 Night 2 Days)', 'timing')}
        {field('Category', 'category')}
        {field('Full Price (₹)', 'price_full', 'number')}
        {field('Advance Amount (₹)', 'price_advance', 'number')}
        {field('Booking URL', 'booking_url')}
        {field('CTA Button Text (e.g. Book Now, Confirm)', 'cta_label')}
        {field('Hero Image URL', 'hero_image')}
      </div>

      {/* Dates */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ ...s.label, marginBottom: 0 }}>Trip Dates</label>
          <button style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }} onClick={addDate}>+ Add Date</button>
        </div>
        {dates.map((d, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input type="date" style={s.input} value={d.start_date} onChange={e => setDate(i, 'start_date', e.target.value)} />
            <select style={s.input} value={d.status} onChange={e => setDate(i, 'status', e.target.value as TripDate['status'])}>
              <option value="available">Available</option>
              <option value="selling_out">Selling Out</option>
              <option value="sold_out">Sold Out</option>
            </select>
            <button onClick={() => removeDate(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
          </div>
        ))}
      </div>

      {/* Pickup Points */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ ...s.label, marginBottom: 0 }}>Meeting Point Options</label>
          <button style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }} onClick={addPickup}>+ Add Point</button>
        </div>
        {pickups.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>No pickup points — uses default config.</div>}
        {pickups.map((p, i) => (
          <div key={i} style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={s.label}>Dropdown Label</label>
                <input style={s.input} placeholder="e.g. Koyambedu — 7:00 AM" value={p.label} onChange={e => setPickup(i, 'label', e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Meeting Spot</label>
                <input style={s.input} placeholder="e.g. Koyambedu Bus Stand" value={p.meetingSpot} onChange={e => setPickup(i, 'meetingSpot', e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Pickup Time</label>
                <input style={s.input} placeholder="e.g. 7:00 AM" value={p.time} onChange={e => setPickup(i, 'time', e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Transport</label>
                <input style={s.input} placeholder="e.g. AC Tempo Traveller" value={p.transport} onChange={e => setPickup(i, 'transport', e.target.value)} />
              </div>
            </div>
            <button onClick={() => removePickup(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Remove</button>
          </div>
        ))}
      </div>

      {/* Videos */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ ...s.label, marginBottom: 8, display: 'block' }}>Vimeo Videos (up to 3)</label>
        {videos.map((v, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 8 }}>
            <input style={s.input} placeholder={`Vimeo URL ${i + 1} (e.g. https://vimeo.com/123456789)`} value={v.url} onChange={e => setVideo(i, 'url', e.target.value)} />
            <input style={s.input} placeholder="Caption" value={v.caption} onChange={e => setVideo(i, 'caption', e.target.value)} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button style={s.outlineBtn} onClick={onCancel}>Cancel</button>
        <button style={s.btn(saving ? '#aaa' : '#111')} disabled={saving} onClick={onSave}>
          {saving ? 'Saving…' : 'Save Trip'}
        </button>
      </div>
    </div>
  );
}
