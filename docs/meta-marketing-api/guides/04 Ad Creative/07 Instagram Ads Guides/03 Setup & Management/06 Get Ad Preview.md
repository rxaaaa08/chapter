<!-- Source: https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/get-ad-preview | Saved: 2026-09-19 -->

# Get Ad Preview



For Instagram Ads, you can get a preview of:

- [Existing Ads](#existing)
- [New ads, before adding creative](#before-creative)
- [New ads, after adding creative](#after-creative)

## Preview Existing Ads {#existing}

You can use format options with an ad or ad creative ID to [preview](https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview) an existing ad. For `ad_format`, you have:

| Format | Description |
| --- | --- |
| `INSTAGRAM_EXPLORE_CONTEXTUAL` | Instagram Explore Feed format. [Learn more about ads in Instagram Explore](https://www.facebook.com/business/help/468874930636689?id=1997185213680277). |
| `INSTAGRAM_EXPLORE_IMMERSIVE` | Instagram Explore Video format. [Learn more about ads in Instagram Explore](https://www.facebook.com/business/help/468874930636689?id=1997185213680277). |
| `INSTAGRAM_REELS` | Instagram [Reels placement](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instagramads/get-started#targeting). |
| `INSTAGRAM_STANDARD` | Instagram [feed post](https://developers.facebook.com/docs/instagram/sharing-to-feed) format. |
| `INSTAGRAM_STORY` | Instagram [story](https://developers.facebook.com/docs/instagram/sharing-to-stories) format. |
| `THREADS_STREAM` | Threads feed post format. |

The Instagram ad preview call looks like this:

```html
curl -G \
  -d 'ad_format=INSTAGRAM_STANDARD' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_ID>/previews
```

The Threads ad preview call looks like this:

```html
curl -G \
  -d 'ad_format=THREADS_STREAM \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_ID>/previews
```

## Preview Before Adding Creative {#before-creative}

### Instagram

To preview an ad before providing ad creative, pass the creative's `object_story_spec` in the preview's `creative` parameter. You must provide `instagram_user_id` and `page_id` for both Instagram-only placement and mixed placement ads:

```html
curl -G \
  --data-urlencode 'creative={
    "object_story_spec": {
      "instagram_user_id": "<INSTAGRAM_USER_ID>",
      "link_data": {
        "call_to_action": {"type":"LEARN_MORE","value":{"link":"<URL>"}},
        "caption": "www.example.com",
        "image_hash": "<IMAGE_HASH>",
        "link": "<URL>",
        "message": "Ad Message"
      },
      "page_id": "<PAGE_ID>"
    }
  }' \
  -d 'ad_format=INSTAGRAM_STANDARD' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/generatepreviews
```

### Threads
To preview an ad before providing an ad creative, pass the creative's `object_story_spec` in the preview's `creative` parameter. You must provide `threads_user_id` and `page_id` for both Threads with Instagram placements:

```html
curl -G \
  --data-urlencode 'creative={
    "object_story_spec": {
      "instagram_user_id": "<INSTAGRAM_USER_ID>",
      "threads_user_id" : "<THREAD_USER_ID>"
      "link_data": {
        "call_to_action": {"type":"LEARN_MORE","value":{"link":"<URL>"}},
        "caption": "www.example.com",
        "image_hash": "<IMAGE_HASH>",
        "link": "<URL>",
        "message": "Ad Message"
      },
      "page_id": "<PAGE_ID>"
    }
  }' \
  -d 'ad_format=THREADS_STREAM \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/generatepreviews
```

## Preview After Adding Creative {#after-creative}
After you provide ad creative, you can get the URL for the corresponding Instagram post, and can see responses to the ad post. The post is not identical to the one your audience sees. It does not have "Sponsored" or a call-to-action.

This URL is not available with Advantage+ catalog ad creatives, which is when you use `template_data` in `object_story_spec`. This URL is also unavailable for ad creatives for ads in Instagram stories.

### Example request

```html
curl -X GET \
  -d 'fields="instagram_permalink_url"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CREATIVE_ID>/
```

### Example response  

```html
{
  "instagram_permalink_url": "<INSTAGRAM_POST_URL>",
  "id": "<AD_CREATIVE_ID>"
}
```
