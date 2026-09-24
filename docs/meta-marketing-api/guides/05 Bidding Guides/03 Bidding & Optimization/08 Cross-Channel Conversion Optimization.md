<!-- Source: https://developers.facebook.com/documentation/ads-commerce/ccco | Saved: 2026-09-19 -->

# Cross-Channel Conversion Optimization



Cross-channel conversion optimization (CCCO) enables you to optimize conversions for both website and
app within a single campaign. Selecting a website and app as the places you want conversions to
happen captures more data, which may help lower cost per action (CPA) and lead to an increase in
conversions.

Here are the top value drivers that resonate with advertisers:

* Simplicity — Instead of managing multiple campaigns, optimize for website and app within a
single campaign
* More conversions — With more data captured, the chances of showing ads to people who'll
convert increases
* Cost-efficiency — Reach the most people at a lower cost

## Get started

Cross-channel conversion optimization enhances conversions from both your website and app (iOS+
Android) in a single campaign. If an impression leads to a website conversion or an in-app
conversion, or both, the product counts all the conversions as optimized events.

### Restrictions

#### Objective {#objective}
Cross-channel conversion optimization only supports the `CONVERSIONS` objective.

#### Events {#events}
Cross-channel conversion optimization supports the following events:

* `PURCHASE`
* `COMPLETE_REGISTRATION`
* `ADD_PAYMENT_INFO`
* `ADD_TO_CART`
* `INITIATED_CHECKOUT`
* `SEARCH`
* `CONTENT_VIEW`
* `LEAD`
* `ADD_TO_WISHLIST`
* `SUBSCRIBE` 1
* `START_TRIAL` 1

#### Bid strategy {#bid-strategy}
With or without campaign budget optimization (CBO), cross-channel conversion optimization only
supports these bid strategies:

* `LOWEST_COST_WITHOUT_CAP`
* `LOWEST_COST_WITH_BID_CAP`

#### Placements {#placements}

Cross-channel conversion optimization is available for all Instagram and Facebook placements,
including Automatic Placements. **Exceptions**: Audience Network, Messenger, Facebook Instant
Article, and Placement Asset Customization.

**Note:** `SUBSCRIBE` and `START_TRIAL` support are currently being considered.

## Ad Set
Optimize the delivery of your ads based on an offsite conversions goal, such as
`OFFSITE_CONVERSIONS`, if you configure your pixel to send offsite conversions.

To use cross-channel conversion optimization, set the following fields to their respective values:

* Optimization goal > Set to `OFFSITE_CONVERSIONS`.
* Bid strategy > See Bid strategy.
* Billing event > Set to `IMPRESSIONS`.

### Omnichannel object

The `omnichannel_object` field is available in the [Ad Set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-promoted-object).

For omnichannel object validation:

* All `custom_event_type` fields in the app and pixel must be of the same event.
* Both app SDK and pixel are required.
* Current ad accounts must have access to all app- and pixel-promoted objects.

| Field | Type | Description |
| --- | --- | --- |
| `app` | `list<AppPromotedObject>` | App-promoted objects associated with this omnichannel object.<br><br>* `application_id`—Type: string. Application ID being promoted.<br>* `object_store_urls`—Type: `list<string>`. List of object store URLs associated with `application_id` (Play Store and/or iTunes).<br>* `custom_event_type`—Type: Event enum. Event that will be optimized.<br><br>For app-promoted object validation:<br><br>* All `object_store_urls` **must** be associated with that application. You can configure this on [developers.facebook.com](https://developers.facebook.com/) under your application settings.<br><br>* `custom_event_type` **must** be one of those supported [events](#events). |
| `pixel` | `list<PixelPromotedObject>` | Pixel-promoted objects associated with this omnichannel object.<br><br>* `pixel_id`—Type: string. Pixel ID being promoted.<br>* `pixel_rule`—Type: JSON. Optional. Pixel custom conversion rule.<br>* `custom_event_type`—Type: Event enum. Event that will be optimized. For app-promoted object validation, `custom_event_type` **must** be one of those supported [events](#events). |

#### Example: Ad set with omnichannel object

```
{
     daily_budget: 20000,
     optimization_goal: CONVERSIONS,
     promoted_object: {
         omnichannel_object: {
             app: [
                 {
                     application_id: ,
                     custom_event_type: PURCHASE,
                     object_store_urls: [
                         "https://play.google.com/store/apps/details?id=com.facebook.ka"
                         "https://apps.apple.com/us/app/facebook/id284882215",
                     ],
                 },
             ],
             pixel: [
                 {
                     pixel_id,
                     custom_event_type: PURCHASE
                 },
             ],
         }
     }
}
```

## Ad
You can select the desired destination where advertisers want users to land when they click their
ad — from a desktop or app. Advertisers are required to insert the corresponding links — website, iOS
app deep link, or Android app deep link given the chosen destination option. Learn more about
[product deep links](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links).

| Field | Type | Description |
| --- | --- | --- |
| `creative` | Creative spec | **Required for create**. The ID or creative spec of the ad creative is to be used by this ad. Learn more about [ad creatives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative).<br><br>`{"creative_id": }`<br><br>or creative spec as follows:<br><br>```
{
   "creative": {
      "name": "",
      "applink_treatment": ""
      "object_story_spec": ,
      "omnichannel_link_spec":
   }
}
``` |
| `tracking_specs` | List of tracking spec | Required tracking spec for conversion tracking. For ad validation, see the required specs below and respective example. |

For ad validation:

* The tracking spec's (`tracking_specs`)`pixel_id` and `application_id` must be consistent with those in `promoted_object`.
* `tracking_specs` must include these specs:
| Tracking Spec | Code Sample |
| --- | --- |
| Pixel | ```
{
       "action.type": ["offsite_conversion"],
       "fb_pixel": [pixel_id]
}
``` |
| App install | ```
{
       "action.type": ["mobile_app_install"],
       "application": [application_id]
}
``` |
| App event | ```
{
       "action.type": ["app_custom_event"],
       "application": [application_id]
}
``` |

#### Example: Ad object

```
{
     "name": "sample ad"
     "adset_id": "6170648652866",
     "creative": {
         "creative_id": creative_id,
    }
    "status": "PAUSED",
    "tracking_specs": [
        {
            "action.type": ["offsite_conversion"],
            "fb_pixel": [pixel_id]
        }
        {
            "action.type": ["mobile_app_install"],
            "application": [application_id]
        }
        {
            "action.type": ["app_custom_event"],
            "application": [application_id]
        }
    ]
}
```

## Creative

### Advantage+ catalog ads

For Advantage+ catalog  ads, `template_url_spec` can be used to specify deep links in the creative. In this field, you may use dynamic fields such as product URL or ID.

`template_url_spec` follows this specification.

#### Example: Template URL spec

```
{
   "creative":{
      "applink_treatment":"deeplink_with_web_fallback",
      "template_url_spec":{
         "android":{
            "url":"example://product/{{product.retailer_id | urlencode}}"
         },
         "config":{
            "app_id":"<APPLICATION_ID>"
         },
         "ios":{
            "url":"example://product/{{product.name | urlencode}}"
         },
         "web":{
            "url":"https://www.example.com/deeplink/{{product.name | urlencode}}"
         }
      }
   },
}
```

### Manual upload ads

For manual upload ads, `omnichannel_link_spec` is used instead of `template_url_spec`. It includes the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `web` | Web configuration | Pixel-promoted objects associated with this omnichannel object.<br><br>* `url`—Type: string. Website that the user lands on via the browser. For web validation, `url` must be the same as the link provided in `link_data`. |
| `app` | App destination configuration | App-promoted objects associated with this omnichannel object.<br><br>* `application_id`—Type: string. Website that the user lands on via the browser. For web validation, `application_id` must be consistent as the `application_id` in `omnichannel_object` within `promoted_object`.<br>* `platform_specs`—Type: JSON. Landing destination configuration per the platform. |

### Platform Specifications
| Field | Type | Description |
| --- | --- | --- |
| `android` | JSON | Landing configuration for Android app. For web validation, `ios`, `ipad`, `iphone` are mutually exclusive. There can only be one of those keys that exist in the `platform_specs`.<br><br>* `url`—Type: string. Deep link to open the app. Learn more about [product deep links](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links). |
| `ios` | JSON | Landing configuration for iOS app. For web validation, `ios`, `ipad`, `iphone` are mutually exclusive. There can only be one of those keys that exist in the `platform_specs`.<br><br>* `url`—Type: string. Deep link to open the app. Learn more about [product deep links](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links). |
| `ipad` | JSON | Landing configuration for iPad-only app. For web validation, `ios`, `ipad`, `iphone` are mutually exclusive. There can only be one of those keys that exist in the `platform_specs`.<br><br>* `url`—Type: string. Deep link to open the app. Learn more about [product deep links](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links). |
| `iphone` | JSON | Landing configuration for iPhone-only app. For web validation, `ios`, `ipad`, `iphone` are mutually exclusive. There can only be one of those keys that exist in the `platform_specs`.<br><br>* `url`—Type: string. Deep link to open the app. Learn more about [product deep links](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links). |

#### Example: Omnichannel link spec

```
{
  "applink_treatment": "deeplink_with_web_fallback",
  "omnichannel_link_spec": {
      "web": {
        "url": web_url
      },
      "app": {
        "application_id": application_id,
        "platform_specs": {
          "android": {
            "url": android_deeplink
          },
          "ios": {
            "url": ios_deeplink
          }
        }
      }
   },
  "object_story_spec": {
    "instagram_user_id": "<IG_USER_ID>",
    "page_id": "",
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
```
