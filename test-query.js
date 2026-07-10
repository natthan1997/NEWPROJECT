const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from('pos_order_items')
    .select('item_id, quantity, pos_orders!inner(status)')
    .gte('created_at', startOfMonth.toISOString())
    .neq('pos_orders.status', 'cancelled')
    .neq('pos_orders.status', 'void')
    .order('created_at', { ascending: false })
    .limit(10);
  console.log(error ? error : data);
}
test();
