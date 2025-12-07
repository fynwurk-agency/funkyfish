import fetch from "node-fetch";
import nodemailer from "nodemailer";

const SHOP = process.env.SHOPIFY_STORE_DOMAIN;   // you already use this
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;   // already exists

// SMTP email sender
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,   // add this in Vercel
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,  // add in Vercel
    pass: process.env.SMTP_PASS   // add in Vercel
  }
});

export default async function handler(req, res) {
  try {
    // STEP 1: Get all customers + metafields
    const response = await fetch(
      `https://${SHOP}/admin/api/2025-10/customers.json?fields=id,email`,
      {
        headers: {
          "X-Shopify-Access-Token": TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    const { customers } = await response.json();
    const now = new Date();

    for (let customer of customers) {
      // STEP 2: Fetch metafields of the customer
      const metafieldsRes = await fetch(
        `https://${SHOP}/admin/api/2025-10/customers/${customer.id}/metafields.json`,
        {
          headers: {
            "X-Shopify-Access-Token": TOKEN,
            "Content-Type": "application/json"
          }
        }
      );

      const metafields = (await metafieldsRes.json()).metafields;

      const savedCartMField = metafields.find(
        m => m.namespace === "custom" && m.key === "saved_cart"
      );

      if (!savedCartMField) continue; // No saved cart → skip

      const cart = JSON.parse(savedCartMField.value);
      const lastUpdate = new Date(cart.updatedAt);

      // Already emailed OR time < 1 hour
      if (cart.emailed || (now - lastUpdate) / 36e5 < 1) continue;

      // STEP 3: Send restore email
      const restoreLink = `https://thefunkyfish.in/restore-cart?customerId=${customer.id}`;
      const html = `
        <h3>You left items in your cart:</h3>
        ${cart.savedCartItems.map(i => `<div>${i.name} × ${i.quantity}</div>`).join("")}
        <br/>
        <a href="${restoreLink}">Click here to restore your cart</a>
      `;

      await transporter.sendMail({
        from: `"The Funky Fish" <${process.env.SMTP_USER}>`,
        to: customer.email,
        subject: "You left items in your cart!",
        html
      });

      console.log(`Email sent → ${customer.email}`);

      // STEP 4: UPDATE metafield (not create new)
      cart.emailed = true;

      await fetch(
        `https://${SHOP}/admin/api/2025-10/metafields/${savedCartMField.id}.json`,
        {
          method: "PUT",
          headers: {
            "X-Shopify-Access-Token": TOKEN,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            metafield: {
              id: savedCartMField.id,
              value: JSON.stringify(cart),
              type: "json"
            }
          })
        }
      );
    }

    res.status(200).json({ status: "Completed abandoned cart email job" });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: "Send abandoned emails failed" });
  }
}
