<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/monitoring | Saved: 2026-09-19 -->

# Monitor Your Conversions API Gateway Setup



## Tools for Monitoring

### Monitoring for a Host Account

#### Check an account's status

If your system hosts multiple accounts, you can check any account's connection status in the **Account status** column in the **Overview** section. An Active status indicates that the account's status is normal. A Deactivated status means the account is deactivated and any pixels connected to this account are not sending events to the Conversions API.

#### Check resources from Amazon CloudWatch

A host account admin can use AWS CloudWatch to monitor resources and applications in real time by following [the guide](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html).  

### Monitoring an Account

#### Check event volume in Events Manager (browser events vs. server events)

In Meta Events Manager, select the dataset associated with Meta Pixel that is sending the event you want to monitor. The green line in the chart represents server events (received through the Conversions API), while the blue line represents browser events (received through the Meta Pixel). If the green line follows the blue line (the discrepancy is very small or 0), then your Conversions API Gateway integration is handling events correctly. Check the [Troubleshooting steps](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway-multiple-accounts/troubleshooting-guide#troubleshooting-steps-for-the-account--connecting-to-the-gateway) if you do not see the green line.

Clicking on **View details**  will show more information about the event. Use the **Event overview** tab to identify issues with the volume of server events sent by the Meta Pixel.

#### Check the Event Match Quality (EMQ)

In Meta Events Manager, select the dataset associated with Meta Pixel that is sending the event you want to monitor. The Event Match Quality (EMQ) will then be shown. An EMQ designation of "Good" or "Great" is considered to be optimal. Select **View Details** and then the **Event Matching** tab for more information on the customer information parameters that are received through the server events, and refer to the [Troubleshooting steps](https://developers.facebook.com/documentation/ads-commerce/gateway-products/troubleshooting-guide) on ways of improving EMQ.

#### Check event volume in the Gateway UI

In the Conversions API Gateway UI, check the volume of events received from the Meta Pixel (Total Received) and sent to the Conversions API endpoint (**Total sent**). If these two coincide, then the solution is working. As an additional step, check that these volumes coincide with those on Events Manager.  

#### Check the Meta Pixel connection to the Conversions API Gateway (troubleshooting step)

Verify in your browser's developer tools that the Meta Pixel is effectively transmitting the user events to the Conversions API Gateway through a successful call to `https://<Conversions API Gateway Endpoint>/events`.  

## See Also

* [Conversions API Gateway Overview](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway)
* [Conversions API Gateway Setup Guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/setup)
