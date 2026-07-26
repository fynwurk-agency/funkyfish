// api/save-cart.js
// Save customer cart to Shopify customer metafield
// Uses Shopify Admin API access token from Vercel environment variables

import fetch from "node-fetch";

// =====================================================
// Shopify Store
// =====================================================

const SHOP_DOMAIN = "funkyfish-kairos.myshopify.com";


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
        success: false,
        error: "Method Not Allowed"
      });
  }


  try {

    // =================================================
    // Get Shopify Admin API Token
    // =================================================

    const ADMIN_API_TOKEN =
      process.env.SHOPIFY_ADMIN_TOKEN;


    // =================================================
    // Check token
    // =================================================

    if (!ADMIN_API_TOKEN) {

      console.error(
        "SHOPIFY_ADMIN_TOKEN is missing"
      );

      return res
        .status(500)
        .json({
          success: false,
          error:
            "SHOPIFY_ADMIN_TOKEN is not configured"
        });
    }


    // =================================================
    // Get request data
    // =================================================

    const {
      customerId,
      cartItems
    } = req.body || {};


    // =================================================
    // Validate request
    // =================================================

    if (!customerId) {

      return res
        .status(400)
        .json({
          success: false,
          error:
            "Missing customerId"
        });
    }


    if (
      !Array.isArray(cartItems)
    ) {

      return res
        .status(400)
        .json({
          success: false,
          error:
            "cartItems must be an array"
        });
    }


    // =================================================
    // Debug logs
    // =================================================

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

    console.log(
      "Token exists:",
      !!ADMIN_API_TOKEN
    );

    console.log(
      "Token length:",
      ADMIN_API_TOKEN.length
    );


    // =================================================
    // Shopify Admin API
    // =================================================

    const response = await fetch(
      `https://${SHOP_DOMAIN}/admin/api/2026-04/customers/${customerId}/metafields.json`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "Accept":
            "application/json",

          "X-Shopify-Access-Token":
            ADMIN_API_TOKEN
        },

        body: JSON.stringify({

          metafield: {

            namespace:
              "custom",

            key:
              "saved_cart",

            value:
              JSON.stringify(
                cartItems
              ),

            type:
              "json"

          }

        })

      }
    );


    // =================================================
    // Read Shopify response
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
    // Parse Shopify response
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


    // =================================================
    // Shopify API Error
    // =================================================

    if (!response.ok) {

      console.error(
        "Shopify API request failed"
      );

      return res
        .status(response.status)
        .json({

          success: false,

          shopifyStatus:
            response.status,

          shopifyResponse:
            parsedResponse

        });

    }


    // =================================================
    // Success
    // =================================================

    console.log(
      "Cart saved successfully"
    );


    return res
      .status(200)
      .json({

        success: true,

        shopifyStatus:
          response.status,

        shopifyResponse:
          parsedResponse

      });


  } catch (err) {

    // =================================================
    // Server Error
    // =================================================

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