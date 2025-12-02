// server.mjs Code for FunkyFish API
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// --- CORS FIX ---

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://thefunkyfish.in");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
// ----------------

const SHOP_DOMAIN = "funkyfish-kairos.myshopify.com";
const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

/* -------------------------------------------
   SAVE CART
-------------------------------------------- */
app.post("/save-cart", async (req, res) => {
  try {
    const { customerId, cartItems } = req.body;

    if (!customerId || !cartItems) {
      return res.status(400).json({ error: "Missing customerId or cartItems" });
    }

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
    return res.json(data);

  } catch (err) {
    console.error("SAVE CART ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------
   GET SAVED CART
-------------------------------------------- */
app.post("/get-cart", async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({ error: "Missing customerId" });
    }

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

    if (!data.metafields) {
      return res.json({ savedCartItems: [] });
    }

    const savedCartField = data.metafields.find(
      (f) => f.namespace === "custom" && f.key === "saved_cart"
    );

    let savedCartItems = [];

    if (savedCartField && savedCartField.value) {
      try {
        savedCartItems = JSON.parse(savedCartField.value);
      } catch (e) {
        console.error("JSON PARSE ERROR:", e);
      }
    }

    return res.json({ savedCartItems });

  } catch (err) {
    console.error("GET CART ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
});

/* -------------------------------------------
   START SERVER
-------------------------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
