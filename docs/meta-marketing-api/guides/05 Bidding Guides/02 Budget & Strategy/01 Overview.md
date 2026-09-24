<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview | Saved: 2026-09-19 -->

# Bidding overview



A *bid* expresses how much you value your ad reaching a target audience and delivering results on your `optimization_goal`. `bid_amount` is the amount you want to spend to acquire a given event based on `optimization_goal`, and `bid_strategy` is how you want to control your spend on a given event based on `optimization_goal`.

In Facebook's ad auction, Facebook evaluates your `bid_strategy`, `bid_amount`, and the probability of acquiring your `optimization_goal` to calculate an **effective bid** so that you only win auctions and have your ads delivered when you are likely to reach your `optimization_goal` within certain bidding constraints such as cost per result.

**Warning:** As part of our effort to simplify our product offering, Meta consolidated Reach and Impressions optimizations to help advertisers achieve their reach goals more effectively.

In the API, selecting the Reach optimization will return the value of "Impressions" in `optimization_goal` and with the advertiser's frequency control setting.

Bidding and Optimization core concepts include:

- [**Bid Strategies**](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/bid-strategy) - How you want to place your bids.
- [**Optimization Goals**](#opt) - Advertising goals you want to achieve when Facebook delivers your ads.
- [**Budgets**](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/budgets)
- [**Pacing and Scheduling**](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/pacing-and-scheduling) - How your ads budget is spent over time.
- [**Campaign Budget Optimization**](https://developers.facebook.com/docs/marketing-api/bidding/guides/campaign-budget-optimization) - A way of optimizing the distribution of a campaign budget across your campaign's ad sets.
- [**Billing Events**](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/billing-events) - Events you want to pay for such as impressions, clicks, or various actions.

## Bid setup {#setup}

When you choose your bid:

* Set `bid_amount` to the maximum amount you're willing to pay for your advertising objective.
* Decide whether to optimize for return on ad spend or for the number of results.

You can also set `objective` and `billing_event` but neither directly impacts `bid_amount` or your effective bid. If a `bid_amount` is set, your actual cost per result is usually around or less than `bid_amount`, depending on your [**Bid Strategies**](https://developers.facebook.com/documentation/ads-commerce/marketing-api/bidding/overview/bid-strategy).

For example, use these settings to spend about $10.00 for 1,000 daily unique views:

* Campaign `objective`: `APP_INSTALLS`
* Ad set `optimization_goal`: `REACH`
* Ad set `billing_event`: `IMPRESSIONS`

However, to spend $10.00 **for each app install**, use these settings:

* Campaign `objective`: `APP_INSTALLS`
* Ad set `optimization_goal`: `APP_INSTALLS`
* Ad set `billing_event`: `IMPRESSIONS`

## Optimization goals {#opt}

Define advertising goals you want to achieve when Facebook delivers your ads. Facebook uses your [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign)'s `optimization_goal` to decide which people get your ad. For example with `APP_INSTALLS`, Facebook delivers your ad to people who are more likely to install your app.

`optimization_goal` defaults to a goal associated with your `objective`. For example, if `objective` is `APP_INSTALLS`, `optimization_goal` defaults to `APP_INSTALLS`.

### Validation {#opt-goal-validation}

**Warning:** These older objectives are deprecated with the release of [Marketing API v17.0](https://developers.facebook.com/docs/graph-api/changelog/version17.0#marketing-api). Please refer to the [Outcome-Driven Ads Experiences mapping table](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group#odax-mapping) to find the new objectives and their corresponding destination types, optimization goals and promoted objects.

Certain [campaign `objectives`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) support only certain ad set `optimization_goal`s:

| Campaign objective | Default `optimization_goal` | Other valid `optimization_goal` |
| --- | --- | --- |
| `APP_INSTALLS`, promoting an Instant Experiences app | `APP_INSTALLS` | `IMPRESSIONS`, `POST_ENGAGEMENT` |
| `APP_INSTALLS`, promoting a mobile app | `APP_INSTALLS` | `OFFSITE_CONVERSIONS`, `LINK_CLICKS`, `REACH` and `VALUE` |
| `BRAND_AWARENESS` | `AD_RECALL_LIFT` | `REACH` |
| `CONVERSIONS` | `OFFSITE_CONVERSIONS` | `IMPRESSIONS`, `LINK_CLICKS`, `POST_ENGAGEMENT`, `REACH`, `VALUE`, `LANDING_PAGE_VIEWS`, and `CONVERSATIONS` |
| `EVENT_RESPONSES`, promoting an event | `EVENT_RESPONSES` | `IMPRESSIONS`, `REACH` |
| `EVENT_RESPONSES`, promoting a Page post | `EVENT_RESPONSES` | `IMPRESSIONS`, `POST_ENGAGEMENT`, `REACH` |
| `LEAD_GENERATION` | `LEAD_GENERATION` | `QUALITY_LEAD`, `LINK_CLICKS`, and `QUALITY_CALL` |
| `LINK_CLICKS` | `LINK_CLICKS` | `IMPRESSIONS`, `POST_ENGAGEMENT`, `REACH`, `LANDING_PAGE_VIEWS` |
| `LINK_CLICKS`, promoting an Instant Experiences app | `ENGAGED_USERS` | `APP_INSTALLS`, `IMPRESSIONS`, `POST_ENGAGEMENT`, `REACH` |
| `LINK_CLICKS`, promoting a mobile app | `LINK_CLICKS` | `IMPRESSIONS`, `REACH`, `OFFSITE_CONVERSIONS` |
| `MESSAGES` | `CONVERSATIONS` | `IMPRESSIONS`, `POST_ENGAGEMENT`, `LEAD_GENERATION`, and `LINK_CLICKS` |
| `PAGE_LIKES` | `PAGE_LIKES` | `IMPRESSIONS`, `POST_ENGAGEMENT`, `REACH` |
| `POST_ENGAGEMENT` | `POST_ENGAGEMENT` | `IMPRESSIONS`, `REACH`, and `LINK_CLICKS` |
| `PRODUCT_CATALOG_SALES` | `OFFSITE_CONVERSIONS` or `LINK_CLICKS` | `IMPRESSIONS`, `POST_ENGAGEMENT`, `REACH`, `CONVERSATIONS`, and `VALUE` |
| `REACH` | `REACH` | `IMPRESSIONS` |
| `VIDEO_VIEWS` | `THRUPLAY` |  |

## FAQ {#faq}

The following answers address common questions about bidding and optimization goals.

**What events does 'POST_ENGAGEMENT' cover?**

Most actions in an ad, including link clicks, app installs, video viewing over a certain period, tag photo, like, comment, share, and so on.

