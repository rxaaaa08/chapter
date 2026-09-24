<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-set | Saved: 2026-09-19 -->

# Create an ad set



After creating your ad campaign, the next step is to create an ad set to add to your campaign. The ad set contains the bidding, targeting, and budget information for your campaign.

To create an ad set within your campaign, send a `POST` request to the `/act_<AD_ACCOUNT_ID>/adsets` endpoint. Specify the `name` of the ad set, the associated `campaign_id`, `targeting` specifications, and `daily_budget` details.

**Example API request:**

```curl
curl -X POST \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets \
  -F 'name=My Ad Set' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'daily_budget=1000' \
  -F 'targeting={"geo_locations":{"countries":["US"]}}' \
  -F 'access_token=<ACCESS_TOKEN>'
```

## Required parameters

| Name | Description |
| --- | --- |
| `name` | The name of the ad set. |
| `campaign_id` | The ID of the campaign to which the ad set belongs. |
| `daily_budget` | The daily budget specified in cents. |
| `targeting` | The target audience based on geographic locations. |

## Learn more

* [Ad Account Ad Sets Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adsets)
* [Ad Set Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign)
