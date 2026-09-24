<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/passback-api | Saved: 2026-09-19 -->

# Passback API



The Brand Safety and Suitability Passback API is a system that allows Meta Business Partners (MBPs) to share content
risk labels and campaign performance data with Meta.

The goal of this system is to provide advertisers and third parties with a mechanism to give feedback on content,
for Meta to be able to take action on that feedback, and allow for Meta and partners to compare content labels.

## Permissions

This API requires the capability grant `brand_safety_feed_verification` to the app.

## Submit content risk labels

### Description

Submit content risk labels for review and action.

### Parameters

| Parameter | Type | Required? | Description |
| --- | --- | --- | --- |
| `content` | list < Content > | Yes | List of one or more Content objects. The max size per request is 10,000. |

#### Content Structure

| Field | Type | Required? | Description |
| --- | --- | --- | --- |
| `content_id` | string | Yes | ID of the content (video post, etc.). |
| `content_language` | enum | No | Language of the content (ISO 639-1 format). |
| `content_owner_id` | string | Yes | ID of the content owner (user, page, etc.). |
| `labels` | list < Label > | Yes | List of one or more Label objects. The max size per request is 50. |
| `platform` | enum (facebook, instagram, threads) | Yes | The platform that the content is delivered to. |
| `position` | enum (feed, reels, instream, reels_overlay) | Yes | The position that the content is delivered to. |

#### Label Structure

| Field | Type | Required? | Description |
| --- | --- | --- | --- |
| `category` | enum {none, adult_content, crime, death_injury, drugs, hate_speech, misinformation,<br>online_piracy, profanity, social_issue, spam, terrorism, weapons} | Yes | The GARM category for the label. If the label doesn't have a category, use<br>"none". |
| `label_time` | timestamp | No | The timestamp when the content was labeled in epoch seconds in UTC. |
| `label_type` | enum {human, machine} | No | Type of label based on review tier. |
| `risk_level` | enum {floor, high, low, medium, no} | Yes | The GARM risk level for the label for the given category. |

### Response fields

| Field | Type | Required? | Description |
| --- | --- | --- | --- |
| `success` | boolean | Yes | A boolean to indicate success or failure. |
| `failed_content_ids` | list < string > | No | A list of content ids that we could not accept. |

### Example Request

```curl
POST /content_risk_labels
{
    "content": [
        {
            "content_id": "<CONTENT_ID>",
            "content_owner_id": "<CONTENT_OWNER_ID>",
            "content_language": "en",
            "platform": "facebook",
            "position": "feed",
            "labels": [
                {
                    "category": "crime",
                    "risk_level": "floor",
                    "label_time": 1698879497,
                    "label_type": "human"
                },
                {
                    "category": "drugs",
                    "risk_level": "high",
                    "label_time": 1698879788,
                    "label_type": "machine"
                },
                ...
            ]
        },
        ...
    ]
}
```

### Example Response

```json
{
  "success": true
}
```

## Submit content risk labels for an ad set

### Description

Submit content risk labels for an ad set for auditing and analysis.

### Parameters

Refer to the [parameters](#parameters) for submitting content risk labels.

### Response fields

Refer to the [response fields](#response-fields) for submitting content risk labels.

### Example Request

```curl
POST /{ad_set_id}/content_risk_labels
{
    "content": [
        {
            "content_id": "<CONTENT_ID>",
            "content_owner_id": "<CONTENT_OWNER_ID>",
            "content_language": "en",
            "platform": "facebook",
            "position": "feed",
            "labels": [
                {
                    "category": "crime",
                    "risk_level": "floor",
                    "label_time": 1698879497,
                    "label_type": "human"
                },
                {
                    "category": "drugs",
                    "risk_level": "high",
                    "label_time": 1698879788,
                    "label_type": "machine"
                },
                ...
            ]
        },
        ...
    ]
}
```

### Example Response

```json
{
  "success": true
}
```

## Submit suitability scores

### Description

Submit global brand safety/suitability scores for auditing and analysis.

### Parameters

| Parameter | Type | Required? | Description |
| --- | --- | --- | --- |
| `category` | enum {none, adult_content, crime, death_injury, drugs, hate_speech, misinformation,<br>online_piracy, profanity, social_issue, spam, terrorism, weapons} | No | The GARM category for the score. Only applicable if the score applies to a single category. |
| `client_suitability_score` | float | No | The number of ad impressions adjacent to brand suitable content (based on the advertiser's<br>customized suitability profile) divided by the total ad impressions, as measured in accordance with the<br>[GARM](https://wfanet.org/leadership/garm/about-garm) Brand Suitability Framework (industry standard<br>criteria). |
| `no_risk_suitability_score` | float | Yes | The number of ad impressions adjacent to brand suitable content (risk: no) divided by the total<br>ad impressions, as measured in accordance with the [GARM](https://wfanet.org/leadership/garm/about-garm) Brand<br>Suitability Framework (industry standard criteria). |
| `platform` | enum {facebook, instagram, threads, overall} | Yes | The platform that the content is delivered to. |
| `position` | enum {feed, reels, overall, instream, reels_overlay} | Yes | The position that the content is delivered to. |
| `profile_settings` | map < enum {adult_content, crime, death_injury, drugs, hate_speech, misinformation,<br>online_piracy, profanity, social_issue, spam, terrorism, weapons}, enum {floor, high, low, medium, no}<br>> | No | The advertiser's brand suitability profile specifying their highest acceptable risk level by<br>category. |
| `safety_score` | float | Yes | The number of ad impressions adjacent to brand safe content (risk: no, low, medium, high) divided<br>by the total ad impressions, as measured in accordance with the<br>[GARM](https://wfanet.org/leadership/garm/about-garm) Brand Safety Floor Framework (industry standard<br>criteria). |
| `unmeasurable_rate` | float | No | The percentage of ad impressions that cannot be accurately measured or categorized, out of the total number of impressions, as measured by the third-party measurement partner. |
| `updated_time` | timestamp | Yes | The timestamp when the score was updated in epoch seconds in UTC. |

### Response fields

| Field | Type | Required? | Description |
| --- | --- | --- | --- |
| `success` | boolean | Yes | A boolean to indicate success or failure. |

### Example Request

```curl
POST /suitability_scores
{
    "platform": "overall",
    "position": "overall",
    "updated_time": 1698880848,
    "safety_score": 100.00,
    "client_suitability_score": 98.34,
    "no_risk_suitability_score": 95.62,
    "unmeasurable_rate": 5.04,
    "profile_settings":
    {
        "crime": "low",
        "spam": "no",
        ...
    }
}
```

### Example Response

```json
{
  "success": true
}
```

## Submit suitability scores for an ad account

### Description

Submit brand safety/suitability scores for an ad account for auditing and analysis.

### Parameters

Refer to the [parameters](#parameters-3) for submitting scores.

### Response fields

Refer to the [response fields](#response-fields-3) for submitting scores.

### Example Request

```curl
POST /act_{ad_account_id}/suitability_scores
{
    "platform": "facebook",
    "position": "feed",
    "updated_time": 1698880848,
    "safety_score": 100.00,
    "client_suitability_score": 98.34,
    "no_risk_suitability_score": 95.62,
    "unmeasurable_rate": 5.04,
    "profile_settings":
    {
        "crime": "low",
        "spam": "no",
        ...
    }
}
```

### Example Response

```json
{
  "success": true
}
```

## Submit suitability scores for an ad set

### Description

Submit brand safety/suitability scores for an ad set for auditing and analysis.

### Parameters

Refer to the [parameters](#parameters-3) for submitting scores.

### Response fields

Refer to the [response fields](#response-fields-3) for submitting scores.

### Example Request

```curl
POST /{ad_set_id}/suitability_scores
{
    "platform": "facebook",
    "position": "feed",
    "updated_time": 1698880848,
    "safety_score": 100.00,
    "client_suitability_score": 98.34,
    "no_risk_suitability_score": 95.62,
    "unmeasurable_rate": 5.04,
    "profile_settings":
    {
        "crime": "low",
        "spam": "no",
        ...
    }
}
```

### Example Response

```json
{
  "success": true
}
```
