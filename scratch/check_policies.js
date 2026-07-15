const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: policies } = await supabase.rpc('query_sql', {
    sql: "SELECT policyname, roles, cmd, qual FROM pg_policies WHERE tablename = 'pos_shop_settings';"
  });
  console.log("Policies on pos_shop_settings:");
  console.log(policies);
}

main();
