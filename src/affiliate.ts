// Affiliate (creator) link attribution — client side.
//
// A creator's link is chaptera.in/@<handle> which lands the visitor on
// /lifestyle?ref=<handle>. We capture that ref SESSION-SCOPED (sessionStorage):
// it counts only while the current browsing session lasts. There is deliberately
// NO cross-session persistence — if a visitor returns days later without a ref
// in the URL, no creator is credited (it's treated as the founder's own/official
// link). Attribution is stamped onto the application at the decisive moment:
// application submit for invite events, the details-form step for open events.
import { supabase, getSessionId } from './supabase';

const REF_KEY = 'ca_affiliate_ref';

// Match the DB affiliates_handle_format CHECK: lowercase letters/digits/dot/underscore, 1–40 chars.
export function normalizeHandle(raw: string | null | undefined): string {
  if (!raw) return '';
  return String(raw).trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9._]/g, '').slice(0, 40);
}

// Called once on app load. If the entry URL carries ?ref=, store it for the
// session and log a click (deduped so in-session navigation doesn't re-count).
// Also handles the /@handle path directly (local dev / fallback when Vercel's
// redirect hasn't run), rewriting the URL to /lifestyle?ref=handle.
export function captureAffiliateRef(): void {
  if (typeof window === 'undefined') return;
  try {
    let handle = normalizeHandle(new URLSearchParams(window.location.search).get('ref'));

    // /@handle → treat the path segment as the ref and clean the URL.
    const pathMatch = window.location.pathname.match(/^\/@([^/]+)/);
    if (!handle && pathMatch) {
      handle = normalizeHandle(decodeURIComponent(pathMatch[1]));
      if (handle) {
        window.history.replaceState({}, '', `/lifestyle?ref=${handle}`);
      }
    }

    if (!handle) return;

    const prev = sessionStorage.getItem(REF_KEY);
    sessionStorage.setItem(REF_KEY, handle);

    // Log a click only when the active handle changes this session — avoids
    // re-counting every route change / re-render under the same link.
    // Clicks from the Instagram/Facebook in-app browser used to be skipped
    // (the wall made that landing a duplicate of the external-browser one).
    // Those visitors now stay put and book in place, so their click is the
    // real one — skipping it under-counted creators on their biggest channel.
    if (prev !== handle) {
      // getSessionId() CREATES the id if absent. captureAffiliateRef runs before
      // the first trackEvent on a fresh visit — reading sessionStorage directly
      // here logged NULL session_ids for exactly the clicks that matter most
      // (first landing via a creator link), breaking unique-click dedup.
      const sid = getSessionId();
      supabase.rpc('record_affiliate_click', { p_code: handle, p_session_id: sid })
        .then(() => {}, () => {}); // fire-and-forget; never block the page
    }
  } catch {
    // ignore storage/URL errors in restricted environments
  }
}

// The creator ref active in this session, or null (= founder's own link).
export function getAffiliateRef(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(REF_KEY) || null;
  } catch {
    return null;
  }
}
