const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: cols } = await supabase.from('pos_orders').select('*').eq('id', 'fb61ab13-c3c7-4c25-84ed-f33d9ca3aee6').single();
  console.log("points_earned on pos_orders:", cols.points_earned);
  
  // Did stripe webhook run?
  const { data: pay } = await supabase.from('pos_order_payments').select('*').eq('order_id', cols.id);
  console.log("Payments for order DEL#260714-3127:");
  console.log(pay);
}

main();
