<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/advantage-creative/add-site-links | Saved: 2026-09-19 -->

# Add Site Links Feature



The [**Add site links** feature in Ads Manager](https://www.facebook.com/business/help/1127018781828932) is an Advantage+ Creative optimization that showcases additional URLs below your static or dynamic single media (only on Facebook feed) when Meta predicts the additional URLs will improve performance. This guide covers using the Add site links feature using the Marketing API.

#### Eligibility criteria

To be eligible to use this feature, your ad campaign must have:

* Traffic, Engagement, Leads, or Sales as your ad objective.
* Website as your conversion location.
* Single image or video ad format.

## Before you begin

Set up your ad campaigns using the following instructions:

1. [Create an ad campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-campaign)
2. [Create an ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-set)

## Create an ad creative and ad

### Standalone creative creation

#### Before

```bash
curl -X POST \
  -F 'name=Creative With Site Links' \
  -F 'object_story_spec={
      "link_data": {
         "link": "<URL>",
      },
      "page_id": "<PAGE_ID>",
      "instagram_actor_id": "<INSTAGRAM_ACTOR_ID>",
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### After
The example highlights new fields in bold.

```bash
curl -X POST \
  -F 'name=Creative With Site Links' \
  -F 'object_story_spec={
    "link_data": {
      "link": "<URL>",
    },
    "page_id": "<PAGE_ID>",
    "instagram_actor_id": "<INSTAGRAM_ACTOR_ID>",
    }' \
-F 'creative_sourcing_spec={
    "site_links_spec": [{
      "site_link_title": "<SITE_LINK_TITLE>",
      "site_link_url" : "<SITE_LINK_URL>",
    },
    {
      "site_link_title": "<SITE_LINK_TITLE>",
      "site_link_url" : "<SITE_LINK_URL>",
    },
    {
      "site_link_title": "<SITE_LINK_TITLE>",
      "site_link_url" : "<SITE_LINK_URL>",
    },
    {
      "site_link_title": "<SITE_LINK_TITLE>",
      "site_link_url" : "<SITE_LINK_URL>",
    }],
  }' \
-F 'degrees_of_freedom_spec={
    "creative_features_spec": {
      "site_extensions": {
        "enroll_status": "OPT_IN",
      },
    },
  }' \   -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Ad creation

#### Before

```bash
-F 'creative={
  "object_story_spec": {
    "page_id": "<PAGE_ID>",
    "link_data": {
      "link": "<WEBSITE_URL>",
    }
  },
}' \
-F "adset_id=<ADSET_ID>" \
-F "name=New Ad" \
-F "status=PAUSED" \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

#### After
The example highlights new fields in bold.

```bash
curl -X POST \
  -F 'creative={
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "link_data": {
        "link": "<WEBSITE_URL>",
      }
    },
    "creative_sourcing_spec": {
"site_links_spec": [{
        "site_link_title": "<SITE_LINK_TITLE>",
        "site_link_url" : "<SITE_LINK_URL>",
      },
      {
        "site_link_title": "<SITE_LINK_TITLE>",
        "site_link_url" : "<SITE_LINK_URL>",
      },
      {
        "site_link_title": "<SITE_LINK_TITLE>",
        "site_link_url" : "<SITE_LINK_URL>",
      },
      {
        "site_link_title": "<SITE_LINK_TITLE>",
        "site_link_url" : "<SITE_LINK_URL>",
      }],},
"degrees_of_freedom_spec": {
  "creative_features_spec": {
"site_extensions": {
          "enroll_status": "OPT_IN",
        }      }
    }
  }' \
  -F "adset_id=<ADSET_ID>" \
  -F "name=New Ad" \
  -F "status=PAUSED" \
  -F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

### Parameters

| Name | Description |
| --- | --- |
| `site_link_title` | Specifies the display label of the site link.<br><br>It can be added in `site_links_spec`, see [Ad Creative Site Links Spec, Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-site-links-spec). |
| `site_link_url` | Specifies the URL of the site link.<br><br>It can be added in `site_links_spec`, see [Ad Creative Site Links Spec, Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-site-links-spec). |
| `site_link_image_hash` | Specifies the image of the site link. Use either `site_link_image_hash` or `site_link_image_url`. When both exist, `site_link_image_url` takes precedence.<br><br>It can be added in `site_links_spec`, see [Ad Creative Site Links Spec, Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-site-links-spec). |
| `site_link_image_url` | Specifies the image of the site link. Use either `site_link_image_hash` or `site_link_image_url`. When both exist, `site_link_image_url` takes precedence.<br><br>It can be added in `site_links_spec`, see [Ad Creative Site Links Spec, Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-site-links-spec). |
| `site_extensions` | "Add site links", an Advantage+ Creative optimization that showcases additional URLs below your static or dynamic single media when Meta predicts the additional URLs will improve performance. Set the `enroll_status` field with `OPT_IN` to enable `site_extensions`.<br><br>It can be added in `creative_features_spec`. For more details, see [Ad Creative Features Details, Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details). |

## Learn more

### Business help center

* [Create ads with site links in Meta Ads Manager](https://www.facebook.com/business/help/1127018781828932)

### Marketing API reference
* [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative#fields)
    * [Ad Creative Sourcing Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-sourcing-spec)
    * [Ad Creative Site Links Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-site-links-spec)
    * [Ad Creative Degrees Of Freedom Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-degrees-of-freedom-spec)
    * [Ad Creative Features Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-features-spec)
    * [Ad Creative Feature Details](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details)
    * [Ad Creative Object Story Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec)
