<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/mpa-ads | Saved: 2026-09-19 -->

# Partner Ads Management



This page has guidance on what you need to run ads for a managed partner as a monetizable service at scale.

As a marketplace, you are expected to use the managed partner ads APIs to create an interface for your sellers to engage with as part of your service offering. This allows the marketplace to control and manage all aspects of the seller ads ecosystem, even though the ads appear offsite on Facebook.

## Seller experience created by the marketplace

The following processes should be in place before you can manage ads for your partners:

1. **Seller onboarding** — You will need to create a process that allows sellers to sign up for the service you provide through managed partner ads.
2. **Default templates for campaigns** — You will need to create a standard template that will be used to run campaigns for your sellers. You can create more than one. You can create templates when you onboard into the Collaboration Center, or create your own.
3. **Seller interface** — Your sellers will need a custom interface where they can request, create, and manage campaigns, as well as view reporting.
4. **Billing mechanism** — You will need to integrate a billing mechanism for your managed partner ads services into your billing infrastructure. It should allow sellers to view and manage their finances with respect to their campaigns. Meta will send an invoice to you each billing cycle. The default invoice setting is one invoice to one seller, but you can [create an invoice group](https://developers.facebook.com/docs/marketing-api/2tier-bm-solution/guides/invoice-group)  using our [Business Management API](https://www.facebook.com/business/help/545451859299492?id=2356205651275420r).

## Collaboration center and managed partners
As a marketplace, you can access a list of your managed partners to view details of the campaigns you are running on their behalf by going to **Business Manager** > **Collaboration Center** > **Partnerships** > **Managed partners**. This will allow you to:

* View a dashboard of all managed partners, including business information.
* See an overview of campaign delivery, credit, catalog segment, ad account, page, and business account issues.

You can also find a list of eligible and recommended sellers on the **Discover** page within the Collaboration Center.

## See more

* [Check Seller Eligibility](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/eligibility)
* [Onboard a Seller](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/onboarding)
* [Delete a Seller](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/deletion)
