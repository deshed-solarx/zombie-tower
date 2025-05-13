import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for player data
  app.get("/api/player-data", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.query;
      
      if (!playerId || typeof playerId !== 'string') {
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
    } catch (error) {
      console.error('Error in GET /api/player-data:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  });
  
  // Create new player
  app.post("/api/player-data", async (req: Request, res: Response) => {
    try {
      const { playerId, displayName, coins, permUpgrades } = req.body;
      
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
        displayName: displayName || undefined,
        coins: coins !== undefined ? coins : 0,
        permUpgrades: permUpgrades || {}
      });
      
      return res.status(201).json({
        success: true,
        player: newPlayer
      });
    } catch (error) {
      console.error('Error in POST /api/player-data:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  });
  
  // Update player data
  app.put("/api/player-data", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.query;
      const updateData = req.body;
      
      if (!playerId || typeof playerId !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Player ID is required as a query parameter',
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
    } catch (error) {
      console.error('Error in PUT /api/player-data:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
