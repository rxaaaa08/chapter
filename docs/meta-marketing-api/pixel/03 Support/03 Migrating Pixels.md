<!-- Source: https://developers.facebook.com/documentation/meta-pixel/support/pixel-migration | Saved: 2026-09-19 -->

# Migrating from Deprecated Pixels



We deprecated the Conversion Tracking Pixel in February, 2017, and it is no longer available for use. Start using the new Meta Pixel today — a single Pixel for more powerful advertising and measurement. For additional information about how to transition from the Conversion Tracking Pixel to the Meta Pixel, see [Advertiser Help Center, Meta Pixel](https://www.facebook.com/business/help/651294705016616).

If you use the Custom Audience Pixel or Conversion Tracking Pixel, you'll want to migrate to the Meta Pixel. To start, get the new Pixel code:

[Get the Pixel](https://www.facebook.com/ads/manager/pixel)

## Update the Pixel {#pixel}

The core JavaScript code for the original Custom Audience Pixel and the Conversion Tracking Pixel both look like this:

```
<script>
(function() {
  var _fbq = window._fbq || (window._fbq = []);
  if (!_fbq.loaded) {
    var fbds = document.createElement('script');
    fbds.async = true;
    fbds.src = 'https://connect.facebook.net/en_US/fbds.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(fbds, s);
    _fbq.loaded = true;
  }
  _fbq.push(['addPixelId', '<PIXEL_ID>']);
})();
window._fbq = window._fbq || [];
</script>
<noscript><img height="1" width="1" alt="" style="display:none" src="https://www.facebook.com/tr?ev=<PIXEL_ID>&cd[value]=0.00&cd[currency]=USD&noscript=1" /></noscript>
```

Go through your pages that contain this code and replace this with the Meta Pixel code, but make sure to replace `FB_PIXEL_ID` with your Meta Pixel ID:

```
<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
// Insert Your Meta Pixel ID below.
fbq('init', 'FB_PIXEL_ID');
fbq('track', 'PageView');
</script>
<!-- Insert Your Meta Pixel ID below. -->
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=FB_PIXEL_ID&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
```

## Updating Events {#events}

When you upgrade to the new Pixel you also need to update the code used to track events on your website.

For the Conversion Tracking Pixel, you track conversions as follows:

#### JavaScript

```
_fbq.push(['track','PIXEL_ID', { 'value': 0.00, 'currency': 'USD' }]);
```

#### Image

```
<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?ev=PIXEL_ID&cd[value]=0.00&cd[currency]=USD/>
```

Where `PIXEL_ID` is the Conversion Pixel ID that you want to track and the `{...}` contains information you want to log when the event occurs, such as the conversion value.

With the Meta Pixel, you can continue to support the Conversion Tracking Pixel conversions, until it is deprecated, using the following code:

#### JavaScript

```
fbq('track', 'PIXEL_ID', { value: 0.00, currency: 'USD' });
```

#### Image

```
<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?ev=PIXEL_ID&cd[value]=0.00&cd[currency]=USD"/>
```

The code for both standard and custom events with the Custom Audience Pixel looks like this:

#### JavaScript

```
_fbq.push(['track','Purchase',{ 'value': 0.00, 'currency': 'USD' }]);
_fbq.push(['track','CustomEvent',{ 'value': 0.00, 'currency': 'USD' }]);
```

#### Image

```
<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=FB_PIXEL_ID&ev=Purchase&cd[value]=0.00&cd[currency]=USD"/>

<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=FB_PIXEL_ID&ev=CustomEvent&cd[value]=0.00&cd[currency]=USD"/>
```

In the Meta Pixel, there is a new syntax which looks like this:

#### JavaScript

```
fbq('track', 'Purchase', { value: 0.00, currency: 'USD' });
fbq('trackCustom', 'CustomEvent', { value: 0.00, currency: 'USD' });/>
```

#### Image

```
<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=FB_PIXEL_ID&ev=Purchase&cd[value]=0.00&cd[currency]=USD"/>

<img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=FB_PIXEL_ID&ev=CustomEvent&cd[value]=0.00&cd[currency]=USD"/>
```

In this example we use the `track` value to indicate we're logging a standard event of type `Purchase` and we use `trackCustom` to track the custom events we define for use in Custom Audiences and custom conversions.
