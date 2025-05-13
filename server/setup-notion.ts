import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists, findDatabaseByTitle } from "./notion";

// Environment variables validation
if (!process.env.NOTION_INTEGRATION_SECRET) {
    console.log("NOTION_INTEGRATION_SECRET is not defined. Please add it to your environment variables.");
    process.exit(1);
}

if (!process.env.NOTION_PAGE_URL) {
    console.log("NOTION_PAGE_URL is not defined. Please add it to your environment variables.");
    process.exit(1);
}

// Setup databases for the zombie tower defense game
async function setupNotionDatabases() {
    console.log("Setting up Notion databases...");
    
    // Create the Leaderboard database if it doesn't exist
    const leaderboardDb = await createDatabaseIfNotExists("Zombie Defense Leaderboard", {
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
    
    if (leaderboardDb) {
        console.log(`✅ Leaderboard database created/found with ID: ${leaderboardDb.id}`);
    }
    
    // Create the Game Tips database if it doesn't exist
    const tipsDb = await createDatabaseIfNotExists("Game Tips", {
        Tip: {
            title: {}
        },
        Category: {
            select: {
                options: [
                    { name: "Defense", color: "blue" },
                    { name: "Economy", color: "green" },
                    { name: "Upgrades", color: "purple" },
                    { name: "General", color: "gray" }
                ]
            }
        },
        Difficulty: {
            select: {
                options: [
                    { name: "Beginner", color: "green" },
                    { name: "Intermediate", color: "yellow" },
                    { name: "Advanced", color: "red" }
                ]
            }
        }
    });
    
    if (tipsDb) {
        console.log(`✅ Game Tips database created/found with ID: ${tipsDb.id}`);
    }

    return {
        leaderboardDb,
        tipsDb
    };
}

// Add some sample data to demonstrate functionality
async function createSampleData(databases: any) {
    if (!databases.leaderboardDb || !databases.tipsDb) {
        console.log("One or more databases not found, skipping sample data creation");
        return;
    }

    // Sample leaderboard entries
    const leaderboardEntries = [
        { playerName: "ZombieSlayer123", score: 2500, waveReached: 15 },
        { playerName: "TowerMaster", score: 3100, waveReached: 18 },
        { playerName: "DefenseKing", score: 1800, waveReached: 10 }
    ];
    
    // Sample game tips
    const gameTips = [
        { 
            tip: "Focus on upgrading your tower's rate of fire first",
            category: "Upgrades",
            difficulty: "Beginner"
        },
        { 
            tip: "Place your tower in the center for maximum coverage",
            category: "Defense",
            difficulty: "Beginner"
        },
        { 
            tip: "Save your special abilities for wave bosses",
            category: "Advanced",
            difficulty: "Intermediate"
        }
    ];
    
    // Add leaderboard entries
    console.log("Adding sample leaderboard entries...");
    for (const entry of leaderboardEntries) {
        try {
            await notion.pages.create({
                parent: {
                    database_id: databases.leaderboardDb.id
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
                            start: new Date().toISOString().split('T')[0]
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Error adding leaderboard entry:", error);
        }
    }
    
    // Add game tips
    console.log("Adding sample game tips...");
    for (const tip of gameTips) {
        try {
            await notion.pages.create({
                parent: {
                    database_id: databases.tipsDb.id
                },
                properties: {
                    Tip: {
                        title: [
                            {
                                text: {
                                    content: tip.tip
                                }
                            }
                        ]
                    },
                    Category: {
                        select: {
                            name: tip.category
                        }
                    },
                    Difficulty: {
                        select: {
                            name: tip.difficulty
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Error adding game tip:", error);
        }
    }
    
    console.log("✅ Sample data created successfully");
}

// Main function to run the setup
async function main() {
    try {
        console.log("Starting Notion setup process...");
        const databases = await setupNotionDatabases();
        
        // Ask if user wants to add sample data via console
        console.log("Do you want to add sample data? (y/n)");
        console.log("Adding sample data automatically...");
        
        // Add sample data
        await createSampleData(databases);
        
        console.log("Notion setup complete! 🎉");
        process.exit(0);
    } catch (error) {
        console.error("Error during Notion setup:", error);
        process.exit(1);
    }
}

// Run the main function
main();