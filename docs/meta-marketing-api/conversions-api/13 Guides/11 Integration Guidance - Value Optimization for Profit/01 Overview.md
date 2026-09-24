<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/overview | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Value optimization for profit: overview

Value optimization for profit lets you optimize ad delivery toward the profit of a conversion rather than its revenue. You share a profit value alongside the standard purchase value, and Meta’s delivery system values conversions in proportion to the profit you send.

This is an extension of standard [value optimization](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization). Instead of only sending a purchase `value`, you also send a profit value so that delivery favors higher-profit conversions.

## Supported conversion location

You can share profit values for **website** conversions. Purchase events reach Meta through the Conversions API, the Meta Pixel, or Google Tag Manager. You can carry the profit value in the event itself, or set it per product in your product catalog.

## Ways to share profit values

You can share profit values in the following ways. Each product’s profit should be represented consistently.

| Method | Description |
| --- | --- |
| Real time in the purchase event | Add the profit value to your existing `Purchase` event payload using the `net_revenue` field, sent through the Conversions API or the Meta Pixel. |
| Google Tag Manager | Capture the profit value in a Google Tag Manager variable and pass it to your Conversions API `Purchase` event. |
| Product catalog | Set a per-product profit value in your catalog feed using the `estimated_margin` field. Meta sums the profit of the products in each purchase, so you do not change your `Purchase` event payload. Requires Advantage+ catalog ads. See the [catalog integration guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/catalog-integration). |
| Other Conversions API partners | If you send events through a Conversions API partner or platform, contact your partner to confirm whether sharing profit values is supported and how to enable it on their integration. |

For step-by-step instructions, see the [integration guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/integration-guide).

## How to represent profit values

Keep the following in mind when deciding what value to send:

* **Purchase-level profit** — When you send profit in real time, include the purchase-level profit in addition to the purchase value, using the `net_revenue` field.
* **Currency applies to both values** — The currency you pass applies to both the purchase value and the profit value. Currency must be a valid [ISO 4217 three-letter currency code](https://en.wikipedia.org/wiki/ISO_4217).
* **Values can be indexed** — Passing a profit value with a currency does not require the amount to be monetary. You can normalize or index your values by dividing or multiplying by a constant, as long as the relative profit of each product stays the same. For example, if product A has $5 profit and product B has $10 profit, the indexed values could be 50 for A and 100 for B — not 100 for B and 0 for A.
* **Profit doesn’t correspond to transactional value** - Make sure your profit values aren’t just a fixed percentage of your purchase values (e.g., profit is always exactly half of the purchase amount). There should be real variation between the two — otherwise, optimizing for profit won’t produce different results than optimizing for purchase value.

## Keep purchase events real time

The `Purchase` event is a real-time event. Do not delay it while you wait for a profit value to become available. If you cannot compute profit in real time, send the purchase event without a profit value rather than holding it back. If real-time computation is not feasible, you can alternatively use the [catalog integration method](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/catalog-integration), which derives profit from your catalog feed instead.

## Create a profit campaign

After you send profit values, configure your campaign to optimize for profit and review results. For integration steps, see the [integration guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/integration-guide).

You configure a profit campaign the same way you configure any campaign. The only difference is at the ad set level, where you select **Profit** as the conversion value for optimization.

Use the following conversion settings:

* **Conversion location**: Website
* **Performance goal**: Maximize value of conversions
* **Conversion event**: Purchase
* **Conversion value**: Purchase profit

## Reporting

To view profit ROAS in Ads Manager:

1. In Ads Manager, click **Columns** > **Customize columns**.
2. Select the **Profit** column for the **Purchases** event.

## Eligibility

Profit optimization has the following eligibility requirements:

* At least 3 distinct positive profit values.
* At least 100 conversions over a one-week period.

Where possible, Meta recommends at least 30 daily conversions per campaign.
