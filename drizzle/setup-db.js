// A simple script to set up database tables directly using SQL
import postgres from 'postgres';

async function setupDatabase() {
  console.log('Setting up database tables...');
  
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    
    console.log('Connecting to database...');
    const sql = postgres(DATABASE_URL);
    
    console.log('Creating players table...');
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        player_id TEXT NOT NULL UNIQUE,
        display_name TEXT,
        coins INTEGER DEFAULT 0,
        perm_upgrades JSONB DEFAULT '{}' NOT NULL,
        last_seen TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `;
    
    console.log('Database setup complete!');
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();