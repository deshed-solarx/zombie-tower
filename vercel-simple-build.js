// A simplified ESM build script for Vercel that avoids module compatibility issues
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting simplified Vercel build process...');

// Create the output directory
console.log('📁 Creating output directory...');
const distDir = path.join(__dirname, 'dist/public');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create a simple index.html
console.log('📝 Creating simple index.html...');
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zombie Tower Defense</title>
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <style>
    body { background-color: #111; color: #fff; font-family: sans-serif; }
    .app-container { max-width: 800px; margin: 0 auto; padding: 2rem; }
    .game-title { font-size: 2.5rem; text-align: center; margin-bottom: 2rem; color: #5cdb95; }
    .button { 
      display: block; width: 100%; padding: 1rem; margin: 1rem 0;
      background-color: #3500d3; color: white; border: none;
      border-radius: 0.5rem; font-size: 1.2rem; cursor: pointer;
      transition: background-color 0.3s;
    }
    .button:hover { background-color: #240090; }
    .info-text { font-size: 1rem; color: #ccc; text-align: center; margin-top: 2rem; }
    .zombie { font-size: 3rem; margin: 2rem 0; text-align: center; animation: float 3s ease-in-out infinite; }
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
      100% { transform: translateY(0px); }
    }
  </style>
</head>
<body class="bg-gray-900 text-white">
  <div class="app-container">
    <h1 class="game-title">Zombie Tower Defense</h1>
    <div class="zombie">🧟</div>
    <p class="text-center mb-8">
      This static page is the simplified Vercel deployment. For the full game experience:
    </p>
    <a href="https://replit.com/@V01dNullified/Tower3" class="button">
      Play on Replit
    </a>
    <div class="mt-8 p-4 bg-gray-800 rounded-lg">
      <h2 class="text-xl mb-2">Game Features:</h2>
      <ul class="list-disc pl-5 space-y-1">
        <li>Defend your tower against waves of zombies</li>
        <li>Collect coins to purchase permanent upgrades</li>
        <li>Compete on the global leaderboard</li>
        <li>Unlock powerful weapons and abilities</li>
      </ul>
    </div>
    <div class="info-text">
      <p>© 2025 Tower Defense Game</p>
    </div>
  </div>
</body>
</html>`;

// Write index.html to the output directory
fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);

// Create API directory and files
console.log('📝 Creating API files...');
const apiDir = path.join(__dirname, 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Create index.js in API directory
const apiIndexJs = `// Simple API route
module.exports = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is available in the Replit version only',
    replit_url: 'https://replit.com/@V01dNullified/Tower3'
  });
};`;

fs.writeFileSync(path.join(apiDir, 'index.js'), apiIndexJs);

// Create a simple API handler for each needed endpoint
const apiEndpoints = ['player-data', 'leaderboard', 'game-state'];
for (const endpoint of apiEndpoints) {
  const apiHandlerJs = `// ${endpoint} API handler
module.exports = (req, res) => {
  res.status(200).json({
    status: 'redirect',
    message: 'This API is only available in the full Replit version',
    replit_url: 'https://replit.com/@V01dNullified/Tower3'
  });
};`;

  fs.writeFileSync(path.join(apiDir, `${endpoint}.js`), apiHandlerJs);
}

console.log('✅ Simplified build completed successfully!');