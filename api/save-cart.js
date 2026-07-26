// api/save-cart.js
// Save customer cart to Shopify customer metafield
// Uses Shopify Client Credentials authentication

import fetch from "node-fetch";

// =====================================================
// Shopify Access Token Cache
// =====================================================

let cachedAccessToken = null;
let tokenExpiresAt = 0;


// =====================================================
// Get Shopify Admin API Access Token
// =====================================================

async function getShopifyAccessToken() {

  // Reuse cached token if it is still valid
  if (
    cachedAccessToken &&
    Date.now() < tokenExpiresAt
  ) {
    console.log("Using cached Shopify access token");

    return cachedAccessToken;
  }

  const SHOP_DOMAIN = "funkyfish-kairos.myshopify.com";

  const CLIENT_ID =
    process.env.SHOPIFY_CLIENT_ID;

  const CLIENT_SECRET =
    process.env.SHOPIFY_CLIENT_SECRET;


  // Check environment variables
  if (!CLIENT_ID) {
    throw new Error(
      "SHOPIFY_CLIENT_ID is missing"
    );
  }

  if (!CLIENT_SECRET) {
    throw new Error(
      "SHOPIFY_CLIENT_SECRET is missing"
    );
  }


  console.log(
    "Requesting new Shopify Admin API access token..."
  );

  const tokenResponse = await fetch(
    `https://${SHOP_DOMAIN}/admin/oauth/access_token`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      })
    }
  );


  const tokenData =
    await tokenResponse.json();


  console.log(
    "Shopify token response status:",
    tokenResponse.status
  );


  if (!tokenResponse.ok) {

    console.error(
      "Shopify token generation failed:",
      tokenData
    );

    throw new Error(
      `Shopify token generation failed: ${JSON.stringify(tokenData)}`
    );
  }


  if (!tokenData.access_token) {

    throw new Error(
      "Shopify did not return an access token"
    );
  }


  // Save token in memory
  cachedAccessToken =
    tokenData.access_token;


  // Shopify token expiry
  // Refresh 5 minutes before expiry
  const expiresIn =
    tokenData.expires_in || 86400;


  tokenExpiresAt =
    Date.now() +
    ((expiresIn - 300) * 1000);


  console.log(
    "New Shopify Admin API token generated successfully"
  );

  console.log(
    "Token expires in:",
    expiresIn,
    "seconds"
  );


  return cachedAccessToken;
}


// =====================================================
// API Handler
// =====================================================

export default async function handler(req, res) {

  // ===================================================
  // CORS
  // ===================================================

  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://thefunkyfish.in"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  res.setHeader(
    "Access-Control-Allow-Credentials",
    "true"
  );


  // ===================================================
  // Handle OPTIONS / Preflight
  // ===================================================

  if (req.method === "OPTIONS") {

    console.log(
      "Handling OPTIONS preflight"
    );

    return res
      .status(204)
      .end();
  }


  // ===================================================
  // Only allow POST
  // ===================================================

  if (req.method !== "POST") {

    return res
      .status(405)
      .json({
        error: "Method Not Allowed"
      });
  }


  try {

    // =================================================
    // Get request data
    // =================================================

    const {
      customerId,
      cartItems
    } = req.body;


    if (
      !customerId ||
      !cartItems
    ) {

      return res
        .status(400)
        .json({
          error:
            "Missing customerId or cartItems"
        });
    }


    // =================================================
    // Shopify Store
    // =================================================

    const SHOP_DOMAIN =
      "funkyfish-kairos.myshopify.com";


    console.log(
      "================================="
    );

    console.log(
      "=== SAVE CART REQUEST ==="
    );

    console.log(
      "Shop:",
      SHOP_DOMAIN
    );

    console.log(
      "Customer ID:",
      customerId
    );

    console.log(
      "Cart items:",
      cartItems.length
    );


    // =================================================
    // Get fresh Shopify access token
    // =================================================

    const ADMIN_API_TOKEN =
      await getShopifyAccessToken();


    // =================================================
    // Save cart to Shopify customer metafield
    // =================================================

    const response = await fetch(
      `https://${SHOP_DOMAIN}/admin/api/2026-04/customers/${customerId}/metafields.json`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "X-Shopify-Access-Token":
            ADMIN_API_TOKEN
        },

        body: JSON.stringify({
          metafield: {
            namespace: "custom",

            key: "saved_cart",

            value:
              JSON.stringify(
                cartItems
              ),

            type: "json"
          }
        })
      }
    );


    // =================================================
    // Read Shopify response safely
    // =================================================

    const responseText =
      await response.text();


    console.log(
      "Shopify HTTP Status:",
      response.status
    );

    console.log(
      "Shopify Response:",
      responseText
    );


    // =================================================
    // Return Shopify result
    // =================================================

    let parsedResponse;

    try {

      parsedResponse =
        JSON.parse(
          responseText
        );

    } catch {

      parsedResponse = {
        rawResponse:
          responseText
      };

    }


    return res
      .status(response.status)
      .json({

        success:
          response.ok,

        shopifyStatus:
          response.status,

        shopifyResponse:
          parsedResponse

      });


  } catch (err) {

    console.error(
      "================================="
    );

    console.error(
      "SAVE CART ERROR:",
      err
    );

    console.error(
      "================================="
    );


    return res
      .status(500)
      .json({

        success: false,

        error:
          err.message

      });
  }
}