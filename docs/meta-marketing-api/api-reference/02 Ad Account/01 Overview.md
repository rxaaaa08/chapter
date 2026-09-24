<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account | Saved: 2026-09-19 -->

# Ad Account



Represents a business, person or other entity who creates and manages ads on Facebook. Multiple people can manage an account, and each person can have one or more levels of access to an account, see [Business Manager API](https://developers.facebook.com/docs/marketing-api/business-manager-api).

**Success:** In response to Apple’s new policy, we are announcing breaking changes that will affect SDKAdNetwork, Marketing API and Ads Insights API endpoints.

To learn more about how Apple’s iOS 14.5 requirements will impact Facebook advertising, visit our Business Help Center aricles and changelog:

* [Facebook SDK for iOS, App Events API and Mobile Measurement Partners Updates for Apple's iOS 14 Requirements](https://www.facebook.com/business/help/2750680505215705?id=428636648170202)
* [Facebook Pixel Updates for Apple's iOS 14 Requirements](https://www.facebook.com/business/help/721422165168355)
* [January 19, 2021 - Breaking Changes](https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/jan-19-2021)

## Ad Volume {#volume}

You can view the volume of ads *running or in review* for your ad accounts. These ads will count against the ads limit per page that we will enact in early 2021. Query the number of ads running or in review for a given ad account.

To see the ads volume for your ad account:

```
curl -G
  -d "access_token=<access_token>"
  "https://graph.facebook.com/<API_VERSION>/act_<ad_account_ID>/ads_volume"
```

The response looks like this:

```
{"data":[{"ads_running_or_in_review_count":2}]}
```

For information on managing ads volume, see [About Managing Ad Volume](https://www.facebook.com/business/help/2720085414702598).

### Running Or In Review
To see if an ad is running or in review, we check `effective_status`, `configured_status`, and the ad account's status:

* If an ad has `effective_status` of `1` - `active`, we consider it a *running* or *in review*.
* If an ad has `configured_status` of `active` and `effective_status` of `9` - `pending review`, or `17` - `pending processing` we consider it a *running* or *in review*.
* The ad can be *running* or *in review* only if the ad account status is in `1` - `active`, `8` - `pending settlement`, `9` - `in grace period`.  

We also determine if an ad is running or in review based on the ad set's schedule.

* If start time is before current time, and current time is before end time, then we consider the ad running or in review.
* If start time is before current time and the ad set has no end time, we also consider it running or in review.

For example, if the ad set is scheduled to run in the future, the ads are not running or in review. However if the ad set is scheduled to run from now until three months from now, we consider the ads running or in review.

If you are using special ads scheduling features, such as *day-parting*, we consider the ad running or in review the *whole day*, not just for the part of the day when the ad starts running.  

### Breakdown By Actors {#breakdown-by-actors}

We’ve added the `show_breakdown_by_actor ` parameter to the `act_123/ads_volume` endpoint so you can query ad volume and ad limits-related information for each page. For more details, see [Breakdown by Actors](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights-api/ads-volume#breakdown-by-actors).

### Limits {#limits}

| Limit | Value |
| --- | --- |
| Maximum number of ad accounts per person | 25 |
| Maximum number of people with access, per ad account | 25 |
| Maximum number of ads per regular ad account | 6,000 non-archived non-deleted ads |
| Maximum number of ads per bulk ad account | 50,000 non-archived non-deleted ads |
| Maximum number of archived ads per ad account | 100,000 archived ads |
| Maximum number of ad sets per regular ad account | 6,000 non-archived non-deleted ad sets |
| Maximum number of ad sets per bulk ad account | 10,000 non-archived non-deleted ad sets |
| Maximum number of archived ad sets per ad account | 100,000 archived ad sets |
| Maximum number of ad campaigns per regular ad account | 6,000 non-archived non-deleted ad campaigns |
| Maximum number of ad campaigns per bulk ad account | 10,000 non-archived non-deleted ad campaigns |
| Maximum number of archived ad campaigns per ad account | 100,000 archived ad campaigns |
| Maximum number of images per ad account | Unlimited |

## Reading

An ad account is an account used for managing ads on Facebook

### Digital Services Act Saved Beneficiary/Payor Information

Use the following code examples to download the beneficiary and payor information.

#### Android SDK

```
GraphRequest request = GraphRequest.newGraphPathRequest(
 accessToken,
 "/act_<AD_ACCOUNT_ID>",
 new GraphRequest.Callback() {
   @Override
   public void onCompleted(GraphResponse response) {
     // Insert your code here
   }
});

Bundle parameters = new Bundle();
parameters.putString("fields", "default_dsa_payor,default_dsa_beneficiary");
request.setParameters(parameters);
request.executeAsync();
iOS SDK
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
    initWithGraphPath:@"/act_<AD_ACCOUNT_ID>"
           parameters:@{ @"fields": @"default_dsa_payor,default_dsa_beneficiary",}
           HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    // Insert your code here
}];
Javascript SDK:
FB.api(
  '/act_<AD_ACCOUNT_ID>',
  'GET',
  {"fields":"default_dsa_payor,default_dsa_beneficiary"},
  function(response) {
      // Insert your code here
  }
);
```

#### cURL

```
curl -X GET \
"https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>?fields=default_dsa_payor%2Cdefault_dsa_beneficiary&access_token=<ACCESS_TOKEN>"
```

The return value is in JSON format. For example:

```
{"default_dsa_payor":"payor2","default_dsa_beneficiary":"bene2","id":"act_426197654150180"}
```

#### Parameters

This endpoint doesn't have any parameters.

#### Fields

| Field | Description |
| --- | --- |
| `id`<br><br>*string* | The string `act_{ad_account_id}`.<br><br><br>**[default]**<br> |
| `account_id`<br><br>*numeric string* | The ID of the Ad Account.<br><br><br>**[default]**<br> |
| `account_status`<br><br>*unsigned int32* | Status of the account: <br>`1 = ACTIVE`<br>`2 = DISABLED`<br>`3 = UNSETTLED`<br>`7 = PENDING_RISK_REVIEW`<br>`8 = PENDING_SETTLEMENT`<br>`9 = IN_GRACE_PERIOD`<br>`100 = PENDING_CLOSURE`<br>`101 = CLOSED`<br>`201 = ANY_ACTIVE`<br>`202 = ANY_CLOSED`<br> |
| `ad_account_promotable_objects`<br><br>*[AdAccountPromotableObjects](https://developers.facebook.com/docs/graph-api/reference/ad-account-promotable-objects)* | Ad Account creation request purchase order fields associated with this Ad Account.<br> |
| `age`<br><br>*float* | Amount of time the ad account has been open, in days.<br> |
| `agency_client_declaration`<br><br>*[AgencyClientDeclaration](https://developers.facebook.com/docs/marketing-api/reference/agency-client-declaration)* | Details of the agency advertising on behalf of this client account, if applicable. Requires Business Manager [Admin](https://www.facebook.com/business/help/442345745885606?id=180505742745347) privileges.<br> |
| `amount_spent`<br><br>*numeric string* | Current amount spent by the account with respect to `spend_cap`. Or total amount in the absence of `spend_cap`. See [why amount spent is different in ad account spending limit](https://business.facebook.com/business/help/196476577203529?id=1792465934137726) for more info.<br> |
| `attribution_spec`<br><br>*list<AttributionSpec>* | **Deprecated due to iOS 14 changes.** Please visit the [changelog](https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/jan-19-2021) for more information.<br> |
| `balance`<br><br>*numeric string* | Bill amount due for this Ad Account.<br> |
| `brand_safety_content_filter_levels`<br><br>*list<string>* | Brand safety content filter levels set for in-content ads (Facebook in-stream videos and Ads on Facebook Reels) and Audience Network along with feed ads (Facebook Feed, Instagram feed, Facebook Reels feed and Instagram Reels feed) if applicable.<br><br><br>Refer to [Placement Targeting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/placement-targeting#placement-targeting) for a list of supported values.<br> |
| `business`<br><br>*[Business](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business)* | The [Business Manager](https://developers.facebook.com/docs/marketing-api/businessmanager), if this ad account is owned by one<br> |
| `business_city`<br><br>*string* | City for business address<br> |
| `business_country_code`<br><br>*string* | Country code for the business address<br> |
| `business_name`<br><br>*string* | The business name for the account<br> |
| `business_state`<br><br>*string* | State abbreviation for business address<br> |
| `business_street`<br><br>*string* | First line of the business street address for the account<br> |
| `business_street2`<br><br>*string* | Second line of the business street address for the account<br> |
| `business_zip`<br><br>*string* | Zip code for business address<br> |
| `can_create_brand_lift_study`<br><br>*bool* | If we can create a new automated brand lift study under the Ad Account.<br> |
| `capabilities`<br><br>*list<string>* | List of capabilities an Ad Account can have. See [capabilities](https://developers.facebook.com/docs/marketing-api/reference/ad-account/capabilities)<br> |
| `created_time`<br><br>*datetime* | The time the account was created in ISO 8601 format.<br> |
| `currency`<br><br>*string* | The currency used for the account, based on the corresponding value in the account settings. See [supported currencies](https://developers.facebook.com/documentation/ads-commerce/marketing-api/currencies)<br> |
| `default_dsa_beneficiary`<br><br>*string* | This is the default value for creating L2 object of dsa_beneficiary<br> |
| `default_dsa_payor`<br><br>*string* | This is the default value for creating L2 object of dsa_payor<br> |
| `direct_deals_tos_accepted`<br><br>*bool* | Whether DirectDeals ToS are accepted.<br> |
| `disable_reason`<br><br>*unsigned int32* | The reason why the account was disabled. Possible reasons are:<br><br>`0 = NONE`<br><br>`1 = ADS_INTEGRITY_POLICY`<br><br>`2 = ADS_IP_REVIEW`<br><br>`3 = RISK_PAYMENT`<br><br>`4 = GRAY_ACCOUNT_SHUT_DOWN`<br><br>`5 = ADS_AFC_REVIEW`<br><br>`6 = BUSINESS_INTEGRITY_RAR`<br><br>`7 = PERMANENT_CLOSE`<br><br>`8 = UNUSED_RESELLER_ACCOUNT`<br><br>`9 = UNUSED_ACCOUNT`<br><br>`10 = UMBRELLA_AD_ACCOUNT`<br><br>`11 = BUSINESS_MANAGER_INTEGRITY_POLICY`<br><br>`12 = MISREPRESENTED_AD_ACCOUNT`<br><br>`13 = AOAB_DESHARE_LEGAL_ENTITY`<br><br>`14 = CTX_THREAD_REVIEW`<br><br>`15 = COMPROMISED_AD_ACCOUNT`<br> |
| `end_advertiser`<br><br>*numeric string* | The entity the ads will target. Must be a Facebook Page Alias, Facebook Page ID or an Facebook App ID.<br> |
| `end_advertiser_name`<br><br>*string* | The name of the entity the ads will target.<br> |
| `existing_customers`<br><br>*list<string>* | The custom audience ids that are used by advertisers to define their existing customers. This definition is primarily used by Automated Shopping Ads.<br> |
| `expired_funding_source_details`<br><br>*[FundingSourceDetails](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account)* | `ID` = ID of the payment method<br><br>`COUPON` = Details of the Facebook Ads Coupon from the payment method<br><br>`COUPONS` = List of active Facebook Ads Coupon from the ad account<br><br>`COUPON_ID` = ID of the Facebook Ads Coupon<br><br>`AMOUNT` = Amount of Facebook Ads Coupon<br><br>`CURRENCY` = Currency of the Facebook Ads Coupon<br><br>`DISPLAY_AMOUNT` = How the amount of Facebook Ads Coupon is displayed<br><br>`EXPIRATION` = When the coupon expired<br><br>`START_DATE` = When the coupon started<br><br>`DISPLAY_STRING` = How the payment method is shown<br><br>`CAMPAIGN_IDS` = List of campaigns the coupon can be applied to, empty if the coupon is applied on the ad account level.<br><br>`ORIGINAL_AMOUNT` = Amount of Facebook Ads Coupon When Issued<br><br>`ORIGINAL_DISPLAY_AMOUNT` = How the Facebook Ads Coupon displayed When Issued<br><br>`TYPE` = Type of the funding source<br><br>`0 = UNSET`<br><br>`1 = CREDIT_CARD`<br><br>`2 = FACEBOOK_WALLET`<br><br>`3 = FACEBOOK_PAID_CREDIT`<br><br>`4 = FACEBOOK_EXTENDED_CREDIT`<br><br>`5 = ORDER`<br><br>`6 = INVOICE`<br><br>`7 = FACEBOOK_TOKEN`<br><br>`8 = EXTERNAL_FUNDING`<br><br>`9 = FEE`<br><br>`10 = FX`<br><br>`11 = DISCOUNT`<br><br>`12 = PAYPAL_TOKEN`<br><br>`13 = PAYPAL_BILLING_AGREEMENT`<br><br>`14 = FS_NULL`<br><br>`15 = EXTERNAL_DEPOSIT`<br><br>`16 = TAX`<br><br>`17 = DIRECT_DEBIT`<br><br>`18 = DUMMY`<br><br>`19 = ALTPAY`<br><br>`20 = STORED_BALANCE`<br><br><br>To access this field, the user making the API call must have a `MANAGE` task permission for that specific ad account. See [Ad Account, Assigned Users](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/assigned_users) for more information.<br> |
| `extended_credit_invoice_group`<br><br>*[ExtendedCreditInvoiceGroup](https://developers.facebook.com/docs/marketing-api/reference/extended-credit-invoice-group)* | The extended credit invoice group that the ad account belongs to<br> |
| `failed_delivery_checks`<br><br>*[list<DeliveryCheck>](https://developers.facebook.com/docs/marketing-api/adgroup/deliverychecks)* | Failed delivery checks<br> |
| `fb_entity`<br><br>*unsigned int32* | fb_entity<br> |
| `funding_source`<br><br>*numeric string* | ID of the payment method. If the account does not have a payment method it will still be possible to create ads but these ads will get no delivery. Not available if the account is disabled<br> |
| `funding_source_details`<br><br>*[FundingSourceDetails](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account)* | `ID` = ID of the payment method<br><br>`COUPON` = Details of the Facebook Ads Coupon from the payment method<br><br>`COUPONS` = List of active Facebook Ads Coupon from the ad account<br><br>`COUPON_ID` = ID of the Facebook Ads Coupon<br><br>`AMOUNT` = Amount of Facebook Ads Coupon<br><br>`CURRENCY` = Currency of the Facebook Ads Coupon<br><br>`DISPLAY_AMOUNT` = How the amount of Facebook Ads Coupon is displayed<br><br>`EXPIRATION` = When the coupon will expire<br><br>`START_DATE` = When the coupon starts<br><br>`DISPLAY_STRING` = How the payment method is shown<br><br>`CAMPAIGN_IDS` = List of campaigns the coupon can be applied to, empty if the coupon is applied on the ad account level.<br><br>`ORIGINAL_AMOUNT` = Amount of Facebook Ads Coupon When Issued<br><br>`ORIGINAL_DISPLAY_AMOUNT` = How the Facebook Ads Coupon displayed When Issued<br><br>`TYPE` = Type of the funding source<br><br>`0 = UNSET`<br><br>`1 = CREDIT_CARD`<br><br>`2 = FACEBOOK_WALLET`<br><br>`3 = FACEBOOK_PAID_CREDIT`<br><br>`4 = FACEBOOK_EXTENDED_CREDIT`<br><br>`5 = ORDER`<br><br>`6 = INVOICE`<br><br>`7 = FACEBOOK_TOKEN`<br><br>`8 = EXTERNAL_FUNDING`<br><br>`9 = FEE`<br><br>`10 = FX`<br><br>`11 = DISCOUNT`<br><br>`12 = PAYPAL_TOKEN`<br><br>`13 = PAYPAL_BILLING_AGREEMENT`<br><br>`14 = FS_NULL`<br><br>`15 = EXTERNAL_DEPOSIT`<br><br>`16 = TAX`<br><br>`17 = DIRECT_DEBIT`<br><br>`18 = DUMMY`<br><br>`19 = ALTPAY`<br><br>`20 = STORED_BALANCE`<br><br><br>To access this field, the user making the API call must have a `MANAGE` task permission for that specific ad account. See [Ad Account, Assigned Users](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/assigned_users) for more information.<br> |
| `has_migrated_permissions`<br><br>*bool* | Whether this account has migrated permissions<br> |
| `has_page_authorized_adaccount`<br><br>*bool* | Indicates whether a Facebook page has authorized this ad account to place ads with political content. If you try to place an ad with political content using this ad account for this page, and this page has not authorized this ad account for ads with political content, your ad will be disapproved. See [Breaking Changes, Marketing API, Ads with Political Content](https://developers.facebook.com/docs/graph-api/changelog/breaking-changes#4-23-2018) and [Facebook Advertising Policies](https://www.facebook.com/policies/ads)<br> |
| `io_number`<br><br>*numeric string* | The Insertion Order (IO) number.<br> |
| `is_attribution_spec_system_default`<br><br>*bool* | If the attribution specification of ad account is generated from system default values<br> |
| `is_direct_deals_enabled`<br><br>*bool* | Whether the account is enabled to run Direct Deals<br> |
| `is_in_3ds_authorization_enabled_market`<br><br>*bool* | If the account is in a market requiring to go through payment process going through 3DS authorization<br> |
| `is_notifications_enabled`<br><br>*bool* | Get the notifications status of the user for this ad account. This will return true or false depending if notifications are enabled or not<br> |
| `is_personal`<br><br>*unsigned int32* | Indicates if this ad account is being used for private, non-business purposes. This affects how value-added tax (VAT) is assessed. **Note:** This is not related to whether an ad account is attached to a business.<br> |
| `is_prepay_account`<br><br>*bool* | If this ad account is a prepay. Other option would be a postpay account.<br><br><br>To access this field, the user making the API call must have a `ADVERTISE` or `MANAGE` task permission for that specific ad account. See [Ad Account, Assigned Users](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/assigned_users) for more information.<br> |
| `is_tax_id_required`<br><br>*bool* | If tax id for this ad account is required or not.<br><br><br>To access this field, the user making the API call must have a `ADVERTISE` or `MANAGE` task permission for that specific ad account. See [Ad Account, Assigned Users](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/assigned_users) for more information.<br> |
| `line_numbers`<br><br>*list<integer>* | The line numbers<br> |
| `media_agency`<br><br>*numeric string* | The agency, this could be your own business. Must be a Facebook Page Alias, Facebook Page ID or an Facebook App ID. In absence of one, you can use `NONE` or `UNFOUND`.<br> |
| `min_campaign_group_spend_cap`<br><br>*numeric string* | The minimum required spend cap of Ad Campaign.<br> |
| `min_daily_budget`<br><br>*unsigned int32* | The minimum daily budget for this Ad Account<br> |
| `name`<br><br>*string* | Name of the account. If not set, the name of the first admin visible to the user will be returned.<br> |
| `offsite_clo_signal_status`<br><br>*int32* | offsite_clo_signal_status<br> |
| `offsite_pixels_tos_accepted`<br><br>*bool* | Indicates whether the offsite pixel Terms Of Service contract was signed. This feature can be accessible before v2.9<br> |
| `opportunity_score`<br><br>*float* | On a 0-100 point scale, this score represents how optimized the ad account's campaigns, ad sets and ads are overall.<br><br><br>See [Opportunity Score](https://web.facebook.com/business/tools/opportunity-score) to learn more.<br> |
| `opportunity_score_weight`<br><br>*integer* | This opportunity score weight represent the remaining budget for the ad account in cents, computed daily. This can be used with other ad accounts within the same business to compute the weighted opportunity score for a business.<br><br><br>See [Opportunity Score](https://web.facebook.com/business/tools/opportunity-score) to learn more about opportunity score.<br> |
| `owner`<br><br>*numeric string* | The ID of the account owner<br> |
| `partner`<br><br>*numeric string* | This could be Facebook Marketing Partner, if there is one. Must be a Facebook Page Alias, Facebook Page ID or an Facebook App ID. In absence of one, you can use `NONE` or `UNFOUND`.<br> |
| `rf_spec`<br><br>*ReachFrequencySpec* | Reach and Frequency limits configuration. [See Reach and Frequency](https://developers.facebook.com/docs/marketing-api/reachandfrequency)<br> |
| `show_checkout_experience`<br><br>*bool* | Whether or not to show the pre-paid checkout experience to an advertiser. If `true`, the advertiser is eligible for checkout, or they are already locked in to checkout and haven't graduated to postpay.<br> |
| `spend_cap`<br><br>*numeric string* | The maximum amount that can be spent by this Ad Account. When the amount is reached, all delivery stops. A value of `0` means no spending-cap. Setting a new spend cap only applies to spend **AFTER** the time at which you set it. Value specified in basic unit of the currency, for example 'cents' for `USD`.<br> |
| `tax_id`<br><br>*string* | Tax ID<br> |
| `tax_id_status`<br><br>*unsigned int32* | VAT status code for the account.<br>`0`: Unknown<br>`1`: VAT not required- US/CA<br>`2`: VAT information required<br>`3`: VAT information submitted<br>`4`: Offline VAT validation failed<br>`5`: Account is a personal account<br> |
| `tax_id_type`<br><br>*string* | Type of Tax ID<br> |
| `timezone_id`<br><br>*unsigned int32* | The [timezone ID](https://developers.facebook.com/docs/marketing-api/reference/ad-account/timezone-ids) of this ad account<br> |
| `timezone_name`<br><br>*string* | Name for the time zone<br> |
| `timezone_offset_hours_utc`<br><br>*float* | Time zone difference from UTC (Coordinated Universal Time).<br> |
| `tos_accepted`<br><br>*map<string, int32>* | Checks if this specific ad account has signed the Terms of Service contracts. Returns `1`, if terms were accepted.<br> |
| `user_tasks`<br><br>*list<string>* | user_tasks<br> |
| `user_tos_accepted`<br><br>*map<string, int32>* | Checks if a user has signed the Terms of Service contracts related to the Business that contains a specific ad account. Must include user's access token to get information. This verification is not valid for [system users](https://developers.facebook.com/docs/marketing-api/businessmanager/systemuser).<br> |

#### Edges

| Edge | Description |
| --- | --- |
| [`account_controls`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/account_controls)<br><br>*Edge<AdAccountBusinessConstraints>* | Account Controls is for Advantage+ shopping campaigns where advertisers can set audience controls for minimum age and excluded geo location.<br> |
| [`activities`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/activities)<br><br>*Edge<AdActivity>* | The activities of this ad account<br> |
| [`adcreatives`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adcreatives)<br><br>*Edge<AdCreative>* | The ad creatives of this ad account<br> |
| [`ads_reporting_mmm_reports`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ads_reporting_mmm_reports)<br><br>*Edge<AdsReportBuilderMMMReport>* | Marketing mix modeling (MMM) reports generated for this ad account.<br> |
| [`ads_reporting_mmm_schedulers`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ads_reporting_mmm_schedulers)<br><br>*Edge<AdsReportBuilderMMMReportScheduler>* | Get all MMM report schedulers by this ad account<br> |
| [`advertisable_applications`](https://developers.facebook.com/docs/marketing-api/reference/ad-account/advertisable_applications) This field is only accessible in v2.4 or later.<br><br>*Edge<Application>* | All advertisable apps associated with this account<br> |
| [`advideos`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/advideos)<br><br>*Edge<Video>* | The videos associated with this account<br> |
| [`applications`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/applications)<br><br>*Edge<Application>* | Applications connected to the ad accounts<br> |
| [`asyncadcreatives`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/asyncadcreatives)<br><br>*Edge<AdAsyncRequestSet>* | The async ad creative creation requests associated with this ad account.<br> |
| [`broadtargetingcategories`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/broadtargetingcategories)<br><br>*Edge<BroadTargetingCategories>* | Broad targeting categories (BCTs) can be used for targeting<br> |
| [`connected_instagram_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/connected_instagram_accounts)<br><br>*Edge<ShadowIGUser>* | Instagram accounts connected to the ad account<br> |
| [`customaudiences`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/customaudiences)<br><br>*Edge<CustomAudience>* | The custom audiences owned by/shared with this ad account<br> |
| [`customaudiencestos`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/customaudiencestos)<br><br>*Edge<CustomAudiencesTOS>* | The custom audiences term of services available to the ad account<br> |
| [`customconversions`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/customconversions)<br><br>*Edge<CustomConversion>* | The custom conversions owned by/shared with this ad account<br> |
| [`delivery_estimate`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/delivery_estimate)<br><br>*Edge<AdAccountDeliveryEstimate>* | The delivery estimate for a given ad set configuration for this ad account<br> |
| [`deprecatedtargetingadsets`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/deprecatedtargetingadsets)<br><br>*Edge<AdCampaign>* | Ad sets with deprecating targeting options for this ad account<br> |
| [`dsa_recommendations`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/dsa_recommendations)<br><br>*Edge<AdAccountDsaRecommendations>* | dsa_recommendations<br> |
| [`generatepreviews`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/generatepreviews)<br><br>*Edge<AdPreview>* | Generate previews for a creative specification<br> |
| [`impacting_ad_studies`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/impacting_ad_studies)<br><br>*Edge<AdStudy>* | The ad studies that contain this ad account or any of its descendant ad objects<br> |
| [`instagram_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/instagram_accounts)<br><br>*Edge<ShadowIGUser>* | Instagram accounts connected to the ad accounts<br> |
| [`mcmeconversions`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/mcmeconversions)<br><br>*Edge<AdsMcmeConversion>* | mcmeconversions<br> |
| [`minimum_budgets`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/minimum_budgets)<br><br>*Edge<MinimumBudget>* | Returns minimum daily budget values by currency<br> |
| [`promote_pages`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/promote_pages)<br><br>*Edge<Page>* | All pages that have been promoted under the ad account<br> |
| [`reachestimate`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/reachestimate)<br><br>*Edge<AdAccountReachEstimate>* | The reach estimate of a given [targeting spec](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting) for this ad                                account<br> |
| [`saved_audiences`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/saved_audiences)<br><br>*Edge<SavedAudience>* | Saved audiences in the account<br> |
| [`targetingbrowse`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/targetingbrowse)<br><br>*Edge<AdAccountTargetingUnified>* | Unified browse<br> |
| [`targetingsearch`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/targetingsearch)<br><br>*Edge<AdAccountTargetingUnified>* | Unified search<br> |
| [`targetingsuggestions`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/targetingsuggestions)<br><br>*Edge<AdAccountTargetingUnified>* | Unified suggestions<br> |
| [`targetingvalidation`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/targetingvalidation)<br><br>*Edge<AdAccountTargetingUnified>* | Unified validation<br> |

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |
| 613 | Calls to this api have exceeded the rate limit. |
| 100 | Invalid parameter |
| 190 | Invalid OAuth 2.0 Access Token |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 3018 | The start date of the time range cannot be beyond 37 months from the current date |
| 2500 | Error parsing graph query |
| 1150 | An unknown error occurred. |
| 2635 | You are calling a deprecated version of the Ads API. Please update to the latest version. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |

## Creating

To create a new ad account for your business you must specify `name`, `currency`, `timezone_id`, `end_advertiser`, `media_agency`, and `partner`. Provide `end_advertiser`, `media_agency`, and `partner`:

- They must be Facebook Page Aliases, Facebook Page ID or an Facebook app ID. For example, to provide your company as an end advertiser you specify my company or `20531316728`.

- The End Advertiser ID is the Facebook primary Page ID or Facebook app ID. Further reference to this field (for formatting and acceptable values) may be found [here](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/adaccount).

- If your ad account has no End Advertiser, Media Agency, or Partner, specify `NONE`.

- If your ad account has an End Advertiser, Media Agency, or Partner, that are not represented on Facebook by Page or app, specify `UNFOUND`.

**Once you set `end_advertiser` to a value other than `NONE` or `UNFOUND` you cannot change it.**

Create an ad account:

```
curl \
-F "name=MyAdAccount" \
-F "currency=USD" \
-F "timezone_id=1" \
-F "end_advertiser=<END_ADVERTISER_ID>" \
-F "media_agency=<MEDIA_AGENCY_ID>" \
-F "partner=NONE" \
-F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/adaccount"
```

If you have an extended credity line with Facebook, you can set `invoice` to `true` and we associate your new ad account to this credit line.

The response:

```
{
  "id": "act_<ADACCOUNT_ID>",
  "account_id": "<ADACCOUNT_ID>",
  "business_id": "<BUSINESS_ID>",
  "end_advertiser_id": "<END_ADVERTISER_ID>",
  "media_agency_id": "<MEDIA_AGENCY_ID>",
  "partner_id": "NONE"
}
```

### /act_{ad_account_id}/product_audiences
You can make a POST request to *product_audiences* edge from the following paths:

- [/act_{ad_account_id}/product_audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/product_audiences)

When posting to this edge, an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) will be created.

#### Example

### HTTP
```
POST /v25.0/act_<AD_ACCOUNT_ID>/product_audiences HTTP/1.1
Host: graph.facebook.com

name=Test+Iphone+Product+Audience&product_set_id=%3CPRODUCT_SET_ID%3E&inclusions=%5B%7B%22retention_seconds%22%3A86400%2C%22rule%22%3A%7B%22and%22%3A%5B%7B%22event%22%3A%7B%22eq%22%3A%22AddToCart%22%7D%7D%2C%7B%22userAgent%22%3A%7B%22i_contains%22%3A%22iPhone%22%7D%7D%5D%7D%7D%5D&exclusions=%5B%7B%22retention_seconds%22%3A172800%2C%22rule%22%3A%7B%22event%22%3A%7B%22eq%22%3A%22Purchase%22%7D%7D%7D%5D
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->post(
    '/act_<AD_ACCOUNT_ID>/product_audiences',
    array (
      'name' => 'Test Iphone Product Audience',
      'product_set_id' => '<PRODUCT_SET_ID>',
      'inclusions' => '[{"retention_seconds":86400,"rule":{"and":[{"event":{"eq":"AddToCart"}},{"userAgent":{"i_contains":"iPhone"}}]}}]',
      'exclusions' => '[{"retention_seconds":172800,"rule":{"event":{"eq":"Purchase"}}}]',
    ),
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
    "/act_<AD_ACCOUNT_ID>/product_audiences",
    "POST",
    {
        "name": "Test Iphone Product Audience",
        "product_set_id": "<PRODUCT_SET_ID>",
        "inclusions": "[{\"retention_seconds\":86400,\"rule\":{\"and\":[{\"event\":{\"eq\":\"AddToCart\"}},{\"userAgent\":{\"i_contains\":\"iPhone\"}}]}}]",
        "exclusions": "[{\"retention_seconds\":172800,\"rule\":{\"event\":{\"eq\":\"Purchase\"}}}]"
    },
    function (response) {
      if (response && !response.error) {
        /* handle the result */
      }
    }
);
```

### Android SDK
```
Bundle params = new Bundle();
params.putString("name", "Test Iphone Product Audience");
params.putString("product_set_id", "<PRODUCT_SET_ID>");
params.putString("inclusions", "[{\"retention_seconds\":86400,\"rule\":{\"and\":[{\"event\":{\"eq\":\"AddToCart\"}},{\"userAgent\":{\"i_contains\":\"iPhone\"}}]}}]");
params.putString("exclusions", "[{\"retention_seconds\":172800,\"rule\":{\"event\":{\"eq\":\"Purchase\"}}}]");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/act_<AD_ACCOUNT_ID>/product_audiences",
    params,
    HttpMethod.POST,
    new GraphRequest.Callback() {
        public void onCompleted(GraphResponse response) {
            /* handle the result */
        }
    }
).executeAsync();
```

### iOS SDK
```
NSDictionary *params = @{
  @"name": @"Test Iphone Product Audience",
  @"product_set_id": @"<PRODUCT_SET_ID>",
  @"inclusions": @"[{\"retention_seconds\":86400,\"rule\":{\"and\":[{\"event\":{\"eq\":\"AddToCart\"}},{\"userAgent\":{\"i_contains\":\"iPhone\"}}]}}]",
  @"exclusions": @"[{\"retention_seconds\":172800,\"rule\":{\"event\":{\"eq\":\"Purchase\"}}}]",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/act_<AD_ACCOUNT_ID>/product_audiences"
                                      parameters:params
                                      HTTPMethod:@"POST"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

### cURL
```
curl -X POST \
  -F 'name="Test Iphone Product Audience"' \
  -F 'product_set_id="<PRODUCT_SET_ID>"' \
  -F 'inclusions=[
       {
         "retention_seconds": 86400,
         "rule": {
           "and": [
             {
               "event": {
                 "eq": "AddToCart"
               }
             },
             {
               "userAgent": {
                 "i_contains": "iPhone"
               }
             }
           ]
         }
       }
     ]' \
  -F 'exclusions=[
       {
         "retention_seconds": 172800,
         "rule": {
           "event": {
             "eq": "Purchase"
           }
         }
       }
     ]' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/product_audiences
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=POST&path=act_%3CAD_ACCOUNT_ID%3E%2Fproduct_audiences%3Fname%3DTest%2BIphone%2BProduct%2BAudience%26product_set_id%3D%253CPRODUCT_SET_ID%253E%26inclusions%3D%255B%257B%2522retention_seconds%2522%253A86400%252C%2522rule%2522%253A%257B%2522and%2522%253A%255B%257B%2522event%2522%253A%257B%2522eq%2522%253A%2522AddToCart%2522%257D%257D%252C%257B%2522userAgent%2522%253A%257B%2522i_contains%2522%253A%2522iPhone%2522%257D%257D%255D%257D%257D%255D%26exclusions%3D%255B%257B%2522retention_seconds%2522%253A172800%252C%2522rule%2522%253A%257B%2522event%2522%253A%257B%2522eq%2522%253A%2522Purchase%2522%257D%257D%257D%255D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `associated_audience_id`<br><br>*int64* | SELF_EXPLANATORY<br> |
| `creation_params`<br><br>*dictionary { string : <string> }* | SELF_EXPLANATORY<br> |
| `description`<br><br>*string* | SELF_EXPLANATORY<br> |
| `enable_fetch_or_create`<br><br>*boolean* | enable_fetch_or_create<br> |
| `event_sources`<br><br>*array<JSON object>* | event_sources<br><br><br>`id` *int64*<br>id<br><br>**[required]**<br><br><br>`type` *enum {APP, OFFLINE_EVENTS, PAGE, PIXEL}*<br>type<br><br>**[required]**<br> |
| `exclusions`<br><br>*list<Object>* | SELF_EXPLANATORY<br><br><br>`booking_window` *Object*<br><br>`min_seconds` *int64*<br><br>`max_seconds` *int64*<br><br>`count` *Object*<br><br>`event` *string*<br><br>`type` *enum {CUSTOM, PRIMARY, WEBSITE, APP, OFFLINE_CONVERSION, CLAIM, MANAGED, PARTNER, VIDEO, LOOKALIKE, ENGAGEMENT, BAG_OF_ACCOUNTS, STUDY_RULE_AUDIENCE, FOX, MEASUREMENT, REGULATED_CATEGORIES_AUDIENCE, BIDDING, EXCLUSION, MESSENGER_SUBSCRIBER_LIST}*<br><br>`retention` *Object*<br><br>`min_seconds` *integer*<br>**[required]**<br><br><br>`max_seconds` *integer*<br>**[required]**<br><br><br>`retention_days` *int64*<br><br>`retention_seconds` *integer*<br><br>`rule` *Object*<br><br>`pixel_id` *int64* |
| `inclusions`<br><br>*list<Object>* | SELF_EXPLANATORY<br><br><br>`booking_window` *Object*<br><br>`min_seconds` *int64*<br><br>`max_seconds` *int64*<br><br>`count` *Object*<br><br>`event` *string*<br><br>`type` *enum {CUSTOM, PRIMARY, WEBSITE, APP, OFFLINE_CONVERSION, CLAIM, MANAGED, PARTNER, VIDEO, LOOKALIKE, ENGAGEMENT, BAG_OF_ACCOUNTS, STUDY_RULE_AUDIENCE, FOX, MEASUREMENT, REGULATED_CATEGORIES_AUDIENCE, BIDDING, EXCLUSION, MESSENGER_SUBSCRIBER_LIST}*<br><br>`retention` *Object*<br><br>`min_seconds` *integer*<br>**[required]**<br><br><br>`max_seconds` *integer*<br>**[required]**<br><br><br>`retention_days` *int64*<br><br>`retention_seconds` *integer*<br><br>`rule` *Object*<br><br>`pixel_id` *int64* |
| `name`<br><br>*string* | SELF_EXPLANATORY<br><br>**[required]**<br> |
| `opt_out_link`<br><br>*string* | SELF_EXPLANATORY<br> |
| `parent_audience_id`<br><br>*int64* | SELF_EXPLANATORY<br> |
| `product_set_id`<br><br>*numeric string or integer* | SELF_EXPLANATORY<br><br>**[required]**<br> |
| `subtype`<br><br>*enum {CUSTOM, PRIMARY, WEBSITE, APP, OFFLINE_CONVERSION, CLAIM, MANAGED, PARTNER, VIDEO, LOOKALIKE, ENGAGEMENT, BAG_OF_ACCOUNTS, STUDY_RULE_AUDIENCE, FOX, MEASUREMENT, REGULATED_CATEGORIES_AUDIENCE, BIDDING, EXCLUSION, MESSENGER_SUBSCRIBER_LIST}* | SELF_EXPLANATORY<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```
Struct  {
id: numeric string,
message: string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 2654 | Failed to create custom audience |

### /{custom_audience_id}/ad_accounts
You can make a POST request to *ad_accounts* edge from the following paths:

- [/{custom_audience_id}/ad_accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/ad_accounts)

When posting to this edge, an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `adaccounts`<br><br>*list<numeric string>* | Array of new ad account IDs to receive access to the custom audience<br> |
| `permissions`<br><br>*string* | `targeting` or `targeting_and_insights`. If `targeting` the recipient ad account can target the audience in ads.        `targeting_and_insights` also allows recipient account to view the        audience in Audience Insights tool<br> |
| `relationship_type`<br><br>*array<string>* | relationship_type<br> |
| `replace`<br><br>*boolean* | `true` or `false`. If `true` the list of `adaccounts`<br>provided in the call will replace the existing set of ad accounts<br>this audience is shared with.<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
success: bool,
sharing_data:  List  [ Struct  {
ad_acct_id: string,
business_id: numeric string,
audience_share_status: string,
errors:  List  [string],
}],
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 200 | Permissions error |

### /{business_id}/adaccount
You can make a POST request to *adaccount* edge from the following paths:

- [/{business_id}/adaccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/adaccount)

When posting to this edge, an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `ad_account_created_from_bm_flag`<br><br>*boolean* | ad_account_created_from_bm_flag<br> |
| `currency`<br><br>*ISO 4217 Currency Code* | The currency used for the account<br><br>**[required]**<br> |
| `end_advertiser`<br><br>** | The entity the ads will target. Must be a Facebook Page Alias, Facebook Page ID or an Facebook App ID. In absence of one, you can use `NONE` or `UNFOUND`. Note that once a value other than `NONE` or `UNFOUND` is set, it cannot be modified any more.<br><br>**[required]**<br> |
| `funding_id`<br><br>*numeric string or integer* | ID of the [payment method](https://developers.facebook.com/docs/marketing-api/businessmanager#invoice-funding). If the account does not have a payment method it will still be possible to create ads but these ads will get no delivery.<br> |
| `invoice`<br><br>*boolean* | If business manager has Business Manager Owned Normal Credit Line on file on the FB CRM, it will attach the ad account to that credit line.<br> |
| `invoice_group_id`<br><br>*numeric string* | The ID of the invoice group this adaccount should be enrolled in<br> |
| `invoicing_emails`<br><br>*array<string>* | Emails addressed where invoices will be sent.<br> |
| `io`<br><br>*boolean* | If corporate channel is direct sales.<br> |
| `media_agency`<br><br>*string* | The agency, this could be your own business. Must be a Facebook Page Alias, Facebook Page ID or an Facebook App ID. In absence of one, you can use `NONE` or `UNFOUND`<br><br>**[required]**<br> |
| `name`<br><br>*string* | The name of the ad account<br><br>**[required]**<br> |
| `partner`<br><br>*string* | The advertising partner for this account, if there is one. Must be a Facebook Page Alias, Facebook Page ID or an Facebook App ID. In absence of one, you can use `NONE` or `UNFOUND`.<br><br>**[required]**<br> |
| `po_number`<br><br>*string* | Purchase order number<br> |
| `timezone_id`<br><br>*unsigned int32* | ID for the timezone. See [here](https://developers.facebook.com/docs/marketing-api/reference/ad-account/timezone-ids).<br><br>**[required]**<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```
Struct  {
id: token with structure: AdAccount ID,
account_id: numeric string,
business_id: numeric string,
end_advertiser_id: string,
media_agency_id: string,
partner_id: string,
seer_ad_account_restricted_by_soft_desc_challenge: bool,
soft_desc_challenge_credential_id: string,
soft_desc_challenge_localized_auth_amount: int32,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 3979 | You have exceeded the number of allowed ad accounts for your Business Manager at this time. |
| 3980 | One or more of the ad accounts in your Business Manager are currently in bad standing or in review. All of your accounts must be in good standing in order to create new ad accounts. |
| 415 | Two factor authentication required. User have to enter a code from SMS or TOTP code generator to pass 2fac. This could happen when accessing a 2fac-protected asset like a page that is owned by a 2fac-protected business manager. |
| 3902 | There was a technical issue and your new ad account wasn't created. Please try again. |
| 457 | The session has an invalid origin |
| 190 | Invalid OAuth 2.0 Access Token |
| 23007 | This credit card can't be set as your account's primary payment method, because your account is set up to be billed after your ads have delivered. This setup can't be changed. Please try a different card or payment method. |

### /{business_id}/owned_ad_accounts
You can make a POST request to *owned_ad_accounts* edge from the following paths:

- [/{business_id}/owned_ad_accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/owned_ad_accounts)

When posting to this edge, an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `adaccount_id`<br><br>*string* | Ad account ID.<br><br>**[required]**<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
access_status: string,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 3979 | You have exceeded the number of allowed ad accounts for your Business Manager at this time. |
| 3994 | Personal accounts that do not have any history of activity are not eligible for migration to a business manager. Instead create an ad account inside your business manager. |
| 100 | Invalid parameter |
| 3980 | One or more of the ad accounts in your Business Manager are currently in bad standing or in review. All of your accounts must be in good standing in order to create new ad accounts. |
| 415 | Two factor authentication required. User have to enter a code from SMS or TOTP code generator to pass 2fac. This could happen when accessing a 2fac-protected asset like a page that is owned by a 2fac-protected business manager. |
| 3936 | You've already tried to claim this ad account. You'll see a notification if your request is accepted. |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 3944 | Your Business Manager already has access to this object. |

## Updating

**Notice:**

* The `default_dsa_payor` and `default_dsa_beneficiary` values can be set to both of them or none of them. The API does not allow only one of them to exist in the data storage.
* To unset the values: pass two empty strings at the same time, the values will be unset in the data storage. It does not allow you to unset only one of them.

### /act_{ad_account_id}
You can update an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) by making a POST request to [/act_{ad_account_id}](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account).

#### Parameters

| Parameter | Description |
| --- | --- |
| `agency_client_declaration`<br><br>*dictionary { string : <string> }* | Details of the agency advertising on behalf of this client account, if applicable. Requires Business Manager [Admin](https://www.facebook.com/business/help/442345745885606?id=180505742745347) privileges.<br> |
| `attribution_spec`<br><br>*list<Object>* | **Deprecated due to iOS 14 changes.** Please visit the [changelog](https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/jan-19-2021) for more information.<br><br><br>`event_type` *enum {CLICK_THROUGH, VIEW_THROUGH, ENGAGED_VIDEO_VIEW}*<br>**[required]**<br><br><br>`window_days` *int64*<br>**[required]**<br> |
| `business_info`<br><br>*dictionary { string : <string> }* | Business Info<br> |
| `custom_audience_info`<br><br>*JSON object* | Custom audience info for Automated Shopping Ads.<br><br><br>`new_customer_tag` *string*<br>Label value for new customer in Automated Shoppings Ad's custom audience type URL parameter.<br><br><br>`existing_customer_tag` *string*<br>Label value for existing customer in Automated Shoppings Ad's custom audience type URL parameter.<br><br><br>`audience_type_param_name` *string*<br>field name for audience type in Automated Shoppings Ad's custom audience type UTM parameter.<br> |
| `default_dsa_beneficiary`<br><br>*string* | This is the default value for creating L2 targeting EU's beneficiary.<br> |
| `default_dsa_payor`<br><br>*string* | This is the default value for creating L2 targeting EU's payor.<br> |
| `end_advertiser`<br><br>*string* | The entity the ads will target. Must be a Facebook Page Alias, Facebook Page ID or an Facebook App ID.<br> |
| `is_notifications_enabled`<br><br>*boolean* | If notifications are enabled or not for this account<br> |
| `media_agency`<br><br>*string* | The ID of a Facebook Page or Facebook App. Once it is set to any values other than `NONE` or `UNFOUND`, it cannot be modified any more<br> |
| `name`<br><br>*string* | The name of the ad account<br> |
| `partner`<br><br>*string* | The ID of a Facebook Page or Facebook App. Once it is set to any values other than `NONE` or `UNFOUND`, it cannot be modified any more<br> |
| `spend_cap`<br><br>*float* | The total amount that this account can spend, after which all campaigns will be paused, based on `amount_spent`. A value of 0 signifies no spending-cap and setting a new spend cap only applies to spend AFTER the time at which you set it. Value specified in standard denomination of the currency, e.g. 23.50 for USD $23.50.<br> |
| `spend_cap_action`<br><br>*string* | Setting this parameter to `reset` sets the `amount_spent` back to 0. Setting it to `delete` removes the `spend_cap` from the account.<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 368 | The action attempted has been deemed abusive or is otherwise disallowed |
| 190 | Invalid OAuth 2.0 Access Token |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |

### /act_{ad_account_id}/assigned_users
You can update an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) by making a POST request to [/act_{ad_account_id}/assigned_users](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/assigned_users).

#### Parameters

| Parameter | Description |
| --- | --- |
| `tasks`<br><br>*array<enum {MANAGE, ADVERTISE, ANALYZE, DRAFT, AA_ANALYZE}>* | AdAccount permission tasks to assign this user<br> |
| `user`<br><br>*UID* | Business user id or system user id<br><br>**[required]**<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node to which you POSTed.

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 200 | Permissions error |
| 2620 | Invalid call to update account permissions |

## Deleting

### /{ads_pixel_id}/shared_accounts
You can dissociate an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) from an [AdsPixel](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel) by making a DELETE request to [/{ads_pixel_id}/shared_accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ads-pixel/shared_accounts).

#### Parameters

| Parameter | Description |
| --- | --- |
| `account_id`<br><br>*numeric string* | SELF_EXPLANATORY<br><br>**[required]**<br> |
| `business`<br><br>*numeric string or integer* | SELF_EXPLANATORY<br><br>**[required]**<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

### /{custom_audience_id}/ad_accounts
You can dissociate an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) from a [CustomAudience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience) by making a DELETE request to [/{custom_audience_id}/ad_accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/ad_accounts).

#### Parameters

| Parameter | Description |
| --- | --- |
| `adaccounts`<br><br>*list<numeric string>* | Array of ad account IDs to revoke access to the custom audience<br> |

#### Return Type

```
Struct  {
success: bool,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |

