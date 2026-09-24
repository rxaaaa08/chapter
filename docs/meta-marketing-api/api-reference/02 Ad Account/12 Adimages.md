<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adimages | Saved: 2026-09-19 -->

# Ad Account Ad Images



## Reading

Ad Images that belong to this Ad Account.

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/adimages HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/adimages',
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
    "/{ad-account-id}/adimages",
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
    "/{ad-account-id}/adimages",
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
                               initWithGraphPath:@"/{ad-account-id}/adimages"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Fadimages&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `biz_tag_id`<br><br>*int64* | Business tag ID to filter images.<br> |
| `business_id`<br><br>*numeric string or integer* | Optional.<br>Assists with filters such as recently used.<br> |
| `hashes`<br><br>*list<string>* | Hash of the image.<br> |
| `minheight`<br><br>*int64* | Minimum height of the image.<br> |
| `minwidth`<br><br>*int64* | Minimum width of the image.<br> |
| `name`<br><br>*string* | Image name used in image names filter.<br> |

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

A list of [AdImage](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-image) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=__type__).

| Field | Description |
| --- | --- |
| `total_count`<br><br>*int32* | Total number of images in the Ad Account.<br><br><br>**[default]**<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

### /act_{ad_account_id}/adimages
You can make a POST request to *adimages* edge from the following paths:

- [/act_{ad_account_id}/adimages](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adimages)

When posting to this edge, an [AdImage](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-image) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `bytes`<br><br>*Base64 UTF-8 string* | Image file. Example: `bytes = <image content in bytes format>`<br> |
| `copy_from`<br><br>*JSON or object-like arrays* | This copies the Ad Image from the source to the destination account.<br>`{"source_account_id":"<SOURCE_ACCOUNT_ID>"`, `"hash":"02bee5277ec507b6fd0f9b9ff2f22d9c"}`<br><br><br>`source_account_id` *numeric string*<br><br>`hash` *string* |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *images* in the return type.

```
Map  {
string:  Map  {
string:  Struct  {
hash: string,
url: string,
url_128: string,
url_256: string,
url_256_height: string,
url_256_width: string,
height: int32,
width: int32,
name: string,
}}}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 190 | Invalid OAuth 2.0 Access Token |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 613 | Calls to this api have exceeded the rate limit. |

## Updating

You can't perform this operation on this endpoint.

## Deleting

### /act_{ad_account_id}/adimages
You can dissociate an [AdImage](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-image) from an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) by making a DELETE request to [/act_{ad_account_id}/adimages](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adimages).

#### Parameters

| Parameter | Description |
| --- | --- |
| `hash`<br><br>*string* | Hash of the image you wish to delete.<br><br>**[required]**<br> |
| `image_id`<br><br>*string* | ID of the image you wish to delete.<br> |

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
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |

