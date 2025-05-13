import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// This script will create the database tables based on the schema
async function main() {
  console.log('Starting database migration...');
  
  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    
    console.log('Connecting to database...');
    const connection = postgres(DATABASE_URL);
    const db = drizzle(connection);
    
    console.log('Running migrations...');
    // Run migrations
    await migrate(db, { migrationsFolder: 'drizzle/migrations' });
    
    console.log('Migrations complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();