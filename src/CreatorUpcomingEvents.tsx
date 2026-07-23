// Creator dashboard — "See upcoming events" card (Phase 4).
//
// A collapsible card that lists the upcoming bookable experiences a creator can
// promote. Each row shows the next date and, where the event pays commission
// (affiliate_enabled), "you'd earn ₹X per booking" — turning a passive list into
// a "here's what's worth posting" prompt. Each row's Open Details button opens
// the same plan-details bottom sheet used by the /invite flow, so a creator can
// remind themselves what the experience actually is before posting.
//
// There are deliberately NO per-event links: attribution is session-scoped and
// every creator link lands on the experiences page, so the single link in the
// dashboard header is THE link. This card is about knowing what to promote, not
// minting URLs.
//
// Reuses the public event fetcher/mapper (events power the anon homepage, so a
// creator can read them). Self-contained styling matching CreatorDashboard.
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';
import { fetchEvents } from './supabase';
import { resolveDefaultFullPrice } from './eventPricing';
import { InvitePlanDetailsSheet, type InvitePlanDetails } from './InvitePlanDetailsSheet';

const INK = '#111';
const MUTED = '#9a9aa2';
const HAIR = '#ececed';
const GREEN = '#16a34a';

const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

// "2026-08-16" → "Aug 16". Robust to full ISO timestamps.
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' }).format(d);
};

// Start of today in IST, as a comparable YYYY-MM-DD string.
const istToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

type UpcomingEvent = {
  id: string;
  title: string;
  oneLiner: string;
  heroImage: string;
  priceFull: number;
  affiliateEnabled: boolean;
  affiliateCommissionPct: number;
  upcomingDates: string[]; // sorted ISO date strings, today or later
  earn: number;            // commission per booking, 0 if not enabled
  // Everything the shared InvitePlanDetailsSheet reads, straight off the event.
  details: InvitePlanDetails;
};

type CreatorUpcomingEventsProps = {
  embedded?: boolean;
};

export default function CreatorUpcomingEvents({ embedded = false }: CreatorUpcomingEventsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  // `sheet` holds the last-opened event (kept during the sheet's exit animation);
  // `sheetOpen` drives the sheet's open/close so the slide-out can play out.
  const [sheet, setSheet] = useState<UpcomingEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [overlayHost, setOverlayHost] = useState<HTMLElement | null>(null);

  // CreatorDashboard scrolls inside MobileShell. Portal the sheet into the
  // shell's non-scrolling overlay layer so it is clipped to the phone frame,
  // exactly like the /plans calendar sheet.
  useLayoutEffect(() => {
    const shell = rootRef.current?.closest<HTMLElement>('[data-mobile-shell]');
    setOverlayHost(shell?.querySelector<HTMLElement>('[data-mobile-shell-overlay-host]') ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await fetchEvents();
        const today = istToday();
        const mapped: UpcomingEvent[] = (raw ?? [])
          .map((event: any) => ({ event, priceFull: resolveDefaultFullPrice(event) }))
          // Only creator-enabled, bookable experiences — skip events that do not
          // currently pay creator commission and free community/WhatsApp events.
          .filter(({ event, priceFull }: any) => event.affiliateEnabled && event.bookingFlow !== 'whatsapp' && priceFull > 0)
          .map(({ event: e, priceFull }: any) => {
            const upcomingDates = ((e.dates ?? []) as any[])
              .map(d => String(d.date ?? '').slice(0, 10))
              .filter(d => d && d >= today)
              .sort();
            const pct = Number(e.affiliateCommissionPct) || 0;
            return {
              id: e.id,
              title: e.title,
              oneLiner: e.oneLiner ?? '',
              heroImage: e.heroImage ?? '',
              priceFull,
              affiliateEnabled: Boolean(e.affiliateEnabled),
              affiliateCommissionPct: pct,
              upcomingDates,
              earn: e.affiliateEnabled ? priceFull * pct / 100 : 0,
              // Same fields the invite flow feeds the sheet (App.tsx builds this
              // exact object as planDetails) — so the creator gets the identical sheet.
              details: {
                quickInfo: Array.isArray(e.quickInfo) ? e.quickInfo : [],
                included: Array.isArray(e.included) ? e.included : [],
                itinerary: Array.isArray(e.itinerary) ? e.itinerary : [],
                accommodation: e.accommodation ?? undefined,
                showAccommodation: Boolean(e.showAccommodation),
              },
            };
          })
          // Keep only events that actually have a future date, nearest first.
          .filter(e => e.upcomingDates.length > 0)
          .sort((a, b) => a.upcomingDates[0].localeCompare(b.upcomingDates[0]));
        if (!cancelled) { setEvents(mapped); setLoading(false); }
      } catch {
        if (!cancelled) { setEvents([]); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Freeze only the dashboard scroller while the sheet is open. The page shell
  // itself stays fixed, matching the /plans calendar interaction.
  useEffect(() => {
    if (!sheetOpen || !overlayHost) return;
    const shellScroller = overlayHost.parentElement?.querySelector<HTMLElement>('[data-mobile-shell-scroll]');
    if (!shellScroller) return;
    const previousOverflow = shellScroller.style.overflowY;
    shellScroller.style.overflowY = 'hidden';
    return () => { shellScroller.style.overflowY = previousOverflow; };
  }, [sheetOpen, overlayHost]);

  // Nothing to show → render nothing (keeps the dashboard clean for a creator
  // with no live events).
  if (!loading && events.length === 0) return null;

  return (
    <div ref={rootRef} style={{ border: embedded ? 'none' : '1px solid #a1a1aa', borderTop: embedded ? '1px solid ' + HAIR : undefined, borderRadius: embedded ? 0 : 16, overflow: 'hidden', background: '#fff' }}>
      {/* Event list */}
      <div>
        {events.map((e, i) => (
            <div
              key={e.id}
              style={{ width: '100%', boxSizing: 'border-box', textAlign: 'left', background: '#fff', borderTop: i === 0 ? 'none' : '1px solid ' + HAIR, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit' }}
            >
              {e.heroImage && <img src={e.heroImage} alt="" width={46} height={46} style={{ borderRadius: 11, objectFit: 'cover', flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 750, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap', fontSize: 12, color: MUTED, marginTop: 3 }}>
                  <span style={{ fontWeight: 750 }}>{fmtDate(e.upcomingDates[0])}{e.upcomingDates.length > 1 && ` · +${e.upcomingDates.length - 1} more`}</span>
                  {e.earn > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span style={{ color: GREEN, fontWeight: 750 }}>{inr(e.earn)} per booking</span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSheet(e); setSheetOpen(true); }}
                aria-label={`Open details for ${e.title}`}
                style={{ flexShrink: 0, height: 28, boxSizing: 'border-box', border: '1px solid #d9d9dd', borderRadius: 999, padding: '0 9px 0 11px', background: '#f5f5f6', color: '#4b4b52', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <span style={{ display: 'block', lineHeight: '11px', transform: 'translateY(-0.25px)' }}>Open Details</span>
                <ChevronRight aria-hidden="true" size={13} strokeWidth={2.4} color="#4b4b52" style={{ display: 'block', flexShrink: 0, transform: 'translateY(0.5px)' }} />
              </button>
            </div>
        ))}
      </div>

      {/* Kept mounted in the shell portal so AnimatePresence can complete the
          same slide-out sequence as the /plans calendar. */}
      {overlayHost && createPortal(
        <InvitePlanDetailsSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={sheet?.title ?? ''}
          details={sheet?.details ?? null}
          chrome="calendar"
        />,
        overlayHost,
      )}
    </div>
  );
}
