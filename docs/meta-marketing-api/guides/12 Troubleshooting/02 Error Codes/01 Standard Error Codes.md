<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/error-reference | Saved: 2026-09-19 -->

# Error Codes



The following are error codes returned by the API:

| Error Code | Description |
| --- | --- |
| `-` | Negative-value error codes are internal Facebook errors. Check `error_subcode` for the actual failure code. |
| `1` | An unknown error occurred. |
| `1`, subcode `99` | An unknown error occurred. This error may occur if you set `level` to `adset` but the correct value should be `campaign`. |
| `4` | Application request limit reached. |
| `10` | Application does not have permission for this action. |
| `17` | User request limit reached. |
| `100` | Invalid parameter. |
| `100`, subcode `33` | Unsupported post request.<br><br>This error may occur if your access token is not added as a [system user with appropriate permissions](https://developers.facebook.com/docs/marketing-api/businessmanager/systemuser) to the ad account that owns a Custom Audience. Verify the ad account in [Meta Business Suite](https://business.facebook.com/home/accounts) and verify all system users appear under the ad account as `Admin`:<br><br>- Click on `Business Settings`<br>- Click the ad account<br>- Select `Add people`<br>- Search for system user and add them as Admins<br>- Retry your API call |
| `100`, subcode `1487694` | Invalid parameter.<br><br>The category you selected is no longer available. Several behavior-based targeting categories are deprecated. If you try to use them to create ads, your requests fails and returns this error. Use [Targeting Search](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search) to see categories available for targeting. |
| `100`, subcode `1752129` | Invalid parameter.<br><br>This Task Combination Is Not Supported. To assign a user for this ad account valid capabilities, you should pass in a combination of tasks defined in the mapping. See [Meta Business Suite API, Permitted Roles](https://developers.facebook.com/docs/marketing-api/businessmanager/assets#roles). |
| `100`, subcode `3858258` | Image wasn't downloaded.<br><br>Your image, <IMAGE_URL>, couldn't be downloaded. Please ensure the image is accessible via the internet and is not blocked by a robots.txt.<br><br>The image may not be accessible online or is being blocked by a robots.txt file. Add a disallow to robots.txt for the relevant crawler. See [Meta Web Crawlers - The robots.txt file](https://developers.facebook.com/docs/sharing/webmasters/web-crawlers#identify-4) for more information. |
| `102` | Session key invalid or no longer valid. |
| `104` | Incorrect signature. |
| `190` | Invalid OAuth 2.0 Access Token. |
| `200` | Permission error. |
| `200`, subcode `1870034` | Custom Audience Terms Not Accepted: You'll need to agree to the Custom Audience terms before you can create or edit an audience or an ad set. See [Facebook, Custom Audience Terms](https://www.facebook.com/ads/manage/customaudiences/tos) |
| `200`, subcode `1870047` | Audience Size too Low: You cannot remove users from this audience because it will result in a low audience size and may result in under-delivery or non-delivery of your ads. |
| `294` | Managing advertisements requires the extended permission `ads_management` and an application that is in our allow list to access the Marketing API. |
| `2606` | Unable to display a preview of this ad. |
| `2607` | The given currency is invalid for use with ads. |
| `2615` | Invalid call to update this adaccount. |
| `2654` | Failed to create custom audience. |
| `2654` subcode `1713092` | No write permission for this ad account. Developer making this call must have permissions for the ad account to create an audience for it. |
| `5000` | Unknown error code. |
| `1340029` | Currently deletion of Dynamic Creative Ad is not allowed. Please proceed by deleting parent Ad Set |
| `1373054` | No Call To Action Type was parseable. Please refer to the call to action api documentation |
| `1404078` | You have been temporarily blocked from performing this action. |
| `1404163` | You're no longer allowed to use Facebook Products to advertise. You can't run ads, manage advertising assets or create new ad or business accounts. [Learn More](https://www.facebook.com/accountquality/advertising_access?enforcement=1) |
| `1487007` | You can't edit this ad because it's part of a scheduled ad set that has reached its end date. Please go to the Budget and Schedule section of the ad set and change the end date to a date in the future and then try your edits again. |
| `1487033` | Your campaign's end date must be in the future. Please choose a different end date and try again. |
| `1487056` | This ad set has been deleted, so you can only edit the name. If you want to edit other fields, you can duplicate this ad set, which will create a new ad set with the same settings that you can then edit. |
| `1487472` | You are using {msg}, which can't be promoted in an ad. Please choose a different Page post to continue. |
| `1487566` | This campaign has been deleted, so you can only edit the name. If you want to edit other fields, you can duplicate this campaign, which will create a new campaign with the same settings that you can then edit. |
| `1487678` | The app you're trying to create an ad for is on a different operating system than targeting settings for this ad set. |
| `1487831` | Your product set cannot be loaded. It may be non-existent or inaccessible due to privacy reasons. |
| `1487929` | The object you are trying to promote is ambiguous. You must specify only one promoted object. |
| `1487990` | This Ad Account has already too many archived adgroups. You need to delete some of them before being able to archive any more. |
| `1815199` | Ad account has no access to this Instagram account. Please use authorized Instagram account or assign ad account to this Instagram account first. |
| `1815629` | All ad asset values should be unique. Please check your values. |
| `1815694` | The user does not have the permission for this action. |
| `1870065` | This can't be used because it contains at least one audience that was disabled. Disabled audiences were shared by accounts that are no longer active. To fix this issue, remove the affected audiences |
| `1870088` | Connection targeting is being deprecated. Please remove connections from your campaign to publish your campaign. |
| `1870090` | To create or edit audience or ad set, please agree to the Custom Audience terms. |
| `1870092` | To create or edit audience or ad set, please agree to the Meta Business Tools terms |
| `1870165` | Your audience contains targeting options that can no longer be used to target ads to people under 18 globally, 20 in Thailand or 21 in Indonesia. Increase the minimum age of your audience or remove all targeting options apart from location, age, and gender. |
| `1870199` | All location targeting will now reach people living in or recently in the locations you selected. Please remove all values from the `location_types` field. |
| `1870219` | Only employer exclusions are allowed to be saved in account control. The API returns this error if you try to save anything other than employer exclusions. |
| `1870220` | If you are trying to save more than the allowed number of employer exclusions then this error will be thrown. |
| `1885029` | The Page selected for your ad doesn't match the Page associated with the object you're promoting, like a Page post or app. Please make sure the Pages are the same. |
| `1885088` | This ad has been archived and can not be edited. Only name is allowed to be edited for this ad. If you want to edit other fields, you can duplicate this ad, which will create a new ad with the same settings that you can then edit. |
| `1885183` | Ads creative post was created by an app that is in development mode. It must be in public to create this ad. |
| `1885204` | You need to set your bid to automatic for the chosen optimization. Remove any billing or bid info or change your optimization. |
| `1885272` | Budget is too low. |
| `1885557` | Your ad is promoting an unavailable post. It is either deleted, unpublished, not owned by the ad's page or you do not have permissions to see or promote it. |
| `1885621` | You can only set an ad set budget or a campaign budget. |
| `1885650` | Your budget is too low. This minimum amount is required to account for any spending that occurs while your budget is updated, which may take up to 15 minutes. |
| `2238055` | You cannot pass both `instagram_user_id` and `instagram_actor_id` or `instagram_story_id` and `source_instagram_media_id` in creative spec |
| `2446149` | You cannot pass both `instagram_user_id` and `instagram_actor_id` or `instagram_story_id` and `source_instagram_media_id` in creative spec |
| `2446307` | Campaign group spend cap is less than minimum. |
| `2238055` | Your campaign budget must be at least `{minimum_budget}` to account for all ad sets in this campaign. |
| `2446173` | Target rule label with name {label} doesn't refer to any of the asset labels. Please fix it by removing all ad creatives. |
| `2446289` | The `{post_type}` you selected for your ad is not available. It could be deleted or you might not have permissions to see it. Please check your ad creative and try again. |
| `2446347` | The ad of an existing post should have the flag `use_existing_post` (default rule in `asset_feed_spec:target_rules`) set to true. This is part of the POST request to the server, not something that can be done through the UI. |
| `2446383` | Your campaign objective requires an external website URL. Select a call to action and enter a website URL in the ad creative section. |
| `2446394` | This ad set includes detailed targeting options that are either no longer available or aren't available when excluding people from an audience. You may need to remove items from your detailed targeting or confirm the changes to turn it back on. |
| `2446509` | The ad campaign destination type is not valid. |
| `2446580` | Cannot specify both components and `child_attachments` field when providing `interactive_components_spec` params |
| `2446712` | The ability to create or run an ad set with store visits optimization is no longer available. Choose the reach or store sales optimization instead. |
| `2446867` | You've already reached the limit of `{campaigns_per_country_cap}` Advantage+ Shopping Campaigns for the following countries: `{country_names}`. If you'd like to create additional campaigns for these countries, use a standard conversions campaign. |
| `2446880` | The WhatsApp number connected to your Facebook page or Instagram profile was disconnected. You can run this ad again when you reconnect your WhatsApp account. |
| `2490085` | The `191x100` crop key will no longer be available in the newest Ads API version. The recommended crop key will be `100x100`. |
| `2490155` | The post associated with your ad is not available. It may have been removed, or you might not have permission to view it. |
| `2490372` | You need to choose a shop destination in order to continue. |
| `2490427` | Your ad has been rejected in its latest review and is currently disabled. In order to enable the ad, you will need to make updates to it and create a new ad. |
| `2490468` | Your ad has been rejected in its latest review and is currently disabled. In order to enable the ad, you will need to make updates to it and create a new ad. |
| `2708008` | You haven't been authorized to run ads about social issues, elections, or politics. Please have an authorized ad account user place this ad, or [complete the ID confirmation process](https://www.facebook.com/id) yourself. |
| `2859015` | You have been temporarily blocked from performing this action. |
| `3858064` | This campaign contains options that can no longer be used in campaigns with audiences under age 18 globally, 20 in Thailand or 21 in Indonesia. Increase the minimum age of your audience or remove all targeting options except for age and locations that are cities or larger (excluding postal codes). |
| `3858082` | This creative is eligible for Standard Enhancements, but enroll_status was not provided. Please choose whether you want to turn on standard enhancements or not. Learn more [here](https://fburl.com/hyth50xo) |
| `3858152` | This ad belongs to an ad set that must be published with beneficiary and payer information. Go to the ad set to add or review this information, and then click "Publish". |
| `3867105` | This content can't be used for your partnership ad. Select different content. |
| `3910001` | Your account is experiencing some trouble. Please try again later. |

**Warning:** Error handling should be done using only the Error Codes. The Description string is subject to change without prior notice.

## `blame_field_specs` {#blame_field_specs}

This is a property included in the `error_data` blob of any API call that results in a validation error, which indicates which field(s) is at fault for the validation error. This can be used to provide contextual errors, e.g. displaying an error right next to the field(s) at fault in the GUI of an ad creation tool.

`blame_field_specs` is an array, where each element of the array is a `blame_field_spec` which indicates a single field from the API spec that is at fault.

A `blame_field_spec` itself is an array also, which indicates the name of the field that is at fault and the location of this field within the overall API spec provided.

### Examples

#### Single field at fault

```
{
  "error":{
    "type":"Exception",
    "message":"The budget for your Ad-Set is too low.  It must be at least $1.00 per day.",
    "code":1487901,
    "is_transient":false,
    "error_data":{
      "blame_field_specs":[
        ["daily_budget"]
      ]
    }
  }
}
```

Indicates that the `daily_budget` field of the API spec is at fault and in this case it was too low.

#### Multiple fields at fault

```
"blame_field_specs":[
  ["targeting_spec", "interested_in"],
  ["bid_info", "impressions"]
]
```

Indicates that there is an error related to the `interested_in` subfield within the `targeting_spec` field of the API spec, and the error is also related to field `impressions` within the `bid_info` field of the API spec.
