const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.development.local', 'utf8').split('\n');
let supabaseUrl = 'https://cdjbzyrflzckjgxbqjqb.supabase.co';
let supabaseKey = '';
env.forEach(line => {
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].replace(/["\s\\]/g, '').replace('rn', '');
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function reload() {
    const { error } = await supabase.rpc('run_sql', { sql: "NOTIFY pgrst, 'reload schema';" });
    console.log('Error:', error);
}
reload();
