// Traffic-source attribution — client side.
//
// WHY THIS EXISTS
// Until now nothing anywhere recorded WHERE a visitor came from: flow_analytics
// carries no referrer or utm, and applications only knew about creator refs
// (affiliate_code). That made the single most important question about paid ads
// unanswerable — "which bookings did this ad actually produce?" — because ad
// spend is known exactly (Ads Manager) but tickets-from-ads was a guess.
//
// This is what gives us a TRUE cost per ticket, independent of Meta. Meta's own
// number will always read low: iOS limits what it may report, ad blockers strip
// the pixel, and a UPI-app handoff can return the customer in a different
// browser context with the click cookie gone. The row in our own database has
// none of those problems.
//
// SESSION-SCOPED, deliberately — same rule as affiliate.ts. A visitor who
// returns days later with no ad parameters in the URL is not credited to that
// ad. We would rather under-credit paid than invent conversions for it.
import { getAffiliateRef } from './affiliate';

const KEY = 'ca_attribution';

// Anything longer is either a mistake or someone stuffing the column: this is
// written by anon, straight into the DB.
const MAX_LEN = 200;

// fbclid is Meta's click id — the single most reliable marker that a visit came
// from a Meta ad, and it survives even when the pixel is blocked.
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid'] as const;

export type Attribution = Partial<Record<(typeof PARAMS)[number], string>> & {
  referrer?: string;
  landed_at?: string;
};

function clean(v: string | null): string | undefined {
  if (!v) return undefined;
  const t = v.trim().slice(0, MAX_LEN);
  return t.length ? t : undefined;
}

// Called once on app load, before anything else reads attribution.
//
// A URL carrying any tracking parameter counts as a NEW touch and overwrites
// whatever the session held — clicking a second ad should re-attribute to it.
// A bare URL leaves the stored value alone, so ordinary in-session navigation
// (or our own history rewrites for the Instagram back button) can't erase the
// source the visitor actually arrived from.
export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    const q = new URLSearchParams(window.location.search);
    const found: Attribution = {};
    for (const p of PARAMS) {
      const v = clean(q.get(p));
      if (v) found[p] = v;
    }
    if (!Object.keys(found).length) return;

    // Referrer is only meaningful on the landing hit; after that it's just our
    // own pages. Captured alongside utm because it's the one clue we get about
    // untagged traffic (a link someone shared, a story swipe-up without utm).
    const ref = clean(document.referrer);
    if (ref && !ref.includes(window.location.host)) found.referrer = ref;
    found.landed_at = new Date().toISOString();

    sessionStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    // storage/URL errors in restricted environments must never block the page
  }
}

// The attribution for this session, or null when the visit carried no source
// (direct, organic, or a returning visitor) — null is a meaningful answer, not
// a failure, so it is stored as SQL NULL rather than an empty object.
//
// The creator ref rides along so one column answers "where did this booking
// come from" for BOTH paid ads and creator links, without having to join
// affiliate tables to work out that a row was neither.
export function getAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    const base: Attribution = raw ? JSON.parse(raw) : {};
    const affiliate = getAffiliateRef();
    const merged: Attribution & { affiliate_code?: string } = { ...base };
    if (affiliate) merged.affiliate_code = affiliate;
    return Object.keys(merged).length ? merged : null;
  } catch {
    return null;
  }
}
