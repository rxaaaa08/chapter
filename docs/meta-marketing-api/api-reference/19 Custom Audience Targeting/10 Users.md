<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/users | Saved: 2026-09-19 -->

# Custom Audience Users



Add people to your ad's audience with a hash of data from your business. See [Custom Audiences from CRM Data](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences).

**You can add an unlimited number of records for an audience, but only a maximum of 10000 at a time. Changes to your Custom Audiences don't happen immediately and usually take up to 24 hours.**

### Flagged custom and lookalike audiences

If the audience is flagged with an `operation_status` of `471`, you must resolve the restrictions on the customer file custom audience before you can update or delete the user memberships. Attempts to edit user memberships without resolving the restrictions will result in an error.

```json
{
  "error": {
    "message": "Invalid parameter",
    "code": 100,
    "error_subcode": 1713230,
    "error_user_title": "Audience Upload Blocked",
    "error_user_msg": "Before updating user memberships, you must resolve integrity restrictions on this Data File Custom Audience. Go to Audience Manager to appeal the restrictions or create a new audience with updated data",
  },
}
```

## Reading

You can't perform this operation on this endpoint.

## Creating

You can't perform this operation on this endpoint.

## Updating

### /{custom_audience_id}/users
You can update a [User](https://developers.facebook.com/docs/graph-api/reference/user) by making a POST request to [/{custom_audience_id}/users](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/users).

#### Example

### HTTP
```
POST /v25.0/<CUSTOM_AUDIENCE_ID>/users HTTP/1.1
Host: graph.facebook.com

payload=%7B%22schema%22%3A%5B%22EMAIL%22%2C%22LOOKALIKE_VALUE%22%5D%2C%22data%22%3A%5B%5B%229b431636bd164765d63c573c346708846af4f68fe3701a77a3bdd7e7e5166254%22%2C44.5%5D%2C%5B%228cc62c145cd0c6dc444168eaeb1b61b351f9b1809a579cc9b4c9e9d7213a39ee%22%2C140%5D%2C%5B%224eaf70b1f7a797962b9d2a533f122c8039012b31e0a52b34a426729319cb792a%22%2C0%5D%2C%5B%2298df8d46f118f8bef552b0ec0a3d729466a912577830212a844b73960777ac56%22%2C0.9%5D%5D%7D
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->post(
    '/<CUSTOM_AUDIENCE_ID>/users',
    array (
      'payload' => '{"schema":["EMAIL","LOOKALIKE_VALUE"],"data":[["9b431636bd164765d63c573c346708846af4f68fe3701a77a3bdd7e7e5166254",44.5],["8cc62c145cd0c6dc444168eaeb1b61b351f9b1809a579cc9b4c9e9d7213a39ee",140],["4eaf70b1f7a797962b9d2a533f122c8039012b31e0a52b34a426729319cb792a",0],["98df8d46f118f8bef552b0ec0a3d729466a912577830212a844b73960777ac56",0.9]]}',
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
    "/<CUSTOM_AUDIENCE_ID>/users",
    "POST",
    {
        "payload": "{\"schema\":[\"EMAIL\",\"LOOKALIKE_VALUE\"],\"data\":[[\"9b431636bd164765d63c573c346708846af4f68fe3701a77a3bdd7e7e5166254\",44.5],[\"8cc62c145cd0c6dc444168eaeb1b61b351f9b1809a579cc9b4c9e9d7213a39ee\",140],[\"4eaf70b1f7a797962b9d2a533f122c8039012b31e0a52b34a426729319cb792a\",0],[\"98df8d46f118f8bef552b0ec0a3d729466a912577830212a844b73960777ac56\",0.9]]}"
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
params.putString("payload", "{\"schema\":[\"EMAIL\",\"LOOKALIKE_VALUE\"],\"data\":[[\"9b431636bd164765d63c573c346708846af4f68fe3701a77a3bdd7e7e5166254\",44.5],[\"8cc62c145cd0c6dc444168eaeb1b61b351f9b1809a579cc9b4c9e9d7213a39ee\",140],[\"4eaf70b1f7a797962b9d2a533f122c8039012b31e0a52b34a426729319cb792a\",0],[\"98df8d46f118f8bef552b0ec0a3d729466a912577830212a844b73960777ac56\",0.9]]}");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/<CUSTOM_AUDIENCE_ID>/users",
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
  @"payload": @"{\"schema\":[\"EMAIL\",\"LOOKALIKE_VALUE\"],\"data\":[[\"9b431636bd164765d63c573c346708846af4f68fe3701a77a3bdd7e7e5166254\",44.5],[\"8cc62c145cd0c6dc444168eaeb1b61b351f9b1809a579cc9b4c9e9d7213a39ee\",140],[\"4eaf70b1f7a797962b9d2a533f122c8039012b31e0a52b34a426729319cb792a\",0],[\"98df8d46f118f8bef552b0ec0a3d729466a912577830212a844b73960777ac56\",0.9]]}",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/<CUSTOM_AUDIENCE_ID>/users"
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
  -F 'payload={
       "schema": [
         "EMAIL",
         "LOOKALIKE_VALUE"
       ],
       "data": [
         [
           "9b431636bd164765d63c573c346708846af4f68fe3701a77a3bdd7e7e5166254",
           44.5
         ],
         [
           "8cc62c145cd0c6dc444168eaeb1b61b351f9b1809a579cc9b4c9e9d7213a39ee",
           140
         ],
         [
           "4eaf70b1f7a797962b9d2a533f122c8039012b31e0a52b34a426729319cb792a",
           0
         ],
         [
           "98df8d46f118f8bef552b0ec0a3d729466a912577830212a844b73960777ac56",
           0.9
         ]
       ]
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<CUSTOM_AUDIENCE_ID>/users
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=POST&path=%3CCUSTOM_AUDIENCE_ID%3E%2Fusers%3Fpayload%3D%257B%2522schema%2522%253A%255B%2522EMAIL%2522%252C%2522LOOKALIKE_VALUE%2522%255D%252C%2522data%2522%253A%255B%255B%25229b431636bd164765d63c573c346708846af4f68fe3701a77a3bdd7e7e5166254%2522%252C44.5%255D%252C%255B%25228cc62c145cd0c6dc444168eaeb1b61b351f9b1809a579cc9b4c9e9d7213a39ee%2522%252C140%255D%252C%255B%25224eaf70b1f7a797962b9d2a533f122c8039012b31e0a52b34a426729319cb792a%2522%252C0%255D%252C%255B%252298df8d46f118f8bef552b0ec0a3d729466a912577830212a844b73960777ac56%2522%252C0.9%255D%255D%257D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `payload`<br><br>*Object* | Payload representing users to add<br><br><br>`schema` *string*<br>`EMAIL_SHA256`, `PHONE_SHA256`, `MOBILE_ADVERTISER_ID`. One can also pass an array of multiple keys for multi-key match. Supported key types includes: <br> `EXTERN_ID`<br>`EMAIL`<br>`PHONE`<br>`GEN`<br>`DOBY`<br>`DOBM`<br>`DOBD`<br>`LN`<br>`FN`<br>`FI`<br>`CT`<br>`ST`<br>`ZIP`<br>`MADID`<br>`COUNTRY`<br>The multi-key array is of the form `["EMAIL", "LN", "FN", "ZIP"]`<br><br><br>`is_raw` *boolean*<br>Is the key raw? If the keys are combinational keys like "LN_FN_ZIP", set this to `false`, otherwise set this to `true`. Default to false<br><br><br>`data` *list<JSON array>*<br>Array with users data. If the multi-key feature is used, a two-dimensional array of the form `[["<HASHED_EMAIL>", "<HASHED_FN>", "<HASHED_LN>", "<HASHED_ZIP>"], ["", "<HASHED_FN>", "<HASHED_LN>", "<HASHED_ZIP>"]]` should be passed.In case a key is unknown, it should be left blank.<br><br><br>`app_ids` *list<int>*<br>App ids used by the users being uploaded. This field is required when `schema` is a Facebook UID and the IDs were collected by an App integration. e.g. `[1234,5678]`<br><br><br>`page_ids` *list<Page ID>*<br>Page ids used by the users being uploaded. This field is required when `schema` is a Facebook UID and the IDs were collected by a Page webhook integration. e.g. `[1234,5678]`<br><br><br>`ig_account_ids` *list<numeric string or integer>*<br><br>`data_source` *Object*<br>Indicates by which method the custom audience was created, defined by the `type` and `subtype` of the `data_source`<br><br><br>`type` *enum {UNKNOWN, FILE_IMPORTED, EVENT_BASED, SEED_BASED, THIRD_PARTY_IMPORTED, COPY_PASTE, CONTACT_IMPORTER, HOUSEHOLD_AUDIENCE}*<br>Type of the custom audience<br><br><br>`sub_type` *enum {ANYTHING, NOTHING, HASHES, USER_IDS, HASHES_OR_USER_IDS, MOBILE_ADVERTISER_IDS, EXTERNAL_IDS, MULTI_HASHES, TOKENS, EXTERNAL_IDS_MIX, HOUSEHOLD_EXPANSION, SUBSCRIBER_LIST, WEB_PIXEL_HITS, MOBILE_APP_EVENTS, MOBILE_APP_COMBINATION_EVENTS, VIDEO_EVENTS, WEB_PIXEL_COMBINATION_EVENTS, PLATFORM, MULTI_DATA_EVENTS, IG_BUSINESS_EVENTS, STORE_VISIT_EVENTS, INSTANT_ARTICLE_EVENTS, FB_EVENT_SIGNALS, FACEBOOK_WIFI_EVENTS, AR_EXPERIENCE_EVENTS, AR_EFFECTS_EVENTS, MESSENGER_ONSITE_SUBSCRIPTION, WHATSAPP_SUBSCRIBER_POOL, MARKETPLACE_LISTINGS, AD_CAMPAIGN, GROUP_EVENTS, MESSAGE_CAMPAIGN, ENGAGEMENT_EVENT_USERS, CUSTOM_AUDIENCE_USERS, PAGE_FANS, CONVERSION_PIXEL_HITS, APP_USERS, S_EXPR, DYNAMIC_RULE, CAMPAIGN_CONVERSIONS, WEB_PIXEL_HITS_CUSTOM_AUDIENCE_USERS, MOBILE_APP_CUSTOM_AUDIENCE_USERS, COMBINATION_CUSTOM_AUDIENCE_USERS, VIDEO_EVENT_USERS, FB_PIXEL_HITS, IG_PROMOTED_POST, PLACE_VISITS, OFFLINE_EVENT_USERS, EXPANDED_AUDIENCE, SEED_LIST, PARTNER_CATEGORY_USERS, PAGE_SMART_AUDIENCE, MULTICOUNTRY_COMBINATION, PLATFORM_USERS, MULTI_EVENT_SOURCE, SMART_AUDIENCE, LOOKALIKE_PLATFORM, SIGNAL_SOURCE, MAIL_CHIMP_EMAIL_HASHES, CONSTANT_CONTACTS_EMAIL_HASHES, COPY_PASTE_EMAIL_HASHES, CUSTOM_DATA_TARGETING, CONTACT_IMPORTER, DATA_FILE}*<br>Subtype of the custom audience<br><br><br>`metadata` *Object*<br><br>`calculated_date` *datetime*<br><br>`schema_version` *string* |
| `session`<br><br>*Object* | Information about the session. Sessions are used when you<br>have a lot of users to upload. For example, if you have 1 million users<br>to upload, you need to split them into at least 100 requests because<br>each request can only take 10k users. Specify the session info so that<br>you can track if the session has finished or not.<br><br><br>`session_id` *int64*<br>Advertiser generated session identifier, used to track the session. Needs to be unique in the same ad account.<br><br><br>`estimated_num_total` *int64*<br>Estimated total num of users to be uploaded in this session, used by Facebook systems to better process this session.<br><br><br>`batch_seq` *int64*<br>A 1 based sequence number to identify the request in the session.<br><br><br>`last_batch_flag` *boolean*<br>`true` mean this request is the last request in this session. You must mark the last request otherwise Facebook doesn't know the session has ended<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
audience_id: numeric string,
session_id: numeric string,
num_received: int32,
num_invalid_entries: int32,
invalid_entry_samples:  Map  {
string: string},
subscription_info:  Struct  {
whatsapp:  Struct  {
error:  Struct  {
message: string,
code: int32,
},
num_subscribers_received: int32,
num_subscribers_invalid_entries: int32,
invalid_subscribers_entry_samples:  Map  {
string: string},
},
messenger:  Struct  {
error:  Struct  {
message: string,
code: int32,
},
num_subscribers_received: int32,
num_subscribers_invalid_entries: int32,
invalid_subscribers_entry_samples:  Map  {
string: string},
},
},
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 2650 | Failed to update the custom audience |
| 190 | Invalid OAuth 2.0 Access Token |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 2635 | You are calling a deprecated version of the Ads API. Please update to the latest version. |
| 105 | The number of parameters exceeded the maximum for this operation |
| 194 | Missing at least one required parameter |

## Deleting

### /{custom_audience_id}/users
You can dissociate a [User](https://developers.facebook.com/docs/graph-api/reference/user) from a [CustomAudience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience) by making a DELETE request to [/{custom_audience_id}/users](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/users).

#### Parameters

| Parameter | Description |
| --- | --- |
| `payload`<br><br>*Object* | Payload representing users to delete<br><br><br>`schema` *string*<br>`EMAIL_SHA256`, `PHONE_SHA256`, `MOBILE_ADVERTISER_ID`. One can also pass an array of multiple keys for multi-key match. Supported key types includes: <br> `EXTERN_ID`<br>`EMAIL`<br>`PHONE`<br>`GEN`<br>`DOBY`<br>`DOBM`<br>`DOBD`<br>`LN`<br>`FN`<br>`FI`<br>`CT`<br>`ST`<br>`ZIP`<br>`MADID`<br>`COUNTRY`<br>The multi-key array is of the form `["EMAIL", "LN", "FN", "ZIP"]`<br><br><br>`is_raw` *boolean*<br>Is the key raw? If the keys are combinational keys like "LN_FN_ZIP", set this to `false`, otherwise set this to `true`. Default to false<br><br><br>`data` *list<JSON array>*<br>Array with users data. If the multi-key feature is used, a two-dimensional array of the form `[["<HASHED_EMAIL>", "<HASHED_FN>", "<HASHED_LN>", "<HASHED_ZIP>"], ["", "<HASHED_FN>", "<HASHED_LN>", "<HASHED_ZIP>"]]` should be passed.In case a key is unknown, it should be left blank.<br><br><br>`app_ids` *list<int>*<br>App ids used by the users being uploaded. This field is required when `schema` is a Facebook UID and the IDs were collected by an App integration. e.g. `[1234,5678]`<br><br><br>`page_ids` *list<Page ID>*<br>Page ids used by the users being uploaded. This field is required when `schema` is a Facebook UID and the IDs were collected by a Page webhook integration. e.g. `[1234,5678]`<br><br><br>`ig_account_ids` *list<numeric string or integer>*<br><br>`data_source` *Object*<br>Indicates by which method the custom audience was created, defined by the `type` and `subtype` of the `data_source`<br><br><br>`type` *enum {UNKNOWN, FILE_IMPORTED, EVENT_BASED, SEED_BASED, THIRD_PARTY_IMPORTED, COPY_PASTE, CONTACT_IMPORTER, HOUSEHOLD_AUDIENCE}*<br>Type of the custom audience<br><br><br>`sub_type` *enum {ANYTHING, NOTHING, HASHES, USER_IDS, HASHES_OR_USER_IDS, MOBILE_ADVERTISER_IDS, EXTERNAL_IDS, MULTI_HASHES, TOKENS, EXTERNAL_IDS_MIX, HOUSEHOLD_EXPANSION, SUBSCRIBER_LIST, WEB_PIXEL_HITS, MOBILE_APP_EVENTS, MOBILE_APP_COMBINATION_EVENTS, VIDEO_EVENTS, WEB_PIXEL_COMBINATION_EVENTS, PLATFORM, MULTI_DATA_EVENTS, IG_BUSINESS_EVENTS, STORE_VISIT_EVENTS, INSTANT_ARTICLE_EVENTS, FB_EVENT_SIGNALS, FACEBOOK_WIFI_EVENTS, AR_EXPERIENCE_EVENTS, AR_EFFECTS_EVENTS, MESSENGER_ONSITE_SUBSCRIPTION, WHATSAPP_SUBSCRIBER_POOL, MARKETPLACE_LISTINGS, AD_CAMPAIGN, GROUP_EVENTS, MESSAGE_CAMPAIGN, ENGAGEMENT_EVENT_USERS, CUSTOM_AUDIENCE_USERS, PAGE_FANS, CONVERSION_PIXEL_HITS, APP_USERS, S_EXPR, DYNAMIC_RULE, CAMPAIGN_CONVERSIONS, WEB_PIXEL_HITS_CUSTOM_AUDIENCE_USERS, MOBILE_APP_CUSTOM_AUDIENCE_USERS, COMBINATION_CUSTOM_AUDIENCE_USERS, VIDEO_EVENT_USERS, FB_PIXEL_HITS, IG_PROMOTED_POST, PLACE_VISITS, OFFLINE_EVENT_USERS, EXPANDED_AUDIENCE, SEED_LIST, PARTNER_CATEGORY_USERS, PAGE_SMART_AUDIENCE, MULTICOUNTRY_COMBINATION, PLATFORM_USERS, MULTI_EVENT_SOURCE, SMART_AUDIENCE, LOOKALIKE_PLATFORM, SIGNAL_SOURCE, MAIL_CHIMP_EMAIL_HASHES, CONSTANT_CONTACTS_EMAIL_HASHES, COPY_PASTE_EMAIL_HASHES, CUSTOM_DATA_TARGETING, CONTACT_IMPORTER, DATA_FILE}*<br>Subtype of the custom audience<br><br><br>`metadata` *Object*<br><br>`calculated_date` *datetime*<br><br>`schema_version` *string* |
| `session`<br><br>*Object* | Information about the session. Sessions are used when you<br>have a lot of users to upload. For example, if you have 1 million users<br>to upload, you need to split them into at least 100 requests because<br>each request can only take 10k users. Specify the session info so that<br>you can track if the session has finished or not.<br><br><br>`session_id` *int64*<br>Advertiser generated session identifier, used to track the session. Needs to be unique in the same ad account.<br><br><br>`estimated_num_total` *int64*<br>Estimated total num of users to be uploaded in this session, used by Facebook systems to better process this session.<br><br><br>`batch_seq` *int64*<br>A 1 based sequence number to identify the request in the session.<br><br><br>`last_batch_flag` *boolean*<br>`true` mean this request is the last request in this session. You must mark the last request otherwise Facebook doesn't know the session has ended<br> |

#### Return Type

```
Struct  {
audience_id: numeric string,
session_id: numeric string,
num_received: int32,
num_invalid_entries: int32,
invalid_entry_samples:  Map  {
string: string},
subscription_info:  Struct  {
whatsapp:  Struct  {
error:  Struct  {
message: string,
code: int32,
},
num_subscribers_received: int32,
num_subscribers_invalid_entries: int32,
invalid_subscribers_entry_samples:  Map  {
string: string},
},
messenger:  Struct  {
error:  Struct  {
message: string,
code: int32,
},
num_subscribers_received: int32,
num_subscribers_invalid_entries: int32,
invalid_subscribers_entry_samples:  Map  {
string: string},
},
},
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 80003 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#custom-audience. |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 2650 | Failed to update the custom audience |
| 190 | Invalid OAuth 2.0 Access Token |
| 2635 | You are calling a deprecated version of the Ads API. Please update to the latest version. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |

