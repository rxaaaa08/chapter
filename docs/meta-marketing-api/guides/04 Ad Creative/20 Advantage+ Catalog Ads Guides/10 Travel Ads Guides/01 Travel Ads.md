<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads | Saved: 2026-09-19 -->

# Travel Ads



Automatically promote your travel inventory on Facebook. Facebook's travel ads leverage cross-device intent signals to automatically promote relevant travel options from your inventory with unique creatives on Facebook.

Travel ads supports **[Hotel Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads)**, **[Flight Ads](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-flights)**, and **[Destination Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads)**.

**Note:** This guide assumes:

* You have a catalog and product set ready.
* You have set up the required travel events on your website or in your mobile app.
* (Required) You have created a [Facebook Page](https://www.facebook.com/pages/create/) and an [ad account](https://www.facebook.com/ads/manager/accounts).

## Targeting Strategies {#targeting-strategies}

Travel ads support different targeting strategies. You can drive different business objectives by combining the right audience with the right product set:

* [Retargeting](#retargeting)—Show relevant hotels, destinations or flights to people who have been to your website or app looking for hotels, destinations or flights.

* [Cross-sell and upsell](#crosssell)—Target people who have purchased a flight with relevant hotels, or upsell priority boarding or seat selection.

* [Prospecting](#prospecting)—Expand the reach of your ad and find new customers by targeting [prospecting audiences](#prospecting).

## Set Up Travel Ads {#create-da}

When you create Travel ads, you follow the same process as you do when you set up any other type of Facebook ad with the API:

* [__Step 1: Create Campaign__](#campaign)
* [__Step 2: Create Ad Set__](#adset)
* [__Step 3: Create Ad Creative__](#creative)
* [__Step 4: Create Ad__](#ad)
* [__Next Steps__](#whatsnext)

## Step 1. Create Campaign {#campaign}

Travel ads use the `PRODUCT_CATALOG_SALES` objective. Specify a travel catalog in `promoted_object` at the campaign level:

```html
curl \
  -F 'name=Product Catalog Sales Campaign' \
  -F 'objective=PRODUCT_CATALOG_SALES' \
  -F 'promoted_object={"product_catalog_id":"<PRODUCT_CATALOG_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

## Step 2. Create Ad Set {#adset}

Once you have the campaign and the `campaign_id`, you can create the [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign). The ad set defines the bidding and targeting options for your ads.

### Retargeting {#retargeting}
To **retarget** the website or app visitors, use a dynamic audience of the same type as the product set you are promoting; for example, promote a hotel set to a hotel audience, a flight set to a flight audience and a destination set to a destination audience.

### Cross-sell and Upsell {#crosssell}
To **cross-sell and upsell** people that purchased on your website and/or app, use a dynamic audience that contains people that have made a purchase, and promote them travel options from another catalog; for example, target a [flight purchase audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads/audience-management) with a hotel set or another flight set, highlighting seat selection.

### Prospecting {#prospecting}

* Create an audience using basic demographic targeting, such as women in the U.S. over the age of 18.
* Include customers targeted by existing retargeting campaigns, but consider excluding people who have purchased in the last 10 days.
* Use a broad product set with over 100 hotels.
* Optimize for `OFFSITE_CONVERSIONS` with stronger intent signals, such as `Purchase` or `InitiateCheckout`.

See also [Advantage+ Catalog Ads, Broad Audience Targeting](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management#adset-broad-audiences)

### Create Ad Set Example {#adset-example}

```html
curl \
  -F 'name=Product Catalog Sales Adset' \
  -F 'bid_amount=3000' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'optimization_goal=OFFSITE_CONVERSIONS' \
  -F 'daily_budget=15000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "geo_locations": {"countries":["US"]},
    "dynamic_audience_ids": ["<DYNAMIC_AUDIENCE_ID>"]
  }' \
  -F 'promoted_object={"product_set_id":"<PRODUCT_SET_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

Travel ads **does not support inline dynamic audience targeting specs in the Ad Set**. You must separately [create an audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads/audience-management#create-audience) first.

## Step 3. Create Ad Creative {#creative}

You can use **template tags** in your [ad creatives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) for Travel ads. When Facebook displays your ad, we replace template tags with someone's actual travel choices. You can use template tags in the ad itself and in the URL someone sees once they click the ad.

* [Template Tags for Hotels](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/template-tags)
* [Template Tags for Destinations](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/template-tags)
* [Template Tags for Flights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/flight-ads/template-tags)

Use the `template_url_spec` field to specify the URL that appears after someone clicks the ad. If you don't provide it, or we can't derive it when we render an ad, we display the URL from the catalog. **For Flight Ads, this field is required if you don't provide a URL in the catalog**.

You can show a single item or a carousel with multiple items. For single-item ads, you can show multiple images of the same item in the carousel, assuming your catalog contains multiple images for each item. You can also display static cards in combination with dynamic cards. For more information about creative options, see [Advantage+ Catalog Ads, Building a Creative Template](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management#adtemplate).

The following example shows how to create a carousel creative for [Hotel Ads](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-hotels/v3.1). [Destination Ads](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-destinations/v3.1) and [Flight Ads](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-flights/v3.1) have a similar setup.

```html
curl \
  -F 'name=Dynamic Ad Template Creative Sample' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "template_data": {
      "additional_image_index": 0,
      "call_to_action": {"type":"BOOK_TRAVEL"},
      "description": "{{hotel.description}}",
      "link": "<LINK>",
      "message": "Book your upcoming stay in {{hotel.city}}",
      "name": "{{hotel.name | titleize}}"
    }
  }' \
  -F 'template_url_spec={
    "config": {"app_id":"123456789012345"},
    "ios": {
      "url": "example:\/\/home\/hotel?id={{hotel.hotel_id | urlencode}}&startDate={{trip.checkin_date date_format:Y-m-d | urlencode}}&endDate={{trip.checkout_date date_format:Y-m-d | urlencode}}"
    },
    "web": {
      "url": "http:\/\/www.example.com\/hotel?id={{hotel.hotel_id | urlencode}}&startDate={{trip.checkin_date date_format:Y-m-d | urlencode}}&endDate={{trip.checkout_date date_format:Y-m-d | urlencode}}"
    }
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Flight Upsell (API v2.10+ only) {#flight-upsell}

To upsell options, such as seat selection or priority boarding, to an audience that purchased flights:

1. Provide an audience by including only `PURCHASE` events.
2. (Preferred) In the ad creative's `recommender_settings`, specify `PURCHASE` events to recommend ads.

```html
curl \
  -F 'name=Advantage+ Catalog Ad Template Creative Up-sell Sample' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "template_data": {
      "additional_image_index": 0,
      "call_to_action": {"type":"LEARN_MORE"},
      "description": "{{flight.description}}",
      "link": "<LINK>",
      "message": "Book extra leg room on your flight from {{flight.origin_city}} to {{flight.destination_city}}",
    }
  }' \
  -F 'template_url_spec={
    "config": {"app_id":"<APP_ID>"},
    "ios": {
      "url": "example:\/\/home\/flight?id={{flight.origin_airport}}&startDate={{trip.departing_departure_date date_format:Y-m-d | urlencode}}&endDate={{trip.returning_departure_date date_format:Y-m-d | urlencode}}"
    },
    "web": {
      "url": "http:\/\/www.example.com\/flight?id={{flight.origin_airport}}&startDate={{trip.checkin_date date_format:Y-m-d | urlencode}}&endDate={{trip.returning_departure_date date_format:Y-m-d | urlencode}}"
    }
  }' \
  -F 'product_set_id=<FLIGHT_SET_ID>' \
  -F 'recommender_settings'={"preferred_events":["Purchase"]}\
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/VERSION/act_<AD_ACCOUNT_ID>/adcreatives
```

### Overlay Design {#overlay}

Overlays allow advertisers to add pricing information (as a direct price or percentage off) for each item within Advantage+ catalog ads.

#### Overlay Options by Catalog Type
You can use the following overlay types, depending on the catalog type you use in the ad set:

* Hotel: `price`, `strikethrough` and `% off`
* Destination: `price`
* Flight: `price`

**Note**: All price-related template tags for each catalog type are supported for the overlay options above. To view template tags for each catalog type, see [hotels](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-hotels/template-tags/v2.11), [destinations](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-destinations/template-tags/v2.11), and [flights](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-flights/template-tags/v2.11).

#### Overlay Design Options
The pricing information is dynamically pulled from the price and sale price columns of the feed. Advertisers can select from the following customizations for their Advantage+ catalog ads overlay:

* Shapes: Pill, Circle and Triangle.
* Positions: 4 fixed corners: `TOP_LEFT`, `TOP_RIGHT`, `BOTTOM_LEFT`, and `BOTTOM_RIGHT`. For triangle, only the `TOP_LEFT` and `TOP_RIGHT` are supported.
* Fonts: A list of preset fonts, such as Droid Serif, Open Sans, and so on.
* Overlay types supported: `price`, `strikethrough` and `% off`. **Note**:  `strikethrough` and `% off` are available for hotels only.

Learn more about [how to add overlays](https://www.facebook.com/business/help/1492206750869184).

#### Example—Price Overlay with Strikethrough for a Hotel Ad

```html
curl \
  -F 'name=Test Templates in Overlay' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "template_data": {
      "description": "Description",
      "link": "<LINK>",
      "name": "Name: {{hotel.name}}",
      "message" : "Come visit {{hotel.city}}!",
      "image_overlay_spec": {
        "overlay_template":"pill_with_text",
        "text_font":"droid_serif_regular",
        "text_type":"strikethrough_price",
        "position":"top_left",
        "theme_color":"background_e50900_text_ffffff",
        "float_with_margin":"true",
        "text_template_tags": ["{{hotel.price round}}", "{{hotel.sale_price round}}"],
      }
    }
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'template_url=http://www.example.com' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v2.10/act_897427477067185/adcreatives
```

## Step 4. Create Ad {#ad}

To create the [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup), use  `ad_set_id` and `creative_id`.

```html
curl -X POST \
  -F 'name="My Ad"' \
  -F 'adset_id="<AD_SET_ID>"' \
  -F 'creative={
       "creative_id": "<CREATIVE_ID>"
     }' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

## Next Steps {#whatsnext}

### Preview the Ad

You can generate a preview of your Advantage+ creative for catalog with the [Ad Previews API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview). Include the `product_item_ids` parameter to specify which catalog items display in the preview.

Generate a preview of your ad with the [Ad Previews API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview). Include the `product_item_ids` to specify which catalog items appears in the preview, `start_date`, and `end_date` to specify specific dates.

```html
curl -X GET \
  -d 'ad_format="DESKTOP_FEED_STANDARD"' \
  -d 'product_item_ids=[
       "<PRODUCT_ITEM_ID>"
     ]' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CREATIVE_ID>/previews
```

#### Parameters

| Field Name & Type | Description |
| --- | --- |
| `product_item_ids`<br><br>type: `array[string]` | * __Hotel__: List of hotel FBID or Base64url-encoded hotel ID tokens. Each token is of the form `hotel_catalog:{catalog_id}:{base64urlencode(hotel_id)}`<br>* __Destination__: List of destination FBID or Base64url-encoded destination ID tokens. Each token is of the form `destination_catalog:{catalog_id}:{base64urlencode(destination_id)}`<br>* __Flight__: Flight FBID or Base64url-encoded flight ID token. Each token is of the form `flight_catalog:{catalog_id}:{base64urlencode(destination_id)}` |
| `start_date`<br><br>type: `string` | Render the preview with user's intent signal; ex: 2016-12-24.<br><br>* For hotel, this would be the value of `trip.checkin_date`<br>* For destination, this would be the value of `trip.travel_start`<br>* For flight, this would be the value of `trip.departing_departure_date` |
| `end_date`<br><br>type: `string` | Render the preview with user's intent signal; ex: 2017-01-01.<br><br>* For hotel, this would be the value of `trip.checkout_date`<br>* For destination, this would be the value of `trip.travel_end`<br>* For flight, this would be the value of `trip.returning_departure_date` |

### Fetch Travel Ad Insights & Statistics

To fetch ad Insights for a travel object, such as hotel, make a `GET` call to [`/insights`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights). **Note**: Remember to add `product_id` to the `breakdown` parameter.

For hotel and destination, the `product id` breakdown is shown for each `hotel_id` or `destination_id`. For flight, the `product id` breakdown shows `origin_airport:destination_airport`.

### Fetch Comments and Likes

To retrieve comments or "Likes" of Advantage+ catalog ads, use the [Dynamic Post API](https://developers.facebook.com/docs/graph-api/reference/rtb-dynamic-post).
