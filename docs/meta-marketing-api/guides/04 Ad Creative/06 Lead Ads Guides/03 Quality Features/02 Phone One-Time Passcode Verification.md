<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/lead-ads/enable-quality-features/phone-otp | Saved: 2026-09-19 | Captured from the page as shown in Chrome: Meta builds this page in the browser, and its "View as Markdown" export returns an error. Not in the sidebar: linked from Enable Quality Features -->

# Phone One-Time Passcode Verification for Lead Ads

Ads in WhatsApp Status are available via the Marketing API. [Learn more about ads in WhatsApp Status.](https://developers.facebook.com/documentation/ads-commerce/marketing-api/ads-in-whatsapp-status)

You can implement phone one-time passcodes (OTP) for lead ads in one of two ways: in the [ad creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/lead-ads/enable-quality-features/phone-otp#option-1), or in the [leadgen form](https://developers.facebook.com/documentation/ads-commerce/marketing-api/lead-ads/enable-quality-features/phone-otp#option-2).

### Limitations

* Both methods require the leadgen form to include a phone number question.

## Option 1: Enable the phone OTP in the ad creative

### Step 1: Create a leadgen form containing a phone question

#### Example request

```
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "<PAGE_ACCESS_TOKEN>",
    "name": "<FORM_NAME>",
    "questions": [
      {
        "type": "FULL_NAME",
        "key": "full_name"
      },
      {
        "type": "PHONE",
        "key": "phone"
      }],
    "legal_content_id": "<CONTENT_ID>",
    "privacy_policy_optional": "true",
    "follow_up_action_url": "http://www.meta.com/"
  }' \
https://graph.facebook.com/<LATEST_API_VERSION>/<PAGE_ID>/leadgen_forms

```

See [Lead Forms for Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/create#lead_form) for more information.

### Step 2: Create an ad creative with the SMS verification type

To enable SMS verification, set the `asset_feed_spec.lead_gen_configuration.verification_type` parameter to `SMS`.

```
asset_feed_spec.lead_gen_configuration.verification_type = 'SMS'
```

The [Ad Account Ad Creatives reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adcreatives) lists all the fields for an ad creative object. You can find `lead_gen_configuration` under the `asset_feed_spec` parameter.

#### Example request

```
curl -X POST \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'asset_feed_spec={
    "lead_gen_configuration": {
      "verification_type": 'SMS'
    }
  }' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "link_data": {
      "message": "Check out our new product!",
      "link": "https://www.example.com/product",
      "caption": "https://www.example.com/product",
      "call_to_action": {
        "type": "SIGN_UP",
        "value": {
          "lead_gen_form_id": "<LEAD_GEN_FORM_ID>"
        }
      }
    }
  }' \
https://graph.facebook.com/<LATEST_API_VERSION>/act_<ACCOUNT_ID>/adcreatives

```

A successful response returns the new ad creative ID.

See [Create an Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative) for more information.

### Step 3: Create an ad with the returned ad creative ID

See [Create an Ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad) for more information.

## Option 2: Enable the phone OTP in a leadgen form

### Step 1: Create a leadgen form containing a phone question

Create the leadgen form with the `is_phone_sms_verify_enabled` parameter set to `true`.

The [Page Leadgen Forms reference](https://developers.facebook.com/docs/graph-api/reference/page/leadgen_forms) lists all the parameters for leadgen forms.

#### Example request

```
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "access_token": "<PAGE_ACCESS_TOKEN>",
    "name": "<FORM_NAME>",
    "questions": [
      {
        "type": "FULL_NAME",
        "key": "full_name"
      },
      {
        "type": "PHONE",
        "key": "phone"
      }],
    "is_phone_sms_verify_enabled": "true",
    "legal_content_id": "<CONTENT_ID>",
    "privacy_policy_optional": "true",
    "follow_up_action_url": "http://www.meta.com/"
  }' \
https://graph.facebook.com/<LATEST_API_VERSION>/<PAGE_ID>/leadgen_forms

```

A successful response returns the leadgen form ID.

See [Lead Forms for Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/create#lead_form) for more information.

### Step 2: Create an ad creative with the returned leadgen form ID

#### Example request

```
curl -X POST \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'object_story_spec={
    "page_id": "<PAGE_ID>",
    "link_data": {
      "message": "Check out our new product!",
      "link": "https://www.example.com/product",
      "caption": "https://www.example.com/product",
      "call_to_action": {
        "type": "SIGN_UP",
        "value": {
          "lead_gen_form_id": "<LEAD_GEN_FORM_ID>"
        }
      }
    }
  }' \
https://graph.facebook.com/<LATEST_API_VERSION>/act_<ACCOUNT_ID>/adcreatives

```

A successful response returns the new ad creative ID.

See [Lead Forms for Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/create#ad-creative) and [Create an Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative) for more information.

### Step 3: Create an ad with the returned ad creative ID

See [Create an Ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad) for more information.

## Learn more

* [Lead Forms for Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads/create)
* [Create an Ad Creative](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad-creative)
* [Create an Ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/basic-ad-creation/create-an-ad)
* [Ad Account Ad Creatives reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/adcreatives)
* [Page Leadgen Forms reference](https://developers.facebook.com/docs/graph-api/reference/page/leadgen_forms)
