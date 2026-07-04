// chaptera admin panel
import React, { useState, useEffect, useRef } from 'react';
import { supabase, parseHeroImages, fetchEventCounts, fetchEventDateCounts } from './supabase';

// ─── IMAGE INPUT ──────────────────────────────────────────────────────────────
// We use Cloudinary for image hosting and paste the resulting URL here. The
// earlier file-upload-to-Supabase-Storage button was removed in the security
// hardening pass: the storage.objects policies that backed it had been left
// wide-open to anon (anyone could delete/replace any image in the bucket).
// The `folder` prop is retained for call-site compatibility but unused.
function ImageUploadInput({
  value, onChange, placeholder, style: extraStyle,
}: {
  value: string; onChange: (url: string) => void; placeholder?: string; folder?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', ...extraStyle }}>
      <input
        style={{ flex: 1, padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, background: '#fafafa', outline: 'none', minWidth: 0 }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? 'Paste Cloudinary URL'}
      />
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
  // 'split' = advance + remaining balance (default). 'full' = single payment
  // for the full price (advance is ignored; status jumps straight to paid).
  payment_mode?: string;
  // Creator affiliate commissions: off by default. When on, a fully-paid ticket
  // booked via a creator's link pays affiliate_commission_pct% (default 8) of the
  // full price. See the Creators tab.
  affiliate_enabled?: boolean;
  affiliate_commission_pct?: number;
  description: string;
  // Meeting spot shown on the community sheet's Essentials card
  start_location?: string;
  hero_image: string | string[];
  founders_note_url?: string;
  cities: string[];
  category: string;
  quick_info?: Array<{ icon?: string; label: string; value: string }>;
  included: string[];
  optional_activities: string[];
  not_included: string[];
  announcements?: string[];
  booking_url: string;
  // 'whatsapp' = free community event; plans chat opens a WhatsApp sheet
  // (booking_url = invite link, description = "The Essentials" copy).
  // DB CHECK constraint allows only 'payment' | 'whatsapp' | NULL.
  booking_flow?: string | null;
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
type AffiliateStat = { clicks: number; apps: number; tickets: number; earned: number; unpaid: number };
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

// Default native-application booking-timeline steps for a payment mode.
// Single-pay = 4 rows (one entry payment); split = 5 rows (advance + balance).
// Last row is the gold social-proof row (event title).
function nativeDefaultBookingSteps(isFullPay: boolean, title: string): Array<{ label: string; value: string; date: string }> {
  const titleRow = { label: '{application_count} ppl have requested invitation', value: title || 'Your Plan Name', date: '' };
  return isFullPay
    ? [
        { label: 'vibe check',            value: 'Request Invitation',      date: '' },
        { label: "if you're invited",     value: '{price}',                 date: '' },
        { label: "you'll receive exact",  value: 'Meeting Spot Details 📍', date: '' },
        titleRow,
      ]
    : [
        { label: 'vibe check',                  value: 'Request Invitation',      date: '' },
        { label: "if you're invited (advance)", value: '{advance}',               date: '' },
        { label: 'remaining balance',           value: '{balance}',               date: '' },
        { label: "you'll receive exact",        value: 'Meeting Spot Details 📍', date: '' },
        titleRow,
      ];
}

// True when stored steps structurally match the payment mode: split must have a
// {balance} row; single must NOT. Used to auto-heal steps left over from a mode
// switch (e.g. a single-pay event flipped to split keeps its old {price}-only rows).
function bookingStepsMatchMode(steps: Array<{ label: string; value: string }> | undefined | null, isFullPay: boolean): boolean {
  if (!steps?.length) return false;
  const hasBalance = steps.some(s => /\{balance\}/i.test(`${s.label} ${s.value}`));
  return isFullPay ? !hasBalance : hasBalance;
}

// Rebuild steps for a new payment mode, preserving dates on the rows whose role
// survives the switch (request-invitation, meeting-spot, social-proof). Only the
// payment rows are structurally reset.
function regenNativeBookingSteps(existing: Array<{ label: string; value: string; date: string }> | undefined, isFullPay: boolean, title: string) {
  const prevDate = (re: RegExp) => (existing ?? []).find(s => re.test(`${s.label} ${s.value}`))?.date ?? '';
  const inviteDate  = prevDate(/request invitation|vibe check/i);
  const meetingDate = prevDate(/meeting spot|you'?ll receive/i);
  const socialDate  = prevDate(/application_count/i);
  return nativeDefaultBookingSteps(isFullPay, title).map(s => {
    const k = `${s.label} ${s.value}`;
    if (/request invitation|vibe check/i.test(k)) return { ...s, date: inviteDate };
    if (/meeting spot|you'?ll receive/i.test(k)) return { ...s, date: meetingDate };
    if (/application_count/i.test(k))            return { ...s, date: socialDate };
    return s; // payment rows reset to blank date
  });
}

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

// ─── AUDIT LOG HELPER (H10) ─────────────────────────────────────────────────
//
// Fire-and-forget audit logger used by every state-changing admin action.
// The server-side log_admin_action() function re-validates is_admin()
// against the caller's JWT, so a tampered client call can't fake entries.
// Failures are swallowed — logging must never block the real action.
async function logAdminAction(
  action: string,
  targetTable?: string | null,
  targetId?: string | null,
  details: Record<string, unknown> = {},
) {
  try {
    await supabase.rpc('log_admin_action', {
      p_action:       action,
      p_target_table: targetTable ?? null,
      p_target_id:    targetId    ?? null,
      p_details:      details,
    });
  } catch (e) {
    console.warn('[audit] log_admin_action failed:', e);
  }
}

// Price shown in trip summaries should match what checkout actually charges: a
// per-city override (city_details[city].price_full > 0) wins over the plan-level
// price_full (which can be a stale default). Mirrors create-payu-order's cityPrices.
function tripDisplayPrice(trip: Trip): number {
  const cd = (trip.city_details ?? {}) as Record<string, { price_full?: number }>;
  const firstCity = (trip.cities ?? []).find(c => c && c.toLowerCase() !== 'other');
  if (firstCity) {
    const key = Object.keys(cd).find(k => k.toLowerCase() === firstCity.toLowerCase());
    const cityFull = key ? Number(cd[key]?.price_full) : 0;
    if (cityFull > 0) return cityFull;
  }
  return Number(trip.price_full) || 0;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [adminRole, setAdminRole] = useState<'admin' | 'ops' | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authDenied, setAuthDenied] = useState(false);
  const [debugEmail, setDebugEmail] = useState<string>('');
  const [tab, setTab] = useState<'trips' | 'flow' | 'people' | 'marketers' | 'affiliates' | 'analytics' | 'settings'>(
    () => (localStorage.getItem('adminTab') as 'trips' | 'flow' | 'people' | 'marketers' | 'affiliates' | 'analytics' | 'settings') ?? 'people'
  );
  const switchTab = (t: 'trips' | 'flow' | 'people' | 'marketers' | 'affiliates' | 'analytics' | 'settings') => { setTab(t); localStorage.setItem('adminTab', t); };
  // L4: probe whether the deployed create-payu-order function is pointed at
  // PayU's test or live gateway. Surfaced as a badge in the header so it's
  // immediately obvious whether real money is at stake.
  const [payuMode, setPayuMode] = useState<'live' | 'test' | 'unknown' | 'loading'>('loading');
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) { setPayuMode('unknown'); return; }
    fetch(`${supabaseUrl}/functions/v1/create-payu-order?probe=mode`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: { mode?: string }) => setPayuMode(d.mode === 'live' || d.mode === 'test' ? d.mode : 'unknown'))
      .catch(() => setPayuMode('unknown'));
  }, []);
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
  const [savingDateId, setSavingDateId] = useState<string | null>(null);
  const [analyticsSummary, setAnalyticsSummary] = useState<any | null>(null);
  const [conversionFunnel, setConversionFunnel] = useState<any | null>(null);
  // Most recent weekly DB-storage snapshot (cron writes one every Monday).
  // Used by the small footer line in the analytics tab so the admin can
  // catch unusual growth before the 500 MB Supabase free tier becomes tight.
  const [storageReport, setStorageReport] = useState<{ total_db_size_pretty: string; free_tier_pct: number; taken_at: string; biggest?: { table: string; pretty: string } } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // ── Marketers feature state ────────────────────────────────────────────
  // currentMarketer: call_marketers row matching the logged-in user's email,
  // or null if they're not a marketer (admin-only ops). Drives the banner +
  // tells the People-tab UI to behave as "my leads" instead of "all leads".
  // marketers + marketerStats are admin-only — populated when admin opens
  // the Marketers tab. event_marketers_map: { event_slug → marketer_id[] }
  // for the event-edit form's marketer multi-select.
  const [currentMarketer, setCurrentMarketer] = useState<{ id: string; name: string; email: string; commission_amount: number } | null>(null);
  const [myCommissionStats, setMyCommissionStats] = useState<{ total: number; ticketCount: number } | null>(null);
  const [marketers, setMarketers] = useState<Array<{ id: string; email: string; name: string; commission_amount: number; active: boolean }>>([]);
  // id → name map for tagging each lead's marketer in the admin Call view.
  const [marketerNameById, setMarketerNameById] = useState<Record<string, string>>({});
  // Transparent team board (active marketers' tickets sold + earned, all-time),
  // shown on the marketer's People tab. Peers' names + totals only.
  const [marketerBoard, setMarketerBoard] = useState<Array<{ marketer_id: string; name: string; tickets_sold: number; estimated_earning: number }>>([]);
  // Performance tab: founder P&L summary (RPC) + editable fixed-costs ledger.
  const [marketersLoading, setMarketersLoading] = useState(false);
  const [perfSummary, setPerfSummary] = useState<any | null>(null);
  const [fixedCosts, setFixedCosts] = useState<Array<{ id: string; label: string; amount: number; active: boolean }>>([]);
  const [costEdits, setCostEdits] = useState<Record<string, string>>({});
  const [newFixedLabel, setNewFixedLabel] = useState('');
  const [newFixedAmount, setNewFixedAmount] = useState('');
  const [marketerStats, setMarketerStats] = useState<Record<string, { total: number; ticketCount: number }>>({});
  const [eventMarketersMap, setEventMarketersMap] = useState<Record<string, string[]>>({});
  // Per-date booking counts for the events the logged-in marketer is assigned to.
  // Keyed slug → { 'YYYY-MM-DD' → { registered, reserved } }. Reserved is the
  // TRUE total (all marketers + direct bookings) via the SECURITY DEFINER RPC —
  // a marketer can't compute it from their own RLS-scoped leads. Powers the
  // "assigned events / spots left" card above My Leads (marketer view only).
  const [marketerEventDateCounts, setMarketerEventDateCounts] = useState<Record<string, Record<string, { registered: number; reserved: number }>>>({});
  // Slugs the logged-in marketer is assigned to. Fetched directly (the admin
  // eventMarketersMap isn't loaded in a marketer session); event_marketers has a
  // self-select RLS policy (marketer_id = current_marketer_id()) so this works.
  const [marketerAssignedSlugs, setMarketerAssignedSlugs] = useState<string[]>([]);
  const [addingMarketer, setAddingMarketer] = useState(false);
  const [newMarketerEmail, setNewMarketerEmail] = useState('');
  const [newMarketerName, setNewMarketerName] = useState('');
  const [newMarketerCommission, setNewMarketerCommission] = useState('50');
  const [savingMarketer, setSavingMarketer] = useState(false);

  // ── Affiliates (creators) — admin-only, populated when admin opens Creators ──
  const [affiliatesLoading, setAffiliatesLoading] = useState(false);
  const [affiliates, setAffiliates] = useState<Array<{ id: string; handle: string; name: string; email: string; active: boolean }>>([]);
  // Per-affiliate rollups: clicks, attributed applications, paid tickets, earned + unpaid ₹.
  const [affiliateStats, setAffiliateStats] = useState<Record<string, AffiliateStat>>({});
  const [addingAffiliate, setAddingAffiliate] = useState(false);
  const [newAffiliateHandle, setNewAffiliateHandle] = useState('');
  const [newAffiliateName, setNewAffiliateName] = useState('');
  const [newAffiliateEmail, setNewAffiliateEmail] = useState('');
  const [savingAffiliate, setSavingAffiliate] = useState(false);
  const [analyticsWindow, setAnalyticsWindow] = useState<'24h' | 'week' | 'month' | '90d'>('week');
  // Funnel event filter. null = default (active events only). A Set = the
  // explicit set of event ids the admin has chosen to show (lets them toggle
  // hidden/inactive events on via checkboxes).
  const [funnelSelected, setFunnelSelected] = useState<Set<string> | null>(null);
  const [funnelDropdownOpen, setFunnelDropdownOpen] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsEventFilter, setApplicationsEventFilter] = useState<'all' | string>('all');
  // Filters leads by their selected_date (ISO). 'all' = every date. Handy for
  // multi-date events where one plan has leads across several dates.
  const [applicationsDateFilter, setApplicationsDateFilter] = useState<'all' | string>('all');
  const [applicationsStatusFilter, setApplicationsStatusFilter] = useState<'all' | string>('all');
  // 'all' | 'unassigned' | <marketer id>. Admin-only filter.
  const [applicationsMarketerFilter, setApplicationsMarketerFilter] = useState<'all' | string>('all');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvingDoubtId, setApprovingDoubtId] = useState<string | null>(null);
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
    // Resolve in order of stability:
    //   1. event_id (slug/uuid the doubt was submitted under — survives renames)
    //   2. event_slug (older field name)
    //   3. event_title (string snapshot — breaks when the trip is renamed)
    // This is what stops doubts from going missing after a plan rename.
    // Always trim the returned title — some DB titles have trailing spaces
    // and the plan filter dropdown's values are pre-trimmed, so an untrimmed
    // return value silently breaks the equality check.
    const id = (submission.event_id || '').trim();
    if (id) {
      const match = trips.find(t => t.id === id || t.slug === id || t.invite_slug === id);
      if (match) return (match.title || '').trim();
    }
    if (submission.event_slug) {
      const match = trips.find(t => t.slug === submission.event_slug || t.invite_slug === submission.event_slug);
      if (match) return (match.title || '').trim();
    }
    const raw = (submission.event_title || submission.event || submission.event_name || '').trim();
    if (raw) {
      const match = trips.find(t => t.title === raw || t.slug === raw || t.invite_slug === raw);
      return match ? (match.title || '').trim() : raw;
    }
    if (submission.event_slug) return submission.event_slug;
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

      // Marketer side-car: an ops user whose email exists in call_marketers
      // is a marketer. Drives the commission banner + scopes the People tab
      // to "my leads" via the RLS policy (no client-side filter needed).
      if (role === 'ops') {
        const { data: mk } = await supabase
          .from('call_marketers')
          .select('id, name, email, commission_amount')
          .eq('email', userEmail)
          .eq('active', true)
          .maybeSingle();
        setCurrentMarketer(mk ?? null);
        if (mk?.id) {
          // Sum sales this calendar month — drives the banner copy.
          const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
          const { data: sales } = await supabase
            .from('marketer_sales')
            .select('amount')
            .eq('marketer_id', mk.id)
            .gte('accrued_at', monthStart.toISOString());
          const total = (sales ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);
          setMyCommissionStats({ total, ticketCount: (sales ?? []).length });
        }
      } else {
        setCurrentMarketer(null);
        setMyCommissionStats(null);
      }
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

  // Fetch ALL rows from a table, paging past PostgREST's 1000-row response
  // cap. Without this the People tab silently showed only the most recent
  // 1000 applications across all trips — older applicants would vanish once
  // total exceeded 1000 (e.g. a few busy trips at 500+ each). Applications
  // are bounded by real humans (thousands at most), so fetching all and
  // filtering client-side stays fast; we just must not let the cap truncate.
  const fetchAllRows = async (table: string, orderCol: string): Promise<{ data: any[]; error: any }> => {
    const PAGE = 1000;
    let from = 0;
    const all: any[] = [];
    for (;;) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order(orderCol, { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) return { data: all, error };
      all.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }
    return { data: all, error: null };
  };

  // Admin-only. Pulls the marketer roster, their commission totals, and
  // the event_marketers map for use in the event-edit form.
  const loadMarketersData = async () => {
    setMarketersLoading(true);
    const [{ data: mkRows }, { data: salesRows }, { data: emRows }, { data: perfRows }, { data: fcRows }] = await Promise.all([
      supabase.from('call_marketers').select('id, email, name, commission_amount, active').order('created_at'),
      supabase.from('marketer_sales').select('marketer_id, amount'),
      supabase.from('event_marketers').select('event_slug, marketer_id'),
      supabase.rpc('get_performance_summary'),
      supabase.from('fixed_costs').select('*').order('created_at'),
    ]);
    setMarketersLoading(false);
    setPerfSummary(perfRows ?? null);
    setFixedCosts((fcRows ?? []) as any);
    setMarketers((mkRows ?? []) as any);
    const stats: Record<string, { total: number; ticketCount: number }> = {};
    (salesRows ?? []).forEach((r: any) => {
      const k = r.marketer_id;
      const cur = stats[k] ?? { total: 0, ticketCount: 0 };
      cur.total += Number(r.amount);
      cur.ticketCount += 1;
      stats[k] = cur;
    });
    setMarketerStats(stats);
    const map: Record<string, string[]> = {};
    (emRows ?? []).forEach((r: any) => {
      const arr = map[r.event_slug] ?? [];
      arr.push(r.marketer_id);
      map[r.event_slug] = arr;
    });
    setEventMarketersMap(map);
  };

  // Load per-date booking counts for the events the logged-in marketer is
  // assigned to (powers the spots-left card). Marketer view only; uses the
  // SECURITY DEFINER RPC so totals aren't capped by the marketer's RLS scope.
  useEffect(() => {
    if (!currentMarketer) { setMarketerAssignedSlugs([]); setMarketerEventDateCounts({}); return; }
    let cancelled = false;
    (async () => {
      const { data: emRows } = await supabase
        .from('event_marketers')
        .select('event_slug')
        .eq('marketer_id', currentMarketer.id);
      const slugs = Array.from(new Set((emRows ?? []).map((r: any) => r.event_slug).filter(Boolean)));
      if (cancelled) return;
      setMarketerAssignedSlugs(slugs);
      if (slugs.length === 0) { setMarketerEventDateCounts({}); return; }
      const entries = await Promise.all(slugs.map(async (slug) => [slug, await fetchEventDateCounts(slug)] as const));
      if (!cancelled) setMarketerEventDateCounts(Object.fromEntries(entries));
    })().catch(() => { /* card degrades gracefully if the fetch fails */ });
    return () => { cancelled = true; };
  }, [currentMarketer]);

  // Save (or create) a marketer. Admin-only flow from the Marketers tab.
  const saveNewMarketer = async () => {
    const email = newMarketerEmail.trim().toLowerCase();
    const name = newMarketerName.trim();
    const commission = Number(newMarketerCommission) || 50;
    if (!email || !name) { showToast('Email and name required'); return; }
    setSavingMarketer(true);
    const { error } = await supabase.from('call_marketers').insert({ email, name, commission_amount: commission });
    setSavingMarketer(false);
    if (error) { showToast(`Failed: ${error.message}`); return; }
    showToast('Marketer added');
    setAddingMarketer(false);
    setNewMarketerEmail(''); setNewMarketerName(''); setNewMarketerCommission('50');
    logAdminAction('marketer_create', 'call_marketers', null, { email, name, commission });
    loadMarketersData();
  };

  const toggleMarketerActive = async (mk: { id: string; active: boolean; name: string }) => {
    const { error } = await supabase.from('call_marketers').update({ active: !mk.active }).eq('id', mk.id);
    if (error) { showToast(`Failed: ${error.message}`); return; }
    showToast(`${mk.name} ${!mk.active ? 'reactivated' : 'deactivated'}`);
    logAdminAction(mk.active ? 'marketer_deactivate' : 'marketer_reactivate', 'call_marketers', mk.id, {});
    loadMarketersData();
  };

  // Replace event_marketers rows for a given event with the chosen set.
  // The DB trigger handles the redistribute on insert/delete.
  const setEventMarketers = async (eventSlug: string, nextIds: string[]) => {
    const current = eventMarketersMap[eventSlug] ?? [];
    const toAdd = nextIds.filter(id => !current.includes(id));
    const toRemove = current.filter(id => !nextIds.includes(id));
    if (toRemove.length > 0) {
      await supabase.from('event_marketers').delete().eq('event_slug', eventSlug).in('marketer_id', toRemove);
    }
    if (toAdd.length > 0) {
      await supabase.from('event_marketers').insert(toAdd.map(marketer_id => ({ event_slug: eventSlug, marketer_id })));
    }
    setEventMarketersMap(prev => ({ ...prev, [eventSlug]: nextIds }));
    logAdminAction('event_marketers_set', 'event_marketers', null, { event_slug: eventSlug, marketer_ids: nextIds });
  };

  // ── Affiliates (creators) — admin-only management ───────────────────────────
  // Pull roster + build per-creator rollups from clicks, attributed applications
  // and the sales ledger (admin has full RLS on all three).
  const loadAffiliatesData = async () => {
    setAffiliatesLoading(true);
    const [{ data: affRows }, { data: salesRows }, { data: clickRows }, { data: appRows }] = await Promise.all([
      supabase.from('affiliates').select('id, handle, name, email, active').order('created_at'),
      supabase.from('affiliate_sales').select('affiliate_id, amount, paid_out_at'),
      supabase.from('affiliate_clicks').select('affiliate_id'),
      supabase.from('applications').select('affiliate_id').not('affiliate_id', 'is', null),
    ]);
    setAffiliatesLoading(false);
    setAffiliates((affRows ?? []) as any);
    const stats: Record<string, AffiliateStat> = {};
    const bump = (id: string): AffiliateStat => (stats[id] ??= { clicks: 0, apps: 0, tickets: 0, earned: 0, unpaid: 0 });
    (clickRows ?? []).forEach((r: any) => { if (r.affiliate_id) bump(r.affiliate_id).clicks += 1; });
    (appRows ?? []).forEach((r: any) => { if (r.affiliate_id) bump(r.affiliate_id).apps += 1; });
    (salesRows ?? []).forEach((r: any) => {
      const cur = bump(r.affiliate_id);
      cur.tickets += 1;
      cur.earned += Number(r.amount);
      if (!r.paid_out_at) cur.unpaid += Number(r.amount);
    });
    setAffiliateStats(stats);
  };

  const saveNewAffiliate = async () => {
    // Normalise the handle to match the DB CHECK (lowercase, [a-z0-9._], ≤40).
    const handle = newAffiliateHandle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 40);
    const name = newAffiliateName.trim();
    const email = newAffiliateEmail.trim().toLowerCase();
    if (!handle || !name || !email) { showToast('Handle, name and email required'); return; }
    setSavingAffiliate(true);
    const { error } = await supabase.from('affiliates').insert({ handle, name, email });
    setSavingAffiliate(false);
    if (error) {
      showToast(error.code === '23505' ? 'That handle or email already exists' : `Failed: ${error.message}`);
      return;
    }
    showToast('Creator added');
    setAddingAffiliate(false);
    setNewAffiliateHandle(''); setNewAffiliateName(''); setNewAffiliateEmail('');
    logAdminAction('affiliate_create', 'affiliates', null, { handle, name, email });
    loadAffiliatesData();
  };

  const toggleAffiliateActive = async (af: { id: string; active: boolean; name: string }) => {
    const { error } = await supabase.from('affiliates').update({ active: !af.active }).eq('id', af.id);
    if (error) { showToast(`Failed: ${error.message}`); return; }
    showToast(`${af.name} ${!af.active ? 'reactivated' : 'paused'}`);
    logAdminAction(af.active ? 'affiliate_deactivate' : 'affiliate_reactivate', 'affiliates', af.id, {});
    loadAffiliatesData();
  };

  // Settle a creator's outstanding commission: stamp paid_out_at on every unpaid
  // sale row for them. Append-only ledger keeps the full history.
  const markAffiliatePaid = async (af: { id: string; name: string; unpaid: number }) => {
    if (af.unpaid <= 0) return;
    if (!window.confirm(`Mark ₹${Math.round(af.unpaid).toLocaleString('en-IN')} as paid out to ${af.name}? This can't be undone.`)) return;
    const { error } = await supabase
      .from('affiliate_sales')
      .update({ paid_out_at: new Date().toISOString() })
      .eq('affiliate_id', af.id)
      .is('paid_out_at', null);
    if (error) { showToast(`Failed: ${error.message}`); return; }
    showToast(`Marked paid for ${af.name}`);
    logAdminAction('affiliate_payout', 'affiliate_sales', af.id, { amount: af.unpaid });
    loadAffiliatesData();
  };

  // ── Performance: per-event cost-per-ticket + fixed-costs ledger ─────────────
  const saveEventCost = async (eventId: string) => {
    const val = Number(costEdits[eventId]);
    if (!Number.isFinite(val) || val < 0) { showToast('Enter a valid cost'); return; }
    const { error } = await supabase.from('events').update({ cost_per_ticket: val }).eq('id', eventId);
    if (error) { showToast(`Failed: ${error.message}`); return; }
    showToast('Cost saved');
    loadMarketersData();
  };
  const addFixedCost = async () => {
    const label = newFixedLabel.trim();
    const amount = Number(newFixedAmount);
    if (!label || !Number.isFinite(amount) || amount < 0) { showToast('Enter a label and amount'); return; }
    const { error } = await supabase.from('fixed_costs').insert({ label, amount });
    if (error) { showToast(`Failed: ${error.message}`); return; }
    setNewFixedLabel(''); setNewFixedAmount('');
    loadMarketersData();
  };
  const removeFixedCost = async (id: string) => {
    const { error } = await supabase.from('fixed_costs').delete().eq('id', id);
    if (error) { showToast(`Failed: ${error.message}`); return; }
    loadMarketersData();
  };

  const loadApplications = async () => {
    setApplicationsLoading(true);
    const [{ data, error }, { data: doubtsRows, error: doubtsErr }, { data: eventRows }, { data: planDoubtsRows }, { data: marketerRows }, { data: boardRows }] = await Promise.all([
      fetchAllRows('applications', 'created_at'),
      fetchAllRows('doubt_submissions', 'submitted_at'),
      supabase.from('events').select('slug, invite_slug'),
      fetchAllRows('plan_doubts', 'created_at'),
      // Roster (id → name) so the admin Call view can tag each lead's marketer.
      // RLS returns all rows to admins, just the caller's own row to a marketer.
      supabase.from('call_marketers').select('id, name'),
      // Transparent team board (peers' tickets sold + earned) for marketers.
      supabase.rpc('get_marketer_board'),
    ]);
    if (marketerRows) setMarketerNameById(Object.fromEntries(marketerRows.map((m: any) => [m.id, m.name])));
    if (boardRows) setMarketerBoard(boardRows as any);
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

  // Move an applicant to a different date of the same event (Call tab dropdown).
  const updateApplicationDate = async (id: string, newDate: string) => {
    // Guard: a paid applicant (advance or full) is committed to their date's
    // cohort — never reassign. The UI hides the dropdown for these, this just
    // backstops against a stale render.
    const target = applications.find(a => a.id === id);
    if (target && (target.status === 'advance_paid' || target.status === 'fully_paid')) {
      showToast('❌ Date locked — applicant has paid');
      return;
    }
    setSavingDateId(id);
    const { error } = await supabase.from('applications').update({ selected_date: newDate }).eq('id', id);
    setSavingDateId(null);
    if (error) { showToast(`❌ ${error.message}`); return; }
    setApplications(prev => prev.map(a => a.id === id ? { ...a, selected_date: newDate } : a));
    logAdminAction('application_date_change', 'applications', id, { selected_date: newDate });
    showToast('✓ Date updated');
  };

  const approveApplication = async (id: string) => {
    setApprovingId(id);
    const app = applications.find(a => a.id === id);

    // Guard: never downgrade an already-paid applicant back to 'invited'.
    // Re-approving someone who has paid (advance_paid/fully_paid) would wipe
    // their payment status — exactly the bug that flipped a paid lead to
    // 'invited' after a doubt/approve action.
    if (app?.status === 'advance_paid' || app?.status === 'fully_paid') {
      showToast('⚠️ Already paid — not re-inviting');
      setApprovingId(null);
      return;
    }

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
    logAdminAction('application_approve', 'applications', id, {
      name: app?.name ?? null,
      phone: app?.phone ?? null,
      event_slug: app?.event_slug ?? null,
      previous_status: app?.status ?? null,
    });

    // 2. Fire AiSensy invite message
    if (app) {
      // Case-insensitive trip lookup — guards against any old vs new slug casing drift.
      const appSlugLower = String(app.event_slug ?? '').toLowerCase();
      const trip = trips.find(t =>
        String(t.slug ?? t.id ?? '').toLowerCase() === appSlugLower
      );
      const eventName = trip?.title ?? app.event_slug ?? '';
      // Use the date the applicant actually chose; only fall back to the first
      // event date if their selection is missing. (Was always event_dates[0],
      // so multi-date events sent the wrong date in the invite.)
      const firstDate = (app.selected_date as string) || trip?.event_dates?.[0]?.start_date || '';
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
        logAdminAction('invited_number_add', 'invited_numbers', null, {
          event_slug: inviteSlug,
          phone: String(app.phone).replace(/\D/g, '').slice(-10),
          via: 'approveApplication',
          application_id: id,
        });
      }

      try {
        // The AiSensy JWT used to live in this file and was shipped to every
        // visitor's browser. It now lives in the AISENSY_API_KEY secret on
        // the send-aisensy-invite edge function, which verifies the caller
        // is an admin before forwarding to AiSensy.
        const { data: { session } } = await supabase.auth.getSession();
        const aiRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-aisensy-invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({
            phone: phone.replace(/^91/, ''),
            userName: app.name ?? '',
            eventName,
            eventDate,
          }),
        });
        const aiJson = await aiRes.json().catch(() => ({}));
        const ok = aiRes.ok && aiJson.ok;
        // Mark aisensy_invite_sent on the row. Also stamp invite_sent_at —
        // the retarget-check cron compares this against now()-24h. Only set
        // when AiSensy actually accepted the send (ok=true) so a failed
        // delivery doesn't start the re-target countdown from a bogus time.
        // Clears re_target in case admin is re-approving after a correction
        // (e.g. fixed a phone-number typo) so the flag doesn't linger.
        const { data: sentApp, error: sentError } = await supabase
          .from('applications')
          .update({
            status: 'invited',
            aisensy_invite_sent: ok,
            ...(ok ? { invite_sent_at: new Date().toISOString() } : {}),
            re_target: false,
          })
          .eq('id', id)
          .select('*')
          .maybeSingle();
        if (sentError || !sentApp) {
          showToast(`⚠️ WhatsApp ${ok ? 'sent' : 'failed'}, but DB did not save the sent flag. Refreshing…`);
          await loadApplications();
        } else {
          setApplications(prev => prev.map(a => a.id === id ? { ...a, ...sentApp } : a));
          // Surface the actual AiSensy error so the admin can act on it
          // (bad key / template not approved / quota / etc.) instead of
          // staring at a generic "failed" toast.
          const errReason = !ok
            ? (aiJson.error ? ` — ${String(aiJson.error).slice(0, 120)}` : '')
            : '';
          showToast(ok
            ? '✅ Approved & WhatsApp invite sent'
            : `✅ Approved — but WhatsApp send failed${errReason}`);
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

  // Approve a doubt submission directly: create an `applications` row (status
  // 'invited') from the doubt's captured details, then run the same invite
  // side-effects as approveApplication (invited_numbers + AiSensy + push). This
  // lets a marketer resolve a doubt AND invite the person without a re-apply.
  // Admin-only — also enforced server-side by the applications_admin_insert RLS.
  const approveDoubtSubmission = async (submission: any) => {
    // Resolve the canonical event slug + trip from whatever the doubt stored.
    const rawTitle = (submission.event_title || submission.event_slug || submission.event_id || '').trim();
    const trip = trips.find(t =>
      String(t.slug ?? '').toLowerCase() === String(submission.event_id ?? '').toLowerCase()
      || t.title === rawTitle || t.slug === rawTitle || t.invite_slug === rawTitle
    );
    const slug = String(trip?.slug ?? submission.event_id ?? '').toLowerCase();
    const phone10 = String(submission.phone ?? '').replace(/\D/g, '').slice(-10);

    if (!slug)                        { showToast('❌ Could not match this doubt to a plan'); return; }
    if (!/^[6-9]\d{9}$/.test(phone10)) { showToast('❌ Invalid phone number on this doubt'); return; }

    setApprovingDoubtId(submission.id);

    // 1. Create the application row (status invited). On a unique-key clash
    //    (event_slug, phone) the person already applied — just flip that row to
    //    invited rather than clobbering their real application data.
    let appId: string | null = null;
    // Set true if the matched existing application has already paid — in that
    // case we must NOT re-invite (which would clobber advance_paid/fully_paid).
    let alreadyPaid = false;
    const { data: inserted, error: insErr } = await supabase
      .from('applications')
      .insert({
        event_slug:    slug,
        name:          (submission.name ?? '').trim() || 'Guest',
        phone:         phone10,
        email:         (submission.email ?? '').trim() || null,
        gender:        (submission.gender ?? '').trim(),    // doubt form collects this now
        why_join:      (submission.why_join ?? '').trim(),
        status:        'invited',
        selected_date: submission.selected_date ?? null,
        selected_city: submission.city ?? null,
        pickup_label:  submission.meeting_spot ?? null,
        // Attribution: when a marketer (ops) approves, the application MUST be
        // assigned to them — both for correct credit and because the marketer
        // RLS insert policy only allows self-assigned rows. Admins (no
        // currentMarketer) fall back to whoever owns the doubt, else the BEFORE
        // INSERT trigger infers it.
        assigned_marketer_id: currentMarketer?.id ?? submission.assigned_marketer_id ?? null,
      })
      .select('id')
      .maybeSingle();

    if (insErr) {
      if (insErr.code === '23505') {
        const { data: existing, error: findErr } = await supabase
          .from('applications').select('id, status').eq('event_slug', slug).eq('phone', phone10).maybeSingle();
        if (findErr || !existing) { showToast(`❌ ${findErr?.message || 'Application already exists but could not be located'}`); setApprovingDoubtId(null); return; }
        appId = existing.id;
        // Never downgrade an already-paid applicant. If they've paid, leave the
        // status untouched and skip the invite side-effects entirely (below).
        alreadyPaid = existing.status === 'advance_paid' || existing.status === 'fully_paid';
        if (!alreadyPaid) {
          await supabase.from('applications').update({ status: 'invited' }).eq('id', appId);
        }
      } else {
        showToast(`❌ ${insErr.message}`); setApprovingDoubtId(null); return;
      }
    } else {
      appId = inserted?.id ?? null;
    }

    // Already paid → don't re-invite (no status change, no AiSensy invite, no
    // invited_numbers re-add). Their payment stands; just refresh and exit.
    if (alreadyPaid) {
      showToast('⚠️ Already paid — not re-inviting');
      setApprovingDoubtId(null);
      await loadApplications();
      return;
    }

    logAdminAction('doubt_approve_invite', 'applications', appId, {
      name: submission.name ?? null, phone: phone10, event_slug: slug, doubt_id: submission.id ?? null,
    });

    // 2. Invite side-effects (mirror of approveApplication).
    const eventName = trip?.title ?? slug;
    // Prefer the date the person chose on their doubt over the first event date.
    const firstDate = (submission.selected_date as string) || trip?.event_dates?.[0]?.start_date || '';
    const eventDate = (() => {
      if (!firstDate) return '';
      const d = new Date(firstDate + 'T00:00:00');
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const month = d.toLocaleDateString('en-US', { month: 'long' });
      const day = d.getDate();
      const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
      return `${dayName}, ${month} ${day}${suffix}`;
    })();
    const inviteSlug = trip?.invite_slug;
    if (inviteSlug) {
      await supabase.from('invited_numbers').insert({ event_slug: inviteSlug, phone: phone10 }).select();
      logAdminAction('invited_number_add', 'invited_numbers', null, { event_slug: inviteSlug, phone: phone10, via: 'approveDoubtSubmission', application_id: appId });
    }

    let ok = false; let errReason = '';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const aiRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-aisensy-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ phone: phone10, userName: submission.name ?? '', eventName, eventDate }),
      });
      const aiJson = await aiRes.json().catch(() => ({}));
      ok = aiRes.ok && aiJson.ok;
      if (!ok && aiJson.error) errReason = ` — ${String(aiJson.error).slice(0, 120)}`;
    } catch { errReason = ' (network error)'; }

    if (appId) {
      await supabase.from('applications').update({
        status: 'invited',
        aisensy_invite_sent: ok,
        ...(ok ? { invite_sent_at: new Date().toISOString() } : {}),
        re_target: false,
      }).eq('id', appId);
    }

    try {
      await supabase.functions.invoke('send-push-notification', {
        body: { type: 'direct', phone: phone10, title: "You're invited! 🎉", body: `Your spot on ${eventName} is confirmed. Open the app to see your invite.`, url: inviteSlug ? `/invite/${inviteSlug}` : '/' },
      });
    } catch { /* push is non-critical */ }

    showToast(ok ? '✅ Invited & WhatsApp sent' : `✅ Invited — WhatsApp send failed${errReason}`);
    setApprovingDoubtId(null);
    await loadApplications(); // refresh so the "Applied" badge + People tab reflect it
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
    // Inputs store raw values while typing (so spaces work); trim quick_info
    // values here, once, and drop any entry that's left whitespace-only.
    const cleanedQuickInfo = Array.isArray(trip.quick_info)
      ? trip.quick_info
          .map((qi: any) => ({ ...qi, value: typeof qi.value === 'string' ? qi.value.trim() : qi.value }))
          .filter((qi: any) => String(qi.value ?? '').trim() !== '')
      : trip.quick_info;
    const tripWithSlug = {
      ...trip,
      slug:        String(trip.slug || autoSlug).toLowerCase(),
      invite_slug: String(trip.invite_slug || autoSlug).toLowerCase(),
      quick_info:  cleanedQuickInfo,
    };
    const { event_dates, event_media, event_reviews, faqs, id, ...fields } = tripWithSlug;
    const normalizedEventDates = tripWithSlug.booking_url === 'native-application'
      ? (event_dates ?? []).map(d => ({ ...d, status: 'available' as TripDate['status'] }))
      : event_dates;

    let eventId = id;
    if (id) {
      const { error: updateError } = await supabase.from('events').update(fields).eq('id', id);
      if (updateError) { console.error('Update error:', updateError); showToast('Save failed: ' + updateError.message); setSaving(null); return; }
      logAdminAction('event_update', 'events', id, {
        title: tripWithSlug.title, slug: tripWithSlug.slug,
        price_advance: tripWithSlug.price_advance, price_full: tripWithSlug.price_full,
        is_active: tripWithSlug.is_active, invite_only: tripWithSlug.invite_only,
      });
    } else {
      const { data, error: insertError } = await supabase.from('events').insert(fields).select('id').single();
      if (insertError) { console.error('Insert error:', insertError); showToast('Save failed: ' + insertError.message); setSaving(null); return; }
      eventId = data?.id;
      logAdminAction('event_create', 'events', eventId ?? null, {
        title: tripWithSlug.title, slug: tripWithSlug.slug,
        price_advance: tripWithSlug.price_advance, price_full: tripWithSlug.price_full,
        invite_only: tripWithSlug.invite_only,
      });
    }

    if (eventId && normalizedEventDates) {
      await supabase.from('event_dates').delete().eq('event_id', eventId);
      if (normalizedEventDates.length > 0) {
        await supabase.from('event_dates').insert(
          // Preserve ALL per-date fields on the delete+reinsert. Previously this
          // only wrote start_date/status/label/whatsapp_group_url, so every event
          // save silently WIPED each date's booking_steps (per-date timeline) back
          // to null — the "steps get reset" bug, which then made the advance/balance
          // WhatsApp fall back to stale event-level dates. Defaults match the DB so
          // the NOT NULL columns never receive null (and new UI dates still work).
          normalizedEventDates.map(d => ({
            event_id: eventId,
            start_date: d.start_date,
            status: d.status,
            label: d.label,
            whatsapp_group_url: d.whatsapp_group_url ?? null,
            booking_steps:      (d as any).booking_steps ?? null,
            duration_days:      (d as any).duration_days ?? 1,
            advance_due_offset: (d as any).advance_due_offset ?? -5,
            dot_color:          (d as any).dot_color ?? '#16a34a',
            highlight_color:    (d as any).highlight_color ?? '#dcfce7',
          }))
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
    // Surface failures instead of silently showing "Saved!" — a single missed
    // error here is how per-date booking_steps got stuck NULL even after the
    // admin clicked Save multiple times.
    const failures: string[] = [];
    if (forDate) {
      const dateRow = (trip.event_dates ?? []).find(d => d.start_date === forDate);
      if (!dateRow?.id) {
        const msg = `No event_dates row matched start_date=${forDate} for trip ${trip.slug ?? trip.id}`;
        console.error('[saveTimeline]', msg, { event_dates: trip.event_dates });
        failures.push('Could not find the date row to update');
      } else {
        // .select() so we get the affected rows back — a 0-row result with no
        // error means the WHERE matched nothing (e.g. a stale row id from a
        // page that drifted from the DB), which previously showed a misleading
        // "Saved!" toast. Surfacing it tells the admin to refresh and retry.
        const { data, error } = await supabase.from('event_dates').update({ booking_steps: steps }).eq('id', dateRow.id).select('id');
        if (error) {
          console.error('[saveTimeline] event_dates update failed', error);
          failures.push(`event_dates update: ${error.message}`);
        } else if (!data || data.length === 0) {
          failures.push(`0 rows updated for date ${forDate} (id ${dateRow.id})`);
        } else {
          setTrips(prev => prev.map(t => t.id === trip.id
            ? { ...t, event_dates: (t.event_dates ?? []).map(d => d.start_date === forDate ? { ...d, booking_steps: steps } : d) }
            : t));
        }
      }
    } else {
      const { data, error } = await supabase.from('events').update({ booking_steps: steps }).eq('id', trip.id!).select('id');
      if (error) {
        console.error('[saveTimeline] events update failed', error);
        failures.push(`events update: ${error.message}`);
      } else if (!data || data.length === 0) {
        failures.push(`0 rows updated for event ${trip.id}`);
      } else {
        setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, booking_steps: steps } : t));
      }
    }
    if (ctaLabel !== undefined) {
      const { error } = await supabase.from('events').update({ cta_label: ctaLabel }).eq('id', trip.id!);
      if (error) {
        console.error('[saveTimeline] cta_label update failed', error);
        failures.push(`cta_label update: ${error.message}`);
      } else {
        setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, cta_label: ctaLabel } : t));
      }
    }
    if (failures.length === 0) {
      setTimelineEdits(prev => { const next = { ...prev }; delete next[editKey]; return next; });
      setCtaEdits(prev => { const next = { ...prev }; delete next[trip.id!]; return next; });
    }
    setSavingTimeline(null);
    showToast(failures.length === 0 ? 'Timeline saved!' : `Save failed — ${failures.join(' · ')}`);
    logAdminAction('event_timeline_save', 'events', trip.id ?? null, {
      slug: trip.slug ?? null,
      for_date: forDate ?? null,
      step_count: steps.length,
      cta_label_changed: ctaLabel !== undefined,
    });
  };

  // Analytics now aggregates server-side via the get_analytics_summary RPC.
  // The old approach (SELECT * then aggregate in the browser) silently hit
  // PostgREST's 1000-row cap and undercounted badly as traffic grew. The RPC
  // computes everything in Postgres for the requested window and returns just
  // the summary numbers — correct at any scale, and a few KB instead of MBs.
  // The 30-day purge moved to a nightly pg_cron job, off this read path.
  const loadAnalytics = async (win: '24h' | 'week' | 'month' | '90d' = analyticsWindow) => {
    setAnalyticsLoading(true);
    // 90 days is the widest window — it matches the nightly pg_cron purge
    // retention, so it's the full span of analytics we keep.
    const hours = win === '24h' ? 24 : win === 'week' ? 24 * 7 : win === 'month' ? 24 * 30 : 24 * 90;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const [summaryRes, funnelRes] = await Promise.all([
      supabase.rpc('get_analytics_summary', { p_since: since }),
      supabase.rpc('get_conversion_funnel', { p_since: since }),
    ]);
    if (summaryRes.error) {
      console.error('[loadAnalytics] summary RPC error:', summaryRes.error.message);
      showToast(`❌ Failed to load analytics: ${summaryRes.error.message}`);
      setAnalyticsSummary(null);
    } else {
      setAnalyticsSummary(summaryRes.data);
    }
    setConversionFunnel(funnelRes.error ? null : funnelRes.data);
    // Latest weekly storage snapshot. Best-effort: silent on failure so a
    // missing table or RLS issue doesn't break the analytics tab.
    try {
      const { data: srRows } = await supabase
        .from('storage_reports')
        .select('total_db_size_pretty, free_tier_pct, taken_at, table_sizes')
        .order('taken_at', { ascending: false })
        .limit(1);
      const row = srRows?.[0];
      if (row) {
        const ts = Array.isArray(row.table_sizes) ? row.table_sizes : [];
        const top = ts[0];
        setStorageReport({
          total_db_size_pretty: row.total_db_size_pretty,
          free_tier_pct: Number(row.free_tier_pct ?? 0),
          taken_at: row.taken_at,
          biggest: top ? { table: top.table, pretty: `${Math.round(top.size_bytes / 1024 / 1024)} MB` } : undefined,
        });
      } else {
        setStorageReport(null);
      }
    } catch (_) { /* silent — non-critical */ }
    setAnalyticsLoading(false);
  };

  const deleteTrip = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await supabase.from('events').delete().eq('id', id);
    setTrips(prev => prev.filter(t => t.id !== id));
    showToast('Deleted.');
    logAdminAction('event_delete', 'events', id, { title });
  };

  // duplicateTrip was removed: copying an event spawned a new "-copy-…" slug
  // while keeping the old title, which fragmented analytics (the same plan
  // showing up under multiple ids, some resolving to "Unknown City"). Build
  // new plans fresh instead.

  const setLiveState = async (trip: Trip, live: boolean) => {
    await supabase.from('events').update({ is_active: live }).eq('id', trip.id!);
    setTrips(prev => prev.map(t => t.id === trip.id ? { ...t, is_active: live } : t));
    logAdminAction(live ? 'event_set_live' : 'event_set_offline', 'events', trip.id ?? null, {
      title: trip.title,
    });
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
    logAdminAction(enabled ? 'event_other_city_enable' : 'event_other_city_disable', 'events', trip.id, {
      slug: trip.slug ?? null,
    });
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
    logAdminAction('chat_message_update', 'chat_messages', msg.id, { step_key: msg.step_key });
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
    logAdminAction('chat_step_template_save', 'chat_messages', existing?.id ?? null, {
      step_key: stepKey,
      had_existing: !!existing?.id,
      draft_empty: !draft,
    });
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
    logAdminAction('general_announcements_save', 'chat_messages', existing?.id ?? null, {
      lines: globalAnnouncementsFields.filter(v => v.trim()).length,
    });
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
    logAdminAction('announcement_config_save', 'chat_messages', null, {
      event_slugs: announcementEventSlugs.filter(Boolean),
      static_text: staticValue,
    });
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
    logAdminAction('doubt_form_settings_save', 'chat_messages', null, {
      doubt_cta_label: doubtCtaLabel,
    });
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
        <div
          title={payuMode === 'live' ? 'PayU is pointed at the production gateway — real money' : payuMode === 'test' ? 'PayU is pointed at the sandbox — no real money' : 'PayU mode could not be determined'}
          style={{
            marginLeft: 10,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.5,
            padding: '3px 8px',
            borderRadius: 4,
            background: payuMode === 'live' ? '#10b981' : payuMode === 'test' ? '#f59e0b' : '#9ca3af',
            color: '#fff',
          }}
        >
          PayU: {payuMode === 'live' ? 'LIVE' : payuMode === 'test' ? 'TEST' : payuMode === 'loading' ? '…' : '?'}
        </div>
        <div style={{ flex: 1 }} />
        {adminRole === 'admin' && <button style={s.tab(tab === 'trips')} onClick={() => switchTab('trips')}>Plans</button>}
        {adminRole === 'admin' && <button style={s.tab(tab === 'flow')} onClick={() => switchTab('flow')}>Flow</button>}
        <button style={s.tab(tab === 'people')} onClick={() => { switchTab('people'); loadApplications(); refreshPayuPayments(); }}>People</button>
        {adminRole === 'admin' && <button style={s.tab(tab === 'marketers')} onClick={() => { switchTab('marketers'); loadMarketersData(); }}>Performance</button>}
        {adminRole === 'admin' && <button style={s.tab(tab === 'affiliates')} onClick={() => { switchTab('affiliates'); loadAffiliatesData(); }}>Creators</button>}
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
                          <>
                            <TripForm trip={editingTrip} onChange={setEditingTrip} onSave={() => saveTrip(editingTrip!)} onCancel={() => setEditingTrip(null)} saving={saving === trip.id} s={s} />
                            {/* Marketer assignment — only for existing trips with a slug.
                                Selecting marketers triggers the DB redistribute trigger
                                which auto-fans existing applications across them. */}
                            {adminRole === 'admin' && trip.slug && (
                              <MarketerAssignment
                                eventSlug={trip.slug}
                                marketers={marketers.filter(m => m.active)}
                                selectedIds={eventMarketersMap[trip.slug] ?? []}
                                onChange={ids => setEventMarketers(trip.slug, ids)}
                                onOpen={loadMarketersData}
                                s={s}
                              />
                            )}
                          </>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 16 }}>{trip.title}</div>
                              <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>₹{tripDisplayPrice(trip).toLocaleString('en-IN')} · {trip.timing}</div>
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

            {/* "Edit Other City Plans" section removed — the Other Cities flow
                isn't used currently. The OtherCityForm component and the
                Other-City state/handlers are left in place (dormant) so the
                section can be revived later by re-adding this JSX block. */}

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
                              <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>₹{tripDisplayPrice(trip).toLocaleString('en-IN')} · {trip.timing}</div>
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
              Use <code style={{ background: '#f0f0ea', borderRadius: 4, padding: '1px 4px' }}>{'{advance}'}</code>, <code style={{ background: '#f0f0ea', borderRadius: 4, padding: '1px 4px' }}>{'{balance}'}</code>, or <code style={{ background: '#f0f0ea', borderRadius: 4, padding: '1px 4px' }}>{'{price}'}</code> in Value to auto-fill prices. A row whose Label contains <code style={{ background: '#f0f0ea', borderRadius: 4, padding: '1px 4px' }}>{'{application_count}'}</code> becomes the gold social-proof row at the bottom of the timeline (not a numbered step) — Value sets the title under it.
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
                      const isOpenApp = trip.booking_url === 'payu-hosted';
                      // Both invite (native) and open events use a FIXED-row timeline
                      // (no free-form add/remove). Open drops the invite "vibe check"
                      // application step (they pay immediately): split = 4 rows, single = 3.
                      const isFixedTimeline = isNativeApp || isOpenApp;
                      const isFullPay = trip.payment_mode === 'full';
                      // Single-payment native events have no remaining-balance step (4 rows).
                      const nativeDefaultSteps = isFullPay
                        ? [
                            { label: 'vibe check',                       value: 'Request Invitation',      date: '' },
                            { label: 'if you\'re invited',               value: '{price}',                 date: '' },
                            { label: 'you\'ll receive exact',             value: 'Meeting Spot Details 📍', date: '' },
                            { label: '{application_count} ppl have requested invitation', value: 'Your Plan Name',      date: '' },
                          ]
                        : [
                            { label: 'vibe check',                       value: 'Request Invitation',      date: '' },
                            { label: 'if you\'re invited (advance)',      value: '{advance}',               date: '' },
                            { label: 'remaining balance',                 value: '{balance}',               date: '' },
                            { label: 'you\'ll receive exact',             value: 'Meeting Spot Details 📍', date: '' },
                            { label: '{application_count} ppl have requested invitation', value: 'Your Plan Name',      date: '' },
                          ];
                      // Open events: no invitation step. Single (3): Payment → Meeting Point
                      // Details → Event Date. Split (4): Advance → Balance → Meeting Point
                      // Details → Event Date. The last row carries {application_count} so the
                      // customer timeline pulls it out as the yellow Event Date card (its
                      // count line is hidden for open — gated on isNativeApplicationFlow).
                      const openDefaultSteps = isFullPay
                        ? [
                            { label: 'Payment',              value: '{price}',                  date: '' },
                            { label: "you'll receive exact", value: 'Meeting Point Details 📍',  date: '' },
                            { label: '{application_count} going', value: 'Your Plan Name',        date: '' },
                          ]
                        : [
                            { label: 'Advance',              value: '{advance}',                date: '' },
                            { label: 'remaining balance',    value: '{balance}',                date: '' },
                            { label: "you'll receive exact", value: 'Meeting Point Details 📍',  date: '' },
                            { label: '{application_count} going', value: 'Your Plan Name',        date: '' },
                          ];
                      // Auto-heal: only reuse stored steps if they match the current
                      // payment mode (split needs a {balance} row, single must not).
                      // Steps left over from a mode switch fall back to the mode default.
                      const defaultSteps = isNativeApp
                        ? (bookingStepsMatchMode(trip.booking_steps, isFullPay) ? trip.booking_steps! : nativeDefaultSteps)
                        : isOpenApp
                        ? (bookingStepsMatchMode(trip.booking_steps, isFullPay) ? trip.booking_steps! : openDefaultSteps)
                        : trip.booking_steps ?? [
                          { label: 'Advance', value: '{advance}', date: '' },
                          { label: 'Remaining Balance', value: '{balance}', date: '' },
                          { label: 'Receive', value: 'Pickup, stay & trip details', date: '' },
                        ];
                      const healedPerDateSteps = isFixedTimeline && !bookingStepsMatchMode(perDateSteps, isFullPay) ? undefined : perDateSteps;
                      const rawStepsAll: Array<{ label: string; value: string; date: string }> =
                        timelineEdits[editKey] ?? (hasMultipleDates ? (healedPerDateSteps ?? defaultSteps) : defaultSteps);
                      // Single-payment events drop the remaining-balance step in the editor too,
                      // so it matches the customer timeline and won't re-save a stale balance row.
                      const rawSteps = isFullPay
                        ? rawStepsAll.filter(s => !/balance/i.test(`${s.label} ${s.value}`))
                        : rawStepsAll;
                      // Native app events show a fixed row count — 4 for single-payment, else 5 —
                      // padding missing steps from defaults. The last row defaults to the event title.
                      // Fixed row count: invite full=4/split=5; open full=3/split=4.
                      const fixedDefaults = isOpenApp ? openDefaultSteps : nativeDefaultSteps;
                      const fixedRowCount = isOpenApp ? (isFullPay ? 3 : 4) : (isFullPay ? 4 : 5);
                      const currentSteps: Array<{ label: string; value: string; date: string }> = isFixedTimeline
                        ? Array.from({ length: fixedRowCount }, (_, i) => {
                            if (rawSteps[i]) return rawSteps[i];
                            const def = fixedDefaults[i];
                            return i === fixedRowCount - 1 ? { ...def, value: trip.title ?? def.value } : def;
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
                            // Fixed-timeline (invite/open): first row (pay now / vibe check)
                            // and last row (Event Date card) have no free date input.
                            const nativeNoDate = isFixedTimeline && (i === 0 || i === currentSteps.length - 1);
                            return (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#f9f9f7', border: `1px solid ${isFixedTimeline ? '#e0e7ff' : '#ebebeb'}`, borderRadius: 10, marginBottom: 6 }}>
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
                                    placeholder={i === (isOpenApp ? 0 : 1) ? (isFullPay ? '{price}' : '{advance}') : (!isFullPay && i === (isOpenApp ? 1 : 2)) ? '{balance}' : 'Value or text'}
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
                                    : isNowRow && !isFixedTimeline
                                    ? <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 99, padding: '4px 10px', whiteSpace: 'nowrap' }}>Now</span>
                                    : <input
                                        type="date"
                                        style={{ border: '1px solid #ddd', borderRadius: 8, padding: '5px 8px', fontSize: 12, color: '#111', background: '#fff', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                                        value={step.date}
                                        onChange={e => setStep(i, { date: e.target.value })}
                                      />
                                  }
                                  {!isFixedTimeline && (
                                    <button type="button" onClick={() => removeStep(i)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 18, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>×</button>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {/* Reference row — styled like a step row, dropdown on the right */}
                          {!isFixedTimeline && sortedDates.length > 0 && (
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
                            {!isFixedTimeline && (
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
                              <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>₹{tripDisplayPrice(trip).toLocaleString('en-IN')} · {trip.timing}</div>
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
            .filter(t => (t.invite_only || t.booking_url === 'native-application' || t.booking_url === 'payu-hosted') && t.slug && t.title)
            .map(t => t.slug as string);
          // Open events (payu-hosted) use 'pending' as their "in progress" state,
          // unlike invite events where 'pending' = awaiting approval. Used by
          // displayStatus to surface open leads correctly.
          const openEventSlugs = new Set(
            trips.filter(t => t.booking_url === 'payu-hosted' && t.slug).map(t => t.slug as string)
          );

          // Build a phone+event → payu payment index
          const successPayments = payuPayments.filter(p => p.status === 'success');
          const titleBySlug: Record<string, string> = {};
          trips.forEach(t => { if (t.slug && t.title) titleBySlug[t.slug] = t.title; });
          // Per-event date list (sorted), so the Call tab can offer a date dropdown
          // for multi-date events (move an applicant between dates).
          const datesBySlug: Record<string, Array<{ date: string; status?: string }>> = {};
          trips.forEach(t => {
            if (!t.slug) return;
            const ds = (t.event_dates ?? [])
              .filter((d: any) => d.start_date)
              .map((d: any) => ({ date: d.start_date as string, status: d.status as string | undefined }))
              .sort((a: any, b: any) => a.date.localeCompare(b.date));
            if (ds.length) datesBySlug[t.slug] = ds;
          });
          const paymentsFor = (phone: string, eventSlug: string) => {
            const title = titleBySlug[eventSlug] ?? '';
            const matches = successPayments.filter(p =>
              p.phone === phone && (!title || p.event_title === title || !p.event_title)
            );
            return { all: matches };
          };

          // Apply filters
          const searchLower = peopleSearch.trim().toLowerCase();
          // "Cart Abandoned" and "Re-Target" are derived display states for
          // invited applicants. cart_abandoned = bill opened, never paid.
          // re_target = AiSensy invite >= 24h ago, bill never opened (i.e.
          // either delivery failed or they ignored it). Mutually exclusive
          // by construction; cart_abandoned wins ties (more recent signal).
          // status itself stays 'invited' (so payment + invite-flow auth
          // keep working); we only surface it differently in this admin view.
          const displayStatus = (a: any): string => {
            // Open-event leads sit at 'pending' until they pay. Surface that as
            // "in progress", or "cart abandoned" once the bill was opened and
            // never completed (the cart-abandonment cron sets the flag).
            if (openEventSlugs.has(a.event_slug) && a.status === 'pending') {
              return a.cart_abandoned ? 'cart_abandoned' : 'in_progress';
            }
            if (a.status !== 'invited') return a.status;
            if (a.cart_abandoned) return 'cart_abandoned';
            if (a.re_target) return 're_target';
            return a.status;
          };
          const filteredApps = applications.filter(a => {
            const pays = paymentsFor(a.phone, a.event_slug);
            const eventMatch  = applicationsEventFilter  === 'all' || a.event_slug === applicationsEventFilter;
            const dateMatch   = applicationsDateFilter   === 'all' || a.selected_date === applicationsDateFilter;
            const statusMatch = applicationsStatusFilter === 'all'
              || (applicationsStatusFilter === 'has_doubt' ? (a.doubts?.length ?? 0) > 0
                  : applicationsStatusFilter === 'recovered' ? !!a.recovered_at
                  : displayStatus(a) === applicationsStatusFilter);
            const searchMatch = !searchLower
              || String(a.name  ?? '').toLowerCase().includes(searchLower)
              || String(a.phone ?? '').includes(searchLower)
              || pays.all.some((p: any) => String(p.txnid ?? '').toLowerCase().includes(searchLower));
            const marketerMatch = applicationsMarketerFilter === 'all'
              || (applicationsMarketerFilter === 'unassigned'
                    ? !a.assigned_marketer_id
                    : a.assigned_marketer_id === applicationsMarketerFilter);
            return eventMatch && dateMatch && statusMatch && searchMatch && marketerMatch;
          });
          // Dates that actually have leads (respecting the current event filter),
          // so the date dropdown only ever offers dates worth picking. Formatted
          // for the option labels; sorted chronologically.
          const fmtFilterDate = (iso: string) => {
            const d = new Date(`${iso}T00:00:00`);
            return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          };
          const dateFilterOptions: string[] = Array.from(new Set<string>(
            applications
              .filter(a => applicationsEventFilter === 'all' || a.event_slug === applicationsEventFilter)
              .map(a => String(a.selected_date ?? ''))
              .filter(d => !!d)
          )).sort();
          // A doubt is "handled" the moment that person actually submits an
          // application for the same event — a real, non-gameable outcome (a
          // marketer can't fake it; the person fills the form themselves).
          // Derived from the applications list, so it's always accurate.
          const last10 = (p: any) => String(p ?? '').replace(/\D/g, '').slice(-10);
          const appliedKeys = new Set(
            applications.map(a => `${last10(a.phone)}__${String(a.event_slug ?? '').toLowerCase()}`)
          );
          const doubtHasApplied = (submission: any): boolean => {
            const phone10 = last10(submission.phone);
            if (!phone10) return false;
            const raw = (submission.event_title || submission.event_slug || '').trim();
            const trip = trips.find(t => t.title === raw || t.slug === raw || t.invite_slug === raw);
            const slug = String(trip?.slug ?? submission.event_slug ?? '').toLowerCase();
            return !!slug && appliedKeys.has(`${phone10}__${slug}`);
          };

          const filteredDoubtSubmissions = (planDoubts ?? []).filter((submission) => {
            const submissionPlan = getDoubtSubmissionPlanName(submission);
            const planMatch = qnaDoubtPlanFilter === 'all'
              ? true
              : submissionPlan.toLowerCase() === qnaDoubtPlanFilter.trim().toLowerCase();
            const cityMatch = qnaDoubtCityFilter === 'all'
              || (submission.city ?? '').toLowerCase().includes(qnaDoubtCityFilter.toLowerCase());
            const marketerMatch = applicationsMarketerFilter === 'all'
              || (applicationsMarketerFilter === 'unassigned'
                    ? !submission.assigned_marketer_id
                    : submission.assigned_marketer_id === applicationsMarketerFilter);
            return planMatch && cityMatch && marketerMatch;
          // Open doubts (not yet applied) surface above handled ones.
          }).sort((a, b) => Number(doubtHasApplied(a)) - Number(doubtHasApplied(b)));

          const statusColor = (status: string) => {
            if (status === 'fully_paid')   return '#16a34a';
            if (status === 'advance_paid') return '#84cc16';
            if (status === 'invited')        return '#2196f3';
            if (status === 'cart_abandoned') return '#b45309';
            if (status === 're_target')      return '#7c3aed';
            if (status === 'waitlist')       return '#a855f7';
            if (status === 'in_progress')    return '#0891b2';
            if (status === 'pending')        return '#f97316';
            if (status === 'rejected')       return '#dc2626';
            return '#999';
          };

          // "Recovered" = a paid lead who had previously been cart-abandoned
          // (recovered_at stamped by payu-callback). Shown as a small badge on
          // top of their paid status, not as a replacement.
          const recoveredBadge = (a: any) => a.recovered_at ? (
            <span style={{ marginLeft: 6, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: 6, padding: '2px 7px', fontSize: 10, fontWeight: 700, textTransform: 'none' }}>Recovered</span>
          ) : null;

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

          // Download exactly what's on screen (current mode + active filters) as a
          // CSV. Excel/Google Sheets open it directly; the BOM keeps unicode intact.
          const exportCsv = () => {
            const esc = (v: any) => `"${(v == null ? '' : String(v)).replace(/"/g, '""')}"`;
            const prettyStatus = (st: string) => st.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            const callLabel = (cs: string) => callStatusOptions.find(o => o.value === cs)?.label ?? cs;

            let cols: string[];
            let rows: (string | number)[][];
            if (peopleMode === 'doubts') {
              cols = ['Name', 'Phone', 'Plan', 'City', 'Reporting Date', 'Doubt', 'Why Join', 'Invited'];
              rows = filteredDoubtSubmissions.map((d: any) => [
                d.name ?? '', d.phone ?? '', getDoubtSubmissionPlanName(d), d.city ?? '',
                (d.reporting_date ?? '') || formatAdminDateTime(d.submitted_at ?? d.created_at),
                d.doubt ?? d.message ?? '', d.why_join ?? '', doubtHasApplied(d) ? 'Yes' : 'No',
              ]);
            } else {
              cols = ['Name', 'Phone', 'Event', 'City', 'Meeting Point', 'Status', 'Call Status',
                      'Call Notes', 'Why Join', 'Marketer', 'Applied At', 'Transaction IDs', 'Amount Paid'];
              rows = filteredApps.map(app => {
                const pays = paymentsFor(app.phone, app.event_slug);
                const txns = pays.all.map((p: any) => p.txnid).filter(Boolean).join(' | ');
                const amount = pays.all.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
                const callSt = callStatusEdits[app.id] ?? app.call_status ?? 'not_called';
                const callNt = callNotesEdits[app.id] ?? app.call_notes ?? '';
                const pickupSpot = String(app.pickup_label ?? '').split(' — ')[0].trim();
                return [
                  app.name ?? '', app.phone ?? '',
                  titleBySlug[app.event_slug] ?? app.event_slug ?? '',
                  app.selected_city ?? '', pickupSpot,
                  prettyStatus(displayStatus(app)), callLabel(callSt), callNt, app.why_join ?? '',
                  (app.assigned_marketer_id && marketerNameById[app.assigned_marketer_id]) || '',
                  formatAdminDateTime(app.created_at), txns, amount || '',
                ];
              });
            }

            const csv = [cols, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
            const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `people-${peopleMode}-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
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
            pending:      filteredApps.filter(a => displayStatus(a) === 'pending').length,
            in_progress:  filteredApps.filter(a => displayStatus(a) === 'in_progress').length,
            invited:        filteredApps.filter(a => displayStatus(a) === 'invited').length,
            cart_abandoned: filteredApps.filter(a => displayStatus(a) === 'cart_abandoned').length,
            re_target:      filteredApps.filter(a => displayStatus(a) === 're_target').length,
            waitlist:       filteredApps.filter(a => a.status === 'waitlist').length,
            advance_paid: filteredApps.filter(a => a.status === 'advance_paid').length,
            fully_paid:   filteredApps.filter(a => a.status === 'fully_paid').length,
            recovered:    filteredApps.filter(a => !!a.recovered_at).length,
          };

          // Header columns per mode
          const headers: Record<typeof peopleMode, string[]> =
            peopleMode === 'call'
              ? { call: ['Name', 'Phone', 'Event', 'Call Status', 'Notes', 'Date', 'Action'], approval: [], payments: [], doubts: [] }
              : peopleMode === 'approval'
              ? { call: [], approval: ['Plan Name', 'Why Join', 'Action'], payments: [], doubts: [] }
              : peopleMode === 'payments'
              ? { call: [], approval: [], payments: ['Name', 'Plan', 'Status', 'Transaction IDs'], doubts: [] }
              : { call: [], approval: [], payments: [], doubts: ['Name / Doubt', 'Plan', 'City', 'Reporting Date', 'Phone', 'Reply'] };

          return (
            <div>
              {/* Commission banner — only when the logged-in user is a marketer.
                  Counts this calendar month's sales (status moved to fully_paid). */}
              {currentMarketer && myCommissionStats && (() => {
                const fullyPaid   = applications.filter(a => a.status === 'fully_paid').length;
                const advanceOnly = applications.filter(a => a.status === 'advance_paid').length;
                const paidAdvance = fullyPaid + advanceOnly;
                const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN');
                // minWidth:0 lets the three tiles shrink to share one row on
                // mobile (instead of wrapping unevenly); uniform value size keeps
                // their heights equal.
                const Tile = ({ label, value, accent }: { label: string; value: any; accent?: boolean }) => (
                  <div style={{ flex: 1, minWidth: 0, background: accent ? '#f0fdf4' : '#fafafa', border: `1px solid ${accent ? '#bbf7d0' : '#eee'}`, borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: accent ? '#15803d' : '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: accent ? '#16a34a' : '#111', lineHeight: 1.1, marginTop: 3 }}>{value}</div>
                  </div>
                );
                return (
                <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Your stats */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Tile label="Paid advance" value={paidAdvance} />
                    <Tile label="Fully paid" value={fullyPaid} />
                    <Tile label="Est. earning" value={inr(paidAdvance * (currentMarketer.commission_amount || 0))} accent />
                  </div>
                  <div style={{ fontSize: 11, color: '#999', paddingLeft: 2 }}>
                    Estimated if everyone who paid the advance also pays their full balance — you're paid ₹{currentMarketer.commission_amount}/ticket only on full payment.
                  </div>

                  {/* Transparent team board */}
                  {/* Flex rows (not a table) so it fits any width without
                      horizontal scroll: name flexes + truncates, the two number
                      columns are fixed-width and right-aligned. */}
                  {marketerBoard.length > 0 && (
                    <div style={{ background: '#fff', border: '1px solid #ececec', borderRadius: 12, overflow: 'hidden', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', color: '#999', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                        <span style={{ flex: 1, minWidth: 0 }}>The Team</span>
                        <span style={{ width: 48, textAlign: 'right' }}>Sold</span>
                        <span style={{ width: 84, textAlign: 'right' }}>Earnings</span>
                      </div>
                      {marketerBoard.map((m) => {
                        const isMe = m.marketer_id === currentMarketer.id;
                        return (
                          <div key={m.marketer_id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderTop: '1px solid #f5f5f0', background: isMe ? '#f0fdf4' : 'transparent' }}>
                            <span style={{ flex: 1, minWidth: 0, fontWeight: isMe ? 700 : 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.name}{isMe && <span style={{ fontSize: 10, color: '#16a34a', marginLeft: 6 }}>you</span>}
                            </span>
                            <span style={{ width: 48, textAlign: 'right', color: '#111', fontWeight: 600 }}>{m.tickets_sold}</span>
                            <span style={{ width: 84, textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>{inr(m.estimated_earning)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                );
              })()}

              {/* Assigned events + per-date spots left — marketer view only.
                  Reserved totals come from the SECURITY DEFINER RPC, so they
                  reflect ALL bookings, not just this marketer's leads. */}
              {currentMarketer && (() => {
                const today = new Date().toISOString().slice(0, 10);
                const assigned = trips.filter(t =>
                  t.is_active &&
                  marketerAssignedSlugs.includes(t.slug ?? '') &&
                  (t.event_dates ?? []).some(d => d.start_date && d.start_date >= today)
                );
                if (assigned.length === 0) return null;
                return (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Your Events — Spots Left</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {assigned.map(t => {
                        const capacity = (t.total_capacity ?? t.invite_spots) ?? null;
                        const dateCounts = marketerEventDateCounts[t.slug ?? ''] ?? {};
                        const dates = (t.event_dates ?? [])
                          .filter(d => d.start_date && d.start_date >= today)
                          .slice()
                          .sort((a, b) => a.start_date.localeCompare(b.start_date));
                        return (
                          <div key={t.id ?? t.slug}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#111', marginBottom: 3 }}>{t.title}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 16px', fontSize: 13 }}>
                              {dates.map(d => {
                                const reserved = dateCounts[d.start_date]?.reserved ?? 0;
                                const spotsLeft = capacity != null ? Math.max(0, capacity - reserved) : null;
                                const soldOut = d.status === 'sold_out' || (spotsLeft !== null && spotsLeft <= 0);
                                const dateLabel = new Date(`${d.start_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                const text = soldOut ? 'Sold out' : spotsLeft != null ? `${spotsLeft} left` : statusLabel[d.status];
                                // Balance due = this date's "remaining balance" step date.
                                // Split events only — single-payment ('full') events have no
                                // balance step, so nothing is shown for them.
                                const balStep = ((d as any).booking_steps as Array<{ label: string; value: string; date: string }> | undefined)
                                  ?.find(s => /\{balance\}/i.test(s.value ?? '') || /balance/i.test(s.label ?? ''));
                                const balRaw = balStep?.date ?? '';
                                const balDateObj = balRaw ? new Date(`${balRaw}T00:00:00`) : null;
                                const balanceDue = balDateObj && !Number.isNaN(balDateObj.getTime())
                                  ? balDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                  : null;
                                return (
                                  <span key={d.start_date} style={{ whiteSpace: 'nowrap' }}>
                                    <span style={{ color: '#111', fontWeight: 600 }}>{dateLabel}</span>{' '}
                                    <span style={{ color: soldOut ? '#bbb' : '#666' }}>{text}</span>
                                    {balanceDue && <span style={{ color: '#999' }}> · balance by {balanceDue}</span>}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, fontSize: 22 }}>{currentMarketer ? 'My Leads' : 'People'}</div>
                <span style={{ fontSize: 13, color: '#888', fontWeight: 500 }}>
                  {counts.total} {peopleMode === 'doubts' ? (counts.total === 1 ? 'doubt' : 'doubts') : (counts.total === 1 ? 'person' : 'people')}
                  {peopleMode === 'doubts' && (() => {
                    const appliedCount = filteredDoubtSubmissions.filter(doubtHasApplied).length;
                    return appliedCount > 0 ? <span style={{ color: '#16a34a' }}> · {appliedCount} invited</span> : null;
                  })()}
                </span>
                <div style={{ flex: 1 }} />
                {adminRole === 'admin' && (
                <button
                  onClick={exportCsv}
                  disabled={counts.total === 0}
                  title="Download the current view (active filters applied) as a CSV — opens in Google Sheets / Excel"
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fff', cursor: counts.total === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: '#444', opacity: counts.total === 0 ? 0.55 : 1 }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
                )}
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
                  onChange={e => { setApplicationsEventFilter(e.target.value); setApplicationsDateFilter('all'); }}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', cursor: 'pointer', fontWeight: 500 }}
                >
                  <option value="all">All Events</option>
                  {nativeEventSlugs.map(slug => (
                    <option key={slug} value={slug}>{titleBySlug[slug] ?? slug}</option>
                  ))}
                </select>
                {dateFilterOptions.length > 1 && (
                  <select
                    value={applicationsDateFilter}
                    onChange={e => setApplicationsDateFilter(e.target.value)}
                    style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', cursor: 'pointer', fontWeight: 500 }}
                  >
                    <option value="all">All Dates</option>
                    {dateFilterOptions.map(d => (
                      <option key={d} value={d}>{fmtFilterDate(d)}</option>
                    ))}
                  </select>
                )}
                <select
                  value={applicationsStatusFilter}
                  onChange={e => setApplicationsStatusFilter(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', cursor: 'pointer', fontWeight: 500 }}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="invited">Invited</option>
                  <option value="cart_abandoned">Cart Abandoned</option>
                  <option value="re_target">Re-Target</option>
                  <option value="waitlist">Waitlist</option>
                  <option value="advance_paid">Advance Paid</option>
                  <option value="fully_paid">Fully Paid</option>
                  <option value="recovered">Recovered</option>
                  <option value="has_doubt">Raised Doubt</option>
                </select>
                {/* Marketer filter — admin-only (ops users only ever see their own leads). */}
                {adminRole === 'admin' && (
                  <select
                    value={applicationsMarketerFilter}
                    onChange={e => setApplicationsMarketerFilter(e.target.value)}
                    style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', cursor: 'pointer', fontWeight: 500 }}
                  >
                    <option value="all">All Marketers</option>
                    <option value="unassigned">Unassigned</option>
                    {Object.entries(marketerNameById)
                      .sort((a, b) => String(a[1]).localeCompare(String(b[1])))
                      .map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                )}
                <input
                  type="text"
                  placeholder="Search name or phone…"
                  value={peopleSearch}
                  onChange={e => setPeopleSearch(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', minWidth: 220 }}
                />
                {(applicationsEventFilter !== 'all' || applicationsDateFilter !== 'all' || applicationsStatusFilter !== 'all' || applicationsMarketerFilter !== 'all' || peopleSearch) && (
                  <button onClick={() => { setApplicationsEventFilter('all'); setApplicationsDateFilter('all'); setApplicationsStatusFilter('all'); setApplicationsMarketerFilter('all'); setPeopleSearch(''); }} style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
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
                {/* Marketer filter — admin-only, mirrors the Call tab. */}
                {adminRole === 'admin' && (
                  <select
                    value={applicationsMarketerFilter}
                    onChange={e => setApplicationsMarketerFilter(e.target.value)}
                    style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', cursor: 'pointer', fontWeight: 500 }}
                  >
                    <option value="all">All Marketers</option>
                    <option value="unassigned">Unassigned</option>
                    {Object.entries(marketerNameById)
                      .sort((a, b) => String(a[1]).localeCompare(String(b[1])))
                      .map(([id, name]) => (
                        <option key={id} value={id}>{name}</option>
                    ))}
                  </select>
                )}
                {(qnaDoubtCityFilter !== 'all' || qnaDoubtPlanFilter !== 'all' || applicationsMarketerFilter !== 'all') && (
                  <button onClick={() => { setQnaDoubtCityFilter('all'); setQnaDoubtPlanFilter('all'); setApplicationsMarketerFilter('all'); }} style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
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
                    const applied = doubtHasApplied(submission);

                    return (
                      <div
                        key={submission.id ?? `${submission.phone ?? 'submission'}-${index}`}
                        style={{ padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid #f0f0f0', background: applied ? '#fafafa' : '#fff', opacity: applied ? 0.65 : 1 }}
                      >
                        {/* Doubt — labeled field, primary, full width */}
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Doubt</div>
                        <p style={{ fontSize: 15, color: '#111', lineHeight: 1.55, margin: '0 0 10px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {doubtText}
                        </p>

                        {/* Why-join — same quiet labeled-field treatment, muted (no fill) */}
                        {(submission.why_join ?? '').trim() && (
                          <>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Why Join</div>
                            <p style={{ fontSize: 13.5, color: '#555', lineHeight: 1.5, margin: '0 0 10px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{submission.why_join}</p>
                          </>
                        )}

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
                            {/* Admin-only: which marketer owns this doubt. */}
                            {adminRole === 'admin' && submission.assigned_marketer_id && marketerNameById[submission.assigned_marketer_id] && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#555', background: '#f3f3f3', borderRadius: 999, padding: '2px 9px' }}>
                                👤 {marketerNameById[submission.assigned_marketer_id]}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            {applied && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 999, padding: '3px 9px' }}>
                                ✓ Invited
                              </span>
                            )}
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
                            {/* Turn a doubt straight into an invited application so
                                they don't re-apply. Visible to admins and marketers
                                (a marketer only sees their own assigned doubts, and
                                RLS forces the new application to be self-assigned).
                                Hidden once already invited. */}
                            {adminRole && phoneDigits && !applied && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Approve ${submitterName} and send the invite for ${eventName}?\n\nThis creates an application (status: invited) and sends the WhatsApp invite.`)) {
                                    approveDoubtSubmission(submission);
                                  }
                                }}
                                disabled={approvingDoubtId === submission.id}
                                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: approvingDoubtId === submission.id ? 'not-allowed' : 'pointer', opacity: approvingDoubtId === submission.id ? 0.6 : 1 }}
                              >
                                {approvingDoubtId === submission.id ? 'Sending…' : '✓ Approve'}
                              </button>
                            )}
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
                        // The date this applicant actually chose (shown muted next to the
                        // event name so the caller knows which date's cohort this lead is in).
                        const fmtShortDate = (iso: string) => {
                          const d = new Date(`${iso}T00:00:00`);
                          return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        };
                        const eventDateText = app.selected_date ? fmtShortDate(app.selected_date) : '';
                        // Multi-date events get a dropdown to move the applicant between dates.
                        const eventDates = datesBySlug[app.event_slug] ?? [];
                        // Once money has changed hands the date is locked: advance_paid
                        // (split) and fully_paid (full / single full payment) both mean
                        // the applicant is committed to a specific date's cohort, so the
                        // date can't be reassigned from here.
                        const dateLocked = app.status === 'advance_paid' || app.status === 'fully_paid';
                        const hasMultipleDates = eventDates.length > 1 && !dateLocked;

                        // ─── CALL MODE ───
                        const openDoubts = (app.doubts ?? []).filter((d: any) => d.status !== 'closed');
                        // Meeting point sub-line under the event title — useful for events
                        // with pickups in multiple cities (e.g. "Koyambedu, Chennai") so the
                        // caller knows exactly where the applicant is joining from. We only
                        // have the dropdown label saved (e.g. "Koyambedu — by 4:30 PM"), so
                        // strip the time half if present and combine with selected_city.
                        const pickupSpot = String(app.pickup_label ?? '').split(' — ')[0].trim();
                        const pickupCity = String(app.selected_city ?? '').trim();
                        const meetingLine = pickupSpot && pickupCity
                          ? `${pickupSpot}, ${pickupCity}`
                          : pickupSpot || pickupCity || '';
                        if (peopleMode === 'call') return (
                          <tr key={app.id} style={{ borderBottom: '1px solid #f0f0f0', verticalAlign: 'top', background: openDoubts.length > 0 ? '#fffbeb' : undefined }}>
                            <td style={{ padding: '11px 12px', maxWidth: 280, minWidth: 200 }} title={app.why_join ? `${app.name || '—'}\n${app.why_join}` : (app.name || '—')}>
                              <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {app.name || '—'}
                                {openDoubts.length > 0 && (
                                  <span title={`${openDoubts.length} unresolved doubt${openDoubts.length === 1 ? '' : 's'}`} style={{ marginLeft: 6, background: '#fde047', color: '#854d0e', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                                    💬 {openDoubts.length}
                                  </span>
                                )}
                              </div>
                              {app.why_join && (
                                <div style={{ fontSize: 10, color: '#888', marginTop: 2, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {app.why_join}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                              <a href={`tel:${app.phone}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>{app.phone || '—'}</a>
                            </td>
                            <td style={{ padding: '11px 12px', color: '#555', maxWidth: 180 }} title={meetingLine ? `${eventTitle}\n${meetingLine}` : eventTitle}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{eventTitle}</div>
                              {(meetingLine || eventDateText || hasMultipleDates) && (
                                <div style={{ fontSize: 10, color: '#888', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                                  {meetingLine && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meetingLine}</span>}
                                  {meetingLine && (eventDateText || hasMultipleDates) && <span style={{ color: '#bbb' }}>·</span>}
                                  {hasMultipleDates ? (
                                    <select
                                      value={app.selected_date ?? ''}
                                      disabled={savingDateId === app.id}
                                      onChange={e => updateApplicationDate(app.id, e.target.value)}
                                      title="Move this applicant to a different date"
                                      style={{ fontSize: 10, color: '#444', fontWeight: 600, background: '#f3f3f3', border: '1px solid #e0e0e0', borderRadius: 5, padding: '1px 4px', cursor: savingDateId === app.id ? 'wait' : 'pointer', maxWidth: 120 }}
                                    >
                                      {!app.selected_date && <option value="" disabled>Pick date</option>}
                                      {eventDates.map(d => (
                                        <option key={d.date} value={d.date}>{fmtShortDate(d.date)}{d.status === 'sold_out' ? ' (sold out)' : ''}</option>
                                      ))}
                                    </select>
                                  ) : eventDateText ? (
                                    <span style={{ color: '#aaa' }}>{eventDateText}</span>
                                  ) : null}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '11px 12px', width: 110 }}>
                              <select
                                value={callSt}
                                onChange={e => setCallStatusEdits(prev => ({ ...prev, [app.id]: e.target.value }))}
                                style={{ background: callBadgeColor(callSt) + '22', color: callBadgeColor(callSt), border: `1px solid ${callBadgeColor(callSt)}44`, borderRadius: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer', fontWeight: 600, width: '100%' }}
                              >
                                {callStatusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                              {/* Admin-only: which marketer owns this lead (first 3 letters). */}
                              {adminRole === 'admin' && app.assigned_marketer_id && marketerNameById[app.assigned_marketer_id] && (
                                <div title={marketerNameById[app.assigned_marketer_id]} style={{ marginTop: 5, fontSize: 10, color: '#999', fontWeight: 500 }}>
                                  {marketerNameById[app.assigned_marketer_id].slice(0, 3)}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '11px 12px', width: 150 }}>
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
                            <td style={{ padding: '11px 12px', color: '#888', whiteSpace: 'nowrap', fontSize: 10, width: 90 }}>{formatAdminDateTime(app.created_at)}</td>
                            <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                              {isDirty ? (
                                <button
                                  disabled={savingCallId === app.id}
                                  onClick={() => saveCallInfo(app.id)}
                                  style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: savingCallId === app.id ? 'not-allowed' : 'pointer', opacity: savingCallId === app.id ? 0.6 : 1, fontWeight: 600 }}
                                >
                                  {savingCallId === app.id ? 'Saving…' : 'Save'}
                                </button>
                              ) : (app.status === 'pending' && !openEventSlugs.has(app.event_slug)) ? (
                                <button
                                  disabled={approvingId === app.id}
                                  onClick={() => approveApplication(app.id)}
                                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: approvingId === app.id ? 'not-allowed' : 'pointer', opacity: approvingId === app.id ? 0.6 : 1, fontWeight: 600 }}
                                >
                                  {approvingId === app.id ? 'Sending…' : '✓ Approve'}
                                </button>
                              ) : (
                                <><span style={{ background: statusColor(displayStatus(app)) + '22', color: statusColor(displayStatus(app)), borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{String(displayStatus(app) ?? '').replace(/_/g, ' ')}</span>{recoveredBadge(app)}</>
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
                              {(app.status === 'pending' && !openEventSlugs.has(app.event_slug)) ? (
                                <button
                                  disabled={approvingId === app.id}
                                  onClick={() => approveApplication(app.id)}
                                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: approvingId === app.id ? 'not-allowed' : 'pointer', opacity: approvingId === app.id ? 0.6 : 1, fontWeight: 700 }}
                                >
                                  {approvingId === app.id ? 'Sending…' : '✓ Approve'}
                                </button>
                              ) : (
                                <>
                                  <span style={{ fontSize: 12, color: statusColor(displayStatus(app)), fontWeight: 700, textTransform: 'capitalize' }}>
                                    ✓ {String(displayStatus(app) ?? '').replace(/_/g, ' ')}
                                  </span>
                                  {recoveredBadge(app)}
                                </>
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
                              <span style={{ background: statusColor(displayStatus(app)) + '22', color: statusColor(displayStatus(app)), border: `1px solid ${statusColor(displayStatus(app))}44`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                                {String(displayStatus(app) ?? 'pending').replace(/_/g, ' ')}
                              </span>
                              {recoveredBadge(app)}
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
                  {counts.in_progress  > 0 && <span style={{ color: statusColor('in_progress')  }}>in progress: <b>{counts.in_progress}</b></span>}
                  {counts.invited        > 0 && <span style={{ color: statusColor('invited')        }}>invited: <b>{counts.invited}</b></span>}
                  {counts.cart_abandoned > 0 && <span style={{ color: statusColor('cart_abandoned') }}>cart abandoned: <b>{counts.cart_abandoned}</b></span>}
                  {counts.re_target      > 0 && <span style={{ color: statusColor('re_target')      }}>re-target: <b>{counts.re_target}</b></span>}
                  {counts.waitlist       > 0 && <span style={{ color: statusColor('waitlist')       }}>waitlist: <b>{counts.waitlist}</b></span>}
                  {counts.advance_paid > 0 && <span style={{ color: statusColor('advance_paid') }}>advance paid: <b>{counts.advance_paid}</b></span>}
                  {counts.fully_paid   > 0 && <span style={{ color: statusColor('fully_paid')   }}>fully paid: <b>{counts.fully_paid}</b></span>}
                  {counts.recovered    > 0 && <span style={{ color: '#059669' }}>recovered: <b>{counts.recovered}</b></span>}
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
                // Used as the 1st bot greeting. The earlier flow asked for city
                // first then plan; now it's plan-first (cities become meeting
                // points), so the label reads "Select Plan" and the old
                // 'select_event' row was removed. The 'select_event' template
                // stays dormant in chat_messages for any rollback.
                { key: 'welcome', label: 'Select Plan', placeholder: "Welcome to chapter அ! 👋 What plan do you wanna join?" },
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
          const windowLabel = analyticsWindow === '24h' ? 'Last 24 Hours' : analyticsWindow === 'week' ? 'Last Week' : analyticsWindow === 'month' ? 'Last Month' : 'Last 90 Days';

          // All figures come from the get_analytics_summary RPC (server-side,
          // uncapped). The previous client-side aggregation over raw rows hit
          // PostgREST's 1000-row response cap and silently undercounted — e.g.
          // "Last Month" showed ~328 visitors when the true figure was ~9,000.
          const summary: any = analyticsSummary;
          const visitors = summary?.visitors ?? 0;

          // Per-event stage maps, rebuilt from the flat funnel array the RPC
          // returns. Each entry is distinct sessions for that resolved live
          // event at that funnel stage.
          const funnelRows: Array<{ event_id: string; stage: string; sessions: number }> = summary?.funnel ?? [];
          const stageMap = (stage: string): Record<string, number> => {
            const m: Record<string, number> = {};
            funnelRows.forEach(r => { if (r.stage === stage) m[r.event_id] = r.sessions; });
            return m;
          };
          const detailsOpenedByEvent = stageMap('event_selected');
          const calendarOpenedByEvent = stageMap('calendar_opened');
          const datePickedByEvent = stageMap('date_selected');
          const reachedByEvent = stageMap('reached_pricing');
          const bookCtaByEvent = stageMap('book_cta_clicked');
          const contactCtaByEvent = stageMap('contact_cta_clicked');
          const legacyCtaByEvent = stageMap('pricing_cta_clicked');
          // 'converted_any' is the server-deduped union of the three CTA types
          // (a session that tapped more than one CTA counts once).
          const convertedByEvent = stageMap('converted_any');
          const redirectedByEvent = stageMap('external_redirect_initiated');
          // Application funnel stages (per resolved event)
          const appStartedByEvent = stageMap('application_started');
          const appSubmittedByEvent = stageMap('application_submitted');
          // Per-event application status counts (from apps_per_event in the RPC).
          // Keyed by event id (string) so it joins with the funnel-stage maps.
          const appsApprovedByEvent: Record<string, number> = {};
          const appsAdvancePaidByEvent: Record<string, number> = {};
          ((summary?.apps_per_event ?? []) as Array<{ event_id: string; approved: number; advance_paid: number }>).forEach((row) => {
            appsApprovedByEvent[row.event_id] = row.approved || 0;
            appsAdvancePaidByEvent[row.event_id] = row.advance_paid || 0;
          });
          // Doubt Solved Rate: per event, how many doubt-askers went on to apply.
          // (Derived server-side in the RPC; see doubts_per_event.)
          const doubtsTotalByEvent: Record<string, number> = {};
          const doubtsSolvedByEvent: Record<string, number> = {};
          ((summary?.doubts_per_event ?? []) as Array<{ event_id: string; total: number; solved: number }>).forEach((row) => {
            doubtsTotalByEvent[row.event_id] = row.total || 0;
            doubtsSolvedByEvent[row.event_id] = row.solved || 0;
          });
          const totalDoubtsAll  = Object.values(doubtsTotalByEvent).reduce((s, n) => s + n, 0);
          const solvedDoubtsAll = Object.values(doubtsSolvedByEvent).reduce((s, n) => s + n, 0);
          const doubtSolvedPctAll = totalDoubtsAll > 0 ? Math.round((solvedDoubtsAll / totalDoubtsAll) * 100) : null;

          // Cities pie (count of city_selected rows per city). The tracked
          // value is often a pickup-point phrasing — "I'll join in Chennai",
          // "Pick me up in Chennai", "I'll come to Chennai by own transport" —
          // which all mean the same city. Normalize to the bare city name and
          // merge the slices so the chart reads Chennai / Pondy / Delhi etc.
          const normalizeCity = (raw: string): string => {
            let c = (raw || '').trim();
            let m: RegExpMatchArray | null;
            if ((m = c.match(/^i['’]?ll join in (.+)$/i)))                 c = m[1];
            else if ((m = c.match(/^pick me up in (.+)$/i)))                    c = m[1];
            else if ((m = c.match(/^i['’]?ll come to (.+?) by .+$/i)))      c = m[1];
            c = c.trim();
            if (/^pondicherry$/i.test(c)) c = 'Pondy';
            return c;
          };
          const cityEntries: Array<{ city: string; count: number }> = summary?.cities ?? [];
          const cityMerged: Record<string, number> = {};
          cityEntries.forEach(({ city, count }) => {
            const key = normalizeCity(city);
            if (!key) return;
            cityMerged[key] = (cityMerged[key] || 0) + count;
          });
          const sortedCities: [string, number][] = Object.entries(cityMerged).sort((a, b) => b[1] - a[1]);
          const cityTotal = sortedCities.reduce((s, [, c]) => s + c, 0) || 1;

          // Chosen-plan pie. Group by plan TITLE, not the raw tracked event_id.
          // Slugs change over time (duplicated events get "-copy-…" slugs), so
          // one plan can be tracked under several event_ids — that's why
          // "Sunrise at Kolukumalai" showed up twice (one slug matched a live
          // trip, the other didn't → "(Unknown City)"). Grouping by title merges
          // them into a single slice and drops the misleading city suffix.
          const popEntries: Array<{ event_id: string; title?: string; count: number }> = summary?.event_popularity ?? [];
          const popTitleById = new Map<string, string>();
          popEntries.forEach(p => { if (p.title) popTitleById.set(p.event_id, p.title); });
          // Group case-insensitively so "Galore - Board Game Meetup" and
          // "galore - board game meetup" merge; display the casing from the
          // most-clicked variant.
          // Group key collapses known aliases of the same plan that were
          // tracked under different titles over time. Board Game Meetup /
          // Galore - Board Game Meetup / Board Games by Galcode are the same
          // event. Everything else groups case-insensitively by title.
          const planGroupKey = (title: string): string => {
            const l = title.toLowerCase();
            if (l.includes('board game') || l.includes('galcode')) return '__board_games__';
            return l;
          };
          const planAgg: Record<string, { label: string; count: number; topVariant: number }> = {};
          popEntries.forEach(({ event_id, title, count }) => {
            const display = (title && title.trim()) ? title.trim() : event_id;
            const key = planGroupKey(display);
            const cur = planAgg[key] || { label: display, count: 0, topVariant: -1 };
            cur.count += count;
            if (count > cur.topVariant) { cur.label = display; cur.topVariant = count; }
            planAgg[key] = cur;
          });
          const sortedEvents: [string, number][] = Object.values(planAgg)
            .map(v => [v.label, v.count] as [string, number])
            .sort((a, b) => b[1] - a[1]);
          const eventTotal = sortedEvents.reduce((s, [, c]) => s + c, 0) || 1;

          // Labels resolved client-side from live trips state.
          const tripById = new Map<string, Trip>();
          trips.forEach((t) => {
            if (t.id) tripById.set(t.id as string, t);
            if (t.slug) tripById.set(t.slug, t);
          });
          const eventLabelById = (eventId: string, fallbackTitle?: string) => {
            const trip = tripById.get(eventId);
            const title = trip?.title ?? fallbackTitle ?? popTitleById.get(eventId) ?? 'Unknown Plan';
            const cities = trip?.cities ?? [];
            const primaryCity = cities.find(c => (c ?? '').trim().toLowerCase() !== 'other') ?? cities[0] ?? 'Unknown City';
            return `${title} (${primaryCity})`;
          };

          // Overview averages — unweighted across events that have data.
          const roundAvg = (nums: number[]) => nums.length > 0 ? Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length) : 0;
          const joinPlanRates = Object.entries(detailsOpenedByEvent).flatMap(([id, details]) =>
            details > 0 ? [((calendarOpenedByEvent[id] || 0) / details) * 100] : []);
          const datePickRates = Object.entries(calendarOpenedByEvent).flatMap(([id, opened]) =>
            opened > 0 ? [((datePickedByEvent[id] || 0) / opened) * 100] : []);
          const pricingConvRates = Object.entries(reachedByEvent).flatMap(([id, reached]) =>
            reached > 0 ? [((convertedByEvent[id] || 0) / reached) * 100] : []);
          const handoffRates = Object.entries(reachedByEvent).flatMap(([id, reached]) =>
            reached > 0 ? [((redirectedByEvent[id] || 0) / reached) * 100] : []);
          const avgJoinPlanPct = roundAvg(joinPlanRates);
          const avgDatePickPct = roundAvg(datePickRates);
          const avgPricingConvPct = roundAvg(pricingConvRates);
          const avgHandoffPct = roundAvg(handoffRates);

          // POOLED global rates for the JOURNEY funnel at the top. Pool means
          // total numerator across events / total denominator across events
          // (not per-event averaged) — more robust against small/test events.
          const sumStage = (m: Record<string, number>) => Object.values(m).reduce((s, n) => s + n, 0);
          const totalDetailViews     = sumStage(detailsOpenedByEvent);
          const totalCalendarOpens   = sumStage(calendarOpenedByEvent);
          const totalDatePicks       = sumStage(datePickedByEvent);
          const totalReachedPricing  = sumStage(reachedByEvent);
          const totalCtaClicked      = sumStage(convertedByEvent);
          const totalAppStarted      = sumStage(appStartedByEvent);
          const totalAppSubmitted    = sumStage(appSubmittedByEvent);
          const totalApproved        = sumStage(appsApprovedByEvent);
          const totalAdvancePaid     = sumStage(appsAdvancePaidByEvent);
          const pooledPct = (num: number, den: number) => den > 0 ? Math.round((num / den) * 100) : null;
          const pooledJoinPlanPct    = pooledPct(totalCalendarOpens,  totalDetailViews);
          const pooledDatePickPct    = pooledPct(totalDatePicks,      totalCalendarOpens);
          const pooledPricingConvPct = pooledPct(totalCtaClicked,     totalReachedPricing);
          const pooledAppComplPct    = pooledPct(totalAppSubmitted,   totalAppStarted);
          const pooledPaymentConvPct = pooledPct(totalAdvancePaid,    totalApproved);

          const allJoinPlanEvents = Array.from(new Set([...Object.keys(detailsOpenedByEvent), ...Object.keys(calendarOpenedByEvent)]));
          const allCalendarEvents = Array.from(new Set([...Object.keys(calendarOpenedByEvent), ...Object.keys(datePickedByEvent)]));
          const allDropoffEvents  = Array.from(new Set([...Object.keys(reachedByEvent), ...Object.keys(convertedByEvent)]));
          // The Application Completion + Payment Conversion sections also show
          // events that have application/payment data even if no analytics events
          // were tracked for them yet.
          const allAppFunnelEvents = Array.from(new Set([
            ...Object.keys(appStartedByEvent), ...Object.keys(appSubmittedByEvent),
            ...Object.keys(appsApprovedByEvent), ...Object.keys(appsAdvancePaidByEvent),
          ]));
          const allFunnelEventOptions = Array.from(
            new Set([...allJoinPlanEvents, ...allCalendarEvents, ...allDropoffEvents, ...allAppFunnelEvents])
          ).sort((a, b) => eventLabelById(a).localeCompare(eventLabelById(b)));
          // Split into active (shown by default) vs hidden/inactive (opt-in via
          // checkboxes). A funnel event id is a resolved events-table id, so
          // tripById knows its is_active flag.
          const activeFunnelEvents = allFunnelEventOptions.filter(id => tripById.get(id)?.is_active);
          const hiddenFunnelEvents = allFunnelEventOptions.filter(id => !tripById.get(id)?.is_active);
          // Default selection (when funnelSelected is null) = active events only.
          const effectiveSelected: Set<string> = funnelSelected ?? new Set<string>(activeFunnelEvents);
          const toggleFunnelEvent = (id: string) => {
            const base = new Set(funnelSelected ?? activeFunnelEvents);
            if (base.has(id)) base.delete(id); else base.add(id);
            setFunnelSelected(base);
          };
          const filterFunnelEvents = (eventIds: string[]) => eventIds.filter(id => effectiveSelected.has(id));
          const visibleJoinPlanEvents = filterFunnelEvents(allJoinPlanEvents);
          const visibleCalendarEvents = filterFunnelEvents(allCalendarEvents);
          const visibleDropoffEvents  = filterFunnelEvents(allDropoffEvents);
          // For Application Completion + Payment Conversion: iterate ALL selected
          // events (even those without data); each row shows "—" + "no data yet"
          // if its denominator is 0. Sorted alphabetically for stability.
          const visibleAppEvents = Array.from(effectiveSelected).sort((a, b) => eventLabelById(a).localeCompare(eventLabelById(b)));

          const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
            <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 12, color: '#999', fontWeight: 600, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#111', lineHeight: 1 }}>{value}</div>
              {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{sub}</div>}
            </div>
          );

          // Trigger a CSV file download from in-memory rows. BOM keeps unicode
          // intact in Excel / Google Sheets.
          const downloadCsv = (filename: string, cols: string[], rows: (string | number)[][]) => {
            const esc = (v: any) => `"${(v == null ? '' : String(v)).replace(/"/g, '""')}"`;
            const csv = [cols, ...rows].map(r => r.map(esc).join(',')).join('\r\n');
            const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          };

          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 20, flex: 1 }}>Analytics</div>
                <div style={{ position: 'relative' }}>
                  <select
                    value={analyticsWindow}
                    onChange={e => { const w = e.target.value as '24h' | 'week' | 'month' | '90d'; setAnalyticsWindow(w); loadAnalytics(w); }}
                    style={{ ...s.input, fontSize: 13, fontWeight: 600, padding: '7px 32px 7px 12px', borderRadius: 999, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', minWidth: 130 }}
                  >
                    <option value="24h">Last 24 Hours</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="90d">Last 90 Days</option>
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
                  {/* JOURNEY — vertical bar funnel, 6 steps, all rates POOLED
                      globally (sum across events / sum across events). Visitors
                      is shown as a count (no bar). Application Completion shows
                      "—" until app-open tracking populates. Time to Payment is
                      shown inline as part of the Payment Conversion sub-text. */}
                  {(() => {
                    const fmt = (n: number) => Number(n || 0).toLocaleString('en-IN');
                    const cf = conversionFunnel;
                    const ttpHours = cf?.time_to_payment_median_hours ?? null;
                    const ttpN     = cf?.time_to_payment_n ?? 0;
                    const ttpLabel = ttpHours == null ? null
                      : ttpHours < 1  ? `${Math.round(ttpHours * 60)} min`
                      : ttpHours < 48 ? `${ttpHours} hrs`
                      : `${(ttpHours / 24).toFixed(1)} days`;
                    type Step = { label: string; pct: number | null; num: number; den: number; descr: string; emptyText?: string; extra?: string };
                    const steps: Step[] = [
                      { label: 'Join Plan Rate',        pct: pooledJoinPlanPct,    num: totalCalendarOpens,  den: totalDetailViews,    descr: 'who reached event details clicked Join Our Plan' },
                      { label: 'Date Pick Rate',        pct: pooledDatePickPct,    num: totalDatePicks,      den: totalCalendarOpens,  descr: 'who opened the calendar picked a date' },
                      { label: 'Pricing Conversion',    pct: pooledPricingConvPct, num: totalCtaClicked,     den: totalReachedPricing, descr: 'who reached pricing tapped a CTA' },
                      { label: 'Application Completion',pct: pooledAppComplPct,    num: totalAppSubmitted,   den: totalAppStarted,     descr: 'who opened the form submitted', emptyText: 'collecting data — form opens tracked from now' },
                      { label: 'Payment Conversion',    pct: pooledPaymentConvPct, num: totalAdvancePaid,    den: totalApproved,       descr: 'approved paid the advance', extra: ttpLabel ? ` · median ${ttpLabel} (n=${ttpN})` : '' },
                    ];
                    const downloadJourneyCsv = () => {
                      const rows: (string | number)[][] = [
                        ['Visitors', '', fmt(visitors), '', `${windowLabel} · unique sessions`],
                        ...steps.map(step => [
                          step.label,
                          step.pct === null ? '' : `${step.pct}%`,
                          step.pct === null ? '' : fmt(step.num),
                          step.pct === null ? '' : fmt(step.den),
                          step.pct === null ? (step.emptyText || 'no data yet') : `${step.descr}${step.extra ?? ''}`,
                        ]),
                      ];
                      downloadCsv(`journey-${analyticsWindow}-${new Date().toISOString().slice(0, 10)}.csv`, ['Step', 'Rate', 'Numerator', 'Denominator', 'Description'], rows);
                    };
                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, flex: 1 }}>Journey</div>
                          <button
                            onClick={downloadJourneyCsv}
                            title="Download the journey funnel for the selected window as a CSV"
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#444' }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Download
                          </button>
                        </div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: -6, marginBottom: 10 }}>
                          The full customer journey, all events combined for {windowLabel.toLowerCase()}. Each bar width = the rate at that step. Where the bar is narrow is where you're losing people.
                        </div>
                        <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '20px 22px', marginBottom: 24 }}>
                          {/* Step 1: Visitors — count, no bar, no top border */}
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Visitors</span>
                              <span style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>{fmt(visitors)}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#bbb' }}>
                              {windowLabel.toLowerCase()} · unique sessions
                            </div>
                          </div>
                          {/* Steps 2-6: each is a pooled rate with a bar */}
                          {steps.map((step, i, arr) => {
                            const isLast = i === arr.length - 1;
                            const isEmpty = step.pct === null;
                            return (
                              <div key={step.label} style={{ marginBottom: isLast ? 0 : 16, paddingTop: 16, borderTop: '1px solid #f0f0ea' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{step.label}</span>
                                  <span style={{ fontSize: 22, fontWeight: 800, color: isEmpty ? '#bbb' : '#111' }}>{isEmpty ? '—' : `${step.pct}%`}</span>
                                </div>
                                <div style={{ height: 8, background: '#f0f0ea', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                                  <div style={{ width: isEmpty ? '4%' : `${Math.min(100, step.pct as number)}%`, height: '100%', background: isEmpty ? '#e5e5e5' : '#bbf7d0', borderRadius: 99, transition: 'width 0.4s' }} />
                                </div>
                                <div style={{ fontSize: 11, color: '#bbb' }}>
                                  {isEmpty
                                    ? (step.emptyText || 'no data yet')
                                    : `${fmt(step.num)} of ${fmt(step.den)} ${step.descr}${step.extra ?? ''}`}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}

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
                          <PieChart entries={sortedCities.filter(([, c]) => Math.round((c / cityTotal) * 100) >= 1)} total={cityTotal} />
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
                      const slices = sortedEvents.filter(([, count]) => Math.round((count / (eventTotal || 1)) * 100) >= 1).map(([label, count], idx) => {
                        const angle = (count / (eventTotal || 1)) * 2 * Math.PI;
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

                  {/* Funnel event filter — multi-select with checkboxes so the
                      admin can toggle hidden (inactive) events into the rate
                      sections below. Active events are shown by default. */}
                  {(() => {
                    const allSelected = funnelSelected === null;
                    const btnLabel = allSelected
                      ? 'All Events'
                      : `${effectiveSelected.size} event${effectiveSelected.size === 1 ? '' : 's'} selected`;
                    const checkRow = (id: string) => (
                      <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                        onMouseDown={e => e.preventDefault()}>
                        <input type="checkbox" checked={effectiveSelected.has(id)} onChange={() => toggleFunnelEvent(id)} style={{ cursor: 'pointer' }} />
                        <span style={{ color: '#222' }}>{eventLabelById(id)}</span>
                      </label>
                    );
                    // Export the full end-to-end funnel for whichever events are
                    // currently picked in the dropdown. One row per event, with
                    // every stage count + the four key conversion rates.
                    const downloadFunnelCsv = () => {
                      const ids = Array.from(effectiveSelected).sort((a, b) => eventLabelById(a).localeCompare(eventLabelById(b)));
                      const pct = (n: number, d: number) => d > 0 ? `${Math.round((n / d) * 100)}%` : '';
                      const cols = [
                        'Event',
                        'Details Opened', 'Calendar Opened', 'Join Plan Rate',
                        'Date Picked', 'Date Pick Rate',
                        'Reached Pricing', 'Tapped Book Now', 'Tapped Contact Us', 'Total CTA', 'Pricing Conversion Rate',
                        'Application Started', 'Application Submitted', 'Application Completion Rate',
                        'Approved', 'Advance Paid', 'Payment Conversion Rate',
                        'Doubt-Askers', 'Doubts → Applied', 'Doubt Solved Rate',
                      ];
                      const rows: (string | number)[][] = ids.map(id => {
                        const viewed   = detailsOpenedByEvent[id]   || 0;
                        const opened   = calendarOpenedByEvent[id]  || 0;
                        const picked   = datePickedByEvent[id]      || 0;
                        const reached  = reachedByEvent[id]         || 0;
                        const booked   = (bookCtaByEvent[id] || 0) + (legacyCtaByEvent[id] || 0);
                        const contact  = contactCtaByEvent[id]      || 0;
                        const totalCta = booked + contact;
                        const started  = appStartedByEvent[id]      || 0;
                        const submitted= appSubmittedByEvent[id]    || 0;
                        const approved = appsApprovedByEvent[id]    || 0;
                        const paid     = appsAdvancePaidByEvent[id] || 0;
                        const doubts   = doubtsTotalByEvent[id]     || 0;
                        const solved   = doubtsSolvedByEvent[id]    || 0;
                        return [
                          eventLabelById(id),
                          viewed, opened, pct(opened, viewed),
                          picked, pct(picked, opened),
                          reached, booked, contact, totalCta, pct(totalCta, reached),
                          started, submitted, pct(submitted, started),
                          approved, paid, pct(paid, approved),
                          doubts, solved, pct(solved, doubts),
                        ];
                      });
                      downloadCsv(`funnel-${analyticsWindow}-${new Date().toISOString().slice(0, 10)}.csv`, cols, rows);
                    };
                    return (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 10 }}>
                        <button
                          type="button"
                          onClick={downloadFunnelCsv}
                          disabled={effectiveSelected.size === 0}
                          title="Download the full end-to-end funnel for the selected events as a CSV"
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, border: '1.5px solid #e0e0e0', background: '#fff', cursor: effectiveSelected.size === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: '#444', opacity: effectiveSelected.size === 0 ? 0.55 : 1 }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          Download
                        </button>
                        <div style={{ position: 'relative', minWidth: 220 }}>
                          <button
                            type="button"
                            onClick={() => setFunnelDropdownOpen(o => !o)}
                            style={{ ...s.input, fontSize: 13, fontWeight: 600, padding: '7px 32px 7px 12px', borderRadius: 999, cursor: 'pointer', width: '100%', textAlign: 'left', background: '#fff' }}
                          >
                            {btnLabel}
                          </button>
                          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#777', pointerEvents: 'none' }}>▾</span>
                          {funnelDropdownOpen && (
                            <>
                              <div onClick={() => setFunnelDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 50, background: '#fff', border: '1px solid #e6e6e6', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.14)', padding: 8, minWidth: 280, maxHeight: 340, overflowY: 'auto' }}>
                                <button
                                  type="button"
                                  onClick={() => setFunnelSelected(null)}
                                  style={{ width: '100%', textAlign: 'left', padding: '7px 10px', borderRadius: 8, border: 'none', background: allSelected ? '#f1f1ee' : 'transparent', fontSize: 12, fontWeight: 700, color: '#555', cursor: 'pointer' }}
                                >
                                  ↺ Reset to active events
                                </button>
                                <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.6, padding: '8px 10px 4px' }}>Active</div>
                                {activeFunnelEvents.length === 0 && <div style={{ padding: '4px 10px', fontSize: 12, color: '#bbb' }}>None with data</div>}
                                {activeFunnelEvents.map(id => checkRow(id))}
                                {hiddenFunnelEvents.length > 0 && (
                                  <>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.6, padding: '10px 10px 4px', borderTop: '1px solid #f0f0ec', marginTop: 4 }}>Hidden (inactive)</div>
                                    {hiddenFunnelEvents.map(id => checkRow(id))}
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
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
                            <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: pct >= 50 ? '#bbf7d0' : pct >= 25 ? '#fde68a' : '#fecaca', borderRadius: 99, transition: 'width 0.4s' }} />
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
                            <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: pct >= 50 ? '#bbf7d0' : pct >= 25 ? '#fde68a' : '#fecaca', borderRadius: 99, transition: 'width 0.4s' }} />
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
                            <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: pct >= 50 ? '#bbf7d0' : pct >= 25 ? '#fde68a' : '#fecaca', borderRadius: 99, transition: 'width 0.4s' }} />
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

                  {/* Application Completion Rate — per event: app_submitted / app_started.
                      Tracks form-open → form-submit. Iterates ALL selected events so
                      newly-tracked plans without data still appear with '—'. */}
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Application Completion Rate</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: -6, marginBottom: 10 }}>
                    Of users who opened the application form, how many actually submitted it. A low rate means the form is losing people halfway through — consider shortening it or making the friction earlier (e.g. phone+name on step 1, longer questions later).
                  </div>
                  <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                    {visibleAppEvents.length === 0 && <div style={{ color: '#bbb', fontSize: 13 }}>No events selected</div>}
                    {visibleAppEvents.map((eventId, idx) => {
                      const started   = appStartedByEvent[eventId]   || 0;
                      const submitted = appSubmittedByEvent[eventId] || 0;
                      const hasData = started > 0;
                      const pct = hasData ? Math.round((submitted / started) * 100) : null;
                      const last = idx === visibleAppEvents.length - 1;
                      return (
                        <div key={eventId} style={{ marginBottom: last ? 0 : 14, paddingBottom: last ? 0 : 14, borderBottom: last ? 'none' : '1px solid #f0f0ea' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{eventLabelById(eventId)}</span>
                            <span style={{ fontSize: 20, fontWeight: 800, color: !hasData ? '#bbb' : pct! >= 50 ? '#4ade80' : pct! >= 25 ? '#fcd34d' : '#fca5a5' }}>
                              {hasData ? `${pct}%` : '—%'}
                            </span>
                          </div>
                          <div style={{ height: 7, background: '#f0f0ea', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: hasData ? `${Math.min(100, pct!)}%` : '4%', height: '100%', background: !hasData ? '#e5e5e5' : pct! >= 50 ? '#bbf7d0' : pct! >= 25 ? '#fde68a' : '#fecaca', borderRadius: 99, transition: 'width 0.4s' }} />
                          </div>
                          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
                            {hasData ? `${submitted} of ${started} who opened the form submitted` : 'no data yet'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Payment Conversion Rate — per event: advance_paid / approved.
                      Tracks how good your post-approval follow-up is (whatsapp nudges,
                      timely receipts, etc). Replaces the legacy Payment Handoff Rate. */}
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Payment Conversion Rate</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: -6, marginBottom: 10 }}>
                    Of users you've approved, how many actually paid the advance. A low rate means people are losing interest between approval and payment — consider faster WhatsApp follow-ups or reminders.
                  </div>
                  <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                    {visibleAppEvents.length === 0 && <div style={{ color: '#bbb', fontSize: 13 }}>No events selected</div>}
                    {visibleAppEvents.map((eventId, idx) => {
                      const approved = appsApprovedByEvent[eventId]    || 0;
                      const paid     = appsAdvancePaidByEvent[eventId] || 0;
                      const hasData = approved > 0;
                      const pct = hasData ? Math.round((paid / approved) * 100) : null;
                      const last = idx === visibleAppEvents.length - 1;
                      return (
                        <div key={eventId} style={{ marginBottom: last ? 0 : 14, paddingBottom: last ? 0 : 14, borderBottom: last ? 'none' : '1px solid #f0f0ea' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{eventLabelById(eventId)}</span>
                            <span style={{ fontSize: 20, fontWeight: 800, color: !hasData ? '#bbb' : pct! >= 70 ? '#4ade80' : pct! >= 40 ? '#fcd34d' : '#fca5a5' }}>
                              {hasData ? `${pct}%` : '—%'}
                            </span>
                          </div>
                          <div style={{ height: 7, background: '#f0f0ea', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: hasData ? `${Math.min(100, pct!)}%` : '4%', height: '100%', background: !hasData ? '#e5e5e5' : pct! >= 70 ? '#bbf7d0' : pct! >= 40 ? '#fde68a' : '#fecaca', borderRadius: 99, transition: 'width 0.4s' }} />
                          </div>
                          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
                            {hasData ? `${paid} of ${approved} approved paid the advance` : 'no data yet'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Doubt Solved Rate — of people who asked a doubt, how many
                      went on to actually submit an application for that event.
                      Derived from real applications (doubts_per_event in the
                      RPC), so it can't be gamed. Global figure + per-event. */}
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Doubt Solved Rate</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: -6, marginBottom: 10 }}>
                    Of people who asked a doubt, how many went on to submit an application for that event. A high rate means doubts are being resolved into real applications.
                  </div>
                  <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                    {/* Overall (global) */}
                    {(() => {
                      const pct = doubtSolvedPctAll;
                      const hasData = totalDoubtsAll > 0;
                      return (
                        <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f0f0ea' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Overall (all events)</span>
                            <span style={{ fontSize: 20, fontWeight: 800, color: !hasData ? '#bbb' : pct! >= 70 ? '#4ade80' : pct! >= 40 ? '#fcd34d' : '#fca5a5' }}>
                              {hasData ? `${pct}%` : '—%'}
                            </span>
                          </div>
                          <div style={{ height: 7, background: '#f0f0ea', borderRadius: 99, overflow: 'hidden' }}>
                            <div style={{ width: hasData ? `${Math.min(100, pct!)}%` : '4%', height: '100%', background: !hasData ? '#e5e5e5' : pct! >= 70 ? '#bbf7d0' : pct! >= 40 ? '#fde68a' : '#fecaca', borderRadius: 99, transition: 'width 0.4s' }} />
                          </div>
                          <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
                            {hasData ? `${solvedDoubtsAll} of ${totalDoubtsAll} doubts led to an application` : 'no doubts in this window'}
                          </div>
                        </div>
                      );
                    })()}
                    {/* Per-event breakdown — events that have at least one doubt */}
                    {(() => {
                      const doubtEvents = Object.keys(doubtsTotalByEvent)
                        .filter(id => doubtsTotalByEvent[id] > 0)
                        .sort((a, b) => eventLabelById(a).localeCompare(eventLabelById(b)));
                      if (doubtEvents.length === 0) {
                        return <div style={{ color: '#bbb', fontSize: 13 }}>No doubts in this window</div>;
                      }
                      return doubtEvents.map((eventId, idx) => {
                        const total  = doubtsTotalByEvent[eventId]  || 0;
                        const solved = doubtsSolvedByEvent[eventId] || 0;
                        const pct = total > 0 ? Math.round((solved / total) * 100) : null;
                        const last = idx === doubtEvents.length - 1;
                        return (
                          <div key={eventId} style={{ marginBottom: last ? 0 : 14, paddingBottom: last ? 0 : 14, borderBottom: last ? 'none' : '1px solid #f0f0ea' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{eventLabelById(eventId)}</span>
                              <span style={{ fontSize: 20, fontWeight: 800, color: pct! >= 70 ? '#4ade80' : pct! >= 40 ? '#fcd34d' : '#fca5a5' }}>
                                {pct}%
                              </span>
                            </div>
                            <div style={{ height: 7, background: '#f0f0ea', borderRadius: 99, overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(100, pct!)}%`, height: '100%', background: pct! >= 70 ? '#bbf7d0' : pct! >= 40 ? '#fde68a' : '#fecaca', borderRadius: 99, transition: 'width 0.4s' }} />
                            </div>
                            <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
                              {solved} of {total} doubt-askers applied
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* DB-storage footer. Weekly cron writes a snapshot row; this
                      reads the most recent one. Color tints amber > 50% and
                      red > 80% of the 500 MB free tier so unusual growth gets
                      noticed before anything actually breaks. */}
                  {storageReport && (() => {
                    const pct = storageReport.free_tier_pct;
                    const color = pct >= 80 ? '#dc2626' : pct >= 50 ? '#d97706' : '#9ca3af';
                    // Format snapshot timestamp as exact date in IST (Asia/Kolkata)
                    // — e.g. "4 Jun 2026, 9:30 PM IST". en-IN formatting matches
                    // the date style used elsewhere in the admin.
                    const snappedIST = new Date(storageReport.taken_at).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    });
                    return (
                      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #ececec', display: 'flex', gap: 12, alignItems: 'center', fontSize: 11, color: '#aaa', flexWrap: 'wrap' }}>
                        <span>🗄️ Database</span>
                        <span style={{ color: '#666', fontWeight: 600 }}>{storageReport.total_db_size_pretty}</span>
                        <span style={{ color }}>· {pct}% of 500 MB free tier</span>
                        <span style={{ marginLeft: 'auto', color: '#bbb' }}>
                          snapshot {snappedIST} IST · auto-refresh weekly (Mon)
                        </span>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          );
        })()}

        {/* ── PERFORMANCE TAB (admin only) ─────────────────────────────────── */}
        {tab === 'marketers' && adminRole === 'admin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {(() => {
              const ps = perfSummary || {};
              const num = (x: any) => Number(x) || 0;
              const inr = (n: any) => '₹' + Math.round(num(n)).toLocaleString('en-IN');
              const fixed = num(ps.fixed_costs_total);
              const perEvent: any[] = ps.per_event || [];
              const perMarketer: any[] = ps.per_marketer || [];
              const monthName = (ym: string) => { const [y, m] = (ym || '').split('-'); return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-US', { month: 'short', year: '2-digit' }); };
              // Committed-income forecast: each event's profit lands in its
              // balance-due month. Fixed costs hit every month. profit shown is
              // net of fixed.
              const forecast: any[] = (ps.forecast || []).map((f: any) => ({ ...f, net: num(f.profit) - fixed }));
              const thisMonthNet = num(ps.this_month_profit) - fixed;
              const maxAbs = Math.max(1, ...forecast.map(f => Math.abs(num(f.net))));
              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 22 }}>Performance</div>
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() => loadMarketersData()}
                      disabled={marketersLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fff', cursor: marketersLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: '#444', opacity: marketersLoading ? 0.55 : 1 }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: marketersLoading ? 'spin 0.8s linear infinite' : 'none' }}>
                        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                      </svg>
                      {marketersLoading ? 'Refreshing' : 'Refresh'}
                    </button>
                  </div>

                  {/* Committed-income forecast — one number + next 6 months */}
                  <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 14, padding: '20px 24px' }}>
                    <div style={{ fontSize: 13, color: '#999', fontWeight: 600, marginBottom: 6 }}>
                      Profit this month{forecast[0] ? ` (${monthName(forecast[0].month)})` : ''} — committed, assumes balances get paid
                    </div>
                    <div style={{ fontSize: 38, fontWeight: 800, color: thisMonthNet >= 0 ? '#111' : '#dc2626', lineHeight: 1 }}>{inr(thisMonthNet)}</div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>
                      Total committed over the next 6 months: <b style={{ color: '#16a34a' }}>{inr(forecast.reduce((s, f) => s + num(f.net), 0))}</b>
                    </div>

                    {/* Next 6 months bars */}
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0ea' }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Next 6 months</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150 }}>
                        {forecast.map((f, i) => {
                          const p = num(f.net);
                          const h = Math.round((Math.abs(p) / maxAbs) * 95);
                          const isThis = i === 0;
                          return (
                            <div key={f.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 4 }}>
                              <div style={{ fontSize: 11, color: p ? '#111' : '#ccc', fontWeight: 600 }}>{inr(p)}</div>
                              <div style={{ width: '64%', height: Math.max(h, p === 0 ? 0 : 3), minHeight: p === 0 ? 2 : 3, background: p > 0 ? (isThis ? '#22c55e' : '#bbf7d0') : p < 0 ? '#fecaca' : '#eee', borderRadius: 4 }} />
                              <div style={{ fontSize: 10, color: isThis ? '#111' : '#aaa', fontWeight: isThis ? 700 : 400 }}>{monthName(f.month)}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 12 }}>
                      Committed income only — profit from tickets already sold, shown in the month each event's balance is due. It grows as you sell more, so you can see next month filling up and line up your next event.
                    </div>
                  </div>

                  {/* Per-event unit economics (editable cost per ticket) */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Per-Event Unit Economics</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>Type your cost to deliver one ticket. Price = full ticket (advance + balance). Profit per ticket = price − your cost − ₹50 commission.</div>
                    <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '8px 0', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 620 }}>
                        <thead>
                          <tr style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <th style={{ textAlign: 'left', padding: '8px 16px' }}>Event</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Tickets</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Price</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Your cost/ticket</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Profit/ticket</th>
                            <th style={{ textAlign: 'right', padding: '8px 16px' }}>Margin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perEvent.length === 0 && <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#bbb' }}>No sales yet.</td></tr>}
                          {perEvent.map((ev) => {
                            const tickets = num(ev.tickets);
                            const price = num(ev.price_per_ticket);
                            const cost = costEdits[ev.event_id] !== undefined ? Number(costEdits[ev.event_id]) || 0 : num(ev.cost_per_ticket);
                            const perTicket = price - cost - 50;
                            const margin = price > 0 ? Math.round((perTicket / price) * 100) : null;
                            const dirty = costEdits[ev.event_id] !== undefined && Number(costEdits[ev.event_id]) !== num(ev.cost_per_ticket);
                            return (
                              <tr key={ev.event_id} style={{ borderTop: '1px solid #f5f5f0' }}>
                                <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111' }}>{ev.title}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>{tickets}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>{inr(price)}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    ₹<input type="number" min={0} value={costEdits[ev.event_id] ?? String(num(ev.cost_per_ticket))}
                                      onChange={e => setCostEdits(prev => ({ ...prev, [ev.event_id]: e.target.value }))}
                                      onWheel={e => (e.target as HTMLInputElement).blur()}
                                      style={{ width: 70, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, textAlign: 'right' }} />
                                    {dirty && <button onClick={() => saveEventCost(ev.event_id)} style={{ ...s.btn('#111'), padding: '3px 8px', fontSize: 11 }}>Save</button>}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: perTicket >= 0 ? '#16a34a' : '#dc2626' }}>{inr(perTicket)}</td>
                                <td style={{ padding: '10px 16px', textAlign: 'right', color: margin == null ? '#bbb' : margin >= 40 ? '#16a34a' : margin >= 0 ? '#d97706' : '#dc2626' }}>{margin == null ? '—' : `${margin}%`}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Marketer ROI */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Marketer ROI</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>Leads assigned vs. how many they converted (Conv = sold ÷ leads), plus the revenue they generated and commission earned.</div>
                    <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '8px 0', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 680 }}>
                        <thead>
                          <tr style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <th style={{ textAlign: 'left', padding: '8px 16px' }}>Marketer</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Leads</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Sold</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Conv</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Revenue generated</th>
                            <th style={{ textAlign: 'right', padding: '8px 16px' }}>Commission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {perMarketer.map((m) => {
                            const assigned = num(m.assigned);
                            const sold = num(m.tickets);
                            const conv = assigned > 0 ? Math.round((sold / assigned) * 100) : null;
                            return (
                            <tr key={m.marketer_id} style={{ borderTop: '1px solid #f5f5f0', opacity: m.active ? 1 : 0.5 }}>
                              <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111' }}>{m.name}{!m.active && <span style={{ fontSize: 10, color: '#aaa', marginLeft: 6 }}>inactive</span>}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>{assigned}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', color: '#111', fontWeight: 600 }}>{sold}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', color: conv == null ? '#bbb' : conv >= 40 ? '#16a34a' : conv >= 15 ? '#d97706' : '#dc2626' }}>{conv == null ? '—' : `${conv}%`}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>{inr(m.revenue_generated)}</td>
                              <td style={{ padding: '10px 16px', textAlign: 'right', color: '#555' }}>{inr(m.commission)}</td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Fixed costs ledger */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Monthly Fixed Costs</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>Recurring tools/subscriptions (AiSensy, Claude, …). These are subtracted from your monthly profit above.</div>
                    <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '12px 16px' }}>
                      {fixedCosts.length === 0 && <div style={{ color: '#bbb', fontSize: 13, marginBottom: 10 }}>No fixed costs yet.</div>}
                      {fixedCosts.map(fc => (
                        <div key={fc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f5f5f0' }}>
                          <span style={{ flex: 1, fontSize: 13, color: '#111' }}>{fc.label}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{inr(fc.amount)}/mo</span>
                          <button onClick={() => removeFixedCost(fc.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12 }}>Remove</button>
                        </div>
                      ))}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                        <input value={newFixedLabel} onChange={e => setNewFixedLabel(e.target.value)} placeholder="e.g. AiSensy"
                          style={{ flex: 1, padding: '7px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
                        <input type="number" min={0} value={newFixedAmount} onChange={e => setNewFixedAmount(e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} placeholder="₹/mo"
                          style={{ width: 90, padding: '7px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
                        <button style={s.btn()} onClick={addFixedCost}>Add</button>
                      </div>
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0ea', display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: '#888', fontWeight: 600 }}>Total fixed costs</span>
                        <span style={{ fontWeight: 700, color: '#111' }}>{inr(ps.fixed_costs_total)}/mo</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: '#bbb', lineHeight: 1.5 }}>
    Each event's profit (full price − your ticket cost − ₹50 commission, summed over tickets sold) lands in the month its balance is due, minus fixed costs. Only tickets already sold count — it's a committed-income forecast, not a sales projection. Amounts are net of PayU fees, in IST months. Keep your ticket costs and fixed costs current.
                  </div>
                </>
              );
            })()}

            {/* ── Marketer management ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Marketers</div>
              <span style={{ fontSize: 13, color: '#888' }}>{marketers.length} {marketers.length === 1 ? 'marketer' : 'marketers'}</span>
              <div style={{ flex: 1 }} />
              <button style={s.btn()} onClick={() => setAddingMarketer(true)}>+ Add Marketer</button>
            </div>

            <div style={{ background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400e', lineHeight: 1.55 }}>
              <b>How this works:</b> add a marketer here, then add their email to <code>admin_users</code> with role <code>ops</code> in Supabase. When they log in, they only see leads assigned to them. Assignment is round-robin per event — assign marketers to events from the event-edit form.
            </div>

            {addingMarketer && (
              <div style={{ background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 120px auto auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={s.label}>Email</label>
                  <input style={s.input} placeholder="marketer@example.com" value={newMarketerEmail} onChange={e => setNewMarketerEmail(e.target.value)} />
                </div>
                <div>
                  <label style={s.label}>Name</label>
                  <input style={s.input} placeholder="Full name" value={newMarketerName} onChange={e => setNewMarketerName(e.target.value)} />
                </div>
                <div>
                  <label style={s.label}>₹ / ticket</label>
                  <input style={s.input} type="number" onWheel={e => (e.target as HTMLInputElement).blur()} value={newMarketerCommission} onChange={e => setNewMarketerCommission(e.target.value)} />
                </div>
                <button style={s.btn()} disabled={savingMarketer} onClick={saveNewMarketer}>{savingMarketer ? 'Saving…' : 'Save'}</button>
                <button style={s.outlineBtn} onClick={() => { setAddingMarketer(false); setNewMarketerEmail(''); setNewMarketerName(''); setNewMarketerCommission('50'); }}>Cancel</button>
              </div>
            )}

            <div style={{ background: '#fff', border: '1.5px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1.5px solid #eee' }}>
                    {['Name', 'Email', '₹ / ticket', 'Tickets sold', 'Total earned', 'Status', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {marketers.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#888' }}>No marketers yet. Click "+ Add Marketer".</td></tr>
                  )}
                  {marketers.map(mk => {
                    const stats = marketerStats[mk.id] ?? { total: 0, ticketCount: 0 };
                    return (
                      <tr key={mk.id} style={{ borderBottom: '1px solid #f4f4f4', opacity: mk.active ? 1 : 0.5 }}>
                        <td style={{ padding: '12px 14px', fontWeight: 600 }}>{mk.name}</td>
                        <td style={{ padding: '12px 14px', color: '#666' }}>{mk.email}</td>
                        <td style={{ padding: '12px 14px' }}>₹{mk.commission_amount}</td>
                        <td style={{ padding: '12px 14px' }}>{stats.ticketCount}</td>
                        <td style={{ padding: '12px 14px', fontWeight: 700 }}>₹{stats.total.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: mk.active ? '#dcfce7' : '#fee2e2', color: mk.active ? '#15803d' : '#b91c1c', padding: '3px 9px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                            {mk.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          <button style={s.outlineBtn} onClick={() => toggleMarketerActive(mk)}>
                            {mk.active ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CREATORS (AFFILIATES) TAB ────────────────────────────────────── */}
        {tab === 'affiliates' && adminRole === 'admin' && (() => {
          const inr = (n: any) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
          const linkFor = (h: string) => `${window.location.origin}/@${h}`;
          const copyLink = (h: string) => {
            navigator.clipboard?.writeText(linkFor(h)).then(() => showToast(`Copied ${linkFor(h)}`), () => showToast('Copy failed'));
          };
          const totalUnpaid = Object.keys(affiliateStats).reduce((s, k) => s + affiliateStats[k].unpaid, 0);
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 22 }}>Creators</div>
              <span style={{ fontSize: 13, color: '#888' }}>{affiliates.length} {affiliates.length === 1 ? 'creator' : 'creators'}</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => loadAffiliatesData()} disabled={affiliatesLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fff', cursor: affiliatesLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: '#444', opacity: affiliatesLoading ? 0.55 : 1 }}>
                {affiliatesLoading ? 'Refreshing' : 'Refresh'}
              </button>
              <button style={s.btn()} onClick={() => setAddingAffiliate(true)}>+ Add Creator</button>
            </div>

            <div style={{ background: '#eef2ff', border: '1.5px solid #c7d2fe', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#3730a3', lineHeight: 1.55 }}>
              <b>How this works:</b> each creator gets a link <code>{window.location.origin}/@handle</code>. When someone books through it and pays in full for an <b>affiliate-enabled</b> event, the creator earns <b>8%</b> of the ticket price. Turn commissions on per event from the event editor. Creators log in with the Google email you set here to see their own dashboard.
            </div>

            {addingAffiliate && (
              <div style={{ background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={s.label}>Handle (the @ in the link)</label>
                  <input style={s.input} placeholder="e.g. traveller.tanya" value={newAffiliateHandle} onChange={e => setNewAffiliateHandle(e.target.value)} />
                </div>
                <div>
                  <label style={s.label}>Name</label>
                  <input style={s.input} placeholder="Full name / brand" value={newAffiliateName} onChange={e => setNewAffiliateName(e.target.value)} />
                </div>
                <div>
                  <label style={s.label}>Google email (their login)</label>
                  <input style={s.input} placeholder="creator@gmail.com" value={newAffiliateEmail} onChange={e => setNewAffiliateEmail(e.target.value)} />
                </div>
                <button style={s.btn()} disabled={savingAffiliate} onClick={saveNewAffiliate}>{savingAffiliate ? 'Saving…' : 'Save'}</button>
                <button style={s.outlineBtn} onClick={() => { setAddingAffiliate(false); setNewAffiliateHandle(''); setNewAffiliateName(''); setNewAffiliateEmail(''); }}>Cancel</button>
              </div>
            )}

            {totalUnpaid > 0 && (
              <div style={{ fontSize: 13, color: '#888' }}>Outstanding to pay out across all creators: <b style={{ color: '#dc2626' }}>{inr(totalUnpaid)}</b></div>
            )}

            <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '8px 0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 820 }}>
                <thead>
                  <tr style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <th style={{ textAlign: 'left', padding: '8px 16px' }}>Creator</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Clicks</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Bookings</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Paid tickets</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Earned</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Unpaid</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.length === 0 && <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#bbb' }}>No creators yet. Add your first one above.</td></tr>}
                  {affiliates.map((af) => {
                    const st = affiliateStats[af.id] ?? { clicks: 0, apps: 0, tickets: 0, earned: 0, unpaid: 0 };
                    const conv = st.clicks > 0 ? Math.round((st.tickets / st.clicks) * 100) : null;
                    return (
                      <tr key={af.id} style={{ borderTop: '1px solid #f5f5f0', opacity: af.active ? 1 : 0.5 }}>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#111' }}>{af.name}{!af.active && <span style={{ fontSize: 10, color: '#aaa', marginLeft: 6 }}>paused</span>}</div>
                          <div style={{ fontSize: 12, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span>/@{af.handle}</span>
                            <button onClick={() => copyLink(af.handle)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 11, textDecoration: 'underline', padding: 0 }}>copy link</button>
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>{st.clicks}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>{st.apps}{conv != null && <span style={{ color: '#bbb', fontSize: 11 }}> · {conv}%</span>}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#111', fontWeight: 600 }}>{st.tickets}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{inr(st.earned)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: st.unpaid > 0 ? '#dc2626' : '#bbb', fontWeight: st.unpaid > 0 ? 700 : 400 }}>{inr(st.unpaid)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {st.unpaid > 0 && <button style={{ ...s.btn('#111'), padding: '4px 10px', fontSize: 12, marginRight: 6 }} onClick={() => markAffiliatePaid({ id: af.id, name: af.name, unpaid: st.unpaid })}>Mark paid</button>}
                          <button style={s.outlineBtn} onClick={() => toggleAffiliateActive(af)}>{af.active ? 'Pause' : 'Resume'}</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: 11, color: '#bbb', lineHeight: 1.5 }}>
              Bookings = people who reached checkout via their link (conversion % = paid tickets ÷ clicks). Commission accrues only when a ticket is fully paid on an event with creator commissions enabled, and is netted from your monthly profit. "Mark paid" stamps every outstanding sale as settled — the history is kept.
            </div>
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
                    {adminRole === 'admin' && (
                      <button
                        style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                        onClick={() => removeNotifDevice(d.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

            </CollapsibleSection>

          </div>
        )}

      </div>
    </div>
  );
}

// ─── MARKETER ASSIGNMENT (per event) ──────────────────────────────────────
// Renders below the TripForm. Picking marketers writes to event_marketers;
// the DB redistribute trigger handles fanning existing applications across
// the new set (no client-side redistribute needed).
function MarketerAssignment({ eventSlug, marketers, selectedIds, onChange, onOpen, s }: {
  eventSlug: string;
  marketers: Array<{ id: string; name: string; email: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onOpen?: () => void;
  s: any;
}) {
  React.useEffect(() => { onOpen?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter(x => x !== id));
    else onChange([...selectedIds, id]);
  };
  return (
    <div style={{ marginTop: 18, padding: 16, background: '#fafafa', borderRadius: 12, border: '1.5px solid #eee' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        Marketers on this event
      </div>
      {marketers.length === 0 ? (
        <div style={{ fontSize: 13, color: '#888' }}>No active marketers. Add them in the Marketers tab.</div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {marketers.map(mk => {
            const on = selectedIds.includes(mk.id);
            return (
              <button
                key={mk.id}
                type="button"
                onClick={() => toggle(mk.id)}
                style={{
                  padding: '7px 14px', borderRadius: 99, border: '1.5px solid ' + (on ? '#111' : '#d7d7d7'),
                  background: on ? '#111' : '#fff', color: on ? '#fff' : '#555',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}
              >
                {on ? '✓ ' : ''}{mk.name}
              </button>
            );
          })}
        </div>
      )}
      <div style={{ fontSize: 11, color: '#888', marginTop: 10 }}>
        New applications round-robin among the selected marketers. Existing unassigned/unconverted leads auto-redistribute when you change this list.
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
    // Store the raw value so the user can type spaces freely (a trailing space
    // is no longer stripped on every keystroke). Leading/trailing whitespace is
    // cleaned up once, at save time, in saveTrip(). We only trim for the
    // keep-or-remove decision so a whitespace-only field still drops the entry.
    onChange({
      ...trip,
      quick_info: value.trim() ? [...next, { icon, label: saveLabel, value }] : next,
    });
  };
  const setGangSize = (value: string) => {
    const next = quickInfo.filter(item => item.label !== 'Group Size');
    const trimmed = value.trim();
    const capacity = trimmed === '' ? null : Number(trimmed);
    onChange({
      ...trip,
      quick_info: trimmed ? [...next, { icon: 'users', label: 'Group Size', value }] : next,
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

  // Native-application flag (used by the Trip Dates "Spots auto" layout below).
  // The booking-timeline editor lives in its own dedicated section, not here.
  const isNativeAppEvent = trip.booking_url === 'native-application';

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
          {field('Duration (e.g. 1 Night 2 Days)', 'timing')}
          <div style={{ marginBottom: 14 }}>
            <label style={s.label}>Category</label>
            <select
              style={s.input}
              value={trip.category || 'Trip'}
              onChange={e => set('category', e.target.value)}
            >
              <option value="Trip">Trip</option>
              <option value="Event">Event</option>
              <option value="Meets">Meets</option>
            </select>
          </div>
          {/* Booking Type */}
          <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
            <label style={s.label}>Booking Type</label>
            <div style={{ display: 'flex', gap: 0, marginBottom: 10, border: '1.5px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
              {([
                // booking_flow is NOT NULL + CHECK (payment | whatsapp). Only
                // Community uses 'whatsapp'; the paid/invite/external modes all
                // use 'payment'. Writing null here violated the constraint and
                // blocked saving when switching an event's booking type.
                { mode: 'invite-only', label: 'Invite Only',  bookingUrl: 'native-application', inviteOnly: true,  bookingFlow: 'payment' },
                { mode: 'open-event',  label: 'Open Event',   bookingUrl: 'payu-hosted',        inviteOnly: false, bookingFlow: 'payment' },
                { mode: 'external',    label: 'External Link', bookingUrl: '',                  inviteOnly: false, bookingFlow: 'payment' },
                { mode: 'community',   label: 'Community',    bookingUrl: '',                   inviteOnly: false, bookingFlow: 'whatsapp' },
              ] as const).map(option => {
                const current =
                  trip.booking_flow === 'whatsapp'          ? 'community'   :
                  trip.booking_url === 'native-application' ? 'invite-only' :
                  trip.booking_url === 'payu-hosted'        ? 'open-event'  :
                  'external';
                const active = current === option.mode;
                return (
                  <button
                    key={option.mode}
                    type="button"
                    onClick={() => onChange({ ...trip, booking_url: option.bookingUrl, invite_only: option.inviteOnly, booking_flow: option.bookingFlow })}
                    style={{ flex: 1, padding: '9px 14px', border: 'none', background: active ? '#111' : '#fafafa', color: active ? '#fff' : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {/* External Link: URL input */}
            {trip.booking_flow !== 'whatsapp' && trip.booking_url !== 'native-application' && trip.booking_url !== 'payu-hosted' && (
              <input
                style={s.input}
                placeholder="https://tally.so/r/..."
                value={trip.booking_url}
                onChange={e => set('booking_url', e.target.value)}
              />
            )}

            {/* Community: WhatsApp link + The Essentials fields (meeting spot /
                date / time — rendered as the Journey-style card in the sheet) */}
            {trip.booking_flow === 'whatsapp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={s.label}>WhatsApp Community Link</label>
                  <input
                    style={s.input}
                    placeholder="https://chat.whatsapp.com/..."
                    value={trip.booking_url}
                    onChange={e => set('booking_url', e.target.value)}
                  />
                </div>
                <div>
                  <label style={s.label}>Meeting Spot (The Essentials card)</label>
                  <input
                    style={s.input}
                    placeholder="Anna Nagar (exact location shared in community)"
                    value={trip.start_location}
                    onChange={e => set('start_location', e.target.value)}
                  />
                </div>
                <div>
                  <label style={s.label}>You'll Meet (The Essentials card)</label>
                  <input
                    style={s.input}
                    placeholder="ppl who love creating content"
                    value={trip.description}
                    onChange={e => set('description', e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Date</label>
                    <input
                      style={s.input}
                      type="date"
                      value={trip.event_dates?.[0]?.start_date ?? ''}
                      onChange={e => onChange({
                        ...trip,
                        event_dates: e.target.value
                          ? [{ ...(trip.event_dates?.[0] ?? { status: 'available' as const, label: '' }), start_date: e.target.value }]
                          : [],
                      })}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={s.label}>Time (e.g. 4:00 PM)</label>
                    <input
                      style={s.input}
                      placeholder="4:00 PM"
                      value={trip.timing}
                      onChange={e => set('timing', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Invite Only: total spots */}
            {trip.booking_url === 'native-application' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <label style={{ ...s.label, marginBottom: 0, whiteSpace: 'nowrap' }}>Total Spots</label>
                <input
                  type="number"
                  onWheel={e => (e.target as HTMLInputElement).blur()}
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
                  onWheel={e => (e.target as HTMLInputElement).blur()}
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

          {/* Payment Mode: split (advance + balance) vs full (single payment) */}
          <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
            <label style={s.label}>Payment Mode</label>
            <div style={{ display: 'flex', gap: 0, marginBottom: 6, border: '1.5px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
              {([
                { mode: 'split', label: 'Split (Advance + Balance)' },
                { mode: 'full',  label: 'Full (Single Payment)' },
              ] as const).map(option => {
                const active = (trip.payment_mode ?? 'split') === option.mode;
                return (
                  <button
                    key={option.mode}
                    type="button"
                    onClick={() => onChange(
                      trip.booking_url === 'native-application'
                        // Switching payment mode rebuilds the timeline to the new
                        // mode's structure (single = entry payment; split = advance +
                        // balance) so it can't keep stale rows from the old mode.
                        ? { ...trip, payment_mode: option.mode, booking_steps: regenNativeBookingSteps(trip.booking_steps, option.mode === 'full', trip.title ?? '') }
                        : { ...trip, payment_mode: option.mode }
                    )}
                    style={{ flex: 1, padding: '9px 14px', border: 'none', background: active ? '#111' : '#fafafa', color: active ? '#fff' : '#666', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: 11, color: '#888', margin: 0 }}>
              {(trip.payment_mode ?? 'split') === 'full'
                ? 'Customers pay the full price in one payment. The Advance amount is ignored.'
                : 'Customers pay an advance now and the remaining balance later.'}
            </p>
          </div>

          {/* Creator commissions: pay affiliates for tickets booked via their link */}
          <div style={{ gridColumn: '1/-1', marginBottom: 14 }}>
            <label style={s.label}>Creator Commissions</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 10, background: trip.affiliate_enabled ? '#eef2ff' : '#fafafa' }}>
              <button
                type="button"
                onClick={() => set('affiliate_enabled', !trip.affiliate_enabled)}
                style={{ position: 'relative', width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: trip.affiliate_enabled ? '#6366f1' : '#ccc', transition: 'background 0.15s', flexShrink: 0 }}
                aria-pressed={!!trip.affiliate_enabled}
              >
                <span style={{ position: 'absolute', top: 3, left: trip.affiliate_enabled ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>{trip.affiliate_enabled ? 'On — creators earn on this event' : 'Off — no creator commissions'}</div>
                <div style={{ fontSize: 11, color: '#888' }}>When on, a fully-paid ticket booked via a creator link pays them a commission.</div>
              </div>
              {trip.affiliate_enabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="number" min={0} max={100} step={0.5}
                    onWheel={e => (e.target as HTMLInputElement).blur()}
                    value={trip.affiliate_commission_pct ?? 8}
                    onChange={e => set('affiliate_commission_pct', Number(e.target.value))}
                    style={{ width: 60, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, textAlign: 'right' }}
                  />
                  <span style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>% of full price</span>
                </div>
              )}
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
                        onWheel={e => (e.target as HTMLInputElement).blur()}
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
                        onWheel={e => (e.target as HTMLInputElement).blur()}
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
              onWheel={e => (e.target as HTMLInputElement).blur()}
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

      {/* "Own Transport Option" + "Show In Other City Feed" sections removed —
          the Other Cities / Own Transport flows aren't used currently.
          Helpers (toggleOwnTransport, setOwnTransport, toggleShowInOther,
          ownTransport, showInOther) are intentionally kept dormant so the
          sections can be revived by re-adding the JSX. */}

      {/* ── CONTENT ── */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 10 }}>Content</div>

      <CollapsibleSection title="Founder's Note" badge={trip.founders_note_url?.trim() ? 'ON' : 'OFF'} badgeColor={trip.founders_note_url?.trim() ? '#16a34a' : undefined}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          Paste a Cloudinary audio URL — a voice note shown with a play button on the plan details page. Leave blank to hide.
        </div>
        <input
          style={s.input}
          placeholder="https://res.cloudinary.com/.../founders-note.mp3"
          value={trip.founders_note_url ?? ''}
          onChange={e => set('founders_note_url', e.target.value)}
        />
        {!!trip.founders_note_url?.trim() && (
          <audio src={trip.founders_note_url} controls preload="none" style={{ width: '100%', marginTop: 8 }} />
        )}
      </CollapsibleSection>

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
                  onWheel={e => (e.target as HTMLInputElement).blur()}
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
    if (saved > 0) {
      logAdminAction('invited_numbers_bulk_add', 'invited_numbers', null, {
        event_slug: eventSlug, city: cityValue, count: saved, applications_synced: synced,
      });
    }
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
    const cityScope = (hasCityTabs && selectedCity !== 'All') ? selectedCity : null;
    let q: any = supabase.from('invited_numbers').delete().eq('event_slug', eventSlug);
    if (cityScope) q = q.eq('city', cityScope);
    await q;
    await fetchCount();
    setClearing(false);
    logAdminAction('invited_numbers_bulk_delete', 'invited_numbers', null, {
      event_slug: eventSlug, city: cityScope, scope: scopeLabel,
    });
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
