<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/guides/adset-budget-sharing | Saved: 2026-09-19 -->

# Ad Set Budget Sharing



Ad set budget sharing allows you to share up to 20% of your daily budget with other ad sets to improve performance for campaigns not using a campaign budget. This allows you to control budgets for each ad set while adjusting up to 20% of your ad sets' spend up or down in real time, depending on when more opportunities are available to improve your campaign's overall performance.

With ad set budget sharing, you can:

* Maintain budget control at the ad set level and allow some flexibility with your budget.
* Lessen manual guesswork by automating some of your budget allocation based on performance in real time.
* Use different ad set schedules while still having flexibility across ad sets. Note: If your ad sets end and there is only one active ad set still running, ad set budget sharing will not be applied because there are no active ad sets to share budgets with.

There are several features you can use with budget sharing:

* Budget sharing can only be used for campaigns with a daily budget at this time.
* You can use budget sharing for all objectives within the auction.
* Budget sharing is compatible with multiple bid strategies (auto, manual, etc), however the bid strategy must be the same across all ad sets in the campaign.
* Ad set budget sharing will only affect new and duplicated campaigns. Existing campaigns will not be impacted.
* Ad set budget sharing is currently available during campaign creation and mid-flight. You may enable or disable at any time.

## When to use ad set budget sharing

You can use budget sharing when you want want to increase conversions, while still maintaining control over majority of their budgets with **partial** automation, for example managing budget controls across

* Audiences, such as re-targeting and prospecting audiences
* Product or promotions, such as for sales or or time-based events
* Geographies, such as for brick and mortar locations
* Creative, such as to allow budget delivery across new and existing creatives

## How  ad set budget sharing is different from Advantage+ campaign budget

Ad set budget sharing allows you to control the majority of where your budget is delivered and can only be used with daily budgets. This is a partial automation product, where up to 20% of the budget is flexible with other ad sets in the same campaign and only when it is likely to find more opportunities.

Campaign budget allows you to leverage full automation and achieve the most efficient results because 100% of your budget is flexible and automatically allocated to find the best opportunities. With campaign budget, advertisers may specify minimum and maximum ad set spending limits.

## How  ad set budget sharing works with your daily budget
When you use budget sharing with your campaign, each ad set will not exceed 20% of its weekly budget, regardless of whether other ad sets are willing to share up to 20% of their budget. The only case when it may exceed 20% is if the ad set cannot reach delivery for the allocated budget, such as for audience that is too small. The maximum amount an ad set can spend daily is up to 20% on top of the daily flexibility value (75%).

For example, this can look like:

|  | Ad set 1 | Ad set 2 | Description |
| --- | --- | --- | --- |
| Daily budget | $10 | $20 | This is the average an ad set may spend per day. |
| Daily budget flexibility | 75% | 75% | There may be certain days when better opportunities are available. On those days, we may spend up to 75% over your daily budget. |
| Shared budget per day | $2 | $4 | Up to 20% of your budget is shared with other ad sets to maximize performance. |
| Shared budget per week | $14 | $28 | This is 7 times your shared ad set budget per day. |
| Maximum daily spend | $21 | $42 | Your maximum daily spend includes daily budget flexibility and shared budget ((Daily budget + shared budget a day) x 1.75)) |
| Maximum weekly ad set spend | $84 | $168 | Your maximum weekly spend per ad set ((Daily budget + shared budget a day) x 7 days)) |

## Reading
You can read `is_adset_budget_sharing_enabled` field by making read request to [campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#Reading).

### Example

```curl
curl -X GET \
  -d 'fields="is_adset_budget_sharing_enabled"' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v23.0/<CAMPAIGN_ID>/
```

If you want to learn how to use the Graph API, read our Using [Graph API guide](https://developers.facebook.com/docs/graph-api/overview).

### Parameters
| Parameter | Description |
| --- | --- |
| is_adset_budget_sharing_enabled | Whether the child ad sets are managed under ad set budget sharing. With ad set budget sharing, advertisers can now share up to 20% of their budget with other ad sets in the same campaign. |

### Return Type

```php
{is_adset_budget_sharing_enabled: True }
```

### Error codes
| Error | Description |
| --- | --- |
| 613 | Calls to this api have exceeded the rate limit. |

## Creating
You can enable ad set budget sharing during the [campaign creation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#Creating) by passing in True to the `is_adset_budget_sharing_enabled` field. Starting with v24.0+, you must pass either "True" or "False" to this field if you plan on setting a budget at the adset level, meaning you are not passing in the campaign budget during the campaign creation. Passing in "True" to that field will turn on the optimization. You do not need to pass this field if you are using a campaign budget, meaning you set either `daily_budget` or `lifetime_budget` at the campaign level.

### Example

```curl
curl -X POST \
  -F 'name="My campaign"' \
  -F 'objective="OUTCOME_TRAFFIC"' \
  -F 'status="PAUSED"' \
  -F 'is_adset_budget_sharing_enabled="True"' \
  -F 'special_ad_categories=[]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v23.0/act_<AD_ACCOUNT_ID>/campaigns
```

If you want to learn how to use the Graph API, read our Using [Graph API guide](https://developers.facebook.com/docs/graph-api/overview).

### Parameters
| Parameter | Description |
| --- | --- |
| is_adset_budget_sharing_enabled | Whether the child ad sets are managed under ad set budget sharing. With ad set budget sharing, advertisers can now share up to 20% of their budget with other ad sets in the same campaign. |

### Return Type

It will return the campaign ID.

```php
{ id: numeric string }
```

### Error codes
| Error | Description |
| --- | --- |
| 4834005 | You cannot enable ad set budget sharing without bid strategy. |
| 4834002 | You cannot use ad set budget sharing with campaign budget. Please disable ad set budget sharing or use ad set budget. |
| 4834009 | Must have uniform spec when creating an ad set with ad set budget sharing enabled in the parent campaign. |
| 4834009 | Must have uniform spec when creating an ad set with ad set budget sharing enabled in the parent campaign. |
| 4834011 | Must specify True or False in is_adset_budget_sharing_enabled field. This is required field starting v24 if you are not setting budget at the campaign level |

## Updating

Turning on ad set budget sharing midflight is currently not supported. However, you can turn it off midflight by updating the [campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#Updating) with `is_adset_budget_sharing_enabled` field set to False.

```curl
curl -X POST \
  -F 'is_adset_budget_sharing_enabled="False"' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v23.0/<CAMPAIGN_ID>/
```

If you want to learn how to use the Graph API, read our Using [Graph API guide](https://developers.facebook.com/docs/graph-api/overview).

### Parameters
| Parameter | Description |
| --- | --- |
| is_adset_budget_sharing_enabled | Whether the child ad sets are managed under ad set budget sharing. With ad set budget sharing, advertisers can now share up to 20% of their budget with other ad sets in the same campaign. |

### Return Type

```php
{ success: true }
```

### Error codes
| Error | Description |
| --- | --- |
| 3858418 | Budget flex cannot be enabled on a running campaign. Please create a new campaign to use budget flex. |
| 4834006 | You cannot change bid strategy midflight when ad set budget sharing is enabled |

## Deleting

Although deletion operation is not supported on this endpoint, you can achieve the same result by updating is_adset_budget_sharing_enabled with False value to disable ad set budget sharing.
