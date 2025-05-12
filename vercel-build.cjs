// This is a CommonJS build script for Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel build process...');

// Create the output directory
console.log('📁 Creating output directory...');
const distDir = path.join(__dirname, 'dist', 'public');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create a simple HTML file for testing
console.log('📝 Creating HTML file...');
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zombie Tower Defense</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #333;
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      color: #4caf50;
    }
    
    p {
      max-width: 600px;
      text-align: center;
      margin-bottom: 20px;
      line-height: 1.6;
    }
    
    button {
      background-color: #4caf50;
      border: none;
      color: white;
      padding: 15px 32px;
      text-align: center;
      text-decoration: none;
      display: inline-block;
      font-size: 16px;
      margin: 4px 2px;
      cursor: pointer;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>Zombie Tower Defense</h1>
  <p>Welcome to Zombie Tower Defense! The game is being served from Vercel's serverless environment.</p>
  <button id="startGameBtn">Start Game</button>
  <p>API Status: <span id="apiStatus">Checking...</span></p>
  
  <script>
    // Check API status
    fetch('/api/game-state')
      .then(response => response.json())
      .then(data => {
        document.getElementById('apiStatus').textContent = 'Connected ✅';
        console.log('API response:', data);
      })
      .catch(error => {
        document.getElementById('apiStatus').textContent = 'Error ❌';
        console.error('API error:', error);
      });
    
    // Start game button
    document.getElementById('startGameBtn').addEventListener('click', () => {
      alert('Game functionality will be integrated here.');
    });
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);

// Run the Vite build (if needed)
// Commenting out for now until your frontend is properly set up
// try {
//   console.log('🔨 Building frontend with Vite...');
//   execSync('npx vite build', { stdio: 'inherit' });
// } catch (error) {
//   console.error('❌ Vite build failed:', error);
//   // Continue anyway to create our temporary placeholder
// }

// Ensure the API directory exists
console.log('📁 Creating API directories...');
const apiDir = path.join(__dirname, 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Create simple index.js in API directory if it doesn't exist
const apiIndexPath = path.join(apiDir, 'index.js');
if (!fs.existsSync(apiIndexPath)) {
  const apiCode = `// API index handler
module.exports = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running!',
    timestamp: new Date().toISOString()
  });
};`;
  
  fs.writeFileSync(apiIndexPath, apiCode);
  console.log('✅ Created API index.js');
}

// Create a game state handler if needed
const gameStatePath = path.join(apiDir, 'game-state.js');
if (!fs.existsSync(gameStatePath)) {
  const gameStateCode = `// Game state handler
module.exports = (req, res) => {
  res.status(200).json({
    status: 'success',
    gameState: 'initialized',
    serverTime: new Date().toISOString()
  });
};`;
  
  fs.writeFileSync(gameStatePath, gameStateCode);
  console.log('✅ Created game-state.js');
}

console.log('🎉 Build process completed successfully!');