<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/template-tags | Saved: 2026-09-19 -->

# Destination Ads - Template Tags



When you create destination ads, use these template tags in the ad creative and deep-link URLs. When Facebook displays your ad, we replace the template tags with that person's travel selections.

**You should provide template tags in double curly brackets**: `{{....}}`

**Before using template tags, make sure you provide all required details through your [Destination Events](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/events)**.

For example, the title of your ad could be:

> Book your travel to `{{destination.city}}` today!

And the template URL of your ad could deep link people straight to the destination page they were interested in, with the right travel dates:

> `https://www.(...).com/destinations?id={{destination.destination_id}}&start={{trip.travel_start date_format:Y-m-d}}&end={{trip.travel_end date_format:Y-m-d}}`

## Dynamic Dates {#dates}

Dynamic dates for template tags enable you to continuously update the dates that appear in your ad, without having to re-upload the data in feed. You can use these for Advantage+ catalog ads used in a particular vertical, such as for hotels, flights, destinations, automotive and so on.

- For syntax and usage, see [Template Tags for Hotels, Dynamic Dates](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/template-tags#dates).
- For available options, see [Template Tags for Hotels, Date Template Tags](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/template-tags#datetag).

### Template tags for Destinations

| Template tag | Description |
| --- | --- |
| `trip.currency_code` | The [ISO-4217](https://www.iso.org/iso-4217-currency-codes.html) currency code (for example, "USD") passed by the advertiser in dynamic events (for example, pixel events) using the key currency. If no currency code has been passed for an item, we show the product's feed's default currency. |
| `trip.travel_start` | The trip start date that Facebook has collected for the user from the advertiser. If there was no trip start date collected, this template tag will default to tomorrow. We support most of the date formats provided [here](http://php.net/manual/en/function.date.php).<br><br>Example:<br><br>* `{{trip.checkin_date}}`<br>* `{{trip.checkin_date date_format:Y-m-d}}` |
| `trip.travel_end` | The trip end date that Facebook has collected for the user from the advertiser. If there was no trip end date collected, this template tag will default to the day after tomorrow. We support most of the date formats provided [here](http://php.net/manual/en/function.date.php).<br><br>Example:<br><br>* `{{trip.travel_end}}`<br>* `{{trip.travel_end date_format:Y-m-d}}` |
| `trip.num_adults` | Number of adult travelers, based on intent signals Facebook collects about the user. Currently defaults to 1, subject to change. |
| `trip.num_children` | Number of children travelers, based on intent signals Facebook collects about the user. Currently defaults to 0, subject to change. |
| `trip.num_travelers` | Sum of adult and children travelers, based on intent signals Facebook collects about the user. Currently defaults to 1, subject to change. |
| `destination.name` | Destination name provided in catalog. |
| `destination.description` | Destination description provided in catalog. |
| `destination.city` | City provided in catalog. |
| `destination.country` | Country provided in catalog. |
| `destination.url` | Destination URL provided in catalog. |
| `destination.destination_id` | ID of the destination provided by advertiser in catalog. |
| `destination.price` | Price of the destination provided in catalog. |

