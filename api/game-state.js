// API handler for game state
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
  
  // For POST requests, save game state would go here
  if (req.method === 'POST') {
    try {
      // In a real implementation, you would save the state to a database
      // For now, we'll just echo it back
      const gameState = req.body;
      
      return res.status(200).json({
        success: true,
        message: 'Game state saved successfully',
        gameState
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to save game state',
        error: error.message
      });
    }
  }
  
  // For GET requests, return default game state
  return res.status(200).json({
    success: true,
    defaultState: {
      wave: 1,
      score: 0,
      towerHealth: 100
    }
  });
}