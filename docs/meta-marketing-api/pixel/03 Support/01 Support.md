<!-- Source: https://developers.facebook.com/documentation/meta-pixel/support | Saved: 2026-09-19 -->

# Support



## Pixel Helper

If you are new to the Meta Pixel, or are having trouble tracking conversions, use our [Pixel Helper chrome extension](https://developers.facebook.com/documentation/meta-pixel/support/pixel-helper) to help you with debugging.

## FAQs

### Why does my URL show a 404 browser error instead of redirecting to the correct webpage when the ClickID is added?

* When using URL Shortener Services and vanity URL's, the click ID is added to the URL, however, the "`&`" is changed to a "`?`", `&fbclid={facebook-click-id}` to `?fbclid={facebook-click-id}`, or vice versa causing the URL to break.

### Why are my query string parameters, such as Click ID, missing in the URL?

* The webpage does not accept URL parameters.
* The webpage does not accept unexpected URL parameters that have been appended to the URL.

Because these issues are happening on the webpage outside of Facebook, please work with the appropriate website management resources to handle missing query parameters or to ignore the `fbclid` to get the redirect to work as expected.

### Does the Meta Pixel impact website performance?

The Meta Pixel is loaded asynchronously and does not block the display of the web page. Because all advertisers use the same Pixel script, the Pixel code will be already be in the browser’s cache If a user has visited any website with the Pixel installed.

## Learn More

* Meta Blueprint course: [Optimize and Troubleshoot the Meta Pixel](https://www.facebookblueprint.com/student/path/219716-optimize-troubleshoot-meta-pixel?content_id=CoMTkdSbJeiPXE1)
