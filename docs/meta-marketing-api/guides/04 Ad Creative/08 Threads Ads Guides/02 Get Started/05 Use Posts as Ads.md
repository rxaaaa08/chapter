<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation/use-posts-as-ads | Saved: 2026-09-19 -->

# Promote Existing Posts as Threads Ads



You can create Threads ads by promoting existing Facebook or Instagram posts. This allows you to use content that has already been published on Facebook or Instagram as an ad creative with media (image, video, or carousel) from the original post. Social engagement (likes and comments) on the Threads ad does not propagate back to the original post on Facebook or Instagram.

### Supported Post Types {#supported-post-types}

| Source platform | Supported media types |
| --- | --- |
| Facebook post | Image, Video, Image Carousel |
| Instagram post | Image, Video, Image Carousel |

## Before you begin

Make sure you are familiar with the basic [Threads ads creation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation) process and know how to [use posts as Instagram ads](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/use-posts-as-ads).

### Limitations {#limitations}

* Existing Threads organic posts cannot be promoted as ads.
* Only image carousels are supported.
* Boosting existing posts as partnership ads (branded content) are not supported for Threads.
* Social engagement on the Threads ad does not propagate back to the original post on the source platform.
* All standard [Threads ads media requirements](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation#media-requirements) apply.
* Media posts containing copyrighted music or interactive elements such as filters cannot be promoted.

## Promote an existing Instagram post

To promote an existing Instagram post as a Threads ad, you provide the `source_instagram_media_id` of the organic Instagram post in your ad creative, along with the required identity fields. This media should be [eligible to be boosted as an ad](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/use-posts-as-ads#ig-posts-step-2).

### Example request

```html
curl -X POST \
  -F 'source_instagram_media_id=<IG_MEDIA_ID>' \
  -F 'object_id=<PAGE_ID>' \
  -F 'instagram_user_id=<IG_USER_ID>' \
  -F 'threads_user_id=<THREADS_USER_ID>' \
  -F 'call_to_action={"type": "LEARN_MORE", "value": {"link": "<LINK_URL>"}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Example response

```json
{
  "id": "<CREATIVE_ID>"
}
```

## Promote an existing Facebook post

To promote an existing Facebook post as a Threads ad, you use the `object_story_id` (`<PAGE_ID>_<POST_ID>`) to identify the Facebook post, along with the required identity fields.

### Example request

```html
curl -X POST \
  -F 'object_story_id=<PAGE_ID>_<POST_ID>' \
  -F 'instagram_user_id=<IG_USER_ID>' \
  -F 'threads_user_id=<THREADS_USER_ID>' \
  -F 'call_to_action={"type": "LEARN_MORE", "value": {"link": "<LINK_URL>"}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Example response

```json
{
  "id": "<CREATIVE_ID>"
}
```

## Create the ad

Once you have the ad creative ID, use it to create an ad linking your ad set.

### Example request

```html
curl -X POST \
  -F 'name=<AD_SET_NAME>' \
  -F 'adset_id=<ADSET_ID>' \
  -F 'creative={"creative_id": "<CREATIVE_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

## Learn More

* [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative)
* [Use Posts as Instagram Ads](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/use-posts-as-ads)
* [Threads Ads Creation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation)
