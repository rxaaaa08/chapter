<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences | Saved: 2026-09-19 -->

# Instant Experiences



Instant Experiences are a full-screen, post-click ad destination that loads nearly instantaneously from ads in Feed.

**Note:** If you see any mentions of `canvas` in the API, it is a reference to Instant Experiences. Canvas was the previous name of this format.

## Before you start

To create and manage Instant Experiences, you need:

* The [`pages_manage_ads` permission](https://developers.facebook.com/docs/permissions/reference/pages_manage_ads)
* The [`pages_read_engagement` permission](https://developers.facebook.com/docs/permissions/reference/pages_read_engagement)
* The [`pages_show_list` permission](https://developers.facebook.com/docs/permissions/reference/pages_show_list)
* To be able to perform the [`ADVERTISE` task](https://developers.facebook.com/docs/pages/overview/permissions-features#tasks) on the Page

### Limitations

* You can only update an unpublished Instant Experience.
* The Instant Experiences API is available for Instagram on a limited basis.
* Ads using Instant Experiences are not supported for Facebook Stories.

## Create

To create an Instant Experience, you will need the ID of a Facebook Page (`PAGE-ID`) and [any elements](#elements), such as photos, buttons, and text, you wish to include in your experience.

```
curl \
  -F 'background_color=FFFFFF' \
  -F 'body_element_ids=["<CANVAS_PHOTO_ID>"]' \
  -F 'is_hidden=' \
  -F 'is_published=' \
  -F 'name=Canvas Name' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<PAGE_ID>/canvases
```

### Elements

| Name | Description |
| --- | --- |
| [Button](https://developers.facebook.com/docs/graph-api/reference/canvas-button) | A button within an Instant Experience. The `button_style` field is required. |
| [Carousel](https://developers.facebook.com/docs/graph-api/reference/canvas-carousel) | A carousel for the Instant Experience. |
| [Footer](https://developers.facebook.com/docs/graph-api/reference/canvas-footer) | A footer for the Instant Experience. |
| [Header](https://developers.facebook.com/docs/graph-api/reference/canvas-header) | A header for the Instant Experience. |
| [Photo](https://developers.facebook.com/docs/graph-api/reference/canvas-photo) | A photo within an Instant Experience. You should provide a `PHOTO-ID` for a photo uploaded to a [Facebook Page](https://developers.facebook.com/docs/graph-api/reference/page/photos). |
| [Product List](https://developers.facebook.com/docs/graph-api/reference/canvas-product-list) | A list of products for an Instant Experience. |
| [Product Set](https://developers.facebook.com/docs/graph-api/reference/canvas-product-set) | A set of products from an Advantage+ catalog ads product catalog that are displayed in an Instant Experience. |
| [Store Locator](https://developers.facebook.com/docs/graph-api/reference/canvas-store-locator) | A store locator within an Instant Experience. |
| [Text](https://developers.facebook.com/docs/graph-api/reference/canvas-text) | The text and its styling displayed within an Instant Experience. |
| [Video](https://developers.facebook.com/docs/graph-api/reference/canvas-video) | A video within an Instant Experience. You should provide a `VIDEO-ID` for a video uploaded to a [Facebook Page](https://developers.facebook.com/docs/graph-api/reference/page/videos). |

#### Delete an element

To delete an element, send a `DELETE` request with the ID of the element you wish to delete.

```
curl -X DELETE \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<CANVAS_ELEMENT_ID>
```

## Get an existing Instant Experience

To get information about an existing Instant Experience, you will need the ID of the Instant Experience (`CANVAS-ID`).

```
curl -G \
  --data-urlencode 'fields=[
    "body_elements",
    "canvas_link",
    "id",
    "is_hidden",
    "is_published",
    "name"
  ]' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<CANVAS_ID>
```

### Get all Instant Experiences for a Page

To get information about all existing Instant Experiences for a Facebook Page, you will need the ID of the Page (`PAGE-ID`).

```
curl -G \
  --data-urlencode 'fields=[
    "background_color",
    "body_elements",
    "canvas_link",
    "id",
    "is_hidden",
    "is_published",
    "last_editor",
    "name",
    "owner",
    "update_time"
  ]' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<PAGE_ID>/canvases
```

## Update an Instant Experience

To update an Instant Experience, the experience must be unpublished and you will need the ID of the Instant Experience (`CANVAS-ID`) and any element IDs you want to update.

```
curl \
  -F 'background_color=FFFFFF' \
  -F 'body_element_ids=["<CANVAS_PHOTO_ID>"]' \
  -F 'is_hidden=' \
  -F 'is_published=' \
  -F 'name=Canvas Name' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<CANVAS_ID>
```

## Use a Template {#templates}

You can use a template as a quick way to create an Instant Experience for a specific business goal. The layout for each template is fixed, however you can replace default content with your own images, videos, products, text, and links.

| API Template Name | Template ID | Description |
| --- | --- | --- |
| Get New Customers | `133471657203838` | Drive conversions with a mobile landing page that encourages action. [Customer Acquisition template](https://www.facebook.com/business/help/1454940661230823) in the Ads Manager. |
| Showcase Your Business | `1063217037112304` | Give people an engaging way of exploring your brand, product, or service. [Storytelling template](https://www.facebook.com/business/help/1454940661230823) in Ads Manager. |
| Sell Products (Without Catalog) | `424787857903852` | Create a mobile shopping experience by uploading your product information instead of using a catalog. [Sell Products (Without Catalog) template](https://www.facebook.com/business/help/1454940661230823) in Ads Manager. |
| Sell Products: Lifestyle Layout | `1369752616394017` | Let people explore your products in action by featuring them in photos. [Lookbook template](https://www.facebook.com/business/help/1454940661230823) in Ads Manager. |
| Sell Products: Grid Layout | `1932289657009030` | Use your product catalog to create an experience that lets people shop straight from their mobile device.<br>[Storefront template](https://www.facebook.com/business/help/1454940661230823) in Ads Manager. |
| AR Experience |  | The [AR  Experience template](https://www.facebook.com/business/help/1454940661230823) is only available via the Ads Manager. |

### Get element types for a template

#### Step 1. Get the document information for the template

Send a `GET` request to determine which elements are needed for a particular template, **Get New Customers** in the following example.

```
curl -i -X GET \
 "https://graph.facebook.com/VERSION/133471657203838?fields=document&access_token=ACCESS-TOKEN"
```

#### Example response

```
{
  "document": {
    "name": "Get New Customers",
    "id": "397246414010297"
  },
  "id": "133471657203838"
}
```

#### Step 2. Get the element types

Use ID for the `document` field to get specific elements available for a particular template.

```
curl -i -X GET \
 "https://graph.facebook.com/VERSION/397246414010297?fields=body_elements&access_token=ACCESS-TOKEN"
```

The list returned shows element types that are available for use in the **Get New Customers** template.

```
    {
  "body_elements": [
    {
      "name": "Cover Image or Video",
      "element_type": "PHOTO",
      "id": "397271930674412"
    },
    {
      "name": "Text",
      "element_type": "RICH_TEXT",
      "id": "397271920674413"
    },
    {
      "name": "Text",
      "element_type": "RICH_TEXT",
      "id": "397271910674414"
    },
    {
      "name": "Button",
      "element_type": "BUTTON",
      "id": "397271914007747"
    },
    {
      "name": "Carousel",
      "element_type": "CAROUSEL",
      "id": "397271940674411"
    },
    {
      "name": "Text",
      "element_type": "RICH_TEXT",
      "id": "397271917341080"
    },
    {
      "name": "Button",
      "element_type": "BUTTON",
      "id": "397271924007746"
    }
  ],
  "id": "397246414010297"
}
```

## Publish {#publish}

To publish your Instant Experience ad send a `POST` request to your Instant Experience ID (`CANVAS-ID`) and set the `is_published` field to `true`.

```
curl \
  -F 'is_published=1' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<CANVAS_ID>
```

## Create an Ad Creative

Create an ad creative using the link for an existing Instant Experience (`CANVAS-LINK`).

```
curl -X POST \
  -F 'image_hash="<IMAGE_HASH>"' \
  -F 'object_story_spec={
       "page_id": "<PAGE_ID>",
       "link_data": {
         "image_hash": "<IMAGE_HASH>",
         "link": "<CANVAS_LINK>",
         "name": "Creative message",
         "call_to_action": {
           "type": "LEARN_MORE"
         }
       }
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

Once the ad creative is ready, you can then go on to create the ad group, ad set, and ad campaign.

## Instant Experiences Ads Dialog {#canvas-ads-dialog}

You can use the *Instant Experiences Ads Dialog* to provide the Facebook Instant Experiences ad-creation user interfaces in your website. For details about the UI component, see [Dialogs](https://developers.facebook.com/docs/javascript/reference/FB.ui).

Set up the Facebook SDK for JavaScript, see:

* [Quickstart guide](https://developers.facebook.com/docs/javascript/quickstart)
* [Initialization reference](https://developers.facebook.com/docs/javascript/reference/FB.init)

The JavaScript SDK relies on the logged in user's permissions to create an Instant Experience. If the user does not have the necessary permissions to create an Instant Experience for the supplied page and business, the dialog shows an error. To ensure no errors, the user must be in the business and have 'create ads' permissions for the page.

Then trigger the dialog:

```
FB.ui({
  display: 'popup',
  method: 'instant_experiences_builder',
  business_id: '<BUSINESS_ID>',
  page_id: '<PAGE_ID>'
}, function(response) {
  // callback
});
```

You can provide these settings for the plugin:

| Name | Required | Description |
| --- | --- | --- |
| `display` | Yes | Necessary parameter with set value of `popup` |
| `method` | Yes | Necessary parameter with set value of `instant_experiences_builder` |
| `business_id` | Yes | Your business ID |
| `page_id` | Yes | Page ID you want to associate the Instant Experience with |
| `canvas_id` | No | ID of Instant Experience you want to edit |

The parameter `canvas_id` is optional and is meant to allow a user to edit or preview an existing Instant Experience. If an Instant Experience is complete, you **cannot** edit it. To preview an Instant Experience, use the Instant Experiences Preview Dialog.

The plugin provides this response on success:

```
{
  "success": true,
  "id": "CANVAS-ID"
}
```

The ID returned is a published Instant Experience. You can now use it in ad campaigns. If no response or an `undefined` response is returned, the viewer closed the dialog before finishing the Instant Experience. The user may have saved the Instant Experiences, but not finished it. You can pull all Instant Experiences that belong to a page using the Graph API to see if there are any unfinished experiences.

## Preview an Instant Experience

### Iframe preview API

You can generate a preview an Instant Experience by calling the previews API which returns an iframe, similar to the ad previews API:

```
curl -X GET \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v18.0/<CANVAS_ID>/preview
```

The API returns a response like the following, which you can view by embedding the returned iframe element in HTML:

```
{
"data": [
    {
      "body": "<iframe src=\"https://www.facebook.com/ads/canvas/preview?d=AQKELApdJxoVp2f3PHl8-pRtYuAh4-_eDupMDbh-pS9zde_EFxckhYQCXu7NYUi4PhhBA7uskIo2Ys3IjIVNGZiS&t=AQKGOPqGI-NWcv1YKbA\" width=\"405\" height=\"720\" scrolling=\"yes\" style=\"border: none;\"></iframe>"
    }
  ],
  "__www_request_id__": "AQnyr47Qp2r5M-ISqSiMgrw"
}
```

### Facebook SDK

You can use this dialog to provide a preview of an Instant Experience as someone on Facebook would see it from your website. For details about the UI component, see [Dialogs](https://developers.facebook.com/docs/javascript/reference/FB.ui).

Set up the Facebook SDK for JavaScript, see:

* [Quickstart guide](https://developers.facebook.com/docs/javascript/quickstart)
* [Initialization reference](https://developers.facebook.com/docs/javascript/reference/FB.init)

The JavaScript SDK relies on the logged in user's permissions to create an Instant Experience. If the user does not have the necessary permissions to view the Instant Experience, the dialog shows an error.

Then trigger the preview dialog:

```
FB.ui({
  display: 'popup',
  method: 'instant_experiences_preview',
  canvas_id: 'CANVAS-ID'
});
```

You can provide these settings for the plugin:

| Name | Required | Description |
| --- | --- | --- |
| `display` | Yes | Necessary parameter with set value of `popup` |
| `method` | Yes | Necessary parameter with set value of `instant_experiences_preview` |
| `canvas_id` | Yes | ID of Instant Experience you want to preview |

## Create audiences for Instant Experiences

To create an engagement audience, an audience of people who have engaged with an Instant Experience, set the `object_id` parameter of the `rule` field to the Instant Experience ID (`CANVAS-ID`) in your `POST /act_AD-ACCOUNT/customaudiences` call.

**People who opened the Instant Experience**

```
curl \
  -F 'name=Instant Experience Engagement Audience' \
  -F 'description=People who opened this Instant Experience' \
  -F 'rule=[{"object_id":"<CANVAS_ID>","event_name":"instant_shopping_document_open"}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/customaudiences
```

**People who clicked any links in the Instant Experience**

```
curl \
  -F 'name=Instant Experience Engagement Audience' \
  -F 'description=People who clicked any links in this Instant Experience' \
  -F 'rule=[{"object_id":"<CANVAS_ID>","event_name":"instant_shopping_element_click"}]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/<VERSION>/act_<AD_ACCOUNT_ID>/customaudiences
```

For more information about custom audiences, see [Custom Audience, Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience).

## Instant Experiences and Instagram Ads

Implementing Instant Experiences with Instagram uses the same API calls you use for Instant Experience on Facebook. **Note there are limitations when you use Instagram and Instant Experiences:**

- **Placements** - Available for Instagram Feed and Instagram Stories. If you select Instagram Stories, you should select this as your exclusive ads placement.
- **Instant Experience Elements** - Fully supports headers and product sets.

The following Instant Experience elements are **partially** supported on Instagram:

* **Footer** - No `swipe to open` in clients this renders as `Tap to open`.
* **Carousel** - No photos that link to another Instant Experience; in the client appears as a non-clickable link. For photos and videos, no fit to height, no fit to width or tilt to pan; this renders as fit to width.
* **Button** - Cannot link to another Instant Experience or to the App Store.
* **Text** - No RTL language support.
* **Video** - No 360 videos.
* **Store Locators** - Not supported.

## Ad Insights {#insights}
See [Ad Insights](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup/insights) for an overview and descriptions for available metrics.

## See also

- Facebook Ads Guide: [Instant Experience Specs](https://www.facebook.com/business/ads-guide/instant-experience)
- Business Help Center: [Learn about Instant Experience](https://www.facebook.com/business/help/183469315334462?id=1633489293397055)
