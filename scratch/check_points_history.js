const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: hist } = await supabase
    .from('pos_points_history')
    .select('*')
    .eq('member_id', '36884b18-ed44-463e-8e19-c52aa9a0b8dc')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log("History for customer:");
  console.log(JSON.stringify(hist, null, 2));
}

main();
