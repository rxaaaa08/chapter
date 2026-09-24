<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Asset Feed Spec

## Reading

Asset feed spec including specs of different ad assets, formats and call to actions

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `ad_formats`list<enum> | Ad format spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `additional_data`[AdAssetFeedAdditionalData](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-additional-data/) | Additional data for the asset feed [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `app_product_page_id`string | Custom Product Page / Custom Store Listing ID for App Install ads. **Note**: Do not put the full URL into the field. Put only the ID. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `asset_customization_rules`[list<AdAssetFeedSpecAssetCustomizationRule>](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec-asset-customization-rule/) | Target rules spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `audios`list<AdAssetAudios> | The audio asset spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `autotranslate`list<string> | List of auto translated languages [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `bodies`[list<AdAssetFeedSpecBody>](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec-body/) | Ad body asset spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `call_ads_configuration`AdAssetCallAdsConfigurationFeedSpec | call_ads_configuration [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `call_to_action_types`list<enum {OPEN_LINK, LIKE_PAGE, SHOP_NOW, PLAY_GAME, INSTALL_APP, USE_APP, CALL, CALL_ME, VIDEO_CALL, INSTALL_MOBILE_APP, USE_MOBILE_APP, MOBILE_DOWNLOAD, BOOK_TRAVEL, LISTEN_MUSIC, WATCH_VIDEO, LEARN_MORE, SIGN_UP, DOWNLOAD, WATCH_MORE, NO_BUTTON, VISIT_PAGES_FEED, CALL_NOW, APPLY_NOW, CONTACT, BUY_NOW, GET_OFFER, GET_OFFER_VIEW, BUY_TICKETS, UPDATE_APP, GET_DIRECTIONS, BUY, SEND_UPDATES, MESSAGE_PAGE, DONATE, SUBSCRIBE, SAY_THANKS, SELL_NOW, SHARE, DONATE_NOW, GET_QUOTE, CONTACT_US, ORDER_NOW, START_ORDER, ADD_TO_CART, VIEW_CART, VIEW_IN_CART, VIDEO_ANNOTATION, RECORD_NOW, INQUIRE_NOW, CONFIRM, REFER_FRIENDS, REQUEST_TIME, GET_SHOWTIMES, LISTEN_NOW, TRY_DEMO, WOODHENGE_SUPPORT, SOTTO_SUBSCRIBE, FOLLOW_USER, RAISE_MONEY, SEE_SHOP, GET_DETAILS, FIND_OUT_MORE, VISIT_WEBSITE, BROWSE_SHOP, EVENT_RSVP, WHATSAPP_MESSAGE, FOLLOW_NEWS_STORYLINE, SEE_MORE, BOOK_NOW, FIND_A_GROUP, FIND_YOUR_GROUPS, PAY_TO_ACCESS, PURCHASE_GIFT_CARDS, FOLLOW_PAGE, SEND_A_GIFT, SWIPE_UP_SHOP, SWIPE_UP_PRODUCT, SEND_GIFT_MONEY, PLAY_GAME_ON_FACEBOOK, GET_STARTED, OPEN_INSTANT_APP, AUDIO_CALL, GET_PROMOTIONS, JOIN_CHANNEL, MAKE_AN_APPOINTMENT, ASK_ABOUT_SERVICES, BOOK_A_CONSULTATION, GET_A_QUOTE, BUY_VIA_MESSAGE, ASK_FOR_MORE_INFO, CHAT_WITH_US, VIEW_PRODUCT, VIEW_CHANNEL, GET_IN_TOUCH, ASK_A_QUESTION, START_A_CHAT, CHAT_NOW, ASK_US, WATCH_LIVE_VIDEO, JOIN_LIVE_VIDEO, SHOP_WITH_AI, TRY_ON_WITH_AI}> | Ad call to action spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `call_to_actions`[list<AdAssetFeedSpecCallToAction>](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec-call-to-action/) | Ad call to action spec in asset feed spec<br> Visible only to intern apps or Special Ad Categories asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `captions`[list<AdAssetFeedSpecCaption>](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec-caption/) | Ad caption asset spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `ctwa_consent_data`list<AdAssetCtwaConsentData> | Ctwa consent data asset spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `descriptions`[list<AdAssetFeedSpecDescription>](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec-description/) | Ad description asset spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `events`list<AdAssetFeedSpecEvents> | Ad event asset spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `groups`[list<AdAssetFeedSpecGroupRule>](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec-group-rule/) | Groups spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `images`[list<AdAssetFeedSpecImage>](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec-image/) | Ad image asset spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `link_urls`[list<AdAssetFeedSpecLinkURL>](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec-link-url/) | Ad link urls asset spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `message_extensions`list<AdAssetMessageExtensions> | message extensions indicates if advertisers opted in message extension feature [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `optimization_type`enum | Optimization type used in asset feed. Possible values are [`ASSET_CUSTOMIZATION`](https://developers.facebook.com/docs/marketing-api/dyn-language-optimization#custom), [`LANGUAGE`](https://developers.facebook.com/docs/marketing-api/dyn-language-optimization), [`PLACEMENT`](https://developers.facebook.com/docs/marketing-api/buying-api/ad-units#placements), [`REGULAR`](https://developers.facebook.com/docs/marketing-api/asset-feed/), and [`FORMAT_AUTOMATION`](https://developers.facebook.com/docs/marketing-api/dynamic-ads-format-personalization). [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `promotional_metadata`[AdAssetPromotionalMetadata](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-promotional-metadata/) | Used to highlight promo codes to maximize conversions and optimize ad spend. Campaigns created with “highlight your promo codes” have shown a 9% median reduction in cost per purchase and a 10% median increase in conversions rate for website purchases. When someone interacts with your ad that has this feature on, the promo code will be highlighted to them. If someone then goes to check out on your website within the in-app browser, the promo code can be automatically applied or easily copy-pasted to be applied at checkout. The promo codes that are highlighted and applied are sourced from your ad creative, existing ad inventory, your website and/or any synced offers in your Commerce Manager. Meta will also automatically update active and eligible promo codes for the duration of your ad campaign. Only supported for sales campaign with web (IAB) conversion location. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `titles`[list<AdAssetFeedSpecTitle>](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec-title/) | Ad title asset spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `translations`list<AdAssetTranslations> | translations [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `videos`[list<AdAssetFeedSpecVideo>](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec-video/) | Ad video asset spec in asset feed spec [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `web_destination_spec`AdAssetWebDestinationSpec | This field contains web destination spec for app promotion campaigns. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
