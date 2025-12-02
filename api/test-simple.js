
// api/test-simple.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    return res.status(200).end();
  }
  
  return res.json({
    message: 'Test endpoint works',
    method: req.method,
    query: req.query
  });
}
