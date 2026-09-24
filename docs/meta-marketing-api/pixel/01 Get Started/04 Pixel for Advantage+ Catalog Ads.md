<!-- Source: https://developers.facebook.com/documentation/meta-pixel/get-started/advantage-catalog-ads | Saved: 2026-09-19 -->

# Meta Pixel for Advantage+ Catalog Ads



Advantage+ catalog ads are dynamically created by populating an ad template with product information found in a data feed. This allows you to create thousands of ads without having to configure each of them individually. You can also use Advantage+ catalog ads to target visitors based on how they have interacted with your website in the past.

The general steps for creating Advantage+ catalog ads are:

1. Set up conversion tracking for the specific [standard events](#standard-events) and their parameter [object properties](#object-properties) listed below, then
2. Use the Commerce Manager to [set up a Advantage+ catalog ad set](https://www.facebook.com/business/help/1132465490107046?helpref=page_content) that targets those events

### Requirements

* You must have a Facebook Page for the business that your Advantage+ catalog ads will apply to.
* The Pixel [base code](https://developers.facebook.com/documentation/meta-pixel/get-started#base-code) must already be installed.
* You must have access to the [Facebook Ads Manager](https://www.facebook.com/adsmanager).

Learn more about connecting your Pixel to a commerce catalog with [Blueprint](https://www.facebookblueprint.com/student/collection/240330/path/210141?content_id=E0G2EVplyh1dDB1).

## Standard Events

Before you can set up Advantage+ catalog ads, you must first be tracking the following [standard events](https://developers.facebook.com/documentation/meta-pixel/implementation/conversion-tracking#standard-events). You must also  include a parameter object  with specific object properties with each tracked event.

| Required Event | Required Object Properties |
| --- | --- |
| `AddToCart` | Either `content_ids` or `contents` |
| `Purchase` | Either `content_ids` or `contents` |
| `ViewContent` | Either `content_ids` or `contents` |

Refer to the [Object Properties](#object-properties) section below to learn what values to assign to the required object properties.

## Object Properties

### `content_ids`

If you are using the `content_ids` property in your parameter object, its value should correspond to the product ID or product IDs associated with the action. **IDs must match the IDs found in your product catalog**. Values can be either single IDs, or an array of IDs.

For example, here's how to track a visitor who has added products with the IDs `201` and `301` to a shopping cart. The IDs match the IDs for those products in the product catalog.

```
fbq('track', 'AddToCart',
  // begin required parameter object
  {
    value: .5,
    currency: 'USD',
    content_ids: ['201', '301'] // required property, if not using 'contents' property
  }
  // end required parameter object
);
```

### `contents`

If you are using the `contents` property in your parameter object, in a sub-object, you must include the `id` property, with the product ID or product IDs as its value, and include the `quantity` property with a number of product items being added to cart or purchased. **IDs must match the IDs found in your product catalog**. `contents` property value must be an array of objects.

For example, here's how to track a visitor who has added a product with the ID `301`, and two products with the ID `401`, to a shopping cart. The IDs match the IDs for those products in the product catalog.

```
fbq('track', 'AddToCart', {
  value: .5,
  currency: 'USD',
  contents: [
    {
      id: '301',
      quantity: 1
    },
    {
      id: '401',
      quantity: 2
    }],
});
```

## Commerce Manager

Once you have confirmed that the Events Manager is tracking your standard events correctly, use the [Commerce Manager](https://business.facebook.com/products) to set up your product catalog and Advantage+ catalog ad template, and target the standard events. Follow our [Create an Advantage+ Catalog Ad](https://www.facebook.com/business/help/1132465490107046) help document to do this.

After you complete all of the steps outlined in the document, be sure to use the Commerce Manager to verify that your catalog [recognizes your Pixel's events as a data source](https://www.facebook.com/business/help/946671458738854).

Note that it can take up to 24 hours for the Commerce Manager's **Events Data Sources** tab to recognize your tracked events.
