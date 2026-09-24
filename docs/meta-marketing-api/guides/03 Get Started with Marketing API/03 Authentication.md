<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/get-started/authentication | Saved: 2026-09-19 -->

# Authentication



Every Marketing API call requires an access token as a parameter.

See [Access Tokens for Meta Technologies](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens) for more information on the various types of access tokens.

## Get an access token for your app

### User access tokens

#### Graph API Explorer

You can get a user access token using the [Graph API Explorer](https://developers.facebook.com/tools/explorer). To learn how to use the Graph API Explorer to make API calls, see the [Graph API Explorer Guide](https://developers.facebook.com/docs/graph-api/explorer).

1. In the **Meta App** field, select an app to obtain the access token for.
2. In the **User or Page** field, select **User Token**.
3. In the **Add a Permission** drop-down under **Permissions**, select the permissions you need (for example, `ads_read` or `ads_management`).
4. Click **Generate Access Token**. The box on top of the button displays the access token; [store the token](#storing-the-token) for later use.

#### Debug

To get more information in the token you just generated, click on the information icon (**i**) in front of the token to open the **Access Token Info** table, which displays some basic information about the token. Click **Open in Access Token Tool** to be redirected to the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken).

While debugging, you can check:

* **App ID:** The app ID mentioned in the prerequisite section.
* **Expires:** A time stamp. A short-lived token expires in an hour or two.
* **Scopes:** Contains the permissions added in the Graph API Explorer.

#### Extend your access token

1. Paste your token in the text box of the [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken) and click **Debug**.
2. Click **Extend Access Token** at the bottom of the **Access Token Info** table to get a long-lived token, and copy that token for later use.

Check your new token's properties using the Access Token Debugger. It should have a longer expiration time, such as "60 days", or "Never" under **Expires**. See [Long-Lived Access Token](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens/get-long-lived) for more information.

### System user access tokens

A system user access token is a type of access token that is associated with a system user account, which is an account that is created in Meta Business Suite to manage assets and call the Marketing API. System user access tokens are useful for server-to-server interactions where there is no user present to authenticate. System user access tokens can be used to perform actions on behalf of the business, such as reading and writing business data, managing ad campaigns, and other ad objects.

One benefit of using a system user access token is that it does not expire, so it can be used in long-running scripts or services that need to access the Marketing API. Additionally, because system user accounts are not tied to a specific individual, they can be used to provide a level of separation between personal and business activity on Meta technologies.

System user tokens are also less likely to be invalidated than long-lived user access tokens.

See [System Users](https://developers.facebook.com/docs/marketing-api/system-users) for more information.

## Get an access token for ad accounts you manage

After the owner of an ad account you are going to manage clicks the **Allow** button when you prompt for permissions, they are redirected to a URL that contains the value of the `redirect_uri` parameter and an authorization code:

```html
http://YOUR_URL?code=<AUTHORIZATION_CODE>
```

You can then build the URL for an API call that includes the endpoint for getting a token, your app ID, your site URL, your app secret, and the authorization code you just received:

```html
https://graph.facebook.com/v25.0/oauth/access_token?
  client_id=<YOUR_APP_ID>
  &redirect_uri=<YOUR_URL>
  &client_secret=<YOUR_APP_SECRET>
  &code=<AUTHORIZATION_CODE>
```

The API response should contain the generated access token:

* If you follow the server-side authentication flow, you get a persistent token.
* If you follow the client-side authentication flow, you get a token with a finite validity period of about one to two hours. This short-lived token can be exchanged for a persistent token by calling the [Graph API endpoint for Extending Tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens/get-long-lived).

If a [system user](https://developers.facebook.com/docs/marketing-api/system-users) of a business invokes the API, you can use a [system user access token](https://developers.facebook.com/docs/marketing-api/system-users/install-apps-and-generate-tokens).

You can debug the access token, check for expiration, and validate the permissions granted using the [Access Token Debugger](https://developers.facebook.com/tools/accesstoken) or the [programmatic validation API](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens#debug).

## Storing the token

Your Marketing API access token should be safely stored in your database for subsequent API calls. Always move tokens between your client and server securely over HTTPS to ensure account security. [Read more about the implications of moving tokens between your clients and your server](https://developers.facebook.com/documentation/facebook-login/access-tokens/portability).

You should regularly check for validity of the token, and if necessary, prompt for permissions renewal. Even a persistent token can become invalid in a few cases, including the following:

* A password changes
* A user revokes permissions

As user access tokens can be invalidated or revoked anytime for some reasons, your app should expect to have a flow to re-request permission from users. Check the validity of the user token when they start your app. If necessary, re-run the authentication flow to get an updated token.

If re-running the authentication flow is not possible for your app, use a different way to prompt for permissions. This can happen in cases where the API calls are not directly triggered by a user interface or are made by periodically run scripts. Send an email with instructions to prompt for permissions renewal.

## Best practices for secure credential management

To ensure the security of user credentials and access tokens, you should adhere to the following best practices:

* **Use HTTPS:** Always transmit access tokens over secure connections (HTTPS) to prevent interception by malicious actors.
* **Store tokens securely:** Use secure storage solutions, such as encrypted databases, for storing access and refresh tokens, minimizing the risk of unauthorized access.
* **Limit token scope:** Request only the minimum necessary permissions, reducing the risk of overexposure to user data.
* **Implement token expiration:** Regularly refresh tokens and have a robust mechanism to handle expiration, ensuring continued access without exposing long-lived tokens.

## Learn more

- [Access Tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens)

- [Long-Lived Tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens/get-long-lived)

- [Debugging and Errors](https://developers.facebook.com/docs/facebook-login/access-tokens/debugging-and-error-handling)

- [Session Info Access Tokens](https://developers.facebook.com/documentation/facebook-login/guides/access-tokens/get-session-info)

- [Portability](https://developers.facebook.com/documentation/facebook-login/access-tokens/portability)

