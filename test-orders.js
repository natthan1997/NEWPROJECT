const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: orders } = await supabase.from('pos_orders').select('*').order('created_at', { ascending: false }).limit(3);
  console.log('Orders:', orders.map(o => ({ id: o.id, status: o.status, table_id: o.table_id })));
  
  if (orders.length > 0) {
    const { data: items } = await supabase.from('pos_order_items').select('*').in('order_id', orders.map(o => o.id));
    console.log('Items:', items.map(i => ({ id: i.id, order_id: i.order_id, status: i.status })));
  }
}
run();
