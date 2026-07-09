const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({path: './.env.local'});
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('pos_orders')
    .select('id, order_number, table_number, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) {
    console.error("Error fetching orders:", error);
  } else {
    console.log("Last 10 orders:", JSON.stringify(data, null, 2));
  }
}
run();
