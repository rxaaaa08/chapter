<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/generative-ai-features | Saved: 2026-09-19 -->

# Get Started with the Generative AI Features on Marketing API



**Warning:** **API support for Generative AI features**  

Advertisers are responsible for previewing ad creative featuring AI-generated creatives before publishing their ads. See preview configuration instructions.

Meta does not make any warranties regarding the completeness, reliability, and accuracy of the suggested text generations, generated backgrounds, or expanded images. If you use Marketing API to access our Generative AI features outlined below, the [Ad Creative Generative AI Terms](https://www.facebook.com/legal/terms/ad_creative_generative_ai_terms) apply in addition to the [Meta Platform Terms](https://developers.facebook.com/terms/dfc_platform_terms/).

This document shows you how to use [text generation](#text-generation), [image expansion](#image-expansion), and [background generation](#background-generation) generative AI features for ads.

## Before you begin

You need to follow these steps to set up your ad campaigns with Meta generative AI features.

1. [Create a Campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#campaign)
1. [Create an Ad Set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#ad-set-budget)
1. [Create the Ad or a standalone Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#ad-creative)
1. [Preview the Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative#previews)
1. [Enable the Ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#book-ad)

## Text generation

Meta generates text variations with AI inspired by your original primary text, your previous ads, or content from your business Page to help make suggestions more relevant. Adding more text options to your ad can help customize your creative and reduce repetition across your creatives, which can help increase performance. [Learn more about this feature here](https://www.facebook.com/business/help/497610041230617).

### Step 1: Opt in to use text generation when creating the ad

You can create an ad through the `/ads` endpoint or create a standalone creative through the `/adcreatives` endpoint. Opt-in to the feature only applies to the ad or creative created in the current request. In either approach, opt-in to use the Text Generation feature by:

1. Providing a primary text in the `message` field in the `object_story_spec`
2. Opting in to use `text_generation`

See example requests below:

#### Opt-in through `/adcreatives` endpoint

```
curl -X POST \
  -F 'name=Text Gen Creative' \
  -F 'object_story_spec={
      "link_data": {
         "image_hash": "<IMAGE_HASH>",
         "link": "<URL>",
         "message": "<PRIMARY_TEXT_HERE>",  <--- Primary Text Here
      },
      "page_id": "<PAGE_ID>"
  }' \
  -F 'degrees_of_freedom_spec={
    "creative_features_spec": {
      "text_generation": {
        "enroll_status": "OPT_IN"
      }
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

Or you can create an ad object with the `act_<AD_ACCOUNT_ID>/ads` endpoint:

#### Opt-in through `/ads` endpoint

```
curl \
  -F 'adset_id=<ADSET_ID>' \
  -F 'creative={
    "name": "Text Gen Adgroup",
    "object_story_spec": {
      "link_data": {
         "image_hash": "<IMAGE_HASH>",
         "link": "<URL>",
         "message": "<PRIMARY_TEXT_HERE>",  <--- Primary Text Here
      },
      "page_id": "<PAGE_ID>"
    },
    "degrees_of_freedom_spec": {
      "creative_features_spec": {
        "text_generation": {
          "enroll_status": "OPT_IN"
        }
      }
    }
  }' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

### Step 2: Preview for text generation

When an ad is created with opt-in to use `text_generation`, the feature will only be applied to the current ad, and Meta inserts generated primary texts into the creative spec. If the feature was opted-in through the `/ads` endpoint, the system sets the `status` field on the adgroup to `PAUSED` by default ([see documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)). You can review the generated suggestions before manually setting the ad's status to `ACTIVE` so it can be delivered.

You can preview the creative spec containing generated suggestions by reading the `asset_feed_spec` through the creative ID or the ad ID. See example request and response below:

Start by querying `asset_feed_spec` of your standalone ad creative created in step 1.

#### Request

```
// request from creative
curl -X GET -G \
  -d 'fields=asset_feed_spec' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<CREATIVE_ID>

// request from ad
curl -X GET -G \
  -d 'fields=creative{asset_feed_spec,status}' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<AD_ID>
```

#### Response

```
{
  "asset_feed_spec": {
    "bodies": [
      {
        "text": "Buy some cool LED TV at cheap price"
      },
      {
        "text": "Get your dream LED TV at an unbeatable price! Buy now and save big!"
      },
      {
        "text": "Get the best LED TV deals! 📺 Save money and upgrade your entertainment."
      },
      {
        "text": "Get an LED TV at a low cost! Cheap, high-quality options are available."
      },
      {
        "text": "Get LED TVs at affordable prices  ✨  !"
      }
    ],
    "optimization_type": "DEGREES_OF_FREEDOM"
  },
  "id": "<CREATIVE_ID>"
}
```

**Once you have reviewed the suggestions and they appear acceptable to publish, continue to Step 3 to set the ad to `ACTIVE`. If any of the generated suggestions are not acceptable, [create a new ad or creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#ad-creative) without opt-in to Text Generation.**

#### Create creative without opt-in to text generation

```
curl -X POST \
  -F 'name=Text Gen Creative' \
  -F 'object_story_spec={
      "link_data": {
         "image_hash": "<IMAGE_HASH>",
         "link": "<URL>",
         "message": "<PRIMARY_TEXT_HERE>",
      },
      "page_id": "<PAGE_ID>"
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Step 3: Set the adgroup status to `ACTIVE`

After you have verified the generated text suggestions, you can set the `status` of the ad to `ACTIVE`. This step needs to be done in both cases:

1. When an ad opts in to the feature through the `/ads` endpoint
2. If the ad is the first ad to use an existing creative with opt-in to text generation.

#### Request

```
curl \
  -F 'status=ACTIVE' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<AD_ID>
```

## Image expansion

Automatically expand your image to fit more placements.

### Step 1: Create an ad or creative opted-in to image expansion

You can create an ad through the `/ads` endpoint or create a standalone creative through the `/adcreatives` endpoint. In either approach, opt-in to use the Image Expansion feature in the creative spec (see examples below).

#### Request

```
// creative example
curl -X POST \
  -F 'name=Image Expansion Creative' \
  -F 'degrees_of_freedom_spec={
    "creative_features_spec": {
      "image_uncrop": {
        "enroll_status": "OPT_IN"
      }
    }
  }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives

// ad example
curl \
  -F 'adset_id=<ADSET_ID>' \
  -F 'creative={
    "name": "Image Expansion Adgroup",
    "object_story_spec": {
      "link_data": {
         "image_hash": "<IMAGE_HASH>",
         "link": "<URL>",
         "message": "You got this.",
      },
      "page_id": "<PAGE_ID>"
    },
    "degrees_of_freedom_spec": {
      "creative_features_spec": {
        "image_uncrop": {
          "enroll_status": "OPT_IN"
        }
      }
    }
  }' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

### Step 2: Preview for image expansion

This feature is supported for `INSTAGRAM_STANDARD`, `FACEBOOK_REELS_MOBILE`, `INSTAGRAM_REELS`, `MOBILE_FEED_STANDARD`, `INSTAGRAM_STORY` placements. To look at a preview for these placements, make a `GET` request to the `/<AD_ID>/previews` endpoint.

**If any of the generated images are not acceptable, re-create the ad or creative without opt-in to Image Expansion:**

* Set the `creative_feature` as `image_uncrop`.
* Re-request the preview if the `status` shows as `pending`.

**Note:** If a `transformation_spec` node is not shown, that means the creative is not eligible for image expansion.

#### Request
`INSTAGRAM_STANDARD`

```
curl -X GET -G \
  -d 'ad_format=INSTAGRAM_STANDARD' \
  -d 'creative_feature=image_uncrop' \
  -d 'access_token=/<ACCESS_TOKEN>' \
  https://graph.facebook.com/v19.0/<AD_ID>/previews
```

`FACEBOOK_REELS_MOBILE`

```
curl -X GET -G \
  -d 'ad_format=FACEBOOK_REELS_MOBILE' \
  -d 'creative_feature=image_uncrop' \
  -d 'access_token=/<ACCESS_TOKEN>' \
  https://graph.facebook.com/v19.0/<AD_ID>/previews
```

#### Response

```
{
  "data": [
    {
      "body": "<iframe src='<PREVIEW_URL>'></iframe>",
      "transformation_spec": {
        "image_uncrop": [
          {
            "body": "<iframe src='<PREVIEW_URL>'></iframe>",
            "status": "eligible"
          }
        ]
      }
    }
  ]
}
```

### (Optional) Direct preview without ad creation

You can also request a preview using the `act_<AD_ACCOUNT_ID>/generatepreviews` endpoint without actually creating an ad.

#### Request
`FACEBOOK_REELS_MOBILE`

```
curl -X GET -G \
  -d 'ad_format=FACEBOOK_REELS_MOBILE' \
  -d 'creative_feature=image_uncrop' \
  -d 'creative={
       "object_story_spec": {
         "page_id": "<PAGE_ID>",
          "link_data": {
            "image_hash": "<IMAGE_HASH>",
            "link": "<WEBSITE_LINK>"
          }
        }
     }'
  -d 'access_token=<ACCESS_TOKEN>'
  https://graph.facebook.com/v19.0/act_<AD_ACCOUNT_ID>/generatepreviews
```

## Background generation

Meta creates different backgrounds for eligible product images and delivers the version that your audience is most likely to respond to. These backgrounds are based on your original asset.

### Step 1: Create an ad or creative opted-in to background generation

**Warning:** Background generation currently only works with dynamic product ads or Advantage+ catalog ads on Mobile Feed.

You can create an ad through the `/ads` endpoint or create a standalone creative through the `/adcreatives` endpoint. In either approach, opt-in to use the Background Generation feature in the creative spec (see examples below).

#### Request

```
// creative example
  curl -X POST \
  -F 'name=Background Gen Creative' \
  -F 'degrees_of_freedom_spec={
    "creative_features_spec": {
      "image_background_gen": {
        "enroll_status": "OPT_IN"
      }
    }
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>'
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives

// ad example
curl \
  -F 'adset_id=<ADSET_ID>' \
  -F 'creative={
    "name": "Background Gen Adgroup",
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "template_data": {
        "description": "Description {{product.description}} ",
        "link": "https://www.example.com/",
        "message": "Test {{product.name | titleize}} ",
        "name": "Headline {{product.price}}"
      }
    },
    "product_set_id": "<PRODUCT_SET_ID>",
    "degrees_of_freedom_spec": {
      "creative_features_spec": {
        "image_background_gen": {
          "enroll_status": "OPT_IN"
        }
      }
    }
  }' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

### Step 2: Preview for background generation

With opt-in to the feature, Meta creates different backgrounds for eligible product images and delivers the version that your audience is most likely to respond to. Feature opt-in only applies to the ad created in the current request. These backgrounds are created based on your original asset, featuring different colors or patterns for eligible product images. You will see a static or live preview of your generated background depending on catalog eligibility.

**If any of the generated backgrounds are not acceptable, please re-create the ad or creative without opt-in to Background Generation.**

* Preview is currently supported only the `MOBILE_FEED_STANDARD` placement
* Set the `creative_feature` as `image_background_gen`
* If the live preview for your catalog products is not ready, Meta shows a stock preview with `status` set to `PENDING`

#### Request
`MOBILE_FEED_STANDARD`

```
curl -X GET -G \
  -d 'ad_format=MOBILE_FEED_STANDARD' \
  -d 'creative_feature=image_background_gen' \
  -d 'access_token=/<ACCESS_TOKEN>' \
  https://graph.facebook.com/v19.0/<AD_ID>/previews
```

#### Response

```
{
  "data": [
    {
      "body": "<iframe src='<PREVIEW_URL>'></iframe>",
      "transformation_spec": {
        "image_background_gen": [
          {
            "body": "<iframe src='<PREVIEW_URL>'></iframe>",
            "status": "eligible" // or one of "pending", "ineligible"
          }
        ]
      }
    }
  ]
}
```

### (Optional) Direct preview without ad creation

You can also request a preview of a creative using the `/<AD_CREATIVE_ID>/previews` endpoint without actually creating an ad.

#### Request
`MOBILE_FEED_STANDARD`

```
curl -X GET -G \
  -d 'ad_format=MOBILE_FEED_STANDARD' \
  -d 'creative_feature=image_background_gen' \
  -d 'access_token=<ACCESS_TOKEN>'
  https://graph.facebook.com/v19.0/<AD_CREATIVE_ID>/generatepreviews
```

#### Response

```
{
  "data": [
    {
      "body": "<iframe src='<PREVIEW_URL>'></iframe>",
      "transformation_spec": {
        "image_background_gen": [
          {
            "body": "<iframe src='<PREVIEW_URL>'></iframe>",
            "status": "eligible" // or one of "pending", "ineligible"
          }
        ]
      }
    }
  ]
}
```

## About AI transparency

Ad images created or materially edited with certain Meta generative AI creative features available in our marketing tools may include AI info within the three-dot menu of an ad or have an AI info label next to the Sponsored label. Learn about [generative AI transparency for ads](https://www.facebook.com/business/help/539137881899016).

## Learn more

* [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative)
* [Adgroup](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)
* [Ad Creative Object Story Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec)
* [Generative AI features for Ads](https://www.facebook.com/business/news/generative-ai-features-for-ads-coming-to-all-advertisers)
