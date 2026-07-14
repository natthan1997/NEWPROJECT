const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: cols } = await supabase.from('pos_orders').select('*').eq('id', '3ed00be1-9cb4-4cbe-bdf9-fc0da42cf106').single();
  // wait, earlier we saw points_earned in pos_orders is 0 for DEL#260714-8043.
  // DeliveryManager does not update pos_orders.points_earned!
  // It only updates pos_points_history.
}

main();
