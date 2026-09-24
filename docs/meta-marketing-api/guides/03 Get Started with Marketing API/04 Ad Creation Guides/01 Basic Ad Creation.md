<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation | Saved: 2026-09-19 -->

# Basic Ad Creation



To create ads with the Marketing API, set up campaigns, ad sets, and ad creatives. This document covers each component with code samples.

## Ad creation endpoints

The Marketing API provides several endpoints to create and manage advertising campaigns. The primary creation endpoints include `campaigns`, `adsets`, and `ads`. This document describes these endpoints and what they do.

### The `campaigns` endpoint

Use the [`campaigns` endpoint](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/campaigns) to create and manage campaigns. Use this endpoint to set the overall objectives for your marketing efforts, such as brand awareness or conversions.

**Example API request:**

```bash
curl -X POST \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns \
  -F 'name=My Campaign' \
  -F 'objective=LINK_CLICKS' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>'
```

### The `adsets` endpoint

The [`adsets` endpoint](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adsets) organizes ads within campaigns based on specific targeting criteria and budget allocation. Ad sets allow for more granular control over audience targeting and spending.

**Example API request:**

```bash
curl -X POST \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets \
  -F 'name=My Ad Set' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'daily_budget=1000' \
  -F 'targeting={"geo_locations":{"countries":["US"]}}' \
  -F 'access_token=<ACCESS_TOKEN>'
```

### The `ads` endpoint

Use the [`ads` endpoint](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ads) to create advertisements, defining ad creatives and linking them to the appropriate ad set.

**Example API request:**

```bash
curl -X POST \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads \
  -F 'name=My Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'creative={"creative_id": "<CREATIVE_ID>"}' \
  -F 'status=ACTIVE' \
  -F 'access_token=<ACCESS_TOKEN>'
```
