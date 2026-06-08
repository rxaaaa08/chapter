import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';

Sentry.init({
  dsn: 'https://50fb89acdd1a7824703dbe8379c0b16f@o4511243249844224.ingest.us.sentry.io/4511243253710848',
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
  tracesSampleRate: 0.2,
  // DPDP: don't ship IP addresses, cookies, or auth headers to Sentry by
  // default. If you need user attribution on a specific error, call
  // Sentry.setUser({ id: ... }) explicitly with the minimal field.
  sendDefaultPii: false,
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
