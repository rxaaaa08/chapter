<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label | Saved: 2026-09-19 -->

# Ad Label



API users tend to create 1000s of campaigns/ad sets/ads, and would like to have the ability to group together sets of ad objects arbitrarily. For example, an advertiser may want to track all campaigns that are targeting men or women, or track all ads that are using the same creative. Or use external data, like, track all campaigns that were created by a particular team, as a part of a particular marketing initiative.

Until now this could be achieved by overloading the name of the ad object. API developers have come up with complicated naming schemes, creating campaigns with names like **“[client]-[fmp]-[autogen]-[18-34-oregon]-[custaudience-141]”**, and these names are used to parse out tags.

With the introduction of Labels API, we allow developers to tag ad objects with multiple "labels" (strings). Developers can query by these labels, so they can quickly collate and query ad objects such as campaigns, ad sets, ads and creatives that belong to the same “label”.

### Limits {#limits}

The following are the limits on ad sets

| Limit | Value |
| --- | --- |
| Maximum number of ad labels per regular ad account | 100,000 non-deleted ad labels |
| Maximum number of ad labels specified in the spec (to be associated with an ad object) | 50 ad labels spec |

## Reading

An AdLabel

### Getting ad objects associated with a given label

For an ad account, one can retrieve ad objects associated with an ad label. This can be achieved by:

- for campaigns, using endpoint `/campaignsbylabels`

- for ad sets, using endpoint `/adsetsbylabels`

- for ads, using endpoint `/adsbylabels`

- for creatives, using endpoint `/adcreativesbylabels`

Supported operators are `ALL` and `ANY`:
for ids and label names matching, partial string matching is not supported.

```
curl -G \
  -d 'ad_label_ids=["<AD_LABEL_ID>"]' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsbylabels
```

Similarly, field filtering can be used for finding ads, ad sets, campaigns just as done on the insights edge.

The filtering parameter is an array of filter object. Each filter object has three fields: 'field', 'operator' and 'value'. Valid filter operator could be ('EQUAL', 'NOT_EQUAL', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'IN_RANGE', 'NOT_IN_RANGE', 'CONTAIN', 'NOT_CONTAIN', 'IN', 'NOT_IN', 'ANY', 'ALL', 'NONE').

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `id`<br><br>*numeric string* | Ad Label ID<br> |
| `created_time`<br><br>*datetime* | Created time<br> |
| `name`<br><br>*string* | Ad Label name<br><br><br>**[default]**<br> |
| `updated_time`<br><br>*datetime* | Updated time<br> |

#### Edges

| Edge | Description |
| --- | --- |
| [`adcreatives`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label/adcreatives)<br><br>*Edge<AdCreative>* | Creatives associated with this label<br> |
| [`ads`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label/ads)<br><br>*Edge<Adgroup>* | Ads associated with this label<br> |
| [`adsets`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label/adsets)<br><br>*Edge<AdCampaign>* | Ad sets associated with this label<br> |
| [`campaigns`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label/campaigns)<br><br>*Edge<AdCampaignGroup>* | Campaigns associated with this label<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

### /act_{ad_account_id}/adlabels
You can make a POST request to *adlabels* edge from the following paths:

- [/act_{ad_account_id}/adlabels](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adlabels)

When posting to this edge, an [AdLabel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label) will be created.

#### Example

### HTTP
```
POST /v25.0/act_<AD_ACCOUNT_ID>/adlabels HTTP/1.1
Host: graph.facebook.com

name=My+Label
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->post(
    '/act_<AD_ACCOUNT_ID>/adlabels',
    array (
      'name' => 'My Label',
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
    "/act_<AD_ACCOUNT_ID>/adlabels",
    "POST",
    {
        "name": "My Label"
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
params.putString("name", "My Label");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/act_<AD_ACCOUNT_ID>/adlabels",
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
  @"name": @"My Label",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/act_<AD_ACCOUNT_ID>/adlabels"
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
  -F 'name="My Label"' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adlabels
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=POST&path=act_%3CAD_ACCOUNT_ID%3E%2Fadlabels%3Fname%3DMy%2BLabel&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `name`<br><br>*string* | AdLabel name<br><br>**[required]**<br> |

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

This endpoint overrides all set of labels associated with this object, whereas <OBJECT_ID>/adlabels modifies (adds new or reuses specified). If only the label name is supplied, and a label with the name does not exist, then a new label is created and then associated with the ad object.

### /{ad_label_id}
You can update an [AdLabel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label) by making a POST request to [/{ad_label_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label).

#### Parameters

| Parameter | Description |
| --- | --- |
| `name`<br><br>*string* | AdLabel name<br><br>**[required]**<br> |

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
| 100 | Invalid parameter |

### /{ad_creative_id}/adlabels
You can update an [AdLabel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label) by making a POST request to [/{ad_creative_id}/adlabels](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative/adlabels).

#### Parameters

| Parameter | Description |
| --- | --- |
| `adlabels`<br><br>*list<Object>* | Specification of ad labels to be associated with the creative<br><br>**[required]**<br> |

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
| 100 | Invalid parameter |

### /{ad_id}/adlabels
You can update an [AdLabel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label) by making a POST request to [/{ad_id}/adlabels](https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/adlabels).

#### Parameters

| Parameter | Description |
| --- | --- |
| `adlabels`<br><br>*list<Object>* | Specification of adlabels to be associated with the ad<br><br>**[required]**<br> |
| `execution_options`<br><br>*list<enum{validate_only}>* | **Default value: **`Set`<br>An execution setting<br> `validate_only`: when this option is specified, the API call will not perform the mutation but will run through the validation rules against values of each field. <br>If the call passes validation or review, response will be `{"success": true}`. If the call does not pass, an error will be returned with more details. These options can be used to improve any UI to display errors to the user much sooner, e.g. as soon as a new value is typed into any field corresponding to this ad object, rather than at the upload/save stage, or after review.<br> |

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
| 100 | Invalid parameter |

### /{campaign_id}/adlabels
You can update an [AdLabel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label) by making a POST request to [/{campaign_id}/adlabels](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group/adlabels).

#### Parameters

| Parameter | Description |
| --- | --- |
| `adlabels`<br><br>*list<Object>* | Specification of ad labels to be associated with the campaign<br><br>**[required]**<br> |
| `execution_options`<br><br>*list<enum{validate_only}>* | **Default value: **`Set`<br>An execution setting<br> `validate_only`: when this option is specified, the API call will not perform the mutation but will run through the validation rules against values of each field. <br>If the call passes validation or review, response will be `{"success": true}`. If the call does not pass, an error will be returned with more details. These options can be used to improve any UI to display errors to the user much sooner, e.g. as soon as a new value is typed into any field corresponding to this ad object, rather than at the upload/save stage, or after review.<br> |

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
| 100 | Invalid parameter |

## Deleting

### /{ad_label_id}
You can delete an [AdLabel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label) by making a DELETE request to [/{ad_label_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-label).

#### Parameters

This endpoint doesn't have any parameters.

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

