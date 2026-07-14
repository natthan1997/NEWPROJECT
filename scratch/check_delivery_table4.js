const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: hist } = await supabase.from('pos_points_history').select('*').eq('order_id', '3ed00be1-9cb4-4cbe-bdf9-fc0da42cf106');
  console.log("History for order DEL#260714-8043 AFTER manual insert:");
  console.log(hist);
}

main();
