<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/account-management/account-data-routing | Saved: 2026-09-19 -->

# Data Routing Configuration for Hosted Accounts



When connected, a web pixel sends events to the Conversions API Gateway or Signals Gateway using a domain proper to this communication, ideally the same as the page where the pixel fires (that is, first-party communication). For example, if the pixel fires on advertiser.com, ideally the Conversions API Gateway or Signals Gateway will be reachable by the pixel on gateway.advertiser.com.

The data routing functionality allows you to define the subdomain for the pixel to communicate with the Gateway Products, Conversions API Gateway or Signals Gateway.

To configure, select the **Data routing** menu in the Gateway Products UI.

Click on **Optimize** to modify the subdomain that the pixel uses to communicate with and send event data to the Gateway Products.

Define the subdomain that the pixel should use to communicate with the Gateway Products. It is recommended that the subdomain be based on the same domain as the website firing the pixel.

Create the **CNAME** records on the DNS provider account managing the new domain. The page will auto-refresh about 30 minutes after setting up the DNS records. The new subdomain will be configured and data routing will show as Optimized.

Click **Finish** and refresh the page. The new subdomain is configured and data routing status should show that it is **Optimized**.

The subdomain can be easily modified by clicking the **Change** button and following the same procedure outlined above. A new CNAME record will need to be created.

