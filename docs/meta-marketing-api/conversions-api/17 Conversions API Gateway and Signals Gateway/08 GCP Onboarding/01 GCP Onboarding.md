<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-gcp/host-onboarding | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway: Host Onboarding for Google Cloud Platform"



Conversions API Gateway and Signals Gateway on Google Cloud Platform (GCP) run in hosts' own GCP account. The installation automatically creates software and infrastructure that uses Google Cloud Run, Cloud Storage, and Cloud Build. No coding experience is necessary.

This guide can help an agency, partner, reseller, or advertiser create and manage their Conversions API Gateway or Signals Gateway instances.

## Prerequisites

* Hosts should have administrative (Owner) access to a GCP account and GCP project.
* Hosts can use an existing GCP account or create a new GCP account and project (recommended).
* GCP offers a $300 credit, valid for up to 90 days after registration, for Conversions API Gateway or Signals Gateway users in the following regions:
    * us-central1
    * us-west2
    * europe-west1
    * asia-east1
    * australia-southeast1
    * southamerica-east1

## How to Use This Guide

Follow the step-by-step instructions to set up, install, and use the product. Setting up host onboarding for Conversions API Gateway or Signals Gateway involves the following:

### Create a new Conversions API Gateway or Signals Gateway instance

Create and configure a new Conversions API Gateway or Signals Gateway instance for multiple accounts in your GCP project. This step walks you through the initial setup, including selecting your region and linking your Meta business account.

See: [Create a new Conversions API Gateway for multiple accounts instance](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-gcp/create-instance-agencies-partners)

### Set Up Custom Domain

Configure a custom domain for your Gateway instance to receive browser events. This step covers DNS configuration and SSL certificate provisioning.

See: [Set up custom domain](https://developers.facebook.com/documentation/ads-commerce/gateway-products/gateway-gcp/set-up-domain)

### Set Auto-Scaling Limits

Set auto-scaling parameters for your Gateway instance to manage resource usage and cost. This step helps you set minimum and maximum instance counts based on your expected traffic.

See: [Set auto-scaling limits](https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/auto-scaling-limits)

## See Also

* [Conversions API Gateway](https://developers.facebook.com/documentation/ads-commerce/gateway-products/conversions-api-gateway)
