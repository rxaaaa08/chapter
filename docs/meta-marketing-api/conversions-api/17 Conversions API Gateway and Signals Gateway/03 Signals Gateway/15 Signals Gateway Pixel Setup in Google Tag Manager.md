<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/signals-gateway/pixel-setup-google-tag-manager | Saved: 2026-09-19 -->

# Signals Gateway Pixel Setup in Google Tag Manager



There are two types of native Meta Pixel installations:

1. Meta Pixel installed through [Custom HTML tags](#sgw-customhtml-version)
2. Meta Pixel installed through a [Meta-provided Google Tag Manager template](#sgw-template-version)

To find whether you have the Custom HTML version or Meta-provided version, follow the steps below. Note that these instructions reflect the state of Google Tag Manager at the time of this document's publication, and may not reflect all updates to that product.

* Log in to your Google Tag Manager account and open your Workspace. In the main menu, click **Tags**.
* Find the tag name on which the Meta Pixel is installed. If the "Tag Type" says "Custom HTML" and the HTML field has the Meta-provided Javascript for Meta Pixel, you have a setup where the Meta Pixel is installed through Custom HTML tags. Follow the [Signals Gateway Pixel Setup in Google Tag Manager setup with Custom HTML version](#sgw-customhtml-version).

* Find the tag name on which the Meta (Facebook) Pixel is installed. If the "Tag Type" says "Facebook Pixel", you have a setup where the Meta Pixel is installed through the Facebook-provided Google Tag Manager template. Follow the [Signals Gateway Pixel Setup in Google Tag Manager setup with Template version](#sgw-template-version).

## SignalsGateway Pixel Setup in Google Tag Manager (Custom HTML Version) {#sgw-customhtml-version}

Follow these steps when the Meta Pixel tag is installed through Custom HTML.

### 1. Open Signals Gateway Pixel Settings  

Log in to your Signals Gateway account and select your Signals Gateway Pixel from your list of Data sources.

Open the **Setup guide** tab. In this tab, you'll see instructions for installing the Signals Gateway Pixel on your website. Within those instructions, find the following values, which you'll use to connect to Google Tag Manager.  

* Your Pixel ID (for example, 1234567890)
* The Pixel host (for example, https://sgw.test.com/)
* The Pixel script URL (for example, https://sgw.test.com/sdk/123456789/events.js)

See the example code below and the explanation of the relevant values in the table that follows. You will find the following Javascript code snippet under "Option 2" -> "Alternate Method"

```html
Paste the pixel code into the bottom of the header section just above the </head> tag. Install the code on every page of your website.

<!-- Signals Gateway Pixel Code -->
  <script>
  !function(a,h,e,v,n,t,s)
    {if(a.cbq)return;n=a.cbq=function(){n.callMethod?

n.callMethod.apply(n,arguments):n.queue.push(arguments)};

if(!a._cbq)a._cbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=h.createElement(e);t.async=!0;
    t.src=v;s=h.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,
document,'script',
    'https://sgw.test.com/sdk/123456789/events.js');
    cbq('setHost', 'https://sgw.test.com/');
    cbq('init', 123456789);
    cbq('track', 'PageView');
  </script>
    <!-- End Signals Gateway Pixel Code →
```

| Variable name | Value (in this example) |
| --- | --- |
| Signals Gateway Pixel ID | 123456789 |
| Signals Gateway Pixel Host | https://sgw.test.com |
| Signals Gateway Pixel Script URL | https://sgw.test.com/sdk/123456789/events.js |

### 2. Add Signals Gateway Pixel Code

* Edit the current "Custom HTML" tags where you have Meta Pixel added. Add the Signals Gateway Pixel code from Step 1 below the existing Meta Pixel Code.

* Modify all track commands.
    * For "track", "trackCustom" commands, make sure the 4th argument is "eventID" and it is passed.
    * For "trackSingle", "trackSingleCustom" commands, make sure the fifth argument is "eventID" and it is passed.
    * Make sure you have the same track commands for both Meta Pixel (fbq) and Signals Gateway Pixel (cbq).

Another example from a different tag:

### 3. Test and Publish

Use preview mode in Google Tag Manager to verify that the Pixel loads correctly on your site.

Once confirmed, publish your container to start sending data using the Signals Gateway Pixel.

## Signals Gateway Pixel Setup in Google Tag Manager (Template Version) {#sgw-template-version}

Follow these steps when the Meta Pixel tag is installed through a Meta-provided Google Tag Manager template.

### 1. Open Signals Gateway Pixel Settings

Log in to your Signals Gateway account and select your Signals Gateway Pixel from your list of Data sources.

Select your Signals Gateway Pixel and open the **Setup guide** tab. In this tab, you'll see instructions for installing the Signals Gateway Pixel on your website. Within those instructions, find the following values, which you'll use to connect to Google Tag Manager.  

* Your Pixel ID (for example, 1234567890)
* The Pixel host (for example, https://sgw.test.com/)
* The Pixel script URL (for example, https://sgw.test.com/sdk/123456789/events.js)

See the example code below and the explanation of the relevant values in the table that follows.

```html
Paste the pixel code into the bottom of the header section just above the </head> tag. Install the code on every page of your website.

<!-- Signals Gateway Pixel Code -->
  <script>
  !function(a,h,e,v,n,t,s)
    {if(a.cbq)return;n=a.cbq=function(){n.callMethod?

n.callMethod.apply(n,arguments):n.queue.push(arguments)};

if(!a._cbq)a._cbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=h.createElement(e);t.async=!0;
    t.src=v;s=h.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,
document,'script',
    'https://sgw.test.com/sdk/123456789/events.js');
    cbq('setHost', 'https://sgw.test.com/');
    cbq('init', 123456789);
    cbq('track', 'PageView');
  </script>
    <!-- End Signals Gateway Pixel Code →
```

| Variable name | Value (in this example) |
| --- | --- |
| Signals Gateway Pixel ID | 123456789 |
| Signals Gateway Pixel Host | https://sgw.test.com |
| Signals Gateway Pixel Script URL | https://sgw.test.com/sdk/123456789/events.js |

### 2. Import Signals Gateway Pixel Template from Gallery

* Log in to your Google Tag Manager account and open your Workspace. In the main menu, click **Templates**.
* Click **Search Gallery** in the "Tag Templates" section.

* Search for "SignalsGateway".

* Click on "SignalsGateway Pixel by facebookincubator" and "Add to Workspace".

* Click "Add" to add the template to the Google Tag Manager container workspace.

* Click on the added "SignalsGateway Pixel" Template. 

* This will open the "Template Editor".
* **Skip Step 3** below and **follow step 4**.

### 3. [Skip If Step 2 Is Completed] Manually Import the 'SignalsGateway Pixel' Template Into Your Google Tag Manager

* Download the Google Tag Manager template using this link: [Signals Gateway Google Tag Manager Template](https://l.facebook.com/l.php?u=https%3A%2F%2Fgithub.com%2Ffacebookincubator%2Fsignals_gateway_pixel_google_tag_manager_template%2Fblob%2Fmain%2Ftemplate.tpl%3Ffbclid%3DIwZXh0bgNhZW0CMTEAYnJpZBExT1N3bmJmSHJPWGE2RkJXdQEe_JIEAJR9j6irTEyW0GxiCt47iJuAx1fXV6OmyAbCLwnOWWXoFBoGGw8w2cM_aem_HKZsxXnp1EIM0faH5YB5cA&h=AT0Tjt5xXRxoXN6phJptOW2sxQX7-dPtzhxQflIFEYWzbcn2f5qkJeEGQgPbiVKoIYyAHVrFDbGuSfb-p9pO24q-gYTejeVA394iJBT1gdZiQfKqLCBLd36LxwixrrXE7yHPnGKs).
* Log in to your Google Tag Manager account and open your Workspace. In the main menu, click **Templates**.
* Click **New** in the Tag Templates section. 

* In the Template Editor pop-up, open the three-dot menu in the top-right corner.

* Select Import and choose the .tpl file shared by the Meta team. You should now see the new template loaded in the Template Editor.

### Update Template Permissions

* In the Template Editor, select the Permissions tab. Under Injects scripts, update Allowed URL match patterns so it matches your Signals Gateway Pixel script URL.

Example

```html
https://sgw.test.com/sdk/123456789/events.js
```

* Click Save in the top-right corner to finalize your changes. You should see the newly created template in your Tag Templates list.

### 5. Create {Event ID} Variable

If you don't have an "Event ID" variable in your workspace, you can create one following the steps below.

* Name the new variable

* Choose the variable type, for example, Random Number.

* Save the new variable.

### 6. Create a New Tag Using the Imported Template

* You may have one or more tags with type "Facebook Pixel" And each of them will have different "Firing Triggers" and "Event Name". Note down all such tags with name, event name, triggers.

* For each of these tags, create new tags (one tag for each) for SignalsGateway Pixel Template and use the same "Event Name" and "Firing Triggers".

* In Google Tag Manager, click **Tags** in the main menu, then select **New**. In Tag Configuration, select the new SignalsGateway Pixel template you just imported.

* Configure the required settings:

1. Signals Gateway Pixel ID
2. Signals Gateway Pixel Host
3. Signals Gateway Pixel Script URL

* Click **More Settings → Event ID** section and choose the "Event ID" you created above.

### 7. Add Event ID for Data Deduplication in Meta Pixel Template

To help ensure the accuracy of your event deduplication settings, open your already existing Meta Pixel tags, and add `{{Event ID}}` as well. For each of the tags we saw in step 6-a, Add event ID.

* Open Meta Pixel tags (Each of them)
* Click **More Settings → Event ID** section
* Add `{{Event ID}}` as variable value

### 8. Test and Publish

Use **Preview Mode** in Google Tag Manager to verify that the Pixel loads correctly on your site.

Once confirmed, publish your container to start sending data using the Signals Gateway Pixel.

