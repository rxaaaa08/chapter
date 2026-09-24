<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-shopping-campaigns/cross-channel-conversion | Saved: 2026-09-19 -->

# Cross-Channel Conversion Optimization for Advantage+ Shopping Campaigns



Cross-channel conversion optimization enables you to optimize conversions for both website and app within a single campaign. Selecting a website and app as the places you want conversions to happen captures more data, which may help lower cost per action (CPA) and can lead to an increase in conversions.

There are no changes at the Campaign level. The changes are at the Ad Set level and Ad level.

## Ad Set

At the Ad Set level, you need to specify the app information in `promoted_object`. To do that, please use `omnichannel_object`, and put it under `promoted_object`.

For omnichannel object validation:

* All `custom_event_type` fields in the app and Pixel must be of the same event.
* Both app SDK and Pixel are required.
* Current ad accounts must have access to all app- and Pixel-promoted objects.

You can now also create Shop Ads with Advantage+ Shopping Campaigns by setting the `destination_type` as `SHOP_AUTOMATIC` on the ad set level and specifying your commerce account ID (`commerce_merchant_settings_id`) in the `omnichannel_object` under `promoted_object`.

| Field | Description |
| --- | --- |
| `app`  <br><br>list<AppPromotedObject> | App-promoted objects associated with this omnichannel object.<br><br>`application_id`<br><br>string<br><br>Application ID being promoted.<br><br>`object_store_urls`<br><br>List<string><br><br>List of object store URLs associated with `application_id` (Play Store and/or iTunes).<br><br>`custom_event_type` — Advantage+ shopping ad set supports the following events: `PURCHASE`, `ADD_TO_CART`, `INITIATED_CHECKOUT`, `ADD_PAYMENT_INFO`, `ADD_TO_WISHLIST`, `CONTENT_VIEW`, `COMPLETE_REGISTRATION`, `START_TRIAL`, `SUBSCRIBE`, `SEARCH`.<br><br>For app-promoted object validation:<br><br>All `object_store_urls` must be associated with that application with corresponding `application_id`. You can configure this on [developers.facebook.com](https://developers.facebook.com/) under your application settings.<br><br>`custom_event_type` — Advantage+ shopping ad set supports the following events: `PURCHASE`, `ADD_TO_CART`, `INITIATED_CHECKOUT`, `ADD_PAYMENT_INFO`, `ADD_TO_WISHLIST`, `CONTENT_VIEW`, `COMPLETE_REGISTRATION`, `START_TRIAL`, `SUBSCRIBE`, `SEARCH`. |
| `pixel`  <br><br>list<PixelPromotedObject> | Pixel-promoted objects associated with this omnichannel object.<br><br>`pixel_id`<br><br>string<br><br>Pixel ID being promoted.<br><br>`custom_event_type` — Advantage+ shopping ad set supports the following events: `PURCHASE`, `ADD_TO_CART`, `INITIATED_CHECKOUT`, `ADD_PAYMENT_INFO`, `ADD_TO_WISHLIST`, `CONTENT_VIEW`, `COMPLETE_REGISTRATION`, `START_TRIAL`, `SUBSCRIBE`, `SEARCH`. |
| `onsite`<br><br>list | **Required for Shops Ads.**  <br><br>`commerce_merchant_settings_id`<br><br>String<br><br>Commerce account ID |

#### Example

```json
{
     daily_budget: 20000,
     promoted_object: {
         omnichannel_object: {
             app: [
                 {
                     application_id: <application_id>,
                     custom_event_type: PURCHASE,
                     object_store_urls: [
                         "https://play.google.com/store/apps/details?id=com.facebook.ka"
                         "https://apps.apple.com/us/app/facebook/id284882215",
                     ],
                 },
             ],
             pixel:  [
                 {
                     pixel_id: <pixel_id>,
                     custom_event_type: PURCHASE
                 },
             ],
         }
     }
}
```

## Ad

At the Ad level, you can specify the primary destination and secondary destination that advertisers want users to land on when users click their ad. For example, you may want primary destination as apps, and if apps are not installed on users' phones, then secondary destination can be website or app store. This destination setting is specified using `applink_treatment`. [Advantage+ catalog ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started#specify-desired-behavior-of-ads-click-from-mobile) already use these fields.

`applink_treatment` has the following values with the description below:

| Name | Description |
| --- | --- |
| `web_only` | Always send the user to the given web URL. |
| `deeplink_with_web_fallback` | If the app is installed on the user's phone and Meta has corresponding deep link information, send the user to the app. If one of these conditions is not met, send them to the website. |
| `deeplink_with_appstore_fallback` | Default when app links are present for the product. If the app is installed on the user's phone and Meta has corresponding deep link information, send the user to the app. If the app is not installed, send them to the app store for the app. |

Advantage+ shopping campaign does not support `automatic` mode.

There are also opportunities to specify deep links in the apps or website destinations. Learn more about [product deep links](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links).

The way to specify deep links is a little different for catalog ads and non-catalog ads format.

### Catalog Ads  

For catalog ads, the same `applink_treatment` setting can be used. But to specify deep links,  `template_url_spec` is used instead of `omnichannel_link_spec`.
In this field, you may use dynamic fields such as product URL or ID.

`template_url_spec` follows this specification.

#### Example

```json
{
   "creative":{
      "applink_treatment":"deeplink_with_web_fallback",
      "template_url_spec":{
         "android":{
            "url":"example://product/{{product.retailer_id | urlencode}}"
         },
         "config":{
            "app_id":"<application_id>"
         },
         "ios":{
            "url":"example://product/{{product.name | urlencode}}"
         },
         "web":{
            "url":"https://www.example.com/deeplink/{{product.name | urlencode}}"
         }
      }
   },
   "tracking_specs":[
      {
         "action.type":"offsite_conversion",
         "fb_pixel":"<pixel_id>"
      }
   ]
}
```

### Non-catalog ads

For manual upload ads, Meta introduced a new field, `omnichannel_link_spec`, in Creative. It includes the following fields.

| Field | Description |
| --- | --- |
| `web`<br><br>*Web configuration* | Pixel-promoted objects associated with this omnichannel object.<br><br>`url`<br><br>string<br><br>Website that the user lands on via the browser. For web validation, url must be the same as the link provided in link_data. |
| `app`<br><br>*App destination configuration* | App-promoted objects associated with this omnichannel object. <br><br>`application_id`<br><br>string<br><br>App that the user lands on via the browser. For validation, `application_id` must be consistent as the `application_id` in `omnichannel_object` within `promoted_object` <br><br>`platform_specs`<br><br>JSON<br><br>Landing destination configuration per the platform. |

### Platform Specifications  

| Field | Description |
| --- | --- |
| `android`<br><br>*JSON* | Landing configuration for Android app. For web validation, `ios`, `ipad`, `iphone` are mutually exclusive. There can only be one of those keys that exist in the `platform_specs`.<br><br>`url`<br><br>string<br><br>Deep link to open the app. Learn more about [product deep links](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links). |
| `ios`<br><br>*JSON* | Landing configuration for iOS app. For web validation, `ios`, `ipad`, `iphone` are mutually exclusive. There can only be one of those keys that exist in the `platform_specs`.<br><br>`url`<br><br>string<br><br>Deep link to open the app. Learn more about [product deep links](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links). |
| `ipad`<br><br>*JSON* | Landing configuration for iPad-only app. For web validation, `ios`, `ipad`, `iphone` are mutually exclusive. There can only be one of those keys that exist in the `platform_specs`.<br><br>`url`<br><br>string<br><br>Deep link to open the app. Learn more about [product deep links](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links). |
| `iphone`<br><br>*JSON* | Landing configuration for iPhone-only app. For web validation, `ios`, `ipad`, `iphone` are mutually exclusive. There can only be one of those keys that exist in the `platform_specs`.<br><br>`url`<br><br>string<br><br>Deep link to open the app. Learn more about [product deep links](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links). |

#### Example {#example-creative}

```json
{
  "creative":
{
  "applink_treatment": "deeplink_with_web_fallback",
  "omnichannel_link_spec": {
      "web": {
        "url": <web_url>
      },
      "app": {
        "application_id": <application_id>,
        "platform_specs": {
          "android": {
            "url": <android_deeplink>
          },
          "ios": {
            "url": <ios_deeplink>
          }
        }
      }
   },
  "object_story_spec": {
    "instagram_user_id": <IG_USER_ID>,
    "page_id": <page_id>,
    "link_data": {
      "call_to_action": {
        "type": "LEARN_MORE",
      },
      "link": web_url,
      "message": "Purchase now!",
      "name": "Sample creative"
    }
  },
  "object_type": "SHARE"
}
}
```

| Field | Description |
| --- | --- |
| `creative`<br><br>*Creative spec* | Required for creation. The ID or creative spec of the ad creative to be used by this ad. Learn more about ad creatives.<br><br>`{"creative_id": <creative_id>}` <br><br>or creative spec as in [the above example](#example-creative). |
| `tracking_specs`<br><br>*List of tracking spec* | Required tracking spec for conversion tracking. For ad validation, see the required specs below and respective example. |

For ad validation:

The tracking spec's (`tracking_specs`) `pixel_id` and `application_id` must be consistent with those in promoted_object. `tracking_specs` must include these specs:

| Tracking Spec | Code Sample |
| --- | --- |
| Pixel | ```json
{
       "action.type": ["offsite_conversion"],
       "fb_pixel": [<pixel_id>]
}
``` |
| App install | ```json
{
       "action.type": ["mobile_app_install"],
       "application": [<application_id>]
}
``` |
| App event | ```json
{
       "action.type": ["app_custom_event"],
       "application": [<application_id>]
}
``` |

#### Example {#example-ad}

```json
{
     "name": "sample ad"
     "adset_id": "6170648652866",
     "creative": {
         "creative_id": <creative_id>,
    }
    "status": "PAUSED",
    "tracking_specs": [
        {
            "action.type": ["offsite_conversion"],
            "fb_pixel": [<pixel_id>]
        }
        {
            "action.type": ["mobile_app_install"],
            "application": [<application_id>]
        }
        {
            "action.type": ["app_custom_event"],
            "application": [<application_id>]
        }
    ]
}
```

## Learn more

* [Campaigns](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group)
* [Ad Sets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign)
* [Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)
* [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative)
