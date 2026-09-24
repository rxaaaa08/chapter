<!-- Source: https://developers.facebook.com/documentation/meta-pixel/implementation/pixel-for-movies | Saved: 2026-09-19 -->

# Meta Pixel for Movies



You can track website visitor activity for movie ad campaigns by setting up [conversion tracking](https://developers.facebook.com/documentation/meta-pixel/implementation/conversion-tracking) for the following standard events.

### Requirements

The Pixel's [base code](https://developers.facebook.com/documentation/meta-pixel/get-started#base-code) must already be installed on every page where you will to tracking the standard events below.

## Standard Events

You must track the following [standard events](https://developers.facebook.com/documentation/meta-pixel/implementation/conversion-tracking#standard-events) and include a parameter object that contains the specified [object properties](#object-properties).

### ViewContent

Track the following `ViewContent` standard event on your movie ad campaign's **landing page**. This should be the first page that Meta ad-driven visitors reach when clicking your ad.

```
<script type="text/javascript">
fbq(
  'track',
  'ViewContent',
  {
    content_ids: ['partner_movie_id|partner_theater_id|showtime'], // your content ID values go here
    movieref: 'fb_movies' // or an empty string
  }
);
</script>
```

### InitiateCheckout

Track the following `InitiateCheckout` standard event on your movie ad campaign's **payment page**:

```
<script type="text/javascript">
fbq(
  'track',
  'InitiateCheckout',
  {
    content_ids: ['partner_movie_id|partner_theater_id|showtime'], // your content ID values go here
    movieref: 'fb_movies', // or an empty string
    num_items: 2 // your number of tickets to be purchased value goes here
  }
);
</script>
```

### Purchase

Track the following `Purchase` standard event on your movie ad campaign's **payment confirmation** page:

```
<script type="text/javascript">
fbq(
  'track',
  'Purchase',
  {
    content_ids: ['partner_movie_id|partner_theater_id|showtime'], // your content ID values go here
    currency: 'USD', // your currency string value goes here
    movieref: 'fb_movies', // or an empty string
    num_items: 2, // your number of tickets purchased value goes here
    value: 30.60 // your total transaction value goes here
  }
);
</script>
```

### PageView

Track the following `PageView` standard event on any pages of your movie ad campaign's checkout flow, **other than your landing page, payment page, or payment confirmation page**:

```
<script type="text/javascript">
fbq(
  'track',
  'PageView',
  {
    movieref:'fb_movies' // or an empty string
  }
);
</script>
```

## Object Properties

| Property | Value Type | Description |
| --- | --- | --- |
| `content_ids` | String | IDs, separated by pipe symbols (`\|`), that uniquely identify the movie, theater, and showtime, in that order. Showtime should be in the ISO 8601 format. |
| `currency` | String | The currency's 3 letter ISO code. |
| `movieref` | String | If the referrer URL contains `eventref=movieref` as a query string parameter, then set this property's value to `'fb_movies'`. Otherwise, set it to an empty string (`''`). |
| `num_items` | Integer | The number of tickets the visitor is purchasing. |
| `value` | Integer | Total price. |

