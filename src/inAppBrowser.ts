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
export function openExternalUrl(url: string): void {
  if (!url) return;
  if (isInAppBrowser()) {
    window.location.href = url;
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
