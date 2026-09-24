<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/activities | Saved: 2026-09-19 -->

# Ad Campaign Activities



## Reading

### Event type descriptions

Here is a list of `event_type` by object:

**Ad account related event**

| Name | Description |
| --- | --- |
| ad_account_update_spend_limit | update the spend limit of an ad account |
| ad_account_reset_spend_limit | reset the spend limit of an ad account. |
| ad_account_remove_spend_limit | remove the spend limit of an ad account. You would have unlimited spend limit if you remove spend limit |
| ad_account_set_business_information | set business information for this ad account. |
| ad_account_update_status | update account status, includes: disabled, active, test, unsettled, pending closure, closed, pending risk review, in grace period |
| ad_account_add_user_to_role | add user to ad account |
| ad_account_remove_user_from_role | remove user from ad account |
| add_images | add an image to ad account image library |
| edit_images | edit an image in ad account image library |

**Billing related event**

| Name | Description |
| --- | --- |
| ad_account_billing_charge | charge ad account |
| ad_account_billing_charge_back | undo the charging on ad account per bank's instructions |
| ad_account_billing_charge_back_reversal | reapply the undone charging |
| ad_account_billing_decline | billings was declined |
| ad_account_billing_refund | refund on ad account |
| add_funding_source | add funding source to ad account |
| remove_funding_source | remove funding source from ad account |

**Campaign related event**

| Name | Description |
| --- | --- |
| create_campaign | create campaign |
| update_campaign_name | update campaign friendly name |
| update_campaign_run_status | update campaign run status |

**Ad set related event**

| Name | Description |
| --- | --- |
| create_ad_set | create ad set |
| update_ad_set_bidding | update bid information |
| update_ad_set_target_spec | update ad set targeting |
| update_ad_set_name | update ad set friendly name |
| update_ad_set_run_status | update ad set run status |
| update_ad_set_budget | update ad set budget |
| update_ad_set_duration | update ad set duration |

**Adgroup related event**

| Name | Description |
| --- | --- |
| create_ad | create ad |
| update_ad_creative | update creative of ad, including image/title/text change. |
| update_ad_run_status | update adgroup run status |
| update_ad_friendly_name | update adgroup friendly name |
| ad_review_approved | ad review was approved |
| ad_review_declined | ad review was not approved |

**Other**

| Name | Description |
| --- | --- |
| create_audience | create custom audience |
| delete_audience | delete custom audience |

#### Parameters

| Parameter | Description |
| --- | --- |
| `after`<br><br>*string* | after<br> |
| `business_id`<br><br>*numeric string or integer* | This parameter is a required parameter once the ad account is associated with any business account.<br> |
| `category`<br><br>*enum {ACCOUNT, AD, AD_KEYWORDS, AD_SET, AUDIENCE, BID, BUDGET, CAMPAIGN, DATE, STATUS, TARGETING}* | Filter events by category.<br> |
| `limit`<br><br>*integer* | limit<br> |
| `since`<br><br>*datetime* | The start time to query account history. Default is 7 days prior.<br> |
| `uid`<br><br>*int* | Filter events by the user id.<br> |
| `until`<br><br>*datetime* | The end time to query account history. Default is now.<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of [AdActivity](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-activity) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 190 | Invalid OAuth 2.0 Access Token |
| 100 | Invalid parameter |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

