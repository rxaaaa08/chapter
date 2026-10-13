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
import { supabase, getSessionId, getVisitorId } from './supabase';

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
  reportLinkArrival(code);
}

// The same arrival, told to the database a second way: WHICH VISIT it happened
// in. log_whatsapp_click above stamps a message's first tap and nothing more,
// so it cannot say what that guest then did on the site. This writes one line,
// "a visit holding the link we sent to this number exists", against this
// visit's id, and that line is what lets a number's website steps be read back
// (docs/UNIFIED-ANALYTICS-BUILD-LOG.md, phase 7).
//
// It is evidence, not proof: a forwarded message carries the same link, so the
// database labels such a visit "came through the link sent to this number" and
// never gives that number the whole browser on the strength of it. Recorded on
// every arrival, not only the first, so a guest who comes back through the same
// saved link tomorrow is seen coming back.
//
// A separate call on purpose. The tap mark above is what People ▸ Call draws
// from and must not be able to break because of this one.
function reportLinkArrival(code: string): void {
  try {
    void supabase
      .rpc('log_link_arrival', {
        p_token: code,
        p_session_id: getSessionId(),
        p_visitor_id: getVisitorId(),
      })
      .then(({ error }) => {
        if (error) console.warn('[whatsapp click] visit not recorded:', error.message);
      }, () => { /* offline or blocked: nothing to do */ });
  } catch { /* no visit id to give: nothing to record */ }
}
