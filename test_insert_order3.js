const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const dummyId = '11111111-2222-3333-4444-555555555555';
  const { data, error } = await supabase.from('pos_orders').insert({
    id: dummyId,
    status: 'cancelled',
    net_total: 0,
    total_amount: 0,
    order_number: 'DRAFT-' + dummyId.slice(0, 8)
  }).select();
  console.log(error || 'Success');
  if (!error) {
     await supabase.from('pos_orders').delete().eq('id', dummyId);
  }
}
run();
