<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/content-block-lists | Saved: 2026-09-19 -->

# Content Block Lists API



Manage content block lists that allow advertisers to block their ads from appearing adjacent to content they deem unsuitable. Third parties can use these APIs to create, update, and apply block lists on behalf of advertisers.

## Permissions
* The app requires the `brand_safety_content_block_list` capability grant.

## Create a Block List

Create a new content block list for a business.

**Sample Request**

```curl
POST /<business_id>/content_block_lists
?name=<block_list_name>
```

#### Parameters

| Parameter | Type | Required (Y/N) | Default | Description |
| --- | --- | --- | --- | --- |
| name | string | Y |  | The name of the block list to create. |

## Get All Block Lists for a Business

Retrieve all content block lists owned by a business.

**Sample Request**

```curl
GET /<business_id>/content_block_lists
?fields=id,name,business
```

**Sample Response**

```json
{
  "data": [
    {
      "id": "123456789",
      "name": "High Risk Content",
      "business": {
        "id": "987654321",
        "name": "Example Business"
      }
    }
  ]
}
```

#### Fields

| Field | Type | Description |
| --- | --- | --- |
| id | string | The block list ID. |
| name | string | The block list name. |
| business | object | The owning business. |

## Get Block List Metadata

Retrieve metadata for a specific content block list.

**Sample Request**

```curl
GET /<content_block_list_id>
?fields=id,name,business
```

**Sample Response**

```json
{
  "id": "123456789",
  "name": "High Risk Content",
  "business": {
    "id": "987654321",
    "name": "Example Business"
  }
}
```

#### Fields

| Field | Type | Description |
| --- | --- | --- |
| id | string | The block list ID. |
| name | string | The block list name. |
| business | object | The owning business. |

## Rename a Block List

Update the name of an existing content block list.

**Sample Request**

```curl
POST /<content_block_list_id>
?name=<new_block_list_name>
```

#### Parameters

| Parameter | Type | Required (Y/N) | Default | Description |
| --- | --- | --- | --- | --- |
| name | string | Y |  | The new name for the block list. |

## Delete a Block List

Delete an existing content block list. The block list must not be applied to any ad accounts before deletion.

**Sample Request**

```curl
DELETE /<content_block_list_id>
```

**Sample Response**

```json
{
  "success": true,
  "id": "123456789"
}
```

## Get Facebook Content on a Block List

Retrieve all Facebook content IDs on a specific block list.

**Sample Request**

```curl
GET /<content_block_list_id>/facebook_content
?fields=id
```

**Sample Response**

```json
{
  "data": [
    {
      "id": "111111111111111"
    },
    {
      "id": "222222222222222"
    }
  ]
}
```

#### Fields

| Field | Type | Description |
| --- | --- | --- |
| id | string | The Facebook content ID. |

## Get Instagram Content on a Block List

Retrieve all Instagram content IDs on a specific block list.

**Sample Request**

```curl
GET /<content_block_list_id>/instagram_content
?fields=id
```

**Sample Response**

```json
{
  "data": [
    {
      "id": "333333333333333"
    },
    {
      "id": "444444444444444"
    }
  ]
}
```

#### Fields

| Field | Type | Description |
| --- | --- | --- |
| id | string | The Instagram content ID. |

## Get Threads Content on a Block List

Retrieve all Threads content IDs on a specific block list.

**Sample Request**

```curl
GET /<content_block_list_id>/threads_content
?fields=id
```

**Sample Response**

```json
{
  "data": [
    {
      "id": "555555555555555"
    },
    {
      "id": "666666666666666"
    }
  ]
}
```

#### Fields

| Field | Type | Description |
| --- | --- | --- |
| id | string | The Threads content ID. |

## Add Content to a Block List

Add Facebook, Instagram, or Threads content to a specific block list. For shares, attachments, or cross-posts, content will be normalized to the root post ID.

**Sample Request**

```curl
POST /<content_block_list_id>/content
?facebook_ids=["111111111111111","222222222222222"]
&instagram_ids=["333333333333333","444444444444444"]
&threads_ids=["555555555555555","666666666666666"]
```

#### Parameters

| Parameter | Type | Required (Y/N) | Default | Description |
| --- | --- | --- | --- | --- |
| facebook_ids | List<fbid> | N |  | List of Facebook content IDs to add. Maximum 50K per mutation. |
| instagram_ids | List<fbid> | N |  | List of Instagram content IDs to add. Maximum 50K per mutation. |
| threads_ids | List<fbid> | N |  | List of Threads content IDs to add. Maximum 50K per mutation. |

## Delete Content from a Block List

Remove Facebook, Instagram, or Threads content from a specific block list.

**Sample Request**

```curl
DELETE /<content_block_list_id>/content
?facebook_ids=["111111111111111","222222222222222"]
&instagram_ids=["333333333333333","444444444444444"]
&threads_ids=["555555555555555","666666666666666"]
```

#### Parameters

| Parameter | Type | Required (Y/N) | Default | Description |
| --- | --- | --- | --- | --- |
| facebook_ids | List<fbid> | N |  | List of Facebook content IDs to remove. |
| instagram_ids | List<fbid> | N |  | List of Instagram content IDs to remove. |
| threads_ids | List<fbid> | N |  | List of Threads content IDs to remove. |

## Get Applied Ad Accounts

Retrieve all ad accounts where a block list is currently applied.

**Sample Request**

```curl
GET /<content_block_list_id>/applied_ad_accounts
?fields=id,account_id
```

**Sample Response**

```json
{
  "data": [
    {
      "id": "555555555555555",
      "account_id": "act_555555555555555"
    },
    {
      "id": "666666666666666",
      "account_id": "act_666666666666666"
    }
  ]
}
```

#### Fields

| Field | Type | Description |
| --- | --- | --- |
| id | string | The integer ad account ID. |
| account_id | string | The string ad account ID (prefixed with "act_"). |

## Apply a Block List to an Ad Account

Apply a content block list to an ad account. The 3P must have "read" permission on the ad account.

**Sample Request**

```curl
POST /<content_block_list_id>/applied_ad_accounts
?account_id=<ad_account_id>
```

#### Parameters

| Parameter | Type | Required (Y/N) | Default | Description |
| --- | --- | --- | --- | --- |
| account_id | string | Y |  | The ad account ID to apply the block list to. |

## Unapply a Block List from an Ad Account

Remove a content block list from an ad account.

**Sample Request**

```curl
DELETE /<content_block_list_id>/applied_ad_accounts
?account_id=<ad_account_id>
```

#### Parameters

| Parameter | Type | Required (Y/N) | Default | Description |
| --- | --- | --- | --- | --- |
| account_id | string | Y |  | The ad account ID to unapply the block list from. |

## Get Block Lists Applied to an Account

Retrieve all content block lists applied to a specific ad account.

*Note: This endpoint is planned but not yet available.*

**Sample Request**

```curl
GET /<account_id>/content_block_lists
```

## Check if Content is in a Block List

Check whether a specific content ID exists in a block list.

*Note: This endpoint is planned but not yet available.*

**Sample Request**

```curl
GET /<content_block_list_id>
?fields=contains.content_id(<content_id>)
```

## Upload a Content Block List File

Upload a file of content IDs (up to 2 million) to a block list. The result will contain information about the job that will asynchronously process the file along with some information about the file itself.

**Sample Request**

```curl
POST https://api.facebook.com/content_block_lists/{content_block_list_id}/file_upload \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0" \
  -F "file=@/path/to/file" \
  -F "operation=replace"
```

**Sample Response**

```json
{
  "job_id": "cbl_batch_12345",
  "status": "queued",
  "operation": "replace",
  "file_metadata": {
    "filename": "content_ids.csv",
    "size_bytes": 52428800,
    "estimated_content_count": 1000000
  },
  "created_at": "2024-01-15T10:30:00Z"
}
```

**CSV Format**

```
content_id,platform
123456789,facebook
987654321,instagram
```

#### Parameters

| Parameter | Type | Required (Y/N) | Default | Description |
| --- | --- | --- | --- | --- |
| file | string | Y |  | Path of file containing the content IDs to process. Max size is 100 MB. |
| operation | enum | Y |  | Operation to be performed. Accepted values: "replace" - replaces all content IDs in the specified content block list with the content IDs included in the file. |

#### Response Fields

| Field | Type | Required (Y/N) | Description |
| --- | --- | --- | --- |
| job_id | string | Y | Unique ID of the job that will process the file asynchronously. Use this ID with the GET endpoint to fetch status updates. |
| status | enum | Y | Current status of the job. Supported statuses: queued, processing, failed, completed. |
| operation | enum | Y | Operation to be performed. Accepted values: "replace". |
| file_metadata | object | Y | An object containing information about the file that was uploaded. |
| created_at | datetime | Y | Datetime of when the job was created. |

#### file_metadata Object

| Field | Type | Required (Y/N) | Description |
| --- | --- | --- | --- |
| filename | string | Y | Name of the file that was uploaded. |
| size_bytes | integer | Y | Size of the file that was uploaded, in bytes. |
| estimated_content_count | integer | Y | Estimated number of content to process. |

## Get Job Status

Retrieve information about an ongoing job. The response will contain details such as job ID, status, percentage completion, and any error details, if applicable.

**Sample Request**

```curl
GET https://api.facebook.com/content_block_lists/{content_block_list_id}/batch_jobs/{job_id} \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0"
```

**Sample Response**

```json
{
  "job_id": "cbl_batch_12345",
  "content_block_list_id": "cbl_67890",
  "status": "processing",
  "operation": "replace",
  "percent_completion": 90,
  "timestamps": {
    "started_at": "2025-12-10T11:45:21-08:00",
    "updated_at": "2025-12-10T11:47:53-08:00",
    "completed_at": null
  },
  "error_details": null
}
```

#### Response Fields

| Field | Type | Required (Y/N) | Description |
| --- | --- | --- | --- |
| job_id | string | Y | Unique ID of the job that will process the file asynchronously. |
| content_block_list_id | fbid | Y | FBID of the Content Block List. |
| status | enum | Y | Current status of the job. Supported statuses: queued, processing, failed, completed. |
| operation | enum | Y | Operation to be performed. Accepted values: "replace". |
| percent_completion | integer | Y | Percentage of job completion (0-100). |
| timestamps | object | Y | An object containing timestamp information about the job. |
| error_details | string | N | Error details of a job that failed. |

#### timestamps Object

| Field | Type | Required (Y/N) | Description |
| --- | --- | --- | --- |
| started_at | datetime | Y | Timestamp of when the job started. |
| updated_at | datetime | Y | Timestamp of when the job was last updated. |
| completed_at | datetime | N | Timestamp of when the job completed. |

## Download a Content Block List File

Download a CSV file of all content IDs for a given Content Block List.

*Note: This endpoint is a PUT and not a GET, as every time this endpoint is called, a new file will be created and stored for retrieval.*

**Sample Request**

```curl
PUT https://api.facebook.com/content_block_lists/{content_block_list_id}/file_download \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "X-API-Version: 1.0.0"
```

**Sample Response**

```json
{
  "content_block_list_id": "cbl_67890",
  "download_url": "https://example.com/download/content_ids.csv",
  "file_metadata": {
    "name": "content_ids.csv",
    "size_bytes": 52428800,
    "facebook_content_count": 1000000,
    "instagram_content_count": 1000000
  }
}
```

#### Response Fields

| Field | Type | Required (Y/N) | Description |
| --- | --- | --- | --- |
| content_block_list_id | fbid | Y | FBID of the Content Block List. |
| download_url | string | Y | URL to download the CSV file. |
| file_metadata | object | Y | An object containing information about the file to be downloaded. |

#### file_metadata Object

| Field | Type | Required (Y/N) | Description |
| --- | --- | --- | --- |
| name | string | Y | Name of the file to download. |
| size_bytes | integer | Y | Size of the file to download, in bytes. |
| facebook_content_count | integer | Y | Number of Facebook content IDs in the file. |
| instagram_content_count | integer | Y | Number of Instagram content IDs in the file. |

## Limits and Guardrails

The following limits are enforced to ensure system stability:

* **Block lists per business/3P:** Maximum 200 block lists per 3P
* **Content per block list:** Maximum 2M posts per block list
* **Content per mutation:** Maximum 50K add/remove posts per API call
* **Block lists per ad account:** Maximum 75 block lists applied per account
* **API rate limit:** 480K API calls per hour

## Learn More

* [Brand Safety and Suitability Hub](https://www.facebook.com/brand_safety/overview)
