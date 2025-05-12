// This file handles API requests for game state
// It's a simplified version of what would normally be in your Express server

// In-memory store for demo purposes - in a real app this would be a database
let gameState = {
  players: {},
  scores: {},
  highScores: []
};

// Handle GET requests for game state
const handleGetRequest = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: gameState,
    serverTime: new Date().toISOString()
  });
};

// Handle POST requests to update game state
const handlePostRequest = (req, res) => {
  try {
    // Parse the request body
    const body = JSON.parse(req.body);
    
    // Update the game state
    if (body.playerId && body.score) {
      // Update player score
      gameState.scores[body.playerId] = body.score;
      
      // Update high scores
      const highScores = Object.entries(gameState.scores)
        .map(([playerId, score]) => ({ playerId, score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      gameState.highScores = highScores;
    }
    
    res.status(200).json({
      status: 'success',
      data: gameState,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Main handler for the serverless function
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS requests (preflight for CORS)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Set content type to JSON
  res.setHeader('Content-Type', 'application/json');
  
  // Route based on HTTP method
  switch (req.method) {
    case 'GET':
      return handleGetRequest(req, res);
    case 'POST':
      return handlePostRequest(req, res);
    default:
      return res.status(405).json({
        status: 'error',
        message: `Method ${req.method} not allowed`
      });
  }
};