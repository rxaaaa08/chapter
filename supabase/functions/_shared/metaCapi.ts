// Meta Conversions API — server-side Purchase reporting.
//
// WHY THIS EXISTS
// Measured on 2026-08-15: the browser pixel captured 6 of 13 real payments —
// about 46%. Two failure modes stack on top of each other:
//
//   1. The tracker is blocked outright for roughly half of visitors (ad
//      blockers, Safari tracking prevention, iOS ATT, hardened browsers). Those
//      people browse and buy completely normally and are invisible to Meta.
//   2. The browser Purchase fires on the PayU RETURN screen. A customer who
//      closes the tab after paying, or who returns through a UPI app into a
//      different browser context, never loads that screen — so nothing fires
//      even when the pixel is working perfectly.
//
// Our server knows about every payment regardless of what the customer's
// browser did. That is the only place a complete Purchase signal can come from.
//
// DEDUPLICATION — the thing that must not be got wrong
// The browser and the server both report the same sale. Meta collapses them
// only if they share an event_id, and we use the PayU txnid for exactly that.
// Without it a single ticket counts twice, which would halve the apparent cost
// per purchase — the one number this whole exercise exists to measure.
//
// This module is fire-and-forget by contract: it must never throw and never
// delay a payment redirect. Losing an ad event is acceptable; delaying a
// customer's receipt is not.

const API_VERSION = 'v21.0';

// The customer's redirect to their receipt waits on this call. Without a deadline
// a slow or hanging graph.facebook.com sits in front of the receipt for as long as
// the platform allows — and an ad event is never worth making someone stare at a
// blank page straight after paying. Three seconds is far above Meta's normal
// response time, so a healthy call is unaffected and only a genuine stall is cut.
const META_TIMEOUT_MS = 3000;

// Same dataset as the browser pixel (src/metaPixel.ts). Env-overridable so a
// future staging dataset doesn't need a code change.
const DEFAULT_PIXEL_ID = '28370453785913523';

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Meta matches on normalised-then-hashed values. Getting the normalisation
// wrong doesn't error — it just silently fails to match anyone, which is worse
// than an error because it looks like it works.
function normaliseEmail(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim().toLowerCase();
  return v.includes('@') ? v : null;
}

// We store phones as bare last-10-digits; Meta wants country code, digits only.
function normalisePhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? '').replace(/\D/g, '');
  if (!digits) return null;
  const ten = digits.slice(-10);
  if (ten.length !== 10) return null;
  return `91${ten}`;
}

// Test bookings must never reach the ad dataset. `npm run dev` talks to the
// PRODUCTION database, so an internal test pays through real PayU and produces a
// real callback — from here it is indistinguishable from a customer, and Meta
// would happily learn to go looking for more buyers who behave like us. Worse,
// the value is fake (the 15 Aug test was Rs 1.02), so it also poisons the
// purchase value Meta optimises toward.
//
// 90000000xx is the project's standing test-phone convention (CLAUDE.md). After
// normalisePhone that becomes 9190000000 + two digits.
//
// LIMIT, stated plainly: this only protects tests that FOLLOW the convention. A
// test booked on a real phone still reaches Meta — the 15 Aug one would have.
// Code can enforce the habit, not replace it.
const TEST_PHONE_PREFIX = '9190000000';

function isTestPhone(normalisedPhone: string | null): boolean {
  return normalisedPhone !== null && normalisedPhone.startsWith(TEST_PHONE_PREFIX);
}

// Names and city: lowercase, letters only. Meta strips punctuation, spaces and
// accents before hashing on their side, so we must match that exactly or the
// hashes simply never line up — which fails silently and looks like working.
function normaliseNamePart(raw: string | null | undefined): string | null {
  const v = (raw ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z]/g, '');
  return v.length ? v : null;
}

// "Krutesh A" → { fn: 'krutesh', ln: 'a' }. Single-word names give fn only —
// sending a blank ln is worse than sending none (Meta scores empty fields as
// supplied-but-unmatched). 45% of our bookings carry a second name part.
function splitName(full: string | null | undefined): { fn: string | null; ln: string | null } {
  const parts = (full ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { fn: null, ln: null };
  if (parts.length === 1) return { fn: normaliseNamePart(parts[0]), ln: null };
  return {
    fn: normaliseNamePart(parts[0]),
    ln: normaliseNamePart(parts[parts.length - 1]),
  };
}

// Meta's click id is NOT the raw fbclid — it wants fb.<subdomainIndex>.<ms>.<fbclid>.
// subdomainIndex is 1 for a normal apex domain like chaptera.in. The timestamp is
// when we first observed the click, which src/attribution.ts stores as landed_at.
// Sending a bare fbclid here is a common and invisible mistake: Meta accepts the
// field and then matches nothing.
function buildFbc(fbclid: string | null | undefined, landedAt: string | null | undefined): string | null {
  if (!fbclid) return null;
  const ms = landedAt ? Date.parse(landedAt) : NaN;
  const stamp = Number.isFinite(ms) ? ms : Date.now();
  return `fb.1.${stamp}.${fbclid}`;
}

// PayU stamps every result with `addedon`, e.g. "2026-08-21 00:42:07". That is
// the moment the payment actually happened, and it is IST with NO offset in the
// string — parsing it as UTC would shift every event by 5.5 hours.
//
// Worth using instead of "now": the callback fires seconds after payment, but the
// webhook can arrive much later, and Meta attributes on event_time. Exported so
// payu-callback and payu-webhook cannot drift apart on the parsing rule.
export function payuAddedOnToUnix(addedOn: string | null | undefined): number | null {
  if (!addedOn) return null;
  const ms = Date.parse(`${String(addedOn).trim().replace(' ', 'T')}+05:30`);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
}

export type CapiPurchaseArgs = {
  /** PayU txnid — doubles as the dedup key against the browser event. */
  txnid: string;
  value: number;
  currency?: string;
  email?: string | null;
  phone?: string | null;
  eventSlug?: string | null;
  eventTitle?: string | null;
  /** The page the customer was on. Meta wants a real URL for website events. */
  sourceUrl?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  /** Full name as captured at booking; split into fn/ln here. */
  name?: string | null;
  /** applications.selected_city — present on 100% of rows. */
  city?: string | null;
  /** Raw fbclid from applications.attribution, plus when we saw it. */
  fbclid?: string | null;
  fbclidSeenAt?: string | null;
  /**
   * The real _fbc cookie captured at checkout. Preferred over rebuilding from
   * fbclid: a rebuild has to invent the timestamp portion, so the browser and
   * the server would report two different strings for the same click.
   */
  fbc?: string | null;
  /**
   * 'advance' | 'full' | 'balance'. A balance payment is the second half of a
   * split booking and must NOT report a Purchase — see the guard below.
   */
  paymentType?: string | null;
  /**
   * When the payment actually happened, unix seconds (from PayU's `addedon` via
   * payuAddedOnToUnix). Falls back to now — right for the callback, wrong for a
   * webhook that arrives late.
   */
  eventTime?: number | null;
  /**
   * Meta's _fbp browser cookie, captured at checkout by the payment page and
   * parked on payu_payments.fbp — the server cannot read it itself. Matters
   * most for buyers who never clicked an ad (no fbclid, so no fbc): it is the
   * only thing tying the sale back to the browser that saw the ad in-feed.
   */
  fbp?: string | null;
};

/**
 * Reports one Purchase to Meta. Resolves quietly on every failure path.
 * No-ops entirely when META_CAPI_ACCESS_TOKEN is unset, so this is inert until
 * the token is added — deploying it cannot change behaviour on its own.
 */
export async function sendPurchaseToMeta(args: CapiPurchaseArgs): Promise<void> {
  try {
    const token = Deno.env.get('META_CAPI_ACCESS_TOKEN');
    if (!token) {
      // Deliberately loud. This used to return silently, which on 2026-08-20 made
      // a missing token indistinguishable from a slow Meta API for half an hour of
      // debugging. A misconfiguration should say so.
      console.warn('[meta-capi] META_CAPI_ACCESS_TOKEN is not set — Purchase NOT reported', args.txnid);
      return;
    }
    if (!args.txnid) return;

    const pixelId = Deno.env.get('META_PIXEL_ID') ?? DEFAULT_PIXEL_ID;
    // Set this to run events into Events Manager → Test events without
    // polluting live totals. Unset it once verified.
    const testCode = Deno.env.get('META_CAPI_TEST_CODE');
    if (testCode) {
      // Equally silent and equally confusing: with this set, events land in Test
      // Events and never count toward live totals or match quality.
      console.warn('[meta-capi] TEST MODE — event goes to Test Events, NOT live totals', args.txnid);
    }

    // A balance payment is the SECOND half of a split booking, not a new sale.
    //
    // Both halves used to report a Purchase, so one customer produced two. Across
    // 60 days that was 89 real bookings turning into 113 events — a 27% inflated
    // conversion count, which makes cost per purchase read about 21% cheaper than
    // it is. Optimising against that number means overspending on the strength of
    // sales that were already counted.
    //
    // The ad earned the booking at the FIRST payment; the balance is collection
    // from a customer we already won. So the acquisition is reported once, when
    // it happens.
    //
    // Known trade-off, deliberately taken: Meta therefore sees the advance
    // (₹102) rather than the full ticket (₹299) for split events, so revenue is
    // understated there. That is the safe direction — the alternative is booking
    // money before it is collected, and a no-show would make it a lie. Count
    // accuracy drives bidding; value accuracy can be revisited when there is real
    // spend to judge it against.
    if ((args.paymentType ?? '').toLowerCase() === 'balance') {
      console.log('[meta-capi] balance payment, already counted at booking', args.txnid);
      return;
    }

    const email = normaliseEmail(args.email);
    const phone = normalisePhone(args.phone);
    if (isTestPhone(phone)) {
      // Logged, not silent: a test that never shows up in Meta should be
      // explainable from the function logs rather than looking like a bug.
      console.log('[meta-capi] test booking, not reported to Meta', args.txnid);
      return;
    }

    // Every identifier we can supply raises Event Match Quality, which is what
    // decides whether Meta can tie a sale to a person — and therefore to an ad.
    // At 6.2/10 Meta often knew a purchase happened but not who made it.
    const { fn, ln } = splitName(args.name);
    const city = normaliseNamePart(args.city);
    // The browser's own cookie is the truth. Rebuild only when it is missing,
    // which is the ad-blocked case — there the fbclid in the URL is all anyone
    // has, and a rebuilt fbc still beats none.
    const fbc = args.fbc ?? buildFbc(args.fbclid, args.fbclidSeenAt);

    const user_data: Record<string, unknown> = {};
    if (email) user_data.em = [await sha256Hex(email)];
    if (phone) user_data.ph = [await sha256Hex(phone)];
    if (fn) user_data.fn = [await sha256Hex(fn)];
    if (ln) user_data.ln = [await sha256Hex(ln)];
    if (city) user_data.ct = [await sha256Hex(city)];
    // Every customer is Indian; the field still has to be hashed like the rest.
    user_data.country = [await sha256Hex('in')];
    // A stable per-person id. Phone is our real user key (applications.id is
    // per-event, so it would look like a different person on every booking).
    if (phone) user_data.external_id = [await sha256Hex(phone)];
    if (args.clientIp) user_data.client_ip_address = args.clientIp;
    if (args.userAgent) user_data.client_user_agent = args.userAgent;
    // fbc/fbp are the ONLY user_data fields Meta wants raw, never hashed.
    if (fbc) user_data.fbc = fbc;
    if (args.fbp) user_data.fbp = args.fbp;

    const payload: Record<string, unknown> = {
      data: [{
        event_name: 'Purchase',
        event_time: args.eventTime && Number.isFinite(args.eventTime)
          ? args.eventTime
          : Math.floor(Date.now() / 1000),
        // Shared with the browser event so Meta counts this sale once.
        event_id: args.txnid,
        action_source: 'website',
        event_source_url: args.sourceUrl ?? 'https://chaptera.in/',
        user_data,
        custom_data: {
          currency: args.currency ?? 'INR',
          value: Number(args.value) || 0,
          content_type: 'product',
          ...(args.eventSlug ? { content_ids: [args.eventSlug] } : {}),
          ...(args.eventTitle ? { content_name: args.eventTitle } : {}),
        },
      }],
    };
    if (testCode) payload.test_event_code = testCode;

    // Which identifiers actually went. Names only, never values — this is a
    // production log and user_data holds hashed personal data. This one line is
    // what turns "did Phase A work?" from a guess into a fact.
    const sentKeys = Object.keys(user_data).sort().join(',');

    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(META_TIMEOUT_MS),
      },
    );

    if (!res.ok) {
      // Log and move on. A rejected ad event must never surface to the customer.
      console.error('[meta-capi] REJECTED', args.txnid, res.status, await res.text().catch(() => ''));
    } else {
      console.log('[meta-capi] sent', args.txnid, 'keys=' + sentKeys);
    }
  } catch (err) {
    // A timeout is a different problem from a malformed payload, and saying which
    // saves the next debugging session.
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    if (timedOut) {
      console.error(`[meta-capi] TIMEOUT after ${META_TIMEOUT_MS}ms — receipt not delayed further`, args.txnid);
    } else {
      console.error('[meta-capi] send failed', args.txnid, err);
    }
  }
}
