import fetch from "node-fetch";

export default async function handler(req, res) {
  // --- CORS FIX ---
  res.setHeader("Access-Control-Allow-Origin", "https://thefunkyfish.in");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  // ----------------

  // ALLOW ONLY GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const customerId = req.query.customerId; // from URL query

    if (!customerId) {
      return res.status(400).json({ error: "Missing customerId" });
    }

    const SHOP_DOMAIN = "funkyfish-kairos.myshopify.com";
    const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

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

    const savedCartField = data.metafields?.find(
      f => f.namespace === "custom" && f.key === "saved_cart"
    );

    const savedCartItems = savedCartField
      ? JSON.parse(savedCartField.value)
      : [];

    return res.status(200).json({ savedCartItems });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
