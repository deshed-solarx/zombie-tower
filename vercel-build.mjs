// Using ES Module syntax for Vercel
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Vercel build process with ES modules...');

try {
  // Run the vite build directly
  console.log('🔨 Building client with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✅ Vite build completed successfully');
  
  // Copy the built files to dist/public for Vercel
  console.log('📂 Copying built files to dist/public...');
  if (!fs.existsSync('dist/public')) {
    fs.mkdirSync('dist/public', { recursive: true });
  }
  
  // Copy everything from dist to dist/public
  execSync('cp -r dist/* dist/public/', { stdio: 'inherit' });
  console.log('✅ Files copied successfully');

  console.log('🎉 Build process completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}