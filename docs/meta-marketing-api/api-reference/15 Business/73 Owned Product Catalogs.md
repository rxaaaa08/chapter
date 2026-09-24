<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_product_catalogs | Saved: 2026-09-19 -->

# Business Owned Product Catalogs



## Reading

Product catalogs owned by this business.

#### Example

### HTTP
```
GET /v25.0/{business-id}/owned_product_catalogs HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-id}/owned_product_catalogs',
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
    "/{business-id}/owned_product_catalogs",
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
    "/{business-id}/owned_product_catalogs",
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
                               initWithGraphPath:@"/{business-id}/owned_product_catalogs"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-id%7D%2Fowned_product_catalogs&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

This endpoint doesn't have any parameters.

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

A list of [ProductCatalog](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=__type__).

| Field | Description |
| --- | --- |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 100 | Invalid parameter |
| 80009 | There have been too many calls to this Catalog account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting. |
| 190 | Invalid OAuth 2.0 Access Token |
| 104 | Incorrect signature |

## Creating

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

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

