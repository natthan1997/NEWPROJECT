const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: "SELECT conname FROM pg_constraint WHERE conrelid = 'pos_qr_reward_tokens'::regclass" });
  console.log(data, error);
}
run();
