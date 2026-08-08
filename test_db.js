const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%coupon%'" });
  console.log('RPC execute_sql error:', error);
  
  if (error) {
     // alternative way to find tables if RPC doesn't exist
     // just fetch 1 row from a guessed table name
     const tablesToTry = ['pos_coupons', 'pos_member_coupons', 'pos_rewards', 'pos_member_rewards'];
     for (const t of tablesToTry) {
        const { error: err } = await supabase.from(t).select('*').limit(1);
        console.log(t, err ? err.message : 'EXISTS');
     }
  }
}
run();
