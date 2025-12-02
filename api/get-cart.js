// /api/get-cart.js - SIMPLE VERSION
export default async function handler(req, res) {
  console.log('GET CART CALLED:', req.method, req.query);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://thefunkyfish.in');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS/preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  
  try {
    const customerId = req.query.customerId;
    
    if (!customerId) {
      return res.status(400).json({ error: 'Missing customerId' });
    }
    
    // Return dummy data for testing
    return res.status(200).json({
      success: true,
      message: 'GET endpoint works!',
      customerId: customerId,
      savedCartItems: [
        { id: 'test-1', name: 'Test Product', quantity: 1 }
      ],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}