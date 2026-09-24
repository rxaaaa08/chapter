<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads/audience-management | Saved: 2026-09-19 -->

# Travel Ads - Audience Management


This guide assumes you have a catalog with your travel inventory ready, and have set up the required travel events on your website and/or in your mobile app, and have associated your catalog with your event sources.

**As of September 20, 2018, Meta will not support `subtype` after v3.0 of Marketing API for custom audiences for websites, apps, engagement custom audiences, and audiences from offline conversion data.** The one exception is that `subtype` will still be supported for engagement custom audiences for video.

Create a travel audience in two steps:

* [Step 1: Create a Travel Event Source Group](#create-esg)
* [Step 2: Create Travel Audiences](#create-audience)

## Step 1: Create and share a travel event source group {#create-esg}

Besides associating your event sources with your catalog, you must also create an event source group. Event source groups are used to fill audiences.

```html
curl \
  -F 'name=My Travel Company Events' \
  -F 'event_sources=["<PIXEL_ID>","<APP_ID>"]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<BUSINESS_ID>/event_source_groups
```

You must then share this event source group out to any ad accounts that wish to create an audience backed by it. To share the event source group, make an `HTTP POST` call:

```html
curl \
  -F 'accounts=["<ACCOUNT_ID_WITHOUT_ACT>"]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<EVENT_SOURCE_GROUP_ID>/shared_accounts
```

## Step 2: Create travel audiences {#create-audience}

At this point you should have your user signal (for example, pixel, or app events) set up and associated with an [event source group](#create-esg) and your travel catalog(s).

To target people who have shown explicit travel intent, you must create a dynamic travel audience of people who you would like to serve the ad to. You can include and exclude people based on their travel intent signals. You can also apply additional rule-based filters on top of the events like with Website Custom Audiences. The `flight_set_id` field is required for a dynamic flight audience. For hotel and destination audiences, you are not required to specify a `hotel_set_id` or `destination_set_id`.

To set up a new travel audience, make an `HTTP POST` to `/act_<AD_ACCOUNT_ID>/customaudiences`.

### Audience parameters

| Field and Type | Description |
| --- | --- |
| `claim_objective`<br><br>Type: `enum {TRAVEL}` | **Required**.<br><br>The objective of the audience.<br><br>Must be set to `TRAVEL`. |
| `content_type`<br><br>Type: `enum {HOTEL, FLIGHT, DESTINATION}` | **Required**.<br><br>Specify the type of signal that should be used to build this audience.<br><br>Must be set to `HOTEL`, `FLIGHT` or `DESTINATION`. |
| `event_sources`<br><br>Type: `json string` | An array of `id` and `type` pairs. The `id` field takes a single event source id, and the `type` field is either a pixel, app, or `offline_events`. For example:<br><br>```
"event_sources": [
 {
 "type": "pixel",
 "id": "562030684179932"
 },
 {
 "type": "app",
 "id": "562030684179934"
 }
]
```<br><br>Required if you do not provide `event_source_group`. If you do provide, do not also provide `event_source_group`. |
| `event_source_group`<br><br>Type: `id` | Specify the event source group whose events will back the audience. Required if you don't provide `event_sources`. |
| `inclusions`<br><br>Type: `object[]` | **Required**.<br><br>An array of JSON objects listing each intent signal that would make an Accounts Center account eligible for this audience. See [**Inclusion Object Parameters**](#inclusion-object) table below. |
| `description`<br><br>Type: `string` | A further description of the audience. |
| `exclusions`<br><br>Type: `object[]` | An array of JSON objects listing each intent signal that would exclude an eligible Accounts Center account from this audience. See [**Exclusion Object Parameters**](#exclusion-object) table below. |
| `rule`<br><br>Type: `object` | A classical [audience rule](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences#audiencerules) to be applied to the event stream before any `inclusions` and `exclusions` are processed. Use any of the classical parameters, and see [**Rule Object Travel Parameters**](#rule-object) table below for travel ads-specific parameters. |

#### Inclusion object parameters {#inclusion-object}

| Field Name and Type | Description |
| --- | --- |
| `event`<br><br>Type: `enum {Search, ViewContent, InitiateCheckout, Purchase}` | **Required**.<br><br>The event name of a signal you want to consider for inclusion.<br><br>Example: `{"event": "Search", …}` |
| `retention`<br><br>Type: `object` | **Required**.<br><br>The minimum/maximum amount of time since the event was received for it to be considered for purposes of inclusion. The retention window must be at least 4 hours.<br><br>See [**Retention Object Parameters**](#retention-object) table below.<br><br>Example: `{…, "retention": {"min_seconds": 0, "max_seconds": 259200}, …}` |
| `booking_window`<br><br>Type: `object` | Booking window is the time in seconds between the user's check-in date and the current time. You specify a range and only people whose booking window is within this range are included. Negative booking windows are also supported, allowing you to include people whose check-in date has passed.<br><br>See [**Booking Window Object Parameters**](#booking_window-object) table below.<br><br>Examples:<br><br>* `{"booking_window": {"min_seconds": 0, "max_seconds": 259200}}`<br>* `{"booking_window": {"max_seconds": 0}}` |
| `count`<br><br>Type: `JSON` operators | The number of times that the event has been fired. You can use both equality and numeric comparison operators here.<br><br>Examples: `{…"count": {"lte": 3}, …}` |

#### Retention object parameters {#retention-object}

| Field Name and Type | Description |
| --- | --- |
| `max_seconds`<br><br>Type: `int` | **Required**.<br><br>The maximum amount of time (in seconds) since the event was received.<br><br>Example: `259200` |
| `min_seconds`<br><br>Type: `int` | The minimum amount of time (in seconds) since the event was received.<br><br>Example: `0` |

#### Booking window object parameters {#booking_window-object}

| Field Name and Type | Description |
| --- | --- |
| `min_seconds`<br><br>Type: `int` | **Required**.<br><br>The minimum amount of time (in seconds) between current date and the desired check-in date of the user.<br><br>Example: `172800` |
| `max_seconds`<br><br>Type: `int` | **Required**.<br><br>The maximum amount of time (in seconds) between current date and the desired check-in date.<br><br>Example: `604800` |

#### Exclusion object parameters {#exclusion-object}

| Field Name and Type | Description |
| --- | --- |
| `event`<br><br>Type: `enum { Search, ViewContent, InitiateCheckout, Purchase }` | **Required**.<br><br>The event name of a signal you want to consider for exclusion.<br><br>Example: `{"event": "Search", …}` |
| `retention`<br><br>Type: `object` | **Required**.<br><br>The minimum/maximum amount of time since the event was received for it to be considered for purposes of exclusion. The retention window must be at least 4 hours.<br><br>See [**Retention Object Parameters**](#retention-object) table below.<br><br>Example: `{…, "retention": {"min_seconds": 0, "max_seconds": 259200}, …}` |

#### Rule object travel parameters {#rule-object}

Just as with the classical parameter, each parameter here can be used with any of the standard `JSON` [operators](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences#audiencerules).

| Field Name and Type | Description |
| --- | --- |
| `hotel_set_id`<br><br>Type: `int` | Matches only those events when at least one `content_id` exists in the specified `hotel_set_id`.<br><br>Only for travel audiences with `content_type` set to `HOTEL`.<br><br>Example: `{…, "hotel_set_id": {"eq": 123456789}, …}` |
| `destination_set_id`<br><br>Type: `int` | Matches only those events when at least one `content_id` exists in the specified `destination_set_id`.<br><br>Only for travel audiences with `content_type` set to `DESTINATION`.<br><br>Example: `{…, "destination_set_id": {"eq": 123456789}, …}` |
| `flight_set_id`<br><br>Type: `int` | Required for flight ads.<br><br>Matches only those events when the route (`origin_airport` to `destination_airport`) exists in the specified `flight_set_id`.<br><br>Only for travel audiences with `content_type` set to `FLIGHT`.<br><br>Example: `{…, "flight_set_id": {"eq": 123456789}, …}` |
| `length_of_stay`<br><br>Type: `int` | Number of nights spent during the trip.<br><br>Example: `{… "length_of_stay": {"eq": 1}, …}` |
| `number_of_weekends`<br><br>Type: `int` | Number of weekends between the start and end date.<br><br>Example: `{…, "number_of_weekends": {"gte": 5}, …}` |
| `num_travelers`<br><br>Type: `int` | Total number of travelers.<br><br>* For a `content_type` of `HOTEL` or `DESTINATION` this is `num_adults` + `num_children`<br>* For a `content_type` of `FLIGHT`, this also includes `num_infants`<br><br>Example: `{…, "num_travelers": {"gt": 1}, …}` |
| Date fields:<br><br>[Hotel ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/events#parameter-details)<br><br>* `checkin_date`<br>* `checkout_date`<br><br>[Flight ads](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-flights/events#parameter-details)<br><br>* `departing_departure_date`<br>* `departing_arrival_date`<br>* `returning_departure_date`<br>* `returning_arrival_date`<br><br>[Destination ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/events#parameter-details)<br><br>* `travel_start`<br>* `travel_end`<br><br>Type: `string` | Use relevant date fields based on `content_type`.<br><br>Example: `{"checkin_date": {"gte": "2016-09-01"}}` |
| `itinerary_contains_date`<br><br>Type: `string` | Trip contains a specific date.<br><br>Example: `{"itinerary_contains_date": {"eq": "2016-12-25"}}` |

### Code samples

Single travelers who have searched at least 3 times in the last 5 days but haven't booked yet:

```html
curl \
  -F 'name=Travel Audience' \
  -F 'subtype=CLAIM' \
  -F 'claim_objective=TRAVEL' \
  -F 'content_type=HOTEL' \
  -F 'event_source_group=<EVENT_SOURCE_GROUP_ID>' \
  -F 'rule={"num_travelers":{"eq":1}}' \
  -F 'inclusions=[
    {
      "event": "Search",
      "count": {"gt":3},
      "retention": {"min_seconds":0,"max_seconds":432000}
    }
  ]' \
  -F 'exclusions=[{"event":"Purchase","retention":{"min_seconds":0,"max_seconds":172800}}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

People who viewed or started booking a hotel in a hotel set in the last 2 days but never completed their booking:

```html
curl \
  -F 'name=Travel Audience' \
  -F 'subtype=CLAIM' \
  -F 'claim_objective=TRAVEL' \
  -F 'content_type=HOTEL' \
  -F 'event_source_group=<EVENT_SOURCE_GROUP_ID>' \
  -F 'rule={"hotel_set_id":{"eq":"<HOTEL_SET_ID>"}}' \
  -F 'inclusions=[
    {"event":"ViewContent","retention":{"min_seconds":0,"max_seconds":172800}},
    {
      "event": "InitiateCheckout",
      "retention": {"min_seconds":0,"max_seconds":172800}
    }
  ]' \
  -F 'exclusions=[{"event":"Purchase","retention":{"min_seconds":0,"max_seconds":172800}}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

People who have initiated checkout or purchased the flight tickets in the last 5 days and their flight booking window is between 2 to 7 days:

```html
curl \
  -F 'name=Travel Audience' \
  -F 'subtype=CLAIM' \
  -F 'claim_objective=TRAVEL' \
  -F 'content_type=FLIGHT' \
  -F 'event_source_group=<EVENT_SOURCE_GROUP_ID>' \
  -F 'inclusions=[
    {
      "event": "InitiateCheckout",
      "retention": {"min_seconds":0,"max_seconds":432000},
      "booking_window": {"min_seconds":172800,"max_seconds":604800}
    },
    {
      "event": "Purchase",
      "retention": {"min_seconds":0,"max_seconds":432000},
      "booking_window": {"min_seconds":172800,"max_seconds":604800}
    }
  ]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

People who have searched hotels in 'New York City' more than 3 times in the past 2 days but haven't booked yet:

```html
curl \
  -F 'name=Travel Audience' \
  -F 'subtype=CLAIM' \
  -F 'claim_objective=TRAVEL' \
  -F 'content_type=HOTEL' \
  -F 'event_source_group=<EVENT_SOURCE_GROUP_ID>' \
  -F 'rule={"destination":{"i_contains":"New York City"}}' \
  -F 'inclusions=[
    {
      "event": "Search",
      "count": {"gt":3},
      "retention": {"min_seconds":0,"max_seconds":172800}
    }
  ]' \
  -F 'exclusions=[{"event":"Purchase","retention":{"min_seconds":0,"max_seconds":172800}}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

People who have searched hotels between specific `checkin_date` and `checkout_date` in the past 2 days but haven't booked yet:

```html
curl \
  -F 'name=Travel Audience' \
  -F 'subtype=CLAIM' \
  -F 'claim_objective=TRAVEL' \
  -F 'content_type=HOTEL' \
  -F 'event_source_group=<EVENT_SOURCE_GROUP_ID>' \
  -F 'rule={
    "and": [
      {"checkin_date":{"gte":"2018-02-02"}},
      {"checkout_date":{"lte":"2018-02-05"}}
    ]
  }' \
  -F 'inclusions=[{"event":"Search","retention":{"min_seconds":0,"max_seconds":172800}}]' \
  -F 'exclusions=[{"event":"Purchase","retention":{"min_seconds":0,"max_seconds":172800}}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

People who have searched hotel stays containing a specific date (such as Christmas) in the past 2 days but haven't booked yet:

```html
curl \
  -F 'name=Travel Audience' \
  -F 'subtype=CLAIM' \
  -F 'claim_objective=TRAVEL' \
  -F 'content_type=HOTEL' \
  -F 'event_source_group=<EVENT_SOURCE_GROUP_ID>' \
  -F 'rule={"itinerary_contains_date":{"eq":"2018-12-25"}}' \
  -F 'inclusions=[{"event":"Search","retention":{"min_seconds":0,"max_seconds":172800}}]' \
  -F 'exclusions=[{"event":"Purchase","retention":{"min_seconds":0,"max_seconds":172800}}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

People who create an audience for one-way flights:

```html
curl \
  -F 'name=Travel Audience' \
  -F 'claim_objective=TRAVEL' \
  -F 'content_type=FLIGHT' \
  -F 'event_source_group=<EVENT_SOURCE_GROUP_ID>' \
  -F 'rule={"and":[{"returning_departure_date":{"exists":false]}}' \
  -F 'inclusions=[
    {
      "event": "Search",
      "count": {"gt":3},
      "retention": {"min_seconds":0,"max_seconds":432000}
    }
  ]' \
  -F 'exclusions=[{"event":"Purchase","retention":{"min_seconds":0,"max_seconds":172800}}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

Once you have created your audience(s), they can then be added to the targeting spec in your **travel ads** campaign.
