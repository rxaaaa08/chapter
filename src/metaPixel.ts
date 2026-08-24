// Meta (Facebook) Pixel — ad attribution for the customer funnel.
//
// WHY THIS EXISTS
// flow_analytics (see trackEvent in supabase.ts) records what visitors DO, in
// good detail, but it has two holes that make paid ads unmeasurable:
//   1. it stops dead at external_redirect_initiated — the handoff to PayU. The
//      payment itself lands in applications/payu_payments, which share no join
//      key with flow_analytics (no session_id there, no phone here). So a
//      browsing session can never be traced to a sale.
//   2. it carries no traffic source at all — no utm, no referrer.
// Meta also needs a Purchase signal of its own before it can optimise delivery
// toward buyers, and mid-funnel signals to compare creatives back when purchase
// volume is still too low to read (~8 purchases vs ~50 calendar opens).
//
// SAFETY
// Deliberately a thin, total-no-op-when-unconfigured wrapper. Every call is
// wrapped and swallowed: an unset id, a blocked tracker, an ad-blocker, or a
// script that never loaded must NEVER be able to break a booking. This file is
// allowed to lose data; it is not allowed to throw.

// Events Manager → Datasets → "chaptera.in website" (created 2026-08-12).
// Deliberately a SEPARATE dataset from "WhatsApp Marketing Messages"
// (892500220416246), which belongs to the AiSensy integration that carries the
// booking OTP — ad tracking must never share plumbing with that.
// Empty string = the pixel is completely inert, nothing is loaded or sent.
export const META_PIXEL_ID = '28370453785913523';

// Routes that must never load an advertising tracker: the staff/creator
// surfaces are logged-in tools, not customer funnel. Mirrors the guard already
// used for page_view in App.tsx.
const NON_CUSTOMER_PREFIXES = ['/admin', '/creator', '/team'];

declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & {
      callMethod?: (...args: any[]) => void;
      queue?: any[];
      /** Meta's flag to suppress automatic PageView on history changes. */
      disablePushState?: boolean;
    };
    _fbq?: unknown;
  }
}

function isCustomerRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return !NON_CUSTOMER_PREFIXES.some(p => path === p || path.startsWith(p + '/') || path.startsWith(p + '?'));
}

// The dataset must hold customers, not us. `npm run dev` serves this exact app
// against the PRODUCTION Supabase, so without this guard every local test session
// reports into the same dataset that decides where ad money goes: 14 events
// arrived from `localhost` between 12 and 17 Aug 2026, and some of them are
// sitting in the website-visitors audience right now, ready to be retargeted.
//
// Gated on the hostname rather than import.meta.env.DEV so that a preview
// deployment, a LAN address, or a local production build is inert too — only the
// real site should ever be able to write here.
const PRODUCTION_HOSTS = ['chaptera.in', 'www.chaptera.in'];

function isProductionHost(): boolean {
  if (typeof window === 'undefined') return false;
  return PRODUCTION_HOSTS.includes(window.location.hostname);
}

export function isPixelConfigured(): boolean {
  return META_PIXEL_ID.trim().length > 0;
}

// Injects Meta's base snippet and fires the initial PageView. Safe to call more
// than once — the id check and the window.fbq guard both short-circuit.
export function initMetaPixel(): void {
  try {
    if (!isPixelConfigured() || typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!isCustomerRoute()) return;
    // Not the live site → never load the tracker at all. Guarding the loader is
    // sufficient: trackPixel() short-circuits on a missing window.fbq, so no
    // downstream event can fire either.
    if (!isProductionHost()) return;

    // Before anything else, and deliberately before the `window.fbq` early
    // return: fbevents.js loads asynchronously and may never record the click,
    // so stamp the cookie from the URL while the landing URL is still current.
    ensureFbcCookie();

    if (window.fbq) return;

    // Meta's standard loader, transcribed rather than eval'd from a string so
    // it type-checks and no CSP-unfriendly inline script is needed.
    const stub: any = function (...args: any[]) {
      stub.callMethod ? stub.callMethod.apply(stub, args) : stub.queue.push(args);
    };
    stub.push = stub;
    stub.loaded = true;
    stub.version = '2.0';
    stub.queue = [];
    // Stop Meta counting a "page view" every time the URL changes.
    //
    // fbevents.js hooks the History API and fires its own PageView on every
    // history.pushState. Most sites push a handful of times per visit; we push
    // on EVERY sheet and step, because the Instagram back button only works
    // when each layer owns a distinct URL (62 pushState/replaceState sites
    // across App.tsx + AppFlow.tsx). The result, measured 16-19 Aug 2026: Meta
    // logged 1,001 PageViews against our 351 — it was counting interactions,
    // not visits, and tracked our TOTAL event count (1,102) instead.
    //
    // Set on the stub BEFORE init, which is the only point it is read.
    //
    // Deliberately NOT the broader `fbq('set','autoConfig',false)`: that would
    // also switch off automatic advanced matching, which is helping the very
    // match-quality score Phase A exists to raise.
    //
    // Affects reporting only. Our own pushState calls, popstate handling and
    // the layer stack are untouched — Meta stops emitting an event, the browser
    // still gets its history entry.
    stub.disablePushState = true;
    window.fbq = stub;
    window._fbq = stub;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);

    window.fbq('init', META_PIXEL_ID);
  } catch {
    // never block the page
  }
}

// ─── Advanced Matching — identity on the BROWSER event ───────────────────────
//
// Our server event carries eleven identifiers. The browser event carried none of
// the personal ones: it said, in effect, "someone on this device bought
// something". For Purchase that barely matters — Meta merges the deduplicated
// pair and the server's identity wins. It matters for every OTHER event, because
// Lead, InitiateCheckout and the rest have no server counterpart at all and
// reach Meta completely anonymous.
//
// Values are passed in PLAIN here on purpose: Meta's own script SHA-256 hashes
// them inside the page before anything is sent, so no readable personal data
// crosses the network. We still normalise first, identically to the server
// (supabase/functions/_shared/metaCapi.ts) — if the two sides normalise
// differently they hash differently and describe two different people.
//
// Meta documents user data only as the third argument to init. Re-calling init
// with the same pixel id is the accepted way to supply it once the customer
// identifies, and is verified here not to emit an extra PageView.
export type PixelUserData = {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  city?: string | null;
};

function normalisePart(raw: string | null | undefined): string {
  return (raw ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

export function setPixelUserData(u: PixelUserData): void {
  try {
    if (!isPixelConfigured() || typeof window === 'undefined' || !window.fbq) return;
    if (!isCustomerRoute() || !isProductionHost()) return;

    const data: Record<string, string> = {};

    const email = (u.email ?? '').trim().toLowerCase();
    if (email.includes('@')) data.em = email;

    // Same shape the server sends: country code, digits only.
    const digits = (u.phone ?? '').replace(/\D/g, '');
    const ten = digits.slice(-10);
    if (ten.length === 10) {
      data.ph = `91${ten}`;
      // Must be the SAME string the server hashes for external_id, or the two
      // events describe two different people instead of one.
      data.external_id = `91${ten}`;
    }

    const parts = (u.name ?? '').trim().split(/\s+/).filter(Boolean);
    if (parts.length) {
      const fn = normalisePart(parts[0]);
      if (fn) data.fn = fn;
      // A single-word name gives fn only — a blank ln is scored as
      // supplied-but-unmatched, which is worse than sending nothing.
      if (parts.length > 1) {
        const ln = normalisePart(parts[parts.length - 1]);
        if (ln) data.ln = ln;
      }
    }

    const city = normalisePart(u.city);
    if (city) data.ct = city;

    // Nothing identifying means nothing worth re-initialising for.
    if (!Object.keys(data).length) return;
    data.country = 'in';

    window.fbq('init', META_PIXEL_ID, data);
  } catch {
    // never block a booking
  }
}

export type PixelParams = {
  content_name?: string;
  content_ids?: string[];
  content_category?: string;
  content_type?: string;
  city?: string;
  value?: number;
  currency?: string;
  // Book Now vs Contact Us. Both fire ONE InitiateCheckout so Meta optimises on
  // the combined signal (the founder's call — a bigger pool reads better at low
  // budget), but the button is kept as a parameter so the two can still be told
  // apart later without a re-instrumentation.
  cta_type?: 'book' | 'contact';
};

// `custom: true` routes through trackCustom — required for any event name that
// isn't one of Meta's standard ones.
//
// `eventID` is the deduplication key. Our server reports the same Purchase via
// the Conversions API (supabase/functions/_shared/metaCapi.ts); Meta collapses
// the pair only when both carry the same id. Omitting it would double-count
// every sale reported twice and halve the apparent cost per purchase.
export function trackPixel(
  eventName: string,
  params: PixelParams = {},
  opts: { custom?: boolean; eventID?: string } = {},
): void {
  try {
    if (!isPixelConfigured() || typeof window === 'undefined' || !window.fbq) return;
    if (!isCustomerRoute()) return;
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') clean[k] = v;
    }
    if (opts.eventID) {
      window.fbq(opts.custom ? 'trackCustom' : 'track', eventName, clean, { eventID: opts.eventID });
    } else {
      window.fbq(opts.custom ? 'trackCustom' : 'track', eventName, clean);
    }
  } catch {
    // never block the page
  }
}

// Purchase must fire exactly once per transaction. The PayU return screen can
// re-render, be refreshed, or be reached again via history, so the txnid is
// remembered in localStorage — sessionStorage would let a refresh in a new tab
// double-count, and double-counted purchases corrupt the very CAC number this
// whole exercise exists to establish.
const PURCHASE_DEDUP_KEY = 'ca_fb_purchase_sent';

export function trackPurchaseOnce(txnid: string, params: PixelParams): void {
  try {
    if (!txnid || !isPixelConfigured()) return;
    let sent: string[] = [];
    try {
      sent = JSON.parse(localStorage.getItem(PURCHASE_DEDUP_KEY) || '[]');
    } catch {
      sent = [];
    }
    if (!Array.isArray(sent)) sent = [];
    if (sent.includes(txnid)) return;

    // eventID = txnid, matching what payu-callback and payu-webhook send to the
    // Conversions API for this same sale. All three paths may fire; Meta keeps
    // one. The local dedup above only stops THIS browser repeating itself — it
    // knows nothing about the server, so the shared id is what actually
    // guarantees one sale is counted once.
    trackPixel('Purchase', { currency: 'INR', ...params }, { eventID: txnid });

    // Keep the tail short — this is a dedup guard, not a history.
    try {
      localStorage.setItem(PURCHASE_DEDUP_KEY, JSON.stringify([...sent, txnid].slice(-25)));
    } catch {
      // storage full / disabled — the event already fired, which is the priority
    }
  } catch {
    // never block the receipt
  }
}

// ─── _fbp — Meta's first-party browser cookie ────────────────────────────────
//
// fbevents.js writes _fbp on our own domain the first time the pixel loads, and
// keeps it for 90 days. It is the strongest matching signal available for a
// visitor who arrived WITHOUT clicking an ad (so there is no fbclid to build an
// fbc from) but who has seen our ads in-feed: it lets Meta tie the sale back to
// the same browser it showed the ad to.
//
// The browser Purchase already carries this automatically — fbevents.js attaches
// it without being asked. Our SERVER event does not, because the server never
// sees the cookie. That is the whole gap this closes: the payments where the
// browser event never fires (tab closed on PayU, UPI handoff into another
// browser) currently reach Meta with no fbp at all, and those are exactly the
// payments only the server can report.
//
// Only present when the pixel actually loaded, so an ad-blocked visitor has
// none. That is expected and fine: this raises match quality for the half of
// visitors we can see; it does not pretend to recover the half we can't. We
// never synthesise a value — an invented fbp matches nobody and quietly drags
// the match-quality score down.
// fb.<subdomainIndex>.<creationTimeMs>.<id>, with an OPTIONAL trailing appendix.
//
// Meta's parameter-builder documentation gives the canonical format as
// `fb.1.1554763741205.AbCdEf.ABcDEFGh` — an 8-character appendix identifying the
// SDK version and language. fbevents writes the four-part form today, but a
// five-part value is valid and our old pattern rejected it outright, which would
// have silently dropped fbp/fbc rather than erroring. Accept both.
//
// Deliberately NOT case-insensitive and never lowercased: Meta states "_fbc is
// case sensitive; do not normalize or format the _fbc to lowercase."
const FBP_PATTERN = /^fb\.\d+\.\d+\.[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)?$/;

function readMetaCookie(name: '_fbp' | '_fbc'): string | null {
  try {
    if (typeof document === 'undefined') return null;
    const hit = document.cookie
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith(`${name}=`));
    if (!hit) return null;
    const value = decodeURIComponent(hit.slice(name.length + 1)).trim();
    // Shape-check rather than trust: a malformed or truncated cookie is worse
    // than no cookie, because Meta counts a supplied-but-unmatchable field
    // against the score instead of ignoring it.
    if (value.length > 200 || !FBP_PATTERN.test(value)) return null;
    return value;
  } catch {
    // cookie access can throw in restricted/embedded contexts — never block pay
    return null;
  }
}

// Remember the FIRST _fbp / _fbc seen this visit.
//
// Meta is explicit: "Capture cookies early ... Ideally retrieve _fbp and _fbc
// cookies when loading your landing page. Do not retrieve them ONLY from
// down-funnel events." We were doing exactly that — reading them at checkout and
// nowhere else — so anything that changed the cookie between landing and payment
// (Safari ITP capping it, a cleared cookie, a second ad click arriving with a
// different fbclid) meant we sent a value that no longer described the visit that
// actually earned the sale.
//
// Session-scoped. Holds the first value seen so there is something to fall back
// on if the cookie disappears later — see the precedence note on getFbp/getFbc
// for why the LIVE cookie still wins when both exist.
const META_IDS_KEY = 'ca_meta_ids';

function rememberFirst(field: 'fbp' | 'fbc', value: string | null): void {
  if (!value) return;
  try {
    const store = JSON.parse(sessionStorage.getItem(META_IDS_KEY) || '{}');
    if (store[field]) return; // already captured earlier in the visit
    store[field] = value;
    sessionStorage.setItem(META_IDS_KEY, JSON.stringify(store));
  } catch {
    // storage disabled — fall back to reading the cookie live
  }
}

function recalled(field: 'fbp' | 'fbc'): string | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(META_IDS_KEY) || '{}')[field];
    return typeof v === 'string' && v.length ? v : null;
  } catch {
    return null;
  }
}

// Call on landing. fbevents writes _fbp asynchronously after its script loads, so
// the caller retries shortly after — whichever call sees a value first wins.
export function captureMetaIds(): boolean {
  rememberFirst('fbp', readMetaCookie('_fbp'));
  rememberFirst('fbc', readMetaCookie('_fbc'));
  // Caller stops polling once both exist. Measured on a real page load: _fbc
  // appears immediately (we write it), but fbevents took ~5s to write _fbp — a
  // single early retry missed it entirely.
  return !!(recalled('fbp') && recalled('fbc'));
}

// PRECEDENCE: the live cookie wins; the stored landing value is only a fallback.
//
// Tempting to prefer the value captured at landing, but that is wrong for fbc.
// Meta's own rule overwrites _fbc whenever a DIFFERENT fbclid arrives, so the
// cookie always holds the most recent click — and the most recent click is the
// one that earned the sale. Verified live: landing on ad A then ad B leaves the
// cookie on B while the session store still holds A. Sending A would credit the
// wrong ad.
//
// The stored value earns its place when the cookie is GONE at checkout — Safari
// capping it, a clear, an embedded browser losing it — which is exactly the loss
// Meta's "capture cookies early" guidance is about.
export function getFbp(): string | null {
  const live = readMetaCookie('_fbp');
  rememberFirst('fbp', live);
  return live ?? recalled('fbp');
}

// Meta's click id, as fbevents itself recorded it.
//
// The server can rebuild this from the fbclid in applications.attribution, and
// still does when the cookie is missing. But a rebuild has to invent the
// timestamp portion — it uses when WE saw the landing, while fbevents used when
// IT saw the click. Same click, two different strings, one reported by the
// browser and the other by the server.
//
// fbc is the field that ties a sale to an ad, so it is worth having both sides
// say exactly the same thing. Read the real cookie when it exists; fall back to
// the reconstruction when the pixel was blocked, where the URL parameter is all
// anyone has.
export function getFbc(): string | null {
  const live = readMetaCookie('_fbc');
  rememberFirst('fbc', live);
  return live ?? recalled('fbc');
}

// Write _fbc ourselves when the pixel hasn't.
//
// WHY THIS IS NEEDED
// fbevents normally turns an fbclid in the URL into an _fbc cookie by itself,
// and on a normal browser it does — verified on the live site. But on the real
// booking of 2026-08-21 it did not: the visit arrived from l.instagram.com with
// a valid fbclid, _fbp was written, and _fbc never appeared. Instagram's in-app
// browser is where most of our customers actually are, so "usually works" is not
// good enough for the one field that ties a sale to an ad.
//
// The server already covers itself by rebuilding fbc from
// applications.attribution.fbclid. The BROWSER event has no such fallback — it
// can only read the cookie — so without this, click id reaches Meta from one
// source instead of two on our main traffic source.
//
// Meta sanctions this: "If the _fbc cookie is not available ... it is still
// possible to send the fbc event parameter ... if an fbclid query parameter is
// in the URL." Format and expiry below are theirs.
const FBC_MAX_AGE_SECONDS = 90 * 24 * 60 * 60; // Meta's stated 90 days

// Meta: "'com' = 0, 'example.com' = 1, 'www.example.com' = 2" — i.e. the number
// of dot-separated parts minus one. chaptera.in is 1, www.chaptera.in is 2.
function subdomainIndex(): number {
  const parts = window.location.hostname.split('.').filter(Boolean);
  return Math.max(1, parts.length - 1);
}

export function ensureFbcCookie(): void {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!isCustomerRoute() || !isProductionHost()) return;

    // NEVER invent a click id. No fbclid means this visitor did not arrive from
    // Meta, and a fabricated fbc would attribute a sale to an ad they never saw.
    const fbclid = new URLSearchParams(window.location.search).get('fbclid')?.trim();
    if (!fbclid || !/^[A-Za-z0-9_-]+$/.test(fbclid) || fbclid.length > 500) return;

    // Meta's rule: only write when there is no cookie, or when the URL carries a
    // DIFFERENT click than the one already stored (a genuinely new ad click).
    // Re-stamping an unchanged click would just move its timestamp for nothing.
    const existing = readMetaCookie('_fbc');
    if (existing && existing.split('.').slice(3).join('.') === fbclid) return;

    document.cookie = `_fbc=fb.${subdomainIndex()}.${Date.now()}.${fbclid}`
      + `; path=/; max-age=${FBC_MAX_AGE_SECONDS}; SameSite=Lax; Secure`;
  } catch {
    // cookie access can throw in restricted contexts — never block the page
  }
}
