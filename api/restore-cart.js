// api/restore-cart.js
// Restore saved customer cart
// Returns a Shopify cart URL containing saved products and quantities

import fetch from "node-fetch";


// =====================================================
// Shopify Store
// =====================================================

const SHOP_DOMAIN =
  "thefunkyfish.in";


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
    "Content-Type"
  );


  // ===================================================
  // Handle OPTIONS
  // ===================================================

  if (
    req.method === "OPTIONS"
  ) {

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
            "Missing customerId"

        });
    }


    // =================================================
    // Fetch saved cart
    // =================================================

    console.log(
      "Fetching saved cart for customer:",
      customerId
    );


    const response =
      await fetch(
        `https://funkyfishapi.vercel.app/api/get-cart?customerId=${encodeURIComponent(customerId)}`
      );


    const data =
      await response.json();


    // =================================================
    // Check get-cart response
    // =================================================

    if (
      !response.ok
    ) {

      console.error(
        "Failed to fetch saved cart:",
        data
      );

      return res
        .status(
          response.status
        )
        .json({

          success:
            false,

          error:
            "Failed to fetch saved cart",

          details:
            data

        });
    }


    // =================================================
    // Check saved cart
    // =================================================

    if (
      !data.savedCartItems ||
      !Array.isArray(
        data.savedCartItems
      ) ||
      !data.savedCartItems.length
    ) {

      return res
        .status(404)
        .json({

          success:
            false,

          error:
            "No saved cart found"

        });
    }


    // =================================================
    // Build Shopify cart items
    // =================================================

    const cartItems =
      data.savedCartItems
        .filter(
          (item) =>
            item.id &&
            Number(
              item.quantity
            ) > 0
        )
        .map(
          (item) =>
            `${item.id}:${Number(item.quantity)}`
        );


    // =================================================
    // Validate cart items
    // =================================================

    if (
      !cartItems.length
    ) {

      return res
        .status(400)
        .json({

          success:
            false,

          error:
            "Saved cart contains no valid items"

        });
    }


    // =================================================
    // Create Shopify cart URL
    // =================================================

    const cartUrl =
      `https://${SHOP_DOMAIN}/cart/${cartItems.join(",")}`;


    // =================================================
    // Success
    // =================================================

    console.log(
      "Cart restore URL created:"
    );

    console.log(
      cartUrl
    );


    return res
      .status(200)
      .json({

        success:
          true,

        customerId:
          customerId,

        savedCartItems:
          data.savedCartItems,

        cartUrl:
          cartUrl

      });


  } catch (
    err
  ) {

    console.error(
      "RESTORE CART ERROR:",
      err
    );


    return res
      .status(500)
      .json({

        success:
          false,

        error:
          "Failed to restore saved cart",

        details:
          err.message

      });

  }

}