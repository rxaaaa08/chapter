<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/estimated-daily-results | Saved: 2026-09-19 -->

# Estimated Daily Results



**Warning:** This API is rolling out in phases, so you might not have access immediately.

Get the estimated bid, estimated daily and monthly active people and estimated outcomes curve for a specific [optimization goal](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign), targeting spec, [attribution spec](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) and [promoted object](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign) where applicable. In the outcomes curve each point represents an estimated reach and estimated number of results (impressions, actions) for a specific spend.

Endpoints for estimated daily results:

- [`/{AD_ACCOUNT}/delivery_estimate`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/delivery_estimate) - note this `delivery_estimate` endpoint works on ad account level even though `targeting_spec` is defined for [ad sets](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign)
- [`/{AD_SET}/delivery_estimate`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign/delivery_estimate) - You can omit all parameters at the ad set level; they default to the current ad set's settings.

The bid estimate may vary for the same targeting when you call it from different ad accounts: the bid estimate takes into consideration historical ad account information and forms a custom estimate.

Delivery estimates appear as the Daily Reach and Results Curve in [Ads Manager](https://www.facebook.com/ads/manager). **Ads Manager does not use delivery estimates for any other estimates.**
