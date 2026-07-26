import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const SHOP_DOMAIN = "funkyfish-kairos.myshopify.com";
    const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    const response = await fetch(
      `https://${SHOP_DOMAIN}/admin/api/2026-04/shop.json`,
      {
        headers: {
          "X-Shopify-Access-Token": ADMIN_API_TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    const text = await response.text();

    return res.status(200).json({
      status: response.status,
      response: text
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}