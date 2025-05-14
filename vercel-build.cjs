// Build script for Vercel deployment of the full project
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel full project build...');

try {
  // Create build directories
  const distDir = path.join(__dirname, 'dist');
  const publicDir = path.join(distDir, 'public');
  
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Build the client
  console.log('📦 Building client with vite...');
  execSync('cd client && npx vite build --outDir ../dist/public', { stdio: 'inherit' });
  
  // Copy API files to the api directory
  console.log('📋 Setting up API files...');
  
  // Create the api directory for serverless functions
  const apiDir = path.join(__dirname, 'api');
  
  // Copy all necessary server files to be imported by API handlers
  console.log('📋 Copying server modules...');
  
  // Ensure the server code is accessible to API functions
  const serverDir = path.join(__dirname, 'server');
  const destServerDir = path.join(__dirname, 'api-lib');
  
  if (!fs.existsSync(destServerDir)) {
    fs.mkdirSync(destServerDir, { recursive: true });
  }
  
  // Create a helper file for the Prisma/database connection
  const prismaClientFile = `// Generated prisma-client.js
const { PrismaClient } = require('@prisma/client');

// Avoid instantiating too many instances of Prisma Client in development
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = prisma;`;

  fs.writeFileSync(path.join(__dirname, 'api-lib/prisma-client.js'), prismaClientFile);
  
  // Create a shared database connection for all API routes
  const dbConnectionFile = `// Database connection for API routes
const prisma = require('./prisma-client');

/**
 * Get player by ID
 */
async function getPlayerById(playerId) {
  return await prisma.players.findUnique({
    where: { playerId }
  });
}

/**
 * Create a new player
 */
async function createPlayer(data) {
  return await prisma.players.create({
    data
  });
}

/**
 * Update a player
 */
async function updatePlayer(playerId, data) {
  return await prisma.players.update({
    where: { playerId },
    data
  });
}

/**
 * Get all players
 */
async function getAllPlayers() {
  return await prisma.players.findMany();
}

module.exports = {
  prisma,
  getPlayerById,
  createPlayer,
  updatePlayer,
  getAllPlayers
};`;

  fs.writeFileSync(path.join(__dirname, 'api-lib/db.js'), dbConnectionFile);
  
  // Create a helper file for Notion API
  const notionHelperFile = `// Notion API helper
const { Client } = require('@notionhq/client');

let notionClient = null;

// Initialize Notion client with proper error handling
function getNotionClient() {
  // Check if we already have a client
  if (notionClient) return notionClient;
  
  // Check if Notion credentials are available
  if (!process.env.NOTION_INTEGRATION_SECRET) {
    console.warn("NOTION_INTEGRATION_SECRET not found, Notion integration unavailable");
    return null;
  }
  
  try {
    notionClient = new Client({
      auth: process.env.NOTION_INTEGRATION_SECRET,
    });
    return notionClient;
  } catch (error) {
    console.error("Failed to initialize Notion client:", error);
    return null;
  }
}

// Extract page ID from Notion URL
function extractPageIdFromUrl(pageUrl) {
  if (!pageUrl) return "";
  
  try {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
      return match[1];
    }
  } catch (error) {
    console.error("Error extracting page ID:", error);
  }
  
  return "";
}

// Find the leaderboard database
async function findLeaderboardDatabase(notion, pageId) {
  try {
    // Query all child blocks in the specified page
    const response = await notion.blocks.children.list({
      block_id: pageId,
    });

    // Look for a database with "Leaderboard" in the title
    for (const block of response.results) {
      if (block.type === "child_database") {
        const databaseId = block.id;
        
        // Check if this is the leaderboard database
        const dbInfo = await notion.databases.retrieve({
          database_id: databaseId,
        });
        
        // Check title for "leaderboard" (case insensitive)
        const dbTitle = dbInfo.title?.[0]?.plain_text || "";
        if (dbTitle.toLowerCase().includes("leaderboard")) {
          return databaseId;
        }
      }
    }
  } catch (dbError) {
    console.error("Error finding leaderboard database:", dbError);
  }
  
  return null;
}

// Get top scores from database
async function getTopScores(notion, leaderboardDbId, limit = 10) {
  try {
    const response = await notion.databases.query({
      database_id: leaderboardDbId,
      sorts: [
        {
          property: "Score",
          direction: "descending"
        }
      ],
      page_size: limit
    });
    
    return response.results.map(page => {
      const properties = page.properties;
      
      return {
        id: page.id,
        playerName: properties.PlayerName?.title?.[0]?.plain_text || "Unknown Player",
        score: properties.Score?.number || 0,
        waveReached: properties.WaveReached?.number || 0,
        date: properties.Date?.date?.start || null
      };
    });
  } catch (error) {
    console.error("Error querying leaderboard:", error);
    throw error;
  }
}

// Add a new high score
async function addHighScore(notion, leaderboardDbId, data) {
  try {
    return await notion.pages.create({
      parent: {
        database_id: leaderboardDbId,
      },
      properties: {
        PlayerName: {
          title: [
            {
              text: {
                content: data.playerName
              }
            }
          ]
        },
        Score: {
          number: data.score
        },
        WaveReached: {
          number: data.waveReached
        },
        Date: {
          date: {
            start: data.date ? new Date(data.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          }
        }
      }
    });
  } catch (error) {
    console.error("Error adding high score:", error);
    throw error;
  }
}

module.exports = {
  getNotionClient,
  extractPageIdFromUrl,
  findLeaderboardDatabase,
  getTopScores,
  addHighScore
};`;

  fs.writeFileSync(path.join(__dirname, 'api-lib/notion-helper.js'), notionHelperFile);
  
  // Create API route handlers
  // player-data.js API route
  const playerDataApi = `// API route for player data
const { getPlayerById, createPlayer, updatePlayer } = require('../api-lib/db');

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
        player = await getPlayerById(playerId);
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
      const displayName = \`Player_\${playerId.substring(0, 6)}\`;
      
      try {
        const newPlayer = await createPlayer({
          playerId,
          displayName,
          coins: 0,
          permUpgrades: {},
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
        const newPlayer = await createPlayer({
          playerId,
          displayName: displayName || \`Player_\${playerId.substring(0, 6)}\`,
          coins: 0,
          permUpgrades: {},
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
        const updatedPlayer = await updatePlayer(playerId, updates);
        
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
  }
};`;

  fs.writeFileSync(path.join(__dirname, 'api/player-data.js'), playerDataApi);
  
  // leaderboard.js API route
  const leaderboardApi = `// API route for leaderboard
const { getNotionClient, extractPageIdFromUrl, findLeaderboardDatabase, getTopScores, addHighScore } = require('../api-lib/notion-helper');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Check if Notion is configured
  const notion = getNotionClient();
  if (!notion) {
    return res.status(503).json({ 
      success: false, 
      message: "Notion integration is not configured" 
    });
  }
  
  const pageId = extractPageIdFromUrl(process.env.NOTION_PAGE_URL);
  if (!pageId) {
    return res.status(503).json({ 
      success: false, 
      message: "Notion page ID could not be extracted from URL" 
    });
  }
  
  try {
    // Find the leaderboard database ID
    const leaderboardDbId = await findLeaderboardDatabase(notion, pageId);
    
    if (!leaderboardDbId) {
      return res.status(404).json({ 
        success: false, 
        message: "Leaderboard database not found in Notion" 
      });
    }
    
    // GET request - fetch leaderboard entries
    if (req.method === 'GET') {
      try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const scores = await getTopScores(notion, leaderboardDbId, limit);
        
        return res.status(200).json({ 
          success: true, 
          scores 
        });
      } catch (queryError) {
        console.error("Error querying leaderboard:", queryError);
        return res.status(500).json({
          success: false,
          message: "Failed to query leaderboard data"
        });
      }
    }
    
    // POST request - add a new leaderboard entry
    if (req.method === 'POST') {
      // Validate required fields
      const { playerName, score, waveReached } = req.body;
      
      if (!playerName || typeof score !== 'number' || typeof waveReached !== 'number') {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields: playerName, score, and waveReached" 
        });
      }
      
      // Add the score to Notion
      try {
        const result = await addHighScore(notion, leaderboardDbId, {
          playerName,
          score,
          waveReached,
          date: new Date()
        });
        
        return res.status(201).json({ 
          success: true, 
          message: "Score added to leaderboard successfully",
          scoreId: result.id 
        });
      } catch (createError) {
        console.error("Error adding score to Notion:", createError);
        return res.status(500).json({
          success: false,
          message: "Failed to add score to leaderboard"
        });
      }
    }
    
    // If we reach here, the method is not supported
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};`;

  fs.writeFileSync(path.join(__dirname, 'api/leaderboard.js'), leaderboardApi);
  
  // index.js API route
  const indexApi = `// Default API route
module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    version: "1.0.0",
    endpoints: [
      "/api/player-data - Player data management",
      "/api/leaderboard - Leaderboard management"
    ]
  });
};`;

  fs.writeFileSync(path.join(__dirname, 'api/index.js'), indexApi);
  
  // Creating a Prisma schema configuration
  console.log('🔧 Setting up Prisma schema...');

  // Add a prisma directory and schema
  const prismaDir = path.join(__dirname, 'prisma');
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }
  
  const prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model players {
  id          Int      @id @default(autoincrement())
  playerId    String   @unique
  displayName String
  coins       Int      @default(0)
  permUpgrades Json    @default("{}")
  lastSeen    DateTime @default(now()) @updatedAt
  createdAt   DateTime @default(now())
}`;

  fs.writeFileSync(path.join(prismaDir, 'schema.prisma'), prismaSchema);
  
  console.log('✅ Build process completed successfully!');
} catch (error) {
  console.error('❌ Build error:', error);
  process.exit(1);
}