<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec | Saved: 2026-09-19 -->

# Asset Feed Spec



The `asset_feed_spec` field allows you to deliver different combinations of an ad's creative to different users. There are two ways to set up your combinations:

- **Automatically**: You provide the creative assets, and Meta automatically delivers different combinations to different users. To use this option, see [Dynamic Creative API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/dynamic-creative).
- **Manually**: You provide the creative assets and you create rules on how to display those assets. To use this option, see [Asset Customization Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/asset-customization-rules).

The asset feed spec contains a collection of different creative elements, such as images, titles, bodies, and so on. You can specify multiple creative assets for each asset type. The spec's format is different for each use case. See also [Reference, Asset Feed Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec).

## Create asset feed {#create_asset_feed}

You can use [`asset_feed_spec`](https://developers.facebook.com/docs/marketing-api/reference/ad-asset-feed-spec) to provide multiple creative assets, with the following limitations:

- For all [Asset Customization Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/asset-customization-rules), include at least two target customization rules in `asset_feed_spec`.
- For [Dynamic Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/dynamic-creative), `asset_feed_spec` should **not** have customization rules. In this case, you can mix both images and videos across different placements by specifying `["AUTOMATIC_FORMAT"]` under `ad_formats`.

For example, to create an `asset_feed_spec` for Dynamic Creative:

```
curl -X POST \
  -F 'name="Dynamic Ad Creative with Asset Feed Spec Sample"' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>"
     }' \
  -F 'asset_feed_spec={
       "images": [
         {
           "hash": "<IMAGE_HASH>"
         }
       ],
       "bodies": [
         {
           "text": "Begin Your Adventure"
         },
         {
           "text": "Once a Trainer, always a Trainer."
         }
       ],
       "titles": [
         {
           "text": "Level Up"
         },
         {
           "text": "Swipe to evolve"
         }
       ],
       "descriptions": [
         {
           "text": "First Dynamic Ad Creative Sample"
         }
       ],
       "ad_formats": [
         "SINGLE_IMAGE"
       ],
       "call_to_action_types": [
         "SHOP_NOW"
       ],
       "link_urls": [
         {
           "website_url": "https://www.example.com/"
         }
       ],
       "videos": []
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

You can also create an `asset_feed_spec` with two alternate videos, bodies, and titles:

```
curl \
-F 'object_story_spec={
       "page_id": "YOUR_PAGE_ID",
       "instagram_user_id" : "<IG_USER_ID>",
    }' \
-F "asset_feed_spec={'videos': [{'video_id':'2053108854721025', 'thumbnail_url':'<thumbnail_url>', 'url_tags':'video=video1'},{'video_id':'2104406249780616', 'thumbnail_url':'<thumbnail_url>','url_tags':'video=video2'}], 'bodies': [{'text':'Begin Your Adventure'}, {'text':'Once a Trainer, always a Trainer.'}], 'titles': [{'text':'Level Up'}, {'text':'Swipe to evolve'}], 'descriptions': [{'text':'Begin Your Adventure'}], 'ad_formats': ['SINGLE_IMAGE'], 'link_urls': [{'website_url':'<WEBSITE_URL>'}]}" \
-F 'access_token=<ACCESS_TOKEN>'  \
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/adcreatives
```

See [all available options for Asset Feed Spec](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/options).

## Read asset feed {#read_asset_feed}

To check your creative, read `asset_feed_spec`:

```bash
curl -X GET \
  -d 'fields="asset_feed_spec"' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<CREATIVE_ID>/
```

If you have a Dynamic Creative feed with multiple images and bodies, the response looks like this:

```
{
   "asset_feed_spec":{
      "images":[
         {
            "url_tags":"image=image1",
            "hash":"785095162a2034666e0d0cc4ea1faf89"
         },
         {
            "url_tags":"image=image2",
            "hash":"3a24122c13923569599be35567ce4e9e"
         }
      ],
      "bodies":[
         {
            "text":"Begin Your Adventure"
         },
         {
            "text":"Once a Trainer, always a Trainer."
         }
      ],
      "call_to_action_types":[
         "LEARN_MORE"
      ],
      "call_to_actions":[
         {
            "type":"LEARN_MORE"
         }
      ],
      "descriptions":[
         {
            "text":"Begin Your Adventure"
         }
      ],
      "link_urls":[
         {
            "website_url":"<WEBSITE_URL>"
         }
      ],
      "titles":[
         {
            "text":"Swipe to evolve"
         },
         {
            "text":"Level Up"
         }
      ],
      "ad_formats":[
         "SINGLE_IMAGE"
      ],
      "optimization_type":"REGULAR"
   },
   "id":"<AD_CREATIVE_ID>",
}
```

If you have a Dynamic Creative feed with multiple videos, bodies, and titles, the response looks like this:

```
{
   "asset_feed_spec":{
      "videos":[
         {
            "url_tags":"video=video1",
            "video_id":"2053108854721025",
            "thumbnail_url":"<thumbnail_url>",
            "thumbnail_hash":"<thumbnail_hash>"
         },
         {
            "url_tags":"video=video2",
            "video_id":"2104406249780616",
            "thumbnail_url":"<thumbnail_url>",
            "thumbnail_hash":"<thumbnail_hash>"
         }
      ],
      "bodies":[
         {
            "text":"Begin Your Adventure"
         },
         {
            "text":"Once a Trainer, always a Trainer."
         }
      ],
      "call_to_action_types":[
         "LEARN_MORE"
      ],
      "call_to_actions":[
         {
            "type":"LEARN_MORE"
         }
      ],
      "descriptions":[
         {
            "text":"Begin Your Adventure"
         }
      ],
      "link_urls":[
         {
            "website_url":"<WEBSITE_URL>"
         }
      ],
      "titles":[
         {
            "text":"Swipe to evolve"
         },
         {
            "text":"Level Up"
         }
      ],
      "ad_formats":[
         "SINGLE_VIDEO"
      ],
      "optimization_type":"REGULAR"
   },
   "id":"<AD_CREATIVE_ID>",
}
```

## Edit asset feed {#edit_asset_feed}

You can add, replace, or remove any of the creative's assets. To do so, provide another creative with the new `asset_feed_spec`.

You can:

* Add assets.
* Remove existing assets.
* Replace assets with completely new ones.

You **cannot**:

* Change ad formats, such as from `SINGLE IMAGE` to `VIDEO`.
* Update an Asset Feed based creative ad to be a non-Dynamic Creative ad, which has no `asset_feed_spec`.

```
curl \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'creative={
      "creative_id": <CREATIVE_ID>,
   }' \
https://graph.facebook.com/v25.0/<AD_ID>
```

When you create a new ad creative to replace an old one, you must still fulfill all [restrictions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/options) that apply.
