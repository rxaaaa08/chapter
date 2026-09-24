<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/enable-cdn | Saved: 2026-09-19 -->

# Enabling CDN Domain for Signals Gateway Pixel Use



Amazon Web Services Cloudfront CDN service will be enabled for Signals Gateway Pixel customers starting from version 1.13. For those installed with a previous version and not using Cloudflare for the domain management, this guide includes instructions for activating CDN domains in an AWS account manually to finish the upgrade to the Signals Gateway product.

Enabling CDN through Cloudfront can significantly enhance client experience when accessing customers' websites, due to the global caching of static content, resulting in faster access times compared to systems that do not use a CDN domain. Furthermore, it can decrease the Signals Gateway's workload, as files will no longer be fetched from these gateways.

### Activation CDN in Cloudfront

1. Make sure you have already upgraded to the Signals Gateway from the Conversions API Gateway (The upper left logo in the main page is not Meta logo).

2. Go to your AWS account and navigate to the Cloudfront screen, then Search Distribution by your "fallback domain". **Note: Fallback domain can be found in your DNS setup page. If you know your cluster ID, you can directly choose it**.

3. Go to the distribution by clicking the ID, and go to the "tags" tab. Confirm the Application is "Conversions API Gateway".

4. Go to the Behaviors tab, and click the Create Behavior button. In the behavior, set the values as below:

**Warning:** **Note**: Origin and origin groups: **[The first choice: "eksBastionInstanceCapigDistributionOriginxxxx"]**

5. Under **Create cache policy**, set the value as below:

**Warning:** **Note**: you can select your preferred **Name** and **Description**, and have TTL settings as 1800/3600/3600. All the others remain default.

6. Go back to the behaviors view, refresh cache policy, and select the new caching policy above.

7. Create the behavior. The final behaviors should match those shown in the image below:

8. A CDN domain for static .js files will now be enabled.

