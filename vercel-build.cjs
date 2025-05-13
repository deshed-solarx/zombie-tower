// This is a CommonJS build script for Vercel
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel build process...');

// Create the output directory
console.log('📁 Creating output directory...');
const distDir = path.join(__dirname, 'client/dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy the vercel-specific files
console.log('📝 Configuring Vercel-specific files...');
fs.copyFileSync(
  path.join(__dirname, 'client/index.vercel.html'),
  path.join(__dirname, 'client/index.html')
);

fs.copyFileSync(
  path.join(__dirname, 'client/postcss.config.vercel.cjs'),
  path.join(__dirname, 'client/postcss.config.cjs')
);

fs.copyFileSync(
  path.join(__dirname, 'client/vite.config.vercel.cjs'),
  path.join(__dirname, 'client/vite.config.cjs')
);

fs.copyFileSync(
  path.join(__dirname, 'client/src/main.vercel.tsx'),
  path.join(__dirname, 'client/src/main.tsx')
);

// Create Tailwind styles directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'client/src/styles'))) {
  fs.mkdirSync(path.join(__dirname, 'client/src/styles'), { recursive: true });
}

// Copy the direct Tailwind config
fs.copyFileSync(
  path.join(__dirname, 'client/tailwind.config.vercel.cjs'),
  path.join(__dirname, 'client/tailwind.config.cjs')
);

// Run Tailwind CSS build directly
console.log('🎨 Building Tailwind CSS...');
try {
  process.chdir(path.join(__dirname, 'client'));
  execSync('npx tailwindcss -i ./src/index.css -o ./src/styles/main.css', { stdio: 'inherit' });
  console.log('✅ Tailwind CSS built successfully');
} catch (error) {
  console.error('❌ Tailwind CSS build failed:', error);
  // Continue anyway as we have the CDN fallback
}

// Run the proper Vite build
console.log('🔨 Building frontend with Vite...');
try {
  // Already in client directory
  execSync('npm install', { stdio: 'inherit' });
  execSync('npm run build:vercel', { stdio: 'inherit' });
  console.log('✅ Vite build completed successfully');
} catch (error) {
  console.error('❌ Vite build failed:', error);
  process.exit(1);
}

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