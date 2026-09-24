<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/client_objects | Saved: 2026-09-19 -->

# Business Client Objects



## Reading

All client objects of the business.

#### Example

### HTTP
```
GET /v25.0/{business-id}/client_objects HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-id}/client_objects',
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
    "/{business-id}/client_objects",
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
    "/{business-id}/client_objects",
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
                               initWithGraphPath:@"/{business-id}/client_objects"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-id%7D%2Fclient_objects&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `owner_biz_id`<br><br>*Business ID* | if present filter on owner business of the objects<br> |
| `type`<br><br>*enum {page, profile-plus, ad-account, ad-draft-workspace, product-catalog, app, pixel, system-user, brand, user, project, instagram-account, instagram-account-v2, funding-source, legal-entity, legacy-login, business_request, example-cat, monetization-property, grp-plan, credit-partition, payout-method, ad-study, saved-audience, shared-audience, shared-platform-audience, event-source-group, offline-event-set, ad-image, photo, block-list, finance, ip, credit-partition-config, video-asset, business-unit, page-locations, ad-account-creation-request, reseller_vetting_oe_request, registered-trademark, custom-conversion, leads-access, spaco-ds-data-collection, owned-domain, whatsapp-business-account, whatsapp-business-presence, business-resource-group, hotel-price-fetcher-pull-config, news-page, place_page_set, business-locations-wrapper, sliced-event-source-group, business-creative-asset, business-creative-folder, business-image, business-video, ads-event-source, seller-profile, bank, credit_card, receipt, credential_share_request, advanced-analytics-instance, signal_segment, business_loyalty_program, events-dataset, cloud_playable_asset, creator-seller-profile, caipt-asset, business-franchise-config, events-dataset-and-pixel, events-dataset-new, offsite-email-account, creator-marketplace-brand-profile, signals-event-name, business-payout-account, unknown, messaging_dataset, instagram_business_asset, nme_business_subscription_asset, mv4b-billable-account, marketplace-partner-billable-account, business-person, content-block-list, whatsapp_marketing-message-subscriber-pool, biz-ai-billable-account, threads-account, whatsapp-account, messenger-marketing-message-subscriber-pool}* | type of objects to be returned<br><br>**[required]**<br> |

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

A list of BusinessObject nodes.

The following fields will be added to each node that is returned:

| Field | Description |
| --- | --- |
| `permitted_tasks`<br><br>*list<string>* | Tasks that are assignable to users on this asset<br> |

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

##### summary

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like summary=__type__).

| Field | Description |
| --- | --- |
| `total_count`<br><br>*int32* | Total number of objects on this edge<br><br><br>**[default]**<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

