import { Client } from "@notionhq/client";

// Initialize Notion client with proper error handling for different environments
const getNotionClient = () => {
    // Check if we're in an environment where Notion secrets are available
    if (!process.env.NOTION_INTEGRATION_SECRET) {
        console.warn("NOTION_INTEGRATION_SECRET not found, Notion integration will be unavailable");
        return null;
    }
    
    try {
        return new Client({
            auth: process.env.NOTION_INTEGRATION_SECRET,
        });
    } catch (error) {
        console.error("Failed to initialize Notion client:", error);
        return null;
    }
};

export const notion = getNotionClient() || new Client({ auth: 'dummy-for-type-safety' });

// Extract the page ID from the Notion page URL
function extractPageIdFromUrl(pageUrl: string): string {
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

// Get page ID with fallback to empty string
export const NOTION_PAGE_ID = process.env.NOTION_PAGE_URL 
    ? extractPageIdFromUrl(process.env.NOTION_PAGE_URL) 
    : '';

/**
 * Lists all child databases contained within NOTION_PAGE_ID
 * @returns {Promise<Array<{id: string, title: string}>>} - Array of database objects with id and title
 */
export async function getNotionDatabases() {
    if (!NOTION_PAGE_ID) {
        console.error("No Notion page ID available");
        return [];
    }

    // Array to store the child databases
    const childDatabases = [];

    try {
        // Query all child blocks in the specified page
        let hasMore = true;
        let startCursor: string | undefined = undefined;

        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: NOTION_PAGE_ID,
                start_cursor: startCursor,
            });

            // Process the results
            for (const block of response.results) {
                // Check if the block is a child database
                if (block.type === "child_database") {
                    const databaseId = block.id;

                    // Retrieve the database title
                    try {
                        const databaseInfo = await notion.databases.retrieve({
                            database_id: databaseId,
                        });

                        // Add the database to our list
                        childDatabases.push(databaseInfo);
                    } catch (error) {
                        console.error(`Error retrieving database ${databaseId}:`, error);
                    }
                }
            }

            // Check if there are more results to fetch
            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;
        }

        return childDatabases;
    } catch (error) {
        console.error("Error listing child databases:", error);
        throw error;
    }
}

// Find get a Notion database with the matching title
export async function findDatabaseByTitle(title: string) {
    if (!NOTION_PAGE_ID) {
        console.error("No Notion page ID available");
        return null;
    }
    
    const databases = await getNotionDatabases();

    for (const db of databases) {
        if (db.title && Array.isArray(db.title) && db.title.length > 0) {
            const dbTitle = db.title[0]?.plain_text?.toLowerCase() || "";
            if (dbTitle === title.toLowerCase()) {
                return db;
            }
        }
    }

    return null;
}

// Create a new database if one with a matching title does not exist
export async function createDatabaseIfNotExists(title: string, properties: any) {
    if (!NOTION_PAGE_ID) {
        console.error("No Notion page ID available");
        return null;
    }
    
    const existingDb = await findDatabaseByTitle(title);
    if (existingDb) {
        return existingDb;
    }
    
    return await notion.databases.create({
        parent: {
            type: "page_id",
            page_id: NOTION_PAGE_ID
        },
        title: [
            {
                type: "text",
                text: {
                    content: title
                }
            }
        ],
        properties
    });
}

// Example function to add a high score to the Notion leaderboard
export async function addHighScore(leaderboardDatabaseId: string, data: {
    playerName: string,
    score: number,
    waveReached: number,
    date?: Date
}) {
    if (!leaderboardDatabaseId) {
        console.error("No leaderboard database ID provided");
        return null;
    }
    
    try {
        return await notion.pages.create({
            parent: {
                database_id: leaderboardDatabaseId,
            },
            properties: {
                PlayerName: {
                    title: [
                        {
                            text: {
                                content: data.playerName
                            }
                        }
                    ]
                },
                Score: {
                    number: data.score
                },
                WaveReached: {
                    number: data.waveReached
                },
                Date: {
                    date: {
                        start: (data.date || new Date()).toISOString().split('T')[0]
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error adding high score to Notion:", error);
        return null;
    }
}

// Get top scores from the leaderboard
export async function getTopScores(leaderboardDatabaseId: string, limit = 10) {
    if (!leaderboardDatabaseId) {
        console.error("No leaderboard database ID provided");
        return [];
    }
    
    try {
        const response = await notion.databases.query({
            database_id: leaderboardDatabaseId,
            sorts: [
                {
                    property: "Score",
                    direction: "descending"
                }
            ],
            page_size: limit
        });

        return response.results.map((page: any) => {
            const properties = page.properties;
            
            return {
                id: page.id,
                playerName: properties.PlayerName?.title?.[0]?.plain_text || "Unknown Player",
                score: properties.Score?.number || 0,
                waveReached: properties.WaveReached?.number || 0,
                date: properties.Date?.date?.start || null
            };
        });
    } catch (error) {
        console.error("Error fetching top scores from Notion:", error);
        return [];
    }
}