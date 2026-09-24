<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-activity | Saved: 2026-09-19 -->

# Ad Account, Activities



Get information on key updates to an ad account and ad objects associated with it. Please note that this API returns **one week’s data by default**. Information returned includes major account status changes, updates made to budget, campaign, targeting, audiences and so on.

## Reading

Ad Activity

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `actor_id`<br><br>*numeric string* | Actor ID<br> |
| `actor_name`<br><br>*string* | Actor Name<br> |
| `application_id`<br><br>*numeric string* | Application ID<br> |
| `application_name`<br><br>*string* | Application Name<br> |
| `date_time_in_timezone`<br><br>*string* | Date/Time string in account timezone<br> |
| `event_time`<br><br>*datetime* | Timestamp<br><br><br>**[default]**<br> |
| `event_type`<br><br>*enum {ad_account_update_spend_limit, ad_account_reset_spend_limit, ad_account_remove_spend_limit, ad_account_set_business_information, ad_account_update_status, ad_account_add_user_to_role, ad_account_remove_user_from_role, add_images, edit_images, delete_images, ad_account_update_audience_type_url_parameter, adaccount_update_audience_segment, create_adaccount_agency_fee, update_adaccount_agency_fee, update_adaccount_agency_fee_status, ad_account_billing_charge, ad_account_billing_charge_failed, ad_account_billing_chargeback, ad_account_billing_chargeback_reversal, ad_account_billing_decline, ad_account_billing_refund, billing_event, add_funding_source, remove_funding_source, create_campaign_group, update_campaign_name, update_campaign_run_status, update_campaign_group_spend_cap, create_campaign_legacy, update_campaign_budget, campaign_ended, update_campaign_group_ad_scheduling, update_campaign_group_delivery_type, update_campaign_budget_optimization_toggling_status, update_budget_flex_toggle_status, update_delivery_type_cross_level_shift, update_campaign_group_high_demand_periods, update_campaign_group_budget_scheduling_state, create_campaign_group_agency_fee, update_campaign_group_agency_fee, create_ad_set, update_ad_set_bidding, update_ad_set_bid_strategy, update_ad_set_budget, update_ad_set_duration, update_ad_set_run_status, update_ad_set_name, update_ad_set_optimization_goal, update_ad_set_target_spec, update_ad_set_ad_keywords, update_ad_set_bid_adjustments, update_campaign_ad_scheduling, update_campaign_delivery_destination, update_campaign_delivery_type, update_campaign_schedule, update_ad_set_spend_cap, update_ad_set_min_spend_target, update_ad_set_learning_stage_status, update_campaign_high_demand_periods, update_campaign_budget_scheduling_state, update_campaign_conversion_goal, update_campaign_value_adjustment_rule, update_ad_set_value_rules, update_ad_set_cost_bidding_mode, merge_campaigns, update_campaign_budget_split, create_ad, ad_review_approved, ad_review_declined, update_ad_creative, edit_and_update_ad_creative, update_ad_bid_info, update_ad_bid_type, update_ad_run_status, update_ad_run_status_to_be_set_after_review, update_ad_friendly_name, update_ad_targets_spec, update_adgroup_stop_delivery, update_ad_audience_persona, first_delivery_event, create_audience, update_audience, delete_audience, share_audience, receive_audience, unshare_audience, remove_shared_audience, create_custom_audience_appeal, reject_custom_audience_appeal, accept_custom_audience_appeal, apply_restrictions_custom_audience, unknown, account_spending_limit_reached, campaign_spending_limit_reached, lifetime_budget_spent, conversion_event_updated, funding_event_initiated, funding_event_successful, update_ad_labels, di_ad_set_learning_stage_exit}* | Event types by category:<br>ACCOUNT<br>`ad_review_approved`: Ad approved<br>`ad_review_declined`: Ad not approved<br>`ad_account_set_business_information`: Account business information updated<br>`ad_account_update_status`: Account status updated<br>`ad_account_add_user_to_role`: Person added to account<br>`ad_account_remove_user_from_role`: Person removed from account<br>`add_images`: Image added to the library<br>`edit_images`: Image edited in library<br><br>AD<br>`ad_review_approved`: Ad approved<br>`ad_review_declined`: Ad not approved<br>`create_ad`: Ad created<br>`update_ad_creative`: Ad updated<br>`update_ad_friendly_name`: Ad name updated<br>`update_ad_run_status`: Ad status updated<br>`update_ad_run_status_to_be_set_after_review`: Updated status of ad after it finishes Ad Review<br><br>AD_KEYWORDS<br>`update_ad_set_ad_keywords`: Ad set audience prioritization updated<br><br>AD_SET<br>`create_ad_set`: Ad set created<br>`update_ad_set_bidding`: Ad set bidding updated<br>`update_ad_set_bid_strategy`: Ad set bid strategy updated<br>`update_ad_set_bid_adjustments`: Ad set bid adjustments updated<br>`update_ad_set_budget`: Ad set budget updated<br>`update_ad_set_duration`: Ad set schedule updated<br>`update_ad_set_name`: Ad set name updated<br>`update_ad_set_run_status`: Ad set status updated<br>`update_ad_set_target_spec`: Ad set targeting updated<br>`update_ad_set_ad_keywords`: Ad set audience prioritization updated<br><br>AUDIENCE<br>`create_audience`: Custom audience created<br>`update_audience`: Custom audience updated<br>`delete_audience`: Custom audience deleted<br>`share_audience`: Custom audience shared<br>`receive_audience`: Custom audience received<br>`unshare_audience`: Custom audience unshared<br>`remove_shared_audience`: Shared custom audience removed<br>`update_adgroup_stop_delivery`: Shared audience ad stopped<br><br>BID<br>`update_ad_bid_info`: Bid updated<br>`update_ad_bid_type`: Bidding type updated<br>`update_ad_set_bidding`: Ad set bidding updated<br>`update_ad_set_bid_strategy`: Ad set bid strategy updated<br>`update_ad_set_bid_adjustments`: Ad set bid adjustments updated<br><br>BUDGET<br>`ad_account_billing_charge`: Account billed<br>`ad_account_billing_chargeback`: Bank refund<br>`ad_account_billing_chargeback_reversal`: Paid (Bank refund cancelled)<br>`ad_account_billing_decline`: Account payment method declined<br>`ad_account_billing_refund`: Account refunded<br>`ad_account_remove_spend_limit`: Spending limit removed<br>`ad_account_reset_spend_limit`: Spending limit reset<br>`ad_account_update_spend_limit`: Spending limit updated<br>`add_funding_source`: Payment method added<br>`billing_event`: Billing Event<br>`funding_event_initiated`: Funding Event Initiated<br>`funding_event_successful`: Money added to balance<br>`remove_funding_source`: Payment method removed<br>`update_ad_set_budget`: Ad set budget updated<br>`update_campaign_budget`: Campaign budget updated<br>`update_campaign_group_spend_cap`: Campaign spending limit updated<br><br>CAMPAIGN<br>`create_campaign_legacy`: Campaign created<br>`create_campaign_group`: Campaign created<br>`update_campaign_duration`: Campaign schedule updated<br>`update_campaign_name`: Campaign name updated<br>`update_campaign_run_status`: Campaign status updated<br><br>DATE<br>`update_campaign_duration`: Campaign schedule updated<br>`update_ad_set_duration`: Ad set schedule updated<br><br>STATUS<br>`ad_account_update_status`: Account status updated<br>`update_ad_run_status`: Ad status updated<br>`update_ad_run_status_to_be_set_after_review`: Updated status of ad after it finishes Ad Review<br>`update_ad_set_run_status`: Ad set status updated<br>`update_campaign_run_status`: Campaign status updated<br><br>TARGETING<br>`update_ad_set_target_spec`: Ad set targeting updated<br>`update_ad_targets_spec`: Ad targeting updated<br><br><br>**[default]**<br> |
| `extra_data`<br><br>*string* | JSON encoded extra information<br> |
| `object_id`<br><br>*numeric string* | Object ID<br> |
| `object_name`<br><br>*string* | Object Name<br> |
| `object_type`<br><br>*string* | Object Type<br> |
| `translated_event_type`<br><br>*string* | Translated event type<br> |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

