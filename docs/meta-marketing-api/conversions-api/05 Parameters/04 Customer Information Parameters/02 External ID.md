<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/external-id | Saved: 2026-09-19 -->

# External ID



*Object Type: string or array of strings | Hashing is recommended*

External ID is a string that represents a user on an advertiser's system, like loyalty membership IDs, user IDs, and external cookie IDs. You can send one or more `external_id`s for a given event and we try to match it to someone on Facebook.

External IDs can be sent via multiple channels, including browser Pixel, Conversions API, and Offline Conversions API (OCAPI). You must be consistent across channels. For example, if you send a browser Pixel event with `external_id` set to `123`, your Conversions API event for that same user should also have `external_id` set to `123`.

To check on `external_id`s sent via browser Pixel, look for the Pixel Helper under Advanced Matching Parameters Sent. `external_id`s are not available in the Test Events tool.

## Why You Should Use It

As an advertiser, you may already assign your own ID to users that visit your properties. The `external_id` field allows you to leverage these IDs to:

- **Scale your business**: Once you provide `external_id`, it can be used again across different channels and to create different audiences. On your end, just map `external_id` to your internal identity system and you no longer need to manage a large number of PIIs.
- **Improve match rates and leverage matches across channels**: Improve match rates on channels you do not have access to certain identifiers, leveraging information coming from another channel. See [Example - Leverage Match Type Across Channels](#cross-channel-example).
- **Create your own audiences**: See [Audience Creation](#audience-creation).
- **Increase security and privacy**: Instead of uploading hashed PIIs multiple times, you can send your `external_id` with PIIs once and you can reuse that match.

## How It Works
### Step 1
You send us an event with `external_id` and a number of other [customer information parameters](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/customer-information-parameters). The event can be sent via different channels, including browser Pixel, Conversions API, and Offline Conversions API.
### Step 2
On our end, we look for a match using all the information you sent. If we find a match, we associate the `external_id` you provided with that specific user.
### Step 3
In subsequent events, you can send us an event containing only `external_id`. On our end, we keep the previously established association between your external_id and the matched Facebook user.

The `external_id` to specific user matches expire periodically. We recommend that you refresh it as frequently as possible.

### Example - Leverage Match Type Across Channels {#cross-channel-example}

1. You have a website with the browser Pixel.  
2. A user views a specific product on your website.
3. You send us a `ViewContent` event via browser Pixel containing hashed customer information. You include hashed email and hashed external ID for that user. The Pixel automatically includes cookie information.  
4. On our end, we use the hashed email to find a match. We remember the mapping between your external_id and that Facebook user.  
5. A couple of days later, that same user completes a purchase on your website.  
6. You send us a new event. This time, you use the Conversions API. In the event, you include `external_id`.  
7. We get your `external_id`. We see that a match was already made with data sent via Pixel. We can leverage the existing mapping on Conversions API.

### Example - Partner Use Case {#partner-use-case}
Leverage `external_id` to report conversions that happen on a partner's website. In that case, the process looks like this:

1. User is on your website and clicks on your partner's website.
2. You send a Pixel event an `external_id` to Facebook. To your partner, you send a redirect request including `external_id`.
3. User completes a conversion on your partner's website.
4. Your partner sends you conversion information, including `external_id`. Your partner does not have to share any sensitive information.
5. You send us another event, including the new conversion information and the respective `external_id`.

## Audience Creation {#audience-creation}
It is imperative that you be consistent using `external_id`s across browser Pixel, Conversions API, Offline Conversions API, and App Events. This way, you can use `external_id`s to create the following types of audience:

- [Website Custom Audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences)
- [Mobile App Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/mobile-app-custom-audiences)
- [Offline Custom Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/offline-custom-audiences)
- [Lookalike Audiences](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/lookalike-audiences) trained on Website Custom Audiences, Mobile App Custom Audiences, and Offline Custom Audiences

Note that [Customer File Custom Audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/custom-audiences) is not listed. This type of audience uses different policies and cannot be created using only `external_id` or `extern_id` from data received through Conversions API.

## Fbp Parameter

**If you are able to add  `external_id`s in your events, you should always do so.** But, if your system is not set up for that, we can mitigate the problem by using the `fbp` parameter as an external ID. [Learn more about the `fbp` parameter](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameters/fbp-and-fbc#fbp).

| Scenario | How Data Is Handled |
| --- | --- |
| Event includes `fbp`, but not `external_id` | We use `fbp` as `external_id` and try to find a match. Since `fbp` is a browser cookie, it has an expiration date. |
| Event includes `fbp` and `external_id` | We save both fields and try to find a match. `external_id` is always favored, since it offers improved performance. |
| Event includes `external_id`, but not `fbp` | This is processed as a regular event including `external_id`. |

