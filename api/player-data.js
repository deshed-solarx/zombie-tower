// API handler for player data
import { storage } from "../server/storage";

export default async function handler(req, res) {
  // Set CORS headers to allow access from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Handle GET request - retrieve player data
    if (req.method === 'GET') {
      const { playerId } = req.query;
      
      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: 'Player ID is required',
        });
      }
      
      // Try to get the player data
      const player = await storage.getPlayerById(playerId);
      
      if (player) {
        // Return existing player data
        return res.status(200).json({
          success: true,
          player
        });
      } else {
        // Create a new player if not found
        const newPlayer = await storage.createPlayer({ playerId });
        return res.status(201).json({
          success: true,
          player: newPlayer,
          message: 'New player created'
        });
      }
    }
    
    // Handle POST request - create new player
    if (req.method === 'POST') {
      const { playerId, displayName } = req.body;
      
      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: 'Player ID is required',
        });
      }
      
      // Check if player already exists
      const existingPlayer = await storage.getPlayerById(playerId);
      
      if (existingPlayer) {
        return res.status(409).json({
          success: false,
          message: 'Player already exists'
        });
      }
      
      // Create a new player
      const newPlayer = await storage.createPlayer({ 
        playerId,
        displayName: displayName || undefined
      });
      
      return res.status(201).json({
        success: true,
        player: newPlayer
      });
    }
    
    // Handle PUT request - update player data
    if (req.method === 'PUT') {
      const { playerId } = req.query;
      const updateData = req.body;
      
      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: 'Player ID is required',
        });
      }
      
      // Update player data
      const updatedPlayer = await storage.updatePlayer(playerId, updateData);
      
      if (!updatedPlayer) {
        return res.status(404).json({
          success: false,
          message: 'Player not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        player: updatedPlayer
      });
    }
    
    // Handle unsupported methods
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
    
  } catch (error) {
    console.error('Player data API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
}