const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const res1 = await supabase.rpc('execute_sql', { sql: "SELECT data_type FROM information_schema.columns WHERE table_name = 'pos_qr_reward_tokens' AND column_name = 'order_id'" });
  console.log(res1);
}
run();
