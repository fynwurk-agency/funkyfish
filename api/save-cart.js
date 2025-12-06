// api/save-cart.js - UPDATED WITH PROPER CORS
import fetch from "node-fetch";

export default async function handler(req, res) {
  // --- CORS HEADERS FIRST ---
 
  
  // Handle OPTIONS/preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight");
    return res.status(200).end();
  }
  // -------------------------
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { customerId, cartItems } = req.body;

    if (!customerId || !cartItems) {
      return res.status(400).json({ error: "Missing customerId or cartItems" });
    }

    const SHOP_DOMAIN = "funkyfish-kairos.myshopify.com";
    const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    const response = await fetch(
      `https://${SHOP_DOMAIN}/admin/api/2024-01/customers/${customerId}/metafields.json`,
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

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}