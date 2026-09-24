<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/configuration | Saved: 2026-09-19 -->

# Conversions API Gateway or Signals Gateway Configuration



## Prerequisites

Before you can deploy Conversions API Gateway or Signals Gateway, you'll need the following properties and access:

* Admin access for a cloud provider service (for example, AWS or GCP).
* Admin access to the Meta Pixel. Follow [these instructions](https://www.facebook.com/business/help/279059996069252?id=2042840805783715) to update the access if needed.

## Network and Security

### Cloud account isolation

Businesses can choose to deploy one of the "Gateway Products" Conversions API Gateway or Signals Gateway on their existing third-party cloud account, or on a new cloud account separated from their main assets. Both options provide infrastructure isolation, as Gateway Products are designed to have no interaction with business' server-side assets. Gateway Products are provisioned within the default Virtual Private Cloud network (VPC).

### Allowed network traffic

To function correctly, Gateway Products require the following inbound and outbound network traffic to be open. The default configuration only allows the required traffic.

| Source | Destination | Protocol/Port | Description |
| --- | --- | --- | --- |
| Gateway Product instance | 0.0.0.0/0 | All | Allow outbound connection to the internet from Gateway Product to pass events to Meta and download packages from external repositories such as:<br><br>* Download software in Docker Containers from ECR<br>* Send logs to AWS Cloudformation Logs<br>* If opted-in to System Health Information data transmission, periodically send system status data about your business' use/operation of its Gateway Product installation to Meta for monitoring and troubleshooting problems.<br>* Communicate with AWS EKS service |
| 0.0.0.0/0 | Gateway Product instance | TCP/80 | Allow inbound HTTP connection to Gateway Products<br><br>*This port is automatically redirected to TCP/443* |
| 0.0.0.0/0 | Gateway Product instance | TCP/443 | Allow inbound HTTPS connection to Gateway Products<br><br>*Used by browsers to send events through websockets secure (WSS) or HTTPS* |

### Endpoints and In-Transit Data

Endpoints are secured via TLS and SSL, and in-transit data is encrypted. Gateway Products expose two internet-facing endpoints:

* HTTPS and Websocket secure (WSS) endpoint for receiving events from browsers
* HTTPS admin front end for administering the server

These endpoints are secured through TLS (TLS 1.2 and 1.3 are supported) and by using an SSL ([default cipher list](https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/#ssl-ciphers)) certificate generated automatically during the server provisioning. The default certificate has a one year life time and renews regularly as long as two DNS records set up during installation are unchanged.

The default domain uses AWS Cloudfront endpoint. If a user sets up a custom domain, it uses AWS managed certificates. TLS is terminated at load balancer level before forwarding to private VPC.

## Additional Security Protections

To help reinforce the protections of Gateway Products endpoints, businesses can use their preferred cloud-based security solutions (Web Application Firewall, anti-DDOS) from AWS or other third-party providers. Such protections are configured by proxying the Gateway Products traffic through the corresponding service provider and allowing inbound traffic only from this service provider.

## Data Storage and Retention Policy

Gateway Products store configuration data and operational logs such as event statistics, and uses the instance disk storage for storing logs.

Instances using AWS as their third-party cloud provider will have logs stored in CloudWatch, and access to these logs is determined by AWS data access policies and any additional policies implemented within their organization. You may choose to share operational logs with your support contact. Learn [more about extracting logs](https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/gateway/troubleshooting#enabling-conversions-api-gateway-logs).

## Scalability

Gateway Products server capacity is determined by the scale limit. It can be decided on the Gateway Products Admin UI after installation.

**Note that**:

* By default the cluster can support 1,000 requests per second for AWS EKS. For AWS App Runner and GCP GKE, the cluster can support 100 requests per second by default.

## Learn More

* [Conversions API Gateway Setup Guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway)
* [Signals Gateway Setup Guide](https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/setup)
