export default function handler(req, res) {
  res.status(200).json({
    success: true,
    app: "Funky Fish Abandoned Cart",
    message: "Shopify app is connected successfully"
  });
}