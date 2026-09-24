<!-- Source: https://developers.facebook.com/documentation/meta-pixel/advanced | Saved: 2026-09-19 -->

# Advanced



Tips for alternate implementations, using the Pixel with single-page web apps, and tracking conversions with button clicks and page scrolling.

## General Data Protection Regulation

If you conduct business in countries that are subject to General Data Protection Regulation (GDPR), please refer to our [GDPR document](https://developers.facebook.com/documentation/meta-pixel/implementation/gdpr) to learn how to become compliant.

## Install the Pixel using an IMG Tag

**Warning:** While you can use the IMG tag to install Pixels, we suggest you refer to our [Implementation guide](https://developers.facebook.com/documentation/meta-pixel/get-started#installing-the-pixel) for alternatives.

If you need to install the Pixel using a lightweight implementation, you can install it with an `<img>` tag. To do this, add the code below between an opening and closing `<noscript>` tag within your website's header or body, and replace `{pixel-id}` with your pixel's ID and `{standard-event}` with a [Standard Event](https://developers.facebook.com/documentation/meta-pixel/reference#standard-events).

```
<img src="https://www.facebook.com/tr?id={pixel-id}&ev={standard-event}" height="1" width="1" style="display:none"/>
```

Pixels installed using an `<img>` tag also support [parameters](https://developers.facebook.com/documentation/meta-pixel/implementation/conversion-tracking#parameters), which you can include in your query string. For example:

```
<img src="https://www.facebook.com/tr?id=12345
  &ev=ViewContent
  &cd[content_name]=ABC%20Leather%20Sandal
  &cd[content_category]=Shoes
  &cd[content_type]=product
  &cd[content_ids]=1234
  &cd[value]=0.50
  &cd[currency]=USD" height="1" width="1" style="display:none"/>
```

### Limitations

* Cannot be fired multiple times on each page load
* Cannot track standard or custom events triggered by UI interactions (e.g., a button click)
* Subject to HTTP GET limits in sending custom data or long URLs
* Cannot be loaded asynchronously

### Example IMG tag installation

Below is an example of Meta Pixel IMG tag installation across key pages of a fictitious website using a fictitious Pixel ID (`12345`) and custom parameters (e.g. `cd[currency]=USD`).

On the product page, a Pixel to track a `PageView` event and another to track a `ViewContent` event:

```html
<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=12345&ev=PageView"/>
```

```html
<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=12345&ev=ViewContent"/>
```

On the add-to-cart page, one Pixel to track a `PageView` event and another to track an `AddToCart` event, with custom data:

```html
<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=12345&ev=PageView"/>
```

```html
<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=12345&ev=AddToCart&cd[currency]=USD&cd[value]=0.00"/>
```

On the purchase page, one Pixel to track a `PageView` event and another to track a `Purchase` event, with data about the purchase:

```html
<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=12345&ev=PageView"/>
```

```html
<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=12345&ev=Purchase&cd[currency]=USD&cd[value]=0.00"/>
```

## Tracking clicks on Buttons {#buttonclicks}

When a visitor clicks a button, the Meta Pixel's JavaScript code automatically detects and passes the relevant form fields to Meta.

Suppose you have an e-commerce website and your "Add to Cart" button does not navigate to a new page. You may want to activate an event when the button is clicked.

In this example, we will activate a `ViewContent` standard event on page load. When someone clicks "Add to Cart" button, we will activate an `AddToCart` standard event.

To do this, first load Meta Pixel code that you want to fire on page load:

```html
<!-- Facebook Pixel Code -->
<script>
fbq('track', 'ViewContent', {
  content_name: 'Really Fast Running Shoes',
  content_category: 'Apparel & Accessories > Shoes',
  content_ids: ['1234'],
  content_type: 'product',
  value: 0.50,
  currency: 'USD'
 });
</script>
<!-- End Facebook Pixel Code -->
```

Then fire `AddToCart` either on a new page load or on the click of an Add To Cart button. There are multiple ways to handle clicks on buttons. Here's an example adding an `eventListener` to a button.

```html
<!-- Somewhere there is a button that performs Add to Cart -->
<button id="addToCartButton">Add To Cart</button>

<!-- Add Pixel Events to the button's click handler -->
<script type="text/javascript">
  var button = document.getElementById('addToCartButton');
  button.addEventListener(
    'click',
    function() {
      fbq('track', 'AddToCart', {
        content_name: 'Really Fast Running Shoes',
        content_category: 'Apparel & Accessories > Shoes',
        content_ids: ['1234'],
        content_type: 'product',
        value: 4.99,
        currency: 'USD'
      });
    },
    false
  );
</script>
```

There are many ways you can handle click events; just make sure to always call `fbq` function after the click.

Depending on how you have implemented the Pixel, the [Pixel Helper](https://developers.facebook.com/documentation/meta-pixel/support/pixel-helper) may show an error before the button is clicked. You can verify that your Pixel is firing correctly by clicking the button, which dismisses the helper's error.

## Triggering events based on visibility {#scrolltrack}
For this example, suppose you have a blog and want to track users who read the entire content of an article. There's no action from the user other than scrolling to the end of the page.

Here's the sample HTML for a page where the Pixel loads:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Facebook Pixel Code -->
  <script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');

  fbq('init', '<FB_PIXEL_ID>');
  fbq('track', "PageView");
  </script>
  <noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=<FB_PIXEL_ID>&ev=PageView&noscript=1"
  /></noscript>
  <!-- End Facebook Pixel Code -->
</head>

<body>
  <h1>Scroll Page until the Lead event is fired</h1>
  <div style="height: 120vh; width: 100vw; background-color: #00f;"></div>
  <h1 id="fb-fire-pixel">Lead event will fire when this phrase enters the screen</h1>
  <div style="height: 120vh; width: 100vw; background-color: #000;"></div>
</body>
</html>
```

When the `h1` element with `id=fb-fire-pixel` appears, we should fire the `Lead` standard event. To verify an element is visible on screen, we add the following code to the page:

```js
// This code should be loaded together with Meta Pixel

var executeWhenElementIsVisible = function(dom_element, callback) {

  if (!(dom_element instanceof HTMLElement)) {
    console.error('dom_element must be a valid HTMLElement');
  }

  if (typeof callback !== 'function') {
    console.error(
      'Second parameter must be a function, got',
      typeof callback,
      'instead',
    );
  }

  function isOnViewport(elem) {
    var rect = elem.getBoundingClientRect();
    var docElem = document.documentElement;
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || docElem.clientHeight) &&
      rect.right <= (window.innerWidth || docElem.clientWidth)
    );
  }

  var executeCallback = (function() {
    var wasExecuted = false;
    return function() {
      if (!wasExecuted && isOnViewport(dom_element)) {
        wasExecuted = true;
        callback();
      }
    };
  })();

  window.addEventListener('scroll', executeCallback, false);
};
```

After that, we need to define how to fire the Pixel when the element is visible on screen:

```js
// Get the element that should be visible to trigger the pixel fire
var element = document.getElementById('fb-fire-pixel');

// Then, set the event to be tracked when element is visible
// Note that second parameter is a function, not a function call
executeWhenElementIsVisible(element, function() {
  fbq('track', 'Lead');
});
```

## Triggering events based on page length or percentage {#scrollpagelengthtrack}
For this example, suppose you want to track users who read up to a length or percentage of the page. There's no action from the user other than scrolling to the desired page length or percentage.

This first example is to track the length of the page which the user has read. In the example, we are firing off the lead Pixel when the user has read up to 500px length of the page.

```js
var executeWhenReachedPageLength = function(length, callback) {
  if (typeof length !== 'number') {
    console.error(
      'First parameter must be a number, got',
      typeof length,
      'instead',
    );
  }

  if (typeof callback !== 'function') {
    console.error(
      'Second parameter must be a function, got',
      typeof callback,
      'instead',
    );
  }

  function getWindowLength() {
    return window.innerHeight ||
      (document.documentElement || document.body).clientHeight;
  }

  function getCurrentScrolledLengthPosition() {
   return window.pageYOffset ||
     (document.documentElement || document.body.parentNode || document.body).scrollTop;
  }

  var executeCallback = (function() {
    var wasExecuted = false;
    return function() {
      if (!wasExecuted && getCurrentScrolledLengthPosition() > length) {
        wasExecuted = true;
        callback();
      }
    };
  })();

  if (getWindowLength() >= length) {
    callback();
  } else {
    window.addEventListener('scroll', executeCallback, false);
  }
};

executeWhenReachedPageLength(10, function() {
  fbq('track', 'Lead');
});
```

This second example is to track the percentage of the page which the user has read. In the example, we are firing off the lead Pixel when the user has read 75% of the page.

```js
var executeWhenReachedPagePercentage = function(percentage, callback) {
  if (typeof percentage !== 'number') {
    console.error(
      'First parameter must be a number, got',
      typeof percentage,
      'instead',
    );
  }

  if (typeof callback !== 'function') {
    console.error(
      'Second parameter must be a function, got',
      typeof callback,
      'instead',
    );
  }

  function getDocumentLength() {
    var D = document;
    return Math.max(
        D.body.scrollHeight, D.documentElement.scrollHeight,
        D.body.offsetHeight, D.documentElement.offsetHeight,
        D.body.clientHeight, D.documentElement.clientHeight
    )
  }

  function getWindowLength() {
    return window.innerHeight ||
      (document.documentElement || document.body).clientHeight;
  }

  function getScrollableLength() {
    if (getDocumentLength() > getWindowLength()) {
      return getDocumentLength() - getWindowLength();
    } else {
      return 0;
    }
  }

  var scrollableLength = getScrollableLength();

  window.addEventListener("resize", function(){
    scrollableLength = getScrollableLength();
  }, false)

  function getCurrentScrolledLengthPosition() {
   return window.pageYOffset ||
     (document.documentElement || document.body.parentNode || document.body).scrollTop;
  }

  function getPercentageScrolled() {
    if (scrollableLength == 0) {
      return 100;
    } else {
      return getCurrentScrolledLengthPosition() / scrollableLength * 100;
    }
  }

  var executeCallback = (function() {
    var wasExecuted = false;
    return function() {
      if (!wasExecuted && getPercentageScrolled() > percentage) {
        wasExecuted = true;
        callback();
      }
    };
  })();

  if (getDocumentLength() == 0 ||
    (getWindowLength()/getDocumentLength() * 100 >= percentage)) {
    callback();
  } else {
    window.addEventListener('scroll', executeCallback, false);
  }
};

executeWhenReachedPagePercentage(75, function() {
  fbq('track', 'Lead');
});
```

## Delayed Pixel Fires {#delayed-pixel-fires}

Suppose you want to track users who interact with your website a few seconds before firing a Pixel event. You can do this with the `setTimeout` function.

```js
// Delay pixel fire by 3 seconds
var seconds = 3;
setTimeout(function() {
  fbq('track', 'Lead');
}, seconds * 1000);
```

It could be used to track “engaged” visits to a page, where people are not bouncing too fast and are actually reading the content.

## Triggering events based on articles viewed per session {#viewarticles}

If you want to know who viewed a certain number of articles from your site, you can have a session counter and load Meta Pixel code when this occurs.

We know that a session is a group of user interactions with your website that can take place within a given time frame per site request. You can increase the number of page views as long as you detect user activities given a time frame.

Assuming you have the variable `sessionCountViews` per `site_request`, you can add the Meta Pixel code based on the number of page views you counted.

Example counting only for the 6th article viewed

```js
if (site_request.sessionCountViews == 6) {
  fbq('track', "ViewContent", {
    sessionCountViews: site_request.sessionCountViews,
  });
}
```

## Selective event tracking with multiple Pixels {#multipixels}

If you have multiple Pixels on the same page and would like to selectively fire events on each unique Pixel, the `trackSingle` and `trackSingleCustom` capabilities should be used.

Using the `track` function on pages that have multiple Pixels initialized (either using multiple base codes or even combining it within one base code) could produce over-firing or unexpected behavior and should be applied only in specific situations.

Example where we fire a `PageView` event on both initialized Pixels and selectively fire a Standard event (`Purchase`) on one Pixel and a Custom Event on a second Pixel.

```js
fbq('init', '<PIXEL_A>');
fbq('init', '<PIXEL_B>');
fbq('track', 'PageView'); //fire PageView for both initialized pixels

// only fire the Purchase event for Pixel A
fbq('trackSingle', '<PIXEL_A>', 'Purchase', {
      value: 4,
      currency: 'GBP',
});

// only fire the custom event Step4 for Pixel B
fbq('trackSingleCustom', '<PIXEL_B>', 'Step4',{
  //optional parameters
});
```

## Tracking events for individual Pixels
In unusual cases, you may want to send events to just one of the Pixels installed on your website; for example, to restrict the data sent to one of the Pixels on your website.
These methods track Pixel fires for a single Pixel. They're called using the following:

```
fbq('trackSingle', 'FB_PIXEL_ID', 'Purchase', customData);
fbq('trackSingleCustom', 'FB_PIXEL_ID', 'CustomEvent', customData);
```

## Automatic Configuration

The Meta Pixel will send button click and page metadata (such as data structured according to Opengraph or Schema.org formats) from your website to improve your ads delivery and measurement and automate your Pixel setup. To configure the Meta Pixel to not send this additional information, in the Meta Pixel Base code, add `fbq('set', 'autoConfig', 'false', 'FB_PIXEL_ID')` above the init call.

```
<!-- Facebook Pixel Code -->
<script>
!function(f,b,e,v,n,t,s){
if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
// Line to enable Manual Only mode.
fbq('set', 'autoConfig', false, 'FB_PIXEL_ID');
//Insert Your Facebook Pixel ID below.
fbq('init', 'FB_PIXEL_ID');
fbq('track', 'PageView');
</script>
<noscript>
<img height="1" width="1" style="display:none"src="https://www.facebook.com/tr?id=FB_PIXEL_ID&ev=PageView&noscript=1"/>
</noscript>
<!-- End Facebook Pixel Code -->
```

## Content Security Policy

If your website has a [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP), you should allow JavaScript to load from `https://connect.facebook.net`. Note: The Pixel load scripts from two paths: `/en_US/fbevents.js` and `/signals/config/{pixelID}?v={version}`.
