const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: hist } = await supabase
    .from('pos_points_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  console.log("Latest points history:");
  console.log(JSON.stringify(hist, null, 2));

  const { data: orders } = await supabase
    .from('pos_orders')
    .select('id, order_number, net_total, total_amount, delivery_fee, created_at, points_earned')
    .order('created_at', { ascending: false })
    .limit(3);
  
  console.log("\nLatest orders:");
  console.log(JSON.stringify(orders, null, 2));
}

main();
