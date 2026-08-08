const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL="([^"]+)"/)[1];
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('pos_members').select('*').limit(5);
  console.log(data ? Object.keys(data[0]) : error);
}
run();
