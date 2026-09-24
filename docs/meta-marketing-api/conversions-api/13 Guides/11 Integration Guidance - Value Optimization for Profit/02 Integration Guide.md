<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/integration-guide | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Value optimization for profit: integration guide

This guide shows how to send profit values for website conversions so Meta can optimize delivery toward profit. For background on how profit optimization works and how to represent values, see the [overview](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/overview).

You can share profit values for website conversions in two ways: in real time through the Conversions API or Meta Pixel, or through Google Tag Manager. Both add a `net_revenue` value to the `Purchase` event you already send.

If changing your event payload is high effort, you can set a per-product profit value in your catalog instead. See the [catalog integration guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/catalog-integration).

**Note**: There is no separate currency field for `net_revenue`. The `currency` you send on the `Purchase` event applies to both `value` and `net_revenue`, so both parameters must use the same currency.

## Before you begin

This guide assumes you already have a working Conversions API integration to build on. If you do not, or you need help setting one up, see the [Conversions API end-to-end implementation guide](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/end-to-end-implementation). Sending profit values does not replace your existing integration — you add an additional parameter to the `Purchase` event you already send.

## Conversions API

Add the profit value to your existing `Purchase` event using the `net_revenue` field, alongside the purchase `value` and `currency`. Enter the numeric value for profit in `net_revenue`, expressed in the same currency as `value`.

The following example shows a real-time, order-level profit value in a Conversions API payload:

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
      // include event_id and/or order_id
      "custom_data": {
        "value": 50.5,
        "net_revenue": 20,
        "currency": "USD"
      },
      "opt_out": false
    }
  ]
}

```

## Meta Pixel

Add `net_revenue` to your existing Meta Pixel `Purchase` event as an additional parameter, expressed in the same currency as `value`. Keep any other parameters and your event ID configuration in place.

```
fbq("track", "Purchase", {
  value: 140.20,
  currency: "USD",
  net_revenue: 90.40,
  ... // keep any additional existing parameters
}, { eventID: 1234 }); // keep existing event ID configuration if configured

```

## Google Tag Manager

If you send events through Google Tag Manager, capture the profit value in a variable and pass it to your Conversions API `Purchase` event:

1. Create a new variable to capture the profit. Work with your developers to make this value available to Google Tag Manager and to choose an appropriate way to collect it (for example, the data layer).
2. Create a new variable of type **Custom JavaScript** to pass custom variables:

```
function() {
  return JSON.stringify({ net_revenue: '' });
}

```

3. Amend the GA4 `Purchase` event you use for the Meta Conversions API to include this variable, setting the parameter name to `custom_properties`:
4. Publish your changes.

## Verify your integration

After you send profit values, use Events Manager to confirm that Meta is receiving them.

1. In Events Manager, open your data source and select the columns that display value and currency metrics for your events.
2. Review your profit coverage to confirm that profit values are arriving with your `Purchase` events.
3. Click **View event parameters** for a detailed breakdown of the parameters received. Confirm that `net_revenue` is present.

## Next steps

After you send profit values, configure your campaign to optimize for profit and view results. See [Create a profit campaign](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization-for-profit/overview#create-a-profit-campaign) in the overview.
