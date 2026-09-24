<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/faq | Saved: 2026-09-19 -->

# Advantage+ Catalog Ads FAQ



The [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads) solution allows you to automatically promote relevant products from an entire catalog across any device using pixel and app events to build up audiences of people to target. This document lists the frequently asked questions about Advantage+ catalog ads.

## Product Catalog and Product Feed

#### Q: What are the current product limits on catalog size?
__A:__ We recommend breaking larger feeds into smaller ones for faster, parallel upload:

* We currently recommend under 5 million products per feed through the file upload method.
* Limit of 100 MB per feed file via Business Manager.

#### Q: What file formats do you accept?
* File formats accepted are XML and tab delimited CSV, TXT or TSV. [Learn more](https://developers.facebook.com/docs/marketing-api/catalog-setup/catalog-feed-setup#feed-format)
* We also accept files that are compressed: zip, gzip and bz2.

#### Q: My feed is taking too long to upload

* Ensure that there are no network connectivity issues.
* Ensure that your product feed follows the restrictions specified above. [Learn more](https://developers.facebook.com/docs/marketing-api/catalog-setup/catalog-feed-setup#da-commerce)
* To speed up feed upload process, use a compressed feed file. We support zip, gzip and bz2 compression formats.

#### Q: How do I get Google Merchant Center feed to dynamic ads?

* Google Merchant Center feeds can be uploaded directly for dynamic ads.
* Go to the "link" column to make sure it doesn't have Google tracking parameters on it. The parameters may look like this: `URL?utm_campaign=GoogleDynRMKT&utm_medium=display`.

**Note**: To reuse a data feed file from another inventory platform, such as Google or Amazon, Facebook's requirements may be different. Check that your data feed is a CSV, TSV, or XML (RSS/ATOM) file, and has the required columns in our specifications.
[Learn more](https://developers.facebook.com/docs/marketing-api/catalog-setup/catalog-feed-setup)

#### Q: How do I troubleshoot my feed upload errors?

* Verify the [upload errors](https://developers.facebook.com/docs/marketing-api/reference/product-feed-upload/errors). Products with fatal errors are not uploaded; the rest are uploaded.
* Verify the `product_count` in the product catalog after the feed upload has finished. Instructions [here](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog#Reading)
* The first line in the field is expected to contain the name of the fields.
* Use the correct delimiter in your feed file. Supported delimiters are TAB (default), PIPE, or TILDE. Ensure the delimiter you use during the upload is the same delimiter as in the feed file.
* Check the **Use quoted fields** option if your feed contains quoted fields.

#### Q: How do I stop a product from running when it is out of stock?
__A:__ When products go out of stock, you need to mark it as "out of stock" in your product catalog. Products marked "out of stock" automatically stop serving. Scheduling and fetching the product catalog frequently helps you maintain your stock information easily. See the `availability` field in [Supported Fields](https://developers.facebook.com/docs/marketing-api/catalog-setup/catalog-feed-setup#da-commerce).

#### Q: I'm unable to choose or see a product catalog that my team uploaded.
__A:__ Go to **Business Manager** and make sure the user/account has **Product Catalog Admin** permissions.

## Meta Pixel Setup and Audiences

#### Q: My pixel is not setup correctly.
__A:__ Using Meta Pixel to track external events on your product pages and build [product audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/dynamic-product-audiences):

* Place one of the [standard events](https://developers.facebook.com/docs/marketing-api/facebook-pixel#standardevents) on select pages of your website with standard parameters.
* Ensure the pixel is associated correctly with your product catalog. More details [here](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/product-audiences/v2.5#associate).

#### Q: How do I map Meta Pixel to my Product Catalog?
__A:__ Advantage+ catalog ads require Meta Pixel or App Events to report which products are being viewed, added to cart, and then purchased on your website or app. The product ID reported by Meta Pixel(or app events) must EXACTLY match the ID column of the corresponding product in your product feed.

#### Q: What are allowed values for `content_type` when setting up the pixel?
__A:__ The valid values for `content_type` are `product` or `product_group`. It's important that the `content_type` matches the type of ID(s) included in the `content_ids` parameter. For example, if `content_type` is `product_group`, the product group ID(s) need to be provided in `content_ids`.

#### Q: Why is my audience size zero?
__A:__ There could be couple of reason why the audience size is zero (0). To ensure the audience is setup correctly, follow [these instructions](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/dynamic-product-audiences) and these guidelines:

* Ensure the inclusion and exclusion rules do not conflict one another.
* Ensure that the product set ID belongs to the product catalog for which the Meta Pixel is created.
* For websites with poor traffic, they should try and keep the retention higher to collect an audience; ads don't deliver if the audience size is less than 20.

## Ads Management

#### Q: What is the objective I need to set up for Advantage+ catalog ads campaigns?
__A:__ We recommend to use the `PRODUCT_CATALOG_SALES` objective for Advantage+ catalog ads campaigns.

#### Q: How do I promote products in a particular ad set?
__A:__ While creating an ad set use the `promoted_object` field to add a product set ID, which  indicates all ads under this ad set will promote products in the specified product set.

#### Q: Any tools that can help debugging?

* Install the [Meta Pixel Helper](https://developers.facebook.com/docs/facebook-pixel/pixel-helper). This tool can help you quickly identify issues with the pixel isn't firing.
* [Advantage+ catalog ads Debugging Tools](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/debugging-tools) describes the available tools to use to debug issues with Advantage+ catalog ads.

## Learn More

* [Catalogs, Ads Help Center](https://www.facebook.com/business/help/890714097648074)
* [Advantage+ catalog ads, Ads Help Center](https://www.facebook.com/business/help/397103717129942)
* [Create a Dynamic Ad, Ads Help Center](https://www.facebook.com/business/help/1132465490107046)
* [Catalog Setup, Marketing API](https://developers.facebook.com/documentation/ads-commerce/catalog)
