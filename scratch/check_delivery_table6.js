const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: cols } = await supabase.from('pos_orders').select('*').eq('order_number', 'DEL#260714-8043').single();
  console.log("Check points_earned again:", cols.points_earned);
  
  // Did we insert manually via admin dashboard in recent hours?
  const { data: hist } = await supabase.from('pos_points_history').select('*').eq('order_id', cols.id);
  console.log("History:");
  console.log(hist);
}

main();
