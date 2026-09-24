<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/template-tags | Saved: 2026-09-19 -->

# Hotel Ads - Template Tags



When you create hotel ads, use these template tags in the ad creative and deep-link URLs. When Facebook displays your ad, the template tags are replaced with that person's travel selections.

### Guidelines

* Provide template tags in double curly brackets: `{{....}}`

* Before using template tags, provide all required details through your [Hotel Events](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/events).

For example, the title of your ad could be:

Complete your booking to `{{hotel.city}}` today!

And the template URL of your ad could deep link people straight to the hotel page they were interested in, with the right check-in and check-out date:

> `https://www.(...).com/hotels?id={{hotel.hotel_id}}&checkin={{trip.checkin_date date_format:Y-m-d}}&checkout={{trip.checkout_date date_format:Y-m-d}}`

## Dynamic dates {#dates}

Dynamic dates for template tags enable you to continuously update the dates that appear in your ad, without having to re-upload the data in feed. You can use these for Advantage+ catalog ads used for a particular vertical, such as for hotels, flights, destinations, automotive, and so on. You can specify the following options with these tags:

- Today
- Today, plus or minus `n` days
- Today, plus or minus `n` months
- Today, plus or minus `n` years

The syntax for these tags is as follows:

```
Today:
{{date.today}}

Today + 12 days:
{{date.today date_offset:+12d}}

Today - 12 days:
{{date.today date_offset:-12d}}

Today + 3 months:
{{date.today date_offset:+3m}}

Today + 3 years:
{{date.today date_offset:+3y}}
```

By default, UTC is used; however, you can override with a specific time zone. For example:

```
{{date.today date_timezone:PST}}
```

## Available template tags

| Template Tag | Description |
| --- | --- |
| `hotel.brand` | Hotel brand provided in catalog. |
| `hotel.base_price` | If [dynamic pricing](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads#batch-upload-hotel-room-pricing) is provided, this displays the base price from room type. If advertiser has not provided dynamic pricing, this displays the `base_price` provided in static [hotel feed](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads#hotel-feed). |
| `trip.checkin_date` | The check-in date that Facebook collected for the user from the advertiser. If there is no check-in date collected, this template tag defaults to the next day. Most date formats provided [here](http://php.net/manual/en/function.date.php) are supported.<br><br>Example:<br><br>* `{{trip.checkin_date}}`<br>* `{{trip.checkin_date date_format:Y-m-d}}` |
| `trip.checkout_date` | The check-out date that Facebook collected for the user from the advertiser. If there is no check-out date collected, this template tag defaults to the day after tomorrow. Most date formats provided [here](http://php.net/manual/en/function.date.php) are supported.<br><br>Example:<br><br>* `{{trip.checkout_date}}`<br>* `{{trip.checkout_date date_format:Y-m-d}}` |
| `hotel.city` | City provided in catalog. |
| `hotel.city_id` | City ID provided in catalog. |
| `hotel.country` | Country provided in catalog. |
| `trip.currency_code` | The [ISO-4217](https://www.iso.org/iso-4217-currency-codes.html) currency code (for example, "USD") passed by the advertiser in dynamic events (for example, pixel events) using the key currency. If no currency code has been passed for an item, the product's feed's default currency is shown. |
| `hotel.description` | Hotel description provided in catalog. |
| `hotel.guest_rating` | Hotel guest rating provided in your catalog. To use this template tag, at least 30% of the catalog items must have a rating. |
| `hotel.hotel_id` | Hotel ID provided by advertiser in catalog. |
| `hotel.name` | Hotel name provided in catalog. |
| `hotel.neighborhood` | First neighborhood provided in catalog. |
| `trip.num_adults` | Number of adult travelers, based on intent signals Facebook collects about the user. Currently defaults to `1`; subject to change. |
| `trip.num_children` | Number of children travelers, based on intent signals Facebook collects about the user. Currently defaults to `0`; subject to change. |
| `trip.num_travelers` | Sum of adult and children travelers, based on intent signals Facebook collects about the user. Currently defaults to `1`; subject to change. |
| `hotel.price` | If [dynamic pricing](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads#batch-upload-hotel-room-pricing) is provided, this displays the average dynamic price per night with tax and fees. If advertiser has not provided dynamic pricing, this defaults to base price. |
| `hotel.sale_price` | If [dynamic pricing](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads#batch-upload-hotel-room-pricing) is provided, this displays the average dynamic sale price per night. If advertiser has not provided dynamic date-based sale price, this defaults to sale price at the room level. |
| `hotel.star_rating` | Hotel star rating provided in your catalog feed. To use this tag, at least 30% of the catalog items must have this field. |
| `hotel.total_price` | If [dynamic pricing](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads#batch-upload-hotel-room-pricing) is provided, this can be used to display the total price a user has to pay for the entire stay, including tax and fees. |
| `hotel.url` | Hotel URL provided in catalog. |

## Date template tags {#datetag}

In addition to the tags above, these date-specific options are available:

| Template Tag | Description |
| --- | --- |
| `date.today` | Today's date. |
| `date.today date_format:Ymd` | Today's date in format 20181231. Most of the formats defined in [PHP, `date`](http://php.net/manual/en/function.date.php?fbclid=IwAR150w5jYXv-c9Yuh7tvlG3xcOEX6ZeFf5h_3TwJ0OYIuJgc_qbwLp6T4OI) are supported. |
| `date.today date_offset:OFFSET` | `+` or `-` for time later than or earlier than today.<br><br>`D` for days, such as `+14D` for 14 days from now.<br><br>`W` for weeks, such as `-3W` for a date 3 weeks ago.<br><br>`Y` for years, such as `+1Y` for one year from now |
| `date.today date_timezone:TIMEZONE` | For example, `PST` for a date in the PST timezone. If not specified, defaults to [UTC](https://www.timeanddate.com/worldclock/timezone/utc). |

