<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_sets | Saved: 2026-09-19 -->

# Product Catalog Product Sets



## Reading

Product sets that are in the Catalog

#### Example

### HTTP
```
GET /v25.0/{product-catalog-id}/product_sets HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{product-catalog-id}/product_sets',
    '{access-token}'
  );
} catch(Facebook\Exceptions\FacebookResponseException $e) {
  echo 'Graph returned an error: ' . $e->getMessage();
  exit;
} catch(Facebook\Exceptions\FacebookSDKException $e) {
  echo 'Facebook SDK returned an error: ' . $e->getMessage();
  exit;
}
$graphNode = $response->getGraphNode();
/* handle the result */
```

### JavaScript SDK
```
/* make the API call */
FB.api(
    "/{product-catalog-id}/product_sets",
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

### Android SDK
```
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/{product-catalog-id}/product_sets",
    null,
    HttpMethod.GET,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

### iOS SDK
```
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/{product-catalog-id}/product_sets"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-catalog-id%7D%2Fproduct_sets&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `ancestor_id`<br><br>*numeric string* | Filters out only product sets which are descendant of the specified product set<br> |
| `has_children`<br><br>*boolean* | Filters out based on if the product set has any child<br> |
| `parent_id`<br><br>*numeric string* | Filters out only Product Sets which are direct children of the specified parent in the hierarchy (0 means "root Product Sets")<br> |
| `retailer_id`<br><br>*string* | Filters out based on the product set's retailer id<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {},
"summary": {}
}
```

##### data

A list of [ProductSet](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=__type__).

| Field | Description |
| --- | --- |
| `total_count`<br><br>*int32* | Total number of objects on this edge<br><br><br>**[default]**<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |
| 80009 | There have been too many calls to this Catalog account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting. |

## Creating

### /{product_catalog_id}/product_sets
You can make a POST request to *product_sets* edge from the following paths:

- [/{product_catalog_id}/product_sets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_sets)

When posting to this edge, a [ProductSet](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-set) will be created.

#### Example

### HTTP
```
POST /v25.0/<PRODUCT_CATALOG_ID>/product_sets HTTP/1.1
Host: graph.facebook.com

name=Test+Set&filter=%7B%22product_type%22%3A%7B%22i_contains%22%3A%22shirt%22%7D%7D
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->post(
    '/<PRODUCT_CATALOG_ID>/product_sets',
    array (
      'name' => 'Test Set',
      'filter' => '{"product_type":{"i_contains":"shirt"}}',
    ),
    '{access-token}'
  );
} catch(Facebook\Exceptions\FacebookResponseException $e) {
  echo 'Graph returned an error: ' . $e->getMessage();
  exit;
} catch(Facebook\Exceptions\FacebookSDKException $e) {
  echo 'Facebook SDK returned an error: ' . $e->getMessage();
  exit;
}
$graphNode = $response->getGraphNode();
/* handle the result */
```

### JavaScript SDK
```
/* make the API call */
FB.api(
    "/<PRODUCT_CATALOG_ID>/product_sets",
    "POST",
    {
        "name": "Test Set",
        "filter": "{\"product_type\":{\"i_contains\":\"shirt\"}}"
    },
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

### Android SDK
```
Bundle params = new Bundle();
params.putString("name", "Test Set");
params.putString("filter", "{\"product_type\":{\"i_contains\":\"shirt\"}}");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/<PRODUCT_CATALOG_ID>/product_sets",
    params,
    HttpMethod.POST,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

### iOS SDK
```
NSDictionary *params = @{
  @"name": @"Test Set",
  @"filter": @"{\"product_type\":{\"i_contains\":\"shirt\"}}",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/<PRODUCT_CATALOG_ID>/product_sets"
                                      parameters:params
                                      HTTPMethod:@"POST"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

### cURL
```
curl -X POST \
  -F 'name="Test Set"' \
  -F 'filter={
       "product_type": {
         "i_contains": "shirt"
       }
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<PRODUCT_CATALOG_ID>/product_sets
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=POST&path=%3CPRODUCT_CATALOG_ID%3E%2Fproduct_sets%3Fname%3DTest%2BSet%26filter%3D%257B%2522product_type%2522%253A%257B%2522i_contains%2522%253A%2522shirt%2522%257D%257D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `filter`<br><br>*A JSON-encoded rule* | Filter rules to define a product set (max length: 500 KiB)<br> |
| `metadata`<br><br>*JSON object* | Product set metadata, which can be used for creating product collections<br><br><br>`cover_image_url` *URI*<br>cover_image_url<br><br><br>`description` *string*<br>description<br><br><br>`external_url` *URI*<br>external_url<br><br><br>`external_url_handle` *string*<br>external_url_handle<br> |
| `name`<br><br>*UTF-8 encoded string* | Name of the product set<br><br>**[required]**<br> |
| `publish_to_shops`<br><br>*array<JSON object>* | Shop ids where this product set should be published as collection.<br><br><br>`shop_id` *numeric string*<br>shop_id<br><br><br>`ordering_index` *int64*<br>ordering_index<br> |
| `retailer_id`<br><br>*UTF-8 encoded string* | External product set retailer id<br> |

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

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

## Filter Rules

Creating a product set with an empty `filter` parameter indicates that all items in the product catalog should be in the set. Each rule is a JSON-encoded string. An empty `filter` parameter can be specified using either an empty parameter value or an empty JSON object, `{}`.

**Recommendation:** Query with content type `application/json`.  

### Limitations

* If the filter rules you set result in an empty product set, ads tied to this product set will not deliver.
* The `contains` operators can only be used for string matching when creating product sets. For `enum` values use the `eq` operators.
* Filter operators are not case sensitive. However, `i_*` operators can still be used.
* You can't use non-English Unicode characters for filters in labels.

**Warning:** For a full list of limitations and examples, along with useful tips about how to use punctuation characters to create and manage product sets,  [see this Business Help Center article](https://www.facebook.com/business/help/741923962861190)

Filter rules are made up of the following fields and operators:

### Fields

| Field | Description |
| --- | --- |
| `age_group` | The demographic of an item. There are only 5 accepted values: `newborn`, `infant`, `toddler`, `kids`, and `adult`. |
| `agent_fb_page_id` | Unique ID of the agent. |
| `availability` | The availability of the product item, home listing, or vehicle. Predefined values for  **products**: `preorder`, `in stock`, `out of stock`, and `available for order`. Supported values for **dynamic ads**: `for_sale`, `for_rent`, `sale_pending`, `recently_sold`, `off_market`, `available_soon`. Supported value for **Marketplace**: `for_rent`. Supported values for **vehicles**: `available`, `not_available`. Note: Vehicles that are unavailable in an ad are not visible to public. |
| `base_price_amount` | The base price per night for a hotel. You must specify the value with currency. `base_price_amount` is the value of `base_price`. `base_price_currency` is the currency for the `base_price`. |
| `body_style` | The body style of a vehicle. Supported values for Marketplace and dynamic ads: `CONVERTIBLE`, `COUPE`, `CROSSOVER`, `HATCHBACK`, `MINIVAN`, `TRUCK`, `SEDAN`, `SMALL_CAR`, `SUV`, `VAN`, `WAGON`, `OTHER`. |
| `brand` | The brand of a product item or hotel. |
| `category` | The category of the product item. |
| `city` | The city where a hotel, destination, automobile dealership, or home listing is located. |
| `city_id` | The city ID of the product item. |
| `city_page_id` | The value to use in a deep link URL (`template_URL`) in ad creative. |
| `color` | Type: string. The color of an item. |
| `condition` | The condition of a product item or vehicle. Supported values for products: `new`, `refurbished`, and `used`. Supported values for vehicles: `Excellent`, `Good`, `Fair`, `Poor`, `Other`. |
| `country` | The country where a hotel, home listing, automobile dealership, or destination is located. |
| `currency` | The currency abbreviation for an item's, hotel's, home listing's, automobile dealership's, or destination's price. |
| `custom_label_0` | The value of a custom label of a product item, hotel, destination, vehicle, or home listing. |
| `custom_label_1` | The value of a custom label of a product item, hotel, or destination. |
| `custom_label_2` | The value of a custom label of a product item, hotel, or destination. |
| `custom_label_3` | The value of a custom label of a product item, hotel, or destination. |
| `custom_label_4` | The value of a custom label of a product item, hotel, or destination. |
| `date_first_on_lot` | The date a vehicle first arrived at the dealership. Used to indicate the inventory age. Should be in _yyyy-mm-dd_ format. Example: `2018-09-05` |
| `date_first_on_lot_time` | The date and time a vehicle first arrived at the dealership. |
| `days_on_market` | The number of days a home listing is on the open market. |
| `dealer_communication_channel` | The method with which an automobile dealer will be contacted by a buyer. Supported values: `CHAT` or `LEAD_FORM`. `LEAD_FORM` is subject to regional availability: when unavailable, every listing is forced to `CHAT`, irregardless of the value entered. |
| `dealer_id` | The alphanumeric ID of an automobile dealership. |
| `dealer_name` | The name of the automobile dealership. |
| `drivetrain` | The vehicle's drivetrain. Supported values: `4X2`, `4X4`, `AWD`, `FWD`, `RWD`, `Other`. |
| `description` | The description of a flight route, home listing, or destination. |
| `destination_airport` | The IATA code for the destination. Supports airport and city IATA code. Use IATA Code Search to validate IATA codes. To improve performance, avoid using a space for this unique ID. |
| `destination_city` | The name of the destination city. Example: `New York` |
| `destination_id` | The unique ID for a destination within a catalog. This ID will be matched with any `content_ids` provided in your `destination` app and pixel events. |
| `exterior_color` | The exterior color of a vehicle |
| `feed_id` | The ID of the product feed from which the item came. |
| `flight_id` | The defined ID for a flight. |
| `fuel_type` | The type of fuel designated for a vehicle. Supported values: `DIESEL`, `ELECTRIC`, `GASOLINE`, `FLEX`, `HYBRID`, `OTHER`. |
| `furnish_type` | The type of furnishing available for a home listing: `furnished`, `unfurnished`, `semi-furnished`. |
| `gender` | The gender of the product item. There are only 3 accepted values: `male`, `female`, and `unisex`. |
| `home_listing_id` | The granular nique ID for a home listing (apartment, condo, home). |
| `hotel_id` | The unique ID for a hotel within a catalog. This ID is matched with any `content_ids` provided in your hotel app and pixel events. |
| `image_tags` | A string that describes an image. There can be multiple tags associated with an image. Example: [for home listings]`Fitness Center`, `Swimming Pool`, [for vehicles] `Exterior`, `Interior`, `StockImage`. For vehicles, follow this naming convention: `(image[0].url`, `image[0].tag[0]`, `image[0].tag[1])`. For vehicle offer ads, `Lease Offer`, `Financing`, and so on. In the `image[0].tag[m]` structure, increment the `m` value to add more tags.<br><br>When using a CSV/TSV file, we support two different formats: Use an image header that looks like: `image[0].url`, `image[1].url`, and so on. Use a JSON flatten string that looks like: `"[{url:'https://images.com/1.jpg'},{url:'https://images.com/2.jpg'}]"` |
| `interior_color` | The vehicle's interior color. |
| `listing_type` | The type of home listing. Supported values for Marketplace: `for_rent_by_agent`, `for_rent_by_owner`. Supported values for dynamic ads: `for_rent_by_agent`, `for_rent_by_owner`, `for_sale_by_agent`, `for_sale_by_owner`, `foreclosed`, `new_construction`, `new_listing`. |
| `make` | The brand of a vehicle. Example `Ford` |
| `margin_level` | An indicator of the profitability of a hotel; value from `1` to `10`. |
| `market_id` | The market where an offer is eligible. Use for TWO FEED use case, to correspond with the market feed. For regional offers, this field is required and should match the `market_id` provided in the market feed. For national offers (offers applicable to all of the U.S.), this field should be empty. |
| `material` | The material or fabric that a product is made out of. Example: 'Leather', 'Denim', 'Suede'. |
| `mileage_unit` | The mileage unit of a vehicle in miles (`MI`) or kilometers (`KM`). |
| `mileage_value` | For used vehicles, the current mileage of a vehicle in miles (`MI`) or kilometers (`KM`). For new vehicles, use `0`. Vehicles on Marketplace must have over 500 miles/kms. |
| `model` | The name of a vehicle product and sometimes a range of products. Example: `Focus` |
| `name` | The name of a product item, hotel, home listing, or destination. |
| `neighborhood` | The neighborhood where a hotel or home listing is located. If there's more than one neighborhood, add additional columns for each one and use JSON-path syntax in each column name to indicate the number of neighborhoods. |
| `neighborhood_id` | The neighborhood ID of a product item. |
| `num_baths` | The total number of bathrooms for a home listing. Must be `1` at a minimum. |
| `num_beds` | The total number of bedrooms for a home listing. Can be `0` for a studio. |
| `number_of_raters` | The number of people who rated a hotel. |
| `num_of_valid_guest_rating` | Number of starts the hotel has; for example, when you book a hotel and it has a rating that is 9 out of 10. |
| `num_rooms` | The total number of rooms for a home listing. |
| `num_units` | The total number of units in a building. Use only for apartments or condos, available as a rental. |
| `offer_type` | The type of offer: `lease`, `finance`, `cash`. |
| `one_way_price` | One-way price of a flight. You must specify the value with the currency. |
| `origin_airport` | The IATA code for the origin of an airport. Supports airport and city IATA codes. Use IATA Code Search to validate IATA codes. |
| `origin_city` | The city name of the flight's origin. |
| `pattern` | The pattern or graphic print featured on a product. Example: 'Polka Dot', 'Striped', 'Paisley'. |
| `postal_code` | The postal or zip code designated for a hotel location, home listing, or automobile dealership. Optional for countries without a postal code system. |
| `postal_codes` | For vehicle offer ads, the list of postal codes for the specific market provided in this format: `['94025', '94536']`. |
| `price` | The price of a flight, home listing, vehicle, or destination. You must specify the value with currency. |
| `price_amount` | The price multiplied by 100, for all currencies. Example: `490` when used with USD denotes $4.90, and `49000` when used with JPY denotes ¥490. |
| `price_change` | The price change for a destination. Values include: `0` - no price change, `–10` - 10% price drop, `20` - 20% price increase. |
| `priority` | The priority of a flight or hotel. Values from `0` (lowest priority) to `5` (highest priority). A flight without a value defaults to `0`. |
| `product_expiration_time` | The expiration date when the product is no longer available. You can set an expiration date and if you have an ad running, it will fetch only the non-expired products. For example, if the expiration date is today, after today this product will no longer appear in ads. |
| `product_feed_id` | The Facebook ID of the Product Feed of a product item, flight, hotel, home listing, vehicle, vehicle offer, or destination. |
| `product_group_id` | The Facebook ID of the Product Group of a product item. |
| `product_item_id` | The Facebook ID of a product item. |
| `product_type` | The retailer defined category of a product item. |
| `property_type` | The type of home listing property. Supported values for Marketplace: `apartment`, `builder_floor`, `condo`, `house`, `house_in_condominium`, `house_in_villa`, `loft`, `penthouse`, `studio`, `townhouse`, `other`. Supported values for dynamic ads: `apartment`, `condo`, `house`, `land`, `manufactured`, `townhouse`, `other`. |
| `rating_system` | The system the `guest_rating` is based on. Examples: Expedia, TripAdvisor |
| `region` | The state, county, region, or province for a home listing or automobile dealership. |
| `region_id` | The region-defined ID of a product item or automobile dealership. |
| `retailer_id` | The retailer-defined ID of a product item, flight, hotel, home listing, vehicle, vehicle offer, or destination. |
| `retailer_product_group_id` | The retailer defined ID of a product group. |
| `review_status` | This is related to dynamic review. It tells if the product is accepted or rejected in review. Values can be `rejected`, `pending`, `approved`. |
| `sale_price` | The sale price or special price of a vehicle. |
| `sale_price_amount` | For products: The sale price of a product item multiplied by 100, for all currencies. Example: `490` when used with USD denotes $4.90, and `49000` when used with JPY denotes ¥490. For hotels: Discounted sale cost and currency of a hotel stay, based on `checkin_date` and `length_of_stay`. |
| `score` | Value for the hotel rating score. Example: `7.8` |
| `size` | The size of a product item. Example: 'XL', '16/34 Tall', '3.5 Kid' |
| `star_rating_float` | The hotel star rating. Valid values: `1` to `5` and should be a multiple of 0.5. Example: `3`, `4.5` |
| `state_of_vehicle` | The current state of a vehicle: `New`, `Used`, `CPO` (certified pre-owned). |
| `title` | The full name of a vehicle. Max characters: 500. The title is relevant and specific to each vehicle and it should contain what is set in `year`, `make`, `model`, and `trim` fields. Example: `SE Ford Certified and 6-Speed Automatic` |
| `transmission` | The transmission type of the vehicle: `Automatic` or `Manual`. |
| `trim` | The trim of the vehicle: `5DR HB SE` Max characters: 50. |
| `url` | The link to an external site where you can view a flight. If a deep link is specified on the ad level, that takes precedence. |
| `vehicle_ID` | The unique ID for a vehicle. Can be a variant for a vehicle. If there are multiple instances of the same ID, we ignore all instances. For vehicle offers, it is the ID that advertisers can use to identify an offer. This is also the same value that is passed under the `content_id` parameter in the pixel. |
| `vehicle_registration_plate` | A metal or plastic plate attached to a motor vehicle or trailer for official identification purposes. For Marketplace, a vehicle registration plate is required in the United Kingdom, |
| `vehicle_type` | The type of vehicle: `car_truck` (default if not supplied), `boat`, `commercial`, `motorcycle`, `powersport`, `rv_camper`, `trailer`, or `other`. |
| `vendor_ID` | The vendor-defined ID of a product item. |
| `vin` | The vehicle identification number. The VIN must be exactly 17 characters and is not required for pre-1983 vehicles. The VIN is required in all countries where Marketplace is available. In the United Kingdom, France, and Brazil, a vehicle registration plate is required instead of a VIN. |
| `visibility` | Toggle visibility on product item. Supported values: `published`, `staging`, `hidden`, `whitelist_only`. Items in `staging` mode are not visible to buyers, and are not available for product tagging on Instagram, nor for dynamic ads. |
| `year` | The year a vehicle was launched in `yyyy` format. |

### Operators

**Warning:** [Starting March 3, 2022](https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/mar-3-2022), we changed how certain filters work for product sets. These include the `contains`, `not_contains`, `lt`, `gt`, `lte`, `gte`, and `starts_with` filters. You have 90 days to update your filters. If any sets in your catalog are using the affected filters after June 1, 2022, the items in those sets may change. This means that different items could display in your ads or shops that use those sets. See [the changelog](https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/mar-3-2022) for more details.

| Operator | Type of filter |
| --- | --- |
| `and` | Returns products that match all query values inclusively. For example, `"color": {"red" and "shoe" and "running"}` will only return products that match all 3 query values, such as "red running shoe". |
| `contains` | Returns products that match a query string. For example, `category: {"contains": "running shoe"}` will return all products that contain the query string, such as "red running shoe", "blue running shoe", and "running shoe for kids". |
| `or` | Returns products that match only one query value exclusively. For example, `category: {"running" or "walking"}` will return products that match "running" or "walking" but not both. |
| `not_contains` | Returns products that do not match a query string. For example, `category: {"not_contains": running shoe"}` will return all products that do not contain the query string, such as "red walking shoe", "sandals", and "boots". |
| `is_any` | Returns products that match any value in a list of query values. For example, `"color": {"is_any": "black", "blue", "brown"}` will return any product that matches at least one query string, such as "black boots", "blue boots", "brown boots". |
| `is_not_any` | Returns products that do not match any value in a list of query strings. For example, `"color": {"is_not_any": "black", "blue", "brown"}` will return any products that do not match any of the query values, such as "red boots", "yellow boots", and "green boots". |
| `eq` | Returns products that exactly match a query value. For example, `"brand": {"eq": "Instagram"}` will only match "Instagram" brand products. |
| `neq` | Returns products that do not exactly match a query value. For example, `"brand": {"eq": "Instagram"}` will only match products that are not "Instagram" brand products. |
| `lt`<br><br>int | Returns products that are less than a numeric query value. For example, `"priority": {"lt": 3}` will only match products with a priority that is less than 3. |
| `lte`<br><br>int | Returns products that are less than or equal to a numeric query value. For example, `"priority": {"lte": 3}` will only match products with a priority that is less than or equal to 3. |
| `gt`<br><br>int | Returns products that are greater than a numeric query value. For example, `"priority": {"gt": 3}` will only match products with a priority that is greater than 3. |
| `gte`<br><br>int | Returns products that are greater than or equal to a numeric query value. For example, `"priority": {"gte": 3}` will only match products with a priority that is greater than or equal to 3. |
| `starts_with` | Returns products that match any string that starts with the query string. For example, `"small"` will return any product that starts with the query string, such as "small sandals", "small t-shirt", "small, blue boots". **Note**: This filter option is now only available for the product category field. For other fields, you should use the `contains` filter. |

### Filter Examples

*Formatted for readability.*

To create a product set that matches specific product IDs, send a `POST` request to the `/PRODUCT-CATALOG-ID/product_sets` endpoint and set the `retailer_id` filter field to `is_any` operator and an array of product IDs.

`curl -i -X POST`

`"https://graph.facebook.com/API-VERSION/PRODUCT-CATALOG-ID/product_sets
`

`?name=Sample Product Set`

`&filter={`

`'retailer_id': {`

`'is_any': ['pid1', 'pid2']`

`}`

`}`

`&access_token=ACCESS-TOKEN"`

To create a product set that matches all shirt items, send a `POST` request to the `/PRODUCT-CATALOG-ID/product_sets` endpoint and set the `product_type` filter field to `i_contains` operator and the string `shirt`.

`curl -i - X POST `

`"https://graph.facebook.com/API-VERSION/PRODUCT-CATALOG-ID/product_sets`

`&name=New Product Set Name`

`&filter={`

`'product_type': {`

`'i_contains': 'shirt'`

`}`

`}`

`&access_token=ACCESS-TOKEN"`

Each rule is a JSON-encoded string.

**Recommendation:** Query with content type `application/json`.

### Example Filter Rules

| Rule | Description |
| --- | --- |
| {"category": {"eq": "Luggage & Bags"}} | Match all products within the "Luggage & Bags" category. |
| {"retailer_id": {"is_any": ["pid1", "pid2"]}} | Match all products with the retailer ID of pid1 or pid2. |
| { "or": [{"retailer_product_group_id": {"eq": "group_1"}},{"product_type": {"i_contains": "shirt"}}]} | Match all products with the `retailer_product_group_id` of group_1 or `product_type` containing shirt. |

