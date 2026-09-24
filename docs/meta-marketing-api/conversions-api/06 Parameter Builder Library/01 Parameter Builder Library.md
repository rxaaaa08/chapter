<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library | Saved: 2026-09-19 -->

# Parameter Builder Library



The parameter builder library is a list of open-source SDKs in both client-side (browser JavaScript) and server-side (PHP, Java, Python, NodeJS, Ruby). You can implement the parameter builder library to improve the quality of your Conversions API integration. The library can help you create, manage, and send certain customer information parameters, which may lead to performance improvements through increased event match quality (EMQ) scores. The library handles event parameter management in the following ways:

* **Generates match keys**: It automatically generates high-priority Conversions API match keys according to Meta's best practices.
* **Enhances parameter coverage**: It increases coverage of important event parameters including `fbc` (Meta click ID), `fbp` (Meta browser ID), and IP addresses.
* **Ensures correct formatting**: It ensures that customer information you share, such as email and phone number, is formatted correctly to increase the likelihood of matching to Meta users.
* **Reduces manual effort**: It reduces the manual work and the potential for errors associated with managing event parameters yourself.

## Library overview

**Client-side**: The library and events live in the front-end on the browser side. The libraries are implemented in JavaScript. Developers may integrate it in their web page directly.

**Server-side**: The libraries and events live in the back-end on the server side. Depending on the language the backend uses, Meta provides libraries in different languages (PHP, Java, Python, NodeJS, and Ruby).

## Supported features

The supported parameters are as follows:

| Supported Parameter | Supported SDK | Description |
| --- | --- | --- |
| `fbc` (Click ID)<br><br>string | Client-side JavaScript<br><br>PHP<br><br>NodeJS<br><br>Java<br><br>Python<br><br>Ruby | The Meta click ID value is stored in the `_fbc` browser cookie under your domain. See [Managing fbc and fbp Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/fbp-and-fbc) for how to get this value or generate this value from a `fbclid` query parameter.<br><br>The format is: `fb.${subdomain_index}.${creation_time}.${fbclid}.${appendix}`<br><br>Example: `fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890.ABcDEFGh` |
| `fbp` (Browser ID)<br><br>string | Client-side JavaScript<br><br>PHP<br><br>NodeJS<br><br>Java<br><br>Python<br><br>Ruby | The Meta browser ID value is stored in the `_fbp` browser cookie under your domain. See [Managing fbc and fbp Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/fbp-and-fbc) for how to get this value or generate this value.<br><br>The format is: `fb.${subdomain_index}.${creation_time}.${random_number}.${appendix}`<br><br>Example: `fb.1.1596403881668.1116446470.ABcDEFGh` |
| `client_ip_address` (Client IP address)<br><br>string | Client-side JavaScript<br><br>PHP<br><br>NodeJS<br><br>Java *(coming soon)*<br><br>Python *(coming soon)*<br><br>Ruby *(coming soon)* | The IP address of the browser corresponding to the event must be a valid IPV4 or IPV6 address. IPV6 is preferable over IPV4 for IPV6-enabled users. The `client_ip_address` user data parameter must never be hashed.<br><br>Example:<br><br>IPV4: 168.212.226.204.`ABcDEFGh`<br><br>IPV6: 2001:0db8:85a3:0000:0000:8a2e:0370:7334.`ABcDEFGh` |
| Normalized parameters<br><br>string<br><br>* Email (em)<br>* Phone Number (ph)<br>* First Name (fn)<br>* Last Name (ln)<br>* Date of Birth (db)<br>* Gender (ge)<br>* City (ct)<br>* State (st)<br>* Zip code (zp)<br>* Country (country)<br>* External ID (`external_id`) | Client-side JavaScript<br><br>PHP<br><br>NodeJS<br><br>Java *(coming soon)*<br><br>Python *(coming soon)*<br><br>Ruby *(coming soon)* | The library adopts the best practice to normalize and hash the customer information parameters. No further action is needed. More format examples in [Customer Information Parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters)<br><br>Email Example:<br><br>Input: `John_Smith@gmail.com`<br><br>Normalized format: `john_smith@gmail.com`<br><br>Parameter builder SDK SHA256 output: `62a14e44f765419d10fea99367361a727c12365e2520f32218d505ed9aa0f62f.ABcDEFGh` |

## Supported format

For all parameters processed by the parameter builder, Meta will add an appendix field at the end of each parameter to help evaluate the performance of the library. The appendix field has 8 characters containing (1) the SDK version, (2) incrementalability, (3) the SDK language.

Check GitHub for implementation details. ([PHP](https://github.com/facebook/capi-param-builder/blob/main/php/capi-param-builder/src/util/AppendixProvider.php) example)

**Note**: If you are seeing the appendix as 2 characters, it is a legacy appendix that only contains the SDK language. Upgrade to the latest version.

## Best practices

* Implement across all surfaces: Make sure the libraries are applied to all surfaces, such as mobile, desktop, and browsers, and domains you want to track.
* Client-side vs Server-side libraries:
    * The server-side library is for the back-end server side integration. The server-side library provides support for different languages (PHP, Java, Python, NodeJS, and Ruby)
    * The client-side library is for the front-end browser side integration. Note that client-side is only available in JavaScript.
* Cookie management:
    * Capture cookies early: Make sure you save the `_fbp` and `_fbc` cookies as early as possible in the customer journey in your webpage. Ideally retrieve `_fbp` and `_fbc` cookies when loading your landing page. Do not retrieve them only from down-funnel events or when certain events are triggered.
    * Preserve the cookie value format: Do not override or adjust the `_fbc` or `_fbp` cookie. `_fbc` is case sensitive; do not normalize or format the `_fbc` to lowercase.
* IP address handling:
    * Prioritize IPv6 for `getIpFn`: When you implement the `getIpFn` functionality, retrieve the IPv6 address first, then fall back to the IPv4 address if the IPv6 address retrieval capability is not available from the user's client side.
    * Integrate both the client and server parameter builder to achieve optimized performance:
        * Use the client-side parameter builder to retrieve `client_ip_address` and save to a cookie first.
        * Then use the server-side parameter builder to get the best available `client_ip_address` from both cookie and request to send to Meta using the Conversions API.
* Data normalizing and hashing:
    * Normalize and hash only once: Apply normalization and hashing to customer information parameters only once—either on the client side or the server side—before sending them to Meta through the Conversions API.
    * Parameter value is case-sensitive: All the customer information parameter fields' values returned from the parameter builder are case sensitive. You can send these values as is back to Meta through the Conversions API without any normalizing (for example, lowercase), as it has been done automatically by the parambuilder SDK in the process.

