<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/supported-configurations/testimonial-ads | Saved: 2026-09-19 -->

# Testimonials in Partnership Ads



Advertisers can add a creator testimonial as a featured comment to their partnership ads. You can add testimonials to partnership ads featuring creator or brand media.

### Permissions

You need the following permissions:

* `ads_management`
* `business_management`
* `pages_read_engagement`
* `pages_show_list`
* `instagram_basic`
* `instagram_branded_content_ads_brand`

## Inline partnership testimonial ads

### Example request (inline ads)

For ad creative creation:

```bash
curl -X POST \
  -F "branded_content={
    "testimonial": "Test Testimonial Ads"
  }" \
  -F "facebook_branded_content={
    "sponsor_page_id": "<FB_SPONSOR_PAGE_ID>"
  }" \
  -F "instagram_branded_content={
    "sponsor_id": "<IG_SPONSOR_ID>"
  }" \
  -F "object_story_spec={
    "instagram_user_id": "<IG_USER_ID>",
    "page_id": "<FB_PAGE_ID>",
    "link_data": {
      "call_to_action": {
        "type": "LEARN_MORE"
      },
      "caption": "<CAPTION_TEXT>",
      "link": "<LINK_URL>",
      "message": "<MESSAGE_TEXT>",
      "name": "<NAME>",
      "picture": "<PICTURE_URL>"
    }
  }" \
  -F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives"
```

### Example response (inline ads)

```html
{
  "id": "<CREATIVE_ID>"
}
```

## Boost partnership testimonial ads

### Example request (boost ads)

For ad creative creation:

```bash
curl -X POST \
  -F "branded_content={
    "testimonial": "Test Boosting Testimonial Ads"
  }" \
  -F "facebook_branded_content={
    "sponsor_page_id": "<FB_SPONSOR_PAGE_ID>"
  }" \
  -F "instagram_branded_content={
    "sponsor_id": "<IG_SPONSOR_ID>"
  }" \
  -F "source_instagram_media_id=<SOURCE_IG_MEDIA_ID>" \
  -F "object_id=<OBJECT_ID>"
  -F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives"
```

### Example response (boost ads)

```html
{
  "id": "<CREATIVE_ID>"
}
```

## Learn more

* [Create Partnership Ads by Boosting an Existing Post](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/partnership-ads/ads-creation/boost-existing-post)
