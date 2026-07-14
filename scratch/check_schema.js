const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.rpc('query_schema');
  
  if (error) {
    console.error("RPC failed, querying information_schema manually...");
    const { data: qData, error: qErr } = await supabase
      .from('pos_points_history')
      .select('member_id')
      .limit(1);
    console.log(qErr || "Type is ok");
  }
}

main();
