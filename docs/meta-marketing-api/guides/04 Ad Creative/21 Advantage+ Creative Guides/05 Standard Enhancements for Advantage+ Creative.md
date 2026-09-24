<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/standard-enhancements | Saved: 2026-09-19 -->

# Standard Enhancements for Advantage+ Creative



**Warning:** Starting with Marketing API v22.0, opting in or out of standard enhancements will no longer be available. Instead, you can opt in or out of individual Advantage+ Creative features by following the instructions in [Get Started with Advantage+ Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/advantage-creative/get-started). Opting in or out of sub-features within the standard enhancements bundle will have the same effect as previously opting in or out of standard enhancements.

The sub-features within the standard enhancement bundle for single image ads include `image_template`, `image_touchups`, `text_optimizations`, and `inline_comment`. For single video ads, the sub-features are `video_auto_crop`, `text_optimizations`, and `inline_comment`.

Standard enhancements is for ads using a single image, video, or carousel. It automatically creates multiple variations of your ad and shows a personalized variation to each Account Center account based on what they're most likely to respond to. You can create ads with standard enhancements using the `TRAFFIC` or `CONVERSIONS` objectives to generate tailored ad variations for each Account Center account. For more information, see [About Advantage+ creative](https://www.facebook.com/business/help/297506218282224).

## API support for standard enhancements {#api-support}

### Standalone creative creation

#### Before

```
curl -X POST \
  -F 'name="My creative title"' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "instagram_user_id": "<IG_USER_ID>",
       "link_data": {
             "link": "www.google.com",
      }
     }' \
  -F "access_token=<ACCESS_TOKEN>" \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

#### After (new fields are in bold)

```
curl -X POST \
  -F 'name="My creative title"' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "instagram_user_id": "<IG_USER_ID>",
       "link_data": {
             "link": "www.google.com",
      }
     }' \
-F 'degrees_of_freedom_spec={
      "creative_features_spec": {
        "standard_enhancements": {
          "enroll_status": "OPT_IN"
        }
      }
    }' \ -F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

### Ad creation

#### Before

```
curl -X POST \
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

#### After (new fields are in bold)

```
curl -X POST \
  -F 'creative={
    "object_story_spec": {
      "page_id": "<PAGE_ID>",
      "link_data": {
        "link": "<WEBSITE_URL>",
      }
    },
"degrees_of_freedom_spec": {
      "creative_features_spec": {
        "standard_enhancements": {
          "enroll_status": "OPT_IN"
        }
      }
    }}' \
-F "adset_id=<ADSET_ID>" \
-F "name=New Ad" \
-F "status=PAUSED" \
-F "access_token=<ACCESS_TOKEN>" \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

For more details, see [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative#create_example).

### Parameters

| Name | Description |
| --- | --- |
| `degrees_of_freedom_spec` | Specifies the types of transformations that are enabled for the given creative. For more information, see [Ad Creative Degrees Of Freedom Spec, Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-degrees-of-freedom-spec). |

Opt in to the following features in the `creative_features_spec`:
| Name | Description |
| --- | --- |
| `standard_enhancements` | Basic set of enhancements to optimize your ad creative and improve performance. This can include:<br><br>* Automatically adjusting the aspect ratio of your image or video<br>* Applying a template to your image to help it better fit certain ad placements<br>* Displaying relevant Meta comments below your ad.<br><br>Set the `enroll_status` field to `OPT_IN` or `OPT_OUT`. For more details, see [Ad Creative Features Details, Reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details). |

## Learn more

### Marketing API reference
* [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative#fields)
    * [Ad Creative Degrees Of Freedom Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-degrees-of-freedom-spec)
    * [Ad Creative Features Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-features-spec)
    * [Ad Creative Feature Details](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-feature-details)
    * [Ad Creative Object Story Spec](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-object-story-spec)
