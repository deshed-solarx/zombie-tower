// Vercel serverless function for player-data API
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Handler for player data API
 */
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
      
      // Try to find the player
      let player;
      try {
        player = await prisma.players.findUnique({
          where: { playerId }
        });
      } catch (error) {
        console.error('Database error:', error);
      }
      
      // If player exists, return the data
      if (player) {
        return res.status(200).json({
          success: true,
          player
        });
      }
      
      // Create a new player if not found
      const displayName = `Player_${playerId.substring(0, 6)}`;
      
      try {
        const newPlayer = await prisma.players.create({
          data: {
            playerId,
            displayName,
            coins: 0,
            permUpgrades: {},
          }
        });
        
        return res.status(201).json({
          success: true,
          player: newPlayer,
          message: 'New player created'
        });
      } catch (error) {
        console.error('Error creating player:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create player'
        });
      }
    }
    
    // POST request - create new player
    if (req.method === 'POST') {
      const { playerId, displayName } = req.body;
      
      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: 'Player ID is required'
        });
      }
      
      try {
        const newPlayer = await prisma.players.create({
          data: {
            playerId,
            displayName: displayName || `Player_${playerId.substring(0, 6)}`,
            coins: 0,
            permUpgrades: {},
          }
        });
        
        return res.status(201).json({
          success: true,
          player: newPlayer
        });
      } catch (error) {
        console.error('Error creating player:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create player'
        });
      }
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
      
      try {
        const updatedPlayer = await prisma.players.update({
          where: { playerId },
          data: updates
        });
        
        return res.status(200).json({
          success: true,
          player: updatedPlayer
        });
      } catch (error) {
        console.error('Error updating player:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to update player'
        });
      }
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
  } finally {
    // Close the Prisma client connection
    await prisma.$disconnect();
  }
};