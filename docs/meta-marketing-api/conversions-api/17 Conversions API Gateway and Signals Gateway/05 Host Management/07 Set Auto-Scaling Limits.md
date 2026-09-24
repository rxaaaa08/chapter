<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/auto-scaling-limits | Saved: 2026-09-19 -->

# "Conversions API Gateway or Signals Gateway: Set Auto-Scaling Limits"



For Conversions API Gateway and Signals Gateway, its event processing capacity is determined by the event capacity that you set. By default, Conversions API Gateway and Signals Gateway can process up to 100 events per second. You can update this value on the Conversions API Gateway or Signals Gateway Admin UI after installation. 

The auto-scaling limits display the current event capacity and the average number of events per second in the last 24 hours. You can update the event capacity using the slider. When you choose a new value and click the **Save changes** button, a pop-up window will appear.

The message will include information about how increasing event capacity may result in an increase in fees.

After clicking the **Confirm** button, the event capacity will be updated.

When the number of events per second on your instance exceeds the event capacity you have set, you will see an alert message on this page. The message will show how much the peak event per second is above the event capacity and provide a recommended value to help you choose a new limit.

## See Also

* [Using the Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/using-the-api)
