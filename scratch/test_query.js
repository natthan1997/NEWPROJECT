const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Env variables missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Fetch one order ID
  const { data: orders } = await supabase
    .from('pos_orders')
    .select('id')
    .limit(1);

  if (!orders || orders.length === 0) {
    console.log('No orders in database');
    return;
  }

  const orderId = orders[0].id;
  console.log('Testing query on order:', orderId);

  const { data: order, error } = await supabase
    .from('pos_orders')
    .select('*, pos_order_items(*, item:pos_menu_items!item_id(*)), pos_order_payments(amount, payment_method, status), customer:pos_members!customer_id(display_name, full_name, phone)')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    console.error('QUERY FAILED WITH ERROR:', error);
  } else {
    console.log('QUERY SUCCEEDED! Order data keys:', Object.keys(order));
    console.log('Items length:', order.pos_order_items?.length);
    console.log('Payments length:', order.pos_order_payments?.length);
    console.log('Customer:', order.customer);
  }
}

run();
