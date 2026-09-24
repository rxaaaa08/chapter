<!-- Source: https://developers.facebook.com/documentation/ads-commerce/gateway-products/host-management/account-management/manage-allow-block-lists | Saved: 2026-09-19 -->

# "Conversions API Gateway and Signals Gateway: Manage Domain Allow-Lists and Block-Lists for an Account"



Gateway products, Conversions API Gateway and Signals Gateway, automatically identify the websites (domains) on which connected pixels fire, and provide a mechanism to block the pixel from sending the events to the Gateway when fired on selected websites.

Select **Websites** on the menu under Gateway Products to access this feature. The Permitted websites section lists all websites (domains) that have sent events to the Gateway, that is, websites that the Pixels connected have fired on. 

Click on **See all** to view the full list of website. 

To prevent the Gateway from receiving events from a specific website,  click the **Block** button next to the website URL. The website will be transferred to the Blocked websites list, as shown below: 

To add a custom domain to the Blocked websites list, click on the **Add** button and enter the domain to be blocked. 

Click on **Block**; the entered domain will appear in the Blocked websites list. When you set a domain to "blocked", events received by your Gateway Product instance from that domain won't be sent from your instance to the associated data destination.

## See Also

* [Gateway Products Overview](https://developers.facebook.com/documentation/ads-commerce/gateway-products)
