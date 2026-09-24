<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative/previews | Saved: 2026-09-19 -->

# Ad Creative, Preview



Preview your ad's creative.

### Breaking Change: Event Ads, Link Ads not Associated with Valid Page

We recently announced an initiative to make the Facebook Advertising platform more transparent to Facebook users. Read more about this in the [Facebook press release](https://newsroom.fb.com/news/2017/10/improving-enforcement-and-transparency/)

**To support this initiative, we are deprecating deprecating Event Ads and Link Ads that are not connected to a valid page from Marketing API.**

This breaking change impacts all supported API versions, including the upcoming Marketing API version v2.11, and v2.10 and v2.9 which are available but will be deprecated. This breaking change will take effect the second week of November 2017.

**You will no longer be able to create or edit Event Ads and Link Ads that are not connected to a valid page. Requests will do so return the error:**
`ErrorCode::ADPRO2__AD_MUST_HAVE_PAGE (1885833)`

The following ad options used together will fail:

- Event Ads

- Objective: `EVENT_RESPONSES`

- Creative fields: `body`, `object_id`

- Link Ads

- Objective: `LINK_CLICKS`

- Creative fields: `title`, `body`, `object_url` containing `image_file` or `image_hash`

You can still create Event Ads and Link Ads if you provide a valid `actor_id` in the ad creative's `object_story_id` or `object_story_spec` fields

These options used together are valid:

- Event Ads

- Objective: `EVENT_RESPONSES`

- Creative fields: `object_story_id` or `object_story_spec`

- Link Ads

- Objective: `LINK_CLICKS`

- Creative fields: `object_story_id` or `object_story_spec`

The nodes, edges and requests impacted are:

- [`ad_ACCOUNT_ID/ads`, Create](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)

- [`ad_ACCOUNT_ID/adcreatives`, Create](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative)

- [`/ad_ID`, Update](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)

Any pre-existing Event or Link Ads continue to run but you cannnot modify these ad's creatives or create new ads with the invalid options once the change goes in effect.

## Reading

The HTML Snippets for previewing this creative

**Warning:** When using a Page Post whose link points to an app on the Google Play Store e.g. (https://play.google.com/store/apps/details?id=com.my.app) or an app on the Apple App Store eg  (https://itunes.apple.com/en/app/myapp/id1234567890) Facebook will override/import the following fields:

- the `name` parameter of the Page Post will be overwritten with the name of the app from the Play Store/App Store.

- the thumbnail icon of the app associated with the Page Post will be imported from the Play Store/App Store.

**Note:** Only certain combinations of creatives and `ad_format` are supported:

- Link ad not connected to a page: RIGHT_COLUMN_STANDARD

- Page like ad: RIGHT_COLUMN_STANDARD, DESKTOP_FEED_STANDARD, MOBILE_FEED_STANDARD

- Event ad: RIGHT_COLUMN_STANDARD

- Page like ad: RIGHT_COLUMN_STANDARD

- Page post ad: RIGHT_COLUMN_STANDARD, DESKTOP_FEED_STANDARD, MOBILE_FEED_STANDARD, INSTAGRAM_STANDARD, INSTAGRAM_STORY

- Desktop app ad: DESKTOP_FEED_STANDARD

- Mobile app install: MOBILE_FEED_STANDARD, INSTAGRAM_STANDARD, INSTAGRAM_STORY, MOBILE_BANNER, MOBILE_INTERSTITIAL

#### Example

### HTTP
```
GET /v25.0/<CREATIVE_ID>/previews?ad_format=DESKTOP_FEED_STANDARD&product_item_ids=%5B%22%3CPRODUCT_ITEM_ID%3E%22%5D HTTP/1.1
Host: graph.facebook.com
```

### PHP SDK
```
/* PHP SDK v5.0.0 */
/* make the API call */
try {
  // Returns a `Facebook\FacebookResponse` object
  $response = $fb->get(
    '/<CREATIVE_ID>/previews?ad_format=DESKTOP_FEED_STANDARD&product_item_ids=%5B%22%3CPRODUCT_ITEM_ID%3E%22%5D',
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
    "/<CREATIVE_ID>/previews",
    {
        "ad_format": "DESKTOP_FEED_STANDARD",
        "product_item_ids": "[\"<PRODUCT_ITEM_ID>\"]"
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
params.putString("ad_format", "DESKTOP_FEED_STANDARD");
params.putString("product_item_ids", "[\"<PRODUCT_ITEM_ID>\"]");
/* make the API call */
new GraphRequest(
    AccessToken.getCurrentAccessToken(),
    "/<CREATIVE_ID>/previews",
    params,
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
NSDictionary *params = @{
  @"ad_format": @"DESKTOP_FEED_STANDARD",
  @"product_item_ids": @"[\"<PRODUCT_ITEM_ID>\"]",
};
/* make the API call */
FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                               initWithGraphPath:@"/<CREATIVE_ID>/previews"
                                      parameters:params
                                      HTTPMethod:@"GET"];
[request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection,
                                      id result,
                                      NSError *error) {
    // Handle the result
}];
```

### cURL
```
curl -X GET -G \
  -d 'ad_format="DESKTOP_FEED_STANDARD"' \
  -d 'product_item_ids=[
       "<PRODUCT_ITEM_ID>"
     ]' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<CREATIVE_ID>/previews
```

Try it in [Graph API Explorer](https://developers.facebook.com/tools/explorer/?method=GET&path=%3CCREATIVE_ID%3E%2Fpreviews%3Fad_format%3DDESKTOP_FEED_STANDARD%26product_item_ids%3D%255B%2522%253CPRODUCT_ITEM_ID%253E%2522%255D&version=v25.0)

If you want to learn how to use the Graph API, read our [Using Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api)

#### Parameters

| Parameter | Description |
| --- | --- |
| `ad_format`<br><br>*enum{AUDIENCE_NETWORK_INSTREAM_VIDEO, AUDIENCE_NETWORK_INSTREAM_VIDEO_MOBILE, AUDIENCE_NETWORK_OUTSTREAM_VIDEO, AUDIENCE_NETWORK_REWARDED_VIDEO, BIZ_DISCO_FEED_MOBILE, DESKTOP_FEED_STANDARD, FACEBOOK_IFU_REELS_MOBILE, FACEBOOK_PROFILE_FEED_DESKTOP, FACEBOOK_PROFILE_FEED_MOBILE, FACEBOOK_PROFILE_REELS_MOBILE, FACEBOOK_REELS_BANNER, FACEBOOK_REELS_BANNER_DESKTOP, FACEBOOK_REELS_BANNER_FEED_ANDROID, FACEBOOK_REELS_BANNER_FEED_ANDROID_LARGE, FACEBOOK_REELS_BANNER_FULLSCREEN_IOS, FACEBOOK_REELS_BANNER_FULLSCREEN_MOBILE, FACEBOOK_REELS_MOBILE, FACEBOOK_REELS_POSTLOOP, FACEBOOK_REELS_POSTLOOP_FEED, FACEBOOK_REELS_SIMILAR_PRODUCTS_MOBILE, FACEBOOK_REELS_STICKER, FACEBOOK_STORY_MOBILE, FACEBOOK_STORY_STICKER_MOBILE, INSTAGRAM_EXPLORE_CONTEXTUAL, INSTAGRAM_EXPLORE_GRID_HOME, INSTAGRAM_EXPLORE_IMMERSIVE, INSTAGRAM_FEED_WEB, INSTAGRAM_FEED_WEB_M_SITE, INSTAGRAM_LEAD_GEN_MULTI_SUBMIT_ADS, INSTAGRAM_PROFILE_FEED, INSTAGRAM_PROFILE_REELS, INSTAGRAM_REELS, INSTAGRAM_REELS_OVERLAY, INSTAGRAM_REELS_WEB, INSTAGRAM_REELS_WEB_M_SITE, INSTAGRAM_SEARCH_CHAIN, INSTAGRAM_SEARCH_GRID, INSTAGRAM_STANDARD, INSTAGRAM_STORY, INSTAGRAM_STORY_EFFECT_TRAY, INSTAGRAM_STORY_WEB, INSTAGRAM_STORY_WEB_M_SITE, INSTANT_ARTICLE_RECIRCULATION_AD, INSTANT_ARTICLE_STANDARD, INSTREAM_BANNER_DESKTOP, INSTREAM_BANNER_FEED_IOS, INSTREAM_BANNER_FULLSCREEN_IOS, INSTREAM_BANNER_FULLSCREEN_MOBILE, INSTREAM_BANNER_IMMERSIVE_MOBILE, INSTREAM_BANNER_MOBILE, INSTREAM_VIDEO_DESKTOP, INSTREAM_VIDEO_FULLSCREEN_IOS, INSTREAM_VIDEO_FULLSCREEN_MOBILE, INSTREAM_VIDEO_IMAGE, INSTREAM_VIDEO_IMMERSIVE_MOBILE, INSTREAM_VIDEO_MOBILE, JOB_BROWSER_DESKTOP, JOB_BROWSER_MOBILE, MARKETPLACE_MOBILE, MESSENGER_MOBILE_INBOX_MEDIA, MESSENGER_MOBILE_STORY_MEDIA, MOBILE_BANNER, MOBILE_FEED_BASIC, MOBILE_FEED_STANDARD, MOBILE_FULLWIDTH, MOBILE_INTERSTITIAL, MOBILE_MEDIUM_RECTANGLE, MOBILE_NATIVE, RIGHT_COLUMN_STANDARD, SUGGESTED_VIDEO_DESKTOP, SUGGESTED_VIDEO_FULLSCREEN_MOBILE, SUGGESTED_VIDEO_IMMERSIVE_MOBILE, SUGGESTED_VIDEO_MOBILE, WATCH_FEED_HOME, WATCH_FEED_MOBILE, WHATSAPP_STATUS_MEDIA}* | Use this to select what placement on Facebook the ad preview should be for. The API returns an iframe, which is only valid for 24 hours.<br><br>**[required]**<br> |
| `creative_feature`<br><br>*enum{ig_video_native_subtitle, image_animation, product_browsing, product_metadata_automation, profile_card, standard_enhancements_catalog, text_overlay_translation}* | Creative feature to see previews for<br> |
| `dynamic_asset_label`<br><br>*string* | Provide a label for rendering specific variation of an asset customization ad<br> |
| `dynamic_creative_spec`<br><br>*Object* | Dynamic creative spec for dynamic ads.<br><br>**[supports emoji]**<br> |
| `dynamic_customization`<br><br>*Object* | For dynamic ads in multiple languages, specify the customization to be applied to the ad<br> |
| `end_date`<br><br>*datetime* | Provide an end date for trip.* parameters in the creative<br> |
| `height`<br><br>*int64* | Custom height of the resulting iframe, recommended at least 280 x 280 for the large right hand size height.<br>Note: the parameter affects only the size of the iframe containing the preview object. It has no affect on the actual size of the previewed ad.<br> |
| `place_page_id`<br><br>*Page ID* | Place page ID to use when rendering a dynamic local ad preview<br> |
| `post`<br><br>*Object* | Specs for a page post. This field is used when the creative field contains only a Page id as `object_id` in it. Not supported for `ad_format = RIGHT_COLUMN_STANDARD`<br><br><br>`link` *URL*<br>Destination URL of the ad<br><br>**[required]**<br><br><br>`message` *UTF-8 string*<br>Post message<br><br>**[supports emoji]**<br><br><br>`picture` *URL*<br>Image URL<br><br><br>`name` *UTF-8 encoded string*<br>Post name<br><br><br>`caption` *UTF-8 encoded string*<br>Post caption<br><br><br>`description` *UTF-8 encoded string*<br>Post description<br><br><br>`call_to_action` *Object*<br>Call to action<br><br>**[supports emoji]**<br><br><br>`type` *enum{BOOK_TRAVEL, CONTACT_US, DONATE, DONATE_NOW, DOWNLOAD, GET_DIRECTIONS, GO_LIVE, INTERESTED, LEARN_MORE, SEE_DETAILS, LIKE_PAGE, MESSAGE_PAGE, RAISE_MONEY, SAVE, SEND_TIP, SHOP_NOW, SIGN_UP, VIEW_INSTAGRAM_PROFILE, INSTAGRAM_MESSAGE, LOYALTY_LEARN_MORE, PURCHASE_GIFT_CARDS, PAY_TO_ACCESS, SEE_MORE, TRY_IN_CAMERA, WHATSAPP_LINK, GET_IN_TOUCH, TRY_NOW, ASK_A_QUESTION, START_A_CHAT, CHAT_NOW, ASK_US, CHAT_WITH_US, BOOK_NOW, CHECK_AVAILABILITY, ORDER_NOW, WHATSAPP_MESSAGE, GET_MOBILE_APP, INSTALL_MOBILE_APP, USE_MOBILE_APP, INSTALL_APP, USE_APP, PLAY_GAME, TRY_DEMO, WATCH_VIDEO, WATCH_MORE, OPEN_LINK, NO_BUTTON, LISTEN_MUSIC, MOBILE_DOWNLOAD, GET_OFFER, GET_OFFER_VIEW, BUY_NOW, BUY_TICKETS, UPDATE_APP, BET_NOW, ADD_TO_CART, SELL_NOW, GET_SHOWTIMES, LISTEN_NOW, GET_EVENT_TICKETS, REMIND_ME, SEARCH_MORE, PRE_REGISTER, SWIPE_UP_PRODUCT, SWIPE_UP_SHOP, PLAY_GAME_ON_FACEBOOK, VISIT_WORLD, OPEN_INSTANT_APP, JOIN_GROUP, GET_PROMOTIONS, SEND_UPDATES, INQUIRE_NOW, VISIT_PROFILE, CHAT_ON_WHATSAPP, EXPLORE_MORE, CONFIRM, JOIN_CHANNEL, MAKE_AN_APPOINTMENT, ASK_ABOUT_SERVICES, BOOK_A_CONSULTATION, GET_A_QUOTE, BUY_VIA_MESSAGE, ASK_FOR_MORE_INFO, VIEW_PRODUCT, VIEW_CHANNEL, WATCH_LIVE_VIDEO, JOIN_LIVE_VIDEO, IMAGINE, CALL, MISSED_CALL, CALL_NOW, CALL_ME, APPLY_NOW, BUY, GET_QUOTE, SUBSCRIBE, RECORD_NOW, VOTE_NOW, GIVE_FREE_RIDES, REGISTER_NOW, OPEN_MESSENGER_EXT, EVENT_RSVP, CIVIC_ACTION, SEND_INVITES, REFER_FRIENDS, REQUEST_TIME, SEE_MENU, SEARCH, TRY_IT, TRY_ON, LINK_CARD, DIAL_CODE, FIND_YOUR_GROUPS, START_ORDER}*<br>The type of the action. Not all types can be used for all<br>ads. Check<br>[Ads Product Guide](https://www.facebook.com/business/ads-guide)<br>to see which type can be used for based on the `objective` of your<br>campaign.<br><br>**[required]**<br><br><br>`value` *Object*<br><br>**Default value: **`Vec`<br>JSON containing the call to action data.<br><br>**[supports emoji]**<br><br><br>`android_url` *string*<br><br>`ios_url` *string*<br><br>`link` *URL*<br><br>`app_link` *string*<br><br>`page` *numeric string or integer*<br><br>`link_format` *enum {VIDEO_LEAD, VIDEO_LPP, VIDEO_NEKO, VIDEO_NON_LINK, VIDEO_SHOP, WHATSAPP_CATALOG_ATTACHMENT}*<br><br>`application` *numeric string or integer*<br><br>`link_title` *string*<br>**[supports emoji]**<br><br><br>`link_description` *string*<br>**[supports emoji]**<br><br><br>`link_caption` *string*<br><br>`product_link` *string*<br><br>`get_movie_showtimes` *boolean*<br><br>`sponsorship` *Object*<br><br>`link` *URL*<br><br>`image` *URL*<br><br>`video_annotation` *Object*<br><br>`annotations` *list<Object>*<br><br>`start_time_in_sec` *int64*<br><br>`end_time_in_sec` *int64*<br><br>`link` *URL*<br><br>`link_title` *string*<br><br>`link_description` *string*<br><br>`link_caption` *string*<br><br>`image_url` *URL*<br><br>`header_color` *string*<br><br>`logo_url` *URL*<br><br>`post_click_cta_title` *string*<br><br>`post_click_description_title` *string*<br><br>`offer_id` *numeric string or integer*<br><br>`offer_view_id` *numeric string or integer*<br><br>`advanced_data` *Object*<br><br>`offer_id` *numeric string or integer*<br><br>`lead_gen_form_id` *numeric string or integer*<br><br>`referral_id` *numeric string or integer*<br><br>`search_dialog_id` *numeric string or integer*<br><br>`fundraiser_campaign_id` *numeric string or integer*<br><br>`event_id` *numeric string or integer*<br><br>`event_tour_id` *numeric string or integer*<br><br>`app_destination` *enum {MESSENGER, MESSENGER_EXTENSIONS, MESSENGER_GAMES, LINK_CARD, MARKETPLACE, WHATSAPP, INSTAGRAM_DIRECT, INSTAGRAM_LIVE_VIDEO, FACEBOOK_LIVE_VIDEO}*<br><br>`app_destination_page_id` *numeric string or integer*<br><br>`is_canvas_video_transition_enabled` *boolean*<br><br>`whatsapp_number` *string*<br><br>`preinput_text` *string*<br><br>`customized_message_page_cta_text` *string*<br><br>`external_offer_provider_id` *numeric string or integer*<br><br>`origins` *enum {COMPOSER, CAMERA}*<br><br>`object_store_urls` *array<string>*<br><br>`facebook_login_spec` *Object*<br><br>`facebook_login_app_id` *numeric string or integer*<br><br>`offer_type` *enum {NO_OFFER, PERCENTAGE_BASED, AMOUNT_BASED}*<br><br>`offer_pct_call_to_action` *enum {TEN}*<br><br>`offer_amt_call_to_action` *enum {TEN}*<br><br>`product_id` *numeric string or integer*<br><br>`group_id` *numeric string or integer*<br><br>`channel_id` *string*<br><br>`land_on_whatsapp_catalog` *enum{1, 2}*<br><br>`land_on_whatsapp_profile` *string*<br><br>`photo_replacement_preview_fbid` ** |
| `product_item_ids`<br><br>*list<string>* | A list of Product Item IDs to use when rendering a dynamic ad preview.<br> |
| `start_date`<br><br>*datetime* | Provide a start date for trip.* parameters in the creative<br> |
| `width`<br><br>*int64* | Custom width of the resulting iframe, recommended at least 280 x 280 for the large right hand size widths.<br>Note: the parameter affects only the size of the iframe containing the preview object. It has no affect on the actual size of the previewed ad.<br> |

#### Fields

Reading from this edge will return a JSON formatted result:

```
{
"data": [],
"paging": {}
}
```

##### data

A list of [AdPreview](https://developers.facebook.com/docs/marketing-api/reference/ad-preview) nodes.

##### paging

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api#paging).

#### Error Codes

| Error Code | Description |
| --- | --- |
| 80004 | There have been too many calls to this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting#ads-management. |
| 100 | Invalid parameter |
| 200 | Permissions error |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

