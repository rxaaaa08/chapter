<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/advantage-catalog-ads-for-leadgen | Saved: 2026-09-19 -->

# Advantage+ Catalog Ads for Lead Generation



Generate leads with your [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-ads). If you have a [product catalog](https://developers.facebook.com/documentation/ads-commerce/catalog) ready and run Advantage+ catalog ads, you can collect leads with your ads on Facebook. Facebook selects the most relevant items in your product set, as with all Advantage+ catalog ads, and displays a lead generation form when someone clicks on an item.

When you download leads via the API or as a file, the response includes a `retailer_item_id`. This indicates which items someone clicked on and submitted their lead information for.

## Create Advantage+ catalog ads for lead generation

Create a campaign with the `objective` set to `OUTCOME_LEADS`.

```bash
curl -X POST \
  -F 'name="Lead generation campaign"' \
  -F 'objective="OUTCOME_LEADS"' \
  -F 'status="PAUSED"' \
  -F 'special_ad_categories=[]' \
  -F 'is_adset_budget_sharing_enabled=0' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

This returns a `campaign_id` you can use for your ad set.

As with all Advantage+ catalog ads, you must specify a `product_set_id` in `promoted_object` for your ad set. This enables you to advertise products from that set. For lead generation, set the `optimization_goal` to `LEAD_GENERATION`.

```bash
curl \
  -F 'name=Product Catalog Sales Adset' \
  -F 'bid_amount=3000' \
  -F 'billing_event=IMPRESSIONS' \
  -F 'optimization_goal=LEAD_GENERATION' \
  -F 'daily_budget=15000' \
  -F 'campaign_id=<CAMPAIGN_ID>' \
  -F 'targeting={
    "geo_locations": {"countries":["US"]},
    "dynamic_audience_ids": ["<DYNAMIC_AUDIENCE_ID>"]
  }' \
  -F 'promoted_object={"product_set_id":"<PRODUCT_SET_ID>","page_id":"<PAGE_ID>"}' \
  -F 'status=PAUSED' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adsets
```

`DYNAMIC_AUDIENCE_ID` refers to a [Product Audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/dynamic-product-audiences) that views your ads. You can omit `DYNAMIC_AUDIENCE_ID`s and instead set behavioral or demographic-based targeting to reach an audience by providing the `product_audience_specs` or `excluded_product_audience_specs` parameter.

See [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-ads/get-started#adset) for more information.

## Provide the ad and creative

First, provide ad creative:

```bash
curl \
  -F 'name=Dynamic Ad With Leadgen Template Creative Sample' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "template_data": {
      "call_to_action": {"type":"SIGN_UP","value":{"lead_gen_form_id":"<FORM_ID>"}},
      "description": "Description {{product.description}}",
      "link": "<LINK>",
      "message": "Test {{product.name | titleize}}",
      "multi_share_end_card": false,
      "name": "Headline {{product.price}}"
    }
  }' \
  -F 'product_set_id=<PRODUCT_SET_ID>' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adcreatives
```

This returns the `creative_id` you can use to create or update an [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup):

```bash
curl -X POST \
  -F 'name="My Ad"' \
  -F 'adset_id="<AD_SET_ID>"' \
  -F 'creative={
       "creative_id": "<CREATIVE_ID>"
     }' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/ads
```

## Fetch leads

If you have the lead ID from a CRM integration, you can ask for the details including `item_id`.

```bash
curl -G \
  -d 'fields=field_data,retailer_item_id' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<LEAD_ID>
```

You can also bulk query all the leads for a form:

```bash
curl -G \
  -d 'fields=field_data,retailer_item_id' \
  -d 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<FORM_ID>/leads
```

Or for an ad:

```bash
curl -X GET \
  -d 'fields="field_data,retailer_item_id"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<AD_ID>/leads
```
