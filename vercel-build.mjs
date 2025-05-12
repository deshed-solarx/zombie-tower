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
  // First set up environment variables for the build
  console.log('⚙️ Setting up environment variables...');
  execSync('node vercel.env.mjs', { stdio: 'inherit' });
  
  // Run the vite build directly with environment variables
  console.log('🔨 Building client with Vite...');
  execSync('npx vite build --mode production', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_IS_VERCEL: 'true',
      VITE_STATIC_MODE: 'true'
    }
  });
  console.log('✅ Vite build completed successfully');
  
  // Create the output directory
  console.log('📂 Setting up output directories...');
  if (!fs.existsSync('dist/public')) {
    fs.mkdirSync('dist/public', { recursive: true });
  }
  
  // Copy everything from dist to dist/public for Vercel's expected structure
  console.log('📑 Copying build output to final location...');
  execSync('cp -r dist/* dist/public/', { stdio: 'inherit' });
  console.log('✅ Files copied successfully');

  console.log('🎉 Build process completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  
  // Create a fallback directory and file if build failed
  if (!fs.existsSync('dist/public')) {
    fs.mkdirSync('dist/public', { recursive: true });
  }
  
  // Write a simple error page showing build failed
  const errorContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Build Error</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    pre { background: #f6f8fa; padding: 16px; overflow: auto; border-radius: 6px; }
    .error { color: red; }
  </style>
</head>
<body>
  <h1>Build Error</h1>
  <p>There was an error during the build process. Please check the Vercel logs for details.</p>
  <div class="error"><pre>${error.toString()}</pre></div>
</body>
</html>`;
  
  fs.writeFileSync('dist/public/index.html', errorContent);
  
  process.exit(1);
}