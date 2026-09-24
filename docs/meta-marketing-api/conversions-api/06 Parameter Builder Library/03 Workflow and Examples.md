<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library/workflow-and-examples | Saved: 2026-09-19 -->

# Parameter Builder Workflow and Examples



The parameter builder library is an open-source lightweight SDK designed to fit in the majority of the systems.

## Workflow

You can find example demos for each language under their respective [sub-directories](https://github.com/facebook/capi-param-builder): A localhost-based demo application is under the folder titled /example. The README file shows how to run the demo application in localhost step by step.

### Client-side SDK

Directory:

* [clientJS](https://github.com/facebook/capi-param-builder/tree/main/client_js)

High-level integration guidance:

* Load the SDK: **clientParamBuilder** is loaded during page initialization.
* Call the SDK APIs: The advertiser's website calls the APIs provided by clientParamBuilder. For example:
    * **.processAndCollectAllParams** saves and updates `fbp`, `fpc` and `fbi` (if `getIpFn` is available)
        * If getIpFn is not empty, `fbi` will be saved in the cookie, based on the pass-in function getIpFn result.
        * Saves `fbc` if applicable.
        * Saves `fbp` if applicable.
    * **.getNormalizedAndHashedPII**: Return normalized and hashed PII data based on input value and type.
    * **.getFbc()**, **getFbp()**, **getClientIpAddress()**: Call **.processAndCollectAllParams** first to set in cookies, and retrieve the results from the cookie.
_Note: this API will save/update cookies. Make sure the website has the user's cookie consent before calling_.
* Send the Conversions API payload: The advertiser's website sends the Conversions API payload with retrieved parameters.

Refer to full instructions in README [file](https://github.com/facebook/capi-param-builder/blob/main/client_js/README.md).

### Server-side SDK

Directories:

* [PHP](https://github.com/facebook/capi-param-builder/tree/main/php)
* [NodeJS](https://github.com/facebook/capi-param-builder/tree/main/nodejs)
* [Java](https://github.com/facebook/capi-param-builder/tree/main/java)
* [Python](https://github.com/facebook/capi-param-builder/tree/main/python)
* [Ruby](https://github.com/facebook/capi-param-builder/tree/main/ruby)

High-level integration guidance:

* Import param builder library into advertiser's website server application.
* Process the request: Call updatedCookieList = builder.processRequest with input data.
* Get the cookies to set: Either use updatedCookieList or builder.getCookiesToSet to get a list of cookies we recommend saving.
* Save the cookies: The advertiser's website server saves cookies based on the above list.
* Fetch the parameters. Retrieve values using:
    * getFbc()
    * getFbp()
    * getClientIpAddress()
    * getNormalizedAndHashedPII()
* Send the Conversions API payload: The advertiser's website sends payload with the above parameters.

### [Recommended] Client-side + Server-side SDK

You can also integrate both client-side and server-side SDK in the same web application. They are compatible with each other, and leverage cookies for major interactions. This can help maximize the effectiveness of the parameter builder library.

*click image to enlarge*

1. Advertiser client application loads client-side parameter builder and invokes provided API **processAndCollectAllParams** with a function pointer getIpFn.
2. The provided getIpFn will be invoked and fetch IPv6 from an advertiser-configured endpoint, depending on the actual getIpFn implementation.
3. The IPv6 will be returned from the advertiser-configured endpoint and passed back to client-side parameter builder from the return value of getIpFn. The retrieved IPv6 will be stored in the cookie with key `_fbi` for later retrieval.
4. On the client-side, start your business-as-usual communications to the back-end server using the fetch API (or other front-back end communication) with the first-party cookies.
5. On the server-side, integrate the server-side library based on your choice of language in the receiver endpoint (for example, ExampleController) and invoke the provided API **processRequest** to handle the request.
6. The **processRequest** API will return a list of cookies we recommend updating on the client-side.
7. Set the recommended cookies in response headers to instruct the client browser to store them.
8. Invoke various provided APIs like **getFbc()**, **getFbp()**, **getClientIpAddress()** and **getNormalizedAndHashedPII()**.
9. The SDK will return various values such as `fbc`, `fbp`, `client_ip_address`, `email` and `phone number`.
10. Send these retrieved values back to Meta through the Conversions API.

