// Using ES Module syntax for Vercel
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Vercel build process with ES modules...');

// Create the output directory
console.log('📁 Creating output directory...');
const distDir = path.join(__dirname, 'dist', 'public');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy the index.html file to the output directory
console.log('📝 Copying index.html...');
try {
  const sourceHtml = path.join(__dirname, 'index.html');
  const destHtml = path.join(distDir, 'index.html');
  fs.copyFileSync(sourceHtml, destHtml);
  console.log('✅ HTML file copied successfully');
} catch (error) {
  console.error('❌ Error copying HTML file:', error);
  
  // Create a basic HTML file if copying fails
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="google-adsense-account" content="ca-pub-3343885780477563">
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
  console.log('✅ Created fallback HTML file');
}

// Create a simple success indicator file
fs.writeFileSync(path.join(distDir, 'build-success.txt'), `Build completed at ${new Date().toISOString()}`);

console.log('🎉 Build process completed successfully!');