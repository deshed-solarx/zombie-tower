// Using ES Module syntax for Vercel
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Vercel build process with ES modules...');

// Create file indicating we're building with ES modules
fs.writeFileSync('esm-build-log.txt', `Build started at ${new Date().toISOString()}`);

try {
  // First, create a special config for client-side Vite build
  console.log('📝 Creating Vite config for static build...');
  const viteConfigContent = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
  },
  define: {
    'process.env.STATIC_BUILD': JSON.stringify('true'),
    'process.env.IS_VERCEL_DEPLOYMENT': JSON.stringify('true'),
  }
});
`;

  fs.writeFileSync('vite.config.vercel.js', viteConfigContent);
  
  // Create a special apiConfig.ts for the client to use in Vercel
  console.log('📝 Creating API config for Vercel...');
  if (!fs.existsSync('client/src/lib')) {
    fs.mkdirSync('client/src/lib', { recursive: true });
  }
  
  const apiConfigContent = `
export const API_CONFIG = {
  isVercelDeployment: true,
  API_BASE_URL: '/api',
  isStaticMode: true
};

export default API_CONFIG;
`;

  fs.writeFileSync('client/src/lib/apiConfig.ts', apiConfigContent);

  // Run the vite build
  console.log('🔨 Building client with Vite...');
  try {
    execSync('npx vite build --config vite.config.vercel.js', { stdio: 'inherit' });
    console.log('✅ Vite build completed successfully');
  } catch (buildError) {
    console.error('❌ Vite build failed:', buildError);
    throw buildError;
  }

  console.log('🎉 Build process completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  
  // Create a simple error page if the build fails
  const errorDir = path.join(__dirname, 'dist', 'public');
  if (!fs.existsSync(errorDir)) {
    fs.mkdirSync(errorDir, { recursive: true });
  }
  
  const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zombie Tower Defense - Build Error</title>
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
      padding: 20px;
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      color: #ff6b6b;
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
  <h1>Build Process Error</h1>
  <p>There was an error during the build process. Please check the deployment logs for details.</p>
  <p>API Status: <span id="apiStatus">Checking...</span></p>
  
  <script>
    fetch('/api/game-state')
      .then(response => response.json())
      .then(data => {
        document.getElementById('apiStatus').textContent = 'API Connected ✅';
      })
      .catch(error => {
        document.getElementById('apiStatus').textContent = 'API Error ❌';
      });
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(errorDir, 'index.html'), errorHtml);
  console.log('✅ Created error page');
  
  // Don't exit with error code, let Vercel handle it
}