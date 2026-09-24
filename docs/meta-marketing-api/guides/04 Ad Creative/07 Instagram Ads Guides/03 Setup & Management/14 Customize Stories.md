<!-- Source: https://developers.facebook.com/documentation/ads-commerce/instagram/ads-api/guides/customize-stories | Saved: 2026-09-19 -->

# Customize Stories



If you transform a non 9:16 ad creative into a full-screen story format, you can also edit the generated background colors.

You can edit the background color for the top and bottom above and below your ad creative by using a hex color code. You can choose separate colors for the top and bottom.

This feature works for all stories placements across Instagram, Facebook, and Messenger. It is also available for static single image ads, video ads, and ads using placement asset customization.

## Get Started

To use this API, make a `POST` request to `portrait_customizations` under [`AD_ACCOUNT_ID/adcreatives`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adcreatives):

```
portrait_customizations: {
    specifications: [
        {
            background_color: {
                bottom_color: "0D3F0C", // RGB HEX string
                top_color: "CC8400", // RGB HEX string
                },
        },
    ],
}
```

To read your color settings, make a `GET` request to `AD_CREATIVE_ID?fields=portrait_customizations`.

The response looks like this:

```
{
  "portrait_customizations": {
    "specifications": [
      {
        "background_color": {
          "top_color": "0D3F0C",
          "bottom_color": "CC8400"
        }
      }
    ]
  },
  "id": "AD_CREATIVE_ID"
}
```

## Limitations

* Not supported for [Advantage+ creative for catalog](https://developers.facebook.com/docs/marketing-api/asset-feed) ads.
* Not supported for [Collection ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/creative/collection-ads) and [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-ad).

## Resources

* Ads Manager: [Adjust Background Colors for Stories Ads](https://www.facebook.com/business/help/266481863999300?id=1997185213680277)
* Ads Manager: [Create Instagram Stories Ads](https://www.facebook.com/business/help/1639197963055851)
