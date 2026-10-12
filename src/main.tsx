import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import { initMetaPixel } from './metaPixel';
import { reportWhatsAppClick } from './whatsappClick';
import { cleanTrackerUrl, cleanUrlsInText } from './trackerUrl';
import './index.css';

// Ad attribution. No-ops entirely until META_PIXEL_ID is set, and never loads
// on /admin, /creator or /team — those are staff tools, not customer funnel.
initMetaPixel();

// A guest arriving from a button in one of our WhatsApp messages. No-ops unless
// the link carries a tap code.
reportWhatsAppClick();

// Sentry keeps a trail of addresses with every error report: the page the error
// happened on, the page before it, each in-page move ("from … to …") and every
// request the page made. Our message links put a guest's phone, name and
// private link code in the address, so an error report carried them — proved
// 2026-10-11 with made-up values (docs/TRACKER-ADDRESS-LEAK-2026-10-11.md).
// Every address is passed through the same cleaner the other tools get (rules:
// the first script in index.html) before a report leaves the browser.
function cleanAddressField(holder: Record<string, unknown> | undefined, key: string): void {
  if (holder && typeof holder[key] === 'string' && holder[key]) {
    holder[key] = cleanTrackerUrl(holder[key] as string);
  }
}

function cleanSentryBreadcrumb(crumb: Sentry.Breadcrumb): Sentry.Breadcrumb {
  try {
    const data = crumb.data as Record<string, unknown> | undefined;
    cleanAddressField(data, 'url');
    cleanAddressField(data, 'from');
    cleanAddressField(data, 'to');
    if (typeof crumb.message === 'string') crumb.message = cleanUrlsInText(crumb.message);
  } catch { /* a report with an uncleaned crumb is dropped below, not sent */ }
  return crumb;
}

function cleanSentryEvent<T extends Sentry.Event>(event: T): T | null {
  try {
    const request = event.request as Record<string, unknown> | undefined;
    cleanAddressField(request, 'url');
    if (request) delete request.query_string;
    const headers = request?.headers as Record<string, unknown> | undefined;
    cleanAddressField(headers, 'Referer');
    cleanAddressField(headers, 'referer');
    for (const crumb of event.breadcrumbs ?? []) cleanSentryBreadcrumb(crumb);
    for (const problem of event.exception?.values ?? []) {
      if (typeof problem.value === 'string') problem.value = cleanUrlsInText(problem.value);
    }
    if (typeof event.message === 'string') event.message = cleanUrlsInText(event.message);
    if (typeof event.transaction === 'string') event.transaction = cleanUrlsInText(event.transaction);
    return event;
  } catch {
    // Could not be cleaned, so it is not sent. One lost error report is the
    // cheaper mistake.
    return null;
  }
}

Sentry.init({
  dsn: 'https://50fb89acdd1a7824703dbe8379c0b16f@o4511243249844224.ingest.us.sentry.io/4511243253710848',
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
  tracesSampleRate: 0.2,
  // DPDP: don't ship IP addresses, cookies, or auth headers to Sentry by
  // default. If you need user attribution on a specific error, call
  // Sentry.setUser({ id: ... }) explicitly with the minimal field.
  sendDefaultPii: false,
  beforeBreadcrumb: cleanSentryBreadcrumb,
  beforeSend: cleanSentryEvent,
  beforeSendTransaction: cleanSentryEvent,
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// DPDP: mark all sensitive form inputs with data-cs-mask so Contentsquare
// session replays scrub their values. Covers tel/email inputs by type and
// any text input whose placeholder mentions name/phone/email/number. The
// MutationObserver re-runs on every DOM change so React-rendered inputs
// get masked as soon as they're added.
(() => {
  if (typeof document === 'undefined') return;
  const SENSITIVE_PLACEHOLDER = /name|phone|email|number/i;
  const markInputs = () => {
    document.querySelectorAll<HTMLInputElement>('input[type="tel"], input[type="email"]').forEach(el => {
      if (!el.hasAttribute('data-cs-mask')) el.setAttribute('data-cs-mask', 'masked');
    });
    document.querySelectorAll<HTMLInputElement>('input[type="text"], input:not([type])').forEach(el => {
      const p = (el.placeholder || '').toLowerCase();
      if (SENSITIVE_PLACEHOLDER.test(p) && !el.hasAttribute('data-cs-mask')) {
        el.setAttribute('data-cs-mask', 'masked');
      }
    });
  };
  markInputs();
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(markInputs).observe(document.documentElement, { childList: true, subtree: true });
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Remove the HTML pre-loader after React's first paint.
// Double-rAF guarantees we're past the browser's first rendered frame.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    const el = document.getElementById('html-preloader');
    if (el) el.remove();
  });
});
