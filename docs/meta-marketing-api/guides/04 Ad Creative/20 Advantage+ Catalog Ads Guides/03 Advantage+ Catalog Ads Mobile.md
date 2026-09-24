<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/mobile-apps | Saved: 2026-09-19 -->

# Advantage+ Catalog Ads for Mobile Apps



You can set up Advantage+ catalog ads on mobile with Facebook SDKs. You should incorporate deep linking and deferred deep linking into your app to send people who use your app directly to relevant content.

## Step 1: Set up the Facebook SDK for iOS or Android

Integrate the Facebook SDK for [iOS](https://developers.facebook.com/docs/ios/getting-started) or [Android](https://developers.facebook.com/docs/android/getting-started).

## Step 2: Set up mobile app events

On the web, use Meta Pixel events such as `ViewContent` for tracking event interactions. On mobile you can track the same events with App Events.

You must send the same three required events from your app as you do from your Pixel: `ViewContent`, `AddToCart`, and `Purchase`. Advantage+ catalog ads requires these events to work correctly.

| iOS Event | Android Event | Web Equivalent |
| --- | --- | --- |
| `FBSDKAppEventNameViewedContent` | `AppEventsConstants::<br>EVENT_NAME_VIEWED_CONTENT` | `ViewContent` |
| `FBSDKAppEventNameAddedToCart` | `AppEventsConstants::<br>EVENT_NAME_ADDED_TO_CART` | `AddToCart` |
| `[[FBSDKAppEvents shared] logPurchase:(double) currency:(NSString *) parameters:(NSDictionary *)];` | `AppEventsConstants::<br>EVENT_NAME_PURCHASED` | `Purchase` |

For example, a `ViewContent` event fires when someone views a product in an app:

### Objective-C
```
[[FBSDKAppEvents shared] logEvent:FBSDKAppEventNameViewedContent
  valueToSum:54.23
  parameters:@{
    FBSDKAppEventParameterNameCurrency    : @"USD",
    FBSDKAppEventParameterNameContentType : @"product",
    FBSDKAppEventParameterNameContentID   : @"123456789"
  }
];
```

### Android SDK
```
Bundle parameters = new Bundle();
parameters.putString(AppEventsConstants.EVENT_PARAM_CURRENCY, "USD");
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "product");
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_ID, "1234");

logger.logEvent(AppEventsConstants.EVENT_NAME_VIEWED_CONTENT,
                120.00,
                parameters);
```

You can also provide a JSON array of values for product ID when an event occurs for multiple products. For example, you can send multiple products with the `Purchase` event.

### Objective-C
```
[[FBSDKAppEvents shared] logPurchase:54.23 currency : @"USD" parameters:@{
  FBSDKAppEventParameterNameContentID   : @"['1234','5678']",
  FBSDKAppEventParameterNameContentType : @"product"
  }
];
```

### Android SDK
```
Bundle parameters = new Bundle();
parameters.putString(AppEventsConstants.EVENT_PARAM_CURRENCY, "USD");
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "product");
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_ID, "['1234', '5678']");

logger.logEvent(AppEventsConstants.EVENT_NAME_PURCHASED,
                180.00,
                parameters);
```

### Multiple content IDs

If you have multiple content IDs, you provide an escaped JSON array, for example:

```
"[\"1234\",\"5678\"]"
```

### Optional parameters

For every app event, you can send additional parameters; you should send them when someone makes a purchase:

| Name | Description |
| --- | --- |
| `_valueToSum`  <br><br>string | **Optional.**  <br>Value of the product or purchase amount |
| `fb_currency`  <br><br>string | **Optional.**  <br>Currency of the product or purchase amount |

### Using a Mobile Measurement Partner (MMP)

If you use an approved Mobile Measurement Partner (MMP) to report events to Facebook, you can adjust your implementation to also send the required events. While this process varies by MMP, typically it looks like this:

1. Adjust your integration to report the [three required events to the MMP](#mmprequiredevents), along with the required parameters.
2. With your MMP, map your event names to the Facebook event names.
3. [Test App Events](#test-your-app-events).

### Required events for MMP {#mmprequiredevents}

The following events are **required**:

| Name | Description |
| --- | --- |
| `fb_mobile_content_view` | When an Accounts Center account has viewed a product |
| `fb_mobile_add_to_cart` | When someone adds an item to the cart |
| `fb_mobile_purchase` | When someone purchases an item or items |

You must also send two additional parameters for Advantage+ catalog ads to function:

* The ID of the item viewed, added to cart or purchased
* Whether the ID is a `product` or `product_group`

The additional parameters available are:

| Name | Description |
| --- | --- |
| `fb_content_type`<br><br>string | Either `product` or `product_group` |
| `fb_content_id`  <br><br>string | **Required.**  <br>A string containing a JSON-encoded array of the retailer's product or product group IDs |
| `_valueToSum`<br><br>string | **Optional.**  <br>Value of the product purchased |
| `fb_currency`<br><br>string | **Optional.**  <br>Currency of the product or purchase amount |

**Note:** You should also send `_valueToSum` and `fb_currency` parameters when someone purchases items.

### Test your app events

To test if your integration works, use the [App Ads Helper](https://developers.facebook.com/tools/app-ads-helper/) to see the events and parameters reported to Facebook in realtime.

1. Select an app.
2. You will see two tools at the bottom of the page. Select **Test App Events**.
3. There are two options: either see events being reported by you or by a specific Advertising ID. In most cases, selecting **Me** is sufficient. Make sure you have Facebook installed on your device and that you are logged in.
4. As you perform actions in your app, events appear in the tool with their parameters.

You see these three event names if your integration is successful:

* `FB_MOBILE_CONTENT_VIEW`
* `FB_MOBILE_ADD_TO_CART`
* `FB_MOBILE_PURCHASE`

Learn more about [iOS](getting-started-app-events-ios) and [Android](getting-started-app-events-android) app events.

To verify your app events function, you can check recent events in [Facebook Events Manager](https://www.facebook.com/events_manager2).

## Step 3: Set up deep linking

By providing deep links in your product feed, anyone who interacts with your ad on Facebook can go directly to a specific location of your app. For instance, when someone clicks an ad in Facebook on mobile, they see the product in your mobile app. See [Deep Linking](https://developers.facebook.com/docs/app-ads/deep-linking) and [Verify Deep Linking](https://developers.facebook.com/tools/app-ads-helper) for more information.

### Fallback to web versus App Store

If you use deep links, you can specify fallback behavior if someone does not have your app installed. When you provide deep links in your product feed, people without your app see the web URL for the product in the ad.

Since your likely goal is to increase catalog sales, you probably want people to see product pages, rather than install your app. Therefore, we default to web URLs, though you can specify different behavior for more control. Set the fallback behavior to `applink_treatment` when you create your Advantage+ catalog ad and use one of these options:

| Name | Description |
| --- | --- |
| `web_only` | Always send someone to the given web URL. This overrides any deep links in your feed. |
| `deeplink_with_web_fallback` | If the app is installed and we have your corresponding deep links, send someone to your app. If one of these conditions is unfulfilled, send them to the website URL. |
| `deeplink_with_appstore_fallback` | If the app is installed and we have corresponding deep link information, send someone to the app. If the app is not installed, send them to the app store for the app. |

## Step 4: Set up product feed

Now you need to provide actual deep links for your Advantage+ catalog ads. See [Product Catalog, Deep Linking](https://developers.facebook.com/documentation/ads-commerce/catalog#deep-linking) for more information.

## Step 5: Track specs {#trackingspecs}

To measure conversion events from both your website and mobile apps, make sure any Advantage+ catalog ads have the correct [Tracking Specs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/tracking-specs) set for these events:

| Event | Tracking Spec |
| --- | --- |
| `offsite_conversion` | `{ 'action.type': 'offsite_conversion', 'fb_pixel': FB_PIXEL_ID }` |
| `app_custom_event` | `{'action.type':'app_custom_event','application':APP_ID}` |
| `mobile_app_install` | `{'action.type':'mobile_app_install','application':APP_ID}` |

Facebook can then track any events occurring from an Advantage+ catalog ad, regardless of whether someone views your website or app. To set these tracking specs:

```bash
curl \
  -F 'tracking_spec=[
    {"action.type":["app_custom_event"],"application":["101"]},
    {"action.type":["offsite_conversion"],"offsite_pixel":["<PIXEL_ID>"]},
    {"action.type":["mobile_app_install"],"application":["101"]}
  ]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_ID>
```
