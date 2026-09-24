<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-campaign | Saved: 2026-09-19 -->

# Create an ad campaign



The first step in launching an ad campaign is to create the campaign itself using the API.

To create an ad campaign, send a `POST` request to the `/act_<AD_ACCOUNT_ID>/campaigns` endpoint with key parameters including the campaign's `name`, `objective`, and `status`.

**Example API Request:**

```curl
curl -X POST \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns \
  -F 'name=My Campaign' \
  -F 'objective=LINK_CLICKS' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>'
```

## Required parameters

| Name | Description |
| --- | --- |
| `name` | The name of the campaign. |
| `objective` | The goal of the campaign, for example, `LINK_CLICKS`. |
| `status` | The initial status of the campaign. Set `status` to `PAUSED` to keep the campaign inactive until you finish setup. |

## Learn more

* [Ad Account Ad Campaigns Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/campaigns)
* [Ad Campaign Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group)
