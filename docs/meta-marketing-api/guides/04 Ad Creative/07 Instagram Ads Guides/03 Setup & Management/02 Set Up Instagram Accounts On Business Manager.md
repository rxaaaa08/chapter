<!-- Source: https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/ig-accounts-with-business-manager | Saved: 2026-09-19 -->

# Set Up Instagram Accounts On Business Manager



**Note:** Before you start running ads on Instagram, you need an Instagram account ID. There are multiple methods to set this up, but we recommend that you use the [Business Manager](https://developers.facebook.com/docs/business-manager-api) process described in this guide.

The Business Manager offers a single interface for you to manage your Instagram presence. In addition to running ads, you can use it to add non-advertising posts, reply to comments as your Instagram profile, and so on.

Use this guide to set up your Instagram accounts on Business Manager:

- Step 1: [Create a business account on Instagram](#before-you-start).
- Step 2: [Use the Business Manager to claim the ownership of your account](#claim_account).
- Optional Step 3: [If you are using a third party to run ads on behalf of your business, assign it as an agency](#assign_account).
- Step 4: [To fund your ads, assign one or more ad accounts to your Instagram accounts](#assing_ad_account).
- Step 5: You need your Instagram account ID to run your ads. [Get all Instagram accounts associated with a business to get this information](#account_api).

## Step 1: Create a Business Account on Instagram {#before-you-start}

In this implementation, your business needs to have a Business Account on Instagram. See [Set Up a Business Account on Instagram](https://www.facebook.com/help/502981923235522).  

## Step 2: Use Business Manager to Claim Instagram Accounts {#claim_account}

To claim an Instagram account for a business, you need the username and password of the account. See [Add an Instagram Account to Your Business Manager](https://www.facebook.com/business/help/620548115562686).

## Optional Step 3: Assign Agency {#assign_account}

If an advertiser owns an Instagram account and a third party wants to run ads on its behalf, assign it as an partner. From the Business Manager, click on **Assign Partners** and enter the agency's business ID.

See [Advertise on Behalf of Another Business](https://www.facebook.com/business/help/375950529870841) for more information.

## Step 4: Assign Ad Accounts {#assing_ad_account}

**Note:** If you already have an Instagram account and are using the following steps as a guide, be aware that the `InstagramUserID` endpoint is deprecated for v22.0 and will be deprecated for all versions April 21, 2025. You can use the [`IGUserID` endpoint](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user) from the Instagram Platform instead.

Once you have access to an Instagram Account in Business Manager, you can assign one or more ad accounts to it. From the Business Manager, select your Instagram account, click on **Add Assets**, and select the ad accounts you want to associate.

You can also do this API by sending a `POST` request with `business` and `account_id`. You must be at least an `ADMIN` of the business.

The ad account needs to:

- Be owned by this business, or
- Be accessible by this business while being owned by the business that owns the Instagram account.

For example, if your business gets access to an ad account and an Instagram account from a client, you can assign them together within your business. But you cannot assign an ad account belonging to one client's business to an Instagram account belonging to another business, even if your business have admin access to both of them.

```
curl \
-F "access_token=<ACCESS_TOKEN>"\
-F "business=<BUSINESS_ID>"\
-F "account_id=<AD_ACCOUNT_ID>"\
"https://graph.facebook.com/<API_VERSION>/<IG_USER_ID>/authorized_adaccounts"
```

You can see which ad accounts for a given business are associated with an Instagram account. You must provide the `business` parameter and must be at least an `EMPLOYEE` of this business. We only return ad accounts of the given business and those accounts associated with the given Instagram account. If this Instagram account is associated with ad accounts of other businesses, you won't get them in the response. You can send a `GET` request:

```
curl -G \
-d "access_token=<ACCESS_TOKEN>"\
-d "business=<BUSINESS_ID>"\
"https://graph.facebook.com/<API_VERSION>/<IG_USER_ID>/authorized_adaccounts"
```

After assigning an ad account, all users of the business who can run ads for that account can run ads on the associated Instagram account.

## Step 5: Get Associated Accounts {#account_api}

To check all the Instagram accounts that are owned by a business or that can be accessed by a business, make a `GET` request:

```
curl -G \
-d "access_token=<ACCESS_TOKEN>"\
-d "fields=username,profile_pic" \
"https://graph.facebook.com/<API_VERSION>/<BUSINESS_ID>/instagram_accounts"
```

The access token is associated with an app. In order to call this API, you need:

- `STANDARD` [access level](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authorization) for the app, or
- The business you are querying for should own that app

To check all the Instagram accounts associated with an ad account, make a `GET` call to:

```
curl -G \
-d "access_token=<ACCESS_TOKEN>"\
-d "fields=username,profile_pic" \
"https://graph.facebook.com/<API_VERSION>/act_<ADACCOUNT_ID>/instagram_accounts"
```

The response of the two previous API calls contains an array of Instagram accounts, each may contain the following fields:

| Field Name | Description |
| --- | --- |
| `id`<br><br>type: numeric string | The Instagram account id. Required for creating ads |
| `username`<br><br>type: string | The Instagram user name |
| `profile_pic`<br><br>type: string | A URL pointing to the profile picture of this Instagram account |

For example:

```
{
  "data": [
    {
      "username": "jaspersmarket",
      "profile_pic": "https://igcdn-photos-a-a.akamaihd.net/hphotos-ak-xaf1/t51.2885-19/11311930_826942667396992_856534255_a.jpg",
      "id": "1023317097692584"
    }
  ],
  "paging": {
    "cursors": {
      "before": "MTM4OTY1MDkwNzkyMTE4NQ==",
      "after": "MTAyMzMxNzA5NzY5MjU4NA=="
    }
  }
}
```

You cannot grant permissions to someone directly from an Instagram account. Instead, you should grant someone permissions to the Page or business which is connected to the Instagram account. Anyone in your business who has permission to run ads using an ad account linked to an Instagram account, can also run ads for that Instagram account.

To create ad units, you can use the access token of a user or [system user](https://www.facebook.com/business/help/327596604689624) who can access the associated ad account.

## Connection Objects {#co}

Once you create an Instagram account, you cannot use [Connection Objects](https://developers.facebook.com/docs/marketing-api/connectionobjects) to view these accounts. You should use assets under business instead of `connection objects`.

For Instagram accounts, use the following endpoints:

- `{business_id}/instagram_accounts`
- `act_{adaccount_id}/instagram_accounts`
- `{page_id}/instagram_accounts`

