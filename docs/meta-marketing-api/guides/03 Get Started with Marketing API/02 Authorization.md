<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization | Saved: 2026-09-19 -->

# Authorization


**Warning:** **Ads Management Standard Access is now Marketing API Access Tier**

**No code changes are needed.**

Tier labels have been updated: "Standard Access" is now **Limited Access**, and "Advanced Access" is now **Full Access**. The revised qualification threshold for Full Access has been reduced from 1,500 to **500 Marketing API calls** in the past 15 days. The underlying permission identifier remains the same, and existing access levels are preserved automatically. Learn more in the [Marketing API Access Tier documentation](https://developers.facebook.com/docs/features-reference#marketing-api-access-tier).

The authorization process verifies the users and apps that will be accessing the Marketing API and grants them permissions.

## App Roles

In your app's dashboard, you can set roles for yourself or team members as necessary: Admin, Developer, Tester.

**Note:** Depending on your intended use case, you may need to submit your app for review to gain access to specific permissions related to ad management.

## Access Levels, Permissions, and Features

Business apps are subject to an additional layer of Graph API authorization called [access levels](https://developers.facebook.com/docs/graph-api/overview/access-levels). During [App Review](https://developers.facebook.com/docs/app-review), your app must also request specific permissions and features.

**Warning:** All developers must follow all Meta [Platform Terms](https://developers.facebook.com/terms) and [Developer Policies](https://developers.facebook.com/devpolicy). **Calls on ANY access level are against production data.**

### Marketing API Access Levels vs. Marketing API Access Tier

Permissions and features for apps have two different access levels: standard access and advanced access (**Note:** The use of the term "standard access" here refers to platform-wide access levels and is not related to the [Marketing API Access Tier](https://developers.facebook.com/docs/features-reference#marketing-api-access-tier), which has its own tiers: "Limited access" and "Full access".) To upgrade your Marketing API Access Tier, your app must meet the requirements shown in the App Dashboard.

#### Marketing API Access Tier overview

The Marketing API Access Tier controls your rate limits, Business Manager access, and system user capacity. Your tier is determined by whether your app has been approved through App Review.

|  | Limited access (default) | Full access (after App Review) |
| --- | --- | --- |
| **How to get** | Automatically granted when you add the Marketing API product to your app. | Click **+Upgrade** for the Marketing API Access Tier feature in your App Dashboard. Your app must meet the [requirements below](#get-full-access). |
| **Rate limits** | Heavily rate-limited per ad account. For development only. Not for production apps running for live advertisers. | Lightly [rate limited](https://developers.facebook.com/documentation/ads-commerce/marketing-api/overview/rate-limiting) per ad account. |
| **Account limits** | Manage an unlimited number of ad accounts. App admins or developers can make API calls on behalf of ad account admins or advertisers. | Manage an unlimited number of ad accounts, assuming you get `ads_read` or `ads_management` permission from the ad account. |
| **Business Manager** | Limited access to [Business Manager](https://developers.facebook.com/docs/business-manager-api) and [Catalog](https://developers.facebook.com/documentation/ads-commerce/catalog) APIs. No Business Manager access to manage ad accounts, user permissions, and Pages. | Access to all [Business Manager](https://developers.facebook.com/docs/business-manager-api) and [Catalog](https://developers.facebook.com/documentation/ads-commerce/catalog) APIs. |
| **System users** | Can create 1 [system user](https://developers.facebook.com/docs/marketing-api/system-users) and 1 admin system user. | Can create 10 [system users](https://developers.facebook.com/docs/marketing-api/system-users) and 1 admin system user. |
| **Page creation** | Cannot create Pages through the API. | Cannot create Pages through the API. |

To check your current access level, go to **App Dashboard** > **App Review** > **Permissions and Features**.

### Permissions and Features

#### Permissions
The permissions you should request change depending on which API you want to access.

If your app is only managing your ad account, standard access to the `ads_read` and `ads_management` permissions are sufficient. If your app is managing other people's ad accounts, you need advanced access to the `ads_read` and/or `ads_management` permissions. See all [available permissions for business apps](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types#available-permissions-2).

#### Features
The features you should request change depending on how you want to use our APIs. If you're managing ads, a common feature to request is Marketing API Access Tier. See [all available features for business apps](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types#available-features-2).

##### Feature access levels

| Feature Access Level | Description |
| --- | --- |
| [Standard access](https://developers.facebook.com/docs/graph-api/overview/access-levels#standard-access) | Business apps are automatically approved for standard access for all permissions and features available to the Business app type.<br><br>Use this option if you're getting started. You can build end-to-end workflows before requesting full permissions, and you can access an unlimited number of ad accounts.<br><br>Some API calls may not be available with standard access because they may belong to multiple accounts or the affected account can't be identified programmatically. |
| [Advanced access](https://developers.facebook.com/docs/graph-api/overview/access-levels#advanced-access) | Advanced access must be approved through the [App Review](https://developers.facebook.com/docs/app-review) process on an individual permission and feature basis.<br><br>1. To request advanced access, go to your app's dashboard and click **App Review** > **Permissions and Features**.<br>2. Find the permission or feature you would like to access and, under **Action**, click **Request advanced access**. You can select one or more features. Once you have selected your options, click **Continue the Request**. You'll be taken to a screen that guides you through the submission process.<br><br>After you submit your information, Meta responds with an approval or denial and additional information if your app is not qualified for standard access.<br><br>If you're approved for advanced access, you need to do the following to maintain your status:<br><br>* Have successfully made at least 500 Marketing API calls in the last 15 days.<br>* Have made Marketing API calls with an error rate of less than 15% in the last 500 calls.<br><br>**Note:** These requirements also apply to upgrading your Marketing API Access Tier from Limited access to Full access. See [Get Full access](#get-full-access) for details. |

##### Get Full access

In order to get Full access of Marketing API Access Tier, your app needs to meet these requirements:

* Have successfully made at least 500 Marketing API calls in the last 15 days.
* Have made Marketing API calls with an error rate of less than 15% in the last 500 calls.

If you're managing someone's ads, use the `scope` parameter to prompt them for the `ads_management` or `ads_read` permissions. Your app gets access when they click **Allow**.

```html
https://www.facebook.com/v25.0/dialog/oauth?
  client_id=<YOUR_APP_ID>
  &redirect_uri=<YOUR_URL>
  &scope=ads_management
```

**Note:** When inputting the `YOUR_URL` field, put a trailing `/` (for example, http://www.facebook.com/).

##### Example Use Cases

| Use Case | What To Request |
| --- | --- |
| You want to read and manage ads for ad accounts you own or have been granted access to by the ad account owner. | * **Permission:** `ads_management`<br>* **Feature:** Marketing API Access Tier |
| You want to read ad reports for ad accounts you own or have been granted access to by the ad account owner. | * **Permission:** `ads_read`<br>* **Feature:** Marketing API Access Tier |
| You want to pull ad reports from a set of clients and to both read and manage ads from another set of clients. | * **Permissions:** `ads_management` and `ads_read`<br>* **Feature:** Marketing API Access Tier |

## Business Verification

Business verification is a process that allows us to verify your identity as a business entity, which we require if your app will access sensitive data. Learn more about the [Business Verification](https://developers.facebook.com/docs/apps/business-verification) process.

## Learn More

- [Permissions Reference for Meta Technologies APIs](https://developers.facebook.com/docs/permissions)

