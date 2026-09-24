<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/supported-configurations/lead-ads | Saved: 2026-09-19 -->

# Lead Generation for Partnership Ads



Lead generation ads help gather contact information from people who might be interested in your product or service. These ads help create a list of potential customers to follow up with later.

Lead generation for partnership ads enables lead form support where the advertiser is either the primary or partner identity on the ad.

### Permissions

You will need the following permissions:

* `ads_management`
* `pages_manage_ads`
* `pages_read_engagement`
* `pages_show_list`
* `instagram_basic` (for boosting existing posts)
* `instagram_branded_content_ads_brand` (for boosting existing posts)

### Limitations

* For partnership ads, the lead generation form must use the greeting card format.
* Use a lead generation form owned by the Facebook Page used in the ad set.

## Inline partnership lead generation ads

### Example request

For ad creative creation:

```bash
curl -X POST \
  -F "object_story_spec={
    "instagram_user_id": "<IG_USER_ID>",
    "page_id": "<FB_PAGE_ID>",
    "link_data": {
      "call_to_action": {
        "type": "SIGN_UP",
        "value": {
          "lead_gen_form_id": "<LEAD_GEN_FORM_ID>"
        }
      },
      "description": "Test leadgen 1750",
      "link": "<LINK_URL>",
      "message": "<MESSAGE_TEXT>",
      "name": "<NAME>",
      "image_hash": "<IMAGE_HASH>"
    },
    "object_type": "SHARE",
    "title": "<TITLE>"
  }" \
  -F "facebook_branded_content={
    "sponsor_page_id": "<FB_SPONSOR_PAGE_ID>"
  }" \
  -F "instagram_branded_content={
    "sponsor_id": "<IG_SPONSOR_ID>"
  }"
  -F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v23.0/act_<AD_ACCOUNT_ID>/adcreatives"
```

### Example response

```html
{
  "id": "<CREATIVE_ID>"
}
```

## Boost partnership lead generation ads

### Example request

For ad creative creation:

```bash
curl -X POST \
  -F "facebook_branded_content={
    "sponsor_page_id": "<FB_SPONSOR_PAGE_ID>"
  }" \
  -F "instagram_branded_content={
    "sponsor_id": "<IG_SPONSOR_ID>"
  }" \
  -F "object_id=<OBJECT_ID>" \
  -F "call_to_action={
    "type": "SIGN_UP",
    "value": {
      "lead_gen_form_id": "<LEAD_GEN_FORM_ID>",
      "link": "<LINK_URL>"
    }
  }" \
  -F "instagram_user_id=<IG_USER_ID>" \
  -F "source_instagram_media_id=<SOURCE_IG_MEDIA_ID>"
  -F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v23.0/act_<AD_ACCOUNT_ID>/adcreatives"
```

### Example response

```html
{
  "id": "<CREATIVE_ID>"
}
```

## Learn more

* [Lead Forms for Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/create)
* [Page Leadgen Forms](https://developers.facebook.com/docs/graph-api/reference/page/leadgen_forms)
