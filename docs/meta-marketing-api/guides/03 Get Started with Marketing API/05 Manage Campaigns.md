<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/manage-campaigns | Saved: 2026-09-19 -->

# Ad Campaign Management



Managing ad campaigns through the Marketing API involves several key operations: modifying campaign settings; pausing, resuming, and deleting campaigns.

## Modify an ad campaign

To update an existing ad campaign, you can send a `POST` request to the `/<CAMPAIGN_ID>` endpoint. You can change various settings, including the campaign's objective, budget, and targeting attributes.

**Example API Request:**

```curl
curl -X POST \
  https://graph.facebook.com/v25.0/<CAMPAIGN_ID> \
  -F 'objective=CONVERSIONS' \
  -F 'daily_budget=2000' \
  -F 'status=ACTIVE' \
  -F 'access_token=<ACCESS_TOKEN>'
```

## Pause an ad campaign

Temporarily stopping a campaign can help you reassess your strategy without deleting the campaign entirely. To pause a campaign, update its status to `PAUSED`.

**Example API Request:**

```curl
curl -X POST \
  https://graph.facebook.com/v25.0/<CAMPAIGN_ID> \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>'
```

To resume the campaign, you can set the status back to `ACTIVE`.

## Archive an ad campaign

If you want to temporarily stop a campaign without deleting it, you can archive it instead. To archive a campaign, send a `POST` request to the `/<CAMPAIGN_ID>` endpoint with the status parameter set to `ARCHIVED`.

**Example API Request**

```curl
curl -X POST \
  https://graph.facebook.com/v25.0/<CAMPAIGN_ID> \
  -F 'status=ARCHIVED' \
  -F 'access_token=<ACCESS_TOKEN>'
```

Note that archiving a campaign will stop it from running. You can restore it by setting the status back to `ACTIVE`.

## Delete an ad campaign

When you need to permanently remove a campaign, send a `DELETE` request to the `/<CAMPAIGN_ID>` endpoint.

**Warning:** Be cautious when deleting campaigns, as this action cannot be undone. Always double-check the campaign ID before deletion to avoid accidental loss of data.

**Example API Request**

```curl
curl -X DELETE \
  https://graph.facebook.com/v25.0/<CAMPAIGN_ID> \
  -F 'access_token=<ACCESS_TOKEN>'
```

## Learn more

* [Campaign Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group)
* [Manage Your Ad Object's Status](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices/manage-your-ad-object-status)
* [Troubleshooting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/troubleshooting)
