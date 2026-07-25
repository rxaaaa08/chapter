type EventPriceSource = {
  cities?: unknown;
  cityDetails?: unknown;
  city_details?: unknown;
  priceFull?: unknown;
  price_full?: unknown;
};

const positiveNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
};

// Resolve the price used when an event card has no city selected yet. The first
// configured city mirrors the admin summary; its override wins over the plan-
// level price, just as it does once checkout resolves the customer's city.
export function resolveDefaultFullPrice(event: EventPriceSource): number {
  const cities = Array.isArray(event.cities) ? event.cities : [];
  const firstCity = cities.find(city =>
    typeof city === 'string' && city.trim() && city.trim().toLowerCase() !== 'other'
  );
  const rawDetails = event.cityDetails ?? event.city_details;
  const details = rawDetails && typeof rawDetails === 'object'
    ? rawDetails as Record<string, { priceFull?: unknown; price_full?: unknown }>
    : {};

  if (typeof firstCity === 'string') {
    const cityKey = Object.keys(details).find(key =>
      key.toLowerCase() === firstCity.trim().toLowerCase()
    );
    if (cityKey) {
      const cityPrice = positiveNumber(details[cityKey]?.priceFull)
        || positiveNumber(details[cityKey]?.price_full);
      if (cityPrice > 0) return cityPrice;
    }
  }

  return positiveNumber(event.priceFull) || positiveNumber(event.price_full);
}

type CreatorEarnSource = {
  affiliateCommission?: unknown;
  affiliate_commission?: unknown;
  affiliateCommissionPct?: unknown;
  affiliate_commission_pct?: unknown;
};

// What a creator earns per booking on this event. A flat ₹ fee wins when set —
// it is the same figure for every city and ticket type, which is the whole point
// of it. Otherwise fall back to the percentage of the resolved full price.
// Mirrors accrue_affiliate_sale() in the database; keep the two in step.
// Format a creator's per-booking commission. Paise are shown only when they
// exist, so a ₹26.93 fee reads exactly as ₹26.93 — matching the "5 tickets ×
// ₹26.93" line on the dashboard's conversions card — while a round ₹50 fee does
// not become "₹50.00". Rounding to whole rupees here made the same commission
// appear as two different numbers on one screen.
export function formatCreatorEarn(earn: number): string {
  const value = Number(earn) || 0;
  const hasPaise = Math.abs(value - Math.round(value)) > 0.005;
  return '₹' + value.toLocaleString('en-IN', {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  });
}

export function resolveCreatorEarn(event: CreatorEarnSource, fullPrice: number): number {
  const flat = positiveNumber(event.affiliateCommission) || positiveNumber(event.affiliate_commission);
  if (flat > 0) return flat;
  const pct = positiveNumber(event.affiliateCommissionPct) || positiveNumber(event.affiliate_commission_pct);
  return pct > 0 ? fullPrice * pct / 100 : 0;
}
