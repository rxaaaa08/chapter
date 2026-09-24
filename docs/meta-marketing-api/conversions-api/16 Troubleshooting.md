<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/support | Saved: 2026-09-19 -->

# Troubleshooting



Under the hood, all Facebook APIs share the same infrastructure. Searching the [Facebook Developers](https://developers.facebook.com/) website may reveal more relevant information for your specific situation. You can also visit the [Developer Support](https://developers.facebook.com/support/) page, check [open bugs](https://developers.facebook.com/support/bugs/), and drop by the [Facebook Developer Community Forum](https://developers.facebook.com/community).

## Debug {#debug}

The Conversions API returns minimal data to conserve network bandwidth. If the event payload is valid, a `2xx HTTP` response code is returned. If invalid, a `4xx HTTP` response code is returned, with minimal error details in the response body.

## API Errors

Network errors or malformed requests may cause events to be dropped. We recommend retrying the request in cases where the response indicates a non-client error, such as a timeout. To account for various network delays, we recommend setting a timeout of 1500 milliseconds on the request. For the majority of requests, the response time will be under 600 milliseconds.

## Business Help Center

- [Best Practices for Conversions API](https://www.facebook.com/business/help/308855623839366?id=818859032317965)

## Meta Blueprint

- [Troubleshoot the Conversions API](https://www.facebookblueprint.com/student/path/219715-troubleshoot-conversions-api?content_id=ZbUUsTHXsAp6kZO)

## See Also

* [Business Manager Best Practices and FAQ](https://developers.facebook.com/docs/marketing-api/businessmanager/bestpractice)
* [Pixel Helper Chrome Extension](https://developers.facebook.com/docs/facebook-pixel/support/pixel-helper)
* [Developer FAQ](https://developers.facebook.com/support/faq)
* [Facebook Developer Community Group](https://www.facebook.com/groups/fbdevelopers)
