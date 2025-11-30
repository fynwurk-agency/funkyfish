import fetch from "node-fetch";

export default async function handler(req, res) {
  // ✅ Enable CORS for your Shopify domain
  res.setHeader("Access-Control-Allow-Origin", "https://thefunkyfish.in"); // Shopify domain
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: "Missing customerId" });
    }

    const SHOP_DOMAIN = "funkyfish-kairos.myshopify.com";
    const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    // Fetch customer metafields from Shopify
    const response = await fetch(
      `https://${SHOP_DOMAIN}/admin/api/2024-01/customers/${customerId}/metafields.json`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": ADMIN_API_TOKEN
        }
      }
    );

    const data = await response.json();

    // Find saved cart metafield
    const savedCartField = data.metafields?.find(
      (f) => f.namespace === "custom" && f.key === "saved_cart"
    );

    const savedCartItems = savedCartField ? JSON.parse(savedCartField.value) : [];

    return res.status(200).json({ savedCartItems });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
