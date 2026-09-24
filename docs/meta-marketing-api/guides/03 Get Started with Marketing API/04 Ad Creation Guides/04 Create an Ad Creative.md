<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative | Saved: 2026-09-19 -->

# Create an ad creative



An ad creative defines the visual and textual elements that appear in your ad. Specify the ad format, which can be image, video, or carousel. Each format has its own design requirements. Define these elements to control how your ad displays its message to end users.

To construct your ad creative, send a `POST` request to the `/act_<AD_ACCOUNT_ID>/adcreatives` endpoint. The parameters include the `name` of the ad, `message`, image or video URLs, `call_to_action` buttons, and destination URLs.

**Example API Request:**

```bash
curl -X POST \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives \
  -F 'name=Sample Creative' \
  -F 'object_story_spec={
      "page_id": "<PAGE_ID>",
      "link_data": {
        "message": "Check out our new product!",
        "link": "https://www.example.com/product",
        "caption": "Our New Product",
        "picture": "https://www.example.com/image.jpg",
        "call_to_action": {
          "type": "SHOP_NOW"
        }
      }
    }' \
  -F 'access_token=<ACCESS_TOKEN>'
```

In this payload, the `object_story_spec` specifies the format for the ad story and includes linking details for a link ad, along with associated metadata.

## Required parameters

| Name | Description |
| --- | --- |
| `name` | The name of the ad. |
| `object_story_spec` | The specifications of the ad creative. |

## Learn more

* [Ad Account Ad Creatives Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adcreatives)
* [Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative)
