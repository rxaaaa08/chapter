// Our own WhatsApp tap tracking — the site's half.
//
// Meta tells nobody when a guest taps a button in one of our messages, so every
// message carries its own code in the link: …/invite?phone=…&name=…&wa=<code>.<n>
// (<n> is which button). When the page opens with one, this reports it once and
// the database stamps that message as tapped, which is what People ▸ Call draws
// its "clicked" mark from. The senders and the database function are described
// in supabase/migrations/20261011_whatsapp_own_click_tracking.sql.
//
// Deliberately small:
//   * It does NOT touch the address bar. Stripping `wa` would mean rewriting
//     history on a page whose back-button behaviour inside Instagram's browser
//     is fragile (see the /plans back-button notes), and it buys nothing: the
//     database records only the first tap, so a refresh or a second visit with
//     the same link is a no-op there.
//   * It never throws and is never awaited. A lost report costs one mark in the
//     admin panel; it must not be able to delay or break a guest's page.
import { supabase } from './supabase';

// What the senders mint: 12 random bytes as base64url, then a dot and the
// button's position. Checked here only to avoid a pointless request for a
// mangled link; the database applies the same rule and is the real gate.
const CLICK_CODE = /^[A-Za-z0-9_-]{12,40}(\.[0-9])?$/;

export function reportWhatsAppClick(): void {
  if (typeof window === 'undefined') return;
  let code: string | null = null;
  try {
    code = new URLSearchParams(window.location.search).get('wa');
  } catch {
    return;
  }
  if (!code || !CLICK_CODE.test(code)) return;
  void supabase
    .rpc('log_whatsapp_click', { p_token: code })
    .then(({ error }) => {
      if (error) console.warn('[whatsapp click] not recorded:', error.message);
    }, () => { /* offline or blocked: nothing to do */ });
}
