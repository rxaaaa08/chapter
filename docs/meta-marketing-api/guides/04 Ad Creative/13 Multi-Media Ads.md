<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/multi-media-ads | Saved: 2026-09-19 -->

# Multi-media ads


Multi-media ads allow you to upload up to 10 images and videos within a single ad while maintaining per-media customization for placements, text, cropping, and destinations.

## Before you start

You need to set up your ad campaigns using the general ad setup:

- [Create a campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#campaign)
- [Create an ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#ad-set-budget)
- [Create the ad or a standalone creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#ad-creative)
- [Enable the ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#book-ad)

### Limitations

- A maximum of 10 media assets (images and videos combined) can be included per ad.
- The primary media in `object_story_spec` must also appear in `media_sourcing_spec`.
- Each image must include a `hash` (or `url`) and `source` field. You can add multiple images in the same `media_sourcing_spec`.
- Each video must include a `video_id` and `source` field. You can add multiple videos in the same `media_sourcing_spec`.
- The API rejects duplicate image hashes or video IDs within the same `media_sourcing_spec`.
- The [`related_media`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative-media-sourcing-spec) field cannot coexist with explicit `images` or `videos` arrays.

## Create a multi-media ad with multiple images

To create a multi-media ad with multiple images, send a `POST` request to the `/act_<AD_ACCOUNT_ID>/ads` endpoint. Your request must include:

- `creative` — an inline creative containing:
    - `object_story_spec` — with `page_id` and [`link_data`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative-link-data) referencing the primary image via `image_hash` (the hash of an image in your ad account's image library)
    - `media_sourcing_spec` — with an `images` array containing all image assets. Each image requires `hash`, `source` set to `"multi_media"`, and `opt_in_status` set to `"opt_in"` to enable related media features.

The primary image referenced in `object_story_spec.link_data.image_hash` must also appear in the `media_sourcing_spec.images` array.

### Example request

```
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads" \
  -F 'name=My Multi-Media Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'status=PAUSED' \
  -F 'creative={
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "link_data": {
        "link": "https://www.example.com",
        "image_hash": "<IMAGE_HASH_1>"
      }
    },
    "media_sourcing_spec": {
      "images": [
        {
          "hash": "<IMAGE_HASH_1>",
          "source": "multi_media",
          "opt_in_status": "opt_in"
        },
        {
          "hash": "<IMAGE_HASH_2>",
          "source": "multi_media",
          "opt_in_status": "opt_in"
        },
        {
          "hash": "<IMAGE_HASH_3>",
          "source": "multi_media",
          "opt_in_status": "opt_in"
        }
      ]
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>'
```

On success, your app receives a JSON response with the ad ID.

```json
{
  "id": "<AD_ID>"
}
```

## Create a multi-media ad with multiple videos

To create a multi-media ad with multiple videos, send a `POST` request to the `/act_<AD_ACCOUNT_ID>/ads` endpoint. When the primary media is a video, `object_story_spec` must use [`video_data`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative-video-data) instead of `link_data`.

Each video in the `media_sourcing_spec.videos` array requires:

- `video_id` — the ID of a video uploaded to your ad account
- `original_video_id` — the original video ID reference
- `source` — set to `"multi_media"`
- `opt_in_status` — controls whether the asset participates in related media features. Set to `"opt_in"` to enable.
- `thumbnail_url` — the thumbnail image URL for this video in `media_sourcing_spec`
- `thumbnail_source` — how the thumbnail was generated (for example, `"generated_default"` or `"custom"`)

### Example request

```
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads" \
  -F 'name=My Multi-Media Video Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'status=PAUSED' \
  -F 'creative={
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "video_data": {
        "video_id": "<VIDEO_ID_1>",
        "image_url": "https://example.com/thumbnail1.jpg",
        "call_to_action": {
          "type": "LEARN_MORE",
          "value": {"link": "https://www.example.com"}
        }
      }
    },
    "media_sourcing_spec": {
      "videos": [
        {
          "video_id": "<VIDEO_ID_1>",
          "original_video_id": "<VIDEO_ID_1>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "thumbnail_source": "generated_default",
          "thumbnail_url": "https://example.com/thumbnail1.jpg"
        },
        {
          "video_id": "<VIDEO_ID_2>",
          "original_video_id": "<VIDEO_ID_2>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "thumbnail_source": "generated_default",
          "thumbnail_url": "https://example.com/thumbnail2.jpg"
        }
      ]
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>'
```

On success, your app receives a JSON response with the ad ID.

```json
{
  "id": "<AD_ID>"
}
```

## Create a multi-media ad with mixed media

You can combine images and videos in a single multi-media ad. The primary media in `object_story_spec` can be either an image (using `link_data`) or a video (using `video_data`). All other media assets are listed in `media_sourcing_spec`.

### Example request

```
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads" \
  -F 'name=My Mixed Media Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'status=PAUSED' \
  -F 'creative={
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "link_data": {
        "link": "https://www.example.com",
        "image_hash": "<IMAGE_HASH_1>"
      }
    },
    "media_sourcing_spec": {
      "images": [
        {
          "hash": "<IMAGE_HASH_1>",
          "source": "multi_media",
          "opt_in_status": "opt_in"
        },
        {
          "hash": "<IMAGE_HASH_2>",
          "source": "multi_media",
          "opt_in_status": "opt_in"
        }
      ],
      "videos": [
        {
          "video_id": "<VIDEO_ID_1>",
          "original_video_id": "<VIDEO_ID_1>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "thumbnail_source": "generated_default",
          "thumbnail_url": "https://example.com/thumbnail.jpg"
        }
      ]
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>'
```

On success, your app receives a JSON response with the ad ID.

```json
{
  "id": "<AD_ID>"
}
```

## Add text customizations

Multi-media ads support two levels of text customization:

- **Global text (L1)** — titles, bodies, and descriptions at the `media_sourcing_spec` root level. These apply across all media assets and allow the system to test different text combinations.
- **Per-media text** — `text_customizations` on each image or video. These override the global text for that specific media asset.

Per-media `text_customizations` accept `titles`, `bodies`, and `descriptions`, each containing objects with a `text` field.

### Example request

```
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads" \
  -F 'name=My Text Customized Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'status=PAUSED' \
  -F 'creative={
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "link_data": {
        "link": "https://www.example.com",
        "image_hash": "<IMAGE_HASH_1>"
      }
    },
    "media_sourcing_spec": {
      "images": [
        {
          "hash": "<IMAGE_HASH_1>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "text_customizations": {
            "titles": [{"text": "Summer Collection Now Live"}],
            "bodies": [{"text": "Shop our latest summer styles today"}],
            "descriptions": [{"text": "Free shipping on orders over $50"}]
          }
        },
        {
          "hash": "<IMAGE_HASH_2>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "text_customizations": {
            "titles": [{"text": "Winter Essentials Are Here"}],
            "bodies": [{"text": "Cozy up with our winter picks"}]
          }
        }
      ],
      "titles": [
        {"text": "Global Headline Option 1"},
        {"text": "Global Headline Option 2"}
      ],
      "bodies": [
        {"text": "Global primary text option 1"},
        {"text": "Global primary text option 2"}
      ],
      "descriptions": [
        {"text": "Global description"}
      ]
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>'
```

On success, your app receives a JSON response with the ad ID.

```json
{
  "id": "<AD_ID>"
}
```

## Add destination customizations

You can set different destination URLs for each media asset using `destination_customizations`.

Each destination customization requires:

- `url` — the destination URL for this media asset
- `display_url` (optional) — the display URL shown to the user

This allows each image or video in the ad to link to a different landing page.

### Example request

```
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads" \
  -F 'name=My Destination Customized Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'status=PAUSED' \
  -F 'creative={
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "link_data": {
        "link": "https://www.example.com",
        "image_hash": "<IMAGE_HASH_1>"
      }
    },
    "media_sourcing_spec": {
      "images": [
        {
          "hash": "<IMAGE_HASH_1>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "destination_customizations": [
            {
              "url": "https://www.example.com/summer-sale",
              "display_url": "example.com/summer-sale"
            }
          ]
        },
        {
          "hash": "<IMAGE_HASH_2>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "destination_customizations": [
            {
              "url": "https://www.example.com/winter-sale",
              "display_url": "example.com/winter-sale"
            }
          ]
        }
      ]
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>'
```

On success, your app receives a JSON response with the ad ID.

```json
{
  "id": "<AD_ID>"
}
```

## Add placement customizations

You can exclude specific media assets from specific placements using `placement_customizations` on each image or video.

Each placement customization requires:

- `publisher_platform` — the platform to customize. Valid values: `facebook`, `instagram`, `audience_network`, `messenger`, `whatsapp`, `threads`.
- `placement_exclusions` — an array of placement positions to exclude for that platform (for example, `"right_hand_column"`, `"story"`, `"reels"`).

Placement exclusion positions must be valid for the specified publisher platform. See [Placement Targeting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/placement-targeting) for valid platforms and positions.

### Example request

```
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads" \
  -F 'name=My Placement Customized Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'status=PAUSED' \
  -F 'creative={
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "link_data": {
        "link": "https://www.example.com",
        "image_hash": "<IMAGE_HASH_1>"
      }
    },
    "media_sourcing_spec": {
      "images": [
        {
          "hash": "<IMAGE_HASH_1>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "placement_customizations": [
            {
              "publisher_platform": "facebook",
              "placement_exclusions": ["right_hand_column"]
            },
            {
              "publisher_platform": "instagram",
              "placement_exclusions": ["story", "reels"]
            }
          ]
        },
        {
          "hash": "<IMAGE_HASH_2>",
          "source": "multi_media",
          "opt_in_status": "opt_in"
        }
      ]
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>'
```

On success, your app receives a JSON response with the ad ID.

```json
{
  "id": "<AD_ID>"
}
```

## Add image crop customizations

You can set manual crop coordinates per image for specific aspect ratios using `image_crops`. See [Image Crops](https://developers.facebook.com/documentation/ads-commerce/marketing-api/image-crops) for supported aspect ratios and coordinate formats.

Each crop spec requires:

- `type` — the crop type. Valid values: `manual`, `auto_crop`, `smart_crop`, `super_crop`.
- `crop_spec` — a dictionary where keys are aspect ratios (for example, `"100x100"` for 1:1) and values are arrays of two coordinate points representing the top-left `[x, y]` and bottom-right `[x, y]` of the crop rectangle.

### Example request

```
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads" \
  -F 'name=My Cropped Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'status=PAUSED' \
  -F 'creative={
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "link_data": {
        "link": "https://www.example.com",
        "image_hash": "<IMAGE_HASH_1>"
      }
    },
    "media_sourcing_spec": {
      "images": [
        {
          "hash": "<IMAGE_HASH_1>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "image_crops": [
            {
              "type": "manual",
              "crop_spec": {
                "100x100": [[316, 0], [1472, 1156]],
                "191x100": [[0, 100], [1920, 1100]]
              }
            }
          ]
        },
        {
          "hash": "<IMAGE_HASH_2>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "image_crops": [
            {
              "type": "manual",
              "crop_spec": {
                "100x100": [[0, 0], [1080, 1080]]
              }
            }
          ]
        }
      ]
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>'
```

On success, your app receives a JSON response with the ad ID.

```json
{
  "id": "<AD_ID>"
}
```

## Create a multi-media ad with combined customizations

You can combine all customization types — text, placement, destination, and crops — on each media asset within a single ad. This example shows a mixed media ad (image + video) with all customizations applied.

### Example request

```
curl -X POST "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads" \
  -F 'name=My Fully Customized Multi-Media Ad' \
  -F 'adset_id=<AD_SET_ID>' \
  -F 'status=PAUSED' \
  -F 'creative={
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "link_data": {
        "link": "https://www.example.com",
        "image_hash": "<IMAGE_HASH_1>"
      }
    },
    "media_sourcing_spec": {
      "images": [
        {
          "hash": "<IMAGE_HASH_1>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "text_customizations": {
            "titles": [{"text": "Summer Collection Now Live"}],
            "bodies": [{"text": "Shop our latest summer styles"}],
            "descriptions": [{"text": "Free shipping on orders over $50"}]
          },
          "destination_customizations": [
            {
              "url": "https://www.example.com/summer",
              "display_url": "example.com/summer"
            }
          ],
          "placement_customizations": [
            {
              "publisher_platform": "facebook",
              "placement_exclusions": ["right_hand_column"]
            }
          ],
          "image_crops": [
            {
              "type": "manual",
              "crop_spec": {
                "100x100": [[316, 0], [1472, 1156]]
              }
            }
          ]
        }
      ],
      "videos": [
        {
          "video_id": "<VIDEO_ID_1>",
          "original_video_id": "<VIDEO_ID_1>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "thumbnail_source": "generated_default",
          "thumbnail_url": "https://example.com/thumbnail.jpg",
          "text_customizations": {
            "titles": [{"text": "Watch Our Latest Video"}],
            "bodies": [{"text": "See what is new this season"}]
          },
          "destination_customizations": [
            {
              "url": "https://www.example.com/video-landing",
              "display_url": "example.com/video-landing"
            }
          ],
          "placement_customizations": [
            {
              "publisher_platform": "instagram",
              "placement_exclusions": ["story"]
            }
          ]
        }
      ],
      "titles": [
        {"text": "Global Headline 1"},
        {"text": "Global Headline 2"}
      ],
      "bodies": [
        {"text": "Global primary text 1"},
        {"text": "Global primary text 2"}
      ],
      "descriptions": [
        {"text": "Global description"}
      ]
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>'
```

On success, your app receives a JSON response with the ad ID.

```json
{
  "id": "<AD_ID>"
}
```

## Read a multi-media ad

To read the multi-media configuration of an ad, send a `GET` request to the `/<AD_ID>` endpoint with `creative{media_sourcing_spec}` in the `fields` parameter.

### Example request

```
curl -G \
  -d 'fields=creative{media_sourcing_spec}' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<AD_ID>/
```

### Response

```json
{
  "creative": {
    "media_sourcing_spec": {
      "images": [
        {
          "hash": "<IMAGE_HASH_1>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "text_customizations": {
            "titles": [{"text": "Summer Collection Now Live"}],
            "bodies": [{"text": "Shop our latest summer styles"}],
            "descriptions": [{"text": "Free shipping on orders over $50"}]
          },
          "destination_customizations": [
            {
              "url": "https://www.example.com/summer",
              "display_url": "example.com/summer"
            }
          ],
          "placement_customizations": [
            {
              "publisher_platform": "facebook",
              "placement_exclusions": ["right_hand_column"]
            }
          ],
          "image_crops": [
            {
              "type": "manual",
              "crop_spec": {
                "100x100": [[316, 0], [1472, 1156]]
              }
            }
          ]
        },
        {
          "hash": "<IMAGE_HASH_2>",
          "source": "multi_media",
          "opt_in_status": "opt_in"
        }
      ],
      "videos": [
        {
          "video_id": "<VIDEO_ID_1>",
          "original_video_id": "<VIDEO_ID_1>",
          "source": "multi_media",
          "opt_in_status": "opt_in",
          "thumbnail_source": "generated_default",
          "thumbnail_url": "https://example.com/thumbnail.jpg",
          "text_customizations": {
            "titles": [{"text": "Watch Our Latest Video"}],
            "bodies": [{"text": "See what is new this season"}]
          }
        }
      ],
      "titles": [
        {"text": "Global Headline 1"},
        {"text": "Global Headline 2"}
      ],
      "bodies": [
        {"text": "Global primary text 1"},
        {"text": "Global primary text 2"}
      ],
      "descriptions": [
        {"text": "Global description"}
      ]
    }
  },
  "id": "<AD_ID>"
}
```

## See also

- [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative)
- [Ad Group](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)
- [Ad Creative Object Story Spec](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative-object-story-spec)
