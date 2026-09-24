<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/items_batch | Saved: 2026-09-19 -->

# Product Catalog Items Batch



## Reading

You can't perform this operation on this endpoint.

## Creating

### /{product_catalog_id}/items_batch
You can make a POST request to *items_batch* edge from the following paths:

- [/{product_catalog_id}/items_batch](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/items_batch)

When posting to this edge, no Graph object will be created.

Use this endpoint to create, delete or update multiple items in a Catalog at a time.
The [sample API call](#sample-api-call) illustrates how this API works in practice.

### Limitations

- The `requests` parameter can contain up to 5000 items.  It is recommended that the request size be kept under 3000 records for optimal performance.

- The request payload size should not exceed 28 MB.

- For each catalog, you can make a number of calls per minute defined by the [Catalog Batch](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#catalog) business use case rate limit formula. If that's not sufficient, please contact us.

#### Parameters

| Parameter | Description |
| --- | --- |
| `allow_upsert`<br><br>*boolean* | **Default value: **`true`<br>Set this to true if you want to allow requests with method=UPDATE to create new items.<br><br><br>When set to false, update requests for items not existing in the catalog will not be completed.<br> |
| `item_sub_type`<br><br>*enum {APPLIANCES, BABY_FEEDING, BABY_TRANSPORT, BEAUTY, BEDDING, CAMERAS, CELL_PHONES_AND_SMART_WATCHES, CLEANING_SUPPLIES, CLOTHING, CLOTHING_ACCESSORIES, COMPUTERS_AND_TABLETS, DIAPERING_AND_POTTY_TRAINING, ELECTRONICS_ACCESSORIES, FURNITURE, HEALTH, HOME_GOODS, JEWELRY, NURSERY, PRINTERS_AND_SCANNERS, PROJECTORS, SHOES_AND_FOOTWEAR, SOFTWARE, TOYS, TVS_AND_MONITORS, VIDEO_GAME_CONSOLES_AND_VIDEO_GAMES, WATCHES}* | **Default value: **`"EMPTY"`<br>The sub vertical type of items in the request<br> |
| `item_type`<br><br>*string* | The type of items in the request. Needs to be one of the values listed [here](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/catalog-item-types). Note that the information specified in this field is NOT a [product category](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-categories) (a concept used for item_type=PRODUCT_ITEM).<br><br>**[required]**<br> |
| `requests`<br><br>*JSON object* | The string should be a JSON array with no more than 5000 records. It is recommended that the request size be kept under 3000 records for optimal performance. Each record should contain 2 fields:<br><br><br>• method: one of CREATE/UPDATE/DELETE<br>• data: a map containing catalog item field names and the corresponding values.<br><br>• When the method is CREATE, this object must contain all the required fields for the specified item_type.<br>• When the method is UPDATE, it can contain any fields.<br>• A request with method=DELETE is expected to contain only the fields that are necessary to identify an item ([see below](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/items_batch#deleting-catalog-items))<br>• Note: see [Supported Fields](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/items_batch#supported-fields) for details on what can be specified for a catalog item.<br><br><br><br>The [Sample Call](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/items_batch#sample-api-call) below demonstrates how the ‘request’ parameter can be passed.<br><br>**[required]**<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
handles:  List  [string],
validation_status:  List  [ Struct  {
errors:  List  [ Struct  {
message: string,
}],
retailer_id: string,
warnings:  List  [ Struct  {
message: string,
}],
}],
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 80014 | There have been too many calls for the batch uploads to this catalog account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#catalog. |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 190 | Invalid OAuth 2.0 Access Token |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

## Response Payload Specification

### For a Successful Call

| Field | Description |
| --- | --- |
| handles | An array of strings, containing either 0 or 1 value. An empty array means that nothing has been ingested. The handle returned here can be used to check the status of the submitted request via the [/check_batch_request_status](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/check_batch_request_status) API endpoint. |
| validation_status | An array of `ValidationStatus` objects (see below) |

A `ValidationStatus` object has the following fields:
| Field | Description |
| --- | --- |
| retailer_id | Row identifier from one of the records in the ‘requests’ parameter |
| errors | An array of `Error` objects (see below) |
| warnings | An array of `Error` objects (see below) |

An `Error` object has the following structure
| Field | Description |
| --- | --- |
| message | A human-readable string providing an explanation of what is the issue with provided product data. |

### For a Failed Call
Failed calls return the standard [Error Payload](https://developers.facebook.com/docs/graph-api/guides/error-handling).

## Supported Fields

| Fields that can be passed for items, depending on type |
| --- |
| item_type=PRODUCT_ITEM |
| ↳<br>\| Field \| Description \|<br>\| --- \| --- \|<br>\| `additional_image_link`<br><br>type: array< string > \| Optional.<br><br>A JSON-array containing up to 50 image URLs. \|<br>\| `additional_variant_attribute`<br><br>type: string \| Optional.<br><br>Additional attributes to distinguish the product in its variant group. A comma-separated list of attribute+value pairs where the attribute name and its value are separated by a colon symbol (‘:’)<br><br>Example: `"Scent:Fruity,Flavor:Apple"` \|<br>\| `age_group`<br><br>type: string \| Optional.<br><br>Group of people who are the same age or a similar age. Accepted values are `newborn`, `infant`, `toddler`, `kids`, `adult`. \|<br>\| `applink`<br><br>type: object< string > \| Optional.<br><br>Links to mobile apps. A JSON object with string keys and string values. The following keys are supported:<br><br>* ios_url<br>* ios_app_store_id<br>* ios_app_name<br>* iphone_url<br>* iphone_app_store_id<br>* iphone_app_name<br>* ipad_url<br>* ipad_app_store_id<br>* ipad_app_name<br>* android_url<br>* android_package<br>* android_class<br>* android_app_name<br>* windows_phone_url<br>* windows_phone_app_id<br>* windows_phone_app_name \|<br>\| `availability`<br><br>type: string \| Required.<br><br>Identifies availability status:<br><br>* `in stock` - Item ships immediately<br>* `out of stock` - No plan to restock<br>* `available for order` - Ships in 1–2 weeks<br>* `discontinued` \|<br>\| `brand`<br><br>type: string \| Required.<br><br>Brand of the item. \|<br>\| `color`<br><br>type: string \| Optional.<br><br>Max size: 100.<br><br>Item color. \|<br>\| `condition`<br><br>type: string \| Required.<br><br>Product condition: `new`, `refurbished`, or `used`. \|<br>\| * `custom_label_0`  <br>* `custom_label_1`<br>* `custom_label_2`<br>* `custom_label_3`<br>* `custom_label_4`<br><br>type: string \| Optional.<br><br>Max character limit: 100<br><br>Additional information about item. \|<br>\| * `custom_number_0`  <br>* `custom_number_1`<br>* `custom_number_2`<br>* `custom_number_3`<br>* `custom_number_4`<br><br>type: integer \| Optional.  <br><br>Up to five custom fields for any additional number-related information you want to filter items by when you create sets. This field allows you to filter by number ranges (is greater than and is less than) when you create a set. For example, you could use this field to indicate the year a hotel was opened, and then filter a certain year range into a set.<br><br>This field supports whole numbers between 0 and 4294967295. It doesn't support negative numbers, decimal numbers or commas, such as -2, 5.5 or 10,000.<br><br>Example: `2022` \|<br>\| `description`<br><br>type: string \| Required.<br><br>Max size: 5000.<br><br>Short text describing product. \|<br>\| `disabled_capabilities`<br><br>type: array< string > \| Optional.<br><br>List of capabilities to be disabled. Possible values are: `marketplace`, `b2c_marketplace`, `buy_on_facebook`, `cpas_parent_catalog`, `marketplace_shops`, `shops`, `daily_deals`, `ig_onsite_shopping`, `ig_product_tagging`, `c2c_marketplace`, `groups`, `profile`, `da`, `whatsapp`, `ldp`, `mini_shops`, `business_inbox_in_messenger`, `neighborhoods`, `test_capability`. \|<br>\| `fb_product_category`<br><br>type: string \| Optional.<br><br>Provide the most specific Facebook product category possible from this list: [Spreadsheet (.csv)](https://www.facebook.com/products/categories/en_US.csv) or [Plain text (.txt)](https://www.facebook.com/products/categories/en_US.txt). Enter either the category name (not case sensitive) or its ID number.<br><br>Examples:<br><br>* `Clothing & Accessories > Clothing > Women's Clothing > Tops & T-Shirts`<br>* `430`<br><br>Learn more about product categories by reading the [Business Help Center article](https://www.facebook.com/business/help/526764014610932).<br><br>Note: The category lists above are in US English. You can download other languages [here](https://www.facebook.com/business/help/526764014610932). \|<br>\| `gender`<br><br>type: string \| Optional.<br><br>Gender for sizing. Values include `male`, `female`, `unisex`. \|<br>\| `google_product_category`<br><br>type: string \| Optional.<br><br>Max size: 250.<br>Predefined values (string or category ID) from [Google's product taxonomy](https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt).<br><br>Examples:<br><br>* `Apparel & Accessories > Clothing > Dresses`<br>* `2271` \|<br>\| `gtin`<br><br>type: string \| Optional.<br><br>Max size: 70.<br><br>Global Trade Item Number (GTIN) can include UPC, EAN, JAN, and ISBN. \|<br>\| `expiration_date`<br><br>type: date \| Optional.<br><br>Product expiration. If the product has expired, it won't be shown on Facebook. This date should follow the ISO‑8601 (YYYY‑MM‑DD) format. \|<br>\| `id`<br><br>type: string \| Required.<br><br>Character limit: 100<br><br>A unique content ID for the item. Use the item's SKU if you can.<br>Each content ID must appear only once in your catalog. To run<br>dynamic ads this ID must exactly match the content ID for<br>the same item in your Facebook pixel code. \|<br>\| `image`<br><br>type: array< object > \| Required.<br><br>URLs and tags for images to be used in your ads or in shops.<br><br>A JSON array containing up to 21 records with the following fields:<br><br>* `url`: the URL string of the image<br>* `tag`: a JSON array of strings. Tags are optional and, if used, should describe what is in the image. \|<br>\| `image_link`<br><br>type: string \| Optional.<br><br>Not required if `image` is provided.<br><br>We recommend using `image` instead. When `image` is provided, `image_link` and `additional_image_link` are ignored.<br><br>Link to item image used in the ad. Provide proper image sizes.<br><br>For single-image Advantage+ catalog ads:<br><br>* Min image resolution requirement is 500px*500px.<br>* Min aspect ratio requirement is 4:5.<br>* Max aspect ratio requirement is 1:91:1. If the image is outside this aspect ratio, Facebook crops it to be closest to either the minimum aspect ratio or the maximum aspect ratio, depending on its original aspect ratio.<br><br>For carousel image, Advantage+ catalog ads: Min image resolution requirement is 500px*500px, and Facebook crops it to a 1:1 aspect ratio. \|<br>\| `importer_address`<br><br>type: JSON structure \| Optional.<br><br>If the country of origin is not India, provide the operational address of the importer. This field uses a JSON structure, which contains the following fields:<br><br>* `street1` - string, required. The first line of the street address<br>* `street2` - string, optional. The second line of the street address.<br>* `city` - string, required. The city name.<br>* `region` - string, optional. The region, state or province. (In the US this is to be used for US State)<br>* `postal_code` - string, optional (in the US this is to be used for Zip Code)<br>* `country` - required. Enter the ISO Country code (2-letter country code)<br><br>The overall address will be displayed to users in the following format: `street1`, `street2` (if present), `city`, `region` (if present) `postal_code` (if present), `country` (full name, localized for the user).<br><br>This example value:<br>`{ street1: "1 Hacker Way", street2: "Building 18", city: "Menlo Park", region: "CA", postal_code: "94025", country: "US" }`<br><br>will be rendered as "1 Hacker Way, Building 18, Menlo Park, CA 94025 United States of America" \|<br>\| `importer_name`<br><br>type: string \| Optional.<br><br>If the country of origin is not India, provide the legal entity name of the item's importer<br><br>Example value: `Jasper's Market Inc.` \|<br>\| `internal_label`<br><br>type: array< string > \| Optional.<br><br>Add internal labels to help filter items when you create product sets. For example, you could add a “summer” label to all items that are part of a summer promotion and then filter those items into a set. Labels are only visible to you<br><br>Character limit: Up to 5,000 labels per product and 110 characters per label.<br><br>Example `['summer','trending']`<br><br>Note: If you’re currently using custom labels (`custom_label_0` to `custom_label_4`) for filtering product sets, switching to internal labels (`internal_label`) instead is recommended. Unlike custom labels, you can add or update internal labels as often as needed without sending items through policy review each time, which can impact ad delivery.<br><br>**Note:** This field was previously called `product_tags`. While we still support the old field name, we recommend that you use the new name. \|<br>\| `mobile_link`<br><br>type: string \| Optional.<br><br>Link to a mobile-optimized page for the item on the merchant's website. \|<br>\| `quantity_to_sell_on_facebook`<br><br>type: integer \| Optional.<br><br>The quantity of this item you have to sell on Facebook and Instagram with checkout. Must be 1 or higher or the item won't be buyable.<br><br>**Note:** NOTE: The `quantity_to_sell_on_facebook` field is replacing the `inventory` field, which is being deprecated. While we will support the old field name in the near term, we recommend that you use the new name. \|<br>\| `item_group_id`<br><br>type: string \| Optional.<br><br>The advertiser-supplied ID of a product group; not the FBID. Accepts strings. Can be used by advertisers to group a variety of different objects (product items, vehicles, hotels, flights, and so on together. \|<br>\| `link`<br><br>type: string \| Required.<br><br>Link to merchant's site where someone can buy the item. \|<br>\| `material`<br><br>type: string \| Optional.<br><br>Character limit: 200.<br><br>The material the item is made from, such as cotton, denim or leather. \|<br>\| `mpn`<br><br>type: string \| Optional.<br><br>Unique manufacturer ID for product. \|<br>\| `ordering_index`<br><br>type: integer \| Optional.<br><br>Zero-based index used for ordering items within a group.<br><br>Example value: `0` \|<br>\| `origin_country`<br><br>type: ISO 3166-1 alpha-2 (2 letter country code) \| Optional.<br><br>The item's country of origin. Enter the two-letter ISO country code<br><br>Example value: `US` \|<br>\| `pattern`<br><br>type: string \| Optional.<br><br>Max size: 100.<br><br>Pattern or graphic print on a product. \|<br>\| `price`<br><br>type: string \| Required.<br><br>Price of the item. Format price as the cost, followed by the [3-digit ISO currency code](https://en.wikipedia.org/wiki/ISO_4217), with a space between cost and currency.<br><br>Example: `9.99 USD` \|<br>\| `product_type`<br><br>type: string \| Optional.<br><br>Max size: 750.<br><br>Retailer-defined category for item.<br><br>Example: `Home & Garden > Kitchen & Dining > Appliances > Refrigerators` \|<br>\| `rating_count`<br><br>type: integer \| Optional.<br><br>The number of ratings purchasers have provided for this product. Must be greater than 0. This should be used in conjunction with `user_rating`.<br><br>Example: `100` \|<br>\| `rich_text_description`<br><br>type: string \| Optional.<br><br>A description of the item containing rich text (HTML) formatting such as bullet points or multiple paragraphs. We recommend using rich text if the description is longer than 200 characters to help make it easier to read. If this field is provided, it will be displayed instead of the description field wherever possible, but you must still provide description as a backup option. Character limit: 9,999.<br><br>Supported HTML tags: *html*, *form*, *fieldset*, *div*, *span*<br><br>Header tags: *header*, *h1* .. *h6*<br><br>Table tags: *table*, *tbody*, *tfoot*, *thead*, *td*, *th*, *tr*<br><br>List tags: *ul*, *li*, *ol*, *dl*, *dd*, *dt*<br><br>Other formatting tags: *p*, *b*, *u*, *i*, *em*, *strong*, *title*, *small*, *br*, *div*, *sub*, *sup*, *pre*, *q*, *s*<br><br>Note: <script> and <style> tags aren't supported. If you include them, they'll be automatically removed.<br><br>Example: `<html><p>A comfortable royal blue women's T-shirt in organic cotton. Cap sleeves and relaxed fit. Perfect for warm summer days. Features graphic print of logo in white on upper left sleeve.</p> <ul> <li>100% organic cotton</li><li>Machine wash, tumble dry low</li> </ul> </html>` \|<br>\| `sale_price`<br><br>type: string \| Optional.<br><br>Discounted price if the item is on sale. Format price as the cost, followed by the [3-digit ISO currency code](https://en.wikipedia.org/wiki/ISO_4217), with a space between cost and currency.<br><br>Examples: `9.99 USD`, `25.00 EUR` \|<br>\| `sale_price_effective_date`<br><br>type: string \| Optional.<br><br>Start and end date and time for the sale, separated by a slash. Write the start and end dates as YYYY-MM-DD. Add a "T" after each date and then include the time. Write the time in a 24-hour format (0:00 to 23:59).<br><br>Example: `2014-11-01T12:00-0300/2014-12-01T00:00-0300` \|<br>\| `shipping`<br><br>type: array< object > \| Optional.<br><br>An array of JSON structures containing the following fields:<br><br>* shipping_country<br>* shipping_price_currency<br>* shipping_price_value<br>* shipping_region<br>* shipping_service<br><br>Example:  <br>```
[
      {
        "shipping_country": "US",
        "shipping_region": "CA",
        "shipping_service": "Pick-up point",
        "shipping_price_value": "4.90",
        "shipping_price_currency": "USD"
      },
      {
        "shipping_country": "US",
        "shipping_region": "CA",
        "shipping_service": "Home delivery",
        "shipping_price_value": "7.90",
        "shipping_price_currency": "USD"
      }
]
```<br><br>**Note:** The comma- and colon-separated format (`US:CA:Ground:9.99 USD, US:NY:Air:15.99 USD`) is discouraged but is also supported \|<br>\| `shipping_weight`<br><br>type: string \| Shipping weight of the item in lb, oz, g, or kg.<br><br>Example: `10 kg` \|<br>\| `size`<br><br>type: string \| Optional.<br><br>Size of item. Example: `Small` or `XL`.aasasd \|<br>\| `title`<br><br>type: string \| Required.<br><br>Max size: 100.<br><br>Title of item. \|<br>\| `user_rating`<br><br>type: number \| Optional.<br><br>The average rating purchasers have provided for this product. Range between 1.0 and 5.0. One decimal place allowed. This should be used in conjunction with `rating_count`.<br><br>Example: 4.5 \|<br>\| `vendor_id`<br><br>type: string \| Optional.<br><br>For marketplaces: the ID of the vendor/seller that sells the item. \|<br>\| `video`<br><br>type: array< object > \| Optional.<br><br>URLs and tags for videos to be used in your ads or in shops. Supports up to 30,000 videos on the catalog level. Tags are optional and, if used, should describe what is in the video.<br><br>The maximum video file size is 200 MB. Supported formats include .3g2, .3gp, .3gpp, .asf, .avi, .dat, .divx, .dv, .f4v, .flv, .gif, .m2ts, .m4v, .mkv, .mod, .mov, .mp4, .mpe, .mpeg, .mpeg4, .mpg, .mts, .nsv, .ogm, .ogv, .qt, .tod, .ts, .vob and .wmv<br><br>Example:<br><br>```
"video": [
      {
        "url":"http://example.com/video_1.mp4",
        "tag": [“Swimming pool”,”Gym”],
      }
]
```<br><br>NOTE: To delete video 1 if the product has video 1, 2, remove video 1 from the array:<br><br>```
[
  {
    "method": "UPDATE",
    "data": {
      "video": [
        {
          "url": "https://google.com/video_2.mp4",
          "tag": ["video_2"]
        }
      ]
    }
  }
]
```<br><br>To delete all videos, send an empty array:<br><br>```
[
  {
    "method": "UPDATE",
    "data": {
      "video": []
    }
  }
]
``` \| |
| item_type=APP_AND_SOFTWARE |
| ↳<br>\| Field \| Description \|<br>\| --- \| --- \|<br>\| `app_category`<br><br>type: string \| Optional.<br><br>Type of application. Used to recommend your product to the right people. Supported values:<br><br>* `Games`<br>* `Productivity`<br>* `Social`<br>* `Entertainment`<br>* `Education`<br>* `Utilities`<br>* `Lifestyle`<br>* `Health & Fitness`<br>* `Business`<br>* `Other` \|<br>\| `app_subcategory`<br><br>type: string \| Optional.<br><br>Character limit: 200.<br><br>Subcategory of the application, such as arcade game. Used to recommend your product to the right people. \|<br>\| `applink`<br><br>type: object< string > \| Optional.<br><br>Links to mobile apps. A JSON object with the following keys:<br><br>* ios_url<br>* ios_app_store_id<br>* ios_app_name<br>* android_url<br>* android_package<br>* android_class<br>* android_app_name \|<br>\| `availability`<br><br>type: string \| Required.<br><br>Availability status: `in stock`, `out of stock`, `available for order`, `discontinued`. \|<br>\| `brand`<br><br>type: string \| Optional.<br><br>Character limit: 100.<br><br>The name of the publisher of the product. \|<br>\| `condition`<br><br>type: string \| Required.<br><br>Product condition: `new`, `refurbished`, or `used`. \|<br>\| `content_rating`<br><br>type: string \| Optional.<br><br>Official rating of the product. Can be shown in ads. Required for restricted audiences in our [Advertising policies](https://www.facebook.com/policies/ads).<br><br>Example: `E for Everyone` \|<br>\| * `custom_label_0`<br>* `custom_label_1`<br>* `custom_label_2`<br>* `custom_label_3`<br>* `custom_label_4`<br><br>type: string \| Optional.<br><br>Character limit: 100.<br><br>Any relevant information you want to add to your ad creative such as in the headline. \|<br>\| * `custom_number_0`<br>* `custom_number_1`<br>* `custom_number_2`<br>* `custom_number_3`<br>* `custom_number_4`<br><br>type: integer \| Optional.<br><br>Any number you want to filter products by when you create product sets. Use whole numbers between 0 and 4294967295. Decimals and commas are not supported. \|<br>\| `description`<br><br>type: string \| Required.<br><br>Character limit: 9999.<br><br>A short and relevant description of the product. Shown in ads. Use plain text and don't enter text in all capital letters. \|<br>\| `developer`<br><br>type: string \| Optional.<br><br>Character limit: 100.<br><br>The name of the developer of the product. \|<br>\| `fb_product_category`<br><br>type: string \| Optional.<br><br>The Facebook product category for the product. Enter a supported category from the latest downloadable list available on our [Business Help Center](https://www.facebook.com/business/help/526764014610932). \|<br>\| `genres`<br><br>type: string \| Optional.<br><br>Character limit: 200.<br><br>The genre or style of the game or app, such as action or puzzle. Use commas to separate multiple items.<br><br>Example: `Action,RPG,Multiplayer` \|<br>\| `google_product_category`<br><br>type: string \| Optional.<br><br>The Google product category for the product. Enter a supported category from the latest downloadable list available on our [Business Help Center](https://www.facebook.com/business/help/526764014610932). \|<br>\| `id`<br><br>type: string \| Required.<br><br>Character limit: 100.<br><br>A unique content ID for the item. Each content ID must appear only once in your catalog. To run Advantage+ catalog ads, this ID must exactly match the content ID for the same item in your Meta Pixel code. \|<br>\| `image_link`<br><br>type: string \| Required.<br><br>The URL for the main image of your product. Shown in ads. Must be in a supported format (JPG/PNG) and at least 500 x 500 pixels. \|<br>\| `link`<br><br>type: string \| Required.<br><br>The link to the specific product page on your business's website. Links must begin with `http://` or `https://`. \|<br>\| `operating_system`<br><br>type: string \| Optional.<br><br>Character limit: 100.<br><br>The operating system or device on which the game or app can be used. Use commas to separate multiple items. Supported values:<br><br>* `iOS`<br>* `Android`<br>* `Windows`<br>* `macOS`<br>* `Linux`<br>* `Chrome OS`<br>* `Web`<br>* `Other`<br><br>Example: `iOS,Android` \|<br>\| `price`<br><br>type: string \| Optional.<br><br>The individual price of the app or software. Do not enter a subscription price. Format the price as a number followed by the 3-letter currency code (ISO 4217 standards). Use a period (`.`) as the decimal point.<br><br>Example: `9.99 USD` \|<br>\| `rating_count`<br><br>type: integer \| Optional.<br><br>The number of users who have left ratings on the application. Can be shown in ads.<br><br>Example: `100` \|<br>\| `sale_price`<br><br>type: string \| Optional.<br><br>The discounted price if the item is on sale. Same format as `price`. A sale price is required if you want to use an overlay for discounted prices. \|<br>\| `title`<br><br>type: string \| Required.<br><br>Character limit: 200.<br><br>The name of the product. Shown in ads. \|<br>\| `user_rating`<br><br>type: number \| Optional.<br><br>The average user rating the application has. Enter a rating between 0.0 to 5.0, using a single decimal place. Can be shown in ads.<br><br>Example: `4.5` \|<br><br>### Sample APP_AND_SOFTWARE payload<br><br>```
{
  "id": "app_001",
  "title": "Super Puzzle Game",
  "description": "A fun and challenging puzzle game for all ages",
  "link": "https://example.com/super-puzzle-game",
  "image_link": "https://example.com/app-icon.jpg",
  "availability": "in stock",
  "condition": "new",
  "price": "4.99 USD",
  "brand": "GameStudio",
  "app_category": "Games",
  "app_subcategory": "Puzzle",
  "content_rating": "E for Everyone",
  "developer": "GameStudio Inc.",
  "genres": "Puzzle,Casual",
  "operating_system": "iOS,Android",
  "user_rating": 4.5,
  "rating_count": 1200
}
``` |
| item_type=DESTINATION |
| ↳<br>\| Field \| Description \|<br>\| --- \| --- \|<br>\| `applink`<br><br>type: object< string > \| Optional.<br><br>Links to mobile apps. A JSON object with string keys and string values. The following keys are supported:<br><br>* ios_url<br>* ios_app_store_id<br>* ios_app_name<br>* iphone_url<br>* iphone_app_store_id<br>* iphone_app_name<br>* ipad_url<br>* ipad_app_store_id<br>* ipad_app_name<br>* android_url<br>* android_package<br>* android_class<br>* android_app_name<br>* windows_phone_url<br>* windows_phone_app_id<br>* windows_phone_app_name \|<br>\| `address`<br><br>type: object< string > \| Required.<br><br>Address of the destination. A JSON object with string keys and string values. The following keys are supported.<br><br>Required fields:<br><br>* city<br>* country<br>* region<br><br>Optional fields:<br><br>* city_id - identifier of the city to be used when constructing URLs<br>* postal_code<br>* unit_number<br><br>Example: `{<br>"city": "Shannon",<br>"region": "Ireland",<br>"country": "Ireland"<br>}` \|<br>\| `description`<br><br>type: string \| Optional.<br><br>Max character limit: 5000.<br><br>Short paragraph describing the destination. \|<br>\| `destination_id`<br><br>type: string \| Required.<br><br>Max character limit: 100.<br><br>Unique ID for the destination. \|<br>\| `image`<br><br>type: array< object > \| Required.<br><br>URLs and tags for images to be used in your ads or in shops.<br><br>A JSON array containing up to 21 records with the following fields:<br><br>* url: the URL string of the image<br>* tag: a JSON array of strings. Tags are optional and, if used, should describe what is in the image. \|<br>\| `latitude`<br><br>type: string \| Required.<br><br>Latitude location of the destination. \|<br>\| `longitude`<br><br>type: string \| Required.<br><br>Longitude location of the destination. \|<br>\| `name`<br><br>type: string \| Required.<br><br>Name of the destination. \|<br>\| `neighborhood`<br><br>type: array< string > \| Optional.<br><br>Max number of neigborhoods allowed: 20. One or more neighborhood(s) for the destination.<br><br>Example: `["Soho", "Las Vegas Strip"]` \|<br>\| `price`<br><br>type: string \| Optional.<br><br>Lowest average cost and currency for the destination. Format the price as a number followed by the currency code; use [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) standards. Use ""."" as the decimal for the price. \|<br>\| `price_change`<br><br>type: string \| Optional.<br><br>Price change. Can be used for building product sets and in the ad creative:<br><br>* `0` - No price change<br>* `-10` - 10% price drop<br>* `20` - 20% price increase.<br><br>Example: `"0"` \|<br>\| `type`<br><br>type: array< string > \| Required.<br><br>Max number of destination types: 20. Type(s) of destination. A destination can have multiple types.<br><br>Example: `["resort", "beach"]` \|<br>\| `url`<br><br>type: string \| Required.<br><br>Link to the website where you can book the destination. \|<br>\| `video`<br><br>type: array< object > \| Optional.<br><br>URLs and tags for videos to be used in your ads or in shops. Supports up to 30,000 videos on the catalog level. Tags are optional and, if used, should describe what is in the video.<br><br>The maximum video file size is 200 MB. Supported formats include .3g2, .3gp, .3gpp, .asf, .avi, .dat, .divx, .dv, .f4v, .flv, .gif, .m2ts, .m4v, .mkv, .mod, .mov, .mp4, .mpe, .mpeg, .mpeg4, .mpg, .mts, .nsv, .ogm, .ogv, .qt, .tod, .ts, .vob and .wmv<br><br>Example:<br><br>```
"video": [
      {
        "url":"http://example.com/video_1.mp4",
        "tag": [“Swimming pool”,”Gym”],
      }
]
```<br><br>NOTE: To delete video 1 if the destination has video 1, 2, remove video 1 from the array:<br><br>```
[
  {
    "method": "UPDATE",
    "data": {
      "video": [
        {
          "url": "https://google.com/video_2.mp4",
          "tag": ["video_2"]
        }
      ]
    }
  }
]
```<br><br>To delete all videos, send an empty array:<br><br>```
[
  {
    "method": "UPDATE",
    "data": {
      "video": []
    }
  }
]
``` \|<br><br>### Sample DESTINATION payload<br><br>```
{
 "address": {
   "city": "Menlo Park",
   "city_id": "MPK",
   "country": "USA",
   "postal_code": "94025",
   "region": "California"
 },
 "applink": {
   "android_url": "a://b/c",
   "android_package": "android.test",
   "android_app_name": "TestApp",
   "ios_url": "d://e/f",
   "ios_app_store_id": "123456",
   "ios_app_name": "TestApp"
 },
 "description": "Description of the test destination ",
 "destination_id": "abc",
 "image": [
   {
     "url": "https://facebook.com/1.jpg",
     "tag": [
       "image_tag"
     ]
   }
 ],
 "latitude": "42.0",
 "longitude": "42.0",
 "name": "Test Destination",
 "neighborhood": [
   "Silicon Valley",
   "Neighbourhood2"
 ],
 "price": "123 USD",
 "price_change": 0,
 "type": [
   "Family",
   "Sand",
   "Water"
 ],
 "url": "https://website.com/la_isla_bonita.html",
 "video": [
   {
     "url": "https://facebook.com/1.mp4",
     "tag": [
       "video_tag"
     ]
   }
 ]
}
``` |
| item_type=FLIGHT |
| ↳<br>\| Field \| Description \|<br>\| --- \| --- \|<br>\| `description`<br><br>type: string \| Optional.<br><br>Max character limit: 5000.<br><br>Description of the flight. \|<br>\| `destination_airport`<br><br>type: string \| Required.<br><br>Destination airport for the flight. Should be written as an [IATA code](https://en.wikipedia.org/w/index.php?title=List_of_airports_by_IATA_airport_code).<br><br>Example: `SFO`. \|<br>\| `destination_city`<br><br>type: string \| Optional.<br><br>Name of the destination city for the flight. \|<br>\| `image`<br><br>type: array< object > \| Required.<br><br>Images to be used in the ads. A JSON array containing up to 21 records with the following fields:<br><br>* url: the URL string of the image<br>* tag: a JSON array of strings. Tags are optional and, if used, should describe what is in the image. \|<br>\| `origin_airport`<br><br>type: string \| Required.<br><br>Origin airport for the flight. Should be written as an [IATA code](https://en.wikipedia.org/w/index.php?title=List_of_airports_by_IATA_airport_code).<br><br>Example: `LHR`. \|<br>\| `price`<br><br>type: string \| Optional.<br><br>Cost and currency of the flight. The price is a number followed by the currency code; use [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) standards. Use ""."" as the decimal for the price. \|<br>\| `url`<br><br>type: string \| Optional.<br><br>Link to the website where you can book the flight. \|<br>\| `video`<br><br>type: array< object > \| Optional.<br><br>URLs and tags for videos to be used in your ads. Supports up to 30,000 videos on the catalog level. Tags are optional and, if used, should describe what is in the video.<br><br>The maximum video file size is 200 MB. Supported formats include .3g2, .3gp, .3gpp, .asf, .avi, .dat, .divx, .dv, .f4v, .flv, .gif, .m2ts, .m4v, .mkv, .mod, .mov, .mp4, .mpe, .mpeg, .mpeg4, .mpg, .mts, .nsv, .ogm, .ogv, .qt, .tod, .ts, .vob and .wmv<br><br>Example:<br><br>```
"video": [
      {
        "url":"http://example.com/video_1.mp4",
        "tag": [“Red Eye”],
      }
]
```<br><br>NOTE: To delete video 1 if the flight has video 1, 2, remove video 1 from the array:<br><br>```
[
  {
    "method": "UPDATE",
    "data": {
      "video": [
        {
          "url": "https://google.com/video_2.mp4",
          "tag": ["video_2"]
        }
      ]
    }
  }
]
```<br><br>To delete all videos, send an empty array:<br><br>```
[
  {
    "method": "UPDATE",
    "data": {
      "video": []
    }
  }
]
``` \|<br><br>### Sample FLIGHT payload<br><br>```
{
 "description": "test flight",
 "destination_airport": "SFO",
 "destination_city": "San Francisco",
 "image": [
   {
     "url": "https://www.facebook.com/images/plane.jpg",
     "tags": [
       "tag1",
       "tag2"
     ]
   }
 ],
 "origin_airport": "LAX",
 "origin_city": "Los Angeles",
 "price": "123 USD",
 "custom_label_0": "test flight label",
 "custom_number_0": 2025,
 "url": "https://www.facebook.com/sfo_lax_flight",
 "video": [
   {
     "url": "https://website.com/p123.mpg",
     "tag": [
       "cloud",
       "wing"
     ]
   }
 ]
}
``` |
| item_type=HOME_LISTING |
| ↳<br>\| Field \| Description \|<br>\| --- \| --- \|<br>\| `home_listing_id`<br><br>type: string \| Required.<br><br>Unique home (apartment/condo) listing ID; most granular ID possible.<br><br>Example: `FB_home_1234` \|<br>\| `home_listing_group_id`<br><br>type: string \| Optional.<br><br>Building or apartment's unique ID. Must be unique per group. \|<br>\| `applink`<br><br>type: object< string > \| Optional.<br><br>Links to mobile apps. A JSON object with string keys and string values. The following keys are supported:<br><br>* ios_url<br>* ios_app_store_id<br>* ios_app_name<br>* iphone_url<br>* iphone_app_store_id<br>* iphone_app_name<br>* ipad_url<br>* ipad_app_store_id<br>* ipad_app_name<br>* android_url<br>* android_package<br>* android_class<br>* android_app_name<br>* windows_phone_url<br>* windows_phone_app_id<br>* windows_phone_app_name \|<br>\| `address`<br><br>type: object< string > \| Required.<br><br>Street address for the property that must be resolvable to its location.<br><br>See [Address Object Parameters](https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads/get-started#address-object). \|<br>\| `availability`<br><br>type: string \| Required.<br><br>Current availability for the home listing. Supported values are: `for_sale`, `for_rent`, `sale_pending`, `recently_sold`, `off_market`, `available_soon`. For commerce, the only supported value is `for_rent`. \|<br>\| `available_dates_price_config`<br><br>type: array< object > \| Optional.<br><br>List of dates and prices that a listing is available. When you provide values, Facebook can recommend listings based on their available dates and dynamically show the associated price in your ad.<br><br>See [Available Dates Object Parameters](https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads/get-started#available_dates-object). \|<br>\| `description`<br><br>type: string \| Optional.<br><br>Max character limit: 5000.<br><br>Short paragraph describing the home listing. \|<br>\| `image`<br><br>type: array< object > \| Required.<br><br>URLs and tags for images to be used in your ads.<br><br>A JSON array containing up to 21 records with the following fields:<br><br>* url: the URL string of the image<br>* tag: a JSON array of strings. Tags are optional and, if used, should describe what is in the image.<br><br>See [Image Object Parameters](https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads/get-started#image-object). \|<br>\| `latitude`<br><br>type: string \| Optional.<br><br>Latitude location of the home listing. \|<br>\| `longitude`<br><br>type: string \| Optional.<br><br>Longitude location of the home listing. \|<br>\| `listing_type`<br><br>type: string \| Optional.<br><br>Type of property listing. Supported values for Advantage+ catalog ads: `for_rent_by_agent`, `for_rent_by_owner`, `for_sale_by_agent`, `for_sale_by_owner`, `foreclosed`, `new_construction`, `new_listing`. Supported values for commerce: `for_rent_by_agent`, `for_rent_by_owner`. \|<br>\| `name`<br><br>type: string \| Required.<br><br>Name of the home listing. \|<br>\| `neighborhood`<br><br>type: array< string > \| Optional.<br><br>Neighborhood for the home listing. Max number neighborhoods allowed: 20. \|<br>\| `num_rooms`<br><br>type: integer \| Optional.<br><br>Total number of rooms in the property. \|<br>\| `num_baths`<br><br>type: integer \| Optional.<br><br>Total number of bathrooms. For commerce, must be 1 at minimum. \|<br>\| `num_beds`<br><br>type: integer \| Optional.<br><br>Total number of bedrooms. Can be 0 for Studios. \|<br>\| `num_units`<br><br>type: integer \| Optional.<br><br>Number of units available. Use only for apartments or condos available for rent/lease. \|<br>\| `price`<br><br>type: string \| Required.<br><br>Cost and currency for the home listing. The price is a number followed by the currency code; use [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) standards. Use ""."" as the decimal for the price. \|<br>\| `property_type`<br><br>type: string \| Optional.<br><br>Type of property.<br><br>Supported values for Advantage+ catalog ads: `apartment`, `condo`, `house`, `land`, `manufactured`, `other`, `townhouse`.<br><br>Supported values for commerce: `apartment`, `builder_floor`, `condo`, `house`, `house_in_condominium`, `house_in_villa`, `loft`, `penthouse`, `studio`, `townhouse`, `other`. \|<br>\| `url`<br><br>type: string \| Required.<br><br>Link to the website where you can view the listing. \|<br>\| `year_built`<br><br>type: string \| Optional.<br><br>Year the property was built, using the YYYY format, 4 digit year. \|<br>\| `area_size`<br><br>type: integer \| Not applicable for Advantage+ catalog ads. Required for commerce.<br>Area or space of the floor plan's listing. \|<br>\| `area_unit`<br><br>type: string \| Not applicable for Advantage+ catalog ads. Required for commerce.<br>The units (square feet or square meters) of the floor area's value. Supported values: `sq_ft`, `sq_m`. \|<br>\| `ac_type`<br><br>type: string \| Not applicable for Advantage+ catalog ads. Optional for commerce.<br>Type of air conditioning. Supported values: `central`, `other`, `none`. \|<br>\| `furnish_type`<br><br>type: string \| Not applicable for Advantage+ catalog ads. Optional for commerce.<br>Type of heating installed in the property. Supported values: `central`, `gas`, `electric`, `radiator`, `other`, `none`. \|<br>\| `laundry_type`<br><br>type: string \| Not applicable for Advantage+ catalog ads. Optional for commerce.<br><br>Type of laundry available. Supported values: `in_unit`, `in_building`, `other`, `none`. \|<br>\| `parking_type`<br><br>type: string \| Not applicable for Advantage+ catalog ads. Optional for commerce.<br><br>Type of parking available on property. Supported values: `garage`, `street`, `off-street`, `other`, `none`. \|<br>\| `partner_verification`<br><br>type: string \| Not applicable for Advantage+ catalog ads. Optional for commerce.<br><br>Whether the partner company has verified the listing. Supported values: `verified`, `none`. \|<br>\| `pet_policy`<br><br>type: string \| Not applicable for Advantage+ catalog ads. Optional for commerce.<br><br>Indicates the pets allowed on the property: `cat`, `dog`, `all`, `none`. \|<br>\| `status`<br><br>type: string \| Controls whether an item is active or archived in your catalog. Only active items can be seen by people in your ads, shops or any other channels. Supported values: `active`, `archived`. Items are active by default. Learn more about [archiving items](https://www.facebook.com/business/help/543317109402043?id=725943027795860).<br><br>Example: `active`<br><br>**Note:** This field was previously called `visibility`. While we still support the old field name, we recommend that you use the new name. \|<br>\| `video`<br><br>type: array< object > \| Optional.<br><br>URLs and tags for videos to be used in your ads or in shops. Supports up to 30,000 videos on the catalog level. Tags are optional and, if used, should describe what is in the video.<br><br>The maximum video file size is 200 MB. Supported formats include .3g2, .3gp, .3gpp, .asf, .avi, .dat, .divx, .dv, .f4v, .flv, .gif, .m2ts, .m4v, .mkv, .mod, .mov, .mp4, .mpe, .mpeg, .mpeg4, .mpg, .mts, .nsv, .ogm, .ogv, .qt, .tod, .ts, .vob and .wmv<br><br>Example:<br><br>```
"video": [
      {
        "url":"http://example.com/video_1.mp4",
        "tag": [“Swimming pool”,”Gym”],
      }
]
```<br><br>NOTE: To delete video 1 if the home listing has video 1, 2, remove video 1 from the array:<br><br>```
[
  {
    "method": "UPDATE",
    "data": {
      "video": [
        {
          "url": "https://google.com/video_2.mp4",
          "tag": ["video_2"]
        }
      ]
    }
  }
]
```<br><br>To delete all videos, send an empty array:<br><br>```
[
  {
    "method": "UPDATE",
    "data": {
      "video": []
    }
  }
]
``` \|<br><br>### Sample HOME_LISTING payload<br><br>```
{
 "home_listing_id": "home_listing_123",
 "home_listing_group_id": "group_123",
 "address": {
   "addr1": "12 Test Street",
   "city": "Marília",
   "region": "SP",
   "country": "BR",
   "postal_code": "17515440"
 },
 "applink": {
   "android_url": "a://b/c",
   "android_package": "android.topwidgets",
   "android_app_name": "TopWidgets",
   "ios_url": "d://e/f",
   "ios_app_store_id": "123456",
   "ios_app_name": "TopWidgets"
 },
 "available_dates_price_config": [
   {
     "start_date": "2026-01-01",
     "end_date": "2027-01-01",
     "rate": "10000",
     "currency": "USD",
     "interval": "nightly"
   }
 ],
 "latitude": "-25.0",
 "longitude": "-45.0",
 "availability": "off_market",
 "description": "Nice house, has windows and doors",
 "image": [
   {
     "url": "https://facebook.com/123.jpg",
     "tag": [
       "image_tag"
     ]
   }
 ],
 "name": "House for Sale on Earth",
 "neighborhood": [
   "Jardim Maria Izabel",
   "RESIDENTIAL"
 ],
 "num_baths": 2,
 "num_beds": 2,
 "num_rooms": 4,
 "num_units": 2,
 "price": "4000000 JPY",
 "url": "https://facebook.com/123",
 "property_type": "house",
 "listing_type": "for_sale_by_agent",
 "agent_company": "Test Agency",
 "area_size": "123",
 "area_unit": "sq_m",
 "ac_type": "central",
 "furnish_type": "semi-furnished",
 "heating_type": "gas",
 "laundry_type": "in_unit",
 "parking_type": "off_street",
 "partner_verification": "verified",
 "pet_policy": "cat",
 "status": "archived",
 "video": [
   {
     "url": "https://facebook.com/123.mp4",
     "tag": [
       "video_tag"
     ]
   }
 ],
 "year_built": "2001"
}
``` |
| item_type=HOTEL |
| ↳<br>\| Field \| Description \|<br>\| --- \| --- \|<br>\| `address`<br><br>type: array< object > \| Required.<br><br>Address of the hotel. See [Address Object Parameters](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/catalog#address-object). \|<br>\| `applink`<br><br>type: object \| Optional.<br><br>Deep link straight to the hotel details page in your mobile app. See supported fields [here](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links). \|<br>\| `base_price`<br><br>type: string \| Required.<br><br>Base price of the hotel room per night. Add the currency type to the price. Format price as the cost, followed by the [ISO currency code](https://en.wikipedia.org/wiki/ISO_4217), with a space between cost and currency.<br><br>Example: `100 USD` \|<br>\| `priority`<br><br>type: integer \| Optional.<br><br>An indicator of the priority of the hotel; value from 0(lowest priority) to 5(highest priority).<br><br>Example: `5` \|<br>\| `category`<br><br>type: string \| Optional.<br><br>The type of property. The category can be any type of internal description desired.<br><br>Examples: `Resort`, `Day Room` \|<br>\| `number_of_rooms`<br><br>type: integer \| Optional.<br><br>Total number of rooms/units in this hotel listing.<br><br>Example: `150` \|<br>\| `brand`<br><br>type: integer \| Optional.<br><br>Brand of the hotel chain. \|<br>\| * `custom_label_0`<br>* `custom_label_1`<br>* `custom_label_2`<br>* `custom_label_3`<br>* `custom_label_4`<br><br>type: string \| Optional.<br><br>Max character limit: 100<br><br>Up to five custom fields for any additional information you want to filter items by when you create sets. For example, you could use a custom field to indicate all rooms that are part of a summer sale, and then filter those rooms into a set. This field supports any text value, including numbers.<br><br>Example: `Summer Sale` \|<br>\| * `custom_number_0`<br>* `custom_number_1`<br>* `custom_number_2`<br>* `custom_number_3`<br>* `custom_number_4`<br><br>type: integer \| Optional.<br><br>Up to five custom fields for any additional number-related information you want to filter items by when you create sets. This field allows you to filter by number ranges (is greater than and is less than) when you create a set. For example, you could use this field to indicate the year a hotel was opened, and then filter a certain year range into a set.<br><br>This field supports whole numbers between 0 and 4294967295. It doesn't support negative numbers, decimal numbers or commas, such as -2, 5.5 or 10,000.<br><br>Example: `2022` \|<br>\| `internal_label`<br><br>type: array< string > \| Add internal labels to help filter items when you create [product sets](https://www.facebook.com/business/help/620275848114281?id=725943027795860). For example, you could add a “summer” label to all items that are part of a summer promotion and then filter those items into a set. Labels are only visible to you.<br><br>Character limit: Up to 5,000 labels per product and 110 characters per label.<br><br>Note: If you’re currently using custom labels (`custom_label_0` to `custom_label_4`) for filtering product sets, switching to internal labels (`internal_label`) instead is recommended. Unlike custom labels, you can add or update internal labels as often as needed without sending items through policy review each time, which can impact ad delivery.<br><br>This field was previously called `product_tags`. While we still support the old field name, we recommend that you use the new name. \|<br>\| `description`<br><br>type: string \| Required.<br><br>Max character limit: 5000.<br><br>Short description of the hotel. \|<br>\| `guest_rating`<br><br>type: array< object > \| Optional.<br><br>Guest ratings of the hotel. See [Guest Rating Object Parameters](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/catalog#guest_ratings-object). \|<br>\| `hotel_id`<br><br>type: string \| Required.<br><br>Max length: 100<br><br>Your unique identifier for the hotel within the catalog. This ID is matched with any `content_ids` provided in your hotel app and pixel events. Tip: To improve performance, avoid using a space for this unique identifier field. Don't use duplicate IDs.<br><br>Example: `FB_hotel_1234` \|<br>\| `image`<br><br>type: array< object > \| Required.<br><br>A JSON array containing up to 21 records with the following fields:<br>* url: the URL string of the image<br>* tag: a JSON array of strings. Tags are optional and, if used, should describe what is in the image.<br><br>See [Image Object Parameters](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/catalog#image-object). \|<br>\| `video`<br><br>type: array< object > \| Optional.<br><br>URLs and tags for videos to be used in your ads or in shops. Supports up to 30,000 videos on the catalog level. Tags are optional and, if used, should describe what is in the video.<br><br>The maximum video file size is 200 MB. Supported formats include .3g2, .3gp, .3gpp, .asf, .avi, .dat, .divx, .dv, .f4v, .flv, .gif, .m2ts, .m4v, .mkv, .mod, .mov, .mp4, .mpe, .mpeg, .mpeg4, .mpg, .mts, .nsv, .ogm, .ogv, .qt, .tod, .ts, .vob and .wmv<br><br>Example:<br><br>```
"video": [
      {
        "url":"http://example.com/video_1.mp4",
        "tag": [“Swimming pool”,”Gym”],
      }
]
```<br><br>NOTE: To delete video 1 if the product has video 1, 2, remove video 1 from the array:<br><br>```
[
  {
    "method": "UPDATE",
    "data": {
      "video": [
        {
          "url": "https://google.com/video_2.mp4",
          "tag": ["video_2"]
        }
      ]
    }
  }
]
```<br><br>To delete all videos, send an empty array:<br><br>```
[
  {
    "method": "UPDATE",
    "data": {
      "video": []
    }
  }
]
``` \|<br>\| `latitude`<br><br>type: string \| Required.<br><br>Latitude location of the hotel.<br><br>Example: `12.345` \|<br>\| `longitude`<br><br>type: string \| Required.<br><br>Longitude location of the hotel.<br><br>Example: `67.89` \|<br>\| `loyalty_program`<br><br>type: string \| Optional.<br><br>Loyalty program you use to gain points for staying at the hotel. \|<br>\| `margin_level`<br><br>type: string \| Optional.<br><br>Indicator of the hotel's profitability; value from 1 to 10.<br><br>Example: `7` \|<br>\| `name`<br><br>type: string \| Required.<br><br>Name of the hotel. \|<br>\| `neighborhood`<br><br>type: array< string > \| Optional.<br><br>One or more neighborhood(s) for the hotel. Max number of neigborhoods allowed: 20.<br><br>Example: `["Soho", "Las Vegas Strip"]` \|<br>\| `phone`<br><br>type: string \| Optional.<br><br>Phone number with country code. \|<br>\| `status`<br><br>type: string \| Optional.<br><br>Controls whether an item is active or archived in your catalog. Only active items can be seen by people in your ads, shops or any other channels. Supported values: `active`, `archived`. Items are active by default. Learn more about [archiving items](https://www.facebook.com/business/help/543317109402043?id=725943027795860).<br><br>Example: `active`<br><br>This field was previously called `visibility`. While we still support the old field name, we recommend that you use the new name. \|<br>\| `Sale price`<br><br>type: string \| Optional.<br><br>Note: this field has a space character in its name<br><br>Sale price per night in the hotel. Use this to advertise discounts off the regular hotel price. Required: Add the currency type to the price. Format price as the cost, followed by the [ISO currency code](https://en.wikipedia.org/wiki/ISO_4217), with a space between cost and currency.<br><br>Example: `99 USD` \|<br>\| `Star rating`<br><br>type: Integer \| Optional.<br><br>Hotel star rating. Number should be between 1 and 5.<br><br>Example: `3` \|<br>\| `uri`<br><br>type: string \| Required.<br><br>Link to the website where you book the hotel room. \|<br><br>### Sample HOTEL payload<br><br>```
{
 "hotel_id": "1234",
 "name": "Test hotel",
 "description": "Test Hotel Description",
 "base_price": "100 USD",
 "Sale price": "99 USD",
 "priority": 4,
 "category": "Resort",
 "number_of_rooms": 2,
 "custom_label_0": "Test Label 0",
 "internal_label": [
   "label1",
   "label2"
 ],
 "custom_number_0": 2025,
 "brand": "Test Hotels Inc.",
 "guest_rating": [
   {
     "score": 4.4,
     "number_of_reviewers": 123,
     "rating_system": "Expedia",
     "max_score": 5
   }
 ],
 "address": {
   "country": "United States",
   "region": "California",
   "city": "Menlo Part",
   "addr1": "1 Hacker Way",
   "addr2": " ",
   "city_id": "",
   "postal_code": "94025"
 },
 "latitude": "12.345",
 "longitude": "67.890",
 "neighborhood": [
   "Silicon Valley"
 ],
 "Star rating": "4",
 "applink": {
   "android_app_name": "Test Apps",
   "android_package": "com.test.app",
   "android_url": "abc://dev/detail?no=1234",
   "ios_app_name": "com.test.app",
   "ios_app_store_id": "1234567890",
   "ios_url": "abc://def/detail?no=1234"
 },
 "image": [
   {
     "url": "https://facebook.com/1.jpg",
     "tags": [
       "main"
     ]
   }
 ],
 "video": [
   {
     "url": "https://facebook.com/1.mp4",
     "tags": [
       "main"
     ]
   }
 ],
 "url": "https://facebook.com/hotels/1234"
}
``` |
| item_type=HOTEL_ROOM |
| ↳<br>\| Field \| Description \|<br>\| --- \| --- \|<br>\| `applink`<br><br>type: object< string > \| Optional.<br><br>Deep link straight to the hotel room details page in your mobile app. See supported fields [here](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/product-deep-links). \|<br>\| `base_price`<br><br>type: string \| Required.<br><br>Base price for 1 night. Currency should follow [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) currency codes.<br><br>Example: `9.99 USD`. \|<br>\| `description`<br><br>type: string \| Required.<br><br>Max size: 5000.<br><br>Short text describing the room. \|<br>\| `hotel_retailer_id`<br><br>type: string \| Required.<br><br>Unique ID for the hotel that the room is in. \|<br>\| `hotel_room_id`<br><br>type: string \| Required.<br><br>Unique ID for the room. \|<br>\| `image`<br><br>type: array< object > \| Required.<br><br>Images of the room. A JSON array containing up to 21 records with the following fields:<br><br>* url: the URL string of the image<br>* tag: a JSON array of strings. Tags are optional and, if used, should describe what is in the image.<br><br>See [Image Object Parameters](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/catalog#image-object). \|<br>\| `video`<br><br>type: array< object > \| Optional.<br><br>URLs and tags for videos to be used in your ads or in shops. Supports up to 30,000 videos on the catalog level. Tags are optional and, if used, should describe what is in the video.<br><br>The maximum video file size is 200 MB. Supported formats include .3g2, .3gp, .3gpp, .asf, .avi, .dat, .divx, .dv, .f4v, .flv, .gif, .m2ts, .m4v, .mkv, .mod, .mov, .mp4, .mpe, .mpeg, .mpeg4, .mpg, .mts, .nsv, .ogm, .ogv, .qt, .tod, .ts, .vob and .wmv<br><br>Example:<br><br>```
"video": [
      {
        "url":"http://example.com/video_1.mp4",
        "tag": [“Swimming pool”,”Gym”],
      }
]
```<br><br>NOTE: To delete video 1 if the hotel room has videos 1, 2, remove video 1 from the array:<br><br>```
[
  {
    "method": "UPDATE",
    "data": {
      "video": [
        {
          "url": "https://google.com/video_2.mp4",
          "tag": ["video_2"]
        }
      ]
    }
  }
]
```<br><br>To delete all videos, send an empty array:<br><br>```
[
  {
    "method": "UPDATE",
    "data": {
      "video": []
    }
  }
]
``` \|<br>\| `margin_level`<br><br>type: string \| Optional.<br><br>Indicator of the hotel's profitability; value from 1 to 10. \|<br>\| `name`<br><br>type: string \| Required.<br><br>Max size: 100.<br><br>Name of the room. \|<br>\| `url`<br><br>type: string \| Required.<br><br>Link to advertiser's site where someone can book the stay. \|<br>\| `status`<br><br>type: string \| Controls whether an item is active or archived in your catalog. Only active items can be seen by people in your ads, shops or any other channels. Supported values: `published`, `archived`. Items are active by default. Learn more about [archiving items](https://www.facebook.com/business/help/543317109402043?id=725943027795860).<br><br>Example: `published`<br><br>**Note:** This field was previously called visibility. While we still support the old field name, we recommend that you use the new name. \|<br><br>### Sample HOTEL_ROOM payload<br><br>```
{
 "applink": {
   "android_app_name": "Test Apps",
   "android_package": "com.test.apps",
   "android_url": "abc://dev/detail?no=1234",
   "ios_app_name": "com.test.app",
   "ios_app_store_id": "1234567890",
   "ios_url": "abc://def/detail?no=1234"
 },
 "base_price": "100 USD",
 "sale_price": "99 USD",
 "description": "Test Hotel Room Description",
 "name": "The Fancy Suite",
 "hotel_retailer_id": "1234",
 "hotel_room_id": "fancy_room_42",
 "image": [
   {
     "url": "https://facebook.com/1.jpg",
     "tags": [
       "main"
     ]
   }
 ],
 "video": [
   {
     "url": "https://facebook.com/1.mp4",
     "tags": [
       "main"
     ]
   }
 ],
 "margin_level": 9,
 "url": "https://facebook.com/hotels/1234/rooms/fancy_room_42",
 "status": "published"
}
``` |
| item_type=MEDIA_TITLE |
| ↳<br>\| Field \| Description \|<br>\| --- \| --- \|<br>\| `actor`<br><br>type: string \| Optional.<br><br>Character limit: 200.<br><br>An actor in a production such as a movie or TV show. Use commas to separate multiple names. \|<br>\| `applink`<br><br>type: object< string > \| Optional.<br><br>Links to mobile apps. A JSON object with the following keys:<br><br>* ios_url<br>* ios_app_store_id<br>* ios_app_name<br>* android_url<br>* android_package<br>* android_class<br>* android_app_name \|<br>\| `availability`<br><br>type: string \| Required.<br><br>Availability status: `in stock`, `out of stock`, `available for order`, `discontinued`. \|<br>\| `award`<br><br>type: string \| Optional.<br><br>Character limit: 200.<br><br>Any notable awards or nominations. Use commas to separate multiple items. \|<br>\| `brand`<br><br>type: string \| Optional.<br><br>Character limit: 100.<br><br>The streaming service or platform where this product is available. \|<br>\| `condition`<br><br>type: string \| Required.<br><br>Product condition: `new`, `refurbished`, or `used`. \|<br>\| `content_rating`<br><br>type: string \| Optional.<br><br>Official rating of the media title. Can be shown in ads. Required for restricted audiences in our [Advertising policies](https://www.facebook.com/policies/ads).<br><br>Example: `PG-13` \|<br>\| * `custom_label_0`<br>* `custom_label_1`<br>* `custom_label_2`<br>* `custom_label_3`<br>* `custom_label_4`<br><br>type: string \| Optional.<br><br>Character limit: 100.<br><br>Any relevant information you want to add to your ad creative such as in the headline. \|<br>\| * `custom_number_0`<br>* `custom_number_1`<br>* `custom_number_2`<br>* `custom_number_3`<br>* `custom_number_4`<br><br>type: integer \| Optional.<br><br>Any number you want to filter products by when you create product sets. Use whole numbers between 0 and 4294967295. Decimals and commas are not supported. \|<br>\| `description`<br><br>type: string \| Required.<br><br>Character limit: 9999.<br><br>A short and relevant description of the product such as a plot summary for a movie. Shown in ads. Use plain text and don't enter text in all capital letters. \|<br>\| `director`<br><br>type: string \| Optional.<br><br>Character limit: 200.<br><br>A director of a production like a movie or radio show. Use commas to separate multiple names.<br><br>Example: `John Doe,Jane Doe` \|<br>\| `duration`<br><br>type: string \| Optional.<br><br>The duration of the product. Use the format `HH-MM-SS` (ISO 8601 standard).<br><br>Example: `02-34-15` \|<br>\| `featuring`<br><br>type: string \| Optional.<br><br>Character limit: 200.<br><br>The names of key individuals involved in the production such as artists or producers. Use commas to separate multiple names. \|<br>\| `genres`<br><br>type: string \| Optional.<br><br>Character limit: 200.<br><br>The media genre such as action or comedy. Use commas to separate multiple genres.<br><br>Example: `Action,Fantasy` \|<br>\| `global_unique_identifier`<br><br>type: string \| Optional.<br><br>Any identifier that represents a work of film or television. For example: EIDR (Entertainment Identifier Registry).<br><br>Example: `10.5240/B752-5B47-DBBE-E5D4-5A3F-N` \|<br>\| `id`<br><br>type: string \| Required.<br><br>Character limit: 100.<br><br>A unique content ID for the item. Each content ID must appear only once in your catalog. To run Advantage+ catalog ads, this ID must exactly match the content ID for the same item in your Meta Pixel code. \|<br>\| `image_link`<br><br>type: string \| Required.<br><br>The URL for the main image of your product. Shown in ads. Must be in a supported format (JPG/PNG) and at least 500 x 500 pixels. \|<br>\| `link`<br><br>type: string \| Required.<br><br>The link to the specific product page on your business's website. Links must begin with `http://` or `https://`. \|<br>\| `media_category`<br><br>type: string \| Optional.<br><br>The content category of the product. Used to recommend your products to the right audiences. Supported values:<br><br>* `Movie`<br>* `Music`<br>* `TV Show`<br>* `Other` \|<br>\| `price`<br><br>type: string \| Optional.<br><br>The individual price of the media. Do not enter a subscription price. Format the price as a number followed by the 3-letter currency code (ISO 4217 standards). Use a period (`.`) as the decimal point.<br><br>Example: `9.99 USD` \|<br>\| `production_company`<br><br>type: string \| Optional.<br><br>Character limit: 200.<br><br>The production company or studio that created the product. Use commas to separate multiple items. \|<br>\| `release_date`<br><br>type: string \| Optional.<br><br>The release date of the product. Use the format `YYYY-MM-DD`.<br><br>Example: `2025-02-16` \|<br>\| `sale_price`<br><br>type: string \| Optional.<br><br>The discounted price if the item is on sale. Same format as `price`. A sale price is required if you want to use an overlay for discounted prices. \|<br>\| `title`<br><br>type: string \| Required.<br><br>Character limit: 200.<br><br>The title of the product. Shown in ads. \|<br><br>### Sample MEDIA_TITLE payload<br><br>```
{
  "id": "movie_001",
  "title": "The Great Adventure",
  "description": "An epic journey across the world",
  "link": "https://example.com/the-great-adventure",
  "image_link": "https://example.com/poster.jpg",
  "availability": "in stock",
  "condition": "new",
  "price": "14.99 USD",
  "brand": "StreamFlix",
  "media_category": "Movie",
  "genres": "Action,Adventure",
  "content_rating": "PG-13",
  "release_date": "2025-06-15",
  "director": "Jane Smith",
  "actor": "John Doe,Alice Johnson",
  "duration": "02-15-00",
  "custom_label_0": "Summer Release"
}
``` |
| item_type=STORE_PRODUCT_ITEM |
| ↳<br>\| Field \| Description \|<br>\| --- \| --- \|<br>\| `retailer_item_id`<br><br>type: string \| **Required**.<br><br>Retailer ID \|<br>\| `store_code`<br><br>type: string \| **Required**.<br><br>As given in [Store Locations](https://business.facebook.com/security/twofactor/reauth/?twofac_next=https%3A%2F%2Fbusiness.facebook.com%2Fbusiness_locations&type=avoid_bypass&app_id=0&save_device=0) \|<br>\| `price`<br><br>type: integer \| **Optional**.<br><br>Optional unless you want local pricing to populate in the ads. If the price is not available for a product in the local feed, then that product's ad will fetch its price from the online feed. \|<br>\| `quantity`<br><br>type: number \| **Optional**.<br><br>Quantity will be default to 0 if it's not provided, but items can still be delivered if availability is in stock. \|<br>\| `availability`  <br><br>Type: string \| **Optional**.<br><br>If not set, the item is assumed to be available (in stock) for the given store. If the item is not available in the given store, it doesn’t have to be provided in the local feed, but uploading it as “out of stock” availability may simplify “update-only” feed uploads.<br><br>Identifies availability status:<br><br>* `in stock`<br>* `out of stock` \|<br>\| `sale_price`  <br><br>Type: integer \| **Optional**.<br><br>Local sale price. \|<br>\| `sale_price_effective_date`  <br><br>Type: string \| **Optional**.<br><br>Date range over which the sale is valid. Format is 2020-02-28T12:00-0800/2020-05-08T12:00-0800, where / is the delimiter. You cannot give only a start or end date. You must give both. If you leave it blank, then the sale date will be permanent until the `sale_price` is changed to null. \|<br>\| `pickup_timeline`  <br><br>Type: integer \| **Optional**.<br><br>The timeline for when people can pick up the item. Can be “same day” or “next day". \|<br>\| `pickup_method`  <br><br>Type: string \| **Optional**.<br><br>The method by which people can pick up the item. Can be “buy,” “reserve” or “not supported". \| |
| item_type=VEHICLE |
| ↳<br>For supported fields for the `CREATE` and `UPDATE` methods for type VEHICLE, see [Auto Inventory Catalog Fields - Vehicle](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/catalog#feedspec).<br><br>Supported fields are available for [Vehicle](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/reference#vehicle) and [Dealership](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/reference#dealership).<br><br>### Sample VEHICLE payload<br><br>```
{
 "vehicle_id": "i2 2017 Ford Fusion",
 "availability": "AVAILABLE",
 "make": "Ford",
 "model": "Fusion",
 "year": "2017",
 "mileage": {
   "value": "1500",
   "unit": "KM"
 },
 "image": [
   {
     "url": "http://www.facebook.com/teapic.jpg",
     "tag": [
       "Car"
     ]
   }
 ],
 "fuel_type": "gasoline",
 "body_style": "sedan",
 "drivetrain": "FWD",
 "vin": "1FADP5AU6DL536022",
 "condition": "EXCELLENT",
 "description": "Turbocharged! Gasoline!",
 "title": "SE Ford Certified and 6-Speed Automatic.",
 "price": "18000 USD",
 "exterior_color": "white",
 "sale_price": "16000 USD",
 "state_of_vehicle": "new",
 "longitude": "52.35",
 "latitude": "42.1",
 "address": {
   "addr1": "550 Auto Center Dr",
   "city": "Watsonville",
   "region": "CA",
   "country": "US",
   "postal_code": "96075"
 },
 "url": "http://www.example.com/test",
 "status": "archived"
}
``` |
| item_type=VEHICLE_OFFER |
| ↳<br>Refer to [Automotive Model Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/reference#vehicle-offers-feed-file) documentation for the list of supported fields. Please note that while in CSV and TSV feed files the ‘image’ field is spread across multiple columns (such as ‘image[0].url’, ‘image[0].tag’, ‘image[1].url’ etc.). In the /items_batch API endpoint there is no need to do so, instead the ‘image’ field is represented as a single JSON object (see example below).<br><br>### Sample VEHICLE_OFFER payload<br><br>```
{
 "vehicle_offer_id": "test_offer",
 "make": "Widget Motors",
 "availability": "AVAILABLE",
 "model": "Roller",
 "year": "2017",
 "offer_type": "finance",
 "title": "Buy this car now",
 "offer_description": "This is a great car",
 "url": "http://www.example.com/test",
 "offer_disclaimer": "Buy at your own risk",
 "image": [
   {
     "url": "http://www.facebook.com/teapic.jpg",
     "tag": [
       "Car"
     ]
   }
 ],
 "amount_percentage": 2,
 "amount_qualifier": "APR",
 "term_length": 36,
 "term_qualifier": "months",
 "downpayment": "1000 USD",
 "downpayment_qualifier": "due at signing + 1 month payment",
 "trim": "GT",
 "start_date": "2026-01-01T00:00:00+0000",
 "end_date": "2027-01-01T00:00:00+0000",
 "market_name": "EMEA",
 "comscore_market_codes": ["2079", "2080"],
 "generation": "4th gen",
 "transmission": "Automatic",
 "drivetrain": "FWD",
 "fuel_type": "gasoline",
 "body_style": "sedan",
 "status": "archived",
 "exterior_color": "white",
 "interior_color": "black",
 "interior_upholstery": "LEATHER"
}
``` |

## Deleting Catalog Items
When method=DELETE is used, you only need to pass the fields necessary to identify the catalog item that needs to be deleted.
| item_type | fields |
| --- | --- |
| PRODUCT_ITEM | id |
| DESTINATION | destination_id |
| FLIGHT | destination_airport, origin_airport |
| HOME_LISTING | home_listing_id |
| HOTEL | hotel_id |
| HOTEL_ROOM | hotel_retailer_id, hotel_room_id |
| STORE_PRODUCT_ITEM | retailer_item_id, store_code |
| VEHICLE | vehicle_id |
| VEHICLE_OFFER | vehicle_offer_id |

For example,

```
requests=[
    {
        "method":"DELETE",
        "data":{
         "destination_id": "abc321",
        }
    }
]
```

## Sample API Call {#sample-api-call}

[Try it in Graph Explorer](https://developers.facebook.com/tools/explorer/145634995501895/?method=POST&path=PASTE_CATALOG_ID_HERE%2Fitems_batch&version=v23.0&requests=[%0A%20%20%20%20%7B%0A%20%20%20%20%20%20%22method%22%3A%22UPDATE%22%2C%0A%20%20%20%20%20%20%22data%22%3A%7B%0A%20%20%20%20%20%20%20%20%20%20%22unknown_field%22%3A%20%22unknown_field_value%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22id%22%3A%20%22batch_api_product_123%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22item_group_id%22%3A%20%22g1%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22price%22%3A%20%2214%20GBP%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22image%22%3A%20[%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22url%22%3A%20%22http%3A%2F%2Fwebsite.com%2Fimage4.jpg%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22tag%22%3A%20[%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22t1%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22t2%22%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20]%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22url%22%3A%20%22http%3A%2F%2Fwebsite.com%2Fimage5.jpg%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22tag%22%3A%20[%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22t1%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22t2%22%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20]%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20]%2C%0A%20%20%20%20%20%20%20%20%20%20%22additional_variant_attribute%22%3A%20%22Scent%3AFruity%2CFlavor%3AApple%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22age_group%22%3A%20%22adult%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22applink%22%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22android_url%22%3A%20%22a%3A%2F%2Fb%2Fc%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22android_package%22%3A%20%22android.topwidgets%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22android_app_name%22%3A%20%22TopWidgets%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22ios_url%22%3A%20%22d%3A%2F%2Fe%2Ff%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22ios_app_store_id%22%3A%20%22123456%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22ios_app_name%22%3A%20%22TopWidgets%22%0A%20%20%20%20%20%20%20%20%20%20%7D%2C%0A%20%20%20%20%20%20%20%20%20%20%22brand%22%3A%20%22Top%20Widgets%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22color%22%3A%20%22yellow%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22condition%22%3A%20%22new%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22custom_label_0%22%3A%20%22label1%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22custom_number_0%22%3A%202022%2C%0A%20%20%20%20%20%20%20%20%20%20%22description%22%3A%20%22Test%20description.%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22rich_text_description%22%3A%20%22%3Cb%3ETest%3C%2Fb%3E%20%3Cu%3Edescription%3C%2Fu%3E.%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22disabled_capabilities%22%3A%20[%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22marketplace%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22b2c_marketplace%22%0A%20%20%20%20%20%20%20%20%20%20]%2C%0A%20%20%20%20%20%20%20%20%20%20%22fb_product_category%22%3A%20%22Apparel%20%26%20Accessories%20%3E%20Clothing%20%3E%20Suits%20%3E%20Tuxedos%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22gender%22%3A%20%22unisex%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22google_product_category%22%3A%20%22543586%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22gtin%22%3A%20%227798102151036%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22expiration_date%22%3A%20%222030-01-01%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22link%22%3A%20%22http%3A%2F%2Fwebsite.com%2Fproduct.html%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22importer_address%22%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22street1%22%3A%20%221%20Hacker%20Way%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22street2%22%3A%20%22Building%2018%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22city%22%3A%20%22Menlo%20Park%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22region%22%3A%20%22OK%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22postal_code%22%3A%20%2294025%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22country%22%3A%20%22US%22%0A%20%20%20%20%20%20%20%20%20%20%7D%2C%0A%20%20%20%20%20%20%20%20%20%20%22importer_name%22%3A%20%22Top%20Widgets%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22mobile_link%22%3A%20%22https%3A%2F%2Fm.topwidgets.com%2Fproducts%2Fbatch_api_product_123%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22quantity_to_sell_on_facebook%22%3A%2042%2C%0A%20%20%20%20%20%20%20%20%20%20%22material%22%3A%20%22stainless%20steel%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22mpn%22%3A%20%22twp123%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22ordering_index%22%3A%200%2C%0A%20%20%20%20%20%20%20%20%20%20%22origin_country%22%3A%20%22JP%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22pattern%22%3A%20%22stripes%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22product_type%22%3A%20%22Widgets%20%3E%20Metal%20Widgets%20%3E%20Striped%20Metal%20Widgets%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22rating_count%22%3A%201002132%2C%0A%20%20%20%20%20%20%20%20%20%20%22sale_price%22%3A%20%2211%20GBP%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22sale_price_effective_date%22%3A%20%222025-11-01T12%3A00-0300%2F2025-12-01T00%3A00-0300%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22size%22%3A%20%22Small%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22shipping%22%3A%20%22US%3ACA%3AGround%3A9.99%20USD%2CUS%3ANY%3AAir%3A15.99%20USD%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22title%22%3A%20%22Test%20Product%20Name%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22user_rating%22%3A%204.5%2C%0A%20%20%20%20%20%20%20%20%20%20%22vendor_id%22%3A%20%22marketplace_id_product_123%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22availability%22%3A%20%22in%20stock%22%2C%0A%20%20%20%20%20%20%20%20%20%20%22internal_label%22%3A%20[%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22Literary%20Girl%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22Another%20tag%22%0A%20%20%20%20%20%20%20%20%20%20]%2C%0A%20%20%20%20%20%20%20%20%20%20%22video%22%3A%20[%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22url%22%3A%20%22https%3A%2F%2Fwebsite.com%2Fp123.mpg%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22tag%22%3A%20[%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22steel%22%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%22widget%22%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20%20]%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20%7D%0A%20%20%20%20%20%20%20%20%20%20]%0A%20%20%20%20%20%20%7D%0A%20%20%7D%0A]&item_type=PRODUCT_ITEM)
| Updating the price, images and other properties of an item with item_type=PRODUCT_ITEM and id=‘batch_api_product_123’ |
| --- |
| Request |
| ↳<br><br>```
curl -i -X POST \
   https://graph.facebook.com/<catalog-id>/items_batch \
   -F access_token=PASS_VALID_API_TOKEN_HERE \
   -F 'requests=[
       {
           "method":"UPDATE",
           "data":{
               "unknown_field": "unknown_field_value",
               "id": "batch_api_product_123",
               "item_group_id": "g1",
               "price": "14 GBP",
               "image": [
                   {
                       "url": "http://example.com/image4.jpg",
                       "tag": [
                       "t1",
                       "t2"
                       ]
                   },
                   {
                       "url": "http://example.com/image5.jpg",
                       "tag": [
                       "t1",
                       "t2"
                       ]
                   }
               ],
               "additional_variant_attribute": "Scent:Fruity,Flavor:Apple",
               "age_group": "adult",
               "applink": {
                   "android_url": "a://b/c",
                   "android_package": "android.topwidgets",
                   "android_app_name": "TopWidgets",
                   "ios_url": "d://e/f",
                   "ios_app_store_id": "123456",
                   "ios_app_name": "TopWidgets"
               },
               "brand": "Top Widgets",
               "color": "yellow",
               "condition": "new",
               "custom_label_0": "label1",
               "custom_number_0": 2022,
               "description": "Test description.",
               "rich_text_description": "<b>Test</b> <u>description</u>.",
               "disabled_capabilities": [
                   "marketplace",
                   "b2c_marketplace"
               ],
               "fb_product_category": "Apparel & Accessories > Clothing > Suits > Tuxedos",
               "gender": "unisex",
               "google_product_category": "543586",
               "gtin": "7798102151036",
               "expiration_date": "2030-01-01",
               "link": "http://example.com/product.html",
               "importer_address": {
                   "street1": "1 Hacker Way",
                   "street2": "Building 18",
                   "city": "Menlo Park",
                   "region": "OK",
                   "postal_code": "94025",
                   "country": "US"
               },
               "importer_name": "Top Widgets",
               "mobile_link": "https://m.example.com/products/batch_api_product_123",
               "quantity_to_sell_on_facebook": 42,
               "material": "stainless steel",
               "mpn": "twp123",
               "ordering_index": 0,
               "origin_country": "JP",
               "pattern": "stripes",
               "product_type": "Widgets > Metal Widgets > Striped Metal Widgets",
               "rating_count": 1002132,
               "sale_price": "11 GBP",
               "sale_price_effective_date": "2025-11-01T12:00-0300/2025-12-01T00:00-0300",
               "size": "Small",
               "shipping": [
                   {
                       "shipping_country": "US",
                       "shipping_region": "CA",
                       "shipping_service": "Pick-up point",
                       "shipping_price_value": "4.90",
                       "shipping_price_currency": "USD"
                   },
                   {
                       "shipping_country": "US",
                       "shipping_region": "CA",
                       "shipping_service": "Home delivery",
                       "shipping_price_value": "7.90",
                       "shipping_price_currency": "USD"
                   }
               ],
               "title": "Test Product Name",
               "user_rating": 4.5,
               "vendor_id": "marketplace_id_product_123",
               "availability": "in stock",
               "internal_label": [
                   "Literary Girl",
                   "Another tag"
               ],
               "video": [
                   {
                       "url": "https://example.com/p123.mpg",
                       "tag": [
                       "steel",
                       "widget"
                       ]
                   }
               ]
           }
       }
   ]' \
   -F item_type=PRODUCT_ITEM
``` |
| Response |
| ↳<br><br>```
{
   "handles": [
"Acy_OJLm4aVJdxiRegHfiyhleq26r_CNVRc1wFGnSj1YpFC8azbIc-UscwUxuCWPJXPaSOcFZQZuMAccdE4wn816"
   ],
   "validation_status": [
       {
           "warnings": [
               {
                   "message": "Unrecognised field: A request for item batch_api_product_123 contains unrecognised field: 'unknown_field'"
               }
           ],
           "retailer_id": "batch_api_product_123"
       }
   ]
}
``` |

