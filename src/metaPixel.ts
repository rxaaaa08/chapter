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
    fbq?: ((...args: any[]) => void) & { callMethod?: (...args: any[]) => void; queue?: any[] };
    _fbq?: unknown;
  }
}

function isCustomerRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return !NON_CUSTOMER_PREFIXES.some(p => path === p || path.startsWith(p + '/') || path.startsWith(p + '?'));
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
export function trackPixel(eventName: string, params: PixelParams = {}, opts: { custom?: boolean } = {}): void {
  try {
    if (!isPixelConfigured() || typeof window === 'undefined' || !window.fbq) return;
    if (!isCustomerRoute()) return;
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') clean[k] = v;
    }
    window.fbq(opts.custom ? 'trackCustom' : 'track', eventName, clean);
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

    trackPixel('Purchase', { currency: 'INR', ...params });

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
