<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/flexible-targeting | Saved: 2026-09-19 -->

# Flexible targeting



Combine different targeting options to reach a specific set of users in the `flexible_spec` with `AND` and `OR` statements. Facebook evaluates targeting in `flexible_spec` via `AND` with all segments outside the spec such as age, gender, geographic locations. Facebook also evaluates each top-level array element in `flexible_spec` with `AND`. Facebook evaluates second-level array elements with `OR`.

Targeting segments, such as behaviors specified inside `flexible_spec`, are not available for use outside of `flexible_spec`.

## Fields

| Field | Description |
| --- | --- |
| `flexible_spec`<br><br>type: JSON Object | Array of arrays. Each contains a targeting segment in appropriate format, such as interests, behaviors, and demographics. The top-level array has a limit of 25, and the secondary-level array has a limit of 1,000. |

Use these fields in flexible targeting:

* `custom_audiences`
* `interests`
* `behaviors`
* `college_years`
* `education_majors`
* `education_schools`
* `education_statuses`
* `family_statuses`
* `income`
* `industries`
* `life_events`
* `user_adclusters`
* `work_positions`
* `work_employers`

**Note:** When using `custom_audiences` in `flexible_spec`, Advantage Custom Audience may be enabled by default. See [Advantage Custom Audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-expansion/advantage-custom-audience) for details on opting out.

## Examples

### Flexible targeting
To target people who live in the U.S., aged between 18-43, who **have not** recently moved **and** are travelers or like soccer or movies **and** are newlyweds or like music:

```
curl \
  -F 'name=My AdSet' \
  -F 'optimization_goal=REACH' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'bid_amount=150' \
  -F 'daily_budget=2000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "age_max": 43,
    "age_min": 18,
    "flexible_spec": [
      {
        "behaviors": [{"id":6002714895372,"name":"Frequent Travelers"}],
        "interests": [
          {"id":6003107902433,"name":"Association football (Soccer)"},
          {"id":6003139266461,"name":"Movies"}
        ]
      },
      {
        "interests": [{"id":6003020834693,"name":"Music"}],
        "life_events": [{"id":6002714398172,"name":"Newlywed (1 year)"}]
      }
    ],
    "geo_locations": {"countries":["US"]}
  }' \
  -F 'status=ACTIVE' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v2.11/act_<AD_ACCOUNT_ID>/adsets
```

With this flexible spec, the resulting audience is:

(segment 1 `or` segment 2 `or` segment 3) **and** (segment 4 `or` segment 5) **and** segment 6

```
flexible_spec=
[
  {
    'segment_type':[segment1, segment2],
    'segment_type':[segment3]
  },
  {
    'segment_type':[segment4, segment5]
  },
  {
    'segment_type':[segment6]
  }
]
```
