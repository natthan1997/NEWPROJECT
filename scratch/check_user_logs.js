const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: cols } = await supabase.from('pos_orders').select('*').eq('id', '3ed00be1-9cb4-4cbe-bdf9-fc0da42cf106').single();
  console.log("Did points increment on order finish?");
  console.log("points_earned on order:", cols.points_earned);
  
  // Did stripe webhook run?
  const { data: pay } = await supabase.from('pos_order_payments').select('*').eq('order_id', cols.id);
  console.log("Payments for order:", pay);
  
  // Wait, I already checked this. DeliveryManager gives points manually using pos_points_history.
  // DeliveryManager DOES NOT update `points_earned` on pos_orders!
}

main();
