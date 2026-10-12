// The page address as outside tools are allowed to see it — the app's half.
//
// Our WhatsApp and email links carry the guest's phone number, their name and a
// private link code in the address (…/invite?phone=…&name=…&wa=…). Google
// Analytics, Contentsquare, the Meta Pixel and Sentry all read the address by
// themselves and send it home, and three of them start before this app does.
// Proved 2026-10-11 with made-up values: all four received it.
//
// The rules for what a tool may see live in ONE place: the first script in
// index.html, which has to run before any tool loads and so cannot be part of
// this bundle. That script publishes window.__caTrackerUrl; everything here is a
// typed doorway to it. Do not copy the list of allowed parameters into this
// file — two lists drift, and a drifted list is a leak nobody is looking for.
//
// Nothing here touches the address bar or the history. The app still reads
// phone, name, wa and the utm tags from the real address (whatsappClick.ts,
// the invite deep link, attribution.ts); only what is REPORTED to outside tools
// is cleaned. See docs/TRACKER-ADDRESS-LEAK-2026-10-11.md.

declare global {
  interface Window {
    __caTrackerUrl?: {
      /** A cleaned copy of any address: ours loses every parameter not on the allowed list, anyone else's loses its whole query. */
      clean: (url: string) => string;
      /** The cleaned address of the page as it is right now. */
      page: () => string;
    };
  }
}

// If the index.html script is somehow missing, say LESS, never more: keep the
// site and the path, drop every parameter.
function bareAddress(url: string): string {
  try {
    const u = new URL(url, window.location.href);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch {
    return '';
  }
}

export function cleanTrackerUrl(url: string | null | undefined): string {
  if (!url || typeof window === 'undefined') return '';
  try {
    const rules = window.__caTrackerUrl;
    if (rules && typeof rules.clean === 'function') return rules.clean(url);
  } catch { /* fall through to the bare address */ }
  return bareAddress(url);
}

// True when cleaning this address would take nothing out of it. The part after
// # and a trailing "/" or "?" are ignored: they are spelling, not content, and
// a tool that re-spells an address must not be mistaken for one that leaked.
export function isCleanTrackerUrl(url: string): boolean {
  const spelling = (a: string) => a.split('#')[0].replace(/[/?]+$/, '');
  return spelling(cleanTrackerUrl(url)) === spelling(url);
}

// True when the address in the bar (and the page we came from, if it was one of
// ours) holds nothing a tool should not see.
export function isAddressClean(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (!isCleanTrackerUrl(window.location.href)) return false;
    const from = document.referrer;
    if (from && from.startsWith(window.location.origin) && !isCleanTrackerUrl(from)) return false;
    return true;
  } catch {
    return false;
  }
}

// Cleans every full web address found inside a piece of text (an error message
// such as "Failed to fetch https://…?phone=…").
export function cleanUrlsInText(text: string): string {
  if (!text || text.indexOf('http') === -1) return text;
  return text.replace(/https?:\/\/[^\s"'<>)\]]+/g, (found) => cleanTrackerUrl(found) || '[address removed]');
}
