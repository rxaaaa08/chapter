<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products | Saved: 2026-09-19 -->

# "Gateway Products: Conversions API Gateway and Signals Gateway"



The [Conversions API Gateway](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway) and [Signals Gateway](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway) "Gateway Products" share a common set of components and infrastructure that provides the foundation for both. This foundation is usually referred to as the "Gateway Products" in this documentation.

## [Conversions API Gateway](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway)

Efficiently send events from your new or existing Meta Pixels to your Conversions API Gateway, which can then forward them to the Meta Conversions API.

* [Conversions API Gateway: Setup Guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/setup)
* [Conversions API Gateway Data Source Management](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/data-source-management)

## [Signals Gateway](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway)

Create flexible events pipelines that support various data sources and data destinations.

* [Signals Gateway: Setup Guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/setup)
* [Pipeline Management](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/pipeline-management)

## Gateway Platform Details

Some of the Gateway Platform's common components include:

* [Account Management](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/account-management)
* [Host User Management](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/user-management)
* [Host Settings](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/host-settings)
* [Control Plane API](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-control-plane-api)
* [Software Updates](https://developers.facebook.com/documentation/ads-commerce/gateway-products/updates)

The Gateway Platform architecture consists of the following:

* Server application which receives incoming events, transforms events, and sends them to a destination depending on which pipeline type has been configured
* A web UI where businesses can administer, maintain and monitor their Conversions API Gateway or Signals Gateway server instance

## Gateway Admin UI

Both Gateway products provide a web-based user interface for instance configuration and data management. You can access this UI from: `https://<Gateway Platform Endpoint>/hub/`

## Learn More

* [Signals Gateway](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway)
* [Conversions API Gateway](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway)
