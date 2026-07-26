import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed"
    });
  }

  try {
    const { customerId, cartItems } = req.body;

    const SHOP_DOMAIN = "funkyfish-kairos.myshopify.com";
    const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    console.log("=== SAVE CART DEBUG ===");
    console.log("Shop:", SHOP_DOMAIN);
    console.log("Customer ID:", customerId);
    console.log("Token exists:", !!ADMIN_API_TOKEN);
    console.log("Token length:", ADMIN_API_TOKEN?.length);

    const shopifyResponse = await fetch(
      `https://${SHOP_DOMAIN}/admin/api/2026-04/customers/${customerId}/metafields.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": ADMIN_API_TOKEN
        },
        body: JSON.stringify({
          metafield: {
            namespace: "custom",
            key: "saved_cart",
            value: JSON.stringify(cartItems),
            type: "json"
          }
        })
      }
    );

    const responseText = await shopifyResponse.text();

    console.log("Shopify HTTP Status:", shopifyResponse.status);
    console.log("Shopify Response:", responseText);

    return res.status(200).json({
      success: shopifyResponse.ok,
      shopifyStatus: shopifyResponse.status,
      shopifyResponse: responseText
    });

  } catch (error) {
    console.error("ERROR:", error);

    return res.status(500).json({
      error: error.message
    });
  }
}