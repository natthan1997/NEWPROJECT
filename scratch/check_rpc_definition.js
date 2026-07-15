const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: rpc } = await supabase.rpc('query_sql', {
    sql: "SELECT prosrc FROM pg_proc WHERE proname = 'increment_member_points';"
  });
  console.log("RPC increment_member_points source:");
  console.log(rpc);
}

main();
