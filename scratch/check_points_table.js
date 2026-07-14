const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: cols } = await supabase.rpc('query_schema'); // Just fetch all points history rows again with precise query
  const { data: hist } = await supabase
    .from('pos_points_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log("Recent history:")
  console.log(JSON.stringify(hist, null, 2));
}

main();
