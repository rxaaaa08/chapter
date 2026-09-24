<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library/get-started | Saved: 2026-09-19 -->

# Parameter Builder Get Started Guide



The open-source parameter builder library's core functions require interaction with the cookie. Please make sure you've read through the cookie interaction section before proceeding.

## Manage Cookie Interaction

The parameter builder library may read and store cookies based on the API calls.

Parameter builder client-side SDK contains APIs to automatically save cookies when triggered. The server-side SDK can't write cookies, but it is recommended that advertisers save the suggested cookies list from returned APIs.

Please check the usage below for each API. With regard to the user's cookie and consent, please refer to the [Meta Business Tools Terms](https://www.facebook.com/legal/technology_terms) for details

### Integration with cookie consent

Businesses can implement code that creates a banner and requires affirmative consent (for example, an "I agree" checkbox at the top of the page) to allow cookie saving actions through the parameter builder library. If you already have a system in place that addresses this need, such as a tag manager, you can make this code optional.

## Quick Start Guide

Main Github link: `https://github.com/facebook/capi-param-builder`

Please make sure you are on the latest version.

* PHP: [README](https://github.com/facebook/capi-param-builder/blob/main/php/README.md?fbclid=IwZXh0bgNhZW0CMTAAYnJpZBExbno4VGJSUndyWTlBQ3V2TXNydGMGYXBwX2lkEDIyMjAzOTE3ODgyMDA4OTIAAR5tokAL979f0k9QMOaqj0zRfl3fHmvboOnIW9a1IOYwb69CXYdOf0IxQVHqxg_aem_owDtD09TvNummgpGOz8y0w)
* NodeJS: [README](https://github.com/facebook/capi-param-builder/blob/main/nodejs/README.md?fbclid=IwZXh0bgNhZW0CMTAAYnJpZBExbno4VGJSUndyWTlBQ3V2TXNydGMGYXBwX2lkEDIyMjAzOTE3ODgyMDA4OTIAAR6LCq-sePpqcCvHKLyX1vlYoll0PQieIWsGG3qB3g5gjel4NoVjsgJkh7kLdA_aem_K0Ibhp9zVcdqFyl7OksLUw)
* Java: [README](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2Ffacebook%2Fcapi-param-builder%2Fblob%2Fmain%2Fjava%2FREADME.md%3Ffbclid%3DIwZXh0bgNhZW0CMTEAYnJpZBExTVlWSkhXTDF2NlpMZk11Y3NydGMGYXBwX2lkATAAAR6pL9LwNFWG3YWlOquaZlRK7PhRlUPvsI7zAo2ja9Am270wPPI7cPP9MBhTZg_aem_exGRtPPftALnXwQkYnnsbg&h=AT0BNtOivNE_BNCmr0VwCGB00SjDJq3RdIYQVq6q18CUjT_ne-dpwRAr_D_5Kd2hKI1_HngY8xn9sRC20ABdfz2bew-Da2FzJ1-dTHsDfnOAG4ZdkKre99V63bTrSo919Ij7IFdWwWC_qe3lWe4dSEGiYQM)
* Python: [README](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2Ffacebook%2Fcapi-param-builder%2Fblob%2Fmain%2Fpython%2FREADME.md%3Ffbclid%3DIwZXh0bgNhZW0CMTEAYnJpZBExTVlWSkhXTDF2NlpMZk11Y3NydGMGYXBwX2lkATAAAR4Gan4VARzLUBzRar4nK3VxePwLNUoN8X6jp12YjZcabjMb6xxjVUqc4T8Qpw_aem_Q5fW8SiB8PW74ZSfuJkC3Q&h=AT23lcU-6t7RnGbi7XHHFIQJsn-hxHmalRVkLn9hfvynLj8R7ojgtYrtP9kutu_J9BBpSnsVBpwhLO63Z2Gxt4cs4Jo7NRFH-1EDUvo7Ljs3JONC32tabNWYKetGeZZZ_eG20B5iXnDZ--0bwBnTQEgJe1I)
* Ruby: [README](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2Ffacebook%2Fcapi-param-builder%2Fblob%2Fmain%2Fruby%2FREADME.md%3Ffbclid%3DIwZXh0bgNhZW0CMTEAYnJpZBExTVlWSkhXTDF2NlpMZk11Y3NydGMGYXBwX2lkATAAAR6NIhae8JbR6oiDx0b2uabW4nMXFDVrcDmMwsoXUzF0HDH2hv7Lsd0TSksxGQ_aem_AsM8En38PrpaFANv2SpWYg&h=AT3-JEk5kRHYdfZgRoJYGJ8SvY2J5uNI_QEfQ31V0fRdbl08BFD90fE4MYBZaImmBUtOVvnDZU51iIzSG5mifDcuM7aMrA1318b4E9scvxTAvcJa3QO0xpla4EhwqIeD8FyP1ocqFE44GWmrh1soWXHJUY0)
* Client JavaScript: [README](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2Ffacebook%2Fcapi-param-builder%2Fblob%2Fmain%2Fclient_js%2FREADME.md%3Ffbclid%3DIwZXh0bgNhZW0CMTEAYnJpZBExTVlWSkhXTDF2NlpMZk11Y3NydGMGYXBwX2lkATAAAR7xVHv9vWUWEe-sB7DI5y7WT7pXgEyNokXMNF3mLI9smGpr0qycU8pC6gW9bA_aem_sGoDdh6P97HvlIgVBWIAEA&h=AT21iPl5NgvnF_mz9hh65y4AE_SuHg8JVq2KNJjHD0OowwHWzglhI-i3Khi3GvFGzPSkX3ipeW_GQSNPaTWGUetAO1lrXvSE75x1hPtbguKY-n2GytNyv7kMblqIa9BCFY_FZOCXFiHR2HLIV78awGZztxQ)

