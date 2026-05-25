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
  sendDefaultPii: true,
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

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
