const MONTH_NUMBER: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const datePartsKey = (year: number, month: number, day: number): number | null => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return year * 10000 + month * 100 + day;
};

// Parse the date-only value stored on applications without letting JavaScript
// apply the browser's local timezone to it.
export const isoDateKey = (value: unknown): number | null => {
  const match = String(value ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return datePartsKey(Number(match[1]), Number(match[2]), Number(match[3]));
};

// Produce a calendar-date key in a named timezone. formatToParts is used only
// to obtain numeric components; unlike a formatted date string, their order and
// punctuation cannot vary between browsers.
export const dateKeyInTimeZone = (date: Date, timeZone: string): number | null => {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value;
  return datePartsKey(Number(value('year')), Number(value('month')), Number(value('day')));
};

type PayuDateRecord = { trip_date?: string; created_at?: string };

// PayU currently snapshots dates as text such as "Sun, Aug 16th" or
// "Sunday, August 16th". The text has no year, so use the payment creation
// date to select the nearest same-or-future matching calendar date.
export const payuTripDateKey = (payment: PayuDateRecord): number | null => {
  const raw = String(payment.trip_date ?? '').trim();
  const directIso = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (directIso) return datePartsKey(Number(directIso[1]), Number(directIso[2]), Number(directIso[3]));

  const human = raw.match(/\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?\b/i);
  if (!human) return null;
  const month = MONTH_NUMBER[human[1].toLowerCase()];
  const day = Number(human[2]);
  if (human[3]) return datePartsKey(Number(human[3]), month, day);

  const created = new Date(String(payment.created_at ?? ''));
  if (Number.isNaN(created.getTime())) return null;
  const createdYear = created.getUTCFullYear();
  const createdDayKey = createdYear * 10000 + (created.getUTCMonth() + 1) * 100 + created.getUTCDate();
  const candidates = [createdYear - 1, createdYear, createdYear + 1]
    .map(year => datePartsKey(year, month, day))
    .filter((key): key is number => key !== null)
    .sort((a, b) => a - b);
  return candidates.find(key => key >= createdDayKey) ?? candidates.at(-1) ?? null;
};
