<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/catalog | Saved: 2026-09-19 -->

# Destination Ads - Catalog & Feed



To promote destinations on Facebook, you have to share information about them with Facebook. You do this by creating a destination catalog and then filling it with destinations.

[Upload CSV or XML files for 'destination feeds' with the destinations you want to promote](#upload-destination-feed)

You can create and manage your destination catalog in your [Commerce Manager](https://www.facebook.com/products).

To use the API to manage your catalog:

1. [Create a destination catalog](#destination-catalog)
2. [Upload your feed to Facebook](#feed-upload)
3. [Create product sets out of your destination catalog](#destination-catalog)
4. [Associate the catalog to your event sources](#event-sources)

## Destination feed - upload your destinations to Facebook {#upload-destination-feed}

A destination feed is a file with the destinations you want to promote. Every line or item in the file represents a single destination. You can use one or more destination feeds, as long as all feeds together contain all destinations you want to promote.

### Supported destination feed formats

#### CSV - sample and description
[CSV sample](https://lookaside.facebook.com/developers/resources/?id=destination_example.csv) | [TSV sample (flattened)](https://lookaside.facebook.com/developers/resources/?id=dat_destinations_flattened.tsv) | [TSV sample (JSON-style)](https://lookaside.facebook.com/developers/resources/?id=dat_destinations_json.tsv)

* The first row must list the chosen field names in the order the values will be given. Subsequent rows then supply the corresponding values for each destination.
* Fields containing whitespace or commas should be enclosed in `"`double quotes`"`.
* Nested or multi-value fields, such as `address`, `neighborhood` or `image` can be represented using JSON-encoded values or by a set of "flattened" plain-text columns labeled using JSON-path syntax, such as `address.city`, `neighborhood[0]`, `image[0].url`, `image[0].tag[0]`, `image[0].tag[1]`. Both conventions can be used interchangeably in the same file.

#### XML - sample and description
[XML sample](https://lookaside.facebook.com/developers/resources/?id=dat_destination_feed.xml)

* A root `<listings>` XML node encloses a set of `<listing>` nodes, each of which represents a destination.
* The file must begin with a valid `<?xml` declaration tag.

The feed parser automatically detects `UTF8`, `UTF16`, or `UTF32` text encodings, and defaults to `LATIN1` if it encounters an unexpected byte sequences. You can provide text in field values in any language; **however, field names must be given exactly as below, in English.**

### Supported fields - destinations {#supported-fields-destination}

The following supported fields are designed for items you add to your product catalog.

For localized catalogs, see [supported fields for destinations](https://developers.facebook.com/documentation/ads-commerce/catalog/reference#loc-cat-destination).
| Field Name and Type | Description |
| --- | --- |
| `destination_id`<br><br>type: string | **Required**.<br><br>Max length: 100<br><br>Your unique identifier for the destination within the catalog. This identifier will be matched with any `content_ids` provided in your `destination` app and pixel events. **Tip**: To improve performance, avoid using a space for this unique identifier field. |
| `address`<br><br>type: object | **Required**.<br><br>Complete address for the destination that must be resolvable to its location.<br><br>See [**Address Object Parameters**](#address-object) |
| `image`<br><br>type: object | **Required**.<br><br>Max items: 20<br><br>Image data for this destination. You can provide up to 20 images for the destination. Each image contains two fields: `url` and `tag`. You can have multiple tags associated with an image. You must provide at least one `image`. Each image can be up to 4 MB in size.<br><br>See [**Image Object Parameters**](#image-object) |
| `url`<br><br>type: string | **Required**.<br><br>Link to the external site where you can view the destination page. You can specify a URL on [ad level](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-travel/ads-management#creative) too using `template_url_spec`. URLs on ad level take precedence over URLs in the feed. |
| `type`<br><br>type: string | **Required**.<br><br>Max items: 20<br><br>Type of destination, such as beach, city, food, sightseeing, culture, history, shopping, museum, tranquility, scenery, nature, architecture, business, friendly people, relaxation, night market, mountain, temple, hiking, snorkeling, and so on. There can be multiple types associated with a destination; meaning a destination can have multiple attributes, such as `beach` and `sightseeing`. |
| `name`<br><br>type: string | **Required**.<br><br>Most common name of the destination. |
| `neighborhood`<br><br>type: string | **Optional**.<br><br>Max items: 20<br><br>One or more neighborhood(s) for the destination.<br><br>Examples: `Soho`, `Las Vegas Strip` |
| `latitude`<br><br>type: float | **Optional**.<br><br>Latitude of the destination.<br><br>Example: `37.484100` |
| `longitude`<br><br>type: float | **Optional**.<br><br>Longitude of the destination.<br><br>Example: `-122.148252` |
| `description`<br><br>type: string | **Optional**.<br><br>Max size: 5000<br><br>Short paragraph describing the destination. |
| `price`<br><br>type: string | **Optional**.<br>Can be lowest or average price for this destination. You must specify the value with currency.<br><br>Example: `99.99 USD` |
| `price_change`<br><br>type: int | **Optional**.<br>Price change:<br><br>* __0__: No price change<br>* __-10__: 10% price drop<br>* __20__: 20% price increase<br><br>Can be used for building product sets and in the universal creative ("average price dropped by X"). |
| `applink`<br><br>type: element | **Optional**.<br>Deep link straight to the destination details page in your mobile app using [App Links](https://developers.facebook.com/docs/applinks). Specify deep links in order of precedence, highest to lowest:<br><br>1. On [ad level](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-travel/ads-management) using `template_url_spec`<br>2. here in the feed using an [**Applink Object**](#applink-object)<br>3. By adding [App Link meta tags](https://developers.facebook.com/docs/applinks) to your website. |
| `status`<br><br>type: string | Controls whether an item is active or archived in your catalog. Only active items can be seen by people in your ads, shops, or any other channels. Supported values: `active`, `archived`. Items are active by default. Learn more about [archiving items](https://www.facebook.com/business/help/543317109402043?id=725943027795860).<br><br>Example: `active`<br><br>**Note**: Some partner platforms such as Shopify may sync items to your catalog with a status called **staging**, which behaves the same as `archived`.<br><br>**Warning:** This field was previously called `visibility`. The old field name is still supported, but use the new name `status`. |
| `custom_label_0`  <br>`custom_label_1`  <br>`custom_label_2`  <br>`custom_label_3`  <br>`custom_label_4`<br><br>type: string | Max character limit: 100<br><br>Up to five custom fields for any additional information you want to filter items by when you create sets. For example, you could use a custom field to indicate all items that are part of a summer sale, and then filter those items into a set. This field supports any text value, including numbers.<br><br>Example: `Summer Sale`<br><br>**Note:** This field is supported by supplementary feeds. |
| `custom_number_0`  <br>`custom_number_1`  <br>`custom_number_2`  <br>`custom_number_3`  <br>`custom_number_4`<br><br>type: int | Up to five custom fields for any additional number-related information you want to filter items by when you create sets. This field allows you to filter by number ranges (**is greater than** and **is less than**) when you create a set. For example, you could use this field to indicate the year an item was produced, and then filter a certain year range into a set.<br><br>This field supports whole numbers between 0 and 4294967295. It doesn't support negative numbers, decimal numbers, or commas, such as -2, 5.5, or 10,000.<br><br>Example: `2022` |
| `internal_label`<br><br>type: string | Add internal labels to help filter items when you create [product sets](https://www.facebook.com/business/help/620275848114281?id=725943027795860). For example, you could add a "summer" label to all items that are part of a summer promotion and then filter those items into a set. Labels are only visible to you<br><br>Enclose each label in single quotes (') and separate multiple labels with commas (,). Don't include white spaces at the beginning or end of a label. Character limit: Up to 5,000 labels per product and 110 characters per label.  <br><br>Example (TSV, XLSX, Google Sheets): ['summer','trending']<br><br>Example (CSV): "['summer','trending']"<br><br>**Note**: If you're currently using custom labels (`custom_label_0` to `custom_label_4`) for filtering product sets, switching to internal labels (`internal_label`) instead is recommended. Unlike custom labels, you can add or update internal labels as often as needed without sending items through policy review each time, which can impact ad delivery.<br><br>**Warning:** This field was previously called `product_tags`. The old field name is still supported, but use the new name `internal_label`. |

## Product deep links
[Provide deep links](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links) in feed following the [App Links](https://developers.facebook.com/docs/applinks) specification. Deep link information in feed takes precedence over any information Facebook collects with App Links metadata with our web crawler.

If you already have deep link information from App Links, you don't need to specify this data. Facebook uses information from App Links to display the correct deep link. To display deep links in your ads, see [Advantage+ Catalog Ads, Ad Template](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management#adtemplate).

## Image object parameters {#image-object}
| Field Name and Type | Description |
| --- | --- |
| `url`<br><br>type: string | **Required**.<br><br>URL of the destination image. Follow these image specifications:<br><br>* All images must be in JPG, GIF, or PNG format.<br><br>* For carousel ads and collection ads: Images display in square (1:1) format. The minimum image size is 500 x 500 px. For best quality, use 1024 x 1024 px.<br><br>* For single image ads: Images display at a 1.91:1 aspect ratio. The minimum image size is 500 x 500 px. For best quality, use 1200 x 628 px. |
| `tag`<br><br>type: string | **Optional**.<br><br>String that represents what's in the image. There can be multiple tags associated with an image.<br><br>Examples: `Fitness Center`, `Swimming Pool`<br><br>`INSTAGRAM_STANDARD_PREFERRED` - Allows advertisers to tag a specific image in their feed as the default image that will be used for Instagram. This tag is case sensitive. |

## Address object parameters {#address-object}
**Note:** Nested or multi-value fields, such as `address` can be represented using JSON-encoded values or by a set of "flattened" plain-text columns labeled using JSON-path syntax, such as `address.region`. Both conventions can be used interchangeably in the same file.

| Field Name and Type | Description |
| --- | --- |
| `addr1` (`address.addr1`)<br><br>type: string | Street address of destination.<br><br>Example: `675 El Camino Real` |
| `address.city` (`city`)<br><br>type: string | **Required**.<br><br>City where destination is located.<br><br>Example: `Palo Alto` |
| `address.region` (`region`)<br><br>type: string | **Required**.<br><br>State, county, region, or province for destination.<br><br>Example: `California` |
| `address.postal_code` (`postal_code`)<br><br>type: string | Postal code or zip code for destination. **Required** unless country does not have a postal code system.<br><br>Examples:<br><br>* `94125`<br>* `NW1 3FG` |
| `address.country` (`country`)<br><br>type: string | **Required**.<br><br>Country of the destination.<br><br>Example: `United States` |
| `address.city_id` (`city_id`)<br><br>type: string | Value to use in deep link URL (`template_url`) in the universal creative. |

#### Applink Object Parameters {#applink-object}

If you have separate apps for iPhone and iPad, specify iPhone and iPad specific information. Otherwise specify only iOS information.

| Field Name and Type | Description |
| --- | --- |
| `ios_url`<br><br>type: string | A custom scheme for the iOS app.<br><br>Example: `example-ios://electronic` |
| `ios_app_store_id`<br><br>type: string | The app ID for the App Store.<br><br>Example: 1234 |
| `ios_app_name`<br><br>type: string | The name of the app (suitable for display).<br><br>Example: `Electronic Example iOS` |
| `iphone_url`<br><br>type: string | A custom scheme for the iPhone app.<br><br>Example: `example-iphone://electronic` |
| `iphone_app_store_id`<br><br>type: string | The app ID for the App Store.<br><br>Example: `5678` |
| `iphone_app_name`<br><br>type:string | The name of the app (suitable for display).<br><br>Example: `Electronic Example iPhone` |
| `ipad_url`<br><br>type: string | A custom scheme for the iPhone app.<br><br>Example: `example-ipad://electronic` |
| `ipad_app_store_id`<br><br>type: string | The app ID for the App Store.<br><br>Example: `9010` |
| `ipad_app_name`<br><br>type: string | The name of the app (suitable for display).<br><br>Example: `Electronic Example iPad` |
| `android_url`<br><br>type: string | A custom scheme for the Android app.<br><br>Example: `example-android://electronic` |
| `android_package`<br><br>type: string | A fully-qualified package name for intent generation.<br><br>Exammple: `com.electronic` |
| `android_app_name`<br><br>type: string | The name of the app (suitable for display).<br><br>Example: `Electronic Example Android` |

**The following sections are only relevant to manage your catalogs using this API.**

## Create a destination catalog using the API {#destination-catalog}

A destination catalog is a container for the destinations you want to promote. To use the catalog API, make sure you have the appropriate [Marketing API Access Level](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization#limits) and that you have accepted the [Terms of Service](https://business.facebook.com/legal/product_catalog_terms/) by creating your first catalog through [Meta Business Suite](https://business.facebook.com).

To create a destination catalog for destination ads, set `vertical` to `destinations`:

```bash
curl -X POST \
  -F 'name="Test Destination Catalog"' \
  -F 'vertical="destinations"' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v10.0/BUSINESS_ID/owned_product_catalogs
```

## Upload your destination feeds via the API {#feed-upload}

Once you have created the catalog, you must upload your destination feed(s) to Facebook. Use the API to create a feed object for every feed you want to upload. Scheduled and direct uploads are supported.

For scheduled uploads, specify a schedule when you create the feed. For non scheduled uploads, don't specify a schedule.

```html
curl -X POST \
  -F 'name="Test Feed"' \
  -F 'schedule={
       "interval": "DAILY",
       "url": "http://www.example.com/sample_feed.tsv",
       "hour": "22"
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PRODUCT_CATALOG_ID>/product_feeds
```

In either case, the response is:

```
{ "id" : <PRODUCT_FEED_ID> }
```

Once you have created the feed (with or without schedule), you can do a one time upload of your feed using the `PRODUCT_FEED_ID`:

```
curl \
-F "url=http://www.example.com/sample_feed.xml" \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/<PRODUCT_FEED_ID>/uploads
```

For scheduled uploads, specify a schedule when you create the feed. For non scheduled uploads, don't specify a schedule.

```html
curl -X POST \
  -F 'name="Test Feed"' \
  -F 'schedule={
       "interval": "DAILY",
       "url": "http://www.example.com/sample_feed.tsv",
       "hour": "22"
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PRODUCT_CATALOG_ID>/product_feeds
```

In either case, the response is:

```json
{ "id" : <PRODUCT_FEED_ID> }
```

Once you have created the feed (with or without schedule), you can do a one time upload of your feed using the `PRODUCT_FEED_ID`:

```bash
curl \
-F "url=http://www.example.com/sample_feed.xml" \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/<PRODUCT_FEED_ID>/uploads
```

## Filter destination catalog to destination sets {#create-destination-set}

A destination set is a subset of your catalog. To setup destination ads, you need a destination set. Therefore, you have to create at least one.

Destination sets are defined by filters that are applied to the destination catalog. For example, you can create a destination set with all destinations that had a large price drop. Do note you can also create a destination set without any filters. When you create a destination set without filters, the destination set will contain all destinations in your catalog.

```html
curl \
  -F 'name=Test Destination Set' \
  -F 'filter={"price_change":{"lt":-20}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PRODUCT_CATALOG_ID>/product_sets
```

The `filter` parameter is made up of the following operators and data:

| Operators | Filter Type |
| --- | --- |
| `i_contains` | Contains substring. Operator is case-insensitive. |
| `i_not_contains` | Does not contain substring. Operator is case-insensitive. |
| `contains` | Contains substring. Operator is case-insensitive. |
| `not_contains` | Does not contain substring. Operator is case-insensitive. |
| `eq` | Equal to. Operator is case-insensitive. |
| `neq` | Not equal to. Operator is case-insensitive. |
| `lt` | Less than. For numeric fields only. |
| `lte` | Less than or equal to. For numeric fields only. |
| `gt` | Greater than. For numeric fields only. |
| `gte` | Greater than or equal to. For numeric fields only. |

| Data | The data being filtered |
| --- | --- |
| `country` | Country of the destination. |
| `price` | Price for this destination. The price is in cents. |
| `currency` | Currency. |
| `price_change` | Price drop or increase. |
| `city` | City of the destination. |
| `description` | Description for this destination. |
| `name` | Name for this destination. |
| `destination_set_id` | Your unique identifier for the destination within the catalog. |

## Associate the Catalog to Your Event Sources {#event-sources}

To map the data from your event sources (your pixels and app events) to your catalog, every catalog must be associated with these event sources:

1. Go to your [business manager's catalog page](https://business.facebook.com/settings/product-catalogs/) and click **Associate Sources**.
2. Select the app and pixel that are receiving the travel events. Alternatively, you can use the API.

```html
curl \
  -F 'external_event_sources=["<PIXEL_ID>","<APP_ID>"]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PRODUCT_CATALOG_ID>/external_event_sources
```

When making the API call, specify the following parameters:

| Parameter Name & Type | Description |
| --- | --- |
| `external_event_sources`<br><br>type: `int[]` | A list of Pixel and App IDs to associate with the catalog. |

