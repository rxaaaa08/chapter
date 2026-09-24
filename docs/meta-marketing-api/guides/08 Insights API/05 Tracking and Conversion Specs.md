<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/tracking-specs | Saved: 2026-09-19 -->

# Tracking and Conversion Specs



`Tracking Specs` are used primarily for monitoring and reporting purposes. They define what user actions should be tracked after they view or click on an ad. These specs help advertisers understand how users interact with the ad content and whether it leads to offsite conversions, app installs, or other key actions. Tracking specs do not directly influence the optimization of ad delivery but are essential for gathering data on user engagement.

`Conversion specs` are used to define the conditions under which a conversion (a desired action by the user) is counted. These specs are crucial for attributing conversions to specific ads and for optimizing ad performance. Conversion specs are used in the optimization process of ad delivery, where the system predicts and improves conversion rates. `Conversion_specs` has been **read-only** since v2.4. The value is derived from `optimization_goal` from [ad set](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign).

## Set tracking specs {#create}
Use with any bid type and [creative](https://developers.facebook.com/docs/reference/ads-api/creative-specs) combination. To specify tracking specs, you need an additional field in an [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup), named `tracking_specs`. The `tracking_specs` field takes arguments identical to [action spec](https://developers.facebook.com/docs/marketing-api/reference/conversion-action-query). To create an ad, see [ad creation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup).

## Default tracking specs {#default}

Certain objective, `bid_type`, and creative combinations have a set of default tracking specs. If you set any additional new tracking specs, the default tracking specs are still available and Meta does not overwrite them. For `APP_INSTALLS` or `OUTCOME_ENGAGEMENT` objectives, **Meta overwrites the default tracking specs**. To keep the defaults, add them to your custom specs.

You can use both string or array notation in the spec such as `'APPLICATION_ID'` or `['APPLICATION_ID']`.

* CPM refers to `billing_event=IMPRESSIONS`, `optimization_goal=IMPRESSIONS`
* CPC refers to `billing_event=CLICKS`, `optimization_goal=CLICKS`
* oCPM refers to `billing_event=IMPRESSIONS`, `optimization_goal` set to an action
* CPA refers to both `billing_event` and `optimization_goal` set to an action

| Objective | Creative, Bid type | Tracking Spec | Description |
| --- | --- | --- | --- |
| CANVAS_APP_  <br>ENGAGEMENT | Canvas app engagement ads with `optimization_goal= APP_INSTALLS` | [{'action.type':  <br>'app_engagement',  <br>'application':  <br>'APPLICATION_ID'}, {'action.type':  <br>'post_engagement',  <br>'post':'POST_ID', 'page':'PAGE_ID'}] | See app_engagement and post_engagement [meta specs](#meta) |
| CANVAS_APP_  <br>INSTALLS | Canvas app install ads with optimization **not** set to  `optimization_goal= APP_INSTALLS` | [{'action.type':  <br>'app_engagement',  <br>'application':  <br>'APPLICATION_ID'}, {'action.type':  <br>'post_engagement',  <br>'post':'POST_ID', 'page':'PAGE_ID'}] | See app_engagement and post_engagement [meta specs](#meta) |
| CONVERSIONS | Page post link and photo ads with `promoted_object` set to a pixel ID and `optimization_goal= OFFSITE_CONVERSIONS` | {'action.type':  <br>'post_engagement',  <br>'post':'POST_ID', 'page':'PAGE_ID'},  <br>{'action.type':'like',  <br>'page':PAGE_ID} | Post Engagement, Page Like specs. Number of link clicks on the specific page post if there is only one link, number of engagements on the post, and number of times users generate stories or engage with a page |
| CONVERSIONS | Page post link and photo ads with optimization **not** set to `optimization_goal= OFFSITE_CONVERSIONS` | {'action.type':  <br>'offsite_conversion',  <br>'fb_pixel':  <br>'FACEBOOK_PIXEL_ID'}, {'action.type':{'action.type':  <br>'post_engagement',  <br>'post':'POST_ID', 'page':'PAGE_ID'},  <br>{'action.type':'like',  <br>'page':PAGE_ID} | Conversions, Post Engagement, Page Like specs. Number of link clicks on the specific page post if there is only one link, number of engagements on the post, and number of times users generate stories or engage with a page |
| CONVERSIONS | Domain ads with `promoted_object` set to a pixel ID and `optimization_goal= OFFSITE_CONVERSIONS` | {'action.type':  <br>'link_click',  <br>'object':'PAGE_ID'}, {'action.type':'like',  <br>'page':PAGE_ID} | Page Likes, Link Clicks specs. Number of link clicks on the specific page post if there is only one link, number of engagements on the post, and number of times users generate stories or engage with a page. |
| CONVERSIONS | Domain ads with optimization **not** set to `optimization_goal= OFFSITE_CONVERSIONS` | {'action.type':  <br>'offsite_conversion',  <br>'fb_pixel':  <br>'FACEBOOK_PIXEL_ID'},<br>{'action.type':  <br>'link_click',  <br>'object':'PAGE_ID'}, {'action.type':'like',  <br>'page':PAGE_ID} | Conversion, Page Likes, Link Clicks specs. Number of link clicks on the specific page post if there is only one link, number of engagements on the post, and number of times users generate stories or engage with a page. |
| EVENT_RESPONSES | Event ads with optimization **not** set to  `optimization_goal= EVENT_RESPONSES` | [{'action.type':'rsvp' ,  <br>'response':'yes', 'event':'EVENT_ID'},  <br>{'action.type':'rsvp' ,  <br>'response':'maybe', 'event':'EVENT_ID'},  <br>[{'action.type':'rsvp' ,  <br>'response':'no', 'event':'EVENT_ID'}] | Number of RSVPs (yes, maybe, no) to an event. |
| EVENT_RESPONSES | Event ads with `optimization_goal= EVENT_RESPONSES` | empty (conversion spec will cover the tracked actions) | Number of RSVPs (yes, maybe, no) to an event. |
| LINK_CLICKS | Page post link and photo ads with any bid option | {'action.type':  <br>'post_engagement',  <br>'post':'POST_ID', 'page':'PAGE_ID'} | Post Engagement.  <br>Number of times an offsite url link, link with particular url domain, offsite link on a page, offsite link on a post was clicked. |
| LINK_CLICKS | Domain ads with `optimization_goal= LINK_CLICKS` | {'action.type':'like',  <br>'page':PAGE_ID}] | Page likes.  <br>Number of times an offsite url link, link with particular url domain, offsite link on a page, offsite link on a post was clicked. |
| LINK_CLICKS | Domain ads with optimization **not** set to `optimization_goal= LINK_CLICKS` | {'action.type':  <br>'link_click',  <br>'object':'PAGE_ID'}, {'action.type':'like',  <br>'page':PAGE_ID} | Website Click, Page Likes.  <br>Number of times an offsite url link, link with particular url domain, offsite link on a page, offsite link on a post was clicked. |
| MOBILE_APP_  <br>ENGAGEMENT | Mobile app engagement ads with any bid option | {'action.type':  <br>'post_engagement',  <br>'post':'POST_ID', 'page':'PAGE_ID'}  <br>**For App Engagement Ads you must specify a tracking spec explicitly using the Facebook App ID:**  <br>[{'action.type':<br>'mobile_app_install',<br>'application':<br>'APP_ID'},<br>{'action.type':  <br>'app_custom_event',  <br>'application':APP_ID}] | See post_engagement [meta spec](#meta). Also, number of times an [app event](https://developers.facebook.com/docs/ios/app-events) occurs. |
| MOBILE_APP_  <br>INSTALLS | Mobile app install ads with any bid option | {'action.type':  <br>'post_engagement',  <br>'post':'POST_ID', 'page':'PAGE_ID'}  <br>**For App Install Ads you must specify a tracking spec explicitly using the Facebook App ID:**  <br>[{'action.type':  <br>'app_custom_event',  <br>'application':APP_ID},<br>{'action.type':<br>'mobile_app_install',<br>'application':<br>'APP_ID'}] | See post_engagement [meta spec](#meta). Also, number of times users install the app through a [mobile app install ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/mobile-app-ads) if there is an iOS/Android version and the number of times an [app event](https://developers.facebook.com/docs/ios/app-events) occurs. |
| NONE | Any ad type | See [default tracking  <br>specs by ad type](https://developers.facebook.com/documentation/ads-commerce/marketing-api/tracking-specs#default_by_ad) |  |
| PAGE_LIKES | Page Like ads or page post ads with any bid option | {'action.type':  <br>'page_engagement', 'page':'PAGE_ID'} | See Page Engagement [meta spec](#meta) |
| POST_ENGAGEMENT | Page post ads with optimization **not** set to `optimization_goal= POST_ENGAGEMENT` | {'action.type':  <br>'post_engagement',  <br>'post':'POST_ID', 'page':'PAGE_ID'} | See Page Post Engagement [meta spec](#meta) |
| POST_ENGAGEMENT | Page post ads with `optimization_goal= POST_ENGAGEMENT` | empty | See Page Post Engagement [meta spec](#meta) |
| POST_ENGAGEMENT (testing) | any | {'action.type':  <br>'dwell',  <br>'post':'POST_ID', 'page':'PAGE_ID'} | A small percentage of this kind of ad has `dwell` tracking type, focusing on users spending at least a min time on the ads. |
| PRODUCT_<br>CATALOG_SALES | [Dynamic Product Ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads) | {'action.type':<br>'post_engagement',<br>'page': PAGE_ID,<br>'post': POST_ID} | Number of link clicks on the specific page post if there is only one link, number of engagements on the post, number of times users generate stories or engage with a page. You can specify a product set that is different from the product set in the promoted object but the default is the product set specified in the promoted object. |

## Meta specs {#meta}

You can specify multiple types of actions on a single object using a single spec.

| Object | Conversion Spec | Description |
| --- | --- | --- |
| Application | {"action.type":["app_engagement"], "application":["APPLICATION_ID"]} | Number of times users generate stories `app_story` or engage with content via app_use, app_install, credit_spent. |
| Page | {"action.type":["page_engagement"], "page":["PAGE_ID"]} | Number of times users perform any of the following actions in the context of the specified page: check-in, comment, follow, like, page post like, mention, post on page, share a post, answer a question. Plus the number of times users perform any of the following actions in the context of the specified page: click a link, view a photo, play a native FB video. |
| Page Post | {"action.type":["post_engagement"], "post":["POST_ID"], "page":["PAGE_ID"]} | Number of times users perform any of the following actions in the context of the specified post: comment, follow question, like, share, answer question. Plus the number of times users perform any of the following actions: click a link, page like, view photo, play a video hosted on Facebook or an inline YouTube video play. For non-embedded videos use link_click. |

## Custom tracking specs {#custom}

To define your own tracking specs, use the action spec framework. See the [Action Specs, Reference](https://developers.facebook.com/docs/marketing-api/reference/conversion-action-query).

| Action (Object Types) | Description, Tracking spec details | Tracking or Conversion Spec |
| --- | --- | --- |
| app_custom_event (application) | Custom event on an application.  <br>Number of custom events on a mobile app. | {'action.type':  <br>'app_custom_event',  <br>'application':APP_ID} |
| app_install (application) | Installing an app.  <br>Number of installs  <br>on canvas or mobile app | [{'action.type':'app_install',  <br>'application':APP_ID},  <br>{'action.type':  <br>'mobile_app_install',  <br>'application':APP_ID}] |
| app_use (application) | Number of times app was used. | {'action.type':'app_use',  <br>'application':APP_ID} |
| checkin (place) | Check in a place.  <br>Number of check-ins into the place or into any child places of this page. | {'action.type':'checkin',  <br>'page': PAGE_ID},  <br>{'action.type':'checkin',  <br>'page.parent:PAGE_ID} |
| comment (post) | Commenting on a post.  <br>Number of comments on any or specific page post. | {'action.type':'comment',  <br>'post.wall':PAGE_ID},  <br>{'action.type':'comment',  <br>'post':POST_ID,  <br>'post.wall':PAGE_ID} |
| credit_spend (application) | Instances of spending credit in an app. | 'action.type':'credit_spent',  <br>'application':APP_ID} |
| follow (question) | Subscribing to an object.  <br>Number of answers or follows to a question. | {'action.type':'vote', 'question':QUESTION_ID, 'question.creator':PAGE_ID}, {'action.type':'follow', 'question':QUESTION_ID, 'question.creator':PAGE_ID} |
| leadgen_quality_conversion (pixel) | Down funnel lead conversion (CRM) events. | {'action.type':<br>'leadgen_quality_conversion',<br>'fb_pixel':<br>'FACEBOOK_PIXEL_ID'},<br>{'action.type':<br>'leadgen_quality_conversion',<br>'dataset':<br>'OFFLINE_EVENT_SET_ID'} |
| like  <br>(page, post) | Liking an object.  <br>Number of likes on a page or a post. | {'action.type':'like',  <br>'page':PAGE_ID}  <br>,<br>{'action.type':'like',  <br>'post.wall':PAGE_ID}  <br>,<br>{'action.type':'like',  <br>'post':POST_ID,  <br>'post.wall':PAGE_ID} |
| link_click (page,post, url, url domain) | Clicking on a link.  <br>Number of times an offsite url link, link with particular url domain, offsite link on a page, offsite link on a post was clicked. | {'action.type':['link_click'],  <br>'object':['PAGE_ID']},  <br>{'action.type':['link_click'],  <br>'object.domain':  <br>['URL_DOMAIN']},  <br>{'action.type':['link_click'],  <br>'post.wall':['PAGE_ID']},  <br>{'action.type':['link_click'],  <br>'post':['POST_ID'],  <br>'post.wall':['PAGE_ID']} |
| mention (page) | Mentioning of a Page.  <br>Number of mentions of a page. | {'action.type':'mention',  <br>'object':PAGE_ID'} |
| offsite_conversion (pixel) | Number of offsite conversions, and accumulated revenue. | {'action.type':  <br>'offsite_conversion',  <br>'fb_pixel':  <br>'FACEBOOK_PIXEL_ID'} |
| photo_view (page) | Viewing a photo.  <br>Number of photo views,  <br>video_plays, or link_clicks of the photos/videos/link-shares of any or specific post on a page. | {'action.type':'photo_view', 'post.wall':PAGE_ID}  <br>{'action.type':'photo_view', 'post':POST_ID,  <br>'post.wall':PAGE_ID} |
| post (post) | Sharing a story.  <br>Number of times users post on a page. | {'action.type':'post',  <br>'post.wall':PAGE_ID} |
| receive_offer (offer) | Claiming an Offer.  <br>Number of people who claimed a specific offer. | {'action.type':'receive_offer',  <br>'offer':OFFER_ID} |
| rsvp (event) | Rsvping into an Event.  <br>Number of RSVPs (yes and maybe) to an event. Valid values are `yes`, `maybe`, and `no`. | {'action.type':'rsvp',  <br>'event': EVENT_ID},  <br><br>{'action.type':'rsvp',  <br>'response':'yes',  <br>'event': EVENT_ID},  <br><br>{'action.type':'rsvp',  <br>'response':'no',  <br>'event': EVENT_ID},  <br>{'action.type':'rsvp',  <br>'response':'maybe',  <br>'event': EVENT_ID} |
| tab_view (page) | Viewing a page tab  <br>Number of views of a specific page tab. If you want all tab views just specify the page. | {'action.type':'tab_view',  <br>'page.tab.name':  <br>'PAGE_TAB_NAME', 'page':PAGE_ID},  <br>{'action.type':'tab_view',  <br>'page':PAGE_ID} |
| video_play (post) | Watching a video.  <br>Number of video watches for any or a specific video post on a page. | {'action.type':'video_play', 'post.wall':PAGE_ID},{'action.type':'video_play', 'post':POST_ID,  <br>'post.wall':PAGE_ID} |

## Examples {#examples}
### Pixel tracking {#tracking}

Track the performance of different pixels in an ad by specifying the tracking pixel in the ad's [`tracking_specs`](https://developers.facebook.com/documentation/ads-commerce/marketing-api/tracking-specs) field. For example:

```
tracking_specs="[
  {'action.type':'offsite_conversion','fb_pixel':1},
  {'action.type':'offsite_conversion','fb_pixel':2},
  {'action.type':'offsite_conversion','fb_pixel':3}
]"
```

This tracks the performance of pixels "1", "2", and "3". If you want to optimize for pixel "1" only, define the `promoted_object` of the parent ad set. This is useful when you want to optimize for `CHECKOUT`, but also want to track the number of `REGISTRATION` and `ADD_TO_CART`.

*Pixels optimized by specifying the pixel ID in the `promoted_object` are automatically tracked, so you do not need to specify the same pixel in `tracking_specs`.*

## Using conversion specs {#using-conversion-specs}
`conversion_specs` is a field for [ad](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/adgroup). It follows the format `{'action.type':'{ACTION}', ... }` where each action applies to an object. Here are examples of conversion specs for various ad types:

| Ad type | Conversion Spec |
| --- | --- |
| Domain ad with social context | {'action.type':'link_click',  'object':'PAGE_ID'} |
| Page like ad | {'action.type':'like', 'page':PAGE_ID} |
| Page post link ad | {'action.type':['link_click'], 'post': [POST_ID], 'post.wall':[PAGE_ID]} |
| All other page post ads | {'action.type':'post_engagement',  'post':'POST_ID', 'page':'PAGE_ID'} |
| Event ad | {'action.type':'rsvp' , 'response':'yes',  'event':'EVENT_ID'} |
| Offer ad | {'action.type':'receive_offer', 'offer':OFFER_ID, 'offer.creator':PAGE_ID} |
| Mobile app install ad | N/A - cannot create such an ad with NONE objective. |
| Mobile app engagement ads | N/A - only CPC and CPM bid types are supported |
| Canvas app install ad | N/A - cannot create such an ad with NONE objective |
| Canvas app engagement ad | N/A - cannot create such an ad with NONE objective |

Some conversion specs contain multiple actions that apply to a single object. These are called _meta specs_. Below are examples:

| Object | Conversion Spec | Description |
| --- | --- | --- |
| Page | {"action.type":["page_engagement"], "page":["PAGE_ID"]} | Times someone takes the following actions in a specific page: check-in, comment, follow, like, page post like, mention, post on page, share a post, answer a question. Includes the number of times someone performs these actions in a specific page: view a photo, play a native Facebook video. |
| Page Post | {"action.type":["post_engagement"], "post":["POST_ID"], "page":["PAGE_ID"]} | Number of times someone takes one of these actions in a specific post: comment, follow question, like, share, claim offer, answer question. Includes the number of times someone performs these actions: click a link, page like, view photo, play a video hosted on Facebook or an inline YouTube video play. For non-embedded videos use `link_click`. |
| Application | {"action.type":["app_engagement"], "application":["APPLICATION_ID"]} | Number of times someone generates `app_story` or engages with content as `app_use`, `app_install`, or `credit_spent`. |

