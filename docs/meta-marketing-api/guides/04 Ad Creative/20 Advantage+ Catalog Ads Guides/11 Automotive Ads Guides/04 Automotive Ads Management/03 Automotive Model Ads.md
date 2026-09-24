<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/aoa | Saved: 2026-09-19 -->

# Automotive Model Ads



To set up automotive model ads, you need a Facebook catalog. A catalog is a container of information about your products and where you can upload your inventory. You can use your catalog in different ways within the Meta family of apps. In your inventory, each individual product represents a unique vehicle offer you want to promote in your campaign.

Meta's automotive model ads use cross-device intent signals to automatically promote relevant vehicle models and offers on Facebook and Instagram. A **vehicle models and offers catalog** consists of information about the offers, corresponding vehicles, and markets/regions where the offer is valid.

Use [Commerce Manager](https://www.facebook.com/business/help/1659534074121655?id=725943027795860) to create and manage your catalogs. Learn more about [building a high-quality catalog](https://www.facebook.com/business/help/2086567618225367?id=725943027795860).

## Before you start
Before you set up your catalog, follow these guidelines:

* If you manage multiple catalogs for different businesses or want an agency to access your catalogs, you may need to set up [Meta Business Suite](https://business.facebook.com/home/accounts?business_id=117943258886315).

* To use the [Catalog Batch API](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/manage-catalog-items/catalog-batch-api), you need the appropriate [Marketing API Access Level](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization#limits) and must accept the [Terms of Service](https://business.facebook.com/legal/product_catalog_terms/) by creating your first catalog through [Meta Business Suite](https://business.facebook.com). See [Catalog Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog).

**Note:** If you're using [Commerce Manager](https://www.facebook.com/business/help/1659534074121655) as part of your application, you may be affected by a couple of security-related breaking changes. See [Breaking Changes, 1/30/2018, Catalog Permissions](https://developers.facebook.com/docs/graph-api/changelog/breaking-changes#1-30-2018).

To set up automotive model ads, follow these steps.

## Step 1: Set up your vehicle models and offers catalog {#setup-ao-feed}

### Create feed files {#vehicle-offer-feed}

To create a catalog, you should connect a data feed or upload data to Meta. The data should contain all the required fields for the vehicles that you want to advertise. Automotive Model Ads only require one product feed. See [Reference - Automotive Model Ads - Supported Fields](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/reference#vehicle-offers-feed-file).

Ensure your feed format follows the recommended guidelines. See [Reference - Automotive Model Ads — Supported Formats](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/reference#supported-feed-format).

#### Downloadable sample files

Download a CSV **sample** feed.

Download an Excel **sample** feed.

Download an XML **sample** feed.

### Deep links

Provide deep links in data feed following the [App Links](https://developers.facebook.com/docs/applinks) specification. Deep link information in data feed takes precedence over any information Meta collects with [App Links](https://developers.facebook.com/docs/applinks) metadata with our web crawler.

If you already have deep link information from [App Links](https://developers.facebook.com/docs/applinks), you do not need to specify this data. Meta uses information from App Links to display the correct deep link. To display deep links in your ads see [Advantage+ Catalog Ads, Ad Template](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management#adtemplate). Learn more about [product deep links](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links).

### Create catalog

Once your feed file is ready, [create your catalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog#Creating).

## Step 2: Schedule uploads {#schedule-uploads}

**Use scheduled feed uploads to automatically push the latest offer feed to Meta instead of uploading refreshed files manually.**

You can make a `POST` request to the `product_feed`s edge from the following paths:  [/{product_catalog_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog)/product_feeds

To add a schedule to the feed, you can provide the `schedule` parameter in the `POST` endpoint.

**Example** - Set up a schedule upload

```
curl -X POST \
  -F 'name=Offer Feed' \
  -F 'schedule={"interval":"DAILY","url":"http://www.example.com/offer_feed.tsv","hour":"22"}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<CATALOG_ID>/product_feeds
```

**Example** — Create offer feed

```
curl \
  -F 'name= offer feed' \
  -F 'access_token=<access_token>' \
  https://graph.facebook.com/<API_VERSION>/<catalog_id>/product_feeds
```

**Example** — Upload local offer feed file

```
curl \
  -F "file=@offer_feed.csv;type=text/csv" \
  -F "access_token=<access_token>" \
  https://graph.facebook.com/<API_VERSION>/<offer_feed_id>/uploads
```

## Step 3: Create product sets {#product-sets}

After the feed is successfully uploaded, optionally create product sets to further filter your offers. A product set is a more granular set of items that you want to promote based on your campaign strategy when setting up a campaign.

**Example**—Create a product set that contains only lease offers

```
curl \
 -F 'name=lease offer set' \
 -F 'filter={"offer_type":{"eq":"lease"}}' \
 -F 'access_token=<ACCESS TOKEN>' \
 https://graph.facebook.com/<API_VERSION>/<CATALOG_ID>/product_sets
```

You can create product sets from the Commerce Manager UI or by using the API. Learn more about
[Product Catalog Product Sets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_sets).

## Step 4: Install the Meta Pixel {#install-pixel}

The Meta Pixel is a snippet of JavaScript code that allows you to track visitor activity on your website. When a visitor interacts with the website, pixel events are fired in response to their actions. A pixel event is a very lightweight http(s) request sent from the visitor's browser to Meta's servers together with some extra information about that event, such as the page url that the visitor is viewing, product ID or price of the product and so on. Therefore, to enable the tracking, you need to modify your website template to insert some JavaScript code in certain pages.

Properly setting up the pixel code is important for automotive model ads because our machine learning algorithm relies on the visitor-product interaction data in the web site collected from the pixel code. Without these data, Advantage+ catalog ads would not be able to make good recommendations to the potential customers who are most likely to make a purchase.

### Standard events to use with the pixel

You can set up the Meta Pixel using the defined [standard events](https://developers.facebook.com/docs/facebook-pixel/reference#standard-events) and parameter that send specific signals to the offer.

#### Standard pixel events for automotive model ads

| Name | Description |
| --- | --- |
| `event_name`<br><br>type: string | **Required**.<br><br>Predefined event names that allow you to capture intent from your audiences at an item level, and segment them. For automotive offer ads, only these four standard pixel events are available: `ViewContent`, `Search`, `AddToWishlist`, `Lead`.<br><br>Where to place these standard events:<br><br>- `ViewContent` to track your VDP and vehicle offer/incentive page view.<br>- `Search` for automotive offer search and search result pages.<br>- `AddToWishlist` when someone saves, likes, or otherwise shows special interest in an offer on the website.<br>- `Lead` to track lower funnel actions or hard leads (where contact info is submitted).<br><br>Besides standard events, you can define custom pixel events as needed. |

#### Required and recommended parameters to pass back with your standard pixel events

| Name | Description |
| --- | --- |
| `content_type`<br><br>type: string | **Required**.<br><br>Parameter that designates the type of product being advertised.<br><br>Example: `vehicle_offer` |
| `content_ids`<br><br>type: array of strings | **Required** for `ViewContent`, `AddToWishlist`, `Lead`. **Recommended** for `Search`.<br><br>These IDs need to match to `vehicle_offer_id` in the offers feed.<br><br>For `ViewContent` events, you should send the ID for the offer presented. For `Search` events, you might send an array of search results.<br><br>Examples: ['123', '456'], "12345", '['1234', '4567', '5678']' |
| `comscore_market_codes`<br><br>type: array of strings | **Recommended.**<br><br>The Comscore market area code, which the user looks at for offers.<br><br>Each string is an ID.<br><br>Example: ["2079"] (or another [valid Comscore Market ID](https://www.facebook.com/business/help/1501907550136620?id=176276233019487)) |
| `make`<br><br>type: array of strings | **Recommended**.<br><br>Make or brand of the vehicle.<br><br>Example: `Endomoto` |
| `model`<br><br>type: string | **Recommended**.<br><br>Model of the vehicle.<br><br>Example: `EndoHatch` |
| `year`<br><br>type: integer | **Recommended**.<br><br>Year the vehicle was launched in `yyyy` format.<br><br>Example: `2015` |
| `body_style`<br><br>type: enum | **Recommended**.<br><br>Body style of the vehicle: `CONVERTIBLE`, `COUPE`, `HATCHBACK`, `MINIVAN`, `TRUCK`, `SUV`, `SEDAN`, `VAN`, `WAGON`, `CROSSOVER`, `OTHER`.<br><br>Example: `SEDAN` |
| `trim`<br><br>type: string | **Recommended**.<br><br>Max characters: 50<br><br>Trim of the vehicle.<br><br>Example: `GE` |
| `price`<br><br>type: string | **Recommended**.<br><br>Cost and currency of the vehicle. Format the price as the cost, followed by the [ISO currency code](https://en.wikipedia.org/wiki/ISO_4217?fbclid=IwAR2aZgfrNvMXY4lsH3phGJ1z-BxgtkSGrJWlKmGNpFwETiDxP7dOqNtwqSE), with a space between cost and currency.<br><br>Example: `13,999 USD` |
| `transmission`<br><br>type: enum | **Recommended**.<br><br>Transmission of the vehicle: `AUTOMATIC`, `MANUAL`, `OTHER`, `NONE`.<br><br>Example: `AUTOMATIC` |
| `fuel_type`<br><br>type: enum | **Recommended**.<br><br>Fuel type of the vehicle: `DIESEL`, `ELECTRIC`, `FLEX`, `GASOLINE`, `HYBRID`, `PETROL`, `PLUGIN_HYBRID`, `OTHER`, `NONE`.<br><br>Example: `ELECTRIC` |
| `drivetrain`<br><br>type: enum | **Recommended**.<br><br>Drivetrain of the vehicle: `4X2`, `4X4`, `AWD`, `FWD`, `RWD`,  `OTHER`, `NONE`.<br><br>Example: `AWD` |
| `preferred_price_range`<br><br>type: array of integers | **Recommended**.<br><br>Preferred price range for vehicle. Min/max, up to 2 decimals.<br><br>Example: `[10000, 20000]` |

Learn more about the [Meta Pixel](https://developers.facebook.com/docs/facebook-pixel).

### Content type

* `content_type` = `vehicle_offer` — **Required**. Used to match the onsite actions to the offer in the ad. This allows Meta to measure the performance and further optimize your campaigns.

* `content_ids` = An array of IDs of vehicle offers from the offers feed — **Optional, but highly recommended** for all events; however, only optional for the `Search` event. This field helps Meta further measure and optimize your ads.

If you have an existing pixel, you can append your pixel code with a `content_type` **`vehicle_offer`** and add the following parameters:

| Event Name | Required Parameters | Recommend Parameters |
| --- | --- | --- |
| `Search`<br><br>Recommended when searching for offers. | `content_type` | `content_ids`<br><br>* `make`<br>* `model`<br>* `year`<br>* `price` (example: `1234.99`)<br>* `currency` (example: `USD`)<br>* `postal_code`<br>* `market_ids`<br>* `transmission`<br>* `fuel_type`<br>* `drivetrain`<br>* `preferred_price_range` |
| `ViewContent`<br><br>Recommended when viewing an auto offer. | `content_type`<br><br>`content_ids` | `content_ids`<br><br>* `make`<br>* `model`<br>* `year`<br>* `price` (example: `1234.99`)<br>* `currency` (example: `USD`)<br>* `postal_code`<br>* `market_ids`<br>* `transmission`<br>* `fuel_type`<br>* `drivetrain`<br>* `preferred_price_range` |
| `AddToWishlist`<br><br>Recommended when saving, favoring, or starring an offer. | `content_type`<br><br>`content_ids` | `content_ids`<br><br>* `make`<br>* `model`<br>* `year`<br>* `price` (example: `1234.99`)<br>* `currency` (example: `USD`)<br>* `postal_code`<br>* `market_ids`<br>* `transmission`<br>* `fuel_type`<br>* `drivetrain`<br>* `preferred_price_range` |
| `Lead`<br><br>Recommended when completing registration and submitting a lead form. | `content_type`<br><br>`content_ids` | `content_ids`<br><br>* `make`<br>* `model`<br>* `year`<br>* `price` (example: `1234.99`)<br>* `currency` (example: `USD`)<br>* `postal_code`<br>* `market_ids`<br>* `transmission`<br>* `fuel_type`<br>* `drivetrain`<br>* `preferred_price_range` |

```
<!-- vehicle offer id information not available-->

<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');

fbq('init', '<FB_PIXEL_ID>'); // pixel id
fbq('track', "PageView");
fbq('track', 'ViewContent', {
                content_type: 'vehicle_offer',
                offer_types: ['lease', 'finance', 'cash'],
                make: 'Endomoto',
                model: 'EndoHatch',
                year: '2017',
                trim: 'GE'
});

</script>
<!-- End Meta Pixel Code -->
```

## Step 5: Build your audience {#build-audience}

To build an audience of people who are interested in the offers, you need to set up the [Meta Pixel](https://developers.facebook.com/docs/facebook-pixel). See also [Install the Meta Pixel](#install-pixel). The pixel should live on all web pages that track action relevant to your business use case. This helps Meta to optimize your campaign to find the right audience.

For example:

* To optimize towards offer detail page views, place the pixel on that page and set up the `ViewContent` pixel event.
* To optimize towards a lead submission, place the pixel on the post submission page and set up the `Lead` pixel event. Learn more about [standard events](https://developers.facebook.com/docs/facebook-pixel/reference#standard-events).

**Note:** Make sure that you set up the pixels on all relevant pages, not just for the pages you're optimizing for.

**Important**: You need to send required parameters along with each pixel event, because a match needs to be made in the catalog to create a product audience.

### Associate the pixel or app to your catalog {#associate-pixel}

**Example** — Using the API

```
curl \
  -F 'external_event_sources=["<PIXEL_ID>","<APP_ID>"]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/external_event_sources
```

**Example** — Using the UI

1. Go to **Meta Business Suite** → **Business Settings**.
2. In the left pane, choose **Data Source** → **Catalogs**.
3. Find and select your catalog, then click **Associate Sources** to associate pixel and app to the catalog.

### Create event source group {#create-source-group}

Event source groups allow advertisers and developers to map multiple sources of conversion data into a single object for use in measurement, analytics, targeting, and optimization.

**Using the API**

```
curl \
  -F 'name=name of your event group' \
  -F 'event_sources=["<PIXEL_ID>", "<APP_ID>"]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/event_source_groups
```

**Using the UI**

1. Go to **Meta Business Suite** → **Business Settings**.
2. In the left pane, choose **Data Source** → **Event Source Groups**.
3. Click **Add** to create a new event source group.

### Create vehicle offer audience {#create-vo-audience}

```
curl \
  -F 'name=Viewed in Last 30 days' \
  -F 'subtype=CLAIM' \
  -F 'claim_objective=VEHICLE_OFFER' \
  -F 'content_type=vehicle_offer' \
  -F 'event_source_group=<EVENT_SOURCE_GROUP_ID>' \
  -F 'inclusions=[
  {
      "event": "ViewContent",
      "retention": {"min_seconds":0,"max_seconds":2592000}
  },
  {
      "event": "Search",
      "retention": {"min_seconds":0,"max_seconds":2592000}
  },
  {
      "event": "AddToWishlist",
      "retention": {"min_seconds":0,"max_seconds":2592000}
  }
  ]' \
  -F 'exclusions=[{
      "event":"Lead",
      "retention": {"min_seconds":0,"max_seconds":2592000}
  }]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/customaudiences
```

**Example** — Capture an audience who has visited your vehicle pages belonging to a certain vehicle set

```
curl \
  -F 'name=Viewed vehicles in vehicle set in Last 30 days' \
  -F 'subtype=CLAIM' \
  -F 'claim_objective=VEHICLE_OFFER' \
  -F 'content_type=vehicle_offer' \
  -F 'event_source_group=<EVENT_SOURCE_GROUP_ID>' \
  -F 'rule={"vehicle_set_id":{"eq":"<VEHICLE_SET_ID>"}}' \
  -F 'inclusions=[
  {
      "event": "ViewContent",
      "retention": {"min_seconds":0,"max_seconds":2592000}
  },
  {
      "event": "Search",
      "retention": {"min_seconds":0,"max_seconds":2592000}
  },
  {
      "event": "AddToWishlist",
      "retention": {"min_seconds":0,"max_seconds":2592000}
  }
  ]' \
  -F 'exclusions=[{
      "event":"Lead",
      "retention": {"min_seconds":0,"max_seconds":2592000}
  }]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/customaudiences
```

## Step 6: Debug your automotive feed (optional) {#debugtool}
Using the [Product Feed Debug Tool](https://business.facebook.com/ads/product_feed/debug), you can paste in a product feed, and validate the feed for errors and warnings.

**To debug your automotive feed**, in the catalog selection drop-down menu, select **Vehicles**.

This is helpful in the early stages of integrating automotive ads to discover whether the current feeds you may already have are supported by Meta.

## Learn more

* [Catalog Setup](https://developers.facebook.com/documentation/ads-commerce/catalog/guides)
* [Meta Pixel](https://developers.facebook.com/docs/marketing-api/audiences-api/pixel)
* [Catalog, Best Practices, Help Center](https://www.facebook.com/business/help/2086567618225367?id=725943027795860)
* [Product Catalog Product Sets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_sets)
* [Standard events](https://developers.facebook.com/docs/facebook-pixel/reference#standard-events)

