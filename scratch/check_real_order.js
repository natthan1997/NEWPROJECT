const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: latestOrder } = await supabase.from('pos_orders').select('*').eq('order_number', 'DEL#260714-8043').single();
  console.log("Latest user order:", latestOrder.id, latestOrder.order_number, latestOrder.customer_id, latestOrder.line_user_id, latestOrder.order_source);
}

main();
