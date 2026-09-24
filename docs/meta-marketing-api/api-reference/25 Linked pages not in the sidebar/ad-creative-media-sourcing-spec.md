<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-creative-media-sourcing-spec | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Creative Media Sourcing Spec

## Reading

The media_sourcing_spec supports configuration of related media, which allows existing media assets from an ad account to be added alongside your new ad creatives.

When specified, the related_media field enables the system to source and link relevant images or videos from other active campaigns within the same account.

To check the creative, read `media_sourcing_spec`:

```

curl -X GET \
  -d 'fields="media_sourcing_spec"' \
  -d 'access_token=/<ACCESS_TOKEN>' \
  https://graph.facebook.com/v22.0/<CREATIVE_ID>

```

Response:

```

{
  "media_sourcing_spec": {
    "related_media": {
      "images": [
        {
          "hash": <IMAGE_HASH_1>,
          "image_crops":
          {
            "90x160": [
              [
                98,
                0
              ],
              [
                908,
                1440
              ]
            ]
          }
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
        }
      ],
    }
  }
}

```

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `related_media`[AdCreativeMediaSourcingRelatedMediaSpec](https://developers.facebook.com/docs/graph-api/reference/ad-creative-media-sourcing-related-media-spec/) | The additional creative assets using the same ad setup, to reach users more efficiently. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
