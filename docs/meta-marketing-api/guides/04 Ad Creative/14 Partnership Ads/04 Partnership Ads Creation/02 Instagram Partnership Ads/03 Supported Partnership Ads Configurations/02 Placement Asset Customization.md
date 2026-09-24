<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/supported-configurations/placement-asset-customization | Saved: 2026-09-19 -->

# Partnership Ads with Placement Asset Customization



You can boost existing Instagram posts as partnership ads with [Placement Asset Customization](https://developers.facebook.com/documentation/ads-commerce/marketing-api/dynamic-creative/placement-asset-customization).

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
  -F "asset_feed_spec={
    "optimization_type": "PLACEMENT",
    "asset_customization_rules": [
      {
        "image_label": {
          "name": "<IMAGE_LABEL>"
        },
        "customization_spec": {
          "publisher_platforms": [
            "instagram"
          ],
          "instagram_positions": [
            "stream"
          ]
        }
      }
    ]
    // other asset feed spec fields
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

* [Placement Asset Customization](https://developers.facebook.com/documentation/ads-commerce/marketing-api/dynamic-creative/placement-asset-customization)
* [Placement Targeting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/placement-targeting)
