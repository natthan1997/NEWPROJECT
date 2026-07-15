const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: order } = await supabase.from('pos_orders').select('*').eq('order_number', 'DEL#260714-3127').single();
  console.log("Order 3127:");
  console.log(order);
  
  if (order) {
    const { data: pay } = await supabase.from('pos_order_payments').select('*').eq('order_id', order.id);
    console.log("Payments:");
    console.log(pay);
    
    const { data: hist } = await supabase.from('pos_points_history').select('*').eq('order_id', order.id);
    console.log("History:");
    console.log(hist);
  }
}

main();
