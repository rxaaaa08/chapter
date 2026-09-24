<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/flexible-ad-format | Saved: 2026-09-19 -->

# Get started with the flexible ad format



The flexible ad format lets you group multiple creative assets — such as images, videos, and text — in a single ad, and the delivery system selects the format to show without you specifying one.

## Before you start

Complete these steps to set up your ad campaigns for the flexible ad format:

1. [Create a Campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#campaign)
2. [Create an Ad Set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#ad-set-budget)
3. [Create the Ad or a standalone Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#ad-creative)
4. [Enable the Ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#book-ad)

### Limitations

* Currently only `OUTCOME_SALES` and `OUTCOME_APP_PROMOTION` campaign objectives support the flexible ad format.

## Create an ad using the flexible ad format

You can use `creative_asset_groups_spec` to provide multiple creative assets, with the following limitations:

* Each group requires at least 1 `image` or `video`.
* All `call_to_actions` provided must have the same `type`.
* There can be no more than 5 `texts` per `text_type` in a group.

For example, to create an ad using the flexible ad format through the `/ads` endpoint:

```curl
curl \
  -F 'adset_id=<ADSET_ID>' \
  -F "creative={
    'name': 'Sample Creative',
    'object_story_spec': {
      ...
    },
  }" \
  -F 'creative_asset_groups_spec={
  "groups": [
    {
      "images": [
        {
          "hash": <IMAGE_HASH_1>,
        },
        {
          "hash": <IMAGE_HASH_2>,
        }
      ],
      "videos": [
        {
          "video_id": <VIDEO_ID_1>,
        },
        {
          "video_id": <VIDEO_ID_2>,
        },
      ],
      "texts": [
        {
          "text": "Summer Sale",
          "text_type": "primary_text",
        },
        {
          "text": "Everything 50% Off",
          "text_type": "headline",
        }
      ],
      "call_to_action": {
        "type": "LEARN_MORE",
        "value": {
          "link": "https://www.example.com/",
        }
      }
    }
  ],
}' \
  -F 'status=PAUSED' \
  -F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

## Read the flexible ad format

To check your ad, read `creative_asset_group_spec`:

```curl
curl -G \
  -d 'fields=creative_asset_groups_spec' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<AD_ID>/
```

### Example response

```json
{
  "creative_asset_groups_spec": {
    "groups": [
      {
        "images": [
          {
            "hash": <IMAGE_HASH_1>,
          },
          {
            "hash": <IMAGE_HASH_2>,
          }
        ],
        "texts": [
          {
            "text": "Summer Sale",
            "text_type": "primary_text"
          },
          {
            "text": "Everything 50% off",
            "text_type": "headline"
          }
        ],
        "videos": [
          {
            "video_id": <VIDEO_ID_1>,
            "image_hash": <VIDEO_THUMBNAIL_HASH_1>
          },
          {
            "video_id": <VIDEO_ID_2>,
            "image_hash": <VIDEO_THUMBNAIL_HASH_2>
          }
        ],
        "group_uuid": <GROUP_ID>
      }
    ]
  },
  "id": <AD_ID>
}
```

## See also

To learn more about the components and concepts mentioned in this guide, visit the following guides:

* [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative)
* [Adgroup](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)
* [Ad Creative Object Story Spec](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative-object-story-spec)
* [Generative AI features for Ads](https://www.facebook.com/business/news/generative-ai-features-for-ads-coming-to-all-advertisers)
