<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/block-list | Saved: 2026-09-19 -->

# Publisher Block Lists API


**Warning:** **Ads Management Standard Access is now Marketing API Access Tier**

**No code changes are needed.**

Tier labels have been updated: "Standard Access" is now **Limited Access**, and "Advanced Access" is now **Full Access**. The revised qualification threshold for Full Access has been reduced from 1,500 to **500 Marketing API calls** in the past 15 days. The underlying permission identifier remains the same, and existing access levels are preserved automatically. Learn more in the [Marketing API Access Tier documentation](https://developers.facebook.com/docs/features-reference#marketing-api-access-tier).

Block lists stop advertiser's ads from appearing in places they don't consider suitable for their brand or campaign. This can include apps in Meta Audience Network, Facebook in-stream videos, ads on Facebook Reels and Instagram profile feed.

Additional documentation you can review and/or share with advertisers:

* [About Block Lists \| Meta Business Help Center](https://www.facebook.com/business/help/255483958155378?id=1769156093197771)

## Permissions

* The app requires the `block_list_management_v2_api_access` capability grant.

## Create a New Block List

### 1. Create a new draft block list from a file containing URLs.

Initiate the creation process by making a POST request to the `block_list_drafts` edge of a business node and specifying the block list file in the `publisher_urls_file` parameter:

```curl
CURL POST \
-F "publisher_urls_file=@path/to/local/file.txt" \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/block_list_drafts
```

The response will be of the form:

```json
{"id":<BLOCK_LIST_DRAFT_ID>}
```

Depending on the size of the publisher URLs file, it might take a longer time to finish draft creation.

In order to make this status check, your app (not access token) needs to have ["ads_read", "ads_management" permissions and "Marketing API Access Tier"](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types) features.

To get the status and progress of the block list draft creation process, query the `block_list_draft` node with `async_job_status` and `async_percent_completion` fields:

```curl
CURL -X GET \
"https://graph.facebook.com/<API_VERSION>/<BLOCK_LIST_DRAFT_ID>?fields=async_job_status,async_percent_completion&access_token=<ACCESS_TOKEN>"
```

The response will be:

```json
{"id":<BLOCK_LIST_DRAFT_ID>,
 "async_job_status":"running",
 "async_percent_completion":80}
```

Possible statuses are: scheduled, failed, running, success. As long as the status is 'success' it is possible to perform the next step.

### 2. Create a new block list from the draft block list.

Make a POST request to the publisher_block_lists edge of a business node:

```curl
curl \
-F "draft_id=<BLOCK_LIST_DRAFT_ID>" \
-F "name=<BLOCK_LIST_NAME>" \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/publisher_block_lists
```

The response will be a newly created or updated publisher block list id:

```json
{"id":<BLOCK_LIST_ID>}
```

Parameters:
| Parameter | Type | Required (Y/N) | Description |
| --- | --- | --- | --- |
| name | string | Y | Name for the block list. |
| draft_id | fbid | Y | ID of the draft block list. |

## Update an Existing Block List

First, create a new draft block list.

Next, make a POST request to the `publisher_block_lists` edge of a business node using the draft ID from the previous step:

```curl
curl \ POST
-F "block_list_id=<EXISTING_BLOCK_LIST_ID>" \
-F "draft_id=<BLOCK_LIST_DRAFT_ID>" \
-F "name=<BLOCK_LIST_NAME>" \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/publisher_block_lists
```

The response will be a newly created or updated publisher block list id:

```json
{"id":<BLOCK_LIST_ID>}
```

Parameters:
| Parameter | Type | Required (Y/N) | Description |
| --- | --- | --- | --- |
| name | string | Y | Name for the block list. |
| draft_id | fbid | Y | ID of the draft block list. |
| block_list_id | fbid | N | ID of the block list to update. |

## Get a Block List

Make a GET request to the `publisher_block_lists` edge:

```curl
curl -X GET \
"https://graph.facebook.com/<API_VERSION>/<BLOCK_LIST_ID>?fields=id,name,last_update_user,last_update_time,business_owner_id,owner_ad_account_id,items_count,web_publishers,app_publishers&access_token=<ACCESS_TOKEN>"
```

The response will be the requested info for the block list:

```json
{
  "id": "<BLOCK_LIST_ID>",
  "name": "new-bl",
  "last_update_user": "<USER_ID>",
  "last_update_time": "2023-05-24T04:36:05+0000",
  "business_owner_id": "<BUSINESS_ID>",
  "items_count": 9963,
  "web_publishers": [
    {
      "domain_url": "rare.us",
      "publisher_name": "rare.us",
      "id": "<PUBLISHER_ID>"
    },
    {
      "domain_url": "gay.nz",
      "publisher_name": "gay.nz",
      "id": "<PUBLISHER_ID>"
    }
 ]
}
```

Parameters:
| Parameter | Type | Required (Y/N) | Description |
| --- | --- | --- | --- |
| id | fbid | Y | ID of the block list. |
| name | string | Y | Name for the block list. |
| last_update_user | fbid | Y | ID of the user who last updated the block. list. |
| last_update_time | timestamp | Y | Time the block list was last updated. |
| business_owner_id | fbid | Y | ID of the business owner if the blocklist is shared to a business. |
| owner_ad_account_id | fbid | Y | ID of the ad account who owners this blocklist. |
| items_count | integer | N | Number of items in block list. |
| web_publishers | list | N | List of blocked web domains or Facebook page URLs. |
| app_publishers | list | N | List of blocked app store URLs. |

## Delete a Block List

A block list must first be unshared from all Business Managers before it can be deleted.

Make a DELETE request to the `publisher_block_lists` edge:

```
curl -X DELETE \
"https://graph.facebook.com/<API_VERSION>/<BLOCK_LIST_ID>/?access_token=<ACCESS_TOKEN>"
```

## Share Block Lists with Other Businesses

### Share a Block List

Make a POST request to the `agencies` edge:

```
curl \
-F "agency_id=<BUSINESS_ID>" \
-F "permitted_roles=['<ROLE>']" \
"https://graph.facebook.com/<API_VERSION>/<BLOCK_LIST_ID>/agencies/?access_token=<ACCESS_TOKEN>"
```

Role options: *APPLY_BLOCK_LIST*, *MANAGE_BLOCK_LIST*

The *APPLY_BLOCK_LIST* role allows the business to apply the block list to whatever that business currently has access to (campaigns, ad accounts, and/or the business itself).

The  *MANAGE_BLOCK_LIST* role grants the same ability as the *APPLY_BLOCK_LIST* role, in addition to the ability to update the block list contents with a new block list draft. **[This will impact the original shared block list and any other businesses using the same block list ID.]**

In order to change the role to *APPLY_BLOCK_LIST* if the block list has already been shared with the *MANAGE_BLOCK_LIST*,  unshare the block list first and then re-share with the *APPLY_BLOCK_LIST*.

### Unshare a block list
Make a DELETE request to the  `agencies` edge:  

```
curl \
-X DELETE \
-F "agency_id=<BUSINESS_ID>" \
"https://graph.facebook.com/<API_VERSION>/<BLOCK_LIST_ID>/agencies/?access_token=<ACCESS_TOKEN>"
```

### Get business IDs a block list is shared to
Make a GET request to the  `agencies` edge:

```
curl \
-X GET \
"https://graph.facebook.com/<API_VERSION>/<BLOCK_LIST_ID>/agencies/?access_token=<ACCESS_TOKEN>"
```

## Roles Management within Business

After sharing a block list with another business, admins of that business need to assign people access to the block list in order to apply and/or manage the block list (whichever is applicable based on the above block-list-to-business sharing specification). If the other business grants admin access to manage their Business Manager settings, the below API calls can be used to assist in this user-level roles management process.

See more on what kind of API calls are offered via the [Business Manager API](https://developers.facebook.com/docs/marketing-api/business-manager-api) Documentation

### Assign role to a user
Make a POST request to the  `assigned_users` edge:

```
curl \ POST
-F "user=<BUSINESS_SCOPED_USER_ID>" \
-F "permitted_roles=['<ROLE>']" \
"https://graph.facebook.com/<API_VERSION>/<BLOCK_LIST_ID>/assigned_users/?access_token=<ACCESS_TOKEN>"
```

Role options (same as block-list-to-business sharing): *APPLY_BLOCK_LIST*, *MANAGE_BLOCK_LIST*

The response will be:

```
{"access_status":"CONFIRMED"}
```

### Remove assigned role for a user
Make a DELETE request to the  `assigned_users` edge:

```
curl \
-X DELETE \
-F "user=<BUSINESS_SCOPED_USER_ID>" \
"https://graph.facebook.com/<API_VERSION>/<BLOCK_LIST_ID>/assigned_users/?access_token=<ACCESS_TOKEN>"
```

### Get the assigned role of a user
Make a GET request to the  `assigned_users` edge:

```
curl \
-X GET \
"https://graph.facebook.com/<API_VERSION>/<BLOCK_LIST_ID>/assigned_users/?business_id=<BUSINESS_ID>&access_token=<ACCESS_TOKEN>"
```

## Applying and Unapplying a Block List Directly to an Ad Account
If the other business grants *View Performance* access to one of their ad accounts, the below API calls can be used to directly apply and unapply a block list to that ad account (without the need for sharing).

There are 3 parameters for the apply and unapply call:

* *account_id*: ad account ID to apply/unapply the block list against.
* *business_id (optional)*: the business ID that owns the block list and has access to the ad account above.
* *is_auto_blocking_on*: boolean, true/false.

### Apply block list to ad account

To apply a block list to an AdAccount, specify the *account_id* and set *is_auto_blocking_on* to true:

```
curl -X POST \
-F "account_id=<ACCOUNT_ID>" \
-F "business_id=<BUSINESS_ID>" \
-F "is_auto_blocking_on=*true*" \
-F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/<API_VERSION>/<BLOCK_LIST_ID>/auto_applied_ad_accounts"
```

The response will be the block list ID used in the call:

```
{"id":"<BLOCK_LIST_ID>"}
```

### Unapply block list to ad account

To unapply a block list from an AdAccount, specify the *account_id* and set *is_auto_blocking_on* to false:

```
curl -X POST \
-F "account_id=<ACCOUNT_ID>" \
-F "business_id=<BUSINESS_ID>" \
-F "is_auto_blocking_on=*false*" \
-F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/<API_VERSION>/<BLOCK_LIST_ID>/auto_applied_ad_accounts"
```

The response will be the block list ID used in the call:

```
{"id":"<BLOCK_LIST_ID>"}
```

### Get ad accounts a block list ID is applied to

This will only return the ad account IDs that had the block list applied to them **using the above Apply API calls**. To determine which ad accounts a **shared** block list has been applied to, see what kind of API calls are offered via this [ad account insights Marketing API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/insights) Documentation.

Make a GET request to the `auto_applied_ad_accounts` edge:

```
curl -X GET \
"https://graph.facebook.com/<API_VERSION>/<BLOCK_LIST_ID>/auto_applied_ad_accounts/?access_token=<ACCESS_TOKEN>"
```

The default response will be a list of the ad account IDs in JSON array format:

```
{"data":[{"id":"act_<ACCOUNT_ID>"},{"id":"act_<ACCOUNT_ID>"},...]}
```

See more on what kind of API calls are offered via this [ad account Marketing API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account#Reading) Documentation.

## Error Codes

See also [Marketing API \| Error Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/error-reference)

| Code | Subcode | Description |
| --- | --- | --- |
| 100 |  | Invalid Parameter |
|  | 2349019 | Invalid Platform And Position Parameter Combination. |
|  | 2349020 | Both Start Date And End Date Required. |
|  | 2349022 | Start Date Out Of Range. |
|  | 2349023 | End Date Out Of Range. |
|  | 2349024 | Start Date Or End Date Out Of Range. |
|  | 2349025 | Start Date Must Be Earlier Than End Date. |
| 200 |  | Permissions error. |
| 80011 |  | There have been too many calls to Brand Safety APIs. Wait a bit and try again. |

`fbtrace_id`: Internal support identifier. When reporting a bug related to a Graph API call, include the fbtrace_id to help us find log data for debugging

## Limits

One block list can contain no more than 10,000 unique URLs; if the upload file has more than 10,000 rows, multiple block lists will need to be created.

One business can own up to 200 block lists, if this is exceeded no more block lists are able to be created.

If you upload multiple blocklists with the same name, the last blocklist uploaded will replace the ones uploaded prior.

## Thresholds

* Facebook In-Stream: able to block up to 401,000 publishers
* Business Account \| 200,000 publishers
* Ad Account \| 200,000 publishers
* Campaign \| 1,000 publishers

Audience Network Native/Banner/Interstitial: able to block up to 54,000 publishers

* Business Account \| 20,750 publishers
* Ad Account \| 20,750 publishers
* Campaign \| 12,500 publishers

Audience Network Rewarded Videos: able to block up to 26,100 publishers

* Business Account \| 11,350 publishers
* Ad Account \| 11,350 publishers
* Campaign \| 3,400 publishers

Facebook Reels: able to block up to 401,000 publishers

* Business Account \| 200,000 publishers
* Ad Account \| 200,000 publishers
* Campaign \| 1,000 publishers

## Additional Useful Documentation

[Graph API - Overview](https://developers.facebook.com/docs/graph-api/overview)

For a user-friendly, interactive UI, try out [Meta's Graph API Explorer](https://developers.facebook.com/tools/explorer/)

[Marketing API \| Best Practices](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices)

[Marketing API \| Authorization](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization)

[API Changelog \| Developer Doc](https://developers.facebook.com/docs/graph-api/changelog)

[System Users \| Developer Doc](https://developers.facebook.com/docs/marketing-api/system-users#generate-token)

[Access Tokens \| Developer Doc](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens)
