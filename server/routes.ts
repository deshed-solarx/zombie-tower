import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getTopScores, addHighScore, findDatabaseByTitle } from "./notion";

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
  
  // Leaderboard API endpoints
  app.get("/api/leaderboard", async (req: Request, res: Response) => {
    try {
      // Check if Notion credentials are available
      const hasNotionCredentials = 
        process.env.NOTION_INTEGRATION_SECRET && 
        process.env.NOTION_PAGE_URL;

      if (!hasNotionCredentials) {
        return res.status(503).json({ 
          success: false, 
          message: "Notion integration is not configured."
        });
      }

      // Find the leaderboard database in Notion
      const leaderboardDb = await findDatabaseByTitle("Zombie Defense Leaderboard");
      
      if (!leaderboardDb) {
        return res.status(404).json({ 
          success: false, 
          message: "Leaderboard database not found in Notion."
        });
      }

      // Get top scores
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const scores = await getTopScores(leaderboardDb.id, limit);
      
      return res.status(200).json({ 
        success: true, 
        scores 
      });
    } catch (error) {
      console.error('Error in GET /api/leaderboard:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  });
  
  app.post("/api/leaderboard", async (req: Request, res: Response) => {
    try {
      // Check if Notion credentials are available
      const hasNotionCredentials = 
        process.env.NOTION_INTEGRATION_SECRET && 
        process.env.NOTION_PAGE_URL;

      if (!hasNotionCredentials) {
        return res.status(503).json({ 
          success: false, 
          message: "Notion integration is not configured."
        });
      }

      // Find the leaderboard database in Notion
      const leaderboardDb = await findDatabaseByTitle("Zombie Defense Leaderboard");
      
      if (!leaderboardDb) {
        return res.status(404).json({ 
          success: false, 
          message: "Leaderboard database not found in Notion."
        });
      }
      
      // Validate required fields
      const { playerName, score, waveReached } = req.body;
      
      if (!playerName || typeof score !== 'number' || typeof waveReached !== 'number') {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields: playerName, score, and waveReached"
        });
      }
      
      // Add the score to Notion
      const result = await addHighScore(leaderboardDb.id, {
        playerName,
        score,
        waveReached,
        date: new Date()
      });
      
      if (result) {
        return res.status(201).json({ 
          success: true, 
          message: "Score added to leaderboard successfully",
          scoreId: result.id
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to add score to leaderboard"
        });
      }
    } catch (error) {
      console.error('Error in POST /api/leaderboard:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal Server Error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
