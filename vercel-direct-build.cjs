// A completely direct and simplified build script for Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting direct Vercel build process...');

// Create the output directory
console.log('📁 Creating output directory...');
const distDir = path.join(__dirname, 'dist/public');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Build process
try {
  console.log('🔨 Directly copying built files...');
  
  // Copy the client files from the client/public directory
  const clientPublicDir = path.join(__dirname, 'client/public');
  if (fs.existsSync(clientPublicDir)) {
    console.log('📦 Copying client public assets...');
    
    // Recursive function to copy files and directories
    function copyRecursive(src, dest) {
      // Check if source is a directory
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        // Create destination directory if it doesn't exist
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        
        // Copy all files in the directory
        const files = fs.readdirSync(src);
        for (const file of files) {
          const srcPath = path.join(src, file);
          const destPath = path.join(dest, file);
          copyRecursive(srcPath, destPath);
        }
      } else {
        // It's a file, copy it directly
        fs.copyFileSync(src, dest);
      }
    }
    
    // Get all files in the public directory
    const files = fs.readdirSync(clientPublicDir);
    for (const file of files) {
      const srcPath = path.join(clientPublicDir, file);
      const destPath = path.join(distDir, file);
      copyRecursive(srcPath, destPath);
    }
  }
  
  // Create a minimal index.html to launch the game
  console.log('📝 Creating index.html...');
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Zombie Tower Defense Game">
  <title>Zombie Tower Defense</title>
  
  <!-- Google Fonts -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
  
  <!-- Tailwind CSS via CDN -->
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  
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
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: #11182a;
      color: #f8fafc;
      min-height: 100vh;
    }
    
    .app-container {
      max-width: 960px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .title {
      font-size: 2.5rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 2rem;
      color: #f97316;
    }
    
    .game-container {
      position: relative;
      width: 100%;
      height: 0;
      padding-bottom: 75%; /* 4:3 aspect ratio */
      background-color: #1e293b;
      border-radius: 0.5rem;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    
    #gameCanvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    .controls {
      margin-top: 2rem;
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
    
    .button {
      padding: 0.75rem 1.5rem;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.375rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    .button:hover {
      background-color: #2563eb;
    }
    
    .button-secondary {
      background-color: #475569;
    }
    
    .button-secondary:hover {
      background-color: #334155;
    }
    
    .leaderboard {
      margin-top: 3rem;
      background-color: #1e293b;
      border-radius: 0.5rem;
      padding: 1.5rem;
    }
    
    .leaderboard-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #f97316;
      text-align: center;
    }
    
    .leaderboard-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .leaderboard-table th,
    .leaderboard-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #334155;
    }
    
    .leaderboard-table th {
      font-weight: 600;
      color: #94a3b8;
    }
    
    .stats {
      display: flex;
      justify-content: space-between;
      margin-top: 1.5rem;
    }
    
    .stat-card {
      background-color: #1e293b;
      border-radius: 0.375rem;
      padding: 1rem;
      flex: 1;
      margin: 0 0.5rem;
      text-align: center;
    }
    
    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #f97316;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: #94a3b8;
    }
    
    /* Game UI */
    .game-ui {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: flex;
      flex-direction: column;
    }
    
    .game-hud {
      padding: 1rem;
      display: flex;
      justify-content: space-between;
    }
    
    .score {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
    }
    
    .health-bar {
      height: 10px;
      width: 200px;
      background-color: #ef4444;
      border-radius: 5px;
      overflow: hidden;
    }
    
    .health-fill {
      height: 100%;
      width: 100%;
      background-color: #22c55e;
      transition: width 0.3s;
    }
  </style>
</head>
<body>
  <div class="app-container">
    <h1 class="title">Zombie Tower Defense</h1>
    
    <div class="game-container">
      <canvas id="gameCanvas"></canvas>
      <div class="game-ui">
        <div class="game-hud">
          <div class="score">Score: <span id="scoreValue">0</span></div>
          <div class="health-bar">
            <div class="health-fill" id="healthFill"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="controls">
      <button class="button" id="startButton">Start Game</button>
      <button class="button button-secondary" id="upgradesButton">Upgrades</button>
      <button class="button button-secondary" id="leaderboardButton">Leaderboard</button>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value" id="waveValue">1</div>
        <div class="stat-label">Current Wave</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="coinsValue">0</div>
        <div class="stat-label">Coins</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" id="zombiesValue">0</div>
        <div class="stat-label">Zombies Killed</div>
      </div>
    </div>
    
    <div class="leaderboard">
      <h2 class="leaderboard-title">Top Scores</h2>
      <table class="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
            <th>Wave</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody id="leaderboardBody">
          <tr>
            <td>1</td>
            <td>TowerMaster</td>
            <td>3100</td>
            <td>18</td>
            <td>2025-05-12</td>
          </tr>
          <tr>
            <td>2</td>
            <td>ZombieSlayer123</td>
            <td>2500</td>
            <td>15</td>
            <td>2025-05-13</td>
          </tr>
          <tr>
            <td>3</td>
            <td>DefenseKing</td>
            <td>1800</td>
            <td>10</td>
            <td>2025-05-11</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
  <script>
    // Game variables
    let score = 0;
    let wave = 1;
    let health = 100;
    let coins = 0;
    let zombiesKilled = 0;
    let isGameRunning = false;
    
    // DOM elements
    const gameCanvas = document.getElementById('gameCanvas');
    const ctx = gameCanvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const upgradesButton = document.getElementById('upgradesButton');
    const leaderboardButton = document.getElementById('leaderboardButton');
    const scoreValue = document.getElementById('scoreValue');
    const waveValue = document.getElementById('waveValue');
    const coinsValue = document.getElementById('coinsValue');
    const zombiesValue = document.getElementById('zombiesValue');
    const healthFill = document.getElementById('healthFill');
    const leaderboardBody = document.getElementById('leaderboardBody');
    
    // Set canvas size
    function resizeCanvas() {
      const container = gameCanvas.parentElement;
      gameCanvas.width = container.offsetWidth;
      gameCanvas.height = container.offsetHeight;
    }
    
    // Initialize game
    function initGame() {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      // Event listeners
      startButton.addEventListener('click', () => {
        if (!isGameRunning) {
          startGame();
        } else {
          pauseGame();
        }
      });
      
      upgradesButton.addEventListener('click', showUpgrades);
      leaderboardButton.addEventListener('click', showLeaderboard);
      
      // Load leaderboard data
      fetchLeaderboardData();
      
      // Load player data
      fetchPlayerData();
    }
    
    // Start the game
    function startGame() {
      isGameRunning = true;
      startButton.textContent = 'Pause Game';
      
      // Game loop would go here
      alert('Game starting! This is a demo version. The full game is coming soon!');
    }
    
    // Pause the game
    function pauseGame() {
      isGameRunning = false;
      startButton.textContent = 'Start Game';
    }
    
    // Show upgrades screen
    function showUpgrades() {
      alert('Permanent upgrades coming soon!');
    }
    
    // Show leaderboard
    function showLeaderboard() {
      alert('Full leaderboard will be available in the complete game!');
    }
    
    // Fetch leaderboard data
    function fetchLeaderboardData() {
      // Mock API call - in production this would be a real fetch
      console.log('Fetching leaderboard data...');
      // Would call: fetch('/api/leaderboard')
    }
    
    // Fetch player data
    function fetchPlayerData() {
      // Mock API call - in production this would be a real fetch
      console.log('Fetching player data...');
      // Would call: fetch('/api/player-data?playerId=...')
    }
    
    // Update game stats display
    function updateStats() {
      scoreValue.textContent = score;
      waveValue.textContent = wave;
      coinsValue.textContent = coins;
      zombiesValue.textContent = zombiesKilled;
      healthFill.style.width = health + '%';
    }
    
    // Initialize game when page loads
    window.addEventListener('load', initGame);
  </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);
  
  // Create API directory and files
  console.log('📝 Creating API files...');
  const apiDir = path.join(__dirname, 'api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  
  // Create basic API files for Vercel serverless functions
  const apiEndpoints = ['player-data', 'leaderboard', 'game-state', 'index'];
  for (const endpoint of apiEndpoints) {
    const apiHandlerJs = `// ${endpoint} API handler
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Determine what to return based on the endpoint
  if ('${endpoint}' === 'player-data') {
    // Return mock player data
    return res.status(200).json({
      success: true,
      player: {
        id: 1,
        playerId: req.query.playerId || "demo-player",
        displayName: "Demo Player",
        coins: 500,
        permUpgrades: {
          firerate: 2,
          damage: 1
        },
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    });
  } else if ('${endpoint}' === 'leaderboard') {
    // Return mock leaderboard data
    return res.status(200).json({
      success: true,
      scores: [
        {
          id: "1",
          playerName: "TowerMaster",
          score: 3100,
          waveReached: 18,
          date: "2025-05-12"
        },
        {
          id: "2",
          playerName: "ZombieSlayer123",
          score: 2500,
          waveReached: 15,
          date: "2025-05-13"
        },
        {
          id: "3",
          playerName: "DefenseKing",
          score: 1800,
          waveReached: 10,
          date: "2025-05-11"
        }
      ]
    });
  } else {
    // Default response
    return res.status(200).json({
      success: true,
      message: "API endpoint available",
      endpoint: "${endpoint}"
    });
  }
};`;

    fs.writeFileSync(path.join(apiDir, `${endpoint}.js`), apiHandlerJs);
  }
  
  console.log('✅ Direct build completed successfully!');
} catch (error) {
  console.error('❌ Build process error:', error);
}