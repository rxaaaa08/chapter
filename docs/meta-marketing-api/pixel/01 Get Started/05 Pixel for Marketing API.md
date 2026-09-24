<!-- Source: https://developers.facebook.com/documentation/meta-pixel/implementation/marketing-api | Saved: 2026-09-19 -->

# Pixel for the Marketing API



The Meta Pixel is the main tool you can use to track events on a website. You can then use data from the Meta Pixel with Marketing API to:

* Build custom audiences based on activity on your website
* Measure conversion activity and determine which ads lead to results such as purchases

## Requirements

- The Meta Pixel's [base code](https://developers.facebook.com/documentation/meta-pixel/get-started) must already be installed on every webpage where you will be tracking events.

**Success:** ### iOS 14.5 Updates

Due to the changes for iOS 14.5, we have introduced a new tool for tracking web events for iOS 14.5 ad campaigns.

#### Aggregated Event Measurement

Meta's Aggregated Event Measurement is a protocol that allows for measurement of web and app events from people using iOS 14.5 or later devices. Statistical modeling may be used and is designed to provide a more complete view of results when data is missing or partial.

Aggregated Event Measurement currently limits domains and mobile apps to 8 conversion events that can be configured and prioritized for Aggregated Event Measurement.

Visit our [Domain Verification guide](https://developers.facebook.com/documentation/sharing/domain-verification) to verify your domain ownership for Aggregated Event Measurement.

Visit our Business Help Center to learn more.

* [Aggregated Event Measurement](https://www.facebook.com/business/help/721422165168355)
* [Event Priority](https://www.facebook.com/business/help/193250612476055)
* [Value Sets](https://www.facebook.com/business/help/378857770047703)
* [Value Optimization](https://www.facebook.com/business/help/296463804090290?id=561906377587030)
* [Eligibility Requirements for Value Optimization](https://www.facebook.com/business/help/571188993373447?id=561906377587030)
* [Set Up Value Optimization](https://www.facebook.com/business/help/437932930561569?id=561906377587030)

Visit our [Changelog](https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/jan-19-2021) for more information about other changes available.

## Standard Events

The following examples are [standard events](https://developers.facebook.com/documentation/meta-pixel/implementation/conversion-tracking#standard-events) that you can track.

### Lead

Track the following `Lead` standard event on your website.

```
fbq(
  'track', 'Lead', {
    value: 40.00,
    currency: 'USD'
  }
);
```

### ViewContent

Track the following `ViewContent` standard event on your website.

```
fbq(
  'track', 'ViewContent', {
    content_type: 'product',
    content_ids: ['1234'],
    value: 0.50,
    currency: 'USD'
  }
);
```

### Search

Track the following `Search` standard event on your website.  

```
fbq(
  'track', 'Search', {
    search_string: 'leather sandals',
    content_ids: ['1234', '2424', '1318', '6832'],
    value: 0.50,
    currency: 'USD'
  }
);
```

### Purchase

Track the following `Purchase` standard event on your website's **payment confirmation** page.

```
fbq(
  'track', 'Purchase', {
    content_type: 'product',
    contents: [
      { 'id': '1234', 'quantity': 2, },
      { 'id': '4642', 'quantity': 1, }
    ],
    value: 25.00,
    currency: 'USD'
  }
);
```

## Custom Events

Track a custom event specific to your website. Replace `CUSTOM-EVENT-NAME` with your custom event name and `custom_parameter` with your custom parameter name.

```
fbq(
  'trackCustom', 'CUSTOM-EVENT-NAME', {
    custom_parameter: 'ABC',
    value: 10.00,
    currency: 'USD'
  }
);
```

## In-Page Events {#inpageevents}

Track in-page actions by tying standard or custom events to HTML elements such as buttons.

```
<button onClick="fbq('track', 'Purchase');">Button Text</button>
```

Create a function if you have multiple HTML elements.

```
<script>
function onClick() {
fbq('track', 'Purchase');
};
</script>
```

Call this function to track `Purchase` events for multiple HTML elements.

```
<button onClick="onClick()">Buy Now</button>

<button onClick="onClick()">Buy as a Gift</button>
```

**Note:** The Pixel Helper may show multiple Pixel events from the same page. The Pixel Helper expects to track only on load events but by tying events to elements, such as a button, you can use the Helper to track more event types.

### Track a Specific Pixel

Track a single custom event from a specific Meta Pixel. Replace `PIXEL-ID` with the Meta Pixel ID you want to track.

```
<script>
  function onClick() {
    fbq(
      'trackSingleCustom', 'PIXEL-ID', 'PageView'
    );
  };
</script>
```

**Note:** The `trackSingleCustom` method does not validate custom data.

## Suppress a Pixel

Suppress Meta Pixels by using  `pushState` or `replaceState`.

```
fbq.disablePushState = true;
```

## Optimize Ad Delivery with Pixels

Optimize ad delivery based on standard events tracked using Meta Pixels using the `promoted_object` field for the `/act_AD-ACCOUNT/adsets` endpoint.

The following example optizimes ads delivery based on purchase value using a Pixel that tracks puchase events.

*Formatted for readability*

```
curl -i -X POST "https://graph.facebook.com/v2.10/act_AD-ACCOUNT-ID/adsets
    ?name=Ad Set for Value Optimization
    &campaign_id=CAMPAIGN-ID
    &optimization_goal=VALUE
    &promoted_object={"pixel_id":"PIXEL-ID","custom_event_type":"PURCHASE"}
    &billing_event=IMPRESSIONS
    &daily_budget=1000
    &attribution_spec=[{'event_type': 'CLICK_THROUGH', 'window_days':'1'}]
    &access_token=ACCESS-TOKEN"
```

**Note:** Values for `conversion_specs` are automatically inferred based on the objective and `promoted_object`. You cannot manually set `conversion_specs`.

### Image Only Pixel Code {#intialize-img}

We strongly recommend using the JavaScript code for Meta Pixel. However, in some cases, you may use an HTML or an image Meta Pixel then add another third party tag from your website.

#### Standard Events

```
<img src="https://www.facebook.com/tr?id=PIXEL-ID&ev=ViewContent&cd[content_type]=product&cd[content_ids]=1234&cd[value]=0.50&cd[currency]=USD&noscript=1" height="1" width="1" style="display:none"/>
```

#### Custom Events

```
<img src="https://www.facebook.com/tr?id=PIXEL-ID&ev=CustomEventName&cd[custom_param1]=ABC&cd[custom_param2]=123&cd[value]=10.00&cd[currency]=USD&noscript=1" height="1" width="1" style="display:none"/>
```

## See Also

- [Advanced Matching](https://developers.facebook.com/documentation/meta-pixel/advanced/advanced-matching) – You can send additional customer data through the Meta Pixel and match more website actions with people on Facebook.
- [Conversion Tracking and Meta Pixel Stats](https://developers.facebook.com/documentation/meta-pixel/implementation/conversion-tracking) – Track and optimize for conversions.
- Offsite Conversions
- [Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences) – Create Website Custom Audiences with people who visited or took specific actions on your website.
- [Meta Pixel, Standard and Custom Events](https://developers.facebook.com/documentation/meta-pixel) – Default events tracked by the Meta Pixel, and custom events you can add.
