<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/agency-client-declaration | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Agency Client Declaration

## Reading

Details of the agency advertising on behalf of this client account, if applicable.

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=...%3Ffields%3D%257Bfieldname_of_type_AgencyClientDeclaration%257D&version=v26.0)

```
GET v26.0/...?fields={fieldname_of_type_AgencyClientDeclaration} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '...?fields={fieldname_of_type_AgencyClientDeclaration}',
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
    "...?fields={fieldname_of_type_AgencyClientDeclaration}",
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
    "...?fields={fieldname_of_type_AgencyClientDeclaration}",
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
                               initWithGraphPath:@"...?fields={fieldname_of_type_AgencyClientDeclaration}"
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
| `agency_representing_client`unsigned int32 | Whether this account is for an agency representing a client [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `client_based_in_france`unsigned int32 | Whether the client is based in France [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `client_city`string | Client's city [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `client_country_code`string | Client's country code [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `client_email_address`string | Client's email address [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `client_name`string | Name of the client [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `client_postal_code`string | Client's postal code [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `client_province`string | Client's province [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `client_street`string | First line of client's street address [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `client_street2`string | Second line of client's street address [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `has_written_mandate_from_advertiser`unsigned int32 | Whether the agency has a written mandate to advertise on behalf of this client [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `is_client_paying_invoices`unsigned int32 | Whether the client is paying via invoice [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
