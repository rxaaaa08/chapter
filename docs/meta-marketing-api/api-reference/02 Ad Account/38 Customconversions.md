<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/customconversions | Saved: 2026-09-19 -->

# Ad Account, Custom Conversions



Data on custom conversion events from event sources, such as a Meta Pixel. You can query this data to measure the effectiveness of our ads. Or use it to optimize ad delivery to target people who converted as defined by your customization and rules.

## Reading

Ad Account Custom Conversions

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/customconversions HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/customconversions',
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
    "/{ad-account-id}/customconversions",
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
    "/{ad-account-id}/customconversions",
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
                               initWithGraphPath:@"/{ad-account-id}/customconversions"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Fcustomconversions&version=v25.0)

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

A list of [CustomConversion](https://developers.facebook.com/docs/marketing-api/reference/custom-conversion) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 100 | Invalid parameter |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 190 | Invalid OAuth 2.0 Access Token |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |

## Creating

### /act_{ad_account_id}/customconversions
You can make a POST request to *customconversions* edge from the following paths:

- [/act_{ad_account_id}/customconversions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/customconversions)

When posting to this edge, a [CustomConversion](https://developers.facebook.com/docs/marketing-api/reference/custom-conversion) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `action_source_type`<br><br>*enum {app, chat, email, other, phone_call, physical_store, system_generated, website, business_messaging}* | Action source type the custom conversion is created from.<br> |
| `advanced_rule`<br><br>*string* | Advanced ruleset for the custom conversion being created allowing multiple sources.<br> |
| `custom_event_type`<br><br>*enum {ADD_PAYMENT_INFO, ADD_TO_CART, ADD_TO_WISHLIST, COMPLETE_REGISTRATION, CONTENT_VIEW, INITIATED_CHECKOUT, LEAD, PURCHASE, SEARCH, CONTACT, CUSTOMIZE_PRODUCT, DONATE, FIND_LOCATION, SCHEDULE, START_TRIAL, SUBMIT_APPLICATION, SUBSCRIBE, LISTING_INTERACTION, FACEBOOK_SELECTED, OTHER}* | The custom event type of the conversion being created.<br> |
| `default_conversion_value`<br><br>*float* | **Default value: **`0`<br>The default conversion value of the conversion being created.<br> |
| `description`<br><br>*string* | The description of the conversion being created.<br> |
| `event_source_id`<br><br>*numeric string or integer* | Event source ID, where event sources are a Pixel, offline event sets and so on. Aggregate custom conversion data from these sources.<br> |
| `name`<br><br>*string* | The name of the conversion being created.<br><br>**[required]**<br> |
| `rule`<br><br>*string* | Only count an event as a custom conversion if it fulfills this rule.<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```
Struct  {
id: numeric string,
is_custom_event_type_predicted: numeric string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 100 | Invalid parameter |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

