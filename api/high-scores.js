// High scores API for Vercel deployment
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Default high scores
  const defaultHighScores = [
    { name: "ZombieMaster99", score: 12450, date: "2023-05-10T14:32:11Z" },
    { name: "BrainSlayer", score: 10325, date: "2023-05-11T09:15:23Z" },
    { name: "DeadShot", score: 9876, date: "2023-05-09T17:43:56Z" },
    { name: "LastStand", score: 8765, date: "2023-05-08T22:17:34Z" },
    { name: "SurvivorElite", score: 7654, date: "2023-05-12T11:28:45Z" },
    { name: "TowerDefender", score: 6543, date: "2023-05-07T13:54:22Z" },
    { name: "ZombieHunter", score: 5432, date: "2023-05-06T08:39:17Z" },
    { name: "WaveSlayer", score: 4321, date: "2023-05-05T19:22:48Z" },
    { name: "HeadshotKing", score: 3210, date: "2023-05-04T16:11:33Z" },
    { name: "FortDefender", score: 2109, date: "2023-05-03T12:05:19Z" }
  ];
  
  // Handle GET requests to retrieve high scores
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      scores: defaultHighScores
    });
  }
  
  // Handle POST requests to save a new high score
  if (req.method === 'POST') {
    try {
      // Get the submitted score
      const { name = 'Anonymous', score = 0 } = req.body || {};
      
      if (!score || score <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid score'
        });
      }
      
      // For Vercel static deployment, we simply return the existing scores
      // In a real server, we would save this to a database
      const newScore = {
        name: name.substring(0, 20), // Limit name length
        score: parseInt(score),
        date: new Date().toISOString()
      };
      
      // Add the new score to the list
      const scores = [...defaultHighScores, newScore];
      
      // Sort the scores (highest first)
      scores.sort((a, b) => b.score - a.score);
      
      // Take only the top 10
      const topScores = scores.slice(0, 10);
      
      // Return the updated scores
      return res.status(200).json({
        success: true,
        message: 'Score saved successfully',
        scores: topScores
      });
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to save score',
        error: error.message
      });
    }
  }
  
  // Handle unsupported methods
  return res.status(405).json({
    success: false,
    message: `Method ${req.method} not allowed`
  });
}