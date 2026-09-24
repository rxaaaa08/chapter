<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/conversion-action-query | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Conversion Action Query

## Reading

Conversion Action Query

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=...%3Ffields%3D%257Bfieldname_of_type_ConversionActionQuery%257D&version=v26.0)

```
GET v26.0/...?fields={fieldname_of_type_ConversionActionQuery} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '...?fields={fieldname_of_type_ConversionActionQuery}',
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

```
/* make the API call */
FB.api(
    "...?fields={fieldname_of_type_ConversionActionQuery}",
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

```
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "...?fields={fieldname_of_type_ConversionActionQuery}",
    null,
    HttpMethod.GET,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

```
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"...?fields={fieldname_of_type_ConversionActionQuery}"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api/).

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `action.type`list<(list) or (string)> | Action type [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `application`list<(list) or (id)> | Application [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `conversion_id`list<id> | Rule based offsite conversion [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `creative`list<(list) or (id)> | Creative [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `dataset`list<id> | Dataset [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `event`list<string> | Event [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `event.creator`list<id> | Event creator [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `event_type`list<string> | Event Type [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `fb_pixel`list<id> | Facebook pixel id [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `fb_pixel_event`list<string> | Facebook pixel event [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `leadgen`list<id> | Leadgen [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `object`list<id> | Object [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `object.domain`list<id> | Object domain [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `offer`list<id> | Offer [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `offer.creator`list<id> | Offer creator [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `offsite_pixel`list<id> | Offsite pixel [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `page`list<id> | Page [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `page.parent`list<id> | Page parent [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `post`list<id> | Post [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `post.object`list<id> | Post object [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `post.object.wall`list<id> | Post object wall [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `post.wall`list<id> | Post wall [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `question`list<id> | Question [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `question.creator`list<id> | Question creator [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `response`list<string> | Response [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `subtype`list<string> | Subtype [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
