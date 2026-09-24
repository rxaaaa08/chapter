<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway-pipeline/advanced-matching | Saved: 2026-09-19 -->

# "Signals Gateway: Enhance Events with Advanced Matching Data"



You can enhance events with advanced matching data using Signals Gateway. When you enable this feature, your Signals Gateway can set, update, and send a browser cookie with data source advanced matching data. This can help you enhance your events to achieve better user matching.

## How to Use This Feature

* Go to your Signals Gateway Admin UI page, which is hosted on your subdomain

**Warning:** **Note**: You can also launch your Signals Gateway instance in the Meta Events Manager Settings tab. Look for the Signals Gateway section and select **Launch**.

* Log in to your Signals Gateway using admin credentials.
* In the side navigation, hover over **Account settings** and select the **Advanced matching** menu item.
* Enable the toggle button for **Enhance events with advanced matching data** setting (By default, it will be set to'Off').

## Troubleshooting

### Low EMQ for Conversion API Gateway data Pipeline or Conversion API destinations

For the Event Match Quality (EMQ) shown in the Meta's Events Manager, we recommend aiming for "Good" or "Great". These steps may help you improve EMQ for your Signals Gateway's Meta Destination.

* Enable Enhance events with advanced matching data in the Signals Gateway UI.
* For Signals Gateway's Conversion API Gateway data pipeline, you can enable [Automatic Advanced Matching](https://www.facebook.com/business/help/1993001664341800?id=1205376682832142) in Events Manager. If the EMQ still appears to be not optimal, you can implement [Manual Advanced Matching](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching).
* For Signals Gateway data pipeline, you can enable the "data enhancement" feature for your Signals Gateway pixels.
* Wait 1-2 days for the EMQ to be updated in Events Manager

## See Also

* [Automatic Advanced Matching](https://www.facebook.com/business/help/1993001664341800?id=1205376682832142)
* [Manual Advanced Matching](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching)
