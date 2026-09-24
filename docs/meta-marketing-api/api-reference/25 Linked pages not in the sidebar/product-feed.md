<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Product Feed

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

 You must meet the following requirements to use Product Feed.

*  Your business must be listed in Business Manager
*  You must be an employee of your business, or be an employee of an Agency which is assigned to this business

## Reading

A feed is a set of items uploaded or fetched from a source at once. You can have a single feed to represent all of the items in your catalog, or you can have multiple feeds with each feed representing a single country or single division’s products

### Feed Format

 The Product Feed consists of a series of items in either a Tab Separated file or XML. In XML, these should exist as an array of [`<item>`'s](https://developers.facebook.com/docs/marketing-api/reference/product-item). In a tab separated file, the header column is required.

#### Parameters

 This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `id`<br>*numeric string* | ID number of the feed <br>default |
| `country`<br>*string* | An ISO 3166-1 Alpha 2 country code |
| `created_time`<br>*datetime* | The creation time of the feed |
| `default_currency`<br>*string* | Your default currency for items in a feed. If no currency is specified for items in the feed file, this value will be used |
| `deletion_enabled`<br>*bool* | This allows items to be deleted if a feed is updated and the items are not included in the new feed file |
| `delimiter`<br>*enum {AUTODETECT, BAR, COMMA, TAB, TILDE, SEMICOLON}* | The delimiter used in feed file |
| `encoding`<br>*enum* | The character encoding used by the provided feed |
| `file_name`<br>*string* | The file name of a feed. This will be overridden by `name` if `name` is present <br>default |
| `ingestion_source_type`<br>*enum {primary_feed, supplementary_feed}* | Indicates the type of feed. <br><br>`PRIMARY_FEED`: Use this to add and remove products from the data feed. This is the most common use-case. **Note**: `PRIMARY_FEED` is the default value. <br><br>`SUPPLEMENTARY_FEED`: Use this to overwrite data in existing primary feeds. When using this field, the `primary_feeds` field must also be provided. [Learn more about supplementary feeds](https://developers.facebook.com/documentation/ads-commerce/commerce-platform/catalog/supplementary-feeds). |
| `item_sub_type`<br>*enum* | The sub type of items to be uploaded by this feed |
| `latest_upload`<br>*[ProductFeedUpload](https://developers.facebook.com/docs/marketing-api/reference/product-feed-upload)* | The latest upload session of a feed |
| `migrated_from_feed_id`<br>*numeric string* | The previous product feed id where the catalog items migrated from |
| `name`<br>*string* | The name of a feed <br>default |
| `override_type`<br>*enum* | If it is a secondary feed, this is the type of the override (country or language) |
| `primary_feeds`<br>*list<string>* | Used in conjunction with `ingestion_source_type=supplementary_feed`. List of primary feed IDs to which the supplementary feed should be linked. Must provide at least 1 linked primary feed. See [how to create supplementary feeds](https://developers.facebook.com/documentation/ads-commerce/commerce-platform/catalog/supplementary-feeds). |
| `product_count`<br>*int32* | The total products in a product feed |
| `quoted_fields_mode`<br>*enum {AUTODETECT, ON, OFF}* | This allows tabs and new lines within fields |
| `schedule`<br>*[ProductFeedSchedule](https://developers.facebook.com/docs/marketing-api/reference/product-feed-schedule)* | The configuration for fetching the full feed in a recurrent manner. The uploads as a result of this schedule would replace the entire feed. Items missing in consequent upload feed file would be deleted |
| `update_schedule`<br>*[ProductFeedSchedule](https://developers.facebook.com/docs/marketing-api/reference/product-feed-schedule)* | The configuration for fetching updates to a feed in a recurrent manner. The uploads as a result of this schedule would only update the items in the feed or create new ones with the information in the file. No items would be deleted. This is useful for sending `price` and `availability` updates for selected items in the feed |

#### Edges

| Edge | Description |
| --- | --- |
| [`automotive_models`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/automotive_models)<br>*Edge<AutomotiveModel>* | Automotive models in a feed |
| [`destinations`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/destinations)<br>*Edge<Destination>* | Destinations in a feed |
| [`flights`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/flights)<br>*Edge<Flight>* | Flights in a feed |
| [`home_listings`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/home_listings)<br>*Edge<HomeListing>* | Home listings in a feed |
| [`hotels`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/hotels)<br>*Edge<Hotel>* | Hotels in a feed |
| [`products`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/products)<br>*Edge<ProductItem>* | Products in a feed |
| [`rules`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/rules)<br>*Edge<ProductFeedRule>* | rules |
| [`uploads`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/uploads)<br>*Edge<ProductFeedUpload>* | Concrete upload attempts |
| [`vehicle_offers`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/vehicle_offers)<br>*Edge<VehicleOffer>* | Vehicle offers in a feed |
| [`vehicles`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed/vehicles)<br>*Edge<Vehicle>* | Vehicles in a feed |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 200 | Permissions error |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

### /{product_catalog_id}/product_feeds

 You can make a POST request to *product_feeds* edge from the following paths:

* [/{product_catalog_id}/product_feeds](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_feeds)

 When posting to this edge, a [ProductFeed](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed) will be created.

#### Example

Select language

HTTPPHP SDKJavaScript SDKAndroid SDKiOS SDKcURL

**

---

```
POST /v25.0/{product-catalog-id}/product_feeds HTTP/1.1
Host: graph.facebook.com

name=Test+Feed&schedule=%7B%22interval%22%3A%22DAILY%22%2C%22url%22%3A%22http%3A%2F%2Fwww.example.com%2Fsample_feed.tsv%22%2C%22hour%22%3A%2222%22%7D

```

 Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=POST&path=%7Bproduct-catalog-id%7D%2Fproduct_feeds%3Fname%3DTest%2BFeed%26schedule%3D%257B%2522interval%2522%253A%2522DAILY%2522%252C%2522url%2522%253A%2522http%253A%252F%252Fwww.example.com%252Fsample_feed.tsv%2522%252C%2522hour%2522%253A%252222%2522%257D&version=v25.0)

 If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `country`<br>*string* | <br>**Default value: **`"US"` Two letter country code where the products can be sold |
| `default_currency`<br>*ISO 4217 Currency Code* | <br>**Default value: **`USD` The default currency used by provided feed if the currency is not specified in the feed file |
| `deletion_enabled`<br>*boolean* | <br>**Default value: **`true` Default value: `false` (to be changed to `true` .from API v2.5)<br>When `true`, this will remove products from a catalog that are no longer present in a feed. When `false`, uploading a product feed is additive and products will remain in the catalog even if they are removed from a feed. Once enabled, we do not allow this field to be disabled. |
| `delimiter`<br>*enum {AUTODETECT, BAR, COMMA, TAB, TILDE, SEMICOLON}* | <br>**Default value: **`AUTODETECT` Product feed delimiter |
| `encoding`<br>*enum {AUTODETECT, LATIN1, UTF8, UTF16LE, UTF16BE, UTF32LE, UTF32BE}* | <br>**Default value: **`AUTODETECT` The character encoding used by provided feed |
| `feed_type`<br>*enum {ACTIVITY, APP_AND_SOFTWARE, ARTICLE_AND_PUBLICATION, AUTOMOTIVE_MODEL, COLLECTION, DESTINATION, FLIGHT, HOME_LISTING, HOTEL, HOTEL_ROOM, LOCAL_INVENTORY, MEDIA_TITLE, OFFER, PRODUCT_RATINGS_AND_REVIEWS, PRODUCTS, SERVICE, TRANSACTABLE_ITEMS, VEHICLE_OFFER, VEHICLES}* | Type of the feed. Decides type of catalog item this feed will create |
| `file_name`<br>*string* | The name of the product feed. .tsv, .xml or compressed files (zip, gzip and bz2) are supported |
| `ingestion_source_type`<br>*enum {PRIMARY_FEED, SUPPLEMENTARY_FEED}* | ingestion_source_type to decide type of feed i.e. primary or supplementary |
| `item_sub_type`<br>*enum {APPLIANCES, BABY_FEEDING, BABY_TRANSPORT, BEAUTY, BEDDING, CAMERAS, CELL_PHONES_AND_SMART_WATCHES, CLEANING_SUPPLIES, CLOTHING, CLOTHING_ACCESSORIES, COMPUTERS_AND_TABLETS, DIAPERING_AND_POTTY_TRAINING, ELECTRONICS_ACCESSORIES, FURNITURE, HEALTH, HOME_GOODS, JEWELRY, NURSERY, PRINTERS_AND_SCANNERS, PROJECTORS, SHOES_AND_FOOTWEAR, SOFTWARE, TOYS, TVS_AND_MONITORS, VIDEO_GAME_CONSOLES_AND_VIDEO_GAMES, WATCHES}* | The sub type of items to be uploaded by this feed |
| `migrated_from_feed_id`<br>*numeric string* | Used to split an original feed into multiple new feeds, `migrated_from_feed_id` denotes the original feed's ID. Setting this field ensures that items from an original field can be migrated to a new one, without the need of deletion. <br> This field is generally used when splitting a large feed into multiple smaller feeds. <br> Example: 1. You have a large feed called Feed A and want to split it. 2. You create a new feed called Feed B and specify Feed A's ID under `migrated_from_feed_id`. 3. You upload Feed B's catalog information, including the products you want to add to Feed B. 4. The items from feed A have been moved to feed B. Going forward, you do not need to specify those items in Feed A and they can be removed from feed A. **Guidance on splitting feeds that exceed file size or item limit** If your data feed contains more items or exceeds the file size, split it into multiple feeds and upload them separately. You can upload as many data feeds as you want, but they must all contain different items. You can split the data feed into smaller feeds using `migrated_from_feed_id`. Steps: 1. Create a new data feed file with items that need to be transferred from the old feed. 2. Create a new data feed using `migrated_from_feed_id`. 3. The ownership of items will be transferred from the old feed to the new feed when the first session completes on the new feed file. 4. Subsequently, the items can be removed from the old feed. And the items must be managed by the new feed. Example of how to create a new feed using `migrated_from_feed_id`: ``` curl -X POST \ -F 'name="New Feed"' \ -F 'schedule={ "interval": "DAILY", "url": "http://www.example.com/new_feed_file.csv", "hour": "22" }' \ -F 'migrated_from_feed_id=<OLD_FEED_ID>' \ -F 'access_token=<ACCESS_TOKEN>' \ https://graph.facebook.com/v22.0/{product-catalog-id}/product_feeds ``` 5. Additionally, ensure that once the data feeds are split into a new, smaller feed, all item updates come from the respective new feed. |
| `name`<br>*UTF-8 encoded string* | User specified name for the feed |
| `override_type`<br>*enum {LANGUAGE, COUNTRY, VERSION, CATALOG_SEGMENT_CUSTOMIZE_DEFAULT, LANGUAGE_AND_COUNTRY, BATCH_API_LANGUAGE_OR_COUNTRY, SMART_PIXEL_LANGUAGE_OR_COUNTRY, LOCAL}* | If this is a secondary feed, this specifies the override type of the feed |
| `override_value`<br>*string* | Override value of the feed dependent on the override type (country or language). |
| `primary_feed_ids`<br>*array<numeric string>* | primary_feed_ids to which a supplementary feed should be linked |
| `quoted_fields_mode`<br>*enum{autodetect, on, off}* | <br>**Default value: **`autodetect` Whether or not there will be quotes around each field, only for TSV feeds. If this field is provided, we use it instead of the parameter quoted_fields |
| `rules`<br>*list<JSON-encoded string>* | A list of rules applied to feed uploads |
| `schedule`<br>*JSON-encoded string* | A JSON-encoded string representing a recurrent schedule for fetching the feed. Default timezone is America/Los_Angeles. Learn more about [feed schedules](https://developers.facebook.com/docs/marketing-api/reference/product-feed-schedule) |
| `selected_override_fields`<br>*array<string>* | Selected Override Fields of the feed, written as a list of fields which should be processed from the feed file. From whiltelisted_properties |
| `update_schedule`<br>*JSON-encoded string* | The configuration for fetching updates to a feed in a recurrent manner. The uploads would only update the items in the feed or create new ones. No items would be deleted. This is useful for sending `price` and `availability` updates for selected items in the feed. Learn more about fields in a [feed schedule](https://developers.facebook.com/docs/marketing-api/reference/product-feed-schedule) |
| `use_case`<br>*enum {CREATOR_ASSET}* | Allow advertiser to pass creator_asset as the new use_case of the feed |

#### Return Type

 This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```

Struct  {
id: numeric string,
errors:  List  [ Struct  {
error_subcode: string,
invalid_attribute: string,
error_message: string,
}],
}

```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |

---

## Updating

### /{product_feed_id}

 You can update a [ProductFeed](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed) by making a POST request to [/{product_feed_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed).

#### Parameters

| Parameter | Description |
| --- | --- |
| `default_currency`<br>*ISO 4217 Currency Code* | The default currency to be used for catalog items without a currency explicitly specified in their price data. |
| `deletion_enabled`<br>*boolean* | Whether the feed is allowed to delete products. |
| `delimiter`<br>*enum {AUTODETECT, BAR, COMMA, TAB, TILDE, SEMICOLON}* | Product feed delimiter |
| `encoding`<br>*enum {AUTODETECT, LATIN1, UTF8, UTF16LE, UTF16BE, UTF32LE, UTF32BE}* | The character encoding used by provided feed |
| `migrated_from_feed_id`<br>*numeric string* | The previous product feed id where the catalog items migrated from |
| `name`<br>*UTF-8 encoded string* | User specified name for the feed |
| `quoted_fields_mode`<br>*enum{autodetect, on, off}* | Whether or not there will be quotes around each field, only for TSV feeds. If this field is provided, we use it instead of the parameter quoted_fields. |
| `schedule`<br>*JSON-encoded string* | A JSON-encoded string representing a recurrent schedule for fetching the feed. Default timezone is America/Los_Angeles. Learn more about [feed schedules](https://developers.facebook.com/docs/marketing-api/reference/product-feed-schedule) |
| `update_schedule`<br>*JSON-encoded string* | The configuration for fetching updates to a feed in a recurrent manner. The uploads would only update the items in the feed or create new ones. No items would be deleted. This is useful for sending `price` and `availability` updates for selected items in the feed. Learn more about fields in a [feed schedule](https://developers.facebook.com/docs/marketing-api/reference/product-feed-schedule) |

#### Return Type

 This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```

Struct  {
success: bool,
}

```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |

---

## Deleting

 Deleting a product feed effectively disables all ads using products that come from this feed.

 You can create a new feed with the same product IDs to re-enable those ads.

### Examples

```
curl -X DELETE \
-d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/<PRODUCT_FEED_ID>

```

### /{product_feed_id}

 You can delete a [ProductFeed](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed) by making a DELETE request to [/{product_feed_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed).

#### Parameters

 This endpoint doesn't have any parameters.

#### Return Type

```

Struct  {
success: bool,
}

```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 3964 | You must be assigned as an admin of this product feed before you can delete it. |
| 100 | Invalid parameter |

---
