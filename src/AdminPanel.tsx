import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

const ADMIN_PASSWORD = 'chaptera2025';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type TripDate = { id?: string; start_date: string; status: 'available' | 'selling_out' | 'sold_out'; label: string };
type PickupPoint = {
  id: string;
  label: string;
  meetingSpot: string;
  time: string;
  transport: string;
  dateOffset?: number;
  ownTransportPrice?: number;
  ownOnly?: boolean;
  availableForOther?: boolean;
  otherPrice?: number;
  otherAdvance?: number;
};
type EventMedia = { id?: string; url: string; caption: string; thumbnail_url?: string };
type EventReview = { id?: string; name: string; rating: number; review_text: string; images?: string[] };
type ItineraryScheduleItem = { time: string; activity: string };
type ItineraryDay = { day: string; title: string; description: string; schedule?: ItineraryScheduleItem[] };
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
  included: string[];
  optional_activities: string[];
  not_included: string[];
  booking_url: string;
  cta_label: string;
  is_active: boolean;
  pickup_points?: PickupPoint[];
  event_media?: EventMedia[];
  event_reviews?: EventReview[];
  event_dates?: TripDate[];
  itinerary?: ItineraryDay[];
  show_accommodation: boolean;
  accommodation?: { name: string; images: string[]; features: string[]; policy: string };
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
  const [tab, setTab] = useState<'trips' | 'other' | 'messages'>('trips');
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
      supabase.from('events').select('*, event_dates(*), event_media(*), event_reviews(*)').order('created_at', { ascending: true }),
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
    const { event_dates, event_media, event_reviews, id, ...fields } = trip;

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
          validMedia.map((m, i) => ({
            event_id: eventId,
            url: m.url,
            thumbnail_url: m.thumbnail_url?.trim() || m.url,
            caption: m.caption,
            type: 'vimeo',
            sort_order: i
          }))
        );
      }
    }

    if (eventId && event_reviews) {
      await supabase.from('event_reviews').delete().eq('event_id', eventId);
      const validReviews = event_reviews.filter(r => r.name.trim() && r.review_text.trim());
      if (validReviews.length > 0) {
        await supabase.from('event_reviews').insert(
          validReviews.map((r, i) => ({
            event_id: eventId,
            name: r.name.trim(),
            rating: Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5))),
            review_text: r.review_text.trim(),
            images: Array.isArray(r.images) ? r.images : [],
            sort_order: i
          }))
        );
      }
    }

    // Refresh
    const { data } = await supabase.from('events').select('*, event_dates(*), event_media(*), event_reviews(*)').order('created_at', { ascending: true });
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
        <button style={s.tab(tab === 'other')} onClick={() => setTab('other')}>Other</button>
        <button style={s.tab(tab === 'messages')} onClick={() => setTab('messages')}>Bot Messages</button>
      </div>

      <div style={{ maxWidth: 720, margin: '32px auto', padding: '0 20px' }}>
        {loading && <div style={{ textAlign: 'center', color: '#aaa', marginTop: 60 }}>Loading...</div>}

        {/* ── TRIPS TAB ────────────────────────────────────────────────────── */}
        {!loading && tab === 'trips' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 20 }}>Trips & Events</div>
              <button style={s.btn()} onClick={() => { setAddingTrip(true); setEditingTrip({ slug: '', title: '', timing: '', price_full: 0, price_advance: 0, description: '', hero_image: '', cities: ['Chennai'], category: 'Trips', included: [], optional_activities: [], not_included: [], booking_url: '', cta_label: '', is_active: true, show_accommodation: false, accommodation: { name: '', images: ['','',''], features: ['','',''], policy: '' }, event_dates: [], itinerary: [{ day: 'Day 1', title: '', description: '', schedule: [] }], event_reviews: [], event_media: [{url:'',thumbnail_url:'',caption:''},{url:'',thumbnail_url:'',caption:''},{url:'',thumbnail_url:'',caption:''}] }); }}>
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

        {/* ── OTHER TAB ─────────────────────────────────────────────────────── */}
        {!loading && tab === 'other' && (
          <>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Other City Feed</div>
            <div style={{ color: '#888', fontSize: 14, marginBottom: 18 }}>
              Manage trips/events visible for users who choose <strong>Other</strong>, and configure which pickup points they can join from.
            </div>
            {trips.filter(t => (t.cities ?? []).includes('Other')).length === 0 && (
              <div style={{ ...s.card, color: '#777' }}>
                No trips are enabled for Other city users yet. Turn ON <strong>Show In "Other" City Feed</strong> in any trip to see it here.
              </div>
            )}
            {trips
              .filter(t => (t.cities ?? []).includes('Other'))
              .map(trip => (
                <div key={trip.id} style={{ ...s.card, opacity: trip.is_active ? 1 : 0.55 }}>
                  {editingTrip?.id === trip.id ? (
                    <OtherCityForm
                      trip={editingTrip}
                      onChange={setEditingTrip}
                      onSave={() => saveTrip(editingTrip!)}
                      onCancel={() => setEditingTrip(null)}
                      saving={saving === trip.id}
                      s={s}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                      {trip.hero_image && <img src={trip.hero_image} alt="" style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{trip.title}</div>
                        <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{trip.category} · ₹{trip.price_full?.toLocaleString('en-IN')}</div>
                        <div style={{ color: '#666', fontSize: 12, marginTop: 6 }}>
                          Other-enabled pickup points: {(trip.pickup_points ?? []).filter(p => p.availableForOther).length}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <button style={s.outlineBtn} onClick={() => setEditingTrip({ ...trip })}>Edit Other Setup</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
  const acc = trip.accommodation ?? { name: '', images: ['','',''], features: ['','',''], policy: '' };
  const accImages: string[] = [0,1,2].map(i => acc.images?.[i] ?? '');
  const accFeatures: string[] = [0,1,2].map(i => acc.features?.[i] ?? '');
  const setAcc = (patch: Partial<typeof acc>) => onChange({ ...trip, accommodation: { ...acc, ...patch } });
  const setAccImage = (i: number, val: string) => { const imgs = [...accImages]; imgs[i] = val; setAcc({ images: imgs.filter(Boolean) }); };
  const setAccFeature = (i: number, val: string) => { const feats = [...accFeatures]; feats[i] = val; setAcc({ features: feats }); };

  // Always show exactly 3 video slots
  const rawMedia = trip.event_media ?? [];
  const videos: EventMedia[] = [0,1,2].map(i => rawMedia[i] ?? { url: '', thumbnail_url: '', caption: '' });
  const setVideo = (i: number, key: keyof EventMedia, val: string) => {
    const updated = videos.map((v, idx) => idx === i ? { ...v, [key]: val } : v);
    onChange({ ...trip, event_media: updated });
  };

  const setPickup = (i: number, key: keyof PickupPoint, val: any) => {
    const updated = pickups.map((p, idx) => idx === i ? { ...p, [key]: val } : p);
    onChange({ ...trip, pickup_points: updated });
  };
  const addPickup = () => onChange({ ...trip, pickup_points: [...pickups, { id: `pt_${Date.now()}`, label: '', meetingSpot: '', time: '', transport: '' }] });
  const removePickup = (i: number) => onChange({ ...trip, pickup_points: pickups.filter((_, idx) => idx !== i) });
  const ownTransportIndex = pickups.findIndex(p => p.id === 'own_transport');
  const ownTransport = ownTransportIndex >= 0 ? pickups[ownTransportIndex] : null;
  const regularPickups = pickups.map((p, idx) => ({ ...p, _idx: idx })).filter(p => p.id !== 'own_transport');
  const toggleOwnTransport = (enabled: boolean) => {
    if (enabled) {
      if (ownTransportIndex >= 0) return;
      onChange({
        ...trip,
        pickup_points: [
          ...pickups,
          {
            id: 'own_transport',
            label: 'Own Transport',
            meetingSpot: 'Event Location',
            time: '',
            transport: 'Your Own Transport',
            ownTransportPrice: trip.price_full || 0,
            ownOnly: false,
            availableForOther: true,
          }
        ]
      });
      return;
    }
    onChange({ ...trip, pickup_points: pickups.filter(p => p.id !== 'own_transport') });
  };
  const setOwnTransport = (patch: Partial<PickupPoint>) => {
    if (ownTransportIndex < 0) return;
    const updated = pickups.map((p, idx) => idx === ownTransportIndex ? { ...p, ...patch } : p);
    onChange({ ...trip, pickup_points: updated });
  };

  const setDate = (i: number, key: keyof TripDate, val: string) => {
    const updated = dates.map((d, idx) => idx === i ? { ...d, [key]: val } : d);
    onChange({ ...trip, event_dates: updated });
  };
  const addDate = () => onChange({ ...trip, event_dates: [...dates, { start_date: '', status: 'available', label: '' }] });
  const removeDate = (i: number) => onChange({ ...trip, event_dates: dates.filter((_, idx) => idx !== i) });
  const setStringList = (key: 'included' | 'optional_activities' | 'not_included', list: string[]) => {
    onChange({ ...trip, [key]: list });
  };
  const updateStringListItem = (key: 'included' | 'optional_activities' | 'not_included', index: number, value: string) => {
    const current = [...(trip[key] ?? [])];
    current[index] = value;
    setStringList(key, current);
  };
  const addStringListItem = (key: 'included' | 'optional_activities' | 'not_included') => {
    const current = [...(trip[key] ?? [])];
    setStringList(key, [...current, '']);
  };
  const removeStringListItem = (key: 'included' | 'optional_activities' | 'not_included', index: number) => {
    const current = [...(trip[key] ?? [])];
    setStringList(key, current.filter((_, i) => i !== index));
  };
  const itinerary = trip.itinerary ?? [];
  const updateItineraryDay = (index: number, patch: Partial<ItineraryDay>) => {
    const updated = itinerary.map((d, i) => i === index ? { ...d, ...patch } : d);
    onChange({ ...trip, itinerary: updated });
  };
  const addItineraryDay = () => {
    const nextDayNo = itinerary.length + 1;
    onChange({ ...trip, itinerary: [...itinerary, { day: `Day ${nextDayNo}`, title: '', description: '', schedule: [] }] });
  };
  const removeItineraryDay = (index: number) => {
    onChange({ ...trip, itinerary: itinerary.filter((_, i) => i !== index) });
  };
  const updateScheduleItem = (dayIndex: number, itemIndex: number, patch: Partial<ItineraryScheduleItem>) => {
    const day = itinerary[dayIndex] ?? { day: '', title: '', description: '', schedule: [] };
    const schedule = day.schedule ?? [];
    const updatedSchedule = schedule.map((item, i) => i === itemIndex ? { ...item, ...patch } : item);
    updateItineraryDay(dayIndex, { schedule: updatedSchedule });
  };
  const addScheduleItem = (dayIndex: number) => {
    const day = itinerary[dayIndex] ?? { day: '', title: '', description: '', schedule: [] };
    const schedule = day.schedule ?? [];
    updateItineraryDay(dayIndex, { schedule: [...schedule, { time: '', activity: '' }] });
  };
  const removeScheduleItem = (dayIndex: number, itemIndex: number) => {
    const day = itinerary[dayIndex] ?? { day: '', title: '', description: '', schedule: [] };
    const schedule = day.schedule ?? [];
    updateItineraryDay(dayIndex, { schedule: schedule.filter((_, i) => i !== itemIndex) });
  };
  const reviews = trip.event_reviews ?? [];
  const addReview = () => onChange({ ...trip, event_reviews: [...reviews, { name: '', rating: 5, review_text: '', images: [] }] });
  const updateReview = (index: number, patch: Partial<EventReview>) => {
    const updated = reviews.map((r, i) => i === index ? { ...r, ...patch } : r);
    onChange({ ...trip, event_reviews: updated });
  };
  const removeReview = (index: number) => onChange({ ...trip, event_reviews: reviews.filter((_, i) => i !== index) });

  const field = (label: string, key: keyof Trip, type = 'text') => (
    <div style={{ marginBottom: 14 }}>
      <label style={s.label}>{label}</label>
      <input type={type} style={s.input} value={(trip[key] as string) ?? ''} onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)} />
    </div>
  );
  const showInOther = (trip.cities ?? []).includes('Other');
  const toggleShowInOther = () => {
    const current = trip.cities ?? [];
    const next = showInOther ? current.filter(c => c !== 'Other') : Array.from(new Set([...current, 'Other']));
    set('cities', next);
  };

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

      {/* City feed controls */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ ...s.label, marginBottom: 0 }}>Show In "Other" City Feed</label>
          <button
            type="button"
            onClick={toggleShowInOther}
            style={{ padding: '4px 14px', borderRadius: 99, border: 'none', background: showInOther ? '#16a34a' : '#ddd', color: showInOther ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            {showInOther ? 'ON' : 'OFF'}
          </button>
        </div>
        <div style={{ color: '#888', fontSize: 12, marginTop: 6 }}>
          When ON, users selecting "Other" city can see this event (with Own Transport flow).
        </div>
      </div>

      {/* What's Included */}
      <StringListEditor
        title="What's Included"
        values={trip.included ?? []}
        placeholder="e.g. Round-trip transport"
        s={s}
        onAdd={() => addStringListItem('included')}
        onChange={(i, v) => updateStringListItem('included', i, v)}
        onRemove={(i) => removeStringListItem('included', i)}
      />
      <StringListEditor
        title="Optional Activities"
        values={trip.optional_activities ?? []}
        placeholder="e.g. Sunrise walk"
        s={s}
        onAdd={() => addStringListItem('optional_activities')}
        onChange={(i, v) => updateStringListItem('optional_activities', i, v)}
        onRemove={(i) => removeStringListItem('optional_activities', i)}
      />
      <StringListEditor
        title="What's Not Included"
        values={trip.not_included ?? []}
        placeholder="e.g. Lunch"
        s={s}
        onAdd={() => addStringListItem('not_included')}
        onChange={(i, v) => updateStringListItem('not_included', i, v)}
        onRemove={(i) => removeStringListItem('not_included', i)}
      />

      {/* You'll Experience */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ ...s.label, marginBottom: 0 }}>You'll Experience (Itinerary)</label>
          <button type="button" style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }} onClick={addItineraryDay}>
            + Add Day
          </button>
        </div>
        {itinerary.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>No itinerary days yet.</div>}
        {itinerary.map((day, dayIndex) => (
          <div key={dayIndex} style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input
                style={s.input}
                placeholder="Day label (e.g. Day 1)"
                value={day.day}
                onChange={e => updateItineraryDay(dayIndex, { day: e.target.value })}
              />
              <input
                style={s.input}
                placeholder="Day title"
                value={day.title}
                onChange={e => updateItineraryDay(dayIndex, { title: e.target.value })}
              />
              <button type="button" onClick={() => removeItineraryDay(dayIndex)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>
                ×
              </button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <textarea
                style={s.textarea}
                placeholder="Day description"
                value={day.description}
                onChange={e => updateItineraryDay(dayIndex, { description: e.target.value })}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ ...s.label, marginBottom: 0 }}>Schedule</label>
                <button type="button" style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }} onClick={() => addScheduleItem(dayIndex)}>
                  + Add Time Slot
                </button>
              </div>
              {(day.schedule ?? []).length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 6 }}>No time slots yet.</div>}
              {(day.schedule ?? []).map((item, itemIndex) => (
                <div key={itemIndex} style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input
                    style={s.input}
                    placeholder="e.g. 7:30 PM"
                    value={item.time}
                    onChange={e => updateScheduleItem(dayIndex, itemIndex, { time: e.target.value })}
                  />
                  <input
                    style={s.input}
                    placeholder="Activity"
                    value={item.activity}
                    onChange={e => updateScheduleItem(dayIndex, itemIndex, { activity: e.target.value })}
                  />
                  <button type="button" onClick={() => removeScheduleItem(dayIndex, itemIndex)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
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

      {/* Own Transport */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <label style={{ ...s.label, marginBottom: 0 }}>Own Transport Option</label>
          <button
            type="button"
            onClick={() => toggleOwnTransport(!ownTransport)}
            style={{ padding: '4px 14px', borderRadius: 99, border: 'none', background: ownTransport ? '#16a34a' : '#ddd', color: ownTransport ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            {ownTransport ? 'ON' : 'OFF'}
          </button>
        </div>
        {ownTransport && (
          <div style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={s.label}>Dropdown Label</label>
                <input style={s.input} placeholder="Own Transport" value={ownTransport.label} onChange={e => setOwnTransport({ label: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Own Transport Price (₹)</label>
            <input type="number" min={0} style={s.input} placeholder="e.g. 4999" value={ownTransport.ownTransportPrice ?? 0} onChange={e => setOwnTransport({ ownTransportPrice: Number(e.target.value) })} />
              </div>
              <div>
                <label style={s.label}>Meeting Point (Event Location)</label>
                <input style={s.input} placeholder="e.g. Villa near Auroville" value={ownTransport.meetingSpot} onChange={e => setOwnTransport({ meetingSpot: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Reporting Time</label>
                <input style={s.input} placeholder="e.g. 6:00 PM" value={ownTransport.time} onChange={e => setOwnTransport({ time: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Other City Price (₹)</label>
                <input type="number" min={0} style={s.input} placeholder="Leave blank = same as own transport price" value={ownTransport.otherPrice ?? ''} onChange={e => setOwnTransport({ otherPrice: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
              <div>
                <label style={s.label}>Other City Advance (₹)</label>
                <input type="number" min={0} style={s.input} placeholder="Leave blank = event advance amount" value={ownTransport.otherAdvance ?? ''} onChange={e => setOwnTransport({ otherAdvance: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ ...s.label, marginBottom: 0 }}>Own Transport As Only Option</label>
              <button
                type="button"
                onClick={() => setOwnTransport({ ownOnly: !ownTransport.ownOnly })}
                style={{ padding: '4px 14px', borderRadius: 99, border: 'none', background: ownTransport.ownOnly ? '#111' : '#ddd', color: ownTransport.ownOnly ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                {ownTransport.ownOnly ? 'YES' : 'NO'}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <label style={{ ...s.label, marginBottom: 0 }}>Available For "Other" City</label>
              <button
                type="button"
                onClick={() => setOwnTransport({ availableForOther: !ownTransport.availableForOther })}
                style={{ padding: '4px 14px', borderRadius: 99, border: 'none', background: ownTransport.availableForOther ? '#111' : '#ddd', color: ownTransport.availableForOther ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                {ownTransport.availableForOther ? 'YES' : 'NO'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pickup Points */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ ...s.label, marginBottom: 0 }}>Transport Pickup Options</label>
          <button style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }} onClick={addPickup}>+ Add Point</button>
        </div>
        {regularPickups.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>No transport pickup points added.</div>}
        {regularPickups.map((p, i) => (
          <div key={i} style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={s.label}>Dropdown Label</label>
                <input style={s.input} placeholder="e.g. Koyambedu — 7:00 AM" value={p.label} onChange={e => setPickup(p._idx, 'label', e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Meeting Spot</label>
                <input style={s.input} placeholder="e.g. Koyambedu Bus Stand" value={p.meetingSpot} onChange={e => setPickup(p._idx, 'meetingSpot', e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Pickup Time</label>
                <input style={s.input} placeholder="e.g. 7:00 AM" value={p.time} onChange={e => setPickup(p._idx, 'time', e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Transport</label>
                <input style={s.input} placeholder="e.g. AC Tempo Traveller" value={p.transport} onChange={e => setPickup(p._idx, 'transport', e.target.value)} />
              </div>
              <div>
                <label style={s.label}>Date Offset (days)</label>
                <input
                  type="number"
                  style={s.input}
                  placeholder="0 = same day, -1 = previous day"
                  value={p.dateOffset ?? 0}
                  onChange={e => setPickup(p._idx, 'dateOffset', Number(e.target.value))}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={s.label}>Available For "Other" City</label>
                <button
                  type="button"
                  onClick={() => setPickup(p._idx, 'availableForOther', !p.availableForOther)}
                  style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: p.availableForOther ? '#111' : '#ddd', color: p.availableForOther ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  {p.availableForOther ? 'YES' : 'NO'}
                </button>
              </div>
              <div>
                <label style={s.label}>Other City Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  style={s.input}
                  placeholder="Leave blank = base event price"
                  value={p.otherPrice ?? ''}
                  onChange={e => setPickup(p._idx, 'otherPrice', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>
              <div>
                <label style={s.label}>Other City Advance (₹)</label>
                <input
                  type="number"
                  min={0}
                  style={s.input}
                  placeholder="Leave blank = event advance amount"
                  value={p.otherAdvance ?? ''}
                  onChange={e => setPickup(p._idx, 'otherAdvance', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>
            </div>
            <button onClick={() => removePickup(p._idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Remove</button>
          </div>
        ))}
      </div>

      {/* Where We Stay */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <label style={{ ...s.label, marginBottom: 0 }}>Where We Stay Section</label>
          <button
            onClick={() => set('show_accommodation', !trip.show_accommodation)}
            style={{ padding: '4px 14px', borderRadius: 99, border: 'none', background: trip.show_accommodation ? '#16a34a' : '#ddd', color: trip.show_accommodation ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
          >
            {trip.show_accommodation ? 'ON' : 'OFF'}
          </button>
        </div>
        {trip.show_accommodation && (
          <div style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ marginBottom: 10 }}>
              <label style={s.label}>Stay Name</label>
              <input style={s.input} placeholder="e.g. White Town Courtyard Stay" value={acc.name} onChange={e => setAcc({ name: e.target.value })} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={s.label}>Images (up to 3 URLs)</label>
              {[0,1,2].map(i => (
                <input key={i} style={{ ...s.input, marginBottom: 6 }} placeholder={`Image URL ${i+1}`} value={accImages[i]} onChange={e => setAccImage(i, e.target.value)} />
              ))}
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={s.label}>Bullet Points (3)</label>
              {[0,1,2].map(i => (
                <input key={i} style={{ ...s.input, marginBottom: 6 }} placeholder={`Feature ${i+1}`} value={accFeatures[i]} onChange={e => setAccFeature(i, e.target.value)} />
              ))}
            </div>
            <div>
              <label style={s.label}>Rooming Policy</label>
              <input style={s.input} placeholder="e.g. Rooms are same-gender" value={acc.policy} onChange={e => setAcc({ policy: e.target.value })} />
            </div>
          </div>
        )}
      </div>

      {/* Videos */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ ...s.label, marginBottom: 8, display: 'block' }}>Vimeo Videos (up to 3)</label>
        {videos.map((v, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input style={s.input} placeholder={`Vimeo URL ${i + 1} (e.g. https://vimeo.com/123456789)`} value={v.url} onChange={e => setVideo(i, 'url', e.target.value)} />
            <input style={s.input} placeholder="Thumbnail Image URL" value={v.thumbnail_url ?? ''} onChange={e => setVideo(i, 'thumbnail_url', e.target.value)} />
          </div>
        ))}
      </div>

      {/* Reviews */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ ...s.label, marginBottom: 0 }}>Google Reviews Cards</label>
          <button type="button" style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }} onClick={addReview}>
            + Add Review
          </button>
        </div>
        {reviews.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>No reviews yet.</div>}
        {reviews.map((review, i) => (
          <div key={i} style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input
                style={s.input}
                placeholder="Reviewer name"
                value={review.name}
                onChange={e => updateReview(i, { name: e.target.value })}
              />
              <input
                type="number"
                min={1}
                max={5}
                step={1}
                style={s.input}
                placeholder="Rating (1-5)"
                value={review.rating ?? 5}
                onChange={e => updateReview(i, { rating: Number(e.target.value) })}
              />
              <button type="button" onClick={() => removeReview(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>
                ×
              </button>
            </div>
            <textarea
              style={s.textarea}
              placeholder="Review text"
              value={review.review_text}
              onChange={e => updateReview(i, { review_text: e.target.value })}
            />
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

function OtherCityForm({ trip, onChange, onSave, onCancel, saving, s }: {
  trip: Trip; onChange: (t: Trip) => void; onSave: () => void; onCancel: () => void; saving: boolean; s: any;
}) {
  const pickups = trip.pickup_points ?? [];
  const setTrip = (patch: Partial<Trip>) => onChange({ ...trip, ...patch });
  const setPickup = (index: number, patch: Partial<PickupPoint>) => {
    const next = pickups.map((p, i) => i === index ? { ...p, ...patch } : p);
    setTrip({ pickup_points: next });
  };
  const addPickup = () => {
    setTrip({
      pickup_points: [
        ...pickups,
        { id: `pt_${Date.now()}`, label: '', meetingSpot: '', time: '', transport: '', availableForOther: true }
      ]
    });
  };
  const removePickup = (index: number) => setTrip({ pickup_points: pickups.filter((_, i) => i !== index) });
  const showInOther = (trip.cities ?? []).includes('Other');
  const toggleShowInOther = () => {
    const current = trip.cities ?? [];
    const next = showInOther ? current.filter(c => c !== 'Other') : Array.from(new Set([...current, 'Other']));
    setTrip({ cities: next });
  };

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>{trip.title}</div>
      <div style={{ color: '#777', fontSize: 13, marginBottom: 12 }}>
        Configure pickup points and pricing for users selecting <strong>Other</strong>.
      </div>

      <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ ...s.label, marginBottom: 0 }}>Show In "Other" City Feed</label>
        <button
          type="button"
          onClick={toggleShowInOther}
          style={{ padding: '4px 14px', borderRadius: 99, border: 'none', background: showInOther ? '#16a34a' : '#ddd', color: showInOther ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
        >
          {showInOther ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ ...s.label, marginBottom: 0 }}>Pickup Points For "Other" Users</label>
          <button type="button" style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }} onClick={addPickup}>+ Add Point</button>
        </div>
        {pickups.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>No pickup points configured yet.</div>}
        {pickups.map((point, index) => (
          <div key={point.id || index} style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={s.label}>Dropdown Label</label>
                <input style={s.input} placeholder="e.g. Dindigul Pickup — 5:30 AM" value={point.label} onChange={e => setPickup(index, { label: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Meeting Spot</label>
                <input style={s.input} placeholder="e.g. Dindigul Bus Stand" value={point.meetingSpot} onChange={e => setPickup(index, { meetingSpot: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Pickup Time</label>
                <input style={s.input} placeholder="e.g. 5:30 AM" value={point.time} onChange={e => setPickup(index, { time: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Transport</label>
                <input style={s.input} placeholder="e.g. Party Bus" value={point.transport} onChange={e => setPickup(index, { transport: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Journey Card Date Offset (days)</label>
                <input
                  type="number"
                  style={s.input}
                  placeholder="0 = same day, -1 = previous day"
                  value={point.dateOffset ?? 0}
                  onChange={e => setPickup(index, { dateOffset: Number(e.target.value) })}
                />
              </div>
              <div>
                <label style={s.label}>Other City Price (₹)</label>
                <input type="number" min={0} style={s.input} placeholder="Leave blank = base event price" value={point.otherPrice ?? ''} onChange={e => setPickup(index, { otherPrice: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
              <div>
                <label style={s.label}>Other City Advance (₹)</label>
                <input type="number" min={0} style={s.input} placeholder="Leave blank = event advance amount" value={point.otherAdvance ?? ''} onChange={e => setPickup(index, { otherAdvance: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
              {point.id === 'own_transport' && (
                <div>
                  <label style={s.label}>Own Transport Price (₹)</label>
                  <input type="number" min={0} style={s.input} placeholder="Used when own transport is selected" value={point.ownTransportPrice ?? ''} onChange={e => setPickup(index, { ownTransportPrice: e.target.value === '' ? undefined : Number(e.target.value) })} />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <label style={{ ...s.label, marginBottom: 0 }}>Available For Other Users</label>
              <button
                type="button"
                onClick={() => setPickup(index, { availableForOther: !point.availableForOther })}
                style={{ padding: '4px 14px', borderRadius: 99, border: 'none', background: point.availableForOther ? '#111' : '#ddd', color: point.availableForOther ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                {point.availableForOther ? 'YES' : 'NO'}
              </button>
            </div>
            <button type="button" onClick={() => removePickup(index)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Remove</button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button style={s.outlineBtn} onClick={onCancel}>Cancel</button>
        <button style={s.btn(saving ? '#aaa' : '#111')} disabled={saving} onClick={onSave}>
          {saving ? 'Saving…' : 'Save Other Setup'}
        </button>
      </div>
    </div>
  );
}

function StringListEditor({
  title,
  values,
  placeholder,
  s,
  onAdd,
  onChange,
  onRemove,
}: {
  title: string;
  values: string[];
  placeholder: string;
  s: any;
  onAdd: () => void;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label style={{ ...s.label, marginBottom: 0 }}>{title}</label>
        <button type="button" style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }} onClick={onAdd}>
          + Add Item
        </button>
      </div>
      {values.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>No items yet.</div>}
      {values.map((item, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <input
            style={s.input}
            placeholder={placeholder}
            value={item}
            onChange={e => onChange(i, e.target.value)}
          />
          <button type="button" onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
