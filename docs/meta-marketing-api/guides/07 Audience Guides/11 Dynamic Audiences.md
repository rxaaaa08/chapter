<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/dynamic-product-audiences | Saved: 2026-09-19 -->

# Dynamic Product Audiences



Advantage+ catalog ads enables you to show people ads based on their cross-device purchasing intent. You can collect signals of user intent from mobile apps and websites then use this data to build an audience to target prospective customers.

This document covers how to:

* [Set up User Signals for Events](#step-1-set-up-user-signals-for-events)
* [Associate User Signals to Catalog](#step-2-associate-user-signals-to-product-catalog)
* [Create Product Audiences](#step-3-create-product-audiences)
* [Retrieve Product Audiences](#retrieve-product-audiences)

## Step 1: Set up user signals for events {#step-1-set-up-user-signals-for-events}

To collect user signals, use [App Events](https://developers.facebook.com/docs/app-events) for your mobile app or [Meta Pixel](https://developers.facebook.com/docs/meta-pixel) for your website.

**Note:** If you have an app and are only running ads on desktop, you should still install the Facebook SDK. This helps to capture signals and expand your target audience.

### App events for mobile

You must add the following events to your app through the Facebook SDK for [iOS](https://developers.facebook.com/docs/ios) and [Android](https://developers.facebook.com/docs/android):

| Event | iOS Event | Android Event |
| --- | --- | --- |
| Search | `FBSDKAppEventNameSearched` | `EVENT_NAME_SEARCHED` |
| View Content | `FBSDKAppEventNameViewedContent` | `EVENT_NAME_VIEWED_CONTENT` |
| Add To Cart | `FBSDKAppEventNameAddedToCart` | `EVENT_NAME_ADDED_TO_CART` |
| Purchase | // Send through logPurchase  <br>`[[FBSDKAppEvents shared] logPurchase:(double) currency:(NSString *) parameters:(NSDictionary *)];` | `EVENT_NAME_PURCHASED` |

All of these events should include a `content_id` (or a JSON array of `content_id`s).

Unlike the Meta Pixel, App Events has no `product_catalog_id` parameter. Therefore you *must make an association* between your catalog and app with the `external_event_sources` endpoint described below.

#### Examples

Add To Cart event on iOS:

```
[[FBSDKAppEvents shared] logEvent:FBSDKAppEventNameAddedToCart
      valueToSum:54.23
      parameters:@{
        FBSDKAppEventParameterNameCurrency    : @"USD",
        FBSDKAppEventParameterNameContentType : @"product",
        FBSDKAppEventParameterNameContentID   : @"123456789"
      }
];
```

Purchase event on iOS with two different items purchased with quantity:

```
[[FBSDKAppEvents shared] logPurchase:21.97
    currency:@"USD"
    parameters:@{
      FBSDKAppEventParameterNameContent   : @"[{\"id\":\"1234\",\"quantity\":2},{\"id\":\"5678\",\"quantity\":1}]",
      FBSDKAppEventParameterNameContentType : @"product"
    }
];
```

Purchase event on Android with two items purchased with quantity:

```
Bundle parameters = new Bundle();
parameters.putString(AppEventsConstants.EVENT_PARAM_CURRENCY, "USD");
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "product");
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT, "[{\"id\":\"1234\",\"quantity\":2},{\"id\":\"5678\",\"quantity\":1}]");

logger.logEvent(
  AppEventsConstants.EVENT_NAME_PURCHASED,
  21.97,
  parameters
);
```

Purchase event on Android with two items purchased:

```
Bundle parameters = new Bundle();
parameters.putString(AppEventsConstants.EVENT_PARAM_CURRENCY, "USD");
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_TYPE, "product");
parameters.putString(AppEventsConstants.EVENT_PARAM_CONTENT_ID, "[\"1234\",\"5678\"]");

logger.logEvent(
  AppEventsConstants.EVENT_NAME_PURCHASED,
  21.97,
  parameters
);
```

Note that either `CONTENT_ID` or `CONTENT` can be used with Advantage+ catalog ads to report product IDs. The `CONTENT` param will allow you to provide additional information about the products.

#### Using a mobile measurement partner

To use Advantage+ catalog ads with a mobile measurement partner (MMP), you should trigger separate required events as someone uses your app. The key interaction points you should track are when someone searches for products, views a product, adds something to a cart and purchases items. You should select the events at your MMP that correspond to the following standard Advantage+ catalog ads events:

| Name | Description |
| --- | --- |
| `fb_mobile_search` | Someone searches for products |
| `fb_mobile_content_view` | When an Accounts Center account views a product |
| `fb_mobile_add_to_cart` | Someone adds an item to the cart |
| `fb_mobile_purchase` | An Accounts Center account purchases one or more items |

Also, you need *two additional parameters* for each of the events to register successfully as a valid Advantage+ catalog ads event. These two parameters represent the ID of the item being viewed, added to cart or purchased and whether the ID is a product or a product group ID. The additional parameters available are:

| Name | Description |
| --- | --- |
| `fb_content_id`  <br><br>string | **Either `fb_content_id` or `fb_content` is required.**  <br>The retailer's product or product group ID(s). This should be a string containing a JSON-encoded array of IDs. Use product IDs if possible for more accurate targeting. |
| `fb_content`  <br><br>string | **Either `fb_content_id` or `fb_content` is required.**  <br>A list of JSON objects that contains the International Article Number (EAN) when applicable, or other product or content identifier(s) as well as quantities and prices of the products.  <br><br>The `id` and `quantity` fields are the **required**.  <br>**Example:**  <br>`"[{\"id\": \"1234\", \"quantity\": 2}, {\"id\": \"5678\", \"quantity\": 1}]"` |
| `fb_content_type`<br><br>string | **Optional.**  <br>Either `product` or `product_group`, which needs to sync with the type of IDs used as `fb_content_id`.  <br><br>If no `fb_content_type` is provided, Meta will match the event to every item that has the same ID, independent of its type.<br><br>See ["Choosing the right `content_type`"](#choosing-the-right-content-type) to learn more. |
| `_valueToSum`<br><br>string | **Optional.**  <br>The total value of the products. |
| `fb_currency`<br><br>string | **Optional.**  <br>The currency of the product or purchase amount. |

**Note:** Send the `_valueToSum` and `fb_currency` parameters when a purchase is made.

### Use Meta Pixel for websites

The following events must be added to your website, if applicable:

* `Search`
* `ViewCategory`
* `ViewContent`
* `AddToCart`
* `Purchase`

These events should be sent with the following data parameters:

| Name | Description |
| --- | --- |
| `content_ids`<br><br>string or string[] | **Either `content_ids` or `contents` is required.**  <br>The retailer's product or product group id(s). Use product IDs if possible for more accurate targeting. |
| `contents`<br><br>object[] | **Either `content_ids` or `contents` is required.**  <br>A list of JSON objects that contains the retailer's product or product group ID(s) as well as additional information about the products.<br><br>The `id` and `quantity` fields are **required**  <br>**Example:**  <br>`[{"id": "1234", "quantity": 2}, {"id": "5678", "quantity": 1}]` |
| `content_type`<br><br>string | **Optional.**  <br>Either `product` or `product_group`, which needs to sync with the type of IDs used as `content_ids`.  <br><br>If no `content_type` is provided, Meta will match the event to every item that has the same ID, independent of its type.<br><br>See ["Choosing the right `content_type`"](#choosing-the-right-content-type) to learn more. |
| `product_catalog_id`<br><br>string | **Optional.**  <br>The product catalog to be used. If `product_catalog_id` is supplied, that catalog will be the only one Pixel fires are associated with. If this is not supplied, the catalog(s) associated with your Pixel will be used.  <br>See [Associate User Signals to Product Catalog](#step-2-associate-user-signals-to-product-catalog) to learn more. |

#### Examples

A `Search` standard event is shown below. Provide 5 to 10 items in `content_ids` from your top search results.

```
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
// Insert Your Facebook Pixel ID below.
fbq('init', '<FB_PIXEL_ID>');
fbq('track', 'PageView');

fbq('track', 'Search', {
  search_string: 'leather sandals',
  content_ids: ['1234', '2424', '1318', '6832'], // top 5-10 search results
  content_type: 'product'
});
</script>
<!-- End Facebook Pixel Code -->
```

A`ViewCategory` event is shown below. Provide 5 to 10 items in `content_ids` from your top results. Note that `ViewCategory` is not a standard event, thus the `trackCustom` function is used.

```
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
// Insert Your Facebook Pixel ID below.
fbq('init', '<FB_PIXEL_ID>');
fbq('track', 'PageView');

fbq('trackCustom', 'ViewCategory', {
  content_name: 'Really Fast Running Shoes',
  content_category: 'Apparel & Accessories > Shoes',
  content_ids: ['1234', '2424', '1318', '6832'], // top 5-10 results
  content_type: 'product'
});
</script>
<!-- End Facebook Pixel Code -->
```

A `ViewContent` standard event is shown below. For more details on Pixel setup, see [Meta Pixel](https://developers.facebook.com/docs/meta-pixel).

```
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
// Insert Your Facebook Pixel ID below.
fbq('init', '<FB_PIXEL_ID>');
fbq('track', 'PageView');

fbq('track', 'ViewContent', {
  content_ids: ['1234'],
  content_type: 'product',
  value: 0.50,
  currency: 'USD'
});
</script>
<!-- End Facebook Pixel Code -->
```

An `AddToCart` standard event depends on how your eCommerce platform handles adding an item to a cart. If it is done dynamically this should be placed in an `onclick` event handler so it is triggered on the button click. If a separate page is loaded then the Pixel event can be fired like normal.

```
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
// Insert Your Facebook Pixel ID below.
fbq('init', '<FB_PIXEL_ID>');
fbq('track', 'PageView');

// If you have a separate add to cart page that is loaded.
fbq('track', 'AddToCart', {
  content_ids: ['1234', '1853', '9386'],
  content_type: 'product',
  value: 3.50,
  currency: 'USD'
});
</script>
<!-- End Facebook Pixel Code -->
```

If the event needs to be fired on button click and there is no separate page that loads:

```
<!-- The below method uses jQuery, but that is not required -->

<button id="addToCartButton">Add To Cart</button>
<!-- Add event to the button's click handler -->

<script type="text/javascript">
  $( '#addToCartButton' ).click(function() {
    fbq('track', 'AddToCart', {
      content_ids: ['1234'],
      content_type: 'product',
      value: 2.99,
      currency: 'USD'
    });
  });
</script>
```

A `Purchase` standard event with two items with quantity:

```
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
// Insert Your Facebook Pixel ID below.
fbq('init', '<FB_PIXEL_ID>');
fbq('track', 'PageView');

fbq('track', 'Purchase', {
  contents: [
    {'id': '1234', 'quantity': 2},
    {'id': '4642', 'quantity': 1}
  ],
  content_type: 'product',
  value: 21.97,
  currency: 'USD'
});
</script>

<!-- End Facebook Pixel Code -->
```

A `Purchase` standard event with two items:

```
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
// Insert Your Facebook Pixel ID below.
fbq('init', '<FB_PIXEL_ID>');
fbq('track', 'PageView');

fbq('track', 'Purchase', {
  content_ids: ['1234', '4642'],
  content_type: 'product',
  value: 21.97,
  currency: 'USD'
});
</script>

<!-- End Facebook Pixel Code -->
```

### Choosing the right `content_type` {#choosing-the-right-content-type}

**Warning:** **Note:** `fb_content_type` is the content type for mobile.

If the page is about a specific SKU (specific size, color, and so on), then use `product` for `content_type` and pass the product IDs (that is, [`id` column in the Product Feed](https://developers.facebook.com/documentation/ads-commerce/catalog#required-fields)) in `content_ids`. All `AddToCart` and `Purchase` events should use `content_type=product` because people buy specific products. People don't buy an amorphous shirt of indeterminate size and color; they buy a specific shirt with a specific size and color.

If the page is about a group of related products that vary by size, color, and so on but belong to the same product group, use `product_group` and pass the product group IDs (that is, [`item_group_id` column in the Product Feed](https://developers.facebook.com/documentation/ads-commerce/catalog#optional-fields)) in `content_ids`. A common use case is a `ViewContent` page where the user has not chosen a size yet. **Do not use** `product_group` with `AddToCart` or `Purchase`.

It's important that the `content_type` matches the type of ID(s) included in the `content_ids` or `contents` parameter.

Passing the specific product IDs (`content_type=product`) allows Meta to recommend more relevant products because it knows which specific variant (size, color, and so on) the user expressed interest in. Meta always shows products (not product groups), even if `content_type=product_group`.

If no `content_type` is provided, Meta will match the event to every item that has the same ID, independent of its type. Sending `content_type` is recommended, as it will give you more control over which specific ID you want to match the event.

## Step 2: Associate user signals to product catalog {#step-2-associate-user-signals-to-product-catalog}

You need to associate your event sources with each of your product catalogs so that Facebook can get this data and display the correct product in an ad. You can do this by visiting your [Meta Business Suite Catalog Page](https://business.facebook.com/settings/product-catalogs) and clicking the **Associate Event Source** button. Make sure to select the app and Pixel that will be receiving the Advantage+ catalog ad events.

Alternatively, you can make a `POST` API call with a list of external event sources as a UTF-8 encoded query string parameters:

```html
curl \
  -F 'external_event_sources=["<PIXEL_ID>","<APP_ID>"]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PRODUCT_CATALOG_ID>/external_event_sources
```

**Note:** You need to have permissions on the catalog, Pixel, and app as well as the business.

#### Parameters

| Name | Description |
| --- | --- |
| `external_event_sources` | **Required.**  <br>An array of app and Pixel IDs to associate, as UTF-8 encoded query string parameters |

## Step 3: Create product audiences {#step-3-create-product-audiences}

The next step is to build product audiences based on the activity on your mobile apps and website. You can choose which events to use and target ads using your product audiences.

For standard app events, the audience will be aggregated under the ads Pixel event names:  

* `Search`
* `ViewContent`
* `AddToCart`
* `Purchase`

Use these event names in your audience rules, even if it includes users on Android and iOS.

Create a product audience by making an `POST` API call to the `/act_{ad-account-id}/product_audiences` endpoint.

```
https://graph.facebook.com/v25.0/act_AD_ACCOUNT_ID/product_audiences
```

#### Parameters

| Name | Description |
| --- | --- |
| `name`<br><br>string | **Required.**  <br>The name of the audience. |
| `description`<br><br>string | **Optional.**  <br>A description of the audience. |
| `product_set_id`<br><br>numeric string | **Required.**<br>The product set to target with this audience. |
| `inclusions`<br><br>JSON object | **Required.**  <br>A set of events to target. At least one inclusion is required. Each inclusion should have exactly one event. |
| `inclusions.retention_seconds`<br><br>int | **Required.**  <br>The number of seconds to keep the Accounts Center account in the audience. |
| `inclusions.rule`<br><br>object[] | **Required.**  <br>[Website Custom Audience Rule](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences#audiencerules) referencing one `event`. |
| `exclusions`<br><br>JSON object | **Optional.**  <br>Events for which an Accounts Center account should be excluded from targeting.  <br>For exclusions, an Accounts Center account with these events will be excluded from targeting if the event has happened on any product in the same product group (i.e., products that have the same `item_group_id in` the product feed).  <br>For example, a product audience is set to include `ViewContent` and exclude Purchase events. An Accounts Center account views product A and B and purchases product B. If product A and product B belong to the same product group then that Accounts Center account will be excluded from the product audience because A and B are just variants. If product A and B are not in the same product group, the Accounts Center account will continue to remain in the audience because they still have a `ViewContent` event for product A. |
| `exclusions.retention_seconds`<br><br>int | **Required, if exclusion is specified.**  <br>The number seconds to retain the exclusion. |
| `exclusions.rule`<br><br>object[] | **Required, if exclusion is specified.**  <br>[Website Custom Audience Rule](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences#audiencerules) referencing one `event`. |

**Warning:** Each rule must include `event` with the `eq` operator either as a top-level rule or as part of a top-level `and` rule.

**Warning:** If the same `event` is used in both inclusions and exclusions, any additional parameter checks must be exactly the same.

#### Examples

To create an audience targeting people that viewed or added products to a cart, but didn't finish the purchase:

```html
curl -X POST \
  -F 'name="Test Product Audience"' \
  -F 'product_set_id="<PRODUCT_SET_ID>"' \
  -F 'inclusions=[
       {
         "retention_seconds": 86400,
         "rule": {
           "event": {
             "eq": "AddToCart"
           }
         }
       },
       {
         "retention_seconds": 72000,
         "rule": {
           "event": {
             "eq": "ViewContent"
           }
         }
       }
     ]' \
  -F 'exclusions=[
       {
         "retention_seconds": 172800,
         "rule": {
           "event": {
             "eq": "Purchase"
           }
         }
       }
     ]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/product_audiences
```

If you want target people that viewed a product on the web with iPhone, but haven't purchased on any device, create the following audience.

This assumes that you include a `userAgent` parameter in your Meta Pixel.

```html
curl -X POST \
  -F 'name="Test Iphone Product Audience"' \
  -F 'product_set_id="<PRODUCT_SET_ID>"' \
  -F 'inclusions=[
       {
         "retention_seconds": 86400,
         "rule": {
           "and": [
             {
               "event": {
                 "eq": "AddToCart"
               }
             },
             {
               "userAgent": {
                 "i_contains": "iPhone"
               }
             }
           ]
         }
       }
     ]' \
  -F 'exclusions=[
       {
         "retention_seconds": 172800,
         "rule": {
           "event": {
             "eq": "Purchase"
           }
         }
       }
     ]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/product_audiences
```

## Step 4: Retrieve product audiences {#retrieve-product-audiences}

Once you create a product audience, you can retrieve it with the [Custom Audiences API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience). You can get the original parameters used for audience creation with the `data_source` parameter.

A product audience is a specific type of custom audience that is dynamically generated from product events. The `act_{ad-account-id}/product_audiences` endpoint is a special `POST` endpoint to construct these audiences.

#### Examples

To retrieve Custom Audience:

```html
curl -X GET \
  -d 'fields="data_source,subtype"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

To retrieve a specific product audience:

```html
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PRODUCT_AUDIENCE_ID>
```

## Learn more

* [Product Catalog Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog)
* [Custom Audience Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience)
