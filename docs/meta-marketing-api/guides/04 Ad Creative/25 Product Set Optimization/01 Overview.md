<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/product-set-optimization/product-set-optimization-overview | Saved: 2026-09-19 -->

# Product set optimization



**Warning:** **Beta:** Access to this product is currently limited. Confirm with your Meta sales representative that your business has been granted the necessary access to begin onboarding.

## Overview

Product set optimization is an enhancement for existing Advantage+ catalog and static ads that gives Retail Media Networks more control to fine-tune performance for specific brands and product groups within their catalog.

Rather than optimizing across an entire catalog, product set optimization lets Retail Media Networks target specific product sets and pool smaller budgets for increased liquidity and performance.

Product set optimization is compatible with Meta's omnichannel optimization, a key driver of value for Retail Media Networks to drive in-store and online sales using one campaign.

## Prerequisites

### Access requirements

Access to this beta product is currently limited. Confirm with your Meta sales representative that your business has been granted the necessary access to begin onboarding. The following will be necessary:
- Business Manager ID
- App ID
- Ad Account ID
- Catalog ID

### Catalog health

To ensure optimal setup, your catalog match rates, which reflect the correspondence between website events and catalog products, should ideally be above 90%, with 70% as the minimum accepted rate.

- Check your current match rates using [How to view catalog match rate for Advantage+ catalog ads](https://www.facebook.com/business/help/946671458738854?id=1913105122334058).
- Review the [best practices guidelines](https://developers.facebook.com/documentation/ads-commerce/catalog/best-practices) for comprehensive catalog setup guidance.

### Meta developer app

Make sure you have a [Meta app](https://developers.facebook.com/apps/) linked to your Business Manager. See [Add an app to your business portfolio in Meta Business Suite](https://www.facebook.com/business/help/2199735813629697?id=420299598837059) for more information.

#### Permissions

Your developer app should have the following permissions in [advanced access](https://developers.facebook.com/docs/graph-api/overview/access-levels#advanced-access) and should be live and not in development mode:

- `ads_management`
- `ads_read`
- `business_management`
- `catalog_management`

#### Access tokens

To make Marketing API calls, you need an access token. For product set optimization, use a [system user](https://developers.facebook.com/docs/business-management-apis/system-users) access token, which does not expire and is ideal for server-to-server integrations.

Ensure your system user has access to the following assets:

- Ad account — containing the product set optimization ad campaigns
- Catalog — used for product set optimization
- Facebook Page — used for product set optimization
- Meta developer app — used to access the API

For detailed instructions on generating and managing access tokens, see:

- [Authentication](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authentication) — Overview of access token types for the Marketing API
- [System Users](https://developers.facebook.com/docs/business-management-apis/system-users) — Creating system users and generating system user access tokens
- [Long-Lived Access Tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens/get-long-lived) — Extending short-lived tokens
- [Access Tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens) — General reference for all access token types

### Page shared with the Retail Media Network Business Manager

You must share the Page used in the product set optimization ad campaigns with the Retail Media Network. To do this, go to **Settings** > **Accounts** > **Pages** in Meta Business Suite, select your Page, and click **Assign partner**. Enter the partner's Business Portfolio ID, enable the **Ads** permission, and click **Assign**.

### Product sets

A product set is a subset of products within a product catalog, defined by filter rules. Product sets are used to target specific groups of products within Advantage+ catalog ads, Shops collections, and other catalog-powered surfaces.

| Operation | Endpoint | Payload example |
|-----------|----------|-----------------|
| Create a new product set | `POST /{product-catalog-id}/product_sets` | `name=<NAME>&filter={'brand': {'i_contains': 'nike'}}` |
| Read a product set | `GET /{product-catalog-id}/product_sets` | - |
| Update a product set | `POST /{product-set-id}` | `name=<UPDATED_NAME>&filter={'product_type': {'contains': 'shirt'}}` |
| Delete a product set | `DELETE /{product-set-id}` | - |

See [Filter Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/product_sets#filter-rules) for more information.
