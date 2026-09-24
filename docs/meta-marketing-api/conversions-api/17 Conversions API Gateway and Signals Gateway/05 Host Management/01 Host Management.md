<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway: Account Onboarding and Management"



This guide can help an advertiser, agency, partner, or resellers onboard and manage their account in a Conversions API Gateway or Signals Gateway instance.

## Prerequisites

Verify the following prerequisites before onboarding an account to one of the Gateway Products, Conversions API Gateway or Signals Gateway.

### Account Onboarding and Administration

Users onboarding an account and future account admins should have:

* Administrator access to the DNS provider for the domain used by an account (and its associated data sources) to access the Gateway Product.
* Please use Google Chrome browser to execute the onboarding. Some functionality may not execute properly in other browsers.

## How to Use This Guide

Follow the step-by-step instructions below to onboard accounts to the Gateway Products and manage them.

## Concepts

**Host**: The agency, partner, reseller, or advertiser that creates and manages the Gateway Products instance. The host is responsible for configuring, monitoring, and troubleshooting the instance, as well as cloud service account management and billing. The host sets the terms for the service offered to businesses that connect to the instance.

**Account**: A business (advertiser) that connects their data source(s) to a host's Gateway Products instance. We recommend to create an account for one or more pixels that are:

* Managed by the same group of people (that is, all account users have access to the pixel through the business account), or
* Fired on the same advertiser domain.

**Managed account**: An account whose data upstream and/or downstream implementations are (also) managed by an agency, partner, or reseller (the host). In particular, the host is delegated admin access to the specific Meta Pixel(s) in the advertiser's Events Manager. The typical process will involve the host creating the account in the Gateway Products and connecting the advertiser's data sources to the Gateway Product instance, under terms set by the host. In addition, the host can create account users with specific permissions for the advertiser's employees that will be able to administrate, manage or simply view the account configuration. The host and the Advertiser are in control of the specific settings and the connection of the data sources to the Gateway Product instance. The account owner can at any time switch to an unmanaged account.

**Unmanaged account**: An account whose data upstream and downstream implementations are NOT managed by an agency, partner, or reseller. The typical process will involve the host creating the account and inviting the business (an account admin) to onboard and connect to the instance, under terms set by the host. The business is in control of their specific settings and the connection of the data sources to the instance. The business can at any time switch to a managed account.

[Unmanaged Account Onboarding and Offboarding](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/account-management/onboarding-and-offboarding-accounts)

[Account User Management](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/user-management)

[Manage Domain Allow-Lists and Block-Lists for an Account](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/account-management/manage-allow-block-lists)

[Account Data Routing Configuration](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/account-management/account-data-routing)

## See Also

* [Conversions API Gateway Overview](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway)
