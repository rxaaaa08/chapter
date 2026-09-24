<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/conversion-leads-integration/crm-integration/6-follow-up-steps | Saved: 2026-09-19 -->

# "6: Follow-up Steps"



This guide covers:

* [Allowing the system time to analyze and train on the data](#funnel-analysis-and-learning-period)
* [Sharing the Meta Pixel with your ad accounts](#share-the-pixel-with-your-ad-accounts)

## Funnel analysis and learning period

**Congratulations!** You have completed the main steps of the Conversions API for CRM integration and the next steps will be handled by the system. There is no more work on your end unless the system finds an issue with the data. Do not change pixels after this step. Changing pixels will start a new integration and restart the training process.

### Funnel analysis
After the funnel configuration is complete, the system will analyze your data again to determine if it matches with your indicated funnel. The length of this process will depend on the length of your lead conversion window. If it normally takes 14 days for a lead to convert, then you need at least that many days of good data uploaded. Remember, your conversion event must occur within 28 days of lead generation and have a conversion rate between 1-40%.

Check the diagnostics tab in Events Manager to find errors and instructions on how to fix them. Confirming that your data is fitting the requirements you just reviewed is a good place to start.

### Learning phase
Once your integration is complete and passed the funnel analysis, there is a 2-4 week learning phase before the model finishes training with your data. You may enable the Conversion Leads optimization in the Optimization and Delivery menu of [Ads Manager](https://www.facebook.com/adsmanager/manage/campaigns) during this period, but you may not see the full performance gains until after the training period. If you observe subpar performance with the Conversion Leads, it is recommended that you wait for the Learning phase to finish before enabling the optimization.

Upon successful completion of the integration, a confirmation modal will appear to notify you that the process is complete.

## Share the pixel with your ad accounts

- Ensure that your ad accounts will have access to the Pixel when running a Conversion Leads campaign.
Under the **Settings** tab in [Events Manager](https://www.facebook.com/events_manager2), click on the **Share With an Ad Account** button. This will bring you to your Business Settings. This can also be accessed directly in [Meta Business Suite](https://business.facebook.com).

- Select Add Assets under the Connected Assets tab for your Pixel to add any ad accounts you want to have access to the Pixel.

