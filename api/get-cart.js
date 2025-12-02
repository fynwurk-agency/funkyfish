// api/get-cart.js - CLEAN SIMPLE VERSION
export default async function handler(req, res) {
  console.log('======== GET-CART CALLED ========');
  console.log('Method:', req.method);
  console.log('Query:', req.query);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS preflight handled');
    return res.status(200).end();
  }
  
  // ONLY allow GET
  if (req.method !== 'GET') {
    console.log(`Method ${req.method} not allowed`);
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      error: `Method ${req.method} Not Allowed`,
      allowed: ['GET']
    });
  }
  
  console.log('GET request processing');
  
  // Simple response
  return res.status(200).json({
    success: true,
    message: 'GET endpoint works!',
    customerId: req.query.customerId,
    timestamp: new Date().toISOString(),
    test: 'This is a test response'
  });
}