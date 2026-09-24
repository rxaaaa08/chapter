<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Product Set

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

 A product set is a group of related items in a product catalog.

## Reading

A call to this endpoint returns Product Set data.

### Examples

 To get a product set, send a `GET` request:

```
curl -i -X GET "https://graph.facebook.com/PRODUCT-SET-ID?access_token=ACCESS-TOKEN"

```

#### Parameters

 This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `id`<br>*numeric string* | ID of the product set. <br>default |
| `auto_creation_url`<br>*string* | URL scraped to create a product set. |
| `filter`<br>*string* | The filter rule that defines the set of products in the catalog <br>default |
| `latest_metadata`<br>*ProductSetMetadata* | Latest product set metadata |
| `live_metadata`<br>*ProductSetMetadata* | Live product set metadata, which passed integrity review |
| `name`<br>*string* | The name given by the owner of this product set <br>default |
| `product_catalog`<br>*[ProductCatalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog)* | Product catalog for this product set |
| `product_count`<br>*unsigned int32* | Count of products in this product set |
| `retailer_id`<br>*string* | Retailer's ID for the product set. <br>default |

#### Edges

| Edge | Description |
| --- | --- |
| [`automotive_models`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set/automotive_models)<br>*Edge<AutomotiveModel>* | Automotive models in a product set |
| [`destinations`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set/destinations)<br>*Edge<Destination>* | Destinations that belong to this product set |
| [`flights`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set/flights)<br>*Edge<Flight>* | Flights that belong to this product set |
| [`home_listings`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set/home_listings)<br>*Edge<HomeListing>* | Home listings that belong to this product set |
| [`hotels`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set/hotels)<br>*Edge<Hotel>* | Hotels that belong to this product set |
| [`products`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set/products)<br>*Edge<ProductItem>* | Product items that belong to this product set |
| [`vehicle_offers`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set/vehicle_offers)<br>*Edge<VehicleOffer>* | Vehicle offers that belong to this set |
| [`vehicles`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set/vehicles)<br>*Edge<Vehicle>* | Vehicles that belong to this set |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 80009 | There have been too many calls to this Catalog account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting. |
| 190 | Invalid OAuth 2.0 Access Token |
| 104 | Incorrect signature |

## Creating

### /{product_catalog_id}/product_sets

 You can make a POST request to *product_sets* edge from the following paths:

* [/{product_catalog_id}/product_sets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_sets)

 When posting to this edge, a [ProductSet](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set) will be created.

#### Example

Select language

HTTPPHP SDKJavaScript SDKAndroid SDKiOS SDKcURL

**

---

```
POST /v25.0/<PRODUCT_CATALOG_ID>/product_sets HTTP/1.1
Host: graph.facebook.com

name=Test+Set&filter=%7B%22product_type%22%3A%7B%22i_contains%22%3A%22shirt%22%7D%7D

```

 Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=POST&path=%3CPRODUCT_CATALOG_ID%3E%2Fproduct_sets%3Fname%3DTest%2BSet%26filter%3D%257B%2522product_type%2522%253A%257B%2522i_contains%2522%253A%2522shirt%2522%257D%257D&version=v25.0)

 If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `filter`<br>*A JSON-encoded rule* | Filter rules to define a product set (max length: 500 KiB) |
| `metadata`<br>*JSON object* | Product set metadata, which can be used for creating product collections --- `cover_image_url` *URI* cover_image_url `description` *string* description `external_url` *URI* external_url `external_url_handle` *string* external_url_handle Show child parameters |
| `name`<br>*UTF-8 encoded string* | Name of the product set required |
| `publish_to_shops`<br>*array<JSON object>* | Shop ids where this product set should be published as collection. --- `shop_id` *numeric string* shop_id `ordering_index` *int64* ordering_index Show child parameters |
| `retailer_id`<br>*UTF-8 encoded string* | External product set retailer id |

#### Return Type

 This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```

Struct  {
id: numeric string,
}

```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 10803 | Product set with the same filters already exists |
| 100 | Invalid parameter |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 415 | Two factor authentication required. User have to enter a code from SMS or TOTP code generator to pass 2fac. This could happen when accessing a 2fac-protected asset like a page that is owned by a 2fac-protected business manager. |
| 190 | Invalid OAuth 2.0 Access Token |
| 200 | Permissions error |
| 80009 | There have been too many calls to this Catalog account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting. |

---

## Updating

 Update an existing product set.

### Example

To update a product set, send a `POST` request:

```
curl -i -X "https://graph.facebook.com/PRODUCT-SET-ID?name=Product Set Name,filter={'product_type': {'contains': 'shirt'}},access_token=ACCESS-TOKEN"

```

### /{product_set_id}

 You can update a [ProductSet](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set) by making a POST request to [/{product_set_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set).

#### Parameters

| Parameter | Description |
| --- | --- |
| `filter`<br>*A JSON-encoded rule* | Filter rules to define a product set (max length: 500 KiB) |
| `metadata`<br>*JSON object* | Product set metadata, which can be used for creating product collections --- `cover_image_url` *URI* cover_image_url `description` *string* description `external_url` *URI* external_url `external_url_handle` *string* external_url_handle Show child parameters |
| `name`<br>*UTF-8 encoded string* | Name of the product set |
| `publish_to_shops`<br>*array<JSON object>* | List of shop ids where this product set should be published as collection. --- `shop_id` *numeric string* shop_id `ordering_index` *int64* ordering_index Show child parameters |
| `retailer_id`<br>*UTF-8 encoded string* | External product set retailer id |

#### Return Type

 This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```

Struct  {
id: numeric string,
}

```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 10803 | Product set with the same filters already exists |
| 80009 | There have been too many calls to this Catalog account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting. |
| 200 | Permissions error |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 415 | Two factor authentication required. User have to enter a code from SMS or TOTP code generator to pass 2fac. This could happen when accessing a 2fac-protected asset like a page that is owned by a 2fac-protected business manager. |

---

## Deleting

### /{product_set_id}

 You can delete a [ProductSet](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set) by making a DELETE request to [/{product_set_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set).

 By default a product set can not be deleted while it is being used in an active ad, shop collection, or other usages. To override this behavior, include `allow_live_product_set_deletion=true` in your request.

#### Parameters

| Parameter | Description |
| --- | --- |
| `allow_live_product_set_deletion`<br>*boolean* | <br>**Default value: **`false` Flag to allow the deletion of live product set |

#### Return Type

```

Struct  {
success: bool,
}

```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 801 | Invalid operation |
| 100 | Invalid parameter |
| 200 | Permissions error |

---

## Filter Rules

Creating a product set with an empty `filter` parameter indicates that all items in the product catalog should be in the set. Each rule is a JSON-encoded string. An empty `filter` parameter can be specified using either an empty parameter value or an empty JSON object, `{}`.

**Recommendation:** Query with content type `application/json`.

### Limitations

* If the filter rules you set result in an empty product set, ads tied to this product set will not deliver.
* The `contains` operators can only be used for string matching when creating product sets. For `enum` values use the `eq` operators.
* Filter operators are not case sensitive. However, `i_*` operators can still be used.
* You can’t use non-English Unicode characters for filters in labels.

For a full list of limitations and examples, along with useful tips about how to use punctuation characters to create and manage product sets, [see this Business Help Center article](https://www.facebook.com/business/help/741923962861190)

Filter rules contain fields and operators in the following syntax:

```
curl -i -X POST "https://graph.facebook.com/PRODUCT-SET-ID?
    name=Product Set Name,
    filter={'field-name': {'operator-type': 'query-value'}},
    access_token=ACCESS-TOKEN"

```

### Fields

| Field | Description |
| --- | --- |
| `age_group` enum {adult, infant, kids, newborn, toddler} | The target age group for an item. |
| `agent_fb_page_id` int | The Facebook Page ID for the real estate agent. |
| `app_category` enum {Games, Productivity, Social, Entertainment, Education, Utilities, Lifestyle, Health & Fitness, Business, Other} | The type of application. |
| `app_subcategory` string | The subcategory of the application, such as arcade game. |
| `awards` string | Notable awards or nominations. |
| `availability`**Home Listings** – For Dynamic Ads enum {available_soon, for_sale, for_rent, off_market, recently_sold, sale_pending} **Home Listings** – For Marketplace enum {for_rent} **Product Items** enum {available for order, in stock, preorder, out of stock} **Vehicles** enum {available, not_available} | The availability for an item, home listing, or vehicle. Note: Vehicles that are unavailable in an ad are not visible to the public. |
| `base_price_amount` int | The base price per night for a hotel. `base_price` and `base_price_currency` are required. |
| `body_style` enum {CONVERTIBLE, COUPE, CROSSOVER, HATCHBACK, MINIVAN, TRUCK, SEDAN, SMALL_CAR, SUV, VAN, WAGON, OTHER} | The body style of a vehicle. For Marketplace and dynamic ads. |
| `brand` string | The brand of a product item, hotel, media title, or app. |
| `cast` string | Actors in the production. |
| `category` string | The category of the product item. |
| `city` string | The city where a hotel, destination, automobile dealership, or home listing is located. |
| `city_id` int | The city ID where a hotel, destination, automobile dealership, or home listing is located. |
| `city_page_id` string | The value to use in a deep link URL (`template_URL`) in ad creative. |
| `color` string | The color of an item. |
| `condition` For Product Items enum {new, refurbished, used} For Vehicles enum {Excellent, Good, Fair, Poor, Other} | The condition of a product item or vehicle. |
| `content_rating` string | Official content rating of the item. |
| `country` string | The country where a hotel, home listing, automobile dealership, or destination is located. |
| `currency` string | The [alpha currency code](https://en.wikipedia.org/wiki/ISO_4217). |
| `custom_label_0` string | The value for a custom label of a product item, hotel, destination, vehicle, home listing, media title, or app. |
| `custom_label_1` string | The value for a custom label of a product item, hotel, destination, vehicle, home listing, media title, or app. |
| `custom_label_2` string | The value for a custom label of a product item, hotel, destination, vehicle, home listing, media title, or app. |
| `custom_label_3` string | The value for a custom label of a product item, hotel, destination, vehicle, home listing, media title, or app. |
| `custom_label_4` string | The value for a custom label of a product item, hotel, destination, vehicle, home listing, media title, or app. |
| `date_first_on_lot` string | The date a vehicle first arrived at the dealership in YYYY-MM-DD format. For example, 2018-09-05. |
| `date_first_on_lot_time` string | The date and time a vehicle first arrived at the dealership. |
| `days_on_market` int | The number of days a home listing has been on the open market. |
| `dealer_communication_channel` enum {CHAT, LEAD_FORM} | The method which an automobile dealer will use to contact a buyer. `LEAD_FORM` is subject to regional availability and defaults to `CHAT` when not available. |
| `dealer_id` string | The alphanumeric ID for an automobile dealership. |
| `dealer_name` string | The name for the automobile dealership. |
| `drivetrain` enum {4X2, 4X4, AWD, FWD, RWD, Other} | The drivetrain for a vehicle. |
| `description` string | The description for a flight, home listing, or destination, media title, or app. |
| `destination_airport` string | The [IATA code](https://www.iata.org/en/publications/directories/code-search/?fbclid=IwAR0Wx0aRGdKX5jTdg6izI0WTr9CGNDZ-i-bPTsfeQoRkXfNByaTyJ9zuY6A) for the destination airport. For example, HKG, LAX, or LHR. |
| `destination_city` string | The name of the destination city. For example, London, New York, or Tokyo. |
| `destination_id` string | The unique ID for a [destination](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/catalog#destination-feed) within a catalog. This ID is also used for the `content_id` parameter in your destination app and pixel events. |
| `developer` string | The name of the developer of the app or software. |
| `director` string | A director of the production. |
| `exterior_color` string | The exterior color for a vehicle. |
| `featuring` string | Key individuals involved in the production, such as artists or producers. |
| `feed_id` string | The Facebook ID for the [feed](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed) in which the product belongs. |
| `flight_id` string | The unique ID for a flight. |
| `fuel_type` enum {DIESEL, ELECTRIC, GASOLINE, FLEX, HYBRID, OTHER} | The type of fuel designated for a vehicle. |
| `furnish_type` enum {furnished, semi-furnished, unfurnished} | The type of furnishing available for a home listing. |
| `gender` enum {female, male, unisex} | The gender for the product item. |
| `genre` string | The genre or style, such as action, comedy, or puzzle. |
| `home_listing_id` string | The unique ID for a home listing. |
| `hotel_id` string | The unique ID for a hotel within a catalog. This ID is also used for the `content_id` parameter in your hotel app and pixel events. |
| `image_tags` string | URLs and tags to describe images that are used in ads. Multiple tags can be associated with an image. For example, “Fitness Center”, “Swimming Pool”, or “Parking”. For vehicles, follow this naming convention: `(image[0].url`, `image[0].tag[0]`, `image[0].tag[1])` where the tag value is incremented for each additional tag. When using a CSV/TSV file, use either an image header, `image[0].url`, `image[1].url`, and so on, or a JSON flatten string, `"[{url:'https://images.com/1.jpg'},{url:'https://images.com/2.jpg'}]"`. |
| `interior_color` string | The interior color for a vehicle. |
| `listing_type` For Dymanic Ads enum {for_rent_by_agent, for_rent_by_owner, for_sale_by_agent, for_sale_by_owner, foreclosed, new_construction, new_listing} For Marketplace enum {for_rent_by_agent, for_rent_by_owner} | The type of listing for a home. |
| `make` string | The brand of a vehicle. For example, Ford, Toyota, or Kia. |
| `margin_level` int | An indicator for the profitability of a hotel from `1` to `10`. |
| `market_id` int | The market where an offer is eligible. Use for TWO FEED use case, to correspond with the market feed. For regional offers, this field is required and should match the `market_id` provided in the market feed. For national offers (offers applicable to all of the U.S.), this field should be empty. |
| `material` string | The material or fabric that a product is made of such as cotton, denim, or nylon. |
| `media_category` enum {Movie, Music, TV Show, Other} | The content category of the media title. |
| `mileage_unit` enum {KM, MI} | The mileage unit of a vehicle in kilometers or miles. |
| `mileage_value` int | The current mileage for a vehicle, in miles or kilometers. For new vehicles, use `0`. Vehicles on Marketplace must have over 500 miles or kilometers. |
| `model` string | The model for a vehicle such as “Ford Focus” where “Focus” is the model. |
| `name` string | The name for a product item, hotel, home listing, destination, media title, or app. |
| `neighborhood` string | The neighborhood where a hotel or home listing is located. If there’s more than one neighborhood, add additional columns for each one and use JSON-path syntax in each column name to indicate the number of neighborhoods. |
| `neighborhood_id` string | The neighborhood ID for a product item. |
| `num_baths` int | The total number of bathrooms for a home listing. Must be `1` at a minimum. |
| `num_beds` int | The total number of bedrooms for a home listing. Can be `0` for a studio. |
| `number_of_raters` int | The number of people who rated a hotel. |
| `num_of_valid_guest_rating` string | Total number ratings for a hotel made by valid guests. |
| `num_rooms` int | The total number of rooms for a home listing. |
| `num_units` int | The total number of units available in an apartment or condo building. |
| `offer_type` enum {cash, finance, lease} | The type of offer for a home listing or vehicle. |
| `one_way_price` string | One-way price for a flight. The currency must be specified, for example, `99.99 USD`. |
| `origin_airport` string | The [IATA code for the airport](https://www.iata.org/en/publications/directories/code-search/?fbclid=IwAR0Wx0aRGdKX5jTdg6izI0WTr9CGNDZ-i-bPTsfeQoRkXfNByaTyJ9zuY6A) where the flight originated. |
| `origin_city` | The name of the city where the flight originated. |
| `pattern` string | The pattern or graphic print featured on a product. For example, “solid”, “striped”, or “polka dots”. |
| `postal_code` int | The postal or zip code for a hotel, home listing, or automobile dealership location. Optional for countries without a postal code system. |
| `postal_codes` list | A list of postal codes for a specific market for vehicle offer ads. |
| `price` float | The price for a flight, home listing, vehicle, or destination. The `currency` field is required. |
| `price_amount` int | The price multiplied by 100, for all currencies. For example, $4.90USD will be `490` and ¥490JPY will be `49000`. |
| `price_change` string | The price change for a destination. For example, `0` for no price change, `–10` for a 10% price decrease, and `20` for a 20% price increase. |
| `priority` int | The priority of a flight or hotel. Values from `0` (lowest priority) to `5` (highest priority). A flight without a value defaults to `0`. |
| `production_company` string | The production company or studio that created the media title. |
| `product_expiration_time` | The date and time when the product is no longer available. Ads will only fetch products that have not expired. For example, if the expiration date is today, after today this product will no longer appear in ads. |
| `product_feed_id` int | The Facebook ID for the [product feed](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed) for a product item, flight, hotel, home listing, vehicle, vehicle offer, or destination. |
| `product_group_id` int | The Facebook ID for the [product group](https://developers.facebook.com/docs/marketing-api/reference/product-group) of a product item. |
| `product_item_id` int | The Facebook ID for a [product item](https://developers.facebook.com/docs/marketing-api/reference/product-item). |
| `product_type` string | The category for a product item defined by the retailer. |
| `property_type` For Dynamic Ads enum {apartment, condo, house, land, manufactured, townhouse, other} For Marketplace enum {apartment, builder_floor, condo, house, house_in_condominium, house_in_villa, loft, penthouse, studio, townhouse, other} | The property type for a home listing. |
| `rating_system` string | The rating system used for [`guest_rating`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/template-tags). For example, “Expedia”, or “TripAdvisor”. |
| `region` string | The state, county, region, or province for a home listing or automobile dealership. |
| `region_id` unsigned int32 | The region ID for the [location](https://developers.facebook.com/docs/graph-api/reference/location) for a product item or automobile dealership. |
| `release_date` string | The release date of the media title in `YYYY-MM-DD` format. |
| `release_date_time` string | The release date and time of the media title. |
| `retailer_id` string | The retailer-provided unique identifier for a product item, media title, or app. |
| `retailer_product_group_id` int | The ID for a product group defined by the retailer. |
| `sale_price` int | The sale price or special price for a vehicle. |
| `sale_price_amount` int | The sale price for a product item (same format as `price_amount`). For hotels, the discounted sale price for a hotel stay, based on [`checkin_date` and `length_of_stay`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/catalog). |
| `score` float | The [rating score for a hotel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/catalog#guest_ratings-object). |
| `size` string | The size for a product item such as for clothing or shoes. |
| `star_rating_float` float | The [star rating for a hotel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/catalog#guest_ratings-object). |
| `state_of_vehicle` enum {New, Used, CPO} | The current state of a vehicle. |
| `tags` string | Tags for product organization. |
| `title` string | The full name for a vehicle including year, make, model, and trim. Maximum of 500 characters. For example, `2014 Nissan Versa Note S Hatchback 4D`. |
| `transmission` enum {Automatic, Manual} | The transmission type for a vehicle. |
| `trim` string | The trim for a vehicle: `5DR HB SE` Max characters: 50. |
| `url` string | The link to an external site where you can view a flight. Deep links specified on the ad level take precedence. |
| `vehicle_ID` int | The unique ID for a vehicle. This ID is also used for the `content_id` parameter in the pixel. If the same ID is used in multiple instances, all instances are ignored. For vehicle offers, it is the ID that advertisers can use to identify an offer. |
| `vehicle_registration_plate` string | A metal or plastic plate attached to a motor vehicle or trailer for official identification purposes. For Marketplace, a vehicle registration plate is required in Brazil, France, and the United Kingdom. |
| `vehicle_type` enum {car_truck, boat, commercial, motorcycle, powersport, rv_camper, trailer, other} | The type of vehicle. `car_truck` is the default value. |
| `vendor_ID` int | The ID for a vendor. |
| `videos_fetch_status` string | The fetch status of associated videos. |
| `vin` int | The vehicle identification number. The VIN must be exactly 17 characters and is required in all countries where Marketplace is available with the exception of pre-1983 vehicles. In Brazil, France, and the United Kingdom, a vehicle registration plate is required instead of a VIN. |
| `visibility` enum {published, staging, hidden, whitelist_only} | Visibility for a product item. Items in `staging` mode are not visible to buyers and are not available for product tagging on Instagram or in dynamic ads. |
| `year` int | The model year for a vehicle, in YYYY format. |

### Operators

[Starting March 3, 2022](https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/mar-3-2022), we changed how certain filters work for product sets. These include the `contains`, `not_contains`, `lt`, `gt`, `lte`, `gte`, and `starts_with` filters. You have 90 days to update your filters. If any sets in your catalog are using the affected filters after June 1, 2022, the items in those sets may change. This means that different items could display in your ads or shops that use those sets. See [the changelog](https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/mar-3-2022) for more details.

| Operator | Type of filter |
| --- | --- |
| `and` | Returns products that match all query values inclusively. For example, `"color": {"red" and "shoe" and "running"}` will only return products that match all 3 query values, such as “red running shoe”. |
| `contains` | Returns products that match a query string. For example, `category: {"contains": "running shoe"}` will return all products that contain the query string, such as “red running shoe”, “blue running shoe”, and “running shoe for kids”. |
| `or` | Returns products that match only one query value exclusively. For example, `category: {"running" or "walking"}` will return products that match “running” or “walking” but not both. |
| `not_contains` | Returns products that do not match a query string. For example, `category: {"not_contains": running shoe"}` will return all products that do not contain the query string, such as “red walking shoe”, “sandals”, and “boots”. |
| `is_any` | Returns products that match any value in a list of query values. For example, `"color": {"is_any": "black", "blue", "brown"}` will return any product that matches at least one query string, such as “black boots”, “blue boots”, “brown boots”. |
| `is_not_any` | Returns products that do not match any value in a list of query strings. For example, `"color": {"is_not_any": "black", "blue", "brown"}` will return any products that do not match any of the query values, such as “red boots”, “yellow boots”, and “green boots”. |
| `eq` | Returns products that exactly match a query value. For example, `"brand": {"eq": "Instagram"}` will only match “Instagram” brand products. |
| `neq` | Returns products that do not exactly match a query value. For example, `"brand": {"neq": "Instagram"}` will only match products that are not “Instagram” brand products. |
| `lt` int | Returns products that are less than a numeric query value. For example, `"priority": {"lt": 3}` will only match products with a priority that is less than 3. |
| `lte` int | Returns products that are less than or equal to a numeric query value. For example, `"priority": {"lte": 3}` will only match products with a priority that is less than or equal to 3. |
| `gt` int | Returns products that are greater than a numeric query value. For example, `"priority": {"gt": 3}` will only match products with a priority that is greater than 3. |
| `gte` int | Returns products that are greater than or equal to a numeric query value. For example, `"priority": {"gte": 3}` will only match products with a priority that is greater than or equal to 3. |
| `starts_with` | Returns products that match any string that starts with the query string. For example, `"small"` will return any product that starts with the query string, such as “small sandals”, “small t-shirt”, “small, blue boots”. **Note**: This filter option is now only available for the product category field. For other fields, you should use the `contains` filter. |

### Filter Examples

The following example creates a product set with all products listed in the Luggage & Bags category in the product catalog.

*Formatted for readability.*

```
curl -i -X POST "https://graph.facebook.com/PRODUCT-CATALOG-ID/product_sets
    ?name=Product Set Name
    &filter={'category': {'eq': 'Luggage & Bags'}}
    &access_token=ACCESS-TOKEN"
```

The following example creates a product set with all shirts listed the product catalog.

*Formatted for readability.*

```
curl -i - X POST "https://graph.facebook.com/PRODUCT-CATALOG-ID/product_sets
    ?name=Product Set Name
    &filter={'product_type': {'contains': 'shirt'}}
    &access_token=ACCESS-TOKEN"
```
