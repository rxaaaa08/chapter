<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/vehicles | Saved: 2026-09-19 -->

# Product Catalog Vehicles



## Reading

Retrieve vehicles from a product catalog.

#### Example

### HTTP
```
GET /v25.0/{product-catalog-id}/vehicles HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{product-catalog-id}/vehicles',
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
    "/{product-catalog-id}/vehicles",
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
    "/{product-catalog-id}/vehicles",
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
                               initWithGraphPath:@"/{product-catalog-id}/vehicles"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-catalog-id%7D%2Fvehicles&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `bulk_pagination`<br><br>*boolean* | Used for iterating over the edge in large chunks<br> |
| `filter`<br><br>*A JSON-encoded rule* | JSON-encoded WCA rule expression representing the filter to be applied for the edge<br> |

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

A list of [Vehicle](https://developers.facebook.com/docs/marketing-api/reference/vehicle) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=total_count).

| Field | Description |
| --- | --- |
| `total_count`<br><br>*unsigned int32* | Total number of vehicles returned by the query<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

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

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

