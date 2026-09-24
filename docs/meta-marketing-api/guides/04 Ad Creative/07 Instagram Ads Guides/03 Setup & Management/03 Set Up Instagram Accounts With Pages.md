<!-- Source: https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/pages-ig-account | Saved: 2026-09-19 -->

# Set Up Instagram Accounts With Pages



To run ads on Instagram, you need an Instagram Account ID. We recommend that you get that ID through a [Business Manager setup](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/ig-accounts-with-business-manager). But you can also use Facebook Pages. You have two options:

* [Page-Connected Instagram Accounts](#via_page): Connect the Instagram account to a Facebook Page. This is a simple option for small businesses.
* [Page-Backed Instagram Accounts](#pbia): Create a "shadow" Instagram account backed by a Facebook Page.

## Page-Connected Instagram Accounts {#via_page}

In this implementation, your business needs to have a Business Account on Instagram —see [Set Up a Business Account on Instagram](https://www.facebook.com/help/502981923235522). Your account needs to have a profile image and cannot be a [Private Account](https://help.instagram.com/138925576505882).

Once you have your Instagram account, you should connect it to your Facebook Page —see [How do I connect my Facebook Page and Instagram account?](https://www.facebook.com/help/1148909221857370). Then, anyone with an `advertiser` role on this Page can run ads for the account.

### Get Account ID

Once you connect an Instagram account to a Page, you can see the connection at the Page Settings UI, but you cannot see the Instagram account ID.

To get the Instagram account ID, call the [Page Instagram Accounts API](https://developers.facebook.com/docs/graph-api/reference/page/instagram_accounts) with page access token:

```
curl -G \
-d "access_token=<ACCESS_TOKEN>"\
-d "fields=id,username,profile_pic" \
"https://graph.facebook.com/<API_VERSION>/<PAGE_ID>/instagram_accounts"
```

The result contains one Instagram account object, including fields like `id`, `username`, and `profile_pic`. Save this `id` to use in your ads.

### Create Ads

You can use any ad accounts, either owned by an individual or by a business, as far as you have access, to create ads for page-connected Instagram accounts. You have the following limitations:

* You need to have at least an `advertiser` role on the related Page but no role is needed on the Instagram account.
* When you provide ad creative, you should provide an `instagram_user_id` and a `page_id`. If `instagram_user_id` is the Instagram account id of a page-connected Instagram account, you must use the page's ID as `page_id`. You cannot use a page-connected account with another page in ad creative.

A page can have only one page-connected Instagram account, as well as only one [Page-backed Instagram account](#pbia).

## Page-backed Instagram Account {#pbia}

You typically create Instagram accounts to run ads with these accounts, post or comment with that profile, and build your community organically. Some advertisers do not want to create and maintain Instagram accounts for simplicity, or they may want to deliver ads and organic content by different Instagram accounts.

In this case, you can use Page-backed Instagram accounts (PBIA). You can create these accounts with the API and use them to create ads on Instagram. This approach functions as if you are running ads for a Facebook Page, however we create a "shadow" Instagram account to run those ads.

### Create PBIA {#pbia_create}
To create a Page-backed Instagram account with a Facebook Page, you need to have at least an `ADVERTISER` role on this page. `MANAGER` or `CONTENT_CREATOR` also work.

Additionally, your Page should not have a previously set PBIA, as each page can only have one PBIA. If you already have a PBIA, use the existing one. Anyone with access to the page can also access the PBIA. [Check whether a specific page has a PBIA before you create a new one](#read).

To create a PBIA, send a `POST` request to:

```
curl \
-F "access_token=<ACCESS_TOKEN>"\
"https://graph.facebook.com/<API_VERSION>/<PAGE_ID>/page_backed_instagram_accounts"
```

This returns an Instagram account ID on success. If a page already has a PBIA, the call returns the existing PBIA ID. Save that ID to run your ads.

### Read PBIA {#read}
To see if a Facebook Page has a PBIA, send a `GET` request:

```
curl -G \
-d "access_token=<ACCESS_TOKEN>"\
-d "fields=username,profile_pic" \
"https://graph.facebook.com/<API_VERSION>/<PAGE_ID>/page_backed_instagram_accounts"
```

This returns an Instagram account object, as [described in Business Manager setup](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/ig-accounts-with-business-manager#account_api), if there is one. The object includes an `ID` that can be used to run Instagram Ads.

If there is no PBIA already setup, the API returns an empty response.

### Use PBIA in Ad Creative {#use-in-creative}

Once a PBIA is created, you can use its ID as the `instagram_user_id` in your ad creative, as you do with other types of Instagram accounts.

You do not need to assign ad accounts to the PBIA. When you provide ad creative using a PBIA, you can use any ad accounts that you have access to, and you need to have at least the `ADVERTISER` role on the Page backing this PBIA.

The `page_id` of your ad creative must be for page associated with this PBIA.

**Note:** When you use an ad account not owned by a business via Business Manager, if a page has a page-connected Instagram account, you cannot use its PBIA to create ads. You must use that page-connected Instagram account. When you create ads for an ad account owned by a business, this restriction does not apply.

This Instagram account has the same name and profile picture as the related page. If someone changes the page name or profile picture, we automatically update the "shadow" Instagram account.

**You cannot login to this Instagram account to manage posts.** To see or manage "comments" and "likes" of your ad posts, you can:

*    Get the `instagram_permalink_url` [from your ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instagramads/get-started#adpreview), then view the ad post. You cannot add post or comment with this PBIA profile.
*    Use [Ads Manager](https://business.facebook.com/adsmanager/manage) to see comments and delete comments of the ad post.
*    Use [Instagram Ads Post Moderation API](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/carousel-ads) to get comments and delete comments of the ad post. You cannot add post or comment with this API.

## Comparison

| Requirements | Business Manager Setup | Page's Instagram Account | Page-Backed Instagram Account |
| --- | --- | --- | --- |
| Advertiser needs to have an Instagram account | Yes | Yes | No |
| Advertiser needs to have Business Manager set up | Yes | No | No |
| Require some manual steps on Facebook interfaces | Yes, to claim an Instagram account to BM. | Yes, to claim an Instagram account to Page. | No |
| Can add post (media) | Yes, with App | Yes, with App | No |
| Can comment as the Instagram profile | Yes, with App or [Marketing APIs](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/carousel-ads#posts) | Yes, with App or [Marketing APIs](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/carousel-ads#posts) | No |
| Can read or delete comments for ad posts (media) using [APIs](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/carousel-ads) | Yes | Yes | Yes |
| Can run ads with an ad account owned by a user | No | Yes | Yes |
| Can run ads with an ad account owned by a business | Yes | Yes | Yes |

## Connection Objects {#co}

Once you create an Instagram account, you cannot use [Connection Objects](https://developers.facebook.com/docs/marketing-api/connectionobjects) to view these accounts. You should use assets under business instead of `connection objects`.

For Instagram accounts, use the following endpoints:

- `{business_id}/instagram_accounts`
- `act_{adaccount_id}/instagram_accounts`
- `{page_id}/instagram_accounts`

