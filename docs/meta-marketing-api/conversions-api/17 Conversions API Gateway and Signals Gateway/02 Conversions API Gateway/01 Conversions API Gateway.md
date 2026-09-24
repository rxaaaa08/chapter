<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway | Saved: 2026-09-19 -->

# Conversions API Gateway



The Conversions API Gateway is a self-serve configuration option in Events Manager. It enables businesses to integrate following best practices guidance and send events with the Meta Pixel and the Conversions API in a redundant set up, without dedicated developer resources, so no coding is necessary.

Additionally, the Conversions API Gateway offers incremental efficiencies, such as:

1. **Speed**: Brings down the potential Conversions API integration time from weeks to hours or even minutes.
2. **Cost**: The Conversions API Gateway may incur a lower cost to clients due to lower technical resources or requirements. The only cost of the Conversions API Gateway is the associated cloud resource or partner fees.  
3. **Low technical lift**: Performance marketers with some technical expertise can set up and configure the Conversions API themselves with minimal support from their IT or developer teams.  
4. **Low maintenance costs**: Unlike manual direct integrations, the Conversions API Gateway will auto update (with host admin consent) whenever new features become available, reducing long-term maintenance costs.  

## Architecture

The Conversions API Gateway is configured by self-provisioning a server instance in your cloud environment, which is used to send web events through a reliable server to server connection to Meta.

Below is a high level diagram of the major components involved in the Conversions API Gateway:

In this diagram:

* A **Meta Pixel** configured with the Gateway endpoint will also send events to the Gateway by the pixel script.
* The Conversions API Gateway receives events data from browsers and then sends events data to the Conversions API.
* The `event_id` deduplication key is automatically generated and propagated to help with deduplication between both channels.

### Multi-Pixel and Multi-Domain Support for Meta Pixel

The Conversions API Gateway supports multiple domains. For example, you can have multiple domains such as "domain.com" , "domain.co.uk", "anotherdomain.com". All of these domains could be configured within a single instance of the Conversions API Gateway during deployment. **Please review the [Setup Guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/setup) for more details**.

The Conversions API Gateway supports multiple Meta Pixels. **Please review the [Setup Guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/setup) for more details.**

## Conversions API Gateway Components

Provisioning the Conversions API Gateway requires a non-Meta third-party managed cloud provider (for example, AWS) account to allow businesses to automatically deploy the underlying infrastructure without the need of a developer as well as to have a predictable cost.

### Software Components

**Meta Pixel**

The Meta Pixel is a standard JavaScript library loaded on an advertiser's website that allows the business to share data about customer actions, referred to as Business Tools Data in the [Business Tools Terms](https://www.facebook.com/legal/terms/businesstools). For businesses that enable the Conversions API Gateway, this JavaScript tag will send events to both Meta and the Conversions API Gateway through a secure connection (HTTPS) every time the Meta Pixel is fired from the browser.

**Conversions API Gateway**

The Conversions API Gateway is a standalone Meta product and can be run on any one of these three cloud services: AWS EKS, AWS ECS Express, or GCP. It is provisioned within a cloud provider's account owned by the business. It is composed of two main modules:

* One middleware module in charge of receiving incoming events from browsers, transforming those browser events to Conversions API events, sending events to Meta through the Conversions API connection
* One admin portal (web UI) where businesses can administer, maintain and monitor their Conversions API Gateway server instance

### Conversions API Gateway Admin UI

The Conversions API Gateway provides a user interface with the product. You can access this UI from `https://<Conversions API Gateway Endpoint>/hub/capig` (that is, the Conversions API Gateway endpoint that you have configured in DNS).

From this UI, you can see:

* **Connected pixels**: You can close and open connections for different Meta Pixels.
* **Event activity**: You can see event volume received by Meta from both channels, pixel and the Conversions API Gateway.
* **Conversions API success rate**: You can see what is the percentage of events received from browsers published to Meta.
* **Notifications**: Be notified of product updates and update the Conversions API Gateway software.

## Learn More

* [Configuration](https://developers.facebook.com/documentation/ads-commerce/gateway-products/configuration)
* [Setup](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway/setup)
* [Troubleshooting and Monitoring](https://developers.facebook.com/documentation/ads-commerce/gateway-products/troubleshooting-guide)
