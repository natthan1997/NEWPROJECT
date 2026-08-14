const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('Connected to database.');
    
    const query = `ALTER TABLE "public"."pos_loyalty_coupons" ADD COLUMN IF NOT EXISTS "is_birthday_only" BOOLEAN DEFAULT false;`;
    
    await client.query(query);
    console.log('Migration applied successfully.');
    
  } catch (err) {
    console.error('Error applying migration:', err);
  } finally {
    await client.end();
  }
}

runMigration();
