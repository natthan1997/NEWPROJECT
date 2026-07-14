const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: cols } = await supabase.from('pos_orders').select('*').eq('id', '606c82ab-5097-48ed-9d36-6376c0b344ee').single();
  
  // Did stripe webhook run?
  const { data: pay } = await supabase.from('pos_order_payments').select('*').eq('order_id', cols.id);
  console.log("Payments for order DEL#260714-8316:");
  console.log(pay);
}

main();
