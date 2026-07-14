const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: hist } = await supabase.from('pos_points_history').select('*').eq('order_id', '606c82ab-5097-48ed-9d36-6376c0b344ee');
  console.log("History for order DEL#260714-8316:");
  console.log(hist);
}

main();
