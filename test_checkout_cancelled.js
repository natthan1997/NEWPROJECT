const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const dummyId = '11111111-2222-3333-4444-555555555555';
  
  // 1. insert cancelled order
  await supabase.from('pos_orders').insert({
    id: dummyId,
    status: 'cancelled',
    net_total: 0,
    total_amount: 0,
    order_number: 'DRAFT-' + dummyId.slice(0, 8)
  });

  // 2. run pos_checkout_order using this id
  const payload = {
    order_action: 'update',
    order_id: dummyId,
    order: {
      order_number: 'TEST-1234',
      status: 'pending',
      total_amount: 100,
      net_total: 100,
      tax_amount: 0,
      service_charge_amount: 0,
      discount_amount: 0,
      order_type: 'takeaway',
      queue_number: 1,
      order_source: 'pos'
    },
    order_items: []
  };

  const { data, error } = await supabase.rpc('pos_checkout_order', { payload });
  console.log(error || data);
  
  await supabase.from('pos_orders').delete().eq('id', dummyId);
}
run();
