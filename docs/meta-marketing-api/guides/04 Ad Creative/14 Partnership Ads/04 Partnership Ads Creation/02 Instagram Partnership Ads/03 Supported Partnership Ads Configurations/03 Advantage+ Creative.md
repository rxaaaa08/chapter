<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/supported-configurations/advantage-creative | Saved: 2026-09-19 -->

# Partnership Ads with Advantage+ Creative



You can boost existing Instagram posts as partnership ads with [Advantage+ Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/advantage-creative).

## Standard Enhancements

### Example request

```html
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
  -F "degrees_of_freedom_spec={
    "creative_features_spec": {
      "standard_enhancements": {
        "enroll_status": "OPT_IN"
      }
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

## Product Extensions

### Example request

```html
curl -X POST \
  -F "name=Product Extension Creative" \
  -F "object_id=<PAGE_ID>" \
  -F "source_instagram_media_id=<IG_MEDIA_ID>" \
  -F "facebook_branded_content={
    "sponsor_page_id": "<FB_SPONSOR_PAGE_ID>"
  }" \
  -F "instagram_branded_content={
    "sponsor_id": "<IG_SPONSOR_ID>"
  }" \
  -F "creative_sourcing_spec={
    "associated_product_set_id": "<PRODUCT_SET_ID>"
  }" \
  -F "degrees_of_freedom_spec={
    "creative_features_spec": {
      "product_extensions": {
        "enroll_status": "OPT_IN",
        "action_metadata": {
          "type": "MANUAL"
        }
      }
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

## Learn More

* [Get Started with Advantage+ Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/advantage-creative/get-started)
