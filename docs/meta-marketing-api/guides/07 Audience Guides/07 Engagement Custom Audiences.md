<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/engagement-custom-audiences | Saved: 2026-09-19 -->

# Engagement Custom Audiences



Create a custom audience based on people who engaged with your content on Facebook or Instagram. Currently supported audience types include Page, Instagram business profile, Lead ads, Instant Experience ads, Shopping, and augmented reality.

This guide describes the API by using Page engagement audiences as an example.
Facebook updates your custom audience for Page engagements by continuously adding people that engage with your Page. When you first create this audience, Facebook prefills the audience with a list of people who already engaged with your Page in the given retention period.

**Note:** - Since September 2018, `subtype` is not supported for custom audiences for websites, apps, engagement custom audiences, and audiences from offline conversion data. The exception is that `subtype` is supported for engagement custom audiences for video.

-  If you are creating audiences from Europe or targeting people in Europe, see our [December 2, 2020 non-versioned change](https://developers.facebook.com/docs/graph-api/changelog/non-versioned-changes/dec-2-2020).

## Create an audience {#create}

To create an engagement custom audience, your ad account must accept the [Terms of Service for Custom Audiences](https://www.facebook.com/ads/manage/customaudiences/tos.php), in [Ads Manager](https://business.facebook.com/adsmanager/manage).

To create an audience listing people who engaged with your Page based on the `page_engaged` event:

```
curl -X POST \
  -F 'name="My Test Engagement Custom Audience"' \
  -F 'rule={
       "inclusions": {
         "operator": "or",
         "rules": [
           {
             "event_sources": [
               {
                 "id": "<PAGE_ID>",
                 "type": "page"
               }
             ],
             "retention_seconds": 31536000,
             "filter": {
               "operator": "and",
               "filters": [
                 {
                   "field": "event",
                   "operator": "eq",
                   "value": "page_engaged"
                 }
               ]
             }
           }
         ]
       }
     }' \
  -F 'prefill=1' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

### Parameters

| Name | Description |
| --- | --- |
| `name`<br><br>string | **Required.**  <br>Custom audience name. |
| `rule`<br><br>JSON object | **Required.**  <br>Rules to define the audience. Follows the same syntax as [website custom audience](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences). |

Engagement custom audiences are types of custom audiences. For all available fields, see the [Custom Audience Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience).

**Note:** Each ad account can create a maximum of 500 engagement custom audiences.

## Engagement rules {#rules}

You can determine if Facebook adds someone to the custom audience or not with the [Audience Rules](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/audience-rules).

Specify the `type` and `id` fields inside `event_sources` in the rule to indicate the `type` and `id` of the engagement object. The `id` field takes a single object ID, or an array of IDs of the same type.

These are supported event sources and corresponding engagement object IDs:

* `page`: Facebook page ID.
* `lead`: Lead form ID.
* `ig_lead_generation`: Lead form ID.
* `canvas`: Canvas ID.
* `ig_business`: Instagram business profile ID.
* `shopping_page`: Facebook Shop Page ID.
* `shopping_ig`: Instagram Shop ID.
* `ar_experience`: An Instant Experience that uses an AR effect.
* `ar_effects`: A Facebook or Instagram effect you own. This doesn't include effects used in ads.

Each rule consists of an `object_id` and an `event_name`.

### Pages
Set `object_id` to your Page ID. Under `event_name`, use one of the following engagement events:

* `page_engaged`: People who visited your Page or engaged with any of your Page's content or ads, on Facebook or Messenger. This is the most inclusive engagement type and includes all other types of engagement.
* `page_visited`: People who have visited your Page.
* `page_liked`: People who currently like your Page. ([See details on retention and rules related to page likes](#page-likes-retention-and-rules).)
* `page_messaged`: People who sent a message to your Page.
* `page_cta_clicked`: People who have clicked any call-to-action buttons on your Page (for example, "Contact Us" or "Shop Now").
* `page_or_post_save`: People who have saved your Page or any of your Page posts.
* `page_post_interaction`: People who have interacted with any of your Page posts. Interactions include reactions (for example, Like, Love, Haha, Wow, Sad, Angry), shares, comments, link clicks, or carousel swipes.

### Lead ads
Set `object_id` to `FORM_ID` and set the `rule` to track one of the following lead ads events:

* `lead_generation_submitted`: All users who completed the form and submitted it.
* `lead_generation_dropoff`: All people who close the form without submitting it. They may or may not have filled in any of the fields.
* `lead_generation_opened`: All people who opened the lead generation form regardless of whether or not they submitted the form.

### Instant experiences
Set `object_id` to `"CANVAS_ID"`. The `rule` should track one of the following events:

* `instant_shopping_document_open`
* `instant_shopping_document_pause`
* `instant_shopping_document_resume`
* `instant_shopping_document_close`
* `instant_shopping_did_scroll`
* `instant_shopping_element_click`
* `instant_shopping_element_impression`

### Instagram business profile

The `object_id` should be the `"INSTAGRAM_BUSINESS_PROFILE_ID"`, and the `rule` should track one of the following Instagram business profile events:

* `ig_business_profile_all`: People who visited your Instagram business profile or engaged with any of your Instagram business profile's content or ads. This is the most inclusive engagement type and includes all other types of engagement. It's a union of `ig_business_profile_engaged`, `ig_user_messaged_business`, and `ig_user_messaged_business`.
* `ig_business_profile_engaged`: People who engaged with your Instagram business profile or engaged with any of your Instagram business profile's content or ads.
* `ig_user_messaged_business`: People who messaged your Instagram business profile.
* `ig_business_profile_visit`: People who visited your Instagram business profile.
* `ig_business_profile_ad_saved`: People who saved either organic content or an ad from your Instagram business profile.
* `ig_ad_like`
* `ig_ad_comment`
* `ig_ad_share`
* `ig_ad_save`
* `ig_ad_cta_click`
* `ig_ad_carousel_swipe`
* `ig_organic_like`
* `ig_organic_comment`
* `ig_organic_share`
* `ig_organic_save`
* `ig_organic_swipe`
* `ig_organic_carousel_swipe`

**Note:** Instagram Media Creator type is currently not supported for video engagement custom audience creation.

### Shopping

A shopping engagement rule should track one of the following events:

* `VIEW_CONTENT`: People who have viewed your product detail page. This option is available globally.
* `ADD_TO_CART`: People who have added your product to their shopping cart. This is available only to checkout-enabled businesses, and only to consumers in the United States.
* `PURCHASE`: People who have purchased your products. This is available only to checkout-enabled businesses, and only to consumers in the United States.

To create a rule that adds people who have viewed your product:

```
curl -i -X POST
-F 'name="test_api"'\
-F 'rule= {
  "inclusions": {
    "operator": "or",
    "rules": [
      {
        "event_sources": [
          {
            "id": "<ID>",
            "type": "shopping_ig"
          }
        ]
        "retention_seconds": <RETENTION_SECONDS>,
        "filter": {
          "operator": "and",
          "filters": [
            {
            "field":"event",
            "operator":"eq",
            "value": "VIEW_CONTENT"
            }
          ]
        }
      }
    ]
  }
}
-F 'access_token=<ACCESS_TOKEN>' \
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

**Note:** The `page_messaged` and `ig_user_messaged_business` parameters may not be available in Europe due to new privacy rules.

### Augmented reality

Augmented reality engagement custom audiences can contain two parts: AR experience and AR effect.

* For an AR experience engagement custom audience, set the `object_id` to the AR ads data container ID and for the `event_name` field use either `ar_camera_open` or `camera_cta_click`.
* For an AR effect engagement custom audience, set the `object_id` to the AR effect ID and use `ar_effect_open` for the `event_name` field.

### Max retention days

For legal and privacy requirements, different maximum retention days apply to each event source type:

* Lead Generation Ads: 90 days
* Instagram business profile: 730 days
* Page: 730 days
    * **Note**: [Page likes audience has no retention](#page-likes-retention-and-rules)
* Instant Experiences, formerly known as Canvas: 730 days
* Shopping: 365 days. The data is available since April 2020.
* Augmented reality: 365 days

### Engagement rules with exclusion section

Engagement audience rules are compatible with website custom audience rules. Therefore, engagement audience rules can have multiple inclusion and exclusion rules. Users that match at least one of the rules will be added to the audience.

In the following example, you create an audience that includes users that visited your page or engaged with your page, but excludes people who clicked the call-to-action:

```
curl -X POST \
  -F 'name="My Test Engagement Custom Audience"' \
  -F 'rule={
       "inclusions": {
         "operator": "or",
         "rules": [
           {
             "event_sources": [
               {
                 "id": "<PAGE_ID>",
                 "type": "page"
               }
             ],
             "retention_seconds": 31536000,
             "filter": {
               "operator": "and",
               "filters": [
                 {
                   "field": "event",
                   "operator": "eq",
                   "value": "page_engaged"
                 }
               ]
             }
           }
         ]
       },
       "exclusions": {
         "operator": "or",
         "rules": [
           {
             "event_sources": [
               {
                 "id": "<PAGE_ID>",
                 "type": "page"
               }
             ],
             "retention_seconds": 31536000,
             "filter": {
               "operator": "and",
               "filters": [
                 {
                   "field": "event",
                   "operator": "eq",
                   "value": "page_cta_clicked"
                 }
               ]
             }
           }
         ]
       }
     }' \
  -F 'prefill=1' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

For more information, see [Custom Audiences from Your Website](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/guides/website-custom-audiences).

### Multiple rules {#multiple_rules}

Engagement audiences can have multiple rules, and users that match **at least one** of the rules will be added to the audience. An example of creating an audience that includes users that messaged your page or clicked the call-to-action:

```
curl -X POST \
  -F 'name="My Test Engagement Custom Audience"' \
  -F 'rule={
       "inclusions": {
         "operator": "or",
         "rules": [
           {
             "event_sources": [
               {
                 "id": "<PAGE_ID>",
                 "type": "page"
               }
             ],
             "retention_seconds": 31536000,
             "filter": {
               "operator": "and",
               "filters": [
                 {
                   "field": "event",
                   "operator": "eq",
                   "value": "page_engaged"
                 },
                 {
                   "field": "event",
                   "operator": "eq",
                   "value": "page_engaged"
                 }
               ]
             }
           }
         ]
       }
     }' \
  -F 'prefill=1' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

### Multiple pages {#multiple_pages}

Rules are not limited to a single page. You can have a different page for each rule, and people who engaged with at least one of the pages are included in the audience.

The following is an example of an audience that includes all people that visited at least one of three pages:

```
curl -X POST \
  -F 'name="My Test Engagement Custom Audience"' \
  -F 'rule={
       "inclusions": {
         "operator": "or",
         "rules": [
           {
             "event_sources": [
               {
                 "id": "<PAGE_ID>",
                 "type": "page"
               },
               {
                 "id": "<PAGE_ID>",
                 "type": "page"
               }
             ],
             "retention_seconds": 31536000,
             "filter": {
               "operator": "and",
               "filters": [
                 {
                   "field": "event",
                   "operator": "eq",
                   "value": "page_engaged"
                 }
               ]
             }
           }
         ]
       }
     }' \
  -F 'prefill=1' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```

For details on Custom Audiences see the [Custom Audience Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/custom-audience).

### Page likes retention and rules

Page likes audience has no retention (`retention_seconds=0`). Also, Page likes rules can't be combined with other Page events.

The following is an example of creating a Page likes audience:

```
curl -X POST \
  -F 'name="Page Likes Audience Name"' \
  -F 'rule={
       "inclusions": {
         "operator": "or",
         "rules": [
           {
             "event_sources": [
               {
                 "id": "<PAGE_ID>",
                 "type": "page"
               }
             ],
             "retention_seconds": 0,
             "filter": {
               "operator": "and",
               "filters": [
                 {
                   "field": "event",
                   "operator": "eq",
                   "value": "page_liked"
                 }
               ]
             }
           }
         ]
       }
     }' \
  -F 'prefill=1' \
  -F 'access_token=<ACCESS_TOKEN>' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/customaudiences
```
