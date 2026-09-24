<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel | Saved: 2026-09-19 -->

# Ad Pixel



## Reading

A Facebook pixel is a small piece of JavaScript code that an      advertiser places on every page of their website. This piece of code      provides a set of lightweight functionalities for sending user-specific      events and event-specific custom data to Facebook.      Advertisers can use the Facebook pixel to capture intent      information about how people are using their website.      A single Facebook pixel is added to all pages of a website, and is      then used to create [website custom      audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences)

#### Example

### HTTP
```
GET /v25.0/{ads-pixel-id} HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ads-pixel-id}',
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
    "/{ads-pixel-id}",
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
    "/{ads-pixel-id}",
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
                               initWithGraphPath:@"/{ads-pixel-id}"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bads-pixel-id%7D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `id`<br><br>*numeric string* | ID of the pixel<br><br><br>**[default]**<br> |
| `automatic_matching_fields`<br><br>*list<enum>* | Advanced matching fields which are enabled for automatic advanced matching<br> |
| `can_proxy`<br><br>*bool* | can_proxy<br> |
| `code`<br><br>*string* | Pixel code to be placed on the website<br> |
| `config` This field is only accessible in v13.0 or later.<br><br>*string* | The configuration to use for uploads to this dataset. Format determined by the method of upload (eg. UI or SDK)<br> |
| `creation_time`<br><br>*datetime* | Time at which the pixel was created<br> |
| `creator`<br><br>*[User](https://developers.facebook.com/docs/graph-api/reference/user)* | The user who created this pixel<br> |
| `data_use_setting`<br><br>*enum* | Setting to capture how pixel data should be used<br> |
| `description` This field is only accessible in v13.0 or later.<br><br>*string* | SELF_EXPLANATORY<br> |
| `duplicate_entries` This field is only accessible in v13.0 or later.<br><br>*integer* | Number of duplicate entries for this dataset<br> |
| `enable_auto_assign_to_accounts` This field is only accessible in v13.0 or later.<br><br>*bool* | Whether the dataset is auto assigned and auto tracked for all accounts that the owner business owns<br> |
| `enable_automatic_matching`<br><br>*bool* | Represents whether automatic advanced matching is enabled for the pixel for identity matching purposes<br> |
| `event_stats` This field is only accessible in v13.0 or later.<br><br>*string* | Event stats of this dataset<br> |
| `event_time_max` This field is only accessible in v13.0 or later.<br><br>*integer* | Latest entry of this dataset<br> |
| `event_time_min` This field is only accessible in v13.0 or later.<br><br>*integer* | Earliest entry of this dataset<br> |
| `first_party_cookie_status`<br><br>*enum* | First party cookie status to indicate whether first party cookies can be set for this pixel<br> |
| `has_1p_pixel_event`<br><br>*bool* | whether pixel has sent us 1p signals<br> |
| `is_consolidated_container` This field is only accessible in v13.0 or later.<br><br>*bool* | A boolean value indicating whether this signal container has unified pixel and offline conversion data set<br> |
| `is_created_by_business`<br><br>*bool* | Flag stands for if a pixel is created by business<br> |
| `is_crm`<br><br>*bool* | True if a pixel contains lead gen data source config<br> |
| `is_mta_use` This field is only accessible in v13.0 or later.<br><br>*bool* | Whether the dataset is restricted to MTA only<br> |
| `is_restricted_use` This field is only accessible in v13.0 or later.<br><br>*bool* | Whether the dataset is restricted to Lift only<br> |
| `is_unavailable`<br><br>*bool* | Whether this pixel is unavailable<br> |
| `last_fired_time`<br><br>*datetime* | Time at which the pixel was last fired<br> |
| `last_upload_app` This field is only accessible in v13.0 or later.<br><br>*string* | The app that made the most recent upload<br> |
| `last_upload_app_changed_time` This field is only accessible in v13.0 or later.<br><br>*integer* | Time when the app that made the most recent upload last changed<br> |
| `match_rate_approx` This field is only accessible in v13.0 or later.<br><br>*int32* | Approximate match rate percentage for the entries in this dataset<br> |
| `matched_entries` This field is only accessible in v13.0 or later.<br><br>*integer* | Number of matched entries of this dataset<br> |
| `name`<br><br>*string* | Name of the pixel<br> |
| `owner_business`<br><br>*[Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business)* | ID of the business that owns this pixel or null if the pixel has not been claimed by any business yet.<br> |
| `usage` This field is only accessible in v13.0 or later.<br><br>*OfflineConversionDataSetUsage* | Usage info for the dataset<br> |
| `valid_entries` This field is only accessible in v13.0 or later.<br><br>*integer* | Number of valid entries of this dataset<br> |

#### Edges

| Edge | Description |
| --- | --- |
| [`assigned_users`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/assigned_users)<br><br>*Edge<AssignedUser>* | assigned_users<br> |
| [`da_checks`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/da_checks)<br><br>*Edge<DACheck>* | A list of results after running Dynamic Ads checks on this pixel.<br> |
| [`offline_event_uploads`](https://developers.facebook.com/docs/marketing-api/reference/ads-pixel/offline_event_uploads) This field is only accessible in v13.0 or later.<br><br>*Edge<OfflineConversionDataSetUpload>* | The offline uploads associated with this event set<br> |
| [`openbridge_configurations`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/openbridge_configurations)<br><br>*Edge<OpenBridgeConfiguration>* | Get all the openbridge configurations associated to this Pixel<br> |
| [`shared_agencies`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/shared_agencies)<br><br>*Edge<Business>* | Agencies or other businesses this pixel is shared with<br> |
| [`stats`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/stats)<br><br>*Edge<AdsPixelStatsResult>* | Stats data for this pixel<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 100 | Invalid parameter |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 190 | Invalid OAuth 2.0 Access Token |
| 2500 | Error parsing graph query |

## Creating

### /act_{ad_account_id}/adspixels
You can make a POST request to *adspixels* edge from the following paths:

- [/act_{ad_account_id}/adspixels](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adspixels)

When posting to this edge, an [AdsPixel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel) will be created.

#### Example

### HTTP
```
POST /v25.0/act_<AD_ACCOUNT_ID>/adspixels HTTP/1.1
Host: graph.facebook.com

name=My+WCA+Pixel
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->post(
    '/act_<AD_ACCOUNT_ID>/adspixels',
    array (
      'name' => 'My WCA Pixel',
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
    "/act_<AD_ACCOUNT_ID>/adspixels",
    "POST",
    {
        "name": "My WCA Pixel"
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
params.putString("name", "My WCA Pixel");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/act_<AD_ACCOUNT_ID>/adspixels",
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
  @"name": @"My WCA Pixel",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/act_<AD_ACCOUNT_ID>/adspixels"
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
  -F 'name="My WCA Pixel"' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adspixels
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=POST&path=act_%3CAD_ACCOUNT_ID%3E%2Fadspixels%3Fname%3DMy%2BWCA%2BPixel&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `name`<br><br>*string* | Name of the pixel<br> |

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
| 6202 | More than one pixel exist for this account |
| 6200 | A pixel already exists for this account |
| 100 | Invalid parameter |
| 200 | Permissions error |

## Updating

### /{ads_pixel_id}
You can update an [AdsPixel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel) by making a POST request to [/{ads_pixel_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel).

#### Parameters

| Parameter | Description |
| --- | --- |
| `automatic_matching_fields`<br><br>*array<enum {em, fn, ln, ph, ge, zp, ct, st, country, db, external_id}>* | Advanced matching fields for which automatic advanced matching should be enabled<br> |
| `data_use_setting`<br><br>*enum {EMPTY, ADVERTISING_AND_ANALYTICS, ANALYTICS_ONLY}* | Setting to capture how pixel data should be used<br> |
| `enable_automatic_matching`<br><br>*boolean* | Enable automatic advanced matching for the pixel for identity matching purposes<br> |
| `first_party_cookie_status`<br><br>*enum {EMPTY, FIRST_PARTY_COOKIE_ENABLED, FIRST_PARTY_COOKIE_DISABLED}* | First party cookie status to indicate whether first party cookies can be set for this pixel<br> |
| `name`<br><br>*string* | Name of the pixel<br> |
| `server_events_business_ids`<br><br>*array<numeric string>* | server_events_business_ids<br> |

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
| 190 | Invalid OAuth 2.0 Access Token |
| 100 | Invalid parameter |

## Deleting

