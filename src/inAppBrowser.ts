// In-app browser (Instagram / Facebook) detection + safe outbound navigation.
//
// Until 2026-08 the whole site threw up a full-screen "open in external
// browser" wall for these user agents, so ~all of our Instagram traffic had to
// take a manual detour before it could see anything. The wall is gone from
// every customer route; visitors now browse, book and pay inside Instagram.
//
// Two things still genuinely cannot work in an embedded browser, so detection
// stays:
//   1. Google sign-in — Google itself returns 403 disallowed_useragent for any
//      embedded webview (policy since July 2023). That's /creator and /team,
//      which still show the wall.
//   2. window.open() — in-app browsers routinely return null or hand back a
//      tab they refuse to navigate. Anything leaving our origin (wa.me, an
//      admin-configured booking URL) must be a top-level navigation instead,
//      which is what openExternalUrl() does.
export function isInAppBrowser(): boolean {
  return typeof navigator !== 'undefined' && /Instagram|FBAN|FBAV/i.test(navigator.userAgent);
}

// Send the visitor to an off-site URL as reliably as the current browser allows.
//
// Real browsers keep the current tab alive (new tab, no opener — bookingUrl is
// admin-editable, so treat it as untrusted and prevent tabnabbing). In-app
// browsers get a same-tab navigation: it costs the back-stack entry but it is
// the only handoff Instagram performs consistently, and for universal links
// like wa.me it is what triggers the jump into the WhatsApp app.
// Guarantee a URL that differs from the one currently showing.
//
// Instagram's iOS in-app browser only registers a history entry with its back
// chevron when that entry's URL differs from the current one (measured on
// device — see INSTAGRAM-BACK-BUTTON-HANDOFF.md). Pushing the same URL twice
// produces an entry the chevron cannot see, and back goes dead from there on.
//
// That happens whenever a view is closed WITHOUT resetting the URL and then
// reopened: the second push targets the URL already showing. /plans avoids it
// by replacing the URL on close, but relying on every close path everywhere to
// stay correct is exactly how this broke once already.
//
// So callers still name their destination properly (?sheet=, ?step=) and this
// is the last-resort guarantee that a single missed close path cannot silently
// kill the back button. The nonce is only added when it would otherwise be a
// same-URL push, so it stays out of the way in the normal case.
export function ensureDistinctUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  const next = new URL(url, window.location.href);
  if (next.href !== window.location.href) return `${next.pathname}${next.search}${next.hash}`;
  next.searchParams.set('_n', String(Date.now() % 100000));
  return `${next.pathname}${next.search}${next.hash}`;
}

export function openExternalUrl(url: string): void {
  if (!url) return;
  if (isInAppBrowser()) {
    window.location.href = url;
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
