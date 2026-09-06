// chaptera admin panel
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase, parseHeroImages, fetchEventDateCounts, buildEventAnnouncement, isElapsedDate, isDateSoldOut } from './supabase';
import { dateKeyInTimeZone, isoDateKey, payuTripDateKey } from './dateKeys';
import {
  timelineModel, defaultBookingSteps, stepsMatchModel, carryStepDates,
  isFixedTimeline as isFixedTimelineModel, stepBadge, stripDeadStepDates, BADGE_LABEL,
} from './bookingTimeline';

// Journey Map tab (React Flow) — lazy so the map library only downloads when
// the tab is opened, never in the customer-facing bundle.
const JourneyMap = React.lazy(() => import('./JourneyMap'));
const ManagerPanel = React.lazy(() => import('./ManagerPanel'));

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
  // Split events only: the guest pays the balance online at the venue instead of
  // before the event. Ignored when payment_mode = 'full'.
  pay_at_venue?: boolean;
  // Creator affiliate commissions: off by default. When on, a fully-paid ticket
  // booked via a creator's link pays the creator. `affiliate_commission` is a
  // flat ₹ per ticket and wins when set; otherwise affiliate_commission_pct%
  // (default 8) of the full price applies. Flat is preferred because a
  // percentage produces a different figure per city and per ticket type.
  // See the Creators tab.
  affiliate_enabled?: boolean;
  affiliate_commission_pct?: number;
  affiliate_commission?: number | null;
  // True = the first video a new creator must make. Until one of their videos is
  // approved, creators see only starter events.
  affiliate_starter_task?: boolean;
  // Per-event marketer commission (₹ per fully-paid ticket). NULL/undefined =
  // fall back to each marketer's own call_marketers.commission_amount (₹50).
  marketer_commission?: number | null;
  // Per-event manager commission override; NULL = the manager's own default (₹35).
  manager_commission?: number | null;
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
// A creator's video submission. Rows only exist once a creator actually submits,
// so counting them per creator IS the measure of who is working.
type CreatorVideoRow = {
  id: string;
  affiliate_id: string;
  event_slug: string;
  event_date: string;
  video_url: string;
  status: 'pending' | 'approved' | 'changes_requested';
  review_note: string | null;
  submitted_at: string;
  seen_at: string | null;
};
type ChatMsg = { id: string; step_key: string; bot_message: string; flow: string };
type PayuPayment = {
  id?: string;
  txnid?: string;
  event_id?: string;
  event_slug?: string;
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

// The row tables, the "do these steps still describe this event" check and the
// mode-switch regeneration all live in ./bookingTimeline now, shared with the
// two customer-facing timelines. These thin wrappers keep the call sites here
// reading the way they always did.

function tripTimelineModel(trip: { booking_url?: string; payment_mode?: string; pay_at_venue?: boolean }) {
  return timelineModel({ booking_url: trip.booking_url, payment_mode: trip.payment_mode, pay_at_venue: trip.pay_at_venue });
}

// Rebuild steps for a new payment mode / pay-at-venue setting, preserving dates
// on the rows whose role survives the switch. Payment rows reset structurally.
function regenNativeBookingSteps(existing: Array<{ label: string; value: string; date: string }> | undefined, isFullPay: boolean, title: string, payAtVenue = false) {
  const model = { flow: 'invite' as const, fullPay: isFullPay, payAtVenue: !isFullPay && payAtVenue };
  return carryStepDates(existing, defaultBookingSteps(model, title)) as Array<{ label: string; value: string; date: string }>;
}

const statusLabel = { available: 'Available', selling_out: 'Selling Out', sold_out: 'Sold Out' };
const statusColor = { available: '#16a34a', selling_out: '#d97706', sold_out: '#dc2626' };

function serializeHeroImages(images: string[]): string {
  const cleaned = images.map(img => img.trim()).filter(Boolean).slice(0, 4);
  if (cleaned.length === 0) return '';
  if (cleaned.length === 1) return cleaned[0];
  return JSON.stringify(cleaned);
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

// The tabs across the top. Deliberately short: several older tabs were folded
// into sub-views rather than kept as siblings, because the header is a single
// non-wrapping row and every extra tab makes the whole panel harder to scan.
//   'marketers' renders as "Team"   ▸ Performance · Marketers · Managers · Creators
//   'analytics' renders as "Growth" ▸ Analytics · Experiments
//   'map'       renders as "Build"  ▸ journey maps + to-dos
const ADMIN_TABS = ['trips', 'flow', 'people', 'marketers', 'analytics', 'map', 'settings'] as const;
type AdminTab = typeof ADMIN_TABS[number];

// ─── MAIN ─────────────────────────────────────────────────────────────────────
// ── Group bookings ──────────────────────────────────────────────────────────
// One row can hold several seats, and at a pay-at-venue event the guest picks
// how many of them actually turned up — so the booking carries two numbers.
//
// They share ONE slot rather than getting a line each. "×3" means three seats,
// all settled. "1/3" means three seats but only one head was paid for at the
// door, which is the single case worth noticing: it is the only visible sign
// that the honour-system headcount might be being understated. Because the
// shape changes rather than the colour, a column of ×2 ×3 1/3 ×2 puts the odd
// one out in front of you without shouting.
//
// A booking where everyone came shows plain "×3" — "3/3" would just be noise.
function SeatBadge({ app }: { app: any }) {
  const booked = Math.max(1, Number(app?.ticket_count ?? 1) || 1);
  const attendedRaw = app?.attended_count == null ? null : Number(app.attended_count);
  const attended = attendedRaw != null && Number.isFinite(attendedRaw) ? attendedRaw : null;
  if (booked <= 1) return null;
  const shortfall = attended != null && attended < booked;
  return (
    <span
      title={shortfall
        ? `Booked ${booked} tickets, paid the venue balance for ${attended}`
        : `${booked} tickets on this booking`}
      style={{ marginLeft: 6, color: '#999', fontSize: 12, fontWeight: 500 }}
    >
      {shortfall ? (<>{attended}<span style={{ color: '#c7c7cc' }}>/</span>{booked}</>) : <>×{booked}</>}
    </span>
  );
}

export default function AdminPanel() {
  const [adminRole, setAdminRole] = useState<'admin' | 'ops' | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authDenied, setAuthDenied] = useState(false);
  const [debugEmail, setDebugEmail] = useState<string>('');
  // Remembered tab, read once per mount. Both the tab and its sub-view derive
  // from it, so a refresh lands exactly where you left off.
  const [rememberedTab] = useState(() => localStorage.getItem('adminTab'));
  const [tab, setTab] = useState<AdminTab>(
    () => {
      // Retired tab keys map onto the sub-view that absorbed them:
      // 'affiliates' → Creators, 'content' → Team ▸ Creators,
      // 'manager' (the old Briefing tab) → Team ▸ Managers,
      // 'experiments' → Growth ▸ Experiments.
      if (rememberedTab === 'affiliates' || rememberedTab === 'content' || rememberedTab === 'manager') return 'marketers';
      if (rememberedTab === 'experiments') return 'analytics';
      return ADMIN_TABS.includes(rememberedTab as AdminTab) ? (rememberedTab as AdminTab) : 'people';
    }
  );
  const switchTab = (t: AdminTab) => { setTab(t); localStorage.setItem('adminTab', t); };
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
  // Team ▸ Performance (forecast, unit economics, payouts, fixed costs) ·
  // Marketers (roster + hiring) · Managers (the daily briefing engine, then the
  // human manager roster) · Creators (video review queue + creator roster).
  const [teamMode, setTeamMode] = useState<'money' | 'marketers' | 'managers' | 'creators'>(
    () => rememberedTab === 'content' ? 'creators' : rememberedTab === 'manager' ? 'managers' : 'money'
  );
  // Growth ▸ Overview (the funnel snapshot) · Trends (the same numbers per day,
  // plotted against the release log).
  const [growthMode, setGrowthMode] = useState<'overview' | 'trends'>(() => rememberedTab === 'experiments' ? 'trends' : 'overview');
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
  const [planDoubts, setPlanDoubts] = useState<any[]>([]);
  const [doubtsLoadError, setDoubtsLoadError] = useState('');
  const [payuPayments, setPayuPayments] = useState<PayuPayment[]>([]);
  const [globalMessageDrafts, setGlobalMessageDrafts] = useState<Record<string, string>>({});
  const [globalAnnouncementsFields, setGlobalAnnouncementsFields] = useState<[string, string, string]>(['', '', '']);
  const [doubtCtaLabel, setDoubtCtaLabel] = useState('');
  const [savingGeneralAnnouncements, setSavingGeneralAnnouncements] = useState(false);
  // ── Dynamic announcements ──────────────────────────────────────────────────
  const [announcementEventSlugs, setAnnouncementEventSlugs] = useState<string[]>([]);
  const [announcementStaticText, setAnnouncementStaticText] = useState('plans we dream');
  // preview line keyed by event slug — null = this event won't be announced
  const [announcementPreviews, setAnnouncementPreviews] = useState<Record<string, string | null>>({});
  const [savingDoubtSettings, setSavingDoubtSettings] = useState(false);
  // ── NOTIFICATIONS (admin push) ────────────────────────────────────────────
  const VAPID_PUBLIC_KEY = 'BKXd5KDV_vL6P19fk10d2STjZSkGHSXz_zHHBg53RxwKIRCDSEn0lHPfCBwDvphRbjnvX0Th-99GHh-cs6yEHpU';
  const [notifStatus, setNotifStatus] = useState<'idle' | 'requesting' | 'subscribed' | 'error'>('idle');
  const [notifLabel, setNotifLabel] = useState('');
  const [notifDevices, setNotifDevices] = useState<{ id: string; label: string; created_at: string; endpoint: string }[]>([]);
  const [notifDevicesLoading, setNotifDevicesLoading] = useState(false);
  // This browser's live push endpoint — used to tag "this device" in the list
  const [thisDeviceEndpoint, setThisDeviceEndpoint] = useState<string | null>(null);

  const loadNotifDevices = React.useCallback(async () => {
    setNotifDevicesLoading(true);
    const { data } = await supabase.from('admin_push_subscriptions').select('id, label, created_at, endpoint').order('created_at', { ascending: false });
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
      // Stamp the owner so send-admin-push can route: staff devices get
      // their-level pushes only, admin/legacy (null email) devices get all.
      const { data: { session: pushSession } } = await supabase.auth.getSession();
      const { error: saveError } = await supabase.from('admin_push_subscriptions').upsert({
        label,
        endpoint: sub.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        email: pushSession?.user?.email?.toLowerCase() ?? null,
      }, { onConflict: 'endpoint' });
      if (saveError) {
        setNotifStatus('error');
        showToast('Could not save this device to the server: ' + saveError.message);
        return;
      }
      setThisDeviceEndpoint(sub.endpoint);
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

  // Self-heal push registration on every login. FCM (Android/Chrome) endpoints
  // rotate or get invalidated, at which point the sender sees a 410 and deletes
  // the DB row — without this re-check the device silently stops receiving
  // forever. Apple endpoints are stable, so this mostly guards Android/desktop.
  useEffect(() => {
    if (!adminRole) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    if (Notification.permission !== 'granted') return;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) return;
        setThisDeviceEndpoint(sub.endpoint);
        const { data: row, error } = await supabase
          .from('admin_push_subscriptions')
          .select('id')
          .eq('endpoint', sub.endpoint)
          .maybeSingle();
        if (error) return; // can't tell — leave things alone
        if (row) { setNotifStatus('subscribed'); return; }
        const subJson = sub.toJSON() as any;
        if (!subJson?.keys?.p256dh || !subJson?.keys?.auth) return;
        const label = navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad') ? 'iOS Device' : navigator.userAgent.includes('Android') ? 'Android Device' : 'Desktop';
        const { error: saveError } = await supabase.from('admin_push_subscriptions').upsert({
          label,
          endpoint: sub.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        }, { onConflict: 'endpoint' });
        if (!saveError) setNotifStatus('subscribed');
      } catch { /* push is non-critical */ }
    })();
  }, [adminRole]);

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
  // The marketer ledger is the source of truth once open events can pay either
  // half or full commission. Kept row-level so the manager/marketer earnings
  // bill can sum the exact amount per event instead of rate × paid tickets.
  const [myMarketerSales, setMyMarketerSales] = useState<Array<{ application_id: string; amount: number; accrued_at: string }>>([]);
  const [marketers, setMarketers] = useState<Array<{ id: string; email: string; name: string; commission_amount: number; active: boolean; reviewed_at: string | null; upi_id: string | null; phone: string | null }>>([]);
  // Self-serve marketer onboarding: the durable top-line conversion funnel and
  // the in-progress level where each unfinished trainee currently sits.
  // Both source tables are strict-admin only; ops sessions never fetch them.
  const [marketerSignupFunnel, setMarketerSignupFunnel] = useState<{ started: number; completed: number }>({ started: 0, completed: 0 });
  const [marketerLevelDropoff, setMarketerLevelDropoff] = useState<Array<{ level: number; count: number }>>([]);
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
  // Outstanding (unpaid) marketer commissions, one row per event + date + marketer.
  // Founder-only; feeds the Outstanding payouts view + per-date Settle buttons.
  const [marketerPayouts, setMarketerPayouts] = useState<Array<{ event_slug: string; event_title: string | null; selected_date: string | null; marketer_id: string; marketer_name: string | null; tickets: number; amount: number }>>([]);
  const [eventMarketersMap, setEventMarketersMap] = useState<Record<string, string[]>>({});
  // Staff attendance — one row per person per IST day they had the panel open.
  // Attendance only: it says someone was here, never that they did any work.
  const [staffPresence, setStaffPresence] = useState<Array<{ email: string; ist_day: string; last_seen_at: string }>>([]);
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

  // ── Manager role state ─────────────────────────────────────────────────
  // currentManager: managers row matching the logged-in ops user's email —
  // the side-car that makes an ops login a manager (mirrors currentMarketer;
  // manager wins if someone is somehow both). Managers see ALL leads of
  // their events via RLS, oversee that event's marketers, and can hire.
  const [currentManager, setCurrentManager] = useState<{ id: string; name: string; email: string; commission_amount: number } | null>(null);
  // Per-marketer rollups for the manager's events, from get_manager_summary().
  const [managerSummary, setManagerSummary] = useState<{
    marketers: Array<{ marketer_id: string; name: string; active: boolean; leads: number; advance_paid: number; fully_paid: number; stale_leads: number; revenue: number; commission: number }>;
    unassigned_stale: number;
  } | null>(null);
  // Full roster (managers may read it) + which marketers are on each managed
  // event — powers the team chips. slug → marketer_id[].
  const [managerRoster, setManagerRoster] = useState<Array<{ id: string; name: string; email: string; active: boolean }>>([]);
  const [managerEventMarketers, setManagerEventMarketers] = useState<Record<string, string[]>>({});
  // Managed events + their per-date booking counts — the manager's own copy
  // of the spots-card data (kept separate from the marketer states so a
  // dual-role person's two hats don't overwrite each other).
  const [managerAssignedSlugs, setManagerAssignedSlugs] = useState<string[]>([]);
  const [managerEventDateCounts, setManagerEventDateCounts] = useState<Record<string, Record<string, { registered: number; reserved: number }>>>({});
  // Dual-role scope switch (someone in BOTH side-cars): 'mine' = their own
  // marketer leads across all events, 'team' = every lead on managed events
  // + the manager cockpit. Defaults to 'mine' — the daily calling routine.
  const [peopleScope, setPeopleScope] = useState<'mine' | 'team'>('mine');
  // Inline hire form: which event's form is open + its fields.
  const [hiringEventSlug, setHiringEventSlug] = useState<string | null>(null);
  const [newHireEmail, setNewHireEmail] = useState('');
  const [newHireName, setNewHireName] = useState('');
  const [savingHire, setSavingHire] = useState(false);
  // Dates & group chats (manager phase 4): per-date edit buffers keyed by
  // event_dates.id, + the add-date form. Writes go through the SECURITY
  // DEFINER RPCs (additive dates only; url/status edits only).
  const [dateEdits, setDateEdits] = useState<Record<string, { url: string; status: string }>>({});
  // Which managed event is expanded in the manager's Plans tab (greyed admin
  // editor + live dates section).
  const [managerOpenSlug, setManagerOpenSlug] = useState<string | null>(null);
  const [addingDateSlug, setAddingDateSlug] = useState<string | null>(null);
  const [newDateValue, setNewDateValue] = useState('');
  const [newDateLabel, setNewDateLabel] = useState('');
  const [newDateUrl, setNewDateUrl] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  // Managers card (Performance tab, admin): roster + ledger rollups +
  // per-manager event assignment. Mirrors the Creators card.
  const [adminManagers, setAdminManagers] = useState<Array<{ id: string; name: string; email: string; commission_amount: number; active: boolean }>>([]);
  const [adminManagerStats, setAdminManagerStats] = useState<Record<string, { tickets: number; earned: number; unpaid: number }>>({});
  const [adminManagerEvents, setAdminManagerEvents] = useState<Record<string, string[]>>({});
  const [addingManagerRow, setAddingManagerRow] = useState(false);
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [newManagerCommissionInput, setNewManagerCommissionInput] = useState('35');
  const [savingManagerRow, setSavingManagerRow] = useState(false);
  // Phase 6 scorecard: per-manager outcome + activity metrics from
  // get_manager_scorecards() (strict-admin RPC), keyed by manager id.
  const [managerScorecards, setManagerScorecards] = useState<{ benchmark: number; byId: Record<string, any> } | null>(null);

  // ── Affiliates (creators) — admin-only, populated when admin opens Creators ──
  const [affiliates, setAffiliates] = useState<Array<{ id: string; handle: string; name: string; email: string; active: boolean; reviewed_at: string | null; upi_id: string | null; phone: string | null; gender: string | null }>>([]);
  const [creatorSearch, setCreatorSearch] = useState('');
  // Creator video submissions — the activity log behind the "Creator videos"
  // card. Loaded with the roster so a creator with zero videos still shows up;
  // that row (blank "last video") is the whole point of the table.
  const [creatorVideos, setCreatorVideos] = useState<CreatorVideoRow[]>([]);
  const [openVideoCreator, setOpenVideoCreator] = useState<string | null>(null);
  const [videoNotes, setVideoNotes] = useState<Record<string, string>>({});
  const [reviewingVideo, setReviewingVideo] = useState<string>('');
  // Creator signup funnel — how many Google accounts entered the /creator flow
  // vs actually finished. Cleaner than auth.users, which mixes every login type.
  const [signupFunnel, setSignupFunnel] = useState<{ started: number; completed: number }>({ started: 0, completed: 0 });
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
  // ── Experiments tab state ──
  // Releases come straight from feature_releases (small table, admin-strict
  // RLS). Daily metrics come via the get_experiments_daily RPC — NOT a direct
  // table select, which would silently truncate at PostgREST's 1000-row cap.
  const [expReleases, setExpReleases] = useState<Array<{ id: number; released_at: string; title: string; description: string | null; area: string | null; expected_effect: string | null; source: string; commit_hash: string | null }>>([]);
  const [expDaily, setExpDaily] = useState<Array<{ day: string; metric: string; value: number }>>([]);
  const [expLoading, setExpLoading] = useState(false);
  const [expMetric, setExpMetric] = useState('form_completion');
  const [expGranularity, setExpGranularity] = useState<'daily' | 'weekly'>('weekly');
  const [expCompareReleaseId, setExpCompareReleaseId] = useState<number | null>(null);
  const [expCompareWindow, setExpCompareWindow] = useState(7);
  // null = form closed; id null = adding a new release, id set = editing.
  const [expRelForm, setExpRelForm] = useState<{ id: number | null; released_at: string; title: string; area: string; description: string; expected_effect: string } | null>(null);
  const [expRelSaving, setExpRelSaving] = useState(false);
  const [expSelectedReleaseIds, setExpSelectedReleaseIds] = useState<Set<number>>(new Set());
  // '' = all events pooled site-wide; otherwise an events.id — scopes both the
  // trend chart and the Before/After card to that one event.
  const [expEventId, setExpEventId] = useState<string>('');
  // Which releases draw markers on the trend chart. null = all of them; a Set
  // = only those ids (funnelSelected-style, so the chart stays readable as the
  // log grows). Start with an empty Set so the chart stays clean until the
  // admin explicitly chooses releases. The Before/After picker is unaffected —
  // every release stays selectable there.
  const [expChartReleases, setExpChartReleases] = useState<Set<number> | null>(new Set());
  // ── Test-data purger (scan many numbers → passcode → delete) ──
  // purgePhone holds the raw multi-line/comma-separated input; parsePurgePhones
  // splits it. The delete is gated by a 4-digit passcode verified server-side.
  const [purgePhone, setPurgePhone] = useState('');
  const [purgeScan, setPurgeScan] = useState<any | null>(null);
  const [purgePasscode, setPurgePasscode] = useState('');
  const [purgeBusy, setPurgeBusy] = useState(false);
  const [purgeResult, setPurgeResult] = useState<any | null>(null);
  // Split on commas / whitespace / newlines; keep only entries with digits.
  const parsePurgePhones = (raw: string): string[] =>
    raw.split(/[\s,;]+/).map(s => s.trim()).filter(s => /\d/.test(s));
  const [applications, setApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsEventFilter, setApplicationsEventFilter] = useState<'all' | string>('all');
  // Filters leads by their selected_date (ISO). 'all' = every date. Handy for
  // multi-date events where one plan has leads across several dates.
  const [applicationsDateFilter, setApplicationsDateFilter] = useState<'all' | string>('all');
  const [applicationsStatusFilter, setApplicationsStatusFilter] = useState<'all' | string>('all');
  // 'all' | 'unassigned' | <marketer id>. Admin-only filter.
  const [applicationsMarketerFilter, setApplicationsMarketerFilter] = useState<'all' | string>('all');
  // People tab: whether the collapsed "Paid · past dates" fold is expanded.
  // Fully-paid people whose event date has passed are tucked away by default
  // so the working list stays the current/upcoming cohort.
  const [pastPaidExpanded, setPastPaidExpanded] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvingDoubtId, setApprovingDoubtId] = useState<string | null>(null);
  const [resendingDetailsId, setResendingDetailsId] = useState<string | null>(null);
  // Free-form WhatsApp reply, per application row. `replyWindow` caches the
  // 24-hour customer-service window check so opening a box does not re-hit
  // Wamafy on every render.
  const [replyOpenFor, setReplyOpenFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replySendingId, setReplySendingId] = useState<string | null>(null);
  const [replyWindow, setReplyWindow] = useState<Record<string, { checking?: boolean; open?: boolean; expiresAt?: string | null; error?: string }>>({});
  const [replySentFor, setReplySentFor] = useState<Record<string, string>>({});
  const [callStatusEdits, setCallStatusEdits] = useState<Record<string, string>>({});
  const [callNotesEdits, setCallNotesEdits] = useState<Record<string, string>>({});
  const [qnaCityFilter, setQnaCityFilter] = useState<'all' | string>('all');
  const [qnaDoubtCityFilter, setQnaDoubtCityFilter] = useState<'all' | string>('all');
  const [qnaDoubtPlanFilter, setQnaDoubtPlanFilter] = useState<'all' | string>('all');
  const [mediaEditingId, setMediaEditingId] = useState<string | null>(null);
  const [qnaEditingId, setQnaEditingId] = useState<string | null>(null);
  const [mediaOriginalById, setMediaOriginalById] = useState<Record<string, Trip>>({});
  const [qnaOriginalById, setQnaOriginalById] = useState<Record<string, Trip>>({});
  const [otherEditingId, setOtherEditingId] = useState<string | null>(null);
  const [planActionById, setPlanActionById] = useState<Record<string, string>>({});
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
        // Both side-cars load together: an email can be a marketer, a manager,
        // or BOTH (dual role — e.g. a promoted marketer who keeps selling).
        // Dual-role users get a My Leads / Team Leads scope switch; each hat
        // keeps earning its own commission via the DB triggers.
        const [{ data: mgr }, { data: mk }] = await Promise.all([
          supabase.from('managers')
            .select('id, name, email, commission_amount')
            .eq('email', userEmail).eq('active', true).maybeSingle(),
          supabase.from('call_marketers')
            .select('id, name, email, commission_amount')
            .eq('email', userEmail).eq('active', true).maybeSingle(),
        ]);
        setCurrentManager(mgr ?? null);
        setCurrentMarketer(mk ?? null);
        if (mk?.id) {
          // Fetch the authoritative ledger once. The monthly slice drives the
          // banner; the full set drives the per-event earnings bill below.
          const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
          const { data: sales } = await supabase
            .from('marketer_sales')
            .select('application_id, amount, accrued_at')
            .eq('marketer_id', mk.id);
          const ledger = (sales ?? []).map((row: any) => ({
            application_id: String(row.application_id),
            amount: Number(row.amount),
            accrued_at: String(row.accrued_at),
          }));
          const monthlySales = ledger.filter(row => new Date(row.accrued_at) >= monthStart);
          const total = monthlySales.reduce((sum, row) => sum + row.amount, 0);
          setMyMarketerSales(ledger);
          setMyCommissionStats({ total, ticketCount: monthlySales.length });
        } else {
          setMyCommissionStats(null);
          setMyMarketerSales([]);
        }
      } else {
        setCurrentMarketer(null);
        setMyCommissionStats(null);
        setMyMarketerSales([]);
        setCurrentManager(null);
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

  // ─── PRESENCE: tell the server this person has the panel open ─────────────
  // Keyed on adminRole rather than living inside onAuthStateChange, because the
  // access token isn't attached to the client yet at that point (the same race
  // that once made /creator report "not a creator"). By the time a role exists,
  // resolveRole has already completed a successful authenticated read.
  //
  // Runs for admins AND ops, so marketers are the ones actually recorded. The
  // RPC is a silent no-op for anyone not in admin_users, and swallows its own
  // errors — presence must never be able to break the panel.
  useEffect(() => {
    if (!adminRole) return;
    let stopped = false;
    const ping = () => {
      if (stopped || document.visibilityState !== 'visible') return;
      supabase.rpc('touch_presence').then(({ error }) => {
        if (error) console.warn('[admin] presence ping failed:', error.message);
      });
    };
    ping();
    // Five minutes is well under any realistic session, so a marketer who opens
    // the panel at all gets recorded, while 15 staff cost ~1 write/minute.
    const timer = window.setInterval(ping, 5 * 60 * 1000);
    // Phones suspend timers in a backgrounded tab; re-ping when they come back.
    document.addEventListener('visibilitychange', ping);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', ping);
    };
  }, [adminRole]);

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

  // Team and Growth each hold several sub-views, so their data is fetched from
  // an effect keyed on the sub-view rather than from the tab button's onClick.
  // That way switching sub-view loads what that sub-view needs, and a refresh
  // landing on a remembered tab isn't stuck with empty cards until you click
  // away. Only the sub-view you are actually looking at gets fetched.
  useEffect(() => {
    if (adminRole !== 'admin' || tab !== 'marketers') return;
    if (teamMode === 'creators') loadAffiliatesData();
    else { loadMarketersData(); loadManagersCard(); }
  }, [adminRole, tab, teamMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (adminRole !== 'admin' || tab !== 'analytics') return;
    if (growthMode === 'trends') loadExperiments();
    else loadAnalytics();
  }, [adminRole, tab, growthMode]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (adminRole !== 'admin') return;
    setMarketersLoading(true);
    // 60 days of attendance covers the 14-day strip and still lets "last seen"
    // reach back past a holiday before falling back to "not seen".
    const presenceSince = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' })
      .format(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000));
    const [{ data: mkRows }, { data: salesRows }, { data: emRows }, { data: perfRows }, { data: fcRows }, { data: payoutRows }, { data: intentRows }, { data: signupRows }, { data: presenceRows }] = await Promise.all([
      supabase.from('call_marketers').select('id, email, name, commission_amount, active, reviewed_at, upi_id, phone').order('created_at'),
      supabase.from('marketer_sales').select('marketer_id, amount'),
      supabase.from('event_marketers').select('event_slug, marketer_id'),
      supabase.rpc('get_performance_summary'),
      supabase.from('fixed_costs').select('*').order('created_at'),
      supabase.rpc('get_marketer_payouts_outstanding'),
      supabase.from('marketer_signup_intents').select('email, completed_at'),
      supabase.from('marketer_signups').select('email, progress, status'),
      supabase.from('staff_presence_days').select('email, ist_day, last_seen_at').gte('ist_day', presenceSince),
    ]);
    setMarketersLoading(false);
    setStaffPresence((presenceRows ?? []) as any);
    setPerfSummary(perfRows ?? null);
    setMarketerPayouts((payoutRows ?? []) as any);
    setFixedCosts((fcRows ?? []) as any);
    setMarketers((mkRows ?? []) as any);
    const intents = (intentRows ?? []) as Array<{ completed_at: string | null }>;
    setMarketerSignupFunnel({ started: intents.length, completed: intents.filter(row => row.completed_at).length });
    const startedIntentEmails = new Set((intentRows ?? []).map((row: any) => String(row.email ?? '').toLowerCase()));
    const completedIntentEmails = new Set((intentRows ?? []).filter((row: any) => row.completed_at).map((row: any) => String(row.email ?? '').toLowerCase()));
    const dropoff: Record<number, number> = {};
    (signupRows ?? []).forEach((row: any) => {
      const signupEmail = String(row.email ?? '').toLowerCase();
      if (row.status !== 'in_progress' || !startedIntentEmails.has(signupEmail) || completedIntentEmails.has(signupEmail)) return;
      const level = Math.min(13, Math.max(1, Number(row.progress?.current_level) || 1));
      dropoff[level] = (dropoff[level] ?? 0) + 1;
    });
    setMarketerLevelDropoff(Object.entries(dropoff).map(([level, count]) => ({ level: Number(level), count })).sort((a, b) => a.level - b.level));
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

  // Attendance derived for the Marketers roster. Day keys are IST (YYYYMMDD
  // ints, same helpers the rest of the panel uses), so someone who opens the
  // panel at 11pm IST counts for that day rather than the next UTC one.
  const presenceView = useMemo(() => {
    // Index 0 = today, so a row's index IS its age in days.
    const dayKeys: number[] = [];
    for (let i = 0; i < 60; i++) {
      const key = dateKeyInTimeZone(new Date(Date.now() - i * 24 * 60 * 60 * 1000), 'Asia/Kolkata');
      if (key !== null) dayKeys.push(key);
    }
    const ageOf = new Map(dayKeys.map((key, index) => [key, index]));
    const byEmail = new Map<string, { days: Set<number>; ageDays: number | null; lastSeenAt: string | null }>();
    staffPresence.forEach(row => {
      const email = String(row.email ?? '').toLowerCase();
      const key = isoDateKey(row.ist_day);
      if (!email || key === null) return;
      const entry = byEmail.get(email) ?? { days: new Set<number>(), ageDays: null, lastSeenAt: null };
      entry.days.add(key);
      const age = ageOf.get(key);
      if (age !== undefined && (entry.ageDays === null || age < entry.ageDays)) {
        entry.ageDays = age;
        entry.lastSeenAt = row.last_seen_at ?? null;
      }
      byEmail.set(email, entry);
    });
    // Oldest → newest, so the strip reads left-to-right like a calendar.
    return { byEmail, strip: dayKeys.slice(0, 14).slice().reverse() };
  }, [staffPresence]);

  // Settle every unpaid marketer commission for one event + date (founder-only
  // RPC stamps paid_out_at). Clears that date from Outstanding payouts and drops
  // the tickets + owed from each marketer. Not reversible from the UI.
  const settleMarketerPayout = async (eventSlug: string, selectedDate: string | null, label: string, tickets: number, amount: number) => {
    if (!window.confirm(`Mark ${label} as paid out?\n\nThis clears ${tickets} ${tickets === 1 ? 'ticket' : 'tickets'} (₹${Math.round(amount).toLocaleString('en-IN')}) from outstanding payouts. It can't be undone here.`)) return;
    const { data, error } = await supabase.rpc('settle_marketer_payouts', { p_event_slug: eventSlug, p_selected_date: selectedDate });
    if (error) { alert('Could not settle: ' + error.message); return; }
    logAdminAction('marketer_payout_settle', 'marketer_sales', null, { event_slug: eventSlug, selected_date: selectedDate, ...(data as any) });
    await loadMarketersData();
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

  // Manager dashboard data: assigned events (reuses the marketer spots-card
  // state — a session is either marketer or manager, never both), the full
  // marketer roster + per-event assignments (team chips), and the per-marketer
  // performance rollups from the scoped SECURITY DEFINER RPC.
  const loadManagerTeam = async (managerId: string) => {
    const [{ data: emRows }, { data: rosterRows }, { data: evmkRows }, { data: summary }] = await Promise.all([
      supabase.from('event_managers').select('event_slug').eq('manager_id', managerId),
      supabase.from('call_marketers').select('id, name, email, active').order('created_at'),
      supabase.from('event_marketers').select('event_slug, marketer_id'),
      supabase.rpc('get_manager_summary'),
    ]);
    const slugs = Array.from(new Set((emRows ?? []).map((r: any) => r.event_slug).filter(Boolean)));
    setManagerAssignedSlugs(slugs);
    setManagerRoster((rosterRows ?? []) as any);
    const map: Record<string, string[]> = {};
    (evmkRows ?? []).forEach((r: any) => { (map[r.event_slug] ??= []).push(r.marketer_id); });
    setManagerEventMarketers(map);
    if (summary) setManagerSummary(summary as any);
    return slugs;
  };

  useEffect(() => {
    if (!currentManager) { setManagerSummary(null); setManagerRoster([]); setManagerEventMarketers({}); setManagerAssignedSlugs([]); setManagerEventDateCounts({}); return; }
    let cancelled = false;
    (async () => {
      const slugs = await loadManagerTeam(currentManager.id);
      if (cancelled || slugs.length === 0) return;
      const entries = await Promise.all(slugs.map(async (slug) => [slug, await fetchEventDateCounts(slug)] as const));
      if (!cancelled) setManagerEventDateCounts(Object.fromEntries(entries));
    })().catch(() => { /* dashboard degrades gracefully if a fetch fails */ });
    return () => { cancelled = true; };
  }, [currentManager]);

  // Replace event_marketers rows for one of the manager's events. Same shape
  // as the admin setEventMarketers, but tracked in managerEventMarketers and
  // allowed by the manager INSERT/DELETE RLS (own events only). The DB
  // trigger redistributes leads on every change.
  const managerSetEventMarketers = async (eventSlug: string, nextIds: string[]) => {
    const current = managerEventMarketers[eventSlug] ?? [];
    const toAdd = nextIds.filter(id => !current.includes(id));
    const toRemove = current.filter(id => !nextIds.includes(id));
    if (toRemove.length > 0) {
      const { error } = await supabase.from('event_marketers').delete().eq('event_slug', eventSlug).in('marketer_id', toRemove);
      if (error) { showToast(`Failed: ${error.message}`); return; }
    }
    if (toAdd.length > 0) {
      const { error } = await supabase.from('event_marketers').insert(toAdd.map(marketer_id => ({ event_slug: eventSlug, marketer_id })));
      if (error) { showToast(`Failed: ${error.message}`); return; }
    }
    setManagerEventMarketers(prev => ({ ...prev, [eventSlug]: nextIds }));
    logAdminAction('manager_event_marketers_set', 'event_marketers', null, { event_slug: eventSlug, marketer_ids: nextIds });
    // Refresh rollups AND the lead list — the DB trigger just redistributed
    // leads between marketers, so the name tags on leads changed too.
    const { data: summary } = await supabase.rpc('get_manager_summary');
    if (summary) setManagerSummary(summary as any);
    loadApplications();
  };

  // Autonomous hiring (founder-approved): one atomic RPC creates the marketer
  // row + ops login + event assignment, audit-logs it, and pushes an admin
  // notification. The server re-validates the caller manages the event.
  const hireMarketer = async (eventSlug: string) => {
    const email = newHireEmail.trim().toLowerCase();
    const name = newHireName.trim();
    if (!email || !name) { showToast('Email and name required'); return; }
    setSavingHire(true);
    const { error } = await supabase.rpc('manager_add_marketer', { p_email: email, p_name: name, p_event_slug: eventSlug });
    setSavingHire(false);
    if (error) { showToast(`Hire failed: ${error.message}`); return; }
    showToast(`${name} hired — they can log in with ${email} now`);
    setHiringEventSlug(null); setNewHireEmail(''); setNewHireName('');
    if (currentManager) await loadManagerTeam(currentManager.id);
    loadApplications(); // their leads may have been redistributed
  };

  // Re-pull the full events tree (dates included) after a manager date change.
  const reloadTripsData = async () => {
    const { data } = await supabase.from('events').select('*, event_dates(*), event_media(*), event_reviews(*), faqs(*)').order('created_at', { ascending: true });
    if (data) setTrips((data as Trip[]).map(normalizeCityDetails));
  };

  // Manager phase 4: save a date's group link / availability. Only these two
  // fields — the RPC enforces it server-side (no renames, no deletes). Pass
  // status null for auto-capacity events (the RPC keeps the existing value).
  const managerSaveDate = async (dateId: string, url: string, status: string | null) => {
    setSavingDate(true);
    const { error } = await supabase.rpc('manager_update_event_date', { p_date_id: dateId, p_whatsapp_group_url: url, p_status: status });
    setSavingDate(false);
    if (error) { showToast(`Failed: ${error.message}`); return; }
    showToast('Date updated');
    setDateEdits(prev => { const next = { ...prev }; delete next[dateId]; return next; });
    reloadTripsData();
  };

  // Manager phase 4: add a brand-new date. The RPC seeds the booking timeline
  // by shifting the latest sibling date's steps, so bookings on the new date
  // get a correct payment rhythm from day one.
  const managerAddDate = async (eventSlug: string) => {
    if (!newDateValue) { showToast('Pick a date first'); return; }
    setSavingDate(true);
    const { error } = await supabase.rpc('manager_add_event_date', {
      p_event_slug: eventSlug, p_start_date: newDateValue,
      p_label: newDateLabel.trim() || null, p_whatsapp_group_url: newDateUrl.trim() || null,
    });
    setSavingDate(false);
    if (error) { showToast(`Failed: ${error.message}`); return; }
    showToast('Date added — booking timeline seeded automatically');
    setAddingDateSlug(null); setNewDateValue(''); setNewDateLabel(''); setNewDateUrl('');
    reloadTripsData();
  };

  // ── Managers card (Performance tab, admin) — mirrors the Creators card ──
  const loadManagersCard = async () => {
    const [{ data: mgrRows }, { data: salesRows }, { data: emRows }, { data: scoreData }] = await Promise.all([
      supabase.from('managers').select('id, name, email, commission_amount, active').order('created_at'),
      supabase.from('manager_sales').select('manager_id, amount, paid_out_at'),
      supabase.from('event_managers').select('event_slug, manager_id'),
      supabase.rpc('get_manager_scorecards'),
    ]);
    if (scoreData) {
      const byId: Record<string, any> = {};
      ((scoreData as any).managers ?? []).forEach((m: any) => { byId[m.manager_id] = m; });
      setManagerScorecards({ benchmark: Number((scoreData as any).benchmark_conversion_pct) || 0, byId });
    }
    setAdminManagers((mgrRows ?? []) as any);
    const stats: Record<string, { tickets: number; earned: number; unpaid: number }> = {};
    (salesRows ?? []).forEach((r: any) => {
      const cur = (stats[r.manager_id] ??= { tickets: 0, earned: 0, unpaid: 0 });
      cur.tickets += 1;
      cur.earned += Number(r.amount);
      if (!r.paid_out_at) cur.unpaid += Number(r.amount);
    });
    setAdminManagerStats(stats);
    const evMap: Record<string, string[]> = {};
    (emRows ?? []).forEach((r: any) => { (evMap[r.manager_id] ??= []).push(r.event_slug); });
    setAdminManagerEvents(evMap);
  };

  const saveNewManager = async () => {
    const email = newManagerEmail.trim().toLowerCase();
    const name = newManagerName.trim();
    const commission = Number(newManagerCommissionInput) || 35;
    if (!email || !name) { showToast('Email and name required'); return; }
    setSavingManagerRow(true);
    // An admin email must never gain a side-car row — it would fail
    // is_admin_only() and silently break that admin's own panel view.
    const { data: existingAdmin } = await supabase.from('admin_users').select('role').eq('email', email).maybeSingle();
    if (existingAdmin?.role === 'admin') {
      setSavingManagerRow(false);
      showToast('That email is a founder/admin login — it cannot also be a manager');
      return;
    }
    const { error } = await supabase.from('managers').insert({ email, name, commission_amount: commission });
    if (error) { setSavingManagerRow(false); showToast(`Failed: ${error.message}`); return; }
    // Login gate — same pattern as marketers: add an 'ops' row, never touch
    // an existing one (23505 = already present, e.g. an admin email).
    const { error: accessErr } = await supabase.from('admin_users').insert({ email, role: 'ops' });
    setSavingManagerRow(false);
    if (accessErr && accessErr.code !== '23505') {
      showToast(`Added, but login not granted: ${accessErr.message}`);
    } else {
      showToast('Manager added — assign them events below');
    }
    setAddingManagerRow(false);
    setNewManagerName(''); setNewManagerEmail(''); setNewManagerCommissionInput('35');
    logAdminAction('manager_create', 'managers', null, { email, name, commission });
    loadManagersCard();
  };

  const toggleManagerActive = async (m: { id: string; active: boolean; name: string; email: string }) => {
    const activating = !m.active;
    const { error } = await supabase.from('managers').update({ active: activating }).eq('id', m.id);
    if (error) { showToast(`Failed: ${error.message}`); return; }
    // Deactivating MUST also revoke the ops login: an ops user in neither
    // side-car reverts to the see-all-leads plain-ops view (verified trap —
    // see multi-marketer.md). Only ever touch a role='ops' row so a manager
    // who is also an admin never loses admin access.
    if (m.email) {
      if (activating) {
        await supabase.from('admin_users').insert({ email: m.email.toLowerCase(), role: 'ops' }); // 23505 harmless
      } else {
        await supabase.from('admin_users').delete().eq('email', m.email.toLowerCase()).eq('role', 'ops');
      }
    }
    showToast(`${m.name} ${activating ? 'reactivated' : 'deactivated'}`);
    logAdminAction(m.active ? 'manager_deactivate' : 'manager_reactivate', 'managers', m.id, {});
    loadManagersCard();
  };

  const markManagerPaid = async (m: { id: string; name: string }, unpaid: number) => {
    if (unpaid <= 0) return;
    if (!window.confirm(`Mark ₹${Math.round(unpaid).toLocaleString('en-IN')} as paid out to ${m.name}? This can't be undone.`)) return;
    const { error } = await supabase
      .from('manager_sales')
      .update({ paid_out_at: new Date().toISOString() })
      .eq('manager_id', m.id)
      .is('paid_out_at', null);
    if (error) { showToast(`Failed: ${error.message}`); return; }
    showToast(`Marked paid for ${m.name}`);
    logAdminAction('manager_payout', 'manager_sales', m.id, { amount: unpaid });
    loadManagersCard();
  };

  // Replace a manager's event assignments with the chosen set (admin-only —
  // managers cannot assign themselves). Unlike marketer changes this moves
  // no leads; it only changes scope + who future commission accrues to.
  const setManagerEvents = async (managerId: string, nextSlugs: string[]) => {
    const current = adminManagerEvents[managerId] ?? [];
    const toAdd = nextSlugs.filter(sl => !current.includes(sl));
    const toRemove = current.filter(sl => !nextSlugs.includes(sl));
    if (toRemove.length > 0) {
      const { error } = await supabase.from('event_managers').delete().eq('manager_id', managerId).in('event_slug', toRemove);
      if (error) { showToast(`Failed: ${error.message}`); return; }
    }
    if (toAdd.length > 0) {
      const { error } = await supabase.from('event_managers').insert(toAdd.map(event_slug => ({ event_slug, manager_id: managerId })));
      if (error) {
        // One manager per event, enforced by the DB (uq_event_managers_event).
        showToast(error.code === '23505'
          ? 'That event already has a manager — remove it from them first'
          : `Failed: ${error.message}`);
        loadManagersCard(); // resync chips with DB truth
        return;
      }
    }
    setAdminManagerEvents(prev => ({ ...prev, [managerId]: nextSlugs }));
    logAdminAction('event_managers_set', 'event_managers', null, { manager_id: managerId, event_slugs: nextSlugs });
  };

  // Save (or create) a marketer. Admin-only flow from the Marketers tab.
  const saveNewMarketer = async () => {
    const email = newMarketerEmail.trim().toLowerCase();
    const name = newMarketerName.trim();
    const commission = Number(newMarketerCommission) || 50;
    if (!email || !name) { showToast('Email and name required'); return; }
    setSavingMarketer(true);
    // Same guard as Add Manager: an admin email with a side-car row fails
    // is_admin_only() and silently loses the all-leads admin view.
    const { data: existingAdmin } = await supabase.from('admin_users').select('role').eq('email', email).maybeSingle();
    if (existingAdmin?.role === 'admin') {
      setSavingMarketer(false);
      showToast('That email is a founder/admin login — it cannot also be a marketer');
      return;
    }
    const { error } = await supabase.from('call_marketers').insert({ email, name, commission_amount: commission });
    if (error) { setSavingMarketer(false); showToast(`Failed: ${error.message}`); return; }
    // Grant admin-panel login: an 'ops' row in admin_users is the master gate a
    // marketer needs to get past the /admin front door. RLS (admin_users_admin_write)
    // already lets an admin write this. Skip if the email is already in admin_users
    // (23505) so we never overwrite/demote an existing admin — we only ADD ops access.
    const { error: accessErr } = await supabase.from('admin_users').insert({ email, role: 'ops' });
    setSavingMarketer(false);
    if (accessErr && accessErr.code !== '23505') {
      showToast(`Added, but login not granted: ${accessErr.message}`);
    } else {
      showToast('Marketer added — they can log in now');
    }
    setAddingMarketer(false);
    setNewMarketerEmail(''); setNewMarketerName(''); setNewMarketerCommission('50');
    logAdminAction('marketer_create', 'call_marketers', null, { email, name, commission });
    loadMarketersData();
  };

  const toggleMarketerActive = async (mk: { id: string; active: boolean; name: string; email: string }) => {
    const activating = !mk.active;
    const { error } = await supabase.from('call_marketers').update({ active: activating }).eq('id', mk.id);
    if (error) { showToast(`Failed: ${error.message}`); return; }
    // Mirror admin-panel login access: deactivating a marketer fully revokes their
    // /admin login (delete their 'ops' row), reactivating re-grants it. We ONLY ever
    // touch a role='ops' row, never an 'admin' row — so a marketer who is also an
    // admin never loses admin access.
    if (mk.email) {
      if (activating) {
        await supabase.from('admin_users').insert({ email: mk.email.toLowerCase(), role: 'ops' }); // 23505 if already present — harmless
      } else {
        await supabase.from('admin_users').delete().eq('email', mk.email.toLowerCase()).eq('role', 'ops');
      }
    }
    showToast(`${mk.name} ${activating ? 'reactivated' : 'deactivated'}`);
    logAdminAction(mk.active ? 'marketer_deactivate' : 'marketer_reactivate', 'call_marketers', mk.id, {});
    loadMarketersData();
  };

  // Clear the self-enrollment NEW flag after the founder has checked the row.
  // Hand-added historical marketers were backfilled as reviewed in Phase 1.
  const markMarketerReviewed = async (mk: { id: string; name: string }) => {
    const { error } = await supabase.from('call_marketers').update({ reviewed_at: new Date().toISOString() }).eq('id', mk.id);
    if (error) { showToast(`Failed: ${error.message}`); return; }
    showToast(`${mk.name} marked reviewed`);
    logAdminAction('marketer_reviewed', 'call_marketers', mk.id, {});
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

  // Manual "Reshuffle leads": force a full, even round-robin re-deal of the
  // event's unpaid leads across its active marketers. Unlike toggling the
  // chips (which only redistributes orphans), this deliberately moves leads a
  // marketer may be mid-conversation with, so it always asks first. Paid leads
  // never move. Runs the founders-only force_reshuffle_event_marketers RPC.
  const [reshufflingSlug, setReshufflingSlug] = useState<string | null>(null);
  const reshuffleEventMarketers = async (eventSlug: string) => {
    const count = (eventMarketersMap[eventSlug] ?? []).length;
    if (count === 0) { showToast('Assign at least one marketer first'); return; }
    if (!window.confirm(
      `Reshuffle all unpaid leads for this event evenly across the ${count} assigned marketer${count === 1 ? '' : 's'}?\n\n` +
      `Already-paid leads stay put. Leads someone is mid-conversation with can move to a different marketer.`
    )) return;
    setReshufflingSlug(eventSlug);
    const { data, error } = await supabase.rpc('force_reshuffle_event_marketers', { p_event_slug: eventSlug });
    setReshufflingSlug(null);
    if (error) { showToast('Reshuffle failed: ' + error.message); return; }
    logAdminAction('event_marketers_reshuffle', 'event_marketers', null, { event_slug: eventSlug, moved: data });
    showToast(`Reshuffled ${data ?? 0} lead${data === 1 ? '' : 's'} across ${count} marketer${count === 1 ? '' : 's'}`);
  };

  // Save the per-event marketer commission (₹ per fully-paid ticket). NULL
  // clears the override → marketers fall back to their ₹50 default. Writes
  // immediately (like the marketer chips) and keeps the open editor in sync.
  const setEventCommission = async (eventSlug: string, value: number | null) => {
    const { error } = await supabase.from('events').update({ marketer_commission: value }).eq('slug', eventSlug);
    if (error) { showToast('Commission save failed: ' + error.message); return; }
    setEditingTrip(prev => (prev && prev.slug === eventSlug ? { ...prev, marketer_commission: value } : prev));
    logAdminAction('event_commission_set', 'events', null, { event_slug: eventSlug, marketer_commission: value });
    showToast(value == null ? 'Commission reset to ₹50 default' : `Commission set to ₹${value}/ticket`);
  };

  // ── Affiliates (creators) — admin-only management ───────────────────────────
  // Pull roster + build per-creator rollups from clicks, attributed applications
  // and the sales ledger (admin has full RLS on all three).
  const loadAffiliatesData = async () => {
    const [{ data: affRows }, { data: salesRows }, { data: clickRows }, { data: appRows }, { data: videoRows }, { data: intentRows }] = await Promise.all([
      supabase.from('affiliates').select('id, handle, name, email, active, reviewed_at, upi_id, phone, gender').order('created_at'),
      supabase.from('affiliate_sales').select('affiliate_id, amount, paid_out_at'),
      supabase.from('affiliate_clicks').select('affiliate_id'),
      supabase.from('applications').select('affiliate_id').not('affiliate_id', 'is', null),
      supabase.from('creator_submissions').select('id, affiliate_id, event_slug, event_date, video_url, status, review_note, submitted_at, seen_at').order('submitted_at', { ascending: false }),
      supabase.from('creator_signup_intents').select('email, completed_at'),
    ]);
    setAffiliates((affRows ?? []) as any);
    setCreatorVideos((videoRows ?? []) as CreatorVideoRow[]);
    const intents = (intentRows ?? []) as Array<{ completed_at: string | null }>;
    setSignupFunnel({ started: intents.length, completed: intents.filter(r => r.completed_at).length });
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

  // Review a creator's video. Two outcomes only — approved, or changes wanted
  // with a note the creator reads on their own dashboard. The note is optional
  // on both. RLS restricts this table to strict admins, so ops never lands here.
  const reviewCreatorVideo = async (video: CreatorVideoRow, status: 'approved' | 'changes_requested') => {
    setReviewingVideo(video.id);
    const { data: userData } = await supabase.auth.getUser();
    const note = (videoNotes[video.id] ?? '').trim();
    const { error } = await supabase.from('creator_submissions').update({
      status,
      review_note: note || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userData?.user?.email?.toLowerCase() ?? null,
      // Reviewing implies you saw it — clear the "unseen" dot too (first stamp wins).
      seen_at: video.seen_at ?? new Date().toISOString(),
    }).eq('id', video.id);
    setReviewingVideo('');
    if (error) { showToast(`Failed: ${error.message}`); return; }
    showToast(status === 'approved' ? 'Video approved' : 'Changes requested');
    logAdminAction('creator_video_review', 'creator_submissions', video.id, { status, event_slug: video.event_slug });
    setVideoNotes(prev => ({ ...prev, [video.id]: '' }));
    loadAffiliatesData();
  };

  // Stamp a video "seen" the moment the founder opens its link. Independent of
  // approve/ask-changes — it only drives the "unseen" dot on the review queue.
  // Optimistic: flip local state first so the dot vanishes instantly; the write
  // is fire-and-forget (a missed stamp just re-shows the dot on next load).
  const markVideoSeen = (video: CreatorVideoRow) => {
    if (video.seen_at) return;
    const ts = new Date().toISOString();
    setCreatorVideos(prev => prev.map(v => (v.id === video.id ? { ...v, seen_at: ts } : v)));
    void supabase.from('creator_submissions').update({ seen_at: ts }).eq('id', video.id);
  };

  // Clear the "new arrivals" flag once the founder has eyeballed a self-joined
  // creator. Stamps reviewed_at so the NEW badge disappears. Never un-reviews.
  const markAffiliateReviewed = async (af: { id: string; name: string }) => {
    const { error } = await supabase.from('affiliates').update({ reviewed_at: new Date().toISOString() }).eq('id', af.id);
    if (error) { showToast(`Failed: ${error.message}`); return; }
    showToast(`${af.name} marked reviewed`);
    logAdminAction('affiliate_reviewed', 'affiliates', af.id, {});
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
    const [{ data, error }, { data: doubtsRows, error: doubtsErr }, { data: eventRows }, { data: planDoubtsRows }, { data: marketerRows }, { data: boardRows }, { data: waInboundRows }] = await Promise.all([
      fetchAllRows('applications', 'created_at'),
      fetchAllRows('doubt_submissions', 'submitted_at'),
      supabase.from('events').select('slug, invite_slug'),
      fetchAllRows('plan_doubts', 'created_at'),
      // Roster (id → name) so the admin Call view can tag each lead's marketer.
      // RLS returns all rows to admins, just the caller's own row to a marketer.
      supabase.from('call_marketers').select('id, name'),
      // Transparent team board (peers' tickets sold + earned) for marketers.
      supabase.rpc('get_marketer_board'),
      // Inbound WhatsApp replies. Bounded on purpose: this table grows forever and
      // a lead's reply stops being useful long before it stops being stored.
      supabase
        .from('whatsapp_inbound')
        .select('id, from_phone, from_name, body_text, msg_type, interactive_reply_id, sent_at, received_at')
        .gte('received_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
        .order('received_at', { ascending: false })
        .limit(500),
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
      // Replies are keyed by phone ALONE — a WhatsApp message carries no event, so
      // someone with two applications sees the same reply on both. That is the
      // honest rendering: we genuinely do not know which booking they meant.
      const waByPhone = new Map<string, any[]>();
      (waInboundRows ?? []).forEach((m: any) => {
        const normPhone = String(m.from_phone ?? '').replace(/\D/g, '').slice(-10);
        if (!normPhone) return;
        const arr = waByPhone.get(normPhone) ?? [];
        arr.push(m);
        waByPhone.set(normPhone, arr);
      });

      const enriched = (data ?? []).map((a: any) => {
        const normPhone = String(a.phone ?? '').replace(/\D/g, '').slice(-10);
        const aliases = eventSlugAliases.get(String(a.event_slug ?? '').trim()) ?? new Set<string>([a.event_slug]);
        const doubts = Array.from(aliases).flatMap(slug => doubtsByKey.get(`${normPhone}__${slug}`) ?? []);
        return {
          ...a,
          doubts,
          waReplies: waByPhone.get(normPhone) ?? [],
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
    // A waitlisted applicant only landed on the waitlist because their *previous*
    // date was full. Moving them to a new (open) date restores their spot, so flip
    // them back to 'invited' in the same write. Without this the invite flow keeps
    // showing the sold-out / "join the waitlist" screen (it keys off status, not
    // the date) even though the new date has room.
    const patch: { selected_date: string; status?: string } = { selected_date: newDate };
    if (target && target.status === 'waitlist') patch.status = 'invited';
    const { error } = await supabase.from('applications').update(patch).eq('id', id);
    setSavingDateId(null);
    if (error) { showToast(`❌ ${error.message}`); return; }
    setApplications(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
    logAdminAction('application_date_change', 'applications', id, patch);
    showToast(patch.status ? '✓ Date updated · moved off waitlist' : '✓ Date updated');
  };

  const getFreshAdminAccessToken = async () => {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    const accessToken = refreshData.session?.access_token;
    if (refreshError || !accessToken) return null;

    const { error: userError } = await supabase.auth.getUser(accessToken);
    if (userError) return null;

    return accessToken;
  };

  const formatInviteEmailDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return '';
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const month = d.toLocaleDateString('en-US', { month: 'long' });
    const day = d.getDate();
    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
    return `${dayName}, ${month} ${day}${suffix}`;
  };

  // Free-form replies only work inside WhatsApp's 24-hour window (Meta's rule).
  // Check before showing the box so nobody types a careful answer that bounces.
  const openWhatsAppReply = async (app: any) => {
    setReplyOpenFor(app.id);
    if (replyWindow[app.id]?.open !== undefined) return;
    setReplyWindow(w => ({ ...w, [app.id]: { checking: true } }));
    try {
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sess?.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ action: 'window', phone: app.phone }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReplyWindow(w => ({ ...w, [app.id]: { error: j?.error ?? 'could not check' } }));
        return;
      }
      setReplyWindow(w => ({ ...w, [app.id]: { open: !!j.windowOpen, expiresAt: j.expiresAt ?? null } }));
    } catch {
      setReplyWindow(w => ({ ...w, [app.id]: { error: 'could not check' } }));
    }
  };

  const sendWhatsAppReply = async (app: any) => {
    const text = (replyText[app.id] ?? '').trim();
    if (!text) return;
    setReplySendingId(app.id);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sess?.session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ action: 'send', phone: app.phone, text }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 409) {
        // Window shut between the check and the send.
        setReplyWindow(w => ({ ...w, [app.id]: { open: false } }));
        showToast(j?.message ?? 'Their reply window has closed.');
        return;
      }
      if (!res.ok) { showToast(`Not sent: ${j?.error ?? res.status}`); return; }
      setReplySentFor(m => ({ ...m, [app.id]: text }));
      setReplyText(t => ({ ...t, [app.id]: '' }));
      setReplyOpenFor(null);
      showToast('Reply sent on WhatsApp');
    } catch (err: any) {
      showToast(`Not sent: ${err?.message ?? 'network error'}`);
    } finally {
      setReplySendingId(null);
    }
  };

  const resendInviteDetails = async (id: string) => {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    if (!(app.status === 'invited' && app.re_target && !app.cart_abandoned)) {
      showToast('Resend details is only available for Re-Target leads.');
      return;
    }
    if (!String(callNotesEdits[id] ?? app.call_notes ?? '').trim()) {
      showToast('Select an option above.');
      return;
    }
    const email = String(app.email ?? '').trim();
    if (!email) {
      showToast('No email on this lead.');
      return;
    }

    setResendingDetailsId(id);
    const adminAccessToken = await getFreshAdminAccessToken();
    if (!adminAccessToken) {
      showToast('⚠️ Admin session expired. Please log in again, then resend.');
      setResendingDetailsId(null);
      return;
    }

    const appSlugLower = String(app.event_slug ?? '').toLowerCase();
    const trip = trips.find(t => String(t.slug ?? t.id ?? '').toLowerCase() === appSlugLower);
    const eventName = trip?.title ?? app.event_slug ?? '';
    const eventDate = formatInviteEmailDate((app.selected_date as string) || trip?.event_dates?.[0]?.start_date || '');

    try {
      const phone10 = String(app.phone ?? '').replace(/\D/g, '').slice(-10);
      const needsWhatsApp = !app.resend_details_whatsapp_sent_at;
      const needsEmail = !app.resend_details_email_sent_at;

      const sendWhatsApp = async () => {
        if (!needsWhatsApp) return { ok: true, skipped: true, error: '' };
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-aisensy-invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminAccessToken}` },
            body: JSON.stringify({
              phone: phone10,
              userName: app.name ?? '',
              eventName,
              eventDate,
              eventSlug: appSlugLower,
              deliveryKind: 'resend_invite_details',
            }),
          });
          const json = await res.json().catch(() => ({}));
          return { ok: res.ok && json.ok, skipped: false, error: String(json.error ?? `HTTP ${res.status}`).slice(0, 120) };
        } catch { return { ok: false, skipped: false, error: 'network error' }; }
      };

      const sendEmail = async () => {
        if (!needsEmail) return {
          ok: true,
          trackingSaved: true,
          sentAt: String(app.resend_details_email_sent_at ?? ''),
          skipped: true,
          error: '',
        };
        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-brevo-invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminAccessToken}` },
            body: JSON.stringify({
              applicationId: app.id,
              email,
              phone: phone10,
              userName: app.name ?? '',
              eventName,
              eventDate,
              eventSlug: appSlugLower,
              mode: 'resend',
            }),
          });
          const json = await res.json().catch(() => ({}));
          const ok = res.ok && json.ok;
          const trackingSaved = ok && json.trackingSaved === true;
          return {
            ok,
            trackingSaved,
            sentAt: trackingSaved ? String(json.sentAt ?? '') : '',
            skipped: false,
            error: String(json.error ?? (ok && !trackingSaved ? 'email sent, but tracking was not saved' : `HTTP ${res.status}`)).slice(0, 120),
          };
        } catch { return { ok: false, trackingSaved: false, sentAt: '', skipped: false, error: 'network error' }; }
      };

      const [whatsappResult, emailResult] = await Promise.all([sendWhatsApp(), sendEmail()]);
      const sentAt = new Date().toISOString();
      const deliveryPatch: Record<string, string> = {};
      if (needsWhatsApp && whatsappResult.ok) deliveryPatch.resend_details_whatsapp_sent_at = sentAt;

      if (Object.keys(deliveryPatch).length > 0) {
        const { data, error: patchError } = await supabase
          .from('applications')
          .update(deliveryPatch)
          .eq('id', id)
          .select('*')
          .maybeSingle();
        if (patchError) {
          showToast(`⚠️ Sent, but delivery tracking failed — ${patchError.message}`);
        } else {
          setApplications(prev => prev.map(a => a.id === id ? { ...a, ...(data ?? deliveryPatch) } : a));
        }
      }

      // The email Edge Function saves this timestamp with the service role only
      // after Brevo accepts the message. Mirror that confirmed server value into
      // local state; never paint a temporary tick for an unsaved database write.
      if (needsEmail && emailResult.trackingSaved && emailResult.sentAt) {
        setApplications(prev => prev.map(a => a.id === id
          ? { ...a, resend_details_email_sent_at: emailResult.sentAt }
          : a));
      }

      logAdminAction('resend_invite_details', 'applications', id, {
        event_slug: app.event_slug ?? null,
        email_tail: email.slice(-8),
        whatsapp_sent: needsWhatsApp ? whatsappResult.ok : 'already_sent',
        email_sent: needsEmail ? emailResult.ok : 'already_sent',
      });

      if (whatsappResult.ok && emailResult.ok && emailResult.trackingSaved) {
        showToast('✅ Details resent on WhatsApp & email');
      } else {
        const failures = [
          !whatsappResult.ok ? `WhatsApp: ${whatsappResult.error}` : '',
          !emailResult.ok || !emailResult.trackingSaved ? `email: ${emailResult.error}` : '',
        ].filter(Boolean).join(' · ');
        showToast(`⚠️ Partially sent — ${failures}`);
      }
    } catch {
      showToast('❌ Resend failed (unexpected error)');
    } finally {
      setResendingDetailsId(null);
    }
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

    const adminAccessToken = await getFreshAdminAccessToken();
    if (!adminAccessToken) {
      showToast('⚠️ Admin session expired. Please log in again, then approve.');
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
      const eventDate = formatInviteEmailDate(firstDate);
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
        const aiRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-aisensy-invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminAccessToken}`,
          },
          body: JSON.stringify({
            phone: phone.replace(/^91/, ''),
            userName: app.name ?? '',
            eventName,
            eventDate,
            // Pass the exact slug so send-aisensy-invite can find this
            // application and fire the Brevo email server-side (see below).
            eventSlug: appSlugLower,
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

      // The invite EMAIL is now sent server-side by send-aisensy-invite (called
      // above) right after the WhatsApp — so it fires regardless of which
      // frontend version the admin/marketer is running (a stale PWA can't skip
      // it). No direct Brevo call from here anymore; email_invite_sent is
      // stamped by the function.
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

  // Resolve a doubt directly into the event's real lead lifecycle. Invite-only
  // events use the normal approval path; open events stay pending/in-progress
  // and receive a self-serve details link without invite-only side effects.
  const approveDoubtSubmission = async (submission: any) => {
    // Resolve the canonical event slug + trip from whatever the doubt stored.
    const rawTitle = (submission.event_title || submission.event_slug || submission.event_id || '').trim();
    const trip = trips.find(t =>
      String(t.slug ?? '').toLowerCase() === String(submission.event_id ?? '').toLowerCase()
      || t.title === rawTitle || t.slug === rawTitle || t.invite_slug === rawTitle
    );
    const slug = String(trip?.slug ?? submission.event_id ?? '').toLowerCase();
    const phone10 = String(submission.phone ?? '').replace(/\D/g, '').slice(-10);
    const isOpenEvent = trip?.booking_url === 'payu-hosted';

    if (!slug)                        { showToast('❌ Could not match this doubt to a plan'); return; }
    if (!/^[6-9]\d{9}$/.test(phone10)) { showToast('❌ Invalid phone number on this doubt'); return; }

    setApprovingDoubtId(submission.id);

    const adminAccessToken = await getFreshAdminAccessToken();
    if (!adminAccessToken) {
      showToast('⚠️ Admin session expired. Please log in again, then approve.');
      setApprovingDoubtId(null);
      return;
    }

    // 1. Create the application row in the event's real lifecycle state. Open
    //    events have no approval gate: `pending` means an unpaid/in-progress
    //    lead. Invite-only events become `invited` after approval. On a unique
    //    key clash, update only the lifecycle fields and preserve their form.
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
        status:        isOpenEvent ? 'pending' : 'invited',
        selected_date: submission.selected_date ?? null,
        selected_city: submission.city ?? null,
        pickup_label:  submission.meeting_spot ?? null,
        // Attribution: the doubt's existing owner keeps the lead (and the
        // commission). For a pure marketer that's always themselves (RLS only
        // shows them their own doubts), so behaviour is unchanged — but a
        // dual-role manager approving a TEAMMATE's doubt must not steal it.
        // Unowned doubts go to the approver if they're a marketer, else the
        // BEFORE INSERT trigger infers. Managers insert via the
        // applications_manager_insert policy (own events, any attribution);
        // marketers via their self-assigned-only policy.
        assigned_marketer_id: submission.assigned_marketer_id ?? currentMarketer?.id ?? null,
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
          const lifecyclePatch = isOpenEvent
            ? {
                status: 'pending',
                re_target: false,
                aisensy_invite_sent: false,
                invite_sent_at: null,
              }
            : { status: 'invited' };
          const { error: updateErr } = await supabase
            .from('applications')
            .update(lifecyclePatch)
            .eq('id', appId);
          if (updateErr) {
            showToast(`❌ ${updateErr.message}`);
            setApprovingDoubtId(null);
            return;
          }
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

    logAdminAction(isOpenEvent ? 'doubt_send_open_details' : 'doubt_approve_invite', 'applications', appId, {
      name: submission.name ?? null, phone: phone10, event_slug: slug, doubt_id: submission.id ?? null,
    });

    // 2. Deliver either open-event details or the invite-only approval message.
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

    // Open events remain in the self-serve `/plans` lifecycle. Send the known
    // open-event details deeplink, but never whitelist them as invite-only,
    // stamp invite delivery fields, or make them eligible for invite retarget.
    if (isOpenEvent) {
      let ok = false; let errReason = '';
      try {
        const detailsRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-aisensy-invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminAccessToken}` },
          body: JSON.stringify({
            phone: phone10,
            userName: submission.name ?? '',
            eventName,
            eventDate,
            eventSlug: slug,
            deliveryKind: 'open_event_details',
          }),
        });
        const detailsJson = await detailsRes.json().catch(() => ({}));
        ok = detailsRes.ok && detailsJson.ok;
        if (!ok && detailsJson.error) errReason = ` — ${String(detailsJson.error).slice(0, 120)}`;
      } catch { errReason = ' (network error)'; }

      const detailsEmail = String(submission.email ?? '').trim();
      let emailAttempted = false;
      let emailOk = false;
      let emailError = '';
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(detailsEmail)) {
        emailAttempted = true;
        try {
          const emailRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-brevo-invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminAccessToken}` },
            body: JSON.stringify({
              email: detailsEmail,
              phone: phone10,
              userName: submission.name ?? '',
              eventName,
              eventDate,
              eventSlug: slug,
              mode: 'open_event_details',
            }),
          });
          const emailJson = await emailRes.json().catch(() => ({}));
          emailOk = emailRes.ok && emailJson.ok;
          if (!emailOk) emailError = String(emailJson.error ?? `HTTP ${emailRes.status}`).slice(0, 120);
        } catch { emailError = 'network error'; }
      }

      if (ok && submission.id) {
        const sentAt = new Date().toISOString();
        const { error: stampError } = await supabase
          .from('doubt_submissions')
          .update({ open_details_sent_at: sentAt })
          .eq('id', submission.id);
        if (stampError) {
          // The message was accepted, so don't claim delivery failed. Leaving
          // the marker unset deliberately keeps the retry action available.
          errReason = ` — sent, but could not mark it complete: ${stampError.message}`;
        }
      }

      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            type: 'direct',
            phone: phone10,
            title: `${eventName} details`,
            body: 'Your event details are ready. Open the app to continue your booking.',
            url: `/invite?phone=${encodeURIComponent(phone10)}&name=${encodeURIComponent(submission.name ?? 'Guest')}`,
          },
        });
      } catch { /* push is non-critical */ }

      const emailNote = !emailAttempted ? '' : emailOk ? ' + email' : `; email failed — ${emailError}`;
      showToast(ok
        ? (errReason ? `⚠️ WhatsApp sent${emailNote}${errReason}` : `✅ Details sent on WhatsApp${emailNote}`)
        : `✅ Open-event lead saved — WhatsApp failed${errReason}${emailNote}`);
      setApprovingDoubtId(null);
      await loadApplications();
      return;
    }

    if (inviteSlug) {
      await supabase.from('invited_numbers').insert({ event_slug: inviteSlug, phone: phone10 }).select();
      logAdminAction('invited_number_add', 'invited_numbers', null, { event_slug: inviteSlug, phone: phone10, via: 'approveDoubtSubmission', application_id: appId });
    }

    let ok = false; let errReason = '';
    try {
      const aiRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-aisensy-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminAccessToken}` },
        body: JSON.stringify({ phone: phone10, userName: submission.name ?? '', eventName, eventDate, eventSlug: slug }),
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
  };

  const updateUserStatus = async (id: string, value: string) => {
    setCallNotesEdits(prev => ({ ...prev, [id]: value }));
    setApplications(prev => prev.map(a => a.id === id ? { ...a, call_notes: value } : a));
    const { error } = await supabase
      .from('applications')
      .update({ call_notes: value })
      .eq('id', id);
    if (error) {
      showToast(`❌ ${error.message}`);
      const current = applications.find(a => a.id === id)?.call_notes ?? '';
      setCallNotesEdits(prev => ({ ...prev, [id]: current }));
      setApplications(prev => prev.map(a => a.id === id ? { ...a, call_notes: current } : a));
    }
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

    // ── Re-point bookings when an existing date's start_date is edited ───────
    // applications reference a date by its DATE STRING (selected_date), not by
    // event_dates.id. The delete+reinsert below therefore strands every booking
    // on the OLD date whenever an admin edits a date in the event editor — the
    // per-date reserved counts vanish (event_booking_counts_by_date groups by
    // selected_date) and the calendar reverts that date to fully-green. Detect
    // dates whose start_date changed (matched by the row id that survived the
    // edit) and migrate their applications to the new date first. This
    // deliberately moves paid bookings too: a confirmed booking must follow its
    // date when the organiser reschedules it.
    if (id) {
      const original = trips.find(t => t.id === id);
      const renames = (event_dates ?? [])
        .filter(d => d.id)
        .map(d => ({ from: original?.event_dates?.find(o => o.id === d.id)?.start_date, to: d.start_date }))
        .filter((r): r is { from: string; to: string } => !!r.from && !!r.to && r.from !== r.to);
      for (const { from, to } of renames) {
        const slugFilter = [tripWithSlug.slug, tripWithSlug.invite_slug].filter(Boolean) as string[];
        const { error } = await supabase.from('applications')
          .update({ selected_date: to })
          .in('event_slug', slugFilter)
          .eq('selected_date', from);
        if (error) console.error('[saveTrip] date re-point failed', { from, to, error });
        else logAdminAction('event_date_repoint', 'applications', id, { slug: tripWithSlug.slug, from, to });
      }
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

  const loadExperiments = async (eventId: string = expEventId) => {
    setExpLoading(true);
    const [relRes, dailyRes] = await Promise.all([
      supabase.from('feature_releases').select('*').order('released_at', { ascending: false }).order('id', { ascending: false }).limit(500),
      supabase.rpc('get_experiments_daily', { p_event_id: eventId || null }),
    ]);
    if (relRes.error) {
      showToast(`❌ Failed to load releases: ${relRes.error.message}`);
    } else {
      setExpReleases(relRes.data ?? []);
    }
    if (dailyRes.error) {
      showToast(`❌ Failed to load daily metrics: ${dailyRes.error.message}`);
    } else {
      setExpDaily(Array.isArray(dailyRes.data) ? dailyRes.data : []);
    }
    setExpLoading(false);
  };

  const saveExpRelease = async () => {
    if (!expRelForm || !expRelForm.title.trim() || !expRelForm.released_at) { showToast('Date and title are required'); return; }
    setExpRelSaving(true);
    const payload = {
      released_at: expRelForm.released_at,
      title: expRelForm.title.trim(),
      area: expRelForm.area.trim() || null,
      description: expRelForm.description.trim() || null,
      expected_effect: expRelForm.expected_effect.trim() || null,
    };
    const res = expRelForm.id == null
      ? await supabase.from('feature_releases').insert({ ...payload, source: 'manual' })
      : await supabase.from('feature_releases').update(payload).eq('id', expRelForm.id);
    setExpRelSaving(false);
    if (res.error) { showToast(`❌ ${res.error.message}`); return; }
    setExpRelForm(null);
    showToast(expRelForm.id == null ? 'Release logged.' : 'Release updated.');
    loadExperiments();
  };

  const deleteExpRelease = async (id: number, title: string) => {
    if (!confirm(`Remove "${title}" from the release log?`)) return;
    const { error } = await supabase.from('feature_releases').delete().eq('id', id);
    if (error) { showToast(`❌ ${error.message}`); return; }
    setExpSelectedReleaseIds(current => { const next = new Set(current); next.delete(id); return next; });
    showToast('Release removed.');
    loadExperiments();
  };

  const toggleExpReleaseSelection = (id: number) => {
    setExpSelectedReleaseIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const deleteSelectedExpReleases = async () => {
    const ids = Array.from(expSelectedReleaseIds);
    if (ids.length === 0) return;
    if (!confirm(`Remove ${ids.length} selected release${ids.length === 1 ? '' : 's'} from the release log?`)) return;
    const { error } = await supabase.from('feature_releases').delete().in('id', ids);
    if (error) { showToast(`❌ ${error.message}`); return; }
    setExpSelectedReleaseIds(new Set());
    setExpCompareReleaseId(current => current != null && ids.includes(current) ? null : current);
    setExpChartReleases(current => current == null ? null : new Set([...current].filter(id => !ids.includes(id))));
    showToast(`${ids.length} release${ids.length === 1 ? '' : 's'} removed.`);
    loadExperiments();
  };

  // Step 1 of the purger: read-only report of everything the numbers touch.
  const scanPurgePhone = async () => {
    const phones = parsePurgePhones(purgePhone);
    if (phones.length === 0) { showToast('Enter at least one phone number'); return; }
    setPurgeBusy(true); setPurgeScan(null); setPurgeResult(null); setPurgePasscode('');
    const { data, error } = await supabase.rpc('scan_phone_data', { p_phones: phones });
    setPurgeBusy(false);
    if (error) { showToast(`❌ ${error.message}`); return; }
    setPurgeScan(data);
  };

  // Step 2: the actual delete. Gated by the 4-digit passcode, which the RPC
  // verifies server-side against app_secrets (so a shared login can't bypass
  // it by calling the RPC directly).
  const runPurgePhone = async () => {
    const phones: string[] = purgeScan?.phones ?? [];
    if (phones.length === 0) return;
    if (!/^\d{4}$/.test(purgePasscode)) { showToast('Enter the 4-digit passcode'); return; }
    setPurgeBusy(true);
    const { data, error } = await supabase.rpc('purge_phone_data', { p_phones: phones, p_passcode: purgePasscode });
    setPurgeBusy(false);
    if (error) { showToast(error.message.includes('passcode') ? '🔒 Wrong passcode' : `❌ ${error.message}`); return; }
    setPurgeResult(data); setPurgeScan(null); setPurgePasscode(''); setPurgePhone('');
    showToast('🧹 Purged.');
    loadExperiments();
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
      if (data) setMsgs(prev => [...prev, data as ChatMsg]);
    }
    setSavingGeneralAnnouncements(false);
    showToast('Global announcements saved!');
    logAdminAction('general_announcements_save', 'chat_messages', existing?.id ?? null, {
      lines: globalAnnouncementsFields.filter(v => v.trim()).length,
    });
  };

  // The preview line for a selected event. This deliberately does NOT recompute
  // the text itself — it calls the same buildEventAnnouncement the live rail
  // uses, so the preview can never disagree with what guests actually see.
  const announcementPreviewText = (slug: string): string => {
    const event = trips.find(t => t.slug === slug);
    if (!event) return slug;
    if (!event.total_capacity) return `⚠ ${event.title} — no Group Size set (announcement won't show)`;
    const preview = announcementPreviews[slug];
    if (preview === undefined) return 'loading…';
    if (preview === null) return `⚠ ${event.title} — every date has passed (announcement won't show)`;
    return preview;
  };

  // Build the preview line for each selected announcement event. Keyed on trips
  // too, so editing an event's dates or group size refreshes the preview.
  React.useEffect(() => {
    const slugs = announcementEventSlugs.filter(Boolean);
    if (slugs.length === 0) return;
    let cancelled = false;
    Promise.all(
      slugs.map(async slug => {
        const event = trips.find(t => t.slug === slug);
        if (!event) return [slug, null] as const;
        const text = await buildEventAnnouncement(
          slug,
          event.title ?? slug,
          event.total_capacity ?? null,
          (event.event_dates ?? []).map(d => ({ date: d.start_date, status: d.status })),
        );
        return [slug, text] as const;
      })
    ).then(entries => {
      if (cancelled) return;
      setAnnouncementPreviews(prev => ({ ...prev, ...Object.fromEntries(entries) }));
    });
    return () => { cancelled = true; };
  }, [announcementEventSlugs, trips]);

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

  // Dev-only: preview the Map tab without logging in (npm run dev + ?mapdev in
  // the URL). import.meta.env.DEV is false in production builds, so this whole
  // branch is stripped from the deployed site.
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('mapdev')) {
    return (
      <div style={{ maxWidth: 1280, margin: '32px auto', padding: '0 20px' }}>
        <React.Suspense fallback={null}><JourneyMap demo /></React.Suspense>
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
    // Sub-view pill inside a tab — matches the Flow tab's Media/Timelines/FAQs
    // switcher so every consolidated tab reads the same way.
    subTab: (active: boolean) => ({ padding: '8px 18px', borderRadius: 99, border: 'none', background: active ? '#111' : '#fff', color: active ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: active ? '0 2px 6px rgba(0,0,0,0.15)' : 'none', transition: 'all 0.15s' }) as React.CSSProperties,
    subTabBar: { display: 'flex', gap: 8, marginBottom: 18, padding: 5, background: '#f3f3f3', borderRadius: 99, width: 'fit-content' } as React.CSSProperties,
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
        {(adminRole === 'admin' || !!currentManager) && <button style={s.tab(tab === 'trips')} onClick={() => switchTab('trips')}>Plans</button>}
        {adminRole === 'admin' && <button style={s.tab(tab === 'flow')} onClick={() => switchTab('flow')}>Flow</button>}
        <button style={s.tab(tab === 'people')} onClick={() => { switchTab('people'); loadApplications(); refreshPayuPayments(); }}>People</button>
        {/* Team, Growth and Build each fetch their own data from the sub-view
            effects above, so these buttons only switch tabs. Managers aren't
            admins and have no sub-views — they still need their team loaded. */}
        {(adminRole === 'admin' || !!currentManager) && <button style={s.tab(tab === 'marketers')} onClick={() => { switchTab('marketers'); if (adminRole !== 'admin' && currentManager) loadManagerTeam(currentManager.id); }}>Team</button>}
        {adminRole === 'admin' && <button style={s.tab(tab === 'analytics')} onClick={() => switchTab('analytics')}>Growth</button>}
        {adminRole === 'admin' && <button style={s.tab(tab === 'map')} onClick={() => switchTab('map')}>Build</button>}
        <button style={s.tab(tab === 'settings')} onClick={() => { switchTab('settings'); loadNotifDevices(); }} title="Settings" aria-label="Settings">⚙</button>
        <button onClick={logout} style={{ marginLeft: 8, padding: '7px 16px', borderRadius: 99, border: '1.5px solid #e0e0e0', background: '#fff', color: '#666', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Sign out</button>
      </div>

      <div style={{ maxWidth: (tab === 'people' || tab === 'map') ? 1280 : 920, margin: '32px auto', padding: '0 20px' }}>
        {loading && <div style={{ textAlign: 'center', color: '#aaa', marginTop: 60 }}>Loading...</div>}

        {/* ── MAP TAB (user-journey maps) ──────────────────────────────────── */}
        {!loading && tab === 'map' && adminRole === 'admin' && (
          <React.Suspense fallback={<div style={{ textAlign: 'center', color: '#aaa', marginTop: 60 }}>Loading map…</div>}>
            <JourneyMap showTodos={adminRole === 'admin'} />
          </React.Suspense>
        )}

        {/* ── TRIPS TAB ────────────────────────────────────────────────────── */}
        {/* ── PLANS TAB, MANAGER VIEW ─────────────────────────────────────────
            Same admin editor, read-only: the whole form renders greyed and
            untouchable, with a live Dates & group chats section on top — the
            only thing a manager edits here (via the guarded RPCs). Only their
            managed events appear. */}
        {!loading && tab === 'trips' && adminRole !== 'admin' && currentManager && (() => {
          const managedTrips = trips.filter(t => managerAssignedSlugs.includes(t.slug ?? ''));
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 22 }}>Your Plans</div>
            {managedTrips.length === 0 && (
              <div style={{ color: '#888', fontSize: 14 }}>No events assigned to you yet — ask a founder.</div>
            )}
            {managedTrips.map(t => {
              const slug = t.slug ?? '';
              const open = managerOpenSlug === slug;
              const dates = (t.event_dates ?? []).filter(d => d.start_date).slice().sort((a, b) => a.start_date.localeCompare(b.start_date));
              // Mirrors the admin editor's isCapEligible: invite + open events
              // derive availability automatically from capacity (sold-out when
              // full, "filling fast" at the threshold) — no manual status.
              // Only community/whatsapp events still use the manual dropdown.
              const capAuto = t.booking_url === 'native-application' || t.booking_url === 'payu-hosted';
              return (
                <div key={slug} style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#111' }}>{t.title}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 999, padding: '3px 9px', background: t.is_active ? '#f0fdf4' : '#f5f5f5', color: t.is_active ? '#15803d' : '#999', border: '1px solid ' + (t.is_active ? '#bbf7d0' : '#e5e5e5') }}>
                      {t.is_active ? 'LIVE' : 'HIDDEN'}
                    </span>
                    <div style={{ flex: 1 }} />
                    <button type="button" onClick={() => setManagerOpenSlug(open ? null : slug)}
                      style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#444' }}>
                      {open ? 'Close' : 'Open'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 14px', fontSize: 13, color: '#666', marginTop: 6 }}>
                    {dates.map(d => (
                      <span key={d.start_date} style={{ whiteSpace: 'nowrap' }}>
                        <b style={{ color: '#111' }}>{new Date(`${d.start_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</b>
                        {!capAuto && <> {statusLabel[d.status]}</>}{d.whatsapp_group_url ? ' · 💬' : ''}
                      </span>
                    ))}
                  </div>

                  {open && (
                    <>
                      {/* Dates & group chats — the manager's editable slice. */}
                      <div style={{ marginTop: 16, padding: 14, background: '#fafafa', border: '1.5px solid #eee', borderRadius: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                          Dates & group chats — you can edit these
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {dates.filter(d => d.id).map(d => {
                            const edit = dateEdits[d.id!] ?? { url: d.whatsapp_group_url ?? '', status: d.status };
                            // Auto events: only the group link is editable — the
                            // availability state is computed from real bookings,
                            // exactly like the admin editor's "Spots auto" chip.
                            const dirty = edit.url !== (d.whatsapp_group_url ?? '') || (!capAuto && edit.status !== d.status);
                            const setEdit = (patch: Partial<{ url: string; status: string }>) =>
                              setDateEdits(prev => ({ ...prev, [d.id!]: { ...edit, ...patch } }));
                            return (
                              <div key={d.id} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, fontSize: 13, color: '#111', width: 64 }}>
                                  {new Date(`${d.start_date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                {capAuto ? (
                                  <span style={{ color: '#16a34a', background: '#dcfce7', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    Spots auto
                                  </span>
                                ) : (
                                  <select value={edit.status} onChange={e => setEdit({ status: e.target.value })}
                                    style={{ padding: '6px 8px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 12, background: '#fff' }}>
                                    <option value="available">Available</option>
                                    <option value="selling_out">Selling out</option>
                                    <option value="sold_out">Sold out</option>
                                  </select>
                                )}
                                <input type="url" placeholder="WhatsApp group link" value={edit.url} onChange={e => setEdit({ url: e.target.value })}
                                  style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 12, flex: 1, minWidth: 160 }} />
                                {dirty && (
                                  <button type="button" disabled={savingDate} onClick={() => managerSaveDate(d.id!, edit.url, capAuto ? null : edit.status)}
                                    style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', fontWeight: 700, fontSize: 12, cursor: savingDate ? 'wait' : 'pointer' }}>
                                    Save
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          {addingDateSlug === slug ? (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                              <input type="date" value={newDateValue} onChange={e => setNewDateValue(e.target.value)}
                                style={{ padding: '6px 8px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 12 }} />
                              <input type="text" placeholder="Label (optional)" value={newDateLabel} onChange={e => setNewDateLabel(e.target.value)}
                                style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 12, width: 120 }} />
                              <input type="url" placeholder="WhatsApp group link (optional)" value={newDateUrl} onChange={e => setNewDateUrl(e.target.value)}
                                style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 12, flex: 1, minWidth: 160 }} />
                              <button type="button" disabled={savingDate} onClick={() => managerAddDate(slug)}
                                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', fontWeight: 700, fontSize: 12, cursor: savingDate ? 'wait' : 'pointer' }}>
                                {savingDate ? 'Adding…' : 'Add'}
                              </button>
                              <button type="button" onClick={() => { setAddingDateSlug(null); setNewDateValue(''); setNewDateLabel(''); setNewDateUrl(''); }}
                                style={{ padding: '6px 8px', borderRadius: 8, border: 'none', background: 'none', color: '#888', fontSize: 12, cursor: 'pointer' }}>
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => setAddingDateSlug(slug)}
                              style={{ alignSelf: 'flex-start', padding: '6px 12px', borderRadius: 99, border: '1.5px dashed #bbb', background: '#fff', color: '#888', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                              + Add date
                            </button>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>
                          New dates copy this event's booking timeline automatically, shifted to the new date. To rename or remove a date, ask a founder.
                        </div>
                      </div>

                      {/* The full event editor, read-only for reference. */}
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                          Event setup — view only (founders edit this)
                        </div>
                        <div style={{ opacity: 0.55, pointerEvents: 'none', userSelect: 'none' }} aria-disabled="true">
                          <TripForm trip={t} onChange={() => {}} onSave={() => {}} onCancel={() => {}} saving={false} s={s} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          );
        })()}

        {!loading && tab === 'trips' && adminRole === 'admin' && (
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
                                isOpenEvent={editingTrip.booking_url === 'payu-hosted'}
                                marketers={marketers.filter(m => m.active)}
                                selectedIds={eventMarketersMap[trip.slug] ?? []}
                                onChange={ids => setEventMarketers(trip.slug, ids)}
                                commission={editingTrip.marketer_commission ?? null}
                                onSaveCommission={val => setEventCommission(trip.slug, val)}
                                onReshuffle={() => reshuffleEventMarketers(trip.slug!)}
                                reshuffling={reshufflingSlug === trip.slug}
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
              ['faqs', 'Doubt answers'],
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
              {/* No page title — the Media pill above names this page. The
                  spacer keeps the city filter right-aligned. */}
              <div style={{ flex: 1 }} />
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
              {/* No page title — the Timelines pill above names this page. */}
              <div style={{ flex: 1 }} />
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
                      const activeDateRow = sortedDates.find(d => d.start_date === selectedDate);
                      const perDateSteps = (activeDateRow as any)?.booking_steps as Array<{ label: string; value: string; date: string }> | undefined;
                      const isNativeApp = trip.booking_url === 'native-application';
                      const isOpenApp = trip.booking_url === 'payu-hosted';
                      // Every question about this timeline's SHAPE — which rows exist,
                      // which of them carry a date, what the fixed pills say — is
                      // answered by ./bookingTimeline, the same module the two customer
                      // timelines ask. That is what stops the editor from offering a
                      // date picker on a row the guest never sees a date on.
                      const model = tripTimelineModel(trip);
                      // Both invite (native) and open events use a FIXED-row timeline
                      // (no free-form add/remove). Open drops the invite "vibe check"
                      // application step (they pay immediately): split = 4 rows, single = 3.
                      const isFixedTimeline = isFixedTimelineModel(model);
                      const isFullPay = model.fullPay;
                      const saveTimelineForDate = isFixedTimeline && !!selectedDate;
                      const editKey = saveTimelineForDate ? `${trip.id}:${selectedDate}` : trip.id!;
                      const modelDefaultSteps = defaultBookingSteps(model, trip.title ?? '') as Array<{ label: string; value: string; date: string }>;
                      // Auto-heal: only reuse stored steps if they still describe this
                      // event (an open event must not keep an invite event's application
                      // row, a split one needs a balance row, pay-at-venue needs the
                      // group-chat row). Steps left over from a mode switch or a copied
                      // event fall back to the model's own table.
                      const defaultSteps = stepsMatchModel(trip.booking_steps, model) ? trip.booking_steps! : modelDefaultSteps;
                      const healedPerDateSteps = stepsMatchModel(perDateSteps, model) ? perDateSteps : undefined;
                      const rawStepsAll: Array<{ label: string; value: string; date: string }> =
                        timelineEdits[editKey] ?? (saveTimelineForDate ? (healedPerDateSteps ?? defaultSteps) : defaultSteps);
                      // Single-payment events drop the remaining-balance step in the editor too,
                      // so it matches the customer timeline and won't re-save a stale balance row.
                      const rawSteps = isFullPay
                        ? rawStepsAll.filter(s => !/balance/i.test(`${s.label} ${s.value}`))
                        : rawStepsAll;
                      // Fixed timelines show exactly the rows their model defines —
                      // invite full=4/split=5, open full=3/split=4 — padding anything
                      // missing from that model's own table rather than a hand-kept copy.
                      const fixedRowCount = modelDefaultSteps.length;
                      const currentSteps: Array<{ label: string; value: string; date: string }> = isFixedTimeline
                        ? Array.from({ length: fixedRowCount }, (_, i) => rawSteps[i] ?? modelDefaultSteps[i])
                        : rawSteps;
                      // Open single-payment events always have two editable booking steps
                      // (pay now + meeting details). Their third stored row is the event-date
                      // card and is rendered automatically, not something an admin configures.
                      const isOpenSingleTimeline = isOpenApp && isFullPay;
                      const editableSteps = isOpenSingleTimeline ? currentSteps.slice(0, 2) : currentSteps;
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
                                  {editableSteps.length} steps{isOpenSingleTimeline ? ' + event date card' : ''}{selectedDate ? ` · ${new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
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
                                    // Strip every date the customer will never see — the
                                    // pay-at-venue balance row, the group-chat row, an invite
                                    // event's payment row. They were editable for a long time,
                                    // so real values are sitting in the database; leaving them
                                    // there lets something that matches by wording (the "pay
                                    // by …" and "details by …" WhatsApp parameters both do)
                                    // pick up a date that no screen ever showed.
                                    const stepsToSave = stripDeadStepDates(currentSteps, model) as Array<{ label: string; value: string; date: string }>;
                                    saveTimeline(trip, stepsToSave, saveTimelineForDate ? selectedDate : undefined, ctaEdits[trip.id!]);
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
                          {editableSteps.map((step, i) => {
                            const isNowRow = i === 0;
                            // THE contract with the customer timeline: ask the shared module
                            // what pill this row gets, and only offer a date input when the
                            // answer is 'date'. Every other pill means the guest never sees a
                            // date here, so an input would invite the admin to type one that
                            // silently does nothing — which is exactly what the group-chat row
                            // and every invite event's payment row used to do.
                            const badge = stepBadge(step, i, model);
                            // The last row of a fixed timeline is the gold event-date card, and
                            // its date is the event date itself — picked with the dropdown, not
                            // typed. Keyed on POSITION, not on the {application_count} marker:
                            // the label is a live text input, so a marker-based test would swap
                            // the date dropdown for a date picker mid-keystroke while the admin
                            // is rewriting that row's wording.
                            const isEventDateRow = isFixedTimeline && !isOpenSingleTimeline && i === currentSteps.length - 1;
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
                                    placeholder={modelDefaultSteps[i]?.value || 'Value or text'}
                                    value={step.value}
                                    onChange={e => setStep(i, { value: e.target.value })}
                                  />
                                </div>
                                {/* Right: date or fixed pill */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                  {isEventDateRow
                                    // Gold dropdown: the event date, and the switch that
                                    // chooses WHICH date's timeline is being edited.
                                    ? <select
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
                                    : badge === 'now'
                                    // Same iOS-green as the live timelines' "Now" pill (#34C759 @ 10%/30%).
                                    ? <span style={{ fontSize: 11, fontWeight: 700, color: '#34C759', background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.3)', borderRadius: 99, padding: '4px 10px', whiteSpace: 'nowrap' }}>{BADGE_LABEL.now}</span>
                                    : badge === 'after-invitation'
                                    // The guest cannot pay before an invitation arrives, so this
                                    // row has no deadline — the live timeline shows this exact pill.
                                    ? <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 99, padding: '4px 10px', whiteSpace: 'nowrap' }}>{BADGE_LABEL['after-invitation']}</span>
                                    : badge === 'after-advance'
                                    // The group chat opens the moment the advance lands. A date
                                    // typed here was never shown to anyone, and worse, the
                                    // "you'll get details by …" WhatsApp parameter matches on
                                    // "you'll receive" — which this row also says.
                                    ? <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 99, padding: '4px 10px', whiteSpace: 'nowrap' }}>{BADGE_LABEL['after-advance']}</span>
                                    : badge === 'at-venue'
                                    // Pay-at-venue collects the balance at the door. This date is
                                    // what pickBalanceDueStep feeds into the "pay by …" parameter
                                    // of the advance WhatsApp, so a stale value would tell the
                                    // guest to pay before the event.
                                    // Grey, exactly like the live /plans and /invite timelines —
                                    // "At the Venue" is a plain status pill there, not a coloured one.
                                    ? <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 99, padding: '4px 10px', whiteSpace: 'nowrap' }}>{BADGE_LABEL['at-venue']}</span>
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

                          {isOpenSingleTimeline && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff9d6', border: '1px solid #FFD700', borderRadius: 10, marginBottom: 6 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#8a7a24', marginBottom: 3 }}>X ppl have already joined</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{trip.title}</div>
                              </div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#111', whiteSpace: 'nowrap' }}>
                                {selectedDate ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
                              </div>
                            </div>
                          )}

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
              {/* No page title — the Doubt answers pill above names this page.
                  The pill was "FAQs" while this heading said "Automatic Doubt
                  Answers"; the page keeps the clearer of the two names. */}
              <div style={{ flex: 1 }} />
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
          const normalizePhone10 = (phone: any) => String(phone ?? '').replace(/\D/g, '').slice(-10);
          const titleBySlug: Record<string, string> = {};
          trips.forEach(t => { if (t.slug && t.title) titleBySlug[t.slug] = t.title; });
          // doubt_submissions (booking "Other topic" form) never attach to an
          // application the way plan_doubts do — but the commission trigger's
          // open_lead_was_worked() counts BOTH kinds. Index them by phone+slug
          // so the Self-serve tag can never disagree with the fee actually paid.
          // Prefer event_id (it carries the slug) and fall back to the title,
          // trimmed on both sides because event titles carry stray whitespace.
          const slugByTitle = new Map<string, string>();
          Object.entries(titleBySlug).forEach(([slug, title]) => slugByTitle.set(title.trim().toLowerCase(), slug));
          const doubtSubmissionKeys = new Set(
            (planDoubts ?? []).map((d: any) => {
              const slug = String(d.event_id ?? '').trim()
                || slugByTitle.get(String(d.event_title ?? '').trim().toLowerCase())
                || '';
              return `${normalizePhone10(d.phone)}__${slug}`;
            })
          );
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
            const phone10 = normalizePhone10(phone);
            const matches = payuPayments.filter(p =>
              normalizePhone10(p.phone) === phone10
              && (
                p.event_slug === eventSlug
                || (!p.event_slug && (!title || p.event_title === title || !p.event_title))
              )
            );
            return { all: matches };
          };
          const hasFailedPayment = (a: any): boolean => {
            const pays = paymentsFor(a.phone, a.event_slug).all;
            return pays.some((p: any) => p.status === 'failure')
              && !pays.some((p: any) => p.status === 'success');
          };

          // Apply filters
          const searchLower = peopleSearch.trim().toLowerCase();
          // "Cart Abandoned" and "Re-Target" are derived display states for
          // invited applicants. cart_abandoned = bill opened, never paid.
          // re_target = AiSensy invite >= 24h ago, bill never opened (i.e.
          // either delivery failed or they ignored it). Email-open signals are
          // shown as muted sub-labels under the main lifecycle state.
          // status itself stays 'invited' (so payment + invite-flow auth
          // keep working); we only surface it differently in this admin view.
          const displayStatus = (a: any): string => {
            // Open-event leads sit at 'pending' until they pay. Surface that as
            // "in progress", or "cart abandoned" once the bill was opened and
            // never completed (the cart-abandonment cron sets the flag).
            if (openEventSlugs.has(a.event_slug) && a.status === 'pending') {
              if (hasFailedPayment(a)) return 'payment_failed';
              return a.cart_abandoned ? 'cart_abandoned' : 'in_progress';
            }
            if (a.status !== 'invited') return a.status;
            if (a.cart_abandoned) return 'cart_abandoned';
            if (a.re_target) return 're_target';
            return a.status;
          };
          // Effective lead scope. Dual-role (marketer AND manager) users get a
          // My Leads / Team Leads switch; pure managers are always 'team',
          // everyone else 'mine' (their RLS already scopes the data).
          const isDualRole = !!currentManager && !!currentMarketer;
          const effScope: 'mine' | 'team' = currentManager ? (isDualRole ? peopleScope : 'team') : 'mine';
          // 'mine' = leads assigned to them as a marketer (any event);
          // 'team' = every lead on their managed events. Only dual-role users
          // need the client-side split — RLS hands them the union of both.
          const scopeMatch = (a: any): boolean => {
            if (!isDualRole) return true;
            return effScope === 'mine'
              ? a.assigned_marketer_id === currentMarketer!.id
              : managerAssignedSlugs.includes(a.event_slug);
          };
          const scopedApplications = applications.filter(scopeMatch);
          const filteredApps = scopedApplications.filter(a => {
            const pays = paymentsFor(a.phone, a.event_slug);
            const eventMatch  = applicationsEventFilter  === 'all' || a.event_slug === applicationsEventFilter;
            const dateMatch   = applicationsDateFilter   === 'all' || a.selected_date === applicationsDateFilter;
            const statusMatch = applicationsStatusFilter === 'all'
              || (applicationsStatusFilter === 'has_doubt' ? (a.doubts?.length ?? 0) > 0
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
          // Newest lead first, full stop — the order the rows arrive in from
          // loadApplications (created_at descending). There used to be a
          // "needs a human" float here that lifted unanswered doubts, cart
          // abandons and failed payments to the top, but neither signal is
          // ever cleared (no doubt is ever marked answered, and cart_abandoned
          // sticks for life), so the float turned into a permanent archive:
          // on 2026-08-09 it buried a lead created that morning under 21 older
          // rows, the oldest from 10 June. Callers who want that cohort can
          // pick it from the status filter chips instead, which is a choice
          // rather than a default nobody can turn off.
          // ── "Paid · past dates" fold (owner request 2026-08-02) ─────────────
          // Fully-paid people whose event date has already passed are done, so
          // they get collapsed under a dropdown at the bottom of the list —
          // keeping the main list the current/upcoming cohort the callers still
          // need to work, instead of mixing past attendees with fresh leads.
          // Only folds when the view is broad: skipped in Payments mode, and
          // whenever a specific date or a paid status is explicitly filtered
          // (there the user is deliberately looking at those very people).
          const todayDateKey = dateKeyInTimeZone(new Date(), 'Asia/Kolkata');
          const paidEventDateKey = (a: any): number | null => {
            // selected_date is the current cohort and intentionally wins: when
            // the founder postpones a date, the bulk repoint moves paid people
            // with it. PayU remains an immutable fallback for legacy/missing
            // application dates, not an override for a deliberate postponement.
            const applicationDateKey = isoDateKey(a.selected_date);
            if (applicationDateKey !== null) return applicationDateKey;
            const successfulPayments = paymentsFor(a.phone, a.event_slug).all
              .filter((payment: PayuPayment) => payment.status === 'success')
              .sort((left: PayuPayment, right: PayuPayment) =>
                String(left.created_at ?? '').localeCompare(String(right.created_at ?? ''))
              );
            for (const payment of successfulPayments) {
              const paymentDateKey = payuTripDateKey(payment);
              if (paymentDateKey !== null) return paymentDateKey;
            }
            return null;
          };
          const isPastPaid = (a: any) => {
            if (a.status !== 'fully_paid' || todayDateKey === null) return false;
            const eventDateKey = paidEventDateKey(a);
            return eventDateKey !== null && eventDateKey < todayDateKey;
          };
          const collapseActive = peopleMode !== 'payments'
            && applicationsDateFilter === 'all'
            && applicationsStatusFilter !== 'fully_paid'
            && applicationsStatusFilter !== 'advance_paid';
          const pastPaidApps = collapseActive ? filteredApps.filter(isPastPaid) : [];
          const activeApps   = collapseActive ? filteredApps.filter(a => !isPastPaid(a)) : filteredApps;
          // The rows the table actually renders: active leads, then (if any past
          // paid) a divider toggle, then the past-paid rows only when expanded.
          const rowItems: any[] = collapseActive
            ? [
                ...(activeApps.length ? activeApps : (pastPaidApps.length ? [{ __emptyActive: true }] : [])),
                ...(pastPaidApps.length ? [{ __divider: true }] : []),
                ...(pastPaidExpanded ? pastPaidApps : []),
              ]
            : filteredApps;

          // A WhatsApp conversation belongs to a PERSON, but this table is one row
          // per booking — so someone with two bookings would otherwise see the same
          // thread printed twice, with two reply boxes that do the same thing.
          // Render the thread on their topmost row only; the badge still marks the
          // rest, so nothing is hidden, it just is not said twice.
          const waThreadRowByPhone = new Map<string, string>();
          rowItems.forEach((r: any) => {
            if (!r?.id || !r?.phone) return;
            const p = String(r.phone).replace(/\D/g, '').slice(-10);
            if (!p || waThreadRowByPhone.has(p)) return;
            waThreadRowByPhone.set(p, r.id);
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
          // A doubt is "handled" once that person has been INVITED (or beyond)
          // for the same event. Note: a still-`pending` application does NOT
          // count as handled — that person applied but was never invited, so
          // the Approve button must stay available to invite them straight from
          // the doubt tab. Derived from the applications list, so it's accurate.
          const last10 = (p: any) => String(p ?? '').replace(/\D/g, '').slice(-10);
          const appliedStatusByKey = new Map<string, string>(
            applications.map(a => [`${last10(a.phone)}__${String(a.event_slug ?? '').toLowerCase()}`, a.status])
          );
          // Status of the application behind a doubt (null = never applied).
          // Slug resolution mirrors approveDoubtSubmission / getDoubtSubmissionPlanName:
          // prefer the stable event_id so a plan rename can't break the match.
          const doubtAppStatus = (submission: any): string | null => {
            const phone10 = last10(submission.phone);
            if (!phone10) return null;
            const id = String(submission.event_id ?? '').trim();
            const raw = (submission.event_title || submission.event_slug || '').trim();
            const trip = trips.find(t =>
              (id && (t.id === id || t.slug === id || t.invite_slug === id))
              || t.title === raw || t.slug === raw || t.invite_slug === raw
            );
            const slug = String(trip?.slug ?? submission.event_id ?? submission.event_slug ?? '').toLowerCase();
            if (!slug) return null;
            return appliedStatusByKey.get(`${phone10}__${slug}`) ?? null;
          };
          const doubtHasApplied = (submission: any): boolean => {
            const st = doubtAppStatus(submission);
            const id = String(submission.event_id ?? '').trim();
            const raw = (submission.event_title || submission.event_slug || '').trim();
            const trip = trips.find(t =>
              (id && (t.id === id || t.slug === id || t.invite_slug === id))
              || t.title === raw || t.slug === raw || t.invite_slug === raw
            );
            if (trip?.booking_url === 'payu-hosted') {
              // Open details have their own delivery marker. Application state
              // alone is insufficient: a person may already be pending because
              // they started checkout, while their newly asked doubt still
              // needs the Send Details action. Paid users need no further send.
              return !!submission.open_details_sent_at
                || st === 'advance_paid'
                || st === 'fully_paid';
            }
            return st !== null && st !== 'pending';
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
            // Dual-role scope: 'mine' = doubts assigned to them as marketer;
            // 'team' = doubts resolving to a managed event (same trip lookup
            // as doubtAppStatus — event_title/event_id, not a slug column).
            const scopeOk = !isDualRole ? true
              : effScope === 'mine'
                ? submission.assigned_marketer_id === currentMarketer!.id
                : (() => {
                    const id = String(submission.event_id ?? '').trim();
                    const raw = (submission.event_title || submission.event_slug || '').trim();
                    const trip = trips.find(t =>
                      (id && (t.id === id || t.slug === id || t.invite_slug === id))
                      || t.title === raw || t.slug === raw || t.invite_slug === raw
                    );
                    return !!trip?.slug && managerAssignedSlugs.includes(trip.slug);
                  })();
            return planMatch && cityMatch && marketerMatch && scopeOk;
          // Open doubts (not yet applied) surface above handled ones.
          }).sort((a, b) => Number(doubtHasApplied(a)) - Number(doubtHasApplied(b)));

          const statusColor = (status: string) => {
            if (status === 'fully_paid')   return '#16a34a';
            if (status === 'advance_paid') return '#84cc16';
            if (status === 'invited')        return '#2196f3';
            if (status === 'cart_abandoned') return '#b45309';
            if (status === 'payment_failed') return '#dc2626';
            if (status === 're_target')      return '#7c3aed';
            if (status === 'waitlist')       return '#a855f7';
            if (status === 'in_progress')    return '#0891b2';
            if (status === 'pending')        return '#f97316';
            if (status === 'rejected')       return '#dc2626';
            return '#999';
          };

          // An open-event ticket that closed with nothing in the way pays the
          // marketer half the event fee — the care fee. Mirrors the DB's
          // open_lead_was_worked(): a doubt of either kind, a cart abandonment,
          // or a failed payment all mean the full fee instead. Only fully-paid
          // rows qualify, because that is the moment the fee is actually accrued.
          const isSelfServeTicket = (a: any) =>
            a.status === 'fully_paid'
            && openEventSlugs.has(a.event_slug)
            && !a.cart_abandoned
            && (a.doubts?.length ?? 0) === 0
            && !doubtSubmissionKeys.has(`${normalizePhone10(a.phone)}__${a.event_slug}`)
            && !paymentsFor(a.phone, a.event_slug).all.some((payment: PayuPayment) => payment.status === 'failure');

          // Outcome glyphs that sit inline with the status chip: they qualify
          // how the ticket closed, so they belong with the status rather than
          // in the secondary stack below it. Icon-only — each carries its own
          // accessible name and hover tooltip in place of a text label.
          const statusIcons = (a: any) => {
            const recovered = !!a.recovered_at;
            const selfServe = isSelfServeTicket(a);
            if (!recovered && !selfServe) return null;
            // Rendered INSIDE the status chip, so the glyphs inherit the chip's
            // own colour via currentColor and stay muted through opacity — a
            // fixed grey would go muddy on the tinted pill backgrounds. The
            // chips are inline-flex, which optically centres these against the
            // label instead of sitting them on the text baseline.
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
                    <title>Self-serve — booked with no help, marketer earns the half fee</title>
                    <path d="M9.4 1 3.4 8.2h3.7l-.9 4.8 6-7.2H8.5L9.4 1z" fill="currentColor" />
                  </svg>
                )}
              </span>
            );
          };

          // Secondary signals shown below the main lifecycle chip. They do not
          // replace the status or create separate status filters.
          const secondaryStatusLabels = (a: any) => {
            const state = displayStatus(a);
            const mailLabel = a.cart_abandoned && a.cart_abandon_email_opened_at
              ? 'Recovery Mail'
              : !a.cart_abandoned && (state === 'invited' || state === 're_target') && a.email_opened_at
              ? 'Mail'
              : null;
            const unsubscribedLabel = a.email_unsubscribed_at ? 'Unsubscribed' : null;
            const detailsLabel = a.resend_details_link_clicked_at || a.resend_details_email_sent_at ? 'Details' : null;
            if (!mailLabel && !detailsLabel && !unsubscribedLabel) return null;
            const labels = [mailLabel, detailsLabel, unsubscribedLabel].filter(Boolean);
            return (
            <div style={{ marginTop: 5, fontSize: 10, color: '#999', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {labels.map(label => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {label === mailLabel || (label === detailsLabel && a.resend_details_link_clicked_at) ? (
                    <svg width="15" height="10" viewBox="0 0 17 12" aria-hidden="true" style={{ display: 'block', flexShrink: 0, color: '#34b7f1' }}>
                      <path d="M1.5 6.6 4 9.1 9.2 3.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M1.5 6.6 4 9.1 9.2 3.2" transform="translate(5 0)" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : label === detailsLabel ? (
                    <svg width="15" height="10" viewBox="0 0 17 12" aria-hidden="true" style={{ display: 'block', flexShrink: 0, color: '#999' }}>
                      <path d="M4 6.6 6.5 9.1 11.7 3.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <span style={{ width: 15, color: '#aaa', display: 'inline-flex', justifyContent: 'center', flexShrink: 0 }}>-</span>
                  )}
                  <span>{label}</span>
                </div>
              ))}
            </div>
            );
          };

          const resendDetailsButton = (a: any) => {
            const bothDetailsChannelsSent = !!a.resend_details_email_sent_at && !!a.resend_details_whatsapp_sent_at;
            if (displayStatus(a) !== 're_target' || !String(a.email ?? '').trim() || bothDetailsChannelsSent) return null;
            const busy = resendingDetailsId === a.id;
            const hasUserStatus = !!String(callNotesEdits[a.id] ?? a.call_notes ?? '').trim();
            return (
              <button
                type="button"
                disabled={busy}
                onClick={() => resendInviteDetails(a.id)}
                style={{
                  marginTop: 5,
                  background: '#fff',
                  color: '#777',
                  border: '1px solid #e5e5e5',
                  borderRadius: 999,
                  padding: '2px 7px',
                  fontSize: 10,
	                  fontWeight: 600,
	                  cursor: busy ? 'not-allowed' : 'pointer',
	                  opacity: busy ? 0.6 : hasUserStatus ? 1 : 0.45,
	                  whiteSpace: 'nowrap',
                }}
              >
                {busy ? 'Sending...' : 'Resend Details'}
              </button>
            );
          };

          const statusLabel = (st: string) =>
            st.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

          const callStatusOptions = [
            { value: 'not_called',     label: 'Not Called' },
            { value: 'called',         label: 'Called' },
            { value: 'callback',       label: 'Callback' },
            { value: 'has_doubts',     label: 'Has Doubts' },
            { value: 'not_interested', label: 'Not Interested' },
            { value: 'no_answer',      label: 'No Answer' },
          ];
          const userStatusOptions = [
            "Didn't Get Invite",
            'Saw Invite, But Forgot',
            'Needed Date/Time/Location Clarity',
            'Needed Price/Payment Clarity',
            'Had Safety/Trust Doubts',
            'Wanted Friend Confirmation',
            'Website/Payment Issue',
            'Not Interested',
            'Test',
            'Other',
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
                      'User Status', 'Why Join', 'Marketer', 'Applied At', 'Transaction IDs', 'Amount Paid'];
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
                  statusLabel(displayStatus(app)), callLabel(callSt), callNt, app.why_join ?? '',
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
            payment_failed: filteredApps.filter(a => displayStatus(a) === 'payment_failed').length,
            re_target:      filteredApps.filter(a => displayStatus(a) === 're_target').length,
            waitlist:       filteredApps.filter(a => a.status === 'waitlist').length,
            advance_paid: filteredApps.filter(a => a.status === 'advance_paid').length,
            fully_paid:   filteredApps.filter(a => a.status === 'fully_paid').length,
          };

          // Header columns per mode
	          const headers: Record<typeof peopleMode, string[]> =
	            peopleMode === 'call'
              ? { call: ['Name', 'Phone', 'Event', 'User Status', 'Date', 'Action'], approval: [], payments: [], doubts: [] }
              : peopleMode === 'approval'
              ? { call: [], approval: ['Plan Name', 'Why Join', 'Action'], payments: [], doubts: [] }
              : peopleMode === 'payments'
              ? { call: [], approval: [], payments: ['Name', 'Plan', 'Status', 'Transaction IDs'], doubts: [] }
              : { call: [], approval: [], payments: [], doubts: ['Name / Doubt', 'Plan', 'City', 'Reporting Date', 'Phone', 'Reply'] };

          return (
            <div>
              {/* Always-on training shortcut for the marketer hat. Enrolled
                  marketers revisit an unlocked, read-only lesson map. */}
              {currentMarketer && effScope === 'mine' && (
                <a href="/team?revisit=1" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e8d36c', background: 'linear-gradient(135deg,#fffbea,#fff)', color: '#111', textDecoration: 'none' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 11, background: '#111', color: '#FFD700', display: 'grid', placeItems: 'center', fontSize: 19, fontWeight: 850, flex: '0 0 auto' }}>அ</span>
                  <span style={{ flex: 1, minWidth: 0 }}><strong style={{ display: 'block', fontSize: 13.5 }}>Training &amp; status field guide</strong><span style={{ display: 'block', color: '#777', fontSize: 11.5, marginTop: 2 }}>Revisit any lesson without changing your live account.</span></span>
                  <span aria-hidden="true" style={{ fontSize: 18 }}>›</span>
                </a>
              )}

              {/* Commission banner — pure marketer accounts only. Managers do
                  not need marketer earnings or team-ranking cards here, even
                  when their login also has a marketer side-car. */}
              {currentMarketer && !currentManager && myCommissionStats && effScope === 'mine' && (() => {
                const myApps = applications;
                const fullyPaid   = myApps.filter(a => a.status === 'fully_paid').length;
                const advanceOnly = myApps.filter(a => a.status === 'advance_paid').length;
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
                    <Tile label="Earned this month" value={inr(myCommissionStats.total)} accent />
                  </div>
                  <div style={{ fontSize: 11, color: '#999', paddingLeft: 2 }}>
                    Actual accrued fees from fully-paid tickets this month. Open-event sales pay the event&apos;s full fee when they needed help, otherwise half.
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

              {/* Assigned events + per-date spots left — marketer & manager views.
                  Reserved totals come from the SECURITY DEFINER RPC, so they
                  reflect ALL bookings. Dual-role accounts always see the union
                  of both hats here, independent of the active lead scope. */}
              {(currentMarketer || currentManager) && (() => {
                const marketerSlugs = new Set(marketerAssignedSlugs);
                const managerSlugs = new Set(managerAssignedSlugs);
                const assignedSlugs = new Set([...marketerAssignedSlugs, ...managerAssignedSlugs]);
                const assigned = trips.filter(t =>
                  t.is_active &&
                  assignedSlugs.has(t.slug ?? '') &&
                  (t.event_dates ?? []).some(d => d.start_date && !isElapsedDate(d.start_date))
                );
                if (assigned.length === 0) return null;
                return (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, color: '#999', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Your Events — Spots Left</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {assigned.map(t => {
                        const slug = t.slug ?? '';
                        const isMarketerEvent = marketerSlugs.has(slug);
                        const isManagerEvent = managerSlugs.has(slug);
                        const roleLabel = [isMarketerEvent ? 'Marketer' : '', isManagerEvent ? 'Manager' : ''].filter(Boolean).join(' · ');
                        const capacity = (t.total_capacity ?? t.invite_spots) ?? null;
                        const dateCounts = managerEventDateCounts[slug] ?? marketerEventDateCounts[slug] ?? {};
                        const dates = (t.event_dates ?? [])
                          .filter(d => d.start_date && !isElapsedDate(d.start_date))
                          .slice()
                          .sort((a, b) => a.start_date.localeCompare(b.start_date));
                        return (
                          <div key={t.id ?? t.slug}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 3 }}>
                              <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{t.title}</span>
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#aaa' }}>{roleLabel}</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 16px', fontSize: 13 }}>
                              {dates.map(d => {
                                const reserved = dateCounts[d.start_date]?.reserved ?? 0;
                                const spotsLeft = capacity != null ? Math.max(0, capacity - reserved) : null;
                                const soldOut = isDateSoldOut({ status: d.status, date: d.start_date, capacity, reserved });
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

              {/* Dual-role mode switch — manager hat vs marketer hat. Every
                  People sub-mode below respects the selected role scope. */}
              {isDualRole && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ marginBottom: 6, fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 }}>Mode</div>
                  <div role="radiogroup" aria-label="People role mode" style={{ display: 'inline-flex', gap: 3, padding: 4, background: '#f3f3f3', border: '1px solid #e5e5e5', borderRadius: 10 }}>
                    {([
                      { scope: 'team' as const, label: 'Manager' },
                      { scope: 'mine' as const, label: 'Marketer' },
                    ]).map(({ scope, label }) => {
                      const selected = peopleScope === scope;
                      return (
                        <label key={scope} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 7, background: selected ? '#fff' : 'transparent', color: selected ? '#111' : '#777', boxShadow: selected ? '0 1px 3px rgba(0,0,0,0.12)' : 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                          <input
                            type="radio"
                            name="people-role-mode"
                            value={scope}
                            checked={selected}
                            onChange={() => setPeopleScope(scope)}
                            style={{ width: 14, height: 14, margin: 0, accentColor: '#111', cursor: 'pointer' }}
                          />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, fontSize: 22 }}>{effScope === 'team' ? 'Event Leads' : currentMarketer ? 'My Leads' : 'People'}</div>
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
                  <option value="payment_failed">Payment Failed</option>
                  <option value="re_target">Re-Target</option>
                  <option value="waitlist">Waitlist</option>
                  <option value="advance_paid">Advance Paid</option>
                  <option value="fully_paid">Fully Paid</option>
                  <option value="has_doubt">Raised Doubt</option>
                </select>
                {/* Marketer filter — admins + managers in Team scope (a manager
                    sees every marketer's leads on their events; in My Leads
                    scope or for plain marketers it would be pointless). */}
                {(adminRole === 'admin' || (!!currentManager && effScope === 'team')) && (
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
                {/* Marketer filter — admins + managers in Team scope, mirrors the Call tab. */}
                {(adminRole === 'admin' || (!!currentManager && effScope === 'team')) && (
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
                currentMarketer && effScope === 'mine' && scopedApplications.length === 0 && peopleMode === 'call' ? (
                  <div style={{ ...s.card, padding: 20, border: '1.5px solid #e8d36c', background: '#fffdf4' }}>
                    <div style={{ fontSize: 18, fontWeight: 750, color: '#111' }}>You&apos;re in! You&apos;ll start receiving leads when you&apos;re added to an event.</div>
                    <p style={{ margin: '7px 0 15px', color: '#666', fontSize: 13, lineHeight: 1.55 }}>An empty dashboard is normal — it means you&apos;re on the roster, ready to be staffed. We&apos;ll message you on WhatsApp when your first event comes up.</p>
                    <div style={{ border: '1px solid #ececed', borderRadius: 12, background: '#fff', padding: 13, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: 10 }}><div><div style={{ color: '#999', fontSize: 9.5, fontWeight: 750, letterSpacing: .7, textTransform: 'uppercase' }}>Example lead</div><div style={{ marginTop: 3, color: '#111', fontWeight: 700 }}>Aarav · Chill Sunday Meetup</div></div><span style={{ borderRadius: 999, background: '#f4f4f5', border: '1px solid #e4e4e7', color: '#52525b', padding: '3px 8px', fontSize: 10, fontWeight: 750 }}>Pending</span></div>
                      <div style={{ marginTop: 9, color: '#777', fontSize: 11.5 }}>Applied, waiting for your call and approval.</div>
                    </div>
                    <a href="/team?revisit=1" style={{ display: 'inline-block', marginTop: 14, color: '#111', fontSize: 12.5, fontWeight: 700, textDecoration: 'underline' }}>Review training and the status guide →</a>
                  </div>
                ) : <div style={{ ...s.card, color: '#888', textAlign: 'center' }}>No people match the current filters.</div>
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
                    const submissionId = String(submission.event_id ?? '').trim();
                    const submissionRaw = (submission.event_title || submission.event_slug || '').trim();
                    const submissionTrip = trips.find(t =>
                      (submissionId && (t.id === submissionId || t.slug === submissionId || t.invite_slug === submissionId))
                      || t.title === submissionRaw || t.slug === submissionRaw || t.invite_slug === submissionRaw
                    );
                    const isOpenEventDoubt = submissionTrip?.booking_url === 'payu-hosted';

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
                            {/* Admins + managers: which marketer owns this doubt. */}
                            {(adminRole === 'admin' || !!currentManager) && submission.assigned_marketer_id && marketerNameById[submission.assigned_marketer_id] && (
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#555', background: '#f3f3f3', borderRadius: 999, padding: '2px 9px' }}>
                                👤 {marketerNameById[submission.assigned_marketer_id]}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            {applied && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 999, padding: '3px 9px' }}>
                                {isOpenEventDoubt ? '✓ Details Sent' : '✓ Invited'}
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
                                  const actionCopy = isOpenEventDoubt
                                    ? `Send ${eventName} details to ${submitterName}?\n\nThis keeps them as an open-event lead (In Progress) and sends the booking details.`
                                    : `Approve ${submitterName} and send the invite for ${eventName}?\n\nThis creates an application (status: invited) and sends the WhatsApp invite.`;
                                  if (window.confirm(actionCopy)) {
                                    approveDoubtSubmission(submission);
                                  }
                                }}
                                disabled={approvingDoubtId === submission.id}
                                style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: approvingDoubtId === submission.id ? 'not-allowed' : 'pointer', opacity: approvingDoubtId === submission.id ? 0.6 : 1 }}
                              >
                                {approvingDoubtId === submission.id ? 'Sending…' : (isOpenEventDoubt ? 'Send Details' : '✓ Approve')}
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
                      {rowItems.map((app: any) => {
                        // Divider toggle for the collapsed "Paid · past dates" fold.
                        if (app.__divider) return (
                          <tr key="__pastpaid_divider" style={{ background: '#fafafa', borderTop: '1px solid #ececec' }}>
                            <td colSpan={headers[peopleMode].length} style={{ padding: 0 }}>
                              <button
                                type="button"
                                onClick={() => setPastPaidExpanded(v => !v)}
                                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#888', display: 'flex', alignItems: 'center', gap: 6 }}
                              >
                                <span style={{ fontSize: 10, color: '#aaa' }}>{pastPaidExpanded ? '▾' : '▸'}</span>
                                Paid · past dates ({pastPaidApps.length})
                                <span style={{ fontWeight: 500, color: '#bbb' }}>— {pastPaidExpanded ? 'hide' : 'show'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                        // Shown when every current lead is cleared but past-paid remain.
                        if (app.__emptyActive) return (
                          <tr key="__emptyActive">
                            <td colSpan={headers[peopleMode].length} style={{ padding: '16px 12px', textAlign: 'center', color: '#aaa', fontSize: 13 }}>
                              No current leads to work — all caught up 🎉
                            </td>
                          </tr>
                        );
                        const callNt  = callNotesEdits[app.id]  ?? app.call_notes  ?? '';
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
                        const waReplies = (app.waReplies ?? []) as any[];
                        const waThreadHere = waReplies.length > 0
                          && waThreadRowByPhone.get(String(app.phone ?? '').replace(/\D/g, '').slice(-10)) === app.id;
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
                          <tr key={app.id} style={{ borderBottom: '1px solid #f0f0f0', verticalAlign: 'top', background: openDoubts.length > 0 ? '#fffbeb' : (waReplies.length > 0 ? '#f0fdf4' : undefined) }}>
                            <td style={{ padding: '11px 12px', maxWidth: 280, minWidth: 200 }} title={app.why_join ? `${app.name || '—'}\n${app.why_join}` : (app.name || '—')}>
                              <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {app.name || '—'}
                                <SeatBadge app={app} />
                                {openDoubts.length > 0 && (
                                  <span title={`${openDoubts.length} unresolved doubt${openDoubts.length === 1 ? '' : 's'}`} style={{ marginLeft: 6, background: '#fde047', color: '#854d0e', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                                    💬 {openDoubts.length}
                                  </span>
                                )}
                                {waReplies.length > 0 && (
                                  <span title={`${waReplies.length} WhatsApp repl${waReplies.length === 1 ? 'y' : 'ies'}`} style={{ marginLeft: 6, background: '#bbf7d0', color: '#166534', borderRadius: 99, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>
                                    ↩ {waReplies.length}
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
                              {(adminRole === 'admin' || !!currentManager) && app.assigned_marketer_id && marketerNameById[app.assigned_marketer_id] && (
                                <div title={marketerNameById[app.assigned_marketer_id]} style={{ marginTop: 5, fontSize: 10, color: '#999', fontWeight: 500 }}>
                                  {marketerNameById[app.assigned_marketer_id].slice(0, 3)}
                                </div>
                              )}
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
	                                      style={{
	                                        appearance: 'none',
	                                        WebkitAppearance: 'none',
	                                        fontSize: 10,
	                                        color: '#444',
	                                        fontWeight: 600,
	                                        backgroundColor: '#f5f5f5',
	                                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%278%27 height=%275%27 viewBox=%270 0 10 6%27%3E%3Cpath fill=%27%23555%27 d=%27M1 0l4 4 4-4 1 1-5 5-5-5z%27/%3E%3C/svg%3E")',
	                                        backgroundRepeat: 'no-repeat',
	                                        backgroundPosition: 'right 6px center',
	                                        backgroundSize: '8px 5px',
	                                        border: 'none',
	                                        borderRadius: 99,
	                                        padding: '2px 20px 2px 8px',
	                                        cursor: savingDateId === app.id ? 'wait' : 'pointer',
	                                        maxWidth: 120,
	                                      }}
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
                              {waThreadHere && (
                                <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {waReplies.slice(0, 3).map((m: any) => (
                                    <div key={m.id} style={{ background: '#dcfce7', borderLeft: '3px solid #22c55e', borderRadius: 4, padding: '5px 8px', fontSize: 12, color: '#14532d', lineHeight: 1.4 }}>
                                      <div style={{ fontSize: 10, color: '#166534', fontWeight: 600, marginBottom: 2 }}>
                                        ↩ replied {formatAdminDateTime(m.sent_at || m.received_at)}
                                      </div>
                                      {/* A tapped button carries no text, and a photo carries no text
                                          either — say which it was rather than render an empty card. */}
                                      {m.body_text
                                        || (m.interactive_reply_id ? `tapped "${m.interactive_reply_id}"` : `sent ${m.msg_type || 'a message'}`)}
                                    </div>
                                  ))}
                                  {waReplies.length > 3 && (
                                    <div style={{ fontSize: 10, color: '#166534', fontWeight: 600 }}>+{waReplies.length - 3} more</div>
                                  )}
                                </div>
                              )}
                              {waThreadHere && (() => {
                                const win = replyWindow[app.id] ?? {};
                                const justSent = replySentFor[app.id];
                                if (justSent) {
                                  return (
                                    <div style={{ background: '#eff6ff', borderLeft: '3px solid #3b82f6', borderRadius: 4, padding: '5px 8px', fontSize: 12, color: '#1e3a8a', lineHeight: 1.4, marginBottom: 6 }}>
                                      <div style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 600, marginBottom: 2 }}>you replied</div>
                                      {justSent}
                                    </div>
                                  );
                                }
                                if (replyOpenFor !== app.id) {
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => openWhatsAppReply(app)}
                                      style={{ marginBottom: 6, background: '#fff', color: '#166534', border: '1px solid #86efac', borderRadius: 999, padding: '2px 9px', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                                    >
                                      Reply on WhatsApp
                                    </button>
                                  );
                                }
                                if (win.checking) {
                                  return <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>Checking if they can be replied to…</div>;
                                }
                                if (win.error) {
                                  return <div style={{ fontSize: 10, color: '#b91c1c', marginBottom: 6 }}>Couldn't check the reply window. Try again.</div>;
                                }
                                if (win.open === false) {
                                  // Meta only allows a free-form message within 24h of THEIR last
                                  // message. Say so rather than offering a box that cannot work.
                                  return (
                                    <div style={{ fontSize: 10, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 4, padding: '5px 7px', marginBottom: 6, lineHeight: 1.45 }}>
                                      Their 24-hour reply window has closed, so WhatsApp won't allow a free-form message. Call them, or message from your own phone.
                                    </div>
                                  );
                                }
                                return (
                                  <div style={{ marginBottom: 6 }}>
                                    <textarea
                                      value={replyText[app.id] ?? ''}
                                      onChange={e => setReplyText(t => ({ ...t, [app.id]: e.target.value }))}
                                      placeholder="Type your reply…"
                                      rows={3}
                                      style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, padding: '6px 7px', border: '1px solid #86efac', borderRadius: 4, resize: 'vertical', fontFamily: 'inherit' }}
                                    />
                                    <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
                                      <button
                                        type="button"
                                        disabled={replySendingId === app.id || !(replyText[app.id] ?? '').trim()}
                                        onClick={() => sendWhatsAppReply(app)}
                                        style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 999, padding: '3px 11px', fontSize: 11, fontWeight: 700, cursor: replySendingId === app.id ? 'not-allowed' : 'pointer', opacity: (replySendingId === app.id || !(replyText[app.id] ?? '').trim()) ? 0.5 : 1 }}
                                      >
                                        {replySendingId === app.id ? 'Sending…' : 'Send'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setReplyOpenFor(null)}
                                        style={{ background: 'none', border: 'none', color: '#888', fontSize: 11, cursor: 'pointer' }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
	                              <select
	                                value={callNt}
			                                onChange={e => updateUserStatus(app.id, e.target.value)}
			                                style={{
				                                  appearance: 'none',
				                                  WebkitAppearance: 'none',
				                                  backgroundColor: '#f5f5f5',
				                                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%276%27 viewBox=%270 0 10 6%27%3E%3Cpath fill=%27%23555%27 d=%27M1 0l4 4 4-4 1 1-5 5-5-5z%27/%3E%3C/svg%3E")',
				                                  backgroundRepeat: 'no-repeat',
				                                  backgroundPosition: 'right 8px center',
					                                  backgroundSize: '10px 6px',
					                                  color: '#555',
					                                  border: 'none',
				                                  borderRadius: 99,
			                                  padding: '4px 24px 4px 8px',
		                                  fontSize: 12,
		                                  width: '100%',
		                                  outline: 'none',
		                                  cursor: 'pointer',
		                                  fontWeight: 600,
		                                }}
	                              >
		                                <option value=""></option>
	                                {callNt && !userStatusOptions.includes(callNt) && <option value={callNt}>{callNt}</option>}
	                                {userStatusOptions.map(option => (
	                                  <option key={option} value={option}>{option}</option>
	                                ))}
	                              </select>
	                              {resendDetailsButton(app)}
                            </td>
                            <td style={{ padding: '11px 12px', color: '#888', whiteSpace: 'nowrap', fontSize: 10, width: 90 }}>{formatAdminDateTime(app.created_at)}</td>
                            <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                              {((app.status === 'pending' || (app.status === 'invited' && app.aisensy_invite_sent === false && !app.invite_sent_at)) && !openEventSlugs.has(app.event_slug)) ? (
                                <button
                                  disabled={approvingId === app.id}
                                  onClick={() => approveApplication(app.id)}
                                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: approvingId === app.id ? 'not-allowed' : 'pointer', opacity: approvingId === app.id ? 0.6 : 1, fontWeight: 600 }}
                                >
                                  {approvingId === app.id ? 'Sending…' : app.status === 'invited' ? 'Resend invite' : '✓ Approve'}
                                </button>
                              ) : (
                                <>
                                  <div>
                                    <span style={{ background: statusColor(displayStatus(app)) + '22', color: statusColor(displayStatus(app)), borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 700, textTransform: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>{statusLabel(displayStatus(app))}{statusIcons(app)}</span>
	                                  </div>
	                                  {secondaryStatusLabels(app)}
	                                </>
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
                              {((app.status === 'pending' || (app.status === 'invited' && app.aisensy_invite_sent === false && !app.invite_sent_at)) && !openEventSlugs.has(app.event_slug)) ? (
                                <button
                                  disabled={approvingId === app.id}
                                  onClick={() => approveApplication(app.id)}
                                  style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: approvingId === app.id ? 'not-allowed' : 'pointer', opacity: approvingId === app.id ? 0.6 : 1, fontWeight: 700 }}
                                >
                                  {approvingId === app.id ? 'Sending…' : app.status === 'invited' ? 'Resend invite' : '✓ Approve'}
                                </button>
                              ) : (
                                <>
                                  <span style={{ fontSize: 12, color: statusColor(displayStatus(app)), fontWeight: 700, textTransform: 'none' }}>
                                    ✓ {statusLabel(displayStatus(app))}{statusIcons(app)}
	                                  </span>
	                                  {secondaryStatusLabels(app)}
	                                </>
                              )}
                            </td>
                          </tr>
                        );

                        // ─── PAYMENTS MODE ───
                        return (
                          <tr key={app.id} style={{ borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' }}>
                            <td style={{ padding: '11px 12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              {app.name || '—'}
                              <SeatBadge app={app} />
                            </td>
                            <td style={{ padding: '11px 12px', color: '#555', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={eventTitle}>{eventTitle}</td>
                            <td style={{ padding: '11px 12px', whiteSpace: 'nowrap' }}>
                              <span style={{ background: statusColor(displayStatus(app)) + '22', color: statusColor(displayStatus(app)), border: `1px solid ${statusColor(displayStatus(app))}44`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700, textTransform: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {statusLabel(displayStatus(app) ?? 'pending')}{statusIcons(app)}
	                              </span>
	                              {secondaryStatusLabels(app)}
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
                  {counts.payment_failed > 0 && <span style={{ color: statusColor('payment_failed') }}>payment failed: <b>{counts.payment_failed}</b></span>}
                  {counts.re_target      > 0 && <span style={{ color: statusColor('re_target')      }}>re-target: <b>{counts.re_target}</b></span>}
                  {counts.waitlist       > 0 && <span style={{ color: statusColor('waitlist')       }}>waitlist: <b>{counts.waitlist}</b></span>}
                  {counts.advance_paid > 0 && <span style={{ color: statusColor('advance_paid') }}>advance paid: <b>{counts.advance_paid}</b></span>}
                  {counts.fully_paid   > 0 && <span style={{ color: statusColor('fully_paid')   }}>fully paid: <b>{counts.fully_paid}</b></span>}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── PLANS TAB: GLOBAL MESSAGES ───────────────────────────────────── */}
        {!loading && tab === 'trips' && adminRole === 'admin' && (
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
                  const preview = slug ? announcementPreviewText(slug) : null;
                  return (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <select
                          style={{ ...s.input, marginBottom: 4 }}
                          value={slug}
                          onChange={e => {
                            // The preview effect picks up the new slug on its own.
                            setAnnouncementEventSlugs(prev => prev.map((s, i) => i === idx ? e.target.value : s));
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
        {/* ── GROWTH TAB sub-switcher ──────────────────────────────────────── */}
        {tab === 'analytics' && (
          <div style={s.subTabBar}>
            {/* Named after the heading each page shows, as in the Team tab. */}
            {([['overview', 'Analytics'], ['trends', 'Experiments']] as const).map(([mode, label]) => (
              <button key={mode} onClick={() => setGrowthMode(mode)} style={s.subTab(growthMode === mode)}>{label}</button>
            ))}
          </div>
        )}

        {/* ── GROWTH ▸ OVERVIEW (the funnel snapshot) ───────────────────────── */}
        {tab === 'analytics' && growthMode === 'overview' && (() => {
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

          // Per-(event, city) pricing-stage counts, powering the city split in the
          // Pricing Conversion Rate card below. Additive to `funnel` (which stays
          // pooled by event); this only carries the four pricing/CTA stages, split
          // by the city the user had selected. Shape: pricingByCity[event][city][stage].
          const pricingByCity: Record<string, Record<string, Record<string, number>>> = {};
          ((summary?.pricing_by_city ?? []) as Array<{ event_id: string; city: string; stage: string; sessions: number }>).forEach((row) => {
            if (!row.event_id || !row.city) return;
            ((pricingByCity[row.event_id] ??= {})[row.city] ??= {})[row.stage] = row.sessions || 0;
          });
          // Representative full ticket price for a city, mirroring the /plans price
          // screen: prefer city_details[city].price_full; for the "Other" catch-all
          // fall back to the first pickup point's otherPrice; finally the event's
          // base price. Returns null when nothing sensible is configured (no chip).
          const cityPriceFull = (trip: Trip | undefined, city: string): number | null => {
            if (!trip) return null;
            const cd = (trip.city_details as any)?.[city];
            if (cd && typeof cd.price_full === 'number' && cd.price_full > 0) return cd.price_full;
            if (city === 'Other') {
              const op = (trip.pickup_points ?? []).map(p => p.otherPrice).find(v => typeof v === 'number' && v > 0);
              if (op) return op;
            }
            return typeof trip.price_full === 'number' && trip.price_full > 0 ? trip.price_full : null;
          };

          // ── Open-event funnel (get_analytics_summary.open_funnel) ────────────
          // Open events have no approval step, so their funnel is DB-derived
          // (not analytics-event-derived): details submitted (an applications
          // row) → clicked Pay (a payu_payments row) → paid, plus the two rates
          // the founder tracks — cart abandonment and recovery. Keyed by the
          // canonical event id so it joins with tripById + the event filter.
          // A client-side stage only has data from the day its ping shipped. If
          // the window reaches back before that, its rate is meaningless — the
          // denominator is full of history the numerator could never match, and
          // it renders as a confident 0% rather than "no data". (Submitted
          // Details did exactly this: 0 of 41.) Compare each stage's first-ever row
          // against the window start and treat anything older as not-yet-measured.
          const stageFirstSeen: Record<string, string> = summary?.stage_first_seen ?? {};
          const windowStart = summary?.since ? new Date(summary.since).getTime() : null;
          const stageCoversWindow = (stage: string): boolean => {
            const first = stageFirstSeen[stage];
            if (!first) return false;                 // ping never fired at all
            if (windowStart == null) return true;
            return new Date(first).getTime() <= windowStart;
          };
          const stageLiveFrom = (stage: string): string | null => {
            const first = stageFirstSeen[stage];
            return first ? new Date(first).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
          };
          // "Pick a shorter window" is only useful advice when a shorter window
          // would actually cover the stage. For a ping that shipped in the last
          // 24h no window does, and telling the founder to keep shrinking it
          // sends them in circles — say when it starts scoring instead.
          const notMeasuredYet = (stage: string): string => {
            const first = stageFirstSeen[stage];
            if (!first) return 'collecting data — nothing tracked yet';
            const from = stageLiveFrom(stage);
            const firstMs = new Date(first).getTime();
            const shortestWindowStart = Date.now() - 24 * 60 * 60 * 1000;
            if (firstMs <= shortestWindowStart) {
              return `tracked from ${from} — switch to Last 24 Hours to see this one`;
            }
            const scoresFrom = new Date(firstMs + 24 * 60 * 60 * 1000)
              .toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
            return `tracked from ${from} — needs a full day of data, scores from ${scoresFrom}`;
          };

          type OpenRow = { event_id: string; details_submitted: number; pay_clicked: number; paid: number; abandoned: number; recovered: number; messaged: number; recovered_messaged: number; otp_requested: number; otp_verified: number; verified_no_row: number };
          const openFunnelByEvent: Record<string, OpenRow> = {};
          ((summary?.open_funnel ?? []) as OpenRow[]).forEach((r) => { openFunnelByEvent[r.event_id] = r; });
          // Open form opens/submits — both client pings, both counted as distinct
          // SESSIONS server-side, so Submitted Details divides like units. It used
          // to divide applications rows (one per event+phone, forever) by
          // sessions, which under-read the rate every time an abandoner came
          // back: new session, no new row.
          const detailsFormOpenedByEvent = stageMap('details_form_opened');
          const detailsFormSubmittedByEvent = stageMap('details_form_submitted');

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
            // Open events (funnel + form pings) so they're filterable too.
            ...Object.keys(openFunnelByEvent), ...Object.keys(detailsFormOpenedByEvent),
            ...Object.keys(detailsFormSubmittedByEvent),
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
          // Invite-flow per-event sections (Application Completion, Payment
          // Conversion) — exclude open events; they have no approval step and
          // live in the open branch of the Journey fork instead.
          const visibleAppEvents = Array.from(effectiveSelected)
            .filter(id => tripById.get(id)?.booking_url !== 'payu-hosted')
            .sort((a, b) => eventLabelById(a).localeCompare(eventLabelById(b)));
          // Open-flow per-event sections use the same picker, but only render
          // payu-hosted events. Their form/payment stages come from the
          // event-keyed open_funnel payload + details_form_opened stage map.
          const visibleOpenEvents = Array.from(effectiveSelected)
            .filter(id => tripById.get(id)?.booking_url === 'payu-hosted')
            .sort((a, b) => eventLabelById(a).localeCompare(eventLabelById(b)));

          // Open-event funnel pooled GLOBALLY across every open event with data
          // in the window — like the rest of the Journey overview, which is
          // "all events combined" (the per-event sections lower down are the
          // ones filtered by the event picker). Global pooling also means the
          // open branch shows even when the only open event is inactive — open
          // events are ephemeral and get deactivated after they run, so an
          // active-only filter would otherwise hide all open data.
          const openAgg = Object.values(openFunnelByEvent).reduce((acc, r) => {
            acc.details += r.details_submitted; acc.payClicked += r.pay_clicked; acc.paid += r.paid;
            acc.abandoned += r.abandoned; acc.recovered += r.recovered;
            acc.messaged += r.messaged; acc.recoveredMessaged += r.recovered_messaged;
            acc.otpRequested += r.otp_requested || 0; acc.otpVerified += r.otp_verified || 0;
            acc.verifiedNoRow += r.verified_no_row || 0;
            return acc;
          }, { details: 0, payClicked: 0, paid: 0, abandoned: 0, recovered: 0, messaged: 0, recoveredMessaged: 0, otpRequested: 0, otpVerified: 0, verifiedNoRow: 0 });
          // Form opens/submits for open events (client pings), summed across them.
          const sumOpenStage = (m: Record<string, number>) => Object.entries(m).reduce(
            (s, [id, n]) => s + (tripById.get(id)?.booking_url === 'payu-hosted' ? n : 0), 0);
          const openFormOpened    = sumOpenStage(detailsFormOpenedByEvent);
          const openFormSubmitted = sumOpenStage(detailsFormSubmittedByEvent);
          // Whether to render the open branch at all — based on the CLIENT's
          // knowledge that an open event exists, so the fork structure appears
          // immediately (the branch fills once the open_funnel migration is
          // applied + analytics refreshed). Pure-invite setups never see it.
          const hasOpenEvents = trips.some(t => (t as any).booking_url === 'payu-hosted');
          // Which open events this pooled branch is actually made of. Global
          // pooling is deliberate (open events get deactivated the moment they
          // run, so an active-only filter would hide all open data) — but it
          // used to be invisible, and a stale unlaunched open event sitting in
          // the pool with price views and zero bookings quietly dragged every
          // rate down with no way to tell. Now the branch names its inputs.
          const pooledOpenEventIds = Array.from(new Set([
            ...Object.keys(openFunnelByEvent),
            ...Object.keys(detailsFormOpenedByEvent),
            ...Object.keys(detailsFormSubmittedByEvent),
            ...Object.keys(reachedByEvent),
          ])).filter(id => tripById.get(id)?.booking_url === 'payu-hosted'
                        && ((reachedByEvent[id] || 0) > 0
                          || (detailsFormOpenedByEvent[id] || 0) > 0
                          || (openFunnelByEvent[id]?.details_submitted || 0) > 0));

          const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
            <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 12, color: '#999', fontWeight: 600, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#111', lineHeight: 1 }}>{value}</div>
              {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{sub}</div>}
            </div>
          );

          type OpenEventRateValues = { numerator: number; denominator: number; detail: string; emptyText: string; unmeasured?: boolean };
          const OpenEventRateCard = ({
            title, description, valuesForEvent, greenAt = 50, yellowAt = 25,
          }: {
            title: string;
            description: string;
            valuesForEvent: (eventId: string) => OpenEventRateValues;
            greenAt?: number;
            yellowAt?: number;
          }) => (
            <>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>{title}</div>
              <div style={{ fontSize: 11, color: '#aaa', marginTop: -6, marginBottom: 10 }}>{description}</div>
              <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                {visibleOpenEvents.length === 0 && <div style={{ color: '#bbb', fontSize: 13 }}>No open events selected</div>}
                {visibleOpenEvents.map((eventId, idx) => {
                  const { numerator, denominator, detail, emptyText, unmeasured } = valuesForEvent(eventId);
                  // A stage whose ping post-dates the window can't be scored —
                  // its 0 would read as real drop-off against a full denominator.
                  const hasData = denominator > 0 && !unmeasured;
                  const pct = hasData ? Math.round((numerator / denominator) * 100) : null;
                  const last = idx === visibleOpenEvents.length - 1;
                  const color = !hasData ? '#bbb' : pct! >= greenAt ? '#4ade80' : pct! >= yellowAt ? '#fcd34d' : '#fca5a5';
                  const fill = !hasData ? '#e5e5e5' : pct! >= greenAt ? '#bbf7d0' : pct! >= yellowAt ? '#fde68a' : '#fecaca';
                  return (
                    <div key={eventId} style={{ marginBottom: last ? 0 : 14, paddingBottom: last ? 0 : 14, borderBottom: last ? 'none' : '1px solid #f0f0ea' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{eventLabelById(eventId)}</span>
                        <span style={{ fontSize: 20, fontWeight: 800, color }}>{hasData ? `${pct}%` : '—%'}</span>
                      </div>
                      <div style={{ height: 7, background: '#f0f0ea', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: hasData ? `${Math.min(100, pct!)}%` : '4%', height: '100%', background: fill, borderRadius: 99, transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>{hasData ? detail : emptyText}</div>
                    </div>
                  );
                })}
              </div>
            </>
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
                {/* No page title — the Analytics pill above names this page.
                    The spacer keeps the window selector right-aligned. */}
                <div style={{ flex: 1 }} />
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
                  {/* JOURNEY — the funnel is SHARED up to Pricing Conversion (the
                      same browsing UI for every event), then FORKS at the CTA
                      under the price: invite events show "Apply Now" (→ application
                      → approval → payment); open events show "Book Now" (→ details
                      → pay → paid). We render the shared trunk, then a branch per
                      flow. All Journey figures are pooled globally (all events
                      combined); the per-event sections lower down are filtered. */}
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
                    // Per-flow Pricing Conversion. The price screen is identical for
                    // both flows, but the CTA under it differs (Apply Now vs Book
                    // Now), so we split the reached-pricing → CTA-tapped rate by flow
                    // to see whether one CTA drops off more than the other at the
                    // SAME price. reachedByEvent/convertedByEvent are keyed by
                    // resolved event id, so bucket them by the trip's booking_url.
                    const isOpenId = (id: string) => tripById.get(id)?.booking_url === 'payu-hosted';
                    const sumFlow = (m: Record<string, number>, wantOpen: boolean) =>
                      Object.entries(m).reduce((s, [id, n]) => s + (isOpenId(id) === wantOpen ? n : 0), 0);
                    const inviteReached   = sumFlow(reachedByEvent, false);
                    const inviteConverted = sumFlow(convertedByEvent, false);
                    const openReached     = sumFlow(reachedByEvent, true);
                    const openConverted   = sumFlow(convertedByEvent, true);
                    // Shared trunk — every event, up to the shared price screen.
                    const sharedSteps: Step[] = [
                      { label: 'Join Plan Rate', pct: pooledJoinPlanPct, num: totalCalendarOpens, den: totalDetailViews,   descr: 'who reached event details clicked Join Our Plan' },
                      { label: 'Date Pick Rate', pct: pooledDatePickPct, num: totalDatePicks,     den: totalCalendarOpens, descr: 'who opened the calendar picked a date' },
                    ];
                    // Invite branch — Apply Now → application → approval → payment.
                    const inviteSteps: Step[] = [
                      { label: 'Pricing Conversion',     pct: pooledPct(inviteConverted, inviteReached), num: inviteConverted,   den: inviteReached,   descr: 'who saw the price tapped a CTA (Apply Now or Contact Us)' },
                      { label: 'Application Completion', pct: pooledAppComplPct,    num: totalAppSubmitted, den: totalAppStarted, descr: 'who opened the form submitted', emptyText: 'collecting data — form opens tracked from now' },
                      { label: 'Payment Conversion',     pct: pooledPaymentConvPct, num: totalAdvancePaid,  den: totalApproved,   descr: 'approved paid the advance', extra: ttpLabel ? ` · median ${ttpLabel} (n=${ttpN})` : '' },
                    ];
                    // Open branch — CTA → open form → submit → OTP → pay. Each step
                    // is "of the people at the previous step, how many moved on",
                    // and each one now divides like units:
                    //   Pricing Conversion  saw the price → tapped a CTA   [sessions]
                    //   Form Open Rate      tapped a CTA → form opened     [sessions]
                    //   Submitted Details   opened the form → asked for a code [sessions]
                    //   Verification Rate   asked for a code → verified it [phones]
                    //   Payment Rate        booking row created → paid     [bookings]
                    // Contact Us is in the CTA denominators on purpose: that path
                    // runs through the FAQ chat and lands on the very same booking
                    // timeline and details form, so excluding it counted people in
                    // the numerator who weren't in the denominator — which is how
                    // Form Open Rate could read over 100%.
                    // Each bar says which unit it counts, because the funnel
                    // switches units as it goes: browser sessions while the
                    // customer is anonymous, phone numbers once they identify
                    // themselves, booking rows once one exists. Every RATE
                    // divides like-for-like; the step-to-step COUNTS are not a
                    // strict waterfall and shouldn't be read as one.
                    const formOpenMeasured   = stageCoversWindow('details_form_opened');
                    const formSubmitMeasured = stageCoversWindow('details_form_submitted');
                    const openSteps: Step[] = [
                      { label: 'Pricing Conversion', pct: pooledPct(openConverted, openReached),           num: openConverted,      den: openReached,        descr: 'sessions that saw the price tapped a CTA (Book Now or Contact Us)' },
                      { label: 'Form Open Rate',     pct: formOpenMeasured ? pooledPct(openFormOpened, openConverted) : null,     num: openFormOpened,     den: openConverted,      descr: 'sessions that tapped a CTA reached the details form', emptyText: notMeasuredYet('details_form_opened') },
                      { label: 'Submitted Details',  pct: formSubmitMeasured ? pooledPct(openFormSubmitted, openFormOpened) : null, num: openFormSubmitted,  den: openFormOpened,     descr: 'sessions that opened the form filled it in and asked for a WhatsApp code', emptyText: notMeasuredYet('details_form_submitted') },
                      { label: 'Verification Rate',  pct: pooledPct(openAgg.otpVerified, openAgg.otpRequested), num: openAgg.otpVerified, den: openAgg.otpRequested, descr: 'phone numbers sent a WhatsApp code entered it correctly', emptyText: 'no verification codes requested in this window' },
                      { label: 'Payment Rate',       pct: pooledPct(openAgg.paid, openAgg.details),        num: openAgg.paid,       den: openAgg.details,    descr: 'bookings created went on to pay' },
                    ];
                    const openAbandon  = pooledPct(openAgg.abandoned, openAgg.details);
                    const openRecovery = pooledPct(openAgg.recovered, openAgg.abandoned);
                    // Recovery among leads we actually re-engaged, as opposed to
                    // raw recovery (which includes people who came back on their
                    // own). This is the only number that says whether the
                    // cart-abandonment WhatsApp is doing anything — it was
                    // computed by the RPC from day one and never rendered.
                    const openRetargeted = pooledPct(openAgg.recoveredMessaged, openAgg.messaged);
                    // Abandoned INCLUDES people who later came back and paid (the
                    // flag is never cleared), so "never paid" was wrong on the
                    // face of it. Show the ones who truly never paid.
                    const openNeverPaid = openAgg.abandoned - openAgg.recovered;

                    const csvLine = (label: string, s: Step) => [label, s.pct === null ? '' : `${s.pct}%`, s.pct === null ? '' : fmt(s.num), s.pct === null ? '' : fmt(s.den), s.pct === null ? (s.emptyText || 'no data yet') : `${s.descr}${s.extra ?? ''}`];
                    const downloadJourneyCsv = () => {
                      const rows: (string | number)[][] = [
                        ['Visitors', '', fmt(visitors), '', `${windowLabel} · unique sessions`],
                        ...sharedSteps.map(s => csvLine(`Shared · ${s.label}`, s)),
                        ['Shared · Reached Pricing', '', fmt(totalReachedPricing), '', 'saw the price screen'],
                        ...inviteSteps.map(s => csvLine(`Invite · ${s.label}`, s)),
                      ];
                      if (hasOpenEvents) {
                        rows.push(['Open · Pooled events', '', pooledOpenEventIds.length, '', pooledOpenEventIds.map(id => eventLabelById(id)).join(' | ') || 'none with data in this window']);
                        rows.push(['Open · Bookings Created', '', fmt(openAgg.details), '', 'verified and got a booking row + bill page']);
                        openSteps.forEach(s => rows.push(csvLine(`Open · ${s.label}`, s)));
                        rows.push(['Open · Cart Abandonment', openAbandon === null ? '' : `${openAbandon}%`, fmt(openAgg.abandoned), fmt(openAgg.details), `flagged cart-abandoned (${fmt(openAgg.recovered)} of them later paid)`]);
                        rows.push(['Open · Recovery Rate', openRecovery === null ? '' : `${openRecovery}%`, fmt(openAgg.recovered), fmt(openAgg.abandoned), 'paid after being flagged cart-abandoned']);
                        rows.push(['Open · Retargeted Recovery', openRetargeted === null ? '' : `${openRetargeted}%`, fmt(openAgg.recoveredMessaged), fmt(openAgg.messaged), 'paid after we actually sent them the abandonment WhatsApp']);
                      }
                      downloadCsv(`journey-${analyticsWindow}-${new Date().toISOString().slice(0, 10)}.csv`, ['Step', 'Rate', 'Numerator', 'Denominator', 'Description'], rows);
                    };

                    // One bar row, reused by the trunk and both branches.
                    const renderBar = (step: Step) => {
                      const isEmpty = step.pct === null;
                      return (
                        <div key={step.label} style={{ paddingTop: 16, borderTop: '1px solid #f0f0ea' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{step.label}</span>
                            <span style={{ fontSize: 22, fontWeight: 800, color: isEmpty ? '#bbb' : '#111' }}>{isEmpty ? '—' : `${step.pct}%`}</span>
                          </div>
                          <div style={{ height: 8, background: '#f0f0ea', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
                            <div style={{ width: isEmpty ? '4%' : `${Math.min(100, step.pct as number)}%`, height: '100%', background: isEmpty ? '#e5e5e5' : '#bbf7d0', borderRadius: 99, transition: 'width 0.4s' }} />
                          </div>
                          <div style={{ fontSize: 11, color: '#bbb' }}>
                            {isEmpty ? (step.emptyText || 'no data yet') : `${fmt(step.num)} of ${fmt(step.den)} ${step.descr}${step.extra ?? ''}`}
                          </div>
                        </div>
                      );
                    };
                    const miniStat = (label: string, value: string, sub: string) => (
                      <div style={{ flex: 1, minWidth: 120, background: '#fafafa', border: '1px solid #f0f0ea', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#111', lineHeight: 1.1 }}>{value}</div>
                        <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>{sub}</div>
                      </div>
                    );

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
                          Shared for {windowLabel.toLowerCase()} up to the price screen, then it forks: everyone sees the same price but a different CTA — <strong>Apply Now</strong> (invite) vs <strong>Book Now</strong> (open). Each branch has its own Pricing Conversion so you can compare drop-off at the CTA. Where a bar is narrow is where you're losing people.
                        </div>

                        {/* SHARED TRUNK */}
                        <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '20px 22px', marginBottom: 12 }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Visitors</span>
                              <span style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>{fmt(visitors)}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#bbb', marginBottom: 16 }}>{windowLabel.toLowerCase()} · unique sessions</div>
                          </div>
                          {sharedSteps.map(renderBar)}
                          {/* Reached Pricing — the SHARED endpoint (same price
                              screen for both flows). Shown as a count; each branch
                              then computes its own Pricing Conversion from here. */}
                          <div style={{ paddingTop: 16, borderTop: '1px solid #f0f0ea' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Reached Pricing</span>
                              <span style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{fmt(totalReachedPricing)}</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#bbb' }}>saw the price screen — {fmt(inviteReached)} on invite events, {fmt(openReached)} on open events</div>
                          </div>
                        </div>

                        {/* BRANCHES — invite (Apply Now) + open (Book Now) */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24, alignItems: 'flex-start' }}>
                          {/* Invite branch */}
                          <div style={{ flex: 1, minWidth: 300, background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '18px 20px' }}>
                            <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, color: '#7c3aed', background: '#ede9fe', borderRadius: 999, padding: '3px 10px', marginBottom: 6 }}>INVITE · Apply Now</div>
                            {inviteSteps.map(renderBar)}
                          </div>

                          {/* Open branch */}
                          {hasOpenEvents && (
                            <div style={{ flex: 1, minWidth: 300, background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '18px 20px' }}>
                              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, color: '#0369a1', background: '#e0f2fe', borderRadius: 999, padding: '3px 10px', marginBottom: 6 }}>OPEN · Book Now</div>
                              {/* Name the pool. A stale open event with price
                                  views and no bookings drags every rate here
                                  down, and this is the only place it shows. */}
                              <div style={{ fontSize: 10.5, color: '#bbb', marginBottom: 2 }}>
                                {pooledOpenEventIds.length === 0
                                  ? 'no open events with data in this window'
                                  : <>pooling {pooledOpenEventIds.length} open event{pooledOpenEventIds.length === 1 ? '' : 's'}: {pooledOpenEventIds.map(id => eventLabelById(id)).join(' · ')}</>}
                              </div>
                              {openSteps.map(renderBar)}
                              <div style={{ paddingTop: 16, borderTop: '1px solid #f0f0ea' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Bookings Created</span>
                                  <span style={{ fontSize: 22, fontWeight: 800, color: '#111' }}>{fmt(openAgg.details)}</span>
                                </div>
                                <div style={{ fontSize: 11, color: '#bbb' }}>verified and reached the bill page</div>
                              </div>
                              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {miniStat('Cart Abandonment', openAbandon === null ? '—' : `${openAbandon}%`, `${fmt(openAgg.abandoned)} of ${fmt(openAgg.details)} flagged · ${fmt(openNeverPaid)} never paid`)}
                                {miniStat('Recovery Rate', openRecovery === null ? '—' : `${openRecovery}%`, `${fmt(openAgg.recovered)} of ${fmt(openAgg.abandoned)} paid after`)}
                                {miniStat('Retargeted Recovery', openRetargeted === null ? '—' : `${openRetargeted}%`, `${fmt(openAgg.recoveredMessaged)} of ${fmt(openAgg.messaged)} we WhatsApped came back`)}
                              </div>
                              {/* Verified, then no booking row was written. Anyone
                                  who PAYS gets a row back-filled by payu-callback,
                                  so these are unpaid leads that fell out of the CRM
                                  entirely — no People row, no abandonment WhatsApp,
                                  no marketer. Worth chasing by hand. */}
                              {openAgg.verifiedNoRow > 0 && (
                                <div style={{ marginTop: 10, padding: '10px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10 }}>
                                  <div style={{ fontSize: 12, fontWeight: 800, color: '#9a3412' }}>
                                    {fmt(openAgg.verifiedNoRow)} verified but never became a booking
                                  </div>
                                  <div style={{ fontSize: 10.5, color: '#c2410c', marginTop: 2 }}>
                                    They passed the WhatsApp code, so the number is real — but no booking row was created, so they're invisible in People and got no abandonment nudge.
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
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
                        'Open Form Opened', 'Open Form Open Rate',
                        'Open Form Submitted', 'Open Submitted Details Rate',
                        'Open OTP Requested', 'Open OTP Verified', 'Open Verification Rate',
                        'Open Bookings Created', 'Open Paid', 'Open Payment Rate',
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
                        const isOpen   = tripById.get(id)?.booking_url === 'payu-hosted';
                        const openFormOpened = detailsFormOpenedByEvent[id] || 0;
                        const openFormSubmittedEv = detailsFormSubmittedByEvent[id] || 0;
                        const openOtpReq = openFunnelByEvent[id]?.otp_requested || 0;
                        const openOtpVer = openFunnelByEvent[id]?.otp_verified || 0;
                        const openDetails = openFunnelByEvent[id]?.details_submitted || 0;
                        const openPaid = openFunnelByEvent[id]?.paid || 0;
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
                          // Denominator is total CTA, not Book Now alone — Contact Us
                          // reaches the same form, so dividing by Book Now could push
                          // this past 100%.
                          isOpen ? openFormOpened : '', isOpen && stageCoversWindow('details_form_opened') ? pct(openFormOpened, totalCta) : '',
                          isOpen ? openFormSubmittedEv : '', isOpen && stageCoversWindow('details_form_submitted') ? pct(openFormSubmittedEv, openFormOpened) : '',
                          isOpen ? openOtpReq : '', isOpen ? openOtpVer : '', isOpen ? pct(openOtpVer, openOtpReq) : '',
                          isOpen ? openDetails : '', isOpen ? openPaid : '', isOpen ? pct(openPaid, openDetails) : '',
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
                    Of users who reached the pricing screen, how many tapped a CTA — split by <strong>Book Now</strong> (ready to pay) vs <strong>Contact Us</strong> (needs more info). Events listed in more than one city break down <strong>per city</strong> (with each city's price), so you can tell whether a city is priced right.
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
                      // City split: only for events listed in >1 city (or with data
                      // in >1 city). Each row is that city's own reached→CTA rate at
                      // that city's own price — the whole point being to compare
                      // conversion across the different prices. Single-city events
                      // render just the pooled bar above, unchanged.
                      const trip = tripById.get(eventId);
                      const cityData = pricingByCity[eventId] || {};
                      const cityList = Array.from(new Set([
                        ...((trip?.cities ?? []).filter((c): c is string => typeof c === 'string' && c.trim().length > 0)),
                        ...Object.keys(cityData),
                      ]));
                      const isMultiCity = cityList.length > 1;
                      const cityRows = isMultiCity
                        ? cityList.map(city => {
                            const cReached  = cityData[city]?.['reached_pricing']    || 0;
                            const cBooked   = (cityData[city]?.['book_cta_clicked']  || 0) + (cityData[city]?.['pricing_cta_clicked'] || 0);
                            const cContact  = cityData[city]?.['contact_cta_clicked'] || 0;
                            const cTotalCta = cBooked + cContact;
                            const cPct = cReached > 0 ? Math.round((cTotalCta / cReached) * 100) : null;
                            const price = cityPriceFull(trip, city);
                            return { city, cReached, cBooked, cContact, cTotalCta, cPct, price };
                          }).sort((a, b) => b.cReached - a.cReached)
                        : [];
                      return (
                        <div key={eventId} style={{ marginBottom: idx < visibleDropoffEvents.length - 1 ? 14 : 0, paddingBottom: idx < visibleDropoffEvents.length - 1 ? 14 : 0, borderBottom: idx < visibleDropoffEvents.length - 1 ? '1px solid #f0f0ea' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{eventLabelById(eventId)}{isMultiCity && <span style={{ fontSize: 11, fontWeight: 600, color: '#bbb', marginLeft: 6 }}>· all cities</span>}</span>
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
                          {isMultiCity && (
                            <div style={{ marginTop: 10, paddingLeft: 12, borderLeft: '2px solid #f0f0ea', display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {cityRows.map(r => (
                                <div key={r.city}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>
                                      {r.city}
                                      {r.price != null && <span style={{ fontWeight: 600, color: '#999' }}> (₹{r.price.toLocaleString('en-IN')})</span>}
                                    </span>
                                    <span style={{ fontSize: 15, fontWeight: 800, color: r.cPct == null ? '#ccc' : r.cPct >= 50 ? '#4ade80' : r.cPct >= 25 ? '#fcd34d' : '#fca5a5' }}>
                                      {r.cPct == null ? '—%' : `${r.cPct}%`}
                                    </span>
                                  </div>
                                  <div style={{ height: 5, background: '#f5f5f0', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                                    <div style={{ width: r.cPct == null ? '0%' : `${Math.min(100, r.cPct)}%`, height: '100%', background: r.cPct == null ? '#e5e5e5' : r.cPct >= 50 ? '#bbf7d0' : r.cPct >= 25 ? '#fde68a' : '#fecaca', borderRadius: 99, transition: 'width 0.4s' }} />
                                  </div>
                                  <div style={{ fontSize: 10.5, color: '#bbb' }}>
                                    {r.cReached > 0
                                      ? <>{r.cBooked} tapped Book Now · {r.cContact} Contact Us · {r.cReached} saw the price</>
                                      : 'no views yet'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* These three mirror the Journey open branch exactly — same
                      numerators, same denominators. They used to disagree with
                      it: Form Open Rate divided by Book Now taps alone while the
                      Journey divided by all CTA taps, so the same metric showed
                      two numbers on one screen, and this one could exceed 100%
                      (Contact Us → FAQ → the same booking form puts people in
                      the numerator who were never in the denominator). */}
                  <OpenEventRateCard
                    title="Open Form Open Rate"
                    description="For open events, of users who tapped a CTA under the price (Book Now or Contact Us — both paths lead to the same booking form), how many reached the details form. A low rate means people are dropping between the pricing CTA and the form opening."
                    valuesForEvent={(eventId) => {
                      const tappedCta = convertedByEvent[eventId] || 0;
                      const formOpened = detailsFormOpenedByEvent[eventId] || 0;
                      return {
                        numerator: formOpened,
                        denominator: tappedCta,
                        detail: `${formOpened} of ${tappedCta} who tapped a CTA reached the form`,
                        unmeasured: !stageCoversWindow('details_form_opened'),
                        emptyText: stageCoversWindow('details_form_opened') ? 'no CTA taps in this window' : notMeasuredYet('details_form_opened'),
                      };
                    }}
                  />

                  <OpenEventRateCard
                    title="Open Submitted Details"
                    description="For open events, of users who opened the details form, how many filled it in and asked for a WhatsApp code. It counts the moment the code is sent, NOT the moment it's entered — entering the code is the next step, Verification Rate. Both sides count browser sessions, so someone who comes back a second time is counted the same way on both. A low rate means the form itself is losing people."
                    valuesForEvent={(eventId) => {
                      const formOpened = detailsFormOpenedByEvent[eventId] || 0;
                      const formSubmitted = detailsFormSubmittedByEvent[eventId] || 0;
                      return {
                        numerator: formSubmitted,
                        denominator: formOpened,
                        detail: `${formSubmitted} of ${formOpened} who opened the form submitted their details`,
                        unmeasured: !stageCoversWindow('details_form_submitted'),
                        emptyText: stageCoversWindow('details_form_submitted') ? 'no tracked form opens in this window' : notMeasuredYet('details_form_submitted'),
                      };
                    }}
                  />

                  <OpenEventRateCard
                    title="Open Verification Rate"
                    description="For open events, of users who were sent a WhatsApp verification code after submitting the form, how many entered it correctly. This step sits between the form and the booking, and used to be hidden inside Submitted Details. A low rate means codes aren't arriving — or that people are asking for a code and walking away — so check the AiSensy WhatsApp sends."
                    greenAt={70}
                    yellowAt={40}
                    valuesForEvent={(eventId) => {
                      const requested = openFunnelByEvent[eventId]?.otp_requested || 0;
                      const verified = openFunnelByEvent[eventId]?.otp_verified || 0;
                      const lost = openFunnelByEvent[eventId]?.verified_no_row || 0;
                      return {
                        numerator: verified,
                        denominator: requested,
                        detail: `${verified} of ${requested} who got a code entered it correctly`
                          + (lost > 0 ? ` · ⚠ ${lost} verified but never became a booking` : ''),
                        emptyText: 'no verification codes requested in this window',
                      };
                    }}
                  />

                  <OpenEventRateCard
                    title="Open Payment Rate"
                    description="For open events, of bookings created (they verified and reached the bill page), how many completed payment. A low rate means people are dropping at the bill itself."
                    greenAt={70}
                    yellowAt={40}
                    valuesForEvent={(eventId) => {
                      const detailsSubmitted = openFunnelByEvent[eventId]?.details_submitted || 0;
                      const paid = openFunnelByEvent[eventId]?.paid || 0;
                      return {
                        numerator: paid,
                        denominator: detailsSubmitted,
                        detail: `${paid} of ${detailsSubmitted} whose booking was created paid`,
                        emptyText: 'no bookings created in this window',
                      };
                    }}
                  />

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

        {/* ── PERFORMANCE TAB, MANAGER VIEW ──────────────────────────────────
            Founder decision: managers see marketer ROI + team management here
            and NONE of the money cards (profit/forecast/creators stay
            founder-only; the RPC behind those returns NULL to non-admins
            anyway). Data comes from the scoped get_manager_summary. */}
        {tab === 'marketers' && adminRole !== 'admin' && currentManager && (() => {
          const inr = (n: number) => '₹' + Math.round(Number(n || 0)).toLocaleString('en-IN');
          const fullyPaidApps = applications.filter(a => a.status === 'fully_paid');
          const managedTrips = trips.filter(t => managerAssignedSlugs.includes(t.slug ?? ''));
          const activeRoster = managerRoster.filter(mk => mk.active);
          // Bill-style earnings view. Manager commission applies to every
          // fully-paid ticket on a managed event; marketer commission applies
          // only to this person's own fully-paid leads. A dual-role event keeps
          // both calculations on one event line and the footer sums them.
          const myMkId = currentMarketer?.id ?? null;
          const applicationEventById = new Map<string, string>(
            applications.map(application => [String(application.id), String(application.event_slug)] as [string, string])
          );
          const marketerSalesBySlug = myMarketerSales.reduce<Record<string, { amount: number; tickets: number }>>((totals, sale) => {
            const slug = applicationEventById.get(sale.application_id);
            if (!slug) return totals;
            const current = totals[slug] ?? { amount: 0, tickets: 0 };
            current.amount += sale.amount;
            current.tickets += 1;
            totals[slug] = current;
            return totals;
          }, {});
          const relevantSlugs = Array.from(new Set([
            ...managerAssignedSlugs,
            ...(myMkId ? marketerAssignedSlugs : []),
            ...Object.keys(marketerSalesBySlug),
          ]));
          const earningRows = relevantSlugs.flatMap(slug => {
            const t = trips.find(x => x.slug === slug);
            if (!t) return [];
            const managed = managerAssignedSlugs.includes(slug);
            const marketerLedger = marketerSalesBySlug[slug];
            const hasMarketerEarnings = !!myMkId && (marketerAssignedSlugs.includes(slug) || !!marketerLedger);
            const mgrRate = managed ? Number(t.manager_commission ?? currentManager.commission_amount ?? 0) : 0;
            const calculations: Array<{ role: 'Manager' | 'Marketer'; amount: number; rate?: number; tickets: number }> = [];
            if (managed) {
              const tickets = fullyPaidApps.filter(a => a.event_slug === slug).length;
              calculations.push({
                role: 'Manager', rate: mgrRate, tickets,
                amount: mgrRate * tickets,
              });
            }
            if (hasMarketerEarnings) {
              calculations.push({
                role: 'Marketer',
                tickets: marketerLedger?.tickets ?? 0,
                amount: marketerLedger?.amount ?? 0,
              });
            }
            return [{
              slug,
              title: t.title,
              calculations,
              total: calculations.reduce((sum, calculation) => sum + calculation.amount, 0),
            }];
          });
          const earningsTotal = earningRows.reduce((sum, row) => sum + row.total, 0);
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 22 }}>Performance</div>

            {/* Earnings bill — one line per event + calculated total. */}
            <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', fontSize: 11, fontWeight: 800, color: '#777', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Earnings Breakdown
              </div>
              {earningRows.length === 0 && (
                <div style={{ padding: '12px 16px', color: '#bbb', fontSize: 13 }}>No events assigned yet.</div>
              )}
              {earningRows.map(r => (
                <div key={r.slug} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderTop: '1px solid #f0f0ea' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 650, fontSize: 14, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                    <div style={{ marginTop: 2, fontSize: 10, fontWeight: 600, color: '#aaa' }}>{r.calculations.map(c => c.role).join(' + ')}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {r.calculations.map(c => (
                      <div key={c.role} style={{ fontWeight: 750, fontSize: 14, color: '#333', whiteSpace: 'nowrap' }}>
                        {c.rate == null
                          ? <>{inr(c.amount)} <span style={{ color: '#aaa', fontWeight: 600 }}>· {c.tickets} ticket{c.tickets === 1 ? '' : 's'}</span></>
                          : <>{inr(c.rate)} <span style={{ color: '#aaa', fontWeight: 600 }}>×</span> {c.tickets}</>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, padding: '14px 16px', borderTop: '1.5px solid #e5e5e5', background: '#fafafa' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#555' }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 850, color: '#16a34a', whiteSpace: 'nowrap' }}>{inr(earningsTotal)}</span>
              </div>
            </div>

            {/* Marketer ROI — same table style the founders see, scoped to your events */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Marketer ROI</div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>Your team's leads, conversions and commission on your events. Stale = pending/invited leads sitting 48h+ without progress.</div>
              <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '8px 0', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 560 }}>
                  <thead>
                    <tr style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      <th style={{ textAlign: 'left', padding: '8px 16px' }}>Marketer</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px' }}>Leads</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px' }}>Sold</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px' }}>Conv</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px' }}>Stale</th>
                      <th style={{ textAlign: 'right', padding: '8px 16px' }}>Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(managerSummary?.marketers ?? []).length === 0 && (
                      <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#bbb' }}>No marketers with leads on your events yet.</td></tr>
                    )}
                    {(managerSummary?.marketers ?? []).map(m => {
                      const conv = m.leads > 0 ? Math.round((m.fully_paid / m.leads) * 100) : null;
                      return (
                        <tr key={m.marketer_id} style={{ borderTop: '1px solid #f5f5f0', opacity: m.active ? 1 : 0.5 }}>
                          <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111' }}>{m.name}{!m.active && <span style={{ fontSize: 10, color: '#aaa', marginLeft: 6 }}>inactive</span>}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>{m.leads}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>{m.fully_paid}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>{conv == null ? '—' : `${conv}%`}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', color: m.stale_leads > 0 ? '#d97706' : '#bbb', fontWeight: m.stale_leads > 0 ? 700 : 400 }}>{m.stale_leads}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', color: '#555' }}>{inr(m.commission)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team management — add/remove marketers per event, hire new */}
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Your Team</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {managedTrips.map(t => {
                  const slug = t.slug ?? '';
                  const selected = managerEventMarketers[slug] ?? [];
                  return (
                    <div key={slug} style={{ background: '#fafafa', border: '1.5px solid #eee', borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                        Marketers on {t.title}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {activeRoster.map(mk => {
                          const on = selected.includes(mk.id);
                          return (
                            <button
                              key={mk.id}
                              type="button"
                              onClick={() => managerSetEventMarketers(slug, on ? selected.filter(x => x !== mk.id) : [...selected, mk.id])}
                              style={{ padding: '7px 14px', borderRadius: 99, border: '1.5px solid ' + (on ? '#111' : '#d7d7d7'), background: on ? '#111' : '#fff', color: on ? '#fff' : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                            >
                              {on ? '✓ ' : ''}{mk.name}
                            </button>
                          );
                        })}
                        {hiringEventSlug === slug ? (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', width: '100%', marginTop: 4 }}>
                            <input type="text" placeholder="Name" value={newHireName} onChange={e => setNewHireName(e.target.value)}
                              style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 13, width: 130 }} />
                            <input type="email" placeholder="Google email (their login)" value={newHireEmail} onChange={e => setNewHireEmail(e.target.value)}
                              style={{ padding: '7px 10px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 13, flex: 1, minWidth: 180 }} />
                            <button type="button" disabled={savingHire} onClick={() => hireMarketer(slug)}
                              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', fontWeight: 700, fontSize: 13, cursor: savingHire ? 'wait' : 'pointer' }}>
                              {savingHire ? 'Hiring…' : 'Hire'}
                            </button>
                            <button type="button" onClick={() => { setHiringEventSlug(null); setNewHireEmail(''); setNewHireName(''); }}
                              style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: 'none', color: '#888', fontSize: 13, cursor: 'pointer' }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => setHiringEventSlug(slug)}
                            style={{ padding: '7px 14px', borderRadius: 99, border: '1.5px dashed #bbb', background: '#fff', color: '#888', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                            + Hire new
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#888', marginTop: 10 }}>
                        Changing this list auto-redistributes the event's unconverted leads. Hiring creates their login and assigns them here — the founders get a notification.
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          );
        })()}

        {/* ── TEAM TAB sub-switcher (admin only — managers get no sub-views) ── */}
        {tab === 'marketers' && adminRole === 'admin' && (
          <div style={s.subTabBar}>
            {/* Each pill is named after the heading its page actually shows —
                a pill and a page title that disagree read as two places. */}
            {([['money', 'Performance'], ['marketers', 'Marketers'], ['managers', 'Managers'], ['creators', 'Creators']] as const).map(([mode, label]) => (
              <button key={mode} onClick={() => setTeamMode(mode)} style={s.subTab(teamMode === mode)}>{label}</button>
            ))}
          </div>
        )}

        {/* ── TEAM ▸ PERFORMANCE + MARKETERS (admin only) ──────────────────────
            One wrapper, two sub-views: Performance (forecast, unit economics,
            payouts, fixed costs) and Marketers (roster + hiring). Managers and
            Creators render from their own blocks further down, so this wrapper
            sits out those two sub-views. */}
        {tab === 'marketers' && adminRole === 'admin' && (teamMode === 'money' || teamMode === 'marketers') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {teamMode === 'money' && (() => {
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
              // Outstanding marketer payouts (founder-only RPC), grouped two ways:
              // per-marketer "unpaid tickets + owed", and per event+date for the
              // settle list. Both shrink the moment a date is settled.
              const owedByMk = new Map<string, { name: string; tickets: number; amount: number }>();
              marketerPayouts.forEach(r => {
                const cur = owedByMk.get(r.marketer_id) ?? { name: r.marketer_name || '—', tickets: 0, amount: 0 };
                cur.tickets += num(r.tickets); cur.amount += num(r.amount);
                owedByMk.set(r.marketer_id, cur);
              });
              const owedRows = Array.from(owedByMk.values()).sort((a, b) => b.amount - a.amount);
              const byDate = new Map<string, { event_slug: string; selected_date: string | null; title: string; tickets: number; amount: number; splits: Array<{ name: string; tickets: number }> }>();
              marketerPayouts.forEach(r => {
                const key = r.event_slug + '||' + (r.selected_date ?? '');
                const cur = byDate.get(key) ?? { event_slug: r.event_slug, selected_date: r.selected_date, title: (r.event_title || r.event_slug || '').trim(), tickets: 0, amount: 0, splits: [] };
                cur.tickets += num(r.tickets); cur.amount += num(r.amount);
                cur.splits.push({ name: r.marketer_name || '—', tickets: num(r.tickets) });
                byDate.set(key, cur);
              });
              const payoutDates = Array.from(byDate.values()).sort((a, b) => (a.selected_date || '').localeCompare(b.selected_date || ''));
              const fmtPayoutDate = (d: string | null) => {
                if (!d) return 'No date set';
                const dt = new Date(d + 'T00:00:00');
                return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
              };
              return (
                <>
                  {/* No page title — the Performance pill above already names
                      this page, and repeating it just costs vertical space. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() => { loadMarketersData(); loadAffiliatesData(); }}
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
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>Type your cost to deliver one ticket. This table uses the event&apos;s full marketer fee (₹50 default), so open-event self-serve tickets that earn a half fee produce a higher actual margin.</div>
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
                            const commission = ev.commission_per_ticket != null ? num(ev.commission_per_ticket) : 50;
                            // Manager ₹/ticket — 0 unless the event has an active manager assigned.
                            const managerCommission = num(ev.manager_commission_per_ticket);
                            const perTicket = price - cost - commission - managerCommission;
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

                  {/* Conversion Rate — lifetime. Leads vs. conversions; never
                      resets when a payout is settled. */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Conversion Rate</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>Lifetime. Leads assigned vs. how many they converted (Conv = sold ÷ leads). This does not reset when you settle a payout.</div>
                    <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '8px 0', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 420 }}>
                        <thead>
                          <tr style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <th style={{ textAlign: 'left', padding: '8px 16px' }}>Marketer</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Leads</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Converted</th>
                            <th style={{ textAlign: 'right', padding: '8px 16px' }}>Conv</th>
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
                              <td style={{ padding: '10px 16px', textAlign: 'right', color: conv == null ? '#bbb' : conv >= 40 ? '#16a34a' : conv >= 15 ? '#d97706' : '#dc2626' }}>{conv == null ? '—' : `${conv}%`}</td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Outstanding payouts — only unsettled events. Unpaid tickets +
                      money owed per marketer, plus a per-date Settle action. Both
                      the ticket count and the amount drop when a date is settled. */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Marketer Payouts</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>Only unsettled events. Unpaid tickets and money owed — both drop the moment you settle a date below.</div>
                    <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '8px 0', overflowX: 'auto', marginBottom: 12 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 420 }}>
                        <thead>
                          <tr style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <th style={{ textAlign: 'left', padding: '8px 16px' }}>Marketer</th>
                            <th style={{ textAlign: 'right', padding: '8px 12px' }}>Unpaid tickets</th>
                            <th style={{ textAlign: 'right', padding: '8px 16px' }}>Owed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {owedRows.length === 0 && (
                            <tr><td colSpan={3} style={{ padding: '14px 16px', color: '#bbb', fontSize: 13 }}>Nothing owed — every date is settled.</td></tr>
                          )}
                          {owedRows.map((r, i) => (
                            <tr key={i} style={{ borderTop: '1px solid #f5f5f0' }}>
                              <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111' }}>{r.name}</td>
                              <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>{r.tickets}</td>
                              <td style={{ padding: '10px 16px', textAlign: 'right', color: '#111', fontWeight: 600 }}>{inr(r.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {payoutDates.length > 0 && (
                      <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 2px 8px' }}>Settle a date once you've paid the marketers for it</div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {payoutDates.map((d) => (
                        <div key={d.event_slug + '||' + (d.selected_date ?? '')} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '12px 14px' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 650, fontSize: 14, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{fmtPayoutDate(d.selected_date)} · {d.tickets} {d.tickets === 1 ? 'ticket' : 'tickets'} · {d.splits.map(s => `${s.name} ${s.tickets}`).join(', ')}</div>
                          </div>
                          <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, color: '#111', whiteSpace: 'nowrap' }}>{inr(d.amount)}</div>
                          <button
                            onClick={() => settleMarketerPayout(d.event_slug, d.selected_date, `${d.title} · ${fmtPayoutDate(d.selected_date)}`, d.tickets, d.amount)}
                            disabled={marketersLoading}
                            style={{ whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e0e0e0', background: '#fff', cursor: marketersLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: '#444', opacity: marketersLoading ? 0.55 : 1 }}
                          >Settle</button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: '#bbb', lineHeight: 1.5 }}>
    Each event's profit (full price − your ticket cost − marketer commission, summed over tickets sold) lands in the month its balance is due, minus fixed costs. Only tickets already sold count — it's a committed-income forecast, not a sales projection. Amounts are net of PayU fees, in IST months. Keep your ticket costs and fixed costs current.
                  </div>
                </>
              );
            })()}

            {/* ── Marketer management ── */}
            {teamMode === 'marketers' && (<>
            {/* No page title — the Marketers pill above names this page. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Marketers</div>
              <span style={{ fontSize: 13, color: '#888' }}>{marketers.length} {marketers.length === 1 ? 'marketer' : 'marketers'}</span>
              {marketers.filter(marketer => !marketer.reviewed_at).length > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', padding: '2px 8px', borderRadius: 999 }}>{marketers.filter(marketer => !marketer.reviewed_at).length} new</span>}
              <div style={{ flex: 1 }} />
              <button style={s.btn()} onClick={() => setAddingMarketer(true)}>+ Add Marketer</button>
            </div>

            {/* Attendance. Deliberately says "opened the panel", never "worked":
                the ping fires when the dashboard is open, so it is attendance
                and is gameable by opening it for five seconds. A work-based
                signal was considered and postponed — see the note in
                20260817_staff_presence.sql. */}
            {(() => {
              const activeMarketers = marketers.filter(marketer => marketer.active);
              const seenToday = activeMarketers.filter(marketer => presenceView.byEmail.get(String(marketer.email ?? '').toLowerCase())?.ageDays === 0).length;
              const missing = activeMarketers.length - seenToday;
              const allIn = activeMarketers.length > 0 && missing === 0;
              return (
                <div style={{ background: allIn ? '#f0fdf4' : '#fffbeb', border: `1px solid ${allIn ? '#bbf7d0' : '#fde68a'}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: allIn ? '#15803d' : '#92400e', lineHeight: 1.55 }}>
                  <b style={{ fontSize: 14 }}>{seenToday} of {activeMarketers.length}</b> active {activeMarketers.length === 1 ? 'marketer has' : 'marketers have'} opened the panel today
                  {missing > 0 && <> · <b>{missing}</b> {missing === 1 ? 'has' : 'have'} not</>}
                  <div style={{ fontSize: 11.5, color: '#a16207', marginTop: 4 }}>
                    Opening the panel is all this measures — not calls made. Anyone showing “Not yet” simply hasn&apos;t opened it since tracking began.
                  </div>
                </div>
              );
            })()}

            {/* Self-serve signup funnel — strict-admin reads only. Historical
                marketers are backfilled, so unfinished starts at zero and only
                reflects real post-launch drop-off. */}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5, color: '#555', background: '#f7f7f8', border: '1px solid #ececed', borderRadius: 10, padding: '10px 14px' }}>
              <span><b style={{ color: '#111', fontSize: 14 }}>{marketerSignupFunnel.started}</b> entered the signup</span>
              <span><b style={{ color: '#16a34a', fontSize: 14 }}>{marketerSignupFunnel.completed}</b> became marketers</span>
              <span><b style={{ color: marketerSignupFunnel.started - marketerSignupFunnel.completed > 0 ? '#dc2626' : '#999', fontSize: 14 }}>{marketerSignupFunnel.started - marketerSignupFunnel.completed}</b> didn&apos;t finish</span>
            </div>

            {marketerLevelDropoff.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11.5, color: '#777' }}>
                <span style={{ fontWeight: 700, color: '#555' }}>Unfinished by current level</span>
                {marketerLevelDropoff.map(item => <span key={item.level} title={`${item.count} ${item.count === 1 ? 'person' : 'people'} currently at level ${item.level}`} style={{ border: '1px solid #e4e4e7', background: '#fff', borderRadius: 999, padding: '3px 8px' }}>L{item.level} <b style={{ color: '#111' }}>{item.count}</b></span>)}
              </div>
            )}

            <div style={{ background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400e', lineHeight: 1.55 }}>
              <b>How this works:</b> add a marketer here with their Google email — they can log straight into the admin panel and will only see leads assigned to them. Assignment is round-robin per event — assign marketers to events from the event-edit form. Deactivating a marketer also revokes their login.
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
                    {['Name', 'Email', 'Status', 'Last seen', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 700, color: '#666', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {marketers.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#888' }}>No marketers yet. Click "+ Add Marketer".</td></tr>
                  )}
                  {marketers.map(mk => {
                    const isNew = !mk.reviewed_at;
                    return (
                      <tr key={mk.id} style={{ borderBottom: '1px solid #f4f4f4', opacity: mk.active ? 1 : 0.5, background: isNew ? '#fffbeb' : 'transparent' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>{mk.name}{isNew && <span style={{ fontSize: 9.5, fontWeight: 800, color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', padding: '1px 6px', borderRadius: 999, letterSpacing: 0.4 }}>NEW</span>}</div>
                          <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>
                            {mk.upi_id ? <>UPI <span style={{ color: '#555', fontWeight: 600 }}>{mk.upi_id}</span></> : <span style={{ color: '#c00b0b' }}>no UPI on file</span>}
                            {mk.phone && <span> · {mk.phone}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#666' }}>{mk.email}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: mk.active ? '#dcfce7' : '#fee2e2', color: mk.active ? '#15803d' : '#b91c1c', padding: '3px 9px', borderRadius: 6, fontWeight: 700, fontSize: 11 }}>
                            {mk.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          {(() => {
                            const seen = presenceView.byEmail.get(String(mk.email ?? '').toLowerCase());
                            const age = seen?.ageDays ?? null;
                            const tone = age === null ? '#9ca3af' : age === 0 ? '#16a34a' : age <= 3 ? '#d97706' : '#dc2626';
                            const label = age === null ? 'Not yet' : age === 0 ? 'Today' : age === 1 ? 'Yesterday' : `${age} days ago`;
                            return (
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: tone, fontSize: 12.5 }}
                                     title={seen?.lastSeenAt ? `Last opened ${new Date(seen.lastSeenAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })} IST` : 'No sign-in recorded since tracking began'}>
                                  <span style={{ width: 8, height: 8, borderRadius: 999, background: tone, flex: '0 0 auto' }} />
                                  {label}
                                </div>
                                <div style={{ display: 'flex', gap: 2, marginTop: 5 }} title="Last 14 days, oldest first — a filled bar means they opened the panel that day">
                                  {presenceView.strip.map(dayKey => (
                                    <span key={dayKey} style={{ width: 6, height: 12, borderRadius: 2, background: seen?.days.has(dayKey) ? '#16a34a' : '#e5e7eb', flex: '0 0 auto' }} />
                                  ))}
                                </div>
                              </>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                          {isNew && <button style={{ ...s.outlineBtn, marginRight: 6 }} onClick={() => markMarketerReviewed({ id: mk.id, name: mk.name })}>Mark reviewed</button>}
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
            </>)}

            {/* Monthly Fixed Costs — kept last, now last within Money. Lives
                outside the money IIFE, so it defines its own ₹ formatter + reads
                the total from perfSummary. */}
            {teamMode === 'money' && (() => {
              const fcInr = (n: any) => '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
              return (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Monthly Fixed Costs</div>
                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10 }}>Recurring tools/subscriptions (AiSensy, Claude, …). These are subtracted from your monthly profit above.</div>
                <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '12px 16px' }}>
                  {fixedCosts.length === 0 && <div style={{ color: '#bbb', fontSize: 13, marginBottom: 10 }}>No fixed costs yet.</div>}
                  {fixedCosts.map(fc => (
                    <div key={fc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f5f5f0' }}>
                      <span style={{ flex: 1, fontSize: 13, color: '#111' }}>{fc.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{fcInr(fc.amount)}/mo</span>
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
                    <span style={{ fontWeight: 700, color: '#111' }}>{fcInr(perfSummary?.fixed_costs_total)}/mo</span>
                  </div>
                </div>
              </div>
              );
            })()}
          </div>
        )}

        {/* ── TEAM ▸ CREATORS: videos — who is actually working ────────────── */}
        {/* Sits ABOVE the Creators roster on purpose: the review queue is the
            daily job, so it's the first thing on the Creators page. */}
        {tab === 'marketers' && adminRole === 'admin' && teamMode === 'creators' && (() => {
          const fmtDay = (iso: string) => {
            if (!iso) return '';
            const d = new Date(iso);
            if (isNaN(d.getTime())) return '';
            return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' }).format(d);
          };
          const titleFor = (slug: string) => trips.find(t => t.slug === slug)?.title?.trim() || slug;
          const linkFor = (h: string) => `${window.location.origin}/@${h}`;
          const copyLink = (h: string) => {
            navigator.clipboard?.writeText(linkFor(h)).then(() => showToast(`Copied ${linkFor(h)}`), () => showToast('Copy failed'));
          };
          const byCreator: Record<string, CreatorVideoRow[]> = {};
          creatorVideos.forEach(v => { (byCreator[v.affiliate_id] ??= []).push(v); });
          // Only creators who have actually submitted a video show here — the
          // roster of creators who've posted nothing lives in the Creators table
          // below, so this card stays a clean review queue. Sorted by urgency:
          // whoever has an unreviewed video most recently uploaded sits at the
          // top (a fresh single upload beats a stale pile), and creators with
          // nothing left to review fall below, newest submission first. `videos`
          // arrives newest-first from the query, so [0] is the latest.
          const rows = affiliates.map(af => {
            const videos = byCreator[af.id] ?? [];
            const pendingVideos = videos.filter(v => v.status === 'pending');
            return {
              af,
              videos,
              last: videos[0]?.submitted_at ?? '',
              lastPending: pendingVideos[0]?.submitted_at ?? '',
              pending: pendingVideos.length,
            };
          }).filter(r => r.videos.length > 0)
            .sort((a, b) => {
              // Anyone with something to review outranks anyone with nothing.
              if (!!a.lastPending !== !!b.lastPending) return a.lastPending ? -1 : 1;
              // Within each group, most recent upload first.
              const aKey = a.lastPending || a.last;
              const bKey = b.lastPending || b.last;
              return (bKey || '').localeCompare(aKey || '');
            });

          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
            {/* No page title — the Creators pill above names this page. Review
                and All creators below are its two sections. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Review</div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #ececec', borderRadius: 12, overflow: 'hidden' }}>
              {rows.length === 0 && <div style={{ padding: 18, textAlign: 'center', color: '#bbb', fontSize: 13 }}>No videos submitted yet.</div>}
              {rows.map(({ af, videos, last }, idx) => {
                const open = openVideoCreator === af.id;
                const hasUnseen = videos.some(v => !v.seen_at);
                return (
                  <div key={af.id} style={{ borderTop: idx === 0 ? 'none' : '1px solid #f2f2ec', opacity: af.active ? 1 : 0.5, background: open ? '#faf9f5' : 'transparent' }}>
                    {/* Row header — the whole strip toggles the dropdown open. */}
                    <div
                      onClick={() => setOpenVideoCreator(open ? null : af.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', cursor: 'pointer' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{af.name}</span>
                          <button
                            type="button"
                            aria-label="Copy creator link"
                            title="Copy creator link"
                            onClick={e => { e.stopPropagation(); copyLink(af.handle); }}
                            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#7c8aa5', cursor: 'pointer', padding: 0, lineHeight: 0 }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                            </svg>
                          </button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 3, flexWrap: 'wrap' }}>
                          {af.phone
                            ? <a href={`tel:${af.phone}`} onClick={e => e.stopPropagation()} style={{ fontSize: 12, color: '#999', fontWeight: 500, textDecoration: 'none' }}>{af.phone}</a>
                            : <span style={{ fontSize: 12, color: '#c0c0c0' }}>no phone</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>
                        {last ? fmtDay(last) : ''}
                        {hasUnseen && <span title="Unseen video" style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />}
                      </div>

                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={open ? '#888' : '#c4c4c4'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>

                    {/* Dropdown body — the videos + review actions. */}
                    {open && (
                      <div style={{ padding: '0 16px 12px' }}>
                        {videos.length === 0 && <div style={{ fontSize: 12.5, color: '#999', padding: '8px 0' }}>No videos submitted yet.</div>}
                        {videos.map(v => (
                          <div key={v.id} style={{ borderTop: '1px solid #ececde', padding: '11px 0', display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <div style={{ fontWeight: 700, color: '#111', fontSize: 12.5 }}>
                                {titleFor(v.event_slug)} <span style={{ color: '#999', fontWeight: 500 }}>· {fmtDay(v.event_date)}</span>
                              </div>
                              {/* Mark seen on mousedown, not click: opening the link via
                                  middle-click / ⌘-click / "open in new tab" fires auxclick,
                                  not click, so an onClick handler would miss it. mousedown
                                  fires for every button before the tab opens. */}
                              <a href={v.video_url} target="_blank" rel="noopener noreferrer" onMouseDown={() => markVideoSeen(v)} onClick={e => e.stopPropagation()} style={{ fontSize: 12, color: '#6366f1', textDecoration: 'underline', wordBreak: 'break-all' }}>
                                {v.video_url}
                              </a>
                              <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>
                                sent {fmtDay(v.submitted_at)}
                                {v.status === 'approved' && <span style={{ color: '#16a34a', fontWeight: 700 }}> · approved</span>}
                                {v.status === 'changes_requested' && <span style={{ color: '#b45309', fontWeight: 700 }}> · changes requested</span>}
                                {v.review_note && <span> · “{v.review_note}”</span>}
                              </div>
                            </div>
                            {v.status === 'pending' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <input
                                  placeholder="Note (optional)"
                                  value={videoNotes[v.id] ?? ''}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => setVideoNotes(prev => ({ ...prev, [v.id]: e.target.value }))}
                                  style={{ ...s.input, marginBottom: 0, width: 180, fontSize: 12, padding: '6px 8px' }}
                                />
                                <button
                                  disabled={reviewingVideo === v.id}
                                  onClick={e => { e.stopPropagation(); void reviewCreatorVideo(v, 'approved'); }}
                                  style={{ ...s.btn('#16a34a'), padding: '5px 12px', fontSize: 12 }}
                                >
                                  Approve
                                </button>
                                <button
                                  disabled={reviewingVideo === v.id}
                                  onClick={e => { e.stopPropagation(); void reviewCreatorVideo(v, 'changes_requested'); }}
                                  style={{ ...s.outlineBtn, fontSize: 12 }}
                                >
                                  Ask changes
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
          );
        })()}

        {/* ── TEAM ▸ CREATORS: the affiliate roster ─────────────────────────── */}
        {tab === 'marketers' && adminRole === 'admin' && teamMode === 'creators' && (() => {
          // 2 decimals — matches the creator dashboard so small commissions
          // (e.g. 8% of a ₹1 ticket = ₹0.08) aren't hidden as ₹0 in Earned/Unpaid.
          const inr = (n: any) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const linkFor = (h: string) => `${window.location.origin}/@${h}`;
          const copyLink = (h: string) => {
            navigator.clipboard?.writeText(linkFor(h)).then(() => showToast(`Copied ${linkFor(h)}`), () => showToast('Copy failed'));
          };
          const creatorSearchTerm = creatorSearch.trim().toLocaleLowerCase();
          const visibleAffiliates = creatorSearchTerm
            ? affiliates.filter(af => [af.name, af.handle, af.email, af.phone, af.upi_id, af.gender]
              .some(value => String(value ?? '').toLocaleLowerCase().includes(creatorSearchTerm)))
            : affiliates;
          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20, paddingTop: 24, borderTop: '1.5px solid #eee' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {/* "All creators", not "Creators" — the page is already titled
                  Creators, and two identical headings read as a repeat. */}
              <div style={{ fontWeight: 700, fontSize: 18 }}>All creators</div>
              <span style={{ fontSize: 13, color: '#888' }}>
                {creatorSearchTerm ? `${visibleAffiliates.length} of ` : ''}{affiliates.length}
              </span>
              <div style={{ flex: 1 }} />
              <div style={{ position: 'relative', flex: '0 1 260px', minWidth: 210 }}>
                <input
                  type="search"
                  aria-label="Search creators"
                  placeholder="Search creators…"
                  value={creatorSearch}
                  onChange={e => setCreatorSearch(e.target.value)}
                  style={{ width: '100%', padding: creatorSearch ? '8px 34px 8px 12px' : '8px 12px', borderRadius: 8, border: '1.5px solid #e0e0e0', fontSize: 13, background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
                {creatorSearch && (
                  <button
                    type="button"
                    aria-label="Clear creator search"
                    onClick={() => setCreatorSearch('')}
                    style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, padding: 0, border: 0, borderRadius: 99, background: '#f1f1f1', color: '#777', fontSize: 15, lineHeight: '22px', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                )}
              </div>
              <button style={s.btn()} onClick={() => setAddingAffiliate(true)}>+ Add Creator</button>
            </div>

            {/* Signup funnel — Google accounts that entered the /creator flow vs
                finished. Only counts entries since this shipped; older creators
                are backfilled as completed, so "didn't finish" starts at 0 and
                grows only with real, post-launch drop-offs. */}
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12.5, color: '#555', background: '#f7f7f8', border: '1px solid #ececed', borderRadius: 10, padding: '10px 14px' }}>
              <span><b style={{ color: '#111', fontSize: 14 }}>{signupFunnel.started}</b> entered the signup</span>
              <span><b style={{ color: '#16a34a', fontSize: 14 }}>{signupFunnel.completed}</b> became creators</span>
              <span><b style={{ color: signupFunnel.started - signupFunnel.completed > 0 ? '#dc2626' : '#999', fontSize: 14 }}>{signupFunnel.started - signupFunnel.completed}</b> didn't finish</span>
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


            <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '8px 0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 820 }}>
                <thead>
                  <tr style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <th style={{ textAlign: 'left', padding: '8px 16px' }}>Creator</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Clicks</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Sign-ups</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Paid tickets</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Earned</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px' }}>Unpaid</th>
                    <th style={{ textAlign: 'right', padding: '8px 16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.length === 0 && <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#bbb' }}>No creators yet. Add your first one above.</td></tr>}
                  {affiliates.length > 0 && visibleAffiliates.length === 0 && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#999' }}>No creators match “{creatorSearch.trim()}”.</td></tr>}
                  {visibleAffiliates.map((af) => {
                    const st = affiliateStats[af.id] ?? { clicks: 0, apps: 0, tickets: 0, earned: 0, unpaid: 0 };
                    const conv = st.clicks > 0 ? Math.round((st.tickets / st.clicks) * 100) : null;
                    const isNew = !af.reviewed_at;
                    return (
                      <tr key={af.id} style={{ borderTop: '1px solid #f5f5f0', opacity: af.active ? 1 : 0.5, background: isNew ? '#fffbeb' : 'transparent' }}>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {af.name}
                            {isNew && <span style={{ fontSize: 9.5, fontWeight: 800, color: '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', padding: '1px 6px', borderRadius: 999, letterSpacing: 0.4 }}>NEW</span>}
                            {!af.active && <span style={{ fontSize: 10, color: '#aaa' }}>paused</span>}
                          </div>
                          <div style={{ fontSize: 12, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span>/@{af.handle}</span>
                            <button onClick={() => copyLink(af.handle)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 11, textDecoration: 'underline', padding: 0 }}>copy link</button>
                          </div>
                          <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>
                            {af.upi_id ? <>UPI <span style={{ color: '#555', fontWeight: 600 }}>{af.upi_id}</span></> : <span style={{ color: '#c00b0b' }}>no UPI on file</span>}
                            {af.phone && <span> · {af.phone}</span>}
                            {/* Blank for everyone who signed up before we asked. */}
                            {af.gender && <span> · {af.gender}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>{st.clicks}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>{st.apps}{conv != null && <span style={{ color: '#bbb', fontSize: 11 }}> · {conv}%</span>}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#111', fontWeight: 600 }}>{st.tickets}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{inr(st.earned)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: st.unpaid > 0 ? '#dc2626' : '#bbb', fontWeight: st.unpaid > 0 ? 700 : 400 }}>{inr(st.unpaid)}</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {isNew && <button style={{ ...s.outlineBtn, marginRight: 6 }} onClick={() => markAffiliateReviewed({ id: af.id, name: af.name })}>Mark reviewed</button>}
                          {st.unpaid > 0 && <button style={{ ...s.btn('#111'), padding: '4px 10px', fontSize: 12, marginRight: 6 }} onClick={() => markAffiliatePaid({ id: af.id, name: af.name, unpaid: st.unpaid })}>Mark paid</button>}
                          <button style={s.outlineBtn} onClick={() => toggleAffiliateActive(af)}>{af.active ? 'Pause' : 'Resume'}</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          );
        })()}

        {/* ── TEAM ▸ MANAGERS ────────────────────────────────────────────────
            The 6pm-IST rules engine used to be its own "Briefing" tab. Page
            order is Today's brief → Managers roster → Rulebook: the brief is
            the daily read, the roster is occasional, and the rules are tuned
            rarest of all. The roster is handed to
            ManagerPanel as `beforeRulebook` rather than rendered as a sibling,
            because Today's brief and the Rulebook share state — saving a rule
            refreshes the brief. */}
        {tab === 'marketers' && adminRole === 'admin' && teamMode === 'managers' && (
          <React.Suspense fallback={<div style={{ textAlign: 'center', color: '#aaa', marginTop: 60 }}>Loading briefing…</div>}>
            <ManagerPanel beforeRulebook={(() => {
              const inr = (n: any) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              const totalUnpaid = Object.keys(adminManagerStats).reduce((sum, k) => sum + adminManagerStats[k].unpaid, 0);
              const assignableTrips = trips.filter(t => t.slug && t.is_active);
              return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 20, paddingTop: 24, borderTop: '1.5px solid #eee' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {/* "Managers roster" — the Managers pill names the page and the
                      Daily briefing sits above, so this labels the section. */}
                  <div style={{ fontWeight: 700, fontSize: 18 }}>Managers roster</div>
                  <span style={{ fontSize: 13, color: '#888' }}>{adminManagers.length} {adminManagers.length === 1 ? 'manager' : 'managers'}</span>
                  <div style={{ flex: 1 }} />
                  <button style={s.btn()} onClick={() => setAddingManagerRow(true)}>+ Add Manager</button>
                </div>

                {addingManagerRow && (
                  <div style={{ background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 110px auto auto', gap: 10, alignItems: 'end' }}>
                    <div>
                      <label style={s.label}>Name</label>
                      <input style={s.input} placeholder="Full name" value={newManagerName} onChange={e => setNewManagerName(e.target.value)} />
                    </div>
                    <div>
                      <label style={s.label}>Google email (their login)</label>
                      <input style={s.input} placeholder="manager@gmail.com" value={newManagerEmail} onChange={e => setNewManagerEmail(e.target.value)} />
                    </div>
                    <div>
                      <label style={s.label}>₹ / ticket</label>
                      <input style={s.input} type="number" min={0} value={newManagerCommissionInput} onChange={e => setNewManagerCommissionInput(e.target.value)} onWheel={e => (e.target as HTMLInputElement).blur()} />
                    </div>
                    <button style={s.btn()} disabled={savingManagerRow} onClick={saveNewManager}>{savingManagerRow ? 'Saving…' : 'Save'}</button>
                    <button style={s.outlineBtn} onClick={() => { setAddingManagerRow(false); setNewManagerName(''); setNewManagerEmail(''); setNewManagerCommissionInput('35'); }}>Cancel</button>
                  </div>
                )}

                {totalUnpaid > 0 && (
                  <div style={{ fontSize: 13, color: '#888' }}>Outstanding to pay out across all managers: <b style={{ color: '#dc2626' }}>{inr(totalUnpaid)}</b></div>
                )}

                <div style={{ background: '#fff', border: '1.5px solid #ebebeb', borderRadius: 12, padding: '8px 0', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 760 }}>
                    <thead>
                      <tr style={{ color: '#999', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        <th style={{ textAlign: 'left', padding: '8px 16px' }}>Manager & events</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px' }}>₹/ticket</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px' }}>Paid tickets</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px' }}>Earned</th>
                        <th style={{ textAlign: 'right', padding: '8px 12px' }}>Unpaid</th>
                        <th style={{ textAlign: 'right', padding: '8px 16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminManagers.length === 0 && <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: '#bbb' }}>No managers yet. Add your first one above.</td></tr>}
                      {adminManagers.map((m) => {
                        const st = adminManagerStats[m.id] ?? { tickets: 0, earned: 0, unpaid: 0 };
                        const assigned = adminManagerEvents[m.id] ?? [];
                        return (
                          <tr key={m.id} style={{ borderTop: '1px solid #f5f5f0', opacity: m.active ? 1 : 0.5 }}>
                            <td style={{ padding: '10px 16px' }}>
                              <div style={{ fontWeight: 700, color: '#111' }}>{m.name}{!m.active && <span style={{ fontSize: 10, color: '#aaa', marginLeft: 6 }}>deactivated</span>}</div>
                              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{m.email}</div>
                              {/* Event assignment chips — the whole point of a manager */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                {assignableTrips.map(t => {
                                  const slug = t.slug!;
                                  const on = assigned.includes(slug);
                                  return (
                                    <button key={slug} type="button" disabled={!m.active}
                                      onClick={() => setManagerEvents(m.id, on ? assigned.filter(x => x !== slug) : [...assigned, slug])}
                                      style={{ padding: '4px 10px', borderRadius: 99, border: '1.5px solid ' + (on ? '#111' : '#ddd'), background: on ? '#111' : '#fff', color: on ? '#fff' : '#777', fontWeight: 600, fontSize: 11, cursor: m.active ? 'pointer' : 'not-allowed' }}>
                                      {on ? '✓ ' : ''}{t.title}
                                    </button>
                                  );
                                })}
                              </div>
                              {/* Scorecard strip — outcome + activity metrics; chips
                                  hide when there's no data behind them yet. */}
                              {(() => {
                                const sc = managerScorecards?.byId[m.id];
                                if (!sc || assigned.length === 0) return null;
                                const bench = managerScorecards!.benchmark;
                                const chip = (label: string, tone?: 'good' | 'bad') => (
                                  <span key={label} style={{ fontSize: 10, fontWeight: 600, borderRadius: 999, padding: '2px 8px', background: tone === 'good' ? '#f0fdf4' : tone === 'bad' ? '#fef2f2' : '#f5f5f5', color: tone === 'good' ? '#15803d' : tone === 'bad' ? '#b91c1c' : '#666', border: '1px solid ' + (tone === 'good' ? '#bbf7d0' : tone === 'bad' ? '#fecaca' : '#e5e5e5') }}>
                                    {label}
                                  </span>
                                );
                                const chips: React.ReactNode[] = [];
                                if (sc.fill_pct != null) chips.push(chip(`Fill ${sc.fill_pct}%`, Number(sc.fill_pct) >= 50 ? 'good' : undefined));
                                if (sc.conversion_pct != null) chips.push(chip(`Conv ${sc.conversion_pct}% (avg ${bench}%)`, Number(sc.conversion_pct) >= bench ? 'good' : 'bad'));
                                if (Number(sc.stale) > 0) chips.push(chip(`${sc.stale} stale`, 'bad'));
                                if (sc.pending_age_h != null) chips.push(chip(`Pending age ${Math.round(Number(sc.pending_age_h))}h`));
                                if (sc.recovery_pct != null) chips.push(chip(`Recovery ${sc.recovery_pct}%`));
                                if (sc.doubt_closure_pct != null) chips.push(chip(`Doubts closed ${sc.doubt_closure_pct}%`));
                                chips.push(chip(`Revenue ₹${Math.round(Number(sc.revenue)).toLocaleString('en-IN')}`));
                                chips.push(chip(`${sc.actions_7d} actions/7d`, Number(sc.actions_7d) === 0 ? 'bad' : undefined));
                                if (Number(sc.hires) > 0) chips.push(chip(`${sc.hires} hire${Number(sc.hires) === 1 ? '' : 's'}`));
                                if (sc.last_active) chips.push(chip(`Seen ${new Date(sc.last_active).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`));
                                return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>{chips}</div>;
                              })()}
                            </td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#555' }}>₹{Number(m.commission_amount)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: '#111', fontWeight: 600 }}>{st.tickets}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{inr(st.earned)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: st.unpaid > 0 ? '#dc2626' : '#bbb', fontWeight: st.unpaid > 0 ? 700 : 400 }}>{inr(st.unpaid)}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                              {st.unpaid > 0 && <button style={{ ...s.btn('#111'), padding: '4px 10px', fontSize: 12, marginRight: 6 }} onClick={() => markManagerPaid(m, st.unpaid)}>Mark paid</button>}
                              <button style={s.outlineBtn} onClick={() => toggleManagerActive(m)}>{m.active ? 'Deactivate' : 'Reactivate'}</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ fontSize: 11, color: '#bbb', lineHeight: 1.5 }}>
                  Commission accrues automatically when any ticket on their events flips to fully paid (₹/ticket set per manager; the earliest-assigned manager earns it if an event somehow has two). It's subtracted from the profit numbers above. Deactivating also removes their login — required, or they'd see every lead as a plain ops user. "Mark paid" stamps outstanding earnings as settled — the history is kept.
                </div>
              </div>
              );
            })()} />
          </React.Suspense>
        )}

        {/* ── EXPERIMENTS TAB ──────────────────────────────────────────────── */}
        {/* ── GROWTH ▸ TRENDS (same metrics per day, vs the release log) ────── */}
        {tab === 'analytics' && growthMode === 'trends' && (() => {
          // Site-wide metrics, pooled across events per day by the RPC. Ratio
          // metrics recompute from summed numerator/denominator per bucket —
          // never by averaging daily percentages (small days would distort).
          const METRICS: Record<string, { label: string; kind: 'ratio' | 'count'; num: string; den?: string }> = {
            form_completion:    { label: 'Form completion % (submitted ÷ started)', kind: 'ratio', num: 'application_submitted', den: 'application_started' },
            pricing_conversion: { label: 'Pricing → CTA conversion %',              kind: 'ratio', num: 'converted_any',         den: 'reached_pricing' },
            // Rough ratio, not a matched cohort: a payment today may belong to an
            // invite sent days earlier. Good for trend direction, not exact rates.
            invite_to_payment:  { label: 'Payments ÷ invites sent %',               kind: 'ratio', num: 'payments_success',      den: 'invites_sent' },
            date_pick:          { label: 'Calendar → date picked %',                kind: 'ratio', num: 'date_selected',         den: 'calendar_opened' },
            visitors:           { label: 'Visitors',                                kind: 'count', num: 'visitors' },
            application_started:{ label: 'Form starts',                             kind: 'count', num: 'application_started' },
            application_submitted:{ label: 'Form submits',                          kind: 'count', num: 'application_submitted' },
            apps_created:       { label: 'Applications created',                    kind: 'count', num: 'apps_created' },
            payments_success:   { label: 'Successful payments',                     kind: 'count', num: 'payments_success' },
          };
          const metricDef = METRICS[expMetric] ?? METRICS.form_completion;
          const denLabel = metricDef.den === 'application_started' ? 'starts' : metricDef.den === 'invites_sent' ? 'invites' : 'sessions';

          const byMetric: Record<string, Record<string, number>> = {};
          expDaily.forEach(r => { (byMetric[r.metric] = byMetric[r.metric] || {})[r.day] = r.value; });
          const allDays: string[] = Array.from(new Set<string>(expDaily.map(r => r.day))).sort();
          const firstDataDay = allDays[0];

          const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
          const fmtDay = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
          const weekStart = (iso: string) => { const d = new Date(iso + 'T00:00:00Z'); const dow = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - dow); return d.toISOString().slice(0, 10); };
          const bucketOf = (day: string) => expGranularity === 'daily' ? day : weekStart(day);

          // Chart window: last 8 weeks daily, everything (capped 26 weeks) weekly.
          const todayIso = new Date().toISOString().slice(0, 10);
          const cutoff = expGranularity === 'daily' ? addDays(todayIso, -56) : addDays(todayIso, -182);
          const chartDays = allDays.filter(d => d >= cutoff);
          const bucketKeys = Array.from(new Set(chartDays.map(bucketOf))).sort();
          const daysInBucket: Record<string, string[]> = {};
          chartDays.forEach(d => { const b = bucketOf(d); (daysInBucket[b] = daysInBucket[b] || []).push(d); });
          const sumIn = (metric: string, bucket: string) => (daysInBucket[bucket] || []).reduce((s, d) => s + (byMetric[metric]?.[d] ?? 0), 0);
          const points = bucketKeys.map(b => {
            const num = sumIn(metricDef.num, b);
            if (metricDef.kind === 'count') return { b, val: num as number | null, n: num };
            const den = sumIn(metricDef.den!, b);
            return { b, val: den > 0 ? (num / den) * 100 : null, n: den };
          });

          // SVG line chart geometry
          const W = 860, H = 250, PL = 46, PR = 14, PT = 30, PB = 36;
          const plotW = W - PL - PR, plotH = H - PT - PB;
          const vals = points.map(p => p.val).filter((v): v is number => v != null);
          const yMax = vals.length === 0 ? 100 : metricDef.kind === 'ratio'
            ? Math.min(100, Math.max(20, Math.ceil((Math.max(...vals) + 8) / 10) * 10))
            : Math.max(...vals) * 1.15 || 10;
          const xAt = (i: number) => PL + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
          const yAt = (v: number) => PT + plotH - (v / yMax) * plotH;
          const linePath = points.map((p, i) => (p.val == null ? null : `${xAt(i).toFixed(1)},${yAt(p.val).toFixed(1)}`)).filter(Boolean).join(' ');
          const xLabelEvery = Math.max(1, Math.ceil(points.length / 7));
          const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => yMax * f);

          // Release markers: linear date interpolation across the x-range.
          const t0 = bucketKeys.length ? new Date(bucketKeys[0]).getTime() : 0;
          const tEnd = bucketKeys.length ? new Date(bucketKeys[bucketKeys.length - 1]).getTime() : 0;
          const markerX = (iso: string): number | null => {
            if (tEnd <= t0) return null;
            const t = new Date(iso).getTime();
            if (t < t0 || t > tEnd + (expGranularity === 'weekly' ? 6 : 0) * 86400000) return null;
            return PL + Math.min(1, (t - t0) / (tEnd - t0)) * plotW;
          };
          const chartSelected: Set<number> = expChartReleases ?? new Set(expReleases.map(r => r.id));
          const toggleChartRelease = (id: number) => {
            const base = new Set(expChartReleases ?? expReleases.map(r => r.id));
            if (base.has(id)) base.delete(id); else base.add(id);
            setExpChartReleases(base);
          };
          const visibleReleases = [...expReleases]
            .filter(r => markerX(r.released_at) != null && chartSelected.has(r.id))
            .sort((a, b) => a.released_at.localeCompare(b.released_at));
          // Releases in the chart's date range but unticked — surfaced as a count
          // so a hidden marker never looks like a bug.
          const hiddenInRange = expReleases.filter(r => markerX(r.released_at) != null && !chartSelected.has(r.id)).length;
          // Same-day releases share one x — fan their numbered badges out
          // horizontally so none of them hides another (the Jul 5 email +
          // single-payment pair made a marker "disappear" before this).
          const markerPts = visibleReleases.map(r => ({ r, mx: markerX(r.released_at)! }));
          const mxTotal: Record<number, number> = {};
          markerPts.forEach(p => { const k = Math.round(p.mx); mxTotal[k] = (mxTotal[k] || 0) + 1; });
          const mxSeen: Record<number, number> = {};
          const badgePts = markerPts.map(p => {
            const k = Math.round(p.mx);
            const idx = (mxSeen[k] = (mxSeen[k] || 0) + 1) - 1;
            return { ...p, bx: p.mx + (idx - (mxTotal[k] - 1) / 2) * 20 };
          });

          // ── Before/After math ──
          const cmpRelease = expReleases.find(r => r.id === expCompareReleaseId) ?? null;
          const rangeSum = (metric: string, from: string, to: string) =>
            allDays.filter(d => d >= from && d < to).reduce((s, d) => s + (byMetric[metric]?.[d] ?? 0), 0);
          const normCdf = (z: number) => {
            const t = 1 / (1 + 0.2316419 * Math.abs(z));
            const d = 0.3989423 * Math.exp(-z * z / 2);
            const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
            return z > 0 ? 1 - p : p;
          };
          let cmp: null | {
            beforeFrom: string; afterTo: string; beforeLabel: string; afterLabel: string;
            beforeVal: number | null; afterVal: number | null; n1: number; n2: number;
            verdict: string; verdictColor: string; note: string | null;
          } = null;
          if (cmpRelease) {
            const rel = cmpRelease.released_at;
            const beforeFrom = addDays(rel, -expCompareWindow);
            const afterTo = addDays(rel, expCompareWindow);
            let note: string | null = null;
            if (firstDataDay && beforeFrom < firstDataDay) note = `Part of the "before" window predates tracking (data starts ${fmtDay(firstDataDay)}).`;
            if (afterTo > todayIso) note = `The "after" window is still filling (${Math.max(0, Math.round((new Date(afterTo).getTime() - new Date(todayIso).getTime()) / 86400000))} days to go).`;
            if (metricDef.kind === 'ratio') {
              const x1 = rangeSum(metricDef.num, beforeFrom, rel), n1 = rangeSum(metricDef.den!, beforeFrom, rel);
              const x2 = rangeSum(metricDef.num, rel, afterTo),    n2 = rangeSum(metricDef.den!, rel, afterTo);
              const p1 = n1 > 0 ? x1 / n1 : null, p2 = n2 > 0 ? x2 / n2 : null;
              let verdict = 'Too early to tell — not enough data yet.';
              let verdictColor = '#6b7280';
              if (p1 != null && p2 != null && n1 >= 20 && n2 >= 20) {
                const pPool = (x1 + x2) / (n1 + n2);
                const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
                const z = se > 0 ? (p2 - p1) / se : 0;
                const conf = 1 - 2 * (1 - normCdf(Math.abs(z)));
                const up = p2 > p1;
                if (conf >= 0.95)      { verdict = up ? 'Improved — statistically confident (95%+).' : 'Worsened — statistically confident (95%+).'; verdictColor = up ? '#16a34a' : '#dc2626'; }
                else if (conf >= 0.8)  { verdict = up ? `Looks better — not conclusive yet (${Math.round(conf * 100)}% confident).` : `Looks worse — not conclusive yet (${Math.round(conf * 100)}% confident).`; verdictColor = '#d97706'; }
                else                   { verdict = 'No clear change so far.'; verdictColor = '#6b7280'; }
              }
              cmp = {
                beforeFrom, afterTo,
                beforeLabel: `${n1} ${denLabel}`,
                afterLabel: `${n2} ${denLabel}`,
                beforeVal: p1 == null ? null : p1 * 100, afterVal: p2 == null ? null : p2 * 100,
                n1, n2, verdict, verdictColor, note,
              };
            } else {
              const daysBefore = allDays.filter(d => d >= beforeFrom && d < rel).length || 1;
              const daysAfter  = allDays.filter(d => d >= rel && d < afterTo).length || 1;
              const s1 = rangeSum(metricDef.num, beforeFrom, rel) / daysBefore;
              const s2 = rangeSum(metricDef.num, rel, afterTo) / daysAfter;
              const changePct = s1 > 0 ? Math.round(((s2 - s1) / s1) * 100) : null;
              cmp = {
                beforeFrom, afterTo, beforeLabel: 'daily average', afterLabel: 'daily average',
                beforeVal: s1, afterVal: s2, n1: daysBefore, n2: daysAfter,
                verdict: changePct == null ? 'No baseline data.' : `${changePct >= 0 ? 'Up' : 'Down'} ${Math.abs(changePct)}% vs before (raw counts — traffic swings affect this; judgement needed).`,
                verdictColor: changePct == null ? '#6b7280' : changePct >= 0 ? '#16a34a' : '#dc2626',
                note,
              };
            }
          }

          const fmtVal = (v: number | null) => v == null ? '—' : metricDef.kind === 'ratio' ? `${Math.round(v)}%` : `${Math.round(v * 10) / 10}`;
          const areaColor = (a: string | null) => a === 'form' ? '#7c3aed' : a === 'email' ? '#2563eb' : a === 'open-flow' ? '#0d9488' : a === 'payment' ? '#d97706' : '#6b7280';
          const emptyRelForm = { id: null as number | null, released_at: new Date().toISOString().slice(0, 10), title: '', area: '', description: '', expected_effect: '' };

          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                {/* No page title — the Experiments pill above names this page. */}
                <div style={{ flex: 1, minWidth: 140 }} />
                <select
                  value={expEventId}
                  onChange={e => { setExpEventId(e.target.value); loadExperiments(e.target.value); }}
                  style={{ ...s.input, width: 'auto', maxWidth: 280, fontSize: 13, fontWeight: 600, padding: '7px 10px' }}
                >
                  <option value="">All events (site-wide)</option>
                  {[...trips]
                    .sort((a, b) => (a.is_active === b.is_active) ? (a.title || '').localeCompare(b.title || '') : (a.is_active ? -1 : 1))
                    .map(t => <option key={t.id as string} value={t.id as string}>{t.title}{t.is_active ? '' : ' (inactive)'}</option>)}
                </select>
                <button style={{ ...s.btn('#111'), fontSize: 12, padding: '6px 16px' }} onClick={() => loadExperiments()} disabled={expLoading}>
                  {expLoading ? 'Loading…' : '↻ Refresh'}
                </button>
              </div>
              {expEventId !== '' && (
                <div style={{ fontSize: 12, color: '#a08050', marginBottom: 14 }}>
                  Showing <b>{trips.find(t => (t.id as string) === expEventId)?.title ?? 'selected event'}</b> only. Visitors and pageviews are tracked site-wide, so those two show no data while an event is selected.
                </div>
              )}
              <div style={{ marginBottom: 12 }} />
              {expLoading && expDaily.length === 0 && <div style={{ color: '#aaa', fontSize: 14 }}>Fetching data…</div>}

              {/* ── Metric trend with release markers ── */}
              <div style={s.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, flex: 1, minWidth: 180 }}>Metric trend</div>
                  <select value={expMetric} onChange={e => setExpMetric(e.target.value)} style={{ ...s.input, width: 'auto', fontSize: 13, fontWeight: 600, padding: '7px 10px' }}>
                    {Object.entries(METRICS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1.5px solid #e5e5e5' }}>
                    {(['weekly', 'daily'] as const).map(g => (
                      <button key={g} onClick={() => setExpGranularity(g)}
                        style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: expGranularity === g ? '#111' : '#fff', color: expGranularity === g ? '#fff' : '#666' }}>
                        {g === 'weekly' ? 'Weekly' : 'Daily'}
                      </button>
                    ))}
                  </div>
                </div>
                {points.length === 0 ? (
                  <div style={{ color: '#aaa', fontSize: 13, padding: '24px 0' }}>No snapshot data in this window yet.</div>
                ) : (
                  <>
                    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                      {yTicks.map((v, i) => (
                        <g key={i}>
                          <line x1={PL} x2={W - PR} y1={yAt(v)} y2={yAt(v)} stroke="#f0f0eb" strokeWidth={1} />
                          <text x={PL - 8} y={yAt(v) + 4} textAnchor="end" fontSize={11} fill="#999">{metricDef.kind === 'ratio' ? `${Math.round(v)}%` : Math.round(v)}</text>
                        </g>
                      ))}
                      {badgePts.map((p, i) => (
                        <g key={p.r.id}>
                          <title>{`${fmtDay(p.r.released_at)} — ${p.r.title}`}</title>
                          <line x1={p.mx} x2={p.mx} y1={PT - 4} y2={PT + plotH} stroke="#dc6b3c" strokeWidth={1.5} strokeDasharray="5 4" />
                          <circle cx={p.bx} cy={PT - 12} r={9} fill="#dc6b3c" />
                          <text x={p.bx} y={PT - 8} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">{i + 1}</text>
                        </g>
                      ))}
                      {linePath && <polyline points={linePath} fill="none" stroke="#4f46e5" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
                      {points.map((p, i) => p.val == null ? null : (
                        <circle key={p.b} cx={xAt(i)} cy={yAt(p.val)} r={3.5} fill="#4f46e5">
                          <title>{`${expGranularity === 'weekly' ? 'Week of ' : ''}${fmtDay(p.b)}: ${fmtVal(p.val)}${metricDef.kind === 'ratio' ? ` (${p.n} ${denLabel})` : ''}`}</title>
                        </circle>
                      ))}
                      {points.map((p, i) => i % xLabelEvery !== 0 ? null : (
                        <text key={p.b} x={xAt(i)} y={H - 12} textAnchor="middle" fontSize={11} fill="#999">{fmtDay(p.b)}</text>
                      ))}
                    </svg>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginTop: 10, alignItems: 'center' }}>
                      {visibleReleases.map((r, i) => (
                        <div key={r.id} style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 17, height: 17, borderRadius: 99, background: '#dc6b3c', color: '#fff', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                          {fmtDay(r.released_at)} — {r.title}
                          <button title="Hide this marker" onClick={() => toggleChartRelease(r.id)}
                            style={{ border: 'none', background: 'transparent', color: '#bbb', cursor: 'pointer', fontSize: 12, padding: '0 2px', lineHeight: 1 }}>✕</button>
                        </div>
                      ))}
                      {hiddenInRange > 0 && (
                        <div style={{ fontSize: 12, color: '#aaa' }}>
                          {hiddenInRange} marker{hiddenInRange > 1 ? 's' : ''} hidden
                          <button onClick={() => setExpChartReleases(null)}
                            style={{ border: 'none', background: 'transparent', color: '#4f46e5', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '0 4px' }}>show all</button>
                        </div>
                      )}
                      {visibleReleases.length > 1 && (
                        <button onClick={() => setExpChartReleases(new Set())}
                          style={{ border: 'none', background: 'transparent', color: '#aaa', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 }}>hide all</button>
                      )}
                    </div>
                    {metricDef.kind === 'ratio' && (
                      <div style={{ fontSize: 11, color: '#bbb', marginTop: 8 }}>
                        Hover a dot for the sample size behind it — points built on a handful of sessions swing wildly and mean little.
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* ── Before / After ── */}
              <div style={s.card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, flex: 1, minWidth: 140 }}>Before / after a release</div>
                  <select value={cmpRelease?.id ?? ''} onChange={e => setExpCompareReleaseId(e.target.value ? Number(e.target.value) : null)} style={{ ...s.input, width: 'auto', maxWidth: 340, fontSize: 13, padding: '7px 10px' }}>
                    <option value="">Choose a release…</option>
                    {expReleases.map(r => <option key={r.id} value={r.id}>{fmtDay(r.released_at)} — {r.title}</option>)}
                  </select>
                  <select value={expCompareWindow} onChange={e => setExpCompareWindow(Number(e.target.value))} style={{ ...s.input, width: 'auto', fontSize: 13, padding: '7px 10px' }}>
                    <option value={7}>7 days each side</option>
                    <option value={14}>14 days each side</option>
                    <option value={28}>28 days each side</option>
                  </select>
                </div>
                {!cmpRelease || !cmp ? (
                  <div style={{ color: '#aaa', fontSize: 13 }}>Log a release to compare around it.</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
                      <div style={{ flex: 1, minWidth: 150, background: '#fafaf7', borderRadius: 10, padding: '14px 18px' }}>
                        <div style={{ fontSize: 11, color: '#999', fontWeight: 600, marginBottom: 4 }}>BEFORE · {fmtDay(cmp.beforeFrom)} → {fmtDay(cmpRelease.released_at)}</div>
                        <div style={{ fontSize: 26, fontWeight: 800 }}>{fmtVal(cmp.beforeVal)}</div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>{cmp.beforeLabel}</div>
                      </div>
                      <div style={{ alignSelf: 'center', color: '#ccc', fontSize: 20 }}>→</div>
                      <div style={{ flex: 1, minWidth: 150, background: '#fafaf7', borderRadius: 10, padding: '14px 18px' }}>
                        <div style={{ fontSize: 11, color: '#999', fontWeight: 600, marginBottom: 4 }}>AFTER · {fmtDay(cmpRelease.released_at)} → {fmtDay(cmp.afterTo)}</div>
                        <div style={{ fontSize: 26, fontWeight: 800 }}>{fmtVal(cmp.afterVal)}</div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>{cmp.afterLabel}</div>
                      </div>
                      <div style={{ flex: 1.4, minWidth: 220, borderRadius: 10, padding: '14px 18px', border: `1.5px solid ${cmp.verdictColor}22`, background: `${cmp.verdictColor}0d` }}>
                        <div style={{ fontSize: 11, color: '#999', fontWeight: 600, marginBottom: 4 }}>VERDICT · {metricDef.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: cmp.verdictColor, lineHeight: 1.45 }}>{cmp.verdict}</div>
                        {cmp.note && <div style={{ fontSize: 11, color: '#a08050', marginTop: 6 }}>⚠ {cmp.note}</div>}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#bbb', marginTop: 10, lineHeight: 1.5 }}>
                      Other releases inside these windows also affect the numbers — check the release log for overlaps before crediting (or blaming) this one change.
                    </div>
                  </>
                )}
              </div>

              {/* ── Release log ── */}
              <div style={s.card}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>Release log</div>
                  {expSelectedReleaseIds.size > 0 && <button style={{ ...s.outlineBtn, color: '#dc2626', borderColor: '#f3d1d1', fontSize: 12, padding: '6px 12px', marginRight: 8 }} onClick={deleteSelectedExpReleases}>Delete selected ({expSelectedReleaseIds.size})</button>}
                  {!expRelForm && <button style={{ ...s.btn('#111'), fontSize: 12, padding: '6px 16px' }} onClick={() => setExpRelForm(emptyRelForm)}>+ Log a release</button>}
                </div>

                {expRelForm && (
                  <div style={{ background: '#fafaf7', borderRadius: 10, padding: 16, marginBottom: 14 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                      <div>
                        <label style={s.label}>Date</label>
                        <input type="date" style={{ ...s.input, width: 160 }} value={expRelForm.released_at} onChange={e => setExpRelForm({ ...expRelForm, released_at: e.target.value })} />
                      </div>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <label style={s.label}>What shipped</label>
                        <input style={s.input} placeholder="e.g. Shorter application form" value={expRelForm.title} onChange={e => setExpRelForm({ ...expRelForm, title: e.target.value })} />
                      </div>
                      <div>
                        <label style={s.label}>Area</label>
                        <input style={{ ...s.input, width: 140 }} placeholder="form / email / …" value={expRelForm.area} onChange={e => setExpRelForm({ ...expRelForm, area: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={s.label}>Details (optional)</label>
                      <textarea style={{ ...s.textarea, minHeight: 56 }} value={expRelForm.description} onChange={e => setExpRelForm({ ...expRelForm, description: e.target.value })} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={s.label}>What you expect it to do (optional)</label>
                      <input style={s.input} placeholder="e.g. raise form completion" value={expRelForm.expected_effect} onChange={e => setExpRelForm({ ...expRelForm, expected_effect: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={s.btn('#16a34a')} onClick={saveExpRelease} disabled={expRelSaving}>{expRelSaving ? 'Saving…' : expRelForm.id == null ? 'Save release' : 'Update release'}</button>
                      <button style={s.outlineBtn} onClick={() => setExpRelForm(null)}>Cancel</button>
                    </div>
                  </div>
                )}

                {expReleases.length === 0 && !expLoading && <div style={{ color: '#aaa', fontSize: 13 }}>Nothing logged yet.</div>}
                {expReleases.map(r => (
                  <div key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderTop: '1px solid #f2f2ed' }}>
                    <label title="Select this release for bulk actions" style={{ paddingTop: 5, cursor: 'pointer', flexShrink: 0 }}>
                      <input type="checkbox" aria-label={`Select ${r.title} for bulk actions`} checked={expSelectedReleaseIds.has(r.id)} onChange={() => toggleExpReleaseSelection(r.id)} style={{ cursor: 'pointer' }} />
                    </label>
                    <div style={{ fontSize: 12, color: '#999', fontWeight: 600, width: 64, flexShrink: 0, paddingTop: 2 }}>{fmtDay(r.released_at)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {r.title}
                        {r.area && <span style={{ fontSize: 10, fontWeight: 700, color: areaColor(r.area), background: `${areaColor(r.area)}14`, padding: '2px 8px', borderRadius: 99 }}>{r.area}</span>}
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#999', background: '#f2f2ed', padding: '2px 8px', borderRadius: 99 }}>{r.source === 'git' ? 'auto-logged' : r.source}</span>
                      </div>
                      {r.expected_effect && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Expected: {r.expected_effect}</div>}
                      {r.description && <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{r.description}</div>}
                    </div>
                    <label title="Show this release as a marker line on the trend chart" style={{ fontSize: 11, color: '#888', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', paddingTop: 6 }}>
                      <input type="checkbox" checked={chartSelected.has(r.id)} onChange={() => toggleChartRelease(r.id)} style={{ cursor: 'pointer' }} />
                      chart
                    </label>
                    <button style={{ ...s.outlineBtn, padding: '5px 12px', fontSize: 12 }} onClick={() => setExpRelForm({ id: r.id, released_at: r.released_at, title: r.title, area: r.area ?? '', description: r.description ?? '', expected_effect: r.expected_effect ?? '' })}>Edit</button>
                    <button style={{ ...s.outlineBtn, padding: '5px 12px', fontSize: 12, color: '#dc2626', borderColor: '#f3d1d1' }} onClick={() => deleteExpRelease(r.id, r.title)}>Delete</button>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 10, lineHeight: 1.5 }}>
                  Pushes to the live site are logged automatically once the GitHub automation is enabled; you can edit any entry to give it a friendlier title or note what you expected it to do. Daily numbers are snapshotted every morning at 8:05 IST and kept forever — they survive the 90-day analytics cleanup.
                </div>
              </div>

              {/* ── Test-data purger ── */}
              <div style={{ ...s.card, border: '1.5px solid #f3d1d1' }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🧹 Test-data purger</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 12, lineHeight: 1.5 }}>
                  Removes every trace of one or more phone numbers — bookings, payments, invites, doubts, commission rows — and corrects the daily metrics for the affected days. Scan first; deleting needs the passcode.
                </div>
                <textarea
                  style={{ ...s.textarea, minHeight: 60 }}
                  placeholder="Phone numbers — one per line, or separated by commas / spaces"
                  value={purgePhone}
                  onChange={e => setPurgePhone(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <button style={s.btn('#111')} onClick={scanPurgePhone} disabled={purgeBusy || parsePurgePhones(purgePhone).length === 0}>
                    {purgeBusy && !purgeScan ? 'Scanning…' : `Scan${parsePurgePhones(purgePhone).length > 1 ? ` ${parsePurgePhones(purgePhone).length} numbers` : ''}`}
                  </button>
                </div>

                {purgeScan && (() => {
                  const phones: string[] = purgeScan.phones ?? [];
                  const invalid: string[] = purgeScan.invalid ?? [];
                  const apps: any[] = purgeScan.applications ?? [];
                  const pays: any[] = purgeScan.payments ?? [];
                  const mComs: any[] = purgeScan.marketer_commissions ?? [];
                  const cComs: any[] = purgeScan.creator_commissions ?? [];
                  const others: Record<string, number> = purgeScan.other_counts ?? {};
                  const otherTotal = Object.values(others).reduce((a, b) => a + b, 0);
                  const total = apps.length + pays.length + mComs.length + cComs.length + otherTotal;
                  const successPays = pays.filter(p => String(p.status).toLowerCase() === 'success');
                  const paidOutComs = cComs.filter(c => c.paid_out);
                  const otherLabels: Record<string, string> = {
                    invited_numbers: 'invite grants', invite_payment_submissions: 'manual payment submissions',
                    doubt_submissions: 'doubts (booking)', plan_doubts: 'doubts (invite chat)',
                    doubt_conversations: 'doubt chats', bill_opens: 'bill opens',
                    push_subscriptions: 'push subscriptions', push_debug_logs: 'push debug logs',
                  };
                  const passcodeOk = /^\d{4}$/.test(purgePasscode);
                  const tag = (ph: string) => phones.length > 1 ? <span style={{ color: '#aaa' }}> · {ph}</span> : null;
                  return (
                    <div style={{ marginTop: 14 }}>
                      {invalid.length > 0 && (
                        <div style={{ fontSize: 12, color: '#a08050', marginBottom: 8 }}>
                          Skipped {invalid.length} entr{invalid.length > 1 ? 'ies' : 'y'} that {invalid.length > 1 ? 'were' : 'was'} not a 10-digit number: {invalid.join(', ')}
                        </div>
                      )}
                      {total === 0 ? (
                        <div style={{ fontSize: 13, color: '#888' }}>Nothing found for {phones.join(', ')} — already clean.</div>
                      ) : (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                            Found {total} row{total > 1 ? 's' : ''} across {phones.length} number{phones.length > 1 ? 's' : ''} ({phones.join(', ')}):
                          </div>
                          {apps.map((a, i) => (
                            <div key={`a${i}`} style={{ fontSize: 12.5, color: '#555', padding: '3px 0' }}>
                              📋 Application — {a.event} · {a.name} · <b>{a.status}</b> · {a.created}{tag(a.phone)}
                            </div>
                          ))}
                          {pays.map((p, i) => {
                            const ok = String(p.status).toLowerCase() === 'success';
                            return (
                              <div key={`p${i}`} style={{ fontSize: 12.5, color: ok ? '#b91c1c' : '#555', padding: '3px 0', fontWeight: ok ? 600 : 400 }}>
                                💳 Payment — {p.event} · ₹{Number(p.amount).toLocaleString('en-IN')} · {p.status} · {p.created}{tag(p.phone)}
                              </div>
                            );
                          })}
                          {mComs.map((c, i) => (
                            <div key={`m${i}`} style={{ fontSize: 12.5, color: '#555', padding: '3px 0' }}>
                              🧑‍💼 Marketer commission — {c.marketer ?? 'unknown'} · ₹{Number(c.amount).toLocaleString('en-IN')} · {c.accrued}{tag(c.phone)}
                            </div>
                          ))}
                          {cComs.map((c, i) => (
                            <div key={`c${i}`} style={{ fontSize: 12.5, color: c.paid_out ? '#b91c1c' : '#555', padding: '3px 0', fontWeight: c.paid_out ? 600 : 400 }}>
                              🎨 Creator commission — {c.creator ?? 'unknown'} · ₹{Number(c.amount).toLocaleString('en-IN')} · {c.accrued} · {c.paid_out ? 'ALREADY PAID OUT' : 'pending'}{tag(c.phone)}
                            </div>
                          ))}
                          {Object.entries(others).filter(([, n]) => n > 0).map(([k, n]) => (
                            <div key={k} style={{ fontSize: 12.5, color: '#555', padding: '3px 0' }}>
                              🗂 {n} × {otherLabels[k] ?? k}
                            </div>
                          ))}
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px', margin: '12px 0', fontSize: 12, color: '#991b1b', lineHeight: 1.55 }}>
                            {successPays.length > 0 && <div><b>⚠ {successPays.length} successful payment{successPays.length > 1 ? 's' : ''}</b> — deleting removes your record of real money; it does NOT refund anything, and PayU's own dashboard will still show the transaction.</div>}
                            {paidOutComs.length > 0 && <div><b>⚠ {paidOutComs.length} creator commission{paidOutComs.length > 1 ? 's' : ''} already paid out</b> — deleting corrects future stats but can't undo the transfer you made.</div>}
                            <div>Deletion is permanent. This does not touch anonymous click-tracking (no phone attached) or WhatsApp/emails already sent.</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <input
                              style={{ ...s.input, width: 150, letterSpacing: 4, textAlign: 'center' }}
                              placeholder="Passcode"
                              value={purgePasscode}
                              inputMode="numeric"
                              maxLength={4}
                              type="password"
                              autoComplete="off"
                              onChange={e => setPurgePasscode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              onKeyDown={e => { if (e.key === 'Enter' && passcodeOk && !purgeBusy) runPurgePhone(); }}
                            />
                            <button
                              style={{ ...s.btn('#dc2626'), opacity: passcodeOk ? 1 : 0.4 }}
                              onClick={runPurgePhone}
                              disabled={purgeBusy || !passcodeOk}
                            >
                              {purgeBusy ? 'Deleting…' : `Delete all ${total} rows`}
                            </button>
                            <button style={s.outlineBtn} onClick={() => { setPurgeScan(null); setPurgePasscode(''); }}>Cancel</button>
                          </div>
                          <div style={{ fontSize: 11, color: '#bbb', marginTop: 6 }}>The passcode gates deletion so a shared admin login can't wipe data — enter it to confirm.</div>
                        </>
                      )}
                    </div>
                  );
                })()}

                {purgeResult && (
                  <div style={{ marginTop: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, color: '#166534', lineHeight: 1.6 }}>
                    <b>Purged.</b>{' '}
                    {Object.entries(purgeResult as Record<string, any>)
                      .filter(([k, n]) => k !== 'resnapshotted_days' && k !== 'phones' && typeof n === 'number' && n > 0)
                      .map(([k, n]) => `${n} × ${k.replace(/_/g, ' ')}`)
                      .join(' · ') || 'No rows matched.'}
                    {Number(purgeResult.resnapshotted_days) > 0 && ` — daily metrics recalculated for ${purgeResult.resnapshotted_days} day${Number(purgeResult.resnapshotted_days) > 1 ? 's' : ''}`}.
                    {' '}Logged in the admin audit trail.
                  </div>
                )}
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
                {thisDeviceEndpoint && !notifDevices.some(d => d.endpoint === thisDeviceEndpoint) && !notifDevicesLoading && notifDevices.length > 0 && (
                  <p style={{ fontSize: 12.5, color: '#b45309', marginBottom: 8 }}>
                    ⚠️ This device is not currently subscribed — tap "Enable on This Device" above.
                  </p>
                )}
                {notifDevices.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, background: '#f5f5f5', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{d.label}</span>
                      {d.endpoint === thisDeviceEndpoint && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#166534', background: '#dcfce7', borderRadius: 99, padding: '2px 8px', marginLeft: 8 }}>This device</span>
                      )}
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
function MarketerAssignment({ eventSlug, isOpenEvent, marketers, selectedIds, onChange, commission, onSaveCommission, onReshuffle, reshuffling, onOpen, s }: {
  eventSlug: string;
  isOpenEvent: boolean;
  marketers: Array<{ id: string; name: string; email: string; reviewed_at: string | null }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  commission: number | null;
  onSaveCommission: (val: number | null) => void;
  onReshuffle: () => void;
  reshuffling: boolean;
  onOpen?: () => void;
  s: any;
}) {
  React.useEffect(() => { onOpen?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter(x => x !== id));
    else onChange([...selectedIds, id]);
  };
  // Local edit buffer for the commission input; blank = use the ₹50 default.
  const [commInput, setCommInput] = React.useState(commission == null ? '' : String(commission));
  React.useEffect(() => { setCommInput(commission == null ? '' : String(commission)); }, [commission]);
  const parsedComm = commInput.trim() === '' ? null : Number(commInput);
  const commValid = parsedComm == null || (Number.isFinite(parsedComm) && parsedComm >= 0);
  const commDirty = commValid && parsedComm !== commission;
  return (
    <div style={{ marginTop: 18, padding: 16, background: '#fafafa', borderRadius: 12, border: '1.5px solid #eee' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1 }}>
          Marketers on this event
        </div>
        {/* Force an even round-robin re-deal of all unpaid leads across the
            selected marketers. Deliberately moves in-progress leads, so the
            handler confirms first. Paid leads never move. */}
        <button
          type="button"
          onClick={onReshuffle}
          disabled={reshuffling || selectedIds.length === 0}
          title={selectedIds.length === 0 ? 'Assign at least one marketer first' : 'Re-split all unpaid leads evenly across the selected marketers'}
          style={{
            padding: '6px 12px', borderRadius: 99, border: '1.5px solid #d7d7d7',
            background: '#fff', color: '#555', fontWeight: 700, fontSize: 12,
            cursor: (reshuffling || selectedIds.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (reshuffling || selectedIds.length === 0) ? 0.55 : 1, whiteSpace: 'nowrap',
          }}
        >
          {reshuffling ? 'Reshuffling…' : '↻ Reshuffle leads'}
        </button>
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
                {!mk.reviewed_at && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 850, color: on ? '#111' : '#b45309', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 999, padding: '1px 5px', verticalAlign: 1 }}>NEW</span>}
              </button>
            );
          })}
        </div>
      )}
      {isOpenEvent && selectedIds.length === 0 && (
        <div role="alert" style={{ marginTop: 10, padding: '9px 11px', borderRadius: 9, border: '1px solid #fcd34d', background: '#fffbeb', color: '#92400e', fontSize: 11.5, fontWeight: 650, lineHeight: 1.45 }}>
          This open event has no marketer. New leads will stay unowned until you select at least one.
        </div>
      )}
      <div style={{ fontSize: 11, color: '#888', marginTop: 10 }}>
        New applications round-robin among the selected marketers. Existing unassigned/unconverted leads auto-redistribute when you change this list.
      </div>

      {/* Per-event commission — what each marketer earns per fully-paid ticket
          on THIS event. Blank = the ₹50 default. */}
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #ededed' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Commission per ticket
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, color: '#111' }}>
            ₹<input
              type="number" min={0} value={commInput}
              placeholder="50"
              onChange={e => setCommInput(e.target.value)}
              onWheel={e => (e.target as HTMLInputElement).blur()}
              style={{ width: 90, padding: '6px 8px', border: '1.5px solid ' + (commValid ? '#ddd' : '#dc2626'), borderRadius: 6, fontSize: 14, textAlign: 'right' }}
            />
            <span style={{ fontSize: 13, color: '#888' }}>/ ticket</span>
          </span>
          {commDirty && (
            <button
              type="button"
              onClick={() => onSaveCommission(parsedComm)}
              style={{ ...s.btn('#111'), padding: '6px 12px', fontSize: 12 }}
            >
              Save
            </button>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>
          {isOpenEvent
            ? 'This is the full fee. Fully-paid sales with a doubt, abandonment, or failed payment earn this amount; clean self-serve sales earn half, rounded to the nearest rupee.'
            : 'Paid to the assigned marketer only when a ticket is fully paid. Leave blank to use the ₹50 default.'}
          {' '}Changing this affects future sales only — commissions already earned keep their old rate.
        </div>
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

  // Capacity-driven flag (used by the Trip Dates "Spots auto" layout below).
  // Both invite (native-application) and open (payu-hosted) events auto-flip
  // date status from the paid count, so neither shows the manual status dropdown.
  // Mirrors the customer-side `capEligible` in AppFlow.tsx.
  const isCapEligible = trip.booking_url === 'native-application' || trip.booking_url === 'payu-hosted';

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
                    onClick={() => {
                      // Pay at venue is a split-only modifier. Clear it when the
                      // event switches to single payment so a hidden `true` can't
                      // linger and surprise us if the mode is switched back later.
                      const payAtVenue = option.mode === 'split' ? (trip.pay_at_venue ?? false) : false;
                      onChange(
                        trip.booking_url === 'native-application'
                          // Switching payment mode rebuilds the timeline to the new
                          // mode's structure (single = entry payment; split = advance +
                          // balance) so it can't keep stale rows from the old mode.
                          ? { ...trip, payment_mode: option.mode, pay_at_venue: payAtVenue, booking_steps: regenNativeBookingSteps(trip.booking_steps, option.mode === 'full', trip.title ?? '', payAtVenue) }
                          : { ...trip, payment_mode: option.mode, pay_at_venue: payAtVenue }
                      );
                    }}
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

            {/* Pay at venue — a modifier on Split only. The balance is still an
                online PayU payment; it's just made at the event, on the guest's
                phone, instead of days beforehand. Nested inside the Payment Mode
                block so the dependency on Split is visually obvious. */}
            {(trip.payment_mode ?? 'split') === 'split' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: 10, background: trip.pay_at_venue ? '#eef2ff' : '#fafafa' }}>
                <button
                  type="button"
                  onClick={() => {
                    // Toggling PAV reshapes a native (invite) event's timeline in
                    // place — swap the meeting-spot row for the group-chat step (on)
                    // or restore it (off) — so the stored steps never drift from the
                    // toggle. Per-date timelines still heal on their next Save in
                    // Flow ▸ Timelines. Non-native events only flip the flag.
                    const next = !trip.pay_at_venue;
                    onChange(
                      trip.booking_url === 'native-application' && (trip.payment_mode ?? 'split') !== 'full'
                        ? { ...trip, pay_at_venue: next, booking_steps: regenNativeBookingSteps(trip.booking_steps, false, trip.title ?? '', next) }
                        : { ...trip, pay_at_venue: next }
                    );
                  }}
                  style={{ position: 'relative', width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', background: trip.pay_at_venue ? '#6366f1' : '#ccc', transition: 'background 0.15s', flexShrink: 0 }}
                  aria-pressed={!!trip.pay_at_venue}
                  aria-label="Pay at Venue"
                >
                  <span style={{ position: 'absolute', top: 3, left: trip.pay_at_venue ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.15s' }} />
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>
                    {trip.pay_at_venue ? 'Pay at Venue — on' : 'Pay at Venue — off'}
                  </div>
                  <div style={{ fontSize: 11, color: '#888' }}>
                    Guests pay the balance on their phone at the event instead of before it. The balance due date is ignored.
                  </div>
                </div>
              </div>
            )}
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
                <div style={{ display: 'grid', gap: 5, justifyItems: 'end', flexShrink: 0 }}>
                  {/* Flat ₹ per ticket is the primary control: one number the
                      creator can be told, identical across cities and ticket types. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>₹</span>
                    <input
                      type="number" min={0} step={1}
                      onWheel={e => (e.target as HTMLInputElement).blur()}
                      value={trip.affiliate_commission ?? 0}
                      onChange={e => set('affiliate_commission', Number(e.target.value))}
                      style={{ width: 72, padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, fontWeight: 700, textAlign: 'right' }}
                    />
                    <span style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>per ticket</span>
                  </div>
                  {/* Percentage stays as the fallback for events where a flat fee
                      makes no sense (a ₹35 fee on a ₹19,000 trip would be 0.2%). */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, opacity: Number(trip.affiliate_commission ?? 0) > 0 ? 0.45 : 1 }}>
                    <span style={{ fontSize: 11, color: '#888' }}>or</span>
                    <input
                      type="number" min={0} max={100} step={0.5}
                      onWheel={e => (e.target as HTMLInputElement).blur()}
                      value={trip.affiliate_commission_pct ?? 8}
                      onChange={e => set('affiliate_commission_pct', Number(e.target.value))}
                      style={{ width: 52, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 6, fontSize: 11.5, textAlign: 'right' }}
                    />
                    <span style={{ fontSize: 11, color: '#888' }}>% — used only when ₹ is 0</span>
                  </div>
                </div>
              )}
            </div>

            {/* The starter task: which event a brand-new creator must make their
                first video for. Only meaningful while commissions are on. */}
            {trip.affiliate_enabled && (
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 8, padding: '8px 14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!trip.affiliate_starter_task}
                  onChange={e => set('affiliate_starter_task', e.target.checked)}
                  style={{ marginTop: 2, width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
                />
                <span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#111' }}>Starter task for new creators</span>
                  <span style={{ display: 'block', fontSize: 11, color: '#888', lineHeight: 1.5, marginTop: 2 }}>
                    New creators are asked for a video on this event only. Everything else opens up to them once you approve their first video, so a first attempt never goes out on a big trip. Tick this on your cheapest, most frequent event.
                  </span>
                </span>
              </label>
            )}
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
            <div style={{ display: 'grid', gridTemplateColumns: isCapEligible ? '1fr auto auto' : '1fr 1fr auto', gap: 8, alignItems: 'center' }}>
              <input type="date" style={s.input} value={d.start_date} onChange={e => setDate(i, 'start_date', e.target.value)} />
              {isCapEligible ? (
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
