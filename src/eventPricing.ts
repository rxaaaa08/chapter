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
