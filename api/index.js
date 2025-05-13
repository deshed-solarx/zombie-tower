// Main API handler for Vercel
export default function handler(req, res) {
  // Set CORS headers to allow access from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Return simple API status
  res.status(200).json({
    status: 'success',
    message: 'Game API is running',
    timestamp: new Date().toISOString(),
    env: 'vercel'
  });
}