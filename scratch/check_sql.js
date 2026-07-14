const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // Check function definition
  const { data: funcData, error: funcError } = await supabase.rpc('increment_member_points', { user_id: 'test', points_to_add: 0 });
  console.log("RPC Test Error (if any):", funcError?.message);

  // Check policies
  const { data, error } = await supabase.from('pos_points_history').select('*').limit(1);
  console.log("Select Error (if any):", error?.message);
}

main();
