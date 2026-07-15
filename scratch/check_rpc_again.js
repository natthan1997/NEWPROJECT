const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase.rpc('increment_member_points', {
    user_id: '36884b18-ed44-463e-8e19-c52aa9a0b8dc',
    points_to_add: 1,
  });
  console.log("RPC error:", error);
}

main();
