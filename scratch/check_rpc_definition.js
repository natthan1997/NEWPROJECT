const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.rpc('query_increment_points');
  if (error) {
    console.error("RPC failed, querying routines manually...");
    const { data: qData, error: qErr } = await supabase
      .from('pg_proc')
      .select('proname, prosrc')
      .eq('proname', 'increment_member_points');
    console.log(qData);
  }
}

main();
