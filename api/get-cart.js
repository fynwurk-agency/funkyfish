// api/get-cart.js
// Get customer saved cart from Shopify customer metafield

import fetch from "node-fetch";

import {
  getShopifyAccessToken
} from "./shopify-token.js";


// =====================================================
// Shopify Store
// =====================================================

const SHOP_DOMAIN =
  "funkyfish-kairos.myshopify.com";


// =====================================================
// Shopify API Version
// =====================================================

const SHOPIFY_API_VERSION =
  "2026-07";


// =====================================================
// API Handler
// =====================================================

export default async function handler(
  req,
  res
) {

  // ===================================================
  // CORS
  // ===================================================

  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://thefunkyfish.in"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
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

  if (
    req.method === "OPTIONS"
  ) {

    console.log(
      "Handling OPTIONS preflight"
    );

    return res
      .status(204)
      .end();
  }


  // ===================================================
  // Only allow GET
  // ===================================================

  if (
    req.method !== "GET"
  ) {

    return res
      .status(405)
      .json({

        success:
          false,

        error:
          "Method Not Allowed"

      });
  }


  try {

    // =================================================
    // Get customer ID
    // =================================================

    const customerId =
      req.query.customerId;


    // =================================================
    // Validate customer ID
    // =================================================

    if (
      !customerId
    ) {

      return res
        .status(400)
        .json({

          success:
            false,

          error:
            "customerId is required"

        });
    }


    // =================================================
    // Get Shopify Admin API Access Token
    // =================================================

    console.log(
      "Getting Shopify Admin API access token..."
    );

    const ADMIN_API_TOKEN =
      await getShopifyAccessToken();


    // =================================================
    // Shopify API URL
    // =================================================

    const shopifyUrl =
      `https://${SHOP_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/customers/${customerId}/metafields.json?namespace=custom&key=saved_cart`;


    console.log(
      "Getting saved cart for customer:",
      customerId
    );

    console.log(
      "Shopify API URL:",
      shopifyUrl
    );


    // =================================================
    // Get customer metafields
    // =================================================

    const response =
      await fetch(
        shopifyUrl,
        {
          method:
            "GET",

          headers: {

            "Accept":
              "application/json",

            "X-Shopify-Access-Token":
              ADMIN_API_TOKEN

          }

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

    if (
      !response.ok
    ) {

      console.error(
        "Shopify API request failed"
      );

      return res
        .status(
          response.status
        )
        .json({

          success:
            false,

          shopifyStatus:
            response.status,

          shopifyResponse:
            parsedResponse

        });
    }


    // =================================================
    // Get metafields
    // =================================================

    const metafields =
      parsedResponse.metafields || [];


    // =================================================
    // Find saved_cart metafield
    // =================================================

    const savedCartMetafield =
      metafields.find(
        (metafield) =>
          metafield.namespace ===
            "custom" &&
          metafield.key ===
            "saved_cart"
      );


    // =================================================
    // No saved cart
    // =================================================

    if (
      !savedCartMetafield
    ) {

      console.log(
        "No saved cart found for customer:",
        customerId
      );

      return res
        .status(200)
        .json({

          success:
            true,

          savedCartItems:
            []

        });
    }


    // =================================================
    // Parse saved cart value
    // =================================================

    let savedCartItems;

    try {

      savedCartItems =
        JSON.parse(
          savedCartMetafield.value
        );

    } catch (
      error
    ) {

      console.error(
        "Failed to parse saved_cart metafield:",
        error
      );

      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "Invalid saved cart data"

        });
    }


    // =================================================
    // Validate saved cart
    // =================================================

    if (
      !Array.isArray(
        savedCartItems
      )
    ) {

      console.error(
        "Saved cart value is not an array"
      );

      return res
        .status(500)
        .json({

          success:
            false,

          error:
            "Saved cart data is invalid"

        });
    }


    // =================================================
    // Success
    // =================================================

    console.log(
      "Saved cart retrieved successfully"
    );

    console.log(
      "Saved cart items:",
      savedCartItems.length
    );


    return res
      .status(200)
      .json({

        success:
          true,

        savedCartItems:

          savedCartItems

      });


  } catch (
    err
  ) {

    // =================================================
    // Server Error
    // =================================================

    console.error(
      "================================="
    );

    console.error(
      "GET CART ERROR:",
      err
    );

    console.error(
      "================================="
    );


    return res
      .status(500)
      .json({

        success:
          false,

        error:
          err.message

      });

  }

}