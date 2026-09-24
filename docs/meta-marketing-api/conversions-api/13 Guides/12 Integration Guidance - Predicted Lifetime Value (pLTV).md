<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/predicted-lifetime-value | Saved: 2026-09-19 | Converted from the web page: Meta's "View as Markdown" export returns an error for this page -->

# Integration Guidance: Predicted Lifetime Value (pLTV)

## Overview

Predicted lifetime value (pLTV) value optimization lets you acquire high-value customers based on your own long-term value predictions. You make these predictions early in the acquisition funnel and send them to Meta, which optimizes delivery toward the users you expect to be most valuable over time.

pLTV is built around a **conversion event**: this is the event where you acquire the user. This event happens only once per customer and acts as the optimization event for the campaign. For example, if you can predict pLTV once a user starts a free trial, the free trial is your conversion event. You can only associate one conversion event with pLTV per dataset (pixel).

After the conversion event, you must send the pLTV signal within **7 days** of sending the conversion event to Meta.

## Requirements

To use pLTV value optimization, confirm all of the following:

1. You have an existing **web** Conversions API integration, or you are ready to build one. pLTV does not support app events at this time.
2. You have a pLTV model that is validated in some way, such as one already used for optimization, measurement, or budget decisions.
3. Your predictions must include at least **5 distinct** pLTV values. All values must be positive (not binary or negative), and the highest value should be at least **3x** greater than the lowest.
4. You have a minimum of **100 conversion events per week attributed to Meta** for each of the last 4 weeks.
5. Your dataset is not in Core Setup. Datasets in Core Setup cannot use this product.

The following events support pLTV value optimization:

* `Purchase`
* `Subscribe`
* `StartTrial`
* `CompleteRegistration`
* `AddPaymentInfo`
* Custom events

## Choose your integration method

There are two ways to send pLTV signals, depending on how quickly your model computes a value:

* **Real-time integration** — use this if you can send the pLTV signal at the same time as the conversion event.
* **Delayed integration** — use this if your model benefits from waiting up to 7 days to compute a more accurate value.

Unlike other Meta products, sending pLTV values faster does **not** currently improve performance. Choose the method that matches your model, and send the most accurate value you can within 7 days.

Keep the following in mind regardless of method:

* **Do not delay the conversion event to wait for pLTV.** If your model is not real-time, send the conversion event as usual and use the delayed integration to send pLTV later.
* You can integrate a pLTV signal with only **one event per dataset**.
* Meta does not recommend creating a new Meta Pixel or a new custom event only for testing.

## Send real-time pLTV signals

Use the real-time integration when you can compute pLTV at the moment of the conversion event. Add `predicted_ltv` and `currency` to the conversion event’s `custom_data`. Sending through the [Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api) is required. You can also send the same parameters through the Meta Pixel.

1. In **Events Manager**, go to **Datasets** and select your dataset. Select **Value and Currency Metrics** dropdown and select the conversion event you intend to optimize for. Valid events will display **Set up pLTV** with a pLTV icon.![Events Manager pLTV onboarding overview with an expanded event with 'Set up pLTV' action](https://scontent.fmaa14-1.fna.fbcdn.net/v/t39.2365-6/742102285_1552543503270965_8441806266302196366_n.png?_nc_cat=105&ccb=1-7&_nc_sid=e280be&_nc_ohc=MeK9xwm-secQ7kNvwFMfkLK&_nc_oc=Adqo-0cqRP9YiQVKOSWdrCA2pTSa8OIxtQita_i-lxkW2fR-yqNKTDGNuwfnXVxMo_dzRXUxTWXjNDqL9ra06WbJ&_nc_zt=14&_nc_ht=scontent.fmaa14-1.fna&_nc_gid=ngVzqGl0pcAwRJZ98lEowg&_nc_ss=70289&oh=00_AQL9Ajn0riz9dAfTUZ9mac__5SBjs1djIhxt4CAO_i-RDw&oe=6AC8B65B)
2. A screen will display to allow you to select how you will send your pLTV data to Meta. Select **With [Event Name] events** to send pLTV real-time. Select **Start integration** to begin the onboarding process.![Events Manager pLTV integration modal displaying the available options to send pLTV data to Meta with the 'with Purchase events' selected](https://scontent.fmaa14-1.fna.fbcdn.net/v/t39.2365-6/741416351_1552543506604298_7177788706203340408_n.png?_nc_cat=107&ccb=1-7&_nc_sid=e280be&_nc_ohc=IzLLrj_6lugQ7kNvwF2qU6V&_nc_oc=AdovTLC690V3mlPD_hsf11CcUxMKONc8iWCAYUOd_JcGwtXG09IcayZR3Mg-w-sQhHF2bgrz5DfbLRucpFcaJvk4&_nc_zt=14&_nc_ht=scontent.fmaa14-1.fna&_nc_gid=ngVzqGl0pcAwRJZ98lEowg&_nc_ss=70289&oh=00_AQLdje_0BfU2Kw-XXZzRxMSIFple69fmKMNlMcP_AZhOQw&oe=6AC8E57A)
3.  Add pLTV to your existing conversion event (any standard or custom event) in Conversions API (required) and Meta Pixel (optional). It is not recommended that a new custom event is created just for testing purposes.

### Conversions API (required)

Include `predicted_ltv`, `value` and `currency` in the `custom_data` parameter in your Conversions API payload:

```
{
  "data": [
    {
      "event_name": "Purchase",
      "event_time": 1633552688,
      "action_source": "website",
      "custom_data": {
        "currency": "USD",
        "value": 142.52,
        "predicted_ltv": 678.9
      }
    }
  ]
}
```

Use the [Conversions API Payload Helper](https://developers.facebook.com/documentation/ads-commerce/conversions-api/payload-helper) to generate and validate a complete payload.

### Meta Pixel

If you are sending values in both Meta Pixel and Conversions API, modify your existing event to include the `value` and `currency` and `predicted_ltv` parameters. Note: sending in Conversions API is required, Meta Pixel is optional.

```
fbq('track', 'Purchase', {
  value: 142.52,
  currency: 'USD',
  predicted_ltv: 678.9,
});
```

## Send delayed pLTV signals with AppendValue

Use the delayed integration when your model benefits from more time to compute an accurate value. Send the conversion event as usual with proper identifiers, then send the pLTV signal within **7 days** through a separate event named `AppendValue`.

Meta matches each `AppendValue` event back to its conversion event using the identifiers in `original_event_data`. Send the `AppendValue` event within **7 days** of sending the conversion event to Meta. The window is measured from when you send the conversion event, so if you send events in batches, account for the time already elapsed. For example, if you calculate pLTV on day 5, you have at most 2 days to send the data back to Meta.

1. In **Events Manager**, go to **Datasets** and select your dataset. Select **Value and Currency Metrics** dropdown and select the conversion event you intend to optimize for. Valid events will display **Set up pLTV** with a pLTV icon.![Events Manager pLTV onboarding overview with an expanded event with 'Set up pLTV' action](https://scontent.fmaa14-1.fna.fbcdn.net/v/t39.2365-6/742102285_1552543503270965_8441806266302196366_n.png?_nc_cat=105&ccb=1-7&_nc_sid=e280be&_nc_ohc=MeK9xwm-secQ7kNvwFMfkLK&_nc_oc=Adqo-0cqRP9YiQVKOSWdrCA2pTSa8OIxtQita_i-lxkW2fR-yqNKTDGNuwfnXVxMo_dzRXUxTWXjNDqL9ra06WbJ&_nc_zt=14&_nc_ht=scontent.fmaa14-1.fna&_nc_gid=ngVzqGl0pcAwRJZ98lEowg&_nc_ss=70289&oh=00_AQL9Ajn0riz9dAfTUZ9mac__5SBjs1djIhxt4CAO_i-RDw&oe=6AC8B65B)
2. A screen will display to allow you to select how you will send your pLTV data to Meta. Select **After [Event Name] events** to send pLTV delayed. Select **Start integration** to begin the onboarding process.![Events Manager pLTV integration modal displaying the available options to send pLTV data to Meta with the 'after Purchase events' selected](https://scontent.fmaa14-1.fna.fbcdn.net/v/t39.2365-6/741636363_1552543459937636_3412341159480970757_n.png?_nc_cat=110&ccb=1-7&_nc_sid=e280be&_nc_ohc=5A3wfVJ_QbYQ7kNvwElkV3g&_nc_oc=Ado2iTviMKUhRLtMVhO_TNoLcyUwfzouIDuDW2wLoLADh6a_A0vq5Z3L00u638m3OaHwU8pZGZuxcTUe0VCA3NxT&_nc_zt=14&_nc_ht=scontent.fmaa14-1.fna&_nc_gid=ngVzqGl0pcAwRJZ98lEowg&_nc_ss=70289&oh=00_AQI4BiGBMUi5tfZX3lDKaPGmCjA_lzsXTai-XTkckQLqYw&oe=6AC8D651)
3. Set up the `AppendValue` event following the sections below

### Match your events

To match each `AppendValue` event to its conversion event, provide the following in `original_event_data`:

* **`event_id` and/or `order_id` (needed for matching)**: Meta uses these identifiers to find the conversion event that corresponds to your `AppendValue` event. Send both when possible to improve your match rate, and ensure each value is identical to the one sent on the conversion event.
* **`external_id` (optional, but recommended)**: A user-level identifier that helps Meta associate both events with the same user. Because it identifies users rather than events, it cannot replace `event_id` or `order_id`.

If you send the conversion event through both the Meta Pixel and the Conversions API, include `event_id` and/or `order_id` as a top-level parameter on both the Meta Pixel and the Conversions API, keep the payloads identical, and send `external_id` on both if you use it. To add `external_id` to the Meta Pixel, see [advanced matching](https://developers.facebook.com/documentation/meta-pixel/advanced/advanced-matching). For the Conversions API, see [External ID](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/external-id).

Do not confuse the top-level `event_id`/`order_id` with the `event_id`/`order_id` in `original_event_data`. The top-level values uniquely identify the event and are used for deduplication, while the values in `original_event_data` are used to match an `AppendValue` event to its conversion event.

* **For a conversion event**, the top-level `event_id`/`order_id` is required, and `event_id`/`order_id` in `original_event_data` should not be provided.
* **For an `AppendValue` event**, the top-level `event_id`/`order_id` is optional (provide it if you need Meta to deduplicate the event for you), and `event_id`/`order_id` in `original_event_data` is required.

### AppendValue event parameters

| Top-Level Parameter | Nested Parameter | Description |
| --- | --- | --- |
| `event_name` string |  | **Required.**The standardized name for the delayed pLTV event.Expected value: `AppendValue`**Note**: This name is standardized. Do not change it. |
| `event_time` integer |  | **Required.**A Unix timestamp in seconds indicating when you calculated the pLTV. It must be later than the conversion event’s `event_time`. Send the `AppendValue` event within 7 days of sending the conversion event. |
| `event_id` string |  | **Optional.**This ID can be any *unique* string chosen by the advertiser. The `event_id` and `event_name` parameters are used to deduplicate events sent by both web (via the Meta Pixel) and the Conversions API. Note that while `event_id` is marked optional, it is recommended for event deduplication.For deduplication, the `eventID` from a browser must match the `event_id` in the corresponding server event. Learn more about [Handling Duplicate Pixel and Conversions API Events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events).An order number or transaction ID are two potential identifiers that can be used for `event_id`. For example, if a customer makes two purchases on your website with order numbers 123 and 456, each Conversions API call would need to include its respective order number for `event_id`. This allows us to properly distinguish these two purchase events as distinct orders. The two corresponding browser Pixel purchase events would need to also send the same order numbers in the `eventID` parameter for us to understand that there were only two events that took place, not four unique purchases.For other events without an intrinsic ID number, a random number (so long as the same random number is sent between browser and server events) can be used. |
| `original_event_data` object | `event_name` string | **Required.**The `event_name` of the conversion event you are appending to, for example `Purchase`. |
|  | `order_id` string | **Required for matching (provide `order_id` and/or `event_id`).**The `order_id` of the conversion event. Must match the value sent on the conversion event. |
|  | `event_id` string | **Required for matching (provide `order_id` and/or `event_id`).**The `event_id` of the conversion event. Must match the value sent on the conversion event. |
| `custom_data` object | `predicted_ltv` float | **Required.**The predicted lifetime value for this user. Must be a positive number. |
|  | `currency` string | **Required.**The ISO 4217 three-digit currency code for `predicted_ltv`. |
| `user_data` object | `external_id` string or list | **Optional, but recommended.**Any unique ID, such as loyalty membership IDs, customer IDs, and external cookie IDs. You can send one or more external IDs.In order to make sure your `AppendValue` event is resolved correctly to the same user as the original event, it is recommended that you send consistent `external_id` which can help preserve identity, or Meta-generated click ID via `fbp`/`fbc`.**Note:** Hashing is recommended, but you must have the same method of hashing for both the original conversion event and `AppendValue`, to ensure they match. |

### Example payload

```
{
  "data": [
    {
      "event_name": "AppendValue",
      "event_time": 1633984688,
      "action_source": "website",
      "user_data": {
        "external_id": "<HASHED_EXTERNAL_ID>"
      },
      "original_event_data": {
        "event_name": "Purchase",
        "order_id": "<CONVERSION_EVENT_ORDER_ID>",
        "event_id": "<CONVERSION_EVENT_EVENT_ID>"
      },
      "custom_data": {
        "predicted_ltv": 20.1,
        "currency": "USD"
      }
    }
  ]
}
```

The example above omits other required Conversions API parameters. See the [Conversions API Main Body Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/main-body) for the full specification, and use the [Payload Helper](https://developers.facebook.com/documentation/ads-commerce/conversions-api/payload-helper) to validate your payload.

## Check your integration health

After you start sending events, you can confirm that your integration is healthy via a number of methods:

1. In **Events Manager**, go to **Datasets** and select the dataset onboarding to pLTV to verify its status.![Events Manager pLTV integration progress widget at 0% with a 'Waiting for conversion events' status and View status button](https://scontent.fmaa14-1.fna.fbcdn.net/v/t39.2365-6/740249423_1552543516604297_5721408715607186633_n.png?_nc_cat=109&ccb=1-7&_nc_sid=e280be&_nc_ohc=cFJwqsYdeKUQ7kNvwGAgccw&_nc_oc=AdooP8atOPSBSgkXZ7-TGmTCXufZPaqLIafz96eubEeykdOfxeX1nUXsqVcgXAy8q_48CKwiXTznQ6S1MRahBR7P&_nc_zt=14&_nc_ht=scontent.fmaa14-1.fna&_nc_gid=ngVzqGl0pcAwRJZ98lEowg&_nc_ss=70289&oh=00_AQLoo-4KSRcTtEmoEFfHkGHYTGVKG0T1D8l7KuBs2MgZWw&oe=6AC8C264)

  * Select **View status** to see which step you are on and to review any issue details and recommended fixes. Selecting the displayed issue(s) will show you more details.![Events Manager pLTV integration modal displaying a completed pLTV onboarding step and an onboarding step with an issue that displays a hyperlink of the issue description 'Some of your website AppendValue events are sending invalid pLTV data'](https://scontent.fmaa14-1.fna.fbcdn.net/v/t39.2365-6/742241791_1552543509937631_1746086212348453098_n.png?_nc_cat=106&ccb=1-7&_nc_sid=e280be&_nc_ohc=Z3hnTAXbxwYQ7kNvwGA-TPT&_nc_oc=AdoKhJM7_faLhUjGWn4EbVfRf3cHZeKOoDBFeBpMsPJyBYnAbe0UPnxTz3Hy0PDS2RBc8J2Jy3vnte8-64nvN_VF&_nc_zt=14&_nc_ht=scontent.fmaa14-1.fna&_nc_gid=ngVzqGl0pcAwRJZ98lEowg&_nc_ss=70289&oh=00_AQLKF8wLeBaumx-h1rMXDzl__oH3vfZA6CaxrrsgNwSAEA&oe=6AC8B7F4)

2. You can also confirm your integration health by toggling the **Value and Currency Metrics** dropdown, then selecting an event actively onboarding to pLTV and **View issues**.![Events Manager 'Value and Currency metrics' table displaying the 'AddPaymentInfo' event with a warning triangle indicating it has issues](https://scontent.fmaa14-1.fna.fbcdn.net/v/t39.2365-6/741606704_1552543513270964_8771626345804348417_n.png?_nc_cat=111&ccb=1-7&_nc_sid=e280be&_nc_ohc=Ejc4-29N9CUQ7kNvwFSJaye&_nc_oc=Adqu1L0oNeeb8rVIL8dY0_4P0b4AI0hnmLZaNMxg6LWGtwRFX8ijQ9tHDkJA2DFU8wpP779ISMpcn2Rup3DLloOc&_nc_zt=14&_nc_ht=scontent.fmaa14-1.fna&_nc_gid=ngVzqGl0pcAwRJZ98lEowg&_nc_ss=70289&oh=00_AQKdAZ3OZnlEGpQlmEHoB6QpXEOBSte217mvRpM4RHaSIA&oe=6AC8C49C)

Once you pass all checks, allow roughly **2 weeks** for Meta’s models to train before you start your first campaign.

## Test and measure your results

After your integration is healthy and trained, validate performance before you scale:

* **Warm up your campaigns** before starting your first pLTV value optimization campaigns by running a pLTV value optimization for ~7 days to help the model learn and exit the learning phase.
* **Compare** the pLTV campaign against your existing baseline campaign to gauge the impact of optimizing on pLTV.
* **Read results** in Ads Manager by adding the pLTV column for your conversion event, such as **Purchase pLTV**, through **Columns** > **Customize columns** and selecting **Results ROAS**.

Return on ad spend (ROAS) is comparable only across pLTV campaigns. Comparing ROAS across different optimization settings is not accurate, because each value is calculated differently.

If you use delayed pLTV, wait for the campaign to end plus the number of days your pLTV is delayed. For example, if your pLTV model takes 5 days to compute and send an `AppendValue` event, wait 5 days after the campaign ends before pulling final numbers.

For campaign setup, budgeting, and scaling guidance, work with your Meta representative.

## See also

* [Integration Guidance: Value Optimization](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/value-optimization)
* [Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api)
* [Get Started with the Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/get-started)
* [Conversions API Payload Helper](https://developers.facebook.com/documentation/ads-commerce/conversions-api/payload-helper)
* [Conversions API Standard Parameters (custom_data)](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/custom-data)
* [Conversions API Customer Information Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters)
