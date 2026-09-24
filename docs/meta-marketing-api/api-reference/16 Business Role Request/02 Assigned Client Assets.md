<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business-role-request/assigned_client_assets | Saved: 2026-09-19 -->

# Business Role Request Assigned Client Assets



## Reading

List of client assets assigned to this role invitation.

#### Example

### HTTP
```
GET /v25.0/{business-role-request-id}/assigned_client_assets HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{business-role-request-id}/assigned_client_assets',
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
    "/{business-role-request-id}/assigned_client_assets",
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
    "/{business-role-request-id}/assigned_client_assets",
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
                               initWithGraphPath:@"/{business-role-request-id}/assigned_client_assets"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bbusiness-role-request-id%7D%2Fassigned_client_assets&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `asset_type`<br><br>*enum {PAGE, PROFILE_PLUS, AD_ACCOUNT, AD_DRAFT_WORKSPACE, PRODUCT_CATALOG, APP, PIXEL, SYSTEM_USER, BRAND, USER, PROJECT, INSTAGRAM_ACCOUNT, INSTAGRAM_ACCOUNT_V2, FUNDING_SOURCE, LEGAL_ENTITY, LEGACY_LOGIN, BUSINESS_REQUEST, EXAMPLE_CAT, MONETIZATION_PROPERTY, GRP_PLAN, CREDIT_PARTITION, PAYOUT_ACCOUNT, AD_STUDY, SAVED_AUDIENCE, CUSTOM_AUDIENCE, PLATFORM_CUSTOM_AUDIENCE, EVENT_SOURCE_GROUP, OFFLINE_CONVERSION_DATA_SET, AD_IMAGE, PHOTO, BLOCK_LIST, FINANCE, IP, CREDIT_PARTITION_CONFIG, VIDEO_ASSET, BUSINESS_UNIT, PAGE_FOR_LOCATIONS, AD_ACCOUNT_CREATION_REQUEST, RESELLER_VETTING_OE_REQUEST, REGISTERED_TRADEMARK, CUSTOM_CONVERSION, LEADS_ACCESS, SPACO_DS_DATA_COLLECTION, OWNED_DOMAIN, WHATSAPP_BUSINESS_ACCOUNT, WHATSAPP_BUSINESS_PRESENCE, BUSINESS_RESOURCE_GROUP, HOTEL_PRICE_FETCHER_PULL_CONFIG, NEWS_PAGE, PLACE_PAGE_SET, BUSINESS_LOCATIONS_WRAPPER, SLICED_EVENT_SOURCE_GROUP, BUSINESS_CREATIVE_ASSET, BUSINESS_CREATIVE_FOLDER, BUSINESS_IMAGE, BUSINESS_VIDEO, ADS_EVENT_SOURCE, SELLER_PROFILE, BANK, CREDIT_CARD, RECEIPT, CREDENTIAL_SHARE_REQUEST, ADVANCED_ANALYTICS_INSTANCE, SIGNAL_SEGMENT, BUSINESS_LOYALTY_PROGRAM, EVENTS_DATASET, CLOUD_PLAYABLE_ASSET, CREATOR_SELLER_PROFILE, CAIPT_ASSET, BUSINESS_FRANCHISE_CONFIG, EVENTS_DATASET_AND_PIXEL, EVENTS_DATASET_NEW, OFFSITE_EMAIL_ACCOUNT, CREATOR_MARKETPLACE_BRAND_PROFILE, SIGNALS_EVENT_NAME, BUSINESS_PAYOUT_ACCOUNT, UNKNOWN, MESSAGING_DATASET, INSTAGRAM_BUSINESS_ASSET, NME_BUSINESS_SUBSCRIPTION_ASSET, MV4B_BILLABLE_ACCOUNT, MARKETPLACE_PARTNER_BILLABLE_ACCOUNT, BUSINESS_PERSON, CONTENT_BLOCK_LIST, WHATSAPP_MARKETING_MESSAGE_SUBSCRIBER_POOL, BIZ_AI_BILLABLE_ACCOUNT, THREADS_ACCOUNT, WHATSAPP_ACCOUNT, MESSENGER_MARKETING_MESSAGE_SUBSCRIBER_POOL}* | Business asset type to be filtered on<br><br>**[required]**<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"summary": {}
}
```

##### data

A list of BusinessPermissionProxy nodes.

The following fields will be added to each node that is returned:

| Field | Description |
| --- | --- |
| `permitted_roles`<br><br>*list<string>* | Roles that are assignable on this object<br> |
| `permitted_tasks`<br><br>*list<string>* | Tasks that are assignable on this object<br> |
| `role`<br><br>*string* | The role the user is assigned<br><br><br>**[default]**<br> |

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

