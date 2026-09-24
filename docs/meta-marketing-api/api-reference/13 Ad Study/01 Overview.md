<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study | Saved: 2026-09-19 -->

# Ad Study



Test your ads and choose the strategy that is driving the most conversions. For example, create a split test to find out which ad set performs the best:

### cURL
```
curl \
-F 'name="new study"' \
-F 'description="test creative"' \
-F 'start_time=1435622400' \
-F 'end_time=1436918400' \
-F 'type=SPLIT_TEST' \
-F 'cells=[{name:"Group A",treatment_percentage:50,adsets:[<AD_SET_ID>]},{name:"Group B",treatment_percentage:50,adsets:[<AD_SET_ID>]}]' \
-F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/ad_studies
```

Use ad study for these experiments:

| Study Type | Use Case |
| --- | --- |
| [Split Testing](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/split-testing) | Inform near-term optimization decisions. Example: Is Creative A doing better than Creative B? |
| [Conversion Lift](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lift-studies) | Measure incremental impact of Facebook ads on business outcomes. |
| [Multi-Cell Conversion Lift](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lift-studies) | Measure incremental impact of different Facebook ads strategies on business outcomes. |
| [Brand Lift Results](https://developers.facebook.com/docs/marketing-api/guides/brand_lift) | Retrieve and analyze your brand lift study results. |

See [Lift Study](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lift-studies) for setting up Conversion Lift and Multi-Cell Conversion Lift.

## Reading

A lift study object

### Examples {#read-examples}

To read the details for a study, make a `HTTP GET` to:

```
https://graph.facebook.com/<API_VERSION>/<AD_STUDY_ID>
```

To read about the cells in a study:

### cURL
```
curl -G \
-d 'fields="name,treatment_percentage,campaigns,adsets,adaccounts"' \
-d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/<AD_STUDY_ID>/cells

// The response
{
  "data": [
    {
      "id": "<CELL_ID>",
      "name": Group A,
      "treatment_percentage": 50,
      "adsets": {
        "data": [
          {
           "id": "<AD_SET_ID>"
          }
        ],
      }
    },
    {
      "id": "<CELL_ID>",
      "name": Group B,
      "treatment_percentage": 50,
      "adsets": {
        "data": [
          {
            "id": "<AD_SET_ID>"
          }
        ],
      }
    }
  ],
}
```

#### Example

### HTTP
```
GET /v25.0/{ad-study-id} HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-study-id}',
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
    "/{ad-study-id}",
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
    "/{ad-study-id}",
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
                               initWithGraphPath:@"/{ad-study-id}"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-study-id%7D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `id`<br><br>*numeric string* | ID of the Lift study<br><br><br>**[default]**<br> |
| `business`<br><br>*[Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business)* | The business that owns this study if it exists.<br> |
| `canceled_time`<br><br>*datetime* | Time stamp when study was canceled<br> |
| `cooldown_start_time`<br><br>*datetime* | Cooldown start time<br> |
| `created_by`<br><br>*[User](https://developers.facebook.com/docs/graph-api/reference/user)* | Who Lift study was created by<br> |
| `created_time`<br><br>*datetime* | When was the Lift study created<br> |
| `description`<br><br>*string* | Description<br><br><br>**[default]**<br> |
| `end_time`<br><br>*datetime* | End time<br><br><br>**[default]**<br> |
| `name`<br><br>*string* | Name of the Lift study<br><br><br>**[default]**<br> |
| `observation_end_time`<br><br>*datetime* | Observation end time<br> |
| `results_first_available_date`<br><br>*string* | When results for at least one objective of the study are available<br> |
| `start_time`<br><br>*datetime* | Start time<br><br><br>**[default]**<br> |
| `type`<br><br>*string* | The type of study, either audience segmentation or lift.<br> |
| `updated_by`<br><br>*[User](https://developers.facebook.com/docs/graph-api/reference/user)* | Updated by<br> |
| `updated_time`<br><br>*datetime* | Updated time<br> |

#### Edges

| Edge | Description |
| --- | --- |
| [`cells`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study/cells)<br><br>*Edge<AdStudyCell>* | The cells which are part of the objective<br> |
| [`objectives`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study/objectives)<br><br>*Edge<AdStudyObjective>* | The objectives which are part of the objective<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

### Requirements {#remarks}

- `treatment_percentage` for each cell should be at least 10.

- The sum of `treatment_percentage` for all study cells should be less or equal to 100.

- Each cell must have at least one object associated with it. The object can be `adaccounts`, `campaigns`, or `adsets`.

### /{user_id}/ad_studies
You can make a POST request to *ad_studies* edge from the following paths:

- [/{user_id}/ad_studies](https://developers.facebook.com/docs/graph-api/reference/user/ad_studies)

When posting to this edge, an [AdStudy](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `cells`<br><br>*list<Object>* | A shape to describe the cells of the study<br><br><br>`description` *string*<br><br>`id` *int64*<br><br>`name` *string*<br><br>`creation_template` *enum {AUTOMATIC_PLACEMENTS, BRAND_AWARENESS, FACEBOOK, FACEBOOK_AUDIENCE_NETWORK, FACEBOOK_INSTAGRAM, FACEBOOK_NEWS_FEED, FACEBOOK_NEWS_FEED_IN_STREAM_VIDEO, IN_STREAM_VIDEO, INSTAGRAM, MOBILE_OPTIMIZED_VIDEO, PAGE_POST_ENGAGEMENT, REACH, TV_COMMERCIAL, TV_FACEBOOK, VIDEO_VIEW_OPTIMIZATION, LOW_FREQUENCY, MEDIUM_FREQUENCY, HIGH_FREQUENCY}*<br><br>`adaccounts` *list<int64>*<br><br>`ads` *list<numeric string or integer>*<br><br>`adsets` *list<numeric string or integer>*<br><br>`campaigns` *list<numeric string or integer>*<br><br>`control_percentage` *float with at most two digits after decimal point*<br><br>`treatment_percentage` *float with at most two digits after decimal point* |
| `client_business`<br><br>*numeric string or integer* | Business associated with study<br> |
| `confidence_level`<br><br>*float* | Confidence level used in power calculation and final report<br> |
| `cooldown_start_time`<br><br>*integer* | The beginning of the pre measurement cooldown period. This period ends when the study period starts.<br> |
| `creative_test_config`<br><br>*JSON object* | (Optional) Configuration for launching a 2-5 cell creative test. Specify either daily_budget or lifetime_budget_percentage to set the budget allocation for the study across the cells' ads. Study "type" field must be defined as SPLIT_TEST_V2 when creative_test_config is included in the request.<br> |
| `description`<br><br>*string* | A brief description about the purpose of the study.<br> |
| `end_time`<br><br>*integer* | The time when the study period ends.<br> |
| `name`<br><br>*string* | The name of the study.<br> |
| `objectives`<br><br>*list<Object>* | A vector of objects describing the objectives assigned to this study<br><br><br>`id` *numeric string or integer*<br><br>`is_primary` *boolean*<br><br>`name` *string*<br><br>`type` *enum {SALES, NONSALES, MAE, TELCO, FTL, MAI, PARTNER, BRANDLIFT, BRAND, MPC_CONVERSION, CONVERSIONS}*<br><br>`offsite_datasets` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`adspixels` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`customconversions` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`applications` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`offline_conversion_data_sets` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`product_sets` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`product_catalogs` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>* |
| `observation_end_time`<br><br>*integer* | The end of the observation period for this study, this period starts when the study period ends.<br> |
| `start_time`<br><br>*integer* | The time when the study period starts.<br> |
| `type`<br><br>*enum {LIFT, SPLIT_TEST, CONTINUOUS_LIFT_CONFIG, GEO_LIFT, BACKEND_AB_TESTING, CREATIVE_SPEND_ENFORCEMENT, PORTFOLIO_OPTIMIZER, VERSION_CONTROL}* | The type of ad study, either SPLIT_TEST or LIFT.<br> |
| `viewers`<br><br>*list<int>* | The list of people who this study has been shared with.<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```
Struct  {
id: numeric string,
cell_ids:  List  [numeric string],
objective_ids:  List  [numeric string],
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |

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

To update study fields:

### cURL
```
curl \
-F 'name="new name"' \
-F 'end_time=1437004800' \
-F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/<AD_STUDY_ID>
```

Add a cell an existing study and change `treatment_percentage` of all the cells:

### cURL
```
curl \
-F 'cells=[{id:<CELL_ID>,treatment_percentage:50},{id:<CELL_ID>,treatment_percentage:10},{name:"Group C",treatment_percentage:20,adsets:[<AD_SET_ID>]}]' \
-F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<API_VERSION>/<AD_STUDY_ID>
```

### Limitations {#remarks}

To update `treatment_percentage` for a cell, do it at the study level along with other cells. You also make updates to a study to add additional cells to it. You must provide the percentage of all existing and new cells in the study update since they are correlated.

Once the study runs, you cannot update `start_time`, `treatment_percentage` for cells. You cannot remove associated objects such as `adsets`, `adaccounts`, `campaigns`. However, you can update `end_time` to the future time if the study is not yet ended and add new associated objects to the cells if needed.

### /{ad_study_id}
You can update an [AdStudy](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study) by making a POST request to [/{ad_study_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-study).

#### Parameters

| Parameter | Description |
| --- | --- |
| `cells`<br><br>*list<Object>* | A shape to describe the cells of the study<br><br><br>`description` *string*<br><br>`id` *int64*<br><br>`name` *string*<br><br>`creation_template` *enum {AUTOMATIC_PLACEMENTS, BRAND_AWARENESS, FACEBOOK, FACEBOOK_AUDIENCE_NETWORK, FACEBOOK_INSTAGRAM, FACEBOOK_NEWS_FEED, FACEBOOK_NEWS_FEED_IN_STREAM_VIDEO, IN_STREAM_VIDEO, INSTAGRAM, MOBILE_OPTIMIZED_VIDEO, PAGE_POST_ENGAGEMENT, REACH, TV_COMMERCIAL, TV_FACEBOOK, VIDEO_VIEW_OPTIMIZATION, LOW_FREQUENCY, MEDIUM_FREQUENCY, HIGH_FREQUENCY}*<br><br>`adaccounts` *list<int64>*<br><br>`ads` *list<numeric string or integer>*<br><br>`adsets` *list<numeric string or integer>*<br><br>`campaigns` *list<numeric string or integer>*<br><br>`control_percentage` *float with at most two digits after decimal point*<br><br>`treatment_percentage` *float with at most two digits after decimal point* |
| `client_business`<br><br>*numeric string or integer* | Business associated with study<br> |
| `confidence_level`<br><br>*float* | Confidence level used in power calculation and final report<br> |
| `cooldown_start_time`<br><br>*integer* | The beginning of the pre measurement cooldown period. This period ends when the study period starts.<br> |
| `creative_test_config`<br><br>*JSON object* | (Optional) Configuration for launching a 2-5 cell creative test. Specify either daily_budget or lifetime_budget_percentage to set the budget allocation for the study across the cells' ads. Must be used with study type SPLIT_TEST_V2<br> |
| `description`<br><br>*string* | A brief description about the purpose of the study.<br> |
| `end_time`<br><br>*integer* | The time when the study period ends.<br> |
| `name`<br><br>*string* | The name of the study.<br> |
| `objectives`<br><br>*list<Object>* | A vector of objects describing the objectives assigned to this study<br><br><br>`id` *numeric string or integer*<br><br>`is_primary` *boolean*<br><br>`name` *string*<br><br>`type` *enum {SALES, NONSALES, MAE, TELCO, FTL, MAI, PARTNER, BRANDLIFT, BRAND, MPC_CONVERSION, CONVERSIONS}*<br><br>`offsite_datasets` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`adspixels` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`customconversions` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`applications` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`offline_conversion_data_sets` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`product_sets` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>*<br><br>`product_catalogs` *list<JSON or object-like arrays>*<br><br>`id` *numeric string or integer*<br>**[required]**<br><br><br>`event_names` *list<string>* |
| `observation_end_time`<br><br>*integer* | The end of the observation period for this study, this period starts when the study period ends.<br> |
| `start_time`<br><br>*integer* | The time when the study period starts.<br> |
| `type`<br><br>*enum {LIFT, SPLIT_TEST, CONTINUOUS_LIFT_CONFIG, GEO_LIFT, BACKEND_AB_TESTING, CREATIVE_SPEND_ENFORCEMENT, PORTFOLIO_OPTIMIZER, VERSION_CONTROL}* | A type of the study.<br> |
| `viewers`<br><br>*list<int>* | The list of people who this study has been shared with.<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
success: bool,
cell_ids:  List  [numeric string],
objective_ids:  List  [numeric string],
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |

## Deleting

To delete a study:

```
curl -X DELETE
"https://graph.facebook.com/<API_VERSION>/<AD_STUDY_ID>"
```

You can't perform this operation on this endpoint.

