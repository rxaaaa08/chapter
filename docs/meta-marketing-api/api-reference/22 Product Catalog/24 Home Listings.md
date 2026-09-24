<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/home_listings | Saved: 2026-09-19 -->

# Product Catalog Home Listings



## Reading

Endpoint that return the home listings that were added to the catalog

#### Example

### HTTP
```
GET /v25.0/{product-catalog-id}/home_listings HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{product-catalog-id}/home_listings',
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
    "/{product-catalog-id}/home_listings",
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
    "/{product-catalog-id}/home_listings",
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
                               initWithGraphPath:@"/{product-catalog-id}/home_listings"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-catalog-id%7D%2Fhome_listings&version=v25.0)

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

A list of [HomeListing](https://developers.facebook.com/docs/marketing-api/reference/home-listing) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=total_count).

| Field | Description |
| --- | --- |
| `total_count`<br><br>*unsigned int32* | Total number of home listings returned by the query<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

### /{product_catalog_id}/home_listings
You can make a POST request to *home_listings* edge from the following paths:

- [/{product_catalog_id}/home_listings](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/home_listings)

When posting to this edge, a [HomeListing](https://developers.facebook.com/docs/marketing-api/reference/home-listing) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `address`<br><br>*Object* | The address of the home listing<br><br>**[required]**<br><br><br>`city` *string*<br>**[required]**<br><br><br>`country` *string*<br>**[required]**<br><br><br>`latitude` *float*<br>**[required]**<br><br><br>`longitude` *float*<br>**[required]**<br><br><br>`neighborhoods` *list<string>*<br><br>`postal_code` *string*<br><br>`region` *string*<br>**[required]**<br><br><br>`street_address` *string*<br>**[required]**<br> |
| `availability`<br><br>*string* | The availability of the home listing<br><br>**[required]**<br> |
| `currency`<br><br>*ISO 4217 Currency Code* | Currency for the listing<br><br>**[required]**<br> |
| `description`<br><br>*string* | Description of the home listing<br> |
| `home_listing_id`<br><br>*string* | ID of the home listing<br><br>**[required]**<br> |
| `images`<br><br>*list<Object>* | Links to home listing images. Please note that carousel format utilizes a square 1:1 aspect ratio images (recommended size - 600x600px) while single hotel ad uses 1.91:1 aspect ratio image(recommended size - 1200x630px). Please provide at least one image.<br><br>**[required]**<br><br><br>`image_url` *URL*<br>**[required]**<br><br><br>`tags` *list<string>* |
| `listing_type`<br><br>*string* | Listing type of the property<br> |
| `name`<br><br>*string* | Name of the home listing<br><br>**[required]**<br> |
| `num_baths`<br><br>*float* | Number of baths for the home listing<br> |
| `num_beds`<br><br>*float* | Number of beds for the home listing<br> |
| `num_units`<br><br>*float* | Number of units for the home listing<br> |
| `price`<br><br>*float* | The price for this home listing<br><br>**[required]**<br> |
| `property_type`<br><br>*string* | Property type of the home listing<br> |
| `url`<br><br>*URL* | Link to the external site where you can view the listing<br><br>**[required]**<br> |
| `year_built`<br><br>*int64* | Year built<br><br>**[required]**<br> |

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

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

