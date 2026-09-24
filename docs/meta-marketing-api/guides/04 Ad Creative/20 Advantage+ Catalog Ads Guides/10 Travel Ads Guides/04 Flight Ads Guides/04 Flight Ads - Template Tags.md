<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/flight-ads/template-tags | Saved: 2026-09-19 -->

# Flight Ads - Template Tags



When you create flight ads, use these template tags in the ad creative and deep-link URLs. When Facebook displays your ad, it replaces the template tags with that person's travel selections.

**You should provide template tags in double curly brackets**: `{{....}}`

**Before using template tags, make sure you provide all required details through your [Flight Events](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-flights/events)**.

For example, the title of your ad could be:

> Complete your booking to `{{flight.destination_city}}` today!

And the template URL of your ad could deep link people straight to the flight they were interested in, with the right departure and return date:

> `https://www.(...).com/flights?from={{flight.origin_airport}}&to={{flight.destination_airport}}&departure={{trip.departing_departure_date date_format:Y-m-d}}&return={{trip.returning_departure_date date_format:Y-m-d}}&num={{trip.num_travelers}}`

## Dynamic dates {#dates}

Dynamic dates for template tags enable you to continuously update the dates that appear in your ad, without having to re-upload the data in feed. You can use these for Advantage+ catalog ads used in a particular vertical, such as for hotels, flights, destinations, automotive, and so on.

- For syntax and usage, see [Template Tags for Hotels, Dynamic Dates](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/template-tags#dates).
- For available options, see [Template Tags for Hotels, Date Template Tags](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/template-tags#datetag)

### Template tags for flights

| Template tag | Description |
| --- | --- |
| `trip.currency_code` | The [ISO-4217](https://www.iso.org/iso-4217-currency-codes.html) currency code (for example, "USD") passed by the advertiser in dynamic events (for example, pixel events) using the key currency. If no currency code has been passed for an item, Facebook shows the product feed's default currency. |
| `trip.departing_departure_date` | The departure date that Facebook has collected for the user from the advertiser. If there was no departure date collected, this template tag defaults to tomorrow. Facebook supports most of the date formats provided [here](http://php.net/manual/en/function.date.php).<br><br>Example:<br><br>* `{{trip.departing_departure_date}}`<br>* `{{trip.departing_departure_date date_format:Y-m-d}}` |
| `trip.returning_departure_date` | The return date that Facebook has collected for the user from the advertiser. If there was no return date collected, this template tag defaults to the day after tomorrow. Facebook supports most of the date formats provided [here](http://php.net/manual/en/function.date.php).<br><br>Example:<br><br>* `{{trip.returning_departure_date}}`<br>* `{{trip.returning_departure_date date_format:Y-m-d}}` |
| `trip.num_adults` | Number of adult travelers, based on intent signals Facebook collects about a user. Currently defaults to 1, subject to change. |
| `trip.num_children` | Number of children travelers, based on intent signals Facebook collects about the user. Currently defaults to 0, subject to change. |
| `trip.num_infants` | Number of infant travelers, based on intent signals Facebook collects about the user. Currently defaults to 0, subject to change. |
| `trip.num_travelers` | Sum of adult, children, and infant travelers, based on intent signals Facebook collects about the user. Currently defaults to 1, subject to change. |
| `flight.destination_airport` | The IATA code for the destination, such as SFO. |
| `flight.destination_city` | Destination city name from flight feed, if provided. If not, city name associated with destination airport in English, such as San Francisco. |
| `flight.origin_airport` | The IATA code for the origin, such as JFK. |
| `flight.origin_city` | Origin city name from flight feed, if provided. If not, city name associated with destination airport in English, such as New York. |
| `flight.description` | Flight description provided in catalog. |
| `flight.price` | Price of the flight. To show a price from feed, use source:feed as the option: `{{flight.price source:feed}}` to use the last-seen price from a pixel or app event, use `source:event` as the option: `{{flight.price source:event}}`. |
| `flight.price type:one_way` | One-way price of the flight. For this option, you must provide a source of prices. To show a price from feed, use `source:feed` as the option: `{{flight.price source:feed  type:one_way}}`. |
| `flight.url` | Flight URL provided in catalog. |

