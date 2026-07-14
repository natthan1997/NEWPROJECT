const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: order, error } = await supabase
    .from('pos_orders')
    .select('*')
    .eq('id', '081b2ce5-20a3-4c72-99ac-96194e68e58e')
    .single();
  
  console.log("Order DEL#260714-9487:", JSON.stringify(order, null, 2));
}

main();
