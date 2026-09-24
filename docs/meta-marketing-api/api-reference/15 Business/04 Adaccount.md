<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/adaccount | Saved: 2026-09-19 -->

# Business Adaccount



## Reading

You can't perform this operation on this endpoint.

## Creating

### /{business_id}/adaccount
You can make a POST request to *adaccount* edge from the following paths:

- [/{business_id}/adaccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/business/adaccount)

When posting to this edge, an [AdAccount](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account) will be created.

#### Parameters

| Parameter | Description |
| --- | --- |
| `ad_account_created_from_bm_flag`<br><br>*boolean* | ad_account_created_from_bm_flag<br> |
| `currency`<br><br>*ISO 4217 Currency Code* | The currency used for the account<br><br>**[required]**<br> |
| `end_advertiser`<br><br>** | The entity the ads will target. Must be a Facebook Page Alias, Facebook Page ID or an Facebook App ID. In absence of one, you can use `NONE` or `UNFOUND`. Note that once a value other than `NONE` or `UNFOUND` is set, it cannot be modified any more.<br><br>**[required]**<br> |
| `funding_id`<br><br>*numeric string or integer* | ID of the [payment method](https://developers.facebook.com/docs/marketing-api/businessmanager#invoice-funding). If the account does not have a payment method it will still be possible to create ads but these ads will get no delivery.<br> |
| `invoice`<br><br>*boolean* | If business manager has Business Manager Owned Normal Credit Line on file on the FB CRM, it will attach the ad account to that credit line.<br> |
| `invoice_group_id`<br><br>*numeric string* | The ID of the invoice group this adaccount should be enrolled in<br> |
| `invoicing_emails`<br><br>*array<string>* | Emails addressed where invoices will be sent.<br> |
| `io`<br><br>*boolean* | If corporate channel is direct sales.<br> |
| `media_agency`<br><br>*string* | The agency, this could be your own business. Must be a Facebook Page Alias, Facebook Page ID or an Facebook App ID. In absence of one, you can use `NONE` or `UNFOUND`<br><br>**[required]**<br> |
| `name`<br><br>*string* | The name of the ad account<br><br>**[required]**<br> |
| `partner`<br><br>*string* | The advertising partner for this account, if there is one. Must be a Facebook Page Alias, Facebook Page ID or an Facebook App ID. In absence of one, you can use `NONE` or `UNFOUND`.<br><br>**[required]**<br> |
| `po_number`<br><br>*string* | Purchase order number<br> |
| `timezone_id`<br><br>*unsigned int32* | ID for the timezone. See [here](https://developers.facebook.com/docs/marketing-api/reference/ad-account/timezone-ids).<br><br>**[required]**<br> |

#### Return Type

This endpoint supports [read-after-write](https://developers.facebook.com/docs/graph-api/overview#read-after-write) and will read the node represented by *id* in the return type.

```
Struct  {
id: token with structure: AdAccount ID,
account_id: numeric string,
business_id: numeric string,
end_advertiser_id: string,
media_agency_id: string,
partner_id: string,
seer_ad_account_restricted_by_soft_desc_challenge: bool,
soft_desc_challenge_credential_id: string,
soft_desc_challenge_localized_auth_amount: int32,
}
```

#### Error Codes

| Error Code | Description |
| --- | --- |
| 100 | Invalid parameter |
| 3979 | You have exceeded the number of allowed ad accounts for your Business Manager at this time. |
| 3980 | One or more of the ad accounts in your Business Manager are currently in bad standing or in review. All of your accounts must be in good standing in order to create new ad accounts. |
| 415 | Two factor authentication required. User have to enter a code from SMS or TOTP code generator to pass 2fac. This could happen when accessing a 2fac-protected asset like a page that is owned by a 2fac-protected business manager. |
| 3902 | There was a technical issue and your new ad account wasn't created. Please try again. |
| 457 | The session has an invalid origin |
| 190 | Invalid OAuth 2.0 Access Token |
| 23007 | This credit card can't be set as your account's primary payment method, because your account is set up to be billed after your ads have delivered. This setup can't be changed. Please try a different card or payment method. |

## Updating

You can't perform this operation on this endpoint.

## Deleting

You can't perform this operation on this endpoint.

