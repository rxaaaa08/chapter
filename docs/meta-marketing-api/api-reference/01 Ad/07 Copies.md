<!-- Source: https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/copies | Saved: 2026-09-19 -->

# Ad Copies



**Note:** The Marketing API has it is own rate limiting logic. If you are encountering errors mentioning a reached limit, see [Rate Limiting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/rate-limiting).

## Reading

The copies of this ad.

#### Example

### HTTP
```
GET /v25.0/{ad-id}/copies HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-id}/copies',
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
    "/{ad-id}/copies",
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
    "/{ad-id}/copies",
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
                               initWithGraphPath:@"/{ad-id}/copies"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-id%7D%2Fcopies&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `date_preset`<br><br>*enum{today, yesterday, this_month, last_month, this_quarter, maximum, data_maximum, last_3d, last_7d, last_14d, last_28d, last_30d, last_90d, last_week_mon_sun, last_week_sun_sat, last_quarter, last_year, this_week_mon_today, this_week_sun_today, this_year}* | Preset date range used to aggregate insights metrics<br> |
| `effective_status`<br><br>*list<string>* | Filter Ads by effective status<br> |
| `time_range`<br><br>*{'since':YYYY-MM-DD,'until':YYYY-MM-DD}* | Time range used to aggregate insights metrics<br><br><br>`since` *datetime*<br>A date in the format of "YYYY-MM-DD", which means from the beginning midnight of that day.<br><br><br>`until` *datetime*<br>A date in the format of "YYYY-MM-DD", which means to the beginning midnight of the following day.<br> |
| `updated_since`<br><br>*integer* | Filter ads by updated since time<br> |

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

A list of [Ad](https://developers.facebook.com/docs/graph-api/reference/adgroup) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=__type__).

| Field | Description |
| --- | --- |
| `insights`<br><br>*Edge<AdsInsights>* | Analytics summary for all objects<br> |
| `total_count`<br><br>*unsigned int32* | Total number of objects<br><br><br>**[default]**<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 104 | Incorrect signature |

## Creating

### Targeting DSA Regulated Locations (European Union)

To copy an ad set targeted in the European Union's Digital Services Act (DSA) regulated locations, please set the payor/beneficiary information first. Otherwise the copying request may respond with one of the following errors:

**Payor missing error**

```
{
  "error": {
    "message": "Invalid parameter",
    "type": "FacebookApiException",
    "code": 100,
    "error_data": "{\"blame_field_specs\":[[\"dsa_payor\"]]}",
    "error_subcode": 3858079,
    "is_transient": false,
    "error_user_title": "No payor provided in DSA regulated region",
    "error_user_msg": "The DSA requires ads to provide payor information in regulated regions. Updating/creating ad needs to provide payor of the ad.",
    "fbtrace_id": "fbtrace_id"
  },
  "__fb_trace_id__": "fbtrace_id",
  "__www_request_id__": "request_id"
}
```

**Beneficiary missing error**

```
{
  "error": {
    "message": "Invalid parameter",
    "type": "FacebookApiException",
    "code": 100,
    "error_data": "{\"blame_field_specs\":[[\"dsa_beneficiary\"]]}",
    "error_subcode": 3858081,
    "is_transient": false,
    "error_user_title": "No payor/beneficiary provided in DSA regulated location",
    "error_user_msg": "The DSA requires ads to provide beneficiary information in regulated regions. Updating/creating ad needs to provide beneficiary of the ad.",
    "fbtrace_id": "fbtrace_id"
  },
  "__fb_trace_id__": "fbtrace_id",
  "__www_request_id__": "request_id"
}
```

### Creative Parameters

When making a copy of an ad, you may overwrite fields on the creative spec by using the `creative_parameters` argument. Currently, this supports overwriting the API spec at the top-level parameter level, i.e. when `creative_parameter` supplied, the new creative will use all of the newly provided value for any valid parameter.  Otherwise, the values from the source ad’s creative will be used.

Find out more about the available fields in our [documentation for ad creatives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adcreatives).

#### Creative spec overwrite example

Original creative

```
{
  "body": "original ad body",
  "degrees_of_freedom_spec": {
    "creative_features_spec": {
      "text_optimizations": {
        "enroll_status": "OPT_IN"
      },
      "inline_comment": {
        "enroll_status": "OPT_IN"
      }
    }
  },
  "image_url": "https://example.com/my-image-url",
  "name": "original ad name",
  "title": "original ad body"
}
```

Supplied input for copy operation

```
{
  "degrees_of_freedom_spec": {
    "creative_features_spec": {
      "text_optimizations": {
        "enroll_status": "OPT_IN"
      },
      "image_touchups": {
        "enroll_status": "OPT_IN"
      }
    }
  },
  "image_url": "https://example.com/my–other-image-url",
  "url_tags": "source=fb_ad"
}
```

Resulting creative

```
{
  "body": "original ad body",
  "degrees_of_freedom_spec": {
    "creative_features_spec": {
      "text_optimizations": {
        "enroll_status": "OPT_IN"
      },
      "image_touchups": {
        "enroll_status": "OPT_IN"
      }
    }
  },
  "image_url": "https://example.com/my–other-image-url",
  "name": "original ad name",
  "title": "original ad body",
  "url_tags": "source=fb_ad"
}
```

Note the following:

- `body`, `name`, `title` are not supplied in the input spec, so they are carried over from the original

- `url_tags` is defined in the input spec, but not in the original spec.  It is defined in the new spec

- `image_url `is defined in both.  The input value is used in the new spec.

- `degrees_of_freedom_spec` defines opt-ins for `text_optimizations` and `inline_comment` in the original spec, and only `text_optimizations` and `image_touchups` in the new spec.  The input `degrees_of_freedom_spec` completely overrides the old one, and previously defined sub-fields are not used.

### /{ad_id}/copies
You can make a POST request to *copies* edge from the following paths:

- [/{ad_id}/copies](https://developers.facebook.com/documentation/ads-commerce/graph-api/reference/adgroup/copies)

When posting to this edge, an [Ad](https://developers.facebook.com/docs/graph-api/reference/adgroup) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `adset_id`<br><br>*numeric string or integer* | Single ID of an adset object to make the parent of the copy. Ignore if you want to keep the copy under the original adset parent.<br> |
| `creative_parameters`<br><br>*AdCreative* | Creative inputs which will be used to construct the creative in the new ad.  Overwrites happen at the top level.  If no input is provided, the new ad will be created with an identical ad creative.  If some input is provided, those parameters will be assigned to the ad creative created by this API call.<br><br><br>Accepts all ad creative parameters as specified in /documentation/ads-commerce/marketing-api/reference/ad-account/adcreatives<br><br>**[supports emoji]**<br> |
| `rename_options`<br><br>*JSON or object-like arrays* | Rename options<br><br><br>`rename_strategy` *enum {DEEP_RENAME, ONLY_TOP_LEVEL_RENAME, NO_RENAME}*<br><br>**Default value: **`ONLY_TOP_LEVEL_RENAME`<br>`DEEP_RENAME`: will change this object's name and children's names in the copied object. `ONLY_TOP_LEVEL_RENAME`: will change the this object's name but won't change the children's name in the copied object. `NO_RENAME`: will change no name in the copied object<br><br><br>`rename_prefix` *string*<br>A prefix to copy names. Defaults to null if not provided.<br><br><br>`rename_suffix` *string*<br>A suffix to copy names. Defaults to null if not provided and appends a localized string of `- Copy` based on the ad account locale.<br> |
| `status_option`<br><br>*enum {ACTIVE, PAUSED, INHERITED_FROM_SOURCE}* | **Default value: **`PAUSED`<br>`ACTIVE`: the copied ad will have active status. `PAUSED`: the copied ad will have paused status. `INHERITED_FROM_SOURCE`: the copied ad will have the parent status.<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *copied_ad_id* in the return type.

```
Struct  {
copied_ad_id: numeric string,
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

