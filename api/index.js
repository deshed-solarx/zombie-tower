// This file is a Vercel serverless function that will serve the frontend
// and proxy API requests to the Replit backend

// Define your API endpoint
const API_BACKEND = 'https://zombie-tower3.replit.app';
const fs = require('fs');
const path = require('path');

// Vercel serverless function
module.exports = (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  
  // If this is an API request, redirect to the Replit backend
  if (pathname.startsWith('/api/')) {
    const apiUrl = API_BACKEND + pathname;
    console.log(`Proxying API request to: ${apiUrl}`);
    
    // Redirect to the API endpoint
    res.setHeader('Location', apiUrl);
    res.status(302).end();
    return;
  }
  
  // Otherwise, try to serve a static file
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
    };
    
    // Set the appropriate content type
    if (contentTypes[ext]) {
      res.setHeader('Content-Type', contentTypes[ext]);
    }
    
    // Default to index.html
    const filePath = pathname === '/' 
      ? path.join(process.cwd(), 'dist', 'public', 'index.html')
      : path.join(process.cwd(), 'dist', 'public', pathname);
    
    // Read and serve the file
    const data = fs.readFileSync(filePath);
    res.status(200).send(data);
  } catch (error) {
    // If file not found, serve index.html (SPA fallback)
    try {
      const indexPath = path.join(process.cwd(), 'dist', 'public', 'index.html');
      const indexData = fs.readFileSync(indexPath);
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(indexData);
    } catch (indexError) {
      res.status(404).send('Page not found');
    }
  }
};