// Vercel serverless function for leaderboard API
// This connects to Notion API to store and retrieve leaderboard data

// Imports
const { Client } = require('@notionhq/client');

let notionClient = null;

// Initialize Notion client with proper error handling
function getNotionClient() {
  // Check if we already have a client
  if (notionClient) return notionClient;
  
  // Check if Notion credentials are available
  if (!process.env.NOTION_INTEGRATION_SECRET) {
    console.warn("NOTION_INTEGRATION_SECRET not found, Notion integration unavailable");
    return null;
  }
  
  try {
    notionClient = new Client({
      auth: process.env.NOTION_INTEGRATION_SECRET,
    });
    return notionClient;
  } catch (error) {
    console.error("Failed to initialize Notion client:", error);
    return null;
  }
}

// Extract page ID from Notion URL
function extractPageIdFromUrl(pageUrl) {
  if (!pageUrl) return "";
  
  try {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
      return match[1];
    }
  } catch (error) {
    console.error("Error extracting page ID:", error);
  }
  
  return "";
}

// Main API handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Check if Notion is configured
  const notion = getNotionClient();
  if (!notion) {
    return res.status(503).json({ 
      success: false, 
      message: "Notion integration is not configured" 
    });
  }
  
  const pageId = extractPageIdFromUrl(process.env.NOTION_PAGE_URL);
  if (!pageId) {
    return res.status(503).json({ 
      success: false, 
      message: "Notion page ID could not be extracted from URL" 
    });
  }
  
  try {
    // GET request - fetch leaderboard entries
    if (req.method === 'GET') {
      let leaderboardDbId = null;
      
      // Find the leaderboard database
      try {
        // Query all child blocks in the specified page
        const response = await notion.blocks.children.list({
          block_id: pageId,
        });

        // Look for a database with "Leaderboard" in the title
        for (const block of response.results) {
          if (block.type === "child_database") {
            const databaseId = block.id;
            
            // Check if this is the leaderboard database
            const dbInfo = await notion.databases.retrieve({
              database_id: databaseId,
            });
            
            // Check title for "leaderboard" (case insensitive)
            const dbTitle = dbInfo.title?.[0]?.plain_text || "";
            if (dbTitle.toLowerCase().includes("leaderboard")) {
              leaderboardDbId = databaseId;
              break;
            }
          }
        }
      } catch (dbError) {
        console.error("Error finding leaderboard database:", dbError);
      }
      
      if (!leaderboardDbId) {
        return res.status(404).json({ 
          success: false, 
          message: "Leaderboard database not found in Notion" 
        });
      }
      
      // Get top scores from the database
      try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        
        const response = await notion.databases.query({
          database_id: leaderboardDbId,
          sorts: [
            {
              property: "Score",
              direction: "descending"
            }
          ],
          page_size: limit
        });
        
        const scores = response.results.map(page => {
          const properties = page.properties;
          
          return {
            id: page.id,
            playerName: properties.PlayerName?.title?.[0]?.plain_text || "Unknown Player",
            score: properties.Score?.number || 0,
            waveReached: properties.WaveReached?.number || 0,
            date: properties.Date?.date?.start || null
          };
        });
        
        return res.status(200).json({ 
          success: true, 
          scores 
        });
      } catch (queryError) {
        console.error("Error querying leaderboard:", queryError);
        return res.status(500).json({
          success: false,
          message: "Failed to query leaderboard data"
        });
      }
    }
    
    // POST request - add a new leaderboard entry
    if (req.method === 'POST') {
      let leaderboardDbId = null;
      
      // Find the leaderboard database
      try {
        // Query all child blocks in the specified page
        const response = await notion.blocks.children.list({
          block_id: pageId,
        });

        // Look for a database with "Leaderboard" in the title
        for (const block of response.results) {
          if (block.type === "child_database") {
            const databaseId = block.id;
            
            // Check if this is the leaderboard database
            const dbInfo = await notion.databases.retrieve({
              database_id: databaseId,
            });
            
            // Check title for "leaderboard" (case insensitive)
            const dbTitle = dbInfo.title?.[0]?.plain_text || "";
            if (dbTitle.toLowerCase().includes("leaderboard")) {
              leaderboardDbId = databaseId;
              break;
            }
          }
        }
      } catch (dbError) {
        console.error("Error finding leaderboard database:", dbError);
      }
      
      if (!leaderboardDbId) {
        return res.status(404).json({ 
          success: false, 
          message: "Leaderboard database not found in Notion" 
        });
      }
      
      // Validate required fields
      const { playerName, score, waveReached } = req.body;
      
      if (!playerName || typeof score !== 'number' || typeof waveReached !== 'number') {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields: playerName, score, and waveReached" 
        });
      }
      
      // Add the score to Notion
      try {
        const result = await notion.pages.create({
          parent: {
            database_id: leaderboardDbId,
          },
          properties: {
            PlayerName: {
              title: [
                {
                  text: {
                    content: playerName
                  }
                }
              ]
            },
            Score: {
              number: score
            },
            WaveReached: {
              number: waveReached
            },
            Date: {
              date: {
                start: new Date().toISOString().split('T')[0]
              }
            }
          }
        });
        
        return res.status(201).json({ 
          success: true, 
          message: "Score added to leaderboard successfully",
          scoreId: result.id 
        });
      } catch (createError) {
        console.error("Error adding score to Notion:", createError);
        return res.status(500).json({
          success: false,
          message: "Failed to add score to leaderboard"
        });
      }
    }
    
    // If we reach here, the method is not supported
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
    
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};