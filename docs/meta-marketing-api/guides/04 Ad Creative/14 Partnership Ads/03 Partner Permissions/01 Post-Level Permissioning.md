<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/ad-creative/partnership-ads/post-level-permissioning | Saved: 2026-09-19 -->

# Post-level permissioning



Post-level permissioning allows you to add, remove, and check creators on your list of those approved to tag your brand in the paid partnership label on branded content posts. It also lets creators give you permission to promote their organic branded content posts as partnership ads.

The general flow for enabling post-level permissions is:

1. [See which creators are approved to tag your brand in the paid partnership label on branded content posts.](#verify-if-creators-are-approved)
2. [Add creator user IDs to the approved tagging list.](#update-the-creator-approval-list)
3. [Remove creator user IDs from the approved tagging list.](#delete-creators-from-the-approval-list)
4. [Creators can check who they have given permission to promote a given organic post as a partnership ad.](#check-brand-partnership-status)
5. [Creators can give you permission to promote the given organic post as a partnership ad.](#allow-brand-partnerships)

## Permissions

In order to use post-level permissioning, you must have a Facebook User access token with the following:

* `instagram_basic`
* `instagram_branded_content_brand` (for the `/branded_content_tag_approval` endpoint)
* `instagram_branded_content_creator` (for the `/branded_content_partner_promote` endpoint)
* [Advanced Access](https://developers.facebook.com/docs/graph-api/overview/access-levels#advanced-access)

## Approved creators

You have the option to restrict who can tag your brand in the paid partnership label on branded content posts. When restrictions are turned on, you can allow users to tag your brand in branded content posts by adding them to your approved creator list.

The `/{user-id}/branded_content_tag_approval` endpoint allows you to add, remove, and view the creators on your approved accounts list, if approval is required.

### Verify if creators are approved

Use a `GET` call to the `/{user-id}/branded_content_tag_approval` endpoint to verify if creators are on the approval list.

#### Example request

```bash
curl -G \
  -d 'user_ids=<USER_ID1, USER_ID2, ...>' // list of creator user IDs
  -d 'access_token=<BUSINESS_ACCESS_TOKEN>'
'https://graph.facebook.com/v25.0/<USER_ID>/branded_content_tag_approval'
```

#### Parameters
| Name | Description |
| --- | --- |
| `user_ids` | **Required.**<br>A comma-separated list of user IDs to check against the approval list. A maximum of 100 user IDs can be queried per request. |

#### Example response
If successful, the API returns a list of approved creators, filtered by the user IDs provided.

```json
{
 "data": [
  {
    "id": "<USER_ID>"
  }
 ]
}
```

### Update the creator approval list

Use a `POST` call to the `/{user-id}/branded_content_tag_approval` endpoint to add creators to the approval list.

#### Example request

```bash
curl -X POST \
  -d 'user_ids=<USER_ID5, USER_ID10, USER_ID15, ...>' // list of creator user IDs
  -d 'access_token=<BUSINESS_ACCESS_TOKEN>'
'https://graph.facebook.com/v25.0/<USER_ID>/branded_content_tag_approval'
```

#### Parameters

| Name | Description |
| --- | --- |
| `user_ids` | **Required.**<br>A comma-separated list of user IDs to add to the approval list. |

#### Example response

```json
{
  "success": true
}
```

**Note:** The API returns `false` if one or more user IDs fail to update; in that case it adds no user IDs to the approval list.

### Delete creators from the approval list

Use a `DELETE` call to the `/{user-id}/branded_content_tag_approval` endpoint to remove user IDs from the approval list.

#### Example request

```bash
curl -X DELETE\
  -d 'user_ids=<USER_ID3, USER_ID5, ...>' // list of creator user IDs
  -d 'access_token=<BUSINESS_ACCESS_TOKEN>'
'https://graph.facebook.com/v25.0/<USER_ID>/branded_content_tag_approval'
```

#### Parameters

| Name | Description |
| --- | --- |
| `user_ids` | **Required.**<br>A comma-separated list of user IDs to remove from the approval list. |

#### Example response

```json
{
  "success": true
}
```

**Note:** The API returns `false` if one or more user IDs fail to delete; in that case it removes no user IDs from the approval list.

## Allow branded content post to be boosted

A creator must give permission to a brand to use individual posts as partnership ads.

### Check brand partnership status

The `/{ig-media-id}/branded_content_partner_promote` endpoint call allows a creator to get the list of brands that are approved to promote a given branded content post.

#### Example request

```bash
curl -G \
  -d  'access_token=<CREATOR_ACCESS_TOKEN>'
'https://graph.facebook.com/v25.0/<IG_MEDIA_ID>/branded_content_partner_promote'
```

#### Example response

```json
{
  "approved": <BUSINESS_ACCOUNT_ID1, BUSINESS_ACCOUNT_ID2, ...> // list of business account IDs
}
```

If successful, the API returns a comma-separated list of approved business account IDs.

### Allow brand partnerships

The `{ig-media-id}/branded_content_partner_promote` endpoint allows a creator to activate the **Allow brand partner to boost** setting without the Instagram app.

**Note:** Creators can tag the brand partner at publish time via the [Content Publishing API](https://developers.facebook.com/docs/instagram-api/guides/content-publishing#partnership-ads-label) or through the native Instagram app.

#### Example request

```bash
curl -X POST \
  -d  'sponsor_id=<BUSINESS_ACCOUNT_ID>' // Business account ID for which the creator is granting, or revoking, promotion permissions
  -d  'permission=true | false'
  -d  'access_token=<CREATOR_ACCESS_TOKEN>'
'https://graph.facebook.com/v25.0/<IG_MEDIA_ID>/branded_content_partner_promote'
```

#### Parameters

| Name | Description |
| --- | --- |
| `permission` | **Required.**<br>Set to `true` if permission is given to the tagged brand partner, or `false` if not. |

#### Example response

```json
{
  "success": true
}
```

**Note:** The API returns `false` on error and does not grant permission to the brand partner.

## Learn more

* [IG User](https://developers.facebook.com/docs/instagram-api/reference/ig-user)
* [IG Media](https://developers.facebook.com/docs/instagram-api/reference/ig-media)
* [Branded Content Policy](https://www.facebook.com/policies/brandedcontent)
* [Ad Policy](https://www.facebook.com/policies/ads/)
