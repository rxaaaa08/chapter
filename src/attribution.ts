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

// fbclid gets its own, much larger ceiling — and is REJECTED rather than
// trimmed when it exceeds it.
//
// Truncating is the wrong move for this one field specifically. A utm_campaign
// cut short is still a readable label; an fbclid cut short is a valid-LOOKING
// click id that matches nobody, and Meta scores a supplied-but-unmatchable
// parameter against match quality instead of ignoring it. Dropping it is the
// honest outcome: the server then sends no fbc rather than a confident wrong one.
//
// 200 was not a theoretical squeeze. The longest fbclid in this table is 187
// characters, so real traffic was landing 13 characters from being silently
// mangled — and the same 200 elsewhere was already discarding the matching
// cookie outright. Keep in step with MAX_META_COOKIE_LEN in src/metaPixel.ts.
const MAX_FBCLID_LEN = 512;

// fbclid is Meta's click id — the single most reliable marker that a visit came
// from a Meta ad, and it survives even when the pixel is blocked.
//
// placement / site_source_name say WHICH SURFACE the click came from — Reels vs
// Feed vs Stories vs Audience Network. Meta substitutes them from {{placement}}
// and {{site_source_name}} in the ad's URL Parameters field, the same mechanism
// that already carries {{ad.id}} in utm_content.
//
// Captured now because they cannot be backfilled: a click that lands before the
// parameter exists never gets a placement, and the question they answer is one
// this business asks in its first week of spending — Advantage+ placements
// spread delivery across every surface, and Meta's own breakdown can only say
// where the IMPRESSIONS went. Which surface produced a paid TICKET is a join
// against our own bookings, and it needs the value on the row.
//
// Entirely inert until the founder adds the macros: a parameter that is absent
// is simply never stored, and one that arrives unsubstituted is dropped below.
const PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'fbclid', 'placement', 'site_source_name',
] as const;

export type Attribution = Partial<Record<(typeof PARAMS)[number], string>> & {
  referrer?: string;
  landed_at?: string;
};

// A Meta URL macro that was never substituted arrives here literally, as
// "{{ad.id}}" — caused by a typo in the macro name, the parameter being set on
// the wrong object, or a placement that does not support it.
//
// Storing that is strictly worse than storing nothing. get_meta_ads_performance
// identifies an ad by `attribution->>'utm_content' ~ '^[0-9]{6,}$'`, so a
// literal macro fails the match and the booking reads as ORGANIC — while the
// row still looks tagged to anyone eyeballing the column. The failure is then
// invisible in exactly the place someone would look to spot it, and stays
// invisible until a month of spend shows no bookings against it.
//
// Dropping it makes the row honestly untagged, which is what the panel's
// tracking-health strip is built to notice and shout about.
function isUnsubstitutedMacro(v: string): boolean {
  return v.includes('{{') || v.includes('}}');
}

function clean(v: string | null): string | undefined {
  if (!v) return undefined;
  const t = v.trim().slice(0, MAX_LEN);
  if (!t.length || isUnsubstitutedMacro(t)) return undefined;
  return t;
}

// All or nothing — see MAX_FBCLID_LEN.
function cleanFbclid(v: string | null): string | undefined {
  if (!v) return undefined;
  const t = v.trim();
  if (!t.length || t.length > MAX_FBCLID_LEN || isUnsubstitutedMacro(t)) return undefined;
  return t;
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
      const v = p === 'fbclid' ? cleanFbclid(q.get(p)) : clean(q.get(p));
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

// The attribution to stamp on a FUNNEL row (flow_analytics), as opposed to a
// booking row (applications). Identical to getAttribution() minus fbclid.
//
// fbclid is Meta's click id: a MATCHING token that earns its keep exactly once,
// at conversion, where the server turns it into an fbc cookie value — and
// applications.attribution still carries it there in full. The funnel table
// asks a different question ("where did this ad's traffic drop out") that
// fbclid answers no part of. It is also the largest field we hold — up to 512
// characters, see MAX_FBCLID_LEN — and a session writes roughly three funnel
// rows to every one booking row, so carrying it would triple the biggest string
// in the payload to answer nothing.
//
// The rule lives here, not at the insert site, so there is ONE definition of
// what a funnel row's source looks like.
export function getFunnelAttribution(): Attribution | null {
  const full = getAttribution();
  if (!full) return null;
  const rest: Attribution = { ...full };
  delete rest.fbclid;
  // A visit whose ONLY marker was an fbclid still came from an ad, and the bare
  // landed_at proves the session was tagged — so this stays non-null on purpose
  // rather than collapsing to "organic".
  return Object.keys(rest).length ? rest : null;
}
