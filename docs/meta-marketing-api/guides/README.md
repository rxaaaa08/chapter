# Marketing API — Developer Docs (offline copy)

Saved 2026-09-19 from <https://developers.facebook.com/documentation/ads-commerce/marketing-api>, using Meta's own "View as Markdown" version of each page wherever Meta offers one. **300 pages.** Folders 01–13 follow the Marketing API sidebar; folder 14 holds Marketing API pages linked from the docs but missing from the sidebar. The first line of each file names the page it came from.

**The API Reference (Ad Account, Campaign, Ad Set, Ad, Creative, Insights fields…) is in its own folder: `~/Downloads/API Reference Docs`**, organized like Meta's *Resources ▸ API Reference* sidebar.

## Notes on this copy

- **How each page was obtained** (tag after each link): no tag = Meta's own markdown export · *converted* = Meta's export errors for this page, so it was converted from the web page · *old docs site* = the page hasn't moved to Meta's new docs site yet, so it came from the older site · *captured in Chrome* = Meta only builds this page inside a browser.
- **Escaped characters were decoded.** Meta's markdown export escapes quotes, apostrophes and `<br>` once too often (e.g. `fbq(&#039;track&#039;)`). Each file was decoded once, which makes it match Meta's own "View as Markdown" view character for character.
- **Lead Ads ▸ Quality Features** only loads inside a browser, so it was captured from Chrome, together with its two sub-pages (Phone OTP and Work Email Validation) that the sidebar doesn't list.
- **Links to other Meta products were not followed**: Business Management APIs (system users), Catalog, Graph API. The Meta Pixel and Conversions API docs have their own folders in Downloads.
- **Dead links on Meta's side (18):** listed at the bottom. They lead to pages that don't exist on Meta's site (checked in the terminal, and a sample in Chrome).

## Index

* [Marketing API Overview](01%20Marketing%20API%20Overview.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api)
* **About Marketing API/**
  * [How it works](02%20About%20Marketing%20API/01%20How%20it%20works.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview)
  * [Versioning](02%20About%20Marketing%20API/02%20Versioning.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/versioning)
  * [Rate Limiting](02%20About%20Marketing%20API/03%20Rate%20Limiting.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/rate-limiting)
  * [Data Processing Options](02%20About%20Marketing%20API/04%20Data%20Processing%20Options.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/data-processing-options)
* **Get Started with Marketing API/**
  * [Get Started](03%20Get%20Started%20with%20Marketing%20API/01%20Get%20Started.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started)
  * [Authorization](03%20Get%20Started%20with%20Marketing%20API/02%20Authorization.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization)
  * [Authentication](03%20Get%20Started%20with%20Marketing%20API/03%20Authentication.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authentication)
  * **Ad Creation Guides/**
    * [Basic Ad Creation](03%20Get%20Started%20with%20Marketing%20API/04%20Ad%20Creation%20Guides/01%20Basic%20Ad%20Creation.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation)
    * [Create an Ad Campaign](03%20Get%20Started%20with%20Marketing%20API/04%20Ad%20Creation%20Guides/02%20Create%20an%20Ad%20Campaign.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-campaign)
    * [Create an Ad Set](03%20Get%20Started%20with%20Marketing%20API/04%20Ad%20Creation%20Guides/03%20Create%20an%20Ad%20Set.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-set)
    * [Create an Ad Creative](03%20Get%20Started%20with%20Marketing%20API/04%20Ad%20Creation%20Guides/04%20Create%20an%20Ad%20Creative.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative)
    * [Create an Ad](03%20Get%20Started%20with%20Marketing%20API/04%20Ad%20Creation%20Guides/05%20Create%20an%20Ad.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad)
  * [Manage Campaigns](03%20Get%20Started%20with%20Marketing%20API/05%20Manage%20Campaigns.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/manage-campaigns)
  * **Ad Performance & Optimization/**
    * [Optimization Basics](03%20Get%20Started%20with%20Marketing%20API/06%20Ad%20Performance%20%26%20Optimization/01%20Optimization%20Basics.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/ad-optimization-basics)
    * [Monitoring and Analytics](03%20Get%20Started%20with%20Marketing%20API/06%20Ad%20Performance%20%26%20Optimization/02%20Monitoring%20and%20Analytics.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/ad-optimization-basics/monitoring-and-analytics)
    * [Optimization Tips](03%20Get%20Started%20with%20Marketing%20API/06%20Ad%20Performance%20%26%20Optimization/03%20Optimization%20Tips.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/ad-optimization-basics/optimization-tips)
* **Ad Creative/**
  * [Introduction to Ad Creatives](04%20Ad%20Creative/01%20Introduction%20to%20Ad%20Creatives.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative)
  * **Video & Carousel Ads/**
    * [Video & Carousel](04%20Ad%20Creative/02%20Video%20%26%20Carousel%20Ads/01%20Video%20%26%20Carousel.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads)
    * [FB Video Ads](04%20Ad%20Creative/02%20Video%20%26%20Carousel%20Ads/02%20FB%20Video%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads/fbvideoads)
  * [Instant Experiences](04%20Ad%20Creative/03%20Instant%20Experiences.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instant-experiences)
  * [Collection Ads](04%20Ad%20Creative/04%20Collection%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/collection-ads)
  * [App Ads](04%20Ad%20Creative/05%20App%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-app-ads)
  * **Lead Ads Guides/**
    * [Lead Ads](04%20Ad%20Creative/06%20Lead%20Ads%20Guides/01%20Lead%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads)
    * [Creating](04%20Ad%20Creative/06%20Lead%20Ads%20Guides/02%20Creating.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/create)
    * **Quality Features/**
      * [Enable Quality Features](04%20Ad%20Creative/06%20Lead%20Ads%20Guides/03%20Quality%20Features/01%20Enable%20Quality%20Features.md) *(captured in Chrome)*
      * [Phone One-Time Passcode Verification](04%20Ad%20Creative/06%20Lead%20Ads%20Guides/03%20Quality%20Features/02%20Phone%20One-Time%20Passcode%20Verification.md) *(captured in Chrome)*
      * [Work Email Validation](04%20Ad%20Creative/06%20Lead%20Ads%20Guides/03%20Quality%20Features/03%20Work%20Email%20Validation.md) *(captured in Chrome)*
    * [Retrieving](04%20Ad%20Creative/06%20Lead%20Ads%20Guides/04%20Retrieving.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/retrieving)
    * [Testing and Troubleshooting](04%20Ad%20Creative/06%20Lead%20Ads%20Guides/05%20Testing%20and%20Troubleshooting.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/testing-troubleshooting)
    * [Advantage+ Catalog Ads for Leadgen](04%20Ad%20Creative/06%20Lead%20Ads%20Guides/06%20Advantage%2B%20Catalog%20Ads%20for%20Leadgen.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads-for-leadgen)
    * [CRM Integration](04%20Ad%20Creative/06%20Lead%20Ads%20Guides/07%20CRM%20Integration.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/quickstart/webhooks-integration)
  * **Instagram Ads Guides/**
    * [Instagram Ads API](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/01%20Instagram%20Ads%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instagramads)
    * [Get Started](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/02%20Get%20Started.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instagramads/get-started)
    * **Setup & Management/**
      * [Customizations](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/01%20Customizations.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides)
      * [Set Up Instagram Accounts On Business Manager](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/02%20Set%20Up%20Instagram%20Accounts%20On%20Business%20Manager.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/ig-accounts-with-business-manager)
      * [Set Up Instagram Accounts With Pages](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/03%20Set%20Up%20Instagram%20Accounts%20With%20Pages.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/pages-ig-account)
      * [Ads With Mixed Placements](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/04%20Ads%20With%20Mixed%20Placements.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/mixed-placements-ads)
      * [Add Call-To-Action](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/05%20Add%20Call-To-Action.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/call-to-action)
      * [Get Ad Preview](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/06%20Get%20Ad%20Preview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/get-ad-preview)
      * [Get Ad Insights](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/07%20Get%20Ad%20Insights.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/get-ad-insights)
      * [Use Posts as Instagram Ads](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/08%20Use%20Posts%20as%20Instagram%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/use-posts-as-ads)
      * [Instagram Advantage+ Catalog Ads](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/09%20Instagram%20Advantage%2B%20Catalog%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/advantage-catalog-ads)
      * [Carousel Ads](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/10%20Carousel%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/carousel-ads)
      * [Reminder Ads](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/11%20Reminder%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/marketing-api/guides/reminder-ads)
      * [Post Moderation](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/12%20Post%20Moderation.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/post-moderation)
      * [Use URL Tags for Tracking](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/13%20Use%20URL%20Tags%20for%20Tracking.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/url-tags-for-tracking)
      * [Customize Stories](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/14%20Customize%20Stories.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/customize-stories)
      * [Add Interactive Elements](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/03%20Setup%20%26%20Management/15%20Add%20Interactive%20Elements.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/add-interactive-elements)
    * **Requirements/**
      * [Requirement Guides](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/04%20Requirements/01%20Requirement%20Guides.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/requirements)
      * [Media Requirements](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/04%20Requirements/02%20Media%20Requirements.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/reference/media-requirements)
      * [Data and Call To Action Requirements](04%20Ad%20Creative/07%20Instagram%20Ads%20Guides/04%20Requirements/03%20Data%20and%20Call%20To%20Action%20Requirements.md) — [original](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/reference/data-cta-requirements)
  * **Threads Ads Guides/**
    * [Threads Ads](04%20Ad%20Creative/08%20Threads%20Ads%20Guides/01%20Threads%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads)
    * **Get Started/**
      * [Threads Ads Creation](04%20Ad%20Creative/08%20Threads%20Ads%20Guides/02%20Get%20Started/01%20Threads%20Ads%20Creation.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation)
      * [Carousel Ads](04%20Ad%20Creative/08%20Threads%20Ads%20Guides/02%20Get%20Started/02%20Carousel%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation/carousel-ads)
      * [Advantage+ Catalog Ads](04%20Ad%20Creative/08%20Threads%20Ads%20Guides/02%20Get%20Started/03%20Advantage%2B%20Catalog%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation/advantage-catalog-ads)
      * [App Ads](04%20Ad%20Creative/08%20Threads%20Ads%20Guides/02%20Get%20Started/04%20App%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation/app-ads)
      * [Use Posts as Ads](04%20Ad%20Creative/08%20Threads%20Ads%20Guides/02%20Get%20Started/05%20Use%20Posts%20as%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/creation/use-posts-as-ads)
    * [Reply Moderation](04%20Ad%20Creative/08%20Threads%20Ads%20Guides/03%20Reply%20Moderation.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/reply-moderation)
    * [Threads Ads Insights](04%20Ad%20Creative/08%20Threads%20Ads%20Guides/04%20Threads%20Ads%20Insights.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/threads-ads/insights)
  * **Messaging Ads Guides/**
    * [Messaging Ads](04%20Ad%20Creative/09%20Messaging%20Ads%20Guides/01%20Messaging%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads)
    * [Click to Messenger](04%20Ad%20Creative/09%20Messaging%20Ads%20Guides/02%20Click%20to%20Messenger.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-messenger)
    * [Click to Instagram](04%20Ad%20Creative/09%20Messaging%20Ads%20Guides/03%20Click%20to%20Instagram.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-instagram)
    * [Click to WhatsApp](04%20Ad%20Creative/09%20Messaging%20Ads%20Guides/04%20Click%20to%20WhatsApp.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-whatsapp)
    * [Multidestination](04%20Ad%20Creative/09%20Messaging%20Ads%20Guides/05%20Multidestination.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-multidestination)
    * [Website Ads Click to Message](04%20Ad%20Creative/09%20Messaging%20Ads%20Guides/06%20Website%20Ads%20Click%20to%20Message.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/website-ads-click-to-message)
  * **Ads in WhatsApp Status/**
    * [Overview](04%20Ad%20Creative/10%20Ads%20in%20WhatsApp%20Status/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)
    * [WhatsApp identity](04%20Ad%20Creative/10%20Ads%20in%20WhatsApp%20Status/02%20WhatsApp%20identity.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status/whatsapp-identity)
    * [People whose age is unknown](04%20Ad%20Creative/10%20Ads%20in%20WhatsApp%20Status/03%20People%20whose%20age%20is%20unknown.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status/user-age-unknown)
  * [Marketing Messages](04%20Ad%20Creative/11%20Marketing%20Messages.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-messages)
  * **Profile Visit Ads Guides/**
    * [Profile Visit Ads](04%20Ad%20Creative/12%20Profile%20Visit%20Ads%20Guides/01%20Profile%20Visit%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/profile-visit-ads)
    * [Instagram Profile Visit](04%20Ad%20Creative/12%20Profile%20Visit%20Ads%20Guides/02%20Instagram%20Profile%20Visit.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/profile-visit-ads/instagram-profile-visit)
    * [Facebook Page Visit](04%20Ad%20Creative/12%20Profile%20Visit%20Ads%20Guides/03%20Facebook%20Page%20Visit.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/profile-visit-ads/facebook-page-visit)
    * [Multidestination Profile Visit](04%20Ad%20Creative/12%20Profile%20Visit%20Ads%20Guides/04%20Multidestination%20Profile%20Visit.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/profile-visit-ads/multidestination-profile-visit)
  * [Multi-Media Ads](04%20Ad%20Creative/13%20Multi-Media%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/multi-media-ads)
  * **Partnership Ads/**
    * [Overview](04%20Ad%20Creative/14%20Partnership%20Ads/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads)
    * [Partnership Ads Advertisable Content API](04%20Ad%20Creative/14%20Partnership%20Ads/02%20Partnership%20Ads%20Advertisable%20Content%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/content-discovery-api)
    * **Partner Permissions/**
      * [Post-Level Permissioning](04%20Ad%20Creative/14%20Partnership%20Ads/03%20Partner%20Permissions/01%20Post-Level%20Permissioning.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/post-level-permissioning)
      * **Account-Level Permissioning/**
        * [Instagram](04%20Ad%20Creative/14%20Partnership%20Ads/03%20Partner%20Permissions/02%20Account-Level%20Permissioning/01%20Instagram.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/account-level-permissioning)
        * [Facebook](04%20Ad%20Creative/14%20Partnership%20Ads/03%20Partner%20Permissions/02%20Account-Level%20Permissioning/02%20Facebook.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/fb-account-level-permissioning)
    * **Partnership Ads Creation/**
      * [Overview](04%20Ad%20Creative/14%20Partnership%20Ads/04%20Partnership%20Ads%20Creation/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation)
      * **Instagram Partnership Ads/**
        * [Boost Existing Instagram Media as Partnership Ads](04%20Ad%20Creative/14%20Partnership%20Ads/04%20Partnership%20Ads%20Creation/02%20Instagram%20Partnership%20Ads/01%20Boost%20Existing%20Instagram%20Media%20as%20Partnership%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/boost-existing-post)
        * [Instagram Partnership Ads with a New Ad Creative](04%20Ad%20Creative/14%20Partnership%20Ads/04%20Partnership%20Ads%20Creation/02%20Instagram%20Partnership%20Ads/02%20Instagram%20Partnership%20Ads%20with%20a%20New%20Ad%20Creative.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/use-new-creative)
        * **Supported Partnership Ads Configurations/**
          * [Supported Configurations](04%20Ad%20Creative/14%20Partnership%20Ads/04%20Partnership%20Ads%20Creation/02%20Instagram%20Partnership%20Ads/03%20Supported%20Partnership%20Ads%20Configurations/01%20Supported%20Configurations.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/supported-configurations)
          * [Placement Asset Customization](04%20Ad%20Creative/14%20Partnership%20Ads/04%20Partnership%20Ads%20Creation/02%20Instagram%20Partnership%20Ads/03%20Supported%20Partnership%20Ads%20Configurations/02%20Placement%20Asset%20Customization.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/supported-configurations/placement-asset-customization)
          * [Advantage+ Creative](04%20Ad%20Creative/14%20Partnership%20Ads/04%20Partnership%20Ads%20Creation/02%20Instagram%20Partnership%20Ads/03%20Supported%20Partnership%20Ads%20Configurations/03%20Advantage%2B%20Creative.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/supported-configurations/advantage-creative)
          * [Click To Message Destinations](04%20Ad%20Creative/14%20Partnership%20Ads/04%20Partnership%20Ads%20Creation/02%20Instagram%20Partnership%20Ads/03%20Supported%20Partnership%20Ads%20Configurations/04%20Click%20To%20Message%20Destinations.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/supported-configurations/click-to-message-destinations)
          * [Advantage+ Catalog Ads](04%20Ad%20Creative/14%20Partnership%20Ads/04%20Partnership%20Ads%20Creation/02%20Instagram%20Partnership%20Ads/03%20Supported%20Partnership%20Ads%20Configurations/05%20Advantage%2B%20Catalog%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/supported-configurations/advantage-catalog-ads)
          * [Testimonial Ads](04%20Ad%20Creative/14%20Partnership%20Ads/04%20Partnership%20Ads%20Creation/02%20Instagram%20Partnership%20Ads/03%20Supported%20Partnership%20Ads%20Configurations/06%20Testimonial%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/supported-configurations/testimonial-ads)
          * [Lead Generation Ads](04%20Ad%20Creative/14%20Partnership%20Ads/04%20Partnership%20Ads%20Creation/02%20Instagram%20Partnership%20Ads/03%20Supported%20Partnership%20Ads%20Configurations/07%20Lead%20Generation%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/supported-configurations/lead-ads)
      * **Facebook Partnership Ads/**
        * [Boost Existing Facebook Posts as Partnership Ads](04%20Ad%20Creative/14%20Partnership%20Ads/04%20Partnership%20Ads%20Creation/03%20Facebook%20Partnership%20Ads/01%20Boost%20Existing%20Facebook%20Posts%20as%20Partnership%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/boost-existing-fb-post)
        * [Facebook Partnership Ads with a New Ad Creative](04%20Ad%20Creative/14%20Partnership%20Ads/04%20Partnership%20Ads%20Creation/03%20Facebook%20Partnership%20Ads/02%20Facebook%20Partnership%20Ads%20with%20a%20New%20Ad%20Creative.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation/new-fb-creative)
      * [Partnership Ad Codes](04%20Ad%20Creative/14%20Partnership%20Ads/04%20Partnership%20Ads%20Creation/04%20Partnership%20Ad%20Codes.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ad-codes)
    * **Branded Content/**
      * [Create Branded Content](04%20Ad%20Creative/14%20Partnership%20Ads/05%20Branded%20Content/01%20Create%20Branded%20Content.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/branded-content)
      * [Manage Branded Content Permissions](04%20Ad%20Creative/14%20Partnership%20Ads/05%20Branded%20Content/02%20Manage%20Branded%20Content%20Permissions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/branded-content-permissions)
  * [Event and Local Ads](04%20Ad%20Creative/15%20Event%20and%20Local%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/event-ads)
  * [Advantage+ Campaigns](04%20Ad%20Creative/16%20Advantage%2B%20Campaigns.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-campaigns)
  * **Advantage+ Shopping Campaign Guides/**
    * [Advantage+ Shopping Campaign API](04%20Ad%20Creative/17%20Advantage%2B%20Shopping%20Campaign%20Guides/01%20Advantage%2B%20Shopping%20Campaign%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-shopping-campaigns)
    * [Cross-Channel Conversion Optimization](04%20Ad%20Creative/17%20Advantage%2B%20Shopping%20Campaign%20Guides/02%20Cross-Channel%20Conversion%20Optimization.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-shopping-campaigns/cross-channel-conversion)
    * [Audience Type URL Parameters](04%20Ad%20Creative/17%20Advantage%2B%20Shopping%20Campaign%20Guides/03%20Audience%20Type%20URL%20Parameters.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-shopping-campaigns/audience-type-url-parameters)
  * [Shops Ads](04%20Ad%20Creative/18%20Shops%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/shops-ads)
  * **Asset Feed Spec Guides/**
    * [Asset Feed Spec](04%20Ad%20Creative/19%20Asset%20Feed%20Spec%20Guides/01%20Asset%20Feed%20Spec.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec)
    * [Asset Feed Options](04%20Ad%20Creative/19%20Asset%20Feed%20Spec%20Guides/02%20Asset%20Feed%20Options.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/options)
    * [Dynamic Creative](04%20Ad%20Creative/19%20Asset%20Feed%20Spec%20Guides/03%20Dynamic%20Creative.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/dynamic-creative)
    * **Customization Rules/**
      * [Asset Customization Rules](04%20Ad%20Creative/19%20Asset%20Feed%20Spec%20Guides/04%20Customization%20Rules/01%20Asset%20Customization%20Rules.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/asset-customization-rules)
      * [Placement Asset Customization](04%20Ad%20Creative/19%20Asset%20Feed%20Spec%20Guides/04%20Customization%20Rules/02%20Placement%20Asset%20Customization.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/dynamic-creative/placement-asset-customization)
      * [Multi-Language Ads](04%20Ad%20Creative/19%20Asset%20Feed%20Spec%20Guides/04%20Customization%20Rules/03%20Multi-Language%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/multi-language-ads)
    * [Insights](04%20Ad%20Creative/19%20Asset%20Feed%20Spec%20Guides/05%20Insights.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec/insights)
  * **Advantage+ Catalog Ads Guides/**
    * [Advantage+ Catalog Ads](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/01%20Advantage%2B%20Catalog%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads)
    * [Get Started](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/02%20Get%20Started.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/get-started)
    * [Advantage+ Catalog Ads Mobile](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/03%20Advantage%2B%20Catalog%20Ads%20Mobile.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/mobile-apps)
    * [Advantage+ App Campaigns](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/04%20Advantage%2B%20App%20Campaigns.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/advantage-app-campaigns)
    * **Allow Product Video Guides/**
      * [Allow product video](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/05%20Allow%20Product%20Video%20Guides/01%20Allow%20product%20video.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video)
      * [FAQ](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/05%20Allow%20Product%20Video%20Guides/02%20FAQ.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/allow-product-video/faq)
    * [Multi-Aspect Ratio Images](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/06%20Multi-Aspect%20Ratio%20Images.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/multi-ratio-images)
    * [Image Templates](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/07%20Image%20Templates.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/image-templates)
    * [Advantage+ Creative for Catalog](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/08%20Advantage%2B%20Creative%20for%20Catalog.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-creative-for-catalog)
    * **Real Estate Ads Guides/**
      * [Real Estate Ads](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/09%20Real%20Estate%20Ads%20Guides/01%20Real%20Estate%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads)
      * [Get Started](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/09%20Real%20Estate%20Ads%20Guides/02%20Get%20Started.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads/get-started)
      * **Audiences & Management/**
        * [Guides](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/09%20Real%20Estate%20Ads%20Guides/03%20Audiences%20%26%20Management/01%20Guides.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads/guides)
        * [Build Audience](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/09%20Real%20Estate%20Ads%20Guides/03%20Audiences%20%26%20Management/02%20Build%20Audience.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads/audience)
        * [Ads Management](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/09%20Real%20Estate%20Ads%20Guides/03%20Audiences%20%26%20Management/03%20Ads%20Management.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads/ads-management)
    * **Travel Ads Guides/**
      * [Travel Ads](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/01%20Travel%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads)
      * [Travel Ads - Audience Management](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/02%20Travel%20Ads%20-%20Audience%20Management.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/travel-ads/audience-management)
      * **Hotel Ads Guides/**
        * [Hotel Ads](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/03%20Hotel%20Ads%20Guides/01%20Hotel%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads)
        * [Hotel Ads - Catalog & Feed](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/03%20Hotel%20Ads%20Guides/02%20Hotel%20Ads%20-%20Catalog%20%26%20Feed.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/catalog)
        * [Hotel Ads - Events](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/03%20Hotel%20Ads%20Guides/03%20Hotel%20Ads%20-%20Events.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/events)
        * [Hotel Ads - Template Tags](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/03%20Hotel%20Ads%20Guides/04%20Hotel%20Ads%20-%20Template%20Tags.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/template-tags)
        * [Hotel Ads - Date-Specific Prices](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/03%20Hotel%20Ads%20Guides/05%20Hotel%20Ads%20-%20Date-Specific%20Prices.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/hotel-ads/dynamic-pricing)
      * **Flight Ads Guides/**
        * [Flight Ads](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/04%20Flight%20Ads%20Guides/01%20Flight%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/flight-ads)
        * [Flight Ads Catalog & Feed](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/04%20Flight%20Ads%20Guides/02%20Flight%20Ads%20Catalog%20%26%20Feed.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/flight-ads/catalog)
        * [Flight Events](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/04%20Flight%20Ads%20Guides/03%20Flight%20Events.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/flight-ads/events)
        * [Flight Ads - Template Tags](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/04%20Flight%20Ads%20Guides/04%20Flight%20Ads%20-%20Template%20Tags.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/flight-ads/template-tags)
      * **Destination Ads Guides/**
        * [Destination Ads](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/05%20Destination%20Ads%20Guides/01%20Destination%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads)
        * [Destination Catalog](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/05%20Destination%20Ads%20Guides/02%20Destination%20Catalog.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/catalog)
        * [Destination Events](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/05%20Destination%20Ads%20Guides/03%20Destination%20Events.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/events)
        * [Destination Ads - Template Tags](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/10%20Travel%20Ads%20Guides/05%20Destination%20Ads%20Guides/04%20Destination%20Ads%20-%20Template%20Tags.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/destination-ads/template-tags)
    * **Automotive Ads Guides/**
      * [Automotive Ads](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/11%20Automotive%20Ads%20Guides/01%20Automotive%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads)
      * [Overview](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/11%20Automotive%20Ads%20Guides/02%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/overview)
      * [Get Started](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/11%20Automotive%20Ads%20Guides/03%20Get%20Started.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/get-started)
      * **Automotive Ads Management/**
        * [Common Set Ups](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/11%20Automotive%20Ads%20Guides/04%20Automotive%20Ads%20Management/01%20Common%20Set%20Ups.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides)
        * [Automotive Inventory Ads](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/11%20Automotive%20Ads%20Guides/04%20Automotive%20Ads%20Management/02%20Automotive%20Inventory%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/aia)
        * [Automotive Model Ads](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/11%20Automotive%20Ads%20Guides/04%20Automotive%20Ads%20Management/03%20Automotive%20Model%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/aoa)
        * [Catalog](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/11%20Automotive%20Ads%20Guides/04%20Automotive%20Ads%20Management/04%20Catalog.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/catalog)
        * [Events](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/11%20Automotive%20Ads%20Guides/04%20Automotive%20Ads%20Management/05%20Events.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/events)
        * [Audience Management](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/11%20Automotive%20Ads%20Guides/04%20Automotive%20Ads%20Management/06%20Audience%20Management.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/audience-mgmt)
        * [Ads Management](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/11%20Automotive%20Ads%20Guides/04%20Automotive%20Ads%20Management/07%20Ads%20Management.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/guides/ads-mgmt)
      * [Reference](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/11%20Automotive%20Ads%20Guides/05%20Reference.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/auto-ads/reference)
    * [Advantage+ Catalog Ads with an On-Facebook Destination](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/12%20Advantage%2B%20Catalog%20Ads%20with%20an%20On-Facebook%20Destination.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/on-facebook-destination)
    * [FAQ](04%20Ad%20Creative/20%20Advantage%2B%20Catalog%20Ads%20Guides/13%20FAQ.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/faq)
  * **Advantage+ Creative Guides/**
    * [Advantage+ Creative](04%20Ad%20Creative/21%20Advantage%2B%20Creative%20Guides/01%20Advantage%2B%20Creative.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/advantage-creative)
    * [Get Started](04%20Ad%20Creative/21%20Advantage%2B%20Creative%20Guides/02%20Get%20Started.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/advantage-creative/get-started)
    * [Add Site Links](04%20Ad%20Creative/21%20Advantage%2B%20Creative%20Guides/03%20Add%20Site%20Links.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/advantage-creative/add-site-links)
    * [Product Extensions for Advantage+ Creative](04%20Ad%20Creative/21%20Advantage%2B%20Creative%20Guides/04%20Product%20Extensions%20for%20Advantage%2B%20Creative.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/product-extensions)
    * [Standard Enhancements for Advantage+ Creative](04%20Ad%20Creative/21%20Advantage%2B%20Creative%20Guides/05%20Standard%20Enhancements%20for%20Advantage%2B%20Creative.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/standard-enhancements)
    * [Advantage+ Creative Preview API](04%20Ad%20Creative/21%20Advantage%2B%20Creative%20Guides/06%20Advantage%2B%20Creative%20Preview%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/creative-preview)
  * [Omnichannel Ads](04%20Ad%20Creative/22%20Omnichannel%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/omnichannel-ads)
  * [Generative AI Features](04%20Ad%20Creative/23%20Generative%20AI%20Features.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/generative-ai-features)
  * **Collaborative Ads Guides/**
    * [Collaborative Ads](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/01%20Collaborative%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads)
    * **Managed Partner Ads Guides/**
      * [Managed Partner Ads](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/01%20Managed%20Partner%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads)
      * [Integration](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/02%20Integration.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/integration)
      * **Get Started/**
        * [API Guide](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/03%20Get%20Started/01%20API%20Guide.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide)
        * **Prerequisites & System Users/**
          * [Prerequisites](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/03%20Get%20Started/02%20Prerequisites%20%26%20System%20Users/01%20Prerequisites.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites)
          * [Create Admin System User](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/03%20Get%20Started/02%20Prerequisites%20%26%20System%20Users/02%20Create%20Admin%20System%20User.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/create-system-user)
          * [Assign Permissions to System User](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/03%20Get%20Started/02%20Prerequisites%20%26%20System%20Users/03%20Assign%20Permissions%20to%20System%20User.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/assign-permissions-to-system-user)
          * [Generate Access Token for System User](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/03%20Get%20Started/02%20Prerequisites%20%26%20System%20Users/04%20Generate%20Access%20Token%20for%20System%20User.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/prerequisites/generate-access-token-system-user)
        * **Seller Management Guides/**
          * [Seller Management](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/03%20Get%20Started/03%20Seller%20Management%20Guides/01%20Seller%20Management.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller)
          * [Check Seller Eligibility](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/03%20Get%20Started/03%20Seller%20Management%20Guides/02%20Check%20Seller%20Eligibility.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/eligibility)
          * [Onboard a Seller](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/03%20Get%20Started/03%20Seller%20Management%20Guides/03%20Onboard%20a%20Seller.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/onboarding)
          * [Delete a Seller](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/03%20Get%20Started/03%20Seller%20Management%20Guides/04%20Delete%20a%20Seller.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/seller/deletion)
        * **Partner Ads Management Guides/**
          * [Partner Ads Management](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/03%20Get%20Started/04%20Partner%20Ads%20Management%20Guides/01%20Partner%20Ads%20Management.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/mpa-ads)
        * [Async API User Guide](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/03%20Get%20Started/05%20Async%20API%20User%20Guide.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/async-api-user-guide)
        * [Error Handling Guide](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/03%20Get%20Started/06%20Error%20Handling%20Guide.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/api-guide/error-handling-guide)
      * [Reference](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/04%20Reference.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/reference)
      * [FAQ](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/02%20Managed%20Partner%20Ads%20Guides/05%20FAQ.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/managed-partner-ads/faq)
    * [Partner Premium Options](04%20Ad%20Creative/24%20Collaborative%20Ads%20Guides/03%20Partner%20Premium%20Options.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/collaborative-ads/partner-premium-options)
  * **Product Set Optimization/**
    * [Overview](04%20Ad%20Creative/25%20Product%20Set%20Optimization/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/product-set-optimization/product-set-optimization-overview)
    * [Promoted Products Optimization](04%20Ad%20Creative/25%20Product%20Set%20Optimization/02%20Promoted%20Products%20Optimization.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/product-set-optimization/promoted-products-optimization)
    * [Budget Splits](04%20Ad%20Creative/25%20Product%20Set%20Optimization/03%20Budget%20Splits.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/product-set-optimization/budget-splits)
  * [Multi-advertiser Ads](04%20Ad%20Creative/26%20Multi-advertiser%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/multi-advertiser-ads)
  * [Reels Ads](04%20Ad%20Creative/27%20Reels%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/reels-ads)
  * **Call Ads Guides/**
    * [Call Ads](04%20Ad%20Creative/28%20Call%20Ads%20Guides/01%20Call%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/call-ads)
    * [Callback Feeature](04%20Ad%20Creative/28%20Call%20Ads%20Guides/02%20Callback%20Feeature.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/call-ads/callback-feature)
  * [Flexible Ad Format](04%20Ad%20Creative/29%20Flexible%20Ad%20Format.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/flexible-ad-format)
  * [Format Automation](04%20Ad%20Creative/30%20Format%20Automation.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/format-automation)
  * [Metadata Tagging](04%20Ad%20Creative/31%20Metadata%20Tagging.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/metadata-tagging)
* **Bidding Guides/**
  * [Bidding](05%20Bidding%20Guides/01%20Bidding.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding)
  * **Budget & Strategy/**
    * [Overview](05%20Bidding%20Guides/02%20Budget%20%26%20Strategy/01%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview)
    * [Budgets](05%20Bidding%20Guides/02%20Budget%20%26%20Strategy/02%20Budgets.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/budgets)
    * [Bid Strategies](05%20Bidding%20Guides/02%20Budget%20%26%20Strategy/03%20Bid%20Strategies.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/bid-strategy)
    * [Billing Events](05%20Bidding%20Guides/02%20Budget%20%26%20Strategy/04%20Billing%20Events.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/billing-events)
    * [Pacing and Scheduling](05%20Bidding%20Guides/02%20Budget%20%26%20Strategy/05%20Pacing%20and%20Scheduling.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/pacing-and-scheduling)
  * **Bidding & Optimization/**
    * [Guides](05%20Bidding%20Guides/03%20Bidding%20%26%20Optimization/01%20Guides.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/guides)
    * [Advantage Campaign Budget](05%20Bidding%20Guides/03%20Bidding%20%26%20Optimization/02%20Advantage%20Campaign%20Budget.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/guides/advantage-campaign-budget)
    * [Ad Set Budget Sharing](05%20Bidding%20Guides/03%20Bidding%20%26%20Optimization/03%20Ad%20Set%20Budget%20Sharing.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/guides/adset-budget-sharing)
    * [Optimized Cost Per Mille Ads](05%20Bidding%20Guides/03%20Bidding%20%26%20Optimization/04%20Optimized%20Cost%20Per%20Mille%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/guides/optimized-cost-per-mille)
    * [Cost Per Action Ads](05%20Bidding%20Guides/03%20Bidding%20%26%20Optimization/05%20Cost%20Per%20Action%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/guides/cost-per-action-ads)
    * [Reservation](05%20Bidding%20Guides/03%20Bidding%20%26%20Optimization/06%20Reservation.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reservation)
    * [Bid Multipliers](05%20Bidding%20Guides/03%20Bidding%20%26%20Optimization/07%20Bid%20Multipliers.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding-and-optimization/bid-multiplier)
    * [Cross-Channel Conversion Optimization](05%20Bidding%20Guides/03%20Bidding%20%26%20Optimization/08%20Cross-Channel%20Conversion%20Optimization.md) — [original](https://developers.facebook.com/documentation/ads-commerce/ccco)
  * [Value Rules](05%20Bidding%20Guides/04%20Value%20Rules.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/value-rules)
* **Ad Rules Engine Guides/**
  * [Ad Rules Engine](06%20Ad%20Rules%20Engine%20Guides/01%20Ad%20Rules%20Engine.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules)
  * **Ad Rules Specs/**
    * [Specs](06%20Ad%20Rules%20Engine%20Guides/02%20Ad%20Rules%20Specs/01%20Specs.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/ad-rules-specs)
    * [Evaluation Spec](06%20Ad%20Rules%20Engine%20Guides/02%20Ad%20Rules%20Specs/02%20Evaluation%20Spec.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/evaluation-spec)
    * [Execution Spec](06%20Ad%20Rules%20Engine%20Guides/02%20Ad%20Rules%20Specs/03%20Execution%20Spec.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/execution-spec)
    * [Change Spec](06%20Ad%20Rules%20Engine%20Guides/02%20Ad%20Rules%20Specs/04%20Change%20Spec.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/overview/change-spec)
  * [Trigger Based Rules](06%20Ad%20Rules%20Engine%20Guides/03%20Trigger%20Based%20Rules.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/trigger-based-rules)
  * [Schedule Based Rules](06%20Ad%20Rules%20Engine%20Guides/04%20Schedule%20Based%20Rules.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/scheduled-based-rules)
  * [Advanced Scheduling](06%20Ad%20Rules%20Engine%20Guides/05%20Advanced%20Scheduling.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/advanced-scheduling)
  * [Evaluation Spec Filters](06%20Ad%20Rules%20Engine%20Guides/06%20Evaluation%20Spec%20Filters.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/evaluation-spec-filters)
  * [Rebalance Budget](06%20Ad%20Rules%20Engine%20Guides/07%20Rebalance%20Budget.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/rebalance-budget)
  * [ROAS Ad Rules](06%20Ad%20Rules%20Engine%20Guides/08%20ROAS%20Ad%20Rules.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/roas-ad-rules)
  * [API Calls](06%20Ad%20Rules%20Engine%20Guides/09%20API%20Calls.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-rules/guides/api-calls)
* **Audience Guides/**
  * [Audiences](07%20Audience%20Guides/01%20Audiences.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences)
  * [Overview](07%20Audience%20Guides/02%20Overview.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/overview)
  * [Customer File Custom Audiences](07%20Audience%20Guides/03%20Customer%20File%20Custom%20Audiences.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences)
  * [Audience Rules](07%20Audience%20Guides/04%20Audience%20Rules.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/audience-rules)
  * [Lookalike Audiences](07%20Audience%20Guides/05%20Lookalike%20Audiences.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/lookalike-audiences)
  * [Value-Based Lookalikes](07%20Audience%20Guides/06%20Value-Based%20Lookalikes.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/value-based-lookalike-audiences)
  * [Engagement Custom Audiences](07%20Audience%20Guides/07%20Engagement%20Custom%20Audiences.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/engagement-custom-audiences)
  * [Mobile App Custom Audiences](07%20Audience%20Guides/08%20Mobile%20App%20Custom%20Audiences.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/mobile-app-custom-audiences)
  * [Website Custom Audiences](07%20Audience%20Guides/09%20Website%20Custom%20Audiences.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences)
  * [Offline Custom Audiences](07%20Audience%20Guides/10%20Offline%20Custom%20Audiences.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/offline-custom-audiences)
  * [Dynamic Audiences](07%20Audience%20Guides/11%20Dynamic%20Audiences.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/dynamic-product-audiences)
  * [Audience Network Ads](07%20Audience%20Guides/12%20Audience%20Network%20Ads.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audience-network)
  * [Reach Estimate API](07%20Audience%20Guides/13%20Reach%20Estimate%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/reach-estimate)
  * [Special Ad Category](07%20Audience%20Guides/14%20Special%20Ad%20Category.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category)
  * **Targeting Guides/**
    * [Reference](07%20Audience%20Guides/15%20Targeting%20Guides/01%20Reference.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference)
    * [Basic Targeting](07%20Audience%20Guides/15%20Targeting%20Guides/02%20Basic%20Targeting.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/basic-targeting)
    * [Advanced Targeting](07%20Audience%20Guides/15%20Targeting%20Guides/03%20Advanced%20Targeting.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting)
    * [Placement Targeting](07%20Audience%20Guides/15%20Targeting%20Guides/04%20Placement%20Targeting.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/placement-targeting)
    * [Targeting Search](07%20Audience%20Guides/15%20Targeting%20Guides/05%20Targeting%20Search.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search)
    * [Detailed Targeting](07%20Audience%20Guides/15%20Targeting%20Guides/06%20Detailed%20Targeting.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/detailed-targeting)
    * [Targeting Description](07%20Audience%20Guides/15%20Targeting%20Guides/07%20Targeting%20Description.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-description)
    * **Advantage Targeting Guides/**
      * [Advantage Targeting](07%20Audience%20Guides/15%20Targeting%20Guides/08%20Advantage%20Targeting%20Guides/01%20Advantage%20Targeting.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advantage-targeting)
      * [Advantage+ Audience](07%20Audience%20Guides/15%20Targeting%20Guides/08%20Advantage%20Targeting%20Guides/02%20Advantage%2B%20Audience.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-expansion/advantage-audience)
      * [Advantage Detailed Targeting](07%20Audience%20Guides/15%20Targeting%20Guides/08%20Advantage%20Targeting%20Guides/03%20Advantage%20Detailed%20Targeting.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-expansion/advantage-detailed-targeting)
      * [Advantage Lookalike](07%20Audience%20Guides/15%20Targeting%20Guides/08%20Advantage%20Targeting%20Guides/04%20Advantage%20Lookalike.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-expansion/advantage-lookalike)
      * [Advantage Custom Audience](07%20Audience%20Guides/15%20Targeting%20Guides/08%20Advantage%20Targeting%20Guides/05%20Advantage%20Custom%20Audience.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-expansion/advantage-custom-audience)
    * [Flexible Targeting](07%20Audience%20Guides/15%20Targeting%20Guides/09%20Flexible%20Targeting.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/flexible-targeting)
    * [Deprecated Targeting Terms](07%20Audience%20Guides/15%20Targeting%20Guides/10%20Deprecated%20Targeting%20Terms.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/deprecated-targeting-terms)
    * [Targeting Restrictions](07%20Audience%20Guides/15%20Targeting%20Guides/11%20Targeting%20Restrictions.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-restrictions)
    * [Estimated Daily Results](07%20Audience%20Guides/15%20Targeting%20Guides/12%20Estimated%20Daily%20Results.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/estimated-daily-results)
    * [Custom Audience Terms Of Service](07%20Audience%20Guides/15%20Targeting%20Guides/13%20Custom%20Audience%20Terms%20Of%20Service.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/custom-audience-terms-of-service)
* **Insights API/**
  * [Get Started](08%20Insights%20API/01%20Get%20Started.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights)
  * [Breakdowns](08%20Insights%20API/02%20Breakdowns.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/breakdowns)
  * [Feature Settings](08%20Insights%20API/03%20Feature%20Settings.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/feature-settings)
  * [Limits & Best Practices](08%20Insights%20API/04%20Limits%20%26%20Best%20Practices.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/best-practices)
  * [Tracking and Conversion Specs](08%20Insights%20API/05%20Tracking%20and%20Conversion%20Specs.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/tracking-specs)
  * [Marketing Mix Modeling](08%20Insights%20API/06%20Marketing%20Mix%20Modeling.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/marketing-mix-modeling)
  * [Conversion Lift Measurement](08%20Insights%20API/07%20Conversion%20Lift%20Measurement.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lift-studies)
  * [Split Testing](08%20Insights%20API/08%20Split%20Testing.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/split-testing)
  * [Ad Volume](08%20Insights%20API/09%20Ad%20Volume.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights-api/ads-volume)
  * [App Events API](08%20Insights%20API/10%20App%20Events%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/app-event-api)
  * [Error Codes](08%20Insights%20API/11%20Error%20Codes.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/error-codes)
* **Ads Webhooks/**
  * [Overview](09%20Ads%20Webhooks/01%20Overview.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ads-webhooks-overview)
  * [Get started](09%20Ads%20Webhooks/02%20Get%20started.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/setup/get-started)
  * [Effective status](09%20Ads%20Webhooks/03%20Effective%20status.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/effective-status)
  * [Subscriptions](09%20Ads%20Webhooks/04%20Subscriptions.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/subscriptions)
  * [Creative fatigue](09%20Ads%20Webhooks/05%20Creative%20fatigue.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/creative-fatigue)
  * [Ad recommendations](09%20Ads%20Webhooks/06%20Ad%20recommendations.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/ad-recommendations)
  * [In-process ad objects](09%20Ads%20Webhooks/07%20In-process%20ad%20objects.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/in-process-ad-objects)
  * [With-issues ad objects](09%20Ads%20Webhooks/08%20With-issues%20ad%20objects.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-webhooks/with-issues-ad-objects)
* **Brand Safety and Suitability Guides/**
  * [Brand Safety and Suitability](10%20Brand%20Safety%20and%20Suitability%20Guides/01%20Brand%20Safety%20and%20Suitability.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability)
  * [Integration Setup](10%20Brand%20Safety%20and%20Suitability%20Guides/02%20Integration%20Setup.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/brand-safety-partners)
  * [Publisher Block Lists API](10%20Brand%20Safety%20and%20Suitability%20Guides/03%20Publisher%20Block%20Lists%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/block-list)
  * [Content Block Lists API](10%20Brand%20Safety%20and%20Suitability%20Guides/04%20Content%20Block%20Lists%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/content-block-lists)
  * [Content Delivery Reports API](10%20Brand%20Safety%20and%20Suitability%20Guides/05%20Content%20Delivery%20Reports%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/content-delivery-report)
  * [Feed Verification API](10%20Brand%20Safety%20and%20Suitability%20Guides/06%20Feed%20Verification%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/feed-verification)
  * [Publisher Delivery Reports API](10%20Brand%20Safety%20and%20Suitability%20Guides/07%20Publisher%20Delivery%20Reports%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/publisher-delivery-report)
  * [Passback API](10%20Brand%20Safety%20and%20Suitability%20Guides/08%20Passback%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/passback-api)
  * [Partner-publisher Lists API](10%20Brand%20Safety%20and%20Suitability%20Guides/09%20Partner-publisher%20Lists%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/brand-safety-and-suitability/publisher-list)
* **Best Practices & Recommendations/**
  * [Best Practices](11%20Best%20Practices%20%26%20Recommendations/01%20Best%20Practices.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices)
  * [Performance Recommendations API](11%20Best%20Practices%20%26%20Recommendations/02%20Performance%20Recommendations%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/performance-recommendations)
  * [Performance Recommendations History API](11%20Best%20Practices%20%26%20Recommendations/03%20Performance%20Recommendations%20History%20API.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/performance-recommendations-history-api)
  * [Omni Optimal Setup Guide](11%20Best%20Practices%20%26%20Recommendations/04%20Omni%20Optimal%20Setup%20Guide.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices/omni-optimal-setup-guide)
  * [Manage Your Ad Object's Status](11%20Best%20Practices%20%26%20Recommendations/05%20Manage%20Your%20Ad%20Object%27s%20Status.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices/manage-your-ad-object-status)
  * [Async and Batch Requests](11%20Best%20Practices%20%26%20Recommendations/06%20Async%20and%20Batch%20Requests.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/asyncrequests)
  * [Post-Processing for Ad Creation](11%20Best%20Practices%20%26%20Recommendations/07%20Post-Processing%20for%20Ad%20Creation.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/using-the-api/post-processing)
* **Troubleshooting/**
  * [Error Handling](12%20Troubleshooting/01%20Error%20Handling.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/troubleshooting)
  * **Error Codes/**
    * [Standard Error Codes](12%20Troubleshooting/02%20Error%20Codes/01%20Standard%20Error%20Codes.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/error-reference)
    * [iOS 14 Error Codes](12%20Troubleshooting/02%20Error%20Codes/02%20iOS%2014%20Error%20Codes.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/error-reference/ios-14-error-codes)
  * [FAQ](12%20Troubleshooting/03%20FAQ.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/using-the-api/faq)
* **Version Changelogs/**
  * [Changelog](13%20Version%20Changelogs/01%20Changelog.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog)
  * **Versions/**
    * [Versions List](13%20Version%20Changelogs/02%20Versions/01%20Versions%20List.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/versions)
    * [v26.0](13%20Version%20Changelogs/02%20Versions/02%20v26.0.md) *(converted)* — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/version26.0)
    * [v25.0](13%20Version%20Changelogs/02%20Versions/03%20v25.0.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/version25.0)
    * [v24.0](13%20Version%20Changelogs/02%20Versions/04%20v24.0.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/version24.0)
    * [v23.0](13%20Version%20Changelogs/02%20Versions/05%20v23.0.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/version23.0)
    * [v22.0](13%20Version%20Changelogs/02%20Versions/06%20v22.0.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/version22.0)
    * [v21.0](13%20Version%20Changelogs/02%20Versions/07%20v21.0.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/version21.0)
    * [v20.0](13%20Version%20Changelogs/02%20Versions/08%20v20.0.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/version20.0)
    * [v19.0](13%20Version%20Changelogs/02%20Versions/09%20v19.0.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/version19.0)
    * [v18.0](13%20Version%20Changelogs/02%20Versions/10%20v18.0.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/marketing-api-changelog/version18.0)
  * **Out-of-Cycle Change Index/**
    * [2023](13%20Version%20Changelogs/03%20Out-of-Cycle%20Change%20Index/01%202023.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/out-of-cycle-changes/occ-2023)
    * [2024](13%20Version%20Changelogs/03%20Out-of-Cycle%20Change%20Index/02%202024.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/out-of-cycle-changes/occ-2024)
    * [2025](13%20Version%20Changelogs/03%20Out-of-Cycle%20Change%20Index/03%202025.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/out-of-cycle-changes/occ-2025)
    * [2026](13%20Version%20Changelogs/03%20Out-of-Cycle%20Change%20Index/04%202026.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/out-of-cycle-changes/occ-2026)
    * [Out-of-Cycle Changes](13%20Version%20Changelogs/03%20Out-of-Cycle%20Change%20Index/05%20Out-of-Cycle%20Changes.md) — [original](https://developers.facebook.com/documentation/ads-commerce/marketing-api/out-of-cycle-changes)
* **Pages not in the sidebar/**
  * [Ad Set Destination Type](14%20Pages%20not%20in%20the%20sidebar/Ad%20Set%20Destination%20Type.md) *(old docs site)*

## Dead links (no page on Meta's site)

* `/docs/marketing-api/adcreative`
* `/docs/marketing-api/adgroup/feedback`
* `/docs/marketing-api/adset/pacing`
* `/docs/marketing-api/audiences/guides`
* `/docs/marketing-api/bidding/overview/budgetsg`
* `/docs/marketing-api/connectionobjects`
* `/docs/marketing-api/dynamic-ads-for-auto/audience-management`
* `/docs/marketing-api/dynamic-ads-for-flights/v3.1`
* `/docs/marketing-api/dynamic-creative/overview`
* `/docs/marketing-api/dynamic-creative/segment-asset-customization`
* `/docs/marketing-api/dynamic-product-ads/debugging-tools`
* `/docs/marketing-api/insights/estimated-in-development`
* `/docs/marketing-api/insights/fields`
* `/docs/marketing-api/insights/parameters/v2.7`
* `/docs/marketing-api/real-estate-ads/support`
* `/docs/marketing-apis/overview/authentication`
* `/documentation/ads-commerce/marketing-api/audiences/guides/advantage-audience`
* `/documentation/ads-commerce/marketing-api/mobile-measurement`
