export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const customerId = req.query.customerId;

  if (!customerId) {
    return res.status(400).json({ error: "customerId is required" });
  }

  res.setHeader("Access-Control-Allow-Origin", "https://thefunkyfish.in");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  return res.status(200).json({
    savedCartItems: [
      { id: "test", name: "Test", quantity: 1 }
    ]
  });
}
