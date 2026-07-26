import fetch from "node-fetch";

let cachedToken = null;
let tokenExpiresAt = 0;

export async function getShopifyAccessToken() {
  const now = Date.now();

  // Reuse cached token if it is still valid.
  // Refresh 5 minutes before expiry.
  if (
    cachedToken &&
    now < tokenExpiresAt - 5 * 60 * 1000
  ) {
    return cachedToken;
  }

  const clientId =
    process.env.SHOPIFY_CLIENT_ID;

  const clientSecret =
    process.env.SHOPIFY_CLIENT_SECRET;

  const shop =
    process.env.SHOPIFY_SHOP;

    console.log("Shopify credentials check:", {
  clientIdExists: !!clientId,
  clientSecretExists: !!clientSecret,
  shopExists: !!shop
});

  if (
    !clientId ||
    !clientSecret ||
    !shop
  ) {
    throw new Error(
      "Missing Shopify client credentials"
    );
  }

  const response = await fetch(
    `https://${shop}.myshopify.com/admin/oauth/access_token`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },

      body: new URLSearchParams({
        grant_type:
          "client_credentials",

        client_id:
          clientId,

        client_secret:
          clientSecret
      }).toString()
    }
  );

  const responseText =
    await response.text();

  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    data = {
      rawResponse:
        responseText
    };
  }

  if (!response.ok) {
    console.error(
      "Shopify token request failed:",
      response.status,
      data
    );

    throw new Error(
      `Shopify token request failed: ${response.status}`
    );
  }

  cachedToken =
    data.access_token;

  // Shopify returns expires_in in seconds.
  tokenExpiresAt =
    now +
    (data.expires_in * 1000);

  console.log(
    "New Shopify Admin API access token obtained"
  );

  return cachedToken;
}