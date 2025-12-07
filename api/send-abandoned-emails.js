import fetch from "node-fetch";
import nodemailer from "nodemailer";

const SHOP = "funkyfish-kairos.myshopify.com";
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

const transporter = nodemailer.createTransport({
  host: "smtp.example.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export default async function handler(req, res) {
  try {
    const response = await fetch(`https://${SHOP}/admin/api/2025-10/customers.json?fields=id,email,metafields`, {
      headers: { "X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json" }
    });
    const { customers } = await response.json();

    const now = new Date();

    for (let customer of customers) {
      const mf = customer.metafields.find(m => m.namespace === "custom" && m.key === "saved_cart");
      if (!mf) continue;

      const cart = JSON.parse(mf.value);
      const lastUpdate = new Date(cart.updatedAt);

      if (cart.emailed || (now - lastUpdate)/36e5 < 1) continue; // skip if already emailed or inactive <1hr

      // Send email
      const restoreLink = `https://thefunkyfish.in/restore-cart?customerId=${customer.id}`;
      const html = `
        <h3>You left items in your cart:</h3>
        ${cart.savedCartItems.map(i => `<div>${i.name} x ${i.quantity}</div>`).join("")}
        <a href="${restoreLink}">Restore Cart</a>
      `;
      await transporter.sendMail({
        from: `"The Funky Fish" <${process.env.SMTP_USER}>`,
        to: customer.email,
        subject: "You left items in your cart!",
        html
      });

      // Mark as emailed
      cart.emailed = true;
      await fetch(`https://${SHOP}/admin/api/2025-10/customers/${customer.id}/metafields.json`, {
        method: "POST",
        headers: { "X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json" },
        body: JSON.stringify({
          metafield: { namespace: "custom", key: "saved_cart", value: JSON.stringify(cart), type: "json" }
        })
      });

      console.log(`Email sent to ${customer.email}`);
    }

    res.status(200).json({ status: "Emails processed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process abandoned carts" });
  }
}
