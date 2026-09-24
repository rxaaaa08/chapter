<!-- Source: https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/use-posts-as-ads | Saved: 2026-09-19 -->

# Use Posts as Instagram Ads



Create Instagram ads from Instagram or Facebook posts.

## Limitations

* Media posts containing copyrighted musics or interactive elements such as filters can not be boosted.

## Instagram Posts

You can create ads from Instagram feed posts containing a single photo, video, carousel, or reel (tagged photos and videos are supported) or active Instagram Stories. You can also create ads from feed posts containing feed images, carousels, and existing videos with product tags. Currently, you cannot create ads from Instagram TV posts.

### Step 1: Obtain Instagram User ID {#ig-posts-step-1}

You can obtain the Instagram User ID (IG User) via the [Instagram API](https://developers.facebook.com/docs/instagram-api/reference/ig-user)

#### Instagram Graph API {#graph-api}
Obtain an Instagram Business or creator account's user ID by using the `instagram_business_account` field on the relevant Facebook Page. See [Instagram Graph API, Getting Started](https://developers.facebook.com/docs/instagram-api/getting-started).

#### Instagram Ads API {#ads-api}

Use the Marketing API to obtain the user ID for the Instagram account connected to a specific ad account or page. Get that information by querying the following endpoints:

- [`{ad_account_id}/connected_instagram_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/connected_instagram_accounts) — Get user ID for Instagram accounts connected to an ad account.
- [`{business_id}/instagram_business_accounts`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/instagram_business_accounts) — Get user ID for Instagram accounts connected to a business.

If you need to connect your Instagram account, see [Add an Instagram Account to Your Business Manager](https://www.facebook.com/business/help/620548115562686) and [What happens when I connect my Instagram account and a Facebook Page that I manage?](https://help.instagram.com/402748553849926).

### Step 2: Find the Post You Want to Promote and Check Its Eligibility  {#ig-posts-step-2}

To obtain the ID for the relevant Instagram post ([IG Media](https://developers.facebook.com/docs/instagram-api/reference/ig-media)) that you would like to use as an ad, use the Instagram Graph API's [media endpoints](https://developers.facebook.com/docs/instagram-api/reference/ig-user/media). To obtain the ID for the relevant Instagram story that would like to use as an ad, use the Instagram Graph API's [stories endpoint](https://developers.facebook.com/docs/instagram-api/reference/ig-user/stories).  This ID will be used as the `source_instagram_media_id` in your ad.

You can use the `boost_eligibility_info` field to determine whether media is eligible to be boosted as an ad.

If you already have an ad creative set up using an Instagram post, check the original media ID for that post by querying `{ad_creative_id}/source_instagram_media_id`.

### Step 3: Create Your Ads

To create your ads, complete the process described on [Instagram Ads API, Get Started](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/instagramads/get-started) up until **Step 3: Create Ad Set**. For **Step 4: Provide Ad Creative and Create Ad**, make the following changes:

- Instead of specifying `instagram_user_id` in the creative spec, set `instagram_user_id` as the Instagram user ID you got in [Step 1: Obtain Instagram User ID](#ig-posts-step-1). For example:

```js
{
"object_id":"<object_id>", // page id
"instagram_user_id":"<IG_USER_ID>",
"source_instagram_media_id":"<source_instagram_media_id>"
}
```

- Specify `source_instagram_media_id` as the media ID you got from [Step 2: Find the Post You Want to Promote](#ig-posts-step-2). For example:

```html
curl -i -X POST \
"https://graph.facebook.com/v<API_VERSION>/act_<AD_ACCOUNT>/adcreatives
?object_id=<PAGE_ID>
&instagram_user_id=<IG_USER_ID>
&source_instagram_media_id=<IG_ORGANIC_MEDIA_ID>
&access_token=<API_ACCESS_TOKEN>"
```

- If you would like, you can update the [`call_to_action`](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/reference/data-cta-requirements) field for your promotion. For example:

```html
curl -i -X POST \
"https://graph.facebook.com/v<API_VERSION>/act_<AD_ACCOUNT>/adcreatives
?object_id=<PAGE_ID>
&instagram_user_id=<IG_USER_ID>
&source_instagram_media_id=<IG_ORGANIC_MEDIA_ID>
&call_to_action="{'type':'LEARN_MORE','value':{'link': '<YOUR_LINK>'}}"
&access_token=<API_ACCESS_TOKEN>"
```

#### Call to action

You can set the call to action depending on its destination: [Instagram](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-instagram), [Messenger](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-messenger), or [mutlidestination](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-multidestination).

##### Click to Instagram

```html
"call_to_action": {
"value": {"app_destination":"INSTAGRAM_DIRECT"},
"type": "MESSAGE_PAGE"
}
```

##### Click to Messenger

```html
"call_to_action": {
"value": {"app_destination":"MESSENGER"},
"type": "MESSAGE_PAGE"
}
```

##### Click to multidestination

```html
"asset_feed_spec": {
"optimization_type": "DOF_MESSAGING_DESTINATION",
"call_to_actions": [
{
"type": "MESSAGE_PAGE",
"value": {
"app_destination": "MESSENGER",
"link": "https://fb.com/messenger_doc/"
}
},
{
"type": "INSTAGRAM_MESSAGE",
"value": {
"app_destination": "INSTAGRAM_DIRECT",
"link": "https://www.instagram.com"
}
}
]
}
```

See the [Asset Feed Spec documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/asset-feed-spec) for more information.

Once you have provided your ad creative, [create your ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#book-ad). You also have the option of providing your creative as you create your ads —without having to separate the process in two steps.

## Facebook Posts

**Note:** Not all Facebook posts work as Instagram ads.

You can boost your Instagram content by using an existing Facebook Feed post or Story as part of your ad's creative. To know whether a post can be used for ads, make the following API call:

```html
curl -G \
-d "access_token=<ACCESS_TOKEN>"\
-d "fields=is_instagram_eligible"\
"https://graph.facebook.com/<API_VERSION>/<POST_ID>"
```

If your response includes `"is_instagram_eligible": true`, you can start creating your ad.

### Call to action

```html
curl -i -X POST \
  "https://graph.facebook.com/v25.0/act_<AD_ACCOUNT>/adcreatives
  ?object_story_id=<postOwnerID_postID>
  &instagram_user_id=<IG_USER_ID>
  &call_to_action="{'type':MESSAGE_PAGE,'value':{'app_destination':'MESSENGER'}}"
  &access_token=<ACCESS_TOKEN>"
```

Where `object_story_id` is the post ID in the format of `postOwnerID_postID` and `instagram_user_id` is either a Page-connected Instagram account ID or the Page-backed Instagram account ID. See more details in [Set Up Instagram Accounts With Pages](https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/pages-ig-account).

## Troubleshooting

* If you encounter an error stating "Creative Must Provide enroll_status for Standard Enhancements", refer to [Standard Enhancements for Advantage+ Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads/standard-enhancements) for more information.

* If you are promoting a Facebook post with an `instagram_user_id` in the ad creative and the ad set includes both Facebook and Instagram placements, you may encounter and error stating "Creative is missing DOF spec" or "Creative should have degrees_of_freedom spec for multi-destination ads". Add `"optimization_type": "DOF_MESSAGING_DESTINATION"` to the `asset_feed_spec` parameter in the ad creative.

## Learn More

* [Ads that Click to Instagram](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-instagram)
* [Ads that Click to Messenger](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-messenger)
* [Ads that Click to Multidestination](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/messaging-ads/click-to-multidestination)
