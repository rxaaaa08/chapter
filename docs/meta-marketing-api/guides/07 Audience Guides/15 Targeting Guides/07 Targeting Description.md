<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-description | Saved: 2026-09-19 -->

# Targeting description



Get human-readable descriptions for a set of targeting specs. To read targeting descriptions for specific [`ads`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) make an `HTTP GET` to `https://graph.facebook.com/{AD_ID}/targetingsentencelines`.

## Targeting description for existing ads
To get `targetingsentencelines` connection of an existing ad:

```bash
curl -G \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_ID>/targetingsentencelines
```

The response:

```json
{
    "id": "<AD_ID>/targetingsentencelines",
    "targetingsentencelines": [
    {
        "content": "Location - Living In:",
        "children": [
            "Japan",
            "United States"
        ]
    },
    {
        "content": "Age:",
        "children": [
            "20 - 24"
        ]
    },
    {
        "content": "Gender:",
        "children": [
            "Male"
        ]
    }]
}
```

Responses contain these fields:

| Name | Description |
| --- | --- |
| `id`<br><br>type: string | ID of `targetingsentencelines`. |
| `targetingsentencelines`<br><br>type: array of JSON objects | Human-readable description of the targeting spec. Each object contains `content` or targeting type, and `children` or targeting spec. This field only takes [effective placements](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/placement-targeting#effective_placement) into consideration. |

## Targeting description for ad accounts

You can also get targeting descriptions for a targeting spec with an `HTTP GET` for an ads account at `https://graph.facebook.com/{AD_ACCOUNT_ID}/targetingsentencelines`.

For example, to get targeting descriptions for people who live in the US or Japan and are males between the age of 20-24:

```bash
curl -G \
  --data-urlencode 'targeting_spec={
    "age_max": 24,
    "age_min": 20,
    "genders": [1],
    "geo_locations": {"countries":["US","JP"]}
  }' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/targetingsentencelines
```

Response:

```json
{
    "params": {
        "genders": [1],
        "age_min": 20,
        "age_max": 24,
        "geo_locations": {
            "countries": [
                "US",
                "JP"
            ]
        }
    },
    "targetingsentencelines": [{
        "content": "Location - Living In:",
        "children": [
            "Japan",
            "United States"
        ]
    }, {
        "content": "Age:",
        "children": [
            "20 - 24"
        ]
    }, {
        "content": "Gender:",
        "children": [
            "Male"
        ]
    }]
}
```

Additional parameters include:

| Name | Description |
| --- | --- |
| `targeting_spec`<br><br>type: JSON object | **Required.**<br><br>Get the targeting description for this targeting spec. |
| `hide_targeting_spec_from_return`<br><br>type: bool | **Optional.**<br><br>Whether response has requested `targeting_spec` included. Default `false`. |

Responses have these fields:

| Name | Description |
| --- | --- |
| `targetingsentencelines`<br><br>type: array of JSON objects | The human-readable description of targeting spec. Each object has `content` or targeting type and `children` or targeting spec. |
| `params`<br><br>type: JSON object | The targeting spec you provided. |

