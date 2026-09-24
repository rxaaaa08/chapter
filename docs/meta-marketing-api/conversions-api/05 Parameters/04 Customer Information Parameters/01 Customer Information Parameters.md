<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters | Saved: 2026-09-19 -->

# Customer Information Parameters



The customer information parameters are a set of user identifiers you share alongside your event information. For more information about required and recommended parameters, see [Best Practices - Conversions API: Send Required and Recommended Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices#req-rec-params).

**Note:** In the Graph API v13.0 release there were new requirements around the combinations of customer information parameters that are considered valid. Please review the [best practices](https://developers.facebook.com/documentation/ads-commerce/conversions-api/best-practices#baseline-requirements-for-matching) to ensure your Conversions API integrations are not interrupted.

Please visit the [Meta Privacy and Data Use Guide](https://www.facebook.com/business/m/privacy-and-data?Data-Use-&-Ads) to learn what data is sent when using the Conversions API.

Our systems are designed to not accept customer information that is unhashed Contact Information, unless noted below. Contact Information is information that personally identifies individuals, such as names, email addresses, and phone numbers, that we use for matching purposes only. If you are using the [Meta Business SDK](https://developers.facebook.com/docs/business-sdk), the hashing is done automatically.

## Pixel Comparison

You can send many of the customer information parameters through the Meta Pixel, though some (for example, `client_user_agent`) are sent automatically as part of how the internet works. For example, to send `external_id` through the Pixel, use the following code:

```js
fbq('init', 'PIXEL_ID', {'external_id': 12345});
```

Read about the other parameters you can pass with Pixel in the [Advanced Matching documentation](https://developers.facebook.com/docs/facebook-pixel/advanced/advanced-matching).

Vice versa, make sure to apply the same set of customer information parameters your system is currently sharing to the browser side to the server side.

## Formatting the `user_data` Parameters

You must provide at least one of the following `user_data` parameters with the correct formatting in your request.

_**Note**: If you are using the [parameter builder library](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library), the format will contain an additional appendix at the end of each param. Check the parameter builder library page for more details._

**Warning:** Please download this CSV file for examples of properly normalized and hashed data for the parameters below.

Download (Right-click > Save Link As)

| Parameter | Description |
| --- | --- |
| `em`<br>Email  <br><br>string or list<string> | **Hashing required.**  <br>Trim any leading and trailing spaces. Convert all characters to lowercase.  <br><br>**Example:**<br><br>*Input:* John_Smith@gmail.com  <br>*Normalized format:* john_smith@gmail.com  <br>*Expected SHA256 output:* 62a14e44f765419d10fea99367361a727c12365e2520f32218d505ed9aa0f62f |
| `ph`<br>Phone Number  <br><br>string or list<string> | **Hashing required.**  <br>Remove symbols, letters, and any leading zeros. Phone numbers must include a country code to be used for matching (e.g., the number 1 must precede a phone number in the United States).  Always include the country code as part of your customers' phone numbers, even if all of your data is from the same country.  <br><br>**Example:**<br><br>*Input:* US phone number (650)555-1212  <br>*Normalized format:* 16505551212  <br>*Expected SHA256 output:*<br><br>e323ec626319ca94ee8bff2e4c87cf613be6ea19919ed1364124e16807ab3176 |
| `fn`<br>First Name  <br><br>string or list<string> | **Hashing required.**  <br>Using Roman alphabet a-z characters is recommended. Lowercase only with no punctuation. If using special characters, the text must be encoded in UTF-8 format.<br><br>**Example:**  <br>*Input:* Mary  <br>*Normalizaed format:* mary  <br>*Expected SHA256 output:* 6915771be1c5aa0c886870b6951b03d7eafc121fea0e80a5ea83beb7c449f4ec<br><br>*Input:* 정  <br>*Normalized format:* UTF-8 character "정"  <br>*Expected SHA256 output:* 8fa8cd9c440be61d0151429310034083132b35975c4bea67fdd74158eb51db14<br><br>*Input:* Valéry  <br>*Normalized format:* valéry  <br>*Expected SHA256 output:* 08e1996b5dd49e62a4b4c010d44e4345592a863bb9f8e3976219bac29417149c |
| `ln`<br>Last Name  <br><br>string or list<string> | **Hashing required.**  <br>Using Roman alphabet a-z characters is recommended. Lowercase only with no punctuation. If using special characters, the text must be encoded in UTF-8 format.  <br><br>See First Name (`fn`) for examples. |
| `db`<br>Date of Birth  <br><br>string or list<string> | **Hashing required.**  <br>We accept the YYYYMMDD format accommodating a range of month, day and year combinations, with or without punctuation.<br><br>* **Year:** Use the YYYY format from 1900 to current year.<br>* **Month:** Use the MM format: 01 to 12.<br>* **Date:** Use the DD format: 01 to 31.<br><br>**Example:**<br><br>*Input:* 2/16/1997  <br>*Normalized format:* 19970216  <br>*Expected SHA256 output:* 01acdbf6ec7b4f478a225f1a246e5d6767eeab1a7ffa17f025265b5b94f40f0c |
| `ge`<br>Gender  <br><br>string or list<string> | **Hashing required.**  <br>We accept gender in the form of an initial in lowercase.<br><br>**Example:**<br><br>* f for female<br>* m for male |
| `ct`<br>City  <br><br>string or list<string> | **Hashing required.**  <br>Using Roman alphabet a-z characters is recommended. Lowercase only with no punctuation, no special characters, and no spaces.  If using special characters, the text must be encoded in UTF-8 format.  <br><br>**Example:**  <br>paris  <br>london  <br>newyork |
| `st`<br>State  <br><br>string or list<string> | **Hashing required.**  <br>Use the [2-character ANSI abbreviation code](https://en.wikipedia.org/wiki/Federal_Information_Processing_Standard_state_code) in lowercase. Normalize states outside the U.S. in lowercase with no punctuation, no special characters, and no spaces.  <br><br>**Example:**  <br>az  <br>ca |
| `zp`<br>Zip Code  <br><br>string or list<string> | **Hashing required.**  <br>Use lowercase with no spaces and no dash. Use only the first 5 digits for U.S. zip codes. Use the area, district, and sector format for the UK.  <br><br>**Example:**  <br>U.S zip code: 94035  <br>Australia zip code: 1987  <br>France zip code: 75018  <br>UK zip code: m11ae |
| `country`<br>Country  <br><br>string or list<string> | **Hashing required.**  <br>Use the lowercase, 2-letter country codes in [ISO 3166-1 alpha-2](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2).  <br>**Important Note:** Always include your customers' countries' even if all of your country codes are from the same country. We match on a global scale, and this simple step helps us match as many Accounts Center accounts as possible from your list.<br><br>**Example:**  <br>*Input:* United States  <br>*Normalized format:* us  <br>*Expected SHA256 output:* 79adb2a2fce5c6ba215fe5f27f532d4e7edbac4b6a5e09e1ef3a08084a904621 |
| `external_id`<br>External ID  <br><br>string or list<string> | **Hashing recommended.**  <br>Any unique ID from the advertiser, such as loyalty membership IDs, user IDs, and external cookie IDs. You can send one or more external IDs for a given event.  <br>If an External ID is being sent via other channels, it should be in the same format as when sent via the [Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/external-id). |
| `client_ip_address`<br>Client IP Address  <br><br>string | **Do not hash.**  <br>The IP address of the browser corresponding to the event must be a valid IPV4 or IPV6 address. IPV6 is preferable over IPV4 for IPV6-enabled users. The `client_ip_address` user data parameter must never be hashed.  <br>No spaces should be included. Always provide the real IP address to ensure accurate event reporting.  <br>**Note:** This information is automatically added to events sent through the browser, but it must be manually configured for events sent through the server.<br><br>**Example:**  <br>*IPV4:* 168.212.226.204  <br>*IPV6:* 2001:0db8:85a3:0000:0000:8a2e:0370:7334 |
| `client_user_agent`<br>Client User Agent  <br><br>string | **Do not hash.**  <br>The user agent for the browser corresponding to the event. The `client_user_agent` is required for website events shared using the [Conversions API](https://developers.facebook.com/documentation/ads-commerce/conversions-api).  <br><br>Sending both the `client_ip_address` and `client_user_agent` parameters for all of the events you're sending through the Conversions API may help improve event matching and could also help improve ad delivery for any ad campaigns optimizing on the events you send through the Conversions API.  <br>**Note:** This information is automatically added to events sent through the browser, but must be manually configured for events sent through the server.  <br><br>**Example:**  <br>Mozilla/5.0 (Windows NT 10.0; Win64; x64)  <br>AppleWebKit/537.36 (KHTML, like Gecko)  <br>Chrome/87.0.4280.141  <br>Safari/537.36 |
| `fbc`<br>Click ID  <br><br>string | **Do not hash.**  <br>The Meta click ID value is stored in the `_fbc` browser cookie under your domain. See [Managing `fbc` and `fbp` Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/fbp-and-fbc) for how to get this value or generate this value from a `fbclid` query parameter.<br><br>The format is: fb.${subdomain_index}.${creation_time}.${fbclid}.<br><br>_**Note**: If you are using the [parameter builder library](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library), the format will contain an additional appendix at the end of each param. Check the parameter builder library page for more details._<br><br>**Example:**  <br>`fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890` |
| `fbp`<br>Browser ID  <br><br>string | **Do not hash.**  <br>The Meta browser ID value is stored in the `_fbp` browser cookie under your domain. See [Managing `fbc` and `fbp` Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/fbp-and-fbc) for how to get this value.<br><br>The format is `fb.${subdomain_index}.${creation_time}.${random_number}`.<br><br>_**Note**: If you are using the [parameter builder library](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library), the format will contain an additional appendix at the end of each param. Check the parameter builder library page for more details._<br><br>**Example:**  <br>fb.1.1596403881668.1116446470 |
| `subscription_id`<br>Subscription ID  <br><br>string | **Do not hash.**  <br>The subscription ID for the user in this transaction; it is similar to the order ID for an individual product. |
| `fb_login_id`<br>Facebook Login ID  <br><br>integer | **Do not hash.**  <br>The ID issued by Meta when a person first logs into an instance of an app. This is also known as App-Scoped ID. |
| `lead_id`<br>Lead ID  <br><br>integer | **Do not hash.**  <br>The ID associated with a lead generated by [Meta's Lead Ads](https://developers.facebook.com/documentation/ads-commerce/marketing-api/guides/lead-ads). |
| `anon_id`<br><br>string | **Do not hash.**  <br>Your install ID. This field represents unique application installation instances.<br><br>_**Note:** This parameter is for app events only_ |
| `madid`<br><br>string | Your mobile advertiser ID, the advertising ID from an Android device or the Advertising Identifier (IDFA) from an Apple device. |
| `page_id`<br><br>string | **Do not hash.**  <br>Your Page ID. Specifies the page ID associated with the event. Use the Facebook page ID of the page associated with the bot. |
| `page_scoped_user_id`<br><br>string | **Do not hash.**  <br>Specifies the page-scoped user ID associated with the messenger bot that logs the event. Use the page-scoped user ID provided to your webhook. |
| `ctwa_clid`<br><br>string | **Do not hash.**  <br>Click ID generated by Meta for ads that click to WhatsApp. |
| `ig_account_id`<br><br>string | **Do not hash.**  <br>[Instagram Account ID](https://developers.facebook.com/docs/instagram-api/reference/ig-user) that is associated with the business. |
| `ig_sid`<br><br>string | **Do not hash.**  <br>Users who interact with Instagram are identified by Instagram-Scoped User IDs (IGSID). IGSID can be obtained from this [webhook](https://developers.facebook.com/documentation/business-messaging/instagram-messaging/webhooks). |

## See Also

* [Custom Data Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/custom-data)
* [Meta Privacy and Data Use Guide](https://www.facebook.com/business/m/privacy-and-data#Data-Use-&-Ads)
