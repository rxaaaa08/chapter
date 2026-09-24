<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway | Saved: 2026-09-19 -->

# Signals Gateway



Signals Gateway enables businesses to receive and send events on their own infrastructure, created using the components and structure described in the documentation below. It does not require any dedicated developer resources, so no third-party partners or coding is necessary for setup.

Additionally, the Signals Gateway offers incremental efficiencies, such as:

1. **Speed**: Brings down the potential data integration time from weeks to hours.
2. **Cost**: The Signals Gateway may incur a lower cost to clients due to lower technical resources or requirements. The only cost of the Signals Gateway is the associated cloud resource fees.  
3. **Low technical lift**: Users with some technical expertise can set up and configure the Gateway themselves with minimal support from their IT or developer teams.  
4. **Low maintenance costs**: Unlike manual direct integrations, the Signals Gateway will auto update (with client consent) whenever new features become available, reducing long-term maintenance costs.  

## Architecture

The Signals Gateway is configured by self-provisioning a server instance in your cloud environment, which is used to send events through a reliable server to server connection to specific destinations.

Below is a high level diagram of the major components involved in Signals Gateway:

### Multi-Domain Support

The Signals Gateway supports multiple domains. For example, you can have multiple domains such as "domain.com" , "domain.co.uk", "anotherdomain.com". All of these domains could be configured within a single instance of the Signals Gateway during deployment. Please review the [Setup Guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/setup) for more details.

## Signals Gateway Components

The Signals Gateway requires a public cloud provider (for example, AWS) account to allow users to automatically deploy the underlying infrastructure without the need of a developer as well as to have a predictable cost.

### Signals Gateway Admin UI

The Signals Gateway provides a user interface with the product. You can access this UI from `https://<Signals Gateway Endpoint>/hub/capig` (that is, the Signals Gateway endpoint that you have configured in DNS).

From this UI, you can see:

* **Pipelines**: You can configure data pipelines with sources and destinations.
* **Event activity**: You can see event volume received and sent by each pipeline.
* **Notifications**: Be notified of product updates and update the Signals Gateway software.

## Learn More

* [Setup Guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/setup)
* [Instance Activation](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/instance-activation)
