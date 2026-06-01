// chaptera admin panel
import React, { useState, useEffect, useRef } from 'react';
import { supabase, parseHeroImages, fetchEventCounts } from './supabase';

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


// ─── TYPES ────────────────────────────────────────────────────────────────────
type TripDate = { id?: string; start_date: string; status: 'available' | 'selling_out' | 'sold_out'; label: string; whatsapp_group_url?: string };
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
  forCity?: string;
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
  total_capacity?: number | null;
  ticket_types?: Array<{ id: string; label: string; price: number; advance: number }>;
  invite_faqs?: FAQ[];
  city_details?: Record<string, { included: string[]; not_included: string[]; optional_activities: string[]; itinerary: ItineraryDay[]; meeting_spot?: string; transport?: string; price_full?: number; price_advance?: number }>;
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
type PayuPayment = {
  id?: string;
  txnid?: string;
  event_id?: string;
  event_title?: string;
  amount?: number;
  name?: string;
  phone?: string;
  trip_date?: string;
  status?: string;
  mihpayid?: string;
  created_at?: string;
};

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
  const [adminRole, setAdminRole] = useState<'admin' | 'ops' | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authDenied, setAuthDenied] = useState(false);
  const [debugEmail, setDebugEmail] = useState<string>('');
  const [tab, setTab] = useState<'trips' | 'flow' | 'people' | 'analytics' | 'settings'>(
    () => (localStorage.getItem('adminTab') as 'trips' | 'flow' | 'people' | 'analytics' | 'settings') ?? 'people'
  );
  const switchTab = (t: 'trips' | 'flow' | 'people' | 'analytics' | 'settings') => { setTab(t); localStorage.setItem('adminTab', t); };
  const [flowMode, setFlowMode] = useState<'media' | 'timelines' | 'faqs'>('media');
  const [peopleMode, setPeopleMode] = useState<'call' | 'approval' | 'payments' | 'doubts'>('approval');
  const [peopleSearch, setPeopleSearch] = useState('');
  // Normalize city_details keys to match the casing in the cities array.
  // Older saves may have stored keys like "delhi" when the city is "Delhi".
  // This merges all case-variants of a city into the single canonical key.
  const normalizeCityDetails = (trip: any): any => {
    const cd = trip.city_details;
    if (!cd || typeof cd !== 'object') return trip;
    const cityNames: string[] = trip.cities ?? [];
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(cd)) {
      const canonical = cityNames.find(c => c.toLowerCase() === key.toLowerCase()) ?? key;
      normalized[canonical] = { ...(normalized[canonical] ?? {}), ...(value as any) };
    }
    return { ...trip, city_details: normalized };
  };

  const [trips, setTrips] = useState<Trip[]>([]);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [doubtSubmissions, setDoubtSubmissions] = useState<DoubtSubmission[]>([]);
  const [planDoubts, setPlanDoubts] = useState<any[]>([]);
  const [doubtsLoadError, setDoubtsLoadError] = useState('');
  const [approvingDoubtId, setApprovingDoubtId] = useState<string | null>(null);
  const [approvedDoubtIds, setApprovedDoubtIds] = useState<Set<string>>(new Set());
  const [payuPayments, setPayuPayments] = useState<PayuPayment[]>([]);
  const [globalMessageDrafts, setGlobalMessageDrafts] = useState<Record<string, string>>({});
  const [generalAnnouncementsText, setGeneralAnnouncementsText] = useState('');
  const [globalAnnouncementsFields, setGlobalAnnouncementsFields] = useState<[string, string, string]>(['', '', '']);
  const [doubtCtaLabel, setDoubtCtaLabel] = useState('');
  const [savingGeneralAnnouncements, setSavingGeneralAnnouncements] = useState(false);
  // ── Dynamic announcements ──────────────────────────────────────────────────
  const [announcementEventSlugs, setAnnouncementEventSlugs] = useState<string[]>([]);
  const [announcementStaticText, setAnnouncementStaticText] = useState('plans we dream');
  // counts keyed by event slug: { registered, reserved }
  const [announcementCounts, setAnnouncementCounts] = useState<Record<string, { registered: number; reserved: number }>>({});
  const [savingDoubtSettings, setSavingDoubtSettings] = useState(false);
  // ── NOTIFICATIONS (admin push) ────────────────────────────────────────────
  const VAPID_PUBLIC_KEY = 'BKXd5KDV_vL6P19fk10d2STjZSkGHSXz_zHHBg53RxwKIRCDSEn0lHPfCBwDvphRbjnvX0Th-99GHh-cs6yEHpU';
  const [notifStatus, setNotifStatus] = useState<'idle' | 'requesting' | 'subscribed' | 'error'>('idle');
  const [notifLabel, setNotifLabel] = useState('');
  const [notifDevices, setNotifDevices] = useState<{ id: string; label: string; created_at: string }[]>([]);
  const [notifDevicesLoading, setNotifDevicesLoading] = useState(false);

  const loadNotifDevices = React.useCallback(async () => {
    setNotifDevicesLoading(true);
    const { data } = await supabase.from('admin_push_subscriptions').select('id, label, created_at').order('created_at', { ascending: false });
    setNotifDevices(data ?? []);
    setNotifDevicesLoading(false);
  }, []);

  const subscribeThisDevice = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setNotifStatus('error');
      showToast('Push notifications are not supported on this browser.');
      return;
    }
    setNotifStatus('requesting');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotifStatus('error');
        showToast('Notification permission denied.');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY,
      });
      const subJson = sub.toJSON() as any;
      const label = notifLabel.trim() || (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad') ? 'iOS Device' : navigator.userAgent.includes('Android') ? 'Android Device' : 'Desktop');
      await supabase.from('admin_push_subscriptions').upsert({
        label,
        endpoint: sub.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      }, { onConflict: 'endpoint' });
      setNotifStatus('subscribed');
      showToast('✅ Notifications enabled for this device!');
      loadNotifDevices();
    } catch (e: any) {
      setNotifStatus('error');
      showToast('Failed to enable notifications: ' + (e?.message ?? e));
    }
  };

  const removeNotifDevice = async (id: string) => {
    await supabase.from('admin_push_subscriptions').delete().eq('id', id);
    setNotifDevices(prev => prev.filter(d => d.id !== id));
  };

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [faqClipboard, setFaqClipboard] = useState<FAQ[] | null>(null);
  const [inviteFaqClipboard, setInviteFaqClipboard] = useState<FAQ[] | null>(null);
  const [groupchatClipboard, setGroupchatClipboard] = useState<any[] | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [addingTrip, setAddingTrip] = useState(false);
  const [plansCityFilter, setPlansCityFilter] = useState<'all' | string>('all');
  const [mediaCityFilter, setMediaCityFilter] = useState<'all' | string>('all');
  const [timelinesCityFilter, setTimelinesCityFilter] = useState<'all' | string>('all');
  const [timelineEdits, setTimelineEdits] = useState<Record<string, Array<{ label: string; value: string; date: string }>>>({});
  const [selectedTimelineDates, setSelectedTimelineDates] = useState<Record<string, string>>({});
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);
  const [savingTimeline, setSavingTimeline] = useState<string | null>(null);
  const [ctaEdits, setCtaEdits] = useState<Record<string, string>>({});
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsWindow, setAnalyticsWindow] = useState<'24h' | 'week' | 'month'>('week');
  const [analyticsFunnelEventFilter, setAnalyticsFunnelEventFilter] = useState<'all' | string>('all');
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsEventFilter, setApplicationsEventFilter] = useState<'all' | string>('all');
  const [applicationsStatusFilter, setApplicationsStatusFilter] = useState<'all' | string>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [callStatusEdits, setCallStatusEdits] = useState<Record<string, string>>({});
  const [callNotesEdits, setCallNotesEdits] = useState<Record<string, string>>({});
  const [savingCallId, setSavingCallId] = useState<string | null>(null);
  const [qnaCityFilter, setQnaCityFilter] = useState<'all' | string>('all');
  const [qnaDoubtCityFilter, setQnaDoubtCityFilter] = useState<'all' | string>('all');
  const [qnaDoubtPlanFilter, setQnaDoubtPlanFilter] = useState<'all' | string>('all');
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
    ask_pickup_city_1: 'booking', ask_pickup_city_2: 'booking', ask_pickup_city_many: 'booking',
    ask_own_transport_city: 'booking',
    contact_success: 'contact',
    general_announcements: 'global', doubt_cta_label: 'global',
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
  const qnaDoubtPlans = (trips
    .map(t => (t.title || '').trim())
    .filter((s): s is string => !!s))
    .sort((a, b) => a.localeCompare(b));

  const getDoubtSubmissionPlanName = (submission: any) => {
    // doubt_submissions uses event_title (plain string) — look it up in trips for a canonical title
    const raw = (submission.event_title || submission.event || submission.event_name || '').trim();
    if (raw) {
      const match = trips.find(t => t.title === raw || t.slug === raw || t.invite_slug === raw);
      return match ? match.title : raw;
    }
    if (submission.event_slug) {
      const match = trips.find(t => t.slug === submission.event_slug || t.invite_slug === submission.event_slug);
      if (match) return match.title;
      return submission.event_slug;
    }
    return '-';
  };

  const formatAdminDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const day = date.getDate();
    const month = date.toLocaleString('en-IN', { month: 'short' });
    const time = date.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).replace(/\s/g, ' ').toUpperCase();
    return `${day} ${month} at ${time}`;
  };

  // ─── AUTH: resolve session on mount & listen for changes ──────────────────
  useEffect(() => {
    const resolveRole = async (userId: string | undefined, userEmail: string | undefined) => {
      if (!userId || !userEmail) { setAdminRole(null); setAuthDenied(false); setAuthLoading(false); return; }
      const { data, error } = await supabase.from('admin_users').select('role').eq('email', userEmail).maybeSingle();
      if (error) console.error('[admin] admin_users query error:', error);
      console.log('[admin] resolveRole', { userEmail, data, error });
      setDebugEmail(userEmail ?? '');
      const role = (data?.role as 'admin' | 'ops') ?? null;
      setAdminRole(role);
      setAuthDenied(!role); // logged in via Google but not in admin_users
      // Mark this device as an admin device so the PWA always opens at /admin
      if (role) localStorage.setItem('chaptera_admin_device', '1');
      else localStorage.removeItem('chaptera_admin_device');
      if (!localStorage.getItem('adminTab')) {
        if (role === 'ops') setTab('people');
        else if (role === 'admin') setTab('trips');
      }
      setAuthLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveRole(session?.user?.id, session?.user?.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveRole(session?.user?.id, session?.user?.email);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('chaptera_admin_device');
    setAdminRole(null);
    setAuthDenied(false);
  };

  // ─── LOAD DATA ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!adminRole) return;
    setLoading(true);
    Promise.all([
      supabase.from('events').select('*, event_dates(*), event_media(*), event_reviews(*), faqs(*)').order('created_at', { ascending: true }),
      supabase.from('chat_messages').select('*').order('sort_order', { ascending: true }),
      supabase.from('doubt_submissions').select('*').order('submitted_at', { ascending: false }),
      supabase.from('payu_payments').select('*').order('created_at', { ascending: false }),
    ]).then(([evRes, msgRes, doubtsRes, payuRes]) => {
      if (evRes.data) setTrips((evRes.data as Trip[]).map(normalizeCityDetails));
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
        // Load dynamic announcement config
        const slugsMsg = allMsgs.find(m => m.step_key === 'announcement_event_slugs');
        if (slugsMsg?.bot_message) {
          const slugs = slugsMsg.bot_message.split('\n').map(s => s.trim()).filter(Boolean);
          setAnnouncementEventSlugs(slugs);
        }
        const staticMsg = allMsgs.find(m => m.step_key === 'announcement_static_text');
        if (staticMsg?.bot_message) setAnnouncementStaticText(staticMsg.bot_message);
      }
      if (doubtsRes.data) setPlanDoubts(doubtsRes.data);
      if (payuRes.data) setPayuPayments(payuRes.data as PayuPayment[]);
      setLoading(false);
    }).then(() => {
      // For ops users the People tab is shown by default — load applications automatically
      if (adminRole === 'ops') loadApplications();
    }).catch(err => {
      console.error('Admin data load error:', err);
      setLoading(false);
    });
  }, [adminRole]);

  const refreshPayuPayments = async () => {
    const { data } = await supabase
      .from('payu_payments')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPayuPayments(data as PayuPayment[]);
  };

  const loadApplications = async () => {
    setApplicationsLoading(true);
    const [{ data, error }, { data: doubtsRows, error: doubtsErr }, { data: eventRows }, { data: planDoubtsRows }] = await Promise.all([
      supabase.from('applications').select('*').order('created_at', { ascending: false }),
      supabase.from('doubt_submissions').select('*').order('submitted_at', { ascending: false }),
      supabase.from('events').select('slug, invite_slug'),
      supabase.from('plan_doubts').select('*').order('created_at', { ascending: false }),
    ]);
    console.log('[loadApplications] applications:', data?.length ?? 0, 'doubt_submissions:', doubtsRows?.length ?? 0, doubtsErr ? `(doubts error: ${doubtsErr.message} | ${doubtsErr.details} | ${doubtsErr.hint})` : '');
    if (doubtsErr) {
      console.error('[loadApplications] doubt_submissions error:', doubtsErr);
      setDoubtsLoadError(`${doubtsErr.message}${doubtsErr.hint ? ` — ${doubtsErr.hint}` : ''}`);
    } else {
      setDoubtsLoadError('');
    }
    if (doubtsRows) setPlanDoubts(doubtsRows);
    if (error) {
      showToast(`❌ Failed to load applications: ${error.message}`);
    } else {
      const eventSlugAliases = new Map<string, Set<string>>();
      (eventRows ?? []).forEach((event: any) => {
        const slug = String(event.slug ?? '').trim();
        const inviteSlug = String(event.invite_slug ?? '').trim();
        if (!slug) return;
        const aliases = eventSlugAliases.get(slug) ?? new Set<string>([slug]);
        if (inviteSlug) aliases.add(inviteSlug);
        eventSlugAliases.set(slug, aliases);
      });

      // Index doubts by (phone, event_slug) so each application can carry its latest doubts.
      // plan_doubts (from invite "Other Topic" form) have phone + event_slug + message + status.
      // doubt_submissions (from booking "Other topic" form) have no event_slug, so they don't
      // attach here — they show in the standalone Doubts tab instead.
      const doubtsByKey = new Map<string, any[]>();
      (planDoubtsRows ?? []).forEach((d: any) => {
        // Normalize phone to last 10 digits to be resilient to country-code prefixes
        const normPhone = String(d.phone ?? '').replace(/\D/g, '').slice(-10);
        const key = `${normPhone}__${d.event_slug}`;
        const arr = doubtsByKey.get(key) ?? [];
        arr.push(d);
        doubtsByKey.set(key, arr);
      });
      const enriched = (data ?? []).map((a: any) => {
        const normPhone = String(a.phone ?? '').replace(/\D/g, '').slice(-10);
        const aliases = eventSlugAliases.get(String(a.event_slug ?? '').trim()) ?? new Set<string>([a.event_slug]);
        const doubts = Array.from(aliases).flatMap(slug => doubtsByKey.get(`${normPhone}__${slug}`) ?? []);
        return {
          ...a,
          doubts,
        };
      });
      const totalDoubtsAttached = enriched.reduce((sum, a) => sum + (a.doubts?.length ?? 0), 0);
      console.log('[loadApplications] doubts attached to apps:', totalDoubtsAttached, '/ total doubts:', doubtsRows?.length ?? 0);
      setApplications(enriched);
      // Seed local edits from DB values
      const cs: Record<string, string> = {};
      const cn: Record<string, string> = {};
      enriched.forEach((a: any) => {
        cs[a.id] = a.call_status ?? 'not_called';
        cn[a.id] = a.call_notes ?? '';
      });
      setCallStatusEdits(cs);
      setCallNotesEdits(cn);
    }
    setApplicationsLoading(false);
  };

  const approveApplication = async (id: string) => {
    setApprovingId(id);
    const app = applications.find(a => a.id === id);

    // 1. Update status to invited
    const { data: updatedApp, error } = await supabase
      .from('applications')
      .update({ status: 'invited' })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error || !updatedApp) {
      showToast(`❌ ${error?.message || 'Could not save approval. Please refresh and try again.'}`);
      setApprovingId(null);
      await loadApplications();
      return;
    }

    setApplications(prev => prev.map(a => a.id === id ? { ...a, ...updatedApp } : a));

    // 2. Fire AiSensy invite message
    if (app) {
      // Case-insensitive trip lookup — guards against any old vs new slug casing drift.
      const appSlugLower = String(app.event_slug ?? '').toLowerCase();
      const trip = trips.find(t =>
        String(t.slug ?? t.id ?? '').toLowerCase() === appSlugLower
      );
      const eventName = trip?.title ?? app.event_slug ?? '';
      const firstDate = trip?.event_dates?.[0]?.start_date ?? '';
      const eventDate = (() => {
        if (!firstDate) return '';
        const d = new Date(firstDate + 'T00:00:00');
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        const month = d.toLocaleDateString('en-US', { month: 'long' });
        const day = d.getDate();
        const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
        return `${dayName}, ${month} ${day}${suffix}`;
      })();
      const phone = '91' + String(app.phone).replace(/\D/g, '').slice(-10);

      // Add phone to invited_numbers so the /invite flow works
      const inviteSlug = trip?.invite_slug;
      if (inviteSlug) {
        await supabase.from('invited_numbers').insert({
          event_slug: inviteSlug,
          phone: String(app.phone).replace(/\D/g, '').slice(-10),
        }).select();
      }

      try {
        const aiRes = await fetch('https://backend.aisensy.com/campaign/t1/api/v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZDY1Yjk2MmFiNTdlMGUzNjJiNzA2ZCIsIm5hbWUiOiJjaGFwdGVyIEEgMzA2MyIsImFwcE5hbWUiOiJBaVNlbnN5IiwiY2xpZW50SWQiOiI2OWQ2NWI5NjJhYjU3ZTBlMzYyYjcwNjciLCJhY3RpdmVQbGFuIjoiRlJFRV9GT1JFVkVSIiwiaWF0IjoxNzc1NjU1ODMwfQ.vYeRHCDeP-U5VPhsUrbLfIgkS2hIK1-adr0NrNtYfEI',
            campaignName: 'invitation_with_contact',
            destination: phone,
            userName: app.name ?? '',
            source: 'chapter-admin-dashboard',
            templateParams: [eventName, eventDate],
            tags: ['chapter-invite'],
            attributes: { name: app.name ?? '', event_name: eventName, event_date: eventDate },
          }),
        });
        const ok = aiRes.status >= 200 && aiRes.status < 300;
        // Mark aisensy_invite_sent on the row
        const { data: sentApp, error: sentError } = await supabase
          .from('applications')
          .update({ status: 'invited', aisensy_invite_sent: ok })
          .eq('id', id)
          .select('*')
          .maybeSingle();
        if (sentError || !sentApp) {
          showToast(`⚠️ WhatsApp ${ok ? 'sent' : 'failed'}, but DB did not save the sent flag. Refreshing…`);
          await loadApplications();
        } else {
          setApplications(prev => prev.map(a => a.id === id ? { ...a, ...sentApp } : a));
          showToast(ok ? '✅ Approved & WhatsApp invite sent' : '✅ Approved — but WhatsApp send failed');
        }
      } catch {
        showToast('✅ Approved — WhatsApp send failed (network error)');
      }
    } else {
      showToast('✅ Approved — status set to invited');
    }

    // 3. Send push notification to the user if they have the PWA installed
    if (app) {
      const appSlugLower = String(app.event_slug ?? '').toLowerCase();
      const trip = trips.find(t => String(t.slug ?? t.id ?? '').toLowerCase() === appSlugLower);
      const eventName = trip?.title ?? app.event_slug ?? '';
      const inviteSlug = trip?.invite_slug;
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            type: 'direct',
            phone: String(app.phone).replace(/\D/g, '').slice(-10),
            title: "You're invited! 🎉",
            body: `Your spot on ${eventName} is confirmed. Open the app to see your invite.`,
            url: inviteSlug ? `/invite/${inviteSlug}` : '/',
          },
        });
      } catch { /* push is non-critical — WhatsApp is the primary channel */ }
    }

    setApprovingId(null);
  };

  const approveDoubtSubmission = async (submission: any) => {
    const id = submission.id ?? `${submission.phone}-${submission.submitted_at}`;
    setApprovingDoubtId(id);

    // Resolve event_slug from the stored event_title
    const rawTitle = (submission.event_title || '').trim();
    const matchedTrip = trips.find(t =>
      t.title === rawTitle || t.slug === rawTitle || t.invite_slug === rawTitle
    );
    const eventSlug = matchedTrip?.slug ?? rawTitle;

    if (!eventSlug) {
      showToast('⚠️ Could not determine event slug for this submission.');
      setApprovingDoubtId(null);
      return;
    }

    const phone = (submission.phone ?? '').replace(/\D/g, '').slice(-10);

    // Check for existing application to avoid duplicates
    const { data: existing } = await supabase
      .from('applications')
      .select('id, status')
      .eq('phone', phone)
      .eq('event_slug', eventSlug)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'invited' || existing.status === 'advance_paid' || existing.status === 'fully_paid') {
        showToast(`ℹ️ Already ${existing.status.replace('_', ' ')} — no change needed.`);
        setApprovedDoubtIds(prev => new Set(prev).add(id));
        setApprovingDoubtId(null);
        return;
      }
      // Update existing application to invited
      const { error } = await supabase
        .from('applications')
        .update({ status: 'invited' })
        .eq('id', existing.id);
      if (error) {
        showToast(`❌ Could not update application: ${error.message}`);
      } else {
        showToast(`✅ ${submission.name || 'Person'} updated to invited!`);
        setApprovedDoubtIds(prev => new Set(prev).add(id));
      }
      setApprovingDoubtId(null);
      return;
    }

    // Create a new application row
    const { error } = await supabase.from('applications').insert({
      event_slug: eventSlug,
      name: (submission.name ?? '').trim() || 'Unknown',
      phone,
      gender: '',
      why_join: 'doubt resolved manually',
      selected_date: submission.selected_date ?? null,
      selected_city: submission.city ?? null,
      status: 'invited',
      call_status: 'called',
      call_notes: `Approved via doubt: "${(submission.doubt || submission.message || '').slice(0, 80)}"`,
    });

    if (error) {
      showToast(`❌ Could not create application: ${error.message}`);
    } else {
      showToast(`✅ ${submission.name || 'Person'} approved & invited!`);
      setApprovedDoubtIds(prev => new Set(prev).add(id));
    }
    setApprovingDoubtId(null);
  };

  const saveCallInfo = async (id: string) => {
    setSavingCallId(id);
    const { error } = await supabase
      .from('applications')
      .update({ call_status: callStatusEdits[id] ?? 'not_called', call_notes: callNotesEdits[id] ?? '' })
      .eq('id', id);
    if (error) {
      showToast(`❌ ${error.message}`);
    } else {
      setApplications(prev => prev.map(a => a.id === id ? { ...a, call_status: callStatusEdits[id], call_notes: callNotesEdits[id] } : a));
      showToast('✅ Saved');
    }
    setSavingCallId(null);
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
    // Force both slug + invite_slug to lowercase to prevent the
    // mixed-case bug (applications.event_slug stored 'Sunrise-at-Kovalam'
    // while payu_payments.event_slug stored 'sunrise-at-kovalam' → UPDATE missed).
    const tripWithSlug = {
      ...trip,
      slug:        String(trip.slug ?? '').toLowerCase(),
      invite_slug: String(trip.invite_slug || autoSlug).toLowerCase(),
    };
    const { event_dates, event_media, event_reviews, faqs, id, ...fields } = tripWithSlug;
    const normalizedEventDates = tripWithSlug.booking_url === 'native-application'
      ? (event_dates ?? []).map(d => ({ ...d, status: 'available' as TripDate['status'] }))
      : event_dates;

    let eventId = id;
    if (id) {
      const { error: updateError } = await supabase.from('events').update(fields).eq('id', id);
      if (updateError) { console.error('Update error:', updateError); showToast('Save failed: ' + updateError.message); setSaving(null); return; }
    } else {
      const { data, error: insertError } = await supabase.from('events').insert(fields).select('id').single();
      if (insertError) { console.error('Insert error:', insertError); showToast('Save failed: ' + insertError.message); setSaving(null); return; }
      eventId = data?.id;
    }

    if (eventId && normalizedEventDates) {
      await supabase.from('event_dates').delete().eq('event_id', eventId);
      if (normalizedEventDates.length > 0) {
        await supabase.from('event_dates').insert(
          normalizedEventDates.map(d => ({ event_id: eventId, start_date: d.start_date, status: d.status, label: d.label, whatsapp_group_url: d.whatsapp_group_url ?? null }))
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
    if (data) setTrips((data as Trip[]).map(normalizeCityDetails));
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
      invite_slug: newSlug,
      is_active: false,
    }).select('*, event_dates(*), event_media(*), event_reviews(*), faqs(*)').single();
    if (error || !data) { console.error('Duplicate failed:', error); showToast('Duplicate failed: ' + (error?.message ?? 'unknown error')); return; }

    // Copy related rows
    const related: PromiseLike<any>[] = [];
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

  // Compute the announcement string for a given event (same logic as AppFlow)
  const computeAnnouncementText = (slug: string): string => {
    const event = trips.find(t => t.slug === slug);
    if (!event) return slug;
    const capacity = event.total_capacity ?? null;
    if (!capacity) return `⚠ ${event.title} — no Group Size set (announcement won't show)`;
    const counts = announcementCounts[slug];
    const reserved = counts?.reserved ?? 0;
    const registered = counts?.registered ?? 0;
    const title = (event.title ?? slug).toLowerCase();
    if (reserved >= capacity) return `${title} - sold out`;
    if (reserved / capacity >= 0.5) return `${title} - ${capacity - reserved} spots left`;
    const displayed = (capacity * 3) + registered;
    return `${title} - ${displayed} people have registered`;
  };

  // Fetch counts for all selected announcement event slugs
  React.useEffect(() => {
    if (announcementEventSlugs.length === 0) return;
    announcementEventSlugs.forEach(slug => {
      if (!slug || announcementCounts[slug]) return;
      fetchEventCounts(slug).then(counts => {
        setAnnouncementCounts(prev => ({ ...prev, [slug]: counts }));
      });
    });
  }, [announcementEventSlugs]);

  const saveAnnouncementConfig = async () => {
    setSavingGeneralAnnouncements(true);
    const slugsValue = announcementEventSlugs.filter(Boolean).join('\n');
    const staticValue = announcementStaticText.trim() || 'plans we dream';

    const saveChatMsgKey = async (key: string, value: string) => {
      const existing = msgs.find(m => m.step_key === key);
      const maxSort = msgs.length > 0 ? Math.max(...msgs.map((m: any) => Number((m as any).sort_order) || 0)) : 0;
      if (existing?.id) {
        await supabase.from('chat_messages').update({ bot_message: value }).eq('id', existing.id);
        setMsgs(prev => prev.map(m => m.id === existing.id ? { ...m, bot_message: value } : m));
      } else {
        const { data } = await supabase.from('chat_messages').insert({
          step_key: key, bot_message: value, flow: 'global', options: [], sort_order: maxSort + 1,
        }).select('*').single();
        if (data) setMsgs(prev => [...prev, data as ChatMsg]);
      }
    };

    await Promise.all([
      saveChatMsgKey('announcement_event_slugs', slugsValue),
      saveChatMsgKey('announcement_static_text', staticValue),
    ]);
    setSavingGeneralAnnouncements(false);
    showToast('Announcements saved!');
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
    setSavingDoubtSettings(false);
    if (!ok1) { showToast('❌ Save failed — check your connection'); return; }
    showToast('Doubt form settings saved!');
  };

  // ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f0' }}>
        <div style={{ color: '#aaa', fontSize: 15 }}>Loading…</div>
      </div>
    );
  }

  if (!adminRole) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f0', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#fff', padding: 40, borderRadius: 16, width: 340, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>chapter அ</div>
          <div style={{ color: '#888', marginBottom: 32 }}>Admin Panel</div>
          {authDenied ? (
            <>
              <div style={{ color: '#dc2626', fontSize: 14, marginBottom: 8 }}>
                This Google account doesn't have admin access.
              </div>
              {debugEmail && <div style={{ color: '#888', fontSize: 11, marginBottom: 20, wordBreak: 'break-all' }}>Signed in as: {debugEmail}</div>}
              <button onClick={logout} style={{ width: '100%', padding: '12px', background: '#f5f5f5', color: '#111', border: '1.5px solid #e0e0e0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Sign out & try another account
              </button>
            </>
          ) : (
            <button
              onClick={login}
              style={{ width: '100%', padding: '12px 16px', background: '#fff', color: '#111', border: '1.5px solid #e0e0e0', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z"/><path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.1 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.6-17.7 11.7z"/><path fill="#FBBC05" d="M24 45c5.5 0 10.4-1.9 14.2-5l-6.6-5.4C29.7 36.3 27 37 24 37c-6 0-10.6-3-11.8-8.4l-7 5.4C8.7 40.5 15.8 45 24 45z"/><path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-.9 2.6-2.6 4.7-4.8 6.1l6.6 5.4C41.5 36.8 45 31 45 24c0-1.3-.2-2.7-.5-4z"/></svg>
              Continue with Google
            </button>
          )}
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
        {adminRole === 'admin' && <button style={s.tab(tab === 'trips')} onClick={() => switchTab('trips')}>Plans</button>}
        {adminRole === 'admin' && <button style={s.tab(tab === 'flow')} onClick={() => switchTab('flow')}>Flow</button>}
        <button style={s.tab(tab === 'people')} onClick={() => { switchTab('people'); loadApplications(); refreshPayuPayments(); }}>People</button>
        {adminRole === 'admin' && <button style={s.tab(tab === 'analytics')} onClick={() => { switchTab('analytics'); loadAnalytics(); }}>Analytics</button>}
        <button style={s.tab(tab === 'settings')} onClick={() => { switchTab('settings'); loadNotifDevices(); }}>⚙ Settings</button>
        <button onClick={logout} style={{ marginLeft: 8, padding: '7px 16px', borderRadius: 99, border: '1.5px solid #e0e0e0', background: '#fff', color: '#666', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Sign out</button>
      </div>

      <div style={{ maxWidth: tab === 'people' ? 1280 : 920, margin: '32px auto', padding: '0 20px' }}>
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
              <button style={s.btn()} onClick={() => { setAddingTrip(true); setEditingTrip({ slug: '', title: '', one_liner: '', timing: '', price_full: 0, price_advance: 0, description: '', hero_image: '', cities: ['Chennai'], category: 'Trips', quick_info: [], included: [], optional_activities: [], not_included: [], announcements: [], booking_url: '', cta_label: '', is_active: true, show_accommodation: false, show_secret_offer: false, accommodation: { stays: [{ name: '', images: ['', '', ''], features: ['', '', ''] }] }, event_dates: [], itinerary: [{ day: 'Day 1', title: '', description: '', schedule: [] }], event_reviews: [], faqs: [], event_media: [{url:'',thumbnail_url:'',caption:''},{url:'',thumbnail_url:'',caption:''},{url:'',thumbnail_url:'',caption:''}], city_details: {} }); }}>
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
              const isGalcodePlan = (plan: Trip) =>
                (plan.quick_info ?? []).some(item =>
                  ['girls only event', "girl's only event", 'girls_only_event'].includes(String(item.label ?? '').trim().toLowerCase()) &&
                  String(item.value ?? '').trim().toLowerCase() !== 'false'
                );
              const planSortBucket = (plan: Trip) => {
                if (!plan.is_active) return 2;
                return isGalcodePlan(plan) ? 1 : 0;
              };
              const sortPlans = (list: Trip[]) => [...list].sort((a, b) => {
                const bucketDiff = planSortBucket(a) - planSortBucket(b);
                if (bucketDiff !== 0) return bucketDiff;
                const dateDiff = getNearestDateTs(a) - getNearestDateTs(b);
                if (dateDiff !== 0) return dateDiff;
                return a.title.localeCompare(b.title);
              });
              const filteredTrips = plansCityFilter === 'all'
                ? trips
                : trips.filter(plan => (plan.cities ?? []).includes(plansCityFilter));
              const sortedTrips = sortPlans(filteredTrips);

              return sortedTrips.length > 0 ? (
                <div>
                  {sortedTrips.map(trip => {
                    const isGalcode = isGalcodePlan(trip);
                    return (
                      <div
                        key={trip.id}
                        style={{
                          ...s.card,
                          opacity: 1,
                          background: s.card.background,
                          border: trip.is_active && isGalcode ? '2px solid #f9a8d4' : 'none',
                        }}
                      >
                        {editingTrip?.id === trip.id ? (
                          <TripForm trip={editingTrip} onChange={setEditingTrip} onSave={() => saveTrip(editingTrip!)} onCancel={() => setEditingTrip(null)} saving={saving === trip.id} s={s} />
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>{trip.title}</div>
                              <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>₹{trip.price_full?.toLocaleString('en-IN')} · {trip.timing}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                              <button style={s.outlineBtn} onClick={() => setEditingTrip(normalizeCityDetails({ ...trip }))}>Edit</button>
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
                    );
                  })}
                </div>
              ) : null;
            })()}

            <CollapsibleSection
              title="Edit Other City Plans"
              badge={`${trips.filter(t => (t.cities ?? []).includes('Other')).length} plan${trips.filter(t => (t.cities ?? []).includes('Other')).length !== 1 ? 's' : ''}`}
            >
              {trips.filter(t => (t.cities ?? []).includes('Other')).length === 0 ? (
                <div style={{ ...s.card, color: '#777' }}>
                  No plans are enabled for Other city users yet. Turn ON <strong>Show In Other City Feed</strong> inside any plan to see it here.
                </div>
              ) : (
                trips
                  .filter(t => (t.cities ?? []).includes('Other'))
                  .map(trip => {
                    const isExpanded = otherEditingId === trip.id;
                    return (
                      <div key={trip.id} style={{ ...s.card, opacity: 1 }}>
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
                  })
              )}
            </CollapsibleSection>

            {addingTrip && editingTrip && !editingTrip.id && (
              <div style={s.card}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>New Trip</div>
                <TripForm trip={editingTrip} onChange={setEditingTrip} onSave={() => saveTrip(editingTrip!)} onCancel={() => { setAddingTrip(false); setEditingTrip(null); }} saving={saving === 'new'} s={s} />
              </div>
            )}
          </>
        )}

        {!loading && tab === 'flow' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, padding: 5, background: '#f3f3f3', borderRadius: 99, width: 'fit-content' }}>
            {([
              ['media', 'Media'],
              ['timelines', 'Timelines'],
              ['faqs', 'FAQs'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setFlowMode(mode)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 99,
                  border: 'none',
                  background: flowMode === mode ? '#111' : '#fff',
                  color: flowMode === mode ? '#fff' : '#555',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  boxShadow: flowMode === mode ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* ── FLOW TAB: MEDIA ───────────────────────────────────────────────── */}
        {!loading && tab === 'flow' && flowMode === 'media' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 20, flex: 1 }}>Media</div>
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
              const isGalcodePlan = (plan: Trip) =>
                (plan.quick_info ?? []).some(item =>
                  ['girls only event', "girl's only event", 'girls_only_event'].includes(String(item.label ?? '').trim().toLowerCase()) &&
                  String(item.value ?? '').trim().toLowerCase() !== 'false'
                );
              const planSortBucket = (plan: Trip) => {
                if (!plan.is_active) return 2;
                return isGalcodePlan(plan) ? 1 : 0;
              };
              const sortPlans = (list: Trip[]) => [...list].sort((a, b) => {
                const bucketDiff = planSortBucket(a) - planSortBucket(b);
                if (bucketDiff !== 0) return bucketDiff;
                const dateDiff = getNearestDateTs(a) - getNearestDateTs(b);
                if (dateDiff !== 0) return dateDiff;
                return a.title.localeCompare(b.title);
              });
              const filteredTrips = mediaCityFilter === 'all'
                ? trips
                : trips.filter(plan => (plan.cities ?? []).includes(mediaCityFilter));
              const sortedTrips = sortPlans(filteredTrips);

              return sortedTrips.length > 0 ? (
                <div>
                  {sortedTrips.map(trip => {
                      const media = trip.event_media ?? [];
                      const videos: EventMedia[] = [0, 1, 2].map(i => media[i] ?? { url: '', thumbnail_url: '', caption: '' });
                      const reviews = trip.event_reviews ?? [];
                      const isExpanded = mediaEditingId === trip.id;
                      const isGalcode = isGalcodePlan(trip);
                      return (
                        <div key={trip.id} style={{ ...s.card, opacity: 1, border: trip.is_active && isGalcode ? '2px solid #f9a8d4' : 'none' }}>
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
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    {groupchatClipboard && (
                                      <button
                                        type="button"
                                        style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12, color: '#16a34a', borderColor: '#86efac' }}
                                        onClick={() => updateTripInList(trip.id!, t => ({ ...t, event_reviews: [...(t.event_reviews ?? []), ...groupchatClipboard] }))}
                                      >
                                        ⎘ Paste ({groupchatClipboard.length})
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }}
                                      onClick={() => { setGroupchatClipboard(reviews.length > 0 ? [...reviews] : null); showToast(`Copied ${reviews.length} message${reviews.length === 1 ? '' : 's'}`); }}
                                      disabled={reviews.length === 0}
                                    >
                                      ⎘ Copy
                                    </button>
                                    <button
                                      type="button"
                                      style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }}
                                      onClick={() => updateTripInList(trip.id!, t => ({ ...t, event_reviews: [...(t.event_reviews ?? []), { name: '', rating: 5, review_text: '', review_count: 0, date_label: '' }] }))}
                                    >
                                      + Add Message
                                    </button>
                                  </div>
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
              ) : null;
            })()}

          </>
        )}

        {/* ── FLOW TAB: TIMELINES ────────────────────────────────────────────── */}
        {!loading && tab === 'flow' && flowMode === 'timelines' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, marginTop: 28 }}>
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
              Use <code style={{ background: '#f0f0ea', borderRadius: 4, padding: '1px 4px' }}>{'{advance}'}</code>, <code style={{ background: '#f0f0ea', borderRadius: 4, padding: '1px 4px' }}>{'{balance}'}</code>, or <code style={{ background: '#f0f0ea', borderRadius: 4, padding: '1px 4px' }}>{'{price}'}</code> in Value to auto-fill prices.
            </div>
            {(() => {
              const getNearestDateTs = (trip: Trip) => {
                const dates = (trip.event_dates ?? []).map(d => new Date(`${d.start_date}T00:00:00`).getTime()).filter(ts => !Number.isNaN(ts));
                return dates.length > 0 ? Math.min(...dates) : Number.MAX_SAFE_INTEGER;
              };
              const isGalcodePlan = (plan: Trip) =>
                (plan.quick_info ?? []).some(item =>
                  ['girls only event', "girl's only event", 'girls_only_event'].includes(String(item.label ?? '').trim().toLowerCase()) &&
                  String(item.value ?? '').trim().toLowerCase() !== 'false'
                );
              const planSortBucket = (plan: Trip) => {
                if (!plan.is_active) return 2;
                return isGalcodePlan(plan) ? 1 : 0;
              };
              const sortPlans = (list: Trip[]) => [...list].sort((a, b) => {
                const bucketDiff = planSortBucket(a) - planSortBucket(b);
                if (bucketDiff !== 0) return bucketDiff;
                const dateDiff = getNearestDateTs(a) - getNearestDateTs(b);
                return dateDiff !== 0 ? dateDiff : a.title.localeCompare(b.title);
              });
              const filtered = timelinesCityFilter === 'all' ? trips : trips.filter(t => (t.cities ?? []).includes(timelinesCityFilter));
              const sortedTrips = sortPlans(filtered);
              return sortedTrips.length > 0 ? (
                <div>
                  {sortedTrips.map(trip => {
                      const sortedDates = (trip.event_dates ?? []).filter(d => d.start_date).sort((a, b) => a.start_date.localeCompare(b.start_date));
                      const hasMultipleDates = sortedDates.length > 1;
                      const selectedDate = sortedDates.length > 0
                        ? (selectedTimelineDates[trip.id!] ?? sortedDates[0]?.start_date ?? '')
                        : '';
                      const editKey = hasMultipleDates ? `${trip.id}:${selectedDate}` : trip.id!;
                      const activeDateRow = sortedDates.find(d => d.start_date === selectedDate);
                      const perDateSteps = (activeDateRow as any)?.booking_steps as Array<{ label: string; value: string; date: string }> | undefined;
                      const isNativeApp = trip.booking_url === 'native-application';
                      const nativeDefaultSteps = [
                        { label: 'vibe check',                       value: 'Request Invitation',      date: '' },
                        { label: 'if you\'re invited (advance)',      value: '{advance}',               date: '' },
                        { label: 'remaining balance',                 value: '{balance}',               date: '' },
                        { label: 'you\'ll receive exact',             value: 'Meeting Spot Details 📍', date: '' },
                        { label: '{application_count} ppl have requested invitation', value: 'Your Plan Name',      date: '' },
                      ];
                      const defaultSteps = isNativeApp
                        ? (trip.booking_steps?.length ? trip.booking_steps : nativeDefaultSteps)
                        : trip.booking_steps ?? [
                          { label: 'Advance', value: '{advance}', date: '' },
                          { label: 'Remaining Balance', value: '{balance}', date: '' },
                          { label: 'Receive', value: 'Pickup, stay & trip details', date: '' },
                        ];
                      const rawSteps: Array<{ label: string; value: string; date: string }> =
                        timelineEdits[editKey] ?? (hasMultipleDates ? (perDateSteps ?? defaultSteps) : defaultSteps);
                      // Native app events always show exactly 5 rows — pad missing steps from defaults
                      // Step 5 (index 4) defaults to the event's own title as value
                      const currentSteps: Array<{ label: string; value: string; date: string }> = isNativeApp
                        ? Array.from({ length: 5 }, (_, i) => {
                            if (rawSteps[i]) return rawSteps[i];
                            const def = nativeDefaultSteps[i];
                            return i === 4 ? { ...def, value: trip.title ?? def.value } : def;
                          })
                        : rawSteps;
                      const setStep = (i: number, patch: Partial<{ label: string; value: string; date: string }>) => {
                        const next = currentSteps.map((s, idx) => idx === i ? { ...s, ...patch } : s);
                        setTimelineEdits(prev => ({ ...prev, [editKey]: next }));
                      };
                      const addStep = () => setTimelineEdits(prev => ({ ...prev, [editKey]: [...currentSteps, { label: '', value: '', date: '' }] }));
                      const removeStep = (i: number) => setTimelineEdits(prev => ({ ...prev, [editKey]: currentSteps.filter((_, idx) => idx !== i) }));
                      const isDirty = !!timelineEdits[editKey] || ctaEdits[trip.id!] !== undefined;
                      const isExpanded = expandedTimelineId === trip.id || isDirty;
                      const isGalcode = isGalcodePlan(trip);
                      return (
                        <div
                          key={trip.id}
                          onClick={() => setExpandedTimelineId(prev => prev === trip.id ? null : trip.id!)}
                          style={{ ...s.card, marginBottom: 12, border: trip.is_active && isGalcode ? '2px solid #f9a8d4' : 'none', cursor: 'pointer' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isExpanded ? 14 : 0 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>{trip.title}</div>
                              {!isExpanded && (
                                <div style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                                  {currentSteps.length} steps{selectedDate ? ` · ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                                </div>
                              )}
                            </div>
                            {isDirty && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <button
                                  style={{ ...s.outlineBtn, fontSize: 12, padding: '6px 14px' }}
                                  disabled={savingTimeline === trip.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    saveTimeline(trip, currentSteps, hasMultipleDates ? selectedDate : undefined, ctaEdits[trip.id!]);
                                  }}
                                >
                                  {savingTimeline === trip.id ? 'Saving…' : 'Save'}
                                </button>
                              </div>
                            )}
                            {!isDirty && (
                              <span style={{ color: '#aaa', fontSize: 18, lineHeight: 1 }}>{isExpanded ? '⌃' : '⌄'}</span>
                            )}
                          </div>

                          {isExpanded && (
                            <div onClick={e => e.stopPropagation()}>
                          {currentSteps.map((step, i) => {
                            const isNowRow = i === 0;
                            // Native app: steps 0 (request invitation) and 4 (enjoy the plan) have no date
                            const nativeNoDate = isNativeApp && (i === 0 || i === 4);
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9f9f7', border: `1px solid ${isNativeApp ? '#e0e7ff' : '#ebebeb'}`, borderRadius: 10, marginBottom: 6 }}>
                                {/* Left: label + value stacked */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <input
                                    style={{ display: 'block', width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 11, fontWeight: 600, color: '#999', padding: 0, marginBottom: 3 }}
                                    placeholder={isNowRow ? 'e.g. Advance' : 'Step label'}
                                    value={step.label}
                                    onChange={e => setStep(i, { label: e.target.value })}
                                  />
                                  <input
                                    style={{ display: 'block', width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 15, fontWeight: 700, color: '#111', padding: 0 }}
                                    placeholder={i === 1 ? '{advance}' : i === 2 ? '{balance}' : 'Value or text'}
                                    value={step.value}
                                    onChange={e => setStep(i, { value: e.target.value })}
                                  />
                                </div>
                                {/* Right: date or fixed pill */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                  {nativeNoDate
                                    ? i === 0
                                      ? <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 99, padding: '4px 10px', whiteSpace: 'nowrap' }}>Now</span>
                                      : <select
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
                                    : isNowRow && !isNativeApp
                                    ? <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 99, padding: '4px 10px', whiteSpace: 'nowrap' }}>Now</span>
                                    : <input
                                        type="date"
                                        style={{ border: '1px solid #ddd', borderRadius: 8, padding: '5px 8px', fontSize: 12, color: '#111', background: '#fff', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                                        value={step.date}
                                        onChange={e => setStep(i, { date: e.target.value })}
                                      />
                                  }
                                  {!isNativeApp && (
                                    <button type="button" onClick={() => removeStep(i)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 18, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>×</button>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Reference row — styled like a step row, dropdown on the right */}
                          {!isNativeApp && sortedDates.length > 0 && (
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
                            {!isNativeApp && (
                              <button type="button" onClick={addStep} style={{ padding: '5px 14px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>+ Add Step</button>
                            )}
                            <div style={{ flex: 1 }}>
                              <label style={{ ...s.label, marginBottom: 4, display: 'block' }}>Booking CTA Label</label>
                              <input
                                style={{ ...s.input, fontSize: 13 }}
                                placeholder="e.g. Request Invitation, Pay Now…"
                                value={ctaEdits[trip.id!] !== undefined ? ctaEdits[trip.id!] : (trip.cta_label ?? '')}
                                onChange={e => setCtaEdits(prev => ({ ...prev, [trip.id!]: e.target.value }))}
                              />
                            </div>
                          </div>
                            </div>
                          )}
                        </div>
                      );
                  })}
                </div>
              ) : null;
            })()}
          </>
        )}

        {/* ── FLOW TAB: AUTOMATIC DOUBT ANSWERS ─────────────────────────────── */}
        {!loading && tab === 'flow' && flowMode === 'faqs' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 20, flex: 1 }}>Automatic Doubt Answers</div>
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
              const isGalcodePlan = (plan: Trip) =>
                (plan.quick_info ?? []).some(item =>
                  ['girls only event', "girl's only event", 'girls_only_event'].includes(String(item.label ?? '').trim().toLowerCase()) &&
                  String(item.value ?? '').trim().toLowerCase() !== 'false'
                );
              const planSortBucket = (plan: Trip) => {
                if (!plan.is_active) return 2;
                return isGalcodePlan(plan) ? 1 : 0;
              };
              const sortPlans = (list: Trip[]) => [...list].sort((a, b) => {
                const bucketDiff = planSortBucket(a) - planSortBucket(b);
                if (bucketDiff !== 0) return bucketDiff;
                const dateDiff = getNearestDateTs(a) - getNearestDateTs(b);
                if (dateDiff !== 0) return dateDiff;
                return a.title.localeCompare(b.title);
              });
              const filteredTrips = qnaCityFilter === 'all'
                ? trips
                : trips.filter(plan => (plan.cities ?? []).includes(qnaCityFilter));
              const sortedTrips = sortPlans(filteredTrips);

              return sortedTrips.length > 0 ? (
                <div>
                  {sortedTrips.map(trip => {
                      const isExpanded = qnaEditingId === trip.id;
                      const faqs = trip.faqs ?? [];
                      const isGalcode = isGalcodePlan(trip);
                      return (
                        <div key={trip.id} style={{ ...s.card, opacity: 1, border: trip.is_active && isGalcode ? '2px solid #f9a8d4' : 'none' }}>
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
                              {/* ── Automatic Doubt Answers (AppFlow booking chat) ── */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <label style={{ ...s.label, marginBottom: 0 }}>Possible Doubts (FAQ)</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  {faqClipboard && (
                                    <button
                                      type="button"
                                      style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12, color: '#16a34a', borderColor: '#86efac' }}
                                      onClick={() => updateTripInList(trip.id!, t => ({ ...t, faqs: [...(t.faqs ?? []), ...faqClipboard] }))}
                                    >
                                      ⎘ Paste ({faqClipboard.length})
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }}
                                    onClick={() => { setFaqClipboard((trip.faqs ?? []).length > 0 ? [...(trip.faqs ?? [])] : null); showToast(`Copied ${(trip.faqs ?? []).length} FAQ${(trip.faqs ?? []).length === 1 ? '' : 's'}`); }}
                                    disabled={(trip.faqs ?? []).length === 0}
                                  >
                                    ⎘ Copy
                                  </button>
                                  <button
                                    type="button"
                                    style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }}
                                    onClick={() => updateTripInList(trip.id!, t => ({ ...t, faqs: [...(t.faqs ?? []), { question: '', answer: '' }] }))}
                                  >
                                    + Add Q&A
                                  </button>
                                </div>
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

                              {/* ── Invitation Doubts (invite chat "I Have a Doubt" flow) ── */}
                              <div style={{ borderTop: '1.5px solid #eee', marginTop: 16, paddingTop: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <div>
                                    <label style={{ ...s.label, marginBottom: 0 }}>Invitation Doubts</label>
                                    <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>Shown as quick-reply chips in the /invite chat "I Have a Doubt" flow.</div>
                                  </div>
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    {inviteFaqClipboard && (
                                      <button
                                        type="button"
                                        style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12, color: '#16a34a', borderColor: '#86efac' }}
                                        onClick={() => updateTripInList(trip.id!, t => ({ ...t, invite_faqs: [...(t.invite_faqs ?? []), ...inviteFaqClipboard] }))}
                                      >
                                        ⎘ Paste ({inviteFaqClipboard.length})
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }}
                                      onClick={() => { setInviteFaqClipboard((trip.invite_faqs ?? []).length > 0 ? [...(trip.invite_faqs ?? [])] : null); showToast(`Copied ${(trip.invite_faqs ?? []).length} invite FAQ${(trip.invite_faqs ?? []).length === 1 ? '' : 's'}`); }}
                                      disabled={(trip.invite_faqs ?? []).length === 0}
                                    >
                                      ⎘ Copy
                                    </button>
                                    <button
                                      type="button"
                                      style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }}
                                      onClick={() => updateTripInList(trip.id!, t => ({ ...t, invite_faqs: [...(t.invite_faqs ?? []), { question: '', answer: '' }] }))}
                                    >
                                      + Add Q&A
                                    </button>
                                  </div>
                                </div>
                                {(trip.invite_faqs ?? []).length === 0 && (
                                  <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No invitation doubts added yet.</div>
                                )}
                                {(trip.invite_faqs ?? []).map((faq, i) => (
                                  <div key={i} style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                      <input
                                        style={s.input}
                                        placeholder="Example: Can I pay advance in person?"
                                        value={faq.question}
                                        onChange={e => updateTripInList(trip.id!, t => {
                                          const next = [...(t.invite_faqs ?? [])];
                                          next[i] = { ...next[i], question: e.target.value };
                                          return { ...t, invite_faqs: next };
                                        })}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => updateTripInList(trip.id!, t => ({ ...t, invite_faqs: [...(t.invite_faqs ?? [])].filter((_, idx) => idx !== i) }))}
                                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                    <textarea
                                      style={s.textarea}
                                      placeholder="Example: No — advance must be paid online to confirm your spot."
                                      value={faq.answer}
                                      onChange={e => updateTripInList(trip.id!, t => {
                                        const next = [...(t.invite_faqs ?? [])];
                                        next[i] = { ...next[i], answer: e.target.value };
                                        return { ...t, invite_faqs: next };
                                      })}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              ) : null;
            })()}
          </>
        )}

        {/* ── PEOPLE TAB (unified: applications + payments + receipts) ──────── */}
        {!loading && tab === 'people' && (() => {
          // Build slug list from invite-only trips so events with 0 applications still appear.
          // Only include slugs that map to a known trip title — this prevents deleted/renamed
          // events from showing up as raw slugs when they still have old applications in the DB.
          const nativeEventSlugs = trips
            .filter(t => (t.invite_only || t.booking_url === 'native-application') && t.slug && t.title)
            .map(t => t.slug as string);

          // Build a phone+event → payu payment index
          const successPayments = payuPayments.filter(p => p.status === 'success');
          const titleBySlug: Record<string, string> = {};
          trips.forEach(t => { if (t.slug && t.title) titleBySlug[t.slug] = t.title; });
          const paymentsFor = (phone: string, eventSlug: string) => {
            const title = titleBySlug[eventSlug] ?? '';
            const matches = successPayments.filter(p =>
              p.phone === phone && (!title || p.event_title === title || !p.event_title)
            );
            return { all: matches };
          };

          // Apply filters
          const searchLower = peopleSearch.trim().toLowerCase();
          const filteredApps = applications.filter(a => {
            const pays = paymentsFor(a.phone, a.event_slug);
            const eventMatch  = applicationsEventFilter  === 'all' || a.event_slug === applicationsEventFilter;
            const statusMatch = applicationsStatusFilter === 'all'
              || (applicationsStatusFilter === 'has_doubt' ? (a.doubts?.length ?? 0) > 0 : a.status === applicationsStatusFilter);
            const searchMatch = !searchLower
              || String(a.name  ?? '').toLowerCase().includes(searchLower)
              || String(a.phone ?? '').includes(searchLower)
              || pays.all.some((p: any) => String(p.txnid ?? '').toLowerCase().includes(searchLower));
            return eventMatch && statusMatch && searchMatch;
          });
          const filteredDoubtSubmissions = (planDoubts ?? []).filter((submission) => {
            const submissionPlan = getDoubtSubmissionPlanName(submission);
            const planMatch = qnaDoubtPlanFilter === 'all'
              ? true
              : submissionPlan.toLowerCase() === qnaDoubtPlanFilter.trim().toLowerCase();
            const cityMatch = qnaDoubtCityFilter === 'all'
              || (submission.city ?? '').toLowerCase().includes(qnaDoubtCityFilter.toLowerCase());
            return planMatch && cityMatch;
          });

          const statusColor = (status: string) => {
            if (status === 'fully_paid')   return '#16a34a';
            if (status === 'advance_paid') return '#84cc16';
            if (status === 'invited')      return '#2196f3';
            if (status === 'waitlist')     return '#a855f7';
            if (status === 'pending')      return '#f97316';
            if (status === 'rejected')     return '#dc2626';
            return '#999';
          };

          const callStatusOptions = [
            { value: 'not_called',     label: 'Not Called' },
            { value: 'called',         label: 'Called' },
            { value: 'callback',       label: 'Callback' },
            { value: 'has_doubts',     label: 'Has Doubts' },
            { value: 'not_interested', label: 'Not Interested' },
            { value: 'no_answer',      label: 'No Answer' },
          ];

          const callBadgeColor = (cs: string) => {
            if (cs === 'called')         return '#16a34a';
            if (cs === 'callback')       return '#f97316';
            if (cs === 'has_doubts')     return '#9333ea';
            if (cs === 'not_interested') return '#dc2626';
            if (cs === 'no_answer')      return '#64748b';
            return '#555';
          };

          const modeChip = (m: typeof peopleMode, label: string, emoji: string) => (
            <button
              key={m}
              onClick={() => setPeopleMode(m)}
              style={{
                padding: '8px 18px',
                borderRadius: 99,
                border: 'none',
                background: peopleMode === m ? '#111' : '#fff',
                color: peopleMode === m ? '#fff' : '#555',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: peopleMode === m ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ marginRight: 6 }}>{emoji}</span>{label}
            </button>
          );

          // Count summary for footer
          const counts = {
            total:        peopleMode === 'doubts' ? filteredDoubtSubmissions.length : filteredApps.length,
            pending:      filteredApps.filter(a => a.status === 'pending').length,
            invited:      filteredApps.filter(a => a.status === 'invited').length,
            waitlist:     filteredApps.filter(a => a.status === 'waitlist').length,
            advance_paid: filteredApps.filter(a => a.status === 'advance_paid').length,
            fully_paid:   filteredApps.filter(a => a.status === 'fully_paid').length,
          };

          // Header columns per mode
          const headers: Record<typeof peopleMode, string[]> =
            peopleMode === 'call'
              ? { call: ['Name', 'Phone', 'Event', 'Why Join', 'Call Status', 'Notes', 'Date', 'Action'], approval: [], payments: [], doubts: [] }
              : peopleMode === 'approval'
              ? { call: [], approval: ['Plan Name', 'Why Join', 'Action'], payments: [], doubts: [] }
              : peopleMode === 'payments'
              ? { call: [], approval: [], payments: ['Name', 'Plan', 'Status', 'Transaction IDs'], doubts: [] }
              : { call: [], approval: [], payments: [], doubts: ['Name / Doubt', 'Plan', 'City', 'Reporting Date', 'Phone', 'Reply'] };

          return (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, fontSize: 22 }}>People</div>
                <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>
                  {counts.total} {peopleMode === 'doubts' ? (counts.total === 1 ? 'doubt' : 'doubts') : (counts.total === 1 ? 'person' : 'people')}
                </span>
                <div style={{ flex: 1 }} />
                <button
                  onClick={() => { loadApplications(); refreshPayuPayments(); }}
                  disabled={applicationsLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fff', cursor: applicationsLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: '#444', opacity: applicationsLoading ? 0.55 : 1 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: applicationsLoading ? 'spin 0.8s linear infinite' : 'none' }}>
                    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  {applicationsLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>

              {/* Mode switcher */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, padding: 5, background: '#f3f3f3', borderRadius: 99, width: 'fit-content' }}>
                {modeChip('call', 'Call', '📞')}
                {modeChip('approval', 'Approval', '✅')}
                {modeChip('payments', 'Payments', '💰')}
                {modeChip('doubts', 'Doubts', '💬')}
              </div>

              {/* Filters row */}
              {peopleMode !== 'doubts' ? (
              <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={applicationsEventFilter}
                  onChange={e => setApplicationsEventFilter(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', cursor: 'pointer', fontWeight: 500 }}
                >
                  <option value="all">All Events</option>
                  {nativeEventSlugs.map(slug => (
                    <option key={slug} value={slug}>{titleBySlug[slug] ?? slug}</option>
                  ))}
                </select>
                <select
                  value={applicationsStatusFilter}
                  onChange={e => setApplicationsStatusFilter(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', cursor: 'pointer', fontWeight: 500 }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="invited">Invited</option>
                  <option value="waitlist">Waitlist</option>
                  <option value="advance_paid">Advance Paid</option>
                  <option value="fully_paid">Fully Paid</option>
                  <option value="has_doubt">Raised Doubt</option>
                </select>
                <input
                  type="text"
                  placeholder="Search name or phone…"
                  value={peopleSearch}
                  onChange={e => setPeopleSearch(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', minWidth: 220 }}
                />
                {(applicationsEventFilter !== 'all' || applicationsStatusFilter !== 'all' || peopleSearch) && (
                  <button onClick={() => { setApplicationsEventFilter('all'); setApplicationsStatusFilter('all'); setPeopleSearch(''); }} style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
                )}
              </div>
              ) : (
              <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={qnaDoubtCityFilter}
                  onChange={e => setQnaDoubtCityFilter(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', cursor: 'pointer', fontWeight: 500 }}
                >
                  <option value="all">All Cities</option>
                  {orderedCities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
                <select
                  value={qnaDoubtPlanFilter}
                  onChange={e => setQnaDoubtPlanFilter(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', cursor: 'pointer', fontWeight: 500 }}
                >
                  <option value="all">All Plans</option>
                  {qnaDoubtPlans.map(plan => <option key={plan} value={plan}>{plan}</option>)}
                </select>
                {(qnaDoubtCityFilter !== 'all' || qnaDoubtPlanFilter !== 'all') && (
                  <button onClick={() => { setQnaDoubtCityFilter('all'); setQnaDoubtPlanFilter('all'); }} style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
                )}
              </div>
              )}

              {/* Loading / Empty */}
              {applicationsLoading && <div style={{ color: '#888', textAlign: 'center', padding: 40 }}>Loading…</div>}
              {!applicationsLoading && peopleMode !== 'doubts' && filteredApps.length === 0 && (
                <div style={{ ...s.card, color: '#888', textAlign: 'center' }}>No people match the current filters.</div>
              )}
              {!applicationsLoading && peopleMode === 'doubts' && doubtsLoadError && (
                <div style={{ ...s.card, background: '#fff5f5', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 13, padding: '12px 16px' }}>
                  <strong>⚠️ Could not load doubts</strong><br />
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{doubtsLoadError}</span>
                </div>
              )}
              {!applicationsLoading && peopleMode === 'doubts' && !doubtsLoadError && filteredDoubtSubmissions.length === 0 && (
                <div style={{ ...s.card, color: '#888', textAlign: 'center' }}>No doubt submissions match the current filters.</div>
              )}

              {!applicationsLoading && peopleMode === 'doubts' && filteredDoubtSubmissions.length > 0 && (
                <div style={{ ...s.card, overflow: 'hidden', padding: 0 }}>
                  {filteredDoubtSubmissions.map((submission, index) => {
                    const eventName = getDoubtSubmissionPlanName(submission) || '-';
                    const doubtText = submission.doubt || submission.message || '-';
                    const submitterName = (submission.name ?? '').trim() || '-';
                    const cityText = (submission.city ?? '').trim() || '-';
                    const reportingDateText = (submission.reporting_date ?? '').trim() || '-';
                    const submittedAt = submission.submitted_at || submission.created_at
                      ? new Date(submission.submitted_at ?? submission.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '-';
                    const phoneDigits = (submission.phone ?? '').replace(/\D/g, '');
                    const contactMessage = `Hi ${submission.name ? submission.name.split(' ')[0] : 'there'}, we're reaching out from chapter அ regarding your doubt about ${eventName}.`;
                    const contactHref = phoneDigits ? `https://wa.me/91${phoneDigits.slice(-10)}?text=${encodeURIComponent(contactMessage)}` : '';
                    const isLast = index === filteredDoubtSubmissions.length - 1;

                    return (
                      <div
                        key={submission.id ?? `${submission.phone ?? 'submission'}-${index}`}
                        style={{ padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid #f0f0f0' }}
                      >
                        {/* Doubt text — primary, full width, fully readable */}
                        <p style={{ fontSize: 15, color: '#111', lineHeight: 1.55, margin: '0 0 10px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {doubtText}
                        </p>

                        {/* Meta row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#888', minWidth: 0 }}>
                            <span style={{ fontWeight: 600, color: '#444' }}>{submitterName}</span>
                            <span style={{ color: '#ccc' }}>·</span>
                            <span>{eventName}</span>
                            {cityText !== '-' && <><span style={{ color: '#ccc' }}>·</span><span>{cityText}</span></>}
                            {(reportingDateText !== '-' || submittedAt !== '-') && (
                              <><span style={{ color: '#ccc' }}>·</span><span>{reportingDateText !== '-' ? reportingDateText : submittedAt}</span></>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            {phoneDigits && (
                              <span style={{ fontSize: 12, color: '#555', fontVariantNumeric: 'tabular-nums' }}>
                                +91 {phoneDigits.slice(-10)}
                              </span>
                            )}
                            {phoneDigits ? (
                              <a
                                href={contactHref}
                                target="_blank"
                                rel="noreferrer"
                                style={{ ...s.outlineBtn, display: 'inline-block', padding: '5px 14px', fontSize: 12, textDecoration: 'none' }}
                              >
                                Reply on WhatsApp
                              </a>
                            ) : (
                              <span style={{ fontSize: 12, color: '#aaa' }}>No Number</span>
                            )}
                            {(() => {
                              const sid = submission.id ?? `${submission.phone}-${submission.submitted_at}`;
                              const alreadyApproved = approvedDoubtIds.has(sid);
                              const isApproving = approvingDoubtId === sid;
                              return (
                                <button
                                  onClick={() => approveDoubtSubmission(submission)}
                                  disabled={isApproving || alreadyApproved}
                                  title="Approve & create invite"
                                  style={{
                                    padding: '5px 12px',
                                    fontSize: 12,
                                    borderRadius: 8,
                                    border: '1px solid #d1d5db',
                                    background: alreadyApproved ? '#f0fdf4' : '#fafafa',
                                    color: alreadyApproved ? '#16a34a' : '#6b7280',
                                    cursor: isApproving || alreadyApproved ? 'default' : 'pointer',
                                    fontWeight: 500,
                                    opacity: isApproving ? 0.6 : 1,
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {isApproving ? '…' : alreadyApproved ? '✓ Approved' : 'Approve'}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Table */}
              {!applicationsLoading && peopleMode !== 'doubts' && filteredApps.length > 0 && (
                <div style={{ ...s.card, overflow: 'auto', padding: 0 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#fafafa' }}>
                        {headers[peopleMode].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '11px 12px', borderBottom: '1px solid #ececec', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: '#888', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApps.map(app => {
                        const callSt  = callStatusEdits[app.id] ?? app.call_status ?? 'not_called';
                        const callNt  = callNotesEdits[app.id]  ?? app.call_notes  ?? '';
                        const isDirty = callSt !== (app.call_status ?? 'not_called') || callNt !== (app.call_notes ?? '');
                        const pays = paymentsFor(app.phone, app.event_slug);
                        const eventTitle = titleBySlug[app.event_slug] ?? app.event_slug ?? '—';

                        // ─── CALL MODE ───
                        const openDoubts = (app.doubts ?? []).filter((d: any) => d.status !== 'closed');
                        if (peopleMode === 'call') return (
                          <tr key={app.id} style={{ borderBottom: '1px solid #f0f0f0', verticalAlign: 'top', background: openDoubts.length > 0 ? '#fffbeb' : undefined }}>
                            <td style={{ padding: '11px 12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {app.name || '—'}
                              {openDoubts.length > 0 && (
                                <span title={`${openDoubts.length} unresolved doubt${openDoubts.length === 1 ? '' : 's'}`} style={{ marginLeft: 6, background: '#fde047', color: '#854d0e', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                                  💬 {openDoubts.length}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                              <a href={`tel:${app.phone}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>{app.phone || '—'}</a>
                            </td>
                            <td style={{ padding: '11px 12px', color: '#555', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={eventTitle}>{eventTitle}</td>
                            <td style={{ padding: '11px 12px', color: '#555', maxWidth: 220 }}>
                              <div style={{ maxHeight: 56, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{app.why_join || '—'}</div>
                            </td>
                            <td style={{ padding: '11px 12px' }}>
                              <select
                                value={callSt}
                                onChange={e => setCallStatusEdits(prev => ({ ...prev, [app.id]: e.target.value }))}
                                style={{ background: callBadgeColor(callSt) + '22', color: callBadgeColor(callSt), border: `1px solid ${callBadgeColor(callSt)}44`, borderRadius: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer', fontWeight: 600, minWidth: 120 }}
                              >
                                {callStatusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: '11px 12px', minWidth: 200 }}>
                              {openDoubts.length > 0 && (
                                <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {openDoubts.slice(0, 3).map((d: any) => (
                                    <div key={d.id} style={{ background: '#fef3c7', borderLeft: '3px solid #f59e0b', borderRadius: 4, padding: '5px 8px', fontSize: 12, color: '#78350f', lineHeight: 1.4 }}>
                                      <div style={{ fontSize: 10, color: '#92400e', fontWeight: 600, marginBottom: 2 }}>💬 {formatAdminDateTime(d.created_at)}</div>
                                      {d.message}
                                    </div>
                                  ))}
                                  {openDoubts.length > 3 && (
                                    <div style={{ fontSize: 10, color: '#92400e', fontWeight: 600 }}>+{openDoubts.length - 3} more</div>
                                  )}
                                </div>
                              )}
                              <input
                                type="text"
                                placeholder="Call notes…"
                                value={callNt}
                                onChange={e => setCallNotesEdits(prev => ({ ...prev, [app.id]: e.target.value }))}
                                style={{ background: '#fff', color: '#333', border: '1.5px solid #e0e0e0', borderRadius: 6, padding: '5px 9px', fontSize: 12, width: '100%', outline: 'none' }}
                              />
                            </td>
                            <td style={{ padding: '11px 12px', color: '#888', whiteSpace: 'nowrap', fontSize: 11 }}>{formatAdminDateTime(app.created_at)}</td>
                            <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                              {isDirty ? (
                                <button
                                  disabled={savingCallId === app.id}
                                  onClick={() => saveCallInfo(app.id)}
                                  style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: savingCallId === app.id ? 'not-allowed' : 'pointer', opacity: savingCallId === app.id ? 0.6 : 1, fontWeight: 600 }}
                                >
                                  {savingCallId === app.id ? 'Saving…' : 'Save'}
                                </button>
                              ) : app.status === 'pending' ? (
                                <button
                                  disabled={approvingId === app.id}
                                  onClick={() => approveApplication(app.id)}
                                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: approvingId === app.id ? 'not-allowed' : 'pointer', opacity: approvingId === app.id ? 0.6 : 1, fontWeight: 600 }}
                                >
                                  {approvingId === app.id ? 'Sending…' : '✓ Approve'}
                                </button>
                              ) : (
                                <span style={{ background: statusColor(app.status) + '22', color: statusColor(app.status), borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{String(app.status ?? '').replace(/_/g, ' ')}</span>
                              )}
                            </td>
                          </tr>
                        );

                        // ─── APPROVAL MODE ───
                        if (peopleMode === 'approval') return (
                          <tr key={app.id} style={{ borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' }}>
                            <td style={{ padding: '11px 12px', color: '#555', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }} title={eventTitle}>{eventTitle}</td>
                            <td style={{ padding: '11px 12px', color: '#444', maxWidth: 520 }}>
                              <div style={{ maxHeight: 80, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>{app.why_join || '—'}</div>
                            </td>
                            <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                              {app.status === 'pending' ? (
                                <button
                                  disabled={approvingId === app.id}
                                  onClick={() => approveApplication(app.id)}
                                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: approvingId === app.id ? 'not-allowed' : 'pointer', opacity: approvingId === app.id ? 0.6 : 1, fontWeight: 700 }}
                                >
                                  {approvingId === app.id ? 'Sending…' : '✓ Approve'}
                                </button>
                              ) : (
                                <span style={{ fontSize: 12, color: statusColor(app.status), fontWeight: 700, textTransform: 'capitalize' }}>
                                  ✓ {String(app.status ?? '').replace(/_/g, ' ')}
                                </span>
                              )}
                            </td>
                          </tr>
                        );

                        // ─── PAYMENTS MODE ───
                        return (
                          <tr key={app.id} style={{ borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' }}>
                            <td style={{ padding: '11px 12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{app.name || '—'}</td>
                            <td style={{ padding: '11px 12px', color: '#555', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={eventTitle}>{eventTitle}</td>
                            <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                              <span style={{ background: statusColor(app.status) + '22', color: statusColor(app.status), border: `1px solid ${statusColor(app.status)}44`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                                {String(app.status ?? 'pending').replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td style={{ padding: '11px 12px', fontSize: 11, color: '#888', maxWidth: 200 }}>
                              {pays.all.length === 0 ? (
                                <span style={{ color: '#bbb' }}>—</span>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  {pays.all.map((p: any) => (
                                    <span key={p.id ?? p.txnid} title={p.txnid} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      <span style={{ color: p.payment_type === 'balance' ? '#9333ea' : '#0891b2', fontWeight: 600, marginRight: 4 }}>
                                        {p.payment_type === 'balance' ? 'BAL' : 'ADV'}
                                      </span>
                                      {p.txnid}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary footer */}
              {!applicationsLoading && peopleMode !== 'doubts' && filteredApps.length > 0 && (
                <div style={{ marginTop: 18, color: '#888', fontSize: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span>Total: <b style={{ color: '#333' }}>{counts.total}</b></span>
                  {counts.pending      > 0 && <span style={{ color: statusColor('pending')      }}>pending: <b>{counts.pending}</b></span>}
                  {counts.invited      > 0 && <span style={{ color: statusColor('invited')      }}>invited: <b>{counts.invited}</b></span>}
                  {counts.waitlist     > 0 && <span style={{ color: statusColor('waitlist')     }}>waitlist: <b>{counts.waitlist}</b></span>}
                  {counts.advance_paid > 0 && <span style={{ color: statusColor('advance_paid') }}>advance paid: <b>{counts.advance_paid}</b></span>}
                  {counts.fully_paid   > 0 && <span style={{ color: statusColor('fully_paid')   }}>fully paid: <b>{counts.fully_paid}</b></span>}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── PLANS TAB: GLOBAL MESSAGES ───────────────────────────────────── */}
        {!loading && tab === 'trips' && (
          <>
            <CollapsibleSection title="Edit Global Messages" defaultOpen={false}>
            <div style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>
              You can use dynamic variables like <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{city}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{category}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{title}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{reporting_date}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{meeting_spot}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{transport}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{reporting_time}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{name}'}</code>, <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{phone}'}</code> and <code style={{ background: '#f0f0f0', padding: '1px 6px', borderRadius: 4 }}>{'{doubt}'}</code>.
            </div>
            <CollapsibleSection title="Global Announcements" defaultOpen={true}>
              {/* Event slots — dynamic, computed from live data */}
              <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
                {announcementEventSlugs.map((slug, idx) => {
                  const inviteOnlyEvents = trips.filter(t => t.invite_only || t.booking_url === 'native-application');
                  const preview = slug ? computeAnnouncementText(slug) : null;
                  return (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <select
                          style={{ ...s.input, marginBottom: 4 }}
                          value={slug}
                          onChange={e => {
                            const newSlug = e.target.value;
                            setAnnouncementEventSlugs(prev => prev.map((s, i) => i === idx ? newSlug : s));
                            // fetch counts for newly selected event
                            if (newSlug && !announcementCounts[newSlug]) {
                              fetchEventCounts(newSlug).then(counts =>
                                setAnnouncementCounts(prev => ({ ...prev, [newSlug]: counts }))
                              );
                            }
                          }}
                        >
                          <option value="">— select an event —</option>
                          {inviteOnlyEvents.map(t => (
                            <option key={t.slug} value={t.slug}>{t.title}</option>
                          ))}
                        </select>
                        {preview && (
                          <div style={{ fontSize: 11, color: '#666', padding: '3px 8px', background: '#f5f5f5', borderRadius: 6, fontFamily: 'monospace' }}>
                            preview: {preview}
                          </div>
                        )}
                      </div>
                      <button
                        style={{ ...s.btn('#dc2626'), padding: '6px 10px', fontSize: 13, marginTop: 2, flexShrink: 0 }}
                        onClick={() => setAnnouncementEventSlugs(prev => prev.filter((_, i) => i !== idx))}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                style={{ ...s.btn('#111'), padding: '6px 14px', fontSize: 13, marginBottom: 16 }}
                onClick={() => setAnnouncementEventSlugs(prev => [...prev, ''])}
              >
                + Add Event Slot
              </button>

              {/* Static text field */}
              <div style={{ marginBottom: 12 }}>
                <label style={s.label}>Static announcement (always shown)</label>
                <input
                  style={s.input}
                  value={announcementStaticText}
                  onChange={e => setAnnouncementStaticText(e.target.value)}
                  placeholder="plans we dream"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button style={s.btn(savingGeneralAnnouncements ? '#aaa' : '#111')} disabled={savingGeneralAnnouncements} onClick={saveAnnouncementConfig}>
                  {savingGeneralAnnouncements ? 'Saving…' : 'Save Global Announcements'}
                </button>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Global Pre Selection Messages" defaultOpen={true}>
              {[
                { key: 'welcome', label: 'Select City', placeholder: "Welcome to chapter அ! 👋 Which city are you from buddy?" },
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

	              {[
	                { key: 'ask_pickup_city_1',    label: 'Meeting Points Message — 1 city',    hint: 'Variables: {city1}, {eventname}, {spots_left}, {eventdate}',                            placeholder: 'This plan has a meeting point in {city1}.' },
	                { key: 'ask_pickup_city_2',    label: 'Meeting Points Message — 2 cities',  hint: 'Variables: {city1}, {city2}, {eventname}, {spots_left}',                                placeholder: 'This plan has meeting points in {city1} & {city2}.' },
	                { key: 'ask_pickup_city_many', label: 'Meeting Points Message — 3+ cities', hint: 'Variables: {cities_list} (numbered list), {eventname}, {spots_left}',                   placeholder: 'This plan has meeting points in:\n{cities_list}' },
	                { key: 'ask_own_transport_city', label: 'Own Transport Message', hint: 'Shown after user taps "I’m from another city".', placeholder: 'You can join us at any of these meeting points with your own transport 🙂' },
	              ].map(({ key, label, hint, placeholder }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={s.label}>{label}</label>
                  <p style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>{hint}</p>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button style={s.btn(savingDoubtSettings ? '#aaa' : '#111')} disabled={savingDoubtSettings} onClick={saveDoubtFormSettings}>
                  {savingDoubtSettings ? 'Saving…' : 'Save Doubt Settings'}
                </button>
              </div>
              </div>
            </CollapsibleSection>
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

        {/* ── SETTINGS TAB ─────────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Push Notifications */}
            <CollapsibleSection title="Push Notifications" defaultOpen={true}>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
                Enable push notifications on this device to get alerted when:<br />
                <strong>📋 New application</strong> submitted · <strong>💛 Advance paid</strong> · <strong>✅ Fully paid</strong> · <strong>💬 New doubt</strong> message from a user
              </p>

              {/* Subscribe this device */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                <input
                  style={{ ...s.input, flex: 1, minWidth: 160, maxWidth: 260, marginBottom: 0 }}
                  placeholder='Device label (e.g. "Krutesh iPhone")'
                  value={notifLabel}
                  onChange={e => setNotifLabel(e.target.value)}
                />
                <button
                  style={{
                    ...s.btn(notifStatus === 'subscribed' ? '#16a34a' : notifStatus === 'error' ? '#dc2626' : '#111'),
                    padding: '9px 18px', fontSize: 14, flexShrink: 0,
                    opacity: notifStatus === 'requesting' ? 0.6 : 1,
                  }}
                  disabled={notifStatus === 'requesting'}
                  onClick={subscribeThisDevice}
                >
                  {notifStatus === 'requesting' ? '…' :
                   notifStatus === 'subscribed' ? '✓ Notifications On' :
                   notifStatus === 'error'      ? 'Retry' :
                   '🔔 Enable on This Device'}
                </button>
              </div>

              {/* Subscribed devices list */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#888', letterSpacing: '0.05em', textTransform: 'uppercase', margin: 0 }}>
                    Subscribed Devices {notifDevices.length > 0 && `(${notifDevices.length})`}
                  </p>
                  <button style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onClick={loadNotifDevices}>
                    {notifDevicesLoading ? 'Loading…' : 'Refresh'}
                  </button>
                </div>
                {notifDevices.length === 0 && !notifDevicesLoading && (
                  <p style={{ fontSize: 13, color: '#aaa', fontStyle: 'italic' }}>No devices subscribed yet.</p>
                )}
                {notifDevices.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: '#f5f5f5', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</span>
                      <span style={{ fontSize: 11, color: '#999', marginLeft: 8 }}>
                        {new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <button
                      style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                      onClick={() => removeNotifDevice(d.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                  <strong>One-time setup required:</strong> Run this in the Supabase SQL editor once to wire up the DB triggers, replacing with your actual service role key (found at Supabase Dashboard → Settings → API):<br />
                  <code style={{ display: 'block', marginTop: 6, padding: '6px 10px', background: '#fff', borderRadius: 6, fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all' }}>
                    ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key-here';
                  </code>
                  Also add <strong>VAPID_PUBLIC_KEY</strong>, <strong>VAPID_PRIVATE_KEY</strong>, and <strong>VAPID_SUBJECT</strong> secrets to the <code>send-admin-push</code> Edge Function (same values as <code>send-push-notification</code>).
                </p>
              </div>
            </CollapsibleSection>

          </div>
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
  const [newCityInput, setNewCityInput] = React.useState('');
  const [contentCityTab, setContentCityTab] = React.useState('');
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
  const setGangSize = (value: string) => {
    const next = quickInfo.filter(item => item.label !== 'Group Size');
    const trimmed = value.trim();
    const capacity = trimmed === '' ? null : Number(trimmed);
    onChange({
      ...trip,
      quick_info: trimmed ? [...next, { icon: 'users', label: 'Group Size', value: trimmed }] : next,
      invite_spots: Number.isFinite(capacity) ? capacity : null,
      total_capacity: Number.isFinite(capacity) ? capacity : null,
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
  // Native application events always have exactly 5 fixed steps (label + date editable, value locked):
  //   1. Request Invitation  2. Pay Advance ({advance})  3. Pay Balance ({balance})
  //   4. Get Meeting Point Details  5. Enjoy the Plan
  // Non-native: free-form, index 0 = "Now" row (no date), 1+ have date pickers
  const isNativeAppEvent = trip.booking_url === 'native-application';
  const nativeAppDefaultSteps = [
    { label: 'vibe check',                       value: 'Request Invitation',      date: '' },
    { label: 'if you\'re invited (advance)',      value: '{advance}',               date: '' },
    { label: 'remaining balance',                 value: '{balance}',               date: '' },
    { label: 'you\'ll receive exact',             value: 'Meeting Spot Details 📍', date: '' },
    { label: '{application_count} ppl have requested invitation', value: 'Your Plan Name',      date: '' },
  ];
  const bookingSteps = isNativeAppEvent
    ? (trip.booking_steps?.length ? trip.booking_steps : nativeAppDefaultSteps)
    : trip.booking_steps?.length ? trip.booking_steps : [
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
  const addPickup = () => onChange({ ...trip, pickup_points: [...pickups, { id: `pt_${Date.now()}`, label: '', meetingSpot: '', time: '', transport: '', forCity: (trip.cities ?? []).filter(c => c !== 'Other')[0] ?? '' }] });
  const removePickup = (i: number) => onChange({ ...trip, pickup_points: pickups.filter((_, idx) => idx !== i) });
  const ownTransportIndex = pickups.findIndex(p => p.id === 'own_transport');
  const ownTransport = ownTransportIndex >= 0 ? pickups[ownTransportIndex] : null;
  // Show all non-own_transport, non-OtherCity pickup points (includes new forCity points + legacy untagged)
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

  // ── City-specific content helpers ──────────────────────────────────────────
  const contentCities = (trip.cities ?? []).filter((c: string) => c !== 'Other');
  const activeContentCity = contentCityTab || contentCities[0] || '';
  const multiCity = contentCities.length > 1;

  const getCityData = (city: string) => {
    const cd = (trip.city_details ?? {}) as any;
    // If city-specific data has been saved, use it.
    // Otherwise fall back to the flat event-level fields so existing content
    // stays visible in the admin panel until explicitly overridden per city.
    if (cd[city] !== undefined) return cd[city];
    return {
      included: trip.included ?? [],
      not_included: trip.not_included ?? [],
      optional_activities: trip.optional_activities ?? [],
      itinerary: trip.itinerary ?? [],
    };
  };
  const setCityData = (city: string, data: any) =>
    onChange({ ...trip, city_details: { ...(trip.city_details ?? {}), [city]: data } });
  const setCityField = (city: string, key: string, val: any) =>
    setCityData(city, { ...getCityData(city), [key]: val });

  const updateCityStringItem = (key: 'included' | 'not_included' | 'optional_activities', index: number, value: string) => {
    if (!multiCity) { updateStringListItem(key, index, value); return; }
    const current = [...(getCityData(activeContentCity)[key] ?? [])]; current[index] = value;
    setCityField(activeContentCity, key, current);
  };
  const addCityStringItem = (key: 'included' | 'not_included' | 'optional_activities') => {
    if (!multiCity) { addStringListItem(key); return; }
    setCityField(activeContentCity, key, [...(getCityData(activeContentCity)[key] ?? []), '']);
  };
  const removeCityStringItem = (key: 'included' | 'not_included' | 'optional_activities', index: number) => {
    if (!multiCity) { removeStringListItem(key, index); return; }
    setCityField(activeContentCity, key, (getCityData(activeContentCity)[key] ?? []).filter((_: any, i: number) => i !== index));
  };

  const activeCityItinerary: ItineraryDay[] = multiCity
    ? (getCityData(activeContentCity).itinerary ?? [])
    : itinerary;

  const updateCityItineraryDay = (index: number, patch: Partial<ItineraryDay>) => {
    if (!multiCity) { updateItineraryDay(index, patch); return; }
    const cur = getCityData(activeContentCity).itinerary ?? [];
    setCityField(activeContentCity, 'itinerary', cur.map((d: any, i: number) => i === index ? { ...d, ...patch } : d));
  };
  const addCityItineraryDay = () => {
    if (!multiCity) { addItineraryDay(); return; }
    const cur = getCityData(activeContentCity).itinerary ?? [];
    setCityField(activeContentCity, 'itinerary', [...cur, { day: `Day ${cur.length + 1}`, title: '', description: '', schedule: [] }]);
  };
  const removeCityItineraryDay = (index: number) => {
    if (!multiCity) { removeItineraryDay(index); return; }
    const cur = getCityData(activeContentCity).itinerary ?? [];
    setCityField(activeContentCity, 'itinerary', cur.filter((_: any, i: number) => i !== index));
  };
  const updateCityScheduleItem = (dayIndex: number, itemIndex: number, patch: Partial<ItineraryScheduleItem>) => {
    if (!multiCity) { updateScheduleItem(dayIndex, itemIndex, patch); return; }
    const cur = getCityData(activeContentCity).itinerary ?? [];
    setCityField(activeContentCity, 'itinerary', cur.map((d: any, i: number) =>
      i === dayIndex ? { ...d, schedule: (d.schedule ?? []).map((item: any, j: number) => j === itemIndex ? { ...item, ...patch } : item) } : d
    ));
  };
  const addCityScheduleItem = (dayIndex: number) => {
    if (!multiCity) { addScheduleItem(dayIndex); return; }
    const cur = getCityData(activeContentCity).itinerary ?? [];
    setCityField(activeContentCity, 'itinerary', cur.map((d: any, i: number) =>
      i === dayIndex ? { ...d, schedule: [...(d.schedule ?? []), { time: '', activity: '' }] } : d
    ));
  };
  const removeCityScheduleItem = (dayIndex: number, itemIndex: number) => {
    if (!multiCity) { removeScheduleItem(dayIndex, itemIndex); return; }
    const cur = getCityData(activeContentCity).itinerary ?? [];
    setCityField(activeContentCity, 'itinerary', cur.map((d: any, i: number) =>
      i === dayIndex ? { ...d, schedule: (d.schedule ?? []).filter((_: any, j: number) => j !== itemIndex) } : d
    ));
  };

  // Inline city radio tab strip (reused in two sections)
  const CityTabs = multiCity ? () => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
      {contentCities.map((city: string) => (
        <button
          key={city}
          type="button"
          onClick={() => setContentCityTab(city)}
          style={{
            padding: '5px 14px', borderRadius: 99, cursor: 'pointer', fontWeight: 600, fontSize: 12,
            border: activeContentCity === city ? '2px solid #111' : '1.5px solid #ddd',
            background: activeContentCity === city ? '#111' : '#fff',
            color: activeContentCity === city ? '#fff' : '#555',
          }}
        >
          {city}
        </button>
      ))}
    </div>
  ) : () => null;

  const field = (label: string, key: keyof Trip, type = 'text') => (
    <div style={{ marginBottom: 14 }}>
      <label style={s.label}>{label}</label>
      <input type={type} style={s.input} value={(trip[key] as string) ?? ''} onChange={e => set(key, type === 'number' ? Number(e.target.value) : e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} />
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
          {/* Booking Type */}
          <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
            <label style={s.label}>Booking Type</label>
            <div style={{ display: 'flex', gap: 0, marginBottom: 10, border: '1.5px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
              {([
                { mode: 'invite-only', label: 'Invite Only',  bookingUrl: 'native-application', inviteOnly: true  },
                { mode: 'open-event',  label: 'Open Event',   bookingUrl: 'payu-hosted',        inviteOnly: false },
                { mode: 'external',    label: 'External Link', bookingUrl: '',                  inviteOnly: false },
              ] as const).map(option => {
                const current =
                  trip.booking_url === 'native-application' ? 'invite-only' :
                  trip.booking_url === 'payu-hosted'        ? 'open-event'  :
                  'external';
                const active = current === option.mode;
                return (
                  <button
                    key={option.mode}
                    type="button"
                    onClick={() => onChange({ ...trip, booking_url: option.bookingUrl, invite_only: option.inviteOnly })}
                    style={{ flex: 1, padding: '9px 14px', border: 'none', background: active ? '#111' : '#fafafa', color: active ? '#fff' : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {/* External Link: URL input */}
            {trip.booking_url !== 'native-application' && trip.booking_url !== 'payu-hosted' && (
              <input
                style={s.input}
                placeholder="https://tally.so/r/..."
                value={trip.booking_url}
                onChange={e => set('booking_url', e.target.value)}
              />
            )}

            {/* Invite Only: total spots */}
            {trip.booking_url === 'native-application' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <label style={{ ...s.label, marginBottom: 0, whiteSpace: 'nowrap' }}>Total Spots</label>
                <input
                  type="number"
                  min={0}
                  style={{ ...s.input, width: 90, marginBottom: 0 }}
                  placeholder="e.g. 35"
                  value={gangSizeNumber}
                  onChange={e => setGangSize(e.target.value)}
                />
                <span style={{ fontSize: 12, color: '#999' }}>same as Gang Size (whitelist can be larger)</span>
              </div>
            )}

            {/* Open Event: total capacity */}
            {trip.booking_url === 'payu-hosted' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <label style={{ ...s.label, marginBottom: 0, whiteSpace: 'nowrap' }}>Total Capacity</label>
                <input
                  type="number"
                  min={1}
                  style={{ ...s.input, width: 90, marginBottom: 0 }}
                  placeholder="e.g. 20"
                  value={gangSizeNumber}
                  onChange={e => setGangSize(e.target.value)}
                />
                <span style={{ fontSize: 12, color: '#999' }}>same as Gang Size (for sold-out indicator)</span>
              </div>
            )}
          </div>

          {/* Cities */}
          <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
            <label style={s.label}>Visible In Cities</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {(trip.cities ?? []).filter(c => c !== 'Other').map(city => (
                <span key={city} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px 5px 14px', borderRadius: 99, border: '1.5px solid #6366f1', background: '#6366f1', color: '#fff', fontWeight: 600, fontSize: 13 }}>
                  {city}
                  <button type="button" onClick={() => set('cities', (trip.cities ?? []).filter(c => c !== city))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0, opacity: 0.75 }}>×</button>
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

          {/* Per-city pricing */}
          {(trip.cities ?? []).filter(c => c !== 'Other').length > 0 && (
            <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
              <label style={s.label}>City Pricing</label>
              {(trip.cities ?? []).filter(c => c !== 'Other').map((city: string) => {
                const cd = (trip.city_details ?? {}) as any;
                const cityPriceFull    = cd[city]?.price_full    ?? trip.price_full    ?? 0;
                const cityPriceAdvance = cd[city]?.price_advance ?? trip.price_advance ?? 0;
                return (
                  <div key={city} style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 10 }}>
                    <span style={{ minWidth: 90, fontWeight: 700, fontSize: 13, color: '#333', paddingBottom: 8 }}>{city}</span>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 4 }}>Full Price (₹)</label>
                      <input
                        type="number"
                        style={{ ...s.input, marginBottom: 0 }}
                        value={cityPriceFull}
                        onChange={e => {
                          const cd2 = (trip.city_details ?? {}) as any;
                          onChange({ ...trip, city_details: { ...cd2, [city]: { ...(cd2[city] ?? {}), price_full: Number(e.target.value) } } });
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'block', marginBottom: 4 }}>Advance (₹)</label>
                      <input
                        type="number"
                        style={{ ...s.input, marginBottom: 0 }}
                        value={cityPriceAdvance}
                        onChange={e => {
                          const cd2 = (trip.city_details ?? {}) as any;
                          onChange({ ...trip, city_details: { ...cd2, [city]: { ...(cd2[city] ?? {}), price_advance: Number(e.target.value) } } });
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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
                <div key={idx}>
                  <ImageUploadInput
                    value={heroImages[idx] ?? ''}
                    onChange={url => setHeroImage(idx, url)}
                    placeholder={`Hero Image ${idx + 1} — paste URL or upload`}
                    folder="hero"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── LOGISTICS ── */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 14 }}>Logistics</div>

      <CollapsibleSection title="The Plan">
        <CityTabs />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={s.label}>Meeting Spot{multiCity ? ` — ${activeContentCity}` : ''}</label>
            <input
              style={s.input}
              placeholder="e.g. Airport Metro"
              value={multiCity ? (getCityData(activeContentCity).meeting_spot ?? meetingSpotValue) : meetingSpotValue}
              onChange={e => multiCity
                ? setCityField(activeContentCity, 'meeting_spot', e.target.value)
                : setPlanValue(['Meeting Spot'], 'Meeting Spot', e.target.value, 'map')}
            />
          </div>
          <div>
            <label style={s.label}>Transport{multiCity ? ` — ${activeContentCity}` : ''}</label>
            <input
              style={s.input}
              placeholder="e.g. Party Bus"
              value={multiCity ? (getCityData(activeContentCity).transport ?? transportValue) : transportValue}
              onChange={e => multiCity
                ? setCityField(activeContentCity, 'transport', e.target.value)
                : setPlanValue(['Transport'], 'Transport', e.target.value, 'bus')}
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
              onChange={e => setGangSize(e.target.value)}
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
                <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} style={s.input} placeholder="0 = same day, -1 = previous day" value={p.dateOffset ?? 0} onChange={e => setPickup(p._idx, 'dateOffset', Number(e.target.value))} />
              </div>
              <div>
                <label style={s.label}>Other City Price (₹)</label>
                <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} min={0} style={s.input} placeholder="Leave blank = base event price" value={p.otherPrice ?? ''} onChange={e => setPickup(p._idx, 'otherPrice', e.target.value === '' ? undefined : Number(e.target.value))} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={s.label}>Other City Advance (₹)</label>
                <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} min={0} style={s.input} placeholder="Leave blank = event advance amount" value={p.otherAdvance ?? ''} onChange={e => setPickup(p._idx, 'otherAdvance', e.target.value === '' ? undefined : Number(e.target.value))} />
              </div>
            </div>
            {/* For City — radio buttons (one per event city, excluding Other) */}
            {(() => {
              const citiesForRadio = (trip.cities ?? []).filter(c => c !== 'Other');
              if (citiesForRadio.length === 0) return null;
              return (
                <div style={{ marginBottom: 8 }}>
                  <label style={{ ...s.label, marginBottom: 4 }}>For City <span style={{ color: '#dc2626' }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {citiesForRadio.map(city => {
                      const selected = (p.forCity ?? '') === city;
                      return (
                        <button
                          key={city}
                          type="button"
                          onClick={() => setPickup(p._idx, 'forCity', city)}
                          style={{
                            padding: '5px 14px',
                            borderRadius: 99,
                            border: `1.5px solid ${selected ? '#111' : '#ddd'}`,
                            background: selected ? '#111' : '#fff',
                            color: selected ? '#fff' : '#555',
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: 'pointer',
                          }}
                        >
                          {city}
                        </button>
                      );
                    })}
                  </div>
                  {!p.forCity && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>Select a city for this pickup point</div>}
                </div>
              );
            })()}
            <button onClick={() => removePickup(p._idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addPickup} style={{ marginTop: 4, padding: '7px 16px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Add Pickup Point</button>
      </CollapsibleSection>

      <CollapsibleSection title="Trip Dates" badge={`${dates.length} date${dates.length !== 1 ? 's' : ''}`}>
        {dates.length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No dates added yet.</div>}
        {dates.map((d, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, padding: '10px 12px', background: '#f9f9f9', borderRadius: 10, border: '1px solid #eee' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isNativeAppEvent ? '1fr auto auto' : '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
              <input type="date" style={s.input} value={d.start_date} onChange={e => setDate(i, 'start_date', e.target.value)} />
              {isNativeAppEvent ? (
                <div style={{ color: '#16a34a', background: '#dcfce7', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '9px 12px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  Spots auto
                </div>
              ) : (
                <select style={s.input} value={d.status} onChange={e => setDate(i, 'status', e.target.value as TripDate['status'])}>
                  <option value="available">Available</option>
                  <option value="selling_out">Selling Out</option>
                  <option value="sold_out">Sold Out</option>
                </select>
              )}
              <button onClick={() => removeDate(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
            </div>
            <input
              type="url"
              style={{ ...s.input, fontSize: 12 }}
              placeholder="WhatsApp group link (https://chat.whatsapp.com/...)"
              value={d.whatsapp_group_url ?? ''}
              onChange={e => setDate(i, 'whatsapp_group_url', e.target.value)}
            />
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
                <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} min={0} style={s.input} placeholder="e.g. 4999" value={ownTransport.ownTransportPrice ?? 0} onChange={e => setOwnTransport({ ownTransportPrice: Number(e.target.value) })} />
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
                <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} min={0} style={s.input} placeholder="Leave blank = same as own transport price" value={ownTransport.otherPrice ?? ''} onChange={e => setOwnTransport({ otherPrice: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
              <div>
                <label style={s.label}>Other City Advance (₹)</label>
                <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} min={0} style={s.input} placeholder="Leave blank = event advance amount" value={ownTransport.otherAdvance ?? ''} onChange={e => setOwnTransport({ otherAdvance: e.target.value === '' ? undefined : Number(e.target.value) })} />
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
        <CityTabs />
        {activeCityItinerary.length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No itinerary days yet.</div>}
        {activeCityItinerary.map((day, dayIndex) => (
          <div key={`${activeContentCity}-${dayIndex}`} style={{ background: '#f9f9f9', border: '1.5px solid #eee', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <input style={s.input} placeholder="Day label (e.g. Day 1)" value={day.day} onChange={e => updateCityItineraryDay(dayIndex, { day: e.target.value })} />
              <input style={s.input} placeholder="Day title" value={day.title} onChange={e => updateCityItineraryDay(dayIndex, { title: e.target.value })} />
              <button type="button" onClick={() => removeCityItineraryDay(dayIndex)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
            </div>
            <textarea style={s.textarea} placeholder="Day description" value={day.description} onChange={e => updateCityItineraryDay(dayIndex, { description: e.target.value })} />
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ ...s.label, marginBottom: 0 }}>Schedule</label>
                <button type="button" style={{ ...s.outlineBtn, padding: '4px 12px', fontSize: 12 }} onClick={() => addCityScheduleItem(dayIndex)}>+ Add Time Slot</button>
              </div>
              {(day.schedule ?? []).length === 0 && <div style={{ color: '#aaa', fontSize: 13, marginBottom: 6 }}>No time slots yet.</div>}
              {(day.schedule ?? []).map((item, itemIndex) => (
                <div key={itemIndex} style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input style={s.input} placeholder="e.g. 7:30 PM" value={item.time} onChange={e => updateCityScheduleItem(dayIndex, itemIndex, { time: e.target.value })} />
                  <input style={s.input} placeholder="Activity" value={item.activity} onChange={e => updateCityScheduleItem(dayIndex, itemIndex, { activity: e.target.value })} />
                  <button type="button" onClick={() => removeCityScheduleItem(dayIndex, itemIndex)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button type="button" onClick={addCityItineraryDay} style={{ marginTop: 4, padding: '7px 16px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Add Day</button>
      </CollapsibleSection>

      <CollapsibleSection title="What's Included & Activities">
        <CityTabs />

        <div style={{ fontWeight: 700, fontSize: 13, color: '#555', marginBottom: 8 }}>✓ Included</div>
        {(multiCity ? (getCityData(activeContentCity).included ?? []) : (trip.included ?? [])).length === 0 && (
          <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No items yet.</div>
        )}
        {(multiCity ? (getCityData(activeContentCity).included ?? []) : (trip.included ?? [])).map((item: string, i: number) => (
          <div key={`inc-${activeContentCity}-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input style={s.input} placeholder="e.g. Round-trip transport" value={item} onChange={e => updateCityStringItem('included', i, e.target.value)} />
            <button type="button" onClick={() => removeCityStringItem('included', i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => addCityStringItem('included')} style={{ marginTop: 4, marginBottom: 18, padding: '7px 16px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Add</button>

        <div style={{ fontWeight: 700, fontSize: 13, color: '#555', marginBottom: 8 }}>○ Optional Add-ons</div>
        {(multiCity ? (getCityData(activeContentCity).optional_activities ?? []) : (trip.optional_activities ?? [])).length === 0 && (
          <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No items yet.</div>
        )}
        {(multiCity ? (getCityData(activeContentCity).optional_activities ?? []) : (trip.optional_activities ?? [])).map((item: string, i: number) => (
          <div key={`opt-${activeContentCity}-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input style={s.input} placeholder="e.g. Sunrise hike" value={item} onChange={e => updateCityStringItem('optional_activities', i, e.target.value)} />
            <button type="button" onClick={() => removeCityStringItem('optional_activities', i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => addCityStringItem('optional_activities')} style={{ marginTop: 4, marginBottom: 18, padding: '7px 16px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Add</button>

        <div style={{ fontWeight: 700, fontSize: 13, color: '#555', marginBottom: 8 }}>✗ Not Included</div>
        {(multiCity ? (getCityData(activeContentCity).not_included ?? []) : (trip.not_included ?? [])).length === 0 && (
          <div style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No items yet.</div>
        )}
        {(multiCity ? (getCityData(activeContentCity).not_included ?? []) : (trip.not_included ?? [])).map((item: string, i: number) => (
          <div key={`notinc-${activeContentCity}-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input style={s.input} placeholder="e.g. Lunch" value={item} onChange={e => updateCityStringItem('not_included', i, e.target.value)} />
            <button type="button" onClick={() => removeCityStringItem('not_included', i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => addCityStringItem('not_included')} style={{ marginTop: 4, padding: '7px 16px', background: 'transparent', color: '#555', border: '1.5px solid #ddd', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>+ Add</button>
      </CollapsibleSection>

      {trip.id && (
        <InvitedNumbersSection
          eventSlug={trip.invite_slug || trip.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || trip.slug || trip.id}
          applicationEventSlug={trip.slug || trip.id}
          cities={trip.cities ?? []}
          s={s}
        />
      )}

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
                <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} min={0} style={s.input} placeholder="e.g. 4999" value={ownTransport.ownTransportPrice ?? 0} onChange={e => setOwnTransport({ ownTransportPrice: Number(e.target.value) })} />
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
                <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} min={0} style={s.input} placeholder="Leave blank = same as own transport price" value={ownTransport.otherPrice ?? ''} onChange={e => setOwnTransport({ otherPrice: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
              <div>
                <label style={s.label}>Other City Advance (₹)</label>
                <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} min={0} style={s.input} placeholder="Leave blank = event advance amount" value={ownTransport.otherAdvance ?? ''} onChange={e => setOwnTransport({ otherAdvance: e.target.value === '' ? undefined : Number(e.target.value) })} />
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
                <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} min={0} style={s.input} placeholder="Leave blank = base event price" value={point.otherPrice ?? ''} onChange={e => setPickup(point._idx, { otherPrice: e.target.value === '' ? undefined : Number(e.target.value) })} />
              </div>
              <div>
                <label style={s.label}>Other City Advance (₹)</label>
                <input type="number" onWheel={e => (e.target as HTMLInputElement).blur()} min={0} style={s.input} placeholder="Leave blank = event advance amount" value={point.otherAdvance ?? ''} onChange={e => setPickup(point._idx, { otherAdvance: e.target.value === '' ? undefined : Number(e.target.value) })} />
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

function InvitedNumbersSection({ eventSlug, applicationEventSlug, cities = [], s }: { eventSlug: string; applicationEventSlug: string; cities?: string[]; s: any }) {
  // Named cities (non-Other) that have been set up on this event
  const namedCities = cities.filter(c => c !== 'Other');
  const hasCityTabs = namedCities.length > 1;

  // 'All' means no city filter; otherwise a specific city name
  const [selectedCity, setSelectedCity] = React.useState<string>('All');

  const [count, setCount] = React.useState<number | null>(null);
  const [pasteText, setPasteText] = React.useState('');
  const [pasteStatus, setPasteStatus] = React.useState('');
  const [csvStatus, setCsvStatus] = React.useState('');
  const [csvParsed, setCsvParsed] = React.useState<string[]>([]);
  const [csvFileName, setCsvFileName] = React.useState('');
  const [clearing, setClearing] = React.useState(false);
  const [showNumbers, setShowNumbers] = React.useState(false);
  const [savedNumbers, setSavedNumbers] = React.useState<{ phone: string; city: string | null }[]>([]);
  const [loadingNumbers, setLoadingNumbers] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const buildQuery = React.useCallback((base: any, city: string) => {
    if (city === 'All') return base;
    return base.eq('city', city);
  }, []);

  const fetchCount = React.useCallback(async () => {
    if (!eventSlug) return;
    let q = supabase.from('invited_numbers').select('id', { count: 'exact', head: true }).eq('event_slug', eventSlug);
    q = buildQuery(q, selectedCity);
    const { count: c } = await q;
    setCount(c ?? 0);
  }, [eventSlug, selectedCity, buildQuery]);

  const fetchNumbers = React.useCallback(async () => {
    if (!eventSlug) return;
    setLoadingNumbers(true);
    let q = supabase.from('invited_numbers').select('phone, city').eq('event_slug', eventSlug).order('city', { ascending: true }).order('phone', { ascending: true });
    q = buildQuery(q, selectedCity);
    const { data } = await q;
    setSavedNumbers((data ?? []).map((r: any) => ({ phone: r.phone, city: r.city ?? null })));
    setLoadingNumbers(false);
  }, [eventSlug, selectedCity, buildQuery]);

  const handleToggleNumbers = () => {
    if (!showNumbers) fetchNumbers();
    setShowNumbers(v => !v);
  };

  // Refetch when city tab changes
  React.useEffect(() => {
    setShowNumbers(false);
    fetchCount();
  }, [fetchCount]);

  const parseNumbers = (text: string): string[] => {
    const parts = text.split(/[\n,]+/).map(p => normalizePhone(p)).filter(p => p.length >= 10 && /^\d+$/.test(p)).map(p => p.slice(-10));
    return [...new Set(parts)];
  };

  const syncApplicationsForInvites = async (phones: string[], cityValue: string | null): Promise<{ synced: number; error: string }> => {
    if (phones.length === 0 || !applicationEventSlug) return { synced: 0, error: '' };

    const protectedStatuses = new Set(['advance_paid', 'fully_paid']);
    let synced = 0;
    let lastError = '';

    for (let i = 0; i < phones.length; i += 500) {
      const batchPhones = phones.slice(i, i + 500);
      const { data: existingRows, error: fetchError } = await supabase
        .from('applications')
        .select('id, phone, status')
        .eq('event_slug', applicationEventSlug)
        .in('phone', batchPhones);

      if (fetchError) {
        lastError = fetchError.message;
        continue;
      }

      const existingByPhone = new Map((existingRows ?? []).map((row: any) => [String(row.phone), row]));
      const rowsToInsert = batchPhones
        .filter(phone => !existingByPhone.has(phone))
        .map(phone => ({
          event_slug: applicationEventSlug,
          name: 'Invited Guest',
          phone,
          gender: '',
          why_join: 'Added from invited list',
          attended_before: '',
          status: 'invited',
          selected_city: cityValue,
        }));
      const idsToPromote = (existingRows ?? [])
        .filter((row: any) => !protectedStatuses.has(String(row.status ?? '')))
        .map((row: any) => row.id)
        .filter(Boolean);

      if (rowsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('applications').insert(rowsToInsert);
        if (insertError) {
          // Some public insert policies only allow the native form shape/status=pending.
          // Insert a form-compatible row, then promote it to invited below.
          const pendingRows = rowsToInsert.map(row => ({ ...row, status: 'pending' }));
          const { error: pendingInsertError } = await supabase.from('applications').insert(pendingRows);
          if (pendingInsertError) {
            lastError = pendingInsertError.message || insertError.message;
          } else {
            const { data: insertedRows, error: refetchError } = await supabase
              .from('applications')
              .select('id')
              .eq('event_slug', applicationEventSlug)
              .in('phone', pendingRows.map(row => row.phone));
            const insertedIds = (insertedRows ?? []).map((row: any) => row.id).filter(Boolean);
            if (refetchError) {
              lastError = refetchError.message;
              synced += pendingRows.length;
            } else if (insertedIds.length > 0) {
              const { error: promoteError } = await supabase
                .from('applications')
                .update({ status: 'invited', selected_city: cityValue })
                .in('id', insertedIds);
              if (promoteError) lastError = promoteError.message;
              synced += pendingRows.length;
            }
          }
        } else synced += rowsToInsert.length;
      }

      if (idsToPromote.length > 0) {
        const { error: updateError } = await supabase
          .from('applications')
          .update({ status: 'invited', selected_city: cityValue })
          .in('id', idsToPromote);
        if (updateError) lastError = updateError.message;
        else synced += idsToPromote.length;
      }
    }

    return { synced, error: lastError };
  };

  const upsertNumbers = async (phones: string[]): Promise<{ saved: number; synced: number; error: string }> => {
    if (phones.length === 0) return { saved: 0, synced: 0, error: '' };
    const cityValue = (hasCityTabs && selectedCity !== 'All') ? selectedCity : null;
    const rows = phones.map(phone => ({ event_slug: eventSlug, phone, city: cityValue }));
    let saved = 0;
    let lastError = '';
    for (let i = 0; i < rows.length; i += 500) {
      const batch = rows.slice(i, i + 500);
      const { error } = await supabase.from('invited_numbers').upsert(batch, { onConflict: 'event_slug,phone', ignoreDuplicates: true });
      if (error) { lastError = error.message; }
      else saved += batch.length;
    }
    const { synced, error: syncError } = await syncApplicationsForInvites(phones, cityValue);
    return { saved, synced, error: lastError || syncError };
  };

  const handleSavePaste = async () => {
    const phones = parseNumbers(pasteText);
    if (phones.length === 0) { setPasteStatus('No valid numbers found.'); return; }
    setPasteStatus('Saving…');
    const { saved, synced, error } = await upsertNumbers(phones);
    await fetchCount();
    setPasteStatus(error ? `Error: ${error}` : `${saved} numbers saved. ${synced} application rows synced.`);
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
    const { saved, synced, error } = await upsertNumbers(csvParsed);
    await fetchCount();
    setCsvStatus(error ? `Error: ${error}` : `${saved} numbers imported. ${synced} application rows synced.`);
    setCsvParsed([]);
    setCsvFileName('');
  };

  const handleClearAll = async () => {
    const scopeLabel = (hasCityTabs && selectedCity !== 'All') ? `${selectedCity} numbers` : 'ALL invited numbers';
    if (!window.confirm(`Clear ${scopeLabel} for "${eventSlug}"? This cannot be undone.`)) return;
    setClearing(true);
    let q: any = supabase.from('invited_numbers').delete().eq('event_slug', eventSlug);
    if (hasCityTabs && selectedCity !== 'All') q = q.eq('city', selectedCity);
    await q;
    await fetchCount();
    setClearing(false);
  };

  const cityTabs = ['All', ...namedCities];

  return (
    <CollapsibleSection title="Invited Numbers" badge={count !== null ? `${count} saved` : undefined} badgeColor="#7c3aed">
      <div style={{ display: 'grid', gap: 14 }}>

        {/* City radio tabs — only shown for multi-city events */}
        {hasCityTabs && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {cityTabs.map(city => (
              <button
                key={city}
                type="button"
                onClick={() => setSelectedCity(city)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 99,
                  border: selectedCity === city ? '2px solid #7c3aed' : '1.5px solid #ddd',
                  background: selectedCity === city ? '#7c3aed' : '#fff',
                  color: selectedCity === city ? '#fff' : '#555',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#4c1d95' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span>
              <strong>{count !== null ? count : '…'}</strong> {hasCityTabs && selectedCity !== 'All' ? <><strong>{selectedCity}</strong> </> : ''}numbers on invite list for <code style={{ background: '#ede9fe', padding: '1px 6px', borderRadius: 4 }}>{eventSlug}</code>
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
                  {clearing ? 'Clearing…' : hasCityTabs && selectedCity !== 'All' ? `Clear ${selectedCity}` : 'Clear All'}
                </button>
              )}
            </div>
          </div>

          {showNumbers && (
            <div style={{ marginTop: 10, borderTop: '1px solid #ddd6fe', paddingTop: 10 }}>
              {loadingNumbers ? (
                <p style={{ fontSize: 12, color: '#7c3aed', margin: 0 }}>Loading…</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '4px 12px', maxHeight: 200, overflowY: 'auto' }}>
                  {savedNumbers.map((entry, i) => (
                    <span key={entry.phone} style={{ fontSize: 12, fontFamily: 'monospace', color: '#4c1d95', padding: '2px 0' }}>
                      {i + 1}. {entry.phone}{selectedCity === 'All' && entry.city ? <span style={{ fontSize: 11, color: '#7c3aed', marginLeft: 4 }}>({entry.city})</span> : null}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label style={s.label}>
            Paste Phone Numbers
            {hasCityTabs && selectedCity !== 'All' && (
              <span style={{ fontWeight: 400, color: '#7c3aed', marginLeft: 6 }}>→ will be saved as <strong>{selectedCity}</strong></span>
            )}
          </label>
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
