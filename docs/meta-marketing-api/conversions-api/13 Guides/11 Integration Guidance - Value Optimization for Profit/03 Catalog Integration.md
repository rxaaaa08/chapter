<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/catalog-integration | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Value optimization for profit: catalog integration

This guide shows how to share profit values through your product catalog instead of adding a profit value to every `Purchase` event. You set a profit value on each product in your catalog feed. Meta sums the profit of all products in a purchase and attributes that total to the impression and the conversion.

Use this method when changing your Conversions API integration to add `net_revenue` would be high effort. For background on how profit optimization works and how to represent profit values, see the [overview](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/overview). To send profit values in real time instead, see the [integration guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/integration-guide).

## Before you begin

You need the following:

* A [product catalog](https://developers.facebook.com/documentation/ads-commerce/catalog) that you can add a column to.
* [Advantage+ catalog ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads) at the ad level. This method requires Advantage+ catalog ads, because Meta maps each conversion back to catalog items through the catalog you set on the ad.
* `Purchase` events that include content IDs, sent through the Meta Pixel or the Conversions API.
* A catalog match rate above 90 percent. See [Check your catalog match rate](#check-your-catalog-match-rate).

## Step 1: Add a profit value to your catalog feed

Add an `estimated_margin` column to your catalog feed and set a value for each product.

| Attribute and Type | Description |
| --- | --- |
| `estimated_margin`Type: string | The estimated profit margin of the item. Format the value as a number followed by the three-letter currency code ([ISO 4217](https://en.wikipedia.org/wiki/ISO_4217)). Use a period (`.`) as the decimal point, not a comma. The value can be negative for products you sell at a loss.Example: `2.50 USD` |

The value does not have to be a monetary margin. You can send an obfuscated or indexed value instead, as long as the relative profit of each product stays the same. See [How to represent profit values](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/overview#how-to-represent-profit-values) in the overview.

You can also set `estimated_margin` in a [localized catalog](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/localized-catalog/supported-fields) to vary profit values by country or language.

## Step 2: Send content IDs with your purchase events

Meta maps each conversion to the products that were bought using the content IDs on your `Purchase` events. It then looks up the profit for those products in your catalog. Your `Purchase` events must therefore carry either `content_ids` or `contents`, and those IDs must match the IDs in your catalog.

For the standard events and object properties to send, and for Meta Pixel examples, follow [Meta Pixel for Advantage+ Catalog Ads](https://developers.facebook.com/documentation/meta-pixel/get-started/advantage-catalog-ads). You don’t need any extra event configuration for profit values beyond what that guide describes.

Use `contents` rather than `content_ids` when a customer can buy more than one unit of a product. Meta multiplies each product’s `estimated_margin` by the `quantity` you send, so a `contents` array produces a more accurate profit total than a bare list of IDs.

If you send events through the Conversions API, pass `contents` inside [`custom_data`](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/custom-data):

```
{
  "data": [
    {
      "event_name": "Purchase",
      "event_time": 1633552688,
      "user_data": {
        "client_ip_address": "192.88.9.9",
        "client_user_agent": "test ua1",
        "external_id": "12345"
        // additional match keys recommended
      },
      "custom_data": {
        "value": 50.5,
        "currency": "USD",
        "contents": [
          {
            "id": "301",
            "quantity": 1
          },
          {
            "id": "401",
            "quantity": 2
          }
        ]
      },
      "opt_out": false
    }
  ]
}

```

Omit `net_revenue` from these events. A `net_revenue` value on the event takes precedence: when Meta finds one, it uses that value and does not read profit from your catalog.

## Step 3: Set your catalog on the ad

In your Advantage+ catalog ad, set the catalog that holds your `estimated_margin` values. Meta reads profit values from the catalog you select here, and values a conversion for profit only when its products resolve against that catalog.

## Check your catalog match rate

Your catalog match rate tells you how many of the item references in your events map to items in your catalog. Meta recommends a match rate above 90 percent, the same threshold as [Advantage+ catalog ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads). Below that, some purchases resolve to no catalog item, and Meta does not count their profit.

Review your match rate for a given catalog in Catalog Manager. See [Catalog match rates](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices/omni-optimal-setup-guide#catalog-match-rates) for where to find it, and [About catalog match rate](https://www.facebook.com/business/help/1183006658734497) in the Meta Business Help Center.

To diagnose which content IDs fail to match, query the `event_stats` and `da_checks` fields described in [Catalog signals quality](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/cat-signals-quality).

## Next steps

After your catalog carries profit values and your events carry content IDs, configure your campaign to optimize for profit. See [Create a profit campaign](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/overview#create-a-profit-campaign) in the overview.
