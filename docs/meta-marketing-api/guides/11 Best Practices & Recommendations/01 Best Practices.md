<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices | Saved: 2026-09-19 -->

# Best Practices



## Ad changes triggering ad reviews

If you make any changes to the following scenarios, your ad will be triggered for review:

* Any changes to your creative (image, text, link, video, and so on)
* Any changes to targeting
* Any changes of optimization goals and billing events may also trigger review

**Note**: Changes to bid amount, budget, and ad set schedule will not have any effect on the review status.

Additionally, if an ad enters Ad Review with the run status of "Paused", then it will remain Paused upon exiting Ad Review. Otherwise, the ad will be considered Active and ready to deliver.

## Pagination {#paging}

For paging response data, see the [Graph API Pagination](https://developers.facebook.com/docs/graph-api/results).

##  User information

You should store user IDs, session keys, and the ads account ID so it is easy to programmatically access them and keep them together. This is important because any calls made with an account ID belonging to one user and the session key for another user will fail with a permissions error. Any storages of user data must be done in compliance with [Facebook Platform Terms](https://developers.facebook.com/terms) and [Developer Policies](https://developers.facebook.com/devpolicy).

##  Suggested Bids

Run frequent reports on your campaigns, as suggested bids change dynamically in response to bidding by competitors using similar targeting. Bid suggestions get updated within a few hours, depending upon the bidding of competitors.

##  Batch requests

Make multiple requests to the API with a single call, see:

* [Multiple Requests](https://developers.facebook.com/docs/graph-api/making-multiple-requests)
* [Batch Requests](https://developers.facebook.com/documentation/ads-commerce/marketing-api/asyncrequests)

You can also query for multiple objects by ID as follows:

```
https://graph.facebook.com/<API_VERSION>?ids=[id1,id2]
```

To query for a specific field:

```
https://graph.facebook.com/<API_VERSION>?ids=[id1,id2]&fields=field1,field2
```

## Check data changes using ETags

Quickly check if the response to a request has changed since you last made it, see:

* [ETags blog](https://developers.facebook.com/blog/post/627/)
* [ETags Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/asyncrequests)

## Object archive and delete status

Ad objects have two types of delete states: archived and deleted. You can query both archived and deleted objects with the object id. However, deleted objects are not returned if you request them from another object's edge.

You can have up to 5000 archived objects at any time. You should move ad objects from archived states to deleted states if you no longer need to retrieve them via edges. To learn how states work and for sample calls see [Storing Ad Objects](https://developers.facebook.com/documentation/ads-commerce/marketing-api/best-practices/manage-your-ad-object-status).

## Viewing errors

People make mistakes and try to create ads that are not accepted, [Error Codes](https://developers.facebook.com/documentation/ads-commerce/marketing-api/error-reference) provide reasons an API call failed. You should share some form of the error to users so they can fix their ads.

## Facebook Marketing Developer Community group

Join [Facebook Marketing Developer Community](https://www.facebook.com/groups/pmdcommunity/) group on Facebook for news and update on for Marketing API. Posts from the [Marketing API blog](https://developers.facebook.com/ads/blog/) are shared to the group.

## Testing {#testing}

Sandbox mode is a testing environment to read and write Marketing API calls without delivering actual ads. See [Sandbox Mode for Developers](https://developers.facebook.com/ads/blog/post/2016/10/19/sandbox-ad-accounts/)

Try API calls with [Graph API Explorer](https://developers.facebook.com/tools/explorer). You can try any API call you would like to make to the Marketing API, see [blog post](https://developers.facebook.com/blog/post/517/). Select your app in `App`, and grant your app  `ads_management` or `ads_read` permission in `extended permissions` when you create an access token. Use `ads_read` if you only need Ads Insights API access for reporting. Use `ads_management` to read and update ads in an account.

For [development and basic access](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization), configure a list of ad accounts your app is able to make API calls for, see [account list](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization?#standard_accounts).

You can use sandbox mode to demonstrate your app for app review. However in sandbox mode you cannot create ads or ad creative. Therefore you should use hard coded ad IDs and ad creative IDs to demonstrate your use of our API for app review.

### Basic criteria {#criteria}
- Demonstrate value beyond Facebook's core solutions, such as [Facebook Ads Manager](https://www.facebook.com/ads/manager/).

- Focus on business objectives, such as increase in sales. Facebook business objectives can be found [here](https://developers.facebook.com/docs/reference/ads-api/guides/chapter-2-objective-connections).

## Policies {#policies}
Understand the API policies; Facebook has the right to audit your activity anytime:

* **[Platform Terms](https://developers.facebook.com/terms)**
* **[Developer Policies](https://developers.facebook.com/devpolicy)**
* **[Promotion Policies](https://www.facebook.com/page_guidelines.php#promotionsguidelines)**  
* **[Data Use Policy](https://www.facebook.com/full_data_use_policy)**  
* **[Statement of Rights and Responsibilities](https://www.facebook.com/legal/terms)**  
* **[Advertising Guidelines](https://www.facebook.com/ad_guidelines.php)**

Be ready to adapt quickly to changes. Most changes are [versioned](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/versioning) and change windows are 90 days, ongoing.

In [Statement of Rights and Responsibilities](https://www.facebook.com/legal/terms), you are financially and operationally responsible for your application, its contents, and your use of the Meta Platform and the Ads API. You should manage your app's stability and potential bugs.
