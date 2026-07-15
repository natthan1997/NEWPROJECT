const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabase.rpc('query', {
    query_text: "SELECT policyname, roles, cmd, qual FROM pg_policies WHERE tablename = 'pos_points_history';"
  });
  console.log("Result:", data, error);
}

main();
