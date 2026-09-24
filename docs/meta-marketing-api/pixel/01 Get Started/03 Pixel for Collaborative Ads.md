<!-- Source: https://developers.facebook.com/documentation/meta-pixel/implementation/pixel-for-collaborative-ads | Saved: 2026-09-19 -->

# Pixel for Collaborative Ads



Collaborative Ads allows producers, such as consumer-packaged goods advertisers, to run ad campaigns to drive people to seller platforms. Such platforms include online retailer websites or apps and those that can measure, retarget, and optimize towards people who have interacted with the producers' products on the seller platforms. **Access to the Collaborative Ads features is provided on a limited basis only. Please contact your Facebook Representative.**

To use Collaborative Ads features, the seller needs to implement the following required standard events and parameters. If you're unfamiliar with Pixel events and parameters, see [how to set up conversion tracking for Pixel](https://developers.facebook.com/documentation/meta-pixel/implementation/conversion-tracking) first.

## Required Standard Events

The seller platform needs to provide the following standard events:
| Event Name | Event Description | Required Parameters | Optional Parameters |
| --- | --- | --- | --- |
| `ViewContent` | When a product page is viewed.*A person lands on a product details page.* | `contents` or `content_ids`, and `content_type` | `currency` and `value` |
| `AddToCart` | When a product is added to the shopping cart.*A person clicks **Add to Cart**.* | `contents`, `content_type`, `currency`, and `value` |  |
| `Purchase` | When a purchase is made or checkout flow is completed.**A person has finished the purchase or checkout flow and lands on thank you or confirmation page.** | `contents`, `content_type`, `currency`, and `value` |  |

## Parameters

| Property Key | Value Type | Parameter Description |
| --- | --- | --- |
| `contents` | array of objects with `id` (string) and `quantity` (integer) key. | Array of JSON objects that contain the International Article Number (EAN) when applicable, or other product or content identifier(s) associated with the event (Product Group ID is not supported) and quantities of the products. **Required**: `id` and  `quantity`. <br>Example: `[{id: 'ABC123', quantity: 2}, {id: 'XYZ789', quantity: 2}]`<br><br>Note: This parameter is required for `AddToCart` and `Purchase` event and is optional for `ViewContent` event if `content_ids` is provided. |
| `content_ids` | array of strings | Product IDs associated with the event, such as SKUs. (Product Group ID is not supported.)<br>Example: `['ABC123', 'XYZ789']` |
| `content_type` | String | Must be `"product"`.<br><br>Note: `"product_group"` and other values are not supported. |
| `currency` | string | Currency for the value specified in [ISO 4217](https://en.wikipedia.org/wiki/ISO_4217) currency code.<br><br>Example: `'USD'`, `'GBP'` |
| `value` | integer or float | Value of a user performing this event to the business.<br><br>* For `ViewContent`, the value of an item.<br>* For `AddToCart`, the value of new items added to cart at once. It's not the current total basket value.<br>* For `Purchase`, the total basket value, including other fees, such as shipping fee and tax.<br><br>Example: `21.5` |

## Examples

### ViewContent Event

```js
fbq('track', 'ViewContent', {
  contents: [
    { id: 'SKU-1', quantity: 1 }
  ],
  content_type: 'product',
  value: 50,
  currency: 'USD',
})
```

Or, with minimal parameters:

```
fbq('track', 'ViewContent', {
  content_ids: ['SKU-1'],
  content_type: 'product',
})
```

**Note**: The minimal parameter setup is valid for `ViewContent` only and not valid for `AddToCart` and `Purchase`. We recommend to provide `value` and `currency`.

### AddToCart Event

```
fbq('track', 'AddToCart', {
  contents: [
    { id: 'SKU-1', quantity: 2 }
  ],
  content_type: 'product',
  value: 100,
  currency: 'USD',
})
```

### Purchase Event

```
fbq('track', 'Purchase', {
  contents: [
    { id: 'SKU-1', quantity: 2 },
    { id: 'SKU-2', quantity: 1 },
  ],
  content_type: 'product',
  value: 130,
  currency: 'USD',
})
```

## Common Mistakes
* `contents: [{id: 'SKU-123'}, {id: 'SKU-456'}]` - Missing `quantity` key.
* `content_ids: 'SKU-123,SKU-456,SKU-789'` - Missing an array symbol.
* `content_ids: []` - Missing SKU IDs in an array.
* `content_type: 'soap'` - The value is not `"product"`.
* `value: '5000,00'` - Wrong format (should not be a string with comma).
* `currency: '$'` - Cannot use a currency symbol format.
