<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/received_audience_sharing_requests | Saved: 2026-09-19 -->

# Business Received Audience Sharing Requests



## Reading

These are the audience sharing requests which are received by this business

#### Example

### HTTP
```
GET /v25.0/{business-id}/received_audience_sharing_requests HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-id}/received_audience_sharing_requests',
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
    "/{business-id}/received_audience_sharing_requests",
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
    "/{business-id}/received_audience_sharing_requests",
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
                               initWithGraphPath:@"/{business-id}/received_audience_sharing_requests"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-id%7D%2Freceived_audience_sharing_requests&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `initiator_id`<br><br>*numeric string* | The id of the initiator business<br> |
| `request_status`<br><br>*enum {APPROVE, DECLINE, IN_PROGRESS, EXPIRED, PENDING, PENDING_INTEGRITY_REVIEW, PENDING_EMAIL_VERIFICATION, CANCELED, MMA_DIRECT_ASSETS_PENDING, MMA_DIRECT_ASSETS_APPROVED, MMA_DIRECT_ASSETS_DECLINED, MMA_DIRECT_ASSETS_EXPIRED}* | The status of the request<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of BusinessAssetSharingAgreement nodes.

The following fields will be added to each node that is returned:

| Field | Description |
| --- | --- |
| `custom_audiences`<br><br>*list<BusinessAssetSharingAgreementSharedAudienceResponseShape>* | Pending custom audiences for sharing agreement<br><br><br>**[default]**<br> |

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

