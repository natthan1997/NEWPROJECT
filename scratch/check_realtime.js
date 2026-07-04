const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFileLocal = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFileLocal.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const supabase = createClient(
  'https://cdjbzyrflzckjgxbqxqb.supabase.co', // extracted from JWT issuer earlier or standard URL structure
  env['SUPABASE_SERVICE_ROLE_KEY']
);

async function check() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: 'SELECT * FROM pg_publication_tables;' });
  // Since we might not have execute_sql, let's just create a quick server function or use REST to see
  console.log(data || error);
}

check();
