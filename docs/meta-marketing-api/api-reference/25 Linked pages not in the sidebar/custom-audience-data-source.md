<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/custom-audience-data-source | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Custom Audience Data Source

## Reading

Custom Audience data source

| type | Description |
| --- | --- |
| `UNKNOWN` | When an audience is created and before uploading any content |
| `FILE_IMPORTED` | Created directly from a file |
| `EVENT_BASED` | Created from some website event |
| `SEED_BASED` | Lookalike audience |
| `THIRD_PARTY_IMPORTED` | Created using third-party data |
| `COPY_PASTE` | Values pasted into the input field manually via Facebook interfaces |
| `CONTACT_IMPORTER` | Created via an importer |

| subtype | Description |
| --- | --- |
| `ANYTHING` | Research poll, experiment, etc |
| `NOTHING` | Folder |
| `HASHES` | Email hashes or phone hashes |
| `USER_IDS` | Facebook user ids |
| `HASHES_OR_USER_IDS` | Email/phone hashes or user ids |
| `MOBILE_ADVERTISER_IDS` | Platform IDs or IDFAs |
| `EXTERNAL_IDS` | Including legacy tokens |
| `MULTI_HASHES` | Created from multiple types of hashes at the same time |
| `WEB_PIXEL_HITS` | Events reported by Facebook pixels on websites |
| `MOBILE_APP_EVENTS` | Events reported on mobile platforms |
| `MOBILE_APP_COMBINATION_EVENTS` | A composite audience from one or more inclusion and exclusion audiences, e.g. people who performed two or more tracked actions inside the app. |
| `VIDEO_EVENTS` | Reports from video views, e.g. 3% or 95% of video has been watched |
| `WEB_PIXEL_COMBINATION_EVENTS` | A composite audience of one or more inclusion and exclusion audiences, e.g. an audience of people who have viewed the homepage but not completed the sign up process. |
| `CUSTOM_AUDIENCE_USERS` | Created from user ids |
| `PAGE_FANS` | Created from page fans |
| `CONVERSION_PIXEL_HITS` | Created from conversions tracked by Facebook's pixel |
| `APP_USERS` | Users from the mobile app |
| `S_EXPR` | Created from a saved target group |
| `MAIL_CHIMP_EMAIL_HASHES` | Created from emails imported from Mailchimp |
| `CONSTANT_CONTACTS_EMAIL_HASHES` | Created from emails imported from Constant Contact |
| `COPY_PASTE_EMAIL_HASHES` | Emails entered manually via Ads Manager |
| `CONTACT_IMPORTER` | Get in touch with the importer |

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=...%3Ffields%3D%257Bfieldname_of_type_CustomAudienceDataSource%257D&version=v26.0)

```
GET v26.0/...?fields={fieldname_of_type_CustomAudienceDataSource} HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '...?fields={fieldname_of_type_CustomAudienceDataSource}',
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
    "...?fields={fieldname_of_type_CustomAudienceDataSource}",
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
    "...?fields={fieldname_of_type_CustomAudienceDataSource}",
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
                               initWithGraphPath:@"...?fields={fieldname_of_type_CustomAudienceDataSource}"
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
| `creation_params`string | Additional information on creation source [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `sub_type`enum {ANYTHING, NOTHING, HASHES, USER_IDS, HASHES_OR_USER_IDS, MOBILE_ADVERTISER_IDS, EXTERNAL_IDS, MULTI_HASHES, TOKENS, EXTERNAL_IDS_MIX, HOUSEHOLD_EXPANSION, SUBSCRIBER_LIST, WEB_PIXEL_HITS, MOBILE_APP_EVENTS, MOBILE_APP_COMBINATION_EVENTS, VIDEO_EVENTS, WEB_PIXEL_COMBINATION_EVENTS, PLATFORM, MULTI_DATA_EVENTS, IG_BUSINESS_EVENTS, STORE_VISIT_EVENTS, INSTANT_ARTICLE_EVENTS, FB_EVENT_SIGNALS, FACEBOOK_WIFI_EVENTS, AR_EXPERIENCE_EVENTS, AR_EFFECTS_EVENTS, MESSENGER_ONSITE_SUBSCRIPTION, WHATSAPP_SUBSCRIBER_POOL, MARKETPLACE_LISTINGS, AD_CAMPAIGN, GROUP_EVENTS, MESSAGE_CAMPAIGN, ENGAGEMENT_EVENT_USERS, CUSTOM_AUDIENCE_USERS, PAGE_FANS, CONVERSION_PIXEL_HITS, APP_USERS, S_EXPR, DYNAMIC_RULE, CAMPAIGN_CONVERSIONS, WEB_PIXEL_HITS_CUSTOM_AUDIENCE_USERS, MOBILE_APP_CUSTOM_AUDIENCE_USERS, COMBINATION_CUSTOM_AUDIENCE_USERS, VIDEO_EVENT_USERS, FB_PIXEL_HITS, IG_PROMOTED_POST, PLACE_VISITS, OFFLINE_EVENT_USERS, EXPANDED_AUDIENCE, SEED_LIST, PARTNER_CATEGORY_USERS, PAGE_SMART_AUDIENCE, MULTICOUNTRY_COMBINATION, PLATFORM_USERS, MULTI_EVENT_SOURCE, SMART_AUDIENCE, LOOKALIKE_PLATFORM, SIGNAL_SOURCE, MAIL_CHIMP_EMAIL_HASHES, CONSTANT_CONTACTS_EMAIL_HASHES, COPY_PASTE_EMAIL_HASHES, CUSTOM_DATA_TARGETING, CONTACT_IMPORTER, DATA_FILE} | Custom Audience subtype [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `type`enum {UNKNOWN, FILE_IMPORTED, EVENT_BASED, SEED_BASED, THIRD_PARTY_IMPORTED, COPY_PASTE, CONTACT_IMPORTER, HOUSEHOLD_AUDIENCE} | Custom Audience type [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
