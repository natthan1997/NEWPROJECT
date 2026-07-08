const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n');
let supabaseUrl = 'https://cdjbzyrflzckjgxbqjqb.supabase.co';
let supabaseKey = '';
env.forEach(line => {
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].replace(/"/g, '').trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('run_sql', { sql: `ALTER TABLE pos_loyalty_titles ADD COLUMN IF NOT EXISTS benefits TEXT;`});
  console.log('Result:', data, error);
}
run();
