// This is a server adapter for Vercel serverless functions
// It will allow your game to run in a serverless environment

const fs = require('fs');
const path = require('path');

// Get static files from the dist directory
const getStaticFilePath = (pathname) => {
  return path.join(process.cwd(), 'dist', 'public', pathname);
};

// Handle API requests
const handleApiRequest = (req, res) => {
  const apiPath = req.url.replace(/^\/api/, '').split('?')[0];
  
  // Route to the appropriate API handler based on the path
  switch (apiPath) {
    case '/game-state':
      // Use the game state handler
      require('./game-state')(req, res);
      break;
    default:
      // Default API response
      const gameState = {
        status: 'running',
        version: '1.0.0',
        serverTime: new Date().toISOString(),
        message: 'API endpoint not found. Try /api/game-state'
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(JSON.stringify(gameState));
  }
};

// Handle static file requests
const handleStaticRequest = (req, res, pathname) => {
  try {
    // Get file extension to set correct content type
    const ext = path.extname(pathname).toLowerCase();
    
    // Map extensions to content types
    const contentTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.eot': 'application/vnd.ms-fontobject'
    };
    
    // Set the appropriate content type
    if (contentTypes[ext]) {
      res.setHeader('Content-Type', contentTypes[ext]);
    }
    
    // Read and serve the file
    const filePath = getStaticFilePath(pathname);
    const data = fs.readFileSync(filePath);
    res.status(200).send(data);
  } catch (error) {
    // If file not found, try serving index.html (for SPA routing)
    try {
      const indexPath = getStaticFilePath('index.html');
      const indexData = fs.readFileSync(indexPath);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(indexData);
    } catch (indexError) {
      // If index.html not found either, return 404
      res.status(404).send('Not found');
    }
  }
};

// Main serverless function handler
module.exports = (req, res) => {
  // Parse the URL to get the pathname
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  
  // Route based on path
  if (pathname.startsWith('/api/')) {
    // Handle API requests
    handleApiRequest(req, res);
  } else {
    // Handle static file requests
    handleStaticRequest(req, res, pathname);
  }
};