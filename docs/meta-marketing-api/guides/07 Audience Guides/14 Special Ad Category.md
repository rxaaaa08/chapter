<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category | Saved: 2026-09-19 -->

# Special Ad Categories



**Warning:** As part of our ongoing efforts to promote fairness on our advertising platform, Meta has introduced a new Special Ad Category "Financial products and services" for advertisers promoting financial products and services. Starting January 14, 2025, using this category is required for financial products and services campaigns for advertisers based in the United States or showing ads to audiences in the United States. Ads may be rejected if an appropriate category is not chosen. Learn more about the update [here](https://www.facebook.com/business/help/510724041294968).

For API developers

* In October 2024, Meta introduced a new input called `FINANCIAL_PRODUCTS_SERVICES` available for the Special Ad Categories field. This input will replace the `CREDIT` input as of January 14, 2025.
* Audience and product restrictions outlined in this developer document for `HOUSING` and `EMPLOYMENT` Special Ad Categories inputs will also apply to the new `FINANCIAL_PRODUCTS_SERVICES` input.
* Starting January 14, 2025, using the Special Ad Category designation is required for advertisers running financial products and services campaigns that are based in the United States or showing ads to audiences in the United States. Ads may be rejected if the advertiser does not choose an appropriate Special Ad Category.
* **Note:** Our policy for credit ads (a subset of financial products and services) does not change, and will continue to apply for advertisers based in the US or showing ads to audiences in the US, Canada, or certain parts of Europe.

All businesses using the Marketing API must identify whether or not new and edited campaigns belong to a Special Ad Category. Current available categories are: [**housing**, **employment**, **financial products and services**](#context), or [**issues, elections, and politics**](#issues-elections-politics).

### Limitations

* Businesses whose ads do not belong to a Special Ad Category must indicate `NONE` or send an empty array in the `special_ad_categories` field.
* When any `special_ad_categories` are selected, you must also set a `special_ad_category_country`.
* Businesses running **housing**, **employment**, or **financial products and services** ads must comply with [audience restrictions](#hec-restrictions). Audience options for ads about social issues, elections, or politics are not affected by the `special_ad_categories` label.

## Ad campaign offerings {#ad-campaign}

All advertisers are required to specify Special Ad Categories in their advertising campaign creations. The Special Ad Category field can contain one or more of the following:

* `HOUSING`
* `FINANCIAL_PRODUCTS_SERVICES`
* `EMPLOYMENT`
* `ISSUES_ELECTIONS_POLITICS`
* `NONE`

Even if the campaign does not contain ads that include housing, employment, financial product and services, or issues, elections, and politics, advertisers must still specify a category by choosing `NONE` or sending us an empty array.

If selecting housing, employment, or financial products and services, the set of targeting options available for ads in these campaigns will be restricted.

If selecting issues, elections, or politics, you will be asked to select the country in which you want to run these ads. You are required to be authorized to run ads about social issues, elections, or politics in the specified country.

**All campaign creations require the `special_ad_categories` field.** If your campaign does not need a Special Ad Category, you can pass in an empty array or use `NONE` as the value.

#### Example request

```
curl -X POST \
  -F 'name="My special category campaign"' \
  -F 'objective="LINK_CLICKS"' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'special_ad_categories="[\'EMPLOYMENT\']"'\
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

Learn more about [Special Ad Categories, Ads Help Center](https://www.facebook.com/business/help/298000447747885?helpref=faq_content).

To create a campaign with multiple categories:

```
curl -X POST \
-F 'name="My special category campaign"' \
-F 'objective="LINK_CLICKS"' \
-F 'status="PAUSED"' \
-F 'access_token=<ACCESS_TOKEN>' \
-F 'special_ad_categories="[\'EMPLOYMENT\', \'ISSUES_ELECTIONS_POLITICS\']" '\
-F 'special_ad_category_country="[\'US\']" '\
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

### Transition current campaigns

All current campaigns are assigned a default of `NONE` to `special_ad_category`. If you run ads in a Special Ad Category, you need to update as follows:

1. Re-create your campaign and specify `special_ad_category`. See [Create a new campaign](#create-campaign) for details.

2. Update your audience settings and change your `special_ad_category`:

* You must update your audience settings to comply with [Special Ad Category](#targeting) restrictions. You can do this manually, using our [usual targeting end points](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/basic-targeting). Or, you can specify `tune_for_category` at the ad set level. When you use `tune_for_category`, you are immediately compliant with the new restrictions:

```
curl -i -X POST \
  -F 'tune_for_category=EMPLOYMENT'
  https://graph.facebook.com/v25.0/<ADSET_ID>
```

* After the targeting is updated, request a change in your `special_ad_category` with a `POST` request to `/<AD_CAMPAIGN_ID>`. Include your category information:

```
curl -i -X POST \
  https://graph.facebook.com/v25.0/<AD_CAMPAIGN_ID>?special_ad_category=EMPLOYMENT
```

#### Tune for category

When you use `tune_for_category`, the result for your ad campaign and ad sets is as follows:

#### For audiences
| Supporting Features | Removed Features |
| --- | --- |
| * Custom Audience Inclusion<br>* Custom Audience Exclusion<br>* Custom Audience Expansion<br>* Advantage+ Audience<br>* Detailed Targeting Expansion | * Saved Audiences<br>* Lookalike Audiences |
| - Custom Age: Options are generally fixed to include ages 18 through 65+ for housing, employment, and financial product and services ads. However, advertisers running credit opportunity ads in Europe (using the financial products and services category) can select a different age range in order to meet their industry and local requirements for this Special Ad Category.<br>- Location Radius: Changes the location radius to required minimum, depending on targeting spec.<br>- Gender Selection: Changes to all genders. | - Detailed Targeting Selection:<br>Certain Interest inclusions, and Location Selection<br>- Location Exclusion<br>- Detailed Targeting Exclusion<br>- Interest Exclusion<br>- Certain Interest Inclusions<br>- Location Selection |

### Create a new campaign {#create-campaign}

To create an [Ad Campaign](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) with a `special_ad_category`, follow the [standard campaign creation flow](https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started#campaign) and add `special_ad_category`. Here is an example:

```
curl -X POST \
  -F 'name="My special category campaign"' \
  -F 'objective="LINK_CLICKS"' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'special_ad_category=EMPLOYMENT' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

To create a campaign with `NONE` as `special_ad_category`:

```
curl -X POST \
  -F 'name="My campaign"' \
  -F 'objective="LINK_CLICKS"' \
  -F 'status="PAUSED"' \
  -F 'access_token=<ACCESS_TOKEN>' \
  -F 'special_ad_category=NONE' \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

See the [Campaign reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-campaign-group) for more information.

## Social issues, elections, and politics {#issues-elections-politics}

**Note:** **Prohibiting Ads About Social Issues, Elections, or Politics from Running in the European Union Due to New Regulation**

In response to the European Union's Transparency and Targeting of Political Ads (TTPA) regulation, beginning on October 6, 2025, social issue, electoral, and political ads will no longer be allowed to run in the EU and associated territories. [Learn more about these updates.](https://about.fb.com/news/2025/07/ending-political-electoral-and-social-issue-advertising-in-the-eu/)

Advertisers running ads about social issues, elections, and politics need to specify `special_ad_categories` when creating an ad campaign. In addition, they also have to set the `authorization_category` flag at the ad creative level: use `POLITICAL` for political ads, and beginning January 9, 2024, use `POLITICAL_WITH_DIGITALLY_CREATED_MEDIA` for ads containing media that is digitally created or altered.

You can create entire campaigns with ads about issues, elections, and politics, instead of individual ads displaying this type of content. Inside a single ad campaign, you can no longer mix ads about issues, elections, and politics with ads not related to these topics. In addition, you can no longer mark individual ads as belonging to issues, elections, and politics.

To create an issue, elections, or politics campaign, pass `ISSUES_ELECTIONS_POLITICS` inside the `special_ad_categories` field. Advertisers are allowed to combine this category with others by passing multiple values into the field.

When any `special_ad_categories` are selected, you must also set a `special_ad_category_country`. This is the country in which you want to run ads about social issues, elections, or politics. The `special_ads_category_country`:

- should be an array of ISO Alpha 2 country codes.
- needs to be a country in which the user and Page are authorized.

To run issue, elections, or politics campaigns:

* Advertisers must be authorized in the country they want to run ads in.
* The ad account must be eligible to run issue, electoral, or political ads for this Page.

To create an issue, elections, or politics campaign:

```
curl -X POST \
-F 'name="My special category campaign"' \
-F 'objective="LINK_CLICKS"' \
-F 'status="PAUSED"' \
-F 'access_token=<ACCESS_TOKEN>' \
-F 'special_ad_categories="[\'ISSUES_ELECTIONS_POLITICS\']" '\
-F 'special_ad_category_country="[\'US\']" '\
https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/campaigns
```

## Housing, employment, and financial products and services {#hec-restrictions}

Advertisers running ads about housing, employment, and financial products and services need to specify `special_ad_categories` while creating an ad campaign. When `special_ad_categories` are selected, you should also set a `special_ad_category_country`. The `special_ad_category_country` for housing, employment, and financial products and services ads:

* Will default to your listed tax country, if it is not set.
* Does not need to be a country that the user and Page are authorized in.

**Warning:** **Businesses outside the U.S. and reaching audiences outside the U.S., Canada, and Europe**, where these restrictions currently apply, must also pass the Special Ad Category field, but can choose to opt-in or opt-out of audience restrictions. Regardless of whether the campaign offers housing, employment, or financial products and services opportunities, these businesses can either opt-out by indicating `NONE` in the Special Ad Category field or opt-in to Special Ad Category by designating your ad as offering housing, employment, or financial products and services opportunities.

Learn more about [compliance](https://developers.facebook.com/blog/post/2020/01/06/marketing-api-advertisers-must-comply-special-ad-category-march-31/) and [enforcement](#enforcement).

#### Special Ad Categories for housing, employment, and financial products and services ads in Europe

If you want to reach Europe and run ads related to housing, employment, and financial products and services opportunities, you will be required to declare the relevant Special Ad Categories. Ads that fall into Special Ad Categories have a smaller [set of available audience categories](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/special-ad-category#targeting).

### Ad set and ad level changes {#ad-set-changes}

Advertisers running housing, employment, and financial products and services ads, who are based in the US or running ads reaching the US, Canada, or Europe have the following limitations on the ad set and ad levels:

* [Advantage+ catalog ads](https://developers.facebook.com/docs/marketing-api/dynamic-product-ads/ads-management) using [Home Listing Catalogs](https://developers.facebook.com/documentation/ads-commerce/marketing-api/real-estate-ads) must adhere to [Special Ad Category restrictions](#targeting). When creating an ad campaign, these advertisers should specify `HOUSING` under `special_ad_category`.

### Audience changes {#targeting}

Advertisers offering housing, employment, and financial products and services opportunities, who are based in the United States or running ads reaching the United States, Canada, or Europe have a limited set of audience options to choose from. For example, audience options describing or appearing to relate to protected classes which may include demographics, behaviors, or interests, are unavailable.

These are the restrictions:

#### Age
Options are generally fixed to include ages 18 through 65+ for housing, employment, and financial products and services ads. However, advertisers running credit opportunity ads (using the financial products and services category) in Europe can select a different age range in order to meet their industry and local requirements for this Special Ad Category.

#### Gender
Specific gender cannot be chosen. You have two options:

1. **Recommended**: Do not specify `genders` parameters.
2. Set genders to default values: `genders` defaults to all genders.

#### Location

* Location exclusion is not supported.
* Location selection must include all areas equal or larger than 15 mile or 25 kilometer radius for the US and Canada, and 15 kilometer radius for Europe of any selected city, address, or dropped pin.
* The following location categories are not supported:
    * `subcity`
    * `neighborhood`
    * `metro_area`
    * `small_geo_area`
    * `subneighborhood`
    * `electoral_district`
    * `zips`

#### Detailed targeting

* The following Interest Targeting options are not permitted:
    * Behavior and Demographic targeting
    * Interest exclusion
    * Detailed targeting exclusion
* Supported targeting interests have to be part of a previously approved list. You will be able to search this list in the future with our [Targeting Search](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search).

#### Lookalike audiences
Lookalike audiences are unavailable for housing, employment, and financial products and services ads.

##### Eligibility {#eligibility}

You can check whether a customer list custom audience is eligible for use in a special ad category campaign with the `is_eligible_for_sac_campaigns` in combination with `special_ad_categories` and `special_ad_category_countries` parameters.

**Example Request**

```html
curl -X GET /
https://graph.facebook.com/v25.0/act_<CUSTOM_AUDIENCE_ID>?fields=id,is_eligible_for_sac_campaigns&ad_account_id=<AD_ACCOUNT_ID>&special_ad_categories=HOUSING,EMPLOYMENT&special_ad_category_countries=US,UK
```

**Example Response**

```html
{
  "id": "23850663569120499"
  "is_eligible_for_sac_campaigns": false,
  "__fb_trace_id__": "B6T80EdcZGN",
  "__www_request_id__": "AcjtQwFivFWy3cTMMlr-DJ3"
{
```

### Milestones {#enforcement}

Since **December 4, 2019**, businesses located in the US or reaching users in the US are required to identify **new and edited** ad campaigns that offer housing, employment, or credit opportunities, or their ads are not allowed to run. Since this date, businesses located in the US or reaching users in the US must specify a `special_ad_category` for **new and edited** campaigns and use the limited audience criteria available for such campaigns. This applies across all ad buying surfaces, including the Marketing API.

**February 11, 2020** is the milestone for **active ads** offering housing, employment, or credit opportunities.

Since **March 31, 2020**, **all new and edited ads** using the Marketing API, **including all businesses that do not offer housing, employment, or credit opportunities**, which must specify `NONE` under `special_ad_category`.

Starting **December 3, 2020**, advertisers reaching Canada and running ads related to credit, employment, or housing opportunities are required to declare the relevant Special Ad Categories.

Starting **December 7, 2021**, advertisers reaching Europe and running ads related to credit, employment, or housing opportunities are required to declare the relevant Special Ad Categories.

Starting **January 21, 2025**, using the Special Ad Category designation is required for advertisers running financial products and services campaigns that are based in the United States or showing ads to audiences in the United States. Ads may be rejected if the advertiser does not choose an appropriate Special Ad Category. Our policy for credit ads (a subset of financial products and services) does not change, and will continue to apply for advertisers based in the US or showing ads to audiences in the US, Canada, or certain parts of Europe.

## Troubleshooting {#troubleshoot-special-ad-category}

A [campaign, ad set, or ad can be set to `WITH_ISSUES`](https://developers.facebook.com/ads/blog/post/2018/11/27/with-issues-status-blog/), if it can't be delivered for any reason. When reading an object, you can dig into `WITH_ISSUES` to troubleshoot any problems with that object.

A call to an object with `"effective_status": "WITH_ISSUES"` returns a field called `issues_info`, with information related to the issues found. While working with Special Ad Category, you may see the following issues:

| `error_code` | `error_message` | `error_summary` |
| --- | --- | --- |
| `2859024` | Certification Required | A business admin must review and accept our non-discrimination policy before you can run ads. They can find it by going to Business Settings, then System Users. Help Center link: [https://www.facebook.com/business/help/338925176776440](https://www.facebook.com/business/help/338925176776440) |
| `2909035` | Custom Age Selection Is Not Available | Custom age selection is unavailable when running ads in this Special Ad Category. You must select the age range 18-65+ for your audience. |
| `2909035` | Saved Audiences Are Not Available | Using Saved Audiences is unavailable when running ads in this Special Ad Category. You must remove all selected Saved Audiences. |
| `2909035` | Lookalike Audiences Are Not Available | Using Lookalike Audiences is unavailable when running ads in this Special Ad Category. You must remove all selected Lookalike Audiences. |
| `2909035` | Location Radius Selection Is Not Available | The location radius you selected is unavailable when running ads in this Special Ad Category. You must include a radius of at least 15 miles (or 25 kilometers) from any selected city, address, or dropped pin. |
| `2909035` | Detailed Targeting Selection Not Available | Some of the detailed targeting options you selected aren't available when running ads in this Special Ad Category. You must remove them from your audience. |
| `2909035` | Location Exclusion Is Not Available | Excluding specific locations is unavailable when running ads in this Special Ad Category. You must remove all location exclusions. |
| `2909035` | Custom Gender Selection Is Not Available | Custom gender selection is unavailable when running ads in this Special Ad Category. Your audience must include all genders. |
| `2909035` | Location Selection Is Not Available | Some of your location selections are unavailable when running ads in this Special Ad Category. Update your locations to include at least a 15-mile (or 25-kilometer) radius from any selected city, address, or dropped pin. |
| `2909035` | Detailed Targeting Exclusion Is Not Available | Excluding behaviors, demographics, or interests is unavailable when running ads in this Special Ad Category. You must remove all detailed targeting exclusions. |
| `2909035` | Interest Selection Is Not Available | Some of the detailed targeting options you selected aren't available when running ads in this Special Ad Category. You must remove them from your audience. |
| `2909035` | Cannot Use Bid Multipliers | You cannot use bid multipliers under a Special Ad Category. |
| `2909035` | Excluding Certain Audiences Is Not Available | Excluding Lookalike Audiences is unavailable when running ads in this Special Ad Category. You must remove all Lookalike Audience exclusions. |

For help reading warnings and errors see our [developer blog post about the subject](https://developers.facebook.com/ads/blog/post/2018/11/27/with-issues-status-blog/).

## Enforcing {#enforcement}

In addition to requiring advertisers to self-identify their campaign category, Meta continues using human reviewers and machine-learning to identify these kinds of ads. If you send us an incorrect `special_ad_category`, there is a risk your ads will be paused until the campaign is adjusted.

If you select `HOUSING`, `EMPLOYMENT`, or `FINANCIAL_PRODUCTS_SERVICES` as `special_ad_category`, all audience restrictions will be enforced with a hard error.

## Context {#context}

Meta is committed to protecting people from discrimination, and Meta is continually improving its ability to detect and deter potential abuse. It's against [Meta's policies](https://www.facebook.com/policies/ads/prohibited_content/discriminatory_practices) to discriminate by wrongfully reaching or excluding specific groups of people.

As part of a [historic settlement agreement](https://www.facebook.com/business/news/helping-prevent-discrimination-in-ads-that-offer-housing-employment-or-credit-opportunities), Meta made changes to the way it manages housing, employment, and credit ads. Special Ad Categories were created to support that commitment.

## See also {#resources}

* [Choosing a Special Ad Category, Ads Help Center](https://www.facebook.com/business/help/298000447747885?helpref=faq_content)
* [About Audiences for Special Ad Categories, Ads Help Center](https://www.facebook.com/business/help/2220749868045706)
* News for Developers: [Troubleshoot Ad Delivery with WITH_ISSUES Status
](https://developers.facebook.com/ads/blog/post/2018/11/27/with-issues-status-blog/)
* [Targeting Documentation](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/basic-targeting)
* [Advanced Targeting and Placement](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/advanced-targeting)
* [Targeting Search](https://developers.facebook.com/documentation/ads-commerce/marketing-api/audiences/reference/targeting-search)
* [Facebook Advertising Policies](https://www.facebook.com/policies/ads)
* Newsroom: [A Second Update on Our Civil Rights Audit](https://newsroom.fb.com/news/2019/06/second-update-civil-rights-audit/)
