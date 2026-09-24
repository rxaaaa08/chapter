<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/multi-language-ads | Saved: 2026-09-19 -->

# Multi-Language Ads



Customize different parts of ad creative such as the image, video, text, and body of an ad to reach speakers of different languages. Facebook optimizes your ad to show the right language version to the right people.

This helps you set up an ad in multiple languages and deliver the most relevant language version in your ad to a viewer while retaining a broad targeting for the ad. This enables you to have personalized content based on a viewer's spoken language while maintaining cost-efficient ads.

For general information on this feature, see [Ads Help Center, Advertise to a multilingual audience](https://www.facebook.com/help/1852644738394400?locale=en_US). See supported [ad campaign objectives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/asset-customization-rules#campaign).

Multi-Language Ads is one of our three APIs that use [asset customization rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/asset-customization-rules).

## Get started

Before you get started, check [restrictions](#limits) for this product. If your use case meets our specifications, move on to the following steps:

* Step 1: [Create an ad campaign and ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/asset-customization-rules#campaign)
* Step 2: [Provide creative via `asset_feed_spec`](#asset) — see also [Available Languages](#lang).
* Step 3: [Create an ad with `asset_feed_spec` in `creative_spec`](#create)
* Optional Step 4: [Preview your ad](#preview)

If you do not have the resources to manually translate your ad, check out our [automatic translation service](#auto).

## Step 2: Provide creative via `asset_feed_spec` {#asset}

Specify Multi-Language Ads creatives using `asset_feed_spec`s. An asset feed is a collection of different creative elements, such as image, titles, bodies, and so on. You create an `asset_feed_spec` at [`/adcreative`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative).

To create an `asset_feed_spec`, provide an array of assets for each different language. Add a label to tag each asset to identify the language the asset belongs to. Facebook uses the labels in `asset_customization_rules` to group assets together by language. You should provide **at least one asset per asset type**.

### Available parameters

Parameters to provide in `asset_feed_spec` include:

| Property Name | Description |
| --- | --- |
| `images`  <br><br>type: array | **Required for `SINGLE_IMAGE` ad format. Provide `url` or `hash`.**<br><br>Images as `url` or `hash`. You should provide images which are in the [ad account's image library](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-image).<br><br>Provide this field as an array of `{"url": "<IMAGE_URL>", "hash": "<IMAGE_HASH>", "url_tags": "<TAG>", "adlabels": [{name: "<LABEL>"}]}`. |
| `videos`  <br><br>type: array | **Required for `SINGLE_VIDEO` ad format.**<br><br>Array of `video_ids`. Videos should be in the [ad account's video library](https://developers.facebook.com/docs/marketing-api/advideo).<br><br>Provide this field as an array of `{"video_id": "<VIDEO_ID>","thumbnail_url": "{<THUMBNAIL_URL>}", "url_tags": "{<TAG>}", "adlabels": [{"name": "<LABEL>"}]}`. |
| `bodies`  <br><br>type: array | **Required, but `url_tags` are optional.**<br><br>Array of bodies containing primary message of ad.<br><br>Provide this field as an array of `{"text": "<BODY_TEXT>", "url_tags": "<TAG>", "adlabels": [{"name": "<LABEL>"}]}`. |
| `titles`  <br><br>type: array | **Required, but `url_tags` are optional.**<br><br>Array of titles. A short headline in the ad, generally shown next to a link, image, or video.<br><br>Provide this field as an array of `{"text": "<TITLE>", "url_tags": "<TAG>", "adlabels": [{"name": "<LABEL>"}]}`. |
| `descriptions`  <br><br>type: array | **Required, but `url_tags` are optional.**<br><br>Array of secondary description text, displayed less prominently than bodies or titles.<br><br>Provide this field as an array of `{"text": "<DESCRIPTION>", "url_tags": "<TAG>", "adlabels": [{"name": "<LABEL>"}]}`. Use an empty string with a single space for blank description. |
| `link_urls`  <br><br>type: array | **Required, but `display_url` and `deeplink_url` are optional.**<br><br>Array of link URLs.<br><br>Provide this field as an array of `{"website_url": "<URL>", "adlabels": [{"name": "<LABEL>"}], "deeplink_url": "<DEEPLINK>", "display_url": "<URL>"}`. |
| `call_to_action_types`  <br><br>type: array | **Required.**<br><br>Array of call-to-action-type values.<br><br>Provide this field as an array of supported call to actions: `["<CALL_TO_ACTION>"]`. |
| `ad_formats` | **Required.**<br><br>Array of Facebook ad formats you want to create the ads in. Supported formats are: `SINGLE_IMAGE`, `SINGLE_VIDEO`.<br><br>Provide this field as an array of supported ad formats: `["{<AD_FORMAT>}"]`. |
| `asset_customization_rules`  <br><br>type: see table below under [Asset Customization Rules](#custom) | **Required.**<br><br>Array of asset customization rules. |

### Asset customization rules {#custom}

Define the assets that appear together for viewers who speak a particular language. Each rule has a `customization_spec` which defines the locales of people who view these assets during ad delivery.

Provide exactly one *default rule*. This rule must include the assets that Facebook displays if someone's preferred language does not match any locales specified in the asset feed. This helps prevent under-delivery of your ads.

| Property Name | Description |
| --- | --- |
| `customization_spec`  <br><br>type: `{"locales": [<LOCALE1>, <LOCALE2>]}` | **Required.**<br><br>Define the locales where the assets in this rule should deliver. For supported locales, see [Available Languages](#lang). |
| `image_label`  <br><br>type: `{"name": "<LABEL>"}` | **Required for `SINGLE_IMAGE` ad format.**<br><br>Label attached to one of the image assets in the asset feed. |
| `video_label`  <br><br>type: `{"name": "<LABEL>"}` | **Required for `SINGLE_VIDEO` ad format.**<br><br>Label attached to one of the video assets in the asset feed. |
| `body_label`  <br><br>type: `{"name": "<LABEL>"}` | **Required.**<br><br>Label attached to one of the body assets in the asset feed. |
| `title_label`  <br><br>type: `{"name": "<LABEL>"}` | **Required.**<br><br>Label attached to one of the title assets in the asset feed. |
| `description_label`  <br><br>type: `{"name": "<LABEL>"}` | **Required.**<br><br>Label attached to one of the description assets in the asset feed. |
| `link_url_label`  <br><br>type: `{"name": "<LABEL>"}` | **Required.**<br><br>Label attached to one of the `link_url` assets in the asset feed. |
| `is_default`  <br><br>type: boolean | **Required.**<br><br>Boolean flag to identify the default rule. You should set exactly one rule with `is_default` flag as `true`. |

### Available languages {#lang}

The locales you provide in `customization_spec` must be locale IDs supported in ads targeting. See [Targeting and Placement, Locales](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting#additional). You can search for specific language using the `/search` endpoint. Use the `q` parameter to search for a specific language name. Leave this parameter blank to get the list of all supported languages:

```
curl -G \
  -d "type=adlocale" \
  -d "q=en" \
  -d "limit=2" \
  -d "access_token=<ACCESS_TOKEN>" \
  https://graph.facebook.com/v25.0/search
```

On success you get a list of languages:

```
{
  "data": [
    {
      "key": 6,
      "name": "English (US)"
    },
    {
      "key": 24,
      "name": "English (UK)"
    }
  ],
  "paging": {
    "cursors": {
      "before": "MAZDZD",
      "after": "MAZDZD",
    }
  }
}
```

You should use the keys in these search results as locales in your asset customization rules. For more information, see [Targeting Search](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search).

## Step 3: Create ads using asset feed specs {#create}

You can create an asset feed using the `asset_feed_spec` field in `POST ad_account_ID/adcreatives`:

```
curl \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "instagram_user_id": "<IG_USER_ID>",
     }' \
  -F 'asset_feed_spec={
       "ad_formats": ["SINGLE_IMAGE"],
       "bodies": [
         {
           "text": "Try our delicious guacamole recipe!",
           "adlabels": [{"name": "english"}],
         },
         {
           "text": "Essayez notre délicieuse recette de guacamole!",
           "adlabels": [{"name": "french"}],
         },
       ],
       "titles": [
         {
           "text": "Jaspers Market",
           "adlabels": [{"name": "english"}],
         },
         {
           "text": "Jaspers Market",
           "adlabels": [{"name": "french"}],
         },
       ],
       "descriptions": [
         {
           "text": "The best avocados!",
           "adlabels": [{"name": "english"}],
         },
         {
           "text": "Les meilleurs avocats!",
           "adlabels": [{"name": "french"}],
         },
       ],
       "link_urls": [
         {
           "website_url": "www.jaspersmarket.com/en",
           "adlabels": [{"name": "english"}],
         },
         {
           "website_url": "www.jaspersmarket.com/fr",
           "adlabels": [{"name": "french"}],
         },
       ],
       "images": [
         {
           "hash": "<IMAGE_HASH>",
         },
       ],
       "call_to_action_types": ["SHOP_NOW"],
       "asset_customization_rules": [
         {
           "customization_spec": {
             "locales": [9,44],
           },
           "title_label": {"name": "french"},
           "body_label": {"name": "french"},
           "description_label": {"name": "french"},
           "link_url_label": {"name": "french"},
         },
         {
             "is_default": true,
           "customization_spec": {
             "locales": [24]
           },
           "title_label": {"name": "english"},
           "body_label": {"name": "english"},
           "description_label": {"name": "english"},
           "link_url_label": {"name": "english"},
         },
       ]
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

On success, you get the ID for the ad creative:

```
{"id":"238474593777777"}
```

If your `asset_feed_spec` does not meet the [restrictions](#limits) below, you see an error.

To create an ad with this ad creative ID, call `POST act_AD_ACCOUNT_ID/ads`. Alternatively, to display different languages in your ad, provide the `asset_feed_spec` and `object_story_spec` in the `creative` parameter for the ad.

To verify the new `asset_feed_spec`, you call `GET` on the ad ID or the ad creative ID:

```
curl -G \
-d 'fields=object_story_spec,asset_feed_spec' \
-d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CREATIVE_ID>
```

## Optional step 4: Preview your ad {#preview}

Preview the different language versions of your ad using the [`generatepreview`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview) endpoint. Add a `dynamic_asset_label` field with an `adlabel` in a rule to view a specific language version.

For example, to preview the French version of the above creative:

```
curl -G \
  --data-urlencode 'creative={
    "object_story_spec": {
      "page_id": "<PAGE_ID>"
    },
    "asset_feed_spec": {
      ...
    }
  }' \
  -d 'ad_format=DESKTOP_FEED_STANDARD' \
  -d 'dynamic_asset_label=french'
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/generatepreviews
```

## Automatic translations {#auto}

You can use our automatic translation service, if you do not have the resources to manually translate your ad. This capability translates your default ad copy to additional languages, so you can reach a multilingual audience.

The text assets specified by the default asset customization rule provide the source for the automatic translation. Meta labels automatically translated ad copies as "Automatically Translated".

To create an automatically translated version of your ad copy, add `autotranslate` to `asset_feed_spec`. Then, specify the languages you would like your copy to be translated to. See example:

```
curl \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "instagram_user_id": "<IG_USER_ID>",
     }' \
  -F 'asset_feed_spec={
       "ad_formats": ["SINGLE_IMAGE"],
       "autotranslate": ["fr_XX"],
       "bodies": [
         {
           "text": "Try our delicious guacamole recipe!",
           "adlabels": [{"name": "english"}],
         }
       ],
       "titles": [
         {
           "text": "Jaspers Market",
           "adlabels": [{"name": "english"}]
         }
       ],
       "descriptions": [
         {
           "text": "The best avocados!",
           "adlabels": [{"name": "english"}]
         }
       ],
       "link_urls": [
         {
           "website_url": "www.jaspersmarket.com",
           "adlabels": [{"name": "english"}]
         }
       ],
       "images": [
         {
           "hash": "<IMAGE_HASH>"
         },
       ],
       "call_to_action_types": ["SHOP_NOW"],
       "optimization_type": "LANGUAGE",
       "asset_customization_rules": [
         {
           "is_default": true,
           "customization_spec": {
             "locales": [6]
           },
           "title_label": {"name": "english"},
           "body_label": {"name": "english"},
           "description_label": {"name": "english"},
           "link_url_label": {"name": "english"}
         }
       ]
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

To review the automatically translated copies, call the `asset_feed_spec` field on the creative.  

**If you specify the same language on the `autotranslate` field, your edits to the auto translated copies on the spec are dropped. Fresh translations from the default ad copy replace these edits. If you absolutely need the edits, remove the language from the `autotranslate` field.**

### `link_urls`
You can add a custom link URL to the automatically translated ad version.

**To do this, add a `language-specific` URL to the `link_urls` field along with an `adlabel` and add a new rule into `asset_customization_rules` with the associated locale codes and `link_url_label` for this language.**

## Restrictions {#limits}

The following are restrictions and limits on your asset feed.

### Ad formats

* Only one ad format per `asset_feed_spec`.
* For `SINGLE_IMAGE` format, you must provide at least one image.
* For `SINGLE_VIDEO` format, you must provide at least one video.

### Assets, general

* You can provide at most 49 assets for every asset type except `call_to_action_types`.
* You must provide exactly one `call_to_action_type` asset for all objectives.

### Text assets

* You must provide at least one text asset, such as `title`s, bodies, `description`s and `link_urls`, for every language version in the asset feed.
* All text assets should have the `adlabels` field.
* Maximum length: 255 characters for title, 4096 characters for body, and 10000 characters for description.

### Image and video assets

* For recommended image sizes by placement and objective, see the [Ads Guide](https://www.facebook.com/business/ads-guide/image/facebook-feed/traffic).
* You can use up to one image or video asset without an `adlabel`. Meta uses this image or video for all the language versions.
* If you provide additional videos or images, you must include `adlabel`s and provide these labels in your asset customization rule.

### Link URL assets

* If you provide `url_tags`, they are appended to the `link_url` as parameters for each asset in the ad.
* If you use the `APP_INSTALLS` objective, your `link_url` should be the same as the ad set's `promoted_object.object_store_url`.

### Asset customization rules

* You should provide an asset customization rule for every language variant in `asset_feed_spec`.
* You should provide one **default rule**. This is an asset customization rule with `is_default` set to `true`. This acts as a backup rule and enables ads to display even when someone's locale does not match any of the languages in `asset_feed_spec`.

### [Placements](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#placement)

* Multi-Language Ads supports all placements.

### Available [objectives](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#placement) and destination types

* `LINK_CLICKS` - Website and apps, no Messenger.
* `APP_INSTALLS` - Desktop or mobile apps.
* `CONVERSIONS` - Website and apps, no Messenger.
* `REACH` - All destination types.
* `BRAND_AWARENESS` - All destination types.
* `VIDEO_VIEWS` - All destination types.

### Supported buying types

* `REACH` - [Reach and Frequency](https://developers.facebook.com/docs/marketing-api/reachandfrequency)
* [`AUCTION`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/guides/cost-per-action-ads)

### Supported translation directions

The following translation directions are supported. Use the corresponding dialect code in the `autotranslate` field:

| Source Language | Target Translation Language | Dialect Code |
| --- | --- | --- |
| English | Spanish | `es_XX` |
| English | French | `fr_XX` |
| English | German | `de_DE` |
| English | Portuguese | `pt_XX` |
| English | Italian | `it_IT` |
| English | Arabic | `ar_AR` |
| English | Dutch | `nl_XX` |
| English | Malay | `ms_MY` |
| English | Swedish | `sv_SE` |
| English | Indonesian | `id_ID` |
| English | Polish | `pl_PL` |
| English | Hindi | `hi_IN` |
| English | Danish | `da_DK` |
| English | Turkish | `tr_TR` |
| English | Tagalog | `tl_XX` |
| English | Romanian | `ro_RO` |
| German | English | `en_XX` |
| Arabic | English | `en_XX` |
| Hebrew | English | `en_XX` |
| Spanish | English | `en_XX` |
| Japanese | English | `en_XX` |
| Norwegian | English | `en_XX` |
| French | English | `en_XX` |
| Dutch | English | `en_XX` |
| Swedish | English | `en_XX` |

