<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/flight-ads/events | Saved: 2026-09-19 -->

# Flight Ads - Events



Flight Ads uses four events. Every event has a set of parameters, see **[event parameter details](#parameter-details)**. Use the [Meta Pixel](#meta-pixel) on your website, and mobile app events in your [Android app](#android-app-events) and [iOS app](#ios-app-events).

| Event | When to Fire | Code Sample |
| --- | --- | --- |
| `Search` | On the flight search results page | [Pixel](#search-pixel-event), [Android](#search-android-event), [iOS](#search-ios-event) |
| `ViewContent` | When the user has selected the flight(s) | [Pixel](#viewcontent-pixel-event), [Android](#viewcontent-android-event), [iOS](#viewcontent-ios-event) |
| `InitiateCheckout` | When the user enters the payment screen | [Pixel](#initiatecheckout-pixel-event), [Android](#initiatedcheckout-android-event), [iOS](#initiatedcheckout-ios-event) |
| `Purchase` | On the booking confirmed page | [Pixel](#purchase-pixel-event), [Android](#purchase-android-event), [iOS](#purchase-ios-event) |

## Meta Pixel for Websites {#meta-pixel}

This guide assumes you already have a Meta Pixel installed. If not, see [Using Marketing API with the Meta Pixel](https://developers.facebook.com/docs/marketing-api/audiences-api/pixel).

Make sure the pixel base code is already loaded when you fire an event. If you use a tag manager, make sure you include the tag that contains the pixel code on every page. The tag should appear before the tag that contains the pixel event code. Use the [Meta Pixel Helper](https://developers.facebook.com/docs/facebook-pixel/pixel-helper) to validate your pixel implementation.

#### Search Pixel Event {#search-pixel-event}

```
// This sample assumes the Facebook pixel base code is already loaded

fbq('track', 'Search', {
  // Fire the 'Search' event on the search results page

  // IF YOU DO NOT TO USE A RECOMMENDED PARAM, THEN REMOVE, DON'T LEAVE EMPTY

  // RECOMMENDED: set to 'flight'
  content_type: 'flight',

  // HIGHLY RECOMMENDED: departure date
  // Allows you to target people based on their travel dates, using a booking window
  // Improves the landing experience with travel dates filled in using template tags
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  departing_departure_date: '2018-12-12',

  // HIGHLY RECOMMENDED: return date, in case of round trip, remove otherwise
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  returning_departure_date: '2018-12-19',

  // REQUIRED: use official IATA code of departure airport
  origin_airport: 'SFO',

  // REQUIRED: use official IATA code of destination airport
  destination_airport: 'JFK',

  // RECOMMENDED: arrival date of departure flight
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  departing_arrival_date: '2018-12-12',

  // RECOMMENDED: arrival date of return flight
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  returning_arrival_date: '2018-12-20',

  // RECOMMENDED: number of adults on flight
  num_adults: 1,

  // RECOMMENDED: number of children on flight
  num_children: 0,

  // RECOMMENDED: number of infants
  num_infants: 0,

  // RECOMMENDED: travel class
  // must be 'economy', 'premium', 'business' or 'first'
  travel_class : 'economy',

  // RECOMMENDED: price for the flight
  // Use lowest price if you show multiple options on this page
  // Should not include cost of extras, such as seat selection, extra luggage
  price : 100,

  // RECOMMENDED: currency of the flight price
  // Must match currency of catalog
  currency: 'USD'
});
```

#### ViewContent Pixel Event {#viewcontent-pixel-event}

```
// This sample assumes the FB Pixel base code is already loaded

fbq('track', 'ViewContent', {
  // Fire the 'ViewContent' event when the user has selected the flight(s)

  // IF YOU DO NOT TO USE A RECOMMENDED PARAM, REMOVE IT, DON'T LEAVE EMPTY

  // RECOMMENDED: set to 'flight'
  content_type: 'flight',

  // HIGHLY RECOMMENDED: departure date
  // Allows you to target people based on their travel dates, using a booking window
  // Improves the landing experience with travel dates filled in, using template tags
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  departing_departure_date: '2018-12-12',

  // HIGHLY RECOMMENDED: return date, in case of round trip, remove otherwise
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  returning_departure_date: '2018-12-19',

  // REQUIRED: use official IATA code of departure airport
  origin_airport: 'SFO',

  // REQUIRED: use official IATA code of destination airport
  destination_airport: 'JFK',

  // RECOMMENDED: arrival date of departure flight
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  departing_arrival_date: '2018-12-12',

  // RECOMMENDED: arrival date of return flight
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  returning_arrival_date: '2018-12-20',

  // RECOMMENDED: number of adults on flight
  num_adults: 1,

  // RECOMMENDED: number of children on flight
  num_children: 0,

  // RECOMMENDED: number of infants
  num_infants: 0,

  // RECOMMENDED: travel class
  // must be 'economy', 'premium', 'business' or 'first'
  travel_class : 'economy'
});
```

#### InitiateCheckout Event {#initiatecheckout-pixel-event}

```
// Assumes FB Pixel base code already loaded

fbq('track', 'InitiateCheckout', {
  // Fire the 'InitiateCheckout' event when the user enters the payment screen

  // IF YOU DO NOT TO USE A RECOMMENDED PARAM, THEN REMOVE, DON'T LEAVE IT EMPTY

  // RECOMMENDED: set to 'flight'
  content_type: 'flight',

  // HIGHLY RECOMMENDED: departure date
  // Allows you to target people based on their travel dates, using a booking window
  // Improves the landing experience with travel dates filled in, using template tags
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  departing_departure_date: '2018-12-12',

  // HIGHLY RECOMMENDED: return date, in case of round trip, remove otherwise
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  returning_departure_date: '2018-12-19',

  // REQUIRED: use official IATA code of departure airport
  origin_airport: 'SFO',

  // REQUIRED: use official IATA code of destination airport
  destination_airport: 'JFK',

  // RECOMMENDED: arrival date of departure flight
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  departing_arrival_date: '2018-12-12',

  // RECOMMENDED: arrival date of return flight
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  returning_arrival_date: '2018-12-20',

  // RECOMMENDED: number of adults on flight
  num_adults: 1,

  // RECOMMENDED: number of children on flight
  num_children: 0,

  // RECOMMENDED: number of infants
  num_infants: 0,

  // RECOMMENDED: travel class
  // must be 'economy', 'premium', 'business' or 'first'
  travel_class : 'economy'
});
```

#### Purchase Event {#purchase-pixel-event}

```
// Assumes FB Pixel base code already loaded

fbq('track', 'Purchase', {
  // Fire the 'Purchase' event on the booking confirmed page

  // IF YOU DO NOT TO USE A RECOMMENDED PARAM, REMOVE IT, DON'T LEAVE EMPTY

  // RECOMMENDED: set to 'flight'
  content_type: 'flight',

  // HIGHLY RECOMMENDED: departure date
  // Allows you to target people based on their travel dates, using a booking window
  // Improves the landing experience with travel dates filled in, using template tags
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  departing_departure_date: '2018-12-12',

  // HIGHLY RECOMMENDED: return date, in case of round trip, remove otherwise
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  returning_departure_date: '2018-12-19',

  // REQUIRED: use official IATA code of departure airport
  origin_airport: 'SFO',

  // REQUIRED: use official IATA code of destination airport
  destination_airport: 'JFK',

  // RECOMMENDED: arrival date of departure flight
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  departing_arrival_date: '2018-12-12',

  // RECOMMENDED: arrival date of return flight
  // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
  returning_arrival_date: '2018-12-20',

  // RECOMMENDED: number of adults on flight
  num_adults: 1,

  // RECOMMENDED: number of children on flight
  num_children: 0,

  // RECOMMENDED: number of infants
  num_infants: 0,

  // RECOMMENDED: travel class
  // must be 'economy', 'premium', 'business' or 'first'
  travel_class : 'economy',

  // REQUIRED: Currency of payment
  // Must match currency of catalog
  currency: 'USD',

  // Total payment amount: flight price + extras + payment charges etc
  value: 150
});
```

## Mobile App Events for Android {#android-app-events}

This guide assumes you have the Facebook SDK implemented in your Android mobile app. If not, see the [Android SDK](https://developers.facebook.com/docs/android). If you use a measurement partner, make sure they pass required events to Meta.

#### Search Android Event {#search-android-event}

```
Bundle parameters = new Bundle();
// IF YOU DO NOT USE A RECOMMENDED PARAM, REMOVE IT, DON'T LEAVE IT EMPTY

// RECOMMENDED: set to 'flight'
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "flight");

// HIGHLY RECOMMENDED: departure date
// Allows you to target people based on their travel dates, using a booking window
// Improves the landing experience with travel dates filled in, using template tags
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_departing_departure_date", "2018-12-12");

// HIGHLY RECOMMENDED: return date, in case of round trip, remove otherwise
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_returning_departure_date", "2018-12-19");

// REQUIRED: use official IATA code of departure airport
parameters.putString("fb_origin_airport", "SFO");

// REQUIRED: use official IATA code of destination airport
parameters.putString("fb_destination_airport", "JFK");

// RECOMMENDED: arrival date of departure flight
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_departing_arrival_date", "2018-12-12");

// RECOMMENDED: arrival date of return flight
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_returning_arrival_date", "2018-12-20");

// RECOMMENDED: number of adults on flight
parameters.putInt("fb_num_adults", 1);

// RECOMMENDED: number of children on flight
parameters.putInt("fb_num_children", 0);

// RECOMMENDED: number of infants
parameters.putInt("fb_num_infants", 0);

// RECOMMENDED: travel class
// must be 'economy', 'premium', 'business' or 'first'
parameters.putString("fb_travel_class", "economy");

// RECOMMENDED: price for the flight
// Use lowest price if you show multiple options on this page
// Should not include cost of extras (seat selection, extra luggage etc)
parameters.putFloat("fb_price", 100.00);

// RECOMMENDED: currency of the flight price
// Must match currency of catalog
parameters.putString("fb_currency", "USD");

// Fire the 'Search' event on the search results page
logger.logEvent(
  AppEventsConstants.EVENT_NAME_SEARCHED,
  parameters
);
```

#### ViewContent Android Event {#viewcontent-android-event}

```
Bundle parameters = new Bundle();
// IF YOU DO NOT USE A RECOMMENDED PARAM, REMOVE IT, DON'T LEAVE EMPTY

// RECOMMENDED: set to 'flight'
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "flight");

// HIGHLY RECOMMENDED: departure date
// Allows you to target people based on their travel dates, using a booking window
// Improves the landing experience with travel dates filled in, using template tags
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_departing_departure_date", "2018-12-12");

// HIGHLY RECOMMENDED: return date, in case of round trip, remove otherwise
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_returning_departure_date", "2018-12-19");

// REQUIRED: use official IATA code of departure airport
parameters.putString("fb_origin_airport", "SFO");

// REQUIRED: use official IATA code of destination airport
parameters.putString("fb_destination_airport", "JFK");

// RECOMMENDED: arrival date of departure flight
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_departing_arrival_date", "2018-12-12");

// RECOMMENDED: arrival date of return flight
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_returning_arrival_date", "2018-12-20");

// RECOMMENDED: number of adults on flight
parameters.putInt("fb_num_adults", 1);

// RECOMMENDED: number of children on flight
parameters.putInt("fb_num_children", 0);

// RECOMMENDED: number of infants
parameters.putInt("fb_num_infants", 0);

// RECOMMENDED: travel class
// must be 'economy', 'premium', 'business' or 'first'
parameters.putString("fb_travel_class", "economy");

 // Fire the 'ViewContent' event when the user has selected the flight
logger.logEvent(
  AppEventsConstants.EVENT_NAME_VIEWED_CONTENT,
  parameters
);
```

#### InitiateCheckout Android Event {#initiatedcheckout-android-event}

```
Bundle parameters = new Bundle();
// IF YOU DO NOT USE A RECOMMENDED PARAM, REMOVE IT, DON'T LEAVE EMPTY

// RECOMMENDED: set to 'flight'
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "flight");

// HIGHLY RECOMMENDED: departure date
// Allows you to target people based on their travel dates, using a booking window
// Improves the landing experience with travel dates filled in (using template tags)
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_departing_departure_date", "2018-12-12");

// HIGHLY RECOMMENDED: return date, in case of round trip, remove otherwise
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_returning_departure_date", "2018-12-19");

// REQUIRED: use official IATA code of departure airport
parameters.putString("fb_origin_airport", "SFO");

// REQUIRED: use official IATA code of destination airport
parameters.putString("fb_destination_airport", "JFK");

// RECOMMENDED: arrival date of departure flight
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_departing_arrival_date", "2018-12-12");

// RECOMMENDED: arrival date of return flight
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_returning_arrival_date", "2018-12-20");

// RECOMMENDED: number of adults on flight
parameters.putInt("fb_num_adults", 1);

// RECOMMENDED: number of children on flight
parameters.putInt("fb_num_children", 0);

// RECOMMENDED: number of infants
parameters.putInt("fb_num_infants", 0);

// RECOMMENDED: travel class
// must be 'economy', 'premium', 'business' or 'first'
parameters.putString("fb_travel_class", "economy");

// Fire the 'InitiateCheckout' event when the user enters the payment screen
logger.logEvent(
  AppEventsConstants.EVENT_NAME_INITIATED_CHECKOUT,
  parameters
);
```

#### Purchase Android Event {#purchase-android-event}

```
// REQUIRED: total value of booking
BigDecimal purchaseAmount = BigDecimal.valueOf(1200);

// REQUIRED: currency of booking
Currency currency = Currency.getInstance("USD");

Bundle parameters = new Bundle();
// IF YOU DO NOT USE A RECOMMENDED PARAM, REMOVE IT, DON'T LEAVE IT EMPTY

// RECOMMENDED: set to 'flight'
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "flight");

// HIGHLY RECOMMENDED: departure date
// Allows you to target people based on their travel dates, using a booking window
// Improves the landing experience with travel dates filled in, using template tags
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_departing_departure_date", "2018-12-12");

// HIGHLY RECOMMENDED: return date, in case of round trip, remove otherwise
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_returning_departure_date", "2018-12-19");

// REQUIRED: use official IATA code of departure airport
parameters.putString("fb_origin_airport", "SFO");

// REQUIRED: use official IATA code of destination airport
parameters.putString("fb_destination_airport", "JFK");

// RECOMMENDED: arrival date of departure flight
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_departing_arrival_date", "2018-12-12");

// RECOMMENDED: arrival date of return flight
// use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
parameters.putString("fb_returning_arrival_date", "2018-12-20");

// RECOMMENDED: number of adults on flight
parameters.putInt("fb_num_adults", 1);

// RECOMMENDED: number of children on flight
parameters.putInt("fb_num_children", 0);

// RECOMMENDED: number of infants
parameters.putInt("fb_num_infants", 0);

// RECOMMENDED: travel class
// must be 'economy', 'premium', 'business' or 'first'
parameters.putString("fb_travel_class", "economy");

// Use the built-in SDK method when the booking is confirmed
logger.logPurchase(
  purchaseAmount,
  currency,
  parameters
);
```

## Mobile App Events for iOS {#ios-app-events}

This guide assumes you already have the Facebook SDK implemented in your iOS mobile app. If not, see  [iOS SDK](https://developers.facebook.com/docs/ios). If you use a measurement partner, make sure they pass the required events to Meta.

#### Search iOS Event {#search-ios-event}

```
// Fire the 'Search' event on the search results page
[[FBSDKAppEvents shared] logEvent:FBSDKAppEventNameSearched

  // IF YOU DO NOT USE A RECOMMENDED PARAM, REMOVE IT, DON'T LEAVE EMPTY
  parameters:@{

    // REQUIRED: DO NOT change this, must be set to 'flight'
    FBSDKAppEventParameterNameContentType : @"flight",

    // HIGHLY RECOMMENDED: departure date
    // Allows you to target people based on their travel dates, using a booking window
    // Improves the landing experience with travel dates filled in, using template tags
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_departing_departure_date" : @"2018-12-12",

    // HIGHLY RECOMMENDED: return date, in case of round trip, remove otherwise
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_returning_departure_date" : @"2018-12-19",

    // REQUIRED: use official IATA code of departure airport
    @"fb_origin_airport" : @"SFO",

    // REQUIRED: use official IATA code of destination airport
    @"fb_destination_airport" : @"JFK",

    // RECOMMENDED: arrival date of departure flight
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_departing_arrival_date" : @"2018-12-12",

    // RECOMMENDED: arrival date of return flight
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_returning_arrival_date" : @"2018-12-20",

    // RECOMMENDED: number of adults on flight
    @"fb_num_adults" : @1,

    // RECOMMENDED: number of children on flight
    @"fb_num_children" : @0,

    // RECOMMENDED: number of infants
    @"fb_num_infants" : @0,

    // RECOMMENDED: travel class
    // must be 'economy', 'premium', 'business' or 'first'
    @"fb_travel_class" : @"economy",

    // RECOMMENDED: price for the flight
    // Use lowest price if you show multiple options on this page
    // Should not include cost of extras: seat selection, extra luggage etc
    @"fb_price" : @100.00,

    // RECOMMENDED: currency of the flight price
    // Must match currency of catalog
    @"fb_currency" : @"USD"
  }
];
```

#### ViewContent iOS Event {#viewcontent-ios-event}

```
// Fire 'ViewContent' event when the user selects the flight
[[FBSDKAppEvents shared] logEvent:FBSDKAppEventNameViewedContent

  // IF YOU DO NOT USE A RECOMMENDED PARAM, REMOVE IT, DON'T LEAVE EMPTY
  parameters:@{

    // DO NOT change this, must be set to 'flight'
    FBSDKAppEventParameterNameContentType : @"flight",

    // HIGHLY RECOMMENDED: departure date
    // Allows you to target people based on their travel dates (using a booking window)
    // Improves the landing experience with travel dates filled in, using template tags
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_departing_departure_date" : @"2018-12-12",

    // HIGHLY RECOMMENDED: return date, in case of round trip, remove otherwise
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_returning_departure_date" : @"2018-12-19",

    // REQUIRED: use official IATA code of departure airport
    @"fb_origin_airport" : @"SFO",

    // REQUIRED: use official IATA code of destination airport
    @"fb_destination_airport" : @"JFK",

    // RECOMMENDED: arrival date of departure flight
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_departing_arrival_date" : @"2018-12-12",

    // RECOMMENDED: arrival date of return flight
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_returning_arrival_date" : @"2018-12-20",

    // RECOMMENDED: number of adults on flight
    @"fb_num_adults" : @1,

    // RECOMMENDED: number of children on flight
    @"fb_num_children" : @0,

    // RECOMMENDED: number of infants
    @"fb_num_infants" : @0,

    // RECOMMENDED: travel class
    // must be 'economy', 'premium', 'business' or 'first'
    @"fb_travel_class" : @"economy"
  }
];
```

#### InitiateCheckout iOS Event {#initiatedcheckout-ios-event}

```
// Fire 'InitiateCheckout' event when user reaches payment screen
[[FBSDKAppEvents shared] logEvent:FBSDKAppEventNameInitiatedCheckout

  // IF YOU DO NOT USE A RECOMMENDED PARAM, REMOVE IT, DON'T LEAVE EMPTY
  parameters:@{

     // REQUIRED: DO NOT change this, must be set to 'flight'
    FBSDKAppEventParameterNameContentType : @"flight",

    // HIGHLY RECOMMENDED: departure date
    // Allows you to target people based on their travel dates, using a booking window
    // Improves the landing experience with travel dates filled in, using template tags
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_departing_departure_date" : @"2018-12-12",

    // HIGHLY RECOMMENDED: return date, in case of round trip, remove otherwise
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_returning_departure_date" : @"2018-12-19",

    // REQUIRED: use official IATA code of departure airport
    @"fb_origin_airport" : @"SFO",

    // REQUIRED: use official IATA code of destination airport
    @"fb_destination_airport" : @"JFK",

    // RECOMMENDED: arrival date of departure flight
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_departing_arrival_date" : @"2018-12-12",

    // RECOMMENDED: arrival date of return flight
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_returning_arrival_date" : @"2018-12-20",

    // RECOMMENDED: number of adults on flight
    @"fb_num_adults" : @1,

    // RECOMMENDED: number of children on flight
    @"fb_num_children" : @0,

    // RECOMMENDED: number of infants
    @"fb_num_infants" : @0,

    // RECOMMENDED: travel class
    // must be 'economy', 'premium', 'business' or 'first'
    @"fb_travel_class" : @"economy"
  }
];
```

#### Purchase iOS Event {#purchase-ios-event}

```
// Fire 'Purchase' event when the booking confirmed

// REQUIRED: total value of booking
[[FBSDKAppEvents shared] logPurchase:150

  // REQUIRED: currency of booking
  currency:@"USD"

  // IF YOU DO NOT USE A RECOMMENDED PARAM, REMOVE IT, DON'T LEAVE EMPTY
  parameters:@{

    // REQUIRED: DO NOT change this, must be set to 'flight'
    FBSDKAppEventParameterNameContentType : @"flight",

    // HIGHLY RECOMMENDED: departure date
    // Target people based on their travel dates, using a booking window
    // Improves the landing experience with travel dates filled in, using template tags
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_departing_departure_date" : @"2018-12-12",

    // HIGHLY RECOMMENDED: return date, in case of round trip, remove otherwise
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_returning_departure_date" : @"2018-12-19",

    // REQUIRED: use official IATA code of departure airport
    @"fb_origin_airport" : @"SFO",

    // REQUIRED: use official IATA code of destination airport
    @"fb_destination_airport" : @"JFK",

    // RECOMMENDED: arrival date of departure flight
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_departing_arrival_date" : @"2018-12-12",

    // RECOMMENDED: arrival date of return flight
    // use YYYYMMDD, YYYY-MM-DD, YYYY-MM-DDThh:mmTZD or YYYY-MM-DDThh:mm:ssTZD
    @"fb_returning_arrival_date" : @"2018-12-20",

    // RECOMMENDED: number of adults on flight
    @"fb_num_adults" : @1,

    // RECOMMENDED: number of children on flight
    @"fb_num_children" : @0,

    // RECOMMENDED: number of infants
    @"fb_num_infants" : @0,

    // RECOMMENDED: travel class
    // must be 'economy', 'premium', 'business' or 'first'
    @"fb_travel_class" : @"economy"
  }
];
```

## Event Parameters Details {#parameter-details}

On mobile, the parameter names are different than for Facebook Pixel. Often prepended by `fb_`, with some exceptions, such as `value` versus `_valueToSum`.

| Parameter Name and Type | Description |
| --- | --- |
| `content_type` for FB pixel<br><br>`fb_content_type` for App Events<br><br>type: string or string[] | **Recommended**.<br><br>Must be `flight`. If combined with another travel ads product, such as hotels, use `'["flight", "hotel"]'`. |
| `departing_departure_date`, for FB pixel<br><br>`fb_departing_departure_date`, for App Events<br><br>type: string | **Highly recommended**.<br><br>The date and time for start of the outbound journey. We accept dates in `YYYYMMDD`, `YYYY-MM-DD`, `YYYY-MM-DDThh:mmTZD` and `YYYY-MM-DDThh:mm:ssTZD`. When provided, you can use this in the ad using [template tags](https://developers.facebook.com/documentation/ads-commerce/marketing-api/flight-ads/template-tags) and target people based on their travel dates [using booking window in your audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads/audience-management).<br><br>Examples:<br><br>* `20180623`<br>* `2018-06-23`<br>* `2017-06-23T15:30GMT`<br>* `2017-06-23T15:30:00GMT` |
| `returning_departure_date`, Facebook Pixel<br><br>`fb_returning_departure_date`, App Events<br><br>type: string | **Highly recommended** for round trips.<br><br>The date and time for start of the return journey. We accept the same date formats as listed for `departing_departure_date`. When provided, you can use this in the ad using [template tags](https://developers.facebook.com/documentation/ads-commerce/marketing-api/flight-ads/template-tags) and target people based on their travel dates [using booking window in your audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads/audience-management). |
| `currency`, FB pixel<br><br>`fb_currency`, App Events<br><br>type: string | **Required** for `purchase`.<br><br>Currency for the `value`. Specified using [ISO 4217 currency](https://www.iso.org/iso-4217-currency-codes.html) format.<br><br>Example: `USD` |
| `value`, FB pixel<br><br>`_valueToSum`, App Events<br><br>type: float | **Required** for `purchase`.<br><br>A total price of the booking. This number quantifies the value of this event to the advertiser.<br><br>Example: `155` |
| `departing_arrival_date`, Facebook pixel<br><br>`fb_departing_arrival_date`, App Events<br><br>type: string | The date and time for arrival at the destination of the outbound journey. Use the same date formats listed for `departing_departure_date`. |
| `returning_arrival_date`, Facebook pixel<br><br>`fb_returning_arrival_date`, App Events<br><br>type: string | The date and time when the return journey is done. Use the same date formats listed for `departing_departure_date`. |
| `destination_ids`, Facebook pixel<br>`fb_destination_ids`, App Events<br><br>type: string or string[] | If you have a destination catalog, you can associate one or more destinations in this catalog with a specific flight event. For instance, link a particular route to a nearby museum and a nearby beach, both of which are destinations in the catalog.<br><br>Example: `'["dest2", "dest5", "dest8"]'` |
| `num_adults`, Facebook Pixel<br>`fb_num_adults`, App Events<br><br>type: string | Number of adults flying. When provided, you can display this in the ad using [template tags](https://developers.facebook.com/documentation/ads-commerce/marketing-api/flight-ads/template-tags).<br><br>Example: `2`. |
| `num_children`, Facebook Pixel<br><br>`fb_num_children`, App Events<br><br>type: int | Number of children flying. When provided, you can display this in the ad using [template tags](https://developers.facebook.com/documentation/ads-commerce/marketing-api/flight-ads/template-tags).<br><br>Example: `2`. |
| `num_infants`, Facebook Pixel<br><br>`fb_num_infants`, App Events<br><br>type: int | Number of infants flying. When provided, you can display this in the ad using [template tags](https://developers.facebook.com/documentation/ads-commerce/marketing-api/flight-ads/template-tags).<br><br>Example: `2`. |
| `price`, Facebook Pixel<br><br>`fb_price`, App Events<br><br>type: float | The lowest price from search results for the selected route and dates. For `Search` event only.<br><br>Example: `95` |
| `travel_class`, Facebook Pixel<br><br>`fb_travel_class`, App Events<br><br>type: string | Must be `economy`, `premium`, `business` or `first`<br><br>Example: `economy`. |
| `user_score`, Facebook Pixel<br><br>`fb_user_score`, App Events<br><br>type: float | Represents the relative value of this potential customer to advertiser.<br><br>Example: `50` |
| `preferred_num_stops`, Facebook Pixel<br>`fb_preferred_num_stops`, App Events<br><br>type: int | Indicate the preferred number of stops the user is looking for. `0` for direct flights.<br><br>Example: `0` |

