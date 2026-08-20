const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const payloadInsert = {
    order_action: 'insert',
    order: {
      order_number: 'TEST-1234',
      status: 'payment_pending',
      payment_method: 'cash',
      total_amount: 100,
      net_total: 100,
      tax_amount: 0,
      service_charge_amount: 0,
      discount_amount: 0,
      order_type: 'dine_in'
    },
    order_items: [],
    payments: [{
      payment_method: 'cash',
      amount: 50,
      status: 'paid'
    }]
  };

  const { data: insertData, error: insertError } = await supabase.rpc('pos_checkout_order', { payload: payloadInsert });
  
  if (insertError) {
    console.error('Insert Error:', insertError);
    return;
  }
  
  console.log('Insert Success:', insertData);
  const orderId = insertData.order_id;

  const payloadUpdate = {
    order_action: 'update',
    order_id: orderId,
    order: {
      status: 'payment_pending',
      payment_method: 'cash',
      total_amount: 100,
      net_total: 100,
      tax_amount: 0,
      service_charge_amount: 0,
      discount_amount: 0,
      order_type: 'dine_in'
    },
    order_items: [],
    payments: [{
      payment_method: 'promptpay',
      amount: 50,
      status: 'paid'
    }]
  };

  const { data: updateData, error: updateError } = await supabase.rpc('pos_checkout_order', { payload: payloadUpdate });

  if (updateError) {
    console.error('Update Error:', updateError);
  } else {
    console.log('Update Success:', updateData);
  }
}

run();
