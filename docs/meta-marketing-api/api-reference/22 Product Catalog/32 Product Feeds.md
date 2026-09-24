<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_feeds | Saved: 2026-09-19 -->

# Product Catalog Product Feed



Products feeds associated with a catalog. See [Dynamic Ads, Catalog Setup](https://developers.facebook.com/documentation/ads-commerce/catalog). For example, get a list of all product feeds:

```
curl -G \
-d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/<PRODUCT_CATALOG_ID>/product_feeds
```

Or get a list of product items in a product feed:

```
curl -G \
-d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/<PRODUCT_FEED_ID>/products
```

## Reading

#### Example

### HTTP
```
GET /v25.0/{product-catalog-id}/product_feeds HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{product-catalog-id}/product_feeds',
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
    "/{product-catalog-id}/product_feeds",
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
    "/{product-catalog-id}/product_feeds",
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
                               initWithGraphPath:@"/{product-catalog-id}/product_feeds"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bproduct-catalog-id%7D%2Fproduct_feeds&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of [ProductFeed](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 190 | Invalid OAuth 2.0 Access Token |
| 80009 | There have been too many calls to this Catalog account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting. |

## Creating

### /{product_catalog_id}/product_feeds
You can make a POST request to *product_feeds* edge from the following paths:

- [/{product_catalog_id}/product_feeds](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_feeds)

When posting to this edge, a [ProductFeed](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-feed) will be created.

#### Example

### HTTP
```
POST /v25.0/{product-catalog-id}/product_feeds HTTP/1.1
Host: graph.facebook.com

name=Test+Feed&schedule=%7B%22interval%22%3A%22DAILY%22%2C%22url%22%3A%22http%3A%2F%2Fwww.example.com%2Fsample_feed.tsv%22%2C%22hour%22%3A%2222%22%7D
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->post(
    '/{product-catalog-id}/product_feeds',
    array (
      'name' => 'Test Feed',
      'schedule' => '{"interval":"DAILY","url":"http://www.example.com/sample_feed.tsv","hour":"22"}',
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
    "/{product-catalog-id}/product_feeds",
    "POST",
    {
        "name": "Test Feed",
        "schedule": "{\"interval\":\"DAILY\",\"url\":\"http:\/\/www.example.com\/sample_feed.tsv\",\"hour\":\"22\"}"
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
params.putString("name", "Test Feed");
params.putString("schedule", "{\"interval\":\"DAILY\",\"url\":\"http://www.example.com/sample_feed.tsv\",\"hour\":\"22\"}");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/{product-catalog-id}/product_feeds",
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
  @"name": @"Test Feed",
  @"schedule": @"{\"interval\":\"DAILY\",\"url\":\"http://www.example.com/sample_feed.tsv\",\"hour\":\"22\"}",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/{product-catalog-id}/product_feeds"
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
  -F 'name="Test Feed"' \
  -F 'schedule={
       "interval": "DAILY",
       "url": "http://www.example.com/sample_feed.tsv",
       "hour": "22"
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/{product-catalog-id}/product_feeds
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=POST&path=%7Bproduct-catalog-id%7D%2Fproduct_feeds%3Fname%3DTest%2BFeed%26schedule%3D%257B%2522interval%2522%253A%2522DAILY%2522%252C%2522url%2522%253A%2522http%253A%252F%252Fwww.example.com%252Fsample_feed.tsv%2522%252C%2522hour%2522%253A%252222%2522%257D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `country`<br><br>*string* | **Default value: **`"US"`<br>Two letter country code where the products can be sold<br> |
| `default_currency`<br><br>*ISO 4217 Currency Code* | **Default value: **`USD`<br>The default currency used by provided feed if the currency is not specified in the feed file<br> |
| `deletion_enabled`<br><br>*boolean* | **Default value: **`true`<br>Default value: `false` (to be changed to `true` .from API v2.5)<br>When `true`, this will remove products from a catalog that are no longer present in a feed. When `false`, uploading a product feed is additive and products will remain in the catalog even if they are removed from a feed. Once enabled, we do not allow this field to be disabled.<br> |
| `delimiter`<br><br>*enum {AUTODETECT, BAR, COMMA, TAB, TILDE, SEMICOLON}* | **Default value: **`AUTODETECT`<br>Product feed delimiter<br> |
| `encoding`<br><br>*enum {AUTODETECT, LATIN1, UTF8, UTF16LE, UTF16BE, UTF32LE, UTF32BE}* | **Default value: **`AUTODETECT`<br>The character encoding used by provided feed<br> |
| `feed_type`<br><br>*enum {ACTIVITY, APP_AND_SOFTWARE, ARTICLE_AND_PUBLICATION, AUTOMOTIVE_MODEL, COLLECTION, DESTINATION, FLIGHT, HOME_LISTING, HOTEL, HOTEL_ROOM, LOCAL_INVENTORY, MEDIA_TITLE, OFFER, PRODUCT_RATINGS_AND_REVIEWS, PRODUCTS, SERVICE, TRANSACTABLE_ITEMS, VEHICLE_OFFER, VEHICLES}* | Type of the feed. Decides type of catalog item this feed will create<br> |
| `file_name`<br><br>*string* | The name of the product feed. .tsv, .xml or compressed files (zip, gzip and bz2) are supported<br> |
| `ingestion_source_type`<br><br>*enum {PRIMARY_FEED, SUPPLEMENTARY_FEED}* | ingestion_source_type to decide type of feed i.e. primary or supplementary<br> |
| `item_sub_type`<br><br>*enum {APPLIANCES, BABY_FEEDING, BABY_TRANSPORT, BEAUTY, BEDDING, CAMERAS, CELL_PHONES_AND_SMART_WATCHES, CLEANING_SUPPLIES, CLOTHING, CLOTHING_ACCESSORIES, COMPUTERS_AND_TABLETS, DIAPERING_AND_POTTY_TRAINING, ELECTRONICS_ACCESSORIES, FURNITURE, HEALTH, HOME_GOODS, JEWELRY, NURSERY, PRINTERS_AND_SCANNERS, PROJECTORS, SHOES_AND_FOOTWEAR, SOFTWARE, TOYS, TVS_AND_MONITORS, VIDEO_GAME_CONSOLES_AND_VIDEO_GAMES, WATCHES}* | The sub type of items to be uploaded by this feed<br> |
| `migrated_from_feed_id`<br><br>*numeric string* | Used to split an original feed into multiple new feeds, `migrated_from_feed_id` denotes the original feed's ID. Setting this field ensures that items from an original field can be migrated to a new one, without the need of deletion.<br><br>This field is generally used when splitting a large feed into multiple smaller feeds.<br><br>Example:<br><br><br>• You have a large feed called Feed A and want to split it.<br>• You create a new feed called Feed B and specify Feed A's ID under `migrated_from_feed_id`.<br>• You upload Feed B's catalog information, including the products you want to add to Feed B.<br>• The items from feed A have been moved to feed B. Going forward, you do not need to specify those items in Feed A and they can be removed from feed A.<br><br><br>**Guidance on splitting feeds that exceed file size or item limit**<br><br><br>If your data feed contains more items or exceeds the file size, split it into multiple feeds and upload them separately. You can upload as many data feeds as you want, but they must all contain different items.<br><br><br>You can split the data feed into smaller feeds using `migrated_from_feed_id`.<br><br><br>Steps:<br><br><br>• Create a new data feed file with items that need to be transferred from the old feed.<br>• Create a new data feed using `migrated_from_feed_id`.<br>• The ownership of items will be transferred from the old feed to the new feed when the first session completes on the new feed file.<br>• Subsequently, the items can be removed from the old feed. And the items must be managed by the new feed.<br><br><br>Example of how to create a new feed using `migrated_from_feed_id`:<br><br><br>`curl -X POST \ -F 'name="New Feed"' \ -F 'schedule={ "interval": "DAILY", "url": "http://www.example.com/new_feed_file.csv", "hour": "22" }' \ -F 'migrated_from_feed_id=<OLD_FEED_ID>' \ -F 'access_token=<ACCESS_TOKEN>' \ https://graph.facebook.com/v22.0/{product-catalog-id}/product_feeds`<br><br><br>5. Additionally, ensure that once the data feeds are split into a new, smaller feed, all item updates come from the respective new feed.<br> |
| `name`<br><br>*UTF-8 encoded string* | User specified name for the feed<br> |
| `override_type`<br><br>*enum {LANGUAGE, COUNTRY, VERSION, CATALOG_SEGMENT_CUSTOMIZE_DEFAULT, LANGUAGE_AND_COUNTRY, BATCH_API_LANGUAGE_OR_COUNTRY, SMART_PIXEL_LANGUAGE_OR_COUNTRY, LOCAL}* | If this is a secondary feed, this specifies the override type of the feed<br> |
| `override_value`<br><br>*string* | Override value of the feed dependent on the override type (country or language).<br> |
| `primary_feed_ids`<br><br>*array<numeric string>* | primary_feed_ids to which a supplementary feed should be linked<br> |
| `quoted_fields_mode`<br><br>*enum{autodetect, on, off}* | **Default value: **`autodetect`<br>Whether or not there will be quotes around each field, only for TSV feeds. If this field is provided, we use it instead of the parameter quoted_fields<br> |
| `rules`<br><br>*list<JSON-encoded string>* | A list of rules applied to feed uploads<br> |
| `schedule`<br><br>*JSON-encoded string* | A JSON-encoded string representing a recurrent schedule for fetching the feed. Default timezone is America/Los_Angeles. Learn more about [feed schedules](https://developers.facebook.com/docs/marketing-api/reference/product-feed-schedule)<br> |
| `selected_override_fields`<br><br>*array<string>* | Selected Override Fields of the feed, written as a list of fields which should be processed from the feed file.  From whiltelisted_properties<br> |
| `update_schedule`<br><br>*JSON-encoded string* | The configuration for fetching updates to a feed in a recurrent manner. The uploads would only update the items in the feed or create new ones. No items would be deleted. This is useful for sending `price` and `availability` updates for selected items in the feed. Learn more about fields in a [feed schedule](https://developers.facebook.com/docs/marketing-api/reference/product-feed-schedule)<br> |
| `use_case`<br><br>*enum {CREATOR_ASSET}* | Allow advertiser to pass creator_asset as the new use_case of the feed<br> |

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

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

