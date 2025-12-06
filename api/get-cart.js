// FORCE NODE RUNTIME (VERY IMPORTANT FOR CORS)
export const config = {
  runtime: "nodejs"
};

import fetch from "node-fetch";

export default async function handler(req, res) {
  // ---------------------------------------
  // CORS (Works for GET + POST + OPTIONS)
  // ---------------------------------------
  const ALLOWED_ORIGIN = "https://thefunkyfish.in";

  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Respond to preflight OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Allow only GET & POST
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", ["GET", "POST", "OPTIONS"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // ---------------------------------------
    // READ customerId (GET or POST)
    // ---------------------------------------
    let customerId;

    if (req.method === "GET") {
      customerId = req.query.customerId;
    }

    if (req.method === "POST") {
      const raw = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", chunk => (data += chunk));
        req.on("end", () => resolve(data));
        req.on("error", reject);
      });
      const body = JSON.parse(raw || "{}");
      customerId = body.customerId;
    }

    if (!customerId) {
      return res.status(400).json({ error: "Missing customerId" });
    }

    // ---------------------------------------
    // SHOPIFY API CALL
    // ---------------------------------------
    const SHOP_DOMAIN = "funkyfish-kairos.myshopify.com";
    const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    const shopifyResponse = await fetch(
      `https://${SHOP_DOMAIN}/admin/api/2024-01/customers/${customerId}/metafields.json`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": ADMIN_API_TOKEN
        }
      }
    );

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      return res.status(shopifyResponse.status).json({ error: errorText });
    }

    const data = await shopifyResponse.json();

    // Find metafield
    const savedCartField = data.metafields?.find(
      f => f.namespace === "custom" && f.key === "saved_cart"
    );

    const savedCartItems = savedCartField ? JSON.parse(savedCartField.value) : [];

    return res.status(200).json({ savedCartItems });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
