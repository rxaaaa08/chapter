<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/detailed-targeting | Saved: 2026-09-19 -->

# Detailed Targeting



With [Targeting Search](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search), you can find targeting with one targeting type in a single API call. With the Detailed Targeting API, you can search for multiple targeting types in a single request. You can also get suggestions based on your query.

The API has four endpoints: [Search](#search), [Suggestions](#suggestions), [Browse](#browse), and [Validation](#validation).

The response for these endpoints contains the following:

| Name | Description |
| --- | --- |
| `id`<br><br>type: string | Target audience ID |
| `name`<br><br>type: string | Name of the target audience |
| `audience_size_lower_bound`<br><br>type: integer | Estimated lower bound target audience size |
| `audience_size_upper_bound`<br><br>type: integer | Estimated upper bound target audience size |
| `path`<br><br>type: array of strings | Includes the category and any parent categories the targeting falls into |
| `description`<br><br>type: string | A short description of the target audience |

If you do not provide `limit_type`, the API filters results with fewer than 2,000 people into four categories: `work_employers`, `work_positions`, `education_majors`, `education_schools`. Otherwise you get fewer meaningful results. When you use `limit_type`, results are filtered for one of those four categories and not everything is returned.

## Search {#search}

Retrieve target audiences for your ads that match your search query. You can provide the following parameters at this endpoint:

```
curl -G \
-d "q=harvard" \
-d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/targetingsearch
```

| Name | Description |
| --- | --- |
| `q`<br><br>type: string | **Required.**<br><br>Query string. |
| `limit`<br><br>type: integer | **Optional.**<br><br>Number of results. |
| `limit_type`<br><br>type: string | **Optional.**<br><br>Limit the type of audience to retrieve. Defaults to all types.<br><br>Valid values:<br><br>- `interests`<br>- `education_schools`<br>- `education_majors`<br>- `work_positions`<br>- `work_employers`<br>- `relationship_statuses`<br>- `college_years`<br>- `education_statuses`<br>- `family_statuses`<br>- `industries`<br>- `life_events`<br>- `behaviors`<br>- `income` |
| `locale`<br><br>type: string | **Optional.**<br><br>The locale to display audience names and descriptions, if available. Defaults to the ad account's locale. |

## Suggestions {#suggestions}

Returns additional audiences you can target based on the audiences you provide.

```
curl -G \
-d "targeting_list=[{'type':'interests','id':6003263791114}]" \
-d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/targetingsuggestions
```

Provide these parameters:

| Name | Description |
| --- | --- |
| `targeting_list`<br><br>type: array of `{'type':'{TYPE}', 'id':{ID}}` | **Required.**<br><br>Array of `{'type':'{TYPE}', 'id':{ID}}` pairs as input audience for suggestions. |
| `limit`<br><br>type: integer | **Optional.**<br><br>Number of results. Default is 30. Maximum is 45. |
| `limit_type`<br><br>type: string | **Optional.**<br><br>Limit the type of audience to retrieve. Defaults to all types.<br><br>Valid values:<br><br>- `interests`<br>- `education_schools`<br>- `education_majors`<br>- `work_positions`<br>- `work_employers`<br>- `relationship_statuses`<br>- `college_years`<br>- `education_statuses`<br>- `family_statuses`<br>- `industries`<br>- `life_events`<br>- `behaviors`<br>- `income` |
| `locale`<br><br>type: string | **Optional.**<br><br>The locale to display audience names and descriptions. Defaults to the ad account's locale. |

## Browse {#browse}

Get targeting in a structured taxonomy for Facebook categories, third-party data providers, and some interests. Results from this endpoint appear in the Browse function of the Detailed Targeting UI component in Ads Manager.

```
curl -G \
-d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/targetingbrowse
```

Provide the following optional parameters:

| Name | Description |
| --- | --- |
| `limit_type`<br><br>type: string | **Optional.**<br><br>Limit the type of audience to retrieve. Defaults to all types. |
| `locale`<br><br>type: string | **Optional.**<br><br>The locale to display audience names and descriptions. Defaults to the ad account's locale. |

## Validation {#validation}

Verify whether an audience is valid for targeting. Validation is helpful if you have already created an ad set and want to verify its targeting spec is still valid. If the targeting is not valid, remove it from the targeting spec.

```
curl -G \
-d "targeting_list=[{'type':'interests','id':6003283735711}, {'type':'relationship_statuses','id':100}]" \
-d "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/targetingvalidation
```

In addition to the standard Detailed Targeting response fields, this endpoint also returns:

| Name | Description |
| --- | --- |
| `valid`<br><br>type: boolean | Whether the audience is valid. |

Here is the list of input parameters:

| Name | Description |
| --- | --- |
| `targeting_list`<br><br>type: array of `{'type':'{TYPE}', 'id':{ID}}` | Array of `{'type':'{TYPE}', 'id':{ID}}` pairs for validation. Preferred. |
| `id_list`<br><br>type: array of strings | Array of IDs for validation. Succeeds only if an ID is uniquely identifiable in the Meta audience database. |
| `name_list`<br><br>type: array of strings | Array of strings for validation. Interests only. Case-insensitive. |
| `locale`<br><br>type: string | Locale to display audience names and descriptions. Defaults to ad account's locale. |

Provide at least one of the following: `targeting_list`, `id_list`, or `name_list`.
