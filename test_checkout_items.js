const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const dummyId = '11111111-2222-3333-4444-555555555555';
  
  // 1. Get a real item id
  const { data: item } = await supabase.from('pos_menu_items').select('id').limit(1).single();
  
  // 2. Insert dummy order
  await supabase.from('pos_orders').upsert({
    id: dummyId,
    status: 'cancelled',
    net_total: 0,
    total_amount: 0,
    order_number: 'DRAFT-' + dummyId.slice(0, 8)
  });

  // 3. Update with RPC
  const payload = {
    order_action: 'update',
    order_id: dummyId,
    order: {
      order_number: 'TEST-ITEMS',
      status: 'pending',
      total_amount: 100,
      net_total: 100,
      order_type: 'takeaway',
    },
    order_items: [
      {
        item_id: item.id,
        quantity: 1,
        unit_price: 100,
        subtotal: 100,
      }
    ]
  };

  const { data, error } = await supabase.rpc('pos_checkout_order', { payload });
  console.log('RPC Result:', error || data);
  
  // 4. Verify items were inserted
  const { data: items, error: itemsErr } = await supabase.from('pos_order_items').select('*').eq('order_id', dummyId);
  console.log('Items inserted:', itemsErr || items);
  
  // Cleanup
  await supabase.from('pos_order_items').delete().eq('order_id', dummyId);
  await supabase.from('pos_orders').delete().eq('id', dummyId);
}
run();
