<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/enhance-events-advanced-matching | Saved: 2026-09-19 -->

# "Conversions API Gateway: Enhance Events With Additional Available User Data"



Enabling this feature enhances events on the Conversions API Gateway using additional available user data from a Meta Pixel installed on your website. When you enable this feature, your Conversions API Gateway instance can set, update, and send a browser cookie with more complete user data from your Meta Pixel, to help you better match your events to Meta users.

## How to Use the Feature

* Log in to your Conversions API Gateway using admin permissions, hosted on your subdomain.

**Warning:** **Note**: You can also launch your Conversions API Gateway instance in the Meta Events Manager Setting Tab. Look for the Conversions API Gateway section and select **Launch**.

* Log in to your Conversions API Gateway Admin UI.
* In the Overview Page, go to the Enhance events card.
* Enable or disable the Enhance events with advanced matching data feature using the toggle button (it will be 'off' by default).

### Possible Additional User Data
In addition to user data that you provide manually, the following information will also be collected to enhance events, if available: email, name, phone number, city, state, gender, zip_code.

## Troubleshooting

### Issue 1: Event volumes in the Gateway UI do not correspond to the numbers in another platform, for example, Ads Manager or advertiser's database.

* [Check the volumes in the Gateway UI](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/monitoring) to ensure the published events are the same as the received. Also check that the event volumes are aligned with the Events Manager for the same type of events.
* The events shown in the Conversions API Gateway are both organic and from ads. Hence when making comparisons between Gateway UI/Events Manager vs. Ads Manager, it would be good to take into consideration how the events are made, that is organically or via ads.
* The advertiser might have multiple campaigns and ad accounts and may need to aggregate everything to match the Gateway events count.
* When making the comparisons, ensure that the same timeframe is applied across all the platforms.

