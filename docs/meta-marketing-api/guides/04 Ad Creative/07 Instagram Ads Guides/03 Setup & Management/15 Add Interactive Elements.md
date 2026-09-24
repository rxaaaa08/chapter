<!-- Source: https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/add-interactive-elements | Saved: 2026-09-19 -->

# Add Interactive Elements



You can add interactive elements so people can engage in your Instagram ads.

## Product Tags

You can add product tags to your ads, using the `product_tag_spec` under `interactive_components_spec`. Under `component`, you will need to specify:

* `type` as `product_tag`
* `product_id` under `product_tag_spec`  
**Note:** The products need to be approved before it can be tagged.
* The `x` and `y` parameters of `position_spec`  
**Note:** The `x` and `y` parameters are **required** for image ads and **optional** for video ads.

Sample of a single `interactive_components_spec` feed image/video media

```html
curl \
  -F 'name=Sample Creative TESTING' \
  -F 'object_story_spec={
      "link_data": {
            "link": "https://www.facebook.com/",
            "attachment_style": "link",
            "call_to_action": {
                "value": {},
                "type": "LEARN_MORE"
            },
            "image_hash": "IMAGE_HASH",
            "image_crops": {},
            "preferred_image_tags": {},
            "media_elements": {},
            "customization_rules_spec": {},
            "retailer_item_ids": {},
            "collection_thumbnails": {}
        },
       "page_id": "PAGE_ID",
       "instagram_user_id": "<IG_USER_ID>"
    }

' \
  -F 'interactive_components_spec={
      "components": [
    {
      "type": "product_tag",
      "product_tag_spec": {
        "product_id": 4382881195057752
      },
      "position_spec": {
        "x": 0.5,
        "y": 0.5,
      }
    }
  ]
}' \
  -F 'access_token=<ACCESS TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

Sample of multiple `interactive_components_spec` objects for feed carousel media

```html
curl \
  -F 'name=Sample Creative TESTING' \
  -F 'object_story_spec={
      "link_data": {
            "link": "https://www.facebook.com/",
            "attachment_style": "link",
            "call_to_action": {
                "value": {},
                "type": "LEARN_MORE"
            },
            "image_hash": "IMAGE_HASH",
            "image_crops": {},
            "preferred_image_tags": {},
            "media_elements": {},
            "customization_rules_spec": {},
            "retailer_item_ids": {},
            "collection_thumbnails": {}
        },
       "page_id": "PAGE_ID",
       "instagram_user_id": "<IG_USER_ID>"
    }' \
  -F 'interactive_components_spec={
        "child_attachments": [
            {
                "components": [
                    {
                        "type": "product_tag",
                        "position_spec": {
                            "x": 0.5,
                            "y": 0.5
                        },
                        "product_tag_spec": {
                            "product_id": 4382881195057752
                        }
                    }
                ]
            },
            {
                "components": [
                    {
                        "type": "product_tag",
                        "position_spec": {
                            "x": 0.2,
                            "y": 0.8
                        },
                        "product_tag_spec": {
                            "product_id": 4382881195057752
                        }
                    }
                ]
            },
            {
                "components": [
                    {
                        "type": "product_tag",
                        "position_spec": {
                            "x": 0.3,
                            "y": 0.7
                        },
                        "product_tag_spec": {
                            "product_id": 4382881195057752
                        }
                    }
                ]
            }
        ]
    }'\
  -F 'access_token=<ACCESS TOKEN>' \
  https://graph.facebook.com/v25.0/act<AD_ACCOUNT_ID>/adcreatives
```

### Read Product Tag Information

You can get information about the `product_id` in your `product_tag_spec` object from an [ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) you created with the `product_tag` type.

To retrieve the `product_tag_spec` information from your ad creative:

```html
curl -G \
  -d "fields=interactive_components_spec" \
  -d "access_token=<ACCESS_TOKEN>" \
  "https://graph.facebook.com/v25.0/<AD_CREATIVE_ID>"
```

Sample Response

```html
{
  "interactive_components_spec": {
    "components": [
      {
        "position_spec": {
          "x": 0.5,
          "y": 0.5
        },
        "type": "PRODUCT_TAG",
        "product_tag_spec": {
          "product_id": "4382881195057752"
        }
      }
    ]
  },
  "id": "23862467608880374"
}
```

### Automated tagging for static ads

This feature automatically tags best-matched products from the your product catalog when you create ads using single images or carousel images you've uploaded and applies the relevant product tags to ads.

The automated tagging ad system detects matches in two ways:

* Images in your catalog — If the features of your ad creative match with those in product images in your catalog, the ad system will automatically add the product tag to your ad creative.
* Website URL in ad destination — If the website URL that you enter in the destination section at the ad level matches with items in your catalog, the ad system will automatically add the product tag to your ad creative.

If product tags are specified in the `interactive_components_spec` parameter, the automated tagging feature will be disabled for the ad to respect product tags that are specified by you.

**Note:** This feature is enabled by default. Set `enroll_status` to `opt_out` in the `interactive_components_spec` parameter to opt out of the feature per product item.

```html
"interactive_components_spec": {
  "components": [
    {
      "type": "product_tag",
      "enroll_status": "opt_out"
    }
  ]
}
```

**Note:** You cannot set `enroll_status` and `product_tag_spec` at the same time; it will return an error.

## Resources

- Ads Manager: [About automated product tags in Meta Ads Manager](https://www.facebook.com/business/help/help.instagram.com/1157716325492082)
