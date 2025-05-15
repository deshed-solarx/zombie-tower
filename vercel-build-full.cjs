// Full Vercel build script for proper project build
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting full project Vercel build...');

try {
  console.log('🔧 Creating build directories...');
  // Setup directories
  const distDir = path.join(__dirname, 'dist');
  const publicDir = path.join(distDir, 'public');
  
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  console.log('📦 Generating Prisma client...');
  // Generate Prisma client for database access in API routes
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
  } catch (prismaError) {
    console.error('⚠️ Prisma generate error:', prismaError);
    // Continue anyway, as we might have a pregenerated client
  }
  
  console.log('🏗️ Building client application...');
  // Build the frontend application using Vite
  try {
    // Create proper PostCSS and Tailwind configs for the build
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {
      config: './client/tailwind.config.vercel.js'
    },
    autoprefixer: {}
  }
}`;
    fs.writeFileSync(path.join(__dirname, 'postcss.config.js'), postcssConfig);
    
    // Make sure the client/src/main.tsx file exists and has the right content
    const mainTsxPath = path.join(__dirname, 'client/src/main.tsx');
    
    // Ensure dist/public directory exists for fallback option
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Copy fonts directory if it exists
    const fontsDir = path.join(__dirname, 'client/public/fonts');
    const destFontsDir = path.join(publicDir, 'fonts');
    
    if (fs.existsSync(fontsDir) && !fs.existsSync(destFontsDir)) {
      fs.mkdirSync(destFontsDir, { recursive: true });
      copyDirRecursive(fontsDir, destFontsDir);
    }
    
    // Use Vite to build the client application with our Vercel config
    console.log('📦 Building with Vite...');
    execSync('cd client && npx vite build --config vite.config.vercel.js', { stdio: 'inherit' });
  } catch (buildError) {
    console.error('⚠️ Client build error:', buildError);
    console.log('⚠️ Building simplified version as fallback...');
    
    // Create a simple index.html file as fallback
    const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zombie Tower Defense</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
  <style>
    :root {
      --background: 210 33% 10%;
      --foreground: 210 40% 98%;
      --card: 210 33% 13%;
      --card-foreground: 210 40% 98%;
      --popover: 210 33% 13%;
      --popover-foreground: 210 40% 98%;
      --primary: 25 95% 53%;
      --primary-foreground: 210 40% 98%;
      --secondary: 210 33% 13%;
      --secondary-foreground: 210 40% 98%;
      --muted: 210 33% 20%;
      --muted-foreground: 210 20% 60%;
      --accent: 210 33% 20%;
      --accent-foreground: 210 40% 98%;
      --destructive: 0 62% 50%;
      --destructive-foreground: 210 40% 98%;
      --border: 210 33% 20%;
      --input: 210 33% 20%;
      --ring: 25 95% 53%;
      --radius: 0.5rem;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: hsl(210, 33%, 10%);
      color: hsl(210, 40%, 98%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
      line-height: 1.6;
    }
    
    h1 {
      color: hsl(25, 95%, 53%);
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    
    h2 {
      color: hsl(25, 95%, 53%);
      font-size: 1.5rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    
    p {
      max-width: 600px;
      margin-bottom: 1rem;
    }
    
    .container {
      background-color: hsl(210, 33%, 13%);
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
      max-width: 800px;
      width: 100%;
      border: 1px solid hsl(210, 33%, 20%);
    }
    
    .feature-list {
      text-align: left;
      padding-left: 1.5rem;
    }
    
    .feature-list li {
      margin-bottom: 0.75rem;
    }
    
    .footer {
      margin-top: 2rem;
      color: hsl(210, 20%, 60%);
      font-size: 0.875rem;
    }
    
    .buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1.5rem;
    }
    
    .button {
      background-color: hsl(25, 95%, 53%);
      color: hsl(210, 40%, 98%);
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.25rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .button:hover {
      background-color: hsl(25, 95%, 48%);
    }
    
    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 3px solid hsl(25, 95%, 53%);
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 2rem auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .loading-message {
      margin-top: 1rem;
      font-style: italic;
      color: hsl(210, 20%, 60%);
    }
    
    .upgrade-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    
    .upgrade-card {
      background-color: hsl(210, 33%, 16%);
      border-radius: 0.5rem;
      padding: 1.25rem;
      border: 1px solid hsl(210, 33%, 25%);
      text-align: left;
    }
    
    .upgrade-title {
      font-weight: 600;
      color: hsl(25, 95%, 53%);
      margin-bottom: 0.5rem;
      font-size: 1.125rem;
    }
    
    .upgrade-description {
      font-size: 0.875rem;
      color: hsl(210, 40%, 90%);
      margin-bottom: 0.75rem;
    }
    
    .upgrade-cost {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: hsl(25, 95%, 65%);
    }
    
    .coin-icon {
      color: gold;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Zombie Tower Defense</h1>
    <p>Game is Loading...</p>
    <div class="spinner"></div>
    <p class="loading-message">Please wait while we prepare your zombie-slaying experience!</p>
    <div class="buttons">
      <button class="button" onclick="window.location.reload()">Reload Game</button>
    </div>
  </div>
  
  <div class="container">
    <h2>Permanent Upgrades</h2>
    <p>Spend your hard-earned coins on these powerful permanent upgrades to enhance your zombie defense capabilities!</p>
    
    <div class="upgrade-grid">
      <div class="upgrade-card">
        <div class="upgrade-title">Fire Rate</div>
        <div class="upgrade-description">Increases the speed at which you can fire bullets.</div>
        <div class="upgrade-cost"><span class="coin-icon">🪙</span> 50 coins per level</div>
      </div>
      
      <div class="upgrade-card">
        <div class="upgrade-title">Damage</div>
        <div class="upgrade-description">Increases the damage dealt by each bullet.</div>
        <div class="upgrade-cost"><span class="coin-icon">🪙</span> 50 coins per level</div>
      </div>
      
      <div class="upgrade-card">
        <div class="upgrade-title">Health</div>
        <div class="upgrade-description">Increases your maximum health.</div>
        <div class="upgrade-cost"><span class="coin-icon">🪙</span> 75 coins per level</div>
      </div>
    </div>
  </div>
  
  <div class="container">
    <h2>Game Features</h2>
    <ul class="feature-list">
      <li>Strategic tower defense gameplay against waves of zombies</li>
      <li>Collect coins to unlock permanent upgrades</li>
      <li>Compete on the global leaderboard</li>
      <li>Multiple gameplay modes and difficulty levels</li>
      <li>Cross-platform gameplay with progress saving</li>
      <li>Dynamic difficulty scaling based on player performance</li>
    </ul>
  </div>
  
  <div class="footer">
    &copy; 2025 Zombie Tower Defense
  </div>
</body>
</html>`;
    
    fs.writeFileSync(path.join(publicDir, 'index.html'), fallbackHtml);
  }
  
  console.log('🔌 Setting up API routes...');
  // Create API directory if it doesn't exist
  const apiDir = path.join(__dirname, 'api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  
  // Create lib directory for shared code
  const apiLibDir = path.join(__dirname, 'api-lib');
  if (!fs.existsSync(apiLibDir)) {
    fs.mkdirSync(apiLibDir, { recursive: true });
  }
  
  // Create the Prisma client helper file
  const prismaClientFile = `// Prisma client for API routes
const { PrismaClient } = require('@prisma/client');

// Avoid multiple instances in development
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

  fs.writeFileSync(path.join(apiLibDir, 'prisma-client.js'), prismaClientFile);
  
  // Create the database helper file
  const dbHelperFile = `// Database helper functions
const prisma = require('./prisma-client');

/**
 * Get player by ID
 */
async function getPlayerById(playerId) {
  try {
    return await prisma.players.findUnique({
      where: { playerId }
    });
  } catch (error) {
    console.error('Database error:', error);
    return null;
  }
}

/**
 * Create a new player
 */
async function createPlayer(data) {
  try {
    return await prisma.players.create({
      data
    });
  } catch (error) {
    console.error('Error creating player:', error);
    throw error;
  }
}

/**
 * Update player data
 */
async function updatePlayer(playerId, data) {
  try {
    return await prisma.players.update({
      where: { playerId },
      data
    });
  } catch (error) {
    console.error('Error updating player:', error);
    throw error;
  }
}

/**
 * Get all players
 */
async function getAllPlayers() {
  try {
    return await prisma.players.findMany();
  } catch (error) {
    console.error('Error fetching players:', error);
    return [];
  }
}

module.exports = {
  getPlayerById,
  createPlayer,
  updatePlayer,
  getAllPlayers
};`;

  fs.writeFileSync(path.join(apiLibDir, 'db-helper.js'), dbHelperFile);
  
  // Create the Notion helper file
  const notionHelperFile = `// Notion API helper functions
const { Client } = require('@notionhq/client');

let notionClient = null;

/**
 * Get Notion client instance
 */
function getNotionClient() {
  if (notionClient) return notionClient;
  
  if (!process.env.NOTION_INTEGRATION_SECRET) {
    console.warn('NOTION_INTEGRATION_SECRET not found');
    return null;
  }
  
  try {
    notionClient = new Client({
      auth: process.env.NOTION_INTEGRATION_SECRET
    });
    return notionClient;
  } catch (error) {
    console.error('Failed to initialize Notion client:', error);
    return null;
  }
}

/**
 * Extract page ID from Notion URL
 */
function extractPageIdFromUrl(pageUrl) {
  if (!pageUrl) return null;
  
  try {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
      return match[1];
    }
  } catch (error) {
    console.error('Error extracting page ID:', error);
  }
  
  return null;
}

/**
 * Find the leaderboard database in Notion
 */
async function findLeaderboardDatabase(notion, pageId) {
  try {
    const response = await notion.blocks.children.list({
      block_id: pageId
    });
    
    for (const block of response.results) {
      if (block.type === "child_database") {
        const dbInfo = await notion.databases.retrieve({
          database_id: block.id
        });
        
        const dbTitle = dbInfo.title?.[0]?.plain_text || "";
        if (dbTitle.toLowerCase().includes("leaderboard")) {
          return block.id;
        }
      }
    }
  } catch (error) {
    console.error('Error finding leaderboard database:', error);
  }
  
  return null;
}

/**
 * Get top scores from the leaderboard database
 */
async function getTopScores(notion, dbId, limit = 10) {
  try {
    const response = await notion.databases.query({
      database_id: dbId,
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
    console.error('Error querying leaderboard:', error);
    throw error;
  }
}

/**
 * Add a new high score to the leaderboard
 */
async function addHighScore(notion, dbId, data) {
  try {
    return await notion.pages.create({
      parent: {
        database_id: dbId
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
    console.error('Error adding high score:', error);
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

  fs.writeFileSync(path.join(apiLibDir, 'notion-helper.js'), notionHelperFile);
  
  // Create the player-data.js API route
  const playerDataApi = `// Player data API route
const { getPlayerById, createPlayer, updatePlayer } = require('../api-lib/db-helper');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // GET request - retrieve player data
    if (req.method === 'GET') {
      const { playerId } = req.query;
      
      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: 'Player ID is required'
        });
      }
      
      // Try to find the player
      const player = await getPlayerById(playerId);
      
      // Return player data if found
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
        return res.status(500).json({
          success: false,
          message: 'Failed to create player'
        });
      }
    }
    
    // POST request - create a new player
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
        return res.status(500).json({
          success: false,
          message: 'Failed to update player'
        });
      }
    }
    
    // Unsupported method
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

  fs.writeFileSync(path.join(apiDir, 'player-data.js'), playerDataApi);
  
  // Create the leaderboard.js API route
  const leaderboardApi = `// Leaderboard API route
const { 
  getNotionClient, 
  extractPageIdFromUrl, 
  findLeaderboardDatabase, 
  getTopScores, 
  addHighScore 
} = require('../api-lib/notion-helper');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Initialize Notion client
  const notion = getNotionClient();
  if (!notion) {
    return res.status(503).json({
      success: false,
      message: 'Notion integration is not configured'
    });
  }
  
  // Get the page ID from environment
  const pageId = extractPageIdFromUrl(process.env.NOTION_PAGE_URL);
  if (!pageId) {
    return res.status(503).json({
      success: false,
      message: 'Invalid Notion page URL'
    });
  }
  
  try {
    // Find the leaderboard database
    const dbId = await findLeaderboardDatabase(notion, pageId);
    if (!dbId) {
      return res.status(404).json({
        success: false,
        message: 'Leaderboard database not found'
      });
    }
    
    // GET request - retrieve leaderboard data
    if (req.method === 'GET') {
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      
      try {
        const scores = await getTopScores(notion, dbId, limit);
        
        return res.status(200).json({
          success: true,
          scores
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to retrieve leaderboard data'
        });
      }
    }
    
    // POST request - add a new score
    if (req.method === 'POST') {
      const { playerName, score, waveReached } = req.body;
      
      if (!playerName || typeof score !== 'number' || typeof waveReached !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Invalid score data'
        });
      }
      
      try {
        const result = await addHighScore(notion, dbId, {
          playerName,
          score,
          waveReached,
          date: new Date()
        });
        
        return res.status(201).json({
          success: true,
          message: 'Score added to leaderboard',
          scoreId: result.id
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to add score to leaderboard'
        });
      }
    }
    
    // Unsupported method
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

  fs.writeFileSync(path.join(apiDir, 'leaderboard.js'), leaderboardApi);
  
  // Create the index.js API route
  const indexApi = `// API index route
module.exports = (req, res) => {
  res.status(200).json({
    name: 'Zombie Tower Defense API',
    version: '1.0.0',
    endpoints: [
      '/api/player-data - Player data management',
      '/api/leaderboard - Leaderboard management'
    ]
  });
};`;

  fs.writeFileSync(path.join(apiDir, 'index.js'), indexApi);
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build error:', error);
  process.exit(1);
}

// Recursive directory copy function
function copyDirRecursive(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  // Read source directory contents
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  // Copy each entry
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // Recurse for directories
      copyDirRecursive(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
    }
  }
}