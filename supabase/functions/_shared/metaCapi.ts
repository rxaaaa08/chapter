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
  /** Meta's browser cookie. Not yet captured — see Phase B in meta-ads-sop.md. */
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
    if (!token) return; // not configured yet — stay silent, don't warn per payment
    if (!args.txnid) return;

    const pixelId = Deno.env.get('META_PIXEL_ID') ?? DEFAULT_PIXEL_ID;
    // Set this to run events into Events Manager → Test events without
    // polluting live totals. Unset it once verified.
    const testCode = Deno.env.get('META_CAPI_TEST_CODE');

    const email = normaliseEmail(args.email);
    const phone = normalisePhone(args.phone);

    // Every identifier we can supply raises Event Match Quality, which is what
    // decides whether Meta can tie a sale to a person — and therefore to an ad.
    // At 6.2/10 Meta often knew a purchase happened but not who made it.
    const { fn, ln } = splitName(args.name);
    const city = normaliseNamePart(args.city);
    const fbc = buildFbc(args.fbclid, args.fbclidSeenAt);

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
        event_time: Math.floor(Date.now() / 1000),
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

    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      // Log and move on. A rejected ad event must never surface to the customer.
      console.error('[meta-capi] non-ok', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error('[meta-capi] send failed', err);
  }
}
