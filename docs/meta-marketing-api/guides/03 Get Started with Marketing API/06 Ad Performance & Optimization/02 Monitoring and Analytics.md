<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/ad-optimization-basics/monitoring-and-analytics | Saved: 2026-09-19 -->

# Monitoring and analytics



Monitoring campaign performance using the Insights API enables you to gather performance data about your advertising efforts, allowing you to evaluate what works and what does not. By leveraging the performance metrics provided by the Insights API, you can refine your campaigns, improve targeting, and ultimately understand which strategies are successful and how to best spend your resources across Meta technologies such as Facebook and Instagram.

## Querying analytics data

To extract performance metrics, you can make `GET` requests to the `/act_<AD_ACCOUNT_ID>/insights` endpoint. The request can include various parameters such as `fields`, `time_range`, and `filtering`, allowing for a tailored response that matches specific analytical needs. For instance, by specifying fields like `impressions`, `clicks`, and `spend`, you can gain insights into how well your campaigns are performing against goals.

**Example API Request:**

```curl
curl -X GET \
  https://graph.facebook.com/v25.0/act_<AD_ACCOUNT_ID>/insights \
  -F 'fields=impressions,clicks,spend' \
  -F 'time_range={"since":"2023-01-01","until":"2023-12-31"}' \
  -F 'access_token=<ACCESS_TOKEN>'
```

## Interpreting results

Key performance indicators (KPIs) such as click-through rates (CTR), cost per click (CPC), and return on ad spend (ROAS) provide insights into how effectively the campaigns are driving user engagement and conversions. For example, a low CTR indicates that the ad creative is not engaging the target audience, which signals the need for adjustments.

## Using insights for ongoing optimization

By continuously monitoring performance data, you can identify trends and make informed adjustments. For instance, if certain ads yield high engagement but lead to low conversions, you can experiment with different calls-to-action or refine targeting parameters.

Insights also can help guide budget allocation. If specific demographics show higher engagement rates, reallocating budgets to these segments can improve campaign results.

## Learn more

* [Insights Reference](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account/insights)
* [Insights API](https://developers.facebook.com/documentation/ads-commerce/marketing-api/insights)
