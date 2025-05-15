// Player data API for Vercel deployment
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // GET request - fetch player data
    if (req.method === 'GET') {
      const { playerId } = req.query;
      
      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: 'Player ID is required'
        });
      }
      
      // Return mock player data for testing
      return res.status(200).json({
        success: true,
        player: {
          id: Math.floor(Math.random() * 1000),
          playerId,
          displayName: `Player_${playerId.substring(0, 6)}`,
          coins: 0,
          permUpgrades: {},
          lastSeen: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      });
    }
    
    // PUT request - update player data
    if (req.method === 'PUT') {
      const { playerId } = req.query;
      const updates = req.body;
      
      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: 'Player ID is required'
        });
      }
      
      // Return success response with updated data
      return res.status(200).json({
        success: true,
        player: {
          id: Math.floor(Math.random() * 1000),
          playerId,
          displayName: `Player_${playerId.substring(0, 6)}`,
          ...updates,
          lastSeen: new Date().toISOString()
        }
      });
    }
    
    // If we reach here, the method is not supported
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};