<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/subscriptions | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Subscriptions

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

The **subscriptions endpoint** lets your app subscribe to ad account events and receive them through the `subscriptions` webhook. Instead of one webhook per metric, you create subscriptions that describe exactly what you care about — a new object, a metadata change, or a metric crossing a threshold you define — and Meta pushes a notification when it happens.

Each subscription is scoped to one ad account and to the app that creates it. Notifications are delivered to your app’s configured webhook callback, so [set up ads webhooks](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/setup/get-started) first.

## Permissions

* **Reads** (list, get) require `ads_read` or `ads_management`.
* **Writes** (create, update, delete) require `ads_management` and write access to the ad account.

## Subscribe your app to the webhook

Before you use the ad account subscriptions endpoint, subscribe your app to the `subscriptions` field for the `ad_account` object. This app subscription is required for notifications to be delivered and must be created first.

Call the app’s `subscriptions` edge with an app access token:

```
curl -X POST "https://graph.facebook.com/<VERSION>/<APP_ID>/subscriptions" \
  -F "object=ad_account" \
  -F "callback_url=<YOUR_HTTPS_CALLBACK_URL>" \
  -F "fields=subscriptions" \
  -F "verify_token=<VERIFY_TOKEN>" \
  -F "access_token=<APP_ACCESS_TOKEN>"

```

Meta sends a verification request to the callback URL. The callback must return the challenge value before the app subscription is created. After the app subscription succeeds, you can create subscriptions for an ad account with `POST /act_<AD_ACCOUNT_ID>/subscriptions`.

## Endpoints

The subscriptions endpoint is served from the Graph API host, `graph.facebook.com`, and is scoped to an ad account (`act_<AD_ACCOUNT_ID>`). Every request is versioned, for example `v25.0`.

```
https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/subscriptions

```

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/act_<AD_ACCOUNT_ID>/subscriptions` | Create a subscription |
| `GET` | `/act_<AD_ACCOUNT_ID>/subscriptions` | List subscriptions |
| `GET` | `/act_<AD_ACCOUNT_ID>/subscriptions/<SUBSCRIPTION_ID>` | Get one subscription |
| `PATCH` | `/act_<AD_ACCOUNT_ID>/subscriptions/<SUBSCRIPTION_ID>` | Enable or disable a subscription |
| `DELETE` | `/act_<AD_ACCOUNT_ID>/subscriptions/<SUBSCRIPTION_ID>` | Delete a subscription |

## Create a subscription

`POST /act_<AD_ACCOUNT_ID>/subscriptions`

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `event_type` | enum | Yes | What the subscription listens for. See [Event types](#event-types). |
| `filters` | array | Yes | Which objects the subscription applies to. Each item is a `{field, value, operator}` condition. Up to 20. Use `entity_type` to scope to `CAMPAIGN`, `ADSET`, or `AD`. |
| `field` | string | No | The metric or attribute the condition watches (for example `spent` or `daily_budget`). |
| `value` | string | No | The value the condition compares against. Budgets, spend, and bid amounts are in the account currency’s minor unit (for example cents). |
| `operator` | string | No | How `value` is compared. See [Event types](#event-types) for the operators each event allows. |
| `status` | string | No | `ENABLED` (default) or `DISABLED`. |

A successful create returns the new subscription ID:

```
{ "subscription_id": "<SUBSCRIPTION_ID>" }
```

## Event types

The `event_type` determines which condition fields and operators are valid.

| `event_type` | Fires when | Condition | Operators |
| --- | --- | --- | --- |
| `OBJECT_CREATED` | A new campaign, ad set, or ad is created. | No `field` condition — filter by `entity_type` only. | — |
| `OBJECT_UPDATED` | A metadata field on an object changes. | `field` required. Omit `value`/`operator` to fire on any change to that field. | Varies by field |
| `INSIGHTS_UPDATED` | A metric crosses the threshold you set. | `field`, `value`, and `operator` required. | `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `INSIGHTS_MILESTONE_REACHED` | A metric reaches a milestone value. | `field`, `value`, and `operator` required. | `EQUAL` |

### Metadata fields (`OBJECT_UPDATED`)

Set `field` to one of the metadata fields below. The object level(s) each field applies to and the operators it accepts are listed alongside it. Omit `value` and `operator` to fire on any change to the field.

| Field | Object level(s) | Supported operators |
| --- | --- | --- |
| `name` | Ad, Ad set, Campaign | `EQUAL`, `CONTAIN`, `NOT_CONTAIN` |
| `objective` | Campaign | `IN`, `NOT_IN` |
| `optimization_goal` | Ad set | `IN`, `NOT_IN` |
| `buying_type` | Campaign | `IN`, `NOT_IN` |
| `billing_event` | Ad set | `IN`, `NOT_IN` |
| `is_autobid` | Ad set | `IN`, `NOT_IN` |
| `daily_budget` | Ad set | `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `lifetime_budget` | Ad set | `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `spend_cap` | Campaign | `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `bid_amount` | Ad, Ad set | `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `adlabel_ids` | Ad, Ad set, Campaign | `ANY`, `ALL`, `NONE` |
| `start_time` | Ad set, Campaign | `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `stop_time` | Ad set, Campaign | `GREATER_THAN`, `LESS_THAN` |
| `created_time` | Ad, Ad set, Campaign | `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |
| `updated_time` | Ad, Ad set, Campaign | `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, `NOT_IN_RANGE` |

Budgets, spend cap, and bid amounts are in the account currency’s minor unit (for example, cents). `start_time`, `stop_time`, `created_time`, and `updated_time` are epoch seconds.

### Metric fields (`INSIGHTS_UPDATED`)

Set `field` to one of the metric fields below and provide a `value` and `operator`. All metric fields accept the operators `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, and `NOT_IN_RANGE`. Cost, spend, and cost-per metrics are in the account currency’s minor unit (for example, cents).

| Category | Field |
| --- | --- |
| Delivery and performance | `clicks` |
| Delivery and performance | `cost_per` |
| Delivery and performance | `cpa` |
| Delivery and performance | `cpc` |
| Delivery and performance | `cpm` |
| Delivery and performance | `cpp` |
| Delivery and performance | `ctr` |
| Delivery and performance | `frequency` |
| Delivery and performance | `impressions` |
| Delivery and performance | `lifetime_impressions` |
| Delivery and performance | `lifetime_spent` |
| Delivery and performance | `link_ctr` |
| Delivery and performance | `mobile_app_purchase_roas` |
| Delivery and performance | `reach` |
| Delivery and performance | `results` |
| Delivery and performance | `result_rate` |
| Delivery and performance | `spent` |
| Delivery and performance | `today_spent` |
| Delivery and performance | `website_purchase_roas` |
| Delivery and performance | `yesterday_spent` |
| Engagement | `leadgen` |
| Engagement | `like` |
| Engagement | `link_click` |
| Engagement | `offsite_engagement` |
| Engagement | `post` |
| Engagement | `post_comment` |
| Engagement | `post_engagement` |
| Engagement | `post_like` |
| Engagement | `post_reaction` |
| Engagement | `view_content` |
| Engagement | `video_play` |
| Engagement | `video_view` |
| Engagement | `vote` |
| Cost per result | `cost_per_unique_click` |
| Cost per result | `cost_per_link_click` |
| Cost per result | `cost_per_post_engagement` |
| Cost per result | `cost_per_video_view` |
| Cost per result | `cost_per_messaging_first_reply` |
| Cost per result | `cost_per_messaging_reply` |
| App event cost | `cost_per_mobile_app_install` |
| App event cost | `cost_per_mobile_achievement_unlocked` |
| App event cost | `cost_per_mobile_activate_app` |
| App event cost | `cost_per_mobile_add_payment_info` |
| App event cost | `cost_per_mobile_add_to_cart` |
| App event cost | `cost_per_mobile_add_to_wishlist` |
| App event cost | `cost_per_mobile_complete_registration` |
| App event cost | `cost_per_mobile_content_view` |
| App event cost | `cost_per_mobile_initiated_checkout` |
| App event cost | `cost_per_mobile_level_achieved` |
| App event cost | `cost_per_mobile_purchase` |
| App event cost | `cost_per_mobile_rate` |
| App event cost | `cost_per_mobile_search` |
| App event cost | `cost_per_mobile_spent_credits` |
| App event cost | `cost_per_mobile_tutorial_completion` |
| Offline conversion cost | `cost_per_offline_conversion` |
| Offline conversion cost | `cost_per_offline_add_payment_info` |
| Offline conversion cost | `cost_per_offline_add_to_cart` |
| Offline conversion cost | `cost_per_offline_add_to_wishlist` |
| Offline conversion cost | `cost_per_offline_complete_registration` |
| Offline conversion cost | `cost_per_offline_initiate_checkout` |
| Offline conversion cost | `cost_per_offline_lead` |
| Offline conversion cost | `cost_per_offline_other` |
| Offline conversion cost | `cost_per_offline_purchase` |
| Offline conversion cost | `cost_per_offline_search` |
| Offline conversion cost | `cost_per_offline_view_content` |
| Pixel conversion cost | `cost_per_initiate_checkout_fb` |
| Pixel conversion cost | `cost_per_purchase_fb` |
| Pixel conversion cost | `cost_per_add_to_cart_fb` |
| Pixel conversion cost | `cost_per_lead_fb` |
| Pixel conversion cost | `cost_per_add_payment_info_fb` |
| Pixel conversion cost | `cost_per_complete_registration_fb` |
| Pixel conversion cost | `cost_per_add_to_wishlist_fb` |
| Pixel conversion cost | `cost_per_search_fb` |
| Pixel conversion cost | `cost_per_view_content_fb` |
| App event | `mobile_app_install` |
| App event | `app_custom_event` |
| App event | `app_custom_event.fb_mobile_achievement_unlocked` |
| App event | `app_custom_event.fb_mobile_activate_app` |
| App event | `app_custom_event.fb_mobile_add_payment_info` |
| App event | `app_custom_event.fb_mobile_add_to_cart` |
| App event | `app_custom_event.fb_mobile_add_to_wishlist` |
| App event | `app_custom_event.fb_mobile_complete_registration` |
| App event | `app_custom_event.fb_mobile_content_view` |
| App event | `app_custom_event.fb_mobile_initiated_checkout` |
| App event | `app_custom_event.fb_mobile_level_achieved` |
| App event | `app_custom_event.fb_mobile_purchase` |
| App event | `app_custom_event.fb_mobile_rate` |
| App event | `app_custom_event.fb_mobile_search` |
| App event | `app_custom_event.fb_mobile_spent_credits` |
| App event | `app_custom_event.fb_mobile_tutorial_completion` |
| App event | `app_custom_event.other` |
| Offline conversion | `offline_conversion` |
| Offline conversion | `offline_conversion.add_payment_info` |
| Offline conversion | `offline_conversion.add_to_cart` |
| Offline conversion | `offline_conversion.add_to_wishlist` |
| Offline conversion | `offline_conversion.complete_registration` |
| Offline conversion | `offline_conversion.initiate_checkout` |
| Offline conversion | `offline_conversion.lead` |
| Offline conversion | `offline_conversion.other` |
| Offline conversion | `offline_conversion.purchase` |
| Offline conversion | `offline_conversion.search` |
| Offline conversion | `offline_conversion.view_content` |
| Pixel conversion | `offsite_conversion` |
| Pixel conversion | `offsite_conversion.fb_pixel_add_payment_info` |
| Pixel conversion | `offsite_conversion.fb_pixel_add_to_cart` |
| Pixel conversion | `offsite_conversion.fb_pixel_add_to_wishlist` |
| Pixel conversion | `offsite_conversion.fb_pixel_complete_registration` |
| Pixel conversion | `offsite_conversion.fb_pixel_initiate_checkout` |
| Pixel conversion | `offsite_conversion.fb_pixel_lead` |
| Pixel conversion | `offsite_conversion.fb_pixel_other` |
| Pixel conversion | `offsite_conversion.fb_pixel_purchase` |
| Pixel conversion | `offsite_conversion.fb_pixel_search` |
| Pixel conversion | `offsite_conversion.fb_pixel_view_content` |
| Onsite conversion | `onsite_conversion` |
| Onsite conversion | `onsite_conversion.messaging_first_reply` |
| Onsite conversion | `onsite_conversion.messaging_reply` |

### Milestone fields (`INSIGHTS_MILESTONE_REACHED`)

Set `field` to one of the fields below, with `operator` set to `EQUAL`. The subscription fires each time the field reaches a multiple of `value`, so `value` must be at least the minimum listed below. Milestone counts are measured over the object’s lifetime.

| Field | Minimum value |
| --- | --- |
| `impressions` | 1000 |
| `unique_impressions` | 1000 |
| `reach` | 1000 |
| `clicks` | 10 |
| `unique_clicks` | 10 |
| `spent` | 1000 (that is, $10.00) |
| `results` | 5 |
| App-event counts — `app_custom_event`, its `app_custom_event_fb_mobile_*` variants (for example `app_custom_event_fb_mobile_purchase`), `app_custom_event_other`, and `mobile_app_install` | 1 |
| Conversion counts — `offsite_conversion`, its `offsite_conversion_fb_pixel_*` variants (for example `offsite_conversion_fb_pixel_purchase`), `offsite_conversion_add_to_cart`, and `offsite_conversion_checkout` | 1 |
| Engagement counts — `link_click`, `like`, `leadgen`, `offsite_engagement`, `post`, `post_comment`, `post_engagement`, `post_like`, `post_reaction`, `view_content`, `video_play`, `video_view`, and `vote` | 1 |

>

Scheduling-only inputs — such as `time_preset`, `attribution_window`, budget-pacing ratios, advanced or formula filters, and recommendation-readiness flags — are not supported by subscriptions.

## Examples

**New sales campaigns.** Notify me when a campaign is created for the sales objective:

```
curl -X POST "https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/subscriptions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
        "event_type": "OBJECT_CREATED",
        "filters": [
          { "field": "entity_type", "value": "CAMPAIGN", "operator": "EQUAL" },
          { "field": "objective", "value": "OUTCOME_SALES", "operator": "EQUAL" }
        ]
      }'

```

A matching webhook notification has this payload:

```
{
  "object": "ad_account",
  "entry": [
    {
      "id": "1234567890",
      "time": 1782862117,
      "changes": [
        {
          "field": "subscriptions",
          "value": {
            "subscription_id": 1111111111,
            "account_id": 1234567890,
            "object_id": 2222222222,
            "object_type": "campaign"
          }
        }
      ]
    }
  ]
}
```

**Budget raised.** Notify me when an ad set’s daily budget goes above $10.00 (1000 cents):

```
curl -X POST "https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/subscriptions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
        "event_type": "OBJECT_UPDATED",
        "field": "daily_budget",
        "value": "1000",
        "operator": "GREATER_THAN",
        "filters": [
          { "field": "entity_type", "value": "ADSET", "operator": "EQUAL" }
        ]
      }'

```

A matching webhook notification has this payload:

```
{
  "object": "ad_account",
  "entry": [
    {
      "id": "1234567890",
      "time": 1782862117,
      "changes": [
        {
          "field": "subscriptions",
          "value": {
            "subscription_id": 3333333333,
            "account_id": 1234567890,
            "object_id": 4444444444,
            "object_type": "adset",
            "field": "daily_budget",
            "current_value": "1500"
          }
        }
      ]
    }
  ]
}
```

**Spend milestone.** Notify me when an ad reaches $100.00 (10000 cents) of spend:

```
curl -X POST "https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/subscriptions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
        "event_type": "INSIGHTS_MILESTONE_REACHED",
        "field": "spent",
        "value": "10000",
        "operator": "EQUAL",
        "filters": [
          { "field": "entity_type", "value": "AD", "operator": "EQUAL" }
        ]
      }'

```

A matching webhook notification has this payload:

```
{
  "object": "ad_account",
  "entry": [
    {
      "id": "1234567890",
      "time": 1782862117,
      "changes": [
        {
          "field": "subscriptions",
          "value": {
            "subscription_id": 5555555555,
            "account_id": 1234567890,
            "object_id": 6666666666,
            "object_type": "ad",
            "field": "spent",
            "current_value": "10000"
          }
        }
      ]
    }
  ]
}
```

**Rising cost.** Notify me when an ad’s CPC goes above $2.00 (200 cents):

```
curl -X POST "https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/subscriptions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
        "event_type": "INSIGHTS_UPDATED",
        "field": "cpc",
        "value": "200",
        "operator": "GREATER_THAN",
        "filters": [
          { "field": "entity_type", "value": "AD", "operator": "EQUAL" }
        ]
      }'

```

A matching webhook notification has this payload:

```
{
  "object": "ad_account",
  "entry": [
    {
      "id": "1234567890",
      "time": 1782862117,
      "changes": [
        {
          "field": "subscriptions",
          "value": {
            "subscription_id": 7777777777,
            "account_id": 1234567890,
            "object_id": 8888888888,
            "object_type": "ad",
            "field": "cpc",
            "current_value": "250"
          }
        }
      ]
    }
  ]
}
```

## Manage subscriptions

**List** (paginated) or **get one:**

```
curl "https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/subscriptions" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

curl "https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/subscriptions/<SUBSCRIPTION_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

```

Each subscription is returned as:

```
{
  "subscription_id": "<SUBSCRIPTION_ID>",
  "event_type": "INSIGHTS_UPDATED",
  "field": "cpc",
  "value": "200",
  "operator": "GREATER_THAN",
  "filters": [
    { "field": "entity_type", "value": "AD", "operator": "EQUAL" }
  ],
  "status": "ENABLED"
}
```

**Enable or disable** without recreating:

```
curl -X PATCH "https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/subscriptions/<SUBSCRIPTION_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "DISABLED" }'

```

**Delete:**

```
curl -X DELETE "https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/subscriptions/<SUBSCRIPTION_ID>" \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

```

A successful delete returns `{ "success": true }`.

## Receiving notifications

When a subscription fires, Meta sends the standard [payload envelope](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ads-webhooks-overview#payload-envelope) to your callback URL with a `field` of `subscriptions` (the `ad_account:subscriptions` topic-field pair). The notification tells you which object changed; poll the object or its insights to read the current details, then act.

## Related webhooks

* [Get started](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/setup/get-started)
* [Ads webhooks overview](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ads-webhooks-overview)
