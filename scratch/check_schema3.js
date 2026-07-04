const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  "https://cdjbzyrflzckjgxbqjqb.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.rpc('get_schema', { table_name: 'pos_points_history' });
  console.log("Schema result:", data, error);
}
check();
