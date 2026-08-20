const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const payload = {
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

  console.log('Calling pos_checkout_order...');
  const { data, error } = await supabase.rpc('pos_checkout_order', { payload });
  
  if (error) {
    console.error('Error returned:', error);
  } else {
    console.log('Success:', data);
  }
}

run();
