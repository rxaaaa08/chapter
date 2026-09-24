<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/value-rules | Saved: 2026-09-19 -->

# Value Rules



Value rules allow you to express value across audience, placement, and conversion location criteria and consolidate campaigns to manage performance. When you use value rules, your campaigns can adjust delivery toward criteria and outcomes you value more.

Available criteria include age, gender, location, OS, device platform, audience labels, and select placements and conversion locations.

With value rules, you can:

* Create rules to tell us how much more certain audiences are worth to your business. Our system will optimize for outcomes based on these rules.
* Focus delivery on the audiences you value most.
* Optimize for lower-funnel goals such as lifetime value by prioritizing bidding in high lifetime value segments.
* Apply rules for different audiences, placements, and conversion locations within a single ad set, allowing you to consolidate multiple campaigns.

For example, if you know that men aged 25-44 have an average 60% higher lifetime value and women 25-44 have a 20% lower lifetime value relative to customers outside of these dimensions, you can use value rules to increase your bid by 60% for the male 25-44 age group and decrease your bid by 20% for the female 25-44 age group. People outside of these value rules will receive a non-adjusted bid.

When you create a value rule set, the order of your rules will prioritize which adjustments will take place in the ad auction. If you create rules with audience overlap, we'll only use the first applicable rule to adjust the bid. For example, rule 1 states you are willing to bid 20% more for women in California and rule 2 states you are willing to bid 10% more for women who use a particular mobile operating system. If a woman in California who uses that operating system is in your audience, then we will only apply Rule 1 to bid 20% more for her because it is the first rule in the order.

### Permissions

You will need the following permissions:

* `ads_management`
* `ads_read`

## When to use value rules, audience controls, and audience suggestions

Value Rules should be used when you want to identify higher or lower value audiences and are looking to pay accordingly.

**Note:** When you use value rules, you may see more conversions from your preferred audiences, but your overall cost per result may increase.

| Goal | Use Audience Controls | Use Value Rules | Use Audience Suggestions |
| --- | --- | --- | --- |
| Must comply with regulations | YES | NO | NO |
| Willing to pay more for higher value audiences | NO | YES | NO |
| Guide Meta to reach audiences that are more likely to convert | NO | NO | YES |

See [Use audience suggestions, audience controls and value rules to reach your preferred audience](https://www.facebook.com/business/help/2016171032241412?locale=en_US) for more information. Like with other campaigns, we suggest that when using value rules, keep targeting as broad as your business allows.

## Create a value rule set

To create a value rule set, you need to make a `POST` request to the `/act_{ad-account-id}/value_rule_set` endpoint. The request body for creating a value rule set should include the following parameters:

| Name | Description |
| --- | --- |
| `name`<br><br>string | **Required.**<br>A string that represents the name of the value rule set. |
| `rules`<br><br>list<object> | **Required.**<br>An array of rules where each rule specifies a set of criteria (such as age or gender) and their corresponding bid adjustments. One rule set supports up to 10 rules. |

**Note:** You can create up to 6 rule sets per ad account.

### The `rules` parameter

| Name | Description |
| --- | --- |
| `name`<br><br>string | **Required.**<br>A string that represents the name of the rule. |
| `adjust_sign`<br><br>string | **Required.**<br>Indicates whether the adjustment increases or decreases the bid.<br><br>**Values:** `INCREASE`, `DECREASE` |
| `adjust_value`<br><br>integer | **Required.**<br>A number to inform the percentage of the adjustment for the bid.<br><br>**Values**:<br><br>* For `INCREASE`: between 1 and 1000<br>* For `DECREASE`: between 1 and 90 |
| `criteria`<br><br>list<object> | **Required.**<br>An array of objects representing the audience criteria and its associated bid adjustment. |

**Note:** You can create up to 10 rules per rule set.

### The `criteria` parameter
| Name | Description |
| --- | --- |
| `criteria_type`<br><br>string | **Required.**<br>Dimension intended for bid adjustment.<br><br>**Values:** `AGE`, `GENDER`, `OS_TYPE`, `DEVICE_PLATFORM`, `LOCATION`, `PLACEMENT`, `AUDIENCE_LABEL` |
| `operator`<br><br>string | **Required.**<br>Operator used when evaluating the criteria. Currently, the only supported operator is `CONTAINS`.<br><br>**Value:** `CONTAINS` |
| `criteria_values`<br><br>list<string> | **Required.**<br>An array of strings that specifies the criteria value for the given `criteria_type`. |
| `criteria_value_types`<br><br>list<string> | **Required.**<br>An array of strings that specifies the level of detail for the types of criteria being used. This level of detail allows for more precise targeting by defining the scope of the criteria. |

**Note:** You can add up to 4 criteria per rule. Rule sets with >2 criteria will **not** be editable (read only) in Ads Manager UI, editing rule set is possible only via API.

### The `criteria_values` and `criteria_value_types` fields

The `criteria_values` and `criteria_value_types` arrays work together to define the values for a specific `criteria_type` or dimension used in the bid adjustment. Each value in the `criteria_values` array must have a corresponding type specified in the `criteria_value_types` array, with types listed in the same order as their respective values.

| `criteria_type` | `criteria_values` | `criteria_value_types` |
| --- | --- | --- |
| `AGE` | **1. Predefined age range**<br>"18-24", "25-34", "35-44", "45-55", "55-64", "65+"<br><br>**2. Custom age range**<br>Age ranges can be arbitrary (e.g., "18-26") or open-ended (e.g., "45+"). For example: ["18-26", "31-37", "48+"].<br><br>**Important:** Using "65" as the upper limit of a range is not allowed; use "18+" instead of "18-65".<br><br>**Note:** Rule sets using custom age ranges will **not** be editable (read only) in the Ads Manager UI, editing rule set is possible only via API. | `NONE` |
| `GENDER` | `MALE`, `FEMALE` | `NONE` |
| `OS_TYPE` | `ANDROID`, `IOS` | `NONE` |
| `DEVICE_PLATFORM` | `MOBILE`, `DESKTOP` | `NONE` |
| `LOCATION` | Multiple, dependent on `criteria_value_types`.<br><br>* [`LOCATION_COUNTRY`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search#countries)<br>* [`LOCATION_REGION`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search#regions)<br>* [`LOCATION_CITY`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search#cities)<br>* [`LOCATION_DMA`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search#geomarket-codes)<br>* [`LOCATION_COMSCORE_MARKET`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search#geomarket-codes)<br><br>**Note:** Starting June 22 2026, `LOCATION_DMA` are being replaced with `LOCATION_COMSCORE_MARKET`. Rules with DMAs won't be active after this date. You can use equivalent Comscore markets in your audiences and rules. | `LOCATION_COUNTRY`, `LOCATION_REGION`, `LOCATION_CITY`, `LOCATION_DMA`, `LOCATION_COMSCORE_MARKET` |
| `PLACEMENT` | `FB_FEED`,<br>`FB_STORIES`,<br>`FB_REELS`,<br>`FB_MARKETPLACE`,<br>`FB_SEARCH`,<br>`FB_VIDEO`,<br>`IG_FEED`,<br>`IG_STORIES`,<br>`IG_REELS`,<br>`IG_EXPLORE`,<br>`AUDIENCE_NETWORK`<br><br>**Note:** Rule sets using any of `FB_MARKETPLACE`, `FB_SEARCH`, `FB_VIDEO`, `IG_EXPLORE` placements will **not** be editable (read only) in the Ads Manager UI,<br>editing rule set is possible only via API. | `NONE` |
| `OMNI_CHANNEL` | `APP`,<br>`INSTANT_FORM`,<br>`PHONE_CALL`,<br>`WEBSITE` | `NONE` |
| `AUDIENCE_LABEL` | `HIGH_VALUE`,<br>`LOW_VALUE`,<br>`OTHER_CUSTOMERS`,<br>`NEW_USERS`,<br>`QUALIFIED_LEADS`,<br>`DISQUALIFIED_LEADS`,<br>`AT_RISK`,<br>`DISENGAGED`,<br>`APP_INSTALLERS`,<br>`TRIAL_USERS`,<br>`ENGAGED_USERS`,<br>`OTHER_1`,<br>`OTHER_2`,<br>`OTHER_3` | `NONE` |

For example, if you want to apply a bid adjustment to the age ranges `45-55` and `55-64`, here is what the criteria object would look like:

```json
{
  "criteria_type": "AGE",
  "operator": "CONTAINS",
  "criteria_values": [
    "45-55",
    "55-64"
  ],
  "criteria_value_types": [
    "NONE",
    "NONE"
  ]
}
```

Alternatively, if you want to apply a bid adjustment to the country of Brazil and the region of Alberta, Canada, here is what the criteria object would look like:

```json
{
  "criteria_type": "LOCATION",
  "operator": "CONTAINS",
  "criteria_values": [
    "BR",
    "527"
  ],
  "criteria_value_types": [
    "LOCATION_COUNTRY",
    "LOCATION_REGION"
  ]
}
```

Similarly, if you want to apply a bid adjustment to the high value and new users audience labels, here is what the criteria object would look like:

```json
{
  "criteria_type": "AUDIENCE_LABEL",
  "operator": "CONTAINS",
  "criteria_values": [
    "HIGH_VALUE",
    "NEW_USERS"
  ],
  "criteria_value_types": [
    "NONE",
    "NONE"
  ]
}
```

### Example request

```
curl -X POST \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/value_rule_set \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "My Value Rule Set",
    "rules": [
      {
        "name": "High age and gender",
        "adjust_sign": "INCREASE",
        "adjust_value": 20,
        "criterias": [
          {
            "criteria_type": "AGE",
            "operator": "CONTAINS",
            "criteria_values": [
              "18-24"
            ],
            "criteria_value_types": [
              "NONE"
            ]
          },
          {
            "criteria_type": "GENDER",
            "operator": "CONTAINS",
            "criteria_values": [
              "MALE"
            ],
            "criteria_value_types": [
              "NONE"
            ]
          }
        ]
      },
      {
        "name": "High bid for OS",
        "adjust_sign": "INCREASE",
        "adjust_value": 20,
        "criterias": [
          {
            "criteria_type": "OS_TYPE",
            "operator": "CONTAINS",
            "criteria_values": [
              "ANDROID"
            ],
            "criteria_value_types": [
              "NONE"
            ]
          }
        ]
      },
      {
        "name": "High bid for location country",
        "adjust_sign": "INCREASE",
        "adjust_value": 20,
        "criterias": [
          {
            "criteria_type": "LOCATION",
            "operator": "CONTAINS",
            "criteria_values": [
              "GB"
            ],
            "criteria_value_types": [
              "LOCATION_COUNTRY"
            ]
          }
        ]
      },
      {
        "name": "High bid for location region",
        "adjust_sign": "INCREASE",
        "adjust_value": 20,
        "criterias": [
          {
            "criteria_type": "LOCATION",
            "operator": "CONTAINS",
            "criteria_values": [
              "3847"
            ],
            "criteria_value_types": [
              "LOCATION_REGION"
            ]
          }
        ]
      }
    ]
  }'
```

## Retrieve a value rule set

To read a value rule set for a given ad account, make a `GET` request to the `/act_{ad-account-id}/value_rule_set` endpoint and list any existing value rule set in this ad account. Alternatively, you can make a `GET` request to the `/{value-rule-set-id}` endpoint.

### Example request

```html
curl -X GET \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/value_rule_set?fields=name,rules{name,adjust_sign,adjust_value,status,criterias}&access_token=<ACCESS_TOKEN>
```

### Example response

```json
{
  "data": [
    {
      "id": "1110000000003",
      "name": "My Value Rule Set",
      "rules": {
        "data": [
          {
            "name": "High age and gender",
            "adjust_sign": "INCREASE",
            "adjust_value": 20,
            "criterias": {
              "data": [
                {
                  "criteria_type": "AGE",
                  "operator": "CONTAINS",
                  "criteria_values": [
                    "18-24"
                  ],
                  "criteria_value_types": [
                    "NONE"
                  ],
                  "id": "1110000000000"
                },
                {
                  "criteria_type": "GENDER",
                  "operator": "CONTAINS",
                  "criteria_values": [
                    "male"
                  ],
                  "criteria_value_types": [
                    "NONE"
                  ],
                  "id": "1110000000001"
                }
              ]
            },
            "id": "1110000000002"
          },
        ]
      }
    }
  ]
}
```

## Update a value rule set

To update a value rule set, make a `POST` request to the `/{value-rule-set-id}` endpoint. The request body should include the ID of all existing objects you intend to update and added fields for the value rule set.

### Value rule set update workflow

The recommended workflow for updating a value rule set would be to first read the existing fields and IDs by performing a `GET` request, update the fields accordingly, and make a `POST` request with the updated payload.

#### Step 1: Retrieve the value rule set

Make a `GET` request to get all of the fields and IDs from the value rule set.

```html
curl -X GET \
https://graph.facebook.com/v25.0/<VALUE_RULE_SET_ID>?fields=name,rules{name,adjust_sign,adjust_value,status,criterias}&access_token=<ACCESS_TOKEN>
```

The resulting response will be similar to this:

```json
{
  "name": "Value Rule Set",
  "rules": {
    "data": [
      {
        "name": "High age",
        "adjust_sign": "INCREASE",
        "adjust_value": 20,
        "status": "ACTIVE",
        "criterias": {
          "data": [
            {
              "criteria_type": "AGE",
              "operator": "CONTAINS",
              "criteria_values": [
                "18-24"
              ],
              "criteria_value_types": [
                "NONE"
              ],
              "id": "1000000000000089"
            }
          ]
        },
        "id": "1000000000000099"
      }
    ]
  },
  "id": "1000000000000056",
}
```

#### Step 2: Update the value rule set

#### Example A:
If you want to include the age range `65+` in the existing criteria and add a gender criteria for `FEMALE`, the `POST` request for updating this value rule set should look like this:

```html
curl -X POST \
  https://graph.facebook.com/v25.0/<VALUE_RULE_SET_ID> \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Value Rule Set",
  "rules": [
    {
      "name": "High age",
      "adjust_sign": "INCREASE",
      "adjust_value": 20,
      "status": "ACTIVE",
      "criterias": [
        {
          "criteria_type": "AGE",
          "operator": "CONTAINS",
          "criteria_values": [
            "18-24",
            "65+"
          ],
          "criteria_value_types": [
            "NONE",
            "NONE"
          ],
          "id": "1000000000000089"
        },
        {
          "criteria_type": "GENDER",
          "operator": "CONTAINS",
          "criteria_values": [
            "FEMALE"
          ],
          "criteria_value_types": [
            "NONE"
          ]
        }
      ],
      "id": "1000000000000099"
    }
  ],
  "id": "1000000000000056"
}'
```

#### Example B:
If you want to remove the existing criteria for age, the `POST` request for updating this value rule set should look like this:

```html
curl -X POST \
  https://graph.facebook.com/v25.0/<VALUE_RULE_SET_ID> \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Value Rule Set",
  "rules": [
    {
      "name": "High age",
      "adjust_sign": "INCREASE",
      "adjust_value": 20,
      "status": "ACTIVE",
      "criterias": [
        {
          "criteria_type": "GENDER",
          "operator": "CONTAINS",
          "criteria_values": [
            "FEMALE"
          ],
          "criteria_value_types": [
            "NONE"
          ]
        }
      ],
      "id": "1000000000000099"
    }
  ],
  "id": "1000000000000056"
}'
```

#### Example C:
If you want to update the name of the rule set, the `POST` request for updating this value rule set should look like this:

```html
curl -X POST \
  https://graph.facebook.com/v25.0/<VALUE_RULE_SET_ID> \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Value Rule Set Updated Name",
  "rules": [
    {
      "name": "High age",
      "adjust_sign": "INCREASE",
      "adjust_value": 20,
      "status": "ACTIVE",
      "criterias": [
        {
          "criteria_type": "GENDER",
          "operator": "CONTAINS",
          "criteria_values": [
            "FEMALE"
          ],
          "criteria_value_types": [
            "NONE"
          ]
        }
      ],
      "id": "1000000000000099"
    }
  ],
  "id": "1000000000000056"
}'
```

## Deleting a value rule set

To delete a value rule set, make a `POST` request to the `/{value-rule-set-id}/delete_rule_set` endpoint with an empty request body.

### Example request
With the ID of the rule set you want to delete, make a request like the following:

```html
curl -X POST \
  https://graph.facebook.com/v25.0/<VALUE_RULE_SET_ID>/delete_rule_set \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

### Example response if `VALUE_RULE_SET_ID` is a valid ID

```json
{
  "success": true
}
```

### Example response if `VALUE_RULE_SET_ID` is an invalid ID

```json
{
  "error": {
    "message": "Unsupported post request. Object with ID 'redacted' does not exist, cannot be loaded due to missing permissions, or does not support this operation. Please read the Graph API documentation at /docs/graph-api",
    "type": "GraphMethodException",
    "code": 100,
    "error_subcode": 33,
    "fbtrace_id": "fbtrace_id"
  }
}
```

## Creating an ad set with a value rule set

To leverage a value rule set in an ad set, add the `value_rule_set_id` to the ad set creation request. To learn more about other ad set fields, see [Ad Set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign).

### Example request

```html
curl -X POST \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "My Ad Set",
    "campaign_id": "<CAMPAIGN_ID>",
    "value_rule_set_id": "<VALUE_RULE_SET_ID>",
    "value_rules_applied": true
    ... // other ad set fields
  }'
```

## Attaching a value rule set to an existing ad set

To attach a value rule set to an existing ad set, make a `POST` request to the `/{ad_set_id}` endpoint. Within the request body, set `value_rules_applied` to `true` and the `value_rule_set_id` to the ID of an existing value rule set.

### Example request

```html
curl -X POST \
  https://graph.facebook.com/v25.0/<AD_SET_ID> \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "value_rule_set_id": "<VALUE_RULE_SET_ID>",
    "value_rules_applied": true
  }'
```

**Note:** Including `value_rules_applied` set to `true` is optional when adding a value rule set to ad sets.

## Detaching a value rule set from an existing ad set

To remove the value rule set from an existing ad set, make a `POST` request to the `/{ad_set_id}` endpoint, setting the `value_rules_applied` field to `false` and omitting the `value_rule_set_id` field from the request body.

### Example request

```html
curl -X POST \
  https://graph.facebook.com/v25.0/<AD_SET_ID> \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "value_rules_applied": false
  }'
```

**Note:** If you include a valid `value_rule_set_id` field in the `POST` request, even with `value_rules_applied` set to `false`, the specified rule set will be attached to the campaign. To detach a value rule set, only include the `value_rules_applied` field set to `false`.

## Replacing the value rule set in an existing ad set

To replace the value rule set in an existing ad set, make a `POST` request to the `/{ad_set_id}` endpoint and provide the new `value_rule_set_id` in the request body. This will overwrite the previous value rule set associated with the ad set.

### Example request

```html
curl -X POST \
  https://graph.facebook.com/v25.0/<AD_SET_ID> \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "value_rule_set_id": "<NEW_VALUE_RULE_SET_ID>",
    "value_rules_applied": true
  }'
```

**Note:** Including `value_rules_applied` set to `true` is optional when adding a value rule set to the Ad Set.

## Eligible ad set configurations for value rule sets

A value rule set can be applied to all ad sets using the `LOWEST_COST_WITHOUT_CAP` (also known as auto-bid) and `COST_CAP` bid strategy, with the exception of following configurations:

### 1. Campaign Objective: `OUTCOME_SALES` with web and in-store conversion locations

```json
{
  "optimization_goal": "OFFSITE_CONVERSIONS",
  "promoted_object": {
    "omnichannel_object": {
      "offline": [
        {
          "custom_event_type": "PURCHASE",
          "offline_conversion_data_set_id": "offline_conversion_data_set_id"
        }
      ],
      "pixel": [
        {
          "custom_event_type": "PURCHASE",
          "pixel_id": "pixel_id"
        }
      ]
    }
  }
}
```

### 2. Campaign Objective: `OUTCOME_LEADS` with web and call conversion locations

```json
{
  "optimization_goal": "OFFSITE_CONVERSIONS",
  "optimization_sub_event": "NONE",
  "promoted_object": {
    "pixel_id": "pixel_id",
    "custom_event_type": "LEAD"
  }
}
```
