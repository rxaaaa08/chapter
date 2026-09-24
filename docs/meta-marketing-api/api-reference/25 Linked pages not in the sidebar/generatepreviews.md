<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/generatepreviews | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Generatepreviews

## Reading

Endpoint to generate preview without using any Facebook specific assets (e.g. adaccount)

### Parameters

| Parameter | Description |
| --- | --- |
| `ad_format`enum{AUDIENCE_NETWORK_INSTREAM_VIDEO, AUDIENCE_NETWORK_INSTREAM_VIDEO_MOBILE, AUDIENCE_NETWORK_OUTSTREAM_VIDEO, AUDIENCE_NETWORK_REWARDED_VIDEO, BIZ_DISCO_FEED_MOBILE, DESKTOP_FEED_STANDARD, FACEBOOK_IFU_REELS_MOBILE, FACEBOOK_PROFILE_FEED_DESKTOP, FACEBOOK_PROFILE_FEED_MOBILE, FACEBOOK_PROFILE_REELS_MOBILE, FACEBOOK_REELS_BANNER, FACEBOOK_REELS_BANNER_DESKTOP, FACEBOOK_REELS_BANNER_FEED_ANDROID, FACEBOOK_REELS_BANNER_FEED_ANDROID_LARGE, FACEBOOK_REELS_BANNER_FULLSCREEN_IOS, FACEBOOK_REELS_BANNER_FULLSCREEN_MOBILE, FACEBOOK_REELS_MOBILE, FACEBOOK_REELS_POSTLOOP, FACEBOOK_REELS_POSTLOOP_FEED, FACEBOOK_REELS_SIMILAR_PRODUCTS_MOBILE, FACEBOOK_REELS_STICKER, FACEBOOK_STORY_MOBILE, FACEBOOK_STORY_STICKER_MOBILE, INSTAGRAM_EXPLORE_CONTEXTUAL, INSTAGRAM_EXPLORE_GRID_HOME, INSTAGRAM_EXPLORE_IMMERSIVE, INSTAGRAM_FEED_WEB, INSTAGRAM_FEED_WEB_M_SITE, INSTAGRAM_LEAD_GEN_MULTI_SUBMIT_ADS, INSTAGRAM_PROFILE_FEED, INSTAGRAM_PROFILE_REELS, INSTAGRAM_REELS, INSTAGRAM_REELS_OVERLAY, INSTAGRAM_REELS_WEB, INSTAGRAM_REELS_WEB_M_SITE, INSTAGRAM_SEARCH_CHAIN, INSTAGRAM_SEARCH_GRID, INSTAGRAM_STANDARD, INSTAGRAM_STORY, INSTAGRAM_STORY_EFFECT_TRAY, INSTAGRAM_STORY_WEB, INSTAGRAM_STORY_WEB_M_SITE, INSTANT_ARTICLE_RECIRCULATION_AD, INSTANT_ARTICLE_STANDARD, INSTREAM_BANNER_DESKTOP, INSTREAM_BANNER_FEED_IOS, INSTREAM_BANNER_FULLSCREEN_IOS, INSTREAM_BANNER_FULLSCREEN_MOBILE, INSTREAM_BANNER_IMMERSIVE_MOBILE, INSTREAM_BANNER_MOBILE, INSTREAM_VIDEO_DESKTOP, INSTREAM_VIDEO_FULLSCREEN_IOS, INSTREAM_VIDEO_FULLSCREEN_MOBILE, INSTREAM_VIDEO_IMAGE, INSTREAM_VIDEO_IMMERSIVE_MOBILE, INSTREAM_VIDEO_MOBILE, JOB_BROWSER_DESKTOP, JOB_BROWSER_MOBILE, MARKETPLACE_MOBILE, MESSENGER_MOBILE_INBOX_MEDIA, MESSENGER_MOBILE_STORY_MEDIA, MOBILE_BANNER, MOBILE_FEED_BASIC, MOBILE_FEED_STANDARD, MOBILE_FULLWIDTH, MOBILE_INTERSTITIAL, MOBILE_MEDIUM_RECTANGLE, MOBILE_NATIVE, RIGHT_COLUMN_STANDARD, SUGGESTED_VIDEO_DESKTOP, SUGGESTED_VIDEO_FULLSCREEN_MOBILE, SUGGESTED_VIDEO_IMMERSIVE_MOBILE, SUGGESTED_VIDEO_MOBILE, WATCH_FEED_HOME, WATCH_FEED_MOBILE, WHATSAPP_STATUS_MEDIA} | Use this to select what placement on Facebook the ad preview should be for. The API returns an iframe, which is only valid for 24 hours. Required |
| `creative`AdCreative | Creative spec that is used to generate preview RequiredSupports Emoji |
| `creative_feature`enum{ig_video_native_subtitle, image_animation, product_browsing, product_metadata_automation, profile_card, standard_enhancements_catalog, text_overlay_translation} | creative_feature |
| `dynamic_asset_label`string | Provide a label for rendering specific variation of an asset customization ad |
| `dynamic_creative_spec`Object | Dynamic creative spec for dynamic ads. Supports Emoji |
| `dynamic_customization`Object | For dynamic ads in multiple languages, specify the customization to be applied to the ad |
| `end_date`datetime | Provide an end date for trip.* parameters in the creative |
| `height`int64 | Custom height of the resulting iframe, recommended at least 280 x 280 for the large right hand size height.<br>Note: the parameter affects only the size of the iframe containing the preview object. It has no affect on the actual size of the previewed ad. |
| `place_page_id`Page ID | Place page ID to use when rendering a dynamic local ad preview |
| `post`Object | Specs for a page post. This field is used when the creative field contains only a Page id as `object_id` in it. Not supported for `ad_format = RIGHT_COLUMN_STANDARD` |
| `link`URL | Destination URL of the ad Required |
| `message`UTF-8 string | Post message Supports Emoji |
| `picture`URL | Image URL |
| `name`UTF-8 encoded string | Post name |
| `caption`UTF-8 encoded string | Post caption |
| `description`UTF-8 encoded string | Post description |
| `call_to_action`Object | Call to action Supports Emoji |
| `type`enum{BOOK_TRAVEL, CONTACT_US, DONATE, DONATE_NOW, DOWNLOAD, GET_DIRECTIONS, GO_LIVE, INTERESTED, LEARN_MORE, SEE_DETAILS, LIKE_PAGE, MESSAGE_PAGE, RAISE_MONEY, SAVE, SEND_TIP, SHOP_NOW, SIGN_UP, VIEW_INSTAGRAM_PROFILE, INSTAGRAM_MESSAGE, LOYALTY_LEARN_MORE, PURCHASE_GIFT_CARDS, PAY_TO_ACCESS, SEE_MORE, TRY_IN_CAMERA, WHATSAPP_LINK, GET_IN_TOUCH, TRY_NOW, ASK_A_QUESTION, START_A_CHAT, CHAT_NOW, ASK_US, CHAT_WITH_US, SHOP_ON_RETAILER, BOOK_NOW, CHECK_AVAILABILITY, ORDER_NOW, WHATSAPP_MESSAGE, GET_MOBILE_APP, INSTALL_MOBILE_APP, USE_MOBILE_APP, INSTALL_APP, USE_APP, PLAY_GAME, TRY_DEMO, WATCH_VIDEO, WATCH_MORE, OPEN_LINK, NO_BUTTON, LISTEN_MUSIC, MOBILE_DOWNLOAD, GET_OFFER, GET_OFFER_VIEW, BUY_NOW, BUY_TICKETS, UPDATE_APP, BET_NOW, ADD_TO_CART, SELL_NOW, GET_SHOWTIMES, LISTEN_NOW, GET_EVENT_TICKETS, REMIND_ME, SEARCH_MORE, PRE_REGISTER, SWIPE_UP_PRODUCT, SWIPE_UP_SHOP, PLAY_GAME_ON_FACEBOOK, VISIT_WORLD, OPEN_INSTANT_APP, JOIN_GROUP, GET_PROMOTIONS, SEND_UPDATES, INQUIRE_NOW, VISIT_PROFILE, CHAT_ON_WHATSAPP, EXPLORE_MORE, CONFIRM, JOIN_CHANNEL, MAKE_AN_APPOINTMENT, ASK_ABOUT_SERVICES, BOOK_A_CONSULTATION, GET_A_QUOTE, BUY_VIA_MESSAGE, ASK_FOR_MORE_INFO, VIEW_PRODUCT, VIEW_CHANNEL, WATCH_LIVE_VIDEO, JOIN_LIVE_VIDEO, IMAGINE, CALL, MISSED_CALL, CALL_NOW, CALL_ME, APPLY_NOW, BUY, GET_QUOTE, SUBSCRIBE, RECORD_NOW, VOTE_NOW, GIVE_FREE_RIDES, REGISTER_NOW, OPEN_MESSENGER_EXT, EVENT_RSVP, CIVIC_ACTION, SEND_INVITES, REFER_FRIENDS, REQUEST_TIME, SEE_MENU, SEARCH, TRY_IT, TRY_ON, LINK_CARD, DIAL_CODE, FIND_YOUR_GROUPS, START_ORDER} | The type of the action. Not all types can be used for all ads. Check [Ads Product Guide](https://www.facebook.com/business/ads-guide) to see which type can be used for based on the `objective` of your campaign. Required |
| `value`Object | Default value: `Vec` JSON containing the call to action data. Supports Emoji |
| `android_url`string |  |
| `ios_url`string |  |
| `link`URL |  |
| `app_link`string |  |
| `page`numeric string or integer |  |
| `link_format`enum {VIDEO_LEAD, VIDEO_LPP, VIDEO_NEKO, VIDEO_NON_LINK, VIDEO_SHOP, WHATSAPP_CATALOG_ATTACHMENT} |  |
| `application`numeric string or integer |  |
| `link_title`string | Supports Emoji |
| `link_description`string | Supports Emoji |
| `link_caption`string |  |
| `product_link`string |  |
| `get_movie_showtimes`boolean |  |
| `sponsorship`Object |  |
| `link`URL |  |
| `image`URL |  |
| `video_annotation`Object |  |
| `annotations`list<Object> |  |
| `start_time_in_sec`int64 |  |
| `end_time_in_sec`int64 |  |
| `link`URL |  |
| `link_title`string |  |
| `link_description`string |  |
| `link_caption`string |  |
| `image_url`URL |  |
| `header_color`string |  |
| `logo_url`URL |  |
| `post_click_cta_title`string |  |
| `post_click_description_title`string |  |
| `offer_id`numeric string or integer |  |
| `offer_view_id`numeric string or integer |  |
| `advanced_data`Object |  |
| `offer_id`numeric string or integer |  |
| `lead_gen_form_id`numeric string or integer |  |
| `referral_id`numeric string or integer |  |
| `search_dialog_id`numeric string or integer |  |
| `fundraiser_campaign_id`numeric string or integer |  |
| `event_id`numeric string or integer |  |
| `event_tour_id`numeric string or integer |  |
| `app_destination`enum {MESSENGER, MESSENGER_EXTENSIONS, MESSENGER_GAMES, LINK_CARD, MARKETPLACE, WHATSAPP, INSTAGRAM_DIRECT, INSTAGRAM_LIVE_VIDEO, INSTAGRAM_LIVE_WEBSITE, INSTAGRAM_LIVE_WHATSAPP, FACEBOOK_LIVE_VIDEO} |  |
| `app_destination_page_id`numeric string or integer |  |
| `is_canvas_video_transition_enabled`boolean |  |
| `whatsapp_number`string |  |
| `preinput_text`string |  |
| `customized_message_page_cta_text`string |  |
| `external_offer_provider_id`numeric string or integer |  |
| `origins`enum {COMPOSER, CAMERA} |  |
| `object_store_urls`array<string> |  |
| `facebook_login_spec`Object |  |
| `facebook_login_app_id`numeric string or integer |  |
| `offer_type`enum {NO_OFFER, PERCENTAGE_BASED, AMOUNT_BASED} |  |
| `offer_pct_call_to_action`enum {TEN} |  |
| `offer_amt_call_to_action`enum {TEN} |  |
| `product_id`numeric string or integer |  |
| `group_id`numeric string or integer |  |
| `channel_id`string |  |
| `land_on_whatsapp_catalog`enum{1, 2} |  |
| `land_on_whatsapp_profile`string |  |
| `photo_replacement_preview_fbid` |  |
| `product_item_ids`list<string> | A list of Product Item IDs to use when rendering a dynamic ad preview. |
| `start_date`datetime | Provide a start date for trip.* parameters in the creative |
| `width`int64 | Custom width of the resulting iframe, recommended at least 280 x 280 for the large right hand size widths.<br>Note: the parameter affects only the size of the iframe containing the preview object. It has no affect on the actual size of the previewed ad. |

### Fields

Reading from this edge will return a JSON formatted result:

```

{
    "data": [],
    "paging": {}
}

```

#### `data`

A list of [AdPreview](https://developers.facebook.com/docs/marketing-api/reference/ad-preview/) nodes.

#### `paging`

For more details about pagination, see the [Graph API guide](https://developers.facebook.com/docs/graph-api/using-graph-api/#paging).

### Error Codes

| Error | Description |
| --- | --- |
| 100 | Invalid parameter |
| 270 | This Ads API request is not allowed for apps with development access level (Development access is by default for all apps, please request for upgrade). Make sure that the access token belongs to a user that is both admin of the app and admin of the ad account |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
