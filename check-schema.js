const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: o } = await supabase.from('pos_orders').select('*').limit(1);
  const { data: i } = await supabase.from('pos_order_items').select('*').limit(1);
  console.log('pos_orders columns:', o ? Object.keys(o[0] || {}) : 'none');
  console.log('pos_order_items columns:', i ? Object.keys(i[0] || {}) : 'none');
}
run();
