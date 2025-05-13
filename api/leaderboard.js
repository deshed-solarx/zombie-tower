import { getTopScores, addHighScore, findDatabaseByTitle } from '../server/notion.js';

// Check if Notion credentials are available
const hasNotionCredentials = process.env.NOTION_INTEGRATION_SECRET && process.env.NOTION_PAGE_URL;

export default async function handler(req, res) {
  // Return early if Notion integration isn't configured
  if (!hasNotionCredentials) {
    return res.status(503).json({ 
      success: false, 
      message: "Notion integration is not configured. Please provide NOTION_INTEGRATION_SECRET and NOTION_PAGE_URL environment variables."
    });
  }

  try {
    // Find the leaderboard database in Notion
    const leaderboardDb = await findDatabaseByTitle("Zombie Defense Leaderboard");
    
    if (!leaderboardDb) {
      return res.status(404).json({ 
        success: false, 
        message: "Leaderboard database not found in Notion. Please run the setup-notion.ts script first."
      });
    }

    const leaderboardId = leaderboardDb.id;

    // Handle different HTTP methods
    if (req.method === 'GET') {
      // Get top scores from Notion
      const limit = parseInt(req.query.limit) || 10;
      const scores = await getTopScores(leaderboardId, limit);
      
      return res.status(200).json({ 
        success: true, 
        scores 
      });
    } 
    else if (req.method === 'POST') {
      // Add a new score to the leaderboard
      const { playerName, score, waveReached } = req.body;
      
      // Validate required fields
      if (!playerName || typeof score !== 'number' || typeof waveReached !== 'number') {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields: playerName, score, and waveReached"
        });
      }
      
      // Add the score to Notion
      const result = await addHighScore(leaderboardId, {
        playerName,
        score,
        waveReached,
        date: new Date()
      });
      
      if (result) {
        return res.status(201).json({ 
          success: true, 
          message: "Score added to leaderboard successfully",
          scoreId: result.id
        });
      } else {
        return res.status(500).json({ 
          success: false, 
          message: "Failed to add score to leaderboard"
        });
      }
    }
    else {
      // Method not supported
      return res.status(405).json({ 
        success: false, 
        message: `Method ${req.method} not allowed`
      });
    }
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "An error occurred while processing your request",
      error: error.message
    });
  }
}