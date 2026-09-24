<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/events | Saved: 2026-09-19 -->

# Destination Ads - Events



Destination ads use four events. Every event has a set of parameters (full list at [event parameter details](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/events#parameter-details)). Use the [Meta Pixel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/events#facebook-pixel) on your website, and mobile app events in your [Android app](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/events#android-app-events) and [iOS app](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/events#ios-app-events). Learn more about [standard and custom events](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#standard-events).

| Event | When to fire | Code Sample |
| --- | --- | --- |
| Search | On the destination search results page | [Pixel](#search-pixel-event), [Android](#search-android-event), [iOS](#search-ios-event) |
| ViewContent | On the destination details page | [Pixel](#viewcontent-pixel-event), [Android](#viewcontent-android-event), [iOS](#viewcontent-ios-event) |
| InitiateCheckout | When a user enters the payment screen | [Pixel](#ic-pixel-event), [Android](#ic-android-event), [iOS](#ic-ios-event) |
| Purchase | On the purchase confirmed page | [Pixel](#purchase-pixel-event), [Android](#purchase-android-event), [iOS](#purchase-ios-event) |

## Meta Pixel for Websites {#meta-pixel}

This guide assumes you already have a Meta Pixel installed. If not, see [Using Marketing API with the Meta Pixel](https://developers.facebook.com/docs/marketing-api/audiences-api/pixel).

Make sure the pixel base code is already loaded when you fire an event. If you use a tag manager, make sure you include the tag that contains the pixel code on every page. The tag should appear before the tag that contains the pixel event code. Use the [Meta Pixel Helper](https://developers.facebook.com/docs/facebook-pixel/pixel-helper) to validate your pixel implementation.

#### Search pixel event {#search-pixel-event}

```
// This sample assumes the Meta Pixel base code is already loaded

fbq('track', 'Search', {
  // Fire the 'Search' event on the search results page

  // IF YOU CHOOSE NOT TO USE A RECOMMENDED PARAM, THEN REMOVE IT, DON'T LEAVE IT EMPTY

  // REQUIRED: city, don't use abbreviations
  city: 'New York',

  // REQUIRED: region, don't use abbreviations
  region: 'New York',

  // REQUIRED: country, don't use abbreviations
  country: 'United States',

  // RECOMMENDED: set to 'destination'
  content_type: 'destination',

  // RECOMMENDED: travel start date
  // Allows you to target people based on their travel dates (using a booking window)
  // Improves the landing experience with travel dates filled in (using template tags)
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  travel_start: '2018-04-01',

  // RECOMMENDED: travel end date
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  travel_end: '2018-04-05',

  // RECOMMENDED: content ids - include eg top 5 search results
  content_ids: '["123", "234", "345", "456", "567"]',

  // RECOMMENDED: number of adults
  num_adults: 1,

  // RECOMMENDED: number of children
  num_children: 0
});
```

#### ViewContent pixel event {#viewcontent-pixel-event}

```
// This sample assumes the Meta Pixel base code is already loaded

fbq('track', 'ViewContent', {
  // Fire the 'ViewContent' event on the destination details page

  // IF YOU CHOOSE NOT TO USE A RECOMMENDED PARAM, THEN REMOVE IT, DON'T LEAVE IT EMPTY

  // REQUIRED: content id of destination that is shown
  content_ids: '123',

  // RECOMMENDED: set to : 'destination',

  // RECOMMENDED: travel start date
  // Allows you to target people based on their travel dates (using a booking window)
  // Improves the landing experience with travel dates filled in (using template tags)
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  travel_start: '2018-04-01',

  // RECOMMENDED: travel end date
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  travel_end: '2018-04-05',

  // RECOMMENDED: city, don't use abbreviations
  city: 'New York',

  // RECOMMENDED: region, don't use abbreviations
  region: 'New York',

  // RECOMMENDED: country, don't use abbreviations
  country: 'United States',

  // RECOMMENDED: number of adults
  num_adults: 1,

  // RECOMMENDED: number of children
  num_children: 0
});
```

#### InitiateCheckout pixel event {#ic-pixel-event}

```
// This sample assumes the Meta Pixel base code is already loaded

fbq('track', 'InitiateCheckout', {
   // Fire the 'InitiateCheckout' event when the user enters the payment screen

  // IF YOU CHOOSE NOT TO USE A RECOMMENDED PARAM, THEN REMOVE IT, DON'T LEAVE IT EMPTY

  // REQUIRED: content id of destination that is being booked
  content_ids: '123',

  // REQUIRED: city, don't use abbreviations
  city: 'New York',

  // REQUIRED: region, don't use abbreviations
  region: 'New York',

  // REQUIRED: country, don't use abbreviations
  country: 'United States',

  // RECOMMENDED: set to 'destination'
  content_type: 'destination',

  // RECOMMENDED: travel start date
  // Allows you to target people based on their travel dates (using a booking window)
  // Improves the landing experience with travel dates filled in (using template tags)
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  travel_start: '2018-04-01',

  // RECOMMENDED: travel end date
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  travel_end: '2018-04-05',

  // RECOMMENDED: number of adults
  num_adults: 1,

  // RECOMMENDED: number of children
  num_children: 0
});
```

#### Purchase pixel event {#purchase-pixel-event}

```
// This sample assumes the Meta Pixel base code is already loaded

fbq('track', 'Purchase', {
   // Fire the 'Purchase' event on the booking or purchase confirmation page

  // IF YOU CHOOSE NOT TO USE A RECOMMENDED PARAM, THEN REMOVE IT, DON'T LEAVE IT EMPTY

  // REQUIRED: content id of destination that is being booked
  content_ids: '123',

  // REQUIRED: city, don't use abbreviations
  city: 'New York',

  // REQUIRED: region, don't use abbreviations
  region: 'New York',

  // REQUIRED: country, don't use abbreviations
  country: 'United States',

// REQUIRED: total value of booking
  value: 1200,

  // REQUIRED: currency of booking
  currency: 'USD',

  // RECOMMENDED: set to 'destination'
  content_type: 'destination',

  // RECOMMENDED: travel start date
  // Allows you to target people based on their travel dates (using a booking window)
  // Improves the landing experience with travel dates filled in (using template tags)
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  travel_start: '2018-04-01',

  // RECOMMENDED: travel end date
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  travel_end: '2018-04-05',

  // RECOMMENDED: number of adults
  num_adults: 1,

  // RECOMMENDED: number of children
  num_children: 0
});
```

## Mobile App Events for Android {#android-app-events}

This guide assumes you have the Facebook SDK implemented in your Android mobile app. If not, see the [Android SDK](https://developers.facebook.com/docs/android). If you use a measurement partner, make sure they pass required events to Meta.

#### Search Android event {#search-android-event}

```
Bundle parameters = new Bundle();
// IF YOU CHOOSE NOT TO USE A RECOMMENDED PARAM, THEN REMOVE IT, DON'T LEAVE IT EMPTY

// REQUIRED: city, don't use abbreviations
parameters.putString("fb_city", "New York");

// REQUIRED: region, don't use abbreviations
parameters.putString("fb_region", "New York");

// REQUIRED: country
parameters.putString("fb_country", "United States");

// RECOMMENDED: set to 'destination'
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "destination");

// RECOMMENDED: content ids - include eg top 5 search results
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_ID, "[\"123\", \"234\", \"345\", \"456\", \"567\"]"); // top search results

// RECOMMENDED: travel start date
// Allows you to target people based on their travel dates (using a booking window)
// Improves the landing experience with travel dates filled in (using template tags)
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_travel_start", "2018-04-01");

// RECOMMENDED: travel end date
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_travel_end", "2018-04-05");

// RECOMMENDED: number of adults
parameters.putInt("fb_num_adults", 1);

// RECOMMENDED: number of children
parameters.putInt("fb_num_children", 0);

// Fire the 'Search' event on the search results page
logger.logEvent(
  AppEventsConstants.EVENT_NAME_SEARCHED,
  parameters
);
```

#### ViewContent Android event {#viewcontent-android-event}

```
Bundle parameters = new Bundle();
// IF YOU CHOOSE NOT TO USE A RECOMMENDED PARAM, THEN REMOVE IT, DON'T LEAVE IT EMPTY

// REQUIRED: content id of destination that is shown
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_ID, "123");

// RECOMMENDED: set to 'destination'
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "destination");

// RECOMMENDED: travel start date
// Allows you to target people based on their travel dates (using a booking window)
// Improves the landing experience with travel dates filled in (using template tags)
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_travel_start", "2018-04-01");

// RECOMMENDED: travel end date
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_travel_end", "2018-04-05");

// RECOMMENDED: city, don't use abbreviations
parameters.putString("fb_city", "New York");

// RECOMMENDED: region, don't use abbreviations
parameters.putString("fb_region", "New York");

// RECOMMENDED: country
parameters.putString("fb_country", "United States");

// RECOMMENDED: number of adults
parameters.putInt("fb_num_adults", 1);

// RECOMMENDED: number of children
parameters.putInt("fb_num_children", 0);

// Fire the 'ViewContent' event on the destination details page
logger.logEvent(
  AppEventsConstants.EVENT_NAME_VIEWED_CONTENT,
  parameters
);
```

#### InitiateCheckout Android event {#ic-android-event}

```
Bundle parameters = new Bundle();
// IF YOU CHOOSE NOT TO USE A RECOMMENDED PARAM, THEN REMOVE IT, DON'T LEAVE IT EMPTY

// REQUIRED: content id of destination that is being booked
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_ID, "123");

// RECOMMENDED: set to 'destination'
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "destination");

// REQUIRED: city, don't use abbreviations
parameters.putString("fb_city", "New York");

// REQUIRED: region, don't use abbreviations
parameters.putString("fb_region", "New York");

// REQUIRED: country
parameters.putString("fb_country", "United States");

// RECOMMENDED: travel start date
// Allows you to target people based on their travel dates (using a booking window)
// Improves the landing experience with travel dates filled in (using template tags)
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_travel_start", "2018-04-01");

// RECOMMENDED: travel end date
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_travel_end", "2018-04-05");

// RECOMMENDED: number of adults
parameters.putInt("fb_num_adults", 1);

// RECOMMENDED: number of children
parameters.putInt("fb_num_children", 0);

// Fire the 'InitiateCheckout' event when the user enters the payment screen
logger.logEvent(
  AppEventsConstants.EVENT_NAME_INITIATED_CHECKOUT,
  parameters
);
```

#### Purchase Android event {#purchase-android-event}

```
// total value of booking
BigDecimal purchaseAmount = BigDecimal.valueOf(1200);

// REQUIRED: currency of booking
Currency currency = Currency.getInstance("USD");

Bundle parameters = new Bundle();
// IF YOU CHOOSE NOT TO USE A RECOMMENDED PARAM, THEN REMOVE IT, DON'T LEAVE IT EMPTY

// REQUIRED: content id of destination that is being booked
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_ID, "123");

// REQUIRED: city, don't use abbreviations
parameters.putString("fb_city", "New York");

// REQUIRED: region, don't use abbreviations
parameters.putString("fb_region", "New York");

// REQUIRED: country
parameters.putString("fb_country", "United States");

// RECOMMENDED: set to 'destination'
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "destination");

// RECOMMENDED: travel start date
// Allows you to target people based on their travel dates (using a booking window)
// Improves the landing experience with travel dates filled in (using template tags)
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_travel_start", "2018-04-01");

// RECOMMENDED: travel end date
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_travel_end", "2018-04-05");

// RECOMMENDED: number of adults
parameters.putInt("fb_num_adults", 1);

// RECOMMENDED: number of children
parameters.putInt("fb_num_children", 0);

// Use the built-in SDK method when the booking is confirmed
logger.logPurchase(
  purchaseAmount,
  currency,
  parameters
);
```

## Mobile App Events for iOS {#ios-app-events}

This guide assumes you already have the Facebook SDK implemented in your iOS mobile app. If not, see  [iOS SDK](https://developers.facebook.com/docs/ios). If you use a measurement partner, make sure they pass the required events to Meta.

#### Search iOS event {#search-ios-event}

```
// Fire the 'Search' event on the search results page
[[FBSDKAppEvents shared] logEvent:FBSDKAppEventNameSearched

  // IF YOU CHOOSE NOT TO USE A RECOMMENDED PARAM, THEN REMOVE IT, DON'T LEAVE IT EMPTY
  parameters:@{

    // REQUIRED: city, don't use abbreviations
    @"fb_city" : @"New York",

    // REQUIRED: region, don't use abbreviations
    @"fb_region" : @"New York",

    // REQUIRED: country, don't use abbreviations
    @"fb_country" : @"United States",

    // RECOMMENDED: If sent, it must be set to 'destination'
    FBSDKAppEventParameterNameContentType : @"destination",

    // RECOMMENDED: content ids - include eg top 5 search results
    FBSDKAppEventParameterNameContentID : @"[\"123\", \"234\", \"345\", \"456\", \"567\"]",

    // RECOMMENDED: travel start date
    // Allows you to target people based on their travel dates (using a booking window)
    // Improves the landing experience with travel dates filled in (using template tags)
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_travel_start" : @"2018-04-01",

    // RECOMMENDED: travel end date
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_travel_end" : @"2018-04-15",

    // RECOMMENDED: number of adults
    @"fb_num_adults" : @1,

    // RECOMMENDED: number of children
    @"fb_num_children" : @0
  }
];
```

#### ViewContent iOS event {#viewcontent-ios-event}

```
// Fire the 'ViewContent' event on the destination details page
[[FBSDKAppEvents shared] logEvent:FBSDKAppEventNameViewedContent

  // IF YOU CHOOSE NOT TO USE A RECOMMENDED PARAM, THEN REMOVE IT, DON'T LEAVE IT EMPTY
  parameters:@{

    // REQUIRED: content id of destination that is shown
    FBSDKAppEventParameterNameContentID : @"123",

    // RECOMMENDED: If sent, it must be set to 'destination'
    FBSDKAppEventParameterNameContentType : @"destination",

    // RECOMMENDED: travel start date
     // Allows you to target people based on their travel dates (using a booking window)
     // Improves the landing experience with travel dates filled in (using template tags)
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_travel_start_date" : @"2018-04-01",

    // RECOMMENDED: travel end date
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_travel_end_date" : @"2018-04-15",

    // RECOMMENDED: city, don't use abbreviations
    @"fb_city" : @"New York",

    // RECOMMENDED: region, don't use abbreviations
    @"fb_region" : @"New York",

    // RECOMMENDED: country, don't use abbreviations
    @"fb_country" : @"United States",

    // RECOMMENDED: number of adults
    @"fb_num_adults" : @1,

    // RECOMMENDED: number of children
    @"fb_num_children" : @0
  }
];
```

#### InitiateCheckout iOS event {#ic-ios-event}

```
// Fire the 'InitiateCheckout' event when the user enters the payment screen
[[FBSDKAppEvents shared] logEvent:FBSDKAppEventNameInitiatedCheckout

  // IF YOU CHOOSE NOT TO USE A RECOMMENDED PARAM, THEN REMOVE IT, DON'T LEAVE IT EMPTY
  parameters:@{

    // REQUIRED: content id of destination that is being booked
    FBSDKAppEventParameterNameContentID : @"123",

    // RECOMMENDED: If sent, it must be set to 'destination'
    FBSDKAppEventParameterNameContentType : @"destination",

    // REQUIRED: city, don't use abbreviations
    @"fb_city" : @"New York",

    // REQUIRED: region, don't use abbreviations
    @"fb_region" : @"New York",

    // REQUIRED: country, don't use abbreviations
    @"fb_country" : @"United States",

    // RECOMMENDED: travel start date
    // Allows you to target people based on their travel dates (using a booking window)
    // Improves the landing experience with travel dates filled in (using template tags)
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_travel_start" : @"2018-04-01",

    // RECOMMENDED: travel end date
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_travel_end" : @"2018-04-15",

    // RECOMMENDED: number of adults
    @"fb_num_adults" : @1,

    // RECOMMENDED: number of children
    @"fb_num_children" : @0
  }
];
```

#### Purchase iOS event {#purchase-ios-event}

```
// Fire the 'Purchase' event when the booking is confirmed
[[FBSDKAppEvents shared] logPurchase:1200

  // currency of booking
  currency:@"USD"

  // IF YOU CHOOSE NOT TO USE A RECOMMENDED PARAM, THEN REMOVE IT, DON'T LEAVE IT EMPTY
  parameters:@{

    // REQUIRED: content id of destination that is being booked
    FBSDKAppEventParameterNameContentID : @"123",

    // RECOMMENDED: If sent, it must be set to 'destination'
    FBSDKAppEventParameterNameContentType : @"destination",

    // REQUIRED: city, don't use abbreviations
    @"fb_city" : @"New York",

    // REQUIRED: region, don't use abbreviations
    @"fb_region" : @"New York",

    // REQUIRED: country, don't use abbreviations
    @"fb_country" : @"United States",

    // RECOMMENDED: travel start date
     // Allows you to target people based on their travel dates (using a booking window)
     // Improves the landing experience with travel dates filled in (using template tags)
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_travel_start" : @"2018-04-01",

    // RECOMMENDED: travel end date
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_travel_end" : @"2018-04-15",

    // RECOMMENDED: number of adults
    @"fb_num_adults" : @1,

    // RECOMMENDED: number of children
    @"fb_num_children" : @0
  }
];
```

## Event parameters details {#parameter-details}

On mobile, the parameter names are different from those for Meta Pixel. They are often prepended by `fb_`, with a few exceptions such as `content_ids` (which becomes `fb_content_id`) and `value` (which becomes `_valueToSum`).

When you send multiple values, for example with `content_ids` or `content_type`, provide a JSON-encoded array of values: `'["value1", "value2"]'`. **Do not concatenate** values with a comma.

| Parameter Name and Type | Description |
| --- | --- |
| `travel_start` (pixel)<br><br>`fb_travel_start` (app)<br><br>type: string | **Recommended**.<br><br>The start date of the user's trip. Meta accepts dates in `YYYYMMDD`, `YYYY-MM-DD`, `YYYY-MM-DDThh:mmTZD` and `YYYY-MM-DDThh:mm:ssTZD`. When provided, you can use this in the ad using [template tags](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/template-tags) and target people based on their travel dates [using booking window in your audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads/audience-management).<br><br>Examples:<br><br>* `20180623`<br>* `2018-06-23`<br>* `2017-06-23T15:30GMT`<br>* `2017-06-23T15:30:00GMT` |
| `travel_end` (pixel)<br><br>`fb_travel_end` (app)<br><br>type: string | **Recommended**.<br><br>The end date of the user's trip. Meta accepts the same date formats listed for `travel_start`. When provided, you can use this in the ad using [template tags](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/template-tags) and target people based on their travel dates [using booking window in your audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads/audience-management). |
| `content_ids` (pixel)<br><br>`fb_content_id` (app)<br><br>type: string or string[] | Recommended for `search`, **Required** for all others.<br><br>Any relevant ID(s) as listed in your travel catalog, e.g. for `ViewContent` event you might send the ID of the item presented, or for `Search` event you might send an array of IDs for the top search results.<br><br>Examples:<br><br>* `"1234"`<br>* `'["1234", "2345", "3456"]'` |
| `content_type` (pixel)<br><br>`fb_content_type` (app)<br><br>type: string or string[] | **Recommended**.<br><br>If sent, must be `destination`. If combined with another DAT product (for example, hotels) use `'["destination", "hotel"]'`. |
| `city` (pixel)<br><br>`fb_city` (app)<br><br>type: string | **Required** for `search`.<br><br>Provide the city of the location from user intent.<br><br>Example: `Auckland`. |
| `region` (pixel)<br><br>`fb_region` (app)<br><br>type: string | **Required** for `search`.<br><br>Provide the region of the location from user intent.<br><br>Example: `Manhattan`. |
| `country` (pixel)<br><br>`fb_country` (app)<br><br>type: string | **Required** for `search`.<br><br>Provide the country of the location from user intent.<br><br>Example: `New Zealand` |
| `num_adults` (pixel)<br><br>`fb_num_adults` (app)<br><br>type: string | Number of adults that will be traveling. When provided, you can use this in the ad using [template tags](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/template-tags).<br><br>Example: `2`. |
| `num_children` (pixel)<br><br>`fb_num_children` (app)<br><br>type: int | Number of children that will be traveling. When provided, you can use this in the ad using [template tags](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/template-tags).<br><br>Example: `2`. |
| `suggested_destinations` (pixel)<br><br>`fb_suggested_destinations` (app)<br><br>type: string or string[ ] | A list of IDs representing destination suggestions for this user. Do not send this parameter for the `Search` event.<br><br>Example: `'["1234", "2345", "3456"]'` |
| `value` (pixel)<br><br>`valueToSum` (app)<br><br>type: float | Required for purchase. A total price of the booking (a number that quantifies the value of this event to the advertiser).<br><br>Example: `155` |
| `currency` (pixel)<br><br>`fb_currency` (app)<br><br>type: string | Required for purchase. Currency for the value. Specified using [ISO 4217](https://www.iso.org/iso-4217-currency-codes.html) currency format.<br><br>Example: `USD` |

