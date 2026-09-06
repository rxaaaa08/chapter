// Time-of-day helpers for the "Essentials" / journey card.
//
// The pickup point's `time` field is a single START time (it also doubles as the
// WhatsApp `reporting_time`, so it must stay a single value). To show a RANGE on
// the journey card — "11am to 1pm" — we combine that start time with the event's
// Duration field (`events.timing`, e.g. "2 hours") and compute the end.
//
// Everything here fails soft: any input we can't confidently parse returns null,
// and the card falls back to showing the start time exactly as typed. In
// particular a multi-day Duration ("2 Nights 3 Days") is deliberately NOT treated
// as a short duration — those events keep their day-based behaviour untouched.

/** "11AM" / "11:00 am" / "9:30 PM" → minutes since midnight, else null. */
export function parseClockTime(input?: string): number | null {
  if (!input) return null;
  const m = input.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = m[2] ? parseInt(m[2], 10) : 0;
  if (h < 1 || h > 12 || min > 59) return null;
  const pm = m[3].toLowerCase() === 'p';
  h = h % 12;            // 12 → 0
  if (pm) h += 12;       // pm → afternoon
  return h * 60 + min;
}

/**
 * A short duration in minutes ("2 hours", "1.5 hrs", "90 min", "1 hr 30 min"),
 * or null when the text names days/nights (a multi-day trip) or has no time in it.
 */
export function parseDurationMinutes(input?: string): number | null {
  if (!input) return null;
  const s = input.toLowerCase();
  if (/\b(days?|nights?)\b/.test(s)) return null; // multi-day trip, not a short event
  let total = 0;
  let found = false;
  const hrs = s.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
  if (hrs) { total += Math.round(parseFloat(hrs[1]) * 60); found = true; }
  const mins = s.match(/(\d+)\s*(?:minutes?|mins?|m)\b/);
  if (mins) { total += parseInt(mins[1], 10); found = true; }
  if (!found || total <= 0 || total >= 24 * 60) return null;
  return total;
}

/** minutes since midnight → "11 AM", "12 PM", "1:30 PM" (wraps across midnight). */
export function formatClock(totalMin: number): string {
  const m = ((Math.round(totalMin) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return mins === 0 ? `${h12} ${ap}` : `${h12}:${String(mins).padStart(2, '0')} ${ap}`;
}

/**
 * "11 AM – 1 PM" from a start time + a short Duration, or null when either can't
 * be parsed (so the caller shows the raw start time as before).
 */
export function formatEventTimeRange(startTime?: string, durationText?: string): string | null {
  const start = parseClockTime(startTime);
  const dur = parseDurationMinutes(durationText);
  if (start == null || dur == null) return null;
  return `${formatClock(start)} – ${formatClock(start + dur)}`;
}
