import fetch from "node-fetch";

export default async function handler(req, res) {
  const { customerId } = req.query;
  if (!customerId) return res.status(400).json({ error: "Missing customerId" });

  try {
    // Fetch saved cart using your existing get-cart API
    const r = await fetch(`https://funkyfishapi.vercel.app/api/get-cart?customerId=${customerId}`);
    const data = await r.json();

    if (!data.savedCartItems || !data.savedCartItems.length) {
      return res.status(404).json({ error: "No saved cart found" });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch saved cart" });
  }
}
