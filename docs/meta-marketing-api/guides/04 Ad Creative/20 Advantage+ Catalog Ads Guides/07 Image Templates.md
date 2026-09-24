<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/image-templates | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Image templates for ads using product media

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

Image templates let you style every product in ads using product media consistently — without editing each image by hand. A template is a saved, reusable design layered on top of your product images at delivery time. It can include backgrounds, badges, price tags, overlays, and other visual elements.

This guide describes how to read and set a saved image template on an ad creative through the `image_template_id` field, nested under `creative_sourcing_spec.product_media_metadata_spec`. The value is the numeric string ID of a saved image template that belongs to the product catalog powering the ad.

Image templates are only available to businesses that have a product catalog. See [Requirements and access](#requirements-and-access).

## Where image templates come from

You create and edit image templates in Commerce Manager, and each template belongs to a specific product catalog. The template you use must belong to the same catalog that supplies your ad’s products. To find it, open your catalog in Commerce Manager and go to the **Image templates** tab. In Ads Manager, you can apply an existing template to an ad, but not create or edit one.

There is no API to create, edit, delete, or list image templates. You will need to create them in Commerce Manager first.

## Requirements and access

To set `image_template_id`, all of the following must be true:

* **You have access to the owning catalog.** The template belongs to a product catalog, and the calling user or app must be able to access that catalog.
* **Image templates are enabled for the owning business.** Meta enables this feature for the business that owns the catalog. If that business is not enabled, the request is rejected.
* **The template exists and the ID is valid.** The ID must be a numeric string that resolves to a saved template.

## Read an image template from a creative

The following request reads `image_template_id` from an existing creative:

```
curl -G \
  -d 'fields=creative_sourcing_spec{product_media_metadata_spec{image_template_id}}' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v26.0/<AD_CREATIVE_ID>

```

Sample response:

```
{
  "id": "<AD_CREATIVE_ID>",
  "creative_sourcing_spec": {
    "product_media_metadata_spec": {
      "image_template_id": "1234567890123456"
    }
  }
}
```

If no template is attached, `product_media_metadata_spec` does not include `image_template_id`.

## Set an image template on a creative

The following request creates a creative with a template attached:

```
curl -X POST \
  -F 'name=Catalog ad with image template' \
  -F 'object_story_spec={"page_id":"<PAGE_ID>","template_data":{"link":"<URL>","name":""}}' \
  -F 'creative_sourcing_spec={"product_media_metadata_spec":{"image_template_id":"1234567890123456"}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v26.0/act_<AD_ACCOUNT_ID>/adcreatives

```

Sample response:

```
{
  "id": "<AD_CREATIVE_ID>"
}
```

Read the field back to confirm the template was saved.

## Create a creative with no image template

`image_template_id` is optional. To create a creative with no image template, omit the field. An empty string and `null` behave the same as omitting the field:

```
curl -X POST \
  -F 'name=Catalog ad with no image template' \
  -F 'object_story_spec={"page_id":"<PAGE_ID>","template_data":{"link":"<URL>","name":""}}' \
  -F 'creative_sourcing_spec={"product_media_metadata_spec":{"image_template_id":""}}' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v26.0/act_<AD_ACCOUNT_ID>/adcreatives

```

Omitting the field, sending an empty string, and sending `null` all succeed, resulting in the creative having no image template applied.

## Previews

Ad previews apply the image template automatically. How the template reaches the preview depends on the endpoint:

* `GET /<AD_ID>/previews` renders the ad’s saved creative, so a linked image template appears with no extra parameter.
* `POST /act_<AD_ACCOUNT_ID>/generatepreviews` renders only the creative spec in your request, so include `image_template_id` in that spec to preview a templated ad.

## Errors

When a write fails validation, the request returns error code 100. The following table lists the messages, where `<IMAGE_TEMPLATE_ID>` is the value you supplied:

| Failure case | Message |
| --- | --- |
| Malformed or non-numeric ID | `The image_template_id "<IMAGE_TEMPLATE_ID>" is not a valid template id.` |
| Template does not exist | `The image_template_id "<IMAGE_TEMPLATE_ID>" does not exist.` |
| No access to the owning catalog | `You do not have access to the catalog that owns image_template_id "<IMAGE_TEMPLATE_ID>".` |
| Image templates not enabled for the owning business | `Image templates are not enabled for the catalog that owns this template. Currently, this feature has limited availability.` |

## Limitations

* Setting `image_template_id` requires image templates to be enabled for the business that owns the catalog.
* **No template management API.** You can only create, edit, and delete image templates in Commerce Manager.

## See also

* [Ad creative reference](https://developers.facebook.com/docs/marketing-api/reference/ad-creative)
* [Advantage+ catalog ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads)
