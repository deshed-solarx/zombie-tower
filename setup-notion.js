// Setup script for Notion integration
// To run: node setup-notion.js
require('dotenv').config();
const { Client } = require('@notionhq/client');

// Validate environment variables
if (!process.env.NOTION_INTEGRATION_SECRET) {
  console.error('❌ NOTION_INTEGRATION_SECRET is not defined.');
  console.log('Please set up a Notion integration:');
  console.log('1. Go to https://www.notion.so/my-integrations');
  console.log('2. Create a new integration with the name "Zombie Tower Defense"');
  console.log('3. Copy the "Internal Integration Secret"');
  console.log('4. Set it as NOTION_INTEGRATION_SECRET in your environment');
  process.exit(1);
}

if (!process.env.NOTION_PAGE_URL) {
  console.error('❌ NOTION_PAGE_URL is not defined.');
  console.log('Please provide a Notion page URL:');
  console.log('1. Create a new page in Notion or use an existing one');
  console.log('2. Share this page with your integration (click "..." in the top right of the page, then "Add connections", find your integration)');
  console.log('3. Copy the page URL');
  console.log('4. Set it as NOTION_PAGE_URL in your environment');
  process.exit(1);
}

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_INTEGRATION_SECRET,
});

// Extract the page ID from the Notion page URL
function extractPageIdFromUrl(pageUrl) {
  const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error('Failed to extract page ID from URL: ' + pageUrl);
}

const NOTION_PAGE_ID = extractPageIdFromUrl(process.env.NOTION_PAGE_URL);
console.log(`✅ Using Notion page ID: ${NOTION_PAGE_ID}`);

// Function to list existing databases
async function listDatabases() {
  try {
    // Query all child blocks in the specified page
    const response = await notion.blocks.children.list({
      block_id: NOTION_PAGE_ID,
    });

    // Find child databases
    const databases = [];
    for (const block of response.results) {
      if (block.type === 'child_database') {
        const databaseInfo = await notion.databases.retrieve({
          database_id: block.id,
        });
        databases.push({
          id: block.id,
          title: databaseInfo.title[0]?.plain_text || 'Untitled Database',
        });
      }
    }

    return databases;
  } catch (error) {
    console.error('❌ Error listing databases:', error);
    throw error;
  }
}

// Function to create a database if it doesn't exist
async function createDatabaseIfNotExists(title, properties) {
  try {
    // Check if the database already exists
    const databases = await listDatabases();
    const existingDb = databases.find(db => 
      db.title.toLowerCase() === title.toLowerCase()
    );

    if (existingDb) {
      console.log(`✅ Database "${title}" already exists with ID: ${existingDb.id}`);
      return existingDb.id;
    }

    // Create a new database
    console.log(`📝 Creating database "${title}"...`);
    const response = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: NOTION_PAGE_ID,
      },
      title: [
        {
          type: 'text',
          text: {
            content: title,
          },
        },
      ],
      properties,
    });

    console.log(`✅ Created database "${title}" with ID: ${response.id}`);
    return response.id;
  } catch (error) {
    console.error(`❌ Error creating "${title}" database:`, error);
    throw error;
  }
}

// Create sample data
async function createSampleData(databaseId) {
  try {
    console.log('📝 Adding sample leaderboard entries...');
    
    // Sample data
    const entries = [
      { name: 'ZombieSlayer', score: 25000, wave: 15 },
      { name: 'TowerMaster', score: 18500, wave: 12 },
      { name: 'Defender99', score: 15200, wave: 10 },
      { name: 'UndeadHunter', score: 12800, wave: 8 },
      { name: 'StrategyKing', score: 10500, wave: 7 },
    ];
    
    for (const entry of entries) {
      await notion.pages.create({
        parent: {
          database_id: databaseId,
        },
        properties: {
          PlayerName: {
            title: [
              {
                text: {
                  content: entry.name,
                },
              },
            ],
          },
          Score: {
            number: entry.score,
          },
          WaveReached: {
            number: entry.wave,
          },
          Date: {
            date: {
              start: new Date().toISOString(),
            },
          },
        },
      });
      console.log(`✅ Added leaderboard entry for ${entry.name}`);
    }
    
    console.log('✅ Sample data creation complete');
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Setting up Notion integration...');
    
    // Create leaderboard database
    const leaderboardDatabaseId = await createDatabaseIfNotExists('Leaderboard', {
      PlayerName: {
        title: {},
      },
      Score: {
        number: {},
      },
      WaveReached: {
        number: {},
      },
      Date: {
        date: {},
      },
    });
    
    // Add sample data
    await createSampleData(leaderboardDatabaseId);
    
    console.log('\n✅ Notion setup complete!');
    console.log('Make sure to use the following environment variables in your Vercel deployment:');
    console.log(`NOTION_INTEGRATION_SECRET=${process.env.NOTION_INTEGRATION_SECRET}`);
    console.log(`NOTION_PAGE_URL=${process.env.NOTION_PAGE_URL}`);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
main();