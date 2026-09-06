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

// Meta supports each Graph API version for "at least two years", and the
// Conversions API rides that cycle. v21.0 dates from late 2024, which put it
// close enough to end-of-life to be a bad thing to start spending ad money on:
// if it sunsets, every server event fails at once and the only symptom is
// conversions quietly stopping. v25.0 is the version Meta's own current docs
// use in their examples.
//
// Nothing in our payload is version-specific — em/ph/fn/ln/ct/country,
// external_id, fbc/fbp, event_id and custom_data are all long-standing fields —
// so the bump is a URL change, not a migration.
//
// Worth re-checking roughly yearly. If Meta's docs stop showing this version in
// their examples, it is time to move again.
const API_VERSION = 'v25.0';

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

// Should this test booking be withheld from Meta?
//
// Normally yes — that is the whole point of the guard above. The exception is
// while META_CAPI_TEST_CODE is set, because otherwise the guard makes the send
// path untestable: the only bookings we are allowed to fake are exactly the ones
// that never leave. You cannot verify a pipe you are forbidden to put water in.
//
// So with a test code present, test phones are let through and land in Events
// Manager → Test Events, where the payload, the match keys and the browser/server
// deduplication can all be read directly.
//
// KNOWN AND ACCEPTED: this is not a sandbox. Meta is explicit that events sent
// with test_event_code "are not dropped ... they flow into Events Manager and are
// used for targeting and ads measurement purposes". A test booking run this way
// is a real conversion in the dataset and a real member of the website audience.
// That is the price of an end-to-end test, and it is only payable while the code
// is set — unset it and the guard closes again with no code change.
function skipAsTestBooking(normalisedPhone: string | null): boolean {
  if (!isTestPhone(normalisedPhone)) return false;
  if (Deno.env.get('META_CAPI_TEST_CODE')) {
    console.warn('[meta-capi] TEST PHONE allowed through because META_CAPI_TEST_CODE is set — this WILL count as a real conversion');
    return false;
  }
  return true;
}

// Names and city: lowercase, letters only. Meta strips punctuation, spaces and
// accents before hashing on their side, so we must match that exactly or the
// hashes simply never line up — which fails silently and looks like working.
// The accent range is written as \u escapes on purpose. It used to be a pair of
// LITERAL combining characters (U+0300-U+036F) sitting inside the character
// class — invisible in every editor, and indistinguishable from a typo or from
// nothing at all. The range is identical either way, so this changes no
// behaviour; it removes a failure mode. If those bytes were ever dropped by a
// copy-paste, an editor normalising the file, or a build transform, the regex
// would quietly stop stripping accents, "josé" and "jose" would hash
// differently, and Meta would simply stop matching those customers — with no
// error anywhere. Same reason the rest of this file is loud about failures:
// silent mismatches are the expensive kind.
//
// Must stay byte-identical in meaning to normalisePart() in src/metaPixel.ts —
// if the two sides normalise differently they hash differently, and one person
// reaches Meta as two.
function normaliseNamePart(raw: string | null | undefined): string | null {
  const v = (raw ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
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

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

// Falls back to now outside Meta's accepted range. A slightly late timestamp
// beats a rejected sale. An hour of margin keeps us off the boundary, and a
// future time — clock skew on either side — is clamped for the same reason.
function safeEventTime(eventTime: number | null | undefined): number {
  const now = Math.floor(Date.now() / 1000);
  if (!eventTime || !Number.isFinite(eventTime)) return now;
  const age = now - eventTime;
  if (age > SEVEN_DAYS_SECONDS - 3600 || age < -3600) return now;
  return eventTime;
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

// ─── Shared plumbing ─────────────────────────────────────────────────────────
//
// Every event type sends the same identity block to the same endpoint, so
// Purchase and Lead share these two functions instead of each keeping a copy.
// Two copies is exactly how a browser and a server end up normalising a name
// differently, and that failure is silent: Meta accepts the event and quietly
// matches nobody. One implementation, or none.

/** The identity half of an event — the same shape whatever the event is. */
export type MetaIdentity = {
  email?: string | null;
  phone?: string | null;
  /** Full name as captured; split into fn/ln here. */
  name?: string | null;
  city?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  /** The real _fbc cookie, when the browser had one. */
  fbc?: string | null;
  /** Raw fbclid + when we first saw it, to rebuild fbc when the cookie is gone. */
  fbclid?: string | null;
  fbclidSeenAt?: string | null;
  fbp?: string | null;
};

async function buildUserData(p: MetaIdentity): Promise<Record<string, unknown>> {
  const email = normaliseEmail(p.email);
  const phone = normalisePhone(p.phone);
  const { fn, ln } = splitName(p.name);
  const city = normaliseNamePart(p.city);
  // The browser's own cookie is the truth. Rebuild only when it is missing,
  // which is the ad-blocked case — there the fbclid in the URL is all anyone
  // has, and a rebuilt fbc still beats none.
  const fbc = p.fbc ?? buildFbc(p.fbclid, p.fbclidSeenAt);

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
  // MUST stay the identical string the browser hashes — see setPixelUserData in
  // src/metaPixel.ts — or one person reaches Meta as two.
  if (phone) user_data.external_id = [await sha256Hex(phone)];
  if (p.clientIp) user_data.client_ip_address = p.clientIp;
  if (p.userAgent) user_data.client_user_agent = p.userAgent;
  // fbc/fbp are the ONLY user_data fields Meta wants raw, never hashed.
  if (fbc) user_data.fbc = fbc;
  if (p.fbp) user_data.fbp = p.fbp;
  return user_data;
}

/**
 * Posts one event. Never throws, never blocks longer than META_TIMEOUT_MS, and
 * no-ops entirely when META_CAPI_ACCESS_TOKEN is unset — so shipping this cannot
 * change behaviour on its own.
 */
async function postEventToMeta(opts: {
  eventName: string;
  /** Dedup key. Must equal the browser event's eventID exactly, or one action counts twice. */
  eventId: string;
  eventTime?: number | null;
  sourceUrl?: string | null;
  userData: Record<string, unknown>;
  customData?: Record<string, unknown>;
  /** True only when Meta confirmed it counted the event. Callers that keep a
   *  "still owed" marker rely on this being pessimistic: anything short of an
   *  explicit success is false, so a retry is preferred over a silent loss. */
}): Promise<boolean> {
  const tag = `${opts.eventName} ${opts.eventId}`;
  try {
    const token = Deno.env.get('META_CAPI_ACCESS_TOKEN');
    if (!token) {
      // Deliberately loud. This used to return silently, which on 2026-08-20 made
      // a missing token indistinguishable from a slow Meta API for half an hour of
      // debugging. A misconfiguration should say so.
      console.warn('[meta-capi] META_CAPI_ACCESS_TOKEN is not set — NOT reported', tag);
      return false;
    }

    const pixelId = Deno.env.get('META_PIXEL_ID') ?? DEFAULT_PIXEL_ID;
    // Set this to run events into Events Manager → Test events without
    // polluting live totals. Unset it once verified.
    // Makes the event visible in Events Manager -> Test Events, which is how you
    // confirm a send worked and that browser/server deduplicate.
    //
    // IT IS NOT A SANDBOX, despite the name. Meta is explicit: "Events sent with
    // test_event_code are not dropped. They flow into Events Manager and are used
    // for targeting and ads measurement purposes." So a test booking still counts
    // as a real conversion and still lands in audiences — the code is a debugging
    // VIEW, not isolation.
    //
    // The only real isolation is the test-phone guard above, and that skips the
    // send entirely, so it cannot be used to test the send itself. A genuine
    // end-to-end test therefore costs one real event in the dataset; budget for
    // that rather than believing it is free.
    const testCode = Deno.env.get('META_CAPI_TEST_CODE');
    if (testCode) {
      console.warn('[meta-capi] TEST MODE — visible in Test Events, but STILL counts live', tag);
    }

    const payload: Record<string, unknown> = {
      data: [{
        event_name: opts.eventName,
        // Meta: "event_time can be up to 7 days before you send an event ... If any
        // event_time in data is greater than 7 days in the past, we return an
        // error for the ENTIRE request and process no events." A stale or
        // clock-skewed value costs the whole event rather than degrading it.
        event_time: safeEventTime(opts.eventTime),
        event_id: opts.eventId,
        action_source: 'website',
        event_source_url: opts.sourceUrl ?? 'https://chaptera.in/',
        user_data: opts.userData,
        ...(opts.customData ? { custom_data: opts.customData } : {}),
      }],
    };
    if (testCode) payload.test_event_code = testCode;

    // Which identifiers actually went. Names only, never values — this is a
    // production log and user_data holds hashed personal data. This one line is
    // what turns "did the match keys ship?" from a guess into a fact.
    const sentKeys = Object.keys(opts.userData).sort().join(',');

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
      console.error('[meta-capi] REJECTED', tag, res.status, await res.text().catch(() => ''));
      return false;
    }

    // A 200 is not proof the event counted. Meta's documented success body is
    // {"events_received": 1, "messages": [], "fbtrace_id": ...} — and it can
    // come back 200 with events_received: 0, or with a non-empty messages
    // array carrying a validation warning. Reading only res.ok would log both
    // of those as "sent".
    //
    // Worth the extra parse: these logs are the fastest way to tell whether an
    // event reached Meta, and on 2026-08-24 a missing log line is exactly what
    // exposed verify-pending-payments never calling this module at all. A log
    // that can say "fine" when it isn't is worse than no log.
    const body = await res.json().catch(() => null) as
      { events_received?: number; messages?: unknown[] } | null;
    const received = body?.events_received;
    const messages: unknown[] = Array.isArray(body?.messages) ? (body as any).messages : [];
    if (received === 0 || messages.length > 0) {
      console.error('[meta-capi] ACCEPTED BUT NOT COUNTED', tag,
        'events_received=' + String(received), 'messages=' + JSON.stringify(messages));
      return false;
    }
    console.log('[meta-capi] sent', tag,
      'events_received=' + String(received ?? '?'), 'keys=' + sentKeys);
    return true;
  } catch (err) {
    // A timeout is a different problem from a malformed payload, and saying which
    // saves the next debugging session.
    const timedOut = err instanceof Error && err.name === 'TimeoutError';
    if (timedOut) {
      console.error(`[meta-capi] TIMEOUT after ${META_TIMEOUT_MS}ms — caller not delayed further`, tag);
    } else {
      console.error('[meta-capi] send failed', tag, err);
    }
    return false;
  }
}

/**
 * Reports one Purchase to Meta. Resolves quietly on every failure path.
 * No-ops entirely when META_CAPI_ACCESS_TOKEN is unset, so this is inert until
 * the token is added — deploying it cannot change behaviour on its own.
 */
export async function sendPurchaseToMeta(args: CapiPurchaseArgs): Promise<void> {
  try {
    if (!args.txnid) return;

    // The token and test-mode warnings now live in postEventToMeta, so every
    // event type reports a misconfiguration the same way. Deliberately checked
    // AFTER the guards below: there is nothing to warn about for an event we
    // were never going to send.

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
    const phone = normalisePhone(args.phone);
    if (skipAsTestBooking(phone)) {
      // Logged, not silent: a test that never shows up in Meta should be
      // explainable from the function logs rather than looking like a bug.
      console.log('[meta-capi] test booking, not reported to Meta', args.txnid);
      return;
    }

    await postEventToMeta({
      eventName: 'Purchase',
      // Shared with the browser event so Meta counts this sale once.
      eventId: args.txnid,
      // PayU's own stamp for when the payment happened, not when we noticed it.
      eventTime: args.eventTime,
      sourceUrl: args.sourceUrl,
      userData: await buildUserData(args),
      customData: {
        currency: args.currency ?? 'INR',
        value: Number(args.value) || 0,
        content_type: 'product',
        // Meta lists order_id as a standard purchase parameter: "the order ID
        // for this transaction as a string". Sent for reporting and for tracing
        // a disputed sale back to a PayU row.
        //
        // It does NOT deduplicate anything for us, despite the obvious guess.
        // Meta's end-to-end guide is explicit that order_id-based purchase
        // deduplication "is limited to select Meta partners", so the field is
        // accepted and recorded but that behaviour is not switched on for a
        // normal advertiser. event_id (the same txnid) is what actually
        // collapses our browser/server pair, and it stays the only dedup key
        // worth reasoning about here.
        order_id: String(args.txnid),
        ...(args.eventSlug ? { content_ids: [args.eventSlug] } : {}),
        ...(args.eventTitle ? { content_name: args.eventTitle } : {}),
      },
    });
  } catch (err) {
    console.error('[meta-capi] purchase send failed', args.txnid, err);
  }
}

// ─── Lead ────────────────────────────────────────────────────────────────────
//
// WHY A SERVER-SIDE LEAD EXISTS
// Invite-only events are optimised on Lead, not Purchase, because payment there
// is a separate admin-gated step that lands much later — measured on
// anna-nagar-meetup, 48% of paid bookings completed more than 24 h after the
// application and 17% took over a week. The application IS the conversion the ad
// produced; the payment is a downstream business step.
//
// That makes Lead the number Meta bids against for those campaigns, so it has to
// be as complete as Purchase is. The browser alone cannot deliver that: roughly
// half of visitors block fbevents.js outright. Routing the same event through our
// own domain reaches Meta for exactly those people, because an ad blocker that
// blocks connect.facebook.net has no reason to block our backend.
//
// The identity here is the best we ever have: the applicant has just typed their
// name, phone, email and city into the form. Where a mid-funnel event would reach
// Meta nearly anonymous, a Lead carries a full match set.
export type CapiLeadArgs = MetaIdentity & {
  /**
   * Dedup key, shared with the browser Lead's eventID. Unlike Purchase there is
   * no natural transaction id, so the client generates a UUID and sends the same
   * one both ways — Meta explicitly permits "a random number (so long as the same
   * random number is sent between browser and server events)".
   */
  leadId: string;
  eventSlug?: string | null;
  eventTitle?: string | null;
  sourceUrl?: string | null;
  /** When the application was submitted, unix seconds. Defaults to now. */
  eventTime?: number | null;
};

/**
 * Reports one Lead. Same contract as sendPurchaseToMeta: never throws, never
 * blocks longer than META_TIMEOUT_MS, and inert without META_CAPI_ACCESS_TOKEN.
 */
export async function sendLeadToMeta(args: CapiLeadArgs): Promise<boolean> {
  try {
    if (!args.leadId) return false;

    const phone = normalisePhone(args.phone);
    if (skipAsTestBooking(phone)) {
      // Reported as success on purpose: a test application is not owed to Meta,
      // so the caller should stamp it done rather than retry it every sweep.
      console.log('[meta-capi] test application, Lead not reported to Meta', args.leadId);
      return true;
    }

    return await postEventToMeta({
      eventName: 'Lead',
      eventId: args.leadId,
      eventTime: args.eventTime,
      sourceUrl: args.sourceUrl,
      userData: await buildUserData(args),
      customData: {
        content_type: 'product',
        ...(args.eventSlug ? { content_ids: [args.eventSlug] } : {}),
        ...(args.eventTitle ? { content_name: args.eventTitle } : {}),
        // Deliberately NO value/currency. Meta bids proportionally to whatever
        // value is supplied, so inventing a rupee figure for an application —
        // which may never be paid, and on invite events often is not — would
        // teach it to chase the wrong applicants. An unvalued Lead optimises on
        // count, which is exactly what was asked for.
      },
    });
  } catch (err) {
    console.error('[meta-capi] lead send failed', args.leadId, err);
    return false;
  }
}
