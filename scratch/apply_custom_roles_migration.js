const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '../migrations/20260801000000_add_custom_roles_to_pos_settings.sql'), 'utf-8');
  
  // Use postgres directly if we have a connection string, or via an RPC endpoint if available.
  // Since we might not have direct pg access here in scratch script, let's just make the changes via JS logic
  // if SQL fails or we don't have an RPC for raw queries.
  // Actually, Supabase doesn't have a public RPC for raw SQL by default. 
  // Let's just update the schema using the Supabase Dashboard SQL editor, or write a script to use pg.
  console.log('Skipping SQL execution via JS, will run pg via node if POSTGRES_URL is available, else we will modify existing records manually.');
  
  const pgUrl = process.env.POSTGRES_URL;
  if (pgUrl) {
    const { Client } = require('pg');
    const client = new Client({ connectionString: pgUrl });
    await client.connect();
    await client.query(sql);
    await client.end();
    console.log('Migration applied via pg');
  } else {
    console.log('No POSTGRES_URL. Let me print instructions.');
  }
}
run();
