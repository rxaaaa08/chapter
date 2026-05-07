// chaptera admin panel
import React, { useState, useEffect, useRef } from 'react';
import { supabase, parseHeroImages } from './supabase';

// ─── IMAGE UPLOAD ─────────────────────────────────────────────────────────────
async function uploadImageToStorage(file: File, folder = 'general'): Promise<string | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('event-images').upload(path, file, { upsert: true });
  if (error) { console.error('Upload error:', error); return null; }
  const { data } = supabase.storage.from('event-images').getPublicUrl(path);
  return data.publicUrl;
}

function ImageUploadInput({
  value, onChange, placeholder, folder = 'general', style: extraStyle,
}: {
  value: string; onChange: (url: string) => void; placeholder?: string; folder?: string; style?: React.CSSProperties;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImageToStorage(file, folder);
    setUploading(false);
    if (url) onChange(url);
    e.target.value = '';
  };
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', ...extraStyle }}>
      <input
        style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, background: '#fafafa', outline: 'none', minWidth: 0 }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Paste URL or upload ↑'}
      />
      <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFile} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        style={{ padding: '8px 13px', borderRadius: 8, border: '1.5px solid #d0d0d0', background: uploading ? '#f0f0f0' : '#fff', fontWeight: 600, fontSize: 12, cursor: uploading ? 'default' : 'pointer', whiteSpace: 'nowrap', color: uploading ? '#aaa' : '#444', flexShrink: 0, transition: 'all 0.15s' }}
      >
        {uploading ? '⏳ Uploading…' : '⬆ Upload'}
      </button>
    </div>
  );
}

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
  otherPrice?: number;
  otherAdvance?: number;
  forOtherCity?: boolean;
};
type EventMedia = { id?: string; url: string; caption: string; thumbnail_url?: string };
type EventReview = { id?: string; name: string; rating: number; review_text: string; date_label?: string; review_count?: number; images?: string[] };
type FAQ = { id?: string; question: string; answer: string };
type ItineraryScheduleItem = { time: string; activity: string };
type ItineraryDay = { day: string; title: string; description: string; schedule?: ItineraryScheduleItem[] };
type AccommodationStay = { name: string; image?: string; images?: string[]; features: string[] };
type Trip = {
  id?: string;
  slug: string;
  title: string;
  one_liner?: string;
  timing: string;
  price_full: number;
  price_advance: number;
  description: string;
  hero_image: string | string[];
  cities: string[];
  category: string;
  quick_info?: Array<{ icon?: string; label: string; value: string }>;
  included: string[];
  optional_activities: string[];
  not_included: string[];
  announcements?: string[];
  booking_url: string;
  cta_label: string;
  is_active: boolean;
  pickup_points?: PickupPoint[];
  event_media?: EventMedia[];
  event_reviews?: EventReview[];
  faqs?: FAQ[];
  event_dates?: TripDate[];
  itinerary?: ItineraryDay[];
  show_accommodation: boolean;
  show_secret_offer: boolean;
  accommodation?: { name?: string; images?: string[]; features?: string[]; policy?: string; stays?: AccommodationStay[] };
  booking_steps?: Array<{ label: string; value: string; date: string }>;
  invite_slug?: string;
  invite_only?: boolean;
  invite_spots?: number | null;
};
type ChatMsg = { id: string; step_key: string; bot_message: string; flow: string };
type DoubtSubmission = {
  id?: string;
  name?: string;
  phone?: string;
  doubt?: string;
  message?: string;
  event_title?: string;
  event?: string;
  event_name?: string;
  event_category?: string;
  category?: string;
  city?: string;
  selected_date?: string;
  reporting_date?: string;
  reporting_time?: string;
  date?: string;
  submitted_at?: string;
  created_at?: string;
};
type InvitePaymentSubmission = {
  id?: string;
  invite_slug?: string;
  event_id?: string;
  event_slug?: string;
  event_title?: string;
  selected_date?: string;
  name?: string;
  phone?: string;
  amount?: number;
  status?: string;
  submitted_at?: string;
  source?: string;
};

const LOCAL_INVITE_PAYMENT_SUBMISSIONS_KEY = 'chaptera_invite_payment_submissions';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const statusLabel = { available: 'Available', selling_out: 'Selling Out', sold_out: 'Sold Out' };
const statusColor = { available: '#16a34a', selling_out: '#d97706', sold_out: '#dc2626' };

function serializeHeroImages(images: string[]): string {
  const cleaned = images.map(img => img.trim()).filter(Boolean).slice(0, 4);
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned[0];
  return JSON.stringify(cleaned);
}

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
  const [tab, setTab] = useState<'trips' | 'media' | 'timelines' | 'qna' | 'payments' | 'other' | 'messages' | 'analytics'>('trips');
  const [paymentsEventFilter, setPaymentsEventFilter] = useState<'all' | string>('all');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [doubtSubmissions, setDoubtSubmissions] = useState<DoubtSubmission[]>([]);
  const [invitePaymentSubmissions, setInvitePaymentSubmissions] = useState<InvitePaymentSubmission[]>([]);
  const [localInvitePaymentSubmissions, setLocalInvitePaymentSubmissions] = useState<InvitePaymentSubmission[]>([]);
  const [refreshingSubmissions, setRefreshingSubmissions] = useState(false);
  const [globalMessageDrafts, setGlobalMessageDrafts] = useState<Record<string, string>>({});
  const [generalAnnouncementsText, setGeneralAnnouncementsText] = useState('');
  const [globalAnnouncementsFields, setGlobalAnnouncementsFields] = useState<[string, string, string]>(['', '', '']);
  const [doubtCtaLabel, setDoubtCtaLabel] = useState('');
  const [doubtFormWebhookUrl, setDoubtFormWebhookUrl] = useState('');
  const [savingGeneralAnnouncements, setSavingGeneralAnnouncements] = useState(false);
  const [savingDoubtSettings, setSavingDoubtSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [addingTrip, setAddingTrip] = useState(false);
  const [plansCityFilter, setPlansCityFilter] = useState<'all' | string>('all');
  const [mediaCityFilter, setMediaCityFilter] = useState<'all' | string>('all');
  const [timelinesCityFilter, setTimelinesCityFilter] = useState<'all' | string>('all');
  const [timelineEdits, setTimelineEdits] = useState<Record<string, Array<{ label: string; value: string; date: string }>>>({});
  const [selectedTimelineDates, setSelectedTimelineDates] = useState<Record<string, string>>({});
  const [savingTimeline, setSavingTimeline] = useState<string | null>(null);
  const [ctaEdits, setCtaEdits] = useState<Record<string, string>>({});
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsWindow, setAnalyticsWindow] = useState<'24h' | 'week' | 'month'>('week');
  const [analyticsFunnelEventFilter, setAnalyticsFunnelEventFilter] = useState<'all' | string>('all');
  const [qnaCityFilter, setQnaCityFilter] = useState<'all' | string>('all');
  const [qnaDoubtCityFilter, setQnaDoubtCityFilter] = useState<'all' | string>('all');
  const [qnaDoubtCategoryFilter, setQnaDoubtCategoryFilter] = useState<'all' | string>('all');
  const [mediaEditingId, setMediaEditingId] = useState<string | null>(null);
  const [qnaEditingId, setQnaEditingId] = useState<string | null>(null);
  const [mediaOriginalById, setMediaOriginalById] = useState<Record<string, Trip>>({});
  const [qnaOriginalById, setQnaOriginalById] = useState<Record<string, Trip>>({});
  const [otherEditingId, setOtherEditingId] = useState<string | null>(null);
  const [planActionById, setPlanActionById] = useState<Record<string, string>>({});
  const [otherActionById, setOtherActionById] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };
  const globalPreSelectionKeys = ['welcome', 'ask_category', 'select_event'] as const;
  const otherCityPreSelectionKeys = ['other_ask_category', 'other_select_event'] as const;
  const globalPostSelectionKeys = ['ask_doubts_book', 'ask_doubts_contact', 'doubts_btn_yes', 'doubts_btn_no', 'show_faq', 'faq_followup', 'faq_followup_repeat', 'contact_success'] as const;

  // Maps each step_key to the correct flow value required by the DB constraint
  const stepKeyFlow: Record<string, string> = {
    welcome: 'initial', ask_category: 'initial', select_event: 'initial',
    no_events: 'initial', retry_city: 'initial',
    other_ask_category: 'initial', other_select_event: 'initial',
    ask_doubts_book: 'booking', ask_doubts_contact: 'booking',
    doubts_btn_yes: 'booking', doubts_btn_no: 'booking',
    faq_followup: 'booking', faq_followup_repeat: 'booking', show_faq: 'booking',
    ask_transport: 'booking', kyn_ready: 'booking',
    contact_success: 'contact',
    general_announcements: 'global', doubt_cta_label: 'global', doubt_form_webhook_url: 'global',
  };

  const allCities = [
    ...new Set(
      trips.flatMap((t): string[] =>
        (t.cities ?? []).filter((city): city is string => typeof city === 'string' && city.trim().length > 0)
      )
    )
  ] as string[];
  const middleCities = allCities
    .filter(c => {
      const lc = c.toLowerCase();
      return lc !== 'chennai' && lc !== 'other';
    })
    .sort((a, b) => a.localeCompare(b));
  const orderedCities = ['Chennai', ...middleCities].filter((c, i, arr) => allCities.includes(c) && arr.indexOf(c) === i);
  const qnaDoubtCategories = [
    ...new Set(
      (doubtSubmissions ?? [])
        .map(s => (s.event_category || s.category || '').trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  const formatAdminDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const day = date.getDate();
    const month = date.toLocaleString('en-IN', { month: 'short' });
    const time = date.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s/g, ' ').toUpperCase();
    return `${day} ${month} at ${time}`;
  };

  const formatAdminINR = (amount?: number) =>
    typeof amount === 'number' ? `₹${amount.toLocaleString('en-IN')}` : '-';

  const invitePaymentRows: InvitePaymentSubmission[] = [...localInvitePaymentSubmissions, ...invitePaymentSubmissions]
    .sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime());


  const login = () => {
    if (pw === ADMIN_PASSWORD) { setAuthed(true); setPwError(false); }
    else setPwError(true);
  };

  // ─── LOAD DATA ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    try {
      const localRows = JSON.parse(localStorage.getItem(LOCAL_INVITE_PAYMENT_SUBMISSIONS_KEY) || '[]');
      setLocalInvitePaymentSubmissions(Array.isArray(localRows) ? localRows : []);
    } catch {
      setLocalInvitePaymentSubmissions([]);
    }
    Promise.all([
      supabase.from('events').select('*, event_dates(*), event_media(*), event_reviews(*), faqs(*)').order('created_at', { ascending: true }),
      supabase.from('chat_messages').select('*').order('sort_order', { ascending: true }),
      supabase.from('doubt_submissions').select('*').order('submitted_at', { ascending: false }),
      supabase.from('invite_payment_submissions').select('*').order('submitted_at', { ascending: false }),
    ]).then(([evRes, msgRes, doubtsRes, invitePaymentsRes]) => {
      if (evRes.data) setTrips(evRes.data as Trip[]);
      if (msgRes.data) {
        const allMsgs = msgRes.data as ChatMsg[];
        setMsgs(allMsgs);
        const generalAnnouncementsMsg = allMsgs.find(m => m.step_key === 'general_announcements');
        if (generalAnnouncementsMsg) {
          const text = generalAnnouncementsMsg.bot_message || '';
          setGeneralAnnouncementsText(text);
          const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
          setGlobalAnnouncementsFields([lines[0] ?? '', lines[1] ?? '', lines[2] ?? '']);
        }
        const doubtLabelMsg = allMsgs.find(m => m.step_key === 'doubt_cta_label');
        setDoubtCtaLabel(doubtLabelMsg?.bot_message || '');
        const webhookMsg = allMsgs.find(m => m.step_key === 'doubt_form_webhook_url');
        setDoubtFormWebhookUrl(webhookMsg?.bot_message || '');
      }
      if (doubtsRes.data) setDoubtSubmissions(doubtsRes.data as DoubtSubmission[]);
      if (invitePaymentsRes.data) setInvitePaymentSubmissions(invitePaymentsRes.data as InvitePaymentSubmission[]);
      setLoading(false);
    });
  }, [authed]);

  const refreshSubmissions = async () => {
    setRefreshingSubmissions(true);
    try {
      const localRows = JSON.parse(localStorage.getItem(LOCAL_INVITE_PAYMENT_SUBMISSIONS_KEY) || '[]');
      setLocalInvitePaymentSubmissions(Array.isArray(localRows) ? localRows : []);
    } catch {
      setLocalInvitePaymentSubmissions([]);
    }
    const { data } = await supabase
      .from('invite_payment_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (data) setInvitePaymentSubmissions(data as InvitePaymentSubmission[]);
    setRefreshingSubmissions(false);
  };

  useEffect(() => {
    if (msgs.length === 0) return;
    setGlobalMessageDrafts(prev => {
      const next = { ...prev };
      [...globalPreSelectionKeys, ...otherCityPreSelectionKeys, ...globalPostSelectionKeys].forEach((key) => {
        // Only populate from DB if the user hasn't typed anything yet
        if (!next[key]) {
          next[key] = msgs.find(m => m.step_key === key)?.bot_message ?? '';
        }
      });
      return next;
    });
  }, [msgs]);

  // ─── SAVE TRIP ──────────────────────────────────────────────────────────────
  const saveTrip = async (trip: Trip) => {
    setSaving(trip.id ?? 'new');
    // Auto-generate invite_slug from title if not manually set
    const autoSlug = trip.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const tripWithSlug = { ...trip, invite_slug: trip.invite_slug || autoSlug };
    const { event_dates, event_media, event_reviews, faqs, id, ...fields } = tripWithSlug;

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
          validReviews.map((r) => ({
            event_id: eventId,
            name: r.name.trim(),
            rating: Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5))),
            review_text: r.review_text.trim(),
            date_label: r.date_label?.trim() ?? '',
            review_count: Number(r.review_count ?? 0) || null,
            images: Array.isArray(r.images) ? r.images : [],
          }))
        );
      }
    }

    if (eventId && faqs) {
      await supabase.from('faqs').delete().eq('event_id', eventId);
      const validFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());
      if (validFaqs.length > 0) {
        await supabase.from('faqs').insert(
          validFaqs.map((f, i) => ({
            event_id: eventId,
            question: f.question.trim(),
            answer: f.answer.trim(),
            sort_order: i,
          }))
        );
      }
    }

    // Refresh
    const { data } = await supabase.from('events').select('*, event_dates(*), event_media(*), event_reviews(*), faqs(*)').order('created_at', { ascending: true });
    if (data) setTrips(data as Trip[]);
    setSaving(null);
    setEditingTrip(null);
    setAddingTrip(false);
    showToast('Saved!');
  };

  const saveTimeline = async (trip: Trip, steps: Array<{ label: string; value: string; date: string }>, forDate?: string, ctaLabel?: string) => {
    setSavingTimeline(trip.id!);
    const editKey = forDate ? `${trip.id}:${forDate}` : trip.id!;
    if (forDate) {
      const dateRow = (trip.event_dates ?? []).find(d => d.start_date === forDate);
      if (dateRow?.id) {
        await supabase.from('event_dates').update({ booking_steps: steps }).eq('id', dateRow.id);
        setTrips(prev => prev.map(t => t.id === trip.id
          ? { ...t, event_dates: (t.event_dates ?? []).map(d => d.start_date === forDate ? { ...d, booking_steps: steps } : d) }
          : t));
      }
    } else {
      await supabase.from('events').update({ booking_steps: steps }).eq('id', trip.id!);
      setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, booking_steps: steps } : t));
    }
    if (ctaLabel !== undefined) {
      await supabase.from('events').update({ cta_label: ctaLabel }).eq('id', trip.id!);
      setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, cta_label: ctaLabel } : t));
    }
    setTimelineEdits(prev => { const next = { ...prev }; delete next[editKey]; return next; });
    setCtaEdits(prev => { const next = { ...prev }; delete next[trip.id!]; return next; });
    setSavingTimeline(null);
    showToast('Timeline saved!');
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    // Purge rows older than 30 days to keep storage lean
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('flow_analytics').delete().lt('created_at', cutoff);
    const { data } = await supabase.from('flow_analytics').select('*').order('created_at', { ascending: false });
    setAnalyticsData(data ?? []);
    setAnalyticsLoading(false);
  };

  // Compute top-level analytics aggregates from a pre-filtered slice of rows.
  // Per-event funnel rates are computed separately in the analytics tab, keyed
  // by live event ID — so this function only handles visitor count + city split.
  const computeAnalytics = (rows: any[]) => {
    const pageViews = rows.filter(r => r.event_type === 'page_view');
    const visitors = new Set(pageViews.map(r => r.session_id)).size;

    const cityRows = rows.filter(r => r.event_type === 'city_selected' && r.city);
    const cityCounts: Record<string, number> = {};
    cityRows.forEach(r => { cityCounts[r.city] = (cityCounts[r.city] || 0) + 1; });
    const cityTotal = cityRows.length || 1;

    return { visitors, cityCounts, cityTotal };
  };

  const deleteTrip = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await supabase.from('events').delete().eq('id', id);
    setTrips(prev => prev.filter(t => t.id !== id));
    showToast('Deleted.');
  };

  const duplicateTrip = async (trip: Trip) => {
    const { id, slug, event_dates, event_media, event_reviews, faqs, ...rest } = trip as any;
    const newSlug = `${trip.slug ?? trip.id ?? 'event'}-copy-${Date.now()}`;
    const { data, error } = await supabase.from('events').insert({
      ...rest,
      title: `${trip.title} (duplicate)`,
      slug: newSlug,
      is_active: false,
    }).select('*, event_dates(*), event_media(*), event_reviews(*), faqs(*)').single();
    if (error || !data) { showToast('Duplicate failed.'); return; }

    // Copy related rows
    const related: Promise<any>[] = [];
    if ((event_dates ?? []).length > 0) {
      related.push(supabase.from('event_dates').insert(
        event_dates.map(({ id: _id, ...d }: any) => ({ ...d, event_id: data.id }))
      ));
    }
    if ((event_media ?? []).length > 0) {
      related.push(supabase.from('event_media').insert(
        event_media.map(({ id: _id, ...m }: any) => ({ ...m, event_id: data.id }))
      ));
    }
    if ((event_reviews ?? []).length > 0) {
      related.push(supabase.from('event_reviews').insert(
        event_reviews.map(({ id: _id, ...r }: any) => ({ ...r, event_id: data.id }))
      ));
    }
    if ((faqs ?? []).length > 0) {
      related.push(supabase.from('faqs').insert(
        faqs.map(({ id: _id, ...f }: any) => ({ ...f, event_id: data.id }))
      ));
    }
    await Promise.all(related);

    // Reload so related rows appear
    const { data: fresh } = await supabase.from('events')
      .select('*, event_dates(*), event_media(*), event_reviews(*), faqs(*)')
      .eq('id', data.id).single();
    if (fresh) setTrips(prev => [...prev, fresh as Trip]);
    showToast(`"${trip.title}" duplicated ✓`);
  };

  const setLiveState = async (trip: Trip, live: boolean) => {
    await supabase.from('events').update({ is_active: live }).eq('id', trip.id!);
    setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, is_active: live } : t));
  };
  const handlePlanAction = async (trip: Trip, action: string) => {
    if (!trip.id) return;
    if (action === 'live') {
      if (!trip.is_active) await setLiveState(trip, true);
      showToast('Plan is live.');
      return;
    }
    if (action === 'hide') {
      if (trip.is_active) await setLiveState(trip, false);
      showToast('Plan hidden.');
      return;
    }
    if (action === 'preview') {
      const previewTarget = trip.id || trip.slug;
      if (!previewTarget) return;
      if (trip.is_active) {
        await setLiveState(trip, false);
      }
      const previewUrl = `${window.location.origin}/?preview_event=${encodeURIComponent(previewTarget)}`;
      if (navigator?.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(previewUrl); } catch (_) {}
      }
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
      showToast('Preview opened. Plan set to Hidden. URL copied.');
      return;
    }
    if (action === 'duplicate') {
      await duplicateTrip(trip);
      return;
    }
    if (action === 'delete') {
      await deleteTrip(trip.id, trip.title);
    }
  };
  const setOtherFeedState = async (trip: Trip, enabled: boolean) => {
    if (!trip.id) return;
    const currentCities = trip.cities ?? [];
    const nextCities = enabled
      ? Array.from(new Set([...currentCities, 'Other']))
      : currentCities.filter(c => c !== 'Other');
    await supabase.from('events').update({ cities: nextCities }).eq('id', trip.id);
    setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, cities: nextCities } : t));
  };
  const handleOtherAction = async (trip: Trip, action: string) => {
    if (!trip.id) return;
    if (action === 'live') {
      if (!trip.is_active) await setLiveState(trip, true);
      if (!(trip.cities ?? []).includes('Other')) await setOtherFeedState(trip, true);
      showToast('Plan is live in Other Cities.');
      return;
    }
    if (action === 'preview') {
      const previewTarget = trip.id || trip.slug;
      if (!previewTarget) return;
      const previewUrl = `${window.location.origin}/?preview_event=${encodeURIComponent(previewTarget)}`;
      if (navigator?.clipboard?.writeText) {
        try { await navigator.clipboard.writeText(previewUrl); } catch (_) {}
      }
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
      showToast('Preview opened. URL copied.');
      return;
    }
    if (action === 'remove' || action === 'deactivate') {
      await setOtherFeedState(trip, false);
      if (otherEditingId === trip.id) setOtherEditingId(null);
      showToast('Removed from Other Cities feed.');
    }
  };
  const updateTripInList = (tripId: string, updater: (t: Trip) => Trip) => {
    setTrips(prev => prev.map(t => (t.id === tripId ? updater(t) : t)));
  };
  const cloneTrip = (trip: Trip): Trip => JSON.parse(JSON.stringify(trip));
  const beginMediaEdit = (trip: Trip) => {
    if (!trip.id) return;
    setMediaOriginalById(prev => ({ ...prev, [trip.id!]: cloneTrip(trip) }));
    setMediaEditingId(trip.id);
  };
  const cancelMediaEdit = (tripId: string) => {
    const snapshot = mediaOriginalById[tripId];
    if (snapshot) updateTripInList(tripId, () => cloneTrip(snapshot));
    setMediaOriginalById(prev => {
      const next = { ...prev };
      delete next[tripId];
      return next;
    });
    setMediaEditingId(null);
  };
  const beginQnaEdit = (trip: Trip) => {
    if (!trip.id) return;
    setQnaOriginalById(prev => ({ ...prev, [trip.id!]: cloneTrip(trip) }));
    setQnaEditingId(trip.id);
  };
  const cancelQnaEdit = (tripId: string) => {
    const snapshot = qnaOriginalById[tripId];
    if (snapshot) updateTripInList(tripId, () => cloneTrip(snapshot));
    setQnaOriginalById(prev => {
      const next = { ...prev };
      delete next[tripId];
      return next;
    });
    setQnaEditingId(null);
  };

  // ─── SAVE MESSAGE ────────────────────────────────────────────────────────────
  const saveMsg = async (msg: ChatMsg) => {
    setSaving(msg.id);
    const { error } = await supabase.from('chat_messages').update({ bot_message: msg.bot_message }).eq('id', msg.id);
    setSaving(null);
    if (error) { showToast('❌ Save failed — check your connection'); return; }
    showToast('Message saved!');
  };

  const saveGlobalStepTemplate = async (stepKey: string) => {
    const draft = (globalMessageDrafts[stepKey] ?? '').trim();
    const existing = msgs.find(m => m.step_key === stepKey);
    setSaving(`global:${stepKey}`);

    if (existing?.id) {
      if (!draft) {
        const { error } = await supabase.from('chat_messages').delete().eq('id', existing.id);
        if (!error) setMsgs(prev => prev.filter(m => m.id !== existing.id));
        else { setSaving(null); showToast('❌ Save failed — check your connection'); return; }
      } else {
        const { error } = await supabase.from('chat_messages').update({ bot_message: draft }).eq('id', existing.id);
        if (!error) setMsgs(prev => prev.map(m => m.id === existing.id ? { ...m, bot_message: draft } : m));
        else { setSaving(null); showToast('❌ Save failed — check your connection'); return; }
      }
    } else if (draft) {
      const maxSortOrder = msgs.length > 0
        ? Math.max(...msgs.map((m: any) => Number((m as any).sort_order) || 0))
        : 0;
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          step_key: stepKey,
          bot_message: draft,
          flow: stepKeyFlow[stepKey] ?? 'global',
          options: [],
          sort_order: maxSortOrder + 1,
        })
        .select('*')
        .single();
      if (error) { setSaving(null); showToast('❌ Save failed — check your connection'); return; }
      if (data) setMsgs(prev => [...prev, data as ChatMsg]);
    }

    setSaving(null);
    showToast('Message saved!');
  };

  const saveGeneralAnnouncements = async () => {
    setSavingGeneralAnnouncements(true);
    const joinedAnnouncements = globalAnnouncementsFields.map(v => v.trim()).filter(Boolean).join('\n');
    const existing = msgs.find(m => m.step_key === 'general_announcements');
    if (existing?.id) {
      const { error } = await supabase.from('chat_messages').update({ bot_message: joinedAnnouncements }).eq('id', existing.id);
      if (error) { setSavingGeneralAnnouncements(false); showToast('❌ Save failed — check your connection'); return; }
      setGeneralAnnouncementsText(joinedAnnouncements);
      setMsgs(prev => prev.map(m => m.id === existing.id ? { ...m, bot_message: joinedAnnouncements } : m));
    } else {
      const maxSortOrder = msgs.length > 0
        ? Math.max(...msgs.map((m: any) => Number((m as any).sort_order) || 0))
        : 0;
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          step_key: 'general_announcements',
          bot_message: joinedAnnouncements,
          flow: stepKeyFlow['general_announcements'],
          options: [],
          sort_order: maxSortOrder + 1,
        })
        .select('*')
        .single();
      if (error) { setSavingGeneralAnnouncements(false); showToast('❌ Save failed — check your connection'); return; }
      setGeneralAnnouncementsText(joinedAnnouncements);
      if (data) setMsgs(prev => [...prev, data as ChatMsg]);
    }
    setSavingGeneralAnnouncements(false);
    showToast('Global announcements saved!');
  };

  const saveDoubtFormSettings = async () => {
    setSavingDoubtSettings(true);
    const saveSetting = async (stepKey: string, value: string): Promise<boolean> => {
      const trimmed = value.trim();
      const existing = msgs.find(m => m.step_key === stepKey);
      if (existing?.id) {
        if (!trimmed) {
          const { error } = await supabase.from('chat_messages').delete().eq('id', existing.id);
          if (error) return false;
          setMsgs(prev => prev.filter(m => m.id !== existing.id));
        } else {
          const { error } = await supabase.from('chat_messages').update({ bot_message: trimmed }).eq('id', existing.id);
          if (error) return false;
          setMsgs(prev => prev.map(m => m.id === existing.id ? { ...m, bot_message: trimmed } : m));
        }
      } else if (trimmed) {
        const maxSortOrder = msgs.length > 0
          ? Math.max(...msgs.map((m: any) => Number((m as any).sort_order) || 0))
          : 0;
        const { data, error } = await supabase
          .from('chat_messages')
          .insert({
            step_key: stepKey,
            bot_message: trimmed,
            flow: stepKeyFlow[stepKey] ?? 'global',
            options: [],
            sort_order: maxSortOrder + 1,
          })
          .select('*')
          .single();
        if (error) return false;
        if (data) setMsgs(prev => [...prev, data as ChatMsg]);
      }
      return true;
    };

    const ok1 = await saveSetting('doubt_cta_label', doubtCtaLabel);
    const ok2 = await saveSetting('doubt_form_webhook_url', doubtFormWebhookUrl);
    setSavingDoubtSettings(false);
    if (!ok1 || !ok2) { showToast('❌ Save failed — check your connection'); return; }
    showToast('Doubt form settings saved!');
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
        <button style={s.tab(tab === 'trips')} onClick={() => setTab('trips')}>Plans</button>
        <button style={s.tab(tab === 'media')} onClick={() => setTab('media')}>Media</button>
        <button style={s.tab(tab === 'qna')} onClick={() => setTab('qna')}>Q&A</button>
        <button style={s.tab(tab === 'payments')} onClick={() => setTab('payments')}>Payments</button>
        <button style={s.tab(tab === 'timelines')} onClick={() => setTab('timelines')}>Timelines</button>
        <button style={s.tab(tab === 'other')} onClick={() => setTab('other')}>Other Cities</button>
        <button style={s.tab(tab === 'messages')} onClick={() => setTab('messages')}>Messages</button>
        <button style={s.tab(tab === 'analytics')} onClick={() => { setTab('analytics'); loadAnalytics(); }}>Analytics</button>
      </div>

      <div style={{ maxWidth: tab === 'payments' ? 1120 : 920, margin: '32px auto', padding: '0 20px' }}>
        {loading && <div style={{ textAlign: 'center', color: '#aaa', marginTop: 60 }}>Loading...</div>}

        {/* ── TRIPS TAB ────────────────────────────────────────────────────── */}
        {!loading && tab === 'trips' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'relative', minWidth: 190 }}>
                  <select
                    value={plansCityFilter}
                    onChange={e => setPlansCityFilter(e.target.value)}
                    style={{
                      ...s.input,
                      width: '100%',
                      padding: '9px 34px 9px 12px',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 999,
                      border: '1.5px solid #d7d7d7',
                      background: '#fff',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">All Cities</option>
                    {orderedCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#777', fontSize: 12, pointerEvents: 'none' }}>▾</span>
                </div>
              </div>
              <button style={s.btn()} onClick={() => { setAddingTrip(true); setEditingTrip({ slug: '', title: '', one_liner: '', timing: '', price_full: 0, price_advance: 0, description: '', hero_image: '', cities: ['Chennai'], category: 'Trips', quick_info: [], included: [], optional_activities: [], not_included: [], announcements: [], booking_url: '', cta_label: '', is_active: true, show_accommodation: false, show_secret_offer: true, accommodation: { stays: [{ name: '', images: ['', '', ''], features: ['', '', ''] }] }, event_dates: [], itinerary: [{ day: 'Day 1', title: '', description: '', schedule: [] }], event_reviews: [], faqs: [], event_media: [{url:'',thumbnail_url:'',caption:''},{url:'',thumbnail_url:'',caption:''},{url:'',thumbnail_url:'',caption:''}] }); }}>
                + Add Plan
              </button>
            </div>

            {(() => {
              const getNearestDateTs = (trip: Trip) => {
                const dates = (trip.event_dates ?? [])
                  .map(d => new Date(`${d.start_date}T00:00:00`).getTime())
                  .filter(ts => !Number.isNaN(ts));
                return dates.length > 0 ? Math.min(...dates) : Number.MAX_SAFE_INTEGER;
              };
              const sortPlans = (list: Trip[]) => [...list].sort((a, b) => {
                if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
                const dateDiff = getNearestDateTs(a) - getNearestDateTs(b);
                if (dateDiff !== 0) return dateDiff;
                return a.title.localeCompare(b.title);
              });
              const filteredTrips = plansCityFilter === 'all'
                ? trips
                : trips.filter(plan => (plan.cities ?? []).includes(plansCityFilter));
              const grouped = new Map<string, Trip[]>();
              filteredTrips.forEach((plan) => {
                const rawCategory = (plan.category || '').trim();
                const key = rawCategory ? rawCategory.toLowerCase() : 'uncategorized';
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push(plan);
              });

              const preferredOrder = ['events', 'trips'];
              const categoryKeys = Array.from(grouped.keys());
              const orderedKeys = [
                ...preferredOrder.filter(k => categoryKeys.includes(k)),
                ...categoryKeys
                  .filter(k => !preferredOrder.includes(k))
                  .sort((a, b) => a.localeCompare(b)),
              ];

              const sections = orderedKeys.map((key) => {
                const items = sortPlans(grouped.get(key) ?? []);
                const displayTitle = items[0]?.category?.trim() || (key === 'uncategorized' ? 'Uncategorized' : key);
                return { title: displayTitle, items };
              });

              return sections.map(section => (
                section.items.length > 0 ? (
                  <div key={section.title}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#666', marginBottom: 10, marginTop: 12 }}>{section.title}</div>
                    {section.items.map(trip => (
                      <div key={trip.id} style={{ ...s.card, opacity: trip.is_active ? 1 : 0.55 }}>
                        {editingTrip?.id === trip.id ? (
                          <TripForm trip={editingTrip} onChange={setEditingTrip} onSave={() => saveTrip(editingTrip!)} onCancel={() => setEditingTrip(null)} saving={saving === trip.id} s={s} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>{trip.title}</div>
                              <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>₹{trip.price_full?.toLocaleString('en-IN')} · {trip.timing}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                              <button style={s.outlineBtn} onClick={() => setEditingTrip({ ...trip })}>Edit</button>
                              <div style={{ position: 'relative', minWidth: 118 }}>
                                <select
                                  value={planActionById[trip.id!] ?? ''}
                                  onChange={async (e) => {
                                    const action = e.target.value;
                                    setPlanActionById(prev => ({ ...prev, [trip.id!]: action }));
                                    await handlePlanAction(trip, action);
                                    setPlanActionById(prev => ({ ...prev, [trip.id!]: '' }));
                                  }}
                                  style={{
                                    ...s.input,
                                    width: '100%',
                                    padding: '8px 30px 8px 10px',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    borderRadius: 8,
                                    color: trip.is_active ? '#16a34a' : '#777',
                                    appearance: 'none',
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <option value="" disabled>{trip.is_active ? 'Live' : 'Hidden'}</option>
                                  <option value="live">Live</option>
                                  <option value="hide">Hide</option>
                                  <option value="preview">Preview</option>
                                  <option value="duplicate">Duplicate</option>
                                  <option value="delete">Delete</option>
                                </select>
                                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#777', fontSize: 11, pointerEvents: 'none' }}>▾</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null
              ));
            })()}

            {addingTrip && editingTrip && !editingTrip.id && (
              <div style={s.card}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>New Trip</div>
                <TripForm trip={editingTrip} onChange={setEditingTrip} onSave={() => saveTrip(editingTrip!)} onCancel={() => { setAddingTrip(false); setEditingTrip(null); }} saving={saving === 'new'} s={s} />
              </div>
            )}
          </>
        )}

        {/* ── MEDIA TAB ─────────────────────────────────────────────────────── */}
        {!loading && tab === 'media' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ position: 'relative', minWidth: 190 }}>
                <select
                  value={mediaCityFilter}
                  onChange={e => setMediaCityFilter(e.target.value)}
                  style={{
                    ...s.input,
                    width: '100%',
                    padding: '9px 34px 9px 12px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 999,
                    border: '1.5px solid #d7d7d7',
                    background: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Cities</option>
                  {orderedCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#777', fontSize: 12, pointerEvents: 'none' }}>▾</span>
              </div>
            </div>
            {(() => {
              const getNearestDateTs = (trip: Trip) => {
                const dates = (trip.event_dates ?? [])
                  .map(d => new Date(`${d.start_date}T00:00:00`).getTime())
                  .filter(ts => !Number.isNaN(ts));
                return dates.length > 0 ? Math.min(...dates) : Number.MAX_SAFE_INTEGER;
              };
              const sortPlans = (list: Trip[]) => [...list].sort((a, b) => {
                if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
                const dateDiff = getNearestDateTs(a) - getNearestDateTs(b);
                if (dateDiff !== 0) return dateDiff;
                return a.title.localeCompare(b.title);
              });
              const filteredTrips = mediaCityFilter === 'all'
                ? trips
                : trips.filter(plan => (plan.cities ?? []).includes(mediaCityFilter));
              const grouped = new Map<string, Trip[]>();
              filteredTrips.forEach((plan) => {
                const rawCategory = (plan.category || '').trim();
                const key = rawCategory ? rawCategory.toLowerCase() : 'uncategorized';
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push(plan);
              });

              const preferredOrder = ['events', 'trips'];
              const categoryKeys = Array.from(grouped.keys());
              const orderedKeys = [
                ...preferredOrder.filter(k => categoryKeys.includes(k)),
                ...categoryKeys
                  .filter(k => !preferredOrder.includes(k))
                  .sort((a, b) => a.localeCompare(b)),
              ];

              const sections = orderedKeys.map((key) => {
                const items = sortPlans(grouped.get(key) ?? []);
                const displayTitle = items[0]?.category?.trim() || (key === 'uncategorized' ? 'Uncategorized' : key);
                return { title: displayTitle, items };
              });

              return sections.map(section => (
                section.items.length > 0 ? (
                  <div key={section.title}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#666', marginBottom: 10, marginTop: 12 }}>{section.title}</div>
                    {section.items.map(trip => {
                      const media = trip.event_media ?? [];
                      const videos: EventMedia[] = [0, 1, 2].map(i => media[i] ?? { url: '', thumbnail_url: '', caption: '' });
                      const reviews = trip.event_reviews ?? [];
                      const isExpanded = mediaEditingId === trip.id;
                      return (
                        <div key={trip.id} style={{ ...s.card, opacity: trip.is_active ? 1 : 0.65 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: isExpanded ? 10 : 0 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>{trip.title}</div>
                              <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>₹{trip.price_full?.toLocaleString('en-IN')} · {trip.timing}</div>
                            </div>
                            {isExpanded ? (
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <button
                                  style={s.outlineBtn}
                                  disabled={saving === trip.id}
                                  onClick={() => trip.id && cancelMediaEdit(trip.id)}
                                >
                                  Cancel
                                </button>
                                <button
                                  style={s.btn(saving === trip.id ? '#aaa' : '#111')}
                                  disabled={saving === trip.id}
                                  onClick={async () => {
                                    if (!trip.id) return;
                                    await saveTrip(trip);
                                    setMediaOriginalById(prev => {
                                      const next = { ...prev };
                                      delete next[trip.id!];
                                      return next;
                                    });
                                    setMediaEditingId(null);
                                  }}
                                >
                                  {saving === trip.id ? 'Saving…' : 'Save'}
                                </button>
                              </div>
                            ) : (
                              <button
                                style={s.outlineBtn}
                                onClick={() => beginMediaEdit(trip)}
                              >
                                Edit
                              </button>
                            )}
                          </div>

                          {isExpanded && (
                            <>
                              <div style={{ marginBottom: 12 }}>
                                <label style={{ ...s.label, marginBottom: 8, display: 'block' }}>Videos (Carousel)</label>
                                {videos.map((v, i) => (
                                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                    <input
                                      style={s.input}
                                      placeholder={`Vimeo URL ${i + 1}`}
                                      value={v.url}
                                      onChange={e => {
                                        const updated = videos.map((x, idx) => idx === i ? { ...x, url: e.target.value } : x);
                                        updateTripInList(trip.id!, t => ({ ...t, event_media: updated }));
                                      }}
                                    />
                                    <ImageUploadInput
                                      value={v.thumbnail_url ?? ''}
                                      onChange={url => {
                                        const updated = videos.map((x, idx) => idx === i ? { ...x, thumbnail_url: url } : x);
                                        updateTripInList(trip.id!, t => ({ ...t, event_media: updated }));
                                      }}
                                      placeholder="Thumbnail — paste URL or upload"
                                      folder="thumbnails"
                                    />
                                  </div>
                                ))}
                              </div>

                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                  <label style={{ ...s.label, marginBottom: 0 }}>Groupchat Messages</label>
                                  <button
                                    type="button"
                                    style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }}
                                    onClick={() => updateTripInList(trip.id!, t => ({ ...t, event_reviews: [...(t.event_reviews ?? []), { name: '', rating: 5, review_text: '', review_count: 0, date_label: '' }] }))}
                                  >
                                    + Add Message
                                  </button>
                                </div>
                                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>
                                  Casual post-trip messages between participants — not reviews. e.g. "does anyone have that video of me falling 😭" or "tell me when the next one is!"
                                </div>
                                {(reviews ?? []).length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>No messages yet.</div>}
                                {reviews.map((review, i) => (
                                  <div key={i} style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                      <input
                                        style={s.input}
                                        placeholder="Person's name (e.g. Priya)"
                                        value={review.name}
                                        onChange={e => updateTripInList(trip.id!, t => {
                                          const next = [...(t.event_reviews ?? [])];
                                          next[i] = { ...next[i], name: e.target.value };
                                          return { ...t, event_reviews: next };
                                        })}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateTripInList(trip.id!, t => {
                                          const next = [...(t.event_reviews ?? [])].filter((_, idx) => idx !== i);
                                          return { ...t, event_reviews: next };
                                        })}
                                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <textarea
                                      style={s.textarea}
                                      placeholder="What they said in the group chat after the trip..."
                                      value={review.review_text}
                                      onChange={e => updateTripInList(trip.id!, t => {
                                        const next = [...(t.event_reviews ?? [])];
                                        next[i] = { ...next[i], review_text: e.target.value };
                                        return { ...t, event_reviews: next };
                                      })}
                                    />
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null
              ));
            })()}

          </>
        )}

        {/* ── TIMELINES TAB ─────────────────────────────────────────────────── */}
        {!loading && tab === 'timelines' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 20, flex: 1 }}>Timelines</div>
              <div style={{ position: 'relative', minWidth: 190 }}>
                <select
                  value={timelinesCityFilter}
                  onChange={e => setTimelinesCityFilter(e.target.value)}
                  style={{ ...s.input, padding: '9px 34px 9px 12px', fontSize: 13, fontWeight: 600, borderRadius: 999, border: '1.5px solid #d7d7d7', background: '#fff', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none', cursor: 'pointer' }}
                >
                  <option value="all">All Cities</option>
                  {orderedCities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#777', fontSize: 12, pointerEvents: 'none' }}>▾</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 18 }}>
              Use <code style={{ background: '#f0f0ea', borderRadius: 4, padding: '1px 4px' }}>{'{advance}'}</code> or <code style={{ background: '#f0f0ea', borderRadius: 4, padding: '1px 4px' }}>{'{balance}'}</code> in Value to auto-fill prices.
            </div>
            {(() => {
              const getNearestDateTs = (trip: Trip) => {
                const dates = (trip.event_dates ?? []).map(d => new Date(`${d.start_date}T00:00:00`).getTime()).filter(ts => !Number.isNaN(ts));
                return dates.length > 0 ? Math.min(...dates) : Number.MAX_SAFE_INTEGER;
              };
              const sortPlans = (list: Trip[]) => [...list].sort((a, b) => {
                if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
                const dateDiff = getNearestDateTs(a) - getNearestDateTs(b);
                return dateDiff !== 0 ? dateDiff : a.title.localeCompare(b.title);
              });
              const filtered = timelinesCityFilter === 'all' ? trips : trips.filter(t => (t.cities ?? []).includes(timelinesCityFilter));
              const grouped = new Map<string, Trip[]>();
              filtered.forEach(plan => {
                const key = (plan.category || '').trim().toLowerCase() || 'uncategorized';
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push(plan);
              });
              const orderedKeys = [
                ...['events', 'trips'].filter(k => grouped.has(k)),
                ...[...grouped.keys()].filter(k => !['events', 'trips'].includes(k)).sort(),
              ];
              return orderedKeys.map(key => {
                const items = sortPlans(grouped.get(key) ?? []);
                const displayTitle = items[0]?.category?.trim() || key;
                return items.length > 0 ? (
                  <div key={key}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#666', marginBottom: 10, marginTop: 12 }}>{displayTitle}</div>
                    {items.map(trip => {
                      const sortedDates = (trip.event_dates ?? []).filter(d => d.start_date).sort((a, b) => a.start_date.localeCompare(b.start_date));
                      const hasMultipleDates = sortedDates.length > 1;
                      const selectedDate = sortedDates.length > 0
                        ? (selectedTimelineDates[trip.id!] ?? sortedDates[0]?.start_date ?? '')
                        : '';
                      const editKey = hasMultipleDates ? `${trip.id}:${selectedDate}` : trip.id!;
                      const activeDateRow = sortedDates.find(d => d.start_date === selectedDate);
                      const perDateSteps = (activeDateRow as any)?.booking_steps as Array<{ label: string; value: string; date: string }> | undefined;
                      const defaultSteps = trip.booking_steps ?? [
                        { label: 'Advance', value: '{advance}', date: '' },
                        { label: 'Remaining Balance', value: '{balance}', date: '' },
                        { label: 'Receive', value: 'Pickup, stay & trip details', date: '' },
                      ];
                      const currentSteps: Array<{ label: string; value: string; date: string }> =
                        timelineEdits[editKey] ?? (hasMultipleDates ? (perDateSteps ?? defaultSteps) : defaultSteps);
                      const setStep = (i: number, patch: Partial<{ label: string; value: string; date: string }>) => {
                        const next = currentSteps.map((s, idx) => idx === i ? { ...s, ...patch } : s);
                        setTimelineEdits(prev => ({ ...prev, [editKey]: next }));
                      };
                      const addStep = () => setTimelineEdits(prev => ({ ...prev, [editKey]: [...currentSteps, { label: '', value: '', date: '' }] }));
                      const removeStep = (i: number) => setTimelineEdits(prev => ({ ...prev, [editKey]: currentSteps.filter((_, idx) => idx !== i) }));
                      const isDirty = !!timelineEdits[editKey] || ctaEdits[trip.id!] !== undefined;
                      return (
                        <div key={trip.id} style={{ ...s.card, marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                            <div style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{trip.title}</div>
                            {isDirty && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                  style={{ ...s.outlineBtn, fontSize: 12, padding: '6px 14px' }}
                                  disabled={savingTimeline === trip.id}
                                  onClick={() => {
                                    setTimelineEdits(prev => {
                                      const next = { ...prev };
                                      delete next[editKey];
                                      return next;
                                    });
                                    setCtaEdits(prev => {
                                      const next = { ...prev };
                                      delete next[trip.id!];
                                      return next;
                                    });
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  style={{ ...s.btn(savingTimeline === trip.id ? '#aaa' : '#111'), fontSize: 12, padding: '6px 14px' }}
                                  disabled={savingTimeline === trip.id}
                                  onClick={() => saveTimeline(trip, currentSteps, hasMultipleDates ? selectedDate : undefined, ctaEdits[trip.id!])}
                                >
                                  {savingTimeline === trip.id ? 'Saving…' : 'Save'}
                                </button>
                              </div>
                            )}
                          </div>

                          {currentSteps.map((step, i) => {
                            const isNowRow = i === 0;
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9f9f7', border: '1px solid #ebebeb', borderRadius: 10, marginBottom: 6 }}>
                                {/* Left: tag + value stacked */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <input
                                    style={{ display: 'block', width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 11, fontWeight: 600, color: '#999', padding: 0, marginBottom: 3 }}
                                    placeholder={isNowRow ? 'e.g. Advance' : 'Tag label'}
                                    value={step.label}
                                    onChange={e => setStep(i, { label: e.target.value })}
                                  />
                                  <input
                                    style={{ display: 'block', width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 15, fontWeight: 700, color: '#111', padding: 0 }}
                                    placeholder={isNowRow ? '{advance}' : i === 1 ? '{balance}' : 'Value or text'}
                                    value={step.value}
                                    onChange={e => setStep(i, { value: e.target.value })}
                                  />
                                </div>
                                {/* Right: date or NOW pill + delete */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                  {isNowRow
                                    ? <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 99, padding: '4px 10px', whiteSpace: 'nowrap' }}>Now</span>
                                    : <input
                                        type="date"
                                        style={{ border: '1px solid #ddd', borderRadius: 8, padding: '5px 8px', fontSize: 12, color: '#111', background: '#fff', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                                        value={step.date}
                                        onChange={e => setStep(i, { date: e.target.value })}
                                      />
                                  }
                                  <button type="button" onClick={() => removeStep(i)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 18, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>×</button>
                                </div>
                              </div>
                            );
                          })}

                          {/* Reference row — styled like a step row, dropdown on the right */}
                          {sortedDates.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9f9f7', border: '1px solid #ebebeb', borderRadius: 10, marginBottom: 6, marginTop: 2 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{trip.title}</div>
                              </div>
                              <div style={{ position: 'relative', flexShrink: 0 }}>
                                <select
                                  value={selectedDate}
                                  onChange={e => setSelectedTimelineDates(prev => ({ ...prev, [trip.id!]: e.target.value }))}
                                  style={{ border: '1.5px solid #FFD700', borderRadius: 8, padding: '5px 28px 5px 10px', fontSize: 12, fontWeight: 700, color: '#111', background: '#FFF9D6', outline: 'none', appearance: 'none', WebkitAppearance: 'none', cursor: hasMultipleDates ? 'pointer' : 'default', opacity: hasMultipleDates ? 1 : 0.85 }}
                                  disabled={!hasMultipleDates}
                                >
                                  {sortedDates.map(d => (
                                    <option key={d.start_date} value={d.start_date}>
                                      {new Date(`${d.start_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </option>
                                  ))}
                                </select>
                                {hasMultipleDates && (
                                  <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#888', pointerEvents: 'none' }}>▾</span>
                                )}
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                            <button type="button" onClick={addStep} style={{ padding: '5px 14px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>+ Add Step</button>
                            <div style={{ flex: 1 }}>
                              <input
                                style={{ ...s.input, fontSize: 13 }}
                                placeholder="Booking CTA button label…"
                                value={ctaEdits[trip.id!] !== undefined ? ctaEdits[trip.id!] : (trip.cta_label ?? '')}
                                onChange={e => setCtaEdits(prev => ({ ...prev, [trip.id!]: e.target.value }))}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null;
              });
            })()}
          </>
        )}

        {/* ── Q&A TAB ───────────────────────────────────────────────────────── */}
        {!loading && tab === 'qna' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ position: 'relative', minWidth: 190 }}>
                <select
                  value={qnaCityFilter}
                  onChange={e => setQnaCityFilter(e.target.value)}
                  style={{
                    ...s.input,
                    width: '100%',
                    padding: '9px 34px 9px 12px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 999,
                    border: '1.5px solid #d7d7d7',
                    background: '#fff',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="all">All Cities</option>
                  {orderedCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#777', fontSize: 12, pointerEvents: 'none' }}>▾</span>
              </div>
            </div>

            {(() => {
              const getNearestDateTs = (trip: Trip) => {
                const dates = (trip.event_dates ?? [])
                  .map(d => new Date(`${d.start_date}T00:00:00`).getTime())
                  .filter(ts => !Number.isNaN(ts));
                return dates.length > 0 ? Math.min(...dates) : Number.MAX_SAFE_INTEGER;
              };
              const sortPlans = (list: Trip[]) => [...list].sort((a, b) => {
                if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
                const dateDiff = getNearestDateTs(a) - getNearestDateTs(b);
                if (dateDiff !== 0) return dateDiff;
                return a.title.localeCompare(b.title);
              });
              const filteredTrips = qnaCityFilter === 'all'
                ? trips
                : trips.filter(plan => (plan.cities ?? []).includes(qnaCityFilter));
              const grouped = new Map<string, Trip[]>();
              filteredTrips.forEach((plan) => {
                const rawCategory = (plan.category || '').trim();
                const key = rawCategory ? rawCategory.toLowerCase() : 'uncategorized';
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push(plan);
              });
              const preferredOrder = ['events', 'trips'];
              const categoryKeys = Array.from(grouped.keys());
              const orderedKeys = [
                ...preferredOrder.filter(k => categoryKeys.includes(k)),
                ...categoryKeys.filter(k => !preferredOrder.includes(k)).sort((a, b) => a.localeCompare(b)),
              ];
              const sections = orderedKeys.map((key) => {
                const items = sortPlans(grouped.get(key) ?? []);
                const displayTitle = items[0]?.category?.trim() || (key === 'uncategorized' ? 'Uncategorized' : key);
                return { title: displayTitle, items };
              });

              return sections.map(section => (
                section.items.length > 0 ? (
                  <div key={section.title}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#666', marginBottom: 10, marginTop: 12 }}>{section.title}</div>
                    {section.items.map(trip => {
                      const isExpanded = qnaEditingId === trip.id;
                      const faqs = trip.faqs ?? [];
                      return (
                        <div key={trip.id} style={{ ...s.card, opacity: trip.is_active ? 1 : 0.65 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: isExpanded ? 10 : 0 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>{trip.title}</div>
                              <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>₹{trip.price_full?.toLocaleString('en-IN')} · {trip.timing}</div>
                            </div>
                            {isExpanded ? (
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <button
                                  style={s.outlineBtn}
                                  disabled={saving === trip.id}
                                  onClick={() => trip.id && cancelQnaEdit(trip.id)}
                                >
                                  Cancel
                                </button>
                                <button
                                  style={s.btn(saving === trip.id ? '#aaa' : '#111')}
                                  disabled={saving === trip.id}
                                  onClick={async () => {
                                    if (!trip.id) return;
                                    await saveTrip(trip);
                                    setQnaOriginalById(prev => {
                                      const next = { ...prev };
                                      delete next[trip.id!];
                                      return next;
                                    });
                                    setQnaEditingId(null);
                                  }}
                                >
                                  {saving === trip.id ? 'Saving…' : 'Save'}
                                </button>
                              </div>
                            ) : (
                              <button
                                style={s.outlineBtn}
                                onClick={() => beginQnaEdit(trip)}
                              >
                                Edit
                              </button>
                            )}
                          </div>

                          {isExpanded && (
                            <div style={{ marginTop: 6 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <label style={{ ...s.label, marginBottom: 0 }}>Possible Doubts (FAQ)</label>
                                <button
                                  type="button"
                                  style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }}
                                  onClick={() => updateTripInList(trip.id!, t => ({ ...t, faqs: [...(t.faqs ?? []), { question: '', answer: '' }] }))}
                                >
                                  + Add Q&A
                                </button>
                              </div>
                              {faqs.length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No FAQs added yet.</div>}
                              {faqs.map((faq, i) => (
                                <div key={i} style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                    <input
                                      style={s.input}
                                      placeholder="Example: Can I join solo?"
                                      value={faq.question}
                                      onChange={e => updateTripInList(trip.id!, t => {
                                        const next = [...(t.faqs ?? [])];
                                        next[i] = { ...next[i], question: e.target.value };
                                        return { ...t, faqs: next };
                                      })}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateTripInList(trip.id!, t => ({ ...t, faqs: [...(t.faqs ?? [])].filter((_, idx) => idx !== i) }))}
                                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                  <textarea
                                    style={s.textarea}
                                    placeholder="Example: Yes. Most members join solo and we make sure the group vibe is welcoming."
                                    value={faq.answer}
                                    onChange={e => updateTripInList(trip.id!, t => {
                                      const next = [...(t.faqs ?? [])];
                                      next[i] = { ...next[i], answer: e.target.value };
                                      return { ...t, faqs: next };
                                    })}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : null
              ));
            })()}

            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#666', marginBottom: 10 }}>Doubt Submissions</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ position: 'relative', minWidth: 190 }}>
                  <select
                    value={qnaDoubtCityFilter}
                    onChange={e => setQnaDoubtCityFilter(e.target.value)}
                    style={{
                      ...s.input,
                      width: '100%',
                      padding: '9px 34px 9px 12px',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 999,
                      border: '1.5px solid #d7d7d7',
                      background: '#fff',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">All Cities</option>
                    {orderedCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#777', fontSize: 12, pointerEvents: 'none' }}>▾</span>
                </div>
                <div style={{ position: 'relative', minWidth: 190 }}>
                  <select
                    value={qnaDoubtCategoryFilter}
                    onChange={e => setQnaDoubtCategoryFilter(e.target.value)}
                    style={{
                      ...s.input,
                      width: '100%',
                      padding: '9px 34px 9px 12px',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 999,
                      border: '1.5px solid #d7d7d7',
                      background: '#fff',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="all">All Categories</option>
                    {qnaDoubtCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#777', fontSize: 12, pointerEvents: 'none' }}>▾</span>
                </div>
              </div>
              {(() => {
                const filteredSubmissions = (doubtSubmissions ?? []).filter((submission) => {
                  const cityMatch = qnaDoubtCityFilter === 'all'
                    ? true
                    : (submission.city ?? '').trim().toLowerCase() === qnaDoubtCityFilter.trim().toLowerCase();
                  const submissionCategory = (submission.event_category || submission.category || '').trim();
                  const categoryMatch = qnaDoubtCategoryFilter === 'all'
                    ? true
                    : submissionCategory.toLowerCase() === qnaDoubtCategoryFilter.trim().toLowerCase();
                  return cityMatch && categoryMatch;
                });
                if (filteredSubmissions.length === 0) {
                  return <div style={{ ...s.card, color: '#888' }}>No doubt submissions yet.</div>;
                }
                return (
                  <div style={{ ...s.card, overflow: 'hidden', padding: 0 }}>
                    <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#fafafa' }}>
                          {['Doubt', 'Event', 'City', 'Reporting Date & Time', 'Contact'].map((heading) => (
                            <th key={heading} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #ececec', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#888', fontWeight: 700 }}>
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubmissions.map((submission, index) => {
                          const eventName = submission.event_title || submission.event || submission.event_name || '-';
                          const reportingDate = submission.reporting_date || '-';
                          const reportingTime = submission.reporting_time || '-';
                          const doubtText = submission.doubt || submission.message || '-';
                          const phoneDigits = (submission.phone ?? '').replace(/\D/g, '');
                          const contactMessage = `Hi, ${submission.name || 'there'}, we're contacting you from chapter அ regarding ${eventName} (${reportingDate}).`;
                          const contactHref = phoneDigits ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(contactMessage)}` : '';

                          return (
                            <tr key={submission.id ?? `${submission.phone ?? 'submission'}-${index}`} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td title={doubtText} style={{ width: '18%', padding: '10px 10px', fontSize: 13, color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {doubtText}
                              </td>
                              <td style={{ width: '24%', padding: '10px 10px', fontSize: 13, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eventName}</td>
                              <td style={{ width: '14%', padding: '10px 10px', fontSize: 13, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{submission.city || '-'}</td>
                              <td style={{ width: '24%', padding: '10px 10px', fontSize: 13, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {reportingDate === '-' && reportingTime === '-' ? '-' : `${reportingDate}${reportingTime !== '-' ? ` · ${reportingTime}` : ''}`}
                              </td>
                              <td style={{ width: '20%', padding: '10px 10px', whiteSpace: 'nowrap' }}>
                                {phoneDigits ? (
                                  <a
                                    href={contactHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ ...s.outlineBtn, display: 'inline-block', padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}
                                  >
                                    Contact
                                  </a>
                                ) : (
                                  <span style={{ fontSize: 12, color: '#aaa' }}>No Number</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </>
        )}

        {/* ── INVITES TAB ───────────────────────────────────────────────────── */}
        {!loading && tab === 'payments' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 20 }}>Payment Submissions</div>
              <button
                onClick={refreshSubmissions}
                disabled={refreshingSubmissions}
                title="Refresh submissions"
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fff', cursor: refreshingSubmissions ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, color: '#444', opacity: refreshingSubmissions ? 0.55 : 1, transition: 'opacity 0.15s' }}
              >
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ animation: refreshingSubmissions ? 'spin 0.8s linear infinite' : 'none' }}
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {refreshingSubmissions ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            <div style={{ color: '#777', fontSize: 13, marginBottom: 14 }}>
              Recorded when a user reaches the manual UPI payment screen — for both invite-only and open events.
            </div>
            {/* Event filter */}
            {invitePaymentRows.length > 0 && (() => {
              const uniqueEvents = [...new Set(invitePaymentRows.map(r => r.event_title || '').filter(Boolean))].sort();
              return (
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>Event</label>
                  <select
                    value={paymentsEventFilter}
                    onChange={e => setPaymentsEventFilter(e.target.value)}
                    style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', cursor: 'pointer', fontWeight: 500 }}
                  >
                    <option value="all">All Events</option>
                    {uniqueEvents.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                  </select>
                  {paymentsEventFilter !== 'all' && (
                    <button onClick={() => setPaymentsEventFilter('all')} style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear</button>
                  )}
                </div>
              );
            })()}
            {(() => {
              const filtered = paymentsEventFilter === 'all'
                ? invitePaymentRows
                : invitePaymentRows.filter(r => (r.event_title || '') === paymentsEventFilter);
              return filtered.length === 0 ? (
                <div style={{ ...s.card, color: '#888' }}>No payment submissions yet.</div>
              ) : (
              <div style={{ ...s.card, overflow: 'hidden', padding: 0 }}>
                <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                  <colgroup>
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '22%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '20%' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      {['Payment Time', 'Name', 'Phone', 'Event', 'Trip Date', 'Advance Paid'].map((heading) => (
                        <th key={heading} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #ececec', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#888', fontWeight: 700 }}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((submission, index) => {
                      const phoneDigits = (submission.phone ?? '').replace(/\D/g, '');
                      const eventName = submission.event_title || '-';
                      const isPaid = submission.status === 'advance_paid';
                      const toggleAdvancePaid = async () => {
                        const newStatus = isPaid ? 'pending' : 'advance_paid';
                        await supabase
                          .from('invite_payment_submissions')
                          .update({ status: newStatus })
                          .eq('id', submission.id!);
                        setInvitePaymentSubmissions(prev =>
                          prev.map(r => r.id === submission.id ? { ...r, status: newStatus } : r)
                        );
                        setLocalInvitePaymentSubmissions(prev =>
                          prev.map(r => r.id === submission.id ? { ...r, status: newStatus } : r)
                        );
                      };
                      return (
                        <tr key={submission.id ?? `${submission.phone ?? 'invite'}-${index}`} style={{ borderBottom: '1px solid #f0f0f0', background: isPaid ? '#f0fdf4' : 'white' }}>
                          <td style={{ padding: '10px 12px', fontSize: 13, lineHeight: 1.25, color: '#111', whiteSpace: 'normal', overflowWrap: 'break-word' }}>{formatAdminDateTime(submission.submitted_at)}</td>
                          <td style={{ padding: '10px 12px', fontSize: 13, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{submission.name || '-'}</td>
                          <td style={{ padding: '10px 12px', fontSize: 13, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{phoneDigits || '-'}</td>
                          <td title={eventName} style={{ padding: '10px 12px', fontSize: 13, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{eventName}</td>
                          <td style={{ padding: '10px 12px', fontSize: 13, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(() => { if (!submission.selected_date) return '-'; const d = new Date(submission.selected_date); return isNaN(d.getTime()) ? submission.selected_date : `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`; })()}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                onClick={toggleAdvancePaid}
                                style={{ padding: '4px 12px', borderRadius: 99, border: 'none', background: isPaid ? '#16a34a' : '#e5e7eb', color: isPaid ? '#fff' : '#555', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                              >
                                {isPaid ? '✓ Paid' : 'Pending'}
                              </button>
                              {submission.amount ? <span style={{ fontSize: 12, color: '#aaa' }}>{formatAdminINR(submission.amount)}</span> : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
            })()}
          </>
        )}

        {/* ── OTHER TAB ─────────────────────────────────────────────────────── */}
        {!loading && tab === 'other' && (
          <>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Plans for Other Cities</div>
            {trips.filter(t => (t.cities ?? []).includes('Other')).length === 0 && (
              <div style={{ ...s.card, color: '#777' }}>
                No trips are enabled for Other city users yet. Turn ON <strong>Show In "Other" City Feed</strong> in any trip to see it here.
              </div>
            )}
            {trips
              .filter(t => (t.cities ?? []).includes('Other'))
              .map(trip => {
                const isExpanded = otherEditingId === trip.id;
                return (
                  <div key={trip.id} style={{ ...s.card, opacity: trip.is_active ? 1 : 0.55 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: isExpanded ? 10 : 0 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{trip.title}</div>
                        <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>₹{trip.price_full?.toLocaleString('en-IN')} · {trip.timing}</div>
                      </div>
                      <button
                        style={isExpanded || saving === trip.id ? s.btn(saving === trip.id ? '#aaa' : '#111') : s.outlineBtn}
                        disabled={saving === trip.id}
                        onClick={async () => {
                          if (!trip.id) return;
                          if (!isExpanded) {
                            setOtherEditingId(trip.id);
                            return;
                          }
                          await saveTrip(trip);
                          setOtherEditingId(null);
                        }}
                      >
                        {saving === trip.id ? 'Saving…' : (isExpanded ? 'Save' : 'Edit')}
                      </button>
                      <div style={{ position: 'relative', minWidth: 118 }}>
                        <select
                          value={otherActionById[trip.id!] ?? ''}
                          onChange={async (e) => {
                            const action = e.target.value;
                            setOtherActionById(prev => ({ ...prev, [trip.id!]: action }));
                            await handleOtherAction(trip, action);
                            setOtherActionById(prev => ({ ...prev, [trip.id!]: '' }));
                          }}
                          style={{
                            ...s.input,
                            width: '100%',
                            padding: '8px 30px 8px 10px',
                            fontSize: 13,
                            fontWeight: 700,
                            borderRadius: 8,
                            color: '#16a34a',
                            appearance: 'none',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="" disabled>Live</option>
                          <option value="live">Live</option>
                          <option value="preview">Preview</option>
                          <option value="remove">Remove</option>
                        </select>
                        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#777', fontSize: 11, pointerEvents: 'none' }}>▾</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <OtherCityForm
                        trip={trip}
                        onChange={(next) => updateTripInList(trip.id!, () => next)}
                        onSave={() => saveTrip(trip)}
                        onCancel={() => setOtherEditingId(null)}
                        saving={saving === trip.id}
                        s={s}
                        hideFooterActions={true}
                      />
                    )}
                  </div>
                );
              })}
          </>
        )}

        {/* ── MESSAGES TAB ─────────────────────────────────────────────────── */}
        {!loading && tab === 'messages' && (
          <>
            <div style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>
              You can use dynamic variables like <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{city}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{category}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{title}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{reporting_date}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{meeting_spot}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{transport}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{reporting_time}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{name}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{phone}'}</code> and <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{doubt}'}</code>.
            </div>
            <CollapsibleSection title="Global Announcements" defaultOpen={true}>
              <div style={{ display: 'grid', gap: 8 }}>
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    style={s.input}
                    value={globalAnnouncementsFields[idx]}
                    onChange={e => setGlobalAnnouncementsFields(prev => {
                      const next: [string, string, string] = [...prev] as [string, string, string];
                      next[idx] = e.target.value;
                      return next;
                    })}
                    placeholder={[
                      'Chennai-based social club with 4000+ members',
                      'Weekend plans drop every week',
                      'Spots fill fast - book early to lock your seat',
                    ][idx]}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button style={s.btn(savingGeneralAnnouncements ? '#aaa' : '#111')} disabled={savingGeneralAnnouncements} onClick={saveGeneralAnnouncements}>
                  {savingGeneralAnnouncements ? 'Saving…' : 'Save Global Announcements'}
                </button>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Global Pre Selection Messages" defaultOpen={true}>
              {[
                { key: 'welcome', label: 'Select City', placeholder: "Welcome to chapter அ! 👋 Which city are you from buddy?" },
                { key: 'ask_category', label: 'Select Category', placeholder: "Awesome, {city}! What are you looking for today - events or trips?" },
                { key: 'select_event', label: 'Select Plan', placeholder: "Here are the upcoming {category} in {city}. Which one should I open for you?" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={s.label}>{label}</label>
                  <textarea
                    style={s.textarea}
                    value={globalMessageDrafts[key] ?? ''}
                    onChange={e => setGlobalMessageDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      style={s.btn(saving === `global:${key}` ? '#aaa' : '#111')}
                      disabled={saving === `global:${key}`}
                      onClick={() => saveGlobalStepTemplate(key)}
                    >
                      {saving === `global:${key}` ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </CollapsibleSection>

            <CollapsibleSection title="Other City Pre Selection Messages" defaultOpen={true}>
              {[
                { key: 'other_ask_category', label: 'Select Category (Other City)', placeholder: "Awesome! Which type of plan are you looking for from Other Cities - events or trips?" },
                { key: 'other_select_event', label: 'Select Plan (Other City)', placeholder: "Here are plans available for Other Cities in {category}. Which one should I open for you?" },
              ].map(({ key, label, placeholder }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={s.label}>{label}</label>
                  <textarea
                    style={s.textarea}
                    value={globalMessageDrafts[key] ?? ''}
                    onChange={e => setGlobalMessageDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      style={s.btn(saving === `global:${key}` ? '#aaa' : '#111')}
                      disabled={saving === `global:${key}`}
                      onClick={() => saveGlobalStepTemplate(key)}
                    >
                      {saving === `global:${key}` ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </CollapsibleSection>

            <CollapsibleSection title="Global Post Selection Messages" defaultOpen={true}>
              {[
                { key: 'ask_doubts_book', label: 'Book Now Flow', placeholder: "You're about to lock your spot for {title}. All clear or do you have any last-minute doubts?" },
                { key: 'ask_doubts_contact', label: 'Contact Us Flow', placeholder: "Got questions about {title}? Tap a common doubt below or ask your own question." },
              ].map(({ key, label, placeholder }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={s.label}>{label}</label>
                  <textarea
                    style={s.textarea}
                    value={globalMessageDrafts[key] ?? ''}
                    onChange={e => setGlobalMessageDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      style={s.btn(saving === `global:${key}` ? '#aaa' : '#111')}
                      disabled={saving === `global:${key}`}
                      onClick={() => saveGlobalStepTemplate(key)}
                    >
                      {saving === `global:${key}` ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}

              {/* Reply button labels */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                {[
                  { key: 'doubts_btn_yes', label: '"I have a doubt" Button', placeholder: 'Hold up, I have a question' },
                  { key: 'doubts_btn_no', label: '"All clear" Button', placeholder: "All clear, let's book! 🚀" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label style={s.label}>{label}</label>
                    <input
                      style={s.input}
                      value={globalMessageDrafts[key] ?? ''}
                      onChange={e => setGlobalMessageDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <button
                        style={s.btn(saving === `global:${key}` ? '#aaa' : '#111')}
                        disabled={saving === `global:${key}`}
                        onClick={() => saveGlobalStepTemplate(key)}
                      >
                        {saving === `global:${key}` ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {[
                { key: 'show_faq', label: 'Show FAQs (when user has a doubt)', placeholder: "No sweat! Here's what people usually ask. Tap one to see the answer, or let me know when you're ready to book." },
                { key: 'faq_followup', label: 'FAQ Follow Up (after 1st doubt answer)', placeholder: "Hope that helps. Want to ask another doubt or proceed to booking?" },
                { key: 'faq_followup_repeat', label: 'FAQ Follow Up (after 2nd, 3rd… doubt answers)', placeholder: "Anything else on your mind? 😊" },
                { key: 'contact_success', label: 'Contact Success (after form submit)', placeholder: "Got it, {name}! Our team will contact you shortly on {phone}." },
              ].map(({ key, label, placeholder }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={s.label}>{label}</label>
                  <textarea
                    style={s.textarea}
                    value={globalMessageDrafts[key] ?? ''}
                    onChange={e => setGlobalMessageDrafts(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                    <button
                      style={s.btn(saving === `global:${key}` ? '#aaa' : '#111')}
                      disabled={saving === `global:${key}`}
                      onClick={() => saveGlobalStepTemplate(key)}
                    >
                      {saving === `global:${key}` ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 6, paddingTop: 12, borderTop: '1px solid #ececec' }}>
              <label style={s.label}>Unique Doubt Button</label>
              <input
                style={s.input}
                value={doubtCtaLabel}
                onChange={e => setDoubtCtaLabel(e.target.value)}
                placeholder="Still have a different doubt?"
              />

              <label style={{ ...s.label, marginTop: 10 }}>Google Sheets Webhook URL</label>
              <input
                style={s.input}
                value={doubtFormWebhookUrl}
                onChange={e => setDoubtFormWebhookUrl(e.target.value)}
                placeholder="Paste Google Apps Script Web App URL (…/exec)"
              />
              <div style={{ color: '#888', fontSize: 12, marginTop: 6 }}>
                We send name, phone, doubt, city, category, title, reporting_date, meeting_spot, transport and reporting_time on form submit.
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button style={s.btn(savingDoubtSettings ? '#aaa' : '#111')} disabled={savingDoubtSettings} onClick={saveDoubtFormSettings}>
                  {savingDoubtSettings ? 'Saving…' : 'Save Doubt Settings'}
                </button>
              </div>
              </div>
            </CollapsibleSection>

          </>
        )}

        {/* ── ANALYTICS TAB ────────────────────────────────────────────────── */}
        {tab === 'analytics' && (() => {
          const windowMs = analyticsWindow === '24h' ? 24 * 60 * 60 * 1000 : analyticsWindow === 'week' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
          const windowLabel = analyticsWindow === '24h' ? 'Last 24 Hours' : analyticsWindow === 'week' ? 'Last Week' : 'Last Month';
          const filteredData = analyticsData.filter(r => Date.now() - new Date(r.created_at).getTime() < windowMs);
          const { visitors, cityCounts, cityTotal } = computeAnalytics(filteredData);
          const liveEvents = trips.filter(t => t.is_active && t.id);
          const liveEventCount = liveEvents.length;
          const liveCanonicalByTrackedId = new Map<string, string>();
          liveEvents.forEach((t) => {
            const canonicalId = t.id as string;
            liveCanonicalByTrackedId.set(canonicalId, canonicalId);
            if (t.slug) liveCanonicalByTrackedId.set(t.slug, canonicalId);
          });
          const liveIdsByTitle = new Map<string, string[]>();
          liveEvents.forEach((t) => {
            const titleKey = (t.title ?? '').trim().toLowerCase();
            if (!titleKey) return;
            if (!liveIdsByTitle.has(titleKey)) liveIdsByTitle.set(titleKey, []);
            liveIdsByTitle.get(titleKey)!.push(t.id as string);
          });
          const resolveLiveEventId = (row: any): string | null => {
            if (row?.event_id && liveCanonicalByTrackedId.has(row.event_id)) return liveCanonicalByTrackedId.get(row.event_id)!;
            const titleKey = (row?.event_title ?? '').trim().toLowerCase();
            if (!titleKey) return null;
            const matches = liveIdsByTitle.get(titleKey) ?? [];
            return matches.length > 0 ? matches[0] : null;
          };
          const collectPairs = (eventType: string) => {
            const keys = new Set<string>();
            filteredData.forEach((row: any) => {
              if (row?.event_type !== eventType || !row?.session_id) return;
              const liveId = resolveLiveEventId(row);
              if (!liveId) return;
              keys.add(`${row.session_id}::${liveId}`);
            });
            return keys;
          };
          const detailsKeysByLive = collectPairs('event_selected');
          const calendarKeysByLive = collectPairs('calendar_opened');
          const dateKeysByLive = collectPairs('date_selected');
          const reachedKeysByLive = collectPairs('reached_pricing');
          // Union old pricing_cta_clicked (historical) + new split events so
          // the overview card stays accurate across the migration boundary.
          const convertedKeysByLive = new Set<string>([
            ...collectPairs('pricing_cta_clicked'),
            ...collectPairs('book_cta_clicked'),
            ...collectPairs('contact_cta_clicked'),
          ]);
          const redirectedKeysByLive = collectPairs('external_redirect_initiated');
          const toCountMap = (keys: Set<string>) => {
            const map: Record<string, number> = {};
            keys.forEach((key) => {
              const id = key.split('::')[1];
              map[id] = (map[id] || 0) + 1;
            });
            return map;
          };
          const detailsByLiveId = toCountMap(detailsKeysByLive);
          const calendarByLiveId = toCountMap(calendarKeysByLive);
          const dateByLiveId = toCountMap(dateKeysByLive);
          const reachedByLiveId = toCountMap(reachedKeysByLive);
          const convertedByLiveId = toCountMap(convertedKeysByLive);
          const redirectedByLiveId = toCountMap(redirectedKeysByLive);
          const roundAvg = (nums: number[]) => nums.length > 0 ? Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length) : 0;
          const joinPlanRates = liveEvents.flatMap((t) => {
            const id = t.id as string;
            const details = detailsByLiveId[id] || 0;
            if (details <= 0) return [];
            const opened = calendarByLiveId[id] || 0;
            return [(opened / details) * 100];
          });
          const datePickRates = liveEvents.flatMap((t) => {
            const id = t.id as string;
            const opened = calendarByLiveId[id] || 0;
            if (opened <= 0) return [];
            const picked = dateByLiveId[id] || 0;
            return [(picked / opened) * 100];
          });
          const pricingConvRates = liveEvents.flatMap((t) => {
            const id = t.id as string;
            const reached = reachedByLiveId[id] || 0;
            if (reached <= 0) return [];
            const converted = convertedByLiveId[id] || 0;
            return [(converted / reached) * 100];
          });
          const handoffRates = liveEvents.flatMap((t) => {
            const id = t.id as string;
            const reached = reachedByLiveId[id] || 0;
            if (reached <= 0) return [];
            const redirected = redirectedByLiveId[id] || 0;
            return [(redirected / reached) * 100];
          });
          // Unweighted averages across per-event rates — fallback is 0, not a
          // weighted total, so the cards honestly reflect "no data yet" instead
          // of showing a misleading aggregate.
          const avgJoinPlanPct = roundAvg(joinPlanRates);
          const avgDatePickPct = roundAvg(datePickRates);
          const avgPricingConvPct = roundAvg(pricingConvRates);
          const avgHandoffPct = roundAvg(handoffRates);
          const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);
          const tripById = new Map<string, Trip>();
          trips.forEach((t) => {
            if (t.id) tripById.set(t.id as string, t);
            if (t.slug) tripById.set(t.slug, t);
          });
          const eventLabelById = (eventId: string, fallbackTitle?: string) => {
            const trip = tripById.get(eventId);
            const title = trip?.title ?? fallbackTitle ?? 'Unknown Plan';
            const cities = trip?.cities ?? [];
            const primaryCity = cities.find(c => (c ?? '').trim().toLowerCase() !== 'other') ?? cities[0] ?? 'Unknown City';
            return `${title} (${primaryCity})`;
          };
          const eventSelectedRows = filteredData.filter((r: any) => r.event_type === 'event_selected' && r.event_id);
          const eventCountsById: Record<string, number> = {};
          eventSelectedRows.forEach((r: any) => {
            const id = r.event_id as string;
            eventCountsById[id] = (eventCountsById[id] || 0) + 1;
          });
          const sortedEvents = Object.entries(eventCountsById).sort((a, b) => b[1] - a[1]);
          const eventTotal = eventSelectedRows.length || 1;

          const buildEventMetricMap = (eventType: string) => {
            const keys = new Set<string>();
            filteredData.forEach((row: any) => {
              if (row?.event_type !== eventType || !row?.session_id) return;
              // Use the same ID normalization as the overview cards so that
              // slug changes / title changes don't create phantom split rows
              // (e.g. "2 of 0 who landed on details" impossible state).
              const liveId = resolveLiveEventId(row);
              if (!liveId) return;
              keys.add(`${row.session_id}::${liveId}`);
            });
            const map: Record<string, number> = {};
            keys.forEach((key) => {
              const eventId = key.split('::')[1];
              map[eventId] = (map[eventId] || 0) + 1;
            });
            return map;
          };
          const detailsOpenedByEvent = buildEventMetricMap('event_selected');
          const calendarOpenedByEvent = buildEventMetricMap('calendar_opened');
          const datePickedByEvent = buildEventMetricMap('date_selected');
          const reachedByEvent = buildEventMetricMap('reached_pricing');
          // Split CTA tracking: Contact Us vs Join Our Plan (book).
          // Also keep legacy pricing_cta_clicked so historical rows still count.
          const bookCtaByEvent = buildEventMetricMap('book_cta_clicked');
          const contactCtaByEvent = buildEventMetricMap('contact_cta_clicked');
          const legacyCtaByEvent = buildEventMetricMap('pricing_cta_clicked');
          // Combined for Payment Handoff denominator parity
          const convertedByEvent = (() => {
            const allIds = new Set([...Object.keys(bookCtaByEvent), ...Object.keys(contactCtaByEvent), ...Object.keys(legacyCtaByEvent)]);
            const map: Record<string, number> = {};
            allIds.forEach(id => {
              map[id] = (bookCtaByEvent[id] || 0) + (contactCtaByEvent[id] || 0) + (legacyCtaByEvent[id] || 0);
            });
            return map;
          })();
          const redirectedByEvent = buildEventMetricMap('external_redirect_initiated');

          const allJoinPlanEvents = Array.from(new Set([...Object.keys(detailsOpenedByEvent), ...Object.keys(calendarOpenedByEvent)]));
          const allCalendarEvents = Array.from(new Set([...Object.keys(calendarOpenedByEvent), ...Object.keys(datePickedByEvent)]));
          const allDropoffEvents = Array.from(new Set([...Object.keys(reachedByEvent), ...Object.keys(convertedByEvent)]));
          const allHandoffEvents = Array.from(new Set([...Object.keys(reachedByEvent), ...Object.keys(redirectedByEvent)]));
          const allFunnelEventOptions = Array.from(
            new Set([...allJoinPlanEvents, ...allCalendarEvents, ...allDropoffEvents, ...allHandoffEvents])
          ).sort((a, b) => eventLabelById(a).localeCompare(eventLabelById(b)));
          const filterFunnelEvents = (eventIds: string[]) =>
            analyticsFunnelEventFilter === 'all'
              ? eventIds
              : eventIds.filter(eventId => eventId === analyticsFunnelEventFilter);
          const visibleJoinPlanEvents = filterFunnelEvents(allJoinPlanEvents);
          const visibleCalendarEvents = filterFunnelEvents(allCalendarEvents);
          const visibleDropoffEvents = filterFunnelEvents(allDropoffEvents);
          const visibleHandoffEvents = filterFunnelEvents(allHandoffEvents);

          const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
            <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 12, color: '#999', fontWeight: 600, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#111', lineHeight: 1 }}>{value}</div>
              {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{sub}</div>}
            </div>
          );

          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 20, flex: 1 }}>Analytics</div>
                <div style={{ position: 'relative' }}>
                  <select
                    value={analyticsWindow}
                    onChange={e => setAnalyticsWindow(e.target.value as any)}
                    style={{ ...s.input, fontSize: 13, fontWeight: 600, padding: '7px 32px 7px 12px', borderRadius: 999, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', minWidth: 130 }}
                  >
                    <option value="24h">Last 24 Hours</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </select>
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#777', pointerEvents: 'none' }}>▾</span>
                </div>
                <button
                  style={{ ...s.btn('#111'), fontSize: 12, padding: '6px 16px' }}
                  onClick={loadAnalytics}
                  disabled={analyticsLoading}
                >
                  {analyticsLoading ? 'Loading…' : '↻ Refresh'}
                </button>
              </div>

              {analyticsLoading && <div style={{ color: '#aaa', fontSize: 14 }}>Fetching data…</div>}

              {!analyticsLoading && (
                <>
                  {/* Visitors */}
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Visitors</div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                    <StatCard label={windowLabel} value={visitors} sub="unique sessions" />
                    <StatCard label="Join Plan Rate" value={`${avgJoinPlanPct}%`} sub={joinPlanRates.length > 0 ? `avg across ${joinPlanRates.length} live events with data` : 'clicked Join Our Plan on the details page'} />
                    <StatCard label="Date Pick Rate" value={`${avgDatePickPct}%`} sub={datePickRates.length > 0 ? `avg across ${datePickRates.length} live events with data` : 'picked a date after opening calendar'} />
                    <StatCard label="Pricing Conversion" value={`${avgPricingConvPct}%`} sub={pricingConvRates.length > 0 ? `avg across ${pricingConvRates.length} live events with data` : 'continued booking after seeing price'} />
                    <StatCard label="Payment Handoff" value={`${avgHandoffPct}%`} sub={handoffRates.length > 0 ? `avg across ${handoffRates.length} live events with data` : 'reached external payment / waitlist'} />
                  </div>

                  {/* City */}
                  {/* Shared pie chart renderer */}
                  {(() => {
                    const PASTEL = ['#FDE68A','#BFDBFE','#BBF7D0','#FBCFE8','#DDD6FE','#FED7AA','#99F6E4','#F9A8D4'];
                    const PieChart = ({ entries, total }: { entries: [string, number][]; total: number }) => {
                      if (entries.length === 0) return <div style={{ color: '#bbb', fontSize: 13 }}>No data yet</div>;
                      const R = 72, CX = 82, CY = 82;
                      let cum = -Math.PI / 2;
                      const slices = entries.map(([label, count], idx) => {
                        const angle = (count / (total || 1)) * 2 * Math.PI;
                        const x1 = CX + R * Math.cos(cum);
                        const y1 = CY + R * Math.sin(cum);
                        cum += angle;
                        const x2 = CX + R * Math.cos(cum);
                        const y2 = CY + R * Math.sin(cum);
                        const d = `M${CX},${CY} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
                        return { label, count, d, color: PASTEL[idx % PASTEL.length] };
                      });
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                          <svg width={164} height={164}>
                            {slices.length === 1
                              ? <circle cx={CX} cy={CY} r={R} fill={slices[0].color} />
                              : slices.map((sl, i) => <path key={i} d={sl.d} fill={sl.color} stroke="#fff" strokeWidth={2.5} />)
                            }
                          </svg>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', justifyContent: 'center' }}>
                            {slices.map((sl, i) => {
                              const pct = Math.round((sl.count / (total || 1)) * 100);
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 10, height: 10, borderRadius: 3, background: sl.color, border: '1px solid #ddd', flexShrink: 0 }} />
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{sl.label}</span>
                                  <span style={{ fontSize: 12, color: '#999' }}>{pct}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Chosen City</div>
                        <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '24px 20px', marginBottom: 20 }}>
                          <PieChart entries={sortedCities} total={cityTotal} />
                        </div>
                      </>
                    );
                  })()}

                  {/* Event */}
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Chosen Plan</div>
                  <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '24px 20px', marginBottom: 20 }}>
                    {(() => {
                      const PASTEL = ['#FDE68A','#BFDBFE','#BBF7D0','#FBCFE8','#DDD6FE','#FED7AA','#99F6E4','#F9A8D4'];
                      if (sortedEvents.length === 0) return <div style={{ color: '#bbb', fontSize: 13 }}>No data yet</div>;
                      const R = 72, CX = 82, CY = 82;
                      let cum = -Math.PI / 2;
                      const slices = sortedEvents.map(([eventId, count], idx) => {
                        const angle = (count / (eventTotal || 1)) * 2 * Math.PI;
                        const x1 = CX + R * Math.cos(cum);
                        const y1 = CY + R * Math.sin(cum);
                        cum += angle;
                        const x2 = CX + R * Math.cos(cum);
                        const y2 = CY + R * Math.sin(cum);
                        const d = `M${CX},${CY} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${angle > Math.PI ? 1 : 0} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z`;
                        return { label: eventLabelById(eventId), count, d, color: PASTEL[idx % PASTEL.length] };
                      });
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                          <svg width={164} height={164}>
                            {slices.length === 1
                              ? <circle cx={CX} cy={CY} r={R} fill={slices[0].color} />
                              : slices.map((sl, i) => <path key={i} d={sl.d} fill={sl.color} stroke="#fff" strokeWidth={2.5} />)
                            }
                          </svg>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', justifyContent: 'center' }}>
                            {slices.map((sl, i) => {
                              const pct = Math.round((sl.count / (eventTotal || 1)) * 100);
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 10, height: 10, borderRadius: 3, background: sl.color, border: '1px solid #ddd', flexShrink: 0 }} />
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{sl.label}</span>
                                  <span style={{ fontSize: 12, color: '#999' }}>{pct}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Join Plan Rate — landed on details vs clicked Join Our Plan */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                    <div style={{ position: 'relative', minWidth: 220 }}>
                      <select
                        value={analyticsFunnelEventFilter}
                        onChange={e => setAnalyticsFunnelEventFilter(e.target.value)}
                        style={{ ...s.input, fontSize: 13, fontWeight: 600, padding: '7px 32px 7px 12px', borderRadius: 999, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', width: '100%' }}
                      >
                        <option value="all">All Events</option>
                        {allFunnelEventOptions.map((eventId) => (
                          <option key={eventId} value={eventId}>{eventLabelById(eventId)}</option>
                        ))}
                      </select>
                      <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#777', pointerEvents: 'none' }}>▾</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Join Plan Rate</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: -6, marginBottom: 10 }}>
                    Of users who landed on the event details page, how many clicked Join Our Plan. A low rate may mean the details page isn't selling — consider improving copy, photos or reviews.
                  </div>
                  <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                    {visibleJoinPlanEvents.length === 0 && <div style={{ color: '#bbb', fontSize: 13 }}>No data yet</div>}
                    {visibleJoinPlanEvents.map((eventId, idx) => {
                      const viewed = detailsOpenedByEvent[eventId] || 0;
                      const opened = calendarOpenedByEvent[eventId] || 0;
                      const dropped = Math.max(viewed - opened, 0);
                      const pct = viewed > 0 ? Math.round((opened / viewed) * 100) : 0;
                      return (
                        <div key={eventId} style={{ marginBottom: idx < visibleJoinPlanEvents.length - 1 ? 14 : 0, paddingBottom: idx < visibleJoinPlanEvents.length - 1 ? 14 : 0, borderBottom: idx < visibleJoinPlanEvents.length - 1 ? '1px solid #f0f0ea' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{eventLabelById(eventId)}</span>
                            <span style={{ fontSize: 20, fontWeight: 800, color: pct >= 50 ? '#4ade80' : pct >= 25 ? '#fcd34d' : '#fca5a5' }}>
                              {pct}%
                            </span>
                          </div>
                          <div style={{ height: 7, background: '#f0f0ea', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 50 ? '#bbf7d0' : pct >= 25 ? '#fde68a' : '#fecaca', borderRadius: 99, transition: 'width 0.4s' }} />
                          </div>
                          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
                            {opened} of {viewed} who landed on details clicked Join Our Plan
                            {dropped > 0 && viewed > 0 && (
                              <span style={{ marginLeft: 4, color: '#d4b483' }}>· {dropped} left without clicking</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar Drop-off — opened calendar vs picked a date */}
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Date Pick Rate</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: -6, marginBottom: 10 }}>
                    Of users who opened the calendar, how many picked a date. A low rate may mean the available dates don't suit users — consider adding more.
                  </div>
                  <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                    {visibleCalendarEvents.length === 0 && <div style={{ color: '#bbb', fontSize: 13 }}>No data yet</div>}
                    {visibleCalendarEvents.map((eventId, idx) => {
                      const opened = calendarOpenedByEvent[eventId] || 0;
                      const picked = datePickedByEvent[eventId] || 0;
                      const dropped = Math.max(opened - picked, 0);
                      const pct = opened > 0 ? Math.round((picked / opened) * 100) : 0;
                      return (
                        <div key={eventId} style={{ marginBottom: idx < visibleCalendarEvents.length - 1 ? 14 : 0, paddingBottom: idx < visibleCalendarEvents.length - 1 ? 14 : 0, borderBottom: idx < visibleCalendarEvents.length - 1 ? '1px solid #f0f0ea' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{eventLabelById(eventId)}</span>
                            <span style={{ fontSize: 20, fontWeight: 800, color: pct >= 50 ? '#4ade80' : pct >= 25 ? '#fcd34d' : '#fca5a5' }}>
                              {pct}%
                            </span>
                          </div>
                          <div style={{ height: 7, background: '#f0f0ea', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 50 ? '#bbf7d0' : pct >= 25 ? '#fde68a' : '#fecaca', borderRadius: 99, transition: 'width 0.4s' }} />
                          </div>
                          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
                            {picked} of {opened} who opened the calendar picked a date
                            {dropped > 0 && opened > 0 && (
                              <span style={{ marginLeft: 4, color: '#d4b483' }}>· {dropped} closed without picking</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Drop-off */}
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Pricing Conversion Rate</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: -6, marginBottom: 10 }}>
                    Of users who reached the pricing screen, how many tapped a CTA — split by <strong>Book Now</strong> (ready to pay) vs <strong>Contact Us</strong> (needs more info).
                  </div>
                  <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                    {visibleDropoffEvents.length === 0 && <div style={{ color: '#bbb', fontSize: 13 }}>No data yet</div>}
                    {visibleDropoffEvents.map((eventId, idx) => {
                      const reached = reachedByEvent[eventId] || 0;
                      const booked = (bookCtaByEvent[eventId] || 0) + (legacyCtaByEvent[eventId] || 0);
                      const contacted = contactCtaByEvent[eventId] || 0;
                      const totalCta = booked + contacted;
                      const pct = reached > 0 ? Math.round((totalCta / reached) * 100) : 0;
                      const bookPct = reached > 0 ? Math.round((booked / reached) * 100) : 0;
                      const contactPct = reached > 0 ? Math.round((contacted / reached) * 100) : 0;
                      return (
                        <div key={eventId} style={{ marginBottom: idx < visibleDropoffEvents.length - 1 ? 14 : 0, paddingBottom: idx < visibleDropoffEvents.length - 1 ? 14 : 0, borderBottom: idx < visibleDropoffEvents.length - 1 ? '1px solid #f0f0ea' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{eventLabelById(eventId)}</span>
                            <span style={{ fontSize: 20, fontWeight: 800, color: pct >= 50 ? '#4ade80' : pct >= 25 ? '#fcd34d' : '#fca5a5' }}>
                              {pct}%
                            </span>
                          </div>
                          <div style={{ height: 7, background: '#f0f0ea', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 50 ? '#bbf7d0' : pct >= 25 ? '#fde68a' : '#fecaca', borderRadius: 99, transition: 'width 0.4s' }} />
                          </div>
                          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#aaa', flexWrap: 'wrap' }}>
                            <span>✅ <strong style={{ color: '#111' }}>{booked}</strong> tapped Book Now ({bookPct}%)</span>
                            <span>💬 <strong style={{ color: '#111' }}>{contacted}</strong> tapped Contact Us ({contactPct}%)</span>
                            {reached - totalCta > 0 && (
                              <span style={{ color: '#d4b483' }}>· {reached - totalCta} saw the price but tapped nothing</span>
                            )}
                            <span style={{ marginLeft: 'auto', color: '#ccc' }}>{reached} saw the price</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment Handoff — % of users who saw price AND got redirected to external payment/waitlist */}
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Payment Handoff Rate</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: -6, marginBottom: 10 }}>
                    Of users who reached the pricing screen, how many were actually redirected to BillDesk or the waitlist link (i.e. physically left our site to pay). The gap vs Pricing Conversion = people who tapped the CTA but didn't complete the redirect.
                  </div>
                  <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                    {visibleHandoffEvents.length === 0 && <div style={{ color: '#bbb', fontSize: 13 }}>No data yet</div>}
                    {visibleHandoffEvents.map((eventId, idx) => {
                      const reached = reachedByEvent[eventId] || 0;
                      const redirected = redirectedByEvent[eventId] || 0;
                      const ctaTapped = convertedByEvent[eventId] || 0;
                      const pct = reached > 0 ? Math.round((redirected / reached) * 100) : 0;
                      return (
                        <div key={eventId} style={{ marginBottom: idx < visibleHandoffEvents.length - 1 ? 14 : 0, paddingBottom: idx < visibleHandoffEvents.length - 1 ? 14 : 0, borderBottom: idx < visibleHandoffEvents.length - 1 ? '1px solid #f0f0ea' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{eventLabelById(eventId)}</span>
                            <span style={{ fontSize: 20, fontWeight: 800, color: pct >= 50 ? '#4ade80' : pct >= 25 ? '#fcd34d' : '#fca5a5' }}>
                              {pct}%
                            </span>
                          </div>
                          <div style={{ height: 7, background: '#f0f0ea', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 50 ? '#bbf7d0' : pct >= 25 ? '#fde68a' : '#fecaca', borderRadius: 99, transition: 'width 0.4s' }} />
                          </div>
                          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
                            {redirected} of {reached} who reached pricing were redirected to BillDesk / waitlist
                            {ctaTapped > redirected && (
                              <span style={{ marginLeft: 4, color: '#d4b483' }}>· {ctaTapped - redirected} tapped CTA but didn't complete redirect</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })()}

      </div>
    </div>
  );
}

// ─── TRIP FORM ────────────────────────────────────────────────────────────────
function TripForm({ trip, onChange, onSave, onCancel, saving, s }: {
  trip: Trip; onChange: (t: Trip) => void; onSave: () => void; onCancel: () => void; saving: boolean; s: any;
}) {
  const set = (key: keyof Trip, val: any) => onChange({ ...trip, [key]: val });
  const [newCityInput, setNewCityInput] = React.useState('');
  const heroImages = React.useMemo(() => {
    const parsed = parseHeroImages(trip.hero_image);
    return [0, 1, 2, 3].map(i => parsed[i] ?? '');
  }, [trip.hero_image]);
  const setHeroImage = (index: number, value: string) => {
    const next = [...heroImages];
    next[index] = value;
    set('hero_image', serializeHeroImages(next));
  };
  const dates = trip.event_dates ?? [];
  const pickups = trip.pickup_points ?? [];
  const quickInfo = trip.quick_info ?? [];
  const girlsOnlyQuickInfoLabels = ['girls only event', "girl's only event", 'girls_only_event'];
  const isGirlsOnlyQuickInfo = (item: { label?: string }) =>
    girlsOnlyQuickInfoLabels.includes(String(item.label ?? '').trim().toLowerCase());
  const getPlanValue = (labels: string[]) => quickInfo.find(item => labels.includes(item.label))?.value ?? '';
  const isGirlsOnlyEvent = quickInfo.some(item =>
    isGirlsOnlyQuickInfo(item) &&
    String(item.value).toLowerCase() !== 'false'
  );
  const setPlanValue = (removeLabels: string[], saveLabel: string, value: string, icon: string) => {
    const next = quickInfo.filter(item => !removeLabels.includes(item.label));
    const trimmed = value.trim();
    onChange({
      ...trip,
      quick_info: trimmed ? [...next, { icon, label: saveLabel, value: trimmed }] : next,
    });
  };
  const setGirlsOnlyEvent = (enabled: boolean) => {
    const next = quickInfo.filter(item => !isGirlsOnlyQuickInfo(item));
    onChange({
      ...trip,
      quick_info: enabled ? [...next, { icon: 'heart', label: 'Girls Only Event', value: 'true' }] : next,
    });
  };
  const meetingSpotValue = getPlanValue(['Meeting Spot']);
  const transportValue = getPlanValue(['Transport']);
  const youllMeetValue = getPlanValue(["You'll Meet", 'Made For']);
  const gangSizeValue = getPlanValue(['Group Size']);
  const gangSizeNumber = (gangSizeValue.match(/\d+/)?.[0] ?? '');
  const calendarCtaValue = getPlanValue(['Calendar CTA']) || trip.cta_label || '';
  const secretOfferPhoneValue = getPlanValue(['Secret Offer Number', 'Secret Offer Phone', 'Secret Offer WhatsApp']);
  const secretOfferMessageValue = getPlanValue(['Secret Offer Message']);
  const acc = trip.accommodation ?? {};
  const legacyStay: AccommodationStay = {
    name: acc.name ?? '',
    images: [0, 1, 2].map(i => acc.images?.[i] ?? ''),
    features: [0, 1, 2].map(i => acc.features?.[i] ?? ''),
  };
  const stays: AccommodationStay[] = (acc.stays && acc.stays.length > 0) ? acc.stays : [legacyStay];
  const setStays = (next: AccommodationStay[]) => onChange({ ...trip, accommodation: { ...acc, stays: next } });
  const updateStay = (index: number, patch: Partial<AccommodationStay>) => {
    setStays(stays.map((s, i) => i === index ? { ...s, ...patch } : s));
  };
  const updateStayFeature = (stayIndex: number, featureIndex: number, value: string) => {
    const stay = stays[stayIndex] ?? { name: '', image: '', features: ['', '', ''] };
    const features = [0, 1, 2].map(i => stay.features?.[i] ?? '');
    features[featureIndex] = value;
    updateStay(stayIndex, { features });
  };
  const updateStayImage = (stayIndex: number, imageIndex: number, value: string) => {
    const stay = stays[stayIndex] ?? { name: '', images: ['', '', ''], features: ['', '', ''] };
    const images = [0, 1, 2].map(i => stay.images?.[i] ?? (i === 0 ? (stay.image ?? '') : ''));
    images[imageIndex] = value;
    updateStay(stayIndex, { images, image: images[0] || '' });
  };
  const addStay = () => setStays([...stays, { name: '', images: ['', '', ''], features: ['', '', ''] }]);
  const removeStay = (index: number) => setStays(stays.filter((_, i) => i !== index));

  // ── Booking Steps ──
  // Index 0 = the "Now" row (always green Now tag, no date)
  // Index 1+ = middle steps with deadline date pickers
  const bookingSteps = trip.booking_steps?.length ? trip.booking_steps : [
    { label: 'Advance', value: '{advance}', date: '' },
    { label: 'Remaining Balance', value: '{balance}', date: '' },
    { label: 'Receive', value: 'Pickup, stay & trip details', date: '' },
  ];
  const setBookingStep = (i: number, patch: Partial<{ label: string; value: string; date: string }>) =>
    onChange({ ...trip, booking_steps: bookingSteps.map((s, idx) => idx === i ? { ...s, ...patch } : s) });
  const addBookingStep = () => onChange({ ...trip, booking_steps: [...bookingSteps, { label: '', value: '', date: '' }] });
  const removeBookingStep = (i: number) => onChange({ ...trip, booking_steps: bookingSteps.filter((_, idx) => idx !== i) });

  const setPickup = (i: number, key: keyof PickupPoint, val: any) => {
    const updated = pickups.map((p, idx) => idx === i ? { ...p, [key]: val } : p);
    onChange({ ...trip, pickup_points: updated });
  };
  const addPickup = () => onChange({ ...trip, pickup_points: [...pickups, { id: `pt_${Date.now()}`, label: '', meetingSpot: '', time: '', transport: '', forOtherCity: false }] });
  const removePickup = (i: number) => onChange({ ...trip, pickup_points: pickups.filter((_, idx) => idx !== i) });
  const ownTransportIndex = pickups.findIndex(p => p.id === 'own_transport');
  const ownTransport = ownTransportIndex >= 0 ? pickups[ownTransportIndex] : null;
  // Only show Pondy-specific points (forOtherCity: false) or legacy untagged points (undefined)
  const regularPickups = pickups.map((p, idx) => ({ ...p, _idx: idx })).filter(p => p.id !== 'own_transport' && p.forOtherCity !== true);
  const toggleOwnTransport = (enabled: boolean) => {
    if (enabled) {
      if (ownTransportIndex >= 0) return;
      onChange({ ...trip, pickup_points: [...pickups, { id: 'own_transport', label: 'Own Transport', meetingSpot: 'Event Location', time: '', transport: 'Your Own Transport', ownTransportPrice: trip.price_full || 0, ownOnly: false }] });
      return;
    }
    onChange({ ...trip, pickup_points: pickups.filter(p => p.id !== 'own_transport') });
  };
  const setOwnTransport = (patch: Partial<PickupPoint>) => {
    if (ownTransportIndex < 0) return;
    onChange({ ...trip, pickup_points: pickups.map((p, idx) => idx === ownTransportIndex ? { ...p, ...patch } : p) });
  };

  const setDate = (i: number, key: keyof TripDate, val: string) => {
    onChange({ ...trip, event_dates: dates.map((d, idx) => idx === i ? { ...d, [key]: val } : d) });
  };
  const addDate = () => onChange({ ...trip, event_dates: [...dates, { start_date: '', status: 'available', label: '' }] });
  const removeDate = (i: number) => onChange({ ...trip, event_dates: dates.filter((_, idx) => idx !== i) });

  const updateStringListItem = (key: 'included' | 'optional_activities' | 'not_included', index: number, value: string) => {
    const current = [...(trip[key] ?? [])]; current[index] = value; onChange({ ...trip, [key]: current });
  };
  const addStringListItem = (key: 'included' | 'optional_activities' | 'not_included') => {
    onChange({ ...trip, [key]: [...(trip[key] ?? []), ''] });
  };
  const removeStringListItem = (key: 'included' | 'optional_activities' | 'not_included', index: number) => {
    onChange({ ...trip, [key]: (trip[key] ?? []).filter((_: any, i: number) => i !== index) });
  };

  const itinerary = trip.itinerary ?? [];
  const updateItineraryDay = (index: number, patch: Partial<ItineraryDay>) => {
    onChange({ ...trip, itinerary: itinerary.map((d, i) => i === index ? { ...d, ...patch } : d) });
  };
  const addItineraryDay = () => {
    onChange({ ...trip, itinerary: [...itinerary, { day: `Day ${itinerary.length + 1}`, title: '', description: '', schedule: [] }] });
  };
  const removeItineraryDay = (index: number) => onChange({ ...trip, itinerary: itinerary.filter((_, i) => i !== index) });
  const updateScheduleItem = (dayIndex: number, itemIndex: number, patch: Partial<ItineraryScheduleItem>) => {
    const day = itinerary[dayIndex] ?? { day: '', title: '', description: '', schedule: [] };
    updateItineraryDay(dayIndex, { schedule: (day.schedule ?? []).map((item, i) => i === itemIndex ? { ...item, ...patch } : item) });
  };
  const addScheduleItem = (dayIndex: number) => {
    const day = itinerary[dayIndex] ?? { day: '', title: '', description: '', schedule: [] };
    updateItineraryDay(dayIndex, { schedule: [...(day.schedule ?? []), { time: '', activity: '' }] });
  };
  const removeScheduleItem = (dayIndex: number, itemIndex: number) => {
    const day = itinerary[dayIndex] ?? { day: '', title: '', description: '', schedule: [] };
    updateItineraryDay(dayIndex, { schedule: (day.schedule ?? []).filter((_, i) => i !== itemIndex) });
  };

  const field = (label: string, key: keyof Trip, type = 'text') => (
    <div style={{ marginBottom: 14 }}>
      <label style={s.label}>{label}</label>
      <input type={type} style={s.input} value={(trip[key] as string) ?? ''} onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)} />
    </div>
  );
  const showInOther = (trip.cities ?? []).includes('Other');
  const toggleShowInOther = () => {
    const current = trip.cities ?? [];
    set('cities', showInOther ? current.filter(c => c !== 'Other') : Array.from(new Set([...current, 'Other'])));
  };

  return (
    <div>
      {/* ── ESSENTIALS ── */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Essentials</div>

      <CollapsibleSection title="Basic Info">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1/-1' }}>{field('Title (internal, e.g. Sunrise at Kovalam)', 'title')}</div>
          <div style={{ gridColumn: '1/-1' }}>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>One-liner <span style={{ fontWeight: 400, color: '#aaa' }}>(shown to users in chat, e.g. "Catch a sunrise at Kovalam")</span></label>
              <input
                style={s.input}
                placeholder="e.g. Catch a sunrise at Kovalam"
                value={trip.one_liner ?? ''}
                onChange={e => set('one_liner', e.target.value)}
              />
            </div>
          </div>
          {trip.invite_only && (
            <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
              <label style={s.label}>Shared Invite Link</label>
              <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#4c1d95', fontFamily: 'monospace' }}>
                chaptera.in/invite
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#7c3aed', lineHeight: 1.45 }}>
                Guests enter their phone number here; we route them to this event if their number is saved under this event's invite slug.
              </div>
            </div>
          )}
          {field('Duration (e.g. 1 Night 2 Days)', 'timing')}
          {field('Category', 'category')}
          {field('Full Price (₹)', 'price_full', 'number')}
          {field('Advance Amount (₹)', 'price_advance', 'number')}
          {/* Booking URL */}
          <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
            <label style={s.label}>Booking Type</label>
            <div style={{ display: 'flex', gap: 0, marginBottom: 10, border: '1.5px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
              {([
                { mode: 'external', label: 'External Link', value: '' },
                { mode: 'upi-manual', label: 'Manual UPI (QR Code)', value: 'upi-manual' },
                { mode: 'billdesk-mock', label: 'Mock BillDesk', value: '/phonepe-mock' },
              ] as const).map(option => {
                const active = option.mode === 'external'
                  ? trip.booking_url !== 'upi-manual' && trip.booking_url !== '/phonepe-mock'
                  : trip.booking_url === option.value;
                return (
                  <button
                    key={option.mode}
                    type="button"
                    onClick={() => set('booking_url', option.value)}
                    style={{ flex: 1, padding: '9px 14px', border: 'none', background: active ? '#111' : '#fafafa', color: active ? '#fff' : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {trip.booking_url !== 'upi-manual' && trip.booking_url !== '/phonepe-mock' && (
              <input
                style={s.input}
                placeholder="https://tally.so/r/..."
                value={trip.booking_url}
                onChange={e => set('booking_url', e.target.value)}
              />
            )}
          </div>

          {/* Cities */}
          <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
            <label style={s.label}>Visible In Cities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {/* Preset cities */}
              {['Chennai'].map(city => {
                const active = (trip.cities ?? []).includes(city);
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      const current = trip.cities ?? [];
                      set('cities', active ? current.filter(c => c !== city) : Array.from(new Set([...current, city])));
                    }}
                    style={{ padding: '5px 14px', borderRadius: 99, border: `1.5px solid ${active ? '#6366f1' : '#ddd'}`, background: active ? '#6366f1' : '#fff', color: active ? '#fff' : '#555', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                  >
                    {city}
                  </button>
                );
              })}
              {/* Custom cities (removable) */}
              {(trip.cities ?? []).filter(c => !['Chennai', 'Pondy', 'Bangalore', 'Other'].includes(c)).map(city => (
                <span
                  key={city}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px 5px 14px', borderRadius: 99, border: '1.5px solid #6366f1', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: 13 }}
                >
                  {city}
                  <button
                    type="button"
                    onClick={() => set('cities', (trip.cities ?? []).filter(c => c !== city))}
                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0, opacity: 0.75 }}
                  >×</button>
                </span>
              ))}
            </div>
            {/* Add custom city */}
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                style={{ ...s.input, marginBottom: 0, flex: 1 }}
                placeholder="Add a city (e.g. Hyderabad)"
                value={newCityInput}
                onChange={e => setNewCityInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newCityInput.trim()) {
                    e.preventDefault();
                    const name = newCityInput.trim();
                    set('cities', Array.from(new Set([...(trip.cities ?? []), name])));
                    setNewCityInput('');
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const name = newCityInput.trim();
                  if (!name) return;
                  set('cities', Array.from(new Set([...(trip.cities ?? []), name])));
                  setNewCityInput('');
                }}
                style={{ padding: '0 16px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                + Add
              </button>
            </div>
          </div>

          {/* Galcode event flag */}
          <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
            <label style={s.label}>Galcode Event</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => setGirlsOnlyEvent(!isGirlsOnlyEvent)}
                style={{
                  padding: '5px 16px',
                  borderRadius: 99,
                  border: 'none',
                  background: isGirlsOnlyEvent ? '#E90D7D' : '#ddd',
                  color: isGirlsOnlyEvent ? '#fff' : '#555',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {isGirlsOnlyEvent ? 'ON' : 'OFF'}
              </button>
              <span style={{ fontSize: 12, color: '#999' }}>
                Shows this plan with Galcode styling in the chat UI.
              </span>
            </div>
          </div>

          {/* Invite-only settings */}
          <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
            <label style={s.label}>Invite Only</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                type="button"
                onClick={() => set('invite_only', !trip.invite_only)}
                style={{ padding: '5px 16px', borderRadius: 99, border: 'none', background: trip.invite_only ? '#16a34a' : '#ddd', color: trip.invite_only ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                {trip.invite_only ? 'ON' : 'OFF'}
              </button>
              {trip.invite_only && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ ...s.label, marginBottom: 0 }}>Total Spots</label>
                  <input
                    type="number"
                    min={0}
                    style={{ ...s.input, width: 90, marginBottom: 0 }}
                    placeholder="e.g. 35"
                    value={trip.invite_spots ?? ''}
                    onChange={e => set('invite_spots', e.target.value === '' ? null : Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Advance Payment QR URL</label>
            <input
              style={s.input}
              placeholder="Paste Cloudinary URL for advance QR"
              value={trip.advance_qr_url ?? ''}
              onChange={e => set('advance_qr_url', e.target.value || null)}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Balance Payment QR URL</label>
            <input
              style={s.input}
              placeholder="Paste Cloudinary URL for balance QR"
              value={trip.balance_qr_url ?? ''}
              onChange={e => set('balance_qr_url', e.target.value || null)}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Calendar CTA Text (e.g. Book Now)</label>
            <input
              style={s.input}
              value={calendarCtaValue}
              onChange={e => setPlanValue(['Calendar CTA'], 'Calendar CTA', e.target.value, 'ticket')}
            />
          </div>
          <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
            <label style={s.label}>Hero Images (up to 4)</label>
            <div style={{ display: 'grid', gap: 8 }}>
              {[0, 1, 2, 3].map((idx) => (
                <ImageUploadInput
                  key={idx}
                  value={heroImages[idx] ?? ''}
                  onChange={url => setHeroImage(idx, url)}
                  placeholder={`Hero Image ${idx + 1} — paste URL or upload`}
                  folder="hero"
                />
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── LOGISTICS ── */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 14 }}>Logistics</div>

      <CollapsibleSection title="The Plan">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={s.label}>Meeting Spot</label>
            <input
              style={s.input}
              placeholder="e.g. Airport Metro"
              value={meetingSpotValue}
              onChange={e => setPlanValue(['Meeting Spot'], 'Meeting Spot', e.target.value, 'map')}
            />
          </div>
          <div>
            <label style={s.label}>Transport</label>
            <input
              style={s.input}
              placeholder="e.g. Party Bus"
              value={transportValue}
              onChange={e => setPlanValue(['Transport'], 'Transport', e.target.value, 'bus')}
            />
          </div>
          <div>
            <label style={s.label}>You'll Meet</label>
            <input
              style={s.input}
              placeholder="e.g. For those who bond over stories, chaos & good times"
              value={youllMeetValue}
              onChange={e => setPlanValue(["You'll Meet", 'Made For'], "You'll Meet", e.target.value, 'heart')}
            />
          </div>
          <div>
            <label style={s.label}>Gang Size</label>
            <input
              type="number"
              min={1}
              step={1}
              style={s.input}
              placeholder="e.g. 15"
              value={gangSizeNumber}
              onChange={e => setPlanValue(['Group Size'], 'Group Size', e.target.value, 'users')}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Secret Offer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <label style={{ ...s.label, marginBottom: 0 }}>Show Secret Offer after payment</label>
          <button
            type="button"
            onClick={() => set('show_secret_offer', !(trip.show_secret_offer ?? true))}
            style={{ padding: '4px 14px', borderRadius: 99, border: 'none', background: (trip.show_secret_offer ?? true) ? '#16a34a' : '#ddd', color: (trip.show_secret_offer ?? true) ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}
          >
            {(trip.show_secret_offer ?? true) ? 'ON' : 'OFF'}
          </button>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <div>
            <label style={s.label}>WhatsApp Number</label>
            <input
              style={s.input}
              placeholder="e.g. 919739832100"
              value={secretOfferPhoneValue}
              onChange={e => setPlanValue(
                ['Secret Offer Number', 'Secret Offer Phone', 'Secret Offer WhatsApp'],
                'Secret Offer Number',
                e.target.value,
                'ticket'
              )}
            />
          </div>
          <div>
            <label style={s.label}>Prefilled Message</label>
            <textarea
              style={s.textarea}
              placeholder="Example: Hi! I just paid the advance for {title} ({date}). I'd like to pay the remaining balance and claim my offer!"
              value={secretOfferMessageValue}
              onChange={e => setPlanValue(['Secret Offer Message'], 'Secret Offer Message', e.target.value, 'ticket')}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Meeting Points">
        {regularPickups.length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No transport pickup points added.</div>}
        {regularPickups.map((p) => (
          <div key={p._idx} style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
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
                <input type="number" style={s.input} placeholder="0 = same day, -1 = previous day" value={p.dateOffset ?? 0} onChange={e => setPickup(p._idx, 'dateOffset', Number(e.target.value))} />
              </div>
              <div>
                <label style={s.label}>Other City Price (₹)</label>
                <input type="number" min={0} style={s.input} placeholder="Leave blank = base event price" value={p.otherPrice ?? ''} onChange={e => setPickup(p._idx, 'otherPrice', e.target.value === '' ? undefined : Number(e.target.value))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={s.label}>Other City Advance (₹)</label>
                <input type="number" min={0} style={s.input} placeholder="Leave blank = event advance amount" value={p.otherAdvance ?? ''} onChange={e => setPickup(p._idx, 'otherAdvance', e.target.value === '' ? undefined : Number(e.target.value))} />
              </div>
            </div>
            <button onClick={() => removePickup(p._idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addPickup} style={{ marginTop: 4, padding: '7px 16px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Add Pickup Point</button>
      </CollapsibleSection>

      <CollapsibleSection title="Trip Dates" badge={`${dates.length} date${dates.length !== 1 ? 's' : ''}`}>
        {dates.length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No dates added yet.</div>}
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
        <button type="button" onClick={addDate} style={{ marginTop: 4, padding: '7px 16px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Add Date</button>
      </CollapsibleSection>

      <CollapsibleSection title="Where We Stay" badge={trip.show_accommodation ? 'ON' : 'OFF'} badgeColor={trip.show_accommodation ? '#16a34a' : undefined}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: trip.show_accommodation ? 12 : 0 }}>
          <span style={{ fontSize: 13, color: '#555' }}>Show "Where We Stay" section on the event page</span>
          <button type="button" onClick={() => set('show_accommodation', !trip.show_accommodation)}
            style={{ padding: '4px 14px', borderRadius: 99, border: 'none', background: trip.show_accommodation ? '#16a34a' : '#ddd', color: trip.show_accommodation ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {trip.show_accommodation ? 'ON' : 'OFF'}
          </button>
        </div>
        {trip.show_accommodation && (
          <>
            {stays.map((stay, stayIndex) => (
              <div key={stayIndex} style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ ...s.label, marginBottom: 0 }}>Stay {stayIndex + 1}</label>
                  {stays.length > 1 && (
                    <button type="button" onClick={() => removeStay(stayIndex)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                      Remove Stay
                    </button>
                  )}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={s.label}>Stay Name</label>
                  <input style={s.input} placeholder="e.g. Night Tent Camp / Hilltop Hotel" value={stay.name} onChange={e => updateStay(stayIndex, { name: e.target.value })} />
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={s.label}>Images (up to 3)</label>
                  {[0, 1, 2].map(imageIndex => (
                    <div key={imageIndex} style={{ marginBottom: 6 }}>
                      <ImageUploadInput
                        value={stay.images?.[imageIndex] ?? (imageIndex === 0 ? (stay.image ?? '') : '')}
                        onChange={url => updateStayImage(stayIndex, imageIndex, url)}
                        placeholder={`Image ${imageIndex + 1} — paste URL or upload`}
                        folder="accommodation"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label style={s.label}>Bullet Points (3)</label>
                  {[0, 1, 2].map(i => (
                    <input key={i} style={{ ...s.input, marginBottom: 6 }} placeholder={`Feature ${i + 1}`} value={stay.features?.[i] ?? ''} onChange={e => updateStayFeature(stayIndex, i, e.target.value)} />
                  ))}
                </div>
              </div>
            ))}
            <button type="button" onClick={addStay} style={{ marginTop: 4, padding: '7px 16px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              + Add Stay
            </button>
          </>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Own Transport Option" badge={ownTransport ? 'ON' : 'OFF'} badgeColor={ownTransport ? '#16a34a' : undefined}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: ownTransport ? 12 : 0 }}>
          <span style={{ fontSize: 13, color: '#555' }}>Enable own transport option for this trip</span>
          <button type="button" onClick={() => toggleOwnTransport(!ownTransport)}
            style={{ padding: '4px 14px', borderRadius: 99, border: 'none', background: ownTransport ? '#16a34a' : '#ddd', color: ownTransport ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            {ownTransport ? 'ON' : 'OFF'}
          </button>
        </div>
        {ownTransport && (
          <div style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 12px' }}>
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
              <button type="button" onClick={() => setOwnTransport({ ownOnly: !ownTransport.ownOnly })}
                style={{ padding: '4px 14px', borderRadius: 99, border: 'none', background: ownTransport.ownOnly ? '#111' : '#ddd', color: ownTransport.ownOnly ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {ownTransport.ownOnly ? 'YES' : 'NO'}
              </button>
            </div>
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Show In Other City Feed" badge={showInOther ? 'ON' : 'OFF'} badgeColor={showInOther ? '#16a34a' : undefined}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#555' }}>When ON, users selecting "Other" city can see this event.</span>
          <button type="button" onClick={toggleShowInOther}
            style={{ padding: '4px 14px', borderRadius: 99, border: 'none', background: showInOther ? '#16a34a' : '#ddd', color: showInOther ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>
            {showInOther ? 'ON' : 'OFF'}
          </button>
        </div>
      </CollapsibleSection>

      {/* ── CONTENT ── */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 10 }}>Content</div>

      <CollapsibleSection title="Header Announcements">
        {(trip.announcements ?? []).length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No announcements yet.</div>}
        {(trip.announcements ?? []).map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input style={s.input} placeholder="e.g. Weekend Escape bookings are live" value={item}
              onChange={e => { const a = [...(trip.announcements ?? [])]; a[i] = e.target.value; onChange({ ...trip, announcements: a }); }} />
            <button type="button" onClick={() => { const a = [...(trip.announcements ?? [])]; onChange({ ...trip, announcements: a.filter((_, idx) => idx !== i) }); }}
              style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => onChange({ ...trip, announcements: [...(trip.announcements ?? []), ''] })} style={{ marginTop: 4, padding: '7px 16px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Add</button>
      </CollapsibleSection>

      <CollapsibleSection title="You'll Experience (Itinerary)">
        {itinerary.length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No itinerary days yet.</div>}
        {itinerary.map((day, dayIndex) => (
          <div key={dayIndex} style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input style={s.input} placeholder="Day label (e.g. Day 1)" value={day.day} onChange={e => updateItineraryDay(dayIndex, { day: e.target.value })} />
              <input style={s.input} placeholder="Day title" value={day.title} onChange={e => updateItineraryDay(dayIndex, { title: e.target.value })} />
              <button type="button" onClick={() => removeItineraryDay(dayIndex)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
            </div>
            <textarea style={s.textarea} placeholder="Day description" value={day.description} onChange={e => updateItineraryDay(dayIndex, { description: e.target.value })} />
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ ...s.label, marginBottom: 0 }}>Schedule</label>
                <button type="button" style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }} onClick={() => addScheduleItem(dayIndex)}>+ Add Time Slot</button>
              </div>
              {(day.schedule ?? []).length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 6 }}>No time slots yet.</div>}
              {(day.schedule ?? []).map((item, itemIndex) => (
                <div key={itemIndex} style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input style={s.input} placeholder="e.g. 7:30 PM" value={item.time} onChange={e => updateScheduleItem(dayIndex, itemIndex, { time: e.target.value })} />
                  <input style={s.input} placeholder="Activity" value={item.activity} onChange={e => updateScheduleItem(dayIndex, itemIndex, { activity: e.target.value })} />
                  <button type="button" onClick={() => removeScheduleItem(dayIndex, itemIndex)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button type="button" onClick={addItineraryDay} style={{ marginTop: 4, padding: '7px 16px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Add Day</button>
      </CollapsibleSection>

      <CollapsibleSection title="What's Included">
        {(trip.included ?? []).length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No items yet.</div>}
        {(trip.included ?? []).map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input style={s.input} placeholder="e.g. Round-trip transport" value={item} onChange={e => updateStringListItem('included', i, e.target.value)} />
            <button type="button" onClick={() => removeStringListItem('included', i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => addStringListItem('included')} style={{ marginTop: 4, padding: '7px 16px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Add</button>
      </CollapsibleSection>

      <CollapsibleSection title="Optional Activities">
        {(trip.optional_activities ?? []).length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No items yet.</div>}
        {(trip.optional_activities ?? []).map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input style={s.input} placeholder="e.g. Sunrise walk" value={item} onChange={e => updateStringListItem('optional_activities', i, e.target.value)} />
            <button type="button" onClick={() => removeStringListItem('optional_activities', i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => addStringListItem('optional_activities')} style={{ marginTop: 4, padding: '7px 16px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Add</button>
      </CollapsibleSection>

      <CollapsibleSection title="What's Not Included">
        {(trip.not_included ?? []).length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No items yet.</div>}
        {(trip.not_included ?? []).map((item, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input style={s.input} placeholder="e.g. Lunch" value={item} onChange={e => updateStringListItem('not_included', i, e.target.value)} />
            <button type="button" onClick={() => removeStringListItem('not_included', i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => addStringListItem('not_included')} style={{ marginTop: 4, padding: '7px 16px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Add</button>
      </CollapsibleSection>

      {trip.id && <InvitedNumbersSection eventSlug={trip.invite_slug || trip.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || trip.slug || trip.id} s={s} />}

      <div style={{ background: '#fffbe6', border: '1.5px solid #ffe58f', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#7c5c00' }}>
        💡 <strong>Media</strong> (videos & reviews), <strong>Timelines</strong> (booking steps), and <strong>Q&A</strong> are managed in their own tabs above.
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button style={s.outlineBtn} onClick={onCancel}>Cancel</button>
        <button style={s.btn(saving ? '#aaa' : '#111')} disabled={saving} onClick={onSave}>
          {saving ? 'Saving…' : 'Save Plan'}
        </button>
      </div>
    </div>
  );
}

function OtherCityForm({ trip, onChange, onSave, onCancel, saving, s, hideFooterActions = false }: {
  trip: Trip; onChange: (t: Trip) => void; onSave: () => void; onCancel: () => void; saving: boolean; s: any; hideFooterActions?: boolean;
}) {
  const pickups = trip.pickup_points ?? [];
  const setTrip = (patch: Partial<Trip>) => onChange({ ...trip, ...patch });

  // Separate own_transport from regular pickup points
  const ownTransportIndex = pickups.findIndex(p => p.id === 'own_transport');
  const ownTransport = ownTransportIndex >= 0 ? pickups[ownTransportIndex] : null;
  // Only show explicitly tagged Other-city points (forOtherCity === true)
  // Legacy untagged points (undefined) are treated as Pondy-only and stay in TripForm
  const regularPickups = pickups.map((p, idx) => ({ ...p, _idx: idx })).filter(p => p.id !== 'own_transport' && p.forOtherCity === true);

  const toggleOwnTransport = (enabled: boolean) => {
    if (enabled) {
      if (ownTransportIndex >= 0) return;
      setTrip({
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
          }
        ]
      });
    } else {
      setTrip({ pickup_points: pickups.filter(p => p.id !== 'own_transport') });
    }
  };
  const setOwnTransport = (patch: Partial<PickupPoint>) => {
    if (ownTransportIndex < 0) return;
    const updated = pickups.map((p, idx) => idx === ownTransportIndex ? { ...p, ...patch } : p);
    setTrip({ pickup_points: updated });
  };

  const setPickup = (origIdx: number, patch: Partial<PickupPoint>) => {
    const next = pickups.map((p, i) => i === origIdx ? { ...p, ...patch } : p);
    setTrip({ pickup_points: next });
  };
  const addPickup = () => {
    setTrip({
      pickup_points: [
        ...pickups,
        { id: `pt_${Date.now()}`, label: '', meetingSpot: '', time: '', transport: '', forOtherCity: true }
      ]
    });
  };
  const removePickup = (origIdx: number) => setTrip({ pickup_points: pickups.filter((_, i) => i !== origIdx) });

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

      {/* Own Transport Preset */}
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
          </div>
        )}
      </div>

      {/* Regular Pickup Points */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ ...s.label, marginBottom: 0 }}>Other Pickup Points</label>
          <button type="button" style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }} onClick={addPickup}>+ Add Point</button>
        </div>
        {regularPickups.length === 0 && <div style={{ color: '#aaa', fontSize: 13 }}>No pickup points configured yet.</div>}
        {regularPickups.map((point) => (
          <div key={point.id || point._idx} style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div>
                <label style={s.label}>Dropdown Label</label>
                <input style={s.input} placeholder="e.g. Dindigul Pickup — 5:30 AM" value={point.label} onChange={e => setPickup(point._idx, { label: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Meeting Spot</label>
                <input style={s.input} placeholder="e.g. Dindigul Bus Stand" value={point.meetingSpot} onChange={e => setPickup(point._idx, { meetingSpot: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Pickup Time</label>
                <input style={s.input} placeholder="e.g. 5:30 AM" value={point.time} onChange={e => setPickup(point._idx, { time: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Transport</label>
                <input style={s.input} placeholder="e.g. Party Bus" value={point.transport} onChange={e => setPickup(point._idx, { transport: e.target.value })} />
              </div>
              <div>
                <label style={s.label}>Journey Card Date Offset (days)</label>
                <input
                  type="number"
                  style={s.input}
                  placeholder="0 = same day, -1 = previous day"
                  value={point.dateOffset ?? 0}
                  onChange={e => setPickup(point._idx, { dateOffset: Number(e.target.value) })}
                />
              </div>
              <div>
                <label style={s.label}>Other City Price (₹)</label>
                <input type="number" min={0} style={s.input} placeholder="Leave blank = base event price" value={point.otherPrice ?? ''} onChange={e => setPickup(point._idx, { otherPrice: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
              <div>
                <label style={s.label}>Other City Advance (₹)</label>
                <input type="number" min={0} style={s.input} placeholder="Leave blank = event advance amount" value={point.otherAdvance ?? ''} onChange={e => setPickup(point._idx, { otherAdvance: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
            </div>
            <button type="button" onClick={() => removePickup(point._idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Remove</button>
          </div>
        ))}
      </div>

      {!hideFooterActions && (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button style={s.outlineBtn} onClick={onCancel}>Cancel</button>
          <button style={s.btn(saving ? '#aaa' : '#111')} disabled={saving} onClick={onSave}>
            {saving ? 'Saving…' : 'Save Other Setup'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── INVITED NUMBERS SECTION ─────────────────────────────────────────────────
function normalizePhone(raw: string): string {
  return raw.replace(/\s+/g, '').replace(/^\+91/, '').replace(/^0/, '').trim();
}

function InvitedNumbersSection({ eventSlug, s }: { eventSlug: string; s: any }) {
  const [count, setCount] = React.useState<number | null>(null);
  const [pasteText, setPasteText] = React.useState('');
  const [pasteStatus, setPasteStatus] = React.useState('');
  const [csvStatus, setCsvStatus] = React.useState('');
  const [csvParsed, setCsvParsed] = React.useState<string[]>([]);
  const [csvFileName, setCsvFileName] = React.useState('');
  const [clearing, setClearing] = React.useState(false);
  const [showNumbers, setShowNumbers] = React.useState(false);
  const [savedNumbers, setSavedNumbers] = React.useState<string[]>([]);
  const [loadingNumbers, setLoadingNumbers] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const fetchCount = React.useCallback(async () => {
    if (!eventSlug) return;
    const { count: c } = await supabase
      .from('invited_numbers')
      .select('id', { count: 'exact', head: true })
      .eq('event_slug', eventSlug);
    setCount(c ?? 0);
  }, [eventSlug]);

  const fetchNumbers = React.useCallback(async () => {
    if (!eventSlug) return;
    setLoadingNumbers(true);
    const { data } = await supabase
      .from('invited_numbers')
      .select('phone')
      .eq('event_slug', eventSlug)
      .order('phone', { ascending: true });
    setSavedNumbers((data ?? []).map((r: any) => r.phone));
    setLoadingNumbers(false);
  }, [eventSlug]);

  const handleToggleNumbers = () => {
    if (!showNumbers) fetchNumbers();
    setShowNumbers(v => !v);
  };

  React.useEffect(() => { fetchCount(); }, [fetchCount]);

  const parseNumbers = (text: string): string[] => {
    const parts = text.split(/[\n,]+/).map(p => normalizePhone(p)).filter(p => p.length >= 10 && /^\d+$/.test(p)).map(p => p.slice(-10));
    return [...new Set(parts)];
  };

  const upsertNumbers = async (phones: string[]): Promise<{ saved: number; error: string }> => {
    if (phones.length === 0) return { saved: 0, error: '' };
    const rows = phones.map(phone => ({ event_slug: eventSlug, phone }));
    let saved = 0;
    let lastError = '';
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error } = await supabase.from('invited_numbers').upsert(batch, { onConflict: 'event_slug,phone', ignoreDuplicates: true });
      if (error) { lastError = error.message; }
      else saved += batch.length;
    }
    return { saved, error: lastError };
  };

  const handleSavePaste = async () => {
    const phones = parseNumbers(pasteText);
    if (phones.length === 0) { setPasteStatus('No valid numbers found.'); return; }
    setPasteStatus('Saving…');
    const { saved, error } = await upsertNumbers(phones);
    await fetchCount();
    setPasteStatus(error ? `Error: ${error}` : `${saved} numbers saved.`);
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string ?? '';
      const parsed = parseNumbers(text);
      setCsvParsed(parsed);
      setCsvStatus(`Found ${parsed.length} valid numbers in file. Click Import to save.`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportCsv = async () => {
    if (csvParsed.length === 0) { setCsvStatus('No valid numbers to import.'); return; }
    setCsvStatus('Importing…');
    const { saved, error } = await upsertNumbers(csvParsed);
    await fetchCount();
    setCsvStatus(error ? `Error: ${error}` : `${saved} numbers imported.`);
    setCsvParsed([]);
    setCsvFileName('');
  };

  const handleClearAll = async () => {
    if (!window.confirm(`Clear ALL invited numbers for "${eventSlug}"? This cannot be undone.`)) return;
    setClearing(true);
    await supabase.from('invited_numbers').delete().eq('event_slug', eventSlug);
    await fetchCount();
    setClearing(false);
  };

  return (
    <CollapsibleSection title="Invited Numbers" badge={count !== null ? `${count} saved` : undefined} badgeColor="#7c3aed">
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#4c1d95' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>
              <strong>{count !== null ? count : '…'}</strong> numbers currently on the invite list for slug <code style={{ background: '#ede9fe', padding: '1px 6px', borderRadius: 4 }}>{eventSlug}</code>
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {count !== null && count > 0 && (
                <button
                  type="button"
                  onClick={handleToggleNumbers}
                  style={{ padding: '3px 10px', borderRadius: 6, border: '1.5px solid #c4b5fd', background: '#ede9fe', color: '#6d28d9', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                >
                  {showNumbers ? 'Hide Numbers ▲' : 'View Numbers ▼'}
                </button>
              )}
              {count !== null && count > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={clearing}
                  style={{ padding: '3px 10px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                >
                  {clearing ? 'Clearing…' : 'Clear All'}
                </button>
              )}
            </div>
          </div>

          {showNumbers && (
            <div style={{ marginTop: 10, borderTop: '1px solid #ddd6fe', paddingTop: 10 }}>
              {loadingNumbers ? (
                <p style={{ fontSize: 12, color: '#7c3aed', margin: 0 }}>Loading…</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '4px 12px', maxHeight: 200, overflowY: 'auto' }}>
                  {savedNumbers.map((phone, i) => (
                    <span key={phone} style={{ fontSize: 12, fontFamily: 'monospace', color: '#4c1d95', padding: '2px 0' }}>
                      {i + 1}. {phone}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label style={s.label}>Paste Phone Numbers</label>
          <textarea
            style={{ ...s.textarea, minHeight: 80 }}
            placeholder="Paste phone numbers, one per line (or comma separated)"
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
            <button type="button" onClick={handleSavePaste} style={{ padding: '7px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Save Numbers
            </button>
            {pasteStatus && <span style={{ fontSize: 13, color: '#555' }}>{pasteStatus}</span>}
          </div>
        </div>

        <div>
          <label style={s.label}>Import from CSV</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleCsvFile} />
            <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: '7px 14px', background: '#fff', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
              {csvFileName ? csvFileName : 'Choose CSV file'}
            </button>
            {csvParsed.length > 0 && (
              <button type="button" onClick={handleImportCsv} style={{ padding: '7px 16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                Import {csvParsed.length} numbers
              </button>
            )}
          </div>
          {csvStatus && <div style={{ fontSize: 13, color: '#555', marginTop: 6 }}>{csvStatus}</div>}
        </div>
      </div>
    </CollapsibleSection>
  );
}

// ─── COLLAPSIBLE SECTION ─────────────────────────────────────────────────────
function CollapsibleSection({ title, badge, badgeColor, defaultOpen = false, children, action }: {
  title: string;
  badge?: string;
  badgeColor?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 10 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          background: open ? '#ebebе7' : '#f4f4f0',
          border: '1.5px solid #e0e0da',
          borderRadius: open ? '10px 10px 0 0' : 10,
          padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 12, color: '#444', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 }}>{title}</span>
        {badge !== undefined && (
          <span style={{
            background: badgeColor ? badgeColor + '22' : '#e4e4de',
            color: badgeColor ?? '#666',
            border: `1px solid ${badgeColor ? badgeColor + '55' : '#d0d0ca'}`,
            borderRadius: 99, padding: '1px 9px', fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>{badge}</span>
        )}
        {action && <span onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>{action}</span>}
        <span style={{ color: '#999', fontSize: 13, flexShrink: 0, display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
      </button>
      {open && (
        <div style={{ border: '1.5px solid #e0e0da', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '14px', background: '#fff' }}>
          {children}
        </div>
      )}
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
