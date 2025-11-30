// server.mjs
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const SHOP_DOMAIN = "funkyfish-kairos.myshopify.com";
const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

// Save cart
app.post('/save-cart', async (req, res) => {
  const { customerId, cartItems } = req.body;

  try {
    const response = await fetch(`https://${SHOP_DOMAIN}/admin/api/2024-01/customers/${customerId}/metafields.json`, {
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
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get saved cart
app.post('/get-cart', async (req, res) => {
  const { customerId } = req.body;

  try {
    const response = await fetch(`https://${SHOP_DOMAIN}/admin/api/2024-01/customers/${customerId}/metafields.json`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ADMIN_API_TOKEN
      }
    });

    const data = await response.json();
    const savedCartField = data.metafields.find(f => f.namespace === "custom" && f.key === "saved_cart");
    res.json({ savedCartItems: savedCartField ? JSON.parse(savedCartField.value) : [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
