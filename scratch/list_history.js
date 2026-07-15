const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const memberId = '36884b18-ed44-463e-8e19-c52aa9a0b8dc';
  const { data: hist } = await supabase.from('pos_points_history')
    .select('id, points_change, description, created_at, order_id')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(10);
  console.log(hist);
}

main();
