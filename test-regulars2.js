const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data } = await supabase.from('pos_orders').select('net_total, items').not('items', 'is', null).limit(10);
  for (const row of data) {
    if (row.items && row.items.length > 0) {
      console.log(JSON.stringify(row.items[0], null, 2));
      break;
    }
  }
}
run();
