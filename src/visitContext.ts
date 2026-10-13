// What a website step is stamped with besides its own name: the page it
// happened on and, once per landing, where the visit started.
//
// This is the site's half of the unified customer analytics
// (docs/UNIFIED-ANALYTICS-BUILD-LOG.md, phase 7). The database's half is the
// guard on flow_analytics (analytics.flow_row_guard): it keeps only names from
// fixed lists and short codes, and DROPS anything else. So every value produced
// here is a short lowercase code, never an address and never anything a person
// typed. An address can carry a phone number, a name or a private link code,
// which is exactly why the page is recorded by NAME.
//
// No imports from ./supabase on purpose: supabase.ts imports this file.

/** Lowercase letters, digits and underscores, at most 40: the database's rule. */
const CODE = /^[a-z0-9_]{1,40}$/;

/**
 * The name of the page an address shows. A fixed list; anything unrecognised is
 * 'other' and is never guessed from the address itself.
 */
export function pageNameForPath(pathname: string): string {
  const p = String(pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  if (p === '/') return 'home';
  // /join is the old address of /lifestyle; a creator's /@handle lands there too.
  if (p === '/lifestyle' || p === '/join' || p.startsWith('/@')) return 'lifestyle';
  if (p === '/plans') return 'plans';
  if (p === '/myplans') return 'myplans';
  if (p === '/invite') return 'invite';
  if (p.startsWith('/invite/')) return 'invite_plan';
  if (p === '/galcode') return 'galcode';
  if (p === '/privacy') return 'privacy';
  if (p === '/termsofservice') return 'terms';
  if (p === '/data-deletion') return 'data_deletion';
  if (p === '/admin') return 'admin';
  if (p === '/creator') return 'creator';
  if (p === '/team') return 'team';
  return 'other';
}

// The page showing right now. App.tsx is the authority (it knows a payment
// return is on screen even after the address has been tidied) and keeps this in
// step. Until it has run once, the address the page loaded at stands in.
let currentPage: string | null = null;

function pageAtLoad(): string {
  if (typeof window === 'undefined') return 'other';
  try {
    if (new URLSearchParams(window.location.search).get('payment_status')) return 'payment_return';
  } catch { /* fall through to the path */ }
  return pageNameForPath(window.location.pathname);
}

export function setCurrentPage(name: string): void {
  if (CODE.test(name)) currentPage = name;
}

export function getCurrentPage(): string {
  if (!currentPage) currentPage = pageAtLoad();
  return currentPage;
}

// ── Starting context, sent once per landing ──────────────────────────────────

// Which app or browser the page is open in. In-app browsers come first: they
// also carry "Safari" or "Chrome" in their name, and they are the ones that
// matter here (most guests arrive inside Instagram, and a link tapped in
// WhatsApp can open in WhatsApp's own browser).
function browserKind(ua: string): string {
  if (!ua) return 'unknown';
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'facebook';
  if (/WhatsApp/i.test(ua)) return 'whatsapp';
  if (/Snapchat/i.test(ua)) return 'snapchat';
  if (/LinkedInApp/i.test(ua)) return 'linkedin';
  if (/Telegram/i.test(ua)) return 'telegram';
  // Some other Android app showing the page in its own window.
  if (/; wv\)/.test(ua)) return 'android_webview';
  if (/EdgA?\/|EdgiOS/i.test(ua)) return 'edge';
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/OPR\/|OPT\//i.test(ua)) return 'opera';
  if (/Firefox|FxiOS/i.test(ua)) return 'firefox';
  if (/Chrome|CriOS/i.test(ua)) return 'chrome';
  if (/Safari/i.test(ua)) return 'safari';
  return 'unknown';
}

function deviceKind(ua: string): string {
  if (!ua) return 'unknown';
  if (/iPhone|iPod/i.test(ua)) return 'iphone';
  // An iPad asks for the desktop site by default, calling itself a Mac; the
  // touch screen is what gives it away.
  if (/iPad/i.test(ua) || (/Macintosh/i.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)) {
    return 'ipad';
  }
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? 'android_phone' : 'android_tablet';
  if (/Windows|Macintosh|Linux|CrOS/i.test(ua)) return 'desktop';
  return 'unknown';
}

// The SITE the visitor came from, never the address: a host name only. Our own
// pages are not a source, so a move inside the site records nothing here.
function cameFromHost(): string | undefined {
  try {
    if (typeof document === 'undefined' || !document.referrer) return undefined;
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (!host || host === window.location.hostname) return undefined;
    return /^[a-z0-9.-]{1,100}$/.test(host) ? host : undefined;
  } catch {
    return undefined;
  }
}

// Is this one of us, or a copy of the site that is not the real one?
//
// The real site is the same two host names as PRODUCTION_HOSTS in
// src/metaPixel.ts and the tool block in index.html. On it, a tab that has ever
// been /admin, /team, the installed admin app or a staff plan preview is marked
// by index.html as `ca_team_tab`, and stays marked until it is closed.
// Anywhere else (npm run dev, a preview site) every visit is ours.
const REAL_SITE_HOSTS = ['chaptera.in', 'www.chaptera.in'];

function isInternalVisit(): boolean {
  if (typeof window === 'undefined') return false;
  if (!REAL_SITE_HOSTS.includes(window.location.hostname)) return true;
  try {
    return window.sessionStorage.getItem('ca_team_tab') === '1';
  } catch {
    return false;
  }
}

// Which build of the site recorded this step. The main script's file name
// changes with its contents on every release, so the part that changes is a
// version stamp that needs no build setting of its own.
function siteVersion(): string | undefined {
  try {
    if (typeof document === 'undefined') return undefined;
    const scripts = document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]');
    for (const s of Array.from(scripts)) {
      const m = (s.getAttribute('src') ?? '').match(/\/assets\/index-([A-Za-z0-9_-]{6,30})\.js/);
      if (m) return m[1];
    }
    return import.meta.env.DEV ? 'dev' : undefined;
  } catch {
    return undefined;
  }
}

export type VisitorStorage = 'local' | 'session' | 'memory';

export type LandingContext = {
  landing_page: string;
  browser: string;
  device: string;
  ref_host?: string;
  /** How the browser id is being kept, which decides whether it can link two visits. */
  storage?: VisitorStorage;
  internal?: boolean;
  app_v?: string;
};

/**
 * Where this landing started. Sent with the first step of every full page load
 * (not only the first of a tab: a guest who returns from the payment page has
 * landed again, somewhere else, from somewhere else).
 */
export function landingContext(storage: VisitorStorage | null): LandingContext {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const ctx: LandingContext = {
    landing_page: getCurrentPage(),
    browser: browserKind(ua),
    device: deviceKind(ua),
  };
  const host = cameFromHost();
  if (host) ctx.ref_host = host;
  if (storage) ctx.storage = storage;
  // Only ever sent as true. The saved visit treats "not said" as a guest.
  if (isInternalVisit()) ctx.internal = true;
  const v = siteVersion();
  if (v) ctx.app_v = v;
  return ctx;
}
