<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog | Saved: 2026-09-19 -->

# Product Catalog



Represents a catalog for your business you can use to deliver ads with [dynamic ads](https://developers.facebook.com/docs/marketing-api/dynamic-ad).

**Example** — View all product catalogs associated to your business

```
curl -G \
  -d "access_token=<ACCESS_TOKEN>" \
  "https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/owned_product_catalogs"
```

You can associate pixels and apps with a product catalog and then display products in ads based on signals from pixels or apps.

**Example** — Make an `HTTP POST`

```
curl \
  -F 'external_event_sources=[<PIXEL_ID>,<APP_ID>]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<VERSION>/<PRODUCT_CATALOG_ID>/external_event_sources
```

## Permissions

You need the appropriate [Marketing API Access Level](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization#limits) and must accept the [Terms of Service](https://business.facebook.com/legal/product_catalog_terms/) by creating your first catalog through [Business Manager](https://business.facebook.com).

## Reading

Product catalogs contain a list of items like products, hotels or flights, and the information needed to display them in dynamic ads

#### Parameters

| Parameter | Description |
| --- | --- |
| `segment_use_cases`<br><br>*array<enum {AFFILIATE_SELLER_STOREFRONT, AFFILIATE_TAGGED_ONLY_DEPRECATED, COLLAB_ADS, COLLAB_ADS_FOR_MARKETPLACE_PARTNER, COLLAB_ADS_SEGMENT_WITHOUT_SEGMENT_SYNCING, DIGITAL_CIRCULARS, FB_LIVE_SHOPPING, IG_SHOPPING, IG_SHOPPING_SUGGESTED_PRODUCTS, MARKETPLACE_SHOPS, TEST}>* | segment_use_cases<br> |

#### Fields

| Field | Description |
| --- | --- |
| `id`<br><br>*numeric string* | ID of a catalog<br><br><br>**[default]**<br> |
| `business`<br><br>*[Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business)* | Business that owns a catalog<br> |
| `da_display_settings`<br><br>*[ProductCatalogImageSettings](https://developers.facebook.com/docs/marketing-api/reference/product-catalog-image-settings)* | Image display  settings such as background cropping and padding of items in the  catalog for different Dynamic Ad formats<br> |
| `default_image_url`<br><br>*string* | The URL for the default image, which is used for products without images, or when the product image is temporarily unavailable. If a product image matches the default image,  this should be treated as if the image was not loaded<br> |
| `fallback_image_url`<br><br>*list<string>* | The URL for the fallback image. This is used as   the image for auto-generated dynamic items<br> |
| `feed_count`<br><br>*int32* | The total number of feeds used by a catalog<br> |
| `is_catalog_segment`<br><br>*bool* | Verify that you will create ads based on a catalog or catalog segment before you try to create Dynamic Ads. Call this field and determine value otherwise you may get and error when you try to create Dynamic Ads from catalog segments.<br> |
| `is_local_catalog`<br><br>*bool* | is_local_catalog<br> |
| `name`<br><br>*string* | The name of a catalog given by the creator<br><br><br>**[default]**<br> |
| `product_count`<br><br>*int32* | The total number of products in a catalog<br> |
| `vertical`<br><br>*enum* | The type of catalog (for example: hotels, commerce, etc)<br> |

#### Edges

| Edge | Description |
| --- | --- |
| [`agencies`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/agencies)<br><br>*Edge<Business>* | Agencies that have access to a catalog<br> |
| [`assigned_users`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/assigned_users)<br><br>*Edge<AssignedUser>* | Users assigned to this catalog<br> |
| [`automotive_models`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/automotive_models)<br><br>*Edge<AutomotiveModel>* | Automotive models that a catalog contains<br> |
| [`categories`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/categories)<br><br>*Edge<ProductCatalogCategory>* | Categories within the catalog for a given categorization criteria<br> |
| [`check_batch_request_status`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/check_batch_request_status)<br><br>*Edge<CheckBatchRequestStatus>* | Checks the status of a batch request<br> |
| [`collaborative_ads_share_settings`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/collaborative_ads_share_settings)<br><br>*Edge<CollaborativeAdsShareSettings>* | All the collaborative ads share settings for a catalog segment<br> |
| [`data_sources`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/data_sources)<br><br>*Edge<ProductCatalogDataSource>* | data_sources updating catalog including feeds, session containers etc<br> |
| [`destinations`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/destinations)<br><br>*Edge<Destination>* | Destinations that a catalog contains<br> |
| [`diagnostics`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/diagnostics)<br><br>*Edge<ProductCatalogDiagnosticGroup>* | diagnostics<br> |
| [`event_stats`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/event_stats)<br><br>*Edge<ProductEventStat>* | Aggregated statistics on the matched and unmatchd events received from the pixels and apps associated to the catalog, broken down by DA event, source and device_type<br> |
| [`external_event_sources`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/external_event_sources)<br><br>*Edge<ExternalEventSource>* | External event sources (including pixels) for catalog events like ViewContent<br> |
| [`flights`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/flights)<br><br>*Edge<Flight>* | Flights that a catalog contains<br> |
| [`home_listings`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/home_listings)<br><br>*Edge<HomeListing>* | Home listings that a catalog contains<br> |
| [`hotel_rooms_batch`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/hotel_rooms_batch)<br><br>*Edge<ProductCatalogHotelRoomsBatch>* | Batch operations with hotel rooms<br> |
| [`hotels`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/hotels)<br><br>*Edge<Hotel>* | Hotels that a catalog contains<br> |
| [`pricing_variables_batch`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/pricing_variables_batch)<br><br>*Edge<ProductCatalogPricingVariablesBatch>* | Batch operations with hotel room prices<br> |
| [`product_groups`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_groups)<br><br>*Edge<ProductGroup>* | Product groups that a catalog contains<br> |
| [`product_sets`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_sets)<br><br>*Edge<ProductSet>* | Product sets belonging to a catalog<br> |
| [`product_sets_batch`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_sets_batch)<br><br>*Edge<ProductCatalogProductSetsBatch>* | Batch operations with product sets<br> |
| [`products`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/products)<br><br>*Edge<ProductItem>* | Products that a catalog contains<br> |
| [`vehicle_offers`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/vehicle_offers)<br><br>*Edge<VehicleOffer>* | Vehicle offers that a catalog contains<br> |
| [`vehicles`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/vehicles)<br><br>*Edge<Vehicle>* | Vehicles that a catalog contains<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 190 | Invalid OAuth 2.0 Access Token |
| 200 | Permissions error |
| 2500 | Error parsing graph query |

## Creating

### Examples {#create_example}

```
curl \
  -F 'name=Catalog' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/product_catalogs
```

### /{product_catalog_id}/assigned_users
You can make a POST request to *assigned_users* edge from the following paths:

- [/{product_catalog_id}/assigned_users](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/assigned_users)

When posting to this edge, a [ProductCatalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `tasks`<br><br>*array<enum {MANAGE, ADVERTISE, MANAGE_AR, AA_ANALYZE}>* | Catalog permission tasks to assign this user<br><br>**[required]**<br> |
| `user`<br><br>*UID* | Business user id or system user id<br><br>**[required]**<br> |

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
| 100 | Invalid parameter |
| 200 | Permissions error |
| 415 | Two factor authentication required. User have to enter a code from SMS or TOTP code generator to pass 2fac. This could happen when accessing a 2fac-protected asset like a page that is owned by a 2fac-protected business manager. |

### /{product_catalog_id}/vehicles
You can make a POST request to *vehicles* edge from the following paths:

- [/{product_catalog_id}/vehicles](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/vehicles)

When posting to this edge, a [ProductCatalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `address`<br><br>*JSON object* | address<br><br>**[required]**<br><br><br>`city` *string*<br><br>**Default value: **`""`<br>city<br><br><br>`city_id` *string*<br>city_id<br><br><br>`country` *string*<br><br>**Default value: **`""`<br>country<br><br><br>`latitude` *float*<br>latitude<br><br><br>`longitude` *float*<br>longitude<br><br><br>`neighborhoods` *array<string>*<br>neighborhoods<br><br><br>`postal_code` *string*<br><br>**Default value: **`""`<br>postal_code<br><br><br>`region` *string*<br><br>**Default value: **`""`<br>region<br><br><br>`street_address` *string*<br><br>**Default value: **`""`<br>street_address<br> |
| `applinks`<br><br>*Object* | applinks<br><br><br>`web` **<br><br>`android` **<br><br>`ios` **<br><br>`ipad` **<br><br>`iphone` **<br><br>`windows_phone` ** |
| `availability`<br><br>*enum {AVAILABLE, NOT_AVAILABLE, PENDING, UNKNOWN}* | availability<br> |
| `body_style`<br><br>*enum {CONVERTIBLE, COUPE, CROSSOVER, ESTATE, GRANDTOURER, HATCHBACK, MINIBUS, MINIVAN, MPV, PICKUP, ROADSTER, SALOON, SEDAN, SMALL_CAR, SPORTSCAR, SUPERCAR, SUPERMINI, SUV, TRUCK, VAN, WAGON, OTHER, NONE}* | body_style<br><br>**[required]**<br> |
| `condition`<br><br>*enum {EXCELLENT, VERY_GOOD, GOOD, FAIR, POOR, OTHER, NONE}* | condition<br> |
| `currency`<br><br>*ISO 4217 Currency Code* | currency<br><br>**[required]**<br> |
| `date_first_on_lot`<br><br>*string* | date_first_on_lot<br> |
| `dealer_id`<br><br>*string* | dealer_id<br> |
| `dealer_name`<br><br>*string* | dealer_name<br> |
| `dealer_phone`<br><br>*string* | dealer_phone<br> |
| `description`<br><br>*string* | description<br><br>**[required]**<br> |
| `drivetrain`<br><br>*enum {TWO_WD, FOUR_WD, AWD, FWD, RWD, OTHER, NONE}* | drivetrain<br> |
| `exterior_color`<br><br>*string* | exterior_color<br><br>**[required]**<br> |
| `fb_page_id`<br><br>*string* | fb_page_id<br> |
| `fuel_type`<br><br>*enum {DIESEL, ELECTRIC, GASOLINE, FLEX, HYBRID, OTHER, PETROL, PLUGIN_HYBRID, NONE}* | fuel_type<br> |
| `images`<br><br>*list<Object>* | images<br><br>**[required]**<br><br><br>`image_url` *URL*<br>**[required]**<br><br><br>`tags` *list<string>* |
| `interior_color`<br><br>*string* | interior_color<br> |
| `make`<br><br>*string* | make<br><br>**[required]**<br> |
| `mileage`<br><br>*JSON object* | mileage<br><br>**[required]**<br><br><br>`unit` *enum {KILOMETERS, MILES}*<br><br>**Default value: **`"MILES"`<br>unit<br><br><br>`value` *int64*<br><br>**Default value: **`0`<br>value<br> |
| `model`<br><br>*string* | model<br><br>**[required]**<br> |
| `price`<br><br>*int64* | price<br><br>**[required]**<br> |
| `state_of_vehicle`<br><br>*enum {NEW, USED, CPO}* | state_of_vehicle<br><br>**[required]**<br> |
| `title`<br><br>*string* | title<br><br>**[required]**<br> |
| `transmission`<br><br>*enum {AUTOMATIC, MANUAL, OTHER, NONE}* | transmission<br> |
| `trim`<br><br>*string* | trim<br> |
| `url`<br><br>*URI* | url<br><br>**[required]**<br> |
| `vehicle_id`<br><br>*string* | vehicle_id<br><br>**[required]**<br> |
| `vehicle_type`<br><br>*enum {BOAT, CAR_TRUCK, COMMERCIAL, MOTORCYCLE, OTHER, POWERSPORT, RV_CAMPER, TRAILER}* | vehicle_type<br> |
| `vin`<br><br>*string* | vin<br><br>**[required]**<br> |
| `year`<br><br>*int64* | year<br><br>**[required]**<br> |

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
| 10800 | Duplicate retailer_id when attempting to create a store collection |
| 100 | Invalid parameter |
| 200 | Permissions error |

### /{business_id}/owned_product_catalogs
You can make a POST request to *owned_product_catalogs* edge from the following paths:

- [/{business_id}/owned_product_catalogs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_product_catalogs)

When posting to this edge, a [ProductCatalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `additional_vertical_option`<br><br>*enum {LOCAL_DA_CATALOG, LOCAL_PRODUCTS}* | Additional catalog configurations that does not introduce either new verticals or subverticals<br> |
| `business_metadata`<br><br>*JSON object* | business_metadata<br><br><br>`page_id` *numeric string*<br>page_id<br><br>**[required]**<br><br><br>`external_business_id` *string*<br>external_business_id<br> |
| `catalog_segment_filter`<br><br>*A JSON-encoded rule* | Provide filter for catalog to create a catalog segment.<br> |
| `da_display_settings`<br><br>*Object* | Dynamic Ads display settings.<br><br><br>`carousel_ad` *Object*<br>**[required]**<br><br><br>`transformation_type` *enum{background_cropping_and_padding, background_padding, none}*<br>**[required]**<br><br><br>`single_ad` *Object*<br>**[required]**<br><br><br>`transformation_type` *enum{background_cropping_and_padding, background_padding, none}*<br>**[required]**<br> |
| `destination_catalog_settings`<br><br>*JSON object* | Destination catalog settings.<br><br><br>`generate_items_from_pages` *boolean*<br><br>**Default value: **`false` |
| `flight_catalog_settings`<br><br>*JSON object* | Flight catalog settings.<br><br><br>`generate_items_from_events` *boolean*<br><br>**Default value: **`false` |
| `name`<br><br>*UTF-8 encoded string* | Name of the catalog.<br><br>**[required]**<br> |
| `parent_catalog_id`<br><br>*numeric string or integer* | Parent catalog ID.<br> |
| `partner_integration`<br><br>*JSON object* | Partner integration settings<br><br><br>`external_access_token` *string*<br>External access token<br><br><br>`external_merchant_id` *string*<br>External merchant identifier<br> |
| `store_catalog_settings`<br><br>*JSON object* | Store catalog settings.<br><br><br>`page_id` *numeric string*<br>page_id<br><br>**[required]**<br> |
| `vertical`<br><br>*enum {adoptable_pets, apps_and_software, articles_and_publications, commerce, destinations, flights, generic, home_listings, hotels, local_service_businesses, media_titles, offer_items, services, offline_commerce, transactable_items, vehicles}* | **Default value: **`commerce`<br>The catalog's industry or vertical, such as `commerce`.<br> |

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
| 190 | Invalid OAuth 2.0 Access Token |
| 804 | Specified object already exists |
| 102 | Session key invalid or no longer valid |
| 200 | Permissions error |
| 2310019 | The business of this catalog is not onboarded to Collaborative Ads |

## Updating

### /{product_catalog_id}
You can update a [ProductCatalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog) by making a POST request to [/{product_catalog_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog).

#### Parameters

| Parameter | Description |
| --- | --- |
| `additional_vertical_option`<br><br>*enum {LOCAL_DA_CATALOG, LOCAL_PRODUCTS}* | Additional catalog configurations that does not introduce either new verticals or subverticals<br> |
| `da_display_settings`<br><br>*Object* | The display settings object when used<br>will determine which image transformations (like cropping or padding)<br>will be applied for the item in the specified dynamic ad format.<br><br><br>`carousel_ad` *Object*<br>**[required]**<br><br><br>`transformation_type` *enum{background_cropping_and_padding, background_padding, none}*<br>**[required]**<br><br><br>`single_ad` *Object*<br>**[required]**<br><br><br>`transformation_type` *enum{background_cropping_and_padding, background_padding, none}*<br>**[required]**<br> |
| `default_image_url`<br><br>*URI* | The URL for the default image, which is used for<br>products without images or for the cases when the product image is<br>temproarily unavailable. If a product image matches the default image,<br>this should be treated as if the image was not loaded.<br> |
| `destination_catalog_settings`<br><br>*JSON object* | Catalog setting for destination<br>catalogs.<br><br><br>`generate_items_from_pages` *boolean*<br><br>**Default value: **`false` |
| `fallback_image_url`<br><br>*URI* | The URL for the fallback image. This is used as<br>the image for the auto-generated dynamic items.<br> |
| `flight_catalog_settings`<br><br>*JSON object* | Catalog setting for flight catalogs.<br><br><br>`generate_items_from_events` *boolean*<br><br>**Default value: **`false` |
| `name`<br><br>*string* | Name of the Product Catalog<br> |
| `partner_integration`<br><br>*JSON object* | Partner integration settings<br><br><br>`external_access_token` *string*<br>External access token<br><br><br>`external_merchant_id` *string*<br>External merchant identifier<br> |
| `store_catalog_settings`<br><br>*JSON object* | Catalog settings for store catalogs; the page with the location structure for all the stores within this settings will be used to validate the store number for feed uploading<br><br><br>`page_id` *numeric string*<br>page_id<br><br>**[required]**<br> |

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

### /{product_catalog_id}/marketplace_partner_signals
You can update a [ProductCatalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog) by making a POST request to [/{product_catalog_id}/marketplace_partner_signals](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/marketplace_partner_signals).

#### Parameters

| Parameter | Description |
| --- | --- |
| `conversion_type`<br><br>*enum {ATTRIBUTED, IN_SESSION}* | conversion_type<br><br><br>Identifier on whether the specified event happened within the original session of the user landing on the partner's page (IN_SESSION) or within the attribution window after the initial session (ATTRIBUTED)<br> |
| `event_id`<br><br>*string* | event_id<br><br><br>Unique identifier for conversion events. If there are multiple conversion events tied to a single `mp_clid`, this field will be used to differentiate between those events<br> |
| `event_name`<br><br>*enum {PURCHASE, ADD_TO_CART, VIEW_ITEM, OFFER_SUBMITTED, PURCHASE_VIA_OFFER, TEST}* | event_name<br><br><br>`TEST` events can be used to send test data to confirm API functionality that Marketplace will ignore<br><br>**[required]**<br> |
| `event_source_url`<br><br>*string* | event_source_url<br> |
| `event_time`<br><br>*datetime/timestamp* | event_time<br><br>**[required]**<br> |
| `offer_data`<br><br>*JSON object* | offer_data<br><br><br>`original_price` *float*<br>original_price<br><br>**[required]**<br><br><br>`offer_price` *float*<br>offer_price<br><br>**[required]**<br><br><br>`currency` *string*<br>currency<br><br>**[required]**<br> |
| `order_data`<br><br>*JSON object* | order_data<br><br><br>`order_details` *array<JSON object>*<br><br>**Default value: **`[]`<br>order_details<br><br><br>`item_price` *float*<br>item_price<br><br>**[required]**<br><br><br>`item_quantity` *int64*<br>item_quantity<br><br>**[required]**<br><br><br>`item_id` *string*<br>item_id<br><br>**[required]**<br><br><br>`currency` *string*<br>currency<br><br>**[required]**<br><br><br>`order_total` *float*<br>order_total<br><br>**[required]**<br> |
| `user_data`<br><br>*JSON object* | user_data<br><br>**[required]**<br><br><br>`mp_clid` *string*<br>mp_clid<br><br>**[required]**<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
success: bool,
validation_status:  List  [ Struct  {
errors:  List  [ Struct  {
message: string,
}],
warnings:  List  [ Struct  {
message: string,
}],
}],
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Deleting

### Examples {#delete_example}

You can delete a product catalog with the following API. You cannot remove a product catalog from a Business Manager, or transfer a catalog from one Business Manager to another.

```
curl -X DELETE \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<PRODUCT_CATALOG_ID>
```

To do this in a batch call, specify the parameter in the query string for the URL:

```
curl \
  -F 'batch=[{
  "method":"DELETE",
  "relative_url":"<PRODUCT_CATALOG_ID>"
}]' \
 -F 'access_token=<TOKEN>' \
  https://graph.facebook.com
```

To remove the association between the catalog and a pixel or app, make an `HTTP DELETE`:

```
curl -X DELETE \
  -F 'external_event_sources=[<APP_ID>,<PIXEL_ID>]' \
  -F 'access_token=<TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<PRODUCT_CATALOG_ID>/external_event_sources
```

To see all pixel and apps associated with a product catalog, make an `HTTP GET`:

```
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<PRODUCT_CATALOG_ID>/external_event_sources
```

### /{product_catalog_id}
You can delete a [ProductCatalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog) by making a DELETE request to [/{product_catalog_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog).

#### Parameters

| Parameter | Description |
| --- | --- |
| `allow_delete_catalog_with_live_product_set`<br><br>*boolean* | **Default value: **`false`<br>If the catalog has live product sets, the deletion will be blocked by default. Set this parameter to true to enforce the deletion even if it has live product sets<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 3970 | You must be assigned as an admin of this product catalog before you can delete it. |
| 801 | Invalid operation |
| 100 | Invalid parameter |

### /{product_catalog_id}/assigned_users
You can dissociate a [ProductCatalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog) from a [ProductCatalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog) by making a DELETE request to [/{product_catalog_id}/assigned_users](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/assigned_users).

#### Parameters

| Parameter | Description |
| --- | --- |
| `user`<br><br>*UID* | Business user id or system user id<br><br>**[required]**<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

