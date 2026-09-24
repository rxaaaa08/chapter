<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-expansion/advantage-audience | Saved: 2026-09-19 -->

# Advantage+ audience



Enable Advantage+ audience on your campaigns to expand the eligible audience pool the delivery system can search, subject to your non-negotiable constraints. Non-negotiable business constraints are NOT expanded, these include location constraints, minimum age, language, and custom audience exclusions.

* To opt in, set the `advantage_audience` parameter within `targeting_automation` to `1`.
* To opt out, set the `advantage_audience` parameter within `targeting_automation` to `0`.

**Warning:** Prior to v23.0, the `advantage_audience` parameter within `targeting_automation` was optional and wasn't explicitly required to be set in the targeting spec when creating a new ad set or updating an existing one.

Beginning with v23.0, the `advantage_audience` parameter within `targeting_automation` defaults to `1` or requires an explicit value of either `1` or `0`. This behavior applies only when creating a new ad set; updating an existing ad set will not exhibit this behavior on any version.

## Enable Advantage+ audience

When Advantage+ audience is enabled, you can set the `age_range` parameter within `targeting_spec`.

```json
"targeting": {
  "age_range": [25, 35],
  "geo_locations": {
    "countries": ["GB"]
  },
  "targeting_automation": {
    "advantage_audience": 1
  }
}
```

* When you omit `age_range`, the delivery system creates the age range from `age_min` and `age_max`.
* When Advantage+ audience is enabled, the delivery system resets `age_min` and `age_max` to default values.
* When Advantage+ audience is enabled, advertisers can pass `age_min` values ranging between 18 to 25 only.
* When Advantage+ audience is enabled, advertisers cannot set `age_max` values. `age_max` is fixed at 65.

### Example request

The following request enables Advantage+ audience on a new ad set by setting `advantage_audience` to `1` within `targeting_automation`.

```html
curl -X POST \
  -F 'name="advantage audience test"' \
  -F 'is_autobid="true"' \
  -F 'daily_budget="100"' \
  -F 'billing_event="IMPRESSIONS"' \
  -F 'campaign_id="<CAMPAIGN ID>"' \
  -F 'targeting={"age_max": 65, "age_min": 18, "age_range": [25,35], "geo_locations": {"countries": ["US", "GB"]},"targeting_automation": {"advantage_audience": 1 }}' \
  -F 'access_token="<ACCESS_TOKEN>"' \
https://facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

## Default opted-in cases

The `advantage_audience` parameter within `targeting_automation` defaults to `1` unless explicitly specified in the following scenarios:

* **Default Targeting Setup:** When passing default values for Age, Gender, Custom Audience Inclusion, and Detailed Targeting Inclusion, or omitting these fields.
* **Relaxed Targeting Setup:** When using a relaxed setup by applying individual relaxation settings for Age, Gender, Custom Audience Inclusion, and Detailed Targeting Inclusion.

### Examples

The following examples show targeting setups that opt in to Advantage+ audience by default without explicitly setting `advantage_audience`.

#### Default setup

The following targeting spec shows a default setup that passes default values for age and location and omits inclusion fields.

```json
{
   "targeting":{
      "geo_locations":{
         "countries":[
            "US"
         ]
      },
      "age_max":65,
      "age_min":18,
   }
}
```

#### Relaxed setup

The following targeting spec shows a relaxed setup that applies individual relaxation settings for custom audiences and lookalikes.

```json
{
   "targeting":{
      "age_max":65,
      "age_min":18,
      "custom_audiences":[
         {
            "id":"<CUSTOM_AUDIENCE_ID>"
         },
         {
            "id":"<LOOKALIKE_ID>"
         }
      ],
      "flexible_spec":[
         {
            "interests":[
               {
                  "id":"<INTEREST_ID>"
               }
            ]
         }
      ],
      "geo_locations":{
         "countries":[
            "US"
         ],
         "location_types":[
            "home",
            "recent"
         ]
      },
      "targeting_relaxation_types":{
         "custom_audience":1,
         "lookalike":1
      },
      "targeting_optimization":"expansion_all"
   }
}
```

## Troubleshooting

The API returns an error when you create an ad set if your setup is not either default or relaxed, which means you have:

* Used non-default settings for any of Age, Gender, Custom Audience Inclusion, and Detailed Targeting Inclusion.
* Not used individual relaxation settings for these parameters.

### Example

The following targeting spec triggers this error because it uses a non-default, non-relaxed setup without explicitly setting `advantage_audience`.

```json
{
   "targeting":{
      "age_max":50,
      "age_min":30,
      "custom_audiences":[
         {
            "id":"<CUSTOM_AUDIENCE_ID>"
         }
      ],
      "geo_locations":{
         "countries":[
            "US"
         ],
         "location_types":[
            "home",
            "recent"
         ]
      }
   }
}
```

To resolve this, you must explicitly set the `advantage_audience` parameter within `targeting_automation` to either `1` or `0`.

## Learn more

* [Help Center: About Advantage+ audience](https://www.facebook.com/business/help/273363992030035)
