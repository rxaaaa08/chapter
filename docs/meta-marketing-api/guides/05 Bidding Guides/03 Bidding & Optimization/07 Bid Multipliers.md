<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding-and-optimization/bid-multiplier | Saved: 2026-09-19 -->

# Bid Multipliers



**Warning:** Bid multipliers are going away soon. You can now replace some of your existing bid multipliers with **value rules** in the Marketing API. [About value rules](https://www.facebook.com/business/help/535014515741813)

Bid multipliers allow you to employ an audience-aware bidding strategy within a single ad set, by assigning different weights to different audience segments within your [**bid multiplier parameter set**](#bid_multiplier_parameter_set). To bid differently for different audience segments **without bid multipliers**, you would typically create multiple ad sets, with each ad set targeting one specific audience segment. Using bid multipliers, you can create a single ad set with broad targeting, then attach a **bid multiplier parameter set** to specify bid adjustments for each audience segment. Bid multipliers can greatly reduce the number of ad sets and targeting segments needed to execute your bidding strategy.

**Note:** Advertisers running housing, employment, and credit ads, who are based in the United States or are running ads targeted to the United States have different sets of restrictions and a subset of audience categories are available for adjusting bids. Housing, employment, and credit campaigns are restricted from adjusting bids for audience categories of [`age`](#age), [`gender`](#gender), [`locale`](#locale), [`home_location`](#home_location), [`user_bucket`](#user_bucket), and lookalike [`custom_audience`](#custom_audience) (a custom audience derived from a lookalike audience).  See [**Special Ad Category**](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category).

**Warning:** Beginning January 30, 2023, ads that use a bid multiplier with third-party data categories (`booking_window`, `custom_audience` (including lookalike custom audiences), `length_of_stay`, `travel_start_date`, `travel_start_day_of_week`, `user_recency`, `user_bucket`) will no longer be delivered to users who have opted out.

## Bid multipliers and value rules {#bid_multipliers_value_rules}

The bid multipliers API is going away in 2027. To prepare for this change, you can now replace some bid multiplier use cases with [**value rules**](https://www.facebook.com/business/help/535014515741813) by following the guidance in the next section, [Replace Bid Multipliers with Value Rules](#value_rules).

**Warning:** Not all ad sets using bid multipliers can be migrated to value rules at the moment. Refer to the [Value Rules Limitations](#value_rules_limits) section for the full list of bid multipliers use cases not currently supported by value rules, and for guidance on how to handle these use cases.

**Value rules** allow you to adjust bidding for certain audiences, placements, and conversion locations. Meta's system will optimize for outcomes based on the rules you apply on the ad set level. Compared to bid multipliers, value rules offer enhanced bid adjustments, more flexibility and easier creation and management.

Similar to bid multipliers, value rules can be managed using Meta's Marketing API. The [value rules API documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/value-rules) contains instructions for using this API. In addition, value rules can be managed in [**Ads Manager**](https://adsmanager.facebook.com) using a simple interface. For users of **Ads Manager**, value rules also offer enhanced reporting capabilities, with performance breakdowns based on rules applied.

## Replace bid multipliers with value rules {#value_rules}

**Value rules** support many of the audience segmentation and bid adjustment capabilities offered by bid multipliers. By following the guidance below, many ad sets currently using bid multipliers can be migrated to value rules without interrupting ads delivery. The following sections also highlight areas where value rules work differently from bid multipliers, and offers advice on how to translate between the two products.

This section assumes some familiarity with bid multipliers concepts and usage. See the [**How to Use Bid Multipliers**](#howto) section for more details about using bid multipliers.

### Create value rule sets {#value_rules_create}

This section demonstrates how to create value rules from scratch. If you are interested in directly migrating your existing ad sets using bid multipliers to value rules, you can skip to the [translation API](#value_rules_translate) section for instructions on how to use our automated migration APIs.

Unlike bid multipliers, which require each ad set to be configured with its own [**bid multiplier parameter set**](#bid_multiplier_parameter_set), **value rules** allow you to create **value rule sets** in your ad account. Once created, each **value rule set** can be attached to any number of ad sets.

The first step to using value rules is creating a **value rule set**. This can be done using either Ads Manager or through the Marketing API.

* To create value rule sets using Ads Manager, visit the [value rules advertising settings page](https://adsmanager.facebook.com/adsmanager/manage/advertising_settings/value_adjustment_rule)
* To create value rule sets using the Marketing API, refer to the [value rules API documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/value-rules)

The following example API call, taken from the [value rules API documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/value-rules#create-a-value-rule-set), shows how to create a **value rule set** using the Marketing API.

```bash
curl -X POST \
  https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/value_rule_set \
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
      }
    ]
  }'
```

The response to this API call will include a **value rule set ID**. Save this ID as it will be needed for the next step.

### Attach value rules to ad sets {#value_rules_attach}

After a **value rule set** has been created, it must be attached to an ad set in order to adjust bids for that ad set. To attach a value rule set to an ad set, use Ads Manager to edit the ad set. Within the ad set editor, the value rules setting is located in the **Conversion** section. Check the "Apply a rule set" box, then select the rule set from the dropdown below.

Alternatively, value rules can be attached to ad sets using the Marketing API.

```bash
curl -X POST \
  https://graph.facebook.com/<API_VERSION>/<AD_SET_ID> \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "value_rule_set_id": "<VALUE_RULE_SET_ID>",
    "value_rules_applied": true
  }'
```

The `VALUE_RULE_SET_ID` is the ID returned by the API call to create the value rule set.

Note that a given ad set can use either bid multipliers or value rules, but not both. If the above API call is invoked for an ad set that already uses bid multipliers, an error will be returned. The next section shows how an ad set using bid multipliers can be migrated to value rules without interruption of ads delivery.

### Migrate ad sets from bid multipliers to value rules {#value_rules_migrate}

An ad set cannot use bid multipliers and value rules simultaneously. To migrate an ad set from bid multipliers to value rules, delete the **bid multiplier parameter set** when attaching value rules to the ad set. The following API call shows how to modify an ad set, simultaneously attaching a **value rule set** while deleting its **bid multiplier parameter set**.

```bash
curl -X POST \
  https://graph.facebook.com/<API_VERSION>/<AD_SET_ID> \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "bid_adjustments": {},
    "value_rule_set_id": "<VALUE_RULE_SET_ID>",
    "value_rules_applied": true
  }'
```

Note the empty object `{}` passed in as the value for the `bid_adjustments` field. This argument causes the **bid multiplier parameter set** to be deleted. Note that this method of deleting bid multipliers is only supported when attaching value rules. Unless attaching value rules, deleting bid multipliers is not supported.

Once an ad set has been migrated to value rules, the deletion of its **bid multipliers parameter set** cannot be reversed. Thus, it may be prudent to first [retrieve the bid multiplier parameter set](#read) on the ad set prior to migrating it to value rules. Saving this retrieved **bid multiplier parameter set** on your systems will allow you to migrate the ad set back to bid multipliers if needed.

To migrate an ad set using value rules back to bid multipliers, first detach the **value rule set** from the ad set (the value rule set remains in your ad account and is not deleted). This can be done using either Ads Manager, or through the following API call.

```bash
curl -X POST \
  https://graph.facebook.com/<API_VERSION>/<AD_SET_ID> \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "value_rules_applied": false
  }'
```

Next, use the [bid multipliers create/update API](#update) to re-apply the **bid multiplier parameter set** to the ad set.

### Value rules concepts {#value_rules_concepts}

[Value rules API documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/value-rules#create-a-value-rule-set) contains full details on the structure and evaluation semantics of **value rule sets**. This section serves as a short introduction to value rule sets for users of bid multipliers.

* A **value rule set** is a collection of audience segments and associated bid adjustments, similar to a **bid multiplier parameter set**. Unlike bid multiplier parameter sets, which must be created for each ad set, a value rule set is saved to your ad account, and can be attached to multiple ad sets. Each ad account can have up to 20 value rule sets.
* A **value rule set** contains 1 to 10 rules. Each **rule** contains a set of **criteria**, specifying the audience segment for the rule, as well as a **bid adjustment** value for the audience segment.
* Bid multipliers allow for complex nesting of audience categories in order to narrow down the audience segment for each weight adjustment. **Value rule sets** use a simpler structure without any nesting. All bid adjustments are specified within the (up to) 10 **rules** of the value rule set. To support advanced audience segmentation, value **rules** support multiple **criteria** per rule.
* **Rules** in a value rule set are listed in order of priority. Rules earlier in the list have higher priority than rules later in the list. If a user matches the criteria for more than 1 rule, the applied bid adjustment for that user will come from the earliest matching rule.
* Each **rule** in a value rule set contains 1 to 4 **criteria**. Value rule criteria fall into several types, similar to bid multiplier audience categories. Not all bid multiplier audience categories are supported in value rules. Refer to the table below for a list of value rule **criteria types** and their corresponding bid multiplier audience categories.
* Two **criteria** within the same rule must not have the same **criteria type**.
* Each value rule **criteria** contains 1 or more **criteria values**. The possible **criteria values** depend on the **criteria type**. For example, a criteria of type `AGE` supports criteria values such as `18-24` and `65+`. Multiple criteria values can be added to a criteria. The criteria matches if the user matches any of its criteria values.
* Unlike bid multipliers, value rules do not support customizing the default weight. The default bid adjustment of value rule sets is always **1.0**. Instead, value rules support both increasing and decreasing the bid. Value rules support decreasing the bid by **up to 90%**, and increasing the bid by **up to 1000%**.
* A name is required when creating a **value rule set**. Names are also required for each **rule** in the value rule set. This allows for the easy identification of value rule sets when attaching them to ad sets, and segmentation by rules within reporting surfaces.

**Value rule criteria types**
| Value rule criteria type | Bid multiplier audience category |
| --- | --- |
| `AGE` | [`age`](#age) |
| `DEVICE_PLATFORM` | [`device_platform`](#device_platform) |
| `GENDER` | [`gender`](#gender) |
| `LOCATION` | [`home_location`](#home_location) |
| `OMNI_CHANNEL` | Not available in bid multipliers |
| `PLACEMENT` | [`position_type`](#position_type), [`publisher_platform`](#publisher_platform) |
| `OS_TYPE` | [`user_os`](#user_os) |

Note that both `publisher_platform` and `position_type` audience categories from bid multipliers map to the `PLACEMENT` criteria type in value rules. Refer to the [publisher_platform](#publisher_platform) and [position_type](#position_type) sections for details on how to translate these audience categories to value rules.

In addition to the criteria types corresponding to bid multiplier audience categories, value rules support a new criteria type, `OMNI_CHANNEL`, which can be used to specify the conversion location of the ad. Example **criteria values** for the `OMNI_CHANNEL` criteria type include `WEBSITE` and `APP`.

### Value rules limitations {#value_rules_limits}

* Value rules support the following criteria types: age, device platform, gender, location, omni-channel, placement, and OS type. Bid multiplier audience categories which do not map to one of the aforementioned criteria types are not supported by value rules.
* Each ad account may have a maximum of 20 rule sets. Each rule set may have a maximum of 10 rules. Each rule may have a maximum of 4 criteria.
* Currently, only ad sets using the `LOWEST_COST_WITHOUT_CAP` (also known as auto-bid) and `COST_CAP` (also known as Cost per result goal) bid strategy are supported by value rules. Other manual bidding strategies such as ROAS goal, or bid cap are not supported by value rules.
* Housing, employment, and credit campaigns are restricted from using value rule criteria types `AGE` and `GENDER`, as well as certain location types for criteria type `LOCATION`. See [**Special Ad Category**](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category).
* If you have campaigns using campaign budget optimization (CBO), using value rules with ad sets in these CBO campaigns requires special consideration (see below).

If you have an ad set that cannot be migrated to value rules due to one of the above limitations, please find specific guidance for each scenario below.

#### Using value rules with campaign budget optimization

For campaigns using campaign budget optimization (CBO), we recommend that you attach the same value rule set to all ad sets in the campaign. Using different value rule sets for ad sets in a CBO campaign, or enabling value rules for only some ad sets in a CBO campaign, may lead to unexpected delivery outcomes.

When migrating an ad set in a CBO campaign from bid multipliers to value rules, care must be taken to ensure the migration process does not disrupt CBO delivery. For this reason, if the bid multiplier parameter set for a CBO ad set has a default weight (the weight that is applied when none of the audience segments match) not equal to 1.0, the migration request will be rejected. A bid multiplier parameter set with a default weight equal to 1.0 can be migrated to value rules. If a default weight is not explicitly specified in the bid multiplier parameter set, the implicit default weight is 1.0, which means that the bid multiplier parameter set can be migrated to value rules.

#### Custom audience bid multipliers

In early 2026, value rules will support a new criteria type called Audience Labels. Some bidding strategies currently based on custom audiences will be supported by Audience Labels. This value rules feature is currently in closed beta, and will become generally available shortly.

#### Bid multiplier usage with maximize value of conversions performance goal

Value rules will soon support ad sets with the maximize value of conversions performance goal (known as `RETURN_ON_AD_SPEND` in the API). Please wait for our announcement of this feature before migrating ad sets using value optimization from bid multipliers to value rules.

#### Bid multiplier usage with bid cap bidding strategy

We do not plan to support bid cap bidding strategy with value rules. Please consider migrating your bid cap ad sets to cost per result goal. Once migrated to cost per result goal, the ad set can be migrated to value rules once cost per result goal bidding becomes available in value rules some time in 2026.

#### Bid multiplier with unsupported audience category

Other than Audience Labels, which will serve some of the same functions as the Custom Audience category in bid multipliers, we do not plan to add any more criteria types to value rules. If your bid multiplier parameter set make use of one of the unsupported audience categories, such as user bucket or locale, value rules will not be able to express the same audience segmentation. Please consider whether your bidding strategy can be simplified such that audience segmentation based on unsupported audience categories can be eliminated. If this is possible, then value rules can be used to implement your simplified bidding strategy.

### Translate bid multipliers to value rules {#value_rules_translate}

To help you migrate from bid multipliers to value rules, we have created a translation API that automatically produces a value rule set containing segmentation and adjustments equivalent to your existing bid multiplier parameter set. Instructions for using the translation API can be found below. We are gradually rolling out the translation API to advertisers using bid multipliers over the coming days. If the below instructions do not work for you, please wait a few days for our rollout to complete.

Due to [value rules limitations](#value_rules_limits), not all bid multiplier parameter sets can be automatically translated to value rule sets. If the translation API cannot provide an automatic translation for your use case, you may still be able to create a value rule set that covers a portion of the functionality of your bid multiplier parameter set. Refer to the [manual translation](#value_rules_translate_manual) section below for instructions on performing the translation process yourself.

#### Translation API

To translate the bid multiplier parameter set in an existing ad set to a value rule set, make the following API request:

```bash
curl -X POST \
  https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/value_rule_set_translation \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "source": {
      "bid_multiplier_ad_set_id": <AD_SET_ID>
    }
  }'
```

The `AD_SET_ID` is the ID of the ad set containing your existing bid multiplier parameter set, and the `AD_ACCOUNT_ID` is the ad account which owns that ad set.

If successful, the translation API will return a result similar to the following:

```json
{
  "success": true,
  "value_rule_set": {
    "name": "Migrated from Bid Multiplier specification",
    "rules": [
      {
        "name": "Migrated Rule #1 - Age - 20-40",
        "adjust_sign": "DECREASE",
        "adjust_value": 50,
        "criterias": [
          {
            "criteria_type": "AGE",
            "operator": "CONTAINS",
            "criteria_values": [
              "20-40"
            ],
            "criteria_value_types": [
              "NONE"
            ]
          }
        ]
      }
    ]
  }
}
```

The translation result is under the key `value_rule_set`. The object under this key (starting with the opening braces `{` and ending with the corresponding closing braces `}`) can be saved and re-used for the next part of the migration flow described below. You can also modify this translation output after saving it, to fine-tune how your value rule set will be created.

As an alternative to providing the ad set ID to the translation endpoint, you can instead provide the bid multiplier parameter set itself. Such an API request looks like the following:

```bash
curl -X POST \
  https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/value_rule_set_translation \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "source": {
      "bid_multiplier_parameter_set": {
        "gender": {
          "male": 0.5,
          "default": 1.0
        }
      }
    }
  }'
```

This can be useful if you wish to experiment with providing different bid multiplier parameter sets to the translation API and find out how they will translate into value rule sets.

#### Migrate ad set using translated value rule set

The output of the translation API can be copied and pasted into an API request to [create the value rule set](#value_rules_create). After creating the value rule set, another API request can be made to migrate the ad set from bid multipliers to the newly created value rule set. Instead of following this 2-step process, you can use the following alternative process to complete the migration in 1-step.

To migrate the ad set from bid multipliers to value rules in 1-step using the translation API output, make the following API request:

```bash
curl -X POST \
  https://graph.facebook.com/<API_VERSION>/<AD_SET_ID> \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "value_rules_spec": {
      "value_rule_set": <VALUE_RULE_SET_OBJECT>
    },
    "bid_adjustments": {}
  }'
```

The `AD_SET_ID` is the ID of the ad set being migrated. The `VALUE_RULE_SET_OBJECT` is the object under the `value_rule_set` key copied from the translation API output.

If this API call is successful, two things happen as a result:

1. A new value rule set is created in the ad account
2. The ad set is migrated from bid multipliers to the newly created value rule set

#### Deduplicating translated value rule sets

Since an ad account is limited to 20 value rule sets, you should avoid creating value rule sets that are duplicates of each other. Creating duplicate value rule sets can happen accidentally as a result of migrating ad sets with identical bid multiplier parameter sets. To help avoid this situation, the translation API detects potential duplicates, and returns the ID of the existing value rule set if the translation result matches such an existing value rule set. When this happens, the output of the translation API will look like the following:

```json
{
  "success": true,
  "existing_value_rule_set_id": <VALUE_RULE_SET_ID>,
  "value_rule_set": {
    "name": "Migrated from Bid Multiplier specification",
    "rules": [
      {
        "name": "Migrated Rule #1 - Age - 20-40",
        "adjust_sign": "DECREASE",
        "adjust_value": 50,
        "criterias": [
          {
            "criteria_type": "AGE",
            "operator": "CONTAINS",
            "criteria_values": [
              "20-40"
            ],
            "criteria_value_types": [
              "NONE"
            ]
          }
        ]
      }
    ]
  }
}
```

The complete translation output is still returned for reference. But this output should not be used directly. Instead, use the `VALUE_RULE_SET_ID` under the `existing_value_rule_set_id` key. This is the ID of the value rule set under the ad account which exactly matches the translation output (ignoring the names of rule set and rules). In this case, instead of creating a new value rule set, the existing value rule set can be used and attached to the ad set. See the [value rules attachment API](#value_rules_migrate) section for details on how to use the existing value rule set ID.

### Manually translate bid multipliers to value rules {#value_rules_translate_manual}

This section contains detailed explorations of the value rules JSON structures in order to build up some heuristics for translating **bid multiplier parameter sets** to **value rule sets**. Refer to the [Audience Category Reference](#categories) section for a table of bid multiplier audience categories supported by value rules. Click on the name of each supported audience category in that table to see example translations of that category into value rules.

#### Criteria

Criteria are the smallest building block of value rule sets. A criteria contains a **criteria type**, plus 1 or more **criteria values**, all of which must be valid values for the given criteria type. In addition, there is the `criteria_value_types` array. This array must be the same size as the `criteria_values` array, and each element in this array matches exactly one element in the `criteria_values` array based on its position. For most criteria types, the elements of the `criteria_value_types` array are always `NONE`. For the `LOCATION` criteria type, the elements of the `criteria_value_types` array specify the type of location code for each element in the `criteria_values` array.

**Example single-value criteria**

```json
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
```

**Example multi-value criteria**

```json
{
  "criteria_type": "AGE",
  "operator": "CONTAINS",
  "criteria_values": [
    "18-24", "35-44"
  ],
  "criteria_value_types": [
    "NONE", "NONE"
  ]
}
```

**Example location criteria**

```json
{
  "criteria_type": "LOCATION",
  "operator": "CONTAINS",
  "criteria_values": [
    "BR", "527"
  ],
  "criteria_value_types": [
    "LOCATION_COUNTRY", "LOCATION_REGION"
  ]
}
```

Refer to the [value rules API documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/value-rules#the-criteria-parameter) for a full table of supported **criteria values** for each **criteria type**.

#### Rule

Rules are made up of 1 or more criteria. In addition to the criteria, a rule has a name, an **adjustment sign**, and an **adjustment value**. The possible values for the adjustment sign are `INCREASE` and `DECREASE`.

When the adjustment sign is `INCREASE`, the possible values for the adjustment range from **1** to **1000**. These represent between 1% to 1000% increase in the bid.

When the adjustment sign is `DECREASE`, the possible values for the adjustment range from **1** to **90**. These represent between 1% to 90% decrease in the bid.

**Example rule with 1 criteria**

```json
{
  "name": "Age rule 1",
  "adjust_sign": "DECREASE",
  "adjust_value": 30,
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
    }
  ]
}
```

#### Value rule set

Value rule sets are made up of 1 or more rules. In addition to the rules, a value rule set also has a name. The rules in the value rule set are evaluated in order. Once a user matches a rule, evaluation stops at that rule and the user receives the bid adjustment from that rule. Rules further down the list are ignored once a match has been bound.

**Example value rule set with 2 rules**

```json
{
  "name": "My Value Rule Set",
  "rules": [
    {
      "name": "Age rule 1",
      "adjust_sign": "DECREASE",
      "adjust_value": 30,
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
        }
      ]
    },
    {
      "name": "Age rule 2",
      "adjust_sign": "DECREASE",
      "adjust_value": 20,
      "criterias": [
        {
          "criteria_type": "AGE",
          "operator": "CONTAINS",
          "criteria_values": [
            "25-34"
          ],
          "criteria_value_types": [
            "NONE"
          ]
        }
      ]
    }
  ]
}
```

#### Translate simple bid multiplier parameter set

The first step of the translation process is retrieving the existing **bid multiplier parameter set**. Refer to the [Read Ad Set Bid Multipliers](#read) section for the API call needed for this step. Once the bid multiplier parameter set has been retrieved, follow the steps in this section to translate it to a **value rule set**.

We start with the simplest kind of bid multiplier parameter set to translate: a parameter set containing a single audience category, with a default weight of 1.0. An example is the below parameter set:

```json
{
  "age": {
    "18-24": 0.7,
    "25-34": 0.8,
    "default": 1.0
  }
}
```

Note that the `default` weight may also be omitted from the parameter set. An omitted default weight is equivalent to a default weight of **1.0**.

Each non-default parameter value can be translated into 1 rule with 1 criteria. The audience category together with the parameter value determine the value rule criteria, while the weight value determine the value rule adjustment. For the example above, 2 rules are produced, each with 1 `AGE` criteria. The translated result is as follows.

```json
{
  "name": "My Value Rule Set",
  "rules": [
    {
      "name": "Age rule 1",
      "adjust_sign": "DECREASE",
      "adjust_value": 30,
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
        }
      ]
    },
    {
      "name": "Age rule 2",
      "adjust_sign": "DECREASE",
      "adjust_value": 20,
      "criterias": [
        {
          "criteria_type": "AGE",
          "operator": "CONTAINS",
          "criteria_values": [
            "25-34"
          ],
          "criteria_value_types": [
            "NONE"
          ]
        }
      ]
    }
  ]
}
```

A small complication arises if the default weight in the parameter set is not 1.0, as in the following example:

```json
{
  "age": {
    "18-24": 0.7,
    "25-34": 0.8,
    "default": 0.5
  }
}
```

Value rules only support default adjustment of 1.0. To translate the above parameter set to value rules, we need to scale all weights such that the default weight is 1.0. This may cause some weights to exceed 1.0, which is not an issue since value rules supports bid increases as well as bid decreases. After scaling the weights, we arrive at the following:

```json
{
  "age": {
    "18-24": 1.4,
    "25-34": 1.6,
    "default": 1.0
  }
}
```

The above is no longer a valid bid multiplier parameter set, due to the weights exceeding 1.0. It only serves as a source to inform the translation into value rules. The translated value rule set is as follows.

```json
{
  "name": "My Value Rule Set",
  "rules": [
    {
      "name": "Age rule 1",
      "adjust_sign": "INCREASE",
      "adjust_value": 40,
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
        }
      ]
    },
    {
      "name": "Age rule 2",
      "adjust_sign": "INCREASE",
      "adjust_value": 60,
      "criterias": [
        {
          "criteria_type": "AGE",
          "operator": "CONTAINS",
          "criteria_values": [
            "25-34"
          ],
          "criteria_value_types": [
            "NONE"
          ]
        }
      ]
    }
  ]
}
```

#### Translate nested bid multiplier parameter set

In a bid multiplier parameter set, it is possible to narrow down an audience segment using multiple audience categories, by nesting one audience category under the parameter of another. In the below example, the 25-34 age cohort is further refined into two segments, males aged 25-34 and females aged 25-34.

```json
{
  "age": {
    "18-24": 0.7,
    "25-34": {
      "gender": {
        "male": 0.9,
        "female": 0.95,
        "default": 1.0
      }
    },
    "default": 1.0
  }
}
```

There is no nesting in value rule sets. Instead, each rule in a value rule set supports multiple criteria directly. To translate examples like the above to value rules, start at the top of the JSON document and proceed downwards. Each time a weight is encountered, a new rule is added to the translated value rule set. To determine the criteria to include in the translated rule, examine all of the audience categories and parameter values a user needs to match to land at this weight. Those audience categories and parameter values become the criteria types and criteria values in the rule.

For the above example, starting from the top, the first weight reached is **0.7**. This weight is for an audience segment aged 18-24. Thus, the first rule in the translated value rule set is a rule with a single `AGE` criteria, with a criteria value of `18-24`.

The second weight reached is **0.9**. This weight is for an audience segment of males aged 25-34. The second rule in the translated value rule set is a rule with two criteria: an `AGE` criteria with value `25-34`, and a `GENDER` criteria with a criteria value of `MALE`.

The third weight reached is **0.95**. This weight is for an audience segment of females aged 25-34. The third rule in the translated value rule set is a rule with two criteria: an `AGE` criteria with value `25-34`, and a `GENDER` criteria with a criteria value of `FEMALE`.

All remaining weights in the parameter spec are default weights of **1.0**, which do not need to be translated. Thus, the final value rule set contains 3 rules.

```json
{
  "name": "My Value Rule Set",
  "rules": [
    {
      "name": "Age rule 1",
      "adjust_sign": "DECREASE",
      "adjust_value": 30,
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
        }
      ]
    },
    {
      "name": "Age and gender rule 2",
      "adjust_sign": "DECREASE",
      "adjust_value": 10,
      "criterias": [
        {
          "criteria_type": "AGE",
          "operator": "CONTAINS",
          "criteria_values": [
            "25-34"
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
      "name": "Age and gender rule 3",
      "adjust_sign": "DECREASE",
      "adjust_value": 5,
      "criterias": [
        {
          "criteria_type": "AGE",
          "operator": "CONTAINS",
          "criteria_values": [
            "25-34"
          ],
          "criteria_value_types": [
            "NONE"
          ]
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
      ]
    }
  ]
}
```

## How to use bid multipliers {#howto}

* Bid multipliers are specified for each ad set. To use bid multipliers, first create an ad set using either **Ads Manager** or the **Marketing API**. Then, use the **bid multipliers API** described in this document to create bid multipliers for the ad set.
* To set up bid multipliers for an ad set, first compose a **bid multiplier parameter set**. A bid multiplier parameter set is a structured JSON document with one or more **audience categories**, **parameter values**, and **weights**.
* Within a **bid multiplier parameter set**, the **weight** is the multiplier applied to the bid for the given parameter value under the given audience category. The weight can range from `0.09` to `1.0`.
* Bid multipliers are part of the `bid_adjustments` field within an ad set. Within the `bid_adjustments` field, the **bid multiplier parameter set** is specified under the `user_groups` key.

### Create or update bid multipliers for an ad set {#update}

To create or update bid multipliers for an ad set, make a **POST** request to the ad set endpoint, providing the **bid multiplier parameter set** under the `user_groups` key within the `bid_adjustments` field.

```bash
curl -X POST \
  -F 'bid_adjustments={"user_groups": <BID_MULTIPLIER_PARAMETER_SET>}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<AD_SET_ID>
```

For example, the below API call sets up bid multipliers that apply different weights to different user buckets from the given event sources.

```bash
curl -X POST \
  -F 'bid_adjustments={
       "user_groups": {
         "user_bucket": {
           "event_sources": [
             "<PIXEL_ID>",
             "<APP_ID>"
           ],
           "1": 0.1,
           "2": 0.2,
           "3": 0.3,
           "default": 0.4
         }
       }
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<AD_SET_ID>
```

### Read ad set bid multipliers {#read}

To read the existing bid multipliers of an ad set, make a **GET** request to the ad set endpoint, specifying the `bid_adjustments` field in the `fields` query parameter.

```
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<AD_SET_ID>?fields=bid_adjustments
```

The result will look like the following. Note that the bid multiplier parameter set may be returned as a double-quoted string, with interior escape sequences. You may use a string to JSON parser to recover the structured JSON document.

```json
{
  "bid_adjustments": {
    "user_groups": "{\"age\":{\"default\":0.8,\"18-24\":0.5}}"
  },
  "id": "<BID_ADJUSTMENTS_ID>"
}
```

### Bid multiplier parameter set {#bid_multiplier_parameter_set}

The **bid multiplier parameter set** is a structured JSON document used to set up bid multipliers for an ad set. A bid multiplier parameter set contains exactly one root audience category, with one or more parameter values under the root audience category. Each parameter value is associated with either a weight, or a nested bid multiplier parameter set containing another audience category. The root audience category may optionally specify a `default` parameter value, which can be associated with either a weight or a nested bid multiplier parameter set. If a `default` parameter value is not specified, a default weight of **1.0** is used.

```json
{
  <AUDIENCE_CATEGORY>: {
    <PARAMETER_VALUE_1>: <WEIGHT or NESTED_BID_MULTIPLIER_PARAMETER_SET>,
    <PARAMETER_VALUE_2>: <WEIGHT or NESTED_BID_MULTIPLIER_PARAMETER_SET>,
    <PARAMETER_VALUE_3>: <WEIGHT or NESTED_BID_MULTIPLIER_PARAMETER_SET>,
    ...
    "default": <WEIGHT or NESTED_BID_MULTIPLIER_PARAMETER_SET>, // optional, if not specified, 1.0 will be used
  }
}
```

Audience categories include (but are not limited to) the following:

* `age`
* `gender`
* `device_platform`
* `publisher_platform`
* `user_device`
* `user_os`

Refer to the [Audience Category Reference](#categories) section for a full list of audience categories.

**Simple example**

```json
{
  "age": {
    "18-24": 0.7,
    "25-34": 1.0,
    "default": 0.3
  }
}
```

* For users between the ages of 18 and 24, apply weight 0.7
* For users between the ages of 25 and 34, apply weight 1.0
* For all other users, apply weight 0.3

**Example with multiple audience categories**

```json
{
  "age": {
    "18-24": 0.7,
    "25-34": {
      "gender": {
        "male": 0.9,
        "female": 1.0
      }
    },
    "default": 0.85
  }
}
```

* For users between the ages of 18 and 24, apply weight 0.7
* For male users between the ages of 25 and 34, apply weight 0.9
* For female users between the ages of 25 and 34, apply weight 1.0
* For all other users, apply weight 0.85

**Example with nested audience category in default position**

```json
{
  "age": {
    "18-24": 0.7,
    "25-34": 0.9,
    "default": {
      "gender": {
        "male": 0.3,
        "female": 0.4
      }
    }
  }
}
```

* For users between the ages of 18 and 24, apply weight 0.7
* For users between the ages of 25 and 34, apply weight 0.9
* For male users of any other age, apply weight 0.3
* For female users of any other age, apply weight 0.4
* For all other users, apply weight 1.0 (implicit default)

## Audience category reference {#categories}

The following table lists the audience categories that can be specified in a **bid multiplier parameter set**. Audience categories are defined with user demographic information, user device information, ad placement data, and advertiser custom data. Clicking on each audience category name to navigate to a detailed list of possible parameter values for that audience category. Housing, employment, or credit campaigns are restricted from assigning weights for audience categories of [`age`](#age), [`gender`](#gender), [`locale`](#locale), [`home_location`](#home_location), [`user_bucket`](#user_bucket), and lookalike [`custom_audience`](#custom_audience) (a custom audience derived from a lookalike audience).

| Audience category | Description | Value rules criteria type |
| --- | --- | --- |
| [`age`](#age) | Bid differently based on age or age range. (Not available for housing, employment, and credit campaigns.) | `AGE` |
| [`booking_window`](#booking_window) | Bid differently based on number of days until the start of travel. | Not supported in value rules |
| [`custom_audience`](#custom_audience) | Bid based on `custom_audience` the user is a part of. Lookalike audiences are supported for this option, except for housing, employment, and credit campaigns. | Not supported in value rules |
| [`device_platform`](#device_platform) | Bid differently based on the user's device platform, such as mobile or desktop. | `DEVICE_PLATFORM` |
| [`gender`](#gender) | Bid differently based on gender. (Not available for housing, employment, and credit campaigns.) | `GENDER` |
| [`home_location`](#home_location) | Bid based on the user's locations, including their configured home location, as well as any recent locations. This multiplier will apply if the user's home location or any of their recent locations match the given parameter. The `home_location` multiplier can be broken down into cities, regions, countries, and DMAs. (Not available for housing, employment, and credit campaigns.) | `LOCATION` |
| [`length_of_stay`](#length_of_stay) | Bid based on number of days between start and end of travel. | Not supported in value rules |
| [`locale`](#locale) | Bid differently based on locale such as English or Spanish. (Not available for housing, employment, and credit campaigns.) | Not supported in value rules |
| [`position_type`](#position_type) | Bid based on which position an ad is shown; for example, `facebook_feed`, `facebook_marketplace`, or `instagram_story`. | `PLACEMENT` |
| [`publisher_platform`](#publisher_platform) | Bid based on `publisher_platform` such as `facebook`, `instagram`, `audience_network`, `messenger`. | `PLACEMENT` |
| [`travel_start_date`](#travel_start_date) | Bid differently based on date that travel starts; for example, `20181231` is 31 December 2018. | Not supported in value rules |
| [`travel_start_day_of_week`](#travel_start_day_of_week) | Bid based on day of week that travel starts. `0` is Monday; `6` is Sunday. | Not supported in value rules |
| [`user_bucket`](#user_bucket) | Bid based on the `user_bucket` value defined in the advertiser's pixel fire or app event. The `user_bucket` field is an optional parameter expressed in an integer ranging from 0 to 100. (NOTE: 1.Not available for housing, employment, and credit campaigns; 2. Only available for hotel vertical, that is, when `content_type`="hotel") | Not supported in value rules |
| [`user_device`](#user_device) | Bid based on `user_device`, such as iPhone. | Not supported in value rules |
| [`user_os`](#user_os) | Bid based on `user_os` such as iOS or Android. | `OS_TYPE` |
| [`user_recency`](#user_recency) | Bid based on when the user last visited the site or app. | Not supported in value rules |

### `age` {#age}

Group users by age ranges; for example, `18-24`, `25-34`. The minimum age that can be specified is 18. Age ranges should not overlap.

**Example**

```json
{
  "age": {
    "18-24": 0.5,
    "25-34": 0.7,
    "default": 1.0
  }
}
```

**Example API call**

```bash
curl -X POST \
  -F 'bid_adjustments=
     {"user_groups":{"age":{"18-24":0.5,"25-34":0.7,"default":1.0}}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<AD_SET_ID>
```

**Equivalent value rule set**

```json
{
  "name": "Example",
  "rules": [
    {
      "name": "Rule 1",
      "adjust_sign": "DECREASE",
      "adjust_value": 50,
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
        }
      ]
    },
    {
      "name": "Rule 2",
      "adjust_sign": "DECREASE",
      "adjust_value": 30,
      "criterias": [
        {
          "criteria_type": "AGE",
          "operator": "CONTAINS",
          "criteria_values": [
            "25-34"
          ],
          "criteria_value_types": [
            "NONE"
          ]
        }
      ]
    }
  ]
}
```

### `booking_window` {#booking_window}

Possible parameter values include any integer range greater than or equal to 1. For example, `1-3`, `4-9`, and so on.

**Example API call**

```bash
curl -X POST \
  -F 'bid_adjustments=
     {"user_groups":{"booking_window":{"event_sources":["123456789"],"1-2":0.1,"3-5":0.2,"default":0.5}}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<AD_SET_ID>
```

### `custom_audience` {#custom_audience}

**Warning:** Beginning January 30, 2023, ads that use a bid multiplier with third-party data categories (`booking_window`, `custom_audience` (including lookalike custom audiences), `length_of_stay`, `travel_start_date`, `travel_start_day_of_week`, `user_recency`, `user_bucket`) will no longer be delivered to users who have opted out.

You can adjust bids based on your custom audiences.

**Example API call**

```bash
curl -X POST \
  -F 'bid_adjustments=
     {"user_groups":{"custom_audience":{"<CUSTOM_AUDIENCE_ID>":0.8, "<CUSTOM_AUDIENCE_ID>":1.0, "default":0.5}}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<AD_SET_ID>
```

If a user belongs to multiple custom audiences, the most significant bid adjustment will be applied.

### `device_platform` {#device_platform}

Possible parameter values:

| Description | Bid multiplier parameter value | Value rule criteria value |
| --- | --- | --- |
| Mobile | `mobile` | `MOBILE` |
| Desktop | `desktop` | `DESKTOP` |

**Example**

```
{
  "device_platform": {
    "mobile": 0.7,
    "desktop": 0.9
  }
}
```

**Equivalent value rule set**

```json
{
  "name": "Example",
  "rules": [
    {
      "name": "Rule 1",
      "adjust_sign": "DECREASE",
      "adjust_value": 30,
      "criterias": [
        {
          "criteria_type": "DEVICE_PLATFORM",
          "operator": "CONTAINS",
          "criteria_values": [
            "MOBILE"
          ],
          "criteria_value_types": [
            "NONE"
          ]
        }
      ]
    },
    {
      "name": "Rule 2",
      "adjust_sign": "DECREASE",
      "adjust_value": 10,
      "criterias": [
        {
          "criteria_type": "DEVICE_PLATFORM",
          "operator": "CONTAINS",
          "criteria_values": [
            "DESKTOP"
          ],
          "criteria_value_types": [
            "NONE"
          ]
        }
      ]
    }
  ]
}
```

### `gender` {#gender}

Possible parameter values:

| Description | Bid multiplier parameter value | Value rule criteria value |
| --- | --- | --- |
| Female | `female` | `FEMALE` |
| Male | `male` | `MALE` |

**Example**

```
{
  "gender": {
    "male": 0.5,
    "female": 0.7,
    "default": 1.0
  }
}
```

**Equivalent value rule set**

```json
{
  "name": "Example",
  "rules": [
    {
      "name": "Rule 1",
      "adjust_sign": "DECREASE",
      "adjust_value": 50,
      "criterias": [
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
      "name": "Rule 2",
      "adjust_sign": "DECREASE",
      "adjust_value": 30,
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
      ]
    }
  ]
}
```

### `home_location` {#home_location}

Possible parameter values:

* `city id`
* `region id`
* 2-digit country code
* 3-digit DMA code

You can find `city id` and `region id` in the [Search API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search). You can query from the [Graph API Explorer](https://developers.facebook.com/tools/explorer/) or from your terminal.

Value rules do not support DMAs. When translating bid multiplier parameter sets with DMA codes, the DMA codes will be automatically translated into corresponding Comscore Market IDs. [About Comscore Markets](https://business.facebook.com/business/help/709868688063859).

**Note:** The `default` can only be set under `home_location` not `cities`, `regions`, or `countries`.

**Example**

```
{
  "home_location": {
    "cities": {
      "2420605": 0.2
    },
    "regions": {
      "3847": 0.5
    },
    "countries": {
      "US": 0.2
    },
    "default": 0.8
  }
}
```

**Equivalent value rule set**

```json
{
  "name": "Example",
  "rules": [
    {
      "name": "Rule 1",
      "adjust_sign": "DECREASE",
      "adjust_value": 75,
      "criterias": [
        {
          "criteria_type": "LOCATION",
          "operator": "CONTAINS",
          "criteria_values": [
            "2420605"
          ],
          "criteria_value_types": [
            "LOCATION_CITY"
          ]
        }
      ]
    },
    {
      "name": "Rule 2",
      "adjust_sign": "DECREASE",
      "adjust_value": 38,
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
    },
    {
      "name": "Rule 3",
      "adjust_sign": "DECREASE",
      "adjust_value": 75,
      "criterias": [
        {
          "criteria_type": "LOCATION",
          "operator": "CONTAINS",
          "criteria_values": [
            "US"
          ],
          "criteria_value_types": [
            "LOCATION_COUNTRY"
          ]
        }
      ]
    }
  ]
}
```

### `length_of_stay` {#length_of_stay}

Possible parameter values include any integer range greater than or equal to 1. For example, `"1-3"`, `"4-9"`, and so on.

**Example API call**

```bash
curl -X POST \
  -F 'bid_adjustments=
     {"user_groups":{"length_of_stay":{"event_sources":["123456789"],"1-2":0.1,"3-5":0.2,"default":0.5}}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<AD_SET_ID>
```

### `locale` {#locale}

You can use locale or locale group IDs, such as `6` for US English or `5` for German.

You can find locale IDs with [Targeting Search, Locale](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search#locale) with `type=adlocale`.

**Example**

```
{
  "locale": {
    6: 0.8,
    5: 0.3
  }
}
```

### `position_type` {#position_type}

This category is similar to the position options in the [Targeting API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting#placement). Possible parameter values:

| Description | Bid multiplier parameter value | Value rule criteria value |
| --- | --- | --- |
| Facebook feed | `facebook_feed` | `FB_FEED` |
| Facebook Marketplace | `facebook_marketplace` | `FB_MARKETPLACE` |
| Facebook video feeds | `facebook_suggested_video` | Not supported |
| Facebook right column | `facebook_right_hand_column` | Not supported |
| Facebook Business Explore | `facebook_biz_disco_feed` | Not supported |
| Instagram feed | `instagram_stream` | `IG_FEED` |
| Instagram profile feed | `instagram_profile_feed` | Not supported |
| Instagram Explore | `instagram_explore` | `IG_EXPLORE` |
| Instagram Explore home | `instagram_explore_home` | Not supported |
| Messenger inbox | `messenger_messenger_home` | Not supported |
| Instagram Stories | `instagram_story` | `IG_STORIES` |
| Facebook Stories | `facebook_story` | `FB_STORIES` |
| Messenger Stories | `messenger_story` | Not supported |
| Instagram Reels | `instagram_reels` | `IG_REELS` |
| Facebook Reels | `facebook_facebook_reels` | `FB_REELS` |
| Facebook in-stream videos | `facebook_instream_video` | `FB_VIDEO` |
| Ads on Facebook Reels | `facebook_facebook_reels_overlay` | Not supported |
| Facebook search results | `facebook_search` | `FB_SEARCH` |
| Instagram search results | `instagram_ig_search` | Not supported |
| Messenger sponsored messages | Not supported | Not supported |
| Audience Network native, banner, and interstitial | `audience_network_classic` | Not supported |
| Audience Network rewarded videos | `audience_network_rewarded_video` | Not supported |
| Audience Network in-stream videos | Not supported | Not supported |

**Example**

```
{
  "position_type": {
    "facebook_feed": 0.9,
    "messenger_messenger_home": 0.7,
    "instagram_stream": 0.8,
    "audience_network_classic": 0.5,
    "default": 0.4
  }
}
```

**Value rule set (not equivalent to bid multipliers example due to unsupported parameter values)**

```json
{
  "name": "Example",
  "rules": [
    {
      "name": "Rule 1",
      "adjust_sign": "DECREASE",
      "adjust_value": 50,
      "criterias": [
        {
          "criteria_type": "PLACEMENT",
          "operator": "CONTAINS",
          "criteria_values": [
            "FB_FEED"
          ],
          "criteria_value_types": [
            "NONE"
          ]
        }
      ]
    },
    {
      "name": "Rule 2",
      "adjust_sign": "DECREASE",
      "adjust_value": 30,
      "criterias": [
        {
          "criteria_type": "PLACEMENT",
          "operator": "CONTAINS",
          "criteria_values": [
            "FB_VIDEO"
          ],
          "criteria_value_types": [
            "NONE"
          ]
        }
      ]
    }
  ]
}
```

### `publisher_platform` {#publisher_platform}

Possible parameter values:

| Description | Bid multiplier parameter value | Value rule criteria value |
| --- | --- | --- |
| Facebook | `facebook` | `[FB_FEED, FB_STORIES, FB_REELS, FB_MARKETPLACE, FB_SEARCH, FB_VIDEO]` |
| Instagram | `instagram` | `[IG_FEED, IG_STORIES, IG_REELS, IG_EXPLORE]` |
| Audience Network | `audience_network` | `AUDIENCE_NETWORK` |
| Messenger | `messenger` | Not supported |

**Example**

```
{
  "publisher_platform": {
    "facebook": 0.7,
    "instagram": 0.9,
    "default": 1.0
  }
}
```

**Equivalent value rule set**

```json
{
  "name": "Example",
  "rules": [
    {
      "name": "Rule 1",
      "adjust_sign": "DECREASE",
      "adjust_value": 30,
      "criterias": [
        {
          "criteria_type": "PLACEMENT",
          "operator": "CONTAINS",
          "criteria_values": [
            "FB_FEED", "FB_STORIES", "FB_REELS", "FB_MARKETPLACE", "FB_SEARCH", "FB_VIDEO"
          ],
          "criteria_value_types": [
            "NONE", "NONE", "NONE", "NONE", "NONE", "NONE"
          ]
        }
      ]
    },
    {
      "name": "Rule 2",
      "adjust_sign": "DECREASE",
      "adjust_value": 10,
      "criterias": [
        {
          "criteria_type": "PLACEMENT",
          "operator": "CONTAINS",
          "criteria_values": [
            "IG_FEED", "IG_STORIES", "IG_REELS", "IG_EXPLORE"
          ],
          "criteria_value_types": [
            "NONE", "NONE", "NONE", "NONE"
          ]
        }
      ]
    }
  ]
}
```

### `travel_start_date` {#travel_start_date}

Possible parameter values include any date range in the format `yyyymmdd-yyyymmdd`.

**Example API call**

```bash
curl -X POST \
  -F 'bid_adjustments=
     {"user_groups":{"travel_start_date":{"event_sources":["123456789"],"20180901-20181001":0.2,"default":0.9}}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<AD_SET_ID>
```

### `travel_start_day_of_week` {#travel_start_day_of_week}

Possible parameter values include any integer between 0 and 6, inclusive. `0` is Monday; `6` is Sunday.

**Example API call**

```bash
curl -X POST \
  -F 'bid_adjustments=
  {"user_groups":{"travel_start_day_of_week":{"event_sources":["123456789"],"0":0.1,"2":0.2,"6":0.3,"default":0.9}}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/<API_VERSION>/<AD_SET_ID>
```

### `user_bucket` {#user_bucket}

You can send us results of your own user classifier. Then send us an extra `user_bucket` parameter in pixel fires or app events. User buckets are integers ranging from 0 to 100.

Specify the user bucket group definition with the following format:

* `event_sources` - Pixel fire or app event source to track.
* `event_retention` - Optional. Time, in seconds, to ignore old `user_bucket` values.
* `events_dedup_mode` - Optional. Flag to indicate which `user_bucket` value to use when a single event source sends different `user_bucket` values for the same user. The default value is `latest`.
* `event_source_preference` - Optional. Flag to indicate which `user_bucket` to use when multiple event sources send different `user_bucket` values for the same user. The default value is `latest`.

**Example**

```
{
  "user_bucket": {
    "event_sources": [<pixel_id>,<app_id>,...],
    "event_retention": 604800, // optional, exclude old events

    //optional, useful when multiple event sources have user_bucket
    "events_dedup_mode": "max"|"min"|"latest",

    //optional, dedup user_bucket values sent from one single event source
    "event_source_preference": "max"|"min"|"latest",

    "1": 0.7, // these are the bid multipliers
    "2": 1.0,
  }
}
```

### `user_device` {#user_device}

Possible parameter values:

* `iPad`
* `iPhone`

See other possible values at [Targeting Search API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search#country_group) with `type=adTargetingCategory` and `class=user_device`.

**Example**

```
{
  "user_device": {
    "iPad": 0.7,
    "iPhone": 0.9,
    "default": 1.0
  }
}
```

### `user_os` {#user_os}

Possible parameter values:

| Description | Bid multiplier parameter value | Value rule criteria value |
| --- | --- | --- |
| Android | `Android` | `ANDROID` |
| Windows | `Windows` | Not supported |
| Windows Phone | `Windows Phone` | Not supported |
| iOS | `iOS` | `IOS` |

See other possible values at [Targeting Search API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search#country_group) with `type=adTargetingCategory` and `class=user_os`.

**Example**

```
{
  "user_os": {
    "Android": 0.7,
    "iOS": 0.9,
    "default": 1.0
  }
}
```

**Equivalent value rule set**

```json
{
  "name": "Example",
  "rules": [
    {
      "name": "Rule 1",
      "adjust_sign": "DECREASE",
      "adjust_value": 30,
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
      "name": "Rule 2",
      "adjust_sign": "DECREASE",
      "adjust_value": 10,
      "criterias": [
        {
          "criteria_type": "OS_TYPE",
          "operator": "CONTAINS",
          "criteria_values": [
            "IOS"
          ],
          "criteria_value_types": [
            "NONE"
          ]
        }
      ]
    }
  ]
}
```

### `user_recency` {#user_recency}

Group users by time because they have any pixel fire or app events. You must specify which event sources to track and time windows.

**Example**

```
{
  "user_recency": {
    "event_sources": [<pixel_id>,<app_id>,...],
    "0-86400": 1.0,
    "86401-172800": 0.7,
    "default": 0.5
  }
}
```

This example shows how to apply bid multiplier `1.0` for users who have pixel fire or app events within `86400` seconds, and so on.
