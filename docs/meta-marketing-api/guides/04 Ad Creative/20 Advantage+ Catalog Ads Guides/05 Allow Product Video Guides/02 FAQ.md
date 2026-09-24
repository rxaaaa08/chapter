<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video/faq | Saved: 2026-09-19 -->

# Allow product video and product-level video FAQ



## General

**What are Product-Level Videos? **

Product-Level Videos revolutionize Advantage+ catalog ads by introducing media type liquidity (video or image). It enables advertisers to integrate video assets directly into their catalog at the product level. Leveraging the power of automation and product ranking, Product-Level Videos ensure the delivery of not only the most relevant products but also the highest-performing creative assets to targeted users across various placements.

Product-level videos are officially featured as **Allow product video** within Ads Manager. It folds under the **Advantage+ creative for catalog** interface in level 1.

**How do Product-Level Videos work? **

Advertisers will need to source video files (MP4 format is recommended but nearly all types of video files are supported) that can be appended to individual product IDs within their catalog.

Some examples of video sources the team has seen advertisers use include:

* PDP videos from the brand's owned eCommerce website
* Videos leveraging their preferred 3rd-party MBP (i.e., Smartly, Shakr)
* UGC style/Creator Lofi videos featuring individual products
* Produced high fidelity videos highlighting hero products

Once the videos have been sourced, the files will need to be uploaded to an online repository (which should be open and accessible to Meta servers without authentication) so that each SKU/product ID has an accompanying URL (Up to 20 URLs is supported per product/SKU). Advertisers then upload URLs to the Meta Commerce catalog, and Meta will download and store the video files for integrity review.

Advertisers can then set up campaigns as they would a BAU Advantage+ catalog ads campaign either through the manual flow, Advantage+ shopping campaigns flow, or Advantage+ app campaigns flow promoting the product set containing the video URLs, and opting-in **Allow product video** to using videos.

**Do I need to upload a video for each product in a catalog?**

No. Product-Level Videos are designed to enhance your existing Advantage+ catalog ads campaigns. A recommended starting point is targeting 30% video impressions and adjusting based on performance data. Alternatively, advertisers can curate a  product set with 100% video coverage and create a separate ad set using this product set.

| Product Set Size | Videos Coverage to get 30% Impression<br>(Recommended) | Videos Coverage to get 50% Impression |
| --- | --- | --- |
| 1 - 100 | 20%, 10 - 20 products w/ videos | 40%, 10 - 40 products w/ videos |
| 101 - 500 | 12%, 12 - 60 products w/ videos | 17%, 20 - 80 products w/ videos |
| 501 - 2,000 | 6%, 30 - 120 products w/ videos | 12%, 60 - 240 products w/ videos |
| 2,001 - 10,000 | 2%, 40 - 200 products w/ videos | 5%, 100 - 500 products w/ videos |
| 10,001 - 50,000 | 1%, 100 - 500 products w/ videos | 2%, 200 - 1000 products w/ videos |
| 50,000+ | < 1%, 500 products w/ videos | 1%, 1000 products w/ videos |

**Is it mandatory to have multiple videos per product?**

Absolutely not. If you have one video per product, our system will use the video attached to the ranked product in ads delivery.

## Product Catalog and Product Feed

**How do I format my feed file to accept videos?**

The column header to provide videos is `video[0].url`, with additional video columns being named `video[1].url`, `video[2].url`, etc. Please review the [Allow product video page](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video#add-videos-with-the-catalog-feed-file) for more information.

**Are there continuous updates to the feed available via Batch API?**

Yes, [Batch API](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/manage-catalog-items/catalog-batch-api) support is available.

**How often can videos be refreshed?**

There is no specific guidance on this. For more frequent updates (i.e, less than 1 hour), use the [Batch API](https://developers.facebook.com/documentation/ads-commerce/catalog/guides/manage-catalog-items/catalog-batch-api).

**How many videos can I add for a single product item?**

20 URLs are allowed per product item.

**What is the review process for Product-Level Videos?**

Meta starts downloading the video and initiating review only when an item has a Meta Pixel fire/app event or is pulled in for ad recommendation of a Product-Level Video ad.

**Are supplementary feeds required for running Product-Level Videos?**

Supplementary feeds are just one of the ways to provide Product-Level Videos. Videos can also be uploaded using primary feeds.

**When used, does every product item in a supplementary feed need to be present in a primary feed?**

A supplementary feed does not need to have the same columns as the primary feed, they are allowed to only have ID and video columns (e.g., `video[0].url`, `video[1].url`, etc.). In the supplementary feed, you do NOT need to have the item IDs for which you don't want to add a video URL.

**Do we need to list all primary feed IDs for the supplementary feeds created in order for the supplementary feed to be properly connected?**

Yes, 1 supplementary feed can have many primary feeds attached to it (1-to-many). However, 1 primary feed can be attached to only 1 supplementary feed (1-to-1). But as long as the supplementary feed has matching products (product IDs/retailer IDs) across primary feeds, it will update the video metadata/product item across the primary feeds it's connected to.

**Once the videos are uploaded with supplementary feed, are they removed even if we replace feed update on the primary feed which doesn't have those videos?**

No. As long as the IDs in the supplementary feed match to product IDs in the primary feed, it wouldn’t affect videos uploaded via supplementary feed, even on replace.

**What are the various methods of uploading videos?**

Catalog feed file, Catalog Batch API, or manual upload via your Commerce Manager.

**How can I view the video_fetch_status?**

You can query a product item ID to see the `video_fetch_status` for that item. `Video_fetch_status` is very similar to `image_fetch_status`, and has the following values:

* `No_status` or `No_url`: No videos have been provided for the product item.
* `Not_fetched`: Video URLs have been ingested for this product item but first fetch has not been initiated yet.
* `Direct_upload`: Added through the Commerce Manager.
* `Fetched`: All videos fetched successfully.
* `Fetch_failed`: All videos were unsuccessful with fetch.
* `Outdated`:  When the video url of a previously fetched item is updated, we change the status of the item to `Outdated` and schedule it again for video re-fetch. The item can remain in the `Outdated` state, if the video fetch request fails for any reason.
* `Partial_fetch`: Some videos were fetched successfully, some were not.

**How can I review my catalog for video-related errors?**

You can use the [Product Diagnostics API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/product-catalog/diagnostics) by querying the `/{catalog-id}/diagnostics` endpoint to see errors and warnings for your catalog, including catalog product video-related problems. The possible video-related responses for your catalog product items are:

* `VIDEO_NOT_DOWNLOADABLE`: Video link doesn’t point to a video. Your video link may not actually lead to a video file but rather to a video player. Ways to check that your link points to a video:
    * Open the video link in a browser to find out whether it prompts a file download.
    * Ensure the video link has one of the following supported file extensions: .3g2, .3gp, .3gpp, .asf, .avi, .dat, .divx, .dv, .f4v, .flv, .gif, .m2ts, .m4v, .mkv, .mod, .mov, .mp4, .mpe, .mpeg, .mpeg4, .mpg, .mts, .nsv, .ogm, .ogv, .qt, .tod, .ts, .vob or .wmv.
* `VIDEO_FETCH_FAILED_LINK_BROKEN`: Video could not be found. Your video link may be broken. Check whether your video link works by opening it in a browser. Possible solutions:
    * Ensure the video link begins with http:// or https:// and actually leads to a video file.
    * Avoid putting spaces in your video link, as spaces are not supported. If the video link contains spaces, either remove them or make sure that spaces are encoded (replaced with “%20”).
* `VIDEO_FETCH_FAILED_BAD_GATEWAY`: There may be an issue with your video hosting site. The website server that you’re using to host your video may be experiencing issues or may be temporarily unavailable. Check whether your website server is working properly and accepting requests from Meta. If your server is unavailable, it may not be possible to access and download your video.
* `VIDEO_FETCH_FAILED_FILE_SIZE_EXCEEDED`: Your video file size exceeds 200 MB. Try the following solutions to reduce the file size.
    * Shorten the video, resave and reupload.
    * Lower the video quality, resave and reupload.
* `VIDEO_FETCH_FAILED_FORBIDDEN`: Meta may be blocked from accessing the video. Learn how to check whether your website is blocking Meta. Possible solutions:
    * Check whether your website server is using a firewall or protection service, such as Cloudflare or Cloudfront. If so, add the facebookcatalog/1.0 user agent to your website’s allow list.
    * Check whether the video file is password protected, blocking the download. Test the video link into your browser to see whether a popup appears, requesting a username and password. If so, remove the password protection from the video file.
* `VIDEO_FETCH_FAILED_TIMED_OUT`: Video download timed out. The website server that you’re using to host your video may have taken too long to complete the request. Try the following solutions to increase the video download speed:
    * Reduce your video file size, resave and reupload.
    * Increase your server’s download rate.
    * Check whether the server is working on other requests from Meta. If so, consider canceling other requests and try again.
* `VIDEO_FETCH_FAILED`: Video fetch failed. Make sure to avoid common link issues: Check that the link points to your video. Begin the link with “http://” or “https://”. Replace any spaces in the link with “%20”. Once you edit the link, we’ll try to download the video again.

## Ads Management

**How can I run Product-Level Video ads via API? **

See the [Allow product video page](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video#create-ads-with-product-video) for more information.

**How can I preview Product-Level Video ads via API? **

Use the Graph API Preview endpoint, set the `ad_format` parameters as

* `MOBILE_FEED_STANDARD`
* `INSTAGRAM_STANDARD`

**Can Product-Level Video work with Advantage+ shopping campaigns?**

Yes, Product-Level Video works well with Advantage+ shopping campaigns ads. There is no additional configuration needed for enabling Product-Level Video for Advantage+ shopping campaigns.

**Do ad previews work for collection/carousel formats with Product-Level Videos?**

Yes, ad previews are supported with these formats.

**Which ad creative formats are supported by Product-Level Videos?**

Carousel and collection formats are now supported, as is single video. Please see the [Allow product video page](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video#create-ads-with-product-video) for more information.

**How do Instant Experiences work  for Collection Ads?**

If you use "Dynamic Video" as the hero media, we will replace that with a product video instead. However, there are no changes to Instant Experiences. Instant Experiences still have full control over product sets.

**How will Product-Level Videos determine whether to deliver a static image or video to users?**

Ads with **Allow product video** enabled will show whichever is more performant between a static image and video. Single video format will prioritize showing video to all users.

**Will delivery be prioritized for products/SKUs that have a Product-Level Video?**

For ads with **Allow product video** enabled, the ranking algorithm will continue to rank the products to achieve the campaign goals (e.g., conversions/ROAS maximization, etc.). It would not prioritize showing video creatives over the primary campaign goal. Single video format will prioritize showing video to all users.

**What is the preferred aspect ratio for different ad formats with allow product video enabled on different placements?**

Ads with allow product video enabled give preference to videos with certain aspect ratios to improve ad performance. If there is not a video with the preferred aspect ratio, the default (first) video is used.

|  | Single Media | Carousel | Collection |
| --- | --- | --- | --- |
| FB Mobile Feed | 4:5 | 1:1 | 4:5 |
| FB Desktop Feed | 1:1 | 1:1 | N/A |
| IG Feed | 4:5 | 4:5 | N/A |
| IG Stories | 9:16 | 9:16 | N/A |
| FB Stories | 9:16 | 9:16 | N/A |
| FB Video Feed | 4:5 | N/A | N/A |
| IG Explore | 4:5 | 4:5 | N/A |
| FB Marketplace | N/A | N/A | N/A |
| IG Reels | 9:16 | 9:16 | N/A |
| FB Reels | 9:16 | 9:16 | N/A |
| FB right column | N/A | N/A | N/A |
| FB search results | N/A | N/A | N/A |

﹡ Different placements often run specific creative tests. This table is subject to change.

**If I provided multiple videos for a product, how does the ad with allow product video enabled decide which video to use?**

### Using `preferred_video_tags`

* The ad will surface the first video with the tag that performs best with the placement.  
**Example:** A 9:16 video with the specified tag will take priority in Reels placements.
* If there is no video that matches the preferred ratio for the placement, the first video with the preferred tag will be selected.
* If there is no video with the selected tag, the default (first) video will surface. The ad will continue to surface for the best video for the placement.  
**Example:** A 1:1 video without the tag will surface for Facebook Feed placements, and a 9:16 video (if available) will surface for Reels placements.

### Without `preferred_video_tags`

* The ad will surface the first video that performs best with the placement.  
**Example:** If available, a 9:16 video will take priority in Reels placements.
* Similarly, a 4:5 video will take priority if the format is single_media and the placement is Facebook Feed. If a 9:16 video is not available, the default (first) video will surface for Reels placements.  

## Reporting

**In the reports, is it possible to confirm the distribution between images and videos that have been delivered?**

These breakdowns are not available yet, but may be available in the future.

