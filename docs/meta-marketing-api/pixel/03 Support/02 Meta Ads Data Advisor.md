<!-- Source: https://developers.facebook.com/documentation/meta-pixel/support/meta-ads-data-advisor | Saved: 2026-09-19 -->

# Meta Ads Data Advisor


## Overview {#overview}

Meta Ads Data Advisor (formerly Meta Pixel Helper) is a free Google Chrome extension that helps you automatically connect your website and other data to Meta, monitor your setup for issues, and fix them with your approval. This can help improve your ad delivery performance and optimize your budget.

When the extension is installed, the Data Advisor icon appears in the upper-right corner of the browser next to the address bar.

When a website has a Meta Pixel installed, a small badge appears containing a dot or a number indicating the number of Pixel events fired on the current webpage. If the icon does not have a badge on it, no Meta Pixels are installed on the webpage. Click the Data Advisor icon to open a side panel. The side panel shows information you can use to verify, troubleshoot, and improve the Pixel, as well as start automated setup flows.

### What's changed from Pixel Helper

If you previously used Meta Pixel Helper, the extension automatically updates to Meta Ads Data Advisor. All existing diagnostic features continue to work. In addition, Data Advisor can now:

* **Set up data connections automatically:** Configure Meta Pixel, Conversions API, customer relationship management (CRM) integrations, and product catalogs from your browser without writing code.
* **Detect and fix issues proactively:** Monitor your setup over time and alert you when issues are detected.
* **Run end-to-end automation flows:** Handle multi-step setup processes from start to finish, pausing only for your consent or required input.
* **Provide full audit trails:** Every automated action produces a summary report with screenshots of what was done.

### Capabilities

**Setup and connection:**

* Set up Meta Pixel and Conversions API together through Google Tag Manager, including standard event configuration.
* Connect a Shopify store or WooCommerce website to Meta (Pixel, Conversions API, catalog, and data sharing).
* Integrate Salesforce CRM data with Meta for improved targeting and measurement.
* Connect product catalogs for Advantage+ catalog ads.
* Configure [Advanced Matching](https://developers.facebook.com/documentation/meta-pixel/advanced/advanced-matching) for improved conversion matching.

**Diagnostics and troubleshooting:**

* Verify Pixel and Conversions API installation and event firing.
* Flag errors such as broken events and missing parameters (for example, `content_ids`, `value`, and `currency`).
* Recommend and apply fixes from your browser with your approval.
* Monitor your setup and notify you when issues are detected.
* Add missing products to your catalog from your Shopify store.

**Reporting:**

* Summary of every action the extension has taken.
* Event-level detail, including content IDs, content types, Pixel URL location, and Advanced Matching data.
* Catalog-level detail, including match rate, products on the page, and available actions related to that catalog.

## Install Data Advisor {#install}

### Requirements

To use Data Advisor you must:

* Use the [Google Chrome](https://www.google.com/chrome/) web browser.
* Install the [Meta Ads Data Advisor extension from the Chrome Web Store](https://chromewebstore.google.com/detail/fdgfkebogiimcoedlicjlajpkdmockpc).

You can use the extension without logging in — basic Pixel detection and troubleshooting work while you are logged out. To use the setup and automation features, you additionally need:

* A Facebook profile.
* Admin access to your Meta ad account.
* Access to the third-party platform you want to connect (for example, a Google Tag Manager admin account and web container, Shopify admin access, or Salesforce admin account access).
* Your ad blocker disabled, so the extension can detect Pixels and events on your website.

Data Advisor checks what's needed before each job starts and lets you know if anything is missing.

### Installation steps

1. Go to the [Chrome Web Store](https://chromewebstore.google.com/).
2. Search for **Meta Ads Data Advisor**.
3. Click **Add to Chrome**.
4. Review the permissions:
   * **Access the page debugger backend:** Allows AI to view the current page content and navigate websites reliably.
   * **Read and change all your data on all websites:** Allows Meta to operate on third-party sites on your behalf.
   * **View and manage your tab groups:** Allows Meta to organize tabs created during automation for audit review.
5. Click **Add extension** in the popup.
6. [Optional] Log in with your Facebook profile to unlock personalized recommendations and automated setup flows.
7. Confirm installation by clicking the **Meta Ads Data Advisor** icon in your browser toolbar.
8. [Optional] Pin the extension to view the number of events you are sending as you browse.

### Reactivate from a previous Pixel Helper install

If you have a previous version of the extension (named "Meta Pixel Helper") that has been deactivated:

1. In Chrome, go to `chrome://extensions/`.
2. Find the deactivated extension (now listed as **Meta Ads Data Advisor**).
3. Toggle the switch to reactivate it.
4. Review and accept the updated permissions.
5. Click **Add extension**.

**Note:** If you have pages open where you intend to use Data Advisor, reload them for the extension to take effect.

### Uninstall

1. In Chrome, go to `chrome://extensions/`.
2. Find **Meta Ads Data Advisor** and click **Remove**.
3. Click **Remove** again in the popup to confirm.
4. [Optional] Provide feedback to help improve the product.

## Verify Pixel implementation {#verify}

Navigate to your website in the Chrome browser and click the Data Advisor icon. The side panel shows what Pixels were found on the webpage and whether they have loaded successfully.

### Test Pixel events

To verify your Pixel events:

1. Navigate to the webpage where the Pixel is installed.
2. Deactivate your ad blocker for the website you are on.
3. Click the **Data Advisor** icon in your browser toolbar.
4. Perform the action you want to track. For example, add an item to your cart to test the `AddToCart` event.
5. Confirm the Pixel is found on the webpage, with events shown after you select the Pixel.
6. Confirm that the expected event appears and shows as successful.
7. If any errors or warnings are displayed, implement the suggested fixes.

**Tip:** Click **Show all events** to see a log of events tracked across your active browser session, not just the current page. This is useful for debugging multi-page funnels.

Data Advisor also shows detailed event information sent to Meta, including:

* Content IDs and content types.
* Pixel URL location.
* Advanced Matching data.
* Event parameters (`value`, `currency`, `content_name`, and others).

### Pixel and event statuses

**Pixel statuses:**

* **Active:** Your Pixel is working correctly.
* **Warning:** Your Pixel isn't set up correctly.
* **Inactive:** Your Pixel isn't sending events correctly.

**Event statuses:**

* **Active:** Your event is being sent correctly.
* **Inactive:** Your event is not currently sending data.
* **Warning:** There are one or more issues with your event signal that may affect performance.
* **Error:** Your event has a critical configuration issue that requires action, such as blocked parameters, duplicate events, or a compliance violation.
* **Auto-detected:** This event was automatically detected based on your website activity, without additional code.

**Note:** A Pixel's status may be active even if individual events have warnings, and a Pixel may show a warning status even if events are being sent. Click into the Pixel to see per-event detail.

## Start an automation {#automation}

There are several ways to start an automated setup or fix with Data Advisor:

* **From Meta business tools:** When you start a Pixel, Conversions API, or catalog setup flow in Events Manager, Ads Manager, or Commerce Manager, Data Advisor may offer to help. A prompt appears asking for your approval. If you accept, the extension opens and guides you through the process automatically. You can also ask the [Meta AI business assistant](https://www.facebook.com/business/help/1912742139282375) about setting up your data connections, and it can direct you to Data Advisor to complete the setup.
* **From a supported website:** When you visit a supported platform (like Google Tag Manager or Shopify) with the extension installed, Data Advisor may notify you that actions are available. Click the extension icon or the on-page notification to begin.
* **From the extension side panel:** Click the Data Advisor icon in your browser toolbar to view recommendations and available actions for the current page.

Once an automation starts, the extension handles setup steps from start to finish, pausing only for consent or required input. You can pause or review at any step. When the automation completes, you receive a summary report of what was done.

### Supported platforms at launch

| Platform | Capabilities |
|---|---|
| Google Tag Manager | Pixel and Conversions API setup, standard event configuration |
| Shopify | Pixel, Conversions API, and product catalog connection |
| Salesforce | CRM data integration through Conversions API |
| WooCommerce | Pixel, Conversions API, and product catalog connection |

**Note:** Additional platforms and integrations will be added over time.

## Troubleshooting {#troubleshooting}

Data Advisor reports errors and suggestions to improve performance. These are visible either on the main page listing the Pixels or when you click into a specific Pixel or event.

### Common Pixel setup errors

* **Duplicate Pixel code:** Ensure the Pixel code isn't duplicated on a single page.
* **Strategic Pixel placement:** Only place Pixel code on pages where tracking is necessary.
* **iframe and tag manager considerations:** If you use an iframe or tag manager, confirm that browser settings or privacy tools aren't blocking the Pixel.
* **Correct base code placement:** Place the Pixel base code within the `<head>` section of your website. Incorrect placement can lead to missed tracking.
* **One conversion event per page (typically):** Use only one conversion event per page, unless additional events are triggered by specific user actions like button clicks.

### Quick setup checklist

* The Pixel code is present in the `<head>` section of every page you intend to track.
* There is no duplicate Pixel code on any page.
* Standard events are configured to load after the base Pixel code.
* Events are visible within the test events tool in Events Manager.
* Any ad blockers in Chrome are disabled for the site under test.
* You have [full access](https://www.facebook.com/business/help/299504287548592) to the Pixel for event setup.

### When to use Events Manager instead

* **Custom conversions** and some advanced event types may not appear in Data Advisor but can still be sent. Check your ad reports or [Events Manager](https://www.facebook.com/events_manager2) to confirm.
* **Button-click events** may not be detected depending on your website setup; these events may still track correctly in your ad reports.
* **User-triggered events** (like button clicks) may not be reliably detected unless they reload the page or trigger a direct Pixel call.
* For comprehensive tracking details and in-depth troubleshooting, use the [test events tool](https://www.facebook.com/events_manager2) in Events Manager.

### Automatic events

Starting August 3, 2026, when you set up a new Pixel through Data Advisor, the option to automatically detect and add standard events is pre-selected during the setup flow. You can deselect this option before completing setup if you prefer to review and confirm events manually. If you proceed with it enabled, Meta identifies and suggests standard events from your website based on activity. You can review detected events, manage individual events, or turn this feature off at any time in Events Manager under **Settings** > **Track events automatically without code**.

If you are setting up a new Pixel with Data Advisor, the extension may suggest standard conversion events (such as `Purchase`, `Lead`, or `AddToCart`) that appear to be missing. By default, these suggestions are applied automatically, but you can turn them off during setup or in Events Manager at any time.

## Related resources {#resources}

* [About the Meta Pixel](https://developers.facebook.com/documentation/meta-pixel)
* [Meta Pixel reference](https://developers.facebook.com/documentation/meta-pixel/reference)
* [Advanced Matching](https://developers.facebook.com/documentation/meta-pixel/advanced/advanced-matching)
* [Events Manager](https://www.facebook.com/events_manager2)
* [Meta Ads Data Advisor on the Chrome Web Store](https://chromewebstore.google.com/detail/fdgfkebogiimcoedlicjlajpkdmockpc)

## Glossary {#glossary}

| Term | Definition |
|---|---|
| **Meta Pixel** | Code that tracks user actions on your website for Meta advertising. |
| **Conversions API** | A server-side integration that sends web events directly from your server to Meta, complementing the Meta Pixel. |
| **Conversion event** | A specific action tracked on your site, such as a purchase or sign-up. |
| **Advanced Matching** | A feature that sends hashed customer information (for example, email) alongside Pixel events to improve attribution. |
| **Standard events** | Predefined event types (for example, `Purchase`, `AddToCart`, and `Lead`) that Meta recognizes for optimization. |
| **Test events tool** | A Meta tool in Events Manager for testing Pixel events, especially button clicks and custom conversions. |
