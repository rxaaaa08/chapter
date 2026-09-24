<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences | Saved: 2026-09-19 -->

# Website Custom Audiences



Create a custom audience of users who visited or took specific actions on your website using Meta Pixel, Meta's on-platform events and audience rules.

Once you create a custom audience with website data, reference it in ad targeting as you do with standard [custom audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience). Meta automatically updates this audience based on the retention policy you set up.

See [Custom Audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience) and [Conversion Tracking](https://developers.facebook.com/docs/meta-pixel/implementation/conversion-tracking) for more information.

### Conversions API {#conversions-api}

If you share conversion events using Conversions API, you can create a Website Custom Audience and use it for ads. You can also create an Offline Custom Audience and a Mobile App Custom Audience. Meta recommends you share [`external_id`](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/external-id) as a customer information parameter to improve match rates and leverage matches across channels.

Please note that the [`external_id`](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/external-id) mapping made via Conversions API is different from the one used with `extern_id` to create a Customer File Custom Audience. The `external_id` mapping cannot be used for creating a Customer File Custom Audience. Likewise, `extern_id` made via Customer File Custom Audience mapping can't be used to create a Web Custom Audience, Offline Custom Audience or Mobile App Custom Audience.

## Before you begin

To create a Custom Audience from Websites, you must accept the Terms of Service for Custom Audiences, in [Ads Manager](https://www.facebook.com/ads).

## Create audiences

To create a website custom audience, make a `POST` request to:

```
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

Use the following parameters:

| Name | Description |
| --- | --- |
| `name`<br><br>type: String | **Required.**<br><br>Audience name. |
| `rule`<br><br>type: JSON Object | **Required.**<br><br>Audience rules applied to referring URL. See [Audience Rules](#audiencerules). |
| `retention_days`<br><br>type: Int | **Optional.**<br><br>Number of days to retain someone in audience. Between `1` and `180` days.<br><br>If not specified, the `retention_days` value is taken from the `retention_seconds` field in the rule. |
| `prefill`<br><br>type: Boolean | **Optional.** Default is `true`. Available options are:<br><br>- `true`: Include website activity recorded before audience creation.<br>- `false`: Only include website traffic from the time of audience creation.<br><br>If not specified, the `prefill` value is taken from the `retention_seconds` field in the rule. The maximum prefill is 180 days. |
| `audience_labels`<br><br>type: String | **Optional.**<br><br>Choose a label that describes this audience. Labels may be used to find audiences for your ads more effectively. [About audience labels](https://www.facebook.com/business/help/706325895111530).<br><br>**Engaged audiences:**<br><br>* `QUALIFIED_LEADS` — Leads that meet your qualification criteria.<br>* `DISQUALIFIED_LEADS` — Leads that don't meet your qualification criteria.<br>* `APP_USERS` — People that are currently using your app.<br>* `TRIAL_USERS` — People who started a trial of your product.<br>* `ENGAGED_USERS` — People that showed interest but are not customers.<br><br>**Customers:**<br><br>* `HIGH_VALUE_CUSTOMERS` — Customers you consider valuable to your business.<br>* `LOW_VALUE_CUSTOMERS` — Customers who are of low or negative value to your business.<br>* `AT_RISK` — Customers who are showing signs of disengaging or churning.<br>* `DISENGAGED` — Customers who have not made a purchase recently or stopped subscribing.<br>* `CUSTOMERS` — Your existing customers. |

For example:

```html
curl -X POST \
  -F 'name="My Test Website Custom Audience"' \
  -F 'rule={
       "inclusions": {
         "operator": "or",
         "rules": [
           {
             "event_sources": [
               {
                 "id": "<PIXEL_ID>",
                 "type": "pixel"
               }
             ],
             "retention_seconds": 8400,
             "filter": {
               "operator": "and",
               "filters": [
                 {
                   "field": "url",
                   "operator": "i_contains",
                   "value": "shoes"
                 }
               ]
             }
           }
         ]
       }
     }' \
  -F 'prefill=1' \
  -F 'audience_labels=["HIGH_VALUE_CUSTOMERS"]' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

Sample response:

```
{
  "id": "123567890"
}
```

### Audience rules {#audiencerules}

A custom audience for Website Custom Audiences must contain an audience rule. Each rule must be provided as a JSON-encoded string. See [Audience Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/audience-rules) for more information.

### Meta Pixel Website Custom Audience {#createpixel}

Use the following API call to create a Pixel Custom Audience:

```html
curl -X POST \
  -F 'name="My WCA Pixel"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/adspixels
```

The call returns the pixel ID:

```
{
  "id": "11111"
}
```

### Read Custom Audience Pixel code {#readpixelcode}

Retrieve the Custom Audience Pixel code:

```html
curl -X GET \
  -d 'fields="code"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<PIXEL_ID>
```

This returns the following, where `code` contains the relevant Custom Audience Pixel code:

```
{
  "data": [
    {
      "code": "<script>(function() {\n  var _fbq = window._fbq || (window._fbq = []);\n  if (!_fbq.loaded) {\n    var fbds = document.createElement('script');\n    fbds.async = true;\n    fbds.src = 'https://connect.facebook.net/en_US/fbds.js';\n    var s = document.getElementsByTagName('script')[0];\n    s.parentNode.insertBefore(fbds, s);\n    _fbq.loaded = true;\n  }\n  _fbq.push(['addPixelId', '11111']);\n})();\nwindow._fbq = window._fbq || [];\nwindow._fbq.push(['track', 'PixelInitialized', {}]);\n</script>\n<noscript><img height=\"1\" width=\"1\" alt=\"\" style=\"display:none\" src=\"https://www.facebook.com/tr?id=11111&ev=NoScript\" /></noscript>",
      "id": "11111"
    }
  ],
  "paging": {
    "cursors": {
      "before": "MjM4NzQ5Njk5NjI2Mzc2",
      "after": "MjM4NzQ5Njk5NjI2Mzc2"
    }
  }
}
```

## Manage audiences {#read}

### Read
To read audiences for an ad account make an `HTTP GET` request:

```html
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

Example:

```html
curl -X GET \
  -d 'fields="id"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

Sample response:

```
{
  "data": [
    {
      "name": "My Test CA",
      "id": "1234567890"
    },
    {
      "name": "WCA",
      "id": "0987654321"
    },
  ],
}
```

To read a specific custom audience:

```html
curl -X GET \
  -d 'fields="name,rule"' \
  -d 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CUSTOM_AUDIENCE_ID>
```

Sample response:

```
{
  "name": "My WCA",
  "rule": "{\"and\": [\n\t\t{\"url\": {\"i_contains\": \"shoes\"}},\n\t\t{\"url\": {\"i_contains\": \"red\"}}]}",
  "id": "1234567890"
}
```

### Update
To update a custom audience name:

```html
curl -X POST \
  -F 'name="Updated Name for CA"' \
  -F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/<CUSTOM_AUDIENCE_ID>
```

Sample Response:

```
{
  "success": true
}
```

### Delete

Delete an audience by `id`:

```html
curl -X DELETE \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/<CUSTOM_AUDIENCE_ID>
```

Sample Response:

```
{
  "success": true
}
```

## Enhanced Website Custom Audiences {#enhanced}

**This product has been deprecated.** See [Enhanced Website Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences).

## Dynamic Date (*beta*) {#dynamic_date}

`dynamic_date` enables travel advertisers to target users who searched for hotels and flights based upon the users check-in date. For instance an advertiser can create an audience that only targets users with a check-in date in the future.

Travel advertisers should provide the intended check-in date in the `checkin_date` field for pixel fires:

```
fbq('track', 'Search', {'checkin_date': '2015-09-15', 'num_of_travelers':2});
```

### Supported time formats
Currently only the ISO-8601 time format is supported. For example:

* `YYYYMMDD` (for example, 20080921)
* `YYYY-MM-DD` (for example, 1997-07-16)
* `YYYY-MM-DDThh:mmTZD` (for example, 1997-07-16T19:20+0100)
* `YYYY-MM-DDThh:mm:ssTZD` (for example, 1997-07-16T19:20:30+0100)

Where:

* `YYYY` is the four-digit year
* `MM` is the two-digit month (01=January, and so on)
* `DD` is the two-digit day of month (01 through 31)
* `hh` is the two digits of hour (00 through 23) (am/pm NOT allowed)
* `mm` is the two digits of minute (00 through 59)
* `ss` is the two digits of second (00 through 59)
* `TZD` is the time zone designator (+hhmm or -hhmm)

### Examples  

Users who searched for a hotel with `start_date` later than today in the last 30 days:

```
curl
-F "name=search_hotel_later_than_today"
-F "pixel_id=PIXEL_ID"
-F "retention_days=30"
-F 'rule={"event": {"i_contains": "search"}}'
-F 'rule_aggregation={"type":"last_event_time_field", "config":{"field":"checkin_date", "time_format":"YYYY-MM-DD"}, "operator":"lt", "value": "0"}'
-F "access_token=ACCESS_TOKEN"
"https://graph.facebook.com/API_VERSION/act_AD_ACCOUNT_ID/customaudiences"
```

### Best practices
* Experiment with different potential measures of value, for example, people who visit the site frequently but have not purchased or people who visit the site with multiple devices.
* Create Lookalike Audiences based on the best performing custom audiences.

## FAQ {#faq}

**What are the benefits of using Custom Audiences on my website?**

With Custom Audiences, you can reach people who recently visited your website and deliver them highly relevant ads based on interest they express in your products.

Other benefits include:

- Remarket to people using your website

- Make your existing ads more efficient by excluding audiences of people who have already converted on your message

- Create lookalike audiences of people who look like the people browsing your website

By tracking how each customer progresses in a process, you can more effectively influence customers who expressed interest in your products. For example, using Meta Pixel, capture intent based on activity of people who are viewing pages about a loyalty program, browsing a particular product page, or filling out a preferences form. Later, you can serve relevant ads to these people to help them complete the conversion.

**How do I create a Website Custom Audiences?**

See [Advertiser Help Center, Custom Audience from your Website](https://www.facebook.com/business/help/1474662202748341)

**How do I edit an existing Website Custom Audience?**

See [Advertiser Help Center, Custom Audience from your Website](https://www.facebook.com/business/help/1474662202748341). When you add or remove people, updates can take a few hours. But your ads continue to run.

**How many audiences can I create?**

At this time, there's a maximum of `10000` Custom Audiences from your website that can be created in a single account.

**Can I exclude a Website Custom Audience from my ad targeting?**

Yes. Exclusion targeting prevents a particular audience from seeing your ad to help deliver your advertising more precisely. For example, exclude an audience of your current customers if you run a campaign to acquire new customers.

In Ads Manager, in the audience section of creating an ad, click Exclude and add the custom audience to the list.

**How long will customers stay in my website custom audience?**

The longest duration can be set for `365 days`. After 365 days, audience members are removed, unless they revisit the website again and match the same audience rule.

**Can I create a Lookalike Audience of a Website Custom Audience?**

Yes. Open Ad Manager. Under the **Audiences** tab, click the **New Audience** drop-down menu and select **Lookalikes**.

**Can Dating & Gambling clients use Custom Audiences from your website?**

Dating can use Custom Audiences from your website. However, gambling websites must be approved through the sales team on a managed list, and you must provide demographic restrictions, such as 21 years+.

**What bid type should we use for Custom Audiences from your website?**

We recommend CPM bidding for Website Custom Audience until your audience has reached a sufficiently large size. Start with CPM, then migrate to `oCPM` or `CPC` once you reach sufficient scale.

**Can I access mobile and web inventory with Custom Audiences from your website?**

Yes, Custom Audiences from your website works with all native ad formats and serves across desktop, mobile, and tablet.

**How does Custom Audiences from Your Website relate to 'FBX'?**

`FBX` and Website Custom Audiences are complementary products. `FBX` is best when advertisers require product-level dynamic ads, which are as current as possible and are not yet easily facilitated by Custom Audiences from your website. However, FBX is limited to desktop inventory. Custom Audiences from your website allows targeting across browsers, overlaying of Meta data, access to mobile inventory, and usage of all Meta ad units—all of which are not available on `FBX`.

**What is user retention based on?**

Custom Audiences from Your Website requests a duration where customers will be retained within the audience created. The duration is based on when customers visited a website and fired the Meta Pixel. For example, with a retention window of 30 days, if someone visits a website and matches an Audience rule on June 1st, Facebook automatically removes them from the Website Custom Audience on June 30.

**Can we apply more complex rules for sophisticated clients?**

You can create rules based on URLs visited or on custom events from Meta Pixel. Using custom data, create audiences based upon SKUs, Pricing, Color, or any other attribute you send to Facebook. See [Meta Pixel](docs/meta-pixel).

**What privacy features are in Custom Audiences from your website?**

No personal information is reported to the advertiser about any individual person on a website. You can only target an audience once it reaches a certain size; it's impossible to learn the individual identity an any person visiting a website.

Meta also provides an AdChoices link where people can learn more and opt out of targeted ads they receive. Click the “x” in the top-right corner of ads to show more options:

- Hide this ad — Don't see this ad again (Facebook native). This is specific to the ad ID in the campaign only.

- Hide all ads — Don't see any other ads from that advertiser (Facebook native). Hide any ads from either that subdomain, such as `savings.att.com` or `att.com`, or the page `facebook.com/ATT` if we have it. Block the sub-domain or page across ad accounts.

- Why Am I seeing this Ad?

**Are View Tags allowed with Custom Audiences from your website?**

View Tags are not yet permitted for Custom Audiences from your website clients. Only Atlas view tag are accepted at this time.

**Can Website Custom Audiences be shared with another account or FBMP?**

Yes, it's possible to share Website Custom Audiences.

**If I delete a Website Custom Audience, what happens to my campaign that's targeting this Website Custom Audience?**

If an `Active` campaign targets a Website Custom Audience and that audience is deleted, the campaign is put on `Pause`.

**How quickly does my audience update?**

We update an audience as soon as technically possible. Once customers go to webpages with a Meta Pixel and match an Audience rule, they're added to that Website Custom Audience. If this Website Custom Audience is being targeted with an ad, the customer is eligible to be served an ad in a matter of minutes.

**Do I have to add a new Meta Pixel to my website every time I create an audience?**

No. There's one Meta Pixel generated per account. Add this Meta Pixel to all pages of your website one at a time, and use Audience rules to create different Website Custom Audiences.

**Can I use a Meta Pixel with another third-party tag?**

Yes. You can use data from third-party tags, Tag Managers, or a DFA Floodlight tag. This depends on the sophistication of the third-party client. Simple rules are easy to implement, but if you pass dynamic variables through the JavaScript event, your third-party tag should receive them and pass them to the [Meta Pixel](https://developers.facebook.com/docs/meta-pixel/implementation/custom-audiences) via Custom Data fields.

**What are other benefits of using the JavaScript version of Meta Pixel?**

The full JavaScript version has the following advantages over the IMG-only pixel:

- It's cross-browser and cross-platform.

- It's fast and loads asynchronously so it doesn't block the page load.

- Built-in cache buster increases effectiveness.

- You can send custom data with large payloads using HTTP POST.

- It captures the original page URL when the pixel is placed in a tag container.

**What is a pixel ID?**

A pixel ID is an identifier of the piece of code placed on an advertiser's website. There's one pixel ID per Meta Ad account.

**How to obtain a Meta Pixel through the API?**

See [Meta Pixel](https://developers.facebook.com/docs/facebook-pixel/using-the-pixel).

**Where should I place Meta Pixel in my website?**

See [Meta Pixel](https://developers.facebook.com/docs/meta-pixel/get-started#installing-the-pixel).

**How can I fire Custom Data events using 'fbq'?**

See [Meta Pixel, with Website Custom Audiences](https://developers.facebook.com/docs/facebook-pixel/pixel-with-ads/website-custom-audiences).

**How do I refer to custom data in Custom Audiences from your website rules?**

In your rules, refer to event names under the parameter 'event'. For rules based on custom data, refer to it the same way you do for referring URLs, under the parameter 'url'. For example, to matches all visitors:

- to URLs containing 'signup', or

- associated with event 'SignUp'  by fbq.push(['track', 'SignUp']);

```
"filter": {
    "operator": "or",
    "filters": [
        {
            "field": "url",
            "operator": "i_contains",
            "value": "signup"
        }
        {
            "field": "event",
            "operator": "i_contains",
            "value": "SignUp"
        }
    ]
}
```

The following rule matches all visitors who have viewed any product in the TV category by fbq.push(['track', 'ViewProduct', {category: 'TV'}]);.

```
"filter": {
    "operator": "or",
    "filters": [
        {
            "field": "event",
            "operator": "i_contains",
            "value": "ViewProduct"
        }
        {
            "field": "category",
            "operator": "i_contains",
            "value": "TV"
        }
    ]
},
```

**How to track conversion events?**

The above examples shows how to track remarketing events. Use the same way to track conversion events by replacing `eventName` with conversion ID. This ID is created during the regular conversion creation flow (https://www.facebook.com/ads/manage/convtrack.php).

```
window.fbq = window.fbq || [];
fbq.push(['track', 123456, {currency: 'USD', value: 30.00}]);
```

Ideally, you don't need to know whether a fired event is a conversion event or a remarketing event. You only need the conversion ID to fire a conversion event. For example, if the old conversion pixel is:

```
var fb_param = {};
fb_param.pixel_id = '1234567890';
fb_param.value = '5.00';
fb_param.currency = 'USD';
(elided other code)
```

Then, using the new pixel, it is the following:

```
window.fbq = window.fbq || [];
fbq.push(['track', 1234567890, {currency: 'USD', value: 5.00}]);
```

The old conversion pixel allowed either a conversion pixel or a remarketing pixel on a page. Meta Pixel allows multiple pixel firings, including multiple conversion events, multiple remarketing events, or both per page.

**How do you use an image only version of the Meta Pixel?**

Manually insert an `IMG` tag:

```
<img height="1" width="1" border="0" alt="" style="display:none"
  src="https://www.facebook.com/tr?id=pixel_ID/ad_account_id&ev=event name&cd[p1]=v1&cd[p2]=v2..." />
```

Custom data is represented as key-value pairs. Each parameter is inside 'cd[...]'. For example:

```
<img height="1" width="1" border="0" alt="" style="display:none"
  src="https://www.facebook.com/tr?id=1234&ev=ViewProduct
       &cd[category]=TV" />
```

Is equivalent to the following JS call:

```
window.fbq = window.fbq || [];
fbq.push(['track', 'ViewProduct', {category: 'TV'}]);
```

**How do you use an image pixel to fire conversion events?**

Use parameter 'ev' to specify conversion ID, parameter 'cd[value]' to specify value, and parameter 'cd[currency]' to specify currency:

```
<img height="1" width="1" border="0" alt="" style="display:none"
  src="https://www.facebook.com/tr?id=1234&ev=1234567890
       &cd[value]=5.00&cd[currency]=USD" />
```

**When to use image pixel?**

Meta Pixel code tries to fire events using JavaScript first. If JavaScript isn't available, Meta Pixel code tries to use image pixel. However it's recommended to always use the JavaScript pixel:

- Can be fired multiple times on each page load.

- Can control when an event should be fired such as on a button click.

- Not subject to `HTTP GET` limit in sending custom data.

## Related resources {#related}

- [Meta Pixel for Developers](https://developers.facebook.com/docs/facebook-pixel)
- [Conversion Tracking with Meta Pixel](https://developers.facebook.com/docs/marketing-api/facebook-pixel/conversion-tracking)
- [Custom Audience Targeting](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience)
