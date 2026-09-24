<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ad_studies | Saved: 2026-09-19 -->

# Business Ad Studies



## Reading

This business owns these ads-related studies. Includes lift studies, split tests and so on.

#### Example

### HTTP
```
GET /v25.0/{business-id}/ad_studies HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-id}/ad_studies',
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
    "/{business-id}/ad_studies",
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
    "/{business-id}/ad_studies",
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
                               initWithGraphPath:@"/{business-id}/ad_studies"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-id%7D%2Fad_studies&version=v25.0)

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

A list of [AdStudy](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 100 | Invalid parameter |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 104 | Incorrect signature |

## Creating

### /{business_id}/ad_studies
You can make a POST request to *ad_studies* edge from the following paths:

- [/{business_id}/ad_studies](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/ad_studies)

When posting to this edge, an [AdStudy](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `cells`<br><br>*list<Object>* | Describes the cells in the study.<br><br>**[required]**<br><br><br>`description` *string*<br><br>`id` *int64*<br><br>`name` *string*<br><br>`creation_template` *enum {AUTOMATIC_PLACEMENTS, BRAND_AWARENESS, FACEBOOK, FACEBOOK_AUDIENCE_NETWORK, FACEBOOK_INSTAGRAM, FACEBOOK_NEWS_FEED, FACEBOOK_NEWS_FEED_IN_STREAM_VIDEO, IN_STREAM_VIDEO, INSTAGRAM, MOBILE_OPTIMIZED_VIDEO, PAGE_POST_ENGAGEMENT, REACH, TV_COMMERCIAL, TV_FACEBOOK, VIDEO_VIEW_OPTIMIZATION, LOW_FREQUENCY, MEDIUM_FREQUENCY, HIGH_FREQUENCY}*<br><br>`adaccounts` *list<int64>*<br><br>`ads` *list<numeric string or integer>*<br><br>`adsets` *list<numeric string or integer>*<br><br>`campaigns` *list<numeric string or integer>*<br><br>`control_percentage` *float with at most two digits after decimal point*<br><br>`treatment_percentage` *float with at most two digits after decimal point* |
| `client_business`<br><br>*numeric string or integer* | Business associated with the study.<br> |
| `confidence_level`<br><br>*float* | Confidence level used in power calculations and final study report.<br> |
| `cooldown_start_time`<br><br>*integer* | Start of the pre-measurement cool-down period. This period ends when the study period starts.<br> |
| `creative_test_config`<br><br>*JSON object* | (Optional) Configuration for launching a 2-5 cell creative test. Specify either daily_budget or lifetime_budget_percentage to set the budget allocation for the study across the cells' ads. The study's "type" field must also be defined as SPLIT_TEST_V2 when creative_test_config is included in the request.<br> |
| `description`<br><br>*string* | The purpose of the study.<br> |
| `end_time`<br><br>*integer* | Time when the study period ends.<br><br>**[required]**<br> |
| `name`<br><br>*string* | Name of the study.<br><br>**[required]**<br> |
| `objectives`<br><br>*list<Object>* | A vector of objects describing the objectives assigned to this study.<br><br><br>`id` *numeric string or integer*<br><br>`is_primary` *boolean*<br><br>`name` *string*<br><br>`type` *enum {SALES, NONSALES, MAE, TELCO, FTL, MAI, PARTNER, BRANDLIFT, BRAND, MPC_CONVERSION, CONVERSIONS}*<br><br>`offsite_datasets` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`adspixels` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`customconversions` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`applications` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`offline_conversion_data_sets` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`product_sets` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`product_catalogs` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>* |
| `observation_end_time`<br><br>*integer* | The end of the observation period for this study. This period starts when the study period ends.<br> |
| `start_time`<br><br>*integer* | The time when the study period starts.<br><br>**[required]**<br> |
| `type`<br><br>*enum {LIFT, SPLIT_TEST, CONTINUOUS_LIFT_CONFIG, GEO_LIFT, BACKEND_AB_TESTING, CREATIVE_SPEND_ENFORCEMENT, PORTFOLIO_OPTIMIZER, VERSION_CONTROL}* | The type of ad study, such as `SPLIT_TEST` or `LIFT`.<br> |
| `viewers`<br><br>*list<int>* | This study is shared with these people.<br> |

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
| 200 | Permissions error |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

