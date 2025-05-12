// This is an ES Module build script for Vercel
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Vercel build process...');

try {
  // Run Vite build to generate static assets
  console.log('🔨 Building frontend with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Create necessary directories
  console.log('📁 Creating API directories...');
  
  // Ensure the API directory exists
  const apiDir = path.join(__dirname, 'api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  
  // Create a simple index.js that imports server.js
  const apiIndexPath = path.join(apiDir, 'index.js');
  if (!fs.existsSync(apiIndexPath)) {
    fs.writeFileSync(apiIndexPath, `
// Forward to the server implementation
module.exports = require('./server.js');
`);
    console.log('✅ Created API index.js');
  }
  
  console.log('🎉 Build process completed successfully!');
} catch (error) {
  console.error('❌ Build process failed:', error);
  process.exit(1);
}