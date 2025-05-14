// A completely static build script for Vercel - no building, just static files
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting static Vercel build process...');

// Create the output directory
console.log('📁 Creating output directory...');
const distDir = path.join(__dirname, 'dist/public');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create a full static game HTML file
console.log('📝 Creating static index.html...');
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
      background-color: #0f172a;
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
      flex-wrap: wrap;
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
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    .stat-card {
      background-color: #1e293b;
      border-radius: 0.375rem;
      padding: 1rem;
      flex: 1;
      min-width: 120px;
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
    
    /* Tower */
    .tower {
      position: absolute;
      bottom: 10%;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 120px;
      background-color: #475569;
      border-radius: 8px 8px 0 0;
    }
    
    .tower-top {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 20px;
      background-color: #334155;
      border-radius: 4px;
    }
    
    .tower-window {
      position: absolute;
      width: 20px;
      height: 30px;
      background-color: #0f172a;
      border-radius: 4px;
    }
    
    .tower-window.left {
      top: 20px;
      left: 15px;
    }
    
    .tower-window.right {
      top: 20px;
      right: 15px;
    }
    
    .tower-door {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 30px;
      height: 40px;
      background-color: #0f172a;
      border-radius: 4px 4px 0 0;
    }
    
    /* Zombies */
    .zombie {
      position: absolute;
      width: 30px;
      height: 40px;
      background-color: #84cc16;
      border-radius: 5px;
      animation: move 20s linear forwards;
    }
    
    .zombie::before {
      content: "";
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 20px;
      background-color: #84cc16;
      border-radius: 10px;
    }
    
    .zombie::after {
      content: "";
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 5px;
      height: 5px;
      background-color: #ef4444;
      border-radius: 50%;
    }
    
    @keyframes move {
      0% { transform: translateX(-30px); }
      100% { transform: translateX(calc(100vw - 30px)); }
    }
    
    /* Bullets */
    .bullet {
      position: absolute;
      width: 10px;
      height: 10px;
      background-color: #facc15;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: shoot 1s linear forwards;
    }
    
    @keyframes shoot {
      0% { transform: translate(0, 0); }
      100% { transform: translate(var(--target-x), var(--target-y)); }
    }
    
    /* Responsive adjustments */
    @media (max-width: 640px) {
      .controls {
        flex-direction: column;
      }
      
      .stats {
        flex-direction: column;
      }
      
      .stat-card {
        margin: 0 0 1rem 0;
      }
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
      
      <!-- Tower -->
      <div class="tower">
        <div class="tower-top"></div>
        <div class="tower-window left"></div>
        <div class="tower-window right"></div>
        <div class="tower-door"></div>
      </div>
      
      <!-- Zombies will be added dynamically -->
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
    let zombies = [];
    let bullets = [];
    let lastZombieTime = 0;
    let zombieInterval = 2000; // 2 seconds between zombies
    
    // DOM elements
    const gameCanvas = document.getElementById('gameCanvas');
    const ctx = gameCanvas.getContext('2d');
    const gameContainer = document.querySelector('.game-container');
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
      const rect = container.getBoundingClientRect();
      gameCanvas.width = rect.width;
      gameCanvas.height = rect.height;
    }
    
    // Create a zombie
    function createZombie() {
      const zombieDiv = document.createElement('div');
      zombieDiv.className = 'zombie';
      
      // Random position on y-axis
      const y = Math.floor(Math.random() * 70) + 10; // 10% to 80% of the container height
      zombieDiv.style.bottom = y + '%';
      zombieDiv.style.left = '0';
      
      // Random speed
      const duration = (Math.random() * 10) + 15; // 15-25 seconds to cross the screen
      zombieDiv.style.animationDuration = duration + 's';
      
      gameContainer.appendChild(zombieDiv);
      
      // Store zombie info
      zombies.push({
        element: zombieDiv,
        health: 30,
        speed: 100 / duration, // percentage per second
        position: 0,
        bottom: y
      });
      
      // Remove zombie when animation ends
      zombieDiv.addEventListener('animationend', () => {
        // Zombie reached the tower, reduce health
        health -= 10;
        healthFill.style.width = health + '%';
        updateStats();
        
        // Check if game over
        if (health <= 0) {
          gameOver();
        }
        
        // Remove zombie
        gameContainer.removeChild(zombieDiv);
        zombies = zombies.filter(z => z.element !== zombieDiv);
      });
    }
    
    // Create a bullet
    function createBullet(targetZombie) {
      // Tower position is center bottom
      const towerX = gameContainer.offsetWidth / 2;
      const towerY = gameContainer.offsetHeight * 0.9; // 90% from top
      
      // Get zombie position
      const zombieRect = targetZombie.element.getBoundingClientRect();
      const containerRect = gameContainer.getBoundingClientRect();
      
      const zombieX = zombieRect.left + zombieRect.width / 2 - containerRect.left;
      const zombieY = zombieRect.top + zombieRect.height / 2 - containerRect.top;
      
      // Create bullet element
      const bulletDiv = document.createElement('div');
      bulletDiv.className = 'bullet';
      bulletDiv.style.left = towerX + 'px';
      bulletDiv.style.top = towerY + 'px';
      
      // Set animation target
      const targetX = zombieX - towerX;
      const targetY = zombieY - towerY;
      bulletDiv.style.setProperty('--target-x', targetX + 'px');
      bulletDiv.style.setProperty('--target-y', targetY + 'px');
      
      gameContainer.appendChild(bulletDiv);
      
      // Store bullet info
      bullets.push({
        element: bulletDiv,
        targetZombie: targetZombie
      });
      
      // Remove bullet when animation ends or when it hits zombie
      bulletDiv.addEventListener('animationend', () => {
        // Hit zombie
        targetZombie.health -= 10;
        
        // Check if zombie is killed
        if (targetZombie.health <= 0) {
          // Remove zombie
          gameContainer.removeChild(targetZombie.element);
          zombies = zombies.filter(z => z !== targetZombie);
          
          // Update score and coins
          score += 10;
          coins += 1;
          zombiesKilled += 1;
          updateStats();
          
          // Check if wave is complete
          if (zombies.length === 0 && zombiesKilled >= wave * 5) {
            nextWave();
          }
        }
        
        // Remove bullet
        gameContainer.removeChild(bulletDiv);
        bullets = bullets.filter(b => b.element !== bulletDiv);
      });
    }
    
    // Initialize game
    function initGame() {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      // Event listeners
      startButton.addEventListener('click', toggleGame);
      upgradesButton.addEventListener('click', showUpgrades);
      leaderboardButton.addEventListener('click', showLeaderboard);
      
      // Load player data
      fetchPlayerData();
      
      // Load leaderboard data
      fetchLeaderboardData();
      
      // Animation frame for game loop
      requestAnimationFrame(gameLoop);
    }
    
    // Game loop
    function gameLoop(timestamp) {
      if (isGameRunning) {
        // Spawn zombies
        if (timestamp - lastZombieTime > zombieInterval && zombies.length < wave * 5) {
          createZombie();
          lastZombieTime = timestamp;
        }
        
        // Auto-fire at the nearest zombie if there are zombies
        if (zombies.length > 0 && timestamp % 500 < 20) { // fire roughly every 500ms
          createBullet(zombies[0]); // Target first zombie
        }
      }
      
      requestAnimationFrame(gameLoop);
    }
    
    // Toggle game state
    function toggleGame() {
      isGameRunning = !isGameRunning;
      startButton.textContent = isGameRunning ? 'Pause Game' : 'Start Game';
      
      if (isGameRunning) {
        // Reset if health is 0
        if (health <= 0) {
          resetGame();
        }
      }
    }
    
    // Next wave
    function nextWave() {
      wave++;
      zombiesKilled = 0;
      zombieInterval = Math.max(500, 2000 - (wave * 100)); // Speed up spawning
      updateStats();
    }
    
    // Game over
    function gameOver() {
      isGameRunning = false;
      startButton.textContent = 'Restart Game';
      alert('Game Over! Your score: ' + score);
    }
    
    // Reset game
    function resetGame() {
      // Clear all zombies
      zombies.forEach(zombie => {
        gameContainer.removeChild(zombie.element);
      });
      
      // Clear all bullets
      bullets.forEach(bullet => {
        gameContainer.removeChild(bullet.element);
      });
      
      // Reset variables
      zombies = [];
      bullets = [];
      score = 0;
      wave = 1;
      health = 100;
      zombiesKilled = 0;
      updateStats();
    }
    
    // Show upgrades screen
    function showUpgrades() {
      alert('You have ' + coins + ' coins to spend on upgrades!');
    }
    
    // Show leaderboard
    function showLeaderboard() {
      alert('Leaderboard is being loaded...');
    }
    
    // Fetch player data from API
    function fetchPlayerData() {
      const playerId = getPlayerId();
      
      fetch('/api/player-data?playerId=' + playerId)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.player) {
            coins = data.player.coins || 0;
            updateStats();
          }
        })
        .catch(error => {
          console.error('Error fetching player data:', error);
        });
    }
    
    // Fetch leaderboard data from API
    function fetchLeaderboardData() {
      fetch('/api/leaderboard')
        .then(response => response.json())
        .then(data => {
          if (data.success && data.scores) {
            updateLeaderboard(data.scores);
          }
        })
        .catch(error => {
          console.error('Error fetching leaderboard data:', error);
        });
    }
    
    // Update leaderboard display
    function updateLeaderboard(scores) {
      // Clear existing entries
      leaderboardBody.innerHTML = '';
      
      // Add new entries
      scores.forEach((score, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = \`
          <td>\${index + 1}</td>
          <td>\${score.playerName}</td>
          <td>\${score.score}</td>
          <td>\${score.waveReached}</td>
          <td>\${score.date || 'N/A'}</td>
        \`;
        
        leaderboardBody.appendChild(row);
      });
    }
    
    // Get player ID from cookie or create new one
    function getPlayerId() {
      let playerId = getCookie('playerId');
      
      if (!playerId) {
        playerId = generateUUID();
        setCookie('playerId', playerId, 365); // 1 year expiry
      }
      
      return playerId;
    }
    
    // Generate UUID
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    // Get cookie
    function getCookie(name) {
      const value = '; ' + document.cookie;
      const parts = value.split('; ' + name + '=');
      if (parts.length === 2) return parts.pop().split(';').shift();
    }
    
    // Set cookie
    function setCookie(name, value, days) {
      let expires = '';
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
      }
      document.cookie = name + '=' + (value || '') + expires + '; path=/';
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

console.log('✅ Static build completed successfully!');