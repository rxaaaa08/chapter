<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/supported-configurations/click-to-message-destinations | Saved: 2026-09-19 -->

# Partnership ads with Click to Message destinations



You can create partnership ads that click to different messaging destinations.

### Example request

```bash
curl -X POST \
  -F "name=My creative title" \
  -F "object_id=<FB_PAGE_ID>" \
  -F "source_instagram_media_id=<IG_MEDIA_ID>" \
  -F "facebook_branded_content={
    "sponsor_page_id": "<FB_SPONSOR_PAGE_ID>"
  }" \
  -F "instagram_branded_content={
    "sponsor_id": "<IG_SPONSOR_ID>"
  }" \
  -F "branded_content={
    "promoted_page_id": "<PROMOTED_PAGE_ID>"
  }" \
  -F "call_to_action={
    "type": "LEARN_MORE",
    "value": {
      "app_destination": "MESSENGER",
      "link": "<LINK_URL>"
    }
  }" \
  -F "access_token=<ACCESS_TOKEN>"
"https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives"
```

### Example response

```html
{
  "id": "<CREATIVE_ID>"
}
```

## Learn more

* [Messaging Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads)
