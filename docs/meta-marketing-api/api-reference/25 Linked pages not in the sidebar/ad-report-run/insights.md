<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-report-run/insights | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Report Run Insights

## Reading

AdReportRunInsights

### Example

[Graph API Explorer**](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-report-run-id%7D%2Finsights&version=v26.0)

```
GET /v26.0/{ad-report-run-id}/insights HTTP/1.1
Host: graph.facebook.com
```

```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-report-run-id}/insights',
    '{access-token}'
  );
} catch(Facebook\Exceptions\FacebookResponseException $e) {
  echo 'Graph returned an error: ' . $e->getMessage();
  exit;
} catch(Facebook\Exceptions\FacebookSDKException $e) {
  echo 'Facebook SDK returned an error: ' . $e->getMessage();
  exit;
}
$graphNode = $response->getGraphNode();
/* handle the result */
```

```
/* make the API call */
FB.api(
    "/{ad-report-run-id}/insights",
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

```
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/{ad-report-run-id}/insights",
    null,
    HttpMethod.GET,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

```
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/{ad-report-run-id}/insights"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api/).

### Parameters

This endpoint doesn't have any parameters.

### Fields

Reading from this edge will return a JSON formatted result:

```

{
    "data": [],
    "paging": {},
    "summary": {}
}

```

#### `data`

A list of AdsInsights nodes.

#### `paging`

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api/#paging).

#### `summary`

Aggregated information about the edge, such as counts. Specify the fields to fetch in the summary param (like `summary=account_currency`).

| Field | Description |
| --- | --- |
| `account_currency`string | account_currency |
| `account_id`numeric string | account_id [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `account_name`string | account_name |
| `action_values`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | action_values |
| `actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | actions |
| `activity_recency`string | activity_recency |
| `ad_click_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | ad_click_actions |
| `ad_format_asset`string | ad_format_asset |
| `ad_id`numeric string | ad_id [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `ad_impression_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | ad_impression_actions |
| `ad_name`string | ad_name |
| `adset_id`numeric string | adset_id [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `adset_name`string | adset_name |
| `advanced_actions_28d_view`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | advanced actions 28d view |
| `advanced_reach_1d_lookback`numeric string | advanced reach 1d lookback |
| `advanced_reach_28d_lookback`numeric string | advanced reach 28d lookback |
| `advanced_reach_7d_lookback`numeric string | advanced reach 7d lookback |
| `age`string | age |
| `age_targeting`string | age_targeting |
| `anchor_event_attribution_setting`string | anchor event attribution setting |
| `anchor_events_performance_indicator`string | anchor events performance indicator |
| `app_id`string | app_id |
| `attribution_setting`string | attribution_setting |
| `auction_bid`numeric string | auction_bid |
| `auction_competitiveness`numeric string | auction_competitiveness |
| `auction_max_competitor_bid`numeric string | auction_max_competitor_bid |
| `average_purchases_conversion_value`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | average_purchases_conversion_value |
| `body_asset`AdAssetBody | body_asset |
| `buying_type`string | buying_type |
| `call_to_action_asset`AdAssetCallToActionType | call_to_action_asset |
| `campaign_id`numeric string | campaign_id [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `campaign_name`string | campaign_name |
| `canvas_avg_view_percent`numeric string | canvas_avg_view_percent |
| `canvas_avg_view_time`numeric string | canvas_avg_view_time |
| `catalog_segment_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | catalog_segment_actions |
| `catalog_segment_value`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | catalog_segment_value |
| `catalog_segment_value_mobile_purchase_roas`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | catalog_segment_value_mobile_purchase_roas |
| `catalog_segment_value_omni_purchase_roas`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | catalog_segment_value_omni_purchase_roas |
| `catalog_segment_value_website_purchase_roas`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | catalog_segment_value_website_purchase_roas |
| `clicks`numeric string | clicks |
| `coarse_conversion_value`string | coarse_conversion_value |
| `comparison_node`AdsInsightsComparison | comparison_node |
| `comscore_market`string | comscore market |
| `configurable_attribution_action`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | configurable attribution action |
| `configurable_attribution_actionvalue`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | configurable attribution actionvalue |
| `configurable_audience_overlap_reach`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | configurable audience overlap reach |
| `configurable_audience_overlap_with_conv_action`numeric string | configurable audience overlap with conv action |
| `configurable_audience_overlap_with_conv_converters`numeric string | configurable audience overlap with conv converters |
| `configurable_audience_overlap_with_conv_exposure_cost`numeric string | configurable audience overlap with conv exposure cost |
| `configurable_audience_overlap_with_conv_exposure_impressions`numeric string | configurable audience overlap with conv exposure impressions |
| `configurable_audience_overlap_with_conv_exposure_reach`numeric string | configurable audience overlap with conv exposure reach |
| `configurable_placement_ptc_conversions`numeric string | configurable placement ptc conversions |
| `configurable_placement_ptc_converters`numeric string | configurable placement ptc converters |
| `configurable_placement_ptc_reach`numeric string | configurable placement ptc reach |
| `configurable_reachbyfrequency_action`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | configurable reachbyfrequency action |
| `configurable_reachbyfrequency_converters_count`numeric string | configurable reachbyfrequency converters count |
| `configurable_reachbyfrequency_impressions_cost`numeric string | configurable reachbyfrequency impressions cost |
| `configurable_reachbyfrequency_impressions_count`numeric string | configurable reachbyfrequency impressions count |
| `configurable_reachbyfrequency_reach`numeric string | configurable reachbyfrequency reach |
| `conversion_lead_rate`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | conversion_lead_rate |
| `conversion_leads`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | conversion_leads |
| `conversion_rate_ranking`string | conversion_rate_ranking |
| `conversion_values`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | conversion_values |
| `conversions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | conversions |
| `converted_product_app_custom_event_fb_mobile_purchase`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted product app custom event fb mobile purchase |
| `converted_product_app_custom_event_fb_mobile_purchase_value`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted product app custom event fb mobile purchase value |
| `converted_product_offline_purchase`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted product offline purchase |
| `converted_product_offline_purchase_value`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted product offline purchase value |
| `converted_product_omni_purchase`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted product omni purchase |
| `converted_product_omni_purchase_values`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted product omni purchase values |
| `converted_product_quantity`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted_product_quantity |
| `converted_product_value`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted_product_value |
| `converted_product_website_pixel_purchase`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted product website pixel purchase |
| `converted_product_website_pixel_purchase_value`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted product website pixel purchase value |
| `converted_promoted_product_app_custom_event_fb_mobile_purchase`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted promoted product app custom event fb mobile purchase |
| `converted_promoted_product_app_custom_event_fb_mobile_purchase_value`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted promoted product app custom event fb mobile purchase value |
| `converted_promoted_product_offline_purchase`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted promoted product offline purchase |
| `converted_promoted_product_offline_purchase_value`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted promoted product offline purchase value |
| `converted_promoted_product_omni_purchase`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted promoted product omni purchase |
| `converted_promoted_product_omni_purchase_values`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted promoted product omni purchase values |
| `converted_promoted_product_quantity`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted_promoted_product_quantity |
| `converted_promoted_product_value`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted_promoted_product_value |
| `converted_promoted_product_website_pixel_purchase`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted promoted product website pixel purchase |
| `converted_promoted_product_website_pixel_purchase_value`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | converted promoted product website pixel purchase value |
| `cost_per_15_sec_video_view`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | cost_per_15_sec_video_view |
| `cost_per_2_sec_continuous_video_view`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | cost_per_2_sec_continuous_video_view |
| `cost_per_6_sec_video_view`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | cost per 6 sec video view |
| `cost_per_action_type`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | cost_per_action_type |
| `cost_per_ad_click`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | cost_per_ad_click |
| `cost_per_conversion`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | cost_per_conversion |
| `cost_per_conversion_lead`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | cost_per_conversion_lead |
| `cost_per_dda_countby_convs`numeric string | cost_per_dda_countby_convs |
| `cost_per_estimated_ad_recallers`numeric string | cost_per_estimated_ad_recallers |
| `cost_per_inline_link_click`numeric string | cost_per_inline_link_click |
| `cost_per_inline_post_engagement`numeric string | cost_per_inline_post_engagement |
| `cost_per_message_delivered`numeric string | cost_per_message_delivered |
| `cost_per_objective_result`list<AdsInsightsResult> | cost_per_objective_result |
| `cost_per_one_thousand_ad_impression`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | cost_per_one_thousand_ad_impression |
| `cost_per_outbound_click`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | cost_per_outbound_click |
| `cost_per_result`list<AdsInsightsResult> | cost_per_result |
| `cost_per_thruplay`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | cost_per_thruplay |
| `cost_per_unique_action_type`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | cost_per_unique_action_type |
| `cost_per_unique_click`numeric string | cost_per_unique_click |
| `cost_per_unique_conversion`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | cost_per_unique_conversion |
| `cost_per_unique_inline_link_click`numeric string | cost_per_unique_inline_link_click |
| `cost_per_unique_outbound_click`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | cost_per_unique_outbound_click |
| `country`string | country |
| `cpc`numeric string | cpc |
| `cpm`numeric string | cpm |
| `cpp`numeric string | cpp |
| `created_time`string | created_time |
| `creative_automation_asset_id`AdAssetMedia | creative automation asset id |
| `creative_diversity_data`list<CreativeDiversityData> | creative diversity data |
| `creative_diversity_label`string | creative diversity label |
| `creative_diversity_score`string | creative diversity score |
| `creative_fatigue_summary`list<CreativeFatigueSummary> | creative fatigue summary |
| `creative_fatigued_ads`list<CreativeFatiguedAds> | creative fatigued ads |
| `creative_fingerprint`string | creative_fingerprint |
| `creative_media_type`string | creative_media_type |
| `creative_relaxation_asset_type`string | creative relaxation asset type |
| `ctr`numeric string | ctr |
| `date_start`string | date_start [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `date_stop`string | date_stop [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `dda_countby_convs`numeric string | dda_countby_convs |
| `dda_results`list<AdsInsightsDdaResult> | dda_results |
| `description_asset`AdAssetDescription | description_asset |
| `device_platform`string | device_platform |
| `dma`string | dma |
| `engagement_rate_ranking`string | engagement_rate_ranking |
| `estimated_ad_recall_rate`numeric string | estimated_ad_recall_rate |
| `estimated_ad_recall_rate_lower_bound`numeric string | estimated_ad_recall_rate_lower_bound |
| `estimated_ad_recall_rate_upper_bound`numeric string | estimated_ad_recall_rate_upper_bound |
| `estimated_ad_recallers`numeric string | estimated_ad_recallers |
| `estimated_ad_recallers_lower_bound`numeric string | estimated_ad_recallers_lower_bound |
| `estimated_ad_recallers_upper_bound`numeric string | estimated_ad_recallers_upper_bound |
| `fidelity_type`string | fidelity_type |
| `flexible_format_asset_type`string | flexible format asset type |
| `frequency`numeric string | frequency |
| `frequency_value`string | frequency_value |
| `full_view_impressions`numeric string | full_view_impressions |
| `full_view_reach`numeric string | full_view_reach |
| `gen_ai_asset_type`string | gen ai asset type |
| `gender`string | gender |
| `gender_targeting`string | gender_targeting |
| `hourly_stats_aggregated_by_advertiser_time_zone`string | hourly_stats_aggregated_by_advertiser_time_zone |
| `hourly_stats_aggregated_by_audience_time_zone`string | hourly_stats_aggregated_by_audience_time_zone |
| `hsid`string | hsid |
| `image_asset`AdAssetImage | image_asset |
| `impression_device`string | impression_device |
| `impressions`numeric string | impressions [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `inline_link_click_ctr`numeric string | inline_link_click_ctr |
| `inline_link_clicks`numeric string | inline_link_clicks |
| `inline_post_engagement`numeric string | inline_post_engagement |
| `instagram_profile_follow`numeric string | instagram profile follow |
| `instagram_profile_visits`numeric string | instagram profile visits |
| `instagram_upcoming_event_reminders_set`numeric string | instagram_upcoming_event_reminders_set |
| `instant_experience_clicks_to_open`numeric string | instant_experience_clicks_to_open |
| `instant_experience_clicks_to_start`numeric string | instant_experience_clicks_to_start |
| `instant_experience_outbound_clicks`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | instant_experience_outbound_clicks |
| `interactive_component_tap`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | interactive_component_tap |
| `is_auto_advance`string | is auto advance |
| `is_conversion_id_modeled`string | is_conversion_id_modeled |
| `is_video`string | is_video |
| `labels`string | labels |
| `landing_destination`string | landing_destination |
| `landing_page_view_actions_per_link_click`numeric string | landing_page_view_actions_per_link_click |
| `landing_page_view_per_link_click`numeric string | landing page view per link click |
| `landing_page_view_per_purchase_rate`numeric string | landing_page_view_per_purchase_rate |
| `link_clicks_per_results`list<AdsInsightsResult> | link_clicks_per_results |
| `link_url_asset`AdAssetLinkURL | link_url_asset |
| `location`string | location |
| `marketing_messages_click_rate_benchmark`numeric string | marketing messages click rate benchmark |
| `marketing_messages_cost_per_delivered`numeric string | marketing_messages_cost_per_delivered |
| `marketing_messages_cost_per_link_btn_click`numeric string | marketing_messages_cost_per_link_btn_click |
| `marketing_messages_delivery_rate`numeric string | The number of messages delivered divided by the number of messages sent. Some messages may not be delivered, such as when a customer's device is out of service. This metric doesn't include messages sent to Europe and Japan. |
| `marketing_messages_link_btn_click_rate`numeric string | marketing_messages_link_btn_click_rate |
| `marketing_messages_media_view_rate`numeric string | marketing_messages_media_view_rate |
| `marketing_messages_phone_call_btn_click_rate`numeric string | marketing_messages_phone_call_btn_click_rate |
| `marketing_messages_quick_reply_btn_click_rate`numeric string | marketing_messages_quick_reply_btn_click_rate |
| `marketing_messages_read_rate`numeric string | marketing_messages_read_rate |
| `marketing_messages_spend`numeric string | marketing_messages_spend |
| `media_asset`AdAssetMedia | media_asset |
| `media_type`string | media type |
| `messages_delivered`numeric string | messages_delivered |
| `messages_delivered_ctr`numeric string | messages_delivered_ctr |
| `mobile_app_purchase_roas`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | mobile_app_purchase_roas |
| `msa_seller_budget`integer | msa seller budget |
| `msa_seller_id`string | msa seller id |
| `msa_seller_name`string | msa seller name |
| `multi_event_conversion_attribution_setting`string | multi event conversion attribution setting |
| `objective`string | objective |
| `objective_result_rate`list<AdsInsightsResult> | objective_result_rate |
| `objective_results`list<AdsInsightsResult> | objective_results |
| `opportunity_score_l4`numeric string | opportunity score l4 |
| `optimization_goal`string | optimization_goal |
| `outbound_clicks`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | outbound_clicks |
| `outbound_clicks_ctr`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | outbound_clicks_ctr |
| `overlap_segment`string | overlap segment |
| `pa_creator_ig_handle`string | pa creator ig handle |
| `placement`string | placement |
| `placement_path`string | placement path |
| `platform_position`string | platform_position |
| `playable_average_game_length`numeric string | playable average game length |
| `playable_game_start_rate`numeric string | playable game start rate |
| `postback_sequence_index`string | postback_sequence_index |
| `product_brand_breakdown`string | product brand breakdown |
| `product_category_breakdown`string | product category breakdown |
| `product_custom_label_0_breakdown`string | product custom label 0 breakdown |
| `product_custom_label_1_breakdown`string | product custom label 1 breakdown |
| `product_custom_label_2_breakdown`string | product custom label 2 breakdown |
| `product_custom_label_3_breakdown`string | product custom label 3 breakdown |
| `product_custom_label_4_breakdown`string | product custom label 4 breakdown |
| `product_group_content_id_breakdown`string | product group content id breakdown |
| `product_group_retailer_id`string | product group retailer id |
| `product_id`string | product_id |
| `product_retailer_id`string | product retailer id |
| `product_set_id_breakdown`string | product set id breakdown |
| `product_vendor_id_breakdown`string | product vendor id breakdown |
| `product_views`string | product views |
| `promoted_product_set_result`string | promoted product set result |
| `publisher_platform`string | publisher_platform |
| `purchase_per_landing_page_view`numeric string | purchase per landing page view |
| `purchase_roas`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | purchase_roas |
| `purchases_per_link_click`numeric string | purchases_per_link_click |
| `qualifying_question_qualify_answer_rate`numeric string | qualifying_question_qualify_answer_rate |
| `quality_ranking`string | quality_ranking |
| `reach`numeric string | reach |
| `read_rate`numeric string | read_rate |
| `redownload`string | redownload |
| `reels_trending_topic`string | reels trending topic |
| `region`string | region |
| `result_rate`list<AdsInsightsResult> | result_rate |
| `result_values_performance_indicator`string | result_values_performance_indicator |
| `results`list<AdsInsightsResult> | results |
| `rta_ugc_topic`string | rta ugc topic |
| `rule_asset`AdAssetRule | rule_asset |
| `rule_set_id`string | rule set id |
| `rule_set_name`string | rule set name |
| `shops_assisted_purchases`string | shops_assisted_purchases |
| `skan_campaign_id`string | skan_campaign_id |
| `skan_conversion_id`string | skan_conversion_id |
| `skan_version`string | skan_version |
| `social_spend`numeric string | social_spend |
| `spend`numeric string | spend [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `title_asset`AdAssetTitle | title_asset |
| `total_card_view`string | total card view |
| `total_postbacks`string | Contains fields associated with SKAN postbacks. |
| `total_postbacks_detailed`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | Contains fields associated with SKAN postbacks. |
| `total_postbacks_detailed_v4`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | Contains fields associated with SKAN 4.0 postbacks. <br> **Note:** SKAN 4.0 conversions are currently being sent as SKAN 3.0 conversions via `total_postback_detailed`. Ensure these conversions are accounted for if SKAN 4.0 conversions are also being ingested from total_postback_detailed_v4 as well |
| `unique_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | unique_actions |
| `unique_clicks`numeric string | unique_clicks |
| `unique_conversions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | unique_conversions |
| `unique_ctr`numeric string | unique_ctr |
| `unique_inline_link_click_ctr`numeric string | unique_inline_link_click_ctr |
| `unique_inline_link_clicks`numeric string | unique_inline_link_clicks |
| `unique_link_clicks_ctr`numeric string | unique_link_clicks_ctr |
| `unique_outbound_clicks`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | unique_outbound_clicks |
| `unique_outbound_clicks_ctr`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | unique_outbound_clicks_ctr |
| `unique_video_continuous_2_sec_watched_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | unique_video_continuous_2_sec_watched_actions |
| `unique_video_view_15_sec`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | unique_video_view_15_sec |
| `updated_time`string | updated_time |
| `user_segment_key`string | user_segment_key |
| `video_15_sec_watched_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video_15_sec_watched_actions |
| `video_30_sec_watched_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video_30_sec_watched_actions |
| `video_6_sec_watched_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video 6 sec watched actions |
| `video_asset`AdAssetVideo | video_asset |
| `video_avg_time_watched_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video_avg_time_watched_actions |
| `video_continuous_2_sec_watched_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video_continuous_2_sec_watched_actions |
| `video_p100_watched_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video_p100_watched_actions |
| `video_p25_watched_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video_p25_watched_actions |
| `video_p50_watched_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video_p50_watched_actions |
| `video_p75_watched_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video_p75_watched_actions |
| `video_p95_watched_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video_p95_watched_actions |
| `video_play_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video_play_actions |
| `video_play_curve_actions`list<AdsHistogramStats> | video_play_curve_actions |
| `video_play_retention_0_to_15s_actions`list<AdsHistogramStats> | video_play_retention_0_to_15s_actions |
| `video_play_retention_20_to_60s_actions`list<AdsHistogramStats> | video_play_retention_20_to_60s_actions |
| `video_play_retention_graph_actions`list<AdsHistogramStats> | video_play_retention_graph_actions |
| `video_thruplay_watched_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video_thruplay_watched_actions |
| `video_time_watched_actions`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video_time_watched_actions |
| `video_view_per_impression`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | video_view_per_impression |
| `website_ctr`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | website_ctr |
| `website_purchase_roas`[list<AdsActionStats>](https://developers.facebook.com/docs/marketing-api/reference/ads-action-stats/) | website_purchase_roas |
| `wish_bid`numeric string | wish_bid |
| `zip`string | zip |

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
