<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/catalog | Saved: 2026-09-19 -->

# Hotel ads - Catalogs and feed



To promote your hotel inventory on Facebook, you have to share information about your hotels with Facebook. You do this by creating a hotel catalog and then filling it with hotels. There are two ways you can fill your catalog and update it:

* [Upload CSV or XML files for `hotel feeds` with your hotel inventory](#upload-feed)
* [Create and manage hotels directly in API](#hotel-api)

You can create and manage your hotel catalogs in your [Commerce Manager](https://www.facebook.com/products).

To use the API to manage your catalog:

1. [Create a hotel catalog](#create-catalog)
2. [Create product sets out of your hotel catalog](#product-set)
3. [Associate the catalog to your event sources](#event-sources)

## Hotel feeds: upload your hotels to Facebook {#upload-feed}

A hotel feed is a file with your hotel inventory. Every line or item in the file represents a single hotel. You can use one or more hotel feeds, as long as all feeds together contain your full hotel inventory.

### Supported hotel feed formats

#### CSV
[CSV sample](https://lookaside.facebook.com/developers/resources/?id=hotel_feed_flat_example.csv) | [TSV sample (flattened)](https://lookaside.facebook.com/developers/resources/?id=dat_hotel_flattened_feed.tsv) | [TSV sample (JSON style)](https://lookaside.facebook.com/developers/resources/?id=dat_hotel_feed.tsv)

* The first row must list the chosen field names in the order the values are given. Subsequent rows then supply the corresponding values for each hotel.
* Fields containing whitespace or commas should be enclosed in `"`double quotes`"`.
* Nested or multi-value fields, such as `address`, `neighborhood` or `image`, can be represented using JSON-encoded values or by a set of "flattened" plain-text columns labeled using JSON-path syntax, such as `address.city`, `neighborhood[0]`, `image[0].url`, `image[0].tag[0]`, `image[0].tag[1]`. Both conventions can be used interchangeably in the same file.

#### XML
[XML sample](https://lookaside.facebook.com/developers/resources/?id=dat_hotel_feed.xml)

* A root `<listings>` XML node encloses a set of `<listing>` nodes, each of which represents a hotel.
* The file must begin with a valid `<?xml` declaration tag.

The feed parser automatically detects `UTF8`, `UTF16`, or `UTF32` text encodings, and defaults to `LATIN1` if it encounters an unexpected byte sequences. You can provide text in field values in any language; **however, field names must be given exactly as below, in English.**

### Supported fields — hotel ads {#supported-fields-hotel}

The following supported fields are designed for items you add to your product catalog.

For localized catalogs, see [supported fields for hotel ads](https://developers.facebook.com/documentation/ads-commerce/catalog/reference#loc-cat-hotels).

| Field and Type | Description |
| --- | --- |
| `hotel_id`<br><br>type: string | **Required**.<br><br>Max length: 100<br><br>Your unique identifier for the hotel within the catalog. The `hotel_id` is matched with any `content_ids` provided in your `hotel` app and pixel events. **Tip**: To improve performance, avoid using a space for this unique identifier field. Don't use duplicate IDs.<br><br>Example: `FB_hotel_1234` |
| `room_id`<br><br>type: string | **Required if adding hotel room information**.<br><br>Enter a unique ID for the hotel room type. Max characters: 100 **Example**: `FB_hotel_room_1234` |
| `name`<br><br>type: string | **Required**.<br><br>Most common name of the hotel.<br><br>Example: `Facebook Hotel` |
| `description`<br><br>type: string | **Required**.<br><br>Max size: 5000<br><br>Brief description of the hotel.<br><br>Example: `Only 30 minutes away from San Francisco.` |
| `checkin_date`<br><br>type: string | **Required if adding hotel room information**.<br><br>Check-in date for the hotel stay. You can add up to 180 days from the date the feed is uploaded. Uses [ISO-8601](https://en.wikipedia.org/wiki/ISO_8601) standard (`YYYY-MM-DD`).<br><br>Example: `2017-08-01` |
| `length_of_stay`<br><br>type: string | **Required if adding hotel room information**.<br><br>Number of nights for the hotel stay.<br><br>Example: `7` |
| `base_price`<br><br>type: string | **Required if adding hotel room information**.<br><br>Base price of the hotel room per night. Make sure to add the currency type to the price (for example, USD for U.S. dollars). Format price as the cost, followed by the [ISO currency code](https://en.wikipedia.org/wiki/ISO_4217), with a space between cost and currency.<br><br>Example: `199.00 EUR` |
| `price`<br><br>type: string | **Required if adding hotel room information**.<br><br>Total price of the hotel stay, based on `checkin_date` and `length_of_stay`. Format price as the cost, followed by the [ISO currency code](https://en.wikipedia.org/wiki/ISO_4217), with a space between cost and currency.<br><br>Example: `1393.00 USD` |
| `tax`<br><br>type: string | **Required if adding hotel room information**.<br><br>Applicable tax rate for the price. Format price as the cost, followed by the [ISO currency code](https://en.wikipedia.org/wiki/ISO_4217), with a space between cost and currency.<br><br>Example: `14.00 USD` |
| `fees`<br><br>type: string | **Required if adding hotel room information**.<br><br>Applicable fees for the price. Format price as the cost, followed by the [ISO currency code](https://en.wikipedia.org/wiki/ISO_4217), with a space between cost and currency.<br><br>Example: `253.00 USD` |
| `url`<br><br>type: string | **Required**.<br><br>Link to the external site where you can book a hotel room. You can also specify a URL on [ad level](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-travel/ads-management#creative) using `template_url_spec`. URLs on the ad level take precedence over URLs in the feed.<br><br>Example: `https://www.facebook.com/hotel` |
| `image[0].url`<br><br>type: object | See [Image Object Parameters](#image-object). |
| `image[0].tag`<br><br>type: object | See [Image Object Parameters](#image-object). |
| `brand`<br><br>type: string | **Optional**.<br><br>Brand name of the hotel chain.<br><br>Example: `Hilton` |
| `address`<br><br>type: object | See [Address Object Parameters](#address-object). |
| `neighborhood[0]`<br><br>type: string | **Required**.<br><br>Max neighborhoods allowed: 20<br><br>Neighborhood where the hotel is located. If there's more than one neighborhood, add additional columns for each one and use JSON-path syntax in each column name to indicate the number of neighborhoods.<br><br>Example: `Belle Haven` |
| `latitude`<br><br>type: float | **Required**.<br><br>Latitude of the hotel.<br><br>Example: `37.484100` |
| `longitude`<br><br>type: float | **Required**.<br><br>Longitude of the hotel.<br><br>Example: `-122.148252` |
| `sale_price`<br><br>type: string | **Optional**.<br><br>Sale price per night of hotel stay, based on `checkin_date` and `length_of_stay`. Use this when you want to advertise discounts off the regular price of the hotel. Make sure to add the currency type to the price (for example, USD for U.S. dollars). Make sure the `sale_price` of a hotel is lower than its `base_price`. Format price as the cost, followed by the [ISO currency code](https://en.wikipedia.org/wiki/ISO_4217), with a space between cost and currency.<br><br>Example: `149.00 USD` |
| `guest_rating`<br><br>type: object | See [Guest Rating Object Parameters](#guest_ratings-object). |
| `star_rating`<br><br>type: float | **Optional**.<br><br>Standardized hotel ratings. Only accepts whole numbers and halves.<br><br>Example: `5.0` or `3.5` |
| `loyalty_program`<br><br>type: string | **Optional**.<br><br>Loyalty program you use to gain points for staying at the hotel.<br><br>Example: `Premium program` |
| `margin_level`<br><br>type: integer | **Optional**.<br><br>Indicator of the profitability of the hotel; value from 1 to 10.<br><br>Example: `9` |
| `phone`<br><br>type: string | **Optional**.<br><br>Primary phone number for the hotel.<br><br>Example: `+61 296027455` |
| `applink`<br><br>type: object | **Optional**.<br><br>Deep link straight to the hotel details page in your mobile app using [App Links](https://developers.facebook.com/docs/applinks). You can specify deep links in order of precedence, highest to lowest:<br><br>1. On [ad level](https://developers.facebook.com/docs/marketing-api/dynamic-ads-for-travel/ads-management#creative) using `template_url_spec`<br>2. Here in the feed using an **Applink Object**<br>3. By adding [App Link meta tags](https://developers.facebook.com/docs/applinks) to your website.<br><br>Learn more about [product deep links](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links). |
| `priority`<br><br>type: integer | **Optional**.<br><br>An indicator of the priority of the hotel; value from 0 (lowest priority) to 5 (highest priority). Example: `5` |
| `category`<br><br>type: string | **Optional**.<br><br>The type of property. The category can be any type of internal description desired. Example: `Resort`, `Day Room` |
| `number_of_rooms`<br><br>type: integer | **Optional**.<br><br>Total number of rooms/units in this hotel listing.<br><br>Example: `150` |
| `status`<br><br>Type: string | Controls whether an item is active or archived in your catalog. Only active items can be seen by people in your ads, shops, or any other channels. Supported values: `active`, `archived`. Items are active by default. Learn more about [archiving items](https://www.facebook.com/business/help/543317109402043?id=725943027795860).<br><br>Example: `active`<br><br>**Note**: Some partner platforms such as Shopify may sync items to your catalog with a status called **staging**, which behaves the same as `archived`.<br><br>**Warning:** This field was previously called `visibility`. The old field name is still supported, but use the new name. |
| `custom_label_0`  <br>`custom_label_1`  <br>`custom_label_2`  <br>`custom_label_3`  <br>`custom_label_4`<br><br>Type: string | Max character limit: 100<br><br>Up to five custom fields for any additional information you want to filter items by when you create sets. For example, you could use a custom field to indicate all rooms that are part of a summer sale, and then filter those items into a set. This field supports any text value, including numbers.<br><br>Example: `Summer Sale`<br><br>**Note:** This field is supported by supplementary feeds. |
| `custom_number_0`  <br>`custom_number_1`  <br>`custom_number_2`  <br>`custom_number_3`  <br>`custom_number_4`<br><br>Type: int | Up to five custom fields for any additional number-related information you want to filter items by when you create sets. This field allows you to filter by number ranges (**is greater than** and **is less than**) when you create a set. For example, you could use this field to indicate the year a hotel was opened, and then filter a certain year range into a set.<br><br>This field supports whole numbers between 0 and 4294967295. It doesn't support negative numbers, decimal numbers or commas, such as -2, 5.5, or 10,000.<br><br>Example: `2022` |
| `internal_label`<br><br>Type: string | Add internal labels to help filter items when you create [product sets](https://www.facebook.com/business/help/620275848114281?id=725943027795860). For example, you could add a "summer" label to all items that are part of a summer promotion and then filter those items into a set. Labels are only visible to you<br><br>Enclose each label in single quotes (') and separate multiple labels with commas (,). Don't include white spaces at the beginning or end of a label. Character limit: Up to 5,000 labels per product and 110 characters per label.  <br><br>Example (TSV, XLSX, Google Sheets): ['summer','trending']<br><br>Example (CSV): "['summer','trending']"<br><br>**Note**: If you're currently using custom labels (`custom_label_0` to `custom_label_4`) for filtering product sets, switching to internal labels (`internal_label`) instead is recommended. Unlike custom labels, you can add or update internal labels as often as needed without sending items through policy review each time, which can impact ad delivery.<br><br>**Warning:** This field was previously called `product_tags`. The old field name is still supported, but use the new name. |

#### Image object parameters {#image-object}

| Field Name and Type | Description |
| --- | --- |
| `url`<br><br>type: string | **Required**.<br><br>Max items: 20.<br><br>URL link to the image of the item that will appear in your ads. Follow these image specifications:<br><br>* All images must be in JPG, GIF, or PNG format.<br><br>* For carousel ads and collection ads: Images display in square (1:1) format. The minimum image size is 500 x 500 px. Use 1024 x 1024 px for best quality.<br><br>* For single image ads: Images display at a 1.91:1 aspect ratio. The minimum image size is 500 x 500 px. Use 1200 x 628 px for best quality.<br><br>* If you have more than one image, add additional columns for each one and use JSON-path syntax in each column name to indicate the number of images.<br><br>Example: `image[0].url; image[1].url`<br><br>Example: `https://www.facebook.com/facebook_hotel.jpg` |
| `tag`<br><br>type: string | **Optional**.<br><br>Tag appended to the image that shows what's in the image. There can be multiple tags associated with an image.<br><br>Examples: `Fitness Center`, `Swimming Pool`, `suite`<br><br>`INSTAGRAM_STANDARD_PREFERRED` - Allows advertisers to tag a specific image in their feed as the default image to use for Instagram. This tag is case-sensitive. |

#### Address Object Parameters {#address-object}
**Note:** Nested or multi-value fields, such as `address` can be represented using JSON-encoded values or by a set of "flattened" plain-text columns labeled using JSON-path syntax, such as `address.region`. Both conventions can be used interchangeably in the same file.

| Field Name and Type | Description |
| --- | --- |
| `addr1` (`address.addr1`)<br><br>type: object | **Required**.<br><br>Primary street address of hotel.<br><br>Example: `1600 Pennsylvania Avenue` |
| `address.addr2`<br><br>type: object | **Optional**.<br><br>The secondary street address of the hotel.<br><br>Example: `Apartment 1` |
| `address.addr3`<br><br>type: object | **Optional**.<br><br>The tertiary street address of the hotel.<br><br>Example: `Downstairs` |
| `address.city_id` (`city_id`)<br><br>type: string | **Optional**.<br><br>Value to use in deep link URL, `template_url`, in ad creative.<br><br>Example: `12345` |
| `address.city` (`city`)<br><br>type: string | **Required**.<br><br>City where the hotel is located.<br><br>Example: `New York` |
| `address.region` (`region`)<br><br>type: string | **Required**.<br><br>State, county, province, where the hotel is located.<br><br>Example: `California` |
| `address.country` (`country`)<br><br>type: string | **Required**.<br><br>Country where the hotel is located.<br><br>Example: `United States` |
| `address.postal_code` (`postal_code`)<br><br>type: string | **Required for countries with a postal code system**.<br><br>Postal or zip code of the hotel.<br><br>Examples: `94125`, `NW1 3FG` |

#### Guest rating object parameters {#guest_ratings-object}

**Note:** Nested or multi-value fields, such as `guest_rating` can be represented using JSON-encoded values or by a set of "flattened" plain-text columns labeled using JSON-path syntax, such as `guest_rating[0].number_of_reviewers` or `guest_rating[0].max_score`.

| Field Name and Type | Description |
| --- | --- |
| `guest_rating[0].score` (`score`)<br><br>type: object | **Optional**.<br><br>Total number of people who have reviewed your hotel. If specified, you must also provide `score`, `max_score`, `number_of_reviewers` and `rating_system`.<br><br>Example: `9.0/10` |
| `guest_rating[0].number_of_reviewers` (`number_of_reviewers`)<br>type: int | **Optional**.<br><br>Total number of people who have rated this hotel.<br><br>Example: `5287` |
| `guest_rating[0].rating_system` (`rating_system`)<br><br>type: string | **Optional**.<br><br>System you use for guest reviews.<br><br>Examples: `Expedia`, `TripAdvisor` |
| `guest_rating[0].max_score`<br><br>type: int | **Required**.<br><br>Max value for the hotel rating score. Must be greater than or equal to 0, and less than or equal to 100.<br><br>Example: `10` |

## Hotel API: create and manage hotels directly {#hotel-api}

You can use the Hotel API to directly add, edit, and remove hotels in your catalog. Use the [Hotel API Reference](https://developers.facebook.com/docs/marketing-api/reference/hotel) for more information on how to manage hotels using the API.

**The following sections are only relevant to manage your catalogs using this API.**

### Create a hotel catalog using the API {#create-catalog}

A hotel catalog is a container for your hotel inventory. To use the catalog API, make sure you have the appropriate [Marketing API Access Level](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization#limits) and that you have accepted the [Terms of Service](https://business.facebook.com/legal/product_catalog_terms/) by creating your first catalog through [Meta Business Suite](https://business.facebook.com).

To create a hotel catalog for hotel ads, set `vertical` to `hotels`:

```
curl -X POST \
  -F 'name="Test Hotel Catalog"' \
  -F 'vertical="hotels"' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v10.0/BUSINESS_ID/owned_product_catalogs
```

## Upload your hotel feeds via the API {#feed-upload}

Once you've created the catalog, you must upload your hotel feed(s) to Facebook. Use the API to create a feed object for every feed you want to upload. Scheduled and direct uploads are supported.

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

## Filter hotel catalog to hotel sets {#product-set}

A hotel set is a subset of your catalog. To set up hotel ads, you need a hotel set. Therefore, you need to create at least one.

Hotel sets are defined by filters that are applied to the hotel catalog. For example, you can create a hotel set with all hotels with a `star_rating` greater than 3. **Note**: You can also create a hotel set without any filters. When you create a set without filters, the hotel set will contain all hotels in your catalog.

To create a hotel set containing all the hotels that contain 'sample brand' mentioned in the `brand` field:

```html
curl -X POST \
  -F 'name="Test Hotel Set"' \
  -F 'filter={
       "brand": {
         "i_contains": "sample brand"
       }
     }' \
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

| Data | The data being filtered. |
| --- | --- |
| `hotel_id` | Your unique identifier for the hotel within the catalog. |
| `brand` | Brand of the hotel chain. |
| `base_price_amount` | Base price per night for this hotel. The price is in cents (4999 denotes $49.99). |
| `sale_price_amount` | Sale price per night for this hotel. The price is in cents (4999 denotes $49.99). |
| `currency` | Currency |
| `city` | City where hotel is located. |
| `country` | Country of the hotel. |
| `name` | The most common name of the hotel. |
| `star_rating` | Hotel star rating. The valid values are between 1 to 5 and should be a multiple of 0.5. |

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

