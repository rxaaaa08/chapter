<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/integration | Saved: 2026-09-19 -->

# "Managed Partner Ads: Integration"


**Warning:** **Ads Management Standard Access is now Marketing API Access Tier**

**No code changes are needed.**

Tier labels have been updated: "Standard Access" is now **Limited Access**, and "Advanced Access" is now **Full Access**. The revised qualification threshold for Full Access has been reduced from 1,500 to **500 Marketing API calls** in the past 15 days. The underlying permission identifier remains the same, and existing access levels are preserved automatically. Learn more in the [Marketing API Access Tier documentation](https://developers.facebook.com/docs/features-reference#marketing-api-access-tier).

##  Overview
There are three main steps involved in the overall Managed Partner Ads integration process, as outlined below. This section provides an overview to help you understand and plan your work accordingly.

The end-goal is to set up an automated process to onboard your sellers and build an interface for sellers to engage with. Through this service, Meta ads are run and operated.

## Step 1: Preparation

* Onboard into [Collaborative Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads#step-1--onboard-into-collaborative-ads). To start this process, click **Become a Retail Partner** in the [Collaborative Ads Retailer Directory](https://www.facebook.com/collaborative_ads/retailer_directory/).
* Own the following assets:
    * Your marketplace [Business Manager](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads#business-manager) — If you don't have one, see the [Create a Business Manager](https://www.facebook.com/business/help/1710077379203657) to learn how to create it.
    * A registered Meta app — This is used to interact with the Marketing API, which the Managed Partner Ads API is built upon.
        * Your app must have the `business_management` and `ads_management` permissions.
        * Ensure your app has [Marketing API Access Tier](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization) for higher rate limiting.
        * Pass the [App Review](https://developers.facebook.com/docs/app-review) process.
    * A marketplace access token (user token) — Follow the instructions found in [Add Systems Users to Your Business Manager](https://www.facebook.com/business/help/503306463479099?id=2190812977867143) to generate the token.
    * At least 20,000 unique sellers in your catalog with each seller having a unique ID (Vendor ID) associated with them.

**Warning:** Each seller must have a unique ID associated with them. This is referred to as the Vendor ID and is used to automatically create a Catalog Segment when onboarding a seller.

## Step 2: Integration

You are now ready to start integrating your platform with the Managed Partner Ads APIs.

In order to create a Minimum Viable Product (MVP) for your sellers, the following 4 modules will need to be built or setup:

- **[Build] Seller Onboarding** — This is a process that you as a marketplace will create in order to allow sellers to sign-up for the service you provide using Managed Partner Ads. During your pilot phase of testing Managed Partner Ads, you may utilise our **seller onboarding tool** in order to quickly assess the performance of using Managed Partner Ads. This should be a temporary process and you should be creating your own process once you are ready to start offering Managed Partner Ads to your sellers. *Please contact your Meta representative for access to this tool.*

- **[Setup] Default Template for campaigns** — This is a standard template that you create for all your sellers to run campaigns. This can be created in the Collaboration Center and must be set up before any sellers can run a campaign. The template will use Catalog Sales as the objective with two ad sets (prospecting and retargeting) using the carousel format. The following parameters can be configured:

- Budget allocation

- Ad creative primary text

- URL

Both default templates and custom templates are supported. More information can be found in the [Types of Templates](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/reference#types-of-template) section.

- **[Build] Seller Ad Campaigns** — This is a custom interface you provide your sellers in order to create, manage and display reports for campaigns. See the API section under [Partner Ads Management](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/mpa-ads) to understand how to build this.

- **[Build] Billing** — This should be integrated with your own existing billing infrastructure and should be provided as part of the Managed Partner Ads service and allow sellers to view/manage their finances with respect to the campaigns being run. Meta will send an invoice to the marketplace every billing cycle for payment settlement between Meta and the marketplace. The default invoice setting is 1 invoice to 1 seller.

To consolidate invoices, you can [create an invoice group](https://www.facebook.com/business/help/545451859299492?id=2356205651275420) and add ad accounts into the group up to 3 days before the invoice is sent. This can be achieved using our [Business Management API](https://developers.facebook.com/docs/marketing-api/2tier-bm-solution/guides/invoice-group) to manage invoice groups (add/update/delete).

Marketplaces are expected to provide services to sellers using a dedicated, self-contained and built platform that utilises the Managed Partner Ads APIs.  This allows the marketplace to control and manage all aspects of the seller ads ecosystem, even though the ads appear offsite on Meta.

### APIs overview and UI mock

#### Marketplace Managed Partner Ads API Overview
**Note:** The **Marketplace (parent)** access token must be used to make the following calls

#### Seller Managed Partner Ads API Overview
**Note:** The **seller (child)** access token must be used to make the following calls

#### Seller onboarding and lookup

To onboard and search for existing sellers, use the [Seller Eligibility API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/eligibility), [Lookup Seller Business API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/reference#lookup-seller-business), [Seller Business Creation API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/onboarding) and [Seller Business Configuration API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/reference#update-seller-business-configuration-api).

An example flow chart of the seller onboarding and lookup flow:

In addition, you will also be using other Meta Graph APIs for campaign management and invoicing. For full technical details on our APIs, please refer to the [Managed Partner Ads API Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/reference).

### Example: User Interfaces for Sellers

As a marketplace, you are expected to use the Managed Partner Ads APIs to create an interface for your sellers to engage with as part of your service offering. The below mockups are some examples and for illustration purposes ONLY.

- **Seller registration** — This is where the seller will express interest in onboarding onto Managed Partner Ads. Please note, the Facebook page URL refers to the Seller's Identity Page and is compulsory for integrity check purposes.

- **Ad creation** — A custom interface built by the marketplace using the Managed Partner Ads APIs to allow sellers to run Meta ad campaigns.

- **Ad update** — Modify existing ad campaigns.

- **Ad performance viewing** — Review performance of ad campaigns.

### Managed Sellers Dashboard

As a marketplace, you can access a list of your managed sellers to view details of the campaigns you are running on their behalf by going to **Business Manager** > **Collaboration Center** > **Partnerships** > **Managed partners**. This will allow you to:

* View a dashboard of all managed sellers, including business information.
* See an overview of campaign delivery, credit, catalog segment, ad account, page and business account issues.

If you have use cases in addition to the ones in the Collaboration Center, you may want to consider developing an internal admin portal for your business operations team.

## Step 3: Launch

**Warning:** Before launching, please ensure that your Meta app has passed our [App Review](https://developers.facebook.com/docs/app-review) process.

You are now all set to launch your Managed Partner Ads solution. You may consider rolling it out to **eligible sellers** in batches and devise communication plans accordingly.

* Ensure eligible sellers are aware of the Managed Partner Ads solution.
* Provide a channel to receive feedback on the seller interface, including any feature requests and bug reports.
* Monitor seller activity on Collaboration Center through Seller Dashboard or build your own monitoring tool for your own needs using Marketing API.
* Keep track of your sellers' campaign performance, build automated systems to detect problems and make changes for further optimization of delivery and performance.
* Test different creatives, targeting and optimization options, understand what works/what does not for which seller.

When your solution starts delivering value and can scale, start rolling it out to more sellers gradually, promote it in different channels and scale the number of sellers in your platform and their overall investment through Managed Partner Ads.
