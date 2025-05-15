import { Client } from "@notionhq/client";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variables validation
if (!process.env.NOTION_INTEGRATION_SECRET) {
    console.error("NOTION_INTEGRATION_SECRET is not defined. Please add it to your environment variables.");
    process.exit(1);
}

if (!process.env.NOTION_PAGE_URL) {
    console.error("NOTION_PAGE_URL is not defined. Please add it to your environment variables.");
    process.exit(1);
}

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET!,
});

// Extract the page ID from the Notion page URL
function extractPageIdFromUrl(pageUrl: string): string {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
        return match[1];
    }

    throw Error("Failed to extract page ID from URL: " + pageUrl);
}

const NOTION_PAGE_ID = extractPageIdFromUrl(process.env.NOTION_PAGE_URL!);
console.log(`Using Notion page ID: ${NOTION_PAGE_ID}`);

/**
 * Lists all child databases contained within NOTION_PAGE_ID
 */
async function getNotionDatabases() {
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
async function findDatabaseByTitle(title: string) {
    const databases = await getNotionDatabases();
    console.log(`Found ${databases.length} databases in Notion page`);

    for (const db of databases) {
        const dbTitle = db.title?.[0]?.plain_text?.toLowerCase() || "";
        console.log(`Checking database: ${dbTitle}`);
        if (dbTitle === title.toLowerCase()) {
            return db;
        }
    }

    console.log(`No database found with title: ${title}`);
    return null;
}

// Create a new database if one with a matching title does not exist
async function createDatabaseIfNotExists(title: string, properties: any) {
    console.log(`Checking if database '${title}' exists...`);
    const existingDb = await findDatabaseByTitle(title);
    if (existingDb) {
        console.log(`Database '${title}' already exists with ID: ${existingDb.id}`);
        return existingDb;
    }

    console.log(`Creating new database '${title}'...`);
    const newDb = await notion.databases.create({
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

    console.log(`Created new database '${title}' with ID: ${newDb.id}`);
    return newDb;
}

// Example function to setup databases for a leaderboard
async function setupNotionDatabases() {
    console.log("Setting up Notion databases...");

    const leaderboardDb = await createDatabaseIfNotExists("Leaderboard", {
        // Every database needs a Name/Title property
        PlayerName: {
            title: {}
        },
        Score: {
            number: {}
        },
        WaveReached: {
            number: {}
        },
        Date: {
            date: {}
        }
    });

    return { leaderboardDb };
}

async function createSampleData(databases: any) {
    try {
        console.log("Adding sample data...");
        const { leaderboardDb } = databases;

        if (!leaderboardDb) {
            throw new Error("Could not find the Leaderboard database.");
        }

        // Sample leaderboard data
        const leaderboardEntries = [
            {
                playerName: "ZombieSlayer",
                score: 25000,
                waveReached: 15
            },
            {
                playerName: "TowerMaster",
                score: 18500,
                waveReached: 12
            },
            {
                playerName: "Defender99",
                score: 15200,
                waveReached: 10
            },
            {
                playerName: "UndeadHunter",
                score: 12800,
                waveReached: 8
            },
            {
                playerName: "StrategyKing",
                score: 10500,
                waveReached: 7
            }
        ];

        for (let entry of leaderboardEntries) {
            console.log(`Adding leaderboard entry for ${entry.playerName}...`);
            await notion.pages.create({
                parent: {
                    database_id: leaderboardDb.id
                },
                properties: {
                    PlayerName: {
                        title: [
                            {
                                text: {
                                    content: entry.playerName
                                }
                            }
                        ]
                    },
                    Score: {
                        number: entry.score
                    },
                    WaveReached: {
                        number: entry.waveReached
                    },
                    Date: {
                        date: {
                            start: new Date().toISOString()
                        }
                    }
                }
            });
        }

        console.log("Sample data creation complete.");
    } catch (error) {
        console.error("Error creating sample data:", error);
    }
}

// Main function to run the setup
async function main() {
    try {
        const databases = await setupNotionDatabases();
        await createSampleData(databases);
        console.log("Notion setup complete!");
    } catch (error) {
        console.error("Error during Notion setup:", error);
    }
}

// Execute the main function
main();