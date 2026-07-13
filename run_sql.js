const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  // Can't run raw SQL easily without psql or an RPC that accepts raw SQL.
  // Let's see if we have `psql` connection string in .env.local
  const env = fs.readFileSync('.env.local', 'utf-8');
  console.log(env.includes('DATABASE_URL'));
}
run();
