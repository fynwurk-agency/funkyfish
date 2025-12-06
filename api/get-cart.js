import fetch from 'node-fetch';

export default async function handler(req, res) {
  const ALLOWED_ORIGIN = 'https://thefunkyfish.in';

  // --- CORS headers ---
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // --- Preflight OPTIONS ---
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- Only allow GET/POST ---
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Support GET query or POST JSON body
    let customerId;
    if (req.method === 'GET') {
      customerId = req.query.customerId;
    } else if (req.method === 'POST') {
      const body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => (data += chunk));
        req.on('end', () => resolve(JSON.parse(data)));
        req.on('error', reject);
      });
      customerId = body.customerId;
    }

    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId' });
    }

    const SHOP_DOMAIN = 'funkyfish-kairos.myshopify.com';
    const ADMIN_API_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

    const response = await fetch(
      `https://${SHOP_DOMAIN}/admin/api/2024-01/customers/${customerId}/metafields.json`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ADMIN_API_TOKEN,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    const savedCartField = data.metafields?.find(
      (f) => f.namespace === 'custom' && f.key === 'saved_cart'
    );

    const savedCartItems = savedCartField ? JSON.parse(savedCartField.value) : [];
    return res.status(200).json({ savedCartItems });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
