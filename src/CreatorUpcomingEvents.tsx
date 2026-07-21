// Creator dashboard — "See upcoming events" card (Phase 4).
//
// A collapsible card that lists the upcoming bookable experiences a creator can
// promote. Each row shows the next date and, where the event pays commission
// (affiliate_enabled), "you'd earn ₹X per booking" — turning a passive list into
// a "here's what's worth posting" prompt. Tapping a row opens a plan-details
// bottom sheet (the same idea as the /invite "Re-check plan details" sheet), so a
// creator can remind themselves what the experience actually is before posting.
//
// There are deliberately NO per-event links: attribution is session-scoped and
// every creator link lands on the experiences page, so the single link in the
// dashboard header is THE link. This card is about knowing what to promote, not
// minting URLs.
//
// Reuses the public event fetcher/mapper (events power the anon homepage, so a
// creator can read them). Self-contained styling matching CreatorDashboard.
import React, { useEffect, useMemo, useState } from 'react';
import { fetchEvents } from './supabase';
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

export default function CreatorUpcomingEvents() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  // `sheet` holds the last-opened event (kept during the sheet's exit animation);
  // `sheetOpen` drives the sheet's open/close so the slide-out can play out.
  const [sheet, setSheet] = useState<UpcomingEvent | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await fetchEvents();
        const today = istToday();
        const mapped: UpcomingEvent[] = (raw ?? [])
          // Only bookable (paid) experiences — skip free community/WhatsApp events.
          .filter((e: any) => e.bookingFlow !== 'whatsapp' && Number(e.priceFull) > 0)
          .map((e: any) => {
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
              priceFull: Number(e.priceFull) || 0,
              affiliateEnabled: Boolean(e.affiliateEnabled),
              affiliateCommissionPct: pct,
              upcomingDates,
              earn: e.affiliateEnabled ? (Number(e.priceFull) || 0) * pct / 100 : 0,
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

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [sheetOpen]);

  const topEarn = useMemo(() => events.reduce((m, e) => Math.max(m, e.earn), 0), [events]);

  // Nothing to show → render nothing (keeps the dashboard clean for a creator
  // with no live events).
  if (!loading && events.length === 0) return null;

  return (
    <div>
      {/* Collapsible header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', border: '1.5px solid ' + HAIR, borderRadius: 16, padding: 16, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', fontFamily: 'inherit' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: INK }}>See upcoming events</div>
          <div style={{ fontSize: 12.5, color: MUTED, marginTop: 3 }}>
            {loading ? 'Loading…'
              : topEarn > 0
                ? `${events.length} to promote · earn up to ${inr(topEarn)} per booking`
                : `${events.length} experience${events.length === 1 ? '' : 's'} you can promote`}
          </div>
        </div>
        <span aria-hidden style={{ width: 9, height: 9, borderRight: '2px solid ' + MUTED, borderBottom: '2px solid ' + MUTED, transform: open ? 'rotate(-135deg)' : 'rotate(45deg)', transition: 'transform 0.2s', marginRight: 4, marginTop: open ? 4 : -4 }} />
      </button>

      {/* Event list */}
      {open && (
        <div style={{ marginTop: 10, border: '1.5px solid ' + HAIR, borderRadius: 16, overflow: 'hidden' }}>
          {events.map((e, i) => (
            <button
              key={e.id}
              onClick={() => { setSheet(e); setSheetOpen(true); }}
              style={{ width: '100%', textAlign: 'left', background: '#fff', border: 'none', borderTop: i === 0 ? 'none' : '1px solid ' + HAIR, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit' }}
            >
              {e.heroImage
                ? <img src={e.heroImage} alt="" width={46} height={46} style={{ borderRadius: 11, objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 46, height: 46, borderRadius: 11, background: '#f2f2f4', flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 750, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
                  {fmtDate(e.upcomingDates[0])}{e.upcomingDates.length > 1 && ` · +${e.upcomingDates.length - 1} more`}
                </div>
              </div>
              {e.earn > 0 && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: GREEN }}>{inr(e.earn)}</div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>per booking</div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Plan-details bottom sheet — the EXACT component the /invite flow opens on
          "Re-check plan details". A fixed, phone-width layer gives the sheet's
          `absolute inset-0` a viewport-relative box (the dashboard itself is a
          scroll container, so rendering the sheet inline would mis-position it).
          Kept mounted so its slide-out animation plays; pointer-events off when
          closed so it never blocks the dashboard. */}
      <div style={{ position: 'fixed', top: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 448, zIndex: 1000, pointerEvents: sheetOpen ? 'auto' : 'none' }}>
        <InvitePlanDetailsSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title={sheet?.title ?? ''}
          details={sheet?.details ?? null}
        />
      </div>
    </div>
  );
}
