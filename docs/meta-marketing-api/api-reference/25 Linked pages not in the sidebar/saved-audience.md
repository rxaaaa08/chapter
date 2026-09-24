<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/saved-audience | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Saved Audience

To improve how advertisers create and manage their audiences, Saved Audiences that have not been used in any active ad sets in over two years will be automatically deleted on a rolling basis. For more information, see the [Custom Audiences Overview](https://developers.facebook.com/docs/marketing-api/audiences/overview#custom-audiences-deletion) documentation.

## Reading

Object representing a targeting spec that has been saved for later use.

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bsaved-audience-id%7D&version=v26.0)

```
GET /v26.0/{saved-audience-id} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{saved-audience-id}',
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
    "/{saved-audience-id}",
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
    "/{saved-audience-id}",
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
                               initWithGraphPath:@"/{saved-audience-id}"
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
| `id`numeric string | ID [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `approximate_count_lower_bound`integer | Estimated lower bound on reach of this saved audience as a 64 bit int |
| `approximate_count_upper_bound`integer | Estimated upper bound on reach of this saved audience as a 64 bit int |
| `description`string | Description of this saved audience provided by owner |
| `name`string | Name of this saved audience [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `permission_for_actions`AudiencePermissionForActions | Permissions for actions to the audience |
| `run_status`enum | Whether the saved audience is active or deleted |
| `sentence_lines`list | The targeting sentence lines of this saved audience |
| `targeting`[Targeting](https://developers.facebook.com/docs/marketing-api/reference/targeting/) | Target spec saved in this audience |
| `time_created`datetime | Creation time of this saved audience |
| `time_updated`datetime | Last time the saved audience being updated by its owner |

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 190 | Invalid OAuth 2.0 Access Token |
| 200 | Permissions error |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
