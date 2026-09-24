<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/usersreplace | Saved: 2026-09-19 -->

# Custom Audience Usersreplace



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

### /{custom_audience_id}/usersreplace
You can make a POST request to *usersreplace* edge from the following paths:

- [/{custom_audience_id}/usersreplace](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/usersreplace)

When posting to this edge, no Graph object will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `namespace`<br><br>*string* | namespace<br> |
| `payload`<br><br>*Object* | payload<br><br>**[required]**<br><br><br>`schema` *string*<br>`EMAIL_SHA256`, `PHONE_SHA256`, `MOBILE_ADVERTISER_ID`. One can also pass an array of multiple keys for multi-key match. Supported key types includes: <br> `EXTERN_ID`<br>`EMAIL`<br>`PHONE`<br>`GEN`<br>`DOBY`<br>`DOBM`<br>`DOBD`<br>`LN`<br>`FN`<br>`FI`<br>`CT`<br>`ST`<br>`ZIP`<br>`MADID`<br>`COUNTRY`<br>The multi-key array is of the form `["EMAIL", "LN", "FN", "ZIP"]`<br><br><br>`is_raw` *boolean*<br>Is the key raw? If the keys are combinational keys like "LN_FN_ZIP", set this to `false`, otherwise set this to `true`. Default to false<br><br><br>`data` *list<JSON array>*<br>Array with users data. If the multi-key feature is used, a two-dimensional array of the form `[["<HASHED_EMAIL>", "<HASHED_FN>", "<HASHED_LN>", "<HASHED_ZIP>"], ["", "<HASHED_FN>", "<HASHED_LN>", "<HASHED_ZIP>"]]` should be passed.In case a key is unknown, it should be left blank.<br><br><br>`app_ids` *list<int>*<br>App ids used by the users being uploaded. This field is required when `schema` is a Facebook UID and the IDs were collected by an App integration. e.g. `[1234,5678]`<br><br><br>`page_ids` *list<Page ID>*<br>Page ids used by the users being uploaded. This field is required when `schema` is a Facebook UID and the IDs were collected by a Page webhook integration. e.g. `[1234,5678]`<br><br><br>`ig_account_ids` *list<numeric string or integer>*<br><br>`data_source` *Object*<br>Indicates by which method the custom audience was created, defined by the `type` and `subtype` of the `data_source`<br><br><br>`type` *enum {UNKNOWN, FILE_IMPORTED, EVENT_BASED, SEED_BASED, THIRD_PARTY_IMPORTED, COPY_PASTE, CONTACT_IMPORTER, HOUSEHOLD_AUDIENCE}*<br>Type of the custom audience<br><br><br>`sub_type` *enum {ANYTHING, NOTHING, HASHES, USER_IDS, HASHES_OR_USER_IDS, MOBILE_ADVERTISER_IDS, EXTERNAL_IDS, MULTI_HASHES, TOKENS, EXTERNAL_IDS_MIX, HOUSEHOLD_EXPANSION, SUBSCRIBER_LIST, WEB_PIXEL_HITS, MOBILE_APP_EVENTS, MOBILE_APP_COMBINATION_EVENTS, VIDEO_EVENTS, WEB_PIXEL_COMBINATION_EVENTS, PLATFORM, MULTI_DATA_EVENTS, IG_BUSINESS_EVENTS, STORE_VISIT_EVENTS, INSTANT_ARTICLE_EVENTS, FB_EVENT_SIGNALS, FACEBOOK_WIFI_EVENTS, AR_EXPERIENCE_EVENTS, AR_EFFECTS_EVENTS, MESSENGER_ONSITE_SUBSCRIPTION, WHATSAPP_SUBSCRIBER_POOL, MARKETPLACE_LISTINGS, AD_CAMPAIGN, GROUP_EVENTS, MESSAGE_CAMPAIGN, ENGAGEMENT_EVENT_USERS, CUSTOM_AUDIENCE_USERS, PAGE_FANS, CONVERSION_PIXEL_HITS, APP_USERS, S_EXPR, DYNAMIC_RULE, CAMPAIGN_CONVERSIONS, WEB_PIXEL_HITS_CUSTOM_AUDIENCE_USERS, MOBILE_APP_CUSTOM_AUDIENCE_USERS, COMBINATION_CUSTOM_AUDIENCE_USERS, VIDEO_EVENT_USERS, FB_PIXEL_HITS, IG_PROMOTED_POST, PLACE_VISITS, OFFLINE_EVENT_USERS, EXPANDED_AUDIENCE, SEED_LIST, PARTNER_CATEGORY_USERS, PAGE_SMART_AUDIENCE, MULTICOUNTRY_COMBINATION, PLATFORM_USERS, MULTI_EVENT_SOURCE, SMART_AUDIENCE, LOOKALIKE_PLATFORM, SIGNAL_SOURCE, MAIL_CHIMP_EMAIL_HASHES, CONSTANT_CONTACTS_EMAIL_HASHES, COPY_PASTE_EMAIL_HASHES, CUSTOM_DATA_TARGETING, CONTACT_IMPORTER, DATA_FILE}*<br>Subtype of the custom audience<br><br><br>`metadata` *Object*<br><br>`calculated_date` *datetime*<br><br>`schema_version` *string* |
| `session`<br><br>*Object* | session<br><br>**[required]**<br><br><br>`session_id` *int64*<br>Advertiser generated session identifier, used to track the session. Needs to be unique in the same ad account.<br><br><br>`estimated_num_total` *int64*<br>Estimated total num of users to be uploaded in this session, used by Facebook systems to better process this session.<br><br><br>`batch_seq` *int64*<br>A 1 based sequence number to identify the request in the session.<br><br><br>`last_batch_flag` *boolean*<br>`true` mean this request is the last request in this session. You must mark the last request otherwise Facebook doesn't know the session has ended<br> |

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
| 2650 | Failed to update the custom audience |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 190 | Invalid OAuth 2.0 Access Token |
| 80003 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#custom-audience. |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

