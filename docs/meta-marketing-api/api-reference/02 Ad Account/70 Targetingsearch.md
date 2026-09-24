<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/targetingsearch | Saved: 2026-09-19 -->

# Ad Account Targetingsearch



## Reading

Unified search endpoint to get targeting descriptors with query

#### Example

### HTTP
```
GET /v25.0/{ad-account-id}/targetingsearch HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/{ad-account-id}/targetingsearch',
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

### JavaScript SDK
```
/* make the API call */
FB.api(
    "/{ad-account-id}/targetingsearch",
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

### Android SDK
```
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/{ad-account-id}/targetingsearch",
    null,
    HttpMethod.GET,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

### iOS SDK
```
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/{ad-account-id}/targetingsearch"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%7Bad-account-id%7D%2Ftargetingsearch&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `allow_only_fat_head_interests`<br><br>*boolean* | Allow only pre vetted interests<br> |
| `app_store`<br><br>*enum {all_app_stores_for_android_and_ios, amazon_app_store, google_play, itunes, itunes_ipad, fb_canvas, fb_gameroom, windows_store, fb_android_store, windows_10_store, roku_channel_store, instant_game, oculus_app_store, horizon_world, galaxy_store, neon_android_store, digital_turbine_store, apk_pure, apk_monk, apk_mirror, xiaomi, oppo, vivo, bemobi_mobile_store, aptoide_a1_store, uptodown, does_not_exist, none}* | The app store for which this ad is being promoted. This is typically only for app install campaign objectives.<br> |
| `limit_type`<br><br>*enum {adgroup_id, genders, age_min, age_max, age_range, country_groups, countries, country, cities, city_keys, radius, regions, region_keys, zips, interests, location_cluster_ids, keywords, education_schools, education_majors, work_positions, work_employers, relationship_statuses, interested_in, locales, user_adclusters, excluded_user_adclusters, conjunctive_user_adclusters, custom_audiences, excluded_custom_audiences, cafe_ca_expansion_targeting_signal, cafe_ca_contraction_targeting_signal, expanded_implicit_custom_audiences, tafe_ca_mitigation_strategy, college_years, education_statuses, connections, excluded_connections, friends_of_connections, user_event, dynamic_audience_ids, excluded_dynamic_audience_ids, rtb_flag, site_category, geo_locations, excluded_geo_locations, timezones, place_page_set_ids, location_expansion, page_types, publisher_platforms, effective_publisher_platforms, facebook_positions, effective_facebook_positions, instagram_positions, effective_instagram_positions, messenger_positions, effective_messenger_positions, device_platforms, effective_device_platforms, audience_network_positions, effective_audience_network_positions, whatsapp_positions, effective_whatsapp_positions, oculus_positions, effective_oculus_positions, threads_positions, effective_threads_positions, excluded_publisher_categories, excluded_publisher_list_ids, user_device, mobile_device_model, excluded_user_device, excluded_mobile_device_model, user_os, wireless_carrier, marketing_message_channels, subscriber_universe, user_age_unknown, audience_concepts, family_statuses, industries, life_events, political_views, politics, behaviors, income, net_worth, home_type, home_ownership, home_value, ethnic_affinity, generation, household_composition, moms, office_type, household_income, targeting_optimization, direct_install_devices, targeting_automation, targeting_relaxation_types, engagement_specs, excluded_engagement_specs, product_audience_specs, excluded_product_audience_specs, exclusions, flexible_spec, dt_consolidation_state, exclude_reached_since, exclude_previous_days, app_install_state, install_state_application, fb_deal_id, interest_defaults_source, alternate_auto_targeting_option, contextual_targeting_categories, topic, format, trending, gatekeepers, follow_profiles, follow_profiles_negative, location_categories, user_page_threads, user_page_threads_excluded, is_whatsapp_destination_ad, marketplace_product_categories, instream_video_sponsorship_placements, prospecting_audience, brand_safety_content_severity_levels, catalog_based_targeting, brand_safety_content_filter_levels, excluded_brand_safety_content_types, id, is_instagram_destination_ad, hashtag_interactions, instagram_hashtags, instream_video_skippable_excluded, effective_brand_safety_content_filter_levels}* | Limit the type of audience to retrieve<br> |
| `objective`<br><br>*enum{APP_INSTALLS, BRAND_AWARENESS, CONVERSIONS, EVENT_RESPONSES, LEAD_GENERATION, LINK_CLICKS, LOCAL_AWARENESS, MESSAGES, OFFER_CLAIMS, OUTCOME_APP_PROMOTION, OUTCOME_AWARENESS, OUTCOME_ENGAGEMENT, OUTCOME_LEADS, OUTCOME_SALES, OUTCOME_TRAFFIC, PAGE_LIKES, POST_ENGAGEMENT, PRODUCT_CATALOG_SALES, REACH, STORE_VISITS, VIDEO_VIEWS}* | The objective of the ad campaign.<br> |
| `q`<br><br>*string* | Search query<br><br>**[required]**<br> |
| `regulated_categories`<br><br>*array<enum {NONE, EMPLOYMENT, HOUSING, CREDIT, ISSUES_ELECTIONS_POLITICS, ONLINE_GAMBLING_AND_GAMING, FINANCIAL_PRODUCTS_SERVICES}>* | The regulated categories of the campaign.<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of AdAccountTargetingUnified nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 190 | Invalid OAuth 2.0 Access Token |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

