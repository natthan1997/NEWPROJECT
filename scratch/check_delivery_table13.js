const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: cols } = await supabase.from('pos_orders').select('*').eq('id', '606c82ab-5097-48ed-9d36-6376c0b344ee').single();
  // We verified it doesn't give points. Let's see if the points logic would give points for this order.
  const deliveryFee = cols.delivery_fee || 0;
  const totalAmount = (cols.net_total || cols.total_amount || 0) - deliveryFee;
  console.log("delivery_fee:", deliveryFee);
  console.log("totalAmount for points:", totalAmount);
}

main();
