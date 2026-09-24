<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ads-creation | Saved: 2026-09-19 -->

# Partnership Ads Creation



Partnership ads allow you to run ads with creators, brands, and other businesses. The ad features brands and partner accounts in its header, and the ads use signals from both accounts for improved ranking and incremental performance.

There are several options for creating partnership ads:

* Boost existing media or posts with the existing media ID or an ad code
* Get creator content recommendations that Meta predicts will be the best performing partnership ads for objectives
* Make yourself the ad's primary identity and the creator as the secondary identity, or vice versa
* Add the following capabilities to your ads:
    * Placement Asset Customization
    * Advantage+ Creative
    * Click to Message Destinations
    * Advantage+ Catalog Ads
    * Testimonials
    * Lead Generation

## Before you start

You need:

* To meet the [eligibility requirements for Instagram partnership ads and branded content](https://help.instagram.com/1372533836927082) and [Facebook partnership ads](https://www.facebook.com/business/help/906775900606811)
* The ID for your brand's [Instagram professional account](https://help.instagram.com/138925576505882)
* The username for the Instagram professional account (optional)
* A Page access token with the `ADVERTISE` role on the Page linked to the Instagram professional account
* Advanced Access for all permissions if you will be retrieving media and creating ads on behalf of an Instagram professional account that you do not own or administer
* [Partnership ads account-level permissioning](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/account-level-permissioning) for the creator approved by the brand or post-level permissioning for the brand approved by the creator in order for the ad to deliver

### Permissions

To create partnership ads, you need the following permissions:

* `ads_management`
* `business_management`
* `instagram_basic`
* `instagram_branded_content_ads_brand`
* `pages_read_engagement`
* `pages_show_list`
* `create_ads` (for the Instagram account that is creating the ad)

### Permission levels

#### Account-level permissioning

Through the [Instagram](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/account-level-permissioning) and [Facebook](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/fb-account-level-permissioning) partnership ads account-level permissions, you can manage relationships with partners at the account level and run partnership ads without additional permissions at the content level.

**Note:** If two Instagram or Facebook accounts are owned by the same business and an employee has ads access to both assets, they can run partnership ads without partnership ad permissions.

#### Post-level permissioning

Post-level permissioning applies when an account-level permission does not exist between you and your partner. In that case:

* Use a partnership ad code to create an ad using the ads creation APIs.
* Request creators provide permission to promote their organic branded content posts as partnership ads (applicable only with organic branded content posts).

See [Post-Level Permissioning](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/post-level-permissioning) for more information.

**Note:** If you publish the ad without permissions in place, Meta publishes the ad in a pending delivery state. The creator receives a permission request from the brand, which, once approved, allows the ad to be delivered.
