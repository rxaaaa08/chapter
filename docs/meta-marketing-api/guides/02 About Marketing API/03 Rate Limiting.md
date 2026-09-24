<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/rate-limiting | Saved: 2026-09-19 -->

# Marketing API Rate Limiting


**Warning:** **Ads Management Standard Access is now Marketing API Access Tier**

**No code changes are needed.**

Tier labels have been updated: "Standard Access" is now **Limited Access**, and "Advanced Access" is now **Full Access**. The revised qualification threshold for Full Access has been reduced from 1,500 to **500 Marketing API calls** in the past 15 days. The underlying permission identifier remains the same, and existing access levels are preserved automatically. Learn more in the [Marketing API Access Tier documentation](https://developers.facebook.com/docs/features-reference#marketing-api-access-tier).

The Marketing API has its own rate limiting logic and is excluded from all the Graph API rate limitations. So if you make a Marketing API call, it won't be calculated into the [Graph API throttling](https://developers.facebook.com/docs/graph-api/advanced/rate-limiting).

The feature that impacts the Marketing API rate limit quota is [Marketing API Access Tier](https://developers.facebook.com/docs/features-reference#marketing-api-access-tier). When you add the Marketing API product in your [App Dashboard](https://developers.facebook.com/apps), you will get the **Limited tier** of Marketing API Access Tier by default. This will give you development access to the Marketing API. If you need to upgrade to get more rate limiting quota, upgrade to **Full access** of Marketing API Access Tier in [App Review](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization).

### Quotas
| Marketing API Access | Marketing API Access Tier | Capacity |
| --- | --- | --- |
| Development access | Limited access | Basic rate limiting quota |
| Standard access | Full access | More rate limiting quota |

Most Marketing API requests and Pages API requests are subject to Business Use Case (BUC) Rate Limits and depend on the endpoints you are querying. You should be able to figure this out by checking if your `HTTP` request contains an `X-Business-Use-Case` header. See more details in [Business Use Case Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#buc-rate-limits).

## Ad Account Level API-Level Limits

* Rate limiting is at the ad account level.
* Rate limits happen in real time on a given time range.
* Each Marketing API call is assigned a score. Your score is the sum of your API calls.
* We enforce a maximum score. Generally speaking, a read API call is equal to 1 point, and a write API call is equal to 3 points, and when you reach the maximum score, we throw a throttling error.
    * If your app is in the Marketing API development tier:
        * Your maximum score is 60.
        * The decay rate is 300 seconds.
        * You will be blocked for 300 seconds if you reach the maximum score.
    * If your app has Full access to the Marketing API:
        * Your maximum score is 9000.
        * The decay rate is 300 seconds.
        * You will be blocked for 60 seconds if you reach the maximum score.

**Related error code:** `17, Error subcode: 2446079, Message: User request limit reached. 613, Error subcode: 1487742, Message: There have been too many calls from this ad-account. Please wait a bit and try again.`

## Ad Account Level QPS Rate Limits  

To prevent sudden traffic bursts from overwhelming our systems, we enforce real-time rate limiting on Marketing API mutation endpoints (create and edit operations for campaigns, ad sets, and ads).  

* Rate limiting is at the ad account level, per application.  
* Limit: 100 requests per second (QPS) per app and ad account combination.  
* Applied to: Create and edit operations for campaigns, ad sets, and ads.  
* This limit operates in real-time and is designed to catch short traffic spikes that the standard rate limiting window may not detect.

The following endpoints are affected:

* [`POST /{ad-account-id}/ads`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/ads)  
* [`POST /adgroup`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup)  
* [`POST /{ad-account-id}/adsets`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adsets)  
* [`POST /adcampaign`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign)  
* [`POST /{ad-account-id}/campaigns`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/campaigns)  
* [`POST /campaigngroup`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group)

When you exceed this limit, spread your requests more evenly over time rather than sending them in bursts.  

**Related error code:** `613, Error subcode: 5044001, Message: Your ad account {ad_account_id} has exceeded the maximum allowed rate of mutation requests. To
resolve this, reduce the frequency of your create, update operations on campaigns, ad sets, and ads.`  

When this error is encountered, implement request throttling to stay under 100 QPS per ad account.  

## Ads Insights Platform Rate Limiting

* Rate limiting is at the application level.
* Rate limiting is determined by the capacity of backend infra and downstream services.
* When your app is rate limited, all Ads Insights API calls for the app are limited.
* App Level Rate Limiting is enforced.

**Related error code:** `4, Error subcode: 1504022 or 1504039, Message: There have been too many calls from this app. Wait a bit and try again.`

When this error is encountered, scale back your calls.

## App-Level Limits

* Rate limiting is at the application level.
* Rate limiting is determined by total users of an app.
* When your app is rate limited, all calls for the app are limited.
* App Level Rate Limiting is enforced.

**Related error code:** `4, Message: Application request limit reached`

When this error is encountered, scale back your calls.

## Ad Account Level Business Use Case Rate Limits

We compute the rate limit quota based on your Marketing API access tier and your app.

* Rate limiting is at the ad account level and quota is computed based on your app ads api access tier.
* `ads_management` - For each ad account in a one-hour time period: (100000 if your app is in the Marketing API Full access or 300 if your app is in the Dev tier) + 40 * Num of Active ads.
* `custom_audience` - For each ad account in a one-hour time period: No more than 700000. No less than 190000 if your app is in the Marketing API Full access or 5000 if your app is in the Dev tier + 40 * Number of Active custom audiences.
* ads_insights - For each ad account in a one-hour time period: (190000 if your app is in the Ads API Full access or 600 if your app is in the Dev tier) + 400 * Number of Active ads - 0.001 * User Errors.
* Catalog Management - For each ad account in a one-hour time period: 20000 + 20000 * log2(unique users).
* Catalog Batch - For each ad account in a one-hour time period: 200 + 200 * log2(unique users).
* Your Marketing API rate limit may also be determined by Total CPU time and Total Wall time on your ad account. You will have more quota If your app has Marketing API Full Access, for more details, check the HTTP `[X-Business-Use-Case](/docs/graph-api/overview/rate-limiting#headers-2)` header and [Business Use Case Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#buc-rate-limits).

**Related error code:** `80000, 80003, 80004, 80014, Message: There have been too many calls from this ad-account. Wait a bit and try again. For more info, please refer to /docs/graph-api/overview/rate-limiting.`

Verify the API endpoint and HTTP `X-Business-Use-Case` header to confirm the throttling type. See more details in [Business Use Case Rate Limits](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#buc-rate-limits). When this error is encountered, scale back the changes to the ad account.

## Ad Account Level Ad Spend Rate Limits

We limit you to changing your account spending limits 10 times per day to ensure the Ads delivery performance.

* Number of changes to the ad account spend such as spend_cap, spend_cap_action fields are limited

**Related error code:** `17, Error subcode: 1885172, Message: You can only change your account spending limit 10 times per day. Please wait to make more changes.`

## Ad Set Level Limits

The number of changes to the ad set `daily_budget` and `lifetime_budget` fields are limited. For each ad set, the budget is only allowed to change 4 times per hour, if it exceeds the limit, the budget change for that ad set is blocked for an hour.

**Related error code:** `613, Error subcode: 1487632, Message: You can only change your ad set budget 4 times per hour. Please wait to make more changes.`

When this error is encountered, scale back the changes to the ad set.

## Ad Level Limits

Ad creation is limited for a given ad account based on the daily spend limit.

**Related error code:** `613, Error subcode: 1487225, Message: User request limit reached`.

Verify the error subcode (`1487225`) and API endpoint to confirm the throttling type. When this error is encountered, scale back the changes. To increase your limit, you can also increase the daily spend limit.

## Abuse Prevention Rate Limits

When our system detects that certain ad accounts generate a large amount of abnormal traffic, in order to protect the stability of the system and ensure the experience of other users, we will temporarily reduce the API Rate Limit quota of the abnormal accounts. Please try contacting [Meta support](https://developers.facebook.com/support/) for help.

**Related error code:** `613, Error subcode: null, Message: (#613) Calls to this api have exceeded the rate limit.`

The difference between this and the Ad Account Level API-Level Limit is this error doesn't contain error subcodes. When this error is encountered, investigate if any action is triggering excessive API requests and contact [Meta support](https://developers.facebook.com/support/) for help.

## Handle Throttling Errors

### Initial Assessment

Check the Marketing API Access Tier:

By default, apps have `development_access` to the Marketing API. To find out which tier you are in, you can go to the App Review dashboard. You are in the development tier of Marketing API access if you have Limited access of the Marketing API Access Tier feature. You are in the standard tier of Marketing API access if you have Full access of the Marketing API Access Tier feature. You can also check your `HTTP` header and look for `ads_api_access_tier` in your [`X-Ad-Account-Usage`](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#headers), [`X-Business-Use-Case`](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#headers-2) or [`X-FB-Ads-Insights-Throttle`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/best-practices#insightscallload) header.

If you keep getting rate limiting errors, consider upgrading to the `standard_access` tier of Marketing API Access Tier. To get to the standard tier and get a higher rate limit quota, you can click **Upgrade** for the Marketing API Access Tier feature in your App Review dashboard. Your app needs 500+ Marketing API calls in the past 15 days and an error rate below 15% for the last 500 calls.

* **Check Error Codes:** Determine the specific error codes related to throttling in the API response.
* **Check HTTP headers:**
    * [`X-Ad-Account-Usage`](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#headers) contains `acc_id_util_pct`, `reset_time_duration` and `ads_api_access_tier`.
    * [`X-Business-Use-Case`](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#headers-2) contains `call_count`, `total_cputime`, `total_time` and `estimated_time_to_regain_access`, etc. info for the Business Use Case endpoint.
    * [`X-FB-Ads-Insights-Throttle`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights/best-practices#insightscallload) contains `app_id_util_pct`, `acc_id_util_pct` and `ads_api_access_tier` for the Ads Insights API endpoints.
* **Check App Dashboard:** We provide consoles in the App Dashboard that provides developers with in-depth insight into the rate limiting system and helps them diagnose and prevent rate limiting issues.

### Identify the Cause

* **Rate Limits:** Understand Meta Marketing API rate limits for the different endpoints being used and verify if the number of API requests is within the allowed limits for the application.
* **Burst Limits:** Check if burst limits are causing issues during peak usage times. Usually burst traffic will cause Ad Account Level API-Level Limits (**Related error codes:** `17`, `613`).
* **Misoperations:** Investigate if any misoperations are triggering excessive API requests.

### Mitigation Steps

* **Prevent Burst Traffic:** Distribute API requests evenly to avoid throttling caused by a large number of accesses in a short period of time.
* **Optimize Requests:** Combine multiple smaller requests into batch requests, either IDs batch or async request to minimize the total number of API calls.
* **Backoff Strategy:** Implement exponential backoff when receiving throttling errors, gradually increasing the time between retries. You can also examine HTTP headers for the reset time estimation.

#### Other Mitigation Tips

* Understand if there is a need for these calls and reduce them if unnecessary.
* For endpoints supporting async requests such as Ads Insights API, use [Asynchronous Requests](https://developers.facebook.com/documentation/ads-commerce/marketing-api/asyncrequests) to query a huge amount of data.
* You can also try to pass a list of ids if you need to query multiple same types of ad objects.
* For Insights API, use [Level Parameters](https://developers.facebook.com/docs/marketing-api/insights/parameters/v2.7) or filtering to reduce the number of calls.
