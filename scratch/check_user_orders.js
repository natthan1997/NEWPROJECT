const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: latestLiffOrder } = await supabase.from('pos_orders')
    .select('id, order_number, net_total, delivery_fee, order_source, points_earned, status, created_at, customer_id, line_user_id')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log("Recent Orders:");
  console.log(latestLiffOrder);
  
  const { data: hist } = await supabase.from('pos_points_history').select('*').in('order_id', latestLiffOrder.map(o => o.id));
  console.log("History for recent orders:");
  console.log(hist);
}

main();
