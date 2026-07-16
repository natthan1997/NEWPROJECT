const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testQuery() {
  const { data: order, error } = await supabase
      .from('pos_orders')
      .select('*, pos_order_items(*, item:pos_menu_items!item_id(*)), pos_order_payments(amount, payment_method, status), customer:pos_members!customer_id(display_name, full_name, phone)')
      .limit(1)
      .maybeSingle();

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success! Found order:", order?.id);
  }
}

testQuery();
