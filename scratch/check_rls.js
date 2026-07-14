const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: policies, error } = await supabase.rpc('query_policies');
  
  if (error) {
    console.error("RPC failed, querying pg_policies manually...");
    // Fallback to querying via rest if we can't use rpc
    const { data: qData, error: qErr } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'pos_points_history');
    console.log(qData);
  } else {
    console.log(policies);
  }
}

main();
