<!-- Source: https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data-image-overlay-spec | Saved: 2026-09-19 | From Meta's older docs site (this page has not moved to the new site yet), converted from the web page -->

# Ad Creative Link Data Image Overlay Spec

## Reading

How to render overlays on an image for a dynamic item in [Dynamic Ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management/). Image overlays are not supported on Instagram, if you use image overlays, the ad will be delivered to Instagram but the overlay will not render on the images.

### Parameters

This endpoint doesn't have any parameters.

### Fields

| Field | Description |
| --- | --- |
| `custom_text_type`enum {free_shipping, popular, sale} | Render custom text overlays on the image. This option only applies when `text_type` is `custom`. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `float_with_margin`bool | Render margin between overlay and edge. This option only applies with `pill_with_text` [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `overlay_template`enum {pill_with_text, circle_with_text, triangle_with_text} | Overlay creative template. This includes a background shape and text layout [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `position`enum {top_left, top_right, bottom_left, bottom_right} | Position for overlay on an image. `pill_with_text` and `circle_with_text` templates allowed on all four positions. `triangle_with_text` only allowed on `top_left` and `top_right` [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `text_font`enum {droid_serif_regular, lato_regular, nunito_sans_bold, open_sans_bold, open_sans_condensed_bold, pt_serif_bold, roboto_medium, roboto_condensed_regular, noto_sans_regular, dynads_hybrid_bold} | Font type for text strings. If you choose a text type which shows prices, and there are items with currencies other than dollar and euro in the product set, you should use `dynads_hybrid_bold` for your font. If you choose another font, we default to `dynads_hybrid_bold` for items with non-dollar, non-euro currencies [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `text_template_tags`list<string> | A list of template tags used to create custom content for a `particular text_type`. For example, when `text_type` is `price`, format price by passing in `["{{product.price round}}"]` in order to format `334.56` as `335`. Some businesses have multiple pricing options and this field enables you to customize the pricing option that appears in an ad. For example, for hotels, two pricing options are `["{{hotel.base_price}}"]` or `["{{hotel.sale_price}}"]`. If you use text types with multiple fields, such as `strikethrough` and `percentage_off`, you should provide the higher price to be the first element in the array. [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `text_type`enum {price, strikethrough_price, percentage_off, custom, from_price, disclaimer, guest_rating, star_rating, sustainable, automated_personalize} | Content type for text string that overlays a dynamic item. We display the actual text strings from your catalog. For `price` text type with `pill_with_text` template, limited to 13 characters, including whole price string with currency symbols. Limited to 6 characters for `price` text type with other templates. Limited to 6 characters for `strikethrough_price` text type with all templates. We do not display text overlay for any item with a price string longer than these limits [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |
| `theme_color`enum {background_e50900_text_ffffff, background_f78400_text_ffffff, background_00af4c_text_ffffff, background_0090ff_text_ffffff, background_755dde_text_ffffff, background_f23474_text_ffffff, background_595959_text_ffffff, background_000000_text_ffffff, background_ffffff_text_c91b00, background_ffffff_text_f78400, background_ffffff_text_009c2a, background_ffffff_text_007ad0, background_ffffff_text_755dde, background_ffffff_text_f23474, background_ffffff_text_646464, background_ffffff_text_000000} | Theme colors to use in overlay. Includes background color and text color. Valid themes must contain two sets of color themes: one for white background with color text and another for color background and white text [Default](https://developers.facebook.com/docs/graph-api/using-graph-api/#fields) |

## Creating

You can't perform this operation on this endpoint.

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.
