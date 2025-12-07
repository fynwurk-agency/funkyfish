import fetch from "node-fetch";
import nodemailer from "nodemailer";

const SHOP = "funkyfish-kairos.myshopify.com";
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export default async function handler(req, res) {
  try {
    // 1) Get basic customer list
    const customersRes = await fetch(`https://${SHOP}/admin/api/2025-01/customers.json?fields=id,email`, {
      headers: { "X-Shopify-Access-Token": TOKEN }
    });

    const { customers } = await customersRes.json();

    for (let customer of customers) {

      // 2) Fetch metafields for each customer
      const metafieldsRes = await fetch(
        `https://${SHOP}/admin/api/2025-01/customers/${customer.id}/metafields.json`,
        { headers: { "X-Shopify-Access-Token": TOKEN } }
      );

      const metafieldsData = await metafieldsRes.json();
      const metafields = metafieldsData.metafields || [];

      // 3) Find saved_cart metafield
      const mf = metafields.find(
        m => m.namespace === "custom" && m.key === "saved_cart"
      );

      if (!mf) continue;

      const cart = JSON.parse(mf.value);

      // Skip if no items
      if (!cart.savedCartItems || cart.savedCartItems.length === 0) continue;

      // Check last update & emailed flag
      const lastUpdate = new Date(cart.updatedAt);
      const now = new Date();

      const hoursPassed = (now - lastUpdate) / 36e5;

      if (cart.emailed || hoursPassed < 1) continue;

      // --- Send Email ---
      const restoreLink = `https://thefunkyfish.in/restore-cart?customerId=${customer.id}`;

      const html = `
        <h3>You left items in your cart:</h3>
        ${cart.savedCartItems.map(i => `<div>${i.name} × ${i.quantity}</div>`).join("")}
        <p><a href="${restoreLink}">Restore your cart</a></p>
      `;

      await transporter.sendMail({
        from: `"The Funky Fish" <${process.env.SMTP_USER}>`,
        to: customer.email,
        subject: "You left items in your cart!",
        html
      });

      // Mark as emailed
      cart.emailed = true;

      await fetch(`https://${SHOP}/admin/api/2025-01/customers/${customer.id}/metafields/${mf.id}.json`, {
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          metafield: {
            id: mf.id,
            namespace: "custom",
            key: "saved_cart",
            value: JSON.stringify(cart),
            type: "json"
          }
        })
      });

      console.log(`Email sent to ${customer.email}`);
    }

    res.status(200).json({ status: "Abandoned cart emails processed successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Send abandoned emails failed" });
  }
}
