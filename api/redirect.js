// API route to handle API requests and redirect to the game

export default function handler(req, res) {
  const isRoot = req.url === '/' || req.url === '';
  
  if (isRoot) {
    // Redirect to the static index.html
    res.setHeader('Location', '/index.html');
    res.status(302).end();
    return;
  }
  
  // Serve API response for any other API routes
  res.status(200).json({
    status: 'success',
    message: 'Game API endpoint',
    isVercel: true,
    serverTime: new Date().toISOString()
  });
}