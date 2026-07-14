const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: latestLiffOrder } = await supabase.from('pos_orders')
    .select('id, order_number, net_total, delivery_fee, order_source, points_earned, status, created_at, customer_id, line_user_id, total_amount')
    .eq('id', '606c82ab-5097-48ed-9d36-6376c0b344ee')
    .single();
  console.log("Order DEL#260714-8316 net_total/total_amount:", latestLiffOrder.net_total, latestLiffOrder.total_amount);
  
  // Did stripe webhook trigger?
  const { data: hist } = await supabase.from('pos_points_history').select('*').eq('order_id', latestLiffOrder.id);
  console.log("History for 8316:", hist);
  
  // Check if member points incremented
  const { data: member } = await supabase.from('pos_members').select('points').eq('id', latestLiffOrder.customer_id).single();
  console.log("Member points:", member.points);
}

main();
