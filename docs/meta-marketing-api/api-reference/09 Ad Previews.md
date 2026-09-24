<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/generatepreview | Saved: 2026-09-19 -->

# Ad Previews



Preview existing ads and generate previews of ads you want to create. Generated previews are based on your ad creative. For ad preview **provide a user access token**, not a Page access token. For example, preview existing ad creative:

```bash
curl -X GET \
  -d 'ad_format="DESKTOP_FEED_STANDARD"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CREATIVE_ID>/previews
```

Or preview using creative spec for a domain ad for an external website:

```bash
curl -X GET \
  -d 'creative="<CREATIVE_SPEC>"' \
  -d 'ad_format="<AD_FORMAT>"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/generatepreviews
```

## Generating previews {#html}

There are a few ways to generate a preview, using:

* [Ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup) ID
* [Ad Creative](https://developers.facebook.com/docs/reference/ads-api/adcreative) ID
* Supplying a creative spec

To use an ad ID for an existing ad, use ad's [`previews`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup/previews).

```text
https://graph.facebook.com/<API_VERSION>/<AD_ID>/previews
```

To use an existing ad creative's ID, use the ad creative's [`previews`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-creative/previews).

```text
https://graph.facebook.com/<API_VERSION>/<AD_CREATIVE_ID>/previews
```

To use an [ad creative spec](https://developers.facebook.com/docs/reference/ads-api/adcreative), you have two endpoint options:

* [`/act_<AD_ACCOUNT_ID>/generatepreviews`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/generatepreviews), or
* [`/generatepreviews`](https://developers.facebook.com/docs/graph-api/reference/generatepreviews) — The creative passed in this call should not be associated with a specific ad account.

For Advantage+ catalog ads, pass the entire `object_story_spec` into the `/generatepreviews` endpoint, and also use `product_item_ids` described in [Advantage+ Catalog Ads, Preview](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management#dynamicpreview).

Previews from an ad account are only visible to people who have a role on the ad account. Previews generated using `generatepreviews` edge are visible to anyone.

```text
https://graph.facebook.com/<API_VERSION>/act_<AD_ACCOUNT_ID>/generatepreviews
https://graph.facebook.com/<API_VERSION>/generatepreviews
```

Each of these endpoints returns an [ad preview object](https://developers.facebook.com/docs/marketing-api/reference/ad-preview).

## Examples {#examples}

Create a preview using `object_story_spec`:

```bash
curl -G \
  --data-urlencode 'creative={
    "object_story_spec": {
      "link_data": {
        "call_to_action": {"type":"SIGN_UP","value":{"link":"<URL>"}},
        "description": "Description",
        "link": "<URL>",
        "message": "Message",
        "name": "Name"
      },
      "page_id": "<PAGE_ID>"
    }
  }' \
  -d 'ad_format=DESKTOP_FEED_STANDARD' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/generatepreviews
```

Create a multi-product ad preview using `object_story_id`. To get `object_story_id`, first create a [Multi-Product Ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/videoads).

```bash
curl -X GET \
  -d 'creative={
       "object_story_id": "<PAGE_ID>_<POST_ID>"
     }' \
  -d 'ad_format="DESKTOP_FEED_STANDARD"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/generatepreviews
```

Create an app ad preview using `object_story_spec`. This is the only way to generate a preview for an app ad.

```bash
curl -X GET \
  -d 'creative={
       "object_story_spec": {
         "link_data": {
           "call_to_action": {
             "type": "USE_APP",
             "value": {
               "link": "<URL>"
             }
           },
           "description": "Description",
           "link": "<URL>",
           "message": "Message",
           "name": "Name",
           "picture": "<IMAGE_URL>"
         },
         "page_id": "<PAGE_ID>"
       }
     }' \
  -d 'ad_format="MOBILE_FEED_STANDARD"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/generatepreviews
```

Instagram Explore home Ad Previews using INSTAGRAM_EXPLORE_GRID_HOME ad format

```bash
curl -X GET \
  -d 'ad_format="INSTAGRAM_EXPLORE_GRID_HOME"' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<AD_ID>/previews
```

The request returns a response similar to the following:

```json
{
  "data": [
    {
      "body": "<iframe src=\"https://www.facebook.com/ads/api/preview_iframe.php?d=AQKuwYcWpyFgVKLORPWQi52_uTud4v8PpMoDtyBfntL65i0iFtgkiXWN5S4JMBhq-UMKQmvxXFexVxu-5l5Xbf4WWRP48sCAtn3ArQAXwbdrD5qH0EL2z34K-gAgYyENd80cOGAdhVreKGJZvPkLbjDS3iDkdqdNNJQ6yaAFTmUpaz__cjgmhVVCUW68wU3UOZwqlv376mkijYR57Sm2OlyES4U6ivMPNGDx4xnZEd5d8kWyagDD-lPbCaGEk0nnQF5mnyeV9pFqdByhq-IqN6n0ZhSWjCPXZQa84wu5GNQ70YR2w7QxEYoiWCgI2WP0Z2OPeUMiNOf9bhYB-TBZJZ7G6HylsOnzzII9FQ8-0K-b_Q&t=AQJws9t-TtIGrKoFtCM\" width=\"274\" height=\"213\" scrolling=\"yes\" style=\"border: none;\"></iframe>"
    }
  ]
}
```

Instagram search results Ad Previews using INSTAGRAM_SEARCH_CHAIN ad format

```bash
curl -X GET \
  -d 'ad_format="INSTAGRAM_SEARCH_CHAIN"' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<AD_ID>/previews
```

The request returns a response similar to the following:

```json
{
  "data": [
    {
      "body": "<iframe src=\"https://www.facebook.com/ads/api/preview_iframe.php?d=AQKVMPdwuorP3mliXRaOi0TCSvsGRfucEzBTnB4jghArle84f8kBjvJmX3gmdjniUjohKA3GUppDZqljStZwxxRRxkQl9Y4R1o5wV4zRGE3xO3NHf1_qBbFM_uEIGAnAvptMWo_DLpbiIqIYFMjxbXNELzmZQsR0gnbBjaXM9i6gkI29dnHPqnm4xGvPxo2w8RWeXfWvmik2C96_2PrhrRhh4NKL3SOmFC9JDVsTp9Z6SYDlLVcLJWwpRKmciAZqEMOnMEFgepVTZ39yJ4ZiAMRo76RK9XNVGcornsUBtxI8cZHKtdW7nmj3ivq09_NGGUnFiJdJaPm-Mk-obM3K0QyOvgHKwnmLn7wvMiizJeXPEWAcSBa4DPUFLAO1mSuaKla0VQ6tzAM4BqFU9LJOG1-zZmPec7wKxQGDcrXoCOKfv2xkLyzECc-oDS0JJgvxxlo&t=AQI8ECKvkemIoVDaDrs\" width=\"274\" height=\"213\" scrolling=\"yes\" style=\"border: none;\"></iframe>"
    }
  ],
  "__www_request_id__": "AzCC2RoeSL0rMbSPTYDyDHa"
}
```
