const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: orderData } = await supabase
      .from('pos_orders')
      .select('customer_id, customer_name, points_earned')
      .eq('id', '3d43036f-6e54-4b17-8ea1-65e8ae2aaace')
      .maybeSingle();
  console.log('Order:', orderData);
}
check();
