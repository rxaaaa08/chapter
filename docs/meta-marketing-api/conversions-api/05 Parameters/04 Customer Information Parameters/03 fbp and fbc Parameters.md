<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/fbp-and-fbc | Saved: 2026-09-19 -->

# ClickID and the fbp and fbc Parameters



This guide explains Meta's ClickID and the `_fbc` and `_fbp` parameters. The `_fbc` and `_fbp` parameters represent browser cookie values and can be sent with your server events. See [About Cookie Settings For Your Meta Pixel](https://www.facebook.com/business/help/471978536642445).

We recommend that you always send `_fbc` and `_fbp` browser cookie values in the `fbc` and `fbp` event parameters, respectively, when available.  These values are subject to change over multiple browser sessions, so we recommend refreshing a user's profile with the latest value whenever possible.

## What Is Meta's ClickID

ClickID is a **Meta-generated** parameter that is passed with the URL of an advertiser's website when a user clicks an ad on Facebook and/or Instagram. Sharing ClickID can help you attribute more conversions and reach more people, which may drive better ad performance. ClickID auto-attachment does not impact other custom tracking parameters you may have enabled.

Example URL with ClickID: `https://example.com/?fbclid=IwAR2F4-dbP0l7Mn1IawQQGCINEz7PYXQvwjNwB_qa2ofrHyiLjcbCRxTDMgk`

### Benefits of ClickID

* Increase conversions volume
* Improve campaign attribution and optimisation
* Increase ad performance

## 1. Retrieve Meta ClickID

### Retrieve from `fbclid` URL query parameter

Whenever present in the URL query parameters, try to obtain the parameter server-side by reading it from the HTTP request URL's query string.

Example:

```
GET /?fbclid=IwAR2F4-dbP0l7Mn1IawQQGCINEz7PYXQvwjNwB_qa2ofrHyiLjcbCRxTDMgk
HTTP/2.0
Host: www.example.org
```

**Warning:** **Note**: ClickID value is case sensitive - do not apply any modifications before using, such as lower or upper case.

### Retrieve from `_fbc` cookie

ClickID value is available within `_fbc` cookie in 2 cases:

* Meta Pixel is installed on the website. In this case, Meta Pixel automatically stores ClickID value in the `_fbc` browser cookie once available
* You already store it in the cookie from the server or in backend storage, following the best practices listed in the "Store ClickID" section

In both these cases formatted ClickID can be obtained from the `_fbc` cookie by reading the Cookie headers of the HTTP request. See how to format ClickID correctly in the ["Format ClickID"](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/fbp-and-fbc#2--format-clickid) section below.

## 2. Format ClickID

If the `_fbc` cookie is not available because there is no Meta Pixel running on the website, it is still possible to send the `fbc` event parameter with the Conversion API event if an `fbclid` query parameter is in the URL of the current page request.

The formatted ClickID value must be of the form
`version.subdomainIndex.creationTime.<fbclid>`, where:

* version is always this prefix: **fb**
* subdomainIndex is which domain the cookie is defined on (**'com' = 0**, **'example.com' = 1**, **'www.example.com' = 2**)
* creationTime is the UNIX time since epoch in **milliseconds** when the `_fbc` was stored. If you don't save the `_fbc` cookie, use the timestamp when you first observed or received this `fbclid` value
* **`<fbclid>`** is the value for the `fbclid` query parameter in the page URL.

_**Note**: If you use the parameter builder library to form fbc, the format will contain an appendix at the end. Please refer to the [parameter builder library](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library) page for more details._

Here's an example of what the resulting `fbc` parameter value could look like (note that the `<fbclid>` portion is invalid):

```
fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

## 3. Store ClickID

**Warning:** **Note**: Before storing ClickID it is crucial to format it as described in the ["Format ClickID"](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/fbp-and-fbc#2--format-clickid) section above - it will ensure a valid value sent to Meta via the Conversions API.

### Set formatted ClickID in the `_fbc` cookie in the HTTP response

It is highly recommended to set `_fbc` as:

* [HTTP cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) in the HTTP response headers
* with the 90 days expiration time

once retrieved from the `fbclid` URL query parameter or the `_fbc` browser cookie.

Note, only set the cookie if:

* _fbc cookie doesn't exist and ClickID was retrieved from the `fbclid` URL query parameter
* `fbclid` in the URL query parameter isn't equal to the corresponding value in the `_fbc` cookie value. In the cookie, `fbclid` corresponds to the string after the last "." in cookie value.

Example:

```
HTTP/2.0 200 OK
Content-Type: text/html
Set-Cookie:
_fbc=fb.1.1709136167115.IwAR2F4-dbP0l7Mn1IawQQGCINEz7PYXQvwjNwB_qa2ofrHyiLjcbCRxTDMgk; Expires=Thu, 21 Oct 2021 07:28:00 GMT;
```

### Store formatted ClickID on the server

As an alternative to the cookie option above, you can store and manage the value of the formatted ClickID in your backend storage. In this case, you will need to ensure you store and send the most recent value obtained from the URL query parameter, if present.

## 4. Send `fbc` Parameter with Conversions API Events

After the value of the ClickID is obtained, it needs to be correctly formatted  before sending it with an event via Conversions API - see instructions below. We recommend sending the `fbc` parameter with every event you send to the Conversions API.

**Parameter name**: `fbc`

**Parameter value**: must be of the form `version.subdomainIndex.creationTime.fbclid`, where:

* version is always this prefix: `fb`
* subdomainIndex is which domain the cookie is defined on ('com' = 0, example.com' = 1, 'www.example.com' = 2). If you're generating this field on a server, and not saving an `_fbc` cookie, use the value 1.
* creationTime is the UNIX time since epoch in milliseconds when the `_fbc` cookie was saved. If you don't save the `_fbc` cookie, use the timestamp when you first observed or received this `fbclid` value.
* `fbclid` is the value for the `fbclid` query parameter in the page URL.

Value example:

```
fb.1.1554763741205.IwAR2F4-dbP0l7Mn1IawQQGCINEz7PYXQvwjNwB_qa2ofrHyiLjcbCRxTDMgk
```

Conversions API payload example:

```
{
    "data": [
        {
            "event_name": "Purchase",
            "event_time": 1712248396,
            "action_source": "website",
            "user_data": {

                "fbc": "fb.1.1554763741205.IwAR2F4-dbP0l7Mn1IawQQGCINEz7PYXQvwjNwB_qa2ofrHyiLjcbCRxTDMgk",

                "em": ["7b17fb0bd173f625b58636fb796407c22b3d16fc78302d79f0fd30c2fc2fc068"],
                "ph": ["6069d14bf122fdfd931dc7beb58e5dfbba395b1faf05bdcd42d12358d63d8599"],
            },
            "custom_data": {
                "currency": "USD",
                "value": "142.52"
            }
        }
    ]
}
```

## Integration Helpers

### Payload Helper

[Payload Helper](https://developers.facebook.com/documentation/ads-commerce/conversions-api/payload-helper) is a tool that allows you to construct the Conversions API request payload to ensure correct format of the data sent to Meta. It also features Business SDK in multiple programming languages you can use to integrate with Conversions API. They are available upon clicking on the "Get Code" button within the "Generate Code" section.

## `fbp`
When the Meta Pixel is installed on a website, and the Pixel uses first-party cookies, the Pixel automatically saves a unique identifier to an `_fbp` cookie for the website domain if one does not already exist.

The `fbp` event parameter value must be of the form version.subdomainIndex.creationTime.randomnumber, where:

- `version` is always this prefix: `fb`
- `subdomainIndex` is which domain the cookie is defined on ('com' = 0, 'example.com' = 1, 'www.example.com' = 2). If you're generating this field on a server, and not saving an `_fbp` cookie, use the value 1.
- `creationTime` is the UNIX time since epoch in **milliseconds** when the `_fbp` cookie was saved. If you don't save the `_fbp` cookie, use the timestamp when you first observed or received this fbp value.
- `Randomnumber` is  generated by the Meta Pixel SDK to ensure every `_fbp` cookie is unique.

_**Note**: If you use the parameter builder library to form fbc, the format will contain an appendix at the end. Please refer to the [parameter builder library](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library) page for more details._

Here's an example of what the `fbp` value could look like:

```js
fb.1.1596403881668.1116446470
```

## Learn More

* Visit the [Pixel Support guide](https://developers.facebook.com/docs/facebook-pixel/support) for any issues involving missing query parameters or broken redirects.
