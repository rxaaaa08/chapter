<!-- Source: https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/url-tags-for-tracking | Saved: 2026-09-19 -->

# Use URL Tags for Tracking



You can track performance of a campaign with an external tool by using the `url_tags` of [ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative) to distinguish different objects.

You can provide your own custom tags in the format of `key=value`, where `key` and `value` can both be customized. These are combined using the `&` character. For example, you might have something like `utm_source=fb&ad=my_ad,` which can be set using:

### PHP Business SDK
```
...
$creative->setData(array(AdCreativeFields::URL_TAGS => 'utm_source=fb&ad=my_ad',));

$creative->create();
```

Facebook also provides special macros that can be used in the `value` position of the format above. To have the ad's name automatically filled in, you can utilize the `{{ad.name}}` macro, which will be dynamically replaced when the ad is rendered with the name of the ad. For example, you create an ad named `summer_2019`, and set the `url` tag to `ad_name={{ad.name}}`. When the ad link is rendered for the viewer, they will see `ad_name=summer_2019`.

### PHP Business SDK
```
...
$creative->setData(array(AdCreativeFields::URL_TAGS => 'ad_name={{ad.name}}',));

$creative->create();
```

You can use a few different macros to help with tracking your campaigns:

* `{{campaign.id}}`
* `{{adset.id}}`
* `{{ad.id}}`
* `{{campaign.name}}`
* `{{adset.name}}`
* `{{ad.name}}`

Name-based parameters have special functionality. When you first publish your object, we store the name values used in a snapshot. When you use a name-based parameter in the tags for that object, Facebook then pulls from the snapshot rather than the live value.

## Resources

- Business Help Center: [URL Parameters](https://www.facebook.com/business/help/1016122818401732)
