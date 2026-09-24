<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/original-event | Saved: 2026-09-19 -->

# Original Event Data Parameters



Use these parameters to share original event information you want to associate with the Conversions API.
| Parameter | Description |
| --- | --- |
| `event_name`<br><br>string | **Optional.**  <br>A [standard event](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#standard-events) or [custom event](https://developers.facebook.com/docs/facebook-pixel/implementation/conversion-tracking#custom-events) name. |
| `event_time`<br><br>integer | **Optional.**  <br>A Unix timestamp in seconds indicating when the actual event occurred. The specified time may be earlier than the time you send the event to Facebook. You must send this date in the GMT time zone. |
| `order_id`<br><br>string | **Optional.**  <br>The order ID for this transaction as a string. |
| `event_id`<br><br>string | **Optional.**  <br>This ID can be any unique string chosen by the advertiser. The `event_id` and `event_name` parameters are used to deduplicate events sent by both web (via the Meta Pixel) or app (via SDK or App Events API) and the Conversions API. **Note that while** `event_id` **is marked optional, it is recommended for event deduplication**.<br><br>For deduplication, the `eventID` from a browser or app event must match the `event_id` in the corresponding server event. Learn more about [Handling Duplicate Pixel and Conversions API Events](https://developers.facebook.com/documentation/ads-commerce/conversions-api/deduplicate-pixel-and-server-events).<br><br>An order number or transaction ID are two potential identifiers that can be used for `event_id`. For example, if a customer makes two purchases on your website with order numbers 123 and 456, each Conversions API call would need to include its respective order number for `event_id`. This allows us to properly distinguish these two purchase events as distinct orders. The two corresponding browser Pixel purchase events would need to also send the same order numbers in the `eventID` parameter for us to understand that there were only two events that took place, not four unique purchases.<br><br>For other events without an intrinsic ID number, a random number (so long as the same random number is sent between browser and server events) can be used. |

