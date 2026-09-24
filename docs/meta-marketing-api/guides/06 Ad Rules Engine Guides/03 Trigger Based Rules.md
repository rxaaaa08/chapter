<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/trigger-based-rules | Saved: 2026-09-19 -->

# Trigger based ad rules



Monitor the state of your ads in real time. A Trigger Based Rule is evaluated as soon as its pertinent ad objects' metadata or insights data are changed. The latency for metadata changes is usually a few seconds, and the latency for insights changes is usually within a few minutes (current p99 is about 7.5 minutes).

For Trigger Based Rules, `schedule_spec` is not supported, since they are always checked in real time.

**Note:** Trigger Based Rules are only available in API at this point, they are not accessible through Ads Manager.

## Trigger object

The `trigger` object defines how a rule is evaluated. All trigger types require a trigger `field`, except `METADATA_CREATION`. A Trigger Based Rule only checks its condition when this field is changed.

A Trigger Based Rule can only have one `trigger`. If you have conditions or restraints on multiple metrics, you can add the remaining ones as `filters`.

The `filters` field is used the same way as it is in [Schedule Based Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/scheduled-based-rules). A Trigger Based Rule only passes its evaluation when the `trigger` and all the `filters` satisfy the conditions. So a trigger and a filter are interchangeable if the change of one field leads to the change of the other. For instance, if you want a rule to trigger when `cost_per_mobile_app_install` > `X` AND `spent` > `Y`, you can use either `cost_per_mobile_app_install` or `spent` as the trigger, and the other as one of the filters, because those two fields are dependent.

The `trigger` object belongs under [`evaluation_spec`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/evaluation-spec), and follows the following structure:

| Trigger Object Keys | Description |
| --- | --- |
| `type` | The type of Trigger Based Rule. Current supported options are:<br><br>`METADATA_CREATION`: Triggers when an ad object is created<br><br>`METADATA_UPDATE`: Triggers when the metadata `field` is updated<br><br>`STATS_CHANGE`: Triggers when the insights `field` changes to satisfy the comparison<br><br>`STATS_MILESTONE`: Triggers when the insights `field` reaches a multiple of the `value` |
| `field` | The underlying field. Not in use for `METADATA_CREATION` |
| `value` | The underlying filter value. Not in use for `METADATA_CREATION`. Optional for `METADATA_UPDATE`. |
| `operator` | The underlying filter operator. Not in use for `METADATA_CREATION`. Optional for `METADATA_UPDATE`. |

You can create Ad Rules that are triggered in four different ways:

* Metadata related: `METADATA_CREATION` or `METADATA_UPDATE`
* Insights related: `STATS_MILESTONE` or `STATS_CHANGE`

## Metadata related trigger rules

### Metadata creation rule {#metadata-creation}

This rule is used to monitor when an ad object is created. Only `type` is required within the `trigger` spec. For the filters, specify the `entity_type` you wish to monitor.

Here is an example of a metadata creation rule to monitor the creation of all ads falling into a certain objective. Every time a new ad is created under an ad campaign of `APP_INSTALLS` objective, a ping is sent.

```
curl -i -X POST \
-F 'name=Metadata Creation Example 1' \
-F 'evaluation_spec={
      "evaluation_type" : "TRIGGER",
      "trigger" : {
        "type": "METADATA_CREATION",
      },
      "filters" : [
       {
         "field": "entity_type",
         "value": "AD",
         "operator": "EQUAL",
       },
       {
         "field": "campaign.objective",
         "value": ["APP_INSTALLS"],
         "operator": "IN",
       },
     ]
   }' \
-F 'execution_spec={
      "execution_type": "PING_ENDPOINT"
   }' \
-F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library"
```

### Metadata update rule {#metadata-update}

This rule is used to monitor when an ad object's metadata is changed. See [list](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/evaluation-spec#metadata-filters-supported-by-trigger-and-schedule-based-rules) of supported metadata fields. Within `trigger` spec, `field` is required, while `value` and `operator` are optional.

If you are interested in a field's change, no matter what its value is, you only need to specify the `field` option. Here is an example to send you a Facebook Notification whenever an ad set's daily budget is changed.

```
curl -i -X POST \
-F 'name=Metadata Update Example 1' \
-F 'evaluation_spec={
      "evaluation_type" : "TRIGGER",
      "trigger" : {
        "type": "METADATA_UPDATE",
        "field": "daily_budget",
      },
      "filters" : [
       {
         "field": "entity_type",
         "value": "ADSET",
         "operator": "EQUAL",
       },
     ]
   }' \
-F 'execution_spec={
      "execution_type": "NOTIFICATION"
   }' \
-F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library"
```

If you are only interested in a subset of the events, you can provide `operator` and `value` options to refine the `trigger` condition. Here is an example to be notified when an ad set's daily budget is changed and exceeds 1000:

```
curl -i -X POST \
-F 'name=Metadata Update Example 2' \
-F 'evaluation_spec={
      "evaluation_type" : "TRIGGER",
      "trigger" : {
        "type": "METADATA_UPDATE",
        "field": "daily_budget",
        "value": 1000,
        "operator": "GREATER_THAN"
      },
      "filters" : [
       {
         "field": "entity_type",
         "value": "ADSET",
         "operator": "EQUAL",
       },
     ]
   }' \
-F 'execution_spec={
      "execution_type": "PING_ENDPOINT"
   }' \
-F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library"
```

## Insights related trigger rules

### Stats milestone rule {#stats-milestone}

With `STATS_MILESTONE` as `type`, `evaluation_spec` triggers when `field` reaches a multiple of `value` for the objects matching the conditions in the `filters` array.

For this specific type of rule, the trigger `operator` must be `EQUAL`, and the `time_preset` filter must have a value of `LIFETIME`.

There is a more restrictive set of supported fields. Any field not listed below is not supported as a trigger `field`, but **can still be used as a filter** in the list of `filters`. In addition, there are required minimum values for the trigger's `value` depending on the `field`.

| Supported Trigger Field Values | Minimum Value |
| --- | --- |
| `impressions` | 1000 |
| `unique_impressions` | 1000 |
| `reach` | 1000 |
| `clicks` | 10 |
| `unique_clicks` | 10 |
| `spent` | 1000 (cents) |
| `results` | 5 |
| `app_custom_event` | 1 |
| `app_custom_event_fb_mobile_achievement_unlocked` | 1 |
| `app_custom_event_fb_mobile_activate_app` | 1 |
| `app_custom_event_fb_mobile_add_payment_info` | 1 |
| `app_custom_event_fb_mobile_add_to_cart` | 1 |
| `app_custom_event_fb_mobile_add_to_wishlist` | 1 |
| `app_custom_event_fb_mobile_complete_registration` | 1 |
| `app_custom_event_fb_mobile_content_view` | 1 |
| `app_custom_event_fb_mobile_initiated_checkout` | 1 |
| `app_custom_event_fb_mobile_level_achieved` | 1 |
| `app_custom_event_fb_mobile_purchase` | 1 |
| `app_custom_event_fb_mobile_rate` | 1 |
| `app_custom_event_fb_mobile_search` | 1 |
| `app_custom_event_fb_mobile_spent_credits` | 1 |
| `app_custom_event_fb_mobile_tutorial_completion` | 1 |
| `app_custom_event_other` | 1 |
| `leadgen` | 1 |
| `like` | 1 |
| `link_click` | 1 |
| `mobile_app_install` | 1 |
| `offsite_conversion` | 1 |
| `offsite_conversion_add_to_cart` | 1 |
| `offsite_conversion_checkout` | 1 |
| `offsite_conversion_fb_pixel_add_payment_info` | 1 |
| `offsite_conversion_fb_pixel_add_to_cart` | 1 |
| `offsite_conversion_fb_pixel_add_to_wishlist` | 1 |
| `offsite_conversion_fb_pixel_complete_registration` | 1 |
| `offsite_conversion_fb_pixel_initiate_checkout` | 1 |
| `offsite_conversion_fb_pixel_lead` | 1 |
| `offsite_conversion_fb_pixel_other` | 1 |
| `offsite_conversion_fb_pixel_purchase` | 1 |
| `offsite_conversion_fb_pixel_search` | 1 |
| `offsite_conversion_fb_pixel_view_content` | 1 |
| `offsite_engagement` | 1 |
| `post` | 1 |
| `post_comment` | 1 |
| `post_engagement` | 1 |
| `post_like` | 1 |
| `post_reaction` | 1 |
| `view_content` | 1 |
| `video_play` | 1 |
| `video_view` | 1 |
| `vote` | 1 |

Here is an example of a stats milestone rule, which sends a ping whenever someone comments on your post:

```
curl \
-F 'name=Rule 1' \
-F 'evaluation_spec={
      "evaluation_type" : "TRIGGER",
      "trigger" : {
        "type": "STATS_MILESTONE",
        "field": "post_comment",
        "value": 1,
        "operator": "EQUAL"
      },
      "filters" : [
       {
         "field": "entity_type",
         "value": "CAMPAIGN",
         "operator": "EQUAL",
       },
       {
         "field": "time_preset",
         "value": "LIFETIME",
         "operator": "EQUAL",
       },
     ]
   }' \
-F 'execution_spec={
      "execution_type": "PING_ENDPOINT"
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

### Stats change rule {#stats-change}

When using `STATS_CHANGE` as trigger `type`, `execution_spec` is triggered when the logical `AND` of the trigger and all filters are evaluated from `false` to `true` in a given `time_preset`.

If subsequent evaluations of the logical `AND` are also true, `execution_spec` **does not** execute. However, if the evaluation of the logical `AND` changes from `true` to `false`, `execution_spec` executes when it changes back to `true`.

For this specific type of rule, the trigger `operator` can be `GREATER_THAN`, `LESS_THAN`, `IN_RANGE`, or `NOT_IN_RANGE`.

Here is an example of a stats change rule. Every time an ad has reached more than 5000 people and it is over $10 per purchase for the last 3 days, pause it.

```
curl \
-F 'name=Rule 1' \
-F 'evaluation_spec={
      "evaluation_type" : "TRIGGER",
      "trigger" : {
        "type": "STATS_CHANGE",
        "field": "cost_per_purchase_fb",
        "value": 1000,
        "operator": "GREATER_THAN",
      },
      "filters" : [
       {
         "field": "entity_type",
         "value": "AD",
         "operator": "EQUAL"
       },
       {
         "field": "time_preset",
         "value": "LAST_3_DAYS",
         "operator": "EQUAL"
       },
       {
         "field": "reach",
         "value": 5000,
         "operator": "GREATER_THAN"
       }
     ]
   }' \
-F 'execution_spec={
      "execution_type": "PAUSE"
   }' \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/<VERSION>/<AD_ACCOUNT_ID>/adrules_library
```

### Delivery insights change rules (Beta)

When using `DELIVERY_INSIGHTS_CHANGE` as the trigger `type`, the rule is triggered when all the filters defined in `evaluation_spec` are evaluated to be `true`, **and** the trigger defined in `evaluation_spec` just changes from `false` to `true`.

If subsequent evaluations, if the filters and trigger continue being evaluated to `true`, the rule is not triggered again.

## Webhooks setup {#webhooks}

To use execution type `PING_ENDPOINT`, you need to set up a subscription for your application through Webhooks. Set up a callback URL, a Facebook App and Webhooks to get notifications from Rules API:

### Step 1: Setup a callback URL

See [Webhooks Guide](https://developers.facebook.com/docs/graph-api/webhooks#setup) and create a callback URL that can handle the challenge and response during verification. The callback URL handles the data structure sent when a rule is triggered:

```
{
  object: 'application',
  entry: [{
    id: '<APPLICATION_ID>',
    time: 1468938744,
    changes: [{
      field: 'ads_rules_engine',
      value: {
        'rule_id': 1234,
        'object_id': 5678,
        'object_type': 'ADSET',
        'trigger_type': 'STATS_CHANGE',
        'trigger_field': 'COST_PER_LINK_CLICK',
        'current_value': '15.8',
      }
    }],
  }],
}
```

The `current_value` field is a JSON-encoded string. Its value can be a string in double quotes, a number, or an array that begins with `[` (left bracket) and ends with `]` (right bracket).

### Step 2: Add `ads_rules_engine` Webhook to your app

Once the callback URL handles the challenge and response for verification, register it in your app when a rule is triggered:

* Create a new [Facebook App](https://developers.facebook.com/apps/) or use an existing one.
* Add the Webhooks Product.

* Create a New Subscription for an Application and select the `ad_rules_engine`.

Alternatively, this can be done through the Graph API, **using an App access token and not a user access token**:

```
curl \
-F "object=application" \
-F "callback_url=<CALLBACK_URL>" \
-F "fields=ads_rules_engine" \
-F "verify_token=<VERIFY_TOKEN>" \
-F "access_token=<APP_ACCESS_TOKEN>" \
"https://graph.facebook.com/<VERSION>/<APP_ID>/subscriptions"
```

See the [Subscriptions Reference](https://developers.facebook.com/docs/graph-api/reference/app/subscriptions) for details on `APP_ID/subscriptions`.
