<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/hotels | Saved: 2026-09-19 -->

# Product Catalog Hotels



Hotels in a catalog used in Dynamic Ads for Travel. See [Dynamic Ads for Travel, Catalog Setup](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads).

**When you use this, you can provide [Batch Requests](https://developers.facebook.com/documentation/ads-commerce/marketing-api/asyncrequests) to combine a number of API calls into one HTTP request.**

For example, to get the total number of hotels in a catalog:

```
curl -G \
-d "summary=total_count" \
-d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/<PRODUCT_CATALOG_ID>/hotels
```

To fetch hotels whose name contains "suites":

```
curl -G \
-d 'fields=["hotel_id","name"]' \
-d 'filter={"name":{"i_contains":"suites"}}' \
-d 'access_token=<ACCESS_TOKEN>'
https://graph.facebook.com/<API_VERSION>/<PRODUCT_CATALOG_ID>/hotels
```

## Reading

Endpoint that returns the hotels from a catalog

#### Example

### HTTP
```
GET /v25.0/{product-catalog-id}/hotels HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{product-catalog-id}/hotels',
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
    "/{product-catalog-id}/hotels",
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
    "/{product-catalog-id}/hotels",
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
                               initWithGraphPath:@"/{product-catalog-id}/hotels"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-catalog-id%7D%2Fhotels&version=v25.0)

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

A list of [Hotel](https://developers.facebook.com/docs/marketing-api/reference/hotel) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=total_count).

| Field | Description |
| --- | --- |
| `total_count`<br><br>*unsigned int32* | Total number of hotels returned by the query<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

### Example

Example to create a hotel:

```
curl \
-X POST \
-F "hotel_id=h_157" \
-F "name=Sample Hotel" \
-F "images= [ \
  {'image_url':'http://www.example.com/pic1.jpg', 'tags':['front view']}, \
  {'image_url':'http://www.example.com/pic2.jpg', 'tags':['lobby view']} \
]" \
-F "url=http://www.example.com/samplehotel" \
-F "address={ \
  street_address:'1 Hacker Way', \
  city:'Menlo Park', \
  region:'California', \
  country:'United States', \
  postal_code:'94025', \
  neighborhoods:['Palo Alto','Menlo Park'], \
  latitude:37.484116, \
  longitude:-122.148244 \
}" \
-F "brand=hotel brand" \
-F "description=hotel description" \
-F "guest_ratings= [ \
  {'score':7.8, 'rating_system':'sample_rating', 'number_of_raters':780} \
]" \
-F "star_rating=4" \
-F "loyalty_program=Sample rewards club" \
-F "phone=+351234123456" \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/<PRODUCT_CATALOG_ID>/hotels
```

### /{product_catalog_id}/hotels
You can make a POST request to *hotels* edge from the following paths:

- [/{product_catalog_id}/hotels](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/hotels)

When posting to this edge, a [Hotel](https://developers.facebook.com/docs/marketing-api/reference/hotel) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `address`<br><br>*Object* | The address of the hotel<br><br>**[required]**<br><br><br>`city` *string*<br>**[required]**<br><br><br>`city_id` *string*<br><br>`country` *string*<br>**[required]**<br><br><br>`latitude` *float*<br>**[required]**<br><br><br>`longitude` *float*<br>**[required]**<br><br><br>`neighborhoods` *list<string>*<br><br>`postal_code` *string*<br><br>`region` *string*<br>**[required]**<br><br><br>`street_address` *string*<br>**[required]**<br> |
| `applinks`<br><br>*Object* | App links for native platforms, e.g. Android, IOS and Windows Phone.<br><br><br>`web` **<br><br>`android` **<br><br>`ios` **<br><br>`ipad` **<br><br>`iphone` **<br><br>`windows_phone` ** |
| `base_price`<br><br>*int64* | The base price of the hotel<br> |
| `brand`<br><br>*string* | Hotel brand<br> |
| `currency`<br><br>*ISO 4217 Currency Code* | **Default value: **`USD`<br>The currency for base_price, e.g. USD<br> |
| `description`<br><br>*string* | Description of the hotel<br><br>**[required]**<br> |
| `guest_ratings`<br><br>*list<Object>* | Guest ratings for this hotel.<br><br><br>`score` *float*<br>**[required]**<br><br><br>`max_score` *int64*<br>**[required]**<br><br><br>`rating_system` *string*<br>**[required]**<br><br><br>`number_of_raters` *int64*<br>**[required]**<br> |
| `hotel_id`<br><br>*string* | A unique identifier for this hotel provided by advertiser. (i.e. from the `id` field in the feed<br> |
| `images`<br><br>*list<Object>* | Links to hotel images. Please note that carousel format utilizes a square 1:1 aspect ratio images (recommended size - 600x600px) while single hotel ad uses 1.91:1 aspect ratio image(recommended size - 1200x630px). Please provide at least one image.<br><br>**[required]**<br><br><br>`image_url` *URL*<br>**[required]**<br><br><br>`tags` *list<string>* |
| `name`<br><br>*string* | Name of the hotel<br><br>**[required]**<br> |
| `phone`<br><br>*phone number string* | Hotel's phone number<br> |
| `star_rating`<br><br>*float* | The star rating of the hotel<br> |
| `url`<br><br>*URL* | Link to the external site where you can book a hotel room<br><br>**[required]**<br> |

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

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

