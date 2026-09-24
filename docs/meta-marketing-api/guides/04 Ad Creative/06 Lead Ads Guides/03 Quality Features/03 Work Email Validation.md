<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/lead-ads/enable-quality-features/work-email-validation | Saved: 2026-09-19 | Captured from the page as shown in Chrome: Meta builds this page in the browser, and its "View as Markdown" export returns an error. Not in the sidebar: linked from Enable Quality Features -->

# Lead Ads Work Email Validation

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

You can enable a work email validation feature in lead ads to ensure people enter their work email address before submitting the form.

This feature can be enabled in one of two ways: in the [ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/lead-ads/enable-quality-features/work-email-validation#option-1), or in the [lead gen form](https://developers.facebook.com/documentation/ads-commerce/marketing-api/lead-ads/enable-quality-features/work-email-validation#option-2).

### Limitations

* Both methods require the lead gen form to include a work email question.

## Option 1: Enable the work email validation in the ad creative

### Step 1: Create a lead gen form containing a work email question

#### Example request

```
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "<PAGE_ACCESS_TOKEN>",
    "name": "<FORM_NAME>",
    "questions": [{
      "type": "FULL_NAME",
      "key": "full_name"
    },
    {
      "type": "PHONE",
      "key": "phone"
    },
    {
      "type": "WORK_EMAIL",
      "key": "work_email"
    }],
    "legal_content_id": "<CONTENT_ID>",
    "privacy_policy_optional": "true",
    "follow_up_action_url": "http://www.meta.com/"
  }' \
https://graph.facebook.com/v26.0/<PAGE_ID>/leadgen_forms

```

See [Lead Forms for Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/create#lead_form) for more information.

### Step 2: Create an ad creative with the work email validation feature enabled

Create an ad creative with the `asset_feed_spec.lead_gen_configuration.is_work_email_enforcement_enabled` parameter set to `true`.

The [Ad Account Ad Creatives reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adcreatives) lists all the fields for an ad creative object. You can find `lead_gen_configuration` under the `asset_feed_spec` parameter.

#### Example request

```
curl -X POST \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'asset_feed_spec={
    "lead_gen_configuration": {
    "is_work_email_enforcement_enabled": true
    }
  }' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "link_data": {
      "message": "Check out our new product!",
      "link": "<LINK_URL>",
      "caption": "<CAPTION>",
      "call_to_action": {
        "type": "SIGN_UP",
        "value": {
          "lead_gen_form_id": "<LEAD_GEN_FORM_ID>"
        }
      }
    }
  }'
https://graph.facebook.com/v26.0/act_<ACCOUNT_ID>/adcreatives

```

Upon success, the endpoint returns the newly created ad creative’s ID.

See [Create an Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative) for more information.

### Step 3: Create an ad with the returned ad creative ID

See [Create an Ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad) for more information.

## Option 2: Enable the work email validation in a lead gen form

### Step 1: Create a lead gen form containing a work email question

Create the lead gen form with the `should_enforce_work_email` parameter set to `true`.

The [Page Leadgen Forms reference](https://developers.facebook.com/docs/graph-api/reference/page/leadgen_forms) lists all the parameters for lead gen forms.

#### Example request

```
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "<PAGE_ACCESS_TOKEN>",
    "name": "<FORM_NAME>",
    "questions": [{
      "type": "FULL_NAME",
      "key": "full_name"
    },
    {
      "type": "PHONE",
      "key": "phone"
    },
    {
      "type": "WORK_EMAIL",
      "key": "work_email"
    }],
    "should_enforce_work_email": "true",
    "legal_content_id": "<CONTENT_ID>",
    "privacy_policy_optional": "true",
    "follow_up_action_url": "http://www.meta.com/"
  }' \
https://graph.facebook.com/v26.0/<PAGE_ID>/leadgen_forms

```

Upon success, the endpoint returns a lead gen form ID.

See [Lead Forms for Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/create#lead_form) for more information.

### Step 2: Create an ad creative with the returned lead gen form ID

#### Example request

```
curl -X POST \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "link_data": {
      "message": "Check out our new product!",
      "link": "<LINK_URL>",
      "caption": "<CAPTION>",
      "call_to_action": {
        "type": "SIGN_UP",
        "value": {
          "lead_gen_form_id": "<LEAD_GEN_FORM_ID>"
        }
      }
    }
  }' \
https://graph.facebook.com/v26.0/act_<ACCOUNT_ID>/adcreatives

```

Upon successful creation, the endpoint returns the newly created ad creative’s ID.

See [Lead Forms for Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/create#adcreative) and [Create an Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative) for more information.

### Step 3: Create an ad with the returned ad creative ID

See [Create an Ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad) for more information.

## Learn more

* [Business Help Center: Enable the work email validation feature to help improve lead quality⁠](https://www.facebook.com/business/help/10003852069627862)
