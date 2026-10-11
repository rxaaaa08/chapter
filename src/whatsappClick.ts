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

// The same code has a second job for one kind of message: a reply we sent
// inside a chat the guest opened. For those, open-event-otp accepts the code in
// place of the six-digit one, because only that WhatsApp number ever received
// it (the rules are beside resolveChatLink() in that function). So the code is
// remembered for the visit, without its ".<button>" tail, and /plans reads it
// back when it fills the booking form.
//
// Kept for the tab only: sessionStorage, so it survives the trip to PayU and
// back but not the tab. The in-memory copy covers browsers that block storage.
const ARRIVAL_KEY = 'wa_arrival_code';
const ARRIVAL_CODE = /^[A-Za-z0-9_-]{12,40}$/;
let arrivalCode: string | null = null;

function rememberArrival(code: string): void {
  if (!ARRIVAL_CODE.test(code)) return;
  arrivalCode = code;
  try {
    window.sessionStorage.setItem(ARRIVAL_KEY, code);
  } catch { /* storage blocked: the in-memory copy is all there is */ }
}

export function whatsAppArrivalCode(): string | null {
  if (arrivalCode) return arrivalCode;
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.sessionStorage.getItem(ARRIVAL_KEY);
    if (stored && ARRIVAL_CODE.test(stored)) arrivalCode = stored;
  } catch { /* storage blocked */ }
  return arrivalCode;
}

export function reportWhatsAppClick(): void {
  if (typeof window === 'undefined') return;
  let code: string | null = null;
  try {
    code = new URLSearchParams(window.location.search).get('wa');
  } catch {
    return;
  }
  if (!code || !CLICK_CODE.test(code)) return;
  rememberArrival(code.split('.')[0]);
  void supabase
    .rpc('log_whatsapp_click', { p_token: code })
    .then(({ error }) => {
      if (error) console.warn('[whatsapp click] not recorded:', error.message);
    }, () => { /* offline or blocked: nothing to do */ });
}
