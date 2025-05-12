// Simple game state API for Vercel
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Simple response for all requests
  res.status(200).json({
    status: 'success',
    message: 'Game API is running',
    game: 'Zombie Tower Defense',
    version: '1.0.0',
    serverTime: new Date().toISOString()
  });
};