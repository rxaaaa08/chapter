<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/dns-setup-guide | Saved: 2026-09-19 -->

# How to Set Up DNS Record on Cloudflare



This document will guide you through the steps to set up a DNS record on Cloudflare correctly.

### For new DNS records, make sure the 'Proxy status' setting is set as 'DNS only'.

### For existing DNS records, edit their settings and change 'Proxy status' to 'DNS only'.

### In some cases, if you need to use the 'Proxied' mode, for example, certificates are provisioned via proxy, please make sure the encryption mode under the TLS/SSL setting is set to 'Full'.

## See Also

* [Set Up Custom Domain for AWS](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-aws-eks/set-up-domain)
* [Create a Custom Domain for Google Cloud Platform](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-gcp/set-up-domain)
