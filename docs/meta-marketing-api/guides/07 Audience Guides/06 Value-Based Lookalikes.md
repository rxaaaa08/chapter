<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/value-based-lookalike-audiences | Saved: 2026-09-19 -->

# Value-Based Lookalikes



Value-based lookalikes are an enhancement of [Lookalike Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/lookalike-audiences). With the value-based lookalike you can include an arbitrary, numeric value for each user set when you create a seed custom audience from CRM data. Facebook uses the value to determine which users in an audience are worth the most to you, in a quantifiable way.

To use this product, you must agree to the value-based lookalike Terms of Service for every ad account using this feature. See [Terms of Service](https://www.facebook.com/customaudiences/value_based/tos.php).

## Create

### Step 1: Create a value-based custom audience

This is a specialized multi-key custom audience that you create with the parameter `is_value_based`.

```bash
curl -X POST \
  -F 'name="Value-Based Custom Audience"' \
  -F 'subtype="CUSTOM"' \
  -F 'is_value_based=1' \
  -F 'customer_file_source="PARTNER_PROVIDED_ONLY"' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

### Step 2: Populate a seed audience

You need to populate the new audience with supported identifiers and with the schema key `LOOKALIKE_VALUE`. Lookalike values can be any non-negative integer or floating-point number.

```bash
curl -X POST \
  -F 'payload={
       "schema": [
         "EMAIL",
         "LOOKALIKE_VALUE"
       ],
       "data": [
         [
           "9b431636bd164765d63c573c346708846af4f68fe3701a77a3bdd7e7e5166254",
           44.5
         ],
         [
           "8cc62c145cd0c6dc444168eaeb1b61b351f9b1809a579cc9b4c9e9d7213a39ee",
           140
         ],
         [
           "4eaf70b1f7a797962b9d2a533f122c8039012b31e0a52b34a426729319cb792a",
           0
         ],
         [
           "98df8d46f118f8bef552b0ec0a3d729466a912577830212a844b73960777ac56",
           0.9
         ]
       ]
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<CUSTOM_AUDIENCE_ID>/users
```

### Step 3: Create a value-based lookalike

After the custom audience contains at least 100 people, you can use it as a seed audience for a new lookalike of type `custom_ratio`.

```bash
curl -X POST \
  -F 'name="Value-Based lookalike"' \
  -F 'subtype="LOOKALIKE"' \
  -F 'origin_audience_id="<CUSTOM_AUDIENCE_ID>"' \
  -F 'lookalike_spec={
       "type": "custom_ratio",
       "ratio": 0.01,
       "country": "US"
     }' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

You can read, update, and delete a value-based lookalike the same way you do for standard [Lookalike Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/lookalike-audiences). See also [Custom Audiences, Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience), and [Custom Audience Users, Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience/users).

## Targeting

You can target ads with a value-based lookalike as you do for any other custom audience. See [Ad Set, Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign).
