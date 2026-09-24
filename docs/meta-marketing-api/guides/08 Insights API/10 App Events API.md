<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/app-event-api | Saved: 2026-09-19 -->

# App Events API



**Warning:** We no longer recommend App Events API for new integrations. The [Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api) now supports web, app, and offline events, so we recommend that advertisers use the Conversions API instead of App Events API. Existing App Events API users can continue to use it, but we will discontinue development of this API. Future innovation will be developed on the Conversions API.  Learn more about [Conversions API for App Events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/app-events).

App Events allow you to track actions that occur in your mobile app or web page such as app installs and purchase events. By tracking these events you can [measure ad performance](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights) and [build audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences) for ad targeting.

For information on tracking App Events for Business Messaging, please see the [**App Events API for Business Messaging**](https://developers.facebook.com/documentation/ads-commerce/conversions-api/business-messaging) in our [Messenger Platform documentation](https://developers.facebook.com/documentation/business-messaging/messenger-platform).

## How It Works

There are three types of App Events:

- Automatically Logged Events - The Facebook SDK automatically logs app installs, app sessions, and in-app purchases.

- Standard Events - Popular events that Facebook has created for you.

- Custom Events - Events you create that are specific to your app.

An app event has three parts:

- `name` - A required string that describes the event. The name appears in the Event log when the app event is sent to Analytics.

- `valueToSum` - An optional value that Analytics adds to other Value To Sum values from app events with the same name.

- `parameters` - Optional values included with your app event.

The maximum number of different event names is 1,000. Note: No new event types will be logged once this cap is hit and if you exceed this limit you may see an `100 Invalid parameter` error when logging. However it is possible to [deactivate obsolete events](https://www.facebook.com/help/analytics/966883707418907). Read more about event limits in the [FAQ](https://developers.facebook.com/docs/app-events/faq#limits).  

### Before You Start

You will need:

* Your advertiser ID, the advertising ID from an Android device or the Advertising Identifier (IDFA) from an Apple device
* An app access token for Facebook to authenticate. **Do not** store your app access token on the client.

## App Installs {#installs}

Send a `POST` request from your server to the `/{app-id}/activities` endpoint with the  `application_tracking_enabled` and `advertiser_tracking_enabled` parameters:

*Formatted for readability.*

```curl
curl -i -X POST "https://graph.facebook.com/{app-id}/activities
   ?event=MOBILE_APP_INSTALL
   &application_tracking_enabled=0
   &advertiser_tracking_enabled=0
   &advertiser_id={advertiser-tracking-id}
   &{app-access-token}"
```

On success, your app receives the following response:

```
{
  "success": true
}
```

#### Caveats

* You should report only one install per user. Deduplicate IDs on the ID and user levels if possible.

Visit our [Application Activities Reference guide](https://developers.facebook.com/docs/graph-api/reference/application/activities#parameters) for a list of available parameters.

## Enable Ad Tracking {#tracking_enabled}

The `advertiser_tracking_enabled` field specifies whether a person has enabled advertising tracking on their iOS 14.5+ device. Set to 0 for disabled or 1 for enabled.  You should fetch this data and return it to Facebook to determine if ad tracking can be used for optimization or conversions.
Meta will use the event data (from partners about user activities off Meta) pursuant to its Data Policy, including for ad reporting, fraud detection and to build and improve our products (including our ads delivery products), but will restrict use of data about that individual to personalize that user's ads. For devices running earlier versions than iOS 6, this parameter should default to 1.

Visit [Apple, AdSuppport Reference](https://developer.apple.com/library/ios/documentation/AdSupport/Reference/ASIdentifierManager_Ref) to get tracking status of a user.

The following code snippet illustrates how to fetch the value of the tracking enabled flag.

You can get the current setting of the tracking enabled flag from the  `Settings.shared.isAdvertiserTrackingEnabled` property.

```
print("isAdvertiserTrackingEnabled: \(Settings.shared.isAdvertiserTrackingEnabled)")
```

### Disable Ad Tracking {#app_opt_out}

Any application can choose to include a setting for users to turn off ad tracking within that app. Facebook asks partners to include this option in their SDK and report back the user's choice to Facebook along with the install or conversion event. Facebook uses the install or conversion event for ad reporting, but restricts it from being used in ad optimization. The user's setting must persist across app launches.

## Conversion Events {#conversions}

Send a `POST` request to the `/{app-id}/activities` endpoint with the `event` set to `CUSTOM_APP_EVENTS` and set `advertiser_tracking_enabled` for each individual event. The `advertiser_id` or `attribution` parameter is required.

*Formatted for readability.*

```
curl -i -X POST "https://graph.facebook.com/{app-id}/activities
   ?event=CUSTOM_APP_EVENTS"
   &advertiser_id={advertiser-tracking-id}
   &advertiser_tracking_enabled=1
   &application_tracking_enabled=1
   &custom_events=[
      {"_eventName":"fb_mobile_purchase",
       "event_id":"123456",
       "fb_content":"[
            {"id": "1234", "quantity": 2,},
            {"id": "5678", "quantity": 1,}
        ]",
       "fb_content_type":"product",
       "_valueToSum":21.97,
       "fb_currency":"GBP",
      }
    ]
   &{app-access-token}"
```

On success, your app receives the following response:

```
{
  "success": true
}
```

## Attribution {#attribution}

The `attribution` endpoint returns installs and conversions based on clicks that happened on an ad within 30 days. Ads Manager uses a 1-day view through a 28-day click-through attribution model and insights are surfaced based on impression or click time, not install or conversion time. This is important  when comparing your reporting to Facebook Ads Manager reports. In addition to the standard ad click app event claims, you should also keep the following scenarios in mind:

* **View-Through Attribution Claims** - Setting `consider_views=TRUE` returns attribution data for installs that occurred within 1 day of an ad impression, provided the Accounts Center account did not click on an ad within 30 days.The response returned will be `is_view_through=TRUE` and `view_time` will replace `click_time`. All other attributions are the same as with ad click attribution data.

* **Cross-Campaign Claims** - Advertisers are able to track the performance of all ads that have led to an app event. Facebook sends claims for events from ad campaigns as long as the campaign objective is not set to mobile app install or mobile app engagement. This data is surfaced only if the advertiser has added the app to "Mobile App Events Tracking" field in their ad.

* **User Case** — If your client wants to track the installs generated by a Page post ad or website ad clicks that sends users to a mobile site, they can do this in ads manager and Facebook will claim the relevant app installs.

* **Cross-Device Claims** - Advertisers with apps on multiple platform can see data for app installs being driven from ads across these multiple platforms.

* **Use Case** — A user clicks an iPhone ad for an app and then installs the same app on their iPad. We can then attribute the iPad app installation to the iPhone ad regardless of the ad targeting.  

## Advanced Matching  {#advanced}

Advanced matching allows you to send customer data to Facebook where we use this data to more accurately determine which Accounts Center accounts took action in response to your ad. With this data, Facebook can match conversion events to your customers to optimize your ads and build larger re-marketing audiences.

Send a `POST` request to the `/{app-id}/activities` endpoint with the [`ud` parameter](#params) set to a parameter that will help to track your customer such as customer email or phone number. All customer data must be hashed or Facebook will ignore it. Be sure to set  `advertiser_tracking_enabled` for each individual event.

*Formatted for readability.*

```
curl -i -X POST "https://graph.facebook.com/{app-id}/activities
   ?event=CUSTOM_APP_EVENTS
   &advertiser_id={advertiser-tracking-id}
   &advertiser_tracking_enabled=1
   &application_tracking_enabled=1
   &custom_events=[
      {"_eventName":"fb_mobile_purchase",
      "event_id":"123456",
       "fb_content":"[
            {"id": "1234", "quantity": 2,},
            {"id": "5678", "quantity": 1,}
        ]",
       "fb_content_type":"product",
       "_valueToSum":21.97,
       "fb_currency":"GBP",
      }
    ]
   &ud[em]={sha256-hashed-email}
   &{app-access-token}"
```

On success, your app receives the following response:

```
{
  "success": true
}
```

**All user data must be SHA256 hashed before you send it to Facebook. Facebook will ignore data that is not hashed.**

## Deduplication {#deduplication}

For app events, we apply the same deduplication functionality that exists for web events. The logic leverages the field `event_id` and `event_name` based deduplication. The `event_id` parameter is an identifier that can uniquely distinguish between similar events. Inaccurate event IDs may cause your conversion to be wrongly deduplicated, further impacting conversion reporting and campaign performance.

## Extended Device Information {#extinfo}

Send device information, such as screen width and height, in your app event call using  `/{app-id}/activities?extinfo`. Values are separated by commas and must be in the order indexed in the [`/application/activites` reference guide](https://developers.facebook.com/docs/graph-api/reference/application/activities#parameters). When using `extinfo` all values are required.

* `version` must be `a2` for Android
* `version` must be `i2` for iOS

#### Reference

* [ApplicationActivities Parameters](https://developers.facebook.com/docs/graph-api/reference/application/activities#parameters)
* [Android Developer Documentation - Display Metrics](https://developer.android.com/reference/android/util/DisplayMetrics.html)
* [Android Developer Documentation - External Storage](https://developer.android.com/reference/android/os/Environment.html#getExternalStorageDirectory())
* [Apple Developer Documentation - Display Metrics](https://developer.apple.com/documentation/coregraphics/cgsize/)
* [Apple Developer Documentation - External Storage](https://developer.apple.com/documentation/foundation/nsfilemanager?language=objc)  
* [Apple Developer Documentation - Screen Size](https://developer.apple.com/documentation/uikit/uiscreen/1617836-scale?language=objc)

## Get Mobile Cookies

We encourage you to associate app events with an `advertiser_id`. However, for Android devices and iOS devices earlier than iOS 6, you can also use the [`attribution` parameter](https://developers.facebook.com/docs/graph-api/reference/application/activities#parameters) set to the mobile cookie of the device.

Note: Mobile cookies are not derived from any user or device attributes. These cookies are not persistent and are designed to be refreshed frequently. Do not use mobile cookies for re-targeting ads.

### Android {#android}

The cookie is a random 22-character alphanumeric string.

Get the Facebook attribution ID using `ContentProvider`:

```
public static final Uri ATTRIBUTION_ID_CONTENT_URI = Uri.parse("content://com.facebook.katana.provider.AttributionIdProvider");

public static final String ATTRIBUTION_ID_COLUMN_NAME = "aid";

public static String getAttributionId(ContentResolver contentResolver) {
        String [] projection = {ATTRIBUTION_ID_COLUMN_NAME};
        Cursor c = contentResolver.query(ATTRIBUTION_ID_CONTENT_URI, projection, null, null, null);
        if (c == null || !c.moveToFirst()) {
            return null;
        }
        String attributionId = c.getString(c.getColumnIndex(ATTRIBUTION_ID_COLUMN_NAME));
        c.close();
        return attributionId;
    }
```

You should also [fetch the advertising ID](https://developer.android.com/google/play-services/id.html) of your Android app.

### iOS {#iOS}

The mobile cookie is created by Facebook iOS apps using `CFUUIDCreateString` and is [128-bit UUID string representation](http://en.wikipedia.org/wiki/Universally_unique_identifier).

Get both the cookie ID and the IDFA and send them to Facebook as an identifier:

```
ASIdentifierManager *manager = [ASIdentifierManager sharedManager];
NSString *advertiserID = [[manager advertisingIdentifier] UUIDString];

if (advertiserID) {
  // do stuff
}
```

## X-Forwarded-For HTTP Header {#http}

If `POST` requests are done from a central place such as a server or proxy, basically, a server-to-server call, then X-Forwarded-For HTTP header is required to ensure accurate location and device information. Send the device's IP address, IPv4 or IPv6 format, via the X-Forwarded-For HTTP header parameter in each of the app event requests you send. By doing so, it allows us to pair the `advertiser_id` to the correct IP address, which we can then use in our platform.

#### IPv6 Example

```
curl ...
  -H "X-Forwarded-For: fd45:f238:3b40:23b1:ffff:ffff:ffff:abcd" \
  https://graph.facebook.com/<APP_ID>/activities/
```

#### IPv4 Example

```
curl ...
  -H "X-Forwarded-For: 192.168.0.99" \
  https://graph.facebook.com/<APP_ID>/activities
```

## Testing {#testing}

1. Go to [Events Manager](https://business.facebook.com/events_manager2/list).
2. Click the Data sources icon on the left side of the page.
3. Select the name and ID of your data.
4. Click Test events, and select channel as App.
5. Send a AE-API request with [graph api tool](https://developers.facebook.com/tools/explorer/).
6. Your interactions will soon appear in the Test events tab.

## Discrepancies {#discrepancies}

In the event a client compares a mobile measurement partner's reports with Facebook reports and sees discrepancies, here are some items to check:

If Facebook is reporting fewer installs than MMP:

* Is the FB SDK integrated properly?
* Is the client using the wrong app ID?

If Facebook is reporting more installs than MMP:

* Are the [attribution](#attribution) windows the same? Facebook generally has a larger attribution window than most mobile measurement partners.
* Is the MMP SDK integrated properly?
* Is the client using the wrong app ID?
* Is the discrepancy iOS7 only? Is the MMP receiving Apple's Advertising Identifier (IDFA) from the device and passing it properly to FB?

## Reference

### Application Activities Extinfo

Visit the [`/application/activites` reference guide](https://developers.facebook.com/docs/graph-api/reference/application/activities#parameters) for more information on app extended information.

### User Data Parameters {#params}

**Warning:** Please download this CSV file for examples of properly normalized and hashed data for the parameters below.

Download (Right-click > Save Link As)

| User Data | Parameter | Format | Example |
| --- | --- | --- | --- |
| Email | `em` |  | `jsmith@example.com` |
| First Name | `fn` | Lowercase letters | `john` |
| Last Name | `ln` | Lowercase letters | `smith` |
| Phone | `ph` | Digits only including country code and area code | `16505554444` |
| External ID | `external_id` | Any unique ID from the advertiser, such as loyalty membership ID, user ID, and external cookie ID. | `a@example.com` |
| Gender | `ge` | Single lowercase letter, `f` or `m`, if unknown, leave blank | `f` |
| Birthdate | `db` | Digits only with birth year, month, then day | `19910526` for May 26, 1991. |
| City | `ct` | Lowercase with any spaces removed | `menlopark` |
| State or Province | `st` | Lowercase two-letter state or province code | `ca` |
| Zip or Postal Code | `zp` | Digits only | `94025` |
| Country | `cn` | Lowercase two-letter country code | `us` |

### Standard Event Names

| Event Name | Event Parameters | _valueToSum |
| --- | --- | --- |
| `AdClick` | `fb_ad_type` |  |
| `AdImpression` | `fb_ad_type` | With App Ads, revenue of ads from a third-party platform appears on-screen within your app. |
| `Contact` |  |  |
| `CustomizeProduct` |  |  |
| `Donate` |  |  |
| `fb_mobile_achievement_unlocked` | `fb_description` |  |
| `fb_mobile_activate_app` * |  |  |
| `fb_mobile_add_payment_info` | `fb_success` |  |
| `fb_mobile_add_to_cart` | `fb_content_type`, `fb_content_id` and `fb_currency` | Price of item added |
| `fb_mobile_add_to_wishlist` | `fb_content_type`, `fb_content_id` and `fb_currency` | Price of item added |
| `fb_mobile_complete_registration` | `fb_registration_method` |  |
| `fb_mobile_content_view` | `fb_content_type`, `fb_content_id` and `fb_currency` | Price of item viewed (if applicable) |
| `fb_mobile_initiated_checkout` | `fb_content_type`, `fb_content_id`, `fb_num_items`, `fb_payment_info_available` and `fb_currency` | Total price of items in cart |
| `fb_mobile_level_achieved` | `fb_level` |  |
| `fb_mobile_purchase` | `fb_num_items`, `fb_content_type`, `fb_content_id` and `fb_currency` | Purchase price |
| `fb_mobile_rate` | `fb_content_type`, `fb_content_id` and `fb_max_rating_value` | Rating given |
| `fb_mobile_search` | `fb_content_type`, `fb_search_string` and `fb_success` |  |
| `fb_mobile_spent_credits` | `fb_content_type` and `fb_content_id` | Total value of credits spent |
| `fb_mobile_tutorial_completion` | `fb_success` and `fb_content_id` |  |
| `FindLocation` |  |  |
| `Schedule` |  |  |
| `StartTrial` | `fb_order_id` and `fb_currency` | Price of subscription |
| `SubmitApplication` |  |  |
| `Subscribe` | `fb_order_id` and `fb_currency` | Price of subscription |

*Use `fb_mobile_activate_app` event in addition to [install reporting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-measurement#installs) to exclude users from seeing ads for this app. **Do not use this event if you have [automatic event logging](https://developers.facebook.com/docs/app-events/automatic-event-collection-detail) enabled.**

### Standard Event Parameters

| Event Parameter Name | Value | Description |
| --- | --- | --- |
| `_logTime` | int | Recommend parameter to specify the time of event, specified in unixtime |
| `_valueToSum` | float | Numeric value of individual event to be summed in reporting, see above for recommended events to attach to |
| `fb_content_id` | string | International Article Number (EAN) when applicable, or other product or content identifier(s). For multiple product ids: e.g. "[\"1234\",\"5678\"]" |
| `fb_content` | string | A list of JSON object that contains the International Article Number (EAN) when applicable, or other product or content identifier(s) as well as quantities and prices of the products. **Required**:`id`, `quantity`. e.g. "[{\"id\": \"1234\", \"quantity\": 2,}, {\"id\": \"5678\", \"quantity\": 1,}]". |
| `fb_content_type` | string | The `product` or `product_group` |
| `fb_currency` | string | ISO 4217 code, e.g., "EUR", "USD", "JPY". Required when passing `_valueToSum` as a price or a purchase amount. |
| `fb_description` | string | A string description |
| `fb_level` | string | Level of a game |
| `fb_max_rating_value` | int | Upper bounds of a rating scale, for example 5 on a 5 star scale |
| `fb_num_items` | int | Number of items |
| `fb_payment_info_available` | boolean | `1` for yes, `0` for no |
| `fb_registration_method` | string | Facebook, Email, Twitter, etc. |
| `fb_search_string` | string | The text string that was searched for |
| `fb_success` | boolean | `1` for yes,`0` for no |

## See Also

* [App Events](https://developers.facebook.com/docs/app-events)
* [App Events Best Practices](https://developers.facebook.com/docs/app-events/best-practices)
* [Handling Errors](https://developers.facebook.com/docs/graph-api/using-graph-api/error-handling)
* [GDPR Compliance](https://developers.facebook.com/docs/app-events/gdpr-compliance)
* [Facebook Ads Manager](https://www.facebook.com/ads/manager/accounts/)
* [Facebook App Dashboard](https://developers.facebook.com/apps)
