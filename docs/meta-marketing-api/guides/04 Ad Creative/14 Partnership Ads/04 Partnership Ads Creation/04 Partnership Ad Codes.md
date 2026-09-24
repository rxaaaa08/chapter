<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/ad-codes | Saved: 2026-09-19 -->

# Partnership Ad Codes



You can get a unique ad code to share with your partner to allow them to boost your content, including archived content, into [partnership ads](https://help.instagram.com/292748974937716/?helpref=uf_share) that feature both of your accounts in the header.

If organic content has been previously boosted as a partnership ad or a regular ad on Instagram, that content can no longer be edited, but it can be boosted again.

## Permissions

* `instagram_basic`
* `instagram_branded_content_creator` scoped on the creator's Instagram account ID
* `business_management`

## How partnership ad codes work for creators

* Allow brand partners to run ads with you — Sharing an ad code allows your brand partner to boost content, including archived content and hidden [Collab posts](https://help.instagram.com/5861247717337470/?helpref=uf_share), as a partnership ad.
* Tag brand partners in your branded content — If a post, story, or reel is branded content, your brand partner will be tagged as the paid partner and will replace any existing paid partner. [Learn more about branded content on Instagram.](https://help.instagram.com/128845584325492/?helpref=uf_share)
* The post doesn't display as an ad on your profile — The ad won't be visible on your profile, but it may appear as posted from your account instead of your partner's if viewers are more likely to respond to it.
* The ad will be listed in the Meta Ads Library — Meta's Ad Library is a public database of ads running across Meta technologies and shows all active and public branded content that's running on Facebook and Instagram. [Learn more about the Meta Ad Library.](https://www.facebook.com/business/help/2405092116183307?id=288762101909005&helpref=faq_content)

See [Create an Instagram partnership ad code to share with partners](https://help.instagram.com/797201308253238/?helpref=uf_share) for more information.

### Obtain a partnership ad code

To obtain a partnership ad code to share with your brand partner:

1. Get the Instagram media ID of the branded content to be boosted as a partnership ad.
2. Create an ad code for the selected media. You can also delete ad codes from selected media, if needed.

**Note:** The ad code can be used for ads creation in Ads Manager or via the Partnership Ads API.

## Create a partnership ad code

You can create an ad code for media you own with a `POST` call to the `/{ig-media-id}/partnership_ad_code` endpoint.

### Example request

```bash
curl -i -X POST \
  -F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v25.0/<IG_MEDIA_ID>/partnership_ad_code"
```

### Example response

```json
{
  "ad_code": "<AD_CODE>"
}
```

## Delete a partnership ad code

You can remove an ad code from media you own by making a `DELETE` call to the `{ig-media-id}/partnership_ad_code` endpoint.

### Example request

```bash
curl -i -X DELETE \
  -F "access_token=<ACCESS_TOKEN>" \
"https://graph.facebook.com/v25.0/<IG_MEDIA_ID>/partnership_ad_code"
```

### Example response

```json
{
  "success": true
}
```
