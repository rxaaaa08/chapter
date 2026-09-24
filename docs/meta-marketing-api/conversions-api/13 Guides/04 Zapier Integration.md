<!-- Source: https://developers.facebook.com/documentation/ads-commerce/conversions-api/guides/zapier-integration | Saved: 2026-09-19 -->

# Zapier Integration



You can leverage automation platform Zapier to send events to the Conversions API. Use Facebook's Zapier app to automatically send events every time something changes in your data source.

## Overview

Zapier is an online automation tool that you can use to connect two or more apps. In this case, we are connecting two apps. From the first app, you select a trigger event that makes an action event happen in the second app. The first app can be any data source you are using. The second app must be [Facebook Conversions](https://zapier.com/apps/facebook-conversions/integrations).

Once the connection is set up, every time your data source is triggered, our app sends an event to the Conversions API. For example, every time a new Purchase is added to your data source, this event is posted to our API.

## How To Use

#### Step 1:
Visit [zapier.com](https://zapier.com/). Then, sign up or log in with previously created credentials. On the left side menu, click on **Make a Zap**.

#### Step 2: Select Data Source And Trigger
Next, Zapier asks you to set up your trigger. Under **When this happens**, pick **App** and **Trigger Event**.

In this case, App is the data source. One example of this would be [Google Sheets](https://zapier.com/apps/google-sheets/integrations).

Trigger event refers to the action that must happen in your data source for the automation to be triggered. Back to the Google Sheet example, some of the possible Zapier trigger events are:

- New Spreadsheet Row: Triggered when a new row is added to the bottom of a spreadsheet.
- New or Updated Spreadsheet Row: Triggered when a new row is added or modified in a spreadsheet.

Select the Zapier trigger event that makes more sense for your advertising needs.

**Note:** You must configure your data source to match Facebook's events schema. For Google Sheets, set the spreadsheet fields to correspond to our event fields.

#### Step 3: Select Events To Be Posted
After you are done with **When this happens**, you can set up the second part of the automation under **Do this**. Again, you must select **App** and **Action Event**.

Here, **App** should be the [Facebook Conversions](https://zapier.com/apps/facebook-conversions/integrations). This is where you want to send the information coming from your data source.

Action events are the events that you want to send to our API. Some examples of action events are Purchase, Lead, and Other Events. [Here is a list of Meta Pixel standard events](https://developers.facebook.com/docs/facebook-pixel/reference#standard-events), and you can also send us custom events.

#### Step 4: Activate Zap

Now you can activate your Zap. Once that is done, an event should be posted to the Conversions API every time your trigger event happens.

To finalize the Google Sheets example, consider we have created a Zap that:

- Uses Google Sheet as a data source.
- Has "New Spreadsheet Row" as a trigger event.
- Has `Purchase` as an action event.

Once this Zap is activated, a Purchase event is posted to our API every time a new row is added to the source spreadsheet.

## Resources

- [Get Started With Zapier](https://zapier.com/learn/getting-started-guide/)
- [Zapier App Tips](https://zapier.com/blog/categories/app-tips/)

