// /api/get-cart.js
export default async function handler(req, res) {
  // Set CORS headers FIRST
  res.setHeader('Access-Control-Allow-Origin', 'https://thefunkyfish.in');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS/preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET method
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const customerId = req.query.customerId;

    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId' });
    }

    const SHOP_DOMAIN = 'funkyfish-kairos.myshopify.com';
    const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    console.log('Fetching cart for customer:', customerId);

    const response = await fetch(
      `https://${SHOP_DOMAIN}/admin/api/2024-01/customers/${customerId}/metafields.json`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ADMIN_API_TOKEN
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify API error:', errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    console.log('Shopify response:', data);

    const savedCartField = data.metafields?.find(
      (f) => f.namespace === 'custom' && f.key === 'saved_cart'
    );

    const savedCartItems = savedCartField
      ? JSON.parse(savedCartField.value)
      : [];

    return res.status(200).json({ savedCartItems });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
}